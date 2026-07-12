---
read_when:
    - 你想要從終端機讀取或寫入工作區檔案中的葉節點
    - 你正在針對工作區狀態撰寫指令碼，並希望採用不受類型影響的穩定定址方案
    - 你正在偵錯 `oc://` 路徑（驗證其語法，並查看它解析為何）
summary: '`openclaw path` 的命令列介面參考（透過 `oc://` 定址機制檢查及編輯工作區檔案）'
title: 路徑
x-i18n:
    generated_at: "2026-07-11T21:15:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

透過 Shell 存取 `oc://` 定址配置：這是一種依檔案種類分派的路徑語法，
用於檢查與編輯工作區中可定址的檔案（markdown、jsonc、jsonl、
yaml/yml/lobster）。自行託管者、外掛作者及編輯器擴充功能可用它讀取、
尋找或更新特定的小範圍位置，無須為每種檔案自行編寫剖析器。

`path` 由隨附的選用 `oc-path` 外掛提供。首次使用前請先啟用：

```bash
openclaw plugins enable oc-path
```

命令列介面的動詞與定址模型相互對應：

- `resolve` 用於具體且唯一的比對。
- `find` 是用於萬用字元、聯集、述詞及位置展開的多重比對動詞。
- `set` 僅接受具體路徑或插入標記；寫入前會拒絕萬用字元模式。
- `validate` 會剖析路徑，但不存取檔案系統。
- `emit` 會讓檔案經過剖析與輸出的來回轉換（位元組保真度診斷）。

## 為何使用它

OpenClaw 狀態分散於人工編輯的 markdown、含註解的 JSONC
設定、僅附加的 JSONL 記錄，以及 YAML 工作流程／規格檔案中。指令碼、
鉤子及代理程式經常只需要這些檔案中的一個小值：frontmatter 鍵、
外掛設定、記錄欄位、YAML 步驟，或具名章節下的項目符號項目。

`openclaw path` 為這些呼叫端提供穩定的位址，無須針對每種檔案各自使用
臨時的 grep、規則運算式或剖析器。同一個 `oc://` 路徑可從終端機進行
驗證、解析、搜尋、試執行及寫入，讓小範圍的自動化易於審查及重播。
它會保留檔案的其餘部分，因此寫入單一葉節點不會干擾其註解、行尾格式
或鄰近的格式設定。

當目標具有邏輯位址，但檔案形式各異時，請使用它：

- 鉤子可從含註解的 JSONC 讀取一項設定，並在寫回該值時保留註解。
- 維護指令碼可在 JSONL 記錄中尋找每個相符的事件欄位，無須將整份記錄
  載入自訂剖析器。
- 編輯器可依 slug 跳至 markdown 章節或項目符號項目，然後呈現解析到的
  確切行。
- 代理程式可在套用小範圍工作區編輯前進行試執行，並在審查中顯示變更的
  位元組。

一般的整份檔案編輯、複雜的設定遷移或記憶體專用寫入，不應使用
`openclaw path`；這些作業應使用其擁有者命令或外掛。`path` 適用於
小範圍且可定址的檔案操作，讓可重複執行的終端機命令取代另一個特製剖析器。

## 使用方式

從人工編輯的設定檔讀取一個值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

在不接觸磁碟的情況下預覽寫入：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在僅附加的 JSONL 記錄中尋找相符記錄：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

依 markdown 的章節與項目定址指示，而非使用行號：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在命令列介面或預檢指令碼讀寫前驗證路徑：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

這些命令旨在供複製至 Shell 指令碼中使用。呼叫端需要結構化輸出時使用
`--json`，由人員檢查結果時則使用 `--human`。

## 運作方式

1. 將 `oc://` 位址剖析成多個欄位：檔案、章節、項目、欄位及選用的工作階段查詢。
2. 根據目標副檔名選擇檔案種類轉接器（`.md`、`.jsonc`、
   `.json`、`.jsonl`、`.ndjson`、`.yaml`、`.yml`、`.lobster`）。
3. 依該檔案種類的結構解析各欄位：markdown 標題／項目、JSONC 物件鍵／
   陣列索引、JSONL 行記錄，或 YAML 對應表／序列節點。
4. 對於 `set`，會透過同一個轉接器輸出編輯後的位元組，使檔案中未變更的
   部分在該種類支援的情況下保留其註解、行尾格式及鄰近格式設定。

`resolve` 與 `set` 都需要一個具體目標。`find` 是探索用動詞：它會將
萬用字元、聯集、述詞及序位展開成具體比對項目，供你在選擇寫入目標前檢查。

