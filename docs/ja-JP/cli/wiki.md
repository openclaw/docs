---
read_when:
    - memory-wiki CLIを使用したい
    - '`openclaw wiki` の文書化または変更を行っています'
summary: '`openclaw wiki` の CLI リファレンス（memory-wiki vault のステータス、検索、コンパイル、lint、適用、bridge、ChatGPT インポート、Obsidian ヘルパー）'
title: Wiki
x-i18n:
    generated_at: "2026-07-05T11:12:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f50389227366eadfb027b019998604be4651b44430f8d7c04d719990843dd84
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` ボルトを検査および保守します。バンドルされた `memory-wiki` plugin によって提供されます。

関連: [Memory Wiki plugin](/ja-JP/plugins/memory-wiki)、[Memory の概要](/ja-JP/concepts/memory)、[CLI: memory](/ja-JP/cli/memory)

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

## コマンド

### `wiki status`

ボルトモード、健全性、Obsidian CLI の可用性を表示します。ボルトが初期化済みか、ブリッジモードが健全か、Obsidian 連携が利用可能かを確認するために、最初に使用します。

ブリッジモードが有効で、memory アーティファクトを読み取るように構成されている場合、このコマンドは実行中の Gateway に問い合わせるため、エージェント/ランタイム memory と同じアクティブな memory plugin コンテキストを参照します。

### `wiki doctor`

wiki の健全性チェックを実行し、実行可能な修正を報告します。健全でない場合は非ゼロで終了します。

ブリッジモードが有効で、memory アーティファクトを読み取るように構成されている場合、このコマンドはレポートを作成する前に実行中の Gateway に問い合わせます。無効化されたブリッジインポート、および memory アーティファクトを読み取らないブリッジ設定は、ローカル/オフラインのままです。

典型的な問題:

- 公開 memory アーティファクトなしでブリッジモードが有効
- ボルトレイアウトが無効または欠落している
- Obsidian モードが想定されるときに外部 Obsidian CLI が欠落している

### `wiki init`

トップレベルのインデックスとキャッシュディレクトリを含む、wiki ボルトのレイアウトとスターターページを作成します。

### `wiki ingest <path>`

ローカルの markdown またはテキストファイルを、ソースページとして wiki の `sources/` フォルダーにインポートします。`<path>` はローカルファイルパスである必要があります。現時点では URL ingest はありません。バイナリファイルは拒否されます。

インポートされたソースページには、来歴 frontmatter（`sourceType: local-file`、`sourcePath`、`ingestedAt`）が含まれます。ingest は常にその後でボルトを再コンパイルします。

フラグ: `--title <title>` はソースタイトルを上書きします（デフォルト: ファイル名から派生）。

### `wiki okf import <path>`

展開済みの Open Knowledge Format バンドルを wiki の concept ページにインポートします。

インポーターは OKF ディレクトリツリー内の予約されていないすべての `.md` concept ドキュメントを読み取り、空でない `type` フィールドを要求し、未知の OKF `type` 値を汎用 concept として扱います。予約済みの OKF `index.md` および `log.md` ファイルは concept としてインポートされません。

インポートされたページは `concepts/` の下にフラット化されるため、既存の wiki compile、search、get、digest、dashboard フローからすぐに参照できます。元の OKF concept ID、`type`、`resource`、`tags`、タイムスタンプ、ソースパス、完全な frontmatter はページ frontmatter に保持されます。内部 OKF markdown リンクは生成された wiki ページに書き換えられます。壊れたリンクまたは外部リンクは変更されません。インポート後は常にボルトを再コンパイルします。

例:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

インデックス、関連ブロック、ダッシュボード、コンパイル済み digest を再構築します。安定した機械向けアーティファクトを次の場所に書き込みます。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` が有効な場合、compile はレポートページも更新します。

### `wiki lint`

ボルトを lint し、次を含むレポートを書き込みます。

- 構造上の問題（壊れたリンク、欠落/重複した ID、欠落したページタイプまたはタイトル、無効な frontmatter）
- 来歴の不足（ソース ID の欠落、インポート来歴の欠落）
- 矛盾（フラグ付き矛盾、競合する主張）
- 未解決の質問
- 信頼度の低いページと主張
- 古いページと主張

意味のある wiki 更新後にこれを実行します。

### `wiki search <query>`

wiki コンテンツを検索します。挙動は設定によって異なります。

- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`
- `--mode`: `auto`、`find-person`、`route-question`、`source-evidence`、または `raw-claim`

wiki 固有のランキングと来歴が重要な場合は `wiki search` を使用します。広範な共有 recall を 1 回行う場合は、アクティブな memory plugin が共有検索を公開しているなら `openclaw memory search` を優先します。

検索モード:

- `find-person`: エイリアス、ハンドル、ソーシャル、正規 ID、人物ページ
- `route-question`: ask-for/best-used-for ヒントと関係コンテキスト
- `source-evidence`: ソースページと構造化された証拠フィールド
- `raw-claim`: claim/evidence メタデータを含む構造化された主張テキスト

例:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

結果が構造化された主張に一致する場合、テキスト出力には `Claim:` と `Evidence:` 行が含まれます。JSON 出力ではさらに、エージェント側の詳細確認用に `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` が公開されます。

### `wiki get <lookup>`

ID または相対パスで wiki ページを読み取ります。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

自由形式のページ手術を行わずに、限定的な変更を適用します。

- `apply synthesis <title>`: 管理された要約本文を持つ synthesis ページを作成または更新する
- `apply metadata <lookup>`: 既存ページのメタデータを更新する

どちらも `--source-id`、`--contradiction`、`--question`（それぞれ繰り返し可能）、`--confidence <n>`（0-1）、`--status <status>` を受け付けます。`apply metadata` は保存済みの confidence 値を削除するための `--clear-confidence` も受け付けます。これは、管理された生成ブロックを壊さずに wiki ページを進化させるためにサポートされている方法です。

### `wiki bridge import`

アクティブな memory plugin から公開 memory アーティファクトを、ブリッジ backed のソースページにインポートします。`bridge` モードで、最新のエクスポート済み memory アーティファクトを wiki ボルトに取り込むために使用します。

アクティブなブリッジアーティファクト読み取りでは、CLI は Gateway RPC 経由でインポートをルーティングするため、ランタイム memory plugin コンテキストが使用されます。ブリッジインポートが無効、またはアーティファクト読み取りがオフの場合、コマンドはローカル/オフラインのゼロインポート挙動を維持します。インポート後のインデックス更新は `ingest.autoCompile` によって制御されます。

### `wiki unsafe-local import`

`unsafe-local` モードで、明示的に構成されたローカルパス（`unsafeLocal.paths`）からインポートします。意図的に実験的で、同一マシン専用です。インポート後のインデックス更新は `ingest.autoCompile` によって制御されます。

### `wiki chatgpt import`

ChatGPT エクスポートを下書き wiki ソースページにインポートします。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| フラグ | デフォルト | 説明 |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必須） | ChatGPT エクスポートディレクトリまたは `conversations.json` パス。 |
| `--dry-run` | `false` | ページを書き込まずに、作成/更新/スキップの件数をプレビューします。 |

dry-run ではないインポートでページが変更されると、インポート run id が記録され、概要に出力されます。rollback に必要です。

### `wiki chatgpt rollback <run-id>`

以前に適用した ChatGPT インポート run をロールバックし、それが作成したページを削除し、上書きしたページを復元します。run がすでにロールバック済みの場合は何もせず（`alreadyRolledBack` を報告します）。

### `wiki obsidian ...`

Obsidian フレンドリーモードで実行されているボルト向けの Obsidian ヘルパーコマンド: `status`、`search`、`open`、`command`、`daily`。`obsidian.useOfficialCli` が有効な場合、これらは `PATH` 上の公式 `obsidian` CLI を必要とします。

## 実用上の使用ガイダンス

- 来歴とページ ID が重要な場合は `wiki search` + `wiki get` を使用します。
- 管理された生成セクションを手編集する代わりに `wiki apply` を使用します。
- 矛盾しているコンテンツや信頼度の低いコンテンツを信頼する前に `wiki lint` を使用します。
- 一括インポートまたはソース変更後に、新しいダッシュボードとコンパイル済み digest をすぐに必要とする場合は `wiki compile` を使用します。
- データカタログ、ドキュメントエクスポート、またはエージェント強化パイプラインがすでに OKF markdown バンドルを出力している場合は `wiki okf import` を使用します。
- ブリッジモードが新しくエクスポートされた memory アーティファクトに依存する場合は `wiki bridge import` を使用します。

## 設定との関係

`openclaw wiki` の挙動は次によって決まります。

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完全な設定モデルについては [Memory Wiki plugin](/ja-JP/plugins/memory-wiki) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Memory wiki](/ja-JP/plugins/memory-wiki)
