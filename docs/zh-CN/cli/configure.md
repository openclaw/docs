---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认值
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-05-02T02:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用于设置凭据、设备和智能体默认值的交互式提示。

<Note>
**模型**部分包含一个多选项，用于设置 `agents.defaults.models` 允许列表（会显示在 `/model` 和模型选择器中的内容）。提供商范围的设置选择会把选中的模型合并到现有允许列表中，而不是替换配置里已有的无关提供商。

从配置流程重新运行提供商认证时，会保留现有的 `agents.defaults.model.primary`，即使该提供商的认证步骤返回的配置补丁带有它自己推荐的默认模型。也就是说，添加或重新认证 xAI、OpenRouter 或其他提供商时，新模型应该会变为可用，而不会接管你当前的主要模型。只有在你有意更改默认模型时，才使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当配置流程从某个提供商认证选择开始时，默认模型和允许列表选择器会自动优先使用该提供商。对于 Volcengine 和 BytePlus 这样的成对提供商，相同的偏好也会匹配它们的编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商筛选会产生空列表，配置流程会回退到未筛选的目录，而不是显示空白选择器。

<Tip>
不带子命令的 `openclaw config` 会打开同一个向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。
</Tip>

对于 Web 搜索，`openclaw configure --section web` 可让你选择提供商并配置其凭据。部分提供商还会显示提供商特定的后续提示：

- **Grok** 可以提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY`，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

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

- 选择 Gateway 网关运行位置始终会更新 `gateway.mode`。如果这就是你需要的全部内容，可以选择“继续”而不选择其他部分。
- 写入本地配置后，如果所选设置路径需要可下载插件，配置流程会安装所选插件。远程 Gateway 网关配置不会安装本地插件包。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示输入渠道/房间允许列表。你可以输入名称或 ID；向导会在可能时将名称解析为 ID。
- 如果你运行 daemon 安装步骤，令牌认证需要令牌，并且 `gateway.auth.token` 由 SecretRef 管理，配置流程会验证 SecretRef，但不会把解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌且配置的令牌 SecretRef 未解析，配置流程会阻止 daemon 安装，并给出可执行的修复指引。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，并且 `gateway.auth.mode` 未设置，配置流程会阻止 daemon 安装，直到显式设置模式。

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
