---
read_when:
    - 你想将系统事件加入队列，而不创建 cron 任务
    - 你需要启用或禁用 Heartbeat
    - 你想检查系统在线状态条目
summary: '`openclaw system` 的 CLI 参考（系统事件、心跳、在线状态）'
title: 系统
x-i18n:
    generated_at: "2026-05-11T20:26:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

用于 Gateway 网关的系统级辅助工具：将系统事件加入队列、控制 Heartbeat，并查看在线状态。

所有 `system` 子命令都使用 Gateway 网关 RPC，并接受共享客户端标志：

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

默认在 **主** 会话上将系统事件加入队列。下一次 Heartbeat 会将其作为提示词中的 `System:` 行注入。使用 `--mode now` 可立即触发 Heartbeat；`next-heartbeat` 会等待下一次计划的 tick。

传入 `--session-key` 可定向到特定会话（例如，将异步任务完成事件转发回启动它的渠道）。

> **使用 `--session-key` 时的时序例外：** 提供 `--session-key` 时，
> `--mode next-heartbeat` 会折叠为一次立即的定向唤醒，而不是等待下一次计划的 tick。
> 定向唤醒使用 Heartbeat 意图 `immediate`，因此会绕过运行器的未到期门控；否则该门控会延迟
>（并实际丢弃）一个 `event` 意图的唤醒。如果你想要延迟投递，请省略 `--session-key`，
> 这样事件会落在主会话上，并随下一次常规 Heartbeat 发送。

标志：

- `--text <text>`：必需的系统事件文本。
- `--mode <mode>`：`now` 或 `next-heartbeat`（默认）。
- `--session-key <sessionKey>`：可选；定向到特定智能体会话，而不是智能体的主会话。不属于已解析智能体的键会回退到智能体的主会话。
- `--json`：机器可读输出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共享的 Gateway 网关 RPC 标志。

## `system heartbeat last|enable|disable`

Heartbeat 控制：

- `last`：显示上一次 Heartbeat 事件。
- `enable`：重新开启 Heartbeat（如果它们被禁用，请使用此项）。
- `disable`：暂停 Heartbeat。

标志：

- `--json`：机器可读输出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共享的 Gateway 网关 RPC 标志。

## `system presence`

列出 Gateway 网关当前已知的系统在线状态条目（节点、实例和类似的状态行）。

标志：

- `--json`：机器可读输出。
- `--url`、`--token`、`--timeout`、`--expect-final`：共享的 Gateway 网关 RPC 标志。

## 备注

- 需要一个正在运行且可通过你的当前配置访问的 Gateway 网关（本地或远程）。
- 系统事件是临时性的，不会在重启后持久保留。

## 相关

- [CLI 参考](/zh-CN/cli)
