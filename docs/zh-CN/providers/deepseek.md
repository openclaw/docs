---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: DeepSeek 设置（凭证 + 模型选择）
title: DeepSeek
x-i18n:
    generated_at: "2026-07-05T11:34:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0a66574c1977e835823d3d5f9fea073889267d6336a15533dd25645621e70dc
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 提供强大的 AI 模型，并带有 OpenAI 兼容 API。

| 属性 | 值                         |
| -------- | -------------------------- |
| 提供商 | `deepseek`                 |
| 凭证     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI 兼容          |
| 基础 URL | `https://api.deepseek.com` |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="获取你的 API key">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    系统会提示输入你的 API key，并将 `deepseek/deepseek-v4-flash` 设置为默认模型。

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    如需在没有运行 Gateway 网关的情况下检查插件的静态目录：

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
如果 Gateway 网关以守护进程运行（launchd/systemd），请确保 `DEEPSEEK_API_KEY`
可供该进程使用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。
</Warning>

## 内置目录

| 模型引用                    | 名称              | 输入 | 上下文   | 最大输出 | 备注                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | 默认模型；V4 支持思考的接口 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | V4 支持思考的接口                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 非思考接口         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 启用推理的 V3.2 接口             |

<Tip>
V4 模型支持 DeepSeek 的 `thinking` 控制。OpenClaw 还会在后续轮次中重放
DeepSeek `reasoning_content`，因此带有工具调用的思考会话可以继续。
对 DeepSeek V4 模型使用 `/think xhigh` 或 `/think max`，可请求 DeepSeek 的
最大 `reasoning_effort`；两者都会映射到 `"max"`。
</Tip>

## 思考和工具

DeepSeek V4 思考会话要求来自启用思考轮次的重放助手消息，在后续请求中包含
`reasoning_content`。OpenClaw 的 DeepSeek 插件会自动回填该字段，因此即使历史来自其他
OpenAI 兼容提供商（没有原生 `reasoning_content`）或来自普通助手消息，
正常的多轮工具使用也能在 `deepseek/deepseek-v4-flash` 和
`deepseek/deepseek-v4-pro` 上工作。会话中途切换提供商后不需要 `/new`。

当思考被禁用时（包括 UI 中选择 **None**），OpenClaw 会发送
`thinking: { type: "disabled" }`，并从传出的历史中移除重放的 `reasoning_content`，
让会话保持在 DeepSeek 的非思考路径上。

默认快速路径请使用 `deepseek/deepseek-v4-flash`。当你可以接受更高成本或延迟时，
使用更强的 `deepseek/deepseek-v4-pro` 模型。

## 实时测试

如需只运行现代模型实时套件中的 DeepSeek V4 直连模型检查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

验证两个 V4 模型都能完成，并且思考/工具后续轮次会保留 DeepSeek 所需的重放载荷。

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
