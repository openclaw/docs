---
read_when:
    - 偵錯遺失或卡住的 macOS 權限提示
    - 決定是否授予節點或命令列介面執行階段輔助使用權限
    - 封裝或簽署 macOS 應用程式
    - 變更套件組合 ID 或應用程式安裝路徑
summary: macOS 權限持續性（TCC）與簽署需求
title: macOS 權限
x-i18n:
    generated_at: "2026-07-05T11:27:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS 權限授予很脆弱。TCC 會將權限授予關聯到 App 的程式碼簽章、套件組合識別碼，以及磁碟上的路徑。如果其中任何一項變更，macOS 會把 App 視為新的 App，並可能丟棄或隱藏提示。

## 穩定權限的需求

- 相同路徑：從固定位置執行 App（對 OpenClaw 來說是 `dist/OpenClaw.app`）。
- 相同套件組合識別碼：OpenClaw 的套件組合 ID 是 `ai.openclaw.mac`；變更它會建立新的權限身分。
- 已簽署的 App：未簽署或臨時簽署的建置不會保留權限。
- 一致的簽章：使用真正的 Apple Development 或 Developer ID 憑證，讓簽章在重新建置之間保持穩定。

臨時簽章會在每次建置時產生新的身分。macOS 會忘記先前的授權，而且提示可能會完全消失，直到清除過期項目為止。

## 節點與命令列介面執行環境的輔助使用授權

建議將輔助使用授予 OpenClaw.app、Peekaboo.app，或另一個具有自身套件組合識別碼的已簽署輔助程式，而不是通用的 `node` 二進位檔。

macOS TCC 會將輔助使用授予它所看到程序的程式碼身分。如果 Homebrew、nvm、pnpm 或 npm 工作流程導致共用的 `node` 可執行檔取得輔助使用權限，任何透過同一個可執行檔啟動的 JavaScript 套件都可能繼承圖形介面自動化權限。

請將系統設定中的 `node` 項目視為該節點執行環境的廣泛權限，而不是單一 npm 套件的權限。除非你信任透過該確切節點安裝啟動的每個指令碼與套件，否則請避免將輔助使用授予 `node`。

如果你不小心將輔助使用授予 `node`，請從系統設定 -> 隱私權與安全性 -> 輔助使用中移除該項目。接著授權應該擁有 UI 自動化的已簽署 App 或輔助程式。

## 提示消失時的復原檢查清單

1. 結束 App。
2. 在系統設定 -> 隱私權與安全性中移除 App 項目。
3. 從相同路徑重新啟動 App，並重新授予權限。
4. 如果提示仍未出現，請使用 `tccutil` 重設 TCC 項目，然後再試一次。
5. 某些權限只會在完整重新啟動 macOS 後重新出現。

重設範例（使用 OpenClaw 的套件組合 ID，`ai.openclaw.mac`）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 檔案與資料夾權限（桌面/文件/下載）

macOS 也可能會限制終端機/背景程序存取桌面、文件和下載。如果讀取檔案或列出目錄時卡住，請將存取權授予執行檔案操作的相同程序環境（例如 Terminal/iTerm、由 LaunchAgent 啟動的 App，或 SSH 程序）。

替代做法：如果你想避免逐一授予資料夾權限，請將檔案移到 OpenClaw 工作區（`~/.openclaw/workspace`）。

如果你正在測試權限，請一律使用真正的憑證簽署。臨時建置只適合用於不需要權限的快速本機執行。

## 相關

- [macOS App](/zh-TW/platforms/macos)
- [macOS 簽署](/zh-TW/platforms/mac/signing)
