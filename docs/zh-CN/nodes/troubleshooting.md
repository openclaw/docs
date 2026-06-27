---
read_when:
    - 节点已连接，但 camera/canvas/screen/exec 工具失败
    - 你需要理解节点配对与审批机制之间的心智模型
summary: 排查节点配对、前台要求、权限和工具故障
title: Node 故障排除
x-i18n:
    generated_at: "2026-05-10T19:39:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

当节点在状态中可见但节点工具失败时，使用此页面。

## 命令阶梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后运行节点特定检查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康信号：

- 节点已连接，并已按 `node` 角色配对。
- `nodes describe` 包含你正在调用的能力。
- 执行批准显示预期的模式/允许列表。

## 前台要求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS/Android 节点上只能在前台使用。

快速检查和修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果你看到 `NODE_BACKGROUND_UNAVAILABLE`，请将节点应用切到前台后重试。

## 权限矩阵

| 能力                         | iOS                                     | Android                                     | macOS 节点应用               | 典型失败代码                   |
| ---------------------------- | --------------------------------------- | ------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 摄像头（+ 用于片段音频的麦克风）       | 摄像头（+ 用于片段音频的麦克风）           | 摄像头（+ 用于片段音频的麦克风） | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 屏幕录制（+ 可选麦克风）               | 屏幕捕获提示（+ 可选麦克风）               | 屏幕录制                      | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用期间或始终（取决于模式）           | 基于模式的前台/后台位置                    | 位置权限                      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 不适用（节点主机路径）                 | 不适用（节点主机路径）                     | 需要执行批准                  | `SYSTEM_RUN_DENIED`            |

## 配对与批准

这些是不同的门禁：

1. **设备配对**：此节点能否连接到 Gateway 网关？
2. **Gateway 网关节点命令策略**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 和平台默认值允许？
3. **执行批准**：此节点能否在本地运行特定 shell 命令？

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果缺少配对，请先批准节点设备。
如果 `nodes describe` 缺少某个命令，请检查 Gateway 网关节点命令策略，以及该节点连接时是否实际声明了该命令。
如果配对正常但 `system.run` 失败，请修复该节点上的执行批准/允许列表。

节点配对是身份/信任门禁，不是按命令批准的表面。对于 `system.run`，每个节点的策略位于该节点的执行批准文件中（`openclaw approvals get --node ...`），不在 Gateway 网关配对记录中。

对于由批准支持的 `host=node` 运行，Gateway 网关还会将执行绑定到
已准备好的规范 `systemRunPlan`。如果后续调用方在已批准运行转发之前更改命令/cwd 或
会话元数据，Gateway 网关会将该运行作为批准不匹配而拒绝，而不是信任被编辑的载荷。

## 常见节点错误代码

- `NODE_BACKGROUND_UNAVAILABLE` → 应用在后台；将其切到前台。
- `CAMERA_DISABLED` → 节点设置中的摄像头开关已禁用。
- `*_PERMISSION_REQUIRED` → 缺少/拒绝了操作系统权限。
- `LOCATION_DISABLED` → 位置模式已关闭。
- `LOCATION_PERMISSION_REQUIRED` → 请求的位置模式未被授予。
- `LOCATION_BACKGROUND_UNAVAILABLE` → 应用在后台，但只有“使用期间”权限。
- `SYSTEM_RUN_DENIED: approval required` → 执行请求需要显式批准。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表模式阻止。
  在 Windows 节点主机上，像 `cmd.exe /c ...` 这样的 shell 包装形式在
  允许列表模式下会被视为允许列表未命中，除非通过询问流程批准。

## 快速恢复循环

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然卡住：

- 重新批准设备配对。
- 重新打开节点应用（前台）。
- 重新授予操作系统权限。
- 重新创建/调整执行批准策略。

## 相关

- [节点概览](/zh-CN/nodes)
- [摄像头节点](/zh-CN/nodes/camera)
- [位置命令](/zh-CN/nodes/location-command)
- [执行批准](/zh-CN/tools/exec-approvals)
- [Gateway 网关配对](/zh-CN/gateway/pairing)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
- [频道故障排除](/zh-CN/channels/troubleshooting)
