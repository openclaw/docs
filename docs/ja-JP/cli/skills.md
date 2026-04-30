---
read_when:
    - 利用可能で実行準備ができているSkillsを確認したい
    - ClawHub から Skills を検索、インストール、または更新したい場合
    - Skills で不足しているバイナリ/env/configをデバッグしたい場合
summary: '`openclaw skills` の CLI リファレンス (search/install/update/list/info/check)'
title: Skills
x-i18n:
    generated_at: "2026-04-30T05:06:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ローカルの Skills を調べ、ClawHub から Skills をインストール/更新します。

関連:

- Skills システム: [Skills](/ja-JP/tools/skills)
- Skills 設定: [Skills config](/ja-JP/tools/skills-config)
- ClawHub インストール: [ClawHub](/ja-JP/tools/clawhub)

## コマンド

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` は ClawHub を直接使用し、アクティブな
ワークスペースの `skills/` ディレクトリにインストールします。`list`/`info`/`check` は引き続き、現在のワークスペースと設定から見えるローカルの
Skills を調べます。ワークスペースを利用するコマンドは、まず `--agent <id>` から対象ワークスペースを解決し、次に現在の作業ディレクトリが設定済みエージェントワークスペース内にある場合はそこから解決し、最後にデフォルトの
エージェントを使用します。

この CLI の `install` コマンドは、ClawHub から Skills フォルダーをダウンロードします。オンボーディングまたは Skills 設定からトリガーされる Gateway 経由の
Skill 依存関係インストールは、代わりに別の `skills.install` リクエストパスを使用します。

注:

- `search [query...]` は任意のクエリを受け付けます。省略すると、デフォルトの
  ClawHub 検索フィードを参照します。
- `search --limit <n>` は返される結果数に上限を設定します。
- `install --force` は、同じ slug の既存ワークスペース Skill フォルダーを上書きします。
- `--agent <id>` は、設定済みの 1 つのエージェントワークスペースを対象にし、現在の作業ディレクトリからの推定を上書きします。
- `update --all` は、アクティブなワークスペース内で追跡されている ClawHub インストールのみを更新します。
- サブコマンドが指定されていない場合、`list` がデフォルトのアクションです。
- `list`、`info`、`check` は、レンダリングされた出力を stdout に書き込みます。
  `--json` を指定した場合、パイプやスクリプト用の機械可読ペイロードが stdout に残ることを意味します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Skills](/ja-JP/tools/skills)
