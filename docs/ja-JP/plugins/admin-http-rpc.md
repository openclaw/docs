---
read_when:
    - Gateway WebSocket RPC クライアントを使用できないホストツールの構築
    - プライベートな信頼済みイングレスの背後で Gateway 管理自動化を公開する
    - Gateway メソッドへの HTTP アクセスに関するセキュリティモデルの監査
summary: バンドルされたオプトインの admin-http-rpc Plugin を通じて、選択された Gateway コントロールプレーンメソッドを公開する
title: 管理用 HTTP RPC Plugin
x-i18n:
    generated_at: "2026-06-27T12:06:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

同梱の `admin-http-rpc` Plugin は、通常の Gateway WebSocket RPC クライアントを使用できない信頼済みホスト自動化向けに、選択された Gateway コントロールプレーン メソッドを HTTP 経由で公開します。

この Plugin は OpenClaw に含まれていますが、デフォルトではオフです。無効な場合、ルートは登録されません。有効にすると、次が追加されます。

- `POST /api/v1/admin/rpc`
- Gateway と同じリスナー: `http://<gateway-host>:<port>/api/v1/admin/rpc`

プライベート ホスト ツール、tailnet 自動化、または信頼済みの内部 ingress に対してのみ有効にしてください。このルートを公開インターネットに直接公開しないでください。

## 有効にする前に

管理 HTTP RPC は、完全なオペレーター コントロールプレーン サーフェスです。Gateway HTTP 認証を通過した呼び出し元は、このページで許可リストに入っているメソッドを呼び出せます。

次のすべてが当てはまる場合に使用してください。

- 呼び出し元が Gateway を操作する信頼済み主体である。
- 呼び出し元が WebSocket RPC クライアントを使用できない。
- ルートがループバック、tailnet、またはプライベートな認証済み ingress でのみ到達可能である。
- 許可されたメソッドを確認済みで、それらが実行予定の自動化に一致している。

Gateway WebSocket 接続を開いたままにできる OpenClaw クライアントや対話型ツールには、WebSocket RPC パスを使用してください。

## 有効化

同梱 Plugin を有効にします。

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

ルートは Plugin 起動時に登録されます。Plugin 設定を変更した後は Gateway を再起動してください。

HTTP サーフェスが不要になったら無効にします。

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## ルートを検証する

最小の安全なリクエストとして `health` を使用します。

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功したレスポンスには `ok: true` が含まれます。

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
- 信頼済み ID 付き HTTP 認証 (`gateway.auth.mode="trusted-proxy"`): 設定済みの ID 対応プロキシ経由でルーティングし、必要な ID ヘッダーを挿入させる
- プライベート ingress のオープン認証 (`gateway.auth.mode="none"`): 認証ヘッダーは不要

## セキュリティ モデル

この Plugin は、完全な Gateway オペレーター サーフェスとして扱ってください。

- Plugin を有効にすると、許可リストに入っている管理 RPC メソッドへのアクセスが `/api/v1/admin/rpc` で意図的に提供されます。
- Plugin は予約済みの `contracts.gatewayMethodDispatch: ["authenticated-request"]` マニフェスト コントラクトを宣言するため、その Gateway 認証済み HTTP ルートはプロセス内でコントロールプレーン メソッドをディスパッチできます。
- 共有シークレットの bearer 認証は、gateway オペレーター シークレットの所有を証明します。
- `token` および `password` 認証では、より狭い `x-openclaw-scopes` ヘッダーは無視され、通常の完全なオペレーター デフォルトが復元されます。
- 信頼済み ID 付き HTTP モードでは、存在する場合に `x-openclaw-scopes` が尊重されます。
- `gateway.auth.mode="none"` は、Plugin が有効な場合にこのルートが未認証であることを意味します。完全に信頼できるプライベート ingress の背後でのみ使用してください。
- リクエストは、Plugin ルート認証を通過した後、WebSocket RPC と同じ Gateway メソッド ハンドラーおよびスコープ チェックを通じてディスパッチされます。
- このルートはループバック、tailnet、またはプライベートな信頼済み ingress 上に保ってください。公開インターネットに直接公開しないでください。
- Plugin マニフェスト コントラクトはサンドボックスではありません。予約済み SDK ヘルパーの偶発的な使用を防ぎますが、信頼済み Plugin は引き続き Gateway プロセス内で実行されます。

呼び出し元が信頼境界をまたぐ場合は、別々の gateway を使用してください。

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

成功レスポンスは Gateway RPC の形を使用します。

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway メソッド エラーは次を使用します。

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

可能な場合、HTTP ステータスは Gateway エラーに従います。たとえば、`INVALID_REQUEST` は `400` を返し、`UNAVAILABLE` は `503` を返します。

## 許可されたメソッド

- 検出: `commands.list`
  この Plugin で許可されている HTTP RPC メソッド名を返します。
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- 設定: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- チャンネル: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- Web: `web.login.start`, `web.login.wait`
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

通常の Gateway WebSocket RPC パスは、OpenClaw クライアント向けの推奨コントロールプレーン API のままです。管理 HTTP RPC は、リクエスト/レスポンス型の HTTP サーフェスを必要とするホスト ツールにのみ使用してください。

信頼済みデバイス ID を持たない共有トークン WebSocket クライアントは、接続時に管理スコープを自己宣言できません。管理 HTTP RPC は、既存の信頼済み HTTP オペレーター モデルに意図的に従います。Plugin が有効な場合、共有シークレット bearer 認証は、この管理サーフェスに対する完全なオペレーター アクセスとして扱われます。

## トラブルシューティング

`404 Not Found`

: Plugin が無効である、Gateway が有効化後に再起動されていない、またはリクエストが別の Gateway プロセスに送信されています。

`401 Unauthorized`

: リクエストが Gateway HTTP 認証を満たしていません。bearer トークンまたは trusted-proxy ID ヘッダーを確認してください。

`400 INVALID_REQUEST`

: リクエスト本文が有効な JSON ではない、`method` フィールドが欠落している、またはメソッドが Plugin の許可リストに含まれていません。

`503 UNAVAILABLE`

: Gateway メソッド ハンドラーが利用できません。Gateway ログを確認し、Gateway の起動完了後に再試行してください。

## 関連

- [オペレーター スコープ](/ja-JP/gateway/operator-scopes)
- [Gateway セキュリティ](/ja-JP/gateway/security)
- [リモート アクセス](/ja-JP/gateway/remote)
- [Plugin マニフェスト](/ja-JP/plugins/manifest#contracts)
- [SDK サブパス](/ja-JP/plugins/sdk-subpaths)
