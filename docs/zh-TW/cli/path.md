---
read_when:
    - 你想從終端機讀取或寫入工作區檔案中的葉節點
    - 你正在針對工作區狀態撰寫指令碼，並想要一套穩定且與類型無關的定址方案
    - 你正在偵錯 `oc://` 路徑（驗證語法，查看它解析成什麼）
summary: '`openclaw path` 的 CLI 參考（透過 `oc://` 定址方案檢視和編輯工作區檔案）'
title: 路徑
x-i18n:
    generated_at: "2026-05-10T19:28:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

由 Plugin 提供的 shell 存取，用於 `oc://` 定址基底：一種依種類分派的路徑配置，可檢查與編輯可定址的工作區檔案（markdown、jsonc、jsonl）。自行託管者、Plugin 作者與編輯器擴充功能可用它讀取、尋找或更新狹窄位置，而不必為每種檔案手寫剖析器。

CLI 對應基底的公開動詞：

- `resolve` 是具體且單一符合項目。
- `find` 是用於萬用字元、聯集、述詞與位置展開的多符合項目動詞。
- `set` 只接受具體路徑或插入標記；萬用字元模式會在寫入前被拒絕。

`path` 由隨附的選用 `oc-path` Plugin 提供。首次使用前請先啟用：

```bash
openclaw plugins enable oc-path
```

## 為什麼使用它

OpenClaw 狀態分散在人類編輯的 markdown、帶註解的 JSONC 設定，以及僅附加的 JSONL 記錄中。shell 指令碼、hook 與代理通常只需要這些檔案中的一個小值：frontmatter 鍵、Plugin 設定、記錄欄位，或具名章節下的項目符號項目。

`openclaw path` 會給這些呼叫者一個穩定地址，而不是為每種檔案種類使用一次性的 grep、regex 或剖析器。同一個 `oc://` 路徑可以從終端機驗證、解析、搜尋、dry-run 與寫入，讓狹窄自動化更容易審閱，也更安全地重放。當你想更新單一葉節點，同時保留檔案其餘註解、換行符號與周邊格式時，它特別有用。

當你想要的項目有邏輯地址，但實體檔案形狀各不相同時，請使用它：

- hook 想從帶註解的 JSONC 讀取一項設定，並在寫回值時不失去註解。
- 維護指令碼想在 JSONL 記錄中尋找每個相符事件欄位，而不必把整個記錄載入自訂剖析器。
- 編輯器擴充功能想依 slug 跳至 markdown 章節或項目符號項目，然後呈現解析到的精確行。
- 代理想在套用前 dry-run 一個極小的工作區編輯，並在審閱中看見變更的位元組。

一般整檔編輯、豐富設定遷移或記憶體專用寫入，大概不需要 `openclaw path`。這些應該使用擁有者命令或 Plugin。`path` 適用於小型、可定址的檔案操作，且可重複的終端機命令比另一個特製剖析器更清楚。

## 如何使用

從人類編輯的設定檔讀取一個值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

預覽寫入而不碰觸磁碟：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在僅附加的 JSONL 記錄中尋找相符記錄：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

依章節與項目定址 markdown 中的指示，而不是依行號：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在指令碼讀取或寫入之前，於 CI 或預檢指令碼中驗證路徑：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

這些命令設計為可複製到 shell 指令碼中。呼叫者需要結構化輸出時使用 `--json`，人員檢查結果時使用 `--human`。

## 運作方式

`openclaw path` 做四件事：

1. 將 `oc://` 地址剖析成插槽：檔案、章節、項目、欄位與選用的工作階段。
2. 從目標副檔名（`.md`、`.jsonc`、`.jsonl` 與相關別名）選擇檔案種類配接器。
3. 依該檔案種類的 AST 解析插槽：markdown 標題/項目、JSONC 物件鍵/陣列索引，或 JSONL 行記錄。
4. 對於 `set`，透過同一個配接器輸出已編輯的位元組，讓檔案未碰觸的部分在該種類支援時保留其註解、換行符號與鄰近格式。

`resolve` 與 `set` 需要一個具體目標。`find` 是探索用動詞：它會將萬用字元、聯集、述詞與序數展開成具體符合項目，讓你在選擇一個寫入前檢查。

## 子命令

