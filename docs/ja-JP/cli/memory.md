---
read_when:
    - セマンティックメモリをインデックス化または検索したい
    - メモリの可用性またはインデックス作成をデバッグしている場合
    - 呼び出された短期記憶を `MEMORY.md` に昇格させたい場合
summary: '`openclaw memory` の CLI リファレンス (status/index/search/promote/promote-explain/rem-harness)'
title: メモリ
x-i18n:
    generated_at: "2026-04-30T05:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

セマンティックメモリのインデックス作成と検索を管理します。
アクティブメモリ Plugin によって提供されます（デフォルト: `memory-core`。無効にするには `plugins.slots.memory = "none"` を設定します）。

関連:

- メモリの概念: [メモリ](/ja-JP/concepts/memory)
- メモリ Wiki: [メモリ Wiki](/ja-JP/plugins/memory-wiki)
- Wiki CLI: [wiki](/ja-JP/cli/wiki)
- Plugin: [Plugin](/ja-JP/tools/plugin)

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

- `--agent <id>`: 単一のエージェントにスコープを限定します。指定しない場合、これらのコマンドは設定済みの各エージェントに対して実行されます。エージェントリストが設定されていない場合は、デフォルトエージェントにフォールバックします。
- `--verbose`: プローブとインデックス作成中に詳細ログを出力します。

`memory status`:

- `--deep`: ベクトルと埋め込みの可用性をプローブします。通常の `memory status` は高速のままで、ライブ埋め込み ping は実行しません。QMD 字句 `searchMode: "search"` は、`--deep` を指定していてもセマンティックベクトルプローブと埋め込みメンテナンスをスキップします。
- `--index`: ストアが dirty な場合に再インデックスを実行します（`--deep` を含意します）。
- `--fix`: 古いリコールロックを修復し、プロモーションメタデータを正規化します。
- `--json`: JSON 出力を表示します。

