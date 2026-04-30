---
read_when:
    - 設定 macOS 開發環境
summary: 供開發 OpenClaw macOS 應用程式的開發者使用的設定指南
title: macOS 開發環境設定
x-i18n:
    generated_at: "2026-04-30T03:20:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開發者設定

從原始碼建置並執行 OpenClaw macOS 應用程式。

## 先決條件

建置應用程式之前，請確認已安裝下列項目：

1. **Xcode 26.2+**：Swift 開發所需。
2. **Node.js 24 與 pnpm**：建議用於 Gateway、CLI 與封裝指令碼。Node 22 LTS，目前為 `22.14+`，仍支援相容性。

## 1. 安裝相依項目

安裝整個專案的相依項目：

```bash
pnpm install
```

## 2. 建置並封裝應用程式

若要建置 macOS 應用程式並將其封裝到 `dist/OpenClaw.app`，請執行：

```bash
./scripts/package-mac-app.sh
```

如果你沒有 Apple Developer ID 憑證，指令碼會自動使用 **ad-hoc 簽署**（`-`）。

如需開發執行模式、簽署旗標與 Team ID 疑難排解，請參閱 macOS 應用程式 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：Ad-hoc 簽署的應用程式可能會觸發安全性提示。如果應用程式立即因「Abort trap 6」而當機，請參閱[疑難排解](#troubleshooting)章節。

## 3. 安裝 CLI

macOS 應用程式預期全域安裝 `openclaw` CLI，以管理背景工作。

**安裝方式（建議）：**

1. 開啟 OpenClaw 應用程式。
2. 前往 **General** 設定分頁。
3. 按一下 **"Install CLI"**。

或者，手動安裝：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 與 `bun add -g openclaw@<version>` 也可使用。
對於 Gateway 執行環境，Node 仍是建議路徑。

## 疑難排解

### 建置失敗：工具鏈或 SDK 不相符

macOS 應用程式建置預期使用最新的 macOS SDK 與 Swift 6.2 工具鏈。

**系統相依項目（必要）：**

- **Software Update 中可用的最新 macOS 版本**（Xcode 26.2 SDK 所需）
- **Xcode 26.2**（Swift 6.2 工具鏈）

**檢查：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不符，請更新 macOS/Xcode，然後重新執行建置。

### 授予權限時應用程式當機

如果你嘗試允許 **Speech Recognition** 或 **Microphone** 存取時應用程式當機，可能是因為 TCC 快取損毀或簽章不符。

**修正：**

1. 重設 TCC 權限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失敗，請暫時變更 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，強制 macOS 使用「全新狀態」。

### Gateway 一直停留在「Starting...」

如果 Gateway 狀態停留在「Starting...」，請檢查是否有僵屍程序占用連接埠：

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手動執行的程序占用連接埠，請停止該程序（Ctrl+C）。最後手段是終止上方找到的 PID。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [安裝概覽](/zh-TW/install)
