---
read_when:
    - エンドポイントの追加/変更
    - CLI ↔ レジストリリクエストのデバッグ
summary: HTTP API リファレンス（公開 + CLI エンドポイント + 認証）。
x-i18n:
    generated_at: "2026-07-04T17:47:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

ベース URL: `https://clawhub.ai` (デフォルト)。

すべての v1 パスは `/api/v1/...` 配下です。
レガシーの `/api/...` と `/api/cli/...` は互換性のために残っています (`DEPRECATIONS.md` を参照)。
OpenAPI: `/api/v1/openapi.json`。

## 公開カタログの再利用

サードパーティのディレクトリは、公開読み取りエンドポイントを使用して ClawHub スキルを一覧表示または検索できます。結果をキャッシュし、`429`/`Retry-After` を尊重し、ユーザーを正規の ClawHub リスト (`https://clawhub.ai/<owner>/skills/<slug>`) に戻すリンクを提供し、サードパーティサイトが ClawHub の推奨を受けているように示唆することは避けてください。公開 API サーフェスの外で、非表示、非公開、またはモデレーションによりブロックされたコンテンツをミラーしようとしないでください。

Web スラッグのショートカットはレジストリファミリーを横断して解決されますが、API クライアントはルートの優先順位を再構築するのではなく、読み取りエンドポイントから返される正規 URL を使用してください。

## レート制限

強制モデル:

- 匿名リクエスト: IP ごとに強制されます。
- 認証済みリクエスト (有効な Bearer トークン): ユーザーバケットごとに強制されます。
- トークンがない、または無効な場合、動作は IP ベースの強制にフォールバックします。
- 認証済みの書き込みエンドポイントは、サーバーが理由を把握している場合、単なる `Unauthorized` を返すべきではありません。トークン不足、無効または取り消し済みのトークン、削除済み、禁止済み、または無効化済みのアカウントは、それぞれ CLI クライアントがユーザーに何がブロックしたかを伝えられるよう、対処可能なテキストを受け取るべきです。

- 読み取り: IP ごとに 3000/min、キーごとに 12000/min
- 書き込み: IP ごとに 300/min、キーごとに 3000/min
- ダウンロード: IP ごとに 1200/min、キーごとに 6000/min (ダウンロードエンドポイント)

ヘッダー:

- レガシー互換性: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- 標準化済み: `RateLimit-Limit`, `RateLimit-Reset`
- `429` の場合: `X-RateLimit-Remaining: 0` と `RateLimit-Remaining: 0`
- `429` の場合: `Retry-After`

ヘッダーの意味:

- `X-RateLimit-Reset`: 絶対 Unix epoch 秒
- `RateLimit-Reset`: リセットまでの秒数 (遅延)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 存在する場合は正確な残り予算。
  シャーディングされた成功リクエストは、近似的なグローバル値を返す代わりにこのヘッダーを省略します。
- `Retry-After`: `429` で再試行前に待機する秒数 (遅延)

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

- `Retry-After` が存在する場合、再試行前にその秒数だけ待機します。
- 同期された再試行を避けるため、ジッター付きバックオフを使用します。
- `Retry-After` がない場合、`RateLimit-Reset` にフォールバックします (または `X-RateLimit-Reset` から計算します)。

IP ソース:

- デプロイが信頼済み転送ヘッダーを明示的に有効にしている場合にのみ、`cf-connecting-ip` を含む信頼済みクライアント IP ヘッダーを使用します。
- ClawHub はエッジでクライアント IP を識別するために信頼済み転送ヘッダーを使用します。
- 信頼済みクライアント IP が利用できない場合、匿名リクエストはレート制限種別だけでスコープされたフォールバックバケットを使用します。これらのフォールバックバケットには、呼び出し元が指定したパス、スラッグ、パッケージ名、バージョン、クエリ文字列、その他のアーティファクトパラメータは含まれません。

## エラーレスポンス

公開 v1 エラーレスポンスは `content-type: text/plain; charset=utf-8` のプレーンテキストです。
これには検証失敗 (`400`)、存在しない公開リソース (`404`)、認証と権限の失敗 (`401`/`403`)、レート制限 (`429`)、ブロックされたダウンロードが含まれます。クライアントはレスポンス本文を人間が読める文字列として読むべきです。未知のクエリパラメータは互換性のために無視されますが、認識済みのクエリパラメータに無効な値がある場合は `400` を返します。

## 公開エンドポイント (認証なし)

### `GET /api/v1/search`

クエリパラメータ:

- `q` (必須): クエリ文字列
- `limit` (任意): 整数
- `highlightedOnly` (任意): 注目スキルだけに絞り込むには `true`
- `nonSuspiciousOnly` (任意): 疑わしい (`flagged.suspicious`) スキルを非表示にするには `true`
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

注記:

- 結果は関連度順で返されます (埋め込み類似度 + 完全なスラッグ/名前トークンのブースト + 小さな人気度事前分布)。
- 関連度は人気度より強く作用します。正確なスラッグまたは表示名トークンの一致は、エンゲージメントがはるかに強い緩い一致より上位になる場合があります。
- ASCII テキストは単語と句読点の境界でトークン化されます。たとえば、`personal-map` には独立した `map` トークンが含まれますが、`amap-jsapi-skill` には `amap`、`jsapi`、`skill` が含まれます。そのため、`map` を検索すると `amap-jsapi-skill` より `personal-map` のほうが強い字句一致になります。
- 人気度は対数スケール化され、上限があります。クエリテキストとの一致が弱い場合、エンゲージメントの高いスキルでも低くランクされることがあります。
- 疑わしい、または非表示のモデレーション状態により、呼び出し元のフィルターと現在のモデレーション状態に応じて、スキルが公開検索から除外されることがあります。

