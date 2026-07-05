---
read_when:
    - 你想從終端機讀取或寫入工作區檔案中的葉節點
    - 你正在針對工作區狀態撰寫指令碼，並且想要一套穩定且不依類型而異的定址方案
    - 你正在偵錯 `oc://` 路徑（驗證語法，看看它解析成什麼）
summary: '`openclaw path` 的命令列介面參考（透過 `oc://` 定址方案檢查與編輯工作區檔案）'
title: 路徑
x-i18n:
    generated_at: "2026-07-05T11:10:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

對 `oc://` 定址配置的 shell 存取：一種依類型分派的路徑語法，用於檢查與編輯可定址的工作區檔案（markdown、jsonc、jsonl、yaml/yml/lobster）。自架設者、外掛作者與編輯器擴充功能會使用它讀取、尋找或更新狹窄位置，而不必手寫每個檔案專用的剖析器。

`path` 由隨附的選用 `oc-path` 外掛提供。首次使用前請啟用它：

```bash
openclaw plugins enable oc-path
```

命令列介面動詞會對應定址模型：

- `resolve` 是具體且單一符合項。
- `find` 是萬用字元、聯集、述詞與位置展開的多符合項動詞。
- `set` 只接受具體路徑或插入標記；萬用字元模式會在寫入前被拒絕。
- `validate` 會剖析路徑，不存取檔案系統。
- `emit` 會將檔案經由剖析 + 輸出進行往返處理（位元組保真度診斷）。

## 為什麼使用它

OpenClaw 狀態分散在人工編輯的 markdown、含註解的 JSONC 設定、僅附加的 JSONL 日誌，以及 YAML 工作流程/規格檔案中。指令碼、鉤子與代理通常只需要那些檔案中的一個小值：frontmatter 鍵、外掛設定、日誌記錄欄位、YAML 步驟，或具名區段下的項目符號項目。

`openclaw path` 會為這些呼叫端提供穩定地址，而不是為每種檔案類型使用一次性的 grep、regex 或剖析器。同一個 `oc://` 路徑可以從終端機驗證、解析、搜尋、試跑並寫入，讓狹窄自動化保持可審查且可重播。它會保留檔案其餘部分，因此寫入單一葉節點不會擾動註解、行尾或鄰近格式。

當你想要的內容有邏輯地址，但檔案形狀不一時使用它：

- 鉤子從含註解的 JSONC 讀取一項設定，並在寫回值時不遺失註解。
- 維護指令碼在 JSONL 日誌中尋找每個符合的事件欄位，而不將整個日誌載入自訂剖析器。
- 編輯器依 slug 跳到 markdown 區段或項目符號項目，然後呈現它解析到的確切行。
- 代理在套用小型工作區編輯前先試跑，並讓變更的位元組在審查中可見。

一般整檔編輯、豐富的設定遷移或記憶體專用寫入，請略過 `openclaw path`；那些應使用擁有者命令或外掛。`path` 適用於小型、可定址的檔案操作，其中可重複的終端機命令勝過另一個客製剖析器。

## 使用方式

從人工編輯的設定檔讀取一個值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

預覽寫入而不碰觸磁碟：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在僅附加的 JSONL 日誌中尋找符合記錄：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

依區段與項目定址 markdown 中的指示，而不是依行號：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在 CI 或預檢指令碼中，在指令碼讀取或寫入前驗證路徑：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

這些命令設計為可複製到 shell 指令碼中。當呼叫端需要結構化輸出時使用 `--json`；當人員檢查結果時使用 `--human`。

## 運作方式

1. 將 `oc://` 地址剖析成插槽：檔案、區段、項目、欄位，以及選用的工作階段查詢。
2. 從目標副檔名選擇檔案類型配接器（`.md`、`.jsonc`、`.json`、`.jsonl`、`.ndjson`、`.yaml`、`.yml`、`.lobster`）。
3. 依該檔案類型的結構解析插槽：markdown 標題/項目、JSONC 物件鍵/陣列索引、JSONL 行記錄，或 YAML 對應/序列節點。
4. 對於 `set`，透過同一個配接器輸出已編輯的位元組，讓檔案未碰觸部分在該類型支援時保留註解、行尾與鄰近格式。

