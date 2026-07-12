---
read_when:
    - 你想快速诊断渠道健康状态和最近的会话接收方
    - 你需要一个可直接粘贴、用于调试的“全部”状态报告
summary: '`openclaw status` 的 CLI 参考（诊断、探测、用量快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-07-11T20:25:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

渠道和会话诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| 标志                    | 说明                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `--all`                 | 完整诊断（只读，可直接粘贴）。包括安全审计、插件兼容性和记忆向量探测。                                    |
| `--deep`                | 运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。同时启用安全审计。                     |
| `--usage`               | 以 `剩余 X%` 的形式输出标准化的提供商用量窗口。                                                           |
| `--json`                | 机器可读输出。                                                                                            |
| `--verbose` / `--debug` | 在报告之前额外输出原始 Gateway 网关目标解析结果。                                                         |

普通的 `openclaw status` 始终使用快速只读路径，并在跳过记忆检查时将记忆标记为
`未检查`，而不是不可用。繁重的安全审计、插件兼容性和记忆向量探测则由
`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`
和 `openclaw memory status --deep` 执行。

## 会话和模型解析

- 会话状态输出将 `执行：` 与 `运行时：` 分开显示。`执行`
  表示沙箱路径（`direct`、`docker/*`），而 `运行时` 则说明
  会话使用的是 `OpenClaw 默认`、`OpenAI Codex`、CLI
  后端，还是 `codex (acp/acpx)` 等 ACP 后端。有关提供商、模型和运行时
  之间的区别，请参阅
  [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- 当当前会话快照信息较少时，`/status` 可以从最近的对话记录用量日志中回填
  token 和缓存计数器。现有的非零实时值仍优先于对话记录中的回退值。
- 当实时会话条目缺少当前运行时模型标签时，对话记录回退也可以恢复该标签。
  如果对话记录中的模型与所选模型不同，状态将根据恢复的运行时模型而非
  所选模型解析上下文窗口。
- 计算提示词大小时，如果会话元数据缺失或数值较小，对话记录回退会优先采用
  较大的提示词相关总量，从而避免自定义提供商会话的 token 显示降为 `0`。
- 当会话固定使用的模型与配置的主模型不同时，状态会同时输出这两个值、原因
  （`会话覆盖`）以及提示 `/model default`。配置的主模型适用于新会话或
  未固定模型的会话；现有的已固定会话会继续使用其会话选择，直到该设置被清除。
- 配置多个智能体时，输出会包括每个智能体的会话存储。

## 用量和配额

- `--usage` 以 `剩余 X%` 的形式输出标准化的提供商用量窗口。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余配额，
  因此 OpenClaw 会在显示前将其反转；如果存在基于计数的字段，则优先使用。
  对于 `model_remains` 响应，会优先选择聊天模型条目，必要时根据时间戳
  推导窗口标签，并在套餐标签中包含模型名称。
- 模型定价刷新失败会显示为可选的定价警告。
  这并不表示 Gateway 网关或渠道运行异常。

## 概览和更新状态

- 如果相关信息可用，概览会包括 Gateway 网关和节点主机服务的安装与运行时状态，
  以及精简的 Gateway 网关进程运行时长和主机系统运行时长。
- 概览会包括更新渠道和 git SHA（对于源码检出）。
- 更新信息显示在概览中；如果有可用更新，状态会提示运行
  `openclaw update`（请参阅[更新](/zh-CN/install/updating)）。

## 密钥

- 只读状态界面（`status`、`status --json`、`status --all`）
  会尽可能为其目标配置路径解析受支持的 SecretRef。
- 如果已配置受支持的渠道 SecretRef，但当前命令路径中无法使用，
  状态会保持只读，并报告降级输出，而不是崩溃。人类可读输出会显示
  “当前命令路径中无法使用已配置的令牌”等警告，JSON 输出则会包含
  `secretDiagnostics`。
- 当命令本地的 SecretRef 解析成功时，状态会优先使用解析后的快照，并从最终输出中
  清除临时的“密钥不可用”渠道标记。
- `status --all` 包含密钥概览行和诊断部分，在不中止报告生成的情况下
  汇总密钥诊断信息（为便于阅读会进行截断）。

## 记忆

`status --json --all` 会报告由 `plugins.slots.memory` 选择的主动记忆插件
运行时所提供的记忆详情。自定义记忆插件可以让内置的
`agents.defaults.memorySearch.enabled` 保持禁用，同时仍报告其自身的
文件、分块、向量和 FTS 状态。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/gateway/doctor)
