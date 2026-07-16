---
read_when:
    - エンドポイントの追加・変更
    - CLI ↔ レジストリ間リクエストのデバッグ
summary: HTTP API リファレンス（公開エンドポイント、CLI エンドポイント、認証）。
x-i18n:
    generated_at: "2026-07-16T11:25:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

ベース URL: `https://clawhub.ai`（デフォルト）。

すべての v1 パスは `/api/v1/...` 配下にあります。
互換性のため、従来の `/api/...` と `/api/cli/...` も引き続き利用できます（`DEPRECATIONS.md` を参照）。
OpenAPI: `/api/v1/openapi.json`。

## 公開カタログの再利用

サードパーティのディレクトリでは、公開読み取りエンドポイントを使用して ClawHub Skills を一覧表示または検索できます。結果をキャッシュし、`429`/`Retry-After` に従い、ユーザーを正規の ClawHub リスト（`https://clawhub.ai/<owner>/skills/<slug>`）へ誘導し、ClawHub がサードパーティサイトを推奨しているかのような表現は避けてください。非表示、非公開、またはモデレーションによってブロックされたコンテンツを、公開 API の範囲外でミラーリングしようとしないでください。

Web のスラッグショートカットは複数のレジストリファミリーにわたって解決されますが、API クライアントはルートの優先順位を再構築せず、読み取りエンドポイントから返される正規 URL を使用してください。

## レート制限

適用モデル:

- 匿名リクエスト: IP ごとに適用されます。
- 認証済みリクエスト（有効な Bearer トークン）: ユーザーバケットごとに適用されます。
- トークンがない、または無効な場合、IP による適用へフォールバックします。
- 認証が必要な書き込みエンドポイントでは、サーバーが理由を把握している場合、単独の `Unauthorized` を返すべきではありません。トークンの欠落、無効化または失効したトークン、削除、禁止、または無効化されたアカウントには、それぞれ対処可能なテキストを返し、CLI クライアントがユーザーにブロックの原因を伝えられるようにしてください。

- 読み取り: IP ごとに 3000/分、キーごとに 12000/分
- 書き込み: IP ごとに 300/分、キーごとに 3000/分
- ダウンロード: IP ごとに 1200/分、キーごとに 6000/分（ダウンロードエンドポイント）

ヘッダー:

- 従来の互換形式: `X-RateLimit-Limit`、`X-RateLimit-Reset`
- 標準化形式: `RateLimit-Limit`、`RateLimit-Reset`
- `429` の場合: `X-RateLimit-Remaining: 0` と `RateLimit-Remaining: 0`
- `429` の場合: `Retry-After`

ヘッダーの意味:

- `X-RateLimit-Reset`: Unix エポックからの絶対秒数
- `RateLimit-Reset`: リセットまでの秒数（遅延）
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 存在する場合は正確な残り枠。シャーディングされた成功リクエストでは、概算のグローバル値を返さず、このヘッダーを省略します。
- `Retry-After`: `429` の後、再試行まで待機する秒数（遅延）

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

