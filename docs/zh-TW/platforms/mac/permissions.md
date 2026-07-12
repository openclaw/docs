---
read_when:
    - 偵錯 macOS 權限提示未出現或卡住的問題
    - 決定是否授予節點或命令列介面執行環境「輔助使用」權限
    - 封裝或簽署 macOS 應用程式
    - 變更套件識別碼或應用程式安裝路徑
summary: macOS 權限持續保留（TCC）與簽署要求
title: macOS 權限
x-i18n:
    generated_at: "2026-07-11T21:31:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 權限授予機制相當脆弱。TCC 會將權限授予與應用程式的程式碼簽章、套件識別碼及磁碟上的路徑關聯起來。如果其中任何一項發生變更，macOS 會將該應用程式視為新的應用程式，並可能不再顯示或隱藏提示。

## 維持權限穩定的要求

- 相同路徑：從固定位置執行應用程式（OpenClaw 為 `dist/OpenClaw.app`）。
- 相同套件識別碼：OpenClaw 的套件 ID 是 `ai.openclaw.mac`；變更此 ID 會建立新的權限身分。
- 已簽署的應用程式：未簽署或使用臨時簽章的組建無法保留權限。
- 一致的簽章：使用真正的 Apple Development 或 Developer ID 憑證，使簽章在重新組建後仍維持穩定。

臨時簽章會在每次組建時產生新身分。macOS 會忘記先前授予的權限，而且提示可能完全消失，直到清除過期項目為止。

## 節點與命令列介面執行階段的輔助使用權限

請優先將輔助使用權限授予 OpenClaw.app、Peekaboo.app，或其他具有自身套件識別碼且已簽署的輔助程式，而不是通用的 `node` 二進位檔。

macOS TCC 會將輔助使用權限授予其所識別之程序的程式碼身分。如果 Homebrew、nvm、pnpm 或 npm 工作流程使共用的 `node` 執行檔取得輔助使用權限，任何透過同一執行檔啟動的 JavaScript 套件都可能繼承圖形介面自動化權限。

請將 System Settings 中的 `node` 項目視為授予該節點執行階段的廣泛權限，而非授予單一 npm 套件的權限。除非您信任透過該特定節點安裝環境啟動的每一個指令碼與套件，否則請避免將輔助使用權限授予 `node`。

如果您不慎將輔助使用權限授予 `node`，請從 System Settings -> Privacy & Security -> Accessibility 移除該項目。接著，將權限授予應負責使用者介面自動化的已簽署應用程式或輔助程式。

## 提示消失時的復原檢查清單

1. 結束應用程式。
2. 從 System Settings -> Privacy & Security 移除該應用程式項目。
3. 從相同路徑重新啟動應用程式，並再次授予權限。
4. 如果提示仍未出現，請使用 `tccutil` 重設 TCC 項目，然後再試一次。
5. 某些權限只有在完整重新啟動 macOS 後才會再次出現。

重設範例（使用 OpenClaw 的套件 ID `ai.openclaw.mac`）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 檔案與資料夾權限（桌面／文件／下載項目）

macOS 也可能限制終端機或背景程序存取桌面、文件與下載項目。如果讀取檔案或列出目錄時停滯，請將存取權授予實際執行檔案操作的同一程序環境（例如 Terminal/iTerm、由 LaunchAgent 啟動的應用程式或 SSH 程序）。

因應方法：如果您想避免逐一授予資料夾權限，請將檔案移至 OpenClaw 工作區（`~/.openclaw/workspace`）。

如果您正在測試權限，請一律使用真正的憑證簽署。臨時簽章組建僅適用於權限無關緊要的快速本機執行。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS 簽署](/zh-TW/platforms/mac/signing)
