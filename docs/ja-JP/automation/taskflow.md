---
read_when:
    - TaskFlow がバックグラウンドタスクとどのように関係するかを理解したい場合
    - リリースノートやドキュメントでタスクフローまたは openclaw tasks flow を見かける
    - 永続的なフロー状態を調査または管理したい
summary: バックグラウンドタスクの上位にあるタスクフローのオーケストレーションレイヤー
title: タスクフロー
x-i18n:
    generated_at: "2026-07-02T00:42:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flowは、[バックグラウンドタスク](/ja-JP/automation/tasks)の上位に位置するフローオーケストレーション基盤です。個々のタスクは切り離された作業の単位のまま、Task Flowは独自の状態、リビジョン追跡、同期セマンティクスを持つ耐久性のある複数ステップのフローを管理します。

## Task Flowを使う場合

作業が複数の順次ステップまたは分岐ステップにまたがり、Gatewayの再起動をまたいで耐久性のある進行状況追跡が必要な場合はTask Flowを使用します。単一のバックグラウンド操作には、通常の[タスク](/ja-JP/automation/tasks)で十分です。

| シナリオ                              | 使用するもの                  |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ                 | 通常のタスク           |
| 複数ステップのパイプライン（Aの後にB、その後C） | Task Flow（管理）  |
| 外部で作成されたタスクを監視する      | Task Flow（ミラー） |
| 1回限りのリマインダー                     | Cronジョブ             |

## 信頼性の高いスケジュール済みワークフローパターン

市場インテリジェンスのブリーフィングなどの繰り返しワークフローでは、スケジュール、オーケストレーション、信頼性チェックを別々のレイヤーとして扱います。

1. タイミングには[スケジュール済みタスク](/ja-JP/automation/cron-jobs)を使用します。
2. 以前のコンテキストは、ワークフロー独自のファイル、データベース、またはツール状態に保存します。
3. 決定論的なステップ、承認ゲート、再開トークンには[Lobster](/ja-JP/tools/lobster)を使用します。
4. 子タスク、待機、再試行、Gateway再起動をまたいで複数ステップの実行を追跡するにはTask Flowを使用します。

Cronの形の例:

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

ジョブが配信コンテキストや安全な設定シードのために既知のチャット/セッションを対象にする必要がある場合は、`session:<id>`を使用します。Cronはそれでも各実行を切り離されたセッションで実行するため、前回実行の要約や常設のワークフロー状態は、ジョブが読み取れる明示的なストレージに置いてください。

ワークフロー内では、LLM要約ステップの前に信頼性チェックを置きます。

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

- ブラウザーの可用性とプロファイル選択。たとえば、管理された状態には`openclaw`、サインイン済みのChromeセッションが必要な場合は`user`を使用します。[ブラウザー](/ja-JP/tools/browser)を参照してください。
- 各ソースのAPI認証情報とクォータ。
- 必要なエンドポイントへのネットワーク到達性。
- エージェントで有効になっている必要なツール（`lobster`、`browser`、`llm-task`など）。
- 事前チェックの失敗が見えるように、Cronの失敗時配信先を設定します。[スケジュール済みタスク](/ja-JP/automation/cron-jobs#delivery-and-output)を参照してください。

収集した各項目に推奨されるデータ来歴フィールド:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

要約の前に、ワークフローで古い項目を拒否するか、古いものとしてマークします。LLMステップには構造化JSONのみを渡し、出力内で`sourceUrl`、`retrievedAt`、`asOf`を保持するよう依頼してください。ワークフロー内でスキーマ検証済みのモデルステップが必要な場合は、[LLM Task](/ja-JP/tools/llm-task)を使用します。

チームやコミュニティで再利用できるワークフローでは、CLI、`.lobster`ファイル、セットアップメモをスキルまたはPluginとしてパッケージ化し、[ClawHub](/clawhub)を通じて公開します。必要な汎用機能がPlugin APIにない場合を除き、ワークフロー固有のガードレールはそのパッケージ内に保ちます。

## 同期モード

### 管理モード

Task Flowがライフサイクルをエンドツーエンドで所有します。フローステップとしてタスクを作成し、完了まで駆動し、フロー状態を自動的に進めます。

例: （1）データを収集し、（2）レポートを生成し、（3）配信する週次レポートフロー。Task Flowは各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに進みます。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### ミラーモード

Task Flowは外部で作成されたタスクを監視し、タスク作成の所有権を持たずにフロー状態を同期します。これは、タスクがCronジョブ、CLIコマンド、またはその他のソースから発生し、それらの進行状況をフローとして統一的に表示したい場合に便利です。

例: 3つの独立したCronジョブが集まって「朝の運用」ルーチンを形成する場合。ミラーされたフローは、それらがいつ、どのように実行されるかを制御せずに、全体の進行状況を追跡します。

## 耐久性のある状態とリビジョン追跡

各フローは独自の状態を永続化し、リビジョンを追跡するため、Gatewayの再起動後も進行状況が残ります。リビジョン追跡により、複数のソースが同じフローを同時に進めようとした場合の競合検出が可能になります。
フローレジストリはSQLiteを使用し、定期チェックポイントとシャットダウン時チェックポイントを含む、範囲を限定した先行書き込みログのメンテナンスを行うため、長時間稼働するGatewayが無制限の`registry.sqlite-wal`サイドカーファイルを保持し続けることはありません。

## キャンセル動作

`openclaw tasks flow cancel`は、フローに固定のキャンセル意図を設定します。フロー内のアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意図は再起動をまたいで保持されるため、すべての子タスクが終了する前にGatewayが再起動しても、キャンセルされたフローはキャンセルされたままになります。

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
| `openclaw tasks flow show <id>`   | フローIDまたはルックアップキーで1つのフローを調べます     |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセルします    |

## フローとタスクの関係

フローはタスクを調整するものであり、タスクを置き換えるものではありません。1つのフローは、そのライフタイム中に複数のバックグラウンドタスクを駆動することがあります。個々のタスクレコードを調べるには`openclaw tasks`を使用し、オーケストレーションを行うフローを調べるには`openclaw tasks flow`を使用します。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — フローが調整する、切り離された作業の台帳
- [CLI: tasks](/ja-JP/cli/tasks) — `openclaw tasks flow`のCLIコマンドリファレンス
- [自動化の概要](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Cronジョブ](/ja-JP/automation/cron-jobs) — フローに流れ込む可能性があるスケジュール済みジョブ
