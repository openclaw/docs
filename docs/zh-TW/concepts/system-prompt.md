---
read_when:
    - 編輯系統提示文字、工具清單或時間/Heartbeat 區段
    - 變更工作區初始化或 Skills 注入行為
summary: OpenClaw 系統提示詞的內容與組裝方式
title: 系統提示詞
x-i18n:
    generated_at: "2026-05-10T19:32:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建構自訂系統提示。此提示由 **OpenClaw 擁有**，且不使用 pi-coding-agent 預設提示。

此提示由 OpenClaw 組合，並注入每次代理執行。

提示組合分為三層：

- `buildAgentSystemPrompt` 會根據明確輸入呈現提示。它應該
  保持為純呈現器，不應直接讀取全域設定。
- `resolveAgentSystemPromptConfig` 會解析設定支援的提示調整項，例如
  擁有者顯示、TTS 提示、模型別名、記憶引用模式，以及特定代理的子代理
  委派模式。
- 執行階段配接器（嵌入式、CLI、指令/匯出預覽、Compaction）會收集
  即時事實，例如工具、沙盒狀態、頻道能力、上下文檔案，
  以及供應商提示貢獻，然後呼叫已設定的提示 facade。

這會讓匯出/除錯提示介面與即時執行保持一致，而不會
把每個執行階段特定細節都變成單一龐大的建構器。

供應商 Plugin 可以貢獻具備快取意識的提示指引，而不必取代
完整的 OpenClaw 擁有提示。供應商執行階段可以：

- 取代一小組具名核心區段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

針對模型系列特定調整，請使用供應商擁有的貢獻。保留舊版
`before_prompt_build` 提示變更，以供相容性或真正全域的提示
變更使用，而不是作為一般供應商行為。

OpenAI GPT-5 系列覆蓋層會讓核心執行規則保持精簡，並加入
模型特定指引，涵蓋角色鎖定、精簡輸出、工具紀律、
平行查詢、交付項目涵蓋、驗證、缺少上下文，以及
終端工具衛生。

## 結構

提示刻意保持精簡，並使用固定區段：

- **工具**：結構化工具真實來源提醒，加上執行階段工具使用指引。
- **執行傾向**：精簡的貫徹指引：對可執行請求在本回合採取行動、
  持續直到完成或受阻、從不佳工具結果中恢復、即時檢查可變狀態，
  並在完成前驗證。
- **安全**：簡短的防護提醒，避免追求權力的行為或繞過監督。
- **Skills**（可用時）：告訴模型如何按需載入技能指示。
- **OpenClaw 控制**：告訴模型在設定/重新啟動工作上優先使用 `gateway` 工具，
  並避免捏造 CLI 指令。
- **OpenClaw 自我更新**：如何用 `config.schema.lookup` 安全檢查設定、
  用 `config.patch` 修補設定、用 `config.apply` 取代完整設定，
  以及只在使用者明確要求時執行 `update.run`。僅擁有者可用的
  `gateway` 工具也會拒絕重寫 `tools.exec.ask` / `tools.exec.security`，
  包括會正規化為這些受保護執行路徑的舊版 `tools.bash.*` 別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：OpenClaw docs/source 的本機路徑，以及何時讀取它們。
- **工作區檔案（已注入）**：指出啟動檔案已包含於下方。
- **沙盒**（啟用時）：指出沙盒化執行階段、沙盒路徑，以及是否可使用提升權限的 exec。
- **目前日期與時間**：僅時區（快取穩定；即時時鐘來自 `session_status`）。
- **助理輸出指令**：精簡的附件、語音筆記，以及回覆標籤語法。
- **Heartbeats**：當預設代理啟用 Heartbeat 時的 Heartbeat 提示與確認行為。
- **執行階段**：主機、OS、Node、模型、repo 根目錄（偵測到時）、思考層級（一行）。
- **推理**：目前可見性層級 + /reasoning 切換提示。

OpenClaw 會把大型穩定內容（包括 **專案上下文**）保留在
內部提示快取邊界上方。容易變動的頻道/工作階段區段，例如
控制 UI 嵌入指引、**訊息**、**語音**、**群組聊天上下文**、
**反應**、**Heartbeats**，以及**執行階段**，會附加在該邊界
下方，讓具備前綴快取的本機後端能在頻道回合之間重用穩定的
工作區前綴。工具描述同樣應避免嵌入目前頻道名稱，只要已接受的
schema 已承載該執行階段細節即可。

工具區段也包含長時間執行工作的執行階段指引：

- 對未來後續追蹤（`check back later`、提醒、週期性工作）使用 Cron，
  而不是 `exec` 睡眠迴圈、`yieldMs` 延遲技巧，或重複的 `process`
  輪詢
- 只對立即開始並在背景持續執行的指令使用 `exec` / `process`
- 啟用自動完成喚醒時，只啟動一次指令，並在它輸出內容或失敗時依賴
  推送式喚醒路徑
- 需要檢查執行中指令時，使用 `process` 查看日誌、狀態、輸入或介入
- 如果任務較大，優先使用 `sessions_spawn`；子代理完成是
  推送式，並會自動向請求者宣告
