---
read_when:
    - 編輯系統提示文字、工具清單或時間/Heartbeat 區段
    - 變更工作區初始化或 Skills 注入行為
summary: OpenClaw 系統提示詞包含的內容及其組裝方式
title: 系統提示詞
x-i18n:
    generated_at: "2026-05-02T20:46:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理程式執行建構自訂系統提示。提示由 **OpenClaw 擁有**，且不使用 pi-coding-agent 預設提示。

提示由 OpenClaw 組裝，並注入到每次代理程式執行中。

Provider Plugin 可以提供具備快取感知能力的提示指引，而不取代
完整的 OpenClaw 擁有提示。Provider runtime 可以：

- 替換一小組具名核心區段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

使用 Provider 擁有的貢獻來進行模型家族專屬調校。保留舊版
`before_prompt_build` 提示變更，用於相容性或真正全域的提示
變更，而不是一般 Provider 行為。

OpenAI GPT-5 家族 overlay 會讓核心執行規則保持精簡，並加入
模型專屬指引，涵蓋角色鎖定、精簡輸出、工具紀律、
平行查詢、交付項目涵蓋範圍、驗證、缺少脈絡，以及
終端機工具衛生。

## 結構

提示刻意保持精簡，並使用固定區段：

- **工具**：結構化工具事實來源提醒，加上執行階段工具使用指引。
- **執行偏向**：精簡的貫徹指引：在本輪中處理
  可執行的請求，持續到完成或受阻，從不理想的工具
  結果中復原，即時檢查可變狀態，並在最終回覆前驗證。
- **安全**：簡短的護欄提醒，避免追求權力的行為或繞過監督。
- **Skills**（可用時）：告訴模型如何依需求載入 skill 指示。
- **OpenClaw 自我更新**：如何使用
  `config.schema.lookup` 安全檢查設定、用 `config.patch` 修補設定、
  用 `config.apply` 取代完整設定，並且只在使用者明確要求時執行
  `update.run`。僅限擁有者的 `gateway` 工具也會拒絕重寫
  `tools.exec.ask` / `tools.exec.security`，包括會正規化到這些受保護
  exec 路徑的舊版 `tools.bash.*` 別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：OpenClaw 文件的本機路徑（repo 或 npm package），以及何時閱讀。
- **工作區檔案（已注入）**：表示 bootstrap 檔案已包含在下方。
- **沙箱**（啟用時）：表示沙箱化執行階段、沙箱路徑，以及是否可用提升權限的 exec。
- **目前日期與時間**：使用者本地時間、時區與時間格式。
- **回覆標籤**：支援 Provider 的選用回覆標籤語法。
- **Heartbeats**：當預設代理程式啟用 Heartbeat 時，Heartbeat 提示與確認行為。
- **執行階段**：主機、OS、Node、模型、repo root（偵測到時）、thinking level（單行）。
- **推理**：目前可見性層級 + /reasoning 切換提示。

OpenClaw 會將大型穩定內容（包括 **專案脈絡**）保留在
內部提示快取邊界上方。易變的 channel/session 區段，例如
Control UI embed 指引、**訊息**、**語音**、**群組聊天脈絡**、
**反應**、**Heartbeats** 與 **執行階段**，會附加在該邊界下方，
讓具備前綴快取的本機 backend 能在 channel 回合之間重用穩定的
工作區前綴。同樣地，當已接受的 schema 已攜帶該執行階段細節時，
工具描述應避免嵌入目前 channel 名稱。

工具區段也包含長時間執行工作的執行階段指引：

- 對未來的後續追蹤（`check back later`、提醒、週期性工作）使用 Cron，
  而不是 `exec` sleep 迴圈、`yieldMs` 延遲技巧，或重複 `process`
  輪詢
- 只對現在開始並在背景繼續執行的命令使用 `exec` / `process`
- 啟用自動完成喚醒時，只啟動命令一次，並依賴在其輸出或失敗時
  發出的 push-based 喚醒路徑
