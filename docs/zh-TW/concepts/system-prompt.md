---
read_when:
    - 編輯系統提示詞文字、工具清單或時間／心跳偵測區段
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示詞包含哪些內容，以及它是如何組裝而成的
title: 系統提示詞
x-i18n:
    generated_at: "2026-07-11T21:20:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建構自己的系統提示詞；不存在執行階段預設提示詞。

組裝分為三層：

- `buildAgentSystemPrompt` 依據明確輸入呈現提示詞。它維持為純呈現器，不會直接讀取全域設定。
- `resolveAgentSystemPromptConfig` 會針對特定代理解析由設定支援的提示詞控制項（擁有者顯示、TTS 提示、模型別名、記憶引用模式、子代理委派模式）。
- 執行階段轉接器（嵌入式、命令列介面、命令／匯出預覽、壓縮）會收集即時資訊（工具、沙箱狀態、頻道能力、情境檔案、提供者提示詞貢獻），並呼叫已設定的提示詞介面。

這能讓匯出／偵錯提示詞介面與即時執行保持一致，而不必將每項執行階段細節都塞進單一龐大的建構器。

提供者外掛可以提供可感知快取的指引，而不必取代由 OpenClaw 擁有的提示詞。提供者執行階段可以：

- 取代三個具名核心區段之一：`interaction_style`、`tool_call_style`、`execution_bias`
- 在提示詞快取邊界上方注入**穩定前綴**
- 在提示詞快取邊界下方注入**動態後綴**

使用提供者擁有的貢獻，針對特定模型系列進行調校。舊版 `before_prompt_build` 掛鉤僅保留給相容性用途或真正的全域提示詞變更。

隨附的 OpenAI/Codex GPT-5 系列疊加層（`resolveGpt5SystemPromptContribution`）會使用此機制：一份 `stablePrefix` 行為契約（執行政策、工具規範、輸出契約、完成契約），以及可選的 `interaction_style` 覆寫，以提供更友善的語氣。它適用於透過 OpenAI 或 Codex 外掛路由的任何 `gpt-5*` 模型 ID，並由 `agents.defaults.promptOverlays.gpt5.personality` 控制（`"friendly"`／`"on"` 或 `"off"`）。

## 結構

提示詞相當精簡，包含下列固定區段：

- **工具使用**：提醒結構化工具才是事實來源，並提供執行階段工具使用指引。啟用實驗性 `update_plan` 工具（`tools.experimental.planTool`）時，其工具描述還會補充：僅用於非簡單的多步驟工作、最多只能有一個步驟處於 `in_progress`，且簡單的單步工作應略過此工具。
- **執行傾向**：對可執行的要求應在當前回合採取行動、持續到完成或受阻為止、從不理想的工具結果中恢復、即時檢查可變狀態，並在完成前驗證。
- **安全性**：簡短提醒防範追求權力的行為或規避監督。
- **Skills**（可用時）：告知模型如何視需要載入技能指示。
- **OpenClaw 控制**：設定／重新啟動工作應優先使用 `gateway` 工具；不要虛構命令列介面命令。
- **OpenClaw 自我更新**：使用 `config.schema.lookup` 安全檢查設定、使用 `config.patch` 修補、使用 `config.apply` 取代完整設定，並且只有在使用者明確要求時才執行 `update.run`。面向代理的 `gateway` 工具會拒絕重寫 `tools.exec.ask`／`tools.exec.security`，也包括會正規化至這些受保護路徑的舊版 `tools.bash.*` 別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：本機文件／原始碼路徑，以及何時應閱讀它們。
- **工作區檔案（已注入）**：說明下方已包含啟動載入檔案。
- **沙箱**（啟用時）：沙箱化執行階段、沙箱路徑，以及提升權限執行是否可用。
- **目前日期與時間**：僅包含時區（快取穩定；即時時鐘來自 `session_status`）。
- **助理輸出指示**：精簡的附件、語音訊息及回覆標籤語法。
- **心跳偵測**：為預設代理啟用心跳偵測時的心跳偵測提示詞與確認行為。
- **執行階段**：主機、作業系統、節點、模型、儲存庫根目錄（偵測到時）、思考層級（單行）。
- **推理**：目前可見性層級，以及 `/reasoning` 切換提示。

