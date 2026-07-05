---
read_when:
    - 添加位置节点支持或权限 UI
    - 设计 Android 位置权限或前台行为
summary: 节点的位置命令（location.get）、权限模式和 Android 前台行为
title: 位置命令
x-i18n:
    generated_at: "2026-07-05T11:28:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d0a4d3321a9b4d290461742edb63a7829aeacb082bff11f65e217443d755dc29
    source_path: nodes/location-command.md
    workflow: 16
---

## 简要说明

- `location.get` 是一个节点命令，通过 `node.invoke` 或 `openclaw nodes location get` 调用。
- 默认关闭。
- Android 应用设置使用选择器：关闭 / 使用期间。
- 精确位置是一个单独的开关。

## 为什么使用选择器（而不只是开关）

操作系统的位置权限是多级的（iOS/macOS 暴露“使用期间”与“始终”；Android 目前支持仅前台）。精确位置也是单独的操作系统授权（iOS 14+ 的 “Precise”，Android 的 “fine” 与 “coarse”）。应用内选择器驱动请求的模式，但操作系统仍会决定实际授权。

## 设置模型

按节点设备：

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 行为：

- 选择 `whileUsing` 会请求前台权限。
- 如果操作系统拒绝请求的级别，应用会回退到已授权的最高级别并显示状态。

## 权限映射（node.permissions）

可选。macOS 节点会通过 `node.list`/`node.describe` 上的 `permissions` 映射报告 `location`；iOS/Android 可能会省略它。

## 命令：`location.get`

通过 `node.invoke` 调用，或使用 CLI 辅助命令：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

参数：

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

CLI 标志直接映射：`--location-timeout` -> `timeoutMs`，`--max-age` -> `maxAgeMs`，`--accuracy` -> `desiredAccuracy`。

响应载荷：

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

错误（稳定代码）：

- `LOCATION_DISABLED`：选择器已关闭。
- `LOCATION_PERMISSION_REQUIRED`：请求的模式缺少权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用在后台，但只授权了“使用期间”。
- `LOCATION_TIMEOUT`：未及时获取定位。
- `LOCATION_UNAVAILABLE`：系统故障或没有提供商。

## 后台行为

- Android 应用在后台时会拒绝 `location.get`；在 Android 上请求位置时，请保持 OpenClaw 打开。
- 其他节点平台可能不同。

## 模型/工具集成

- Agent 工具：`nodes` 工具的 `location_get` 操作（需要节点）。
- CLI：`openclaw nodes location get --node <id>`。
- Agent 指南：仅在用户已启用位置并理解范围时调用。

## UX 文案（建议）

- 关闭：“位置共享已禁用。”
- 使用期间：“仅在 OpenClaw 打开时。”
- 精确：“使用精确 GPS 位置。关闭开关可共享大致位置。”

## 相关

- [节点概览](/zh-CN/nodes)
- [渠道位置解析](/zh-CN/channels/location)
- [相机捕获](/zh-CN/nodes/camera)
- [Talk 模式](/zh-CN/nodes/talk)
