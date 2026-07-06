---
read_when:
    - 你想要一个适用于 Gateway 网关的终端 UI（远程友好）
    - 你想从脚本传递 url/token/session
    - 你想在本地嵌入模式下运行 TUI，而不使用 Gateway 网关
    - 你想使用 openclaw chat 或 openclaw tui --local
summary: '`openclaw tui` 的 CLI 参考（由 Gateway 网关支持或本地嵌入式终端 UI）'
title: 终端用户界面
x-i18n:
    generated_at: "2026-07-06T10:48:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436184e1ca9edba0b1f47dd231529cf9d182ed43e6397bf041a503b79edb7ae9
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

打开连接到 Gateway 网关的终端 UI，或以本地嵌入式模式运行它。

相关指南：[TUI](/zh-CN/web/tui)

## 选项

| 标志                  | 默认值                                    | 描述                                                                        |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | 使用本地嵌入式智能体运行时，而不是 Gateway 网关运行。                 |
| `--url <url>`         | 配置中的 `gateway.remote.url`          | Gateway 网关 WebSocket URL。                                                             |
| `--token <token>`     | （无）                                    | 如有需要，使用 Gateway 网关令牌。                                                         |
| `--password <pass>`   | （无）                                    | 如有需要，使用 Gateway 网关密码。                                                      |
| `--session <key>`     | `main`（或当作用域为全局时为 `global`） | 会话键。在智能体工作区内，除非添加前缀，否则它会自动选择该智能体。 |
| `--deliver`           | `false`                                   | 通过已配置的渠道发送助手回复。                             |
| `--thinking <level>`  | （模型默认值）                           | 思考级别覆盖。                                                           |
| `--message <text>`    | （无）                                    | 连接后发送初始消息。                                          |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | 智能体超时。无效值会记录警告并被忽略。                       |
| `--history-limit <n>` | `200`                                     | 附加时加载的历史条目数。                                                 |

别名：`openclaw chat` 和 `openclaw terminal` 会调用此命令，并隐含
`--local`。

## 说明

- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- `tui` 会在可能时解析已配置的 Gateway 网关认证 SecretRefs，用于令牌/密码认证
  （`env`/`file`/`exec` 提供商）。
- 如果没有显式 URL 或端口，`tui` 会跟随正在运行的 Gateway 网关记录的活动本地 Gateway 网关端口。
  显式 `--url`、`OPENCLAW_GATEWAY_URL`、
  `OPENCLAW_GATEWAY_PORT` 和远程 Gateway 网关配置保持优先级。
- 从已配置的智能体工作区目录内启动时，TUI 会自动选择
  该智能体作为会话键默认值（除非 `--session` 显式为
  `agent:<id>:...`）。
- 若要在页脚中为非本地 URL 支持的连接显示 Gateway 网关主机名，
  请运行 `openclaw config set tui.footer.showRemoteHost true`。默认关闭；
  对 local loopback 或嵌入式本地连接绝不显示。
- 本地模式直接使用嵌入式智能体运行时。大多数本地工具可用，
  但仅 Gateway 网关支持的功能不可用。
- 本地模式会向 TUI 命令界面添加 `/auth [provider]`。
- 插件审批门禁在本地模式下仍然适用：需要审批的工具
  会在终端中提示决策，不会静默自动批准任何内容。
- 会话[目标](/zh-CN/tools/goal)会显示在页脚中，并可通过
  `/goal` 管理。

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

使用本地模式让嵌入式智能体检查当前配置，将其与文档对比，
并从同一个终端帮助修复它。

如果 `openclaw config validate` 已经失败，请先运行 `openclaw configure` 或
`openclaw doctor --fix`；`openclaw chat` 不会绕过
无效配置保护。

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

使用 `openclaw config set` 或 `openclaw configure` 应用定向修复，然后
重新运行 `openclaw config validate`。请参阅 [TUI](/zh-CN/web/tui) 和
[配置](/zh-CN/cli/config)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [TUI](/zh-CN/web/tui)
- [目标](/zh-CN/tools/goal)
