---
read_when:
    - 你想在 OpenClaw 中使用 Cloudflare AI Gateway
    - 你需要账号 ID、Gateway 网关 ID 或 API 密钥环境变量
summary: Cloudflare AI Gateway 设置（凭证 + 模型选择）
title: Cloudflare AI 网关
x-i18n:
    generated_at: "2026-06-27T03:02:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway 位于提供商 API 前面，让你可以添加分析、缓存和控制功能。对于 Anthropic，OpenClaw 会通过你的 Gateway 网关端点使用 Anthropic Messages API。

| 属性          | 值                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| 提供商        | `cloudflare-ai-gateway`                                                                  |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 默认模型      | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 密钥      | `CLOUDFLARE_AI_GATEWAY_API_KEY`（用于通过 Gateway 网关发起请求的提供商 API 密钥） |

<Note>
对于通过 Cloudflare AI Gateway 路由的 Anthropic 模型，请使用你的 **Anthropic API 密钥** 作为提供商密钥。
</Note>

为 Anthropic Messages 模型启用 thinking 时，OpenClaw 会在通过 Cloudflare AI Gateway 发送载荷之前移除末尾的 assistant 预填轮次。Anthropic 会拒绝带 extended thinking 的响应预填，而普通的非 thinking 预填仍可使用。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="设置提供商 API 密钥和 Gateway 网关详情">
    运行新手引导并选择 Cloudflare AI Gateway 凭证选项：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    这会提示你输入账户 ID、Gateway 网关 ID 和 API 密钥。

  </Step>
  <Step title="设置默认模型">
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
  <Step title="验证模型可用">
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
  <Accordion title="已认证的 Gateway 网关">
    如果你在 Cloudflare 中启用了 Gateway 网关认证，请添加 `cf-aig-authorization` 标头。这是你的提供商 API 密钥**之外**的配置。

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
    `cf-aig-authorization` 标头用于向 Cloudflare Gateway 网关本身认证，而提供商 API 密钥（例如你的 Anthropic 密钥）用于向上游提供商认证。
    </Tip>

  </Accordion>

  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程（launchd/systemd）运行，请确保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 对该进程可用。

    <Warning>
    仅在交互式 shell 中导出的密钥无法帮助 launchd/systemd 守护进程，除非该环境也被导入到那里。请在 `~/.openclaw/.env` 中设置该密钥，或通过 `env.shellEnv` 设置，以确保 Gateway 网关进程可以读取它。
    </Warning>

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