レート制限を超過しました
```

クライアント向けガイダンス:

- `Retry-After` が存在する場合、再試行する前に指定された秒数だけ待機してください。
- 再試行の同期を避けるため、ジッター付きバックオフを使用してください。
- `Retry-After` がない場合は、`RateLimit-Reset` にフォールバックしてください（または `X-RateLimit-Reset` から計算してください）。

IP の取得元:

- `cf-connecting-ip` を含む信頼済みクライアント IP ヘッダーは、デプロイメントで信頼済み転送ヘッダーが明示的に有効化されている場合にのみ使用されます。
- ClawHub はエッジでクライアント IP を識別するため、信頼済み転送ヘッダーを使用します。
- 信頼済みクライアント IP が利用できない場合、匿名リクエストではレート制限の種類のみをスコープとするフォールバックバケットを使用します。これらのフォールバックバケットには、呼び出し元が指定したパス、スラッグ、パッケージ名、バージョン、クエリ文字列、その他のアーティファクトパラメーターは含まれません。

## エラーレスポンス

公開 v1 エラーレスポンスは、`content-type: text/plain; charset=utf-8` を使用したプレーンテキストです。
これには、検証エラー（`400`）、公開リソースの欠落（`404`）、認証および権限エラー（`401`/`403`）、レート制限（`429`）、ブロックされたダウンロードが含まれます。クライアントはレスポンス本文を人間が読める文字列として読み取ってください。未知のクエリパラメーターは互換性のため無視されますが、認識されるクエリパラメーターに無効な値が指定された場合は `400` が返されます。

## 公開エンドポイント（認証不要）

### `GET /api/v1/search`

クエリパラメーター:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数
- `highlightedOnly`（任意）: 注目の Skills のみに絞り込む場合は `true`
- `nonSuspiciousOnly`（任意）: 疑わしい（`flagged.suspicious`）Skills を非表示にする場合は `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` の従来のエイリアス

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

- 結果は関連度順（埋め込み類似度 + スラッグまたは名前の完全一致トークンに対するブースト + 小さな人気度事前分布）で返されます。
- 関連度は人気度より強く考慮されます。スラッグまたは表示名のトークンが正確に一致する場合、エンゲージメントがはるかに高くても一致度が低い結果より上位になることがあります。
- ASCII テキストは単語と句読点の境界でトークン化されます。たとえば、`personal-map` には独立した `map` トークンが含まれ、`amap-jsapi-skill` には `amap`、`jsapi`、`skill` が含まれます。そのため、`map` を検索すると、`personal-map` は `amap-jsapi-skill` より語彙的な一致度が高くなります。
- 人気度は対数スケールで上限が設定されます。エンゲージメントの高い Skills でも、クエリテキストとの一致度が低い場合は順位が下がることがあります。
- 呼び出し元のフィルターと現在のモデレーション状態によっては、疑わしいまたは非表示のモデレーション状態にある Skills が公開検索から除外されることがあります。

公開者向けの発見可能性に関するガイダンス:

- ユーザーが実際に検索する用語を、表示名、概要、タグに含めてください。独立したスラッグトークンは、維持したい安定した識別子でもある場合にのみ使用してください。
- 新しいスラッグが長期的により適切な正規名でない限り、1 つのクエリを狙うためだけにスラッグを変更しないでください。古いスラッグはリダイレクトエイリアスになりますが、正規 URL、表示されるスラッグ、今後の検索ダイジェストでは新しいスラッグが使用されます。
- 名前変更エイリアスにより、古い URL と、レジストリ経由で解決されるインストールは引き続き解決できますが、検索順位は名前変更後にインデックスされた正規の Skills メタデータに基づきます。既存の統計は Skills に保持されます。
- Skills が予期せず表示されない場合は、順位に関連するメタデータを変更する前に、ログインした状態で `clawhub inspect @owner/slug` を使用して、まずモデレーション状態を確認してください。

### `GET /api/v1/skills`

クエリパラメーター:

- `limit`（任意）: 整数（1–200）
- `cursor`（任意）: `trending` 以外の並べ替えに使用するページネーションカーソル
- `sort`（任意）: `updated`（デフォルト）、`recommended`（エイリアス: `default`）、`createdAt`（エイリアス: `newest`）、`downloads`、`stars`（エイリアス: `rating`）、従来のインストール用エイリアス `installsCurrent`/`installs`/`installsAllTime` は `downloads`、`trending` にマッピングされます
- `nonSuspiciousOnly`（任意）: 疑わしい（`flagged.suspicious`）Skills を非表示にする場合は `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` の従来のエイリアス

無効な `sort` 値を指定すると `400` が返されます。

注記:

- `recommended` はエンゲージメントと新しさのシグナルを使用します。
- `trending` は過去 7 日間のインストール数（テレメトリベース）で順位付けします。
- `createdAt` は新しい Skills のクロールで安定しています。`updated` は既存の Skills が再公開されると変化します。
- `nonSuspiciousOnly=true` の場合、ページ取得後に疑わしい Skills が除外されるため、カーソルベースの並べ替えでは 1 ページに返される項目数が `limit` 未満になることがあります。
- `nextCursor` が存在する場合は、それを使用してページネーションを続行してください。ページが短いことだけでは、結果の終端を意味しません。

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

- 所有者による名前変更またはマージフローで作成された古いスラッグは、正規の Skills に解決されます。
- `metadata.os`: Skills の frontmatter で宣言された OS 制限（例: `["macos"]`、`["linux"]`）。宣言されていない場合は `null`。
- `metadata.systems`: Nix システムターゲット（例: `["aarch64-darwin", "x86_64-linux"]`）。宣言されていない場合は `null`。
- Skills にプラットフォームメタデータがない場合、`metadata` は `null` です。
- `moderation` は、Skills にフラグが付いている場合、または所有者が表示している場合にのみ含まれます。

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
    "summary": "検出: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "動的コード実行が検出されました。",
        "evidence": ""
      }
    ]
  }
}
```

注記:

- 所有者とモデレーターは、非表示の Skills のモデレーション詳細にアクセスできます。
- 公開呼び出し元が `200` を取得できるのは、すでにフラグが付いている表示可能な Skills に限られます。
- 公開呼び出し元に対して証拠は編集され、生のスニペットが含まれるのは所有者またはモデレーターに対してのみです。

### `POST /api/v1/skills/{slug}/report`

モデレーターによる審査のために Skills を報告します。報告は Skills 単位で、必要に応じてバージョンにリンクされ、Skills 報告キューに送られます。

認証:

- API トークンが必要です。

リクエスト:

```json
{ "reason": "疑わしいインストール手順", "version": "1.2.3" }
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

Skills 報告を受け付けるためのモデレーターおよび管理者向けエンドポイントです。

クエリパラメーター:

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
      "reason": "不審なインストール手順",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "報告者"
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

Skillの報告を解決または再オープンするためのモデレーター／管理者用エンドポイント。

リクエスト：

```json
{ "status": "confirmed", "note": "確認し、影響を受けるバージョンを非表示にしました。", "finalAction": "hide" }
```

`note` は `confirmed` および `dismissed` では必須です。`status` を
`open` に戻す場合は省略できます。トリアージ済みの報告で `finalAction: "hide"` を渡すと、
同じ監査可能なワークフロー内でSkillを非表示にできます。

### `GET /api/v1/skills/{slug}/versions`

クエリパラメータ：

- `limit`（任意）：整数
- `cursor`（任意）：ページネーションカーソル

### `GET /api/v1/skills/{slug}/versions/{version}`

バージョンのメタデータとファイル一覧を返します。

- `version.security` には、利用可能な場合、正規化されたスキャン検証ステータスと
スキャナーの詳細（VirusTotal + LLM）が含まれます。

### `GET /api/v1/skills/{slug}/scan`

Skillバージョンのセキュリティスキャン検証詳細を返します。

クエリパラメータ：

- `version`（任意）：特定のバージョン文字列。
- `tag`（任意）：タグ付きバージョンを解決します（例：`latest`）。

注：

- `version` と `tag` のいずれも指定されていない場合、最新バージョンを使用します。
- 正規化された検証ステータスとスキャナー固有の詳細が含まれます。
- `security.hasScanResult` が `true` になるのは、スキャナーが確定的な判定（`clean`、`suspicious`、または `malicious`）を生成した場合のみです。
- `moderation` は、最新バージョンから導出された現在のSkillレベルのモデレーションスナップショットです。
- 過去のバージョンを照会する場合、`moderation` と `security` を同じバージョンコンテキストとして扱う前に、`moderation.matchesRequestedVersion` と `moderation.sourceVersion` を確認してください。

### `POST /api/v1/skills/-/scan`

新しいClawScanジョブ用の認証済み送信エンドポイント。

ローカルアップロードのスキャンはサポートされなくなりました。
`multipart/form-data` または `{ "source": { "kind": "upload" } }` を使用するリクエストは `410` を返します。

公開済みスキャンではJSONを使用します：

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

注：

- スキャンリクエストのペイロードとダウンロード可能なレポートは、保持期間の経過後にスキャンリクエストストアから期限切れになります。
- 公開済みスキャンには、所有者／公開者の管理アクセス権、またはプラットフォームのモデレーター／管理者権限が必要です。
- 公開済みスキャンが書き戻されるのは、`update: true` であり、かつスキャンが正常に完了した場合のみです。
- レスポンスは `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` を含む `202` です。
- スキャンジョブは非同期です。手動スキャンリクエストは通常の公開／バックフィル処理より優先されますが、完了は引き続きワーカーの可用性に依存します。

### `GET /api/v1/skills/-/scan/{scanId}`

送信済みスキャン用の認証済みポーリングエンドポイント。

- キュー待ち／実行中／成功／失敗のステータスを返します。
- キュー待ち中は `queue.queuedAhead` と `queue.position` を返すため、クライアントはリクエストより前に優先処理される手動スキャンの数を表示できます。非常に大きなキューは上限が設定され、`queuedAheadIsEstimate: true` とともに報告されます。
- 利用可能な場合、`report` には `clawscan`、`skillspector`、`staticAnalysis`、および `virustotal` のセクションが含まれます。
- 失敗したスキャンジョブは、`lastError` を含む `status: "failed"` を返します。

### `GET /api/v1/skills/-/scan/{scanId}/download`

認証済みレポートアーカイブエンドポイント。

- 成功したスキャンが必要です。終了状態でないスキャンは `409` を返します。
- `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、および `README.md` を含むZIPを返します。

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

