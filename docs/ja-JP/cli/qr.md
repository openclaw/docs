---
read_when:
    - モバイル Node アプリを Gateway と素早くペアリングしたい
    - リモートまたは手動共有用の setup-code 出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング用 QR とセットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-07-04T17:48:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 構成から、モバイルペアリング用 QR とセットアップコードを生成します。

## 使用方法

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
- `--token <token>`: ブートストラップフローが認証に使用する Gateway トークンを上書きします
- `--password <password>`: ブートストラップフローが認証に使用する Gateway パスワードを上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR レンダリングをスキップします
- `--json`: JSON（`setupCode`, `gatewayUrl`, `auth`, `urlSource`）を出力します

## 注記

- `--token` と `--password` は同時に指定できません。
- セットアップコード自体には、共有 Gateway トークン/パスワードではなく、不透明な短命の `bootstrapToken` が含まれるようになりました。
- 組み込みのセットアップコードブートストラップは、`scopes: []` を持つプライマリ `node` トークンに加え、信頼されたモバイルオンボーディング用の有界な `operator` 引き継ぎトークンを返します。
- 引き渡された operator トークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。ペアリング変更スコープと `operator.admin` には、引き続き別途承認済みの operator ペアリングまたはトークンフローが必要です。
- モバイルペアリングは、Tailscale/公開 `ws://` Gateway URL ではフェイルクローズします。プライベート LAN アドレスと `.local` Bonjour ホストは引き続き `ws://` でサポートされますが、Tailscale/公開モバイルルートでは Tailscale Serve/Funnel または `wss://` Gateway URL を使用する必要があります。
- `--remote` では、OpenClaw は `gateway.remote.url` または
  `gateway.tailscale.mode=serve|funnel` のいずれかを必要とします。
- `--remote` では、実効的にアクティブなリモート認証情報が SecretRefs として構成されていて、`--token` または `--password` を渡さない場合、コマンドはアクティブな Gateway スナップショットからそれらを解決します。Gateway が利用できない場合、コマンドは即座に失敗します。
- `--remote` なしでは、CLI 認証上書きが渡されていない場合にローカル Gateway 認証 SecretRefs が解決されます。
  - トークン認証が優先される場合（明示的な `gateway.auth.mode="token"`、またはパスワードソースが優先されない推論モード）、`gateway.auth.token` が解決されます。
  - パスワード認証が優先される場合（明示的な `gateway.auth.mode="password"`、または auth/env から優先されるトークンがない推論モード）、`gateway.auth.password` が解決されます。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成されていて（SecretRefs を含む）、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでセットアップコードの解決は失敗します。
- Gateway バージョン不一致に関する注記: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- 公式の OpenClaw iOS アプリと Android アプリは、それぞれの
  セットアップコードメタデータが一致すると自動的に接続します。リクエストが保留のまま残る場合（たとえば、
  非公式クライアントまたはメタデータ不一致の場合）は、次で確認して承認します。
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ペアリング](/ja-JP/cli/pairing)
