---
read_when:
    - 你想要一个用于 Gateway 网关的终端 UI（适合远程使用）
    - 你想从脚本传递 url/token/session
summary: '`openclaw tui` 的 CLI 参考（连接到 Gateway 网关的终端 UI）'
title: tui
x-i18n:
    generated_at: "2026-04-05T08:20:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

打开连接到 Gateway 网关的终端 UI。

相关内容：

- TUI 指南：[TUI](/web/tui)

说明：

- `tui` 会在可能的情况下解析已配置的 Gateway 网关身份验证 SecretRef，用于 token/password 认证（`env`/`file`/`exec` 提供商）。
- 当从已配置的智能体工作区目录内启动时，TUI 会自动为会话键默认值选择该智能体（除非 `--session` 被显式设置为 `agent:<id>:...`）。

## 示例

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```
