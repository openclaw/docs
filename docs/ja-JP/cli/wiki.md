---
read_when:
    - memory-wiki CLI を使用したい
    - '`openclaw wiki` を文書化または変更しています'
summary: 'CLI リファレンス: `openclaw wiki`（memory-wiki vault のステータス、検索、コンパイル、lint、適用、ブリッジ、Obsidian ヘルパー）'
title: ウィキ
x-i18n:
    generated_at: "2026-06-27T11:04:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` 保管庫を検査して保守します。

バンドルされた `memory-wiki` plugin によって提供されます。

関連:

- [Memory Wiki plugin](/ja-JP/plugins/memory-wiki)
- [メモリ概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)

## 用途

次のものを備えたコンパイル済みのナレッジ保管庫が必要な場合は、`openclaw wiki` を使用します。

- wiki ネイティブ検索とページ読み取り
- 出典情報が豊富な統合
- 矛盾と鮮度のレポート
- active memory plugin からのブリッジインポート
- オプションの Obsidian CLI ヘルパー

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## コマンド

### `wiki status`

現在の保管庫モード、健全性、Obsidian CLI の可用性を検査します。

保管庫が初期化済みか、ブリッジモードが正常か、または Obsidian 統合を利用できるか不明な場合は、最初にこれを使用します。

ブリッジモードが有効で、メモリアーティファクトを読み取るように設定されている場合、このコマンドは実行中の Gateway に問い合わせるため、エージェント/ランタイムメモリと同じ active memory plugin コンテキストを参照します。

### `wiki doctor`

wiki の健全性チェックを実行し、構成または保管庫の問題を表示します。

ブリッジモードが有効で、メモリアーティファクトを読み取るように設定されている場合、このコマンドはレポートを作成する前に実行中の Gateway に問い合わせます。無効化されたブリッジインポートと、メモリアーティファクトを読み取らないブリッジ構成は、ローカル/オフラインのままです。

一般的な問題には次のものがあります。

- 公開メモリアーティファクトなしでブリッジモードが有効
- 無効または欠落した保管庫レイアウト
- Obsidian モードが想定される場合に外部 Obsidian CLI が欠落

### `wiki init`

wiki 保管庫のレイアウトとスターターページを作成します。

これにより、最上位インデックスやキャッシュディレクトリを含むルート構造が初期化されます。

### `wiki ingest <path-or-url>`

コンテンツを wiki のソースレイヤーにインポートします。

注:

- URL 取り込みは `ingest.allowUrlIngest` によって制御されます
- インポートされたソースページは frontmatter に出典情報を保持します
- 有効な場合、取り込み後に自動コンパイルを実行できます

### `wiki okf import <path>`

展開済みの Open Knowledge Format バンドルを wiki コンセプトページにインポートします。

インポーターは OKF ディレクトリツリー内の予約されていないすべての `.md` コンセプト文書を読み取り、空でない `type` フィールドを要求し、不明な OKF `type` 値を汎用コンセプトとして扱います。予約済みの OKF `index.md` と `log.md` ファイルは、コンセプトとしてインポートされません。

インポートされたページは `concepts/` の下にフラット化されるため、既存の wiki compile、search、get、digest、dashboard フローからすぐに参照できます。元の OKF コンセプト ID、`type`、`resource`、`tags`、タイムスタンプ、ソースパス、完全な frontmatter はページ frontmatter に保持されます。内部 OKF markdown リンクは生成された wiki ページに書き換えられます。壊れたリンクまたは外部リンクは変更されません。

例:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

インデックス、関連ブロック、ダッシュボード、コンパイル済みダイジェストを再構築します。

