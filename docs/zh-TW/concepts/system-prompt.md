---
read_when:
    - 編輯系統提示文字、工具清單或時間／心跳偵測章節
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示包含的內容及其組裝方式
title: 系統提示
x-i18n:
    generated_at: "2026-06-27T19:15:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建立自訂系統提示。該提示由 **OpenClaw 擁有**，且不使用執行階段預設提示。

提示由 OpenClaw 組裝，並注入每次代理執行。

提示組裝有三層：

- `buildAgentSystemPrompt` 會從明確輸入轉譯提示。它應該
  保持為純轉譯器，不應直接讀取全域設定。
- `resolveAgentSystemPromptConfig` 會解析由設定支援的提示旋鈕，例如
  擁有者顯示、TTS 提示、模型別名、記憶引用模式，以及特定代理的子代理
  委派模式。
- 執行階段配接器（嵌入式、命令列介面、命令/匯出預覽、壓縮）會收集
  即時事實，例如工具、沙盒狀態、頻道能力、情境檔案，
  以及提供者提示貢獻，然後呼叫已設定的提示門面。

這會讓匯出/偵錯提示介面與即時執行保持一致，而不會
把每個執行階段特定細節都變成單一龐大的建構器。

提供者外掛可以提供具備快取感知能力的提示指引，而不取代
完整的 OpenClaw 擁有提示。提供者執行階段可以：

- 取代一小組具名核心區段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

使用由提供者擁有的貢獻來進行模型系列特定調校。保留舊版
`before_prompt_build` 提示變更，以供相容性或真正全域的提示
變更使用，而不是一般提供者行為。

OpenAI GPT-5 系列覆蓋層會保持核心執行規則精簡，並加入
模型特定指引，涵蓋人格鎖定、精簡輸出、工具紀律、
平行查找、交付項目覆蓋、驗證、缺少情境，以及
終端工具衛生。

## 結構

提示刻意保持精簡，並使用固定區段：

- **工具**：結構化工具的事實來源提醒，加上執行階段工具使用指引。
- **執行偏向**：精簡的跟進指引：對可執行的請求在本回合採取行動、
  持續到完成或受阻、從薄弱的工具結果中恢復、即時檢查可變狀態，
  並在最終回覆前驗證。
- **安全**：簡短的防護提醒，避免追求權力的行為或繞過監督。
- **Skills**（可用時）：告訴模型如何按需載入 Skill 指示。
- **OpenClaw Control**：告訴模型在處理設定/重新啟動工作時優先使用 `gateway` 工具，
  並避免編造命令列介面命令。
- **OpenClaw 自我更新**：如何使用
  `config.schema.lookup` 安全檢查設定、使用 `config.patch` 修補設定、使用 `config.apply` 取代完整
  設定，並且只在使用者明確要求時執行 `update.run`。面向代理的 `gateway` 工具也會拒絕重寫
  `tools.exec.ask` / `tools.exec.security`，包括會正規化為這些受保護 exec 路徑的舊版 `tools.bash.*`
  別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：OpenClaw 文件/原始碼的本機路徑，以及何時讀取它們。
- **工作區檔案（已注入）**：表示啟動檔案包含在下方。
- **沙盒**（啟用時）：表示沙盒化執行階段、沙盒路徑，以及是否可使用提升權限的 exec。
- **目前日期與時間**：僅時區（快取穩定；即時時鐘來自 `session_status`）。
- **助理輸出指示**：精簡的附件、語音備註與回覆標籤語法。
- **心跳偵測**：預設代理啟用心跳偵測時的心跳偵測提示與 ack 行為。
- **執行階段**：主機、作業系統、節點、模型、儲存庫根目錄（偵測到時）、思考等級（一行）。
- **推理**：目前可見性等級 + /reasoning 切換提示。

OpenClaw 會把大型穩定內容（包括**專案情境**）保留在
內部提示快取邊界上方。易變的頻道/工作階段區段，例如
Control UI 嵌入指引、**訊息傳遞**、**語音**、**群組聊天情境**、
**回應**、**心跳偵測**與**執行階段**，會附加在該邊界下方，
讓具備前綴快取的本機後端可以跨頻道回合重用穩定的工作區前綴。
同樣地，當接受的結構描述已承載該執行階段細節時，工具描述也應避免嵌入目前
頻道名稱。

