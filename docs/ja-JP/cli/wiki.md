---
read_when:
    - memory-wiki CLI を使用する場合
    - '`openclaw wiki` を文書化または変更しています'
summary: '`openclaw wiki` の CLI リファレンス（memory-wiki vault のステータス、検索、コンパイル、lint、適用、ブリッジ、ChatGPT インポート、Obsidian ヘルパー）'
title: ウィキ
x-i18n:
    generated_at: "2026-07-12T14:24:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` vault を調査および保守します。バンドルされている `memory-wiki` Plugin によって提供されます。

関連項目: [Memory Wiki Plugin](/ja-JP/plugins/memory-wiki)、[メモリの概要](/ja-JP/concepts/memory)、[CLI: メモリ](/ja-JP/cli/memory)

## 一般的なコマンド

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "Teams について誰に聞けばよいですか？" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha の要約" \
  --body "短い統合本文" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "まだ有効ですか？"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## エージェントの選択

`plugins.entries.memory-wiki.config.vault.scope` が `agent` の場合は、トップレベルの `--agent <id>` オプションで
vault を選択します。

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "返金ポリシー"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

複数のエージェントが設定されている環境では、コマンドが任意のデフォルト vault を読み書きできないように、CLI
操作には `--agent` が必要です。設定されているエージェントが 1 つだけの場合、そのエージェントが引き続きデフォルトになります。不明なエージェント ID は
vault 操作の開始前にエラーになります。`vault.scope` が `global` の場合、このオプションは選択された
パスを変更しません。

Gateway クライアントも同じルールに従います。エージェントスコープのマルチエージェント環境では、vault を使用する `wiki.*`
リクエストに `agentId` を渡してください。ID がない場合や不明な場合は
エラーになります。エージェントターン、wiki ツール、メモリコーパスの補足、およびコンパイル済みプロンプト
ダイジェストには、すでにアクティブなランタイムエージェントのコンテキストが含まれています。

## コマンド

### `wiki status`

vault のモードとスコープ、解決されたエージェント、健全性、および Obsidian CLI の利用可否を表示します。目的の vault が初期化されているか、ブリッジモードが正常か、または Obsidian 連携が利用可能かを確認するには、最初にこれを使用します。

ブリッジモードが有効で、メモリアーティファクトを読み取るように設定されている場合、このコマンドは実行中の Gateway に問い合わせるため、エージェントまたはランタイムのメモリと同じアクティブなメモリ Plugin コンテキストを参照します。

### `wiki doctor`

wiki の健全性チェックを実行し、実行可能な修正方法を報告します。異常がある場合はゼロ以外で終了します。

ブリッジモードが有効で、メモリアーティファクトを読み取るように設定されている場合、このコマンドはレポートを作成する前に実行中の Gateway に問い合わせます。無効化されているブリッジインポート、およびメモリアーティファクトを読み取らないブリッジ設定は、ローカルまたはオフラインのままです。

典型的な問題:

- 公開メモリアーティファクトなしでブリッジモードが有効になっている
- vault レイアウトが無効または存在しない
- Obsidian モードが想定されているときに外部の Obsidian CLI が存在しない

### `wiki init`

トップレベルのインデックスとキャッシュディレクトリを含む、wiki vault のレイアウトと初期ページを作成します。

### `wiki ingest <path>`

ローカルの Markdown またはテキストファイルを、ソースページとして wiki の `sources/` フォルダーにインポートします。`<path>` はローカルファイルのパスである必要があります。現在、URL からの取り込みには対応していません。バイナリファイルは拒否されます。

インポートされたソースページには、出自を示すフロントマター（`sourceType: local-file`、`sourcePath`、`ingestedAt`）が含まれます。取り込み後は常に vault が再コンパイルされます。

フラグ: `--title <title>` はソースのタイトルを上書きします（デフォルト: ファイル名から生成）。

### `wiki okf import <path>`

展開済みの Open Knowledge Format バンドルを wiki のコンセプトページにインポートします。

インポーターは OKF ディレクトリツリー内にある予約対象外のすべての `.md` コンセプト文書を読み取り、空でない `type` フィールドを必須とし、不明な OKF の `type` 値を汎用コンセプトとして扱います。予約済みの OKF `index.md` および `log.md` ファイルはコンセプトとしてインポートされません。

インポートされたページは `concepts/` 直下にフラット化されるため、既存の wiki のコンパイル、検索、取得、ダイジェスト、およびダッシュボードの各フローからすぐに参照できます。元の OKF コンセプト ID、`type`、`resource`、`tags`、タイムスタンプ、ソースパス、および完全なフロントマターは、ページのフロントマターに保持されます。OKF 内部の Markdown リンクは生成された wiki ページを指すように書き換えられ、壊れたリンクや外部リンクは変更されません。インポート後は常に vault が再コンパイルされます。

例:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery テーブル" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

インデックス、関連ブロック、ダッシュボード、およびコンパイル済みダイジェストを再構築します。機械処理向けの安定したアーティファクトを次の場所に書き込みます。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` が有効な場合、コンパイルによってレポートページも更新されます。

### `wiki lint`

vault を lint し、以下を含むレポートを書き出します。

- 構造上の問題（リンク切れ、ID の欠落または重複、ページの種類またはタイトルの欠落、無効なフロントマター）
- 出自情報の不足（ソース ID の欠落、インポート元情報の欠落）
- 矛盾（フラグが付けられた矛盾、競合する主張）
- 未解決の質問
- 信頼度の低いページと主張
- 古くなったページと主張

wiki に重要な更新を行った後に実行してください。

### `wiki search <query>`

wiki の内容を検索します。動作は設定によって異なります。

- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`
- `--mode`: `auto`、`find-person`、`route-question`、`source-evidence`、または `raw-claim`

