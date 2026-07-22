---
read_when:
    - 編輯系統提示詞文字、工具清單或時間／心跳偵測區段
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示詞包含的內容及其組合方式
title: 系統提示詞
x-i18n:
    generated_at: "2026-07-22T10:32:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 669fbc6f21a82a2c3c067d2ff3a6365acb3316460a85f2db165b7ad49ce79f70
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理程式執行建構自己的系統提示；不存在執行階段預設提示。

組裝分為三層：

- `buildAgentSystemPrompt` 會根據明確輸入呈現提示。它維持為純呈現器，不會直接讀取全域設定。
- `resolveAgentSystemPromptConfig` 會為特定代理程式解析由設定支援的提示調整項目（擁有者顯示、TTS 提示、模型別名、記憶引用模式、子代理程式委派模式）。
- 執行階段配接器（嵌入式、命令列介面、命令／匯出預覽、壓縮）會收集即時事實（工具、沙箱狀態、頻道功能、情境檔案、供應商提示貢獻），並呼叫已設定的提示外觀介面。

這可讓匯出／偵錯提示介面與即時執行保持一致，而不必將每個執行階段細節都塞進單一龐大的建構器。

供應商外掛可以提供可感知快取的指引，而不取代由 OpenClaw 擁有的提示。供應商執行階段可以：

- 取代三個具名核心區段之一：`interaction_style`、`tool_call_style`、`execution_bias`
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

針對模型系列特定的調整，請使用供應商擁有的貢獻。舊版 `before_prompt_build` 鉤子僅保留給相容性需求或真正的全域提示變更。

內建的 OpenAI/Codex GPT-5 系列覆疊（`resolveGpt5SystemPromptContribution`）使用此機制：一份 `stablePrefix` 行為契約（執行原則、工具規範、輸出契約、完成契約），以及可選的 `interaction_style` 覆寫，以提供更親切的語氣。它適用於透過 OpenAI 或 Codex 外掛路由的任何 `gpt-5*` 模型 ID，並由 `agents.defaults.promptOverlays.gpt5.personality`（`"friendly"`/`"on"` 或 `"off"`）控制。

## 結構

提示相當精簡，包含固定區段：

- **工具**：結構化工具是事實來源的提醒，以及執行階段工具使用指引。啟用實驗性 `update_plan` 工具（`tools.experimental.planTool`）時，其工具說明會另外要求：僅將它用於非簡單的多步驟工作、最多只能有一個步驟處於 `in_progress`，並在簡單的單步驟工作中略過它。
- **執行傾向**：針對可採取行動的要求在當次回合中執行、持續進行直到完成或受阻、從成效不佳的工具結果中復原、即時檢查可變狀態，並在完成前進行驗證。
- **安全性**：簡短的護欄提醒，防止追求權力的行為或規避監督。
- **Skills**（可用時）：告知模型如何依需求載入 Skill 指示。
- **OpenClaw 控制**：設定／重新啟動工作應優先使用 `gateway` 工具；不要虛構命令列介面命令。
- **OpenClaw 自我更新**：使用 `config.schema.lookup` 安全地檢查設定、使用 `config.patch` 修補、使用 `config.apply` 取代完整設定，並且只有在使用者明確要求時才執行 `update.run`。面向代理程式的 `gateway` 工具會拒絕重寫 `tools.exec.mode`。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：本機文件／原始碼路徑及應於何時讀取。
- **工作區檔案（已注入）**：註明下方包含啟動檔案。
- **沙箱**（啟用時）：沙箱化執行階段、沙箱路徑、提升權限執行的可用性。
- **目前日期與時間**：僅包含時區（快取穩定；即時時鐘來自 `session_status`）。
- **助理輸出指示**：精簡的附件、語音訊息和回覆標籤語法。
- **心跳偵測**：為預設代理程式啟用心跳偵測時的心跳提示和確認行為。
- **執行階段**：主機、作業系統、節點、模型、儲存庫根目錄（偵測到時）、思考層級（單行）。
- **推理**：目前的可見性層級，以及 `/reasoning` 切換提示。

