---
read_when:
    - エージェントタスク用に分離されたブランチとチェックアウトが必要です
    - worktree ワークスペースで Workboard カードを設定しています
    - OpenClaw 管理のワークツリーを復元またはクリーンアップする必要がある
summary: 自動スナップショットとクリーンアップ付きの分離された git チェックアウトでエージェントタスクを実行する
title: 管理対象ワークツリー
x-i18n:
    generated_at: "2026-07-06T21:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 10c6522017df3b4a6ac04d6e2493c226c34547ed686b526c29d01cfd34dc5524
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

管理対象 worktree は、ソースリポジトリ内に一時ディレクトリを置かずに、エージェントタスクへ専用の git ブランチとチェックアウトを提供します。OpenClaw はそれらを状態ディレクトリの下に作成し、共有状態データベースに記録し、削除前に追跡対象および無視されていない未追跡の内容のスナップショットを取得します。

## レイアウトと名前

各 worktree は次の場所に存在します。

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

リポジトリフィンガープリントは、正規化された git common ディレクトリと origin URL に対する SHA-256 ハッシュの先頭 16 個の 16 進文字です。指定する名前は `[a-z0-9][a-z0-9-]{0,63}` に一致する必要があります。名前がない場合、OpenClaw は `wt-` に 8 個のランダムな 16 進文字を続けた名前を生成します。

OpenClaw は、要求されたベース ref にブランチ `openclaw/<name>` を作成します。ベース ref がない場合は `origin` をフェッチし、利用可能ならリモートのデフォルトブランチを使い、リポジトリがオフラインまたは利用可能なリモートがない場合はローカルの `HEAD` にフォールバックします。

## 無視対象ファイルのプロビジョニング

選択した無視対象かつ未追跡のファイルを新しい worktree にコピーするには、ソースリポジトリのルートに `.worktreeinclude` を追加します。このファイルは gitignore パターン構文を使い、1 行に 1 パターンを記述し、`#` コメントを使用できます。

```gitignore
.env.local
fixtures/generated/**
```

git によって無視対象かつ未追跡の両方として報告されたファイルだけが対象になります。追跡対象ファイルは git によってすでに存在しており、この手順ではコピーされません。OpenClaw は宛先ファイルを上書きせず、シンボリックリンクされたディレクトリをたどらず、コピーしたファイルモードを保持します。

## リポジトリセットアップの実行

ソースリポジトリに `.openclaw/worktree-setup.sh` が存在し、実行可能な場合、OpenClaw は新しい worktree をカレントディレクトリとしてそれを実行します。スクリプトは次を受け取ります。

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

0 以外の終了は作成を中止し、新しい worktree とブランチを削除します。これはリポジトリローカルの契約であり、対応する OpenClaw 設定キーはありません。

## セッション worktree

アクティブなエージェントの git ワークスペースから分離されたチャットを開始するには、**worktree で新規チャット**を使用します。Control UI サイドバーの補助的な New Chat アクション、iOS の Chat アクションメニュー、または Android の New Chat 横のオーバーフローアクションを使用します。このアクションは、クライアントがその機能を持つ git ベースのエージェントでのみ利用できます。事前確認できないクライアントでは、代わりに Gateway エラーが表示されます。

結果として作成される管理対象 worktree はセッションによって所有され、そのセッション内のすべてのエージェント実行がそのチェックアウトを使用します。ワークスペースがリポジトリのサブディレクトリの場合、worktree はリポジトリルートに固定され、セッションはその中の対応するサブディレクトリから実行されます。セッション worktree の作成にはメソッドの `operator.write` スコープを使用しますが、`.openclaw/worktree-setup.sh` 手順はリポジトリコードを実行するため、`operator.admin` 呼び出し元に対してのみ実行されます。`.worktreeinclude` のプロビジョニングはすべての呼び出し元に引き続き適用されます。セッションを削除すると、損失なく実行できる場合にのみ worktree が削除されます。dirty な worktree や未プッシュのコミットを持つブランチは引き続き利用可能です。1 時間ごとのクリーンアップは、最近のセッションアクティビティを worktree アクティビティとして扱い、7 日間アイドル状態のセッション worktree のスナップショットを取得します。削除された worktree は、以下の説明どおりスナップショットから復元できます。

## スナップショット、クリーンアップ、復元

削除では最初に、追跡対象および無視されていない未追跡ファイルを含む合成コミットを作成し、それを `refs/openclaw/snapshots/<id>` に固定します。gitignore 対象ファイルはリポジトリオブジェクトデータベースから除外されます。`.worktreeinclude` によって選択されたファイルは、復元中に再度コピーされます。スナップショット作成に失敗した場合、削除は停止します。明示的な強制削除では、スナップショットなしで続行できます。

OpenClaw は次のクリーンアップルールを適用します。

- 実行終了時、`git status --porcelain` が空で、`git log HEAD --not --remotes --oneline` が未プッシュのコミットを見つけない場合にのみ worktree を削除します。それ以外の場合はアクティビティロックだけを解放します。
- 1 時間ごとのクリーンアップは、ロックされていない Workboard 所有およびセッション所有の worktree が 7 日を超えてアイドル状態の場合、dirty であってもスナップショットを取得して削除します。手動 worktree は自動的には削除されません。
- スナップショットレコードは 30 日間復元可能なまま残ります。その後、クリーンアップによってスナップショット ref とレジストリ行が削除されます。
- 稼働中の OpenClaw プロセスロック、および外部または認識されていない git worktree ロックは、worktree をガベージコレクションから保護します。

復元では、元のスナップショット前コミットで `openclaw/<name>` を再作成し、その後スナップショットの差分をステージされていない変更および未追跡ファイルとして再構築します。これにより、合成スナップショットコミットはブランチ履歴に入りません。スナップショット ref は来歴として記録されたままです。

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Settings の下にある Control UI の **Worktrees** ページでは、同じ一覧表示、削除、復元、クリーンアップ操作を提供します。

## Gateway メソッド

| メソッド              | 目的                                             |
| ------------------- | --------------------------------------------- |
| `worktrees.list`    | アクティブおよび復元可能な worktree レコードを一覧表示します。 |
| `worktrees.create`  | 名前付きの管理対象 worktree を作成または再利用します。       |
| `worktrees.remove`  | worktree のスナップショットを取得して削除します。            |
| `worktrees.restore` | 削除された worktree をスナップショットから復元します。        |
| `worktrees.gc`      | アイドル、孤立、保持期間のクリーンアップを今すぐ実行します。      |

`worktrees.list` には `operator.read` が必要です。変更を行うメソッドには `operator.admin` が必要です。

## Workboard ワークスペース

バンドルされた [Workboard Plugin](/ja-JP/plugins/workboard) は、カードワークスペースを管理対象 worktree として実体化できます。

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` はソース git チェックアウトを識別します。`branch` は任意で、ベース ref になります。dispatch がカードの worker を開始すると、Workboard は `wb-<card-id>` を作成または再利用し、管理対象チェックアウトを作業ディレクトリとして subagent を実行し、解決されたパスとブランチをカードに書き戻します。Gateway によってトリガーされる実体化には `operator.admin` が必要です。実行終了時、Workboard は損失がないと証明できる場合にのみチェックアウトを削除します。dirty な作業や未プッシュのコミットは引き続き利用可能です。

サンドボックス化された埋め込みエージェントは現在、設定されたエージェントワークスペース外のタスク作業ディレクトリを拒否します。サンドボックスランタイムが追加のチェックアウトマウントをサポートするまで、Workboard の管理対象 worktree カードにはサンドボックス化されていないターゲットエージェントを使用してください。
