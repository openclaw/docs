---
read_when:
    - 您希望代理將更正或可重複使用的程序轉換為工作區 Skills
    - 你正在設定程序性技能記憶
    - 你正在偵錯 skill_workshop 工具的行為
    - 你正在決定是否啟用自動建立 Skills
summary: 將可重複使用的程序以工作區 Skills 形式進行實驗性擷取，並支援審查、核准、隔離與 Skills 熱重新整理
title: 技能工作坊 Plugin
x-i18n:
    generated_at: "2026-05-07T13:24:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop 是**實驗性**功能。它預設為停用，其擷取
啟發式規則與審閱者提示可能會在版本之間變更，且自動
寫入只應在受信任的工作區中使用，並先檢閱 pending 模式
輸出。

Skill Workshop 是工作區 Skills 的程序式記憶。它讓代理程式將
可重用的工作流程、使用者修正、得來不易的修復，以及反覆出現的陷阱
轉換成位於以下路徑的 `SKILL.md` 檔案：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

這與長期記憶不同：

- **記憶**儲存事實、偏好、實體與過往情境。
- **Skills** 儲存代理程式未來任務中應遵循的可重用程序。
- **Skill Workshop** 是從一次有用的回合到持久工作區
  skill 之間的橋樑，並具備安全檢查與選擇性核准。

當代理程式學到如下程序時，Skill Workshop 很有用：

- 如何驗證外部來源的動畫 GIF 資產
- 如何替換螢幕截圖資產並驗證尺寸
- 如何執行特定儲存庫的 QA 情境
- 如何偵錯反覆出現的提供者失敗
- 如何修復過時的本機工作流程筆記

它不適用於：

- 例如「使用者喜歡藍色」這類事實
- 廣泛的自傳式記憶
- 原始逐字稿封存
- 密鑰、認證資料或隱藏提示文字
- 不會重複的一次性指示

## 預設狀態

除非在 `plugins.entries.skill-workshop` 中明確啟用，否則隨附的 Plugin 為**實驗性**且**預設停用**。

Plugin manifest 不會設定 `enabledByDefault: true`。Plugin 設定結構描述內的 `enabled: true`
預設值只會在 Plugin 項目已被選取並載入後才適用。

實驗性表示：

- Plugin 已有足夠支援，可用於選擇性測試與 dogfooding
- 提案儲存、審閱者門檻與擷取啟發式規則可能演進
- pending 核准是建議的起始模式
- auto apply 適用於受信任的個人／工作區設定，不適用於共享或敵意的
  高輸入量環境

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
- 明確的可重用修正會排入 pending 提案佇列
- 以門檻為基礎的審閱者流程可以提出 skill 更新
- 在套用 pending 提案之前，不會寫入任何 skill 檔案

只在受信任的工作區中使用自動寫入：

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

`approvalPolicy: "auto"` 仍使用相同的掃描器與隔離路徑。它
不會套用含有嚴重發現的提案。

## 設定

| 鍵                   | 預設值      | 範圍／值                                    | 含義                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | 在 Plugin 項目載入後啟用 Plugin。                                   |
| `autoCapture`        | `true`      | boolean                                     | 在成功的代理程式回合後啟用擷取／審閱。                              |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 將提案排入佇列，或自動寫入安全提案。                                |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 選擇明確修正擷取、LLM 審閱者、兩者，或兩者皆不使用。                 |
| `reviewInterval`     | `15`        | `1..200`                                    | 在這麼多次成功回合後執行審閱者。                                    |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 在觀察到這麼多次工具呼叫後執行審閱者。                              |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 內嵌審閱者執行的逾時時間。                                          |
| `maxPending`         | `50`        | `1..200`                                    | 每個工作區保留的 pending／已隔離提案數上限。                         |
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

Skill Workshop 有三種擷取路徑。

### 工具建議

當模型看到可重用程序，或使用者要求它儲存／更新 skill 時，
模型可以直接呼叫 `skill_workshop`。

這是最明確的路徑，即使使用 `autoCapture: false` 也能運作。

### 啟發式擷取

當 `autoCapture` 啟用且 `reviewMode` 為 `heuristic` 或 `hybrid` 時，
Plugin 會掃描成功回合中的明確使用者修正片語：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

啟發式規則會從最新相符的使用者指示建立提案。它會
使用主題提示為常見工作流程選擇 skill 名稱：

- 動畫 GIF 任務 -> `animated-gif-workflow`
- 螢幕截圖或資產任務 -> `screenshot-asset-workflow`
- QA 或情境任務 -> `qa-scenario-workflow`
- GitHub PR 任務 -> `github-pr-workflow`
- 後備 -> `learned-workflows`