大型穩定內容（包括**專案情境**）會保留在內部提示快取邊界上方。每回合會變動的區段（控制介面嵌入指引、**訊息傳送**、**語音**、**群組聊天情境**、**回應**、**心跳偵測**、**執行階段**）會附加在該邊界下方，讓具有前綴快取的本機後端可在不同頻道回合間重複使用穩定的工作區前綴。若接受的結構描述已包含目前頻道名稱等執行階段細節，工具說明應避免再次嵌入這些資訊。

工具指引也包含長時間執行工作的相關指示：

- 對於未來的後續工作（`check back later`、提醒、週期性工作），使用排程，而非 `exec` 睡眠迴圈、`yieldMs` 延遲技巧或重複的 `process` 輪詢
- 僅將 `exec` / `process` 用於現在啟動並持續在背景執行的命令
- 啟用自動完成喚醒時，只啟動命令一次，並依賴推送式喚醒路徑
- 使用 `process` 處理執行中命令的記錄、狀態、輸入或介入
- 對於較大型的工作，優先使用 `sessions_spawn`；子代理程式的完成通知採推送方式，並會自動向要求者公布
- 不要只是為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

`agents.defaults.subagents.delegationMode`（預設為 `"suggest"`）可以強化這項行為。`"prefer"` 會新增專用的**子代理程式委派**區段，要求主要代理程式充當回應迅速的協調者，並將任何比直接回覆更複雜的工作透過 `sessions_spawn` 推送處理。這僅影響提示；工具原則仍會控制 `sessions_spawn` 是否可用。

系統提示中的安全護欄屬於建議，而非強制執行。若要強制執行，請使用工具原則、執行核准、沙箱和頻道允許清單；依設計，操作者可以停用提示護欄。

在具有原生核准卡片／按鈕的頻道中，提示會要求代理程式優先依賴該介面，並且只有在工具結果指出聊天核准不可用，或手動核准是唯一途徑時，才包含手動 `/approve` 命令。

## 提示模式

OpenClaw 會為子代理程式呈現較小的系統提示。執行階段會為每次執行設定一個 `promptMode`（不是面向使用者的設定）：

- `full`（預設）：包含上述所有區段。
- `minimal`：供子代理程式使用；省略記憶提示區段（內建為**記憶回想**）、**OpenClaw 自我更新**、**模型別名**、**使用者身分**、**助理輸出指示**、**訊息傳送**、**靜默回覆**和**心跳偵測**。工具、**安全性**、**Skills**（有提供時）、工作區、沙箱、目前日期與時間（已知時）、執行階段和注入的情境仍然可用。
- `none`：僅傳回基本身分行。

在 `promptMode=minimal` 下，額外注入的提示會標示為**子代理程式情境**，而不是**群組聊天情境**。

對於頻道自動回覆執行，若直接、群組或僅限訊息工具的情境已負責可見回覆契約，OpenClaw 會省略通用的**靜默回覆**區段。只有舊版自動群組／頻道模式會顯示 `NO_REPLY`；直接聊天和僅限訊息工具的回覆會略過靜默權杖指引。

## 提示快照

OpenClaw 會在 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留已提交的 Codex 執行階段正常路徑提示快照。這些快照會呈現選定的應用程式伺服器執行緒／回合參數，以及針對 Telegram 直接聊天、Discord 群組和心跳回合重建的模型繫結提示層堆疊：固定的 Codex `gpt-5.5` 模型提示固定資料、Codex 正常路徑權限開發者文字、OpenClaw 開發者指示、OpenClaw 提供時的回合範圍協作模式指示、使用者回合輸入，以及動態工具規格的參照。

使用 `pnpm prompt:snapshots:sync-codex-model` 重新整理固定的 Codex 模型提示固定資料。預設會依序尋找 `$CODEX_HOME/models_cache.json`、`~/.codex/models_cache.json`，再尋找維護者簽出慣例 `~/code/codex/codex-rs/models-manager/models.json`；若皆不存在，則會結束且不變更已提交的固定資料。傳入 `--catalog <path>`，可從特定的 `models_cache.json` 或 `models.json` 檔案重新整理。

這些快照不是逐位元組的原始 OpenAI 要求擷取。OpenClaw 傳送執行緒和回合參數後，Codex 可以加入由執行階段擁有的工作區情境（`AGENTS.md`、環境情境、記憶、應用程式／外掛指示、內建的 Default 協作模式指示）。

