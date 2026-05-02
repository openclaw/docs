---
read_when:
    - 編輯系統提示詞文字、工具清單或時間/Heartbeat 區段
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示包含哪些內容，以及如何組裝
title: 系統提示
x-i18n:
    generated_at: "2026-05-02T22:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建構自訂系統提示。此提示由 **OpenClaw 擁有**，不使用 pi-coding-agent 預設提示。

提示由 OpenClaw 組裝，並注入每次代理執行。

提供者 Plugin 可以貢獻具快取感知能力的提示指引，而不取代完整的 OpenClaw 擁有提示。提供者執行階段可以：

- 取代一小組具名核心區段（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

請將提供者擁有的貢獻用於模型系列特定調校。保留舊版 `before_prompt_build` 提示變異功能，用於相容性或真正全域性的提示變更，而不是一般提供者行為。

OpenAI GPT-5 系列覆蓋層會讓核心執行規則保持精簡，並加入模型特定指引，涵蓋角色固定、精簡輸出、工具紀律、平行查詢、交付項覆蓋、驗證、缺少脈絡，以及終端機工具衛生。

## 結構

提示刻意保持精簡，並使用固定區段：

- **工具**：結構化工具事實來源提醒，以及執行階段工具使用指引。
- **執行偏向**：精簡的跟進指引：針對可執行請求在回合內行動、持續進行直到完成或受阻、從弱工具結果中恢復、即時檢查可變狀態，並在最終回覆前驗證。
- **安全**：簡短的護欄提醒，避免追求權力的行為或繞過監督。
- **Skills**（可用時）：告知模型如何按需載入 Skill 指示。
- **OpenClaw 自我更新**：如何使用 `config.schema.lookup` 安全檢查設定、使用 `config.patch` 修補設定、使用 `config.apply` 取代完整設定，並且只在使用者明確要求時執行 `update.run`。僅限擁有者的 `gateway` 工具也會拒絕重寫 `tools.exec.ask` / `tools.exec.security`，包含會正規化為這些受保護執行路徑的舊版 `tools.bash.*` 別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：OpenClaw 文件的本機路徑（repo 或 npm 套件），以及何時閱讀。
- **工作區檔案（已注入）**：表示啟動檔案已包含於下方。
- **沙盒**（啟用時）：表示沙盒化執行階段、沙盒路徑，以及是否可用提升權限的 exec。
- **目前日期與時間**：使用者本地時間、時區與時間格式。
- **回覆標籤**：支援提供者的選用回覆標籤語法。
- **Heartbeat**：預設代理啟用 Heartbeat 時的 Heartbeat 提示與確認行為。
- **執行階段**：主機、作業系統、node、模型、repo 根目錄（偵測到時）、思考層級（一行）。
- **推理**：目前可見性層級 + /reasoning 切換提示。

OpenClaw 會將大型穩定內容（包含 **專案脈絡**）保留在內部提示快取邊界上方。易變的頻道/工作階段區段，例如 Control UI 嵌入指引、**訊息**、**語音**、**群組聊天脈絡**、**反應**、**Heartbeat** 與 **執行階段**，會附加在該邊界下方，讓具備前綴快取的本機後端能在不同頻道回合間重用穩定的工作區前綴。同樣地，當接受的 schema 已承載該執行階段細節時，工具描述也應避免嵌入目前頻道名稱。

工具區段也包含長時間執行工作的執行階段指引：

- 將 Cron 用於未來跟進（`check back later`、提醒、週期性工作），而不是 `exec` 睡眠迴圈、`yieldMs` 延遲技巧，或重複的 `process` 輪詢
- 只將 `exec` / `process` 用於現在啟動並在背景持續執行的命令
- 啟用自動完成喚醒時，只啟動命令一次，並在其輸出或失敗時依賴推送式喚醒路徑
- 當需要檢查執行中命令的記錄、狀態、輸入或介入時，使用 `process`
- 如果任務較大，優先使用 `sessions_spawn`；子代理完成是推送式的，並會自動向請求者回報
- 不要只是為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

啟用實驗性 `update_plan` 工具時，工具區段也會告知模型僅將其用於非瑣碎的多步驟工作、精確保持一個 `in_progress` 步驟，並避免在每次更新後重複整份計畫。

