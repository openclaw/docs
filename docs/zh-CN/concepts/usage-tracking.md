---
read_when:
    - 你正在接入提供商用量/配额界面
    - 你需要说明用量跟踪行为或身份验证要求
summary: 用量跟踪入口和凭证要求
title: 使用情况跟踪
x-i18n:
    generated_at: "2026-07-06T21:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e50a48efec908acacf3b9fa31113a4a56553ae07c806d04e4b20aa7bf88b0b5
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什么

- 直接从每个提供商的用量端点拉取提供商用量/配额。不估算提供商计费；只使用提供商报告的方案名称、配额窗口、余额、支出、预算、每日成本历史、token/模型归因或账号状态摘要。
- 人类可读的配额窗口输出会归一化为 `X% left`，即使提供商报告的是已消耗配额、剩余配额，或仅报告原始计数。没有可重置配额窗口的提供商会改为显示提供商摘要文本（例如余额）。
- 会话级 `/status` 和 `session_status` 工具会在实时会话快照缺少 token/模型数据时回退到该会话的转录日志。该回退会填补缺失的 token/缓存计数器，可以恢复活跃运行时模型标签，并在会话元数据缺失或更小（`totalTokensFresh !== true`、为零，或低于从转录推导的值）时优先使用更大的面向提示词的总数。非零实时值始终优先于回退值。

## 显示位置

- 聊天中的 `/status`：状态卡片，包含会话 token 和预估成本（仅 API key 模型）。提供商用量会在可用时针对**当前模型提供商**显示，形式为归一化的 `X% left` 窗口或提供商摘要文本。
- 聊天中的 `/usage off|tokens|full`：每次响应的用量页脚。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合的本地成本摘要。
- CLI：`openclaw status --usage` 打印完整的逐提供商用量/配额明细。
- CLI：`openclaw models status` 列出 OAuth/token 凭证配置文件，并在每个有用量窗口的提供商旁显示用量窗口摘要。
- Control UI：**用量** 在 OpenClaw 从会话推导的 token 和预估成本分析上方显示提供商方案与计费卡片。Anthropic 和 OpenAI Admin API 凭证会添加提供商报告的今日、7 日和 30 日支出、每日趋势、token 总量、热门模型和成本类别。
- macOS 菜单栏：当提供商用量快照可用时，根级“用量”部分会显示在上下文下方。参见[菜单栏](/zh-CN/platforms/mac/menu-bar)。

`openclaw channels list` 不再打印提供商用量；它会改为指引用户使用 `openclaw status` 或 `openclaw models list`。

## Anthropic 和 OpenAI 成本历史

订阅配额和 API 计费是不同的提供商表面：

