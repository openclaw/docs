---
read_when:
    - エンドポイントの追加・変更
    - CLI ↔ レジストリ間リクエストのデバッグ
summary: HTTP APIリファレンス（公開エンドポイント + CLIエンドポイント + 認証）。
x-i18n:
    generated_at: "2026-07-11T22:00:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

ベース URL: `https://clawhub.ai`（デフォルト）。

すべての v1 パスは `/api/v1/...` 配下にあります。
従来の `/api/...` と `/api/cli/...` は互換性のために維持されています（`DEPRECATIONS.md` を参照）。
OpenAPI: `/api/v1/openapi.json`。

## 公開カタログの再利用

サードパーティのディレクトリは、公開読み取りエンドポイントを使用して ClawHub の Skills を一覧表示または検索できます。結果をキャッシュし、`429`/`Retry-After` に従い、ユーザーを正規の ClawHub リスト（`https://clawhub.ai/<owner>/skills/<slug>`）へ誘導し、ClawHub がサードパーティサイトを推奨しているかのような表現は避けてください。公開 API の範囲外にある非表示、非公開、またはモデレーションによってブロックされたコンテンツをミラーリングしないでください。

Web のスラッグショートカットはレジストリファミリーをまたいで解決されますが、API クライアントはルートの優先順位を再構築せず、読み取りエンドポイントから返される正規 URL を使用してください。

## レート制限

適用モデル:

- 匿名リクエスト: IP ごとに適用されます。
- 認証済みリクエスト（有効な Bearer トークン）: ユーザーバケットごとに適用されます。
- トークンが欠落しているか無効な場合、IP による適用へフォールバックします。
- 認証済み書き込みエンドポイントでは、サーバーが理由を把握している場合、単に `Unauthorized` だけを返すべきではありません。CLI クライアントが何によってブロックされたのかをユーザーに伝えられるように、トークンの欠落、無効化または失効したトークン、削除、禁止、または無効化されたアカウントには、それぞれ対処可能なテキストを返してください。

- 読み取り: IP ごとに 3000/分、キーごとに 12000/分
- 書き込み: IP ごとに 300/分、キーごとに 3000/分
- ダウンロード: IP ごとに 1200/分、キーごとに 6000/分（ダウンロードエンドポイント）

ヘッダー:

- 従来の互換性: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- 標準化: `RateLimit-Limit`, `RateLimit-Reset`
- `429` の場合: `X-RateLimit-Remaining: 0` および `RateLimit-Remaining: 0`
- `429` の場合: `Retry-After`

ヘッダーの意味:

- `X-RateLimit-Reset`: Unix エポックの絶対秒数
- `RateLimit-Reset`: リセットまでの秒数（遅延）
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: 存在する場合は、正確な残り枠。
  シャーディングされた成功リクエストでは、概算のグローバル値を返す代わりにこのヘッダーを省略します。
- `Retry-After`: `429` で再試行するまで待機する秒数（遅延）

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

- `Retry-After` が存在する場合、再試行する前に指定された秒数だけ待機してください。
- 同期した再試行を避けるため、ジッター付きバックオフを使用してください。
- `Retry-After` がない場合は、`RateLimit-Reset` にフォールバックしてください（または `X-RateLimit-Reset` から計算してください）。

IP の取得元:

- デプロイで信頼済み転送ヘッダーが明示的に有効化されている場合にのみ、`cf-connecting-ip` を含む信頼済みクライアント IP ヘッダーを使用します。
- ClawHub は、エッジでクライアント IP を識別するために信頼済み転送ヘッダーを使用します。
- 信頼できるクライアント IP がない場合、匿名リクエストではレート制限の種類のみをスコープとするフォールバックバケットを使用します。これらのフォールバックバケットには、呼び出し元が指定したパス、スラッグ、パッケージ名、バージョン、クエリ文字列、その他のアーティファクトパラメーターは含まれません。

## エラーレスポンス

公開 v1 エラーレスポンスは、`content-type: text/plain; charset=utf-8` のプレーンテキストです。
これには、検証失敗（`400`）、公開リソースの欠落（`404`）、認証および権限の失敗（`401`/`403`）、レート制限（`429`）、ブロックされたダウンロードが含まれます。クライアントはレスポンス本文を人が読める文字列として読み取る必要があります。未知のクエリパラメーターは互換性のために無視されますが、認識されるクエリパラメーターに無効な値が指定された場合は `400` を返します。

## 公開エンドポイント（認証不要）

### `GET /api/v1/search`

クエリパラメーター:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数
- `highlightedOnly`（任意）: 注目 Skills のみに絞り込む場合は `true`
- `nonSuspiciousOnly`（任意）: 疑わしい（`flagged.suspicious`）Skills を非表示にする場合は `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` の従来の別名

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

- 結果は関連度順（埋め込みの類似度 + 完全一致するスラッグ/名前トークンのブースト + 小さな人気度の事前分布）で返されます。
- 関連度は人気度より強く評価されます。スラッグまたは表示名のトークンが正確に一致する場合、エンゲージメントがはるかに高くても一致度の低い結果より上位になることがあります。
- ASCII テキストは単語と句読点の境界でトークン化されます。たとえば、`personal-map` には独立した `map` トークンが含まれますが、`amap-jsapi-skill` には `amap`、`jsapi`、`skill` が含まれます。そのため、`map` を検索すると、`personal-map` は `amap-jsapi-skill` より強い字句一致として評価されます。
- 人気度は対数スケールで評価され、上限があります。エンゲージメントが高い Skills でも、クエリテキストとの一致が弱い場合は順位が低くなることがあります。
- 疑わしい、または非表示のモデレーション状態にある Skills は、呼び出し元のフィルターと現在のモデレーション状態に応じて公開検索から除外されることがあります。

