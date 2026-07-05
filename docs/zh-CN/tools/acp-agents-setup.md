---
read_when:
    - 安装或配置用于 Claude Code / Codex / Gemini CLI 的 acpx 运行框架
    - 启用 plugin-tools 或 OpenClaw-tools MCP 桥接器
    - 配置 ACP 权限模式
summary: 设置 ACP 智能体：acpx harness 配置、插件设置、权限
title: ACP 智能体 — 设置
x-i18n:
    generated_at: "2026-07-05T11:45:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

有关概览、操作员运行手册和概念，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

本页涵盖 acpx harness 配置、MCP bridge 的插件设置以及权限配置。

仅在设置 ACP/acpx 路由时使用本页。对于原生 Codex app-server 运行时配置，请使用 [Codex harness](/zh-CN/plugins/codex-harness)。对于 OpenAI API key 或 Codex OAuth 模型提供商配置，请使用 [OpenAI](/zh-CN/providers/openai)。

Codex 有两条 OpenClaw 路由：

| 路由                       | 配置/命令                                              | 设置页面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`, `openai/gpt-*` agent refs                | [Codex harness](/zh-CN/plugins/codex-harness) |
| 显式 Codex ACP adapter     | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 本页                                    |

除非你明确需要 ACP/acpx 行为，否则优先使用原生路由。

## acpx harness 支持（当前）

内置 acpx harness 别名（来自固定版本的 `acpx` 依赖）：

| 别名         | 封装对象                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP bridge（原生 `openclaw acp`）                                                                      |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` 和 `factorydroid` 也会解析为内置的 `droid` adapter。

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义 agent 别名，否则 `agentId` 优先使用这些值。
如果你的本地 Cursor 安装仍将 ACP 暴露为 `agent acp`，请在你的 acpx 配置中覆盖 `cursor` agent 命令，而不是更改内置默认值。

直接使用 acpx CLI 时，也可以通过 `--agent <command>` 指向任意 adapter，但这个原始逃生口是 acpx CLI 功能（不是常规的 OpenClaw `agentId` 路径）。

模型控制取决于 adapter 能力。Codex ACP 模型引用会在启动前由 OpenClaw 规范化。其他 harness 需要 ACP `models` 加 `session/set_model` 支持；如果某个 harness 既不暴露该 ACP 能力，也没有自己的启动模型标志，OpenClaw/acpx 就无法强制选择模型。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Defaults are coalesceIdleMs: 350, maxChunkChars: 1800; shown explicitly here.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

线程绑定配置因渠道 adapter 而异。Discord 示例：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        // Default is already true; shown explicitly here.
        spawnSessions: true,
      },
    },
  },
}
```

如果线程绑定的 ACP spawn 无法工作，请先验证 adapter 功能标志：

- Discord：`channels.discord.threadBindings.spawnSessions=true`

当前对话绑定不需要创建子线程。它们需要一个活动的对话上下文，以及一个暴露 ACP 对话绑定的渠道 adapter。

参阅 [配置参考](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

打包安装使用官方 `@openclaw/acpx` 运行时插件来支持 ACP。
在使用 ACP harness 会话前，请先安装并启用它：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

源码检出在 `pnpm install` 后也可以使用本地工作区插件。

从以下命令开始：

```text
/acp doctor
```

如果你禁用了 `acpx`，通过 `plugins.allow` / `plugins.deny` 拒绝了它，或想切回打包插件，请使用显式包路径：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间的本地工作区安装：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 运行时启动探测

`acpx` 插件直接嵌入 ACP 运行时（没有单独的 `acpx` 二进制文件或版本需要配置）。默认情况下，它会在 Gateway 网关启动期间注册嵌入式后端，并在网关 `ready` 信号前等待启动探测。仅在脚本或环境有意保持启动探测禁用时，才设置 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 或 `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1`。运行 `/acp doctor` 可执行显式的按需探测。

当路径或标志值应保持为一个 argv token 时，可以用结构化参数覆盖单个 ACP agent 命令：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` 是该 ACP agent 的可执行文件或现有命令字符串。
- `agents.<id>.args` 是可选项。OpenClaw 通过当前 acpx 命令字符串注册表传递每个数组项之前，会先对其进行 shell 引号处理。

参阅 [插件](/zh-CN/tools/plugin)。

### 自动下载 adapter

