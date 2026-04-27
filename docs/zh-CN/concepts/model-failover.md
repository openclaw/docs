---
read_when:
    - 诊断认证配置文件轮换、冷却机制或模型回退行为
    - 更新认证配置文件或模型的回退规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换认证配置文件，以及如何在不同模型之间进行回退
title: 模型回退
x-i18n:
    generated_at: "2026-04-27T08:25:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b652e0bfb30aa698f0badbd341e615eb110254ca08abb1896189e95b0f9d4c61
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**认证配置文件轮换**。
2. 回退到 `agents.defaults.model.fallbacks` 中的下一个**模型回退**。

本文档解释运行时规则以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前激活的会话模型和认证配置文件偏好。带有 `modelOverrideSource: "auto"` 的会话覆盖来自先前的一次回退，因此下一次运行会先清除它，再重试已配置的主模型；由用户选择的覆盖会保持粘性。
  </Step>
  <Step title="构建候选链">
    从当前选中的会话模型开始，按顺序加入 `agents.defaults.model.fallbacks`，构建模型候选链；如果本次运行是从某个覆盖开始，则最后再加上已配置的主模型。
  </Step>
  <Step title="尝试当前提供商">
    使用认证配置文件轮换 / 冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得回退的错误上推进">
    如果该提供商因值得回退的错误而被耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化选中的回退覆盖，这样其他会话读取方能看到运行器即将使用的相同提供商 / 模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="在失败时进行窄范围回滚">
    如果回退候选项失败，仅在这些字段仍与该失败候选项匹配时，回滚仅由回退拥有的会话覆盖字段。
  </Step>
  <Step title="若已耗尽则抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及已知时的最早冷却到期时间。
  </Step>
</Steps>

这刻意比“保存并恢复整个会话”更窄。回复运行器只会持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可以防止一次失败的回退重试覆盖更新得更晚、且与之无关的会话变更，例如在该尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**认证配置文件**。

- 密钥凭证存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧路径：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时认证路由状态存放在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅包含元数据和路由**（不含密钥）。
- 旧版仅导入用 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）。

