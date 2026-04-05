---
read_when:
    - 有用户报告智能体卡在重复调用工具的状态
    - 你需要调优重复调用保护
    - 你正在编辑智能体工具/运行时策略
summary: 如何启用和调优用于检测重复工具调用循环的防护机制
title: 工具循环检测
x-i18n:
    generated_at: "2026-04-05T10:11:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# 工具循环检测

OpenClaw 可以防止智能体卡在重复的工具调用模式中。
该防护机制**默认禁用**。

仅在确有需要时启用它，因为在严格设置下，它可能会阻止合法的重复调用。

## 这项功能为什么存在

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

- `enabled`：总开关。`false` 表示不执行任何循环检测。
- `historySize`：用于分析而保留的最近工具调用数量。
- `warningThreshold`：在将某种模式归类为仅警告之前的阈值。
- `criticalThreshold`：用于阻止重复循环模式的阈值。
- `globalCircuitBreakerThreshold`：全局无进展断路器阈值。
- `detectors.genericRepeat`：检测相同工具 + 相同参数的重复模式。
- `detectors.knownPollNoProgress`：检测无状态变化的已知轮询类模式。
- `detectors.pingPong`：检测交替的乒乓式模式。

## 推荐设置

- 从 `enabled: true` 开始，其他默认值保持不变。
- 保持阈值顺序为 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 仅禁用引发问题的检测器
  - 减小 `historySize`，以减少历史上下文的严格程度

## 日志和预期行为

检测到循环时，OpenClaw 会报告一个循环事件，并根据严重程度阻止或抑制下一次工具周期。
这可以在保留正常工具访问能力的同时，保护用户免受失控的 token 开销和卡死问题影响。

- 优先使用警告和临时抑制。
- 仅在重复证据持续累积时才升级。

## 说明

- `tools.loopDetection` 会与智能体级覆盖配置合并。
- 每个智能体的配置会完整覆盖或扩展全局值。
- 如果不存在任何配置，防护机制将保持关闭。
