---
read_when:
    - 诊断凭证配置文件轮换、冷却时间或模型回退行为
    - 更新凭证配置文件或模型的故障转移规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换身份验证配置档案并在模型之间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-07-05T11:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分两个阶段处理故障：

1. 当前提供商内的**凭证配置轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

## 运行时流程

<Steps>
  <Step title="解析会话状态">
    解析当前活动会话模型和凭证配置偏好。
  </Step>
  <Step title="构建候选链">
    根据当前模型选择以及该选择来源的回退策略构建模型候选链。已配置默认值、cron 作业主模型以及自动选择的回退模型可以使用已配置的回退；显式用户会话选择是严格的。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置轮换/冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得故障转移的错误上推进">
    如果该提供商因值得故障转移的错误而耗尽，则移动到下一个模型候选。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选回退覆盖，让其他会话读取方看到运行器即将使用的同一提供商/模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失败时窄范围回滚">
    如果回退候选失败，仅在回退拥有的会话覆盖字段仍匹配该失败候选时回滚这些字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果每个候选都失败，则抛出包含每次尝试详情以及已知最早冷却到期时间的 `FallbackSummaryError`。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只持久化它为回退拥有的模型选择字段：`providerOverride`、`modelOverride`、`modelOverrideSource`、`authProfileOverride`、`authProfileOverrideSource`、`authProfileOverrideCompactionCount`。这样可以防止失败的回退重试覆盖较新的无关会话变更，例如在尝试运行期间发生的手动 `/model` 变更或会话轮换更新。

## 选择来源策略

选择来源控制是否允许回退链：

- **已配置默认值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **智能体主模型**：`agents.list[].model` 是严格的，除非该智能体的模型对象包含自己的 `fallbacks`。使用 `fallbacks: []` 可显式声明严格行为，或使用非空列表让该智能体选择加入模型回退。
- **自动回退覆盖**：运行时回退会在重试前写入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` 和所选源模型。此覆盖会继续沿着已配置的回退链前进，而不会在每条消息上探测主模型，但 OpenClaw 每 5 分钟（不可配置）探测一次已配置源模型，并在其恢复后清除覆盖。`/new`、`/reset` 和 `sessions.reset` 也会清除自动来源的覆盖。未显式设置 `heartbeat.model` 的 Heartbeat 运行会在其源模型不再匹配当前已配置默认值时清除直接自动覆盖。
- **用户会话覆盖**：`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会写入 `modelOverrideSource: "user"`。这是精确的会话选择。如果所选提供商/模型在生成回复前失败，OpenClaw 会报告失败，而不是从无关的已配置回退中回答。
- **旧版会话覆盖**：较旧的会话条目可能有 `modelOverride` 但没有 `modelOverrideSource`。OpenClaw 将其视为用户覆盖，因此显式旧选择不会被静默转换为回退行为。
- **Cron 载荷模型**：cron 作业 `payload.model` / `--model` 是作业主模型，不是用户会话覆盖。除非作业提供 `payload.fallbacks`，否则它使用已配置回退；`payload.fallbacks: []` 会让 cron 运行变为严格模式。

OpenClaw 会按会话和主模型记住最近的主模型探测，因此失败的主模型不会在每一轮都重试。当会话移动到回退时，它会发送一条可见通知；当会话返回所选主模型时，会发送另一条通知；它不会在每个粘性回退轮次重复通知。

## 凭证失败跳过缓存

默认情况下，每个新轮次会保留现有回退重试行为：OpenClaw 会再次重试每个已配置回退候选，包括最近因 `auth` 或 `auth_permanent` 失败的非主候选。

选择启用重复凭证失败抑制：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

启用后，OpenClaw 会在非主回退候选发生凭证类失败后记录一个内存中、会话作用域的跳过标记，键由会话 id、提供商和模型组成。主候选永远不会被跳过，因此显式用户模型选择仍会显露真实凭证错误。该缓存是进程本地的，并会在 Gateway 网关重启时清除。

该值是以毫秒为单位的 TTL。`0` 或未设置会禁用缓存。正值会被限制在 1 秒到 10 分钟之间。

## 用户可见的回退通知

当会话移动到自动选择的回退时，OpenClaw 会在同一回复界面发送状态通知：

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

当之后的探测成功且会话返回所选主模型时，OpenClaw 会发送：

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

这些通知是操作性消息，不是助手内容。只要可行，它们会在每次状态变化时投递一次，包括仅有副作用的轮次，但粘性回退轮次不会重复。投递会绕过常规来源回复抑制，不会占用线程式渠道的第一个助手回复槽，并且会从文本转语音和跟进承诺提取中排除。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置**。

- 密钥和运行时凭证路由状态位于 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- 配置 `auth.profiles` / `auth.order` 仅是**元数据 + 路由**（不含密钥）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到每智能体凭证存储）。
- 旧版 `auth-profiles.json`、`auth-state.json` 和每智能体 `auth.json` 文件会由 `openclaw doctor --fix` 导入。

