---
read_when:
    - 你想以交互方式调整凭据、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-07-11T20:25:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

通过交互式提示对现有设置进行针对性更改：凭据、设备、智能体默认值、Gateway 网关、渠道、插件、Skills 和健康检查。

使用 `openclaw onboard` 或 `openclaw setup` 完成首次运行的完整引导流程；使用 `openclaw setup --baseline` 仅设置基础配置和工作区；如果只需设置渠道账户，请使用 `openclaw channels add`。

<Tip>
不带子命令运行 `openclaw config` 会打开同一个向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。
</Tip>

## 选项

`--section <section>`：可重复指定的分区筛选器。可用分区：

`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

选择 `gateway`、`daemon` 或 `health`（或不带 `--section` 运行完整向导）时，系统会询问 Gateway 网关的运行位置并更新 `gateway.mode`。如果分区筛选器跳过了这三个分区，则会直接进入请求的设置流程，不显示 Gateway 网关模式提示。选择远程 Gateway 网关模式会写入远程配置并立即退出；它不会执行插件安装等仅限本地的步骤。

<Note>
`openclaw configure` 需要交互式终端（stdin 和 stdout 都必须是 TTY）。如果没有交互式终端，它会输出等效的非交互式 `openclaw config get|set|patch|validate` 命令并报错退出，而不会只执行部分流程。
</Note>

## 模型分区

<Note>
**模型**包含一个多选项，用于设置 `agents.defaults.models` 允许列表（即 `/model` 和模型选择器中显示的内容）。按提供商限定的设置选项会将所选模型合并到现有允许列表中，而不会替换配置中已有的其他无关提供商。

通过配置向导重新进行提供商身份验证时，会保留现有的 `agents.defaults.model.primary`，即使提供商的身份验证步骤返回的配置补丁包含其自身推荐的默认模型也是如此。添加提供商或重新进行身份验证会使其模型可用，但不会取代当前的主模型。若要有意更改默认模型，请使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当配置流程从提供商身份验证选项开始时，默认模型和允许列表选择器会自动优先显示该提供商。对于 Volcengine 和 BytePlus 等成对的提供商，同一偏好也会匹配其编程计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果按首选提供商筛选后列表为空，配置流程会回退到未筛选的目录，而不会显示空白选择器。

## Web 分区

`openclaw configure --section web` 用于选择 Web 搜索提供商并配置其凭据。部分提供商会显示特定于提供商的后续选项：

- **Grok** 可以选择使用同一个 xAI OAuth 配置文件或 API key 设置可选的 `x_search`，并允许你选择 `x_search` 模型。
- **Kimi** 可以要求选择 Moonshot API 区域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

## 其他说明

- 写入本地配置后，如果所选设置路径需要，配置流程会安装选定的可下载插件。远程 Gateway 网关配置不会安装本地插件包。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示配置渠道/房间允许列表。你可以输入名称或 ID；向导会尽可能将名称解析为 ID。
- 如果运行守护进程安装步骤，令牌身份验证需要令牌。如果 `gateway.auth.token` 由 SecretRef 管理，配置流程会验证 SecretRef，但不会将解析后的明文令牌值持久化到监督程序服务的环境元数据中；如果 SecretRef 无法解析，配置流程会阻止安装守护进程，并提供可操作的修复指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，配置流程会阻止安装守护进程，直到你明确设置该模式。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
- 配置 CLI：[配置](/zh-CN/cli/config)
