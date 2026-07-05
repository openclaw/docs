---
read_when:
    - 你想将 Amazon Bedrock 模型与 OpenClaw 搭配使用
    - 你需要为模型调用设置 AWS 凭证和区域
summary: 将 Amazon Bedrock（Converse API）模型与 OpenClaw 搭配使用
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-05T11:36:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83b0be40d8c0fd6283c8cd8ce271b9fb2fd0e7402c12f783ead69e1c3779eb8c
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw 可以通过其 **Bedrock Converse** 流式提供商使用 **Amazon Bedrock** 模型。Bedrock 凭证使用 **AWS SDK 默认凭证链**，而不是 API key。

| 属性 | 值                                                       |
| -------- | ----------------------------------------------------------- |
| 提供商 | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| 凭证     | AWS 凭证（环境变量、共享配置或实例角色） |
| 区域   | `AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认：`us-east-1`） |

## 入门指南

选择你偏好的凭证方法并按照设置步骤操作。

<Tabs>
  <Tab title="访问密钥 / 环境变量">
    **最适合：**开发者机器、CI，或你直接管理 AWS 凭证的主机。

    <Steps>
      <Step title="在 Gateway 网关主机上设置 AWS 凭证">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="将 Bedrock 提供商和模型添加到你的配置">
        不需要 `apiKey`。使用 `auth: "aws-sdk"` 配置提供商：

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    使用环境标记凭证（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE` 或 `AWS_BEARER_TOKEN_BEDROCK`）时，OpenClaw 会自动启用隐式 Bedrock 提供商，用于模型发现，无需额外配置。
    </Tip>

  </Tab>

  <Tab title="EC2 实例角色（IMDS）">
    **最适合：**已附加 IAM 角色，并使用实例元数据服务进行身份验证的 EC2 实例。

    <Steps>
      <Step title="显式启用发现">
        使用 IMDS 时，OpenClaw 无法仅从环境标记检测 AWS 凭证，因此你必须选择启用：

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="可选：为自动模式添加环境标记">
        如果你还希望环境标记自动检测路径生效（例如用于 `openclaw status` 界面）：

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        你**不**需要伪造 API key。
      </Step>
      <Step title="验证模型已被发现">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    附加到你的 EC2 实例的 IAM 角色必须拥有以下权限：

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（用于自动发现）
    - `bedrock:ListInferenceProfiles`（用于推理配置文件发现）

    或附加托管策略 `AmazonBedrockFullAccess`。
    </Warning>

    <Note>
    只有当你明确希望为自动模式或状态界面提供环境标记时，才需要 `AWS_PROFILE=default`。实际的 Bedrock 运行时凭证路径使用 AWS SDK 默认链，因此即使没有环境标记，IMDS 实例角色凭证也能工作。
    </Note>

  </Tab>
</Tabs>

## 自动模型发现

OpenClaw 可以自动发现支持**流式传输**和**文本输出**的 Bedrock 模型。发现使用 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`，结果会被缓存（默认：1 小时）。

隐式提供商的启用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 为 `true`，即使不存在 AWS 环境标记，OpenClaw 也会尝试发现。
- 如果未设置 `plugins.entries.amazon-bedrock.config.discovery.enabled`，OpenClaw 只会在看到以下 AWS 凭证标记之一时自动添加隐式 Bedrock 提供商：`AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，或 `AWS_PROFILE`。
- 实际的 Bedrock 运行时凭证路径仍使用 AWS SDK 默认链，因此即使发现需要 `enabled: true` 来选择启用，共享配置、SSO 和 IMDS 实例角色凭证也可以工作。

<Note>
对于显式的 `models.providers["amazon-bedrock"]` 条目，OpenClaw 仍然可以从 AWS 环境标记（如 `AWS_BEARER_TOKEN_BEDROCK`）提前解析 Bedrock 环境标记凭证，而无需强制加载完整运行时凭证。实际的模型调用凭证路径仍使用 AWS SDK 默认链。
</Note>

