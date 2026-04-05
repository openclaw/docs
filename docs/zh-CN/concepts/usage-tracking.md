---
read_when:
    - 你正在接入提供商的使用情况/配额表面
    - 你需要解释使用情况跟踪行为或认证要求
summary: 使用情况跟踪表面与凭证要求
title: 使用情况跟踪
x-i18n:
    generated_at: "2026-04-05T08:22:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# 使用情况跟踪

## 它是什么

- 直接从提供商的使用情况端点拉取使用量/配额。
- 不估算成本；只显示提供商报告的窗口。
- 面向人的状态输出会统一规范为 `X% left`，即使
  上游 API 报告的是已消耗配额、剩余配额，或仅有原始计数。
- 会话级 `/status` 和 `session_status` 在实时会话快照信息较少时，可以回退到最新的
  transcript 使用情况条目。该回退会补齐缺失的 token/cache 计数器，可以恢复当前运行时
  model 标签，并且在会话元数据缺失或更小时，优先采用更大的面向 prompt 的总量。已有的非零实时值仍然优先。

## 它显示在哪里

- 聊天中的 `/status`：带丰富 emoji 的状态卡，显示会话 token + 估算成本（仅 API key）。提供商使用情况会在可用时针对**当前模型提供商**显示为规范化的 `X% left` 窗口。
- 聊天中的 `/usage off|tokens|full`：每次响应的使用情况页脚（OAuth 仅显示 token）。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合得到的本地成本汇总。
- CLI：`openclaw status --usage` 会打印完整的按提供商划分的明细。
- CLI：`openclaw channels list` 会在提供商配置旁打印同样的使用情况快照（使用 `--no-usage` 可跳过）。
- macOS 菜单栏：Context 下的 “Usage” 部分（仅在可用时显示）。

## 提供商 + 凭证

- **Anthropic（Claude）**：认证配置文件中的 OAuth token。
- **GitHub Copilot**：认证配置文件中的 OAuth token。
- **Gemini CLI**：认证配置文件中的 OAuth token。
  - JSON 使用情况会回退到 `stats`；`stats.cached` 会被规范化为
    `cacheRead`。
- **OpenAI Codex**：认证配置文件中的 OAuth token（存在时使用 accountId）。
- **MiniMax**：API key 或 MiniMax OAuth 认证配置文件。OpenClaw 将
  `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额
  表面，优先使用已存储的 MiniMax OAuth，如果不存在，则回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  MiniMax 原始的 `usage_percent` / `usagePercent` 字段表示的是**剩余**
  配额，因此 OpenClaw 会在显示前将其反转；如果存在基于计数的字段，则优先使用它们。
  - coding-plan 窗口标签会优先使用提供商的小时/分钟字段，
    如果不存在，则回退到 `start_time` / `end_time` 范围。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 会优先采用
    chat-model 条目，在缺少显式 `window_hours` / `window_minutes` 字段时根据时间戳推导窗口标签，并将模型
    名称包含在 plan 标签中。
- **Xiaomi MiMo**：通过环境变量/配置/认证存储提供的 API key（`XIAOMI_API_KEY`）。
- **z.ai**：通过环境变量/配置/认证存储提供的 API key。

当无法解析到可用的提供商使用情况认证时，使用情况会被隐藏。提供商
可以提供插件特定的使用情况认证逻辑；否则 OpenClaw 会回退为从认证配置文件、环境变量
或配置中匹配 OAuth/API key 凭证。
