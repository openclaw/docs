---
read_when:
    - 你想要针对 /new、/reset、/stop 和智能体生命周期事件的事件驱动自动化
    - 你想构建、安装或调试 Hooks
summary: Hooks：用于命令和生命周期事件的事件驱动自动化
title: Hooks
x-i18n:
    generated_at: "2026-07-06T10:46:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59dbead00dcdbd90532643e79f3e66bcc1ecc3a2e474c8d3d2916b47530178a2
    source_path: automation/hooks.md
    workflow: 16
---

Hooks 是在智能体事件触发时在 Gateway 网关内部运行的小脚本：例如 `/new`、`/reset`、`/stop` 等命令、会话压缩、Gateway 网关生命周期和消息流。它们从目录中发现，并通过 `openclaw hooks` 管理。只有在你启用 Hooks，或配置至少一个钩子条目、钩子包、旧版处理程序或额外钩子目录之后，Gateway 网关才会加载内部钩子。

OpenClaw 中有两类钩子：

- **内部钩子**（本页）：在智能体事件触发时在 Gateway 网关内部运行。
- **Webhooks**：外部 HTTP 端点，允许其他系统在 OpenClaw 中触发工作。请参阅 [Webhooks](/zh-CN/automation/cron-jobs#webhooks)。

钩子也可以打包在插件中。`openclaw hooks list` 会显示独立钩子和插件管理的钩子（显示为 `plugin:<id>`）。

## 选择正确的扩展面

OpenClaw 有几个看起来相似但解决不同问题的扩展面：

| 如果你想要...                                                                                                     | 使用...                                | 原因                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 上保存快照、记录 `/reset`、在 `message:sent` 后调用外部 API，或添加粗粒度操作员自动化 | 内部钩子（`HOOK.md`，本页） | 基于文件的钩子用于操作员管理的副作用以及命令/生命周期自动化 |
| 重写提示、阻止工具、取消出站消息，或添加有序中间件/策略                              | 通过 `api.on(...)` 使用类型化插件钩子  | 类型化钩子具有显式契约、优先级、合并规则以及阻止/取消语义      |
| 添加仅遥测的导出或可观测性                                                                            | 诊断事件                     | 可观测性是独立的事件总线，不是策略钩子扩展面                              |

当你想要像小型已安装集成一样运行的自动化时，请使用内部钩子。当你需要运行时生命周期控制时，请使用类型化插件钩子。

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

钩子订阅此表中的特定键，或订阅裸的族名称
（`command`、`session`、`agent`、`gateway`、`message`）以接收该族中的每个动作。OpenClaw 核心不会发出其他内容，因此任何其他名称几乎总是拼写错误，会让钩子静默失效（只有发出自定义事件的插件才可能触发它）。钩子加载器会为此类名称记录警告
（例如 `command:nwe`），并且 `openclaw hooks info <name>` 会标记它们，因此可以诊断从不运行的钩子。

| 事件                    | 触发时机                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 发出 `/new` 命令                                      |
| `command:reset`          | 发出 `/reset` 命令                                    |
| `command:stop`           | 发出 `/stop` 命令                                     |
| `command`                | 任意命令事件（通用监听器）                       |
| `session:compact:before` | 压缩汇总历史之前                       |
| `session:compact:after`  | 压缩完成之后                                 |
| `session:patch`          | 会话属性被修改时                       |
| `agent:bootstrap`        | 注入工作区引导文件之前              |
| `gateway:startup`        | 渠道启动且钩子加载之后                  |
| `gateway:shutdown`       | Gateway 网关关闭开始时                               |
| `gateway:pre-restart`    | 预期的 Gateway 网关重启之前                         |
| `message:received`       | 来自任意渠道的入站消息                           |
| `message:transcribed`    | 音频转录完成之后                        |
| `message:preprocessed`   | 媒体和链接预处理完成或被跳过之后 |
| `message:sent`           | 尝试出站发送（`context.success` 包含结果） |

## 编写钩子

### 钩子结构

每个钩子都是一个包含两个文件的目录：

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

处理程序文件可以是 `handler.ts`、`handler.js`、`index.ts` 或 `index.js`。

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
| `emoji`    | CLI 显示用 emoji                                |
| `events`   | 要监听的事件数组                        |
| `export`   | 要使用的命名导出（默认为 `"default"`）        |
| `os`       | 所需平台（例如 `["darwin", "linux"]`）     |
| `requires` | 所需的 `bins`、`anyBins`、`env` 或 `config` 路径 |
| `always`   | 绕过资格检查（布尔值）                  |
| `hookKey`  | 配置键覆盖（默认为钩子名称）      |
| `homepage` | `openclaw hooks info` 显示的文档 URL              |
| `install`  | 安装方法                                 |

### 处理程序实现

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

每个事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages` 和 `context`（事件特定数据）。用于智能体和工具钩子的类型化插件钩子上下文也可以包含 `trace`，这是一个只读的 W3C 兼容诊断追踪上下文，插件可将其传入结构化日志以进行 OTEL 关联。

推送到 `event.messages` 的字符串只会在
`command:new` 和 `command:reset`（作为对原始
会话的回复路由）以及 `session:compact:before` / `session:compact:after`
（作为压缩状态通知发送）时返回到聊天。所有其他事件，包括
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch` 和
`gateway:*`，都会忽略推送的消息。

### 事件上下文要点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**命令事件**（`command:stop`）：`context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定数据，包括 `senderId`、`senderName`、`guildId`）。对于类似命令的消息，`context.content` 优先使用非空命令正文，然后回退到原始入站正文和通用正文；它不包含仅智能体使用的增强内容，例如线程历史或链接摘要。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`，以及发送失败时的 `context.error`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强正文）、`context.from`、`context.channelId`。

**引导事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅已更改字段）、`context.cfg`。只有特权客户端可以触发补丁事件；上下文是一个克隆，因此处理程序不能改变实时会话条目。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 会添加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 观察用户发出 `/stop`；它是取消/命令
生命周期，而不是智能体最终化关口。需要检查自然最终答案并要求智能体再执行一轮的插件，应改用类型化
插件钩子 `before_agent_finalize`。请参阅 [插件钩子](/zh-CN/plugins/hooks)。

**Gateway 网关生命周期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，并在 Gateway 网关关闭开始时触发。`gateway:pre-restart` 包含相同上下文，但只在关闭是预期重启的一部分且提供了有限的 `restartExpectedMs` 值时触发。关闭期间，每个生命周期钩子的等待都是尽力而为且有边界的，因此如果处理程序停滞，关闭仍会继续。默认等待预算为 `gateway:shutdown` 5 秒，`gateway:pre-restart` 10 秒。

当渠道仍然可用时，使用 `gateway:pre-restart` 发送简短重启通知：

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

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件与其余关闭序列之间，Gateway 网关还会为进程停止时仍处于活动状态的每个会话触发一个类型化 `session_end` 插件钩子。对于普通的 SIGTERM/SIGINT 停止，事件的 `reason` 为 `shutdown`；当关闭被安排为预期重启的一部分时为 `restart`。此排空过程有边界，因此缓慢的 `session_end` 处理程序无法阻止进程退出；已经通过替换 / 重置 / 删除 / 压缩最终化的会话会被跳过，以避免重复触发。

## 钩子发现

钩子从四个来源发现：

1. **内置钩子**：随 OpenClaw 一起发布
2. **插件钩子**：打包在已安装的插件内部；可以覆盖同名内置钩子
3. **托管钩子**：`~/.openclaw/hooks/`（用户安装，跨工作区共享）；可以覆盖内置钩子和插件钩子。来自 `hooks.internal.load.extraDirs` 的额外目录共享此优先级。
4. **工作区钩子**：`<workspace>/hooks/`（按智能体配置，默认禁用，直到显式启用）

工作区钩子可以添加新的钩子名称，但不能覆盖同名的内置钩子、托管钩子或插件提供的钩子。

Gateway 网关在启动时会跳过内部钩子发现，直到配置了内部钩子。使用 `openclaw hooks enable <name>` 启用内置钩子或托管钩子、安装钩子包，或设置 `hooks.internal.enabled=true` 以选择加入。当你启用一个命名钩子时，Gateway 网关只加载该钩子的处理程序；`hooks.internal.enabled=true`、额外钩子目录和旧版处理程序会选择加入广泛发现。

### 钩子包

钩子包是通过 `package.json` 中的 `openclaw.hooks` 导出钩子的 npm 包。安装方式：

```bash
openclaw plugins install <path-or-spec>
```

Npm 规格仅限 registry（包名 + 可选的精确版本或 dist-tag）。Git/URL/file 规格和 semver 范围会被拒绝。较旧的 `openclaw hooks install` 和 `openclaw hooks update` 命令是 `openclaw plugins install` / `openclaw plugins update` 的已弃用别名。

## 内置钩子

| 钩子                  | 事件                                            | 作用                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 将会话上下文保存到 `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 从 glob 模式注入额外的 bootstrap 文件          |
| command-logger        | `command`                                         | 将所有命令记录到 `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在会话压缩开始/结束时发送可见的聊天通知 |
| boot-md               | `gateway:startup`                                 | 在 Gateway 网关启动时运行 `BOOT.md`                         |

启用任意内置钩子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 详情

提取最后的用户/助手消息（默认 15 条，可通过 `hooks.internal.entries.session-memory.messages` 配置），并使用主机本地日期将它们保存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。记忆捕获会在后台运行，因此 `/new` 和 `/reset` 确认不会被转录读取或可选 slug 生成延迟。设置 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已配置的模型生成描述性文件名 slug（不可用时回退到时间戳 slug）。需要配置 `workspace.dir`。

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

`patterns` 和 `files` 可作为 `paths` 的别名使用。路径相对于工作区解析，并且必须保持在工作区内部。只会加载可识别的 bootstrap 基本文件名（`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 详情

将每个斜杠命令作为 JSON 行（时间戳、操作、会话键、发送者 ID、来源）记录到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 详情

当 OpenClaw 开始和完成压缩会话转录时，向当前对话发送简短状态消息。这会让聊天界面上的长轮次不那么令人困惑，因为用户可以看到助手正在总结上下文，并会在压缩后继续。

<a id="boot-md"></a>

### boot-md 详情

在 Gateway 网关启动时，为每个已配置的智能体权限范围运行 `BOOT.md`，前提是该文件存在于该智能体解析后的工作区中。

## 插件钩子

插件可以通过插件 SDK 注册类型化钩子，以实现更深度的集成：
拦截工具调用、修改提示词、控制消息流等。
当你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他进程内生命周期钩子时，请使用插件钩子。

插件管理的内部钩子有所不同：它们参与本页的
粗粒度命令/生命周期事件系统，并在 `openclaw hooks list` 中显示为
`plugin:<id>`。这些钩子用于副作用以及与钩子包兼容，而不是
用于有序中间件或策略门控。

完整的插件钩子参考，请参阅 [插件钩子](/zh-CN/plugins/hooks)。

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

按钩子配置的环境值会满足钩子的 `requires.env` 资格检查（与进程环境一起），处理器也可以从其钩子配置条目中读取这些值：

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

额外的钩子目录：

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
旧版 `hooks.internal.handlers` 数组配置格式仍受支持以实现向后兼容，但新钩子应使用基于发现的系统。
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

- **保持处理器快速。** 钩子会在命令处理期间运行。使用 `void processInBackground(event)` 启动重型工作并不等待。
- **优雅处理错误。** 将有风险的操作包装在 try/catch 中；不要抛出错误，这样其他处理器才能运行。
- **尽早筛选事件。** 如果事件类型/操作不相关，请立即返回。
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

检查是否缺少二进制文件（PATH）、环境变量、配置值或 OS 兼容性。

### 钩子未执行

1. 验证钩子已启用：`openclaw hooks list`
2. 重启你的 Gateway 网关进程，以便重新加载钩子。
3. 检查 Gateway 网关日志：`openclaw logs --follow | grep -i hook`

## 相关

- [CLI 参考：hooks](/zh-CN/cli/hooks)
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- [插件钩子](/zh-CN/plugins/hooks) — 进程内插件生命周期钩子
- [配置](/zh-CN/gateway/configuration-reference#hooks)
