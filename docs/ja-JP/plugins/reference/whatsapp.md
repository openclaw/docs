---
read_when:
    - WhatsApp Plugin をインストール、設定、または監査しています
summary: OpenClaw メッセージの送受信用の WhatsApp チャンネルサーフェスを追加します。
title: WhatsApp Plugin
x-i18n:
    generated_at: "2026-05-05T04:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp Plugin

OpenClaw メッセージを送受信するための WhatsApp チャネルサーフェスを追加します。

## 配布

- パッケージ: `@openclaw/whatsapp`
- インストール経路: npm; ClawHub

## サーフェス

channels: whatsapp

## Windows インストール時の注意

Windows では、WhatsApp Plugin は npm install 中に `PATH` 上の Git を必要とします。これは、その Baileys/libsignal 依存関係の 1 つが git URL から取得されるためです。Git for Windows をインストールし、シェルを再起動してからインストールを再実行します。

```powershell
winget install --id Git.Git -e
```

Portable Git も、その `bin` ディレクトリが `PATH` 上にあれば動作します。

## 関連ドキュメント

- [whatsapp](/ja-JP/channels/whatsapp)
