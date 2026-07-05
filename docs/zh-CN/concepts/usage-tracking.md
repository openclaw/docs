---
read_when:
    - 你正在接入提供商用量/配额界面
    - 你需要解释使用量跟踪行为或认证要求
summary: 用量跟踪界面和凭证要求
title: 使用情况跟踪
x-i18n:
    generated_at: "2026-07-05T11:16:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 680240a1a8aa9f4d440de87f62ebfe96ac136375f8b35ca3cc44524846b36ccf
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什么

- 直接从每个提供商的用量端点拉取提供商用量/配额。没有估算成本；只有提供商报告的配额窗口、余额或账户状态摘要。
- 适合人类阅读的配额窗口输出会规范化为 `X% left`，即使提供商报告的是已消耗配额、剩余配额，或只有原始计数。没有可重置配额窗口的提供商会改为显示提供商摘要文本（例如余额）。
- 会话级 `/status` 和 `session_status` 工具会在实时会话快照缺少 token/模型数据时回退到会话的 transcript 日志。该回退会填补缺失的 token/缓存计数器，可以恢复活动运行时模型标签，并且在会话元数据缺失或更小（`totalTokensFresh !== true`、为零，或低于从 transcript 推导出的值）时优先使用更大的面向提示词的总量。非零实时值始终优先于回退。

## 显示位置

- 聊天中的 `/status`：包含会话 token 和估算成本（仅 API key 模型）的状态卡。提供商用量会在可用时针对**当前模型提供商**显示为规范化的 `X% left` 窗口或提供商摘要文本。
- 聊天中的 `/usage off|tokens|full`：每条响应的用量页脚。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合的本地成本摘要。
- CLI：`openclaw status --usage` 会打印完整的按提供商划分的用量/配额明细。
- CLI：`openclaw models status` 会列出 OAuth/token 凭证配置，并在每个有用量窗口的提供商旁边显示用量窗口摘要。
- macOS 菜单栏：当提供商用量快照可用时，根级“用量”部分会显示在“上下文”下方。请参阅[菜单栏](/zh-CN/platforms/mac/menu-bar)。

`openclaw channels list` 不再打印提供商用量；它会改为提示用户使用 `openclaw status` 或 `openclaw models list`。

## 默认用量页脚模式

`/usage off|tokens|full` 会为一个会话设置页脚，并为该会话记住该设置。`messages.responseUsage` 会为尚未选择模式的会话提供初始模式，因此无需每次输入 `/usage`，页脚也可以默认开启。

为每个渠道设置一种模式，或设置带有 `default` 回退的按渠道映射：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

接受的值：`"off"`、`"tokens"`、`"full"`，以及旧别名 `"on"`（按 `"tokens"` 处理）。

### 三种不同的会话状态

会话的 `responseUsage` 字段有三种可表示状态，每种语义不同：

| 状态                | 存储值                          | 生效模式                                                              |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未设置 / 继承**   | `undefined`（不存在）           | 继续回退到 `messages.responseUsage` 配置默认值，然后是 `off`。        |
| **显式关闭**        | `"off"`（已存储）               | 始终关闭，非关闭的配置默认值无法重新启用页脚。                        |
| **显式开启**        | `"tokens"` 或 `"full"`（已存储） | 使用该模式，不受配置默认值影响。                                      |

### 优先级

生效模式 = 会话覆盖 → 渠道配置条目 → `default` → `off`。

显式 `/usage off` 会以字面值 `"off"` **持久化**到会话中，不等同于“未设置”。一旦用户显式禁用页脚，非关闭的 `messages.responseUsage` 默认值无法重新开启页脚。

### 重置与关闭

- `/usage off` 会强制关闭页脚并持久化该选择。已配置的非关闭默认值无法覆盖它。
- `/usage reset`（别名：`default`、`inherit`、`inherited`、`clear`、`unpin`）会清除会话覆盖。随后会话会**继承**生效的配置默认值（`messages.responseUsage`）。如果未配置默认值，页脚会保持关闭。
- 完整会话重置（`/reset` 或 `/new`）或会话滚动会**保留**显式用量模式偏好，因此用户的显示选择会在会话滚动后继续生效。只有 `/usage reset`（及其别名）会清除覆盖。

### 切换行为

不带参数的 `/usage` 会循环：off → tokens → full → off。循环的起点是当前**生效**模式（未设置时会话覆盖回退到配置默认值），因此循环始终与用户当前在页脚中看到的内容一致。

### 配置

没有配置时会保持此前行为（页脚关闭，直到使用 `/usage`）。使用 `/usage reset` 清除会话覆盖并重新继承已配置的默认值。

## 自定义 `/usage full` 页脚

`/usage tokens` 始终渲染普通的 `Usage: X in / Y out` 行（可用时附加缓存和估算成本后缀）。只有 `/usage full` 会渲染下面描述的更丰富页脚。

`/usage full` 会显示内置紧凑页脚，其中在字段可用时包含模型、reasoning、快/慢、上下文窗口和成本。内置页脚不需要模板文件。

`messages.usageTemplate` 仅用于高级自定义布局。该值是 JSON 文件路径（支持 `~`）或内联对象，并且在有效时会替换内置页脚。文件路径会被监听，并在变化时实时重新加载。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺失或空模板会静默回退到内置页脚。不可读取或无效的已配置模板（错误 JSON，或形状没有可渲染输出片段）也会回退到内置页脚，并发出操作员警告。

