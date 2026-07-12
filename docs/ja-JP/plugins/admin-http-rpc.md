---
read_when:
    - Gateway WebSocket RPC クライアントを使用できないホストツールの構築
    - プライベートな信頼済みイングレス経由で Gateway 管理自動化を公開する
    - GatewayメソッドへのHTTPアクセスに関するセキュリティモデルの監査
summary: バンドルされているオプトインの admin-http-rpc Plugin を通じて、選択した Gateway コントロールプレーンメソッドを公開する
title: 管理用 HTTP RPC Plugin
x-i18n:
    generated_at: "2026-07-11T22:25:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

バンドルされている `admin-http-rpc` Plugin は、Gateway WebSocket 接続を開いたまま維持できない、信頼されたホスト自動化のために、許可リストに登録された一連の Gateway コントロールプレーンメソッドを HTTP 経由で公開します。

この Plugin は OpenClaw に同梱されていますが、デフォルトでは無効です。無効な場合、ルートは登録されません。有効にすると、Gateway と同じリスナーに `POST /api/v1/admin/rpc`（`http://<gateway-host>:<port>/api/v1/admin/rpc`）が追加されます。

プライベートなホストツール、tailnet 自動化、または信頼された内部イングレスに対してのみ有効にしてください。このルートを公開インターネットに直接公開してはなりません。

## 有効にする前に

管理 HTTP RPC は、完全なオペレーター向けコントロールプレーンインターフェースです。Gateway HTTP 認証を通過した呼び出し元は、以下の許可リストに登録されたメソッドをすべて呼び出せます。次の条件をすべて満たす場合にのみ有効にしてください。

- 呼び出し元が Gateway の操作を任せられる信頼された主体である。
- 呼び出し元が WebSocket RPC クライアントを使用できない。
- ルートには、ループバック、tailnet、または認証済みのプライベートイングレスからのみアクセスできる。
- 許可されたメソッドを確認済みであり、実行予定の自動化と一致している。

Gateway WebSocket 接続を開いたまま維持できる OpenClaw クライアントや対話型ツールでは、代わりに WebSocket RPC を使用してください。

## 有効化

バンドルされた Plugin を有効にします。

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="設定">
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

ルートは Plugin の起動時に登録されるため、Plugin の設定を変更した後は Gateway を再起動してください。

HTTP インターフェースが不要になったら無効にします。

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## ルートの確認

最小限で安全なリクエストとして `health` を使用します。

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功レスポンスには `ok: true` が含まれます。

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Plugin が無効な場合、ルートが登録されていないため `404` が返されます。

## 認証

Plugin のルートは Gateway HTTP 認証を使用します。

一般的な認証方式は次のとおりです。

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）：`Authorization: Bearer <token-or-password>`
- 信頼された ID 情報を含む HTTP 認証（`gateway.auth.mode="trusted-proxy"`）：設定済みの ID 対応プロキシを経由させ、必要な ID ヘッダーを注入させる
- プライベートイングレスの認証なしモード（`gateway.auth.mode="none"`）：認証ヘッダーは不要

## セキュリティモデル

この Plugin は、完全な Gateway オペレーターインターフェースとして扱ってください。

- Plugin を有効にすると、許可リストに登録された管理 RPC メソッドへのアクセスが `/api/v1/admin/rpc` で意図的に提供されます。
- この Plugin は、予約済みの `contracts.gatewayMethodDispatch: ["authenticated-request"]` マニフェストコントラクトを宣言します。これにより、Gateway 認証済みの HTTP ルートから、プロセス内でコントロールプレーンメソッドをディスパッチできます。これはサンドボックスではありません。このコントラクトは予約済み SDK ヘルパーの誤使用を防ぎますが、信頼された Plugin は引き続き Gateway プロセス内で実行されます。
- 共有シークレットによるベアラー認証（`token`／`password` モード）は、Gateway オペレーターシークレットの所持を証明します。この経路では、より限定的な `x-openclaw-scopes` ヘッダーは無視され、通常の完全なオペレーター権限のデフォルトが復元されます。
- 信頼された ID 情報を含む HTTP 認証（`trusted-proxy` モード）は、`x-openclaw-scopes` が存在する場合にそれを適用します。
- Plugin が有効な状態で `gateway.auth.mode="none"` を使用すると、このルートは未認証になります。この設定は、完全に信頼できるプライベートイングレスの背後でのみ使用してください。
- リクエストは、Plugin ルートの認証を通過した後、WebSocket RPC と同じ Gateway メソッドハンドラーおよびスコープチェックを通じてディスパッチされます。
- このルートには、準備済みの一時停止リース中もアクセスできます。上限付きのリクエスト検証とローカルの `commands.list` 検出レスポンスは引き続き利用できます。Gateway にディスパッチされるメソッドのうち、受付が閉じている間に実行できるのは `gateway.suspend.prepare`、`gateway.suspend.status`、`gateway.suspend.resume` のみです。許可リスト内のその他のメソッドは、通常の再試行可能な Gateway `UNAVAILABLE` レスポンスを返します。
- このルートは、ループバック、tailnet、または信頼されたプライベートイングレス上に限定してください。公開インターネットに直接公開してはなりません。呼び出し元が信頼境界をまたぐ場合は、別々の Gateway を使用してください。

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