- Anthropic 订阅/设置凭证继续显示 Claude 配额窗口和可选的额外用量预算。设置 `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 可改为显示组织 Usage and Cost API 历史。以 `sk-ant-admin` 开头的 Anthropic 提供商凭证会被自动检测。
- OpenAI ChatGPT/Codex OAuth 继续显示方案、配额窗口和信用余额。设置 `OPENAI_ADMIN_KEY` 可改为显示组织成本和 completions 用量历史；也可设置 `OPENAI_PROJECT_ID` 将范围限定到一个项目。OpenClaw 绝不会把来自 `OPENAI_API_KEY`、提供商配置或凭证配置文件的推理凭证发送到组织 API，因为这些 key 可能属于自定义端点。

Admin 凭证优先，因为它们提供实际的组织计费。OpenClaw 不会把这些提供商报告的总数与本地会话估算合并；这两个部分有意回答不同问题。

## 默认用量页脚模式

`/usage off|tokens|full` 为一个会话设置页脚，并会为该会话记住该设置。`messages.responseUsage` 会为尚未选择模式的会话提供初始模式，因此无需每次输入 `/usage` 就能默认开启页脚。

为每个渠道设置一个模式，或设置带有 `default` 回退的按渠道映射：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

接受的值：`"off"`、`"tokens"`、`"full"`，以及旧版别名 `"on"`（按 `"tokens"` 处理）。

### 三种不同的会话状态

会话的 `responseUsage` 字段有三种可表示状态，每种语义不同：

| 状态                 | 存储值                         | 生效模式                                                              |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未设置 / 继承**    | `undefined`（不存在）            | 依次回退到 `messages.responseUsage` 配置默认值，然后是 `off`。        |
| **显式关闭**         | `"off"`（已存储）               | 始终关闭，非 off 的配置默认值不能重新启用页脚。                       |
| **显式开启**         | `"tokens"` 或 `"full"`（已存储） | 使用该模式，不受配置默认值影响。                                      |

### 优先级

生效模式 = 会话覆盖 → 渠道配置条目 → `default` → `off`。

显式 `/usage off` 会作为字面值 `"off"` **持久化**到会话中，和“未设置”不同。用户显式禁用后，非 off 的 `messages.responseUsage` 默认值不能再把页脚重新打开。

### 重置与关闭

- `/usage off` 强制关闭页脚并持久化该选择。已配置的非 off 默认值不能覆盖它。
- `/usage reset`（别名：`default`、`inherit`、`inherited`、`clear`、`unpin`）清除会话覆盖。随后该会话会**继承**生效的配置默认值（`messages.responseUsage`）。如果未配置默认值，页脚保持关闭。
- 完整会话重置（`/reset` 或 `/new`）或会话滚动会**保留**显式用量模式偏好，因此用户的显示选择会跨会话滚动保留。只有 `/usage reset`（及其别名）会清除覆盖。

### 切换行为

不带参数的 `/usage` 会循环：off → tokens → full → off。循环起点是当前**生效**模式（未设置时会话覆盖会回退到配置默认值），因此循环始终匹配用户当前在页脚中看到的内容。

### 配置

没有配置时会保留先前行为（页脚关闭，直到使用 `/usage`）。使用 `/usage reset` 清除会话覆盖，并重新继承已配置的默认值。

## 自定义 `/usage full` 页脚

`/usage tokens` 始终渲染一行普通的 `Usage: X in / Y out`（可用时附带缓存和预估成本后缀）。只有 `/usage full` 会渲染下面描述的更丰富页脚。

`/usage full` 会显示内置紧凑页脚，在相应字段可用时包含模型、推理、快速/慢速、上下文窗口和成本。内置页脚不需要模板文件。

`messages.usageTemplate` 仅用于高级自定义布局。该值是一个 JSON 文件路径（支持 `~`）或内联对象，有效时会替换内置页脚。文件路径会被监听，并在变更时实时重新加载。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺失或空模板会静默回退到内置页脚。不可读取或无效的已配置模板（坏 JSON，或没有可渲染输出片段的形状）也会回退到内置页脚，并发出操作员警告。

从内置形状开始自定义模板，然后编辑你想更改的部分：

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### 形状

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

每个表面都是一个有序的**片段**列表；引擎会渲染每个片段，丢弃空片段，并用 `sep` 连接保留下来的片段。没有条目的表面使用 `output.default`。

### 合约路径

片段通过点路径从每轮合约中读取值。不存在的值为空（因此 `when` 守卫或 `|fallback` 能让片段保持干净）。

| 路径                                                                                | 含义                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | channel id（`discord`/`telegram`/等）                                                               |
| `agentId` / `chat_type`                                                             | 所属 agent id / 聊天表面类型                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | model id / 显示名称 / provider id                                                                |
| `model.actual`, `model.resolved_ref`                                                | 该轮实际使用的 provider/model ref                                                        |
| `model.requested`                                                                   | 请求的 provider/model ref（fallback 前）                                                       |
| `model.reasoning`                                                                   | effort（从 `off` 到 `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | bool：已使用 fallback / model 已固定                                                                   |
| `model.override_source` / `model.auth_mode`                                         | override 来源标签 / 凭证模式（`oauth`、`api-key`、`token`、`mixed`、`aws-sdk`、`unknown`） |
| `state.fast_mode`                                                                   | bool：快速与慢速                                                                                   |
| `state.compactions`                                                                 | 该会话的压缩次数                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 窗口预算 / 已占用 token / 0-100 已用                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 轮次聚合                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 该轮的缓存读取和缓存写入 token                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | token 显示保护条件                                                                                 |
| `usage.cache_hit_pct`                                                               | 缓存读取占总 prompt token 的比例                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 仅最终 model 调用（也包含 `cache_read_tokens`、`cache_write_tokens`、`total_tokens`）           |
| `cost.turn_usd` / `cost.available`                                                  | 估算轮次成本 / 是否解析到成本表                                                  |
| `timing.duration_ms`                                                                | 墙钟轮次持续时间                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | agent 身份名称 / emoji / avatar                                                                 |
| `session.id`                                                                        | session id                                                                                           |

（provider 速率限制窗口**不**在此契约中；目前没有数组值路径，因此 `each` 片段没有可迭代的内容。）

### 动词

将值从左到右通过动词管道传递；非动词片段是 fallback。

