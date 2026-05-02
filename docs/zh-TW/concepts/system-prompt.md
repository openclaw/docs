---
read_when:
    - 編輯系統提示文字、工具清單，或時間/Heartbeat 區段
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示詞包含哪些內容以及如何組裝
title: 系統提示詞
x-i18n:
    generated_at: "2026-05-02T23:39:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建構自訂系統提示。此提示由 **OpenClaw 擁有**，不使用 pi-coding-agent 的預設提示。

提示由 OpenClaw 組裝，並注入每次代理執行。

Provider plugins 可以提供具快取感知的提示指引，而不取代
完整的 OpenClaw 擁有提示。Provider runtime 可以：

- 取代一小組具名核心區段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

請使用 provider 擁有的貢獻來進行模型家族專屬調整。保留舊版
`before_prompt_build` 提示變更，用於相容性或真正全域的提示
變更，而非一般 provider 行為。

OpenAI GPT-5 家族覆蓋層會保持核心執行規則精簡，並加入
模型專屬指引，涵蓋人格鎖定、精簡輸出、工具紀律、
平行查詢、交付成果涵蓋、驗證、缺失脈絡，以及
終端機工具衛生。

## 結構

提示刻意保持精簡，並使用固定區段：

- **工具**：結構化工具的真實來源提醒，以及執行階段工具使用指引。
- **執行偏向**：精簡的跟進指引：對可執行請求在同一回合採取行動，
  持續進行直到完成或受阻，從薄弱工具結果中復原，現場檢查可變狀態，
  並在最終回覆前驗證。
- **安全**：簡短護欄提醒，避免追求權力的行為或繞過監督。
- **Skills**（可用時）：告知模型如何按需載入 skill 指示。
- **OpenClaw 自我更新**：如何使用
  `config.schema.lookup` 安全檢查設定、使用 `config.patch` 修補設定、
  使用 `config.apply` 取代完整設定，並且只在使用者明確要求時執行
  `update.run`。僅限擁有者的 `gateway` 工具也會拒絕重寫
  `tools.exec.ask` / `tools.exec.security`，包括會正規化到這些受保護
  exec 路徑的舊版 `tools.bash.*` 別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：OpenClaw 文件的本機路徑（repo 或 npm 套件），以及何時閱讀。
- **工作區檔案（已注入）**：表示 bootstrap 檔案會包含在下方。
- **沙箱**（啟用時）：表示沙箱化執行階段、沙箱路徑，以及是否可使用提升權限的 exec。
- **目前日期與時間**：使用者本地時間、時區與時間格式。
- **回覆標籤**：受支援 provider 的選用回覆標籤語法。
- **Heartbeat**：當預設代理啟用 Heartbeat 時的 Heartbeat 提示與 ack 行為。
- **執行階段**：主機、作業系統、Node、模型、repo 根目錄（偵測到時）、思考層級（一行）。
- **推理**：目前可見性層級 + /reasoning 切換提示。

OpenClaw 會將大型穩定內容（包括**專案脈絡**）保留在
內部提示快取邊界上方。易變的頻道/工作階段區段，例如
Control UI 嵌入指引、**訊息**、**語音**、**群組聊天脈絡**、
**反應**、**Heartbeat** 與**執行階段**，會附加在該邊界下方，
讓具有前綴快取的本機後端可跨頻道回合重用穩定的工作區前綴。
同樣地，當接受的 schema 已攜帶該執行階段細節時，工具描述應避免
嵌入目前頻道名稱。

工具區段也包含長時間執行工作的執行階段指引：

- 對未來跟進（`check back later`、提醒、週期性工作）使用 Cron，
  而不是 `exec` sleep 迴圈、`yieldMs` 延遲技巧，或重複的 `process`
  輪詢
- 只有對現在開始並持續在背景執行的命令，才使用 `exec` / `process`
- 當啟用自動完成喚醒時，啟動命令一次，並在它輸出或失敗時依賴
  推送式喚醒路徑
- 當你需要檢查正在執行的命令時，使用 `process` 取得記錄、狀態、
  輸入或介入
- 如果任務更大，優先使用 `sessions_spawn`；子代理完成採推送式，
  且會自動向請求者公告
- 不要只為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

當啟用實驗性的 `update_plan` 工具時，工具區段也會告知模型
只將它用於非簡單的多步驟工作、確保正好一個 `in_progress` 步驟，
並避免在每次更新後重複整個計畫。

