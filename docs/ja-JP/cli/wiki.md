---
read_when:
    - memory-wiki CLI を使用する場合
    - '`openclaw wiki` を文書化または変更しています'
summary: '`openclaw wiki` の CLI リファレンス（memory-wiki vault のステータス、検索、コンパイル、lint、適用、ブリッジ、ChatGPT インポート、Obsidian ヘルパー）'
title: ウィキ
x-i18n:
    generated_at: "2026-07-11T22:09:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki`保管庫を検査・管理します。バンドルされた`memory-wiki` Pluginによって提供されます。

関連項目：[Memory Wiki Plugin](/ja-JP/plugins/memory-wiki)、[メモリの概要](/ja-JP/concepts/memory)、[CLI：メモリ](/ja-JP/cli/memory)

## よく使うコマンド

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

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

`plugins.entries.memory-wiki.config.vault.scope`が`agent`の場合は、トップレベルの`--agent <id>`オプションで保管庫を選択します。

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

複数のエージェントが設定された環境では、コマンドが任意のデフォルト保管庫を読み書きできないように、CLI操作に`--agent`が必須です。設定されたエージェントが1つだけの場合、そのエージェントが引き続きデフォルトになります。不明なエージェントIDは、保管庫操作の開始前にエラーになります。`vault.scope`が`global`の場合、このオプションによって選択されたパスは変わりません。

Gatewayクライアントにも同じ規則が適用されます。エージェント単位のマルチエージェント環境では、保管庫を利用する`wiki.*`リクエストに`agentId`を渡します。IDがない場合や不明な場合はエラーになります。エージェントターン、Wikiツール、メモリコーパスの補足、およびコンパイル済みプロンプトダイジェストには、アクティブなランタイムエージェントのコンテキストがすでに含まれています。

## コマンド

### `wiki status`

保管庫のモードとスコープ、解決されたエージェント、健全性、およびObsidian CLIの利用可否を表示します。目的の保管庫が初期化されているか、ブリッジモードが正常か、またはObsidian連携が利用可能かを確認するには、最初にこれを使用します。

ブリッジモードが有効で、メモリアーティファクトを読み取るよう設定されている場合、このコマンドは実行中のGatewayに問い合わせるため、エージェントやランタイムのメモリと同じアクティブなメモリPluginコンテキストを参照します。

### `wiki doctor`

Wikiの健全性チェックを実行し、実行可能な修正方法を報告します。異常がある場合はゼロ以外で終了します。

ブリッジモードが有効で、メモリアーティファクトを読み取るよう設定されている場合、このコマンドはレポートを構築する前に実行中のGatewayへ問い合わせます。ブリッジインポートが無効な場合や、メモリアーティファクトを読み取らないブリッジ設定の場合は、ローカル／オフラインのまま動作します。

代表的な問題：

- 公開メモリアーティファクトなしでブリッジモードが有効
- 保管庫レイアウトが無効または存在しない
- Obsidianモードを使用する設定で、外部のObsidian CLIが存在しない

### `wiki init`

トップレベルのインデックスやキャッシュディレクトリを含む、Wiki保管庫のレイアウトと初期ページを作成します。

### `wiki ingest <path>`

ローカルのMarkdownまたはテキストファイルを、ソースページとしてWikiの`sources/`フォルダーにインポートします。`<path>`はローカルファイルパスである必要があります。現時点ではURLからの取り込みには対応していません。バイナリファイルは拒否されます。

インポートされたソースページには、来歴のfrontmatter（`sourceType: local-file`、`sourcePath`、`ingestedAt`）が含まれます。取り込み後は常に保管庫が再コンパイルされます。

フラグ：`--title <title>`でソースのタイトルを上書きします（デフォルト：ファイル名から生成）。

### `wiki okf import <path>`

展開済みのOpen Knowledge FormatバンドルをWikiの概念ページへインポートします。

インポーターはOKFディレクトリツリー内の予約対象外の`.md`概念ドキュメントをすべて読み取り、空でない`type`フィールドを必須とし、不明なOKFの`type`値を汎用概念として扱います。予約済みのOKFファイル`index.md`と`log.md`は、概念としてインポートされません。

インポートされたページは`concepts/`配下にフラット化されるため、既存のWikiのコンパイル、検索、取得、ダイジェスト、およびダッシュボードの処理から即座に参照できます。元のOKF概念ID、`type`、`resource`、`tags`、タイムスタンプ、ソースパス、および完全なfrontmatterは、ページのfrontmatterに保持されます。OKF内部のMarkdownリンクは生成されたWikiページへのリンクに書き換えられますが、壊れたリンクや外部リンクは変更されません。インポート後は常に保管庫が再コンパイルされます。

例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

