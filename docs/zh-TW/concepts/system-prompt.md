---
read_when:
    - 編輯系統提示文字、工具清單或時間／心跳偵測區段
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示包含哪些內容，以及如何組裝
title: 系統提示
x-i18n:
    generated_at: "2026-07-05T11:17:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建構自己的系統提示；沒有執行階段預設提示。

組裝分為三層：

- `buildAgentSystemPrompt` 會從明確輸入轉譯提示。它維持為純轉譯器，不會直接讀取全域設定。
- `resolveAgentSystemPromptConfig` 會為特定代理解析由設定支援的提示旋鈕（擁有者顯示、TTS 提示、模型別名、記憶引用模式、子代理委派模式）。
- 執行階段配接器（嵌入式、命令列介面、命令/匯出預覽、壓縮）會收集即時事實（工具、沙箱狀態、通道能力、內容脈絡檔案、供應商提示貢獻），並呼叫已設定的提示外觀介面。

這讓匯出/除錯提示介面與即時執行保持一致，而不會把每個執行階段細節都變成單一龐大的建構器。

供應商外掛可以貢獻快取感知指引，而不取代 OpenClaw 擁有的提示。供應商執行階段可以：

- 取代三個具名核心區段之一：`interaction_style`、`tool_call_style`、`execution_bias`
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

使用供應商擁有的貢獻來做模型系列專用調校。將舊版 `before_prompt_build` 鉤子保留給相容性或真正全域的提示變更。

內建 OpenAI/Codex GPT-5 系列覆寫層（`resolveGpt5SystemPromptContribution`）使用此機制：一個 `stablePrefix` 行為合約（執行政策、工具紀律、輸出合約、完成合約），加上一個選用的 `interaction_style` 覆寫，以提供更友善的語氣。它會套用到任何透過 OpenAI 或 Codex 外掛路由的 `gpt-5*` 模型 ID，並由 `agents.defaults.promptOverlays.gpt5.personality`（`"friendly"`/`"on"` 或 `"off"`）控制。

## 結構

提示很精簡，包含固定區段：

- **工具**：結構化工具真相來源提醒，加上執行階段工具使用指引。啟用實驗性 `update_plan` 工具（`tools.experimental.planTool`）時，其自己的工具描述會補充：只在非簡單的多步驟工作中使用、最多保持一個步驟為 `in_progress`，並在簡單的一步驟工作中略過。
- **執行偏向**：對可行動的請求在當輪內採取行動，持續進行直到完成或受阻，從薄弱的工具結果復原，即時檢查可變狀態，並在最終回覆前驗證。
- **安全**：簡短護欄提醒，防止追求權力的行為或繞過監督。
- **Skills**（可用時）：告訴模型如何按需載入技能指示。
- **OpenClaw 控制**：設定/重新啟動工作優先使用 `gateway` 工具；不要憑空發明命令列介面命令。
- **OpenClaw 自我更新**：使用 `config.schema.lookup` 安全檢查設定、使用 `config.patch` 修補、使用 `config.apply` 取代完整設定，且只在使用者明確要求時執行 `update.run`。面向代理的 `gateway` 工具會拒絕重寫 `tools.exec.ask` / `tools.exec.security`，包含會正規化為這些受保護路徑的舊版 `tools.bash.*` 別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：本機文件/來源路徑，以及何時讀取它們。
- **工作區檔案（已注入）**：註明啟動檔案會包含在下方。
- **沙箱**（啟用時）：沙箱化執行階段、沙箱路徑、提升權限執行可用性。
- **目前日期與時間**：僅時區（快取穩定；即時時鐘來自 `session_status`）。
- **助理輸出指示**：精簡的附件、語音筆記與回覆標籤語法。
- **心跳偵測**：為預設代理啟用心跳偵測時的心跳偵測提示與確認行為。
- **執行階段**：主機、作業系統、節點、模型、儲存庫根目錄（偵測到時）、思考層級（一行）。
- **推理**：目前可見性層級，加上 `/reasoning` 切換提示。

