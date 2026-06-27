---
read_when:
    - 你希望 OpenClaw 中的 `exec` 或 `bash` 工具结果更短
    - 你想安装或启用 Tokenjuice 插件
    - 你需要了解 tokenjuice 会更改什么，以及它会保留哪些原始内容
summary: 使用可选的 Tokenjuice 插件压缩冗长的 exec 和 bash 工具结果
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T03:34:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` 是一个可选的外部插件，会在命令已经运行后压缩嘈杂的 `exec` 和 `bash`
工具结果。

它改变返回的 `tool_result`，而不是命令本身。Tokenjuice 不会
重写 shell 输入、重新运行命令或更改退出代码。

目前这适用于 Codex app-server harness 中的 OpenClaw 嵌入式运行和 OpenClaw 动态工具。Tokenjuice 会挂接 OpenClaw 的工具结果中间件，并在输出返回到活动 harness 会话之前对其进行裁剪。

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

如果你更喜欢直接编辑配置：

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

- 在嘈杂的 `exec` 和 `bash` 结果反馈回会话之前对其进行压缩。
- 保持原始命令执行不变。
- 保留精确的文件内容读取，以及 tokenjuice 应保持原始输出的其他命令。
- 保持选择启用：如果你希望处处使用逐字输出，请禁用该插件。

## 验证它是否正常工作

1. 启用插件。
2. 启动一个可以调用 `exec` 的会话。
3. 运行一个嘈杂的命令，例如 `git status`。
4. 检查返回的工具结果是否比原始 shell 输出更短且结构更清晰。

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
- [思考等级](/zh-CN/tools/thinking)
- [上下文引擎](/zh-CN/concepts/context-engine)
