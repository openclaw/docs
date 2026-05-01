---
read_when:
    - 你使用 voice-call 插件，并想要 CLI 入口点
    - 你想要 `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` 的快速示例
summary: '`openclaw voicecall` 的 CLI 参考（语音通话插件命令界面）'
title: 语音通话
x-i18n:
    generated_at: "2026-05-01T04:46:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4090858a58b7defaff955a370c8cb0ff025ef68061e68a6c69a637de24707c0b
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是一个由插件提供的命令。只有安装并启用语音通话插件后，它才会出现。

主要文档：

- 语音通话插件：[语音通话](/zh-CN/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` 默认会打印便于阅读的就绪检查。脚本请使用 `--json`：

```bash
openclaw voicecall setup --json
```

`status` 默认以 JSON 打印活跃通话。传入 `--call-id <id>` 可检查一个通话。

对于外部提供商（`twilio`、`telnyx`、`plivo`），设置必须从 `publicUrl`、隧道或 Tailscale 暴露地址解析出一个公网 webhook URL。回环/私有服务回退会被拒绝，因为运营商无法访问它。

`smoke` 会运行相同的就绪检查。除非同时提供 `--to` 和 `--yes`，否则它不会拨打真实电话：

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## 暴露 webhooks（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全注意事项：只将 webhook 端点暴露给你信任的网络。尽可能优先使用 Tailscale Serve，而不是 Funnel。

## 相关

- [CLI 参考](/zh-CN/cli)
- [语音通话插件](/zh-CN/plugins/voice-call)
