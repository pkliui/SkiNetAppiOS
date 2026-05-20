# SkiNetAppiOS — iOS iPad Build Guide

Build guide for deploying SkiNetApp to an iPad running iOS 12.5.7 (iPad mini 2 / iPad Air 1st gen).
Uses a downgraded stack (Expo 48 / RN 0.71) to meet the iOS 12.4+ deployment target.

---

## Device Constraints

| Device | iOS | Min RN required | Min Expo required |
|---|---|---|---|
| iPad mini 2 / iPad Air (1st gen) | 12.5.7 (max) | ≤ 0.71.x | ≤ 48 |
| iPhone SE / iPhone 6s | 15.x | any | any |

**Why a separate repo:** The main `SkiNetApp` repo uses Expo 55 / RN 0.83.6 which requires
iOS 15.1+. Downgrading to support iOS 12 requires a different package stack that is
incompatible with the modern stack.

---

## Mac Setup

### Ruby and CocoaPods

macOS 11 ships with Ruby 2.6 which is too old for CocoaPods 1.x. Install Ruby 3.2 via rbenv:

```bash
brew install rbenv ruby-build
rbenv install 3.2.0
rbenv global 3.2.0
echo 'eval "$(rbenv init - bash)"' >> ~/.bash_profile
source ~/.bash_profile
ruby --version   # should show 3.2.0
gem install cocoapods
pod --version    # should show 1.16.x
```

> Do NOT use `brew install cocoapods` on macOS 11 — it triggers full compilation of
> llvm, rust, ruby from source (hours). Use `gem install cocoapods` with rbenv Ruby instead.

---

## Section 1 — Clone and Set Up Repo (Lightning Studio)

```bash
cd /teamspace/studios/this_studio/repos
git clone <SkiNetAppiOS GitHub URL>
cd SkiNetAppiOS
```

---

## Section 2 — App Dependencies (Lightning Studio)

### 2a — Set package.json core versions

Only set expo/react/react-native manually. Let `npx expo install` resolve everything else.

```json
{
  "dependencies": {
    "expo": "~48.0.0",
    "react": "18.2.0",
    "react-native": "0.71.14"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.0",
    "typescript": "^5.1.0"
  }
}
```

### 2b — Install base dependencies

```bash
cd /teamspace/studios/this_studio/repos/SkiNetAppiOS
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

### 2d — Install dev dependencies

```bash
npm install --save-dev babel-preset-expo @types/base64-js
```

---

## Section 3 — iOS Deployment Target

Expo 48 / RN 0.71 defaults to iOS 13 deployment target. Must be lowered to 12.4.

After running `npx expo prebuild --platform ios`, open
`ios/Podfile` and verify or set:

```ruby
platform :ios, '12.4'
```

Also in Xcode: select `SkiNetAppiOS` target → **Build Settings** →
search `IPHONEOS_DEPLOYMENT_TARGET` → set to `12.4`.

---

## Section 4 — Generate iOS Project (Mac)

```bash
cd ~/repos/SkiNetAppiOS
npm install
npx expo prebuild --platform ios
cd ios && pod install && cd ..
```

---

## Section 5 — Build and Deploy (Mac + Xcode)

### 5a — Open in Xcode

```bash
open ios/SkiNetAppiOS.xcworkspace
```

### 5b — Configure signing

1. Select `SkiNetAppiOS` target → **Signing & Capabilities**
2. Check **Automatically manage signing**
3. Team → add Apple ID → select **Personal Team** (free)
4. Bundle Identifier: change `com.yourname.skinetappios` to `com.pavel.skinetappios`

### 5c — Connect iPad

- Plug iPad in via USB → trust the Mac when prompted
- Select iPad from device dropdown in Xcode toolbar
- For wireless: **Window → Devices and Simulators** → check **Connect via network**

### 5d — Run

Hit **▶ Run** in Xcode.

- App installs directly on iPad
- **Certificate expires after 7 days** with free Apple ID — reinstall weekly
- Trust certificate on iPad: **Settings → General → VPN & Device Management → Apple ID → Trust**

---

## Section 6 — Model Files

Copy ONNX model files from Lightning Studio to the repo:

```
assets/models/ios_onnx.onnx
assets/models/ios_onnx.onnx.data
```

Commit them:

```bash
git add assets/models/
git commit -m "add onnx model files"
git push
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `OS version lower than deployment target` | Lower deployment target to 12.4 in Podfile and Xcode |
| `pod: command not found` | `gem install cocoapods` (requires rbenv Ruby 3.2) |
| `npm ERESOLVE` on versions | Use `npx expo install` not `npm install` for non-core packages |
| `Cannot find module 'babel-preset-expo'` | `npm install --save-dev babel-preset-expo` |
| Certificate expired | Reinstall from Xcode every 7 days (free Apple ID limitation) |
| `getpwuid(): uid not found` in export_onnx.py | `os.environ.setdefault("LOGNAME", "user")` before torch import |