`resolve` 與 `set` 需要一個具體目標。`find` 是探索用動詞：它會將萬用字元、聯集、述詞與序數展開成具體符合項，讓你在選擇一個寫入前可以檢查。

## 子命令

| 子命令                  | 用途                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 印出路徑上的具體符合項（或 "not found"）。                                  |
| `find <pattern>`        | 列舉萬用字元 / 聯集 / 述詞路徑的符合項。                                    |
| `set <oc-path> <value>` | 在具體路徑寫入葉節點或插入目標。支援 `--dry-run`。                          |
| `validate <oc-path>`    | 僅剖析；印出結構分解（檔案 / 區段 / 項目 / 欄位）。                         |
| `emit <file>`           | 將檔案經由剖析 + 輸出往返處理（位元組保真度診斷）。                         |

## 全域旗標

| 旗標            | 適用於                           | 用途                                                                       |
| --------------- | -------------------------------- | -------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | 以此目錄解析檔案插槽（預設：`process.cwd()`）。                            |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | 覆寫檔案插槽解析後的路徑（絕對存取）。                                     |
| `--json`        | 全部                             | 強制 JSON 輸出（stdout 不是 TTY 時的預設值）。                             |
| `--human`       | 全部                             | 強制人類可讀輸出（stdout 是 TTY 時的預設值）。                             |
| `--value-json`  | `set`                            | 將 `<value>` 剖析為 JSON，用於 JSON/JSONC/JSONL 葉節點替換。               |
| `--dry-run`     | `set`                            | 印出將會寫入的位元組，而不實際寫入。                                       |
| `--diff`        | `set`（需要 `--dry-run`）        | 印出 unified diff，而不是完整位元組。                                      |

`validate` 只接受 `--json` / `--human`；它不存取檔案系統，因此 `--cwd` 與 `--file` 不適用。

## `oc://` 語法

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

插槽規則：`field` 需要 `item`，而 `item` 需要 `section`。在全部四個插槽中：

- **引用片段** — `"a/b.c"` 會保留 `/` 與 `.` 分隔符。內容是位元組字面值；引號內不允許 `"` 與 `\`。檔案插槽也會感知引用：`oc://"skills/email-drafter"/Tools/$last` 會將 `skills/email-drafter` 視為單一檔案路徑。
- **述詞** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、`[k>=v]`。數值運算子要求兩側都能強制轉換為有限數字。
- **聯集** — `{a,b,c}` 符合任一替代項。
- **萬用字元** — `*`（單一子片段）與 `**`（零個或多個，遞迴）。`find` 接受這些；`resolve` 與 `set` 會因其模稜兩可而拒絕。
- **位置** — `$first` / `$last` 解析為第一個 / 最後一個索引或宣告鍵。
- **序數** — `#N` 表示依文件順序的第 N 個符合項。
- **插入標記** — `+`、`+key`、`+nnn` 用於鍵控 / 索引插入（搭配 `set` 使用）。
- **工作階段範圍** — `?session=cron-daily` 等等。與插槽巢狀正交。工作階段值是原始值，不會百分比解碼；不得包含控制字元或保留查詢分隔符（`?`、`&`、`%`）。

在引用、述詞或聯集片段外的保留字元（`?`、`&`、`%`）會被拒絕。控制字元（U+0000-U+001F、U+007F）在任何位置都會被拒絕，包括 `session` 查詢值。

對於標準路徑，保證 `formatOcPath(parseOcPath(path)) === path`。非標準查詢參數會被忽略，除了第一個非空的 `session=` 值。

