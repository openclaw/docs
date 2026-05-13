---
read_when:
    - エンドポイントの追加/変更
    - CLI とレジストリ間のリクエストのデバッグ
summary: HTTP API リファレンス（公開 + CLI エンドポイント + 認証）。
x-i18n:
    generated_at: "2026-05-13T04:17:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

ベース URL: `https://clawhub.ai` (デフォルト)。

すべての v1 パスは `/api/v1/...` 配下にあります。
従来の `/api/...` と `/api/cli/...` は互換性のために残されています (`DEPRECATIONS.md` を参照)。
OpenAPI: `/api/v1/openapi.json`。

## 公開カタログの再利用

サードパーティのディレクトリは、公開読み取りエンドポイントを使って ClawHub Skills を一覧表示または検索できます。結果をキャッシュし、`429`/`Retry-After` を尊重し、ユーザーを正規の ClawHub リスト (`https://clawhub.ai/<owner>/<slug>`) へ戻すリンクを設け、サードパーティサイトを ClawHub が推奨していると示唆しないでください。公開 API サーフェスの外で、非表示、非公開、またはモデレーションによりブロックされたコンテンツをミラーしようとしないでください。

Web スラッグのショートカットはレジストリファミリーを横断して解決されますが、API クライアントはルートの優先順位を再構築するのではなく、読み取りエンドポイントが返す正規 URL を使うべきです。

## レート制限

適用モデル:

- 匿名リクエスト: IP ごとに適用されます。
- 認証済みリクエスト (有効な Bearer トークン): ユーザーバケットごとに適用されます。
- トークンがない、または無効な場合、動作は IP ベースの適用にフォールバックします。
- 認証済み書き込みエンドポイントは、サーバーが理由を把握している場合に素の `Unauthorized` を返すべきではありません。トークンの欠落、無効化または失効したトークン、削除済み、BAN 済み、無効化されたアカウントは、それぞれ CLI クライアントがユーザーに何が妨げになっているかを伝えられるように、実行可能な文言を返すべきです。

- 読み取り: IP ごとに 600/分、キーごとに 2400/分
- 書き込み: IP ごとに 45/分、キーごとに 180/分
- ダウンロード: IP ごとに 30/分、キーごとに 180/分 (`/api/v1/download`)

ヘッダー:

- 従来互換: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 標準化済み: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429` 時: `Retry-After`

ヘッダーの意味:

- `X-RateLimit-Reset`: 絶対 Unix epoch 秒
- `RateLimit-Reset`: リセットまでの秒数 (遅延)
- `Retry-After`: `429` 時に再試行前に待つ秒数 (遅延)

`429` レスポンスの例:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

クライアント向けガイダンス:

- `Retry-After` が存在する場合は、その秒数だけ待ってから再試行します。
- 同期した再試行を避けるため、ジッター付きバックオフを使います。
- `Retry-After` がない場合は、`RateLimit-Reset` にフォールバックします (または `X-RateLimit-Reset` から計算します)。

IP ソース:

- デフォルトではクライアント IP に `cf-connecting-ip` (Cloudflare) を使います。
- ClawHub は信頼された転送ヘッダーを使って、エッジでクライアント IP を識別します。
- 信頼されたクライアント IP が利用できない場合、匿名ダウンロードリクエストは、単一のグローバルな `ip:unknown` バケットではなく、エンドポイント単位のフォールバックバケットを使います。匿名の読み取り/書き込みリクエストは引き続き共有の unknown バケットを使うため、IP 欠落ルーティングは可視で保守的なままです。

## 公開エンドポイント (認証なし)

### `GET /api/v1/search`

クエリパラメーター:

- `q` (必須): クエリ文字列
- `limit` (任意): 整数
- `highlightedOnly` (任意): `true` でハイライトされた Skills のみに絞り込み
- `nonSuspiciousOnly` (任意): `true` で疑わしい (`flagged.suspicious`) Skills を非表示
- `nonSuspicious` (任意): `nonSuspiciousOnly` の従来エイリアス

レスポンス:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

注記:

- 結果は関連度順で返されます (埋め込み類似度 + 正確なスラッグ/名前トークンのブースト + ダウンロード数からの人気度事前分布)。
- 関連度は人気度より強く扱われます。正確なスラッグまたは表示名トークンの一致は、ダウンロード数が大幅に多い緩い一致より上位になることがあります。
- ASCII テキストは単語と句読点の境界でトークン化されます。たとえば、`personal-map` には独立した `map` トークンが含まれますが、`amap-jsapi-skill` には `amap`、`jsapi`、`skill` が含まれます。そのため、`map` を検索すると、`amap-jsapi-skill` よりも `personal-map` のほうが強い語彙一致になります。
- ダウンロード数は、主要なランキングシグナルではなく、小さな対数スケールの事前分布およびタイブレーカーとして使われます。クエリテキストとの一致が弱い場合、ダウンロード数の多い Skills が低くランクされることがあります。
- 疑わしい、または非表示のモデレーション状態により、呼び出し元のフィルターと現在のモデレーション状態に応じて、公開検索から Skill が除外されることがあります。

パブリッシャー向けの見つけやすさガイダンス:

- ユーザーが実際に検索する語句を、表示名、概要、タグに入れてください。独立したスラッグトークンは、それが保持したい安定した識別子でもある場合にのみ使ってください。
- 1 つのクエリを追いかけるためだけにスラッグを変更しないでください。新しいスラッグが長期的により優れた正規名である場合だけ変更してください。古いスラッグはリダイレクトエイリアスになりますが、正規 URL、表示されるスラッグ、今後の検索ダイジェストでは新しいスラッグが使われます。
- 名前変更エイリアスは、古い URL とレジストリ経由で解決されるインストールの解決を保持しますが、検索ランキングは、名前変更がインデックス化された後の正規 Skill メタデータに基づきます。既存の統計は Skill に残ります。
- Skill が予期せず表示されない場合は、ランキング関連メタデータを変更する前に、ログインした状態で `clawhub inspect <slug>` を使ってまずモデレーション状態を確認してください。

### `GET /api/v1/skills`

クエリパラメーター:

- `limit` (任意): 整数 (1–200)
- `cursor` (任意): `trending` 以外の任意のソート用ページネーションカーソル
- `sort` (任意): `updated` (デフォルト), `createdAt` (エイリアス: `newest`), `downloads`, `stars` (エイリアス: `rating`), `installsCurrent` (エイリアス: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (任意): `true` で疑わしい (`flagged.suspicious`) Skills を非表示
- `nonSuspicious` (任意): `nonSuspiciousOnly` の従来エイリアス

注記:

- `trending` は直近 7 日間のインストール数でランク付けされます (テレメトリベース)。
- `createdAt` は新規 Skill クロールで安定しています。`updated` は既存の Skills が再公開されると変わります。
- `nonSuspiciousOnly=true` の場合、カーソルベースのソートでは、ページ取得後に疑わしい Skills がフィルターされるため、ページ上の項目数が `limit` より少なくなることがあります。
- 存在する場合は、`nextCursor` を使ってページネーションを続行してください。短いページだけでは結果の終端を意味しません。

レスポンス:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

レスポンス:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

注記:

- オーナーの名前変更/マージフローで作成された古いスラッグは、正規 Skill に解決されます。
- `metadata.os`: Skill frontmatter で宣言された OS 制限 (例: `["macos"]`, `["linux"]`)。宣言されていない場合は `null`。
- `metadata.systems`: Nix システムターゲット (例: `["aarch64-darwin", "x86_64-linux"]`)。宣言されていない場合は `null`。
- Skill にプラットフォームメタデータがない場合、`metadata` は `null` です。
- `moderation` は、Skill がフラグ付けされている場合、またはオーナーが閲覧している場合にのみ含まれます。

### `GET /api/v1/skills/{slug}/moderation`

構造化されたモデレーション状態を返します。

レスポンス:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

注記:

- オーナーとモデレーターは、非表示 Skills のモデレーション詳細にアクセスできます。
- 公開呼び出し元が `200` を受け取るのは、すでにフラグ付けされていて可視の Skills のみです。
- 証拠は公開呼び出し元向けには編集され、オーナー/モデレーター向けにのみ生スニペットを含みます。

### `POST /api/v1/skills/{slug}/report`

モデレーターのレビュー用に Skill を報告します。報告は Skill レベルで、任意でバージョンにリンクされ、Skill 報告キューに送られます。

認証:

- API トークンが必要です。

リクエスト:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

レスポンス:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Skill 報告の取り込み用モデレーター/admin エンドポイント。

クエリパラメーター:

- `status` (任意): `open` (デフォルト), `confirmed`, `dismissed`, または `all`
- `limit` (任意): 整数 (1-200)
- `cursor` (任意): ページネーションカーソル

レスポンス:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Skill 報告を解決または再オープンするためのモデレーター/admin エンドポイント。

リクエスト:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` と `dismissed` では `note` が必須です。`status` を `open` に戻す場合は省略できます。トリアージ済みの報告で `finalAction: "hide"` を渡すと、同じ監査可能なワークフロー内で Skill を非表示にします。

