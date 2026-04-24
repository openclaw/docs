---
read_when:
    - 你想启用或配置 code_execution
    - 你想在没有本地 shell 访问权限的情况下进行远程分析
    - 你想将 x_search 或 web_search 与远程 Python 分析结合使用
summary: code_execution —— 使用 xAI 运行沙箱隔离的远程 Python 分析
title: 代码执行
x-i18n:
    generated_at: "2026-04-24T03:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` 会在 xAI 的 Responses API 上运行沙箱隔离的远程 Python 分析。
这与本地的 [`exec`](/zh-CN/tools/exec) 不同：

- `exec` 在你的机器或 node 上运行 shell 命令
- `code_execution` 在 xAI 的远程沙箱中运行 Python

适合在以下场景使用 `code_execution`：

- 计算
- 制表
- 快速统计
- 图表风格分析
- 分析由 `x_search` 或 `web_search` 返回的数据

如果你需要本地文件、你的 shell、你的仓库或已配对的
设备，**不要**使用它。这种情况请使用 [`exec`](/zh-CN/tools/exec)。

## 设置

你需要一个 xAI API key。以下任意一种都可以：

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

示例：

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## 使用方式

自然地提问，并明确表达分析意图：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

该工具在内部只接收一个 `task` 参数，因此智能体应在一个提示中发送
完整的分析请求以及任何内联数据。

## 限制

- 这是远程 xAI 执行，不是本地进程执行。
- 应将其视为一次性的临时分析，而不是持久化笔记本。
- 不要假设它能访问本地文件或你的工作区。
- 如果你需要最新的 X 数据，请先使用 [`x_search`](/zh-CN/tools/web#x_search)。

## 相关内容

- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)
- [apply_patch 工具](/zh-CN/tools/apply-patch)
- [Web 工具](/zh-CN/tools/web)
- [xAI](/zh-CN/providers/xai)
