---
read_when:
    - 诊断身份验证配置文件轮换、冷却或模型回退行为
    - 更新身份验证配置文件或模型的故障转移规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换身份验证配置文件并在不同模型之间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-07-11T20:28:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分两个阶段处理故障：

1. 在当前提供商内进行**身份验证配置文件轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

## 运行时流程

<Steps>
  <Step title="解析会话状态">
    解析当前会话模型和身份验证配置文件偏好。
  </Step>
  <Step title="构建候选链">
    根据当前模型选择以及该选择来源对应的回退策略，构建模型候选链。配置的默认模型、定时任务主模型和自动选择的回退模型可以使用已配置的回退；用户显式选择的会话模型则严格遵循该选择。
  </Step>
  <Step title="尝试当前提供商">
    按照身份验证配置文件轮换和冷却规则尝试当前提供商。
  </Step>
  <Step title="遇到应触发故障转移的错误时继续">
    如果该提供商的所有尝试均因应触发故障转移的错误而失败，则转到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选的回退覆盖，使其他会话读取方看到运行器即将使用的同一提供商和模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失败时进行有限回滚">
    如果回退候选项失败，仅当回退所拥有的会话覆盖字段仍与该失败候选项匹配时，才回滚这些字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果所有候选项均失败，则抛出 `FallbackSummaryError`，其中包含每次尝试的详细信息，并在已知时包含最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更严格地限定范围。回复运行器只持久化其为回退所拥有的模型选择字段：`providerOverride`、`modelOverride`、`modelOverrideSource`、`authProfileOverride`、`authProfileOverrideSource`、`authProfileOverrideCompactionCount`。这样可以防止失败的回退重试覆盖较新的无关会话变更，例如手动执行 `/model` 的更改，或尝试运行期间发生的会话轮换更新。

## 选择来源策略

选择来源决定是否允许使用回退链：

- **配置的默认模型**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **智能体主模型**：`agents.list[].model` 默认严格遵循该模型，除非该智能体的模型对象包含自己的 `fallbacks`。使用 `fallbacks: []` 可显式指定严格行为，使用非空列表则让该智能体启用模型回退。
- **自动回退覆盖**：运行时回退会在重试前写入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` 以及所选的来源模型。此覆盖会继续沿已配置的回退链向后尝试，而不会在每条消息上都探测主模型；但 OpenClaw 每 5 分钟探测一次配置的来源模型（不可配置），并在其恢复后清除覆盖。`/new`、`/reset` 和 `sessions.reset` 也会清除自动来源的覆盖。未显式设置 `heartbeat.model` 的 Heartbeat 运行会在其来源不再与当前配置的默认模型匹配时清除直接自动覆盖。
- **用户会话覆盖**：`/model`、模型选择器、`session_status(model=...)` 和 `sessions.patch` 会写入 `modelOverrideSource: "user"`。这是精确的会话模型选择。如果所选提供商或模型在生成回复前失败，OpenClaw 会报告该故障，而不会使用无关的已配置回退来作答。
- **旧版会话覆盖**：较旧的会话条目可能包含 `modelOverride`，但没有 `modelOverrideSource`。OpenClaw 会将其视为用户覆盖，以免显式的旧选择被静默转换为回退行为。
- **定时任务载荷模型**：定时任务的 `payload.model` / `--model` 是任务主模型，而不是用户会话覆盖。除非任务提供 `payload.fallbacks`，否则它会使用已配置的回退；`payload.fallbacks: []` 会让定时任务严格遵循主模型。

OpenClaw 会按会话和主模型记住最近的主模型探测，因此不会在每轮交互中反复重试失败的主模型。当会话转到回退模型时，它会发送一条可见通知；当会话返回所选主模型时，还会发送另一条通知。对于持续使用回退模型的每轮交互，它不会重复发送通知。

## 身份验证故障跳过缓存

默认情况下，每个新轮次都会保留现有的回退重试行为：OpenClaw 会再次尝试每个已配置的回退候选项，包括最近因 `auth` 或 `auth_permanent` 失败的非主候选项。

要选择启用重复身份验证故障抑制，请设置：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

启用后，当非主回退候选项发生身份验证类故障时，OpenClaw 会记录一个位于内存中且限定于会话范围的跳过标记，其键由会话 ID、提供商和模型组成。主候选项绝不会被跳过，因此显式的用户模型选择仍会显示真实的身份验证错误。该缓存仅限当前进程，并会在 Gateway 网关重启时清除。

该值是以毫秒为单位的 TTL。设为 `0` 或不设置会禁用缓存。正值会被限制在 1 秒至 10 分钟之间。

## 用户可见的回退通知

当会话转到自动选择的回退模型时，OpenClaw 会在同一回复界面中发送状态通知：

```text
↪️ 模型回退：<fallback>（已选择 <primary>；<reason>）
```

当后续探测成功且会话返回所选主模型时，OpenClaw 会发送：

```text
↪️ 模型回退已清除：<primary>（之前为 <fallback>）
```

这些通知是运行状态消息，而不是助手内容。每次状态变化时仅发送一次，包括在可行情况下仅产生副作用的轮次，但持续使用回退模型的轮次不会重复发送。通知投递会绕过常规的来源回复抑制机制，不会占用线程式渠道的第一个助手回复位置，并且不会用于文本转语音和跟进承诺提取。

## 身份验证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**身份验证配置文件**。

- 机密信息和运行时身份验证路由状态存储在 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` 中。
- 配置中的 `auth.profiles` / `auth.order` **仅包含元数据和路由信息**，不含机密信息。
- 仅用于旧版导入的 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入每个智能体的身份验证存储）。
- 旧版 `auth-profiles.json`、`auth-state.json` 和每个智能体的 `auth.json` 文件由 `openclaw doctor --fix` 导入。

