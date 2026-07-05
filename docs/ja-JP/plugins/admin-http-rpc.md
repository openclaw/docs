---
read_when:
    - Gateway WebSocket RPC クライアントを使用できないホストツールを構築する
    - 信頼済みのプライベート ingress の背後で Gateway 管理自動化を公開する
    - GatewayメソッドへのHTTPアクセスのセキュリティモデルの監査
summary: バンドル済みのオプトイン admin-http-rpc Plugin を通じて、選択した Gateway コントロールプレーンメソッドを公開する
title: 管理用 HTTP RPC Plugin
x-i18n:
    generated_at: "2026-07-05T11:35:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 075135d2248acc859e60a72639350e16ed43785e9a353396fd47c3b02a4b0f5a
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

バンドルされている `admin-http-rpc` Plugin は、Gateway WebSocket 接続を開いたままにできない信頼済みホスト自動化向けに、許可リスト化された Gateway コントロールプレーンメソッドのセットを HTTP 経由で公開します。

これは OpenClaw に同梱されていますが、デフォルトでは無効です。無効な場合、ルートは登録されません。有効にすると、Gateway と同じリスナーに `POST /api/v1/admin/rpc` が追加されます (`http://<gateway-host>:<port>/api/v1/admin/rpc`)。

プライベートホストツール、tailnet 自動化、または信頼済み内部 ingress に限って有効にしてください。このルートを公開インターネットへ直接公開しないでください。

## 有効にする前に

Admin HTTP RPC は完全なオペレーター向けコントロールプレーン surface です。Gateway HTTP 認証を通過した呼び出し元は、以下の許可リスト化されたメソッドを呼び出せます。次のすべてが真の場合にのみ有効にしてください。

- 呼び出し元が Gateway の運用を信頼されている。
- 呼び出し元が WebSocket RPC クライアントを使用できない。
- ルートが loopback、tailnet、またはプライベートな認証済み ingress からのみ到達可能である。
- 許可されたメソッドを確認済みであり、実行予定の自動化に一致している。

Gateway WebSocket 接続を開いたままにできる OpenClaw クライアントや対話型ツールでは、代わりに WebSocket RPC を使用してください。

## 有効化

バンドルされた Plugin を有効にします。

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

ルートは Plugin の起動中に登録されるため、Plugin 設定を変更した後は Gateway を再起動してください。

HTTP surface が不要になったら無効にします。

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## ルートを検証する

最小限で安全なリクエストとして `health` を使用します。

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功レスポンスには `ok: true` があります。

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Plugin が無効な場合、ルートは登録されていないため `404` を返します。

## 認証

Plugin ルートは Gateway HTTP 認証を使用します。

一般的な認証パス:

- 共有シークレット認証 (`gateway.auth.mode="token"` または `"password"`): `Authorization: Bearer <token-or-password>`
- 信頼済み ID 付き HTTP 認証 (`gateway.auth.mode="trusted-proxy"`): 設定済みの ID 対応プロキシ経由でルーティングし、必要な ID ヘッダーを注入させる
- プライベート ingress のオープン認証 (`gateway.auth.mode="none"`): 認証ヘッダーは不要

## セキュリティモデル

この Plugin は完全な Gateway オペレーター surface として扱ってください。

