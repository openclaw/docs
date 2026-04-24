---
read_when:
    - 利用可能で、すぐ実行できる Skills を確認したい場合
    - ClawHub から Skills を検索、インストール、または更新したい場合
    - Skills に必要なバイナリ、env、設定の不足をデバッグしたい場合
summary: '`openclaw skills` の CLI リファレンス（search/install/update/list/info/check）'
title: Skills
x-i18n:
    generated_at: "2026-04-24T04:52:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

ローカル Skills を確認し、ClawHub から Skills をインストール/更新します。

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
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search` / `install` / `update` は ClawHub を直接使い、アクティブな
workspace の `skills/` ディレクトリにインストールします。`list` / `info` / `check` は引き続き、
現在の workspace と設定から見えるローカル Skills を確認します。

この CLI の `install` コマンドは ClawHub から skill フォルダをダウンロードします。オンボーディングや
Skills 設定からトリガーされる Gateway バックエンドの skill 依存インストールは、代わりに別の
`skills.install` リクエストパスを使います。

注記:

- `search [query...]` は任意のクエリを受け付けます。省略すると、デフォルトの
  ClawHub 検索フィードをブラウズします。
- `search --limit <n>` は返される結果数を制限します。
- `install --force` は、同じ slug の既存 workspace skill フォルダを上書きします。
- `update --all` は、アクティブな workspace 内の追跡対象 ClawHub インストールのみを更新します。
- サブコマンドを指定しない場合、`list` がデフォルト動作です。
- `list`、`info`、`check` はレンダリング済み出力を stdout に書き出します。`--json` を使うと、
  機械可読なペイロードがパイプやスクリプト向けに stdout に残ります。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Skills](/ja-JP/tools/skills)
