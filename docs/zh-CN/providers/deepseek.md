---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API key 环境变量或 CLI 凭证选项
summary: DeepSeek 设置（认证 + 模型选择）
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T03:03:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 提供强大的 AI 模型，并提供 OpenAI 兼容 API。

| 属性 | 值                         |
| ---- | -------------------------- |
| 提供商 | `deepseek`                 |
| 凭证 | `DEEPSEEK_API_KEY`         |
| API  | OpenAI 兼容                |
| 基础 URL | `https://api.deepseek.com` |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 API 密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    这会提示你输入 API 密钥，并将 `deepseek/deepseek-v4-flash` 设为默认模型。

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    要在不需要运行中的 Gateway 网关的情况下检查插件的静态目录，请使用：

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非交互式设置">
    对于脚本化或无头安装，请直接传入所有标志：

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
如果 Gateway 网关作为守护进程运行（launchd/systemd），请确保该进程可以访问 `DEEPSEEK_API_KEY`（例如，在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。
</Warning>

## 内置目录

| 模型引用                     | 名称              | 输入 | 上下文    | 最大输出 | 说明                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | 默认模型；支持 V4 thinking 的接口 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | 支持 V4 thinking 的接口                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 非 thinking 接口         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 启用 reasoning 的 V3.2 接口             |

<Tip>
V4 模型支持 DeepSeek 的 `thinking` 控制。OpenClaw 还会在后续轮次中重放 DeepSeek `reasoning_content`，因此带工具调用的 thinking 会话可以继续。
使用 `/think xhigh` 或 `/think max` 搭配 DeepSeek V4 模型，请求 DeepSeek 的最大 `reasoning_effort`。
</Tip>

## Thinking 和工具

DeepSeek V4 thinking 会话的重放契约比大多数 OpenAI 兼容提供商更严格：在启用 thinking 的轮次使用工具后，DeepSeek 期望后续请求中从该轮次重放的 assistant 消息包含 `reasoning_content`。OpenClaw 会在 DeepSeek 插件内部处理这一点，因此普通的多轮工具使用可与 `deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro` 正常配合。

如果你将现有会话从另一个 OpenAI 兼容提供商切换到 DeepSeek V4 模型，较早的 assistant 工具调用轮次可能没有原生 DeepSeek `reasoning_content`。对于 DeepSeek V4 thinking 请求，OpenClaw 会在重放的 assistant 消息上填充这个缺失字段，这样提供商就能接受历史记录，而无需使用 `/new`。

当 OpenClaw 中禁用 thinking（包括 UI 中的 **None** 选择）时，OpenClaw 会发送 DeepSeek `thinking: { type: "disabled" }`，并从传出的历史记录中移除重放的 `reasoning_content`。这会让禁用 thinking 的会话保持在 DeepSeek 的非 thinking 路径上。

默认快速路径使用 `deepseek/deepseek-v4-flash`。当你需要更强的 V4 模型，并且可以接受更高成本或延迟时，使用 `deepseek/deepseek-v4-pro`。

## 实时测试

直接实时模型套件在现代模型集中包含 DeepSeek V4。要仅运行 DeepSeek V4 直接模型检查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

该实时检查会验证两个 V4 模型都能完成，并且 thinking/工具后续轮次会保留 DeepSeek 要求的重放载荷。

## 配置示例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
