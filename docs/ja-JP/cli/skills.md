---
read_when:
    - 利用可能で実行準備済みの Skills を確認したい
    - ClawHub から Skills を検索、インストール、または更新したい
    - Skillsの不足しているバイナリ/env/configをデバッグしたい
summary: '`openclaw skills` の CLI リファレンス (search/install/update/list/info/check)'
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ローカルのSkillsを確認し、ClawHubからSkillsをインストールまたは更新します。

関連:

- Skillsシステム: [Skills](/ja-JP/tools/skills)
- Skills設定: [Skills設定](/ja-JP/tools/skills-config)
- ClawHubインストール: [ClawHub](/ja-JP/tools/clawhub)

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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` はClawHubを直接使用し、アクティブな
ワークスペースの `skills/` ディレクトリにインストールします。`list`/`info`/`check` は引き続き、現在のワークスペースと設定から見えるローカルの
Skillsを確認します。ワークスペースに基づくコマンドは、まず `--agent <id>` から対象ワークスペースを解決し、次に現在の作業ディレクトリが設定済みエージェントワークスペース内にある場合はそれを使い、その後にデフォルトの
エージェントを使います。

このCLIの `install` コマンドは、ClawHubからSkillsフォルダーをダウンロードします。オンボーディングまたはSkills設定からトリガーされる、Gatewayに基づく
Skills依存関係のインストールでは、代わりに別の `skills.install` リクエストパスを使用します。

注:

- `search [query...]` は任意のクエリを受け付けます。省略するとデフォルトの
  ClawHub検索フィードを閲覧します。
- `search --limit <n>` は返される結果数の上限を設定します。
- `install --force` は、同じ
  slugの既存ワークスペースSkillsフォルダーを上書きします。
- `--agent <id>` は、設定済みの単一エージェントワークスペースを対象にし、現在の作業ディレクトリからの推論を上書きします。
- `update --all` は、アクティブなワークスペース内で追跡されているClawHubインストールのみを更新します。
- `check --agent <id>` は、選択したエージェントのワークスペースを確認し、そのエージェントのプロンプトまたはコマンドサーフェスから実際に見える準備済みSkillsを報告します。
- サブコマンドが指定されていない場合、`list` がデフォルトのアクションです。
- `list`、`info`、`check` は、レンダリングされた出力をstdoutに書き込みます。
  `--json` を指定した場合、パイプやスクリプト向けの機械可読ペイロードがstdoutに残ることを意味します。

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Skills](/ja-JP/tools/skills)
