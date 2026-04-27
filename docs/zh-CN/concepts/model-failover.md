---
read_when:
    - 诊断凭证配置文件轮换、冷却时间或模型回退行为
    - 更新凭证配置文件或模型的回退规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换凭证配置文件并在不同模型之间进行回退
title: 模型回退
x-i18n:
    generated_at: "2026-04-27T22:37:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63a1b5a9c6692861c81b4051f1a69f78d6da1a74f6368251df607f80893b7411
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**凭证配置文件轮换**
2. 回退到 `agents.defaults.model.fallbacks` 中的下一个**模型**

本文档说明运行时规则以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前活动会话的模型和凭证配置文件偏好。
  </Step>
  <Step title="构建候选链">
    从已配置模型或自动选择的回退模型构建模型候选链，然后按顺序附加 `agents.defaults.model.fallbacks`。明确的用户模型选择是严格的，不会静默回退到其他模型。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置文件轮换 / 冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得回退的错误上继续前进">
    如果该提供商因值得回退的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选的回退覆盖，这样其他会话读取方就会看到运行器即将使用的相同提供商 / 模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="在失败时进行精确回滚">
    如果回退候选项失败，仅在那些字段仍与失败候选项匹配时，回滚由回退拥有的会话覆盖字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果所有候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及在已知情况下最早的冷却到期时间。
  </Step>
</Steps>

这比“保存并恢复整个会话”要更窄。回复运行器只会持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可以防止失败的回退重试覆盖较新的、无关的会话变更，例如在尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置文件**。

- 密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版路径：`~/.openclaw/agent/auth-profiles.json`）
- 运行时凭证路由状态存储在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`
- 配置 `auth.profiles` / `auth.order` **仅包含元数据 + 路由**（不包含密钥）
- 旧版仅导入用 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

更多详情： [OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包含 `projectId` / `enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账号可以共存。

- 默认：当没有可用邮箱时使用 `provider:default`
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）

配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按如下方式选择顺序：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）
  </Step>
  <Step title="已配置的配置文件">
    按提供商过滤后的 `auth.profiles`
  </Step>
  <Step title="已存储的配置文件">
    `auth-profiles.json` 中属于该提供商的条目
  </Step>
</Steps>

如果没有配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：** 配置文件类型（**OAuth 优先于 API 密钥**）
- **次键：** `usageStats.lastUsed`（越早使用的越优先，在同一类型内排序）
- **处于冷却 / 已禁用的配置文件** 会移到末尾，并按最早到期时间排序

### 会话粘性（有利于缓存）

OpenClaw 会**为每个会话固定所选的凭证配置文件**，以保持提供商缓存处于预热状态。它**不会**在每次请求时都轮换。固定的配置文件会被重复使用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置文件处于冷却 / 已禁用状态

通过 `/model …@<profileId>` 进行手动选择会为该会话设置**用户覆盖**，并且在新会话开始前不会自动轮换。

<Note>
自动固定的配置文件（由会话路由器选择）会被视为一种**偏好**：它们会先被尝试，但在遇到限流 / 超时时，OpenClaw 可能会轮换到其他配置文件。用户固定的配置文件会保持锁定到该配置文件；如果它失败，并且已配置模型回退，OpenClaw 会转到下一个模型，而不是切换配置文件。
</Note>

### 为什么 OAuth 可能“看起来丢失了”

如果同一个提供商下你同时拥有一个 OAuth 配置文件和一个 API 密钥配置文件，轮询可能会在不同消息之间切换它们，除非进行了固定。若要强制使用单个配置文件：

- 用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 通过 `/model …` 配合配置文件覆盖进行每会话覆盖（在你的 UI / 聊天界面支持时）

## 冷却时间

当某个配置文件因凭证 / 限流错误失败时（或因看起来像限流的超时失败），OpenClaw 会将其标记为进入冷却，并转到下一个配置文件。

