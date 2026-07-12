---
read_when:
    - 你想列出已存储的会话并查看最近的活动
summary: '`openclaw sessions` 的 CLI 参考（列出已存储的会话和使用情况）'
title: 会话
x-i18n:
    generated_at: "2026-07-12T14:22:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已存储的对话会话。

会话列表不是渠道/提供商存活状态检查。它们显示会话存储中持久化的对话行。处于静默状态的 Discord、Slack、Telegram 或其他渠道可以成功重新连接，但在处理消息之前不会创建新的会话行。当你需要检查实时渠道连接时，请使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

标志：

| 标志                 | 说明                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | 一个已配置的智能体存储（默认：已配置的默认智能体）。        |
| `--all-agents`       | 汇总所有已配置的智能体存储。                                 |
| `--store <path>`     | 显式存储路径（不能与 `--agent` 或 `--all-agents` 组合使用）。 |
| `--active <minutes>` | 仅显示过去 N 分钟内更新的会话。                  |
| `--limit <n\|all>`   | 要输出的最大行数（默认值为 `100`；`all` 恢复完整输出）。        |
| `--json`             | 机器可读输出。                                               |
| `--verbose`          | 详细日志。                                                       |

`openclaw sessions` 和 Gateway 网关的 `sessions.list` RPC 默认均有数量限制，以免大型长期存储独占 CLI 进程或 Gateway 网关事件循环。CLI 默认返回最新的 100 个会话；传递 `--limit <n>` 可获取更小或更大的范围，或者在确实需要完整存储时使用 `--limit all`。当调用方需要表明存在更多行时，JSON 响应会包含 `totalCount`、`limitApplied` 和 `hasMore`。

RPC 客户端可以传递 `configuredAgentsOnly: true`，以保留广泛的组合发现源，但仅返回配置中当前存在的智能体对应的行。Control UI 默认使用此模式，因此已删除或仅存在于磁盘中的智能体存储不会重新出现在会话视图中。

