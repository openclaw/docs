---
read_when:
    - 你正在进行首次运行设置，而不使用完整的 CLI 新手引导
    - 你想设置默认工作区路径
summary: '`openclaw setup` 的 CLI 参考（初始化配置 + 工作区）'
title: setup
x-i18n:
    generated_at: "2026-04-05T08:20:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 和智能体工作区。

相关内容：

- 入门指南：[入门指南](/start/getting-started)
- CLI 新手引导：[新手引导（CLI）](/start/wizard)

## 示例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 选项

- `--workspace <dir>`：智能体工作区目录（存储为 `agents.defaults.workspace`）
- `--wizard`：运行新手引导
- `--non-interactive`：无提示运行新手引导
- `--mode <local|remote>`：新手引导模式
- `--remote-url <url>`：远程 Gateway 网关 WebSocket URL
- `--remote-token <token>`：远程 Gateway 网关令牌

通过 setup 运行新手引导：

```bash
openclaw setup --wizard
```

说明：

- 普通的 `openclaw setup` 会初始化配置 + 工作区，而不会运行完整的新手引导流程。
- 当存在任一新手引导标志时，会自动运行新手引导（`--wizard`、`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`）。
