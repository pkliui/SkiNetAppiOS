import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface Props {
  onTakePhoto: () => void;
  onPickImage: () => void;
  onRunSegmentation: () => void;
  onSaveResult: () => void;
  canRunSegmentation: boolean;
  canSaveResult: boolean;
  isRunning: boolean;
}

export function ControlPanel({
  onTakePhoto,
  onPickImage,
  onRunSegmentation,
  onSaveResult,
  canRunSegmentation,
  canSaveResult,
  isRunning,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Btn label="Take Photo" onPress={onTakePhoto} disabled={isRunning} />
        <Btn label="Choose From Library" onPress={onPickImage} disabled={isRunning} />
      </View>
      <View style={styles.row}>
        <Btn
          label={isRunning ? 'Running…' : 'Run Segmentation'}
          onPress={onRunSegmentation}
          disabled={!canRunSegmentation}
          primary
          icon={isRunning ? <ActivityIndicator color="#fff" size="small" /> : null}
        />
        <Btn
          label="Save Result"
          onPress={onSaveResult}
          disabled={!canSaveResult}
        />
      </View>
    </View>
  );
}

function Btn({
  label,
  onPress,
  disabled = false,
  primary = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, primary && styles.btnPrimary, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={styles.btnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2a2a2a',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  btnPrimary: {
    backgroundColor: '#0a84ff',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
