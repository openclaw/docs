---
read_when:
    - 你正在管理已配对的节点（相机、屏幕、画布）
    - 你需要批准请求或调用节点命令
summary: '`openclaw nodes` 的 CLI 参考（状态、配对、调用、相机/画布/屏幕）'
title: 节点
x-i18n:
    generated_at: "2026-04-27T12:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

管理已配对的节点（设备）并调用节点能力。

相关内容：

- 节点概览：[Nodes](/zh-CN/nodes)
- 相机：[Camera 节点](/zh-CN/nodes/camera)
- 图像：[Image 节点](/zh-CN/nodes/images)

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

`nodes list` 会打印待处理/已配对表格。已配对行包含最近一次连接距今的时间（Last Connect）。
使用 `--connected` 仅显示当前已连接的节点。使用 `--last-connected <duration>` 可筛选在某个时间段内连接过的节点（例如 `24h`、`7d`）。
使用 `nodes remove --node <id|name|ip>` 可删除过时的、由 Gateway 网关拥有的节点配对记录。

批准说明：

- `openclaw nodes pending` 仅需要配对作用域。
- `gateway.nodes.pairing.autoApproveCidrs` 仅会对显式信任的、首次配对的 `role: node` 设备跳过待处理步骤。它默认关闭，且不会批准升级请求。
- `openclaw nodes approve <requestId>` 会继承待处理请求的额外作用域要求：
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
`nodes` CLI 现在专注于能力调用：通过 `nodes invoke` 进行直接 RPC，以及配对、相机、屏幕、位置、画布和通知。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Nodes](/zh-CN/nodes)
