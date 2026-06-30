---
read_when:
    - 你正在使用 CLI 新手引导向导进行首次运行设置
    - 你想设置默认工作区路径
    - 你需要用于脚本的仅基线设置标志
summary: '`openclaw setup` 的 CLI 参考（新手引导的别名，可通过标志使用基线设置）'
title: 设置
x-i18n:
    generated_at: "2026-06-30T22:06:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

运行完整的 CLI 新手引导流程。`openclaw setup` 是 `openclaw onboard` 的别名；如果你只需要在不使用向导的情况下初始化配置/工作区文件夹，请使用 `--baseline`。

<Note>
`openclaw setup` 用于可变配置安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 会拒绝设置写入，因为配置文件由 Nix 管理。请使用官方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，或为其他 Nix 包使用等效的源配置。
</Note>

## 选项

| 标志                       | 描述                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent 工作区目录（默认 `~/.openclaw/workspace`；存储为 `agents.defaults.workspace`）。 |
| `--baseline`               | 在不运行新手引导的情况下创建基线配置/工作区/会话文件夹。                                |
| `--wizard`                 | 为兼容性接受；设置默认会运行新手引导。                                       |
| `--non-interactive`        | 在没有提示的情况下运行新手引导。                                                                     |
| `--accept-risk`            | 确认全系统智能体访问风险；与 `--non-interactive` 一起使用时必需。                       |
| `--mode <mode>`            | 新手引导模式：`local` 或 `remote`。                                                               |
| `--import-from <provider>` | 新手引导期间要运行的迁移提供商。                                                        |
| `--import-source <path>`   | `--import-from` 的源智能体主目录。                                                              |
| `--import-secrets`         | 在新手引导迁移期间导入支持的密钥。                                               |
| `--remote-url <url>`       | 远程 Gateway 网关 WebSocket URL。                                                                       |
| `--remote-token <token>`   | 远程 Gateway 网关令牌（可选）。                                                                    |

### 基线模式

`openclaw setup --baseline` 保留较早的仅基线行为：它会创建配置、工作区和会话目录，然后在不运行新手引导的情况下退出。

## 示例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 说明

- 普通的 `openclaw setup` 会运行与 `openclaw onboard` 相同的引导流程。
- 完成基线设置后，运行 `openclaw setup` 或 `openclaw onboard` 进入完整引导流程，运行 `openclaw configure` 进行定向更改，或运行 `openclaw channels add` 添加渠道账号。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移。导入新手引导需要全新设置；如需在新手引导之外进行试运行计划、备份和覆盖模式，请使用 [迁移](/zh-CN/cli/migrate)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [新手引导（CLI）](/zh-CN/start/wizard)
- [入门指南](/zh-CN/start/getting-started)
- [安装概览](/zh-CN/install)
