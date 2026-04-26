---
read_when:
    - 你希望为 `/new`、`/reset`、`/stop` 和智能体生命周期事件提供事件驱动的自动化功能
    - 你想要构建、安装或调试钩子
summary: 钩子：用于命令和生命周期事件的事件驱动自动化
title: 钩子
x-i18n:
    generated_at: "2026-04-26T23:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1f9b1dc0c470502f782758e1542435f1e593750ff69a39f7f966c7d42e29c1e
    source_path: automation/hooks.md
    workflow: 15
---

钩子是在 Gateway 网关内部发生某些事件时运行的小型脚本。它们可以从目录中被发现，并可通过 `openclaw hooks` 进行检查。只有在你启用钩子，或至少配置了一个钩子条目、hook pack、旧版处理器或额外钩子目录后，Gateway 网关才会加载内部钩子。

OpenClaw 中有两种钩子：

- **内部钩子**（本页）：当智能体事件触发时在 Gateway 网关内部运行，例如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **Webhooks**：外部 HTTP 端点，让其他系统可以在 OpenClaw 中触发工作。参见 [Webhooks](/zh-CN/automation/cron-jobs#webhooks)。

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

| 事件 | 触发时机 |
| ------------------------ | ------------------------------------------------ |
| `command:new` | 发出 `/new` 命令时 |
| `command:reset` | 发出 `/reset` 命令时 |
| `command:stop` | 发出 `/stop` 命令时 |
| `command` | 任意命令事件（通用监听器） |
| `session:compact:before` | 压缩开始汇总历史记录之前 |
| `session:compact:after` | 压缩完成之后 |
| `session:patch` | 修改会话属性时 |
| `agent:bootstrap` | 注入工作区 bootstrap 文件之前 |
| `gateway:startup` | 渠道启动且钩子加载完成之后 |
| `message:received` | 从任意渠道收到入站消息 |
| `message:transcribed` | 音频转录完成之后 |
| `message:preprocessed` | 所有媒体和链接理解完成之后 |
| `message:sent` | 出站消息已送达 |

## 编写钩子

### 钩子结构

每个钩子都是一个包含两个文件的目录：

```
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # 处理器实现
```

### `HOOK.md` 格式

```markdown
---
name: my-hook
description: "这个钩子的简短说明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

这里填写详细文档。
```

**元数据字段**（`metadata.openclaw`）：

| 字段 | 说明 |
| ---------- | ---------------------------------------------------- |
| `emoji` | CLI 中显示的 emoji |
| `events` | 要监听的事件数组 |
| `export` | 要使用的命名导出（默认是 `"default"`） |
| `os` | 所需平台（例如 `["darwin", "linux"]`） |
| `requires` | 所需的 `bins`、`anyBins`、`env` 或 `config` 路径 |
| `always` | 跳过资格检查（布尔值） |
| `install` | 安装方式 |

### 处理器实现

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // 你的逻辑写在这里

  // 可选：向用户发送消息
  event.messages.push("Hook executed!");
};

