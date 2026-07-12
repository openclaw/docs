---
read_when:
    - 你看到一个 `.experimental` 配置键，并想知道它是否稳定
    - 你想尝试预览版运行时功能，同时避免将它们与常规默认设置混淆
    - 你希望在一个地方找到当前已记录的所有实验性标志。
summary: OpenClaw 中的实验性标志是什么意思，以及目前记录了哪些标志
title: 实验性功能
x-i18n:
    generated_at: "2026-07-12T14:25:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

实验性功能是通过显式标志选择启用的预览功能。在获得稳定的默认设置或长期契约之前，它们需要经过更多实际应用的检验。

- 默认关闭，除非文档说明需要启用。
- 其结构和行为可能比稳定配置变化得更快。
- 如果已有稳定的实现路径，请优先使用。
- 只有先在较小的环境中完成测试后，才能广泛部署。

## 当前有文档说明的标志

| 功能                     | 键                                                                                         | 适用场景                                                                                                                          | 更多信息                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时           | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 较小或限制更严格的本地后端无法处理 OpenClaw 完整的默认工具界面                                                                    | [本地模型](/zh-CN/gateway/local-models)                                                             |
| 记忆搜索                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 为先前的会话记录建立索引，并愿意承担额外的存储和索引成本                                                    | [记忆配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental)                   |
| Codex harness            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更高版本以 OpenClaw 沙箱支持的 exec-server 为目标，而不是禁用代码模式                         | [Codex harness reference](/zh-CN/plugins/codex-harness-reference#sandboxed-native-execution)        |
| 结构化规划工具           | `tools.experimental.planTool`                                                              | 你希望在兼容的运行时和 UI 中公开结构化 `update_plan` 工具，以跟踪多步骤工作                                                        | [Gateway 配置参考](/zh-CN/gateway/config-tools#toolsexperimental)                                   |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 会在每轮中从智能体的直接界面移除重量级可选工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`。明确允许或交付所需的工具仍然可用，但工具搜索可能会将它们收录到目录中，而不是直接公开。未设置 `tools.toolSearch` 时，精简模式还会默认让插件/MCP/客户端目录使用结构化工具搜索（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 可将其限定到单个智能体。

如果你已在全局调整工具搜索，OpenClaw 会保持该配置不变。设置 `tools.toolSearch: false` 可选择退出精简模式的工具搜索默认设置。

在结构化 `tools` 模式中，精简运行会让 `exec` 与工具搜索控件一起保持直接可见，以便针对编码优化的本地模型仍可选择其熟悉的 shell 路径。这只会改变 schema 的可见性：常规工具策略、沙箱隔离和 Exec 审批仍然适用。显式的 `code` 和 `directory` 模式会保持其正常的压缩行为。

### 为什么选择这些工具

这些工具的描述最冗长、参数结构最宽泛，或最有可能让小型模型偏离常规的编码和对话路径。对于上下文较小或限制更严格的 OpenAI 兼容后端，这决定了以下差异：

- 工具 schema 能够容纳于提示词中，还是会挤占对话历史的空间。
- 模型能够选择正确的工具，还是会因存在太多相似的 schema 而发出格式错误的工具调用。
- Chat Completions 适配器能够保持在结构化输出限制之内，还是会因工具调用有效负载过大而返回 400。

移除这些工具只会缩短直接工具列表。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、图像理解、Web 搜索/获取（配置后）、记忆以及会话/智能体工具。除非设置 `tools.toolSearch: false`，否则仍可通过工具搜索访问其他目录；显式允许工具可以让精简智能体重新使用经过裁剪的工作流。

### 何时启用

确认模型能与 Gateway 网关通信，但完整的智能体轮次行为异常后，再启用精简模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 常规智能体轮次因工具调用格式错误、提示词过大或模型忽略工具而失败。
3. 切换为 `localModelLean: true` 后故障消失。

### 何时保持关闭

如果你的后端能够正常处理完整的默认运行时，请保持关闭。它是为需要较小工具界面的本地技术栈提供的变通方案，不是托管模型或资源充足的本地设备的默认设置。

精简模式不能替代 `tools.profile`、`tools.allow`/`tools.deny` 或模型的 `compat.supportsTools: false` 应急选项。若要永久缩小特定智能体的工具界面，请优先使用这些稳定配置项。

### 启用

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

仅为一个智能体启用：

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

更改标志后重启 Gateway 网关。除非使用 `tools.allow` 或 `tools.alsoAllow` 显式保留，否则精简筛选会移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`；工具搜索仍可能将保留的工具收录到目录中，而不是直接公开。

## 实验性并不意味着隐藏

实验性功能应当在文档和配置路径本身中明确说明，而不是隐藏在看似稳定的默认配置项背后。

## 相关内容

- [功能](/zh-CN/concepts/features)
- [发布渠道](/zh-CN/install/development-channels)
