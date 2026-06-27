---
read_when:
    - 偵錯 macOS 權限提示缺失或卡住問題
    - 決定是否授予 node 或命令列介面執行階段「輔助使用」權限
    - 封裝或簽署 macOS 應用程式
    - 變更 bundle ID 或應用程式安裝路徑
summary: macOS 權限持久性 (TCC) 與簽署要求
title: macOS 權限
x-i18n:
    generated_at: "2026-06-27T19:32:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 權限授予很脆弱。TCC 會將權限授予與應用程式的程式碼簽章、套件識別碼和磁碟上的路徑關聯。如果其中任何一項改變，macOS 會將該應用程式視為新的應用程式，並可能丟棄或隱藏提示。

## 穩定權限的需求

- 相同路徑：從固定位置執行應用程式（對 OpenClaw 而言是 `dist/OpenClaw.app`）。
- 相同套件識別碼：變更套件 ID 會建立新的權限身分。
- 已簽署的應用程式：未簽署或 ad-hoc 簽署的建置不會保留權限。
- 一致的簽章：使用真正的 Apple Development 或 Developer ID 憑證，讓簽章在重新建置之間保持穩定。

Ad-hoc 簽章會在每次建置時產生新的身分。macOS 會忘記先前的授予，而且提示可能會完全消失，直到清除過期項目為止。

## Node 和命令列介面執行階段的輔助使用權授予

偏好將輔助使用權授予 OpenClaw.app、Peekaboo.app，或另一個具有自身套件識別碼的已簽署輔助程式，而不是通用的 `node` 二進位檔。

macOS TCC 會將輔助使用權授予它看到的程序程式碼身分。如果 Homebrew、nvm、pnpm 或 npm 工作流程導致共用的 `node` 可執行檔收到輔助使用權，透過同一個可執行檔啟動的任何 JavaScript 套件都可能繼承 GUI 自動化權限。

將「系統設定」中的 `node` 項目視為該 Node 執行階段的廣泛權限，而不是單一 npm 套件的權限。除非你信任透過該確切 Node 安裝啟動的每個指令碼和套件，否則請避免將輔助使用權授予 `node`。

如果你不小心將輔助使用權授予 `node`，請從「系統設定 -> 隱私權與安全性 -> 輔助使用權」移除該項目。接著將權限授予應該擁有 UI 自動化的已簽署應用程式或輔助程式。

## 提示消失時的復原檢查清單

1. 結束應用程式。
2. 在「系統設定 -> 隱私權與安全性」中移除應用程式項目。
3. 從相同路徑重新啟動應用程式，並重新授予權限。
4. 如果提示仍未出現，請使用 `tccutil` 重設 TCC 項目後再試一次。
5. 有些權限只有在完整重新啟動 macOS 後才會再次出現。

重設範例（視需要替換套件 ID）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 檔案和資料夾權限（桌面/文件/下載）

macOS 也可能對終端機/背景程序限制桌面、文件和下載。如果檔案讀取或目錄列表卡住，請將存取權授予執行檔案操作的相同程序情境（例如 Terminal/iTerm、由 LaunchAgent 啟動的應用程式，或 SSH 程序）。

因應方式：如果你想避免逐一授予資料夾權限，請將檔案移到 OpenClaw 工作區（`~/.openclaw/workspace`）。

如果你正在測試權限，請一律使用真正的憑證簽署。Ad-hoc 建置只適用於權限不重要的快速本機執行。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS 簽署](/zh-TW/platforms/mac/signing)
