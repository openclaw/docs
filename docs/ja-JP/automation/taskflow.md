---
read_when:
    - Task Flow とバックグラウンドタスクの関係を理解したい
    - リリースノートやドキュメントで Task Flow または openclaw tasks flow に遭遇します
    - 永続的なフロー状態を確認または管理したい場合
summary: バックグラウンドタスクの上位にあるタスクフローのフローオーケストレーション層
title: タスクフロー
x-i18n:
    generated_at: "2026-04-30T04:57:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flowは、[バックグラウンドタスク](/ja-JP/automation/tasks)の上位に位置するフローオーケストレーション基盤です。独立したタスクが切り離された作業の単位であり続ける一方で、Task Flowは独自の状態、リビジョン追跡、同期セマンティクスを持つ、耐久性のある複数ステップのフローを管理します。

## Task Flowを使う場面

作業が複数の順次ステップまたは分岐ステップにまたがり、Gatewayの再起動をまたいで耐久性のある進行状況追跡が必要な場合は、Task Flowを使用します。単一のバックグラウンド操作には、通常の[タスク](/ja-JP/automation/tasks)で十分です。

| シナリオ                              | 使用するもの                  |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ                 | 通常のタスク           |
| 複数ステップのパイプライン（Aの後にB、その後にC） | Task Flow（管理対象）  |
| 外部で作成されたタスクを監視する      | Task Flow（ミラー） |
| 1回限りのリマインダー                     | Cronジョブ             |

## 信頼性の高いスケジュール済みワークフローパターン

市場インテリジェンスのブリーフィングのような定期ワークフローでは、スケジュール、オーケストレーション、信頼性チェックを別々のレイヤーとして扱います。

1. タイミングには[スケジュール済みタスク](/ja-JP/automation/cron-jobs)を使用します。
2. ワークフローが以前のコンテキストを積み重ねる必要がある場合は、永続的なcronセッションを使用します。
3. 決定的なステップ、承認ゲート、再開トークンには[Lobster](/ja-JP/tools/lobster)を使用します。
4. 子タスク、待機、再試行、Gatewayの再起動をまたいで複数ステップの実行を追跡するには、Task Flowを使用します。

cronの形の例:

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

定期ワークフローに意図的な履歴、前回実行の要約、または継続的なコンテキストが必要な場合は、`isolated`の代わりに`session:<id>`を使用します。各実行を新規に開始し、必要な状態がすべてワークフロー内で明示されているべき場合は、`isolated`を使用します。

ワークフロー内では、LLMの要約ステップの前に信頼性チェックを置きます。

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

- ブラウザーの可用性とプロファイルの選択。たとえば、管理された状態には`openclaw`、サインイン済みのChromeセッションが必要な場合は`user`を使用します。[Browser](/ja-JP/tools/browser)を参照してください。
- 各ソースのAPI認証情報とクォータ。
- 必要なエンドポイントへのネットワーク到達性。
- エージェントに対して必要なツール（`lobster`、`browser`、`llm-task`など）が有効であること。
- 事前チェックの失敗が見えるように、cronの失敗先が設定されていること。[スケジュール済みタスク](/ja-JP/automation/cron-jobs#delivery-and-output)を参照してください。

収集された各項目に推奨されるデータ来歴フィールド:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

要約の前に、ワークフローで古い項目を拒否または古いものとしてマークします。LLMステップには構造化JSONのみを渡し、出力で`sourceUrl`、`retrievedAt`、`asOf`を保持するよう求めるべきです。ワークフロー内でスキーマ検証済みのモデルステップが必要な場合は、[LLM Task](/ja-JP/tools/llm-task)を使用します。

チームまたはコミュニティで再利用できるワークフローでは、CLI、`.lobster`ファイル、セットアップメモをSkillまたはPluginとしてパッケージ化し、[ClawHub](/ja-JP/tools/clawhub)を通じて公開します。Plugin APIに必要な汎用機能が欠けていない限り、ワークフロー固有のガードレールはそのパッケージ内に保持します。

## 同期モード

### 管理モード

Task Flowはライフサイクル全体を所有します。フローステップとしてタスクを作成し、それらを完了まで進め、フロー状態を自動的に前進させます。

例: （1）データを収集し、（2）レポートを生成し、（3）配信する週次レポートフロー。Task Flowは各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに進みます。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### ミラーモード

Task Flowは外部で作成されたタスクを監視し、タスク作成の所有権を持たずにフロー状態の同期を維持します。これは、タスクがcronジョブ、CLIコマンド、またはその他のソースから発生し、その進行状況をフローとして統一されたビューで確認したい場合に便利です。

例: 3つの独立したcronジョブが一緒になって「morning ops」ルーチンを形成する場合。ミラーフローは、それらがいつ、どのように実行されるかを制御せずに、全体の進行状況を追跡します。

## 耐久性のある状態とリビジョン追跡

各フローは独自の状態を永続化し、リビジョンを追跡するため、Gatewayの再起動後も進行状況が保持されます。リビジョン追跡により、複数のソースが同じフローを同時に前進させようとしたときに競合を検出できます。
フローレジストリは、定期チェックポイントとシャットダウン時チェックポイントを含む、範囲が制限された先行書き込みログのメンテナンスを備えたSQLiteを使用します。そのため、長時間稼働するGatewayが無制限の`registry.sqlite-wal`サイドカーファイルを保持することはありません。

## キャンセル動作

`openclaw tasks flow cancel`は、フローに粘着的なキャンセル意図を設定します。フロー内のアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意図は再起動をまたいで保持されるため、すべての子タスクが終了する前にGatewayが再起動した場合でも、キャンセルされたフローはキャンセルされたままになります。

## CLIコマンド

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
| `openclaw tasks flow list`        | 追跡中のフローを状態と同期モード付きで表示します |
| `openclaw tasks flow show <id>`   | フローIDまたは検索キーで1つのフローを検査します     |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセルします    |

## フローとタスクの関係

フローはタスクを置き換えるのではなく、調整します。1つのフローは、そのライフタイム中に複数のバックグラウンドタスクを駆動できます。個々のタスクレコードを検査するには`openclaw tasks`を使用し、オーケストレーションを行うフローを検査するには`openclaw tasks flow`を使用します。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — フローが調整する、切り離された作業の台帳
- [CLI: tasks](/ja-JP/cli/tasks) — `openclaw tasks flow`のCLIコマンドリファレンス
- [自動化の概要](/ja-JP/automation) — すべての自動化メカニズムの概観
- [Cronジョブ](/ja-JP/automation/cron-jobs) — フローに供給される可能性があるスケジュール済みジョブ
