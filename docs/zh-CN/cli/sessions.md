---
read_when:
    - 你想列出已存储的会话并查看近期活动
summary: CLI 参考：`openclaw sessions`（列出已存储的会话 + 用法）
title: 会话
x-i18n:
    generated_at: "2026-05-05T06:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已存储的对话会话。

会话列表不是渠道/提供商的存活性检查。它们显示来自会话存储的持久化对话行。安静的 Discord、Slack、Telegram 或其他渠道可以成功重新连接，而不会创建新的会话行，直到处理了一条消息。当你需要实时渠道连接状态时，请使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

`openclaw sessions` 和 Gateway 网关 `sessions.list` 响应默认有边界限制，因此大型长期存储无法独占 CLI 进程或 Gateway 网关事件循环。CLI 默认返回最新的 100 个会话；传入 `--limit <n>` 可使用更小/更大的窗口，或者在你确实需要完整存储时传入 `--limit all`。当调用方需要显示还存在更多行时，JSON 响应会包含 `totalCount`、`limitApplied` 和 `hasMore`。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

范围选择：

- 默认：已配置的默认智能体存储
- `--verbose`：详细日志
- `--agent <id>`：一个已配置的智能体存储
- `--all-agents`：聚合所有已配置的智能体存储
- `--store <path>`：显式存储路径（不能与 `--agent` 或 `--all-agents` 组合）
- `--limit <n|all>`：要输出的最大行数（默认 `100`；`all` 恢复完整输出）

为已存储的会话导出轨迹包：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是 `/export-trajectory` 斜杠命令在所有者批准 exec 请求后使用的命令路径。输出目录始终解析到所选工作区下的 `.openclaw/trajectory-exports/` 内部。

`openclaw sessions --all-agents` 读取已配置的智能体存储。Gateway 网关和 ACP 会话发现范围更广：它们还会包含在默认 `agents/` 根目录或模板化 `session.store` 根目录下找到的仅磁盘存储。这些发现的存储必须解析为智能体根目录内的常规 `sessions.json` 文件；符号链接和根目录外路径会被跳过。

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
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## 清理维护

立即运行维护（而不是等待下一个写入周期）：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置：

- 范围说明：`openclaw sessions cleanup` 维护会话存储、转录记录和轨迹 sidecar。它不会修剪 cron 运行日志（`cron/runs/<jobId>.jsonl`），这些日志由 [Cron 配置](/zh-CN/automation/cron-jobs#configuration) 中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，并在 [Cron 维护](/zh-CN/automation/cron-jobs#maintenance) 中说明。
- 清理还会修剪早于 `session.maintenance.pruneAfter` 的未引用主转录记录、压缩检查点和轨迹 sidecar；仍由 `sessions.json` 引用的文件会被保留。

- `--dry-run`：预览在不写入的情况下会修剪/封顶多少条目。
  - 在文本模式中，dry-run 会打印按会话列出的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），便于你查看哪些会被保留、哪些会被移除。
- `--enforce`：即使 `session.maintenance.mode` 为 `warn`，也应用维护。
- `--fix-missing`：移除转录文件缺失的条目，即使它们通常还不会因年龄/数量被淘汰。
- `--active-key <key>`：保护特定活跃键免受磁盘预算淘汰。持久外部对话指针，例如群组会话和线程范围的聊天会话，也会通过年龄/数量/磁盘预算维护保留。
- `--agent <id>`：为一个已配置的智能体存储运行清理。
- `--all-agents`：为所有已配置的智能体存储运行清理。
- `--store <path>`：针对特定 `sessions.json` 文件运行。
- `--json`：打印 JSON 摘要。与 `--all-agents` 一起使用时，输出会包含每个存储的一份摘要。

当 Gateway 网关可达时，针对已配置智能体存储的非 dry-run 清理会通过 Gateway 网关发送，因此它会与运行时流量共享同一个会话存储写入器。使用 `--store <path>` 对存储文件进行显式离线修复。

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
