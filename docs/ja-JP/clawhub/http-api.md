---
read_when:
    - エンドポイントの追加/変更
    - CLI ↔ レジストリ間リクエストのデバッグ
summary: HTTP API リファレンス (公開 + CLI エンドポイント + 認証)。
x-i18n:
    generated_at: "2026-05-13T05:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

ベース URL: `https://clawhub.ai` (デフォルト)。

すべての v1 パスは `/api/v1/...` 配下にあります。
互換性のため、レガシーの `/api/...` と `/api/cli/...` は残っています (`DEPRECATIONS.md` を参照)。
OpenAPI: `/api/v1/openapi.json`。

## 公開カタログの再利用

サードパーティのディレクトリは、公開読み取りエンドポイントを使用して ClawHub Skills を一覧表示または検索できます。結果をキャッシュし、`429`/`Retry-After` を尊重し、ユーザーを正規の ClawHub 掲載ページ (`https://clawhub.ai/<owner>/<slug>`) にリンクし、ClawHub がそのサードパーティサイトを推奨していると示唆しないでください。公開 API サーフェスの外で、非表示、非公開、またはモデレーションでブロックされたコンテンツをミラーしようとしないでください。

Web スラッグのショートカットはレジストリファミリーをまたいで解決されますが、API クライアントはルート優先順位を再構築するのではなく、読み取りエンドポイントから返された正規 URL を使用する必要があります。

## レート制限

適用モデル:

- 匿名リクエスト: IP ごとに適用されます。
- 認証済みリクエスト (有効な Bearer トークン): ユーザーバケットごとに適用されます。
- トークンが欠落または無効な場合、動作は IP ベースの適用にフォールバックします。
- 認証済み書き込みエンドポイントでは、サーバーが理由を把握している場合、単独の `Unauthorized` を返すべきではありません。トークンの欠落、無効または取り消されたトークン、削除済み、禁止済み、無効化済みアカウントには、それぞれ CLI クライアントがユーザーにブロック理由を伝えられるよう、対応可能なテキストを返す必要があります。

- 読み取り: IP ごとに 600/分、キーごとに 2400/分
- 書き込み: IP ごとに 45/分、キーごとに 180/分
- ダウンロード: IP ごとに 30/分、キーごとに 180/分 (`/api/v1/download`)

ヘッダー:

