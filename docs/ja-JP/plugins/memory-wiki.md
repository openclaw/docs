---
read_when:
    - 単なる MEMORY.md のメモにとどまらない永続的な知識が必要な場合
    - 同梱の memory-wiki Plugin を設定しています
    - wiki_search、wiki_get、またはブリッジモードについて理解したい
summary: 'memory-wiki: 来歴、主張、ダッシュボード、ブリッジモードを備えたコンパイル済みナレッジ保管庫'
title: メモリウィキ
x-i18n:
    generated_at: "2026-05-04T05:01:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` は、永続メモリをコンパイル済みの知識 vault に変換する同梱プラグインです。

これは Active Memory プラグインを**置き換えるものではありません**。Active Memory プラグインは引き続き、リコール、昇格、インデックス作成、Dreaming を担います。`memory-wiki` はその横に位置し、永続的な知識を、決定論的なページ、構造化された主張、出典、ダッシュボード、機械可読のダイジェストを備えたナビゲーション可能な wiki にコンパイルします。

メモリを Markdown ファイルの山ではなく、保守された知識レイヤーのように扱いたい場合に使用します。

## 追加されるもの

- 決定論的なページレイアウトを持つ専用の wiki vault
- 単なる散文ではない、構造化された主張と証拠メタデータ
- ページ単位の出典、信頼度、矛盾、未解決の質問
- エージェント/ランタイム利用者向けのコンパイル済みダイジェスト
- wiki ネイティブの search/get/apply/lint ツール
- Active Memory プラグインから公開アーティファクトをインポートする任意のブリッジモード
- Obsidian に適した任意のレンダリングモードと CLI 連携

## メモリとの関係

分担は次のように考えてください。

| レイヤー                                                | 担うもの                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory プラグイン (`memory-core`, QMD, Honcho など) | リコール、セマンティック検索、昇格、Dreaming、メモリランタイム                             |
| `memory-wiki`                                           | コンパイル済み wiki ページ、出典が豊富な統合結果、ダッシュボード、wiki 固有の search/get/apply |

Active Memory プラグインが共有リコールアーティファクトを公開している場合、OpenClaw は `memory_search corpus=all` で両方のレイヤーを一度に検索できます。

wiki 固有のランキング、出典、または直接のページアクセスが必要な場合は、代わりに wiki ネイティブのツールを使用します。

## 推奨されるハイブリッドパターン

ローカル優先のセットアップにおける強力なデフォルトは次の構成です。

- リコールと広範なセマンティック検索のための Active Memory バックエンドとして QMD を使用する
- 永続的に統合された知識ページのために `memory-wiki` を `bridge` モードで使用する

この分担は、各レイヤーが役割に集中できるためうまく機能します。

- QMD は生のノート、セッションエクスポート、追加コレクションを検索可能に保つ
- `memory-wiki` は安定したエンティティ、主張、ダッシュボード、ソースページをコンパイルする

実用的なルール:

- メモリ全体に対して広範なリコールを 1 回実行したい場合は `memory_search` を使用する
- 出典を考慮した wiki 結果が必要な場合は `wiki_search` と `wiki_get` を使用する
- 共有検索を両方のレイヤーにまたがらせたい場合は `memory_search corpus=all` を使用する

ブリッジモードがエクスポート済みアーティファクト 0 件を報告する場合、Active Memory プラグインはまだ公開ブリッジ入力を公開していません。まず `openclaw wiki doctor` を実行し、その後 Active Memory プラグインが公開アーティファクトをサポートしていることを確認してください。

ブリッジモードが有効で `bridge.readMemoryArtifacts` が有効な場合、`openclaw wiki status`、`openclaw wiki doctor`、`openclaw wiki bridge
import` は実行中の Gateway 経由で読み取ります。これにより、CLI のブリッジチェックがランタイムのメモリプラグインコンテキストと一致します。ブリッジが無効な場合、またはアーティファクト読み取りが無効な場合、これらのコマンドはローカル/オフライン動作を維持します。

## Vault モード

`memory-wiki` は 3 つの vault モードをサポートします。

### `isolated`

独自の vault、独自のソースを持ち、`memory-core` への依存はありません。

wiki を独自にキュレーションされた知識ストアにしたい場合に使用します。

### `bridge`

公開 Plugin SDK の接合点を通じて、Active Memory プラグインから公開メモリアーティファクトとメモリイベントを読み取ります。

プライベートなプラグイン内部に到達せずに、メモリプラグインがエクスポートしたアーティファクトを wiki にコンパイルして整理したい場合に使用します。

