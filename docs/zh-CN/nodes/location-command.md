---
read_when:
    - 添加位置节点支持或权限 UI
    - 设计 Android 位置权限或前台行为
summary: 面向节点的位置命令（location.get）、权限模式和 Android 前台行为
title: 位置命令
x-i18n:
    generated_at: "2026-05-06T03:39:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## 简而言之

- `location.get` 是节点命令（通过 `node.invoke`）。
- 默认关闭。
- Android 应用设置使用一个选择器：关闭 / 使用期间。
- 单独的开关：精确定位。

## 为什么使用选择器（而不只是开关）

OS 权限是多级的。我们可以在应用内提供选择器，但实际授权仍由 OS 决定。

- iOS/macOS 可能会在系统提示/设置中显示 **使用期间** 或 **始终允许**。
- Android 应用目前仅支持前台定位。
- 精确定位是单独的授权（iOS 14+ “精确”，Android “fine” 与 “coarse”）。

UI 中的选择器决定我们请求的模式；实际授权存储在 OS 设置中。

## 设置模型

按节点设备：

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 行为：

- 选择 `whileUsing` 会请求前台权限。
- 如果 OS 拒绝请求的级别，则回退到已授权的最高级别并显示状态。

## 权限映射（node.permissions）

可选。macOS 节点通过权限映射报告 `location`；iOS/Android 可能会省略它。

## 命令：`location.get`

通过 `node.invoke` 调用。

参数（建议）：

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

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
- `LOCATION_PERMISSION_REQUIRED`：缺少所请求模式的权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用处于后台，但只允许使用期间访问。
- `LOCATION_TIMEOUT`：未能及时定位。
- `LOCATION_UNAVAILABLE`：系统故障 / 无提供商。

## 后台行为

- Android 应用在后台时会拒绝 `location.get`。
- 在 Android 上请求位置时，请保持 OpenClaw 打开。
- 其他节点平台可能有所不同。

## 模型/工具集成

- 工具表面：`nodes` 工具添加 `location_get` 操作（需要节点）。
- CLI：`openclaw nodes location get --node <id>`。
- 智能体指南：仅在用户已启用位置且理解范围时调用。

## UX 文案（建议）

- 关闭：“位置共享已禁用。”
- 使用期间：“仅在 OpenClaw 打开时。”
- 精确：“使用精确 GPS 位置。关闭开关以共享大致位置。”

## 相关

- [频道位置解析](/zh-CN/channels/location)
- [相机捕获](/zh-CN/nodes/camera)
- [Talk 模式](/zh-CN/nodes/talk)
