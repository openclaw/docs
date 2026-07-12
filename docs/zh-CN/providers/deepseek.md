---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API key 环境变量或 CLI 身份验证选项
summary: DeepSeek 设置（身份验证 + 模型选择）
title: DeepSeek
x-i18n:
    generated_at: "2026-07-11T20:51:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 提供功能强大的 AI 模型，并配有 OpenAI 兼容 API。

| 属性 | 值                         |
| ---- | -------------------------- |
| 提供商 | `deepseek`                 |
| 身份验证 | `DEEPSEEK_API_KEY`         |
| API | OpenAI 兼容                |
| 基础 URL | `https://api.deepseek.com` |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 API 密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    系统会提示你输入 API 密钥，并将 `deepseek/deepseek-v4-flash` 设为默认模型。

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    如需在 Gateway 网关未运行时检查插件的静态目录：

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
如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保该进程可以访问
`DEEPSEEK_API_KEY`（例如，将其放入 `~/.openclaw/.env`，或通过
`env.shellEnv` 提供）。
</Warning>

## 内置目录

| 模型引用                     | 名称              | 输入 | 上下文    | 最大输出 | 备注                                                |
| ---------------------------- | ----------------- | ---- | --------- | -------- | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | 文本 | 1,000,000 | 384,000  | 默认模型；支持推理的 V4 接口                        |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | 文本 | 1,000,000 | 384,000  | 支持推理的 V4 接口                                  |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | 文本 | 1,000,000 | 384,000  | 已弃用的 V4 Flash 非推理兼容名称                    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | 文本 | 1,000,000 | 384,000  | 已弃用的 V4 Flash 推理兼容名称                      |

<Warning>
DeepSeek 将于 2026 年 7 月 24 日 15:59 UTC 停用 `deepseek-chat` 和
`deepseek-reasoner`。它们目前分别以非推理模式和推理模式路由到 DeepSeek V4
Flash。请在截止时间前将已配置的模型引用迁移至
`deepseek/deepseek-v4-flash` 或 `deepseek/deepseek-v4-pro`。
</Warning>

OpenClaw 的本地费用估算采用 DeepSeek 公布的缓存命中、缓存未命中和输出费率。
DeepSeek 可能会更改这些费率；计费应以其
[模型与定价](https://api-docs.deepseek.com/quick_start/pricing/)页面为准。

<Tip>
V4 模型支持 DeepSeek 的 `thinking` 控制。OpenClaw 还会在后续轮次中重放
DeepSeek 的 `reasoning_content`，以便包含工具调用的推理会话能够继续。
对 DeepSeek V4 模型使用 `/think xhigh` 或 `/think max`，可请求 DeepSeek 的
最高 `reasoning_effort`；两者都会映射为 `"max"`。
</Tip>

## 推理和工具

DeepSeek V4 推理会话要求：在后续请求中，从已启用推理的轮次重放的助手消息必须
包含 `reasoning_content`。OpenClaw 的 DeepSeek 插件会自动补填该字段，因此即使
历史记录来自其他 OpenAI 兼容提供商（没有原生 `reasoning_content`），或来自普通
助手消息，`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro` 上的常规
多轮工具使用也能正常工作。在会话中途切换提供商后，无需使用 `/new`。

禁用推理时（包括在 UI 中选择 **None**），OpenClaw 会发送
`thinking: { type: "disabled" }`，并从出站历史记录中移除重放的
`reasoning_content`，使会话保持在 DeepSeek 的非推理路径上。

默认快速路径请使用 `deepseek/deepseek-v4-flash`。如果可以接受更高的费用或延迟，
请使用能力更强的模型 `deepseek/deepseek-v4-pro`。

## 实时测试

如需仅运行现代模型实时测试套件中的 DeepSeek V4 直接模型检查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

此测试会验证两个 V4 模型均可完成请求，并确认推理/工具后续轮次保留 DeepSeek
所需的重放载荷。

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
