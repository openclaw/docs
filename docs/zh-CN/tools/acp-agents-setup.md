---
read_when:
    - 为 Claude Code / Codex / Gemini CLI 安装或配置 acpx harness
    - 启用 plugin-tools 或 OpenClaw-tools MCP 桥接器
    - 配置 ACP 权限模式
summary: 设置 ACP 智能体：acpx harness 配置、插件设置、权限
title: ACP 智能体——设置
x-i18n:
    generated_at: "2026-04-27T18:27:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

关于概览、操作手册和概念，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

以下各节介绍 acpx harness 配置、MCP 桥接器的插件设置，以及权限配置。

仅当你正在设置 ACP/acpx 路线时使用此页面。对于原生 Codex
app-server 运行时配置，请使用 [Codex harness](/zh-CN/plugins/codex-harness)。对于
OpenAI API 密钥或 Codex OAuth 模型提供商配置，请使用
[OpenAI](/zh-CN/providers/openai)。

Codex 有两种 OpenClaw 路线：

| 路线 | 配置/命令 | 设置页面 |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/zh-CN/plugins/codex-harness) |
| 显式 Codex ACP 适配器 | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 本页 |

除非你明确需要 ACP/acpx 行为，否则优先选择原生路线。

## acpx harness 支持（当前）

当前 acpx 内置 harness 别名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义智能体别名，否则对于 `agentId` 优先使用这些值。
如果你的本地 Cursor 安装仍然将 ACP 暴露为 `agent acp`，请在你的 acpx 配置中覆盖 `cursor` 智能体命令，而不是更改内置默认值。

直接使用 acpx CLI 也可以通过 `--agent <command>` 指向任意适配器，但这个原始逃生口是 acpx CLI 功能（不是常规的 OpenClaw `agentId` 路径）。

模型控制取决于适配器能力。Codex ACP 模型引用会在启动前由
OpenClaw 标准化。其他 harness 需要 ACP `models` 加上
`session/set_model` 支持；如果某个 harness 既不暴露该 ACP 能力，
也不暴露它自己的启动模型标志，那么 OpenClaw/acpx 就无法强制选择模型。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认为 true；设置为 false 可暂停 ACP 分发，同时保留 /acp 控制。
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
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

线程绑定配置取决于渠道适配器。Discord 示例：

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

如果基于线程绑定的 ACP 生成不起作用，请先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前对话绑定不需要创建子线程。它们需要一个活动的对话上下文，以及一个暴露 ACP 对话绑定的渠道适配器。

请参阅 [Configuration Reference](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

全新安装默认启用内置的 `acpx` 运行时插件，因此 ACP
通常无需手动安装插件即可工作。

首先运行：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想
切换到本地开发检出，请使用显式插件路径：

```bash
openclaw plugins install acpx
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

### acpx 命令和版本配置

默认情况下，内置的 `acpx` 插件会注册嵌入式 ACP 后端，而不会在
Gateway 网关启动期间生成 ACP 智能体。运行 `/acp doctor` 以执行显式实时探测。仅当你需要
Gateway 网关在启动时探测已配置智能体时，才设置 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1`。

在插件配置中覆盖命令或版本：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` 接受绝对路径、相对路径（从 OpenClaw 工作区解析）或命令名称。
- `expectedVersion: "any"` 会禁用严格版本匹配。
- 自定义 `command` 路径会禁用插件本地自动安装。

请参阅 [Plugins](/zh-CN/tools/plugin)。

### 自动依赖安装

当你使用 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx
运行时依赖项（特定平台的二进制文件）会通过 postinstall 钩子自动安装。如果自动安装失败，gateway 仍会正常启动，并通过 `openclaw acp doctor` 报告缺失的依赖项。

### plugin-tools MCP 桥接器

默认情况下，ACPX 会话**不会**向 ACP harness 暴露 OpenClaw 插件注册的工具。

如果你希望 Codex 或 Claude Code 等 ACP 智能体调用已安装的
OpenClaw 插件工具，例如 memory recall/store，请启用专用桥接器：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

这会执行以下操作：

- 在 ACPX 会话引导期间注入一个名为 `openclaw-plugin-tools` 的内置 MCP 服务器。
- 暴露已安装且已启用的 OpenClaw 插件已经注册的插件工具。
- 保持该功能为显式启用，且默认关闭。

安全和信任说明：

- 这会扩展 ACP harness 的工具暴露面。
- ACP 智能体只能访问 gateway 中已经处于活动状态的插件工具。
- 应将此视为与允许这些插件在 OpenClaw 本身中执行相同的信任边界。
- 启用前请审查已安装的插件。

自定义 `mcpServers` 仍按原样工作。内置的 plugin-tools 桥接器是一种
额外的显式启用便利功能，而不是通用 MCP 服务器配置的替代品。

### OpenClaw tools MCP 桥接器

默认情况下，ACPX 会话也**不会**通过
MCP 暴露内置 OpenClaw 工具。当 ACP 智能体需要某些选定的
内置工具（例如 `cron`）时，请启用单独的核心工具桥接器：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

这会执行以下操作：

- 在 ACPX 会话引导期间注入一个名为 `openclaw-tools` 的内置 MCP 服务器。
- 暴露选定的内置 OpenClaw 工具。初始服务器暴露 `cron`。
- 保持核心工具暴露为显式启用，且默认关闭。

### 运行时超时配置

内置的 `acpx` 插件默认将嵌入式运行时轮次超时设置为 120 秒。
这为 Gemini CLI 等较慢的 harness 提供了足够时间来完成 ACP 启动和初始化。如果你的主机需要不同的运行时限制，可以覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

更改此值后，重启 gateway。

### 健康探测智能体配置

当 `/acp doctor` 或显式启用的启动探测检查后端时，内置的
`acpx` 插件会探测一个 harness 智能体。如果设置了 `acp.allowedAgents`，它
默认使用第一个允许的智能体；否则默认使用 `codex`。如果你的部署需要不同的 ACP 智能体用于健康检查，请显式设置探测智能体：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改此值后，重启 gateway。

## 权限配置

ACP 会话以非交互方式运行——没有 TTY 可用于批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供了两个配置键，用于控制权限的处理方式：

这些 ACPX harness 权限独立于 OpenClaw exec 审批，也独立于 CLI 后端供应商绕过标志，例如 Claude CLI `--permission-mode bypassPermissions`。对于 ACP 会话，ACPX `approve-all` 是 harness 级别的紧急开关。

### `permissionMode`

控制 harness 智能体在不提示的情况下可以执行哪些操作。

| 值 | 行为 |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。 |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。 |
| `deny-all`      | 拒绝所有权限提示。 |

### `nonInteractivePermissions`

控制当本应显示权限提示但没有可用交互式 TTY 时会发生什么（对于 ACP 会话，这种情况始终成立）。

| 值 | 行为 |
| ------ | ----------------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止会话。**（默认）** |
| `deny` | 静默拒绝该权限并继续（平稳降级）。 |

### 配置

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后，重启 gateway。

<Warning>
OpenClaw 默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或执行操作，都可能因 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 而失败。

如果你需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，这样会话会平稳降级，而不是崩溃。
</Warning>

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents) —— 概览、操作手册、概念
- [Sub-agents](/zh-CN/tools/subagents)
- [Multi-agent routing](/zh-CN/concepts/multi-agent)
