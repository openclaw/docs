---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-07-05T11:08:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用于对现有设置进行定向更改的交互式提示：凭证、设备、智能体默认值、Gateway 网关、渠道、插件、技能和健康检查。

完整的首次运行引导流程请使用 `openclaw onboard` 或 `openclaw setup`，仅创建基线配置/工作区请使用 `openclaw setup --baseline`，只需要设置渠道账号时请使用 `openclaw channels add`。

<Tip>
不带子命令的 `openclaw config` 会打开同一个向导。非交互式编辑请使用 `openclaw config get|set|unset`。
</Tip>

## 选项

`--section <section>`：可重复的部分筛选器。可用部分：

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

选择 `gateway`、`daemon` 或 `health`（或不带 `--section` 运行完整向导）时，会提示 Gateway 网关运行位置并更新 `gateway.mode`。跳过这三者的部分筛选器会直接进入请求的设置，不显示 Gateway 网关模式提示。选择远程 Gateway 网关模式会写入远程配置并立即退出；它不会运行插件安装等仅限本地的步骤。

<Note>
`openclaw configure` 需要交互式终端（stdin 和 stdout 都必须是 TTY）。如果没有交互式终端，它会打印等效的非交互式 `openclaw config get|set|patch|validate` 命令并以错误退出，而不是部分运行。
</Note>

## 模型部分

<Note>
**模型** 包含一个用于 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。按提供商范围进行的设置选择会把所选模型合并到现有允许列表中，而不是替换配置中已有的其他无关提供商。

从 configure 重新运行提供商身份验证会保留现有的 `agents.defaults.model.primary`，即使该提供商的身份验证步骤返回了包含其推荐默认模型的配置补丁也是如此。添加提供商或重新验证提供商会让其模型可用，但不会接管你当前的主模型。若要有意更改默认模型，请使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当 configure 从提供商身份验证选择启动时，默认模型和允许列表选择器会自动优先使用该提供商。对于 Volcengine 和 BytePlus 等成对提供商，同一偏好也会匹配它们的编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商筛选器会产生空列表，configure 会回退到未筛选的目录，而不是显示空白选择器。

## Web 部分

`openclaw configure --section web` 会选择一个 Web 搜索提供商并配置其凭证。部分提供商会显示特定于提供商的后续选项：

- **Grok** 可以使用相同的 xAI OAuth 配置或 API key 提供可选的 `x_search` 设置，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

## 其他说明

- 写入本地配置后，如果所选设置路径需要，configure 会安装所选的可下载插件。远程 Gateway 网关配置不会安装本地插件包。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示输入渠道/房间允许列表。你可以输入名称或 ID；向导会在可能时将名称解析为 ID。
- 如果运行守护进程安装步骤，令牌身份验证需要令牌。如果 `gateway.auth.token` 由 SecretRef 管理，configure 会验证 SecretRef，但不会把解析出的明文令牌值持久化到 supervisor 服务环境元数据中；如果 SecretRef 未解析，configure 会阻止守护进程安装，并给出可操作的修复指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，configure 会阻止守护进程安装，直到你显式设置该模式。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
- 配置 CLI：[配置](/zh-CN/cli/config)
