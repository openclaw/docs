---
read_when:
    - 你想從終端機檢查或編輯工作區檔案中的單一葉節點
    - 你正在針對工作區狀態撰寫指令碼，並需要一套穩定且不受類型影響的定址方式
    - 您正在決定是否要在自行託管的閘道上啟用選用的 `oc-path` 外掛
summary: 內建的 `oc-path` 外掛：隨附用於 `oc://` 工作區檔案定址機制的 `openclaw path` 命令列介面
title: OC Path 外掛
x-i18n:
    generated_at: "2026-07-11T21:34:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

隨附的 `oc-path` 外掛為 `oc://` 工作區檔案定址機制新增了 [`openclaw path`](/zh-TW/cli/path) 命令列介面。它位於 OpenClaw 儲存庫的 `extensions/oc-path/` 下，但需選擇啟用：安裝或建置後仍會保持停用，直到你將其啟用。

`oc://` 位址指向工作區檔案中的單一葉節點（或一組符合萬用字元的葉節點）。此外掛支援四種檔案類型：

- **Markdown**（`.md`）：frontmatter、區段、項目、欄位
- **JSONC**（`.jsonc`、`.json`）：保留註解與格式
- **JSONL**（`.jsonl`、`.ndjson`）：以行為單位的記錄
- **YAML**（`.yaml`、`.yml`、`.lobster`）：透過 `yaml` 套件的 `Document` API 處理對映、序列與純量節點

自行託管者與編輯器擴充功能可使用此命令列介面讀取或寫入單一葉節點，而無須直接透過 SDK 編寫指令碼；代理程式與鉤子則將其視為確定性的基礎層，使位元組保真往返轉換與遮蔽哨兵防護能一致套用於所有檔案類型。完整語法、各操作指令的旗標清單，以及各檔案類型的實作範例，請參閱[命令列介面參考](/zh-TW/cli/path)；本頁說明啟用此外掛的原因與方法。

## 為何要啟用

當指令碼、鉤子或本機代理程式工具需要精確指向工作區狀態的特定部分，又不希望為每種檔案結構分別撰寫專用解析器時，請啟用 `oc-path`。單一 `oc://` 位址可指向 Markdown frontmatter 鍵、區段項目、JSONC 設定葉節點、JSONL 事件欄位或 YAML 工作流程步驟。

這對維護者工作流程很重要，因為變更應保持小幅、可稽核且可重複：檢查單一值、尋找相符記錄、試執行寫入，然後只套用至該葉節點，同時保持註解、行尾字元及鄰近格式不變。

常見的啟用原因：

- **本機自動化**：Shell 指令碼使用 `openclaw path … --json` 解析或更新單一工作區值，而無須各自攜帶 Markdown、JSONC、JSONL 與 YAML 解析程式碼。
- **代理程式可見的編輯**：代理程式在寫入前顯示單一指定葉節點的試執行差異，比自由形式的檔案重寫更容易審查。
- **編輯器整合**：編輯器可將 `oc://AGENTS.md/tools/gh` 對應至確切的 Markdown 節點與行號，而無須根據標題文字猜測。
- **診斷**：`emit` 會透過解析器與輸出器往返轉換檔案，因此你可先檢查某種檔案類型是否能保持位元組穩定，再依賴自動化編輯。

```bash
# 此設定是否已啟用 GitHub 外掛？
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# 此工作階段記錄中出現了哪些工具呼叫名稱？
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# 這項微小的設定編輯會寫入哪些位元組？
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` 刻意不負責高階語意。記憶體外掛仍負責記憶體寫入，設定指令仍負責完整的設定管理，而最後已知良好（LKG）設定復原仍負責還原與提升。`oc-path` 是範圍狹窄的定址與位元組保留檔案操作層，供這些高階工具在其周圍建構功能。

## 執行位置

此外掛會在你叫用指令的主機上，**於 `openclaw` 命令列介面處理程序內執行**。它不需要執行中的閘道，也不會開啟任何網路通訊端；每個操作指令都只會對你指定的檔案進行純轉換。

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

`onStartup: false` 可避免此外掛進入閘道啟動路徑。`commandAliases` 與 `activation.onCommands` 會指示命令列介面在你首次執行 `openclaw path …` 時延遲載入此外掛，因此從未使用此操作指令的安裝環境不會產生額外成本。

## 啟用

```bash
openclaw plugins enable oc-path
```

重新啟動閘道（如果你有執行），讓資訊清單快照取得新狀態。在同一主機上，直接執行 `openclaw path` 會立即生效；命令列介面會依需求載入此外掛。

停用方式：

```bash
openclaw plugins disable oc-path
```

## 相依套件

所有解析器相依套件都位於外掛內；啟用 `oc-path` 不會將新套件加入核心執行階段：

| 相依套件       | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | 連接 `resolve`、`find`、`set`、`validate`、`emit` 子指令。             |
| `jsonc-parser` | 解析及編輯 JSONC 葉節點，並保留註解與尾隨逗號。                       |
| `markdown-it`  | 將 Markdown 詞元化，以供區段／項目／欄位模型使用。                    |
| `yaml`         | 解析／輸出／編輯 YAML `Document`，並保留註解與流式樣式。              |

JSONL 維持手工實作：以行為單位的解析比使用任何相依套件都更簡單，而且每行的解析本來就會經過 `jsonc-parser`。

## 提供的功能

| 介面                           | 提供來源                                                |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` 命令列介面     | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 解析器／格式化器       | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 各類型的解析／輸出／編輯      | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 通用解析／尋找／設定           | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 遮蔽哨兵防護                   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

目前唯一的公開介面是命令列介面。基礎層操作指令為此外掛的私有功能；使用者應使用命令列介面（或透過 SDK 建置自己的外掛）。

## 與其他外掛的關係

- **`memory-*`**：記憶體寫入會經由記憶體外掛，而非 `oc-path`。`oc-path` 是通用檔案基礎層；記憶體外掛會在其上加入自己的語意。
- **LKG**：`path` 不會處理最後已知良好設定的還原。如果你透過 `path` 編輯的檔案也受 LKG 追蹤，下一個設定觀察週期會決定要提升還是復原該檔案；請將 `path` 編輯視為對該檔案的任何其他直接寫入。

## 安全性

`set` 會透過基礎層的輸出路徑寫入原始位元組，並自動套用遮蔽哨兵防護。若葉節點包含 `__OPENCLAW_REDACTED__`（完全相同或作為子字串），寫入時會以 `OC_EMIT_SENTINEL` 拒絕操作。命令列介面也會從其輸出的所有人類可讀或 JSON 內容中移除該哨兵字面值，並以 `[REDACTED]` 取代，確保終端擷取內容與管線永遠不會洩漏此標記。

## 相關內容

- [`openclaw path` 命令列介面參考](/zh-TW/cli/path)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [建置外掛](/zh-TW/plugins/building-plugins)
