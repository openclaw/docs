---
read_when:
    - 在 iOS/Android 节点或 macOS 上添加或修改摄像头采集
    - 扩展智能体可访问的 MEDIA 临时文件工作流
summary: 相机采集（iOS/Android 节点 + macOS 应用）供智能体使用：照片（jpg）和短视频片段（mp4）
title: 摄像头捕获
x-i18n:
    generated_at: "2026-05-06T06:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支持用于智能体工作流的**摄像头捕获**：

- **iOS 节点**（通过 Gateway 网关配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **Android 节点**（通过 Gateway 网关配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **macOS 应用**（通过 Gateway 网关连接的节点）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。

所有摄像头访问都受**用户控制的设置**约束。

## iOS 节点

### 用户设置（默认开启）

- iOS 设置标签页 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认：**开启**（缺失键名会被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：`{ id, name, position, deviceType }` 的数组

- `camera.snap`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `maxWidth`：数字（可选；iOS 节点默认 `1600`）
    - `quality`：`0..1`（可选；默认 `0.9`）
    - `format`：当前为 `jpg`
    - `delayMs`：数字（可选；默认 `0`）
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 负载保护：照片会被重新压缩，以确保 base64 负载低于 5 MB。

- `camera.clip`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `durationMs`：数字（默认 `3000`，最大限制为 `60000`）
    - `includeAudio`：布尔值（默认 `true`）
    - `format`：当前为 `mp4`
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前台要求

与 `canvas.*` 一样，iOS 节点仅允许在**前台**执行 `camera.*` 命令。后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 辅助工具（临时文件 + MEDIA）

获取附件最简单的方式是使用 CLI 辅助工具，它会将解码后的媒体写入临时文件，并打印 `MEDIA:<path>`。

示例：

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注意：

- `nodes camera snap` 默认使用**两个**朝向，为智能体提供两个视角。
- 输出文件是临时文件（位于 OS 临时目录），除非你构建自己的封装器。

## Android 节点

### Android 用户设置（默认开启）

- Android 设置表单 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认：**开启**（缺失键名会被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 权限

- Android 需要运行时权限：
  - `CAMERA` 用于 `camera.snap` 和 `camera.clip`。
  - 当 `includeAudio=true` 时，`RECORD_AUDIO` 用于 `camera.clip`。

如果缺少权限，应用会在可能时提示；如果被拒绝，`camera.*` 请求会失败并返回
`*_PERMISSION_REQUIRED` 错误。

### Android 前台要求

与 `canvas.*` 一样，Android 节点仅允许在**前台**执行 `camera.*` 命令。后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：`{ id, name, position, deviceType }` 的数组

### 负载保护

照片会被重新压缩，以确保 base64 负载低于 5 MB。

## macOS 应用

### 用户设置（默认关闭）

macOS 配套应用提供一个复选框：

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）
  - 默认：**关闭**
  - 关闭时：摄像头请求返回 “用户已禁用摄像头”。

### CLI 辅助工具（节点调用）

使用主 `openclaw` CLI 在 macOS 节点上调用摄像头命令。

示例：

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注意：

- 除非被覆盖，`openclaw nodes camera snap` 默认使用 `maxWidth=1600`。
- 在 macOS 上，`camera.snap` 会在预热/曝光稳定后等待 `delayMs`（默认 2000ms）再捕获。
- 照片负载会被重新压缩，以确保 base64 低于 5 MB。

## 安全性 + 实用限制

- 摄像头和麦克风访问会触发常规 OS 权限提示（并且需要在 Info.plist 中提供用途字符串）。
- 视频片段有时长上限（当前 `<= 60s`），以避免节点负载过大（base64 开销 + 消息限制）。

## macOS 屏幕视频（OS 级别）

对于_屏幕_视频（不是摄像头），使用 macOS 配套应用：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

注意：

- 需要 macOS **Screen Recording** 权限（TCC）。

## 相关内容

- [图像和媒体支持](/zh-CN/nodes/images)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [位置命令](/zh-CN/nodes/location-command)
