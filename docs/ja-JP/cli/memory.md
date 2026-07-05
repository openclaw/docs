---
read_when:
    - セマンティックメモリをインデックス化または検索したい
    - メモリの可用性またはインデックス作成をデバッグしている
    - 呼び出した短期記憶を `MEMORY.md` に昇格させたい場合
summary: '`openclaw memory` の CLI リファレンス（status/index/search/promote/promote-explain/rem-harness/rem-backfill）'
title: メモリ
x-i18n:
    generated_at: "2026-07-05T11:11:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

セマンティックメモリのインデックス作成、検索、`MEMORY.md` への昇格を管理します。
同梱の `memory-core` Plugin によって提供され、`plugins.slots.memory` が
`memory-core` を選択している場合に利用できます（デフォルト）。他のメモリ
Plugin はそれぞれ独自の CLI 名前空間を公開します。

関連: [Memory](/ja-JP/concepts/memory) の概念、[Dreaming](/ja-JP/concepts/dreaming)、
[Memory 設定リファレンス](/ja-JP/reference/memory-config)、[Memory Wiki](/ja-JP/plugins/memory-wiki)、
[wiki](/ja-JP/cli/wiki)、[Plugins](/ja-JP/tools/plugin)。

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

`--agent` を指定しない場合、`agents.list` 内のすべてのエージェントに対して実行します。エージェントリストが
設定されていない場合は、デフォルトエージェントにフォールバックします。

| フラグ        | 効果                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | ベクトルストア、埋め込みプロバイダー、セマンティック検索の準備状態を調査します（追加のプロバイダー呼び出しを伴います）。通常の `memory status` は高速なままで、これをスキップします。不明なベクトル/セマンティック状態は、調査されていないことを意味します。QMD の字句 `searchMode: "search"` は、`--deep` があっても常にセマンティックベクトル調査をスキップします。 |
| `--index`   | ストアが dirty な場合に再インデックスします。`--deep` を含意します。                                                                                                                                                                                                                                                          |
| `--fix`     | 古い recall ロックを修復し、昇格メタデータを正規化します。                                                                                                                                                                                                                                               |
| `--json`    | JSON を出力します。                                                                                                                                                                                                                                                                                               |
| `--verbose` | フェーズごとの詳細ログを出力します。                                                                                                                                                                                                                                                                             |

`dreaming.enabled: true` でも `Dreaming` 行が `off` のままの場合、または
スケジュールされた sweep が実行されていないように見える場合、管理対象の dreaming cron は
調整をトリガーするためにデフォルトエージェントの Heartbeat 発火に依存しています。
スケジュールの詳細は [Dreaming](/ja-JP/concepts/dreaming) を参照してください。

ステータスには、`agents.defaults.memorySearch.extraPaths` からの追加検索パスも一覧表示されます。

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

`status` と同じエージェント単位のスコープです。`--force` はインクリメンタルではなく
完全な再インデックスを実行します。`--verbose` はインデックス作成の進行状況を表示する前に、エージェントごとのプロバイダー、モデル、ソース、
追加パスの詳細を出力します。

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- クエリ: 位置引数 `[query]` または `--query <text>`。両方が設定されている場合は、`--query` が
  優先されます。どちらも設定されていない場合、コマンドはエラーになります。
- `--agent <id>`: デフォルトエージェントを既定にします（エージェントリスト全体ではありません）。
- `--max-results <n>`: 結果数を制限します（正の整数）。
- `--min-score <n>`: このスコア未満の一致を除外します。

## `memory promote`

`memory/YYYY-MM-DD.md` から短期候補をランク付けし、必要に応じて
上位エントリを `MEMORY.md` に追記します。

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| フラグ                       | デフォルト      | 効果                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | 返す/適用する候補の最大数。                                   |
| `--min-score <n>`          | `0.75`       | 重み付き昇格スコアの最小値。                                 |
| `--min-recall-count <n>`   | `3`          | 必要な最小 recall 回数。                                    |
| `--min-unique-queries <n>` | `2`          | 必要な最小の個別クエリ数。                            |
| `--apply`                  | プレビューのみ | 選択した候補を `MEMORY.md` に追記し、昇格済みにします。 |
| `--include-promoted`       |              | 以前のサイクルですでに昇格された候補を含めます。           |
| `--json`                   |              | JSON を出力します。                                                       |

