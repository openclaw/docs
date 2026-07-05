---
read_when:
    - 你正在通过 CLI 新手引导向导完成首次运行设置
    - 你想设置默认工作区路径
    - 你需要用于脚本的仅基线设置标志
summary: '`openclaw setup` 的 CLI 参考（新手引导的别名，可通过标志使用基线设置）'
title: 设置
x-i18n:
    generated_at: "2026-07-05T11:11:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d99baef64a6fc6a1227c820866340fe5fd66b3cabd3ef5e9c34268272191021
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 运行与 `openclaw onboard` 相同的引导式新手引导流程（身份验证、工作区、Gateway 网关、渠道、Skills、健康）。当你只需要初始化配置/工作区文件夹而不使用向导时，请使用 `--baseline`。

`setup` 接受与 `openclaw onboard` 相同的新手引导标志，包括身份验证（`--auth-choice`、`--token`、提供商密钥标志）、Gateway 网关（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、Tailscale（`--tailscale`）、重置（`--reset`、`--reset-scope`）、流程（`--flow quickstart|advanced|manual|import`）以及跳过标志（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、`--skip-health`、`--skip-ui`、`--skip-hooks`）。完整标志参考和非交互式示例请参阅 [引导设置](/zh-CN/cli/onboard) 和 [CLI 自动化](/zh-CN/start/wizard-cli-automation)；`openclaw onboard --modern`（Crestodian 对话式助手）没有对应的 `setup` 等效命令。

<Note>
`openclaw setup` 用于可变配置安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 会拒绝 setup 写入，因为配置文件由 Nix 管理。请使用第一方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，或为其他 Nix 包使用等效的源配置。
</Note>

## 选项

| 标志                       | 描述                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent 工作区目录（默认 `~/.openclaw/workspace`；存储为 `agents.defaults.workspace`）。 |
| `--baseline`               | 创建基线配置/工作区/会话文件夹，不运行新手引导。                                |
| `--wizard`                 | 为兼容性而接受；setup 默认运行新手引导。                                       |
| `--non-interactive`        | 在无提示的情况下运行新手引导。                                                                     |
| `--accept-risk`            | 确认全系统 Agent 访问风险；与 `--non-interactive` 一起使用时必需。                       |
| `--mode <mode>`            | 新手引导模式：`local` 或 `remote`。                                                               |
| `--flow <flow>`            | 引导设置流程：`quickstart`、`advanced`、`manual` 或 `import`。                                      |
| `--reset`                  | 在新手引导前重置配置 + 凭据 + 会话（仅在使用 `--reset-scope full` 时重置工作区）。 |
| `--reset-scope <scope>`    | 重置范围：`config`、`config+creds+sessions` 或 `full`。                                          |
| `--import-from <provider>` | 新手引导期间要运行的迁移提供商。                                                        |
| `--import-source <path>`   | `--import-from` 的源 Agent 主目录。                                                              |
| `--import-secrets`         | 在新手引导迁移期间导入受支持的密钥。                                               |
| `--remote-url <url>`       | 远程 Gateway 网关 WebSocket URL。                                                                       |
| `--remote-token <token>`   | 远程 Gateway 网关令牌（可选）。                                                                    |
| `--json`                   | 输出 JSON 摘要。                                                                              |

### 基线模式

`openclaw setup --baseline` 保留较旧的仅基线行为：它会创建配置、工作区和会话目录，然后退出而不运行新手引导。

## 示例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 说明

- 基线设置后，运行 `openclaw setup` 或 `openclaw onboard` 进入完整的引导式流程，运行 `openclaw configure` 进行针对性更改，或运行 `openclaw channels add` 添加渠道账号。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移。导入新手引导需要全新设置；如需在新手引导之外进行试运行计划、备份和覆盖模式，请使用 [迁移](/zh-CN/cli/migrate)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [引导设置](/zh-CN/cli/onboard)
- [新手引导（CLI）](/zh-CN/start/wizard)
- [入门指南](/zh-CN/start/getting-started)
- [安装概览](/zh-CN/install)
