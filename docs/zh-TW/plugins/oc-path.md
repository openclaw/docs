---
read_when:
    - 你想從終端機檢查或編輯工作區檔案中的單一葉節點
    - 你正在針對工作區狀態編寫腳本，並且需要一套穩定、與種類無關的定址方案
    - 您正在決定是否要在自行託管的 Gateway 上啟用選用的 `oc-path` Plugin
summary: 隨附的 `oc-path` Plugin：提供 `openclaw path` CLI，用於 `oc://` 工作區檔案定址方案
title: OC 路徑 Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

內建的 `oc-path` Plugin 會為 `oc://` 工作區檔案定址方案加入 [`openclaw path`](/zh-TW/cli/path) CLI。它隨 OpenClaw repo 一起提供，位於 `extensions/oc-path/`，但採選擇啟用；安裝/建置後會保持休眠，直到你啟用它。

`oc://` 位址會指向工作區檔案中的單一葉節點（或一組萬用字元葉節點）。此 Plugin 目前理解三種檔案：

- **markdown**（`.md`、`.mdx`）：frontmatter、區段、項目、欄位
- **jsonc**（`.jsonc`、`.json5`、`.json`）：保留註解與格式
- **jsonl**（`.jsonl`、`.ndjson`）：以行為導向的記錄

自架主機者與編輯器擴充功能會使用 CLI 讀寫單一葉節點，而不必直接針對 SDK 撰寫腳本；agents 與 hooks 會把它視為確定性的基底，讓位元組保真的來回轉換與遮罩哨兵防護能一致套用到各種類型。

## 為什麼要啟用它

當你希望腳本、hooks 或本機 agent 工具能指向工作區狀態中的精確片段，而不必為每種檔案形狀發明 parser 時，請啟用 `oc-path`。單一 `oc://` 位址可以命名 markdown frontmatter key、區段項目、JSONC config 葉節點，或 JSONL event 欄位。

這對維護者工作流程很重要，因為變更應該小、可稽核且可重複：檢查一個值、尋找相符記錄、dry-run 一次寫入，然後只套用該葉節點，同時保留註解、換行符號與鄰近格式。把它維持為選擇啟用的 Plugin，能讓進階使用者取得定址基底，而不必把 parser 依賴或 CLI surface 放進不需要它的核心安裝。

常見的啟用理由：

- **本機自動化**：shell scripts 可以用 `openclaw path … --json` 解析或更新一個工作區值，而不用攜帶個別的 markdown、JSONC 與 JSONL parsing code。
- **agent 可見的編輯**：agent 可以在寫入前顯示單一已定址葉節點的 dry-run diff，這比自由形式的檔案重寫更容易審查。
- **編輯器整合**：編輯器可以將 `oc://AGENTS.md/tools/gh` 對應到精確的 markdown node 與行號，而不必根據標題文字猜測。
- **診斷**：`emit` 會讓檔案通過 parser 與 emitter 來回轉換，因此你可以在依賴自動化編輯前，檢查某種檔案類型是否具備位元組穩定性。

具體範例：

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

此 Plugin 刻意不負責更高階的語意。memory Plugins 仍然負責 memory writes，config commands 仍然負責完整的 config 管理，LKG 邏輯也仍然負責 restore/promotion。`oc-path` 是狹義的定址與位元組保留檔案操作層，讓那些更高階工具可以圍繞它建構。

## 它在哪裡執行

此 Plugin 會在你呼叫命令的主機上，**於 `openclaw` CLI 程序內**執行。它不需要執行中的 Gateway，也不會開啟任何網路 sockets；每個 verb 都只是對你指定檔案的純轉換。

Plugin metadata 位於 `extensions/oc-path/openclaw.plugin.json`：

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

`onStartup: false` 會讓此 Plugin 離開 Gateway hot path。`onCommands:
["path"]` 會告訴 CLI 在你第一次執行 `openclaw path …` 時才延遲載入此 Plugin，因此從未使用該 verb 的安裝不會付出任何成本。

## 啟用

```bash
openclaw plugins enable oc-path
```

重新啟動 Gateway（如果你有執行），讓 manifest snapshot 取得新的狀態。裸 `openclaw path` 呼叫會立即在同一台主機上運作；CLI 會依需求載入此 Plugin。

停用方式：

```bash
openclaw plugins disable oc-path
```

## 依賴

所有 parser 依賴都是 Plugin-local；啟用 `oc-path` 不會把新 packages 拉進核心 runtime：

| 依賴項         | 用途                                                                |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` 的 subcommand wiring。 |
| `jsonc-parser` | JSONC parse + 葉節點編輯，保留註解與 trailing commas。              |
| `markdown-it`  | 用於區段/項目/欄位模型的 Markdown tokenization。                    |

JSONL 維持手寫；以行為導向的 parsing 比任何依賴都簡單，而且每行 JSONC parse 已經會經過 `jsonc-parser`。

## 它提供什麼

| Surface                        | 提供者                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` parser / formatter     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 各類型 parse / emit / edit     | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| 通用 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 遮罩哨兵防護                   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI 是目前唯一的公開 surface。基底 verbs 對此 Plugin 是私有的；consumers 使用 CLI（或針對 SDK 建構自己的 Plugin）。

## 與其他 Plugins 的關係

- **`memory-*`**：memory writes 會通過 memory Plugins，而不是 `oc-path`。`oc-path` 是通用檔案基底；memory Plugins 會在其上疊加自己的語意。
- **LKG**：`path` 不知道 Last-Known-Good config restore。如果檔案由 LKG 追蹤，下一次 `observe` call 會決定是否 promote 或 recover；透過 LKG promote/recover 生命週期執行 atomic multi-set 的 `set --batch`，規劃會與 LKG-recovery 基底一起提供。

## 安全性

`set` 會透過基底的 emit path 寫入原始位元組，該路徑會自動套用遮罩哨兵防護。帶有 `__OPENCLAW_REDACTED__`（逐字或作為 substring）的葉節點會在寫入時被拒絕，錯誤為 `OC_EMIT_SENTINEL`。CLI 也會從它列印的任何 human 或 JSON output 中清除 literal sentinel，將其替換為 `[REDACTED]`，因此 terminal captures 與 pipelines 永遠不會洩漏該 marker。

## 相關

- [`openclaw path` CLI reference](/zh-TW/cli/path)
- [管理 Plugins](/zh-TW/plugins/manage-plugins)
- [建構 Plugins](/zh-TW/plugins/building-plugins)
