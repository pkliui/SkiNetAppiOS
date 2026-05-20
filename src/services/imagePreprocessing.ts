import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';
import { INPUT_SIZE, NORM_MEAN, NORM_STD } from '../ml/constants';

/**
 * Loads an image from a URI, resizes it to INPUT_SIZE×INPUT_SIZE via an
 * offscreen Skia surface, and returns a CHW Float32Array normalized with
 * the SkiNet training statistics.
 */
export async function preprocessImage(uri: string): Promise<Float32Array> {
  const skData = await Skia.Data.fromURI(uri);
  const srcImage = Skia.Image.MakeImageFromEncoded(skData);
  if (!srcImage) throw new Error('Failed to decode image from URI');

  const surface = Skia.Surface.Make(INPUT_SIZE, INPUT_SIZE);
  if (!surface) throw new Error('Failed to create offscreen Skia surface');

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  canvas.drawImageRect(
    srcImage,
    Skia.XYWHRect(0, 0, srcImage.width(), srcImage.height()),
    Skia.XYWHRect(0, 0, INPUT_SIZE, INPUT_SIZE),
    paint,
  );
  surface.flush();

  const resized = surface.makeImageSnapshot();
  const pixels = resized.readPixels(0, 0, {
    width: INPUT_SIZE,
    height: INPUT_SIZE,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  }) as Uint8Array | null;

  if (!pixels) throw new Error('Failed to read pixels from resized image');

  // RGBA Uint8Array → normalized CHW Float32Array
  // channels: 0=R, 1=G, 2=B (skip A at index 3)
  const tensorData = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  for (let h = 0; h < INPUT_SIZE; h++) {
    for (let w = 0; w < INPUT_SIZE; w++) {
      const srcBase = (h * INPUT_SIZE + w) * 4;
      const dstOffset = h * INPUT_SIZE + w;
      for (let c = 0; c < 3; c++) {
        const normalized = pixels[srcBase + c] / 255.0;
        tensorData[c * INPUT_SIZE * INPUT_SIZE + dstOffset] =
          (normalized - NORM_MEAN[c]) / NORM_STD[c];
      }
    }
  }

  return tensorData;
}