<AccordionGroup>
  <Accordion title="发现配置选项">
    配置选项位于 `plugins.entries.amazon-bedrock.config.discovery` 下：

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | 选项 | 默认值 | 描述 |
    | ------ | ------- | ----------- |
    | `enabled` | auto | 在自动模式下，OpenClaw 只有在看到受支持的 AWS 环境标记时才会启用隐式 Bedrock 提供商。设置为 `true` 可强制发现。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 用于发现 API 调用的 AWS 区域。 |
    | `providerFilter` |（全部）| 匹配 Bedrock 提供商名称（例如 `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | 缓存持续时间，单位为秒。设置为 `0` 可禁用缓存。 |
    | `defaultContextWindow` | `32000` | 用于没有已知 token 限制的已发现模型的上下文窗口（如果你知道自己的模型限制，请覆盖）。 |
    | `defaultMaxTokens` | `4096` | 用于没有已知 token 限制的已发现模型的最大输出 token 数（如果你知道自己的模型限制，请覆盖）。 |

  </Accordion>

  <Accordion title="上下文窗口和最大 token 限制">
    Bedrock `ListFoundationModels` 和 `GetFoundationModel` API 不返回 token 限制元数据，只返回模型 ID、名称、模态和生命周期状态。OpenClaw 内置了一张查找表，包含热门 Bedrock 模型（Claude、Nova、Llama、Mistral、DeepSeek 等）的已知上下文窗口和输出限制，因此这些模型的会话管理、压缩阈值和上下文溢出检测可以正确工作。

    不在表中的已发现模型会回退到 `defaultContextWindow` 和 `defaultMaxTokens`。如果你使用的模型缺少准确限制，请使用显式的 `models.providers["amazon-bedrock"].models` 条目覆盖它。

  </Accordion>
</AccordionGroup>

## 快速设置（AWS 路径）

本演练会创建 IAM 角色、附加 Bedrock 权限、关联实例配置文件，并在 EC2 主机上启用 OpenClaw 发现。

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## 高级配置

<AccordionGroup>
  <Accordion title="推理配置文件">
    OpenClaw 会在基础模型旁发现**区域和全局推理配置文件**。当配置文件映射到已知基础模型时，该配置文件会继承该模型的能力（上下文窗口、最大 token、推理、视觉），并会自动注入正确的 Bedrock 请求区域。这意味着跨区域 Claude 配置文件无需手动覆盖提供商即可工作。全局跨区域配置文件（`global.*`）会在 `openclaw models list` 中排在最前，因为它们通常提供更好的容量和自动故障转移。

    推理配置文件 ID 类似于 `us.anthropic.claude-opus-4-6-v1:0`（区域）或 `anthropic.claude-opus-4-6-v1:0`（全局）。如果底层模型已在发现结果中，该配置文件会继承其完整能力集；否则会应用安全默认值。

    无需额外配置。只要启用了发现，并且 IAM 主体拥有 `bedrock:ListInferenceProfiles`，配置文件就会和基础模型一起出现在 `openclaw models list` 中。

  </Accordion>

  <Accordion title="服务层级">
    某些 Bedrock 模型支持 `service_tier` 参数，用于优化成本或延迟。可用层级如下：

    | 层级 | 描述 |
    |------|-------------|
    | `default` | 标准 Bedrock 层级 |
    | `flex` | 面向可容忍更长延迟的工作负载的折扣处理 |
    | `priority` | 面向延迟敏感工作负载的优先处理 |
    | `reserved` | 面向稳态工作负载的预留容量 |

    通过 `agents.defaults.params` 为 Bedrock 模型请求设置 `serviceTier`（或 `service_tier`），或在 `agents.defaults.models["<model-key>"].params` 中按模型设置：

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    有效值为 `default`、`flex`、`priority` 和 `reserved`。Claude
    Fable 5 仅支持 `default` 层级；如果为该模型请求
    `flex`、`priority` 或 `reserved`，OpenClaw 会发出警告并忽略。
    对于其他模型，并非每个模型都支持每个层级；不受支持的层级
    会返回 Bedrock 验证错误，并且错误消息可能具有误导性
    （例如显示 “The provided model identifier is invalid”，
    而不是指出层级才是问题）。如果你看到此错误，请检查
    该模型是否支持请求的层级。

  </Accordion>

  <Accordion title="Claude Opus 4.7 和 4.8 temperature">
    Bedrock 会拒绝 Claude Opus 4.7 和 Opus
    4.8 的 `temperature` 参数。OpenClaw 会自动为任何匹配的 Bedrock
    ref 省略 `temperature`，包括基础模型 ID、具名推理配置文件、
    其底层模型通过 `bedrock:GetInferenceProfile` 解析为 Opus 4.7/4.8 的应用推理配置文件，
    以及带可选区域前缀（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、
    `global.`）的点分 `opus-4.7`/`opus-4.8` 变体。
    不需要配置开关，并且该省略同时适用于请求选项对象和
    `inferenceConfig` 负载字段。
  </Accordion>

  <Accordion title="Claude Fable 5">
    在 `us-east-1` 中使用 `amazon-bedrock/anthropic.claude-fable-5`，或使用
    `us.anthropic.claude-fable-5` 等区域推理 ID。
    OpenClaw 会应用 Fable 的 1M 上下文窗口、128K 输出限制、始终开启的
    adaptive thinking，以及受支持的 effort 映射。`/think off` 和
    `/think minimal` 会映射到 `low`；temperature 和强制工具选择控件
    会被省略，与 Opus 4.7/4.8 路由一致。流式输出会被保留，
    直到 Bedrock 返回终止状态，以免中途拒绝时暴露部分文本。

    AWS 要求在 Fable 可用之前显式选择加入 `provider_data_share` 数据保留。
    提示词和补全会与 Anthropic 共享，并最多保留 30 天用于信任与安全。
    启用该模型前，请查看并配置
    [Bedrock 数据保留](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)。

  </Accordion>

  <Accordion title="Guardrails">
    你可以通过向 `amazon-bedrock` 插件配置添加 `guardrail` 对象，
    将 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    应用于所有 Bedrock 模型调用。Guardrails 可让你强制执行内容过滤、
    主题拒绝、词语过滤、敏感信息过滤和上下文 grounding 检查。

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier` 和 `guardrailVersion` 是必填项。

    | 选项 | 说明 |
    | ------ | ----------- |
    | `guardrailIdentifier` | Guardrail ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 已发布的版本号，或用于工作草稿的 `"DRAFT"`。 |
    | `streamProcessingMode` | 用于流式传输期间 guardrail 评估的 `"sync"` 或 `"async"`。如果省略，Bedrock 会使用其默认值。 |
    | `trace` | 用于调试的 `"enabled"` 或 `"enabled_full"`；生产环境中请省略或设置为 `"disabled"`。 |

    <Warning>
    Gateway 网关使用的 IAM 主体除标准调用权限外，还必须具有 `bedrock:ApplyGuardrail` 权限。
    </Warning>

  </Accordion>

  <Accordion title="用于记忆搜索的嵌入">
    Bedrock 也可以作为
    [记忆搜索](/zh-CN/concepts/memory-search)的嵌入提供商。它与推理提供商分开配置，请将
    `agents.defaults.memorySearch.provider` 设置为 `"bedrock"`：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Bedrock 嵌入使用与推理相同的 AWS SDK 凭证链（实例
    角色、SSO、访问密钥、共享配置和 Web identity）。不需要 API key。

    受支持的嵌入模型包括 Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）和 TwelveLabs Marengo。请参阅
    [记忆配置参考 -- Bedrock](/zh-CN/reference/memory-config#bedrock-embedding-config)
    了解完整模型列表和维度选项。

  </Accordion>

  <Accordion title="说明和注意事项">
    - Bedrock 要求你的 AWS 账户/区域中启用**模型访问**。
    - 自动设备发现需要 `bedrock:ListFoundationModels` 和
      `bedrock:ListInferenceProfiles` 权限。
    - 如果你依赖 auto 模式，请在 Gateway 网关主机上设置一个受支持的 AWS 认证环境变量标记。
      如果你偏好在没有环境变量标记的情况下使用 IMDS/共享配置认证，请设置
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
    - OpenClaw 会按以下顺序显示凭证来源：`AWS_BEARER_TOKEN_BEDROCK`，
      然后是 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，然后是 `AWS_PROFILE`，最后是
      默认 AWS SDK 链。
    - 推理支持取决于模型；请查看 Bedrock 模型卡以了解
      当前能力。
    - 如果你偏好托管式密钥流程，也可以在 Bedrock 前放置一个 OpenAI 兼容
      代理，并将其配置为 OpenAI provider。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 ref 和故障转移行为。
  </Card>
  <Card title="记忆搜索" href="/zh-CN/concepts/memory-search" icon="magnifying-glass">
    用于记忆搜索配置的 Bedrock 嵌入。
  </Card>
  <Card title="记忆配置参考" href="/zh-CN/reference/memory-config#bedrock-embedding-config" icon="database">
    完整的 Bedrock 嵌入模型列表和维度选项。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排查和常见问题。
  </Card>
</CardGroup>
