---
read_when:
    - 你想要執行或撰寫 .prose 工作流程檔案
    - 您想要啟用 OpenProse 外掛
    - 你需要瞭解 OpenProse 如何對應至 OpenClaw 的基本元素
sidebarTitle: OpenProse
summary: OpenProse 是一種以 Markdown 為優先、用於多代理 AI 工作階段的工作流程格式。在 OpenClaw 中，它以外掛形式提供，並包含 `/prose` 斜線命令與 Skills 套件。
title: OpenProse
x-i18n:
    generated_at: "2026-07-11T21:43:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse 是一種可攜、以 Markdown 為優先的工作流程格式，用於協調 AI
工作階段。在 OpenClaw 中，它以外掛形式提供，會安裝 OpenProse skill
套件與 `/prose` 斜線命令。程式存放在 `.prose` 檔案中，並能以明確的控制流程
啟動多個子代理程式。

<CardGroup cols={3}>
  <Card title="安裝" icon="download" href="#install">
    啟用 OpenProse 外掛並重新啟動閘道。
  </Card>
  <Card title="執行程式" icon="play" href="#slash-command">
    使用 `/prose run` 執行 `.prose` 檔案或遠端程式。
  </Card>
  <Card title="撰寫程式" icon="pencil" href="#example-parallel-research-and-synthesis">
    使用平行與循序步驟編寫多代理程式工作流程。
  </Card>
</CardGroup>

## 安裝

<Steps>
  <Step title="啟用外掛">
    OpenProse 已隨附但預設停用。請啟用它：

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="重新啟動閘道">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="驗證">
    ```bash
    openclaw plugins list | grep prose
    ```

    你應該會看到 `open-prose` 已啟用。現在可以在聊天中使用
    `/prose` skill 命令。

  </Step>
</Steps>

從儲存庫簽出版本中，你可以直接安裝外掛：
`openclaw plugins install ./extensions/open-prose`

## 斜線命令

OpenProse 將 `/prose` 註冊為使用者可呼叫的 skill 命令：

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` 會解析為 `https://p.prose.md/<handle>/<slug>`。
直接 URL 會使用 `web_fetch` 工具依原樣擷取。

頂層遠端執行是明確操作。`.prose` 程式內的遠端匯入屬於
遞移程式碼相依性：在 OpenProse 擷取任何遠端 `use` 目標之前，
它會顯示解析後的匯入清單，並要求操作員為該次執行精確回覆
`approve remote prose imports`。

## 功能

- 透過明確的平行處理進行多代理程式研究與綜合整理。
- 可重複執行、具安全核准機制的工作流程（程式碼審查、事件分流、內容管線）。
- 可跨支援的代理程式執行階段使用的可重用 `.prose` 程式。

## 範例：平行研究與綜合整理

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## OpenClaw 執行階段對應

OpenProse 程式會對應至 OpenClaw 基礎元件：

| OpenProse 概念          | OpenClaw 工具                                    |
| ----------------------- | ----------------------------------------------- |
| 啟動工作階段／任務工具  | `sessions_spawn`                                |
| 檔案讀取／寫入          | `read` / `write`                                |
| 網頁擷取                | `web_fetch`（需要 POST 時使用 `exec` + curl）   |

<Warning>
  如果你的工具允許清單封鎖 `sessions_spawn`、`read`、`write` 或
  `web_fetch`，OpenProse 程式將會失敗。請檢查你的
  [工具允許清單設定](/zh-TW/gateway/config-tools)。
</Warning>

## 檔案位置

OpenProse 會將狀態保存在工作區的 `.prose/` 下：

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

跨專案共用的使用者層級持久代理程式位於：

```text
~/.prose/agents/
```

## 狀態後端

<AccordionGroup>
  <Accordion title="檔案系統（預設）">
    狀態會寫入工作區中的 `.prose/runs/...`。不需要額外的
    相依項目。
  </Accordion>
  <Accordion title="內容內">
    暫時狀態會保存在內容視窗中；使用 `--in-context` 選取。
    適合小型、短期執行的程式。
  </Accordion>
  <Accordion title="sqlite（實驗性）">
    使用 `--state=sqlite` 選取。需要 `PATH` 中存在 `sqlite3` 二進位檔
    （缺少時會退回檔案系統）；狀態會儲存在
    `.prose/runs/{id}/state.db`。
  </Accordion>
  <Accordion title="postgres（實驗性）">
    使用 `--state=postgres` 選取。需要 `psql`，以及
    `OPENPROSE_POSTGRES_URL` 中的連線字串（請在 `.prose/.env` 中設定）。

    <Warning>
      Postgres 憑證會流入子代理程式記錄。請使用專用且
      僅具最低必要權限的資料庫。
    </Warning>

  </Accordion>
</AccordionGroup>

## 安全性

請將 `.prose` 檔案視為程式碼。執行前請先審查，包括遠端
`use` 匯入。頂層 `/prose run https://...` 請求屬於明確操作，但
遞移遠端匯入在擷取或執行前，需要針對每次執行取得核准。
請使用 OpenClaw 工具允許清單與核准閘門控制副作用。
若需要具確定性且受核准閘門控管的工作流程，請比較
[Lobster](/zh-TW/tools/lobster)。

## 相關內容

<CardGroup cols={2}>
  <Card title="Skills 參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    OpenProse 的 skill 套件如何載入，以及適用哪些閘門。
  </Card>
  <Card title="子代理程式" href="/zh-TW/tools/subagents" icon="users">
    OpenClaw 原生的多代理程式協調層。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="volume-high">
    為你的工作流程加入音訊輸出。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    所有可用的聊天命令，包括 /prose。
  </Card>
</CardGroup>

官方網站：[https://www.prose.md](https://www.prose.md)
