---
read_when:
    - 你想列出已存储的会话并查看最近活动
summary: CLI 参考：`openclaw sessions`（列出已存储的会话 + 用法）
title: 会话
x-i18n:
    generated_at: "2026-05-02T12:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8791a36fedc18a1c2d4144c3fd4faeaf8f5320676ceee76026959cbe2dc1873c
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已存储的对话会话。

会话列表不是渠道/提供商存活检查。它们显示来自会话存储的持久化对话行。安静的 Discord、Slack、Telegram 或其他渠道可以成功重新连接，但在处理消息之前不会创建新的会话行。当你需要实时渠道连接性时，请使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

范围选择：

- 默认：已配置的默认智能体存储
- `--verbose`：详细日志
- `--agent <id>`：一个已配置的智能体存储
- `--all-agents`：聚合所有已配置的智能体存储
- `--store <path>`：显式存储路径（不能与 `--agent` 或 `--all-agents` 组合使用）

为已存储的会话导出轨迹包：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是所有者批准执行请求后，`/export-trajectory` 斜杠命令使用的命令路径。输出目录始终解析到所选工作区下的 `.openclaw/trajectory-exports/` 内。

`openclaw sessions --all-agents` 读取已配置的智能体存储。Gateway 网关和 ACP 会话发现范围更广：它们还包括在默认 `agents/` 根目录或模板化 `session.store` 根目录下找到的仅磁盘存储。这些发现的存储必须解析为智能体根目录内的常规 `sessions.json` 文件；符号链接和根目录外路径会被跳过。

JSON 示例：

`openclaw sessions --all-agents --json`：

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## 清理维护

立即运行维护（而不是等待下一次写入周期）：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置：

- 范围说明：`openclaw sessions cleanup` 会维护会话存储、转录和轨迹附属文件。它不会清理 cron 运行日志（`cron/runs/<jobId>.jsonl`），这些日志由 [Cron 配置](/zh-CN/automation/cron-jobs#configuration)中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，并在 [Cron 维护](/zh-CN/automation/cron-jobs#maintenance)中说明。

- `--dry-run`：预览将会在不写入的情况下剪除/限制多少条目。
  - 在文本模式下，dry-run 会打印每个会话的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以便你查看哪些会保留、哪些会移除。
- `--enforce`：即使 `session.maintenance.mode` 为 `warn`，也应用维护。
- `--fix-missing`：移除转录文件缺失的条目，即使它们通常还不会因年龄/数量被剔除。
- `--active-key <key>`：保护特定活跃键不受磁盘预算驱逐。持久外部对话指针（例如群组会话和线程范围的聊天会话）也会通过年龄/数量/磁盘预算维护保留。
- `--agent <id>`：为一个已配置的智能体存储运行清理。
- `--all-agents`：为所有已配置的智能体存储运行清理。
- `--store <path>`：针对特定 `sessions.json` 文件运行。
- `--json`：打印 JSON 摘要。使用 `--all-agents` 时，输出会包含每个存储的一份摘要。

当 Gateway 网关可达时，对已配置的智能体存储执行清理会通过 Gateway 网关发送，以便它与运行时流量共享同一个会话存储写入器。使用 `--store <path>` 对存储文件进行显式离线修复。

`openclaw sessions cleanup --all-agents --dry-run --json`：

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

相关：

- 会话配置：[配置参考](/zh-CN/gateway/config-agents#session)

## 相关

- [CLI 参考](/zh-CN/cli)
- [会话管理](/zh-CN/concepts/session)
