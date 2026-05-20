"""
Export epoch141.ckpt → skinet_unet.onnx

Usage:
    cd repos/SkiNet
    python export_onnx.py --ckpt ios_model.ckpt --out ios_onnx.onnx --config ios_config.yaml --opset 17
"""

import argparse
import os
# Both fixes are needed: LOGNAME satisfies getpass.getuser() (called from multiple torch.compile
# internals); TORCHINDUCTOR_CACHE_DIR covers the inductor path that fires before getuser().
os.environ.setdefault("LOGNAME", "user")
os.environ.setdefault("TORCHINDUCTOR_CACHE_DIR", "/tmp/torchinductor_cache")

import torch
import torch.nn as nn
from pathlib import Path

from SkiNet.ML.configs.load_config_from_yaml import load_config_from_yaml
from SkiNet.ML.model.lightning_model import build_lightning_model

INPUT_SIZE = 512  # must be divisible by 2^(num_layers-1) = 16


class _UNetWithSigmoid(nn.Module):
    """Wraps the UNet backbone so the ONNX graph outputs probabilities, not logits."""

    def __init__(self, backbone: nn.Module) -> None:
        super().__init__()
        self.backbone = backbone

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return torch.sigmoid(self.backbone(x))


def _unwrap_compiled(model: nn.Module) -> nn.Module:
    """Strip torch.compile wrapper if present (training used use_torch_compile=True)."""
    return getattr(model, "_orig_mod", model)


def export(ckpt_path: Path, out_path: Path, config_path: Path, opset: int = 17) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading config from {config_path} …")
    config = load_config_from_yaml(config_path)

    print(f"Building model architecture …")
    config.trainconfig.use_torch_compile = False  # not needed for export, avoids env issues
    lightning_model = build_lightning_model(config)

    print(f"Loading checkpoint: {ckpt_path} …")
    ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False)
    # Checkpoint was saved with torch.compile active, so keys are prefixed "model._orig_mod.*".
    # Strip the extra prefix so they match the uncompiled model we built for export.
    state_dict = {k.replace("model._orig_mod.", "model."): v for k, v in ckpt["state_dict"].items()}
    lightning_model.load_state_dict(state_dict)
    lightning_model.eval()

    # Report the optimal threshold stored in the checkpoint so the iOS app can use it
    threshold = lightning_model.optimal_threshold.item()
    print(f"Optimal sigmoid threshold from checkpoint: {threshold:.4f}")
    print("  → Hard-code this value as SEGMENTATION_THRESHOLD in your iOS app's ml/modelRunner.ts")

    backbone = _unwrap_compiled(lightning_model.model)
    export_model = _UNetWithSigmoid(backbone)
    export_model.eval()

    dummy = torch.zeros(1, 3, INPUT_SIZE, INPUT_SIZE)

    print(f"Exporting to ONNX (opset {opset}) → {out_path} …")
    torch.onnx.export(
        export_model,
        dummy,
        str(out_path),
        opset_version=opset,
        input_names=["image"],
        output_names=["mask_prob"],
        dynamic_axes={"image": {0: "batch"}, "mask_prob": {0: "batch"}},
        do_constant_folding=True,
    )
    print("Export complete.")

    # Quick validation with onnxruntime if available
    try:
        import onnxruntime as ort
        import numpy as np

        sess = ort.InferenceSession(str(out_path), providers=["CPUExecutionProvider"])
        dummy_np = np.zeros((1, 3, INPUT_SIZE, INPUT_SIZE), dtype=np.float32)
        output = sess.run(["mask_prob"], {"image": dummy_np})[0]
        assert output.shape == (1, 1, INPUT_SIZE, INPUT_SIZE), f"Unexpected output shape: {output.shape}"
        print(f"ONNXRuntime validation passed — output shape: {output.shape}")
    except ImportError:
        print("onnxruntime not installed — skipping validation (pip install onnxruntime to enable)")

    size_mb = out_path.stat().st_size / 1024 / 1024
    print(f"\nModel size: {size_mb:.1f} MB")
    print(f"\nPreprocessing constants for your iOS app:")
    print(f"  INPUT_SIZE  = {INPUT_SIZE}")
    print(f"  NORM_MEAN   = [0.699, 0.556, 0.5121]")
    print(f"  NORM_STD    = [0.1576, 0.1562, 0.1706]")
    print(f"  THRESHOLD   = {threshold:.4f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ckpt", type=Path, default=Path("epoch141.ckpt"))
    parser.add_argument("--out", type=Path, default=Path("skinet_unet.onnx"))
    parser.add_argument("--config", type=Path, default=Path("main_config.yaml"))
    parser.add_argument("--opset", type=int, default=17)
    args = parser.parse_args()
    export(args.ckpt, args.out, args.config, args.opset)