### `GET /api/v1/skills/{slug}/versions`

クエリパラメーター:

- `limit` (任意): 整数
- `cursor` (任意): ページネーションカーソル

### `GET /api/v1/skills/{slug}/versions/{version}`

バージョンメタデータ + ファイル一覧を返します。

- `version.security` は、利用可能な場合、正規化されたスキャン検証ステータスとスキャナー詳細 (VirusTotal + LLM) を含みます。

### `GET /api/v1/skills/{slug}/scan`

Skill バージョンのセキュリティスキャン検証詳細を返します。

クエリパラメーター:

- `version` (任意): 特定のバージョン文字列。
- `tag` (任意): タグ付きバージョンを解決します (例: `latest`)。

注記:

- `version` と `tag` のどちらも指定されていない場合は、最新バージョンを使います。
- 正規化された検証ステータスと、スキャナー固有の詳細を含みます。
- `security.capabilityTags` は、検出された場合に `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`, `requires-oauth-token`, `posts-externally` などの決定的な機能/リスクラベルを含みます。
- `security.hasScanResult` が `true` になるのは、スキャナーが確定的な判定 (`clean`, `suspicious`, または `malicious`) を生成した場合のみです。
- `moderation` は、最新バージョンから導出された現在の Skill レベルのモデレーションスナップショットです。
- 過去のバージョンをクエリする場合は、`moderation` と `security` を同じバージョンコンテキストとして扱う前に、`moderation.matchesRequestedVersion` と `moderation.sourceVersion` を確認してください。

### `GET /api/v1/skills/{slug}/file`

生のテキストコンテンツを返します。

クエリパラメーター:

- `path` (必須)
- `version` (任意)
- `tag` (任意)

注記:

- デフォルトは最新バージョンです。
- ファイルサイズ制限: 200KB。

### `GET /api/v1/packages`

以下の統合カタログエンドポイント:

- Skills
- コード Plugin
- バンドル Plugin

クエリパラメーター:

- `limit` (任意): integer (1–100)
- `cursor` (任意): ページネーションカーソル
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `executesCode` (任意): `true` または `false`
- `capabilityTag` (任意): Plugin パッケージ用の capability フィルター
- `target` / `hostTarget` (任意): `host:<target>` の省略形
- `os`、`arch`、`libc` (任意): ホスト capability フィルターの省略形
- `requiresBrowser`、`requiresDesktop`、`requiresNativeDeps`、
  `requiresExternalService`、`requiresBinary`、`requiresOsPermission`
  (任意): 環境要件タグの `true`/`1` 省略形
- `externalService`、`binary`、`osPermission` (任意): 名前付き
  環境要件タグの省略形
