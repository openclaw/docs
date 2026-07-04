---
read_when:
    - 诊断凭证配置档案轮换、冷却时间或模型回退行为
    - 更新凭证配置文件或模型的故障转移规则
    - 理解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换凭证配置档案并在模型之间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-07-04T15:07:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分两个阶段处理故障：

1. 当前提供商内的**凭证配置档轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文档说明运行时规则以及支撑这些规则的数据。

## 运行时流程

对于普通文本运行，OpenClaw 按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析活跃会话模型和凭证配置档偏好。
  </Step>
  <Step title="构建候选链">
    根据当前模型选择以及该选择来源的回退策略构建模型候选链。已配置的默认值、cron 作业主模型和自动选择的回退模型可以使用已配置的回退；显式用户会话选择是严格的。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置档轮换/冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得故障转移的错误上前进">
    如果该提供商因值得故障转移的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化选中的回退覆盖，以便其他会话读取者看到运行器即将使用的同一提供商/模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失败时窄范围回滚">
    如果回退候选项失败，仅在这些字段仍匹配该失败候选项时回滚由回退拥有的会话覆盖字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出包含每次尝试详情的 `FallbackSummaryError`，并在已知时包含最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只持久化它为回退拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这可以防止失败的回退重试覆盖更新的无关会话变更，例如尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 选择来源策略

OpenClaw 会区分选中的提供商/模型以及它被选中的原因。该来源控制是否允许回退链：

- **已配置默认值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **智能体主模型**：`agents.list[].model` 是严格的，除非该智能体模型对象包含自己的 `fallbacks`。使用 `fallbacks: []` 可显式声明严格行为，或提供非空列表让该智能体选择加入模型回退。
- **自动回退覆盖**：运行时回退会在重试前写入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` 和选中的来源模型。该自动覆盖可以持续沿已配置的回退链前进，而无需在每条消息上探测主模型，但 OpenClaw 会定期再次探测已配置的来源，并在其恢复时清除自动覆盖。`/new`、`/reset` 和 `sessions.reset` 也会清除自动来源的覆盖。没有显式 `heartbeat.model` 的 Heartbeat 运行会在其来源不再匹配当前已配置默认值时清除直接自动覆盖。
- **用户会话覆盖**：`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会写入 `modelOverrideSource: "user"`。这是精确的会话选择。如果选中的提供商/模型在生成回复前失败，OpenClaw 会报告失败，而不是从无关的已配置回退中作答。
- **旧版会话覆盖**：较旧的会话条目可能有 `modelOverride` 但没有 `modelOverrideSource`。OpenClaw 会将这些视为用户覆盖，因此显式的旧选择不会被静默转换为回退行为。
- **Cron 载荷模型**：cron 作业的 `payload.model` / `--model` 是作业主模型，而不是用户会话覆盖。除非作业提供 `payload.fallbacks`，否则它会使用已配置的回退；`payload.fallbacks: []` 会让 cron 运行保持严格。

自动回退主模型探测间隔为五分钟，且不可配置。OpenClaw 会按会话和主模型记住近期探测，因此失败的主模型不会在每个轮次都重试。当会话移动到回退时，OpenClaw 会发送一条可见通知；当会话返回选中的主模型时，会发送另一条通知；它不会在每个粘性回退轮次重复通知。

## 凭证失败跳过缓存

默认情况下，每个新轮次都会保留现有回退重试行为：OpenClaw
会再次尝试每个已配置的回退候选项，包括最近因 `auth` 或 `auth_permanent`
失败的非主候选项。

偏好抑制这些重复凭证失败的操作员可以通过以下方式选择启用：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

启用后，OpenClaw 会在非主回退候选项发生凭证类别失败后，记录一个内存中的、会话范围的跳过标记。该标记按会话 ID、提供商和模型作为键。主候选项永远不会被跳过，因此显式用户模型选择仍会暴露真实的凭证错误。该缓存是进程本地的，并会在 Gateway 网关重启时清除。

该值是以毫秒为单位的 TTL。`0` 或未设置会禁用缓存。正值会被限制在 1 秒到 10 分钟之间。

## 用户可见的回退通知

当会话移动到自动选择的回退时，OpenClaw 会在同一回复表面发送状态通知：

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

当后续探测成功且会话返回选中的主模型时，OpenClaw 会发送：

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

这些通知是操作消息，不是助手内容。它们会在每次状态变更时发送一次，包括可行时的仅副作用轮次，但粘性回退轮次不会重复发送。递送会绕过普通来源回复抑制，该通知不会占用线程式渠道的第一个助手回复槽位，并且会从文本转语音和跟进承诺提取中排除。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置档**。