公開者向けの見つけやすさに関するガイダンス:

- ユーザーが実際に検索する語句を、表示名、概要、タグに含めてください。独立したスラッグトークンは、今後も維持したい安定した識別子でもある場合にのみ使用してください。
- 新しいスラッグが長期的により適切な正規名でない限り、1 つのクエリを狙うためだけにスラッグを変更しないでください。古いスラッグはリダイレクト用の別名になりますが、正規 URL、表示されるスラッグ、今後の検索ダイジェストでは新しいスラッグが使用されます。
- 名前変更用の別名により、古い URL とレジストリ経由で解決されるインストールは引き続き解決できますが、検索順位は、名前変更後のインデックス登録が完了した時点の正規 Skills メタデータに基づきます。既存の統計情報は Skills に保持されます。
- Skills が予期せず表示されない場合、順位関連のメタデータを変更する前に、ログインした状態で `clawhub inspect @owner/slug` を使用して、まずモデレーション状態を確認してください。

### `GET /api/v1/skills`

クエリパラメーター:

- `limit`（任意）: 整数（1～200）
- `cursor`（任意）: `trending` 以外の並べ替えで使用するページネーションカーソル
- `sort`（任意）: `updated`（デフォルト）、`recommended`（別名: `default`）、`createdAt`（別名: `newest`）、`downloads`、`stars`（別名: `rating`）、従来のインストール数の別名 `installsCurrent`/`installs`/`installsAllTime` は `downloads` に対応、`trending`
- `nonSuspiciousOnly`（任意）: 疑わしい（`flagged.suspicious`）Skills を非表示にする場合は `true`
- `nonSuspicious`（任意）: `nonSuspiciousOnly` の従来の別名

無効な `sort` 値は `400` を返します。

注記:

- `recommended` はエンゲージメントと新しさのシグナルを使用します。
- `trending` は過去 7 日間のインストール数（テレメトリに基づく）で順位付けします。
- `createdAt` は新しい Skills のクロールに対して安定しています。`updated` は既存の Skills が再公開されると変化します。
- `nonSuspiciousOnly=true` の場合、疑わしい Skills はページ取得後に除外されるため、カーソルベースの並べ替えでは 1 ページあたりの項目数が `limit` より少なくなることがあります。
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

- 所有者による名前変更/統合フローで作成された古いスラッグは、正規の Skills に解決されます。
- `metadata.os`: Skills の frontmatter で宣言された OS 制限（例: `["macos"]`、`["linux"]`）。宣言されていない場合は `null`。
- `metadata.systems`: Nix システムターゲット（例: `["aarch64-darwin", "x86_64-linux"]`）。宣言されていない場合は `null`。
- Skills にプラットフォームメタデータがない場合、`metadata` は `null` です。
- `moderation` は、Skills にフラグが付いている場合、または所有者が閲覧している場合にのみ含まれます。

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

- 所有者とモデレーターは、非表示の Skills のモデレーション詳細にアクセスできます。
- 公開呼び出し元が `200` を受け取れるのは、すでにフラグが付いている表示可能な Skills に限られます。
- 公開呼び出し元に対して証拠は編集され、未加工のスニペットは所有者/モデレーターに対してのみ含まれます。

### `POST /api/v1/skills/{slug}/report`

モデレーターによるレビューのために Skills を報告します。報告は Skills 単位で、任意でバージョンに関連付けられ、Skills 報告キューに送られます。

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

Skills 報告を受け付けるためのモデレーター/管理者向けエンドポイントです。

クエリパラメーター:

- `status`（任意）: `open`（デフォルト）、`confirmed`、`dismissed`、または `all`
- `limit`（任意）: 整数（1～200）
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

Skills 報告を解決または再オープンするためのモデレーター/管理者向けエンドポイントです。

リクエスト:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` と `dismissed` では `note` が必須です。`status` を `open` に戻す場合は省略できます。トリアージ済みの報告に `finalAction: "hide"` を渡すと、同じ監査可能なワークフロー内で Skills を非表示にできます。

### `GET /api/v1/skills/{slug}/versions`

クエリパラメーター:

- `limit`（任意）: 整数
- `cursor`（任意）: ページネーションカーソル

### `GET /api/v1/skills/{slug}/versions/{version}`

バージョンメタデータとファイル一覧を返します。

- `version.security` には、利用可能な場合、正規化されたスキャン検証状態とスキャナーの詳細（VirusTotal + LLM）が含まれます。

### `GET /api/v1/skills/{slug}/scan`

Skills のバージョンに対するセキュリティスキャンの検証詳細を返します。

クエリパラメーター:

- `version`（任意）: 特定のバージョン文字列。
- `tag`（任意）: タグ付きバージョン（例: `latest`）を解決します。

注記:

- `version` と `tag` のどちらも指定されていない場合、最新バージョンを使用します。
- 正規化された検証ステータスと、スキャナー固有の詳細が含まれます。
- `security.hasScanResult` が `true` になるのは、スキャナーが確定的な判定（`clean`、`suspicious`、または `malicious`）を生成した場合のみです。
- `moderation` は、最新バージョンから導出された現在のスキルレベルのモデレーションスナップショットです。
- 過去のバージョンを照会する場合、`moderation` と `security` を同じバージョンコンテキストとして扱う前に、`moderation.matchesRequestedVersion` と `moderation.sourceVersion` を確認してください。

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

注記：

- スキャンリクエストのペイロードとダウンロード可能なレポートは、保持期間の経過後にスキャンリクエストストアから期限切れになります。
- 公開済みスキャンには、所有者または公開者としての管理アクセス権、あるいはプラットフォームのモデレーターまたは管理者権限が必要です。
- 公開済みスキャンが結果を書き戻すのは、`update: true` であり、かつスキャンが正常に完了した場合のみです。
- レスポンスは `202` で、`{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "スキャンは非同期であり、完了まで時間がかかる場合があります。" } }` が返されます。
- スキャンジョブは非同期です。手動スキャンリクエストは通常の公開処理やバックフィル処理より優先されますが、完了は引き続きワーカーの可用性に依存します。

### `GET /api/v1/skills/-/scan/{scanId}`

送信済みスキャンをポーリングするための認証済みエンドポイントです。

- キュー待ち、実行中、成功、失敗のステータスを返します。
- キュー待ちの間は `queue.queuedAhead` と `queue.position` を返すため、クライアントはそのリクエストより前にある優先手動スキャンの数を表示できます。非常に大きなキューでは値に上限が設けられ、`queuedAheadIsEstimate: true` として報告されます。
- 利用可能な場合、`report` には `clawscan`、`skillspector`、`staticAnalysis`、`virustotal` の各セクションが含まれます。
- 失敗したスキャンジョブは、`lastError` とともに `status: "failed"` を返します。

### `GET /api/v1/skills/-/scan/{scanId}/download`

認証済みのレポートアーカイブエンドポイントです。

- 成功したスキャンが必要です。終了状態でないスキャンは `409` を返します。
- `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、`README.md` を含む ZIP を返します。

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

