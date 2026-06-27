---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-06-27T01:36:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用于对现有设置进行定向更改的交互式提示：凭证、设备、智能体默认值、Gateway 网关、渠道、插件、Skills 和健康检查。

使用 `openclaw onboard` 完成完整的首次运行引导流程，使用 `openclaw setup` 仅创建基础配置/工作空间，并在只需要设置渠道账号时使用 `openclaw channels add`。

<Note>
**模型**部分包含一个用于 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。按提供商限定的设置选项会把所选模型合并到现有允许列表中，而不是替换配置中已有的无关提供商。

从 configure 重新运行提供商认证会保留现有的 `agents.defaults.model.primary`，即使提供商的认证步骤返回了带有其推荐默认模型的配置补丁也是如此。这意味着添加或重新认证 xAI、OpenRouter 或其他提供商时，应让新模型可用，而不会接管你当前的主模型。如果你有意更改默认模型，请使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当 configure 从提供商认证选项启动时，默认模型和允许列表选择器会自动优先选择该提供商。对于 Volcengine 和 BytePlus 等成对提供商，同一偏好也会匹配它们的编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商过滤器会生成空列表，configure 会回退到未过滤的目录，而不是显示空白选择器。

<Tip>
不带子命令的 `openclaw config` 会打开同一个向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。
</Tip>

对于 Web 搜索，`openclaw configure --section web` 可让你选择提供商并配置其凭证。某些提供商还会显示特定于提供商的后续提示：

- **Grok** 可以使用同一个 xAI OAuth 配置文件或 API key 提供可选的 `x_search` 设置，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

相关：

- Gateway 网关配置参考：[配置](/zh-CN/gateway/configuration)
- 配置 CLI：[配置](/zh-CN/cli/config)

## 选项

- `--section <section>`：可重复的部分过滤器

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

- 完整向导和 Gateway 网关相关部分会询问 Gateway 网关运行的位置，并更新 `gateway.mode`。不包含 `gateway`、`daemon` 或 `health` 的部分过滤器会直接进入请求的设置。
- 写入本地配置后，如果所选设置路径需要可下载插件，configure 会安装选定的可下载插件。远程 Gateway 网关配置不会安装本地插件包。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示输入渠道/房间允许列表。你可以输入名称或 ID；向导会尽可能将名称解析为 ID。
- 如果你运行守护进程安装步骤，令牌认证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，configure 会验证 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌，而配置的令牌 SecretRef 未解析，configure 会阻止守护进程安装，并给出可操作的修复指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，configure 会阻止守护进程安装，直到显式设置模式。

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