大型穩定內容（包括**專案情境**）會保留在內部提示詞快取邊界上方。每回合易變的區段（控制介面嵌入指引、**訊息傳遞**、**語音**、**群組聊天情境**、**回應表情**、**心跳偵測**、**執行階段**）則附加在該邊界下方，讓具備前綴快取的本機後端能跨頻道回合重複使用穩定的工作區前綴。如果工具接受的結構描述已攜帶目前頻道名稱這項執行階段細節，工具描述應避免再次嵌入該名稱。

工具使用區段也包含長時間執行工作的指引：

- 未來的後續工作（`check back later`、提醒、週期性工作）應使用排程，而不是 `exec` 睡眠迴圈、`yieldMs` 延遲技巧或重複輪詢 `process`
- `exec`／`process` 僅用於現在啟動並在背景繼續執行的命令
- 啟用自動完成喚醒時，只啟動命令一次，並依賴推送式喚醒路徑
- 使用 `process` 檢視執行中命令的日誌、狀態、輸入，或對其進行介入
- 對於較大型的工作，優先使用 `sessions_spawn`；子代理完成通知採推送方式，並會自動向要求者宣告
- 不要為了等待完成而以迴圈輪詢 `subagents list`／`sessions_list`

`agents.defaults.subagents.delegationMode`（預設為 `"suggest"`）可以強化此行為。`"prefer"` 會加入專用的**子代理委派**區段，指示主代理充當反應迅速的協調者，並將任何比直接回覆更複雜的工作交由 `sessions_spawn` 處理。這僅影響提示詞；工具政策仍會控制 `sessions_spawn` 是否可用。

系統提示詞中的安全防護屬於建議，而非強制執行。若要強制執行，請使用工具政策、執行核准、沙箱及頻道允許清單；依照設計，操作者可以停用提示詞防護。

在具備原生核准卡片／按鈕的頻道上，提示詞會指示代理優先依賴該介面；只有當工具結果指出無法使用聊天核准，或手動核准是唯一途徑時，才包含手動 `/approve` 命令。

## 提示詞模式

OpenClaw 會為子代理呈現較小型的系統提示詞。執行階段會為每次執行設定 `promptMode`（不是面向使用者的設定）：

- `full`（預設）：包含上述所有區段。
- `minimal`：供子代理使用；省略記憶提示詞區段（隨附為**記憶回想**）、**OpenClaw 自我更新**、**模型別名**、**使用者身分**、**助理輸出指示**、**訊息傳遞**、**靜默回覆**及**心跳偵測**。工具使用、**安全性**、**Skills**（提供時）、工作區、沙箱、目前日期與時間（已知時）、執行階段，以及注入的情境仍會保留。
- `none`：只傳回基本身分行。

在 `promptMode=minimal` 下，額外注入的提示詞會標示為**子代理情境**，而不是**群組聊天情境**。

對於頻道自動回覆執行，當直接聊天、群組聊天或僅使用訊息工具的情境已負責可見回覆契約時，OpenClaw 會省略通用的**靜默回覆**區段。只有舊版自動群組／頻道模式會顯示 `NO_REPLY`；直接聊天與僅使用訊息工具的回覆會略過靜默權杖指引。

## 提示詞快照

OpenClaw 會在 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保存 Codex 執行階段理想路徑的已提交提示詞快照。這些快照會呈現選定的應用程式伺服器執行緒／回合參數，以及重建後、與模型繫結的提示詞層堆疊，用於 Telegram 直接聊天、Discord 群組及心跳偵測回合：固定版本的 Codex `gpt-5.5` 模型提示詞固定檔、Codex 理想路徑權限開發者文字、OpenClaw 開發者指示、OpenClaw 提供時的回合範圍協作模式指示、使用者回合輸入，以及動態工具規格的參照。

使用 `pnpm prompt:snapshots:sync-codex-model` 重新整理固定版本的 Codex 模型提示詞固定檔。預設會依序尋找 `$CODEX_HOME/models_cache.json`、`~/.codex/models_cache.json`，以及維護者簽出目錄慣例 `~/code/codex/codex-rs/models-manager/models.json`；若均不存在，則不變更已提交的固定檔並結束。傳入 `--catalog <path>`，可從指定的 `models_cache.json` 或 `models.json` 檔案重新整理。