公開者向けの発見可能性ガイダンス:

- ユーザーが文字どおり検索する語句を、表示名、概要、タグに入れてください。独立したスラッグトークンは、それが維持したい安定したアイデンティティでもある場合にのみ使用してください。
- 新しいスラッグが長期的により良い正規名でない限り、1 つのクエリを追うためだけにスラッグを変更しないでください。古いスラッグはリダイレクトエイリアスになりますが、正規 URL、表示されるスラッグ、将来の検索ダイジェストは新しいスラッグを使用します。
- リネームエイリアスは、古い URL やレジストリ経由で解決されるインストールの解決を維持しますが、検索ランキングはリネームがインデックス化された後の正規スキルメタデータに基づきます。既存の統計はスキルに残ります。
- スキルが予期せず見えない場合は、ランキング関連メタデータを変更する前に、ログインした状態で `clawhub inspect @owner/slug` を使ってまずモデレーション状態を確認してください。

### `GET /api/v1/skills`

クエリパラメータ:

- `limit` (任意): 整数 (1–200)
- `cursor` (任意): `trending` 以外の任意のソート用ページネーションカーソル
- `sort` (任意): `updated` (デフォルト)、`recommended` (エイリアス: `default`)、`createdAt` (エイリアス: `newest`)、`downloads`、`stars` (エイリアス: `rating`)、レガシーインストールエイリアス `installsCurrent`/`installs`/`installsAllTime` は `downloads` にマップされます、`trending`
- `nonSuspiciousOnly` (任意): 疑わしい (`flagged.suspicious`) スキルを非表示にするには `true`
- `nonSuspicious` (任意): `nonSuspiciousOnly` のレガシーエイリアス

無効な `sort` 値は `400` を返します。

注記:

- `recommended` はエンゲージメントと新しさのシグナルを使用します。
- `trending` は過去 7 日間のインストール数でランク付けします (テレメトリベース)。
- `createdAt` は新規スキルのクロールで安定しています。`updated` は既存スキルが再公開されると変わります。
- `nonSuspiciousOnly=true` の場合、疑わしいスキルはページ取得後にフィルタリングされるため、カーソルベースのソートでは 1 ページの項目数が `limit` より少なくなる場合があります。
- 存在する場合は `nextCursor` を使用してページネーションを続行してください。短いページであること自体は、結果の終端を意味しません。

レスポンス:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- オーナーのリネーム/マージフローで作成された古いスラッグは、正規スキルに解決されます。
- `metadata.os`: スキルのフロントマターで宣言された OS 制限 (例: `["macos"]`, `["linux"]`)。宣言されていない場合は `null`。
- `metadata.systems`: Nix システムターゲット (例: `["aarch64-darwin", "x86_64-linux"]`)。宣言されていない場合は `null`。
- スキルにプラットフォームメタデータがない場合、`metadata` は `null` です。
- `moderation` は、スキルがフラグ付けされている場合、またはオーナーが閲覧している場合にのみ含まれます。

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

- オーナーとモデレーターは、非表示スキルのモデレーション詳細にアクセスできます。
- 公開呼び出し元は、すでにフラグ付けされた表示中のスキルに対してのみ `200` を取得します。
- 証拠は公開呼び出し元向けには編集され、オーナー/モデレーター向けにのみ生スニペットを含みます。

### `POST /api/v1/skills/{slug}/report`

モデレーター確認のためにスキルを報告します。報告はスキルレベルで、任意でバージョンにリンクされ、スキル報告キューに送られます。

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

スキル報告の取り込み用モデレーター/管理者エンドポイント。

クエリパラメータ:

- `status` (任意): `open` (デフォルト)、`confirmed`、`dismissed`、または `all`
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

スキル報告を解決または再オープンするためのモデレーター/管理者エンドポイント。

