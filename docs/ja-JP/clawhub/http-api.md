---
read_when:
    - エンドポイントの追加／変更
    - CLI ↔ レジストリ間のリクエストのデバッグ
summary: HTTP API リファレンス（公開エンドポイント + CLI エンドポイント + 認証）。
x-i18n:
    generated_at: "2026-07-12T21:22:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

ベース URL: `https://clawhub.ai`（デフォルト）。

すべての v1 パスは `/api/v1/...` 配下にあります。
レガシーの `/api/...` と `/api/cli/...` は互換性のために維持されています（`DEPRECATIONS.md` を参照）。
OpenAPI: `/api/v1/openapi.json`。

## 公開カタログの再利用

サードパーティのディレクトリは、公開読み取りエンドポイントを使用して ClawHub skills の一覧表示や検索を行えます。結果をキャッシュし、`429`/`Retry-After` に従い、ユーザーを正規の ClawHub リスト（`https://clawhub.ai/<owner>/skills/<slug>`）へ誘導し、ClawHub がサードパーティサイトを推奨していると受け取られる表現は避けてください。非表示、非公開、またはモデレーションによってブロックされたコンテンツを、公開 API の範囲外でミラーリングしないでください。

Web の slug ショートカットはレジストリファミリーを横断して解決されますが、API クライアントはルートの優先順位を再構築せず、読み取りエンドポイントから返される正規 URL を使用してください。

## レート制限

適用モデル:

- 匿名リクエスト: IP ごとに適用されます。
- 認証済みリクエスト（有効な Bearer トークン）: ユーザーバケットごとに適用されます。
- トークンがないか無効な場合、IP ベースの適用にフォールバックします。
- 認証が必要な書き込みエンドポイントでは、サーバーが理由を把握している場合、単なる `Unauthorized` を返すべきではありません。トークンの欠如、無効化または取り消されたトークン、削除、禁止、または無効化されたアカウントには、それぞれ対処可能なテキストを返し、CLI クライアントがブロックされた理由をユーザーに伝えられるようにしてください。

- 読み取り: IP ごとに 3000/分、キーごとに 12000/分
- 書き込み: IP ごとに 300/分、キーごとに 3000/分
- ダウンロード: IP ごとに 1200/分、キーごとに 6000/分（ダウンロードエンドポイント）

ヘッダー:

- レガシー互換性: `X-RateLimit-Limit`、`X-RateLimit-Reset`
- 標準化済み: `RateLimit-Limit`、`RateLimit-Reset`
- `429` の場合: `X-RateLimit-Remaining: 0` および `RateLimit-Remaining: 0`
- `429` の場合: `Retry-After`

ヘッダーのセマンティクス:

- `X-RateLimit-Reset`: 絶対 Unix エポック秒
- `RateLimit-Reset`: リセットまでの秒数（遅延）
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 存在する場合は、正確な残り割り当て量。
  シャーディングされた成功リクエストでは、概算のグローバル値を返す代わりに、このヘッダーを省略します。
- `Retry-After`: `429` の場合に再試行まで待機する秒数（遅延）

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

- `Retry-After` が存在する場合、再試行前に指定された秒数だけ待機してください。
- 再試行の同期を避けるため、ジッター付きバックオフを使用してください。
- `Retry-After` がない場合は、`RateLimit-Reset` にフォールバックしてください（または `X-RateLimit-Reset` から計算してください）。

IP の取得元:

- デプロイメントで信頼された転送ヘッダーが明示的に有効化されている場合に限り、`cf-connecting-ip` を含む信頼されたクライアント IP ヘッダーを使用します。
- ClawHub はエッジでクライアント IP を識別するために、信頼された転送ヘッダーを使用します。
- 信頼できるクライアント IP がない場合、匿名リクエストではレート制限種別のみをスコープとするフォールバックバケットを使用します。これらのフォールバックバケットには、呼び出し元が指定したパス、slug、パッケージ名、バージョン、クエリ文字列、その他のアーティファクトパラメーターは含まれません。

## エラーレスポンス

公開 v1 エラーレスポンスは、`content-type: text/plain; charset=utf-8` のプレーンテキストです。
これには、検証失敗（`400`）、公開リソースの欠如（`404`）、認証および権限の失敗（`401`/`403`）、レート制限（`429`）、ブロックされたダウンロードが含まれます。クライアントはレスポンス本文を人間が読める文字列として読み取る必要があります。未知のクエリパラメーターは互換性のために無視されますが、認識されるクエリパラメーターに無効な値が指定された場合は `400` が返されます。

## 公開エンドポイント（認証不要）

### `GET /api/v1/search`

クエリパラメーター:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数
- `highlightedOnly`（任意）: 注目 skills のみに絞り込むには `true`
- `nonSuspiciousOnly`（任意）: 疑わしい（`flagged.suspicious`）skills を非表示にするには `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` のレガシーエイリアス

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

- 結果は関連度順（埋め込み類似度 + slug/名前の完全一致トークンへのブースト + 小さな人気度事前分布）で返されます。
- 関連度は人気度より強く評価されます。slug または表示名トークンの正確な一致は、エンゲージメントがはるかに高い緩やかな一致より上位になる場合があります。
- ASCII テキストは単語と句読点の境界でトークン化されます。たとえば、`personal-map` には独立した `map` トークンが含まれ、`amap-jsapi-skill` には `amap`、`jsapi`、`skill` が含まれます。そのため、`map` を検索すると、`personal-map` は `amap-jsapi-skill` より強い字句一致になります。
- 人気度は対数スケールで上限が設定されます。エンゲージメントの高い skills でも、クエリテキストとの一致が弱い場合は順位が低くなることがあります。
- 疑わしい状態または非表示のモデレーション状態にある skill は、呼び出し元のフィルターと現在のモデレーション状態によっては公開検索から除外される場合があります。