這些快照並非逐位元組完全一致的原始 OpenAI 要求擷取。OpenClaw 傳送執行緒與回合參數後，Codex 可能會加入由執行階段擁有的工作區情境（`AGENTS.md`、環境情境、記憶、應用程式／外掛指示、內建預設協作模式指示）。

使用 `pnpm prompt:snapshots:gen` 重新產生；使用 `pnpm prompt:snapshots:check` 驗證偏移。CI 會連同額外邊界分片執行偏移檢查，因此提示詞變更與快照更新會在同一個 PR 中合併。

## 工作區啟動載入注入

啟動載入檔案會從使用中的工作區解析，並路由至符合其生命週期的提示詞介面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- 存在時的 `MEMORY.md`

在原生 Codex 控制框架中，OpenClaw 會避免在每個使用者回合中重複穩定的工作區檔案。Codex 會透過自身的專案文件探索載入 `AGENTS.md`。`TOOLS.md` 會作為繼承的 Codex 開發者指示轉送。`SOUL.md`、`IDENTITY.md` 及 `USER.md` 會作為回合範圍的協作開發者指示轉送，避免原生 Codex 子代理繼承它們。`HEARTBEAT.md` 的內容不會直接注入；當該檔案存在且非空白時，心跳偵測回合會取得一則指向該檔案的協作模式註記。`MEMORY.md` 的內容也不會貼入每個原生 Codex 回合：當工作區可使用記憶工具時，Codex 回合會取得一則簡短的工作區記憶註記，指示模型使用 `memory_search` 或 `memory_get`。如果工具已停用、記憶搜尋無法使用，或使用中的工作區不同於代理記憶工作區，`MEMORY.md` 會回復使用一般的有界回合情境路徑。`BOOTSTRAP.md` 會維持一般的回合情境角色。