リクエスト:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` は `confirmed` と `dismissed` では必須です。`status` を `open` に戻す場合は省略できます。トリアージ済み報告とともに `finalAction: "hide"` を渡すと、同じ監査可能なワークフローでスキルを非表示にします。

### `GET /api/v1/skills/{slug}/versions`

クエリパラメータ:

- `limit` (任意): 整数
- `cursor` (任意): ページネーションカーソル

### `GET /api/v1/skills/{slug}/versions/{version}`

バージョンメタデータ + ファイル一覧を返します。

- `version.security` は、利用可能な場合、正規化されたスキャン検証ステータスとスキャナー詳細 (VirusTotal + LLM) を含みます。

### `GET /api/v1/skills/{slug}/scan`

スキルバージョンのセキュリティスキャン検証詳細を返します。

クエリパラメータ:

- `version` (任意): 特定のバージョン文字列。
- `tag` (任意): タグ付きバージョンを解決します (例: `latest`)。

注記:

- `version` も `tag` も指定されていない場合は、最新バージョンを使用します。
- 正規化された検証ステータスと、スキャナー固有の詳細を含みます。
- `security.hasScanResult` は、スキャナーが確定的な判定（`clean`、`suspicious`、または `malicious`）を生成した場合にのみ `true` です。
- `moderation` は、最新バージョンから派生した現在のスキルレベルのモデレーションスナップショットです。
- 過去バージョンをクエリする場合は、`moderation` と `security` を同じバージョンコンテキストとして扱う前に、`moderation.matchesRequestedVersion` と `moderation.sourceVersion` を確認してください。

### `POST /api/v1/skills/-/scan`

新しい ClawScan ジョブ用の認証済み送信エンドポイント。

ローカルアップロードスキャンはサポートされなくなりました。
`multipart/form-data` または `{ "source": { "kind": "upload" } }` を使用するリクエストは `410` を返します。

公開済みスキャンは JSON を使用します。

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

注記:

- スキャンリクエストのペイロードとダウンロード可能なレポートは、保持期間後にスキャンリクエストストアから期限切れになります。
- 公開済みスキャンには、所有者/公開者の管理アクセス、またはプラットフォームモデレーター/管理者権限が必要です。
- 公開済みスキャンは、`update: true` でスキャンが正常に完了した場合にのみ書き戻します。
- レスポンスは `202` で、`{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` です。
- スキャンジョブは非同期です。手動スキャンリクエストは通常の公開/バックフィル作業より優先されますが、完了は引き続きワーカーの可用性に依存します。

### `GET /api/v1/skills/-/scan/{scanId}`

送信済みスキャン用の認証済みポーリングエンドポイント。

- キュー済み/実行中/成功/失敗ステータスを返します。
- キュー済みの間は `queue.queuedAhead` と `queue.position` を返すため、クライアントはリクエストより前にある優先手動スキャン数を表示できます。非常に大きなキューは上限が設定され、`queuedAheadIsEstimate: true` で報告されます。
- 利用可能な場合、`report` には `clawscan`、`skillspector`、`staticAnalysis`、`virustotal` セクションが含まれます。
- 失敗したスキャンジョブは、`lastError` とともに `status: "failed"` を返します。

### `GET /api/v1/skills/-/scan/{scanId}/download`

認証済みレポートアーカイブエンドポイント。

- 成功したスキャンが必要です。終端状態でないスキャンは `409` を返します。
- `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、`README.md` を含む ZIP を返します。

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

送信済みバージョン用の認証済み保存レポートアーカイブエンドポイント。

- スキルまたは Plugin への所有者/公開者の管理アクセス、またはプラットフォームモデレーター/管理者権限が必要です。
- ブロック済みまたは非表示のバージョンを含め、正確な送信済みバージョンの保存済みスキャン結果を返します。
- `kind` のデフォルトは `skill` です。Plugin/パッケージスキャンには `kind=plugin` を使用してください。
- スキャンリクエストのダウンロードと同じ ZIP 形状を返します。

### `POST /api/v1/skills/-/scan/batch`

管理者専用の正規バッチ再スキャンルート。レガシーの `POST /api/v1/skills/-/rescan-batch` と同じペイロード形状を受け付けます。

### `POST /api/v1/skills/-/scan/batch/status`

管理者専用の正規バッチステータスルート。`{ "jobIds": ["..."] }` を受け付け、レガシーの `POST /api/v1/skills/-/rescan-batch/status` と同じ集約カウンターを返します。

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` で使用される Skill Card 検証エンベロープを返します。

クエリパラメーター:

- `version`（任意）: 特定のバージョン文字列。
- `tag`（任意）: タグ付きバージョンを解決します（例: `latest`）。

注記:

- `ok` は、選択されたバージョンに生成済み Skill Card があり、モデレーションによってマルウェアブロックされておらず、ClawScan 検証がクリーンな場合にのみ `true` です。
- シェル自動化がネストされたラッパーを展開せずに読み取れるよう、スキル ID、公開者 ID、選択されたバージョンメタデータはトップレベルのエンベロープフィールド（`slug`、`displayName`、`publisherHandle`、`version`、`resolvedFrom`、`tag`、`createdAt`）です。
- `security` はトップレベルの ClawScan/セキュリティ判定です。自動化では `ok`、`decision`、`reasons`、`security.status` をキーにする必要があります。
- `security.signals` には、`staticScan`、`virusTotal`、`skillSpector` などの補助スキャナー証拠が含まれます。
- `security.signals.dependencyRegistry` は v1 レスポンス互換性のため保持されていますが、依存関係レジストリ存在スキャナーは廃止されており、このキーは常に `null` です。
- `provenance` は、ClawHub が公開またはインポート中に GitHub リポジトリ/ref/コミット/パスを解決して保存した場合にのみ `server-resolved-github-import` です。それ以外の場合は `unavailable` です。

### `POST /api/v1/skills/-/security-verdicts`

正確なスキルバージョンの現在のコンパクトなセキュリティ判定を返します。このコレクションエンドポイントは、OpenClaw Control UI など、表示する必要があるインストール済み ClawHub スキルバージョンをすでに把握しているクライアント向けです。

リクエスト:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

注記:

- `items` には、一意な `{ slug, version }` ペアを 1〜100 件含める必要があります。
- 結果は項目ごとです。1 つのスキルまたはバージョンが欠落していても、レスポンス全体は失敗しません。
- レスポンスはセキュリティのみです。Skill Card データ、生成済みカードステータス、アーティファクトファイル一覧、詳細なスキャナーペイロードは含まれません。
- `security.signals` にはステータスレベルの補助証拠のみが含まれます。完全なスキャナー詳細には `/scan` または ClawHub セキュリティ監査ページを使用してください。
- `security.signals.dependencyRegistry` は v1 レスポンス互換性のため保持されていますが、依存関係レジストリ存在スキャナーは廃止されており、このキーは常に `null` です。
- Skill Card が存在しないことは、このエンドポイントの `ok`、`decision`、`reasons` に影響しません。カードコンテンツが必要な場合、クライアントはインストール済みの `skill-card.md` をローカルで読み取る必要があります。
- 単一スキルの Skill Card 検証エンベロープが必要な場合は `/verify`、生成済みカード Markdown が必要な場合は `/card`、詳細なスキャナーデータが必要な場合は `/scan` を使用してください。

レスポンス:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

生のテキストコンテンツを返します。

クエリパラメータ:

- `path` (必須)
- `version` (任意)
- `tag` (任意)

注記:

- デフォルトでは最新バージョンになります。
- ファイルサイズ上限: 200KB。

### `GET /api/v1/packages`

次を対象にした統合カタログエンドポイント:

- Skills
- コード Plugin
- バンドル Plugin

クエリパラメータ:

- `limit` (任意): 整数 (1–100)
- `cursor` (任意): ページネーションカーソル
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `sort` (任意): `updated` (デフォルト)、`recommended`、`trending`、`downloads`、レガシーエイリアス `installs`
- `category` (任意): Plugin カテゴリフィルター。リクエストが Plugin パッケージ
  (`/api/v1/plugins`、`/api/v1/code-plugins`、
  `/api/v1/bundle-plugins`、または `family=code-plugin`/`family=bundle-plugin` を指定したパッケージエンドポイント)
  にスコープされている場合のみサポートされます。管理対象カテゴリと
  レガシー v1 フィルターエイリアスは `GET /api/v1/plugins` に記載されています。

注記:

- `family`、`channel`、`isOfficial`、`featured`、
  `highlightedOnly`、または `sort` の値が無効な場合は `400` を返します。不明なクエリパラメータは無視されます。
- `GET /api/v1/code-plugins` と `GET /api/v1/bundle-plugins` は固定ファミリーのエイリアスとして残ります。
- Skill エントリは引き続き Skill レジストリを基盤とし、`POST /api/v1/skills` 経由でのみ公開できます。
- `POST /api/v1/packages` は引き続きコード Plugin とバンドル Plugin のリリース専用です。
- 匿名の呼び出し元には公開パッケージチャネルのみが表示されます。
- 認証済みの呼び出し元は、所属する公開元のプライベートパッケージを一覧/検索結果で表示できます。
- `channel=private` は、認証済みの呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/packages/search`

Skills と Plugin パッケージを横断する統合カタログ検索。

クエリパラメータ:

- `q` (必須): クエリ文字列
- `limit` (任意): 整数 (1–100)
- `family` (任意): `skill`、`code-plugin`、または `bundle-plugin`
- `channel` (任意): `official`、`community`、または `private`
- `isOfficial` (任意): `true` または `false`
- `category` (任意): Plugin カテゴリフィルター。リクエストが
  Plugin パッケージにスコープされている場合のみサポートされます。管理対象カテゴリとレガシー v1
  フィルターエイリアスは `GET /api/v1/plugins` に記載されています。

注記:

- `family`、`channel`、`isOfficial`、`featured`、または
  `highlightedOnly` の値が無効な場合は `400` を返します。不明なクエリパラメータは無視されます。
- 匿名の呼び出し元には公開パッケージチャネルのみが表示されます。
- 認証済みの呼び出し元は、所属する公開元のプライベートパッケージを検索できます。
- `channel=private` は、認証済みの呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/plugins`

コード Plugin とバンドル Plugin パッケージを横断する Plugin 専用カタログ閲覧。

クエリパラメータ:

- `limit` (任意): 整数 (1-100)
- `cursor` (任意): ページネーションカーソル
- `isOfficial` (任意): `true` または `false`
- `sort` (任意): `recommended` (デフォルト)、`trending`、`downloads`、`updated`、レガシーエイリアス `installs`
- `category` (任意): Plugin カテゴリフィルター。現在の値:
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

レガシー v1 フィルターエイリアスは、読み取りエンドポイントで引き続き受け付けられます。

- `mcp-tooling`、`data`、`automation` は `tools` に解決されます。
- `observability` と `deployment` は `gateway` に解決されます。
- `dev-tools` は `runtime` に解決されます。

`trending` は 7 日間のインストール/ダウンロードのリーダーボードであり、累計総数は使用しません。
統合 `/api/v1/packages` エンドポイントでは Plugin 専用です。Skill カタログには
`/api/v1/skills?sort=trending` を使用してください。

レガシーエイリアスは、保存済みまたは作成者宣言のカテゴリ値としては受け付けられません。

### `GET /api/v1/skills/export`

オフライン分析用の最新公開 Skills の一括エクスポート。

認証:

- API トークンが必要です。

クエリパラメータ:

- `startDate` (必須): Skill の `updatedAt` に対する Unix ミリ秒の下限。
- `endDate` (必須): Skill の `updatedAt` に対する Unix ミリ秒の上限。
- `limit` (任意): 整数 (1-250)、デフォルトは `250`。
- `cursor` (任意): 前回のレスポンスからのページネーションカーソル。

レスポンス:

- 本文: ZIP アーカイブ。
- エクスポートされた各 Skill は `{publisher}/{slug}/` をルートにします。
- ホストされた Skill には、保存済み最新バージョンのファイルが含まれ、
  `_manifest.json` に `sourceRef: "public-clawhub"` として列挙されます。
- `clean` または `suspicious` のスキャンを持つ現在の GitHub ベースの Skill には、
  `sourceRef: "public-github"`、リポジトリ、コミット、パス、
  コンテンツハッシュ、アーカイブ URL を含む `_source_handoff.json` が含まれます。ClawHub ホストのソースファイルは含まれません。
- 各 Skill には `_export_skill_meta.json` が含まれます。
- `_manifest.json` は常に ZIP ルートに含まれます。
- 個別の Skill またはファイルをエクスポートできなかった場合は
  `_errors.json` が含まれます。

ヘッダー:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

オフライン分析用に、最新の公開 Plugin リリースを一括エクスポートします。

認証:

- API トークンが必要です。

クエリパラメーター:

- `startDate` (必須): Plugin の `updatedAt` に対する Unix ミリ秒の下限。
- `endDate` (必須): Plugin の `updatedAt` に対する Unix ミリ秒の上限。
- `limit` (任意): 整数 (1-250)、デフォルトは `250`。
- `cursor` (任意): 前回のレスポンスからのページネーションカーソル。
- `family` (任意): `code-plugin` または `bundle-plugin`。省略時は両方の
  Plugin ファミリーを意味します。

レスポンス:

- 本文: ZIP アーカイブ。
- エクスポートされた各 Plugin は `{family}/{packageName}/` をルートにします。
- エクスポートされた各 Plugin には、最新リリースの保存済みファイルが含まれます。
- Plugin ごとのエクスポートメタデータは
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` に保存されます。
- `_manifest.json` は常に ZIP ルートに含まれます。
- 個別の Plugin またはファイルをエクスポートできなかった場合は、
  `_errors.json` が含まれます。

ヘッダー:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-plugin と bundle-plugin パッケージを対象にした Plugin 専用検索。

クエリパラメーター:

- `q` (必須): クエリ文字列
- `limit` (任意): 整数 (1-100)
- `isOfficial` (任意): `true` または `false`
- `category` (任意): Plugin カテゴリーフィルター。現在の値:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`。

注記:

- `GET /api/v1/plugins` で文書化されているレガシー v1 フィルターエイリアスも
  受け付けられます。
- カテゴリーフィルタリングは、検索クエリの書き換えではなく、Plugin カテゴリーダイジェスト行に
  裏付けられた実際の API フィルターです。
- 結果は関連度順で返され、現時点ではページネーションされません。
- Plugin 検索のブラウザー UI ソートコントロールは、読み込まれた関連度結果を並べ替え、
  現在の `/skills` ブラウズ動作と一致します。

### `GET /api/v1/packages/{name}`

パッケージ詳細メタデータを返します。

注記:

- Skills も統合カタログ内でこのルートから解決できます。
- 非公開パッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `DELETE /api/v1/packages/{name}`

パッケージとすべてのリリースをソフト削除します。

注記:

- パッケージ所有者、組織パブリッシャーの所有者/管理者、
  プラットフォームモデレーター、またはプラットフォーム管理者の API トークンが必要です。

### `GET /api/v1/packages/{name}/versions`

バージョン履歴を返します。

クエリパラメーター:

- `limit` (任意): 整数 (1–100)
- `cursor` (任意): ページネーションカーソル

注記:

- 非公開パッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}`

ファイルメタデータ、互換性、検証、アーティファクトメタデータ、スキャンデータを含む、
1 つのパッケージバージョンを返します。

注記:

- `version.artifact.kind` は、旧方式のパッケージアーカイブでは `legacy-zip`、
  ClawPack ベースのリリースでは `npm-pack` です。
- ClawPack リリースには npm 互換の `npmIntegrity`、`npmShasum`、および
  `npmTarballName` フィールドが含まれます。
- `version.sha256hash` は、古いクライアント向けの非推奨の互換メタデータです。
  `/api/v1/packages/{name}/download` が返す正確な ZIP バイトをハッシュ化します。
  最新のクライアントは、正規リリースアーティファクトを識別する
  `version.artifact.sha256` を使用するべきです。
- `version.vtAnalysis`、`version.llmAnalysis`、`version.staticScan` は、
  スキャンデータが存在する場合に含まれます。
- 非公開パッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}/security`

インストールクライアント向けに、正確なパッケージリリースのセキュリティと信頼サマリーを返します。
これは、解決されたリリースをインストールできるかどうかを判断するための
公開 OpenClaw 消費サーフェスです。

認証:

- 公開読み取りエンドポイントです。所有者、パブリッシャー、モデレーター、または管理者のトークンは
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

- `package.name`、`package.displayName`、`package.family` は、解決された
  レジストリパッケージを識別します。
- `release.releaseId`、`release.version`、`release.createdAt` は、
  評価された正確なリリースを識別します。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum`、`release.npmTarballName` は、リリースアーティファクトについて
  既知の場合に存在します。
