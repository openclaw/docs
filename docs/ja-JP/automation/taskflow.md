---
read_when:
    - Task Flow とバックグラウンドタスクの関係を理解したい場合
    - リリースノートやドキュメントで「Task Flow」または「openclaw tasks flow」に出会う
    - 永続的なフロー状態を検査または管理したい
summary: バックグラウンドタスクの上位にあるタスクフローオーケストレーションレイヤー
title: タスクフロー
x-i18n:
    generated_at: "2026-06-27T10:30:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

タスクフローは、[バックグラウンドタスク](/ja-JP/automation/tasks)の上位に位置するフローオーケストレーション基盤です。個々のタスクを分離された作業の単位のままにしつつ、独自の状態、リビジョン追跡、同期セマンティクスを持つ永続的な複数ステップのフローを管理します。

## タスクフローを使う場合

作業が複数の連続ステップまたは分岐ステップにまたがり、Gateway の再起動を越えて永続的な進捗追跡が必要な場合は、タスクフローを使用します。単一のバックグラウンド操作には、通常の[タスク](/ja-JP/automation/tasks)で十分です。

| シナリオ                              | 使用                  |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ                 | 通常のタスク           |
| 複数ステップのパイプライン（A の後に B、その後 C） | タスクフロー（管理）  |
| 外部で作成されたタスクを監視      | タスクフロー（ミラーリング） |
| 1回限りのリマインダー                     | Cron ジョブ             |

## 信頼性の高いスケジュール済みワークフローパターン

マーケットインテリジェンスのブリーフィングなどの定期ワークフローでは、スケジュール、オーケストレーション、信頼性チェックを別々のレイヤーとして扱います。

1. タイミングには[スケジュール済みタスク](/ja-JP/automation/cron-jobs)を使用します。
2. ワークフローが以前のコンテキストを引き継ぐ必要がある場合は、永続的な cron セッションを使用します。
3. 決定的なステップ、承認ゲート、再開トークンには [Lobster](/ja-JP/tools/lobster) を使用します。
4. 子タスク、待機、再試行、Gateway の再起動をまたいだ複数ステップの実行を追跡するには、タスクフローを使用します。

cron の形の例:

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

定期ワークフローに意図的な履歴、前回実行の要約、または常設コンテキストが必要な場合は、`isolated` の代わりに `session:<id>` を使用します。各実行を新規に開始し、必要な状態がすべてワークフロー内で明示されている場合は、`isolated` を使用します。

ワークフロー内では、LLM 要約ステップの前に信頼性チェックを配置します。

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

推奨される事前チェック:

- ブラウザーの可用性とプロファイルの選択。たとえば、管理対象状態には `openclaw`、サインイン済み Chrome セッションが必要な場合は `user` を使用します。[ブラウザー](/ja-JP/tools/browser)を参照してください。
- 各ソースの API 認証情報とクォータ。
- 必須エンドポイントへのネットワーク到達性。
- エージェントに対して有効化された必須ツール（`lobster`、`browser`、`llm-task` など）。
- 事前チェックの失敗が見えるように、cron の失敗時の配信先が構成されていること。[スケジュール済みタスク](/ja-JP/automation/cron-jobs#delivery-and-output)を参照してください。

収集された各項目に推奨されるデータ出所フィールド:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

要約の前に、ワークフローで古い項目を拒否またはマークするようにします。LLM ステップには構造化 JSON のみを渡し、出力内で `sourceUrl`、`retrievedAt`、`asOf` を保持するよう求める必要があります。ワークフロー内でスキーマ検証済みのモデルステップが必要な場合は、[LLMタスク](/ja-JP/tools/llm-task)を使用します。

チームまたはコミュニティで再利用できるワークフローでは、CLI、`.lobster` ファイル、セットアップメモを Skills または Plugin としてパッケージ化し、[ClawHub](/ja-JP/clawhub)を通じて公開します。Plugin API に必要な汎用機能が不足していない限り、ワークフロー固有のガードレールはそのパッケージ内に保持します。

## 同期モード

### 管理モード

タスクフローがライフサイクルをエンドツーエンドで所有します。フローのステップとしてタスクを作成し、それらを完了まで進め、フロー状態を自動的に進行させます。

例: (1) データを収集し、(2) レポートを生成し、(3) 配信する週次レポートフロー。タスクフローは各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに移ります。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### ミラーリングモード

タスクフローは外部で作成されたタスクを監視し、タスク作成の所有権を持たずにフロー状態を同期します。これは、タスクが cron ジョブ、CLI コマンド、またはその他のソースから発生し、それらの進捗をフローとして統一的に表示したい場合に便利です。

例: 3つの独立した cron ジョブが一緒に「朝の運用」ルーチンを形成する場合。ミラーリングされたフローは、それらをいつ、どのように実行するかを制御せずに、全体の進捗を追跡します。

## 永続状態とリビジョン追跡

各フローは独自の状態を永続化し、リビジョンを追跡するため、Gateway の再起動後も進捗が維持されます。複数のソースが同じフローを同時に進めようとした場合、リビジョン追跡によって競合を検出できます。
フローレジストリは SQLite を使用し、長時間稼働する Gateway が
無制限の `registry.sqlite-wal` サイドカーファイルを保持しないように、
定期チェックポイントとシャットダウン時チェックポイントを含む、境界付きの write-ahead-log メンテナンスを行います。

## キャンセル動作

`openclaw tasks flow cancel` は、フローに固定のキャンセル意図を設定します。フロー内のアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意図は再起動を越えて保持されるため、すべての子タスクが終了する前に Gateway が再起動しても、キャンセルされたフローはキャンセルされたままになります。

## CLI コマンド

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| コマンド                           | 説明                                   |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | 追跡中のフローをステータスと同期モード付きで表示します |
| `openclaw tasks flow show <id>`   | フロー ID または lookup キーで1つのフローを検査します     |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセルします    |

## フローとタスクの関係

フローはタスクを置き換えるものではなく、タスクを調整します。1つのフローは、そのライフタイム中に複数のバックグラウンドタスクを駆動できます。個々のタスクレコードを検査するには `openclaw tasks` を使用し、オーケストレーションを行うフローを検査するには `openclaw tasks flow` を使用します。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — フローが調整する分離作業の台帳
- [CLI: tasks](/ja-JP/cli/tasks) — `openclaw tasks flow` の CLI コマンドリファレンス
- [自動化の概要](/ja-JP/automation) — すべての自動化メカニズムの一覧
- [Cron ジョブ](/ja-JP/automation/cron-jobs) — フローに供給される可能性があるスケジュール済みジョブ