公開者向けの検索可能性ガイダンス:

- ユーザーが実際に検索する用語を、表示名、概要、タグに含めてください。独立した slug トークンは、それが維持したい安定した識別子でもある場合にのみ使用してください。
- 新しい slug が長期的により適切な正規名でない限り、1 つのクエリを狙うためだけに slug を変更しないでください。古い slug はリダイレクトエイリアスになりますが、正規 URL、表示される slug、今後の検索ダイジェストでは新しい slug が使用されます。
- 名前変更エイリアスにより、古い URL とレジストリ経由で解決されるインストールは引き続き解決できますが、検索順位は名前変更後にインデックスされた正規の skill メタデータに基づきます。既存の統計は skill に保持されます。
- skill が予期せず表示されない場合は、順位に関連するメタデータを変更する前に、ログインした状態で `clawhub inspect @owner/slug` を使用して、まずモデレーション状態を確認してください。

### `GET /api/v1/skills`

クエリパラメーター:

- `limit`（任意）: 整数（1–200）
- `cursor`（任意）: `trending` 以外の並べ替えで使用するページネーションカーソル
- `sort`（任意）: `updated`（デフォルト）、`recommended`（エイリアス: `default`）、`createdAt`（エイリアス: `newest`）、`downloads`、`stars`（エイリアス: `rating`）、レガシーのインストール用エイリアス `installsCurrent`/`installs`/`installsAllTime` は `downloads` にマッピング、`trending`
- `nonSuspiciousOnly`（任意）: 疑わしい（`flagged.suspicious`）skills を非表示にするには `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` のレガシーエイリアス

無効な `sort` 値は `400` を返します。

注記:

- `recommended` はエンゲージメントと新しさのシグナルを使用します。
- `trending` は過去 7 日間のインストール数（テレメトリベース）で順位付けします。
- `createdAt` は新規 skill のクロールで安定しています。`updated` は既存の skills が再公開されると変化します。
- `nonSuspiciousOnly=true` の場合、ページ取得後に疑わしい skills が除外されるため、カーソルベースの並べ替えでは 1 ページあたりの項目数が `limit` より少なくなる場合があります。
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

- 所有者による名前変更またはマージフローで作成された古い slug は、正規の skill に解決されます。
- `metadata.os`: skill の frontmatter で宣言された OS 制限（例: `["macos"]`、`["linux"]`）。宣言されていない場合は `null`。
- `metadata.systems`: Nix システムターゲット（例: `["aarch64-darwin", "x86_64-linux"]`）。宣言されていない場合は `null`。
- skill にプラットフォームメタデータがない場合、`metadata` は `null` です。
- `moderation` は、skill にフラグが付いている場合、または所有者が閲覧している場合にのみ含まれます。

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

- 所有者とモデレーターは、非表示の skills のモデレーション詳細にアクセスできます。
- 公開呼び出し元が `200` を受け取れるのは、すでにフラグが付けられた表示可能な skills に対してのみです。
- 公開呼び出し元向けの証拠は編集され、生のスニペットが含まれるのは所有者またはモデレーター向けのみです。

### `POST /api/v1/skills/{slug}/report`

モデレーターによるレビューのために skill を報告します。報告は skill 単位で、任意でバージョンに関連付けられ、skill 報告キューに送られます。

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

skill 報告を受け付けるためのモデレーター/管理者用エンドポイントです。

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
      "reason": "疑わしいインストール手順",
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

skill 報告を解決または再開するためのモデレーター/管理者用エンドポイントです。

リクエスト:

```json
{ "status": "confirmed", "note": "レビューを行い、影響を受けたバージョンを非表示にしました。", "finalAction": "hide" }
```

`note` は `confirmed` と `dismissed` では必須です。`status` を `open` に戻す場合は省略できます。同じ監査可能なワークフローで skill を非表示にするには、トリアージ済みの報告に `finalAction: "hide"` を渡してください。

### `GET /api/v1/skills/{slug}/versions`

クエリパラメーター:

- `limit`（任意）: 整数
- `cursor`（任意）: ページネーションカーソル

### `GET /api/v1/skills/{slug}/versions/{version}`

バージョンメタデータとファイル一覧を返します。

- `version.security` には、利用可能な場合、正規化されたスキャン検証状態とスキャナーの詳細（VirusTotal + LLM）が含まれます。

### `GET /api/v1/skills/{slug}/scan`

skill バージョンのセキュリティスキャン検証詳細を返します。

クエリパラメーター:

- `version`（任意）: 特定のバージョン文字列。
- `tag`（任意）: タグ付きバージョンを解決します（例: `latest`）。

注記:

- `version` と `tag` のどちらも指定されていない場合は、最新バージョンを使用します。
- 正規化された検証ステータスと、スキャナー固有の詳細情報が含まれます。
- `security.hasScanResult` が `true` になるのは、スキャナーが確定的な判定（`clean`、`suspicious`、または `malicious`）を生成した場合のみです。
- `moderation` は、最新バージョンから導出された現在のスキルレベルのモデレーションスナップショットです。
- 過去のバージョンを照会する場合、`moderation` と `security` を同じバージョンのコンテキストとして扱う前に、`moderation.matchesRequestedVersion` と `moderation.sourceVersion` を確認してください。

### `POST /api/v1/skills/-/scan`

新しい ClawScan ジョブを送信するための認証済みエンドポイントです。

ローカルアップロードのスキャンはサポートされなくなりました。
`multipart/form-data` または `{ "source": { "kind": "upload" } }` を使用するリクエストは `410` を返します。

