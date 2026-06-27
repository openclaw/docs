---
read_when:
    - モバイルノードアプリをGatewayとすばやくペアリングしたい
    - リモートまたは手動で共有するための setup-code 出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング QR とセットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-06-27T11:00:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 構成からモバイルペアリング用QRとセットアップコードを生成します。

## 使用方法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。未設定の場合でも、`gateway.tailscale.mode=serve|funnel` によってリモート公開URLを提供できます
- `--url <url>`: ペイロードで使用する Gateway URLを上書きします
- `--public-url <url>`: ペイロードで使用する公開URLを上書きします
- `--token <token>`: ブートストラップフローが認証に使用する Gateway トークンを上書きします
- `--password <password>`: ブートストラップフローが認証に使用する Gateway パスワードを上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QRのレンダリングをスキップします
- `--json`: JSON（`setupCode`, `gatewayUrl`, `auth`, `urlSource`）を出力します

## 注記

- `--token` と `--password` は相互に排他的です。
- セットアップコード自体には、共有 Gateway トークン/パスワードではなく、不透明な短寿命の `bootstrapToken` が含まれるようになりました。
- 組み込みのセットアップコードブートストラップは、`scopes: []` を持つプライマリ `node` トークンと、信頼済みモバイルオンボーディング用の有界な `operator` ハンドオフトークンを返します。
- ハンドオフされた operator トークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。`operator.admin` と `operator.pairing` には、別途承認された operator ペアリングまたはトークンフローが必要です。
- モバイルペアリングは、Tailscale/公開 `ws://` Gateway URLではフェイルクローズします。プライベートLANアドレスと `.local` Bonjourホストは引き続き `ws://` 経由でサポートされますが、Tailscale/公開モバイルルートでは Tailscale Serve/Funnel または `wss://` Gateway URLを使用する必要があります。
- `--remote` を指定する場合、OpenClaw には `gateway.remote.url` または
  `gateway.tailscale.mode=serve|funnel` のいずれかが必要です。
- `--remote` を指定し、有効なリモート認証情報が SecretRefs として構成されていて、`--token` または `--password` を渡していない場合、コマンドはアクティブな Gateway スナップショットからそれらを解決します。Gateway が利用できない場合、コマンドは即座に失敗します。
- `--remote` を指定しない場合、CLIの認証上書きが渡されていなければ、ローカル Gateway 認証の SecretRefs が解決されます。
  - `gateway.auth.token` は、トークン認証が勝つ可能性がある場合（明示的な `gateway.auth.mode="token"`、またはパスワードソースが勝たない推論モード）に解決されます。
  - `gateway.auth.password` は、パスワード認証が勝つ可能性がある場合（明示的な `gateway.auth.mode="password"`、または auth/env から勝つトークンがない推論モード）に解決されます。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成されていて（SecretRefs を含む）、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでセットアップコードの解決は失敗します。
- Gateway バージョンスキューの注記: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- スキャン後、次でデバイスペアリングを承認します。
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ペアリング](/ja-JP/cli/pairing)
