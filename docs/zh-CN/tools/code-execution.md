---
read_when:
    - 你想启用或配置 code_execution
    - 你希望在没有本地命令行访问权限的情况下进行远程分析
    - 你想将 x_search 或 web_search 与远程 Python 分析结合使用
summary: 'code_execution: 使用 xAI 运行沙箱隔离的远程 Python 分析'
title: 代码执行
x-i18n:
    generated_at: "2026-05-05T23:54:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 在 xAI 的 Responses API 上运行沙箱隔离的远程 Python 分析。它由内置 `xai` 插件注册（位于 `tools` 合约下），并分派到 `x_search` 使用的同一个 `https://api.x.ai/v1/responses` 端点。

| 属性               | 值                                                             |
| ------------------ | -------------------------------------------------------------- |
| 工具名称           | `code_execution`                                               |
| 提供商插件         | `xai`（内置，`enabledByDefault: true`）                        |
| 凭证               | `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey` |
| 默认模型           | `grok-4-1-fast`                                                |
| 默认超时           | 30 秒                                                         |
| 默认 `maxTurns`    | 未设置（xAI 会应用自己的内部限制）                             |

这不同于本地 [`exec`](/zh-CN/tools/exec)：

- `exec` 在你的机器或已配对节点上运行 shell 命令。
- `code_execution` 在 xAI 的远程沙箱中运行 Python。

将 `code_execution` 用于：

- 计算。
- 制表。
- 快速统计。
- 图表式分析。
- 分析 `x_search` 或 `web_search` 返回的数据。

当你需要本地文件、你的 shell、你的仓库或已配对设备时，不要使用它。请为此使用 [`exec`](/zh-CN/tools/exec)。

## 设置

<Steps>
  <Step title="提供 xAI API key">
    在 Gateway 网关环境中设置 `XAI_API_KEY`，或在 xAI 插件下配置该 key，以便同一凭据覆盖 `code_execution`、`x_search`、Web 搜索和其他 xAI 工具：

    ```bash
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

  <Step title="启用并调优 code_execution">
    该工具受 `plugins.entries.xai.config.codeExecution.enabled` 控制。默认关闭。

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

    xAI 插件使用 `enabled: true` 重新注册后，`code_execution` 会出现在智能体的工具列表中。

  </Step>
</Steps>

## 如何使用

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

该工具在内部接受单个 `task` 参数，因此智能体应在一个提示中发送完整的分析请求以及任何内联数据。

## 错误

当该工具在没有凭证的情况下运行时，它会返回一个结构化的 `missing_xai_api_key` 错误，指向环境变量和配置路径。该错误是 JSON，而不是抛出的异常，因此智能体可以自我修正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 限制

- 这是远程 xAI 执行，不是本地进程执行。
- 将结果视为临时分析，而不是持久化的 notebook 会话。
- 不要假定它可以访问本地文件或你的工作区。
- 如需最新的 X 数据，请先使用 [`x_search`](/zh-CN/tools/web#x_search)，并将结果传入 `code_execution`。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    在你的机器或已配对节点上执行本地 shell。
  </Card>
  <Card title="Exec 审批" href="/zh-CN/tools/exec-approvals" icon="shield">
    shell 执行的允许/拒绝策略。
  </Card>
  <Card title="Web 工具" href="/zh-CN/tools/web" icon="globe">
    `web_search`、`x_search` 和 `web_fetch`。
  </Card>
  <Card title="xAI 提供商" href="/zh-CN/providers/xai" icon="microchip">
    Grok 模型、Web/X 搜索和代码执行配置。
  </Card>
</CardGroup>
