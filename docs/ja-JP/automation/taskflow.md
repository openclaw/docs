---
read_when:
    - Task Flow がバックグラウンドタスクとどのように関係するかを理解したい
    - リリースノートやドキュメントで Task Flow または openclaw tasks flow に遭遇する
    - 永続的なフロー状態を確認または管理したい
summary: バックグラウンドタスク上位の Task Flow オーケストレーションレイヤー
title: タスクフロー
x-i18n:
    generated_at: "2026-07-05T11:01:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow は [バックグラウンドタスク](/ja-JP/automation/tasks) の上位にあるオーケストレーションレイヤーです。フローは、独自のステータス、JSON 状態、リビジョンカウンター、リンクされたタスクレコードを持つ、複数ステップの作業の永続レコードです。フローは gateway の再起動後も存続します。個々のタスクは、切り離された作業の単位のままです。

## Task Flow を使う場合

| シナリオ                                  | 用途                                         |
| ----------------------------------------- | ------------------------------------------- |
| 単一のバックグラウンドジョブ                     | 通常のタスク                                  |
| plugin コードで駆動される複数ステップのパイプライン | Task Flow（管理対象）                         |
| 切り離された ACP またはサブエージェントの起動       | Task Flow（ミラー、作成は自動） |
| 1 回限りのリマインダー                         | Cron ジョブ                                    |

## 同期モード

### 管理対象モード

管理対象フローにはコントローラーがあります。これは、plugin runtime の Task Flow API を通じて、目標と必須のコントローラー ID を指定してフローを作成し、その後明示的に進行させる plugin コードです。

- 各ステップは、フロー配下に作成されたバックグラウンドタスクとして実行されます。フローの所有者キーとリクエスターのオリジンは子タスクに引き継がれます。
- コントローラーはフローを `running`、`waiting`、終端状態の間で進め、任意の JSON ステップ状態をフローレコードに保存します。
- すべての変更は、フローの期待リビジョンを渡します。古い書き込みは新しい状態を上書きせず、リビジョン競合として拒否されます。
- キャンセルが要求されると、新しい子タスクは拒否され、アクティブな子タスクがなくなった時点でフローは `cancelled` として確定します。

例: (1) データを収集し、(2) レポートを生成し、(3) 配信する週次レポートフロー。各ステップに 1 つのバックグラウンドタスクを使います。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### ミラーモード

OpenClaw は、切り離された ACP またはサブエージェント実行（成果物の完了を伴うセッションスコープのタスク）が開始されると、1 タスクのミラーフローを自動的に作成します。フローレコードは、単一の裏付けタスクのステータス、目標、タイミングをミラーするため、切り離された起動は、コントローラーなしでステータスと再試行サーフェスに安定したフローハンドルを取得できます。ミラーフローは CLI で同期モード `task_mirrored` と表示されます。

## フローのステータス

| ステータス      | 意味                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 作成済みで、まだ進行していない                                               |
| `running`   | フローがアクティブに進行中                                               |
| `waiting`   | 管理対象フローが待機メタデータ（タイマー、外部イベント）で停止している            |
| `blocked`   | ステップが利用可能な結果なしで完了した。`blockedTaskId`/summary が対象を示す |
| `succeeded` | 正常に完了                                                     |
| `failed`    | エラーで完了                                                    |
| `cancelled` | キャンセルが要求され、すべての子タスクが確定済み                               |
| `lost`      | フローが権威ある裏付け状態を失った                                  |

## 永続状態とリビジョン追跡

フローレコードは、タスクレコードとともに共有 SQLite 状態データベース（`~/.openclaw/state/openclaw.sqlite`、`flow_runs` テーブル）に永続化されるため、gateway の再起動後も進行状況が維持されます。各書き込みはフローの `revision` を増やします。古い期待リビジョンを渡した同時書き込みは競合となり、再読み込みが必要です。WAL の増加は、SQLite の自動チェックポイントと定期的なパッシブチェックポイントにより制限され、シャットダウン時には truncate チェックポイントが実行されます。古いインストールにあるレガシーな `flows/registry.sqlite` サイドカーは `openclaw doctor` によってインポートされます。

## キャンセル動作

