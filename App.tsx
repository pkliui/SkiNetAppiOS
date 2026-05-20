import React, { useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { fromByteArray } from 'base64-js';
import { StatusBar } from 'expo-status-bar';

import { ImageDisplay, type ImageDisplayRef } from './src/components/ImageDisplay';
import { ControlPanel } from './src/components/ControlPanel';
import { InferenceStats } from './src/components/InferenceStats';
import { useImagePicker } from './src/hooks/useImagePicker';
import { useInference } from './src/hooks/useInference';

export default function App() {
  const { pickImage, takePhoto } = useImagePicker();
  const { image, result, isRunning, error, setImage, runInference } = useInference();
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const displayRef = useRef<ImageDisplayRef>(null);

  const handlePickImage = useCallback(async () => {
    const picked = await pickImage();
    if (picked) setImage(picked);
  }, [pickImage, setImage]);

  const handleTakePhoto = useCallback(async () => {
    const picked = await takePhoto();
    if (picked) setImage(picked);
  }, [takePhoto, setImage]);

  const handleSaveResult = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Photo library access is needed to save.');
        return;
      }
      const pngBytes = displayRef.current?.makeSnapshot();
      if (!pngBytes) {
        Alert.alert('Nothing to save', 'Run segmentation first.');
        return;
      }
      const tmpPath = FileSystem.cacheDirectory + 'skinet_result.png';
      await FileSystem.writeAsStringAsync(tmpPath, fromByteArray(pngBytes), {
        encoding: FileSystem.EncodingType.Base64,
      });
      await MediaLibrary.saveToLibraryAsync(tmpPath);
      Alert.alert('Saved', 'Result saved to your camera roll.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save result');
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>SkiNet</Text>

        <ImageDisplay
          ref={displayRef}
          image={image}
          result={result}
          overlayOpacity={overlayOpacity}
        />

        {result && <InferenceStats inferenceTimeMs={result.inferenceTimeMs} />}

        {result && (
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Overlay</Text>
            <Slider
              style={styles.slider}
              value={overlayOpacity}
              onValueChange={setOverlayOpacity}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor="#0a84ff"
              maximumTrackTintColor="#555"
              thumbTintColor="#0a84ff"
            />
          </View>
        )}

        {error != null && <Text style={styles.error}>{error}</Text>}

        <ControlPanel
          onTakePhoto={handleTakePhoto}
          onPickImage={handlePickImage}
          onRunSegmentation={runInference}
          onSaveResult={handleSaveResult}
          canRunSegmentation={image != null && !isRunning}
          canSaveResult={result != null}
          isRunning={isRunning}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sliderLabel: {
    color: '#aaa',
    fontSize: 13,
    width: 48,
  },
  slider: {
    flex: 1,
  },
  error: {
    color: '#ff453a',
    fontSize: 13,
    textAlign: 'center',
  },
});
