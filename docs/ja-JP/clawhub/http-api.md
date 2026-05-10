---
read_when:
    - エンドポイントの追加/変更
    - CLI ↔ レジストリリクエストのデバッグ
summary: HTTP API リファレンス（公開 + CLI エンドポイント + 認証）。
x-i18n:
    generated_at: "2026-05-10T19:25:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

ベース URL: `https://clawhub.ai`（デフォルト）。

すべての v1 パスは `/api/v1/...` 配下にあります。
互換性のため、従来の `/api/...` と `/api/cli/...` は残っています（`DEPRECATIONS.md` を参照）。
OpenAPI: `/api/v1/openapi.json`。

## 公開カタログの再利用

サードパーティのディレクトリは、公開読み取りエンドポイントを使用して ClawHub Skills を一覧表示または検索できます。結果をキャッシュし、`429`/`Retry-After` を尊重し、ユーザーを正規の ClawHub 一覧（`https://clawhub.ai/<owner>/<slug>`）へリンクし、サードパーティサイトを ClawHub が推奨していると示唆しないでください。非表示、非公開、またはモデレーションでブロックされたコンテンツを、公開 API サーフェスの外でミラーしようとしないでください。

Web スラッグのショートカットはレジストリファミリー全体で解決されますが、API クライアントはルートの優先順位を再構築するのではなく、読み取りエンドポイントが返す正規 URL を使用してください。

## レート制限

適用モデル:

- 匿名リクエスト: IP ごとに適用されます。
- 認証済みリクエスト（有効な Bearer トークン）: ユーザーバケットごとに適用されます。
- トークンがない、または無効な場合、動作は IP ベースの適用にフォールバックします。
- 認証済み書き込みエンドポイントは、サーバーが理由を把握している場合に単なる `Unauthorized` を返すべきではありません。トークン欠落、無効または取り消し済みトークン、削除済み・禁止済み・無効化済みアカウントは、それぞれ CLI クライアントがユーザーに何がブロックしたのかを伝えられるよう、実行可能な説明テキストを返すべきです。

- 読み取り: IP ごとに 600/分、キーごとに 2400/分
- 書き込み: IP ごとに 45/分、キーごとに 180/分
- ダウンロード: IP ごとに 30/分、キーごとに 180/分（`/api/v1/download`）

ヘッダー:

