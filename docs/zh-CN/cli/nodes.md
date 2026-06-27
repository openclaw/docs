---
read_when:
    - 你正在管理已配对的节点（摄像头、屏幕、画布）
    - 你需要批准请求或调用 node 命令
summary: '`openclaw nodes` 的 CLI 参考（状态、配对、调用、摄像头/画布/屏幕）'
title: 节点
x-i18n:
    generated_at: "2026-06-27T01:40:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
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

`nodes list` 会打印待处理/已配对表格。已配对行包含最近一次连接距今时间（Last Connect）。
使用 `--connected` 仅显示当前已连接的节点。使用 `--last-connected <duration>` 来
筛选在某个时长内连接过的节点（例如 `24h`、`7d`）。
使用 `nodes remove --node <id|name|ip>` 移除一个节点配对。对于一个
由设备支持的节点，这会撤销该设备在 `devices/paired.json` 中的 `node` 角色
并断开其节点角色会话（混合角色设备会保留其行，并且
只失去 `node` 角色；仅节点设备会被删除）；它还会清除任何
匹配的旧版 Gateway 网关所属节点配对记录。`operator.pairing` 可以移除
非操作员节点行；设备令牌调用方如果要撤销混合角色设备上的自身节点角色，
还需要 `operator.admin`。

审批说明：

- `openclaw nodes pending` 只需要配对作用域。
- `gateway.nodes.pairing.autoApproveCidrs` 只能为
  显式受信任的首次 `role: node` 设备配对跳过待处理步骤。它默认关闭，
  且不会批准升级。
- `openclaw nodes approve <requestId>` 会从
  待处理请求继承额外的作用域要求：
  - 无命令请求：仅配对
  - 非 exec 节点命令：配对 + 写入
  - `system.run` / `system.run.prepare` / `system.which`：配对 + 管理员

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志：

- `--params <json>`：JSON 对象字符串（默认 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时（默认 `15000`）。
- `--idempotency-key <key>`：可选的幂等键。
- `system.run` 和 `system.run.prepare` 在这里被阻止；请使用带有 `host=node` 的 `exec` 工具执行 shell。

要在节点上执行 shell，请使用带有 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
`nodes` CLI 现在专注于能力：通过 `nodes invoke` 的直接 RPC，以及配对、摄像头、
屏幕、位置、Canvas 和通知。Canvas 命令由内置的实验性 Canvas 插件实现；核心保留兼容性钩子，使其仍位于 `openclaw nodes canvas` 下。

## 相关

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