- `artifactKind` (任意): `legacy-zip` または `npm-pack`
- `npmMirror` (任意): npm ミラー経由で利用可能な ClawPack ベースの
  パッケージバージョンを表示するには `true`/`1`

注記:

- `GET /api/v1/code-plugins` と `GET /api/v1/bundle-plugins` は固定 family エイリアスのままです。
- Skill エントリーは引き続き skill registry によって支えられ、`POST /api/v1/skills` 経由でのみ公開できます。
- `POST /api/v1/packages` は引き続き code-plugin と bundle-plugin のリリース専用です。
- 匿名呼び出し元には公開パッケージチャネルのみが表示されます。
- 認証済み呼び出し元は、自分が所属する公開元のプライベートパッケージを一覧/検索結果で確認できます。
- `channel=private` は、認証済み呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/packages/search`

Skill と Plugin パッケージを横断する統合カタログ検索。

クエリパラメーター:

- `q` (必須): クエリ文字列
- `limit` (任意): integer (1–100)
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `executesCode` (任意): `true` または `false`
- `capabilityTag` (任意): Plugin パッケージ用の capability フィルター
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary`、および
  `osPermission` は、一般的な capability タグの省略形として受け付けられます
- `artifactKind` (任意): `legacy-zip` または `npm-pack`
- `npmMirror` (任意): npm ミラー経由で利用可能な ClawPack ベースの
  パッケージバージョンを検索するには `true`/`1`

注記:

- 匿名呼び出し元には公開パッケージチャネルのみが表示されます。
- 認証済み呼び出し元は、自分が所属する公開元のプライベートパッケージを検索できます。
- `channel=private` は、認証済み呼び出し元が読み取れるパッケージのみを返します。
- アーティファクトフィルターは、インデックス済み capability タグによって支えられています:
  `artifact:legacy-zip`、`artifact:npm-pack`、および `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

パッケージ詳細メタデータを返します。

注記:

- Skills は統合カタログ内でこのルート経由でも解決できます。
- プライベートパッケージは、呼び出し元が所有元の公開元を読み取れない限り `404` を返します。

### `DELETE /api/v1/packages/{name}`

パッケージとすべてのリリースをソフト削除します。

注記:

- パッケージ所有者、組織公開元の所有者/管理者、プラットフォームモデレーター、またはプラットフォーム管理者の API トークンが必要です。

### `GET /api/v1/packages/{name}/versions`

バージョン履歴を返します。

クエリパラメーター:

- `limit` (任意): integer (1–100)
- `cursor` (任意): ページネーションカーソル

注記:

- プライベートパッケージは、呼び出し元が所有元の公開元を読み取れない限り `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}`

ファイルメタデータ、互換性、capabilities、検証、アーティファクトメタデータ、スキャンデータを含む、1 つのパッケージバージョンを返します。

注記:

- `version.artifact.kind` は、旧形式のパッケージアーカイブでは `legacy-zip`、
  ClawPack ベースのリリースでは `npm-pack` です。
- ClawPack リリースには、npm 互換の `npmIntegrity`、`npmShasum`、および
  `npmTarballName` フィールドが含まれます。
- `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis`、および `version.staticScan` は、スキャンデータが存在する場合に含まれます。
- プライベートパッケージは、呼び出し元が所有元の公開元を読み取れない限り `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}/security`

インストールクライアント向けに、正確なパッケージリリースのセキュリティと信頼のサマリーを返します。これは、解決済みリリースをインストールできるかどうかを判断するための公開 OpenClaw 消費サーフェスです。

認証:

- 公開読み取りエンドポイントです。所有者、公開元、モデレーター、または管理者のトークンは不要です。

レスポンス:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

レスポンスフィールド:

- `package.name`、`package.displayName`、および `package.family` は、解決済みの registry パッケージを識別します。
- `release.releaseId`、`release.version`、および `release.createdAt` は、評価された正確なリリースを識別します。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum`、および `release.npmTarballName` は、リリースアーティファクトについて判明している場合に存在します。
- `trust.scanStatus` は、スキャナー入力と手動リリースモデレーションから導出された有効な信頼ステータスです。
- `trust.moderationState` は null 許容です。手動リリースモデレーションが存在しない場合は `null` です。
- `trust.blockedFromDownload` はインストールブロックシグナルです。OpenClaw やその他のインストールクライアントは、この値が `true` の場合、スキャナーやモデレーションフィールドからブロックルールを再導出するのではなく、インストールをブロックする必要があります。
- `trust.reasons` は、ユーザー向けおよび監査用の説明リストです。理由コードは、`manual:quarantined`、`scan:malicious`、`static:malicious`、`vt:suspicious`、`package:malicious` のような安定した短い文字列です。
- `trust.pending` は、1 つ以上の信頼入力がまだ完了待ちであることを意味します。
- `trust.stale` は、信頼サマリーが古い入力から計算されており、高い信頼度で許可を判断する前に更新が必要なものとして扱う必要があることを意味します。

