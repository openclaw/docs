---
read_when:
    - 你想要启用或配置代码执行
    - 你想要在没有本地 shell 访问权限的情况下进行远程分析
    - 你想将 `x_search` 或 `web_search` 与远程 Python 分析结合使用
summary: code_execution —— 使用 xAI 运行沙箱隔离的远程 Python 分析
title: 代码执行
x-i18n:
    generated_at: "2026-04-27T07:13:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` 在 xAI 的 Responses API 上运行沙箱隔离的远程 Python 分析。
这与本地 [`exec`](/zh-CN/tools/exec) 不同：

- `exec` 在你的机器或节点上运行 shell 命令
- `code_execution` 在 xAI 的远程沙箱中运行 Python

在以下场景中使用 `code_execution`：

- 计算
- 制表
- 快速统计
- 图表式分析
- 分析由 `x_search` 或 `web_search` 返回的数据

当你需要本地文件、你的 shell、你的仓库或已配对设备时，**不要**使用它。此类情况请使用 [`exec`](/zh-CN/tools/exec)。

## 设置

你需要一个 xAI API 密钥。以下任一方式都可以：

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

## 如何使用

自然地提出请求，并明确说明分析意图：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

该工具在内部只接受一个 `task` 参数，因此智能体应在一个提示中发送完整的分析请求以及所有内联数据。

## 限制

- 这是远程 xAI 执行，不是本地进程执行。
- 它应被视为临时分析，而不是持久化笔记本。
- 不要假设它可以访问本地文件或你的工作区。
- 对于最新的 X 数据，请先使用 [`x_search`](/zh-CN/tools/web#x_search)。

## 相关内容

- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)
- [apply_patch 工具](/zh-CN/tools/apply-patch)
- [Web 工具](/zh-CN/tools/web)
- [xAI](/zh-CN/providers/xai)
