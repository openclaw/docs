---
read_when:
    - 你想快速诊断渠道健康状态 + 最近会话的接收方
    - 你想要一个可直接粘贴的 “all” 状态输出用于调试
summary: '`openclaw status` 的 CLI 参考（诊断、探测、用法快照）'
title: Status
x-i18n:
    generated_at: "2026-04-27T23:31:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5374e57abd7f9d3664b14619c1b8a6c878570d09ae5aefc7019d1f6fbb894def
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

用于渠道 + 会话的诊断信息。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意：

- `--deep` 会运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 普通的 `openclaw status` 会保持在快速只读路径上。较重的安全审计、插件兼容性和内存向量探测则交给 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `--usage` 会以 `X% left` 的形式打印标准化后的提供商用量时间窗口。
- 会话状态输出会将 `Execution:` 与 `Runtime:` 分开显示。`Execution` 是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你该会话使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、某个 CLI 后端，还是 ACP 后端，例如 `codex (acp/acpx)`。有关提供商 / 模型 / 运行时之间的区别，请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示的是剩余额度，因此 OpenClaw 会在显示前将其反转；如果存在基于计数的字段，则优先使用它们。`model_remains` 响应会优先选择聊天模型条目，必要时根据时间戳推导窗口标签，并在计划标签中包含模型名称。
- 当当前会话快照信息较少时，`/status` 可以从最近的转录使用日志中回填 token 和缓存计数器。已有的非零实时值仍然优先于转录回退值。
- 当实时会话条目缺少活动运行时模型标签时，转录回退也可以恢复它。如果该转录模型与所选模型不同，状态会基于恢复出的运行时模型而不是所选模型来解析上下文窗口。
- 对于提示大小统计，如果会话元数据缺失或更小，转录回退会优先采用更大的、面向提示的总数，这样自定义提供商会话就不会显示为 `0` token。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
- 概览会在可用时包含 Gateway 网关 + 节点宿主服务的安装 / 运行状态。
- 概览会包含更新渠道 + git SHA（用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，状态会打印提示，建议运行 `openclaw update`（参见 [Updating](/zh-CN/install/updating)）。
- 只读状态表面（`status`、`status --json`、`status --all`）会在可能的情况下，为其目标配置路径解析支持的 SecretRef。
- 如果某个受支持的渠道 SecretRef 已配置但在当前命令路径中不可用，status 会保持只读，并报告降级输出，而不是崩溃。面向人的输出会显示诸如“已配置的 token 在此命令路径中不可用”之类的警告，而 JSON 输出会包含 `secretDiagnostics`。
- 当命令局部 SecretRef 解析成功时，status 会优先使用已解析的快照，并从最终输出中清除临时的“secret unavailable”渠道标记。
- `status --all` 包含一行 Secrets 概览和一个诊断部分，用于汇总 secret 诊断信息（为便于阅读会截断），同时不会停止报告生成。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
