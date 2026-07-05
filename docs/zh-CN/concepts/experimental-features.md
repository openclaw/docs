---
read_when:
    - 你看到一个 `.experimental` 配置键，并想知道它是否稳定
    - 你想尝试预览版运行时功能，同时避免将它们与常规默认设置混淆
    - 你需要一个位置来查找当前已记录的实验性标志
summary: OpenClaw 中实验性标志的含义，以及当前已记录哪些标志
title: 实验性功能
x-i18n:
    generated_at: "2026-07-05T11:12:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 428c9519a5252941657a0d961506229a1a8b4077ab4553e7727d1ab6a13da62b
    source_path: concepts/experimental-features.md
    workflow: 16
---

实验性功能是显式标志背后的选择性启用预览表面。它们需要更多真实场景验证，之后才会获得稳定默认值或长期有效的契约。

- 默认关闭，除非文档告诉你启用某一项。
- 形状和行为可能比稳定配置变化得更快。
- 如果已有稳定路径，优先使用稳定路径。
- 只有先在较小环境中测试后，才广泛推出。

## 当前已记录的标志

| 表面 | 键 | 适用场景 | 更多 |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时 | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 较小或更严格的本地后端无法承受 OpenClaw 的完整默认工具表面 | [本地模型](/zh-CN/gateway/local-models) |
| 记忆搜索 | `agents.defaults.memorySearch.experimental.sessionMemory` | 你希望 `memory_search` 为先前会话转录建立索引，并接受额外的存储/索引成本 | [记忆配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental) |
| Codex harness | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer` | 你希望原生 Codex 应用服务器 0.132.0 或更新版本以 OpenClaw 沙箱支持的 exec-server 为目标，而不是禁用代码模式 | [Codex harness reference](/zh-CN/plugins/codex-harness-reference#sandboxed-native-execution) |
| 结构化规划工具 | `tools.experimental.planTool` | 你希望在兼容的运行时和 UI 中暴露结构化 `update_plan` 工具，用于多步骤工作跟踪 | [Gateway 配置参考](/zh-CN/gateway/config-tools#toolsexperimental) |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 会从每轮 Agent 的工具表面中移除三个默认工具：`browser`、`cron` 和 `message`。当尚未设置 `tools.toolSearch` 时，它还会默认为插件/MCP/客户端工具目录启用结构化工具搜索（`tool_search`、`tool_describe`、`tool_call`），这样这些目录会保持在提示之外，而不是被直接倾倒进去。需要直接 `message` 传递的运行会保持直接传递，而不是采用精简模式的工具搜索默认值。使用 `agents.list[].experimental.localModelLean` 将其限定到一个 Agent。

如果你已经全局调优工具搜索，OpenClaw 会保持该配置不变。设置 `tools.toolSearch: false` 可退出精简模式的工具搜索默认值。

### 为什么是这三个工具

`browser`、`cron` 和 `message` 在默认运行时中拥有最长的描述和最多的参数形状。在小上下文或更严格的 OpenAI 兼容后端上，这会造成以下差异：

- 工具 schema 能放入提示，而不是挤占对话历史。
- 模型选择正确工具，而不是因为太多相似 schema 而发出格式错误的工具调用。
- Chat Completions 适配器保持在结构化输出限制内，而不是因工具调用载荷大小收到 400。

移除它们只会缩短直接工具列表。模型仍然拥有 `read`、`write`、`edit`、`exec`、`apply_patch`、Web 搜索/获取（配置后）、记忆以及会话/Agent 工具。除非你设置 `tools.toolSearch: false`，否则额外目录仍可通过工具搜索访问。

### 何时开启

在你证明模型可以与 Gateway 网关通信，但完整 Agent 轮次表现异常后，启用精简模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 正常 Agent 轮次因格式错误的工具调用、过大的提示或模型忽略其工具而失败。
3. 切换 `localModelLean: true` 后故障消失。

### 何时保持关闭

如果你的后端能干净地处理完整默认运行时，请保持关闭。这是为需要较小工具表面的本地栈提供的权宜措施，不是托管模型或资源充足的本地设备的默认值。

精简模式不会替代 `tools.profile`、`tools.allow`/`tools.deny`，也不会替代模型 `compat.supportsTools: false` 逃生口。若要为特定 Agent 提供永久更窄的工具表面，优先使用这些稳定旋钮。

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

仅针对一个 Agent：

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

更改标志后重启 Gateway 网关。

## 实验性不意味着隐藏

实验性功能应当在文档和配置路径本身中明确说明，而不是隐藏在看似稳定的默认旋钮后面。

## 相关

- [功能](/zh-CN/concepts/features)
- [发布渠道](/zh-CN/install/development-channels)
