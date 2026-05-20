import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  inferenceTimeMs: number;
}

export function InferenceStats({ inferenceTimeMs }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Inference: <Text style={styles.value}>{inferenceTimeMs.toFixed(0)} ms</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  text: {
    color: '#666',
    fontSize: 12,
  },
  value: {
    color: '#aaa',
    fontVariant: ['tabular-nums'],
  },
});
