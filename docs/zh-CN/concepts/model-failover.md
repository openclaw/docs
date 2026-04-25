---
read_when:
    - 诊断认证配置文件轮换、冷却时间或模型回退行为
    - 更新认证配置文件或模型的故障切换规则
    - 了解会话模型覆盖如何与回退重试交互
summary: OpenClaw 如何轮换认证配置文件并在各模型之间回退
title: 模型故障切换
x-i18n:
    generated_at: "2026-04-25T17:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e128c288ed420874f1b5eb28ecaa4ada66f09152c1b0b73b1d932bf5e86b6dd7
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前 provider 内的**认证配置文件轮换**。
2. 切换到 `agents.defaults.model.fallbacks` 中的下一个模型进行**模型回退**。

本文解释运行时规则以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

1. 当前选中的会话模型。
2. 按顺序配置的 `agents.defaults.model.fallbacks`。
3. 如果这次运行是从一个覆盖模型开始的，则最后回到已配置的主模型。

在每个候选项内部，OpenClaw 会先尝试认证配置文件故障切换，然后才会推进到下一个模型候选项。

高层时序如下：

1. 解析活动会话模型和认证配置文件偏好。
2. 构建模型候选链。
3. 使用认证配置文件轮换/冷却规则尝试当前 provider。
4. 如果该 provider 因值得故障切换的错误而耗尽，则移动到下一个模型候选项。
5. 在重试开始前持久化选中的回退覆盖，这样其他会话读取方就能看到运行器即将使用的同一个 provider/模型。
6. 如果回退候选失败，则仅在回退拥有的会话覆盖字段仍与失败候选一致时，回滚这些字段。
7. 如果所有候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及在已知时最早的冷却到期时间。

这有意比“保存并恢复整个会话”更窄。回复运行器只持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可以防止失败的回退重试覆盖较新的、无关的会话变更，例如手动 `/model` 更改或在尝试运行期间发生的会话轮换更新。

## 认证存储（密钥 + OAuth）

OpenClaw 对 API key 和 OAuth token 都使用**认证配置文件**。

- 密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版路径：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时认证路由状态存储在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅用于元数据 + 路由**（不存储密钥）。
- 旧版仅导入用 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）。

