---
read_when:
    - 节点已连接，但相机/画布/屏幕/Exec 工具无法使用
    - 你需要理解节点配对与审批之间的思维模型
summary: 排查节点配对、前台运行要求、权限和工具故障
title: 节点故障排查
x-i18n:
    generated_at: "2026-07-11T20:41:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

当节点在状态中可见，但节点工具无法使用时，请参考本页面。

## 命令排查顺序

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后运行节点专用检查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

正常信号：

- 节点已连接，并已为 `node` 角色完成配对。
- `nodes describe` 包含你正在调用的能力。
- Exec 审批显示预期的模式/允许列表。

## 前台运行要求

在 iOS/Android 节点上，`canvas.*`、`camera.*` 和 `screen.*` 只能在前台运行。

快速检查和修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果看到 `NODE_BACKGROUND_UNAVAILABLE`，请将节点应用切换到前台，然后重试。

## 权限矩阵

| 能力                         | iOS                                     | Android                                      | macOS 节点应用                              | 典型失败代码                                  |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | 摄像头（剪辑音频还需要麦克风）          | 摄像头（剪辑音频还需要麦克风）               | 摄像头（剪辑音频还需要麦克风）               | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | Screen Recording（麦克风可选）          | 屏幕捕获提示（麦克风可选）                   | Screen Recording                             | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | 不适用                                  | 不适用                                       | Accessibility + Screen Recording             | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | While Using 或 Always（取决于模式）     | 根据模式使用前台/后台位置权限                 | 位置权限                                     | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | 不适用（节点主机路径）                  | 不适用（节点主机路径）                       | 需要 Exec 审批                               | `SYSTEM_RUN_DENIED`                           |

## 配对与审批

节点命令能否成功由三个独立关卡控制：

1. **设备配对**：此节点能否连接到 Gateway 网关？
2. **Gateway 网关节点命令策略**：RPC 命令 ID 是否受到 `gateway.nodes.allowCommands` / `denyCommands` 和平台默认设置的允许？
3. **Exec 审批**：此节点能否在本地运行特定的 shell 命令？

节点配对是身份/信任关卡，而不是针对每条命令的审批机制。对于 `system.run`，每个节点的策略位于该节点的 Exec 审批文件中（`openclaw approvals get --node ...`），而不在 Gateway 网关配对记录中。

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- 缺少配对：先批准节点设备。
- `nodes describe` 中缺少某条命令：检查 Gateway 网关节点命令策略，并确认节点在连接时是否实际声明了该命令。
- 配对正常但 `system.run` 失败：修复该节点上的 Exec 审批/允许列表。

对于由审批支持的 `host=node` 运行，Gateway 网关还会将执行绑定到已准备好的规范 `systemRunPlan`。如果后续调用方在已批准的运行转发之前修改了命令、cwd 或会话元数据，Gateway 网关会因审批不匹配而拒绝运行，而不是信任修改后的载荷。

## 常见节点错误代码

| 代码                                   | 含义                                                                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | 应用位于后台；请将其切换到前台。                                                                                                                                                                            |
| `CAMERA_DISABLED`                      | 节点设置中的摄像头开关已禁用。                                                                                                                                                                              |
| `*_PERMISSION_REQUIRED`                | 缺少操作系统权限或权限被拒绝。                                                                                                                                                                              |
| `LOCATION_DISABLED`                    | 位置模式已关闭。                                                                                                                                                                                            |
| `LOCATION_PERMISSION_REQUIRED`         | 请求的位置模式未获授权。                                                                                                                                                                                    |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | 应用位于后台，但只有 While Using 权限。                                                                                                                                                                     |
| `COMPUTER_DISABLED`                    | 在 macOS 应用中启用 **Allow Computer Control**，然后批准配对更新。                                                                                                                                           |
| `ACCESSIBILITY_REQUIRED`               | 在 macOS System Settings 中向当前 OpenClaw 应用包授予 Accessibility 权限。                                                                                                                                  |
| `SYSTEM_RUN_DENIED: approval required` | Exec 请求需要明确审批。                                                                                                                                                                                     |
| `SYSTEM_RUN_DENIED: allowlist miss`    | 命令被允许列表模式阻止。在 Windows 节点主机上，除非通过询问流程获得批准，否则在允许列表模式下，`cmd.exe /c ...` 等 shell 包装器形式会被视为未命中允许列表。 |

## 快速恢复循环

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果问题仍未解决：

- 重新批准设备配对。
- 重新打开节点应用（保持前台运行）。
- 重新授予操作系统权限。
- 重新创建或调整 Exec 审批策略。

对于计算机控制，还需确认支持视觉能力的智能体公开了 `computer` 工具、`screen.snapshot` 在拥有 Screen Recording 权限时能够成功执行，并且 `/phone status` 显示了你预期的临时或永久 Gateway 网关授权。`gateway.nodes.denyCommands` 中的条目始终优先于 `allowCommands`。

## 相关内容

- [节点概览](/zh-CN/nodes)
- [摄像头节点](/zh-CN/nodes/camera)
- [位置命令](/zh-CN/nodes/location-command)
- [计算机使用](/zh-CN/nodes/computer-use)
- [Exec 审批](/zh-CN/tools/exec-approvals)
- [Gateway 网关配对](/zh-CN/gateway/pairing)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
