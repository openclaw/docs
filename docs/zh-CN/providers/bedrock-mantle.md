---
read_when:
    - 你想要将 Bedrock Mantle 托管的开源模型与 OpenClaw 搭配使用
    - 你需要用于 GPT-OSS、Qwen、Kimi 或 GLM 的 Mantle OpenAI 兼容端点
summary: 将 Amazon Bedrock Mantle（兼容 OpenAI）模型与 OpenClaw 配合使用
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-05T11:35:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1c930ee91661df184de159cc9d0430b5e4f31a0b6b2f0664894901e0d018a3
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw 包含一个内置的 **Amazon Bedrock Mantle** 提供商，可连接到
Mantle 的 OpenAI 兼容端点。Mantle 通过由 Bedrock 基础设施支撑的标准
`/v1/chat/completions` 表面托管开源和第三方模型（GPT-OSS、Qwen、Kimi、GLM
及类似模型）。Mantle 还通过 Anthropic Messages 路由公开两个 Anthropic Claude 模型。

| 属性       | 值                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| 提供商 ID    | `amazon-bedrock-mantle`                                                                        |
| API            | 对发现的 OSS 模型使用 `openai-completions`，对两个 Claude 模型使用 `anthropic-messages` |
| 凭证           | 显式 `AWS_BEARER_TOKEN_BEDROCK` 或通过 IAM 凭证链生成 bearer token            |
| 默认区域 | `us-east-1`（可用 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆盖）                               |

## 入门指南

选择你偏好的凭证方法并按照设置步骤操作。

<Tabs>
  <Tab title="Explicit bearer token">
    **最适合：** 已经拥有 Mantle bearer token 的环境。

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        可选设置区域（默认值为 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        发现的模型会显示在 `amazon-bedrock-mantle` 提供商下。除非你想覆盖默认值，否则不需要其他配置。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **最适合：** 使用 AWS SDK 兼容凭证（共享配置、SSO、Web 身份、实例角色或任务角色）。

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        任何 AWS SDK 兼容的凭证来源都可以使用：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw 会自动从凭证链生成 Mantle bearer token。
      </Step>
    </Steps>

    <Tip>
    未设置 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 会从 AWS 默认凭证链为你签发 bearer token，包括共享凭证/配置配置文件、SSO、Web 身份以及实例角色或任务角色。
    </Tip>

  </Tab>
</Tabs>

## 自动模型发现

设置 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 会直接使用它。否则，
OpenClaw 会尝试从 AWS 默认凭证链生成 Mantle bearer token。然后它会通过查询该区域的
`/v1/models` 端点来发现可用的 Mantle 模型。

| 行为          | 详情                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| 发现缓存   | 结果按区域缓存 1 小时；抓取失败时返回最后一次缓存的结果 |
| IAM token 刷新 | 每 2 小时刷新一次，按区域缓存                                                     |

若要保持 Mantle 插件启用，但禁止自动发现和 IAM
bearer token 生成，请禁用插件拥有的发现开关：

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
该 bearer token 与标准 [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
</Note>

### 支持的区域

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 手动配置

如果你偏好显式配置而不是自动发现：

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="Reasoning support">
    Reasoning 支持会从模型 ID 中包含的模式推断，例如
    `thinking`、`reasoner`、`reasoning`、`deepseek.r`、`gpt-oss-120b` 或
    `gpt-oss-safeguard-120b`。在发现过程中，OpenClaw 会自动为匹配的模型设置
    `reasoning: true`。
  </Accordion>

  <Accordion title="Endpoint unavailability">
    如果 Mantle 端点不可用、不返回模型，或 bearer token
    解析失败，发现会返回空结果并跳过隐式提供商。OpenClaw 不会报错；其他已配置的提供商会继续正常工作。
  </Accordion>

  <Accordion title="Claude Opus 4.7 and Claude Mythos Preview via the Anthropic Messages route">
    成功发现后，无论 `/v1/models` 返回什么，OpenClaw 始终会向 Mantle 目录追加两个 Claude 模型：
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7`（Claude Opus 4.7）和
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview`（Claude Mythos
    Preview）。两者都使用 `anthropic-messages` API 表面，并通过相同的 bearer 认证
    Anthropic 兼容端点（`<mantle-base>/anthropic`）进行流式传输，因此 AWS bearer token 不会被当作
    Anthropic API key 处理。

    Claude Mythos Preview 始终请求 reasoning；未设置 `/think` 级别时，默认使用 `high`
    effort（从 `xhigh`/`max` 向下映射到
    `high`，并将 `minimal` 向上映射到 `low`）。Mantle 上的 Opus 4.7 会在没有模型提供 reasoning 的情况下进行流式传输，并且 OpenClaw 会省略其 `temperature` 参数，
    因为 Opus 4.7 在此路由上不接受采样覆盖；Mythos
    Preview 则正常接受 `temperature` 覆盖。

    这两个模型不能通过 `models.providers["amazon-bedrock-mantle"].models`
    条目配置；当发现成功时，它们始终由发现添加，并且只能通过完全禁用发现来移除。

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle 是一个独立于标准
    [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商的提供商。Mantle 对其 OSS 目录使用
    OpenAI 兼容的 `/v1` 表面，而标准
    Bedrock 提供商使用原生 Bedrock Converse API。

    当存在 `AWS_BEARER_TOKEN_BEDROCK` 凭证时，两个提供商会共享它。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/zh-CN/providers/bedrock" icon="cloud">
    面向 Anthropic Claude、Titan 和其他模型的原生 Bedrock 提供商。
  </Card>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth and auth" href="/zh-CN/gateway/authentication" icon="key">
    凭证详情和凭证复用规则。
  </Card>
  <Card title="Troubleshooting" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