- レガシー互換性: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 標準化済み: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429` 時: `Retry-After`

ヘッダーの意味:

- `X-RateLimit-Reset`: 絶対 Unix エポック秒
- `RateLimit-Reset`: リセットまでの秒数 (遅延)
- `Retry-After`: `429` 時に再試行前に待機する秒数 (遅延)

`429` レスポンス例:

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

- `Retry-After` が存在する場合、再試行前にその秒数だけ待機してください。
- 同期した再試行を避けるため、ジッター付きバックオフを使用してください。
- `Retry-After` がない場合は、`RateLimit-Reset` にフォールバックしてください (または `X-RateLimit-Reset` から計算してください)。

IP ソース:

- デフォルトでは、クライアント IP に `cf-connecting-ip` (Cloudflare) を使用します。
- ClawHub はエッジでクライアント IP を識別するために信頼された転送ヘッダーを使用します。
- 信頼されたクライアント IP が利用できない場合、匿名ダウンロードリクエストは、グローバルな単一の `ip:unknown` バケットではなく、エンドポイント単位のフォールバックバケットを使用します。匿名の読み取り/書き込みリクエストは引き続き共有 unknown バケットを使用するため、IP 欠落のルーティングは可視で保守的なままです。

## 公開エンドポイント (認証なし)

### `GET /api/v1/search`

クエリパラメーター:

- `q` (必須): クエリ文字列
- `limit` (任意): 整数
- `highlightedOnly` (任意): ハイライトされた Skills に絞り込むには `true`
- `nonSuspiciousOnly` (任意): 疑わしい (`flagged.suspicious`) Skills を非表示にするには `true`
- `nonSuspicious` (任意): `nonSuspiciousOnly` のレガシーエイリアス

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

- 結果は関連度順で返されます (埋め込み類似度 + 正確なスラッグ/名前トークンのブースト + ダウンロード数による人気度事前分布)。
- 関連度は人気度より強く扱われます。正確なスラッグまたは表示名トークンの一致は、ダウンロード数がはるかに多い緩い一致より上位になることがあります。
- ASCII テキストは単語境界と句読点境界でトークン化されます。たとえば、`personal-map` には独立した `map` トークンが含まれますが、`amap-jsapi-skill` には `amap`、`jsapi`、`skill` が含まれます。そのため、`map` を検索すると、`amap-jsapi-skill` より `personal-map` の方が強い字句一致になります。
- ダウンロード数は小さな対数スケールの事前分布および同順位の決定要素として使用され、主要なランキングシグナルではありません。クエリテキストとの一致が弱い場合、ダウンロード数の多い Skills が下位になることがあります。
- 疑わしい、または非表示のモデレーション状態により、呼び出し元のフィルターと現在のモデレーション状態に応じて、Skills が公開検索から除外されることがあります。

パブリッシャー向けの発見性ガイダンス:

- ユーザーが実際に検索する用語を、表示名、概要、タグに入れてください。独立したスラッグトークンは、それを維持したい安定した識別子でもある場合にのみ使用してください。
- 新しいスラッグが長期的により良い正規名である場合を除き、1 つのクエリを追うためだけにスラッグを変更しないでください。古いスラッグはリダイレクトエイリアスになりますが、正規 URL、表示されるスラッグ、将来の検索ダイジェストでは新しいスラッグが使用されます。
- 名前変更エイリアスは、レジストリ経由で解決される古い URL とインストールの解決を維持しますが、検索ランキングは、名前変更後にインデックス化された正規 Skills メタデータに基づきます。既存の統計は Skills に残ります。
- Skills が予期せず表示されない場合は、ランキング関連メタデータを変更する前に、ログインした状態で `clawhub inspect <slug>` を使ってまずモデレーション状態を確認してください。

### `GET /api/v1/skills`

クエリパラメーター:

- `limit` (任意): 整数 (1–200)
- `cursor` (任意): `trending` 以外の任意のソート用ページネーションカーソル
- `sort` (任意): `updated` (デフォルト), `createdAt` (エイリアス: `newest`), `downloads`, `stars` (エイリアス: `rating`), `installsCurrent` (エイリアス: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (任意): 疑わしい (`flagged.suspicious`) Skills を非表示にするには `true`
- `nonSuspicious` (任意): `nonSuspiciousOnly` のレガシーエイリアス

注記:

- `trending` は過去 7 日間のインストール数に基づいてランク付けされます (テレメトリーベース)。
- `createdAt` は新しい Skills のクロールで安定しています。`updated` は既存の Skills が再公開されたときに変わります。
- `nonSuspiciousOnly=true` の場合、疑わしい Skills はページ取得後にフィルターされるため、カーソルベースのソートではページ上の項目数が `limit` 未満になることがあります。
- 存在する場合は `nextCursor` を使用してページネーションを継続してください。短いページだけでは、結果の終端を意味しません。

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

- オーナーの名前変更/マージフローで作成された古いスラッグは、正規の Skills に解決されます。
- `metadata.os`: Skills のフロントマターで宣言された OS 制限 (例: `["macos"]`, `["linux"]`)。宣言されていない場合は `null`。
- `metadata.systems`: Nix システムターゲット (例: `["aarch64-darwin", "x86_64-linux"]`)。宣言されていない場合は `null`。
- Skills にプラットフォームメタデータがない場合、`metadata` は `null` です。
- `moderation` は、Skills がフラグ付きである場合、またはオーナーが表示している場合にのみ含まれます。

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

- オーナーとモデレーターは、非表示の Skills のモデレーション詳細にアクセスできます。
- 公開呼び出し元は、すでにフラグ付きで表示されている Skills に対してのみ `200` を受け取ります。
- 証拠は公開呼び出し元向けには編集され、オーナー/モデレーター向けにのみ生のスニペットを含みます。

### `POST /api/v1/skills/{slug}/report`

モデレーターレビューのために Skills を報告します。報告は Skills レベルで、任意でバージョンに関連付けられ、Skills 報告キューに送られます。

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

Skills 報告取り込み用のモデレーター/管理者エンドポイントです。

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

Skills 報告を解決または再オープンするためのモデレーター/管理者エンドポイントです。

リクエスト:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` は `confirmed` と `dismissed` では必須です。`status` を `open` に戻す場合は省略できます。トリアージ済みの報告とともに `finalAction: "hide"` を渡すと、同じ監査可能なワークフロー内で Skills を非表示にできます。