更多详情：[OAuth](/zh-CN/concepts/oauth)

凭据类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包括 `projectId`/`enterpriseUrl`）
- `type: "token"` → 静态 bearer 风格令牌，可选过期时间；OpenClaw 不会刷新它（用于 `aws-sdk` 和其他凭据链凭证模式）

## 配置 ID

OAuth 登录会创建不同配置，以便多个账号可以共存。

- 默认：没有可用 email 时为 `provider:default`。
- 带 email 的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置位于每智能体 `openclaw-agent.sqlite` 凭证配置存储中。

## 轮换顺序

当提供商有多个配置时，OpenClaw 会按如下顺序选择：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置配置">
    按提供商过滤的 `auth.profiles`。
  </Step>
  <Step title="已存储配置">
    该提供商的每智能体 SQLite 凭证配置条目。
  </Step>
</Steps>

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：**配置类型（**OAuth，然后静态令牌，然后 API 密钥**）。
- **次键：**`usageStats.lastUsed`（每种类型内最旧的优先）。
- **冷却/禁用配置**会移到末尾，并按最早到期时间排序。

### 会话粘性（缓存友好）

OpenClaw 会**按会话固定所选凭证配置**，以保持提供商缓存预热。它**不会**在每个请求上轮换。固定配置会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 压缩完成（压缩计数递增）
- 配置处于冷却/禁用状态

通过 `/model …@<profileId>` 进行手动选择会为该会话设置**用户覆盖**，并且在新会话开始前不会自动轮换。

<Note>
自动固定配置（由会话路由器选择）会被视为一种**偏好**：它们会先尝试，但 OpenClaw 可能会在速率限制/超时时轮换到另一个配置。当原始配置再次可用时，新的运行可以再次偏好它，而无需更改所选模型或运行时。用户固定配置会锁定到该配置；如果它失败且已配置模型回退，OpenClaw 会移动到下一个模型，而不是切换配置。
</Note>

### OpenAI Codex 订阅加 API 密钥备份

对于 OpenAI 智能体模型，凭证和运行时是分离的。`openai/gpt-*` 保持在 Codex harness 上，而凭证可以在 Codex 订阅配置和 OpenAI API 密钥备份之间轮换。

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

对 ChatGPT/Codex OAuth 配置和 OpenAI API 密钥配置都使用 `openai:*`。当订阅触达 Codex 使用限制时，如果 Codex 提供确切重置时间，OpenClaw 会记录该时间，尝试下一个有序凭证配置，并让运行保持在 Codex harness 内。重置时间过去后，订阅配置会再次符合条件，下一次自动选择可以返回它。

只有当你想强制该会话使用某个账号/密钥时，才使用用户固定配置。用户固定配置有意保持严格，不会静默跳转到另一个配置。

## 冷却

当配置因凭证/速率限制错误（或看起来像速率限制的超时）而失败时，OpenClaw 会将其标记为冷却并移动到下一个配置。

