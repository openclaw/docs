---
read_when:
    - 了解代理程式首次執行時會發生什麼事
    - 說明啟動設定檔案的位置
    - 偵錯新手引導身分設定
sidebarTitle: Bootstrapping
summary: 植入工作區與身分檔案的代理程式啟動初始化流程
title: 代理程式啟動初始化
x-i18n:
    generated_at: "2026-07-19T14:08:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c065534b5abe539cccfe8badc44296d890289d8ce3daa9f03a12e82adf8c091
    source_path: start/bootstrapping.md
    workflow: 16
---

啟動初始化是首次執行時的儀式，用來建立新的代理工作區，並
引導代理選擇身分。此流程只會執行一次，時間是在
新手引導完成後、代理第一次真正互動時。

## 會發生什麼事

首次使用全新工作區（預設為 `~/.openclaw/workspace`）執行時，
OpenClaw 會：

- 建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 讓代理依循最多三個節拍的誕生流程：它會提出自己的
  名字、分享一句簡短的靈魂／氛圍描述，並詢問你要使用最精簡的
  建議外掛組合，還是追求最大便利性。
- 將雙方同意的身分保存兩次：寫入 `IDENTITY.md` 和 `SOUL.md`（代理
  讀取的自身資訊），並透過 `openclaw agents set-identity` 保存（頻道
  與 UI 顯示的資訊）。
- 讀取新手引導期間已儲存的應用程式建議，不重新掃描。
  官方外掛使用 `openclaw plugins install <id>`；第三方 ClawHub
  Skills 仍須明確選擇加入。處理選擇後，代理會
  確認已儲存的提議，因此不會再次詢問。
- 工作區看起來已設定完成後，刪除 `BOOTSTRAP.md`，確保此儀式只執行一次。

只要 `SOUL.md`、`IDENTITY.md` 或 `USER.md` 已
偏離其初始範本，或存在 `memory/` 資料夾，
便會將工作區視為已設定完成。

<Note>
`BOOTSTRAP.md` 涵蓋完整的身分對話。其內容請參閱
[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)。
</Note>

## 內嵌與本機模型執行

針對內嵌或本機模型執行，OpenClaw 不會將 `BOOTSTRAP.md` 放入
具特殊權限的系統內容中。在主要互動式首次執行時，它仍會
透過使用者提示傳入檔案內容，因此即使模型無法可靠地
呼叫 `read` 工具，也能完成此儀式。如果目前的
執行無法安全存取工作區，代理會收到簡短的有限啟動初始化
說明，而非一般問候語。

## 略過啟動初始化

若要在預先建立的工作區中略過此流程，請執行：

```bash
openclaw onboard --skip-bootstrap
```

## 執行位置

啟動初始化一律在閘道主機上執行。如果 macOS 應用程式連線至
遠端閘道，工作區及其啟動初始化檔案會位於該遠端
機器，而非 Mac 上。

<Note>
當閘道在另一台機器上執行時，請在閘道
主機上編輯工作區檔案（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相關文件

- macOS 應用程式新手引導：[新手引導](/zh-TW/start/onboarding)
- 工作區配置：[代理工作區](/zh-TW/concepts/agent-workspace)
- 範本內容：[BOOTSTRAP.md 範本](/zh-TW/reference/templates/BOOTSTRAP)
