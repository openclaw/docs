---
read_when:
    - 你想将 LongCat-2.0 与 OpenClaw 搭配使用
    - 你需要 LongCat API key 或模型限制
summary: LongCat-2.0 的 LongCat API 设置
title: LongCat
x-i18n:
    generated_at: "2026-07-06T21:52:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) 提供 LongCat-2.0 的托管 API，这是一个面向编码和智能体工作负载构建的推理模型。OpenClaw 为 LongCat 的 OpenAI 兼容端点提供官方 `longcat` 插件。

| 属性       | 值                                 |
| ---------- | ---------------------------------- |
| 提供商     | `longcat`                          |
| 凭证       | `LONGCAT_API_KEY`                  |
| API        | OpenAI 兼容 Chat Completions       |
| 基础 URL   | `https://api.longcat.chat/openai`  |
| 模型       | `longcat/LongCat-2.0`              |
| 上下文     | 1,048,576 token                    |
| 最大输出   | 131,072 token                      |
| 输入       | 文本                               |

## 安装插件

安装官方包，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="Create an API key">
    登录 [LongCat API Platform](https://longcat.chat/platform/)，并在 [API Keys](https://longcat.chat/platform/api_keys)
    页面创建一个密钥。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

新手引导会添加托管目录，并在尚未配置主模型时选择 `longcat/LongCat-2.0`。

### 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## 推理行为

LongCat 暴露二元思考控制。OpenClaw 将启用的思考级别映射为
`thinking: { type: "enabled" }`，并将 `/think off` 映射为
`thinking: { type: "disabled" }`。LongCat 目前未记录
`reasoning_effort`，因此 OpenClaw 不会发送它。

LongCat 在 `reasoning_content` 中返回推理内容。OpenClaw 在重放 assistant 工具调用轮次时会保留该字段，以便多轮智能体会话保留提供商预期的消息形状。

## 定价

内置目录使用 LongCat 的按量付费标价，单位为每百万 token 的美元价格：未缓存输入 $0.75，缓存输入 $0.015，输出 $2.95。LongCat 可能会提供临时折扣；[定价页面](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)和你的账单记录才是权威来源。

## 自托管 LongCat-2.0

`longcat` 提供商面向 LongCat 的托管 API。对于 [Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0) 上的开放权重，请通过 OpenAI 兼容运行时提供该模型，并改用 OpenClaw 现有的 [vLLM](/zh-CN/providers/vllm) 或 [SGLang](/zh-CN/providers/sglang) 提供商。

在自托管提供商目录中保留运行时的确切模型标识符；不要通过 `longcat/LongCat-2.0` 路由本地部署。

## 故障排查

<AccordionGroup>
  <Accordion title="The key works in a shell but not in the Gateway">
    由守护进程管理的 Gateway 网关进程不会继承每个交互式 shell 变量。请将 `LONGCAT_API_KEY` 放入 `~/.openclaw/.env`，通过新手引导配置它，或使用已批准的密钥引用。
  </Accordion>

  <Accordion title="Requests fail with 402 or 429">
    `402` 表示账户的 token 配额不足。`429` 表示 API 密钥触发了速率限制。检查 [LongCat 用量](https://longcat.chat/platform/usage)，并在提供商的退避窗口结束后重试受速率限制的请求。
  </Accordion>

  <Accordion title="The model does not appear">
    运行 `openclaw plugins list` 并确认 `longcat` 插件已启用，然后运行 `openclaw models list --provider longcat`。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商配置、模型引用和故障转移行为。
  </Card>
  <Card title="LongCat API docs" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    托管 API 端点、身份验证、限制和示例。
  </Card>
  <Card title="LongCat-2.0 model card" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    架构、部署指南和模型详细信息。
  </Card>
  <Card title="Secrets" href="/zh-CN/gateway/secrets" icon="key">
    存储提供商凭据，而无需在配置中嵌入明文。
  </Card>
</CardGroup>
