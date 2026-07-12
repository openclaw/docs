---
read_when:
    - 你希望为 /new、/reset、/stop 和智能体生命周期事件实现事件驱动的自动化
    - 你想要构建、安装或调试 Hooks
summary: Hooks：面向命令和生命周期事件的事件驱动自动化
title: Hooks
x-i18n:
    generated_at: "2026-07-12T14:17:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooks 是在智能体事件触发时于 Gateway 网关内部运行的小型脚本：这些事件包括 `/new`、`/reset`、`/stop` 等命令、会话压缩、Gateway 网关生命周期和消息流。系统会从目录中发现这些脚本，并通过 `openclaw hooks` 进行管理。只有当你启用 Hooks，或配置至少一个 Hook 条目、Hook 包、旧版处理程序或额外 Hook 目录后，Gateway 网关才会加载内部 Hooks。

OpenClaw 中有两种 Hooks：

- **内部钩子**（本页）：在智能体事件触发时于 Gateway 网关内部运行。
- **Webhooks**：外部 HTTP 端点，允许其他系统触发 OpenClaw 中的工作。请参阅 [Webhooks](/zh-CN/automation/cron-jobs#webhooks)。

Hooks 也可以内置在插件中。`openclaw hooks list` 会同时显示独立 Hooks 和由插件管理的 Hooks（显示为 `plugin:<id>`）。

## 选择正确的扩展接口

OpenClaw 提供了几种看似相似但解决不同问题的扩展接口：

| 如果你想要……                                                                                                     | 使用……                                | 原因                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 时保存快照、记录 `/reset`、在 `message:sent` 后调用外部 API，或添加粗粒度的操作员自动化 | 内部钩子（`HOOK.md`，本页） | 基于文件的 Hooks 适用于由操作员管理的副作用及命令/生命周期自动化 |
| 重写提示词、阻止工具、取消出站消息，或添加有序的中间件/策略                              | 通过 `api.on(...)` 使用类型化插件钩子  | 类型化 Hooks 具有明确的契约、优先级、合并规则以及阻止/取消语义      |
| 添加仅用于遥测的导出或可观测性                                                                            | 诊断事件                     | 可观测性使用独立的事件总线，并非策略 Hook 扩展接口                              |

如果你需要类似小型已安装集成的自动化，请使用内部 Hooks。如果你需要控制运行时生命周期，请使用类型化插件钩子。

## 快速开始

```bash
# 列出可用的 Hooks
openclaw hooks list

# 启用一个 Hook
openclaw hooks enable session-memory

# 检查 Hook 状态
openclaw hooks check

# 获取详细信息
openclaw hooks info session-memory
```

## 事件类型

Hooks 可订阅下表中的特定键，也可订阅不带操作名的事件族名称
（`command`、`session`、`agent`、`gateway`、`message`），以接收该事件族中的所有操作。
OpenClaw 核心不会发出除此之外的任何事件，因此其他名称几乎总是拼写错误，
会导致 Hook 在没有提示的情况下始终无法触发（只有插件发出的自定义事件才可能触发它）。
Hook 加载器会针对这类名称（例如 `command:nwe`）记录警告，
而 `openclaw hooks info <name>` 也会标记它们，因此可以诊断始终不运行的 Hook。

| 事件                    | 触发时机                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 发出 `/new` 命令时                                      |
| `command:reset`          | 发出 `/reset` 命令时                                    |
| `command:stop`           | 发出 `/stop` 命令时                                     |
| `command`                | 发生任何命令事件时（通用监听器）                       |
| `session:compact:before` | 压缩操作总结历史记录之前                       |
| `session:compact:after`  | 压缩完成之后                                 |
| `session:patch`          | 会话属性被修改时                       |
| `agent:bootstrap`        | 注入工作区引导文件之前              |
| `gateway:startup`        | 渠道启动且 Hooks 加载完成之后                  |
| `gateway:shutdown`       | Gateway 网关开始关闭时                               |
| `gateway:pre-restart`    | Gateway 网关按预期重启之前                         |
| `message:received`       | 从任意渠道收到入站消息时                           |
| `message:transcribed`    | 音频转录完成之后                        |
| `message:preprocessed`   | 媒体和链接预处理完成或被跳过之后 |
| `message:sent`           | 尝试发送出站消息时（结果位于 `context.success` 中） |

## 编写 Hooks

### Hook 结构

每个 Hook 都是一个包含两个文件的目录：

```text
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # 处理程序实现
```

处理程序文件可以是 `handler.ts`、`handler.js`、`index.ts` 或 `index.js`。

### HOOK.md 格式

```markdown
---
name: my-hook
description: "此 Hook 功能的简短说明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# 我的 Hook

详细文档写在这里。
```

**元数据字段**（`metadata.openclaw`）：

| 字段      | 说明                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 中显示的表情符号                                |
| `events`   | 要监听的事件数组                        |
| `export`   | 要使用的命名导出（默认为 `"default"`）        |
| `os`       | 所需平台（例如 `["darwin", "linux"]`）     |
| `requires` | 必需的 `bins`、`anyBins`、`env` 或 `config` 路径 |
| `always`   | 绕过适用性检查（布尔值）                  |
| `hookKey`  | 配置键覆盖值（默认为 Hook 名称）      |
| `homepage` | `openclaw hooks info` 显示的文档 URL              |
| `install`  | 安装方法                                 |

### 处理程序实现

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] 触发了新命令`);
  // 在此处编写你的逻辑

  // 可选择在支持回复的扩展接口上发送回复
  event.messages.push("Hook 已执行！");
};

export default handler;
```

