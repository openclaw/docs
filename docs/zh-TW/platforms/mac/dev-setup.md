---
read_when:
    - 設定 macOS 開發環境
summary: OpenClaw macOS 應用程式開發者設定指南
title: macOS 開發設定
x-i18n:
    generated_at: "2026-06-27T19:31:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開發者設定

從原始碼建置並執行 OpenClaw macOS 應用程式。

## 先決條件

在建置應用程式之前，請確認已安裝以下項目：

1. **Xcode 26.2+**：Swift 開發所需。
2. **Node.js 24 與 pnpm**：建議用於閘道、命令列介面與封裝指令碼。為了相容性，目前仍支援 Node 22 LTS（`22.19+`）。

## 1. 安裝相依套件

安裝整個專案的相依套件：

```bash
pnpm install
```

## 2. 建置並封裝應用程式

若要建置 macOS 應用程式並封裝成 `dist/OpenClaw.app`，請執行：

```bash
./scripts/package-mac-app.sh
```

如果你沒有 Apple Developer ID 憑證，指令碼會自動使用 **臨時簽署**（`-`）。

如需開發執行模式、簽署旗標與 Team ID 疑難排解，請參閱 macOS 應用程式 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：臨時簽署的應用程式可能會觸發安全性提示。如果應用程式立即因「Abort trap 6」而當機，請參閱[疑難排解](#troubleshooting)章節。

## 3. 安裝命令列介面

macOS 應用程式預期已全域安裝 `openclaw` 命令列介面，以管理背景工作。

**安裝方式（建議）：**

1. 開啟 OpenClaw 應用程式。
2. 前往 **一般** 設定分頁。
3. 按一下 **「安裝命令列介面」**。

或者，也可以手動安裝：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可以使用。
對於閘道執行階段，Node 仍是建議路徑。

## 疑難排解

### 建置失敗：工具鏈或 SDK 不相符

macOS 應用程式建置預期使用最新的 macOS SDK 與 Swift 6.2 工具鏈。

**系統相依項目（必要）：**

- **軟體更新中可用的最新 macOS 版本**（Xcode 26.2 SDK 所需）
- **Xcode 26.2**（Swift 6.2 工具鏈）

**檢查：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不相符，請更新 macOS/Xcode，然後重新執行建置。

### 應用程式在授予權限時當機

如果你嘗試允許 **語音辨識** 或 **麥克風** 存取時應用程式當機，可能是 TCC 快取損毀或簽章不相符所致。

**修正：**

1. 重設 TCC 權限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失敗，請暫時變更 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，讓 macOS 強制使用「全新狀態」。

### 閘道無限停在「正在啟動...」

如果閘道狀態停留在「正在啟動...」，請檢查是否有殭屍程序占用連接埠：

```bash
openclaw gateway status
openclaw gateway stop

# 如果你未使用 LaunchAgent（開發模式／手動執行），請找出監聽者：
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果是手動執行占用了連接埠，請停止該程序（Ctrl+C）。最後手段是終止你在上方找到的 PID。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [安裝概觀](/zh-TW/install)
