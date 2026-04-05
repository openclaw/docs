---
read_when:
    - 添加定位节点支持或权限 UI 时
    - 设计 Android 定位权限或前台行为时
summary: 用于节点的定位命令（location.get）、权限模式以及 Android 前台行为
title: 定位命令
x-i18n:
    generated_at: "2026-04-05T08:29:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# 定位命令（节点）

## TL;DR

- `location.get` 是一个节点命令（通过 `node.invoke`）。
- 默认关闭。
- Android 应用设置使用选择器：关闭 / 使用时允许。
- 另有一个单独开关：精确位置。

## 为什么使用选择器（而不只是开关）

OS 权限是多层级的。我们可以在应用内暴露一个选择器，但实际授予的权限仍由 OS 决定。

- iOS/macOS 可能会在系统提示/设置中显示**使用时允许**或**始终允许**。
- Android 应用当前仅支持前台定位。
- 精确位置是单独的授权（iOS 14+ 中的“精确位置”，Android 中的“fine” 与 “coarse”）。

UI 中的选择器驱动我们请求的模式；实际授予状态则保存在 OS 设置中。

## 设置模型

针对每个节点设备：

- `location.enabledMode`：`off | whileUsing`
- `location.preciseEnabled`：bool

UI 行为：

- 选择 `whileUsing` 时会请求前台权限。
- 如果 OS 拒绝请求的级别，则回退到当前已授予的最高级别并显示状态。

## 权限映射（node.permissions）

可选。macOS 节点会通过权限映射报告 `location`；iOS/Android 则可能省略。

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

响应负载：

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
- `LOCATION_PERMISSION_REQUIRED`：请求模式所需权限缺失。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用当前在后台，而只允许“使用时允许”。
- `LOCATION_TIMEOUT`：未能在规定时间内获得定位结果。
- `LOCATION_UNAVAILABLE`：系统故障 / 无可用 provider。

## 后台行为

- Android 应用在后台时会拒绝 `location.get`。
- 在 Android 上请求位置时，请保持 OpenClaw 处于打开状态。
- 其他节点平台可能有所不同。

## 模型/工具集成

- 工具界面：`nodes` 工具新增 `location_get` 操作（需要节点）。
- CLI：`openclaw nodes location get --node <id>`。
- 智能体指南：仅在用户已启用定位并理解作用范围时调用。

## UX 文案（建议）

- Off：“位置共享已禁用。”
- While Using：“仅在 OpenClaw 打开时可用。”
- Precise：“使用精确 GPS 位置。关闭此项可共享大致位置。”
