---
read_when:
    - 你正在使用 CLI 新手引导向导进行首次设置
    - 你想设置默认工作区路径
    - 你需要用于脚本的仅基线设置标志
summary: '`openclaw setup` 的 CLI 参考（新手引导的别名，可通过标志执行基线设置）'
title: 设置
x-i18n:
    generated_at: "2026-07-12T14:24:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 运行与 `openclaw onboard` 相同的引导式新手引导流程：
它首先验证并持久化推理配置，然后启动 Crestodian 来配置
工作区、Gateway 网关、渠道、Skills 和健康状态。当你
只需初始化配置/工作区文件夹而不运行向导时，请使用 `--baseline`。

在引导模式下，`--workspace <dir>` 是向 Crestodian 提议的工作区；
仅在你批准该提议后才会持久化。基线、经典和
非交互式设置会通过各自的正常流程持久化所提供的工作区。

`setup` 接受与 `openclaw onboard` 相同的新手引导标志，包括
身份验证（`--auth-choice`、`--token`、提供商密钥标志）、Gateway 网关
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、重置（`--reset`、`--reset-scope`）、流程
（`--flow quickstart|advanced|manual|import`）和跳过标志
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）。有关完整的标志参考和
非交互式示例，请参阅[引导设置](/zh-CN/cli/onboard)和
[CLI 自动化](/zh-CN/start/wizard-cli-automation)。`openclaw onboard --modern` 是受推理门控的
Crestodian 助手的兼容性别名，`setup` 没有对应选项。

<Note>
`openclaw setup` 适用于配置可变的安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 会拒绝设置写入，因为配置文件由 Nix 管理。请使用第一方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，或为其他 Nix 软件包使用等效的源配置。
</Note>

## 选项

| 标志                       | 说明                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 引导模式下的工作区提议；基线、经典和非交互式设置会直接将其持久化。 |
| `--baseline`               | 创建基线配置、工作区和会话文件夹，不运行新手引导。                                  |
| `--wizard`                 | 为兼容性而接受；设置默认运行新手引导。                                         |
| `--non-interactive`        | 在没有提示的情况下运行新手引导。                                                                       |
| `--accept-risk`            | 确认智能体访问整个系统的风险；与 `--non-interactive` 一起使用时必需。                         |
| `--mode <mode>`            | 新手引导模式：`local` 或 `remote`。                                                                 |
| `--flow <flow>`            | 引导设置流程：`quickstart`、`advanced`、`manual` 或 `import`。                                        |
| `--reset`                  | 在新手引导之前重置配置 + 凭据 + 会话（仅当使用 `--reset-scope full` 时重置工作区）。   |
| `--reset-scope <scope>`    | 重置范围：`config`、`config+creds+sessions` 或 `full`。                                            |
| `--import-from <provider>` | 在新手引导期间运行迁移的提供商。                                                          |
| `--import-source <path>`   | `--import-from` 的源智能体主目录。                                                                |
| `--import-secrets`         | 在新手引导迁移期间导入支持的机密。                                                 |
| `--remote-url <url>`       | 远程 Gateway 网关 WebSocket URL。                                                                         |
| `--remote-token <token>`   | 远程 Gateway 网关令牌（可选）。                                                                      |
| `--json`                   | 输出 JSON 摘要。                                                                                |

`--classic` 和 `--non-interactive` 互斥：经典模式会打开
交互式向导，而非交互式设置使用自动化路径。

### 基线模式

`openclaw setup --baseline` 保留了旧版仅基线行为：它会
创建配置、工作区和会话目录，然后退出，不运行
新手引导。

## 示例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事项

- 完成基线设置后，运行 `openclaw setup` 或 `openclaw onboard` 以体验完整的引导式流程，运行 `openclaw configure` 进行针对性更改，或运行 `openclaw channels add` 添加渠道账户。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移选项。导入式新手引导需要全新设置；如需在新手引导之外使用试运行计划、备份和覆盖模式，请使用[迁移](/zh-CN/cli/migrate)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [引导设置](/zh-CN/cli/onboard)
- [新手引导（CLI）](/zh-CN/start/wizard)
- [入门指南](/zh-CN/start/getting-started)
- [安装概览](/zh-CN/install)
