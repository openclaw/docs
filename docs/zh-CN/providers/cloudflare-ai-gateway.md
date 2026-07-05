---
read_when:
    - 你想将 Cloudflare AI Gateway 与 OpenClaw 搭配使用
    - 你需要账户 ID、Gateway 网关 ID 或 API 密钥环境变量
summary: Cloudflare AI Gateway 设置（凭证 + 模型选择）
title: Cloudflare AI 网关
x-i18n:
    generated_at: "2026-07-05T11:35:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) 位于提供商 API 前面，并添加分析、缓存和控制能力。对于 Anthropic，OpenClaw 会通过你的 Gateway 网关端点使用 Anthropic Messages API。

| 属性      | 值                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| 提供商      | `cloudflare-ai-gateway`                                                                  |
| 插件        | 官方外部包（`@openclaw/cloudflare-ai-gateway-provider`）                   |
| 基础 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 默认模型 | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 密钥       | `CLOUDFLARE_AI_GATEWAY_API_KEY`（通过 Gateway 网关发起请求时使用的提供商 API 密钥） |

<Note>
对于通过 Cloudflare AI Gateway 路由的 Anthropic 模型，请使用你的 **Anthropic API 密钥** 作为提供商密钥。
</Note>

为 Anthropic Messages 模型启用 thinking 时，OpenClaw 会在通过 Cloudflare AI Gateway 发送载荷之前移除末尾的 assistant prefill 轮次。Anthropic 会拒绝带 extended thinking 的 response prefilling，而普通的非 thinking prefill 仍然可用。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="Set the provider API key and Gateway details">
    运行新手引导并选择 Cloudflare AI Gateway 凭证选项：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    这会提示你输入 account ID、gateway ID 和 API 密钥。

  </Step>
  <Step title="Set a default model">
    将模型添加到你的 OpenClaw 配置：

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，请在命令行上传入所有值：

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
  <Accordion title="Authenticated gateways">
    如果你在 Cloudflare 中启用了 Gateway 网关身份验证，请添加 `cf-aig-authorization` 标头。这是在你的提供商 API 密钥**之外**额外需要的。

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
    `cf-aig-authorization` 标头用于向 Cloudflare Gateway 网关本身进行身份验证，而提供商 API 密钥（例如你的 Anthropic 密钥）用于向上游提供商进行身份验证。
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 可供该进程使用。

    <Warning>
    只在交互式 shell 中导出的密钥不会对 launchd/systemd 守护进程生效，除非该环境也被导入到那里。请在 `~/.openclaw/.env` 中设置密钥，或通过 `env.shellEnv` 设置，以确保 Gateway 网关进程可以读取它。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Troubleshooting" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排查和常见问题。
  </Card>
</CardGroup>