- 従来互換: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 標準化済み: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429` 時: `Retry-After`

ヘッダーの意味:

- `X-RateLimit-Reset`: 絶対 Unix エポック秒
- `RateLimit-Reset`: リセットまでの秒数（遅延）
- `Retry-After`: `429` 時に再試行前に待機する秒数（遅延）

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

- `Retry-After` が存在する場合、その秒数だけ待ってから再試行してください。
- 同期した再試行を避けるため、ジッター付きバックオフを使用してください。
- `Retry-After` がない場合、`RateLimit-Reset` にフォールバックしてください（または `X-RateLimit-Reset` から計算してください）。

IP ソース:

- デフォルトではクライアント IP に `cf-connecting-ip`（Cloudflare）を使用します。
- ClawHub は、エッジでクライアント IP を識別するために信頼済み転送ヘッダーを使用します。
- 信頼済みクライアント IP が利用できない場合、匿名ダウンロードリクエストは単一のグローバルな `ip:unknown` バケットではなく、エンドポイントスコープのフォールバックバケットを使用します。匿名の読み取り/書き込みリクエストは引き続き共有の unknown バケットを使用するため、IP 欠落ルーティングは可視で保守的なままです。

## 公開エンドポイント（認証なし）

### `GET /api/v1/search`

クエリパラメータ:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数
- `highlightedOnly`（任意）: 注目 Skills のみに絞り込む場合は `true`
- `nonSuspiciousOnly`（任意）: suspicious（`flagged.suspicious`）な Skills を非表示にする場合は `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` の従来エイリアス

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

- 結果は関連度順（埋め込み類似度 + 完全なスラッグ/名前トークンのブースト + ダウンロード数に基づく人気度事前分布）で返されます。
- 関連度は人気度より強く扱われます。正確なスラッグまたは表示名トークンの一致は、より多くのダウンロードがある緩い一致より上位になる場合があります。
- ASCII テキストは単語境界と句読点境界でトークン化されます。たとえば、`personal-map` には独立した `map` トークンが含まれます。一方、`amap-jsapi-skill` には `amap`、`jsapi`、`skill` が含まれるため、`map` を検索すると `amap-jsapi-skill` より `personal-map` のほうが強い語彙一致になります。
- ダウンロード数は小さな対数スケールの事前分布および同点決定要素として使用され、主要なランキングシグナルではありません。クエリテキストとの一致が弱い場合、ダウンロード数が多い Skills でも順位が低くなることがあります。
- suspicious または非表示のモデレーション状態は、呼び出し元のフィルターと現在のモデレーション状態に応じて、公開検索から Skills を除外する場合があります。

公開者向けの発見可能性ガイダンス:

- ユーザーが実際に検索する語句を、表示名、概要、タグに入れてください。独立したスラッグトークンは、それが維持したい安定した識別子でもある場合にのみ使用してください。
- 新しいスラッグが長期的により優れた正規名でない限り、1 つのクエリを追うためだけにスラッグ名を変更しないでください。古いスラッグはリダイレクトエイリアスになりますが、正規 URL、表示されるスラッグ、今後の検索ダイジェストでは新しいスラッグが使用されます。
- リネームエイリアスは、レジストリ経由で解決される古い URL とインストールの解決を保持しますが、検索ランキングは、リネーム後にインデックスされた正規 Skill メタデータに基づきます。既存の統計は Skill に保持されます。
- Skill が予期せず表示されない場合は、ランキング関連メタデータを変更する前に、ログインした状態で `clawhub inspect <slug>` を使ってまずモデレーション状態を確認してください。

### `GET /api/v1/skills`

クエリパラメータ:

- `limit`（任意）: 整数（1–200）
- `cursor`（任意）: `trending` 以外の任意のソート用ページネーションカーソル
- `sort`（任意）: `updated`（デフォルト）、`createdAt`（エイリアス: `newest`）、`downloads`、`stars`（エイリアス: `rating`）、`installsCurrent`（エイリアス: `installs`）、`installsAllTime`、`trending`
- `nonSuspiciousOnly`（任意）: suspicious（`flagged.suspicious`）な Skills を非表示にする場合は `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` の従来エイリアス

注記:

- `trending` は直近 7 日間のインストール数（テレメトリベース）でランク付けします。
- `createdAt` は新規 Skill のクロールでは安定しています。`updated` は既存の Skills が再公開されると変化します。
- `nonSuspiciousOnly=true` の場合、suspicious な Skills はページ取得後にフィルタリングされるため、カーソルベースのソートでは 1 ページの項目数が `limit` より少なくなることがあります。
- 存在する場合は `nextCursor` を使用してページネーションを続行してください。短いページだけでは、結果の終端を意味しません。

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

- 所有者のリネーム/マージフローによって作成された古いスラッグは、正規 Skill に解決されます。
- `metadata.os`: Skill frontmatter で宣言された OS 制限（例: `["macos"]`、`["linux"]`）。宣言されていない場合は `null`。
- `metadata.systems`: Nix システムターゲット（例: `["aarch64-darwin", "x86_64-linux"]`）。宣言されていない場合は `null`。
- Skill にプラットフォームメタデータがない場合、`metadata` は `null` です。
- `moderation` は、Skill がフラグ付けされている場合、または所有者が表示している場合にのみ含まれます。

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

- 所有者とモデレーターは、非表示 Skills のモデレーション詳細にアクセスできます。
- 公開呼び出し元が `200` を取得できるのは、すでにフラグ付けされた表示中の Skills に対してのみです。
- 証拠は公開呼び出し元向けには編集され、所有者/モデレーター向けにのみ生スニペットを含みます。

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

### `POST /api/v1/skills/{slug}/appeal`

Skill のモデレーションに異議申し立てするための、Skill 所有者/公開者向けエンドポイントです。

認証:

- Skill 所有者または公開者メンバーの API トークンが必要です。

リクエスト:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

異議申し立ては、非表示、削除済み、suspicious、malicious、またはスキャナーによってフラグ付けされた Skill の結果に対して受け付けられます。ClawHub は Skill ごとに 1 件の未解決異議申し立てを保持します。

レスポンス:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

最新公開済み Skill バージョンのセキュリティ再スキャンをリクエストします。

認証:

- Skill 所有者、公開者管理者、プラットフォームモデレーター、またはプラットフォーム管理者の API トークンが必要です。
- 所有者と公開者管理者には、バージョンごとの所有者復旧制限が適用されます。プラットフォームモデレーターと管理者には適用されませんが、ClawHub はそれでもバージョンごとにアクティブな再スキャンを 1 件だけ許可します。

レスポンス:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

Skill 報告の受付用モデレーター/管理者エンドポイントです。

クエリパラメータ:

- `status`（任意）: `open`（デフォルト）、`confirmed`、`dismissed`、または `all`
- `limit`（任意）: 整数（1-200）
- `cursor`（任意）: ページネーションカーソル

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

Skill 報告を解決または再開するためのモデレーター/管理者エンドポイントです。

リクエスト:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` は `confirmed` と `dismissed` では必須です。`status` を `open` に戻す場合は省略できます。監査可能な同じワークフローで Skill を非表示にするには、トリアージ済み報告とともに `finalAction: "hide"` を渡してください。

