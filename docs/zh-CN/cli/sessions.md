---
read_when:
    - 你想列出已存储的会话并查看近期活动
summary: 用于 `openclaw sessions` 的 CLI 参考（列出已存储的会话 + 用法）
title: 会话
x-i18n:
    generated_at: "2026-05-02T05:34:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e7e5017ba5a6194ac10d3a18ea9b711da57bc2ef1696776622cd3be2a2fbf43
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已存储的对话会话。

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
- `--verbose`：详细日志记录
- `--agent <id>`：一个已配置的智能体存储
- `--all-agents`：聚合所有已配置的智能体存储
- `--store <path>`：显式存储路径（不能与 `--agent` 或 `--all-agents` 组合使用）

为已存储的会话导出轨迹包：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是所有者批准 exec 请求后，`/export-trajectory` 斜杠命令使用的命令路径。输出目录始终会解析到所选工作区下的 `.openclaw/trajectory-exports/` 内。

`openclaw sessions --all-agents` 会读取已配置的智能体存储。Gateway 网关和 ACP 会话发现的范围更广：它们还会包括在默认 `agents/` 根目录或模板化 `session.store` 根目录下找到的仅磁盘存储。这些发现的存储必须解析为智能体根目录内的常规 `sessions.json` 文件；符号链接和根目录外路径会被跳过。

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

- 范围说明：`openclaw sessions cleanup` 维护会话存储、转录和轨迹旁车文件。它不会修剪 cron 运行日志（`cron/runs/<jobId>.jsonl`），这些日志由 [Cron 配置](/zh-CN/automation/cron-jobs#configuration)中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，并在 [Cron 维护](/zh-CN/automation/cron-jobs#maintenance)中说明。

- `--dry-run`：预览在不写入的情况下会修剪/封顶多少条目。
  - 在文本模式中，dry-run 会打印按会话列出的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以便你查看哪些会保留、哪些会移除。
- `--enforce`：即使 `session.maintenance.mode` 为 `warn`，也应用维护。
- `--fix-missing`：移除转录文件缺失的条目，即使它们通常还不会因年龄/数量被清理。
- `--active-key <key>`：保护特定活动键不因磁盘预算驱逐而被移除。持久的外部对话指针（例如群组会话和按线程限定的聊天会话）也会在按年龄/数量/磁盘预算维护时保留。
- `--agent <id>`：为一个已配置的智能体存储运行清理。
- `--all-agents`：为所有已配置的智能体存储运行清理。
- `--store <path>`：针对特定 `sessions.json` 文件运行。
- `--json`：打印 JSON 摘要。使用 `--all-agents` 时，输出会包含每个存储的一份摘要。

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
