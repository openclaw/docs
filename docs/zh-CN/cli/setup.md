---
read_when:
    - 你正在进行初次运行设置，而未使用完整的 CLI 新手引导
    - 你想设置默认工作区路径
    - 你需要了解每个标志，以及设置如何在基线模式和向导模式之间做出选择
summary: '`openclaw setup` 的 CLI 参考（初始化配置和工作区，可选运行新手引导）'
title: 设置
x-i18n:
    generated_at: "2026-06-27T01:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化基础配置和 Agent 工作区。只要存在任何新手引导标志，也会运行向导。

<Note>
`openclaw setup` 用于可变配置安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 会拒绝设置写入，因为配置文件由 Nix 管理。请使用第一方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，或为其他 Nix 包使用等效的源配置。
</Note>

## 选项

| 标志                       | 描述                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent 工作区目录（默认 `~/.openclaw/workspace`；存储为 `agents.defaults.workspace`）。 |
| `--wizard`                 | 运行交互式新手引导。                                                                         |
| `--non-interactive`        | 无提示运行新手引导。                                                                     |
| `--accept-risk`            | 确认全系统智能体访问风险；与 `--non-interactive` 一起使用时必需。                       |
| `--mode <mode>`            | 新手引导模式：`local` 或 `remote`。                                                               |
| `--import-from <provider>` | 新手引导期间要运行的迁移提供商。                                                        |
| `--import-source <path>`   | `--import-from` 的源智能体主目录。                                                              |
| `--import-secrets`         | 在新手引导迁移期间导入受支持的密钥。                                               |
| `--remote-url <url>`       | 远程 Gateway 网关 WebSocket URL。                                                                       |
| `--remote-token <token>`   | 远程 Gateway 网关令牌（可选）。                                                                    |

### 向导自动触发

当显式存在以下任一标志时，即使没有 `--wizard`，`openclaw setup` 也会运行向导：

`--wizard`、`--non-interactive`、`--accept-risk`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`。

## 示例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 说明

- 普通 `openclaw setup` 会初始化配置和工作区，而不运行完整的新手引导流程。
- 普通设置完成后，运行 `openclaw onboard` 进入完整引导流程，运行 `openclaw configure` 进行定向更改，或运行 `openclaw channels add` 添加渠道账号。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移。导入新手引导需要一次全新设置；在新手引导之外，请使用 [迁移](/zh-CN/cli/migrate) 获取试运行计划、备份和覆盖模式。

## 相关

- [CLI 参考](/zh-CN/cli)
- [新手引导（CLI）](/zh-CN/start/wizard)
- [入门指南](/zh-CN/start/getting-started)
- [安装概览](/zh-CN/install)
