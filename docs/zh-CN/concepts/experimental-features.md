---
read_when:
    - 你看到一个 `.experimental` 配置键名，并想知道它是否稳定
    - 你想试用预览版运行时功能，而不把它们与常规默认设置混淆
    - 你想要一个地方，用来查找当前文档中记录的实验性标志
summary: OpenClaw 中实验性标志的含义，以及当前记录了哪些标志
title: 实验性功能
x-i18n:
    generated_at: "2026-06-27T01:48:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

OpenClaw 中的实验性功能是**可选择启用的预览表面**。它们位于显式标志之后，因为在值得成为稳定默认值或长期公共契约之前，它们仍需要真实环境中的更多验证。

请将它们与普通配置区别对待：

- 除非相关文档建议你尝试，否则保持**默认关闭**。
- 预期其**形状和行为会变化**得比稳定配置更快。
- 如果已有稳定路径，优先使用稳定路径。
- 如果你要大范围推出 OpenClaw，请先在较小环境中测试实验性标志，再将其写入共享基线。

## 当前已记录的标志

| 表面                     | 键                                                                                         | 适用场景                                                                                                                          | 更多                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时           | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 较小或更严格的本地后端无法处理 OpenClaw 的完整默认工具表面                                                                       | [本地模型](/zh-CN/gateway/local-models)                                                             |
| 记忆搜索                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 索引先前的会话转录，并接受额外的存储和索引成本                                                            | [记忆配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental)                   |
| Codex harness            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更高版本指向由 OpenClaw 沙箱支持的 exec-server，而不是禁用代码模式                         | [Codex harness reference](/zh-CN/plugins/codex-harness-reference#sandboxed-native-execution)        |
| 结构化规划工具           | `tools.experimental.planTool`                                                              | 你希望在兼容的运行时和 UI 中暴露结构化 `update_plan` 工具，用于多步骤工作跟踪                                                     | [Gateway 网关配置参考](/zh-CN/gateway/config-tools#toolsexperimental)                              |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 是面向较弱本地模型设置的压力释放阀。启用后，OpenClaw 会在每个轮次中从智能体的工具表面移除三个默认工具：`browser`、`cron` 和 `message`。当未显式配置 `tools.toolSearch` 时，它还会默认让该运行使用结构化工具搜索控件，因此更大的插件、MCP 或客户端工具目录会保留在 `tool_search`、`tool_describe` 和 `tool_call` 之后，而不是直接塞进提示词。需要直接 `message` 投递的运行会保持该工具为直接工具，而不是启用精简模式的工具搜索默认值。使用 `agents.list[].experimental.localModelLean` 可为某个已配置的智能体启用或禁用相同行为。

### 为什么是这三个工具

这三个工具在默认 OpenClaw 运行时中具有最长的描述和最多的参数形状。在小上下文或更严格的 OpenAI 兼容后端上，这会造成以下差异：

- 工具 schema 能干净地放入提示词，还是挤占对话历史。
- 模型选择正确工具，还是因为相似 schema 过多而发出格式错误的工具调用。
- Chat Completions 适配器保持在服务器的结构化输出限制内，还是因工具调用载荷大小触发 400。

移除它们不会静默重接 OpenClaw，它只会缩短直接工具列表。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、Web 搜索/获取（配置后）、记忆以及会话/智能体工具。除非你显式设置 `tools.toolSearch: false`，否则额外目录仍可通过工具搜索调用。

### 何时启用

当你已经证明模型可以与 Gateway 网关通信，但完整智能体轮次表现异常时，启用精简模式。典型信号链如下：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 普通智能体轮次因工具调用格式错误、提示词过大或模型忽略工具而失败。
3. 切换 `localModelLean: true` 后故障消失。

### 何时保持关闭

如果你的后端能干净处理完整默认运行时，请保持关闭。精简模式是变通方案，不是默认值。它存在是因为某些本地栈需要更小的工具表面才能正常表现；托管模型和资源充足的本地设备不需要它。

精简模式也不会替代 `tools.profile`、`tools.allow`/`tools.deny` 或模型 `compat.supportsTools: false` 逃生口。如果你需要为某个特定智能体提供永久更窄的工具表面，请优先使用这些稳定旋钮，而不是实验性标志。

如果你已经全局调整工具搜索，OpenClaw 会保留该操作员配置。设置 `tools.toolSearch: false` 可退出精简模式的工具搜索默认值。

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

更改标志后重启 Gateway 网关，然后使用以下命令确认裁剪后的工具列表：

```bash
openclaw status --deep
```

深度状态输出会列出活动智能体工具；当精简模式开启时，`browser`、`cron` 和 `message` 应不存在，除非当前投递模式强制使用直接 `message` 回复。

## 实验性不等于隐藏

如果某项功能是实验性的，OpenClaw 应该在文档和配置路径本身中清楚说明。它**不应该**把预览行为塞进看起来稳定的默认旋钮里，并假装这是正常做法。配置表面就是这样变得混乱的。

## 相关

- [功能](/zh-CN/concepts/features)
- [发布频道](/zh-CN/install/development-channels)