硬性限制：路徑上限為 4096 位元組，最多 4 個插槽（file/section/item/field），每個插槽最多 64 個點分子片段，深層 JSON 路徑最多 256 層巢狀走訪。另外，任何超過 16 MiB 的 JSONC/JSON 檔案輸入，對任何會載入該檔案的動詞，都會以剖析診斷拒絕，而不是進行剖析。

## 依檔案類型定址

| 類型          | 副檔名                      | 定址模型                                                                                            |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | 依 slug 定址 H2 區段、依 slug 或 `#N` 定址項目符號項目、透過 `[frontmatter]` 定址 frontmatter。     |
| JSONC/JSON    | `.jsonc`, `.json`           | 物件鍵與陣列索引；除非引用，否則點號會分割巢狀子片段。                                             |
| JSONL         | `.jsonl`, `.ndjson`         | 頂層行地址（`L1`、`L2`、`$first`、`$last`），接著在行內進行 JSONC 風格下鑽。                        |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster` | 對應鍵與序列索引；註解與 flow style 由 YAML 文件 API 處理。                                        |

`resolve` 會回傳結構化符合項：`root`、`node`、`leaf` 或 `insertion-point`，並附帶 1 起算的行號。葉節點值會以文字加上 `leafType` 顯示，因此外掛作者可以呈現預覽，而不依賴各類型的 AST 形狀。

## 變更契約

`set` 會寫入一個具體目標：

- Markdown frontmatter 值與 `- key: value` 項目欄位是字串葉節點。Markdown 插入會附加區段、frontmatter 鍵或區段項目，並為變更後的檔案呈現標準 markdown 形狀。區段本文無法透過 `set` 作為整體寫入。
- JSONC 葉節點寫入會將字串值強制轉換為現有葉節點類型（`string`、有限 `number`、`true`/`false` 或 `null`）。當 JSONC/JSON/JSONL 葉節點替換應將 `<value>` 剖析為 JSON 並可能改變形狀時，請使用 `--value-json`，例如將字串 secret-ref 簡寫替換成物件。JSONC 物件與陣列插入會將 `<value>` 剖析為 JSON，並對一般葉節點寫入使用 `jsonc-parser` 編輯路徑，以保留註解與鄰近格式。
- JSONL 葉節點寫入會在行內像 JSONC 一樣強制轉換。整行替換與附加會將 `<value>` 剖析為 JSON。呈現的 JSONL 會保留檔案主要的 LF/CRLF 行尾慣例（跨檔案換行多數決，因此即使有少數零散 LF，主要為 CRLF 的檔案仍保持 CRLF）。
- YAML 葉節點寫入會強制轉換為現有純量類型（`string`、有限 `number`、`true`/`false` 或 `null`）。YAML 插入會使用隨附 `yaml` 套件的文件 API 進行對應/序列更新。帶有剖析器錯誤的格式錯誤 YAML 文件，會在變更前以 `parse-error` 拒絕。

當確切位元組很重要時，請在使用者可見寫入前使用 `--dry-run`。JSONC 與 YAML 編輯會修補現有文件（透過 `jsonc-parser` 或 `yaml` 文件 API），因此未碰觸的位元組通常會保留下來；markdown 會在任何編輯時從剖析後結構重建檔案，這可能會正規化變更葉節點外的偶然格式。當你想要以聚焦的前後補丁預覽，而不是完整呈現檔案時，請加上 `--diff`。

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

## 依檔案種類分類的配方

相同的五個動詞可跨種類運作；定址配置會依
檔案副檔名分派。

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

`[frontmatter]` 謂詞會定址 YAML frontmatter 區塊；`tools`
會透過 slug 比對 `## Tools` 標題，而項目葉節點會保留其 slug 形式，
即使來源使用底線也一樣（`send_email` 會變成 `send-email`）。

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