使用 `pnpm prompt:snapshots:gen` 重新產生；使用 `pnpm prompt:snapshots:check` 驗證漂移。CI 會在額外邊界分片旁執行漂移檢查，因此提示變更和快照更新會在同一個 PR 中提交。

## 工作區啟動注入

啟動檔案會從作用中的工作區解析，並路由到符合其生命週期的提示介面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新的工作區）
- 存在時的 `MEMORY.md`

在原生 Codex 控制框架上，OpenClaw 會避免在每個使用者回合中重複穩定的工作區檔案。Codex 會透過自己的專案文件探索載入 `AGENTS.md`。`TOOLS.md` 會轉送為繼承的 Codex 開發者指示。`SOUL.md`、`IDENTITY.md` 和 `USER.md` 會轉送為回合範圍的協作開發者指示，因此原生 Codex 子代理程式不會繼承它們。`HEARTBEAT.md` 內容不會直接注入；當檔案存在且非空白時，心跳回合會收到指向該檔案的協作模式註記。`MEMORY.md` 內容也不會貼入每個原生 Codex 回合：當工作區可使用記憶工具時，Codex 回合會收到簡短的工作區記憶註記，引導模型前往 `memory_search` 或 `memory_get`。若工具已停用、記憶搜尋不可用，或作用中工作區與代理程式記憶工作區不同，`MEMORY.md` 會回復到一般的有限回合情境路徑。`BOOTSTRAP.md` 會維持一般的回合情境角色。

在非 Codex 控制框架上，啟動檔案會依其既有閘門組合至 OpenClaw 提示中。若預設代理程式已停用心跳偵測，或 `agents.defaults.heartbeat.includeSystemPromptSection` 為 false，則一般執行會省略 `HEARTBEAT.md`。請保持注入檔案精簡，尤其是非 Codex 的 `MEMORY.md`：它應維持為精選的長期摘要，詳細的每日筆記則放在 `memory/*.md` 中，並可視需要透過 `memory_search` / `memory_get` 擷取。過大的非 Codex `MEMORY.md` 檔案會增加提示用量，並可能依下方的啟動檔案限制而僅注入部分內容。

<Note>
`memory/*.md` 每日檔案**不屬於**一般啟動專案情境。在一般回合中，它們會視需要透過 `memory_search` / `memory_get` 存取，因此除非模型明確讀取，否則不會占用情境視窗。純 `/new` 和 `/reset` 回合是例外：執行階段可以為該首次回合預先附加近期每日記憶，作為一次性的啟動情境區塊。
</Note>

大型檔案會截斷並附上標記：

| 限制                                         | 設定鍵                                             | 預設值   |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| 每個檔案的最大字元數                         | `agents.defaults.bootstrapMaxChars`                | 20000    |
| 所有檔案的合計上限                           | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| 截斷警告（`off`\|`once`\|`always`） | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

缺少的檔案會插入簡短的缺檔標記。詳細的原始／插入計數會保留在診斷資訊中，例如 `/context`、`/status`、doctor 和日誌。

對於記憶檔案，截斷並不代表資料遺失：檔案在磁碟上仍保持完整。在原生 Codex 中，若記憶工具可用，會透過記憶工具按需讀取 `MEMORY.md`；否則會使用有界限的提示詞備援。在其他執行框架中，模型只會看到縮短後的插入副本，直到它直接讀取或搜尋記憶為止。如果 `MEMORY.md` 一再遭到截斷，請將其提煉為較短且持久的摘要、把詳細歷史移至 `memory/*.md`，或有意提高啟動載入限制。

子代理程式工作階段只會插入 `AGENTS.md` 和 `TOOLS.md`（其他啟動載入檔案會被篩除，以保持子代理程式的上下文精簡）。

內部鉤子可透過 `agent:bootstrap` 事件攔截此步驟，以修改或取代插入的啟動載入檔案（例如將 `SOUL.md` 換成替代角色設定）。

若要讓語氣不那麼泛泛，請從 [SOUL.md 個性指南](/zh-TW/concepts/soul)開始。

