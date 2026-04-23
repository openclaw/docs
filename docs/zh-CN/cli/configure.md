---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认设置。
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-04-23T06:17:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

用于设置凭证、设备和智能体默认设置的交互式提示。

注意：**Model** 部分现在包含一个用于 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。
按提供商范围进行的设置选择会将其选中的模型合并到现有允许列表中，而不是替换配置中其他不相关提供商的条目。

当通过提供商认证选项启动 configure 时，默认模型和允许列表选择器会自动优先使用该提供商。对于成对的提供商（例如 Volcengine/BytePlus），相同的优先规则也会匹配它们的 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商过滤后会产生空列表，configure 会回退到未过滤的目录，而不是显示一个空白选择器。

提示：不带子命令的 `openclaw config` 会打开同一个向导。对非交互式编辑，请使用 `openclaw config get|set|unset`。

对于 web 搜索，`openclaw configure --section web` 可让你选择一个提供商并配置其凭证。某些提供商还会显示提供商特定的后续提示：

- **Grok** 可以提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY`，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认的 Kimi web-search 模型。

相关内容：

- Gateway 网关配置参考：[配置](/zh-CN/gateway/configuration)
- Config CLI：[配置](/zh-CN/cli/config)

## 选项

- `--section <section>`：可重复使用的部分过滤器

可用部分：

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

说明：

- 选择 Gateway 网关的运行位置时，始终会更新 `gateway.mode`。如果这就是你唯一需要的内容，可以不选择其他部分而直接选择“Continue”。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示你输入渠道/房间允许列表。你可以输入名称或 ID；向导会在可能的情况下将名称解析为 ID。
- 如果你运行 daemon 安装步骤，token 认证需要 token，并且 `gateway.auth.token` 由 SecretRef 管理，则 configure 会验证 SecretRef，但不会将解析后的明文 token 值持久化到 supervisor 服务环境元数据中。
- 如果 token 认证需要 token，而已配置的 token SecretRef 未解析，configure 会阻止 daemon 安装，并提供可执行的修复指导。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置，而 `gateway.auth.mode` 未设置，configure 会阻止 daemon 安装，直到显式设置 mode。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
