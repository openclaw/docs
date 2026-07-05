---
read_when:
    - 你想要将系统事件加入队列，而不创建 cron 作业
    - 你需要启用或禁用 Heartbeat
    - 你想检查系统在线状态条目
summary: '`openclaw system` 的 CLI 参考（系统事件、心跳、在线状态）'
title: 系统
x-i18n:
    generated_at: "2026-07-05T11:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway 网关的系统级辅助命令：将系统事件加入队列、控制 Heartbeat，并查看在线状态。

所有 `system` 子命令都使用 Gateway 网关 RPC，并接受共享客户端标志：

| 标志              | 默认值                               | 描述                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | 已配置时为 `gateway.remote.url`      | Gateway 网关 WebSocket URL。                                                                                                                                                                        |
| `--token <token>` | 无                                   | Gateway 网关 token（如果需要）。                                                                                                                                                                    |
| `--timeout <ms>`  | `30000`                              | RPC 超时时间，单位为毫秒。                                                                                                                                                                          |
| `--expect-final`  | 关闭                                 | 等待最终响应（智能体）。                                                                                                                                                                            |
| `--json`          | 关闭                                 | 输出 JSON。`heartbeat last/enable/disable` 和 `system presence` 始终打印原始 RPC JSON payload，不受此标志影响；`system event` 使用它在 JSON 和普通 `ok` 行之间切换。 |

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

默认在**主**会话上将系统事件加入队列。下一次 Heartbeat 会将它作为 prompt 中的 `System:` 行注入。使用 `--mode now` 可立即触发 Heartbeat；`next-heartbeat`（默认）会等待下一次计划 tick。

传入 `--session-key` 可定向到特定会话，例如将 async-task 完成结果中继回启动它的渠道。

<Note>
**使用 `--session-key` 时的时序例外：**当提供 `--session-key` 时，`--mode next-heartbeat` 会折叠为立即的定向唤醒，而不是等待下一次计划 tick。定向唤醒使用 Heartbeat intent `immediate`，因此会绕过 runner 的 not-due gate；否则该 gate 会延迟（并实际上丢弃）一个 `event` intent 的唤醒。如果你想要延迟投递，请省略 `--session-key`，让事件落到主会话上，并随下一次常规 Heartbeat 发送。
</Note>

标志：

- `--text <text>`：必需的系统事件文本。
- `--mode <mode>`：`now` 或 `next-heartbeat`（默认）。
- `--session-key <sessionKey>`：可选；定向到特定智能体会话，而不是智能体的主会话。不属于已解析智能体的 key 会回退到该智能体的主会话。

## `system heartbeat last|enable|disable`

- `last`：显示上一次 Heartbeat 事件。
- `enable`：重新开启 Heartbeat（如果它们被禁用，请使用此项）。
- `disable`：暂停 Heartbeat。

## `system presence`

列出 Gateway 网关当前知道的系统在线状态条目（节点、实例和类似状态行）。

## 说明

- 需要有一个正在运行且可通过你当前配置访问的 Gateway 网关（本地或远程）。
- 系统事件是临时的，不会在重启后持久保留。

## 相关

- [CLI 参考](/zh-CN/cli)