送信済みバージョン用の認証済み保存レポートアーカイブエンドポイント。

- SkillまたはPluginに対する所有者／公開者の管理アクセス権、またはプラットフォームのモデレーター／管理者権限が必要です。
- ブロック済みまたは非表示のバージョンを含め、送信された正確なバージョンの保存済みスキャン結果を返します。
- `kind` のデフォルトは `skill` です。Plugin／パッケージのスキャンには `kind=plugin` を使用します。
- スキャンリクエストのダウンロードと同じ形式のZIPを返します。

### `POST /api/v1/skills/-/scan/batch`

管理者専用の正規バッチ再スキャンルート。従来の `POST /api/v1/skills/-/rescan-batch` と同じペイロード形式を受け付けます。

### `POST /api/v1/skills/-/scan/batch/status`

管理者専用の正規バッチステータスルート。`{ "jobIds": ["..."] }` を受け付け、従来の `POST /api/v1/skills/-/rescan-batch/status` と同じ集計カウンターを返します。

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` で使用されるSkill Card検証エンベロープを返します。

クエリパラメータ：

- `version`（任意）：特定のバージョン文字列。
- `tag`（任意）：タグ付きバージョンを解決します（例：`latest`）。

注：

- `ok` が `true` になるのは、選択したバージョンに生成済みのSkill Cardがあり、モデレーションによってマルウェアとしてブロックされておらず、ClawScan検証がクリーンな場合のみです。
- シェル自動化がネストされたラッパーを展開せずに読み取れるように、Skillの識別情報、公開者の識別情報、および選択したバージョンのメタデータは、トップレベルのエンベロープフィールド（`slug`、`displayName`、`publisherHandle`、`version`、`resolvedFrom`、`tag`、`createdAt`）です。
- `security` はトップレベルのClawScan／セキュリティ判定です。自動化では `ok`、`decision`、`reasons`、および `security.status` を判定基準にしてください。
- `security.signals` には、`staticScan`、`virusTotal`、`skillSpector` などの補足的なスキャナー証拠が含まれます。
- `security.signals.dependencyRegistry` はv1レスポンスとの互換性のために保持されていますが、依存関係レジストリ存在確認スキャナーは廃止されており、このキーは常に `null` です。
- `provenance` が `server-resolved-github-import` になるのは、公開またはインポート時にClawHubがGitHubリポジトリ／ref／コミット／パスを解決して保存した場合のみです。それ以外の場合は `unavailable` です。

### `POST /api/v1/skills/-/security-verdicts`

正確なSkillバージョンに対する現在のコンパクトなセキュリティ判定を返します。この
コレクションエンドポイントは、OpenClaw Control UIなど、表示する必要があるインストール済み
ClawHub Skillのバージョンをすでに把握しているクライアントを対象としています。

リクエスト：

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

注：

- `items` には、1～100個の一意な `{ slug, version }` ペアを含める必要があります。
- 結果は項目ごとに返されます。1つのSkillまたはバージョンが見つからなくても、レスポンス全体は失敗しません。
- レスポンスにはセキュリティ情報のみが含まれます。Skill Cardデータ、生成済みカードのステータス、アーティファクトのファイル一覧、または詳細なスキャナーペイロードは含まれません。
- `security.signals` にはステータスレベルの補足的な証拠のみが含まれます。スキャナーの完全な詳細については、`/scan` またはClawHubのセキュリティ監査ページを使用してください。
- `security.signals.dependencyRegistry` はv1レスポンスとの互換性のために保持されていますが、依存関係レジストリ存在確認スキャナーは廃止されており、このキーは常に `null` です。
- Skill Cardが存在しないことは、このエンドポイントの `ok`、`decision`、または `reasons` に影響しません。クライアントがカード内容を必要とする場合は、インストール済みの `skill-card.md` をローカルで読み取る必要があります。
- 単一SkillのSkill Card検証エンベロープが必要な場合は `/verify`、生成済みカードのMarkdownが必要な場合は `/card`、詳細なスキャナーデータが必要な場合は `/scan` を使用してください。

レスポンス：

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
      "error": { "code": "version_not_found", "message": "バージョンが見つかりません" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

未加工のテキスト内容を返します。

クエリパラメータ：

- `path`（必須）
- `version`（任意）
- `tag`（任意）

注：

- デフォルトでは最新バージョンを使用します。
- ファイルサイズの上限：200KB。

### `GET /api/v1/packages`

以下に対応する統合カタログエンドポイント：

- Skill
- コードPlugin
- バンドルPlugin

クエリパラメータ：

- `limit`（任意）：整数（1～100）
- `cursor`（任意）：ページネーションカーソル
- `family`（任意）：`skill`、`code-plugin`、または `bundle-plugin`
- `channel`（任意）：`official`、`community`、または `private`
- `isOfficial`（任意）：`true` または `false`
- `sort`（任意）：`updated`（デフォルト）、`recommended`、`trending`、`downloads`、従来のエイリアス `installs`
- `category`（任意）：Pluginカテゴリフィルター。リクエストの対象が
  Pluginパッケージ（`/api/v1/plugins`、`/api/v1/code-plugins`、`/api/v1/bundle-plugins`、または
  `family=code-plugin`/`family=bundle-plugin` を指定したパッケージエンドポイント）に限定されている場合のみ
  サポートされます。管理対象カテゴリと従来のv1フィルターエイリアスについては、
  `GET /api/v1/plugins` に記載されています。

注：

- `family`、`channel`、`isOfficial`、`featured`、
  `highlightedOnly`、または `sort` に無効な値を指定すると、`400` が返されます。不明なクエリパラメータは無視されます。
- `GET /api/v1/code-plugins` と `GET /api/v1/bundle-plugins` は固定ファミリーのエイリアスとして維持されます。
- Skillのエントリは引き続きSkillレジストリを基盤とし、`POST /api/v1/skills` を通じてのみ公開できます。
- `POST /api/v1/packages` は引き続きコードPluginおよびバンドルPluginのリリース専用です。
- 匿名の呼び出し元に表示されるのは、公開パッケージチャンネルのみです。
- 認証済みの呼び出し元は、一覧／検索結果で、自身が所属する公開者の非公開パッケージを確認できます。
- `channel=private` は、認証済みの呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/packages/search`

