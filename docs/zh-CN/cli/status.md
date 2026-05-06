---
read_when:
    - 你想快速诊断渠道健康状况 + 最近的会话接收者
    - 你想要一个可直接粘贴用于调试的 “all” 状态
summary: '`openclaw status` 的 CLI 参考（诊断、探测、使用快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T05:39:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
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

- `--deep` 运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 普通的 `openclaw status` 保持在快速只读路径上，并在跳过记忆检查时将记忆标记为 `not checked`，而不是不可用。繁重的安全审计、插件兼容性和记忆向量探测留给 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 会报告由 `plugins.slots.memory` 选择的主动记忆插件运行时的记忆详情。自定义记忆插件可以保持内置的 `agents.defaults.memorySearch.enabled` 处于禁用状态，并仍然报告自己的文件、分块、向量和 FTS 状态。
- `--usage` 以 `X% left` 格式打印规范化的提供商用量窗口。
- 会话状态输出会将 `Execution:` 与 `Runtime:` 分开。`Execution` 是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你该会话使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 后端，还是 `codex (acp/acpx)` 这类 ACP 后端。请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 了解提供商/模型/运行时的区别。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会在显示前将其反转；当存在基于计数的字段时，它们优先。`model_remains` 响应会优先使用聊天模型条目，在需要时根据时间戳推导窗口标签，并在计划标签中包含模型名称。
- 当当前会话快照较稀疏时，`/status` 可以从最近的转录用量日志中回填 token 和缓存计数器。现有的非零实时值仍然优先于转录回退值。
- `/status` 包含紧凑的 Gateway 网关进程运行时间和主机系统运行时间。
- 当实时会话条目缺少活动运行时模型标签时，转录回退也可以恢复它。如果该转录模型与所选模型不同，status 会根据恢复的运行时模型而不是所选模型来解析上下文窗口。
- 对于提示词大小统计，当会话元数据缺失或较小时，转录回退会优先采用更大的面向提示词的总量，因此自定义提供商会话不会折叠为 `0` token 显示。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
- 当可用时，概览会包含 Gateway 网关 + 节点主机服务安装/运行时状态。
- 概览会包含更新频道 + git SHA（针对源码检出）。
- 更新信息会显示在概览中；如果有可用更新，status 会打印提示以运行 `openclaw update`（参见[更新](/zh-CN/install/updating)）。
- 只读 status 界面（`status`、`status --json`、`status --all`）会在可能时为其目标配置路径解析受支持的 SecretRef。
- 如果配置了受支持的渠道 SecretRef，但它在当前命令路径中不可用，status 会保持只读并报告降级输出，而不是崩溃。面向人的输出会显示诸如 “configured token unavailable in this command path” 这样的警告，JSON 输出则包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，status 会优先使用已解析的快照，并从最终输出中清除临时的 “secret unavailable” 渠道标记。
- `status --all` 包含 Secrets 概览行和诊断部分，该部分会汇总密钥诊断信息（为便于阅读会截断），且不会停止报告生成。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
