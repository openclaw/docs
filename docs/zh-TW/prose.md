---
read_when:
    - 你想執行或撰寫 .prose 工作流程
    - 您想啟用 OpenProse Plugin
    - 你需要了解狀態儲存
summary: OpenProse：OpenClaw 中的 .prose 工作流程、斜線指令與狀態
title: OpenProse
x-i18n:
    generated_at: "2026-04-30T03:29:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 16
---

OpenProse 是一種可攜、以 Markdown 為優先的工作流程格式，用於協調 AI 工作階段。在 OpenClaw 中，它作為 Plugin 發布，會安裝 OpenProse Skills 套件和 `/prose` 斜線命令。程式位於 `.prose` 檔案中，並可透過明確的控制流程產生多個子代理。

官方網站：[https://www.prose.md](https://www.prose.md)

## 它能做什麼

- 透過明確平行處理進行多代理研究與綜合整理。
- 可重複、受核准保護的工作流程（程式碼審查、事件分診、內容管線）。
- 可在支援的代理執行環境中執行的可重用 `.prose` 程式。

## 安裝與啟用

內建 Plugin 預設為停用。啟用 OpenProse：

```bash
openclaw plugins enable open-prose
```

啟用 Plugin 後，請重新啟動 Gateway。

開發/本機 checkout：`openclaw plugins install ./path/to/local/open-prose-plugin`

相關文件：[Plugin](/zh-TW/tools/plugin)、[Plugin manifest](/zh-TW/plugins/manifest)、[Skills](/zh-TW/tools/skills)。

## 斜線命令

OpenProse 會註冊 `/prose` 作為使用者可呼叫的技能命令。它會路由到 OpenProse VM 指示，並在底層使用 OpenClaw 工具。

常用命令：

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 範例：簡單的 `.prose` 檔案

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

## 檔案位置

OpenProse 會將狀態保存在工作區的 `.prose/` 下：

```
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

```
~/.prose/agents/
```

## 狀態模式

OpenProse 支援多種狀態後端：

- **filesystem**（預設）：`.prose/runs/...`
- **in-context**：暫時性，適用於小型程式
- **sqlite**（實驗性）：需要 `sqlite3` 二進位檔
- **postgres**（實驗性）：需要 `psql` 和連線字串

注意事項：

- sqlite/postgres 為選用且屬於實驗性。
- postgres 憑證會流入子代理記錄；請使用專用且最低權限的資料庫。

## 遠端程式

`/prose run <handle/slug>` 會解析為 `https://p.prose.md/<handle>/<slug>`。
直接 URL 會照原樣擷取。這會使用 `web_fetch` 工具（或 POST 使用 `exec`）。

## OpenClaw 執行環境對應

OpenProse 程式會對應到 OpenClaw 基本元件：

| OpenProse 概念         | OpenClaw 工具    |
| ------------------------- | ---------------- |
| 產生工作階段 / Task 工具 | `sessions_spawn` |
| 檔案讀取/寫入           | `read` / `write` |
| Web 擷取                 | `web_fetch`      |

如果你的工具允許清單封鎖這些工具，OpenProse 程式將會失敗。請參閱 [Skills 設定](/zh-TW/tools/skills-config)。

## 安全性與核准

請將 `.prose` 檔案視為程式碼。執行前請先審查。使用 OpenClaw 工具允許清單和核准閘門來控制副作用。

若要使用確定性、受核准閘門保護的工作流程，請與 [Lobster](/zh-TW/tools/lobster) 比較。

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [Markdown 格式化](/zh-TW/concepts/markdown-formatting)
