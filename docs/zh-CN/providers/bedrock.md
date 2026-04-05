---
read_when:
    - 你想在 OpenClaw 中使用 Amazon Bedrock 模型
    - 你需要为模型调用设置 AWS 凭证/区域
summary: 在 OpenClaw 中使用 Amazon Bedrock（Converse API）模型
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T10:06:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b18be460d01b66b3b3402e4f00b544850b0c393a0c067e6604f04de78f1b896
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw 可以通过 pi‑ai 的 **Bedrock Converse** 流式提供商使用 **Amazon Bedrock** 模型。Bedrock 鉴权使用 **AWS SDK 默认凭证链**，而不是 API 密钥。

## pi-ai 支持的内容

- 提供商：`amazon-bedrock`
- API：`bedrock-converse-stream`
- 鉴权：AWS 凭证（环境变量、共享配置或实例角色）
- 区域：`AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认：`us-east-1`）

## 自动模型发现

OpenClaw 可以自动发现支持 **流式传输** 和 **文本输出** 的 Bedrock 模型。发现功能使用 `bedrock:ListFoundationModels`，并且会被缓存（默认：1 小时）。

隐式提供商的启用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 为 `true`，即使没有 AWS 环境变量标记，OpenClaw 也会尝试进行发现。
- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 未设置，OpenClaw 只有在看到以下 AWS 鉴权标记之一时，才会自动添加隐式 Bedrock 提供商：
  `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`，或 `AWS_PROFILE`。
- 实际的 Bedrock 运行时鉴权路径仍然使用 AWS SDK 默认链，因此即使发现功能需要通过 `enabled: true` 显式启用，共享配置、SSO 和 IMDS 实例角色鉴权仍然可以工作。

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

说明：

- `enabled` 默认为自动模式。在自动模式下，OpenClaw 只有在看到受支持的 AWS 环境变量标记时，才会启用隐式 Bedrock 提供商。
- `region` 默认取 `AWS_REGION` 或 `AWS_DEFAULT_REGION`，然后回退到 `us-east-1`。
- `providerFilter` 匹配 Bedrock 提供商名称（例如 `anthropic`）。
- `refreshInterval` 的单位是秒；设为 `0` 可禁用缓存。
- `defaultContextWindow`（默认：`32000`）和 `defaultMaxTokens`（默认：`4096`）用于发现到的模型（如果你知道模型限制，可以覆盖它们）。
- 对于显式的 `models.providers["amazon-bedrock"]` 条目，OpenClaw 仍然可以通过 `AWS_BEARER_TOKEN_BEDROCK` 之类的 AWS 环境变量标记，提前解析 Bedrock 环境变量标记鉴权，而无需强制加载完整运行时鉴权。实际的模型调用鉴权路径仍然使用 AWS SDK 默认链。

## 新手引导

1. 确保 **Gateway 网关主机** 上可用 AWS 凭证：

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# 可选：
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# 可选（Bedrock API 密钥/bearer token）：
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. 在你的配置中添加 Bedrock 提供商和模型（不需要 `apiKey`）：

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

## EC2 实例角色

当 OpenClaw 运行在附加了 IAM 角色的 EC2 实例上时，AWS SDK 可以使用实例元数据服务（IMDS）进行身份验证。对于 Bedrock 模型发现，除非你显式设置
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`，否则 OpenClaw 只会根据 AWS 环境变量标记自动启用隐式提供商。

针对由 IMDS 支持的主机，推荐设置如下：

- 将 `plugins.entries.amazon-bedrock.config.discovery.enabled` 设为 `true`。
- 设置 `plugins.entries.amazon-bedrock.config.discovery.region`（或导出 `AWS_REGION`）。
- **不**需要伪造的 API 密钥。
- 只有当你明确希望为自动模式或状态界面提供环境变量标记时，才需要 `AWS_PROFILE=default`。

```bash
# 推荐：显式启用发现功能并设置区域
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 可选：如果你希望在不显式启用的情况下使用自动模式，可添加环境变量标记
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

EC2 实例角色所需的 **IAM 权限**：

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels`（用于自动发现）

或者附加托管策略 `AmazonBedrockFullAccess`。

## 快速设置（AWS 路径）

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

# 3. 在 EC2 实例上显式启用发现功能
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 可选：如果你希望在不显式启用的情况下使用自动模式，可添加环境变量标记
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. 验证模型已被发现
openclaw models list
```

## 说明

- Bedrock 要求在你的 AWS 账号/区域中启用 **模型访问**。
- 自动发现需要 `bedrock:ListFoundationModels` 权限。
- 如果你依赖自动模式，请在 Gateway 网关主机上设置受支持的 AWS 鉴权环境变量标记之一。如果你更倾向于使用不带环境变量标记的 IMDS/共享配置鉴权，请设置
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
- OpenClaw 会按以下顺序显示凭证来源：`AWS_BEARER_TOKEN_BEDROCK`，
  然后是 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，再然后是 `AWS_PROFILE`，最后是默认 AWS SDK 链。
- 推理支持取决于模型；请查看 Bedrock 模型卡片以获取当前能力。
- 如果你更喜欢托管密钥流程，也可以在 Bedrock 前面放置一个 OpenAI 兼容代理，并将其配置为 OpenAI 提供商。

## Guardrails

你可以通过向 `amazon-bedrock` 插件配置中添加 `guardrail` 对象，将 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
应用到所有 Bedrock 模型调用。Guardrails 允许你强制执行内容过滤、主题拒绝、词语过滤、敏感信息过滤和上下文基础校验。

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

- `guardrailIdentifier`（必填）接受一个 guardrail ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。
- `guardrailVersion`（必填）指定要使用的已发布版本，或者使用 `"DRAFT"` 表示工作草稿。
- `streamProcessingMode`（可选）控制在流式传输期间，guardrail 评估是同步运行（`"sync"`）还是异步运行（`"async"`）。如果省略，Bedrock 会使用其默认行为。
- `trace`（可选）在 API 响应中启用 guardrail 跟踪输出。调试时设为 `"enabled"` 或 `"enabled_full"`；在生产环境中省略或设为 `"disabled"`。

Gateway 网关使用的 IAM 主体除了标准调用权限外，还必须具有 `bedrock:ApplyGuardrail` 权限。
