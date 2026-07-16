---
read_when:
    - 为 Claude Code / Codex / Gemini CLI 安装或配置 acpx harness
    - 启用 plugin-tools 或 OpenClaw-tools MCP 桥接器
    - 配置 ACP 权限模式
summary: 设置 ACP 智能体：acpx harness 配置、插件设置和权限
title: ACP Agents 设置
x-i18n:
    generated_at: "2026-07-16T11:56:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

有关概览、操作员运行手册和概念，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

本页介绍 acpx harness 配置、MCP 桥接的插件设置以及权限配置。

仅在设置 ACP/acpx 路由时使用本页。有关原生 Codex
app-server 运行时配置，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。有关
OpenAI API 密钥或 Codex OAuth 模型提供商配置，请参阅
[OpenAI](/zh-CN/providers/openai)。

Codex 有两种 OpenClaw 路由：

| 路由                       | 配置/命令                                              | 设置页面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`、`openai/gpt-*` Agent 引用                | [Codex harness](/zh-CN/plugins/codex-harness) |
| 显式 Codex ACP 适配器      | `/acp spawn codex`、`runtime: "acp", agentId: "codex"` | 本页                                    |

除非明确需要 ACP/acpx 行为，否则请优先使用原生路由。

## acpx harness 支持（当前）

内置 acpx harness 别名（来自锁定的 `acpx` 依赖项）：

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
| `openclaw`   | OpenClaw ACP 桥接（原生 `openclaw acp`）                                                                     |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` 和 `factorydroid` 也会解析为内置的 `droid` 适配器。

当 OpenClaw 使用 acpx 后端时，除非 acpx 配置定义了自定义 Agent 别名，否则请优先为 `agentId` 使用这些值。
如果本地 Cursor 安装仍将 ACP 暴露为 `agent acp`，请在 acpx 配置中覆盖 `cursor` Agent 命令，而不要更改内置默认值。

直接使用 acpx CLI 时，还可以通过 `--agent <command>` 指定任意适配器，但这个原始逃生通道是 acpx CLI 的功能（并非 OpenClaw 通常使用的 `agentId` 路径）。

模型控制取决于适配器的能力。OpenClaw 会在启动前规范化 Codex ACP 模型引用。其他 harness 需要 ACP `models` 以及
`session/set_model` 支持；如果 harness 既未暴露该 ACP 能力，也没有自己的启动模型标志，OpenClaw/acpx 就无法强制选择模型。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认为 true；设为 false 可暂停 ACP 分派，同时保留 /acp 控件。
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
      // 默认值为 coalesceIdleMs: 350、maxChunkChars: 1800；此处显式列出。
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
        // 默认值已经是 true；此处显式列出。
        spawnSessions: true,
      },
    },
  },
}
```

如果线程绑定的 ACP 创建无法工作，请先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnSessions=true`

绑定当前对话不需要创建子线程。它们需要活跃的对话上下文，以及暴露 ACP 对话绑定的渠道适配器。

请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

打包安装使用官方 `@openclaw/acpx` 运行时插件来支持 ACP。
使用 ACP harness 会话前，请先安装并启用该插件：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

执行 `pnpm install` 后，源码检出也可以使用本地工作区插件。

首先运行：

```text
/acp doctor
```

如果禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想切换回打包插件，请使用显式软件包路径：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间安装本地工作区插件：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 运行时启动探测

