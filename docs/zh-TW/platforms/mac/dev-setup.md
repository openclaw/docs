---
read_when:
    - 設定 macOS 開發環境
summary: OpenClaw macOS 應用程式開發者設定指南
title: macOS 開發環境設定
x-i18n:
    generated_at: "2026-07-05T11:26:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開發者設定

從原始碼建置並執行 OpenClaw macOS 應用程式。

## 先決條件

- **Xcode 26.2+**（Swift 6.2 工具鏈），並使用「軟體更新」中可用的最新 macOS。
- **Node.js 24 與 pnpm**，用於閘道、命令列介面與封裝指令碼。Node 22.19+ 也可使用。

## 1. 安裝相依套件

```bash
pnpm install
```

## 2. 建置並封裝應用程式

```bash
./scripts/package-mac-app.sh
```

輸出 `dist/OpenClaw.app`。如果沒有 Apple Developer ID 憑證，該指令碼會退回使用 ad-hoc 簽署。

如需開發執行模式、簽署旗標與 Team ID 疑難排解，請參閱
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)。
從儲存庫根目錄快速進行開發循環：`scripts/restart-mac.sh`（加入 `--no-sign` 可使用 ad-hoc 簽署；TCC 權限不會在 `--no-sign` 下保留）。

<Note>
Ad-hoc 簽署的應用程式可能會觸發安全性提示。如果應用程式立即因「Abort trap 6」而當機，請參閱[疑難排解](#troubleshooting)。
</Note>

## 3. 安裝命令列介面與閘道

封裝後的應用程式內嵌標準的 `scripts/install-cli.sh` 安裝程式。在全新的設定檔中，於新手引導期間選擇 **這台 Mac**；應用程式會先安裝相符的使用者空間命令列介面與執行階段，再啟動閘道精靈。

若需手動開發復原，請自行安裝相符的命令列介面：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 與 `bun add -g openclaw@<version>` 也可以使用。Node 仍是閘道本身建議使用的執行階段。

## 疑難排解

### 建置失敗：工具鏈或 SDK 不相符

macOS 應用程式建置預期使用最新的 macOS SDK 與 Swift 6.2 工具鏈（Xcode 26.2+）。

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不相符，請更新 macOS/Xcode，然後重新執行建置。

### 應用程式在授予權限時當機

如果你嘗試允許**語音辨識**或**麥克風**存取時應用程式當機，可能是 TCC 快取損毀或簽章不相符。

1. 重設偵錯套件 ID 的 TCC 權限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果仍然失敗，請暫時變更
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   中的 `BUNDLE_ID`，以強制 macOS 使用乾淨狀態。

### 閘道無限停在「Starting...」

檢查是否有殭屍程序占用連接埠：

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手動執行占用了連接埠，請停止它（Ctrl+C），或在不得已時終止上方找到的 PID。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [安裝概覽](/zh-TW/install)