| 动词            | 效果                                | 示例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 紧凑计数                         | `272000 -> 272k`                  |
| `fixed:N`       | N 位小数（默认 2）                | `0.0377`                          |
| `dur`           | 秒数转持续时间                   | `14820 -> 4h07m`                  |
| `pct`           | 追加 `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 用于从已用转换为剩余             |
| `alias:TABLE`   | 在 `aliases` 中查找，未列出则原样输出 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 在 0-100 值上显示 W 格字形条   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一个字形） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：字面量 + 插值。
- `{ "when": "<path>", "text": "..." }`：仅当路径为真值时渲染。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：值到字形的映射（`_default` case 覆盖未匹配的值）。
- `{ "each": "<array-path>", "item": "{label}" }`：迭代数组值路径（当前没有契约路径是数组）。

### 示例

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

渲染结果例如 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 提供商 + 凭证

当无法解析可用的提供商用量凭证时，会隐藏用量。OpenClaw
会自动发现已启用且声明
`contracts.usageProviders` 并同时实现 `resolveUsageAuth` 和
`fetchUsageSnapshot` 的 provider 插件；不存在单独的 core provider allowlist。静态
契约会让发现保持有范围，而无需导入每个 provider 插件。每个
插件拥有自己的上游端点和响应映射。
共享快照会让计划名称、配额窗口、余额、支出和预算
对 CLI、app 和 Control UI 消费者保持 provider 中立。

- **Anthropic（Claude）**：auth profile 中的 OAuth token。如果 OAuth token 缺少
  `user:profile` scope，则在已设置时 fallback 到 `claude.ai` web session（`CLAUDE_AI_SESSION_KEY`、
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` cookie）。
  当 Anthropic 返回时，会包含 model 级别限制和已启用的额外用量月度支出/预算。
  显式 Anthropic Admin API key，或
  自动检测到的 `sk-ant-admin...` provider profile，则会改为显示 30 天
  组织成本和 Messages API 历史。
- **ClawRouter**：API key（`CLAWROUTER_API_KEY`）。配置后显示月度预算窗口
  和类型化 USD 预算；否则显示聚合支出以及
  请求/token/成本摘要。
- **DeepSeek**：通过环境变量/配置/auth store 获取 API key（`DEEPSEEK_API_KEY`）。
  显示每个 provider 返回的币种余额。
- **GitHub Copilot**：auth profile 中的 OAuth token。
- **Gemini CLI**：auth profile 中的 OAuth token。
- **MiniMax**：API key 或 MiniMax OAuth auth profile。OpenClaw 将
  `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额
  表面，存在已存储的 MiniMax OAuth 时优先使用，否则 fallback
  到 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量轮询会在配置了 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 时从中派生 Coding Plan host，否则使用
  MiniMax CN host。
  MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示**剩余**
  配额，因此 OpenClaw 会在显示前将其反转；存在基于计数的字段时
  优先使用。
  - 窗口标签优先来自 provider 的小时/分钟字段（如果存在），然后
    fallback 到 `start_time` / `end_time` 时间跨度。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 会优先选择
    chat-model 条目，在缺少显式
    `window_hours` / `window_minutes` 字段时从时间戳派生窗口标签，并在计划标签中包含 model
    名称。
- **OpenAI（Codex/ChatGPT 计划）**：auth profile 中的 OAuth token（存在 account id 时发送 `ChatGPT-Account-Id`
  header）。显示 ChatGPT 计划、可重置的
  Codex 窗口，以及返回时的 credit 余额。Credit 仍是 provider
  credit；OpenClaw 不会将其标记为美元。`OPENAI_ADMIN_KEY` 会在 key 拥有 Usage
  Dashboard 访问权限时添加 30 天组织成本和 completions-usage 历史。
  推理凭证绝不会转发到组织 API。
- **OpenRouter**：API key 或 OAuth 支持的 API key（`OPENROUTER_API_KEY` 或 auth
  profile）。将账户 credit 端点与 key 配额端点合并，
  因此在凭证可访问时会显示账户余额/支出、key 预算以及每日/每周/每月用量。
  任一端点都可以独立丰富快照。
- **Venice**：通过环境变量/配置/auth store 获取 API key（`VENICE_API_KEY`）。显示 USD 和
  DIEM 余额，以及返回时的 DIEM epoch allocation 用量。
- **Xiaomi MiMo**：两个独立的用量表面。按量付费用 API key
  （`XIAOMI_API_KEY`）；Token Plan 使用单独的 key（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  两者目前都不返回配额窗口。
- **z.ai**：通过环境变量/配置/auth store 获取 API key（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相关

- [Token 使用和成本](/zh-CN/reference/token-use)
- [API 用量和成本](/zh-CN/reference/api-usage-costs)
- [Prompt caching](/zh-CN/reference/prompt-caching)
- [菜单栏](/zh-CN/platforms/mac/menu-bar)
