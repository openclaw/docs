---
read_when:
    - 你想在 OpenClaw 中使用 Bedrock Mantle 托管的 OSS 模型
    - 你需要用于 GPT-OSS、Qwen、Kimi 或 GLM 的 Mantle OpenAI 兼容端点
    - 你希望通过 Amazon Bedrock Mantle 使用 Claude Sonnet 5 或 Mythos 5
summary: 通过 OpenClaw 使用兼容 OpenAI 的 Amazon Bedrock Mantle 模型和 Claude Messages 模型
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T14:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw 包含一个内置的 **Amazon Bedrock Mantle** 提供商，用于连接
Mantle 的 OpenAI 兼容端点。Mantle 通过由 Bedrock 基础设施支持的标准
`/v1/chat/completions` 接口托管开源和第三方模型（GPT-OSS、Qwen、Kimi、GLM
及类似模型）。Mantle 还通过 Anthropic Messages 路由提供 Anthropic Claude 模型。

| 属性           | 值                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------- |
| 提供商 ID      | `amazon-bedrock-mantle`                                                                             |
| API            | 对已发现的 OSS 模型使用 `openai-completions`，对 Claude 模型使用 `anthropic-messages`               |
| 身份验证       | 显式设置 `AWS_BEARER_TOKEN_BEDROCK`，或通过 IAM 凭证链生成持有者令牌                                |
| 默认区域       | `us-east-1`（可使用 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆盖）                                     |

## 入门指南

选择你偏好的身份验证方法，并按照设置步骤操作。

<Tabs>
  <Tab title="显式持有者令牌">
    **最适合：** 已拥有 Mantle 持有者令牌的环境。

    <Steps>
      <Step title="在 Gateway 网关主机上设置持有者令牌">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        也可以设置区域（默认为 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证是否已发现模型">
        ```bash
        openclaw models list
        ```

        已发现的模型会显示在 `amazon-bedrock-mantle` 提供商下。除非你要覆盖默认值，
        否则无需其他配置。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 凭证">
    **最适合：** 使用与 AWS SDK 兼容的凭证（共享配置、SSO、Web 身份、实例角色或任务角色）。

    <Steps>
      <Step title="在 Gateway 网关主机上配置 AWS 凭证">
        任何与 AWS SDK 兼容的身份验证来源都可以使用：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证是否已发现模型">
        ```bash
        openclaw models list
        ```

        OpenClaw 会自动根据凭证链生成 Mantle 持有者令牌。
      </Step>
    </Steps>

    <Tip>
    未设置 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 会根据 AWS 默认凭证链为你生成持有者令牌，其中包括共享凭证/配置文件、SSO、Web 身份以及实例角色或任务角色。
    </Tip>

  </Tab>
</Tabs>

## 自动发现模型

设置 `AWS_BEARER_TOKEN_BEDROCK` 后，OpenClaw 会直接使用它。否则，
OpenClaw 会尝试根据 AWS 默认凭证链生成 Mantle 持有者令牌。然后，它会通过查询
相应区域的 `/v1/models` 端点来发现可用的 Mantle 模型。

| 行为              | 详情                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| 发现缓存          | 结果按区域缓存 1 小时；获取失败时返回上次缓存的结果                                |
| IAM 令牌刷新      | 每 2 小时一次，按区域缓存                                                          |

若要保持启用 Mantle 插件，同时禁止自动发现和生成 IAM 持有者令牌，请禁用该插件自有的发现开关：

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
该持有者令牌与标准 [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
</Note>

### 支持的区域

`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 手动配置

如果你偏好使用显式配置，而不是自动发现：

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

显式指定的非空 `models` 列表具有权威性，会替换所有
已发现的条目，包括下面的 Claude 条目。省略 `models` 可保留
自动生成的 Mantle 目录；或者添加你要使用的全部 Claude 模型条目。

## 高级配置

<AccordionGroup>
  <Accordion title="推理支持">
    系统会根据模型 ID 是否包含 `thinking`、`reasoner`、`reasoning`、
    `deepseek.r`、`gpt-oss-120b` 或 `gpt-oss-safeguard-120b` 等模式来推断
    推理支持。OpenClaw 会在发现过程中自动为匹配的模型设置 `reasoning: true`。
  </Accordion>

  <Accordion title="端点不可用">
    如果 Mantle 端点不可用、未返回任何模型，或持有者令牌解析失败，发现操作会返回
    空结果，并跳过隐式提供商。OpenClaw 不会报错；其他已配置的提供商
    会继续正常工作。
  </Accordion>

  <Accordion title="通过 Anthropic Messages 路由使用 Claude">
    当模型列表由自动发现管理时，OpenClaw 会在成功查询后附加四个 Claude
    模型，无论 `/v1/models` 返回什么：
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5`（Claude Sonnet 5）、
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7`（Claude Opus 4.7）和
    `amazon-bedrock-mantle/anthropic.claude-mythos-5`（Claude Mythos 5），以及
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview`（Claude Mythos
    Preview）。它们使用 `anthropic-messages` API 接口，并通过同一个使用持有者令牌进行身份验证的
    Anthropic 兼容端点（`<mantle-base>/anthropic`）进行流式传输，因此 AWS 持有者令牌不会被当作
    Anthropic API 密钥处理。

    Claude Sonnet 5 始终使用自适应思考，并且默认采用 `high`
    强度。`/think off` 和 `/think minimal` 会映射为 `low`，因为 Mantle
    路由无法禁用思考。OpenClaw 还会在 Sonnet 5 请求中省略自定义温度参数。

    Claude Mythos 5 仅限受限访问。它提供 1,000,000-token 的上下文
    窗口和 128,000-token 的输出限制，始终使用自适应思考，将
    `/think off` 和 `/think minimal` 映射为 `low`，并省略调用方选择的
    采样参数。

    Claude Mythos Preview 始终请求推理；未设置 `/think` 级别时，默认采用 `high`
    强度（将 `xhigh`/`max` 向下映射为 `high`，将 `minimal` 向上映射为
    `low`）。Mantle 上的 Opus 4.7 以流式方式运行，但不提供模型生成的推理，
    并且 OpenClaw 会省略其 `temperature` 参数，因为 Opus 4.7 在此路由上
    不接受采样覆盖；Mythos Preview 可正常接受 `temperature` 覆盖。

    非空的显式 `models.providers["amazon-bedrock-mantle"].models`
    列表会替换完整的已发现目录。如果你需要这些内置 Claude 条目，请省略该列表。

  </Accordion>

  <Accordion title="与 Amazon Bedrock 提供商的关系">
    Bedrock Mantle 是与标准 [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商不同的独立提供商。
    Mantle 为其 OSS 目录使用 OpenAI 兼容的 `/v1` 接口，而标准
    Bedrock 提供商使用原生 Bedrock Converse API。

    如果存在 `AWS_BEARER_TOKEN_BEDROCK` 凭证，两个提供商会共享该凭证。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/zh-CN/providers/bedrock" icon="cloud">
    面向 Anthropic Claude、Titan 和其他模型的原生 Bedrock 提供商。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证详情和凭证复用规则。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