更多细节：[/concepts/oauth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些 provider 还包括 `projectId`/`enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账号可以共存。

- 默认：没有 email 时使用 `provider:default`。
- 带 email 的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个 provider 有多个配置文件时，OpenClaw 会按以下顺序选择：

1. **显式配置**：`auth.order[provider]`（如果已设置）。
2. **已配置的配置文件**：按 provider 过滤后的 `auth.profiles`。
3. **已存储的配置文件**：`auth-profiles.json` 中该 provider 的条目。

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：** 配置文件类型（**OAuth 优先于 API key**）。
- **次键：** `usageStats.lastUsed`（最早使用的优先，在每种类型内部排序）。
- **冷却中/已禁用的配置文件** 会移到末尾，并按最早到期时间排序。

### 会话粘性（更利于缓存）

OpenClaw 会**按会话固定所选的认证配置文件**，以保持 provider 缓存处于热状态。
它**不会**在每个请求上都轮换。固定的配置文件会持续复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置文件进入冷却/被禁用

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖**，
在新会话开始之前不会自动轮换。

自动固定的配置文件（由会话路由器选中）会被视为一种**偏好**：
它们会被优先尝试，但在限流/超时时 OpenClaw 可能会轮换到其他配置文件。
用户固定的配置文件则会锁定在该配置文件上；如果它失败并且配置了模型回退，
OpenClaw 会切换到下一个模型，而不是切换配置文件。

### 为什么 OAuth 可能“看起来丢失了”

如果同一个 provider 同时有一个 OAuth 配置文件和一个 API key 配置文件，那么在未固定的情况下，轮询可能会在不同消息之间在它们之间切换。要强制使用单个配置文件：

- 用 `auth.order[provider] = ["provider:profileId"]` 固定，或者
- 通过 `/model …` 使用每会话覆盖并指定一个配置文件覆盖（当你的 UI/聊天界面支持时）。

## 冷却时间

当一个配置文件因认证/限流错误失败时（或看起来像限流的超时），OpenClaw 会将其标记为冷却中并移动到下一个配置文件。
这个限流桶不仅仅包含普通的 `429`：它还包括 provider 消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly/monthly limit reached`。
格式/无效请求错误（例如 Cloud Code Assist 工具调用 ID 校验失败）也会被视为值得故障切换，并使用相同的冷却时间。
OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/故障切换信号。
通用服务器文本在来源匹配已知瞬时模式时，也可能落入该超时桶。例如，裸 `pi-ai` 流包装器消息 `An unknown error occurred` 会被视为所有 provider 的值得故障切换错误，因为 `pi-ai` 会在 provider 流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束但没有具体细节时发出它。带有瞬时服务器文本的 JSON `api_error` 负载，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得故障切换的超时。
OpenRouter 特有的通用上游文本，例如裸 `Provider returned error`，只有在 provider 上下文确实是 OpenRouter 时才会被视为超时。
而通用内部回退文本，例如 `LLM request failed with an unknown error.`，则会保持保守，不会单独触发故障切换。

某些 provider SDK 否则可能会在将控制权交还给 OpenClaw 之前，先按很长的 `Retry-After` 窗口休眠。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待上限限制为 60 秒，并立即暴露更长的可重试响应，以便执行这个故障切换路径。你可以通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用这个上限；参见 [/concepts/retry](/zh-CN/concepts/retry)。

限流冷却也可以按模型限定作用域：

- 当已知失败模型 ID 时，OpenClaw 会为限流失败记录 `cooldownModel`。
- 同一 provider 上的兄弟模型在冷却作用域属于另一个模型时仍然可以尝试。
- 计费/禁用窗口仍会跨模型阻止整个配置文件。

冷却时间使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在 `auth-state.json` 的 `usageStats` 下：

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 计费禁用

计费/余额失败（例如“余额不足”/“credit balance too low”）会被视为值得故障切换，但它们通常不是瞬时的。OpenClaw 不会使用短冷却时间，而是将该配置文件标记为**已禁用**（带更长的退避时间），然后轮换到下一个配置文件/provider。

并不是每个看起来像计费问题的响应都是 `402`，也不是每个 HTTP `402` 都会落到这里。即使 provider 返回的是 `401` 或 `403`，OpenClaw 仍会将明确的计费文本保留在计费通道中，但 provider 特定匹配器仍然只作用于拥有它们的 provider（例如 OpenRouter 的 `403 Key limit exceeded`）。与此同时，当消息看起来可重试时，临时性的 `402` 使用窗口和组织/工作区支出限制错误会被归类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。
这些错误会走短冷却/故障切换路径，而不是长计费禁用路径。

状态存储在 `auth-state.json` 中：

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

默认值：

- 计费退避从 **5 小时**开始，每次计费失败翻倍，并在 **24 小时**封顶。
- 如果该配置文件在 **24 小时**内未再次失败，退避计数器会重置（可配置）。
- 过载重试在模型回退前允许进行 **1 次同 provider 配置文件轮换**。
- 过载重试默认使用 **0 毫秒**退避。

## 模型回退

如果一个 provider 的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于耗尽配置文件轮换的认证失败、限流和超时（其他错误不会推进回退）。

与计费冷却相比，过载和限流错误处理得更激进。默认情况下，OpenClaw 允许进行一次同 provider 认证配置文件重试，然后立即切换到下一个已配置的模型回退而不等待。
像 `ModelNotReadyException` 这样的 provider 忙碌信号会落入这个过载桶。
你可以通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 来调整这一行为。

当一次运行以模型覆盖开始时（hooks 或 CLI），回退仍会在尝试完所有已配置回退后，最终回到 `agents.defaults.model.primary`。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 加上已配置的回退构建候选列表。

规则：

- 请求的模型始终排在第一位。
- 显式配置的回退会去重，但不会按模型 allowlist 过滤。它们被视为显式的运维意图。
- 如果当前运行已经处于同一 provider 家族中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
- 如果当前运行处于一个与配置不同的 provider 上，并且该当前模型并不属于已配置回退链的一部分，OpenClaw 不会附加来自另一个 provider 的无关已配置回退。
- 当运行从一个覆盖开始时，已配置的主模型会追加到末尾，这样在更早的候选项耗尽后，候选链可以重新回到正常默认值。

### 哪些错误会推进回退

模型回退会在以下情况下继续：

- 认证失败
- 限流和冷却耗尽
- 过载/provider 忙碌错误
- 类超时的故障切换错误
- 计费禁用
- `LiveSessionModelSwitchError`，它会被标准化为一个故障切换路径，这样过期的持久化模型就不会形成外层重试循环
- 当仍有剩余候选项时，其他未识别错误

模型回退不会在以下情况下继续：

- 不是类超时/故障切换形态的显式中止
- 应保留在压缩/重试逻辑内部处理的上下文溢出错误
  （例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model` 或 `ollama error: context
length exceeded`）
- 当没有候选项剩余时的最终未知错误

### 冷却跳过与探测行为

当一个 provider 的所有认证配置文件都已经处于冷却中时，OpenClaw 不会自动永远跳过该 provider。它会按每个候选项作出决定：

- 持久性认证失败会立即跳过整个 provider。
- 计费禁用通常会跳过，但主候选项仍可以按节流策略进行探测，这样无需重启也能恢复。
- 在接近冷却到期时，主候选项可能会被探测，并带有按 provider 限制的节流。
- 即使处于冷却中，同一 provider 的回退兄弟模型在失败看起来是瞬时的情况下（`rate_limit`、`overloaded` 或未知）仍可以尝试。这在限流按模型限定作用域、而兄弟模型可能仍能立即恢复时尤其相关。
- 瞬时冷却探测在每次回退运行中每个 provider 最多只允许一次，这样单个 provider 就不会拖慢跨 provider 的回退。

## 会话覆盖与实时模型切换

会话模型变更是共享状态。活动运行器、`/model` 命令、压缩/会话更新以及实时会话协调，都会读取或写入同一个会话条目的部分内容。

这意味着回退重试必须与实时模型切换进行协调：

- 只有明确由用户驱动的模型变更才会标记一个待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型变更，例如回退轮换、心跳覆盖或压缩，本身永远不会标记待处理的实时切换。
- 在回退重试开始之前，回复运行器会将选中的回退覆盖字段持久化到会话条目中。
- 实时会话协调会优先使用已持久化的会话覆盖，而不是过时的运行时模型字段。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，而且仅当这些字段仍与失败候选项匹配时才会回滚。

这可以防止经典竞态：

1. 主模型失败。
2. 回退候选项在内存中被选中。
3. 会话存储仍然显示旧的主模型。
4. 实时会话协调读取了过时的会话状态。
5. 在回退尝试开始之前，重试被拉回到了旧模型。

持久化的回退覆盖关闭了这个窗口，而窄范围回滚则能保持较新的手动或运行时会话变更不被破坏。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，这些信息会用于日志和面向用户的冷却提示消息：

- 尝试的 provider/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的故障切换原因）
- 可选的 status/code
- 人类可读的错误摘要

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以利用它构建更具体的消息，例如“所有模型当前都受到临时限流”，并在已知时包含最早的冷却到期时间。

这个冷却摘要是模型感知的：

- 与已尝试 provider/模型链无关的按模型限定作用域的限流会被忽略
- 如果剩余阻塞是一个匹配的按模型限定作用域的限流，OpenClaw 会报告最后一个仍阻止该模型的匹配到期时间

## 相关配置

有关以下内容，请参见 [Gateway 网关配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和回退概览，请参见 [Models](/zh-CN/concepts/models)。