### `GET /api/v1/skills/-/appeals`

Skill 異議申し立ての受付用モデレーター/管理者エンドポイントです。

クエリパラメータ:

- `status`（任意）: `open`（デフォルト）、`accepted`、`rejected`、または `all`
- `limit`（任意）: 整数（1-200）
- `cursor`（任意）: ページネーションカーソル

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Skill 異議申し立てを承認、却下、または再開するためのモデレーター/管理者エンドポイントです。
`note` は `accepted` と `rejected` では必須です。`status` を `open` に戻す場合は省略できます。承認された異議申し立てとともに `finalAction: "restore"` を渡すと、Skill を再び利用可能にします。

### `GET /api/v1/skills/{slug}/versions`

クエリパラメータ:

- `limit` (任意): 整数
- `cursor` (任意): ページネーションカーソル

### `GET /api/v1/skills/{slug}/versions/{version}`

バージョンメタデータとファイル一覧を返します。

- `version.security` には、利用可能な場合、正規化されたスキャン検証ステータスとスキャナー詳細
  (VirusTotal + LLM) が含まれます。

### `GET /api/v1/skills/{slug}/scan`

Skill バージョンのセキュリティスキャン検証詳細を返します。

クエリパラメータ:

- `version` (任意): 特定のバージョン文字列。
- `tag` (任意): タグ付きバージョンを解決します (例: `latest`)。

注記:

- `version` と `tag` のどちらも指定されていない場合は、最新バージョンを使用します。
- 正規化された検証ステータスに加えて、スキャナー固有の詳細を含みます。
- `security.capabilityTags` には、検出された場合、`crypto`、`requires-wallet`、`can-make-purchases`、
  `can-sign-transactions`、`requires-oauth-token`、`posts-externally` などの決定的な機能/リスクラベルが含まれます。
- `security.hasScanResult` は、スキャナーが確定的な判定 (`clean`、`suspicious`、または `malicious`) を生成した場合にのみ `true` になります。
- `moderation` は、最新バージョンから派生した現在の Skill レベルのモデレーションスナップショットです。
- 過去のバージョンをクエリする場合は、`moderation` と `security` を同じバージョンコンテキストとして扱う前に、`moderation.matchesRequestedVersion` と `moderation.sourceVersion` を確認してください。

### `GET /api/v1/skills/{slug}/file`

生のテキストコンテンツを返します。

クエリパラメータ:

- `path` (必須)
- `version` (任意)
- `tag` (任意)

注記:

- デフォルトでは最新バージョンになります。
- ファイルサイズ制限: 200KB。

### `GET /api/v1/packages`

以下のための統合カタログエンドポイント:

- Skills
- コード Plugin
- バンドル Plugin

クエリパラメータ:

- `limit` (任意): 整数 (1–100)
- `cursor` (任意): ページネーションカーソル
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `executesCode` (任意): `true` または `false`
- `capabilityTag` (任意): Plugin パッケージの機能フィルター
- `target` / `hostTarget` (任意): `host:<target>` の短縮形
- `os`、`arch`、`libc` (任意): ホスト機能フィルターの短縮形
- `requiresBrowser`、`requiresDesktop`、`requiresNativeDeps`、
  `requiresExternalService`、`requiresBinary`、`requiresOsPermission`
  (任意): 環境要件タグの `true`/`1` 短縮形
- `externalService`、`binary`、`osPermission` (任意): 名前付き
  環境要件タグの短縮形
- `artifactKind` (任意): `legacy-zip` または `npm-pack`
- `npmMirror` (任意): npm ミラー経由で利用可能な ClawPack バックのパッケージバージョンを表示するには `true`/`1`

注記:

- `GET /api/v1/code-plugins` と `GET /api/v1/bundle-plugins` は固定ファミリーのエイリアスのままです。
- Skill エントリは引き続き Skill レジストリに基づき、`POST /api/v1/skills` 経由でのみ公開できます。
- `POST /api/v1/packages` は引き続き code-plugin と bundle-plugin リリース専用です。
- 匿名呼び出し元には公開パッケージチャンネルのみが表示されます。
- 認証済み呼び出し元は、所属する公開元の private パッケージを一覧/検索結果で表示できます。
- `channel=private` は、認証済み呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/packages/search`

Skills と Plugin パッケージ全体の統合カタログ検索。

クエリパラメータ:

- `q` (必須): クエリ文字列
- `limit` (任意): 整数 (1–100)
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `executesCode` (任意): `true` または `false`
- `capabilityTag` (任意): Plugin パッケージの機能フィルター
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary`、および
  `osPermission` は、一般的な機能タグの短縮形として受け付けられます
- `artifactKind` (任意): `legacy-zip` または `npm-pack`
- `npmMirror` (任意): npm ミラー経由で利用可能な ClawPack バックのパッケージバージョンを検索するには `true`/`1`

注記:

- 匿名呼び出し元には公開パッケージチャンネルのみが表示されます。
- 認証済み呼び出し元は、所属する公開元の private パッケージを検索できます。
- `channel=private` は、認証済み呼び出し元が読み取れるパッケージのみを返します。
- アーティファクトフィルターは、インデックス化された機能タグに基づきます:
  `artifact:legacy-zip`、`artifact:npm-pack`、および `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

パッケージ詳細メタデータを返します。

注記:

- Skills も統合カタログ内でこのルートから解決できます。
- private パッケージは、呼び出し元が所有する公開元を読み取れない限り `404` を返します。

### `DELETE /api/v1/packages/{name}`

パッケージとすべてのリリースを論理削除します。

注記:

- パッケージ所有者、組織公開元の所有者/管理者、プラットフォームモデレーター、またはプラットフォーム管理者の API トークンが必要です。

### `GET /api/v1/packages/{name}/versions`

バージョン履歴を返します。

クエリパラメータ:

- `limit` (任意): 整数 (1–100)
- `cursor` (任意): ページネーションカーソル

注記:

- private パッケージは、呼び出し元が所有する公開元を読み取れない限り `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}`

ファイルメタデータ、互換性、機能、検証、アーティファクトメタデータ、スキャンデータを含む、1 つのパッケージバージョンを返します。

注記:

- `version.artifact.kind` は、旧方式のパッケージアーカイブでは `legacy-zip`、
  ClawPack バックのリリースでは `npm-pack` です。
- ClawPack リリースには、npm 互換の `npmIntegrity`、`npmShasum`、および
  `npmTarballName` フィールドが含まれます。
- スキャンデータが存在する場合、`version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis`、および `version.staticScan` が含まれます。
- private パッケージは、呼び出し元が所有する公開元を読み取れない限り `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

パッケージバージョンの明示的なアーティファクトリゾルバーメタデータを返します。

注記:

- レガシーパッケージバージョンは、`legacy-zip` アーティファクトとレガシー ZIP
  `downloadUrl` を返します。
- ClawPack バージョンは、`npm-pack` アーティファクト、npm 整合性フィールド、
  `tarballUrl`、およびレガシー ZIP 互換 URL を返します。
