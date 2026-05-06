---
read_when:
    - 設定 macOS 開發環境
summary: OpenClaw macOS 應用程式開發者設定指南
title: macOS 開發環境設定
x-i18n:
    generated_at: "2026-05-06T09:13:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開發者設定

從原始碼建置並執行 OpenClaw macOS 應用程式。

## 先決條件

在建置應用程式之前，請確認你已安裝下列項目：

1. **Xcode 26.2+**：Swift 開發所需。
2. **Node.js 24 與 pnpm**：建議用於 Gateway、CLI 和封裝指令碼。Node 22 LTS（目前為 `22.14+`）仍受支援以維持相容性。

## 1. 安裝依賴項

安裝整個專案的依賴項：

```bash
pnpm install
```

## 2. 建置並封裝應用程式

若要建置 macOS 應用程式並將其封裝到 `dist/OpenClaw.app`，請執行：

```bash
./scripts/package-mac-app.sh
```

如果你沒有 Apple Developer ID 憑證，該指令碼會自動使用**臨時簽署**（`-`）。

如需開發執行模式、簽署旗標和 Team ID 疑難排解，請參閱 macOS 應用程式 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：臨時簽署的應用程式可能會觸發安全提示。如果應用程式立即因 "Abort trap 6" 當機，請參閱[疑難排解](#troubleshooting)章節。

## 3. 安裝 CLI

macOS 應用程式預期已全域安裝 `openclaw` CLI，以管理背景工作。

**安裝方式（建議）：**

1. 開啟 OpenClaw 應用程式。
2. 前往**一般**設定分頁。
3. 點擊 **「安裝 CLI」**。

或者，也可以手動安裝：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可使用。
對於 Gateway 執行環境，Node 仍是建議的路徑。

## 疑難排解

### 建置失敗：工具鏈或 SDK 不相符

macOS 應用程式建置預期使用最新的 macOS SDK 和 Swift 6.2 工具鏈。

**系統依賴項（必要）：**

- **「軟體更新」中可用的最新 macOS 版本**（Xcode 26.2 SDK 所需）
- **Xcode 26.2**（Swift 6.2 工具鏈）

**檢查：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不相符，請更新 macOS/Xcode，然後重新執行建置。

### 應用程式在授予權限時當機

如果應用程式在你嘗試允許**語音辨識**或**麥克風**存取時當機，可能是因為 TCC 快取損毀或簽章不相符。

**修正：**

1. 重設 TCC 權限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失敗，請暫時變更 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，以強制 macOS 從「乾淨狀態」開始。

### Gateway 一直停在 "Starting..."

如果 Gateway 狀態一直停在 "Starting..."，請檢查是否有殭屍程序占用連接埠：

```bash
openclaw gateway status
openclaw gateway stop

# 如果你未使用 LaunchAgent（開發模式 / 手動執行），請找出監聽者：
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手動執行的程序占用連接埠，請停止該程序（Ctrl+C）。最後手段是終止你在上方找到的 PID。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [安裝概覽](/zh-TW/install)
