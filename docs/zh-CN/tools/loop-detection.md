---
read_when:
    - 有用户报告智能体会卡住并重复调用工具
    - 你需要调整重复调用保护机制
    - 你正在编辑智能体工具/运行时策略
summary: 如何启用和调整用于检测重复工具调用循环的护栏机制
title: 工具循环检测
x-i18n:
    generated_at: "2026-04-27T12:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw 可以防止智能体陷入重复工具调用模式。
该护栏**默认禁用**。

只在确有需要的地方启用它，因为在严格设置下，它可能会拦截合法的重复调用。

## 为什么需要这个功能

- 检测没有取得进展的重复序列。
- 检测高频率、无结果的循环（相同工具、相同输入、重复错误）。
- 针对已知轮询工具检测特定的重复调用模式。

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

每智能体覆盖值（可选）：

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

- `enabled`：主开关。`false` 表示不会执行任何循环检测。
- `historySize`：为分析保留的最近工具调用数量。
- `warningThreshold`：在将某个模式归类为仅警告之前的阈值。
- `criticalThreshold`：用于阻止重复循环模式的阈值。
- `globalCircuitBreakerThreshold`：全局无进展断路器阈值。
- `detectors.genericRepeat`：检测相同工具 + 相同参数的重复模式。
- `detectors.knownPollNoProgress`：检测没有状态变化的已知轮询类模式。
- `detectors.pingPong`：检测交替来回的乒乓模式。

对于 `exec`，无进展检查会比较稳定的命令结果，并忽略易变的运行时元数据，例如耗时、PID、会话 ID 和工作目录。
当有运行 ID 可用时，最近的工具调用历史只会在该运行内进行评估，因此定时 heartbeat 周期和全新运行不会继承早期运行中的陈旧循环计数。

## 推荐设置

- 先使用 `enabled: true`，其余默认值保持不变。
- 保持阈值顺序为 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 只禁用引发问题的那个检测器
  - 减小 `historySize`，以减少历史上下文的严格程度

## 日志与预期行为

当检测到循环时，OpenClaw 会报告一个循环事件，并根据严重程度阻止或抑制下一个工具循环。
这可以在保留正常工具访问的同时，保护用户免受失控 token 开销和卡死问题的影响。

- 优先使用警告和临时抑制。
- 只有在重复证据持续累积时才升级。

## 说明

- `tools.loopDetection` 会与智能体级覆盖值合并。
- 每智能体配置会完整覆盖或扩展全局值。
- 如果不存在任何配置，护栏将保持关闭。

## 相关内容

- [Exec 批准](/zh-CN/tools/exec-approvals)
- [思考级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
