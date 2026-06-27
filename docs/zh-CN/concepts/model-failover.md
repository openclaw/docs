---
read_when:
    - 诊断凭证配置档轮换、冷却时间或模型回退行为
    - 更新凭证配置档案或模型的故障转移规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换凭证配置文件并在模型之间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-06-27T01:50:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分两个阶段处理故障：

1. 当前提供商内的**凭证配置文件轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文说明运行时规则及其背后的数据。

## 运行时流程

对于普通文本运行，OpenClaw 按以下顺序评估候选项：

<Steps>
  <Step title="Resolve session state">
    解析活跃会话模型和凭证配置文件偏好。
  </Step>
  <Step title="Build candidate chain">
    根据当前模型选择，以及该选择来源对应的回退策略，构建模型候选链。已配置的默认值、cron 作业主模型和自动选择的回退模型可以使用已配置的回退；显式的用户会话选择则是严格的。
  </Step>
  <Step title="Try the current provider">
    使用凭证配置文件轮换/冷却规则尝试当前提供商。
  </Step>
  <Step title="Advance on failover-worthy errors">
    如果该提供商因值得故障转移的错误而耗尽，则移至下一个模型候选项。
  </Step>
  <Step title="Persist fallback override">
    在重试开始前持久化选定的回退覆盖项，以便其他会话读取方看到运行器即将使用的相同提供商/模型。持久化的模型覆盖项会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="Roll back narrowly on failure">
    如果回退候选项失败，仅在回退拥有的会话覆盖字段仍然匹配该失败候选项时回滚这些字段。
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    如果所有候选项都失败，抛出 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及已知时最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只持久化它为回退拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这可以防止失败的回退重试覆盖更新的无关会话变更，例如手动 `/model` 更改，或尝试运行期间发生的会话轮换更新。

## 选择来源策略

OpenClaw 会区分所选提供商/模型，以及它为何被选择。该来源控制是否允许使用回退链：

- **已配置的默认值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **智能体主模型**：`agents.list[].model` 是严格的，除非该智能体模型对象包含自己的 `fallbacks`。使用 `fallbacks: []` 可显式采用严格行为，或提供非空列表让该智能体选择加入模型回退。
- **自动回退覆盖项**：运行时回退会在重试前写入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`，以及选定的来源模型。该自动覆盖项可以持续沿着已配置的回退链前进，而无需在每条消息上探测主模型，但 OpenClaw 会定期再次探测已配置的来源，并在其恢复时清除自动覆盖项。`/new`、`/reset` 和 `sessions.reset` 也会清除自动来源的覆盖项。没有显式 `heartbeat.model` 的 Heartbeat 运行，在其来源不再匹配当前已配置默认值时，会清除直接自动覆盖项。
- **用户会话覆盖项**：`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会写入 `modelOverrideSource: "user"`。这是一个精确的会话选择。如果选定的提供商/模型在生成回复前失败，OpenClaw 会报告该失败，而不是从无关的已配置回退中作答。
- **旧版会话覆盖项**：较旧的会话条目可能有 `modelOverride`，但没有 `modelOverrideSource`。OpenClaw 会将这些条目视为用户覆盖项，因此显式的旧选择不会被静默转换为回退行为。
- **Cron 载荷模型**：cron 作业的 `payload.model` / `--model` 是作业主模型，而不是用户会话覆盖项。除非作业提供 `payload.fallbacks`，否则它使用已配置的回退；`payload.fallbacks: []` 会让 cron 运行保持严格。

自动回退主模型探测间隔为五分钟，且不可配置。OpenClaw 会按会话和主模型记住最近的探测，因此失败的主模型不会在每个轮次都被重试。OpenClaw 会在会话移至回退时发送一条可见通知，并在会话返回所选主模型时发送另一条通知；它不会在每个粘性回退轮次重复通知。

## 凭证失败跳过缓存

默认情况下，每个新轮次都会保留现有的回退重试行为：OpenClaw
会再次尝试每个已配置的回退候选项，包括最近因 `auth` 或 `auth_permanent`
失败的非主候选项。

希望抑制这些重复凭证失败的操作员可以通过以下方式选择加入：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

启用后，OpenClaw 会在非主回退候选项发生凭证类失败后，记录一个
内存中、会话范围的跳过标记。该标记按会话 ID、提供商和模型确定键。
主候选项永远不会被跳过，因此显式用户模型选择仍会暴露真实的凭证错误。
该缓存为进程本地缓存，并会在 Gateway 网关重启时清除。