在非 Codex 控制框架中，啟動載入檔案會依照既有條件組合至 OpenClaw 提示詞。當預設代理停用心跳偵測，或 `agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，一般執行會省略 `HEARTBEAT.md`。請保持注入檔案精簡，尤其是非 Codex 的 `MEMORY.md`：它應維持為經整理的長期摘要，而詳細的每日筆記應放在 `memory/*.md` 中，並可透過 `memory_search`／`memory_get` 視需要擷取。過大的非 Codex `MEMORY.md` 檔案會增加提示詞用量，並可能依照下方的啟動載入檔案限制而僅注入部分內容。

<Note>
`memory/*.md` 每日檔案**不屬於**一般啟動載入的專案情境。在一般回合中，系統會透過 `memory_search`／`memory_get` 視需要存取這些檔案，因此除非模型明確讀取它們，否則不會占用情境視窗。單獨的 `/new` 與 `/reset` 回合是例外：執行階段可以在第一個回合前置加入近期每日記憶，作為一次性的啟動情境區塊。
</Note>

大型檔案會被截斷並附加標記：

| 限制                                        | 設定鍵                                             | 預設值   |
| ------------------------------------------- | -------------------------------------------------- | -------- |
| 每個檔案的字元數上限                        | `agents.defaults.bootstrapMaxChars`                | 20000    |
| 所有檔案的總字元數上限                      | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| 截斷警告（`off`\|`once`\|`always`）         | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

缺少的檔案會注入簡短的檔案遺失標記。詳細的原始／注入數量會保留在 `/context`、`/status`、doctor 及日誌等診斷資訊中。

對記憶檔案而言，截斷並不代表資料遺失：磁碟上的檔案仍保持完整。在原生 Codex 中，當記憶工具可用時，會透過記憶工具視需要讀取 `MEMORY.md`，否則使用有界提示詞作為後備方案。在其他控制框架中，模型只會看到縮短後的注入副本，直到它直接讀取或搜尋記憶為止。如果 `MEMORY.md` 一再遭到截斷，請將其提煉為較短且持久的摘要、將詳細歷史移至 `memory/*.md`，或有意提高啟動載入限制。

子代理程式工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動檔案會被篩除，以縮小子代理程式的情境）。

內部鉤子可透過 `agent:bootstrap` 事件攔截此步驟，以修改或取代注入的啟動檔案（例如將 `SOUL.md` 替換為另一種角色設定）。

若要讓語氣不那麼制式，請從 [SOUL.md 個性指南](/zh-TW/concepts/soul)開始。

若要檢查每個注入檔案的情境占用量（原始內容與注入內容、截斷情況、工具結構描述的額外負擔），請使用 `/context list` 或 `/context detail`。請參閱[情境](/zh-TW/concepts/context)。

## 時間處理

**目前日期與時間**區段僅在已知使用者時區時顯示，且只包含**時區**（不含動態時鐘或時間格式），以維持提示快取的穩定性。

當代理程式需要目前時間時，請使用 `session_status`；其狀態卡包含時間戳記行。同一工具也可選擇性設定個別工作階段的模型覆寫（`model=default` 會將其清除）。

設定方式：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

如需完整的行為詳細資訊，請參閱[時區](/zh-TW/concepts/timezone)和[日期與時間](/zh-TW/date-time)。

## Skills

存在符合資格的 Skills 時，OpenClaw 會注入精簡的 `<available_skills>` 清單（`formatSkillsForPrompt`），其中包含每項 Skills 的**檔案路徑**及從內容衍生的 `<version>sha256:...</version>` 標記。提示會指示模型使用 `read` 載入所列位置（工作區、受管理或隨附）的 SKILL.md，並在其 `<version>` 與前一輪不同時重新讀取該 Skills。若沒有符合資格的 Skills，則省略 Skills 區段。

原生 Codex 輪次會以僅限該輪的協作開發者指示接收此清單，而不是每輪使用者輸入；但保留確切排程提示的輕量排程輪次除外。其他執行框架則保留一般的提示區段。

該位置可以指向巢狀 Skills，例如 `skills/personal/foo/SKILL.md`。巢狀結構僅供組織使用；提示會使用 `SKILL.md` frontmatter 中的扁平 Skills 名稱。

資格判定包括 Skills 中繼資料閘門、執行階段環境／設定檢查，以及設定 `agents.defaults.skills` 或 `agents.list[].skills` 時生效的代理程式 Skills 允許清單。外掛隨附的 Skills 僅在其所屬外掛已啟用時才符合資格，讓工具外掛能公開更深入的操作指南，而不必將所有相關指引嵌入每個工具說明中。

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

如此可縮小基礎提示，同時仍能支援針對性的 Skills 使用。大小限制由 Skills 子系統管理，與一般執行階段的讀取／注入大小限制分開：

| 範圍       | Skills 提示預算                                   | 執行階段摘錄預算                  |
| ---------- | ------------------------------------------------- | --------------------------------- |
| 全域       | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| 個別代理程式 | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

執行階段摘錄預算涵蓋 `memory_get`、即時工具結果，以及壓縮後的 `AGENTS.md` 重新整理。

## 文件

**文件**區段會在本機文件可用時指向本機文件（Git 簽出中的 `docs/`，或隨附 npm 套件中的文件），否則會改用 [https://docs.openclaw.ai](https://docs.openclaw.ai)。它也會列出 OpenClaw 原始碼位置：Git 簽出會顯示本機原始碼根目錄；套件安裝則會提供 GitHub 原始碼 URL，並指示在文件不完整或過時時前往該處檢閱原始碼。

在模型尚未理解 OpenClaw 的運作方式（記憶／每日筆記、工作階段、工具、閘道、設定、命令、專案情境）之前，提示會將文件定位為 OpenClaw 自我知識的權威來源，並指示模型將 `AGENTS.md`、專案情境、工作區／設定檔／記憶筆記及 `memory_search` 視為指示情境或使用者記憶，而不是 OpenClaw 的設計／實作知識。如果文件未提及或已過時，模型應加以說明並檢查原始碼。提示也會指示模型在可行時自行執行 `openclaw status`，只有在無法存取時才詢問使用者。

特別針對設定，提示會指引代理程式使用 `gateway` 工具動作 `config.schema.lookup`，取得精確到欄位層級的文件與限制，接著再參閱 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 以取得更廣泛的指引。

## 相關內容

- [代理程式執行階段](/zh-TW/concepts/agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [情境引擎](/zh-TW/concepts/context-engine)