系統提示中的安全護欄是建議性質。它們會引導模型行為，但不強制執行政策。請使用工具政策、exec 核准、沙箱化與頻道允許清單進行硬性執行；操作者可按設計停用這些機制。

在具備原生核准卡片/按鈕的頻道上，執行階段提示現在會告知
代理優先依賴該原生核准 UI。只有當工具結果表示聊天核准不可用，
或手動核准是唯一途徑時，才應包含手動 `/approve` 命令。

## 提示模式

OpenClaw 可以為子代理渲染較小的系統提示。執行階段會為每次執行設定
`promptMode`（不是面向使用者的設定）：

- `full`（預設）：包含上述所有區段。
- `minimal`：用於子代理；省略 **Skills**、**記憶回想**、**OpenClaw
  自我更新**、**模型別名**、**使用者身分**、**回覆標籤**、
  **訊息**、**靜默回覆** 與 **Heartbeat**。工具、**安全**、
  工作區、沙箱、目前日期與時間（已知時）、執行階段，以及注入的
  脈絡仍可使用。
- `none`：只傳回基礎身分行。

當 `promptMode=minimal` 時，額外注入的提示會標示為**子代理脈絡**，
而不是**群組聊天脈絡**。

對於頻道自動回覆執行，當直接/群組聊天脈絡已包含已解析的
對話專屬 `NO_REPLY` 行為時，OpenClaw 可以省略通用的**靜默回覆**
區段。這可避免在全域系統提示與頻道脈絡中同時重複 token 機制。

## 提示快照

OpenClaw 會將 Codex runtime 快樂路徑的已提交提示快照保存在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下。它們會渲染
選定的 app-server thread/turn 參數，以及重建的模型綁定提示
層堆疊，用於 Telegram 直接訊息、Discord 群組與 Heartbeat 回合。該堆疊
包含從 Codex 的模型目錄/快取形狀產生的固定 Codex `gpt-5.5`
模型提示 fixture、Codex 快樂路徑權限 developer 文字、
OpenClaw developer 指示、使用者回合輸入，以及動態工具規格的參照。

使用 `pnpm prompt:snapshots:sync-codex-model` 重新整理固定的 Codex 模型提示 fixture。預設情況下，此腳本會先尋找
Codex 在 `$CODEX_HOME/models_cache.json` 的執行階段快取，接著是
`~/.codex/models_cache.json`，最後才退回到維護者 Codex
checkout 慣例位置 `~/code/codex/codex-rs/models-manager/models.json`。如果
這些來源都不存在，命令會結束且不變更已提交的 fixture。傳入
`--catalog <path>` 可從特定的 `models_cache.json`
或 `models.json` 檔案重新整理。

這些快照仍不是逐位元組一致的原始 OpenAI 請求擷取。OpenClaw 傳送 thread 與 turn
參數後，Codex 仍可在 Codex runtime 內加入 runtime 擁有的工作區脈絡，
例如 `AGENTS.md`、環境脈絡、記憶、app/plugin 指示，以及未來的協作模式
指示。

使用 `pnpm prompt:snapshots:gen` 重新產生它們，並使用
`pnpm prompt:snapshots:check` 驗證漂移。CI 會在額外的
boundary shard 中執行漂移檢查，讓提示變更與快照更新保持附著在同一個
PR。

## 工作區 bootstrap 注入

Bootstrap 檔案會經裁剪後附加在**專案脈絡**之下，讓模型不需明確讀取即可看到身分與設定檔脈絡：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- `MEMORY.md`（存在時）

除非套用檔案專屬 gate，否則所有這些檔案都會在每個回合中
**注入到脈絡視窗**。當預設代理停用 Heartbeat，或
`agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，
一般執行會省略 `HEARTBEAT.md`。保持注入檔案精簡，尤其是
`MEMORY.md`，它可能隨時間增長，導致非預期的高脈絡用量與更頻繁的
Compaction。

當工作階段在原生 Codex harness 上執行時，Codex 會透過自己的
專案文件探索載入 `AGENTS.md`。OpenClaw 仍會解析其餘
bootstrap 檔案，並將它們作為 Codex 設定指示轉送，因此 `SOUL.md`、
`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 與
`MEMORY.md` 會維持相同的工作區脈絡角色，而不重複
`AGENTS.md`。

