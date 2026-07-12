---
read_when:
    - 你想在 OpenClaw 中使用 Amazon Bedrock 模型
    - 你需要设置 AWS 凭证和区域才能调用模型
summary: 在 OpenClaw 中使用 Amazon Bedrock（Converse API）模型
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T14:41:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw 可以通过其 **Bedrock Converse** 流式提供商使用 **Amazon Bedrock** 模型。Bedrock 身份验证使用 **AWS SDK 默认凭证链**，而不是 API key。

| 属性 | 值                                                          |
| ---- | ----------------------------------------------------------- |
| 提供商 | `amazon-bedrock`                                            |
| API  | `bedrock-converse-stream`                                   |
| 身份验证 | AWS 凭证（环境变量、共享配置或实例角色）                    |
| 区域 | `AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认值：`us-east-1`） |

## 入门指南

选择你偏好的身份验证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="访问密钥 / 环境变量">
    **最适合：** 开发者计算机、CI，或由你直接管理 AWS 凭证的主机。

    <Steps>
      <Step title="在 Gateway 网关主机上设置 AWS 凭证">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # 可选：
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # 可选（Bedrock API key/持有者令牌）：
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="将 Bedrock 提供商和模型添加到配置中">
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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    使用环境变量标记进行身份验证时（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE` 或 `AWS_BEARER_TOKEN_BEDROCK`），OpenClaw 会自动启用隐式 Bedrock 提供商进行模型发现，无需额外配置。
    </Tip>

  </Tab>

  <Tab title="EC2 实例角色（IMDS）">
    **最适合：** 已附加 IAM 角色，并使用实例元数据服务进行身份验证的 EC2 实例。

    <Steps>
      <Step title="显式启用发现">
        使用 IMDS 时，OpenClaw 无法仅通过环境变量标记检测 AWS 身份验证，因此你必须显式启用：

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="可选：添加用于自动模式的环境变量标记">
        如果你还希望环境变量标记自动检测路径生效（例如用于 `openclaw status` 界面）：

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        你**不**需要虚假的 API key。
      </Step>
      <Step title="验证模型是否已被发现">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    附加到 EC2 实例的 IAM 角色必须具有以下权限：

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（用于自动发现）
    - `bedrock:ListInferenceProfiles`（用于推理配置文件发现）

    或附加托管策略 `AmazonBedrockFullAccess`。
    </Warning>

    <Note>
    只有当你明确需要用于自动模式或状态界面的环境变量标记时，才需要设置 `AWS_PROFILE=default`。实际的 Bedrock 运行时身份验证路径使用 AWS SDK 默认链，因此即使没有环境变量标记，IMDS 实例角色身份验证也能正常工作。
    </Note>

  </Tab>
</Tabs>

## 自动模型发现

OpenClaw 可以自动发现支持**流式传输**和**文本输出**的 Bedrock 模型。发现过程使用 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`，并缓存结果（默认：1 小时）。

隐式提供商的启用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 为 `true`，
  即使不存在 AWS 环境变量标记，OpenClaw 也会尝试执行发现。
- 如果未设置 `plugins.entries.amazon-bedrock.config.discovery.enabled`，
  OpenClaw 仅在检测到以下任一 AWS 身份验证标记时，才会自动添加
  隐式 Bedrock 提供商：
  `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` 或 `AWS_PROFILE`。
- 实际的 Bedrock 运行时身份验证路径仍使用 AWS SDK 默认链，因此即使发现过程
  需要通过 `enabled: true` 显式启用，共享配置、SSO 和 IMDS 实例角色身份验证
  仍然可以正常工作。

<Note>
对于显式的 `models.providers["amazon-bedrock"]` 条目，OpenClaw 仍可通过 `AWS_BEARER_TOKEN_BEDROCK` 等 AWS 环境变量标记提前解析 Bedrock 环境变量标记身份验证，而不强制加载完整的运行时身份验证。实际的模型调用身份验证路径仍使用 AWS SDK 默认链。
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
    | ---- | ------ | ---- |
    | `enabled` | 自动 | 在自动模式下，OpenClaw 仅在检测到受支持的 AWS 环境变量标记时启用隐式 Bedrock 提供商。设置为 `true` 可强制执行发现。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 用于发现 API 调用的 AWS 区域。 |
    | `providerFilter` | （全部） | 匹配 Bedrock 提供商名称（例如 `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | 缓存时长（秒）。设置为 `0` 可禁用缓存。 |
    | `defaultContextWindow` | `32000` | 用于没有已知令牌限制的已发现模型的上下文窗口（如果你知道模型限制，请覆盖此值）。 |
    | `defaultMaxTokens` | `4096` | 用于没有已知令牌限制的已发现模型的最大输出令牌数（如果你知道模型限制，请覆盖此值）。 |

  </Accordion>

  <Accordion title="上下文窗口和最大令牌限制">
    Bedrock `ListFoundationModels` 和 `GetFoundationModel` API 不返回
    令牌限制元数据，只返回模型 ID、名称、模态和生命周期状态。
    OpenClaw 内置了热门 Bedrock 模型（Claude、Nova、Llama、Mistral、DeepSeek
    等）的已知上下文窗口和输出限制查找表，以确保这些模型的会话管理、
    压缩阈值和上下文溢出检测正常工作。

    表中没有的已发现模型将回退到 `defaultContextWindow`
    和 `defaultMaxTokens`。如果你使用的模型缺少准确的限制，
    请通过显式的
    `models.providers["amazon-bedrock"].models` 条目覆盖它。

  </Accordion>
