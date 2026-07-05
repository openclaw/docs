---
read_when:
    - 你想列出已存储的会话并查看最近活动
summary: '`openclaw sessions` 的 CLI 参考（列出已存储会话 + 用法）'
title: 会话
x-i18n:
    generated_at: "2026-07-05T11:09:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 849a7576557574cf1a48b17e1d4f444605afed09c675177cf12cf18f91a355b3
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已存储的对话会话。

会话列表不是渠道/提供商存活检查。它们显示来自会话存储的持久化对话行。安静的 Discord、Slack、Telegram 或其他渠道可以成功重连，但在处理消息之前不会创建新的会话行。需要实时渠道连接性时，请使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

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

| 标志                 | 描述                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | 一个已配置的 Agent 存储（默认：已配置的默认 Agent）。        |
| `--all-agents`       | 聚合所有已配置的 Agent 存储。                                 |
| `--store <path>`     | 显式存储路径（不能与 `--agent` 或 `--all-agents` 组合使用）。 |
| `--active <minutes>` | 仅显示过去 N 分钟内更新过的会话。                  |
| `--limit <n\|all>`   | 输出的最大行数（默认 `100`；`all` 恢复完整输出）。        |
| `--json`             | 机器可读输出。                                               |
| `--verbose`          | 详细日志。                                                       |

`openclaw sessions` 和 Gateway 网关 `sessions.list` RPC 默认都有边界限制，因此大型长期存储不会独占 CLI 进程或 Gateway 网关事件循环。CLI 默认返回最新的 100 个会话；传入 `--limit <n>` 可使用更小/更大的窗口，或者在你有意需要完整存储时传入 `--limit all`。当调用方需要显示还有更多行存在时，JSON 响应会包含 `totalCount`、`limitApplied` 和 `hasMore`。

RPC 客户端可以传入 `configuredAgentsOnly: true`，以保留广泛的组合设备发现来源，但只返回当前存在于配置中的 Agent 行。Control UI 默认使用该模式，因此已删除或仅磁盘上的 Agent 存储不会重新出现在会话视图中。

`--all-agents` 读取已配置的 Agent 存储。Gateway 网关和 ACP 会话设备发现范围更广：它们还会包含在默认 `agents/` 根目录或模板化 `session.store` 根目录下找到的仅磁盘存储。这些发现到的存储必须解析为 Agent 根目录内的常规 `sessions.json` 文件；符号链接和根目录外路径会被跳过。

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.5" },
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

`openclaw sessions tail` 将最近的轨迹 JSONL 事件渲染为紧凑的进度行。没有 `--session-key` 时，它会先跟踪正在运行的会话，然后跟踪最新存储的会话。`--tail <count>` 控制在 follow 模式之前打印多少个现有事件；默认值为 `80`，`0` 则从当前末尾开始。`--follow` 会持续监视选定的轨迹文件，包括 `<session>.trajectory-path.json` 引用的已迁移文件。

进度视图有意保持保守：不会打印提示文本、工具参数和工具结果正文。工具调用会显示工具名称以及 `{...redacted...}`；工具结果会显示 `ok`、`error` 或 `done` 等状态；模型完成行会显示提供商/模型和终端状态。

## 导出轨迹包

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是所有者批准 Exec 请求后 `/export-trajectory` 斜杠命令使用的命令路径。输出目录始终解析到所选工作区下的 `.openclaw/trajectory-exports/` 内。

## 清理维护

立即运行维护，而不是等待下一次写入周期：

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

