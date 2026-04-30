---
read_when:
    - MEMORY.md の単なるメモを超える永続的な知識が必要な場合
    - 同梱の memory-wiki Plugin を設定しています
    - wiki_search、wiki_get、またはブリッジモードについて理解したい
summary: 'memory-wiki: 出典情報、主張、ダッシュボード、ブリッジモードを備えたコンパイル済みナレッジボールト'
title: メモリーウィキ
x-i18n:
    generated_at: "2026-04-30T05:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` は、永続メモリをコンパイル済みの知識保管庫に変えるバンドルPluginです。

これはActive Memory Pluginを**置き換えるものではありません**。Active Memory Pluginは引き続き、想起、昇格、インデックス化、Dreamingを所有します。`memory-wiki` はその横に位置し、永続知識を、決定論的なページ、構造化された主張、来歴、ダッシュボード、機械可読なダイジェストを備えた、ナビゲーション可能なwikiへコンパイルします。

メモリをMarkdownファイルの山ではなく、保守された知識レイヤーのように振る舞わせたい場合に使用します。

## 追加されるもの

- 決定論的なページレイアウトを持つ専用wiki保管庫
- 単なる散文ではなく、構造化された主張と証拠メタデータ
- ページレベルの来歴、信頼度、矛盾、未解決の質問
- エージェント/ランタイム利用者向けのコンパイル済みダイジェスト
- wikiネイティブの検索/取得/適用/lintツール
- Active Memory Pluginから公開アーティファクトをインポートする任意のbridgeモード
- 任意のObsidian向けレンダリングモードとCLI統合

## メモリとの関係

分割は次のように考えてください。

| レイヤー                                                | 所有するもの                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Active Memory Plugin（`memory-core`、QMD、Honchoなど） | 想起、セマンティック検索、昇格、Dreaming、メモリランタイム                                  |
| `memory-wiki`                                           | コンパイル済みwikiページ、来歴が豊富な合成、ダッシュボード、wiki固有の検索/取得/適用       |

Active Memory Pluginが共有想起アーティファクトを公開している場合、OpenClawは `memory_search corpus=all` を使って、両方のレイヤーを1回のパスで検索できます。

wiki固有のランキング、来歴、またはページへの直接アクセスが必要な場合は、代わりにwikiネイティブのツールを使用します。

## 推奨されるハイブリッドパターン

ローカルファーストのセットアップで強力なデフォルトは次の構成です。

- 想起と広範なセマンティック検索のためのActive MemoryバックエンドとしてQMDを使用する
- 永続的に合成された知識ページのために、`memory-wiki` を `bridge` モードで使用する

この分割は、それぞれのレイヤーが役割に集中できるため、うまく機能します。

- QMDは生のメモ、セッションエクスポート、追加コレクションを検索可能に保つ
- `memory-wiki` は安定したエンティティ、主張、ダッシュボード、ソースページをコンパイルする

実用上のルール:

- メモリ全体に対する広範な想起パスが1つ必要な場合は `memory_search` を使用する
- 来歴を考慮したwiki結果が必要な場合は `wiki_search` と `wiki_get` を使用する
- 共有検索を両方のレイヤーにまたがらせたい場合は `memory_search corpus=all` を使用する

bridgeモードがエクスポート済みアーティファクト0件を報告する場合、Active Memory Pluginはまだ公開bridge入力を公開していません。まず `openclaw wiki doctor` を実行し、その後Active Memory Pluginが公開アーティファクトをサポートしていることを確認してください。

bridgeモードが有効で `bridge.readMemoryArtifacts` が有効な場合、`openclaw wiki status`、`openclaw wiki doctor`、`openclaw wiki bridge
import` は実行中のGateway経由で読み取ります。これにより、CLI bridgeチェックがランタイムのメモリPluginコンテキストと整合します。bridgeが無効な場合、またはアーティファクト読み取りがオフの場合、これらのコマンドはローカル/オフラインの動作を維持します。

## 保管庫モード

`memory-wiki` は3つの保管庫モードをサポートします。

### `isolated`

独自の保管庫、独自のソースを持ち、`memory-core` に依存しません。

wikiを独自にキュレーションされた知識ストアにしたい場合に使用します。

### `bridge`

公開Plugin SDKシームを通じて、Active Memory Pluginから公開メモリアーティファクトとメモリイベントを読み取ります。

非公開のPlugin内部に踏み込まずに、メモリPluginのエクスポート済みアーティファクトをwikiでコンパイルして整理したい場合に使用します。

