---
read_when:
    - 你想配置 qwen-oauth 提供商 ID
    - 你之前使用过 Qwen Portal OAuth 凭证
    - 你需要 Qwen Portal 端点或迁移指南
summary: 在 OpenClaw 中使用 Qwen Portal 提供商 ID
title: Qwen OAuth / 门户
x-i18n:
    generated_at: "2026-06-27T03:09:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` 是 Qwen Portal 提供商 ID。它面向 Qwen Portal 端点，并通过一个独立的提供商 ID，让较旧的 Qwen OAuth / portal 设置仍可寻址。

当你明确拥有用于 `https://portal.qwen.ai/v1` 的当前 Qwen Portal 令牌，或正在迁移较旧的 Qwen Portal / Qwen CLI 设置并希望将这些凭证与规范 Qwen Cloud 提供商分开时，请使用此提供商。对于新的 Qwen 用户，它不是推荐的首选项。

对于新的 Qwen Cloud 设置，除非你明确拥有当前 Qwen Portal 令牌，否则请优先使用带有 Standard ModelStudio 端点的 [Qwen](/zh-CN/providers/qwen)。

## 设置

通过新手引导提供你的 portal 令牌：

```bash
openclaw onboard --auth-choice qwen-oauth
```

或设置：

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## 默认值

- 提供商：`qwen-oauth`
- 别名：`qwen-portal`、`qwen-cli`
- 基础 URL：`https://portal.qwen.ai/v1`
- 环境变量：`QWEN_API_KEY`
- API 风格：兼容 OpenAI
- 默认模型：`qwen-oauth/qwen3.5-plus`

## 这与 Qwen 有何不同

OpenClaw 有两个面向 Qwen 的提供商 ID：

| 提供商       | 端点系列                                                 | 适用场景                                                                               |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope 和 Coding Plan 端点       | 新 API key 设置、Standard 按量付费、Coding Plan、多模态 DashScope 功能                 |
| `qwen-oauth` | 位于 `portal.qwen.ai/v1` 的 Qwen Portal 端点             | 现有 Qwen Portal 令牌和旧版 Qwen OAuth / CLI 设置                                      |

两个提供商都使用兼容 OpenAI 的请求形状，但它们是独立的凭证表面。为 `qwen-oauth` 存储的令牌不应被视为 DashScope 或 ModelStudio 密钥，新的 DashScope 密钥应改用规范的 `qwen` 提供商。

## 何时选择 Qwen OAuth / Portal

- 你已经有一个可用的 Qwen Portal 令牌。
- 你正在迁移到 OpenClaw 的提供商模型，同时保留旧版 Qwen OAuth 或 Qwen CLI 工作流。
- 你需要专门测试与 Qwen Portal 端点的兼容性。

对于新设置、更广泛的端点选择、Standard ModelStudio、Coding Plan，以及完整的 Qwen 插件目录，请选择 [Qwen](/zh-CN/providers/qwen)。

## 模型

Qwen 插件目录会植入 Qwen Portal 默认值：

- `qwen-oauth/qwen3.5-plus`

可用性取决于当前的 Qwen Portal 账户和令牌。如果你的账户改用 ModelStudio / DashScope API 密钥，请配置规范的 `qwen` 提供商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 迁移

旧版 Qwen Portal OAuth 配置文件可能无法刷新。如果 portal 配置文件停止工作，请使用当前令牌重新进行身份验证，或切换到 Standard Qwen 提供商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard 全球 ModelStudio 使用：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 故障排除

- Portal OAuth 刷新失败：旧版 Qwen Portal OAuth 配置文件可能无法刷新。请使用当前令牌重新运行新手引导。
- 端点错误：使用 portal 令牌时，确认模型引用以 `qwen-oauth/` 开头。仅对规范 Qwen 提供商使用 `qwen/` 引用。
- `QWEN_API_KEY` 混淆：两个 Qwen 页面都会提到此环境变量，但新手引导会将凭证存储在选定的提供商 ID 下。当你在同一台机器上同时保留 `qwen` 和 `qwen-oauth` 可用时，请优先使用新手引导。

## 相关

- [Qwen](/zh-CN/providers/qwen)
- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
