---
read_when:
    - 你想在 OpenClaw 中使用 Fireworks 时
    - 你需要 Fireworks API key 环境变量或默认模型 id 时
summary: Fireworks 设置（认证 + 模型选择）
x-i18n:
    generated_at: "2026-04-05T08:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) 通过 OpenAI 兼容 API 提供开放权重模型和路由模型。OpenClaw 现已内置 Fireworks 提供商插件。

- 提供商：`fireworks`
- 认证：`FIREWORKS_API_KEY`
- API：兼容 OpenAI 的 chat/completions
- Base URL：`https://api.fireworks.ai/inference/v1`
- 默认模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## 快速开始

通过新手引导设置 Fireworks 认证：

```bash
openclaw onboard --auth-choice fireworks-api-key
```

这会将你的 Fireworks 密钥存储到 OpenClaw 配置中，并将 Fire Pass 入门模型设为默认值。

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 环境说明

如果 Gateway 网关 运行在你的交互式 shell 之外，请确保 `FIREWORKS_API_KEY`
对该进程同样可用。仅存在于 `~/.profile` 中的密钥
无法帮助 launchd/systemd 守护进程，除非该环境也被导入到那里。

## 内置目录

| 模型引用 | 名称 | 输入 | 上下文 | 最大输出 | 说明 |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo（Fire Pass） | text,image | 256,000 | 256,000 | Fireworks 上默认内置的入门模型 |

## 自定义 Fireworks 模型 id

OpenClaw 也接受动态 Fireworks 模型 id。请使用 Fireworks 显示的精确模型或路由 id，并为其添加 `fireworks/` 前缀。

示例：

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

如果 Fireworks 发布了更新的模型，例如新的 Qwen 或 Gemma 版本，你可以直接使用其 Fireworks 模型 id 切换过去，而无需等待内置目录更新。