工具區段也包含長時間執行工作的執行階段指引：

- 使用排程處理未來跟進（`check back later`、提醒、週期性工作），
  而不是 `exec` 睡眠迴圈、`yieldMs` 延遲技巧，或重複的 `process`
  輪詢
- 只有對於現在啟動並在背景持續執行的命令，才使用 `exec` / `process`
- 啟用自動完成喚醒時，只啟動命令一次，並在其輸出或失敗時依賴
  推送式喚醒路徑
- 當需要檢查執行中命令的記錄、狀態、輸入或介入時，使用 `process`
- 如果任務較大，優先使用 `sessions_spawn`；子代理完成採用
  推送式，並會自動向請求者公告
- 不要只為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

`agents.defaults.subagents.delegationMode` 可以強化這項指引。
預設的 `suggest` 模式會保留基準提示。`prefer` 會加入專用的
**子代理委派**區段，告訴主代理作為回應迅速的
協調者，並將任何比直接回覆更複雜的事項透過
`sessions_spawn` 推送出去。這僅是提示；工具政策仍控制
`sessions_spawn` 是否可用。

啟用實驗性的 `update_plan` 工具時，工具區段也會告訴
模型只在非簡單多步驟工作中使用它、保持剛好一個
`in_progress` 步驟，並避免每次更新後重複整個計畫。

系統提示中的安全防護是建議性的。它們會引導模型行為，但不強制執行政策。使用工具政策、exec 核准、沙盒化與頻道允許清單進行硬性執行；營運者可以刻意停用這些機制。

在具備原生核准卡片/按鈕的頻道上，執行階段提示現在會告訴
代理優先依賴該原生核准 UI。只有當工具結果表示聊天核准不可用，
或手動核准是唯一路徑時，才應包含手動
`/approve` 命令。

## 提示模式

OpenClaw 可以為子代理轉譯較小的系統提示。執行階段會為每次執行設定
`promptMode`（不是面向使用者的設定）：

- `full`（預設）：包含上方所有區段。
- `minimal`：用於子代理；省略**記憶回想**、**OpenClaw
  自我更新**、**模型別名**、**使用者身分**、**助理輸出指示**、
  **訊息傳遞**、**靜默回覆**與**心跳偵測**。工具、**安全**、
  提供時的 **Skills**、工作區、沙盒、目前日期與時間（已知時）、
  執行階段，以及注入情境仍可用。
- `none`：只傳回基礎身分行。

當 `promptMode=minimal` 時，額外注入的提示會標示為**子代理
情境**，而不是**群組聊天情境**。

對於頻道自動回覆執行，當直接、群組或僅訊息工具情境擁有可見回覆
契約時，OpenClaw 會省略通用的**靜默回覆**
區段。只有舊式自動群組/頻道模式才應顯示 `NO_REPLY`；直接
聊天與僅訊息工具回覆不會收到靜默權杖指引。

## 提示快照

OpenClaw 會在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留已提交的 Codex 執行階段順利路徑提示快照。它們會轉譯
選定的 app-server thread/turn 參數，加上重建的模型綁定提示
層堆疊，用於 Telegram 直接訊息、Discord 群組與心跳偵測回合。該堆疊
包含從 Codex 的模型目錄/快取形狀產生的釘選 Codex `gpt-5.5` 模型提示 fixture、
Codex 順利路徑權限開發者文字、
OpenClaw 開發者指示、OpenClaw 提供時的回合範圍協作模式指示、
使用者回合輸入，以及對動態工具規格的參照。

使用 `pnpm prompt:snapshots:sync-codex-model` 重新整理釘選的 Codex 模型提示 fixture。
預設情況下，腳本會先尋找 Codex 在 `$CODEX_HOME/models_cache.json` 的執行階段快取，然後是
`~/.codex/models_cache.json`，最後才退回到維護者 Codex
checkout 慣例位置 `~/code/codex/codex-rs/models-manager/models.json`。如果
這些來源都不存在，命令會在不變更已提交 fixture 的情況下結束。
傳入 `--catalog <path>` 可從特定的 `models_cache.json`
或 `models.json` 檔案重新整理。

