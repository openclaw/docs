---
read_when:
    - 你想要在 OpenClaw 中获得更短的 `exec` 或 `bash` 工具结果。
    - 你想要启用内置的 tokenjuice 插件。
    - 你需要了解 tokenjuice 会修改哪些内容，以及哪些内容会保持原样。
summary: 使用可选的内置插件压缩冗长的 exec 和 bash 工具结果
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T19:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` 是一个可选的内置插件，会在命令已经运行完成之后压缩冗长的 `exec` 和 `bash` 工具结果。

它修改的是返回的 `tool_result`，而不是命令本身。Tokenjuice 不会重写 shell 输入、重新运行命令，也不会更改退出码。

目前，这适用于 PI 嵌入式运行，以及 Codex app-server harness 中的 OpenClaw 动态工具。Tokenjuice 会挂接到 OpenClaw 的工具结果中间件，并在结果返回到当前活动的 harness 会话之前对输出进行裁剪。

## 启用插件

快速方式：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效方式：

```bash
openclaw plugins enable tokenjuice
```

OpenClaw 已经内置了该插件。无需单独执行 `plugins install`
或 `tokenjuice install openclaw` 步骤。

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

## tokenjuice 会修改什么

- 在结果回写到会话之前，压缩冗长的 `exec` 和 `bash` 结果。
- 保持原始命令执行不变。
- 保留精确的文件内容读取，以及其他 tokenjuice 应保持原样的命令。
- 采用显式启用方式：如果你希望所有地方都保留逐字输出，请禁用该插件。

## 验证它是否生效

1. 启用插件。
2. 启动一个可以调用 `exec` 的会话。
3. 运行一个输出较多的命令，例如 `git status`。
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

- [Exec tool](/zh-CN/tools/exec)
- [Thinking levels](/zh-CN/tools/thinking)
- [Context engine](/zh-CN/concepts/context-engine)