これらの CLI デフォルトは、スケジュールされた dreaming sweep の deep フェーズの
しきい値とは異なります（下の [Dreaming](#dreaming) を参照）。1 回限りの手動実行で
sweep の挙動に合わせるには、明示的なフラグを渡してください。

ランキングシグナル: recall 頻度、取得関連性、クエリ多様性、
時間的な新しさ、日をまたいだ統合、派生概念の豊かさ。これらは
メモリ recall と日次取り込みパスの両方から取得され、さらに繰り返しの dreaming 再訪問に対する light/REM フェーズの
強化ブーストが加わります。書き込み前に、昇格はライブの日次ノートを再読み込みするため、
ランキング後に短期スニペットへ加えられた編集や削除が尊重され、
古いスナップショットから昇格されることはありません。

## `memory promote-explain`

1 つの昇格候補のスコア内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` は、候補のキー（完全一致または部分文字列）、パス、またはスニペット
テキストに一致します。

## `memory rem-harness`

何も書き込まずに、REM の振り返り、候補 truth、deep フェーズの昇格出力を
プレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: ライブワークスペースの代わりに、過去の `YYYY-MM-DD.md`
  日次ファイルからハーネスに seed します。
- `--grounded`: 過去のノートから grounded な `What Happened` / `Reflections` /
  `Possible Lasting Updates` プレビューもレンダリングします。

## `memory rem-backfill`

UI レビュー用に、grounded な過去の REM サマリーを `DREAMS.md` に書き込みます。
元に戻せます。

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: `--rollback`/`--rollback-short-term` が設定されていない限り必須です。
  バックフィル元の過去の日次メモリファイル、またはディレクトリです。
- `--stage-short-term`: grounded な durable 候補もライブの
  短期昇格ストアに seed し、通常の deep フェーズでランク付けできるようにします。
- `--rollback`: 以前に書き込まれた grounded な日記エントリを
  `DREAMS.md` から削除します。
- `--rollback-short-term`: 以前にステージングされた grounded な短期
  候補を削除します。

## Dreaming

Dreaming はバックグラウンドのメモリ統合システムで、3 つの協調
フェーズを 1 つのスケジュールで順番に実行します: **light**（短期
素材の整理/ステージング）、**REM**（振り返りとテーマの表出）、**deep**（durable な
事実を `MEMORY.md` に昇格）。`MEMORY.md` に書き込むのは deep のみです。

- `plugins.entries.memory-core.config.dreaming.enabled: true` で有効化します
  （デフォルトは `false`）。`memory-core` は sweep cron ジョブを自動管理するため、手動で
  `openclaw cron add` する必要はありません。
- チャットから `/dreaming on|off` で切り替えます。`/dreaming status`
  （または `/dreaming`/`/dreaming help`）で確認します。`on`/`off` にはチャンネル所有者ステータス
  または Gateway `operator.admin` が必要です。`status` とヘルプは、コマンドを呼び出せる人なら誰でも
  利用できます。
- 人間が読めるフェーズ出力は `DREAMS.md`（または既存の `dreams.md`）に出力されます。
  デフォルト（`dreaming.storage.mode: "separate"`）では、各フェーズは
  スタンドアロンのレポートも `memory/dreaming/<phase>/YYYY-MM-DD.md` に書き込みます。代わりに日次メモリファイルへレポートを畳み込むには `mode:
"inline"` を設定し、両方に出力するには `"both"` を設定します。
- スケジュール実行と手動の `memory promote` 実行は、同じ deep フェーズの
  ランキングシグナルを共有します。異なるのはデフォルトしきい値のみです（上の表と
  下のスケジュール既定値を比較してください）。
- スケジュール実行は、設定済みのすべてのエージェントのメモリワークスペースにファンアウトします。

スケジュール既定値（`plugins.entries.memory-core.config.dreaming`）:

| キー                                    | デフォルト     |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

完全なキー一覧とフェーズの詳細: [Dreaming](/ja-JP/concepts/dreaming)、
[Memory 設定リファレンス](/ja-JP/reference/memory-config#dreaming)。

## SecretRef Gateway 依存関係

Active Memory のリモート API キーフィールドが SecretRefs として設定されている場合、`memory`
コマンドはアクティブな Gateway スナップショットからそれらを解決します。Gateway が
利用できない場合、コマンドは即座に失敗します。これには
`secrets.resolve` メソッドをサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Memory 概要](/ja-JP/concepts/memory)
