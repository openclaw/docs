---
read_when:
    - 你正在管理已配对的节点（摄像头、屏幕、画布）
    - 你需要批准请求或调用节点命令
summary: '`openclaw nodes` 的 CLI 参考（状态、配对、调用、相机/画布/屏幕/位置/通知）'
title: 节点
x-i18n:
    generated_at: "2026-07-12T14:24:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

管理已配对的节点（设备）并调用节点能力。

相关内容：[节点概览](/zh-CN/nodes) - [活跃计算机状态](/zh-CN/nodes/presence) - [摄像头节点](/zh-CN/nodes/camera) - [图像节点](/zh-CN/nodes/images)

每个子命令的通用选项：`--url <url>`、`--token <token>`、`--timeout <ms>`（默认值为 `10000`）、`--json`。

## 状态

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` 和 `list` 都接受 `--connected`（仅显示已连接的节点）和 `--last-connected <duration>`（例如 `24h`、`7d`；仅显示在指定时长内连接过的节点）。`list` 在不同表格中显示待处理节点和已配对节点，已配对行还会包含最近一次连接距今的时间（Last Connect）；`status` 显示一个合并表格，其中包含每个节点的能力、版本和最后输入详情。已连接的 macOS 节点仅在已授予辅助功能权限时报告最后输入，最新的行会标记为 `active`；请参阅[活跃计算机状态](/zh-CN/nodes/presence)。`describe` 输出单个节点的能力、权限、活动情况以及生效和待处理的调用命令。

## 配对

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

这些命令操作由 Gateway 网关拥有的 `node.pair.*` 存储；该存储与设备配对（`openclaw devices approve`）相互独立，后者用于限制节点的 WS `connect` 握手。有关两者之间的关系，请参阅[节点](/zh-CN/nodes)。

- `remove` 会撤销节点的已配对角色条目。对于由设备支持的节点，此操作会撤销设备配对存储中的 `node` 角色，并断开其节点角色会话：多角色设备会保留其行，仅失去 `node` 角色；仅节点角色的设备行则会被删除。此操作还会清除任何匹配的旧版 Gateway 网关节点配对记录。
- `pending` 仅需要 `operator.pairing` 权限范围。
- `gateway.nodes.pairing.autoApproveCidrs` 可以为明确受信任且首次进行的 `role: node` 设备配对跳过待处理步骤。默认关闭；不会批准角色升级。
- `gateway.nodes.pairing.sshVerify`（默认开启）会在 Gateway 网关能够通过 SSH 连接到节点主机并验证设备密钥时，自动批准首次进行的 `role: node` 设备配对；第一个能力表面也会在同一步骤中获得批准。请参阅[节点配对](/zh-CN/gateway/pairing#ssh-verified-device-auto-approval-default)。
- `approve` 的权限范围要求取决于待处理请求所声明的命令：
  - 不含命令的请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`
- `remove` 权限范围：`operator.pairing` 可以移除非操作员节点行；使用设备令牌的调用方在多角色设备上撤销自身的节点角色时，还需要 `operator.admin`。

## 调用

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

标志：

- `--command <command>`（必需）：例如 `canvas.eval`。
- `--params <json>`：JSON 对象字符串（默认值为 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时时间（默认值为 `15000`）。
- `--idempotency-key <key>`：可选的幂等键。

此处会阻止 `system.run` 和 `system.run.prepare`；如需执行 shell，请改用 `host=node` 的 `exec` 工具。可以通过 `invoke` 调用 `system.which`。

## 通知、推送、位置和屏幕

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` 向声明了 `system.notify` 的节点发送本地通知，包括 macOS、iOS、Android 和直接连接的 watchOS 节点。直接向 watchOS 传送要求 OpenClaw 处于活跃状态。需要 `--title` 或 `--body`。选项：`--sound <name>`、`--priority <passive|active|timeSensitive>`、`--delivery <system|overlay|auto>`（默认值为 `system`）、`--invoke-timeout <ms>`（默认值为 `15000`）。
- `push` 向 iOS 节点发送 APNs 测试推送。选项：`--title <text>`（默认值为 `OpenClaw`）、`--body <text>`、`--environment <sandbox|production>`，用于覆盖检测到的 APNs 环境。
- `location get` 获取节点的当前位置。选项：`--max-age <ms>`（复用缓存的位置修正结果）、`--accuracy <coarse|balanced|precise>`、`--location-timeout <ms>`（默认值为 `10000`）、`--invoke-timeout <ms>`（默认值为 `20000`）。
- `screen record` 捕获一段短视频并输出保存路径（使用 `--json` 时则输出 JSON）。选项：`--screen <index>`（默认值为 `0`）、`--duration <ms|10s>`（默认值为 `10000`）、`--fps <fps>`（默认值为 `10`）、`--no-audio`、`--out <path>`、`--invoke-timeout <ms>`（默认值为 `120000`）。

摄像头和 Canvas 命令有各自的文档：[摄像头节点](/zh-CN/nodes/camera)、[Canvas](/zh-CN/platforms/mac/canvas)。Canvas 由内置的实验性 Canvas 插件实现；核心保留 `openclaw nodes canvas` 作为兼容性挂载点。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
