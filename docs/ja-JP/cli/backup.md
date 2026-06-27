---
read_when:
    - OpenClaw のローカル状態用に第一級のバックアップアーカイブが必要です
    - リセットまたはアンインストールの前に、どのパスが含まれるかをプレビューしたい場合
summary: '`openclaw backup` の CLI リファレンス（ローカルバックアップアーカイブを作成）'
title: バックアップ
x-i18n:
    generated_at: "2026-06-27T10:52:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw の状態、設定、認証プロファイル、チャネル/プロバイダー認証情報、セッション、および任意でワークスペースのローカルバックアップアーカイブを作成します。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 注記

- アーカイブには、解決済みのソースパスとアーカイブレイアウトを含む `manifest.json` ファイルが含まれます。
- デフォルトの出力は、現在の作業ディレクトリ内のタイムスタンプ付き `.tar.gz` アーカイブです。
- タイムスタンプ付きバックアップファイル名は、マシンのローカルタイムゾーンを使用し、UTC オフセットを含みます。
- 現在の作業ディレクトリがバックアップ対象のソースツリー内にある場合、OpenClaw はデフォルトのアーカイブ場所としてホームディレクトリにフォールバックします。
- 既存のアーカイブファイルは上書きされません。
- 自己包含を避けるため、ソースの状態/ワークスペースツリー内の出力パスは拒否されます。
- `openclaw backup verify <archive>` は、アーカイブにルートマニフェストが正確に 1 つ含まれていることを検証し、トラバーサル形式のアーカイブパスを拒否し、マニフェストで宣言されたすべてのペイロードが tarball 内に存在することを確認します。
- `openclaw backup create --verify` は、アーカイブを書き込んだ直後にその検証を実行します。
- `openclaw backup create --only-config` は、アクティブな JSON 設定ファイルのみをバックアップします。

## バックアップされるもの

`openclaw backup create` は、ローカルの OpenClaw インストールからバックアップソースを計画します。

- OpenClaw のローカル状態リゾルバーが返す状態ディレクトリ。通常は `~/.openclaw`
- アクティブな設定ファイルパス
- 状態ディレクトリの外部に存在する場合の、解決済み `credentials/` ディレクトリ
- `--no-include-workspace` を渡さない限り、現在の設定から検出されたワークスペースディレクトリ

モデル認証プロファイルはすでに状態ディレクトリ内の
`agents/<agentId>/agent/auth-profiles.json` に含まれているため、通常は
状態バックアップエントリの対象になります。

`--only-config` を使用すると、OpenClaw は状態、認証情報ディレクトリ、ワークスペースの検出をスキップし、アクティブな設定ファイルパスのみをアーカイブします。

OpenClaw はアーカイブを構築する前にパスを正規化します。設定、
認証情報ディレクトリ、またはワークスペースがすでに状態ディレクトリ内にある場合、
それらは個別のトップレベルバックアップソースとして重複されません。存在しないパスは
スキップされます。

アーカイブのペイロードはこれらのソースツリーのファイル内容を保存し、埋め込まれた `manifest.json` は、解決済みの絶対ソースパスと、各アセットに使用されたアーカイブレイアウトを記録します。

アーカイブ作成中、OpenClaw は復元価値のない既知のライブ変更ファイルをスキップします。これには、アクティブなエージェントセッションのトランスクリプト、Cron 実行ログ、ローリングログ、配送キュー、状態ディレクトリ配下の socket/pid/temp ファイル、および関連する永続キューの一時ファイルが含まれます。JSON 結果には `skippedVolatileCount` が含まれるため、自動化では意図的に省略されたファイル数を確認できます。

状態ディレクトリの `extensions/` ツリー配下にあるインストール済み Plugin のソースファイルとマニフェストファイルは含まれますが、ネストされた `node_modules/` 依存関係ツリーはスキップされます。これらの依存関係は再構築可能なインストール成果物です。アーカイブを復元した後、復元された Plugin が依存関係の欠落を報告する場合は、`openclaw plugins update <id>` を使用するか、`openclaw plugins install <spec> --force` で Plugin を再インストールしてください。

## 無効な設定の動作

`openclaw backup` は、復旧中でも役立てられるように、通常の設定プリフライトを意図的に迂回します。ワークスペース検出は有効な設定に依存するため、設定ファイルが存在するものの無効で、ワークスペースバックアップがまだ有効な場合、`openclaw backup create` は現在すぐに失敗します。

その状況でも部分的なバックアップが必要な場合は、次を再実行します。

```bash
openclaw backup create --no-include-workspace
```

これにより、状態、設定、外部認証情報ディレクトリは対象にしたまま、
ワークスペース検出を完全にスキップします。

設定ファイル自体のコピーだけが必要な場合、`--only-config` も設定が不正な形式のときに機能します。これはワークスペース検出のために設定を解析する必要がないためです。

## サイズとパフォーマンス

OpenClaw は、組み込みの最大バックアップサイズやファイルごとのサイズ制限を適用しません。

実際の制限は、ローカルマシンと宛先ファイルシステムに由来します。

- 一時アーカイブ書き込みと最終アーカイブに使用できる空き容量
- 大きなワークスペースツリーを走査して `.tar.gz` に圧縮する時間
- `openclaw backup create --verify` を使用する場合、または `openclaw backup verify` を実行する場合にアーカイブを再スキャンする時間
- 宛先パスでのファイルシステムの動作。OpenClaw は上書きなしのハードリンク公開ステップを優先し、ハードリンクがサポートされていない場合は排他的コピーにフォールバックします

大きなワークスペースは通常、アーカイブサイズの主な要因です。より小さく、またはより高速なバックアップが必要な場合は、`--no-include-workspace` を使用してください。

最小のアーカイブには、`--only-config` を使用します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
