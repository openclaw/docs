---
x-i18n:
    generated_at: "2026-04-15T20:07:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Async Exec 重复完成调查

## 范围

- 会话：`agent:main:telegram:group:-1003774691294:topic:1`
- 现象：同一个针对会话/运行 `keen-nexus` 的异步 exec 完成事件在 LCM 中被记录了两次，且都作为用户轮次。
- 目标：识别这更可能是重复的会话注入，还是单纯的出站投递重试。

## 结论

这最可能是**重复的会话注入**，而不是纯粹的出站投递重试。

Gateway 网关侧最明显的缺口在于**节点 exec 完成路径**：

1. 节点侧 exec 结束会发出带完整 `runId` 的 `exec.finished`。
2. Gateway 网关中的 `server-node-events` 会将其转换为一个 system event，并请求一次 heartbeat。
3. heartbeat 运行会把已排空的 system event 块注入到智能体提示中。
4. 嵌入式 runner 会将该提示作为新的用户轮次持久化到会话 transcript 中。

如果同一个 `runId` 的 `exec.finished` 因任何原因再次到达 Gateway 网关（重放、重连重复、上游重发、生产者重复），OpenClaw 当前在这条路径上**没有基于 `runId` / `contextKey` 的幂等性检查**。第二份副本会变成第二条内容相同的用户消息。

## 精确代码路径

### 1. 生产者：节点 exec 完成事件

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` 会发出事件为 `exec.finished` 的 `node.event`。
  - 载荷包含 `sessionKey` 和完整 `runId`。

### 2. Gateway 网关事件摄取

- `src/gateway/server-node-events.ts:574-640`
  - 处理 `exec.finished`。
  - 构造文本：
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 通过以下方式入队：
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 然后立即请求唤醒：
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. system event 去重薄弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` 只会抑制**连续的重复文本**：
    - `if (entry.lastText === cleaned) return false`
  - 它会存储 `contextKey`，但**不会**使用 `contextKey` 做幂等性判断。
  - drain 之后，重复抑制会重置。

这意味着，即使代码里已经有稳定的幂等性候选键（`exec:<runId>`），稍后被重放的相同 `runId` 的 `exec.finished` 仍然会再次被接受。

### 4. 唤醒处理不是主要的重复来源

- `src/infra/heartbeat-wake.ts:79-117`
  - 唤醒会按 `(agentId, sessionKey)` 合并。
  - 同一目标的重复唤醒请求会折叠为一个待处理唤醒条目。

这使得**单独的重复唤醒处理**相比重复事件摄取而言，是一个更弱的解释。

### 5. Heartbeat 消费事件并将其转为提示输入

- `src/infra/heartbeat-runner.ts:535-574`
  - 预检会窥视待处理的 system event，并对 exec-event 运行进行分类。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` 会排空该会话的队列。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 已排空的 system event 块会被前置到智能体提示正文中。

### 6. Transcript 注入点

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` 会将完整提示提交给嵌入式 PI 会话。
  - 这就是完成事件衍生出的提示被持久化为用户轮次的位置。

因此，一旦同一个 system event 被两次重建进提示中，LCM 中出现重复的用户消息就是符合预期的。

## 为什么单纯的出站投递重试可能性更低

heartbeat runner 中确实存在真实的出站失败路径：

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 回复会先生成。
  - 出站投递随后通过 `deliverOutboundPayloads(...)` 进行。
  - 该步骤失败会返回 `{ status: "failed" }`。

但是，对于同一个 system event 队列条目，仅这一点**不足以**解释重复的用户轮次：

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - system event 队列在出站投递之前就已经被排空了。

所以，单独的渠道发送重试不会重新创建同一个已入队事件。它可以解释外部投递缺失/失败，但本身不能解释第二条完全相同的会话用户消息。

## 次要的、置信度较低的可能性

智能体 runner 中存在完整运行的重试循环：

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 某些瞬时失败可能会重试整个运行，并重新提交同一个 `commandBody`。

如果在触发重试条件之前，提示已经被追加，那么这可能会在**同一次回复执行**中复制一个已持久化的用户提示。

我认为这比重复的 `exec.finished` 摄取可能性更低，因为：

- 观察到的间隔大约为 51 秒，这更像是第二次唤醒/轮次，而不是进程内重试；
- 报告中已经提到消息发送失败反复出现，这更指向一个单独的后续轮次，而不是一次即时的模型/运行时重试。

## 根因假设

最高置信度的假设是：

- `keen-nexus` 的完成事件走的是**节点 exec 事件路径**。
- 同一个 `exec.finished` 被投递到了 `server-node-events` 两次。
- Gateway 网关接受了这两次事件，因为 `enqueueSystemEvent(...)` 不会按 `contextKey` / `runId` 去重。
- 每个被接受的事件都会触发一次 heartbeat，并被注入为 PI transcript 中的一个用户轮次。

## 建议的微创修复

如果要修复，最小但高价值的改动是：

- 让 exec/system-event 的幂等性在短时间窗口内基于 `contextKey` 生效，至少要拦截完全相同的 `(sessionKey, contextKey, text)` 重复；
- 或者在 `server-node-events` 中为 `exec.finished` 增加一个专门的去重，键为 `(sessionKey, runId, event kind)`。

这样可以在重放的 `exec.finished` 变成会话轮次之前，直接将其拦住。
