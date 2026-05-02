---
read_when:
    - 你正在进行首次运行设置，但未使用完整的 CLI 新手引导
    - 你想设置默认工作区路径
summary: '`openclaw setup` 的 CLI 参考（初始化配置 + 工作区）'
title: 设置
x-i18n:
    generated_at: "2026-05-02T19:31:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 和智能体工作区。

相关：

- 入门指南：[入门指南](/zh-CN/start/getting-started)
- CLI 新手引导：[新手引导（CLI）](/zh-CN/start/wizard)

## 示例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 选项

- `--workspace <dir>`：智能体工作区目录（存储为 `agents.defaults.workspace`）
- `--wizard`：运行新手引导
- `--non-interactive`：无提示运行新手引导
- `--mode <local|remote>`：新手引导模式
- `--import-from <provider>`：新手引导期间要运行的迁移提供商
- `--import-source <path>`：`--import-from` 的源智能体主目录
- `--import-secrets`：在新手引导迁移期间导入受支持的密钥
- `--remote-url <url>`：远程 Gateway 网关 WebSocket URL
- `--remote-token <token>`：远程 Gateway 网关令牌

要通过 setup 运行新手引导：

```bash
openclaw setup --wizard
```

注意：

- 普通 `openclaw setup` 会初始化配置 + 工作区，而不运行完整的新手引导流程。
- 普通设置后，运行 `openclaw configure` 来选择模型、渠道、Gateway 网关、插件、Skills 或健康检查。
- 存在任何新手引导标志时（`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`），新手引导会自动运行。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移。导入新手引导需要全新设置；如需试运行计划、备份以及新手引导之外的覆盖模式，请使用 [迁移](/zh-CN/cli/migrate)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [安装概览](/zh-CN/install)