系統提示中的安全護欄屬於建議性質。它們引導模型行為，但不強制執行政策。請使用工具政策、exec 核准、沙盒化與頻道 allowlist 進行硬性強制；操作員可以依設計停用這些機制。

在具備原生核准卡片/按鈕的頻道上，執行階段提示現在會告知代理優先依賴該原生核准 UI。只有在工具結果表示聊天核准不可用，或手動核准是唯一路徑時，才應包含手動 `/approve` 命令。

## 提示模式

OpenClaw 可以為子代理轉譯較小的系統提示。執行階段會為每次執行設定 `promptMode`（不是使用者可見設定）：

- `full`（預設）：包含上述所有區段。
- `minimal`：用於子代理；省略 **Skills**、**記憶回想**、**OpenClaw 自我更新**、**模型別名**、**使用者身分**、**回覆標籤**、**訊息**、**靜默回覆** 與 **Heartbeat**。工具、**安全**、工作區、沙盒、目前日期與時間（已知時）、執行階段，以及注入的脈絡仍會保留。
- `none`：只回傳基礎身分行。

當 `promptMode=minimal` 時，額外注入的提示會標示為 **子代理脈絡**，而不是 **群組聊天脈絡**。

對於頻道自動回覆執行，當直接/群組聊天脈絡已包含已解析的對話特定 `NO_REPLY` 行為時，OpenClaw 可以省略通用的 **靜默回覆** 區段。這可避免在全域系統提示和頻道脈絡中重複 token 機制。

## 提示快照

OpenClaw 會在 `test/fixtures/agents/prompt-snapshots/happy-path/` 下保留已提交的 Codex/message-tool 執行階段 happy-path 提示快照。它們會轉譯選定的 app-server thread/turn 參數，以及重建的模型綁定提示層堆疊，用於 Telegram 直接訊息、Discord 群組與 Heartbeat 回合。該堆疊包含從 Codex 模型目錄/快取形狀產生的固定 Codex `gpt-5.5` 模型提示 fixture、Codex happy-path 權限開發者文字、OpenClaw 開發者指示、使用者回合輸入，以及動態工具規格的參照。

使用 `pnpm prompt:snapshots:sync-codex-model` 重新整理固定的 Codex 模型提示 fixture。預設情況下，腳本會先尋找 `$CODEX_HOME/models_cache.json` 中的 Codex 執行階段快取，接著尋找 `~/.codex/models_cache.json`，最後才退回到維護者 Codex checkout 慣例位置 `~/code/codex/codex-rs/models-manager/models.json`。如果這些來源都不存在，命令會結束且不變更已提交的 fixture。傳入 `--catalog <path>` 可從特定 `models_cache.json` 或 `models.json` 檔案重新整理。

這些快照仍不是逐位元組相同的原始 OpenAI 請求擷取。Codex 可以在 OpenClaw 送出 thread 和 turn 參數後，在 Codex 執行階段內加入執行階段擁有的工作區脈絡，例如 `AGENTS.md`、環境脈絡、記憶、應用程式/Plugin 指示，以及未來的協作模式指示。

使用 `pnpm prompt:snapshots:gen` 重新產生它們，並使用 `pnpm prompt:snapshots:check` 驗證漂移。CI 會在額外的 boundary shard 中執行漂移檢查，讓提示變更與快照更新保持附著於同一個 PR。

## 工作區啟動注入

啟動檔案會被修剪並附加在 **專案脈絡** 下，讓模型無需明確讀取即可看到身分與設定檔脈絡：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- `MEMORY.md`（存在時）