公開済みスキャンでは JSON を使用します。

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

注記:

- スキャン要求のペイロードとダウンロード可能なレポートは、保持期間の終了後にスキャン要求ストアから削除されます。
- 公開済みスキャンには、所有者または公開者としての管理アクセス権、あるいはプラットフォームのモデレーターまたは管理者権限が必要です。
- 公開済みスキャンの結果が書き戻されるのは、`update: true` であり、かつスキャンが正常に完了した場合のみです。
- レスポンスは `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` を含む `202` です。
- スキャンジョブは非同期です。手動スキャン要求は通常の公開処理やバックフィル処理より優先されますが、完了は引き続きワーカーの空き状況に左右されます。

### `GET /api/v1/skills/-/scan/{scanId}`

送信済みスキャン用の認証済みポーリングエンドポイント。

- キュー待機中／実行中／成功／失敗のステータスを返します。
- キュー待機中は `queue.queuedAhead` と `queue.position` を返すため、クライアントはリクエストより前にある優先手動スキャンの件数を表示できます。キューが非常に大きい場合は上限が適用され、`queuedAheadIsEstimate: true` として報告されます。
- 利用可能な場合、`report` には `clawscan`、`skillspector`、`staticAnalysis`、`virustotal` の各セクションが含まれます。
- 失敗したスキャンジョブは、`lastError` とともに `status: "failed"` を返します。

### `GET /api/v1/skills/-/scan/{scanId}/download`

認証済みレポートアーカイブエンドポイント。

- スキャンが成功済みである必要があります。終了状態でないスキャンは `409` を返します。
- `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、`README.md` を含む ZIP を返します。

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

送信済みバージョン用の、認証済み保存レポートアーカイブエンドポイント。

- Skills または Plugin に対する所有者／公開者の管理アクセス権、あるいはプラットフォームのモデレーター／管理者権限が必要です。
- ブロックまたは非表示にされたバージョンを含め、送信された正確なバージョンの保存済みスキャン結果を返します。
- `kind` のデフォルトは `skill` です。Plugin／パッケージのスキャンには `kind=plugin` を使用します。
- スキャンリクエストのダウンロードと同じ構成の ZIP を返します。

### `POST /api/v1/skills/-/scan/batch`

管理者専用の正規バッチ再スキャンルートです。従来の `POST /api/v1/skills/-/rescan-batch` と同じペイロード形式を受け付けます。

### `POST /api/v1/skills/-/scan/batch/status`

管理者専用の正規バッチステータスルートです。`{ "jobIds": ["..."] }` を受け付け、従来の `POST /api/v1/skills/-/rescan-batch/status` と同じ集計カウンターを返します。

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` が使用する Skill Card 検証エンベロープを返します。

クエリパラメーター:

- `version`（任意）: 特定のバージョン文字列。
- `tag`（任意）: タグ付きバージョンを解決します（例: `latest`）。

注記:

- 選択したバージョンに生成済みの Skill Card があり、モデレーションによってマルウェアとしてブロックされておらず、ClawScan 検証で問題がない場合にのみ、`ok` は `true` になります。
- シェル自動化でネストされたラッパーを展開せずに読み取れるよう、Skill の識別情報、公開者の識別情報、選択したバージョンのメタデータは、エンベロープのトップレベルフィールド（`slug`、`displayName`、`publisherHandle`、`version`、`resolvedFrom`、`tag`、`createdAt`）にあります。
- `security` はトップレベルの ClawScan/セキュリティ判定です。自動化では、`ok`、`decision`、`reasons`、`security.status` を判定基準として使用してください。
- `security.signals` には、`staticScan`、`virusTotal`、`skillSpector` などのスキャナーによる補足証拠が含まれます。
- `security.signals.dependencyRegistry` は v1 レスポンスとの互換性のために維持されていますが、依存関係レジストリ存在確認スキャナーは廃止されており、このキーは常に `null` です。
- `provenance` は、公開またはインポート時に ClawHub が GitHub のリポジトリ/ref/コミット/パスを解決して保存した場合にのみ `server-resolved-github-import` になり、それ以外の場合は `unavailable` になります。

### `POST /api/v1/skills/-/security-verdicts`

指定された Skill の正確なバージョンについて、現在の簡潔なセキュリティ判定を返します。この
コレクションエンドポイントは、OpenClaw Control UI など、表示する必要があるインストール済み
ClawHub Skill のバージョンをすでに把握しているクライアントを対象としています。

リクエスト:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

注記:

- `items` には、1～100 個の一意な `{ slug, version }` ペアを含める必要があります。
- 結果は項目ごとに返されます。1 つの Skill またはバージョンが見つからなくても、レスポンス全体は失敗しません。
- レスポンスにはセキュリティ情報のみが含まれます。Skill Card のデータ、生成済みカードのステータス、アーティファクトのファイル一覧、スキャナーの詳細なペイロードは含まれません。
- `security.signals` にはステータスレベルの補足証拠のみが含まれます。スキャナーの詳細情報すべてを確認するには、`/scan` または ClawHub のセキュリティ監査ページを使用してください。
- `security.signals.dependencyRegistry` は v1 レスポンスとの互換性のために維持されていますが、依存関係レジストリ存在確認スキャナーは廃止されており、このキーは常に `null` です。
- Skill Card が存在しなくても、このエンドポイントの `ok`、`decision`、`reasons` には影響しません。カードの内容が必要な場合、クライアントはインストール済みの `skill-card.md` をローカルで読み取る必要があります。
- 単一 Skill の Skill Card 検証エンベロープが必要な場合は `/verify`、生成済みカードの Markdown が必要な場合は `/card`、スキャナーの詳細データが必要な場合は `/scan` を使用してください。

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

