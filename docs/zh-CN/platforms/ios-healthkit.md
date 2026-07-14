---
read_when:
    - 在 iPhone 节点上启用 HealthKit 摘要
    - 调用 health.summary 或排查缺失的健康指标
    - 审查哪些健康数据可以离开 iPhone
summary: 在 iPhone 节点上启用并调用受隐私权限控制的 HealthKit 摘要
title: HealthKit 摘要
x-i18n:
    generated_at: "2026-07-14T13:47:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit 摘要

OpenClaw 可以从已连接的 iPhone 节点请求当前日历日的只读摘要。iPhone 在设备端计算汇总数据，并且仅返回步数、睡眠时长、平均静息心率以及锻炼次数/时长。不支持单条 HealthKit 样本、来源、元数据、临床记录、后台摄取和写入。

此功能默认关闭。它需要在 iPhone 上单独同意，并在 Gateway 网关上授权。

## 要求

- 一部运行 OpenClaw iOS 应用，且 HealthKit 报告健康数据可用的 iPhone。
- 一个已连接并批准的 iPhone 节点。请参阅 [iOS 应用设置](/zh-CN/platforms/ios)。
- 一个可连接到 iPhone 节点的当前版本 Gateway 网关。
- 你期望查看的任何指标均有可读取的“健康”数据。Apple Watch 可以向 iPhone 的“健康”数据存储提供数据，但 HealthKit 摘要不要求安装 OpenClaw watchOS 应用。

## 启用访问权限

### 1. 授权 Gateway 网关命令

将 `health.summary` 添加到 `openclaw.json` 中现有的 `gateway.nodes.allowCommands` 数组。保留其中已有的所有命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` 被归类为高度涉及隐私的命令，iOS 平台默认设置绝不会允许该命令。`gateway.nodes.denyCommands` 中的条目会覆盖允许条目。请参阅[节点命令策略](/zh-CN/nodes#command-policy)。

### 2. 在 iPhone 上启用共享

在 iOS 应用中：

1. 打开 **Settings -> Permissions -> Privacy & Access -> Health Summaries**。
2. 轻点 **Enable & Share Summaries**。
3. 阅读披露信息，然后在 Apple 的权限表单中选择允许 OpenClaw 读取的“健康”类别。

此开关会记录你明确作出的 OpenClaw 共享选择，并不表示 Apple 已授予所有请求类别的权限。

启用 HealthKit 摘要后，节点声明的命令接口中会添加 `health.summary`。请批准由此产生的节点配对更新：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

然后验证已连接的 iPhone 是否公开有效的 `health.summary` 命令：

```bash
openclaw nodes describe --node "<iPhone name>"
```

## 请求今天的摘要

仅支持 `today`。其范围从本地午夜开始，到请求时间为止，并使用 iPhone 当前的日历和时区。

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

智能体可以使用 `nodes` 工具调用相同的命令：

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

摘要载荷包含：

| 字段                     | 含义                                          |
| ------------------------ | --------------------------------------------- |
| `period`                 | 始终为 `today`                               |
| `startISO`               | 当日本地开始时间，编码为 ISO 时刻             |
| `endISO`                 | 请求时间，编码为 ISO 时刻                     |
| `timeZoneIdentifier`     | iPhone 时区标识符                              |
| `stepCount`              | 四舍五入后的累计步数                          |
| `sleepDurationMinutes`   | 去重后的睡眠时间，截取为今天的范围             |
| `restingHeartRateBpm`    | 平均静息心率                                  |
| `workoutCount`           | 今天开始的锻炼次数                            |
| `workoutDurationMinutes` | 这些锻炼的总时长                              |

指标字段是可选的；当 HealthKit 未返回可读取的值时，将省略这些字段。计算时长前会合并睡眠阶段和重叠来源，因此同一分钟不会被重复计算。

## 隐私行为

- 汇总在 iPhone 上进行。原始样本不会离开设备。
- 请求的汇总数据会通过你的 Gateway 网关离开 iPhone。当智能体请求该数据时，汇总数据会传送到已配置的 AI 提供商，并且可能保留在聊天记录中。直接调用 CLI 时，汇总数据会返回给 CLI 操作员。
- OpenClaw 仅请求读取权限，无法添加或修改“健康”数据。
- OpenClaw 仅在调用 `health.summary` 时读取 HealthKit。不会在后台摄取健康数据。
- HealthKit 会刻意隐瞒读取权限是否遭到拒绝。指标缺失可能表示访问遭拒、没有匹配的样本，或数据类型不可用。OpenClaw 无法区分这些情况。
- 此摘要用于提供个人健康和健身背景信息，而非用于诊断或提供医疗建议。

如要停止共享，请返回 **Health Summaries** 并轻点 **Disable**。随后，iPhone 会从其节点接口中移除“健康”能力和 `health.summary` 命令。你也可以从 `gateway.nodes.allowCommands` 中移除 `health.summary`，以关闭 Gateway 网关一侧的访问关卡。

## 故障排查

### 节点未声明该命令

确认已在 iOS 应用中启用 HealthKit 摘要，并且 iPhone 已连接。运行 `openclaw nodes pending` 并批准任何能力更新，然后再次检查 `openclaw nodes describe --node "<iPhone name>"`。

### 命令需要明确选择启用

将 `health.summary` 添加到 `gateway.nodes.allowCommands`。同时检查 `gateway.nodes.denyCommands` 是否包含该命令；拒绝列表优先。

### `HEALTH_ACCESS_DISABLED`

应用端的共享开关已关闭。在 iPhone 上的 **Privacy & Access** 下启用 **Health Summaries**。

### 摘要请求成功，但缺少指标

打开 Apple 的“健康”应用，并确认今天存在相应数据。检查 Apple“健康”设置中授予 OpenClaw 的访问权限，但不要将空结果视为访问遭拒的证据：HealthKit 会有意隐藏这一区别。

### 较早的时间范围失败

该命令仅接受 `{"period":"today"}`。不支持多日和历史摘要。

## 相关内容

- [iOS 应用](/zh-CN/platforms/ios)
- [节点](/zh-CN/nodes)
- [Gateway 配置参考](/zh-CN/gateway/configuration-reference#gateway)
- [安全审计](/zh-CN/gateway/security)
