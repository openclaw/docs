---
read_when:
    - 你想快速诊断渠道健康状态和最近会话接收方
    - 你想获取一个适合粘贴的“all”状态输出用于调试
summary: '`openclaw status` 的 CLI 参考（诊断、探测、使用情况快照）'
title: status
x-i18n:
    generated_at: "2026-04-05T08:20:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
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
- `--usage` 会以 `X% left` 的形式打印规范化后的提供商使用窗口。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余额度，因此 OpenClaw 会在显示前对其取反。若存在基于计数的字段，则优先使用。对于 `model_remains` 响应，会优先使用聊天模型条目，必要时根据时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 当当前会话快照信息较少时，`/status` 可以从最新的转录使用日志中回填令牌和缓存计数器。现有的非零实时值仍然优先于转录回退值。
- 当实时会话条目缺少活动运行时模型标签时，转录回退也可以恢复它。如果该转录模型与已选模型不同，status 会针对恢复出的运行时模型而不是已选模型解析上下文窗口。
- 对于 prompt 大小统计，当会话元数据缺失或更小时，转录回退会优先使用更大的、面向 prompt 的总量，这样自定义提供商会话就不会退化为显示 `0` token。
- 当配置了多个智能体时，输出会包含按智能体划分的会话存储。
- 概览在可用时会包含 Gateway 网关 + 节点宿主服务的安装/运行时状态。
- 概览会包含更新渠道 + git SHA（适用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，status 会打印运行 `openclaw update` 的提示（参见[更新](/install/updating)）。
- 只读状态界面（`status`、`status --json`、`status --all`）会在可能的情况下，为其目标配置路径解析受支持的 SecretRef。
- 如果已配置受支持的渠道 SecretRef，但在当前命令路径中不可用，status 会保持只读，并报告降级输出，而不是崩溃。人类可读输出会显示诸如“configured token unavailable in this command path”之类的警告，JSON 输出则包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，status 会优先使用解析后的快照，并从最终输出中清除临时的“secret unavailable”渠道标记。
- `status --all` 包含一个 Secrets 概览行，以及一个诊断部分，用于汇总密钥诊断信息（为便于阅读已截断），同时不会停止报告生成。