<AccordionGroup>
  <Accordion title="哪些情况会落入限流 / 超时桶">
    该限流桶的范围比普通 `429` 更广：还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性用量窗口限制，例如 `weekly/monthly limit reached`。

    格式 / 无效请求错误（例如 Cloud Code Assist 工具调用 ID 校验失败）会被视为值得回退，并使用相同的冷却时间。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时 / 回退信号。

    当来源匹配已知瞬时模式时，通用服务器文本也可能落入该超时桶。例如，裸露的 pi-ai stream-wrapper 消息 `An unknown error occurred` 会被视为对所有提供商都值得回退，因为 pi-ai 会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束、却没有具体细节时发出它。JSON `api_error` 负载中带有瞬时服务器文本，如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得回退的超时。

    OpenRouter 特有的通用上游文本，例如裸露的 `Provider returned error`，仅在提供商上下文确实是 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守，不会单独触发回退。
  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 否则可能会在将控制权返回给 OpenClaw 之前，因较长的 `Retry-After` 窗口而休眠。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间限制为 60 秒，并立即暴露更长的可重试响应，以便这个回退路径可以运行。你可以通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用这个上限；参见 [重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域的冷却时间">
    限流冷却时间也可以有模型作用域：

    - 当已知失败模型 ID 时，OpenClaw 会为限流失败记录 `cooldownModel`
    - 如果冷却时间作用于同一提供商中的另一个模型，仍然可以尝试同级模型
    - 计费 / 禁用窗口仍会在所有模型上阻止整个配置文件
  </Accordion>
</AccordionGroup>

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

计费 / 额度失败（例如 “insufficient credits” / “credit balance too low”）会被视为值得回退，但它们通常不是瞬时错误。OpenClaw 不会使用短冷却时间，而是将该配置文件标记为**已禁用**（使用更长的退避），然后轮换到下一个配置文件 / 提供商。

<Note>
并不是所有看起来像计费问题的响应都是 `402`，也不是所有 HTTP `402` 都会落入这里。即使某个提供商返回的是 `401` 或 `403`，OpenClaw 仍会将显式的计费文本保留在计费通道中，但提供商特定匹配器仍会限定在拥有它们的提供商范围内（例如 OpenRouter 的 `403 Key limit exceeded`）。

与此同时，临时性的 `402` 用量窗口错误，以及组织 / 工作区支出上限错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。这些情况会留在短冷却 / 回退路径中，而不是长时间的计费禁用路径。
</Note>

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

- 计费退避从 **5 小时**开始，每次计费失败翻倍，最大为 **24 小时**
- 如果某个配置文件在 **24 小时** 内没有再次失败，退避计数器会重置（可配置）
- 对于过载重试，在模型回退之前允许 **1 次同提供商配置文件轮换**
- 过载重试默认使用 **0 毫秒退避**

## 模型回退

如果某个提供商的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于因凭证失败、限流和超时而耗尽配置文件轮换的情况（其他错误不会推进回退）。即使提供商错误没有暴露足够细节，OpenClaw 仍会在回退状态中精确标记它们：`empty_response` 表示提供商没有返回可用消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始预览，但尚无分类器命中。

相比计费冷却，过载和限流错误会被更积极地处理。默认情况下，OpenClaw 允许一次同提供商凭证配置文件重试，然后不等待，直接切换到下一个已配置的模型回退。像 `ModelNotReadyException` 这样的提供商繁忙信号会落入该过载桶。你可以使用 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 进行调整。

当一次运行从已配置的主模型或自动选择的回退覆盖开始时，OpenClaw 可以沿着已配置的回退链继续前进。显式用户选择（例如 `/model ollama/qwen3.5:27b`、模型选择器，或一次性的 CLI 提供商 / 模型覆盖）是严格的：如果该提供商 / 模型无法访问，或在生成回复前失败，OpenClaw 会报告失败，而不是从无关的回退中返回答案。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 加上已配置的回退来构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的回退会去重，但不会按模型允许列表进行过滤。它们会被视为运维人员的显式意图。
    - 如果当前运行已经位于同一提供商系列中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
    - 如果当前运行位于与配置不同的提供商上，并且当前模型不在已配置的回退链中，OpenClaw 不会附加来自其他提供商的无关已配置回退。
    - 当运行从某个覆盖开始时，已配置的主模型会追加到末尾，以便在较早候选项耗尽后，候选链能够回到正常的默认值。
  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="会继续回退">
    - 凭证失败
    - 限流和冷却耗尽
    - 过载 / 提供商繁忙错误
    - 具有超时特征的回退错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被规范化为回退路径，这样过期的持久化模型就不会形成外层重试循环
    - 当仍有剩余候选项时，其他未识别错误
  </Tab>
  <Tab title="不会继续回退">
    - 不属于超时 / 回退特征的显式中止
    - 应当保留在压缩 / 重试逻辑内部处理的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 当已没有剩余候选项时的最终未知错误
  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的所有凭证配置文件都已处于冷却状态时，OpenClaw 不会永远自动跳过该提供商。它会按候选项逐个做出决策：

<AccordionGroup>
  <Accordion title="按候选项的决策">
    - 持久性的凭证失败会立即跳过整个提供商。
    - 计费禁用通常会被跳过，但主候选项仍可以在节流条件下被探测，以便无需重启也能恢复。
    - 当接近冷却到期时，主候选项可以被探测，并受每个提供商的节流限制。
    - 即使处于冷却中，同提供商下的回退同级项仍可被尝试，只要失败看起来是瞬时的（`rate_limit`、`overloaded` 或未知）。当限流具有模型作用域，而同级模型可能仍能立即恢复时，这一点尤其重要。
    - 瞬时冷却探测在每次回退运行中每个提供商最多只允许一次，以避免单个提供商拖慢跨提供商回退。
  </Accordion>
</AccordionGroup>

## 会话覆盖与实时模型切换

会话模型变更属于共享状态。活动运行器、`/model` 命令、压缩 / 会话更新以及实时会话协调，都会读取或写入同一个会话条目的不同部分。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型变更才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的模型变更，例如回退轮换、心跳覆盖或压缩，本身永远不会标记待处理的实时切换。
- 用户驱动的模型覆盖会被视为回退策略中的精确选择，因此无法访问的已选提供商会直接暴露为失败，而不是被 `agents.defaults.model.fallbacks` 掩盖。
- 在回退重试开始前，回复运行器会将所选的回退覆盖字段持久化到会话条目中。
- 自动回退覆盖会在后续轮次中保持选中状态，这样 OpenClaw 就不会在每条消息上都探测一个已知有问题的主模型。`/new`、`/reset` 和 `sessions.reset` 会清除自动来源的覆盖，并使会话回到已配置的默认值。
- `/status` 会显示所选模型；当回退状态不同，还会显示当前生效的回退模型和原因。
- 实时会话协调会优先采用持久化的会话覆盖，而不是过期的运行时模型字段。
- 如果某个实时切换错误指向当前活动回退链中较后的候选项，OpenClaw 会直接跳转到该已选模型，而不是先遍历无关候选项。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，并且仅当这些字段仍与该失败候选项匹配时才会回滚。

这可以防止经典的竞争条件：

<Steps>
  <Step title="主模型失败">
    所选主模型失败。
  </Step>
  <Step title="在内存中选择回退">
    在内存中选择了回退候选项。
  </Step>
  <Step title="会话存储仍然显示旧主模型">
    会话存储仍反映旧的主模型。
  </Step>
  <Step title="实时协调读取过期状态">
    实时会话协调读取到了过期的会话状态。
  </Step>
  <Step title="重试被拉回">
    在回退尝试开始前，重试被拉回到旧模型。
  </Step>
</Steps>

持久化的回退覆盖关闭了这个窗口，而精确回滚则能保持较新的手动或运行时会话变更不受影响。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却提示：

- 尝试的提供商 / 模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的回退原因）
- 可选的状态 / 代码
- 人类可读的错误摘要

结构化的 `model_fallback_decision` 日志还会在候选项失败、被跳过或后续回退成功时包含扁平的 `fallbackStep*` 字段。这些字段会明确标示已尝试的切换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），因此即使最终回退也失败，日志和诊断导出器仍然可以重建主模型失败的情况。

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以利用它构建更具体的消息，例如“所有模型都暂时受到限流”，并在已知情况下包含最早的冷却到期时间。

该冷却摘要具有模型感知能力：

- 对于已尝试的提供商 / 模型链，无关的模型作用域限流会被忽略
- 如果剩余阻塞是与之匹配的模型作用域限流，OpenClaw 会报告仍会阻塞该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和回退概览，参见 [Models](/zh-CN/concepts/models)。