更多详情：[OAuth](/zh-CN/concepts/oauth)

凭据类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分提供商还包含 `projectId`/`enterpriseUrl`）
- `type: "token"` → 静态承载令牌，可以选择设置过期时间；OpenClaw 不会刷新它（用于 `aws-sdk` 和其他凭据链身份验证模式）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账户共存。

- 默认值：没有可用电子邮件地址时使用 `provider:default`。
- 带电子邮件地址的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件位于每个智能体的 `openclaw-agent.sqlite` 身份验证配置文件存储中。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 按以下顺序选择：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置的配置文件">
    按提供商筛选后的 `auth.profiles`。
  </Step>
  <Step title="已存储的配置文件">
    该提供商在每个智能体的 SQLite 身份验证配置文件条目。
  </Step>
</Steps>

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主排序键：**配置文件类型（**依次为 OAuth、静态令牌、API 密钥**）。
- **次排序键：**`usageStats.lastUsed`（每种类型内最早使用的优先）。
- **处于冷却或禁用状态的配置文件**会移到末尾，并按最早到期时间排序。

### 会话粘性（有利于缓存）

OpenClaw 会**为每个会话固定所选的身份验证配置文件**，以保持提供商缓存处于热状态。它**不会**在每次请求时轮换。固定的配置文件会持续复用，直到：

- 会话被重置（`/new` / `/reset`）
- 完成一次压缩（压缩计数增加）
- 配置文件处于冷却或禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置**用户覆盖**，在新会话开始前不会自动轮换。

<Note>
由会话路由器选择并自动固定的配置文件会被视为一种**偏好**：OpenClaw 会优先尝试它们，但在遇到速率限制或超时时可能轮换到另一个配置文件。当原配置文件恢复可用后，新的运行可以再次优先使用它，而无需更改所选模型或运行时。用户固定的配置文件会继续锁定到该配置文件；如果它失败且已配置模型回退，OpenClaw 会转到下一个模型，而不是切换配置文件。
</Note>

### OpenAI Codex 订阅与 API 密钥备用方案

对于 OpenAI 智能体模型，身份验证与运行时相互独立。`openai/gpt-*` 会继续使用 Codex harness，而身份验证可以在 Codex 订阅配置文件和 OpenAI API 密钥备用配置文件之间轮换。

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

ChatGPT/Codex OAuth 配置文件和 OpenAI API 密钥配置文件都使用 `openai:*`。当订阅达到 Codex 使用限制时，如果 Codex 提供了确切的重置时间，OpenClaw 会记录该时间，尝试下一个按顺序排列的身份验证配置文件，并让本次运行继续留在 Codex harness 中。重置时间过后，订阅配置文件会再次符合使用条件，下一次自动选择即可返回该配置文件。

