---
read_when:
    - 你想将 DeepSeek 与 OpenClaw 一起使用
    - 你需要 API 密钥环境变量或 CLI 认证选择
summary: DeepSeek 设置（身份验证 + 模型选择）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T15:38:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 通过兼容 OpenAI 的 API 提供强大的 AI 模型。

| 属性 | 值                         |
| -------- | -------------------------- |
| 提供商 | `deepseek`                 |
| 认证     | `DEEPSEEK_API_KEY`         |
| API      | 兼容 OpenAI          |
| Base URL | `https://api.deepseek.com` |

## 入门指南

<Steps>
  <Step title="获取你的 API key">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 API key。
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

    如需在不要求 Gateway 网关运行的情况下检查内置静态目录，
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
如果 Gateway 网关以守护进程（launchd/systemd）运行，请确保 `DEEPSEEK_API_KEY`
可用于该进程（例如在 `~/.openclaw/.env` 中，或通过
`env.shellEnv`）。
</Warning>

## 内置目录

| 模型引用                     | 名称              | 输入 | 上下文    | 最大输出 | 备注                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | 默认模型；支持 V4 思考的表面 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | 支持 V4 思考的表面                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 非思考表面         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 启用推理的 V3.2 表面             |

<Tip>
V4 模型支持 DeepSeek 的 `thinking` 控制。OpenClaw 还会在后续轮次中重放
DeepSeek `reasoning_content`，因此带工具
调用的思考会话可以继续。
将 DeepSeek V4 模型与 `/think xhigh` 或 `/think max` 配合使用，以请求 DeepSeek 的
最大 `reasoning_effort`。
</Tip>

## 思考和工具

相比大多数兼容 OpenAI 的提供商，DeepSeek V4 思考会话有更严格的重放契约：在启用思考的轮次使用工具后，DeepSeek
期望该轮次重放的助手消息在后续请求中包含
`reasoning_content`。OpenClaw 在
DeepSeek 插件内部处理这一点，因此正常的多轮工具使用可与
`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro` 一起工作。

如果你将现有会话从另一个兼容 OpenAI 的提供商切换到
DeepSeek V4 模型，较早的助手工具调用轮次可能没有原生的
DeepSeek `reasoning_content`。OpenClaw 会在 DeepSeek V4 思考请求的重放
助手消息中填充该缺失字段，这样提供商就能接受
历史记录，而无需 `/new`。

当 OpenClaw 中禁用思考时（包括 UI 的 **None** 选择），
OpenClaw 会发送 DeepSeek `thinking: { type: "disabled" }`，并从传出历史中移除重放的
`reasoning_content`。这会让禁用思考的
会话保持在 DeepSeek 的非思考路径上。

默认快速路径使用 `deepseek/deepseek-v4-flash`。当你需要更强的 V4 模型，并且可以接受
更高成本或延迟时，使用
`deepseek/deepseek-v4-pro`。

## 实时测试

直接实时模型套件在现代模型集中包含 DeepSeek V4。如需
仅运行 DeepSeek V4 直接模型检查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

该实时检查会验证两个 V4 模型都能完成，并且思考/工具
后续轮次会保留 DeepSeek 所需的重放载荷。

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
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