未加工のテキストコンテンツを返します。

クエリパラメータ:

- `path`（必須）
- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新バージョンを使用します。
- ファイルサイズ上限: 200KB。

### `GET /api/v1/packages`

以下を対象とする統合カタログエンドポイント:

- Skills
- コード Plugin
- バンドル Plugin

クエリパラメータ:

- `limit`（任意）: 整数（1–100）
- `cursor`（任意）: ページネーションカーソル
- `family`（任意）: `skill`、`code-plugin`、または`bundle-plugin`
- `channel`（任意）: `official`、`community`、または`private`
- `isOfficial`（任意）: `true`または`false`
- `sort`（任意）: `updated`（デフォルト）、`recommended`、`trending`、`downloads`、レガシーエイリアス`installs`
- `category`（任意）: Pluginカテゴリフィルター。リクエストの対象が
  Pluginパッケージ（`/api/v1/plugins`、`/api/v1/code-plugins`、
  `/api/v1/bundle-plugins`、または`family=code-plugin`/`family=bundle-plugin`
  を指定したパッケージエンドポイント）に限定されている場合にのみサポートされます。管理対象カテゴリと
  レガシーv1フィルターエイリアスについては、`GET /api/v1/plugins`に記載されています。

注記:

- `family`、`channel`、`isOfficial`、`featured`、
  `highlightedOnly`、または`sort`に無効な値を指定すると`400`が返されます。不明なクエリパラメータは無視されます。
- `GET /api/v1/code-plugins`と`GET /api/v1/bundle-plugins`は、引き続きファミリー固定のエイリアスです。
- Skillsエントリは引き続きSkillsレジストリを基盤とし、`POST /api/v1/skills`を通じてのみ公開できます。
- `POST /api/v1/packages`は、引き続きコードPluginおよびバンドルPluginのリリース専用です。
- 匿名の呼び出し元には、公開パッケージチャンネルのみ表示されます。
- 認証済みの呼び出し元は、一覧および検索結果で、自身が所属する公開元の非公開パッケージを表示できます。
- `channel=private`では、認証済みの呼び出し元が読み取り可能なパッケージのみ返されます。

### `GET /api/v1/packages/search`

SkillsとPluginパッケージを横断する統合カタログ検索。

クエリパラメータ:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数（1–100）
- `family`（任意）: `skill`、`code-plugin`、または`bundle-plugin`
- `channel`（任意）: `official`、`community`、または`private`
- `isOfficial`（任意）: `true`または`false`
- `category`（任意）: Pluginカテゴリフィルター。リクエストの対象が
  Pluginパッケージに限定されている場合にのみサポートされます。管理対象カテゴリとレガシーv1
  フィルターエイリアスについては、`GET /api/v1/plugins`に記載されています。

注記:

- `family`、`channel`、`isOfficial`、`featured`、または
  `highlightedOnly`に無効な値を指定すると`400`が返されます。不明なクエリパラメータは無視されます。
- 匿名の呼び出し元には、公開パッケージチャンネルのみ表示されます。
- 認証済みの呼び出し元は、自身が所属する公開元の非公開パッケージを検索できます。
- `channel=private`では、認証済みの呼び出し元が読み取り可能なパッケージのみ返されます。

### `GET /api/v1/plugins`

コードPluginとバンドルPluginのパッケージを横断する、Plugin専用のカタログ閲覧。

クエリパラメータ:

- `limit`（任意）: 整数（1-100）
- `cursor`（任意）: ページネーションカーソル
- `isOfficial`（任意）: `true`または`false`
- `sort`（任意）: `recommended`（デフォルト）、`trending`、`downloads`、`updated`、レガシーエイリアス`installs`
- `category`（任意）: Pluginカテゴリフィルター。現在の値:
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

レガシーv1フィルターエイリアスは、引き続き読み取りエンドポイントで使用できます:

- `mcp-tooling`、`data`、`automation`は`tools`に解決されます。
- `observability`と`deployment`は`gateway`に解決されます。
- `dev-tools`は`runtime`に解決されます。

`trending`は7日間のインストール数／ダウンロード数ランキングであり、累計値は使用しません。
統合`/api/v1/packages`エンドポイントではPluginのみが対象です。Skillsカタログには
`/api/v1/skills?sort=trending`を使用してください。

レガシーエイリアスは、保存されるカテゴリ値または作成者が宣言するカテゴリ値としては使用できません。

### `GET /api/v1/skills/export`

オフライン分析向けに、最新の公開Skillsを一括エクスポートします。

認証:

- APIトークンが必要です。

クエリパラメータ:

- `startDate`（必須）: Skillsの`updatedAt`に対するUnixミリ秒単位の下限。
- `endDate`（必須）: Skillsの`updatedAt`に対するUnixミリ秒単位の上限。
- `limit`（任意）: 整数（1-250）、デフォルトは`250`。
- `cursor`（任意）: 前回のレスポンスのページネーションカーソル。

レスポンス:

- 本文: ZIPアーカイブ。
- エクスポートされた各Skillsのルートは`{publisher}/{slug}/`です。
- ホスト型Skillsには、保存されている最新バージョンのファイルが含まれ、
  `_manifest.json`に`sourceRef: "public-clawhub"`として記載されます。
- `clean`または`suspicious`のスキャン結果を持つ、現在のGitHubベースのSkillsには、
  `sourceRef: "public-github"`、リポジトリ、コミット、パス、
  コンテンツハッシュ、アーカイブURLを含む`_source_handoff.json`が含まれます。ClawHubでホストされているソースファイルは含まれません。