送信済みバージョンの保存済みレポートアーカイブを取得するための認証済みエンドポイントです。

- スキルまたは Plugin に対する所有者または公開者としての管理アクセス権、あるいはプラットフォームのモデレーターまたは管理者権限が必要です。
- ブロックまたは非表示にされたバージョンを含め、送信された正確なバージョンの保存済みスキャン結果を返します。
- `kind` のデフォルトは `skill` です。Plugin またはパッケージのスキャンには `kind=plugin` を使用してください。
- スキャンリクエストのダウンロードと同じ構成の ZIP を返します。

### `POST /api/v1/skills/-/scan/batch`

管理者専用の正規バッチ再スキャンルートです。従来の `POST /api/v1/skills/-/rescan-batch` と同じ形式のペイロードを受け付けます。

### `POST /api/v1/skills/-/scan/batch/status`

管理者専用の正規バッチステータスルートです。`{ "jobIds": ["..."] }` を受け付け、従来の `POST /api/v1/skills/-/rescan-batch/status` と同じ集計カウンターを返します。

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` が使用するスキルカード検証エンベロープを返します。

クエリパラメーター：

- `version`（任意）：特定のバージョン文字列。
- `tag`（任意）：タグ付きバージョンを解決します（例：`latest`）。

注記：

- `ok` が `true` になるのは、選択されたバージョンに生成済みのスキルカードがあり、モデレーションによってマルウェアとしてブロックされておらず、かつ ClawScan の検証結果がクリーンな場合のみです。
- スキルの識別情報、公開者の識別情報、選択されたバージョンのメタデータは、エンベロープのトップレベルフィールド（`slug`、`displayName`、`publisherHandle`、`version`、`resolvedFrom`、`tag`、`createdAt`）として格納されるため、シェル自動化はネストされたラッパーを展開せずに読み取れます。
- `security` はトップレベルの ClawScan またはセキュリティ判定です。自動化では `ok`、`decision`、`reasons`、`security.status` を基準にしてください。
- `security.signals` には、`staticScan`、`virusTotal`、`skillSpector` など、スキャナーによる補助的な根拠が含まれます。
- `security.signals.dependencyRegistry` は v1 レスポンスとの互換性のために保持されていますが、依存関係レジストリの存在確認スキャナーは廃止されており、このキーは常に `null` です。
- `provenance` が `server-resolved-github-import` になるのは、公開またはインポート時に ClawHub が GitHub のリポジトリ、参照、コミット、パスを解決して保存した場合のみです。それ以外の場合は `unavailable` です。

### `POST /api/v1/skills/-/security-verdicts`

正確なスキルバージョンに対する現在の簡潔なセキュリティ判定を返します。このコレクションエンドポイントは、OpenClaw Control UI など、表示する必要があるインストール済み ClawHub スキルのバージョンをすでに把握しているクライアントを対象としています。

リクエスト：

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

注記：

- `items` には、重複しない `{ slug, version }` の組を 1～100 件含める必要があります。
- 結果は項目ごとに返されます。1 つのスキルまたはバージョンが見つからなくても、レスポンス全体が失敗することはありません。
- レスポンスにはセキュリティ情報のみが含まれます。スキルカードのデータ、生成済みカードのステータス、成果物のファイル一覧、詳細なスキャナーペイロードは含まれません。
- `security.signals` にはステータスレベルの補助的な根拠のみが含まれます。スキャナーの詳細情報全体については、`/scan` または ClawHub のセキュリティ監査ページを使用してください。
- `security.signals.dependencyRegistry` は v1 レスポンスとの互換性のために保持されていますが、依存関係レジストリの存在確認スキャナーは廃止されており、このキーは常に `null` です。
- スキルカードが存在しなくても、このエンドポイントの `ok`、`decision`、`reasons` には影響しません。カードの内容が必要な場合、クライアントはインストール済みの `skill-card.md` をローカルで読み取る必要があります。
- 単一スキルのスキルカード検証エンベロープが必要な場合は `/verify`、生成済みカードの Markdown が必要な場合は `/card`、詳細なスキャナーデータが必要な場合は `/scan` を使用してください。

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

以下を対象とする統合カタログエンドポイントです:

- スキル
- コード Plugin
- バンドル Plugin

クエリパラメータ:

- `limit`（任意）: 整数（1～100）
- `cursor`（任意）: ページネーションカーソル
- `family`（任意）: `skill`、`code-plugin`、または `bundle-plugin`
- `channel`（任意）: `official`、`community`、または `private`
- `isOfficial`（任意）: `true` または `false`
- `sort`（任意）: `updated`（デフォルト）、`recommended`、`trending`、`downloads`、従来の別名 `installs`
- `category`（任意）: Pluginカテゴリフィルター。リクエストの対象が
  Pluginパッケージ（`/api/v1/plugins`、
  `/api/v1/code-plugins`、`/api/v1/bundle-plugins`、または
  `family=code-plugin`/`family=bundle-plugin` を指定したパッケージエンドポイント）に
  限定されている場合のみサポートされます。管理対象カテゴリと
  従来の v1 フィルターの別名については、`GET /api/v1/plugins` に記載されています。

注記:

- `family`、`channel`、`isOfficial`、`featured`、
  `highlightedOnly`、または `sort` の値が無効な場合は `400` を返します。未知のクエリパラメータは無視されます。
- `GET /api/v1/code-plugins` と `GET /api/v1/bundle-plugins` は、引き続きファミリー固定の別名です。
- スキルのエントリは引き続きスキルレジストリを基盤とし、`POST /api/v1/skills` からのみ公開できます。
- `POST /api/v1/packages` は、引き続きコード Pluginおよびバンドル Pluginのリリース専用です。
- 匿名の呼び出し元には、公開パッケージチャンネルのみが表示されます。
- 認証済みの呼び出し元は、一覧および検索結果で、自身が所属する公開元のプライベートパッケージを表示できます。
- `channel=private` では、認証済みの呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/packages/search`