## 子命令

| 子命令                  | 用途                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 輸出路徑上的具體比對結果（或「找不到」）。                                  |
| `find <pattern>`        | 列舉萬用字元／聯集／述詞路徑的比對結果。                                    |
| `set <oc-path> <value>` | 在具體路徑寫入葉節點或插入目標。支援 `--dry-run`。                           |
| `validate <oc-path>`    | 僅剖析；輸出結構分解（檔案／章節／項目／欄位）。                             |
| `emit <file>`           | 讓檔案經過剖析與輸出的來回轉換（位元組保真度診斷）。                        |

## 全域旗標

| 旗標            | 適用於                           | 用途                                                                         |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`、`find`、`set`、`emit` | 相對於此目錄解析檔案欄位（預設：`process.cwd()`）。                          |
| `--file <path>` | `resolve`、`find`、`set`、`emit` | 覆寫檔案欄位解析出的路徑（絕對路徑存取）。                                   |
| `--json`        | 全部                             | 強制輸出 JSON（stdout 不是 TTY 時的預設值）。                                |
| `--human`       | 全部                             | 強制輸出人類可讀格式（stdout 是 TTY 時的預設值）。                           |
| `--value-json`  | `set`                            | 將 `<value>` 剖析為 JSON，以取代 JSON/JSONC/JSONL 葉節點。                   |
| `--dry-run`     | `set`                            | 輸出原本會寫入的位元組，但不實際寫入。                                       |
| `--diff`        | `set`（需要 `--dry-run`）        | 輸出統一格式差異，而非完整位元組。                                           |

`validate` 僅接受 `--json`／`--human`；它不會存取檔案系統，因此
`--cwd` 與 `--file` 不適用。

## `oc://` 語法

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

欄位規則：`field` 需要 `item`，而 `item` 需要 `section`。所有四個欄位
皆適用以下規則：

- **引號片段** — `"a/b.c"` 不受 `/` 與 `.` 分隔符影響。內容為位元組字面值；
  引號內不允許 `"` 與 `\`。檔案欄位也能辨識引號：
  `oc://"skills/email-drafter"/Tools/$last` 會將
  `skills/email-drafter` 視為單一檔案路徑。
- **述詞** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、`[k>=v]`。
  數值運算子要求兩側都能強制轉換為有限數值。
- **聯集** — `{a,b,c}` 可比對任一替代項目。
- **萬用字元** — `*`（單一子片段）及 `**`（零個以上、遞迴）。
  `find` 接受這些字元；`resolve` 與 `set` 會因其語意不明確而拒絕。
- **位置** — `$first`／`$last` 會解析為第一個／最後一個索引或宣告的鍵。
- **序位** — `#N` 表示依文件順序排列的第 N 個比對結果。
- **插入標記** — `+`、`+key`、`+nnn` 用於具鍵／具索引的插入
  （搭配 `set` 使用）。
- **工作階段範圍** — `?session=cron-daily` 等。與欄位巢狀結構互相獨立。
  工作階段值為原始值，不會進行百分比解碼；其中不得包含控制字元或保留的
  查詢分隔符（`?`、`&`、`%`）。

位於引號、述詞或聯集片段之外的保留字元（`?`、`&`、`%`）會遭拒絕。
控制字元（U+0000-U+001F、U+007F）無論出現在何處都會遭拒絕，包括
`session` 查詢值。

對於正規路徑，保證 `formatOcPath(parseOcPath(path)) === path`。
除第一個非空的 `session=` 值外，非正規查詢參數都會被忽略。

硬性限制：路徑上限為 4096 位元組、最多 4 個欄位（檔案／章節／項目／
欄位）、每個欄位最多 64 個以點號分隔的子片段，深層 JSON 路徑則最多
256 層巢狀走訪。此外，對於任何會載入檔案的動詞，超過 16 MiB 的
JSONC/JSON 輸入檔都會被拒絕並回報剖析診斷，而不會實際進行剖析。

## 依檔案種類定址

| 種類          | 副檔名                      | 定址模型                                                                                           |
| ------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | 依 slug 定址 H2 章節，依 slug 或 `#N` 定址項目符號項目，透過 `[frontmatter]` 定址 frontmatter。   |
| JSONC/JSON    | `.jsonc`、`.json`           | 物件鍵與陣列索引；除非使用引號，否則點號會分隔巢狀子片段。                                        |
| JSONL         | `.jsonl`、`.ndjson`         | 頂層行位址（`L1`、`L2`、`$first`、`$last`），接著在行內以 JSONC 方式向下定址。                    |
| YAML/.lobster | `.yaml`、`.yml`、`.lobster` | 對應表鍵與序列索引；註解與流式樣式由 YAML 文件 API 處理。                                         |