除非套用檔案特定 gate，否則這些檔案全都會在每個回合**注入脈絡視窗**。當預設代理停用 Heartbeat，或 `agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，正常執行會省略 `HEARTBEAT.md`。請讓注入檔案保持精簡，尤其是 `MEMORY.md`，它可能會隨時間成長，導致出乎預期的高脈絡使用量與更頻繁的 Compaction。

<Note>
`memory/*.md` 每日檔案**不是**一般啟動專案脈絡的一部分。在普通回合中，它們會透過 `memory_search` 和 `memory_get` 工具按需存取，因此除非模型明確讀取，否則不會計入脈絡視窗。裸 `/new` 和 `/reset` 回合是例外：執行階段可以將近期每日記憶作為一次性啟動脈絡區塊前置於該第一個回合。
</Note>

大型檔案會以標記截斷。每個檔案的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（預設：12000）。跨檔案注入的啟動內容總量上限由 `agents.defaults.bootstrapTotalMaxChars` 控制（預設：60000）。缺少檔案會注入簡短的缺少檔案標記。發生截斷時，OpenClaw 可以在專案脈絡中注入警告區塊；可用 `agents.defaults.bootstrapPromptTruncationWarning` 控制此行為（`off`、`once`、`always`；預設：`once`）。

子代理工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動檔案會被過濾掉，以保持子代理脈絡精簡）。

內部 hook 可以透過 `agent:bootstrap` 攔截此步驟，以變異或取代注入的啟動檔案（例如將 `SOUL.md` 換成替代人格）。

如果你想讓代理聽起來較不通用，請從 [SOUL.md 人格指南](/zh-TW/concepts/soul) 開始。

若要檢查每個注入檔案貢獻多少內容（原始與注入、截斷，加上工具 schema 開銷），請使用 `/context list` 或 `/context detail`。請參閱 [脈絡](/zh-TW/concepts/context)。

## 時間處理

當使用者時區已知時，系統提示會包含專用的 **目前日期與時間** 區段。為了讓提示快取保持穩定，現在它只包含**時區**（不包含動態時鐘或時間格式）。

當代理需要目前時間時，請使用 `session_status`；狀態卡片包含時間戳記行。同一工具也可以選擇性地設定每工作階段模型覆寫（`model=default` 會清除它）。

使用以下項目設定：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

請參閱 [日期與時間](/zh-TW/date-time) 以取得完整行為細節。

## Skills

當存在符合資格的 Skills 時，OpenClaw 會注入精簡的**可用 Skills 清單**（`formatSkillsForPrompt`），其中包含每個 Skill 的**檔案路徑**。提示會指示模型使用 `read` 載入列出位置（工作區、受管理或內建）中的 SKILL.md。如果沒有符合資格的 Skills，則會省略 Skills 區段。

資格包含 Skill 中繼資料 gate、執行階段環境/設定檢查，以及設定 `agents.defaults.skills` 或 `agents.list[].skills` 時的有效代理 Skill allowlist。

Plugin 內建 Skills 只有在其擁有的 Plugin 啟用時才符合資格。這讓工具 Plugin 能公開更深入的操作指南，而不必將所有指引直接嵌入每個工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

這會讓基礎提示保持精簡，同時仍啟用目標式 Skill 使用。

Skills 清單預算由 Skills 子系統擁有：

- 全域預設：`skills.limits.maxSkillsPromptChars`
- 每代理覆寫：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用有界執行階段摘錄使用不同介面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

此分離讓 Skills 大小設定與執行階段讀取/注入大小設定保持分開，例如 `memory_get`、即時工具結果，以及 Compaction 後的 AGENTS.md 重新整理。

## 文件

系統提示包含一個 **文件** 區段。當本機文件可用時，它會指向本機 OpenClaw 文件目錄（Git checkout 中的 `docs/`，或隨附 npm 套件的文件）。如果本機文件不可用，則會改用
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一區段也包含 OpenClaw 原始碼位置。Git checkout 會公開本機原始碼根目錄，讓代理可以直接檢查程式碼。套件安裝則包含 GitHub 原始碼 URL，並指示代理在文件不完整或過時時到該處檢閱原始碼。提示也會提及公開文件鏡像、社群 Discord，以及用於探索 Skills 的 ClawHub
([https://clawhub.ai](https://clawhub.ai))。它會指示模型在處理 OpenClaw 行為、命令、設定或架構時先查閱文件，並在可行時自行執行 `openclaw status`（只有在缺乏存取權時才詢問使用者）。
特別針對設定，它會指引代理使用 `gateway` 工具動作
`config.schema.lookup` 取得精確的欄位層級文件與限制，然後再參閱
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
以取得更廣泛的指引。

## 相關

- [代理執行階段](/zh-TW/concepts/agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [上下文引擎](/zh-TW/concepts/context-engine)
