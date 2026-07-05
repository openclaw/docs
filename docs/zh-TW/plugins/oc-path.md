---
read_when:
    - 你想要從終端機檢查或編輯工作區檔案中的單一葉節點
    - 你正在針對工作區狀態編寫指令碼，並需要一套穩定且不依種類而異的定址方案
    - 你正在決定是否要在自行託管的閘道上啟用選用的 `oc-path` 外掛
summary: 隨附的 `oc-path` 外掛：提供用於 `oc://` 工作區檔案定址配置的 `openclaw path` 命令列介面
title: OC Path 外掛
x-i18n:
    generated_at: "2026-07-05T11:32:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

bundled `oc-path` 外掛新增了 [`openclaw path`](/zh-TW/cli/path) 命令列介面，用於
`oc://` 工作區檔案定址配置。它隨 OpenClaw repo 一起位於
`extensions/oc-path/` 下，但需要選擇啟用：安裝/建置後會保持停用，直到你
啟用它。

`oc://` 位址會指向工作區檔案內的單一葉節點（或一組萬用字元葉節點）。
此外掛理解四種檔案類型：

- **markdown** (`.md`)：frontmatter、章節、項目、欄位
- **jsonc** (`.jsonc`, `.json`)：保留註解與格式
- **jsonl** (`.jsonl`, `.ndjson`)：以行為單位的記錄
- **yaml** (`.yaml`, `.yml`, `.lobster`)：透過
  `yaml` 套件的 `Document` API 處理 map/sequence/scalar 節點

自行託管者和編輯器擴充功能會使用命令列介面讀取或寫入單一葉節點，
不必直接針對 SDK 撰寫腳本；代理程式和鉤子則把它當作確定性的基底，
讓位元組保真往返與修訂哨兵防護能在各類型間一致套用。完整語法、
逐動詞旗標清單，以及每種檔案類型的實作範例，請參閱
[命令列介面參考](/zh-TW/cli/path)；本頁說明為什麼以及如何啟用此外掛。

## 為什麼啟用它

當腳本、鉤子或本機代理程式工具需要指向工作區狀態中的精確片段，
且不想為每種檔案形狀撰寫專用解析器時，請啟用 `oc-path`。
單一 `oc://` 位址可以命名 markdown frontmatter 鍵、章節項目、
JSONC 設定葉節點、JSONL 事件欄位，或 YAML 工作流程步驟。

這對維護者工作流程很重要，因為變更應該保持小型、可稽核且可重複：
檢查一個值、尋找相符記錄、試跑寫入，然後只套用該葉節點，
同時保留註解、行尾與鄰近格式。

啟用它的常見原因：

- **本機自動化**：shell 腳本使用 `openclaw path … --json` 解析或更新單一工作區值，
  不必攜帶獨立的 markdown、JSONC、JSONL 和 YAML 解析程式碼。
- **代理程式可見的編輯**：代理程式在寫入前顯示單一定址葉節點的試跑差異，
  比自由形式的檔案重寫更容易審閱。
- **編輯器整合**：編輯器可將 `oc://AGENTS.md/tools/gh` 對應到精確的
  markdown 節點與行號，而不必從標題文字猜測。
- **診斷**：`emit` 會讓檔案經由解析器與 emitter 往返，
  因此你可以在依賴自動編輯前，檢查某種檔案類型是否位元組穩定。

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` 刻意不擁有較高階的語意。記憶外掛仍然負責記憶寫入、
設定命令仍然負責完整設定管理，而 last-known-good (LKG) 設定復原仍然負責
還原/提升。`oc-path` 是狹窄的定址與保留位元組檔案操作層，
供那些較高階工具圍繞建置。

## 執行位置

此外掛會在你叫用命令的主機上，**於 `openclaw` 命令列介面程序內**執行。
它不需要執行中的閘道，也不會開啟任何網路 socket；每個動詞都是你指定檔案上的純轉換。

外掛中繼資料位於 `extensions/oc-path/openclaw.plugin.json`：

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` 會讓此外掛離開閘道啟動路徑。
`commandAliases` 和 `activation.onCommands` 會告訴命令列介面在你第一次執行
`openclaw path …` 時延遲載入此外掛，因此從未使用此動詞的安裝不會付出成本。

## 啟用

```bash
openclaw plugins enable oc-path
```

重新啟動閘道（如果你有執行），讓 manifest 快照取得新的狀態。
裸 `openclaw path` 叫用可在同一主機立即運作；
命令列介面會按需載入此外掛。

停用方式：

```bash
openclaw plugins disable oc-path
```

## 相依性

所有解析器相依性都是外掛本機的；啟用 `oc-path` 不會把新套件拉入核心執行階段：

| 相依性         | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` 的子命令接線。             |
| `jsonc-parser` | JSONC 解析與葉節點編輯，保留註解與尾隨逗號。                           |
| `markdown-it`  | 用於章節 / 項目 / 欄位模型的 Markdown tokenization。                   |
| `yaml`         | YAML `Document` 解析 / emit / 編輯，保留註解與 flow style。             |

JSONL 維持手寫：以行為單位的解析比任何相依性都簡單，
而且逐行解析已經透過 `jsonc-parser` 進行。

## 提供內容

| 介面                           | 提供者                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` 命令列介面     | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 解析器 / 格式化器      | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 各類型解析 / emit / 編輯       | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 通用 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 修訂哨兵防護                   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

命令列介面是目前唯一的公開介面。基底動詞是此外掛的私有介面；
消費者會使用命令列介面（或針對 SDK 建置自己的外掛）。

## 與其他外掛的關係

- **`memory-*`**：記憶寫入會經由記憶外掛，而不是
  `oc-path`。`oc-path` 是泛用檔案基底；記憶外掛在其上疊加自己的語意。
- **LKG**：`path` 不知道 last-known-good 設定還原。如果你透過
  `path` 編輯的檔案也被 LKG 追蹤，下一個設定觀察週期會決定是否提升或復原它；
  請將 `path` 編輯視為對該檔案的任何其他直接寫入。

## 安全性

`set` 會透過基底的 emit 路徑寫入原始位元組，該路徑會自動套用
修訂哨兵防護。帶有 `__OPENCLAW_REDACTED__`（逐字或作為子字串）的葉節點
會在寫入時以 `OC_EMIT_SENTINEL` 拒絕。命令列介面也會從它列印的任何
人類或 JSON 輸出中清除該字面哨兵，並替換為 `[REDACTED]`，讓終端擷取與
管線永遠不會洩漏該標記。

## 相關

- [`openclaw path` 命令列介面參考](/zh-TW/cli/path)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [建置外掛](/zh-TW/plugins/building-plugins)
