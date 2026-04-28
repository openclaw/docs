---
read_when:
    - 你想要在 OpenClaw 中使用 Amazon Bedrock 模型
    - 你需要为模型调用配置 AWS 凭证/区域设置
summary: 在 OpenClaw 中使用 Amazon Bedrock（Converse API）模型
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-28T20:43:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw 可以通过 pi-ai 的 **Bedrock Converse** 流式 provider 使用 **Amazon Bedrock** 模型。Bedrock 凭证使用 **AWS SDK 默认凭证链**，而不是 API key。

| 属性 | 值                                                       |
| -------- | ----------------------------------------------------------- |
| provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| 凭证     | AWS 凭证（环境变量、共享配置或实例角色） |
| 区域   | `AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认：`us-east-1`） |

## 入门指南

选择你偏好的凭证方法，并按照设置步骤操作。

<Tabs>
  <Tab title="访问密钥 / 环境变量">
    **最适合：**开发者机器、CI，或由你直接管理 AWS 凭证的主机。

    <Steps>
      <Step title="在 Gateway 网关主机上设置 AWS 凭证">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="将 Bedrock provider 和模型添加到你的配置">
        不需要 `apiKey`。使用 `auth: "aws-sdk"` 配置 provider：

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
    使用环境标记凭证（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE` 或 `AWS_BEARER_TOKEN_BEDROCK`）时，OpenClaw 会自动启用隐式 Bedrock provider 以进行模型发现，无需额外配置。
    </Tip>

  </Tab>

  <Tab title="EC2 实例角色（IMDS）">
    **最适合：**附加了 IAM 角色并使用实例元数据服务进行身份验证的 EC2 实例。

    <Steps>
      <Step title="显式启用发现">
        使用 IMDS 时，OpenClaw 无法仅通过环境标记检测 AWS 凭证，因此你必须选择启用：

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
      <Step title="验证模型是否已发现">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    附加到你的 EC2 实例的 IAM 角色必须具备以下权限：

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（用于自动发现）
    - `bedrock:ListInferenceProfiles`（用于推理配置文件发现）

    或附加托管策略 `AmazonBedrockFullAccess`。
    </Warning>

    <Note>
    只有在你明确希望为自动模式或 Status 界面提供环境标记时，才需要 `AWS_PROFILE=default`。实际的 Bedrock 运行时凭证路径使用 AWS SDK 默认链，因此即使没有环境标记，IMDS 实例角色凭证也可以工作。
    </Note>

  </Tab>
</Tabs>

## 自动模型发现

OpenClaw 可以自动发现支持**流式传输**和**文本输出**的 Bedrock 模型。发现过程使用 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`，并会缓存结果（默认：1 小时）。

隐式 provider 的启用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 为 `true`，即使没有 AWS 环境标记，OpenClaw 也会尝试发现。
- 如果未设置 `plugins.entries.amazon-bedrock.config.discovery.enabled`，OpenClaw 只会在看到以下 AWS 凭证标记之一时自动添加隐式 Bedrock provider：`AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，或 `AWS_PROFILE`。
- 实际的 Bedrock 运行时凭证路径仍使用 AWS SDK 默认链，因此共享配置、SSO 和 IMDS 实例角色凭证可以工作，即使发现过程需要 `enabled: true` 才能选择启用。