- 各Skillsには`_export_skill_meta.json`が含まれます。
- `_manifest.json`は常にZIPのルートに含まれます。
- 個別のSkillsまたはファイルをエクスポートできなかった場合は、
  `_errors.json`が含まれます。

ヘッダー:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

オフライン分析用に、公開されている最新のPluginリリースを一括エクスポートします。

認証:

- APIトークンが必要です。

クエリパラメーター:

- `startDate`（必須）: Pluginの`updatedAt`に対するUnixミリ秒単位の下限。
- `endDate`（必須）: Pluginの`updatedAt`に対するUnixミリ秒単位の上限。
- `limit`（任意）: 整数（1-250）。デフォルトは`250`。
- `cursor`（任意）: 前のレスポンスから取得したページネーションカーソル。
- `family`（任意）: `code-plugin`または`bundle-plugin`。省略した場合は両方の
  Pluginファミリーが対象になります。

レスポンス:

- 本文: ZIPアーカイブ。
- エクスポートされた各Pluginは`{family}/{packageName}/`をルートとします。
- エクスポートされた各Pluginには、最新リリースの保存済みファイルが含まれます。
- Pluginごとのエクスポートメタデータは
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`に保存されます。
- `_manifest.json`は常にZIPルートに含まれます。
- 個々のPluginまたはファイルをエクスポートできなかった場合は、
  `_errors.json`が含まれます。

ヘッダー:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-pluginおよびbundle-pluginパッケージを横断するPlugin専用検索です。

クエリパラメーター:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数（1-100）
- `isOfficial`（任意）: `true`または`false`
- `category`（任意）: Pluginカテゴリーフィルター。現在の値:
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

注記:

- `GET /api/v1/plugins`で説明されている従来のv1フィルターエイリアスも
  使用できます。
- カテゴリーフィルタリングは、Pluginカテゴリーダイジェスト行に基づく実際のAPIフィルターであり、
  検索クエリの書き換えではありません。
- 結果は関連度順で返され、現在はページネーションされません。
- Plugin検索のブラウザーUI並べ替えコントロールは、読み込まれた関連度順の結果を並べ替えます。
  これは現在の`/skills`閲覧動作と一致します。

### `GET /api/v1/packages/{name}`

パッケージの詳細メタデータを返します。

注記:

- 統合カタログでは、Skillsもこのルートを通じて解決できます。
- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは`404`を返します。

### `DELETE /api/v1/packages/{name}`

パッケージとすべてのリリースを論理削除します。

注記:

- パッケージ所有者、組織パブリッシャーの所有者または管理者、プラットフォームモデレーター、
  あるいはプラットフォーム管理者のAPIトークンが必要です。

### `GET /api/v1/packages/{name}/versions`

バージョン履歴を返します。

クエリパラメーター:

- `limit`（任意）: 整数（1–100）
- `cursor`（任意）: ページネーションカーソル

注記:

- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは`404`を返します。

### `GET /api/v1/packages/{name}/versions/{version}`

ファイルメタデータ、互換性、検証、アーティファクトメタデータ、およびスキャンデータを含む、
1つのパッケージバージョンを返します。

注記:

- `version.artifact.kind`は、旧方式のパッケージアーカイブの場合は`legacy-zip`、
  ClawPackベースのリリースの場合は`npm-pack`です。
- ClawPackリリースには、npm互換の`npmIntegrity`、`npmShasum`、および
  `npmTarballName`フィールドが含まれます。
- `version.sha256hash`は、旧クライアント向けの非推奨の互換性メタデータです。
  `/api/v1/packages/{name}/download`から返される正確なZIPバイトをハッシュします。
  最新のクライアントでは、正規のリリースアーティファクトを識別する
  `version.artifact.sha256`を使用してください。
- スキャンデータが存在する場合、`version.vtAnalysis`、`version.llmAnalysis`、
  および`version.staticScan`が含まれます。
- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは`404`を返します。

### `GET /api/v1/packages/{name}/versions/{version}/security`

インストールクライアント向けに、正確なパッケージリリースのセキュリティおよび信頼性の概要を返します。
これは、解決済みリリースをインストールできるかどうかを判断するための、
OpenClawの公開利用インターフェースです。

認証:

- 公開読み取りエンドポイントです。所有者、パブリッシャー、モデレーター、または管理者の
  トークンは必要ありません。

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

- `package.name`、`package.displayName`、および`package.family`は、
  解決されたレジストリパッケージを識別します。
- `release.releaseId`、`release.version`、および`release.createdAt`は、
  評価された正確なリリースを識別します。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum`、および`release.npmTarballName`は、リリースアーティファクトについて
  判明している場合に存在します。
- `trust.scanStatus`は、スキャナー入力と手動リリースモデレーションから導出された
  実効的な信頼ステータスです。
- `trust.moderationState`はnull許容です。手動リリースモデレーションが存在しない場合は
  `null`です。
- `trust.blockedFromDownload`はインストールブロックシグナルです。OpenClawおよびその他の
  インストールクライアントは、スキャナーまたはモデレーションフィールドからブロックルールを
  再導出するのではなく、この値が`true`の場合にインストールをブロックしてください。
- `trust.reasons`は、ユーザー向けおよび監査用の説明リストです。理由コードは、
  `manual:quarantined`、`scan:malicious`、`package:malicious`などの
  安定した簡潔な文字列です。
- `trust.pending`は、1つ以上の信頼性入力がまだ完了待ちであることを意味します。
- `trust.stale`は、信頼性の概要が古い入力から算出されており、
  高い確信度で許可を判断する前に更新が必要として扱うべきことを意味します。

注記:

- このエンドポイントはバージョンを厳密に指定します。クライアントは最新のパッケージメタデータを
  読み取った直後ではなく、インストールする予定のパッケージバージョンを解決した後に呼び出してください。
