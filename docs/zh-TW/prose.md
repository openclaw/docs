---
read_when:
    - 您想執行或撰寫 .prose 工作流程檔案
    - 您想要啟用 OpenProse 外掛
    - 你需要了解 OpenProse 如何對應到 OpenClaw 基本元件
sidebarTitle: OpenProse
summary: OpenProse 是一種 Markdown 優先的工作流程格式，適用於多代理 AI 工作階段。在 OpenClaw 中，它以外掛形式隨附，包含 `/prose` 斜線命令與技能包。
title: OpenProse
x-i18n:
    generated_at: "2026-07-05T11:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse 是一種可攜式、Markdown 優先的工作流程格式，用於編排 AI
工作階段。在 OpenClaw 中，它以外掛形式提供，會安裝 OpenProse Skills
套件與 `/prose` 斜線命令。程式存放在 `.prose` 檔案中，並可透過明確的控制流程
產生多個子代理。

<CardGroup cols={3}>
  <Card title="安裝" icon="download" href="#install">
    啟用 OpenProse 外掛並重新啟動閘道。
  </Card>
  <Card title="執行程式" icon="play" href="#slash-command">
    使用 `/prose run` 執行 `.prose` 檔案或遠端程式。
  </Card>
  <Card title="撰寫程式" icon="pencil" href="#example-parallel-research-and-synthesis">
    使用平行與循序步驟編寫多代理工作流程。
  </Card>
</CardGroup>

## 安裝

<Steps>
  <Step title="啟用外掛">
    OpenProse 已隨附提供，但預設為停用。啟用它：

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

    你應該會看到 `open-prose` 已啟用。`/prose` Skills 命令現在可在
    聊天中使用。

  </Step>
</Steps>

從 repo checkout 可直接安裝此外掛：
`openclaw plugins install ./extensions/open-prose`

## 斜線命令

OpenProse 會將 `/prose` 註冊為使用者可呼叫的 Skills 命令：

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
直接 URL 會使用 `web_fetch` 工具原樣擷取。

頂層遠端執行是明確的。`.prose` 程式內的遠端匯入是
遞移程式碼相依項：在 OpenProse 擷取任何遠端 `use` 目標之前，
它會顯示已解析的匯入清單，並要求操作者針對該次執行精確回覆
`approve remote prose imports`。

## 它可以做什麼

- 透過明確的平行處理進行多代理研究與綜合整理。
- 可重複、核准安全的工作流程（程式碼審查、事件分流、內容管線）。
- 可在支援的代理執行環境中執行的可重複使用 `.prose` 程式。

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

## OpenClaw 執行環境對應

OpenProse 程式會對應到 OpenClaw 原語：

| OpenProse 概念          | OpenClaw 工具                                   |
| ------------------------- | ----------------------------------------------- |
| 產生工作階段 / Task 工具 | `sessions_spawn`                                |
| 檔案讀取 / 寫入         | `read` / `write`                                |
| Web 擷取                 | `web_fetch`（需要 POST 時使用 `exec` + curl） |

<Warning>
  如果你的工具允許清單封鎖 `sessions_spawn`、`read`、`write` 或
  `web_fetch`，OpenProse 程式將會失敗。請檢查你的
  [工具允許清單設定](/zh-TW/gateway/config-tools)。
</Warning>

## 檔案位置

OpenProse 會將狀態保存在工作區的 `.prose/` 底下：

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

使用者層級的持久代理（跨專案共用）位於：

```text
~/.prose/agents/
```

## 狀態後端

<AccordionGroup>
  <Accordion title="filesystem（預設）">
    狀態會寫入工作區中的 `.prose/runs/...`。不需要額外
    相依項。
  </Accordion>
  <Accordion title="in-context">
    暫時狀態會保留在 context window 中；使用 `--in-context` 選取。
    適合小型、短期存活的程式。
  </Accordion>
  <Accordion title="sqlite（實驗性）">
    使用 `--state=sqlite` 選取。需要 `PATH` 上有 `sqlite3` 二進位檔
    （缺少時會退回 filesystem）；狀態會落在
    `.prose/runs/{id}/state.db`。
  </Accordion>
  <Accordion title="postgres（實驗性）">
    使用 `--state=postgres` 選取。需要 `psql`，並在
    `OPENPROSE_POSTGRES_URL` 中提供連線字串（在 `.prose/.env` 中設定）。

    <Warning>
      Postgres 認證資料會流入子代理日誌。請使用專用且
      最小權限的資料庫。
    </Warning>

  </Accordion>
</AccordionGroup>

## 安全性

請將 `.prose` 檔案視同程式碼。執行前請先審查，包括遠端
`use` 匯入。頂層 `/prose run https://...` 請求是明確的，但
遞移遠端匯入在擷取或執行前，需要針對每次執行取得核准。
使用 OpenClaw 工具允許清單與核准閘門來控制副作用。若要使用
決定性、受核准閘門控管的工作流程，請與
[Lobster](/zh-TW/tools/lobster) 比較。

## 相關

<CardGroup cols={2}>
  <Card title="Skills 參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    OpenProse 的 Skills 套件如何載入，以及適用哪些閘門。
  </Card>
  <Card title="子代理" href="/zh-TW/tools/subagents" icon="users">
    OpenClaw 原生的多代理協調層。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="volume-high">
    將音訊輸出加入你的工作流程。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    所有可用的聊天命令，包括 /prose。
  </Card>
</CardGroup>

官方網站：[https://www.prose.md](https://www.prose.md)
