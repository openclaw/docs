---
read_when:
    - 完全なエージェントターンを実行せずにツールを呼び出す
    - ツールポリシーの強制適用が必要な自動化を構築する
summary: Gateway HTTP エンドポイント経由で単一のツールを直接呼び出す
title: ツール呼び出し API
x-i18n:
    generated_at: "2026-04-30T05:16:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# ツール呼び出し (HTTP)

OpenClaw の Gateway は、単一のツールを直接呼び出すためのシンプルな HTTP エンドポイントを公開します。これは常に有効で、Gateway 認証とツールポリシーを使用します。OpenAI 互換の `/v1/*` サーフェスと同様に、共有シークレットのベアラー認証は Gateway 全体に対する信頼済みオペレーターアクセスとして扱われます。

- `POST /tools/invoke`
- Gateway と同じポート (WS + HTTP 多重化): `http://<gateway-host>:<port>/tools/invoke`

デフォルトの最大ペイロードサイズは 2 MB です。

## 認証

Gateway 認証設定を使用します。

一般的な HTTP 認証パス:

- 共有シークレット認証 (`gateway.auth.mode="token"` または `"password"`):
  `Authorization: Bearer <token-or-password>`
- 信頼済み ID 付き HTTP 認証 (`gateway.auth.mode="trusted-proxy"`):
  設定済みの ID 認識プロキシを経由し、必要な ID ヘッダーを
  注入させます
- プライベートイングレスのオープン認証 (`gateway.auth.mode="none"`):
  認証ヘッダーは不要です

注記:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token` (または `OPENCLAW_GATEWAY_TOKEN`) を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password` (または `OPENCLAW_GATEWAY_PASSWORD`) を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは
  設定済みの信頼済みプロキシソースから来る必要があります。同一ホストのループバックプロキシには、明示的に
  `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界 (重要)

このエンドポイントは、Gateway インスタンスに対する **完全なオペレーターアクセス** サーフェスとして扱ってください。

- ここでの HTTP ベアラー認証は、狭いユーザー単位のスコープモデルではありません。
- このエンドポイントの有効な Gateway トークン/パスワードは、所有者/オペレーター資格情報のように扱う必要があります。
- 共有シークレット認証モード (`token` と `password`) では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信しても、エンドポイントは通常の完全なオペレーターデフォルトを復元します。
- 共有シークレット認証では、このエンドポイント上の直接ツール呼び出しも所有者送信者ターンとして扱います。
- 信頼済み ID 付き HTTP モード (たとえば信頼済みプロキシ認証、またはプライベートイングレス上の `gateway.auth.mode="none"`) は、存在する場合は `x-openclaw-scopes` を尊重し、存在しない場合は通常のオペレーターデフォルトスコープセットにフォールバックします。
- このエンドポイントは loopback/tailnet/プライベートイングレスのみに置いてください。公開インターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上の直接ツール呼び出しを所有者送信者ターンとして扱います
- 信頼済み ID 付き HTTP モード (たとえば信頼済みプロキシ認証、またはプライベートイングレス上の `gateway.auth.mode="none"`)
  - 何らかの外側の信頼済み ID またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
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

- `tool` (文字列、必須): 呼び出すツール名。
- `action` (文字列、任意): ツールスキーマが `action` をサポートし、args ペイロードがそれを省略した場合に args へマッピングされます。
- `args` (オブジェクト、任意): ツール固有の引数。
- `sessionKey` (文字列、任意): 対象セッションキー。省略された場合、または `"main"` の場合、Gateway は設定済みのメインセッションキーを使用します (`session.mainKey` とデフォルトエージェントを尊重します。グローバルスコープでは `global`)。
- `dryRun` (ブール値、任意): 将来の使用のために予約されています。現在は無視されます。

## ポリシー + ルーティング動作

ツールの可用性は、Gateway エージェントで使用されるものと同じポリシーチェーンを通してフィルタリングされます。

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- グループポリシー (セッションキーがグループまたはチャンネルにマップされる場合)
- サブエージェントポリシー (サブエージェントセッションキーで呼び出す場合)

ツールがポリシーで許可されていない場合、エンドポイントは **404** を返します。

重要な境界に関する注記:

- Exec 承認はオペレーター向けのガードレールであり、この HTTP エンドポイントに対する別個の認可境界ではありません。Gateway 認証 + ツールポリシーを通じてここでツールに到達できる場合、`/tools/invoke` は追加の呼び出しごとの承認プロンプトを追加しません。
- Gateway ベアラー資格情報を信頼できない呼び出し元と共有しないでください。信頼境界をまたぐ分離が必要な場合は、別々の Gateway を実行してください (理想的には OS ユーザー/ホストも分けます)。

Gateway HTTP は、デフォルトでハード拒否リストも適用します (セッションポリシーがツールを許可している場合でも):

- `exec` — 直接コマンド実行 (RCE サーフェス)
- `spawn` — 任意の子プロセス作成 (RCE サーフェス)
- `shell` — シェルコマンド実行 (RCE サーフェス)
- `fs_write` — ホスト上の任意のファイル変更
- `fs_delete` — ホスト上の任意のファイル削除
- `fs_move` — ホスト上の任意のファイル移動/名前変更
- `apply_patch` — パッチ適用は任意のファイルを書き換えられます
- `sessions_spawn` — セッションオーケストレーション。リモートでのエージェント生成は RCE です
- `sessions_send` — セッション間メッセージ注入
- `cron` — 永続的な自動化コントロールプレーン
- `gateway` — Gateway コントロールプレーン。HTTP 経由の再設定を防ぎます
- `nodes` — ノードコマンドリレーは、ペアリングされたホスト上の system.run に到達できます
- `whatsapp_login` — 端末での QR スキャンが必要な対話型セットアップ。HTTP ではハングします

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

グループポリシーがコンテキストを解決しやすくするため、任意で次を設定できます。

- `x-openclaw-message-channel: <channel>` (例: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (複数のアカウントが存在する場合)

## レスポンス

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (無効なリクエストまたはツール入力エラー)
- `401` → 認可なし
- `429` → 認証レート制限中 (`Retry-After` が設定されます)
- `404` → ツールを利用できません (見つからない、または許可リストにありません)
- `405` → メソッドは許可されていません
- `500` → `{ ok: false, error: { type, message } }` (予期しないツール実行エラー。メッセージはサニタイズされます)

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
