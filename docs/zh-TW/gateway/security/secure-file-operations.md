---
read_when:
    - 變更檔案存取、封存檔解壓縮、工作區儲存，或外掛檔案系統輔助工具
summary: OpenClaw 如何安全地處理本機檔案存取，以及為什麼選用的 fs-safe Python 輔助工具預設關閉
title: 安全檔案操作
x-i18n:
    generated_at: "2026-07-05T11:20:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw 使用 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) 處理安全敏感的本機檔案操作：受根目錄限制的讀寫、原子替換、封存檔解壓縮、暫存工作區、JSON 狀態，以及秘密檔案處理。

它是供接收不受信任路徑名稱的受信任 OpenClaw 程式碼使用的**函式庫防護欄**，不是沙箱。主機檔案系統權限、作業系統使用者、容器，以及代理程式/工具政策，仍然定義真正的影響範圍。

## 預設：沒有 Python 輔助程式

OpenClaw 預設將 fs-safe POSIX Python 輔助程式設為**關閉**：

- 閘道不應產生持續執行的 Python sidecar，除非操作員選擇啟用；
- 多數安裝不需要額外的父目錄變更強化；
- 停用 Python 可讓桌面、Docker、CI 和 bundled-app 環境中的執行階段行為保持可預測。

OpenClaw 只變更_預設值_。明確設定一律優先：

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter path.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

通用 fs-safe 環境變數名稱也可使用：`FS_SAFE_PYTHON_MODE` 和 `FS_SAFE_PYTHON`。

當輔助程式是你安全態勢的一部分時，請使用 `require`（不是 `auto`）；如果輔助程式無法啟動，`auto` 會靜默退回到僅 Node 行為。

## 沒有 Python 時仍受保護的項目

在輔助程式關閉時，OpenClaw 仍會取得 fs-safe 的僅 Node 防護欄：

- 拒絕相對路徑逸出（`..`）、絕對路徑，以及在只允許裸名稱時出現的路徑分隔符；
- 透過受信任的根控制代碼解析操作，而不是臨時的 `path.resolve(...).startsWith(...)` 檢查；
- 在需要該政策的 API 上拒絕符號連結和硬連結模式；
- 在 API 回傳或消耗檔案內容時，以身分檢查開啟檔案；
- 透過原子同層暫存檔 + 重新命名來寫入狀態/設定檔；
- 對讀取和封存檔解壓縮強制位元組限制；
- 在 API 要求時，對秘密和狀態檔套用私有檔案模式。

這涵蓋 OpenClaw 的一般威脅模型：受信任的閘道程式碼在單一受信任操作員邊界內，處理不受信任的模型/外掛/頻道路徑輸入。

## Python 增加的內容

在 POSIX 上，選用輔助程式會保留一個持續執行的 Python 程序，並使用相對於 fd 的檔案系統操作來進行父目錄變更：重新命名、移除、mkdir、stat/list，以及部分寫入路徑。

這會縮小同 UID 競態視窗，也就是另一個程序在驗證與變更之間替換父目錄的情況；在不受信任的本機程序可修改 OpenClaw 操作目錄的主機上，這屬於縱深防禦。

如果你的部署有這項風險，且保證 Python 存在，請設定：

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## 外掛與核心指引

- 面向外掛的檔案存取，在路徑來自訊息、模型輸出、設定或外掛輸入時，應透過 `openclaw/plugin-sdk/*` 輔助程式，而不是原始 `fs`。
- 核心程式碼應使用 `src/infra/*` 下的 fs-safe 包裝器，讓 OpenClaw 的程序政策一致套用。
- 封存檔解壓縮應使用 fs-safe 封存檔輔助程式，並明確設定大小、項目數、連結和目的地限制。
- 秘密應使用 OpenClaw 秘密輔助程式或 fs-safe 秘密/私有狀態輔助程式；不要在 `fs.writeFile` 周圍自行實作模式檢查。
- 對於敵意本機使用者隔離，不要只依賴 fs-safe。請在不同作業系統使用者/主機下執行獨立閘道，或使用沙箱化。

相關：[安全性](/zh-TW/gateway/security)、[沙箱化](/zh-TW/gateway/sandboxing)、[Exec 核准](/zh-TW/tools/exec-approvals)、[秘密](/zh-TW/gateway/secrets)。
