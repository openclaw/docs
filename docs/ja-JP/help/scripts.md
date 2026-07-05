---
read_when:
    - リポジトリからスクリプトを実行する
    - ./scripts 配下のスクリプトの追加または変更
summary: 'リポジトリスクリプト: 目的、範囲、安全上の注意'
title: スクリプト
x-i18n:
    generated_at: "2026-07-05T11:24:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` には、ローカルワークフローと運用タスク用のヘルパースクリプトが含まれています。タスクが明確にスクリプトに結び付いている場合はこれらを使用し、それ以外の場合は CLI を優先してください。

## 規約

- ドキュメントまたはリリースチェックリストで参照されていない限り、スクリプトは**任意**です。
- CLI サーフェスが存在する場合はそれを優先してください（例: `openclaw models status --check`）。
- スクリプトはホスト固有であると想定し、新しいマシンで実行する前に内容を読んでください。

## 認証監視スクリプト

一般的なモデル認証は [認証](/ja-JP/gateway/authentication) で説明しています。以下のスクリプトは、リモート/ヘッドレスホスト上の **Claude Code CLI サブスクリプショントークン**を監視し、電話から再認証するための、独立した任意のシステムです。

- `scripts/setup-auth-system.sh` - 1 回限りのセットアップ: 現在の認証を確認し、長期間有効な `claude setup-token` の生成を支援し、systemd/Termux のインストール手順を出力します。
- `scripts/claude-auth-status.sh [full|json|simple]` - Claude Code + OpenClaw の認証ステータスを確認します。
- `scripts/auth-monitor.sh` - ステータスをポーリングし、トークンの期限切れが近づくと（OpenClaw send 経由、または ntfy.sh 経由、またはその両方で）通知を送信します。環境変数: `WARN_HOURS`（デフォルト `2`）、`NOTIFY_PHONE`、`NOTIFY_NTFY`。同梱の `scripts/systemd/openclaw-auth-monitor.{service,timer}`（30 分ごと）を使ってスケジュール実行します。
- `scripts/mobile-reauth.sh` - `claude setup-token` を再実行し、Termux から SSH 経由で使用するために、電話で開く URL を出力します。
- `scripts/termux-quick-auth.sh`、`scripts/termux-auth-widget.sh`、`scripts/termux-sync-widget.sh` - Termux:Widget スクリプトです。ホストへ SSH し、ステータストーストを表示し、認証の期限が切れている場合は再認証コンソール/手順を開きます。

## GitHub 読み取りヘルパー

書き込み操作では通常の `gh` が個人ログインを使う状態を維持しつつ、リポジトリスコープの読み取り呼び出しで `gh` に GitHub App インストールトークンを使わせたい場合は、`scripts/gh-read` を使用してください。

必須環境変数:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

任意環境変数:

- リポジトリベースのインストール検索をスキップしたい場合の `OPENCLAW_GH_READ_INSTALLATION_ID`
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

- スクリプトは目的を絞り、文書化してください。
- 関連するドキュメントに短い項目を追加してください（存在しない場合は作成してください）。

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
