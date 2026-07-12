---
read_when:
    - 你想要启用或配置 code_execution
    - 你希望在没有本地 shell 访问权限的情况下进行远程分析
    - 你希望将 x_search 或 web_search 与远程 Python 分析结合使用
summary: code_execution：使用 xAI 运行沙箱隔离的远程 Python 分析
title: 代码执行
x-i18n:
    generated_at: "2026-07-11T21:00:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 通过 xAI 的 Responses API
（`https://api.x.ai/v1/responses`，与 `x_search` 使用相同端点）运行沙箱隔离的远程 Python 分析。它由内置的 `xai` 插件根据 `tools` 契约注册。

<Warning>
  `code_execution` 在 xAI 的服务器上运行。xAI 对每 1,000 次工具调用收取 5 美元，
  另加模型的输入和输出 token 费用。
</Warning>

| 属性               | 值                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 工具名称           | `code_execution`                                                                  |
| 提供商插件         | `xai`（内置，`enabledByDefault: true`）                                           |
| 身份验证           | xAI 身份验证配置文件、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey` |
| 默认模型           | `grok-4.3`                                                                        |
| 默认超时时间       | 30 秒                                                                             |
| 默认 `maxTurns`    | 未设置（xAI 应用其自身的内部限制）                                                |

可将它用于计算、制表、快速统计和图表式分析，包括分析 `x_search` 或 `web_search` 返回的数据。它无法访问本地文件、你的 shell、你的仓库或已配对设备，并且不会在调用之间持久保存状态，因此应将每次调用视为临时分析，而不是笔记本会话。如需最新的 X 数据，请先运行 [`x_search`](/zh-CN/tools/web#x_search)，然后将结果传入。

如需本地执行，请改用 [`exec`](/zh-CN/tools/exec)。

## 设置

<Steps>
  <Step title="Provide xAI credentials">
    OAuth 需要符合条件的 SuperGrok 或 X Premium 订阅
    （使用设备代码验证，因此可从远程主机运行，无需 localhost 回调）：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    全新安装期间，也可以在新手引导中使用相同选项：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    或使用 API 密钥：

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

    以上三种方式中的任一种也可为 `x_search` 和 Grok `web_search` 提供支持。

  </Step>

  <Step title="Enable and tune code_execution">
    省略 `enabled` 时，仅当活动模型的提供商为 `xai` 且可解析 xAI 凭据时，才会公开 `code_execution`。对于具有已知非 xAI 提供商的活动模型，请将
    `plugins.entries.xai.config.codeExecution.enabled` 设置为 `true`，以选择启用跨提供商使用。如果活动模型的提供商缺失或无法解析，该工具将保持隐藏。将 `enabled` 设置为 `false` 可对所有提供商禁用它。始终需要 xAI 凭据。

    使用同一配置块可覆盖模型、轮次上限或超时时间：

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // required for a known non-xAI model provider
                model: "grok-4.3", // override the default xAI code-execution model
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

    xAI 插件重新注册后，如果上述提供商、启用状态和身份验证检查均通过，`code_execution` 就会出现在智能体的工具列表中。

  </Step>
</Steps>

## 使用方法

请明确说明分析意图；该工具只接受一个 `task` 参数，因此请在一个提示中发送完整请求和所有内联数据：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## 错误

缺少身份验证时，该工具会返回结构化 JSON 错误（而不是抛出异常），因此智能体可以自行纠正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    在你的计算机或已配对节点上执行本地 shell。
  </Card>
  <Card title="Exec approvals" href="/zh-CN/tools/exec-approvals" icon="shield">
    shell 执行的允许/拒绝策略。
  </Card>
  <Card title="Web tools" href="/zh-CN/tools/web" icon="globe">
    `web_search`、`x_search` 和 `web_fetch`。
  </Card>
  <Card title="xAI provider" href="/zh-CN/providers/xai" icon="microchip">
    Grok 模型、Web/X 搜索和代码执行配置。
  </Card>
</CardGroup>