SkillとPluginパッケージを横断する統合カタログ検索。

クエリパラメータ：

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数（1–100）
- `family`（任意）: `skill`、`code-plugin`、または `bundle-plugin`
- `channel`（任意）: `official`、`community`、または `private`
- `isOfficial`（任意）: `true` または `false`
- `category`（任意）: Plugin カテゴリフィルター。リクエストの対象が
  Plugin パッケージに限定されている場合にのみサポートされます。管理対象カテゴリとレガシー v1
  フィルターエイリアスについては、`GET /api/v1/plugins` に記載されています。

注記:

- `family`、`channel`、`isOfficial`、`featured`、または
  `highlightedOnly` に無効な値を指定すると、`400` が返されます。不明なクエリパラメータは無視されます。
- 匿名の呼び出し元には、公開パッケージチャンネルのみが表示されます。
- 認証済みの呼び出し元は、自身が所属するパブリッシャーの非公開パッケージを検索できます。
- `channel=private` は、認証済みの呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/plugins`

コード Plugin およびバンドル Plugin パッケージを横断する、Plugin のみを対象としたカタログ閲覧。

クエリパラメータ:

- `limit`（任意）: 整数（1-100）
- `cursor`（任意）: ページネーションカーソル
- `isOfficial`（任意）: `true` または `false`
- `sort`（任意）: `recommended`（デフォルト）、`trending`、`downloads`、`updated`、レガシーエイリアス `installs`
- `category`（任意）: Plugin カテゴリフィルター。現在の値:
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

レガシー v1 フィルターエイリアスは、読み取りエンドポイントで引き続き受け入れられます:

- `mcp-tooling`、`data`、および `automation` は `tools` に解決されます。
- `observability` および `deployment` は `gateway` に解決されます。
- `dev-tools` は `runtime` に解決されます。

`trending` は過去 7 日間のインストール数／ダウンロード数ランキングであり、累計値は使用しません。
統合された `/api/v1/packages` エンドポイントでは Plugin のみが対象です。Skills カタログには
`/api/v1/skills?sort=trending` を使用してください。

レガシーエイリアスは、保存されるカテゴリ値または作成者が宣言するカテゴリ値としては受け入れられません。

### `GET /api/v1/skills/export`

オフライン分析用に、公開されている最新の Skills を一括エクスポートします。

認証:

- API トークンが必要です。

クエリパラメータ:

- `startDate`（必須）: Skills の `updatedAt` に対する Unix ミリ秒単位の下限。
- `endDate`（必須）: Skills の `updatedAt` に対する Unix ミリ秒単位の上限。
- `limit`（任意）: 整数（1-250）、デフォルトは `250`。
- `cursor`（任意）: 前のレスポンスから取得したページネーションカーソル。

レスポンス:

- 本文: ZIP アーカイブ。
- エクスポートされた各 Skills のルートは `{publisher}/{slug}/` です。
- ホストされている Skills には、保存されている最新バージョンのファイルが含まれ、
  `_manifest.json` に `sourceRef: "public-clawhub"` とともに記載されます。
- `clean` または `suspicious` スキャンを持つ現在の GitHub バックエンドの Skills には、
  `sourceRef: "public-github"`、リポジトリ、コミット、パス、
  コンテンツハッシュ、およびアーカイブ URL を含む `_source_handoff.json` が含まれます。ClawHub でホストされているソースファイルは含まれません。
- 各 Skills には `_export_skill_meta.json` が含まれます。
- `_manifest.json` は常に ZIP ルートに含まれます。
- 個別の Skills またはファイルをエクスポートできなかった場合は、
  `_errors.json` が含まれます。

ヘッダー:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

オフライン分析用に、公開されている最新の Plugin リリースを一括エクスポートします。

認証:

- API トークンが必要です。

クエリパラメータ:

- `startDate`（必須）: Plugin の `updatedAt` に対する Unix ミリ秒単位の下限。
- `endDate`（必須）: Plugin の `updatedAt` に対する Unix ミリ秒単位の上限。
- `limit`（任意）: 整数（1-250）、デフォルトは `250`。
- `cursor`（任意）: 前のレスポンスから取得したページネーションカーソル。
- `family`（任意）: `code-plugin` または `bundle-plugin`。省略した場合は両方の
  Plugin ファミリーが対象になります。

レスポンス:

- 本文: ZIP アーカイブ。
- エクスポートされた各 Plugin のルートは `{family}/{packageName}/` です。
- エクスポートされた各 Plugin には、最新リリースの保存済みファイルが含まれます。
- Plugin ごとのエクスポートメタデータは、
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

コード Plugin およびバンドル Plugin パッケージを横断する、Plugin のみを対象とした検索。

クエリパラメータ:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数（1-100）
- `isOfficial`（任意）: `true` または `false`
- `category`（任意）: Plugin カテゴリフィルター。現在の値:
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

注記:

- `GET /api/v1/plugins` に記載されているレガシー v1 フィルターエイリアスも
  受け入れられます。
- カテゴリフィルタリングは、検索クエリの書き換えではなく、Plugin カテゴリのダイジェスト行に基づく
  実際の API フィルターです。
- 結果は関連度順で返され、現在はページネーションされません。
- Plugin 検索用のブラウザー UI の並べ替えコントロールは、読み込まれた関連度順の結果を並べ替え、
  現在の `/skills` の閲覧動作と一致します。

### `GET /api/v1/packages/{name}`

パッケージの詳細メタデータを返します。

注記:

- 統合カタログでは、Skills もこのルートを通じて解決できます。
- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは `404` を返します。

### `DELETE /api/v1/packages/{name}`

パッケージとすべてのリリースを論理削除します。

注記:

- パッケージ所有者、組織パブリッシャーの所有者／管理者、
  プラットフォームモデレーター、またはプラットフォーム管理者の API トークンが必要です。

### `GET /api/v1/packages/{name}/versions`

バージョン履歴を返します。

クエリパラメータ:

- `limit`（任意）: 整数（1–100）
- `cursor`（任意）: ページネーションカーソル

注記:

- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}`

