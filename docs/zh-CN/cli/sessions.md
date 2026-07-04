---
read_when:
    - 你想列出已存储的会话并查看最近活动
summary: '`openclaw sessions` 的 CLI 参考（列出已存储会话 + 用法）'
title: 会话
x-i18n:
    generated_at: "2026-07-04T20:24:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已存储的对话会话。

会话列表不是渠道/提供商的存活检查。它们显示来自会话存储的持久化对话行。安静的 Discord、Slack、Telegram 或其他渠道可以成功重新连接，但在处理消息之前不会创建新的会话行。当你需要实时渠道连接状态时，请使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

`openclaw sessions` 和 Gateway 网关 `sessions.list` 响应默认有边界限制，避免大型长期存储独占 CLI 进程或 Gateway 网关事件循环。CLI 默认返回最新的 100 个会话；传入 `--limit <n>` 可获取更小/更大的窗口，或者在你有意需要完整存储时传入 `--limit all`。当调用方需要显示还有更多行存在时，JSON 响应会包含 `totalCount`、`limitApplied` 和 `hasMore`。

RPC 客户端可以传入 `configuredAgentsOnly: true`，以保留广泛的组合设备发现来源，但只返回当前配置中存在的智能体对应的行。Control UI 默认使用该模式，因此已删除或仅存在于磁盘上的智能体存储不会重新出现在会话视图中。

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
- `--store <path>`：显式存储路径（不能与 `--agent` 或 `--all-agents` 组合使用）
- `--limit <n|all>`：要输出的最大行数（默认 `100`；`all` 恢复完整输出）

为已存储会话尾随人类可读的轨迹进度：

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` 会将最近的轨迹 JSONL 事件渲染为紧凑的进度行。如果没有 `--session-key`，它会先尾随正在运行的会话，然后尾随最新的已存储会话。`--tail <count>` 控制进入跟随模式前打印多少个已有事件；默认值为 `80`，`0` 表示从当前末尾开始。`--follow` 会持续监视选定的轨迹文件，包括 `<session>.trajectory-path.json` 引用的已迁移文件。

进度视图刻意保持保守：不会打印提示文本、工具参数和工具结果正文。工具调用显示工具名称以及 `{...redacted...}`；工具结果显示 `ok`、`error` 或 `done` 等状态；模型完成行显示提供商/模型和终止状态。

为已存储会话导出轨迹包：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是 `/export-trajectory` 斜杠命令在所有者批准 Exec 请求后使用的命令路径。输出目录始终解析到所选工作区下的 `.openclaw/trajectory-exports/` 内部。

`openclaw sessions --all-agents` 读取已配置的智能体存储。Gateway 网关和 ACP 会话设备发现范围更广：它们还会包含在默认 `agents/` 根目录或模板化 `session.store` 根目录下发现的仅磁盘存储。这些已发现的存储必须解析为智能体根目录内的常规 `sessions.json` 文件；符号链接和根目录外路径会被跳过。

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

立即运行维护（而不是等待下一次写入周期）：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置：

- 范围说明：`openclaw sessions cleanup` 维护会话存储、转录稿和轨迹 sidecar。它不会修剪 cron 运行历史；该历史由 [Cron 配置](/zh-CN/automation/cron-jobs#configuration)中的 `cron.runLog.keepLines` 管理，并在 [Cron 维护](/zh-CN/automation/cron-jobs#maintenance)中说明。
- 清理还会修剪早于 `session.maintenance.pruneAfter` 的未引用主转录稿、压缩检查点和轨迹 sidecar；仍被 `sessions.json` 引用的文件会被保留。
- 清理会将短期 Gateway 网关模型运行探测清理单独报告为 `modelRunPruned`。这只匹配形如 `agent:*:explicit:model-run-<uuid>` 的严格显式键。固定保留时间为 `24h`，但受压力门控：只有在会话条目维护/容量压力达到时，才会移除过期探测行。运行时，模型运行清理会先于全局过期清理和容量限制执行。

- `--dry-run`：预览会修剪/限制多少条目，而不写入。
  - 在文本模式下，dry-run 会打印按会话划分的操作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以及按会话标签分组的摘要，让你看到哪些会保留、哪些会移除。
- `--enforce`：即使 `session.maintenance.mode` 为 `warn`，也应用维护。
- `--fix-missing`：移除转录稿文件缺失或只有头部/为空的条目，即使它们通常还不会因年龄/数量被淘汰。
- `--fix-dm-scope`：当 `session.dmScope` 为 `main` 时，停用早期 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由遗留下来的过期按对等方键控的直接私信行。请先使用 `--dry-run`；应用清理会从 `sessions.json` 移除这些行，并将其转录稿保留为已删除归档。
- `--active-key <key>`：保护特定活动键不受磁盘预算驱逐。持久外部对话指针，例如群组会话和线程范围聊天会话，也会被年龄/数量/磁盘预算维护保留。
- `--agent <id>`：为一个已配置的智能体存储运行清理。
- `--all-agents`：为所有已配置的智能体存储运行清理。
- `--store <path>`：针对特定 `sessions.json` 文件运行。
- `--json`：打印 JSON 摘要。使用 `--all-agents` 时，输出会包含每个存储的一份摘要。

当 Gateway 网关可达时，已配置智能体存储的非 dry-run 清理会通过 Gateway 网关发送，使其与运行时流量共享同一个会话存储写入器。使用 `--store <path>` 可对存储文件进行显式离线修复。

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

为卡住或过大的会话回收上下文预算。`openclaw sessions compact <key>` 是围绕 `sessions.compact` Gateway 网关 RPC 的一等包装器，并且需要正在运行的 Gateway 网关。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- 没有 `--max-lines` 时，Gateway 网关会使用 LLM 汇总转录稿。CLI 默认不施加客户端截止时间；Gateway 网关负责已配置的压缩生命周期。
- 使用 `--max-lines <n>` 时，它会截断到最后 `n` 行转录稿，并将之前的转录稿归档为 `.bak` sidecar。
- `--agent <id>`：拥有该会话的智能体；对于 `global` 键是必需的。
- `--url` / `--token` / `--password`：Gateway 网关连接覆盖项。
- `--timeout <ms>`：可选的客户端侧 RPC 超时时间，单位为毫秒。
- `--json`：打印原始 RPC 载荷。

当 Gateway 网关报告压缩失败或不可达时，该命令以非零状态退出，因此 cron 和脚本不会把静默无操作误认为成功。

> 注意：`openclaw agent --message '/compact ...'` **不是**压缩路径。来自 CLI 的斜杠命令会被授权发送方检查拒绝；该调用会以非零状态退出，并给出指向此处的指导，而不是静默无操作。

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` 接受：

| 字段 | 类型 | 必需 | 描述 |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key` | string | 是 | 要压缩的会话键（例如 `agent:main:main`）。 |
| `agentId` | string | 否 | 拥有该会话的智能体 id（用于 `global` 键）。 |
| `maxLines` | integer ≥ 1 | 否 | 截断到最后 N 行，而不是使用 LLM 汇总。 |

LLM 汇总响应示例：

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

## 相关

- 会话配置：[配置参考](/zh-CN/gateway/config-agents#session)
- [CLI 参考](/zh-CN/cli)
- [会话管理](/zh-CN/concepts/session)