`memory status` に `Dreaming status: blocked` と表示される場合、管理対象の Dreaming Cron は有効ですが、それを駆動する Heartbeat がデフォルトエージェントで発火していません。よくある 2 つの原因については、[Dreaming が実行されない](/ja-JP/concepts/dreaming#dreaming-never-runs-status-shows-blocked)を参照してください。

`memory index`:

- `--force`: フル再インデックスを強制します。

`memory search`:

- クエリ入力: 位置引数 `[query]` または `--query <text>` のいずれかを渡します。
- 両方が指定された場合、`--query` が優先されます。
- どちらも指定されていない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--max-results <n>`: 返される結果数を制限します。
- `--min-score <n>`: 低スコアの一致を除外します。
- `--json`: JSON 結果を表示します。

`memory promote`:

短期メモリのプロモーションをプレビューして適用します。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- プロモーションを `MEMORY.md` に書き込みます（デフォルト: プレビューのみ）。
- `--limit <n>` -- 表示される候補数を制限します。
- `--include-promoted` -- 以前のサイクルですでにプロモート済みのエントリを含めます。

全オプション:

- 重み付きプロモーションシグナル（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）を使って、`memory/YYYY-MM-DD.md` の短期候補をランク付けします。
- メモリリコールと日次取り込みパスの両方からの短期シグナルに加え、light/REM フェーズの強化シグナルを使用します。
- Dreaming が有効な場合、`memory-core` はバックグラウンドでフルスイープ（`light -> REM -> deep`）を実行する Cron ジョブを 1 つ自動管理します（手動の `openclaw cron add` は不要です）。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--limit <n>`: 返す、または適用する候補の最大数。
- `--min-score <n>`: 重み付きプロモーションスコアの最小値。
- `--min-recall-count <n>`: 候補に必要な最小リコール数。
- `--min-unique-queries <n>`: 候補に必要な最小の個別クエリ数。
- `--apply`: 選択した候補を `MEMORY.md` に追記し、プロモート済みとしてマークします。
- `--include-promoted`: すでにプロモート済みの候補を出力に含めます。
- `--json`: JSON 出力を表示します。

`memory promote-explain`:

特定のプロモーション候補と、そのスコア内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 検索する候補キー、パス断片、またはスニペット断片。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでにプロモート済みの候補を含めます。
- `--json`: JSON 出力を表示します。

`memory rem-harness`:

何も書き込まずに、REM の振り返り、候補となる真実、deep プロモーション出力をプレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでにプロモート済みの deep 候補を含めます。
- `--json`: JSON 出力を表示します。

## Dreaming

Dreaming は、3 つの協調フェーズを持つバックグラウンドのメモリ統合システムです: **light**（短期素材の並べ替えとステージング）、**deep**（永続的な事実を `MEMORY.md` にプロモート）、**REM**（振り返りとテーマの浮上）。

- `plugins.entries.memory-core.config.dreaming.enabled: true` で有効化します。
- チャットから `/dreaming on|off` で切り替えます（または `/dreaming status` で確認します）。
- Dreaming は 1 つの管理対象スイープスケジュール（`dreaming.frequency`）で実行され、light、REM、deep の順にフェーズを実行します。
- durable メモリを `MEMORY.md` に書き込むのは deep フェーズだけです。
- 人間が読めるフェーズ出力と日記エントリは `DREAMS.md`（または既存の `dreams.md`）に書き込まれ、必要に応じてフェーズごとのレポートが `memory/dreaming/<phase>/YYYY-MM-DD.md` に書き込まれます。
- ランキングは重み付きシグナルを使用します: リコール頻度、取得関連度、クエリ多様性、時間的な新しさ、日をまたいだ統合、派生概念の豊かさ。
- プロモーションは `MEMORY.md` に書き込む前にライブの日次ノートを再読み込みするため、編集または削除された短期スニペットが古いリコールストアのスナップショットからプロモートされることはありません。
- スケジュール実行と手動の `memory promote` 実行は、CLI しきい値オーバーライドを渡さない限り、同じ deep フェーズのデフォルトを共有します。
- 自動実行は、設定済みのメモリワークスペース全体にファンアウトします。

デフォルトのスケジュール:

- **スイープ間隔**: `dreaming.frequency = 0 3 * * *`
- **deep しきい値**: `minScore=0.8`、`minRecallCount=3`、`minUniqueQueries=3`、`recencyHalfLifeDays=14`、`maxAgeDays=30`

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

注記:

- `memory index --verbose` はフェーズごとの詳細（プロバイダー、モデル、ソース、バッチアクティビティ）を表示します。
- `memory status` には、`memorySearch.extraPaths` で設定された追加パスが含まれます。
- 実質的に有効なアクティブメモリのリモート API キーフィールドが SecretRefs として設定されている場合、コマンドはアクティブな Gateway スナップショットからそれらの値を解決します。Gateway が利用できない場合、コマンドは速やかに失敗します。
- Gateway バージョンスキューの注記: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- スケジュールされたスイープ間隔は `dreaming.frequency` で調整します。deep プロモーションポリシーはそれ以外は内部管理です。一回限りの手動オーバーライドが必要な場合は、`memory promote` の CLI フラグを使用してください。
- `memory rem-harness --path <file-or-dir> --grounded` は、何も書き込まずに、過去の日次ノートから根拠付きの `What Happened`、`Reflections`、`Possible Lasting Updates` をプレビューします。
- `memory rem-backfill --path <file-or-dir>` は、UI レビュー用に可逆な根拠付き日記エントリを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` は、通常の deep フェーズがランク付けできるように、根拠付きの durable 候補もライブの短期プロモーションストアに投入します。
- `memory rem-backfill --rollback` は以前に書き込まれた根拠付き日記エントリを削除し、`memory rem-backfill --rollback-short-term` は以前にステージングされた根拠付き短期候補を削除します。
- 完全なフェーズ説明と設定リファレンスについては、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [メモリ概要](/ja-JP/concepts/memory)
