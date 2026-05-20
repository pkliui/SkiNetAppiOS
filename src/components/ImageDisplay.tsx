import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  useCanvasRef,
} from '@shopify/react-native-skia';
import { maskToSkImage } from '../services/overlayRenderer';
import type { PickedImage, SegmentationResult } from '../types';

const DISPLAY_SIZE = Dimensions.get('window').width - 32;
const PLACEHOLDER_COLOR = '#1a1a1a';

export interface ImageDisplayRef {
  makeSnapshot(): Uint8Array | null;
}

interface Props {
  image: PickedImage | null;
  result: SegmentationResult | null;
  overlayOpacity: number;
}

export const ImageDisplay = forwardRef<ImageDisplayRef, Props>(
  ({ image, result, overlayOpacity }, ref) => {
    const canvasRef = useCanvasRef();
    const skImage = useImage(image?.uri ?? null);

    const overlayImage = useMemo(
      () => (result != null ? maskToSkImage(result.maskData) : null),
      [result],
    );

    useImperativeHandle(ref, () => ({
      makeSnapshot: () => {
        const snap = canvasRef.current?.makeImageSnapshot();
        return snap ? snap.encodeToBytes() : null;
      },
    }));

    return (
      <View style={styles.container}>
        <Canvas
          ref={canvasRef}
          style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
        >
          {skImage != null && (
            <Image
              image={skImage}
              x={0}
              y={0}
              width={DISPLAY_SIZE}
              height={DISPLAY_SIZE}
              fit="contain"
            />
          )}
          {overlayImage != null && (
            <Image
              image={overlayImage}
              x={0}
              y={0}
              width={DISPLAY_SIZE}
              height={DISPLAY_SIZE}
              fit="contain"
              opacity={overlayOpacity}
            />
          )}
        </Canvas>
        {image == null && (
          <View style={styles.placeholder} pointerEvents="none">
            <Text style={styles.placeholderText}>Select or capture an image</Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    backgroundColor: PLACEHOLDER_COLOR,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#555',
    fontSize: 14,
  },
});
