---
read_when:
    - モバイル Node アプリを Gateway とすばやくペアリングしたい場合
    - リモート/手動共有用のセットアップコード出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング用 QR + セットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-07-05T17:41:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc8e1781b654f281f53beea8ec684c743fb585f65a0ecc9823a20a0180b4ca4c
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 構成からモバイルペアリング用 QR とセットアップコードを生成します。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

公式の OpenClaw iOS および Android アプリは、setup-code メタデータが一致すると自動的に接続します。リクエストが保留のままの場合（たとえば、非公式クライアントやメタデータ不一致の場合）は、確認して承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。その URL が未設定の場合は `gateway.tailscale.mode=serve|funnel` にフォールバックします。`device-pair` plugin の `publicUrl` は無視します。
- `--url <url>`: ペイロードで使用する gateway URL を上書きします
- `--public-url <url>`: ペイロードで使用する公開 URL を上書きします
- `--token <token>`: ブートストラップフローが認証に使う gateway トークンを上書きします
- `--password <password>`: ブートストラップフローが認証に使う gateway パスワードを上書きします
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR レンダリングをスキップします
- `--json`: JSON（`setupCode`, `gatewayUrl`, 任意の `gatewayUrls`, `auth`, `urlSource`）を出力します

`--token` と `--password` は同時に指定できません。

## セットアップコードの内容

セットアップコードには、共有 gateway トークン/パスワードではなく、不透明で短命な `bootstrapToken` が含まれます。組み込みのブートストラップフローは次を発行します。

- `scopes: []` を持つプライマリ `node` トークン
- `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write` に制限された有界の `operator` ハンドオフトークン

ペアリング変更スコープと `operator.admin` には、引き続き別途承認済みの operator ペアリングまたはトークンフローが必要です。

## Gateway URL 解決

モバイルペアリングは、Tailscale/公開 `ws://` gateway URL に対してフェイルクローズします。これらには Tailscale Serve/Funnel または `wss://` gateway URL を使用してください。プライベート LAN アドレスと `.local` Bonjour ホストは、プレーンな `ws://` で引き続きサポートされます。

選択された Gateway URL が `gateway.bind=lan` に由来する場合、OpenClaw は永続的な `tailscale serve status --json` ルートも確認します。アクティブな Gateway のループバックポートをプロキシする HTTPS Serve ルートは、フォールバックとして含められます。特定インターフェースの `custom` と `tailnet` バインドは、そのフォールバックを受け取りません。ループバック Serve プロキシがそれらのリスナーに到達できないためです。現在の iOS クライアントは、通知されたルートを順番にプローブし、最初に到達可能なものを保存します。レガシーの `url` フィールドは、古いクライアント向けに変更されません。

`--remote` を指定する場合、`gateway.remote.url` または `gateway.tailscale.mode=serve|funnel` のいずれかが必要です。

## 認証解決（`--remote` なし）

CLI 認証上書きが渡されない場合、ローカル gateway 認証 SecretRefs は次のように解決されます。

| 条件                                                                                                                    | 解決先                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`、またはパスワードソースが勝たない推論モード                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`、または auth/env から勝つトークンがない推論モード                                         | `gateway.auth.password`                   |
| `gateway.auth.token` と `gateway.auth.password` の両方が構成されている（SecretRefs を含む）かつ `gateway.auth.mode` が未設定 | 失敗します。`gateway.auth.mode` を明示的に設定してください |

## 認証解決（`--remote`）

実質的にアクティブなリモート認証情報が SecretRefs として構成されていて、`--token` も `--password` も渡されていない場合、コマンドはアクティブな gateway スナップショットからそれらを解決します。gateway が利用できない場合、コマンドは即座に失敗します。

<Note>
このコマンドパスには、`secrets.resolve` RPC メソッドをサポートする gateway が必要です。古い gateway は unknown-method エラーを返します。
</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [デバイス](/ja-JP/cli/devices)
- [ペアリング](/ja-JP/cli/pairing)
