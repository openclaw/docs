---
read_when:
    - 添加位置节点支持或权限界面
    - 设计 Android 位置权限或前台行为
summary: 节点定位命令（location.get）、权限模式和 Android 前台行为
title: 位置命令
x-i18n:
    generated_at: "2026-07-11T20:41:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## 摘要

- `location.get` 是节点命令，可通过 `node.invoke` 或 `openclaw nodes location get` 调用。
- 默认关闭。
- Android 第三方构建版本使用选择器：关闭 / 使用期间 / 始终。Play 构建版本仍仅提供关闭 / 使用期间。
- 精确位置是一个单独的开关。

## 为什么使用选择器（而不只是开关）

操作系统的位置权限分为多个级别。精确位置也是一项独立的操作系统授权（iOS 14+ 中的“精确”，Android 中的“精确”与“粗略”）。应用内选择器决定请求的模式，但实际授予的权限仍由操作系统决定。

## 设置模型

每台节点设备：

- `location.enabledMode`：`off | whileUsing | always`
- `location.preciseEnabled`：布尔值

界面行为：

- 选择 `whileUsing` 会请求前台权限。
- 在 Android 第三方构建版本中选择 `always` 时，应用会先请求前台权限、说明后台访问需求，然后打开 Android 应用设置，以单独授予 **Allow all the time** 权限。
- Android Play 构建版本不声明后台位置权限，也不显示 `always`。
- 如果操作系统拒绝所请求的权限级别，应用会回退到已授予的最高级别并显示状态。

## 权限映射（node.permissions）

可选。macOS 节点通过 `node.list`/`node.describe` 中的 `permissions` 映射报告 `location`；iOS/Android 可能会省略它。

## 命令：`location.get`

通过 `node.invoke` 或以下 CLI 辅助命令调用：

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

CLI 标志直接映射：`--location-timeout` -> `timeoutMs`、`--max-age` -> `maxAgeMs`、`--accuracy` -> `desiredAccuracy`。

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

错误（稳定错误码）：

- `LOCATION_DISABLED`：选择器处于关闭状态。
- `LOCATION_PERMISSION_REQUIRED`：缺少所请求模式需要的权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用处于后台，但仅授予了“使用期间”权限。
- `LOCATION_TIMEOUT`：未能及时获取位置。
- `LOCATION_UNAVAILABLE`：系统故障或没有可用的位置提供商。

## 后台行为

- 仅当用户选择“始终”且 Android 已授予后台位置权限时，Android 第三方构建版本才接受后台 `location.get`。现有的持久节点服务会添加 `location` 服务类型，并在活动期间公开显示 `Location: Always`。
- Android Play 构建版本和“使用期间”模式会在应用处于后台时拒绝 `location.get`。
- 其他节点平台的行为可能有所不同。

## 模型/工具集成

- 智能体工具：`nodes` 工具的 `location_get` 操作（必须指定节点）。
- CLI：`openclaw nodes location get --node <id>`。
- 智能体准则：仅当用户已启用位置功能并了解其作用范围时调用。

## 用户体验文案（建议）

- 关闭：“位置共享已禁用。”
- 使用期间：“仅在 OpenClaw 打开时。”
- 始终：“允许在 OpenClaw 处于后台时执行请求的位置检查。”
- 精确：“使用精确的 GPS 位置。关闭此开关可共享大致位置。”

## 相关内容

- [节点概览](/zh-CN/nodes)
- [渠道位置解析](/zh-CN/channels/location)
- [相机拍摄](/zh-CN/nodes/camera)
- [Talk 模式](/zh-CN/nodes/talk)