- 范围说明：`openclaw sessions cleanup` 维护会话存储、转录记录和轨迹侧车。它不会修剪 cron 运行历史，后者由 `cron.runLog.keepLines` 管理（[Cron 配置](/zh-CN/automation/cron-jobs#configuration)）。
- 清理还会修剪早于 `session.maintenance.pruneAfter` 的未引用主转录记录、压缩检查点和轨迹侧车；仍被 `sessions.json` 引用的文件会保留。
- 清理会将短生命周期 Gateway 网关模型运行探测清理单独报告为 `modelRunPruned`。这只匹配形如 `agent:*:explicit:model-run-<uuid>` 的严格显式键。保留期固定为 `24h`，并受压力门控：只有在达到会话条目维护/容量压力时，才会移除过期探测行。运行时，模型运行清理会发生在全局过期清理和容量限制之前。

标志：

| 标志                 | 描述                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 预览在不写入的情况下会修剪/限制多少条目。在文本模式下，打印逐会话操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以及按会话标签分组的摘要。                                                                                                |
| `--enforce`          | 即使 `session.maintenance.mode` 为 `warn`，也应用维护。                                                                                                                                                                                                                                   |
| `--fix-missing`      | 移除转录文件缺失或仅有头部/为空的条目，即使它们通常尚未因时间/数量超限而被清理。                                                                                                                                                                          |
| `--fix-dm-scope`     | 当 `session.dmScope` 为 `main` 时，停用早期 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由遗留的过期对等键直连私信行。请先使用 `--dry-run`；应用后会从 `sessions.json` 中移除这些行，并将其转录记录保留为已删除归档。 |
| `--active-key <key>` | 保护一个特定活动键不被磁盘预算驱逐。持久外部对话指针，例如群组会话和线程范围聊天会话，也会在按时间/数量/磁盘预算维护时保留。                                                                                        |
| `--agent <id>`       | 对一个已配置的 Agent 存储运行清理。                                                                                                                                                                                                                                                         |
| `--all-agents`       | 对所有已配置的 Agent 存储运行清理。                                                                                                                                                                                                                                                        |
| `--store <path>`     | 针对特定的 `sessions.json` 文件运行。                                                                                                                                                                                                                                                        |
| `--json`             | 打印 JSON 摘要。使用 `--all-agents` 时，输出会为每个存储包含一份摘要。                                                                                                                                                                                                                   |

当 Gateway 网关可达时，针对已配置 Agent 存储的非 dry-run 清理会通过 Gateway 网关发送，因此它会与运行时流量共享同一个会话存储写入器。使用 `--store <path>` 可对存储文件进行显式离线修复。

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
compact <key>` 是 `sessions.compact` Gateway 网关 RPC 的一等包装器，并且需要正在运行的 Gateway 网关。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- 没有 `--max-lines` 时，Gateway 网关会用 LLM 总结转录记录。CLI 默认不施加客户端截止时间；Gateway 网关拥有已配置的压缩生命周期。
- 使用 `--max-lines <n>` 时，它会截断到最后 `n` 行转录记录，并将先前的转录记录归档为 `.bak` 侧车。
- `--agent <id>`：拥有该会话的 Agent；对于 `global` 键是必需的。
- `--url` / `--token` / `--password`：Gateway 网关连接覆盖项。
- `--timeout <ms>`：可选的客户端侧 RPC 超时，单位为毫秒。
- `--json`：打印原始 RPC 载荷。

当 Gateway 网关报告压缩失败或不可达时，该命令会以非零状态退出，因此 cron 和脚本不会把静默无操作误认为成功。

<Note>
`openclaw agent --message '/compact ...'` **不是**压缩路径。来自 CLI 的斜杠命令会被授权发送者检查拒绝；该调用会以非零状态退出，并给出指向此处的指导，而不是静默无操作。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` 接受：

| 字段       | 类型        | 必填 | 描述                                               |
| ---------- | ----------- | ---- | -------------------------------------------------- |
| `key`      | string      | 是   | 要压缩的会话键（例如 `agent:main:main`）。         |
| `agentId`  | string      | 否   | 拥有该会话的智能体 id（用于 `global` 键）。        |
| `maxLines` | integer ≥ 1 | 否   | 截断为最后 N 行，而不是使用 LLM 摘要。             |

示例 LLM 摘要响应：

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

示例截断响应（`--max-lines 200`）：

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## 相关

- [会话配置](/zh-CN/gateway/config-agents#session)
- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [CLI 参考](/zh-CN/cli)