フィールド：

- `id`（文字列、省略可能）：レスポンスにコピーされます。省略した場合は UUID が生成されます。
- `method`（文字列、必須）：許可された Gateway メソッド名。
- `params`（任意の型、省略可能）：メソッド固有のパラメーター。

デフォルトのリクエスト本文の最大サイズは 1 MB です。

## レスポンス

成功レスポンスは Gateway RPC の形式を使用します。

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway メソッドのエラーは次の形式を使用します。

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

HTTP ステータスはエラーコードに応じて決まります。

| エラーコード               | HTTP ステータス |
| -------------------------- | --------------- |
| `INVALID_REQUEST`          | 400             |
| `APPROVAL_NOT_FOUND`       | 404             |
| `NOT_LINKED`, `NOT_PAIRED` | 409             |
| `UNAVAILABLE`              | 503             |
| `AGENT_TIMEOUT`            | 504             |
| その他のコード             | 500             |

## 許可されたメソッド

- 検出：`commands.list`
  この Plugin で許可されている HTTP RPC メソッド名を返します。
- Gateway：`health`、`status`、`logs.tail`、`usage.status`、`usage.cost`、`gateway.restart.request`、`gateway.suspend.prepare`、`gateway.suspend.status`、`gateway.suspend.resume`
- 設定：`config.get`、`config.schema`、`config.schema.lookup`、`config.set`、`config.patch`、`config.apply`
- チャンネル：`channels.status`、`channels.start`、`channels.stop`、`channels.logout`
- Web：`web.login.start`、`web.login.wait`
- モデル：`models.list`、`models.authStatus`
- エージェント：`agents.list`、`agents.create`、`agents.update`、`agents.delete`
- 承認：`exec.approvals.get`、`exec.approvals.set`、`exec.approvals.node.get`、`exec.approvals.node.set`
- Cron：`cron.status`、`cron.list`、`cron.get`、`cron.runs`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`
- デバイス：`device.pair.list`、`device.pair.approve`、`device.pair.reject`、`device.pair.remove`
- Node：`node.list`、`node.describe`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.rename`
- タスク：`tasks.list`、`tasks.get`、`tasks.cancel`
- 診断：`doctor.memory.status`、`update.status`

その他の Gateway メソッドは、意図的に追加されるまでブロックされます。

## WebSocket との比較

通常の Gateway WebSocket RPC 経路は、OpenClaw クライアント向けのコントロールプレーン API として引き続き推奨されます。管理 HTTP RPC は、リクエスト／レスポンス型の HTTP インターフェースを必要とするホストツールにのみ使用してください。

信頼されたデバイス ID を持たない共有トークンの WebSocket クライアントは、接続時に管理スコープを自己宣言できません。管理 HTTP RPC は、既存の信頼された HTTP オペレーターモデルに意図的に従います。Plugin が有効な場合、この管理インターフェースでは共有シークレットのベアラー認証が完全なオペレーターアクセスとして扱われます。

## トラブルシューティング

`404 Not Found`

: Plugin が無効になっている、有効化後に Gateway が再起動されていない、またはリクエストが別の Gateway プロセスに送信されています。

`401 Unauthorized`

: リクエストが Gateway HTTP 認証を満たしていません。ベアラートークンまたは trusted-proxy の ID ヘッダーを確認してください。

`405 Method Not Allowed`

: リクエストで `POST` 以外のメソッドが使用されています。

`413 Payload Too Large`

: リクエスト本文が 1 MB の上限を超えています。

`400 INVALID_REQUEST`

: リクエスト本文が有効な JSON ではない、`method` フィールドがない、メソッドが Plugin の許可リストに含まれていない、または一時停止の再開 ID がアクティブなリースと一致していません。

`503 UNAVAILABLE`

: Gateway メソッドが起動中、レート制限中、一時停止中、または競合する一時停止／再開操作の完了待ちです。`error.details` が存在する場合は確認し、再試行する前に `error.retryAfterMs` に従ってください。

## 関連項目

- [オペレータースコープ](/ja-JP/gateway/operator-scopes)
- [Gateway のセキュリティ](/ja-JP/gateway/security)
- [リモートアクセス](/ja-JP/gateway/remote)
- [Plugin マニフェスト](/ja-JP/plugins/manifest#contracts-reference)
- [SDK サブパス](/ja-JP/plugins/sdk-subpaths)
