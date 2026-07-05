---
read_when:
    - 你想快速诊断渠道健康状态和最近的会话接收者
    - 你想要一个可粘贴的 “all” 状态用于调试
summary: '`openclaw status` 的 CLI 参考（诊断、探针、使用情况快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-07-05T11:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

渠道 + 会话诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| 标志                    | 描述                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--all`                 | 完整诊断（只读，可粘贴）。包括安全审计、插件兼容性和记忆向量探测。 |
| `--deep`                | 运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。同时启用安全审计。         |
| `--usage`               | 以 `X% left` 打印标准化的提供商用量窗口。                                                          |
| `--json`                | 机器可读输出。                                                                                        |
| `--verbose` / `--debug` | 在报告前同时打印原始 Gateway 网关目标解析。                                                 |

普通 `openclaw status` 会停留在快速只读路径，并在跳过记忆检查时将记忆标记为
`not checked`，而不是不可用。较重的安全审计、插件兼容性和记忆向量探测留给
`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`
和 `openclaw memory status --deep`。

## 会话和模型解析

- 会话状态输出将 `Execution:` 与 `Runtime:` 分开。`Execution`
  是沙箱路径（`direct`、`docker/*`），而 `Runtime` 会告诉你
  会话是在使用 `OpenClaw Default`、`OpenAI Codex`、CLI
  后端，还是类似 `codex (acp/acpx)` 的 ACP 后端。请参阅
  [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，了解提供商/模型/运行时
  的区别。
- 当当前会话快照较稀疏时，`/status` 可以从最近的转录用量日志中回填 token
  和缓存计数器。现有的非零实时值仍优先于转录回退值。
- 当实时会话条目缺少活动运行时模型标签时，转录回退也可以恢复该标签。如果该转录模型不同于所选模型，状态会根据恢复出的运行时模型解析上下文窗口，而不是根据所选模型解析。
- 对于提示大小统计，当会话元数据缺失或较小时，转录回退会优先使用更大的面向提示的总量，因此自定义提供商会话不会坍缩为 `0` token 显示。
- 当会话固定到的模型不同于配置的主模型时，状态会打印两个值、原因（`session override`）以及提示 `/model default`。配置的主模型适用于新的或未固定的会话；现有固定会话会保留其会话选择，直到被清除。
- 当配置了多个智能体时，输出会包括每个智能体的会话存储。

## 用量和配额

- `--usage` 以 `X% left` 打印标准化的提供商用量窗口。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余配额，
  因此 OpenClaw 会在显示前将其取反；存在基于计数的字段时，它们优先。
  `model_remains` 响应会优先使用聊天模型条目，在需要时从时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 模型定价刷新失败会显示为可选的定价警告。它们不表示 Gateway 网关或渠道不健康。

## 概览和更新状态

- 可用时，概览会包括 Gateway 网关 + 节点主机服务的安装/运行时状态，以及紧凑的 Gateway 网关进程运行时间和主机系统运行时间。
- 概览会包括更新频道 + git SHA（用于源码检出）。
- 更新信息会显示在概览中；如果有可用更新，状态会打印提示，建议运行 `openclaw update`（参见[更新](/zh-CN/install/updating)）。

## 密钥

- 只读状态界面（`status`、`status --json`、`status --all`）
  会在可能时为其目标配置路径解析受支持的 SecretRefs。
- 如果配置了受支持的渠道 SecretRef，但在当前命令路径中不可用，状态会保持只读并报告降级输出，而不是崩溃。面向人的输出会显示类似“配置的 token 在此命令路径中不可用”的警告，JSON 输出会包括
  `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，状态会优先使用解析后的快照，并从最终输出中清除临时的“secret unavailable”渠道标记。
- `status --all` 包括一个密钥概览行和一个诊断部分，用于汇总密钥诊断信息（为便于阅读会截断），且不会停止报告生成。

## 记忆

`status --json --all` 会报告由 `plugins.slots.memory` 选择的活动记忆插件运行时中的记忆详情。自定义记忆插件可以保持内置的 `agents.defaults.memorySearch.enabled` 禁用，同时仍报告它们自己的文件、分块、向量和 FTS 状态。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
