---
read_when:
    - 你想为 /new、/reset、/stop 和智能体生命周期事件使用事件驱动自动化
    - 你想构建、安装或调试 hooks
summary: Hooks：用于命令和生命周期事件的事件驱动自动化
title: Hooks
x-i18n:
    generated_at: "2026-04-05T08:13:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooks 是在 Gateway 网关内部发生某些事件时运行的小型脚本。它们会从目录中自动发现，并且你可以使用 `openclaw hooks` 进行检查。

OpenClaw 中有两种 hooks：

- **内部 hooks**（本页）：当智能体事件触发时在 Gateway 网关内部运行，例如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **Webhooks**：外部 HTTP 端点，让其他系统在 OpenClaw 中触发工作流。参见 [Webhooks](/automation/cron-jobs#webhooks)。

Hooks 也可以内置在插件中。`openclaw hooks list` 会同时显示独立 hooks 和由插件管理的 hooks。

## 快速开始

```bash
# 列出可用 hooks
openclaw hooks list

# 启用一个 hook
openclaw hooks enable session-memory

# 检查 hook 状态
openclaw hooks check

# 获取详细信息
openclaw hooks info session-memory
```

## 事件类型

| Event                    | 触发时机 |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | 发出 `/new` 命令时 |
| `command:reset`          | 发出 `/reset` 命令时 |
| `command:stop`           | 发出 `/stop` 命令时 |
| `command`                | 任意命令事件（通用监听器） |
| `session:compact:before` | 压缩开始汇总历史记录之前 |
| `session:compact:after`  | 压缩完成之后 |
| `session:patch`          | 修改会话属性时 |
| `agent:bootstrap`        | 注入工作区 bootstrap 文件之前 |
| `gateway:startup`        | 渠道启动并加载 hooks 后 |
| `message:received`       | 来自任意渠道的入站消息 |
| `message:transcribed`    | 音频转写完成后 |
| `message:preprocessed`   | 所有媒体和链接理解完成后 |
| `message:sent`           | 出站消息已送达 |

## 编写 hooks

### Hook 结构

每个 hook 都是一个包含两个文件的目录：

```
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # 处理器实现
```

### HOOK.md 格式

```markdown
---
name: my-hook
description: "此 hook 的简短说明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

详细文档写在这里。
```

**元数据字段**（`metadata.openclaw`）：

| Field      | 说明 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 中显示的 emoji |
| `events`   | 要监听的事件数组 |
| `export`   | 要使用的具名导出（默认为 `"default"`） |
| `os`       | 所需平台（例如 `["darwin", "linux"]`） |
| `requires` | 所需的 `bins`、`anyBins`、`env` 或 `config` 路径 |
| `always`   | 绕过资格检查（布尔值） |
| `install`  | 安装方式 |

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

每个事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（push 后会发送给用户）以及 `context`（事件特定数据）。

### 事件上下文重点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（提供商特定数据，包括 `senderId`、`senderName`、`guildId`）。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强后的正文）、`context.from`、`context.channelId`。

**Bootstrap 事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话 patch 事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅包含变更字段）、`context.cfg`。只有特权客户端可以触发 patch 事件。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 额外包含 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

## Hook 发现

Hooks 会从以下目录中发现，优先级按覆盖能力递增排序：

1. **内置 hooks**：随 OpenClaw 一起提供
2. **插件 hooks**：内置在已安装插件中的 hooks
3. **托管 hooks**：`~/.openclaw/hooks/`（用户安装，在各工作区之间共享）。来自 `hooks.internal.load.extraDirs` 的额外目录也使用此优先级。
4. **工作区 hooks**：`<workspace>/hooks/`（每个智能体单独配置，默认禁用，需显式启用）

工作区 hooks 可以添加新的 hook 名称，但不能覆盖同名的内置、托管或插件提供的 hooks。

### Hook 包

Hook 包是通过 `package.json` 中的 `openclaw.hooks` 导出 hooks 的 npm 包。安装方式：

```bash
openclaw plugins install <path-or-spec>
```

Npm spec 仅支持 registry 形式（包名 + 可选的精确版本或 dist-tag）。Git/URL/file spec 和 semver 范围会被拒绝。

## 内置 hooks

| Hook                  | Events                         | 作用 |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | 将会话上下文保存到 `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | 从 glob 模式注入额外的 bootstrap 文件 |
| command-logger        | `command`                      | 将所有命令记录到 `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | 在 Gateway 网关启动时运行 `BOOT.md` |

启用任意内置 hook：

```bash
openclaw hooks enable <hook-name>
```

### session-memory 详情

提取最近 15 条用户/assistant 消息，通过 LLM 生成描述性文件名 slug，并保存到 `<workspace>/memory/YYYY-MM-DD-slug.md`。要求已配置 `workspace.dir`。

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

路径相对于工作区解析。仅会加载已识别的 bootstrap 基础文件名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

## 插件 hooks

插件可以通过插件 SDK 注册 hooks，以实现更深入的集成：拦截工具调用、修改提示词、控制消息流等。插件 SDK 暴露了 28 个 hooks，覆盖模型解析、智能体生命周期、消息流、工具执行、子智能体协调以及 Gateway 网关生命周期。

完整的插件 hook 参考，包括 `before_tool_call`、`before_agent_reply`、`before_install` 以及所有其他插件 hooks，请参阅 [插件架构](/plugins/architecture#provider-runtime-hooks)。

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
旧版 `hooks.internal.handlers` 数组配置格式仍然支持，以保持向后兼容，但新的 hooks 应使用基于发现的系统。
</Note>

## CLI 参考

```bash
# 列出所有 hooks（可添加 --eligible、--verbose 或 --json）
openclaw hooks list

# 显示某个 hook 的详细信息
openclaw hooks info <hook-name>

# 显示资格摘要
openclaw hooks check

# 启用/禁用
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳实践

- **让处理器保持快速。** Hooks 会在命令处理期间运行。对耗时任务使用 `void processInBackground(event)` 以即发即忘的方式处理。
- **优雅地处理错误。** 用 try/catch 包裹高风险操作；不要抛出异常，以便其他处理器继续运行。
- **尽早过滤事件。** 如果事件 type/action 不相关，立即返回。
- **使用具体事件键。** 优先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以减少开销。

## 故障排除

### 未发现 hook

```bash
# 验证目录结构
ls -la ~/.openclaw/hooks/my-hook/
# 应显示：HOOK.md, handler.ts

# 列出所有已发现的 hooks
openclaw hooks list
```

### hook 不符合条件

```bash
openclaw hooks info my-hook
```

检查是否缺少二进制文件（PATH）、环境变量、配置值或操作系统兼容性。

### hook 未执行

1. 确认 hook 已启用：`openclaw hooks list`
2. 重启你的 Gateway 网关进程，以便重新加载 hooks。
3. 检查 Gateway 网关日志：`./scripts/clawlog.sh | grep hook`

## 相关内容

- [CLI 参考：hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [插件架构](/plugins/architecture#provider-runtime-hooks) — 完整插件 hook 参考
- [配置](/gateway/configuration-reference#hooks)
