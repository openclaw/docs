---
read_when:
    - 在 iOS/Android 节点或 macOS 上添加或修改摄像头捕获
    - 扩展智能体可访问的 MEDIA 临时文件工作流
summary: 用于智能体的相机捕获（iOS/Android 节点 + macOS 应用）：照片（jpg）和短视频片段（mp4）
title: 相机捕获
x-i18n:
    generated_at: "2026-06-27T02:21:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支持面向智能体工作流的**相机拍摄**：

- **iOS 节点**（通过 Gateway 网关配对）：通过 `node.invoke` 拍摄**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **Android 节点**（通过 Gateway 网关配对）：通过 `node.invoke` 拍摄**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **macOS 应用**（通过 Gateway 网关接入的节点）：通过 `node.invoke` 拍摄**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。

所有相机访问都受**用户可控设置**保护。

## iOS 节点

### 用户设置（默认开启）

- iOS Settings 标签页 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认值：**开启**（缺失键名会被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应载荷：
    - `devices`：`{ id, name, position, deviceType }` 数组

- `camera.snap`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `maxWidth`：数字（可选；iOS 节点默认值为 `1600`）
    - `quality`：`0..1`（可选；默认 `0.9`）
    - `format`：当前为 `jpg`
    - `delayMs`：数字（可选；默认 `0`）
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应载荷：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 载荷保护：照片会被重新压缩，以将 base64 载荷保持在 5 MB 以下。

- `camera.clip`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `durationMs`：数字（默认 `3000`，最大限制为 `60000`）
    - `includeAudio`：布尔值（默认 `true`）
    - `format`：当前为 `mp4`
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应载荷：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前台要求

与 `canvas.*` 类似，iOS 节点只允许在**前台**执行 `camera.*` 命令。后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 辅助工具

获取媒体文件的最简单方式是使用 CLI 辅助工具，它会将解码后的媒体写入临时文件，并打印保存路径。

示例：

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

说明：

- `nodes camera snap` 默认使用**前后**两个朝向，以便为智能体提供两个视角。
- 输出文件是临时文件（位于操作系统临时目录中），除非你构建自己的包装器。

## Android 节点

### Android 用户设置（默认开启）

- Android Settings 工作表 → **Camera** → **Allow Camera**（`camera.enabled`）
  - 默认值：**开启**（缺失键名会被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 权限

- Android 需要运行时权限：
  - `CAMERA` 用于 `camera.snap` 和 `camera.clip`。
  - 当 `includeAudio=true` 时，`camera.clip` 需要 `RECORD_AUDIO`。

如果缺少权限，应用会在可能时提示；如果被拒绝，`camera.*` 请求会因
`*_PERMISSION_REQUIRED` 错误而失败。

### Android 前台要求

与 `canvas.*` 类似，Android 节点只允许在**前台**执行 `camera.*` 命令。后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 命令（通过 Gateway 网关 `node.invoke`）

- `camera.list`
  - 响应载荷：
    - `devices`：`{ id, name, position, deviceType }` 数组

### 载荷保护

照片会被重新压缩，以将 base64 载荷保持在 5 MB 以下。

## macOS 应用

### 用户设置（默认关闭）

macOS 配套应用提供一个复选框：

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）
  - 默认值：**关闭**
  - 关闭时：相机请求返回 “用户已禁用相机”。

### CLI 辅助工具（节点调用）

使用主 `openclaw` CLI 在 macOS 节点上调用相机命令。

示例：

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

说明：

- `openclaw nodes camera snap` 默认使用 `maxWidth=1600`，除非被覆盖。
- 在 macOS 上，`camera.snap` 会在预热/曝光稳定后等待 `delayMs`（默认 2000ms）再拍摄。
- 照片载荷会被重新压缩，以将 base64 保持在 5 MB 以下。

## 安全和实际限制

- 相机和麦克风访问会触发常规操作系统权限提示（并且需要 Info.plist 中的使用说明字符串）。
- 视频片段有上限（当前 `<= 60s`），以避免节点载荷过大（base64 开销 + 消息限制）。

## macOS 屏幕视频（操作系统级）

对于_屏幕_视频（不是相机），请使用 macOS 配套应用：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

说明：

- 需要 macOS **Screen Recording** 权限（TCC）。

## 相关内容

- [图像和媒体支持](/zh-CN/nodes/images)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [位置命令](/zh-CN/nodes/location-command)
