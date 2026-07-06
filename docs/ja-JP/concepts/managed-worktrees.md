---
read_when:
    - エージェントタスク用に分離されたブランチとチェックアウトが必要です
    - Workboard カードを worktree ワークスペースで設定しています
    - OpenClaw が管理するワークツリーを復元またはクリーンアップする必要があります
summary: 自動スナップショットとクリーンアップ付きの分離された git チェックアウトでエージェントタスクを実行する
title: 管理対象ワークツリー
x-i18n:
    generated_at: "2026-07-06T10:50:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d0933ab3d3bf7235fa42365fd2db9f20e7e78192fb378c5ea0776ab10a9152
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

管理対象 worktree は、エージェントタスクに独自の git ブランチとチェックアウトを与え、ソースリポジトリ内に一時ディレクトリを置きません。OpenClaw はそれらを state ディレクトリ配下に作成し、共有 state データベースに記録し、削除前に追跡済みおよび無視されていない未追跡の内容をスナップショットします。

## レイアウトと名前

各 worktree は次の場所にあります。

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

リポジトリ fingerprint は、正規化された git common ディレクトリと origin URL に対する SHA-256 ハッシュの先頭 16 桁の 16 進文字です。指定する名前は `[a-z0-9][a-z0-9-]{0,63}` に一致する必要があります。名前がない場合、OpenClaw は `wt-` に 8 桁のランダムな 16 進文字を続けた名前を生成します。

OpenClaw は、要求された base ref にブランチ `openclaw/<name>` を作成します。base ref がない場合は `origin` を fetch し、利用可能ならリモートのデフォルトブランチを使い、リポジトリがオフラインまたは利用可能なリモートがない場合はローカルの `HEAD` にフォールバックします。

## 無視されたファイルをプロビジョニングする

ソースリポジトリのルートに `.worktreeinclude` を追加すると、選択した無視済み・未追跡ファイルを新しい worktree にコピーできます。このファイルは gitignore パターン構文を使い、1 行に 1 パターンを書き、`#` コメントを使えます。

```gitignore
.env.local
fixtures/generated/**
```

git によって無視済みかつ未追跡として報告されるファイルだけが対象です。追跡済みファイルは git 経由ですでに存在しており、この手順では決してコピーされません。OpenClaw は宛先ファイルを上書きせず、シンボリックリンクされたディレクトリをたどらず、コピーしたファイルモードを保持します。

## リポジトリセットアップを実行する

ソースリポジトリに `.openclaw/worktree-setup.sh` が存在し実行可能な場合、OpenClaw は新しい worktree をカレントディレクトリとしてそれを実行します。スクリプトは次を受け取ります。

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非ゼロ終了は作成を中止し、新しい worktree とブランチを削除します。これはリポジトリローカルの契約であり、そのための OpenClaw 設定キーはありません。

## セッション worktree

アクティブなエージェントの git ワークスペースから分離されたチャットを開始するには、**worktree の新規チャット**を使います。Control UI サイドバーのセカンダリ New Chat アクション、iOS の Chat actions メニュー、または Android の New Chat の横にあるオーバーフローアクションを使ってください。このアクションは、その capability をクライアントが持つ git ベースのエージェントでのみ利用できます。事前確認できないクライアントは代わりに gateway エラーを表示します。

結果として作成される管理対象 worktree はセッションが所有し、そのセッション内のすべてのエージェント実行はそのチェックアウトを使います。ワークスペースがリポジトリのサブディレクトリである場合、worktree はリポジトリルートに固定され、セッションはその内部の対応するサブディレクトリから実行されます。セッション worktree の作成はメソッドの `operator.write` scope を使いますが、`.openclaw/worktree-setup.sh` 手順は `operator.admin` 呼び出し元に対してのみ実行されます。これはリポジトリコードを実行するためです。`.worktreeinclude` のプロビジョニングは引き続きすべての呼び出し元に適用されます。セッションを削除すると、損失なしで実行できる場合にのみ worktree が削除されます。dirty な worktree や未 push コミットがあるブランチは利用可能なまま残ります。時間ごとのクリーンアップは、最近のセッション activity を worktree activity として扱い、7 日間 idle なセッション worktree をスナップショットします。削除された worktree は、以下の説明どおりスナップショットから復元可能なままです。

## スナップショット、クリーンアップ、復元

削除ではまず、追跡済みおよび無視されていない未追跡ファイルを含む合成コミットを作成し、`refs/openclaw/snapshots/<id>` に固定します。Gitignored ファイルはリポジトリオブジェクトデータベースから除外されます。`.worktreeinclude` によって選択されたファイルは、復元中に再度コピーされます。スナップショット作成に失敗すると、削除は停止します。明示的な force delete はスナップショットなしで続行できます。

OpenClaw は次のクリーンアップ規則を適用します。

- 実行終了時、`git status --porcelain` が空で、`git log HEAD --not --remotes --oneline` が未 push コミットを見つけない場合にのみ worktree を削除します。それ以外の場合は activity lock だけを解放します。
- 時間ごとのクリーンアップは、dirty であっても 7 日を超えて idle な、ロックされていない Workboard 所有およびセッション所有の worktree をスナップショットして削除します。手動 worktree は自動的には削除されません。
- スナップショットレコードは 30 日間復元可能なままです。その後、クリーンアップが snapshot ref と registry row を削除します。
- 実行中の OpenClaw プロセスロック、および外部または認識されていない git worktree ロックは、worktree をガベージコレクションから保護します。

復元では、元のスナップショット前コミットで `openclaw/<name>` を再作成し、その後スナップショット差分をステージされていない変更と未追跡ファイルとして再構築します。これにより、合成スナップショットコミットはブランチ履歴に入りません。snapshot ref は provenance として記録されたままです。

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Control UI の **Worktrees** ページは、同じ一覧、削除、復元、クリーンアップアクションを提供します。

## Gateway メソッド

| メソッド              | 目的                                       |
| ------------------- | --------------------------------------------- |
| `worktrees.list`    | アクティブおよび復元可能な worktree レコードを一覧表示します。  |
| `worktrees.create`  | 名前付きの管理対象 worktree を作成または再利用します。     |
| `worktrees.remove`  | worktree をスナップショットして削除します。               |
| `worktrees.restore` | 削除済み worktree をそのスナップショットから復元します。 |
| `worktrees.gc`      | idle、orphan、保持期間のクリーンアップを今すぐ実行します。  |

`worktrees.list` には `operator.read` が必要です。変更メソッドには `operator.admin` が必要です。

## Workboard ワークスペース

バンドルされた [Workboard plugin](/ja-JP/plugins/workboard) は、カードワークスペースを管理対象 worktree として materialize できます。

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` はソース git チェックアウトを識別します。`branch` は任意で、base ref になります。dispatch がカードの worker を開始すると、Workboard は `wb-<card-id>` を作成または再利用し、管理対象チェックアウトを作業ディレクトリとして subagent を実行し、解決済みパスとブランチをカードに書き戻します。Gateway によってトリガーされる materialization には `operator.admin` が必要です。実行終了時、Workboard はチェックアウトを損失なしであると証明できる場合にのみ削除します。dirty な作業や未 push コミットは利用可能なまま残ります。

サンドボックス化された埋め込みエージェントは現在、設定済みのエージェントワークスペース外にあるタスク作業ディレクトリを拒否します。サンドボックスランタイムが追加のチェックアウトマウントをサポートするまで、Workboard 管理対象 worktree カードにはサンドボックスなしのターゲットエージェントを使ってください。