- 呼び出し元が所有パブリッシャーを読み取れない場合、非公開パッケージは`404`を返します。
- このエンドポイントは、所有者またはモデレーター向けのモデレーションエンドポイントよりも、
  意図的に範囲を限定しています。インストール判断と公開説明を公開しますが、
  報告者のID、報告本文、非公開の証拠、または内部レビューのタイムラインは公開しません。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

パッケージバージョンの明示的なアーティファクトリゾルバーメタデータを返します。

注記:

- 従来のパッケージバージョンは、`legacy-zip`アーティファクトと従来のZIP
  `downloadUrl`を返します。
- ClawPackバージョンは、`npm-pack`アーティファクト、npm整合性フィールド、
  `tarballUrl`、および従来のZIP互換URLを返します。
- これはOpenClawのリゾルバーインターフェースであり、共有URLからアーカイブ形式を
  推測する必要がなくなります。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

明示的なリゾルバーパスを通じてバージョンアーティファクトをダウンロードします。

注記:

- ClawPackバージョンは、アップロードされた正確なnpm-packの`.tgz`バイトをストリーミングします。
- 従来のZIPバージョンは`/api/v1/packages/{name}/download?version=`にリダイレクトします。
- ダウンロード用レートバケットを使用します。

### `GET /api/v1/packages/{name}/readiness`

将来のOpenClaw利用に向けて算出された準備状況を返します。

準備状況のチェック対象:

- 公式チャネルステータス
- 最新バージョンの可用性
- ClawPack npm-packアーティファクトの可用性
- アーティファクトダイジェスト
- ソースリポジトリとコミットの来歴
- OpenClaw互換性メタデータ
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
      "label": "ClawPackアーティファクト",
      "status": "fail",
      "message": "最新バージョンは従来のZIPのみです。"
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

公式OpenClaw Pluginの移行行を一覧表示するためのモデレーターエンドポイントです。

認証:

- モデレーターまたは管理者ユーザーのAPIトークンが必要です。

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
      "blockers": ["ClawPackがありません"],
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

公式Plugin移行行を作成または更新するための管理者エンドポイントです。

認証:

- 管理者ユーザーのAPIトークンが必要です。

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
  "blockers": ["ClawPackがありません"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "パブリッシャーによるアップロードを待機中"
}
```

注記:

- `bundledPluginId`は小文字に正規化され、安定したupsertキーになります。
- `packageName`はnpm名として正規化されます。計画段階の移行では、パッケージが存在しない場合があります。
- これは移行準備状況のみを追跡します。OpenClawを変更したり、ClawPackを生成したりはしません。

### `GET /api/v1/packages/moderation/queue`

パッケージリリースのレビューキュー用モデレーター・管理者エンドポイントです。

認証:

- モデレーターまたは管理者ユーザーのAPIトークンが必要です。

クエリパラメーター:

- `status`（任意）: `open`（デフォルト）、`blocked`、`manual`、または`all`
- `limit`（任意）: 整数（1-100）
- `cursor`（任意）: ページネーションカーソル

ステータスの意味:

- `open`: 疑わしい、悪意のある、保留中、隔離済み、失効済み、または報告済みのリリース。
- `blocked`: 隔離済み、失効済み、または悪意のあるリリース。
- `manual`: 手動モデレーションによる上書きがあるリリース。
- `all`: 手動上書き、クリーンではないスキャン状態、またはパッケージ報告があるリリース。

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
      "moderationReason": "手動レビュー",
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
バージョンに関連付けられます。報告はモデレーションキューに追加されますが、それ自体で自動的に非表示にしたり、
ダウンロードをブロックしたりはしません。モデレーターはリリースモデレーションを使用して、
アーティファクトを承認、隔離、または失効させる必要があります。

認証:

- APIトークンが必要です。

リクエスト:

```json
{ "reason": "疑わしいネイティブバイナリ", "version": "1.2.3" }
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

パッケージ報告を受け付けるモデレーター/管理者向けエンドポイント。

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

パッケージのモデレーション情報を表示するための所有者/モデレーター向けエンドポイント。

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

パッケージ報告を解決または再オープンするためのモデレーター/管理者向けエンドポイント。

