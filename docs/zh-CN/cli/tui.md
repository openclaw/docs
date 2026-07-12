---
read_when:
    - 你需要一个适用于 Gateway 网关的终端界面（便于远程使用）
    - 你希望从脚本传递 URL、令牌和会话
    - 你想在没有 Gateway 网关的情况下，以本地嵌入模式运行 TUI
    - 你想使用 `openclaw chat` 或 `openclaw tui --local`
summary: '`openclaw tui` 的 CLI 参考（由 Gateway 网关支持或本地嵌入式终端 UI）'
title: TUI
x-i18n:
    generated_at: "2026-07-11T20:26:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

打开连接到 Gateway 网关的终端界面，或以本地嵌入模式运行。

相关指南：[TUI](/zh-CN/web/tui)

## 选项

| 标志                         | 默认值                                    | 说明                                                                                   |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | 使用本地嵌入式智能体运行时，而不是 Gateway 网关。                                      |
| `--url <url>`                | 配置中的 `gateway.remote.url`             | Gateway 网关 WebSocket URL。                                                           |
| `--token <token>`            | （无）                                    | Gateway 网关令牌（如果需要）。                                                         |
| `--password <pass>`          | （无）                                    | Gateway 网关密码（如果需要）。                                                         |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | 固定 `wss://` Gateway 网关的预期 TLS 证书指纹。                                        |
| `--session <key>`            | `main`（权限范围为全局时为 `global`）     | 会话键。在 Agent 工作区内，除非带有前缀，否则会自动选择该智能体。                       |
| `--deliver`                  | `false`                                   | 通过已配置的渠道传递助手回复。                                                         |
| `--thinking <level>`         | （模型默认值）                            | 覆盖思考级别。                                                                         |
| `--message <text>`           | （无）                                    | 连接后发送初始消息。                                                                   |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | 智能体超时时间。无效值会记录警告并被忽略。                                             |
| `--history-limit <n>`        | `200`                                     | 连接时加载的历史记录条目数。                                                           |

别名：`openclaw chat` 和 `openclaw terminal` 会调用此命令，并隐式启用 `--local`。

## 注意事项

- `--local` 不能与 `--url`、`--token`、`--password` 或 `--tls-fingerprint` 同时使用。
- 在可能的情况下，`tui` 会为令牌/密码身份验证解析已配置的 Gateway 网关身份验证 SecretRef（`env`/`file`/`exec` 提供商）。
- 如果未明确指定 URL 或端口，`tui` 会使用正在运行的 Gateway 网关所记录的当前本地 Gateway 网关端口。明确指定的 `--url`、`OPENCLAW_GATEWAY_URL`、`OPENCLAW_GATEWAY_PORT` 和远程 Gateway 网关配置仍具有更高优先级。
- 从已配置的 Agent 工作区目录内启动时，TUI 会自动选择该智能体作为会话键的默认值（除非明确将 `--session` 指定为 `agent:<id>:...`）。
- 要在页脚中为非本地、基于 URL 的连接显示 Gateway 网关主机名，请运行 `openclaw config set tui.footer.showRemoteHost true`。默认关闭；对于回环或嵌入式本地连接，绝不会显示。
- 本地模式直接使用嵌入式智能体运行时。大多数本地工具均可使用，但仅限 Gateway 网关的功能不可用。
- 本地模式会在 TUI 命令界面中添加 `/auth [provider]`。
- 插件审批关卡在本地模式下仍然生效：需要审批的工具会在终端中提示你作出决定，不会静默自动批准任何操作。
- 会话[目标](/zh-CN/tools/goal)会显示在页脚中，并可使用 `/goal` 管理。

## 示例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## 配置修复循环

使用本地模式，让嵌入式智能体检查当前配置、将其与文档进行比较，并在同一终端中协助修复。

如果 `openclaw config validate` 已经失败，请先运行 `openclaw configure` 或 `openclaw doctor --fix`；`openclaw chat` 不会绕过无效配置防护。

```bash
openclaw chat
```

然后在 TUI 中运行：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 应用针对性修复，然后重新运行 `openclaw config validate`。参阅 [TUI](/zh-CN/web/tui) 和[配置](/zh-CN/cli/config)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [TUI](/zh-CN/web/tui)
- [目标](/zh-CN/tools/goal)
