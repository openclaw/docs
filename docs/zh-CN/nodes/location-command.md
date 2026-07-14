---
read_when:
    - 添加位置节点支持或权限界面
    - 设计 Android 位置权限或前台行为
summary: 节点定位命令、平台权限模式和 Linux GeoClue 设置
title: 位置命令
x-i18n:
    generated_at: "2026-07-14T13:51:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## 要点速览

- `location.get` 是一个节点命令，通过 `node.invoke` 或 `openclaw nodes location get` 调用。
- 默认关闭。
- Android 第三方构建版本使用选择器：关闭 / 使用期间 / 始终。Play 构建版本仍为关闭 / 使用期间。
- 精确位置是一个单独的开关。

## 为什么使用选择器（而不只是开关）

操作系统的位置权限分为多个级别。精确位置也是单独的操作系统授权（iOS 14+ 的“精确”，Android 的“精确”与“粗略”）。应用内选择器决定请求的模式，但实际授予的权限仍由操作系统决定。

## 设置模型

按节点设备：

- `location.enabledMode`：`off | whileUsing | always`
- `location.preciseEnabled`：bool

UI 行为：

- 选择 `whileUsing` 会请求前台权限。
- 在 Android 第三方构建版本中选择 `always` 时，会先请求前台权限、说明后台访问，然后打开 Android 应用设置，以便单独授予 **Allow all the time** 权限。
- Android Play 构建版本不会声明后台位置权限，也不会显示 `always`。
- 如果操作系统拒绝所请求的级别，应用会恢复到已授予的最高级别并显示状态。

## 权限映射（node.permissions）

可选。macOS 节点通过 `node.list`/`node.describe` 上的 `permissions` 映射报告 `location`；iOS/Android 可能会省略它。

## 命令：`location.get`

通过 `node.invoke` 或 CLI 辅助命令调用：

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

错误（稳定代码）：

- `LOCATION_DISABLED`：选择器已关闭。
- `LOCATION_PERMISSION_REQUIRED`：缺少所请求模式所需的权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用处于后台，但仅授予了使用期间权限。
- `LOCATION_TIMEOUT`：未能及时获取定位结果。
- `LOCATION_UNAVAILABLE`：系统故障或没有可用的提供商。

## 后台行为

- 仅当用户选择 `Always` 且 Android 授予了后台位置权限时，Android 第三方构建版本才接受后台 `location.get`。现有的常驻节点服务会添加 `location` 服务类型，并在活动期间显示 `Location: Always`。
- Android Play 构建版本和 `While Using` 模式会在应用处于后台时拒绝 `location.get`。
- 其他节点平台可能有所不同。

## Linux 节点主机

内置的 Linux Node 插件会将 `location.get` 添加到 CLI 的 `openclaw node` 服务，包括未安装 Linux 桌面应用的无头主机。位置功能默认关闭。请在插件条目下启用它，然后重启节点服务：

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

安装 GeoClue2 及其 `where-am-i` 演示程序（在 Debian 和 Ubuntu 上为 `geoclue-2-demo`）。主机的 GeoClue 策略和授权代理必须允许节点服务用户访问。

该插件使用 `where-am-i`，而不是依次调用多个 `busctl`。GeoClue 将客户端创建、属性、启动、更新和停止绑定到同一个 D-Bus 客户端连接；该演示程序会将这一生命周期保持在一起，而各自独立的 `busctl` 子进程无法做到这一点。不会添加 npm 依赖项。

Linux 将 `coarse`、`balanced` 和 `precise` 映射到 GeoClue 的准确度级别 `4`、`6` 和 `8`。它会根据返回的时间戳验证 `maxAgeMs`。GeoClue 的演示程序不会公开所选提供商，因此 `source` 为 `unknown`；仅当报告的准确度为 100 米或更高时，`isPrecise` 才为 true。

Linux 使用相同的稳定错误：`LOCATION_DISABLED`、`LOCATION_TIMEOUT` 和 `LOCATION_UNAVAILABLE`。

## 模型/工具集成

- 智能体工具：`nodes` 工具的 `location_get` 操作（需要节点）。
- CLI：`openclaw nodes location get --node <id>`。
- 智能体指南：仅当用户已启用位置功能并了解其范围时才调用。

## UX 文案（建议）

- 关闭：“位置共享已禁用。”
- 使用期间：“仅当 OpenClaw 打开时。”
- 始终：“允许在 OpenClaw 处于后台时执行所请求的位置检查。”
- 精确：“使用精确的 GPS 位置。关闭此开关可共享大致位置。”

## 相关内容

- [节点概览](/zh-CN/nodes)
- [渠道位置解析](/zh-CN/channels/location)
- [相机拍摄](/zh-CN/nodes/camera)
- [Talk 模式](/zh-CN/nodes/talk)