export default handler;
```

每个事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（可 push 以发送给用户）以及 `context`（事件特定数据）。智能体和工具插件的钩子上下文还可以包含 `trace`，这是一个只读、兼容 W3C 的诊断追踪上下文，插件可以将其传入结构化日志中，以便与 OTEL 进行关联。

### 事件上下文重点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定数据，包括 `senderId`、`senderName`、`guildId`）。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强后的正文）、`context.from`、`context.channelId`。

**Bootstrap 事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅包含变更字段）、`context.cfg`。只有特权客户端可以触发补丁事件。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 还会增加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 观察的是用户发出 `/stop`；它属于取消/命令生命周期，而不是智能体最终完成的关卡。需要检查自然结束答案并让智能体再进行一轮处理的插件，应改用类型化插件钩子 `before_agent_finalize`。参见 [Plugin hooks](/zh-CN/plugins/hooks)。

## 钩子发现

钩子会按以下目录进行发现，覆盖优先级依次递增：

1. **内置钩子**：随 OpenClaw 一起发布
2. **插件钩子**：内置在已安装插件中的钩子
3. **托管钩子**：`~/.openclaw/hooks/`（用户安装，在各工作区间共享）。来自 `hooks.internal.load.extraDirs` 的额外目录与此具有相同优先级。
4. **工作区钩子**：`<workspace>/hooks/`（每个智能体单独使用，默认禁用，需显式启用）

工作区钩子可以新增钩子名称，但不能覆盖同名的内置钩子、托管钩子或插件提供的钩子。

在配置内部钩子之前，Gateway 网关会在启动时跳过内部钩子发现。你可以通过 `openclaw hooks enable <name>` 启用一个内置或托管钩子，安装一个 hook pack，或设置 `hooks.internal.enabled=true` 来主动启用。启用某个具名钩子后，Gateway 网关只会加载该钩子的处理器；而 `hooks.internal.enabled=true`、额外钩子目录和旧版处理器则会启用更广泛的发现机制。

### Hook packs

Hook pack 是通过 `package.json` 中的 `openclaw.hooks` 导出钩子的 npm 包。安装方式如下：

```bash
openclaw plugins install <path-or-spec>
```

npm spec 仅支持注册表来源（包名 + 可选精确版本或 dist-tag）。Git/URL/file spec 和 semver 范围都会被拒绝。

## 内置钩子

| 钩子 | 事件 | 功能 |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory | `command:new`, `command:reset` | 将会话上下文保存到 `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap` | 从 glob 模式注入额外的 bootstrap 文件 |
| command-logger | `command` | 将所有命令记录到 `~/.openclaw/logs/commands.log` |
| boot-md | `gateway:startup` | 在网关启动时运行 `BOOT.md` |

启用任意内置钩子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### `session-memory` 详情

提取最近 15 条用户/assistant 消息，通过 LLM 生成描述性文件名 slug，并使用主机本地日期保存到 `<workspace>/memory/YYYY-MM-DD-slug.md`。要求配置 `workspace.dir`。

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

路径相对于工作区解析。仅会加载已识别的 bootstrap 基础文件名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### `command-logger` 详情

将每个斜杠命令记录到 `~/.openclaw/logs/commands.log`。

<a id="boot-md"></a>

### `boot-md` 详情

在 Gateway 网关启动时，从当前活动工作区运行 `BOOT.md`。

## 插件钩子

插件可以通过插件 SDK 注册类型化钩子，以实现更深层的集成：拦截工具调用、修改提示词、控制消息流等。
当你需要 `before_tool_call`、`before_agent_reply`、`before_install` 或其他进程内生命周期钩子时，请使用插件钩子。

完整的插件钩子参考请参见 [Plugin hooks](/zh-CN/plugins/hooks)。

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
旧版 `hooks.internal.handlers` 数组配置格式仍然受支持，以保持向后兼容，但新钩子应使用基于发现的系统。
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

- **保持处理器快速。** 钩子会在命令处理期间运行。对较重的工作请使用 `void processInBackground(event)` 以即发即忘方式处理。
- **优雅地处理错误。** 用 try/catch 包裹高风险操作；不要抛出异常，以便其他处理器继续运行。
- **尽早过滤事件。** 如果事件类型/动作无关，请立即返回。
- **使用具体事件键。** 优先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以减少开销。

## 故障排除

### 钩子未被发现

```bash
# 验证目录结构
ls -la ~/.openclaw/hooks/my-hook/
# 应显示：HOOK.md, handler.ts

# 列出所有已发现的钩子
openclaw hooks list
```

### 钩子不符合条件

```bash
openclaw hooks info my-hook
```

检查是否缺少二进制文件（PATH）、环境变量、配置值或操作系统兼容性。

### 钩子未执行

1. 确认钩子已启用：`openclaw hooks list`
2. 重启你的网关进程以重新加载钩子。
3. 检查网关日志：`./scripts/clawlog.sh | grep hook`

## 相关内容

- [CLI 参考：hooks](/zh-CN/cli/hooks)
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- [Plugin hooks](/zh-CN/plugins/hooks) — 进程内插件生命周期钩子
- [配置](/zh-CN/gateway/configuration-reference#hooks)
