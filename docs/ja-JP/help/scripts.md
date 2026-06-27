---
read_when:
    - リポジトリからスクリプトを実行する
    - ./scripts 配下のスクリプトの追加または変更
summary: 'リポジトリスクリプト: 目的、範囲、安全上の注意'
title: スクリプト
x-i18n:
    generated_at: "2026-05-06T05:07:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`scripts/` ディレクトリには、ローカルワークフローや運用タスク向けのヘルパースクリプトが含まれています。
タスクが明確にスクリプトに結び付いている場合はこれらを使用し、それ以外では CLI を優先してください。

## 規約

- ドキュメントやリリースチェックリストで参照されていない限り、スクリプトは**任意**です。
- CLI サーフェスが存在する場合はそれを優先してください（例: 認証監視では `openclaw models status --check` を使用します）。
- スクリプトはホスト固有であると想定し、新しいマシンで実行する前に内容を読んでください。

## 認証監視スクリプト

認証監視については [認証](/ja-JP/gateway/authentication) で扱っています。`scripts/` 配下のスクリプトは、systemd/Termux の電話ワークフロー向けの任意の追加機能です。

## GitHub 読み取りヘルパー

通常の `gh` は書き込み操作用に個人ログインのままにしつつ、リポジトリスコープの読み取り呼び出しで `gh` に GitHub App インストールトークンを使わせたい場合は、`scripts/gh-read` を使用してください。

必須 env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

任意 env:

- リポジトリベースのインストール検索を省略したい場合の `OPENCLAW_GH_READ_INSTALLATION_ID`
- 要求する読み取り権限サブセットをカンマ区切りで上書きするための `OPENCLAW_GH_READ_PERMISSIONS`

リポジトリ解決順序:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

例:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## スクリプトを追加する場合

- スクリプトは焦点を絞り、ドキュメント化してください。
- 関連するドキュメントに短い項目を追加してください（存在しない場合は作成してください）。

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
