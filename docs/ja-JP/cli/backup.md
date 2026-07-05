---
read_when:
    - ローカルの OpenClaw 状態用にファーストクラスのバックアップアーカイブが必要な場合
    - リセットまたはアンインストールの前に、どのパスが含まれるかをプレビューしたい場合
summary: '`openclaw backup` の CLI リファレンス（ローカルバックアップアーカイブを作成）'
title: バックアップ
x-i18n:
    generated_at: "2026-07-05T11:07:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48487eb747b88111899106f507b4ce6364b56c65b88da2e33c43fc160c6b17a9
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw の状態、設定、認証プロファイル、チャンネル/プロバイダー資格情報、セッション、および任意でワークスペースのローカルバックアップアーカイブを作成します。

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

- アーカイブには、解決済みのソースパスとアーカイブレイアウトを含む `manifest.json` が埋め込まれます。
- 既定の出力は、現在の作業ディレクトリ内のタイムスタンプ付き `.tar.gz` アーカイブです。タイムスタンプ付きファイル名には、マシンのローカルタイムゾーンが使用され、UTC オフセットが含まれます。現在の作業ディレクトリがバックアップ対象のソースツリー内にある場合、OpenClaw は既定のアーカイブ場所としてホームディレクトリにフォールバックします。
- 既存のアーカイブファイルは上書きされません。自己包含を避けるため、ソースの状態/ワークスペースツリー内の出力パスは拒否されます。
- `openclaw backup verify <archive>` は、アーカイブにルートマニフェストがちょうど 1 つ含まれていることを確認し、トラバーサル形式のアーカイブパスを拒否し、マニフェストで宣言されたすべてのペイロードが tarball 内に存在することを確認します。`openclaw backup create --verify` は、アーカイブを書き込んだ直後にその検証を実行します。
- `openclaw backup create --only-config` は、アクティブな JSON 設定ファイルだけをバックアップします。

## バックアップされる内容

`openclaw backup create` は、ローカルの OpenClaw インストールからソースを計画します。

- 状態ディレクトリ（通常は `~/.openclaw`）
- アクティブな設定ファイルパス
- 状態ディレクトリの外部に存在する場合の、解決済みの `credentials/` ディレクトリ
- `--no-include-workspace` を渡さない限り、現在の設定から検出されたワークスペースディレクトリ

認証プロファイルやその他のエージェントごとのランタイム状態は、状態ディレクトリ配下の SQLite（`agents/<agentId>/agent/openclaw-agent.sqlite`）に保存されるため、状態バックアップエントリによって自動的にカバーされます。

`--only-config` は、状態、資格情報ディレクトリ、ワークスペースの検出をスキップし、アクティブな設定ファイルパスのみをアーカイブします。

OpenClaw はアーカイブを構築する前にパスを正規化します。設定、資格情報ディレクトリ、またはワークスペースがすでに状態ディレクトリ内にある場合、それらは個別のトップレベルバックアップソースとして重複されません。存在しないパスはスキップされます。

アーカイブ作成中、OpenClaw は、復元価値のない既知のライブ変更ファイルをスキップします。これには、アクティブなエージェントセッションのトランスクリプト、cron 実行ログ、ローリングログ、配信キュー、状態ディレクトリ配下の socket/pid/temp ファイル、および関連する永続キューの一時ファイルが含まれます。JSON 結果の `skippedVolatileCount` は、意図的に省略されたファイル数を報告します。状態ディレクトリ配下の SQLite データベースは、ライブコピーではなく安全にスナップショット（`VACUUM INTO`）されるため、開いている WAL/SHM ファイルがバックアップを破損することはありません。

状態ディレクトリの `extensions/` ツリー配下にあるインストール済み Plugin のソースファイルとマニフェストファイルは含まれますが、ネストされた `node_modules/` 依存関係ツリーは再構築可能なインストール成果物としてスキップされます。アーカイブを復元した後、復元された Plugin が依存関係の欠落を報告する場合は、`openclaw plugins update <id>` を使用するか、`openclaw plugins install <spec> --force` で再インストールしてください。

## 無効な設定の挙動

`openclaw backup` は通常の設定プリフライトをバイパスするため、復旧中でも支援できます。ワークスペース検出は有効な設定に依存するため、設定ファイルが存在していても無効で、ワークスペースバックアップがまだ有効な場合、`openclaw backup create` は早期に失敗します。

その状況で部分バックアップを行うには、`--no-include-workspace` を付けて再実行します。これにより、ワークスペース検出を完全にスキップしつつ、状態、設定、外部資格情報ディレクトリは対象範囲に保持されます。

`--only-config` も、ワークスペース検出のために設定を解析しないため、設定が不正な形式でも動作します。

## サイズとパフォーマンス

OpenClaw は、組み込みの最大バックアップサイズやファイル単位のサイズ制限を強制しません。実際上の制限は以下から生じます。

- 一時アーカイブの書き込み分と最終アーカイブ分の利用可能な空き容量
- 大きなワークスペースツリーを走査し、それらを `.tar.gz` に圧縮する時間
- `--verify` または `openclaw backup verify` でアーカイブを再スキャンする時間
- 宛先ファイルシステムの挙動: OpenClaw は上書きなしのハードリンク公開ステップを優先し、ハードリンクがサポートされていない場合は排他的コピーにフォールバックします

大きなワークスペースは通常、アーカイブサイズの主な要因です。より小さく高速なバックアップには `--no-include-workspace` を使用し、最小のアーカイブには `--only-config` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