`acpx` 插件直接嵌入 ACP 运行时（无需单独配置 `acpx` 二进制文件或版本）。默认情况下，它会在
Gateway 网关启动期间注册嵌入式后端，并在发出 Gateway 网关 `ready`
信号之前等待启动探测。仅对有意禁用启动探测的脚本或环境设置 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 或
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1`。运行 `/acp doctor` 可执行显式的按需探测。

当路径或标志值需要保持为单个 argv 令牌时，请使用结构化参数覆盖单个 ACP Agent 命令：

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

- `agents.<id>.command` 是该 ACP Agent 的可执行文件或现有命令字符串。
- `agents.<id>.args` 是可选项。在 OpenClaw 将每个数组项传递给当前 acpx 命令字符串注册表之前，会先对其进行 shell 引用。

请参阅[插件](/zh-CN/tools/plugin)。

### 自动下载适配器

`acpx` 会在首次使用时通过 `npx` 自动下载 ACP 适配器（例如 Claude 和 Codex ACP
桥接）。无需手动安装适配器软件包，OpenClaw 本身也没有单独的安装后步骤。如果适配器下载或创建失败，`/acp doctor` 会报告该失败。

### 插件工具 MCP 桥接

默认情况下，ACPX 会话**不会**向 ACP harness 暴露 OpenClaw 插件注册的工具。

如果希望 Codex 或 Claude Code 等 ACP 智能体调用已安装的 OpenClaw 插件工具（例如记忆检索/存储），请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

具体作用：

- 将名为 `openclaw-plugin-tools` 的内置 MCP 服务器注入 ACPX 会话引导过程。
- 暴露已由安装并启用的 OpenClaw 插件注册的插件工具。
- 将活跃 ACP 会话身份传递给插件工具工厂，使 Agent 范围的工具保留在该 Agent 的命名空间中。
- 此功能需要显式启用，且默认关闭。

安全和信任注意事项：

- 这会扩大 ACP harness 的工具范围。
- ACP 智能体只能访问 Gateway 网关中已激活的插件工具。
- 应将其视为与允许这些插件在 OpenClaw 本身中执行相同的信任边界。
- 启用前请审查已安装的插件。

自定义 `mcpServers` 仍会像以前一样工作。内置插件工具桥接是额外的选择性便利功能，并非通用 MCP 服务器配置的替代品。

### OpenClaw 工具 MCP 桥接

默认情况下，ACPX 会话也**不会**通过 MCP 暴露内置 OpenClaw 工具。当 ACP 智能体需要 `cron` 等选定的内置工具时，请启用单独的核心工具桥接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

具体作用：

- 将名为 `openclaw-tools` 的内置 MCP 服务器注入 ACPX 会话引导过程。
- 暴露选定的内置 OpenClaw 工具。初始服务器会暴露 `cron`。
- 核心工具的暴露需要显式启用，且默认关闭。

### 运行时操作超时配置

`acpx` 插件默认给予嵌入式运行时启动和控制操作 120 秒时间。这使 Gemini CLI 等速度较慢的 harness 有足够时间完成 ACP 启动和初始化。如果主机需要不同的操作时限，请覆盖该值：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

运行时轮次使用 OpenClaw Agent/运行超时，包括 `/acp timeout`。
`sessions_spawn` 不接受逐次调用的超时覆盖；操作员应使用 `agents.defaults.subagents.runTimeoutSeconds` 路径。更改 `timeoutSeconds` 后请重启 Gateway 网关。

### 健康探测 Agent 配置

当 `/acp doctor` 或启动探测检查后端时，内置的 `acpx`
插件会探测一个 harness Agent。如果设置了 `acp.allowedAgents`，则默认使用第一个允许的 Agent；否则默认使用 `codex`。如果部署需要使用其他 ACP Agent 进行健康检查，请显式设置探测 Agent：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改此值后请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行——没有 TTY 可用于批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供两个配置键，用于控制权限的处理方式：

这些 ACPX harness 权限独立于 OpenClaw Exec 审批，也独立于 CLI 后端供应商绕过标志，例如 Claude CLI `--permission-mode bypassPermissions`。ACPX `approve-all` 是 ACP 会话在 harness 层级的紧急绕过开关。

有关 OpenClaw `tools.exec.mode`、Codex Guardian
审批和 ACPX harness 权限之间的更全面比较，请参阅
[权限模式](/zh-CN/tools/permission-modes)。

### `permissionMode`

控制 harness 智能体无需提示即可执行哪些操作。

| 值           | 行为                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。          |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。 |
| `deny-all`      | 拒绝所有权限提示。                              |

### `nonInteractivePermissions`

控制本应显示权限提示但没有可用的交互式 TTY 时会发生什么（ACP 会话始终如此）。

| 值  | 行为                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | 中止会话并返回 `PermissionPromptUnavailableError`。**（默认）** |
| `deny` | 静默拒绝该权限并继续（优雅降级）。        |

### 配置

通过插件配置进行设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后，重启 Gateway 网关。

<Warning>
OpenClaw 默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或执行操作都可能因 `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` 而失败。

如果需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，使会话优雅降级而不是崩溃。
</Warning>

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents) — 概览、操作员运行手册、概念
- [子智能体](/zh-CN/tools/subagents)
- [多智能体路由](/zh-CN/concepts/multi-agent)
