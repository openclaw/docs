---
read_when:
    - 完全なエージェントターンを実行せずにツールを呼び出す
    - ツールポリシーの適用が必要な自動化を構築する
summary: Gateway HTTP エンドポイント経由で単一のツールを直接呼び出す
title: ツール呼び出し API
x-i18n:
    generated_at: "2026-05-10T19:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、単一のツールを直接呼び出すためのシンプルな HTTP エンドポイントを公開します。これは常に有効で、Gateway 認証とツールポリシーを使用します。OpenAI 互換の `/v1/*` サーフェスと同様に、共有シークレットの bearer 認証は、Gateway 全体に対する信頼済みオペレーターアクセスとして扱われます。

- `POST /tools/invoke`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/tools/invoke`

デフォルトの最大ペイロードサイズは 2 MB です。

## 認証

Gateway 認証設定を使用します。

一般的な HTTP 認証パス:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼済み ID を持つ HTTP 認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの ID 対応プロキシを経由し、必要な ID ヘッダーを注入させます
- プライベート ingress のオープン認証（`gateway.auth.mode="none"`）:
  認証ヘッダーは不要です

注記:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは設定済みの信頼済みプロキシソースから来る必要があります。同一ホストの loopback プロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する **完全なオペレーターアクセス** サーフェスとして扱ってください。

- ここでの HTTP bearer 認証は、狭いユーザー別スコープモデルではありません。
- このエンドポイント用の有効な Gateway トークン/パスワードは、所有者/オペレーターの認証情報のように扱うべきです。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信した場合でも、エンドポイントは通常の完全なオペレーターデフォルトを復元します。
- 共有シークレット認証では、このエンドポイント上の直接ツール呼び出しも所有者送信者ターンとして扱います。
- 信頼済み ID を持つ HTTP モード（たとえば信頼済みプロキシ認証、またはプライベート ingress 上の `gateway.auth.mode="none"`）は、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のオペレーターのデフォルトスコープセットにフォールバックします。
- このエンドポイントは loopback/tailnet/private ingress のみに置いてください。公開インターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上の直接ツール呼び出しを所有者送信者ターンとして扱います
- 信頼済み ID を持つ HTTP モード（たとえば信頼済みプロキシ認証、またはプライベート ingress 上の `gateway.auth.mode="none"`）
  - 何らかの外側の信頼済み ID またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーが存在しない場合は通常のオペレーターのデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ所有者セマンティクスを失います

## リクエスト本文

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

フィールド:

- `tool`（文字列、必須）: 呼び出すツール名。
- `action`（文字列、省略可）: ツールスキーマが `action` をサポートし、args ペイロードで省略されている場合に args にマッピングされます。
- `args`（オブジェクト、省略可）: ツール固有の引数。
- `sessionKey`（文字列、省略可）: 対象セッションキー。省略された場合、または `"main"` の場合、Gateway は設定済みのメインセッションキーを使用します（`session.mainKey` とデフォルトエージェントを尊重し、global スコープでは `global`）。
- `dryRun`（ブール値、省略可）: 将来利用のために予約済みです。現在は無視されます。

## ポリシー + ルーティング動作

ツールの可用性は、Gateway エージェントで使用されるものと同じポリシーチェーンを通してフィルタリングされます。

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- グループポリシー（セッションキーがグループまたはチャンネルにマップされる場合）
- サブエージェントポリシー（サブエージェントセッションキーで呼び出す場合）

ツールがポリシーで許可されていない場合、エンドポイントは **404** を返します。

重要な境界注記:

- Exec 承認はオペレーターのガードレールであり、この HTTP エンドポイントのための別個の認可境界ではありません。Gateway 認証 + ツールポリシーによってここでツールに到達できる場合、`/tools/invoke` は追加の呼び出しごとの承認プロンプトを追加しません。
- `exec` にここで到達できる場合、それは変更を伴うシェルサーフェスとして扱ってください。`write`、`edit`、`apply_patch`、または HTTP ファイルシステム書き込みツールを拒否しても、シェル実行が読み取り専用になるわけではありません。
- Gateway bearer 認証情報を信頼できない呼び出し元と共有しないでください。信頼境界をまたいだ分離が必要な場合は、別々の Gateway（理想的には別々の OS ユーザー/ホスト）を実行してください。

Gateway HTTP は、デフォルトでハード拒否リストも適用します（セッションポリシーがツールを許可している場合でも）。

- `exec` - 直接コマンド実行（RCE サーフェス）
- `spawn` - 任意の子プロセス作成（RCE サーフェス）
- `shell` - シェルコマンド実行（RCE サーフェス）
- `fs_write` - ホスト上の任意のファイル変更
- `fs_delete` - ホスト上の任意のファイル削除
- `fs_move` - ホスト上の任意のファイル移動/名前変更
- `apply_patch` - パッチ適用は任意のファイルを書き換え可能
- `sessions_spawn` - セッションオーケストレーション。エージェントをリモートで spawn することは RCE
- `sessions_send` - セッション間メッセージ注入
- `cron` - 永続的な自動化コントロールプレーン
- `gateway` - Gateway コントロールプレーン。HTTP 経由の再設定を防ぎます
- `nodes` - ノードコマンドリレーはペアリング済みホスト上の system.run に到達可能
- `whatsapp_login` - ターミナル QR スキャンを必要とする対話型セットアップ。HTTP ではハングします

この拒否リストは `gateway.tools` でカスタマイズできます。

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

グループポリシーがコンテキストを解決するのを助けるために、必要に応じて次を設定できます。

- `x-openclaw-message-channel: <channel>`（例: `slack`, `telegram`）
- `x-openclaw-account-id: <accountId>`（複数のアカウントが存在する場合）

## レスポンス

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（無効なリクエストまたはツール入力エラー）
- `401` → 未認可
- `429` → 認証レート制限（`Retry-After` が設定されます）
- `404` → ツールを利用できません（見つからない、または allowlist されていません）
- `405` → メソッドが許可されていません
- `500` → `{ ok: false, error: { type, message } }`（予期しないツール実行エラー。メッセージはサニタイズ済み）

## 例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [ツールと plugins](/ja-JP/tools)
