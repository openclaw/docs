---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认值
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-04-24T04:00:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

用于设置凭证、设备和智能体默认值的交互式提示。

注意：**Model** 部分现在包含 `agents.defaults.models` 允许列表的多选项（决定哪些内容会显示在 `/model` 和模型选择器中）。
按提供商范围进行的设置选择会将所选模型合并到现有允许列表中，而不会替换配置里其他无关提供商的内容。

当 configure 从某个提供商认证选项启动时，默认模型和允许列表选择器会自动优先显示该提供商。对于像 Volcengine/BytePlus 这样成对的提供商，这种相同的优先级也会匹配它们的编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商筛选会产生空列表，configure 会回退到未筛选的目录，而不是显示空白选择器。

提示：不带子命令的 `openclaw config` 会打开同一个向导。对非交互式编辑，请使用 `openclaw config get|set|unset`。

对于网页搜索，`openclaw configure --section web` 可让你选择一个提供商并配置其凭证。有些提供商还会显示提供商专属的后续提示：

- **Grok** 可以提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY`，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot AI API 区域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及默认的 Kimi 网页搜索模型。

相关内容：

- Gateway 网关配置参考：[配置](/zh-CN/gateway/configuration)
- Config CLI：[配置](/zh-CN/cli/config)

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

说明：

- 选择 Gateway 网关的运行位置时，总会更新 `gateway.mode`。如果这就是你所需要的全部内容，你可以不选择其他部分而直接选择“Continue”。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示你填写渠道 / 房间允许列表。你可以输入名称或 ID；向导会在可能的情况下将名称解析为 ID。
- 如果你运行 daemon 安装步骤，且令牌认证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，configure 会验证 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌，而已配置的令牌 SecretRef 无法解析，configure 会阻止 daemon 安装，并提供可执行的修复指引。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，而 `gateway.auth.mode` 未设置，configure 会阻止 daemon 安装，直到显式设置模式。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