wiki 固有のランキングと出自情報が必要な場合は、`wiki search` を使用します。広範な共有記憶を 1 回で検索する場合、アクティブなメモリ Plugin が共有検索を公開していれば、`openclaw memory search` を推奨します。

検索モード:

- `find-person`: 別名、ハンドル名、ソーシャルアカウント、正規 ID、および人物ページ
- `route-question`: 質問先または適した用途のヒントと関係性のコンテキスト
- `source-evidence`: ソースページと構造化された証拠フィールド
- `raw-claim`: 主張および証拠のメタデータを含む構造化された主張テキスト

例:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "Teams の展開に詳しいのは誰ですか？" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "Teams への有力な問い合わせ先" --mode raw-claim --json
```

結果が構造化された主張に一致する場合、テキスト出力には `Claim:` 行と `Evidence:` 行が含まれます。JSON 出力では、エージェント側での詳細確認用に `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、および `evidenceSourceIds` も公開されます。

### `wiki get <lookup>`

ID または相対パスを指定して wiki ページを読み取ります。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

ページを自由形式で直接編集せず、限定的な変更を適用します。

- `apply synthesis <title>`: 管理対象の要約本文を含む統合ページを作成または更新する
- `apply metadata <lookup>`: 既存ページのメタデータを更新する

どちらも `--source-id`、`--contradiction`、`--question`（それぞれ繰り返し指定可能）、`--confidence <n>`（0-1）、および `--status <status>` を受け付けます。`apply metadata` は、保存されている信頼度の値を削除する `--clear-confidence` も受け付けます。これは、管理対象の生成ブロックを維持したまま wiki ページを発展させるためにサポートされている方法です。

### `wiki bridge import`

アクティブなメモリ Plugin から公開メモリアーティファクトを、ブリッジを使用するソースページにインポートします。新しくエクスポートされたメモリアーティファクトを wiki vault に取り込むには、`bridge` モードでこれを使用します。

アクティブなブリッジアーティファクトの読み取りでは、CLI は Gateway RPC 経由でインポートをルーティングするため、ランタイムのメモリ Plugin コンテキストが使用されます。ブリッジインポートが無効になっている場合、またはアーティファクトの読み取りがオフになっている場合、コマンドはローカルまたはオフラインでインポート件数ゼロの動作を維持します。インポート後のインデックス更新は `ingest.autoCompile` によって制御されます。

### `wiki unsafe-local import`

`unsafe-local` モードで、明示的に設定されたローカルパス（`unsafeLocal.paths`）からインポートします。意図的に実験的な機能であり、同一マシン内でのみ使用できます。インポート後のインデックス更新は `ingest.autoCompile` によって制御されます。

### `wiki chatgpt import`

ChatGPT のエクスポートを wiki のドラフトソースページにインポートします。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| フラグ            | デフォルト | 説明                                                                 |
| ----------------- | ---------- | -------------------------------------------------------------------- |
| `--export <path>` | （必須）   | ChatGPT のエクスポートディレクトリまたは `conversations.json` のパス。 |
| `--dry-run`       | `false`    | ページを書き込まず、作成、更新、スキップの件数をプレビューします。       |

ドライランではないインポートでいずれかのページが変更されると、ロールバックに必要なインポート実行 ID が記録され、概要に出力されます。

### `wiki chatgpt rollback <run-id>`

以前に適用した ChatGPT のインポート実行をロールバックし、その実行で作成されたページを削除して、上書きされたページを復元します。その実行がすでにロールバック済みの場合は何も行わず、`alreadyRolledBack` を報告します。

### `wiki obsidian ...`

Obsidian 対応モードで動作する vault 向けの Obsidian ヘルパーコマンド: `status`、`search`、`open`、`command`、`daily`。`obsidian.useOfficialCli` が有効な場合、これらを使用するには公式の `obsidian` CLI が `PATH` 上に必要です。

`obsidian.vaultName` はエージェントごとのマッピングではなく 1 つのグローバル設定であるため、
`vault.scope` が `agent` の場合、設定検証は `obsidian.useOfficialCli: true` を拒否します。
Obsidian 対応の Markdown レンダリングは引き続き
利用できます。

## 実用上の使用ガイド

- 出自情報とページの識別情報が重要な場合は、`wiki search` と `wiki get` を使用します。
- 管理対象の生成セクションを手動編集する代わりに、`wiki apply` を使用します。
- 矛盾する内容や信頼度の低い内容を信用する前に、`wiki lint` を使用します。
- 一括インポートまたはソース変更の後、最新のダッシュボードとコンパイル済みダイジェストがすぐに必要な場合は、`wiki compile` を使用します。
- データカタログ、ドキュメントのエクスポート、またはエージェントの情報拡充パイプラインがすでに OKF Markdown バンドルを出力する場合は、`wiki okf import` を使用します。
- ブリッジモードが新しくエクスポートされたメモリアーティファクトに依存する場合は、`wiki bridge import` を使用します。

## 関連する設定

`openclaw wiki` の動作は次の設定によって決まります。

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完全な設定モデルについては、[Memory Wiki Plugin](/ja-JP/plugins/memory-wiki)を参照してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Memory Wiki](/ja-JP/plugins/memory-wiki)
