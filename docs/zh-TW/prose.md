---
read_when:
    - 你想要執行或撰寫 .prose 工作流程檔案
    - 您想啟用 OpenProse 外掛
    - 你需要了解 OpenProse 如何對應到 OpenClaw 基本構件
sidebarTitle: OpenProse
summary: OpenProse 是一種以 Markdown 優先的工作流程格式，適用於多代理 AI 工作階段。在 OpenClaw 中，它以外掛形式提供，包含 /prose 斜線命令與技能包。
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T19:51:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse 是一種可攜式、Markdown 優先的工作流程格式，用於編排 AI
工作階段。在 OpenClaw 中，它以外掛形式提供，會安裝 OpenProse skill
套件和 `/prose` 斜線命令。程式存放在 `.prose` 檔案中，並且可以透過明確的控制流程
產生多個子代理。

<CardGroup cols={3}>
  <Card title="安裝" icon="download" href="#install">
    啟用 OpenProse 外掛並重新啟動閘道。
  </Card>
  <Card title="執行程式" icon="play" href="#slash-command">
    使用 `/prose run` 執行 `.prose` 檔案或遠端程式。
  </Card>
  <Card title="撰寫程式" icon="pencil" href="#example">
    使用平行與循序步驟撰寫多代理工作流程。
  </Card>
</CardGroup>

## 安裝

<Steps>
  <Step title="啟用外掛">
    隨附外掛預設為停用。啟用 OpenProse：

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

    你應該會看到 `open-prose` 已啟用。`/prose` skill 命令現在
    可在聊天中使用。

  </Step>
</Steps>

若是本機 checkout：`openclaw plugins install ./path/to/local/open-prose-plugin`

## 斜線命令

OpenProse 會註冊 `/prose` 作為使用者可呼叫的 skill 命令：

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

最上層遠端執行是明確的。`.prose` 程式內的遠端匯入是
遞移程式碼依賴項：在 OpenProse 擷取任何遠端 `use` 目標之前，
它會顯示解析後的匯入清單，並要求操作者在該次執行中精確回覆
`approve remote prose imports`。

## 它可以做什麼

- 具備明確平行化的多代理研究與綜合整理。
- 可重複、核准安全的工作流程（程式碼審查、事件分診、內容管線）。
- 可重複使用的 `.prose` 程式，可在支援的代理執行環境中執行。

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

OpenProse 程式會對應到 OpenClaw primitives：

| OpenProse 概念          | OpenClaw 工具    |
| ------------------------- | ---------------- |
| 產生工作階段 / Task 工具 | `sessions_spawn` |
| 檔案讀取 / 寫入         | `read` / `write` |
| Web 擷取                 | `web_fetch`      |

<Warning>
  如果你的工具允許清單封鎖了 `sessions_spawn`、`read`、`write` 或
  `web_fetch`，OpenProse 程式將會失敗。請檢查你的
  [工具允許清單設定](/zh-TW/gateway/config-tools)。
</Warning>

## 檔案位置

OpenProse 會在工作區的 `.prose/` 底下保留狀態：

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

使用者層級的持久代理位於：

```text
~/.prose/agents/
```

## 狀態後端

<AccordionGroup>
  <Accordion title="檔案系統（預設）">
    狀態會寫入工作區中的 `.prose/runs/...`。不需要額外
    依賴項。
  </Accordion>
  <Accordion title="上下文內">
    暫時狀態會保留在上下文視窗中。適合小型、短期存在的
    程式。
  </Accordion>
  <Accordion title="sqlite（實驗性）">
    需要 `PATH` 上有 `sqlite3` 二進位檔。
  </Accordion>
  <Accordion title="postgres（實驗性）">
    需要 `psql` 和連線字串。

    <Warning>
      Postgres 憑證會流入子代理記錄。請使用專用且
      最小權限的資料庫。
    </Warning>

  </Accordion>
</AccordionGroup>

## 安全性

請將 `.prose` 檔案視為程式碼。在執行前審查它們，包括遠端
`use` 匯入。最上層 `/prose run https://...` 請求是明確的，但
遞移遠端匯入需要在每次執行時先核准，之後才會被擷取或
執行。使用 OpenClaw 工具允許清單與核准閘門來控制副作用。
若需要具決定性且由核准閘門控管的工作流程，請與
[Lobster](/zh-TW/tools/lobster) 比較。

## 相關

<CardGroup cols={2}>
  <Card title="Skills 參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    OpenProse 的 skill 套件如何載入，以及適用哪些閘門。
  </Card>
  <Card title="子代理" href="/zh-TW/tools/subagents" icon="users">
    OpenClaw 的原生多代理協調層。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="volume-high">
    將音訊輸出新增到你的工作流程。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    所有可用的聊天命令，包括 /prose。
  </Card>
</CardGroup>

官方網站：[https://www.prose.md](https://www.prose.md)
