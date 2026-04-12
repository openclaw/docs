---
read_when:
    - 你想将 Cloudflare AI Gateway 与 OpenClaw 搭配使用
    - 你需要账户 ID、Gateway 网关 ID，或 API 密钥环境变量
summary: Cloudflare AI Gateway 设置（身份验证 + 模型选择）
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T10:33:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway 位于提供商 API 前端，让你可以添加分析、缓存和控制。对于 Anthropic，OpenClaw 会通过你的 Gateway 网关端点使用 Anthropic Messages API。

| Property      | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| 提供商      | `cloudflare-ai-gateway`                                                                  |
| 基础 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 默认模型 | `cloudflare-ai-gateway/claude-sonnet-4-5`                                                |
| API 密钥       | `CLOUDFLARE_AI_GATEWAY_API_KEY`（你通过 Gateway 网关发起请求时使用的提供商 API 密钥） |

<Note>
对于通过 Cloudflare AI Gateway 路由的 Anthropic 模型，请使用你的 **Anthropic API 密钥** 作为提供商密钥。
</Note>

## 入门指南

<Steps>
  <Step title="设置提供商 API 密钥和 Gateway 网关详情">
    运行新手引导并选择 Cloudflare AI Gateway 身份验证选项：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    系统会提示你输入账户 ID、Gateway 网关 ID 和 API 密钥。

  </Step>
  <Step title="设置默认模型">
    将该模型添加到你的 OpenClaw 配置中：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，请在命令行中传入所有值：

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
    如果你在 Cloudflare 中启用了 Gateway 身份验证，请添加 `cf-aig-authorization` 请求头。这是**对你的提供商 API 密钥的额外补充**。

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
    `cf-aig-authorization` 请求头用于与 Cloudflare Gateway 网关本身进行身份验证，而提供商 API 密钥（例如你的 Anthropic 密钥）则用于与上游提供商进行身份验证。
    </Tip>

  </Accordion>

  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 对该进程可用。

    <Warning>
    仅存在于 `~/.profile` 中的密钥无法帮助 launchd/systemd 守护进程，除非该环境变量也被导入到那里。请在 `~/.openclaw/.env` 中设置该密钥，或通过 `env.shellEnv` 设置，以确保 Gateway 网关进程能够读取它。
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
