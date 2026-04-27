---
read_when:
    - 诊断认证配置文件轮换、冷却时间或模型回退行为
    - 更新认证配置文件或模型的故障转移规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换认证配置文件并在各模型之间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-04-27T12:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a863acbafba616e73a621daab5396906a6e9c05275a76a6377d3b83f2a156fb3
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**认证配置文件轮换**。
2. 回退到 `agents.defaults.model.fallbacks` 中的下一个**模型故障转移**目标。

本文说明运行时规则以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前活动会话的模型和认证配置文件偏好。
  </Step>
  <Step title="构建候选链">
    从当前选中的会话模型开始构建模型候选链，然后按顺序追加 `agents.defaults.model.fallbacks`，如果本次运行是从覆盖值开始，则最后以配置的主模型结尾。
  </Step>
  <Step title="尝试当前提供商">
    按照认证配置文件轮换/冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得故障转移的错误上推进">
    如果该提供商因值得故障转移的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选的回退覆盖值，以便其他会话读取方看到运行器即将使用的相同提供商/模型。持久化的模型覆盖会被标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="在失败时进行窄范围回滚">
    如果回退候选项失败，则仅在会话中的回退专属覆盖字段仍与该失败候选项匹配时，回滚这些字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及在已知情况下最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只会持久化其为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可防止失败的回退重试覆盖更新较新的无关会话变更，例如在尝试运行期间发生的手动 `/model` 变更或会话轮换更新。

## 认证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**认证配置文件**。

- 密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版路径：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时认证路由状态存储在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅包含元数据和路由**（不含密钥）。
- 仅用于旧版导入的 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）。

