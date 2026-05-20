export const INPUT_SIZE = 512;

// Normalization statistics from SkiNet training pipeline (main_config.yaml)
export const NORM_MEAN: readonly [number, number, number] = [0.699, 0.556, 0.5121];
export const NORM_STD: readonly [number, number, number] = [0.1576, 0.1562, 0.1706];

// Update this with the "Optimal sigmoid threshold" value printed by export_onnx.py.
export const SEGMENTATION_THRESHOLD = 0.5;

export const MODEL_INPUT_NAME = 'image';
export const MODEL_OUTPUT_NAME = 'mask_prob';