### `GET /api/v1/skills/{slug}/versions`

クエリパラメーター:

- `limit` (任意): 整数
- `cursor` (任意): ページネーションカーソル

### `GET /api/v1/skills/{slug}/versions/{version}`

バージョンメタデータ + ファイル一覧を返します。

- `version.security` には、利用可能な場合、正規化されたスキャン検証ステータスとスキャナー詳細 (VirusTotal + LLM) が含まれます。

### `GET /api/v1/skills/{slug}/scan`

Skills バージョンのセキュリティスキャン検証詳細を返します。

クエリパラメーター:

- `version` (任意): 特定のバージョン文字列。
- `tag` (任意): タグ付きバージョンを解決します (例: `latest`)。

注記:

- `version` と `tag` のどちらも指定されていない場合、最新バージョンを使用します。
- 正規化された検証ステータスと、スキャナー固有の詳細が含まれます。
- `security.capabilityTags` には、検出された場合に `crypto`、`requires-wallet`、`can-make-purchases`、`can-sign-transactions`、`requires-oauth-token`、`posts-externally` などの決定的な機能/リスクラベルが含まれます。
- `security.hasScanResult` は、スキャナーが明確な判定 (`clean`, `suspicious`, または `malicious`) を生成した場合にのみ `true` です。
- `moderation` は、最新バージョンから派生した現在の Skills レベルのモデレーションスナップショットです。
- 履歴バージョンをクエリする場合、`moderation` と `security` を同じバージョンコンテキストとして扱う前に、`moderation.matchesRequestedVersion` と `moderation.sourceVersion` を確認してください。

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

次のための統合カタログエンドポイント:

- Skills
- コード Plugin
- バンドル Plugin

クエリパラメーター:

- `limit` (任意): 整数 (1–100)
- `cursor` (任意): ページネーションカーソル
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `executesCode` (任意): `true` または `false`
- `capabilityTag` (任意): plugin パッケージのケイパビリティフィルター
- `target` / `hostTarget` (任意): `host:<target>` の省略形
- `os`、`arch`、`libc` (任意): ホストケイパビリティフィルターの省略形
- `requiresBrowser`、`requiresDesktop`、`requiresNativeDeps`、
  `requiresExternalService`、`requiresBinary`、`requiresOsPermission`
  (任意): 環境要件タグの `true`/`1` 省略形
- `externalService`、`binary`、`osPermission` (任意): 名前付き
  環境要件タグの省略形
- `artifactKind` (任意): `legacy-zip` または `npm-pack`
- `npmMirror` (任意): npm ミラー経由で利用可能な ClawPack バックのパッケージバージョンを表示するための `true`/`1`

注記:

- `GET /api/v1/code-plugins` と `GET /api/v1/bundle-plugins` は固定ファミリーのエイリアスのままです。
- Skill エントリは引き続き Skill レジストリをバックエンドとし、`POST /api/v1/skills` 経由でのみ公開できます。
- `POST /api/v1/packages` は引き続き code-plugin と bundle-plugin のリリース専用です。
- 匿名呼び出し元には公開パッケージチャンネルのみが表示されます。
- 認証済み呼び出し元は、所属する公開元の非公開パッケージを一覧/検索結果で確認できます。
- `channel=private` は、認証済み呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/packages/search`

Skills + plugin パッケージ全体の統合カタログ検索。

クエリパラメーター:

- `q` (必須): クエリ文字列
- `limit` (任意): 整数 (1–100)
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `executesCode` (任意): `true` または `false`
- `capabilityTag` (任意): plugin パッケージのケイパビリティフィルター
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary`、および
  `osPermission` は、一般的なケイパビリティタグの省略形として受け付けられます
- `artifactKind` (任意): `legacy-zip` または `npm-pack`
- `npmMirror` (任意): npm ミラー経由で利用可能な ClawPack バックのパッケージバージョンを検索するための `true`/`1`

