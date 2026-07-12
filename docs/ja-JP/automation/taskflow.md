---
read_when:
    - Task Flow とバックグラウンドタスクの関係を理解したい場合
    - リリースノートやドキュメントで Task Flow または openclaw tasks flow という表記を目にすることがあります
    - 永続的なフロー状態を確認または管理したい場合
summary: バックグラウンドタスク上のTask Flowオーケストレーションレイヤー
title: タスクフロー
x-i18n:
    generated_at: "2026-07-11T22:00:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow は、[バックグラウンドタスク](/ja-JP/automation/tasks)の上位に位置するオーケストレーションレイヤーです。フローは複数ステップの作業を永続的に記録し、固有のステータス、JSON 状態、リビジョンカウンター、リンクされたタスクレコードを持ちます。フローは Gateway の再起動後も維持されますが、個々のタスクは引き続き切り離された作業の単位です。

## Task Flow を使用する場面

| シナリオ                                  | 使用するもの                                         |
| ----------------------------------------- | ------------------------------------------- |
| 単一のバックグラウンドジョブ                     | 通常のタスク                                  |
| Plugin コードで駆動する複数ステップのパイプライン | Task Flow（管理モード）                         |
| 切り離された ACP またはサブエージェントの起動            | Task Flow（ミラーモード、自動作成） |
| 1 回限りのリマインダー                         | Cron ジョブ                                    |

## 同期モード

### 管理モード

管理モードのフローにはコントローラーがあります。これは、目標と必須のコントローラー ID を指定して Plugin ランタイムの Task Flow API 経由でフローを作成し、明示的に駆動する Plugin コードです。

- 各ステップはフロー配下に作成されたバックグラウンドタスクとして実行されます。フローの所有者キーと要求元のオリジンは子タスクに引き継がれます。
- コントローラーはフローを `running`、`waiting`、終了状態の間で進行させ、任意の JSON ステップ状態をフローレコードに保存します。
- すべての変更操作で、フローの期待リビジョンを渡します。古い書き込みは新しい状態を上書きせず、リビジョン競合として拒否されます。
- キャンセルが要求されると、新しい子タスクは拒否され、アクティブな子タスクがなくなった時点でフローは `cancelled` として終了します。

例：毎週のレポートフローで、(1) データを収集し、(2) レポートを生成し、(3) 配信します。各ステップにつき 1 つのバックグラウンドタスクを使用します。

```
フロー: weekly-report
  ステップ 1: gather-data     → タスク作成 → 成功
  ステップ 2: generate-report → タスク作成 → 成功
  ステップ 3: deliver         → タスク作成 → 実行中
```

### ミラーモード

切り離された ACP またはサブエージェントの実行（配信可能な完了結果を持つセッションスコープのタスク）が開始されると、OpenClaw は 1 タスクのミラーフローを自動的に作成します。フローレコードは、単一の基盤タスクのステータス、目標、タイミングを反映します。これにより、切り離された起動はコントローラーなしでも、ステータス確認と再試行のための安定したフローハンドルを得られます。ミラーフローの同期モードは CLI で `task_mirrored` と表示されます。

## フローのステータス

| ステータス      | 意味                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 作成済みで、まだ進行していない                                               |
| `running`   | フローが進行中                                               |
| `waiting`   | 管理モードのフローが待機メタデータ（タイマー、外部イベント）で一時停止中            |
| `blocked`   | ステップが使用可能な結果なしで終了。`blockedTaskId`/概要が該当箇所を示す |
| `succeeded` | 正常に完了                                                     |
| `failed`    | エラーで完了                                                    |
| `cancelled` | キャンセルが要求され、すべての子タスクが終了済み                               |
| `lost`      | フローが信頼できる基盤状態を喪失                                  |

## 永続状態とリビジョン追跡

フローレコードはタスクレコードとともに共有 SQLite 状態データベース（`~/.openclaw/state/openclaw.sqlite` の `flow_runs` テーブル）に永続化されるため、Gateway の再起動後も進行状況が維持されます。書き込みのたびにフローの `revision` が増加します。古い期待リビジョンを渡した並行書き込みは競合となり、再読み込みが必要です。WAL の増加は、SQLite の自動チェックポイントと定期的なパッシブチェックポイント、およびシャットダウン時のトランケートチェックポイントによって制限されます。旧バージョンで使用されていた従来の `flows/registry.sqlite` サイドカーは、`openclaw doctor` によってインポートされます。

## キャンセル動作

