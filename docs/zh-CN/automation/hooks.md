---
read_when:
    - 你想要用于 /new、/reset、/stop 和智能体生命周期事件的事件驱动自动化
    - 你想要构建、安装或调试钩子
summary: 钩子：用于命令和生命周期事件的事件驱动自动化
title: 钩子
x-i18n:
    generated_at: "2026-04-27T12:50:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 15
---

钩子是在 Gateway 网关内部发生某些事件时运行的小型脚本。它们可以从目录中被发现，并可使用 `openclaw hooks` 进行检查。只有在你启用钩子，或至少配置了一个钩子条目、钩子包、旧版处理器或额外挂钩目录后，Gateway 网关才会加载内部钩子。

OpenClaw 中有两种钩子：

- **内部钩子**（本页）：当智能体事件触发时在 Gateway 网关内部运行，例如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **Webhooks**：外部 HTTP 端点，允许其他系统在 OpenClaw 中触发工作。请参见 [Webhooks](/zh-CN/automation/cron-jobs#webhooks)。

钩子也可以内置在插件中。`openclaw hooks list` 会同时显示独立钩子和由插件管理的钩子。

## 快速开始

```bash
# 列出可用钩子
openclaw hooks list

# 启用一个钩子
openclaw hooks enable session-memory

# 检查钩子状态
openclaw hooks check

# 获取详细信息
openclaw hooks info session-memory
```

## 事件类型

| Event | 触发时机 |
| ------------------------ | ---------------------------------------------------------- |
| `command:new` | 发出 `/new` 命令时 |
| `command:reset` | 发出 `/reset` 命令时 |
| `command:stop` | 发出 `/stop` 命令时 |
| `command` | 任意命令事件（通用监听器） |
| `session:compact:before` | 压缩总结历史记录之前 |
| `session:compact:after` | 压缩完成之后 |
| `session:patch` | 修改会话属性时 |
| `agent:bootstrap` | 注入工作区引导文件之前 |
| `gateway:startup` | 渠道启动并加载钩子后 |
| `gateway:shutdown` | Gateway 网关开始关闭时 |
| `gateway:pre-restart` | 预期中的 Gateway 网关重启之前 |
| `message:received` | 来自任意渠道的入站消息 |
| `message:transcribed` | 音频转录完成后 |
| `message:preprocessed` | 媒体和链接预处理完成或被跳过后 |
| `message:sent` | 出站消息已送达 |

## 编写钩子

### 钩子结构

每个钩子都是一个包含两个文件的目录：

```text
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # 处理器实现
```

### `HOOK.md` 格式

```markdown
---
name: my-hook
description: "此钩子功能的简短描述"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

此处填写详细文档。
```

**元数据字段**（`metadata.openclaw`）：

| Field | 说明 |
| ---------- | ---------------------------------------------------- |
| `emoji` | 在 CLI 中显示的表情符号 |
| `events` | 要监听的事件数组 |
| `export` | 要使用的命名导出（默认是 `"default"`） |
| `os` | 所需平台（例如 `["darwin", "linux"]`） |
| `requires` | 所需的 `bins`、`anyBins`、`env` 或 `config` 路径 |
| `always` | 绕过资格检查（布尔值） |
| `install` | 安装方法 |

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

每个事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（向其中 push 可向用户发送消息）以及 `context`（事件特定数据）。智能体和工具插件的钩子上下文还可能包含 `trace`，这是只读的、兼容 W3C 的诊断追踪上下文，插件可以将其传入结构化日志中以进行 OTEL 关联。

### 事件上下文要点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定数据，包括 `senderId`、`senderName`、`guildId`）。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强后的正文）、`context.from`、`context.channelId`。

**引导事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅包含变更字段）、`context.cfg`。只有特权客户端才能触发补丁事件。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 还会新增 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 观察的是用户发出 `/stop`；它属于取消/命令生命周期，而不是智能体最终完成的拦截点。需要检查自然生成的最终答案并要求智能体再执行一轮的插件，应改用类型化插件钩子 `before_agent_finalize`。请参见 [Plugin hooks](/zh-CN/plugins/hooks)。

**Gateway 网关生命周期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，并在 Gateway 网关开始关闭时触发。`gateway:pre-restart` 包含相同上下文，但只会在关闭属于预期重启且提供了有限的 `restartExpectedMs` 值时触发。在关闭期间，每个生命周期钩子的等待都是尽力而为且有时间上限，因此如果处理器卡住，关闭流程仍会继续。

## 钩子发现

钩子会按以下目录进行发现，覆盖优先级依次升高：

1. **内置钩子**：随 OpenClaw 一起发布
2. **插件钩子**：内置在已安装插件中的钩子
3. **托管钩子**：`~/.openclaw/hooks/`（用户安装，在各工作区之间共享）。`hooks.internal.load.extraDirs` 中的额外目录具有相同优先级。
4. **工作区钩子**：`<workspace>/hooks/`（每个智能体单独配置，默认禁用，需显式启用）

工作区钩子可以添加新的钩子名称，但不能覆盖同名的内置钩子、托管钩子或插件提供的钩子。

在启动时，如果未配置内部钩子，Gateway 网关会跳过内部钩子发现。你可以通过 `openclaw hooks enable <name>` 启用一个内置或托管钩子、安装一个钩子包，或设置 `hooks.internal.enabled=true` 来选择启用。当你启用一个具名钩子时，Gateway 网关只会加载该钩子的处理器；而 `hooks.internal.enabled=true`、额外挂钩目录和旧版处理器则会启用广泛发现。

### 钩子包

钩子包是通过 `package.json` 中的 `openclaw.hooks` 导出钩子的 npm 包。安装方法：

```bash
openclaw plugins install <path-or-spec>
```

npm 规格仅支持 registry 形式（包名 + 可选的精确版本或 dist-tag）。Git/URL/file 规格和 semver 范围会被拒绝。

## 内置钩子

| Hook | Events | 作用 |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory | `command:new`, `command:reset` | 将会话上下文保存到 `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap` | 从 glob 模式注入额外的引导文件 |
| command-logger | `command` | 将所有命令记录到 `~/.openclaw/logs/commands.log` |
| boot-md | `gateway:startup` | 在 Gateway 网关启动时运行 `BOOT.md` |

启用任意内置钩子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### `session-memory` 详情

提取最近 15 条用户/助手消息，通过 LLM 生成描述性文件名 slug，并使用主机本地日期保存到 `<workspace>/memory/YYYY-MM-DD-slug.md`。要求已配置 `workspace.dir`。

<a id="bootstrap-extra-files"></a>

### `bootstrap-extra-files` 配置

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

路径相对于工作区解析。只会加载已识别的引导基础文件名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### `command-logger` 详情

将每个斜杠命令记录到 `~/.openclaw/logs/commands.log`。

<a id="boot-md"></a>

### `boot-md` 详情

在 Gateway 网关启动时，从当前活动工作区运行 `BOOT.md`。

## 插件钩子

插件可以通过 插件 SDK 注册类型化钩子，以进行更深层的集成：拦截工具调用、修改提示词、控制消息流等。
当你需要 `before_tool_call`、`before_agent_reply`、`before_install` 或其他进程内生命周期钩子时，请使用插件钩子。

完整的插件钩子参考，请参见 [Plugin hooks](/zh-CN/plugins/hooks)。

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

每个钩子的环境变量：

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

额外挂钩目录：

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
旧版的 `hooks.internal.handlers` 数组配置格式仍然受支持，以保持向后兼容，但新钩子应使用基于发现的系统。
</Note>

## CLI 参考

```bash
# 列出所有钩子（可添加 --eligible、--verbose 或 --json）
openclaw hooks list

# 显示某个钩子的详细信息
openclaw hooks info <hook-name>

# 显示资格摘要
openclaw hooks check

# 启用/禁用
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳实践

- **让处理器保持快速。** 钩子会在命令处理期间运行。对重量级工作使用 `void processInBackground(event)` 实现即发即弃。
- **优雅处理错误。** 将高风险操作包装在 try/catch 中；不要抛出异常，以便其他处理器可以继续运行。
- **尽早过滤事件。** 如果事件类型/动作无关，立即返回。
- **使用更具体的事件键。** 优先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以减少开销。

## 故障排除

### 未发现钩子

```bash
# 验证目录结构
ls -la ~/.openclaw/hooks/my-hook/
# 应显示：HOOK.md, handler.ts

# 列出所有已发现的钩子
openclaw hooks list
```

### 钩子不符合资格

```bash
openclaw hooks info my-hook
```

检查是否缺少二进制文件（PATH）、环境变量、配置值或操作系统兼容性。

### 钩子未执行

1. 验证钩子已启用：`openclaw hooks list`
2. 重启你的 Gateway 网关进程以重新加载钩子。
3. 检查 Gateway 网关日志：`./scripts/clawlog.sh | grep hook`

## 相关内容

- [CLI 参考：hooks](/zh-CN/cli/hooks)
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- [Plugin hooks](/zh-CN/plugins/hooks) —— 进程内插件生命周期钩子
- [配置](/zh-CN/gateway/configuration-reference#hooks)
