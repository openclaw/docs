---
read_when:
    - 为 iOS/Android 节点或 macOS 添加或修改摄像头捕获功能
    - 扩展智能体可访问的 MEDIA 临时文件工作流
summary: 供智能体使用的摄像头捕获（iOS/Android 节点 + macOS 应用）：照片（jpg）和短视频片段（mp4）
title: 摄像头捕获
x-i18n:
    generated_at: "2026-04-05T08:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# 摄像头捕获（智能体）

OpenClaw 支持用于智能体工作流的**摄像头捕获**：

- **iOS 节点**（通过 Gateway 网关配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **Android 节点**（通过 Gateway 网关配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **macOS 应用**（通过 Gateway 网关作为节点）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。

所有摄像头访问都受**用户控制的设置**保护。

## iOS 节点

### 用户设置（默认开启）

- iOS Settings 标签页 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认：**开启**（缺少该键时视为已启用）。
  - 关闭时：`camera.*` 命令会返回 `CAMERA_DISABLED`。

### 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：`{ id, name, position, deviceType }` 数组

- `camera.snap`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `maxWidth`：数字（可选；iOS 节点上的默认值为 `1600`）
    - `quality`：`0..1`（可选；默认 `0.9`）
    - `format`：当前为 `jpg`
    - `delayMs`：数字（可选；默认 `0`）
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 负载保护：照片会重新压缩，以将 base64 负载保持在 5 MB 以内。

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

### CLI 辅助命令（临时文件 + MEDIA）

获取附件的最简单方式是使用 CLI 辅助命令，它会将解码后的媒体写入临时文件，并打印 `MEDIA:<path>`。

示例：

```bash
openclaw nodes camera snap --node <id>               # 默认：前后摄像头都拍（2 行 MEDIA）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注意事项：

- `nodes camera snap` 默认对**两个朝向**都拍摄，以便让智能体同时获得两个视角。
- 输出文件是临时文件（位于操作系统临时目录中），除非你构建自己的封装器。

## Android 节点

### Android 用户设置（默认开启）

- Android Settings 面板 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认：**开启**（缺少该键时视为已启用）。
  - 关闭时：`camera.*` 命令会返回 `CAMERA_DISABLED`。

### 权限

- Android 需要运行时权限：
  - `CAMERA`：用于 `camera.snap` 和 `camera.clip`。
  - `RECORD_AUDIO`：当 `camera.clip` 且 `includeAudio=true` 时需要。

如果缺少权限，应用会在可能时弹出提示；如果被拒绝，`camera.*` 请求会以
`*_PERMISSION_REQUIRED` 错误失败。

### Android 前台要求

与 `canvas.*` 一样，Android 节点仅允许在**前台**执行 `camera.*` 命令。后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：`{ id, name, position, deviceType }` 数组

### 负载保护

照片会重新压缩，以将 base64 负载保持在 5 MB 以内。

## macOS 应用

### 用户设置（默认关闭）

macOS 配套应用提供一个复选框：

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）
  - 默认：**关闭**
  - 关闭时：摄像头请求会返回 “Camera disabled by user”。

### CLI 辅助命令（node invoke）

使用主 `openclaw` CLI 在 macOS 节点上调用摄像头命令。

示例：

```bash
openclaw nodes camera list --node <id>            # 列出摄像头 id
openclaw nodes camera snap --node <id>            # 打印 MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # 打印 MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # 打印 MEDIA:<path>（旧版标志）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注意事项：

- `openclaw nodes camera snap` 默认使用 `maxWidth=1600`，除非另行覆盖。
- 在 macOS 上，`camera.snap` 会在预热/曝光稳定后等待 `delayMs`（默认 2000 ms）再进行拍摄。
- 照片负载会重新压缩，以将 base64 保持在 5 MB 以内。

## 安全性与实际限制

- 摄像头和麦克风访问会触发常规的操作系统权限提示（并且需要在 `Info.plist` 中提供用途说明字符串）。
- 视频片段有时长上限（当前 `<= 60s`），以避免节点负载过大（base64 开销 + 消息限制）。

## macOS 屏幕视频（操作系统级）

对于_屏幕_视频（而非摄像头），请使用 macOS 配套应用：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 打印 MEDIA:<path>
```

注意事项：

- 需要 macOS **Screen Recording** 权限（TCC）。
