---
read_when:
    - 排解未出現或卡住的 macOS 權限提示
    - 打包或簽署 macOS 應用程式
    - 變更套件 ID 或應用程式安裝路徑
summary: macOS 權限持續性 (TCC) 與簽署要求
title: macOS 權限
x-i18n:
    generated_at: "2026-04-30T03:21:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 權限授予很脆弱。TCC 會將權限授予與 App 的程式碼簽章、Bundle 識別碼和磁碟路徑關聯。如果其中任一項變更，macOS 會將 App 視為新的 App，並可能捨棄或隱藏提示。

## 穩定權限的要求

- 相同路徑：從固定位置執行 App（對 OpenClaw 而言，是 `dist/OpenClaw.app`）。
- 相同 Bundle 識別碼：變更 Bundle ID 會建立新的權限身分。
- 已簽署的 App：未簽署或使用 ad-hoc 簽署的建置不會保留權限。
- 一致的簽章：使用真正的 Apple Development 或 Developer ID 憑證，讓簽章在重新建置之間保持穩定。

Ad-hoc 簽章每次建置都會產生新的身分。macOS 會忘記先前的授權，而且提示可能會完全消失，直到清除過期項目為止。

## 提示消失時的復原檢查清單

1. 結束 App。
2. 在系統設定 -> 隱私權與安全性中移除 App 項目。
3. 從相同路徑重新啟動 App，並重新授予權限。
4. 如果提示仍未出現，請使用 `tccutil` 重設 TCC 項目後再試一次。
5. 有些權限只有在完整重新啟動 macOS 後才會再次出現。

重設範例（視需要替換 Bundle ID）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 檔案與資料夾權限（桌面/文件/下載項目）

macOS 也可能限制終端機/背景程序存取桌面、文件和下載項目。如果檔案讀取或目錄列表停滯，請將存取權授予執行檔案操作的同一程序情境（例如 Terminal/iTerm、由 LaunchAgent 啟動的 App，或 SSH 程序）。

因應方式：如果你想避免逐一授予資料夾權限，請將檔案移到 OpenClaw 工作區（`~/.openclaw/workspace`）。

如果你正在測試權限，請一律使用真正的憑證簽署。Ad-hoc 建置只適合用於權限不重要的快速本機執行。

## 相關

- [macOS App](/zh-TW/platforms/macos)
- [macOS 簽署](/zh-TW/platforms/mac/signing)
