---
read_when:
    - 你想将 Vercel AI Gateway 与 OpenClaw 一起使用
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: Vercel AI Gateway 设置（认证 + 模型选择）
title: Vercel AI Gateway 网关
x-i18n:
    generated_at: "2026-04-22T03:53:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway 网关

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一的 API，让你通过单个端点访问数百种模型。

| Property | Value |
| ------------- | -------------------------------- |
| 提供商 | `vercel-ai-gateway` |
| 认证 | `AI_GATEWAY_API_KEY` |
| API | 与 Anthropic Messages 兼容 |
| 模型目录 | 通过 `/v1/models` 自动发现 |

<Tip>
OpenClaw 会自动发现 Gateway 网关 的 `/v1/models` 目录，因此 `/models vercel-ai-gateway` 会包含当前的模型引用，例如 `vercel-ai-gateway/openai/gpt-5.4` 和 `vercel-ai-gateway/moonshotai/kimi-k2.6`。
</Tip>

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    运行新手引导并选择 AI Gateway 网关 认证选项：

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="设置默认模型">
    将该模型添加到你的 OpenClaw 配置中：

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
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，请在命令行中传递所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 模型 ID 简写

OpenClaw 接受 Vercel Claude 的简写模型引用，并会在运行时将其标准化：

| 简写输入 | 标准化后的模型引用 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在配置中使用简写或完整限定的模型引用。OpenClaw 会自动解析为规范形式。
</Tip>

## 高级说明

<AccordionGroup>
  <Accordion title="用于守护进程的环境变量">
    如果 OpenClaw Gateway 网关 以守护进程（launchd/systemd）方式运行，请确保 `AI_GATEWAY_API_KEY` 可供该进程使用。

    <Warning>
    如果密钥只设置在 `~/.profile` 中，除非显式导入该环境，否则 launchd/systemd 守护进程将无法看到它。请在 `~/.openclaw/.env` 中设置该密钥，或通过 `env.shellEnv` 设置，以确保 Gateway 网关 进程可以读取它。
    </Warning>

  </Accordion>

  <Accordion title="提供商路由">
    Vercel AI Gateway 网关 会根据模型引用前缀将请求路由到上游提供商。例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 会通过 Anthropic 路由，`vercel-ai-gateway/openai/gpt-5.4` 会通过 OpenAI 路由，而 `vercel-ai-gateway/moonshotai/kimi-k2.6` 会通过 Moonshot AI 路由。单个 `AI_GATEWAY_API_KEY` 即可处理所有上游提供商的认证。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排除和常见问题。
  </Card>
</CardGroup>
