---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API key 环境变量或 CLI 凭证选择
summary: DeepSeek 设置（凭证 + 模型选择）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:34:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6e9d4e24204cbc097c13ccd837d7a6f8dd36538f1b22aae644762b88b948d0f
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) 提供功能强大的 AI 模型，并带有与 OpenAI 兼容的 API。

| 属性 | 值 |
| -------- | -------------------------- |
| 提供商 | `deepseek` |
| 凭证 | `DEEPSEEK_API_KEY` |
| API | 与 OpenAI 兼容 |
| Base URL | `https://api.deepseek.com` |

## 入门指南

<Steps>
  <Step title="获取你的 API key">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建一个 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    这会提示你输入 API key，并将 `deepseek/deepseek-v4-flash` 设置为默认模型。

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    若要查看内置的静态目录而无需运行中的 Gateway 网关，
    请使用：

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
如果 Gateway 网关作为守护进程运行（launchd/systemd），请确保 `DEEPSEEK_API_KEY`
对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过
`env.shellEnv` 提供）。
</Warning>

## 内置目录

| 模型引用 | 名称 | 输入 | 上下文 | 最大输出 | 说明 |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text | 1,000,000 | 384,000 | 默认模型；支持 V4 thinking 的接口 |
| `deepseek/deepseek-v4-pro` | DeepSeek V4 Pro | text | 1,000,000 | 384,000 | 支持 V4 thinking 的接口 |
| `deepseek/deepseek-chat` | DeepSeek Chat | text | 131,072 | 8,192 | DeepSeek V3.2 非 thinking 接口 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072 | 65,536 | 启用推理的 V3.2 接口 |

<Tip>
V4 模型支持 DeepSeek 的 `thinking` 控制。OpenClaw 还会在后续轮次中重放
DeepSeek `reasoning_content`，因此带有工具调用的 thinking 会话
可以继续进行。
</Tip>

## Thinking 和工具

DeepSeek V4 thinking 会话的重放约定比大多数
与 OpenAI 兼容的提供商更严格：当启用 thinking 的助手消息包含
工具调用时，DeepSeek 期望在后续请求中把先前助手的 `reasoning_content`
一并发回。OpenClaw 在 DeepSeek 插件内部处理了这一点，
因此普通的多轮工具使用可以在 `deepseek/deepseek-v4-flash` 和
`deepseek/deepseek-v4-pro` 上正常工作。

当在 OpenClaw 中禁用 thinking 时（包括 UI 中的 **None** 选择），
OpenClaw 会发送 DeepSeek `thinking: { type: "disabled" }`，并从发出的
历史记录中去除重放的 `reasoning_content`。这样可以让已禁用 thinking 的
会话走 DeepSeek 的非 thinking 路径。

默认快速路径请使用 `deepseek/deepseek-v4-flash`。如果你想使用能力更强的
V4 模型，并且可以接受更高的成本或延迟，请使用
`deepseek/deepseek-v4-pro`。

## 实时测试

直接实时模型套件在现代模型集中包含 DeepSeek V4。若只运行
DeepSeek V4 的直接模型检查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

该实时检查会验证两个 V4 模型都能完成请求，并且 thinking/工具的
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
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
