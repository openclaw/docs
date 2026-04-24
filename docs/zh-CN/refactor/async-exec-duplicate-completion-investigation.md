---
read_when:
    - 排查重复的节点 exec 完成事件
    - 处理 heartbeat / system-event 去重
summary: 重复异步 exec 完成注入的调查记录
title: Async Exec Duplicate Completion Investigation
x-i18n:
    generated_at: "2026-04-24T04:06:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## 范围

- 会话：`agent:main:telegram:group:-1003774691294:topic:1`
- 症状：同一个会话 / 运行 `keen-nexus` 的异步 exec 完成在 LCM 中被作为用户轮次记录了两次。
- 目标：识别这更可能是重复会话注入，还是普通的出站投递重试。

## 结论

这更可能是**重复会话注入**，而不是单纯的出站投递重试。

Gateway 网关侧最明显的缺口在于**节点 exec 完成路径**：

1. 节点侧 exec 完成会发出带完整 `runId` 的 `exec.finished`。
2. Gateway 网关的 `server-node-events` 会将其转换为系统事件并请求 heartbeat。
3. heartbeat 运行会将已排空的系统事件块注入到智能体提示中。
4. 内嵌运行器会将该提示作为新的用户轮次持久化到会话转录中。

如果出于任何原因（重放、重连重复、上游重发、生产者重复）导致同一个 `runId` 的 `exec.finished` 两次到达 Gateway 网关，OpenClaw 目前在这条路径上**没有基于 `runId` / `contextKey` 的幂等性检查**。第二份副本就会变成第二条内容相同的用户消息。

## 精确代码路径

### 1. 生产者：节点 exec 完成事件

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` 发出 `node.event`，事件为 `exec.finished`。
  - 负载包含 `sessionKey` 和完整 `runId`。

### 2. Gateway 网关事件摄取

- `src/gateway/server-node-events.ts:574-640`
  - 处理 `exec.finished`。
  - 构建文本：
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 通过以下方式将其排入队列：
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 然后立即请求唤醒：
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. 系统事件去重薄弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` 只会抑制**连续的重复文本**：
    - `if (entry.lastText === cleaned) return false`
  - 它会存储 `contextKey`，但**不会**使用 `contextKey` 做幂等性检查。
  - drain 之后，重复抑制会重置。

这意味着，即使代码已经具备稳定的幂等性候选项（`exec:<runId>`），带相同 `runId` 的重放 `exec.finished` 仍然可能在稍后再次被接受。

### 4. 唤醒处理不是主要的重复来源

- `src/infra/heartbeat-wake.ts:79-117`
  - 唤醒会按 `(agentId, sessionKey)` 合并。
  - 相同目标的重复唤醒请求会折叠为一个待处理唤醒条目。

这使得**单独由重复唤醒处理**导致问题的解释，比重复事件摄取要弱。

### 5. Heartbeat 会消费该事件并将其变成提示输入

- `src/infra/heartbeat-runner.ts:535-574`
  - 预检查会窥视待处理系统事件，并对 exec-event 运行进行分类。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` 会排空该会话的队列。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 排空后的系统事件块会被前置到智能体提示正文中。

### 6. 转录注入点

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` 会将完整提示提交给内嵌 PI 会话。
  - 这就是完成事件派生的提示被持久化为用户轮次的位置。

因此，一旦同一个系统事件被重建进提示两次，就会预期出现重复的 LCM 用户消息。

## 为什么单纯的出站投递重试可能性较低

Heartbeat 运行器中确实存在真实的出站失败路径：

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 先生成回复。
  - 之后通过 `deliverOutboundPayloads(...)` 进行出站投递。
  - 此处失败会返回 `{ status: "failed" }`。

但是，对于同一个系统事件队列条目，仅凭这一点**不足以**解释重复的用户轮次：

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - 系统事件队列在出站投递之前就已经被排空。

因此，仅凭渠道发送重试本身，不会重新创建完全相同的排队事件。它可以解释外部投递缺失 / 失败，但不足以单独解释第二条完全相同的会话用户消息。

## 次要的、置信度较低的可能性

智能体运行器中存在完整运行重试循环：

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 某些瞬时失败会重试整个运行，并重新提交相同的 `commandBody`。

如果触发重试条件之前提示已经追加进去，那么这会在**同一次回复执行内部**复制持久化的用户提示。

我将这一可能性排在重复 `exec.finished` 摄取之后，因为：

- 观察到的时间间隔大约为 51 秒，这看起来更像是第二次唤醒 / 轮次，而不是进程内重试；
- 报告已经提到重复的消息发送失败，这更指向一个独立的后续轮次，而不是即时的模型 / 运行时重试。

## 根因假设

最高置信度的假设：

- `keen-nexus` 完成事件来自**节点 exec 事件路径**。
- 相同的 `exec.finished` 被两次投递到 `server-node-events`。
- Gateway 网关接受了这两次事件，因为 `enqueueSystemEvent(...)` 不会按 `contextKey` / `runId` 去重。
- 每个被接受的事件都会触发 heartbeat，并作为用户轮次注入到 PI 转录中。

## 建议的微小外科式修复

如果需要修复，最小且高价值的改动是：

- 让 exec / system-event 幂等性在短时间窗口内遵循 `contextKey`，至少对精确的 `(sessionKey, contextKey, text)` 重复项生效；
- 或者在 `server-node-events` 中为 `exec.finished` 添加一个专用去重，键为 `(sessionKey, runId, event kind)`。

这样就能在重放的 `exec.finished` 变成会话轮次之前，直接阻止重复。

## 相关内容

- [Exec 工具](/zh-CN/tools/exec)
- [Session management](/zh-CN/concepts/session)
