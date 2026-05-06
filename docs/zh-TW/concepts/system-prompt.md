---
read_when:
    - 編輯系統提示文字、工具清單或時間/Heartbeat 區段
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示詞包含哪些內容以及如何組裝
title: 系統提示詞
x-i18n:
    generated_at: "2026-05-06T02:46:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建構自訂系統提示。該提示由 **OpenClaw 擁有**，且不使用 pi-coding-agent 預設提示。

提示由 OpenClaw 組裝，並注入到每次代理執行中。

提供者 Plugin 可以貢獻具快取感知能力的提示指引，而不取代
完整的 OpenClaw 擁有提示。提供者執行階段可以：

- 取代一小組具名核心區段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

使用提供者擁有的貢獻來進行特定模型系列的調校。保留舊版
`before_prompt_build` 提示變異以便相容，或用於真正全域的提示
變更，而不是一般提供者行為。

OpenAI GPT-5 系列覆蓋層會保持核心執行規則精簡，並新增
模型特定指引，涵蓋角色鎖定、精簡輸出、工具紀律、
平行查詢、交付項目覆蓋、驗證、缺少上下文，以及
終端工具衛生。

## 結構

提示刻意保持精簡，並使用固定區段：

- **工具**：結構化工具真實來源提醒，加上執行階段工具使用指引。
- **執行傾向**：精簡的貫徹指引：對可操作請求在當回合內行動、
  持續直到完成或受阻、從較弱的工具結果復原、即時檢查可變狀態，
  並在最終回覆前驗證。
- **安全性**：簡短的防護提醒，避免追求權力的行為或繞過監督。
- **Skills**（可用時）：告訴模型如何按需載入 skill 指令。
- **OpenClaw 自我更新**：如何用
  `config.schema.lookup` 安全檢查設定、用 `config.patch` 修補設定、
  用 `config.apply` 取代完整設定，以及只在使用者明確要求時執行
  `update.run`。僅限擁有者的 `gateway` 工具也會拒絕重寫
  `tools.exec.ask` / `tools.exec.security`，包括會正規化到那些受保護 exec 路徑的舊版
  `tools.bash.*`
  別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：OpenClaw 文件的本機路徑（repo 或 npm 套件）以及何時閱讀。
- **工作區檔案（已注入）**：表示啟動檔案已包含在下方。
- **沙箱**（啟用時）：表示沙箱化執行階段、沙箱路徑，以及是否可使用提升權限的 exec。
- **目前日期與時間**：僅時區（快取穩定；即時時鐘來自 `session_status`）。
- **回覆標籤**：支援提供者的選用回覆標籤語法。
- **Heartbeats**：預設代理啟用 Heartbeat 時的 Heartbeat 提示與 ack 行為。
- **執行階段**：主機、作業系統、node、模型、repo 根目錄（偵測到時）、思考層級（一行）。
- **推理**：目前可見性層級 + /reasoning 切換提示。

OpenClaw 會將大型穩定內容（包括**專案上下文**）保留在
內部提示快取邊界上方。易變的頻道/工作階段區段，例如
Control UI 嵌入指引、**訊息**、**語音**、**群組聊天上下文**、
**反應**、**Heartbeats** 和**執行階段**，會附加在該邊界下方，
讓具前綴快取的本機後端能在各頻道回合間重用穩定工作區前綴。
同樣地，當已接受的 schema 已攜帶該執行階段細節時，工具描述也應避免嵌入目前
頻道名稱。

工具區段也包含長時間執行工作的執行階段指引：

- 對未來後續追蹤（`check back later`、提醒、週期性工作）使用 cron，
  而不是 `exec` 睡眠迴圈、`yieldMs` 延遲技巧或重複的 `process`
  輪詢
- 只對現在開始並在背景持續執行的命令使用 `exec` / `process`
- 啟用自動完成喚醒時，只啟動命令一次，並在它輸出或失敗時依賴
  推播式喚醒路徑
- 當你需要檢查執行中的命令時，使用 `process` 取得記錄、狀態、輸入或介入
- 如果任務較大，偏好使用 `sessions_spawn`；子代理完成是
  推播式，並會自動向請求者公告
- 不要只為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

啟用實驗性 `update_plan` 工具時，工具區段也會告訴
模型只在非瑣碎的多步驟工作中使用它、精確保持一個
`in_progress` 步驟，並避免每次更新後重複整個計畫。

