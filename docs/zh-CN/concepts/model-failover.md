---
read_when:
    - 诊断凭证配置档案轮换、冷却或模型回退行为
    - 更新凭证配置档案或模型的故障转移规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换认证配置文件并在多个模型间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-05-11T20:26:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**凭证配置文件轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文档解释运行时规则以及支撑这些规则的数据。

## 运行时流程

对于普通文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前活动会话模型和凭证配置文件偏好。
  </Step>
  <Step title="构建候选链">
    根据当前模型选择以及该选择来源的回退策略构建模型候选链。已配置的默认值、cron 任务主模型和自动选择的回退模型可以使用已配置的回退；显式用户会话选择是严格的。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置文件轮换/冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得故障转移的错误上推进">
    如果该提供商因值得故障转移的错误而耗尽，则移到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选回退覆盖，以便其他会话读取者看到运行器即将使用的同一提供商/模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失败时窄范围回滚">
    如果回退候选项失败，仅在回退拥有的会话覆盖字段仍与该失败候选项匹配时回滚这些字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出包含每次尝试详情的 `FallbackSummaryError`，并在已知时包含最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只会持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这可以防止失败的回退重试覆盖更新的无关会话变更，例如尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 选择来源策略

OpenClaw 会区分所选提供商/模型和它被选中的原因。该来源决定是否允许回退链：

- **已配置默认值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **Agent 主模型**：`agents.list[].model` 是严格的，除非该 Agent 模型对象包含自己的 `fallbacks`。使用 `fallbacks: []` 可显式声明严格行为，或提供非空列表以让该 Agent 启用模型回退。
- **自动回退覆盖**：运行时回退会写入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` 以及所选来源模型，然后再重试。该自动覆盖可以继续沿已配置的回退链前进，并会被 `/new`、`/reset` 和 `sessions.reset` 清除。没有显式 `heartbeat.model` 的 Heartbeat 运行，在其来源不再匹配当前已配置默认值时，也会清除直接自动覆盖。
- **用户会话覆盖**：`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会写入 `modelOverrideSource: "user"`。这是精确的会话选择。如果所选提供商/模型在生成回复前失败，OpenClaw 会报告失败，而不是从无关的已配置回退中作答。
- **旧版会话覆盖**：较旧的会话条目可能有 `modelOverride` 但没有 `modelOverrideSource`。OpenClaw 会将这些视为用户覆盖，以免显式旧选择被静默转换为回退行为。
- **Cron 负载模型**：cron 任务 `payload.model` / `--model` 是任务主模型，而不是用户会话覆盖。除非任务提供 `payload.fallbacks`，否则它会使用已配置的回退；`payload.fallbacks: []` 会让 cron 运行保持严格。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置文件**。

- 密钥位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时凭证路由状态位于 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅用于元数据 + 路由**（不包含密钥）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）。

