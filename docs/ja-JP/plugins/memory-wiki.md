---
read_when:
    - プレーンな MEMORY.md メモを超える永続的な知識が必要な場合
    - バンドルされた memory-wiki Plugin を設定しています
    - wiki_search、wiki_get、またはブリッジモードを理解したい
summary: 'memory-wiki: 出典、主張、ダッシュボード、ブリッジモードを備えたコンパイル済みナレッジボールト'
title: メモリ wiki
x-i18n:
    generated_at: "2026-06-27T12:18:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` は、永続メモリをコンパイル済みの知識ボールトに変えるバンドルPluginです。

これは Active Memory Plugin を置き換えるものでは**ありません**。Active Memory Plugin は引き続き、リコール、昇格、インデックス作成、Dreaming を担います。`memory-wiki` はその隣に置かれ、永続的な知識を、決定的なページ、構造化された主張、来歴、ダッシュボード、機械可読ダイジェストを備えたナビゲーション可能な wiki にコンパイルします。

メモリを Markdown ファイルの山ではなく、保守された知識レイヤーのように振る舞わせたい場合に使います。

## 追加されるもの

- 決定的なページレイアウトを持つ専用 wiki ボールト
- 単なる文章ではなく、構造化された主張と証拠メタデータ
- ページ単位の来歴、信頼度、矛盾、未解決の質問
- エージェント/ランタイム利用者向けのコンパイル済みダイジェスト
- wiki ネイティブの検索/get/apply/lint ツール
- Open Knowledge Format からコンパイル済み wiki 概念へのインポート
- Active Memory Plugin から公開アーティファクトをインポートする任意のブリッジモード
- 任意の Obsidian 対応レンダリングモードと CLI 統合

## メモリとの関係

分割は次のように考えてください。

| レイヤー                                                | 担当                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin (`memory-core`, QMD, Honcho など) | リコール、セマンティック検索、昇格、Dreaming、メモリランタイム                            |
| `memory-wiki`                                           | コンパイル済み wiki ページ、来歴の豊富な統合、ダッシュボード、wiki 固有の検索/get/apply |

Active Memory Plugin が共有リコールアーティファクトを公開している場合、OpenClaw は `memory_search corpus=all` を使って両方のレイヤーを 1 回で検索できます。

wiki 固有のランキング、来歴、またはページへの直接アクセスが必要な場合は、代わりに wiki ネイティブのツールを使います。

## 推奨ハイブリッドパターン

ローカルファースト構成の強力なデフォルトは次のとおりです。

- リコールと広範なセマンティック検索の Active Memory バックエンドとして QMD
- 永続的に統合された知識ページ用に `bridge` モードの `memory-wiki`

この分割は、各レイヤーが役割に集中できるためうまく機能します。

- QMD は生のメモ、セッションエクスポート、追加コレクションを検索可能に保つ
- `memory-wiki` は安定したエンティティ、主張、ダッシュボード、ソースページをコンパイルする

実用的なルール:

- メモリ全体に対して 1 回の広範なリコールを行いたい場合は `memory_search` を使う
- 来歴を考慮した wiki 結果が必要な場合は `wiki_search` と `wiki_get` を使う
- 共有検索で両方のレイヤーをまたぎたい場合は `memory_search corpus=all` を使う

ブリッジモードがエクスポート済みアーティファクト 0 件を報告する場合、Active Memory Plugin はまだ公開ブリッジ入力を公開していません。まず `openclaw wiki doctor` を実行し、その後 Active Memory Plugin が公開アーティファクトをサポートしていることを確認してください。

ブリッジモードが有効で `bridge.readMemoryArtifacts` が有効な場合、`openclaw wiki status`、`openclaw wiki doctor`、`openclaw wiki bridge
import` は実行中の Gateway 経由で読み取ります。これにより、CLI のブリッジチェックはランタイムのメモリPluginコンテキストと整合します。ブリッジが無効、またはアーティファクト読み取りがオフの場合、これらのコマンドはローカル/オフライン動作を維持します。

## ボールトモード

`memory-wiki` は 3 つのボールトモードをサポートします。

### `isolated`

独自のボールト、独自のソースを持ち、`memory-core` に依存しません。

wiki を独自にキュレーションされた知識ストアにしたい場合に使います。

### `bridge`

公開Plugin SDK 境界を通じて、Active Memory Plugin から公開メモリアーティファクトとメモリイベントを読み取ります。

Plugin の非公開内部に入り込まず、メモリPluginのエクスポート済みアーティファクトを wiki でコンパイルおよび整理したい場合に使います。

ブリッジモードは次をインデックスできます。

- エクスポート済みメモリアーティファクト
- Dream レポート
- 日次ノート
- メモリルートファイル
- メモリイベントログ

### `unsafe-local`

ローカルの非公開パス向けの、明示的な同一マシン脱出口です。

このモードは意図的に実験的で、移植性がありません。信頼境界を理解しており、ブリッジモードでは提供できないローカルファイルシステムアクセスが明確に必要な場合にのみ使ってください。

## ボールトレイアウト

