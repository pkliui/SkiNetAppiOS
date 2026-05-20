# SkiNetApp — iOS Build Guide

End-to-end steps to export the model, set up the app, and deploy to an iPhone.

---

## Prerequisites

- Mac with Xcode (see constraints below)
- iPhone for testing
- Lightning Studio with the SkiNet repo
- Free Apple ID (no paid developer account needed for personal device)

### Known hardware/software constraints

| Machine | macOS | Max Xcode | Max iOS supported |
|---|---|---|---|
| MacBook Pro Retina 15" Late 2013 | 11 Big Sur (max) | 13.2.1 (max) | iOS 15 |

**Current blocker:** iPhone has iOS 26, which requires Xcode 17+ (macOS 14+). Local build on this Mac is not possible. Use EAS cloud build instead (see Section 4).

---

## Section 1 — Export ONNX Model (Lightning Studio)

```bash
cd /teamspace/studios/this_studio/repos/SkiNet
pip install onnxscript  # if not installed
python export_onnx.py \
  --ckpt epoch141.ckpt \
  --config path/to/main_config.yaml \
  --out repos/SkiNetApp/assets/models/ios_onnx.onnx
```

This produces two files:
- `assets/models/ios_onnx.onnx`
- `assets/models/ios_onnx.onnx.data`

Note the `SEGMENTATION_THRESHOLD` printed by the script and update `src/ml/constants.ts`.

---

## Section 2 — App Dependencies (Lightning Studio)

### 2a — Set package.json core versions

Set only expo/react/react-native manually. Let `npx expo install` resolve everything else.

`package.json` dependencies before running expo install:
```json
{
  "dependencies": {
    "expo": "^55.0.25",
    "react": "19.2.0",
    "react-native": "0.83.6"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "^19.1.1",
    "typescript": "~5.3.3"
  }
}
```

> Note: `@types/react` must be `^19.1.1` — versions `~18.x` or `~19.0.x` cause ERESOLVE with RN 0.83.6.

### 2b — Install base dependencies

```bash
cd /teamspace/studios/this_studio/repos/SkiNetApp
rm -rf node_modules package-lock.json
npm install
```

### 2c — Add all other packages (expo resolves compatible versions)

```bash
npx expo install \
  @shopify/react-native-skia \
  @react-native-community/slider \
  base64-js \
  expo-asset \
  expo-file-system \
  expo-image-picker \
  expo-media-library \
  expo-status-bar \
  onnxruntime-react-native
```

Resolved versions (expo 55 + RN 0.83.6 + React 19.2.0):
| Package | Version |
|---|---|
| `@shopify/react-native-skia` | 2.4.18 |
| `@react-native-community/slider` | 5.1.2 |
| `onnxruntime-react-native` | 1.24.3 |
| `expo-file-system` | 55.0.21 |
| `expo-image-picker` | 55.0.20 |
| `expo-media-library` | 55.0.17 |
| `expo-asset` | 55.0.17 |
| `expo-status-bar` | 55.0.6 |

---

## Section 3 — EAS Build Setup (Lightning Studio)

EAS builds the iOS app on Expo's cloud servers (requires Xcode 17), bypassing the local Mac Xcode version limitation.

### 3a — Create a free Expo account

Sign up at https://expo.dev/signup

### 3b — Install EAS CLI and login

```bash
npm install -g eas-cli
eas login
```

### 3c — Initialise EAS in the project

```bash
cd /teamspace/studios/this_studio/repos/SkiNetApp
eas init
```

### 3d — Configure build profiles

```bash
eas build:configure
# Select: iOS
```

This creates `eas.json`. The development profile is used for sideloading to a personal device.

### 3e — Commit model files and push

```bash
git add assets/models/
git add .
git commit -m "add onnx model and eas config"
git push
```

### 3f — Trigger the build

```bash
eas build --platform ios --profile development
```

- EAS will ask for your Apple ID credentials to create a provisioning profile
- Build takes ~10–15 minutes on Expo servers
- You will get a download link for the `.ipa` file

---

## Section 4 — Install on iPhone

### 4a — Install via EAS

After the build completes, EAS provides a QR code or link. On your iPhone:
- Open the link in Safari (not Chrome)
- Tap Install

### 4b — Trust the developer certificate

On iPhone: **Settings → General → VPN & Device Management → Your Apple ID → Trust**

---

## Section 5 — Update Model Constants

After running `export_onnx.py`, update the printed values in:

`src/ml/constants.ts`:
```typescript
export const SEGMENTATION_THRESHOLD = 0.5; // update with export_onnx.py output
export const NORM_MEAN = [0.699, 0.556, 0.5121];
export const NORM_STD  = [0.1576, 0.1562, 0.1706];
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `npm ERESOLVE` on skia/RN versions | Use `npx expo install` instead of `npm install` for all non-core packages |
| `pod: command not found` | Install CocoaPods via `gem install cocoapods` (requires Ruby 3.2+) |
| Ruby 2.6 too old for CocoaPods | Install rbenv: `brew install rbenv ruby-build && rbenv install 3.2.0` |
| `brew install cocoapods` compiles entire toolchain on macOS 11 | Use `gem install cocoapods` with rbenv Ruby instead |
| `getpwuid(): uid not found` in export_onnx.py | Set env vars before torch import: `os.environ.setdefault("LOGNAME", "user")` |
| `model._orig_mod.*` key mismatch in state dict | Strip prefix: `{k.replace("model._orig_mod.", "model."): v ...}` |
| Xcode "Unsupported iOS" | Mac too old — use EAS cloud build |