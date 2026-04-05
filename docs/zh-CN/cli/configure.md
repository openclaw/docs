---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: configure
x-i18n:
    generated_at: "2026-04-05T08:19:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

用于设置凭证、设备和智能体默认设置的交互式提示。

注意：**Model** 部分现在包含一个用于
`agents.defaults.models` 允许列表的多选项（也就是 `/model` 和模型选择器中显示的内容）。

当配置从某个提供商认证选项开始时，默认模型和允许列表选择器会自动优先显示该提供商。对于成对的提供商，例如 Volcengine/BytePlus（国际版），同样的偏好也会匹配它们的 coding-plan
变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商筛选会导致列表为空，配置会回退到未筛选的目录，而不是显示一个空白选择器。

提示：不带子命令的 `openclaw config` 会打开同一个向导。对非交互式编辑，请使用
`openclaw config get|set|unset`。

对于 Web 搜索，`openclaw configure --section web` 会让你选择一个提供商并配置其凭证。有些提供商还会显示特定于提供商的后续提示：

- **Grok** 可以提供可选的 `x_search` 设置，使用同一个 `XAI_API_KEY`，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 或
  `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

相关内容：

- Gateway 网关配置参考：[Configuration](/gateway/configuration)
- Config CLI：[Config](/cli/config)

## 选项

- `--section <section>`：可重复的部分筛选器

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

注意事项：

- 选择 Gateway 网关运行位置时总会更新 `gateway.mode`。如果这就是你唯一需要的内容，你可以在不选择其他部分的情况下直接选择“Continue”。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示输入渠道/房间允许列表。你可以输入名称或 ID；向导会在可能时将名称解析为 ID。
- 如果你运行守护进程安装步骤，token 认证需要 token，且 `gateway.auth.token` 由 SecretRef 管理，configure 会验证该 SecretRef，但不会将解析后的明文 token 值持久化到 supervisor 服务环境元数据中。
- 如果 token 认证需要 token，而配置的 token SecretRef 无法解析，configure 会阻止守护进程安装，并提供可执行的修复指导。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置，而 `gateway.auth.mode` 未设置，configure 会阻止守护进程安装，直到显式设置 mode。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