- `trust.scanStatus` は、スキャナー入力と手動リリースモデレーションから導出された
  有効な信頼ステータスです。
- `trust.moderationState` は null 許容です。手動リリースモデレーションが存在しない場合は
  `null` です。
- `trust.blockedFromDownload` はインストールブロックシグナルです。OpenClaw およびその他の
  インストールクライアントは、スキャナーまたはモデレーションフィールドからブロックルールを
  再導出するのではなく、この値が `true` の場合にインストールをブロックするべきです。
- `trust.reasons` は、ユーザー向けおよび監査用の説明リストです。理由コードは
  `manual:quarantined`、`scan:malicious`、`package:malicious` のような
  安定したコンパクトな文字列です。
- `trust.pending` は、1 つ以上の信頼入力がまだ完了待ちであることを意味します。
- `trust.stale` は、信頼サマリーが古い入力から計算されたことを意味し、
  高信頼の許可判断の前に更新が必要なものとして扱うべきです。

注記:

- このエンドポイントはバージョンに厳密です。クライアントは、最新のパッケージメタデータを
  読み取った後だけでなく、インストールしようとしているパッケージバージョンを解決した後に
  呼び出すべきです。
- 非公開パッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。
- このエンドポイントは、所有者/モデレーター向けのモデレーションエンドポイントよりも
  意図的に狭い範囲です。レポーターの身元、レポート本文、非公開証拠、内部レビューの
  タイムラインではなく、インストール判断と公開説明を公開します。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

