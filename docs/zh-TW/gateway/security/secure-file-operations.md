---
read_when:
    - 變更檔案存取、封存檔解壓縮、工作區儲存或 Plugin 檔案系統輔助工具
summary: OpenClaw 如何安全地處理本機檔案存取，以及為什麼選用的 fs-safe Python 輔助工具預設停用
title: 安全檔案操作
x-i18n:
    generated_at: "2026-05-06T02:48:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw 使用 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) 處理安全敏感的本機檔案操作：受根目錄限制的讀取/寫入、原子替換、封存檔解壓縮、暫存工作區、JSON 狀態，以及祕密檔案處理。

目標是為接收不受信任路徑名稱的受信任 OpenClaw 程式碼，提供一致的**函式庫防護欄**。它不是沙箱。主機檔案系統權限、OS 使用者、容器，以及代理程式/工具政策，仍然定義真正的影響範圍。

## 預設：不使用 Python 輔助程式

OpenClaw 預設將 fs-safe POSIX Python 輔助程式設為**關閉**。

原因：

- Gateway 不應啟動常駐 Python sidecar，除非操作員明確選擇啟用；
- 許多安裝不需要額外的父目錄變更強化；
- 停用 Python 可讓套件/執行階段行為在桌面、Docker、CI 和 bundled app 環境中更可預測。

OpenClaw 只會變更預設值。如果你明確設定模式，fs-safe 會遵循該設定：

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

通用 fs-safe 名稱也可使用：`FS_SAFE_PYTHON_MODE` 和 `FS_SAFE_PYTHON`。

## 沒有 Python 時仍受保護的內容

在輔助程式關閉時，OpenClaw 仍會將 fs-safe 的 Node 路徑用於：

- 拒絕相對路徑逸出，例如 `..`、絕對路徑，以及在只允許名稱時出現的路徑分隔符；
- 透過受信任的根目錄控制代碼解析操作，而不是使用臨時的 `path.resolve(...).startsWith(...)` 檢查；
- 在要求該政策的 API 上拒絕符號連結和硬連結模式；
- 在 API 回傳或取用檔案內容時，以身分檢查開啟檔案；
- 對狀態/設定檔執行同層級暫存檔原子寫入；
- 對讀取和封存檔解壓縮設定位元組限制；
- 在 API 要求時，對祕密和狀態檔使用私人模式。

這些保護涵蓋一般 OpenClaw 威脅模型：在單一受信任操作員邊界內，受信任的 Gateway 程式碼處理不受信任的模型/Plugin/通道路徑輸入。

## Python 增加的保護

在 POSIX 上，fs-safe 的選用輔助程式會維持一個常駐 Python 程序，並針對父目錄變更使用相對於 fd 的檔案系統操作，例如重新命名、移除、mkdir、stat/list，以及部分寫入路徑。

這會縮小同 UID 競態視窗，在該視窗中，另一個程序可在驗證與變更之間替換父目錄。對於不受信任的本機程序可修改 OpenClaw 正在操作的相同目錄的主機，這是縱深防禦。

如果你的部署有這項風險，且可保證 Python 存在，請使用：

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

當輔助程式是安全態勢的一部分時，請使用 `require` 而不是 `auto`；如果輔助程式不可用，`auto` 會刻意退回僅 Node 的行為。

## Plugin 與核心指引

- 面向 Plugin 的檔案存取，在路徑來自訊息、模型輸出、設定或 Plugin 輸入時，應透過 `openclaw/plugin-sdk/*` 輔助函式，而不是原始 `fs`。
- 核心程式碼應使用 `src/infra/*` 下的本機 fs-safe wrapper，讓 OpenClaw 的程序政策一致套用。
- 封存檔解壓縮應使用 fs-safe 封存檔輔助函式，並明確設定大小、項目數、連結和目的地限制。
- 祕密應使用 OpenClaw 祕密輔助函式，或 fs-safe 祕密/私人狀態輔助函式；不要圍繞 `fs.writeFile` 自行撰寫模式檢查。
- 如果你需要對敵意本機使用者進行隔離，不要只依賴 fs-safe。請在不同 OS 使用者/主機下執行獨立 Gateway，或使用沙箱。

相關：[安全性](/zh-TW/gateway/security)、[沙箱](/zh-TW/gateway/sandboxing)、[Exec 核准](/zh-TW/tools/exec-approvals)、[祕密](/zh-TW/gateway/secrets)。