bridgeモードは次をインデックス化できます。

- エクスポート済みメモリアーティファクト
- dreamレポート
- 日次メモ
- メモリルートファイル
- メモリイベントログ

### `unsafe-local`

ローカルの非公開パス向けの、明示的な同一マシン用エスケープハッチです。

このモードは意図的に実験的で、移植性がありません。信頼境界を理解しており、bridgeモードでは提供できないローカルファイルシステムアクセスが明確に必要な場合にのみ使用してください。

## 保管庫レイアウト

Pluginは次のような保管庫を初期化します。

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

管理対象コンテンツは生成ブロック内に保持されます。人間によるメモブロックは保持されます。

主なページグループは次のとおりです。

- `sources/`: インポートされた生素材とbridgeに裏付けられたページ
- `entities/`: 永続的な物、人、システム、プロジェクト、オブジェクト
- `concepts/`: アイデア、抽象概念、パターン、ポリシー
- `syntheses/`: コンパイル済み要約と保守されたロールアップ
- `reports/`: 生成されたダッシュボード

## 構造化された主張と証拠

ページは自由形式のテキストだけでなく、構造化された `claims` frontmatterを持つことができます。

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

これにより、wikiは受動的なメモの投棄場所ではなく、信念レイヤーのように振る舞います。主張は追跡、スコア付け、異議申し立て、ソースへの解決が可能です。

## エージェント向けエンティティメタデータ

エンティティページは、エージェント利用向けのルーティングメタデータも保持できます。これは汎用frontmatterなので、人、チーム、システム、プロジェクト、その他あらゆるエンティティ種別で機能します。

一般的なフィールドは次のとおりです。