- 密钥和运行时凭证路由状态位于 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- 配置 `auth.profiles` / `auth.order` 只是**元数据 + 路由**（不含密钥）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到按智能体划分的凭证存储）。
- 旧版 `auth-profiles.json`、`auth-state.json` 和按智能体划分的 `auth.json` 文件由 `openclaw doctor --fix` 导入。

更多详情：[OAuth](/zh-CN/concepts/oauth)

凭据类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分提供商还包括 `projectId`/`enterpriseUrl`）

## 配置档 ID

OAuth 登录会创建不同的配置档，因此多个账号可以共存。

- 默认：没有可用邮箱时为 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置档位于按智能体划分的 `openclaw-agent.sqlite` 凭证配置档存储中。

## 轮换顺序

当一个提供商有多个配置档时，OpenClaw 会按如下方式选择顺序：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置配置档">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="已存储配置档">
    该提供商的按智能体划分 SQLite 凭证配置档条目。
  </Step>
</Steps>

如果没有配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：**配置档类型（**OAuth 先于 API 密钥**）。
- **次键：**`usageStats.lastUsed`（每种类型内最旧优先）。
- **冷却/禁用配置档**会被移到末尾，按最早到期时间排序。

### 会话粘性（缓存友好）

OpenClaw 会**按会话固定选中的凭证配置档**，以保持提供商缓存预热。它**不会**在每个请求上轮换。固定的配置档会被复用，直到：

- 会话被重置（`/new` / `/reset`）
- 压缩完成（压缩计数增加）
- 配置档处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖**，并且在新会话开始前不会自动轮换。

<Note>
自动固定的配置档（由会话路由器选中）会被视为一种**偏好**：它们会先被尝试，但 OpenClaw 可能会在速率限制/超时时轮换到另一个配置档。当原配置档再次可用时，新的运行可以再次偏好它，而无需更改选中的模型或运行时。用户固定的配置档会锁定到该配置档；如果它失败且配置了模型回退，OpenClaw 会移动到下一个模型，而不是切换配置档。
</Note>

### OpenAI Codex 订阅加 API 密钥备份

对于 OpenAI 智能体模型，凭证和运行时是分离的。`openai/gpt-*` 保持在
Codex harness 上，而凭证可以在 Codex 订阅配置档和
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

对 ChatGPT/Codex OAuth 配置档和 OpenAI API 密钥
配置档都使用 `openai:*`。当订阅触及 Codex 用量限制时，
OpenClaw 会在 Codex 提供精确重置时间时记录该时间，尝试下一个
有序凭证配置档，并让运行保持在 Codex harness 内。重置
时间经过后，订阅配置档会再次符合条件，下一次自动
选择可以返回它。

仅当你想为该会话强制使用某一个账号/密钥时，才使用用户固定的配置档。用户固定的配置档有意保持严格，不会静默跳转到另一个配置档。

## 冷却

当配置档因凭证/速率限制错误（或看起来像速率限制的超时）失败时，OpenClaw 会将其标记为冷却并移动到下一个配置档。

