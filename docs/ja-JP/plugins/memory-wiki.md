---
read_when:
    - 単なる MEMORY.md メモを超えた永続的な知識が必要
    - バンドルされた memory-wiki Plugin を設定しています
    - wiki_search、wiki_get、またはブリッジモードについて理解したい
summary: 'memory-wiki: 出典、主張、ダッシュボード、ブリッジモードを備えたコンパイル済みナレッジボルト'
title: メモリ Wiki
x-i18n:
    generated_at: "2026-07-05T11:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e6233922483e0e858cb39cdeb2537e5f454e5b6df0c49ea5b89dc56da3e0bfe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` は、永続的な知識をナビゲート可能な wiki にコンパイルするバンドル済みプラグインです。決定的なページ、エビデンス付きの構造化クレーム、来歴、ダッシュボード、機械可読ダイジェストを生成します。

これはアクティブメモリプラグインを置き換えるものではありません。リコール、昇格、インデックス作成、dreaming は、設定されているメモリバックエンド（`memory-core`、QMD、Honcho など）が引き続き所有します。`memory-wiki` はその横に配置され、知識を保守された wiki レイヤーにコンパイルします。

| レイヤー             | 所有するもの                                                                      |
| -------------------- | --------------------------------------------------------------------------------- |
| Active memory plugin | リコール、セマンティック検索、昇格、dreaming、メモリランタイム                   |
| `memory-wiki`        | コンパイル済み wiki ページ、来歴豊富な統合、ダッシュボード、wiki search/get/apply |

実用上のルール:

- 設定済みのコーパス全体に対する幅広いリコールを 1 回行うには `memory_search`
- wiki 固有のランキング、来歴、またはページ単位の信念構造が必要な場合は `wiki_search` / `wiki_get`
- アクティブメモリプラグインがコーパス選択をサポートしている場合、1 回の呼び出しで両方のレイヤーをまたぐには `memory_search corpus=all`