- `entityType`: 例: `person`、`team`、`system`、`project`
- `canonicalId`: エイリアスとインポートをまたいで使用される安定した識別キー
- `aliases`: 同じページに解決されるべき名前、ハンドル、ラベル
- `privacyTier`: `public`、`local-private`、`sensitive`、`confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: コンパクトなルーティングヒント
- `lastRefreshedAt`: ページ編集時刻とは別のソース更新タイムスタンプ
- `personCard`: ハンドル、SNS、メール、タイムゾーン、レーン、依頼すべき内容、依頼を避ける内容、信頼度、プライバシーを持つ任意の人物固有ルーティングカード
- `relationships`: 対象、種類、重み、信頼度、証拠の種類、プライバシー階層、メモを持つ関連ページへの型付きエッジ

人物wikiでは、エージェントは通常 `reports/person-agent-directory.md` から始め、連絡先情報や推論された事実を使う前に `wiki_get` で人物ページを開くべきです。

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

コンパイルステップはwikiページを読み取り、要約を正規化し、安定した機械向けアーティファクトを次の場所に出力します。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

これらのダイジェストは、エージェントやランタイムコードがMarkdownページをスクレイピングしなくてもよいように存在します。

コンパイル済み出力は次にも利用されます。

- 検索/取得フロー向けの初回wikiインデックス化
- claim idから所有ページへの逆引き
- コンパクトなプロンプト補足
- レポート/ダッシュボード生成

## ダッシュボードとヘルスレポート

`render.createDashboards` が有効な場合、compileは `reports/` 配下のダッシュボードを保守します。

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

- 矛盾メモのクラスター
- 競合する主張のクラスター
- 構造化された証拠が欠けている主張
- 信頼度の低いページと主張
- 古い、または鮮度が不明なもの
- 未解決の質問があるページ
- 人物/エンティティのルーティングカード
- 構造化された関係エッジ
- 証拠クラスのカバレッジ
- 使用前に確認が必要な非公開プライバシー階層

## 検索と取得

`memory-wiki` は2つの検索バックエンドをサポートします。

- `shared`: 利用可能な場合、共有メモリ検索フローを使用する
- `local`: wikiをローカルで検索する

また、3つのコーパスもサポートします。

- `wiki`
- `memory`
- `all`

重要な動作:

- `wiki_search` と `wiki_get` は、可能な場合、初回パスとしてコンパイル済みダイジェストを使用する
- claim idは所有ページに解決できる
- 異議のある/古い/新鮮な主張はランキングに影響する
- 来歴ラベルは結果に残せる
- 検索モードは、人物検索、質問ルーティング、ソース証拠、または生の主張に合わせてランキングにバイアスをかけられる

実用上のルール:

- 広範な想起パスを1つ実行するには `memory_search corpus=all` を使用する
- wiki固有のランキング、来歴、ページレベルの信念構造を重視する場合は `wiki_search` + `wiki_get` を使用する

検索モード:

- `auto`: バランスの取れたデフォルト
- `find-person`: 人物らしいエンティティ、エイリアス、ハンドル、SNS、正規IDをブーストする
- `route-question`: エージェントカード、依頼ヒント、適した用途のヒント、関係コンテキストをブーストする
- `source-evidence`: ソースページと構造化された証拠メタデータをブーストする
- `raw-claim`: 一致する構造化主張をブーストし、結果に主張/証拠メタデータを返す

結果が構造化された主張に一致した場合、`wiki_search` は詳細ペイロードに `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` を返すことができます。テキスト出力にも、利用可能な場合はコンパクトな `Claim:` 行と `Evidence:` 行が含まれます。

## エージェントツール

Pluginは次のツールを登録します。

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

それぞれの役割:

- `wiki_status`: 現在の保管庫モード、ヘルス、Obsidian CLIの可用性
- `wiki_search`: wikiページを検索し、設定されている場合は共有メモリコーパスも検索する。人物検索、質問ルーティング、ソース証拠、生の主張ドリルダウン向けの `mode` を受け付ける
- `wiki_get`: id/pathでwikiページを読み取るか、共有メモリコーパスにフォールバックする
- `wiki_apply`: 自由形式のページ編集ではなく、狭い合成/メタデータ変更を行う
- `wiki_lint`: 構造チェック、来歴の欠落、矛盾、未解決の質問

Pluginは非排他的なメモリコーパス補足も登録するため、Active Memory Pluginがコーパス選択をサポートしている場合、共有 `memory_search` と `memory_get` はwikiに到達できます。

## プロンプトとコンテキストの動作

`context.includeCompiledDigestPrompt` が有効な場合、メモリプロンプトセクションは `agent-digest.json` からコンパクトなコンパイル済みスナップショットを追加します。

そのスナップショットは意図的に小さく、高シグナルです。

- 上位ページのみ
- 上位主張のみ
- 矛盾数
- 質問数
- 信頼度/鮮度の修飾子

これはプロンプト形状を変えるためオプトインであり、主にメモリ補足を明示的に消費するコンテキストエンジンやレガシーのプロンプト組み立てで役立ちます。

## 設定

設定は `plugins.entries.memory-wiki.config` 配下に配置します。

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

主要な切り替え:

- `vaultMode`: `isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`: `native` または `obsidian`
- `bridge.readMemoryArtifacts`: Active Memory Plugin の公開アーティファクトをインポート
- `bridge.followMemoryEvents`: ブリッジモードでイベントログを含める
- `search.backend`: `shared` または `local`
- `search.corpus`: `wiki`、`memory`、または `all`
- `context.includeCompiledDigestPrompt`: compact digest スナップショットをメモリプロンプトセクションに追加
- `render.createBacklinks`: 決定論的な関連ブロックを生成
- `render.createDashboards`: ダッシュボードページを生成

### 例: QMD + ブリッジモード

リコールには QMD を使い、維持管理されたナレッジレイヤーには `memory-wiki` を使いたい場合に使用します:

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

これにより、次が維持されます:

- QMD が Active Memory のリコールを担当
- `memory-wiki` はコンパイル済みページとダッシュボードに集中
- compiled digest prompts を意図的に有効化するまで、プロンプト形状は変更されない

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

サポートされるワークフローには次が含まれます:

- ステータス調査
- vault 検索
- ページを開く
- Obsidian コマンドの呼び出し
- daily note へのジャンプ

これは任意です。wiki は Obsidian なしでもネイティブモードで動作します。

## 推奨ワークフロー

1. リコール、プロモーション、Dreaming には Active Memory Plugin を使い続けます。
2. `memory-wiki` を有効化します。
3. ブリッジモードを明示的に使いたい場合を除き、`isolated` モードから開始します。
4. 来歴が重要な場合は `wiki_search` / `wiki_get` を使用します。
5. 範囲の狭い統合やメタデータ更新には `wiki_apply` を使用します。
6. 意味のある変更後に `wiki_lint` を実行します。
7. 古い情報や矛盾の可視性が必要な場合は、ダッシュボードを有効化します。

## 関連ドキュメント

- [メモリの概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)
- [CLI: wiki](/ja-JP/cli/wiki)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
