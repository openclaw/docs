---
read_when:
    - 你正在连接提供商用量/配额界面
    - 你需要解释使用情况跟踪行为或身份验证要求
summary: 用量跟踪界面和凭证要求
title: 使用情况跟踪
x-i18n:
    generated_at: "2026-05-02T04:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什么

- 直接从提供商的使用量端点拉取提供商使用量/配额。
- 不估算费用；仅使用提供商报告的时间窗口。
- 人类可读的 Status 输出会统一为 `X% left`，即使上游 API 报告的是已消耗配额、剩余配额，或只有原始计数。
- 当实时会话快照信息稀疏时，会话级 `/status` 和 `session_status` 可以回退到最新的 transcript 使用量条目。该回退会填补缺失的 token/cache 计数器，可以恢复活跃运行时的模型标签，并在会话元数据缺失或较小时优先使用更大的、面向 prompt 的总量。已有的非零实时值仍然优先。

## 显示位置

- 聊天中的 `/status`：包含会话 token + 估算费用（仅 API 密钥）的富 emoji Status 卡片。可用时，提供商使用量会针对**当前模型提供商**显示为统一的 `X% left` 时间窗口。
- 聊天中的 `/usage off|tokens|full`：每次响应的使用量页脚（OAuth 仅显示 token）。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合的本地费用摘要。
- CLI：`openclaw status --usage` 打印完整的逐提供商明细。
- CLI：`openclaw channels list` 在提供商配置旁打印相同的使用量快照（使用 `--no-usage` 跳过）。
- macOS 菜单栏：上下文下的“使用量”部分（仅在可用时）。

## 提供商 + 凭证

- **Anthropic（Claude）**：认证配置文件中的 OAuth token。
- **GitHub Copilot**：认证配置文件中的 OAuth token。
- **Gemini CLI**：认证配置文件中的 OAuth token。
  - JSON 使用量会回退到 `stats`；`stats.cached` 会规范化为 `cacheRead`。
- **OpenAI Codex**：认证配置文件中的 OAuth token（存在时使用 accountId）。
- **MiniMax**：API 密钥或 MiniMax OAuth 认证配置文件。OpenClaw 将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额表面，存在已存储的 MiniMax OAuth 时优先使用，否则回退到 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。配置后，使用量轮询会从 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 推导 Coding Plan 主机，否则使用 MiniMax CN 主机。MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示**剩余**配额，因此 OpenClaw 会在显示前对其取反；存在基于计数的字段时，计数字段优先。
  - Coding Plan 时间窗口标签会在存在时来自提供商的小时/分钟字段，然后回退到 `start_time` / `end_time` 时间跨度。
  - 如果 Coding Plan 端点返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，在缺少显式 `window_hours` / `window_minutes` 字段时从时间戳推导时间窗口标签，并在套餐标签中包含模型名称。
- **Xiaomi MiMo**：通过 env/配置/认证存储提供的 API 密钥（`XIAOMI_API_KEY`）。
- **z.ai**：通过 env/配置/认证存储提供的 API 密钥。

当无法解析可用的提供商使用量认证时，会隐藏使用量。提供商可以提供插件专用的使用量认证逻辑；否则 OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥凭证。

## 相关

- [Token 使用量和费用](/zh-CN/reference/token-use)
- [API 使用量和费用](/zh-CN/reference/api-usage-costs)
- [Prompt 缓存](/zh-CN/reference/prompt-caching)
