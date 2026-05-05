---
read_when:
    - 你想快速诊断渠道健康状况 + 最近会话接收者
    - 你想要一个用于调试的可粘贴 “all” 状态
summary: '`openclaw status` 的 CLI 参考（诊断、探测、使用情况快照）'
title: Status
x-i18n:
    generated_at: "2026-05-05T05:56:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

渠道 + 会话的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意事项：

- `--deep` 运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 普通 `openclaw status` 保持在快速只读路径上，并且在跳过记忆检查时将记忆标记为 `not checked`，而不是不可用。繁重的安全审计、插件兼容性和记忆向量探测留给 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 会报告由 `plugins.slots.memory` 选择的主动记忆插件运行时中的记忆详情。自定义记忆插件可以让内置的 `agents.defaults.memorySearch.enabled` 保持禁用，同时仍报告自己的文件、分块、向量和 FTS 状态。
- `--usage` 会将归一化的提供商用量窗口打印为 `X% left`。
- 会话状态输出会将 `Execution:` 与 `Runtime:` 分开。`Execution` 是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你该会话使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 后端，还是类似 `codex (acp/acpx)` 的 ACP 后端。请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，了解提供商/模型/运行时的区别。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余额度，因此 OpenClaw 会在显示前对其取反；存在基于计数的字段时，以这些字段为准。`model_remains` 响应优先使用聊天模型条目，在需要时从时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 当前会话快照稀疏时，`/status` 可以从最近的转录用量日志回填令牌和缓存计数器。现有的非零实时值仍优先于转录回退值。
- `/status` 包含简洁的 Gateway 网关进程运行时间和主机系统运行时间。
- 当实时会话条目缺少活动运行时模型标签时，转录回退也可以恢复该标签。如果该转录模型与所选模型不同，状态会基于恢复的运行时模型而不是所选模型解析上下文窗口。
- 对于提示大小统计，当会话元数据缺失或更小时，转录回退优先使用更大的面向提示的总量，因此自定义提供商会话不会折叠为 `0` 令牌显示。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
- 可用时，概览会包含 Gateway 网关 + 节点主机服务的安装/运行时状态。
- 概览会包含更新渠道 + git SHA（用于源码检出）。
- 更新信息显示在概览中；如果有可用更新，状态会打印提示，让你运行 `openclaw update`（参见[更新](/zh-CN/install/updating)）。
- 只读状态界面（`status`、`status --json`、`status --all`）会在可能时为其目标配置路径解析受支持的 SecretRefs。
- 如果配置了受支持的渠道 SecretRef，但它在当前命令路径中不可用，状态会保持只读并报告降级输出，而不是崩溃。人工可读输出会显示诸如“此命令路径中的已配置令牌不可用”的警告，JSON 输出会包含 `secretDiagnostics`。
- 当命令本地的 SecretRef 解析成功时，状态会优先使用已解析的快照，并从最终输出中清除临时的“密钥不可用”渠道标记。
- `status --all` 包含 Secrets 概览行和诊断部分，用于汇总密钥诊断（为提高可读性会截断），且不会停止生成报告。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
