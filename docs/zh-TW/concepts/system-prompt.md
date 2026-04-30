---
read_when:
    - 編輯系統提示詞文字、工具清單，或時間/Heartbeat 區段
    - 變更工作區啟動程序或 Skills 注入行為
summary: OpenClaw 系統提示詞包含哪些內容，以及它是如何組裝的
title: 系統提示詞
x-i18n:
    generated_at: "2026-04-30T03:03:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 會為每次代理執行建構自訂系統提示。此提示由 **OpenClaw 擁有**，不使用 pi-coding-agent 預設提示。

提示由 OpenClaw 組裝，並注入每次代理執行。

供應商 Plugin 可以提供具快取感知的提示指引，而不取代
完整的 OpenClaw 擁有提示。供應商執行階段可以：

- 取代一小組具名核心區段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示快取邊界上方注入**穩定前綴**
- 在提示快取邊界下方注入**動態後綴**

請將供應商擁有的貢獻用於模型家族特定調校。保留舊版
`before_prompt_build` 提示變更以供相容性或真正全域的提示
變更使用，而非一般供應商行為。

OpenAI GPT-5 家族覆蓋層會讓核心執行規則保持精簡，並加入
針對角色鎖定、精簡輸出、工具紀律、平行查詢、交付成果覆蓋、
驗證、缺少脈絡，以及終端機工具衛生的模型特定指引。

## 結構

提示刻意保持精簡，並使用固定區段：

- **工具**：結構化工具真相來源提醒，以及執行階段工具使用指引。
- **執行偏向**：精簡的貫徹指引：在同一回合內對
  可執行請求採取行動，持續到完成或受阻，從不佳工具
  結果中復原，現場檢查可變狀態，並在最終回覆前驗證。
- **安全**：簡短的護欄提醒，避免追求權力的行為或繞過監督。
- **Skills**（可用時）：告知模型如何按需載入 skill 指示。
- **OpenClaw 自我更新**：如何使用
  `config.schema.lookup` 安全檢查設定、使用 `config.patch` 修補設定、
  使用 `config.apply` 取代完整設定，以及僅在使用者明確請求時執行
  `update.run`。僅限擁有者使用的 `gateway` 工具也會拒絕重寫
  `tools.exec.ask` / `tools.exec.security`，包括會正規化為這些受保護
  exec 路徑的舊版 `tools.bash.*` 別名。
- **工作區**：工作目錄（`agents.defaults.workspace`）。
- **文件**：OpenClaw 文件的本機路徑（repo 或 npm 套件）以及何時讀取。
- **工作區檔案（已注入）**：表示下方包含啟動檔案。
- **沙箱**（啟用時）：表示沙箱化執行階段、沙箱路徑，以及是否可使用提升權限的 exec。
- **目前日期與時間**：使用者本地時間、時區與時間格式。
- **回覆標籤**：支援供應商的選用回覆標籤語法。
- **Heartbeat**：預設代理啟用 Heartbeat 時的 Heartbeat 提示與確認行為。
- **執行階段**：主機、OS、node、模型、repo 根目錄（偵測到時）、思考層級（一行）。
- **推理**：目前可見性層級 + /reasoning 切換提示。

OpenClaw 會將大型穩定內容（包括 **專案脈絡**）保留在
內部提示快取邊界上方。易變的頻道/工作階段區段，例如
Control UI 嵌入指引、**訊息**、**語音**、**群組聊天脈絡**、
**回應**、**Heartbeat** 與 **執行階段**，會附加在該邊界下方，
讓具前綴快取的本機後端能跨頻道回合重用穩定的工作區前綴。
同樣地，當接受的 schema 已承載該執行階段細節時，工具描述也應避免嵌入目前頻道名稱。

工具區段也包含長時間執行工作的執行階段指引：

- 使用 cron 處理未來後續事項（`check back later`、提醒、週期性工作），
  而不是 `exec` sleep 迴圈、`yieldMs` 延遲技巧，或重複的 `process`
  輪詢
- 僅將 `exec` / `process` 用於現在開始並在背景持續執行的命令
- 啟用自動完成喚醒時，只啟動命令一次，並在其輸出或失敗時依賴
  推送式喚醒路徑
- 需要檢查執行中命令的日誌、狀態、輸入或介入時，使用 `process`
- 如果任務較大，偏好使用 `sessions_spawn`；子代理完成是
  推送式的，且會自動向請求者公告
- 不要只為等待完成而在迴圈中輪詢 `subagents list` / `sessions_list`

啟用實驗性 `update_plan` 工具時，工具區段也會告訴
模型僅在非簡單的多步驟工作中使用它，保持剛好一個
`in_progress` 步驟，並避免每次更新後重複整個計畫。

系統提示中的安全護欄是建議性質。它們引導模型行為，但不強制執行政策。請使用工具政策、exec 核准、沙箱化與頻道允許清單進行硬性強制；操作者可依設計停用這些機制。

在具有原生核准卡片/按鈕的頻道上，執行階段提示現在會告訴
代理優先依賴該原生核准 UI。只有在工具結果表示聊天核准不可用，
或手動核准是唯一途徑時，才應包含手動 `/approve` 命令。

## 提示模式

OpenClaw 可以為子代理轉譯較小的系統提示。執行階段會為每次執行設定
`promptMode`（不是面向使用者的設定）：

- `full`（預設）：包含上方所有區段。
- `minimal`：用於子代理；省略 **Skills**、**記憶回想**、**OpenClaw
  自我更新**、**模型別名**、**使用者身分**、**回覆標籤**、
  **訊息**、**靜默回覆** 與 **Heartbeat**。工具、**安全**、
  工作區、沙箱、目前日期與時間（已知時）、執行階段與已注入
  脈絡仍會可用。
