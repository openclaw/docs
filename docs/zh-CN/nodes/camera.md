---
read_when:
    - 在 iOS/Android 节点或 macOS 上添加或修改相机捕获功能
    - 扩展智能体可访问的 MEDIA 临时文件工作流
summary: 供智能体使用的相机拍摄功能（iOS/Android 节点 + macOS 应用）：照片（jpg）和短视频片段（mp4）
title: 相机拍摄
x-i18n:
    generated_at: "2026-07-11T20:37:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支持在已配对的 **iOS**、**Android** 和 **macOS** 节点上，为智能体工作流使用摄像头采集功能：通过 Gateway 网关的 `node.invoke` 拍摄照片（`jpg`）或短视频片段（`mp4`，可选择包含音频）。

所有摄像头访问均受各平台上由用户控制的设置约束。

## iOS 节点

### iOS 用户设置

- iOS 的 Settings 标签页 → **Camera** → **Allow Camera**（`camera.enabled`）。
  - 默认：**开启**（缺少该键时视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### iOS 命令（通过 Gateway 网关的 `node.invoke`）

- `camera.list`
  - 响应载荷：`devices` — `{ id, name, position, deviceType }` 数组。

- `camera.snap`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `maxWidth`：数字（可选；默认 `1600`）
    - `quality`：`0..1`（可选；默认 `0.9`，限制在 `[0.05, 1.0]` 范围内）
    - `format`：目前为 `jpg`
    - `delayMs`：数字（可选；默认 `0`，内部上限为 `10000`）
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应载荷：`format: "jpg"`、`base64`、`width`、`height`。
  - 载荷保护：照片会被重新压缩，使 base64 编码后的载荷保持在 5MB 以下。

- `camera.clip`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `durationMs`：数字（默认 `3000`，限制在 `[250, 60000]` 范围内）
    - `includeAudio`：布尔值（默认 `true`）
    - `format`：目前为 `mp4`
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应载荷：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。

### iOS 前台要求

与 `canvas.*` 一样，iOS 节点仅允许在**前台**执行 `camera.*` 命令。在后台调用时会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 辅助命令

获取媒体文件最简单的方法是使用 CLI 辅助命令。它会将解码后的媒体写入临时文件，并输出保存路径。

```bash
openclaw nodes camera snap --node <id>                 # 默认：同时拍摄前置和后置（2 行 MEDIA）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` 默认使用 `--facing both`，同时拍摄前置和后置画面，以便向智能体提供两个视角；使用 `--device-id` 时必须指定一个明确的单一朝向（设置 `--device-id` 后会拒绝 `both`）。除非你构建自己的封装，否则输出文件均为临时文件，位于操作系统的临时目录中。

## Android 节点

### Android 用户设置

- Android 的 Settings 面板 → **Camera** → **Allow Camera**（`camera.enabled`）。
  - **全新安装时默认为关闭。** 在此设置推出前完成的现有安装会迁移为**开启**，以避免升级后原本可用的摄像头访问权限在没有提示的情况下丢失。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED: enable Camera in Settings`。

### 权限

- `camera.snap` 和 `camera.clip` 均需要 `CAMERA` 权限；缺少权限或权限被拒绝时会返回 `CAMERA_PERMISSION_REQUIRED`。
- 当 `includeAudio` 为 `true` 时，`camera.clip` 需要 `RECORD_AUDIO` 权限；缺少权限或权限被拒绝时会返回 `MIC_PERMISSION_REQUIRED`。

应用会在可行时提示用户授予运行时权限。

### Android 前台要求

与 `canvas.*` 一样，Android 节点仅允许在**前台**执行 `camera.*` 命令。在后台调用时会返回 `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`。

### Android 命令（通过 Gateway 网关的 `node.invoke`）

- `camera.list`
  - 响应载荷：`devices` — `{ id, name, position, deviceType }` 数组。

- `camera.snap`
  - 参数：`facing`（`front|back`，默认 `front`）、`quality`（默认 `0.95`，限制在 `[0.1, 1.0]` 范围内）、`maxWidth`（默认 `1600`）、`deviceId`（可选；未知 ID 会以 `INVALID_REQUEST` 失败）。
  - 响应载荷：`format: "jpg"`、`base64`、`width`、`height`。
  - 载荷保护：重新压缩，使 base64 保持在 5MB 以下（与 iOS 的限额相同）。

- `camera.clip`
  - 参数：`facing`（默认 `front`）、`durationMs`（默认 `3000`，限制在 `[200, 60000]` 范围内）、`includeAudio`（默认 `true`）、`deviceId`（可选）。
  - 响应载荷：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。
  - 载荷保护：编码为 base64 前，原始 MP4 的上限为 18MB；超出大小限制的视频片段会以 `PAYLOAD_TOO_LARGE` 失败（请减小 `durationMs` 后重试）。

## macOS 应用

### macOS 用户设置

macOS 配套应用提供了一个复选框：

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）。
  - 默认：**关闭**。
  - 关闭时：摄像头请求返回 `CAMERA_DISABLED: enable Camera in Settings`。

### CLI 辅助命令（节点调用）

使用主 `openclaw` CLI 在 macOS 节点上调用摄像头命令。

```bash
openclaw nodes camera list --node <id>                     # 列出摄像头 ID
openclaw nodes camera snap --node <id>                     # 输出保存路径
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # 输出保存路径
openclaw nodes camera clip --node <id> --duration-ms 3000   # 输出保存路径（旧版标志）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- 除非覆盖，否则 `openclaw nodes camera snap` 默认使用 `maxWidth=1600`。
- `camera.snap` 会在预热和曝光稳定后等待 `delayMs`（默认 2000ms，限制在 `[0, 10000]` 范围内），然后进行拍摄。
- 照片载荷会被重新压缩，使 base64 保持在 5MB 以下。

## 安全与实际限制

- 摄像头和麦克风访问会触发常规的操作系统权限提示（并且需要在 `Info.plist` 中提供用途说明字符串）。
- 视频片段最长为 60 秒，以避免节点载荷过大（包括 base64 开销和消息大小限制）。

## macOS 屏幕视频（操作系统级）

如需录制_屏幕_视频（而非摄像头视频），请使用 macOS 配套应用：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 输出保存路径
```

需要 macOS 的 **Screen Recording** 权限（TCC）。

## 相关内容

- [图像和媒体支持](/zh-CN/nodes/images)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [位置命令](/zh-CN/nodes/location-command)
