---
read_when:
    - 単純な MEMORY.md のメモを超える永続的な知識が必要な場合
    - バンドルされている memory-wiki Plugin を設定しています
    - 1つの Gateway 内のエージェントごとに個別の Wiki Vault が必要です
    - wiki_search、wiki_get、またはブリッジモードについて理解したい場合
summary: memory-wiki：出典情報、主張、ダッシュボード、ブリッジモードを備えたコンパイル済みナレッジ保管庫
title: メモリ Wiki
x-i18n:
    generated_at: "2026-07-11T22:27:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` は、永続的な知識をナビゲート可能な Wiki にコンパイルする同梱 Plugin です。決定論的なページ、根拠付きの構造化された主張、出典、ダッシュボード、機械可読なダイジェストを提供します。

これは Active Memory Plugin を置き換えるものではありません。想起、昇格、インデックス作成、Dreaming は、設定されているメモリバックエンド（`memory-core`、QMD、Honcho など）が引き続き担当します。`memory-wiki` はその隣で動作し、知識を保守可能な Wiki レイヤーにコンパイルします。

| レイヤー             | 担当範囲                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Active Memory Plugin | 想起、セマンティック検索、昇格、Dreaming、メモリランタイム                       |
| `memory-wiki`        | コンパイル済み Wiki ページ、出典情報が豊富な統合、ダッシュボード、Wiki の検索／取得／適用 |

実用上の原則：

- 設定済みのすべてのコーパスを対象に、広範な想起を一度行う場合は `memory_search`
- Wiki 固有のランキング、出典、またはページ単位の信念構造が必要な場合は `wiki_search` / `wiki_get`
- Active Memory Plugin がコーパス選択をサポートしている場合、1 回の呼び出しで両方のレイヤーを対象にするには `memory_search corpus=all`