更多细节： [OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包含 `projectId` / `enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账号共存。

- 默认：当没有可用邮箱时使用 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按如下方式选择顺序：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置的配置文件">
    按提供商筛选后的 `auth.profiles`。
  </Step>
  <Step title="已存储的配置文件">
    `auth-profiles.json` 中该提供商对应的条目。
  </Step>
</Steps>

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：**配置文件类型（**OAuth 优先于 API 密钥**）。
- **次键：**`usageStats.lastUsed`（越早越先，同一类型内排序）。
- **处于冷却 / 禁用状态的配置文件** 会被移到末尾，并按最早到期时间排序。

### 会话粘性（对缓存友好）

OpenClaw 会**为每个会话固定所选的认证配置文件**，以保持提供商缓存处于热状态。它**不会**在每次请求时都轮换。固定的配置文件会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置文件处于冷却 / 禁用状态

通过 `/model …@<profileId>` 进行手动选择会为该会话设置一个**用户覆盖**，在新会话开始前不会自动轮换。

<Note>
自动固定的配置文件（由会话路由器选中）被视为一种**偏好**：它们会先被尝试，但在遇到速率限制 / 超时时，OpenClaw 可能会轮换到另一个配置文件。用户固定的配置文件会锁定在该配置文件上；如果它失败且已配置模型回退，OpenClaw 会移动到下一个模型，而不是切换配置文件。
</Note>

### 为什么 OAuth 可能“看起来丢失了”

如果同一个提供商下同时有一个 OAuth 配置文件和一个 API 密钥配置文件，那么在未固定时，轮询可能会在不同消息之间于二者之间切换。若要强制使用单个配置文件：

- 使用 `auth.order[provider] = ["provider:profileId"]` 进行固定，或者
- 通过 `/model …` 配合配置文件覆盖进行每会话覆盖（当你的 UI / 聊天界面支持时）。

## 冷却

当某个配置文件因认证 / 速率限制错误失败时（或因看起来像速率限制的超时而失败），OpenClaw 会将其标记为冷却中，并移动到下一个配置文件。

<AccordionGroup>
  <Accordion title="哪些情况会落入速率限制 / 超时桶">
    该速率限制分类比单纯的 `429` 更广：还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly/monthly limit reached`。

    格式 / 无效请求错误（例如 Cloud Code Assist 工具调用 ID 校验失败）会被视为值得回退，并使用相同的冷却机制。OpenAI 兼容的 stop-reason 错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时 / 回退信号。

    当错误来源匹配已知瞬时模式时，通用服务器文本也可能落入该超时分类。例如，纯文本的 pi-ai 流包装器消息 `An unknown error occurred` 会被视为对所有提供商都值得回退，因为 pi-ai 会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束、且没有具体细节时发出该消息。带有瞬时服务器文本的 JSON `api_error` 负载，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得回退的超时。

    OpenRouter 特有的通用上游文本，例如单独的 `Provider returned error`，只有在提供商上下文确实是 OpenRouter 时才会被视为超时。通用的内部回退文本，例如 `LLM request failed with an unknown error.`，则保持保守，不会单独触发回退。
  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 否则可能会在把控制权交还给 OpenClaw 之前，先休眠一个很长的 `Retry-After` 时间窗口。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待上限限制为 60 秒，并立即暴露更长的可重试响应，以便运行此回退路径。可使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；参见 [重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="按模型划分的冷却">
    速率限制冷却也可以按模型划分：

    - 当已知失败的模型 ID 时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 如果冷却范围限定在另一个模型上，那么同一提供商上的兄弟模型仍然可以尝试。
    - 账单 / 禁用窗口仍会在跨模型范围内阻止整个配置文件。

  </Accordion>
</AccordionGroup>

冷却采用指数退避：

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

## 账单禁用

账单 / 额度失败（例如 “insufficient credits” / “credit balance too low”）会被视为值得回退，但它们通常不是瞬时问题。OpenClaw 不会设置短时冷却，而是会将该配置文件标记为**已禁用**（采用更长的退避），然后轮换到下一个配置文件 / 提供商。

<Note>
并非每个看起来像账单问题的响应都是 `402`，也并非每个 HTTP `402` 都会落到这里。即使提供商返回的是 `401` 或 `403`，OpenClaw 也会把明确的账单文本保留在账单分类中，但提供商特定匹配器仍然只作用于拥有它们的提供商（例如 OpenRouter 的 `403 Key limit exceeded`）。

与此同时，临时性的 `402` 使用窗口以及组织 / 工作区支出限制错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。这些情况会走短时冷却 / 回退路径，而不是长期账单禁用路径。
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

- 账单退避从**5 小时**开始，每次账单失败后翻倍，并在 **24 小时**封顶。
- 如果某个配置文件在 **24 小时**内没有再次失败，退避计数器会重置（可配置）。
- 过载重试在模型回退前允许进行 **1 次同提供商认证配置文件轮换**。
- 过载重试默认使用 **0 毫秒**退避。

## 模型回退

如果某个提供商下的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已耗尽配置文件轮换的认证失败、速率限制和超时（其他错误不会推进回退）。

与账单冷却相比，过载和速率限制错误会以更积极的方式处理。默认情况下，OpenClaw 允许一次同提供商认证配置文件重试，然后不等待，直接切换到下一个已配置的模型回退。像 `ModelNotReadyException` 这样的提供商繁忙信号会落入该过载分类。可以通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 来调整。

当一次运行以模型覆盖开始时（钩子或 CLI），在尝试完所有已配置回退后，回退链仍会以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 和已配置回退构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的回退会去重，但不会按模型 allowlist 过滤。它们被视为操作员的显式意图。
    - 如果当前运行已经处于同一提供商系列中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
    - 如果当前运行使用的提供商与配置中的不同，且当前模型并不属于已配置的回退链，那么 OpenClaw 不会追加来自其他提供商的无关已配置回退。
    - 当运行从某个覆盖开始时，已配置的主模型会附加到链末尾，以便当前面的候选项耗尽后，链可以重新回到正常默认值。
  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="会继续推进的情况">
    - 认证失败
    - 速率限制和冷却耗尽
    - 过载 / 提供商繁忙错误
    - 形态上属于超时的回退错误
    - 账单禁用
    - `LiveSessionModelSwitchError`，它会被规范化为回退路径，这样过时的持久化模型就不会形成外层重试循环
    - 在仍有剩余候选项时，其他无法识别的错误
  </Tab>
  <Tab title="不会继续推进的情况">
    - 不属于超时 / 回退形态的显式中止
    - 应保留在压缩 / 重试逻辑内部处理的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`，或 `ollama error: context length exceeded`）
    - 当没有候选项剩余时的最终未知错误
  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的每个认证配置文件都已处于冷却中时，OpenClaw 不会自动永久跳过该提供商。它会按每个候选项分别决定：

<AccordionGroup>
  <Accordion title="按候选项决策">
    - 持久性认证失败会立即跳过整个提供商。
    - 账单禁用通常会被跳过，但主候选项仍可能在节流条件下被探测，以便无需重启也能恢复。
    - 主候选项可能会在接近冷却到期时被探测，并按每个提供商进行节流。
    - 即使处于冷却中，同一提供商下的回退兄弟项在失败看起来是瞬时问题时（`rate_limit`、`overloaded` 或未知），仍然可以尝试。当速率限制是按模型划分，而某个兄弟模型可能仍可立即恢复时，这一点尤其重要。
    - 瞬时冷却探测在每次回退运行中，每个提供商最多只允许一次，因此单个提供商不会拖慢跨提供商回退。
  </Accordion>
</AccordionGroup>

## 会话覆盖与实时模型切换

会话模型变更是共享状态。当前运行器、`/model` 命令、压缩 / 会话更新以及实时会话协调，都会读取或写入同一个会话条目的不同部分。

这意味着回退重试必须与实时模型切换进行协调：

- 只有明确由用户触发的模型更改才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型更改，例如回退轮换、心跳覆盖或压缩，不会自行标记待处理的实时切换。
- 在回退重试开始前，回复运行器会将选中的回退覆盖字段持久化到会话条目中。
- 在下一次运行时，自动回退覆盖会在模型选择之前被清除，以便重新尝试已配置的主模型。如果它仍不健康，回退循环会为这次新尝试记录一个新的自动覆盖。
- 用户模型覆盖（`modelOverrideSource: "user"`）以及没有来源字段的旧版覆盖，会在多轮之间持续存在。
- 实时会话协调会优先采用持久化的会话覆盖，而不是过时的运行时模型字段。
- 如果某个实时切换错误指向当前回退链中更靠后的候选项，OpenClaw 会直接跳转到该选中的模型，而不是先遍历无关候选项。
- 如果回退尝试失败，运行器只会回滚它自己写入的覆盖字段，而且仅在这些字段仍与该失败候选项匹配时才会这样做。

这可以防止经典竞态：

<Steps>
  <Step title="主模型失败">
    选中的主模型失败。
  </Step>
  <Step title="在内存中选中回退项">
    在内存中选中回退候选项。
  </Step>
  <Step title="会话存储仍指向旧主模型">
    会话存储仍反映旧的主模型。
  </Step>
  <Step title="实时协调读取过时状态">
    实时会话协调读取到过时的会话状态。
  </Step>
  <Step title="重试被拉回">
    在回退尝试开始前，重试被拉回到旧模型。
  </Step>
</Steps>

持久化的回退覆盖弥合了这个窗口，而窄范围回滚则能保持更新得更晚的手动或运行时会话变更不被破坏。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 尝试的提供商 / 模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的回退原因）
- 可选的状态 / 代码
- 人类可读的错误摘要

当每个候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以用它来构建更具体的消息，例如“所有模型当前都受到临时速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要具有模型感知能力：

- 与已尝试提供商 / 模型链无关的按模型划分速率限制会被忽略
- 如果剩余阻塞是匹配的按模型划分速率限制，OpenClaw 会报告仍然阻止该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见 [Models](/zh-CN/concepts/models) 了解更广泛的模型选择与回退概览。