`resolve` 會傳回結構化比對結果：`root`、`node`、`leaf` 或
`insertion-point`，並附上從 1 起算的行號。葉節點值會以文字加上
`leafType` 呈現，讓外掛作者無須依賴各檔案種類的 AST 形式即可呈現預覽。

## 變更合約

`set` 會寫入一個具體目標：

- Markdown frontmatter 值及 `- key: value` 項目欄位屬於字串葉節點。
  Markdown 插入會附加章節、frontmatter 鍵或章節項目，並針對變更後的檔案
  呈現正規 markdown 形式。無法透過 `set` 將整個章節本文作為寫入目標。
- JSONC 葉節點寫入會將字串值強制轉換為現有葉節點的型別
  （`string`、有限 `number`、`true`／`false` 或 `null`）。當
  JSONC/JSON/JSONL 葉節點取代應將 `<value>` 剖析為 JSON 並且可能改變
  結構時，請使用 `--value-json`，例如將字串形式的秘密參照簡寫取代為
  物件。JSONC 物件與陣列插入會將 `<value>` 剖析為 JSON，普通葉節點
  寫入則使用 `jsonc-parser` 編輯路徑，保留註解及鄰近格式設定。
- JSONL 葉節點寫入會在線內採用與 JSONC 相同的強制轉換。整行取代與附加
  會將 `<value>` 剖析為 JSON。呈現後的 JSONL 會保留檔案主要的 LF/CRLF
  行尾慣例（依檔案中換行符號多數決，因此主要使用 CRLF 的檔案即使含有少量
  零星 LF，仍會維持 CRLF）。
- YAML 葉節點寫入會強制轉換為現有純量型別（`string`、有限
  `number`、`true`／`false` 或 `null`）。YAML 插入會使用隨附的
  `yaml` 套件文件 API 更新對應表／序列。含有剖析器錯誤的格式不正確
  YAML 文件，會在變更前以 `parse-error` 拒絕處理。

當確切位元組很重要時，請在使用者可見的寫入前使用 `--dry-run`。JSONC
與 YAML 編輯會修補現有文件（透過 `jsonc-parser` 或 `yaml` 文件 API），
因此通常能保留未變更的位元組；markdown 會在任何編輯時依其剖析結構重建
檔案，因此可能將變更葉節點以外的非必要格式正規化。若要將預覽顯示為聚焦的
前後差異修補，而非完整呈現的檔案，請加上 `--diff`。

## 範例

```bash
# 驗證路徑（不存取檔案系統）
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# 讀取葉節點
openclaw path resolve 'oc://gateway.jsonc/version'

# 萬用字元搜尋
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# 試執行寫入
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# 以統一格式差異試執行寫入
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# 套用寫入
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# 位元組保真度來回轉換（診斷）
openclaw path emit ./AGENTS.md
```

更多文法範例：

```bash
# 將包含 / 或 . 的鍵加上引號
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# 深層 JSON/JSONC 路徑可使用斜線分段；這些分段會正規化為以點號分隔的子分段
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# 以解析後的物件取代 JSONC 葉節點
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# 在 JSONC 子節點上進行述詞搜尋
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# 插入 JSONC 陣列
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# 插入 JSONC 物件鍵
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# 附加 JSONL 事件
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# 解析最後一行 JSONL 值
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# 解析 YAML 工作流程步驟
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# 更新 YAML 純量
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# 定位 Markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# 插入 Markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# 尋找 Markdown 項目欄位
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# 驗證工作階段範圍的路徑
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## 依檔案種類分類的操作範例

相同的五個動詞適用於所有種類；定址機制會根據
副檔名進行分派。

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
葉節點 @ L4：「core」（字串）

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
葉節點 @ L9：「GitHub 命令列介面」（字串）

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
oc://x.md/tools/* 有 3 個相符項目：
  oc://x.md/tools/gh           →  節點 @ L9 [md-item]
  oc://x.md/tools/curl         →  節點 @ L10 [md-item]
  oc://x.md/tools/send-email   →  節點 @ L11 [md-item]
```

