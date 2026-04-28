---
read_when:
    - 诊断凭证配置文件轮换、冷却时间或模型回退行为
    - 更新凭证配置文件或模型的回退规则
    - 理解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换凭证配置文件并在不同模型之间回退
title: 模型回退
x-i18n:
    generated_at: "2026-04-27T23:11:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 974da5e8498f89a01bc9d160275fa9f11d1fefc7a2336689d409245d0a9036c1
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**凭证配置文件轮换**。
2. 回退到 `agents.defaults.model.fallbacks` 中的下一个**模型回退**。

本文档解释运行时规则以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前活跃会话的模型和凭证配置文件偏好。
  </Step>
  <Step title="构建候选链">
    根据当前模型选择以及该选择来源对应的回退策略，构建模型候选链。已配置的默认值、cron 作业主模型和自动选中的回退模型可以使用已配置的回退链；显式的用户会话选择则是严格模式。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置文件轮换 / 冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得回退的错误上前进">
    如果该提供商因值得回退的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选的回退覆盖，这样其他会话读取器就能看到运行器即将使用的相同提供商 / 模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="在失败时进行最小范围回滚">
    如果回退候选项失败，仅在这些字段仍与失败候选项匹配时，回滚由回退所拥有的会话覆盖字段。
  </Step>
  <Step title="在耗尽时抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及已知情况下最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只会持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可以避免失败的回退重试覆盖较新的、无关的会话变更，例如运行期间发生的手动 `/model` 更改或会话轮换更新。

## 选择来源策略

OpenClaw 会将所选的提供商 / 模型与“为什么会选中它”分开处理。这个来源会控制是否允许使用回退链：

- **已配置默认值**：`agents.defaults.model.primary`（或某个智能体专用的主模型）会使用已配置的回退链。
- **自动回退覆盖**：运行时回退会在重试前写入 `providerOverride`、`modelOverride` 和 `modelOverrideSource: "auto"`。这个自动覆盖可以继续沿着已配置的回退链前进，并会在 `/new`、`/reset` 和 `sessions.reset` 时清除。
- **用户会话覆盖**：`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会写入 `modelOverrideSource: "user"`。这是精确的会话选择。如果所选提供商 / 模型在生成回复前失败，OpenClaw 会报告该失败，而不是从无关的已配置回退模型作答。
- **旧版会话覆盖**：较旧的会话条目可能有 `modelOverride` 但没有 `modelOverrideSource`。OpenClaw 会将这些视为用户覆盖，以避免显式的旧选择被悄悄转换为回退行为。
- **Cron 负载模型**：cron 作业的 `payload.model` / `--model` 是作业主模型，而不是用户会话覆盖。除非作业提供了 `payload.fallbacks`，否则它会使用已配置的回退链；`payload.fallbacks: []` 会让 cron 运行变为严格模式。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置文件**。

- 密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版位置：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时凭证路由状态存储在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅包含元数据 + 路由信息**（不含密钥）。
- 旧版仅导入用 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）。

更多细节： [OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包含 `projectId` / `enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，这样多个账号可以共存。

- 默认：当没有可用邮箱时使用 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按以下顺序选择：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置配置文件">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="已存储配置文件">
    `auth-profiles.json` 中该提供商对应的条目。
  </Step>
</Steps>

如果没有配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：** 配置文件类型（**OAuth 优先于 API 密钥**）。
- **次键：** `usageStats.lastUsed`（每种类型内按最久未使用优先）。
- **处于冷却 / 已禁用的配置文件** 会被移到末尾，并按最早到期时间排序。

### 会话粘性（更利于缓存）

OpenClaw 会**按会话固定所选的凭证配置文件**，以保持提供商缓存处于热状态。它**不会**在每次请求时都轮换。固定的配置文件会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置文件处于冷却 / 已禁用状态

通过 `/model …@<profileId>` 的手动选择会为该会话设置**用户覆盖**，并且在新会话开始前不会自动轮换。

<Note>
自动固定的配置文件（由会话路由器选中）会被视为一种**偏好**：它们会优先尝试，但在遇到速率限制 / 超时时，OpenClaw 可能会轮换到另一个配置文件。用户固定的配置文件会始终锁定在该配置文件上；如果它失败且已配置模型回退，OpenClaw 会移动到下一个模型，而不是切换配置文件。
</Note>

### 为什么 OAuth 可能“看起来丢失了”

如果你为同一个提供商同时拥有一个 OAuth 配置文件和一个 API 密钥配置文件，那么在未固定时，轮询可能会在多条消息之间切换它们。若要强制使用单一配置文件：

- 通过 `auth.order[provider] = ["provider:profileId"]` 进行固定，或者
- 在每会话覆盖中通过带有配置文件覆盖的 `/model …` 使用（当你的 UI / 聊天界面支持时）。