<AccordionGroup>
  <Accordion title="进入速率限制 / 超时桶的内容">
    该速率限制桶比单纯的 `429` 更宽：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制，例如 `weekly limit reached` 或 `monthly limit exhausted`。

    格式/无效请求错误通常是终止性的，因为重试相同载荷会以相同方式失败，所以 OpenClaw 会显露这些错误，而不是轮换凭证配置。已知的重试修复路径可以显式选择加入：例如 Cloud Code Assist 工具调用 ID 校验失败会被清理并通过 `allowFormatRetry` 策略重试一次。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/故障转移信号。

    当来源匹配已知瞬时模式时，通用服务器文本也可以进入该超时桶。例如，裸模型运行时流包装器消息 `An unknown error occurred` 会被视为对每个提供商都值得故障转移，因为共享模型运行时会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体详情时发出它。包含瞬时服务器文本的 JSON `api_error` 载荷，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得故障转移的超时。

    OpenRouter 专用的通用上游文本，例如裸 `Provider returned error`，只有在提供商上下文确实是 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守，单独不会触发故障转移。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    否则，一些提供商 SDK 可能会先休眠一个很长的 `Retry-After` 窗口，才把控制权交还给 OpenClaw。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待限制为 60 秒，并立即暴露更长的可重试响应，以便这条故障转移路径可以运行。使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；参见[重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="按模型限定的冷却">
    速率限制冷却也可以按模型限定：

    - 当失败的模型 id 已知时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 当冷却限定到不同模型时，仍可以尝试同一提供商上的同级模型。
    - 账单/禁用窗口仍会跨模型阻止整个配置档。

  </Accordion>
</AccordionGroup>

常规（非账单、非永久凭证）冷却会随该配置档最近的错误计数扩展：

- 第 1 次失败：30 秒
- 第 2 次失败：1 分钟
- 第 3 次及以后失败：5 分钟（上限）

一旦配置档的失败窗口过去，计数器就会重置（`auth.cooldowns.failureWindowHours`，默认 24）。

状态存储在按智能体的 SQLite 凭证状态中的 `usageStats` 下：

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

账单/额度失败（例如 “insufficient credits” / “credit balance too low”）会被视为值得故障转移，但它们通常不是暂时性的。OpenClaw 不会使用短冷却，而是将该配置档标记为**禁用**（并使用更长的退避），然后轮换到下一个配置档/提供商。

<Note>
并非每个形似账单的响应都是 `402`，也并非每个 HTTP `402` 都会进入这里。即使提供商返回的是 `401` 或 `403`，OpenClaw 也会把明确的账单文本保留在账单通道中，但特定提供商的匹配器仍限定在拥有它们的提供商范围内（例如 OpenRouter `403 Key limit exceeded`）。

同时，临时的 `402` 使用窗口以及组织/工作区支出限制错误，会在消息看起来可重试时被归类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`，或 `organization spending limit exceeded`）。这些错误会留在短冷却/故障转移路径上，而不是进入较长的账单禁用路径。
</Note>

高置信度的永久凭证失败（已撤销/已停用的密钥、已停用的工作区）会进入类似的禁用通道，但由于一些提供商会在事故期间暂时暴露看起来像凭证问题的载荷，所以它们会比账单更快恢复。

状态存储在按智能体的 SQLite 凭证状态中：

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

默认值（`auth.cooldowns.*`）：

| 键                            | 默认值 | 用途                                                                        |
| ----------------------------- | ------ | --------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5      | 基础账单退避，每次账单失败后翻倍                                            |
| `billingMaxHours`             | 24     | 账单退避上限                                                                |
| `authPermanentBackoffMinutes` | 10     | 高置信度永久凭证失败的基础退避                                              |
| `authPermanentMaxMinutes`     | 60     | 该退避的上限                                                                |
| `failureWindowHours`          | 24     | 如果此窗口内没有发生失败，则重置失败计数器                                  |
| `overloadedProfileRotations`  | 1      | 过载时，在模型回退之前允许的同提供商配置档轮换次数                          |
| `overloadedBackoffMs`         | 0      | 过载轮换重试前的固定延迟                                                    |
| `rateLimitedProfileRotations` | 1      | 速率限制时，在模型回退之前允许的同提供商配置档轮换次数                      |

过载和速率限制错误会比账单冷却更积极地处理：默认情况下，OpenClaw 允许一次同提供商凭证配置档重试，然后无需等待就切换到下一个已配置的模型回退。

## 模型回退

如果某个提供商的所有配置档都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已经耗尽配置档轮换的凭证失败、速率限制和超时（其他错误不会推进回退）。没有暴露足够细节的提供商错误仍会在回退状态中被精确标记：`empty_response` 表示提供商没有返回可用消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，`unclassified` 表示 OpenClaw 保留了原始预览，但还没有分类器匹配到它。

`ModelNotReadyException` 等提供商繁忙信号会进入过载类别，并遵循与速率限制相同的一次轮换后回退策略（参见上面的默认值表）。

当一次运行从已配置的默认主模型、cron 任务主模型、带显式回退的智能体主模型，或自动选择的回退覆盖开始时，OpenClaw 可以遍历匹配的已配置回退链。没有显式回退的智能体主模型和显式用户选择（例如 `/model ollama/qwen3.5:27b`、模型选择器、`sessions.patch`，或一次性 CLI 提供商/模型覆盖）是严格的：如果该提供商/模型不可达，或在生成回复前失败，OpenClaw 会报告失败，而不是从不相关的回退中回答。

### 候选链规则

OpenClaw 会从当前请求的 `provider/model` 加上已配置的回退构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的回退会去重，但不会被模型允许列表过滤。它们会被视为显式的操作员意图。
    - 如果当前运行已经位于同一提供商系列中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
    - 当未提供显式回退覆盖时，即使请求的模型使用不同提供商，也会先尝试已配置的回退，再尝试已配置的主模型。
    - 当未向回退运行器提供显式回退覆盖时，已配置的主模型会追加到末尾，这样链条在前面的候选都耗尽后可以回到正常默认值。
    - 当调用方提供 `fallbacksOverride` 时，运行器会严格使用请求的模型加上该覆盖列表。空列表会禁用模型回退，并防止已配置的主模型作为隐藏重试目标被追加。

  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="继续于">
    - 凭证失败
    - 速率限制和冷却耗尽
    - 过载/提供商繁忙错误
    - 形似超时的故障转移错误
    - 账单禁用
    - `LiveSessionModelSwitchError`，它会被规范化为故障转移路径，避免陈旧的持久化模型创建外层重试循环
    - 当仍有剩余候选时的其他未识别错误

  </Tab>
  <Tab title="不继续于">
    - 非超时/故障转移形态的显式中止
    - 应该留在压缩/重试逻辑内部的上下文溢出错误（例如 `request_too_large`、`input token count exceeds the maximum number of input tokens`、`input exceeds the maximum number of tokens`、`input too long for the model`，或 `ollama error: context length exceeded`）
    - 没有候选剩余时的最终未知错误
    - Claude Fable 5 安全拒绝；直接 API 密钥请求会在提供商级别通过 Anthropic 的服务器端回退到 `claude-opus-4-8` 来处理这些问题（参见 [Anthropic](/zh-CN/providers/anthropic#safety-refusal-fallback-claude-fable-5)）

  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的每个凭证配置档都已处于冷却中时，OpenClaw 不会自动永远跳过该提供商。它会按候选做出决策：

<AccordionGroup>
  <Accordion title="按候选决策">
    - 持久凭证失败会立即跳过整个提供商。
    - 账单禁用通常会跳过，但主候选仍可以按节流探测，这样无需重启也可能恢复。
    - 主候选可以在接近冷却到期时按每提供商节流进行探测。
    - 当失败看起来是暂时性的（`rate_limit`、`overloaded` 或未知）时，即使处于冷却中，也可以尝试同提供商的回退同级项。当速率限制按模型限定且同级模型可能仍可立即恢复时，这一点尤其相关。
    - 暂时性冷却探测限制为每次回退运行中每个提供商一次，这样单个提供商不会阻塞跨提供商回退。

  </Accordion>
</AccordionGroup>

## 会话覆盖和实时模型切换

会话模型变更是共享状态。活动运行器、`/model` 命令、压缩/会话更新以及实时会话协调都会读取或写入同一会话条目的部分内容。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型变更才会标记待处理实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的模型变更，例如回退轮换、Heartbeat 覆盖或压缩，本身永远不会标记待处理实时切换。
- 用户驱动的模型覆盖会被视为回退策略的精确选择，因此不可达的已选提供商会暴露为失败，而不是被 `agents.defaults.model.fallbacks` 掩盖。
- 在回退重试开始之前，回复运行器会将选中的回退覆盖字段持久化到会话条目中。
- 自动回退覆盖会在后续轮次保持选中，这样 OpenClaw 不会在每条消息上探测已知有问题的主模型。OpenClaw 会定期再次探测已配置的来源，并在其恢复时清除自动覆盖；`/new`、`/reset` 和 `sessions.reset` 会立即清除自动来源的覆盖。
- 用户回复会在每次状态变更时宣布回退转换和已清除回退的恢复。粘性回退轮次不会重复通知。
- `/status` 会显示选中的模型，并且当回退状态不同时，显示活动回退模型和原因。
- 实时会话协调会优先使用已持久化的会话覆盖，而不是陈旧的运行时模型字段。
- 如果实时切换错误指向活动回退链中的后续候选，OpenClaw 会直接跳转到该选中模型，而不是先遍历不相关的候选。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，并且仅当这些字段仍匹配该失败候选时才回滚。

这可以防止经典竞态：

<Steps>
  <Step title="主模型失败">
    选中的主模型失败。
  </Step>
  <Step title="在内存中选择回退">
    回退候选在内存中被选中。
  </Step>
  <Step title="会话存储仍显示旧主模型">
    会话存储仍反映旧主模型。
  </Step>
  <Step title="实时协调读取陈旧状态">
    实时会话协调读取陈旧的会话状态。
  </Step>
  <Step title="重试被拉回">
    在回退尝试开始前，重试被拉回到旧模型。
  </Step>
</Steps>

持久化的回退覆盖关闭了这个窗口，而窄范围回滚会保持更新的手动或运行时会话变更不受影响。

## 可观测性和失败摘要

`runWithModelFallback(...)` 会记录每次尝试的细节，这些细节会进入日志和面向用户的冷却消息：

- 已尝试的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的故障转移原因）
- 可选状态/代码
- 人类可读的错误摘要

当候选项失败、被跳过或后续故障转移成功时，结构化的 `model_fallback_decision` 日志也会包含扁平的 `fallbackStep*` 字段。这些字段会明确已尝试的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），让日志和诊断导出器即使在最终故障转移也失败时，也能重建主要失败原因。

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以用它构建更具体的消息，例如“所有模型都暂时受到速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要会感知模型：

- 对于已尝试的提供商/模型链，会忽略无关的模型级速率限制
- 如果剩余阻塞是匹配的模型级速率限制，OpenClaw 会报告仍阻塞该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 配置](/zh-CN/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见 [Models](/zh-CN/concepts/models) 了解更广泛的模型选择和故障转移概览。
