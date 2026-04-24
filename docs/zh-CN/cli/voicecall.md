---
read_when:
    - 你正在使用语音通话插件，并想了解 CLI 入口点
    - 你想查看 `voicecall call|continue|dtmf|status|tail|expose` 的快速示例
summary: '`openclaw voicecall` 的 CLI 参考（语音通话插件命令界面）'
title: 语音通话
x-i18n:
    generated_at: "2026-04-24T04:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` 是一个由插件提供的命令。只有在安装并启用了语音通话插件时，它才会出现。

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

## 暴露 webhook（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全说明：仅将 webhook 端点暴露给你信任的网络。如有可能，优先使用 Tailscale Serve 而不是 Funnel。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [语音通话插件](/zh-CN/plugins/voice-call)