注記:

- このエンドポイントはバージョン厳密です。クライアントは、最新のパッケージメタデータを読んだ直後ではなく、インストール予定のパッケージバージョンを解決した後に呼び出す必要があります。
- プライベートパッケージは、呼び出し元が所有元の公開元を読み取れない限り `404` を返します。
- このエンドポイントは、所有者/モデレーター用のモデレーションエンドポイントより意図的に範囲を狭くしています。インストール判断と公開説明を公開し、報告者の身元、報告本文、非公開証拠、内部レビューのタイムラインは公開しません。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

パッケージバージョンに対する明示的なアーティファクトリゾルバーメタデータを返します。

注記:

- レガシーパッケージバージョンは、`legacy-zip` アーティファクトとレガシー ZIP
  `downloadUrl` を返します。
- ClawPack バージョンは、`npm-pack` アーティファクト、npm integrity フィールド、
  `tarballUrl`、およびレガシー ZIP 互換 URL を返します。
- これは OpenClaw のリゾルバーサーフェスです。共有 URL からアーカイブ形式を推測することを避けます。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

明示的なリゾルバーパス経由でバージョンアーティファクトをダウンロードします。

注記:

- ClawPack バージョンは、アップロードされた正確な npm-pack `.tgz` バイトをストリーミングします。
- レガシー ZIP バージョンは `/api/v1/packages/{name}/download?version=` にリダイレクトします。
- ダウンロード rate bucket を使用します。

### `GET /api/v1/packages/{name}/readiness`

将来の OpenClaw 消費に向けて計算された readiness を返します。

Readiness チェックの対象:

- 公式チャネルステータス
- 最新バージョンの可用性
- ClawPack npm-pack アーティファクトの可用性
- アーティファクトダイジェスト
- ソースリポジトリとコミットの来歴
- OpenClaw 互換性メタデータ
- ホストターゲット
- スキャン状態

レスポンス:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

公式 OpenClaw Plugin 移行行を一覧表示するモデレーターエンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `phase` (任意): `planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw`、または
  `all` (デフォルト)。
- `limit` (任意): integer (1-100)
- `cursor` (任意): ページネーションカーソル

レスポンス:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

公式 Plugin 移行行を作成または更新する管理者エンドポイント。

認証:

- 管理者ユーザーの API トークンが必要です。

リクエスト本文:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

注記:

- `bundledPluginId` は小文字に正規化され、安定した upsert キーです。
- `packageName` は npm 名として正規化されます。計画済み移行ではパッケージが存在しない場合があります。
- これは移行 readiness のみを追跡します。OpenClaw を変更したり、ClawPack を生成したりしません。

### `GET /api/v1/packages/moderation/queue`

パッケージリリースレビューキュー用のモデレーター/管理者エンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `status` (任意): `open` (デフォルト)、`blocked`、`manual`、または `all`
- `limit` (任意): integer (1-100)
- `cursor` (任意): ページネーションカーソル

