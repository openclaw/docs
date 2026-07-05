---
read_when:
    - 你想啟用或設定 code_execution
    - 你想要在沒有本機 shell 存取權限的情況下進行遠端分析
    - 你想將 x_search 或 web_search 與遠端 Python 分析結合
summary: 'code_execution: 使用 xAI 執行沙盒化的遠端 Python 分析'
title: 程式碼執行
x-i18n:
    generated_at: "2026-07-05T11:44:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a35d585a6b1b53d3ea50085459e4f180da1e91b7c72ef51f98786e4e5226f8ad
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 會在 xAI 的 Responses API 上執行沙盒化的遠端 Python 分析
（`https://api.x.ai/v1/responses`，與 `x_search` 使用相同端點）。它由內建的 `xai` 外掛在 `tools` 合約下註冊。

| 屬性               | 值                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 工具名稱           | `code_execution`                                                                  |
| 提供者外掛         | `xai`（內建，`enabledByDefault: true`）                                           |
| 驗證               | xAI 驗證設定檔、`XAI_API_KEY`，或 `plugins.entries.xai.config.webSearch.apiKey`   |
| 預設模型           | `grok-4-1-fast`                                                                   |
| 預設逾時           | 30 秒                                                                             |
| 預設 `maxTurns`    | 未設定（xAI 會套用自己的內部限制）                                                |

可用於計算、製表、快速統計與圖表式分析，包括由 `x_search` 或 `web_search` 傳回的資料。它無法存取本機檔案、你的 shell、你的 repo 或配對裝置，且不會在呼叫之間保留狀態，因此請將每次呼叫視為暫時性分析，而不是筆記本工作階段。若要取得最新的 X 資料，請先執行 [`x_search`](/zh-TW/tools/web#x_search)，再將結果傳入。

若要在本機執行，請改用 [`exec`](/zh-TW/tools/exec)。

## 設定

<Steps>
  <Step title="Provide xAI credentials">
    OAuth 需要符合資格的 SuperGrok 或 X Premium 訂閱
    （裝置碼驗證，因此可從沒有 localhost 回呼的遠端主機使用）：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    在全新安裝期間，也可以在 onboarding 中選擇相同選項：

    ```bash
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

    這三種方式也都會供 `x_search` 和 Grok `web_search` 使用。

  </Step>

  <Step title="Enable and tune code_execution">
    只要能解析 xAI 憑證，就能使用 `code_execution`。將 `plugins.entries.xai.config.codeExecution.enabled` 設為 `false` 可停用它，或使用相同區塊覆寫模型、回合上限或逾時：

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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    一旦 xAI 外掛以 `enabled: true` 重新註冊，`code_execution` 就會出現在代理程式的工具清單中。

  </Step>
</Steps>

## 如何使用

明確說明分析意圖；此工具接受單一 `task` 參數，因此請在同一個提示中送出完整請求與任何內嵌資料：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## 錯誤

如果沒有驗證，工具會傳回結構化 JSON 錯誤（而不是拋出的例外），因此代理程式可以自行修正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 相關

<CardGroup cols={2}>
  <Card title="Exec tool" href="/zh-TW/tools/exec" icon="terminal">
    在你的機器或配對節點上執行本機 shell。
  </Card>
  <Card title="Exec approvals" href="/zh-TW/tools/exec-approvals" icon="shield">
    shell 執行的允許/拒絕政策。
  </Card>
  <Card title="Web tools" href="/zh-TW/tools/web" icon="globe">
    `web_search`、`x_search` 和 `web_fetch`。
  </Card>
  <Card title="xAI provider" href="/zh-TW/providers/xai" icon="microchip">
    Grok 模型、web/x 搜尋，以及程式碼執行設定。
  </Card>
</CardGroup>
