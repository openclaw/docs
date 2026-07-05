---
read_when:
    - 你想启用或配置 code_execution
    - 你想在没有本地 shell 访问权限的情况下进行远程分析
    - 你想将 `x_search` 或 `web_search` 与远程 Python 分析结合使用
summary: 'code_execution: 使用 xAI 运行沙箱隔离的远程 Python 分析'
title: 代码执行
x-i18n:
    generated_at: "2026-07-05T11:44:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a35d585a6b1b53d3ea50085459e4f180da1e91b7c72ef51f98786e4e5226f8ad
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 在 xAI 的 Responses API 上运行沙箱隔离的远程 Python 分析
（`https://api.x.ai/v1/responses`，与 `x_search` 使用相同端点）。它由内置 `xai` 插件在 `tools` 合约下注册。

| 属性               | 值                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 工具名称           | `code_execution`                                                                  |
| 提供商插件         | `xai`（内置，`enabledByDefault: true`）                                           |
| 凭证               | xAI 凭证配置文件、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey` |
| 默认模型           | `grok-4-1-fast`                                                                   |
| 默认超时           | 30 秒                                                                             |
| 默认 `maxTurns`    | 未设置（xAI 会应用自己的内部限制）                                                |

可将它用于计算、制表、快速统计和图表式分析，包括分析 `x_search` 或 `web_search` 返回的数据。它无法访问本地文件、你的 shell、你的仓库或已配对设备，也不会在调用之间持久化状态，因此应将每次调用视为临时分析，而不是 notebook 会话。对于新的 X 数据，请先运行 [`x_search`](/zh-CN/tools/web#x_search)，再将结果传入。

本地执行请改用 [`exec`](/zh-CN/tools/exec)。

## 设置

<Steps>
  <Step title="提供 xAI 凭证">
    OAuth 需要符合条件的 SuperGrok 或 X Premium 订阅
    （设备代码验证，因此可在没有 localhost 回调的远程主机上使用）：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    全新安装期间，新手引导中也提供相同选项：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
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

    这三种方式也都可驱动 `x_search` 和 Grok `web_search`。

  </Step>

  <Step title="启用并调优 code_execution">
    只要 xAI 凭证可解析，`code_execution` 就可用。将
    `plugins.entries.xai.config.codeExecution.enabled` 设为 `false` 可禁用它，或使用同一个块覆盖模型、轮次上限或超时：

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

  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```

    xAI 插件以 `enabled: true` 重新注册后，`code_execution` 会出现在智能体的工具列表中。

  </Step>
</Steps>

## 使用方式

明确说明分析意图；该工具接受单个 `task` 参数，因此请在一个提示中发送完整请求和任何内联数据：

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

没有凭证时，该工具会返回结构化 JSON 错误（而不是抛出异常），因此智能体可以自行纠正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 相关

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
