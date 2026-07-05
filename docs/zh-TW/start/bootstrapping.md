---
read_when:
    - 了解第一次代理程式執行時會發生什麼
    - 說明啟動程序檔案所在位置
    - 偵錯入門身分設定
sidebarTitle: Bootstrapping
summary: 代理自舉程序，用於初始化工作區和身分識別檔案
title: 代理程式啟動程序
x-i18n:
    generated_at: "2026-07-05T11:43:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

啟動初始化是首次執行的儀式，會為新的代理程式工作區植入初始內容，並引導代理程式選擇身分。它只會執行一次，也就是在入門設定之後、代理程式第一次真正回合時執行。

## 會發生什麼

在全新工作區（預設 `~/.openclaw/workspace`）的第一次執行中，OpenClaw 會：

- 植入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 讓代理程式遵循 `BOOTSTRAP.md`：透過自由形式的對話（不是固定的問答表單）決定名稱、性格和風格。
- 將學到的內容寫入 `IDENTITY.md`、`USER.md` 和 `SOUL.md`。
- 一旦工作區看起來已設定好，就刪除 `BOOTSTRAP.md`，讓這個儀式只執行一次。

當 `SOUL.md`、`IDENTITY.md` 或 `USER.md` 已偏離其初始範本，或存在 `memory/` 資料夾時，工作區就會被視為已設定。

<Note>
`BOOTSTRAP.md` 涵蓋完整的身分對話。請參閱其內容：
[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)。
</Note>

## 嵌入式和本機模型執行

對於嵌入式或本機模型執行，OpenClaw 會將 `BOOTSTRAP.md` 排除在特權系統上下文之外。在主要互動式首次執行時，它仍會透過使用者提示傳遞檔案內容，因此即使模型無法可靠呼叫 `read` 工具，也仍能完成這個儀式。如果目前執行無法安全存取工作區，代理程式會收到簡短的有限啟動初始化提示，而不是一般問候語。

## 略過啟動初始化

若要在預先植入的工作區上略過此步驟，請執行：

```bash
openclaw onboard --skip-bootstrap
```

## 執行位置

啟動初始化一律在閘道主機上執行。如果 macOS 應用程式連線到遠端閘道，工作區及其啟動初始化檔案會位於該遠端機器上，而不是 Mac 上。

<Note>
當閘道在另一台機器上執行時，請在閘道主機上編輯工作區檔案（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相關文件

- macOS 應用程式入門設定：[入門設定](/zh-TW/start/onboarding)
- 工作區配置：[代理程式工作區](/zh-TW/concepts/agent-workspace)
- 範本內容：[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)