一般的なローカルファースト構成では、想起用の Active Memory バックエンドとして QMD を使用し、永続的な統合ページ用に `memory-wiki` を `bridge` モードで使用します。[設定](#configuration)にある QMD + bridge モードの例を参照してください。

bridge モードでエクスポート済みアーティファクトが 0 件と報告される場合、Active Memory Plugin は現在、公開 bridge 入力を公開していません。まず `openclaw wiki doctor` を実行し、次に Active Memory Plugin が公開アーティファクトをサポートしていることを確認してください。

## Vault モード

- `isolated`（デフォルト）：独自の Vault とソースを持ち、Active Memory Plugin に依存しません。自己完結型のキュレーション済み知識ストアに使用します。
- `bridge`：公開 Plugin SDK の接続点を通じて、Active Memory Plugin から公開メモリアーティファクトとイベントログを読み取ります。Plugin の非公開内部実装に立ち入らず、Memory Plugin がエクスポートしたアーティファクトをコンパイルする場合に使用します。
- `unsafe-local`：ローカルの非公開パスにアクセスするための、同一マシン上での明示的なエスケープハッチです。意図的に実験的かつ移植性がありません。信頼境界を理解し、bridge モードでは提供できないローカルファイルシステムへのアクセスが特に必要な場合にのみ使用してください。

Vault モードと Vault スコープは別々に選択します：

- `vaultMode` は Wiki の入力元を選択します。
- `vault.scope` は、すべてのエージェントが 1 つの Vault を使用するか、各エージェントが子 Vault を持つかを選択します。

`vault.scope: "global"` がデフォルトであり、既存の単一 Vault の動作を維持します。エージェント間で Wiki ページ、コンパイル済みダイジェスト、検索結果、または書き込みを共有してはならない場合は、`isolated` または `bridge` モードで `vault.scope: "agent"` を使用してください。設定された非公開パスはエージェント所有の入力ではないため、エージェントスコープを `unsafe-local` モードと組み合わせることはできません。設定検証ではこの組み合わせが拒否されます。

bridge モードでは、`bridge.*` の各設定トグルに応じて、以下をインデックス化できます：

- エクスポートされたメモリアーティファクト（`indexMemoryRoot`）
- 日次ノート（`indexDailyNotes`）
- Dreaming レポート（`indexDreamReports`）
- メモリイベントログ（`followMemoryEvents`）

bridge モードが有効で、`bridge.readMemoryArtifacts` が有効な場合、`openclaw wiki status`、`openclaw wiki doctor`、`openclaw wiki bridge import` は実行中の Gateway を経由するため、エージェント／ランタイムメモリと同じ Active Memory Plugin のコンテキストを参照します。bridge が無効、またはアーティファクトの読み取りが無効な場合、これらのコマンドはローカル／オフライン動作を維持します。

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

管理対象コンテンツは生成ブロック内に保持され、人間が記述したノートブロックは再生成後も維持されます。

- `sources/`：インポートされた原資料と、bridge／unsafe-local を基盤とするページ
- `entities/`：永続的な対象、人、システム、プロジェクト、オブジェクト
- `concepts/`：アイデア、抽象概念、パターン、ポリシー（OKF インポート先としても使用）
- `syntheses/`：コンパイル済みの要約と保守される集約
- `reports/`：生成されたダッシュボード

## Open Knowledge Format のインポート

```bash
openclaw wiki okf import ./bundles/ga4
```

展開済みの Open Knowledge Format バンドルを Wiki の概念ページにインポートします。データカタログ、ドキュメントクローラー、またはエンリッチメントエージェントがすでに OKF を生成している場合に適しています。OKF を移植可能な交換アーティファクトとして維持し、`memory-wiki` によって OpenClaw ネイティブの概念ページとコンパイル済みダイジェストへ変換します。

- 予約されていない `.md` ファイルは概念ドキュメントです
- インポートされる各概念には、空でない `type` フロントマター項目が必要です。`type` がない場合は `missing-type` 警告が発生し、そのファイルはスキップされます
- 未知の `type` 値は汎用概念として受け入れられます
- `index.md` と `log.md` は予約済みであり、概念としてインポートされることはありません
- 壊れた Markdown リンクや外部 Markdown リンクは変更されません

インポートされたページは `concepts/` 配下にフラット化されるため、既存のコンパイル、検索、取得、ダッシュボードの各フローは、2 つ目の Wiki ツリーを用意せずにそれらを参照できます。各ページには、元の OKF 概念 ID、ソースパス、`type`、`resource`、`tags`、タイムスタンプ、および生成元のフロントマター全体が保持されます。内部 OKF リンクは生成された Wiki 概念ページへのリンクに書き換えられ、さらに `kind: okf-link` を持つ構造化された `relationships` エントリも生成されます。

## 構造化された主張と根拠

ページには自由形式のテキストだけでなく、構造化された `claims` フロントマターが含まれます。各主張には `id`、`text`、`status`、`confidence`、`evidence[]`、`updatedAt` を含めることができます。各根拠エントリには `kind`、`sourceId`、`path`、`lines`、`weight`、`confidence`、`privacyTier`、`note`、`updatedAt` を含めることができます。

これにより、Wiki は単なる受動的なノート置き場ではなく、信念レイヤーとして機能します。主張を追跡、スコアリング、異議申し立てし、ソースまで遡って解決できます。

## エージェント向けエンティティメタデータ

エンティティページには、人、チーム、システム、プロジェクト、その他あらゆる種類のエンティティに使用できる汎用ルーティングメタデータが含まれます：

- `entityType`：例：`person`、`team`、`system`、`project`
- `canonicalId`：別名やインポートをまたいで安定する識別キー
- `aliases`：同じページに解決される名前、ハンドル、ラベル
- `privacyTier`：自由形式の文字列。`public` はレビュー不要として扱われ、それ以外の値（例：`local-private`、`sensitive`、`confirm-before-use`）は `reports/privacy-review.md` でフラグ付けされます
- `bestUsedFor` / `notEnoughFor`：簡潔なルーティングのヒント
- `lastRefreshedAt`：ページの編集時刻とは別の、ソース更新タイムスタンプ
- `personCard`：任意の人物固有ルーティングカード（ハンドル、ソーシャル情報、メールアドレス、タイムゾーン、担当領域、依頼に適した事項、依頼を避ける事項、信頼度、プライバシー階層）
- `relationships`：関連ページへの型付きエッジ（対象、種類、重み、信頼度、根拠の種類、プライバシー階層、注記）

人物 Wiki では、まず `reports/person-agent-directory.md` を確認し、連絡先情報や推測された事実を使用する前に `wiki_get` で人物ページを開いてください。

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

コンパイルでは Wiki ページを読み取り、要約を正規化し、以下の場所に安定した機械向けアーティファクトを出力します：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

エージェントとランタイムコードは、Markdown をスクレイピングする代わりにこれらのダイジェストを読み取ります。コンパイル済み出力は、検索／取得用の初回 Wiki インデックス作成、主張 ID から所有ページへの逆引き、簡潔なプロンプト補足、レポート生成にも使用されます。

## ダッシュボードと健全性レポート

`render.createDashboards` が有効な場合、コンパイルによって `reports/` 配下のダッシュボードが保守されます：

| レポート                            | 追跡対象                                           |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 未解決の質問があるページ                           |
| `reports/contradictions.md`         | 矛盾に関する注記のクラスター                       |
| `reports/low-confidence.md`         | 信頼度の低いページと主張                           |
| `reports/claim-health.md`           | 構造化された根拠がない主張                         |
| `reports/stale-pages.md`            | 古くなっている、または鮮度が不明なページ           |
| `reports/person-agent-directory.md` | 人物／エンティティのルーティングカード             |
| `reports/relationship-graph.md`     | 構造化された関係エッジ                             |
| `reports/provenance-coverage.md`    | 根拠クラスのカバレッジ                             |
| `reports/privacy-review.md`         | 使用前にレビューが必要な非公開プライバシー階層     |

## 検索と取得

検索バックエンドは 2 種類あります：

- `shared`：利用可能な場合は共有メモリ検索フローを使用
- `local`：Wiki をローカルで検索

コーパスは `wiki`、`memory`、`all` の 3 種類です。

- `wiki_search` / `wiki_get` は、可能な場合、コンパイル済みダイジェストを第一段階として使用します
- 主張 ID は、その主張を所有するページに解決されます
- 異議のある主張、古い主張、新しい主張はランキングに影響します
- 出典ラベルは結果にも保持されます

検索モード（`--mode` / ツールの `mode` パラメーター）：

| モード            | 優先度を高める対象                                             |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | バランスの取れたデフォルト                                     |
| `find-person`     | 人物に似たエンティティ、別名、ハンドル、ソーシャル情報、正規 ID |
| `route-question`  | エージェントカード、依頼事項／最適用途のヒント、関係コンテキスト |
| `source-evidence` | ソースページと構造化された根拠メタデータ                       |
| `raw-claim`       | 一致する構造化された主張。主張／根拠メタデータを返す           |

結果が構造化された主張に一致すると、`wiki_search` は詳細ペイロードに `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds`、`evidenceSourceIds` を返します。利用可能な場合、テキスト出力には簡潔な `Claim:` 行と `Evidence:` 行が含まれます。

## エージェントツール

| ツール        | 用途                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 現在の保管庫モードとスコープ、解決されたエージェント、正常性、Obsidian CLI の利用可否                                                                   |
| `wiki_search` | Wiki ページと、設定されている場合は共有メモリコーパスを検索。人物検索、質問のルーティング、出典の根拠、未加工の主張の掘り下げに使用する `mode` を受け付ける |
| `wiki_get`    | ID／パスで Wiki ページを読み込む。共有検索が有効で検索対象が見つからない場合は、共有メモリコーパスにフォールバックする                                  |
| `wiki_apply`  | ページを自由形式で直接編集せず、限定的な統合処理／メタデータ変更を行う                                                                                  |
| `wiki_lint`   | 構造チェック、出典情報の不足、矛盾、未解決の質問                                                                                                        |

この Plugin は非排他的なメモリコーパスの補完も登録するため、Active Memory
Plugin がコーパス選択をサポートしている場合、共有の `memory_search` と
`memory_get` から Wiki にアクセスできます。

## プロンプトとコンテキストの動作

`context.includeCompiledDigestPrompt` を有効にすると、メモリプロンプトのセクションに
`agent-digest.json` からのコンパクトなコンパイル済みスナップショットが追加されます。内容は、
上位ページのみ、上位の主張のみ、矛盾数、質問数、信頼度／鮮度の修飾情報です。
これはプロンプトの構造を変更するためオプトインです。主に、メモリ補完を明示的に使用する
コンテキストエンジンやプロンプト組み立て処理に関係します。

## 設定

設定は `plugins.entries.memory-wiki.config` 以下に配置します。

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

主要な切り替え設定：

| キー                                       | 値／デフォルト                                 | 注記                                                                                 |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `vaultMode`                                | `isolated`（デフォルト）、`bridge`、`unsafe-local` | 入力と連携の動作を選択する                                                           |
| `vault.scope`                              | `global`（デフォルト）、`agent`                | 1 つの共有保管庫、またはエージェントごとに 1 つの子保管庫                           |
| `vault.path`                               | グローバルのデフォルト `~/.openclaw/wiki/main` | グローバルでは保管庫そのもの。エージェントスコープでは親のデフォルトは `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native`（デフォルト）、`obsidian`             |                                                                                      |
| `bridge.readMemoryArtifacts`               | デフォルト `true`                              | Active Memory Plugin の公開アーティファクトをインポートする                          |
| `bridge.followMemoryEvents`                | デフォルト `true`                              | ブリッジモードでイベントログを含める                                                 |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | デフォルト `false`                             | `unsafe-local` インポートの実行に必要                                                |
| `unsafeLocal.paths`                        | デフォルト `[]`                                | `unsafe-local` モードでインポートするローカルパスを明示的に指定する                  |
| `search.backend`                           | `shared`（デフォルト）、`local`                |                                                                                      |
| `search.corpus`                            | `wiki`（デフォルト）、`memory`、`all`          |                                                                                      |
| `context.includeCompiledDigestPrompt`      | デフォルト `false`                             | 選択したエージェントのコンパクトなダイジェストスナップショットをメモリプロンプトのセクションに追加する |
| `render.createBacklinks`                   | デフォルト `true`                              | 決定論的な関連ブロックを生成する                                                     |
| `render.createDashboards`                  | デフォルト `true`                              | ダッシュボードページを生成する                                                       |

### エージェントごとの保管庫

設定済みの各エージェントに個別の Wiki を割り当てるには、`vault.scope` を
`agent` に設定します。このスコープでは、`vault.path` は親ディレクトリとなり、
OpenClaw が正規化されたエージェント ID を追加します。

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
`~/.openclaw/wiki/marketing` に解決されます。エージェントスコープで
`vault.path` を省略した場合、親のデフォルトは `~/.openclaw/wiki` です。
そのため、デフォルトの `main` エージェントは既存の
`~/.openclaw/wiki/main` パスを維持します。

エージェントツール、コンパイル済みプロンプトダイジェスト、および
`memory_search`／`memory_get` を通じて公開される Wiki 補完は、アクティブな
エージェントコンテキストから保管庫を解決します。複数のエージェントが設定された
環境で CLI と Gateway を呼び出す場合は、`openclaw wiki --agent <agentId> ...`
または Gateway リクエストの `agentId` でエージェントを明示的に指定してください。
設定済みのエージェントが 1 つだけの場合は、ID を指定しなくてもそのエージェントが
デフォルトになります。

ブリッジモードでは、エージェントスコープのインポートは、公開メモリアーティファクトの
`agentIds` に選択したエージェントが含まれている場合にのみ受け付けます。
別のエージェントが所有するアーティファクト、所有権メタデータがないアーティファクト、
または所有者が不明なアーティファクトはスキップされます。グローバルスコープでは、
既存の共有アーティファクトの動作が維持されます。

<Warning>
`vault.scope` を変更しても、既存の保管庫はコピーも分割もされません。エージェントスコープでは、
明示的に設定された `vault.path` が親ディレクトリになるため、本番環境のエージェントを
切り替える前に、既存のページを意図的に移動またはインポートしてください。最初に保管庫を
バックアップしてください。

エージェントごとの保管庫は、同一プロセス内の知識境界であり、オペレーティングシステムの
セキュリティ境界ではありません。ホストのファイルシステムにアクセスできる Plugin や
サンドボックス化されていないツールは、別のエージェントのディレクトリも読み取れます。
エージェント間で相互に信頼しない場合は、[サンドボックス化](/ja-JP/gateway/sandboxing)または
[個別の Gateway プロファイル](/ja-JP/gateway/multiple-gateways)を使用してください。
</Warning>

### 例：QMD + ブリッジモード

検索には QMD、管理された知識レイヤーには `memory-wiki` を使用したい場合に、
この構成を使用します。各レイヤーはそれぞれの役割に専念します。QMD は未加工のメモ、
セッションのエクスポート、追加のコレクションを検索可能な状態に保ち、`memory-wiki` は
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

これにより、Active Memory の検索は QMD が担当し、`memory-wiki` は
コンパイル済みページとダッシュボードに専念します。また、コンパイル済みダイジェストの
プロンプトを意図的に有効にするまで、プロンプトの構造は変更されません。

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
`wiki chatgpt import`／`wiki chatgpt rollback`、および `wiki obsidian`
サブコマンド一式を含む完全なコマンドリファレンスについては、
[CLI：Wiki](/ja-JP/cli/wiki)を参照してください。

## Obsidian のサポート

`vault.renderMode` が `obsidian` の場合、Plugin は Obsidian 向けの
Markdown を書き出し、必要に応じて公式の `obsidian` CLI を使用して、
状態の確認、保管庫の検索、ページを開く操作、コマンドの実行、デイリーノートへの
移動を行えます。これは任意です。Obsidian がなくても、Wiki はネイティブモードで
引き続き動作します。

エージェントスコープの保管庫でも Obsidian 向け Markdown を使用できますが、
設定の検証では `vault.scope: "agent"` と `obsidian.useOfficialCli: true` の
組み合わせが拒否されます。現在の `obsidian.vaultName` 設定はグローバルであり、
エージェントごとに異なる Obsidian 保管庫を選択することはできません。代わりに
Wiki ツールと CLI 操作を使用するか、Obsidian で操作する Wiki をグローバルスコープに
維持してください。

## 推奨ワークフロー

<Steps>
<Step title="検索には Active Memory Plugin を維持する">
検索、昇格、Dreaming は、設定されたメモリバックエンドが引き続き所有します。
</Step>
<Step title="memory-wiki を有効にする">
ブリッジモードを明示的に使用したい場合を除き、`isolated` モードから始めます。
</Step>
<Step title="出典情報が重要な場合は wiki_search／wiki_get を使用する">
Wiki 固有のランキングやページ単位の確信構造が必要な場合は、`memory_search` よりもこれらを優先してください。
</Step>
<Step title="限定的な統合処理やメタデータ更新には wiki_apply を使用する">
管理対象の生成ブロックを手動で編集しないでください。
</Step>
<Step title="重要な変更後に wiki_lint を実行する">
矛盾、未解決の質問、出典情報の不足を検出します。
</Step>
<Step title="古い情報や矛盾を可視化するためダッシュボードを有効にする">
`render.createDashboards: true`（デフォルト）を設定します。
</Step>
</Steps>

## 関連ドキュメント

- [メモリの概要](/ja-JP/concepts/memory)
- [CLI：メモリ](/ja-JP/cli/memory)
- [CLI：Wiki](/ja-JP/cli/wiki)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
