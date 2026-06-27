---
read_when:
    - 你想從終端機讀取或寫入工作區檔案中的葉節点
    - 你正在針對工作區狀態編寫指令碼，並且想要一套穩定、與種類無關的定址方案
    - 你正在偵錯 `oc://` 路徑（驗證語法，查看它解析成什麼）
summary: '`openclaw path` 的命令列介面參考（透過 `oc://` 定址方案檢查和編輯工作區檔案）'
title: 路徑
x-i18n:
    generated_at: "2026-06-27T19:07:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

由外掛提供的 shell 存取，用於 `oc://` 定址基底：一種依類型分派的路徑配置，可用來檢查與編輯可定址的工作區檔案（markdown、jsonc、jsonl、yaml/yml/lobster）。自行託管者、外掛作者與編輯器擴充功能可用它讀取、尋找或更新狹窄位置，而不必為每種檔案手寫解析器。

命令列介面對應基底的公開動詞：

- `resolve` 是具體且單一匹配。
- `find` 是用於萬用字元、聯集、述詞與位置展開的多重匹配動詞。
- `set` 只接受具體路徑或插入標記；萬用字元模式會在寫入前被拒絕。

`path` 由內建的選用 `oc-path` 外掛提供。首次使用前請啟用它：

```bash
openclaw plugins enable oc-path
```

## 為什麼使用它

OpenClaw 狀態分散在人類編輯的 markdown、含註解的 JSONC 設定、僅附加的 JSONL 記錄，以及 YAML 工作流程/規格檔案中。Shell 指令碼、hook 與代理程式通常只需要這些檔案中的一個小值：frontmatter 鍵、外掛設定、記錄欄位、YAML 步驟，或具名區段下的項目符號項目。

`openclaw path` 讓這些呼叫端取得穩定位址，而不是為每種檔案類型撰寫一次性的 grep、正則表達式或解析器。同一個 `oc://` 路徑可以從終端驗證、解析、搜尋、試跑與寫入，讓狹窄自動化更容易審查，也更安全地重播。當你想更新單一葉節點，同時保留檔案其餘部分的註解、行尾與周邊格式時，它特別有用。

當你想處理的東西有邏輯位址，但實體檔案形狀不固定時，請使用它：

- hook 想從含註解的 JSONC 讀取一個設定，並在寫回值時不遺失註解。
- 維護指令碼想在 JSONL 記錄中尋找每個匹配的事件欄位，而不把整個記錄載入自訂解析器。
- 編輯器擴充功能想透過 slug 跳到 markdown 區段或項目符號項目，然後呈現它解析到的確切行。
- 代理程式想在套用前試跑一個很小的工作區編輯，並讓變更的位元組在審查中可見。

一般整檔編輯、豐富的設定遷移，或記憶體專用寫入，通常不需要 `openclaw path`。那些應該使用擁有者命令或外掛。`path` 用於小型、可定址的檔案操作，在這些情境中，可重複的終端命令會比另一個特製解析器更清楚。

## 如何使用

從人類編輯的設定檔讀取一個值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

預覽寫入而不碰磁碟：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在僅附加的 JSONL 記錄中尋找匹配記錄：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

用區段與項目定址 markdown 中的指示，而不是用行號：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在 CI 或預檢指令碼中驗證路徑，然後才讓指令碼讀取或寫入：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

這些命令設計為可複製到 shell 指令碼中。當呼叫端需要結構化輸出時使用 `--json`，當人員正在檢查結果時使用 `--human`。

## 運作方式

`openclaw path` 會做四件事：

1. 將 `oc://` 位址解析成槽位：檔案、區段、項目、欄位，以及選用的工作階段。
2. 從目標副檔名（`.md`、`.jsonc`、`.jsonl`、`.yaml`、`.yml`、`.lobster` 與相關別名）選擇檔案類型配接器。
3. 依照該檔案類型的 AST 解析槽位：markdown 標題/項目、JSONC 物件鍵/陣列索引、JSONL 行記錄，或 YAML 對應/序列節點。
4. 對於 `set`，透過同一個配接器輸出編輯後的位元組，讓檔案未碰觸的部分在該類型支援時保留註解、行尾與附近格式。

`resolve` 與 `set` 需要一個具體目標。`find` 是探索用動詞：它會將萬用字元、聯集、述詞與序數展開成具體匹配，讓你在選擇一個來寫入前先檢查。

## 子命令

| 子命令                  | 用途                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 列印路徑上的具體匹配（或 "not found"）。                                     |
| `find <pattern>`        | 列舉萬用字元 / 聯集 / 述詞路徑的匹配。                                       |
| `set <oc-path> <value>` | 在具體路徑寫入葉節點或插入目標。支援 `--dry-run`。                           |
| `validate <oc-path>`    | 僅解析；列印結構拆解（檔案 / 區段 / 項目 / 欄位）。                          |
| `emit <file>`           | 透過 `parseXxx` + `emitXxx` 往返處理檔案（位元組保真診斷）。                 |

