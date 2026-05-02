---
read_when:
    - voice-call Plugin を使用し、CLI エントリーポイントを求めている
    - '`voicecall setup|smoke|call|continue|dtmf|status|tail|expose` の簡単な例が必要な場合'
summary: '`openclaw voicecall` の CLI リファレンス (音声通話Pluginのコマンドサーフェス)'
title: 音声通話
x-i18n:
    generated_at: "2026-05-02T04:52:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` は Plugin が提供するコマンドです。voice-call Plugin がインストールされ、有効化されている場合にのみ表示されます。

Gateway が実行中の場合、運用コマンド（`call`、`start`、
`continue`、`speak`、`dtmf`、`end`、`status`）はその Gateway の
音声通話ランタイムへ送信されます。到達可能な Gateway がない場合は、スタンドアロンの
CLI ランタイムにフォールバックします。

主なドキュメント:

- 音声通話 Plugin: [音声通話](/ja-JP/plugins/voice-call)

## よく使うコマンド

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

`setup` はデフォルトで、人間が読める形式の準備状況チェックを出力します。スクリプトでは `--json` を使用します:

```bash
openclaw voicecall setup --json
```

`status` はデフォルトでアクティブな通話を JSON として出力します。1 件の通話を調べるには `--call-id <id>` を渡します。

外部プロバイダー（`twilio`、`telnyx`、`plivo`）では、セットアップ時に `publicUrl`、トンネル、または Tailscale 公開からパブリック Webhook URL を解決する必要があります。キャリアが到達できないため、ループバック/プライベート serve フォールバックは拒否されます。

`smoke` は同じ準備状況チェックを実行します。`--to` と `--yes` の両方が指定されていない限り、実際の電話は発信しません:

```bash
openclaw voicecall smoke --to "+15555550123"        # ドライラン
openclaw voicecall smoke --to "+15555550123" --yes  # ライブ通知通話
```

## Webhook の公開（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

セキュリティ上の注意: 信頼するネットワークにのみ Webhook エンドポイントを公開してください。可能な場合は Funnel より Tailscale Serve を優先してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [音声通話 Plugin](/ja-JP/plugins/voice-call)
