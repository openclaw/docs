---
read_when:
    - 你希望代理將修正或可重複使用的程序轉換為工作區 Skills
    - 您正在設定程序性技能記憶
    - 你正在偵錯 skill_workshop 工具的行為
    - 您正在決定是否啟用自動建立 Skills
summary: 將可重用程序實驗性擷取為工作區 Skills，並支援審查、核准、隔離和即時 Skills 重新整理
title: 技能工作坊 Plugin
x-i18n:
    generated_at: "2026-05-06T09:17:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

技能工作坊是**實驗性**功能。它預設停用，其擷取
啟發式規則與審閱者提示可能會在不同版本之間變更，而自動
寫入只應在可信任的工作區中，且先審閱 pending 模式
輸出後使用。

技能工作坊是工作區 Skills 的程序式記憶。它讓代理能將
可重用的工作流程、使用者修正、得來不易的修復方式，以及反覆出現的陷阱
轉成 `SKILL.md` 檔案，放在：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

這不同於長期記憶：

- **記憶**會儲存事實、偏好、實體，以及過去的脈絡。
- **Skills**會儲存代理在未來任務中應遵循的可重用程序。
- **技能工作坊**是從一次有用的互動，通往持久工作區
  skill 的橋樑，並具備安全檢查與選用的核准流程。

當代理學到如下程序時，技能工作坊會很有用：

- 如何驗證外部來源的動畫 GIF 資產
- 如何替換截圖資產並驗證尺寸
- 如何執行特定儲存庫的 QA 情境
- 如何偵錯反覆出現的供應器失敗
- 如何修復過時的本機工作流程備註

它不適用於：

- 像「使用者喜歡藍色」這類事實
- 廣泛的自傳式記憶
- 原始逐字稿封存
- 祕密、憑證，或隱藏提示文字
- 不會重複的一次性指示

## 預設狀態

隨附的 Plugin 是**實驗性**功能，且**預設停用**，除非在
`plugins.entries.skill-workshop` 中明確啟用。

Plugin manifest 不會設定 `enabledByDefault: true`。Plugin 設定結構描述中的 `enabled: true`
預設值，只會在 Plugin 項目已被選取並載入後套用。

實驗性代表：

- Plugin 已有足夠支援，可供選擇性測試與內部試用
- 提案儲存、審閱者門檻，以及擷取啟發式規則都可能演進
- pending 核准是建議的起始模式
- 自動套用適合可信任的個人／工作區設定，不適合共享或敵意、
  大量輸入的環境

## 啟用

最小安全設定：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

使用此設定時：

- `skill_workshop` 工具可用
- 明確的可重用修正會排入 pending 提案
- 以門檻為基礎的審閱者流程可以提出 skill 更新
- 在套用 pending 提案之前，不會寫入任何 skill 檔案

只在可信任的工作區中使用自動寫入：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` 仍會使用相同的掃描器與隔離路徑。它
不會套用含有嚴重發現的提案。

## 設定

| 鍵                   | 預設值      | 範圍／值                                    | 意義                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | 布林值                                      | 在 Plugin 項目載入後啟用 Plugin。                                   |
| `autoCapture`        | `true`      | 布林值                                      | 在成功的代理互動後啟用擷取／審閱。                                  |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 將提案排入佇列，或自動寫入安全提案。                                |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 選擇明確修正擷取、LLM 審閱者、兩者，或兩者皆不使用。                 |
| `reviewInterval`     | `15`        | `1..200`                                    | 在這麼多次成功互動後執行審閱者。                                    |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 在觀察到這麼多次工具呼叫後執行審閱者。                              |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 內嵌審閱者執行的逾時時間。                                          |
| `maxPending`         | `50`        | `1..200`                                    | 每個工作區保留的 pending／隔離提案上限。                            |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 產生的 skill／支援檔案大小上限。                                    |

建議設定檔：

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 擷取路徑

技能工作坊有三種擷取路徑。

### 工具建議

模型在看到可重用程序時，或使用者要求它儲存／更新 skill 時，
可以直接呼叫 `skill_workshop`。

這是最明確的路徑，即使使用 `autoCapture: false` 也能運作。

### 啟發式擷取

當 `autoCapture` 已啟用且 `reviewMode` 為 `heuristic` 或 `hybrid` 時，
Plugin 會掃描成功的互動，尋找明確的使用者修正片語：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

啟發式規則會從最新相符的使用者指示建立提案。它
會使用主題提示，為常見工作流程選擇 skill 名稱：

- 動畫 GIF 任務 -> `animated-gif-workflow`
- 截圖或資產任務 -> `screenshot-asset-workflow`
- QA 或情境任務 -> `qa-scenario-workflow`
- GitHub PR 任務 -> `github-pr-workflow`
- 後備 -> `learned-workflows`

啟發式擷取刻意保持狹窄。它用於清楚的修正與
可重複的流程備註，而不是一般逐字稿摘要。

### LLM 審閱者

當 `autoCapture` 已啟用且 `reviewMode` 為 `llm` 或 `hybrid` 時，Plugin
會在達到門檻後執行精簡的內嵌審閱者。

審閱者會收到：

- 最近的逐字稿文字，上限為最後 12,000 個字元
- 最多 12 個既有工作區 Skills
- 每個既有 skill 最多 2,000 個字元
- 僅限 JSON 的指示

審閱者沒有工具：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

審閱者會回傳 `{ "action": "none" }` 或一個提案。`action` 欄位是 `create`、`append` 或 `replace` - 當相關 skill 已存在時，優先使用 `append`/`replace`；只有在沒有符合的既有 skill 時才使用 `create`。

`create` 範例：

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` 會加入 `section` + `body`。`replace` 會在指定 skill 中，將 `oldText` 替換為 `newText`。