## 冷却时间

当某个配置文件因凭证 / 速率限制错误失败（或看起来像速率限制的超时）时，OpenClaw 会将其标记为进入冷却，并移动到下一个配置文件。

<AccordionGroup>
  <Accordion title="哪些情况会进入速率限制 / 超时类别">
    这个速率限制类别比普通的 `429` 更广：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及诸如 `weekly/monthly limit reached` 之类的周期性用量窗口限制。

    格式 / 无效请求错误（例如 Cloud Code Assist 工具调用 ID 验证失败）会被视为值得回退的错误，并使用相同的冷却时间。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时 / 回退信号。

    当来源匹配已知的瞬时模式时，通用服务器文本也可能落入该超时类别。例如，纯粹的 pi-ai stream-wrapper 消息 `An unknown error occurred` 会被视为所有提供商的值得回退错误，因为 pi-ai 会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体细节时发出该消息。带有瞬时服务器文本的 JSON `api_error` 负载，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得回退的超时。

    OpenRouter 专用的通用上游文本（例如单独出现的 `Provider returned error`）只有在提供商上下文确实是 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守，不会单独触发回退。
  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 否则可能会在将控制权返回给 OpenClaw 前，先睡眠很长的 `Retry-After` 时间窗口。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间上限设为 60 秒，并立即暴露更长的可重试响应，以便这一回退路径能够运行。你可以使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用此上限；参见 [重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域冷却">
    速率限制冷却也可以是模型作用域的：

    - 当已知失败模型 ID 时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 同一提供商上的兄弟模型在冷却作用于其他模型时仍可尝试。
    - 计费 / 禁用窗口仍会跨模型阻止整个配置文件。

  </Accordion>
</AccordionGroup>

冷却时间使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态会存储在 `auth-state.json` 的 `usageStats` 下：

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

计费 / 额度失败（例如“额度不足” / “余额过低”）会被视为值得回退的错误，但它们通常不是瞬时问题。OpenClaw 不会使用短冷却，而是会将配置文件标记为**已禁用**（使用更长的退避时间），并轮换到下一个配置文件 / 提供商。

<Note>
并非每个看起来像计费问题的响应都是 `402`，也并非每个 HTTP `402` 都会落入这里。即使提供商返回的是 `401` 或 `403`，OpenClaw 仍会将明确的计费文本保留在计费通道中，但提供商专用匹配器仍然只作用于拥有它们的提供商（例如 OpenRouter 的 `403 Key limit exceeded`）。

与此同时，临时性的 `402` 用量窗口和组织 / 工作区消费上限错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。这些情况会走短冷却 / 回退路径，而不是长时间的计费禁用路径。
</Note>

状态会存储在 `auth-state.json` 中：

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

- 计费退避从**5 小时**开始，每次计费失败翻倍，最大为 **24 小时**。
- 如果配置文件在 **24 小时**内未再次失败，则退避计数器会重置（可配置）。
- 过载重试在模型回退前允许进行 **1 次同提供商配置文件轮换**。
- 过载重试默认使用 **0 毫秒**退避。

## 模型回退

如果某个提供商的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已耗尽配置文件轮换的凭证失败、速率限制和超时（其他错误不会推进回退）。即使提供商错误未暴露足够细节，回退状态中仍会精确标记：`empty_response` 表示提供商未返回可用消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始预览，但尚无分类器与之匹配。

与计费冷却相比，过载和速率限制错误会被更积极地处理。默认情况下，OpenClaw 允许在同一提供商内进行一次凭证配置文件重试，然后立即切换到下一个已配置的模型回退，而无需等待。诸如 `ModelNotReadyException` 之类的提供商繁忙信号会归入这个过载类别。你可以通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 进行调优。

当一次运行从已配置的主模型、cron 作业主模型或自动选中的回退覆盖开始时，OpenClaw 可以沿着已配置的回退链前进。显式的用户选择（例如 `/model ollama/qwen3.5:27b`、模型选择器、`sessions.patch` 或一次性的 CLI 提供商 / 模型覆盖）是严格模式：如果该提供商 / 模型不可达，或在生成回复前失败，OpenClaw 会报告失败，而不是从无关的回退项作答。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 以及已配置的回退项构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的回退项会去重，但不会按模型允许列表进行过滤。它们会被视为显式的运维意图。
    - 如果当前运行已经位于同一提供商系列中的某个已配置回退模型上，OpenClaw 会继续使用完整的已配置链。
    - 如果当前运行使用的是配置中不同的提供商，且该当前模型本身并不属于已配置回退链，OpenClaw 不会附加来自其他提供商的无关已配置回退项。
    - 当没有向回退运行器提供显式的 fallback override 时，已配置的主模型会被附加到末尾，这样在前面的候选项耗尽后，该链可以重新收敛到正常默认值。
    - 当调用方提供 `fallbacksOverride` 时，运行器只会使用请求的模型加上该覆盖列表。空列表会禁用模型回退，并阻止将已配置主模型作为隐藏的重试目标附加进去。

  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="会继续处理">
    - 凭证失败
    - 速率限制和冷却耗尽
    - 过载 / 提供商繁忙错误
    - 类超时的回退错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被标准化为回退路径，这样过时的持久化模型就不会造成外层重试循环
    - 当仍有剩余候选项时，其他未识别错误

  </Tab>
  <Tab title="不会继续处理">
    - 不属于类超时 / 类回退的显式中止
    - 应保留在压缩 / 重试逻辑内处理的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 当没有剩余候选项时的最终未知错误

  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的所有凭证配置文件都已处于冷却中时，OpenClaw 不会永远自动跳过该提供商。它会针对每个候选项单独做出决策：

<AccordionGroup>
  <Accordion title="按候选项决策">
    - 持久性凭证失败会立即跳过整个提供商。
    - 计费禁用通常会被跳过，但主候选项仍可按节流方式进行探测，这样无需重启也能恢复。
    - 在接近冷却到期时，主候选项可能会被探测，并且每个提供商都有节流限制。
    - 即使处于冷却中，只要失败看起来是瞬时性的（`rate_limit`、`overloaded` 或未知），仍可以尝试同一提供商下的回退同级模型。这在速率限制具有模型作用域，而同级模型可能仍可立即恢复时尤其重要。
    - 瞬时冷却探测在每次回退运行中每个提供商最多只允许一次，这样单个提供商就不会拖慢跨提供商回退。

  </Accordion>
</AccordionGroup>

## 会话覆盖和实时模型切换

会话模型更改属于共享状态。活跃运行器、`/model` 命令、压缩 / 会话更新以及实时会话协调，都会读取或写入同一个会话条目的部分内容。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型更改才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型更改，例如回退轮换、心跳覆盖或压缩，本身永远不会标记待处理的实时切换。
- 用户驱动的模型覆盖会被视为回退策略中的精确选择，因此不可达的已选提供商会直接表现为失败，而不会被 `agents.defaults.model.fallbacks` 掩盖。
- 在回退重试开始前，回复运行器会将所选的回退覆盖字段持久化到会话条目中。
- 自动回退覆盖在后续轮次中仍保持选中，因此 OpenClaw 不会在每条消息上都探测一个已知不良的主模型。`/new`、`/reset` 和 `sessions.reset` 会清除自动来源的覆盖，并让会话回到已配置默认值。
- `/status` 会显示所选模型；当回退状态不同，还会显示当前活跃的回退模型及其原因。
- 实时会话协调会优先采用持久化的会话覆盖，而不是过时的运行时模型字段。
- 如果实时切换错误指向当前活跃回退链中较后的某个候选项，OpenClaw 会直接跳转到该选定模型，而不是先遍历无关候选项。
- 如果回退尝试失败，运行器只会回滚它自己写入的覆盖字段，并且只会在这些字段仍与失败候选项匹配时回滚。

这样可以避免经典竞争条件：

<Steps>
  <Step title="主模型失败">
    所选主模型失败。
  </Step>
  <Step title="在内存中选定回退项">
    在内存中选定了回退候选项。
  </Step>
  <Step title="会话存储仍显示旧主模型">
    会话存储仍然反映旧的主模型。
  </Step>
  <Step title="实时协调读取到过时状态">
    实时会话协调读取到了过时的会话状态。
  </Step>
  <Step title="重试被拉回旧模型">
    在回退尝试开始前，重试被拉回到了旧模型。
  </Step>
</Steps>

持久化的回退覆盖会关闭这个时间窗口，而精确范围的回滚则会保留较新的手动或运行时会话变更。

## 可观测性和失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，这些信息会被用于日志和面向用户的冷却消息：

- 尝试过的提供商 / 模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的回退原因）
- 可选状态 / 代码
- 人类可读的错误摘要

结构化的 `model_fallback_decision` 日志还会在候选项失败、被跳过或后续回退成功时，包含扁平的 `fallbackStep*` 字段。这些字段会明确说明尝试过的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），这样日志和诊断导出器即使在最终回退也失败时，仍能重建主模型的失败情况。

当每个候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以利用它构建更具体的消息，例如“所有模型当前都受到速率限制”，并在已知情况下附带最早的冷却到期时间。

这个冷却摘要是模型感知的：

- 与已尝试提供商 / 模型链无关的模型作用域速率限制会被忽略
- 如果剩余阻塞是匹配的模型作用域速率限制，OpenClaw 会报告仍阻止该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/zh-CN/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见 [Models](/zh-CN/concepts/models) 了解更广义的模型选择和回退概览。
