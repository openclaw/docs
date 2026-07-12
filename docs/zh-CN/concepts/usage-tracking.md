---
read_when:
    - 你正在接入提供商用量/配额界面
    - 你需要说明用量跟踪行为或身份验证要求
summary: 用量跟踪界面及凭据要求
title: 用量跟踪
x-i18n:
    generated_at: "2026-07-11T20:29:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 这是什么

- 直接从各提供商的用量端点拉取用量/配额。不会估算提供商计费；仅显示提供商报告的套餐名称、配额周期、余额、支出、预算、每日成本历史、令牌/模型归因或账户状态摘要。
- 人类可读的配额周期输出统一规范为 `X% left`，即使提供商报告的是已用配额、剩余配额或仅有原始计数。没有可重置配额周期的提供商则显示提供商摘要文本（例如余额）。
- 当实时会话快照缺少令牌/模型数据时，会话级 `/status` 和 `session_status` 工具会回退到会话的转录日志。该回退会补全缺失的令牌/缓存计数，可以恢复当前运行时模型标签；当会话元数据缺失或数值较小时（`totalTokensFresh !== true`、为零或低于从转录记录推导出的值），会优先采用较大的、面向提示词的总量。非零的实时值始终优先于回退值。

## 显示位置

- 聊天中的 `/status`：显示包含会话令牌和估算成本（仅限 API key 模型）的状态卡。可用时，会显示**当前模型提供商**的提供商用量，形式为规范化的 `X% left` 周期或提供商摘要文本。
- 聊天中的 `/usage off|tokens|full`：显示每次响应的用量页脚。
- 聊天中的 `/usage cost`：显示根据 OpenClaw 会话日志汇总的本地成本摘要。
- CLI：`openclaw status --usage` 输出完整的各提供商用量/配额明细。
- CLI：`openclaw models status` 列出 OAuth/令牌身份验证配置文件，并在每个具有用量周期的提供商旁显示用量周期摘要。
- Control UI：**Usage** 会在 OpenClaw 根据会话推导的令牌与估算成本分析上方显示提供商套餐和计费卡片。Anthropic 和 OpenAI Admin API 凭据还会添加提供商报告的今日、7 天和 30 天支出、每日趋势、令牌总数、热门模型以及成本类别。
- Control UI：聊天编辑器的上下文环形弹出框会显示订阅提供商的**套餐用量**——包括各周期进度条（5 小时、每周、模型范围）、重置时间、已知时的提供商套餐（例如 `Max (20x)`）以及额外用量额度。通过套餐计费的会话会隐藏按令牌计算的金额估算；通过 API 计费的会话会保留 `Est. cost` 和按类型划分的成本明细。Claude Code CLI（`claude-cli`）设置会复用相同的 Anthropic 订阅用量。
- macOS 菜单栏：提供商用量快照可用时，Context 下方会显示一个根级 “Usage” 区段。请参阅[菜单栏](/zh-CN/platforms/mac/menu-bar)。

`openclaw channels list` 不再输出提供商用量；它会改为引导用户使用 `openclaw status` 或 `openclaw models list`。

## Anthropic 和 OpenAI 成本历史

订阅配额和 API 计费是两种不同的提供商功能界面：

- Anthropic 订阅/设置凭据会继续显示 Claude 配额周期和可选的额外用量预算。设置 `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY`，可改为显示组织的 Usage 和 Cost API 历史。系统会自动检测以 `sk-ant-admin` 开头的 Anthropic 提供商凭据。
- OpenAI ChatGPT/Codex OAuth 会继续显示套餐、配额周期和额度余额。设置 `OPENAI_ADMIN_KEY`，可改为显示组织成本和补全用量历史；还可以设置 `OPENAI_PROJECT_ID`，将范围限定为一个项目。OpenClaw 绝不会将来自 `OPENAI_API_KEY`、提供商配置或身份验证配置文件的推理凭据发送到组织 API，因为这些密钥可能属于自定义端点。

Admin 凭据优先，因为它们提供实际的组织计费数据。OpenClaw 不会将这些提供商报告的总量与本地会话估算合并；这两个区段有意回答不同的问题。

## 默认用量页脚模式

`/usage off|tokens|full` 设置会话的页脚，并为该会话记住此设置。`messages.responseUsage` 为尚未选择模式的会话设定初始模式，因此无需每次输入 `/usage`，页脚也可以默认开启。

可以为所有渠道设置一种模式，也可以使用带有 `default` 回退项的按渠道映射：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

可接受的值：`"off"`、`"tokens"`、`"full"`，以及旧版别名 `"on"`（按 `"tokens"` 处理）。

### 三种不同的会话状态

会话的 `responseUsage` 字段可以表示三种状态，每种状态具有不同的语义：

| 状态                | 存储值                          | 生效模式                                                              |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未设置/继承**     | `undefined`（不存在）           | 回退到 `messages.responseUsage` 配置默认值，然后回退到 `off`。         |
| **显式关闭**        | `"off"`（已存储）               | 始终关闭，非关闭的配置默认值无法重新启用页脚。                         |
| **显式开启**        | `"tokens"` 或 `"full"`（已存储） | 使用该模式，不受配置默认值影响。                                       |

