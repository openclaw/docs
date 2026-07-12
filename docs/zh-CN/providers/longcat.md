---
read_when:
    - 你想在 OpenClaw 中使用 LongCat-2.0
    - 你需要 LongCat API key 或模型限制条件
summary: LongCat-2.0 的 LongCat API 设置
title: LongCat
x-i18n:
    generated_at: "2026-07-11T20:52:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) 为 LongCat-2.0 提供托管 API。LongCat-2.0 是一款面向编程和智能体工作负载构建的推理模型。OpenClaw 为 LongCat 的 OpenAI 兼容端点提供官方 `longcat` 插件。

| 属性       | 值                                 |
| ---------- | ---------------------------------- |
| 提供商     | `longcat`                          |
| 身份验证   | `LONGCAT_API_KEY`                  |
| API        | OpenAI 兼容的 Chat Completions     |
| 基础 URL   | `https://api.longcat.chat/openai`  |
| 模型       | `longcat/LongCat-2.0`              |
| 上下文     | 1,048,576 个 token                 |
| 最大输出   | 131,072 个 token                   |
| 输入       | 文本                               |

## 安装插件

安装官方软件包，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="创建 API key">
    登录 [LongCat API 平台](https://longcat.chat/platform/)，然后在
    [API Keys](https://longcat.chat/platform/api_keys) 页面创建密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="验证模型">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

如果尚未配置主要模型，新手引导会添加托管模型目录并选择 `longcat/LongCat-2.0`。

### 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## 推理行为

LongCat 提供二元思考控制。OpenClaw 将启用的思考级别映射为 `thinking: { type: "enabled" }`，并将 `/think off` 映射为 `thinking: { type: "disabled" }`。LongCat 目前未记录 `reasoning_effort`，因此 OpenClaw 不会发送该字段。

LongCat 在 `reasoning_content` 中返回推理内容。OpenClaw 在重放智能体工具调用轮次时会保留该字段，以便多轮智能体会话保持提供商预期的消息结构。

## 定价

内置模型目录采用 LongCat 以美元计价的按量付费标价，每百万 token 的价格为：未缓存输入 $0.75、缓存输入 $0.015、输出 $2.95。LongCat 可能会提供临时折扣；请以[定价页面](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)和你的账单记录为准。

## 自托管 LongCat-2.0

`longcat` 提供商面向 LongCat 的托管 API。对于 [Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0) 上的开放权重，请通过 OpenAI 兼容运行时提供模型，并改用 OpenClaw 现有的 [vLLM](/zh-CN/providers/vllm) 或 [SGLang](/zh-CN/providers/sglang) 提供商。

在自托管提供商的模型目录中保留运行时使用的确切模型标识符；不要通过 `longcat/LongCat-2.0` 路由本地部署。

## 故障排查

<AccordionGroup>
  <Accordion title="密钥在 shell 中有效，但在 Gateway 网关中无效">
    由守护进程管理的 Gateway 网关进程不会继承交互式 shell 中的所有变量。请将 `LONGCAT_API_KEY` 放入 `~/.openclaw/.env`，通过新手引导进行配置，或使用经批准的密钥引用。
  </Accordion>

  <Accordion title="请求因 402 或 429 失败">
    `402` 表示账户的 token 配额不足。`429` 表示 API key 达到了速率限制。请检查 [LongCat 用量](https://longcat.chat/platform/usage)，并在提供商的退避时间窗口结束后重试受速率限制的请求。
  </Accordion>

  <Accordion title="模型未显示">
    运行 `openclaw plugins list` 并确认 `longcat` 插件已启用，然后运行 `openclaw models list --provider longcat`。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商配置、模型引用和故障转移行为。
  </Card>
  <Card title="LongCat API 文档" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    托管 API 端点、身份验证、限制和示例。
  </Card>
  <Card title="LongCat-2.0 模型卡片" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    架构、部署指南和模型详情。
  </Card>
  <Card title="密钥" href="/zh-CN/gateway/secrets" icon="key">
    存储提供商凭据，无需在配置中嵌入明文。
  </Card>
</CardGroup>