大型穩定內容（包含**專案內容脈絡**）會留在內部提示快取邊界上方。每輪易變區段（控制介面嵌入指引、**訊息傳遞**、**語音**、**群組聊天內容脈絡**、**反應**、**心跳偵測**、**執行階段**）會附加在該邊界下方，讓具備前綴快取的本機後端可以跨通道輪次重用穩定的工作區前綴。若接受的結構描述已攜帶目前通道名稱這類執行階段細節，工具描述應避免嵌入它們。

工具也帶有長時間執行工作指引：

- 對未來追蹤（`check back later`、提醒、週期性工作）使用排程，而不是 `exec` 睡眠迴圈、`yieldMs` 延遲技巧或重複的 `process` 輪詢
- `exec` / `process` 只用於現在啟動並在背景持續執行的命令
- 啟用自動完成喚醒時，只啟動命令一次，並依賴推送式喚醒路徑
- 對執行中命令的日誌、狀態、輸入或介入使用 `process`
- 對較大的任務，優先使用 `sessions_spawn`；子代理完成是推送式，且會自動向請求者回報
- 不要為了等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

`agents.defaults.subagents.delegationMode`（預設 `"suggest"`）可以強化這點。`"prefer"` 會新增專用的**子代理委派**區段，要求主代理作為反應迅速的協調者，並把任何比直接回覆更複雜的事項透過 `sessions_spawn` 推送出去。這只影響提示；工具政策仍控制 `sessions_spawn` 是否可用。

系統提示中的安全護欄是建議性質，不是強制執行。請使用工具政策、執行核准、沙箱和通道允許清單進行硬性強制；操作員可以依設計停用提示護欄。

在具備原生核准卡片/按鈕的通道上，提示會要求代理優先依賴該介面，且只有在工具結果表示聊天核准不可用或手動核准是唯一途徑時，才包含手動 `/approve` 命令。

## 提示模式

OpenClaw 會為子代理轉譯較小的系統提示。執行階段會為每次執行設定一個 `promptMode`（不是面向使用者的設定）：

- `full`（預設）：上述所有區段。
- `minimal`：用於子代理；省略記憶提示區段（內建為**記憶回想**）、**OpenClaw 自我更新**、**模型別名**、**使用者身分**、**助理輸出指示**、**訊息傳遞**、**靜默回覆**與**心跳偵測**。工具、**安全**、**Skills**（提供時）、工作區、沙箱、目前日期與時間（已知時）、執行階段，以及注入內容脈絡仍可用。
- `none`：只傳回基本身分行。

在 `promptMode=minimal` 下，額外注入的提示會標示為**子代理內容脈絡**，而不是**群組聊天內容脈絡**。

對於通道自動回覆執行，當直接、群組或僅訊息工具內容脈絡已經擁有可見回覆合約時，OpenClaw 會省略通用的**靜默回覆**區段。只有舊版自動群組/通道模式會顯示 `NO_REPLY`；直接聊天與僅訊息工具回覆會略過靜默權杖指引。

## 提示快照

OpenClaw 會在 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留已提交的 Codex 執行階段快樂路徑提示快照。它們會轉譯選定的應用伺服器討論串/輪次參數，加上為 Telegram 直接訊息、Discord 群組與心跳偵測輪次重建的模型繫結提示層堆疊：釘選的 Codex `gpt-5.5` 模型提示 fixture、Codex 快樂路徑權限開發者文字、OpenClaw 開發者指示、OpenClaw 提供時的輪次範圍協作模式指示、使用者輪次輸入，以及動態工具規格參照。

使用 `pnpm prompt:snapshots:sync-codex-model` 重新整理釘選的 Codex 模型提示 fixture。預設會依序尋找 `$CODEX_HOME/models_cache.json`、`~/.codex/models_cache.json`，再找維護者簽出慣例 `~/code/codex/codex-rs/models-manager/models.json`；如果都不存在，會不變更已提交 fixture 而結束。傳入 `--catalog <path>` 可從特定 `models_cache.json` 或 `models.json` 檔案重新整理。

