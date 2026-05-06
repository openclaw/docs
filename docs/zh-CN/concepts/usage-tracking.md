---
read_when:
    - 你正在接入提供商用量/配额界面
    - 你需要解释使用情况跟踪行为或身份验证要求
summary: 用量跟踪界面和凭证要求
title: 使用情况跟踪
x-i18n:
    generated_at: "2026-05-06T05:09:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什么

- 直接从各提供商的用量端点拉取提供商用量/配额。
- 不估算费用；只显示提供商报告的窗口。
- 面向人的状态输出会规范化为 `X% left`，即使上游 API 报告的是已消耗配额、剩余配额或仅原始计数。
- 会话级 `/status` 和 `session_status` 可在实时会话快照稀疏时回退到最新的转录用量条目。该回退会补齐缺失的令牌/缓存计数器，可以恢复活跃运行时模型标签，并在会话元数据缺失或更小时优先使用更大的提示词导向总量。现有非零实时值仍然优先。

## 显示位置

- 聊天中的 `/status`：带有丰富表情符号的状态卡片，包含会话令牌 + 预估费用（仅 API key）。当可用时，会显示**当前模型提供商**的提供商用量，并规范化为 `X% left` 窗口。
- 聊天中的 `/usage off|tokens|full`：逐响应的用量页脚（OAuth 仅显示令牌）。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合的本地费用摘要。
- CLI：`openclaw status --usage` 打印完整的逐提供商明细。
- CLI：`openclaw channels list` 在提供商配置旁打印相同的用量快照（使用 `--no-usage` 跳过）。
- macOS 菜单栏：Context 下的 “用量” 部分（仅在可用时）。

## 提供商 + 凭证

- **Anthropic（Claude）**：凭证配置文件中的 OAuth 令牌。
- **GitHub Copilot**：凭证配置文件中的 OAuth 令牌。
- **Gemini CLI**：凭证配置文件中的 OAuth 令牌。
  - JSON 用量会回退到 `stats`；`stats.cached` 会规范化为 `cacheRead`。
- **OpenAI Codex**：凭证配置文件中的 OAuth 令牌（存在 accountId 时使用）。
- **MiniMax**：API key 或 MiniMax OAuth 凭证配置文件。OpenClaw 将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额表面，存在已存储的 MiniMax OAuth 时优先使用，否则回退到 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。配置后，用量轮询会从 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 推导 Coding Plan 主机，否则使用 MiniMax CN 主机。MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示**剩余**配额，因此 OpenClaw 会在显示前将其反转；存在基于计数的字段时，它们优先。
  - Coding-plan 窗口标签优先来自提供商的小时/分钟字段，存在时使用；否则回退到 `start_time` / `end_time` 时间跨度。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，在缺少显式 `window_hours` / `window_minutes` 字段时从时间戳推导窗口标签，并在方案标签中包含模型名称。
- **Xiaomi MiMo**：通过环境变量/配置/凭证存储提供的 API key（`XIAOMI_API_KEY`）。
- **z.ai**：通过环境变量/配置/凭证存储提供的 API key。

当无法解析出可用的提供商用量认证时，会隐藏用量。提供商可以提供插件专用的用量认证逻辑；否则 OpenClaw 会回退到从凭证配置文件、环境变量或配置中匹配 OAuth/API-key 凭证。

## 相关

- [令牌使用和费用](/zh-CN/reference/token-use)
- [API 用量和费用](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
