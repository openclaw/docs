---
read_when:
    - セマンティックメモリをインデックス化または検索したい場合
    - メモリの利用可否やインデックス化をデバッグしている場合
    - 想起された短期メモリを `MEMORY.md` に昇格したい場合
summary: '`openclaw memory` のCLIリファレンス（status/index/search/promote/promote-explain/rem-harness）'
title: メモリ
x-i18n:
    generated_at: "2026-04-24T04:50:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

セマンティックメモリのインデックス化と検索を管理します。
アクティブなメモリPluginによって提供されます（デフォルト: `memory-core`; 無効化するには `plugins.slots.memory = "none"` を設定）。

関連:

- メモリの概念: [Memory](/ja-JP/concepts/memory)
- メモリWiki: [Memory Wiki](/ja-JP/plugins/memory-wiki)
- Wiki CLI: [wiki](/ja-JP/cli/wiki)
- Plugins: [Plugins](/ja-JP/tools/plugin)

## 例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## オプション

`memory status` と `memory index`:

- `--agent <id>`: 単一のagentにスコープします。これを指定しない場合、これらのコマンドは設定済みの各agentに対して実行されます。agent listが設定されていない場合は、デフォルトagentにフォールバックします。
- `--verbose`: プローブおよびインデックス化中に詳細ログを出力します。

`memory status`:

- `--deep`: ベクトル + 埋め込みの利用可否をプローブします。
- `--index`: ストアがdirtyの場合に再インデックスを実行します（`--deep` を含意）。
- `--fix`: 古いrecall lockを修復し、promotionメタデータを正規化します。
- `--json`: JSON出力を表示します。