每个事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages` 和 `context`（事件特定数据）。智能体和工具 Hooks 的类型化插件 Hook 上下文还可包含 `trace`，这是一个只读且兼容 W3C 的诊断跟踪上下文，插件可以将其传入结构化日志，以便与 OTEL 进行关联。

只有对于
`command:new` 和 `command:reset`（作为回复路由到发起命令的
对话）以及 `session:compact:before` / `session:compact:after`
（作为压缩状态通知发送），推送到 `event.messages` 的字符串才会传回聊天。
所有其他事件，包括
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch` 和
`gateway:*`，都会忽略推送的消息。

### 事件上下文要点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**命令事件**（`command:stop`）：`context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定的数据，包括 `senderId`、`senderName`、`guildId`）。对于类似命令的消息，`context.content` 会优先使用非空白的命令正文，然后回退到原始入站正文和通用正文；它不包含仅供智能体使用的增强信息，例如线程历史记录或链接摘要。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`；发送失败时还包括 `context.error`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强后的正文）、`context.from`、`context.channelId`。

**引导事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅包含已更改的字段）、`context.cfg`。只有特权客户端才能触发补丁事件；上下文是一个克隆副本，因此处理程序无法修改实时会话条目。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 还会添加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 观察用户发出 `/stop` 的操作；它属于取消/命令
生命周期，而不是智能体终结关卡。需要检查
自然生成的最终答案并要求智能体再执行一轮的插件，应改用类型化
插件钩子 `before_agent_finalize`。请参阅[插件钩子](/zh-CN/plugins/hooks)。

**Gateway 网关生命周期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，并在 Gateway 网关开始关闭时触发。`gateway:pre-restart` 包含相同的上下文，但仅在关闭属于预期重启的一部分且提供了有限的 `restartExpectedMs` 值时触发。在关闭期间，每个生命周期 Hook 的等待都是尽力而为且有时间上限的，因此即使某个处理程序停滞，关闭流程也会继续。`gateway:shutdown` 的默认等待时间预算为 5 秒，`gateway:pre-restart` 为 10 秒。

在渠道仍然可用时，使用 `gateway:pre-restart` 发送简短的重启通知：

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
    `Gateway 网关将在约 ${restartInSeconds} 秒后重启（${event.context.reason}）。请立即创建检查点。`,
  ]);
}
```

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件与后续关闭序列之间，Gateway 网关还会针对进程停止时仍处于活动状态的每个会话触发类型化的 `session_end` 插件钩子。对于普通的 SIGTERM/SIGINT 停止，该事件的 `reason` 为 `shutdown`；当关闭被计划为预期重启的一部分时，则为 `restart`。此排空过程有时间上限，因此缓慢的 `session_end` 处理程序不会阻止进程退出；已通过 replace / reset / delete / compaction 完成终结的会话会被跳过，以避免重复触发。

## Hook 发现

Hooks 从四个来源中发现：

1. **内置 Hooks**：随 OpenClaw 一起提供
2. **插件 Hooks**：内置于已安装的插件中；可以覆盖同名的内置 Hooks
3. **托管 Hooks**：`~/.openclaw/hooks/`（由用户安装，跨工作区共享）；可以覆盖内置 Hooks 和插件 Hooks。`hooks.internal.load.extraDirs` 中的额外目录具有相同的优先级。
4. **工作区 Hooks**：`<workspace>/hooks/`（按智能体配置，默认禁用，直到明确启用）

工作区 Hooks 可以添加新的 Hook 名称，但不能覆盖同名的内置、托管或插件提供的 Hooks。

在配置内部 Hooks 之前，Gateway 网关会在启动时跳过内部 Hook 发现。使用 `openclaw hooks enable <name>` 启用内置或托管 Hook、安装 Hook 包，或设置 `hooks.internal.enabled=true` 以选择启用。启用一个命名 Hook 时，Gateway 网关只会加载该 Hook 的处理程序；`hooks.internal.enabled=true`、额外 Hook 目录和旧版处理程序则会选择启用广泛发现。

### Hook 包

Hook 包是通过 `package.json` 中的 `openclaw.hooks` 导出 Hooks 的 npm 软件包。安装方式：

```bash
openclaw plugins install <path-or-spec>
```

Npm 规格仅限注册表（包名 + 可选的精确版本或 dist-tag）。Git/URL/文件规格和 semver 范围会被拒绝。旧版 `openclaw hooks install` 和 `openclaw hooks update` 命令已弃用，它们分别是 `openclaw plugins install` / `openclaw plugins update` 的别名。

## 内置钩子

| 钩子                  | 事件                                              | 作用                                                     |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 将会话上下文保存到 `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 从 glob 模式注入额外的引导文件                           |
| command-logger        | `command`                                         | 将所有命令记录到 `~/.openclaw/logs/commands.log`         |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 会话压缩开始/结束时发送可见的聊天通知                    |
| boot-md               | `gateway:startup`                                 | Gateway 网关启动时运行 `BOOT.md`                         |

