---
read_when:
    - 您想要啟用或設定 code_execution
    - 你想要在沒有本機 shell 存取權限的情況下進行遠端分析
    - 你想將 x_search 或 web_search 與遠端 Python 分析結合使用
summary: code_execution -- 使用 xAI 執行沙盒化的遠端 Python 分析
title: 程式碼執行
x-i18n:
    generated_at: "2026-04-30T03:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 會在 xAI 的 Responses API 上執行沙盒化的遠端 Python 分析。
這與本機 [`exec`](/zh-TW/tools/exec) 不同：

- `exec` 會在你的機器或節點上執行 shell 命令
- `code_execution` 會在 xAI 的遠端沙盒中執行 Python

使用 `code_execution` 來進行：

- 計算
- 製表
- 快速統計
- 圖表式分析
- 分析由 `x_search` 或 `web_search` 傳回的資料

當你需要本機檔案、你的 shell、你的儲存庫或配對裝置時，**不要**使用它。請改用 [`exec`](/zh-TW/tools/exec)。

## 設定

你需要 xAI API 金鑰。以下任一種都可以：

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

範例：

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## 如何使用

自然地提出要求，並明確說明分析意圖：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

此工具在內部接受單一 `task` 參數，因此 agent 應在一個提示中送出完整的分析要求與任何內嵌資料。

## 限制

- 這是遠端 xAI 執行，不是本機程序執行。
- 它應被視為臨時分析，而不是持久化筆記本。
- 不要假設可存取本機檔案或你的工作區。
- 若要取得最新 X 資料，請先使用 [`x_search`](/zh-TW/tools/web#x_search)。

## 相關

- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)
- [apply_patch 工具](/zh-TW/tools/apply-patch)
- [Web 工具](/zh-TW/tools/web)
- [xAI](/zh-TW/providers/xai)
