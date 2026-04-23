---
read_when:
    - 你想为 Gateway 网关 使用终端 UI（对远程环境友好）
    - 你想从脚本中传递 url / token / session
    - 你想在没有 Gateway 网关 的情况下以本地内嵌模式运行终端 UI
    - 你想使用 `openclaw chat` 或 `openclaw tui --local`
summary: '`openclaw tui` 的 CLI 参考（由 Gateway 网关 支持或本地内嵌终端 UI）'
title: 终端 UI
x-i18n:
    generated_at: "2026-04-23T06:18:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4b7cf2468779e0711f38a2cc304d783bb115fd5c5e573c9d1bc982da6e2905
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

打开连接到 Gateway 网关 的终端 UI，或以本地内嵌模式运行它。

相关内容：

- 终端 UI 指南：[终端 UI](/zh-CN/web/tui)

说明：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- `tui` 会在可能的情况下，为 token / password 认证解析已配置的 Gateway 网关 凭证 SecretRefs（`env` / `file` / `exec` 提供商）。
- 当从已配置的智能体工作区目录内启动时，终端 UI 会自动为会话键默认选择该智能体（除非 `--session` 被显式设置为 `agent:<id>:...`）。
- 本地模式会直接使用内嵌智能体运行时。大多数本地工具都可用，但仅限 Gateway 网关 的功能不可用。
- 本地模式会在终端 UI 命令界面中添加 `/auth [provider]`。

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

## 配置修复流程

当当前配置已经通过校验，并且你希望内嵌智能体在同一个终端中检查它、将其与文档进行比较并协助修复时，请使用本地模式：

如果 `openclaw config validate` 已经失败，请先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。

```bash
openclaw chat
```

然后在终端 UI 内执行：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修复，然后重新运行 `openclaw config validate`。参见 [终端 UI](/zh-CN/web/tui) 和 [配置](/zh-CN/cli/config)。
