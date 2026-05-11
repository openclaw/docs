---
read_when:
    - 你想快速诊断渠道健康状态 + 最近会话接收者
    - 你想要一个用于调试的可粘贴“all”状态
summary: '`openclaw status` 的 CLI 参考（诊断、探针、使用情况快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:26:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
    source_path: cli/status.md
    workflow: 16
---

用于渠道 + 会话的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意：

- `--deep` 会运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 普通的 `openclaw status` 会走快速只读路径；当它跳过记忆检查时，会将记忆标记为 `not checked`，而不是不可用。繁重的安全审计、插件兼容性和记忆向量探测会留给 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 会报告由 `plugins.slots.memory` 选择的主动记忆插件运行时提供的记忆详情。自定义记忆插件可以让内置的 `agents.defaults.memorySearch.enabled` 保持禁用，同时仍报告自己的文件、分块、向量和 FTS 状态。
- `--usage` 会以 `X% left` 形式打印规范化的提供商使用窗口。
- 会话状态输出会分开显示 `Execution:` 和 `Runtime:`。`Execution` 是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你该会话使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 后端，还是像 `codex (acp/acpx)` 这样的 ACP 后端。有关提供商/模型/运行时的区别，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余额度，因此 OpenClaw 会在显示前将其反转；如果存在基于计数的字段，则优先使用这些字段。`model_remains` 响应优先使用聊天模型条目，在需要时从时间戳推导窗口标签，并在计划标签中包含模型名称。
- 当当前会话快照较稀疏时，`/status` 可以从最近的 transcript 使用日志回填 token 和缓存计数。现有的非零实时值仍优先于 transcript 回退值。
- `/status` 包含紧凑的 Gateway 网关进程运行时间和主机系统运行时间。
- 当实时会话条目缺少活动运行时模型标签时，transcript 回退也可以恢复该标签。如果该 transcript 模型不同于所选模型，status 会基于恢复出的运行时模型而不是所选模型来解析上下文窗口。
- 对于提示大小核算，当会话元数据缺失或较小时，transcript 回退会优先使用更大的面向提示的总量，因此自定义提供商会话不会退化为显示 `0` token。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
- 当可用时，概览会包含 Gateway 网关 + 节点主机服务的安装/运行时状态。
- 概览会包含更新频道 + git SHA（用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，status 会打印提示以运行 `openclaw update`（参见[更新](/zh-CN/install/updating)）。
- 模型价格刷新失败会显示为可选的价格警告。它们并不意味着 Gateway 网关或渠道不健康。
- 只读 status 界面（`status`、`status --json`、`status --all`）会尽可能解析其目标配置路径支持的 SecretRefs。
- 如果配置了受支持渠道的 SecretRef，但它在当前命令路径中不可用，status 会保持只读并报告降级输出，而不是崩溃。人工可读输出会显示类似 “configured token unavailable in this command path” 的警告，JSON 输出会包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，status 会优先使用已解析的快照，并从最终输出中清除临时的 “secret unavailable” 渠道标记。
- `status --all` 包含一行 Secrets 概览，以及一个诊断章节，用于汇总密钥诊断（为可读性会截断），且不会停止报告生成。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