只有在你希望为该会话强制使用某个账户或密钥时，才应使用用户固定的配置文件。用户固定的配置文件有意采用严格行为，不会静默跳转到其他配置文件。

## 冷却

当配置文件因身份验证或速率限制错误而失败时（或发生看起来类似速率限制的超时），OpenClaw 会将其标记为冷却状态，并转到下一个配置文件。

<AccordionGroup>
  <Accordion title="哪些情况会归入速率限制或超时类别">
    该速率限制类别的范围比单纯的 `429` 更广：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及 `weekly limit reached` 或 `monthly limit exhausted` 等周期性使用窗口限制。

    格式或无效请求错误通常属于终止性错误，因为使用相同载荷重试仍会以相同方式失败，所以 OpenClaw 会直接显示这些错误，而不是轮换身份验证配置文件。已知的重试修复路径可以显式选择启用：例如，Cloud Code Assist 工具调用 ID 验证失败会先经过净化处理，再通过 `allowFormatRetry` 策略重试一次。与 OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时或故障转移信号。

    当来源匹配已知的暂时性模式时，通用服务器文本也可能归入该超时类别。例如，纯模型运行时的流封装器消息 `An unknown error occurred` 对所有提供商都被视为应触发故障转移，因为当提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体详细信息时，共享模型运行时会发出此消息。包含暂时性服务器文本的 JSON `api_error` 载荷，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为应触发故障转移的超时。

    仅当提供商上下文确实为 OpenRouter 时，OpenRouter 特有的通用上游文本（例如单独出现的 `Provider returned error`）才会被视为超时。通用内部回退文本（例如 `LLM request failed with an unknown error.`）会采用保守处理，本身不会触发故障转移。

  </Accordion>
  <Accordion title="SDK 重试等待上限">
    某些提供商 SDK 可能会在将控制权交还给 OpenClaw 之前，按较长的 `Retry-After` 时间窗口休眠。对于 Anthropic 和 OpenAI 等基于 Stainless 的 SDK，OpenClaw 默认将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间限制为 60 秒，并立即上报需要等待更长时间的可重试响应，以便执行此故障转移路径。可使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用此上限；请参阅[重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型范围的冷却">
    速率限制冷却也可以限定在模型范围内：

    - 当已知失败模型的 ID 时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
    - 如果冷却限定于其他模型，仍可尝试同一提供商的同级模型。
    - 计费/禁用时间窗口仍会跨模型阻止整个配置文件。

  </Accordion>
</AccordionGroup>

常规冷却（非计费、非永久身份验证失败）会根据配置文件近期的错误次数递增：

- 第 1 次失败：30 秒
- 第 2 次失败：1 分钟
- 第 3 次及之后的失败：5 分钟（上限）

配置文件的失败时间窗口过去后，计数器会重置（`auth.cooldowns.failureWindowHours`，默认为 24）。

状态存储在每个 Agent 的 SQLite 身份验证状态中的 `usageStats` 下：

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

计费/额度失败（例如“额度不足”/“额度余额过低”）会被视为需要故障转移，但通常并非暂时性故障。OpenClaw 不会设置短暂冷却，而是将该配置文件标记为**已禁用**（采用更长的退避时间），并轮换到下一个配置文件/提供商。

<Note>
并非所有计费类响应都是 `402`，也并非所有 HTTP `402` 都会归入此类别。即使提供商返回的是 `401` 或 `403`，OpenClaw 仍会将明确的计费文本归入计费处理路径，但提供商特定的匹配器仍仅适用于其所属提供商（例如 OpenRouter 的 `403 Key limit exceeded`）。

与此同时，如果消息表现为可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），临时的 `402` 用量窗口错误以及组织/工作区支出上限错误会被分类为 `rate_limit`。这些错误会继续使用短冷却/故障转移路径，而不是较长的计费禁用路径。
</Note>

高置信度的永久身份验证失败（密钥被撤销/停用、工作区被停用）会进入类似的禁用处理路径，但由于某些提供商在事故期间可能暂时返回看似身份验证失败的载荷，其恢复等待时间远短于计费失败。

状态存储在每个 Agent 的 SQLite 身份验证状态中：

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

| 键                            | 默认值 | 用途                                                                  |
| ----------------------------- | ------- | --------------------------------------------------------------------- |
| `billingBackoffHours`         | 5       | 计费退避的基础时长，每次计费失败后翻倍                                |
| `billingMaxHours`             | 24      | 计费退避时长上限                                                      |
| `authPermanentBackoffMinutes` | 10      | 高置信度永久身份验证失败的基础退避时长                                |
| `authPermanentMaxMinutes`     | 60      | 该退避时长的上限                                                      |
| `failureWindowHours`          | 24      | 如果在此时间窗口内未发生失败，则重置失败计数器                         |
| `overloadedProfileRotations`  | 1       | 过载时，在回退模型之前允许进行的同提供商配置文件轮换次数               |
| `overloadedBackoffMs`         | 0       | 过载轮换重试前的固定延迟                                               |
| `rateLimitedProfileRotations` | 1       | 速率受限时，在回退模型之前允许进行的同提供商配置文件轮换次数           |

过载和速率限制错误的处理比计费冷却更积极：默认情况下，OpenClaw 允许重试一次同提供商的身份验证配置文件，然后无需等待便切换到下一个已配置的回退模型。

## 模型回退

如果某个提供商的所有配置文件都失败，OpenClaw 会转到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于身份验证失败、速率限制，以及配置文件轮换耗尽后的超时（其他错误不会推进回退）。对于未提供足够详细信息的提供商错误，回退状态仍会使用精确标签：`empty_response` 表示提供商未返回可用的消息或状态，`no_error_details` 表示提供商明确返回了 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始预览，但尚无分类器与之匹配。

`ModelNotReadyException` 等提供商繁忙信号会归入过载类别，并采用与速率限制相同的“轮换一次后回退”策略（请参阅上方的默认值表）。

当一次运行从已配置的默认主模型、cron 作业主模型、具有显式回退项的 Agent 主模型，或自动选择的回退覆盖项开始时，OpenClaw 可以遍历匹配的已配置回退链。没有显式回退项的 Agent 主模型和用户显式选择（例如 `/model ollama/qwen3.5:27b`、模型选择器、`sessions.patch` 或一次性 CLI 提供商/模型覆盖项）采用严格策略：如果该提供商/模型不可达，或在生成回复前失败，OpenClaw 会报告失败，而不会使用无关的回退模型作答。

### 候选链规则

OpenClaw 根据当前请求的 `provider/model` 和已配置的回退项构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在首位。
    - 显式配置的回退项会去重，但不会按模型允许列表过滤。它们被视为操作员的显式意图。
    - 如果当前运行已位于同一提供商系列中某个已配置的回退模型上，OpenClaw 会继续使用完整的已配置回退链。
    - 如果未提供显式回退覆盖项，即使请求的模型使用其他提供商，也会先尝试已配置的回退项，再尝试已配置的主模型。
    - 如果未向回退运行器提供显式回退覆盖项，已配置的主模型会追加到末尾，以便在前面的候选项均耗尽后，回退链能够重新落到常规默认模型上。
    - 当调用方提供 `fallbacksOverride` 时，运行器只使用请求的模型及该覆盖列表。空列表会禁用模型回退，并防止将已配置的主模型作为隐藏重试目标追加到列表中。

  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="以下情况会继续">
    - 身份验证失败
    - 速率限制和冷却耗尽
    - 过载/提供商繁忙错误
    - 超时类故障转移错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被规范化为故障转移路径，避免已持久化的过期模型引发外层重试循环
    - 仍有剩余候选项时出现的其他未识别错误

  </Tab>
  <Tab title="以下情况不会继续">
    - 不属于超时/故障转移类型的显式中止
    - 应保留在压缩/重试逻辑中的上下文溢出错误（例如 `request_too_large`、`input token count exceeds the maximum number of input tokens`、`input exceeds the maximum number of tokens`、`input too long for the model` 或 `ollama error: context length exceeded`）
    - 没有剩余候选项时的最终未知错误
    - Claude Fable 5 的安全拒绝；使用 API 密钥的直接请求会在提供商层面通过 Anthropic 服务端回退到 `claude-opus-4-8` 来处理此类情况（请参阅 [Anthropic](/zh-CN/providers/anthropic#safety-refusal-fallback-claude-fable-5)）

  </Tab>
</Tabs>

### 跳过冷却与探测行为

当某个提供商的所有身份验证配置文件均已处于冷却状态时，OpenClaw 不会自动永久跳过该提供商，而是针对每个候选项作出判断：

<AccordionGroup>
  <Accordion title="针对每个候选项的决策">
    - 持久性身份验证失败会立即跳过整个提供商。
    - 计费禁用通常会导致跳过，但仍可按节流频率探测主候选项，以便无需重启即可恢复。
    - 可以在接近冷却到期时探测主候选项，并按提供商进行节流。
    - 如果失败看起来是暂时性的（`rate_limit`、`overloaded` 或未知），即使处于冷却状态，也可以尝试同提供商的同级回退模型。当速率限制限定于模型范围，而同级模型可能立即恢复时，这一点尤其重要。
    - 每次回退运行中，每个提供商最多进行一次暂时性冷却探测，以免单个提供商拖延跨提供商回退。

  </Accordion>
</AccordionGroup>

## 会话覆盖项与实时模型切换

会话模型变更属于共享状态。活动运行器、`/model` 命令、压缩/会话更新和实时会话协调都会读取或写入同一会话条目的不同部分。

因此，回退重试必须与实时模型切换协调：

- 只有由用户显式触发的模型变更才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型变更（例如回退轮换、Heartbeat 覆盖或压缩）绝不会自行标记待处理的实时切换。
- 在回退策略中，用户驱动的模型覆盖项会被视为精确选择，因此不可达的选定提供商会直接显示为失败，而不会被 `agents.defaults.model.fallbacks` 掩盖。
- 在回退重试开始前，回复运行器会将选定的回退覆盖字段持久化到会话条目。
- 自动回退覆盖项会在后续轮次中保持选中，避免 OpenClaw 在每条消息上都探测已知存在问题的主模型。OpenClaw 会定期重新探测已配置的原始模型，并在其恢复后清除自动覆盖项；`/new`、`/reset` 和 `sessions.reset` 会立即清除自动生成的覆盖项。
- 每次状态变更时，用户回复会通知一次回退转换以及回退清除后的恢复。持续使用回退模型的轮次不会重复该通知。
- `/status` 会显示选定的模型；当回退状态不同时，还会显示当前回退模型及原因。
- 实时会话协调优先采用已持久化的会话覆盖项，而不是过期的运行时模型字段。
- 如果实时切换错误指向当前回退链中靠后的候选项，OpenClaw 会直接跳转到该选定模型，而不是先遍历无关候选项。
- 如果回退尝试失败，运行器只会回滚由其写入的覆盖字段，并且仅当这些字段仍与失败的候选项匹配时才会回滚。

这可以防止以下典型竞态：

<Steps>
  <Step title="主模型失败">
    选定的主模型失败。
  </Step>
  <Step title="在内存中选择回退模型">
    在内存中选择回退候选项。
  </Step>
  <Step title="会话存储中仍是旧主模型">
    会话存储中仍记录着旧主模型。
  </Step>
  <Step title="实时协调读取过期状态">
    实时会话协调读取了过期的会话状态。
  </Step>
  <Step title="重试被切回旧模型">
    在回退尝试开始前，重试被强制切回旧模型。
  </Step>
</Steps>

持久化的回退覆盖项消除了这一时间窗口，而精确范围的回滚可确保较新的手动或运行时会话变更保持不变。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于生成日志和面向用户的冷却提示：

- 尝试过的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 及类似的故障转移原因）
- 可选的状态/代码
- 人类可读的错误摘要

当候选项失败、被跳过或后续故障转移成功时，结构化的 `model_fallback_decision` 日志还会包含扁平的 `fallbackStep*` 字段。这些字段明确记录尝试过的转换（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），使日志和诊断导出器即使在最终故障转移也失败时，仍能还原主要故障。

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以据此构建更具体的消息，例如“所有模型目前都受到速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要会感知模型：

- 对于尝试过的提供商/模型链，会忽略不相关的模型范围速率限制
- 如果剩余阻止条件是匹配的模型范围速率限制，OpenClaw 会报告仍阻止该模型的最后一个匹配到期时间

## 相关配置

有关以下配置，请参阅 [Gateway 配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更全面的模型选择和故障转移概览，请参阅 [Models](/zh-CN/concepts/models)。
