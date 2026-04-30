---
read_when:
    - memory-wiki CLI を使いたい
    - あなたは `openclaw wiki` を文書化または変更しています
summary: '`openclaw wiki` のCLIリファレンス（memory-wiki vaultの状態、検索、コンパイル、lint、適用、ブリッジ、およびObsidianヘルパー）'
title: ウィキ
x-i18n:
    generated_at: "2026-04-30T05:06:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` 保管庫を検査し、保守します。

同梱の `memory-wiki` Plugin によって提供されます。

関連:

- [Memory Wiki Plugin](/ja-JP/plugins/memory-wiki)
- [Memory の概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)

## 用途

次のようなコンパイル済みナレッジ保管庫が必要な場合は、`openclaw wiki` を使用します。

- wiki ネイティブの検索とページ読み取り
- 来歴が豊富な統合
- 矛盾と鮮度のレポート
- Active Memory Plugin からのブリッジインポート
- 任意の Obsidian CLI ヘルパー

## よく使うコマンド

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

保管庫が初期化されているか、ブリッジモードが健全か、または Obsidian 連携が利用可能か不明な場合は、最初にこれを使用します。

ブリッジモードが有効で、Memory アーティファクトを読み取るように設定されている場合、このコマンドは実行中の Gateway に問い合わせるため、エージェント/ランタイム Memory と同じ Active Memory Plugin コンテキストを参照します。

### `wiki doctor`

wiki の健全性チェックを実行し、設定または保管庫の問題を表示します。

ブリッジモードが有効で、Memory アーティファクトを読み取るように設定されている場合、このコマンドはレポートを作成する前に実行中の Gateway に問い合わせます。無効化されたブリッジインポートと、Memory アーティファクトを読み取らないブリッジ設定は、ローカル/オフラインのままです。

典型的な問題には次が含まれます。

- パブリック Memory アーティファクトなしでブリッジモードが有効
- 無効または欠落している保管庫レイアウト
- Obsidian モードが期待される場合に外部 Obsidian CLI が欠落

### `wiki init`

wiki 保管庫のレイアウトとスターターページを作成します。

これは、トップレベルのインデックスとキャッシュディレクトリを含むルート構造を初期化します。

### `wiki ingest <path-or-url>`

コンテンツを wiki のソースレイヤーにインポートします。

注:

- URL 取り込みは `ingest.allowUrlIngest` によって制御されます
- インポートされたソースページは frontmatter に来歴を保持します
- 有効な場合、取り込み後に自動コンパイルを実行できます

### `wiki compile`

インデックス、関連ブロック、ダッシュボード、コンパイル済みダイジェストを再構築します。

これは次の場所に安定した機械向けアーティファクトを書き込みます。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` が有効な場合、コンパイルはレポートページも更新します。

### `wiki lint`

保管庫を lint し、次を報告します。

- 構造上の問題
- 来歴の欠落
- 矛盾
- 未解決の質問
- 信頼度の低いページ/主張
- 古くなったページ/主張

意味のある wiki 更新後にこれを実行します。

### `wiki search <query>`

wiki コンテンツを検索します。

動作は設定によって異なります。

- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`
- `--mode`: `auto`、`find-person`、`route-question`、`source-evidence`、または `raw-claim`

wiki 固有のランキングまたは来歴の詳細が必要な場合は、`wiki search` を使用します。幅広い共有想起を 1 回実行する場合は、Active Memory Plugin が共有検索を公開しているなら `openclaw memory search` を優先します。

検索モードは、エージェントが適切なサーフェスを選ぶのに役立ちます。

- `find-person`: 別名、ハンドル、ソーシャル、正規 ID、人のページ
- `route-question`: 質問先/最適な用途のヒントと関係性コンテキスト
- `source-evidence`: ソースページと構造化された証拠フィールド
- `raw-claim`: 主張/証拠メタデータを含む構造化された主張テキスト

例:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

結果が構造化された主張と一致する場合、テキスト出力には `Claim:` 行と `Evidence:` 行が含まれます。JSON 出力ではさらに、エージェント側の掘り下げ用に `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` が公開されます。

### `wiki get <lookup>`

ID または相対パスで wiki ページを読み取ります。

例:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

自由形式のページ手術なしで、狭い範囲の変更を適用します。

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

Active Memory Plugin からパブリック Memory アーティファクトをブリッジバックのソースページにインポートします。

最新のエクスポート済み Memory アーティファクトを wiki 保管庫に取り込みたい場合は、`bridge` モードでこれを使用します。

アクティブなブリッジアーティファクト読み取りでは、CLI は Gateway RPC 経由でインポートをルーティングするため、インポートはランタイム Memory Plugin コンテキストを使用します。ブリッジインポートが無効な場合、またはアーティファクト読み取りがオフになっている場合、コマンドはローカル/オフラインのゼロインポート動作を維持します。

### `wiki unsafe-local import`

`unsafe-local` モードで、明示的に設定されたローカルパスからインポートします。

これは意図的に実験的で、同一マシン専用です。

### `wiki obsidian ...`

Obsidian フレンドリーモードで実行されている保管庫向けの Obsidian ヘルパーコマンドです。

サブコマンド:

- `status`
- `search`
- `open`
- `command`
- `daily`

`obsidian.useOfficialCli` が有効な場合、これらには `PATH` 上の公式 `obsidian` CLI が必要です。

## 実践的な使用ガイダンス

- 来歴とページ ID が重要な場合は、`wiki search` + `wiki get` を使用します。
- 管理対象の生成セクションを手作業で編集する代わりに、`wiki apply` を使用します。
- 矛盾するコンテンツや信頼度の低いコンテンツを信頼する前に、`wiki lint` を使用します。
- 一括インポートまたはソース変更後、ダッシュボードとコンパイル済みダイジェストをすぐに最新化したい場合は、`wiki compile` を使用します。
- ブリッジモードが新しくエクスポートされた Memory アーティファクトに依存している場合は、`wiki bridge import` を使用します。

## 設定との関連

`openclaw wiki` の動作は次によって形作られます。

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完全な設定モデルについては、[Memory Wiki Plugin](/ja-JP/plugins/memory-wiki) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Memory wiki](/ja-JP/plugins/memory-wiki)
