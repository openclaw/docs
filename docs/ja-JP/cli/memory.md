---
read_when:
    - セマンティックメモリのインデックス作成または検索を行いたい場合
    - メモリの可用性またはインデックス作成をデバッグしている場合
    - 想起した短期記憶を `MEMORY.md` に昇格させたい場合
summary: '`openclaw memory` のCLIリファレンス（status/index/search/promote/promote-explain/rem-harness/rem-backfill）'
title: メモリ
x-i18n:
    generated_at: "2026-07-11T22:06:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

セマンティックメモリのインデックス作成、検索、および `MEMORY.md` への昇格を管理します。
バンドルされた `memory-core` Plugin によって提供され、`plugins.slots.memory` で
`memory-core`（デフォルト）が選択されている場合に使用できます。他のメモリ
Plugin は、それぞれ独自の CLI 名前空間を公開します。

関連項目: [メモリ](/ja-JP/concepts/memory)の概念、[Dreaming](/ja-JP/concepts/dreaming)、
[メモリ設定リファレンス](/ja-JP/reference/memory-config)、[メモリ Wiki](/ja-JP/plugins/memory-wiki)、
[Wiki](/ja-JP/cli/wiki)、[Plugin](/ja-JP/tools/plugin)。

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

`--agent` を指定しない場合、`agents.list` 内のすべてのエージェントに対して実行します。
エージェントリストが設定されていない場合は、デフォルトのエージェントにフォールバックします。

| フラグ      | 効果                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | ベクトルストア、埋め込みプロバイダー、セマンティック検索の準備状態を調査します（追加のプロバイダー呼び出しを伴います）。通常の `memory status` は高速なままで、この調査を省略します。ベクトル／セマンティック状態が不明な場合は、調査されていないことを意味します。QMD の字句検索 `searchMode: "search"` では、`--deep` を指定しても常にセマンティックベクトルの調査を省略します。 |
| `--index`   | ストアがダーティな場合に再インデックスします。`--deep` も暗黙的に有効になります。                                                                                                                                                                                                                                                                                    |
| `--fix`     | 古いリコールロックを修復し、昇格メタデータを正規化します。                                                                                                                                                                                                                                                                                                          |
| `--json`    | JSON を出力します。                                                                                                                                                                                                                                                                                                                                                  |
| `--verbose` | フェーズごとの詳細なログを出力します。                                                                                                                                                                                                                                                                                                                              |

`dreaming.enabled: true` にしても `Dreaming` 行が `off` のままである場合、または
スケジュールされたスイープがまったく実行されていないように見える場合、管理対象の Dreaming Cron は、
調整処理をトリガーするためにデフォルトエージェントの Heartbeat が発火することに依存しています。
スケジュールの詳細については、[Dreaming](/ja-JP/concepts/dreaming)を参照してください。

ステータスには、`agents.defaults.memorySearch.extraPaths` の追加検索パスも表示されます。

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

エージェントごとのスコープは `status` と同じです。`--force` は差分再インデックスではなく、
完全な再インデックスを実行します。`--verbose` は、インデックス作成の進行状況を表示する前に、
エージェントごとのプロバイダー、モデル、ソース、追加パスの詳細を出力します。

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- クエリ: 位置引数 `[query]` または `--query <text>`。両方が設定されている場合は `--query`
  が優先されます。どちらも設定されていない場合、コマンドはエラーになります。
- `--agent <id>`: デフォルトはデフォルトのエージェントです（エージェントリスト全体ではありません）。
- `--max-results <n>`: 結果数を制限します（正の整数）。
- `--min-score <n>`: このスコアを下回る一致を除外します。

## `memory promote`

`memory/YYYY-MM-DD.md` の短期候補をランク付けし、必要に応じて上位のエントリを
`MEMORY.md` に追加します。

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| フラグ                     | デフォルト       | 効果                                                       |
| -------------------------- | ---------------- | ---------------------------------------------------------- |
| `--limit <n>`              |                  | 返却／適用する候補の最大数。                               |
| `--min-score <n>`          | `0.75`           | 重み付き昇格スコアの最小値。                               |
| `--min-recall-count <n>`   | `3`              | 必要な最小リコール回数。                                   |
| `--min-unique-queries <n>` | `2`              | 必要な異なるクエリの最小数。                               |
| `--apply`                  | プレビューのみ   | 選択した候補を `MEMORY.md` に追加し、昇格済みとマークする。 |
| `--include-promoted`       |                  | 前回までのサイクルですでに昇格された候補を含める。         |
| `--json`                   |                  | JSON を出力する。                                          |