该值是以毫秒为单位的 TTL。`0` 或未设置值会禁用缓存。
正值会被限制在 1 秒到 10 分钟之间。

## 用户可见的回退通知

当会话移至自动选择的回退时，OpenClaw 会在同一回复表面发送状态通知：

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

当后续探测成功且会话返回所选主模型时，OpenClaw 会发送：

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

这些通知是运维消息，而不是助手内容。它们在每次状态变化时投递一次，包括可行时仅有副作用的轮次，但粘性回退轮次不会重复它们。投递会绕过正常的来源回复抑制，该通知不会占用线程式渠道的第一条助手回复槽位，并且会被排除在文本转语音和跟进承诺提取之外。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置文件**。

- 密文和运行时凭证路由状态位于 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- 配置 `auth.profiles` / `auth.order` 仅为**元数据 + 路由**（不含密文）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到每个智能体的凭证存储）。
- 旧版 `auth-profiles.json`、`auth-state.json` 和每个智能体的 `auth.json` 文件会由 `openclaw doctor --fix` 导入。

更多详情：[OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包含 `projectId`/`enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，因此多个账号可以共存。

- 默认：没有可用电子邮件时为 `provider:default`。
- 带电子邮件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件位于每个智能体的 `openclaw-agent.sqlite` 凭证配置文件存储中。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按如下方式选择顺序：

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="Configured profiles">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="Stored profiles">
    该提供商在每个智能体 SQLite 中的凭证配置文件条目。
  </Step>
</Steps>

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：**配置文件类型（**OAuth 先于 API 密钥**）。
- **次键：**`usageStats.lastUsed`（每种类型内最早的优先）。
- **处于冷却/禁用的配置文件**会移至末尾，并按最早到期时间排序。

### 会话粘性（缓存友好）

OpenClaw 会**按会话固定所选凭证配置文件**，以保持提供商缓存热度。它**不会**在每次请求时轮换。固定的配置文件会被复用，直到：

- 会话被重置（`/new` / `/reset`）
- 压缩完成（压缩计数递增）
- 配置文件处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖项**，并且在新会话开始前不会自动轮换。

<Note>
自动固定的配置文件（由会话路由器选择）会被视为一种**偏好**：它们会被优先尝试，但 OpenClaw 可能会在速率限制/超时时轮换到另一个配置文件。当原始配置文件再次可用时，新的运行可以再次偏好它，而无需更改所选模型或运行时。用户固定的配置文件会锁定到该配置文件；如果它失败且配置了模型回退，OpenClaw 会移至下一个模型，而不是切换配置文件。
</Note>

### OpenAI Codex 订阅加 API 密钥备份

对于 OpenAI 智能体模型，凭证和运行时是分离的。`openai/gpt-*` 保持在
Codex harness 上，而凭证可以在 Codex 订阅配置文件和
OpenAI API 密钥备份之间轮换。

使用 `auth.order.openai` 设置面向用户的顺序：

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

对 ChatGPT/Codex OAuth 配置文件和 OpenAI API 密钥
配置文件都使用 `openai:*`。当订阅达到 Codex 使用限制时，
如果 Codex 提供确切的重置时间，OpenClaw 会记录该时间，尝试下一个
有序凭证配置文件，并让运行保持在 Codex harness 内。重置
时间过去后，订阅配置文件会再次符合条件，下一次自动
选择可以返回它。

仅当你想为该会话强制使用一个账号/密钥时，才使用用户固定的配置文件。
用户固定的配置文件有意保持严格，不会静默跳转到另一个配置文件。

## 冷却

当配置文件因凭证/速率限制错误（或看起来像速率限制的超时）而失败时，OpenClaw 会将其标记为冷却，并移至下一个配置文件。

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    该速率限制桶比普通 `429` 更宽：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly/monthly limit reached`。

    格式/无效请求错误通常是终止性的，因为重试相同载荷会以相同方式失败，所以 OpenClaw 会暴露它们，而不是轮换凭证配置文件。已知的重试修复路径可以显式选择加入：例如 Cloud Code Assist 工具调用 ID 校验失败会被清理，并通过 `allowFormatRetry` 策略重试一次。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/故障转移信号。

    当来源匹配已知瞬态模式时，通用服务器文本也可能落入该超时桶。例如，裸模型运行时流包装器消息 `An unknown error occurred` 会被视为对每个提供商都值得故障转移，因为共享模型运行时会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体详情时发出它。带有瞬态服务器文本的 JSON `api_error` 载荷，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得故障转移的超时。

    OpenRouter 特定的通用上游文本，例如裸 `Provider returned error`，仅在提供商上下文实际为 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，保持保守，且其本身不会触发故障转移。

  </Accordion>
  <Accordion title="SDK retry-after caps">
    某些提供商 SDK 否则可能会先休眠很长的 `Retry-After` 窗口，然后才把控制权交还给 OpenClaw。对于 Anthropic 和 OpenAI 等基于 Stainless 的 SDK，OpenClaw 默认将 SDK 内部的 `retry-after-ms` / `retry-after` 等待上限设为 60 秒，并立即暴露更长的可重试响应，以便这条故障转移路径可以运行。使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；参见[重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    速率限制冷却也可以限定到模型：

    - 当失败模型 ID 已知时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 当冷却限定到另一个模型时，仍可尝试同一提供商上的兄弟模型。
    - 计费/禁用窗口仍会跨模型阻止整个配置档案。

  </Accordion>
</AccordionGroup>

冷却使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在按 Agent 配置的 SQLite 凭证状态的 `usageStats` 下：

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

计费/额度失败（例如 “insufficient credits” / “credit balance too low”）会被视为值得故障转移，但它们通常不是暂时性的。OpenClaw 不会使用短冷却，而是将该配置档案标记为**已禁用**（使用更长的退避），并轮换到下一个配置档案/提供商。

<Note>
并非每个计费形态的响应都是 `402`，也并非每个 HTTP `402` 都会进入这里。即使提供商返回的是 `401` 或 `403`，OpenClaw 也会把明确的计费文本保留在计费通道中，但提供商特定的匹配器仍限定在拥有它们的提供商范围内（例如 OpenRouter `403 Key limit exceeded`）。

同时，当消息看起来可重试时，临时 `402` 使用窗口和组织/工作区支出上限错误会被归类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。这些错误会保留在短冷却/故障转移路径上，而不是进入较长的计费禁用路径。
</Note>

状态存储在按 Agent 配置的 SQLite 凭证状态中：

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

- 计费退避从 **5 小时**开始，每次计费失败后翻倍，并以 **24 小时**为上限。
- 如果该配置档案在 **24 小时**内没有失败，退避计数器会重置（可配置）。
- 过载重试允许在模型回退前进行 **1 次同提供商配置档案轮换**。
- 过载重试默认使用 **0 ms 退避**。

## 模型回退

如果某个提供商的所有配置档案都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已耗尽配置档案轮换的凭证失败、速率限制和超时（其他错误不会推进回退）。没有暴露足够细节的提供商错误仍会在回退状态中被精确标记：`empty_response` 表示提供商没有返回可用消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始预览，但尚无分类器匹配它。

过载和速率限制错误比计费冷却处理得更积极。默认情况下，OpenClaw 允许一次同提供商凭证配置档案重试，然后无需等待就切换到下一个已配置的模型回退。`ModelNotReadyException` 等提供商繁忙信号会进入该过载类别。使用 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 调整此行为。

当一次运行从已配置的默认主模型、cron 任务主模型、带显式回退的 Agent 主模型，或自动选择的回退覆盖开始时，OpenClaw 可以沿着匹配的已配置回退链前进。没有显式回退的 Agent 主模型以及显式用户选择（例如 `/model ollama/qwen3.5:27b`、模型选择器、`sessions.patch` 或一次性的 CLI 提供商/模型覆盖）是严格的：如果该提供商/模型不可达或在生成回复前失败，OpenClaw 会报告失败，而不是从无关的回退中作答。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 加上已配置回退来构建候选列表。

<AccordionGroup>
  <Accordion title="Rules">
    - 请求的模型始终排在第一位。
    - 显式配置的回退会去重，但不会按模型允许列表过滤。它们会被视为明确的操作员意图。
    - 如果当前运行已经位于同一提供商系列中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
    - 当未提供显式回退覆盖时，即使请求的模型使用不同提供商，也会先尝试已配置回退，再尝试已配置主模型。
    - 当未向回退运行器提供显式回退覆盖时，已配置主模型会追加到末尾，这样链在更早的候选耗尽后可以回到正常默认值。
    - 当调用方提供 `fallbacksOverride` 时，运行器会精确使用请求的模型加上该覆盖列表。空列表会禁用模型回退，并阻止将已配置主模型作为隐藏重试目标追加。

  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="Continues on">
    - 凭证失败
    - 速率限制和冷却耗尽
    - 过载/提供商繁忙错误
    - 超时形态的故障转移错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被规范化到故障转移路径中，避免陈旧的持久化模型创建外层重试循环
    - 当仍有剩余候选时的其他无法识别错误

  </Tab>
  <Tab title="Does not continue on">
    - 非超时/故障转移形态的显式中止
    - 应留在压缩/重试逻辑内的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 没有剩余候选时的最终未知错误

  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的每个凭证配置档案都已处于冷却中时，OpenClaw 不会自动永远跳过该提供商。它会按候选逐一决策：

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - 持久性凭证失败会立即跳过整个提供商。
    - 计费禁用通常会跳过，但主候选仍可按节流策略探测，以便无需重启也能恢复。
    - 主候选可以在接近冷却到期时按每提供商节流进行探测。
    - 当失败看起来是暂时性的（`rate_limit`、`overloaded` 或未知）时，即使存在冷却，也可以尝试同提供商回退兄弟模型。当速率限制限定到模型且兄弟模型可能仍能立即恢复时，这一点尤其相关。
    - 暂时性冷却探测在每次回退运行中每个提供商最多一次，避免单个提供商阻塞跨提供商回退。

  </Accordion>
</AccordionGroup>

## 会话覆盖和实时模型切换

会话模型变更是共享状态。活动运行器、`/model` 命令、压缩/会话更新以及实时会话协调都会读取或写入同一会话条目的不同部分。

这意味着回退重试必须与实时模型切换协调：

- 只有显式用户驱动的模型变更会标记待处理实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的模型变更（例如回退轮换、Heartbeat 覆盖或压缩）本身绝不会标记待处理实时切换。
- 用户驱动的模型覆盖会被视为回退策略的精确选择，因此不可达的已选提供商会暴露为失败，而不是被 `agents.defaults.model.fallbacks` 掩盖。
- 在回退重试开始前，回复运行器会将选定的回退覆盖字段持久化到会话条目。
- 自动回退覆盖会在后续轮次中保持选中，这样 OpenClaw 不会在每条消息上都探测已知故障的主模型。OpenClaw 会定期再次探测已配置来源，并在其恢复时清除自动覆盖；`/new`、`/reset` 和 `sessions.reset` 会立即清除自动来源的覆盖。
- 用户回复会在每次状态变化时宣布回退转换和回退清除后的恢复。粘性回退轮次不会重复该通知。
- `/status` 会显示选定模型，并在回退状态不同时显示活动回退模型和原因。
- 实时会话协调优先使用持久化会话覆盖，而不是陈旧的运行时模型字段。
- 如果实时切换错误指向活动回退链中的较后候选，OpenClaw 会直接跳到该选定模型，而不是先遍历无关候选。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，并且只有当这些字段仍匹配该失败候选时才回滚。

这可以防止典型竞态：

<Steps>
  <Step title="Primary fails">
    选定的主模型失败。
  </Step>
  <Step title="Fallback chosen in memory">
    在内存中选择回退候选。
  </Step>
  <Step title="Session store still says old primary">
    会话存储仍反映旧主模型。
  </Step>
  <Step title="Live reconciliation reads stale state">
    实时会话协调读取陈旧会话状态。
  </Step>
  <Step title="Retry snapped back">
    在回退尝试开始前，重试被切回旧模型。
  </Step>
</Steps>

持久化回退覆盖会关闭这个窗口，而窄范围回滚会保持较新的手动或运行时会话变更完整。

## 可观测性和失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 尝试的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的故障转移原因）
- 可选状态/代码
- 人类可读的错误摘要

当候选失败、被跳过或后续回退成功时，结构化 `model_fallback_decision` 日志还会包含扁平的 `fallbackStep*` 字段。这些字段会明确记录尝试的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），这样日志和诊断导出器就能重建主模型失败，即使最终回退也失败。

当每个候选都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以用它构建更具体的消息，例如 “所有模型暂时都受到速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要具备模型感知能力：

- 与尝试的提供商/模型链无关的模型限定速率限制会被忽略
- 如果剩余阻塞是匹配的模型限定速率限制，OpenClaw 会报告仍阻塞该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/zh-CN/gateway/configuration)，了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和回退概览，请参阅 [Models](/zh-CN/concepts/models)。
