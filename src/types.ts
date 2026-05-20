export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

export interface SegmentationResult {
  maskData: Float32Array; // [INPUT_SIZE * INPUT_SIZE] flattened, values in [0, 1]
  inferenceTimeMs: number;
}
