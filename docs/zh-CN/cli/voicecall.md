---
read_when:
    - 你使用语音通话插件，并且想了解 CLI 入口点
    - 你想查看 `voicecall call|continue|dtmf|status|tail|expose` 的快速示例
summary: '`openclaw voicecall` 的 CLI 参考（语音通话插件命令接口）'
title: 语音通话
x-i18n:
    generated_at: "2026-04-24T00:54:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f7588e5ee8bcf2316b74498f0aaff954d0970450d4251fd83e188e8326f6de8
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` 是一个由插件提供的命令。只有在语音通话插件已安装并启用时，它才会显示。

主要文档：

- 语音通话插件：[Voice Call](/zh-CN/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## 暴露 webhooks（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全提示：只将 webhook 端点暴露给你信任的网络。尽可能优先使用 Tailscale Serve，而不是 Funnel。
