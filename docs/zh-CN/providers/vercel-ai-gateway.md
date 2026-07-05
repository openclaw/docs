---
read_when:
    - 你想将 Vercel AI Gateway 与 OpenClaw 搭配使用
    - 你需要 API key 环境变量或 CLI 凭证选择
summary: Vercel AI Gateway 设置（凭证 + 模型选择）
title: Vercel AI 网关
x-i18n:
    generated_at: "2026-07-05T11:38:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一 API，可通过单个端点访问数百个模型。

| 属性          | 值                                     |
| ------------- | -------------------------------------- |
| 提供商        | `vercel-ai-gateway`                    |
| 包            | `@openclaw/vercel-ai-gateway-provider` |
| 凭证          | `AI_GATEWAY_API_KEY`                   |
| API           | 兼容 Anthropic Messages                |
| 基础 URL      | `https://ai-gateway.vercel.sh`         |
| 模型目录      | 通过 `/v1/models` 自动发现             |

<Tip>
OpenClaw 会自动发现 Gateway 网关 `/v1/models` 目录，因此
`/models vercel-ai-gateway` 聊天命令和
`openclaw models list --provider vercel-ai-gateway` 都会包含当前模型
ref，例如 `vercel-ai-gateway/openai/gpt-5.5` 和
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

OpenClaw 会在运行时规范化 Claude 简写模型 ref：

| 简写输入                            | 规范化后的模型 ref                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在配置中使用任一形式；OpenClaw 会自动解析规范的
`anthropic/...` ref。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="守护进程的环境变量">
    如果 OpenClaw Gateway 网关以守护进程（launchd/systemd）运行，请确保
    `AI_GATEWAY_API_KEY` 对该进程可用。

    <Warning>
    仅在交互式 shell 中导出的 key 不会对 launchd/systemd 守护进程可见，
    除非显式导入该环境。请在 `~/.openclaw/.env` 中或通过 `env.shellEnv`
    设置该 key，以确保 Gateway 网关进程可以读取它。
    </Warning>

  </Accordion>

  <Accordion title="提供商路由">
    Vercel AI Gateway 会将每个请求路由到模型 ref 前缀中命名的上游提供商。
    例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 会通过 Anthropic 路由，
    `vercel-ai-gateway/openai/gpt-5.5` 会通过 OpenAI 路由，
    `vercel-ai-gateway/moonshotai/kimi-k2.6` 会通过 MoonshotAI 路由。
    一个 `AI_GATEWAY_API_KEY` 可为所有上游提供商完成认证。
  </Accordion>
  <Accordion title="思考级别">
    当 OpenClaw 识别出上游模型前缀时，`/think` 选项会跟随该前缀。
    `vercel-ai-gateway/anthropic/...` 使用 Claude 思考配置文件，
    包括 Claude 4.6 模型的自适应默认值。受信任的
    `vercel-ai-gateway/openai/...` ref（`gpt-5.2` 及更新版本，以及低至
    `gpt-5.1-codex` 的 Codex 变体）会公开 `/think xhigh`。其他带命名空间的
    ref 会保留标准推理级别，除非其目录元数据声明了更多级别。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 ref 和故障转移行为。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    一般故障排查和常见问题。
  </Card>
</CardGroup>