<Note>
`memory/*.md` 每日檔案**不是**一般 bootstrap 專案脈絡的一部分。在一般回合中，它們會透過 `memory_search` 和 `memory_get` 工具按需存取，因此除非模型明確讀取它們，否則不會計入脈絡視窗。裸 `/new` 和 `/reset` 回合是例外：執行階段可將最近的每日記憶作為一次性的啟動脈絡區塊，前置到該第一回合。
</Note>

大型檔案會以標記截斷。每個檔案的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（預設：12000）。跨檔案注入的
bootstrap 內容總量由 `agents.defaults.bootstrapTotalMaxChars` 限制
（預設：60000）。缺失檔案會注入簡短的缺失檔案標記。發生截斷時，
OpenClaw 可在專案脈絡中注入警告區塊；使用
`agents.defaults.bootstrapPromptTruncationWarning` 控制此行為（`off`、`once`、`always`；
預設：`once`）。

子代理工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他 bootstrap 檔案
會被濾除，以保持子代理脈絡精簡）。

內部 hook 可透過 `agent:bootstrap` 攔截此步驟，以變更或取代
注入的 bootstrap 檔案（例如將 `SOUL.md` 換成替代人格）。

如果你想讓代理聽起來不那麼泛用，請從
[SOUL.md 人格指南](/zh-TW/concepts/soul) 開始。

若要檢查每個注入檔案貢獻多少內容（原始與注入、截斷，以及工具 schema 額外負擔），請使用 `/context list` 或 `/context detail`。請參閱[脈絡](/zh-TW/concepts/context)。

## 時間處理

當使用者時區已知時，系統提示會包含專用的**目前日期與時間**區段。
為保持提示快取穩定，現在只會包含**時區**（不包含動態時鐘或時間格式）。

當代理需要目前時間時，請使用 `session_status`；狀態卡片包含
時間戳記行。同一工具也可選擇設定每工作階段的模型覆蓋
（`model=default` 會清除它）。

設定項目：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

完整行為細節請參閱[日期與時間](/zh-TW/date-time)。

## Skills

當存在符合資格的 skills 時，OpenClaw 會注入精簡的**可用 skills 清單**
（`formatSkillsForPrompt`），其中包含每個 skill 的**檔案路徑**。提示會
指示模型使用 `read` 載入列出位置（工作區、受管理或 bundled）中的
SKILL.md。若沒有符合資格的 skills，則會省略 Skills 區段。

資格包含 skill metadata gates、執行階段環境/設定檢查，以及設定
`agents.defaults.skills` 或 `agents.list[].skills` 時的有效代理 skill 允許清單。

Plugin-bundled skills 只有在其所屬 plugin 啟用時才符合資格。
這讓工具 plugins 能揭露更深入的操作指南，而不需將所有
指引直接嵌入每個工具描述。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

這會讓基礎提示保持精簡，同時仍能啟用目標式 skill 使用。

skills 清單預算由 skills 子系統擁有：

- 全域預設：`skills.limits.maxSkillsPromptChars`
- 每代理覆蓋：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界執行階段摘錄使用不同介面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

這樣的拆分會將 Skills 大小設定與執行階段讀取／注入大小設定分開，例如 `memory_get`、即時工具結果，以及 Compaction 後的 AGENTS.md 重新整理。

## 文件

系統提示包含一個 **文件** 區段。當本機文件可用時，它會指向本機 OpenClaw 文件目錄（Git checkout 中的 `docs/`，或 bundled npm package docs）。如果本機文件不可用，則會退回到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一區段也包含 OpenClaw 原始碼位置。Git checkouts 會公開本機原始碼根目錄，讓代理程式可以直接檢查程式碼。套件安裝會包含 GitHub 原始碼 URL，並告知代理程式在文件不完整或過時時到該處檢閱原始碼。提示也會註明公開文件鏡像、社群 Discord，以及用於探索 Skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。它會告知模型，對於 OpenClaw 行為、命令、設定或架構，應先查閱文件，並在可行時自行執行 `openclaw status`（只有在缺乏存取權時才詢問使用者）。特別針對設定，它會將代理程式指向 `gateway` 工具動作 `config.schema.lookup`，以取得精確的欄位層級文件與限制，然後再參閱 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 取得更廣泛的指引。

## 相關

- [代理程式執行階段](/zh-TW/concepts/agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [Context engine](/zh-TW/concepts/context-engine)
