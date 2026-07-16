---
read_when:
    - 設定 macOS 開發環境
summary: 適用於 OpenClaw macOS App 開發人員的設定指南
title: macOS 開發環境設定
x-i18n:
    generated_at: "2026-07-16T11:45:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開發者設定

從原始碼建置並執行 OpenClaw macOS 應用程式。

## 必要條件

- **Xcode 26.2+**（Swift 6.2 工具鏈），並使用「Software Update」中可取得的最新 macOS。
- **Node.js 24.15+ 與 pnpm**，用於閘道、命令列介面及封裝指令碼。Node
  22.22.3+ 也可使用。

## 1. 安裝相依套件

```bash
pnpm install
```

## 2. 建置並封裝應用程式

```bash
./scripts/package-mac-app.sh
```

輸出至 `dist/OpenClaw.app`。若沒有 Apple Developer ID 憑證，指令碼會改用臨時簽署。

如需開發執行模式、簽署旗標及 Team ID 疑難排解資訊，請參閱
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)。
從存放庫根目錄快速進行開發迴圈：`scripts/restart-mac.sh`（加入 `--no-sign` 以使用
臨時簽署；使用 `--no-sign` 時，TCC 權限不會保留）。

<Note>
臨時簽署的應用程式可能會觸發安全性提示。若應用程式立即當機並顯示 "Abort trap 6"，請參閱[疑難排解](#troubleshooting)。
</Note>

## 3. 安裝命令列介面與閘道

封裝後的應用程式內嵌標準的 `scripts/install-cli.sh` 安裝程式。在全新的設定檔上進行初始設定時，選擇 **This Mac**；應用程式會先安裝相符的使用者空間命令列介面與執行階段，再啟動閘道精靈。

若要手動復原開發環境，請自行安裝相符的命令列介面：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>` 也可使用。對於閘道本身，Node 仍是建議的執行階段。

## 疑難排解

### 建置失敗：工具鏈或 SDK 不相符

macOS 應用程式建置需要最新的 macOS SDK 與 Swift 6.2 工具鏈
（Xcode 26.2+）。

```bash
xcodebuild -version
xcrun swift --version
```

若版本不相符，請更新 macOS/Xcode，然後重新執行建置。

### 授予權限時應用程式當機

若嘗試允許 **Speech Recognition** 或 **Microphone** 存取權時應用程式當機，可能是 TCC 快取損毀或簽章不相符。

1. 重設偵錯套件組合 ID 的 TCC 權限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 若仍失敗，請暫時變更
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   中的 `BUNDLE_ID`，以強制 macOS 從全新狀態開始。

### 閘道無限期顯示 "Starting..."

檢查是否有殭屍處理程序占用連接埠：

```bash
openclaw gateway status
openclaw gateway stop

# 如果你未使用 LaunchAgent（開發模式／手動執行），請尋找監聽程式：
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

若手動執行的處理程序占用連接埠，請將其停止（Ctrl+C），或在不得已時終止上方找到的 PID。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [安裝概覽](/zh-TW/install)
