---
read_when:
    - 为 Claude Code / Codex / Gemini CLI 安装或配置 acpx 运行框架
    - 启用 plugin-tools 或 OpenClaw-tools MCP 桥接
    - 配置 ACP 权限模式
summary: 设置 ACP Agents：acpx harness 配置、插件设置、权限
title: ACP Agents 设置
x-i18n:
    generated_at: "2026-05-10T19:49:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

有关概览、操作员运行手册和概念，请参见 [ACP agents](/zh-CN/tools/acp-agents)。

以下章节涵盖 acpx harness 配置、MCP 桥接的插件设置，以及权限配置。

只有在设置 ACP/acpx 路由时才使用此页面。对于原生 Codex
app-server 运行时配置，请使用 [Codex harness](/zh-CN/plugins/codex-harness)。对于
OpenAI API key 或 Codex OAuth 模型提供商配置，请使用
[OpenAI](/zh-CN/providers/openai)。

Codex 有两条 OpenClaw 路由：

| 路由                       | 配置/命令                                               | 设置页面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`, `openai/gpt-*` 智能体 refs               | [Codex harness](/zh-CN/plugins/codex-harness) |
| 显式 Codex ACP 适配器      | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 此页面                                  |

除非你明确需要 ACP/acpx 行为，否则优先使用原生路由。

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

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义智能体别名，否则请优先将这些值用于 `agentId`。
如果你的本地 Cursor 安装仍将 ACP 暴露为 `agent acp`，请在你的 acpx 配置中覆盖 `cursor` 智能体命令，而不是更改内置默认值。

直接使用 acpx CLI 时，也可以通过 `--agent <command>` 指向任意适配器，但这个原始逃生口是 acpx CLI 功能（不是普通的 OpenClaw `agentId` 路径）。

模型控制取决于适配器能力。Codex ACP 模型 refs 会在启动前由
OpenClaw 规范化。其他 harness 需要 ACP `models` 加上
`session/set_model` 支持；如果某个 harness 既不暴露该 ACP 能力，
也不提供自己的启动模型标志，OpenClaw/acpx 就无法强制选择模型。

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

线程绑定配置与渠道适配器相关。Discord 示例：

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
        spawnSessions: true,
      },
    },
  },
}
```

