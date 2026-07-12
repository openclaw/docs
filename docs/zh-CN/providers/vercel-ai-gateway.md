---
read_when:
    - 你想将 Vercel AI Gateway 与 OpenClaw 配合使用
    - 你需要 API key 环境变量或 CLI 身份验证选项
summary: Vercel AI Gateway 设置（身份验证 + 模型选择）
title: Vercel AI 网关
x-i18n:
    generated_at: "2026-07-11T20:53:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一 API，可通过单一端点访问数百种模型。

| 属性 | 值 |
| ------------- | -------------------------------------- |
| 提供商 | `vercel-ai-gateway` |
| 软件包 | `@openclaw/vercel-ai-gateway-provider` |
| 身份验证 | `AI_GATEWAY_API_KEY` |
| API | 兼容 Anthropic Messages |
| 基础 URL | `https://ai-gateway.vercel.sh` |
| 模型目录 | 通过 `/v1/models` 自动发现 |

<Tip>
OpenClaw 会自动发现 Gateway 网关的 `/v1/models` 目录，因此 `/models vercel-ai-gateway` 聊天命令和 `openclaw models list --provider vercel-ai-gateway` 都会包含当前模型引用，例如 `vercel-ai-gateway/openai/gpt-5.5` 和 `vercel-ai-gateway/moonshotai/kimi-k2.6`。
</Tip>

## 入门指南

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="设置默认模型">
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

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 模型 ID 简写

OpenClaw 会在运行时规范化 Claude 简写模型引用：

| 简写输入 | 规范化模型引用 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在配置中使用任一形式；OpenClaw 会自动解析为规范的 `anthropic/...` 引用。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="守护进程的环境变量">
    如果 OpenClaw Gateway 网关以守护进程（launchd/systemd）形式运行，请确保该进程可以使用 `AI_GATEWAY_API_KEY`。

    <Warning>
    仅在交互式 shell 中导出的密钥不会对 launchd/systemd 守护进程可见，除非显式导入该环境。请在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，以确保 Gateway 网关进程能够读取它。
    </Warning>

  </Accordion>

  <Accordion title="提供商路由">
    Vercel AI Gateway 会根据模型引用前缀中指定的上游提供商路由每个请求。例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 通过 Anthropic 路由，`vercel-ai-gateway/openai/gpt-5.5` 通过 OpenAI 路由，而 `vercel-ai-gateway/moonshotai/kimi-k2.6` 通过 MoonshotAI 路由。一个 `AI_GATEWAY_API_KEY` 即可对所有上游提供商进行身份验证。
  </Accordion>
  <Accordion title="思考级别">
    当 OpenClaw 能够识别上游模型前缀时，`/think` 选项会遵循该前缀。`vercel-ai-gateway/anthropic/...` 使用 Claude 思考配置，包括 Claude 4.6 模型的自适应默认设置。可信的 `vercel-ai-gateway/openai/...` 引用（`gpt-5.2` 及更新版本，以及最低至 `gpt-5.1-codex` 的 Codex 变体）会提供 `/think xhigh`。其他带命名空间的引用会保留标准推理级别，除非其目录元数据声明了更多级别。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排查和常见问题。
  </Card>
</CardGroup>