<AccordionGroup>
  <Accordion title="哪些内容会落入速率限制 / 超时桶">
    该速率限制桶比单纯的 `429` 更宽：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly/monthly limit reached`。

    格式/无效请求错误通常是终止性的，因为重试同一载荷会以相同方式失败，所以 OpenClaw 会暴露这些错误，而不是轮换凭证配置档。已知的重试修复路径可以显式选择启用：例如 Cloud Code Assist 工具调用 ID 验证失败会被清理，并通过 `allowFormatRetry` 策略重试一次。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/故障转移信号。

    当来源匹配已知瞬态模式时，通用服务器文本也可能落入该超时桶。例如，裸模型运行时流包装器消息 `An unknown error occurred` 会被视为对每个提供商都值得故障转移，因为共享模型运行时会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体详情时发出它。带有瞬态服务器文本的 JSON `api_error` 载荷，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得故障转移的超时。

    OpenRouter 特定的通用上游文本，例如裸 `Provider returned error`，仅在提供商上下文实际为 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守，其本身不会触发故障转移。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    一些 provider SDK 可能会先休眠很长的 `Retry-After` 窗口，然后才把控制权交还给 OpenClaw。对于 Anthropic 和 OpenAI 等基于 Stainless 的 SDK，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待上限设为 60 秒，并立即暴露更长的可重试响应，以便这条故障转移路径可以运行。使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；参见[重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域的冷却">
    速率限制冷却也可以限定在模型作用域内：

    - 当已知失败模型 id 时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 当冷却限定到另一个模型时，仍可尝试同一 provider 上的兄弟模型。
    - 计费/禁用窗口仍会跨模型阻止整个 profile。

  </Accordion>
</AccordionGroup>

冷却使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在每个 Agent 的 SQLite 凭证状态中的 `usageStats` 下：

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

计费/额度失败（例如 "insufficient credits" / "credit balance too low"）会被视为值得故障转移，但它们通常不是暂时性的。OpenClaw 不会使用短冷却，而是将 profile 标记为**禁用**（使用更长的退避），并轮换到下一个 profile/provider。

<Note>
并非每个计费形态的响应都是 `402`，也并非每个 HTTP `402` 都会进入这里。即使 provider 返回的是 `401` 或 `403`，OpenClaw 也会将明确的计费文本保留在计费路径中，但特定于 provider 的匹配器仍限定在拥有它们的 provider 内（例如 OpenRouter `403 Key limit exceeded`）。

与此同时，临时的 `402` 使用窗口和组织/工作区消费上限错误，在消息看起来可重试时会被归类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。这些会留在短冷却/故障转移路径上，而不是进入较长的计费禁用路径。
</Note>

状态存储在每个 Agent 的 SQLite 凭证状态中：

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

- 计费退避从 **5 小时**开始，每次计费失败后翻倍，上限为 **24 小时**。
- 如果 profile 已经 **24 小时**没有失败，退避计数器会重置（可配置）。
- 过载重试在模型 fallback 前允许 **1 次同 provider profile 轮换**。
- 过载重试默认使用 **0 ms 退避**。

## 模型 fallback

如果某个 provider 的所有 profile 都失败，OpenClaw 会移至 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于凭证失败、速率限制，以及耗尽 profile 轮换的超时（其他错误不会推进 fallback）。未暴露足够细节的 provider 错误仍会在 fallback 状态中被精确标记：`empty_response` 表示 provider 没有返回可用消息或状态，`no_error_details` 表示 provider 明确返回了 `Unknown error (no error details in response)`，`unclassified` 表示 OpenClaw 保留了原始预览，但尚无分类器匹配它。

过载和速率限制错误会比计费冷却更激进地处理。默认情况下，OpenClaw 允许一次同 provider 凭证 profile 重试，然后不等待就切换到下一个已配置的模型 fallback。`ModelNotReadyException` 等 provider 忙碌信号会进入该过载类别。使用 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 调整此行为。

当一次运行从已配置的默认 primary、cron job primary、带显式 fallback 的 Agent primary，或自动选择的 fallback 覆盖开始时，OpenClaw 可以沿着匹配的已配置 fallback 链前进。没有显式 fallback 的 Agent primary 以及显式用户选择（例如 `/model ollama/qwen3.5:27b`、模型选择器、`sessions.patch` 或一次性的 CLI provider/model 覆盖）是严格的：如果该 provider/model 无法访问或在生成回复前失败，OpenClaw 会报告失败，而不是从无关的 fallback 回答。

### 候选链规则

OpenClaw 根据当前请求的 `provider/model` 加上已配置的 fallback 构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的 fallback 会去重，但不会按模型 allowlist 过滤。它们被视为显式的操作者意图。
    - 如果当前运行已经位于同一 provider 系列中的已配置 fallback 上，OpenClaw 会继续使用完整的已配置链。
    - 当未提供显式 fallback 覆盖时，即使请求的模型使用不同 provider，也会先尝试已配置的 fallback，再尝试已配置的 primary。
    - 当未向 fallback runner 提供显式 fallback 覆盖时，已配置的 primary 会追加到末尾，使链条在前面的候选都耗尽后可以回到正常默认值。
    - 当调用方提供 `fallbacksOverride` 时，runner 会精确使用请求的模型加上该覆盖列表。空列表会禁用模型 fallback，并阻止已配置的 primary 作为隐藏重试目标被追加。

  </Accordion>
</AccordionGroup>

### 哪些错误会推进 fallback

<Tabs>
  <Tab title="继续于">
    - 凭证失败
    - 速率限制和冷却耗尽
    - 过载/provider 忙碌错误
    - 超时形态的故障转移错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被规范化为故障转移路径，避免陈旧的持久化模型创建外层重试循环
    - 当仍有剩余候选时，其他未识别错误

  </Tab>
  <Tab title="不继续于">
    - 非超时/故障转移形态的显式中止
    - 应停留在压缩/重试逻辑内部的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 没有候选剩余时的最终未知错误
    - Claude Fable 5 安全拒绝；直接 API key 请求会改为在 provider 层通过 Anthropic 的服务器端 fallback 到 `claude-opus-4-8` 来处理这些情况（参见 [Anthropic](/zh-CN/providers/anthropic#safety-refusal-fallback-claude-fable-5)）

  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个 provider 的每个凭证 profile 都已经处于冷却中时，OpenClaw 不会自动永远跳过该 provider。它会按候选做出决策：

<AccordionGroup>
  <Accordion title="按候选决策">
    - 持久性凭证失败会立即跳过整个 provider。
    - 计费禁用通常会跳过，但 primary 候选仍可在节流下被探测，以便无需重启即可恢复。
    - primary 候选可在冷却临近到期时被探测，并按 provider 节流。
    - 当失败看起来是暂时性的（`rate_limit`、`overloaded` 或未知）时，即使存在冷却，也可尝试同 provider fallback 兄弟项。当速率限制限定在模型作用域且兄弟模型可能立即恢复时，这一点尤其相关。
    - 暂时性冷却探测在每个 fallback 运行中每个 provider 仅限一次，避免单个 provider 阻塞跨 provider fallback。

  </Accordion>
</AccordionGroup>

## 会话覆盖和实时模型切换

会话模型变更是共享状态。活动 runner、`/model` 命令、压缩/会话更新和实时会话协调都会读取或写入同一个会话条目的部分内容。

这意味着 fallback 重试必须与实时模型切换协调：

- 只有显式用户驱动的模型变更才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- fallback 轮换、heartbeat 覆盖或压缩等系统驱动的模型变更不会自行标记待处理的实时切换。
- 用户驱动的模型覆盖会被 fallback 策略视为精确选择，因此无法访问的已选 provider 会作为失败暴露，而不是被 `agents.defaults.model.fallbacks` 掩盖。
- fallback 重试开始前，reply runner 会将已选 fallback 覆盖字段持久化到会话条目。
- 自动 fallback 覆盖会在后续轮次保持选中，因此 OpenClaw 不会在每条消息上探测已知异常的 primary。OpenClaw 会定期再次探测已配置的 origin，并在其恢复时清除自动覆盖；`/new`、`/reset` 和 `sessions.reset` 会立即清除自动来源的覆盖。
- 用户回复会在每次状态变化时宣布 fallback 转换和 fallback 已清除的恢复。粘性 fallback 轮次不会重复提示。
- `/status` 会显示已选模型；当 fallback 状态不同时，还会显示活动 fallback 模型和原因。
- 实时会话协调会优先使用持久化的会话覆盖，而不是陈旧的运行时模型字段。
- 如果实时切换错误指向活动 fallback 链中的后续候选，OpenClaw 会直接跳转到该选中模型，而不是先遍历无关候选。
- 如果 fallback 尝试失败，runner 只会回滚它写入的覆盖字段，并且仅在这些字段仍匹配该失败候选时回滚。

这可以防止经典竞态：

<Steps>
  <Step title="Primary 失败">
    已选 primary 模型失败。
  </Step>
  <Step title="在内存中选择 fallback">
    在内存中选择 fallback 候选。
  </Step>
  <Step title="会话存储仍显示旧 primary">
    会话存储仍反映旧 primary。
  </Step>
  <Step title="实时协调读取陈旧状态">
    实时会话协调读取陈旧的会话状态。
  </Step>
  <Step title="重试被拉回">
    在 fallback 尝试开始前，重试被拉回旧模型。
  </Step>
</Steps>

持久化的 fallback 覆盖会关闭这个窗口，窄范围回滚则会保持较新的手动或运行时会话变更不受影响。

## 可观测性和失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 尝试的 provider/model
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 和类似的故障转移原因）
- 可选状态/code
- 人类可读的错误摘要

结构化 `model_fallback_decision` 日志在候选失败、被跳过或后续 fallback 成功时，也会包含扁平的 `fallbackStep*` 字段。这些字段会明确尝试过的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），使日志和诊断导出器即使在最终 fallback 也失败时，也能重建 primary 失败。

当每个候选都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层 reply runner 可以用它构建更具体的消息，例如 “所有模型暂时都受到速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要具备模型感知能力：

- 对尝试的 provider/model 链无关的模型作用域速率限制会被忽略
- 如果剩余阻塞是匹配的模型作用域速率限制，OpenClaw 会报告仍阻塞该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/zh-CN/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和 fallback 概览，请参阅 [Models](/zh-CN/concepts/models)。