系統提示中的安全防護是建議性的。它們引導模型行為，但不強制執行政策。請使用工具政策、exec 核准、沙箱化與頻道 allowlist 進行硬性執行；操作員可依設計停用這些機制。

在具有原生核准卡片/按鈕的頻道上，執行階段提示現在會告訴
代理先依賴該原生核准 UI。只有在工具結果表示聊天核准不可用，或
手動核准是唯一路徑時，才應包含手動
`/approve` 命令。

## 提示模式

OpenClaw 可以為子代理呈現較小的系統提示。執行階段會為每次執行設定
`promptMode`（不是面向使用者的設定）：

- `full`（預設）：包含上述所有區段。
- `minimal`：用於子代理；省略 **Skills**、**記憶回想**、**OpenClaw
  自我更新**、**模型別名**、**使用者身分**、**回覆標籤**、
  **訊息**、**靜默回覆** 和 **Heartbeats**。工具、**安全性**、
  工作區、沙箱、目前日期與時間（已知時）、執行階段，以及已注入的
  上下文仍可用。
- `none`：只回傳基本身分行。

當 `promptMode=minimal` 時，額外注入的提示會標示為**子代理
上下文**，而不是**群組聊天上下文**。

對於頻道自動回覆執行，當直接/群組聊天上下文已包含已解析的
對話特定 `NO_REPLY` 行為時，OpenClaw 可以省略通用的**靜默回覆**
區段。這避免在全域系統提示和頻道上下文中同時重複權杖機制。

## 提示快照

OpenClaw 會在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留已提交的 Codex 執行階段快樂路徑提示快照。它們會呈現
選定的 app-server thread/turn 參數，加上重建的模型繫結提示
層堆疊，涵蓋 Telegram 直接訊息、Discord 群組和 Heartbeat 回合。該堆疊
包含從 Codex 模型目錄/快取形狀產生的固定 Codex `gpt-5.5` 模型提示 fixture、
Codex 快樂路徑權限開發者文字、OpenClaw 開發者指令、
OpenClaw 提供時的回合範圍協作模式指令、
使用者回合輸入，以及動態工具規格的參照。

使用
`pnpm prompt:snapshots:sync-codex-model` 重新整理固定的 Codex 模型提示 fixture。預設情況下，腳本會尋找
Codex 在 `$CODEX_HOME/models_cache.json` 的執行階段快取，接著是
`~/.codex/models_cache.json`，最後才退回到維護者 Codex
checkout 慣例位置 `~/code/codex/codex-rs/models-manager/models.json`。如果
這些來源都不存在，命令會在不變更已提交
fixture 的情況下結束。傳入 `--catalog <path>` 可從特定的 `models_cache.json`
或 `models.json` 檔案重新整理。

這些快照仍然不是逐位元組一致的原始 OpenAI 請求擷取。Codex
可在 OpenClaw 傳送 thread 與 turn 參數後，在 Codex 執行階段內新增執行階段擁有的工作區上下文，例如 `AGENTS.md`、環境
上下文、記憶、app/Plugin 指令，以及內建的 Default
協作模式指令。

使用 `pnpm prompt:snapshots:gen` 重新產生它們，並用
`pnpm prompt:snapshots:check` 驗證漂移。CI 會在額外的
邊界 shard 中執行漂移檢查，讓提示變更與快照更新保持附著於同一個
PR。

## 工作區啟動注入

啟動檔案會被修剪並附加在**專案上下文**下，讓模型無需明確讀取即可看到身分與設定檔上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- `MEMORY.md`（存在時）

除非套用檔案特定閘門，否則所有這些檔案都會在每個回合中**注入到上下文視窗**。
當預設代理停用 Heartbeat，或
`agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，
正常執行會省略 `HEARTBEAT.md`。請保持注入檔案精簡，尤其是
`MEMORY.md`，它會隨時間成長，並導致非預期的高上下文使用量與更頻繁的 Compaction。

當工作階段在原生 Codex harness 上執行時，Codex 會透過自己的專案文件探索載入 `AGENTS.md`。
OpenClaw 仍會解析其餘
啟動檔案，並將它們作為 Codex 設定指令轉送，因此 `SOUL.md`、
`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和
`MEMORY.md` 會保持相同的工作區上下文角色，而不重複
`AGENTS.md`。