如果线程绑定的 ACP spawn 无法工作，请先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnSessions=true`

当前会话绑定不需要创建子线程。它们需要一个活跃的会话上下文，以及一个暴露 ACP 会话绑定的渠道适配器。

参见 [配置参考](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

打包安装使用官方 `@openclaw/acpx` 运行时插件来支持 ACP。
在使用 ACP harness 会话前，请安装并启用它：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

源码 checkout 也可以在 `pnpm install` 之后使用本地工作区插件。

从这里开始：

```text
/acp doctor
```

如果你禁用了 `acpx`，通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想
切换回打包插件，请使用显式包路径：

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

### acpx 命令和版本配置

默认情况下，`acpx` 插件会在 Gateway 网关
启动期间探测嵌入式 ACP 后端，并在 Gateway 网关 `ready` 信号前等待该探测完成。设置
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 可跳过启动探测，并改为惰性注册
后端。运行 `/acp doctor` 可执行显式按需探测。

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

- `command` 接受绝对路径、相对路径（从 OpenClaw 工作区解析）或命令名。
- `expectedVersion: "any"` 禁用严格版本匹配。
- 自定义 `command` 路径会禁用插件本地自动安装。

当路径或标志值应保持为单个 argv token 时，使用结构化参数覆盖单个 ACP 智能体命令：

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

- `agents.<id>.command` 是该 ACP 智能体的可执行文件或现有命令字符串。
- `agents.<id>.args` 是可选项。OpenClaw 通过当前 acpx 命令字符串注册表传递每个数组项前，会先对其进行 shell 引用。

参见 [插件](/zh-CN/tools/plugin)。

### 自动依赖安装

当你使用 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx
运行时依赖（特定平台二进制文件）会通过 postinstall hook 自动安装。如果自动安装失败，Gateway 网关仍会
正常启动，并通过 `openclaw acp doctor` 报告缺失依赖。

### 插件工具 MCP 桥接

默认情况下，ACPX 会话**不会**将 OpenClaw 插件注册的工具暴露给
ACP harness。

如果你希望 Codex 或 Claude Code 等 ACP 智能体调用已安装的
OpenClaw 插件工具，例如 memory recall/store，请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

它会执行以下操作：

- 将名为 `openclaw-plugin-tools` 的内置 MCP server 注入 ACPX 会话
  bootstrap。
- 暴露已由已安装且已启用的 OpenClaw
  插件注册的插件工具。
- 保持该功能显式启用且默认关闭。

安全和信任说明：

- 这会扩展 ACP harness 工具面。
- ACP 智能体只能访问 Gateway 网关中已激活的插件工具。
- 请将这视为与允许这些插件在
  OpenClaw 本身中执行相同的信任边界。
- 启用前请审查已安装插件。

自定义 `mcpServers` 仍会像以前一样工作。内置 plugin-tools 桥接是一个
额外的可选便利功能，并不是通用 MCP server 配置的替代品。

### OpenClaw 工具 MCP 桥接

默认情况下，ACPX 会话也**不会**通过
MCP 暴露内置 OpenClaw 工具。当 ACP 智能体需要选定的
内置工具（例如 `cron`）时，启用单独的 core-tools 桥接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

它会执行以下操作：

- 将名为 `openclaw-tools` 的内置 MCP server 注入 ACPX 会话
  bootstrap。
- 暴露选定的内置 OpenClaw 工具。初始 server 暴露 `cron`。
- 保持 core-tool 暴露为显式启用且默认关闭。

### 运行时超时配置

`acpx` 插件默认将嵌入式运行时轮次超时设为 120 秒。
这让 Gemini CLI 等较慢的 harness 有足够时间完成
ACP 启动和初始化。如果你的主机需要不同的
运行时限制，请覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

更改此值后请重启 Gateway 网关。

### 健康探测智能体配置

当 `/acp doctor` 或启动探测检查后端时，内置 `acpx`
插件会探测一个 harness 智能体。如果设置了 `acp.allowedAgents`，它默认使用
第一个允许的智能体；否则默认使用 `codex`。如果你的部署
需要另一个 ACP 智能体用于健康检查，请显式设置探测智能体：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改此值后请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行，没有 TTY 可用于批准或拒绝文件写入和 shell-exec 权限提示。acpx 插件提供两个配置键，用来控制权限处理方式：

这些 ACPX harness 权限独立于 OpenClaw exec approvals，也独立于 CLI 后端供应商绕过标志，例如 Claude CLI `--permission-mode bypassPermissions`。ACPX `approve-all` 是 ACP 会话的 harness 级紧急开关。

### `permissionMode`

控制 harness 智能体无需提示即可执行哪些操作。

| 值              | 行为                                                     |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。                     |
| `approve-reads` | 仅自动批准读取；写入和 exec 需要提示。                  |
| `deny-all`      | 拒绝所有权限提示。                                      |

### `nonInteractivePermissions`

控制在会显示权限提示但没有可用交互式 TTY 时会发生什么（ACP 会话始终如此）。

| 值     | 行为                                                               |
| ------ | ------------------------------------------------------------------ |
| `fail` | 使用 `AcpRuntimeError` 中止会话。**（默认）**                      |
| `deny` | 静默拒绝权限并继续（优雅降级）。                                  |

### 配置

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后请重启 Gateway 网关。

<Warning>
OpenClaw 默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互 ACP 会话中，任何触发权限提示的写入或 exec 都可能失败，并显示 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`。

如果你需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，让会话优雅降级而不是崩溃。
</Warning>

## 相关

- [ACP agents](/zh-CN/tools/acp-agents) — 概览、操作员运行手册、概念
- [Sub-agents](/zh-CN/tools/subagents)
- [Multi-agent routing](/zh-CN/concepts/multi-agent)