ブリッジモードは次をインデックス化できます。

- エクスポート済みメモリアーティファクト
- dream レポート
- デイリーノート
- メモリルートファイル
- メモリイベントログ

### `unsafe-local`

ローカルのプライベートパス向けの、明示的な同一マシンの脱出口です。

このモードは意図的に実験的かつ非ポータブルです。信頼境界を理解しており、ブリッジモードでは提供できないローカルファイルシステムアクセスが明確に必要な場合にのみ使用してください。

## Vault レイアウト

プラグインは次のように vault を初期化します。

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

管理対象コンテンツは生成ブロック内に保持されます。人間のノートブロックは保持されます。

主なページグループは次のとおりです。

- `sources/`: インポートされた生素材とブリッジに支えられたページ用
- `entities/`: 永続的なもの、人、システム、プロジェクト、オブジェクト用
- `concepts/`: アイデア、抽象化、パターン、ポリシー用
- `syntheses/`: コンパイル済みの要約と保守されたロールアップ用
- `reports/`: 生成されたダッシュボード用

## 構造化された主張と証拠

ページは自由形式のテキストだけでなく、構造化された `claims` frontmatter を持つことができます。

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

これにより、wiki は受動的なノート置き場ではなく、信念レイヤーのように機能します。主張は追跡、スコアリング、異議申し立て、ソースへの解決が可能です。

## エージェント向けエンティティメタデータ

エンティティページは、エージェント利用向けのルーティングメタデータも持てます。これは汎用 frontmatter なので、人、チーム、システム、プロジェクト、その他任意のエンティティタイプに使えます。

一般的なフィールドは次のとおりです。

