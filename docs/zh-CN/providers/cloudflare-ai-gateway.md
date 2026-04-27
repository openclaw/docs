---
read_when:
    - 你想将 Cloudflare AI Gateway 与 OpenClaw 一起使用
    - 你需要账户 ID、Gateway 网关 ID 或 API key 环境变量
summary: Cloudflare AI Gateway 设置（凭证 + 模型选择）
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-27T20:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway 位于提供商 API 之前，让你能够添加分析、缓存和控制功能。对于 Anthropic，OpenClaw 会通过你的 Gateway 网关端点使用 Anthropic Messages API。

| 属性 | 值 |
| ------------- | ---------------------------------------------------------------------------------------- |
| 提供商 | `cloudflare-ai-gateway` |
| Base URL | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic` |
| 默认模型 | `cloudflare-ai-gateway/claude-sonnet-4-6` |
| API key | `CLOUDFLARE_AI_GATEWAY_API_KEY`（你用于通过 Gateway 网关发起请求的提供商 API key） |

<Note>
对于通过 Cloudflare AI Gateway 路由的 Anthropic 模型，请使用你的 **Anthropic API key** 作为提供商密钥。
</Note>

当为 Anthropic Messages 模型启用 thinking 时，OpenClaw 会在通过 Cloudflare AI Gateway 发送负载之前，去除末尾的 assistant 预填充轮次。Anthropic 会拒绝带有扩展 thinking 的响应预填充，而普通的非 thinking 预填充仍然可用。

## 入门指南

<Steps>
  <Step title="设置提供商 API key 和 Gateway 网关详细信息">
    运行新手引导并选择 Cloudflare AI Gateway 凭证选项：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    系统会提示你输入账户 ID、Gateway 网关 ID 和 API key。

  </Step>
  <Step title="设置默认模型">
    将该模型添加到你的 OpenClaw 配置中：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证该模型可用">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，请在命令行上传递所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 高级配置

<AccordionGroup>
  <Accordion title="需要身份验证的 Gateway 网关">
    如果你在 Cloudflare 中启用了 Gateway 身份验证，请添加 `cf-aig-authorization` 标头。这是**除了**你的提供商 API key 之外的额外要求。

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` 标头用于向 Cloudflare Gateway 本身进行身份验证，而提供商 API key（例如你的 Anthropic key）用于向上游提供商进行身份验证。
    </Tip>

  </Accordion>

  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 可供该进程使用。

    <Warning>
    如果密钥只存在于 `~/.profile` 中，那么它不会对 launchd/systemd 守护进程起作用，除非该环境也被导入到那里。请在 `~/.openclaw/.env` 中设置该密钥，或通过 `env.shellEnv` 设置，以确保 gateway 进程能够读取它。
    </Warning>

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
