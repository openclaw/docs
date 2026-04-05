---
read_when:
    - 你正在管理已配对的节点（摄像头、屏幕、canvas）
    - 你需要批准请求或调用节点命令
summary: '`openclaw nodes` 的 CLI 参考（状态、配对、调用、camera/canvas/screen）'
title: nodes
x-i18n:
    generated_at: "2026-04-05T08:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

管理已配对的节点（设备）并调用节点能力。

相关内容：

- 节点概览：[Nodes](/nodes)
- 摄像头：[Camera nodes](/nodes/camera)
- 图像：[Image nodes](/nodes/images)

常用选项：

- `--url`、`--token`、`--timeout`、`--json`

## 常用命令

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 会打印待处理/已配对表格。已配对行会包含最近一次连接距今的时长（Last Connect）。
使用 `--connected` 仅显示当前已连接的节点。使用 `--last-connected <duration>` 可
筛选在某个时长内有过连接的节点（例如 `24h`、`7d`）。

批准说明：

- `openclaw nodes pending` 只需要配对范围。
- `openclaw nodes approve <requestId>` 会继承待处理请求中的额外范围要求：
  - 无命令请求：仅配对
  - 非 exec 节点命令：配对 + 写入
  - `system.run` / `system.run.prepare` / `system.which`：配对 + 管理员

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志：

- `--params <json>`：JSON 对象字符串（默认 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时时间（默认 `15000`）。
- `--idempotency-key <key>`：可选的幂等键。
- 此处会阻止 `system.run` 和 `system.run.prepare`；如需执行 shell，请使用 `host=node` 的 `exec` 工具。

如需在节点上执行 shell，请使用 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
现在的 `nodes` CLI 专注于能力：通过 `nodes invoke` 进行直接 RPC，以及配对、camera、
screen、location、canvas 和通知。