`memory status` に `Dreaming status: blocked` と表示される場合、管理されたDreaming Cronは有効ですが、それを駆動するHeartbeatがデフォルトagentで発火していません。よくある2つの原因については [Dreaming never runs](/ja-JP/concepts/dreaming#dreaming-never-runs-status-shows-blocked) を参照してください。

`memory index`:

- `--force`: 完全な再インデックスを強制します。

`memory search`:

- クエリ入力: 位置引数 `[query]` または `--query <text>` のいずれかを渡します。
- 両方が指定された場合は、`--query` が優先されます。
- どちらも指定されない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一のagentにスコープします（デフォルト: デフォルトagent）。
- `--max-results <n>`: 返す結果数の上限。
- `--min-score <n>`: 低スコアの一致を除外します。
- `--json`: JSON結果を表示します。

`memory promote`:

短期メモリのpromotionをプレビューして適用します。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotionを `MEMORY.md` に書き込みます（デフォルト: プレビューのみ）。
- `--limit <n>` -- 表示する候補数の上限。
- `--include-promoted` -- 以前のサイクルですでにpromote済みのエントリも含めます。

完全なオプション:

- `memory/YYYY-MM-DD.md` の短期候補を、重み付きpromotionシグナル（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）でランク付けします。
- メモリrecallと日次取り込みパスの両方からの短期シグナルに加え、light/REMフェーズの強化シグナルを使用します。
- Dreamingが有効な場合、`memory-core` はバックグラウンドでフルスイープ（`light -> REM -> deep`）を実行する1つのCronジョブを自動管理します（手動の `openclaw cron add` は不要）。
- `--agent <id>`: 単一のagentにスコープします（デフォルト: デフォルトagent）。
- `--limit <n>`: 返す/適用する候補数の上限。
- `--min-score <n>`: 重み付きpromotion scoreの最小値。
- `--min-recall-count <n>`: 候補に必要な最小recall回数。
- `--min-unique-queries <n>`: 候補に必要な最小の異なるクエリ数。
- `--apply`: 選択した候補を `MEMORY.md` に追記し、promote済みとしてマークします。
- `--include-promoted`: すでにpromote済みの候補も出力に含めます。
- `--json`: JSON出力を表示します。

`memory promote-explain`:

特定のpromotion候補とそのscore内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 候補キー、パス断片、または検索対象のスニペット断片。
- `--agent <id>`: 単一のagentにスコープします（デフォルト: デフォルトagent）。
- `--include-promoted`: すでにpromote済みの候補も含めます。
- `--json`: JSON出力を表示します。

`memory rem-harness`:

何も書き込まずに、REM reflections、候補となるtruths、およびdeep promotion出力をプレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 単一のagentにスコープします（デフォルト: デフォルトagent）。
- `--include-promoted`: すでにpromote済みのdeep候補も含めます。
- `--json`: JSON出力を表示します。

## Dreaming

Dreamingは、3つの協調フェーズを持つバックグラウンドのメモリ統合システムです:
**light**（短期素材の分類/ステージング）、**deep**（永続的な
事実を `MEMORY.md` にpromote）、**REM**（テーマの内省と表出）。

- `plugins.entries.memory-core.config.dreaming.enabled: true` で有効化します。
- チャットから `/dreaming on|off` で切り替えます（または `/dreaming status` で確認）。
- Dreamingは1つの管理されたスイープスケジュール（`dreaming.frequency`）で実行され、フェーズは `light`、`REM`、`deep` の順に実行されます。
- `MEMORY.md` に永続メモリを書き込むのはdeepフェーズだけです。
- 人間が読めるフェーズ出力と日記エントリは `DREAMS.md`（または既存の `dreams.md`）に書き込まれ、任意でフェーズごとのレポートを `memory/dreaming/<phase>/YYYY-MM-DD.md` に書き込みます。
- ランキングは重み付きシグナルを使用します: recall頻度、取得relevance、query diversity、時間的recency、日跨ぎのconsolidation、導出されたconceptual richness。
- Promotionは `MEMORY.md` に書き込む前にライブの日次ノートを再読込するため、編集または削除された短期スニペットが古いrecall-storeスナップショットからpromoteされることはありません。
- スケジュール実行と手動の `memory promote` は、CLIしきい値上書きを渡さない限り、同じdeepフェーズのデフォルトを共有します。
- 自動実行は、設定済みのメモリワークスペース全体にfan outします。

デフォルトスケジューリング:

- **スイープ頻度**: `dreaming.frequency = 0 3 * * *`
- **Deepしきい値**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

例:

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

注:

- `memory index --verbose` はフェーズごとの詳細（provider、model、source、batchアクティビティ）を出力します。
- `memory status` には、`memorySearch.extraPaths` で設定された追加パスも含まれます。
- 実効的にアクティブなメモリのリモートAPIキー fieldsがSecretRefとして設定されている場合、このコマンドはアクティブなgateway snapshotからそれらの値を解決します。gatewayが利用できない場合、このコマンドは即座に失敗します。
- Gatewayバージョン差異に関する注記: このコマンドパスには `secrets.resolve` をサポートするgatewayが必要です。古いgatewayは未知メソッドエラーを返します。
- スケジュールされたスイープ頻度は `dreaming.frequency` で調整します。deep promotionポリシーはそれ以外では内部的なものなので、1回限りの手動上書きが必要な場合は `memory promote` にCLIフラグを使用してください。
- `memory rem-harness --path <file-or-dir> --grounded` は、履歴の日次ノートからグラウンデッドな `What Happened`、`Reflections`、`Possible Lasting Updates` を何も書き込まずにプレビューします。
- `memory rem-backfill --path <file-or-dir>` は、可逆なグラウンデッド日記エントリを `DREAMS.md` に書き込み、UIでレビューできるようにします。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` は、グラウンデッドな永続候補もライブの短期promotionストアに投入し、通常のdeepフェーズでランク付けできるようにします。
- `memory rem-backfill --rollback` は以前に書き込まれたグラウンデッド日記エントリを削除し、`memory rem-backfill --rollback-short-term` は以前にステージングされたグラウンデッド短期候補を削除します。
- 完全なフェーズ説明と設定リファレンスは [Dreaming](/ja-JP/concepts/dreaming) を参照してください。

## 関連

- [CLI reference](/ja-JP/cli)
- [Memory overview](/ja-JP/concepts/memory)
