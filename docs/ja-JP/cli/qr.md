---
read_when:
    - モバイル Node アプリを gateway とすばやくペアリングしたい場合
    - リモート共有または手動共有のためにセットアップコード出力が必要な場合
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング QR とセットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-04-24T04:51:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

現在の Gateway 設定から、モバイルペアリング QR とセットアップコードを生成します。

## 使用方法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。未設定でも、`gateway.tailscale.mode=serve|funnel` によってリモート公開 URL を提供できます
- `--url <url>`: ペイロードで使う gateway URL を上書きします
- `--public-url <url>`: ペイロードで使う公開 URL を上書きします
- `--token <token>`: ブートストラップフローが認証対象にする gateway token を上書きします
- `--password <password>`: ブートストラップフローが認証対象にする gateway password を上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR 描画をスキップします
- `--json`: JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）を出力します

## 注記

- `--token` と `--password` は相互排他的です。
- セットアップコード自体には、共有 gateway token/password ではなく、不透明な短命の `bootstrapToken` が含まれるようになりました。
- 組み込みの node/operator ブートストラップフローでは、プライマリ node token は引き続き `scopes: []` で渡されます。
- ブートストラップ引き継ぎで operator token も発行される場合、その token はブートストラップ許可リスト `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。
- ブートストラップのスコープチェックには role プレフィックスが付きます。その operator 許可リストは operator リクエストのみを満たします。operator 以外の role では、引き続き自身の role プレフィックス配下のスコープが必要です。
- モバイルペアリングは、Tailscale/公開 `ws://` gateway URL に対して fail closed します。プライベート LAN の `ws://` は引き続きサポートされますが、Tailscale/公開モバイルルートでは Tailscale Serve/Funnel または `wss://` gateway URL を使う必要があります。
- `--remote` では、OpenClaw は `gateway.remote.url` または
  `gateway.tailscale.mode=serve|funnel` のいずれかを必要とします。
- `--remote` で、有効なリモート認証情報が SecretRef として設定されており、`--token` も `--password` も渡さない場合、このコマンドはアクティブな gateway スナップショットからそれらを解決します。gateway が利用できない場合、コマンドは即座に失敗します。
- `--remote` なしでは、CLI 認証オーバーライドが渡されていない場合にローカル gateway 認証 SecretRef が解決されます:
  - `gateway.auth.token` は、token 認証が勝つ可能性がある場合に解決されます（明示的な `gateway.auth.mode="token"`、または password ソースが勝たない推定モード）。
  - `gateway.auth.password` は、password 認証が勝つ可能性がある場合に解決されます（明示的な `gateway.auth.mode="password"`、または auth/env から勝つ token がない推定モード）。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて（SecretRef を含む）、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでセットアップコード解決は失敗します。
- Gateway バージョン差異に関する注記: このコマンドパスには `secrets.resolve` をサポートする gateway が必要です。古い gateway では unknown-method エラーが返ります。
- スキャン後、デバイスのペアリングは次で承認してください:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ペアリング](/ja-JP/cli/pairing)