Plugin は次のようにボールトを初期化します。

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

管理対象コンテンツは生成ブロック内に留まります。人間用のノートブロックは保持されます。

主なページグループは次のとおりです。

- `sources/`: インポートされた生素材とブリッジ由来ページ
- `entities/`: 永続的な物事、人、システム、プロジェクト、オブジェクト
- `concepts/`: アイデア、抽象化、パターン、ポリシー
- `syntheses/`: コンパイル済み要約と保守された集約
- `reports/`: 生成されたダッシュボード

## Open Knowledge Format インポート

`memory-wiki` は展開済みの Open Knowledge Format バンドルを次でインポートできます。

```bash
openclaw wiki okf import ./bundles/ga4
```

これは、データカタログ、ドキュメントクローラー、またはエンリッチメントエージェントがすでに OKF を生成している場合に最もきれいに適合します。OKF を移植可能な交換アーティファクトとして維持し、その後 `memory-wiki` に OpenClaw ネイティブの概念ページとコンパイル済みダイジェストへ変換させます。

インポーターは OKF v0.1 の形に従います。

- 予約されていない `.md` ファイルは概念ドキュメント
- 各インポート済み概念には、空でない `type` frontmatter フィールドが必要
- 未知の OKF `type` 値は受け入れられる
- 予約済みの `index.md` と `log.md` ファイルは概念としてインポートされない
- 壊れた、または外部の Markdown リンクは保持される

インポートされた概念ページは `concepts/` の下にフラット化されるため、既存のコンパイル、検索、get、ダッシュボード、プロンプトダイジェストのパスは、2 つ目の wiki ツリーを追加せずにそれらを扱えます。各ページは元の OKF 概念 ID、ソースパス、`type`、`resource`、`tags`、タイムスタンプ、完全な生成元 frontmatter を保持します。内部 OKF リンクは生成された wiki 概念ページに書き換えられ、`kind: okf-link` を持つ構造化された `relationships` エントリとしても出力されます。

## 構造化された主張と証拠

ページは自由形式のテキストだけでなく、構造化された `claims` frontmatter を持てます。

各主張には次を含められます。

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

証拠エントリには次を含められます。

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

これにより、wiki は受動的なノート置き場ではなく、信念レイヤーのように振る舞います。主張は追跡、スコアリング、異議申し立て、ソースへの解決が可能です。

## エージェント向けエンティティメタデータ

エンティティページは、エージェント利用向けのルーティングメタデータも持てます。これは汎用 frontmatter なので、人、チーム、システム、プロジェクト、その他任意のエンティティ種別で機能します。

一般的なフィールドは次のとおりです。

