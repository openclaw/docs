---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-05-01T07:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 437a6ec43a48611bf08bdeb0a6e692581c488fac283f0104b172088db37949bb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用于设置凭证、设备和智能体默认值的交互式提示。

<Note>
**模型**部分包含一个用于 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。按提供商限定的设置选择会将其选中的模型合并到现有允许列表中，而不是替换配置中已有的无关提供商。从 configure 重新运行提供商身份验证会保留现有的 `agents.defaults.model.primary`。当你有意更改默认模型时，请使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当 configure 从提供商身份验证选项启动时，默认模型和允许列表选择器会自动优先选择该提供商。对于 Volcengine 和 BytePlus 这类成对提供商，同一偏好也会匹配它们的编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商筛选器会产生空列表，configure 会回退到未筛选的目录，而不是显示空白选择器。

<Tip>
不带子命令的 `openclaw config` 会打开同一个向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。
</Tip>

对于 Web 搜索，`openclaw configure --section web` 允许你选择提供商
并配置其凭证。某些提供商还会显示提供商特定的
后续提示：

- **Grok** 可以使用同一个 `XAI_API_KEY` 提供可选的 `x_search` 设置，并
  让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与
  `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

相关：

- Gateway 网关配置参考：[配置](/zh-CN/gateway/configuration)
- 配置 CLI：[配置](/zh-CN/cli/config)

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

注意：

- 选择 Gateway 网关运行位置始终会更新 `gateway.mode`。如果这是你唯一需要的内容，可以选择“继续”而不选择其他部分。
- 写入本地配置后，configure 会实体化新近所需的内置插件运行时依赖项。这是一个范围很窄的包管理器修复步骤，而不是完整的 `openclaw doctor` 运行。远程 Gateway 网关配置不会安装本地插件依赖项。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示输入渠道/房间允许列表。你可以输入名称或 ID；向导会在可能时将名称解析为 ID。
- 如果你运行守护进程安装步骤，令牌身份验证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，configure 会验证 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌身份验证需要令牌且配置的令牌 SecretRef 未解析，configure 会阻止守护进程安装，并提供可执行的修复指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，configure 会阻止守护进程安装，直到显式设置模式。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
