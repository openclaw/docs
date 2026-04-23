---
read_when:
    - memory-wiki CLIを使いたい場合
    - '`openclaw wiki` をドキュメント化または変更しています'
summary: '`openclaw wiki` のCLIリファレンス（memory-wiki vaultのstatus、search、compile、lint、apply、bridge、およびObsidianヘルパー）'
title: wiki
x-i18n:
    generated_at: "2026-04-23T14:03:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

`memory-wiki` vaultを確認および保守します。

バンドルされた `memory-wiki` Pluginによって提供されます。

関連:

- [Memory Wiki plugin](/ja-JP/plugins/memory-wiki)
- [Memory Overview](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)

## 用途

コンパイル済みのナレッジvaultが必要な場合は `openclaw wiki` を使用します。これには次が含まれます。

- wikiネイティブの検索とページ読み取り
- 出典情報が豊富な要約
- 矛盾および鮮度レポート
- アクティブなmemory Pluginからのbridge import
- 任意のObsidian CLIヘルパー

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

現在のvault mode、正常性、Obsidian CLIの利用可否を確認します。

vaultが初期化されているか、bridge modeが正常か、
またはObsidian連携が利用可能かが不明な場合は、まずこれを使ってください。

### `wiki doctor`

wikiの正常性チェックを実行し、設定またはvaultの問題を表示します。

典型的な問題には次のものがあります。

- パブリックなmemory artifactがないのにbridge modeが有効になっている
- 無効または欠落したvaultレイアウト
- Obsidian modeが期待されているのに外部Obsidian CLIが見つからない

### `wiki init`

wiki vaultのレイアウトと初期ページを作成します。

これにより、トップレベルのインデックスやcache
ディレクトリを含むルート構造が初期化されます。

### `wiki ingest <path-or-url>`

コンテンツをwikiのsourceレイヤーに取り込みます。

注記:

- URL取り込みは `ingest.allowUrlIngest` で制御されます
- 取り込まれたsourceページはfrontmatterに出典情報を保持します
- 有効になっている場合、取り込み後に自動compileを実行できます

### `wiki compile`

インデックス、関連ブロック、ダッシュボード、コンパイル済みdigestを再構築します。

これにより、次の場所に安定したマシン向けartifactが書き込まれます。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` が有効な場合、compileはレポートページも更新します。

### `wiki lint`

vaultをlintし、次を報告します。

- 構造上の問題
- 出典情報の欠落
- 矛盾
- 未解決の質問
- 低信頼度のページ/claim
- 古くなったページ/claim

意味のあるwiki更新の後にこれを実行してください。

### `wiki search <query>`

wikiコンテンツを検索します。

動作はconfigに依存します。

- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`

wiki固有のランキングや出典詳細が必要な場合は `wiki search` を使ってください。
広く共有された再想起を1回行いたいだけなら、アクティブなmemory Pluginが共有検索を公開している場合は
`openclaw memory search` を優先してください。

### `wiki get <lookup>`

idまたは相対パスでwikiページを読み取ります。

例:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

自由形式のページ編集を行わずに、対象を絞った変更を適用します。

サポートされるフローには次が含まれます。

- synthesisページの作成/更新
- ページmetadataの更新
- source idの付与
- 質問の追加
- 矛盾の追加
- confidence/statusの更新
- 構造化claimの書き込み

このコマンドは、管理対象ブロックを手動編集せずに
wikiを安全に進化させられるように存在します。

### `wiki bridge import`

アクティブなmemory Pluginからパブリックなmemory artifactを、bridgeバックの
sourceページに取り込みます。

最新のエクスポート済みmemory artifactを
wiki vaultに取り込みたい `bridge` mode でこれを使用してください。

### `wiki unsafe-local import`

`unsafe-local` modeで、明示的に設定されたローカルパスから取り込みます。

これは意図的に実験的で、同一マシン専用です。

### `wiki obsidian ...`

Obsidian対応modeで動作するvault向けのObsidianヘルパーコマンドです。

サブコマンド:

- `status`
- `search`
- `open`
- `command`
- `daily`

これらは、`obsidian.useOfficialCli` が有効なとき、
`PATH` 上に公式の `obsidian` CLIが必要です。

## 実用的な利用ガイダンス

- 出典情報とページIDが重要な場合は `wiki search` + `wiki get` を使用します。
- 管理対象の生成セクションは手編集せず、`wiki apply` を使用します。
- 矛盾している、または低信頼度のコンテンツを信頼する前に `wiki lint` を使用します。
- 一括importやsource変更の後、最新の
  ダッシュボードとコンパイル済みdigestをすぐに反映したい場合は `wiki compile` を使用します。
- bridge modeが新しくエクスポートされたmemory
  artifactに依存している場合は `wiki bridge import` を使用します。

## 関連する設定

`openclaw wiki` の動作は次の設定で決まります。

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完全なconfigモデルについては [Memory Wiki plugin](/ja-JP/plugins/memory-wiki) を参照してください。