- `entityType`: 例: `person`、`team`、`system`、または `project`
- `canonicalId`: エイリアスやインポートをまたいで使われる安定した識別キー
- `aliases`: 同じページに解決されるべき名前、ハンドル、ラベル
- `privacyTier`: `public`、`local-private`、`sensitive`、または `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: コンパクトなルーティングヒント
- `lastRefreshedAt`: ページ編集時刻とは別のソース更新タイムスタンプ
- `personCard`: ハンドル、ソーシャル、メール、タイムゾーン、レーン、依頼対象、依頼を避ける対象、信頼度、プライバシーを含む、任意の人物固有ルーティングカード
- `relationships`: ターゲット、種類、重み、信頼度、証拠種別、プライバシー階層、ノートを持つ関連ページへの型付きエッジ

人物 wiki では、エージェントは通常 `reports/person-agent-directory.md` から開始し、連絡先詳細や推論された事実を使う前に `wiki_get` で人物ページを開くべきです。

例:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## コンパイルパイプライン

コンパイルステップは wiki ページを読み取り、要約を正規化し、安定した機械向けアーティファクトを次の下に出力します。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

これらのダイジェストが存在するため、エージェントやランタイムコードは Markdown ページをスクレイピングする必要がありません。

コンパイル済み出力は次も支えます。

- 検索/get フロー向けの初回 wiki インデックス作成
- 主張 ID から所有ページへのルックアップ
- コンパクトなプロンプト補足
- レポート/ダッシュボード生成

## ダッシュボードとヘルスレポート

`render.createDashboards` が有効な場合、コンパイルは `reports/` の下でダッシュボードを保守します。

組み込みレポートは次のとおりです。

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

これらのレポートは次のようなものを追跡します。

- 矛盾ノートのクラスター
- 競合する主張のクラスター
- 構造化された証拠が欠落している主張
- 信頼度の低いページと主張
- 古い、または鮮度が不明なページ
- 未解決の質問があるページ
- 人物/エンティティのルーティングカード
- 構造化された関係エッジ
- 証拠クラスのカバレッジ
- 使用前にレビューが必要な非公開プライバシー階層

## 検索と取得

`memory-wiki` は 2 つの検索バックエンドをサポートします。

- `shared`: 利用可能な場合、共有メモリ検索フローを使う
- `local`: wiki をローカルで検索する

また、3 つのコーパスをサポートします。

- `wiki`
- `memory`
- `all`

重要な動作:

- `wiki_search` と `wiki_get` は、可能な場合、最初のパスとしてコンパイル済みダイジェストを使う
- 主張 ID は所有ページに解決できる
- 異議のある/古い/新鮮な主張はランキングに影響する
- 来歴ラベルは結果に残ることがある
- 検索モードは、人物検索、質問ルーティング、ソース証拠、または生の主張に対してランキングを偏らせることができる

実用的なルール:

- 1 回の広範なリコールには `memory_search corpus=all` を使う
- wiki 固有のランキング、来歴、またはページ単位の信念構造を重視する場合は `wiki_search` + `wiki_get` を使う

検索モード:

- `auto`: バランスの取れたデフォルト
- `find-person`: 人物らしいエンティティ、エイリアス、ハンドル、ソーシャル、canonical ID をブーストする
- `route-question`: エージェントカード、依頼対象ヒント、最適用途ヒント、関係コンテキストをブーストする
- `source-evidence`: ソースページと構造化証拠メタデータをブーストする
- `raw-claim`: 一致する構造化主張をブーストし、結果に主張/証拠メタデータを返す

結果が構造化主張に一致した場合、`wiki_search` は詳細ペイロードで `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` を返せます。テキスト出力にも、利用可能な場合はコンパクトな `Claim:` と `Evidence:` 行が含まれます。

## エージェントツール

Plugin は次のツールを登録します。

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

それぞれの役割:

- `wiki_status`: 現在のボールトモード、ヘルス、Obsidian CLI の可用性
- `wiki_search`: wiki ページと、設定されている場合は共有メモリコーパスを検索する。人物検索、質問ルーティング、ソース証拠、または生の主張ドリルダウン向けに `mode` を受け付ける
- `wiki_get`: ID/パスで wiki ページを読み取る、または共有メモリコーパスにフォールバックする
- `wiki_apply`: 自由形式のページ手術なしで、狭い統合/メタデータ変更を行う
- `wiki_lint`: 構造チェック、来歴ギャップ、矛盾、未解決の質問

このPluginは非排他的なメモリコーパス補足も登録するため、アクティブメモリPluginがコーパス選択をサポートしている場合、共有の
`memory_search` と `memory_get` から wiki に到達できます。

## プロンプトとコンテキストの動作

`context.includeCompiledDigestPrompt` が有効な場合、メモリプロンプトセクションは
`agent-digest.json` からのコンパクトなコンパイル済みスナップショットを追加します。

そのスナップショットは意図的に小さく、高シグナルです。

- 上位ページのみ
- 上位クレームのみ
- 矛盾数
- 質問数
- 信頼度/鮮度の修飾子

これはプロンプト形状を変更するためオプトインであり、主にメモリ補足を明示的に消費するコンテキストエンジンやレガシーのプロンプト組み立てで役立ちます。

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

- `vaultMode`: `isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`: `native` または `obsidian`
- `bridge.readMemoryArtifacts`: アクティブメモリPluginの公開アーティファクトをインポート
- `bridge.followMemoryEvents`: ブリッジモードでイベントログを含める
- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`
- `context.includeCompiledDigestPrompt`: メモリプロンプトセクションにコンパクトなダイジェストスナップショットを追加
- `render.createBacklinks`: 決定論的な関連ブロックを生成
- `render.createDashboards`: ダッシュボードページを生成

### 例: QMD + ブリッジモード

リコールには QMD を使い、管理されたナレッジレイヤーには `memory-wiki` を使いたい場合に使用します。

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

これにより、次が維持されます。

- アクティブメモリのリコールを QMD が担当
- `memory-wiki` はコンパイル済みページとダッシュボードに集中
- コンパイル済みダイジェストプロンプトを意図的に有効にするまで、プロンプト形状は変更されない

## CLI

`memory-wiki` はトップレベルの CLI サーフェスも公開します。

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

完全なコマンドリファレンスについては、[CLI: wiki](/ja-JP/cli/wiki) を参照してください。

## Obsidian サポート

`vault.renderMode` が `obsidian` の場合、このPluginは Obsidian 向けの
Markdown を書き込み、必要に応じて公式の `obsidian` CLI を使用できます。

サポートされるワークフローには次が含まれます。

- ステータスのプローブ
- vault 検索
- ページを開く
- Obsidian コマンドの呼び出し
- デイリーノートへのジャンプ

これは任意です。wiki は Obsidian なしでもネイティブモードで動作します。

## 推奨ワークフロー

1. リコール/昇格/Dreaming にはアクティブメモリPluginを使い続けます。
2. `memory-wiki` を有効にします。
3. ブリッジモードが明示的に必要でない限り、`isolated` モードから始めます。
4. 来歴が重要な場合は `wiki_search` / `wiki_get` を使用します。
5. 狭い範囲の統合やメタデータ更新には `wiki_apply` を使用します。
6. 意味のある変更後に `wiki_lint` を実行します。
7. 古さや矛盾を可視化したい場合は、ダッシュボードをオンにします。

## 関連ドキュメント

- [メモリ概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)
- [CLI: wiki](/ja-JP/cli/wiki)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
