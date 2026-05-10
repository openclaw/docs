---
read_when:
    - 利用可能で実行準備が整っている Skills を確認したい場合
    - ClawHub から Skills を検索、インストール、または更新したい場合
    - Skills 用の不足しているバイナリ/env/config をデバッグしたい
summary: '`openclaw skills` の CLI リファレンス（search/install/update/list/info/check）'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:29:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ローカルのスキルを検査し、ClawHub から Skills をインストールまたは更新します。

関連:

- Skills システム: [Skills](/ja-JP/tools/skills)
- Skills 設定: [Skills 設定](/ja-JP/tools/skills-config)
- ClawHub インストール: [ClawHub](/ja-JP/clawhub/cli)

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

`search`/`install`/`update` は ClawHub を直接使用し、アクティブな
ワークスペースの `skills/` ディレクトリにインストールします。`list`/`info`/`check` は引き続き、現在のワークスペースと設定から見えるローカルの
Skills を検査します。ワークスペースに基づくコマンドは、`--agent <id>` から対象ワークスペースを解決し、次に現在の作業ディレクトリが設定済みのエージェントワークスペース内にある場合はそのディレクトリ、次にデフォルトの
エージェントを使用します。

この CLI の `install` コマンドは、ClawHub からスキルフォルダーをダウンロードします。オンボーディングまたは Skills 設定からトリガーされる Gateway ベースの
スキル依存関係インストールは、代わりに別の `skills.install` リクエストパスを使用します。

注記:

- `search [query...]` は任意のクエリを受け付けます。省略すると、デフォルトの
  ClawHub 検索フィードを閲覧します。
- `search --limit <n>` は返される結果数を制限します。
- `install --force` は、同じ
  slug の既存のワークスペーススキルフォルダーを上書きします。
- `--agent <id>` は、設定済みのエージェントワークスペースを 1 つ対象にし、現在の
  作業ディレクトリからの推測を上書きします。
- `update --all` は、アクティブなワークスペース内で追跡されている ClawHub インストールのみを更新します。
- `check --agent <id>` は、選択したエージェントのワークスペースをチェックし、準備完了の
  Skills のうち、そのエージェントのプロンプトまたはコマンドサーフェスから実際に見えるものを報告します。
- サブコマンドが指定されていない場合、`list` がデフォルトのアクションです。
- `list`、`info`、`check` は、レンダリングされた出力を stdout に書き込みます。
  `--json` を指定した場合、パイプやスクリプト向けの機械可読ペイロードが stdout に残ります。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Skills](/ja-JP/tools/skills)