| 子命令                  | 目的                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 列印路徑上的具體符合項目（或「找不到」）。                                   |
| `find <pattern>`        | 列舉萬用字元 / 聯集 / 述詞路徑的符合項目。                                   |
| `set <oc-path> <value>` | 在具體路徑寫入葉節點或插入目標。支援 `--dry-run`。                           |
| `validate <oc-path>`    | 僅剖析；列印結構拆解（檔案 / 章節 / 項目 / 欄位）。                          |
| `emit <file>`           | 透過 `parseXxx` + `emitXxx` 來回處理檔案（位元組保真度診斷）。                |

## 全域旗標

| 旗標            | 目的                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `--cwd <dir>`   | 以此目錄解析檔案插槽（預設：`process.cwd()`）。                       |
| `--file <path>` | 覆寫檔案插槽解析出的路徑（絕對存取）。                                |
| `--json`        | 強制 JSON 輸出（stdout 不是 TTY 時的預設）。                          |
| `--human`       | 強制人類可讀輸出（stdout 是 TTY 時的預設）。                          |
| `--dry-run`     | （僅限 `set`）列印原本會寫入的位元組，但不實際寫入。                  |

## `oc://` 語法

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

插槽規則：`field` 需要 `item`，且 `item` 需要 `section`。在全部四個插槽中：

- **加引號的片段** — `"a/b.c"` 會保留 `/` 與 `.` 分隔符。
  內容是位元組字面值；引號內不允許 `"` 與 `\`。
  檔案插槽也感知引號：`oc://"skills/email-drafter"/Tools/$last`
  會將 `skills/email-drafter` 視為單一檔案路徑。
- **述詞** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、
  `[k>=v]`。數值運算需要兩側都可強制轉換為有限數字。
- **聯集** — `{a,b,c}` 符合任一替代項。
- **萬用字元** — `*`（單一子片段）與 `**`（零個或更多，
  遞迴）。`find` 接受這些；`resolve` 與 `set` 會因為
  模稜兩可而拒絕。
- **位置** — `$last` 解析為最後一個索引 / 最後宣告的鍵。
- **序數** — `#N` 表示依文件順序的第 N 個符合項目。
- **插入標記** — `+`、`+key`、`+nnn`，用於鍵控 / 索引插入
  （與 `set` 搭配使用）。
- **工作階段範圍** — `?session=cron-daily` 等。與插槽巢狀正交。
  工作階段值是原始值，不做百分比解碼；不得包含控制字元或保留的查詢分隔符（`?`、`&`、`%`）。

在加引號、述詞或聯集片段以外的保留字元（`?`、`&`、`%`）會被拒絕。控制字元（U+0000-U+001F、U+007F）在任何位置都會被拒絕，包括 `session` 查詢值。

`formatOcPath(parseOcPath(path)) === path` 對 canonical 路徑有保證。非 canonical 查詢參數會被忽略，但第一個非空的 `session=` 值除外。

## 依檔案種類定址

| 種類       | 定址模型                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | 依 slug 的 H2 章節、依 slug 或 `#N` 的項目符號項目、透過 `[frontmatter]` 的 frontmatter。 |
| JSONC/JSON | 物件鍵與陣列索引；除非加引號，否則點號會分割巢狀子片段。                                |
| JSONL      | 頂層行地址（`L1`、`L2`、`$last`），然後在該行內進行 JSONC 風格的向下巡覽。               |

`resolve` 會傳回結構化符合項目：`root`、`node`、`leaf` 或
`insertion-point`，並包含以 1 為基底的行號。葉節點值會以文字加上
`leafType` 呈現，讓 Plugin 作者可以呈現預覽，而不必依賴各種類 AST 形狀。

## 變更合約

`set` 會寫入一個具體目標：

- Markdown frontmatter 值與 `- key: value` 項目欄位是字串葉節點。
  Markdown 插入會附加章節、frontmatter 鍵或章節項目，並為變更後的檔案呈現 canonical markdown 形狀。
- JSONC 葉節點寫入會將字串值強制轉換為現有葉節點型別
  （`string`、有限 `number`、`true`/`false` 或 `null`）。JSONC 物件與陣列
  插入會將 `<value>` 剖析為 JSON，並對一般葉節點寫入使用 `jsonc-parser` 編輯路徑，
  保留註解與鄰近格式。
