---
read_when:
    - 你想要启用或配置 code_execution
    - 你希望在不提供本地 shell 访问权限的情况下进行远程分析
    - 你想将 `x_search` 或 `web_search` 与远程 Python 分析结合使用
summary: code_execution：使用 xAI 运行沙箱隔离的远程 Python 分析
title: 代码执行
x-i18n:
    generated_at: "2026-07-12T14:48:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` 通过 xAI 的 Responses API（`https://api.x.ai/v1/responses`，与 `x_search` 使用相同端点）运行沙箱隔离的远程 Python 分析。它由内置的 `xai` 插件根据 `tools` 契约注册。

<Warning>
  `code_execution` 在 xAI 的服务器上运行。xAI 对每 1,000 次工具调用收取 $5，
  另加模型的输入和输出 token 费用。
</Warning>

| 属性               | 值                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 工具名称           | `code_execution`                                                                  |
| 提供商插件         | `xai`（内置，`enabledByDefault: true`）                                           |
| 身份验证           | xAI 身份验证配置文件、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey` |
| 默认模型           | `grok-4.3`                                                                        |
| 默认超时           | 30 秒                                                                             |
| 默认 `maxTurns`    | 未设置（xAI 应用其自身的内部限制）                                                |

可将它用于计算、制表、快速统计和图表式分析，包括分析 `x_search` 或 `web_search` 返回的数据。它无法访问本地文件、你的 shell、你的仓库或已配对设备，并且不会在调用之间保留状态，因此应将每次调用视为临时分析，而不是笔记本会话。若要获取最新的 X 数据，请先运行 [`x_search`](/zh-CN/tools/web#x_search)，再将结果传入。

若要在本地执行，请改用 [`exec`](/zh-CN/tools/exec)。

## 设置

<Steps>
  <Step title="提供 xAI 凭据">
    OAuth 需要符合条件的 SuperGrok 或 X Premium 订阅
    （使用设备代码验证，因此可从没有 localhost 回调的远程主机运行）：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    全新安装期间，新手引导中也提供相同选项：

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

    这三种方式中的任意一种也可为 `x_search` 和 Grok `web_search` 提供支持。

  </Step>

  <Step title="启用并调整 code_execution">
    省略 `enabled` 时，仅当当前模型的提供商为 `xai` 且能够解析 xAI
    凭据时，才会公开 `code_execution`。如果当前模型使用已知的非 xAI
    提供商，请将 `plugins.entries.xai.config.codeExecution.enabled` 设置为
    `true`，以选择启用跨提供商使用。如果当前模型的提供商缺失或无法解析，
    该工具会保持隐藏。将 `enabled` 设置为 `false` 可对所有提供商禁用它。
    始终需要 xAI 凭据。

    使用同一配置块可覆盖模型、轮次上限或超时时间：

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // 使用已知的非 xAI 模型提供商时必需
                model: "grok-4.3", // 覆盖默认的 xAI 代码执行模型
                maxTurns: 2,            // 可选的内部工具轮次上限
                timeoutSeconds: 30,     // 请求超时时间（默认值：30）
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

    xAI 插件重新注册，并且上述提供商、启用状态和身份验证检查均通过后，
    `code_execution` 会出现在智能体的工具列表中。

  </Step>
</Steps>

## 使用方法

明确说明分析意图；该工具只接受一个 `task` 参数，因此请在一个提示词中发送完整请求和所有内联数据：

```text
使用 code_execution 计算这些数字的 7 天移动平均值：...
```

```text
使用 x_search 查找本周提及 OpenClaw 的帖子，然后使用 code_execution 按天统计数量。
```

```text
使用 web_search 收集最新的 AI 基准测试数字，然后使用 code_execution 比较百分比变化。
```

## 错误

缺少身份验证时，该工具会返回结构化 JSON 错误（而不是抛出异常），因此智能体可以自行纠正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution 需要 xAI 凭据。运行 `openclaw onboard --auth-choice xai-oauth` 以使用 Grok 登录，运行 `openclaw onboard --auth-choice xai-api-key`，在 Gateway 网关环境中设置 `XAI_API_KEY`，或配置 `plugins.entries.xai.config.webSearch.apiKey`。",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    在你的计算机或已配对节点上执行本地 shell。
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
