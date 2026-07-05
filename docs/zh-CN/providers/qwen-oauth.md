---
read_when:
    - 你想配置 qwen-oauth 提供商 ID
    - 你之前使用过 Qwen Portal OAuth 凭证
    - 你需要 Qwen Portal 端点或迁移指导
summary: 将 Qwen Portal 提供商 ID 与 OpenClaw 配合使用
title: Qwen OAuth / 门户
x-i18n:
    generated_at: "2026-07-05T11:39:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` 是 Qwen Portal 提供商 ID，由 Qwen 插件
（`@openclaw/qwen-provider`）注册。它面向位于
`https://portal.qwen.ai/v1` 的 Qwen Portal 端点，并通过一个独立的提供商 ID 让较旧的 Qwen OAuth / portal 设置仍可寻址，与规范的 `qwen`
提供商分开。

如果你已经有可用的 Qwen Portal 令牌、正在迁移旧版 Qwen OAuth 或 Qwen CLI 工作流，或者需要专门测试 Qwen
Portal 端点，请选择 `qwen-oauth`。对于新设置，优先使用
[Qwen](/zh-CN/providers/qwen) 以及 Standard ModelStudio 端点：它覆盖新的
API key 设置、更广泛的端点选择、Standard 按量付费、Coding Plan
以及完整的 Qwen 插件目录。

## 设置

如果尚未安装 Qwen 插件，请先安装：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

通过新手引导提供你的 portal 令牌：

```bash
openclaw onboard --auth-choice qwen-oauth
```

非交互式运行会从 `--qwen-oauth-token <token>` 读取令牌，或者设置：

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

新手引导会把令牌存储在 `qwen-oauth` 凭证配置下，填充 portal
模型目录，并在未配置模型时将 `qwen-oauth/qwen3.5-plus` 设为默认模型。

## 默认值

- 提供商：`qwen-oauth`
- 别名：`qwen-portal`、`qwen-cli`
- 基础 URL：`https://portal.qwen.ai/v1`
- 环境变量：`QWEN_API_KEY`
- API 风格：OpenAI 兼容
- 默认模型：`qwen-oauth/qwen3.5-plus`

## 与 Qwen 的区别

OpenClaw 有两个面向 Qwen 的提供商 ID：

| 提供商       | 端点系列                                                 | 最适合                                                                                 |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope 和 Coding Plan 端点       | 新的 API key 设置、Standard 按量付费、Coding Plan、多模态 DashScope 功能              |
| `qwen-oauth` | 位于 `portal.qwen.ai/v1` 的 Qwen Portal 端点             | 现有 Qwen Portal 令牌和旧版 Qwen OAuth / CLI 设置                                     |

两个提供商都使用 OpenAI 兼容的请求形状，但它们是分开的凭证面。为 `qwen-oauth` 存储的令牌不应被视为 DashScope
或 ModelStudio 密钥，新的 DashScope 密钥则应改用规范的 `qwen`
提供商。

## 模型

Qwen 插件会为 Qwen Portal 端点填充这个静态目录。所有条目都使用 65,536 token 的最大输出；可用性取决于当前 Qwen
Portal 账号和令牌。

| 模型引用                          | 输入        | 上下文    | 备注     |
| --------------------------------- | ----------- | --------- | -------- |
| `qwen-oauth/qwen3.5-plus`         | 文本，图像  | 1,000,000 | 默认模型 |
| `qwen-oauth/qwen3.6-plus`         | 文本，图像  | 1,000,000 |          |
| `qwen-oauth/qwen3-max-2026-01-23` | 文本        | 262,144   |          |
| `qwen-oauth/qwen3-coder-next`     | 文本        | 262,144   |          |
| `qwen-oauth/qwen3-coder-plus`     | 文本        | 1,000,000 |          |
| `qwen-oauth/MiniMax-M2.5`         | 文本        | 1,000,000 | 推理     |
| `qwen-oauth/glm-5`                | 文本        | 202,752   |          |
| `qwen-oauth/glm-4.7`              | 文本        | 202,752   |          |
| `qwen-oauth/kimi-k2.5`            | 文本，图像  | 262,144   |          |

如果你的账号使用 ModelStudio / DashScope API 密钥，请改为配置规范的
`qwen` 提供商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 迁移

旧版 Qwen Portal OAuth 配置无法刷新；`openclaw doctor` 会标记它们。如果 portal 配置停止工作，请使用当前令牌重新运行新手引导，或切换到 Standard Qwen 提供商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard 全局 ModelStudio 使用：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 故障排查

- Portal OAuth 刷新失败：旧版 Qwen Portal OAuth 配置无法刷新。请使用当前令牌重新运行新手引导。
- 端点错误：使用 portal 令牌时，确认模型引用以 `qwen-oauth/` 开头。只有规范的 Qwen 提供商才使用 `qwen/` 引用。
- `QWEN_API_KEY` 混淆：两个 Qwen 页面都会提到这个环境变量，但新手引导会把凭据存储在所选的提供商 ID 下。当你在同一台机器上同时保留 `qwen` 和 `qwen-oauth` 时，优先使用新手引导。

## 相关

- [Qwen](/zh-CN/providers/qwen)
- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