リクエスト:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` および `dismissed` では `note` が必須です。`status` を
`open` に戻す場合は省略できます。確認済みの報告に
`finalAction: "quarantine"` または `finalAction: "revoke"` を渡すと、
同じ監査可能なワークフロー内でリリースのモデレーションを適用できます。

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

パッケージリリースをレビューするためのモデレーター/管理者向けエンドポイント。

リクエスト:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

サポートされる状態:

- `approved`: 手動レビュー済みで許可されています。
- `quarantined`: フォローアップ待ちのためブロックされています。
- `revoked`: 以前信頼されていたリリースが、その後ブロックされています。

隔離または取り消されたリリースに対するアーティファクトのダウンロードルートは `403` を返します。
すべての変更について監査ログエントリが書き込まれます。

### `GET /api/v1/packages/{name}/file`

パッケージファイルの生のテキストコンテンツを返します。

クエリパラメーター:

- `path`（必須）
- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- ダウンロード用バケットではなく、読み取り用レートバケットを使用します。
- バイナリファイルは `415` を返します。
- ファイルサイズ上限: 200KB。
- 保留中の VirusTotal スキャンは読み取りをブロックしません。ただし、悪意のあるリリースは別の箇所で引き続き提供が停止される場合があります。
- 非公開パッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き、`404` を返します。

### `GET /api/v1/packages/{name}/download`

パッケージリリースの従来の決定論的 ZIP アーカイブをダウンロードします。

クエリパラメーター:

- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- Skills は `GET /api/v1/download` にリダイレクトされます。
- 古い OpenClaw クライアントが引き続き動作するよう、Plugin/パッケージアーカイブは
  `package/` をルートとする zip ファイルです。
- このルートは ZIP 専用のままです。ClawPack `.tgz` ファイルはストリーミングしません。
- リゾルバーによる整合性チェックのため、レスポンスには `ETag`、`Digest`、`X-ClawHub-Artifact-Type`、
  `X-ClawHub-Artifact-Sha256` ヘッダーが含まれます。
- レジストリ専用のメタデータは、ダウンロードされるアーカイブに挿入されません。
- 保留中の VirusTotal スキャンはダウンロードをブロックしません。悪意のあるリリースは `403` を返します。
- 非公開パッケージは、呼び出し元が所有者である場合を除き、`404` を返します。

### `GET /api/npm/{package}`

ClawPack を基盤とするパッケージバージョンについて、npm 互換の packument を返します。

注記:

- アップロード済みの ClawPack npm-pack tarball があるバージョンのみが一覧表示されます。
- 従来の ZIP 専用バージョンは意図的に除外されます。
- ユーザーが希望に応じて npm の参照先をミラーに設定できるよう、`dist.tarball`、`dist.integrity`、`dist.shasum` は
  npm 互換フィールドを使用します。
- スコープ付きパッケージの packument は、`/api/npm/@scope/name` と npm の
  エンコード済みリクエストパス `/api/npm/@scope%2Fname` の両方をサポートします。

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ミラークライアント向けに、アップロードされた ClawPack tarball の正確なバイト列をストリーミングします。

注記:

- ダウンロード用レートバケットを使用します。
- ダウンロードヘッダーには、ClawHub SHA-256 に加えて npm の integrity/shasum メタデータが含まれます。
- モデレーションおよび非公開パッケージのアクセスチェックは引き続き適用されます。

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

ホストされている Skills バージョンの ZIP をダウンロードします。または、`clean` または `suspicious` のスキャン結果があり、
ホスト済みバージョンが存在しない現在の GitHub バックエンドの Skills に対して、GitHub ソースへの引き渡し情報を返します。

クエリパラメーター:

- `slug`（必須）
- `version`（任意）: semver 文字列
- `tag`（任意）: タグ名（例: `latest`）

注記:

- `version` と `tag` のどちらも指定されていない場合、最新バージョンが使用されます。
- 論理削除されたバージョンは `410` を返します。
- GitHub バックエンドの Skills の引き渡しでは、バイト列をプロキシまたはミラーリングしません。JSON レスポンスには
  `sourceRef: "public-github"`、`repo`、`commit`、`path`、`contentHash`、
  `archiveUrl` が含まれます。スキャン/現在の状態はゲートとして使用され、成功時の
  ペイロードメタデータには含まれません。
- ダウンロード統計は UTC 日ごとの一意な ID 単位で集計されます（API トークンが有効な場合は `userId`、それ以外は IP）。

## 認証エンドポイント（Bearer トークン）

すべてのエンドポイントで次が必要です:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

トークンを検証し、ユーザーハンドルを返します。

### `POST /api/v1/skills`

新しいバージョンを公開します。

- 推奨: `payload` JSON と `files[]` blob を含む `multipart/form-data`。
- `files`（storageId ベース）を含む JSON 本文も受け付けます。
- 任意のペイロードフィールド: `ownerHandle`。指定すると、API はそのパブリッシャーを
  サーバー側で解決し、実行者にパブリッシャーへのアクセス権があることを要求します。
- 任意のペイロードフィールド: `migrateOwner`。`ownerHandle` とともに `true` にすると、
  実行者が現在および移行先の両パブリッシャーで管理者/所有者である場合、既存の Skills をその所有者へ移動できます。
  このオプトインがない場合、所有者の変更は拒否されます。

### `POST /api/v1/packages`

code-plugin または bundle-plugin のリリースを公開します。

- Bearer トークン認証が必要です。
- `multipart/form-data` が必要です。
- 使用できるフォームフィールドは、`payload`、繰り返し指定する `files` blob、または 1 つの `clawpack`
  tarball 参照です。`clawpack` には `.tgz` blob、または
  upload-url フローで返されたストレージ ID を指定できます。ステージングされたストレージ ID による公開では、そのアップロード URL とともに返された
  `clawpackUploadTicket` も含める必要があります。
- `files` または `clawpack` のいずれかを使用し、同じリクエストで両方を使用してはいけません。
- JSON 本文および呼び出し元が指定する `payload.files` / `payload.artifact`
  メタデータは拒否されます。
- 直接の multipart 公開リクエストは 18MB に制限されます。ClawPack tarball では、
  upload-url フローを使用して tarball 上限の 120MB までアップロードできます。
- 任意のペイロードフィールド: `ownerHandle`。指定した所有者に代わって公開できるのは管理者のみです。

主な検証項目:

- `family` は `code-plugin` または `bundle-plugin` でなければなりません。
- Plugin パッケージには `openclaw.plugin.json` が必要です。ClawPack `.tgz` アップロードでは、
  `package/openclaw.plugin.json` に含まれていなければなりません。
- コード Plugin には、`package.json`、ソースリポジトリメタデータ、ソースコミット
  メタデータ、設定スキーマメタデータ、`openclaw.compat.pluginApi`、および
  `openclaw.build.openclawVersion` が必要です。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
- `official` チャンネルに公開できるのは、`openclaw` 組織パブリッシャーと、現在の `openclaw` 組織メンバーの
  個人パブリッシャーのみです。
- 代理公開でも、対象の所有者アカウントに対して official チャンネルの資格が検証されます。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skills を論理削除/復元します（所有者、モデレーター、または管理者）。

任意の JSON 本文:

```json
{ "reason": "Held for moderation pending legal review." }
```

指定した場合、`reason` は Skills のモデレーションメモとして保存され、監査ログにコピーされます。
所有者が開始した論理削除では slug が 30 日間予約され、その後は別のパブリッシャーが
その slug を取得できます。この有効期限が適用される場合、削除レスポンスには `slugReservedUntil` が含まれます。
モデレーター/管理者による非表示およびセキュリティ上の削除には、このような有効期限はありません。

削除レスポンス:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

ステータスコード:

- `200`: 成功
- `401`: 未認証
- `403`: 禁止
- `404`: Skills/ユーザーが見つかりません
- `500`: 内部サーバーエラー

### `POST /api/v1/users/publisher`

管理者専用。ハンドルに対する組織パブリッシャーが存在することを保証します。ハンドルが引き続き
従来の共有ユーザー/個人パブリッシャーを指している場合、エンドポイントはまずそれを組織パブリッシャーへ移行します。
新しく作成する組織では `memberHandle` を指定します。操作を実行する管理者はメンバーとして追加されません。
`memberRole` のデフォルトは `owner` です。

- 本文: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- レスポンス: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

認証済みユーザーがセルフサービスで組織パブリッシャーを作成します。新しい組織パブリッシャーを作成し、
呼び出し元を所有者として追加します。このエンドポイントは既存のユーザー/個人ハンドルを移行せず、
パブリッシャーを信頼済み/公式としてマークしません。

- 本文: `{ "handle": "opik", "displayName": "Opik" }`
- レスポンス: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ハンドルがパブリッシャー、ユーザー、または個人パブリッシャーによってすでに使用されている場合は `409` を返します。

### `POST /api/v1/users/reserve`

管理者専用。リリースを公開せずに、正当な所有者のためにルート slug とパッケージ名を予約します。
パッケージ名はリリース行のない非公開のプレースホルダーパッケージとなるため、同じ
所有者が後から実際の code-plugin または bundle-plugin リリースをその名前で公開できます。

- 本文: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- レスポンス: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

管理者専用。Convex Auth のアカウント行を編集せずに、検証済みの代替 GitHub OAuth プリンシパル用の
個人パブリッシャーを復旧します。リクエストでは、不変の GitHub
プロバイダーアカウント ID を両方指定する必要があります。変更可能なハンドルは、オペレーター向けのガードとしてのみ使用されます。

エンドポイントのデフォルトはドライランです。リカバリを適用するには、スタッフが両方の
GitHub プリンシパル間の継続性を個別に検証した後、`dryRun: false` と
`confirmIdentityVerified: true` を指定する必要があります。移行先ユーザーの現在の個人
パブリッシャーに Skills、パッケージ、または GitHub の Skill ソースがある場合、リカバリは安全側に失敗します。
また、リカバリされたパブリッシャーの Skills、Skill スラッグエイリアス、パッケージ、
パッケージインスペクターの警告、および派生検索ダイジェスト行にある従来の `ownerUserId` フィールドも移行され、
直接所有者のパスが新しいパブリッシャー権限と一致するようになります。リカバリされたハンドルに対する有効な保護ハンドル
予約も置換後のユーザーに再割り当てされるため、その後のプロファイル同期によって以前のユーザーの競合する権限が
復元されることはありません。各プライマリテーブルは、適用トランザクションごとに
100 行に制限されます。より大規模なリカバリでは、まず再開可能な所有者移行を使用する必要があります。
GitHub の Skill ソースはパブリッシャー単位であり、書き換えられず、確認済みとして報告されます。

- 本文: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- レスポンス: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### 所有者向けスラッグ管理エンドポイント

- `POST /api/v1/skills/{slug}/rename`
  - 本文: `{ "newSlug": "new-canonical-slug" }`
  - レスポンス: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文: `{ "targetSlug": "canonical-target-slug" }`
  - レスポンス: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注意:

- 両方のエンドポイントで API トークン認証が必要であり、Skill の所有者のみが使用できます。
- `rename` は以前のスラッグをリダイレクトエイリアスとして保持します。
- `merge` は移行元の一覧を非表示にし、移行元のスラッグを移行先の一覧へリダイレクトします。

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
  - レスポンス形式: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

ユーザーを禁止し、そのユーザーが所有する Skills を完全に削除します（モデレーター/管理者のみ）。

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

ユーザーの禁止を解除し、条件を満たす Skills を復元します（管理者のみ）。

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

禁止解除やコンテンツの復元を行わず、既存の禁止に保存されている理由を変更します
（管理者のみ）。`dryRun` が `false` でない限り、デフォルトはドライランです。

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

スター（ハイライト）を追加/削除します。両方のエンドポイントは冪等です。

レスポンス:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## 従来の CLI エンドポイント（非推奨）

古い CLI バージョン向けに引き続きサポートされています。

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

削除計画については `DEPRECATIONS.md` を参照してください。

`POST /api/cli/upload-url` は `uploadUrl` と `uploadTicket` を返します。ClawPack tarball を
ステージングするパッケージ公開では、生成されたストレージ ID を
`clawpack` として、返されたチケットを `clawpackUploadTicket` として送信する必要があります。

## レジストリ検出（`/.well-known/clawhub.json`）

CLI はサイトからレジストリ/認証設定を検出できます。

- `/.well-known/clawhub.json`（JSON、推奨）
- `/.well-known/clawdhub.json`（従来）

スキーマ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

セルフホストする場合は、このファイルを配信してください（または `CLAWHUB_REGISTRY` を明示的に設定してください。従来の変数は `CLAWDHUB_REGISTRY` です）。
