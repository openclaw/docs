---
read_when:
    - 有用户报告智能体卡住并重复执行工具调用
    - 你需要调整重复调用保护
    - 你正在编辑智能体工具/运行时策略
summary: 如何启用并调优用于检测重复工具调用循环的防护机制
title: 工具循环检测
x-i18n:
    generated_at: "2026-05-05T01:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 可以防止智能体陷入重复的工具调用模式。
该防护默认 **禁用**。

仅在需要的地方启用它，因为在严格设置下，它可能会阻止合法的重复调用。

## 为什么存在此功能

- 检测没有取得进展的重复序列。
- 检测高频无结果循环（相同工具、相同输入、重复错误）。
- 检测已知轮询工具的特定重复调用模式。

## 配置块

全局默认值：

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
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

- `enabled`：总开关。`false` 表示不执行循环检测。
- `historySize`：为分析保留的最近工具调用数量。
- `warningThreshold`：在将某个模式归类为仅警告之前使用的阈值。
- `criticalThreshold`：用于阻止重复循环模式的阈值。
- `globalCircuitBreakerThreshold`：全局无进展断路器阈值。
- `detectors.genericRepeat`：检测相同工具 + 相同参数的重复模式。
- `detectors.knownPollNoProgress`：检测没有状态变化的已知类轮询模式。
- `detectors.pingPong`：检测交替的乒乓模式。

对于 `exec`，无进展检查会比较稳定的命令结果，并忽略易变的运行时元数据，例如持续时间、PID、会话 ID 和工作目录。
当 run id 可用时，最近的工具调用历史只会在该运行内评估，因此定时 Heartbeat 周期和新的运行不会继承较早运行中的陈旧循环计数。

## 推荐设置

- 对于较小的模型，从 `enabled: true` 开始，并保持默认值不变。旗舰模型很少需要循环检测，可以保持禁用。
- 保持阈值顺序为 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 仅禁用导致问题的检测器
  - 减小 `historySize`，以降低历史上下文的严格程度

## 压缩后防护

当 runner 完成自动压缩重试（在上下文溢出之后）时，它会启用一个短窗口防护，用于观察接下来的几次工具调用。如果智能体在该窗口内多次发出 _相同的_ `(toolName, args, result)` 三元组，该防护会判定压缩未能打破循环，并以 `compaction_loop_persisted` 错误中止运行。

这是独立于全局 `tools.loopDetection` 检测器的代码路径。它可单独配置：

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`：压缩后防护保持启用期间的工具调用数量，_并且_ 也是触发中止的相同（工具、参数、结果）三元组数量。

当结果发生变化时，该防护绝不会中止运行；只有当整个窗口内的结果按字节完全相同时才会中止。它有意保持范围很窄：只会在压缩重试后的立即阶段触发。

## 日志和预期行为

当检测到循环时，OpenClaw 会报告循环事件，并根据严重程度阻止或削弱下一个工具周期。
这可以保护用户免受失控的 token 消耗和卡死影响，同时保留正常的工具访问能力。

- 优先使用警告和临时抑制。
- 仅在重复证据积累后升级处理。

## 注意事项

- `tools.loopDetection` 会与智能体级覆盖合并。
- 按智能体配置会完全覆盖或扩展全局值。
- 如果没有配置，防护机制保持关闭。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals)
- [思考级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
