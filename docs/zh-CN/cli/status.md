---
read_when:
    - 你想快速诊断渠道健康状况 + 最近会话的接收者
    - 你想要一个可直接粘贴的 “all” 状态输出，用于调试
summary: '`openclaw status` 的 CLI 参考（诊断、探测、用法快照）'
title: 状态
x-i18n:
    generated_at: "2026-04-25T01:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

用于渠道 + 会话的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

说明：

- `--deep` 会运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- `--usage` 会以 `X% left` 的形式打印标准化后的提供商用量窗口。
- 会话状态输出会将 `Execution:` 与 `Runtime:` 分开显示。`Execution` 是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你该会话使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、某个 CLI 后端，还是像 `codex (acp/acpx)` 这样的 ACP 后端。有关提供商 / 模型 / 运行时之间区别的说明，请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余额度，因此 OpenClaw 会在显示前将其反转；如果存在基于计数的字段，则优先使用这些字段。`model_remains` 响应会优先选择聊天模型条目，在需要时根据时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 当当前会话快照信息较少时，`/status` 可以从最近的转录用量日志中回填 token 和缓存计数器。现有的非零实时值仍然优先于转录回填值。
- 转录回填还可以在实时会话条目缺少活动运行时模型标签时恢复该标签。如果该转录模型与所选模型不同，状态会根据恢复出的运行时模型，而不是所选模型，来解析上下文窗口。
- 对于提示大小统计，当会话元数据缺失或更小时，转录回填会优先选择更大的、面向提示的总量，这样自定义提供商会话就不会退化为显示 `0` token。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
- 概览会在可用时包含 Gateway 网关 + 节点主机服务的安装 / 运行时状态。
- 概览会包含更新频道 + git SHA（适用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，status 会打印运行 `openclaw update` 的提示（参见 [Updating](/zh-CN/install/updating)）。
- 只读状态界面（`status`、`status --json`、`status --all`）会在可能的情况下，为其目标配置路径解析受支持的 SecretRef。
- 如果已配置受支持的渠道 SecretRef，但在当前命令路径中不可用，status 会保持只读，并报告降级输出，而不是崩溃。人类可读输出会显示类似“在此命令路径中，已配置的令牌不可用”的警告，JSON 输出则会包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，status 会优先使用解析后的快照，并清除最终输出中临时的“secret unavailable” 渠道标记。
- `status --all` 包含一个 Secrets 概览行和一个诊断部分，该部分会汇总密钥诊断信息（为便于阅读会进行截断），同时不会停止报告生成。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