- 需要檢查執行中命令的 log、狀態、輸入或介入時，使用 `process`
- 如果任務較大，偏好使用 `sessions_spawn`；子代理程式完成是
  push-based，並會自動回報給請求者
- 不要為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

啟用實驗性的 `update_plan` 工具時，工具區段也會告訴
模型只在非瑣碎的多步驟工作中使用它，保持剛好一個
`in_progress` 步驟，並避免在每次更新後重複整個計畫。

系統提示中的安全護欄屬於建議性質。它們會引導模型行為，但不強制執行政策。若要強制執行，請使用工具政策、exec 核准、沙箱化與 channel allowlist；operator 依設計可以停用這些機制。

在具有原生核准卡片/按鈕的 channel 上，執行階段提示現在會告訴
代理程式優先依賴該原生核准 UI。只有當工具結果指出聊天核准
不可用，或手動核准是唯一途徑時，才應包含手動
`/approve` 命令。

## 提示模式

OpenClaw 可以為子代理程式 render 較小的系統提示。執行階段會為
每次執行設定 `promptMode`（不是使用者可見的設定）：

- `full`（預設）：包含上述所有區段。
- `minimal`：用於子代理程式；省略 **Skills**、**記憶回想**、**OpenClaw
  自我更新**、**模型別名**、**使用者身分**、**回覆標籤**、
  **訊息**、**靜默回覆** 與 **Heartbeats**。工具、**安全**、
  工作區、沙箱、目前日期與時間（已知時）、執行階段，以及已注入的
  脈絡仍會保留。
- `none`：只回傳基本身分行。

當 `promptMode=minimal` 時，額外注入的提示會標記為 **子代理程式
脈絡**，而不是 **群組聊天脈絡**。

對於 channel 自動回覆執行，當直接/群組聊天脈絡已包含已解析的
對話專屬 `NO_REPLY` 行為時，OpenClaw 可以省略通用的 **靜默回覆**
區段。這可避免在全域系統提示和 channel 脈絡中重複 token 機制。

## 提示快照

OpenClaw 會為 Codex/message-tool 執行階段保存已提交的 happy-path
提示快照，位於 `test/fixtures/agents/prompt-snapshots/happy-path/`。
它們會 render OpenClaw 擁有的 Codex app-server developer instructions、
所選的 thread start/resume params、turn user input，以及 Telegram 直接訊息、
Discord 群組與 Heartbeat 回合的動態工具規格。隱藏的基本 Codex 系統提示與
turn-scoped Codex collaboration-mode instructions 由 Codex runtime 擁有，
不由 OpenClaw render。

使用 `pnpm prompt:snapshots:gen` 重新產生，並使用
`pnpm prompt:snapshots:check` 驗證 drift。

## 工作區 bootstrap 注入

Bootstrap 檔案會被裁切並附加在 **專案脈絡** 下方，讓模型無需明確讀取也能看到身分與 profile 脈絡：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- `MEMORY.md`（存在時）

