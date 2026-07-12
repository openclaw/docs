---
read_when:
    - 你看到一个 `.experimental` 配置键，想知道它是否稳定
    - 你想尝试预览版运行时功能，同时避免将其与常规默认设置混淆
    - 你希望有一个地方可以查找当前已有文档说明的实验性标志。
summary: OpenClaw 中实验性标志的含义，以及目前已记录的标志有哪些
title: 实验性功能
x-i18n:
    generated_at: "2026-07-11T20:27:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

实验性功能是需要通过显式标志选择启用的预览功能。它们需要经过更多实际使用验证，才能获得稳定的默认设置或长期有效的契约。

- 默认关闭，除非文档要求你启用。
- 其结构和行为的变化速度可能快于稳定配置。
- 如果已有稳定路径，请优先使用稳定路径。
- 只有先在较小的环境中完成测试，才能广泛部署。

## 当前已记录的标志

| 功能范围                 | 键                                                                                         | 适用场景                                                                                                                          | 更多信息                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时           | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 较小或限制更严格的本地后端无法处理 OpenClaw 完整的默认工具功能范围                                                               | [本地模型](/zh-CN/gateway/local-models)                                                             |
| 记忆搜索                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 为之前的会话记录建立索引，并愿意承担额外的存储和索引成本                                                  | [记忆配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental)                   |
| Codex harness            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更高版本使用由 OpenClaw 沙箱支持的 exec-server，而不是禁用代码模式                           | [Codex harness reference](/zh-CN/plugins/codex-harness-reference#sandboxed-native-execution)        |
| 结构化规划工具           | `tools.experimental.planTool`                                                              | 你希望在兼容的运行时和 UI 中公开结构化 `update_plan` 工具，以跟踪多步骤工作                                                       | [Gateway 配置参考](/zh-CN/gateway/config-tools#toolsexperimental)                                   |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 会在每轮交互中从智能体的直接功能范围移除重量级可选工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`。显式允许或交付所需的工具仍然可用，但工具搜索可能会将其列入目录，而不是直接公开。未设置 `tools.toolSearch` 时，精简模式还会默认让插件、MCP 和客户端目录使用结构化工具搜索（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 可将此设置限定到单个智能体。

如果你已在全局调整工具搜索，OpenClaw 会保留该配置不变。设置 `tools.toolSearch: false` 可退出精简模式的工具搜索默认行为。

在结构化 `tools` 模式下，精简运行会让 `exec` 与工具搜索控制项一起保持直接可见，使针对编码优化的本地模型仍可选择其熟悉的 shell 路径。此设置只改变 schema 的可见性：常规工具策略、沙箱隔离和 Exec 审批仍然适用。显式的 `code` 和 `directory` 模式会保留其正常的压缩行为。

### 为什么选择这些工具

这些工具具有最长的描述、最广泛的参数结构，或最容易分散小型模型对常规编码和对话路径的注意力。对于上下文较小或限制更严格的 OpenAI 兼容后端，这决定了以下差异：

- 工具 schema 能够装入提示词，还是挤占对话历史的空间。
- 模型能够选择正确的工具，还是因过多相似的 schema 而生成格式错误的工具调用。
- Chat Completions 适配器能够保持在结构化输出限制以内，还是因工具调用载荷过大而返回 400 错误。

移除这些工具只会缩短直接工具列表。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、图像理解、Web 搜索/获取（已配置时）、记忆以及会话/智能体工具。除非设置 `tools.toolSearch: false`，否则仍可通过工具搜索访问其他目录；通过显式允许工具，可让精简智能体重新使用经过裁剪的工作流。

### 何时启用

在确认模型能够与 Gateway 网关通信，但完整智能体轮次出现异常后，再启用精简模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 正常智能体轮次因工具调用格式错误、提示词过大或模型忽略工具而失败。
3. 启用 `localModelLean: true` 后故障消失。

### 何时保持关闭

如果你的后端可以正常处理完整的默认运行时，请保持关闭。它是为需要较小工具功能范围的本地技术栈提供的临时解决方案，而不是托管模型或资源充足的本地设备的默认设置。

精简模式不能替代 `tools.profile`、`tools.allow`/`tools.deny` 或模型的 `compat.supportsTools: false` 应急选项。如果要永久缩小特定智能体的工具功能范围，请优先使用这些稳定的配置项。

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

仅针对一个智能体：

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

更改此标志后重启 Gateway 网关。除非使用 `tools.allow` 或 `tools.alsoAllow` 显式保留，否则精简过滤会移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`；工具搜索仍可能将保留的工具列入目录，而不是直接公开。

## 实验性并不意味着隐藏

实验性功能应在文档和配置路径本身中明确标示，而不是隐藏在看似稳定的默认配置项之后。

## 相关内容

- [功能](/zh-CN/concepts/features)
- [发布渠道](/zh-CN/install/development-channels)
