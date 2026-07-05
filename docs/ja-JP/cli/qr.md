---
read_when:
    - モバイルノードアプリをGatewayとすばやくペアリングしたい
    - リモート/手動共有用の setup-code 出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング用 QR とセットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-07-05T11:13:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0caa7b53694ce63fab7fe1554809833c5df2b7499709a9137f3199ce01409757
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 設定から、モバイルペアリング用QRとセットアップコードを生成します。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

公式の OpenClaw iOS および Android アプリは、セットアップコードのメタデータが一致すると自動的に接続します。リクエストが保留中のままの場合（たとえば、非公式クライアントやメタデータ不一致の場合）は、確認して承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。その URL が未設定の場合は `gateway.tailscale.mode=serve|funnel` にフォールバックします。`device-pair` plugin の `publicUrl` は無視します。
- `--url <url>`: ペイロードで使用する Gateway URL を上書きします
- `--public-url <url>`: ペイロードで使用する公開 URL を上書きします
- `--token <token>`: ブートストラップフローが認証に使用する Gateway トークンを上書きします
- `--password <password>`: ブートストラップフローが認証に使用する Gateway パスワードを上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR のレンダリングをスキップします
- `--json`: JSON（`setupCode`, `gatewayUrl`, `auth`, `urlSource`）を出力します

`--token` と `--password` は同時に指定できません。

## セットアップコードの内容

セットアップコードには、共有 Gateway トークン/パスワードではなく、不透明で短命な `bootstrapToken` が含まれます。組み込みのブートストラップフローは次を発行します。

- `scopes: []` を持つプライマリ `node` トークン
- `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限された、境界付きの `operator` ハンドオフトークン

ペアリング変更スコープと `operator.admin` には、引き続き別途承認済みのオペレーターペアリングまたはトークンフローが必要です。

## Gateway URL 解決

モバイルペアリングは、Tailscale/公開 `ws://` Gateway URL では安全側に失敗します。その場合は Tailscale Serve/Funnel または `wss://` Gateway URL を使用してください。プライベート LAN アドレスと `.local` Bonjour ホストは、引き続き通常の `ws://` でサポートされます。

`--remote` では、`gateway.remote.url` または `gateway.tailscale.mode=serve|funnel` のいずれかが必要です。

## 認証の解決（`--remote` なし）

CLI の認証上書きが渡されない場合、ローカル Gateway 認証の SecretRefs は次のように解決されます。

| 条件                                                                                                                    | 解決先                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`、または推論されたモードで有効なパスワードソースがない場合                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`、または推論されたモードで auth/env から有効なトークンがない場合                                         | `gateway.auth.password`                   |
| `gateway.auth.token` と `gateway.auth.password` の両方が（SecretRefs を含めて）設定されており、`gateway.auth.mode` が未設定の場合 | 失敗します。`gateway.auth.mode` を明示的に設定してください |

## 認証の解決（`--remote`）

実質的に有効なリモート認証情報が SecretRefs として設定されており、`--token` も `--password` も渡されていない場合、このコマンドはアクティブな Gateway スナップショットからそれらを解決します。Gateway が利用できない場合、コマンドは即座に失敗します。

<Note>
このコマンドパスには、`secrets.resolve` RPC メソッドをサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
</Note>

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [デバイス](/ja-JP/cli/devices)
- [ペアリング](/ja-JP/cli/pairing)
