---
read_when:
    - 単なる MEMORY.md のメモを超えた永続的な知識が必要な場合
    - バンドルされた memory-wiki Plugin を設定しています
    - 1つのGateway内のエージェントには、個別のWiki保管庫が必要です
    - wiki_search、wiki_get、またはブリッジモードについて理解したい場合
summary: memory-wiki：出典、主張、ダッシュボード、ブリッジモードを備えたコンパイル済みナレッジ保管庫
title: メモリ Wiki
x-i18n:
    generated_at: "2026-07-12T14:39:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` は、永続的な知識をナビゲーション可能な wiki にコンパイルする同梱 Plugin です。決定論的なページ、証拠を伴う構造化された主張、来歴、ダッシュボード、機械可読ダイジェストを提供します。

これは Active Memory Plugin を置き換えるものではありません。想起、昇格、インデックス作成、Dreaming は、設定されたメモリバックエンド（`memory-core`、QMD、Honcho など）が引き続き所有します。`memory-wiki` はその隣で動作し、知識を保守される wiki レイヤーへコンパイルします。

| レイヤー             | 所有する機能                                                                        |
| -------------------- | ----------------------------------------------------------------------------------- |
| Active Memory Plugin | 想起、セマンティック検索、昇格、Dreaming、メモリランタイム                          |
| `memory-wiki`        | コンパイル済み wiki ページ、来歴が豊富な統合結果、ダッシュボード、wiki の検索/取得/適用 |

実用上のルール：

- 設定されたすべてのコーパスを横断して、広範な想起を 1 回行う場合は `memory_search`
- wiki 固有のランキング、来歴、またはページ単位の信念構造が必要な場合は `wiki_search` / `wiki_get`
- Active Memory Plugin がコーパス選択をサポートしている場合に、1 回の呼び出しで両方のレイヤーを横断するには `memory_search corpus=all`