啟發式擷取刻意保持狹窄。它適用於清楚的修正與
可重複的流程筆記，而非一般逐字稿摘要。

### LLM 審閱者

當 `autoCapture` 啟用且 `reviewMode` 為 `llm` 或 `hybrid` 時，Plugin
會在達到門檻後執行精簡的內嵌審閱者。

審閱者會收到：

- 最近的逐字稿文字，上限為最後 12,000 個字元
- 最多 12 個現有工作區 Skills
- 每個現有 skill 最多 2,000 個字元
- 僅 JSON 指示

審閱者沒有工具：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

審閱者會回傳 `{ "action": "none" }` 或一個提案。`action` 欄位為 `create`、`append` 或 `replace` - 當相關 skill 已存在時，優先使用 `append`／`replace`；只有在沒有符合的現有 skill 時才使用 `create`。

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

`append` 會加入 `section` + `body`。`replace` 會在指定 skill 中將 `oldText` 換成 `newText`。

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
- `rejected` - 已由操作者／模型拒絕
- `quarantined` - 因掃描器嚴重發現而遭封鎖

狀態會依工作區儲存在 Gateway 狀態目錄下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

待處理與已隔離的提案會依技能名稱與變更
酬載進行去重。儲存區會保留最新的待處理/已隔離提案，最多
`maxPending` 筆。

## 工具參考

Plugin 會註冊一個代理工具：

```text
skill_workshop
```

### `status`

依狀態統計作用中工作區的提案數量。

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

列出已隔離提案。

```json
{ "action": "list_quarantine" }
```

當自動擷取看似沒有任何作用，且記錄提到
`skill-workshop: quarantined <skill>` 時，請使用此項。

### `inspect`

依 id 擷取提案。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

建立提案。使用 `approvalPolicy: "pending"`（預設）時，這會排入佇列而非寫入。

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
  <Accordion title="Request immediate write in auto mode (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

使用 `approvalPolicy: "pending"` 時，`apply: true` 仍會將提案排入佇列。請先審查，核准後再使用
`apply` 動作。

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

使用 `approvalPolicy: "pending"` 時，此動作會在寫入
工作區技能前要求操作員核准。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` 會拒絕已隔離提案：

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

在既有或提議的技能目錄中寫入支援檔案。

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

支援檔案以工作區為範圍，會檢查路徑、受
`maxSkillBytes` 位元組限制、經過掃描，並以原子方式寫入。

## Skill 寫入

Skill Workshop 只會寫入以下位置：

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 名稱會被正規化：

- 轉為小寫
- 連續的非 `[a-z0-9_-]` 字元會變成 `-`
- 開頭/結尾的非英數字元會被移除
- 最大長度為 80 個字元
- 最終名稱必須符合 `[a-z0-9][a-z0-9_-]{1,79}`

對於 `create`：

- 如果 Skill 不存在，Skill Workshop 會寫入新的 `SKILL.md`
- 如果已存在，Skill Workshop 會將本文附加到 `## Workflow`

對於 `append`：

- 如果 Skill 存在，Skill Workshop 會附加到要求的章節
- 如果不存在，Skill Workshop 會建立最小 Skill，然後附加內容

對於 `replace`：

- Skill 必須已存在
- `oldText` 必須完全存在
- 只會取代第一個完全相符項目

所有寫入都是原子操作，並會立即重新整理記憶體內的 Skills 快照，因此
新的或已更新的 Skill 可以在不重新啟動 Gateway 的情況下變得可見。

## 安全模型

Skill Workshop 會對產生的 `SKILL.md` 內容和支援檔案執行安全掃描器。

重大發現會隔離提案：

| 規則 ID                                | 封鎖符合下列情況的內容...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 指示 agent 忽略先前/較高層級指示                   |
| `prompt-injection-system`              | 參照系統提示、開發者訊息或隱藏指示 |
| `prompt-injection-tool`                | 鼓勵繞過工具權限/核准                         |
| `shell-pipe-to-shell`                  | 包含將 `curl`/`wget` 管線傳入 `sh`、`bash` 或 `zsh`              |
| `secret-exfiltration`                  | 看似透過網路傳送 env/程序 env 資料                 |

警告發現會被保留，但本身不會封鎖：

| 規則 ID              | 警告內容...                      |
| -------------------- | -------------------------------- |
| `destructive-delete` | 廣泛的 `rm -rf` 風格命令    |
| `unsafe-permissions` | `chmod 777` 風格的權限使用 |

被隔離的提案：

