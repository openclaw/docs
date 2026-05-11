---
read_when:
    - 你想要用于 /new、/reset、/stop 和智能体生命周期事件的事件驱动自动化
    - 你想构建、安装或调试钩子
summary: 钩子：用于命令和生命周期事件的事件驱动自动化
title: 钩子
x-i18n:
    generated_at: "2026-05-11T20:20:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

钩子是在 Gateway 网关内部发生某些事件时运行的小脚本。它们可以从目录中发现，并可通过 `openclaw hooks` 检查。只有在你启用钩子，或配置了至少一个钩子条目、钩子包、旧版处理器或额外钩子目录之后，Gateway 网关才会加载内部钩子。

OpenClaw 中有两种钩子：

- **内部钩子**（本页）：当智能体事件触发时在 Gateway 网关内部运行，例如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **网络钩子**：外部 HTTP 端点，可让其他系统触发 OpenClaw 中的工作。参见 [网络钩子](/zh-CN/automation/cron-jobs#webhooks)。

钩子也可以内置在插件中。`openclaw hooks list` 会同时显示独立钩子和插件管理的钩子。

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

| 事件                     | 触发时机                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 发出 `/new` 命令                                           |
| `command:reset`          | 发出 `/reset` 命令                                         |
| `command:stop`           | 发出 `/stop` 命令                                          |
| `command`                | 任意命令事件（通用监听器）                                 |
| `session:compact:before` | 压缩开始总结历史之前                                       |
| `session:compact:after`  | 压缩完成之后                                               |
| `session:patch`          | 会话属性被修改时                                           |
| `agent:bootstrap`        | 工作区引导文件被注入之前                                   |
| `gateway:startup`        | 渠道启动且钩子加载之后                                     |
| `gateway:shutdown`       | Gateway 网关关闭开始时                                     |
| `gateway:pre-restart`    | 预期的 Gateway 网关重启之前                                |
| `message:received`       | 来自任意渠道的入站消息                                     |
| `message:transcribed`    | 音频转写完成之后                                           |
| `message:preprocessed`   | 媒体和链接预处理完成或被跳过之后                           |
| `message:sent`           | 出站消息已送达                                             |

## 编写钩子

### 钩子结构

每个钩子都是一个包含两个文件的目录：

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

| 字段       | 描述                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 中显示的表情符号                                 |
| `events`   | 要监听的事件数组                                     |
| `export`   | 要使用的命名导出（默认为 `"default"`）               |
| `os`       | 要求的平台（例如 `["darwin", "linux"]`）             |
| `requires` | 要求的 `bins`、`anyBins`、`env` 或 `config` 路径     |
| `always`   | 跳过资格检查（布尔值）                               |
| `install`  | 安装方法                                             |

### 处理器实现

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

每个事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（推入以发送给用户）以及 `context`（事件特定数据）。智能体和工具插件钩子上下文还可以包含 `trace`，这是一个只读、兼容 W3C 的诊断跟踪上下文，插件可将其传入结构化日志以进行 OTEL 关联。

### 事件上下文要点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定数据，包括 `senderId`、`senderName`、`guildId`）。`context.content` 会优先使用命令式消息中的非空命令正文，然后回退到原始入站正文和通用正文；它不包含仅面向智能体的增强内容，例如线程历史或链接摘要。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强正文）、`context.from`、`context.channelId`。

**引导事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅更改字段）、`context.cfg`。只有特权客户端可以触发补丁事件。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 会添加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 观察用户发出 `/stop`；它是取消/命令生命周期事件，
不是智能体最终化关口。需要检查自然最终答案并要求智能体再执行一次的插件，
应改用类型化插件钩子 `before_agent_finalize`。参见 [插件钩子](/zh-CN/plugins/hooks)。

**Gateway 网关生命周期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，并在 Gateway 网关关闭开始时触发。`gateway:pre-restart` 包含相同上下文，但只会在关闭属于预期重启的一部分，且提供了有限的 `restartExpectedMs` 值时触发。在关闭期间，每个生命周期钩子的等待都是尽力而为且有界的，因此即使处理器卡住，关闭也会继续。

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件与关闭序列其余部分之间，Gateway 网关还会为进程停止时仍处于活动状态的每个会话触发类型化的 `session_end` 插件钩子。普通 SIGTERM/SIGINT 停止时，事件的 `reason` 为 `shutdown`；当关闭是作为预期重启的一部分排程时，则为 `restart`。此排空过程有界，因此缓慢的 `session_end` 处理器无法阻塞进程退出；并且已经通过替换 / 重置 / 删除 / 压缩完成最终化的会话会被跳过，以避免重复触发。

## 钩子发现

钩子会按覆盖优先级递增的顺序从以下目录发现：

1. **内置钩子**：随 OpenClaw 发布
2. **插件钩子**：内置在已安装插件中的钩子
3. **托管钩子**：`~/.openclaw/hooks/`（用户安装，跨工作区共享）。来自 `hooks.internal.load.extraDirs` 的额外目录共享此优先级。
4. **工作区钩子**：`<workspace>/hooks/`（按智能体划分，默认禁用，直到显式启用）

工作区钩子可以添加新的钩子名称，但不能覆盖同名的内置钩子、托管钩子或插件提供的钩子。

在配置内部钩子之前，Gateway 网关会在启动时跳过内部钩子发现。使用 `openclaw hooks enable <name>` 启用内置或托管钩子，安装钩子包，或设置 `hooks.internal.enabled=true` 以选择加入。启用一个具名钩子时，Gateway 网关只会加载该钩子的处理器；`hooks.internal.enabled=true`、额外钩子目录和旧版处理器会选择加入广泛发现。

### 钩子包

钩子包是通过 `package.json` 中的 `openclaw.hooks` 导出钩子的 npm 包。使用以下命令安装：

```bash
openclaw plugins install <path-or-spec>
```

npm 规格仅限注册表（包名 + 可选精确版本或 dist-tag）。Git/URL/file 规格和 semver 范围会被拒绝。

## 内置钩子

| 钩子                  | 事件                                              | 作用                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`、`command:reset`                    | 将会话上下文保存到 `<workspace>/memory/`                       |
| bootstrap-extra-files | `agent:bootstrap`                                 | 从 glob 模式注入额外引导文件                                   |
| command-logger        | `command`                                         | 将所有命令记录到 `~/.openclaw/logs/commands.log`               |
| compaction-notifier   | `session:compact:before`、`session:compact:after` | 在会话压缩开始/结束时发送可见的聊天通知                        |
| boot-md               | `gateway:startup`                                 | Gateway 网关启动时运行 `BOOT.md`                               |

启用任意内置钩子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 详情

提取最近 15 条用户/助手消息，并使用主机本地日期保存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。记忆捕获在后台运行，因此 `/new` 和 `/reset` 的确认不会被转录读取或可选的 slug 生成延迟。设置 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已配置模型生成描述性文件名 slug。需要配置 `workspace.dir`。

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

路径相对于工作区解析。只加载已识别的引导基本文件名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 详情

将每个斜杠命令记录到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 详情

当 OpenClaw 开始和完成压缩会话转录时，向当前对话发送简短状态消息。这会让聊天界面上的长轮次不那么令人困惑，因为用户可以看到助手正在总结上下文，并会在压缩后继续。

<a id="boot-md"></a>

### boot-md 详情

Gateway 网关启动时，从活动工作区运行 `BOOT.md`。

## 插件钩子

插件可以通过插件 SDK 注册类型化钩子以实现更深度的集成：
拦截工具调用、修改提示、控制消息流等。
当你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他进程内生命周期钩子时，请使用插件钩子。

完整插件钩子参考见 [插件钩子](/zh-CN/plugins/hooks)。

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

按钩子设置的环境变量：

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
旧版 `hooks.internal.handlers` 数组配置格式仍然支持，用于向后兼容，但新的钩子应使用基于发现机制的系统。
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

- **保持处理器快速。** 钩子会在命令处理期间运行。使用 `void processInBackground(event)` 以即发即忘的方式执行繁重工作。
- **优雅处理错误。** 将有风险的操作包装在 try/catch 中；不要抛出异常，以便其他处理器可以运行。
- **尽早过滤事件。** 如果事件类型/动作不相关，立即返回。
- **使用具体的事件键。** 优先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以减少开销。

## 故障排除

### 未发现钩子

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### 钩子不符合条件

```bash
openclaw hooks info my-hook
```

检查缺失的二进制文件（PATH）、环境变量、配置值或 OS 兼容性。

### 钩子未执行

1. 确认钩子已启用：`openclaw hooks list`
2. 重启你的 Gateway 网关进程，使钩子重新加载。
3. 检查 Gateway 网关日志：`./scripts/clawlog.sh | grep hook`

## 相关

- [CLI 参考：hooks](/zh-CN/cli/hooks)
- [Webhook](/zh-CN/automation/cron-jobs#webhooks)
- [插件钩子](/zh-CN/plugins/hooks) — 进程内插件生命周期钩子
- [配置](/zh-CN/gateway/configuration-reference#hooks)
