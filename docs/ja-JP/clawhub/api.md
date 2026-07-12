---
read_when:
    - API クライアントの構築
    - エンドポイントまたはスキーマの追加
summary: 公開 REST API（v1）の概要と規則。
x-i18n:
    generated_at: "2026-07-11T22:05:04Z"
    model: gpt-5.6
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

ClawHub の公開読み取り API を基盤として、サードパーティのカタログ、ディレクトリ、または検索機能を構築できます。公開されているスキルのメタデータとスキルファイルは ClawHub のスキルライセンス規則に基づいて公開されています。一方、API 自体にはレート制限があるため、責任を持って利用してください。

ガイドライン:

- カタログ一覧には、`GET /api/v1/skills`、`GET /api/v1/search`、`GET /api/v1/skills/{slug}` などの公開読み取りエンドポイントを使用します。
- 過度なポーリングは避け、レスポンスをキャッシュし、`429`、`Retry-After`、レート制限ヘッダーに従います。
- 一覧を表示する際は、ユーザーが元のレジストリレコードを確認できるように、正規の ClawHub スキル URL へのリンクを設けます。
- `https://clawhub.ai/<owner>/skills/<slug>` 形式の正規ページ URL を使用します。
- ClawHub がサードパーティサイトを推奨、検証、または運営しているかのように示唆しないでください。
- 公開 API のフィルターや認証境界を回避して、非表示、非公開、またはモデレーションによりブロックされたコンテンツをミラーリングしないでください。

## 認証

- 公開読み取り: トークンは不要です。
- 書き込み + アカウント: `Authorization: Bearer clh_...`。

## レート制限

認証状態を考慮した適用:

- 匿名リクエスト: IP 単位。
- 認証済みリクエスト（有効な Bearer トークン）: ユーザー単位のバケット。
- トークンがないか無効な場合は、IP 単位の適用にフォールバックします。

- 読み取り: IP 単位で 3000/分、キー単位で 12000/分
- 書き込み: IP 単位で 300/分、キー単位で 3000/分
- ダウンロード: IP 単位で 1200/分、キー単位で 6000/分

ヘッダー: `X-RateLimit-Limit`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Reset`;
`429` には `X-RateLimit-Remaining`、`RateLimit-Remaining`、`Retry-After` も含まれます。

セマンティクス:

- `X-RateLimit-Reset`: Unix エポック秒（絶対リセット時刻）
- `RateLimit-Reset`: リセットまでの待機秒数
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 存在する場合は正確な残り割り当て量。シャーディングされた成功リクエストでは、概算のグローバル値を返すのではなく省略されます
- `Retry-After`: `429` の際に待機する秒数

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

- `Retry-After` が存在する場合は優先して使用します。
- それ以外の場合は `RateLimit-Reset` を使用するか、`X-RateLimit-Reset` から待機時間を算出します。
- 再試行にジッターを加えます。

## エラー

- v1 のエラーは、`400`、`401`、`403`、`404`、`429`、およびブロックされたダウンロードのレスポンスを含め、プレーンテキスト（`text/plain; charset=utf-8`）です。
- 不明なクエリパラメーターは、互換性のため無視されます。
- 既知のクエリパラメーターに無効な値を指定すると `400` が返されます。

## エンドポイント

公開読み取り:

- `GET /api/v1/search?q=...`
  - オプションのフィルター: `highlightedOnly=true`、`nonSuspiciousOnly=true`
  - 旧エイリアス: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated`（デフォルト）、`recommended`（`default`）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`）、旧インストールエイリアス `installsCurrent`/`installs`/`installsAllTime` は `downloads` に対応、`trending`
  - 無効な `sort` 値を指定すると `400` が返されます
  - `cursor` は `trending` 以外の並べ替えに適用されます
  - オプションのフィルター: `nonSuspiciousOnly=true`
  - 旧エイリアス: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` の場合、カーソルベースのページに含まれる項目数が `limit` より少なくなることがあります。続行するには `nextCursor` を使用します。
  - `recommended` はエンゲージメントと新しさのシグナルを使用します。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - ホストされているスキルは、決定論的な ZIP バイト列を返します。
  - `clean` または `suspicious` のスキャン結果を持つ現在の GitHub ベースのスキルは、ClawHub のバイト列ではなく、JSON の `public-github` 引き継ぎ記述子を返します。
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - ホストされているスキルは、保存されたファイルとしてエクスポートされます。
  - `clean` または `suspicious` のスキャン結果を持つ現在の GitHub ベースのスキルは、`public-github` 引き継ぎ記述子としてエクスポートされます。
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated`（デフォルト）、`recommended`、`downloads`、旧エイリアス `installs`
  - 無効な `sort` 値を指定すると `400` が返されます
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended`（デフォルト）、`downloads`、`updated`、旧エイリアス `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

認証必須:

- `POST /api/v1/skills`（公開、マルチパートを推奨）
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

- `POST /api/v1/users/reserve` は、所有者ハンドル用にルートスラッグと非公開のリリースなしパッケージプレースホルダーを予約します。

## レガシー

従来の `/api/*` と `/api/cli/*` も引き続き利用できます。`DEPRECATIONS.md` を参照してください。
