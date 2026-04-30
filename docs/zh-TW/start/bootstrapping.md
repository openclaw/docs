---
read_when:
    - 了解首次代理執行時會發生什麼
    - 說明啟動程序檔案所在的位置
    - 偵錯入門流程中的身分設定
sidebarTitle: Bootstrapping
summary: 為工作區和身分檔案建立初始內容的代理啟動準備流程
title: 代理程式啟動初始化
x-i18n:
    generated_at: "2026-04-30T03:40:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

啟動初始化是準備 agent 工作區並收集身分詳細資料的**首次執行**儀式。它會在 onboarding 之後、agent 第一次啟動時發生。

## 啟動初始化會做什麼

在第一次 agent 執行時，OpenClaw 會啟動初始化工作區（預設為
`~/.openclaw/workspace`）：

- 建立 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md` 的初始內容。
- 執行簡短的問答儀式（一次一個問題）。
- 將身分 + 偏好寫入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成後移除 `BOOTSTRAP.md`，因此它只會執行一次。

對於嵌入式/本機模型執行，OpenClaw 會讓 `BOOTSTRAP.md` 避開
具特權的系統內容。在主要互動式首次執行時，它仍會在使用者提示中傳遞
檔案內容，讓無法可靠呼叫 `read` 工具的模型也能完成此儀式。如果目前的執行
無法安全存取工作區，agent 會收到有限的啟動初始化說明，而不是一般問候語。

## 略過啟動初始化

若要對預先植入內容的工作區略過此程序，請執行 `openclaw onboard --skip-bootstrap`。

## 執行位置

啟動初始化一律在 **gateway host** 上執行。如果 macOS app 連線到
遠端 Gateway，工作區和啟動初始化檔案會位於該遠端
機器上。

<Note>
當 Gateway 在另一台機器上執行時，請在 gateway
host 上編輯工作區檔案（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相關文件

- macOS app onboarding：[Onboarding](/zh-TW/start/onboarding)
- 工作區配置：[Agent workspace](/zh-TW/concepts/agent-workspace)