若要檢查每個插入檔案的貢獻量（原始與插入內容、截斷、工具結構描述額外負擔），請使用 `/context list` 或 `/context detail`。請參閱[上下文](/zh-TW/concepts/context)。

## 時間處理

只有在已知使用者時區時，才會顯示**目前日期與時間**區段，而且其中只包含**時區**（不含動態時鐘或時間格式），以維持提示詞快取穩定。

代理程式需要目前時間時，請使用 `session_status`；其狀態卡會包含一行時間戳記。同一工具也可以選擇設定每個工作階段的模型覆寫（`model=default` 會將其清除）。

設定方式：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

如需完整的行為詳細資訊，請參閱[時區](/zh-TW/concepts/timezone)與[日期與時間](/zh-TW/date-time)。

## Skills

當存在符合資格的 Skills 時，OpenClaw 會插入精簡的 `<available_skills>` 清單（`formatSkillsForPrompt`），其中包含每項 Skill 的**檔案路徑**和依內容產生的 `<version>sha256:...</version>` 標記。提示詞會指示模型使用 `read`，從列出的位置（工作區、受管理或內建）載入 SKILL.md；若某項 Skill 的 `<version>` 與前一輪不同，則重新讀取該 Skill。如果沒有符合資格的 Skills，便會省略 Skills 區段。

原生 Codex 輪次會以僅限該輪次的協作開發者指示接收此清單，而非每輪使用者輸入；但保留完全相同排程提示詞的輕量排程輪次除外。其他執行框架則保留一般的提示詞區段。

該位置可以指向巢狀 Skill，例如 `skills/personal/foo/SKILL.md`。巢狀結構僅用於組織；提示詞會使用 `SKILL.md` frontmatter 中的扁平 Skill 名稱。

資格判定包含 Skill 中繼資料閘門、執行階段環境／設定檢查，以及設定 `agents.defaults.skills` 或 `agents.entries.*.skills` 時生效的代理程式 Skill 允許清單。外掛內建的 Skills 只有在其所屬外掛已啟用時才符合資格，讓工具外掛能提供更深入的操作指南，而不必將所有指引嵌入每個工具說明中。

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

這可保持基礎提示詞精簡，同時仍能針對性地使用 Skills。大小限制由 Skills 子系統管理，與一般執行階段的讀取／插入大小限制分開：

| 範圍     | Skills 提示詞預算                                 | 執行階段摘錄預算             |
| --------- | ---------------------------------------------------- | ---------------------------------- |
| 全域    | `skills.limits.maxSkillsPromptChars`                 | `agents.defaults.contextLimits.*`  |
| 每個代理程式 | `agents.entries.*.skillsLimits.maxSkillsPromptChars` | `agents.entries.*.contextLimits.*` |

執行階段摘錄預算涵蓋 `memory_get`、即時工具結果，以及壓縮後的 `AGENTS.md` 重新整理。

## 文件

當本機文件可用時（Git 簽出中的 `docs/` 或內建於 npm 套件中的文件），**文件**區段會指向本機文件；否則會改用 [https://docs.openclaw.ai](https://docs.openclaw.ai)。其中也會列出 OpenClaw 原始碼位置：Git 簽出會顯示本機原始碼根目錄，套件安裝則會提供 GitHub 原始碼 URL，並指示在文件不完整或過時時到該處檢閱原始碼。

在模型了解 OpenClaw 的運作方式（記憶／每日筆記、工作階段、工具、閘道、設定、命令、專案上下文）之前，提示詞會將文件定位為 OpenClaw 自我知識的權威來源，並告知模型應將 `AGENTS.md`、專案上下文、工作區／設定檔／記憶筆記，以及 `memory_search` 視為指示上下文或使用者記憶，而非 OpenClaw 的設計／實作知識。如果文件未提及或已過時，模型應明確說明並檢查原始碼。提示詞也會指示模型在可能時自行執行 `openclaw status`，只有在無法存取時才詢問使用者。

特別針對設定，提示詞會引導代理程式使用 `gateway` 工具動作 `config.schema.lookup`，取得精確到欄位層級的文件與限制，再參閱 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 以取得更廣泛的指引。

## 相關內容

- [代理程式執行階段](/zh-TW/concepts/agent)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [上下文引擎](/zh-TW/concepts/context-engine)
