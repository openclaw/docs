---
read_when:
    - リポジトリからスクリプトを実行する
    - '`./scripts` 配下のスクリプトを追加または変更する'
summary: 'リポジトリスクリプト: 目的、対象範囲、安全上の注意事項'
title: スクリプト
x-i18n:
    generated_at: "2026-04-24T05:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

`scripts/` ディレクトリには、ローカルワークフローや運用タスク用の補助スクリプトが入っています。
タスクが明確にスクリプトに結び付いている場合はこれらを使い、それ以外はCLIを優先してください。

## 規約

- スクリプトは、ドキュメントやリリースチェックリストで参照されていない限り、**必須ではありません**。
- 該当するCLIサーフェスが存在する場合は、そちらを優先してください（例: auth monitoring には `openclaw models status --check` を使います）。
- スクリプトはホスト固有であることを前提にしてください。新しいマシンで実行する前に中身を読んでください。

## Auth monitoringスクリプト

Auth monitoring は [認証](/ja-JP/gateway/authentication) で扱われています。`scripts/` 配下のスクリプトは、systemd/Termuxスマートフォンワークフロー向けの任意の追加機能です。

## GitHub読み取りヘルパー

`scripts/gh-read` は、通常の `gh` は書き込み操作に対して個人ログインのままにしつつ、リポジトリスコープの読み取り呼び出しにはGitHub App installation tokenを使わせたい場合に使います。

必須環境変数:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

任意環境変数:

- リポジトリベースのinstallation lookupをスキップしたい場合は `OPENCLAW_GH_READ_INSTALLATION_ID`
- 要求する読み取り権限サブセットをカンマ区切りで上書きしたい場合は `OPENCLAW_GH_READ_PERMISSIONS`

リポジトリ解決順序:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

例:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## スクリプトを追加する場合

- スクリプトは焦点を絞り、文書化してください。
- 関連するドキュメントに短い項目を追加してください（なければ新しく作成してください）。

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