パッケージバージョンの明示的なアーティファクトリゾルバーメタデータを返します。

注記:

- レガシーパッケージバージョンは、`legacy-zip` アーティファクトとレガシー ZIP の
  `downloadUrl` を返します。
- ClawPack バージョンは、`npm-pack` アーティファクト、npm 整合性フィールド、
  `tarballUrl`、およびレガシー ZIP 互換 URL を返します。
- これは OpenClaw のリゾルバーサーフェスです。共有 URL からアーカイブ形式を推測することを
  回避します。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

明示的なリゾルバーパスを通じてバージョンアーティファクトをダウンロードします。

注記:

- ClawPack バージョンは、アップロードされた正確な npm-pack `.tgz` バイトをストリームします。
- レガシー ZIP バージョンは `/api/v1/packages/{name}/download?version=` にリダイレクトします。
- ダウンロードレートバケットを使用します。

### `GET /api/v1/packages/{name}/readiness`

将来の OpenClaw 消費に向けて計算された準備状況を返します。

準備状況チェックの対象:

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

公式 OpenClaw Plugin 移行行を一覧表示するためのモデレーターエンドポイント。

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

- `bundledPluginId` は小文字に正規化され、安定した upsert キーです。
- `packageName` は npm-name 正規化されます。計画済み移行ではパッケージが存在しない場合があります。
- これは移行準備状況のみを追跡します。OpenClaw を変更したり ClawPack を生成したりしません。