</AccordionGroup>

## 快速设置（AWS 路径）

此演练将创建 IAM 角色、附加 Bedrock 权限、关联实例配置文件，并在 EC2 主机上启用 OpenClaw 发现。

```bash
# 1. 创建 IAM 角色和实例配置文件
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

# 2. 附加到你的 EC2 实例
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. 在 EC2 实例上显式启用发现
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 可选：如果你希望无需显式启用即可使用自动模式，请添加环境变量标记
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. 验证模型是否已被发现
openclaw models list
```

## 高级配置

<AccordionGroup>
  <Accordion title="推理配置文件">
    OpenClaw 会在基础模型之外发现**区域和全局推理配置文件**。
    当配置文件映射到已知基础模型时，该配置文件会继承模型的能力
    （上下文窗口、最大令牌数、推理、视觉），并自动注入正确的 Bedrock
    请求区域。这意味着跨区域 Claude 配置文件无需手动覆盖提供商即可工作。
    全局跨区域配置文件（`global.*`）会首先列在 `openclaw models list` 中，
    因为它们通常能提供更好的容量和自动故障转移。

    推理配置文件 ID 的形式为 `us.anthropic.claude-opus-4-6-v1:0`（区域）
    或 `anthropic.claude-opus-4-6-v1:0`（全局）。如果后端模型已存在于
    发现结果中，配置文件会继承其完整能力集；否则将应用安全默认值。

    无需额外配置。只要启用了发现，并且 IAM 主体具有
    `bedrock:ListInferenceProfiles`，配置文件就会与基础模型一起显示在
    `openclaw models list` 中。

  </Accordion>

  <Accordion title="服务层级">
    某些 Bedrock 模型支持通过 `service_tier` 参数优化成本或延迟。
    可使用以下层级：

    | 层级 | 描述 |
    |------|------|
    | `default` | 标准 Bedrock 层级 |
    | `flex` | 为可容忍较长延迟的工作负载提供折扣处理 |
    | `priority` | 为延迟敏感型工作负载提供优先处理 |
    | `reserved` | 为稳态工作负载提供预留容量 |

    通过 `agents.defaults.params` 为 Bedrock 模型请求设置 `serviceTier`
    （或 `service_tier`），或在
    `agents.defaults.models["<model-key>"].params` 中为每个模型单独设置：

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // 应用于所有模型
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // 按模型覆盖
              },
            },
          },
        },
      },
    }
    ```

    有效值为 `default`、`flex`、`priority` 和 `reserved`。Claude
    Fable 5 和 Sonnet 5 仅支持 `default` 层级；如果为这些模型请求
    `flex`、`priority` 或 `reserved`，OpenClaw 会发出警告并忽略该请求。对于
    其他模型，并非每个模型都支持所有层级——不受支持的层级会
    返回 Bedrock 验证错误，而且错误消息可能具有
    误导性（例如显示“The provided model identifier is invalid”，
    而不是指出问题在于层级）。如果你看到此错误，请检查
    该模型是否支持所请求的层级。

  </Accordion>

  <Accordion title="Claude Opus 4.7 和 4.8 的 temperature">
    Bedrock 会拒绝 Claude Opus 4.7 和 Opus 4.8 的 `temperature` 参数。
    OpenClaw 会自动为所有匹配的 Bedrock ref 省略 `temperature`，
    包括基础模型 ID、命名推理配置文件、底层模型通过
    `bedrock:GetInferenceProfile` 解析为 Opus 4.7/4.8 的应用程序
    推理配置文件，以及带可选区域前缀（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、
    `global.`）的点分 `opus-4.7`/`opus-4.8` 变体。
    无需配置任何选项，并且请求选项对象和 `inferenceConfig`
    载荷字段都会应用此省略规则。
  </Accordion>

  <Accordion title="Claude Fable 5">
    在 `us-east-1` 中使用 `amazon-bedrock/anthropic.claude-fable-5`，或使用
    `us.anthropic.claude-fable-5` 等区域推理 ID。
    OpenClaw 会应用 Fable 的 1M 上下文窗口、128K 输出限制、始终启用的
    自适应思考和受支持的 effort 映射。`/think off` 和
    `/think minimal` 会映射为 `low`；temperature 和强制工具选择控制项
    会被省略，与 Opus 4.7/4.8 路由一致。流式输出会被暂存，
    直到 Bedrock 返回终止状态，因此流式传输中途的拒绝不会
    暴露部分文本。

    在 Fable 可用之前，AWS 要求通过显式 `provider_data_share`
    选择加入数据保留。提示词和补全内容会与 Anthropic 共享，
    并出于信任与安全目的保留最多 30 天。启用该模型之前，
    请查看并配置
    [Bedrock 数据保留](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)。

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 仅通过 Bedrock 向获得所需有限访问批准的
    账户提供。OpenClaw 可识别基础模型
    `anthropic.claude-mythos-5`，以及
    `us.anthropic.claude-mythos-5` 等区域或全局推理配置文件。

    OpenClaw 会应用 1,000,000-token 上下文窗口、128,000-token 输出
    限制、图像输入、提示词缓存、拒绝安全的流式传输和原生
    effort 级别。自适应思考始终启用：`/think off` 和
    `/think minimal` 会映射为 `low`，而 `xhigh` 和 `max` 仍然可用。
    自定义采样值和强制工具选择值会被省略。

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS 文档说明 Sonnet 5 同时适用于
    [`bedrock-runtime` 和 `bedrock-mantle` 端点](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)。
    OpenClaw 可识别 Bedrock 基础模型
    `anthropic.claude-sonnet-5`，以及
    `us.anthropic.claude-sonnet-5` 等区域或全局推理配置文件。它会应用
    1,000,000-token 上下文窗口、128,000-token 输出限制、图像输入、
    原生 effort 级别、提示词缓存和拒绝安全的流式传输。

    Bedrock 会为 Sonnet 5 保持启用自适应思考。OpenClaw 默认为
    `high`；由于此路由无法禁用思考，`/think off` 和 `/think minimal`
    会映射为 `low`。启用自适应思考时，会省略自定义 temperature
    和强制工具选择值。

  </Accordion>

  <Accordion title="防护机制">
    你可以通过向 `amazon-bedrock` 插件配置添加 `guardrail` 对象，
    将 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    应用于所有 Bedrock 模型调用。防护机制可用于强制执行内容过滤、
    主题拒绝、词语过滤、敏感信息过滤和上下文依据检查。

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // 防护机制 ID 或完整 ARN
                guardrailVersion: "1", // 版本号或 "DRAFT"
                streamProcessingMode: "sync", // 可选："sync" 或 "async"
                trace: "enabled", // 可选："enabled"、"disabled" 或 "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier` 和 `guardrailVersion` 是必需的。

    | 选项 | 描述 |
    | ------ | ----------- |
    | `guardrailIdentifier` | 防护机制 ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 已发布的版本号，或用于工作草稿的 `"DRAFT"`。 |
    | `streamProcessingMode` | 流式传输期间进行防护机制评估时使用 `"sync"` 或 `"async"`。如果省略，Bedrock 将使用其默认值。 |
    | `trace` | 调试时使用 `"enabled"` 或 `"enabled_full"`；生产环境中省略或设为 `"disabled"`。 |

    <Warning>
    Gateway 网关使用的 IAM 主体除了标准调用权限外，还必须具有 `bedrock:ApplyGuardrail` 权限。
    </Warning>

  </Accordion>

  <Accordion title="用于记忆搜索的嵌入">
    Bedrock 还可以作为
    [记忆搜索](/zh-CN/concepts/memory-search)的嵌入提供商。此配置与
    推理提供商分开——将 `agents.defaults.memorySearch.provider` 设为 `"bedrock"`：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // 默认值
          },
        },
      },
    }
    ```

    Bedrock 嵌入使用与推理相同的 AWS SDK 凭据链（实例
    角色、SSO、访问密钥、共享配置和 Web 身份）。无需 API key。

    支持的嵌入模型包括 Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）和 TwelveLabs Marengo。有关
    完整模型列表和维度选项，请参阅
    [记忆配置参考——Bedrock](/zh-CN/reference/memory-config#bedrock-embedding-config)。

  </Accordion>

  <Accordion title="说明和注意事项">
    - Bedrock 要求在你的 AWS 账户/区域中启用**模型访问权限**。
    - 自动发现需要 `bedrock:ListFoundationModels` 和
      `bedrock:ListInferenceProfiles` 权限。
    - 如果你依赖自动模式，请在 Gateway 网关主机上设置一个受支持的 AWS 身份验证环境变量标记。
      如果你倾向于使用不带环境变量标记的 IMDS/共享配置身份验证，请设置
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
    - OpenClaw 按以下顺序显示凭据来源：`AWS_BEARER_TOKEN_BEDROCK`，
      然后是 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，接着是 `AWS_PROFILE`，最后是
      默认 AWS SDK 链。
    - 推理支持取决于模型；请查看 Bedrock 模型卡了解
      当前能力。
    - 如果你倾向于使用托管密钥流程，也可以在 Bedrock 前放置一个 OpenAI 兼容
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
    常规故障排查和常见问题。
  </Card>
</CardGroup>
