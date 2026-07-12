---
read_when:
    - 节点已连接，但相机/画布/屏幕/Exec 工具失败
    - 你需要理解节点配对与审批之间的概念模型
summary: 排查节点配对、前台运行要求、权限和工具故障
title: 节点故障排查
x-i18n:
    generated_at: "2026-07-12T14:34:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

当节点在状态中可见但节点工具失败时，请使用本页面。

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

健康状态信号：

- 节点已连接，并已为 `node` 角色完成配对。
- `nodes describe` 包含你正在调用的能力。
- Exec 审批显示预期的模式/允许列表。

## 前台运行要求

在 iOS/Android 节点上，`canvas.*`、`camera.*` 和 `screen.*` 仅可在前台运行。

快速检查和修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果看到 `NODE_BACKGROUND_UNAVAILABLE`，请将节点应用切换到前台，然后重试。

## 权限矩阵

| 能力                         | iOS                                  | Android                                 | macOS 节点应用                    | 典型故障代码                                  |
| ---------------------------- | ------------------------------------ | --------------------------------------- | --------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | 相机（录制片段音频还需麦克风）       | 相机（录制片段音频还需麦克风）          | 相机（录制片段音频还需麦克风）    | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | 屏幕录制（麦克风可选）               | 屏幕捕获提示（麦克风可选）              | 屏幕录制                          | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | 不适用                               | 不适用                                  | 辅助功能 + 屏幕录制               | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | 使用 App 期间或始终（取决于模式）    | 根据模式使用前台/后台位置信息            | 位置权限                          | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | 不适用（节点主机路径）               | 不适用（节点主机路径）                   | 需要 Exec 审批                    | `SYSTEM_RUN_DENIED`                           |

## 配对与审批

节点命令能否成功由三个独立关卡控制：

1. **设备配对**：此节点能否连接到 Gateway 网关？
2. **Gateway 网关节点命令策略**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 以及平台默认值允许？
3. **Exec 审批**：此节点能否在本地运行特定的 shell 命令？

节点配对是身份/信任关卡，而不是按命令审批的界面。对于 `system.run`，按节点的策略位于该节点的 Exec 审批文件中（`openclaw approvals get --node ...`），而不在 Gateway 网关配对记录中。

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- 缺少配对：先批准节点设备。
- `nodes describe` 中缺少命令：检查 Gateway 网关节点命令策略，并确认节点在连接时是否确实声明了该命令。
- 配对正常但 `system.run` 失败：修复该节点上的 Exec 审批/允许列表。

对于由审批支持的 `host=node` 运行，Gateway 网关还会将执行绑定到准备好的规范 `systemRunPlan`。如果后续调用方在已批准的运行转发之前修改命令、cwd 或会话元数据，Gateway 网关会因审批不匹配而拒绝该运行，而不是信任修改后的载荷。

## 常见节点错误代码

| 代码                                   | 含义                                                                                                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | 应用在后台运行；请将其切换到前台。                                                                                                                                                                 |
| `CAMERA_DISABLED`                      | 节点设置中的相机开关已禁用。                                                                                                                                                                       |
| `*_PERMISSION_REQUIRED`                | 缺少操作系统权限或权限被拒绝。                                                                                                                                                                     |
| `LOCATION_DISABLED`                    | 位置模式已关闭。                                                                                                                                                                                   |
| `LOCATION_PERMISSION_REQUIRED`         | 请求的位置模式未获授权。                                                                                                                                                                           |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | 应用在后台运行，但只有“使用 App 期间”权限。                                                                                                                                                         |
| `COMPUTER_DISABLED`                    | 在 macOS 应用中启用 **Allow Computer Control**，然后批准配对更新。                                                                                                                                  |
| `ACCESSIBILITY_REQUIRED`               | 在 macOS 系统设置中，向当前 OpenClaw 应用包授予辅助功能权限。                                                                                                                                       |
| `SYSTEM_RUN_DENIED: approval required` | Exec 请求需要明确审批。                                                                                                                                                                            |
| `SYSTEM_RUN_DENIED: allowlist miss`    | 命令被允许列表模式阻止。在 Windows 节点主机上，除非通过询问流程获得批准，否则在允许列表模式下，`cmd.exe /c ...` 等 shell 包装器形式会被视为未命中允许列表。 |

## 快速恢复流程

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍未解决：

- 重新批准设备配对。
- 重新打开节点应用（切换到前台）。
- 重新授予操作系统权限。
- 重新创建/调整 Exec 审批策略。

对于计算机控制，还需确认支持视觉的智能体已公开 `computer` 工具、`screen.snapshot` 在具有屏幕录制权限时能够成功，并且 `/phone status` 显示你预期的临时或持久 Gateway 网关授权。`gateway.nodes.denyCommands` 中的条目始终优先于 `allowCommands`。

## 相关内容

- [节点概览](/zh-CN/nodes)
- [相机节点](/zh-CN/nodes/camera)
- [位置命令](/zh-CN/nodes/location-command)
- [计算机使用](/nodes/computer-use)
- [Exec 审批](/zh-CN/tools/exec-approvals)
- [Gateway 网关配对](/zh-CN/gateway/pairing)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
