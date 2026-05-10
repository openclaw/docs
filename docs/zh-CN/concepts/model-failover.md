---
read_when:
    - 诊断凭证配置文件轮换、冷却或模型回退行为
    - 更新认证配置档或模型的故障转移规则
    - 理解会话模型覆盖设置如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换凭证配置文件并在多个模型间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-05-10T19:30:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分两个阶段处理失败：

1. **当前提供商内的凭证配置轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文档说明运行时规则及其背后的数据。

## 运行时流程

对于普通文本运行，OpenClaw 按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析活动会话模型和凭证配置偏好。
  </Step>
  <Step title="构建候选链">
    根据当前模型选择以及该选择来源的回退策略构建模型候选链。已配置的默认值、cron 任务主模型以及自动选择的回退模型可以使用已配置的回退；显式用户会话选择是严格的。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置轮换/冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得故障转移的错误上前进">
    如果该提供商因值得故障转移的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选回退覆盖，这样其他会话读取方会看到运行器即将使用的同一个提供商/模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="在失败时窄范围回滚">
    如果回退候选项失败，仅在回退拥有的会话覆盖字段仍然匹配该失败候选项时回滚这些字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出包含每次尝试详情的 `FallbackSummaryError`，并在已知时包含最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这可以防止失败的回退重试覆盖较新的无关会话变更，例如手动 `/model` 更改，或尝试运行期间发生的会话轮换更新。

## 选择来源策略

OpenClaw 会将所选提供商/模型与选择原因分开。该来源控制是否允许回退链：

- **已配置默认值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **智能体主模型**：`agents.list[].model` 是严格的，除非该智能体模型对象包含自己的 `fallbacks`。使用 `fallbacks: []` 可显式设置严格行为，或提供非空列表让该智能体启用模型回退。
- **自动回退覆盖**：运行时回退会在重试前写入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` 以及所选来源模型。该自动覆盖可以继续沿已配置的回退链前进，并会被 `/new`、`/reset` 和 `sessions.reset` 清除。没有显式 `heartbeat.model` 的 Heartbeat 运行也会在其来源不再匹配当前已配置默认值时清除直接自动覆盖。
- **用户会话覆盖**：`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会写入 `modelOverrideSource: "user"`。这是精确的会话选择。如果所选提供商/模型在生成回复前失败，OpenClaw 会报告失败，而不是从无关的已配置回退中作答。
- **旧版会话覆盖**：较旧的会话条目可能有 `modelOverride`，但没有 `modelOverrideSource`。OpenClaw 将这些视为用户覆盖，因此显式的旧选择不会被静默转换为回退行为。
- **Cron 载荷模型**：cron 任务的 `payload.model` / `--model` 是任务主模型，而不是用户会话覆盖。它会使用已配置的回退，除非任务提供 `payload.fallbacks`；`payload.fallbacks: []` 会让该 cron 运行保持严格。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置**。

- 密钥存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时凭证路由状态存放在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅用于元数据 + 路由**（无密钥）。
- 仅用于旧版导入的 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）。