- `entityType`: 例: `person`、`team`、`system`、`project`
- `canonicalId`: エイリアスやインポート全体で使用される安定した識別キー
- `aliases`: 同じページに解決されるべき名前、ハンドル、ラベル
- `privacyTier`: `public`、`local-private`、`sensitive`、`confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: コンパクトなルーティングヒント
- `lastRefreshedAt`: ページ編集時刻とは別のソース更新タイムスタンプ
- `personCard`: ハンドル、ソーシャル、メール、タイムゾーン、レーン、依頼対象、依頼を避ける対象、信頼度、プライバシーを含む任意の人物固有ルーティングカード
- `relationships`: 対象、種類、重み、信頼度、証拠種別、プライバシーティア、ノートを持つ関連ページへの型付きエッジ

人物 wiki では、エージェントは通常 `reports/person-agent-directory.md` から開始し、連絡先詳細や推定された事実を使用する前に `wiki_get` で人物ページを開くべきです。

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

コンパイルステップは wiki ページを読み取り、要約を正規化し、次の場所に安定した機械向けアーティファクトを出力します。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

これらのダイジェストがあることで、エージェントとランタイムコードは Markdown ページをスクレイピングする必要がありません。

コンパイル済み出力は次も支えます。

- search/get フローのための初回 wiki インデックス作成
- 主張 ID から所有ページへの逆引き
- コンパクトなプロンプト補足
- レポート/ダッシュボード生成

## ダッシュボードと健全性レポート

`render.createDashboards` が有効な場合、コンパイルは `reports/` 配下のダッシュボードを保守します。

組み込みレポートには次があります。

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
- 構造化された証拠が欠けている主張
- 信頼度の低いページと主張
- 古い、または鮮度が不明なもの
- 未解決の質問があるページ
- 人物/エンティティのルーティングカード
- 構造化された関係エッジ
- 証拠クラスのカバレッジ
- 使用前にレビューが必要な非公開プライバシーティア

## 検索と取得

`memory-wiki` は 2 つの検索バックエンドをサポートします。

- `shared`: 利用可能な場合、共有メモリ検索フローを使用する
- `local`: wiki をローカルで検索する

また、3 つのコーパスをサポートします。

- `wiki`
- `memory`
- `all`

重要な動作:

- `wiki_search` と `wiki_get` は、可能な場合コンパイル済みダイジェストを初回パスとして使用します
- 主張 ID は所有ページへ解決できます
- 異議のある/古い/新鮮な主張はランキングに影響します
- 出典ラベルは結果に引き継がれる場合があります
- 検索モードは人物検索、質問ルーティング、ソース証拠、または生の主張に向けてランキングを偏らせることができます

実用的なルール:

- 広範なリコールを 1 回実行するには `memory_search corpus=all` を使用する
- wiki 固有のランキング、出典、またはページ単位の信念構造を重視する場合は `wiki_search` + `wiki_get` を使用する

検索モード:

- `auto`: バランスの取れたデフォルト
- `find-person`: 人物らしいエンティティ、エイリアス、ハンドル、ソーシャル、正規 ID を強化する
- `route-question`: エージェントカード、依頼対象ヒント、最適用途ヒント、関係コンテキストを強化する
- `source-evidence`: ソースページと構造化された証拠メタデータを強化する
- `raw-claim`: 一致する構造化された主張を強化し、結果に主張/証拠メタデータを返す

結果が構造化された主張に一致する場合、`wiki_search` は details ペイロードで `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` を返すことができます。テキスト出力にも、利用可能な場合はコンパクトな `Claim:` 行と `Evidence:` 行が含まれます。

## エージェントツール

プラグインは次のツールを登録します。

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

それぞれの役割:

- `wiki_status`: 現在の vault モード、健全性、Obsidian CLI の可用性
- `wiki_search`: wiki ページと、構成されている場合は共有メモリコーパスを検索する。人物検索、質問ルーティング、ソース証拠、生の主張の掘り下げのために `mode` を受け付ける
- `wiki_get`: id/path で wiki ページを読み取る、または共有メモリコーパスにフォールバックする
- `wiki_apply`: 自由形式のページ手術なしに、狭い範囲の統合/メタデータ変更を行う
- `wiki_lint`: 構造チェック、出典の欠落、矛盾、未解決の質問

プラグインは非排他的なメモリコーパス補足も登録するため、Active Memory プラグインがコーパス選択をサポートしている場合、共有 `memory_search` と `memory_get` は wiki に到達できます。

## プロンプトとコンテキストの動作

`context.includeCompiledDigestPrompt` が有効な場合、メモリプロンプトセクションは `agent-digest.json` からコンパクトなコンパイル済みスナップショットを追加します。

そのスナップショットは意図的に小さく、高シグナルです。

- 上位ページのみ
- 上位主張のみ
- 矛盾数
- 質問数
- 信頼度/鮮度の修飾子

これはプロンプト形状を変更するためオプトインであり、主にメモリ補足を明示的に消費するコンテキストエンジンやレガシーのプロンプト組み立てに有用です。

## 設定

設定は `plugins.entries.memory-wiki.config` 配下に置きます。

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

主な切り替え:

- `vaultMode`: `isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`: `native` または `obsidian`
- `bridge.readMemoryArtifacts`: Active Memory Plugin の公開アーティファクトをインポートする
- `bridge.followMemoryEvents`: ブリッジモードでイベントログを含める
- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`
- `context.includeCompiledDigestPrompt`: コンパクトなダイジェストスナップショットをメモリプロンプトセクションに追加する
- `render.createBacklinks`: 決定論的な関連ブロックを生成する
- `render.createDashboards`: ダッシュボードページを生成する

### 例: QMD + ブリッジモード

想起に QMD を使い、保守された知識レイヤーに `memory-wiki` を使いたい場合に使用します:

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

これにより、次の状態が保たれます:

- QMD が Active Memory の想起を担当する
- `memory-wiki` はコンパイル済みページとダッシュボードに集中する
- コンパイル済みダイジェストプロンプトを意図的に有効化するまで、プロンプトの形は変わらない

## CLI

`memory-wiki` はトップレベルの CLI サーフェスも公開します:

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

`vault.renderMode` が `obsidian` の場合、Plugin は Obsidian に適した Markdown を書き込み、任意で公式の `obsidian` CLI を使用できます。

サポートされるワークフローには次のものがあります:

- ステータス調査
- vault 検索
- ページを開く
- Obsidian コマンドの呼び出し
- デイリーノートへのジャンプ

これは任意です。wiki は Obsidian なしでもネイティブモードで動作します。

## 推奨ワークフロー

1. 想起/昇格/Dreaming 用に Active Memory Plugin を維持します。
2. `memory-wiki` を有効化します。
3. ブリッジモードを明示的に必要としない限り、`isolated` モードから始めます。
4. 来歴が重要な場合は `wiki_search` / `wiki_get` を使います。
5. 範囲の狭い統合やメタデータ更新には `wiki_apply` を使います。
6. 意味のある変更の後に `wiki_lint` を実行します。
7. 古くなった情報や矛盾を可視化したい場合は、ダッシュボードを有効にします。

## 関連ドキュメント

- [メモリ概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)
- [CLI: wiki](/ja-JP/cli/wiki)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
