---
read_when:
    - 瞭解代理程式首次執行時會發生什麼事
    - 說明啟動引導檔案的所在位置
    - 偵錯初始設定身分設定
sidebarTitle: Bootstrapping
summary: 代理啟動初始化流程，用於建立工作區與身分檔案的初始內容
title: 代理啟動初始化
x-i18n:
    generated_at: "2026-07-11T21:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

啟動初始化是首次執行時的流程，會建立新代理程式工作區的初始內容，並引導代理程式選擇身分。此流程只會執行一次，也就是在完成引導設定後，代理程式第一次正式互動時執行。

## 執行內容

首次使用全新工作區（預設為 `~/.openclaw/workspace`）執行時，OpenClaw 會：

- 建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md` 的初始內容。
- 讓代理程式依照 `BOOTSTRAP.md` 進行：透過自由形式的對話（而非固定的問答表單）決定名稱、個性與風格。
- 將取得的資訊寫入 `IDENTITY.md`、`USER.md` 和 `SOUL.md`。
- 工作區完成設定後刪除 `BOOTSTRAP.md`，確保此流程只執行一次。

只要 `SOUL.md`、`IDENTITY.md` 或 `USER.md` 與其初始範本不同，或存在 `memory/` 資料夾，工作區就視為已完成設定。

<Note>
`BOOTSTRAP.md` 涵蓋完整的身分設定對話。內容請參閱
[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)。
</Note>

## 嵌入式與本機模型執行

對於嵌入式或本機模型執行，OpenClaw 不會將 `BOOTSTRAP.md` 放入具特殊權限的系統內容中。在主要互動工作階段首次執行時，仍會透過使用者提示傳入該檔案的內容，因此即使模型無法可靠地呼叫 `read` 工具，仍可完成此流程。若目前的執行無法安全地存取工作區，代理程式會收到簡短且功能受限的啟動初始化說明，而不是一般問候語。

## 略過啟動初始化

若要在已預先建立內容的工作區中略過此流程，請執行：

```bash
openclaw onboard --skip-bootstrap
```

## 執行位置

啟動初始化一律在閘道主機上執行。若 macOS 應用程式連線至遠端閘道，工作區及其啟動初始化檔案會位於該遠端機器，而非 Mac 上。

<Note>
當閘道在另一台機器上執行時，請在閘道主機上編輯工作區檔案（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相關文件

- macOS 應用程式引導設定：[引導設定](/zh-TW/start/onboarding)
- 工作區配置：[代理程式工作區](/zh-TW/concepts/agent-workspace)
- 範本內容：[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)