這些快照仍不是逐位元組相同的原始 OpenAI 請求擷取。Codex
可以在 OpenClaw 傳送 thread 和 turn 參數之後，在 Codex 執行階段內加入由執行階段擁有的工作區情境，例如 `AGENTS.md`、環境
情境、記憶、app/外掛指示，以及內建預設
協作模式指示。

使用 `pnpm prompt:snapshots:gen` 重新產生它們，並使用
`pnpm prompt:snapshots:check` 驗證漂移。CI 會在額外的
邊界 shard 中執行漂移檢查，讓提示變更與快照更新保持附著於同一個
PR。

## 工作區啟動注入

啟動檔案會從作用中的工作區解析，然後路由到
符合其生命週期的提示介面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- `MEMORY.md`（存在時）

在原生 Codex harness 上，OpenClaw 會避免在每個使用者回合中重複穩定的工作區檔案。Codex 會透過其自身的專案文件
探索載入 `AGENTS.md`。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 與 `USER.md` 會作為
Codex 開發者指示轉送。精簡的 OpenClaw Skills 清單也會作為
回合範圍協作開發者指示轉送。`HEARTBEAT.md` 內容不會
被注入；心跳偵測回合會在檔案存在且非空時取得指向該檔案的協作模式備註。
來自已設定代理工作區的 `MEMORY.md` 內容不會貼到每個原生 Codex 回合；當該工作區可使用記憶工具時，Codex 回合會在
回合範圍協作開發者指示中取得一小段工作區記憶備註，並應在持久記憶相關時使用 `memory_search`
或 `memory_get`。如果工具已停用、記憶
搜尋不可用，或作用中工作區不同於代理記憶
工作區，`MEMORY.md` 會退回到一般有界回合情境路徑。作用中
`BOOTSTRAP.md` 內容目前仍保留一般回合情境角色。

