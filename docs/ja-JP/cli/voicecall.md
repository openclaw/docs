---
read_when:
    - 音声通話 Plugin を使用していて、CLI のエントリーポイントを知りたい場合
    - '`voicecall call|continue|dtmf|status|tail|expose` の簡単な例が欲しい場合'
summary: '`openclaw voicecall` のCLIリファレンス（音声通話 Plugin のコマンドサーフェス）'
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T04:52:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` は Plugin 提供のコマンドです。音声通話 Plugin がインストールされ、有効な場合にのみ表示されます。

主なドキュメント:

- 音声通話 Plugin: [Voice Call](/ja-JP/plugins/voice-call)

## よく使うコマンド

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Webhook を公開する（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

セキュリティ注記: Webhook エンドポイントは信頼できるネットワークにのみ公開してください。可能な場合は Funnel より Tailscale Serve を優先してください。

## 関連

- [CLI reference](/ja-JP/cli)
- [Voice call plugin](/ja-JP/plugins/voice-call)
