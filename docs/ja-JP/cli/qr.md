---
read_when:
    - モバイルノードアプリを Gateway とすばやくペアリングしたい場合
    - リモート/手動共有には setup-code の出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング QR とセットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-05-06T04:59:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 設定から、モバイルペアリング用 QR とセットアップコードを生成します。

## 使用方法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。未設定の場合でも、`gateway.tailscale.mode=serve|funnel` によってリモート公開 URL を提供できます
- `--url <url>`: ペイロードで使用する Gateway URL を上書きします
- `--public-url <url>`: ペイロードで使用する公開 URL を上書きします
- `--token <token>`: ブートストラップフローが認証に使用する Gateway トークンを上書きします
- `--password <password>`: ブートストラップフローが認証に使用する Gateway パスワードを上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR のレンダリングをスキップします
- `--json`: JSON（`setupCode`, `gatewayUrl`, `auth`, `urlSource`）を出力します

## 注記

- `--token` と `--password` は同時に指定できません。
- セットアップコード自体には、共有 Gateway トークン/パスワードではなく、不透明な短命の `bootstrapToken` が含まれるようになりました。
- 組み込みのノード/operator ブートストラップフローでは、プライマリノードトークンは引き続き `scopes: []` として保存されます。
- ブートストラップの引き渡しで operator トークンも発行する場合、そのトークンはブートストラップ許可リスト（`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`）に制限されたままです。
- ブートストラップのスコープチェックにはロールプレフィックスが付きます。この operator 許可リストは operator リクエストのみを満たします。operator 以外のロールには、引き続き各自のロールプレフィックス配下のスコープが必要です。
- モバイルペアリングは、Tailscale/公開 `ws://` Gateway URL ではフェイルクローズします。プライベート LAN アドレスと `.local` Bonjour ホストは `ws://` 経由で引き続きサポートされますが、Tailscale/公開モバイルルートでは Tailscale Serve/Funnel または `wss://` Gateway URL を使用する必要があります。
- `--remote` を指定する場合、OpenClaw には `gateway.remote.url` または
  `gateway.tailscale.mode=serve|funnel` のいずれかが必要です。
- `--remote` を指定し、有効なリモート認証情報が SecretRefs として設定されていて、`--token` または `--password` を渡していない場合、このコマンドは有効な Gateway スナップショットからそれらを解決します。Gateway が利用できない場合、コマンドは即座に失敗します。
- `--remote` を指定しない場合、CLI 認証の上書きが渡されていないと、ローカル Gateway 認証の SecretRefs が解決されます:
  - トークン認証が選ばれる可能性がある場合（明示的な `gateway.auth.mode="token"`、またはパスワードソースが勝たない推論モード）、`gateway.auth.token` が解決されます。
  - パスワード認証が選ばれる可能性がある場合（明示的な `gateway.auth.mode="password"`、または auth/env から勝つトークンがない推論モード）、`gateway.auth.password` が解決されます。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて（SecretRefs を含む）、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでセットアップコードの解決は失敗します。
- Gateway バージョン不一致の注記: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- スキャン後、次のコマンドでデバイスペアリングを承認します:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [ペアリング](/ja-JP/cli/pairing)
