---
read_when:
    - API クライアントの構築
    - エンドポイントまたはスキーマの追加
summary: 公開 REST API (v1) の概要と規約。
x-i18n:
    generated_at: "2026-07-04T17:47:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## 公開カタログの再利用

ClawHub の公開読み取り API の上に、サードパーティのカタログ、ディレクトリ、検索サーフェスを構築できます。公開 skill メタデータと skill ファイルは ClawHub の skill ライセンスルールの下で公開されます。一方で API 自体にはレート制限があり、責任を持って利用する必要があります。

ガイドライン:

- カタログ一覧には `GET /api/v1/skills`、`GET /api/v1/search`、`GET /api/v1/skills/{slug}` などの公開読み取りエンドポイントを使用します。
- 積極的にポーリングするのではなく、レスポンスをキャッシュし、`429`、`Retry-After`、レート制限ヘッダーを尊重します。
- 一覧を表示するときは、ユーザーがソースレジストリレコードを確認できるように、正規の ClawHub skill URL にリンクします。
- `https://clawhub.ai/<owner>/skills/<slug>` 形式の正規ページ URL を使用します。
- ClawHub がサードパーティサイトを推奨、検証、運営していると示唆しないでください。
- 公開 API フィルターや認証境界を迂回して、非表示、非公開、またはモデレーションでブロックされたコンテンツをミラーしないでください。

## 認証

- 公開読み取り: トークンは不要です。
- 書き込み + アカウント: `Authorization: Bearer clh_...`。

## レート制限

認証を考慮した適用:

- 匿名リクエスト: IP ごと。
- 認証済みリクエスト（有効な Bearer トークン）: ユーザーバケットごと。
- トークンがない、または無効な場合は IP ベースの適用にフォールバックします。

- 読み取り: IP ごとに 3000/min、キーごとに 12000/min
- 書き込み: IP ごとに 300/min、キーごとに 3000/min
- ダウンロード: IP ごとに 1200/min、キーごとに 6000/min

ヘッダー: `X-RateLimit-Limit`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Reset`;
`X-RateLimit-Remaining`、`RateLimit-Remaining`、`Retry-After` は `429` に含まれます。

意味:

- `X-RateLimit-Reset`: Unix エポック秒（絶対リセット時刻）
- `RateLimit-Reset`: リセットまでの遅延秒数
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 存在する場合は正確な残り予算。シャード化された成功リクエストでは、概算のグローバル値を返すのではなく省略されます
- `Retry-After`: `429` で待機する遅延秒数

`429` の例:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

クライアント処理:

- 存在する場合は `Retry-After` を優先します。
- それ以外の場合は `RateLimit-Reset` を使用するか、`X-RateLimit-Reset` から遅延を導出します。
- リトライにジッターを追加します。

## エラー

- v1 エラーは `400`、`401`、`403`、`404`、`429`、ブロックされたダウンロードレスポンスを含め、プレーンテキスト（`text/plain; charset=utf-8`）です。
- 互換性のため、不明なクエリパラメーターは無視されます。
- 無効な値を持つ既知のクエリパラメーターは `400` を返します。

## エンドポイント

公開読み取り:

- `GET /api/v1/search?q=...`
  - 任意フィルター: `highlightedOnly=true`、`nonSuspiciousOnly=true`
  - レガシーエイリアス: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated`（デフォルト）、`recommended`（`default`）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`）、レガシーインストールエイリアス `installsCurrent`/`installs`/`installsAllTime` は `downloads` にマップ、`trending`
  - 無効な `sort` 値は `400` を返します
  - `cursor` は非 `trending` ソートに適用されます
  - 任意フィルター: `nonSuspiciousOnly=true`
  - レガシーエイリアス: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` の場合、カーソルベースのページに含まれる項目数が `limit` より少ないことがあります。続行するには `nextCursor` を使用してください。
  - `recommended` はエンゲージメントと新しさのシグナルを使用します。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - ホストされた skills は決定論的な ZIP バイトを返します。
  - `clean` または `suspicious` のスキャン結果を持つ現在の GitHub バックエンドの skills は、ClawHub バイトの代わりに JSON の `public-github` 引き渡し記述子を返します。
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - ホストされた skills は保存済みファイルとしてエクスポートされます。
  - `clean` または `suspicious` のスキャン結果を持つ現在の GitHub バックエンドの skills は、`public-github` 引き渡し記述子としてエクスポートされます。
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated`（デフォルト）、`recommended`、`downloads`、レガシーエイリアス `installs`
  - 無効な `sort` 値は `400` を返します
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended`（デフォルト）、`downloads`、`updated`、レガシーエイリアス `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

認証が必要:

- `POST /api/v1/skills`（公開、multipart 推奨）
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

管理者のみ:

- `POST /api/v1/users/reserve` は、owner handle の root slugs と、リリースなしの非公開 package プレースホルダーを予約します。

## レガシー

レガシーの `/api/*` と `/api/cli/*` は引き続き利用できます。`DEPRECATIONS.md` を参照してください。