`openclaw tasks flow cancel` はフローに固定のキャンセル意図を設定し、アクティブな子タスクをキャンセルし、新しい管理対象の子タスクを拒否します。アクティブな子タスクがなくなると、フローは `cancelled` として確定します。これは即時に行われるか、子タスクの確定に時間がかかる場合はメンテナンススイープ経由で行われます。この意図は永続化されるため、すべての子タスクが終了する前に gateway が再起動しても、キャンセル済みフローはキャンセル済みのままです。

## CLI コマンド

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| コマンド                           | 説明                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| `openclaw tasks flow list`        | 同期モード、ステータス、リビジョン、コントローラー、タスク数を含む追跡対象フロー |
| `openclaw tasks flow show <id>`   | フロー ID または所有者キーで 1 つのフローを確認し、リンクされたタスクも含める        |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセル                              |

フローは `openclaw tasks audit`（古い、または壊れたフローの検出）と `openclaw tasks maintenance`（停止したキャンセルを確定し、終端フローを 7 日後に削除）にも含まれます。

## 信頼性の高いスケジュール済みワークフローパターン

市場インテリジェンスのブリーフィングなどの繰り返しワークフローでは、スケジュール、オーケストレーション、信頼性チェックを別々のレイヤーとして扱います。

1. タイミングには [スケジュール済みタスク](/ja-JP/automation/cron-jobs) を使います。
2. ワークフローが以前のコンテキストを基に構築されるべき場合は、永続 Cron セッションを使います。
3. 決定論的なステップ、承認ゲート、再開トークンには [Lobster](/ja-JP/tools/lobster) を使います。
4. 子タスク、待機、再試行、gateway の再起動をまたいで複数ステップの実行を追跡するには Task Flow を使います。

Cron の形の例:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

繰り返しワークフローに意図的な履歴、前回実行の要約、または継続的なコンテキストが必要な場合は、`isolated` ではなく `--session session:<id>` を使います。各実行を新規に開始し、必要な状態がすべてワークフロー内で明示されているべき場合は `isolated` を使います。

ワークフロー内では、LLM 要約ステップの前に信頼性チェックを置きます。

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

推奨されるプリフライトチェック:

- Browser の可用性とプロファイル選択。たとえば、管理対象状態には `openclaw`、サインイン済み Chrome セッションが必要な場合は `user`。詳しくは [Browser](/ja-JP/tools/browser) を参照してください。
- 各ソースの API 認証情報とクォータ。
- 必要なエンドポイントへのネットワーク到達性。
- `lobster`、`browser`、`llm-task` など、エージェントに必要なツールが有効であること。
- プリフライト失敗が見えるように、Cron の失敗先が設定されていること。詳しくは [スケジュール済みタスク](/ja-JP/automation/cron-jobs#delivery-and-output) を参照してください。

収集された各項目に推奨されるデータ由来フィールド:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

ワークフローでは、要約前に古い項目を拒否するか、古いものとしてマークします。LLM ステップには構造化 JSON のみを渡し、出力で `sourceUrl`、`retrievedAt`、`asOf` を保持するよう指示する必要があります。ワークフロー内でスキーマ検証済みのモデルステップが必要な場合は、[LLM Task](/ja-JP/tools/llm-task) を使います。

再利用可能なチームまたはコミュニティ向けワークフローでは、CLI、`.lobster` ファイル、セットアップメモを skill または plugin としてパッケージ化し、[ClawHub](/ja-JP/clawhub) を通じて公開します。plugin API に必要な汎用機能が欠けている場合を除き、ワークフロー固有のガードレールはそのパッケージ内に保持します。

## フローとタスクの関係

フローはタスクを調整するものであり、置き換えるものではありません。1 つのフローは、その存続期間中に複数のバックグラウンドタスクを駆動できます。個々のタスクレコードを確認するには `openclaw tasks` を使い、オーケストレーションするフローを確認するには `openclaw tasks flow` を使います。

## 関連項目

- [バックグラウンドタスク](/ja-JP/automation/tasks) - フローが調整する、切り離された作業の台帳
- [CLI: tasks](/ja-JP/cli/tasks) - `openclaw tasks flow` の CLI コマンドリファレンス
- [自動化の概要](/ja-JP/automation) - すべての自動化メカニズムの概要
- [Cron ジョブ](/ja-JP/automation/cron-jobs) - フローに供給されることがあるスケジュール済みジョブ
