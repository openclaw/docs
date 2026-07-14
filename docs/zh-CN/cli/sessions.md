---
read_when:
    - 你想列出已存储的会话并查看最近的活动
summary: '`openclaw sessions` 的 CLI 参考（列出已存储的会话及使用情况）'
title: 会话
x-i18n:
    generated_at: "2026-07-14T13:32:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已存储的对话会话。

会话列表不是渠道/提供商存活状态检查。它们显示会话存储中持久化的
对话记录。处于静默状态的 Discord、Slack、Telegram 或
其他渠道可以成功重新连接，但在处理消息之前不会创建新的会话记录。
需要实时渠道连接状态时，请使用 `openclaw channels status --probe`、
`openclaw status --deep` 或 `openclaw health --verbose`。

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
| `--limit <n\|all>`   | 最大输出行数（默认 `100`；`all` 恢复完整输出）。        |
| `--json`             | 机器可读输出。                                               |
| `--verbose`          | 详细日志。                                                       |

`openclaw sessions` 和 Gateway 网关的 `sessions.list` RPC 默认有界，
以免大型长期存储独占 CLI 进程或 Gateway 网关事件
循环。CLI 默认返回最新的 100 个会话；传入 `--limit <n>`
可使用更小或更大的窗口，或在确实需要完整存储时传入 `--limit all`。
当调用方需要表明还有更多记录时，JSON 响应会包含 `totalCount`、`limitApplied` 和 `hasMore`。

RPC 客户端可以传入 `configuredAgentsOnly: true`，以保留广泛的组合
发现来源，但仅返回当前配置中存在的智能体记录。
Control UI 默认使用此模式，因此已删除或仅存在于磁盘上的智能体存储不会
重新出现在会话视图中。

`--all-agents` 读取已配置的智能体存储。Gateway 网关和 ACP 会话
发现范围更广：它们还包括从已配置的智能体根目录或模板化的
`session.store` 根目录解析出的 SQLite 存储。旧版选择器
路径必须解析到智能体根目录内；符号链接和根目录外路径将被
跳过。

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

## 跟踪轨迹进度

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` 将最近的运行时轨迹事件呈现为紧凑的
进度行。未指定 `--session-key` 时，它首先跟踪正在运行的会话，然后
跟踪最新存储的会话。`--tail <count>` 控制进入跟随模式前
打印多少个现有事件；默认值为 `80`，而 `0` 从当前末尾开始。
`--follow` 会持续监视选定的 SQLite 支持的会话或显式指定的
旧版轨迹文件。

进度视图刻意采用保守策略：不会打印提示文本、工具参数
和工具结果正文。工具调用使用 `{...redacted...}` 显示工具名称；
工具结果显示 `ok`、`error` 或 `done` 等状态；
模型完成行显示提供商/模型和终止状态。

## 导出轨迹包

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是所有者批准 Exec 请求后，`/export-trajectory` 斜杠命令使用的
命令路径。输出目录始终解析到所选工作区下的
`.openclaw/trajectory-exports/` 内。

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

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置
（[配置参考](/zh-CN/gateway/config-agents#session)）：

- 范围说明：`openclaw sessions cleanup` 维护会话存储、
  转录、轨迹记录和旧版轨迹伴随文件。它不会
  清理 cron 运行历史记录；后者会自动为每个作业保留最新的 2000 条记录
  （[Cron 配置](/zh-CN/automation/cron-jobs#configuration)）。
- 清理还会移除早于
  `session.maintenance.pruneAfter` 且未被引用的旧版/归档转录工件、
  压缩检查点和轨迹伴随文件；SQLite
  会话记录仍引用的工件会被保留。
- 清理会将短期 Gateway 网关模型运行探测的清理单独报告为
  `modelRunPruned`。这仅匹配形如
  `agent:*:explicit:model-run-<uuid>` 的严格显式键。保留期固定为 `24h`，并受
  压力门控：仅当达到会话条目维护/容量压力时，才会移除过期的探测记录。
  执行时，模型运行清理会先于全局过期清理和容量限制。

标志：

| 标志                 | 说明                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 预览在不写入的情况下会清理或限制多少条目。在文本模式下，打印按会话划分的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以及按会话标签分组的摘要。                                                                                                       |
| `--enforce`          | 即使 `session.maintenance.mode` 为 `warn`，也应用维护。                                                                                                                                                                                                                                          |
| `--fix-missing`      | 移除已归档转录工件缺失或仅含标头/为空的旧版条目，即使它们通常尚未达到按时间/数量移除的条件。                                                                                                                                                             |
| `--fix-dm-scope`     | 当 `session.dmScope` 为 `main` 时，停用先前由 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由遗留的、以对等方为键的过期直接私信记录。请先使用 `--dry-run`；应用后会从 SQLite 中移除这些记录，并将其旧版转录工件保留为已删除归档。 |
| `--active-key <key>` | 保护特定的活动键，使其不因磁盘预算限制而被逐出。持久的外部对话指针（例如群组会话和线程范围的聊天会话）也会在按时间/数量/磁盘预算维护时保留。                                                                                               |
| `--agent <id>`       | 对一个已配置的智能体存储运行清理。                                                                                                                                                                                                                                                                |
| `--all-agents`       | 对所有已配置的智能体存储运行清理。                                                                                                                                                                                                                                                               |
| `--store <path>`     | 针对特定的旧版存储选择器路径运行。                                                                                                                                                                                                                                                         |
| `--json`             | 打印 JSON 摘要。与 `--all-agents` 一起使用时，输出包含每个存储的一份摘要。                                                                                                                                                                                                                          |

当 Gateway 网关可访问时，针对已配置智能体存储的非试运行清理会
通过 Gateway 网关发送，以便与运行时流量共享同一个会话存储写入器。
如需显式离线修复旧版存储选择器，请使用 `--store <path>`。

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
compact <key>` 是 `sessions.compact`
Gateway 网关 RPC 的一等封装，需要正在运行的 Gateway 网关。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- 未指定 `--max-lines` 时，Gateway 网关会使用 LLM 汇总转录。CLI
  默认不施加客户端截止时间；Gateway 网关负责
  已配置的压缩生命周期。
- 指定 `--max-lines <n>` 时，它会截断到转录的最后 `n` 行，并
  将此前的转录归档为 `.bak` 伴随文件。
- `--agent <id>`：拥有该会话的智能体；`global` 键必须指定此项。
- `--url` / `--token` / `--password`：Gateway 网关连接覆盖项。
- `--timeout <ms>`：可选的客户端 RPC 超时时间，以毫秒为单位。
- `--json`：打印原始 RPC 负载。

当 Gateway 网关报告压缩失败或无法访问时，该命令会以非零状态退出，因此 cron 任务和脚本绝不会将无提示的空操作误认为成功。

<Note>
`openclaw agent --message '/compact ...'` **不是**压缩路径。CLI 发出的斜杠命令会被已授权发送者检查拒绝；该调用会以非零状态退出，并提供指向此处的指导，而不是无提示地执行空操作。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` 接受以下参数：

| 字段      | 类型        | 必填 | 描述                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | 字符串      | 是      | 要压缩的会话键（例如 `agent:main:main`）。    |
| `agentId`  | 字符串      | 否       | 拥有该会话的 Agent ID（用于 `global` 键）。        |
| `maxLines` | 整数 ≥ 1 | 否       | 截断为最后 N 行，而不是使用 LLM 进行摘要。 |

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
