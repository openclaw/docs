---
read_when:
    - ローカルの OpenClaw 状態用に本格的なバックアップアーカイブが必要な場合
    - リセットまたはアンインストールの前に、どのパスが含まれるかをプレビューしたい
summary: '`openclaw backup` の CLI リファレンス（ローカルバックアップアーカイブを作成）'
title: バックアップ
x-i18n:
    generated_at: "2026-04-30T05:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw の状態、設定、認証プロファイル、チャンネル/プロバイダー認証情報、セッション、任意でワークスペースのローカルバックアップアーカイブを作成します。

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
- 既定の出力先は、現在の作業ディレクトリ内のタイムスタンプ付き `.tar.gz` アーカイブです。
- 現在の作業ディレクトリがバックアップ対象のソースツリー内にある場合、OpenClaw は既定のアーカイブ場所としてホームディレクトリにフォールバックします。
- 既存のアーカイブファイルは上書きされません。
- ソースの状態/ワークスペースツリー内の出力パスは、自己包含を避けるために拒否されます。
- `openclaw backup verify <archive>` は、アーカイブにルートマニフェストが 1 つだけ含まれていることを検証し、トラバーサル形式のアーカイブパスを拒否し、マニフェストで宣言されたすべてのペイロードが tarball 内に存在することを確認します。
- `openclaw backup create --verify` は、アーカイブを書き込んだ直後にその検証を実行します。
- `openclaw backup create --only-config` は、アクティブな JSON 設定ファイルだけをバックアップします。

## バックアップされるもの

`openclaw backup create` は、ローカルの OpenClaw インストールからバックアップソースを計画します。

- OpenClaw のローカル状態リゾルバーが返す状態ディレクトリ。通常は `~/.openclaw`
- アクティブな設定ファイルパス
- 状態ディレクトリ外に存在する場合の、解決済みの `credentials/` ディレクトリ
- `--no-include-workspace` を渡さない限り、現在の設定から検出されたワークスペースディレクトリ

モデル認証プロファイルは、すでに状態ディレクトリ内の
`agents/<agentId>/agent/auth-profiles.json` に含まれているため、通常は
状態バックアップエントリの対象になります。

`--only-config` を使用すると、OpenClaw は状態、認証情報ディレクトリ、ワークスペース検出をスキップし、アクティブな設定ファイルパスだけをアーカイブします。

OpenClaw はアーカイブを構築する前にパスを正規化します。設定、
認証情報ディレクトリ、またはワークスペースがすでに状態ディレクトリ内にある場合、
それらは個別のトップレベルバックアップソースとして重複されません。存在しないパスは
スキップされます。

アーカイブペイロードには、それらのソースツリーからのファイル内容が保存され、埋め込まれた `manifest.json` には、解決済みの絶対ソースパスと各アセットに使用されたアーカイブレイアウトが記録されます。

状態ディレクトリの `extensions/` ツリー配下にあるインストール済み Plugin のソースファイルとマニフェストファイルは含まれますが、ネストされた `node_modules/` 依存関係ツリーはスキップされます。これらの依存関係は再構築可能なインストール成果物です。アーカイブを復元した後、復元された Plugin が依存関係の不足を報告する場合は、`openclaw plugins update <id>` を使用するか、`openclaw plugins install <spec> --force` で Plugin を再インストールしてください。

## 無効な設定の動作

`openclaw backup` は、復旧中にも役立てられるよう、通常の設定プリフライトを意図的にバイパスします。ワークスペース検出は有効な設定に依存するため、設定ファイルが存在するが無効で、ワークスペースバックアップがまだ有効な場合、`openclaw backup create` は現在すばやく失敗します。

その状況でも部分的なバックアップが必要な場合は、次を再実行します。

```bash
openclaw backup create --no-include-workspace
```

これにより、状態、設定、外部の認証情報ディレクトリを対象に含めたまま、
ワークスペース検出だけを完全にスキップします。

設定ファイル自体のコピーだけが必要な場合は、`--only-config` も機能します。これは、ワークスペース検出のために設定を解析することに依存しないため、設定が不正な形式でも使用できます。

## サイズとパフォーマンス

OpenClaw には、組み込みの最大バックアップサイズやファイル単位のサイズ制限はありません。

実際の制限は、ローカルマシンと保存先ファイルシステムによって決まります。

- 一時アーカイブ書き込みと最終アーカイブに必要な空き容量
- 大きなワークスペースツリーを走査し、`.tar.gz` に圧縮する時間
- `openclaw backup create --verify` を使用する場合、または `openclaw backup verify` を実行する場合に、アーカイブを再スキャンする時間
- 保存先パスでのファイルシステムの動作。OpenClaw は上書きしないハードリンク公開ステップを優先し、ハードリンクがサポートされていない場合は排他的コピーにフォールバックします

大きなワークスペースは通常、アーカイブサイズの主な要因です。より小さく、またはより高速なバックアップが必要な場合は、`--no-include-workspace` を使用してください。

最小のアーカイブにするには、`--only-config` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
