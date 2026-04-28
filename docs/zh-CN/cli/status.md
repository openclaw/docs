---
read_when:
    - 你想快速诊断渠道健康状态 + 最近的会话接收方
    - 你想要一个可直接粘贴的 “all” 状态输出用于调试
summary: '`openclaw status` 的 CLI 参考（诊断、探测、用法快照）'
title: Status
x-i18n:
    generated_at: "2026-04-28T00:55:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
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

注意：

- `--deep` 会运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 普通的 `openclaw status` 会保持在快速只读路径上，并在跳过内存检查时将内存标记为 `not checked`，而不是不可用。重量级的安全审计、插件兼容性以及内存向量探测则留给 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 会报告由 `plugins.slots.memory` 选定的活动内存插件运行时中的内存详情。自定义内存插件即使保持内置 `agents.defaults.memorySearch.enabled` 禁用，也仍然可以报告它们自己的文件、分块、向量和 FTS 状态。
- `--usage` 会以 `X% left` 的形式打印标准化后的提供商用量窗口。
- 会话状态输出会将 `Execution:` 与 `Runtime:` 分开。`Execution` 是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你该会话使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、某个 CLI 后端，还是 ACP 后端，例如 `codex (acp/acpx)`。有关 provider/模型/运行时之间区别，请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示的是剩余额度，因此 OpenClaw 在显示前会对其进行反转；如果存在基于计数的字段，则优先使用。`model_remains` 响应会优先选择聊天模型条目，在需要时根据时间戳推导窗口标签，并在计划标签中包含模型名称。
- 当当前会话快照信息较少时，`/status` 可以从最近的转录使用日志中回填 token 和缓存计数器。现有的非零实时值仍然优先于转录回填值。
- 转录回填还可以在实时会话条目缺失时恢复活动运行时模型标签。如果该转录模型与所选模型不同，状态会根据恢复出的运行时模型而不是所选模型来解析上下文窗口。
- 对于提示词大小统计，当会话元数据缺失或更小时，转录回填会优先采用更大的、面向提示词的总量，这样自定义提供商会话就不会退化成显示 `0` token。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
- 如果可用，概览会包含 Gateway 网关 + 节点主机服务的安装/运行时状态。
- 概览会包含更新通道 + git SHA（用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，status 会打印提示，建议运行 `openclaw update`（参见 [Updating](/zh-CN/install/updating)）。
- 只读状态界面（`status`、`status --json`、`status --all`）会在可能的情况下，为其目标配置路径解析受支持的 SecretRef。
- 如果配置了受支持的渠道 SecretRef，但在当前命令路径中不可用，status 会保持只读，并报告降级输出而不是崩溃。人类可读输出会显示诸如“在此命令路径中，已配置的令牌不可用”之类的警告，而 JSON 输出会包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，status 会优先使用已解析的快照，并从最终输出中清除临时的“secret unavailable” 渠道标记。
- `status --all` 包含一个 Secrets 概览行和一个诊断部分，用于汇总 secret diagnostics（为便于阅读会截断），同时不会停止报告生成。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