注記:

- 匿名呼び出し元には公開パッケージチャンネルのみが表示されます。
- 認証済み呼び出し元は、所属する公開元の非公開パッケージを検索できます。
- `channel=private` は、認証済み呼び出し元が読み取れるパッケージのみを返します。
- アーティファクトフィルターは、インデックス化されたケイパビリティタグによってバックアップされます:
  `artifact:legacy-zip`、`artifact:npm-pack`、および `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

パッケージ詳細メタデータを返します。

注記:

- Skills は統合カタログ内でこのルート経由でも解決できます。
- 非公開パッケージは、呼び出し元が所有公開元を読み取れない限り `404` を返します。

### `DELETE /api/v1/packages/{name}`

パッケージとすべてのリリースをソフト削除します。

注記:

- パッケージ所有者、組織公開元の所有者/管理者、
  プラットフォームモデレーター、またはプラットフォーム管理者の API トークンが必要です。

### `GET /api/v1/packages/{name}/versions`

バージョン履歴を返します。

クエリパラメーター:

- `limit` (任意): 整数 (1–100)
- `cursor` (任意): ページネーションカーソル

注記:

- 非公開パッケージは、呼び出し元が所有公開元を読み取れない限り `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}`

ファイルメタデータ、互換性、
ケイパビリティ、検証、アーティファクトメタデータ、およびスキャンデータを含む 1 つのパッケージバージョンを返します。

注記:

- `version.artifact.kind` は、旧来のパッケージアーカイブでは `legacy-zip`、
  ClawPack バックのリリースでは `npm-pack` です。
- ClawPack リリースには、npm 互換の `npmIntegrity`、`npmShasum`、および
  `npmTarballName` フィールドが含まれます。
- `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis`、および `version.staticScan` は、スキャンデータが存在する場合に含まれます。
- 非公開パッケージは、呼び出し元が所有公開元を読み取れない限り `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}/security`

インストールクライアント向けに、正確なパッケージリリースのセキュリティおよび信頼サマリーを返します。これは、解決済みリリースをインストールできるかどうかを判断するための公開 OpenClaw 消費サーフェスです。

認証:

- 公開読み取りエンドポイントです。所有者、公開元、モデレーター、または管理者トークンは
  必要ありません。

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

- `package.name`、`package.displayName`、および `package.family` は、解決された
  レジストリパッケージを識別します。
- `release.releaseId`、`release.version`、および `release.createdAt` は、
  評価された正確なリリースを識別します。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum`、および `release.npmTarballName` は、リリースアーティファクトについて既知の場合に存在します。
- `trust.scanStatus` は、スキャナー入力と手動リリースモデレーションから導出された有効な信頼ステータスです。
- `trust.moderationState` は null 許容です。手動リリースモデレーションが存在しない場合は `null` です。
- `trust.blockedFromDownload` はインストールブロックシグナルです。OpenClaw やその他の
  インストールクライアントは、スキャナーやモデレーションフィールドからブロックルールを再導出するのではなく、
  この値が `true` の場合にインストールをブロックする必要があります。
- `trust.reasons` は、ユーザー向けおよび監査向けの説明リストです。理由コードは、
  `manual:quarantined`、`scan:malicious`、`static:malicious`、
  `vt:suspicious`、および `package:malicious` のような安定した短い文字列です。
- `trust.pending` は、1 つ以上の信頼入力がまだ完了待ちであることを意味します。
- `trust.stale` は、信頼サマリーが古い入力から計算されたことを意味し、
  高い信頼度で許可を判断する前に更新が必要なものとして扱う必要があります。

注記:

- このエンドポイントはバージョンに厳密です。クライアントは、最新の
  パッケージメタデータを読んだ後だけでなく、インストールしようとしている
  パッケージバージョンを解決した後に呼び出す必要があります。
- 非公開パッケージは、呼び出し元が所有公開元を読み取れない限り `404` を返します。
- このエンドポイントは、所有者/モデレーター向けのモデレーションエンドポイントよりも意図的に狭くなっています。
  レポーターの識別情報、レポート本文、非公開の証拠、または内部レビューのタイムラインではなく、
  インストール判断と公開説明を公開します。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

