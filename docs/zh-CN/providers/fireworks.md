---
read_when:
    - 你想在 OpenClaw 中使用 Fireworks
    - 你需要 Fireworks API 密钥环境变量或默认模型 ID
summary: Fireworks 设置（凭证 + 模型选择）
x-i18n:
    generated_at: "2026-04-12T10:33:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f87b2ed6fb6c6db086166ff2775f15d876947f48a36b9dd2e2a55269709cb6a
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) 通过与 OpenAI 兼容的 API 提供开放权重模型和路由模型。OpenClaw 内置了 Fireworks 提供商插件。

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| 提供商      | `fireworks`                                            |
| 凭证          | `FIREWORKS_API_KEY`                                    |
| API           | 与 OpenAI 兼容的 chat/completions                     |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| 默认模型 | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## 入门指南

<Steps>
  <Step title="通过新手引导设置 Fireworks 凭证">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    这会将你的 Fireworks 密钥存储到 OpenClaw 配置中，并将 Fire Pass 入门模型设为默认值。

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，在命令行上传递所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| Model ref                                              | Name                        | Input      | Context | Max output | Notes                                      |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo（Fire Pass） | text,image | 256,000 | 256,000    | Fireworks 上默认内置的入门模型 |

<Tip>
如果 Fireworks 发布了更新的模型，例如新的 Qwen 或 Gemma 版本，你可以直接使用其 Fireworks 模型 ID 切换到该模型，而无需等待内置目录更新。
</Tip>

## 自定义 Fireworks 模型 ID

OpenClaw 也接受动态 Fireworks 模型 ID。使用 Fireworks 显示的精确模型或路由 ID，并在前面加上 `fireworks/` 前缀。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="模型 ID 前缀的工作方式">
    OpenClaw 中的每个 Fireworks 模型引用都以 `fireworks/` 开头，后面跟 Fireworks 平台中的精确 ID 或路由路径。例如：

    - 路由模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在构建 API 请求时会去掉 `fireworks/` 前缀，并将剩余路径发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="环境变量说明">
    如果 Gateway 网关 运行在你的交互式 shell 之外，请确保 `FIREWORKS_API_KEY` 对该进程同样可用。

    <Warning>
    如果密钥只存在于 `~/.profile` 中，那么对于 `launchd`/`systemd` 守护进程不会有帮助，除非该环境变量也被导入到那里。请在 `~/.openclaw/.env` 中设置该密钥，或通过 `env.shellEnv` 设置，以确保 Gateway 网关 进程能够读取它。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见的故障排除和常见问题。
  </Card>
</CardGroup>