`openclaw tasks flow cancel` はフローに保持されるキャンセル意図を設定し、アクティブな子タスクをキャンセルして、新しい管理対象の子タスクを拒否します。アクティブな子タスクがなくなると、フローは即座に、または子タスクの終了に時間がかかる場合はメンテナンススイープによって `cancelled` として終了します。この意図は永続化されるため、すべての子タスクが終了する前に Gateway が再起動しても、キャンセルされたフローはキャンセル状態を維持します。

## CLI コマンド

```bash
# アクティブおよび最近のフローを一覧表示
openclaw tasks flow list [--status <status>] [--json]

# 特定のフローの詳細を表示
openclaw tasks flow show <lookup> [--json]

# 実行中のフローとそのアクティブなタスクをキャンセル
openclaw tasks flow cancel <lookup>
```

| コマンド                           | 説明                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| `openclaw tasks flow list`        | 同期モード、ステータス、リビジョン、コントローラー、タスク数を含む追跡対象フロー |
| `openclaw tasks flow show <id>`   | フロー ID または所有者キーで、リンクされたタスクを含む 1 つのフローを確認        |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセル                              |

フローは `openclaw tasks audit`（古いフローや破損したフローの検出）と `openclaw tasks maintenance`（停止したキャンセルを終了し、7 日後に終了済みフローを削除）の対象にも含まれます。

## 信頼性の高いスケジュール済みワークフローパターン

市場情報ブリーフィングなどの定期的なワークフローでは、スケジュール、オーケストレーション、信頼性チェックを別々のレイヤーとして扱います。

1. タイミングには[スケジュール済みタスク](/ja-JP/automation/cron-jobs)を使用します。
2. ワークフローで以前のコンテキストを活用する場合は、永続的な Cron セッションを使用します。
3. 決定論的なステップ、承認ゲート、再開トークンには [Lobster](/ja-JP/tools/lobster) を使用します。
4. 子タスク、待機、再試行、Gateway の再起動にまたがる複数ステップの実行を追跡するには Task Flow を使用します。

Cron の構成例：

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

定期的なワークフローで意図的に履歴、以前の実行概要、または常設コンテキストを必要とする場合は、`isolated` ではなく `--session session:<id>` を使用します。各実行を新しい状態で開始し、必要なすべての状態がワークフローに明示されている場合は `isolated` を使用します。

ワークフロー内では、LLM の要約ステップより前に信頼性チェックを配置します。

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

推奨される事前チェック：

- ブラウザーの利用可否とプロファイルの選択。たとえば、管理状態には `openclaw`、サインイン済みの Chrome セッションが必要な場合は `user` を使用します。[ブラウザー](/ja-JP/tools/browser)を参照してください。
- 各ソースの API 認証情報とクォータ。
- 必要なエンドポイントへのネットワーク到達性。
- `lobster`、`browser`、`llm-task` など、エージェントに必要なツールが有効になっていること。
- 事前チェックの失敗を確認できるよう、Cron の失敗時の送信先が設定されていること。[スケジュール済みタスク](/ja-JP/automation/cron-jobs#delivery-and-output)を参照してください。

収集する各項目に推奨されるデータ来歴フィールド：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

要約前に、ワークフローで古い項目を拒否するか、古い項目としてマークします。LLM ステップには構造化 JSON のみを渡し、出力で `sourceUrl`、`retrievedAt`、`asOf` を保持するよう指示します。ワークフロー内でスキーマ検証済みのモデルステップが必要な場合は、[LLM タスク](/ja-JP/tools/llm-task)を使用します。

チームやコミュニティで再利用できるワークフローでは、CLI、`.lobster` ファイル、セットアップ手順を Skill または Plugin としてパッケージ化し、[ClawHub](/clawhub)を通じて公開します。Plugin API に必要な汎用機能が不足している場合を除き、ワークフロー固有のガードレールはそのパッケージ内に保持します。

## フローとタスクの関係

フローはタスクを置き換えるのではなく、連携させます。1 つのフローは、その存続期間中に複数のバックグラウンドタスクを駆動できます。個々のタスクレコードを確認するには `openclaw tasks`、オーケストレーションを行うフローを確認するには `openclaw tasks flow` を使用します。

## 関連項目

- [バックグラウンドタスク](/ja-JP/automation/tasks) - フローが連携させる切り離された作業の台帳
- [CLI：タスク](/ja-JP/cli/tasks) - `openclaw tasks flow` の CLI コマンドリファレンス
- [自動化の概要](/ja-JP/automation) - すべての自動化メカニズムの一覧
- [Cron ジョブ](/ja-JP/automation/cron-jobs) - フローに処理を渡す可能性があるスケジュール済みジョブ
