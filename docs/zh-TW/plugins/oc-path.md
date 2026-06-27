---
read_when:
    - 你想從終端機檢查或編輯工作區檔案中的單一葉節點
    - 你正在針對工作區狀態撰寫指令碼，並且需要一套穩定、與類型無關的定址方案
    - 你正在決定是否要在自託管閘道上啟用選用的 `oc-path` 外掛
summary: 內建 `oc-path` 外掛：隨附提供用於 `oc://` workspace-file 定址方案的 `openclaw path` 命令列介面
title: OC Path 外掛
x-i18n:
    generated_at: "2026-06-27T19:39:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

bundled 的 `oc-path` 外掛會新增 [`openclaw path`](/zh-TW/cli/path) 命令列介面，用於
`oc://` 工作區檔案定址方案。它隨 OpenClaw repo 一起位於
`extensions/oc-path/` 下，但採用選擇性啟用：安裝/建置後會保持休眠，直到你
啟用它。

`oc://` 位址會指向工作區檔案內的單一葉節點（或一組萬用字元葉節點）。
此外掛目前理解四種檔案：

- **markdown** (`.md`, `.mdx`)：frontmatter、章節、項目、欄位
- **jsonc** (`.jsonc`, `.json5`, `.json`)：保留註解與格式
- **jsonl** (`.jsonl`, `.ndjson`)：以行為單位的記錄
- **yaml** (`.yaml`, `.yml`, `.lobster`)：透過 YAML 文件 API 處理
  map/sequence/scalar 節點

自架者與編輯器擴充功能會使用命令列介面來讀取或寫入單一葉節點，
而不必直接針對 SDK 撰寫腳本；代理與 hook 則把它視為
決定性的基底，讓位元組保真往返與遮蔽 sentinel 防護能在各種類型中一致套用。

## 為什麼啟用它

當你希望腳本、hook 或本機代理工具能指向工作區狀態中的精確片段，
而不必為每種檔案形狀發明解析器時，請啟用 `oc-path`。單一 `oc://` 位址可以命名
markdown frontmatter 鍵、章節項目、JSONC 設定葉節點、JSONL 事件欄位，
或 YAML workflow 步驟。

這對維護者工作流程很重要，因為變更應該要小、可稽核且可重複：
檢查一個值、尋找符合的記錄、dry-run 一次寫入，然後只套用該葉節點，
同時保留註解、行尾與鄰近格式。將它維持為選擇性啟用外掛，可讓進階使用者取得
定址基底，而不會把解析器相依性或命令列介面表面放進不需要它的核心安裝中。

常見啟用原因：

- **本機自動化**：shell 腳本可以用 `openclaw path … --json` 解析或更新單一工作區值，
  而不必攜帶個別的 markdown、JSONC、JSONL 與 YAML 解析程式碼。
- **代理可見的編輯**：代理可以在寫入前顯示單一定址葉節點的 dry-run diff，
  這比自由形式重寫檔案更容易審查。
- **編輯器整合**：編輯器可以將 `oc://AGENTS.md/tools/gh` 對應到
  精確的 markdown 節點與行號，而不必從標題文字猜測。
- **診斷**：`emit` 會讓檔案經過解析器與 emitter 往返，因此
  你可以在依賴自動化編輯前檢查某種檔案類型是否位元組穩定。

具體範例：

```bash
# 此設定中 GitHub 外掛是否已啟用？
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# 此 session log 中出現了哪些 tool-call 名稱？
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# 這個微小設定編輯會寫入哪些位元組？
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

此外掛刻意不是高階語意的擁有者。記憶外掛仍擁有記憶寫入，
設定命令仍擁有完整設定管理，而 LKG 邏輯仍擁有還原/提升。
`oc-path` 是狹窄的定址與保留位元組檔案操作層，這些高階工具可以圍繞它建置。

## 執行位置

此外掛會在你呼叫命令的主機上，**於 `openclaw` 命令列介面內的同一程序中**執行。
它不需要正在執行的閘道，也不會開啟任何網路 socket：每個動詞都是你指定檔案上的純轉換。

外掛 metadata 位於 `extensions/oc-path/openclaw.plugin.json`：

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

`onStartup: false` 會讓此外掛不進入閘道 hot path。`onCommands:
["path"]` 會告訴命令列介面在你第一次執行
`openclaw path …` 時才延遲載入此外掛，因此從未使用該動詞的安裝不會付出成本。

## 啟用

```bash
openclaw plugins enable oc-path
```

重新啟動閘道（如果你有執行）讓 manifest snapshot 取得新狀態。
裸 `openclaw path` 呼叫會在同一主機上立即可用：
命令列介面會依需求載入此外掛。

停用方式：

```bash
openclaw plugins disable oc-path
```

## 相依性

所有解析器相依性都是外掛本機的：啟用 `oc-path` 不會把
新套件拉進核心 runtime：

| 相依性         | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` 的子命令接線。            |
| `jsonc-parser` | JSONC 解析 + 葉節點編輯，並保留註解與尾隨逗號。                       |
| `markdown-it`  | 章節 / 項目 / 欄位模型的 Markdown tokenization。                      |
| `yaml`         | YAML `Document` 解析 / emit / 編輯，並保留註解與 flow style。          |

JSONL 維持手寫：以行為單位的解析比任何相依性都簡單，而逐行 JSONC 解析已經透過 `jsonc-parser`。

## 提供內容

| 表面                           | 提供者                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` 命令列介面     | `extensions/oc-path/cli-registration.ts`                |
| `oc://` parser / formatter     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 各類型 parse / emit / edit     | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 通用 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 遮蔽 sentinel 防護             | `extensions/oc-path/src/oc-path/sentinel.ts`            |

命令列介面是目前唯一的公開表面。基底動詞屬於外掛私有；
消費者會使用命令列介面（或針對 SDK 建置自己的外掛）。

## 與其他外掛的關係

- **`memory-*`**：記憶寫入會經過記憶外掛，而不是 `oc-path`。
  `oc-path` 是通用檔案基底；記憶外掛會在其上加上自己的語意。
- **LKG**：`path` 不知道 Last-Known-Good 設定還原。如果某檔案由 LKG 追蹤，
  下一次 `observe` 呼叫會決定是否提升或復原；透過 LKG 提升/復原生命週期進行原子 multi-set 的
  `set --batch`，已規劃與 LKG-recovery 基底一同推出。

## 安全性

`set` 會透過基底的 emit 路徑寫入原始位元組，該路徑會自動套用
遮蔽 sentinel 防護。攜帶 `__OPENCLAW_REDACTED__`（逐字或作為子字串）的葉節點
會在寫入時以 `OC_EMIT_SENTINEL` 被拒絕。命令列介面也會從它列印的任何
human 或 JSON 輸出中清除字面 sentinel，並以 `[REDACTED]` 取代，因此終端擷取與管線永遠不會洩漏該標記。

## 相關

- [`openclaw path` 命令列介面參考](/zh-TW/cli/path)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [建置外掛](/zh-TW/plugins/building-plugins)