## 全域旗標

| 旗標            | 用途                                                               |
| --------------- | ------------------------------------------------------------------ |
| `--cwd <dir>`   | 以此目錄解析檔案槽位（預設：`process.cwd()`）。                    |
| `--file <path>` | 覆寫檔案槽位解析後的路徑（絕對存取）。                             |
| `--json`        | 強制 JSON 輸出（stdout 不是 TTY 時的預設值）。                     |
| `--human`       | 強制人類可讀輸出（stdout 是 TTY 時的預設值）。                     |
| `--dry-run`     | （僅適用於 `set`）列印將寫入的位元組但不實際寫入。                 |
| `--diff`        | （搭配 `set --dry-run`）列印 unified diff，而不是完整位元組。      |

## `oc://` 語法

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

槽位規則：`field` 需要 `item`，且 `item` 需要 `section`。四個槽位皆適用：

- **引號區段** — `"a/b.c"` 會保留 `/` 與 `.` 分隔符。
  內容是位元組字面值；引號內不允許 `"` 與 `\`。
  檔案槽位也感知引號：`oc://"skills/email-drafter"/Tools/$last`
  會將 `skills/email-drafter` 視為單一檔案路徑。
- **述詞** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、
  `[k>=v]`。數值運算要求兩側都能強制轉換為有限數字。
- **聯集** — `{a,b,c}` 會匹配任一替代項。
- **萬用字元** — `*`（單一子區段）與 `**`（零或多個，遞迴）。
  `find` 接受這些；`resolve` 與 `set` 會因為語意不明而拒絕它們。
- **位置** — `$first` / `$last` 解析為第一個 / 最後一個索引或宣告鍵。
- **序數** — `#N` 表示依文件順序的第 N 個匹配。
- **插入標記** — `+`、`+key`、`+nnn`，用於具鍵 / 具索引的插入（搭配 `set` 使用）。
- **工作階段範圍** — `?session=cron-daily` 等。與槽位巢狀彼此正交。工作階段值是原始值，不會做百分比解碼；它們不得包含控制字元或保留的查詢分隔符（`?`、`&`、`%`）。

在引號、述詞或聯集區段之外的保留字元（`?`、`&`、`%`）會被拒絕。控制字元（U+0000-U+001F、U+007F）在任何位置都會被拒絕，包括 `session` 查詢值。

`formatOcPath(parseOcPath(path)) === path` 對標準路徑保證成立。非標準查詢參數會被忽略，但第一個非空的 `session=` 值除外。

## 依檔案類型定址

| 類型              | 定址模型                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | 依 slug 定址 H2 區段，依 slug 或 `#N` 定址項目符號項目，透過 `[frontmatter]` 定址 frontmatter。     |
| JSONC/JSON        | 物件鍵與陣列索引；除非加上引號，點會拆分巢狀子區段。                                               |
| JSONL             | 頂層行位址（`L1`、`L2`、`$first`、`$last`），再在該行內進行 JSONC 風格下降。                        |
| YAML/YML/.lobster | 對應鍵與序列索引；註解與 flow style 由 YAML 文件 API 處理。                                        |

`resolve` 會回傳結構化匹配：`root`、`node`、`leaf` 或
`insertion-point`，並附帶以 1 為基準的行號。葉節點值會以文字加上 `leafType` 顯示，讓外掛作者不依賴各檔案類型的 AST 形狀也能呈現預覽。

## 變更合約

`set` 會寫入一個具體目標：

- Markdown frontmatter 值與 `- key: value` 項目欄位是字串葉節點。
  Markdown 插入會附加區段、frontmatter 鍵或區段項目，並為變更後的檔案呈現標準 markdown 形狀。
- JSONC 葉節點寫入會將字串值強制轉換為既有葉節點類型
  （`string`、有限 `number`、`true`/`false` 或 `null`）。當 JSONC/JSON/JSONL 葉節點替換應將 `<value>` 解析為 JSON 且可能改變形狀時，請使用 `--value-json`，例如將字串 SecretRef 簡寫替換成物件。JSONC 物件與陣列插入會將 `<value>` 解析為 JSON，並對一般葉節點寫入使用 `jsonc-parser` 編輯路徑，以保留註解與附近格式。
- JSONL 葉節點寫入會像行內 JSONC 一樣強制轉換。整行替換與附加會將 `<value>` 解析為 JSON。呈現後的 JSONL 會保留檔案主要的 LF/CRLF 行尾慣例。
- YAML 葉節點寫入會強制轉換為既有純量類型（`string`、有限 `number`、`true`/`false` 或 `null`）。YAML 插入會使用內建 `yaml` 套件的文件 API 進行對應/序列更新。含解析器錯誤的格式不正確 YAML 文件會在變更前以 `parse-error` 拒絕。

