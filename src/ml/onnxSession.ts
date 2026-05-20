import { InferenceSession } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Both files must sit in the same directory for ONNX Runtime to resolve
// external data. Metro bundles them via the assetExts config in metro.config.js.
const MODEL_ASSET_MODULE = require('../../assets/models/ios_onnx.onnx');
const MODEL_DATA_ASSET_MODULE = require('../../assets/models/ios_onnx.onnx.data');

const CACHE_DIR = `${FileSystem.cacheDirectory}onnx_model/`;
const MODEL_FILENAME = 'ios_onnx.onnx';
const DATA_FILENAME = 'ios_onnx.onnx.data';

let _session: InferenceSession | null = null;

async function ensureInCache(assetModule: number, targetPath: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(targetPath);
  if (info.exists) return;

  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error(`Asset download failed: ${asset.name}`);
  await FileSystem.copyAsync({ from: asset.localUri, to: targetPath });
}

export async function getSession(): Promise<InferenceSession> {
  if (_session) return _session;

  await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });

  await Promise.all([
    ensureInCache(MODEL_ASSET_MODULE, CACHE_DIR + MODEL_FILENAME),
    ensureInCache(MODEL_DATA_ASSET_MODULE, CACHE_DIR + DATA_FILENAME),
  ]);

  _session = await InferenceSession.create(CACHE_DIR + MODEL_FILENAME, {
    // CoreML runs on Apple Neural Engine / GPU; falls back to CPU automatically.
    executionProviders: ['coreml', 'cpu'],
  });

  return _session;
}
