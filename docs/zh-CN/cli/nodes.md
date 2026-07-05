---
read_when:
    - 你正在管理已配对的节点（摄像头、屏幕、画布）
    - 你需要批准请求或调用 node 命令
summary: '`openclaw nodes` 的 CLI 参考（状态、配对、调用、相机/画布/屏幕/位置/通知）'
title: 节点
x-i18n:
    generated_at: "2026-07-05T11:09:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2542d7cba45fd4db7480baee48370aea5980dc03d683ea28b65c11fef1007c03
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

管理已配对的节点（设备），并调用节点能力。

相关：[节点概览](/zh-CN/nodes) - [摄像头节点](/zh-CN/nodes/camera) - [图像节点](/zh-CN/nodes/images)

每个子命令的通用选项：`--url <url>`、`--token <token>`、`--timeout <ms>`（默认 `10000`）、`--json`。

## 状态

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` 和 `list` 都接受 `--connected`（仅已连接节点）和 `--last-connected <duration>`（例如 `24h`、`7d`；仅显示在该时长内连接过的节点）。`list` 会在单独的表中显示待处理节点和已配对节点，已配对行会包含最近一次连接距今时间（最近连接）；`status` 会显示一个合并表，其中包含每个节点的能力和版本详情。`describe` 会打印某个节点的能力、权限，以及生效/待处理的调用命令。

## 配对

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

这些命令驱动由 Gateway 网关拥有的 `node.pair.*` 存储，它独立于设备配对（`openclaw devices approve`），后者用于控制节点的 WS `connect` 握手。两者的关系见[节点](/zh-CN/nodes)。

- `remove` 会撤销节点的已配对角色条目。对于由设备支持的节点，这会在设备配对存储中撤销 `node` 角色，并断开其节点角色会话：混合角色设备会保留其行并仅失去 `node` 角色，仅节点设备行会被删除。它还会清除任何匹配的旧版 Gateway 网关所拥有的节点配对记录。
- `pending` 只需要 `operator.pairing` 权限范围。
- `gateway.nodes.pairing.autoApproveCidrs` 可以为显式信任的、首次 `role: node` 设备配对跳过待处理步骤。默认关闭；不会批准角色升级。
- `approve` 的权限范围要求遵循待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`
- `remove` 权限范围：`operator.pairing` 可以移除非操作员节点行；设备令牌调用方在混合角色设备上撤销自己的节点角色时，还需要 `operator.admin`。

## 调用

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"name":"uname"}'
```

标志：

- `--command <command>`（必需）：例如 `canvas.eval`。
- `--params <json>`：JSON 对象字符串（默认 `{}`）。
- `--invoke-timeout <ms>`：节点调用超时（默认 `15000`）。
- `--idempotency-key <key>`：可选幂等键。

`system.run` 和 `system.run.prepare` 在这里会被阻止；请改用带 `host=node` 的 `exec` 工具来执行 shell。`system.which` 允许通过 `invoke` 使用。

## 通知、推送、位置、屏幕

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` 会在节点上发送本地通知（仅 macOS）。需要 `--title` 或 `--body`。选项：`--sound <name>`、`--priority <passive|active|timeSensitive>`、`--delivery <system|overlay|auto>`（默认 `system`）、`--invoke-timeout <ms>`（默认 `15000`）。
- `push` 会向 iOS 节点发送 APNs 测试推送。选项：`--title <text>`（默认 `OpenClaw`）、`--body <text>`、`--environment <sandbox|production>`，用于覆盖检测到的 APNs 环境。
- `location get` 会获取节点的当前位置。选项：`--max-age <ms>`（复用缓存的位置修正）、`--accuracy <coarse|balanced|precise>`、`--location-timeout <ms>`（默认 `10000`）、`--invoke-timeout <ms>`（默认 `20000`）。
- `screen record` 会捕获短片段并打印保存路径（或使用 `--json` 写入 JSON）。选项：`--screen <index>`（默认 `0`）、`--duration <ms|10s>`（默认 `10000`）、`--fps <fps>`（默认 `10`）、`--no-audio`、`--out <path>`、`--invoke-timeout <ms>`（默认 `120000`）。

Camera 和 Canvas 命令有各自的文档：[摄像头节点](/zh-CN/nodes/camera)、[Canvas](/zh-CN/platforms/mac/canvas)。Canvas 由内置的实验性 Canvas 插件实现；核心保留 `openclaw nodes canvas` 作为兼容性挂载点。

## 相关

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
