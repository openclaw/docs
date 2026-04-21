---
read_when:
    - 你想在 OpenClaw 中使用 Fireworks
    - 你需要 Fireworks API 密钥环境变量或默认模型 ID
summary: Fireworks 设置（凭证 + 模型选择）
title: Fireworks
x-i18n:
    generated_at: "2026-04-21T19:44:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb2268b8d6d58da66c7db7423062d6b308a6f657e2825a406e2b5d1d499afa05
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) 通过与 OpenAI 兼容的 API 提供开放权重模型和路由模型。OpenClaw 内置了 Fireworks 提供商插件。

| 属性 | 值 |
| ------------- | ------------------------------------------------------ |
| 提供商 | `fireworks` |
| 凭证 | `FIREWORKS_API_KEY` |
| API | 与 OpenAI 兼容的 chat/completions |
| 基础 URL | `https://api.fireworks.ai/inference/v1` |
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

对于脚本化或 CI 设置，请在命令行上传入所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用 | 名称 | 输入 | 上下文 | 最大输出 | 说明 |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6` | Kimi K2.6 | text,image | 262,144 | 262,144 | Fireworks 上最新的 Kimi 模型 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo（Fire Pass） | text,image | 256,000 | 256,000 | Fireworks 上默认内置的入门模型 |

<Tip>
如果 Fireworks 发布了更新的模型，例如新的 Qwen 或 Gemma 版本，你可以直接使用其 Fireworks 模型 ID 切换到该模型，而无需等待内置目录更新。
</Tip>

## 自定义 Fireworks 模型 ID

OpenClaw 也接受动态 Fireworks 模型 ID。使用 Fireworks 显示的精确模型或路由器 ID，并为其添加 `fireworks/` 前缀。

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
    OpenClaw 中的每个 Fireworks 模型引用都以 `fireworks/` 开头，后面跟着 Fireworks 平台中的精确 ID 或路由路径。例如：

    - 路由模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在构建 API 请求时会去掉 `fireworks/` 前缀，并将剩余路径发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="环境说明">
    如果 Gateway 网关 运行在你的交互式 shell 之外，请确保 `FIREWORKS_API_KEY` 对该进程也可用。

    <Warning>
    如果密钥仅存在于 `~/.profile` 中，那么对于 `launchd`/`systemd` 守护进程它不会起作用，除非该环境也被导入到那里。请在 `~/.openclaw/.env` 中设置该密钥，或通过 `env.shellEnv` 设置，以确保网关进程可以读取它。
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