- `none`：僅回傳基礎身分行。

當 `promptMode=minimal` 時，額外注入的提示會標示為 **子代理
脈絡**，而非 **群組聊天脈絡**。

對於頻道自動回覆執行，當直接/群組聊天脈絡已包含解析後的
對話特定 `NO_REPLY` 行為時，OpenClaw 可以省略通用的 **靜默回覆**
區段。這可避免在全域系統提示與頻道脈絡中重複權杖機制。

## 工作區啟動注入

啟動檔案會被修剪並附加在 **專案脈絡** 下，讓模型無需明確讀取即可看到身分與設定檔脈絡：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅在全新工作區）
- `MEMORY.md`（存在時）

除非套用檔案特定 gate，否則所有這些檔案會在每個回合都**注入脈絡視窗**。
當預設代理停用 Heartbeat，或
`agents.defaults.heartbeat.includeSystemPromptSection` 為 false 時，
`HEARTBEAT.md` 會在一般執行中省略。請保持注入檔案精簡，尤其是
`MEMORY.md`，它可能隨時間成長，導致非預期的高脈絡用量與更頻繁的
Compaction。

<Note>
`memory/*.md` 每日檔案**不是**一般啟動專案脈絡的一部分。在普通回合中，它們會透過 `memory_search` 和 `memory_get` 工具按需存取，因此除非模型明確讀取，否則不會計入脈絡視窗。單純的 `/new` 與 `/reset` 回合是例外：執行階段可以將最近的每日記憶作為一次性啟動脈絡區塊前置到該第一個回合。
</Note>

大型檔案會以標記截斷。每個檔案的大小上限由
`agents.defaults.bootstrapMaxChars` 控制（預設：12000）。跨檔案注入的啟動
內容總量上限由 `agents.defaults.bootstrapTotalMaxChars`
控制（預設：60000）。缺少的檔案會注入簡短的缺檔標記。發生截斷時，
OpenClaw 可以在專案脈絡中注入警告區塊；可用
`agents.defaults.bootstrapPromptTruncationWarning` 控制此行為（`off`、`once`、`always`；
預設：`once`）。

子代理工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`（其他啟動檔案
會被濾除，以保持子代理脈絡精簡）。

內部 hook 可以透過 `agent:bootstrap` 攔截此步驟，以變更或取代
已注入的啟動檔案（例如將 `SOUL.md` 換成替代角色）。

如果你想讓代理聽起來不那麼泛泛而談，請從
[SOUL.md 個性指南](/zh-TW/concepts/soul) 開始。

若要檢查每個注入檔案貢獻多少內容（原始與注入、截斷，加上工具 schema 額外開銷），請使用 `/context list` 或 `/context detail`。請參閱[脈絡](/zh-TW/concepts/context)。

## 時間處理

當使用者時區已知時，系統提示會包含專用的 **目前日期與時間** 區段。
為了保持提示快取穩定，它現在只包含
**時區**（沒有動態時鐘或時間格式）。

當代理需要目前時間時，請使用 `session_status`；狀態卡片
包含時間戳記行。同一工具也可以選擇性設定每個工作階段的模型
覆寫（`model=default` 會清除它）。

設定項目：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

完整行為細節請參閱[日期與時間](/zh-TW/date-time)。

## Skills

當存在合格的 skills 時，OpenClaw 會注入精簡的 **可用 skills 清單**
（`formatSkillsForPrompt`），其中包含每個 skill 的**檔案路徑**。提示會
指示模型使用 `read` 載入列出位置（工作區、受管理或內建）的 SKILL.md。
如果沒有合格的 skills，會省略 Skills 區段。

合格條件包括 skill metadata gates、執行階段環境/設定檢查，
以及設定 `agents.defaults.skills` 或 `agents.list[].skills` 時有效的代理 skill 允許清單。

Plugin 內建的 skills 只有在其擁有的 Plugin 啟用時才合格。
這讓工具 Plugin 能公開更深入的操作指南，而不必將所有
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

這可讓基礎提示保持精簡，同時仍能啟用目標式 skill 使用。

skills 清單預算由 skills 子系統擁有：

- 全域預設：`skills.limits.maxSkillsPromptChars`
- 每代理覆寫：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用有界執行階段摘錄使用不同介面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

這項拆分會讓 skills 大小與執行階段讀取/注入大小保持分離，例如
`memory_get`、即時工具結果，以及 Compaction 後的 AGENTS.md 重新整理。

## 文件

系統提示包含 **文件** 區段。當本機文件可用時，它會
指向本機 OpenClaw 文件目錄（Git checkout 中的 `docs/`，或內建 npm
套件文件）。如果本機文件不可用，則會回退至
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一區段也包含 OpenClaw 原始碼位置。Git checkouts 會公開本機
原始碼根目錄，讓代理能直接檢查程式碼。套件安裝會包含 GitHub
原始碼 URL，並告訴代理在文件不完整或過時時到那裡檢閱原始碼。
提示也會提及公開文件鏡像、社群 Discord，以及供 skills 探索使用的 ClawHub
([https://clawhub.ai](https://clawhub.ai))。它會告訴模型先查閱文件以了解
OpenClaw 行為、命令、設定或架構，並在可行時自行執行
`openclaw status`（只有在缺少存取權時才詢問使用者）。
針對設定，它會特別指向 `gateway` 工具動作
`config.schema.lookup`，以取得精確的欄位層級文件與限制，接著再參考
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
以取得更廣泛的指引。

## 相關

- [代理執行階段](/zh-TW/concepts/agent)
- [代理工作區](/zh-TW/concepts/agent-workspace)
- [脈絡引擎](/zh-TW/concepts/context-engine)
