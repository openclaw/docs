---
read_when:
    - 您想要啟用或設定 code_execution
    - 你想在沒有本機 shell 存取權的情況下進行遠端分析
    - 你想將 x_search 或 web_search 與遠端 Python 分析結合使用
summary: 'code_execution: 使用 xAI 執行沙盒化的遠端 Python 分析'
title: 程式碼執行
x-i18n:
    generated_at: "2026-05-10T19:52:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 會在 xAI 的 Responses API 上執行沙盒化的遠端 Python 分析。它由內建的 `xai` Plugin 註冊（位於 `tools` 合約下），並分派到 `x_search` 所使用的同一個 `https://api.x.ai/v1/responses` 端點。

| 屬性               | 值                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 工具名稱           | `code_execution`                                                                  |
| 供應商 Plugin      | `xai`（內建，`enabledByDefault: true`）                                           |
| 驗證               | xAI 驗證設定檔、`XAI_API_KEY`，或 `plugins.entries.xai.config.webSearch.apiKey`   |
| 預設模型           | `grok-4-1-fast`                                                                   |
| 預設逾時           | 30 秒                                                                             |
| 預設 `maxTurns`    | 未設定（xAI 會套用自己的內部限制）                                                |

這與本機 [`exec`](/zh-TW/tools/exec) 不同：

- `exec` 會在你的機器或配對的節點上執行 shell 指令。
- `code_execution` 會在 xAI 的遠端沙盒中執行 Python。

使用 `code_execution` 進行：

- 計算。
- 製表。
- 快速統計。
- 圖表式分析。
- 分析由 `x_search` 或 `web_search` 傳回的資料。

當你需要本機檔案、shell、你的 repo，或配對裝置時，**不要**使用它。請改用 [`exec`](/zh-TW/tools/exec)。

## 設定

<Steps>
  <Step title="提供 xAI API 金鑰">
    針對 `code_execution` 和
    `x_search` 執行 `openclaw onboard --auth-choice xai-api-key`，或設定 `XAI_API_KEY`／在 xAI Plugin
    下設定金鑰，讓 Grok 網頁搜尋也使用同一組憑證：

    ```bash
    export XAI_API_KEY=xai-...
    ```

    或透過設定：

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="啟用並調整 code_execution">
    此工具受 `plugins.entries.xai.config.codeExecution.enabled` 控制。預設為關閉。

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="重新啟動 Gateway">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin 以 `enabled: true` 重新註冊後，`code_execution` 會出現在代理的工具清單中。

  </Step>
</Steps>

## 使用方式

自然提問，並明確說明分析意圖：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

此工具在內部接受單一 `task` 參數，因此代理應在同一個提示中送出完整分析請求和任何內嵌資料。

## 錯誤

工具在沒有驗證資訊的情況下執行時，會傳回結構化的 `missing_xai_api_key` 錯誤，指向驗證設定檔、環境變數和設定選項。此錯誤是 JSON，而不是拋出的例外，因此代理可以自行修正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 限制

- 這是遠端 xAI 執行，不是本機程序執行。
- 將結果視為暫時性分析，而不是持久化的 notebook 工作階段。
- 不要假設它能存取本機檔案或你的工作區。
- 如需最新的 X 資料，請先使用 [`x_search`](/zh-TW/tools/web#x_search)，再將結果傳入 `code_execution`。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    在你的機器或配對節點上執行本機 shell。
  </Card>
  <Card title="Exec 核准" href="/zh-TW/tools/exec-approvals" icon="shield">
    shell 執行的允許／拒絕政策。
  </Card>
  <Card title="網頁工具" href="/zh-TW/tools/web" icon="globe">
    `web_search`、`x_search` 和 `web_fetch`。
  </Card>
  <Card title="xAI 供應商" href="/zh-TW/providers/xai" icon="microchip">
    Grok 模型、web/x 搜尋，以及程式碼執行設定。
  </Card>
</CardGroup>
