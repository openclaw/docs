---
read_when:
    - 你想快速诊断渠道健康状态和近期会话接收者
    - 你想要一个可粘贴的 “all” 状态用于调试
summary: '`openclaw status` 的 CLI 参考（诊断、探测、使用情况快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T01:43:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

渠道 + 会话的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

说明：

- `--deep` 会运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 普通的 `openclaw status` 会保持在快速只读路径上，并在跳过记忆检查时将记忆标记为 `not checked`，而不是不可用。繁重的安全审计、插件兼容性和记忆向量探测留给 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 会报告由 `plugins.slots.memory` 选中的主动记忆插件运行时中的记忆详情。自定义记忆插件可以保持内置的 `agents.defaults.memorySearch.enabled` 处于禁用状态，同时仍报告自己的文件、分块、向量和 FTS 状态。
- `--usage` 会以 `X% left` 的形式打印标准化后的提供商用量窗口。
- 会话状态输出会将 `Execution:` 与 `Runtime:` 分开。`Execution` 是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你会话是否正在使用 `OpenClaw Default`、`OpenAI Codex`、某个 CLI 后端，或某个 ACP 后端，例如 `codex (acp/acpx)`。有关提供商/模型/运行时的区别，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余额度，因此 OpenClaw 会在显示前将其反转；当存在基于计数的字段时，它们优先。`model_remains` 响应会优先使用聊天模型条目，在需要时从时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 当当前会话快照较稀疏时，`/status` 可以从最近的 transcript 用量日志回填 token 和缓存计数器。现有的非零实时值仍会优先于 transcript 回退值。
- `/status` 包含紧凑的 Gateway 网关进程运行时长和主机系统运行时长。
- 当实时会话条目缺少活跃运行时模型标签时，transcript 回退也可以恢复它。如果该 transcript 模型与选中的模型不同，状态会基于恢复出的运行时模型而不是选中的模型来解析上下文窗口。
- 当会话固定到一个不同于已配置主模型的模型时，状态会打印两个值、原因（`session override`）以及清晰提示（`/model default`）。已配置的主模型适用于新会话或未固定的会话；现有固定会话会保留其会话选择，直到被清除。
- 对于提示大小统计，当会话元数据缺失或更小时，transcript 回退会优先使用更大的、面向提示的总量，因此自定义提供商会话不会坍缩为 `0` token 显示。
- 当配置了多个 Agent 时，输出会包含每个 Agent 的会话存储。
- 可用时，概览会包含 Gateway 网关 + 节点主机服务的安装/运行时状态。
- 概览会包含更新频道 + git SHA（用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，状态会打印提示，让你运行 `openclaw update`（请参阅 [更新](/zh-CN/install/updating)）。
- 模型价格刷新失败会显示为可选的价格警告。它们并不表示 Gateway 网关或渠道不健康。
- 只读状态界面（`status`、`status --json`、`status --all`）会在可能时为目标配置路径解析受支持的 SecretRef。
- 如果配置了受支持的渠道 SecretRef，但它在当前命令路径中不可用，状态会保持只读并报告降级输出，而不是崩溃。人类可读输出会显示诸如“此命令路径中配置的 token 不可用”之类的警告，JSON 输出会包含 `secretDiagnostics`。
- 当命令本地的 SecretRef 解析成功时，状态会优先使用已解析的快照，并从最终输出中清除临时的“secret 不可用”渠道标记。
- `status --all` 包含一个 Secrets 概览行和一个诊断部分，用于汇总 secret 诊断信息（为便于阅读会截断），且不会停止报告生成。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
