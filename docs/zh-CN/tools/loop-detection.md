---
read_when:
    - 用户报告智能体卡住并重复调用工具
    - 你需要调优重复调用保护
    - 你正在编辑智能体工具/运行时策略
    - 你在上下文溢出重试后遇到 `compaction_loop_persisted` 中止
summary: 如何启用和调优用于检测重复工具调用循环的 guardrails
title: 工具循环检测
x-i18n:
    generated_at: "2026-07-05T11:45:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 有两道相互配合的护栏，用于防范重复的工具调用模式，
二者都在 `tools.loopDetection` 下配置：

1. **循环检测**（`enabled`）- 默认禁用。监视滚动的
   工具调用历史，以发现重复模式和未知工具重试。
2. **压缩后护栏**（`postCompactionGuard`）- 只要
   `enabled` 未被显式设为 `false` 就会启用。每次压缩重试后都会武装，
   如果智能体在窗口内重复相同的 `(tool, args, result)` 三元组，
   就会中止运行。

将 `tools.loopDetection.enabled: false` 设为 `false` 可静默两道护栏。

## 设计原因

- 检测没有进展的重复序列。
- 检测高频无结果循环（相同工具、相同输入、重复
  错误）。
- 检测已知轮询工具的特定重复调用模式。
- 打破上下文溢出 -> 压缩 -> 相同循环的周期，而不是让
  它们无限期运行。

## 配置块

全局默认值，并展示所有已记录字段：

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

按 Agent 覆盖（可选，位于 `agents.list[].tools.loopDetection`）：

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

按 Agent 设置会逐字段覆盖全局块（包括嵌套的
`detectors` 和 `postCompactionGuard`），因此 Agent 只需要设置
它想更改的字段。

### 字段行为

| 字段                            | 默认值 | 效果                                                                                                                                     |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false` | 滚动历史检测器的总开关。`false` 也会禁用压缩后护栏。                                          |
| `historySize`                    | `30`    | 保留用于分析的最近工具调用数量。                                                                                             |
| `warningThreshold`               | `10`    | 模式被归类为仅警告之前的重复次数。                                                                               |
| `criticalThreshold`              | `20`    | 阻止无进展循环模式的重复次数。如果配置错误，运行时会将其限制为高于 `warningThreshold`。                       |
| `unknownToolThreshold`           | `10`    | 在这么多次未命中后阻止对同一个不可用工具的重复调用。不受 `detectors` 控制。                                       |
| `globalCircuitBreakerThreshold`  | `30`    | 跨所有检测器的全局无进展断路器。如果配置错误，运行时会将其限制为高于 `criticalThreshold`。不受 `detectors` 控制。 |
| `detectors.genericRepeat`        | `true`  | 对重复的相同工具 + 相同参数调用发出警告；一旦这些调用也返回相同结果，就会阻止。                                     |
| `detectors.knownPollNoProgress`  | `true`  | 检测已知的无进展轮询模式（`process` 搭配 `action: "poll"`/`"log"`，`command_status`）。                                    |
| `detectors.pingPong`             | `true`  | 检测两次调用之间交替出现的无进展乒乓模式。                                                                      |
| `postCompactionGuard.windowSize` | `3`     | 压缩后护栏保持武装的尝试次数，以及会中止运行的相同三元组计数。                                   |

对于 `exec`，无进展哈希会比较稳定的命令结果（状态、
退出码、超时标志、输出），并忽略易变的运行时元数据，例如
持续时间、PID、会话 ID 和工作目录。出站消息发送
结果在哈希时会剥离易变的逐调用 ID（消息 ID、文件 ID、时间戳），
因此一个“已发送”结果不会看起来与另一个不同的“已发送”
结果相同。当运行 ID 可用时，历史只会在该运行内评估，
因此定时心跳周期和新运行不会继承早前运行的陈旧循环计数。

## 推荐设置

- 对于较小模型，设置 `enabled: true` 并保留阈值默认值。
  旗舰模型很少需要滚动历史检测，可以
  让总开关保持 `false`，同时仍然受益于
  压缩后护栏。
- 保持阈值顺序为 `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`；如果你将 `criticalThreshold` 和
  `globalCircuitBreakerThreshold` 设为小于或等于它们必须超过的
  阈值，运行时会将其向上微调。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`。
  - 可选地提高 `globalCircuitBreakerThreshold`。
  - 只禁用导致问题的特定检测器（`detectors.<name>: false`）。
  - 减小 `historySize` 以缩短历史窗口。
- 要禁用一切，包括压缩后护栏，请显式设置
  `tools.loopDetection.enabled: false`。

## 压缩后护栏

在上下文溢出后的压缩重试之后，运行器会在接下来的少数工具调用上武装一个
短窗口护栏。如果智能体在该窗口内发出相同的
`(toolName, argsHash, resultHash)` 三元组 `postCompactionGuard.windowSize`
次，护栏就会判定压缩没有打破
循环，并以 `compaction_loop_persisted` 错误中止运行。

护栏受总开关 `tools.loopDetection.enabled` 标志控制，但有一个
变化：当该标志未设置或为 `true` 时，它保持**启用**，只有在
该标志被显式设为 `false` 时才会关闭。这是有意设计的 - 该护栏
用于逃离否则会消耗无界 token 的压缩循环，
因此未配置的用户仍会获得保护。

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

- 较低的 `windowSize` 更严格（中止前允许的尝试更少）。
- 较高的 `windowSize` 给智能体更多恢复尝试。
- 当结果在变化时，护栏永远不会中止；只有窗口内字节完全相同的
  结果才会触发它。
- 它只会在压缩重试后的紧接阶段武装，不会在运行中的其他
  时刻武装。

<Note>
  只要总开关未被显式设为 `false`，压缩后护栏就会运行，即使你从未写过 `tools.loopDetection` 块。要验证这一点，请在压缩事件之后立即在 Gateway 网关日志中查找 `post-compaction guard armed for N attempts`。
</Note>

## 日志和预期行为

检测到循环时，OpenClaw 会记录循环事件，并根据严重程度
警告或阻止下一个工具周期，在保留正常工具访问的同时，防止失控的 token
消耗和卡死。

- 警告会先出现。
- 一旦模式持续超过警告阈值，就会阻止。
- 严重阈值会阻止下一个工具周期，并在运行记录中显示清晰的
  循环检测原因。
- 压缩后护栏会发出 `compaction_loop_persisted` 错误，并命名
  触发问题的工具和相同调用计数。

## 相关

<CardGroup cols={2}>
  <Card title="提升权限的 Exec" href="/zh-CN/tools/exec-approvals" icon="shield">
    Shell 执行的允许/拒绝策略。
  </Card>
  <Card title="思考级别" href="/zh-CN/tools/thinking" icon="brain">
    推理强度级别和提供商策略交互。
  </Card>
  <Card title="子智能体" href="/zh-CN/tools/subagents" icon="users">
    生成隔离的智能体以约束失控行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-tools#toolsloopdetection" icon="gear">
    完整的 `tools.loopDetection` 架构和合并语义。
  </Card>
</CardGroup>