## 提案生命週期

每個產生的更新都會成為提案，並包含：

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 選用的 `agentId`
- 選用的 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`：`tool`、`agent_end` 或 `reviewer`
- `status`
- `change`
- 選用的 `scanFindings`
- 選用的 `quarantineReason`

提案狀態：

- `pending` - 等待核准
- `applied` - 已寫入 `<workspace>/skills`
- `rejected` - 已由操作者/模型拒絕
- `quarantined` - 因掃描器發現嚴重問題而封鎖

狀態會依工作區儲存在 Gateway 狀態目錄下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

待處理與隔離中的提案會依 Skill 名稱和變更
payload 去重。儲存區會保留最新的待處理/隔離中提案，最多
`maxPending`。

## 工具參考

此 Plugin 會註冊一個 agent 工具：

```text
skill_workshop
```

### `status`

統計目前工作區中各狀態的提案數量。

```json
{ "action": "status" }
```

結果形狀：

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

列出待處理提案。

```json
{ "action": "list_pending" }
```

若要列出其他狀態：

```json
{ "action": "list_pending", "status": "applied" }
```

有效的 `status` 值：

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

列出隔離中的提案。

```json
{ "action": "list_quarantine" }
```

當自動擷取看似沒有任何動作，且日誌提到
`skill-workshop: quarantined <skill>` 時使用此工具。

### `inspect`

依 ID 擷取提案。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

建立提案。使用 `approvalPolicy: "pending"`（預設）時，這會排入佇列而不是寫入。

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

套用待處理提案。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` 會拒絕隔離中的提案：

```text
quarantined proposal cannot be applied
```

### `reject`

將提案標記為已拒絕。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

在既有或提議的 Skill 目錄內寫入支援檔案。

允許的頂層支援目錄：

- `references/`
- `templates/`
- `scripts/`
- `assets/`

範例：

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Support files 的範圍限定於工作區、會檢查路徑、受 `maxSkillBytes` 位元組限制、會被掃描，並以原子方式寫入。

## Skill 寫入

Skill Workshop 只會寫入：

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 名稱會被正規化：

- 轉為小寫
- 非 `[a-z0-9_-]` 連續字元會變成 `-`
- 開頭/結尾的非英數字元會被移除
- 最大長度為 80 個字元
- 最終名稱必須符合 `[a-z0-9][a-z0-9_-]{1,79}`

對於 `create`：

- 如果 skill 不存在，Skill Workshop 會寫入新的 `SKILL.md`
- 如果已經存在，Skill Workshop 會將 body 附加到 `## Workflow`

對於 `append`：

- 如果 skill 存在，Skill Workshop 會附加到要求的區段
- 如果不存在，Skill Workshop 會建立最小 skill，然後附加內容

對於 `replace`：

- skill 必須已經存在
- `oldText` 必須完全存在
- 只會取代第一個完全相符項目

所有寫入都是原子操作，並會立即重新整理記憶體中的 skills 快照，因此新的或更新後的 skill 可以在不重新啟動 Gateway 的情況下變得可見。

## 安全模型

Skill Workshop 會對產生的 `SKILL.md` 內容與支援檔案使用安全掃描器。

嚴重發現會隔離提案：

| 規則 ID                                | 封鎖符合以下情況的內容...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 要求代理忽略先前/較高優先級的指示                   |
| `prompt-injection-system`              | 提及系統提示、開發者訊息或隱藏指示 |
| `prompt-injection-tool`                | 鼓勵繞過工具權限/核准                         |
| `shell-pipe-to-shell`                  | 包含將 `curl`/`wget` 管線傳入 `sh`、`bash` 或 `zsh`              |
| `secret-exfiltration`                  | 看似透過網路傳送 env/程序 env 資料                 |

