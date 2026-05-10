---
read_when:
    - Task Flow がバックグラウンドタスクとどのように関係するかを理解したい場合
    - リリースノートまたはドキュメントで Task Flow または openclaw tasks flow に遭遇します
    - 永続的なフロー状態を確認または管理したい場合
summary: バックグラウンドタスクの上位にある Task Flow フローオーケストレーションレイヤー
title: タスクフロー
x-i18n:
    generated_at: "2026-05-10T19:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow は、[バックグラウンドタスク](/ja-JP/automation/tasks)の上に位置するフローオーケストレーション基盤です。個々のタスクが分離された作業の単位であり続ける一方で、独自の状態、リビジョン追跡、同期セマンティクスを持つ耐久性のある複数ステップのフローを管理します。

## Task Flow を使うタイミング

作業が複数の逐次ステップまたは分岐ステップにまたがり、Gateway の再起動をまたいで耐久性のある進捗追跡が必要な場合は Task Flow を使用します。単一のバックグラウンド操作では、通常の[タスク](/ja-JP/automation/tasks)で十分です。

| シナリオ                              | 使用                  |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ                 | 通常のタスク           |
| 複数ステップのパイプライン (A then B then C) | Task Flow (managed)  |
| 外部で作成されたタスクを監視する      | Task Flow (mirrored) |
| 1回限りのリマインダー                     | Cron ジョブ             |

## 信頼性の高いスケジュール済みワークフローパターン

市場インテリジェンスのブリーフィングなどの反復ワークフローでは、スケジュール、オーケストレーション、信頼性チェックを別々のレイヤーとして扱います。

1. タイミングには[スケジュール済みタスク](/ja-JP/automation/cron-jobs)を使用します。
2. ワークフローが以前のコンテキストを基にする必要がある場合は、永続的な cron セッションを使用します。
3. 決定論的なステップ、承認ゲート、再開トークンには [Lobster](/ja-JP/tools/lobster) を使用します。
4. 子タスク、待機、再試行、Gateway の再起動をまたぐ複数ステップの実行を追跡するには Task Flow を使用します。

cron 形状の例:

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

反復ワークフローに意図的な履歴、前回実行の要約、または継続的なコンテキストが必要な場合は、`isolated` ではなく `session:<id>` を使用します。各実行を新規に開始し、必要な状態がすべてワークフロー内で明示されている場合は `isolated` を使用します。

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

- ブラウザーの可用性とプロファイルの選択。たとえば、管理された状態には `openclaw`、サインイン済みの Chrome セッションが必要な場合は `user` を使用します。[Browser](/ja-JP/tools/browser) を参照してください。
- 各ソースの API 認証情報とクォータ。
- 必要なエンドポイントへのネットワーク到達性。
- `lobster`、`browser`、`llm-task` など、エージェントで必要なツールが有効になっていること。
- 事前チェックの失敗が見えるように、cron の失敗先が設定されていること。[スケジュール済みタスク](/ja-JP/automation/cron-jobs#delivery-and-output)を参照してください。

収集される各項目に推奨されるデータ来歴フィールド:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

要約前に、ワークフローで古くなった項目を拒否またはマークします。LLM ステップには構造化 JSON のみを渡し、出力内で `sourceUrl`、`retrievedAt`、`asOf` を保持するように依頼する必要があります。ワークフロー内でスキーマ検証済みのモデルステップが必要な場合は、[LLM Task](/ja-JP/tools/llm-task) を使用します。

チームまたはコミュニティで再利用可能なワークフローの場合は、CLI、`.lobster` ファイル、セットアップメモを skill または plugin としてパッケージ化し、[ClawHub](/ja-JP/clawhub) を通じて公開します。plugin API に必要な汎用機能が欠けている場合を除き、ワークフロー固有のガードレールはそのパッケージ内に保持します。

## 同期モード

### managed モード

Task Flow はライフサイクル全体を所有します。フローステップとしてタスクを作成し、完了まで実行させ、フロー状態を自動的に進めます。

例: (1) データを収集し、(2) レポートを生成し、(3) 配信する週次レポートフロー。Task Flow は各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに進みます。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### mirrored モード

Task Flow は外部で作成されたタスクを監視し、タスク作成の所有権を持たずにフロー状態を同期させます。これは、タスクが cron ジョブ、CLI コマンド、またはその他のソースから発生し、それらの進捗をフローとして統一的に表示したい場合に便利です。

例: 3つの独立した cron ジョブがまとまって「朝の運用」ルーチンを形成する場合。mirrored フローは、それらがいつ、どのように実行されるかを制御せずに、全体の進捗を追跡します。

## 耐久性のある状態とリビジョン追跡

各フローは独自の状態を永続化し、リビジョンを追跡するため、Gateway の再起動後も進捗が維持されます。リビジョン追跡により、複数のソースが同じフローを同時に進めようとした場合の競合検出が可能になります。
フローレジストリは SQLite を使用し、定期チェックポイントとシャットダウン時チェックポイントを含む、境界付きの write-ahead-log メンテナンスを行うため、長時間実行される Gateway が無制限の `registry.sqlite-wal` サイドカーファイルを保持し続けることはありません。

## キャンセル動作

`openclaw tasks flow cancel` は、フローに固定のキャンセル意図を設定します。フロー内のアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意図は再起動をまたいで保持されるため、すべての子タスクが終了する前に Gateway が再起動しても、キャンセルされたフローはキャンセルされたままになります。

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
| `openclaw tasks flow show <id>`   | フロー ID または検索キーで1つのフローを調査します     |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセルします    |

## フローとタスクの関係

フローはタスクを置き換えるものではなく、タスクを調整するものです。単一のフローは、その存続期間中に複数のバックグラウンドタスクを駆動する場合があります。個々のタスクレコードを調査するには `openclaw tasks` を使用し、オーケストレーションするフローを調査するには `openclaw tasks flow` を使用します。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — フローが調整する分離された作業台帳
- [CLI: タスク](/ja-JP/cli/tasks) — `openclaw tasks flow` の CLI コマンドリファレンス
- [自動化の概要](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Cron ジョブ](/ja-JP/automation/cron-jobs) — フローに供給される可能性のあるスケジュール済みジョブ