這些快照不是逐位元組對應的原始 OpenAI 請求擷取。Codex 可以在 OpenClaw 傳送討論串與輪次參數後，加入執行階段擁有的工作區內容脈絡（`AGENTS.md`、環境內容脈絡、記憶、應用程式/外掛指示、內建預設協作模式指示）。

使用 `pnpm prompt:snapshots:gen` 重新產生；使用 `pnpm prompt:snapshots:check` 驗證漂移。CI 會將漂移檢查與 additional-boundary 分片一起執行，因此提示變更與快照更新會落在同一個 PR 中。

## 工作區啟動注入

啟動檔案會從作用中的工作區解析，並路由到符合其生命週期的提示介面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限全新工作區）
- `MEMORY.md`（存在時）

在原生 Codex harness 上，OpenClaw 會避免在每個使用者輪次中重複穩定的工作區檔案。Codex 會透過自己的專案文件探索載入 `AGENTS.md`。`TOOLS.md` 會作為繼承的 Codex 開發者指示轉送。`SOUL.md`、`IDENTITY.md` 與 `USER.md` 會作為輪次範圍協作開發者指示轉送，因此原生 Codex 子代理不會繼承它們。`HEARTBEAT.md` 內容不會直接注入；心跳偵測輪次會在檔案存在且非空時取得指向該檔案的協作模式備註。`MEMORY.md` 內容也不會貼到每個原生 Codex 輪次中：當工作區可用記憶工具時，Codex 輪次會取得一小段工作區記憶備註，指示模型使用 `memory_search` 或 `memory_get`。若工具已停用、記憶搜尋不可用，或作用中工作區與代理記憶工作區不同，`MEMORY.md` 會退回到一般的有界輪次內容脈絡路徑。`BOOTSTRAP.md` 會保留一般輪次內容脈絡角色。

