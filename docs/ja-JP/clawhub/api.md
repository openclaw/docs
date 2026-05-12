---
read_when:
    - APIクライアントの構築
    - エンドポイントまたはスキーマの追加
summary: 公開 REST API (v1) の概要と規約。
x-i18n:
    generated_at: "2026-05-12T08:44:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

ベース: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## 公開カタログの再利用

ClawHub の公開読み取り API の上に、サードパーティのカタログ、ディレクトリ、または検索サーフェスを構築できます。公開スキルメタデータとスキルファイルは ClawHub のスキルライセンス規則の下で公開されます。一方、API 自体にはレート制限があり、責任を持って利用する必要があります。

ガイドライン:

- カタログ一覧には、`GET /api/v1/skills`、`GET /api/v1/search`、`GET /api/v1/skills/{slug}` などの公開読み取りエンドポイントを使用します。
- 積極的にポーリングするのではなく、レスポンスをキャッシュし、`429`、`Retry-After`、レート制限ヘッダーを尊重します。
- 一覧を表示するときは、ユーザーがソースレジストリレコードを確認できるように、正規の ClawHub スキル URL へリンクします。
- 正規ページ URL は `https://clawhub.ai/<owner>/<slug>` の形式を使用します。
- ClawHub がサードパーティサイトを推奨、検証、または運営していると示唆しないでください。
- 公開 API フィルターや認証境界を迂回して、非表示、非公開、またはモデレーションでブロックされたコンテンツをミラーしないでください。

## 認証

- 公開読み取り: トークンは不要です。
- 書き込み + アカウント: `Authorization: Bearer clh_...`。

## レート制限

認証を考慮した強制:

- 匿名リクエスト: IP ごと。
- 認証済みリクエスト（有効な Bearer トークン）: ユーザーバケットごと。
- トークンがない、または無効な場合は IP ベースの強制にフォールバックします。

- 読み取り: IP ごとに 600/分、キーごとに 2400/分
- 書き込み: IP ごとに 45/分、キーごとに 180/分

ヘッダー: `X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`、`Retry-After`（429 の場合）。

意味:

- `X-RateLimit-Reset`: Unix エポック秒（絶対リセット時刻）
- `RateLimit-Reset`: リセットまでの遅延秒数
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

クライアント側の処理:

- 存在する場合は `Retry-After` を優先します。
- それ以外の場合は `RateLimit-Reset` を使用するか、`X-RateLimit-Reset` から遅延を導出します。
- 再試行にジッターを追加します。

## エンドポイント

公開読み取り:

- `GET /api/v1/search?q=...`
  - 任意フィルター: `highlightedOnly=true`、`nonSuspiciousOnly=true`
  - レガシーエイリアス: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated`（デフォルト）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`）、`installsCurrent`（`installs`）、`installsAllTime`、`trending`
  - `cursor` は `trending` 以外のソートに適用されます
  - 任意フィルター: `nonSuspiciousOnly=true`
  - レガシーエイリアス: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` の場合、カーソルベースのページには `limit` より少ない項目しか含まれないことがあります。続行するには `nextCursor` を使用します。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

認証必須:

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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

管理者のみ:

- `POST /api/v1/users/reserve` は所有者ハンドル用に、ルート slug と非公開のリリースなしパッケージプレースホルダーを予約します。

## レガシー

レガシーの `/api/*` と `/api/cli/*` はまだ利用可能です。`DEPRECATIONS.md` を参照してください。
