---
read_when:
    - 你正在管理配对节点（摄像头、屏幕、画布）
    - 你需要批准请求或调用 node 命令
summary: 用于 `openclaw nodes` 的 CLI 参考（status、pairing、invoke、camera/canvas/screen）
title: 节点
x-i18n:
    generated_at: "2026-05-07T13:14:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

管理已配对的节点（设备）并调用节点能力。

相关：

- 节点概览：[节点](/zh-CN/nodes)
- 摄像头：[摄像头节点](/zh-CN/nodes/camera)
- 图像：[图像节点](/zh-CN/nodes/images)

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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 会打印待处理/已配对表。已配对行包含最近连接经过的时间（Last Connect）。
使用 `--connected` 仅显示当前已连接的节点。使用 `--last-connected <duration>`
筛选在某个时长内连接过的节点（例如 `24h`、`7d`）。
使用 `nodes remove --node <id|name|ip>` 删除过期的、由 Gateway 网关拥有的节点配对记录。

审批说明：

- `openclaw nodes pending` 只需要配对作用域。
- `gateway.nodes.pairing.autoApproveCidrs` 只能为明确受信任的、首次 `role: node` 设备配对跳过待处理步骤。它默认关闭，并且不会批准升级。
- `openclaw nodes approve <requestId>` 会从待处理请求继承额外的作用域要求：
  - 无命令请求：仅配对
  - 非执行类节点命令：配对 + 写入
  - `system.run` / `system.run.prepare` / `system.which`：配对 + 管理员

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志：

- `--params <json>`：JSON 对象字符串（默认 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时（默认 `15000`）。
- `--idempotency-key <key>`：可选的幂等键。
- 此处会阻止 `system.run` 和 `system.run.prepare`；如需执行 shell，请使用带有 `host=node` 的 `exec` 工具。

如需在节点上执行 shell，请使用带有 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
`nodes` CLI 现在专注于能力：通过 `nodes invoke` 直接 RPC，再加上配对、摄像头、
屏幕、位置、Canvas 和通知。Canvas 命令由内置的实验性 Canvas 插件实现；核心保留了兼容性钩子，因此它们仍位于 `openclaw nodes canvas` 下。

## 相关

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
