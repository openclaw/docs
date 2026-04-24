---
read_when:
    - Task Flow がバックグラウンドタスクとどのように関係しているかを理解したい場合
    - リリースノートやドキュメントで Task Flow または openclaw tasks flow を見かけた場合
    - 永続的なフロー状態を確認または管理したい場合
summary: バックグラウンドタスクの上位にあるタスクフローのオーケストレーション層
title: タスクフロー
x-i18n:
    generated_at: "2026-04-24T04:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

タスクフローは、[バックグラウンドタスク](/ja-JP/automation/tasks) の上位に位置するフローオーケストレーション基盤です。個々のタスクは引き続き分離された作業の単位でありながら、独自の状態、リビジョン追跡、同期セマンティクスを備えた永続的な複数ステップのフローを管理します。

## タスクフローを使う場合

作業が複数の順次的または分岐するステップにまたがり、Gateway の再起動をまたいで永続的な進捗追跡が必要な場合は、タスクフローを使用します。単一のバックグラウンド操作であれば、通常の [タスク](/ja-JP/automation/tasks) で十分です。

| シナリオ | 使用するもの |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ | 通常のタスク |
| 複数ステップのパイプライン（A の後に B、その後に C） | タスクフロー（管理型） |
| 外部で作成されたタスクを監視する | タスクフロー（ミラー型） |
| 単発のリマインダー | Cron ジョブ |

## 同期モード

### 管理モード

タスクフローはライフサイクル全体をエンドツーエンドで管理します。フローステップとしてタスクを作成し、それらを完了まで進め、フロー状態を自動的に前進させます。

例: 毎週のレポートフローでは、(1) データを収集し、(2) レポートを生成し、(3) 配信します。タスクフローは各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに進みます。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### ミラーモード

タスクフローは外部で作成されたタスクを監視し、タスク作成の所有権を持たないままフロー状態を同期した状態に保ちます。これは、タスクが Cron ジョブ、CLI コマンド、またはその他のソースから生成され、それらの進捗をフローとして統一的に把握したい場合に便利です。

例: 3 つの独立した Cron ジョブが、まとめて「morning ops」ルーチンを構成している場合です。ミラー型フローは、それらがいつどのように実行されるかを制御せずに、全体の進捗を追跡します。

## 永続状態とリビジョン追跡

各フローは独自の状態を永続化し、リビジョンを追跡することで、Gateway の再起動後も進捗が保持されます。リビジョン追跡により、複数のソースが同じフローを同時に進めようとした際の競合検出が可能になります。

## キャンセル動作

`openclaw tasks flow cancel` は、フローに対して固定的なキャンセル意思を設定します。フロー内のアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意思は再起動後も保持されるため、すべての子タスクが終了する前に Gateway が再起動しても、キャンセルされたフローはキャンセル状態のままです。

## CLI コマンド

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Command                           | 説明 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | 状態と同期モード付きで追跡中のフローを表示します |
| `openclaw tasks flow show <id>`   | フロー ID または lookup キーで 1 つのフローを確認します |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセルします |

## フローとタスクの関係

フローはタスクを置き換えるのではなく、タスクを調整します。1 つのフローが、その存続期間中に複数のバックグラウンドタスクを動かすことがあります。個々のタスクレコードを確認するには `openclaw tasks` を使用し、オーケストレーションを行うフローを確認するには `openclaw tasks flow` を使用します。

## 関連

- [Background Tasks](/ja-JP/automation/tasks) — フローが調整する分離された作業の台帳
- [CLI: tasks](/ja-JP/cli/tasks) — `openclaw tasks flow` の CLI コマンドリファレンス
- [Automation Overview](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Cron Jobs](/ja-JP/automation/cron-jobs) — フローに入力されることがあるスケジュール済みジョブ
