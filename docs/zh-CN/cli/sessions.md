---
read_when:
    - 你想列出已存储的会话并查看最近活动
summary: '`openclaw sessions` 的 CLI 参考（列出已存储的会话及其用量）'
title: 会话
x-i18n:
    generated_at: "2026-04-24T03:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
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
- `--verbose`：详细日志
- `--agent <id>`：某个已配置的智能体存储
- `--all-agents`：汇总所有已配置的智能体存储
- `--store <path>`：显式指定存储路径（不能与 `--agent` 或 `--all-agents` 一起使用）

`openclaw sessions --all-agents` 会读取已配置的智能体存储。Gateway 网关和 ACP
的会话发现范围更广：它们还会包含在默认 `agents/` 根目录下，或模板化的 `session.store` 根目录下发现的仅存在于磁盘上的存储。
这些被发现的存储必须解析为智能体根目录中的常规 `sessions.json` 文件；符号链接和根目录外路径会被跳过。

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

立即运行维护（而不是等到下一次写入周期）：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置：

- 范围说明：`openclaw sessions cleanup` 只维护会话存储/转录。它不会清理 cron 运行日志（`cron/runs/<jobId>.jsonl`），这些日志由 [Cron 配置](/zh-CN/automation/cron-jobs#configuration) 中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，并在 [Cron maintenance](/zh-CN/automation/cron-jobs#maintenance) 中说明。

- `--dry-run`：预览会修剪/封顶多少条目，而不实际写入。
  - 在文本模式下，dry-run 会打印一个按会话划分的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），让你看到哪些会被保留，哪些会被移除。
- `--enforce`：即使 `session.maintenance.mode` 为 `warn`，也应用维护。
- `--fix-missing`：移除那些转录文件缺失的条目，即使它们通常还未达到按时间/数量淘汰的条件。
- `--active-key <key>`：保护某个活跃键不被磁盘预算淘汰。
- `--agent <id>`：对一个已配置的智能体存储运行清理。
- `--all-agents`：对所有已配置的智能体存储运行清理。
- `--store <path>`：针对特定 `sessions.json` 文件运行。
- `--json`：输出 JSON 摘要。与 `--all-agents` 一起使用时，输出会包含每个存储的一份摘要。

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

相关内容：

- 会话配置：[配置参考](/zh-CN/gateway/config-agents#session)

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [会话管理](/zh-CN/concepts/session)
