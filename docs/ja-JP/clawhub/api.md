---
read_when:
    - API クライアントの構築
    - エンドポイントまたはスキーマの追加
summary: 公開 REST API (v1) の概要と規約。
x-i18n:
    generated_at: "2026-07-01T18:06:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ベース: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## 公開カタログの再利用

ClawHubの公開読み取りAPIの上に、サードパーティのカタログ、ディレクトリ、検索サーフェスを構築できます。公開skillメタデータとskillファイルはClawHubのskillライセンス規則に基づいて公開されます。一方、API自体にはレート制限があり、責任を持って利用する必要があります。

ガイドライン:

- カタログ一覧には、`GET /api/v1/skills`、`GET /api/v1/search`、`GET /api/v1/skills/{slug}` などの公開読み取りエンドポイントを使用します。
- 積極的にポーリングするのではなく、レスポンスをキャッシュし、`429`、`Retry-After`、レート制限ヘッダーを尊重します。
- 一覧を表示するときは、ユーザーがソースレジストリレコードを確認できるように、正規のClawHub skill URLへリンクします。
- 正規ページURLは `https://clawhub.ai/<owner>/skills/<slug>` 形式で使用します。
- ClawHubがサードパーティサイトを推奨、検証、運営しているかのように示唆しないでください。
- 公開APIフィルターや認証境界を迂回して、非表示、非公開、またはモデレーションでブロックされたコンテンツをミラーしないでください。

## 認証

- 公開読み取り: トークンは不要です。
- 書き込み + アカウント: `Authorization: Bearer clh_...`。

## レート制限

認証を考慮した適用:

- 匿名リクエスト: IPごと。
- 認証済みリクエスト（有効なBearerトークン）: ユーザーバケットごと。
- トークンがない、または無効な場合はIP単位の適用にフォールバックします。

- 読み取り: IPごとに3000/分、キーごとに12000/分
- 書き込み: IPごとに300/分、キーごとに3000/分
- ダウンロード: IPごとに1200/分、キーごとに6000/分

ヘッダー: `X-RateLimit-Limit`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Reset`;
`429` には `X-RateLimit-Remaining`、`RateLimit-Remaining`、`Retry-After` が含まれます。

セマンティクス:

- `X-RateLimit-Reset`: Unixエポック秒（絶対リセット時刻）
- `RateLimit-Reset`: リセットまでの遅延秒数
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 存在する場合は正確な残り予算。
  シャーディングされた成功リクエストでは、概算のグローバル値を返す代わりに
  省略されます
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

- v1エラーは、`400`、
  `401`、`403`、`404`、`429`、ブロックされたダウンロードのレスポンスを含め、プレーンテキスト（`text/plain; charset=utf-8`）です。
- 不明なクエリパラメーターは、互換性のために無視されます。
- 既知のクエリパラメーターに無効な値がある場合は `400` を返します。

## エンドポイント

公開読み取り:

- `GET /api/v1/search?q=...`
  - 任意のフィルター: `highlightedOnly=true`、`nonSuspiciousOnly=true`
  - レガシーエイリアス: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated`（デフォルト）、`recommended`（`default`）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`）、レガシーインストールエイリアス `installsCurrent`/`installs`/`installsAllTime` は `downloads` にマップされます、`trending`
  - 無効な `sort` 値は `400` を返します
  - `cursor` は `trending` 以外の並べ替えに適用されます
  - 任意のフィルター: `nonSuspiciousOnly=true`
  - レガシーエイリアス: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` の場合、カーソルベースのページに含まれる項目数が `limit` より少ないことがあります。続行するには `nextCursor` を使用します。
  - `recommended` はエンゲージメントと新しさのシグナルを使用します。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - ホストされたskillsは決定論的なZIPバイトを返します。
  - `clean` または `suspicious` のスキャンがある現在のGitHubバックエンドskillは、
    ClawHubバイトの代わりにJSONの `public-github` 引き渡し記述子を返します。
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - ホストされたskillsは保存済みファイルとしてエクスポートされます。
  - `clean` または `suspicious` のスキャンがある現在のGitHubバックエンドskillは、
    `public-github` 引き渡し記述子としてエクスポートされます。
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

- `POST /api/v1/skills`（公開、multipart推奨）
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

- `POST /api/v1/users/reserve` は、所有者ハンドル用にルートslugと非公開のリリースなしpackageプレースホルダーを予約します。

## レガシー

レガシーの `/api/*` と `/api/cli/*` は引き続き利用できます。`DEPRECATIONS.md` を参照してください。