- これは OpenClaw リゾルバーサーフェスです。共有 URL からアーカイブ形式を推測することを避けます。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

明示的なリゾルバーパスを通じてバージョンアーティファクトをダウンロードします。

注記:

- ClawPack バージョンは、アップロードされた正確な npm-pack `.tgz` バイトをストリームします。
- レガシー ZIP バージョンは `/api/v1/packages/{name}/download?version=` にリダイレクトします。
- ダウンロードレートバケットを使用します。

### `GET /api/v1/packages/{name}/readiness`

将来の OpenClaw 利用に向けて計算された準備状況を返します。

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

公式 OpenClaw Plugin 移行行を一覧表示するためのモデレーターエンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメータ:

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

公式 Plugin 移行行を作成または更新するための管理者エンドポイント。

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
- `packageName` は npm 名として正規化されます。計画中の移行ではパッケージが存在しない場合があります。
- これは移行の準備状況のみを追跡します。OpenClaw を変更したり
  ClawPacks を生成したりはしません。

### `GET /api/v1/packages/moderation/queue`

パッケージリリースレビューキューのためのモデレーター/管理者エンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメータ:

- `status` (任意): `open` (デフォルト)、`blocked`、`manual`、または `all`
- `limit` (任意): 整数 (1-100)
- `cursor` (任意): ページネーションカーソル

ステータスの意味:

- `open`: suspicious、malicious、pending、quarantined、revoked、または報告されたリリース。
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

モデレーターレビューのためにパッケージを報告します。報告はパッケージレベルで、任意でバージョンにリンクできます。これらはモデレーションキューに送られますが、それ自体でダウンロードを自動的に非表示にしたりブロックしたりはしません。モデレーターはリリースモデレーションを使用して、アーティファクトを承認、隔離、または取り消す必要があります。

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

### `POST /api/v1/packages/{name}/appeal`

リリースのモデレーションに異議申し立てを行うためのパッケージ所有者/公開元エンドポイント。

認証:

- パッケージ所有者または公開元メンバーの API トークンが必要です。

リクエスト:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

異議申し立ては、quarantined、revoked、suspicious、または malicious のリリースに対してのみ受け付けられます。ClawHub はリリースごとに 1 件の未解決の異議申し立てを保持します。

レスポンス:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

最新の公開済みパッケージリリースのセキュリティ再スキャンをリクエストします。

認証:

- パッケージ所有者、パブリッシャー管理者、プラットフォーム
  モデレーター、またはプラットフォーム管理者の API トークンが必要です。
- 所有者とパブリッシャー管理者には、リリースごとの所有者復旧
  上限が適用されます。プラットフォームモデレーターと管理者には適用されませんが、ClawHub は引き続き
  リリースごとにアクティブな再スキャンを 1 つだけ許可します。

レスポンス:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

パッケージ異議申し立ての受付用モデレーター/管理者エンドポイントです。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメータ:

- `status` (任意): `open` (デフォルト)、`accepted`、`rejected`、または `all`
- `limit` (任意): 整数 (1-100)
- `cursor` (任意): ページネーションカーソル

レスポンス:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

異議申し立ての承認、却下、または再オープン用のモデレーター/管理者エンドポイントです。

リクエスト:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`accepted` と `rejected` では `note` が必要です。`status` を `open` に戻す場合は
省略できます。承認済みの異議申し立てで `finalAction: "approve"` を渡すと、
同じ監査可能なワークフローで影響を受けるリリースを承認します。

レスポンス:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

パッケージ報告の受付用モデレーター/管理者エンドポイントです。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメータ:

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

パッケージのモデレーション可視性用の所有者/モデレーターエンドポイントです。

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

パッケージ報告の解決または再オープン用のモデレーター/管理者エンドポイントです。