启用任意内置钩子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 详情

提取最后的用户/助手消息（默认 15 条，可通过 `hooks.internal.entries.session-memory.messages` 配置），并使用主机本地日期将其保存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。记忆捕获在后台运行，因此读取对话记录或生成可选 slug 不会延迟 `/new` 和 `/reset` 的确认消息。将 `hooks.internal.entries.session-memory.llmSlug: true` 设为 true 可生成描述性文件名 slug，还可选择将 `hooks.internal.entries.session-memory.model` 设置为已配置的别名（如 `sonnet`）、智能体默认提供商上的裸模型 ID，或 `provider/model` 引用。省略 `model` 时，slug 生成会使用智能体的默认模型；如果不可用，则回退到时间戳 slug。需要配置 `workspace.dir`。

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

`patterns` 和 `files` 可作为 `paths` 的别名。路径相对于工作区解析，并且必须位于工作区内。仅加载可识别的引导文件基本名称（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 详情

将每个斜杠命令以 JSON 行的形式（时间戳、操作、会话键、发送者 ID、来源）记录到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 详情

当 OpenClaw 开始和完成压缩会话记录时，向当前对话发送简短状态消息。这能让聊天界面中的长轮次不那么令人困惑，因为用户可以看到助手正在总结上下文，并将在压缩后继续。

<a id="boot-md"></a>

### boot-md 详情

Gateway 网关启动时，如果每个已配置的智能体作用域所解析的工作区中存在 `BOOT.md`，则运行该文件。

## 插件钩子

插件可以通过插件 SDK 注册类型化钩子，以进行更深入的集成：
拦截工具调用、修改提示词、控制消息流等。
当你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他进程内生命周期钩子时，请使用插件钩子。

插件管理的内部钩子有所不同：它们参与本页面的
粗粒度命令/生命周期事件系统，并在 `openclaw hooks list` 中显示为
`plugin:<id>`。应将它们用于副作用以及与钩子包的兼容，而不是
有序中间件或策略关卡。

有关完整的插件钩子参考，请参阅[插件钩子](/zh-CN/plugins/hooks)。

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

每个钩子的环境值可满足该钩子的 `requires.env` 资格检查（与进程环境共同检查），处理器可以从钩子配置条目中读取这些值：

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
为了向后兼容，仍支持旧版 `hooks.internal.handlers` 数组配置格式，但新钩子应使用基于发现的系统。
</Note>

## CLI 参考

```bash
# 列出所有钩子（可添加 --eligible、--verbose 或 --json）
openclaw hooks list

# 显示钩子的详细信息
openclaw hooks info <hook-name>

# 显示资格摘要
openclaw hooks check

# 启用/禁用
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳实践

- **保持处理器快速运行。** 钩子在命令处理期间运行。使用 `void processInBackground(event)` 以即发即弃方式执行繁重工作。
- **妥善处理错误。** 使用 try/catch 包装风险操作；不要抛出异常，以便其他处理器可以运行。
- **尽早筛选事件。** 如果事件类型/操作不相关，请立即返回。
- **使用具体的事件键。** 优先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以减少开销。

## 故障排查

### 未发现钩子

```bash
# 验证目录结构
ls -la ~/.openclaw/hooks/my-hook/
# 应显示：HOOK.md、handler.ts

# 列出所有已发现的钩子
openclaw hooks list
```

### 钩子不符合条件

```bash
openclaw hooks info my-hook
```

检查是否缺少二进制文件（PATH）、环境变量、配置值或操作系统兼容性。

### 钩子未执行

1. 验证钩子已启用：`openclaw hooks list`
2. 重启 Gateway 网关进程以重新加载钩子。
3. 检查 Gateway 网关日志：`openclaw logs --follow | grep -i hook`

## 相关内容

- [CLI 参考：钩子](/zh-CN/cli/hooks)
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- [插件钩子](/zh-CN/plugins/hooks) — 进程内插件生命周期钩子
- [配置](/zh-CN/gateway/configuration-reference#hooks)
