---
read_when:
    - 你正在管理已配对的节点（相机、屏幕、画布）。
    - 你需要批准请求或调用节点命令。
summary: '`openclaw nodes` 的 CLI 参考（status、pairing、invoke、camera/canvas/screen）'
title: 节点
x-i18n:
    generated_at: "2026-04-25T05:53:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

管理已配对的节点（设备）并调用节点能力。

相关内容：

- 节点概览：[节点](/zh-CN/nodes)
- 相机：[相机节点](/zh-CN/nodes/camera)
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
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 会打印待处理/已配对表格。已配对行包含最近一次连接的时间间隔（Last Connect）。
使用 `--connected` 仅显示当前已连接的节点。使用 `--last-connected <duration>` 可筛选在某个时长内连接过的节点（例如 `24h`、`7d`）。

批准说明：

- `openclaw nodes pending` 仅需要 pairing 范围。
- `gateway.nodes.pairing.autoApproveCidrs` 仅对显式信任、首次进行 `role: node` 设备配对时可跳过待处理步骤。它默认关闭，且不会批准升级。
- `openclaw nodes approve <requestId>` 会继承待处理请求的额外范围要求：
  - 无命令请求：仅 pairing
  - 非 exec 节点命令：pairing + write
  - `system.run` / `system.run.prepare` / `system.which`：pairing + admin

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志：

- `--params <json>`：JSON 对象字符串（默认 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时（默认 `15000`）。
- `--idempotency-key <key>`：可选的幂等键。
- `system.run` 和 `system.run.prepare` 在此处被阻止；如需执行 shell，请使用 `host=node` 的 `exec` 工具。

如需在节点上执行 shell，请使用 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
现在的 `nodes` CLI 以能力为中心：通过 `nodes invoke` 进行直接 RPC，并支持 pairing、相机、屏幕、位置、画布和通知。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