`--all-agents` 会读取已配置的 Agent 存储。Gateway 网关和 ACP 会话的发现范围更广：还会包括从已配置的 Agent 根目录或模板化的 `session.store` 根目录解析出的 SQLite 存储。旧版选择器路径必须解析到 Agent 根目录内；符号链接和根目录外的路径会被跳过。

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## 追踪轨迹进度

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` 将最近的运行时轨迹事件呈现为紧凑的进度行。如果未指定 `--session-key`，它会先跟踪正在运行的会话，然后跟踪最近存储的会话。`--tail <count>` 控制进入跟踪模式前输出的现有事件数量；默认值为 `80`，设为 `0` 则从当前末尾开始。`--follow` 会持续监视所选的 SQLite 后端会话或显式指定的旧版轨迹文件。

进度视图会有意限制所显示的内容：不会输出提示词文本、工具参数和工具结果正文。工具调用会显示工具名称及 `{...redacted...}`；工具结果会显示 `ok`、`error` 或 `done` 等状态；模型完成行会显示提供商/模型和终止状态。

## 导出轨迹包

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是所有者批准 Exec 请求后，`/export-trajectory` 斜杠命令所使用的命令路径。输出目录始终解析到所选工作区下的 `.openclaw/trajectory-exports/` 内。

## 清理维护

立即运行维护，而不是等待下一个写入周期：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置（[配置参考](/zh-CN/gateway/config-agents#session)）：

- 范围说明：`openclaw sessions cleanup` 维护会话存储、转录记录、轨迹行和旧版轨迹旁文件。它不会清理 cron 运行历史；后者由 `cron.runLog.keepLines` 管理（[Cron 配置](/zh-CN/automation/cron-jobs#configuration)）。
- 清理还会移除早于 `session.maintenance.pruneAfter` 且未被引用的旧版/归档转录工件、压缩检查点和轨迹旁文件；SQLite 会话行仍引用的工件会保留。
- 清理会将短期 Gateway 网关模型运行探测记录的清理单独报告为 `modelRunPruned`。它只匹配形如 `agent:*:explicit:model-run-<uuid>` 的严格显式键。保留期限固定为 `24h`，并受存储压力控制：仅当会话条目维护/上限压力达到阈值时，才移除过期的探测行。执行时，模型运行清理先于全局过期清理和数量限制。

标志：

| 标志                 | 说明                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 预览将清理或限制的条目数量，但不执行写入。在文本模式下，会输出按会话列出的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以及按会话标签分组的摘要。                                                                                                       |
| `--enforce`          | 即使 `session.maintenance.mode` 为 `warn`，也应用维护。                                                                                                                                                                                                                                          |
| `--fix-missing`      | 移除归档转录工件缺失、仅含标头或为空的旧版条目，即使它们通常尚未达到基于时间或数量的移除条件。                                                                                                                                                             |
| `--fix-dm-scope`     | 当 `session.dmScope` 为 `main` 时，停用早期 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由遗留的过期对等方键直接私信行。请先使用 `--dry-run`；应用后会从 SQLite 中移除这些行，并将其旧版转录工件保留为已删除归档。 |
| `--active-key <key>` | 保护特定活动键，使其不会因磁盘预算而被逐出。持久的外部对话指针（例如群组会话和线程范围的聊天会话）也会在基于时间、数量和磁盘预算的维护中保留。                                                                                               |
| `--agent <id>`       | 对一个已配置的智能体存储运行清理。                                                                                                                                                                                                                                                                |
| `--all-agents`       | 对所有已配置的智能体存储运行清理。                                                                                                                                                                                                                                                               |
| `--store <path>`     | 针对特定的旧版存储选择器路径运行。                                                                                                                                                                                                                                                         |
| `--json`             | 输出 JSON 摘要。使用 `--all-agents` 时，输出会为每个存储包含一份摘要。                                                                                                                                                                                                                          |

当 Gateway 网关可访问时，针对已配置 Agent 存储执行的非试运行清理会通过 Gateway 网关发送，从而与运行时流量共用同一个会话存储写入器。使用 `--store <path>` 可对旧版存储选择器显式执行离线修复。

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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## 压缩会话

为卡住或过大的会话回收上下文预算。`openclaw sessions
compact <key>` 是 `sessions.compact` Gateway RPC 的正式封装，需要正在运行的 Gateway 网关。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- 不指定 `--max-lines` 时，Gateway 网关会使用 LLM 汇总对话记录。CLI
  默认不施加客户端截止时间；配置的压缩生命周期由 Gateway 网关管理。
- 指定 `--max-lines <n>` 时，它会截断并仅保留对话记录的最后 `n` 行，同时将此前的对话记录归档为 `.bak` 辅助文件。
- `--agent <id>`：拥有该会话的 Agent；对于 `global` 键，此选项为必需项。
- `--url` / `--token` / `--password`：Gateway 网关连接覆盖项。
- `--timeout <ms>`：可选的客户端 RPC 超时时间，单位为毫秒。
- `--json`：输出原始 RPC 载荷。

当 Gateway 网关报告压缩失败或无法访问时，该命令会以非零状态退出，因此 cron 任务和脚本绝不会误将无提示的空操作视为成功。

<Note>
`openclaw agent --message '/compact ...'` **不是**压缩路径。来自 CLI 的斜杠命令会被授权发送者检查拒绝；该调用会以非零状态退出，并显示指向此处的指导信息，而不会无提示地执行空操作。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` 接受以下参数：

| 字段       | 类型        | 必填 | 描述                                                   |
| ---------- | ----------- | ---- | ------------------------------------------------------ |
| `key`      | string      | 是   | 要压缩的会话键（例如 `agent:main:main`）。             |
| `agentId`  | string      | 否   | 拥有该会话的 Agent ID（用于 `global` 键）。            |
| `maxLines` | integer ≥ 1 | 否   | 截断至最后 N 行，而不是使用 LLM 进行摘要。             |

LLM 摘要响应示例：

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

截断响应示例（`--max-lines 200`）：

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## 相关内容

- [会话配置](/zh-CN/gateway/config-agents#session)
- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [CLI 参考](/zh-CN/cli)