ファイルメタデータ、互換性、検証、アーティファクトメタデータ、およびスキャンデータを含む、
パッケージの 1 つのバージョンを返します。

注記:

- `version.artifact.kind` は、旧方式のパッケージアーカイブでは `legacy-zip`、
  ClawPack ベースのリリースでは `npm-pack` です。
- ClawPack リリースには、npm 互換の `npmIntegrity`、`npmShasum`、および
  `npmTarballName` フィールドが含まれます。
- `version.sha256hash` は、旧クライアント向けの非推奨の互換性メタデータです。
  `/api/v1/packages/{name}/download` が返す正確な ZIP バイト列をハッシュします。
  最新のクライアントでは、正規のリリースアーティファクトを識別する
  `version.artifact.sha256` を使用してください。
- スキャンデータが存在する場合は、`version.vtAnalysis`、`version.llmAnalysis`、および `version.staticScan` が
  含まれます。
- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}/security`

インストールクライアント向けに、パッケージリリースの正確なセキュリティおよび信頼性の概要を返します。
これは、解決されたリリースをインストールできるかどうかを判断するための、公開 OpenClaw
利用インターフェースです。

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

- `package.name`、`package.displayName`、および `package.family` は、解決された
  レジストリパッケージを識別します。
- `release.releaseId`、`release.version`、および `release.createdAt` は、評価された
  正確なリリースを識別します。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum`、および `release.npmTarballName` は、リリースアーティファクトについて判明している場合に
  存在します。
- `trust.scanStatus` は、スキャナー入力と手動のリリースモデレーションから導出された実効的な信頼状態です。
- `trust.moderationState` は null 許容です。手動のリリースモデレーションが存在しない場合は
  `null` です。
- `trust.blockedFromDownload` はインストールのブロックシグナルです。この値が `true` の場合、
  OpenClaw およびその他のインストールクライアントは、スキャナーまたはモデレーションフィールドから
  ブロックルールを再導出するのではなく、インストールをブロックする必要があります。
- `trust.reasons` は、ユーザー向けおよび監査用の説明リストです。理由コードは、
  `manual:quarantined`、`scan:malicious`、`package:malicious` などの
  安定した簡潔な文字列です。
- `trust.pending` は、1 つ以上の信頼性入力がまだ完了待ちであることを意味します。
- `trust.stale` は、信頼性の概要が古い入力から計算されたことを意味し、
  高い確度で許可を判断する前に更新が必要なものとして扱う必要があります。

注記:

- このエンドポイントはバージョンを厳密に指定します。クライアントは、最新の
  パッケージメタデータを読み取っただけの時点ではなく、インストール対象のパッケージバージョンを
  解決した後に呼び出す必要があります。
- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは `404` を返します。
- このエンドポイントは、所有者／モデレーター向けのモデレーション
  エンドポイントよりも意図的に範囲を狭めています。公開するのはインストール判断と公開説明であり、
  報告者の身元、報告本文、非公開の証拠、または内部レビューの
  タイムラインではありません。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

パッケージバージョンの明示的なアーティファクトリゾルバーメタデータを返します。

注記:

- レガシーパッケージバージョンは、`legacy-zip` アーティファクトとレガシー ZIP
  `downloadUrl` を返します。
- ClawPack バージョンは、`npm-pack` アーティファクト、npm 整合性フィールド、
  `tarballUrl`、およびレガシー ZIP 互換 URL を返します。
- これは OpenClaw のリゾルバーインターフェースです。共有 URL からアーカイブ形式を
  推測する必要がなくなります。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

明示的なリゾルバーパスを通じて、バージョンアーティファクトをダウンロードします。

注記:

- ClawPack バージョンは、アップロードされた npm-pack の正確な `.tgz` バイトをストリーミングします。
- 従来の ZIP バージョンは `/api/v1/packages/{name}/download?version=` にリダイレクトします。
- ダウンロードのレートバケットを使用します。