- 不要為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

`agents.defaults.subagents.delegationMode` 可以強化此指引。
預設 `suggest` 模式會保留基準提示。`prefer` 會加入專門的
**子代理委派**區段，告訴主代理作為反應迅速的協調者，並將
比直接回覆更複雜的任何工作透過 `sessions_spawn` 推出。
這只影響提示；工具政策仍會控制 `sessions_spawn` 是否可用。

啟用實驗性 `update_plan` 工具時，工具區段也會告訴模型
只在非平凡的多步驟工作中使用它、精確保持一個
`in_progress` 步驟，並避免每次更新後重複整個計畫。

系統提示中的安全防護是建議性的。它們引導模型行為，但不強制執行政策。請使用工具政策、exec 核准、沙盒，以及頻道允許清單作為硬性執行；操作員可依設計停用這些機制。

在具有原生核准卡片/按鈕的頻道上，執行階段提示現在會告訴
代理優先依賴該原生核准 UI。只有當工具結果表示聊天核准不可用，
或手動核准是唯一途徑時，才應包含手動 `/approve` 指令。

## 提示模式

OpenClaw 可以為子代理呈現較小的系統提示。執行階段會為每次執行設定
`promptMode`（不是面向使用者的設定）：

- `full`（預設）：包含上方所有區段。
- `minimal`：用於子代理；省略 **記憶回想**、**OpenClaw
  自我更新**、**模型別名**、**使用者身分**、**助理輸出指令**、
  **訊息**、**靜默回覆**，以及 **Heartbeats**。工具、**安全**、
  提供時的 **Skills**、工作區、沙盒、目前日期與時間（已知時）、
  執行階段，以及已注入上下文仍會可用。
- `none`：只回傳基本身分行。

當 `promptMode=minimal` 時，額外注入的提示會標示為 **子代理
上下文**，而不是 **群組聊天上下文**。

對於頻道自動回覆執行，當直接/群組聊天上下文已包含已解析的
對話特定 `NO_REPLY` 行為時，OpenClaw 可以省略通用的**靜默回覆**
區段。這會避免在全域系統提示和頻道上下文中重複權杖機制。

## 提示快照

OpenClaw 會在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留已提交的
Codex 執行階段快樂路徑提示快照。它們會呈現選定的 app-server
thread/turn 參數，以及重建後的模型繫結提示層堆疊，涵蓋 Telegram
直接訊息、Discord 群組，以及 Heartbeat 回合。該堆疊包含從 Codex
模型目錄/快取形狀產生的固定 Codex `gpt-5.5` 模型提示 fixture、
Codex 快樂路徑權限開發者文字、OpenClaw 開發者指示、OpenClaw
提供時的回合範圍協作模式指示、使用者回合輸入，以及動態工具
規格參照。

使用 `pnpm prompt:snapshots:sync-codex-model` 重新整理固定的 Codex
模型提示 fixture。預設情況下，腳本會先尋找 Codex 執行階段快取
`$CODEX_HOME/models_cache.json`，再找 `~/.codex/models_cache.json`，
最後才退回維護者 Codex checkout 慣例位置
`~/code/codex/codex-rs/models-manager/models.json`。如果這些來源都不存在，
指令會結束且不變更已提交的 fixture。傳入 `--catalog <path>` 可從特定的
`models_cache.json` 或 `models.json` 檔案重新整理。

這些快照仍不是逐位元組相同的原始 OpenAI 請求擷取。Codex
可以在 OpenClaw 傳送 thread 和 turn 參數之後，於 Codex 執行階段內加入
執行階段擁有的工作區上下文，例如 `AGENTS.md`、環境上下文、記憶、
app/Plugin 指示，以及內建 Default 協作模式指示。

使用 `pnpm prompt:snapshots:gen` 重新產生它們，並使用
`pnpm prompt:snapshots:check` 驗證漂移。CI 會在額外的
boundary shard 中執行漂移檢查，讓提示變更與快照更新保持附著於同一個
PR。

## 工作區啟動注入

啟動檔案會被修剪並附加在 **專案上下文** 下，讓模型不需要明確讀取也能看到身分與設定檔上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- `MEMORY.md`（存在時）

