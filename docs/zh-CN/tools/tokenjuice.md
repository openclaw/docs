---
read_when:
    - 你希望在 OpenClaw 中获得更短的 `exec` 或 `bash` 工具结果
    - 你想启用内置的 Tokenjuice 插件
    - 你需要了解 Tokenjuice 会更改什么，以及它会保留哪些原始内容
summary: 使用可选的内置插件压缩冗长杂乱的 `exec` 和 `bash` 工具结果
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-22T07:16:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` 是一个可选的内置插件，用于在命令已经运行之后，压缩冗长杂乱的 `exec` 和 `bash` 工具结果。

它更改的是返回的 `tool_result`，而不是命令本身。Tokenjuice 不会重写 shell 输入、重新运行命令，也不会更改退出码。

目前，这适用于 Pi 嵌入式运行：tokenjuice 会挂接嵌入式 `tool_result` 路径，并裁剪返回到会话中的输出。

## 启用插件

快速方式：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效方式：

```bash
openclaw plugins enable tokenjuice
```

OpenClaw 已经内置了该插件。不需要单独执行 `plugins install` 或 `tokenjuice install openclaw` 步骤。

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

## Tokenjuice 会更改什么

- 在 `exec` 和 `bash` 结果被送回会话之前，压缩其中冗长杂乱的内容。
- 保持原始命令执行不受影响。
- 保留精确的文件内容读取以及其他应由 tokenjuice 保持原始内容的命令。
- 仍然是可选启用：如果你希望在所有地方都获得逐字输出，请禁用该插件。

## 验证它是否生效

1. 启用插件。
2. 启动一个能够调用 `exec` 的会话。
3. 运行一个输出杂乱的命令，例如 `git status`。
4. 检查返回的工具结果是否比原始 shell 输出更短、结构更清晰。

## 禁用插件

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

或者：

```bash
openclaw plugins disable tokenjuice
```