ステータスの意味:

- `open`: suspicious、malicious、pending、quarantined、revoked、または報告済みのリリース。
- `blocked`: quarantined、revoked、または malicious なリリース。
- `manual`: 手動モデレーション上書きがあるすべてのリリース。
- `all`: 手動上書き、clean ではないスキャン状態、またはパッケージ報告があるすべてのリリース。

レスポンス:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

モデレーターのレビュー用にパッケージを報告します。報告はパッケージ単位で、任意で
バージョンにリンクできます。報告はモデレーションキューに送られますが、それ自体で
自動的に非表示にしたりダウンロードをブロックしたりはしません。モデレーターは
リリースモデレーションを使用して、アーティファクトを承認、隔離、または取り消す必要があります。

認証:

- API トークンが必要です。

リクエスト:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

レスポンス:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

パッケージ報告の受け付け用のモデレーター/管理者向けエンドポイントです。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `status` (任意): `open` (デフォルト)、`confirmed`、`dismissed`、または `all`
- `limit` (任意): 整数 (1-100)
- `cursor` (任意): ページネーションカーソル

レスポンス:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

パッケージのモデレーション表示用の所有者/モデレーター向けエンドポイントです。

認証:

- パッケージ所有者、パブリッシャーメンバー、モデレーター、または
  管理者ユーザーの API トークンが必要です。

レスポンス:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

パッケージ報告を解決または再オープンするためのモデレーター/管理者向けエンドポイントです。