<Note>
对于显式的 `models.providers["amazon-bedrock"]` 条目，OpenClaw 仍可以从 AWS 环境标记（例如 `AWS_BEARER_TOKEN_BEDROCK`）提前解析 Bedrock 环境标记凭证，而无需强制加载完整运行时凭证。实际的模型调用凭证路径仍使用 AWS SDK 默认链。
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

    | 选项 | 默认值 | 说明 |
    | ------ | ------- | ----------- |
    | `enabled` | auto | 在自动模式下，OpenClaw 只有在看到受支持的 AWS 环境标记时才启用隐式 Bedrock provider。设为 `true` 可强制发现。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 用于发现 API 调用的 AWS 区域。 |
    | `providerFilter` |（全部）| 匹配 Bedrock provider 名称（例如 `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | 缓存时长，以秒为单位。设为 `0` 可禁用缓存。 |
    | `defaultContextWindow` | `32000` | 用于已发现模型的上下文窗口（如果你知道模型限制，可覆盖）。 |
    | `defaultMaxTokens` | `4096` | 用于已发现模型的最大输出 token 数（如果你知道模型限制，可覆盖）。 |

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
    OpenClaw 会在发现 foundation models 的同时发现**区域和全局推理配置文件**。当某个配置文件映射到已知 foundation model 时，该配置文件会继承该模型的能力（上下文窗口、最大 token 数、reasoning、vision），并自动注入正确的 Bedrock 请求区域。这意味着跨区域 Claude 配置文件无需手动 provider 覆盖即可工作。

    推理配置文件 ID 形如 `us.anthropic.claude-opus-4-6-v1:0`（区域）或 `anthropic.claude-opus-4-6-v1:0`（全局）。如果底层模型已在发现结果中，配置文件会继承它的完整能力集；否则会应用安全默认值。

    不需要额外配置。只要启用了发现，并且 IAM 主体具有 `bedrock:ListInferenceProfiles`，配置文件就会与 foundation models 一起显示在 `openclaw models list` 中。

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock 会拒绝 Claude Opus 4.7 的 `temperature` 参数。OpenClaw 会为任何 Opus 4.7 Bedrock 引用自动省略 `temperature`，包括 foundation model ID、命名推理配置文件、其底层模型通过 `bedrock:GetInferenceProfile` 解析为 Opus 4.7 的应用推理配置文件，以及带可选区域前缀（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、`global.`）的点分 `opus-4.7` 变体。无需配置开关，并且该省略同时适用于请求选项对象和 `inferenceConfig` 载荷字段。
  </Accordion>

  <Accordion title="Guardrails">
    你可以通过向 `amazon-bedrock` 插件配置添加 `guardrail` 对象，将 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) 应用于所有 Bedrock 模型调用。Guardrails 可让你强制执行内容过滤、主题拒绝、词语过滤、敏感信息过滤和上下文 grounding 检查。

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

    | 选项 | 必需 | 说明 |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | 是 | Guardrail ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 是 | 已发布版本号，或表示工作草稿的 `"DRAFT"`。 |
    | `streamProcessingMode` | 否 | 流式传输期间进行 guardrail 评估时使用 `"sync"` 或 `"async"`。如果省略，Bedrock 使用其默认值。 |
    | `trace` | 否 | 用于调试的 `"enabled"` 或 `"enabled_full"`；生产环境中省略或设为 `"disabled"`。 |

    <Warning>
    Gateway 网关使用的 IAM 主体除了标准调用权限外，还必须具有 `bedrock:ApplyGuardrail` 权限。
    </Warning>

  </Accordion>

  <Accordion title="用于记忆搜索的嵌入">
    Bedrock 也可以作为
    [记忆搜索](/zh-CN/concepts/memory-search) 的嵌入提供商。这与
    推理提供商分开配置 -- 将 `agents.defaults.memorySearch.provider` 设置为 `"bedrock"`：

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
    角色、SSO、访问密钥、共享配置和 Web 身份）。不需要 API 密钥。
    当 `provider` 为 `"auto"` 时，如果该凭证链成功解析，
    Bedrock 会被自动检测到。

    支持的嵌入模型包括 Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）和 TwelveLabs Marengo。请参阅
    [记忆配置参考 -- Bedrock](/zh-CN/reference/memory-config#bedrock-embedding-config)
    获取完整模型列表和维度选项。

  </Accordion>

  <Accordion title="注意事项和限制">
    - Bedrock 需要在你的 AWS 账户/区域中启用**模型访问权限**。
    - 自动发现需要 `bedrock:ListFoundationModels` 和
      `bedrock:ListInferenceProfiles` 权限。
    - 如果你依赖自动模式，请在 Gateway 网关主机上设置一个受支持的 AWS 认证环境变量标记。
      如果你更偏好不使用环境变量标记的 IMDS/共享配置认证，请设置
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
    - OpenClaw 按此顺序显示凭证来源：`AWS_BEARER_TOKEN_BEDROCK`，
      然后是 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，然后是 `AWS_PROFILE`，再然后是
      默认 AWS SDK 链。
    - 推理支持取决于模型；请查看 Bedrock 模型卡以了解
      当前能力。
    - 如果你更偏好托管密钥流程，也可以在 Bedrock 前面放置一个 OpenAI 兼容
      代理，并将其配置为 OpenAI provider。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="记忆搜索" href="/zh-CN/concepts/memory-search" icon="magnifying-glass">
    用于记忆搜索配置的 Bedrock 嵌入。
  </Card>
  <Card title="记忆配置参考" href="/zh-CN/reference/memory-config#bedrock-embedding-config" icon="database">
    完整的 Bedrock 嵌入模型列表和维度选项。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排除和常见问题。
  </Card>
</CardGroup>