これにより、安定した機械向けアーティファクトが次の場所に書き込まれます。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` が有効な場合、compile はレポートページも更新します。

### `wiki lint`

保管庫を lint し、次をレポートします。

- 構造上の問題
- 出典情報の欠落
- 矛盾
- 未解決の質問
- 低信頼度のページ/主張
- 古いページ/主張

意味のある wiki 更新後にこれを実行します。

### `wiki search <query>`

wiki コンテンツを検索します。

動作は構成によって異なります。

- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`
- `--mode`: `auto`、`find-person`、`route-question`、`source-evidence`、または `raw-claim`

wiki 固有のランキングや出典情報の詳細が必要な場合は、`wiki search` を使用します。広範な共有リコールを 1 回実行する場合は、active memory plugin が共有検索を公開しているなら `openclaw memory search` を優先します。

検索モードは、エージェントが適切な面を選ぶのに役立ちます。

- `find-person`: エイリアス、ハンドル、ソーシャル、正規 ID、人物ページ
- `route-question`: 質問先/最適用途のヒントと関係コンテキスト
- `source-evidence`: ソースページと構造化された証拠フィールド
- `raw-claim`: 主張/証拠メタデータを含む構造化された主張テキスト

例:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

結果が構造化された主張に一致する場合、テキスト出力には `Claim:` 行と `Evidence:` 行が含まれます。JSON 出力ではさらに、エージェント側の掘り下げ用に `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` が公開されます。

### `wiki get <lookup>`

ID または相対パスで wiki ページを読み取ります。

例:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

自由形式のページ手術を行わずに、限定的な変更を適用します。

サポートされるフローには次が含まれます。

- 統合ページの作成/更新
- ページメタデータの更新
- ソース ID の添付
- 質問の追加
- 矛盾の追加
- 信頼度/ステータスの更新
- 構造化された主張の書き込み

このコマンドは、管理対象ブロックを手動編集せずに wiki を安全に進化させるために存在します。

### `wiki bridge import`

active memory plugin から公開メモリアーティファクトをインポートし、ブリッジで裏付けられたソースページに取り込みます。

最新のエクスポート済みメモリアーティファクトを wiki 保管庫に取り込みたい場合は、`bridge` モードでこれを使用します。

アクティブなブリッジアーティファクト読み取りでは、CLI は Gateway RPC を通じてインポートをルーティングするため、インポートはランタイムメモリ plugin コンテキストを使用します。ブリッジインポートが無効になっているか、アーティファクト読み取りがオフになっている場合、このコマンドはローカル/オフラインのゼロインポート動作を維持します。

### `wiki unsafe-local import`

`unsafe-local` モードで明示的に設定されたローカルパスからインポートします。

これは意図的に実験的で、同一マシン専用です。

### `wiki obsidian ...`

Obsidian に適したモードで実行されている保管庫向けの Obsidian ヘルパーコマンド。

サブコマンド:

- `status`
- `search`
- `open`
- `command`
- `daily`

`obsidian.useOfficialCli` が有効な場合、これらは `PATH` 上の公式 `obsidian` CLI を必要とします。

## 実用上の使用ガイダンス

- 出典情報とページ ID が重要な場合は、`wiki search` + `wiki get` を使用します。
- 管理対象の生成セクションを手編集する代わりに、`wiki apply` を使用します。
- 矛盾した内容や低信頼度の内容を信頼する前に、`wiki lint` を使用します。
- 一括インポートまたはソース変更後、最新のダッシュボードとコンパイル済みダイジェストをすぐに必要とする場合は、`wiki compile` を使用します。
- データカタログ、ドキュメントエクスポート、またはエージェント強化パイプラインがすでに OKF markdown バンドルを出力している場合は、`wiki okf import` を使用します。
- ブリッジモードが新しくエクスポートされたメモリアーティファクトに依存している場合は、`wiki bridge import` を使用します。

## 構成との関連

`openclaw wiki` の動作は次によって形成されます。

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完全な構成モデルについては、[Memory Wiki plugin](/ja-JP/plugins/memory-wiki) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Memory wiki](/ja-JP/plugins/memory-wiki)