更多详情：[OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包括 `projectId`/`enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账号可以共存。

- 默认：没有可用电子邮件时为 `provider:default`。
- 带电子邮件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按如下方式选择顺序：

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

- **主键：**配置文件类型（**OAuth 先于 API 密钥**）。
- **次键：**`usageStats.lastUsed`（每种类型内最早使用的优先）。
- **冷却/禁用的配置文件**会移到末尾，并按最早到期排序。

### 会话粘性（缓存友好）

OpenClaw **会在每个会话中固定选定的凭证配置档案**，以保持提供商缓存热度。它**不会**在每次请求时轮换。固定的配置档案会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 压缩完成（压缩计数递增）
- 配置档案处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖项**，并且在新会话开始前不会自动轮换。

<Note>
自动固定的配置档案（由会话路由器选择）会被视为一种**偏好**：它们会先被尝试，但 OpenClaw 可能会在速率限制/超时时轮换到另一个配置档案。当原始配置档案再次可用时，新的运行可以再次优先使用它，而无需更改选定的模型或运行时。用户固定的配置档案会保持锁定到该配置档案；如果它失败且已配置模型回退，OpenClaw 会转到下一个模型，而不是切换配置档案。
</Note>

### OpenAI Codex 订阅加 API key 备份

对于 OpenAI 智能体模型，凭证和运行时是分离的。`openai/gpt-*` 仍然使用
Codex harness，而凭证可以在 Codex 订阅配置档案和
OpenAI API key 备份之间轮换。

使用 `auth.order.openai` 配置面向用户的顺序：

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

现有的 Codex 订阅配置档案仍可使用旧版
`openai-codex:*` 配置档案 ID。有序的 API key 备份可以是普通的
`openai:*` API key 配置档案。当订阅达到 Codex 使用限制时，
如果 Codex 提供了确切的重置时间，OpenClaw 会记录它，尝试下一个
有序凭证配置档案，并让该运行保持在 Codex harness 内。重置
时间过后，订阅配置档案会再次符合条件，下一次自动
选择可以回到它。

只有当你想为该会话强制使用某一个账户/key 时，才使用用户固定的配置档案。用户固定的配置档案有意保持严格，不会静默跳转
到另一个配置档案。

## 冷却

当配置档案因凭证/速率限制错误（或看起来像速率限制的超时）失败时，OpenClaw 会将其标记为冷却，并转到下一个配置档案。

<AccordionGroup>
  <Accordion title="进入速率限制/超时桶的内容">
    该速率限制桶比单纯的 `429` 更宽泛：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly/monthly limit reached`。

    格式/无效请求错误通常是终止性错误，因为用同一载荷重试会以同样方式失败，所以 OpenClaw 会直接暴露这些错误，而不是轮换凭证配置档案。已知的重试修复路径可以显式选择启用：例如 Cloud Code Assist 工具调用 ID 验证失败会被清理，并通过 `allowFormatRetry` 策略重试一次。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/故障转移信号。

    当来源匹配已知瞬时模式时，通用服务器文本也可能进入该超时桶。例如，裸的 pi-ai 流包装器消息 `An unknown error occurred` 会被视为对每个提供商都值得故障转移，因为当提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体细节时，pi-ai 会发出它。带有瞬时服务器文本的 JSON `api_error` 载荷，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得故障转移的超时。

    OpenRouter 专属的通用上游文本，例如裸的 `Provider returned error`，只有在提供商上下文确实是 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守，本身不会触发故障转移。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 可能会在将控制权交还给 OpenClaw 之前，因较长的 `Retry-After` 窗口而休眠。对于基于 Stainless 的 SDK（例如 Anthropic 和 OpenAI），OpenClaw 默认将 SDK 内部的 `retry-after-ms` / `retry-after` 等待限制为 60 秒，并立即暴露更长的可重试响应，以便运行此故障转移路径。可通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；请参阅[重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域冷却">
    速率限制冷却也可以按模型设定作用域：

    - 当失败的模型 ID 已知时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 如果冷却作用域是另一个模型，同一提供商上的同级模型仍可尝试。
    - 计费/禁用窗口仍会跨模型阻止整个配置档案。

  </Accordion>
</AccordionGroup>

冷却使用指数退避：

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

计费/额度失败（例如 “insufficient credits” / “credit balance too low”）会被视为值得故障转移，但它们通常不是瞬时问题。OpenClaw 不会使用短冷却，而是将该配置档案标记为**禁用**（带有更长退避），并轮换到下一个配置档案/提供商。

<Note>
并非所有看起来像计费的响应都是 `402`，也并非所有 HTTP `402` 都会进入这里。即使提供商返回 `401` 或 `403`，OpenClaw 也会把明确的计费文本保留在计费通道中，但提供商专属的匹配器仍限定在拥有它们的提供商作用域内（例如 OpenRouter `403 Key limit exceeded`）。

同时，当消息看起来可重试时，临时的 `402` 使用窗口和组织/工作区花费限制错误会被归类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。这些会走短冷却/故障转移路径，而不是长账单禁用路径。
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

- 账单退避从 **5 小时**开始，每次账单失败后翻倍，最高 **24 小时**。
- 如果配置文件 **24 小时**内没有失败，退避计数器会重置（可配置）。
- 过载重试允许在模型回退前进行 **1 次同提供商配置文件轮换**。
- 过载重试默认使用 **0 ms 退避**。

## 模型回退

如果某个提供商的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已耗尽配置文件轮换的身份验证失败、速率限制和超时（其他错误不会推进回退）。没有暴露足够详细信息的提供商错误仍会在回退状态中被精确标记：`empty_response` 表示提供商没有返回可用的消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始预览，但尚无分类器匹配它。

与账单冷却相比，过载和速率限制错误会被更积极地处理。默认情况下，OpenClaw 允许一次同提供商身份验证配置文件重试，然后无需等待就切换到下一个已配置的模型回退。`ModelNotReadyException` 等提供商繁忙信号会进入该过载类别。可通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 调整此行为。

当运行从已配置的默认主模型、cron 作业主模型、带显式回退的 Agent 主模型，或自动选择的回退覆盖开始时，OpenClaw 可以沿着匹配的已配置回退链前进。没有显式回退的 Agent 主模型和显式用户选择（例如 `/model ollama/qwen3.5:27b`、模型选择器、`sessions.patch`，或一次性 CLI 提供商/模型覆盖）是严格的：如果该提供商/模型不可达或在生成回复前失败，OpenClaw 会报告失败，而不是从不相关的回退中作答。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 加上已配置的回退来构建候选列表。

<AccordionGroup>
  <Accordion title="Rules">
    - 请求的模型始终排在第一位。
    - 显式配置的回退会去重，但不会按模型允许列表过滤。它们会被视为显式的操作员意图。
    - 如果当前运行已经位于同一提供商族内的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
    - 当未提供显式回退覆盖时，即使请求的模型使用不同提供商，也会先尝试已配置回退，再尝试已配置主模型。
    - 当未向回退运行器提供显式回退覆盖时，已配置主模型会追加到末尾，以便在更早的候选耗尽后，链可以回到正常默认值。
    - 当调用方提供 `fallbacksOverride` 时，运行器只使用请求的模型加上该覆盖列表。空列表会禁用模型回退，并阻止将已配置主模型作为隐藏重试目标追加。

  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="Continues on">
    - 身份验证失败
    - 速率限制和冷却耗尽
    - 过载/提供商繁忙错误
    - 呈现超时形态的故障转移错误
    - 账单禁用
    - `LiveSessionModelSwitchError`，它会被规范化为故障转移路径，这样过时的持久化模型不会造成外层重试循环
    - 当仍有剩余候选时，其他无法识别的错误

  </Tab>
  <Tab title="Does not continue on">
    - 不是超时/故障转移形态的显式中止
    - 应留在压缩/重试逻辑内部的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 没有剩余候选时的最终未知错误

  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的每个身份验证配置文件都已处于冷却状态时，OpenClaw 不会自动永远跳过该提供商。它会按候选逐一决策：

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - 持久性身份验证失败会立即跳过整个提供商。
    - 账单禁用通常会跳过，但主候选仍可按节流策略探测，以便无需重启也能恢复。
    - 主候选可以在接近冷却到期时被探测，并按提供商节流。
    - 当失败看起来是瞬时的（`rate_limit`、`overloaded` 或未知）时，即使处于冷却状态，也可以尝试同提供商的回退兄弟模型。当速率限制是模型级别且兄弟模型可能立即恢复时，这一点尤其相关。
    - 瞬时冷却探测在每次回退运行中按提供商限制为一次，避免单个提供商阻塞跨提供商回退。

  </Accordion>
</AccordionGroup>

## 会话覆盖和实时模型切换

会话模型变更是共享状态。活动运行器、`/model` 命令、压缩/会话更新以及实时会话协调都会读取或写入同一个会话条目的不同部分。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型变更会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的模型变更（例如回退轮换、Heartbeat 覆盖或压缩）本身永远不会标记待处理的实时切换。
- 用户驱动的模型覆盖会被回退策略视为精确选择，因此不可达的已选提供商会暴露为失败，而不会被 `agents.defaults.model.fallbacks` 掩盖。
- 在回退重试开始前，回复运行器会将所选回退覆盖字段持久化到会话条目。
- 自动回退覆盖会在后续轮次中保持选中，因此 OpenClaw 不会在每条消息上都探测已知异常的主模型。`/new`、`/reset` 和 `sessions.reset` 会清除自动来源的覆盖，并将会话恢复到已配置默认值。
- `/status` 会显示所选模型；当回退状态不同时，还会显示活动回退模型和原因。
- 实时会话协调会优先使用持久化的会话覆盖，而不是过时的运行时模型字段。
- 如果实时切换错误指向活动回退链中的后续候选，OpenClaw 会直接跳到该选定模型，而不是先遍历不相关的候选。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，并且只有当这些字段仍与该失败候选匹配时才回滚。

这可以防止典型竞态：

<Steps>
  <Step title="Primary fails">
    所选主模型失败。
  </Step>
  <Step title="Fallback chosen in memory">
    回退候选在内存中被选中。
  </Step>
  <Step title="Session store still says old primary">
    会话存储仍然反映旧主模型。
  </Step>
  <Step title="Live reconciliation reads stale state">
    实时会话协调读取到过时的会话状态。
  </Step>
  <Step title="Retry snapped back">
    在回退尝试开始前，重试被拉回旧模型。
  </Step>
</Steps>

持久化的回退覆盖会关闭这个窗口，而窄范围回滚会保留更新的手动或运行时会话变更。

## 可观测性和失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 已尝试的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似故障转移原因）
- 可选状态/代码
- 人类可读的错误摘要

结构化 `model_fallback_decision` 日志在候选失败、被跳过或后续回退成功时，也会包含扁平的 `fallbackStep*` 字段。这些字段会明确尝试的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），因此日志和诊断导出器即使在终端回退也失败时，也能重建主模型失败情况。

当每个候选都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以用它构建更具体的消息，例如“所有模型都暂时受到速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要会感知模型：

- 与尝试的提供商/模型链无关的模型级速率限制会被忽略
- 如果剩余阻塞是匹配的模型级速率限制，OpenClaw 会报告仍阻塞该模型的最后一个匹配到期时间

## 相关配置

请参阅 [Gateway 网关配置](/zh-CN/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

请参阅 [Models](/zh-CN/concepts/models) 了解更广泛的模型选择和回退概览。
