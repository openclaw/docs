---
read_when:
    - 你想将 Vercel AI Gateway 与 OpenClaw 一起使用
    - 你需要 API 密钥环境变量或 CLI 认证选择
summary: Vercel AI Gateway 网关设置（凭证 + 模型选择）
title: Vercel AI 网关
x-i18n:
    generated_at: "2026-06-27T03:11:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一 API，可通过单一端点访问数百个模型。

| 属性          | 值                                     |
| ------------- | -------------------------------------- |
| 提供商        | `vercel-ai-gateway`                    |
| 软件包        | `@openclaw/vercel-ai-gateway-provider` |
| 认证          | `AI_GATEWAY_API_KEY`                   |
| API           | 兼容 Anthropic Messages                |
| 模型目录      | 通过 `/v1/models` 自动发现             |

<Tip>
OpenClaw 会自动发现 Gateway 网关 `/v1/models` 目录，因此
`/models vercel-ai-gateway` 会包含当前模型引用，例如
`vercel-ai-gateway/openai/gpt-5.5` 和
`vercel-ai-gateway/moonshotai/kimi-k2.6`。
</Tip>

## 入门指南

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="设置 API key">
    运行新手引导并选择 AI Gateway 认证选项：

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="设置默认模型">
    将模型添加到你的 OpenClaw 配置：

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

对于脚本化或 CI 设置，请在命令行传入所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 模型 ID 简写

OpenClaw 接受 Vercel Claude 简写模型引用，并会在运行时将其规范化：

| 简写输入                            | 规范化模型引用                                |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在配置中使用简写或完整限定的模型引用。OpenClaw 会自动解析为规范形式。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="守护进程的环境变量">
    如果 OpenClaw Gateway 网关以守护进程（launchd/systemd）运行，请确保
    `AI_GATEWAY_API_KEY` 对该进程可用。

    <Warning>
    仅在交互式 shell 中导出的 key 不会对 launchd/systemd 守护进程可见，除非显式导入该环境。请在
    `~/.openclaw/.env` 中设置 key，或通过 `env.shellEnv` 设置，以确保网关进程可以读取它。
    </Warning>

  </Accordion>

  <Accordion title="提供商路由">
    Vercel AI Gateway 会根据模型引用前缀将请求路由到上游提供商。例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 会通过 Anthropic 路由，而 `vercel-ai-gateway/openai/gpt-5.5` 会通过 OpenAI 路由，`vercel-ai-gateway/moonshotai/kimi-k2.6` 会通过 MoonshotAI 路由。你的单个 `AI_GATEWAY_API_KEY` 会处理所有上游提供商的认证。
  </Accordion>
  <Accordion title="思考级别">
    当 OpenClaw 知道上游提供商合同时，`/think` 选项会遵循受信任的上游模型前缀。`vercel-ai-gateway/anthropic/...` 使用 Claude 思考配置文件，包括 Claude 4.6 模型的自适应默认值。
    `vercel-ai-gateway/openai/gpt-5.4`、`gpt-5.5` 和 Codex 风格的引用会像直接的 OpenAI/OpenAI Codex 提供商一样公开
    `/think xhigh`。其他带命名空间的引用会保留正常推理级别，除非其目录元数据声明了更多级别。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排除和常见问题。
  </Card>
</CardGroup>