### `GET /api/v1/packages/{name}/readiness`

OpenClaw が将来利用するために算出された準備状況を返します。

準備状況のチェック対象は次のとおりです。

- 公式チャネルのステータス
- 最新バージョンの可用性
- ClawPack npm-pack アーティファクトの可用性
- アーティファクトのダイジェスト
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
      "label": "ClawPack アーティファクト",
      "status": "fail",
      "message": "最新バージョンは従来の ZIP 形式のみです。"
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

公式 OpenClaw Plugin の移行行を一覧表示するモデレーター用エンドポイントです。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `phase`（任意）: `planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw`、または
  `all`（デフォルト）。
- `limit`（任意）: 整数（1-100）
- `cursor`（任意）: ページネーションカーソル

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

公式 Plugin の移行行を作成または更新する管理者用エンドポイントです。

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

- `bundledPluginId` は小文字に正規化され、安定した upsert キーとして使用されます。
- `packageName` は npm 名として正規化されます。計画段階の移行では、
  パッケージが存在しなくてもかまいません。
- これは移行の準備状況のみを追跡します。OpenClaw を変更したり、
  ClawPack を生成したりするものではありません。

### `GET /api/v1/packages/moderation/queue`

パッケージリリースのレビューキュー用のモデレーター／管理者エンドポイントです。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `status`（任意）: `open`（デフォルト）、`blocked`、`manual`、または `all`
- `limit`（任意）: 整数（1-100）
- `cursor`（任意）: ページネーションカーソル

ステータスの意味:

- `open`: 不審、悪意あり、保留中、隔離済み、失効済み、または報告済みのリリース。
- `blocked`: 隔離済み、失効済み、または悪意ありのリリース。
- `manual`: 手動のモデレーションオーバーライドが適用されたすべてのリリース。
- `all`: 手動オーバーライド、クリーンではないスキャン状態、またはパッケージ報告のいずれかがあるすべてのリリース。

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

モデレーターによるレビューのためにパッケージを報告します。報告はパッケージ単位であり、任意で
バージョンに関連付けられます。報告はモデレーションキューに追加されますが、それ自体では自動的に非表示にしたり、
ダウンロードをブロックしたりしません。アーティファクトを承認、隔離、または失効させるには、
モデレーターがリリースモデレーションを使用する必要があります。

認証:

- API トークンが必要です。

リクエスト:

```json
{ "reason": "不審なネイティブバイナリ", "version": "1.2.3" }
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

パッケージ報告を受け付けるモデレーター／管理者用エンドポイントです。

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
      "reason": "不審なネイティブバイナリ",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "報告者"
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

パッケージのモデレーション可視性を確認する所有者／モデレーター用エンドポイントです。

認証:

- パッケージ所有者、パブリッシャーのメンバー、モデレーター、または
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

パッケージ報告を解決または再オープンするモデレーター／管理者用エンドポイントです。

リクエスト:

```json
{
  "status": "confirmed",
  "note": "確認し、影響を受けるリリースを隔離しました。",
  "finalAction": "quarantine"
}
```

`note` は `confirmed` および `dismissed` では必須です。
`status` を `open` に戻す場合は省略できます。
確認済みの報告とともに `finalAction: "quarantine"` または
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

パッケージリリースをレビューするモデレーター／管理者用エンドポイントです。

リクエスト:

```json
{ "state": "quarantined", "reason": "不審なネイティブペイロード。" }
```

サポートされる状態:

- `approved`: 手動でレビューされ、許可されています。
- `quarantined`: フォローアップまでブロックされています。
- `revoked`: 以前に信頼されていたリリースがブロックされています。

隔離済みおよび失効済みのリリースでは、アーティファクトのダウンロードルートから `403` が返されます。
変更のたびに監査ログエントリが書き込まれます。

### `GET /api/v1/packages/{name}/file`

パッケージファイルの生のテキストコンテンツを返します。

クエリパラメーター:

- `path`（必須）
- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- ダウンロードバケットではなく、読み取りレートバケットを使用します。
- バイナリファイルでは `415` が返されます。
- ファイルサイズの上限: 200KB。
- 保留中の VirusTotal スキャンは読み取りをブロックしませんが、悪意ありのリリースは別の場所で非公開になる場合があります。
- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージでは `404` が返されます。

### `GET /api/v1/packages/{name}/download`

パッケージリリースの従来の決定論的 ZIP アーカイブをダウンロードします。

クエリパラメーター:

- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- Skills は `GET /api/v1/download` にリダイレクトします。
- Plugin／パッケージのアーカイブは、従来の OpenClaw クライアントが
  引き続き動作するように、`package/` ルートを持つ zip ファイルです。
- このルートは ZIP 専用のままです。ClawPack の `.tgz` ファイルはストリーミングしません。
- リゾルバーの整合性チェック用に、レスポンスには `ETag`、`Digest`、`X-ClawHub-Artifact-Type`、
  および `X-ClawHub-Artifact-Sha256` ヘッダーが含まれます。
- レジストリ専用のメタデータは、ダウンロードされるアーカイブに注入されません。
- 保留中の VirusTotal スキャンはダウンロードをブロックしませんが、悪意ありのリリースでは `403` が返されます。
- 呼び出し元が所有者でない場合、非公開パッケージでは `404` が返されます。

### `GET /api/npm/{package}`

ClawPack を基盤とするパッケージバージョンについて、npm 互換の packument を返します。

注記:

- アップロード済みの ClawPack npm-pack tarball があるバージョンのみが一覧表示されます。
- 従来の ZIP 専用バージョンは意図的に省略されます。
- `dist.tarball`、`dist.integrity`、および `dist.shasum` は npm 互換フィールドを使用するため、
  ユーザーは必要に応じて npm の参照先をミラーに設定できます。
- スコープ付きパッケージの packument は、`/api/npm/@scope/name` と npm の
  エンコードされた `/api/npm/@scope%2Fname` リクエストパスの両方をサポートします。

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ミラークライアント向けに、アップロードされた ClawPack tarball の正確なバイト列をストリーミングします。

注記:

- ダウンロードのレートバケットを使用します。
- ダウンロードヘッダーには、ClawHub SHA-256 に加えて npm の整合性／shasum メタデータが含まれます。
- モデレーションと非公開パッケージのアクセスチェックは引き続き適用されます。

### `GET /api/v1/resolve`

CLI がローカルフィンガープリントを既知のバージョンに対応付けるために使用します。

クエリパラメーター:

- `slug`（必須）
- `hash`（必須）: バンドルフィンガープリントの 64 文字の 16 進 sha256

レスポンス:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ホストされている Skill バージョンの ZIP をダウンロードします。または、`clean` か `suspicious` のスキャンがあり、
ホスト版が存在しない、現在 GitHub を基盤とする Skill について GitHub ソースへの引き継ぎ情報を返します。

クエリパラメーター:

- `slug`（必須）
- `version`（任意）：semver 文字列
- `tag`（任意）：タグ名（例：`latest`）

注記：

- `version` と `tag` のどちらも指定されていない場合、最新バージョンが使用されます。
- 論理削除されたバージョンは `410` を返します。
- GitHub をバックエンドとする skill の引き渡しでは、バイト列をプロキシまたはミラーリングしません。JSON レスポンスには
  `sourceRef: "public-github"`、`repo`、`commit`、`path`、`contentHash`、
  および `archiveUrl` が含まれます。スキャンおよび現在の状態はゲートであり、成功時の
  ペイロードメタデータには含まれません。
- ダウンロード統計は UTC 日ごとの一意な ID として集計されます（API トークンが有効な場合は `userId`、それ以外の場合は IP）。

## 認証エンドポイント（Bearer トークン）

すべてのエンドポイントで次の指定が必要です：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

トークンを検証し、ユーザーハンドルを返します。

### `POST /api/v1/skills`

新しいバージョンを公開します。

- 推奨：`payload` JSON と `files[]` BLOB を含む `multipart/form-data`。
- `files`（storageId ベース）を含む JSON ボディも受け付けます。
- 任意のペイロードフィールド：`ownerHandle`。指定されている場合、API はその
  パブリッシャーをサーバー側で解決し、実行者にパブリッシャーへのアクセス権があることを要求します。
- 任意のペイロードフィールド：`migrateOwner`。`ownerHandle` とともに `true` の場合、
  実行者が現在および移行先の両方のパブリッシャーで管理者または所有者であれば、
  既存の skill をその所有者へ移動できます。このオプトインがない場合、所有者の変更は
  拒否されます。

### `POST /api/v1/packages`

コード Plugin またはバンドル Plugin のリリースを公開します。

- Bearer トークン認証が必要です。
- `multipart/form-data` が必要です。
- 使用できるフォームフィールドは `payload`、複数指定可能な `files` BLOB、または 1 つの `clawpack`
  tarball 参照です。`clawpack` には `.tgz` BLOB、または
  アップロード URL フローから返されたストレージ ID を指定できます。ステージされたストレージ ID を公開する場合は、そのアップロード URL とともに返された
  `clawpackUploadTicket` も含める必要があります。
- `files` または `clawpack` のいずれか一方を使用し、同じリクエストで両方を使用してはなりません。
- JSON ボディ、および呼び出し元が指定した `payload.files` / `payload.artifact`
  メタデータは拒否されます。
- multipart による直接公開リクエストの上限は 18MB です。ClawPack tarball では、
  アップロード URL フローを使用して tarball の上限である 120MB までアップロードできます。
- 任意のペイロードフィールド：`ownerHandle`。指定されている場合、その所有者に代わって公開できるのは管理者のみです。

検証の要点：

- `family` は `code-plugin` または `bundle-plugin` でなければなりません。
- Plugin パッケージには `openclaw.plugin.json` が必要です。ClawPack `.tgz` のアップロードでは、
  `package/openclaw.plugin.json` にこれを含める必要があります。
- コード Plugin には、`package.json`、ソースリポジトリのメタデータ、ソースコミットの
  メタデータ、設定スキーマのメタデータ、`openclaw.compat.pluginApi`、および
  `openclaw.build.openclawVersion` が必要です。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
- `official` チャンネルに公開できるのは、`openclaw` 組織パブリッシャー、および現在の `openclaw` 組織メンバーの
  個人パブリッシャーのみです。
- 代理公開の場合も、公式チャンネルの利用資格は移行先の所有者アカウントに対して検証されます。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill を論理削除または復元します（所有者、モデレーター、または管理者）。

任意の JSON ボディ：

```json
{ "reason": "法的審査が完了するまでモデレーションのため保留。" }
```

指定されている場合、`reason` は skill のモデレーション注記として保存され、監査ログにコピーされます。
所有者が開始した論理削除では slug が 30 日間予約され、その後は別のパブリッシャーが
その slug を取得できます。この期限が適用される場合、削除レスポンスには `slugReservedUntil` が含まれます。
モデレーターまたは管理者による非表示、およびセキュリティ上の削除には、このような期限はありません。

削除レスポンス：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

ステータスコード：

- `200`：成功
- `401`：未認証
- `403`：禁止
- `404`：skill またはユーザーが見つかりません
- `500`：内部サーバーエラー

### `POST /api/v1/users/publisher`

管理者専用。指定されたハンドルの組織パブリッシャーが存在することを保証します。ハンドルがまだ
従来の共有ユーザーまたは個人パブリッシャーを指している場合、エンドポイントはまずそれを組織パブリッシャーへ移行します。
新しく作成する組織では `memberHandle` を指定します。操作を行う管理者はメンバーとして追加されません。
`memberRole` のデフォルトは `owner` です。

- ボディ：`{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- レスポンス：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

認証済みユーザーがセルフサービスで組織パブリッシャーを作成します。新しい組織パブリッシャーを作成し、
呼び出し元を所有者として追加します。このエンドポイントは既存のユーザーまたは個人ハンドルを移行せず、
パブリッシャーを信頼済みまたは公式としてマークしません。

- ボディ：`{ "handle": "opik", "displayName": "Opik" }`
- レスポンス：`{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ハンドルがすでにパブリッシャー、ユーザー、または個人パブリッシャーによって使用されている場合は `409` を返します。

### `POST /api/v1/users/reserve`

管理者専用。リリースを公開せずに、正当な所有者のためにルート slug とパッケージ名を予約します。
パッケージ名はリリース行を持たない非公開のプレースホルダーパッケージとなるため、同じ
所有者は後からその名前で実際のコード Plugin またはバンドル Plugin のリリースを公開できます。

- ボディ：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- レスポンス：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

管理者専用。Convex Auth のアカウント行を編集せずに、検証済みの代替 GitHub OAuth プリンシパル用として
個人パブリッシャーを復旧します。リクエストには、変更不可能な両方の GitHub
プロバイダーアカウント ID を指定する必要があります。変更可能なハンドルは、オペレーター向けのガードとしてのみ使用されます。

このエンドポイントのデフォルトはドライランです。復旧を適用するには、スタッフが両方の
GitHub プリンシパル間の継続性を個別に検証した後、`dryRun: false` と
`confirmIdentityVerified: true` が必要です。移行先ユーザーの現在の個人
パブリッシャーに skill、パッケージ、または GitHub skill ソースがある場合、復旧は安全側に倒して失敗します。
また、復旧では、復旧対象パブリッシャーの skill、skill slug エイリアス、パッケージ、パッケージインスペクターの警告、
および派生検索ダイジェスト行にある従来の `ownerUserId` フィールドも移行され、
直接所有者を参照するパスが新しいパブリッシャー権限と一致するようになります。復旧したハンドルに対する有効な保護ハンドルの
予約も代替ユーザーに再割り当てされるため、後続の
プロファイル同期によって以前のユーザーの競合する権限が復元されることはありません。各主要テーブルは、適用トランザクションごとに
100 行に制限されます。これを超える復旧では、先に再開可能な所有者移行を使用する必要があります。
GitHub skill ソースはパブリッシャー単位で管理されるため、書き換えられず、確認済みとして報告されます。

- ボディ：`{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- レスポンス：`{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### 所有者 slug 管理エンドポイント

- `POST /api/v1/skills/{slug}/rename`
  - ボディ：`{ "newSlug": "new-canonical-slug" }`
  - レスポンス：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - ボディ：`{ "targetSlug": "canonical-target-slug" }`
  - レスポンス：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注記：

- どちらのエンドポイントにも API トークン認証が必要で、skill の所有者のみ使用できます。
- `rename` は以前の slug をリダイレクトエイリアスとして保持します。
- `merge` は移行元の一覧を非表示にし、移行元の slug を移行先の一覧へリダイレクトします。

### 所有権移管エンドポイント

- `POST /api/v1/skills/{slug}/transfer`
  - ボディ：`{ "toUserHandle": "target_handle", "message": "optional" }`
  - レスポンス：`{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - レスポンス（承認、拒否、キャンセル）：`{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - レスポンス形式：`{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

ユーザーを禁止し、そのユーザーが所有する skill を物理削除します（モデレーターまたは管理者のみ）。

ボディ：

```json
{ "handle": "user_handle", "reason": "任意の禁止理由" }
```

または

```json
{ "userId": "users_...", "reason": "任意の禁止理由" }
```

レスポンス：

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ユーザーの禁止を解除し、対象となる skill を復元します（管理者のみ）。

ボディ：

```json
{ "handle": "user_handle", "reason": "任意の禁止解除理由" }
```

または

```json
{ "userId": "users_...", "reason": "任意の禁止解除理由" }
```

レスポンス：

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

禁止を解除したりコンテンツを復元したりせずに、既存の禁止に保存されている理由を変更します
（管理者のみ）。`dryRun` が `false` でない限り、デフォルトはドライランです。

ボディ：

```json
{ "handle": "user_handle", "reason": "一括公開スパム", "dryRun": true }
```

または

```json
{ "userId": "users_...", "reason": "一括公開スパム", "dryRun": false }
```

レスポンス：

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "マルウェアによる自動禁止",
  "nextReason": "一括公開スパム",
  "changed": true
}
```

### `POST /api/v1/users/role`

ユーザーのロールを変更します（管理者のみ）。

ボディ：

```json
{ "handle": "user_handle", "role": "moderator" }
```

または

```json
{ "userId": "users_...", "role": "admin" }
```

レスポンス：

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

ユーザーを一覧表示または検索します（管理者のみ）。

クエリパラメーター：

- `q`（任意）：検索クエリ
- `query`（任意）：`q` のエイリアス
- `limit`（任意）：最大結果数（デフォルト 20、最大 200）

レスポンス：

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "ユーザー",
      "name": "ユーザー",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

スター（ハイライト）を追加または削除します。どちらのエンドポイントも冪等です。

レスポンス：

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## 従来の CLI エンドポイント（非推奨）

古い CLI バージョン向けに引き続きサポートされています：

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

削除計画については `DEPRECATIONS.md` を参照してください。

`POST /api/cli/upload-url` は `uploadUrl` と `uploadTicket` を返します。ClawPack tarball をステージする
パッケージ公開では、生成されたストレージ ID を `clawpack` として、
返されたチケットを `clawpackUploadTicket` として送信する必要があります。

## レジストリ検出（`/.well-known/clawhub.json`）

CLI はサイトからレジストリおよび認証設定を検出できます：

- `/.well-known/clawhub.json`（JSON、推奨）
- `/.well-known/clawdhub.json`（従来形式）

スキーマ：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

セルフホストする場合は、このファイルを配信してください（または `CLAWHUB_REGISTRY` を明示的に設定します。従来形式は `CLAWDHUB_REGISTRY`）。