### 优先级

生效模式 = 会话覆盖 → 渠道配置项 → `default` → `off`。

显式执行 `/usage off` 后，字面值 `"off"` 会**持久化**到会话中，这与“未设置”不同。用户显式禁用页脚后，非关闭的 `messages.responseUsage` 默认值无法再次开启页脚。

### 重置与关闭的区别

- `/usage off` 强制关闭页脚并持久化该选择。配置的非关闭默认值无法覆盖它。
- `/usage reset`（别名：`default`、`inherit`、`inherited`、`clear`、`unpin`）清除会话覆盖。随后，会话会**继承**生效的配置默认值（`messages.responseUsage`）。如果未配置默认值，页脚会保持关闭。
- 完整会话重置（`/reset` 或 `/new`）或会话轮换会**保留**显式用量模式偏好，因此用户的显示选择可以跨会话轮换继续生效。只有 `/usage reset`（及其别名）会清除覆盖设置。

### 切换行为

不带参数的 `/usage` 会按以下顺序循环：off → tokens → full → off。循环的起点是**当前生效**的模式（未设置会话覆盖时，会回退到配置默认值），因此循环始终与用户当前在页脚中看到的内容一致。

### 配置

没有配置时，会保持之前的行为（在执行 `/usage` 之前页脚处于关闭状态）。使用 `/usage reset` 可清除会话覆盖，并重新继承配置的默认值。

## 自定义 `/usage full` 页脚

`/usage tokens` 始终渲染一行纯文本 `Usage: X in / Y out`（可用时还会附加缓存和估算成本后缀）。只有 `/usage full` 会渲染下面介绍的更丰富页脚。

字段可用时，`/usage full` 会显示内置的紧凑页脚，其中包含模型、推理、快速/慢速模式、上下文窗口和成本。内置页脚不需要模板文件。

`messages.usageTemplate` 仅用于高级自定义布局。其值可以是 JSON 文件路径（支持 `~`）或内联对象；有效时，它会替换内置页脚。系统会监视文件路径，并在文件变更时实时重新加载。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

模板缺失或为空时，会静默回退到内置页脚。已配置但无法读取或无效的模板（JSON 格式错误，或结构中没有可渲染的输出片段）也会回退到内置页脚，并发出操作员警告。

请以内置结构为起点创建自定义模板，然后编辑你想更改的部分：

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

### 结构

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [/* pieces */], // fallback for any surface
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

每个界面都是由**片段**组成的有序列表；引擎会渲染每个片段，丢弃空片段，并使用 `sep` 连接保留下来的片段。没有对应条目的界面会使用 `output.default`。

### 合约路径

片段通过点路径从每轮合约中读取值。缺失的值为空（因此可以使用 `when` 守卫或 `|fallback` 保持片段整洁）。

| 路径                                                                                | 含义                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | 渠道 ID（`discord`/`telegram`/等）                                                               |
| `agentId` / `chat_type`                                                             | 所属智能体 ID / 聊天界面类型                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | 模型 ID / 显示名称 / 提供商 ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | 该轮次实际使用的提供商/模型引用                                                        |
| `model.requested`                                                                   | 请求的提供商/模型引用（回退前）                                                       |
| `model.reasoning`                                                                   | 推理强度（从 `off` 到 `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | 布尔值：是否使用回退 / 是否固定模型                                                                   |
| `model.override_source` / `model.auth_mode`                                         | 覆盖来源标签 / 凭证模式（`oauth`、`api-key`、`token`、`mixed`、`aws-sdk`、`unknown`） |
| `state.fast_mode`                                                                   | 布尔值：快速或慢速                                                                                   |
| `state.compactions`                                                                 | 会话的压缩次数                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 窗口预算 / 已占用令牌数 / 0–100 的使用率                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 轮次汇总                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 该轮次的缓存读取和缓存写入令牌数                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | 令牌显示条件                                                                                 |
| `usage.cache_hit_pct`                                                               | 缓存读取令牌占提示词令牌总数的比例                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 仅最终一次模型调用（还包含 `cache_read_tokens`、`cache_write_tokens`、`total_tokens`）           |
| `cost.turn_usd` / `cost.available`                                                  | 轮次预估成本 / 是否成功解析成本表                                                  |
| `timing.duration_ms`                                                                | 轮次的实际经过时长                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | 智能体身份名称 / 表情符号 / 头像                                                                 |
| `session.id`                                                                        | 会话 ID                                                                                           |

（提供商限流窗口**不**属于此契约；目前没有值为数组的路径，因此 `each` 片段没有可迭代的内容。）

### 操作符

从左到右通过操作符处理值；非操作符片段为回退值。

| 操作符            | 效果                                | 示例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 紧凑计数格式                         | `272000 -> 272k`                  |
| `fixed:N`       | 保留 N 位小数（默认 2 位）                | `0.0377`                          |
| `dur`           | 将秒数转换为时长                   | `14820 -> 4h07m`                  |
| `pct`           | 追加 `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 将已用比例转换为剩余比例             |
| `alias:TABLE`   | 在 `aliases` 中查找，未列出时原样输出 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 以 0–100 的值生成宽度为 W 个单元格的字形条   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一个字形） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：字面文本 + 插值。
- `{ "when": "<path>", "text": "..." }`：仅当路径值为真时渲染。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：将值映射为字形（`_default` 分支用于处理未匹配的值）。
- `{ "each": "<array-path>", "item": "{label}" }`：迭代值为数组的路径（当前契约中没有任何路径是数组）。

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

