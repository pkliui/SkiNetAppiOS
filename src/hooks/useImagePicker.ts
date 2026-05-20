import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { PickedImage } from '../types';

export function useImagePicker() {
  const [isLoading, setIsLoading] = useState(false);

  async function pickImage(): Promise<PickedImage | null> {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') throw new Error('Photo library permission denied');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) return null;
      const { uri, width, height } = result.assets[0];
      return { uri, width, height };
    } finally {
      setIsLoading(false);
    }
  }

  async function takePhoto(): Promise<PickedImage | null> {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') throw new Error('Camera permission denied');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) return null;
      const { uri, width, height } = result.assets[0];
      return { uri, width, height };
    } finally {
      setIsLoading(false);
    }
  }

  return { pickImage, takePhoto, isLoading };
}