リクエスト:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` は `confirmed` と `dismissed` で必須です。`status` を `open` に戻す場合は
省略できます。確認済みの報告で `finalAction: "quarantine"` または
`finalAction: "revoke"` を渡すと、同じ監査可能なワークフロー内でリリースモデレーションを適用できます。

レスポンス:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

パッケージリリースレビュー用のモデレーター/管理者向けエンドポイントです。

リクエスト:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

サポートされる状態:

- `approved`: 手動でレビューされ、許可されています。
- `quarantined`: フォローアップ待ちでブロックされています。
- `revoked`: 以前に信頼されたリリースが後からブロックされています。

隔離または取り消されたリリースは、アーティファクトのダウンロードルートから `403` を返します。
すべての変更で監査ログエントリーが書き込まれます。

### `POST /api/v1/packages/backfill/artifacts`

古いパッケージリリースに明示的なアーティファクト種別メタデータを付与するための
管理者専用メンテナンスエンドポイントです。

リクエスト本文:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

レスポンス:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

メモ:

- デフォルトはドライランです。
- ClawPack ストレージのないリリースは `legacy-zip` としてラベル付けされます。
- `artifactKind` が欠落している既存の ClawPack backed 行は
  `npm-pack` として修復されます。
- これは ClawPack を生成せず、アーティファクトのバイト列も変更しません。

### `GET /api/v1/packages/{name}/file`

パッケージファイルの生テキスト内容を返します。

クエリパラメーター:

- `path` (必須)
- `version` (任意)
- `tag` (任意)

メモ:

- デフォルトは最新リリースです。
- ダウンロードバケットではなく読み取りレートバケットを使用します。
- バイナリファイルは `415` を返します。
- ファイルサイズ上限: 200KB。
- 保留中の VirusTotal スキャンは読み取りをブロックしません。悪意のあるリリースは別の場所で引き続き差し止められる場合があります。
- プライベートパッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `GET /api/v1/packages/{name}/download`

パッケージリリース用のレガシーな決定的 ZIP アーカイブをダウンロードします。

クエリパラメーター:

- `version` (任意)
- `tag` (任意)

メモ:

- デフォルトは最新リリースです。
- Skills は `GET /api/v1/download` にリダイレクトします。
- Plugin/パッケージアーカイブは `package/` ルートを持つ zip ファイルで、古い OpenClaw
  クライアントが動作し続けます。
- このルートは ZIP 専用のままです。ClawPack `.tgz` ファイルをストリームしません。
- レスポンスには、リゾルバーの整合性チェック用に `ETag`、`Digest`、`X-ClawHub-Artifact-Type`、および
  `X-ClawHub-Artifact-Sha256` ヘッダーが含まれます。
- レジストリ専用メタデータは、ダウンロードされたアーカイブに注入されません。
- 保留中の VirusTotal スキャンはダウンロードをブロックしません。悪意のあるリリースは `403` を返します。
- プライベートパッケージは、呼び出し元が所有者である場合を除き `404` を返します。

### `GET /api/npm/{package}`

ClawPack backed パッケージバージョン用の npm 互換 packument を返します。

メモ:

- アップロード済みの ClawPack npm-pack tarball があるバージョンのみが一覧表示されます。
- レガシーな ZIP 専用バージョンは意図的に省略されます。
- `dist.tarball`、`dist.integrity`、および `dist.shasum` は npm 互換の
  フィールドを使用するため、ユーザーは必要に応じて npm をミラーに向けられます。
- スコープ付きパッケージの packument は、`/api/npm/@scope/name` と npm の
  エンコード済み `/api/npm/@scope%2Fname` リクエストパスの両方をサポートします。

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ミラークライアント用に、アップロードされた正確な ClawPack tarball バイト列をストリームします。

メモ:

- ダウンロードレートバケットを使用します。
- ダウンロードヘッダーには、ClawHub SHA-256 に加えて npm integrity/shasum メタデータが含まれます。
- モデレーションおよびプライベートパッケージアクセスのチェックは引き続き適用されます。

### `GET /api/v1/resolve`

CLI がローカルフィンガープリントを既知のバージョンにマッピングするために使用します。

クエリパラメーター:

- `slug` (必須)
- `hash` (必須): バンドルフィンガープリントの 64 文字 16 進 sha256

レスポンス:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Skill バージョンの zip をダウンロードします。

クエリパラメーター:

- `slug` (必須)
- `version` (任意): semver 文字列
- `tag` (任意): タグ名 (例: `latest`)

メモ:

- `version` と `tag` のどちらも指定されない場合は、最新バージョンが使用されます。
- 論理削除されたバージョンは `410` を返します。
- ダウンロード統計は、1 時間ごとの一意の ID としてカウントされます (API トークンが有効な場合は `userId`、それ以外は IP)。

## 認証エンドポイント (Bearer token)

すべてのエンドポイントに次が必要です。

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

トークンを検証し、ユーザーハンドルを返します。

### `POST /api/v1/skills`

新しいバージョンを公開します。

- 推奨: `payload` JSON + `files[]` blobs を含む `multipart/form-data`。
- `files` (storageId ベース) を含む JSON 本文も受け付けます。
- 任意の payload フィールド: `ownerHandle`。存在する場合、API はその
  パブリッシャーをサーバー側で解決し、アクターにパブリッシャーアクセス権があることを要求します。
- 任意の payload フィールド: `migrateOwner`。`ownerHandle` とともに `true` の場合、
  アクターが現在と移行先の両方のパブリッシャーで管理者/所有者であれば、既存の Skill をその所有者に移動できます。
  このオプトインがない場合、所有者変更は拒否されます。

### `POST /api/v1/packages`

code-plugin または bundle-plugin リリースを公開します。

- Bearer token 認証が必要です。
- 推奨: `payload` JSON + `files[]` blobs を含む `multipart/form-data`。
- `files` (storageId ベース) を含む JSON 本文も受け付けます。
- 任意の payload フィールド: `ownerHandle`。存在する場合、管理者のみがその所有者に代わって公開できます。

検証の要点:

- `family` は `code-plugin` または `bundle-plugin` である必要があります。
- Plugin パッケージには `openclaw.plugin.json` が必要です。ClawPack `.tgz` アップロードでは、
  `package/openclaw.plugin.json` に含まれている必要があります。
- コード Plugin には、`package.json`、ソースリポジトリメタデータ、ソースコミット
  メタデータ、設定スキーマメタデータ、`openclaw.compat.pluginApi`、および
  `openclaw.build.openclawVersion` が必要です。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
- 信頼されたパブリッシャーのみが `official` チャンネルに公開できます。
- 代理公開でも、公式チャンネルの適格性は対象所有者アカウントに対して検証されます。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skill を論理削除/復元します (所有者、モデレーター、または管理者)。

任意の JSON 本文:

```json
{ "reason": "Held for moderation pending legal review." }
```

存在する場合、`reason` は Skill のモデレーションメモとして保存され、監査ログにコピーされます。
所有者が開始した論理削除では slug が 30 日間予約され、その後は別のパブリッシャーが
その slug を取得できます。この期限が適用される場合、削除レスポンスには `slugReservedUntil` が含まれます。
モデレーター/管理者による非表示およびセキュリティ削除は、このようには期限切れになりません。

削除レスポンス:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

ステータスコード:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/user not found
- `500`: internal server error

### `POST /api/v1/users/publisher`

管理者専用です。ハンドルに対して組織パブリッシャーが存在することを保証します。ハンドルがまだ
レガシーな共有ユーザー/個人パブリッシャーを指している場合、エンドポイントはまずそれを組織パブリッシャーに移行します。

- 本文: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- レスポンス: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

管理者専用です。リリースを公開せず、正当な所有者のためにルート slug とパッケージ名を予約します。
パッケージ名はリリース行のないプライベートなプレースホルダーパッケージになるため、同じ
所有者が後で実際の code-plugin または bundle-plugin リリースをその名前で公開できます。

- 本文: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- レスポンス: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 所有者 slug 管理エンドポイント

- `POST /api/v1/skills/{slug}/rename`
  - 本文: `{ "newSlug": "new-canonical-slug" }`
  - レスポンス: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文: `{ "targetSlug": "canonical-target-slug" }`
  - レスポンス: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

メモ:

- どちらのエンドポイントも API トークン認証が必要で、Skill 所有者に対してのみ動作します。
- `rename` は以前の slug をリダイレクトエイリアスとして保持します。
- `merge` はソースの一覧を非表示にし、ソース slug をターゲットの一覧にリダイレクトします。

### 所有権移転エンドポイント

- `POST /api/v1/skills/{slug}/transfer`
  - 本文: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - レスポンス: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - レスポンス (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - レスポンス形状: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

ユーザーをBANし、所有する Skills を物理削除します（モデレーター/管理者のみ）。

本文:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

または

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

レスポンス:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ユーザーのBANを解除し、対象となる Skills を復元します（管理者のみ）。

本文:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

または

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

レスポンス:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

ユーザーのロールを変更します（管理者のみ）。

本文:

```json
{ "handle": "user_handle", "role": "moderator" }
```

または

```json
{ "userId": "users_...", "role": "admin" }
```

レスポンス:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

ユーザーの一覧表示または検索を行います（管理者のみ）。

クエリパラメータ:

- `q`（任意）: 検索クエリ
- `query`（任意）: `q` のエイリアス
- `limit`（任意）: 最大結果数（デフォルト 20、最大 200）

レスポンス:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

スター（ハイライト）を追加/削除します。どちらのエンドポイントもべき等です。

レスポンス:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## レガシー CLI エンドポイント（非推奨）

古い CLI バージョン向けに引き続きサポートされています:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

削除計画については `DEPRECATIONS.md` を参照してください。

## レジストリ検出（`/.well-known/clawhub.json`）

CLI はサイトからレジストリ/認証設定を検出できます:

- `/.well-known/clawhub.json`（JSON、推奨）
- `/.well-known/clawdhub.json`（レガシー）

スキーマ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

セルフホストする場合は、このファイルを提供してください（または `CLAWHUB_REGISTRY` を明示的に設定します。レガシーは `CLAWDHUB_REGISTRY`）。