パッケージバージョンの明示的なアーティファクトリゾルバーメタデータを返します。

注記:

- レガシーパッケージバージョンは、`legacy-zip` アーティファクトとレガシー ZIP
  `downloadUrl` を返します。
- ClawPack バージョンは、`npm-pack` アーティファクト、npm integrity フィールド、
  `tarballUrl`、およびレガシー ZIP 互換 URL を返します。
- これは OpenClaw リゾルバーサーフェスです。共有 URL からアーカイブ形式を推測することを避けます。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

明示的なリゾルバーパス経由でバージョンアーティファクトをダウンロードします。

注記:

- ClawPack バージョンは、アップロードされた正確な npm-pack `.tgz` バイトをストリーミングします。
- レガシー ZIP バージョンは `/api/v1/packages/{name}/download?version=` にリダイレクトします。
- ダウンロードレートバケットを使用します。

### `GET /api/v1/packages/{name}/readiness`

将来の OpenClaw 消費向けに計算された準備状況を返します。

準備状況チェックの対象:

- 公式チャンネルステータス
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

公式 OpenClaw plugin 移行行を一覧表示するモデレーターエンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `phase` (任意): `planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw`、または
  `all` (デフォルト)。
- `limit` (任意): 整数 (1-100)
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

公式 plugin 移行行を作成または更新する管理者エンドポイント。

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

- `bundledPluginId` は小文字に正規化され、安定した upsert キーになります。
- `packageName` は npm 名として正規化されます。計画段階の
  移行ではパッケージが存在しない場合があります。
- これは移行準備状況のみを追跡します。OpenClaw を変更したり
  ClawPacks を生成したりすることはありません。

### `GET /api/v1/packages/moderation/queue`

パッケージリリースレビューキューのモデレーター/管理者エンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `status` (任意): `open` (デフォルト)、`blocked`、`manual`、または `all`
- `limit` (任意): 整数 (1-100)
- `cursor` (任意): ページネーションカーソル

ステータスの意味:

- `open`: suspicious、malicious、pending、quarantined、revoked、または reported のリリース。
- `blocked`: quarantined、revoked、または malicious のリリース。
- `manual`: 手動モデレーション上書きがある任意のリリース。
- `all`: 手動上書き、clean ではないスキャン状態、またはパッケージレポートがある任意のリリース。

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

モデレーターによるレビューのためにパッケージを報告します。報告はパッケージ単位で、任意でバージョンに
リンクできます。報告はモデレーションキューに送られますが、それ自体で自動的に非表示にしたり
ダウンロードをブロックしたりすることはありません。モデレーターはリリースモデレーションを使用して、
アーティファクトを承認、隔離、または取り消す必要があります。

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

パッケージ報告の取り込み用のモデレーター/管理者エンドポイントです。

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

パッケージのモデレーション可視性のためのオーナー/モデレーターエンドポイントです。

認証:

- パッケージオーナー、パブリッシャーメンバー、モデレーター、または
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

パッケージ報告の解決または再オープン用のモデレーター/管理者エンドポイントです。