- 保留 `scanFindings`
- 保留 `quarantineReason`
- 會出現在 `list_quarantine`
- 無法透過 `apply` 套用

若要從被隔離的提案恢復，請建立一個移除不安全內容的新安全提案。不要手動編輯儲存區 JSON。

## 提示指引

啟用時，Skill Workshop 會注入一小段提示章節，告訴 agent
使用 `skill_workshop` 作為持久的程序記憶。

該指引強調：

- 程序，而不是事實/偏好
- 使用者修正
- 不明顯的成功程序
- 重複出現的陷阱
- 透過附加/取代修復過時/薄弱/錯誤的 Skill
- 在長時間工具迴圈或困難修復後儲存可重用程序
- 簡短的祈使式 Skill 文字
- 不要傾印逐字稿

寫入模式文字會隨 `approvalPolicy` 改變：

- pending 模式：將建議排入佇列；在明確核准後使用 `apply`
- auto 模式：套用安全的工作區 Skill 更新，除非 `apply: false` 改為排入佇列

## 成本和執行階段行為

啟發式擷取不會呼叫模型。

LLM 審查會在作用中/預設 agent 模型上使用嵌入式執行。它以閾值為基礎，因此預設不會每回合都執行。

審查器：

- 可用時使用相同設定的 provider/模型情境
- 回退到執行階段 agent 預設值
- 具有 `reviewTimeoutMs`
- 使用輕量啟動情境
- 沒有工具
- 不會直接寫入任何內容
- 只能發出會通過一般掃描器和核准/隔離路徑的提案

如果審查器失敗、逾時或回傳無效 JSON，Plugin 會記錄警告/偵錯訊息，並略過該次審查。

## 操作模式

當使用者說以下內容時，使用 Skill Workshop：

- 「下次，執行 X」
- 「從現在起，優先使用 Y」
- 「務必驗證 Z」
- 「將此儲存為工作流程」
- 「這花了一些時間；記住流程」
- 「更新本機 Skill」

好的 Skill 文字：

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

不佳的 Skill 文字：

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

不應儲存不佳版本的原因：

- 形似逐字稿
- 不是祈使式
- 包含嘈雜的一次性細節
- 沒有告訴下一個 agent 要做什麼

## 偵錯

檢查 Plugin 是否已載入：

```bash
openclaw plugins list --enabled
```

從 agent/工具情境檢查提案數量：

```json
{ "action": "status" }
```

檢查待處理提案：

```json
{ "action": "list_pending" }
```

檢查已隔離提案：

```json
{ "action": "list_quarantine" }
```

常見症狀：

| 症狀                               | 可能原因                                                                        | 檢查                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 工具無法使用                   | Plugin 項目未啟用                                                         | `plugins.entries.skill-workshop.enabled` 和 `openclaw plugins list` |
| 沒有出現自動提案         | `autoCapture: false`、`reviewMode: "off"`，或未達閾值                    | 設定、提案狀態、Gateway 記錄                                |
| 啟發式未擷取             | 使用者措辭不符合修正模式                                      | 使用明確的 `skill_workshop.suggest` 或啟用 LLM 審查器         |
| 審查器未建立提案    | 審查器回傳 `none`、無效 JSON 或逾時                                | Gateway 記錄、`reviewTimeoutMs`、閾值                          |
| 提案未套用               | `approvalPolicy: "pending"`                                                         | `list_pending`，然後 `apply`                                         |
| 提案從待處理中消失     | 重複提案被重用、最大待處理修剪，或已套用/拒絕/隔離 | `status`、含狀態篩選器的 `list_pending`、`list_quarantine`      |
| Skill 檔案存在但模型未命中 | Skill 快照未重新整理，或 Skill 閘門排除它                            | `openclaw skills` 狀態和工作區 Skill 合格性             |

相關記錄：

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 情境

以 repo 為基礎的 QA 情境：

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

執行確定性涵蓋：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

執行審查器涵蓋：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

審查器情境是刻意分開的，因為它啟用
`reviewMode: "llm"` 並演練嵌入式審查器流程。

## 何時不要啟用自動套用

在以下情況避免使用 `approvalPolicy: "auto"`：

- 工作區包含敏感程序
- agent 正在處理不受信任的輸入
- Skills 由廣泛團隊共用
- 你仍在調整提示或掃描器規則
- 模型經常處理惡意網頁/電子郵件內容

先使用 pending 模式。只有在審查該工作區中 agent 提出的 Skills 類型後，才切換到 auto 模式。

## 相關文件

- [Skills](/zh-TW/tools/skills)
- [Plugins](/zh-TW/tools/plugin)
- [測試](/zh-TW/reference/test)
