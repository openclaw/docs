---
read_when:
    - 単なる `MEMORY.md` ノートを超えた永続ナレッジが必要な場合
    - 同梱の memory-wiki Plugin を設定している場合
    - '`wiki_search`、`wiki_get`、または bridge mode を理解したい場合'
summary: 'memory-wiki: 出典情報、クレーム、ダッシュボード、bridge mode を備えたコンパイル済みナレッジ vault'
title: Memory wiki
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:10:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` は、永続メモリをコンパイル済みナレッジ vault に変換する同梱 Plugin です。

これはアクティブなメモリ Plugin を **置き換えるものではありません**。アクティブなメモリ Plugin は引き続き
recall、promotion、indexing、Dreaming を担います。`memory-wiki` はその横に並び、
永続ナレッジを、ナビゲート可能な wiki、決定論的なページ、
構造化されたクレーム、出典情報、ダッシュボード、機械可読ダイジェストへと
コンパイルします。

メモリを、Markdown ファイルの山というより、保守されたナレッジレイヤーとして
振る舞わせたい場合に使ってください。

## 追加されるもの

- 決定論的なページレイアウトを持つ専用 wiki vault
- 単なる散文ではなく、構造化されたクレームと証拠メタデータ
- ページ単位の出典情報、信頼度、矛盾、未解決質問
- エージェント / ランタイム利用者向けのコンパイル済みダイジェスト
- wiki ネイティブの search / get / apply / lint ツール
- アクティブなメモリ Plugin から public artifact を取り込む任意の bridge mode
- 任意の Obsidian 対応レンダリングモードと CLI 統合

## memory との関係

関係性は次のように考えてください:

| レイヤー                                                | 担当                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Active memory Plugin（`memory-core`, QMD, Honcho など） | recall、semantic search、promotion、Dreaming、memory runtime                             |
| `memory-wiki`                                           | コンパイル済み wiki ページ、出典情報豊富な synthesis、ダッシュボード、wiki 固有の search / get / apply |

アクティブなメモリ Plugin が共有 recall artifact を公開している場合、OpenClaw は
`memory_search corpus=all` で両レイヤーを 1 回の検索で横断できます。

wiki 固有のランキング、出典情報、またはページへの直接アクセスが必要な場合は、
代わりに wiki ネイティブツールを使ってください。

## 推奨ハイブリッドパターン

ローカル優先セットアップにおける強いデフォルトは次です:

- recall と広い semantic search 用のアクティブメモリバックエンドとして QMD
- durable な synthesis ナレッジページ用に `bridge` mode の `memory-wiki`

この分担がうまく機能するのは、各レイヤーが役割に集中できるからです:

- QMD は raw notes、セッションエクスポート、追加コレクションを検索可能なまま保持する
- `memory-wiki` は安定した entity、クレーム、ダッシュボード、ソースページをコンパイルする

実用ルール:

- memory 全体を 1 回広く recall したいときは `memory_search` を使う
- 出典情報を意識した wiki 結果が欲しいときは `wiki_search` と `wiki_get` を使う
- 共有検索を両レイヤーにまたがらせたいときは `memory_search corpus=all` を使う

bridge mode が exported artifact 0 件と報告する場合、アクティブなメモリ Plugin は
現在まだ public な bridge 入力を公開していません。まず `openclaw wiki doctor` を実行し、
その後、アクティブなメモリ Plugin が public artifact をサポートしていることを確認してください。

## Vault mode

`memory-wiki` は 3 つの vault mode をサポートします:

### `isolated`

独自の vault、独自のソース、`memory-core` への依存なし。

wiki を独自のキュレーション済みナレッジストアにしたい場合に使います。

### `bridge`

アクティブなメモリ Plugin から public plugin SDK seam を通じて
public memory artifact と memory event を読み取ります。

メモリ Plugin のエクスポート済み artifact を、private plugin internals に触れずに
wiki 側でコンパイルして整理したい場合に使います。

bridge mode がインデックス化できるもの:

- exported memory artifacts
- dream reports
- daily notes
- memory root files
- memory event logs

### `unsafe-local`

ローカル private パス向けの、明示的な同一マシン限定 escape hatch。

この mode は意図的に実験的で非ポータブルです。信頼境界を理解しており、
bridge mode では提供できないローカルファイルシステムアクセスが特に必要な場合にのみ使ってください。

## Vault レイアウト

Plugin は次のような vault を初期化します:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

管理対象コンテンツは generated block 内に保持されます。人間が書く note block は保持されます。

主なページグループ:

- `sources/` — インポートされた raw material と bridge バックエンドのページ
- `entities/` — 永続的な物、人、システム、プロジェクト、オブジェクト
- `concepts/` — アイデア、抽象化、パターン、ポリシー
- `syntheses/` — コンパイル済み要約と保守されたロールアップ
- `reports/` — 生成されたダッシュボード

## 構造化クレームと証拠

ページは自由形式テキストだけでなく、構造化された `claims` frontmatter も持てます。

各クレームに含められるもの:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

証拠エントリに含められるもの:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

これによって wiki は、受動的な note ダンプではなく、belief layer に近いものになります。
クレームは追跡、採点、異議申し立て、ソースへの解決が可能です。

## Compile パイプライン

compile ステップは wiki ページを読み、要約を正規化し、安定した
機械向け artifact を次へ出力します:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

これらのダイジェストは、エージェントやランタイムコードが Markdown
ページをスクレイプしなくて済むように存在します。

コンパイル済み出力は次にも使われます:

- search / get フロー向けの初回 wiki indexing
- claim-id から所有ページへの逆引き
- コンパクトなプロンプト補助
- レポート / ダッシュボード生成

## ダッシュボードとヘルスレポート

`render.createDashboards` が有効な場合、compile は
`reports/` 配下にダッシュボードを維持します。

組み込みレポート:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

これらのレポートが追跡するもの:

- 矛盾 note クラスタ
- 競合クレームクラスタ
- 構造化証拠を欠くクレーム
- 低信頼度のページとクレーム
- 古い、または鮮度不明
- 未解決質問を持つページ

## Search と retrieval

`memory-wiki` は 2 つの検索バックエンドをサポートします:

- `shared`: 利用可能なら共有 memory search フローを使う
- `local`: wiki をローカルで検索する

また 3 つの corpus もサポートします:

- `wiki`
- `memory`
- `all`

重要な動作:

- `wiki_search` と `wiki_get` は、可能なら first pass にコンパイル済みダイジェストを使う
- claim id は所有ページへ逆引きできる
- contested / stale / fresh なクレームはランキングに影響する
- 出典ラベルは結果まで保持されることがある

実用ルール:

- 広い recall を 1 回行うなら `memory_search corpus=all`
- wiki 固有ランキング、
  出典情報、またはページ単位の belief structure が重要なら `wiki_search` + `wiki_get`

## エージェントツール

Plugin は次のツールを登録します:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

それぞれの役割:

- `wiki_status`: 現在の vault mode、健全性、Obsidian CLI 可用性
- `wiki_search`: wiki ページと、設定されていれば共有 memory corpus を検索
- `wiki_get`: id / path で wiki ページを読み、必要なら共有 memory corpus にフォールバック
- `wiki_apply`: 自由形式のページ編集なしで synthesis / metadata を限定更新
- `wiki_lint`: 構造チェック、出典情報欠落、矛盾、未解決質問

Plugin はさらに非排他的な memory corpus supplement も登録するため、
アクティブなメモリ Plugin が corpus selection をサポートしていれば、
共有 `memory_search` と `memory_get` からも wiki に到達できます。

## プロンプトとコンテキストの動作

`context.includeCompiledDigestPrompt` が有効な場合、memory プロンプトセクションに
`agent-digest.json` 由来のコンパクトなコンパイル済みスナップショットが追加されます。

このスナップショットは意図的に小さく高シグナルです:

- 上位ページのみ
- 上位クレームのみ
- 矛盾数
- 質問数
- 信頼度 / 鮮度の修飾子

これはプロンプト形状を変えるためオプトインです。主に、memory supplement を
明示的に消費する context engine または旧来プロンプト組み立てに役立ちます。

## 設定

設定は `plugins.entries.memory-wiki.config` 配下に置きます:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

主要トグル:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` または `obsidian`
- `bridge.readMemoryArtifacts`: アクティブメモリ Plugin の public artifact をインポート
- `bridge.followMemoryEvents`: bridge mode で event log を含める
- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`, `memory`, または `all`
- `context.includeCompiledDigestPrompt`: compact digest snapshot を memory prompt sections に追加
- `render.createBacklinks`: 決定論的な関連 block を生成
- `render.createDashboards`: ダッシュボードページを生成

### 例: QMD + bridge mode

recall に QMD を使い、保守された
ナレッジレイヤーとして `memory-wiki` を使いたい場合:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

これにより:

- アクティブ memory recall は QMD が担当
- `memory-wiki` はコンパイル済みページとダッシュボードに集中
- 明示的に compiled digest prompt を有効にするまで、プロンプト形状は変わらない

## CLI

`memory-wiki` はトップレベル CLI surface も提供します:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

完全なコマンドリファレンスは [CLI: wiki](/ja-JP/cli/wiki) を参照してください。

## Obsidian サポート

`vault.renderMode` が `obsidian` の場合、Plugin は Obsidian 対応の
Markdown を書き出し、任意で公式 `obsidian` CLI も使えます。

サポートされるワークフロー:

- status probing
- vault search
- ページを開く
- Obsidian コマンドを呼び出す
- daily note へ移動する

これは任意です。wiki は Obsidian なしの native mode でも動作します。

## 推奨ワークフロー

1. recall / promotion / Dreaming にはアクティブなメモリ Plugin を維持する。
2. `memory-wiki` を有効にする。
3. 明確に bridge mode が必要でない限り、`isolated` mode から始める。
4. 出典情報が重要なときは `wiki_search` / `wiki_get` を使う。
5. 限定的な synthesis または metadata 更新には `wiki_apply` を使う。
6. 意味のある変更後は `wiki_lint` を実行する。
7. stale / contradiction の可視性が欲しければ dashboards を有効にする。

## 関連ドキュメント

- [Memory Overview](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)
- [CLI: wiki](/ja-JP/cli/wiki)
- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