### `GET /api/v1/packages/moderation/queue`

パッケージリリースレビューキュー用のモデレーター/管理者エンドポイント。

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
- `all`: 手動上書き、非 clean スキャン状態、またはパッケージレポートがある任意のリリース。

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

モデレーターレビューのためにパッケージを報告します。レポートはパッケージレベルであり、任意で
バージョンにリンクされます。モデレーションキューに送られますが、それ自体でダウンロードを
自動的に非表示またはブロックすることはありません。モデレーターはリリースモデレーションを使用して、
アーティファクトを承認、隔離、または取り消すべきです。

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

モデレーター/管理者向けのパッケージレポート受け付けエンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `status`（任意）: `open`（デフォルト）、`confirmed`、`dismissed`、または `all`
- `limit`（任意）: 整数（1-100）
- `cursor`（任意）: ページネーションカーソル

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

パッケージモデレーションの可視性を提供する、オーナー/モデレーター向けエンドポイント。

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

パッケージレポートを解決または再オープンする、モデレーター/管理者向けエンドポイント。

リクエスト:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` と `dismissed` では `note` が必須です。`status` を `open` に戻す場合は省略できます。確認済みレポートで `finalAction: "quarantine"` または
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

パッケージリリースレビュー用のモデレーター/管理者向けエンドポイント。

リクエスト:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

サポートされる状態:

- `approved`: 手動レビュー済みで許可されています。
- `quarantined`: フォローアップ待ちでブロックされています。
- `revoked`: 以前に信頼されていたリリースがブロックされています。

隔離済みおよび取り消し済みのリリースでは、アーティファクトダウンロードルートから `403` が返されます。
すべての変更は監査ログエントリを書き込みます。

### `GET /api/v1/packages/{name}/file`

パッケージファイルの生のテキスト内容を返します。

クエリパラメーター:

- `path`（必須）
- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- ダウンロードバケットではなく、読み取りレートバケットを使用します。
- バイナリファイルは `415` を返します。
- ファイルサイズ上限: 200KB。
- 保留中の VirusTotal スキャンは読み取りをブロックしません。悪意のあるリリースは別の場所で差し止められる場合があります。
- プライベートパッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `GET /api/v1/packages/{name}/download`

パッケージリリースのレガシーな決定論的 ZIP アーカイブをダウンロードします。

クエリパラメーター:

- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- Skills は `GET /api/v1/download` にリダイレクトします。
- Plugin/パッケージアーカイブは、古い OpenClaw
  クライアントが引き続き動作するように `package/` ルートを持つ zip ファイルです。
- このルートは ZIP 専用のままです。ClawPack `.tgz` ファイルはストリーミングしません。
- レスポンスには、リゾルバーの整合性チェック用に `ETag`、`Digest`、`X-ClawHub-Artifact-Type`、および
  `X-ClawHub-Artifact-Sha256` ヘッダーが含まれます。
- レジストリ専用メタデータは、ダウンロードされるアーカイブに注入されません。
- 保留中の VirusTotal スキャンはダウンロードをブロックしません。悪意のあるリリースは `403` を返します。
- プライベートパッケージは、呼び出し元がオーナーである場合を除き `404` を返します。

### `GET /api/npm/{package}`

ClawPack に基づくパッケージバージョンの npm 互換 packument を返します。

注記:

- アップロード済みの ClawPack npm-pack tarball があるバージョンのみが一覧表示されます。
- レガシーな ZIP 専用バージョンは意図的に省略されます。
- `dist.tarball`、`dist.integrity`、および `dist.shasum` は npm 互換の
  フィールドを使用するため、ユーザーは必要に応じて npm をミラーに向けられます。
- スコープ付きパッケージの packument は、`/api/npm/@scope/name` と npm の
  エンコード済み `/api/npm/@scope%2Fname` リクエストパスの両方をサポートします。

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ミラークライアント向けに、アップロードされた正確な ClawPack tarball バイトをストリーミングします。

注記:

- ダウンロードレートバケットを使用します。
- ダウンロードヘッダーには、ClawHub SHA-256 に加えて npm integrity/shasum メタデータが含まれます。
- モデレーションとプライベートパッケージアクセスチェックは引き続き適用されます。

### `GET /api/v1/resolve`

CLI がローカルフィンガープリントを既知のバージョンに対応付けるために使用します。

クエリパラメーター:

- `slug`（必須）
- `hash`（必須）: バンドルフィンガープリントの 64 文字 hex sha256

レスポンス:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ホストされた skill バージョン ZIP をダウンロードするか、`clean` または `suspicious` スキャンで、ホスト済み
バージョンがない現在の GitHub ベース skill に対する GitHub ソース引き渡しを返します。

クエリパラメーター:

- `slug`（必須）
- `version`（任意）: semver 文字列
- `tag`（任意）: タグ名（例: `latest`）

注記:

- `version` と `tag` のどちらも指定されていない場合、最新バージョンが使用されます。
- ソフト削除されたバージョンは `410` を返します。
- GitHub ベース skill の引き渡しは、バイトをプロキシまたはミラーしません。JSON レスポンスには
  `sourceRef: "public-github"`、`repo`、`commit`、`path`、`contentHash`、
  および `archiveUrl` が含まれます。スキャン/現在状態はゲートであり、成功時の
  ペイロードメタデータとしては含まれません。
- ダウンロード統計は UTC 日ごとの一意な ID としてカウントされます（API トークンが有効な場合は `userId`、それ以外は IP）。

## 認証エンドポイント（Bearer token）

すべてのエンドポイントで次が必要です:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

トークンを検証し、ユーザーハンドルを返します。

### `POST /api/v1/skills`

新しいバージョンを公開します。

- 推奨: `payload` JSON + `files[]` blob を含む `multipart/form-data`。
- `files`（storageId ベース）を含む JSON body も受け付けます。
- 任意のペイロードフィールド: `ownerHandle`。存在する場合、API はその
  パブリッシャーをサーバー側で解決し、アクターにパブリッシャーアクセス権があることを要求します。
- 任意のペイロードフィールド: `migrateOwner`。`ownerHandle` とともに `true` の場合、
  アクターが現在とターゲットの両方のパブリッシャーで管理者/オーナーであれば、既存の skill をそのオーナーへ移動できます。
  このオプトインがない場合、オーナー変更は拒否されます。

### `POST /api/v1/packages`

code-plugin または bundle-plugin リリースを公開します。

- Bearer token 認証が必要です。
- `multipart/form-data` が必要です。
- 許可されるフォームフィールドは、`payload`、繰り返しの `files` blob、または 1 つの `clawpack`
  tarball 参照です。`clawpack` は `.tgz` blob、または upload-url フローから返された storage id です。
  ステージ済み storage-id 公開では、そのアップロード URL とともに返された
  `clawpackUploadTicket` も含める必要があります。
- `files` または `clawpack` のどちらかを使用し、同じリクエストで両方は使用しないでください。
- JSON body と、呼び出し元が指定した `payload.files` / `payload.artifact`
  メタデータは拒否されます。
- 直接 multipart 公開リクエストは 18MB に制限されます。ClawPack tarball は
  upload-url フローを使用して 120MB tarball 上限まで利用できます。
- 任意のペイロードフィールド: `ownerHandle`。存在する場合、管理者のみがそのオーナーの代理で公開できます。

検証の要点:

- `family` は `code-plugin` または `bundle-plugin` である必要があります。
- Plugin パッケージには `openclaw.plugin.json` が必要です。ClawPack `.tgz` アップロードでは、
  `package/openclaw.plugin.json` にそれを含める必要があります。
- Code plugin には、`package.json`、ソースリポジトリメタデータ、ソースコミット
  メタデータ、設定スキーマメタデータ、`openclaw.compat.pluginApi`、および
  `openclaw.build.openclawVersion` が必要です。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
- `official` チャンネルに公開できるのは、`openclaw` org パブリッシャーと現在の `openclaw` org メンバーの
  個人パブリッシャーのみです。
- 代理公開でも、公式チャンネルの資格はターゲットオーナーアカウントに対して検証されます。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill をソフト削除 / 復元します（オーナー、モデレーター、または管理者）。

任意の JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

存在する場合、`reason` は skill モデレーションノートとして保存され、監査ログにコピーされます。
オーナー主導のソフト削除では slug が 30 日間予約され、その後 slug は
別のパブリッシャーが取得できます。この有効期限が適用される場合、削除レスポンスには `slugReservedUntil` が含まれます。
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

管理者専用。ハンドルに対して org パブリッシャーが存在することを保証します。ハンドルがまだ
レガシーな共有ユーザー/個人パブリッシャーを指している場合、エンドポイントはまずそれを org パブリッシャーに移行します。
新規作成された org では `memberHandle` を指定します。実行中の管理者はメンバーとして追加されません。
`memberRole` のデフォルトは `owner` です。

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

認証済みセルフサービスの org パブリッシャー作成。新しい org パブリッシャーを作成し、
呼び出し元をオーナーとして追加します。このエンドポイントは既存のユーザー/個人ハンドルを移行せず、
パブリッシャーを trusted/official としてマークしません。

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ハンドルが既にパブリッシャー、ユーザー、または個人パブリッシャーで使用されている場合は `409` を返します。

### `POST /api/v1/users/reserve`

管理者専用。リリースを公開せずに、正当なオーナーのためにルート slug とパッケージ名を予約します。
パッケージ名はリリース行のないプライベートなプレースホルダーパッケージになるため、同じ
オーナーは後で実際の code-plugin または bundle-plugin リリースをその名前に公開できます。

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

管理者専用。Convex Auth アカウント行を編集せずに、検証済みの代替 GitHub OAuth プリンシパル向けに
個人パブリッシャーを復旧します。リクエストでは、両方の不変の GitHub
プロバイダーアカウント ID を指定する必要があります。変更可能なハンドルは、オペレーター向けのガードとしてのみ使用されます。

エンドポイントはデフォルトでドライランになります。復旧を適用するには、スタッフが両方の GitHub プリンシパル間の継続性を独立して確認した後に、`dryRun: false` と
`confirmIdentityVerified: true` が必要です。復旧先ユーザーの現在の個人パブリッシャーに Skills、パッケージ、または GitHub skill sources がある場合、復旧はフェイルクローズします。
復旧では、復旧されたパブリッシャーの Skills、skill slug aliases、パッケージ、package inspector warnings、および派生 search digest rows の legacy `ownerUserId` フィールドも移行されるため、直接 owner パスは新しいパブリッシャー権限と一致します。復旧されたハンドルに対する有効な protected-handle reservation も置換ユーザーに再割り当てされるため、その後の profile synchronization で以前のユーザーの競合する権限が復元されることはありません。各 primary table は、apply トランザクションごとに
100 行に制限されます。より大きな復旧では、まず再開可能な owner migration を使用する必要があります。
GitHub skill sources はパブリッシャー単位でスコープされ、書き換えではなく確認済みとして報告されます。

- 本文: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- レスポンス: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug 管理エンドポイント

- `POST /api/v1/skills/{slug}/rename`
  - 本文: `{ "newSlug": "new-canonical-slug" }`
  - レスポンス: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文: `{ "targetSlug": "canonical-target-slug" }`
  - レスポンス: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注記:

- どちらのエンドポイントも API token auth が必要で、skill owner のみが使用できます。
- `rename` は以前の slug を redirect alias として保持します。
- `merge` は source listing を非表示にし、source slug を target listing にリダイレクトします。

### 所有権移転エンドポイント

- `POST /api/v1/skills/{slug}/transfer`
  - 本文: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - レスポンス: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - レスポンス（accept/reject/cancel）: `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - レスポンス形状: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