`acpx` 会在首次使用时通过 `npx` 自动下载 ACP adapter（例如 Claude 和 Codex ACP bridge）。你不需要手动安装 adapter 包，OpenClaw 本身也没有单独的 postinstall 步骤。如果 adapter 下载或 spawn 失败，`/acp doctor` 会报告该失败。

### 插件工具 MCP bridge

默认情况下，ACPX 会话**不会**向 ACP harness 暴露 OpenClaw 插件注册的工具。

如果你希望 Codex 或 Claude Code 等 ACP 智能体调用已安装的 OpenClaw 插件工具，例如记忆 recall/store，请启用专用 bridge：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

这会执行以下操作：

- 将名为 `openclaw-plugin-tools` 的内置 MCP server 注入 ACPX 会话 bootstrap。
- 暴露已安装且已启用的 OpenClaw 插件已注册的插件工具。
- 保持该功能为显式启用且默认关闭。

安全与信任说明：

- 这会扩展 ACP harness 工具面。
- ACP 智能体只能访问 Gateway 网关中已经处于活动状态的插件工具。
- 将其视为与允许这些插件在 OpenClaw 本身中执行相同的信任边界。
- 启用前请审查已安装的插件。

自定义 `mcpServers` 仍会像以前一样工作。内置的插件工具 bridge 是额外的选择性便利功能，不是通用 MCP server 配置的替代品。

### OpenClaw 工具 MCP bridge

默认情况下，ACPX 会话也**不会**通过 MCP 暴露内置 OpenClaw 工具。当 ACP agent 需要选定的内置工具（例如 `cron`）时，请启用单独的核心工具 bridge：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

这会执行以下操作：

- 将名为 `openclaw-tools` 的内置 MCP server 注入 ACPX 会话 bootstrap。
- 暴露选定的内置 OpenClaw 工具。初始 server 暴露 `cron`。
- 保持核心工具暴露为显式启用且默认关闭。

### 运行时操作超时配置

`acpx` 插件默认给嵌入式运行时启动和控制操作 120 秒。这为 Gemini CLI 等较慢的 harness 提供足够时间完成 ACP 启动和初始化。如果你的主机需要不同的操作限制，请覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

运行时轮次使用 OpenClaw agent/run 超时，包括 `/acp timeout`。
`sessions_spawn` 不接受按调用的超时覆盖；操作员路径是 `agents.defaults.subagents.runTimeoutSeconds`。更改 `timeoutSeconds` 后请重启 Gateway 网关。

### 健康探测 agent 配置

当 `/acp doctor` 或启动探测检查后端时，内置的 `acpx` 插件会探测一个 harness agent。如果设置了 `acp.allowedAgents`，它默认使用第一个允许的 agent；否则默认使用 `codex`。如果你的部署需要不同的 ACP agent 来执行健康检查，请显式设置探测 agent：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改此值后请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行，没有 TTY 可用于批准或拒绝文件写入和 shell exec 权限提示。acpx 插件提供两个配置键，用于控制权限的处理方式：

这些 ACPX harness 权限独立于 OpenClaw exec 审批，也独立于 CLI 后端厂商绕过标志，例如 Claude CLI `--permission-mode bypassPermissions`。ACPX `approve-all` 是 ACP 会话的 harness 级 break-glass 开关。

有关 OpenClaw `tools.exec.mode`、Codex Guardian 审批和 ACPX harness 权限之间更广泛的比较，请参阅 [权限模式](/zh-CN/tools/permission-modes)。

### `permissionMode`

控制 harness agent 可在不提示的情况下执行哪些操作。

| 值              | 行为                                               |
| --------------- | -------------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。               |
| `approve-reads` | 仅自动批准读取；写入和 exec 需要提示确认。        |
| `deny-all`      | 拒绝所有权限提示。                                |

### `nonInteractivePermissions`

控制在本应显示权限提示但没有可用交互式 TTY 时会发生什么（ACP 会话始终如此）。

| 值     | 行为                                                                 |
| ------ | -------------------------------------------------------------------- |
| `fail` | 使用 `PermissionPromptUnavailableError` 中止会话。**（默认）**      |
| `deny` | 静默拒绝该权限并继续（优雅降级）。                                  |

### 配置

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后重启 Gateway 网关。

<Warning>
OpenClaw 默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或 exec 都可能因 `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` 而失败。

如果你需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，这样会话会优雅降级，而不是崩溃。
</Warning>

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents) — 概览、操作员运行手册、概念
- [子智能体](/zh-CN/tools/subagents)
- [多智能体路由](/zh-CN/concepts/multi-agent)
