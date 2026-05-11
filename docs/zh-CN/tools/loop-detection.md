---
read_when:
    - 用户报告智能体卡住并重复进行工具调用
    - 你需要调优重复调用保护
    - 你正在编辑智能体工具/运行时策略
    - 你在上下文溢出重试后遇到 `compaction_loop_persisted` 中止
summary: 如何启用并调优用于检测重复工具调用循环的防护机制
title: 工具循环检测
x-i18n:
    generated_at: "2026-05-11T20:35:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 对重复工具调用模式有两道协同护栏：

1. **循环检测**（`tools.loopDetection.enabled`）——默认禁用。监视滚动工具调用历史中的重复模式和未知工具重试。
2. **压缩后保护**（`tools.loopDetection.postCompactionGuard`）——默认启用，除非 `tools.loopDetection.enabled` 显式为 `false`。在每次压缩重试后启用，并在智能体在窗口内发出相同的 `(tool, args, result)` 三元组时中止运行。

两者都在同一个 `tools.loopDetection` 块下配置，但只要主开关没有显式关闭，压缩后保护就会运行。设置 `tools.loopDetection.enabled: false` 可同时静默这两个表面。

## 为什么需要它

- 检测没有取得进展的重复序列。
- 检测高频无结果循环（相同工具、相同输入、重复错误）。
- 检测已知轮询工具的特定重复调用模式。
- 防止上下文溢出、随后压缩、再进入相同循环的周期无限运行。

## 配置块

全局默认值，展示所有已文档化字段：

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

按智能体覆盖（可选）：

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

### 字段行为

| 字段                            | 默认值 | 效果                                                                                                                          |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | 滚动历史检测器的主开关。设置为 `false` 也会禁用压缩后保护。                       |
| `historySize`                    | `30`    | 保留用于分析的最近工具调用数量。                                                                                  |
| `warningThreshold`               | `10`    | 模式被归类为仅警告之前的阈值。                                                                       |
| `criticalThreshold`              | `20`    | 阻止重复无进展循环模式的阈值。                                                                    |
| `unknownToolThreshold`           | `10`    | 在达到这么多次未命中后，阻止对同一个不可用工具的重复调用。                                                       |
| `globalCircuitBreakerThreshold`  | `30`    | 所有检测器上的全局无进展断路器阈值。                                                                      |
| `detectors.genericRepeat`        | `true`  | 对重复的相同工具 + 相同参数模式发出警告，并在相同调用也返回相同结果时阻止。               |
| `detectors.knownPollNoProgress`  | `true`  | 检测没有状态变化的已知类轮询模式。                                                                       |
| `detectors.pingPong`             | `true`  | 检测交替的 ping-pong 模式。                                                                                         |
| `postCompactionGuard.windowSize` | `3`     | 压缩后工具调用的数量，在此期间保护保持启用，也是导致中止运行的相同三元组计数。 |

对于 `exec`，无进展检查会比较稳定的命令结果，并忽略易变的运行时元数据，例如持续时间、PID、会话 ID 和工作目录。当运行 ID 可用时，最近工具调用历史只会在该运行内评估，因此定时 Heartbeat 周期和新运行不会继承早先运行中的陈旧循环计数。

## 推荐设置

- 对于较小模型，设置 `enabled: true` 并保留默认阈值。旗舰模型很少需要滚动历史检测，可以将主开关保持为 `false`，同时仍受益于压缩后保护。
- 保持阈值顺序为 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`。
  - 可选地提高 `globalCircuitBreakerThreshold`。
  - 只禁用导致问题的特定检测器（`detectors.<name>: false`）。
  - 减小 `historySize`，以使用不那么严格的历史上下文。
- 要禁用所有内容（包括压缩后保护），请显式设置 `tools.loopDetection.enabled: false`。

## 压缩后保护

当运行器在上下文溢出后完成压缩重试时，它会启用一个短窗口保护，监视接下来的几次工具调用。如果智能体在窗口内多次发出相同的 `(toolName, argsHash, resultHash)` 三元组，保护会认定压缩没有打破循环，并以 `compaction_loop_persisted` 错误中止运行。

该保护受主 `tools.loopDetection.enabled` 标志控制，但有一个细节：当标志未设置或为 `true` 时，它保持**启用**，只有当标志显式为 `false` 时才停用。这是有意设计。该保护用于摆脱否则会消耗无上限令牌的压缩循环，因此未配置的用户仍会获得保护。

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

- 较低的 `windowSize` 更严格（中止前尝试次数更少）。
- 较高的 `windowSize` 会给智能体更多恢复尝试。
- 当结果正在变化时，保护绝不会中止，只有当窗口内的结果逐字节完全相同时才会中止。
- 它有意保持窄范围：只会在压缩重试之后的短时间内触发。

<Note>
  只要主标志没有显式为 `false`，压缩后保护就会运行，即使你从未写过 `tools.loopDetection` 块。要验证这一点，请在压缩事件后立即在 Gateway 网关日志中查找 `post-compaction guard armed for N attempts`。
</Note>

## 日志和预期行为

检测到循环时，OpenClaw 会报告循环事件，并根据严重程度抑制或阻止下一个工具周期。这能保护用户免受失控令牌开销和锁死影响，同时保留正常工具访问。

- 警告最先出现。
- 当模式持续超过警告阈值时，随后进行抑制。
- 严重阈值会阻止下一个工具周期，并在运行记录中显示清晰的循环检测原因。
- 压缩后保护会发出 `compaction_loop_persisted` 错误，其中包含违规工具名称和相同调用计数。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 批准" href="/zh-CN/tools/exec-approvals" icon="shield">
    Shell 执行的允许/拒绝策略。
  </Card>
  <Card title="思考级别" href="/zh-CN/tools/thinking" icon="brain">
    推理强度级别和提供商策略交互。
  </Card>
  <Card title="子智能体" href="/zh-CN/tools/subagents" icon="users">
    生成隔离智能体以约束失控行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 `tools.loopDetection` 架构和合并语义。
  </Card>
</CardGroup>
