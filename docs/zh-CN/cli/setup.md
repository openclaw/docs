---
read_when:
    - 你想与 OpenClaw 对话以进行设置或修复
    - 你正在使用新手引导向导进行首次运行设置
    - 你想设置默认工作区路径
    - 脚本需要仅基线设置标志
summary: '`openclaw setup` 的 CLI 参考（带新手引导回退的系统智能体聊天）'
title: 设置
x-i18n:
    generated_at: "2026-07-16T11:30:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 是系统智能体入口点。在已配置的系统上，直接运行
`openclaw setup` 会打开交互式 OpenClaw 聊天。在全新系统上，它会
转入引导式新手引导。使用 `-m`/`--message` 处理单个请求，或使用
`--baseline` 在不使用向导的情况下初始化配置/工作区文件夹。

路由顺序：

1. 任何新手引导选项（`--wizard`、`--baseline`、工作区、重置、
   非交互、流程、模式、Gateway 网关、守护进程、跳过、导入、远程或身份验证
   选项）都会完全按照 `openclaw onboard` 的方式运行新手引导。
2. `-m`/`--message` 或 `--yes` 会运行系统智能体。
3. 在没有路由选项的情况下，已配置的交互式系统会打开 OpenClaw。全新
   系统会运行新手引导。在已配置的系统上，即使没有 TTY，`--json` 也会输出
   系统概览；新手引导选项则保留新手引导的
   JSON 摘要。

在引导模式下，`--workspace <dir>` 是向 OpenClaw 提议的工作区；
只有在你批准该提议后才会持久保存。基线、经典和
非交互式设置会通过各自的正常流程持久保存所提供的工作区。

引导式推理检测在 macOS 或 Linux 上的 Gateway 网关主机中运行。CLI
和 macOS 应用调用同一个由 Gateway 网关负责的检测器，该检测器会检查已配置的
模型、受支持的 CLI 登录、API 密钥环境变量，以及已经
安装的 Ollama 或 LM Studio 模型。此自动检测过程绝不会下载本地
模型；所选候选项必须成功响应一次真实的补全请求，之后才会保存其
提供商和模型配置。

`setup` 接受与 `openclaw onboard` 相同的新手引导标志，包括
身份验证（`--auth-choice`、`--token`、提供商密钥标志）、Gateway 网关
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、重置（`--reset`、`--reset-scope`）、流程
（`--flow quickstart|advanced|manual|import`）以及跳过标志
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）。有关完整的标志参考和
非交互式示例，请参阅[引导设置](/zh-CN/cli/onboard)和
[CLI 自动化](/zh-CN/start/wizard-cli-automation)。`openclaw onboard --modern` 仍作为同一套
受推理检测约束的 OpenClaw 助手的兼容入口。

<Note>
`openclaw setup` 适用于配置可变的安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 会拒绝设置写入，因为配置文件由 Nix 管理。请使用第一方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，或为其他 Nix 软件包使用等效的源配置。
</Note>

## 选项

| 标志                       | 说明                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | 运行一个 OpenClaw 请求。                                                                             |
| `--yes`                    | 批准为单个 `--message` 请求持久写入配置。                                         |
| `--workspace <dir>`        | 引导模式下的工作区提议；基线、经典和非交互式设置会直接持久保存该工作区。 |
| `--baseline`               | 在不运行新手引导的情况下创建基线配置/工作区/会话文件夹。                                  |
| `--wizard`                 | 强制运行交互式新手引导。                                                                         |
| `--non-interactive`        | 在不提示的情况下运行新手引导。                                                                       |
| `--accept-risk`            | 确认全系统智能体访问风险；与 `--non-interactive` 一同使用时为必需项。                         |
| `--mode <mode>`            | 新手引导模式：`local` 或 `remote`。                                                                 |
| `--flow <flow>`            | 新手引导流程：`quickstart`、`advanced`、`manual` 或 `import`。                                        |
| `--reset`                  | 在新手引导前重置配置 + 凭据 + 会话（仅当使用 `--reset-scope full` 时重置工作区）。   |
| `--reset-scope <scope>`    | 重置范围：`config`、`config+creds+sessions` 或 `full`。                                            |
| `--import-from <provider>` | 新手引导期间运行的迁移提供商。                                                          |
| `--import-source <path>`   | `--import-from` 的源智能体主目录。                                                                |
| `--import-secrets`         | 在新手引导迁移期间导入受支持的密钥。                                                 |
| `--remote-url <url>`       | 远程 Gateway 网关 WebSocket URL。                                                                         |
| `--remote-token <token>`   | 远程 Gateway 网关令牌（可选）。                                                                      |
| `--json`                   | 已配置的系统：OpenClaw 概览。新手引导路由：新手引导摘要。                           |

`--classic` 和 `--non-interactive` 互斥：经典模式会打开
带提示的向导，而非交互式设置则使用自动化路径。

### 基线模式

`openclaw setup --baseline` 保留较早的纯基线行为：它会
创建配置、工作区和会话目录，然后退出，不
运行新手引导。

## 示例

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事项

- 完成基线设置后，运行 `openclaw onboard` 以体验完整的引导式流程，运行 `openclaw configure` 进行针对性更改，或运行 `openclaw channels add` 添加渠道账户。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移选项。导入式新手引导要求全新设置；若要在新手引导之外使用试运行计划、备份和覆盖模式，请使用[迁移](/zh-CN/cli/migrate)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [引导设置](/zh-CN/cli/onboard)
- [新手引导（CLI）](/zh-CN/start/wizard)
- [入门指南](/zh-CN/start/getting-started)
- [安装概览](/zh-CN/install)
