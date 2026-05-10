---
read_when:
    - 你正在执行首次运行设置，但未使用完整的 CLI 新手引导
    - 你想设置默认工作区路径
    - 你需要了解每个标志，以及设置如何在基线模式和向导模式之间做出决策
summary: '`openclaw setup` 的 CLI 参考（初始化配置和工作区，可选运行新手引导）'
title: 设置
x-i18n:
    generated_at: "2026-05-10T19:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化基线配置和 Agent 工作区。只要存在任何新手引导标志，也会运行向导。

<Note>
`openclaw setup` 用于可变配置安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 会拒绝 setup 写入，因为配置文件由 Nix 管理。请使用第一方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，或为另一个 Nix 包使用等效的源配置。
</Note>

## 选项

| 标志                       | 描述                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent 工作区目录（默认 `~/.openclaw/workspace`；存储为 `agents.defaults.workspace`）。 |
| `--wizard`                 | 运行交互式新手引导。                                                                         |
| `--non-interactive`        | 在没有提示的情况下运行新手引导。                                                                     |
| `--mode <mode>`            | 新手引导模式：`local` 或 `remote`。                                                               |
| `--import-from <provider>` | 新手引导期间要运行的迁移提供商。                                                        |
| `--import-source <path>`   | `--import-from` 的源 Agent 主目录。                                                              |
| `--import-secrets`         | 在新手引导迁移期间导入支持的密钥。                                               |
| `--remote-url <url>`       | 远程 Gateway 网关 WebSocket URL。                                                                       |
| `--remote-token <token>`   | 远程 Gateway 网关令牌（可选）。                                                                    |

### 向导自动触发

即使没有 `--wizard`，当显式提供以下任意标志时，`openclaw setup` 也会运行向导：

`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`。

## 示例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 说明

- 普通的 `openclaw setup` 会初始化配置和工作区，而不运行完整的新手引导流程。
- 普通 setup 后，运行 `openclaw onboard` 开始完整的引导流程，运行 `openclaw configure` 进行定向更改，或运行 `openclaw channels add` 添加渠道账户。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移。导入式新手引导需要全新 setup；在新手引导之外，请使用 [迁移](/zh-CN/cli/migrate) 来进行试运行计划、备份和覆盖模式。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [新手引导（CLI）](/zh-CN/start/wizard)
- [入门指南](/zh-CN/start/getting-started)
- [安装概览](/zh-CN/install)