スキルと Pluginパッケージを横断する統合カタログ検索です。

クエリパラメータ:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数（1～100）
- `family`（任意）: `skill`、`code-plugin`、または `bundle-plugin`
- `channel`（任意）: `official`、`community`、または `private`
- `isOfficial`（任意）: `true` または `false`
- `category`（任意）: Pluginカテゴリフィルター。リクエストの対象が
  Pluginパッケージに限定されている場合のみサポートされます。管理対象カテゴリと従来の v1
  フィルターの別名については、`GET /api/v1/plugins` に記載されています。

注記:

- `family`、`channel`、`isOfficial`、`featured`、または
  `highlightedOnly` の値が無効な場合は `400` を返します。未知のクエリパラメータは無視されます。
- 匿名の呼び出し元には、公開パッケージチャンネルのみが表示されます。
- 認証済みの呼び出し元は、自身が所属する公開元のプライベートパッケージを検索できます。
- `channel=private` では、認証済みの呼び出し元が読み取れるパッケージのみを返します。

### `GET /api/v1/plugins`

コード Pluginおよびバンドル Pluginパッケージを横断する、Plugin専用のカタログ閲覧です。

クエリパラメータ:

- `limit`（任意）: 整数（1～100）
- `cursor`（任意）: ページネーションカーソル
- `isOfficial`（任意）: `true` または `false`
- `sort`（任意）: `recommended`（デフォルト）、`trending`、`downloads`、`updated`、従来の別名 `installs`
- `category`（任意）: Pluginカテゴリフィルター。現在の値:
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

従来の v1 フィルターの別名は、読み取りエンドポイントで引き続き使用できます:

- `mcp-tooling`、`data`、および `automation` は `tools` として解決されます。
- `observability` および `deployment` は `gateway` として解決されます。
- `dev-tools` は `runtime` として解決されます。

`trending` は過去7日間のインストール数およびダウンロード数によるランキングであり、累計値は使用しません。
統合 `/api/v1/packages` エンドポイントでは Pluginのみが対象です。スキルカタログには
`/api/v1/skills?sort=trending` を使用してください。

従来の別名は、保存されるカテゴリ値または作成者が宣言するカテゴリ値としては使用できません。

### `GET /api/v1/skills/export`

オフライン分析用に、最新の公開スキルを一括エクスポートします。

認証:

- APIトークンが必要です。

クエリパラメータ:

- `startDate`（必須）: スキルの `updatedAt` に対する下限の Unix ミリ秒。
- `endDate`（必須）: スキルの `updatedAt` に対する上限の Unix ミリ秒。
- `limit`（任意）: 整数（1～250）、デフォルトは `250`。
- `cursor`（任意）: 前回のレスポンスから取得したページネーションカーソル。

レスポンス:

- 本文: ZIPアーカイブ。
- エクスポートされた各スキルは `{publisher}/{slug}/` をルートとします。
- ホストされているスキルには、保存済みの最新バージョンのファイルが含まれ、
  `_manifest.json` に `sourceRef: "public-clawhub"` として記載されます。
- `clean` または `suspicious` のスキャン結果を持つ、現在の GitHub を基盤とするスキルには、
  `_source_handoff.json` が含まれます。このファイルには `sourceRef: "public-github"`、リポジトリ、コミット、パス、
  コンテンツハッシュ、アーカイブ URL が記載されます。ClawHub がホストするソースファイルは含まれません。
- 各スキルには `_export_skill_meta.json` が含まれます。
- `_manifest.json` は常に ZIP のルートに含まれます。
- 個々のスキルまたはファイルをエクスポートできなかった場合は、
  `_errors.json` が含まれます。

ヘッダー:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

オフライン分析向けに、公開されている Plugin の最新リリースを一括エクスポートします。

認証:

- API トークンが必要です。

クエリパラメーター:

- `startDate`（必須）: Plugin の `updatedAt` に対する下限（Unix ミリ秒）。
- `endDate`（必須）: Plugin の `updatedAt` に対する上限（Unix ミリ秒）。
- `limit`（任意）: 整数（1〜250）。デフォルトは `250`。
- `cursor`（任意）: 前回のレスポンスから取得したページネーションカーソル。
- `family`（任意）: `code-plugin` または `bundle-plugin`。省略した場合は両方の
  Plugin ファミリーが対象になります。

レスポンス:

- 本文: ZIP アーカイブ。
- エクスポートされた各 Plugin は `{family}/{packageName}/` をルートとします。
- エクスポートされた各 Plugin には、最新リリースの保存済みファイルが含まれます。
- Plugin ごとのエクスポートメタデータは
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` に保存されます。
- `_manifest.json` は常に ZIP のルートに含まれます。
- 個別の Plugin またはファイルをエクスポートできなかった場合は
  `_errors.json` が含まれます。

ヘッダー:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-plugin および bundle-plugin パッケージを対象とする Plugin 専用検索です。

クエリパラメーター:

- `q`（必須）: クエリ文字列
- `limit`（任意）: 整数（1〜100）
- `isOfficial`（任意）: `true` または `false`
- `category`（任意）: Plugin カテゴリーフィルター。現在の値:
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

注記:

- `GET /api/v1/plugins` で文書化されている従来の v1 フィルターエイリアスも
  使用できます。
- カテゴリーフィルタリングは、検索クエリの書き換えではなく、Plugin カテゴリーダイジェスト行に
  基づく実際の API フィルターです。
- 結果は関連度順で返され、現在はページネーションされません。
- Plugin 検索のブラウザー UI の並べ替えコントロールは、読み込まれた関連度順の結果を並べ替えます。
  これは現在の `/skills` 閲覧動作と同じです。

### `GET /api/v1/packages/{name}`

パッケージの詳細メタデータを返します。

注記:

- 統合カタログでは、Skills もこのルートを通じて解決できます。
- 呼び出し元が所有パブリッシャーを読み取れる場合を除き、非公開パッケージは `404` を返します。

### `DELETE /api/v1/packages/{name}`

パッケージとすべてのリリースを論理削除します。

注記:

- パッケージ所有者、組織パブリッシャーの所有者または管理者、プラットフォームモデレーター、
  またはプラットフォーム管理者の API トークンが必要です。

### `GET /api/v1/packages/{name}/versions`

バージョン履歴を返します。

クエリパラメーター:

- `limit`（任意）: 整数（1〜100）
- `cursor`（任意）: ページネーションカーソル

注記:

- 呼び出し元が所有パブリッシャーを読み取れる場合を除き、非公開パッケージは `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}`

ファイルメタデータ、互換性、検証、アーティファクトメタデータ、スキャンデータを含む、
パッケージの特定バージョンを返します。

注記:

- `version.artifact.kind` は、旧形式のパッケージアーカイブでは `legacy-zip`、
  ClawPack ベースのリリースでは `npm-pack` です。
- ClawPack リリースには、npm 互換の `npmIntegrity`、`npmShasum`、
  `npmTarballName` フィールドが含まれます。
- `version.sha256hash` は、古いクライアント向けの非推奨の互換性メタデータです。
  `/api/v1/packages/{name}/download` が返す正確な ZIP バイト列をハッシュ化します。
  最新のクライアントでは、正規のリリースアーティファクトを識別する
  `version.artifact.sha256` を使用してください。
- スキャンデータが存在する場合は、`version.vtAnalysis`、`version.llmAnalysis`、
  `version.staticScan` が含まれます。
- 呼び出し元が所有パブリッシャーを読み取れる場合を除き、非公開パッケージは `404` を返します。

### `GET /api/v1/packages/{name}/versions/{version}/security`

インストールクライアント向けに、パッケージの正確なリリースセキュリティおよび信頼性の概要を返します。
これは、解決されたリリースをインストールできるかどうかを判断するための、
OpenClaw の公開利用インターフェースです。

認証:

- 公開読み取りエンドポイントです。所有者、パブリッシャー、モデレーター、管理者のトークンは
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

- `package.name`、`package.displayName`、`package.family` は、
  解決されたレジストリパッケージを識別します。
- `release.releaseId`、`release.version`、`release.createdAt` は、
  評価された正確なリリースを識別します。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum`、`release.npmTarballName` は、リリースアーティファクトについて
  判明している場合に存在します。
- `trust.scanStatus` は、スキャナー入力と手動のリリースモデレーションから導出された
  実効的な信頼ステータスです。
- `trust.moderationState` は null 許容です。手動のリリースモデレーションが
  存在しない場合は `null` です。
- `trust.blockedFromDownload` はインストールのブロックシグナルです。OpenClaw およびその他の
  インストールクライアントは、スキャナーまたはモデレーションフィールドからブロックルールを
  再導出するのではなく、この値が `true` の場合にインストールをブロックしてください。
- `trust.reasons` は、ユーザー向けおよび監査用の説明リストです。理由コードは
  `manual:quarantined`、`scan:malicious`、`package:malicious` などの、
  安定した簡潔な文字列です。
- `trust.pending` は、1 つ以上の信頼性入力がまだ完了待ちであることを意味します。
- `trust.stale` は、信頼性の概要が古い入力から計算されたことを意味し、
  高い確度で許可を判断する前に更新が必要なものとして扱ってください。

注記:

- このエンドポイントはバージョンを厳密に指定します。クライアントは、最新のパッケージメタデータを
  読み取った直後ではなく、インストール予定のパッケージバージョンを解決した後に呼び出してください。
- 呼び出し元が所有パブリッシャーを読み取れる場合を除き、非公開パッケージは `404` を返します。
- このエンドポイントは、所有者またはモデレーター向けのモデレーションエンドポイントよりも
  意図的に範囲を限定しています。インストール判断と公開説明を公開しますが、
  報告者の身元、報告本文、非公開の証拠、内部レビューのタイムラインは公開しません。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