例如会渲染为 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 提供商 + 凭证

无法解析出可用的提供商用量身份验证信息时，将隐藏用量。OpenClaw
会自动发现已启用、声明了 `contracts.usageProviders` 且同时实现
`resolveUsageAuth` 和 `fetchUsageSnapshot` 的提供商插件；
核心中没有单独的提供商允许列表。静态契约可以限定发现范围，
而无须导入每个提供商插件。每个插件负责其上游端点和响应映射。
共享快照以提供商无关的形式保存套餐名称、配额窗口、余额、支出和预算，
供 CLI、应用和 Control UI 使用。

- **Anthropic（Claude）**：身份验证配置文件中的 OAuth 令牌。如果 OAuth 令牌缺少
  `user:profile` 权限范围，则在已设置时回退到 `claude.ai` Web 会话（`CLAUDE_AI_SESSION_KEY`、
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` Cookie）。
  当 Anthropic 报告相关数据时，会包含模型级限制，以及已启用的额外用量月度支出/预算。
  如果使用明确配置的 Anthropic Admin API 密钥，或自动检测到的
  `sk-ant-admin...` 提供商配置文件，则改为显示组织过去 30 天的成本和 Messages API 历史记录。
- **ClawRouter**：API 密钥（`CLAWROUTER_API_KEY`）。配置后显示月度预算窗口
  和带类型的美元预算；否则显示汇总支出以及请求数/令牌数/成本摘要。
- **DeepSeek**：通过环境变量/配置/身份验证存储提供 API 密钥（`DEEPSEEK_API_KEY`）。
  显示提供商报告的每种货币余额。
- **GitHub Copilot**：身份验证配置文件中的 OAuth 令牌。
- **Gemini CLI**：身份验证配置文件中的 OAuth 令牌。
- **MiniMax**：API 密钥或 MiniMax OAuth 身份验证配置文件。OpenClaw 将
  `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额界面；
  存在已存储的 MiniMax OAuth 时优先使用，否则依次回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  配置后，用量轮询会从 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推导 Coding Plan 主机，否则使用
  MiniMax 中国区主机。
  MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示**剩余**
  配额，因此 OpenClaw 会先将其反转再显示；存在基于计数的字段时，优先使用这些字段。
  - 如果提供商返回小时/分钟字段，则据此生成窗口标签；否则回退到
    `start_time` / `end_time` 的时间跨度。
  - 如果 Coding Plan 端点返回 `model_remains`，OpenClaw 会优先选择
    聊天模型条目；当没有明确的 `window_hours` / `window_minutes` 字段时，
    从时间戳推导窗口标签，并在套餐标签中包含模型名称。
- **OpenAI（Codex/ChatGPT 套餐）**：身份验证配置文件中的 OAuth 令牌（存在账户 ID 时发送
  `ChatGPT-Account-Id` 请求头）。显示 ChatGPT 套餐、可重置的
  Codex 窗口，以及提供商报告的信用余额。信用额度仍标记为提供商信用额度；
  OpenClaw 不会将其标记为美元。`OPENAI_ADMIN_KEY` 可在密钥拥有 Usage
  Dashboard 访问权限时，添加组织过去 30 天的成本和补全用量历史记录。
  推理凭证绝不会转发到组织 API。
- **OpenRouter**：API 密钥或由 OAuth 支持的 API 密钥（`OPENROUTER_API_KEY` 或身份验证
  配置文件）。将账户信用额度端点与密钥配额端点合并，因此当凭证可以访问相应数据时，
  会显示账户余额/支出、密钥预算以及每日/每周/每月用量。
  任一端点都可以独立补充快照。
- **Venice**：通过环境变量/配置/身份验证存储提供 API 密钥（`VENICE_API_KEY`）。显示美元和
  DIEM 余额，以及提供商报告的 DIEM 周期分配用量。
- **Xiaomi MiMo**：两个独立的用量界面。按量付费使用 API 密钥
  （`XIAOMI_API_KEY`）；Token Plan 使用单独的密钥（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  两者目前都不报告配额窗口。
- **z.ai**：通过环境变量/配置/身份验证存储提供 API 密钥（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相关内容

- [令牌使用量和成本](/zh-CN/reference/token-use)
- [API 使用量和成本](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [菜单栏](/zh-CN/platforms/mac/menu-bar)