當精確位元組很重要時，請在使用者可見的寫入前使用 `--dry-run`。基底會為解析/輸出往返保留位元組相同的輸出，但變更可能依檔案類型標準化已編輯區域或檔案。
當你想要以聚焦的前後差異修補形式預覽，而不是完整呈現檔案時，請加上 `--diff`。

## 範例

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

更多文法範例：

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## 依檔案類型分類的範例

同一組五個動詞可跨類型運作；定址配置會依檔案副檔名分派。以下範例使用 PR 說明中的 fixtures。

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

`[frontmatter]` 謂詞會定址 YAML frontmatter 區塊；`tools` 會透過 slug 比對 `## Tools` 標題，而項目葉節點會保留其 slug 形式，即使來源使用底線亦然（`send_email` → `send-email`）。

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC 編輯會透過 `jsonc-parser`，因此註解和空白會在 `set` 後保留下來。請先使用 `--dry-run` 執行，以便在提交前檢查位元組內容。

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

每一行都是一筆記錄。不知道行號時可用謂詞（`[event=action]`）定址，知道行號時則使用標準 `LN` 片段。

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML 使用 `yaml` 套件的 `Document` API，而不是手寫剖析器，因此一般的剖析/輸出來回轉換會保留註解與撰寫形態，同時解析後的路徑使用與 JSONC 相同的映射鍵 / 序列索引模型。同一個配接器會處理 `.yaml`、`.yml` 和 `.lobster` 檔案。

## 子命令參考

### `resolve <oc-path>`

讀取單一葉節點或節點。萬用字元會被拒絕，請對此類需求使用 `find`。符合時以 `0` 結束，乾淨未命中時以 `1` 結束，剖析錯誤或模式遭拒時以 `2` 結束。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

列舉萬用字元 / 謂詞 / 聯集模式的每個符合項目。至少有一個符合項目時以 `0` 結束，零個符合項目時以 `1` 結束。檔案位置萬用字元會以 `OC_PATH_FILE_WILDCARD_UNSUPPORTED` 拒絕；請傳入具體檔案（多檔案 globbing 是後續功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

寫入葉節點。搭配 `--dry-run` 可預覽將寫入的位元組，而不觸碰檔案。加入 `--diff` 可預覽 unified diff。成功寫入時以 `0` 結束，基底層拒絕時（例如命中 sentinel guard）以 `1` 結束，剖析錯誤時以 `2` 結束。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

若具名子項目尚不存在，`+key` 插入標記會建立該子項目；`+nnn` 和單獨的 `+` 分別用於索引插入與附加插入。

### `validate <oc-path>`

僅剖析檢查。不存取檔案系統。適合在替換變數前確認範本路徑格式正確，或在偵錯時查看結構拆解：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有效時以 `0` 結束，無效時以 `1` 結束（包含結構化的 `code` 和 `message`），引數錯誤時以 `2` 結束。

### `emit <file>`

透過各類型的剖析器和輸出器對檔案執行來回轉換。對於健全的檔案，輸出應與輸入在位元組層級完全相同；若有差異，表示剖析器 bug 或命中 sentinel。這對於在真實輸入上偵錯基底層行為很有用。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 結束代碼

| 代碼 | 含義                                                                       |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve` / `find`：至少一個符合項目。`set`：寫入成功。）          |
| `1`  | 沒有符合項目，或 `set` 被基底層拒絕（非系統層級錯誤）。                   |
| `2`  | 引數或剖析錯誤。                                                           |

## 輸出模式

`openclaw path` 會感知 TTY：在終端機上輸出人類可讀格式，stdout 被管線或重新導向時輸出 JSON。`--json` 和 `--human` 會覆寫自動偵測。

## 注意事項

- `set` 會透過基底層的輸出路徑寫入位元組，該路徑會自動套用 redaction-sentinel guard。帶有 `__OPENCLAW_REDACTED__`（逐字或作為子字串）的葉節點會在寫入時遭拒。
- JSONC 剖析和葉節點編輯使用外掛本機的 `jsonc-parser` 相依項，因此一般葉節點寫入會保留註解與格式，而不是經過手寫剖析器/重新渲染路徑。
- `path` 不知道 LKG。若檔案受 LKG 追蹤，下一次 observe 呼叫會決定是否 promote / recover。用於透過 LKG promote/recover 生命週期進行原子多重 set 的 `set --batch`，規劃將與 LKG-recovery 基底層一併提供。

## 相關

- [命令列介面參考](/zh-TW/cli)
