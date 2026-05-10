---
read_when:
    - 你想要 Gateway 网关的终端 UI（适合远程使用）
    - 你想从脚本传递 url/token/session
    - 你想在没有 Gateway 网关的情况下以本地嵌入模式运行 TUI
    - 你想使用 openclaw chat 或 openclaw tui --local
summary: 用于 `openclaw tui` 的 CLI 参考（由 Gateway 网关支持或本地嵌入式终端 UI）
title: 文本用户界面
x-i18n:
    generated_at: "2026-05-10T19:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

打开连接到 Gateway 网关的终端 UI，或在本地嵌入模式下运行它。

相关：

- TUI 指南：[TUI](/zh-CN/web/tui)

## 选项

| 标志                  | 默认值                                    | 描述                                                                               |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | 使用本地嵌入式智能体运行时，而不是 Gateway 网关。                                  |
| `--url <url>`         | 来自配置的 `gateway.remote.url`           | Gateway 网关 WebSocket URL。                                                       |
| `--token <token>`     | （无）                                    | 如有要求，提供 Gateway 网关令牌。                                                  |
| `--password <pass>`   | （无）                                    | 如有要求，提供 Gateway 网关密码。                                                  |
| `--session <key>`     | `main`（或作用域为全局时的 `global`）     | 会话键。在智能体工作区内，除非带前缀，否则会自动选择该智能体。                     |
| `--deliver`           | `false`                                   | 通过已配置的渠道递送助手回复。                                                     |
| `--thinking <level>`  | （模型默认值）                            | 思考级别覆盖值。                                                                   |
| `--message <text>`    | （无）                                    | 连接后发送初始消息。                                                               |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | 智能体超时。无效值会记录警告并被忽略。                                             |
| `--history-limit <n>` | `200`                                     | 附加时加载的历史条目数。                                                           |

别名：`openclaw chat` 和 `openclaw terminal` 会调用同一命令，并隐含 `--local`。

注意：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- 在可行时，`tui` 会解析已配置的 Gateway 网关认证 SecretRefs，用于令牌/密码认证（`env`/`file`/`exec` 提供商）。
- 从已配置的智能体工作区目录内启动时，TUI 会自动选择该智能体作为会话键默认值（除非 `--session` 显式为 `agent:<id>:...`）。
- 本地模式会直接使用嵌入式智能体运行时。大多数本地工具可以工作，但仅 Gateway 网关支持的功能不可用。
- 本地模式会在 TUI 命令界面内添加 `/auth [provider]`。
- 插件审批门禁在本地模式下仍然适用。需要审批的工具会在终端中提示做出决定；不会因为未涉及 Gateway 网关就静默自动批准任何内容。

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

当当前配置已经验证通过，并且你希望嵌入式智能体检查它、将它与文档对比，并从同一个终端帮助修复它时，请使用本地模式：

如果 `openclaw config validate` 已经失败，请先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置防护。

```bash
openclaw chat
```

然后在 TUI 内：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修复，然后重新运行 `openclaw config validate`。请参阅 [TUI](/zh-CN/web/tui) 和 [配置](/zh-CN/cli/config)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [TUI](/zh-CN/web/tui)
