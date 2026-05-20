import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import { INPUT_SIZE, SEGMENTATION_THRESHOLD } from '../ml/constants';
import { MASK_COLOR } from '../utils/colorMap';

/**
 * Converts a flat Float32Array mask (values in [0, 1]) into a Skia image
 * that can be composited over the original photo as a coloured overlay.
 *
 * Pixels above SEGMENTATION_THRESHOLD get MASK_COLOR at alpha=200;
 * background pixels are fully transparent.
 */
export function maskToSkImage(maskData: Float32Array): SkImage {
  const rgba = new Uint8Array(INPUT_SIZE * INPUT_SIZE * 4);

  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    const isMask = maskData[i] >= SEGMENTATION_THRESHOLD;
    rgba[i * 4 + 0] = MASK_COLOR.r;
    rgba[i * 4 + 1] = MASK_COLOR.g;
    rgba[i * 4 + 2] = MASK_COLOR.b;
    rgba[i * 4 + 3] = isMask ? 200 : 0;
  }

  const image = Skia.Image.MakeImage(
    {
      width: INPUT_SIZE,
      height: INPUT_SIZE,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    },
    rgba,
    INPUT_SIZE * 4,
  );

  if (!image) throw new Error('Failed to create mask overlay SkImage');
  return image;
}
