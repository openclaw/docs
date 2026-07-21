---
read_when:
    - 瞭解代理程式首次執行時會發生什麼事
    - 說明啟動程序檔案的位置
    - 偵錯新手引導身分設定
sidebarTitle: Bootstrapping
summary: 用於初始化工作區與身分檔案的代理啟動程序
title: 代理程式啟動設定
x-i18n:
    generated_at: "2026-07-21T09:02:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: efb47e1a6a86d68aef1aa1662fe9c5def9a4e5b45649b84aeb9060bfcba21a5d
    source_path: start/bootstrapping.md
    workflow: 16
---

啟動設定是首次執行時的初始化流程，會建立新的代理工作區，並
引導代理選擇身分。此流程只會執行一次，也就是在完成
新手設定後，代理第一次真正互動時執行。

## 執行內容

首次使用全新工作區（預設為 `~/.openclaw/workspace`）執行時，
OpenClaw 會：

- 建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 讓代理依照最多三個節拍的誕生流程進行：詢問你想如何
  稱呼它、分享一句簡短的靈魂／風格描述，並詢問你想使用
  最精簡的建議外掛組合，還是享有最大便利性的組合。
- 將雙方同意的身分儲存兩次：寫入 `IDENTITY.md` 和 `SOUL.md`（代理
  用來瞭解自身的內容），以及透過 `openclaw agents set-identity` 儲存（頻道
  和使用者介面顯示的內容）。
- 讀取新手設定期間已儲存的應用程式建議，而不重新掃描。
  官方外掛使用 `openclaw plugins install <id>`；第三方 ClawHub
  skills 仍須明確選擇加入。處理完選擇後，代理會
  確認已儲存的提議，因此不會再次詢問。
- 工作區看起來已完成設定後，刪除 `BOOTSTRAP.md`，因此此流程只會執行一次。

只要 `SOUL.md`、`IDENTITY.md` 或 `USER.md` 已
不同於其初始範本，或存在 `memory/` 資料夾，工作區就會視為已完成設定。

<Note>
`BOOTSTRAP.md` 涵蓋完整的身分對話。請參閱
[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)中的內容。
</Note>

## 內嵌與本機模型執行

對於內嵌或本機模型執行，OpenClaw 不會將 `BOOTSTRAP.md` 放入
具特殊權限的系統情境中。在主要的首次互動執行期間，仍會
透過使用者提示傳入檔案內容，因此無法可靠呼叫
`read` 工具的模型仍可完成此流程。如果目前的
執行作業無法安全存取工作區，代理會收到簡短的受限啟動設定
說明，而不是通用問候語。

## 略過啟動設定

若要在預先建立的工作區中略過此流程，請執行：

```bash
openclaw onboard --skip-bootstrap
```

## 執行位置

啟動設定一律在閘道主機上執行。如果 macOS 應用程式連線至
遠端閘道，工作區及其啟動設定檔案會位於該遠端
機器，而不是 Mac 上。

<Note>
當閘道在另一台機器上執行時，請在閘道
主機上編輯工作區檔案（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相關文件

- macOS 應用程式新手設定：[新手設定](/zh-TW/start/onboarding)
- 工作區配置：[代理工作區](/zh-TW/concepts/agent-workspace)
- 範本內容：[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)
