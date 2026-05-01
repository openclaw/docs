---
read_when:
    - voice-call プラグインを使用していて、CLI エントリポイントが必要な場合
    - '`voicecall setup|smoke|call|continue|dtmf|status|tail|expose` の簡単な例が必要です'
summary: '`openclaw voicecall` の CLI リファレンス（音声通話 Plugin のコマンドサーフェス）'
title: 音声通話
x-i18n:
    generated_at: "2026-05-01T05:00:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4090858a58b7defaff955a370c8cb0ff025ef68061e68a6c69a637de24707c0b
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` はPluginが提供するコマンドです。音声通話Pluginがインストールされ、有効化されている場合にのみ表示されます。

主要ドキュメント:

- 音声通話Plugin: [音声通話](/ja-JP/plugins/voice-call)

## 一般的なコマンド

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

`setup` はデフォルトで人間が読める形式の準備状況チェックを出力します。
スクリプト向けには `--json` を使用します:

```bash
openclaw voicecall setup --json
```

`status` はデフォルトでアクティブな通話をJSONとして出力します。1件の通話を調べるには
`--call-id <id>` を渡します。

外部プロバイダー (`twilio`, `telnyx`, `plivo`) では、セットアップ時に `publicUrl`、トンネル、または Tailscale の公開から公開
Webhook URLを解決できる必要があります。通信事業者が到達できないため、local loopback/プライベートの
配信フォールバックは拒否されます。

`smoke` は同じ準備状況チェックを実行します。`--to` と `--yes` の両方が存在しない限り、
実際の電話発信は行いません:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Webhookの公開 (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

セキュリティ注記: Webhookエンドポイントは、信頼するネットワークにのみ公開してください。可能な場合は Funnel より Tailscale Serve を優先してください。

## 関連項目

- [CLIリファレンス](/ja-JP/cli)
- [音声通話Plugin](/ja-JP/plugins/voice-call)
