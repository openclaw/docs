---
read_when:
    - 有用户报告智能体卡住并重复工具调用
    - 你需要调优重复调用保护
    - 你正在编辑智能体工具/运行时策略
summary: 如何启用并调优用于检测重复性工具调用循环的防护机制
title: 工具循环检测
x-i18n:
    generated_at: "2026-05-03T17:32:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw 可以防止智能体陷入重复的工具调用模式。
该防护**默认禁用**。

仅在需要的地方启用它，因为在严格设置下，它可能会阻止合法的重复调用。

## 存在原因

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

单智能体覆盖（可选）：

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
- `historySize`：保留用于分析的最近工具调用数量。
- `warningThreshold`：将模式分类为仅警告之前的阈值。
- `criticalThreshold`：阻止重复循环模式的阈值。
- `globalCircuitBreakerThreshold`：全局无进展断路器阈值。
- `detectors.genericRepeat`：检测重复的相同工具 + 相同参数模式。
- `detectors.knownPollNoProgress`：检测没有状态变化的已知类轮询模式。
- `detectors.pingPong`：检测交替的乒乓模式。

对于 `exec`，无进展检查会比较稳定的命令结果，并忽略易变的运行时元数据，例如持续时间、PID、会话 ID 和工作目录。
当 run id 可用时，最近的工具调用历史只会在该 run 内评估，因此定时 Heartbeat 周期和新的 run 不会继承早前 run 的陈旧循环计数。

## 推荐设置

- 对于较小的模型，从 `enabled: true` 开始，保持默认值不变。旗舰模型很少需要循环检测，可以保持禁用。
- 保持阈值顺序为 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 只禁用导致问题的检测器
  - 减小 `historySize`，以降低历史上下文的严格程度

## 日志和预期行为

检测到循环时，OpenClaw 会报告循环事件，并根据严重程度阻止或缓和下一个工具周期。
这可以保护用户免受失控 token 消耗和卡死影响，同时保留正常的工具访问能力。

- 优先采用警告和临时抑制。
- 仅在重复证据累积时升级。

## 备注

- `tools.loopDetection` 会与智能体级覆盖合并。
- 单智能体配置会完全覆盖或扩展全局值。
- 如果不存在配置，防护会保持关闭。

## 相关

- [Exec 审批](/zh-CN/tools/exec-approvals)
- [思考级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