インデックス、関連ブロック、ダッシュボード、およびコンパイル済みダイジェストを再構築します。機械処理向けの安定したアーティファクトを次の場所に書き込みます。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards`が有効な場合、コンパイルによってレポートページも更新されます。

### `wiki lint`

保管庫をlintし、次の内容を含むレポートを書き込みます。

- 構造上の問題（壊れたリンク、IDの欠落／重複、ページ種別またはタイトルの欠落、無効なfrontmatter）
- 来歴の欠落（ソースIDの欠落、インポート来歴の欠落）
- 矛盾（フラグ付きの矛盾、競合する主張）
- 未解決の質問
- 信頼度の低いページと主張
- 古くなったページと主張

Wikiを大きく更新した後に実行してください。

### `wiki search <query>`

Wikiの内容を検索します。動作は設定によって異なります。

- `search.backend`：`shared`または`local`
- `search.corpus`：`wiki`、`memory`、または`all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence`、または`raw-claim`

Wiki固有のランキングと来歴が重要な場合は、`wiki search`を使用します。広範な共有想起を1回行う場合、アクティブなメモリPluginが共有検索を公開しているなら、`openclaw memory search`を推奨します。

検索モード：

- `find-person`：別名、ハンドル名、ソーシャル情報、正規ID、人物ページ
- `route-question`：問い合わせ先／最適な用途のヒントと関係性のコンテキスト
- `source-evidence`：ソースページと構造化された根拠フィールド
- `raw-claim`：主張／根拠メタデータ付きの構造化された主張テキスト

例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

結果が構造化された主張に一致すると、テキスト出力には`Claim:`行と`Evidence:`行が含まれます。JSON出力では、エージェント側で詳細を確認できるように、`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、および`evidenceSourceIds`も公開されます。

### `wiki get <lookup>`

IDまたは相対パスでWikiページを読み取ります。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

自由形式でページを直接編集せず、限定的な変更を適用します。

- `apply synthesis <title>`：管理された要約本文を持つ統合ページを作成または更新
- `apply metadata <lookup>`：既存ページのメタデータを更新

どちらも`--source-id`、`--contradiction`、`--question`（それぞれ複数回指定可能）、`--confidence <n>`（0～1）、および`--status <status>`を受け付けます。`apply metadata`は、保存された信頼度の値を削除する`--clear-confidence`にも対応します。管理対象の生成ブロックを損なわずにWikiページを更新するための、サポートされている方法です。

### `wiki bridge import`

アクティブなメモリPluginから公開メモリアーティファクトを、ブリッジを利用するソースページへインポートします。`bridge`モードでは、最新のエクスポート済みメモリアーティファクトをWiki保管庫に取り込むために使用します。

アクティブなブリッジアーティファクトの読み取りでは、CLIはGateway RPC経由でインポートをルーティングし、ランタイムのメモリPluginコンテキストを使用します。ブリッジインポートが無効な場合、またはアーティファクトの読み取りがオフの場合、コマンドはローカル／オフラインでインポート件数ゼロの動作を維持します。インポート後のインデックス更新は`ingest.autoCompile`によって制御されます。

### `wiki unsafe-local import`

`unsafe-local`モードで、明示的に設定されたローカルパス（`unsafeLocal.paths`）からインポートします。意図的に実験的な機能であり、同一マシン内でのみ使用できます。インポート後のインデックス更新は`ingest.autoCompile`によって制御されます。

### `wiki chatgpt import`

ChatGPTのエクスポートをWikiの下書きソースページへインポートします。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| フラグ            | デフォルト | 説明                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必須）   | ChatGPTのエクスポートディレクトリまたは`conversations.json`のパス。 |
| `--dry-run`       | `false`    | ページを書き込まず、作成／更新／スキップ件数をプレビューします。 |

ドライランではないインポートでいずれかのページが変更された場合、ロールバックに必要なインポート実行IDが記録され、概要に表示されます。

### `wiki chatgpt rollback <run-id>`

以前適用したChatGPTインポートの実行をロールバックし、その実行で作成されたページを削除して、上書きされたページを復元します。その実行がすでにロールバック済みの場合は何も行わず、`alreadyRolledBack`を報告します。

### `wiki obsidian ...`

Obsidian互換モードで動作する保管庫向けのObsidian補助コマンド：`status`、`search`、`open`、`command`、`daily`。`obsidian.useOfficialCli`が有効な場合、これらを使用するには公式の`obsidian` CLIが`PATH`に存在する必要があります。

`vault.scope`が`agent`の場合、設定の検証によって`obsidian.useOfficialCli: true`は拒否されます。これは、`obsidian.vaultName`がエージェントごとのマッピングではなく、単一のグローバル設定であるためです。Obsidian互換のMarkdownレンダリングは引き続き利用できます。

## 実践的な使用ガイド

- 来歴とページIDが重要な場合は、`wiki search`と`wiki get`を使用します。
- 管理対象の生成セクションを手動編集する代わりに、`wiki apply`を使用します。
- 矛盾する内容や信頼度の低い内容を信用する前に、`wiki lint`を使用します。
- 一括インポートやソース変更の後、最新のダッシュボードとコンパイル済みダイジェストをすぐに必要とする場合は、`wiki compile`を使用します。
- データカタログ、ドキュメントのエクスポート、またはエージェント拡充パイプラインがすでにOKF Markdownバンドルを出力している場合は、`wiki okf import`を使用します。
- ブリッジモードが新しくエクスポートされたメモリアーティファクトに依存する場合は、`wiki bridge import`を使用します。

## 関連する設定

`openclaw wiki`の動作は、次の設定によって決まります。

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

- [CLIリファレンス](/ja-JP/cli)
- [Memory Wiki](/ja-JP/plugins/memory-wiki)
