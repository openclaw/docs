---
read_when:
    - モバイル Node アプリを Gateway とすばやくペアリングしたい場合
    - リモートまたは手動で共有するには、セットアップコードの出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング用 QR + セットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-07-12T14:23:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 設定から、モバイルペアリング用 QR とセットアップコードを生成します。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

公式の OpenClaw iOS および Android アプリは、セットアップコードのメタデータが一致すると自動的に接続します。リクエストが保留中のままの場合（たとえば、非公式クライアントやメタデータの不一致）、内容を確認して承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。その URL が未設定の場合は、`gateway.tailscale.mode=serve|funnel` にフォールバックします。`device-pair` Plugin の `publicUrl` は無視します。
- `--url <url>`: ペイロードで使用する Gateway URL を上書きします
- `--public-url <url>`: ペイロードで使用する公開 URL を上書きします
- `--token <token>`: ブートストラップフローが認証に使用する Gateway トークンを上書きします
- `--password <password>`: ブートストラップフローが認証に使用する Gateway パスワードを上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR のレンダリングをスキップします
- `--json`: JSON（`setupCode`、`gatewayUrl`、省略可能な `gatewayUrls`、`auth`、`urlSource`）を出力します

`--token` と `--password` は同時に指定できません。

## セットアップコードの内容

セットアップコードには、共有 Gateway トークン／パスワードではなく、不透明で有効期間の短い `bootstrapToken` が含まれます。組み込みのブートストラップフローは、次のトークンを発行します。

- `scopes: []` を持つプライマリ `node` トークン
- `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` のみに制限された、範囲限定の `operator` ハンドオフトークン

ペアリング変更スコープと `operator.admin` には、引き続き、別途承認されたオペレーターペアリングまたはトークンフローが必要です。

## Gateway URL の解決

Tailscale／公開 `ws://` Gateway URL では、モバイルペアリングは安全側に倒して失敗します。その場合は、Tailscale Serve/Funnel または `wss://` Gateway URL を使用してください。プライベート LAN アドレスと `.local` Bonjour ホストでは、引き続きプレーンな `ws://` がサポートされます。

選択された Gateway URL が `gateway.bind=lan` に由来する場合、OpenClaw は永続的な `tailscale serve status --json` ルートも確認します。アクティブな Gateway のループバックポートをプロキシする HTTPS Serve ルートは、すべてフォールバックとして含まれます。QR コマンドがこのフォールバックを追加するのは `lan` の場合のみです。`custom` と `tailnet` では、明示的に公開されたルートが維持されます。現在の iOS クライアントは公開されたルートを順番にプローブし、最初に到達できたものを保存します。旧クライアント向けの従来の `url` フィールドは変更されません。

`--remote` を使用する場合、`gateway.remote.url` または `gateway.tailscale.mode=serve|funnel` のいずれかが必要です。

## 認証の解決（`--remote` なし）

CLI 認証の上書きを渡さない場合、ローカル Gateway 認証の SecretRefs は次のように解決されます。

| 条件                                                                                                                         | 解決先                                    |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`、または優先されるパスワードソースがない推論モード                                               | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`、または認証／環境から優先されるトークンがない推論モード                                      | `gateway.auth.password`                   |
| `gateway.auth.token` と `gateway.auth.password` の両方が設定されており（SecretRefs を含む）、`gateway.auth.mode` が未設定の場合 | 失敗します。`gateway.auth.mode` を明示的に設定してください |

## 認証の解決（`--remote`）

実質的に有効なリモート認証情報が SecretRefs として設定されており、`--token` と `--password` のどちらも渡されていない場合、コマンドはアクティブな Gateway スナップショットからそれらを解決します。Gateway が利用できない場合、コマンドは即座に失敗します。

<Note>
このコマンドパスには、`secrets.resolve` RPC メソッドをサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
</Note>

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [デバイス](/ja-JP/cli/devices)
- [ペアリング](/ja-JP/cli/pairing)
