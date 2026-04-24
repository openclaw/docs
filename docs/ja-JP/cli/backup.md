---
read_when:
    - ローカルの OpenClaw 状態用の正式なバックアップアーカイブが必要な場合
    - リセットやアンインストールの前に、どのパスが含まれるかをプレビューしたい場合
summary: '`openclaw backup` の CLI リファレンス（ローカルバックアップアーカイブを作成）'
title: バックアップ
x-i18n:
    generated_at: "2026-04-24T04:49:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

OpenClaw の状態、設定、認証プロファイル、チャンネル/プロバイダー認証情報、セッション、そして必要に応じてワークスペースのためのローカルバックアップアーカイブを作成します。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 注

- アーカイブには、解決済みのソースパスとアーカイブレイアウトを含む `manifest.json` ファイルが含まれます。
- デフォルトの出力先は、現在の作業ディレクトリに作成されるタイムスタンプ付きの `.tar.gz` アーカイブです。
- 現在の作業ディレクトリがバックアップ対象のソースツリー内にある場合、OpenClaw はデフォルトのアーカイブ保存先としてホームディレクトリにフォールバックします。
- 既存のアーカイブファイルが上書きされることはありません。
- 自己取り込みを避けるため、ソースの状態/ワークスペースツリー内にある出力パスは拒否されます。
- `openclaw backup verify <archive>` は、アーカイブにルートの manifest がちょうど 1 つ含まれていることを検証し、トラバーサル形式のアーカイブパスを拒否し、manifest で宣言されたすべてのペイロードが tarball 内に存在することを確認します。
- `openclaw backup create --verify` は、アーカイブを書き込んだ直後にその検証を実行します。
- `openclaw backup create --only-config` は、アクティブな JSON 設定ファイルだけをバックアップします。

## バックアップ対象

`openclaw backup create` は、ローカルの OpenClaw インストールからバックアップソースを計画します。

- OpenClaw のローカル状態リゾルバーが返す状態ディレクトリ（通常は `~/.openclaw`）
- アクティブな設定ファイルのパス
- 状態ディレクトリの外部に存在する場合の、解決済み `credentials/` ディレクトリ
- `--no-include-workspace` を指定しない限り、現在の設定から検出されたワークスペースディレクトリ

モデル認証プロファイルは、すでに
`agents/<agentId>/agent/auth-profiles.json` 配下の状態ディレクトリの一部であるため、通常は
状態バックアップエントリに含まれます。

`--only-config` を使用すると、OpenClaw は状態、認証情報ディレクトリ、ワークスペースの検出をスキップし、アクティブな設定ファイルパスのみをアーカイブします。

OpenClaw は、アーカイブを構築する前にパスを正規化します。設定、認証情報ディレクトリ、またはワークスペースがすでに状態ディレクトリ内にある場合、それらは個別のトップレベルバックアップソースとして重複して追加されません。存在しないパスはスキップされます。

アーカイブのペイロードには、それらのソースツリーからのファイル内容が保存され、埋め込まれた `manifest.json` には、各アセットで使用された解決済み絶対ソースパスとアーカイブレイアウトが記録されます。

## 無効な設定時の動作

`openclaw backup` は、復旧時にも役立てられるよう、意図的に通常の設定事前チェックをバイパスします。ワークスペース検出は有効な設定に依存するため、設定ファイルが存在するが無効であり、かつワークスペースバックアップが有効なままの場合、`openclaw backup create` は即座に失敗するようになっています。

その状況でも部分バックアップを行いたい場合は、次を再実行してください。

```bash
openclaw backup create --no-include-workspace
```

これにより、状態、設定、外部認証情報ディレクトリは対象に含めたまま、
ワークスペース検出だけを完全にスキップします。

設定ファイル自体のコピーだけが必要な場合は、ワークスペース検出のための設定解析に依存しないため、設定が不正でも `--only-config` が動作します。

## サイズとパフォーマンス

OpenClaw は、組み込みの最大バックアップサイズやファイルごとのサイズ制限を設けていません。

実際の制限はローカルマシンと保存先ファイルシステムによって決まります。

- 一時アーカイブ書き込みと最終アーカイブのための利用可能容量
- 大きなワークスペースツリーを走査して `.tar.gz` に圧縮する時間
- `openclaw backup create --verify` を使う場合、または `openclaw backup verify` を実行する場合の、アーカイブ再走査時間
- 保存先パスでのファイルシステムの挙動。OpenClaw は上書きなしのハードリンク公開ステップを優先し、ハードリンクが未サポートの場合は排他的コピーにフォールバックします

大きなワークスペースは通常、アーカイブサイズの主な要因です。より小さく、より高速なバックアップが必要なら、`--no-include-workspace` を使用してください。

最小のアーカイブにするには、`--only-config` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
