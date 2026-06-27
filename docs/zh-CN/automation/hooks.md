---
read_when:
    - 你想要针对 /new、/reset、/stop 和智能体生命周期事件的事件驱动自动化
    - 你想构建、安装或调试钩子
summary: 钩子：用于命令和生命周期事件的事件驱动自动化
title: 钩子
x-i18n:
    generated_at: "2026-06-27T01:18:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooks 是在 Gateway 网关内部发生某些事件时运行的小脚本。它们可以从目录中发现，并通过 `openclaw hooks` 检查。只有在你启用 hooks，或配置至少一个 hook 条目、hook pack、旧版 handler 或额外 hook 目录后，Gateway 网关才会加载内部 hooks。

OpenClaw 中有两类 hooks：

- **内部钩子**（本页）：当 agent 事件触发时在 Gateway 网关内部运行，例如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **Webhooks**：外部 HTTP 端点，允许其他系统触发 OpenClaw 中的工作。参见 [Webhooks](/zh-CN/automation/cron-jobs#webhooks)。

Hooks 也可以打包在插件内部。`openclaw hooks list` 会同时显示独立 hooks 和插件管理的 hooks。

## 选择正确的接口

OpenClaw 有几个看起来相似但解决不同问题的扩展接口：

| 如果你想要...                                                                                                     | 使用...                                | 原因                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 时保存快照、记录 `/reset`、在 `message:sent` 后调用外部 API，或添加粗粒度操作员自动化 | 内部钩子（`HOOK.md`，本页） | 基于文件的 hooks 用于操作员管理的副作用和命令/生命周期自动化 |
| 重写提示词、阻止工具、取消出站消息，或添加有序中间件/策略                              | 通过 `api.on(...)` 的类型化插件钩子  | 类型化 hooks 具有明确的契约、优先级、合并规则以及阻止/取消语义      |
| 添加仅遥测导出或可观测性                                                                            | 诊断事件                     | 可观测性是独立的事件总线，不是策略钩子接口                              |

当你想要行为类似小型已安装集成的自动化时，请使用内部钩子。当你需要运行时生命周期控制时，请使用类型化插件钩子。

## 快速开始

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## 事件类型

| 事件                    | 触发时机                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 发出 `/new` 命令                                      |
| `command:reset`          | 发出 `/reset` 命令                                    |
| `command:stop`           | 发出 `/stop` 命令                                     |
| `command`                | 任意命令事件（通用监听器）                       |
| `session:compact:before` | 压缩汇总历史之前                       |
| `session:compact:after`  | 压缩完成之后                                 |
| `session:patch`          | 会话属性被修改时                       |
| `agent:bootstrap`        | 注入工作区启动文件之前              |
| `gateway:startup`        | 频道启动且 hooks 加载之后                  |
| `gateway:shutdown`       | Gateway 网关关闭开始时                               |
| `gateway:pre-restart`    | 预期的 Gateway 网关重启之前                         |
| `message:received`       | 来自任意渠道的入站消息                           |
| `message:transcribed`    | 音频转录完成之后                        |
| `message:preprocessed`   | 媒体和链接预处理完成或跳过之后 |
| `message:sent`           | 出站消息已送达                                 |

## 编写 hooks

### Hook 结构

每个 hook 都是一个包含两个文件的目录：

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md 格式

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**元数据字段**（`metadata.openclaw`）：

| 字段      | 描述                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 的显示 emoji                                |
| `events`   | 要监听的事件数组                        |
| `export`   | 要使用的命名导出（默认为 `"default"`）        |
| `os`       | 必需平台（例如 `["darwin", "linux"]`）     |
| `requires` | 必需的 `bins`、`anyBins`、`env` 或 `config` 路径 |
| `always`   | 绕过资格检查（布尔值）                  |
| `install`  | 安装方法                                 |

### Handler 实现

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

每个事件都包括：`type`、`action`、`sessionKey`、`timestamp`、`messages`（仅在可回复接口上在此推送回复）以及 `context`（事件特定数据）。Agent 和工具插件钩子上下文还可以包含 `trace`，这是一个只读、兼容 W3C 的诊断跟踪上下文，插件可以将其传入结构化日志，以便进行 OTEL 关联。

`event.messages` 只会在可回复接口上自动送达，例如
`command:*` 和 `message:received`。仅生命周期事件，例如
`agent:bootstrap`、`session:*`、`gateway:*` 或 `message:sent` 没有
回复渠道，并会忽略推送的消息。

### 事件上下文重点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定数据，包括 `senderId`、`senderName`、`guildId`）。`context.content` 会优先使用类命令消息中的非空命令正文，然后回退到原始入站正文和通用正文；它不包含仅限 agent 的增强信息，例如线程历史或链接摘要。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强正文）、`context.from`、`context.channelId`。

**Bootstrap 事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话 patch 事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅变更字段）、`context.cfg`。只有特权客户端可以触发 patch 事件。

**压缩事件**：`session:compact:before` 包括 `messageCount`、`tokenCount`。`session:compact:after` 会添加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 观察用户发出 `/stop`；它属于取消/命令
生命周期，而不是 agent 终结门控。需要检查
自然最终答案并要求 agent 再处理一次的插件应改用类型化
插件钩子 `before_agent_finalize`。参见 [插件钩子](/zh-CN/plugins/hooks)。

**Gateway 网关生命周期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，并在 Gateway 网关关闭开始时触发。`gateway:pre-restart` 包含相同上下文，但只会在关闭属于预期重启的一部分且提供了有限的 `restartExpectedMs` 值时触发。关闭期间，每个生命周期 hook 等待都是尽力而为且有边界的，因此即使 handler 停滞，关闭也会继续。默认等待预算是 `gateway:shutdown` 5 秒，`gateway:pre-restart` 10 秒。

当频道仍可用时，使用 `gateway:pre-restart` 发送简短重启通知：

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件与关闭序列其余部分之间，Gateway 网关还会为进程停止时仍处于活动状态的每个会话触发一个类型化的 `session_end` 插件钩子。对于普通 SIGTERM/SIGINT 停止，事件的 `reason` 是 `shutdown`；当关闭作为预期重启的一部分被调度时，`reason` 是 `restart`。这个清空过程是有边界的，因此缓慢的 `session_end` handler 无法阻止进程退出，并且已通过替换 / 重置 / 删除 / 压缩完成终结的会话会被跳过，以避免重复触发。

## Hook 发现

Hooks 会从以下目录中发现，按覆盖优先级从低到高排序：

1. **内置 hooks**：随 OpenClaw 一起提供
2. **插件 hooks**：打包在已安装插件内部的 hooks
3. **托管 hooks**：`~/.openclaw/hooks/`（用户安装，跨工作区共享）。来自 `hooks.internal.load.extraDirs` 的额外目录共享此优先级。
4. **工作区 hooks**：`<workspace>/hooks/`（按 agent，默认禁用，直到显式启用）

工作区 hooks 可以添加新的 hook 名称，但不能覆盖同名的内置、托管或插件提供的 hooks。

Gateway 网关会在启动时跳过内部 hook 发现，直到配置了内部 hooks。使用 `openclaw hooks enable <name>` 启用内置或托管 hook，安装 hook pack，或设置 `hooks.internal.enabled=true` 来选择启用。当你启用一个命名 hook 时，Gateway 网关只加载该 hook 的 handler；`hooks.internal.enabled=true`、额外 hook 目录和旧版 handlers 会选择启用广泛发现。

### Hook packs

Hook packs 是通过 `package.json` 中的 `openclaw.hooks` 导出 hooks 的 npm 包。安装方式：

```bash
openclaw plugins install <path-or-spec>
```

Npm spec 仅限注册表（包名 + 可选的精确版本或 dist-tag）。Git/URL/file spec 和 semver 范围会被拒绝。

## 内置 hooks

| Hook                  | 事件                                            | 作用                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 将会话上下文保存到 `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 从 glob 模式注入额外的 bootstrap 文件          |
| command-logger        | `command`                                         | 将所有命令记录到 `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在会话压缩开始/结束时发送可见的聊天通知 |
| boot-md               | `gateway:startup`                                 | 在 Gateway 网关启动时运行 `BOOT.md`                         |

启用任意内置 hook：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 详情

提取最近 15 条用户/助手消息，并使用主机本地日期保存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。记忆捕获在后台运行，因此 `/new` 和 `/reset` 确认不会因读取转录或可选的 slug 生成而延迟。设置 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已配置的模型生成描述性文件名 slug。需要配置 `workspace.dir`。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files 配置

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

路径相对于工作区解析。只会加载可识别的 bootstrap 基名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 详情

将每个斜杠命令记录到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 详情

当 OpenClaw 开始和完成压缩会话转录时，会向当前对话发送简短状态消息。这让聊天界面上的长轮次不那么令人困惑，因为用户可以看到助手正在总结上下文，并会在压缩后继续。

<a id="boot-md"></a>

### boot-md 详情

在 Gateway 网关启动时，从活动工作区运行 `BOOT.md`。

## 插件钩子

插件可以通过插件 SDK 注册类型化钩子，以实现更深度的集成：
拦截工具调用、修改提示词、控制消息流等。
当你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他进程内生命周期钩子时，请使用插件钩子。

插件管理的内部钩子有所不同：它们参与本页的
粗粒度命令/生命周期事件系统，并在 `openclaw hooks list` 中显示为
`plugin:<id>`。这些适用于副作用以及与 hook 包的兼容性，而不是
有序中间件或策略门控。

完整的插件钩子参考请见 [插件钩子](/zh-CN/plugins/hooks)。

## 配置

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

每个 hook 的环境变量：

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

额外 hook 目录：

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
为向后兼容，仍支持旧版 `hooks.internal.handlers` 数组配置格式，但新的 hook 应使用基于发现的系统。
</Note>

## CLI 参考

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳实践

- **保持处理器快速。** Hook 会在命令处理期间运行。使用 `void processInBackground(event)` 以即发即忘的方式处理繁重工作。
- **优雅地处理错误。** 将有风险的操作包裹在 try/catch 中；不要抛出异常，这样其他处理器仍可运行。
- **尽早过滤事件。** 如果事件类型/操作不相关，请立即返回。
- **使用具体事件键。** 优先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以减少开销。

## 故障排除

### 未发现 Hook

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook 不符合条件

```bash
openclaw hooks info my-hook
```

检查是否缺少二进制文件（PATH）、环境变量、配置值或 OS 兼容性。

### Hook 未执行

1. 验证 hook 已启用：`openclaw hooks list`
2. 重启你的 Gateway 网关进程，以便重新加载 hook。
3. 检查 Gateway 网关日志：`./scripts/clawlog.sh | grep hook`

## 相关

- [CLI 参考：hooks](/zh-CN/cli/hooks)
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- [插件钩子](/zh-CN/plugins/hooks) — 进程内插件生命周期钩子
- [配置](/zh-CN/gateway/configuration-reference#hooks)