パッケージバージョンの明示的なアーティファクトリゾルバーメタデータを返します。

注記:

- 従来のパッケージバージョンは、`legacy-zip` アーティファクトと従来の ZIP
  `downloadUrl` を返します。
- ClawPack バージョンは、`npm-pack` アーティファクト、npm 整合性フィールド、
  `tarballUrl`、および従来の ZIP 互換 URL を返します。
- これは OpenClaw のリゾルバーインターフェースであり、共有 URL から
  アーカイブ形式を推測する必要がありません。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

明示的なリゾルバーパスを通じてバージョンアーティファクトをダウンロードします。

注記:

- ClawPack バージョンは、アップロードされた正確な npm-pack `.tgz` バイト列をストリーミングします。
- 従来の ZIP バージョンは `/api/v1/packages/{name}/download?version=` にリダイレクトします。
- ダウンロード用のレートバケットを使用します。

### `GET /api/v1/packages/{name}/readiness`

将来の OpenClaw での利用に対する算出済みの準備状況を返します。

準備状況のチェック対象:

- 公式チャンネルのステータス
- 最新バージョンの可用性
- ClawPack npm-pack アーティファクトの可用性
- アーティファクトダイジェスト
- ソースリポジトリとコミットの出所
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

公式 OpenClaw Plugin の移行行を一覧表示するためのモデレーター向けエンドポイントです。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `phase`（任意）: `planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw`、または
  `all`（デフォルト）。
- `limit`（任意）: 整数（1〜100）
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

公式 Plugin の移行行を作成または更新するための管理者向けエンドポイントです。

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
- `packageName` は npm 名として正規化されます。計画段階の移行では、パッケージが
  存在しない場合があります。
- これは移行の準備状況のみを追跡します。OpenClaw を変更したり、
  ClawPack を生成したりするものではありません。

### `GET /api/v1/packages/moderation/queue`

パッケージリリースのレビューキュー向けのモデレーターまたは管理者用エンドポイントです。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `status`（任意）: `open`（デフォルト）、`blocked`、`manual`、または `all`
- `limit`（任意）: 整数（1〜100）
- `cursor`（任意）: ページネーションカーソル

ステータスの意味:

- `open`: 疑わしい、悪意がある、保留中、隔離済み、失効済み、または報告済みのリリース。
- `blocked`: 隔離済み、失効済み、または悪意があるリリース。
- `manual`: 手動モデレーションによる上書きがあるすべてのリリース。
- `all`: 手動による上書き、クリーンではないスキャン状態、またはパッケージ報告があるすべてのリリース。

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

モデレーターによるレビューを受けるためにパッケージを報告します。報告はパッケージ単位であり、
必要に応じてバージョンに関連付けられます。報告はモデレーションキューに追加されますが、
それ自体では自動的に非表示にしたり、ダウンロードをブロックしたりしません。
モデレーターは、リリースモデレーションを使用してアーティファクトを承認、隔離、または失効させてください。

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

パッケージ報告を受け付けるモデレーター／管理者向けエンドポイント。

認証:

- モデレーターまたは管理者ユーザーの API トークンが必要です。

クエリパラメーター:

- `status`（任意）: `open`（デフォルト）、`confirmed`、`dismissed`、または `all`
- `limit`（任意）: 整数（1～100）
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

パッケージのモデレーション情報を表示する所有者／モデレーター向けエンドポイント。

認証:

- パッケージ所有者、パブリッシャーのメンバー、モデレーター、または管理者ユーザーの API トークンが必要です。

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

パッケージ報告を解決または再オープンするモデレーター／管理者向けエンドポイント。

