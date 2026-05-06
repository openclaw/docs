---
read_when:
    - 你想要啟用或設定 code_execution
    - 您想要在沒有本機 shell 存取權的情況下進行遠端分析
    - 你想將 x_search 或 web_search 與遠端 Python 分析結合使用
summary: 'code_execution: 使用 xAI 執行沙箱化的遠端 Python 分析'
title: 程式碼執行
x-i18n:
    generated_at: "2026-05-06T02:58:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 會在 xAI 的 Responses API 上執行沙盒化的遠端 Python 分析。它由內建的 `xai` Plugin 註冊（位於 `tools` 合約之下），並派送到 `x_search` 所使用的同一個 `https://api.x.ai/v1/responses` 端點。

| 屬性               | 值                                                             |
| ------------------ | -------------------------------------------------------------- |
| 工具名稱           | `code_execution`                                               |
| Provider Plugin    | `xai`（內建，`enabledByDefault: true`）                        |
| 驗證               | `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey` |
| 預設模型           | `grok-4-1-fast`                                                |
| 預設逾時           | 30 秒                                                         |
| 預設 `maxTurns`    | 未設定（xAI 會套用自己的內部限制）                            |

這與本機 [`exec`](/zh-TW/tools/exec) 不同：

- `exec` 會在你的機器或配對節點上執行 shell 指令。
- `code_execution` 會在 xAI 的遠端沙盒中執行 Python。

將 `code_execution` 用於：

- 計算。
- 製表。
- 快速統計。
- 圖表式分析。
- 分析 `x_search` 或 `web_search` 傳回的資料。

當你需要本機檔案、你的 shell、你的 repo，或配對裝置時，請**不要**使用它。請改用 [`exec`](/zh-TW/tools/exec)。

## 設定

<Steps>
  <Step title="提供 xAI API 金鑰">
    在 Gateway 環境中設定 `XAI_API_KEY`，或在 xAI Plugin 下設定金鑰，讓同一組憑證涵蓋 `code_execution`、`x_search`、web search，以及其他 xAI 工具：

    ```bash
    export XAI_API_KEY=xai-...
    ```

    或透過 config：

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

  <Step title="啟用並調校 code_execution">
    此工具由 `plugins.entries.xai.config.codeExecution.enabled` 控制。預設為關閉。

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // 覆寫預設的 xAI code-execution 模型
                maxTurns: 2,            // 內部工具回合的選用上限
                timeoutSeconds: 30,     // 請求逾時（預設：30）
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

    一旦 xAI Plugin 以 `enabled: true` 重新註冊，`code_execution` 就會出現在 agent 的工具清單中。

  </Step>
</Steps>

## 使用方式

用自然語言提出要求，並明確說明分析意圖：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

此工具在內部接受單一 `task` 參數，因此 agent 應在一個 prompt 中送出完整的分析請求與任何行內資料。

## 錯誤

當工具在沒有驗證資訊的情況下執行時，會傳回結構化的 `missing_xai_api_key` 錯誤，並指向環境變數與 config 路徑。此錯誤是 JSON，不是拋出的例外，因此 agent 可以自行修正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 限制

- 這是遠端 xAI 執行，不是本機程序執行。
- 將結果視為暫時性分析，而不是持久化的 notebook 工作階段。
- 不要假設可以存取本機檔案或你的工作區。
- 若要取得新的 X 資料，請先使用 [`x_search`](/zh-TW/tools/web#x_search)，再將結果傳入 `code_execution`。

## 相關

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-TW/tools/exec" icon="terminal">
    在你的機器或配對節點上執行本機 shell。
  </Card>
  <Card title="Exec 核准" href="/zh-TW/tools/exec-approvals" icon="shield">
    shell 執行的允許/拒絕政策。
  </Card>
  <Card title="Web 工具" href="/zh-TW/tools/web" icon="globe">
    `web_search`、`x_search` 和 `web_fetch`。
  </Card>
  <Card title="xAI Provider" href="/zh-TW/providers/xai" icon="microchip">
    Grok 模型、web/x search，以及 code execution config。
  </Card>
</CardGroup>
