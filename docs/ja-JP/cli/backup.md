---
read_when:
    - ローカルのOpenClaw状態向けに本格的なバックアップアーカイブが必要
    - リセットまたはアンインストールの前に、どのパスが含まれるかをプレビューしたい場合
summary: '`openclaw backup` の CLI リファレンス（ローカルバックアップアーカイブを作成）'
title: バックアップ
x-i18n:
    generated_at: "2026-05-10T19:27:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw の状態、設定、認証プロファイル、チャンネル/プロバイダー認証情報、セッション、および任意でワークスペース用のローカルバックアップアーカイブを作成します。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 注記

- アーカイブには、解決済みのソースパスとアーカイブレイアウトを含む `manifest.json` ファイルが含まれます。
- デフォルトの出力先は、現在の作業ディレクトリ内のタイムスタンプ付き `.tar.gz` アーカイブです。
- 現在の作業ディレクトリがバックアップ対象のソースツリー内にある場合、OpenClaw はデフォルトのアーカイブ場所としてホームディレクトリにフォールバックします。
- 既存のアーカイブファイルが上書きされることはありません。
- 自己包含を避けるため、ソースの状態/ワークスペースツリー内の出力パスは拒否されます。
- `openclaw backup verify <archive>` は、アーカイブにルートマニフェストが 1 つだけ含まれていることを検証し、トラバーサル形式のアーカイブパスを拒否し、マニフェストで宣言されたすべてのペイロードが tarball 内に存在することを確認します。
- `openclaw backup create --verify` は、アーカイブを書き込んだ直後にその検証を実行します。
- `openclaw backup create --only-config` は、アクティブな JSON 設定ファイルだけをバックアップします。

## バックアップ対象

`openclaw backup create` は、ローカルの OpenClaw インストールからバックアップソースを計画します。

- OpenClaw のローカル状態リゾルバーが返す状態ディレクトリ。通常は `~/.openclaw`
- アクティブな設定ファイルのパス
- 状態ディレクトリの外部に存在する場合の、解決済みの `credentials/` ディレクトリ
- `--no-include-workspace` を渡していない場合、現在の設定から検出されたワークスペースディレクトリ

モデル認証プロファイルは、すでに状態ディレクトリ内の
`agents/<agentId>/agent/auth-profiles.json` に含まれているため、通常は
状態バックアップエントリによってカバーされます。

`--only-config` を使用すると、OpenClaw は状態、認証情報ディレクトリ、ワークスペースの検出をスキップし、アクティブな設定ファイルのパスだけをアーカイブします。

OpenClaw はアーカイブを構築する前にパスを正規化します。設定、
認証情報ディレクトリ、またはワークスペースがすでに状態ディレクトリ内にある場合、
それらは個別のトップレベルバックアップソースとして重複されません。存在しないパスは
スキップされます。

アーカイブのペイロードには、それらのソースツリーからのファイル内容が保存され、埋め込まれた `manifest.json` には、解決済みの絶対ソースパスと各アセットに使用されたアーカイブレイアウトが記録されます。

アーカイブ作成中、OpenClaw は復元価値のない既知のライブ変更ファイルをスキップします。これには、アクティブなエージェントセッションのトランスクリプト、cron 実行ログ、ローリングログ、配信キュー、状態ディレクトリ配下のソケット/pid/一時ファイル、および関連する永続キューの一時ファイルが含まれます。JSON 結果には `skippedVolatileCount` が含まれるため、自動化は意図的に省略されたファイル数を確認できます。

状態ディレクトリの `extensions/` ツリー配下にあるインストール済み Plugin のソースとマニフェストファイルは含まれますが、入れ子になった `node_modules/` 依存関係ツリーはスキップされます。これらの依存関係は再構築可能なインストール成果物です。アーカイブを復元した後、復元された Plugin が依存関係の欠落を報告する場合は、`openclaw plugins update <id>` を使用するか、`openclaw plugins install <spec> --force` で Plugin を再インストールしてください。

## 無効な設定の挙動

`openclaw backup` は、復旧時にも役立てられるよう、通常の設定プリフライトを意図的にバイパスします。ワークスペース検出は有効な設定に依存するため、設定ファイルが存在するが無効で、ワークスペースバックアップがまだ有効な場合、`openclaw backup create` は即座に失敗します。

その状況でも部分バックアップが必要な場合は、次を再実行します。

```bash
openclaw backup create --no-include-workspace
```

これにより、状態、設定、外部認証情報ディレクトリは対象に含めたまま、
ワークスペース検出を完全にスキップします。

設定ファイル自体のコピーだけが必要な場合、`--only-config` も、ワークスペース検出のために設定を解析しないため、設定が不正な形式でも機能します。

## サイズとパフォーマンス

OpenClaw には、組み込みの最大バックアップサイズやファイル単位のサイズ上限はありません。

実際の制限は、ローカルマシンと宛先ファイルシステムに由来します。

- 一時アーカイブの書き込みと最終アーカイブに必要な空き容量
- 大きなワークスペースツリーを走査し、`.tar.gz` に圧縮する時間
- `openclaw backup create --verify` を使用する場合、または `openclaw backup verify` を実行する場合にアーカイブを再スキャンする時間
- 宛先パスでのファイルシステムの挙動。OpenClaw は上書きしないハードリンクによる公開ステップを優先し、ハードリンクがサポートされていない場合は排他的コピーにフォールバックします

大きなワークスペースは通常、アーカイブサイズの主な要因です。より小さく、または高速なバックアップが必要な場合は、`--no-include-workspace` を使用してください。

最小のアーカイブには、`--only-config` を使用します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
