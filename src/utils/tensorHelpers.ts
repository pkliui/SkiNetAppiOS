/**
 * Extracts a single-channel, single-batch slice from a flat ONNX output tensor.
 * For shape (1, 1, H, W), returns the inner [H*W] view without copying.
 */
export function extractMask(data: Float32Array, height: number, width: number): Float32Array {
  return data.subarray(0, height * width);
}
