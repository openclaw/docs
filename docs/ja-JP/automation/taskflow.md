---
read_when:
    - TaskFlowがバックグラウンドタスクとどのように関係しているかを理解したい。
    - リリースノートやドキュメントでTaskFlowまたはopenclaw tasks flowを見かける。
    - 永続的なフロー状態を確認または管理したい。
summary: バックグラウンドタスクの上位にあるフローオーケストレーション層
title: タスクフロー
x-i18n:
    generated_at: "2026-04-23T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# TaskFlow

TaskFlowは、[バックグラウンドタスク](/ja-JP/automation/tasks)の上位に位置するフローオーケストレーション基盤です。個々のタスクは切り離された作業の単位として維持される一方で、TaskFlowは独自の状態、リビジョン追跡、同期セマンティクスを備えた永続的なマルチステップフローを管理します。

## TaskFlowを使うべき場合

作業が複数の連続または分岐するステップにまたがり、Gatewayの再起動をまたいで進行状況を永続的に追跡する必要がある場合は、TaskFlowを使用します。単一のバックグラウンド操作であれば、通常の[task](/ja-JP/automation/tasks)で十分です。

| シナリオ | 使用対象 |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ | 通常のtask |
| マルチステップのパイプライン（A→B→C） | TaskFlow（managed） |
| 外部で作成されたタスクを監視する | TaskFlow（mirrored） |
| 1回限りのリマインダー | Cronジョブ |

## 同期モード

### Managedモード

TaskFlowがライフサイクルをエンドツーエンドで管理します。フローステップとしてタスクを作成し、完了まで進め、フロー状態を自動的に前進させます。

例: 毎週のレポートフローでは、(1) データを収集し、(2) レポートを生成し、(3) 配信します。TaskFlowは各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに進みます。

```text
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mirroredモード

TaskFlowは外部で作成されたタスクを監視し、タスク作成の所有権を持たずにフロー状態を同期します。これは、タスクがCronジョブ、CLIコマンド、またはその他のソースから生成され、それらの進行状況をフローとして統一的に把握したい場合に役立ちます。

例: 3つの独立したCronジョブが、まとめて「morning ops」ルーチンを構成している場合。mirroredフローは、それらがいつどのように実行されるかを制御せずに、全体の進行状況を追跡します。

## 永続状態とリビジョン追跡

各フローは独自の状態を永続化し、リビジョンを追跡することで、Gatewayの再起動後も進行状況が維持されます。リビジョン追跡により、複数のソースが同じフローを同時に進めようとした場合の競合検出が可能になります。

## キャンセル動作

`openclaw tasks flow cancel` は、フローに対して持続的なキャンセル意思を設定します。フロー内でアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意思は再起動後も保持されるため、すべての子タスクが終了する前にGatewayが再起動しても、キャンセルされたフローはキャンセルされたままです。

## CLIコマンド

```bash
# アクティブおよび最近のフローを一覧表示
openclaw tasks flow list

# 特定のフローの詳細を表示
openclaw tasks flow show <lookup>

# 実行中のフローとそのアクティブなタスクをキャンセル
openclaw tasks flow cancel <lookup>
```

| コマンド | 説明 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | ステータスと同期モード付きで追跡中のフローを表示 |
| `openclaw tasks flow show <id>` | フローIDまたはlookupキーで1つのフローを確認 |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセル |

## フローとタスクの関係

フローはタスクを調整するものであり、置き換えるものではありません。1つのフローがその存続期間中に複数のバックグラウンドタスクを動かすことがあります。個々のタスク記録を確認するには `openclaw tasks` を、オーケストレーションを行うフローを確認するには `openclaw tasks flow` を使用します。

## 関連

- [Background Tasks](/ja-JP/automation/tasks) — フローが調整する、切り離された作業の台帳
- [CLI: tasks](/ja-JP/cli/tasks) — `openclaw tasks flow` のCLIコマンドリファレンス
- [Automation Overview](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Cron Jobs](/ja-JP/automation/cron-jobs) — フローに入力される可能性があるスケジュール済みジョブ