警告發現會被保留，但其本身不會封鎖：

| 規則 ID              | 警告對象...                      |
| -------------------- | -------------------------------- |
| `destructive-delete` | 廣泛的 `rm -rf` 風格命令    |
| `unsafe-permissions` | `chmod 777` 風格的權限使用 |

遭隔離的提案：

- 保留 `scanFindings`
- 保留 `quarantineReason`
- 會出現在 `list_quarantine`
- 無法透過 `apply` 套用

若要從遭隔離的提案復原，請建立移除不安全內容的新安全提案。不要手動編輯儲存區 JSON。

## 提示指引

啟用時，Skill Workshop 會注入一小段提示區段，告訴代理使用 `skill_workshop` 作為持久程序記憶。

該指引強調：

- 程序，而不是事實/偏好
- 使用者更正
- 不明顯但成功的程序
- 反覆出現的陷阱
- 透過 append/replace 修復過時/薄弱/錯誤的 skill
- 在長時間工具迴圈或困難修正後儲存可重用程序
- 簡短的命令式 skill 文字
- 不要傾倒逐字稿

寫入模式文字會隨 `approvalPolicy` 變更：

- pending 模式：排入建議佇列；僅在明確核准後套用
- auto 模式：在明確可重用時套用安全的工作區 skill 更新

## 成本與執行階段行為

啟發式擷取不會呼叫模型。

LLM 審查會使用作用中/預設代理模型上的內嵌執行。它以閾值為基礎，因此預設不會在每一輪都執行。

審查器：

- 可用時使用相同的已設定提供者/模型脈絡
- 退回到執行階段代理預設值
- 具有 `reviewTimeoutMs`
- 使用輕量啟動脈絡
- 沒有工具
- 不會直接寫入任何內容
- 只能發出會通過一般掃描器與核准/隔離路徑的提案

如果審查器失敗、逾時或傳回無效 JSON，Plugin 會記錄警告/除錯訊息，並略過該次審查。

## 操作模式

當使用者說出以下內容時，使用 Skill Workshop：

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

良好的 skill 文字：

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

不佳的 skill 文字：

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

不應儲存不佳版本的原因：

- 形同逐字稿
- 不是命令式
- 包含吵雜的一次性細節
- 沒有告訴下一個代理該做什麼

## 除錯

檢查 Plugin 是否已載入：

```bash
openclaw plugins list --enabled
```

從代理/工具脈絡檢查提案數量：

```json
{ "action": "status" }
```

檢查待處理提案：

```json
{ "action": "list_pending" }
```

檢查遭隔離的提案：

```json
{ "action": "list_quarantine" }
```

常見症狀：

| 症狀                               | 可能原因                                                                        | 檢查                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 工具無法使用                   | Plugin 項目未啟用                                                         | `plugins.entries.skill-workshop.enabled` 和 `openclaw plugins list` |
| 沒有出現自動提案         | `autoCapture: false`、`reviewMode: "off"`，或未達閾值                    | 設定、提案狀態、Gateway 記錄                                |
| 啟發式未擷取             | 使用者措辭不符合更正模式                                      | 使用明確的 `skill_workshop.suggest` 或啟用 LLM 審查器         |
| 審查器未建立提案    | 審查器傳回 `none`、無效 JSON 或逾時                                | Gateway 記錄、`reviewTimeoutMs`、閾值                          |
| 提案未套用               | `approvalPolicy: "pending"`                                                         | `list_pending`，然後 `apply`                                         |
| 提案從待處理中消失     | 重複提案被重用、最大待處理數修剪，或已被套用/拒絕/隔離 | `status`、帶有狀態篩選器的 `list_pending`、`list_quarantine`      |
| Skill 檔案存在但模型漏掉它 | Skill 快照未重新整理，或 skill 閘控將其排除                            | `openclaw skills` 狀態與工作區 skill 資格             |

相關記錄：

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 情境

由 repo 支援的 QA 情境：

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

執行確定性覆蓋：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

執行審查器覆蓋：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

審查器情境刻意分開，因為它會啟用 `reviewMode: "llm"`，並演練內嵌審查器流程。

## 何時不要啟用自動套用

在以下情況避免使用 `approvalPolicy: "auto"`：

- 工作區包含敏感程序
- 代理正在處理不受信任的輸入
- skills 會在大型團隊中共享
- 你仍在調校提示或掃描器規則
- 模型經常處理敵意網頁/電子郵件內容

先使用 pending 模式。只有在審查該工作區中代理提出的 skills 類型後，才切換到 auto 模式。

## 相關文件

- [Skills](/zh-TW/tools/skills)
- [Plugins](/zh-TW/tools/plugin)
- [測試](/zh-TW/reference/test)