从内置形状开始创建自定义模板，然后编辑你想更改的部分：

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

每个 surface 都是一个有序的**片段**列表；引擎会渲染每个片段，丢弃空片段，并使用 `sep` 连接保留下来的片段。没有条目的 surface 会使用 `output.default`。

### 合约路径

片段通过点路径从每轮合约读取值。缺失值为空（因此 `when` guard 或 `|fallback` 可以让片段保持整洁）。

| 路径                                                                                | 含义                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | 渠道 id（`discord`/`telegram`/等）                                                               |
| `agentId` / `chat_type`                                                             | 所属智能体 id / 聊天界面类型                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | 模型 id / 显示名称 / 提供商 id                                                                |
| `model.actual`, `model.resolved_ref`                                                | 本轮实际使用的提供商/模型引用                                                        |
| `model.requested`                                                                   | 请求的提供商/模型引用（fallback 前）                                                       |
| `model.reasoning`                                                                   | effort（从 `off` 到 `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | 布尔值：已使用 fallback / 模型已固定                                                                   |
| `model.override_source` / `model.auth_mode`                                         | override 来源标签 / 凭证模式（`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`） |
| `state.fast_mode`                                                                   | 布尔值：快速与慢速                                                                                   |
| `state.compactions`                                                                 | 该会话的压缩次数                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 窗口预算 / 已占用 token / 已使用 0-100                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 本轮聚合                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 本轮的缓存读取和缓存写入 token                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | token 显示保护                                                                                 |
| `usage.cache_hit_pct`                                                               | 缓存读取占总提示词 token 的比例                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 仅最终模型调用（也包含 `cache_read_tokens`, `cache_write_tokens`, `total_tokens`）           |
| `cost.turn_usd` / `cost.available`                                                  | 估算的本轮成本 / 是否已解析成本表                                                  |
| `timing.duration_ms`                                                                | 本轮墙钟耗时                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | 智能体身份名称 / 表情符号 / 头像                                                                 |
| `session.id`                                                                        | 会话 id                                                                                           |

（提供商速率限制窗口**不**在此契约中；目前没有数组值路径，因此 `each` 片段没有可迭代内容。）

### 动词

将值从左到右通过动词管道传递；非动词段是 fallback。

| 动词            | 效果                                | 示例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 紧凑计数                         | `272000 -> 272k`                  |
| `fixed:N`       | N 位小数（默认 2）                | `0.0377`                          |
| `dur`           | 秒数转时长                   | `14820 -> 4h07m`                  |
| `pct`           | 追加 `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 用于从已使用转换为剩余             |
| `alias:TABLE`   | 在 `aliases` 中查找，未列出则原样返回 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 基于 0-100 值的 W 格字符条   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一个字符） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：字面量 + 插值。
- `{ "when": "<path>", "text": "..." }`：仅当路径为真时渲染。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：将值映射为字符（`_default` case 覆盖未匹配值）。
- `{ "each": "<array-path>", "item": "{label}" }`：迭代数组值路径（当前契约路径都不是数组）。

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

会渲染为例如 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 提供商 + 凭证

当无法解析出可用的提供商用量认证时，用量会被隐藏。提供商
提供自己的用量获取逻辑；当该逻辑不可用时，OpenClaw 会 fallback
到来自认证配置、环境变量或配置的匹配 OAuth/API key 凭证。

- **Anthropic（Claude）**：认证配置中的 OAuth token。如果 OAuth token 缺少
  `user:profile` scope，则在设置了 `claude.ai` Web 会话（`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` cookie）时 fallback 到它。
- **ClawRouter**：API key（`CLAWROUTER_API_KEY`）。配置预算时显示月度预算窗口，
  否则显示请求/token/成本摘要。
- **DeepSeek**：通过环境变量/配置/认证存储提供 API key（`DEEPSEEK_API_KEY`）。
  将提供商报告的账户余额显示为文本，而不是剩余百分比
  配额窗口。
- **GitHub Copilot**：认证配置中的 OAuth token。
- **Gemini CLI**：认证配置中的 OAuth token。
- **MiniMax**：API key 或 MiniMax OAuth 认证配置。OpenClaw 将
  `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额
  界面；存在已存储的 MiniMax OAuth 时优先使用，否则 fallback
  到 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量轮询会在已配置时从 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推导 Coding Plan 主机，否则使用
  MiniMax CN 主机。
  MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示**剩余**
  配额，因此 OpenClaw 会在显示前对其取反；存在基于计数的字段时优先使用。
  - 窗口标签优先来自提供商的小时/分钟字段（如果存在），然后
    fallback 到 `start_time` / `end_time` 时间跨度。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 会优先选择
    chat-model 条目，在显式 `window_hours` / `window_minutes` 字段缺失时从时间戳
    推导窗口标签，并在方案标签中包含模型名称。
- **OpenAI（Codex/ChatGPT 方案）**：认证配置中的 OAuth token（存在账户 id 时会发送
  `ChatGPT-Account-Id` header）。不跟踪仅使用 API key 的 OpenAI 用量。
- **Xiaomi MiMo**：两个独立的用量界面。按量付费用 API key
  （`XIAOMI_API_KEY`）；Token Plan 使用单独的 key（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  目前两者都不报告配额窗口。
- **z.ai**：通过环境变量/配置/认证存储提供 API key（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相关

- [Token 使用量和成本](/zh-CN/reference/token-use)
- [API 使用量和成本](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [菜单栏](/zh-CN/platforms/mac/menu-bar)