これらの CLI デフォルトは、スケジュールされた Dreaming スイープのディープフェーズの
しきい値とは異なります（後述の [Dreaming](#dreaming) を参照）。単発の手動実行で
スイープの動作と一致させるには、フラグを明示的に指定してください。

ランク付けのシグナルには、リコール頻度、取得関連度、クエリの多様性、時間的な新しさ、
日をまたいだ統合、派生概念の豊富さが含まれます。これらはメモリのリコールと日次取り込み処理の
両方から得られ、さらに Dreaming で繰り返し再検討された項目には、ライト／REM フェーズによる
軽度の強化ブーストが加わります。書き込み前に、昇格処理は現在の日次ノートを再読み込みするため、
ランク付け後に短期スニペットが編集または削除されていても、古いスナップショットから昇格せず、
その変更が反映されます。

## `memory promote-explain`

1 つの昇格候補について、スコアの内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` は、候補のキー（完全一致または部分文字列）、パス、またはスニペットの
テキストに一致します。

## `memory rem-harness`

何も書き込まずに、REM の振り返り、真実の候補、ディープフェーズの昇格出力を
プレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: 現在のワークスペースではなく、過去の `YYYY-MM-DD.md`
  日次ファイルを使用してハーネスを初期化します。
- `--grounded`: 過去のノートに基づき、根拠のある「起きたこと」／「振り返り」／
  「永続化される可能性のある更新」のプレビューも生成します。

## `memory rem-backfill`

UI で確認できるように、根拠のある過去の REM サマリーを `DREAMS.md` に書き込みます。
元に戻すことができます。

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: `--rollback`／`--rollback-short-term` が設定されていない場合は必須です。
  バックフィル元となる過去の日次メモリファイルまたはディレクトリです。
- `--stage-short-term`: 根拠のある永続化候補を現在の短期昇格ストアにも投入し、通常の
  ディープフェーズでランク付けできるようにします。
- `--rollback`: 以前 `DREAMS.md` に書き込まれた、根拠のある日記エントリを削除します。
- `--rollback-short-term`: 以前ステージングされた、根拠のある短期候補を削除します。

## Dreaming

Dreaming は、1 つのスケジュールで順番に実行される 3 つの協調フェーズからなる、
バックグラウンドのメモリ統合システムです。**ライト**（短期素材の整理／ステージング）、
**REM**（振り返りとテーマの抽出）、**ディープ**（永続的な事実を `MEMORY.md` に昇格）で
構成されます。`MEMORY.md` に書き込むのはディープフェーズだけです。

- `plugins.entries.memory-core.config.dreaming.enabled: true`（デフォルトは `false`）で有効にします。
  `memory-core` がスイープの Cron ジョブを自動管理するため、手動で
  `openclaw cron add` を実行する必要はありません。
- チャットでは `/dreaming on|off` で切り替え、`/dreaming status`
  （または `/dreaming`／`/dreaming help`）で確認します。`on`／`off` にはチャンネル所有者の
  ステータスまたは Gateway の `operator.admin` が必要です。`status` とヘルプは、
  コマンドを呼び出せるすべてのユーザーが引き続き利用できます。
- 人が読めるフェーズ出力は `DREAMS.md`（または既存の `dreams.md`）に保存されます。
  デフォルト（`dreaming.storage.mode: "separate"`）では、各フェーズは個別のレポートも
  `memory/dreaming/<phase>/YYYY-MM-DD.md` に書き込みます。代わりに日次メモリファイルへ
  レポートを組み込むには `mode: "inline"` を設定し、両方に保存するには `"both"` を設定します。
- スケジュール実行と手動の `memory promote` 実行では、同じディープフェーズの
  ランク付けシグナルを共有します。異なるのはデフォルトのしきい値だけです
  （上の表と下記のスケジュール実行のデフォルトを参照）。
- スケジュール実行は、設定されているすべてのエージェントのメモリワークスペースに
  展開されます。

スケジュール実行のデフォルト（`plugins.entries.memory-core.config.dreaming`）:

| キー                                   | デフォルト  |
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

すべてのキーとフェーズの詳細: [Dreaming](/ja-JP/concepts/dreaming)、
[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming)。

## SecretRef の Gateway 依存関係

Active Memory のリモート API キーフィールドが SecretRef として設定されている場合、
`memory` コマンドはアクティブな Gateway スナップショットからそれらを解決します。
Gateway が利用できない場合、コマンドは即座に失敗します。これには `secrets.resolve`
メソッドをサポートする Gateway が必要です。古い Gateway では、不明なメソッドの
エラーが返されます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [メモリの概要](/ja-JP/concepts/memory)