JSONC 編輯會經由 `jsonc-parser`，因此註解與空白會在
`set` 後保留下來。請先搭配 `--dry-run` 執行，以便在提交前檢查位元組。
`.json` 檔案使用與 `.jsonc` 相同的配接器與編輯路徑。

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

每一行都是一筆記錄。不知道行號時，可用謂詞（`[event=action]`）定址；
知道行號時，則可用標準的 `LN` 片段定址。
`.ndjson` 檔案使用與 `.jsonl` 相同的配接器。

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

YAML 使用 `yaml` 套件的 `Document` API，而非手刻
剖析器，因此一般的剖析/輸出往返會保留註解與撰寫形狀，
同時解析後的路徑會使用與 JSONC 相同的映射鍵 / 序列索引模型。
同一個配接器會處理 `.yaml`、`.yml` 與 `.lobster` 檔案。

## 子命令參考

### `resolve <oc-path>`

讀取單一葉節點或節點。萬用字元會被拒絕，這類情況請使用 `find`。
找到相符項目時以 `0` 結束，乾淨未命中時以 `1` 結束，
剖析錯誤或模式被拒絕時以 `2` 結束。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

列舉萬用字元 / 謂詞 / 聯集模式的每個相符項目。
至少找到一個相符項目時以 `0` 結束，零個相符項目時以 `1` 結束。
檔案槽位萬用字元會以 `OC_PATH_FILE_WILDCARD_UNSUPPORTED` 拒絕；
請傳入具體檔案（多檔案 glob 是後續功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

寫入葉節點。搭配 `--dry-run` 可預覽將要寫入的位元組，
且不會碰觸檔案。加入 `--diff` 可預覽 unified diff。
成功寫入時以 `0` 結束，基底拒絕時（例如命中 sentinel 防護）以 `1` 結束，
剖析錯誤時以 `2` 結束。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 插入標記會在具名子項尚不存在時建立它；
`+nnn` 與裸 `+` 分別用於索引插入與附加插入。

### `validate <oc-path>`

僅剖析檢查。不存取檔案系統。當你想在替換變數前確認
範本路徑格式正確，或想查看結構拆解以便偵錯時很有用：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有效時以 `0` 結束，無效時以 `1` 結束（附結構化的 `code` 與
`message`），引數錯誤時以 `2` 結束。

### `emit <file>`

透過各種類專用的剖析器與輸出器往返輸出檔案。
對於正常檔案，輸出應與輸入在位元組層級完全相同；
若出現差異，表示剖析器有錯誤或命中了 sentinel。
這對於在真實世界輸入上偵錯基底行為很有用。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 結束代碼

| 代碼 | 意義                                                                       |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve` / `find`：至少一個相符項目。`set`：寫入成功。）          |
| `1`  | 沒有相符項目，或 `set` 被基底拒絕（沒有系統層級錯誤）。                  |
| `2`  | 引數或剖析錯誤。                                                           |

## 輸出模式

`openclaw path` 具備 TTY 感知能力：在終端機上輸出人類可讀格式，
當 stdout 被管線傳送或重新導向時輸出 JSON。`--json` 與 `--human`
會覆寫自動偵測。

## 備註

- `set` 會透過基底的輸出路徑寫入位元組，該路徑會自動套用
  redaction-sentinel 防護。帶有 `__OPENCLAW_REDACTED__`
  （逐字或作為子字串）的葉節點會在寫入時被拒絕。
- JSONC 剖析與葉節點編輯使用外掛本機的 `jsonc-parser`
  相依項，因此一般葉節點寫入時會保留註解與格式，
  而不是經由手刻剖析器/重新渲染路徑。
- `path` 不知道 last-known-good (LKG) 設定追蹤或復原；
  該生命週期由其他地方負責。如果你透過 `path` 編輯的檔案
  也受 LKG 追蹤，下一次設定讀取會決定要提升還是復原它；
  請將 `path` 編輯視為對該檔案的任何其他直接寫入。

## 相關

- [命令列介面參考](/zh-TW/cli)