一般的なローカル優先のセットアップでは、想起用の Active Memory バックエンドとして QMD を使用し、永続的な統合済みページ用に `memory-wiki` を `bridge` モードで使用します。[設定](#configuration)の QMD + bridge モードの例を参照してください。

bridge モードでエクスポートされたアーティファクトが 0 件と報告される場合、Active Memory Plugin は現在、公開 bridge 入力を公開していません。まず `openclaw wiki doctor` を実行し、次に Active Memory Plugin が公開アーティファクトをサポートしていることを確認してください。

## Vault モード

- `isolated`（デフォルト）：独自の Vault と独自のソースを使用し、Active Memory Plugin に依存しません。自己完結型のキュレーション済み知識ストアに使用します。
- `bridge`：公開 Plugin SDK の境界を通じて、Active Memory Plugin の公開メモリアーティファクトとイベントログを読み取ります。Plugin の非公開内部実装に立ち入らず、Memory Plugin がエクスポートしたアーティファクトをコンパイルするために使用します。
- `unsafe-local`：ローカルの非公開パスにアクセスするための、同一マシン上で明示的に使用するエスケープハッチです。意図的に実験的かつ移植不能です。信頼境界を理解しており、bridge モードでは提供できないローカルファイルシステムへのアクセスが特に必要な場合にのみ使用してください。

Vault モードと Vault スコープは別々に選択します：

- `vaultMode` は、wiki の入力元を選択します。
- `vault.scope` は、すべてのエージェントが 1 つの Vault を使用するか、各エージェントが子 Vault を持つかを選択します。

`vault.scope: "global"` がデフォルトで、既存の単一 Vault の動作を維持します。エージェント間で wiki ページ、コンパイル済みダイジェスト、検索結果、書き込みを共有してはならない場合は、`isolated` または `bridge` モードで `vault.scope: "agent"` を使用してください。エージェントスコープは `unsafe-local` モードと組み合わせられません。設定された非公開パスは、エージェントが所有する入力ではないためです。設定検証では、この組み合わせが拒否されます。

bridge モードでは、`bridge.*` の各設定トグルに応じて、以下をインデックス化できます：

- エクスポートされたメモリアーティファクト（`indexMemoryRoot`）
- 日次ノート（`indexDailyNotes`）
- Dream レポート（`indexDreamReports`）
- メモリイベントログ（`followMemoryEvents`）

bridge モードが有効で、`bridge.readMemoryArtifacts` が有効な場合、`openclaw wiki status`、`openclaw wiki doctor`、`openclaw wiki bridge
import` は実行中の Gateway を経由するため、エージェント/ランタイムメモリと同じ Active Memory Plugin のコンテキストを参照します。bridge が無効であるか、アーティファクトの読み取りが無効な場合、これらのコマンドはローカル/オフライン動作を維持します。

## Vault のレイアウト

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

管理対象のコンテンツは生成ブロック内に留まり、人間が記述したノートブロックは再生成後も保持されます。

- `sources/`：インポートされた生の素材、および bridge/unsafe-local を基盤とするページ
- `entities/`：永続的な物事、人物、システム、プロジェクト、オブジェクト
- `concepts/`：アイデア、抽象概念、パターン、ポリシー（OKF インポートの格納先でもあります）
- `syntheses/`：コンパイル済みの要約と保守される集約
- `reports/`：生成されたダッシュボード

## Open Knowledge Format のインポート

```bash
openclaw wiki okf import ./bundles/ga4
```

展開済みの Open Knowledge Format バンドルを wiki の概念ページへインポートします。データカタログ、ドキュメントクローラー、またはエンリッチメントエージェントがすでに OKF を生成している場合に適しています。OKF を移植可能な交換アーティファクトとして維持し、`memory-wiki` によって OpenClaw ネイティブの概念ページとコンパイル済みダイジェストへ変換します。

- 予約されていない `.md` ファイルは概念ドキュメントです
- インポートされる各概念には、空でない `type` frontmatter フィールドが必要です。`type` がない場合は `missing-type` 警告が生成され、そのファイルはスキップされます
- 不明な `type` 値は汎用的な概念として受け入れられます
- `index.md` と `log.md` は予約済みであり、概念としてインポートされることはありません
- 壊れた Markdown リンクまたは外部 Markdown リンクは変更されません

インポートされたページは `concepts/` 直下にフラット化されるため、既存のコンパイル、検索、取得、ダッシュボードの各フローは、2 つ目の wiki ツリーを作成せずにそれらを認識できます。各ページには、元の OKF 概念 ID、ソースパス、`type`、`resource`、`tags`、タイムスタンプ、生成元の完全な frontmatter が保持されます。内部 OKF リンクは生成された wiki 概念ページへのリンクに書き換えられ、同時に `kind: okf-link` を持つ構造化された `relationships` エントリも出力されます。

## 構造化された主張とエビデンス

ページには、自由形式のテキストだけでなく、構造化された `claims` フロントマターが含まれます。各主張には、`id`、`text`、`status`、`confidence`、`evidence[]`、`updatedAt` を含めることができます。各エビデンスエントリには、`kind`、`sourceId`、`path`、`lines`、`weight`、`confidence`、`privacyTier`、`note`、`updatedAt` を含めることができます。

これにより、Wiki は受動的なメモの集積ではなく、信念レイヤーとして機能します。主張を追跡、評価、検証し、情報源にさかのぼって解決できます。

## エージェント向けエンティティメタデータ

エンティティページには、人、チーム、システム、プロジェクト、その他あらゆる種類のエンティティに使用できる汎用ルーティングメタデータが含まれます。

- `entityType`: 例: `person`、`team`、`system`、`project`
- `canonicalId`: エイリアスやインポートをまたいで一貫した識別キー
- `aliases`: 同じページに解決される名前、ハンドル、ラベル
- `privacyTier`: 自由形式の文字列。`public` はレビュー不要として扱われ、それ以外の値（例: `local-private`、`sensitive`、`confirm-before-use`）は `reports/privacy-review.md` でフラグ付けされます
- `bestUsedFor` / `notEnoughFor`: 簡潔なルーティングヒント
- `lastRefreshedAt`: ページの編集時刻とは別の、情報源の更新タイムスタンプ
- `personCard`: 省略可能な人物固有のルーティングカード（ハンドル、ソーシャル、メールアドレス、タイムゾーン、担当領域、依頼すること、依頼を避けること、信頼度、プライバシー階層）
- `relationships`: 関連ページへの型付きエッジ（対象、種類、重み、信頼度、エビデンスの種類、プライバシー階層、注記）

人物 Wiki では、まず `reports/person-agent-directory.md` を確認し、連絡先情報や推測された事実を使用する前に、`wiki_get` で人物ページを開いてください。

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
  - エコシステムのルーティング例
notEnoughFor:
  - 法的承認
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: エコシステム例
  askFor:
    - ロールアウトに関する質問例
  avoidAskingFor:
    - 無関係な請求に関する決定
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: その他の人物
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex はエコシステム例のルーティングに役立ちます。
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## コンパイルパイプライン

コンパイルでは Wiki ページを読み取り、要約を正規化し、次の場所に安定した機械向けアーティファクトを出力します。

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

エージェントとランタイムコードは、Markdown をスクレイピングする代わりに、これらのダイジェストを読み取ります。コンパイル済みの出力は、検索/取得用の Wiki の初回インデックス作成、主張 ID から所有ページへの逆引き、簡潔なプロンプト補足、レポート生成にも使用されます。

## ダッシュボードと健全性レポート

`render.createDashboards` が有効な場合、コンパイルによって `reports/` 配下のダッシュボードが維持されます。

| レポート                            | 追跡対象                                           |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 未解決の質問があるページ                           |
| `reports/contradictions.md`         | 矛盾に関する注記のクラスター                       |
| `reports/low-confidence.md`         | 信頼度が低いページと主張                           |
| `reports/claim-health.md`           | 構造化されたエビデンスがない主張                   |
| `reports/stale-pages.md`            | 鮮度が古い、または不明なページ                     |
| `reports/person-agent-directory.md` | 人物/エンティティのルーティングカード              |
| `reports/relationship-graph.md`     | 構造化された関係エッジ                             |
| `reports/provenance-coverage.md`    | エビデンスクラスの網羅率                           |
| `reports/privacy-review.md`         | 使用前にレビューが必要な非公開プライバシー階層     |

## 検索と取得

検索バックエンドは 2 つあります。

- `shared`: 利用可能な場合は共有メモリ検索フローを使用
- `local`: Wiki をローカルで検索

コーパスは `wiki`、`memory`、`all` の 3 つです。

- `wiki_search` / `wiki_get` は、可能な場合、コンパイル済みダイジェストを最初のパスとして使用します
- 主張 ID は、その主張を所有するページに解決されます
- 係争中、古い、最新の主張がランキングに影響します
- 出典ラベルは検索結果にも保持されます

検索モード（`--mode` / ツールの `mode` パラメータ）:

| モード            | 優先度を高める対象                                             |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | バランスの取れたデフォルト                                     |
| `find-person`     | 人物に類するエンティティ、エイリアス、ハンドル、ソーシャル、正規 ID |
| `route-question`  | エージェントカード、依頼事項/最適用途のヒント、関係コンテキスト |
| `source-evidence` | 情報源ページと構造化されたエビデンスメタデータ                 |
| `raw-claim`       | 一致する構造化された主張。主張/エビデンスメタデータを返します  |

結果が構造化された主張に一致すると、`wiki_search` は詳細ペイロードで `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` を返します。利用可能な場合、テキスト出力には簡潔な `Claim:` 行と `Evidence:` 行が含まれます。

## エージェントツール

| ツール        | 目的                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 現在の vault モードとスコープ、解決されたエージェント、健全性、Obsidian CLI の利用可否                                                                                   |
| `wiki_search` | wiki ページと、構成されている場合は共有メモリコーパスを検索します。人物検索、質問のルーティング、出典エビデンス、または生の主張の詳細調査用の `mode` を受け付けます      |
| `wiki_get`    | id/path で wiki ページを読み取ります。共有検索が有効で検索対象が見つからない場合は、共有メモリコーパスにフォールバックします                                             |
| `wiki_apply`  | ページを自由形式で編集することなく、限定的な統合処理やメタデータ変更を行います                                                                                           |
| `wiki_lint`   | 構造チェック、出典の欠落、矛盾、未解決の質問                                                                                                                             |

この Plugin は非排他的なメモリコーパス補完も登録するため、アクティブなメモリ
Plugin がコーパス選択をサポートしている場合、共有の
`memory_search` と `memory_get` から wiki にアクセスできます。

## プロンプトとコンテキストの動作

`context.includeCompiledDigestPrompt` が有効な場合、メモリプロンプトセクションには
`agent-digest.json` からのコンパクトなコンパイル済みスナップショットが追加されます。対象は上位ページのみ、
上位の主張のみ、矛盾数、質問数、信頼度と鮮度の
修飾情報です。これはプロンプトの形状を変更するためオプトインです。主に、メモリの
補完情報を明示的に利用するコンテキストエンジンやプロンプト組み立てで
重要になります。

## 設定

設定は `plugins.entries.memory-wiki.config` の下に配置します。

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
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

主な切り替え項目:

| キー                                       | 値 / デフォルト                                | 注記                                                                                       |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `vaultMode`                                | `isolated`（デフォルト）、`bridge`、`unsafe-local` | 入力と統合の動作を選択します                                                               |
| `vault.scope`                              | `global`（デフォルト）、`agent`                | 1 つの共有 vault、またはエージェントごとに 1 つの子 vault                                 |
| `vault.path`                               | グローバルのデフォルト `~/.openclaw/wiki/main` | グローバルでは vault の正確なパス。エージェントスコープの親はデフォルトで `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native`（デフォルト）、`obsidian`             |                                                                                            |
| `bridge.readMemoryArtifacts`               | デフォルト `true`                              | アクティブなメモリ Plugin の公開アーティファクトをインポートします                         |
| `bridge.followMemoryEvents`                | デフォルト `true`                              | bridge モードでイベントログを含めます                                                      |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | デフォルト `false`                             | `unsafe-local` インポートの実行に必要です                                                  |
| `unsafeLocal.paths`                        | デフォルト `[]`                                | `unsafe-local` モードでインポートする明示的なローカルパス                                  |
| `search.backend`                           | `shared`（デフォルト）、`local`                |                                                                                            |
| `search.corpus`                            | `wiki`（デフォルト）、`memory`、`all`          |                                                                                            |
| `context.includeCompiledDigestPrompt`      | デフォルト `false`                             | 選択したエージェントのコンパクトなダイジェストスナップショットをメモリプロンプトセクションに追加します |
| `render.createBacklinks`                   | デフォルト `true`                              | 決定論的な関連ブロックを生成します                                                         |
| `render.createDashboards`                  | デフォルト `true`                              | ダッシュボードページを生成します                                                         |

### エージェントごとの vault

構成済みの各エージェントに個別の wiki を与えるには、`vault.scope` を `agent` に設定します。
このスコープでは、`vault.path` は親ディレクトリとなり、OpenClaw が
正規化されたエージェント id を追加します。

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

これは `~/.openclaw/wiki/support` と
`~/.openclaw/wiki/marketing` に解決されます。エージェントスコープで `vault.path` を省略した場合、
親のデフォルトは `~/.openclaw/wiki` です。そのため、デフォルトの `main` エージェントは
既存の `~/.openclaw/wiki/main` パスを維持します。

エージェントツール、コンパイル済みプロンプトダイジェスト、および
`memory_search` / `memory_get` を通じて公開される wiki 補完情報は、アクティブなエージェントコンテキストから vault を解決します。
複数の構成済みエージェントを持つセットアップで CLI と Gateway を呼び出す場合は、
`openclaw wiki --agent <agentId> ...` または Gateway
リクエストの `agentId` でエージェントを明示的に指定してください。構成済みエージェントが 1 つだけの場合は、id が
指定されなくてもそのエージェントがデフォルトのままです。

bridge モードでは、エージェントスコープのインポートは、公開メモリアーティファクトの
`agentIds` に選択したエージェントが含まれている場合にのみ受け付けます。別のエージェントが所有するアーティファクト、
所有権メタデータがないアーティファクト、または所有者が不明なアーティファクトはスキップされます。グローバルスコープでは
既存の共有アーティファクトの動作が維持されます。

<Warning>
`vault.scope` を変更しても、既存の vault はコピーも分割もされません。エージェントスコープでは、
明示的に構成された `vault.path` は親ディレクトリになるため、本番エージェントを切り替える前に、
既存のページを意図的に移動またはインポートしてください。最初に
vault をバックアップしてください。

エージェントごとの vault は、同一プロセス内の知識境界であり、オペレーティングシステムの
セキュリティ境界ではありません。ホストファイルシステムへアクセスできる Plugin やサンドボックス化されていないツールは、
引き続き別のエージェントのディレクトリを読み取れます。エージェント同士が信頼し合わない場合は、
[サンドボックス化](/ja-JP/gateway/sandboxing)または
[個別の Gateway プロファイル](/ja-JP/gateway/multiple-gateways)を使用してください。
</Warning>

### 例: QMD + bridge モード

想起には QMD を使用し、管理された
知識レイヤーには `memory-wiki` を使用する場合に、この設定を使用します。各レイヤーはそれぞれの役割に集中します。QMD は生のメモ、セッションの
エクスポート、追加のコレクションを検索可能な状態に保ち、`memory-wiki` は
安定したエンティティ、主張、ダッシュボード、出典ページをコンパイルします。

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

これにより、アクティブメモリの想起は QMD が担当し、`memory-wiki` は
コンパイル済みページとダッシュボードに集中します。また、コンパイル済みダイジェストプロンプトを
意図的に有効にするまでは、プロンプトの形状は変更されません。

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

`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import` / `wiki chatgpt rollback`、および `wiki obsidian`
サブコマンド一式を含む、完全なコマンドリファレンスについては、[CLI: wiki](/ja-JP/cli/wiki)を参照してください。

## Obsidian のサポート

`vault.renderMode` が `obsidian` の場合、Plugin は Obsidian 向けの
Markdown を書き込み、必要に応じて公式の `obsidian` CLI を使用してステータスの
調査、vault の検索、ページを開く操作、コマンドの呼び出し、デイリーノートへの
移動を行えます。これは任意です。Obsidian がなくても、wiki は native モードで
引き続き動作します。

エージェントスコープの vault でも Obsidian 向け Markdown を使用できますが、
設定検証では `vault.scope: "agent"` と組み合わせた `obsidian.useOfficialCli: true` は拒否されます。
現在の `obsidian.vaultName` 設定はグローバルであり、エージェントごとに異なる
Obsidian vault を選択できません。代わりに wiki ツールと CLI 操作を使用するか、
Obsidian で操作する wiki をグローバルスコープに維持してください。

## 推奨ワークフロー

<Steps>
<Step title="想起にはアクティブなメモリ Plugin を維持する">
想起、昇格、Dreaming は、構成されたメモリバックエンドが引き続き所有します。
</Step>
<Step title="memory-wiki を有効にする">
bridge モードを明示的に使用する場合を除き、`isolated` モードから開始します。
</Step>
<Step title="出典が重要な場合は wiki_search / wiki_get を使用する">
wiki 固有のランキングやページレベルの信念構造が必要な場合は、`memory_search` よりもこちらを優先してください。
</Step>
<Step title="限定的な統合処理やメタデータ更新には wiki_apply を使用する">
管理対象の生成済みブロックを手動で編集しないでください。
</Step>
<Step title="意味のある変更後に wiki_lint を実行する">
矛盾、未解決の質問、出典の欠落を検出します。
</Step>
<Step title="古さや矛盾を可視化するためにダッシュボードを有効にする">
`render.createDashboards: true`（デフォルト）を設定します。
</Step>
</Steps>

## 関連ドキュメント

- [メモリの概要](/ja-JP/concepts/memory)
- [CLI: memory](/ja-JP/cli/memory)
- [CLI: wiki](/ja-JP/cli/wiki)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