除非適用檔案專屬 gate，否則每一輪都會將所有這些檔案**注入到脈絡視窗**。
當預設代理程式停用 Heartbeat，或
`agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，
一般執行會省略 `HEARTBEAT.md`。請保持注入檔案精簡，尤其是
`MEMORY.md`，它可能隨時間成長，導致非預期的高脈絡使用量與更頻繁的 Compaction。

<Note>
`memory/*.md` 每日檔案**不**屬於一般啟動載入的專案上下文。在普通回合中，它們會透過 `memory_search` 和 `memory_get` 工具按需存取，因此除非模型明確讀取它們，否則不會計入上下文視窗。裸 `/new` 和 `/reset` 回合是例外：執行階段可以將最近的每日記憶以前置的一次性啟動上下文區塊加入該第一回合。
</Note>

大型檔案會以標記截斷。每個檔案的大小上限由
`agents.defaults.bootstrapMaxChars` 控制（預設：12000）。跨檔案注入的啟動載入
內容總量由 `agents.defaults.bootstrapTotalMaxChars`
限制（預設：60000）。缺少的檔案會注入簡短的缺失檔案標記。發生截斷時，OpenClaw 可以在專案上下文中注入警告區塊；可透過
`agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；
預設：`once`）控制。

子代理工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動載入檔案
會被濾除，以保持子代理上下文精簡）。

內部 hook 可以透過 `agent:bootstrap` 攔截此步驟，以修改或替換
注入的啟動載入檔案（例如將 `SOUL.md` 換成替代人格）。

如果你想讓代理聽起來比較不通用，請從
[SOUL.md 人格指南](/zh-TW/concepts/soul)開始。

若要檢查每個注入檔案的貢獻量（原始與注入、截斷，以及工具結構描述開銷），請使用 `/context list` 或 `/context detail`。請參閱[上下文](/zh-TW/concepts/context)。

## 時間處理

當使用者時區已知時，系統提示會包含專用的**目前日期與時間**區段。為了保持提示快取穩定，它現在只包含
**時區**（不包含動態時鐘或時間格式）。

當代理需要目前時間時，請使用 `session_status`；狀態卡
包含時間戳記列。同一工具也可以選擇性設定每個工作階段的模型
覆寫（`model=default` 會清除它）。

設定項目：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

完整行為細節請參閱[日期與時間](/zh-TW/date-time)。

## Skills

當存在符合資格的 Skills 時，OpenClaw 會注入精簡的**可用 Skills 清單**
（`formatSkillsForPrompt`），其中包含每個 skill 的**檔案路徑**。該
提示會指示模型使用 `read` 載入列出位置（工作區、受管理或隨附）的 SKILL.md。如果沒有符合資格的 Skills，則會省略
Skills 區段。

資格包含 skill 中繼資料閘門、執行階段環境/設定檢查，
以及設定 `agents.defaults.skills` 或
`agents.list[].skills` 時的有效代理 skill 允許清單。

Plugin 隨附的 Skills 只有在其所屬 Plugin 已啟用時才符合資格。
這讓工具 Plugin 可以公開更深入的操作指南，而不必將所有
相關指引直接嵌入每個工具說明中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

這能讓基礎提示保持精簡，同時仍可啟用目標式 skill 使用。

Skills 清單預算由 Skills 子系統負責：

- 全域預設：`skills.limits.maxSkillsPromptChars`
- 每個代理覆寫：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界執行階段摘錄使用不同介面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

這種拆分會將 Skills 大小控管與執行階段讀取/注入大小控管分開，
例如 `memory_get`、即時工具結果，以及 Compaction 後的 AGENTS.md 重新整理。

## 文件

系統提示包含**文件**區段。當本機文件可用時，它會
指向本機 OpenClaw 文件目錄（Git checkout 中的 `docs/` 或隨附 npm
套件文件）。如果本機文件不可用，則會退回至
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一區段也包含 OpenClaw 原始碼位置。Git checkout 會公開本機
原始碼根目錄，讓代理可以直接檢查程式碼。套件安裝包含 GitHub
原始碼 URL，並告知代理在文件不完整或過時時前往該處檢閱原始碼。提示也會提及公開文件鏡像、社群 Discord，以及用於 Skills 探索的 ClawHub
（[https://clawhub.ai](https://clawhub.ai)）。它會告知模型，對於 OpenClaw 行為、命令、設定或架構，應先查閱文件，並在可行時自行執行 `openclaw status`（只有在缺乏存取權時才詢問使用者）。
特別是針對設定，它會指示代理先使用 `gateway` 工具動作
`config.schema.lookup` 取得精確的欄位層級文件與限制，接著再參閱
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
以取得更廣泛的指引。

## 相關

- [代理程式執行階段](/zh-TW/concepts/agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [脈絡引擎](/zh-TW/concepts/context-engine)
