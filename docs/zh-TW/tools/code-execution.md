---
read_when:
    - 你想啟用或設定 `code_execution`
    - 你想要在沒有本機 shell 存取權限的情況下進行遠端分析
    - 你想要將 x_search 或 web_search 與遠端 Python 分析結合起來
summary: 'code_execution: 以 xAI 執行沙盒化的遠端 Python 分析'
title: 程式碼執行
x-i18n:
    generated_at: "2026-06-27T20:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 會在 xAI 的 Responses API 上執行沙盒化遠端 Python 分析。它由內建的 `xai` 外掛註冊（位於 `tools` contract 下），並分派到 `x_search` 使用的同一個 `https://api.x.ai/v1/responses` 端點。

| 屬性               | 值                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 工具名稱           | `code_execution`                                                                  |
| 供應商外掛         | `xai`（內建，`enabledByDefault: true`）                                           |
| 驗證               | xAI 驗證設定檔、`XAI_API_KEY`，或 `plugins.entries.xai.config.webSearch.apiKey`   |
| 預設模型           | `grok-4-1-fast`                                                                   |
| 預設逾時           | 30 秒                                                                             |
| 預設 `maxTurns`    | 未設定（xAI 會套用自己的內部限制）                                                |

這與本機 [`exec`](/zh-TW/tools/exec) 不同：

- `exec` 會在你的機器或配對節點上執行 shell 命令。
- `code_execution` 會在 xAI 的遠端沙盒中執行 Python。

將 `code_execution` 用於：

- 計算。
- 製表。
- 快速統計。
- 圖表式分析。
- 分析 `x_search` 或 `web_search` 傳回的資料。

當你需要本機檔案、你的 shell、你的 repo，或配對裝置時，請**不要**使用它。這類用途請使用 [`exec`](/zh-TW/tools/exec)。

## 設定

<Steps>
  <Step title="提供 xAI 憑證">
    使用符合資格的 SuperGrok 或 X Premium 訂閱透過 Grok OAuth 登入，
    或儲存 API 金鑰。xAI OAuth 使用裝置碼驗證，因此可以在沒有 localhost
    回呼的遠端主機上運作。OAuth 可用於 `code_execution` 和 `x_search`；
    `XAI_API_KEY` 或外掛網頁搜尋設定也可以支援 Grok `web_search`。

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    在全新安裝期間，也可以在 onboarding 內使用相同的驗證選項：

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    或使用 API 金鑰：

    ```bash
    openclaw models auth login --provider xai --method api-key
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
    當 xAI 憑證可用時，`code_execution` 就可用。將
    `plugins.entries.xai.config.codeExecution.enabled` 設為 `false` 可停用它，
    或使用同一個區塊調整模型和逾時。

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

  <Step title="重新啟動閘道">
    ```bash
    openclaw gateway restart
    ```

    一旦 xAI 外掛以 `enabled: true` 重新註冊，`code_execution` 就會出現在代理的工具清單中。

  </Step>
</Steps>

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

此工具在內部採用單一 `task` 參數，因此代理應在同一個提示中送出完整分析請求和任何內嵌資料。

## 錯誤

當工具在沒有驗證的情況下執行時，會傳回結構化的 `missing_xai_api_key` 錯誤，指向驗證設定檔、環境變數和設定選項。此錯誤是 JSON，而不是拋出的例外，因此代理可以自行修正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 限制

- 這是遠端 xAI 執行，不是本機程序執行。
- 將結果視為暫時性分析，而不是持久的 notebook 工作階段。
- 不要假設可以存取本機檔案或你的工作區。
- 若需要最新的 X 資料，請先使用 [`x_search`](/zh-TW/tools/web#x_search)，再將結果傳入 `code_execution`。

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
  <Card title="xAI 供應商" href="/zh-TW/providers/xai" icon="microchip">
    Grok 模型、web/x 搜尋，以及程式碼執行設定。
  </Card>
</CardGroup>