在非 Codex harness 上，啟動檔案會依其既有閘門組入 OpenClaw 提示。當預設代理停用心跳偵測，或 `agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，`HEARTBEAT.md` 會在一般執行中省略。請保持注入檔案精簡，尤其是非 Codex 的 `MEMORY.md`：它應保持為經整理的長期摘要，詳細每日筆記則放在 `memory/*.md` 中，並可透過 `memory_search` / `memory_get` 按需擷取。過大的非 Codex `MEMORY.md` 檔案會增加提示用量，且可能在下列啟動檔案限制下被部分注入。

<Note>
`memory/*.md` 每日檔案**不是**一般啟動專案內容脈絡的一部分。在普通輪次中，它們會透過 `memory_search` / `memory_get` 按需存取，因此除非模型明確讀取它們，否則不會計入內容脈絡視窗。裸 `/new` 與 `/reset` 輪次是例外：執行階段可以為該第一輪前置最近每日記憶，作為一次性啟動內容脈絡區塊。
</Note>

大型檔案會使用標記截斷：

| 限制                                         | 設定鍵                                             | 預設值   |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| 每個檔案最大字元數                           | `agents.defaults.bootstrapMaxChars`                | 20000    |
| 所有檔案總計                                 | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| 截斷警告（`off`\|`once`\|`always`）          | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

缺少檔案會注入簡短的缺少檔案標記。詳細的原始/注入計數會保留在診斷中，例如 `/context`、`/status`、doctor 與日誌。

對記憶檔案而言，截斷不是資料遺失：檔案仍完整保留在磁碟上。在原生 Codex 上，`MEMORY.md` 會在可用時透過記憶工具按需讀取，否則使用有界提示後備。在其他 harness 上，模型只會看到縮短後的注入副本，直到它直接讀取或搜尋記憶。如果 `MEMORY.md` 反覆被截斷，請將其萃取為更短的持久摘要，將詳細歷史移到 `memory/*.md`，或有意提高啟動限制。

子代理工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動檔案會被篩除，以保持子代理脈絡精簡）。

內部鉤子可以透過 `agent:bootstrap` 事件攔截此步驟，以變更或替換注入的啟動檔案（例如將 `SOUL.md` 換成替代人格）。

若要讓語氣不那麼泛用，請從 [SOUL.md 人格指南](/zh-TW/concepts/soul) 開始。

若要檢查每個注入檔案貢獻了多少內容（原始內容與注入內容、截斷、工具結構描述開銷），請使用 `/context list` 或 `/context detail`。請參閱[脈絡](/zh-TW/concepts/context)。

## 時間處理

**目前日期與時間**區段只會在使用者時區已知時出現，且只包含**時區**（沒有動態時鐘或時間格式），以保持提示快取穩定。

當代理需要目前時間時，請使用 `session_status`；其狀態卡包含時間戳記行。同一個工具也可以選擇性設定每個工作階段的模型覆寫（`model=default` 會清除它）。

設定方式如下：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

完整行為細節請參閱[時區](/zh-TW/concepts/timezone)與[日期與時間](/zh-TW/date-time)。

## Skills

當存在符合資格的 Skills 時，OpenClaw 會注入精簡的 `<available_skills>` 清單（`formatSkillsForPrompt`），每個 skill 都包含**檔案路徑**以及依內容衍生的 `<version>sha256:...</version>` 標記。提示會指示模型使用 `read` 載入列出位置的 SKILL.md（工作區、受管理或內建），並在某個 skill 的 `<version>` 與前一輪不同時重新讀取該 skill。如果沒有符合資格的 Skills，Skills 區段會被省略。

原生 Codex 輪次會將此清單作為該輪次範圍的協作開發者指示，而不是每輪使用者輸入，但會排除保留精確排程提示的輕量排程輪次。其他執行框架會保留一般提示區段。

位置可以指向巢狀 skill，例如 `skills/personal/foo/SKILL.md`。巢狀結構僅用於組織；提示會使用 `SKILL.md` frontmatter 中的扁平 skill 名稱。

資格包含 skill 中繼資料閘門、執行階段環境/設定檢查，以及在設定 `agents.defaults.skills` 或 `agents.list[].skills` 時生效的代理 skill 允許清單。外掛內建的 Skills 只有在其所屬外掛啟用時才符合資格，讓工具外掛能公開更深入的操作指南，而不必將所有指引嵌入每個工具描述中。

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

這能讓基礎提示保持精簡，同時仍可啟用目標式 skill 使用。大小由 Skills 子系統負責，與一般執行階段讀取/注入大小分開：

| 範圍 | Skills 提示預算 | 執行階段摘錄預算 |
| --------- | ------------------------------------------------- | --------------------------------- |
| 全域 | `skills.limits.maxSkillsPromptChars` | `agents.defaults.contextLimits.*` |
| 每個代理 | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*` |

執行階段摘錄預算涵蓋 `memory_get`、即時工具結果，以及壓縮後的 `AGENTS.md` 重新整理。

## 文件

**文件**區段會在可用時指向本機文件（Git checkout 中的 `docs/`，或內建 npm 套件文件），否則退回至 [https://docs.openclaw.ai](https://docs.openclaw.ai)。它也會列出 OpenClaw 原始碼位置：Git checkout 會公開本機原始碼根目錄，套件安裝則會取得 GitHub 原始碼 URL，並附上在文件不完整或過時時於該處檢閱原始碼的指示。

提示會將文件定位為 OpenClaw 自我知識的權威來源，供模型在理解 OpenClaw 如何運作（記憶/每日筆記、工作階段、工具、閘道、設定、命令、專案脈絡）之前參考，並告訴模型將 `AGENTS.md`、專案脈絡、工作區/設定檔/記憶筆記，以及 `memory_search` 視為指示脈絡或使用者記憶，而非 OpenClaw 設計/實作知識。如果文件沒有說明或已過時，模型應該說明這一點並檢查原始碼。它也會告訴模型在可能時自行執行 `openclaw status`，只有在缺乏存取權時才詢問使用者。

針對設定，它特別會引導代理使用 `gateway` 工具動作 `config.schema.lookup` 取得精確的欄位層級文件與限制，然後再參考 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 取得更廣泛的指引。

## 相關

- [代理執行階段](/zh-TW/concepts/agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [脈絡引擎](/zh-TW/concepts/context-engine)
