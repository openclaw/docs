---
read_when:
    - 节点已连接，但 camera/canvas/screen/exec 工具失败
    - 你需要理解节点配对与批准之间的心智模型
summary: 排查节点配对、前台要求、权限和工具失败问题
title: 节点故障排除
x-i18n:
    generated_at: "2026-04-05T08:36:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# 节点故障排除

当你在状态中能看到某个节点，但节点工具失败时，请使用此页面。

## 命令阶梯

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

健康信号：

- 节点已连接，并已针对角色 `node` 完成配对。
- `nodes describe` 包含你正在调用的能力。
- Exec 批准显示预期的模式/允许列表。

## 前台要求

在 iOS/Android 节点上，`canvas.*`、`camera.*` 和 `screen.*` 仅可在前台使用。

快速检查与修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果你看到 `NODE_BACKGROUND_UNAVAILABLE`，请将节点应用切换到前台后重试。

## 权限矩阵

| 能力                         | iOS                                     | Android                                      | macOS 节点应用               | 典型失败代码                 |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ---------------------------- | ---------------------------- |
| `camera.snap`, `camera.clip` | 相机（剪辑音频还需要麦克风）            | 相机（剪辑音频还需要麦克风）                 | 相机（剪辑音频还需要麦克风） | `*_PERMISSION_REQUIRED`      |
| `screen.record`              | 屏幕录制（麦克风可选）                  | 屏幕捕获提示（麦克风可选）                   | 屏幕录制                     | `*_PERMISSION_REQUIRED`      |
| `location.get`               | 使用期间或始终允许（取决于模式）        | 根据模式使用前台/后台位置权限                | 位置权限                     | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 不适用（节点主机路径）                  | 不适用（节点主机路径）                       | 需要 Exec 批准              | `SYSTEM_RUN_DENIED`          |

## 配对与批准

这些是不同的关卡：

1. **设备配对**：该节点是否可以连接到 Gateway 网关？
2. **Gateway 网关节点命令策略**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 以及平台默认值允许？
3. **Exec 批准**：该节点是否可以在本地运行某个特定 shell 命令？

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果缺少配对，请先批准该节点设备。
如果 `nodes describe` 缺少某个命令，请检查 Gateway 网关节点命令策略，以及该节点在连接时是否确实声明了该命令。
如果配对正常但 `system.run` 失败，请修复该节点上的 Exec 批准/允许列表。

节点配对是身份/信任关卡，而不是按命令划分的批准界面。对于 `system.run`，每个节点的策略位于该节点的 Exec 批准文件中（`openclaw approvals get --node ...`），而不在 Gateway 网关配对记录中。

对于基于批准的 `host=node` 运行，Gateway 网关还会将执行绑定到已准备好的规范 `systemRunPlan`。如果后续调用方在批准后的运行被转发前篡改了命令/cwd 或会话元数据，Gateway 网关会将该运行拒绝为批准不匹配，而不是信任被编辑过的负载。

## 常见节点错误代码

- `NODE_BACKGROUND_UNAVAILABLE` → 应用在后台；请将其切换到前台。
- `CAMERA_DISABLED` → 节点设置中已禁用相机开关。
- `*_PERMISSION_REQUIRED` → 缺少/被拒绝了操作系统权限。
- `LOCATION_DISABLED` → 位置模式已关闭。
- `LOCATION_PERMISSION_REQUIRED` → 请求的位置模式未获授权。
- `LOCATION_BACKGROUND_UNAVAILABLE` → 应用在后台，但仅有“使用期间允许”权限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 请求需要显式批准。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表模式阻止。
  在 Windows 节点主机上，像 `cmd.exe /c ...` 这样的 shell 包装形式在允许列表模式下会被视为允许列表未命中，除非通过 ask 流程获得批准。

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
- 重新创建/调整 Exec 批准策略。

相关内容：

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
