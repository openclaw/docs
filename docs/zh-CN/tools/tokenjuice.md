---
read_when:
    - 你希望 OpenClaw 中的 `exec` 或 `bash` 工具结果更简短
    - 你想安装或启用 Tokenjuice 插件
    - 你需要了解 tokenjuice 会修改哪些内容，以及哪些内容会保留原样
summary: 使用可选的 Tokenjuice 插件压缩嘈杂的 Exec 和 bash 工具结果
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-11T21:01:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` 是一个可选的外部插件，可在 `exec` 和 `bash` 命令已经执行后，压缩其冗杂的工具结果。

它更改的是返回的 `tool_result`，而不是命令本身。Tokenjuice 不会重写 shell 输入、重新运行命令或更改退出代码。

目前，这适用于 OpenClaw 内嵌运行，以及 Codex app-server harness 中的 OpenClaw 动态工具。Tokenjuice 会挂接 OpenClaw 的工具结果中间件，并在输出返回活跃的 harness 会话之前对其进行精简。

## 启用插件

安装一次：

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

然后启用它：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效命令：

```bash
openclaw plugins enable tokenjuice
```

如果你更愿意直接编辑配置：

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice 会更改什么

- 在冗杂的 `exec` 和 `bash` 结果反馈到会话之前对其进行压缩。
- 保持原始命令执行不变。
- 应用安全清单策略：精确读取文件内容的结果保持原样，独立的仓库清单命令可以压缩，不安全的混合命令序列则保持原样。
- 保持选择性启用：如果你希望所有输出都逐字保留，请禁用该插件。

## 验证其是否正常工作

1. 启用插件。
2. 启动一个可以调用 `exec` 的会话。
3. 运行一个输出冗杂的命令，例如 `git status`。
4. 检查返回的工具结果是否比原始 shell 输出更短、结构更清晰。

## 禁用插件

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

或者：

```bash
openclaw plugins disable tokenjuice
```

## 相关内容

- [Exec 工具](/zh-CN/tools/exec)
- [思考级别](/zh-CN/tools/thinking)
- [上下文引擎](/zh-CN/concepts/context-engine)