一般的なローカルファースト構成: リコール用のアクティブメモリバックエンドとして QMD を使い、永続的に統合されたページ用に `memory-wiki` を `bridge` モードで使います。[Configuration](#configuration) の QMD + bridge モードの例を参照してください。

bridge モードでエクスポートされたアーティファクトが 0 件と報告される場合、アクティブメモリプラグインは現在パブリック bridge 入力を公開していません。まず `openclaw wiki doctor` を実行し、その後アクティブメモリプラグインがパブリックアーティファクトをサポートしていることを確認してください。

## Vault モード

- `isolated`（デフォルト）: 独自の vault、独自のソースを持ち、アクティブメモリプラグインに依存しません。自己完結したキュレーション済み知識ストアに使用します。
- `bridge`: パブリック Plugin SDK の継ぎ目を通じて、アクティブメモリプラグインからパブリックメモリアーティファクトとイベントログを読み取ります。プライベートなプラグイン内部に踏み込まず、メモリプラグインがエクスポートしたアーティファクトをコンパイルするために使用します。
- `unsafe-local`: ローカルのプライベートパス向けに、明示的な同一マシンの脱出口を提供します。意図的に実験的で移植性はありません。信頼境界を理解しており、bridge モードでは提供できないローカルファイルシステムアクセスが特に必要な場合にのみ使用してください。

bridge モードは、`bridge.*` 設定トグルごとに次をインデックスできます。

- エクスポートされたメモリアーティファクト（`indexMemoryRoot`）
- デイリーノート（`indexDailyNotes`）
- dream レポート（`indexDreamReports`）
- メモリイベントログ（`followMemoryEvents`）

bridge モードが有効で `bridge.readMemoryArtifacts` が有効な場合、`openclaw wiki status`、`openclaw wiki doctor`、`openclaw wiki bridge
import` は実行中の Gateway 経由でルーティングされるため、エージェント/ランタイムメモリと同じアクティブメモリプラグインコンテキストを参照します。bridge が無効、またはアーティファクト読み取りがオフの場合、これらのコマンドはローカル/オフラインの動作を維持します。

## Vault レイアウト

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

管理対象コンテンツは生成ブロック内に留まり、人間が書いたノートブロックは再生成をまたいで保持されます。

- `sources/`: インポートされた生素材と bridge/unsafe-local に裏付けられたページ
- `entities/`: 永続的なもの、人、システム、プロジェクト、オブジェクト
- `concepts/`: アイデア、抽象、パターン、ポリシー（OKF インポートの配置先でもあります）
- `syntheses/`: コンパイル済みサマリーと保守されるロールアップ
- `reports/`: 生成されたダッシュボード

## Open Knowledge Format インポート

```bash
openclaw wiki okf import ./bundles/ga4
```

展開済みの Open Knowledge Format バンドルを wiki のコンセプトページにインポートします。データカタログ、ドキュメントクローラー、またはエンリッチメントエージェントがすでに OKF を生成している場合に適しています。OKF を移植可能な交換アーティファクトとして維持し、`memory-wiki` に OpenClaw ネイティブなコンセプトページとコンパイル済みダイジェストへ変換させます。

- 予約されていない `.md` ファイルはコンセプトドキュメントです
- インポートされる各コンセプトには、空でない `type` frontmatter フィールドが必要です。`type` がない場合は `missing-type` 警告が生成され、そのファイルはスキップされます
- 未知の `type` 値は汎用コンセプトとして受け入れられます
- `index.md` と `log.md` は予約済みであり、コンセプトとしてインポートされることはありません
- 壊れた Markdown リンクまたは外部 Markdown リンクは変更されません

インポートされたページは `concepts/` の下にフラット化されるため、既存の compile、search、get、dashboard フローは 2 つ目の wiki ツリーなしでそれらを参照できます。各ページは元の OKF コンセプト ID、ソースパス、`type`、`resource`、`tags`、タイムスタンプ、完全なプロデューサー frontmatter を保持します。内部 OKF リンクは生成された wiki コンセプトページに書き換えられ、さらに `kind: okf-link` を持つ構造化された `relationships` エントリも出力します。

## 構造化クレームとエビデンス

ページは自由形式のテキストだけでなく、構造化された `claims` frontmatter を持ちます。各クレームには `id`、`text`、`status`、`confidence`、`evidence[]`、`updatedAt` を含められます。各エビデンスエントリには `kind`、`sourceId`、`path`、`lines`、`weight`、`confidence`、`privacyTier`、`note`、`updatedAt` を含められます。

これにより wiki は、受動的なノート置き場ではなく信念レイヤーとして動作します。クレームは追跡、スコアリング、異議申し立て、ソースへの解決が可能です。

## エージェント向けエンティティメタデータ

エンティティページは、人、チーム、システム、プロジェクト、またはその他の任意のエンティティタイプに使用できる汎用ルーティングメタデータを持ちます。

- `entityType`: 例: `person`、`team`、`system`、`project`
- `canonicalId`: エイリアスやインポートをまたぐ安定した ID キー
- `aliases`: 同じページに解決される名前、ハンドル、またはラベル
- `privacyTier`: 自由形式の文字列。`public` はレビュー不要として扱われ、それ以外の値（例: `local-private`、`sensitive`、`confirm-before-use`）は `reports/privacy-review.md` でフラグ付けされます
- `bestUsedFor` / `notEnoughFor`: コンパクトなルーティングヒント
- `lastRefreshedAt`: ページ編集時刻とは別のソース更新タイムスタンプ
- `personCard`: 任意の人物固有ルーティングカード（ハンドル、ソーシャル、メール、タイムゾーン、レーン、依頼対象、依頼を避ける対象、信頼度、プライバシー階層）
- `relationships`: 関連ページへの型付きエッジ（ターゲット、種類、重み、信頼度、エビデンス種別、プライバシー階層、ノート）

人物 wiki では、まず `reports/person-agent-directory.md` から始め、その後連絡先詳細や推定された事実を使う前に `wiki_get` で人物ページを開いてください。

<Accordion title="エンティティページの例">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## コンパイルパイプライン

compile は wiki ページを読み取り、サマリーを正規化し、安定した機械向けアーティファクトを次の場所に出力します。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

エージェントとランタイムコードは、Markdown をスクレイピングする代わりにこれらのダイジェストを読み取ります。コンパイル済み出力は、search/get 用の初回 wiki インデックス作成、クレーム ID から所有ページへの逆引き、コンパクトなプロンプト補足、レポート生成にも使われます。

## ダッシュボードとヘルスレポート

`render.createDashboards` が有効な場合、compile は `reports/` の下でダッシュボードを保守します。

| レポート                            | 追跡対象                                           |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 未解決の質問があるページ                           |
| `reports/contradictions.md`         | 矛盾ノートのクラスター                             |
| `reports/low-confidence.md`         | 信頼度の低いページとクレーム                       |
| `reports/claim-health.md`           | 構造化エビデンスが欠けているクレーム               |
| `reports/stale-pages.md`            | 古い、または鮮度が不明なページ                     |
| `reports/person-agent-directory.md` | 人物/エンティティのルーティングカード              |
| `reports/relationship-graph.md`     | 構造化された関係エッジ                             |
| `reports/provenance-coverage.md`    | エビデンスクラスのカバレッジ                       |
| `reports/privacy-review.md`         | 使用前にレビューが必要な非パブリックなプライバシー階層 |

## 検索と取得

2 つの検索バックエンド:

- `shared`: 利用可能な場合は共有メモリ検索フローを使用
- `local`: wiki をローカルで検索

3 つのコーパス: `wiki`、`memory`、`all`。

- `wiki_search` / `wiki_get` は、可能な場合はコンパイル済みダイジェストを初回パスとして使用します
- クレーム ID は所有ページへ逆引きされます
- 異議あり/古い/新鮮なクレームはランキングに影響します
- 来歴ラベルは結果に引き継がれます

検索モード（`--mode` / ツールの `mode` パラメーター）:

| モード            | ブースト対象                                                   |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | バランスの取れたデフォルト                                     |
| `find-person`     | 人物らしいエンティティ、エイリアス、ハンドル、ソーシャル、canonical ID |
| `route-question`  | エージェントカード、ask-for/best-used-for ヒント、関係コンテキスト |
| `source-evidence` | ソースページと構造化エビデンスメタデータ                       |
| `raw-claim`       | 一致する構造化クレーム。クレーム/エビデンスメタデータを返します |

結果が構造化クレームに一致する場合、`wiki_search` は詳細ペイロードで `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` を返します。利用可能な場合、テキスト出力にはコンパクトな `Claim:` 行と `Evidence:` 行が含まれます。

## エージェントツール

| ツール        | 目的                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 現在の vault モード、ヘルス、Obsidian CLI の可用性                                                                                                            |
| `wiki_search` | wiki ページと、設定されている場合は共有メモリコーパスを検索します。人物検索、質問ルーティング、ソースエビデンス、または raw claim ドリルダウン用に `mode` を受け取ります |
| `wiki_get`    | id/path で wiki ページを読み取ります。共有検索が有効で検索が失敗した場合は、共有メモリコーパスにフォールバックします                                         |
| `wiki_apply`  | 自由形式のページ手術を行わず、狭い範囲の統合/メタデータ変更を行います                                                                                         |
| `wiki_lint`   | 構造チェック、来歴の不足、矛盾、未解決の質問                                                                                                                  |

このプラグインは非排他的なメモリコーパス補足も登録するため、アクティブメモリプラグインがコーパス選択をサポートしている場合、共有 `memory_search` と `memory_get` は wiki に到達できます。

## プロンプトとコンテキストの動作

`context.includeCompiledDigestPrompt` が有効な場合、メモリプロンプトセクションは
`agent-digest.json` からコンパクトなコンパイル済みスナップショットを追加します。上位ページのみ、
上位クレームのみ、矛盾数、質問数、信頼度/鮮度の
修飾子です。これはプロンプト形状を変えるためオプトインです。主に、メモリ
補足を明示的に消費するコンテキストエンジンやプロンプト組み立てで重要になります。

## 設定

設定は `plugins.entries.memory-wiki.config` の下に置きます。

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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

主なトグル:

| キー                                       | 値 / デフォルト                               | 注記                                                     |
| ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------- |
| `vaultMode`                                | `isolated` (デフォルト), `bridge`, `unsafe-local` |                                                          |
| `vault.path`                               | デフォルト `~/.openclaw/wiki/main`                |                                                          |
| `vault.renderMode`                         | `native` (デフォルト), `obsidian`                 |                                                          |
| `bridge.readMemoryArtifacts`               | デフォルト `true`                                 | アクティブメモリPluginの公開アーティファクトをインポート |
| `bridge.followMemoryEvents`                | デフォルト `true`                                 | ブリッジモードでイベントログを含める                    |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | デフォルト `false`                                | `unsafe-local` インポートの実行に必要                   |
| `unsafeLocal.paths`                        | デフォルト `[]`                                   | `unsafe-local` モードでインポートする明示的なローカルパス |
| `search.backend`                           | `shared` (デフォルト), `local`                    |                                                          |
| `search.corpus`                            | `wiki` (デフォルト), `memory`, `all`              |                                                          |
| `context.includeCompiledDigestPrompt`      | デフォルト `false`                                | コンパクトなダイジェストスナップショットをメモリプロンプトセクションに追加 |
| `render.createBacklinks`                   | デフォルト `true`                                 | 決定論的な関連ブロックを生成                            |
| `render.createDashboards`                  | デフォルト `true`                                 | ダッシュボードページを生成                              |

### 例: QMD + ブリッジモード

リコールには QMD を使い、管理されたナレッジレイヤーには `memory-wiki` を使いたい場合に使用します。
各レイヤーは焦点を保ちます。QMD は生のメモ、セッション
エクスポート、追加コレクションを検索可能にし、`memory-wiki` は
安定したエンティティ、クレーム、ダッシュボード、ソースページをコンパイルします。

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

これにより、QMD は Active Memory リコールを担い、`memory-wiki` は
コンパイル済みページとダッシュボードに集中し、コンパイル済みダイジェストプロンプトを
意図的に有効にするまでプロンプト形状は変わりません。

## CLI

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

完全なコマンドリファレンスについては [CLI: wiki](/ja-JP/cli/wiki) を参照してください。
`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import` / `wiki chatgpt rollback`、および完全な `wiki obsidian`
サブコマンドセットが含まれます。

## Obsidian サポート

`vault.renderMode` が `obsidian` の場合、Plugin は Obsidian に適した
Markdown を書き出し、必要に応じて公式の `obsidian` CLI を使用してステータス
調査、保管庫検索、ページを開く操作、コマンド呼び出し、日次ノートへのジャンプを
実行できます。これは任意です。wiki は Obsidian なしでもネイティブモードで動作します。

## 推奨ワークフロー

<Steps>
<Step title="リコールにはアクティブメモリPluginを使い続ける">
リコール、昇格、Dreaming は設定済みのメモリバックエンドが引き続き所有します。
</Step>
<Step title="memory-wiki を有効にする">
ブリッジモードを明示的に使いたい場合を除き、`isolated` モードから始めます。
</Step>
<Step title="来歴が重要な場合は wiki_search / wiki_get を使う">
wiki 固有のランキングやページレベルの信念構造が必要な場合は、`memory_search` よりもこれらを優先します。
</Step>
<Step title="狭い合成やメタデータ更新には wiki_apply を使う">
管理された生成ブロックを手作業で編集するのは避けます。
</Step>
<Step title="意味のある変更後に wiki_lint を実行する">
矛盾、未解決の質問、来歴の欠落を検出します。
</Step>
<Step title="古さ/矛盾を可視化するためにダッシュボードを有効にする">
`render.createDashboards: true` (デフォルト) を設定します。
</Step>
</Steps>

## 関連ドキュメント

- [メモリ概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)
- [CLI: wiki](/ja-JP/cli/wiki)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
