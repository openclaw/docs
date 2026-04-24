---
read_when:
    - 完全なエージェントターンを実行せずにツールを呼び出す場合
    - ツールポリシーの適用が必要な自動化を構築する場合
summary: Gateway HTTP エンドポイント経由で単一のツールを直接呼び出す
title: Tools invoke API
x-i18n:
    generated_at: "2026-04-24T05:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke（HTTP）

OpenClaw の Gateway は、単一のツールを直接呼び出すためのシンプルな HTTP エンドポイントを公開しています。これは常に有効で、Gateway 認証とツールポリシーを使用します。OpenAI 互換の `/v1/*` サーフェスと同様に、共有シークレットの bearer 認証は gateway 全体に対する信頼済みオペレーターアクセスとして扱われます。

- `POST /tools/invoke`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/tools/invoke`

デフォルトの最大ペイロードサイズは 2 MB です。

## 認証

Gateway の認証設定を使用します。

一般的な HTTP 認証経路:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼済み identity-bearing HTTP 認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの identity-aware proxy を経由してルーティングし、必要な
  identity ヘッダーを挿入させます
- プライベート ingress の open 認証（`gateway.auth.mode="none"`）:
  認証ヘッダー不要

注:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは
  設定済みの非 loopback trusted proxy ソースから来る必要があります。同一ホスト上の loopback proxy はこのモードを満たしません。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、その gateway インスタンスに対する **完全なオペレーターアクセス** サーフェスとして扱ってください。

- ここでの HTTP bearer 認証は、狭い per-user スコープモデルではありません。
- このエンドポイント用の有効な Gateway トークン/パスワードは、オーナー/オペレーター認証情報と同等に扱う必要があります。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送ってきても、このエンドポイントは通常の完全なオペレーターデフォルトを復元します。
- 共有シークレット認証では、このエンドポイント上の直接ツール呼び出しも owner-sender turn として扱われます。
- 信頼済み identity-bearing HTTP モード（たとえば trusted proxy auth や、private ingress 上の `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在すればそれを尊重し、存在しなければ通常のオペレーターデフォルトスコープセットへフォールバックします。
- このエンドポイントは loopback/tailnet/private ingress のみで保持してください。公開インターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 gateway オペレーターシークレットの保持を証明する
  - より狭い `x-openclaw-scopes` を無視する
  - 完全なデフォルトオペレータースコープセットを復元する:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上の直接ツール呼び出しを owner-sender turn として扱う
- 信頼済み identity-bearing HTTP モード（たとえば trusted proxy auth、または private ingress 上の `gateway.auth.mode="none"`）
  - 外側の信頼された identity またはデプロイ境界を認証する
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重する
  - ヘッダーがない場合は通常のオペレーターデフォルトスコープセットへフォールバックする
  - 呼び出し元が明示的にスコープを狭めて `operator.admin` を省略した場合にのみ owner セマンティクスを失う

## リクエストボディ

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
- `action`（文字列、任意）: ツールスキーマが `action` をサポートし、args ペイロードでそれが省略されている場合、args にマッピングされます。
- `args`（オブジェクト、任意）: ツール固有の引数。
- `sessionKey`（文字列、任意）: 対象セッションキー。省略または `"main"` の場合、Gateway は設定済みメインセッションキーを使用します（`session.mainKey` とデフォルトエージェント、または global scope では `global` を尊重）。
- `dryRun`（boolean、任意）: 将来利用のために予約されています。現在は無視されます。

## ポリシー + ルーティング動作

ツールの利用可否は、Gateway エージェントが使用するのと同じポリシーチェーンを通してフィルタされます。

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- グループポリシー（セッションキーがグループまたはチャンネルに対応している場合）
- サブエージェントポリシー（サブエージェントセッションキーで呼び出す場合）

ツールがポリシーで許可されていない場合、このエンドポイントは **404** を返します。

重要な境界に関する注記:

- Exec 承認は、この HTTP エンドポイントに対する別個の認可境界ではなく、オペレーターガードレールです。Gateway 認証 + ツールポリシー経由でツールに到達可能であれば、`/tools/invoke` は追加の呼び出しごとの承認プロンプトを加えません。
- 信頼境界をまたぐ分離が必要な場合は、Gateway bearer 認証情報を信頼できない呼び出し元と共有しないでください。分離が必要なら、別々の gateway（理想的には別 OS ユーザー/別ホスト）を実行してください。

Gateway HTTP は、セッションポリシーがツールを許可していても、デフォルトでハード deny リストも適用します。

- `exec` — 直接コマンド実行（RCE サーフェス）
- `spawn` — 任意の子プロセス作成（RCE サーフェス）
- `shell` — シェルコマンド実行（RCE サーフェス）
- `fs_write` — ホスト上の任意ファイル変更
- `fs_delete` — ホスト上の任意ファイル削除
- `fs_move` — ホスト上の任意ファイル移動/リネーム
- `apply_patch` — patch 適用で任意ファイルを書き換え可能
- `sessions_spawn` — セッションオーケストレーション。リモートでエージェントを起動するのは RCE
- `sessions_send` — セッション間メッセージ注入
- `cron` — 永続的自動化コントロールプレーン
- `gateway` — gateway コントロールプレーン。HTTP 経由の再設定を防止
- `nodes` — node コマンド中継は、ペアリングされたホスト上の system.run に到達可能
- `whatsapp_login` — 端末での QR スキャンが必要な対話型セットアップ。HTTP ではハングする

この deny リストは `gateway.tools` でカスタマイズできます。

```json5
{
  gateway: {
    tools: {
      // HTTP /tools/invoke 経由で追加でブロックするツール
      deny: ["browser"],
      // デフォルト deny リストからツールを削除
      allow: ["gateway"],
    },
  },
}
```

グループポリシーがコンテキストを解決しやすくするために、任意で次を設定できます。

- `x-openclaw-message-channel: <channel>`（例: `slack`, `telegram`）
- `x-openclaw-account-id: <accountId>`（複数アカウントが存在する場合）

## レスポンス

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（無効なリクエストまたはツール入力エラー）
- `401` → 認証されていない
- `429` → 認証レート制限中（`Retry-After` 付き）
- `404` → ツールが利用不可（見つからない、または許可リスト外）
- `405` → 許可されていないメソッド
- `500` → `{ ok: false, error: { type, message } }`（予期しないツール実行エラー。サニタイズ済みメッセージ）

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

- [Gateway protocol](/ja-JP/gateway/protocol)
- [ツールと Plugins](/ja-JP/tools)
