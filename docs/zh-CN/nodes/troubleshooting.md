---
read_when:
    - 节点已连接，但 camera/canvas/screen/exec 工具失败
    - 你需要理解节点配对与审批之间的心智模型
summary: 排查节点配对、前台运行要求、权限和工具故障
title: 节点故障排除
x-i18n:
    generated_at: "2026-07-05T11:29:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f7b98658f1090e48d4a6f4b02788f570458fa5e1d76daa1c4a43e26ffc099e9
    source_path: nodes/troubleshooting.md
    workflow: 16
---

当节点在状态中可见但节点工具失败时，请使用本页。

## 命令阶梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后运行特定于节点的检查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康信号：

- 节点已连接，并已配对为 `node` 角色。
- `nodes describe` 包含你正在调用的能力。
- Exec 审批显示预期的模式/allowlist。

## 前台要求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS/Android 节点上仅限前台使用。

快速检查和修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果看到 `NODE_BACKGROUND_UNAVAILABLE`，请将节点应用切到前台并重试。

## 权限矩阵

| 能力                         | iOS                                     | Android                                      | macOS 节点应用                | 典型失败代码                   |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 相机（剪辑音频还需要麦克风）            | 相机（剪辑音频还需要麦克风）                 | 相机（剪辑音频还需要麦克风）  | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 屏幕录制（麦克风可选）                  | 屏幕捕获提示（麦克风可选）                   | 屏幕录制                      | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用期间或始终（取决于模式）            | 基于模式的前台/后台位置权限                  | 位置权限                      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 不适用（节点主机路径）                  | 不适用（节点主机路径）                       | 需要 Exec 审批                | `SYSTEM_RUN_DENIED`            |

## 配对与审批

有三个独立关口控制节点命令是否成功：

1. **设备配对**：此节点能否连接到 Gateway 网关？
2. **Gateway 网关节点命令策略**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 和平台默认值允许？
3. **Exec 审批**：此节点能否在本地运行特定 shell 命令？

节点配对是身份/信任关口，不是按命令审批的表面。对于 `system.run`，按节点配置的策略位于该节点的 Exec 审批文件中（`openclaw approvals get --node ...`），而不在 Gateway 网关配对记录中。

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- 缺少配对：先批准节点设备。
- `nodes describe` 缺少命令：检查 Gateway 网关节点命令策略，以及节点在连接时是否实际声明了该命令。
- 配对正常但 `system.run` 失败：修复该节点上的 Exec 审批/allowlist。

对于由审批支持的 `host=node` 运行，Gateway 网关还会将执行绑定到已准备好的规范 `systemRunPlan`。如果后续调用方在已批准的运行被转发前修改了命令、cwd 或会话元数据，Gateway 网关会将该运行作为审批不匹配拒绝，而不是信任编辑后的载荷。

## 常见节点错误代码

| 代码                                   | 含义                                                                                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | 应用在后台运行；请将其切到前台。                                                                                                                                                       |
| `CAMERA_DISABLED`                      | 节点设置中已禁用相机开关。                                                                                                                                                             |
| `*_PERMISSION_REQUIRED`                | OS 权限缺失/被拒绝。                                                                                                                                                                    |
| `LOCATION_DISABLED`                    | 位置模式已关闭。                                                                                                                                                                        |
| `LOCATION_PERMISSION_REQUIRED`         | 请求的位置模式未获授权。                                                                                                                                                                |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | 应用在后台运行，但只拥有“使用期间”权限。                                                                                                                                                |
| `SYSTEM_RUN_DENIED: approval required` | Exec 请求需要明确审批。                                                                                                                                                                 |
| `SYSTEM_RUN_DENIED: allowlist miss`    | 命令被 allowlist 模式阻止。在 Windows 节点主机上，像 `cmd.exe /c ...` 这样的 shell 包装形式在 allowlist 模式中会被视为 allowlist 未命中，除非通过询问流程批准。 |

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
- 重新授予 OS 权限。
- 重新创建/调整 Exec 审批策略。

## 相关

- [节点概览](/zh-CN/nodes)
- [相机节点](/zh-CN/nodes/camera)
- [位置命令](/zh-CN/nodes/location-command)
- [Exec 审批](/zh-CN/tools/exec-approvals)
- [Gateway 网关配对](/zh-CN/gateway/pairing)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
