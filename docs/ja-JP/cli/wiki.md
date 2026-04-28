---
read_when:
    - memory-wiki CLI を使いたい場合
    - '`openclaw wiki` を文書化または変更している場合'
summary: '`openclaw wiki` の CLI リファレンス（memory-wiki vault の status、search、compile、lint、apply、bridge、および Obsidian ヘルパー）'
title: Wiki
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T04:52:26Z"
  model: gpt-5.4
  provider: openai
  source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
  source_path: cli/wiki.md
  workflow: 15
---

# `openclaw wiki`

`memory-wiki` vault を確認および保守します。

同梱の `memory-wiki` Plugin によって提供されます。

関連:

- [Memory Wiki Plugin](/ja-JP/plugins/memory-wiki)
- [メモリ概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)

## 用途

`openclaw wiki` は、次の機能を持つコンパイル済みナレッジ vault が必要な場合に使います:

- wiki ネイティブ検索とページ読み取り
- 出典情報が豊富な統合結果
- 矛盾および鮮度レポート
- アクティブなメモリ Plugin からの bridge インポート
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

現在の vault モード、健全性、および Obsidian CLI の可用性を確認します。

vault が初期化されているか、bridge モードが健全か、または Obsidian 統合が
利用可能か不明な場合は、最初にこれを使ってください。

### `wiki doctor`

wiki のヘルスチェックを実行し、設定または vault の問題を表示します。

典型的な問題には次が含まれます:

- public memory artifact がないのに bridge モードが有効
- 無効または欠落した vault レイアウト
- Obsidian モードが想定されているのに外部 Obsidian CLI が存在しない

### `wiki init`

wiki vault レイアウトとスターターページを作成します。

これにより、トップレベルインデックスやキャッシュディレクトリを含む
ルート構造が初期化されます。

### `wiki ingest <path-or-url>`

内容を wiki ソースレイヤーにインポートします。

注記:

- URL ingest は `ingest.allowUrlIngest` で制御されます
- インポートされたソースページは frontmatter に出典情報を保持します
- 有効な場合、ingest 後に自動 compile を実行できます

### `wiki compile`

インデックス、関連ブロック、ダッシュボード、およびコンパイル済みダイジェストを再構築します。

これにより、安定した機械向け artifact が次に書き込まれます:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` が有効な場合、compile はレポートページも更新します。

### `wiki lint`

vault を lint し、次を報告します:

- 構造上の問題
- 出典情報の欠落
- 矛盾
- 未解決の質問
- 低信頼度のページ/クレーム
- 古いページ/クレーム

意味のある wiki 更新の後にこれを実行してください。

### `wiki search <query>`

wiki コンテンツを検索します。

動作は設定に依存します:

- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`

wiki 固有のランキングや出典情報詳細が必要な場合は `wiki search` を使ってください。
アクティブなメモリ Plugin が共有検索を公開している場合、広い共有リコールを 1 回だけ行うなら
`openclaw memory search` を優先してください。

### `wiki get <lookup>`

ID または相対パスで wiki ページを読み取ります。

例:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

自由形式のページ編集をせずに、限定的な変更を適用します。

サポートされるフローには次が含まれます:

- synthesis ページの作成/更新
- ページメタデータの更新
- source ID の付与
- 質問の追加
- 矛盾の追加
- 信頼度/ステータスの更新
- 構造化クレームの書き込み

このコマンドは、管理対象ブロックを手動編集せずに wiki を安全に進化させるために存在します。

### `wiki bridge import`

アクティブなメモリ Plugin から public memory artifact を、bridge バックエンドの
ソースページへインポートします。

最新のエクスポート済みメモリ artifact を wiki vault に取り込みたい
`bridge` モードで使ってください。

### `wiki unsafe-local import`

`unsafe-local` モードで、明示的に設定されたローカルパスからインポートします。

これは意図的に実験的で、同一マシン専用です。

### `wiki obsidian ...`

Obsidian 対応モードで動作する vault 向けの Obsidian ヘルパーコマンドです。

サブコマンド:

- `status`
- `search`
- `open`
- `command`
- `daily`

`obsidian.useOfficialCli` が有効な場合、これらには `PATH` 上の公式 `obsidian` CLI が必要です。

## 実用的な使い方のガイダンス

- 出典情報とページ ID が重要な場合は `wiki search` + `wiki get` を使ってください。
- 管理対象の生成セクションは手編集せず、`wiki apply` を使ってください。
- 矛盾した内容や低信頼度の内容を信頼する前に `wiki lint` を使ってください。
- 一括インポートやソース変更の後、ダッシュボードとコンパイル済みダイジェストをすぐ更新したい場合は
  `wiki compile` を使ってください。
- bridge モードが新たにエクスポートされたメモリ artifact に依存している場合は
  `wiki bridge import` を使ってください。

## 関連する設定

`openclaw wiki` の動作は次の設定によって決まります:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完全な設定モデルについては [Memory Wiki Plugin](/ja-JP/plugins/memory-wiki) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Memory wiki](/ja-JP/plugins/memory-wiki)
