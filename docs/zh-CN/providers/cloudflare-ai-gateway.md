---
read_when:
    - 你想将 Cloudflare AI Gateway 与 OpenClaw 搭配使用
    - 你需要账户 ID、Gateway 网关 ID 或 API key 环境变量
summary: Cloudflare AI Gateway 设置（身份验证 + 模型选择）
title: Cloudflare AI 网关
x-i18n:
    generated_at: "2026-07-11T20:52:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) 位于提供商 API 前端，并提供分析、缓存和控制功能。对于 Anthropic，OpenClaw 通过你的 Gateway 网关端点使用 Anthropic Messages API。

| 属性     | 值                                                                                       |
| -------- | ---------------------------------------------------------------------------------------- |
| 提供商   | `cloudflare-ai-gateway`                                                                  |
| 插件     | 官方外部软件包（`@openclaw/cloudflare-ai-gateway-provider`）                             |
| 基础 URL | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 默认模型 | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 密钥 | `CLOUDFLARE_AI_GATEWAY_API_KEY`（用于通过 Gateway 网关发出请求的提供商 API 密钥）        |

<Note>
对于通过 Cloudflare AI Gateway 路由的 Anthropic 模型，请使用你的 **Anthropic API 密钥**作为提供商密钥。
</Note>

为 Anthropic Messages 模型启用思考功能时，OpenClaw 会先移除末尾的助手预填充轮次，再通过 Cloudflare AI Gateway 发送载荷。Anthropic 不允许将响应预填充与扩展思考功能结合使用，而普通的非思考预填充仍然可用。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="设置提供商 API 密钥和 Gateway 网关详细信息">
    运行新手引导并选择 Cloudflare AI Gateway 身份验证选项：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    系统会提示你输入账户 ID、Gateway 网关 ID 和 API 密钥。

  </Step>
  <Step title="设置默认模型">
    将模型添加到你的 OpenClaw 配置中：

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
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，请在命令行中传递所有值：

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
  <Accordion title="经过身份验证的 Gateway 网关">
    如果你在 Cloudflare 中启用了 Gateway 网关身份验证，请添加 `cf-aig-authorization` 标头。除了提供商 API 密钥之外，**还需要**此标头。

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

  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程（launchd/systemd）形式运行，请确保该进程可以访问 `CLOUDFLARE_AI_GATEWAY_API_KEY`。

    <Warning>
    仅在交互式 shell 中导出的密钥对 launchd/systemd 守护进程无效，除非该环境也导入到守护进程中。请在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，以确保 Gateway 网关进程能够读取它。
    </Warning>

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
