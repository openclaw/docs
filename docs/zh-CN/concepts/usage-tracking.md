---
read_when:
    - 你正在接入提供商用量/配额相关界面
    - 你需要说明使用情况跟踪行为或身份验证要求
summary: 使用情况跟踪界面和凭证要求
title: 用量跟踪
x-i18n:
    generated_at: "2026-07-01T18:07:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什么

- 直接从提供商的用量端点拉取提供商用量/配额。
- 不估算成本；只显示提供商报告的配额窗口或账号状态摘要。
- 人类可读的配额窗口状态输出会规范化为 `X% left`，即使上游 API 报告的是已用配额、剩余配额，或只有原始计数。没有可重置配额窗口的提供商可以改为显示提供商摘要文本，例如余额。
- 会话级 `/status` 和 `session_status` 可以在实时会话快照信息稀疏时回退到最新的 transcript 用量条目。该回退会填补缺失的 token/cache 计数器，可以恢复活跃运行时模型标签，并在会话元数据缺失或更小时优先使用更大的、面向 prompt 的总量。现有的非零实时值仍然优先。

## 出现位置

- 聊天中的 `/status`：带有丰富 emoji 的状态卡片，包含会话 token + 估算成本（仅 API key）。可用时，会显示**当前模型提供商**的提供商用量，格式为规范化的 `X% left` 窗口或提供商摘要文本。
- 聊天中的 `/usage off|tokens|full`：每次响应的用量页脚。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合的本地成本摘要。
- CLI：`openclaw status --usage` 会打印完整的按提供商拆分信息。
- CLI：`openclaw channels list` 会在提供商配置旁打印同一份用量快照（使用 `--no-usage` 跳过）。
- macOS 菜单栏：Context 下的 “Usage” 部分（仅在可用时）。

## 默认用量页脚模式

`/usage off|tokens|full` 会为一个会话设置页脚，并会为该会话记住该设置。`messages.responseUsage` 会为尚未选择模式的会话播种该模式，因此无需每次输入 `/usage`，页脚也可以默认开启。

为每个渠道设置一种模式，或使用带 `default` 回退的按渠道映射：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### 三种不同的会话状态

会话的 `responseUsage` 字段有三种可表示状态，每种状态的语义不同：

| 状态 | 存储值 | 生效模式 |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未设置 / 继承** | `undefined`（缺失） | 回退到 `messages.responseUsage` 配置默认值，然后是 `off`。 |
| **显式关闭** | `"off"`（已存储） | 始终关闭，非 off 的配置默认值无法重新启用页脚。 |
| **显式开启** | `"tokens"` 或 `"full"`（已存储） | 使用该模式，不受配置默认值影响。 |

### 优先级

生效模式 = 会话覆盖 → 渠道配置条目 → `default` → `off`。

显式的 `/usage off` 会作为字面值 `"off"` **持久化**到会话中，与“未设置”不同。这意味着一旦用户已显式禁用页脚，非 off 的 `messages.responseUsage` 默认值无法再把页脚打开。

### 重置与关闭

- `/usage off` — 强制关闭页脚并持久化该选择。已配置的非 off 默认值无法覆盖它。
- `/usage reset`（别名：`inherit`、`clear`、`default`）— 清除会话覆盖。随后会话会**继承**生效的配置默认值（`messages.responseUsage`）。如果未配置默认值，则页脚关闭（与之前一致）。使用它可以“回到默认值”，而不是显式打开页脚。
- 完整会话重置（`/reset` 或 `/new`）或会话滚动会**保留**显式的用量模式偏好，因此用户的显示选择会在会话滚动后继续保留。只有 `/usage reset`（及其别名）会真正清除覆盖。

### 切换行为

不带参数的 `/usage` 会循环切换：off → tokens → full → off。循环的起点是当前**生效**模式（未设置时从会话覆盖回退到配置默认值），因此循环始终与用户在页脚中看到的内容一致。

### 配置

没有配置时会保持以前的行为（页脚关闭，直到使用 `/usage`）。使用 `/usage reset` 清除会话覆盖并重新继承已配置的默认值。

## 自定义 `/usage full` 页脚

`/usage full` 会显示一个内置的紧凑页脚，包含模型、reasoning、fast/slow、上下文窗口，以及这些字段可用时的成本。Token 和 cache 字段仍可用于自定义模板。不需要模板文件。

`messages.usageTemplate` 只用于高级自定义布局。该值是 JSON 文件路径（支持 `~`）或内联对象；有效时会替换内置页脚：

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺失或为空的模板会安静地回退到内置页脚。无法读取或无效的已配置模板也会回退到内置页脚，并发出 operator 警告。

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
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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

