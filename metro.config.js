const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle the ONNX model and its external data sidecar.
// Metro treats the last dot-extension as the file type, so "ios_onnx.onnx.data"
// registers as ".data" and "ios_onnx.onnx" as ".onnx".
config.resolver.assetExts.push('onnx', 'data');

module.exports = config;
