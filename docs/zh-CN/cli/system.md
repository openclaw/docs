---
read_when:
    - 你希望在不创建 cron 作业的情况下将系统事件加入队列
    - 你需要启用或禁用心跳
    - 你希望检查系统在线状态条目
summary: '`openclaw system` 的 CLI 参考（系统事件、心跳、在线状态）'
title: 系统
x-i18n:
    generated_at: "2026-04-24T04:01:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Gateway 网关的系统级辅助命令：将系统事件加入队列、控制心跳，
以及查看在线状态。

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

在 **main** 会话上将系统事件加入队列。下一次心跳会将其作为
提示中的 `System:` 行注入。使用 `--mode now` 可立即触发心跳；
`next-heartbeat` 会等待下一次计划的 tick。

标志：

- `--text <text>`：必需的系统事件文本。
- `--mode <mode>`：`now` 或 `next-heartbeat`（默认）。
- `--json`：机器可读输出。
- `--url`, `--token`, `--timeout`, `--expect-final`：共享 Gateway 网关 RPC 标志。

## `system heartbeat last|enable|disable`

心跳控制：

- `last`：显示最近一次心跳事件。
- `enable`：重新开启心跳（如果它们已被禁用，请使用此项）。
- `disable`：暂停心跳。

标志：

- `--json`：机器可读输出。
- `--url`, `--token`, `--timeout`, `--expect-final`：共享 Gateway 网关 RPC 标志。

## `system presence`

列出 Gateway 网关当前已知的系统在线状态条目（节点、
实例以及类似的状态行）。

标志：

- `--json`：机器可读输出。
- `--url`, `--token`, `--timeout`, `--expect-final`：共享 Gateway 网关 RPC 标志。

## 说明

- 需要一个正在运行且可通过你当前配置访问的 Gateway 网关（本地或远程）。
- 系统事件是临时性的，不会在重启后保留。

## 相关内容

- [CLI 参考](/zh-CN/cli)