在非 Codex harness 上，啟動檔案會繼續依照既有 gate 組成到
OpenClaw 提示中。當預設代理停用心跳偵測，或
`agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，`HEARTBEAT.md` 會在
一般執行中省略。保持注入檔案精簡，尤其是非 Codex 的 `MEMORY.md`。`MEMORY.md` 旨在維持為
精心整理的長期摘要；詳細的每日筆記應放在 `memory/*.md` 中，讓
`memory_search` 與 `memory_get` 可按需擷取它們。過大的
非 Codex `MEMORY.md` 檔案會增加提示使用量，且可能因為下方啟動檔案限制而被部分注入。

<Note>
`memory/*.md` 每日檔案**不是**一般啟動專案情境的一部分。在一般回合中，它們會按需透過 `memory_search` 與 `memory_get` 工具存取，因此除非模型明確讀取它們，否則不會計入情境視窗。裸 `/new` 與 `/reset` 回合是例外：執行階段可以為該第一回合前置最近的每日記憶，作為一次性啟動情境區塊。
</Note>

大型檔案會以標記截斷。每個檔案的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（預設值：20000）。跨檔案注入的啟動
內容總量上限由 `agents.defaults.bootstrapTotalMaxChars`
控制（預設值：60000）。缺少的檔案會注入一個簡短的缺檔標記。發生截斷時，
OpenClaw 可以注入簡潔的系統提示警告通知；可透過
`agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；
預設值：`always`）。詳細的原始/注入計數會保留在診斷資訊中，例如
`/context`、`/status`、doctor 和日誌。

對記憶檔案而言，截斷不代表資料遺失：檔案在磁碟上仍保持完整。
在原生 Codex 上，`MEMORY.md` 會在可用時透過記憶工具隨需讀取，
工具無法執行時則使用有界提示備援。在其他
執行架構上，模型只會看到縮短後的注入副本，直到它直接讀取或
搜尋記憶為止。如果 `MEMORY.md` 在該處反覆被截斷，請將它提煉成
較短且持久的摘要，並將詳細歷史移至 `memory/*.md`，
或有意提高啟動限制。

子代理工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動檔案
會被過濾掉，以保持子代理上下文精簡）。

內部鉤子可以透過 `agent:bootstrap` 攔截此步驟，以變更或取代
注入的啟動檔案（例如將 `SOUL.md` 換成替代人格）。

如果你想讓代理聽起來不那麼制式，請從
[SOUL.md 人格指南](/zh-TW/concepts/soul)開始。

若要檢查每個注入檔案的貢獻量（原始與注入、截斷，以及工具結構描述額外負載），請使用 `/context list` 或 `/context detail`。請參閱[上下文](/zh-TW/concepts/context)。

## 時間處理

當已知使用者時區時，系統提示會包含專用的**目前日期與時間**區段。
為了保持提示快取穩定，現在只包含**時區**（不包含動態時鐘或時間格式）。

當代理需要目前時間時，請使用 `session_status`；狀態卡
包含時間戳記列。同一工具也可以選擇性設定每個工作階段的模型
覆寫（`model=default` 會清除它）。

設定方式：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行為細節請參閱[日期與時間](/zh-TW/date-time)。

## Skills

當存在符合資格的 Skills 時，OpenClaw 會注入精簡的**可用 Skills 清單**
（`formatSkillsForPrompt`），其中包含每個 Skill 的**檔案路徑**與從內容衍生的
`<version>` 標記。提示會指示模型使用 `read`
載入列出位置中的 SKILL.md（工作區、受管理或內建），
並在某個 Skill 的 `<version>` 與前一回合不同時重新讀取它。如果沒有
符合資格的 Skills，則會省略 Skills 區段。

原生 Codex 回合會將此清單作為回合範圍的協作開發者
指示，而不是每回合使用者輸入；但輕量排程回合例外，它們會
保留精確的排程提示。其他執行架構則保留一般提示
區段。

位置可以指向巢狀 Skill，例如
`skills/personal/foo/SKILL.md`。巢狀結構僅用於組織；提示仍會
使用 `SKILL.md` frontmatter 中的扁平 Skill 名稱。

資格包含 Skill 中繼資料閘門、執行階段環境/設定檢查，
以及在設定 `agents.defaults.skills` 或
`agents.list[].skills` 時生效的代理 Skill 允許清單。

外掛內建 Skills 只有在其所屬外掛啟用時才符合資格。
這讓工具外掛可以公開更深入的操作指南，而不必將所有
指南直接嵌入每個工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

這能保持基礎提示精簡，同時仍啟用目標明確的 Skill 使用。

Skills 清單預算由 Skills 子系統負責：

- 全域預設值：`skills.limits.maxSkillsPromptChars`
- 每個代理覆寫：`agents.list[].skillsLimits.maxSkillsPromptChars`

一般有界執行階段摘錄使用不同介面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

這種切分會讓 Skills 大小控制與執行階段讀取/注入大小控制分離，例如
`memory_get`、即時工具結果，以及壓縮後的 AGENTS.md 重新整理。

## 文件

系統提示包含**文件**區段。當本機文件可用時，它會
指向本機 OpenClaw 文件目錄（Git checkout 中的 `docs/`，或內建 npm
套件文件）。如果本機文件不可用，則會退回到
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一區段也包含 OpenClaw 原始碼位置。Git checkout 會公開本機
原始碼根目錄，讓代理可以直接檢查程式碼。套件安裝會包含 GitHub
原始碼 URL，並告知代理在文件不完整或
過期時到該處審查原始碼。提示也會提及公開文件鏡像、社群 Discord，以及用於 Skills 探索的 ClawHub
（[https://clawhub.ai](https://clawhub.ai)）。在模型理解 OpenClaw 如何運作之前，它會將文件視為
OpenClaw 自我知識的權威來源，
包括記憶/每日筆記、工作階段、工具、閘道、設定、命令或專案
上下文。提示會告訴模型先使用本機文件（或在本機文件
不可用時使用文件鏡像），並將 AGENTS.md、專案上下文、工作區/設定檔/記憶
筆記，以及 `memory_search` 視為指示上下文或使用者記憶，而不是 OpenClaw
設計或實作知識。如果文件沒有說明或已過期，模型應該說明這一點
並檢查原始碼。提示也會告訴模型在可能時自行執行 `openclaw status`，
只有在缺少存取權時才詢問使用者。
針對設定，提示會特別指引代理使用 `gateway` 工具動作
`config.schema.lookup` 取得精確的欄位層級文件與限制，接著參考
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
取得更廣泛的指南。

## 相關

- [代理執行階段](/zh-TW/concepts/agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [上下文引擎](/zh-TW/concepts/context-engine)
