---
read_when:
    - 你想在不创建 cron 任务的情况下将系统事件加入队列
    - 你需要启用或禁用 Heartbeat
    - 你想检查系统在线状态条目
summary: '`openclaw system` 的 CLI 参考（系统事件、Heartbeat、在线状态）'
title: 系统
x-i18n:
    generated_at: "2026-07-11T20:26:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

用于 Gateway 网关的系统级辅助命令：将系统事件加入队列、控制 Heartbeat，以及查看在线状态。

所有 `system` 子命令都使用 Gateway RPC，并接受共享客户端标志：

| 标志              | 默认值                               | 说明                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | 配置后使用 `gateway.remote.url`      | Gateway WebSocket URL。                                                                                                                                                                              |
| `--token <token>` | 无                                   | Gateway 令牌（如果需要）。                                                                                                                                                                           |
| `--timeout <ms>`  | `30000`                              | RPC 超时时间（毫秒）。                                                                                                                                                                               |
| `--expect-final`  | 关闭                                 | 等待最终响应（智能体）。                                                                                                                                                                             |
| `--json`          | 关闭                                 | 输出 JSON。无论此标志如何设置，`heartbeat last/enable/disable` 和 `system presence` 始终打印原始 RPC JSON 载荷；`system event` 使用此标志在 JSON 与纯文本 `ok` 行之间切换。 |

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

默认在**主**会话中将系统事件加入队列。下一次 Heartbeat 会将其作为 `System:` 行注入提示词。使用 `--mode now` 可立即触发 Heartbeat；`next-heartbeat`（默认值）会等待下一次计划执行。

传入 `--session-key` 可指定目标会话，例如，将异步任务完成事件转发回启动该任务的渠道。

<Note>
**使用 `--session-key` 时的时序例外：**提供 `--session-key` 后，`--mode next-heartbeat` 不会等待下一次计划执行，而是转为立即定向唤醒。定向唤醒使用 Heartbeat 意图 `immediate`，因此会绕过运行器的未到期门控；否则，该门控会推迟（实际上相当于丢弃）`event` 意图的唤醒。如果需要延迟投递，请省略 `--session-key`，使事件进入主会话并随下一次常规 Heartbeat 一同处理。
</Note>

标志：

- `--text <text>`：必需的系统事件文本。
- `--mode <mode>`：`now` 或 `next-heartbeat`（默认值）。
- `--session-key <sessionKey>`：可选；指定特定智能体会话作为目标，而不是该智能体的主会话。不属于已解析智能体的键会回退到该智能体的主会话。

## `system heartbeat last|enable|disable`

- `last`：显示最后一次 Heartbeat 事件。
- `enable`：重新启用 Heartbeat（如果之前已禁用，请使用此命令）。
- `disable`：暂停 Heartbeat。

## `system presence`

列出 Gateway 网关当前已知的系统在线状态条目（节点、实例及类似的状态行）。

## 注意事项

- 需要有一个可通过当前配置访问的运行中 Gateway 网关（本地或远程）。
- 系统事件是临时的，不会在重启后保留。

## 相关内容

- [CLI 参考](/zh-CN/cli)
