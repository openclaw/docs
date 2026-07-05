---
read_when:
    - 完全なエージェントターンを実行せずにツールを呼び出す
    - ツールポリシーの適用が必要な自動化の構築
summary: Gateway HTTP エンドポイント経由で単一のツールを直接呼び出す
title: ツール呼び出し API
x-i18n:
    generated_at: "2026-07-05T11:24:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、単一のツールを直接呼び出すための HTTP エンドポイントを公開します。これは常に有効で、Gateway 認証とツールポリシーを使用します。OpenAI 互換の `/v1/*` サーフェスと同様に、共有シークレットの bearer 認証は、Gateway 全体に対する信頼済みオペレーターアクセスとして扱われます。

- `POST /tools/invoke`
- Gateway と同じポート（WS + HTTP マルチプレックス）: `http://<gateway-host>:<port>/tools/invoke`
- デフォルトの最大リクエスト本文サイズ: 2 MB

## 認証

Gateway 認証設定を使用します。

一般的な HTTP 認証パス:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）: `Authorization: Bearer <token-or-password>`
- 信頼済み ID 付き HTTP 認証（`gateway.auth.mode="trusted-proxy"`）: 設定済みの ID 対応プロキシ経由でルーティングし、必要な ID ヘッダーを注入させます
- プライベート ingress のオープン認証（`gateway.auth.mode="none"`）: 認証ヘッダーは不要です

注意:

- `mode="token"` は `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `mode="password"` は `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `mode="trusted-proxy"` では、HTTP リクエストが設定済みの信頼済みプロキシソースから来る必要があります。同一ホストの loopback プロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- プロキシを迂回する内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使用できます。`Forwarded`、`X-Forwarded-*`、または `X-Real-IP` ヘッダーの証拠がある場合、代わりにリクエストは trusted-proxy パスに留まります。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する**完全なオペレーターアクセス**サーフェスとして扱ってください。

- ここでの HTTP bearer 認証は、狭いユーザー別スコープモデルではありません。
- このエンドポイント用の有効な Gateway トークン/パスワードは、所有者/オペレーターの認証情報と同様に扱うべきです。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信した場合でも、エンドポイントは通常の完全なオペレーター既定値を復元します。
- 共有シークレット認証では、このエンドポイントでの直接ツール呼び出しも owner-sender ターンとして扱います。
- 信頼済み ID 付き HTTP モード（trusted proxy 認証、またはプライベート ingress 上の `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のオペレーター既定スコープセットにフォールバックします。
- このエンドポイントは loopback/tailnet/プライベート ingress のみに置いてください。公開インターネットへ直接公開しないでください。

認証マトリクス:

| 認証モード                                                                              | 動作                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` または `password` + `Authorization: Bearer ...`                                 | 共有 Gateway オペレーターシークレットの所持を証明します。より狭い `x-openclaw-scopes` は無視します。完全な既定オペレータースコープセット `operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write` を復元します。直接ツール呼び出しを owner-sender ターンとして扱います。 |
| 信頼済み ID 付き HTTP（trusted proxy 認証、またはプライベート ingress 上の `mode="none"`） | 外側の信頼済み ID またはデプロイ境界を認証します。`x-openclaw-scopes` が存在する場合はそれを尊重します。ヘッダーがない場合は、通常のオペレーター既定スコープセットにフォールバックします。呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ所有者セマンティクスを失います。                               |

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

- `tool` / `name`（文字列、必須）: 呼び出すツール名。両方が送信された場合は `name` が優先されます。
- `action`（文字列、省略可）: ツールスキーマが `action` プロパティをサポートし、`args` がまだ設定していない場合、`args.action` にマージされます。
- `args`（オブジェクト、省略可）: ツール固有の引数。
- `sessionKey`（文字列、省略可）: 対象セッションキー。省略された場合、または `"main"` の場合、Gateway は設定済みのメインセッションキーを使用します（`session.mainKey` と既定のエージェント、またはグローバルセッションスコープ内の `global` を尊重します）。
- `agentId`（文字列、省略可）: そのエージェントのセッションキーを解決します。すでに別のエージェントにマップされている明示的な `sessionKey` と競合する場合は `400` でエラーになります。
- `idempotencyKey`（文字列、省略可）: 呼び出し用の安定したツール呼び出し ID を導出するために使用されます。
- `dryRun`（ブール値、省略可）: 将来の使用のために予約されています。現在は無視されます。

