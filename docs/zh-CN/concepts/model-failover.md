---
read_when:
    - 诊断认证配置档案轮换、冷却期或模型回退行为
    - 更新认证配置档案或模型的故障切换规则
    - 理解会话模型覆盖如何与回退重试交互
summary: OpenClaw 如何轮换认证配置档案并在模型之间回退
title: 模型故障切换
x-i18n:
    generated_at: "2026-04-05T08:22:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# 模型故障切换

OpenClaw 分两个阶段处理失败：

1. 在当前提供商内进行**认证配置档案轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文档解释运行时规则以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

1. 当前选中的会话模型。
2. 按顺序配置的 `agents.defaults.model.fallbacks`。
3. 如果此次运行是从覆盖开始的，则最后回到已配置的主模型。

在每个候选项内部，OpenClaw 会先尝试认证配置档案故障切换，然后才前进到
下一个模型候选项。

高层顺序如下：

1. 解析活动的会话模型和认证配置档案偏好。
2. 构建模型候选链。
3. 使用认证配置档案轮换/冷却规则尝试当前提供商。
4. 如果该提供商因值得触发故障切换的错误而耗尽，则转到下一个
   模型候选项。
5. 在重试开始前持久化选中的回退覆盖，以便其他
   会话读取方看到运行器即将使用的相同提供商/模型。
6. 如果回退候选项失败，则仅回滚由该回退拥有的会话
   覆盖字段，且仅当它们仍然匹配该失败候选项时才会这样做。
7. 如果所有候选项都失败，则抛出一个带有逐次尝试
   细节的 `FallbackSummaryError`，并在已知时包含最早的冷却过期时间。

这有意比“保存并恢复整个会话”更窄。回复运行器只会持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可以防止一次失败的回退重试覆盖掉更新的无关会话变更，
例如在尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 认证存储（keys + OAuth）

OpenClaw 对 API key 和 OAuth token 都使用**认证配置档案**。

- 密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版位置：`~/.openclaw/agent/auth-profiles.json`）。
- 配置 `auth.profiles` / `auth.order` **仅用于元数据 + 路由**（不包含密钥）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）。

