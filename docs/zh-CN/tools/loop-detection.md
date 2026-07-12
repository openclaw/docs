---
read_when:
    - 用户报告智能体陷入重复调用工具的循环中
    - 你需要调整重复调用保护机制
    - 你正在编辑智能体工具/运行时策略
    - 你在上下文溢出重试后遇到 `compaction_loop_persisted` 中止错误
summary: 如何启用和调整用于检测重复工具调用循环的防护机制
title: 工具循环检测
x-i18n:
    generated_at: "2026-07-11T21:01:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 提供了两道相互协作的防护机制，用于防止重复的工具调用模式，
两者均在 `tools.loopDetection` 下配置：

1. **循环检测**（`enabled`）——默认禁用。监视滚动的
   工具调用历史记录，以发现重复模式和对未知工具的重试。
2. **压缩后防护**（`postCompactionGuard`）——只要
   `enabled` 未被显式设为 `false`，就会启用。每次压缩重试后进入待命状态；
   如果智能体在窗口内重复相同的 `(tool, args, result)` 三元组，
   则中止本次运行。

将 `tools.loopDetection.enabled: false` 设为 `false` 可停用两道防护机制。

## 存在原因

- 检测无法取得进展的重复序列。
- 检测高频、无结果的循环（相同工具、相同输入、重复
  错误）。
- 检测已知轮询工具的特定重复调用模式。
- 打破上下文溢出 -> 压缩 -> 相同循环的周期，而不是让它们
  无限运行。

## 配置块

全局默认值，包含所有已记录的字段：

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

按智能体覆盖（可选，位于 `agents.list[].tools.loopDetection`）：

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

按智能体设置会逐字段覆盖全局配置块（包括嵌套的
`detectors` 和 `postCompactionGuard`），因此智能体只需设置
它想要更改的字段。

### 字段行为

| 字段                             | 默认值  | 效果                                                                                                                                       |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false` | 滚动历史记录检测器的总开关。`false` 还会禁用压缩后防护。                                                                                   |
| `historySize`                    | `30`    | 为分析而保留的近期工具调用数量。                                                                                                           |
| `warningThreshold`               | `10`    | 将某个模式归类为仅警告之前的重复次数。                                                                                                     |
| `criticalThreshold`              | `20`    | 阻止无进展循环模式所需的重复次数。如果配置错误，运行时会将其限制为高于 `warningThreshold`。                                                 |
| `unknownToolThreshold`           | `10`    | 对同一个不可用工具的调用连续失败达到此次数后予以阻止。不受 `detectors` 控制。                                                              |
| `globalCircuitBreakerThreshold`  | `30`    | 跨所有检测器的全局无进展断路器。如果配置错误，运行时会将其限制为高于 `criticalThreshold`。不受 `detectors` 控制。                           |
| `detectors.genericRepeat`        | `true`  | 对相同工具 + 相同参数的重复调用发出警告；当这些调用还返回相同结果时予以阻止。                                                              |
| `detectors.knownPollNoProgress`  | `true`  | 检测已知的无进展轮询模式（使用 `action: "poll"`/`"log"` 的 `process`、`command_status`）。                                                  |
| `detectors.pingPong`             | `true`  | 检测两次调用之间交替出现的无进展乒乓模式。                                                                                                 |
| `postCompactionGuard.windowSize` | `3`     | 压缩后防护保持待命的尝试次数，也是导致运行中止所需的相同三元组数量。                                                                       |

对于 `exec`，无进展哈希会比较稳定的命令结果（状态、
退出代码、超时标志和输出），并忽略易变的运行时元数据，例如
持续时间、PID、会话 ID 和工作目录。对出站消息发送
结果进行哈希时，会移除每次调用中易变的 ID（消息 ID、文件 ID、时间戳），
因此一个“已发送”结果不会看起来与另一个不同的“已发送”
结果相同。当运行 ID 可用时，只会在该次运行内评估历史记录，
因此定时 Heartbeat 周期和新运行不会继承
先前运行中过时的循环计数。

## 推荐设置

- 对于较小的模型，请设置 `enabled: true` 并将阈值保留为
  默认值。旗舰模型通常很少需要滚动历史记录检测，可以
  保持总开关为 `false`，同时仍受益于
  压缩后防护。
- 保持阈值顺序为 `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`；如果你将 `criticalThreshold` 或
  `globalCircuitBreakerThreshold` 设置为小于或等于它必须超过的
  阈值，运行时会将其向上调整。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`。
  - 可选择提高 `globalCircuitBreakerThreshold`。
  - 仅禁用导致问题的特定检测器（`detectors.<name>: false`）。
  - 减小 `historySize`，以缩短历史窗口。
- 要禁用所有功能（包括压缩后防护），请显式设置
  `tools.loopDetection.enabled: false`。

## 压缩后防护

在上下文溢出后进行压缩重试时，运行器会针对接下来的几次工具调用
启用短窗口防护。如果智能体在该窗口内输出相同的
`(toolName, argsHash, resultHash)` 三元组达到
`postCompactionGuard.windowSize` 次，防护机制就会判定压缩未能打破
循环，并以 `compaction_loop_persisted` 错误中止运行。

该防护由总开关 `tools.loopDetection.enabled` 控制，但有一个
特殊之处：当该标志未设置或为 `true` 时，它会保持**启用**，
只有在该标志被显式设为 `false` 时才会关闭。这是有意的设计——该防护
用于摆脱原本会无限消耗令牌的压缩循环，
因此即使用户没有任何相关配置，也能获得这种保护。

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- 较小的 `windowSize` 更严格（中止前允许的尝试次数更少）。
- 较大的 `windowSize` 会给予智能体更多恢复尝试机会。
- 当结果仍在变化时，防护绝不会中止运行；只有窗口内
  逐字节完全相同的结果才会触发它。
- 它只会在压缩重试后立即进入待命状态，而不会在一次运行的其他
  阶段进入待命状态。

<Note>
  只要总开关未被显式设为 `false`，压缩后防护就会运行，即使你从未编写过 `tools.loopDetection` 配置块。要进行验证，请在压缩事件刚发生后立即查看 Gateway 网关日志中是否出现 `post-compaction guard armed for N attempts`。
</Note>

## 日志和预期行为

检测到循环时，OpenClaw 会记录循环事件，并根据严重程度
对下一个工具周期发出警告或进行阻止，从而防止令牌支出失控
和运行锁死，同时保留正常的工具访问能力。

- 首先发出警告。
- 当某个模式持续超过警告阈值后，就会进行阻止。
- 达到严重阈值时，会阻止下一个工具周期，并在运行记录中显示明确的
  循环检测原因。
- 压缩后防护会发出 `compaction_loop_persisted` 错误，其中会注明
  导致问题的工具和相同调用次数。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 审批" href="/zh-CN/tools/exec-approvals" icon="shield">
    Shell 执行的允许/拒绝策略。
  </Card>
  <Card title="思考级别" href="/zh-CN/tools/thinking" icon="brain">
    推理投入级别及其与提供商策略的交互。
  </Card>
  <Card title="子智能体" href="/zh-CN/tools/subagents" icon="users">
    生成相互隔离的智能体，以限制失控行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-tools#toolsloopdetection" icon="gear">
    完整的 `tools.loopDetection` 架构和合并语义。
  </Card>
</CardGroup>
