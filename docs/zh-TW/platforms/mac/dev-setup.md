---
read_when:
    - 設定 macOS 開發環境
summary: 供開發 OpenClaw macOS 應用程式之開發人員使用的設定指南
title: macOS 開發環境設定
x-i18n:
    generated_at: "2026-07-11T21:31:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開發者設定

從原始碼建置並執行 OpenClaw macOS 應用程式。

## 先決條件

- **Xcode 26.2+**（Swift 6.2 工具鏈），並使用「Software Update」中可取得的最新版 macOS。
- **Node.js 24 與 pnpm**，用於閘道、命令列介面和封裝指令碼。Node 22.19+ 也可使用。

## 1. 安裝相依套件

```bash
pnpm install
```

## 2. 建置並封裝應用程式

```bash
./scripts/package-mac-app.sh
```

輸出為 `dist/OpenClaw.app`。若沒有 Apple Developer ID 憑證，指令碼會改用臨時簽署。

如需開發執行模式、簽署旗標及 Team ID 疑難排解資訊，請參閱 [apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)。從儲存庫根目錄進行快速開發迴圈：`scripts/restart-mac.sh`（若要使用臨時簽署，請加上 `--no-sign`；使用 `--no-sign` 時，TCC 權限不會保留）。

<Note>
臨時簽署的應用程式可能會觸發安全性提示。若應用程式立即當機並顯示「Abort trap 6」，請參閱[疑難排解](#troubleshooting)。
</Note>

## 3. 安裝命令列介面與閘道

封裝後的應用程式內嵌標準的 `scripts/install-cli.sh` 安裝程式。在全新的設定檔中，請於初始設定期間選擇 **This Mac**；應用程式會先安裝相符的使用者空間命令列介面與執行階段，再啟動閘道精靈。

若需手動復原開發環境，請自行安裝相符的命令列介面：

```bash
npm install -g openclaw@<version>
```

也可使用 `pnpm add -g openclaw@<version>` 和 `bun add -g openclaw@<version>`。對閘道本身而言，Node 仍是建議的執行階段。

## 疑難排解

### 建置失敗：工具鏈或 SDK 不相符

macOS 應用程式建置需要最新版 macOS SDK 與 Swift 6.2 工具鏈（Xcode 26.2+）。

```bash
xcodebuild -version
xcrun swift --version
```

若版本不相符，請更新 macOS/Xcode，然後重新執行建置。

### 授予權限時應用程式當機

若您嘗試允許 **Speech Recognition** 或 **Microphone** 存取權時應用程式當機，可能是 TCC 快取損毀或簽章不相符所致。

1. 重設偵錯套件 ID 的 TCC 權限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 若仍失敗，請暫時變更 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`，以強制 macOS 使用全新的狀態。

### 閘道無限期顯示「Starting...」

檢查是否有殭屍程序占用連接埠：

```bash
openclaw gateway status
openclaw gateway stop

# 若您未使用 LaunchAgent（開發模式／手動執行），請尋找監聽程序：
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

若手動執行的程序占用連接埠，請停止該程序（Ctrl+C）；或在別無選擇時，終止上方找到的 PID。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [安裝概覽](/zh-TW/install)