更多细节：[/concepts/oauth](/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包括 `projectId`/`enterpriseUrl`）

## 配置档案 ID

OAuth 登录会创建不同的配置档案，以便多个账号可以共存。

- 默认：当没有 email 可用时使用 `provider:default`。
- 带 email 的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置档案位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商拥有多个配置档案时，OpenClaw 会按如下方式选择顺序：

1. **显式配置**：`auth.order[provider]`（如果已设置）。
2. **已配置配置档案**：按提供商过滤后的 `auth.profiles`。
3. **已存储配置档案**：`auth-profiles.json` 中该提供商的条目。

如果没有配置显式顺序，OpenClaw 会使用轮询顺序：

- **主排序键：** 配置档案类型（**OAuth 优先于 API key**）。
- **次排序键：** `usageStats.lastUsed`（在每种类型内，最久未使用的优先）。
- **冷却中/已禁用配置档案** 会移到末尾，并按最早到期时间排序。

### 会话粘性（有利于缓存）

OpenClaw 会**按会话固定所选认证配置档案**，以保持提供商缓存处于热状态。
它**不会**对每个请求都进行轮换。固定的配置档案会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置档案处于冷却中/已禁用

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖**，
在新会话开始前不会自动轮换。

自动固定的配置档案（由会话路由器选择）会被视为一种**偏好**：
它们会被优先尝试，但在遭遇限流/超时时，OpenClaw 可以轮换到其他配置档案。
用户固定的配置档案会锁定在该配置档案上；如果它失败，并且配置了模型回退，
OpenClaw 会转到下一个模型，而不是切换配置档案。

### 为什么 OAuth 看起来会“丢失”

如果同一提供商下同时存在 OAuth 配置档案和 API key 配置档案，轮询可能会在消息之间来回切换它们，除非已固定。要强制使用单一配置档案：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 使用每会话覆盖，通过带配置档案覆盖的 `/model …`（当你的 UI/聊天界面支持时）。

## 冷却期

当某个配置档案因认证/限流错误失败时（或者看起来像
限流的超时），OpenClaw 会将其标记为进入冷却期，并切换到下一个配置档案。
这个限流桶不仅包括普通的 `429`：还包括提供商
消息，例如 `Too many concurrent requests`、`ThrottlingException`、
`concurrency limit reached`、`workers_ai ... quota limit exceeded`、
`throttled`、`resource exhausted`，以及周期性的用量窗口限制，例如
`weekly/monthly limit reached`。
格式/无效请求错误（例如 Cloud Code Assist 工具调用 ID
校验失败）会被视为值得触发故障切换，并使用相同的冷却期。
兼容 OpenAI 的 stop-reason 错误，例如 `Unhandled stop reason: error`、
`stop reason: error` 和 `reason: error`，会被归类为超时/故障切换
信号。
提供商作用域的通用服务器文本在源头匹配已知瞬时模式时，也可能归入该超时桶。例如，Anthropic 的裸
`An unknown error occurred` 以及带有瞬时服务器文本的 JSON `api_error`
负载，例如 `internal server error`、`unknown error, 520`、`upstream error`
或 `backend error`，都会被视为值得触发故障切换的超时。
OpenRouter 特有的通用上游文本，例如裸 `Provider returned error`，也仅在
提供商上下文确实是 OpenRouter 时才会被视为超时。
通用的内部回退文本，例如 `LLM request failed with an unknown error.`，
则保持保守，不会单独触发故障切换。

限流冷却期也可以是模型作用域的：

- 当已知失败模型 id 时，对于限流失败，OpenClaw 会记录 `cooldownModel`。
- 同一提供商上的兄弟模型如果冷却期被限制在另一个模型上，仍然可以尝试。
- 计费/禁用窗口仍会跨模型阻止整个配置档案。

冷却期使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在 `auth-profiles.json` 的 `usageStats` 下：

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

计费/额度失败（例如“insufficient credits” / “credit balance too low”）会被视为值得触发故障切换，但它们通常不是瞬时错误。OpenClaw 不会使用短冷却期，而是将该配置档案标记为**已禁用**（采用更长退避），然后轮换到下一个配置档案/提供商。

并不是每个看起来像计费问题的响应都是 `402`，也不是每个 HTTP `402` 都会落到
这里。即使提供商返回的是 `401` 或 `403`，OpenClaw 也会将明确的计费文本保留在计费通道中，但提供商特定匹配器仍然局限于拥有它们的提供商（例如 OpenRouter 的 `403 Key limit
exceeded`）。与此同时，临时性的 `402` 用量窗口和
组织/工作区支出上限错误，如果消息看起来可以重试（例如 `weekly usage limit exhausted`、`daily
limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。
这些情况会走短冷却/故障切换路径，而不是长时间的
计费禁用路径。

状态存储在 `auth-profiles.json` 中：

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
- 如果某个配置档案在 **24 小时**内没有失败，退避计数器会重置（可配置）。
- 过载重试允许在模型回退前进行 **1 次同提供商配置档案轮换**。
- 过载重试默认使用 **0 ms 退避**。

## 模型回退

如果某个提供商的所有配置档案都失败，OpenClaw 会转到
`agents.defaults.model.fallbacks` 中的下一个模型。这适用于认证失败、限流，以及
耗尽配置档案轮换的超时（其他错误不会推进回退）。

与计费冷却相比，过载和限流错误处理得更激进。
默认情况下，OpenClaw 允许一次同提供商认证配置档案重试，
然后立即切换到下一个已配置模型回退，无需等待。
提供商繁忙信号，例如 `ModelNotReadyException`，会落入该过载
桶。可通过 `auth.cooldowns.overloadedProfileRotations`、
`auth.cooldowns.overloadedBackoffMs` 和
`auth.cooldowns.rateLimitedProfileRotations` 调整此行为。

当一次运行以模型覆盖开始时（hooks 或 CLI），在尝试完任何已配置回退后，
回退仍会以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model`
和已配置回退构建候选列表。

规则：

- 请求的模型始终位于第一位。
- 显式配置的回退会去重，但不会按模型
  allowlist 过滤。它们被视为显式的操作员意图。
- 如果当前运行已经位于同一提供商家族中的某个已配置回退上，
  OpenClaw 会继续使用完整的已配置链。
- 如果当前运行所在的提供商与配置不同，并且当前
  模型尚未成为已配置回退链的一部分，OpenClaw 不会
  追加来自其他提供商的无关已配置回退。
- 当运行从覆盖开始时，已配置的主模型会追加到
  末尾，以便在前面的候选项耗尽后，候选链可以回到正常默认值。

### 哪些错误会推进回退

模型回退会在以下情况继续：

- 认证失败
- 限流和冷却期耗尽
- 过载/提供商繁忙错误
- 看起来像超时的故障切换错误
- 计费禁用
- `LiveSessionModelSwitchError`，它会被规范化为故障切换路径，因此
  过时的持久化模型不会产生外层重试循环
- 当仍有剩余候选项时，其他未识别错误

模型回退不会在以下情况继续：

- 非超时/非故障切换形态的显式中止
- 应留在压缩/重试逻辑中的上下文溢出错误
  （例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model` 或 `ollama error: context
length exceeded`）
- 当没有候选项剩余时的最终未知错误

### 冷却跳过与探测行为

当某个提供商的所有认证配置档案都已经处于冷却期时，OpenClaw 并不会
自动永远跳过该提供商。它会按每个候选项做决定：

- 持久性认证失败会立即跳过整个提供商。
- 计费禁用通常会跳过，但主候选项仍可能在节流条件下被探测，
  以便无需重启即可恢复。
- 主候选项可能会在冷却期接近到期时被探测，并带有按提供商划分的节流。
- 即使处于冷却期，同提供商的回退兄弟项也可以尝试，只要
  失败看起来是瞬时的（`rate_limit`、`overloaded` 或 unknown）。
  当限流是模型作用域且某个兄弟模型仍可能立即恢复时，这一点尤其相关。
- 瞬时冷却探测在每次回退运行中每个提供商最多仅限一次，因此
  单个提供商不会拖慢跨提供商回退。

## 会话覆盖与实时模型切换

会话模型更改是共享状态。活动运行器、`/model` 命令、
压缩/会话更新，以及实时会话协调，都会读取或写入同一个会话条目的不同部分。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型更改才会标记待处理的实时切换。包括
  `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的模型更改，例如回退轮换、heartbeat 覆盖，
  或压缩，本身不会标记待处理的实时切换。
- 在回退重试开始前，回复运行器会将选中的
  回退覆盖字段持久化到会话条目。
- 实时会话协调会优先采用持久化的会话覆盖，而不是过时的
  运行时模型字段。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，
  并且仅在这些字段仍然与该失败候选项匹配时才会回滚。

这可以防止经典竞态：

1. 主模型失败。
2. 在内存中选中了回退候选项。
3. 会话存储仍然显示旧的主模型。
4. 实时会话协调读取了过时的会话状态。
5. 在回退尝试开始前，重试被拉回到旧模型。

持久化的回退覆盖封闭了这个窗口，而窄范围回滚
则能保持较新的手动或运行时会话更改不被破坏。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录逐次尝试的细节，用于日志和
面向用户的冷却期消息：

- 尝试的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及
  类似的故障切换原因）
- 可选的状态/代码
- 人类可读的错误摘要

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层
回复运行器可利用它构建更具体的消息，例如“所有模型
暂时都受到限流”，并在已知时包含最早的冷却过期时间。

该冷却摘要是模型感知的：

- 与所尝试的
  提供商/模型链无关的模型作用域限流会被忽略
- 如果剩余阻塞是匹配的模型作用域限流，OpenClaw
  会报告最后一个仍然阻止该模型的匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见 [Models](/concepts/models) 了解更广泛的模型选择和回退概览。