<Note>
`memory/*.md` 每日檔案**不是**一般啟動專案上下文的一部分。在一般回合中，它們會透過 `memory_search` 和 `memory_get` 工具按需存取，因此除非模型明確讀取，否則不會計入上下文視窗。裸 `/new` 和 `/reset` 回合是例外：執行階段可以將近期每日記憶作為一次性啟動上下文區塊前置到該第一回合。
</Note>

大型檔案會以標記截斷。每個檔案的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（預設：12000）。跨檔案的總注入啟動
內容上限由 `agents.defaults.bootstrapTotalMaxChars`
控制（預設：60000）。缺少的檔案會注入簡短的缺檔標記。發生截斷時，
OpenClaw 可以注入精簡的系統提示警告通知；使用
`agents.defaults.bootstrapPromptTruncationWarning` 控制此行為（`off`、`once`、`always`；
預設：`once`）。詳細的原始/注入計數會保留在診斷中，例如
`/context`、`/status`、doctor 和記錄。

子代理工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動檔案
會被過濾掉，以保持子代理上下文較小）。

內部 hook 可透過 `agent:bootstrap` 攔截此步驟，以變異或取代
已注入的啟動檔案（例如將 `SOUL.md` 換成替代人格）。

如果你想讓代理聽起來不那麼通用，請從
[SOUL.md 人格指南](/zh-TW/concepts/soul)開始。

若要檢查每個注入檔案貢獻多少內容（原始與注入、截斷，加上工具 schema 開銷），請使用 `/context list` 或 `/context detail`。請參閱[上下文](/zh-TW/concepts/context)。

## 時間處理

當使用者時區已知時，系統提示會包含專用的**目前日期與時間**區段。為保持提示快取穩定，它現在只包含
**時區**（沒有動態時鐘或時間格式）。

當代理需要目前時間時，請使用 `session_status`；狀態卡
包含時間戳記行。同一工具也可選擇性設定每個工作階段的模型
覆寫（`model=default` 會清除它）。

設定項目：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行為細節請參閱[日期與時間](/zh-TW/date-time)。

## Skills

當存在符合資格的 Skills 時，OpenClaw 會注入精簡的**可用 Skills 清單**
（`formatSkillsForPrompt`），其中包含每個 skill 的**檔案路徑**。提示會指示模型使用 `read` 載入列出位置（工作區、受管理或內建）的 SKILL.md。如果沒有符合資格的 Skills，則會省略
Skills 區段。

資格包括 skill metadata gates、執行階段環境/設定檢查，
以及在設定 `agents.defaults.skills` 或
`agents.list[].skills` 時生效的代理 skill allowlist。

Plugin 內建 Skills 只有在其擁有的 Plugin 啟用時才符合資格。
這讓工具 Plugin 可以公開更深入的操作指南，而不必將所有
該指引直接嵌入每個工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

這會保持基礎提示精簡，同時仍啟用目標式 skill 使用。

Skills 清單預算由 Skills 子系統擁有：

- 全域預設值：`skills.limits.maxSkillsPromptChars`
- 每個代理程式覆寫：`agents.list[].skillsLimits.maxSkillsPromptChars`

一般有界限的執行階段摘錄使用不同介面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

這種分離讓 Skills 大小設定與執行階段讀取/注入大小設定彼此獨立，例如 `memory_get`、即時工具結果，以及 Compaction 後的 AGENTS.md 重新整理。

## 文件

系統提示包含 **文件** 區段。當本機文件可用時，它會指向本機 OpenClaw 文件目錄（Git checkout 中的 `docs/`，或隨附的 npm 套件文件）。如果本機文件不可用，則會退回到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一區段也包含 OpenClaw 原始碼位置。Git checkout 會公開本機原始碼根目錄，讓代理程式可以直接檢查程式碼。套件安裝會包含 GitHub 原始碼 URL，並告知代理程式在文件不完整或過時時前往該處檢閱原始碼。提示也會提及公開文件鏡像、社群 Discord，以及用於 Skills 探索的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。它會告訴模型，針對 OpenClaw 行為、命令、組態或架構，應先查閱文件，並在可行時自行執行 `openclaw status`（只有在缺乏存取權時才詢問使用者）。特別針對組態，它會指引代理程式使用 `gateway` 工具動作 `config.schema.lookup` 取得精確的欄位層級文件與限制，然後再參閱 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 取得更廣泛的指引。

## 相關

- [代理程式執行階段](/zh-TW/concepts/agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [Context engine](/zh-TW/concepts/context-engine)