更多详情： [OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还会附带 `projectId`/`enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账号可以共存。

- 默认：当没有可用电子邮箱时，使用 `provider:default`。
- 带电子邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按如下顺序选择：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置的配置文件">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="已存储的配置文件">
    `auth-profiles.json` 中该提供商的条目。
  </Step>
</Steps>

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：** 配置文件类型（**OAuth 优先于 API 密钥**）。
- **次键：** `usageStats.lastUsed`（越早使用的越靠前，在同一类型内排序）。
- **冷却/禁用配置文件** 会被移到末尾，并按最早到期时间排序。

### 会话粘性（有利于缓存）

OpenClaw 会**为每个会话固定所选的认证配置文件**，以保持提供商缓存处于预热状态。它**不会**在每次请求时都轮换。固定的配置文件会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数增加）
- 该配置文件进入冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖值**，并且在新会话开始前不会自动轮换。

<Note>
自动固定的配置文件（由会话路由器选择）被视为一种**偏好**：会优先尝试，但在遇到速率限制/超时时，OpenClaw 可以轮换到另一个配置文件。用户固定的配置文件则会锁定到该配置文件；如果它失败且已配置模型故障转移，OpenClaw 会移动到下一个模型，而不是切换配置文件。
</Note>

### 为什么 OAuth 可能“看起来丢失了”

如果同一个提供商下你同时有一个 OAuth 配置文件和一个 API 密钥配置文件，那么在未固定的情况下，轮询可能会在多条消息之间在两者间切换。若要强制使用单一配置文件：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或者
- 通过 `/model …` 搭配配置文件覆盖值使用每会话覆盖（当你的 UI/聊天界面支持时）。

## 冷却时间

当某个配置文件因认证/速率限制错误失败（或看起来像速率限制的超时）时，OpenClaw 会将其标记为冷却中，并移动到下一个配置文件。

<AccordionGroup>
  <Accordion title="哪些情况会进入速率限制 / 超时类别">
    该速率限制类别不仅仅包括普通的 `429`：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly/monthly limit reached`。

    格式/无效请求错误（例如 Cloud Code Assist 工具调用 ID 校验失败）也会被视为值得故障转移，并使用相同的冷却时间。兼容 OpenAI 的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/故障转移信号。

    当来源匹配已知的瞬时模式时，通用服务器文本也可能进入该超时类别。例如，纯文本的 pi-ai stream-wrapper 消息 `An unknown error occurred` 会被视为所有提供商都值得故障转移的错误，因为 pi-ai 会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体细节时发出它。带有瞬时服务器文本的 JSON `api_error` 载荷，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得故障转移的超时。

    OpenRouter 特有的通用上游文本（如单独的 `Provider returned error`）只有在提供商上下文确实是 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守，不会单独触发故障转移。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 否则可能会在将控制权交还给 OpenClaw 之前，因较长的 `Retry-After` 窗口而休眠很久。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间限制为 60 秒，并立即暴露更长的可重试响应，以便此故障转移路径可以运行。你可以通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用此上限；请参见 [Retry behavior](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域冷却时间">
    速率限制冷却时间也可以限定在模型作用域：

    - 当已知失败的模型 ID 时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 如果冷却时间限定于不同模型，则同一提供商下的兄弟模型仍可继续尝试。
    - 计费/禁用窗口仍会跨模型阻止整个配置文件。

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

计费/额度失败（例如“insufficient credits” / “credit balance too low”）会被视为值得故障转移，但通常并非瞬时错误。OpenClaw 不会使用短暂冷却，而是会将该配置文件标记为**已禁用**（并使用更长的退避时间），然后轮换到下一个配置文件/提供商。

<Note>
并非所有看起来像计费问题的响应都是 `402`，也并非所有 HTTP `402` 都会落到这里。即使某个提供商返回的是 `401` 或 `403`，OpenClaw 仍会将明确的计费文本保留在计费路径中，但提供商特定匹配器仍只限定在其所属提供商内（例如 OpenRouter 的 `403 Key limit exceeded`）。

与此同时，临时性的 `402` 使用窗口和组织/工作区支出限制错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。这些情况会继续走短冷却/故障转移路径，而不是长时间的计费禁用路径。
</Note>

状态存储在 `auth-state.json`：

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

- 计费退避从 **5 小时** 开始，每次计费失败都会翻倍，最高为 **24 小时**。
- 如果某个配置文件 **24 小时** 内未再失败，则退避计数器会重置（可配置）。
- 过载重试在模型故障转移前允许 **1 次同提供商配置文件轮换**。
- 过载重试默认使用 **0 ms 退避**。

## 模型故障转移

如果一个提供商下的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已耗尽配置文件轮换的认证失败、速率限制和超时（其他错误不会推进回退）。即使提供商错误没有暴露足够细节，OpenClaw 仍会在回退状态中精确标记它们：`empty_response` 表示提供商未返回可用消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，`unclassified` 表示 OpenClaw 保留了原始预览，但尚无分类器匹配。

过载和速率限制错误的处理比计费冷却时间更激进。默认情况下，OpenClaw 允许一次同提供商认证配置文件重试，然后立即切换到下一个已配置的模型回退目标，不会等待。诸如 `ModelNotReadyException` 之类的提供商繁忙信号会归入该过载类别。你可以通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 进行调整。

当一次运行从模型覆盖值开始（钩子或 CLI）时，在尝试完所有已配置回退后，回退链仍会以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 以及已配置的回退项构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的回退项会去重，但不会按模型允许列表过滤。它们被视为运维人员的显式意图。
    - 如果当前运行已经位于同一提供商族中的某个已配置回退项上，OpenClaw 会继续使用完整的已配置链。
    - 如果当前运行所在的提供商与配置不同，且当前模型并不属于已配置回退链的一部分，则 OpenClaw 不会追加来自其他提供商的无关已配置回退项。
    - 当运行是从覆盖值开始时，会在末尾追加已配置的主模型，以便当前面的候选项耗尽后，候选链能够回落到正常默认值。
  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="会继续">
    - 认证失败
    - 速率限制和冷却耗尽
    - 过载/提供商繁忙错误
    - 具有超时特征的故障转移错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被标准化为故障转移路径，以避免过时的持久化模型造成外层重试循环
    - 当仍有剩余候选项时，其他未识别错误
  </Tab>
  <Tab title="不会继续">
    - 不属于超时/故障转移特征的显式中止
    - 应保留在压缩/重试逻辑内部处理的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 当已没有候选项可用时，最终出现的未知错误
  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的每个认证配置文件都已处于冷却中时，OpenClaw 不会永远自动跳过该提供商。它会针对每个候选项做出决策：

<AccordionGroup>
  <Accordion title="按候选项决策">
    - 持续性的认证失败会立即跳过整个提供商。
    - 计费禁用通常会被跳过，但主候选项仍可能在节流条件下被探测，以便无需重启也能恢复。
    - 主候选项可能会在接近冷却到期时被探测，并受每个提供商的节流限制。
    - 即使处于冷却中，只要失败看起来是瞬时性的（`rate_limit`、`overloaded` 或未知），同提供商下的回退兄弟模型仍然可以尝试。这在速率限制具有模型作用域且某个兄弟模型可能立即恢复时尤其重要。
    - 瞬时冷却探测在每次回退运行中对每个提供商最多仅限一次，因此单个提供商不会拖慢跨提供商的故障转移。
  </Accordion>
</AccordionGroup>

## 会话覆盖与实时模型切换

会话模型更改是共享状态。活动运行器、`/model` 命令、压缩/会话更新以及实时会话协调，都会读取或写入同一个会话条目的不同部分。

这意味着回退重试必须与实时模型切换协同工作：

- 只有显式的用户驱动模型更改才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型更改，例如回退轮换、heartbeat 覆盖或压缩，本身不会标记待处理的实时切换。
- 在回退重试开始前，回复运行器会将所选回退覆盖字段持久化到会话条目中。
- 自动回退覆盖值会在后续轮次中继续保持选中，这样 OpenClaw 就不会在每条消息上都去探测一个已知有问题的主模型。`/new`、`/reset` 和 `sessions.reset` 会清除自动来源的覆盖值，并将会话恢复为已配置的默认值。
- `/status` 会显示所选模型；当回退状态不同，还会显示当前活动的回退模型及原因。
- 实时会话协调会优先采用持久化的会话覆盖值，而不是过时的运行时模型字段。
- 如果某个实时切换错误指向当前活动回退链中较后的候选项，OpenClaw 会直接跳转到该已选模型，而不是先遍历无关候选项。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，并且仅在这些字段仍与失败的候选项匹配时才会回滚。

这可以防止经典竞态：

<Steps>
  <Step title="主模型失败">
    当前选中的主模型失败。
  </Step>
  <Step title="在内存中选择回退项">
    在内存中选中了回退候选项。
  </Step>
  <Step title="会话存储仍指向旧主模型">
    会话存储仍然反映旧的主模型。
  </Step>
  <Step title="实时协调读取过时状态">
    实时会话协调读取到过时的会话状态。
  </Step>
  <Step title="重试被拉回">
    在回退尝试开始前，重试被拉回到旧模型。
  </Step>
</Steps>

持久化的回退覆盖值弥补了这个窗口，而窄范围回滚则能保持较新的手动或运行时会话更改不受影响。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却提示消息：

- 尝试的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的故障转移原因）
- 可选的状态/代码
- 人类可读的错误摘要

当某个候选项失败、被跳过或较后的回退成功时，结构化的 `model_fallback_decision` 日志还会包含扁平的 `fallbackStep*` 字段。这些字段会明确展示尝试过的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），从而使日志和诊断导出器即使在最终回退也失败时，仍能还原主失败原因。

当每个候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以利用它构建更具体的消息，例如“所有模型当前都受到临时速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要具有模型感知能力：

- 对于已尝试的提供商/模型链，无关的模型作用域速率限制会被忽略
- 如果剩余阻塞是匹配的模型作用域速率限制，OpenClaw 会报告仍阻止该模型的最后一个匹配到期时间

## 相关配置

有关以下内容，请参见 [Gateway 网关配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和故障转移概览，请参见 [Models](/zh-CN/concepts/models)。