- JSONL 葉節點寫入會像 JSONC 一樣在一行內強制轉換。整行取代與
  附加會將 `<value>` 剖析為 JSON。呈現後的 JSONL 會保留檔案主要的
  LF/CRLF 換行慣例。

當精確位元組很重要時，請在使用者可見的寫入前使用 `--dry-run`。基底會為剖析/輸出來回處理保留位元組完全相同的輸出，但變更可能依種類 canonicalize 已編輯區域或檔案。

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

更多文法範例：

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## 依檔案種類的配方

相同五個動詞可跨種類運作；定址配置會依副檔名分派。以下範例使用 PR 說明中的 fixture。

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

`[frontmatter]` 述詞會定址 YAML frontmatter 區塊；`tools`
會透過 slug 符合 `## Tools` 標題，而項目葉節點即使來源使用底線（`send_email` → `send-email`），也會保留其 slug 形式。

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

JSONC 編輯會經由 `jsonc-parser`，因此註解與空白字元會在
`set` 後保留下來。請先搭配 `--dry-run` 執行，以便在提交前檢查位元組。

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

每一行都是一筆記錄。不知道行號時請用述詞（`[event=action]`）定址，
知道時則使用標準 `LN` 區段定址。

## 子命令參考

### `resolve <oc-path>`

讀取單一葉節點或節點。會拒絕萬用字元，請改用 `find`。
符合時結束代碼為 `0`，明確未命中時為 `1`，解析錯誤或拒絕的
模式時為 `2`。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

列舉萬用字元 / 述詞 / 聯集模式的所有符合項目。至少有一個符合項目時結束代碼為 `0`，
沒有符合項目時為 `1`。檔案槽位萬用字元會以
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` 拒絕，請傳入具體檔案（多檔案
glob 是後續功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

寫入葉節點。搭配 `--dry-run` 可預覽會寫入的位元組，
且不會碰觸檔案。成功寫入時結束代碼為 `0`，底層介面拒絕時（例如命中哨兵防護）為 `1`，
解析錯誤時為 `2`。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

若具名子項目尚不存在，`+key` 插入標記會建立該子項目；
`+nnn` 與單獨的 `+` 則分別用於索引插入與附加插入。

### `validate <oc-path>`

僅解析檢查。不存取檔案系統。適用於在替換變數前確認
範本路徑格式正確，或需要結構拆解以進行偵錯時：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有效時結束代碼為 `0`，無效時為 `1`（含結構化的 `code` 與
`message`），引數錯誤時為 `2`。

### `emit <file>`

透過各類型的解析器與發射器來往返處理檔案。在健全檔案上，輸出應與輸入位元組完全一致；
若有差異，代表解析器錯誤或命中哨兵。這對偵錯真實輸入上的底層介面行為很有用。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 結束代碼

| 代碼 | 意義                                                                       |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve` / `find`：至少一個符合項目。`set`：寫入成功。）          |
| `1`  | 無符合項目，或 `set` 被底層介面拒絕（沒有系統層級錯誤）。                 |
| `2`  | 引數或解析錯誤。                                                           |

## 輸出模式

`openclaw path` 具備 TTY 感知能力：在終端機上輸出人類可讀格式，
stdout 被管線傳送或重新導向時輸出 JSON。`--json` 與 `--human` 會覆寫
自動偵測。

## 注意事項

- `set` 會透過底層介面的發射路徑寫入位元組，該路徑會自動套用
  遮蔽哨兵防護。帶有 `__OPENCLAW_REDACTED__` 的葉節點（逐字或作為子字串）
  會在寫入時被拒絕。
- JSONC 解析與葉節點編輯使用 Plugin 本機的 `jsonc-parser`
  相依性，因此一般葉節點寫入時會保留註解與格式，而不是經過手寫解析器/重新渲染路徑。
- `path` 不知道 LKG。如果檔案受到 LKG 追蹤，下一次
  observe 呼叫會決定是否提升 / 復原。計劃中的 `set --batch`
  會搭配 LKG 復原底層介面，透過 LKG 提升/復原生命週期執行原子多重設定。

## 相關

- [CLI 參考](/zh-TW/cli)