リクエスト:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` と `dismissed` では `note` が必要です。`status` を `open` に戻す場合は
省略できます。確認済みの報告で `finalAction: "quarantine"` または
`finalAction: "revoke"` を渡すと、同じ監査可能なワークフローでリリースモデレーションを適用します。

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

対応する状態:

- `approved`: 手動レビュー済みで許可されています。
- `quarantined`: フォローアップ待ちでブロックされています。
- `revoked`: リリースが以前に信頼された後でブロックされています。

隔離または失効されたリリースでは、アーティファクトダウンロードルートから `403` が返されます。
すべての変更は監査ログエントリを書き込みます。

### `POST /api/v1/packages/backfill/artifacts`

古いパッケージリリースに明示的なアーティファクト種別メタデータを
ラベル付けするための、管理者専用メンテナンスエンドポイントです。

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
- ClawPack ストレージがないリリースには `legacy-zip` がラベル付けされます。
- `artifactKind` が欠落している既存の ClawPack ベースの行は
  `npm-pack` として修復されます。
- これは ClawPack を生成せず、アーティファクトバイト列も変更しません。

### `GET /api/v1/packages/{name}/file`

パッケージファイルの生テキストコンテンツを返します。

クエリパラメータ:

- `path` (必須)
- `version` (任意)
- `tag` (任意)

注記:

- デフォルトは最新リリースです。
- ダウンロードバケットではなく読み取りレートバケットを使用します。
- バイナリファイルは `415` を返します。
- ファイルサイズ上限: 200KB。
- 保留中の VirusTotal スキャンは読み取りをブロックしません。悪意のあるリリースは別の場所で引き続き保留される場合があります。
- プライベートパッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `GET /api/v1/packages/{name}/download`

パッケージリリースのレガシーな決定論的 ZIP アーカイブをダウンロードします。

クエリパラメータ:

- `version` (任意)
- `tag` (任意)

注記:

- デフォルトは最新リリースです。
- Skills は `GET /api/v1/download` にリダイレクトします。
- Plugin/パッケージアーカイブは、古い OpenClaw
  クライアントが動作し続けるように `package/` ルートを持つ zip ファイルです。
- このルートは ZIP 専用のままです。ClawPack `.tgz` ファイルをストリームしません。
- レスポンスには、リゾルバーの整合性チェック用に `ETag`、`Digest`、`X-ClawHub-Artifact-Type`、および
  `X-ClawHub-Artifact-Sha256` ヘッダーが含まれます。
- レジストリ専用メタデータは、ダウンロードされるアーカイブに注入されません。
- 保留中の VirusTotal スキャンはダウンロードをブロックしません。悪意のあるリリースは `403` を返します。
- プライベートパッケージは、呼び出し元が所有者である場合を除き `404` を返します。

### `GET /api/npm/{package}`

ClawPack ベースのパッケージバージョンに対する npm 互換の packument を返します。

注記:

- アップロード済み ClawPack npm-pack tarball があるバージョンのみが一覧表示されます。
- レガシーな ZIP 専用バージョンは意図的に省略されます。
- `dist.tarball`、`dist.integrity`、および `dist.shasum` は npm 互換の
  フィールドを使用するため、ユーザーは必要に応じて npm をミラーに向けられます。
- スコープ付きパッケージの packument は、`/api/npm/@scope/name` と npm の
  エンコードされた `/api/npm/@scope%2Fname` リクエストパスの両方に対応します。

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ミラークライアント向けに、アップロードされた正確な ClawPack tarball バイト列をストリームします。

注記:

- ダウンロードレートバケットを使用します。
- ダウンロードヘッダーには、ClawHub SHA-256 に加えて npm integrity/shasum メタデータが含まれます。
- モデレーションとプライベートパッケージアクセスのチェックは引き続き適用されます。

### `GET /api/v1/resolve`

CLI がローカルフィンガープリントを既知のバージョンにマッピングするために使用します。

クエリパラメータ:

- `slug` (必須)
- `hash` (必須): バンドルフィンガープリントの 64 文字の hex sha256

レスポンス:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

スキルバージョンの zip をダウンロードします。

クエリパラメータ:

- `slug` (必須)
- `version` (任意): semver 文字列
- `tag` (任意): タグ名 (例: `latest`)

注記:

- `version` と `tag` のどちらも指定されていない場合、最新バージョンが使用されます。
- 論理削除されたバージョンは `410` を返します。
- ダウンロード統計は、1 時間ごとの一意なアイデンティティとしてカウントされます (API トークンが有効な場合は `userId`、それ以外は IP)。

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
- `files` (storageId ベース) を含む JSON 本文も受け付けます。
- 任意のペイロードフィールド: `ownerHandle`。存在する場合、API はその
  パブリッシャーをサーバー側で解決し、アクターにパブリッシャーアクセス権があることを要求します。
- 任意のペイロードフィールド: `migrateOwner`。`ownerHandle` とともに `true` の場合、
  アクターが現在と移行先の両方のパブリッシャーで管理者/所有者であれば、
  既存のスキルをその所有者へ移動できます。このオプトインがない場合、所有者の変更は
  拒否されます。

### `POST /api/v1/packages`

code-plugin または bundle-plugin リリースを公開します。

- Bearer トークン認証が必要です。
- 推奨: `payload` JSON + `files[]` blob を含む `multipart/form-data`。
- `files` (storageId ベース) を含む JSON 本文も受け付けます。
- 任意のペイロードフィールド: `ownerHandle`。存在する場合、その所有者に代わって公開できるのは管理者のみです。

検証の要点:

- `family` は `code-plugin` または `bundle-plugin` である必要があります。
- Plugin パッケージには `openclaw.plugin.json` が必要です。ClawPack `.tgz` アップロードには
  `package/openclaw.plugin.json` にそれを含める必要があります。
- コード Plugin には、`package.json`、ソースリポジトリメタデータ、ソースコミット
  メタデータ、設定スキーマメタデータ、`openclaw.compat.pluginApi`、および
  `openclaw.build.openclawVersion` が必要です。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
- 信頼されたパブリッシャーだけが `official` チャンネルに公開できます。
- 代理公開でも、official チャンネルの適格性は対象所有者アカウントに対して検証されます。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

スキルを論理削除/復元します (所有者、モデレーター、または管理者)。

任意の JSON 本文:

```json
{ "reason": "Held for moderation pending legal review." }
```

存在する場合、`reason` はスキルのモデレーションメモとして保存され、監査ログにコピーされます。
所有者によって開始された論理削除では slug が 30 日間予約され、その後その slug は
別のパブリッシャーが取得できるようになります。この有効期限が適用される場合、削除レスポンスには `slugReservedUntil` が含まれます。
モデレーター/管理者による非表示化とセキュリティ削除は、このようには期限切れになりません。

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

管理者専用です。ハンドルに対する組織パブリッシャーが存在することを保証します。ハンドルがまだ
レガシーな共有ユーザー/個人パブリッシャーを指している場合、エンドポイントはまずそれを組織パブリッシャーに移行します。

- 本文: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- レスポンス: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

管理者専用。リリースを公開せずに、正当な所有者のためにルート slug とパッケージ名を予約します。パッケージ名はリリース行のない非公開のプレースホルダーパッケージになるため、同じ所有者が後で実際の code-plugin または bundle-plugin リリースをその名前に公開できます。

- 本文: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- レスポンス: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 所有者 slug 管理エンドポイント

- `POST /api/v1/skills/{slug}/rename`
  - 本文: `{ "newSlug": "new-canonical-slug" }`
  - レスポンス: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文: `{ "targetSlug": "canonical-target-slug" }`
  - レスポンス: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注記:

- どちらのエンドポイントも API トークン認証が必要で、skill の所有者に対してのみ機能します。
- `rename` は以前の slug をリダイレクトエイリアスとして保持します。
- `merge` は移行元の一覧表示を隠し、移行元 slug を移行先の一覧表示へリダイレクトします。

### 所有権移譲エンドポイント

- `POST /api/v1/skills/{slug}/transfer`
  - 本文: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - レスポンス: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - レスポンス（承認/拒否/キャンセル）: `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - レスポンス形状: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

ユーザーを ban し、所有する Skills を完全削除します（moderator/admin のみ）。

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

ユーザーの ban を解除し、条件を満たす Skills を復元します（admin のみ）。

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

ユーザーロールを変更します（admin のみ）。

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

ユーザーを一覧表示または検索します（admin のみ）。

クエリパラメーター:

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

スター（ハイライト）を追加/削除します。どちらのエンドポイントも冪等です。

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

セルフホストする場合は、このファイルを提供してください（または `CLAWHUB_REGISTRY` を明示的に設定してください。レガシーは `CLAWDHUB_REGISTRY`）。
