---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API 密钥环境变量或 CLI 身份验证选项
summary: DeepSeek 设置（身份验证 + 模型选择）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T03:42:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) 提供具有 OpenAI 兼容 API 的强大 AI 模型。

| 属性 | 值 |
| -------- | -------------------------- |
| 提供商 | `deepseek` |
| 身份验证 | `DEEPSEEK_API_KEY` |
| API | OpenAI 兼容 |
| Base URL | `https://api.deepseek.com` |

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建一个 API 密钥。
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

    若要在不需要运行中的 Gateway 网关的情况下检查内置静态目录，请使用：

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非交互式设置">
    对于脚本化或无头安装，直接传入所有标志：

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
如果 Gateway 网关以守护进程方式运行（launchd/systemd），请确保 `DEEPSEEK_API_KEY`
对该进程可用（例如，在 `~/.openclaw/.env` 中或通过
`env.shellEnv`）。
</Warning>

## 内置目录

| 模型引用 | 名称 | 输入 | 上下文 | 最大输出 | 说明 |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | 默认模型；支持 V4 thinking 的界面 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | 支持 V4 thinking 的界面 |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 非 thinking 界面 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 启用推理的 V3.2 界面 |

<Tip>
V4 模型支持 DeepSeek 的 `thinking` 控制。OpenClaw 还会在后续轮次中重放
DeepSeek 的 `reasoning_content`，因此带有工具调用的 thinking 会话
可以继续进行。
</Tip>

## Thinking 和工具

DeepSeek V4 的 thinking 会话相比大多数
OpenAI 兼容提供商具有更严格的重放约定：当启用了 thinking 的 assistant 消息包含
工具调用时，DeepSeek 期望在后续请求中发回先前 assistant 的 `reasoning_content`。
OpenClaw 会在 DeepSeek 插件内部处理这一点，因此普通的多轮工具使用可在 `deepseek/deepseek-v4-flash` 和
`deepseek/deepseek-v4-pro` 中正常工作。

如果你将现有会话从另一个 OpenAI 兼容提供商切换到
DeepSeek V4 模型，较早的 assistant 工具调用轮次可能没有原生的
DeepSeek `reasoning_content`。OpenClaw 会为 DeepSeek V4
thinking 请求填补这个缺失字段，这样提供商就可以接受重放的工具调用历史，
而无需 `/new`。

当在 OpenClaw 中禁用 thinking 时（包括 UI 中的 **None** 选择），
OpenClaw 会发送 DeepSeek `thinking: { type: "disabled" }`，并从发送历史中移除重放的
`reasoning_content`。这样可使已禁用 thinking 的会话保持在非 thinking 的 DeepSeek 路径上。

将 `deepseek/deepseek-v4-flash` 用作默认的快速路径。若你希望使用更强的 V4 模型并且可以接受
更高的成本或延迟，请使用
`deepseek/deepseek-v4-pro`。

## 实时测试

直接实时模型套件在现代模型集中包含 DeepSeek V4。要
仅运行 DeepSeek V4 的直接模型检查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

该实时检查会验证两个 V4 模型都能够完成请求，并且 thinking/工具的
后续轮次会保留 DeepSeek 所要求的重放负载。

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

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    agents、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
