---
read_when:
    - 偵錯未出現或卡住的 macOS 權限提示
    - 決定是否授予 node 或命令列介面執行階段「輔助使用」權限
    - 封裝或簽署 macOS App
    - 變更套件識別碼或應用程式安裝路徑
summary: macOS 權限持續性（TCC）與簽署要求
title: macOS 權限
x-i18n:
    generated_at: "2026-07-21T22:39:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e561aa641e44fc1e1b95a3db244f31124e4e51d13ae709bee188d86054301e34
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 權限授予機制很脆弱。TCC 會將權限授予與應用程式的程式碼簽章、套件識別碼及磁碟上的路徑建立關聯。若其中任何一項變更，macOS 會將該應用程式視為新的應用程式，並可能不再顯示或隱藏提示。

## 維持穩定權限的要求

- 相同路徑：從固定位置執行應用程式（若為 OpenClaw，則為 `dist/OpenClaw.app`）。
- 相同套件識別碼：OpenClaw 的套件 ID 為 `ai.openclaw.mac`；變更此 ID 會建立新的權限身分。
- 已簽署的應用程式：未簽署或使用臨時簽章的組建無法保留權限。
- 一致的簽章：使用真正的 Apple Development 或 Developer ID 憑證，讓簽章在重新組建後保持穩定。

臨時簽章會在每次組建時產生新的身分。macOS 會忘記先前授予的權限，而且在清除過時的項目之前，提示可能會完全消失。

## Node 與命令列介面執行階段的輔助使用權限

建議將輔助使用權限授予 OpenClaw.app、Peekaboo.app，或其他擁有自身套件識別碼且已簽署的輔助程式，而不是通用的 `node` 二進位檔。

macOS TCC 會將輔助使用權限授予其所識別之程序的程式碼身分。如果 Homebrew、nvm、pnpm 或 npm 工作流程導致共用的 `node` 執行檔獲得輔助使用權限，任何透過同一執行檔啟動的 JavaScript 套件都可能繼承 GUI 自動化權限。

請將「系統設定」中的 `node` 項目視為授予該 Node 執行階段的廣泛權限，而不是僅授予某個 npm 套件的權限。除非你信任透過該 Node 安裝版本啟動的每個指令碼與套件，否則請避免將輔助使用權限授予 `node`。

核准輔助使用權限並不會啟用活動分享。**Settings -> Permissions -> Active computer detection** 是另一項預設關閉的控制項，用於與你的閘道分享有限範圍的閒置時間。將其關閉會清除保留的活動資料，但不會撤銷輔助使用權限或中斷節點連線。

如果你不小心將輔助使用權限授予 `node`，請前往 System Settings -> Privacy & Security -> Accessibility 移除該項目。接著，將權限授予應負責 UI 自動化的已簽署應用程式或輔助程式。

## 提示消失時的復原檢查清單

1. 結束應用程式。
2. 在 System Settings -> Privacy & Security 中移除應用程式項目。
3. 從相同路徑重新啟動應用程式，並再次授予權限。
4. 如果提示仍未出現，請使用 `tccutil` 重設 TCC 項目，然後再試一次。
5. 部分權限只有在完整重新啟動 macOS 後才會再次出現。

重設範例（使用 OpenClaw 的套件 ID：`ai.openclaw.mac`）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 檔案與資料夾權限（桌面／文件／下載項目）

macOS 也可能限制終端機或背景程序存取桌面、文件與下載項目。如果讀取檔案或列出目錄時停滯，請將存取權授予執行檔案作業的相同程序環境（例如 Terminal/iTerm、由 LaunchAgent 啟動的應用程式或 SSH 程序）。

因應方法：如果你想避免逐一授予資料夾權限，請將檔案移至 OpenClaw 工作區（`~/.openclaw/workspace`）。

如果你正在測試權限，請一律使用真正的憑證簽署。臨時簽章組建僅適用於不需要權限的快速本機執行。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS 簽署](/zh-TW/platforms/mac/signing)
