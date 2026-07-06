---
read_when:
    - 你看到一个 `.experimental` 配置键，并想知道它是否稳定
    - 你想试用预览版运行时功能，同时避免将它们与普通默认设置混淆
    - 你想要一个地方来查找当前文档中记录的实验性标志
summary: OpenClaw 中的实验性标志含义以及当前已记录的标志
title: 实验性功能
x-i18n:
    generated_at: "2026-07-06T10:48:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ac12f9e754afd369a1be0853f8023e479fe51777aa42b73f6245223f07053152
    source_path: concepts/experimental-features.md
    workflow: 16
---

实验性功能是位于显式标志之后的可选预览界面。它们需要更多真实场景验证，才会获得稳定默认值或长期契约。

- 默认关闭，除非文档告诉你启用某项功能。
- 形态和行为可能比稳定配置变化更快。
- 如果已经存在稳定路径，优先使用稳定路径。
- 先在较小环境中测试，再进行大范围推出。

## 当前记录在文档中的标志

| 界面 | 键 | 适用场景 | 更多 |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时 | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 较小或更严格的本地后端无法处理 OpenClaw 的完整默认工具界面 | [本地 Models](/zh-CN/gateway/local-models) |
| 记忆搜索 | `agents.defaults.memorySearch.experimental.sessionMemory` | 你希望 `memory_search` 索引先前的会话转录，并接受额外的存储/索引成本 | [记忆配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental) |
| Codex harness | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer` | 你希望原生 Codex app-server 0.132.0 或更新版本指向一个由 OpenClaw 沙箱支持的 exec-server，而不是禁用代码模式 | [Codex harness reference](/zh-CN/plugins/codex-harness-reference#sandboxed-native-execution) |
| 结构化规划工具 | `tools.experimental.planTool` | 你希望在兼容的运行时和 UI 中暴露结构化 `update_plan` 工具，用于多步骤工作跟踪 | [Gateway 配置参考](/zh-CN/gateway/config-tools#toolsexperimental) |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 会在每个轮次中从智能体的直接界面移除重量级可选工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`。显式允许或交付所需的工具仍然可用，不过 Tool Search 可能会将它们编入目录，而不是直接暴露。精简模式还会在 `tools.toolSearch` 尚未设置时，默认将插件/MCP/客户端目录设为结构化 Tool Search（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 将此限定到一个智能体。

如果你已经全局调优 Tool Search，OpenClaw 会保持该配置不变。设置 `tools.toolSearch: false` 可退出精简模式的 Tool Search 默认值。

### 为什么是这些工具

这些工具的描述最长、参数形态最宽泛，或最有可能让小模型偏离正常的编码和对话路径。对于小上下文或更严格的 OpenAI 兼容后端，这会造成以下差异：

- 工具模式能够放入提示词，而不是挤占对话历史。
- 模型选择正确工具，而不是因太多相似模式而发出格式错误的工具调用。
- Chat Completions 适配器保持在结构化输出限制内，而不是因工具调用载荷大小返回 400。

移除它们只会缩短直接工具列表。模型仍然拥有 `read`、`write`、`edit`、`exec`、`apply_patch`、图像理解、Web 搜索/获取（配置后）、记忆，以及会话/智能体工具。除非你设置 `tools.toolSearch: false`，额外目录仍可通过 Tool Search 访问；显式工具允许可让精简智能体重新加入经过裁剪的工作流。

### 何时开启

在你证明模型可以与 Gateway 网关通信，但完整智能体轮次行为异常后，启用精简模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 普通智能体轮次因格式错误的工具调用、过大的提示词或模型忽略其工具而失败。
3. 切换 `localModelLean: true` 后故障消失。

### 何时保持关闭

如果你的后端可以干净地处理完整默认运行时，请保持关闭。这是为需要较小工具界面的本地技术栈提供的权宜方案，不是托管模型或资源充足的本地设备的默认值。

精简模式不会替代 `tools.profile`、`tools.allow`/`tools.deny`，也不会替代模型 `compat.supportsTools: false` 逃生口。若要在特定智能体上使用永久更窄的工具界面，优先使用这些稳定旋钮。

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

仅用于一个智能体：

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

更改标志后重启 Gateway 网关。精简过滤会移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`，除非你使用 `tools.allow` 或 `tools.alsoAllow` 显式保留它们；Tool Search 仍可能将保留的工具编入目录，而不是直接暴露。

## 实验性不等于隐藏

实验性功能应在文档和配置路径本身中明确说明，而不是隐藏在看似稳定的默认旋钮之后。

## 相关

- [功能](/zh-CN/concepts/features)
- [发布渠道](/zh-CN/install/development-channels)