更多详情：[OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包括 `projectId`/`enterpriseUrl`）

## 配置 ID

OAuth 登录会创建不同的配置，以便多个账号可以共存。

- 默认：没有可用邮箱时为 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置时，OpenClaw 会按如下方式选择顺序：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置配置">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="已存储配置">
    `auth-profiles.json` 中该提供商的条目。
  </Step>
</Steps>

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：**配置类型（**OAuth 优先于 API 密钥**）。
- **次键：**`usageStats.lastUsed`（每种类型内最旧优先）。
- **处于冷却/禁用的配置**会被移到末尾，并按最早到期时间排序。

### 会话粘性（缓存友好）

OpenClaw 会**按会话固定所选凭证配置**，以保持提供商缓存热度。它**不会**在每个请求上轮换。固定的配置会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 压缩完成（压缩计数递增）
- 该配置处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖**，并且在新会话开始前不会自动轮换。

<Note>
自动固定的配置（由会话路由器选择）会被视为一种**偏好**：它们会先被尝试，但 OpenClaw 可能会在速率限制/超时发生时轮换到另一个配置。用户固定的配置会保持锁定到该配置；如果它失败并且配置了模型回退，OpenClaw 会移动到下一个模型，而不是切换配置。
</Note>

### 为什么 OAuth 可能“看起来丢失”

如果同一个提供商同时有 OAuth 配置和 API 密钥配置，除非已固定，否则轮询可能会在不同消息之间切换它们。若要强制使用单个配置：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 通过 `/model …` 使用带配置覆盖的按会话覆盖（当你的 UI/聊天界面支持时）。

## 冷却

当某个配置因凭证/速率限制错误（或看起来像速率限制的超时）而失败时，OpenClaw 会将它标记为冷却，并移动到下一个配置。

<AccordionGroup>
  <Accordion title="进入速率限制 / 超时桶的内容">
    该速率限制桶比普通 `429` 更宽：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly/monthly limit reached`。

    格式/无效请求错误通常是终止性的，因为重试相同载荷会以同样方式失败，所以 OpenClaw 会直接暴露它们，而不是轮换凭证配置。已知的重试修复路径可以显式选择加入：例如 Cloud Code Assist 工具调用 ID 验证失败会被清理，并通过 `allowFormatRetry` 策略重试一次。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被分类为超时/故障转移信号。

    当来源匹配已知瞬时模式时，通用服务器文本也可以进入该超时桶。例如，裸 pi-ai 流包装器消息 `An unknown error occurred` 会对每个提供商都被视为值得故障转移，因为 pi-ai 会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体详情时发出它。带有瞬时服务器文本的 JSON `api_error` 载荷，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得故障转移的超时。

    OpenRouter 专属的通用上游文本，例如裸 `Provider returned error`，只有当提供商上下文实际为 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守，单独出现时不会触发故障转移。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 可能会在将控制权交还给 OpenClaw 前，为较长的 `Retry-After` 窗口休眠。对于基于 Stainless 的 SDK（例如 Anthropic 和 OpenAI），OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待限制在 60 秒，并立即暴露更长的可重试响应，以便运行此故障转移路径。使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；请参阅[重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型范围冷却">
    速率限制冷却也可以限定到模型范围：

    - 当失败模型 ID 已知时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 当冷却限定到另一个模型时，同一提供商上的兄弟模型仍然可以尝试。
    - 计费/禁用窗口仍会跨模型阻止整个配置。

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

计费/额度失败（例如 "insufficient credits" / "credit balance too low"）会被视为值得故障转移，但它们通常不是瞬时的。OpenClaw 不会使用短冷却，而是将该配置标记为**禁用**（使用更长的退避），并轮换到下一个配置/提供商。

<Note>
并非所有看起来像计费的响应都是 `402`，也并非每个 HTTP `402` 都归入这里。即使提供商返回的是 `401` 或 `403`，OpenClaw 也会将显式计费文本保留在计费通道中，但提供商专属匹配器会保持限定在拥有它们的提供商范围内（例如 OpenRouter `403 Key limit exceeded`）。

同时，临时 `402` 使用窗口和组织/工作区支出限制错误会在消息看起来可重试时被分类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。它们会留在短冷却/故障转移路径上，而不是进入长期计费禁用路径。
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

- 计费退避从 **5 小时**开始，每次计费失败翻倍，并封顶于 **24 小时**。
- 如果该配置 **24 小时**内没有失败，退避计数器会重置（可配置）。
- 过载重试在模型回退前允许 **1 次同提供商配置轮换**。
- 过载重试默认使用 **0 ms 退避**。

## 模型回退

如果某个提供商的所有配置档案都失败，OpenClaw 会转到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于认证失败、速率限制，以及已耗尽配置档案轮换的超时（其他错误不会推进 fallback）。没有暴露足够细节的提供商错误仍会在 fallback 状态中被精确标记：`empty_response` 表示提供商没有返回可用的消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，`unclassified` 表示 OpenClaw 保留了原始预览，但还没有分类器匹配到它。

过载和速率限制错误会比计费冷却更积极地处理。默认情况下，OpenClaw 允许一次同提供商认证配置档案重试，然后不等待，直接切换到下一个已配置的模型 fallback。`ModelNotReadyException` 等提供商繁忙信号会归入这个过载类别。可通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 调整此行为。

当一次运行从已配置的默认主模型、cron 作业主模型、带显式 fallback 的智能体主模型，或自动选择的 fallback 覆盖开始时，OpenClaw 可以沿匹配的已配置 fallback 链继续尝试。没有显式 fallback 的智能体主模型，以及显式用户选择（例如 `/model ollama/qwen3.5:27b`、模型选择器、`sessions.patch`，或一次性的 CLI 提供商/模型覆盖）是严格的：如果该提供商/模型无法访问，或在生成回复前失败，OpenClaw 会报告失败，而不是从无关的 fallback 中作答。

### 候选链规则

OpenClaw 会从当前请求的 `provider/model` 加上已配置的 fallback 构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的 fallback 会去重，但不会按模型 allowlist 过滤。它们会被视为显式的操作员意图。
    - 如果当前运行已经位于同一提供商家族中的已配置 fallback 上，OpenClaw 会继续使用完整的已配置链。
    - 如果当前运行使用的提供商与配置不同，并且当前模型尚未属于已配置 fallback 链的一部分，OpenClaw 不会追加来自另一个提供商的无关已配置 fallback。
    - 当没有向 fallback 运行器提供显式 fallback 覆盖时，已配置主模型会追加到末尾，使链在较早候选都耗尽后可以回到正常默认值。
    - 当调用方提供 `fallbacksOverride` 时，运行器只使用请求的模型加上该覆盖列表。空列表会禁用模型 fallback，并阻止已配置主模型作为隐藏重试目标被追加。

  </Accordion>
</AccordionGroup>

### 哪些错误会推进 fallback

<Tabs>
  <Tab title="会继续处理">
    - 认证失败
    - 速率限制和冷却耗尽
    - 过载/提供商繁忙错误
    - 呈现为超时形态的故障转移错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被规范化为故障转移路径，这样过期的持久化模型不会造成外层重试循环
    - 仍有剩余候选时的其他无法识别错误

  </Tab>
  <Tab title="不会继续处理">
    - 不属于超时/故障转移形态的显式中止
    - 应留在压缩/重试逻辑内处理的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`，或 `ollama error: context length exceeded`）
    - 没有剩余候选时的最终未知错误

  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的每个认证配置档案都已处于冷却中时，OpenClaw 不会自动永远跳过该提供商。它会按候选做决定：

<AccordionGroup>
  <Accordion title="按候选决策">
    - 持久性认证失败会立即跳过整个提供商。
    - 计费禁用通常会跳过，但主候选仍可按节流规则探测，这样无需重启也可能恢复。
    - 主候选可在接近冷却到期时被探测，并带有按提供商的节流。
    - 当失败看起来是瞬态的（`rate_limit`、`overloaded` 或 unknown）时，即使处于冷却，同提供商的 fallback 兄弟候选也可以尝试。这在速率限制限定于模型，而兄弟模型可能仍能立即恢复时尤其相关。
    - 瞬态冷却探测限制为每个提供商在每次 fallback 运行中一次，这样单个提供商不会阻塞跨提供商 fallback。

  </Accordion>
</AccordionGroup>

## 会话覆盖和实时模型切换

会话模型变更是共享状态。活动运行器、`/model` 命令、压缩/会话更新，以及实时会话协调，都会读取或写入同一个会话条目的部分内容。

这意味着 fallback 重试必须与实时模型切换协调：

- 只有显式用户驱动的模型变更会标记一个待处理实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的模型变更，例如 fallback 轮换、Heartbeat 覆盖或压缩，本身绝不会标记待处理实时切换。
- 用户驱动的模型覆盖会被视为 fallback 策略的精确选择，因此无法访问的已选提供商会表现为失败，而不会被 `agents.defaults.model.fallbacks` 掩盖。
- 在 fallback 重试开始前，回复运行器会将所选 fallback 覆盖字段持久化到会话条目。
- 自动 fallback 覆盖会在后续轮次中保持选中，这样 OpenClaw 不会在每条消息上探测一个已知不可用的主模型。`/new`、`/reset` 和 `sessions.reset` 会清除自动来源的覆盖，并将会话恢复到已配置默认值。
- `/status` 会显示所选模型，并在 fallback 状态不同的时候显示活动 fallback 模型和原因。
- 实时会话协调会优先使用持久化会话覆盖，而不是过期的运行时模型字段。
- 如果实时切换错误指向活动 fallback 链中的后续候选，OpenClaw 会直接跳到该所选模型，而不是先遍历无关候选。
- 如果 fallback 尝试失败，运行器只会回滚它写入的覆盖字段，并且仅在这些字段仍与该失败候选匹配时回滚。

这可以防止典型竞态：

<Steps>
  <Step title="主模型失败">
    所选主模型失败。
  </Step>
  <Step title="在内存中选择 fallback">
    在内存中选择 fallback 候选。
  </Step>
  <Step title="会话存储仍显示旧主模型">
    会话存储仍反映旧主模型。
  </Step>
  <Step title="实时协调读取过期状态">
    实时会话协调读取过期的会话状态。
  </Step>
  <Step title="重试被切回">
    fallback 尝试开始前，重试被切回旧模型。
  </Step>
</Steps>

持久化的 fallback 覆盖会关闭这个窗口，而窄范围回滚会让较新的手动或运行时会话变更保持完整。

## 可观测性和失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 已尝试的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`，以及类似的故障转移原因）
- 可选状态/代码
- 人类可读的错误摘要

结构化 `model_fallback_decision` 日志在候选失败、被跳过或后续 fallback 成功时，也会包含扁平的 `fallbackStep*` 字段。这些字段会明确记录已尝试的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），使日志和诊断导出器能够重建主模型失败，即使终端 fallback 也失败了。

当每个候选都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以用它构建更具体的消息，例如“所有模型都暂时受到速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要是感知模型的：

- 与已尝试提供商/模型链无关的模型级速率限制会被忽略
- 如果剩余阻塞是匹配的模型级速率限制，OpenClaw 会报告仍在阻塞该模型的最后一个匹配到期时间

## 相关配置

请参阅 [Gateway 网关配置](/zh-CN/gateway/configuration)，了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

请参阅 [Models](/zh-CN/concepts/models)，了解更广泛的模型选择和 fallback 概览。
