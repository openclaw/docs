---
read_when:
    - 为 Claude Code / Codex / Gemini CLI 安装或配置 acpx harness
    - 启用 plugin-tools 或 OpenClaw-tools MCP 桥接器
    - 配置 ACP 权限模式
summary: 设置 ACP 智能体：acpx harness 配置、插件设置和权限
title: ACP Agents 设置
x-i18n:
    generated_at: "2026-07-11T20:57:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

有关概览、操作员运行手册和概念，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

本页介绍 acpx harness 配置、MCP 桥接的插件设置以及权限配置。

仅当你要设置 ACP/acpx 路由时才使用本页。有关原生 Codex
app-server 运行时配置，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。有关
OpenAI API 密钥或 Codex OAuth 模型提供商配置，请参阅
[OpenAI](/zh-CN/providers/openai)。

Codex 有两种 OpenClaw 路由：

| 路由                       | 配置/命令                                              | 设置页面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`、`openai/gpt-*` 智能体引用                | [Codex harness](/zh-CN/plugins/codex-harness) |
| 显式 Codex ACP 适配器      | `/acp spawn codex`、`runtime: "acp", agentId: "codex"` | 本页                                    |

除非你明确需要 ACP/acpx 行为，否则优先使用原生路由。

## acpx harness 支持（当前）

内置 acpx harness 别名（来自固定版本的 `acpx` 依赖项）：

| 别名         | 封装                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp)（`cursor-agent acp`）                                             |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP 桥接（原生 `openclaw acp`）                                                                        |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` 和 `factorydroid` 也会解析为内置的 `droid` 适配器。

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义智能体别名，否则应优先为 `agentId` 使用这些值。
如果你本地安装的 Cursor 仍以 `agent acp` 形式提供 ACP，请在 acpx 配置中覆盖 `cursor` 智能体命令，而不要更改内置默认值。

直接使用 acpx CLI 时，也可以通过 `--agent <command>` 指定任意适配器，但这一原始后门是 acpx CLI 的功能（不是常规的 OpenClaw `agentId` 路径）。

模型控制取决于适配器的能力。OpenClaw 会在启动前规范化 Codex ACP 模型引用。其他 harness 需要同时支持 ACP `models` 和 `session/set_model`；如果 harness 既不提供该 ACP 能力，也没有自己的启动模型标志，OpenClaw/acpx 就无法强制选择模型。

## 必需配置

核心 ACP 基准配置：

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

线程绑定配置因渠道适配器而异。以下是 Discord 示例：

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

