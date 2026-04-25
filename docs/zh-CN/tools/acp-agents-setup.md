---
read_when:
    - 为 Claude Code / Codex / Gemini CLI 安装或配置 acpx harness
    - 启用 plugin-tools 或 OpenClaw-tools MCP bridge
    - 配置 ACP 权限模式
summary: 设置 ACP 智能体：acpx harness 配置、插件设置、权限
title: ACP 智能体 — 设置
x-i18n:
    generated_at: "2026-04-25T05:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

关于概览、操作员运行手册和概念，请参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

以下各节介绍 acpx harness 配置、MCP bridge 的插件设置以及权限配置。

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

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义智能体别名，否则优先将这些值用于 `agentId`。
如果你的本地 Cursor 安装仍将 ACP 暴露为 `agent acp`，请在 acpx 配置中覆盖 `cursor` 智能体命令，而不是修改内置默认值。

直接使用 acpx CLI 也可以通过 `--agent <command>` 定位任意适配器，但这个原始逃生口是 acpx CLI 的功能（不是普通的 OpenClaw `agentId` 路径）。

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

线程绑定配置是渠道适配器专属的。Discord 示例：

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

如果线程绑定的 ACP 启动不工作，请先检查适配器功能开关：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前会话绑定不需要创建子线程。它们需要一个活动的会话上下文，以及一个暴露 ACP 会话绑定的渠道适配器。

请参见 [配置参考](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

全新安装时会默认启用内置的 `acpx` 运行时插件，因此 ACP
通常无需手动安装插件即可工作。

先执行：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想
切换到本地开发检出版本，请使用显式插件路径：

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

默认情况下，内置 `acpx` 插件使用其插件本地固定二进制（插件包内的 `node_modules/.bin/acpx`）。启动时会将后端注册为未就绪，并由后台任务验证 `acpx --version`；如果二进制缺失或版本不匹配，它会运行 `npm install --omit=dev --no-save acpx@<pinned>` 并重新验证。整个过程中 Gateway 网关始终保持非阻塞。

可在插件配置中覆盖命令或版本：

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

- `command` 接受绝对路径、相对路径（相对于 OpenClaw 工作区解析）或命令名。
- `expectedVersion: "any"` 会禁用严格版本匹配。
- 自定义 `command` 路径会禁用插件本地自动安装。

请参见 [插件](/zh-CN/tools/plugin)。

### 自动依赖安装

当你通过 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx
运行时依赖（平台特定二进制）会通过 postinstall 钩子自动安装。如果自动安装失败，Gateway 网关仍会正常启动，并通过 `openclaw acp doctor` 报告缺失的依赖。

### Plugin tools MCP bridge

默认情况下，ACPX 会话**不会**向 ACP harness 暴露 OpenClaw 插件已注册的工具。

如果你希望 Codex 或 Claude Code 之类的 ACP 智能体调用已安装的
OpenClaw 插件工具，例如 memory recall/store，请启用专用 bridge：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

它的作用：

- 在 ACPX 会话引导中注入一个名为 `openclaw-plugin-tools` 的内置 MCP 服务器。
- 暴露已安装并启用的 OpenClaw 插件已注册的插件工具。
- 使该功能保持显式启用，且默认关闭。

安全性和信任说明：

- 这会扩大 ACP harness 的工具界面。
- ACP 智能体只能访问 Gateway 网关中已激活的插件工具。
- 应将其视为与允许这些插件在 OpenClaw 本身中执行相同的信任边界。
- 启用前请审查已安装的插件。

自定义 `mcpServers` 仍与之前一样可用。内置的 plugin-tools bridge 是
额外的显式便利功能，不是通用 MCP 服务器配置的替代品。

### OpenClaw tools MCP bridge

默认情况下，ACPX 会话也**不会**通过 MCP 暴露内置 OpenClaw 工具。当 ACP 智能体需要某些选定的内置工具（例如 `cron`）时，请启用单独的核心工具 bridge：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

它的作用：

- 在 ACPX 会话引导中注入一个名为 `openclaw-tools` 的内置 MCP 服务器。
- 暴露选定的内置 OpenClaw 工具。初始服务器暴露的是 `cron`。
- 使核心工具暴露保持显式启用，且默认关闭。

### 运行时超时配置

内置 `acpx` 插件默认将嵌入式运行时轮次超时设置为 120 秒。这样可以给 Gemini CLI 之类较慢的 harness 足够时间完成 ACP 启动和初始化。如果你的主机需要不同的运行时限制，可以覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

更改此值后请重启 Gateway 网关。

### 健康探针智能体配置

内置 `acpx` 插件在决定嵌入式运行时后端是否就绪时，会探测一个 harness 智能体。如果设置了 `acp.allowedAgents`，默认会使用第一个允许的智能体；否则默认使用 `codex`。如果你的部署需要使用不同的 ACP 智能体进行健康检查，请显式设置探针智能体：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改此值后请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行——没有 TTY 可以批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供了两个配置键，用于控制权限处理方式：

这些 ACPX harness 权限与 OpenClaw exec 批准机制分离，也与 CLI 后端供应商绕过标志分离，例如 Claude CLI 的 `--permission-mode bypassPermissions`。ACPX 的 `approve-all` 是 ACP 会话的 harness 级紧急开关。

### `permissionMode`

控制 harness 智能体在无需提示的情况下可执行哪些操作。

| 值 | 行为 |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。 |
| `approve-reads` | 仅自动批准读取；写入和 exec 需要提示。 |
| `deny-all`      | 拒绝所有权限提示。 |

### `nonInteractivePermissions`

控制本应显示权限提示、但没有可交互 TTY 可用时会发生什么（ACP 会话始终如此）。

| 值 | 行为 |
| ------ | ----------------------------------------------------------------- |
| `fail` | 使用 `AcpRuntimeError` 中止会话。**（默认）** |
| `deny` | 静默拒绝该权限并继续（平滑降级）。 |

### 配置

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后请重启 Gateway 网关。

> **重要：** OpenClaw 当前默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或 exec 都可能失败，并报错 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`。
>
> 如果你需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，这样会话会平滑降级，而不是崩溃。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents) — 概览、操作员运行手册、概念
- [子智能体](/zh-CN/tools/subagents)
- [多智能体路由](/zh-CN/concepts/multi-agent)