リクエスト:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` は `confirmed` と `dismissed` では必須です。`status` を `open` に戻す場合は
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

パッケージリリースレビュー用のモデレーター/管理者エンドポイントです。

リクエスト:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

サポートされる状態:

- `approved`: 手動レビュー済みで許可されています。
- `quarantined`: フォローアップ待ちでブロックされています。
- `revoked`: リリースが以前に信頼された後にブロックされています。

隔離または取り消されたリリースは、アーティファクトダウンロードルートから `403` を返します。
すべての変更は監査ログエントリを書き込みます。

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

注記:

- デフォルトはドライランです。
- ClawPack ストレージのないリリースには `legacy-zip` が付与されます。
- ClawPack ベースの既存行で `artifactKind` が欠落しているものは
  `npm-pack` として修復されます。
- これは ClawPack を生成したり、アーティファクトのバイト列を変更したりしません。

### `GET /api/v1/packages/{name}/file`

パッケージファイルの生テキストコンテンツを返します。

クエリパラメーター:

- `path` (必須)
- `version` (任意)
- `tag` (任意)

注記:

- デフォルトは最新リリースです。
- ダウンロードバケットではなく、読み取りレートバケットを使用します。
- バイナリファイルは `415` を返します。
- ファイルサイズ上限: 200KB。
- 保留中の VirusTotal スキャンは読み取りをブロックしません。悪意のあるリリースは別の場所で差し止められる場合があります。
- プライベートパッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `GET /api/v1/packages/{name}/download`

パッケージリリース用の従来の決定論的 ZIP アーカイブをダウンロードします。

クエリパラメーター:

- `version` (任意)
- `tag` (任意)

注記:

- デフォルトは最新リリースです。
- Skills は `GET /api/v1/download` にリダイレクトします。
- Plugin/パッケージアーカイブは `package/` ルートを持つ zip ファイルで、
  古い OpenClaw クライアントが引き続き動作します。
- このルートは ZIP 専用のままです。ClawPack `.tgz` ファイルはストリーミングしません。
- レスポンスには、リゾルバーの整合性チェック用に `ETag`、`Digest`、`X-ClawHub-Artifact-Type`、および
  `X-ClawHub-Artifact-Sha256` ヘッダーが含まれます。
- レジストリ専用メタデータはダウンロードされるアーカイブに注入されません。
- 保留中の VirusTotal スキャンはダウンロードをブロックしません。悪意のあるリリースは `403` を返します。
- プライベートパッケージは、呼び出し元がオーナーである場合を除き `404` を返します。

### `GET /api/npm/{package}`

ClawPack ベースのパッケージバージョン用の npm 互換 packument を返します。

注記:

- アップロード済みの ClawPack npm-pack tarball があるバージョンのみ一覧表示されます。
- 従来の ZIP 専用バージョンは意図的に省略されます。
- `dist.tarball`、`dist.integrity`、および `dist.shasum` は npm 互換の
  フィールドを使用するため、ユーザーは希望すれば npm をミラーに向けられます。
- スコープ付きパッケージの packument は、`/api/npm/@scope/name` と npm の
  エンコード済み `/api/npm/@scope%2Fname` リクエストパスの両方をサポートします。

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ミラークライアント向けに、アップロードされた正確な ClawPack tarball バイト列をストリーミングします。

注記:

- ダウンロードレートバケットを使用します。
- ダウンロードヘッダーには ClawHub SHA-256 に加えて npm integrity/shasum メタデータが含まれます。
- モデレーションとプライベートパッケージのアクセスチェックは引き続き適用されます。

### `GET /api/v1/resolve`

ローカルフィンガープリントを既知のバージョンにマッピングするために CLI が使用します。

クエリパラメーター:

- `slug` (必須)
- `hash` (必須): バンドルフィンガープリントの 64 文字の hex sha256

レスポンス:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

スキルバージョンの zip をダウンロードします。

クエリパラメーター:

- `slug` (必須)
- `version` (任意): semver 文字列
- `tag` (任意): タグ名 (例: `latest`)

注記:

- `version` と `tag` のどちらも指定されていない場合、最新バージョンが使用されます。
- ソフト削除されたバージョンは `410` を返します。
- ダウンロード統計は、1 時間あたりの一意の ID としてカウントされます (API トークンが有効な場合は `userId`、それ以外は IP)。

## 認証エンドポイント (Bearer トークン)

すべてのエンドポイントには以下が必要です:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

トークンを検証し、ユーザーハンドルを返します。

### `POST /api/v1/skills`

新しいバージョンを公開します。

- 推奨: `payload` JSON + `files[]` blob を含む `multipart/form-data`。
- `files` を含む JSON 本文 (storageId ベース) も受け付けます。
- 任意のペイロードフィールド: `ownerHandle`。存在する場合、API はその
  パブリッシャーをサーバー側で解決し、アクターにパブリッシャーアクセス権があることを要求します。
- 任意のペイロードフィールド: `migrateOwner`。`ownerHandle` とともに `true` の場合、
  アクターが現在および移行先の両方のパブリッシャーで管理者/オーナーであれば、
  既存のスキルをそのオーナーへ移動できます。このオプトインがない場合、オーナー変更は
  拒否されます。

### `POST /api/v1/packages`

code-plugin または bundle-plugin リリースを公開します。

- Bearer トークン認証が必要です。
- 推奨: `payload` JSON + `files[]` blob を含む `multipart/form-data`。
- `files` を含む JSON 本文 (storageId ベース) も受け付けます。
- 任意のペイロードフィールド: `ownerHandle`。存在する場合、管理者のみがそのオーナーの代理で公開できます。

検証の要点:

- `family` は `code-plugin` または `bundle-plugin` である必要があります。
- Plugin パッケージには `openclaw.plugin.json` が必要です。ClawPack `.tgz` アップロードには、
  `package/openclaw.plugin.json` にそれが含まれている必要があります。
- コード Plugin には、`package.json`、ソースリポジトリメタデータ、ソースコミット
  メタデータ、設定スキーマメタデータ、`openclaw.compat.pluginApi`、および
  `openclaw.build.openclawVersion` が必要です。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
- 信頼済みパブリッシャーのみが `official` チャンネルに公開できます。
- 代理公開でも、ターゲットオーナーアカウントに対して official チャンネルの適格性を検証します。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

スキルをソフト削除/復元します (オーナー、モデレーター、または管理者)。

任意の JSON 本文:

```json
{ "reason": "Held for moderation pending legal review." }
```

存在する場合、`reason` はスキルのモデレーションメモとして保存され、監査ログにコピーされます。
オーナー主導のソフト削除では slug が 30 日間予約され、その後その slug は
別のパブリッシャーが取得できます。この有効期限が適用される場合、削除レスポンスには `slugReservedUntil` が含まれます。
モデレーター/管理者による非表示化およびセキュリティ削除は、この方法では期限切れになりません。

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

管理者専用です。ハンドルの org パブリッシャーが存在することを保証します。ハンドルがまだ
従来の共有ユーザー/個人パブリッシャーを指している場合、エンドポイントはまずそれを org パブリッシャーに移行します。

- 本文: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- レスポンス: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

管理者専用です。正当なオーナーのために、リリースを公開せずにルート slug とパッケージ名を予約します。
パッケージ名はリリース行のないプライベートなプレースホルダーパッケージになるため、同じ
オーナーが後から実際の code-plugin または bundle-plugin リリースをその名前で公開できます。

- 本文: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- レスポンス: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### オーナー slug 管理エンドポイント

- `POST /api/v1/skills/{slug}/rename`
  - 本文: `{ "newSlug": "new-canonical-slug" }`
  - レスポンス: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文: `{ "targetSlug": "canonical-target-slug" }`
  - レスポンス: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注記:

- どちらのエンドポイントも API トークン認証が必要で、スキルオーナーに対してのみ機能します。
- `rename` は以前の slug をリダイレクトエイリアスとして保持します。
- `merge` はソースリスティングを非表示にし、ソース slug をターゲットリスティングにリダイレクトします。

### 所有権移譲エンドポイント

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

ユーザーをBANし、所有するSkillsをハード削除します（モデレーター/管理者のみ）。

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

または

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ユーザーのBANを解除し、対象となるSkillsを復元します（管理者のみ）。

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

または

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

ユーザーのロールを変更します（管理者のみ）。

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

または

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

ユーザーを一覧表示または検索します（管理者のみ）。

Query params:

- `q`（任意）: 検索クエリ
- `query`（任意）: `q` のエイリアス
- `limit`（任意）: 最大結果数（デフォルト 20、最大 200）

Response:

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

スター（ハイライト）を追加/削除します。どちらのエンドポイントも冪等です。

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## レガシー CLI エンドポイント（非推奨）

古い CLI バージョン向けに引き続きサポートされています。

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

削除計画については `DEPRECATIONS.md` を参照してください。

## レジストリ検出（`/.well-known/clawhub.json`）

CLI はサイトからレジストリ/認証設定を検出できます。

- `/.well-known/clawhub.json`（JSON、推奨）
- `/.well-known/clawdhub.json`（レガシー）

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

セルフホストする場合は、このファイルを配信してください（または `CLAWHUB_REGISTRY` を明示的に設定してください。レガシーは `CLAWDHUB_REGISTRY`）。