如果绑定到线程的 ACP 派生无法工作，请先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnSessions=true`

当前对话绑定不需要创建子线程。它们需要活跃的对话上下文，以及提供 ACP 对话绑定的渠道适配器。

请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

软件包安装使用官方 `@openclaw/acpx` 运行时插件提供 ACP。
使用 ACP harness 会话前，请先安装并启用该插件：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

源码检出在执行 `pnpm install` 后，也可以使用本地工作区插件。

首先运行：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想切换回软件包形式的插件，请使用明确的软件包路径：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间安装本地工作区：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 运行时启动探测

`acpx` 插件直接嵌入 ACP 运行时（无需配置单独的 `acpx` 二进制文件或版本）。默认情况下，它会在 Gateway 网关启动期间注册嵌入式后端，并在 Gateway 网关发出 `ready` 信号前等待启动探测完成。只有在有意禁用启动探测的脚本或环境中，才应设置 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 或 `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1`。运行 `/acp doctor` 可执行显式的按需探测。

当路径或标志值应作为单个 argv 令牌保留时，可以使用结构化参数覆盖单个 ACP 智能体命令：

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
- `agents.<id>.args` 是可选项。在 OpenClaw 将每个数组项传递给当前 acpx 命令字符串注册表前，会先对其进行 shell 引号处理。

请参阅[插件](/zh-CN/tools/plugin)。

### 自动下载适配器

`acpx` 会在首次使用时通过 `npx` 自动下载 ACP 适配器（例如 Claude 和 Codex ACP 桥接）。你无需手动安装适配器软件包，OpenClaw 本身也没有单独的安装后步骤。如果适配器下载或派生失败，`/acp doctor` 会报告该故障。

### 插件工具 MCP 桥接

默认情况下，ACPX 会话**不会**向 ACP harness 提供由 OpenClaw 插件注册的工具。

如果你希望 Codex 或 Claude Code 等 ACP 智能体调用已安装的 OpenClaw 插件工具（例如记忆检索/存储），请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

此操作会：

- 将名为 `openclaw-plugin-tools` 的内置 MCP 服务器注入 ACPX 会话启动流程。
- 提供已由安装且启用的 OpenClaw 插件注册的插件工具。
- 保持该功能需要显式启用且默认关闭。

安全和信任注意事项：

- 这会扩大 ACP harness 的工具范围。
- ACP 智能体只能访问 Gateway 网关中已经活跃的插件工具。
- 应将其视为与允许这些插件在 OpenClaw 本身中执行相同的信任边界。
- 启用前请审查已安装的插件。

自定义 `mcpServers` 仍按原方式工作。内置插件工具桥接是额外的可选便利功能，并不能替代通用 MCP 服务器配置。

### OpenClaw 工具 MCP 桥接

默认情况下，ACPX 会话也**不会**通过 MCP 提供 OpenClaw 内置工具。当 ACP 智能体需要使用 `cron` 等指定内置工具时，请启用单独的核心工具桥接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

此操作会：

- 将名为 `openclaw-tools` 的内置 MCP 服务器注入 ACPX 会话启动流程。
- 提供指定的 OpenClaw 内置工具。初始服务器提供 `cron`。
- 保持核心工具的提供需要显式启用且默认关闭。

### 运行时操作超时配置

默认情况下，`acpx` 插件为嵌入式运行时的启动和控制操作提供 120 秒超时时间。这使 Gemini CLI 等速度较慢的 harness 有足够时间完成 ACP 启动和初始化。如果你的主机需要不同的操作时限，请覆盖该值：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

运行时轮次使用 OpenClaw 智能体/运行超时，包括 `/acp timeout`。
`sessions_spawn` 不接受逐次调用的超时覆盖；操作员配置路径是 `agents.defaults.subagents.runTimeoutSeconds`。更改 `timeoutSeconds` 后，请重启 Gateway 网关。

### 健康探测智能体配置

当 `/acp doctor` 或启动探测检查后端时，内置的 `acpx` 插件会探测一个 harness 智能体。如果设置了 `acp.allowedAgents`，则默认使用首个允许的智能体；否则默认使用 `codex`。如果你的部署需要使用其他 ACP 智能体进行健康检查，请显式设置探测智能体：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改此值后，请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行——没有 TTY 可用于批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供两个配置键，用于控制权限的处理方式：

这些 ACPX harness 权限独立于 OpenClaw Exec 审批，也独立于 Claude CLI `--permission-mode bypassPermissions` 等 CLI 后端供应商绕过标志。ACPX `approve-all` 是 ACP 会话在紧急情况下使用的 harness 级开关。

有关 OpenClaw `tools.exec.mode`、Codex Guardian 审批和 ACPX harness 权限之间更全面的对比，请参阅[权限模式](/zh-CN/tools/permission-modes)。

### `permissionMode`

控制 harness 智能体无需提示即可执行哪些操作。

| 值              | 行为                                             |
| --------------- | ------------------------------------------------ |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。              |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示确认。         |
| `deny-all`      | 拒绝所有权限提示。                               |

### `nonInteractivePermissions`

控制本应显示权限提示但没有可用交互式 TTY 时的处理方式（ACP 会话始终如此）。

| 值     | 行为                                                               |
| ------ | ------------------------------------------------------------------ |
| `fail` | 中止会话并抛出 `PermissionPromptUnavailableError`。**（默认）**    |
| `deny` | 静默拒绝权限并继续（优雅降级）。                                   |

### 配置

通过插件配置进行设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后，重启 Gateway 网关。

<Warning>
OpenClaw 的默认设置为 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或执行操作都可能因 `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` 而失败。

如果你需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，以便会话优雅降级而不是崩溃。
</Warning>

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents) — 概览、操作员运行手册、概念
- [子智能体](/zh-CN/tools/subagents)
- [多智能体路由](/zh-CN/concepts/multi-agent)
