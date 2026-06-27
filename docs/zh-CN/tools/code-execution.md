---
read_when:
    - 你想启用或配置 code_execution
    - 你希望在没有本地 shell 访问权限的情况下进行远程分析
    - 你想将 x_search 或 web_search 与远程 Python 分析结合使用
summary: 'code_execution: 使用 xAI 运行沙箱隔离的远程 Python 分析'
title: 代码执行
x-i18n:
    generated_at: "2026-06-27T03:25:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fe174e2c2ae9989ae651e0694c12158ba460f0f1a35786d0ac628e0ff8f741
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 会在 xAI 的 Responses API 上运行沙箱隔离的远程 Python 分析。它由内置的 `xai` 插件注册（位于 `tools` contract 下），并分发到 `x_search` 使用的同一个 `https://api.x.ai/v1/responses` endpoint。

| 属性               | 值                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 工具名称           | `code_execution`                                                                  |
| 提供商插件         | `xai`（内置，`enabledByDefault: true`）                                           |
| 凭证               | xAI 凭证配置、`XAI_API_KEY`，或 `plugins.entries.xai.config.webSearch.apiKey`     |
| 默认模型           | `grok-4-1-fast`                                                                   |
| 默认超时           | 30 秒                                                                             |
| 默认 `maxTurns`    | 未设置（xAI 会应用自己的内部限制）                                                |

这不同于本地 [`exec`](/zh-CN/tools/exec)：

- `exec` 会在你的机器或已配对节点上运行 shell 命令。
- `code_execution` 会在 xAI 的远程沙箱中运行 Python。

将 `code_execution` 用于：

- 计算。
- 制表。
- 快速统计。
- 图表式分析。
- 分析 `x_search` 或 `web_search` 返回的数据。

当你需要本地文件、你的 shell、你的仓库或已配对设备时，**不要**使用它。请使用 [`exec`](/zh-CN/tools/exec)。

## 设置

<Steps>
  <Step title="Provide xAI credentials">
    使用符合条件的 SuperGrok 或 X Premium 订阅通过 Grok OAuth 登录，
    使用适合远程的设备码流程，或存储 API key。OAuth 适用于
    `code_execution` 和 `x_search`；`XAI_API_KEY` 或插件 Web 搜索
    配置也可以为 Grok `web_search` 提供能力。

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw models auth login --provider xai --device-code
    ```

    在全新安装期间，相同的凭证选项也可在新手引导中使用：

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-device-code
    ```

    或使用 API key：

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    或通过配置：

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

  <Step title="Enable and tune code_execution">
    当 xAI 凭证可用时，`code_execution` 即可使用。将
    `plugins.entries.xai.config.codeExecution.enabled` 设置为 `false` 可禁用它，
    或使用同一配置块来调整模型和超时。

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

    一旦 xAI 插件以 `enabled: true` 重新注册，`code_execution` 就会显示在智能体的工具列表中。

  </Step>
</Steps>

## 如何使用它

自然提问，并明确分析意图：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

该工具内部接受单个 `task` 参数，因此智能体应在一个提示中发送完整的分析请求和任何内联数据。

## 错误

当工具在没有凭证的情况下运行时，它会返回结构化的 `missing_xai_api_key` 错误，指向凭证配置、环境变量和配置选项。该错误是 JSON，而不是抛出的异常，因此智能体可以自行修正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 限制

- 这是远程 xAI 执行，不是本地进程执行。
- 将结果视为临时分析，而不是持久 notebook 会话。
- 不要假设可以访问本地文件或你的工作区。
- 对于最新 X 数据，请先使用 [`x_search`](/zh-CN/tools/web#x_search)，再将结果传入 `code_execution`。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    在你的机器或已配对节点上执行本地 shell。
  </Card>
  <Card title="Exec approvals" href="/zh-CN/tools/exec-approvals" icon="shield">
    shell 执行的允许/拒绝策略。
  </Card>
  <Card title="Web tools" href="/zh-CN/tools/web" icon="globe">
    `web_search`、`x_search` 和 `web_fetch`。
  </Card>
  <Card title="xAI provider" href="/zh-CN/providers/xai" icon="microchip">
    Grok 模型、web/x 搜索和代码执行配置。
  </Card>
</CardGroup>