## ポリシー + ルーティング動作

ツールの可用性は、Gateway エージェントが使用するものと同じポリシーチェーンを通じてフィルタリングされます。

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- グループポリシー（セッションキーがグループまたはチャンネルにマップされる場合）
- サブエージェントポリシー（サブエージェントセッションキーで呼び出す場合）

ポリシーでツールが許可されていない場合、エンドポイントは **404** を返します。

重要な境界上の注意:

- Exec 承認はオペレーターのガードレールであり、この HTTP エンドポイントの別個の認可境界ではありません。Gateway 認証 + ツールポリシーを通じてここでツールに到達できる場合、`/tools/invoke` は呼び出しごとの追加承認プロンプトを追加しません。
- ここで `exec` に到達できる場合、それは変更を伴うシェルサーフェスとして扱ってください。`write`、`edit`、`apply_patch`、または HTTP ファイルシステム書き込みツールを拒否しても、シェル実行が読み取り専用になるわけではありません。
- Gateway bearer 認証情報を信頼できない呼び出し元と共有しないでください。信頼境界をまたいだ分離が必要な場合は、別々の Gateway を実行してください（理想的には別々の OS ユーザー/ホスト上）。

Gateway HTTP は、デフォルトでハード拒否リストも適用します（セッションポリシーがツールを許可している場合でも）。

| ツール           | 理由                                                      |
| ---------------- | --------------------------------------------------------- |
| `exec`           | 直接コマンド実行（RCE サーフェス）                       |
| `spawn`          | 任意の子プロセス作成（RCE サーフェス）                   |
| `shell`          | シェルコマンド実行（RCE サーフェス）                     |
| `fs_write`       | ホスト上の任意ファイル変更                               |
| `fs_delete`      | ホスト上の任意ファイル削除                               |
| `fs_move`        | ホスト上の任意ファイル移動/名前変更                      |
| `apply_patch`    | パッチ適用により任意ファイルを書き換え可能               |
| `sessions_spawn` | セッションオーケストレーション。リモートでのエージェント生成は RCE |
| `sessions_send`  | セッション間メッセージ注入                               |
| `cron`           | 永続的な自動化コントロールプレーン                       |
| `gateway`        | Gateway コントロールプレーン。HTTP 経由の再設定を防止    |
| `nodes`          | Node コマンドリレーはペアリング済みホスト上の `system.run` に到達可能 |

`cron`、`gateway`、`nodes` は owner-only でもあります。このデフォルト拒否リストの外であっても、所有者でない呼び出し元はこのサーフェスでそれらを呼び出せません。

一般的な拒否リストは `gateway.tools` でカスタマイズします。

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` は公開オーバーライドであり、スコープ昇格ではありません。ID 付き HTTP モードでは、`cron`、`gateway`、`nodes` は、`gateway.tools.allow` に記載されていても、owner/admin ID（`operator.admin`）を持たない呼び出し元には引き続き利用できません。共有シークレット bearer 認証は、引き続き上記の完全な信頼済みオペレータールールに従います。

グループポリシーがコンテキストを解決しやすくするため、任意で次を設定できます。

- `x-openclaw-message-channel: <channel>`（例: `slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（複数アカウントが存在する場合）
- `x-openclaw-message-to: <target>`（メッセージツールポリシー用の配信対象）
- `x-openclaw-thread-id: <threadId>`（メッセージツールポリシー用のスレッドコンテキスト）

## レスポンス

| ステータス | 意味                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                         |
| `400`  | `{ ok: false, error: { type, message } }`（無効なリクエストまたはツール入力エラー）            |
| `401`  | 未認可                                                                                         |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }`（ポリシーによりツール呼び出しがブロック） |
| `404`  | ツールを利用できません（見つからない、または allowlist に含まれていない）                     |
| `405`  | メソッドは許可されていません                                                                   |
| `408`  | リクエスト本文の読み取りがタイムアウトしました                                                 |
| `413`  | リクエスト本文が最大ペイロードサイズを超えました                                               |
| `429`  | 認証がレート制限されています（`Retry-After` が設定済み）                                      |
| `500`  | `{ ok: false, error: { type, message } }`（予期しないツール実行エラー。メッセージはサニタイズ済み） |

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
