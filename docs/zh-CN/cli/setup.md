---
read_when:
    - 你正在进行首次运行设置，但没有使用完整的 CLI 新手引导
    - 你想设置默认工作区路径
summary: '`openclaw setup` 的 CLI 参考（初始化配置 + 工作区）'
title: 设置
x-i18n:
    generated_at: "2026-05-06T12:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c784c4eedee60696273f6192364b1b16dcbd8a2cd7e8b9d80ff38a3994a84889
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 和智能体工作区。

<Note>
`openclaw setup` 用于可变配置安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 会拒绝 setup 写入，因为配置文件由 Nix 管理。智能体应使用第一方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，或为其他 Nix 包使用等效的源配置。
</Note>

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
- `--non-interactive`：运行无提示的新手引导
- `--mode <local|remote>`：新手引导模式
- `--import-from <provider>`：在新手引导期间运行的迁移提供商
- `--import-source <path>`：`--import-from` 的源智能体主目录
- `--import-secrets`：在新手引导迁移期间导入受支持的密钥
- `--remote-url <url>`：远程 Gateway 网关 WebSocket URL
- `--remote-token <token>`：远程 Gateway 网关令牌

要通过 setup 运行新手引导：

```bash
openclaw setup --wizard
```

注意事项：

- 普通 `openclaw setup` 会初始化配置 + 工作区，而不会运行完整的新手引导流程。
- 普通 setup 后，运行 `openclaw configure` 来选择模型、渠道、Gateway 网关、插件、Skills 或健康检查。
- 当存在任何新手引导标志时，新手引导会自动运行（`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`）。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移。导入新手引导需要全新 setup；在新手引导之外，请使用 [迁移](/zh-CN/cli/migrate) 进行试运行计划、备份和覆盖模式。

## 相关

- [CLI 参考](/zh-CN/cli)
- [安装概览](/zh-CN/install)
