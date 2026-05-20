import { Tensor } from 'onnxruntime-react-native';
import { getSession } from './onnxSession';
import { preprocessImage } from '../services/imagePreprocessing';
import { INPUT_SIZE, MODEL_INPUT_NAME, MODEL_OUTPUT_NAME } from './constants';
import type { PickedImage, SegmentationResult } from '../types';

export async function runSegmentation(image: PickedImage): Promise<SegmentationResult> {
  const [session, tensorData] = await Promise.all([
    getSession(),
    preprocessImage(image.uri),
  ]);

  const inputTensor = new Tensor('float32', tensorData, [1, 3, INPUT_SIZE, INPUT_SIZE]);

  const t0 = performance.now();
  const results = await session.run({ [MODEL_INPUT_NAME]: inputTensor });
  const inferenceTimeMs = performance.now() - t0;

  const outputTensor = results[MODEL_OUTPUT_NAME];
  if (!outputTensor) throw new Error(`Output "${MODEL_OUTPUT_NAME}" not found in model results`);

  // Output shape is (1, 1, H, W) — slice the batch+channel dims to get flat [H*W].
  const maskData = (outputTensor.data as Float32Array).slice(0, INPUT_SIZE * INPUT_SIZE);

  return { maskData, inferenceTimeMs };
}