リクエスト:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` および `dismissed` では `note` が必須です。`status` を `open` に戻す場合は省略できます。確認済みの報告で `finalAction: "quarantine"` または `finalAction: "revoke"` を渡すと、同じ監査可能なワークフロー内でリリースのモデレーションが適用されます。

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

パッケージリリースを審査するモデレーター／管理者向けエンドポイント。

リクエスト:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

サポートされる状態:

- `approved`: 手動で審査され、許可されています。
- `quarantined`: 追加対応が完了するまでブロックされます。
- `revoked`: 以前に信頼されていたリリースをブロックします。

隔離または取り消されたリリースに対して、アーティファクトのダウンロードルートは `403` を返します。
変更のたびに監査ログエントリが書き込まれます。

### `GET /api/v1/packages/{name}/file`

パッケージファイルの未加工テキストコンテンツを返します。

クエリパラメーター:

- `path`（必須）
- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- ダウンロード用バケットではなく、読み取り用のレート制限バケットを使用します。
- バイナリファイルの場合は `415` を返します。
- ファイルサイズ上限: 200KB。
- VirusTotal スキャンが保留中でも読み取りはブロックされません。ただし、悪意のあるリリースは別の場所で引き続き非公開になる場合があります。
- 非公開パッケージは、呼び出し元が所有パブリッシャーを読み取れる場合を除き `404` を返します。

### `GET /api/v1/packages/{name}/download`

パッケージリリースの従来の決定論的 ZIP アーカイブをダウンロードします。

クエリパラメーター:

- `version`（任意）
- `tag`（任意）

注記:

- デフォルトでは最新リリースを使用します。
- Skills は `GET /api/v1/download` にリダイレクトされます。
- Plugin／パッケージアーカイブは `package/` をルートとする ZIP ファイルであるため、古い OpenClaw クライアントも引き続き動作します。
- このルートは ZIP 専用です。ClawPack の `.tgz` ファイルはストリーミングしません。
- リゾルバーによる整合性チェックのため、レスポンスには `ETag`、`Digest`、`X-ClawHub-Artifact-Type`、`X-ClawHub-Artifact-Sha256` ヘッダーが含まれます。
- レジストリ専用のメタデータは、ダウンロードされるアーカイブには挿入されません。
- VirusTotal スキャンが保留中でもダウンロードはブロックされません。悪意のあるリリースは `403` を返します。
- 非公開パッケージは、呼び出し元が所有者である場合を除き `404` を返します。

### `GET /api/npm/{package}`

ClawPack を基盤とするパッケージバージョンについて、npm 互換の packument を返します。

注記:

- アップロード済みの ClawPack npm-pack tarball があるバージョンのみが一覧表示されます。
- 従来の ZIP 専用バージョンは意図的に省略されます。
- ユーザーが必要に応じて npm の参照先をミラーに設定できるよう、`dist.tarball`、`dist.integrity`、`dist.shasum` には npm 互換フィールドを使用します。
- スコープ付きパッケージの packument は、`/api/npm/@scope/name` と npm のエンコード済みリクエストパス `/api/npm/@scope%2Fname` の両方をサポートします。

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ミラークライアント向けに、アップロードされた ClawPack tarball の正確なバイト列をストリーミングします。

注記:

- ダウンロード用のレート制限バケットを使用します。
- ダウンロードヘッダーには、ClawHub の SHA-256 に加えて npm の integrity／shasum メタデータが含まれます。
- モデレーションと非公開パッケージへのアクセスチェックも引き続き適用されます。

### `GET /api/v1/resolve`

CLI がローカルフィンガープリントを既知のバージョンに対応付けるために使用します。

クエリパラメーター:

- `slug`（必須）
- `hash`（必須）: バンドルフィンガープリントの SHA-256 を表す64文字の16進数

レスポンス:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ホストされた Skills バージョンの ZIP をダウンロードします。または、`clean` もしくは `suspicious` のスキャン結果を持ち、ホストされたバージョンがない現在の GitHub ベースの Skills に対して、GitHub ソースへの引き継ぎ情報を返します。

クエリパラメーター:

- `slug`（必須）
- `version`（任意）: semver 文字列
- `tag`（任意）: タグ名（例: `latest`）

注記:

- `version` と `tag` のどちらも指定されていない場合は、最新バージョンが使用されます。
- 論理削除されたバージョンは `410` を返します。
- GitHub ベースの Skills の引き継ぎでは、バイト列をプロキシまたはミラーしません。JSON レスポンスには `sourceRef: "public-github"`、`repo`、`commit`、`path`、`contentHash`、`archiveUrl` が含まれます。スキャン／現在の状態はゲートとして機能し、成功時のペイロードメタデータには含まれません。
- ダウンロード統計は UTC 日ごとの一意の識別主体として集計されます（API トークンが有効な場合は `userId`、それ以外は IP）。

## 認証エンドポイント（Bearer トークン）

すべてのエンドポイントで次が必要です。

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

トークンを検証し、ユーザーハンドルを返します。

### `POST /api/v1/skills`

新しいバージョンを公開します。

- 推奨: `payload` JSON と `files[]` Blob を含む `multipart/form-data`。
- `files`（storageId ベース）を含む JSON ボディも受け付けます。
- 任意のペイロードフィールド: `ownerHandle`。指定すると、API がそのパブリッシャーをサーバー側で解決し、実行者にパブリッシャーへのアクセス権があることを要求します。
- 任意のペイロードフィールド: `migrateOwner`。`ownerHandle` とともに `true` にすると、実行者が現在と移行先の両方のパブリッシャーで管理者／所有者である場合、既存の Skills をその所有者へ移動できます。このオプトインがない場合、所有者の変更は拒否されます。

### `POST /api/v1/packages`

code-plugin または bundle-plugin のリリースを公開します。

- Bearer トークン認証が必要です。
- `multipart/form-data` が必要です。
- 使用可能なフォームフィールドは、`payload`、繰り返し指定する `files` Blob、または1つの `clawpack` tarball 参照です。`clawpack` には `.tgz` Blob、またはアップロード URL フローで返されたストレージ ID を指定できます。ステージング済みストレージ ID を使用する公開では、そのアップロード URL とともに返された `clawpackUploadTicket` も含める必要があります。
- `files` または `clawpack` のいずれか一方を使用し、同じリクエスト内で両方を使用しないでください。
- JSON ボディと、呼び出し元が指定する `payload.files`／`payload.artifact` メタデータは拒否されます。
- 直接 multipart 公開リクエストの上限は18MBです。ClawPack tarball は、アップロード URL フローを使用して tarball 上限の120MBまでアップロードできます。
- 任意のペイロードフィールド: `ownerHandle`。指定した場合、その所有者に代わって公開できるのは管理者のみです。

主な検証事項:

- `family` は `code-plugin` または `bundle-plugin` である必要があります。
- Plugin パッケージには `openclaw.plugin.json` が必要です。ClawPack の `.tgz` アップロードでは、`package/openclaw.plugin.json` に含める必要があります。
- コード Plugin には、`package.json`、ソースリポジトリメタデータ、ソースコミットメタデータ、設定スキーマメタデータ、`openclaw.compat.pluginApi`、`openclaw.build.openclawVersion` が必要です。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
- `official` チャンネルへ公開できるのは、`openclaw` 組織パブリッシャーと、現在の `openclaw` 組織メンバーの個人パブリッシャーのみです。
- 代理公開の場合も、対象の所有者アカウントに対して公式チャンネルへの適格性を検証します。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skills を論理削除／復元します（所有者、モデレーター、または管理者）。

任意の JSON ボディ:

```json
{ "reason": "Held for moderation pending legal review." }
```

指定すると、`reason` は Skills のモデレーションメモとして保存され、監査ログにコピーされます。
所有者が開始した論理削除では slug が30日間予約され、その後は別のパブリッシャーが取得できます。この有効期限が適用される場合、削除レスポンスに `slugReservedUntil` が含まれます。
モデレーター／管理者による非表示化およびセキュリティ上の削除には、この有効期限は適用されません。

削除レスポンス:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

ステータスコード:

- `200`: 成功
- `401`: 未認証
- `403`: 禁止
- `404`: Skills／ユーザーが見つかりません
- `500`: サーバー内部エラー

### `POST /api/v1/users/publisher`

管理者専用。指定したハンドルの組織パブリッシャーが存在することを保証します。ハンドルが引き続き従来の共有ユーザー／個人パブリッシャーを指している場合、このエンドポイントは最初に組織パブリッシャーへ移行します。
新しく組織を作成する場合は `memberHandle` を指定します。操作を実行する管理者はメンバーとして追加されません。
`memberRole` のデフォルトは `owner` です。

- ボディ: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- レスポンス: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

認証済みユーザーがセルフサービスで組織パブリッシャーを作成します。新しい組織パブリッシャーを作成し、呼び出し元を所有者として追加します。このエンドポイントは、既存のユーザー／個人ハンドルを移行せず、パブリッシャーを信頼済み／公式としてマークしません。

- ボディ: `{ "handle": "opik", "displayName": "Opik" }`
- レスポンス: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ハンドルがパブリッシャー、ユーザー、または個人パブリッシャーによってすでに使用されている場合は `409` を返します。

### `POST /api/v1/users/reserve`

管理者専用。リリースを公開せずに、正当な所有者のためにルート slug とパッケージ名を予約します。パッケージ名はリリース行を持たない非公開のプレースホルダーパッケージになるため、同じ所有者が後で実際の code-plugin または bundle-plugin のリリースをその名前で公開できます。

- ボディ: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- レスポンス: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

管理者専用。Convex Auth のアカウント行を編集せずに、検証済みの代替 GitHub OAuth プリンシパルに対して個人パブリッシャーを復旧します。リクエストには、不変の GitHub プロバイダーアカウント ID を両方とも指定する必要があります。変更可能なハンドルは、オペレーター向けのガードとしてのみ使用されます。

エンドポイントはデフォルトでドライランになります。復旧を適用するには、スタッフが両方の
GitHub プリンシパル間の連続性を個別に検証した後、`dryRun: false` と
`confirmIdentityVerified: true` を指定する必要があります。移行先ユーザーの現在の個人
パブリッシャーに Skills、パッケージ、または GitHub Skills ソースがある場合、復旧は安全側に失敗します。
また、復旧では、復旧対象パブリッシャーの Skills、Skills スラッグエイリアス、パッケージ、
パッケージインスペクターの警告、および派生検索ダイジェスト行にある従来の `ownerUserId`
フィールドも移行され、直接所有者のパスが新しいパブリッシャー権限と一致するようになります。
復旧されたハンドルに有効な保護対象ハンドル予約がある場合、それも置換先ユーザーに再割り当てされるため、
その後のプロフィール同期で以前のユーザーの競合する権限が復元されることはありません。各プライマリテーブルは
適用トランザクションごとに100行に制限されます。より大規模な復旧では、まず再開可能な所有者移行を使用する必要があります。
GitHub Skills ソースはパブリッシャー単位で管理され、書き換えられるのではなく確認済みとして報告されます。

- 本文: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- レスポンス: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### 所有者スラッグ管理エンドポイント

- `POST /api/v1/skills/{slug}/rename`
  - 本文: `{ "newSlug": "new-canonical-slug" }`
  - レスポンス: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文: `{ "targetSlug": "canonical-target-slug" }`
  - レスポンス: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注記:

- どちらのエンドポイントも API トークン認証が必要で、Skills の所有者のみが使用できます。
- `rename` は以前のスラッグをリダイレクトエイリアスとして保持します。
- `merge` は移行元の一覧を非表示にし、移行元スラッグを移行先の一覧にリダイレクトします。

### 所有権移管エンドポイント

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

ユーザーを禁止し、そのユーザーが所有する Skills を完全削除します（モデレーター/管理者のみ）。

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

ユーザーの禁止を解除し、対象となる Skills を復元します（管理者のみ）。

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

禁止を解除したりコンテンツを復元したりすることなく、既存の禁止について保存されている理由を変更します
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

ユーザーを一覧表示または検索します（管理者のみ）。

クエリパラメーター:

- `q`（任意）: 検索クエリ
- `query`（任意）: `q` のエイリアス
- `limit`（任意）: 最大結果数（デフォルト20、最大200）

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

## 従来の CLI エンドポイント（非推奨）

古い CLI バージョン向けに引き続きサポートされています。

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

削除計画については `DEPRECATIONS.md` を参照してください。

`POST /api/cli/upload-url` は `uploadUrl` と `uploadTicket` を返します。ClawPack の tarball を
ステージングするパッケージ公開では、生成されたストレージ ID を `clawpack` として、返されたチケットを
`clawpackUploadTicket` として送信する必要があります。

## レジストリ検出（`/.well-known/clawhub.json`）

CLI はサイトからレジストリ/認証設定を検出できます。

- `/.well-known/clawhub.json`（JSON、推奨）
- `/.well-known/clawdhub.json`（従来形式）

スキーマ:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

セルフホストする場合は、このファイルを配信してください（または `CLAWHUB_REGISTRY` を明示的に設定します。従来の変数は `CLAWDHUB_REGISTRY` です）。
