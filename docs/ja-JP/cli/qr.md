---
read_when:
    - モバイルノードアプリを Gateway とすばやくペアリングしたい
    - リモート/手動共有用のセットアップコード出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング QR + セットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-07-03T13:16:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 設定からモバイルペアリング用 QR とセットアップコードを生成します。

## 使用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。未設定の場合でも、`gateway.tailscale.mode=serve|funnel` がリモート公開 URL を提供できます
- `--url <url>`: ペイロードで使用する Gateway URL を上書きします
- `--public-url <url>`: ペイロードで使用する公開 URL を上書きします
- `--token <token>`: ブートストラップフローが認証に使う Gateway トークンを上書きします
- `--password <password>`: ブートストラップフローが認証に使う Gateway パスワードを上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR レンダリングをスキップします
- `--json`: JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`) を出力します

## メモ

- `--token` と `--password` は相互に排他的です。
- セットアップコード自体には、共有 Gateway トークン/パスワードではなく、不透明な短命の `bootstrapToken` が含まれるようになりました。
- 組み込みのセットアップコードブートストラップは、`scopes: []` を持つプライマリ `node` トークンに加えて、信頼されたモバイルオンボーディング用の有界な `operator` 引き継ぎトークンを返します。
- 引き渡されたオペレータートークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。ペアリング変更スコープと `operator.admin` には、別途承認済みのオペレーターペアリングまたはトークンフローが引き続き必要です。
- モバイルペアリングは、Tailscale/公開 `ws://` Gateway URL ではフェイルクローズします。プライベート LAN アドレスと `.local` Bonjour ホストは `ws://` 経由で引き続きサポートされますが、Tailscale/公開モバイルルートでは Tailscale Serve/Funnel または `wss://` Gateway URL を使用する必要があります。
- `--remote` を指定する場合、OpenClaw には `gateway.remote.url` または
  `gateway.tailscale.mode=serve|funnel` のいずれかが必要です。
- `--remote` を指定し、有効なリモート認証情報が SecretRefs として設定されていて、`--token` または `--password` を渡さない場合、このコマンドはアクティブな Gateway スナップショットからそれらを解決します。Gateway が利用できない場合、コマンドは即座に失敗します。
- `--remote` を指定しない場合、CLI 認証の上書きが渡されていなければ、ローカル Gateway 認証の SecretRefs が解決されます。
  - `gateway.auth.token` は、トークン認証が勝てる場合（明示的な `gateway.auth.mode="token"`、またはパスワードソースが勝たない推論モード）に解決されます。
  - `gateway.auth.password` は、パスワード認証が勝てる場合（明示的な `gateway.auth.mode="password"`、または auth/env から勝つトークンがない推論モード）に解決されます。
- `gateway.auth.token` と `gateway.auth.password` の両方が（SecretRefs を含めて）設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでセットアップコードの解決は失敗します。
- Gateway バージョン差異の注意: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- スキャン後、次でデバイスペアリングを承認します。
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ペアリング](/ja-JP/cli/pairing)