所有這些檔案都會在每個回合被**注入到上下文視窗**，除非
套用特定檔案閘門。在一般執行中，當預設代理停用
Heartbeats，或 `agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，
會省略 `HEARTBEAT.md`。請保持注入檔案精簡，特別是 `MEMORY.md`。
`MEMORY.md` 預期維持為經整理的長期摘要；詳細每日筆記應放在
`memory/*.md`，讓 `memory_search` 和 `memory_get` 可按需擷取。
過大的 `MEMORY.md` 檔案會增加提示用量，且可能因下方的啟動檔案限制
而只被部分注入。

當工作階段在原生 Codex harness 上執行時，Codex 會透過自己的
專案文件探索載入 `AGENTS.md`。OpenClaw 仍會解析其餘啟動檔案，
並將它們轉送為 Codex 設定指示，因此 `SOUL.md`、`TOOLS.md`、
`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和
`MEMORY.md` 會維持相同的工作區上下文角色，而不重複
`AGENTS.md`。

<Note>
`memory/*.md` 每日檔案**不是**一般啟動專案上下文的一部分。在普通回合中，它們會透過 `memory_search` 和 `memory_get` 工具按需存取，因此除非模型明確讀取它們，否則不會計入上下文視窗。裸 `/new` 和 `/reset` 回合是例外：執行階段可以把近期每日記憶作為一次性啟動上下文區塊，前置到第一個回合。
</Note>

大型檔案會以標記截斷。每個檔案的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（預設：12000）。跨檔案的注入啟動
內容總量上限由 `agents.defaults.bootstrapTotalMaxChars`
控制（預設：60000）。缺少的檔案會注入簡短的缺檔標記。發生截斷時，
OpenClaw 可以注入精簡的系統提示警告通知；可用
`agents.defaults.bootstrapPromptTruncationWarning` 控制此行為（`off`、`once`、`always`；
預設：`once`）。詳細原始/注入計數會保留在診斷中，例如
`/context`、`/status`、doctor，以及日誌。

對記憶檔案而言，截斷不是資料遺失：檔案在磁碟上保持完整，
但模型只會看到縮短後的注入副本，直到它直接讀取或搜尋
記憶。如果 `MEMORY.md` 重複被截斷，請將它萃取為更短的
持久摘要，並將詳細歷史移至 `memory/*.md`，或有意提高啟動限制。

子代理工作階段只注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動檔案
會被過濾掉，以保持子代理上下文小）。

內部 hook 可以透過 `agent:bootstrap` 攔截此步驟，以變更或取代
已注入的啟動檔案（例如將 `SOUL.md` 替換為替代 persona）。

如果你想讓代理聽起來不那麼泛泛，可以從
[SOUL.md 個性指南](/zh-TW/concepts/soul)開始。

若要檢查每個注入檔案的貢獻量（原始與注入後、截斷，以及工具結構描述開銷），請使用 `/context list` 或 `/context detail`。請參閱[上下文](/zh-TW/concepts/context)。

## 時間處理

當使用者時區已知時，系統提示會包含專用的 **Current Date & Time** 區段。為了讓提示快取保持穩定，現在只包含**時區**（不含動態時鐘或時間格式）。

當代理需要目前時間時，請使用 `session_status`；狀態卡包含時間戳記行。同一個工具也可以選擇性設定每個工作階段的模型覆寫（`model=default` 會清除它）。

設定方式：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

完整行為細節請參閱[日期與時間](/zh-TW/date-time)。

## Skills

當存在符合資格的 Skills 時，OpenClaw 會注入精簡的**可用 Skills 清單**（`formatSkillsForPrompt`），其中包含每個 Skill 的**檔案路徑**。提示會指示模型使用 `read` 載入列出位置（工作區、受管理或隨附）中的 SKILL.md。如果沒有符合資格的 Skills，則會省略 Skills 區段。

資格包含 Skill 中繼資料閘門、執行階段環境/設定檢查，以及設定 `agents.defaults.skills` 或 `agents.list[].skills` 時的有效代理 Skill 允許清單。

Plugin 隨附的 Skills 只有在其所屬 Plugin 已啟用時才符合資格。這讓工具 Plugin 可以公開更深入的操作指南，而不必將所有指南直接嵌入每個工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

這會保持基礎提示精簡，同時仍啟用目標明確的 Skill 使用方式。

Skills 清單預算由 Skills 子系統擁有：

- 全域預設值：`skills.limits.maxSkillsPromptChars`
- 每個代理覆寫：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界執行階段摘錄使用不同介面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

這種拆分會將 Skills 大小調整與執行階段讀取/注入大小調整分開，例如 `memory_get`、即時工具結果，以及 Compaction 後的 AGENTS.md 重新整理。

## 文件

系統提示包含**文件**區段。當本機文件可用時，它會指向本機 OpenClaw 文件目錄（Git checkout 中的 `docs/` 或隨附 npm 套件文件）。如果本機文件不可用，則會退回到
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一區段也包含 OpenClaw 原始碼位置。Git checkout 會公開本機原始碼根目錄，讓代理可以直接檢查程式碼。套件安裝則包含 GitHub 原始碼 URL，並告知代理在文件不完整或過期時前往該處檢視原始碼。提示也會提及公開文件鏡像、社群 Discord，以及用於 Skills 探索的 ClawHub
([https://clawhub.ai](https://clawhub.ai))。它會告知模型，對於 OpenClaw 行為、命令、設定或架構，應先查閱文件，並在可能時自行執行 `openclaw status`（只有在缺乏存取權時才詢問使用者）。
針對設定，則會特別指引代理使用 `gateway` 工具動作 `config.schema.lookup` 取得精確的欄位層級文件和限制，然後再參閱
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
取得更廣泛的指引。

## 相關

- [代理執行階段](/zh-TW/concepts/agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [上下文引擎](/zh-TW/concepts/context-engine)
