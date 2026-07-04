---
read_when:
    - 設定 macOS 開發環境
summary: OpenClaw macOS 應用程式開發者設定指南
title: macOS 開發環境設定
x-i18n:
    generated_at: "2026-07-04T06:22:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開發者設定

從原始碼建置並執行 OpenClaw macOS 應用程式。

## 先決條件

建置應用程式前，請確認已安裝下列項目：

1. **Xcode 26.2+**：Swift 開發所需。
2. **Node.js 24 與 pnpm**：建議用於閘道、命令列介面與封裝指令碼。Node 22 LTS（目前為 `22.19+`）仍支援相容性用途。

## 1. 安裝相依項目

安裝整個專案的相依項目：

```bash
pnpm install
```

## 2. 建置並封裝應用程式

若要建置 macOS 應用程式並封裝成 `dist/OpenClaw.app`，請執行：

```bash
./scripts/package-mac-app.sh
```

如果你沒有 Apple Developer ID 憑證，指令碼會自動使用 **ad-hoc 簽署**（`-`）。

如需開發執行模式、簽署旗標與 Team ID 疑難排解，請參閱 macOS 應用程式 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：Ad-hoc 簽署的應用程式可能會觸發安全性提示。如果應用程式立即因「Abort trap 6」而當機，請參閱[疑難排解](#troubleshooting)章節。

## 3. 安裝命令列介面與閘道

封裝後的應用程式內嵌標準的 `scripts/install-cli.sh` 安裝程式。在全新設定檔上，於上手流程中選擇 **This Mac**；應用程式會先安裝相符的使用者空間命令列介面與執行階段，再啟動閘道精靈。

若要手動進行開發復原，請自行安裝相符的命令列介面：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 與 `bun add -g openclaw@<version>` 也可使用。對於閘道執行階段，Node 仍是建議路徑。

## 疑難排解

### 建置失敗：工具鏈或 SDK 不相符

macOS 應用程式建置預期使用最新的 macOS SDK 與 Swift 6.2 工具鏈。

**系統相依項目（必要）：**

- **Software Update 中可用的最新 macOS 版本**（Xcode 26.2 SDK 必要）
- **Xcode 26.2**（Swift 6.2 工具鏈）

**檢查：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不相符，請更新 macOS/Xcode，然後重新執行建置。

### 授予權限時應用程式當機

如果你嘗試允許 **Speech Recognition** 或 **Microphone** 存取時應用程式當機，可能是 TCC 快取毀損或簽章不相符所致。

**修正方式：**

1. 重設 TCC 權限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失敗，請暫時變更 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，以強制 macOS 使用「乾淨狀態」。

### 閘道無限期停在「Starting...」

如果閘道狀態停在「Starting...」，請檢查是否有殭屍行程占用連接埠：

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手動執行的行程占用了連接埠，請停止該行程（Ctrl+C）。最後手段是終止你在上方找到的 PID。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [安裝概覽](/zh-TW/install)
