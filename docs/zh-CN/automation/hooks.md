---
read_when:
    - 你需要用于 /new、/reset、/stop 和智能体生命周期事件的事件驱动自动化
    - 你想构建、安装或调试 Hooks
summary: Hooks：用于命令和生命周期事件的事件驱动自动化
title: Hooks
x-i18n:
    generated_at: "2026-07-05T11:00:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b35a7f4bf42ed45960b6988e6640b64c5c70c0948234f9403872007565bc8e6
    source_path: automation/hooks.md
    workflow: 16
---

Hooks 是在 agent 事件触发时运行在 Gateway 网关内部的小脚本：例如 `/new`、`/reset`、`/stop` 等命令、会话压缩、Gateway 网关生命周期和消息流。它们会从目录中发现，并通过 `openclaw hooks` 管理。只有在你启用 hooks，或配置至少一个 hook 条目、hook 包、旧版处理器或额外 hook 目录后，Gateway 网关才会加载内部 hooks。

OpenClaw 中有两类 hooks：

- **内部钩子**（本页）：在 agent 事件触发时运行在 Gateway 网关内部。
- **Webhooks**：允许其他系统触发 OpenClaw 中工作的外部 HTTP 端点。参见 [Webhooks](/zh-CN/automation/cron-jobs#webhooks)。

Hooks 也可以内置在插件中。`openclaw hooks list` 会显示独立 hooks 和插件管理的 hooks（显示为 `plugin:<id>`）。

## 选择正确的接口

OpenClaw 有多个看起来相似但解决不同问题的扩展接口：

| 如果你想要...                                                                                                     | 使用...                                | 原因                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 时保存快照，记录 `/reset`，在 `message:sent` 后调用外部 API，或添加粗粒度操作员自动化 | 内部钩子（`HOOK.md`，本页） | 基于文件的 hooks 用于操作员管理的副作用和命令/生命周期自动化 |
| 重写提示词、阻止工具、取消出站消息，或添加有序中间件/策略                              | 通过 `api.on(...)` 使用类型化插件钩子  | 类型化 hooks 具有明确的契约、优先级、合并规则和阻止/取消语义      |
| 添加仅用于遥测的导出或可观测性                                                                            | 诊断事件                     | 可观测性是独立的事件总线，不是策略 hook 接口                              |

当你想要行为类似小型已安装集成的自动化时，使用内部 hooks。当你需要运行时生命周期控制时，使用类型化插件钩子。

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
| `session:compact:before` | 压缩汇总历史记录之前                       |
| `session:compact:after`  | 压缩完成之后                                 |
| `session:patch`          | 会话属性被修改时                       |
| `agent:bootstrap`        | 注入工作区引导文件之前              |
| `gateway:startup`        | 渠道启动且 hooks 加载之后                  |
| `gateway:shutdown`       | Gateway 网关关闭开始时                               |
| `gateway:pre-restart`    | 预期的 Gateway 网关重启之前                         |
| `message:received`       | 来自任意渠道的入站消息                           |
| `message:transcribed`    | 音频转录完成之后                        |
| `message:preprocessed`   | 媒体和链接预处理完成或跳过之后 |
| `message:sent`           | 尝试发送出站消息（`context.success` 包含结果） |

## 编写 hooks

### Hook 结构

每个 hook 都是一个包含两个文件的目录：

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

处理器文件可以是 `handler.ts`、`handler.js`、`index.ts` 或 `index.js`。

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
| `emoji`    | CLI 中显示的 emoji                                |
| `events`   | 要监听的事件数组                        |
| `export`   | 要使用的命名导出（默认为 `"default"`）        |
| `os`       | 所需平台（例如 `["darwin", "linux"]`）     |
| `requires` | 所需的 `bins`、`anyBins`、`env` 或 `config` 路径 |
| `always`   | 跳过资格检查（布尔值）                  |
| `hookKey`  | 配置键覆盖（默认为 hook 名称）      |
| `homepage` | `openclaw hooks info` 显示的文档 URL              |
| `install`  | 安装方法                                 |

### 处理器实现

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

每个事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages` 和 `context`（特定于事件的数据）。用于 agent 和工具 hooks 的类型化插件 hook 上下文还可以包含 `trace`，这是一个只读的 W3C 兼容诊断追踪上下文，插件可以将其传入结构化日志以进行 OTEL 关联。

推送到 `event.messages` 的字符串只会在
`command:new` 和 `command:reset` 中传回聊天（作为对原始
会话的回复路由），以及在 `session:compact:before` / `session:compact:after`
中传回（作为压缩状态通知发送）。所有其他事件，包括
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch` 和
`gateway:*`，都会忽略推送的消息。

### 事件上下文要点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**命令事件**（`command:stop`）：`context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定数据，包括 `senderId`、`senderName`、`guildId`）。对于类似命令的消息，`context.content` 会优先使用非空命令正文，然后回退到原始入站正文和通用正文；它不包含仅供 agent 使用的增强内容，例如线程历史记录或链接摘要。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`，以及发送失败时的 `context.error`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强正文）、`context.from`、`context.channelId`。

**引导事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅变更字段）、`context.cfg`。只有特权客户端可以触发补丁事件；上下文是克隆，因此处理器无法修改实时会话条目。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 会添加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 会观察用户发出 `/stop`；它属于取消/命令
生命周期，而不是 agent 终结关口。需要检查自然最终回答并要求 agent
再处理一次的插件应改用类型化插件钩子 `before_agent_finalize`。参见 [插件钩子](/zh-CN/plugins/hooks)。

**Gateway 网关生命周期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，并在 Gateway 网关关闭开始时触发。`gateway:pre-restart` 包含相同上下文，但只会在关闭属于预期重启的一部分且提供有限的 `restartExpectedMs` 值时触发。在关闭期间，每个生命周期 hook 等待都是尽力而为且有界的，因此如果处理器卡住，关闭仍会继续。默认等待预算为 `gateway:shutdown` 5 秒，`gateway:pre-restart` 10 秒。

在渠道仍然可用时，将 `gateway:pre-restart` 用于简短重启通知：

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

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件与关闭序列其余部分之间，Gateway 网关还会为进程停止时仍处于活动状态的每个会话触发类型化 `session_end` 插件钩子。对于普通 SIGTERM/SIGINT 停止，事件的 `reason` 为 `shutdown`；如果关闭是作为预期重启的一部分安排的，则为 `restart`。此排空过程是有界的，因此缓慢的 `session_end` 处理器不会阻塞进程退出；已经通过 replace / reset / delete / compaction 终结的会话会被跳过，以避免重复触发。

## Hook 发现

Hooks 会从四个来源发现：

1. **内置 hooks**：随 OpenClaw 发布
2. **插件 hooks**：内置在已安装插件中；可以覆盖同名的内置 hooks
3. **托管 hooks**：`~/.openclaw/hooks/`（用户安装，跨工作区共享）；可以覆盖内置和插件 hooks。来自 `hooks.internal.load.extraDirs` 的额外目录共享此优先级。
4. **工作区 hooks**：`<workspace>/hooks/`（按 agent 配置，默认禁用，直到显式启用）

工作区 hooks 可以添加新的 hook 名称，但不能覆盖同名的内置、托管或插件提供的 hooks。

在内部 hooks 被配置之前，Gateway 网关启动时会跳过内部 hook 发现。使用 `openclaw hooks enable <name>` 启用内置或托管 hook，安装 hook 包，或设置 `hooks.internal.enabled=true` 以选择加入。当你启用一个命名 hook 时，Gateway 网关只会加载该 hook 的处理器；`hooks.internal.enabled=true`、额外 hook 目录和旧版处理器会选择加入广泛发现。

### Hook 包

Hook 包是通过 `package.json` 中的 `openclaw.hooks` 导出 hooks 的 npm 包。使用以下命令安装：

```bash
openclaw plugins install <path-or-spec>
```

Npm 规格仅限注册表（包名 + 可选的精确版本或 dist-tag）。Git/URL/file 规格和 semver 范围会被拒绝。较旧的 `openclaw hooks install` 和 `openclaw hooks update` 命令是 `openclaw plugins install` / `openclaw plugins update` 的已弃用别名。

## 内置 hooks

| 钩子                  | 事件                                            | 作用                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 将会话上下文保存到 `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 从 glob 模式注入额外的引导文件          |
| command-logger        | `command`                                         | 将所有命令记录到 `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在会话压缩开始/结束时发送可见的聊天通知 |
| boot-md               | `gateway:startup`                                 | 在 Gateway 网关启动时运行 `BOOT.md`                         |

启用任意内置钩子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 详情

提取最后的用户/助手消息（默认 15 条，可通过 `hooks.internal.entries.session-memory.messages` 配置），并使用主机本地日期将它们保存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。记忆捕获在后台运行，因此 `/new` 和 `/reset` 确认不会被转录读取或可选的 slug 生成延迟。设置 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已配置的模型生成描述性文件名 slug（不可用时回退到时间戳 slug）。需要配置 `workspace.dir`。

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

`patterns` 和 `files` 可作为 `paths` 的别名。路径相对于工作区解析，并且必须保持在工作区内。只会加载已识别的引导基名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 详情

将每个斜杠命令作为 JSON 行（时间戳、操作、会话键、发送者 ID、来源）记录到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 详情

当 OpenClaw 开始和完成压缩会话转录时，向当前对话发送简短状态消息。这会让聊天界面上的长轮次更不容易令人困惑，因为用户可以看到助手正在汇总上下文，并会在压缩后继续。

<a id="boot-md"></a>

### boot-md 详情

在 Gateway 网关启动时为每个已配置的 Agent 权限范围运行 `BOOT.md`，前提是该文件存在于该 Agent 解析后的工作区中。

## 插件钩子

插件可以通过插件 SDK 注册类型化钩子，以实现更深入的集成：
拦截工具调用、修改提示词、控制消息流等。
当你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他进程内生命周期钩子时，请使用插件钩子。

插件管理的内部钩子有所不同：它们参与本页面的
粗粒度命令/生命周期事件系统，并在 `openclaw hooks list` 中显示为
`plugin:<id>`。请将这些钩子用于副作用以及与钩子包的兼容性，而不是
用于有序中间件或策略门控。

完整的插件钩子参考见 [插件钩子](/zh-CN/plugins/hooks)。

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

每个钩子的环境值会满足钩子的 `requires.env` 资格检查（与进程环境一起），处理程序可以从其钩子配置条目中读取它们：

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

额外钩子目录：

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
为向后兼容，仍支持旧版 `hooks.internal.handlers` 数组配置格式，但新钩子应使用基于发现的系统。
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

- **保持处理程序快速。** 钩子会在命令处理期间运行。对繁重工作使用 `void processInBackground(event)` 触发后即忘。
- **优雅处理错误。** 将有风险的操作包在 try/catch 中；不要抛出异常，这样其他处理程序仍可运行。
- **尽早过滤事件。** 如果事件类型/操作不相关，立即返回。
- **使用具体的事件键。** 优先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以减少开销。

## 故障排查

### 未发现钩子

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### 钩子不符合资格

```bash
openclaw hooks info my-hook
```

检查是否缺少二进制文件（PATH）、环境变量、配置值或操作系统兼容性。

### 钩子未执行

1. 验证钩子已启用：`openclaw hooks list`
2. 重启你的 Gateway 网关进程，以便重新加载钩子。
3. 检查 Gateway 网关日志：`openclaw logs --follow | grep -i hook`

## 相关

- [CLI 参考：hooks](/zh-CN/cli/hooks)
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- [插件钩子](/zh-CN/plugins/hooks) — 进程内插件生命周期钩子
- [配置](/zh-CN/gateway/configuration-reference#hooks)