- Plugin を有効にすると、`/api/v1/admin/rpc` で許可リスト化された admin RPC メソッドへのアクセスを意図的に提供します。
- Plugin は予約済みの `contracts.gatewayMethodDispatch: ["authenticated-request"]` manifest contract を宣言します。これにより、Gateway 認証済みの HTTP ルートがプロセス内でコントロールプレーンメソッドをディスパッチできます。これはサンドボックスではありません。この contract は予約済み SDK ヘルパーの偶発的な使用を防ぎますが、信頼済み Plugin は引き続き Gateway プロセス内で実行されます。
- 共有シークレット bearer 認証 (`token`/`password` モード) は Gateway オペレーターシークレットの所持を証明します。このパスでは、より狭い `x-openclaw-scopes` ヘッダーは無視され、通常の完全なオペレーターデフォルトが復元されます。
- 信頼済み ID 付き HTTP 認証 (`trusted-proxy` モード) は、存在する場合 `x-openclaw-scopes` を尊重します。
- `gateway.auth.mode="none"` は、Plugin が有効な場合このルートが未認証になることを意味します。完全に信頼するプライベート ingress の背後でのみ使用してください。
- リクエストは、Plugin ルートの認証を通過した後、WebSocket RPC と同じ Gateway メソッドハンドラーおよび scope チェックを経由してディスパッチされます。
- このルートは loopback、tailnet、またはプライベートな信頼済み ingress 上に保持してください。公開インターネットへ直接公開しないでください。呼び出し元が信頼境界をまたぐ場合は、別々の Gateway を使用してください。

## リクエスト

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

フィールド:

- `id` (string, optional): レスポンスにコピーされます。省略時は UUID が生成されます。
- `method` (string, required): 許可された Gateway メソッド名。
- `params` (any, optional): メソッド固有の params。

デフォルトの最大リクエスト本文サイズは 1 MB です。

## レスポンス

成功レスポンスは Gateway RPC 形式を使用します。

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway メソッドエラーは次を使用します。

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

HTTP ステータスはエラーコードに従います。

| エラーコード               | HTTP ステータス |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| その他のコード             | 500         |

## 許可されたメソッド

- 検出: `commands.list`
  この Plugin で許可されている HTTP RPC メソッド名を返します。
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- 設定: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- チャンネル: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- ウェブ: `web.login.start`, `web.login.wait`
- モデル: `models.list`, `models.authStatus`
- エージェント: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- 承認: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- デバイス: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- ノード: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- タスク: `tasks.list`, `tasks.get`, `tasks.cancel`
- 診断: `doctor.memory.status`, `update.status`

その他の Gateway メソッドは、意図的に追加されるまでブロックされます。

## WebSocket との比較

通常の Gateway WebSocket RPC パスは、OpenClaw クライアント向けの推奨コントロールプレーン API のままです。Admin HTTP RPC は、リクエスト/レスポンス型の HTTP surface が必要なホストツールにのみ使用してください。

信頼済みデバイス ID を持たない共有トークン WebSocket クライアントは、接続時に admin scope を自己宣言できません。Admin HTTP RPC は、既存の信頼済み HTTP オペレーターモデルに意図的に従います。Plugin が有効な場合、共有シークレット bearer 認証は、この admin surface に対する完全なオペレーターアクセスとして扱われます。

## トラブルシューティング

`404 Not Found`

: Plugin が無効である、Plugin を有効にしてから Gateway を再起動していない、またはリクエストが別の Gateway プロセスに送信されています。

`401 Unauthorized`

: リクエストが Gateway HTTP 認証を満たしていません。bearer トークンまたは trusted-proxy ID ヘッダーを確認してください。

`405 Method Not Allowed`

: リクエストが `POST` 以外を使用しました。

`413 Payload Too Large`

: リクエスト本文が 1 MB 制限を超えました。

`400 INVALID_REQUEST`

: リクエスト本文が有効な JSON ではない、`method` フィールドが欠落している、またはメソッドが Plugin の許可リストに含まれていません。

`503 UNAVAILABLE`

: Gateway メソッドハンドラーが利用できません。Gateway ログを確認し、Gateway の起動完了後に再試行してください。

## 関連

- [オペレーター scope](/ja-JP/gateway/operator-scopes)
- [Gateway セキュリティ](/ja-JP/gateway/security)
- [リモートアクセス](/ja-JP/gateway/remote)
- [Plugin manifest](/ja-JP/plugins/manifest#contracts-reference)
- [SDK サブパス](/ja-JP/plugins/sdk-subpaths)