ユーザーを ban し、所有する Skills を hard-delete します（moderator/admin のみ）。

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

ユーザーの ban を解除し、対象となる Skills を復元します（admin のみ）。

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

### `POST /api/v1/users/reclassify-ban`

ban 解除やコンテンツ復元を行わずに、既存の ban に保存されている理由を変更します（admin のみ）。`dryRun` が `false` でない限り、デフォルトはドライランです。

本文:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

または

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

レスポンス:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

ユーザー role を変更します（admin のみ）。

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

star（highlights）を追加または削除します。どちらのエンドポイントも冪等です。

レスポンス:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI エンドポイント（非推奨）

古い CLI バージョン向けに引き続きサポートされています:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

削除計画については `DEPRECATIONS.md` を参照してください。

`POST /api/cli/upload-url` は `uploadUrl` と `uploadTicket` を返します。ClawPack tarball をステージングするパッケージ公開では、結果の storage id を
`clawpack` として、返された ticket を `clawpackUploadTicket` として送信する必要があります。

## Registry discovery（`/.well-known/clawhub.json`）

CLI はサイトから registry/auth 設定を検出できます:

- `/.well-known/clawhub.json`（JSON、推奨）
- `/.well-known/clawdhub.json`（legacy）

スキーマ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

セルフホストする場合は、このファイルを配信してください（または `CLAWHUB_REGISTRY` を明示的に設定してください。legacy は `CLAWDHUB_REGISTRY`）。