每个 surface 都是一个有序的 **piece** 列表；引擎会渲染每一项，丢弃空项，并用 `sep` 连接保留下来的项。没有条目的 surface 使用 `output.default`。

### 契约路径

piece 通过点路径从每轮契约中读取值。缺失值为空（因此 `when` guard 或 `|fallback` 可保持 piece 干净）。

| 路径 | 含义 |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface` | 渠道 id（`discord`/`telegram`/等） |
| `model.provider` / `model.display_name` | 提供商 id / 模型 id |
| `model.reasoning` | effort（`off` 到 `xhigh`） |
| `model.is_fallback` / `model.is_override` | bool：使用了 fallback / 模型被固定 |
| `state.fast_mode` | bool：fast 与 slow |
| `context.max_tokens` / `context.pct_used` | 窗口预算 / 0-100 已用 |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens` | 轮次聚合 |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct` | token 显示 guard 和 cache 百分比 |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 仅最终模型调用 |
| `cost.turn_usd` | 估算轮次成本 |
| `identity.name` / `identity.emoji` | agent 名称 / 选定 emoji |

（提供商速率限制窗口**不**在此契约中。）

### 动词

从左到右通过管道将值传给动词；非动词片段是 fallback。

| 动词 | 效果 | 示例 |
| --------------- | ------------------------------------- | --------------------------------- |
| `num` | 紧凑计数 | `272000 -> 272k` |
| `fixed:N` | N 位小数（默认 2） | `0.0377` |
| `dur` | 秒数转时长 | `14820 -> 4h07m` |
| `pct` | 追加 `%` | `96 -> 96%` |
| `inv` | `100 - x` | 从已用转为剩余 |
| `alias:TABLE` | 在 `aliases` 中查找，未列出则原样回显 | `medium -> 🌗` |
| `meter:W:SCALE` | 在 0-100 值上显示 W 格 glyph 条 | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一个 glyph） |

### Piece 形式

- `{ "text": "📚 {context.max_tokens|num}" }`：字面量 + 插值。
- `{ "when": "<path>", "text": "..." }`：仅在路径为 truthy 时渲染。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：值到 glyph。
- `{ "each": "limits.windows", "item": "{label}" }`：迭代数组。

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

## 提供商 + 凭据

- **Anthropic (Claude)**：auth profiles 中的 OAuth token。
- **GitHub Copilot**：auth profiles 中的 OAuth token。
- **Gemini CLI**：auth profiles 中的 OAuth token。
  - JSON 用量会回退到 `stats`；`stats.cached` 会规范化为
    `cacheRead`。
- **OpenAI Codex**：auth profiles 中的 OAuth token（存在 accountId 时使用）。
- **MiniMax**：API key 或 MiniMax OAuth auth profile。OpenClaw 将
  `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额
  面，在存在已存储的 MiniMax OAuth 时优先使用，否则回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量轮询会在已配置时从 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推导 Coding Plan 主机，否则使用
  MiniMax CN 主机。
  MiniMax 原始的 `usage_percent` / `usagePercent` 字段表示**剩余**
  配额，因此 OpenClaw 会在显示前将其反转；存在基于计数的字段时优先使用。
  - Coding-plan 窗口标签会在存在 provider 小时/分钟字段时使用这些字段，
    然后回退到 `start_time` / `end_time` 时间跨度。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 会优先使用
    chat-model 条目，在没有显式 `window_hours` / `window_minutes` 字段时从时间戳
    推导窗口标签，并在计划标签中包含模型名称。
- **Xiaomi MiMo**：通过环境变量/配置/auth store 使用 API key（`XIAOMI_API_KEY`）。
- **z.ai**：通过环境变量/配置/auth store 使用 API key。
- **DeepSeek**：通过环境变量/配置/auth store 使用 API key（`DEEPSEEK_API_KEY`）。
  OpenClaw 会调用 DeepSeek 的余额端点，并将 provider 报告的
  余额显示为文本，而不是剩余百分比配额窗口。

当无法解析出可用的 provider 用量认证时，用量会被隐藏。Provider
可以提供插件专用的用量认证逻辑；否则 OpenClaw 会回退到从 auth profiles、环境变量
或配置中匹配 OAuth/API-key 凭证。

## 相关

- [Token 使用和成本](/zh-CN/reference/token-use)
- [API 使用和成本](/zh-CN/reference/api-usage-costs)
- [Prompt 缓存](/zh-CN/reference/prompt-caching)