`[frontmatter]` 述詞定位 YAML frontmatter 區塊；`tools`
透過 slug 比對 `## Tools` 標題，而項目葉節點會保留其 slug 形式，
即使來源使用底線（`send_email` 會變成 `send-email`）。

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
葉節點 @ L4：「true」（布林值）

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run：將寫入 142 位元組至 /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC 編輯會透過 `jsonc-parser` 進行，因此執行 `set` 後仍會保留註解與空白。
請先使用 `--dry-run` 檢查位元組，再正式寫入。
`.json` 檔案使用與 `.jsonc` 相同的配接器與編輯路徑。

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
oc://session.jsonl/[event=action]/userId 有 1 個相符項目：
  oc://session.jsonl/L2/userId  →  葉節點 @ L2：「u1」（字串）

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
葉節點 @ L2：「2」（數字）
```

每一行都是一筆記錄。不知道行號時，請使用述詞（`[event=action]`）定址；
知道行號時，則使用標準的 `LN` 分段。
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
葉節點 @ L3：「fetch」（字串）

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run：將寫入 99 位元組至 /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML 使用 `yaml` 套件的 `Document` API，而非自行實作的
解析器，因此一般的解析／輸出往返會保留註解與編寫格式，
而解析後的路徑則使用與 JSONC 相同的映射鍵／序列索引模型。
相同的配接器可處理 `.yaml`、`.yml` 與 `.lobster` 檔案。

## 子命令參考

### `resolve <oc-path>`

讀取單一葉節點或節點。不接受萬用字元——請改用 `find`。
找到相符項目時以 `0` 結束，正常未找到時以 `1` 結束，
發生解析錯誤或模式遭拒時則以 `2` 結束。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

列舉萬用字元／述詞／聯集模式的所有相符項目。至少找到一個項目時以 `0`
結束，未找到時以 `1` 結束。檔案位置不支援萬用字元，並會回報
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`——請傳入具體檔案（多檔案
glob 是後續功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

寫入葉節點。搭配 `--dry-run` 可預覽將寫入的位元組，而不會修改檔案。
加入 `--diff` 可預覽統一格式差異。成功寫入時以 `0` 結束；
底層資料層拒絕時（例如觸發哨兵防護）以 `1` 結束；發生解析錯誤時以 `2` 結束。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

若指定名稱的子節點尚不存在，`+key` 插入標記會建立該子節點；
`+nnn` 與單獨的 `+` 分別用於依索引插入與附加插入。

### `validate <oc-path>`

僅進行解析檢查。不存取檔案系統。適用於在代入變數前確認範本路徑
格式正確，或取得結構分解資訊以進行偵錯：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
有效：oc://AGENTS.md/tools/gh
  檔案：    AGENTS.md
  區段：    tools
  項目：    gh
```

有效時以 `0` 結束；無效時以 `1` 結束（並附帶結構化的 `code` 與
`message`）；發生引數錯誤時以 `2` 結束。

### `emit <file>`

使用各檔案種類的解析器與輸出器對檔案進行往返處理。對於格式正確的檔案，
輸出應與輸入逐位元組完全相同；若有差異，表示解析器存在錯誤或觸發了
哨兵防護。適合用來偵錯底層資料層處理實際輸入時的行為。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 結束代碼

| 代碼 | 意義                                                                        |
| ---- | --------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve`／`find`：至少一個相符項目。`set`：寫入成功。）            |
| `1`  | 無相符項目，或 `set` 遭底層資料層拒絕（不是系統層級錯誤）。                |
| `2`  | 引數或解析錯誤。                                                            |

## 輸出模式

`openclaw path` 會偵測終端介面：在終端機上輸出易讀格式，當標準輸出透過管線傳送或
重新導向時則輸出 JSON。`--json` 與 `--human` 可覆寫
自動偵測結果。

## 注意事項

- `set` 透過底層資料層的輸出路徑寫入位元組，該路徑會自動套用
  遮蔽哨兵防護。若葉節點包含 `__OPENCLAW_REDACTED__`
  （完全相同或作為子字串），寫入時將遭拒絕。
- JSONC 解析與葉節點編輯使用外掛本機的 `jsonc-parser`
  相依套件，因此一般葉節點寫入會保留註解與格式，
  而不會經過自行實作的解析器／重新呈現路徑。
- `path` 不會感知最後已知良好（LKG）設定追蹤或復原；
  該生命週期由其他元件負責。如果透過 `path` 編輯的檔案
  也受 LKG 追蹤，下一次讀取設定時會決定要採用或
  復原該檔案；請將 `path` 編輯視為對該檔案的任何其他直接寫入。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
