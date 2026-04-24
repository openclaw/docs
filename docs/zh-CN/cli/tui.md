---
read_when:
    - 你想要一个用于 Gateway 网关的终端 UI（对远程使用友好）
    - 你想从脚本中传入 url/token/session
    - 你想在没有 Gateway 网关的情况下，以本地嵌入模式运行终端 UI
    - 你想使用 openclaw chat 或 openclaw tui --local
summary: '`openclaw tui` 的 CLI 参考（由 Gateway 网关支持或本地嵌入式的终端 UI）'
title: 终端 UI
x-i18n:
    generated_at: "2026-04-24T04:01:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

打开连接到 Gateway 网关的终端 UI，或以本地嵌入
模式运行它。

相关内容：

- 终端 UI 指南：[终端 UI](/zh-CN/web/tui)

说明：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- `tui` 会在可能的情况下解析已配置的 Gateway 网关认证 SecretRefs，用于 token/password 认证（`env`/`file`/`exec` 提供商）。
- 当从已配置的智能体工作区目录内部启动时，终端 UI 会自动为会话键默认值选择该智能体（除非 `--session` 被显式设置为 `agent:<id>:...`）。
- 本地模式直接使用嵌入式智能体运行时。大多数本地工具都可用，但仅限 Gateway 网关的功能不可用。
- 本地模式会在终端 UI 的命令界面中添加 `/auth [provider]`。
- 插件审批关卡在本地模式下仍然适用。需要审批的工具会在终端中提示你作出决定；不会因为未涉及 Gateway 网关而被静默自动批准。

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

当当前配置已经通过校验，并且你希望嵌入式
智能体检查它、将其与文档对照，并帮助你在同一个终端中完成修复时，请使用本地模式：

如果 `openclaw config validate` 已经失败，请先使用 `openclaw configure` 或
`openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。

```bash
openclaw chat
```

然后在终端 UI 内部运行：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修复，然后
重新运行 `openclaw config validate`。参见 [终端 UI](/zh-CN/web/tui) 和 [配置](/zh-CN/cli/config)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [终端 UI](/zh-CN/web/tui)
