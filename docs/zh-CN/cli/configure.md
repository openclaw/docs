---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认值
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-06-30T22:05:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用于对现有设置进行定向更改的交互式提示：凭证、设备、智能体默认值、Gateway 网关、渠道、插件、技能和健康检查。

完整的首次运行引导流程请使用 `openclaw onboard` 或 `openclaw setup`，仅创建基线配置/工作区请使用 `openclaw setup --baseline`，只需要设置渠道账号时请使用 `openclaw channels add`。

<Note>
**模型** 部分包含一个用于 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。按提供商限定的设置选项会把所选模型合并到现有允许列表中，而不是替换配置中已有的无关提供商。

从 configure 重新运行提供商认证时，会保留现有的 `agents.defaults.model.primary`，即使提供商的认证步骤返回了带有其推荐默认模型的配置补丁也是如此。这意味着添加或重新认证 xAI、OpenRouter 或其他提供商时，应只让新模型可用，而不会接管你当前的主模型。只有在你有意更改默认模型时，才使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当 configure 从提供商认证选项启动时，默认模型和允许列表选择器会自动优先使用该提供商。对于 Volcengine 和 BytePlus 这类成对提供商，同一偏好也会匹配它们的编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商过滤器会产生空列表，configure 会回退到未过滤的目录，而不是显示空白选择器。

<Tip>
不带子命令的 `openclaw config` 会打开同一个向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。
</Tip>

对于 Web 搜索，`openclaw configure --section web` 可让你选择提供商
并配置其凭证。一些提供商还会显示提供商专属的
后续提示：

- **Grok** 可提供可选的 `x_search` 设置，使用相同的 xAI OAuth 配置文件
  或 API key，并让你选择一个 `x_search` 模型。
- **Kimi** 可询问 Moonshot API 区域（`api.moonshot.ai` 与
  `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

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

- 完整向导和 Gateway 网关相关部分会询问 Gateway 网关运行位置，并更新 `gateway.mode`。不包含 `gateway`、`daemon` 或 `health` 的部分过滤器会直接进入所请求的设置。
- 写入本地配置后，如果所选设置路径需要可下载插件，configure 会安装所选插件。远程 Gateway 网关配置不会安装本地插件包。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示输入渠道/房间允许列表。你可以输入名称或 ID；向导会在可能时将名称解析为 ID。
- 如果你运行守护进程安装步骤，令牌认证需要令牌，且 `gateway.auth.token` 由 SecretRef 管理，configure 会验证 SecretRef，但不会把解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌，并且配置的令牌 SecretRef 未解析，configure 会阻止守护进程安装，并提供可操作的修复指导。
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
