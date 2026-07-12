---
read_when:
    - 你想要配置 `qwen-oauth` 提供商 ID
    - 你之前使用了 Qwen Portal OAuth 凭据
    - 你需要 Qwen Portal 端点或迁移指南
summary: 在 OpenClaw 中使用 Qwen Portal 提供商 ID
title: Qwen OAuth / 门户
x-i18n:
    generated_at: "2026-07-11T20:53:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` 是 Qwen Portal 的提供商 ID，由 Qwen 插件
（`@openclaw/qwen-provider`）注册。它面向位于
`https://portal.qwen.ai/v1` 的 Qwen Portal 端点，并通过独立于规范 `qwen`
提供商的提供商 ID，使旧版 Qwen OAuth / Portal 设置仍可访问。

如果你已经有可用的 Qwen Portal 令牌、正在迁移旧版 Qwen OAuth 或 Qwen CLI
工作流，或者需要专门测试 Qwen Portal 端点，请选择 `qwen-oauth`。对于新设置，
建议使用带有标准 ModelStudio 端点的 [Qwen](/zh-CN/providers/qwen)：它涵盖新的
API 密钥设置、更广泛的端点选择、标准按量付费、Coding Plan，以及完整的
Qwen 插件模型目录。

## 设置

如果尚未安装 Qwen 插件，请先安装：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

通过新手引导提供你的 Portal 令牌：

```bash
openclaw onboard --auth-choice qwen-oauth
```

非交互式运行从 `--qwen-oauth-token <token>` 读取令牌，或者设置：

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

新手引导会将令牌存储在 `qwen-oauth` 身份验证配置文件下，初始化 Portal
模型目录，并在未配置模型时将 `qwen-oauth/qwen3.5-plus` 设为默认模型。

## 默认值

- 提供商：`qwen-oauth`
- 别名：`qwen-portal`、`qwen-cli`
- 基础 URL：`https://portal.qwen.ai/v1`
- 环境变量：`QWEN_API_KEY`
- API 风格：兼容 OpenAI
- 默认模型：`qwen-oauth/qwen3.5-plus`

## 与 Qwen 的区别

OpenClaw 有两个面向 Qwen 的提供商 ID：

| 提供商       | 端点系列                                                 | 最适合                                                                                 |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope 和 Coding Plan 端点       | 新 API 密钥设置、标准按量付费、Coding Plan、DashScope 多模态功能                       |
| `qwen-oauth` | 位于 `portal.qwen.ai/v1` 的 Qwen Portal 端点             | 现有 Qwen Portal 令牌和旧版 Qwen OAuth / CLI 设置                                      |

两个提供商都使用兼容 OpenAI 的请求格式，但它们是彼此独立的身份验证入口。
为 `qwen-oauth` 存储的令牌不应被视为 DashScope 或 ModelStudio 密钥；新的
DashScope 密钥应改用规范的 `qwen` 提供商。

## 模型

Qwen 插件会为 Qwen Portal 端点初始化以下静态模型目录。所有条目的最大输出均为
65,536 个令牌；可用性取决于当前的 Qwen Portal 账户和令牌。

| 模型引用                          | 输入         | 上下文    | 备注     |
| --------------------------------- | ------------ | --------- | -------- |
| `qwen-oauth/qwen3.5-plus`         | 文本、图像   | 1,000,000 | 默认模型 |
| `qwen-oauth/qwen3.6-plus`         | 文本、图像   | 1,000,000 |          |
| `qwen-oauth/qwen3-max-2026-01-23` | 文本         | 262,144   |          |
| `qwen-oauth/qwen3-coder-next`     | 文本         | 262,144   |          |
| `qwen-oauth/qwen3-coder-plus`     | 文本         | 1,000,000 |          |
| `qwen-oauth/MiniMax-M2.5`         | 文本         | 1,000,000 | 推理     |
| `qwen-oauth/glm-5`                | 文本         | 202,752   |          |
| `qwen-oauth/glm-4.7`              | 文本         | 202,752   |          |
| `qwen-oauth/kimi-k2.5`            | 文本、图像   | 262,144   |          |

如果你的账户改用 ModelStudio / DashScope API 密钥，请配置规范的 `qwen`
提供商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## 迁移

旧版 Qwen Portal OAuth 配置文件无法刷新；`openclaw doctor` 会标记它们。
如果 Portal 配置文件停止工作，请使用当前令牌重新运行新手引导，或切换到标准
Qwen 提供商：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

标准全球版 ModelStudio 使用：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 故障排查

- Portal OAuth 刷新失败：旧版 Qwen Portal OAuth 配置文件无法刷新。请使用当前
  令牌重新运行新手引导。
- 端点错误：使用 Portal 令牌时，请确认模型引用以 `qwen-oauth/` 开头。
  仅对规范的 Qwen 提供商使用 `qwen/` 引用。
- `QWEN_API_KEY` 混淆：两个 Qwen 页面都提到了此环境变量，但新手引导会将凭据
  存储在所选提供商 ID 下。如果你要在同一台机器上同时保留 `qwen` 和
  `qwen-oauth`，建议使用新手引导。

## 相关内容

- [Qwen](/zh-CN/providers/qwen)
- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
