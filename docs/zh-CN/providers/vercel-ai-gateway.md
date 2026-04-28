---
read_when:
- 你想在 OpenClaw 中使用 Vercel AI Gateway
- 你需要配置 API key 环境变量或 CLI 认证选项
summary: Vercel AI Gateway 设置（认证 + 模型选择）
title: Vercel AI Gateway
x-i18n:
  generated_at: '2026-04-23T21:02:28Z'
  model: gpt-5.4
  provider: openai
  source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
  source_path: providers/vercel-ai-gateway.md
  workflow: 15
---
[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一 API，
可通过单一端点访问数百种模型。

| 属性 | 值 |
| ------------- | -------------------------------- |
| 提供商 | `vercel-ai-gateway` |
| 认证 | `AI_GATEWAY_API_KEY` |
| API | 与 Anthropic Messages 兼容 |
| 模型目录 | 通过 `/v1/models` 自动发现 |

<Tip>
OpenClaw 会自动发现 Gateway 的 `/v1/models` 目录，因此
`/models vercel-ai-gateway` 会包含当前模型引用，例如
`vercel-ai-gateway/openai/gpt-5.5` 和
`vercel-ai-gateway/moonshotai/kimi-k2.6`。
</Tip>

## 入门指南

<Steps>
  <Step title="设置 API key">
    运行新手引导并选择 AI Gateway 认证选项：

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="设置默认模型">
    将模型添加到你的 OpenClaw 配置中：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本或 CI 设置，请在命令行上传入所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 模型 ID 简写

OpenClaw 接受 Vercel Claude 简写模型引用，并会在
运行时对其进行规范化：

| 简写输入 | 规范化后的模型引用 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在配置中使用简写或完整模型引用中的任一种。
OpenClaw 会自动解析为规范形式。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="供守护进程使用的环境变量">
    如果 OpenClaw Gateway 网关作为守护进程（launchd/systemd）运行，请确保
    `AI_GATEWAY_API_KEY` 对该进程可见。

    <Warning>
    仅在 `~/.profile` 中设置的 key 不会被 launchd/systemd
    守护进程看到，除非显式导入该环境。请将 key 设置在
    `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供，以确保 gateway 进程能够
    读取它。
    </Warning>

  </Accordion>

  <Accordion title="提供商路由">
    Vercel AI Gateway 会根据模型引用前缀将请求路由到上游提供商。
    例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 会路由到
    Anthropic，而 `vercel-ai-gateway/openai/gpt-5.5` 会路由到
    OpenAI，`vercel-ai-gateway/moonshotai/kimi-k2.6` 会路由到
    MoonshotAI。你的单个 `AI_GATEWAY_API_KEY` 会负责为所有
    上游提供商完成认证。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    如何选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排除和常见问题。
  </Card>
</CardGroup>
