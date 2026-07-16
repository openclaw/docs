---
read_when:
    - モバイル Node アプリを Gateway とすばやくペアリングしたい場合
    - リモートまたは手動で共有するためのセットアップコードの出力が必要です
summary: '`openclaw qr` の CLI リファレンス（モバイルペアリング用 QR + セットアップコードを生成）'
title: QR
x-i18n:
    generated_at: "2026-07-16T11:33:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

現在の Gateway 構成から、モバイルペアリング用の QR とセットアップコードを生成します。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

公式の OpenClaw iOS および Android アプリは、セットアップコードのメタデータが一致すると自動的に接続します。リクエストが保留中のままの場合（たとえば、非公式クライアントやメタデータの不一致の場合）は、確認して承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## オプション

- `--remote`: `gateway.remote.url` を優先します。その URL が未設定の場合は `gateway.tailscale.mode=serve|funnel` にフォールバックします。`device-pair` Plugin の `publicUrl` は無視します。
- `--url <url>`: ペイロードで使用する Gateway URL を上書きします
- `--public-url <url>`: ペイロードで使用する公開 URL を上書きします
- `--token <token>`: ブートストラップフローの認証先となる Gateway トークンを上書きします
- `--password <password>`: ブートストラップフローの認証先となる Gateway パスワードを上書きします
- `--limited`: 引き渡されるオペレータートークンから Gateway の管理アクセスを除外します
- `--setup-code-only`: セットアップコードのみを出力します
- `--no-ascii`: ASCII QR のレンダリングをスキップします
- `--json`: JSON を出力します（`setupCode`、`gatewayUrl`、省略可能な `gatewayUrls`、`auth`、`access`、省略可能な `accessDowngraded`、`urlSource`）

`--token` と `--password` は同時に使用できません。

## セットアップコードの内容

セットアップコードには、共有 Gateway トークン／パスワードではなく、不透明で有効期間の短い `bootstrapToken` が含まれます。`wss://` エンドポイント（または同一ホストのループバック）の場合、デフォルトのブートストラップフローは次を発行します。

- `scopes: []` を持つプライマリ `node` トークン
- `operator.admin`、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` を持つ完全なネイティブモバイル用 `operator` 引き渡しトークン

同じ Node トークンを維持しながら、オペレーターへの引き渡しから `operator.admin` を除外するには、`--limited` を使用します。ペアリング変更スコープがセットアップコードによって引き渡されることはありません。

平文 LAN の `ws://` セットアップも引き続き利用できますが、ネットワーク監視者が Bearer ブートストラップトークンを傍受し、先に使用する可能性があるため、OpenClaw は制限付きプロファイルを自動的に使用します。`wss://` または Tailscale Serve を構成してから、新しいコードを生成すると、完全なアクセス権を取得できます。

## Gateway URL の解決

Tailscale／公開 `ws://` Gateway URL では、モバイルペアリングは安全側に失敗します。これらには Tailscale Serve／Funnel または `wss://` Gateway URL を使用してください。プライベート LAN アドレスと `.local` Bonjour ホストでは、平文 `ws://` が引き続きサポートされますが、オペレーターアクセスは前述のとおり制限されます。

選択された Gateway URL が `gateway.bind=lan` から取得された場合、OpenClaw は永続的な `tailscale serve status --json` ルートも確認します。アクティブな Gateway のループバックポートをプロキシする HTTPS Serve ルートは、すべてフォールバックとして含まれます。QR コマンドがこのフォールバックを追加するのは `lan` の場合のみです。`custom` と `tailnet` では、明示的に公開されたルートが維持されます。現在の iOS クライアントは、公開されたルートを順番にプローブし、最初に到達可能なものを保存します。従来の `url` フィールドは、古いクライアント向けに変更されません。

`--remote` を使用する場合、`gateway.remote.url` または `gateway.tailscale.mode=serve|funnel` のいずれかが必要です。

## 認証の解決（`--remote` なし）

CLI の認証上書きが渡されていない場合、ローカル Gateway 認証の SecretRefs は次のように解決されます。

| 条件                                                                                                                    | 解決結果                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`、または優先されるパスワードソースがない推論モード                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`、または認証／環境から優先されるトークンがない推論モード                                         | `gateway.auth.password`                   |
| `gateway.auth.token` と `gateway.auth.password` の両方が構成され（SecretRefs を含む）、`gateway.auth.mode` が未設定 | 失敗します。`gateway.auth.mode` を明示的に設定してください |

## 認証の解決（`--remote`）

実質的に有効なリモート認証情報が SecretRefs として構成されており、`--token` と `--password` のどちらも渡されていない場合、コマンドはアクティブな Gateway スナップショットからそれらを解決します。Gateway が利用できない場合、コマンドは即座に失敗します。

<Note>
このコマンドパスには、`secrets.resolve` RPC メソッドをサポートする Gateway が必要です。古い Gateway では、不明なメソッドのエラーが返されます。
</Note>

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [デバイス](/ja-JP/cli/devices)
- [ペアリング](/ja-JP/cli/pairing)
