---
read_when:
    - 意味記憶をインデックス化または検索したい場合
    - メモリの可用性またはインデックス作成をデバッグしている
    - 想起された短期記憶を `MEMORY.md` に昇格させたい
summary: '`openclaw memory` の CLI リファレンス (status/index/search/promote/promote-explain/rem-harness)'
title: メモリ
x-i18n:
    generated_at: "2026-05-06T17:53:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

セマンティックメモリのインデックス作成と検索を管理します。
有効なメモリPluginが提供します（デフォルト: `memory-core`。無効化するには `plugins.slots.memory = "none"` を設定します）。

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

- `--agent <id>`: 単一のエージェントにスコープを限定します。指定しない場合、これらのコマンドは設定済みの各エージェントに対して実行されます。エージェント一覧が設定されていない場合は、デフォルトエージェントにフォールバックします。
- `--verbose`: プローブとインデックス作成中に詳細ログを出力します。

`memory status`:

- `--deep`: ローカルベクターストアの準備状況、埋め込みプロバイダーの準備状況、セマンティックベクター検索の準備状況をプローブします。通常の `memory status` は高速なままで、ライブ埋め込みやプロバイダー検出処理は実行しません。ベクターストアまたはセマンティックベクターの状態が不明である場合、そのコマンドではプローブされなかったことを意味します。QMD 字句 `searchMode: "search"` は、`--deep` を指定していてもセマンティックベクタープローブと埋め込みメンテナンスをスキップします。
- `--index`: ストアがダーティな場合に再インデックスを実行します（`--deep` を含意します）。
- `--fix`: 古いリコールロックを修復し、昇格メタデータを正規化します。
- `--json`: JSON 出力を表示します。

`memory status` に `Dreaming status: blocked` と表示される場合、管理対象の Dreaming Cron は有効ですが、それを駆動する Heartbeat がデフォルトエージェントに対して発火していません。よくある 2 つの原因については、[Dreaming never runs](/ja-JP/concepts/dreaming#dreaming-never-runs-status-shows-blocked) を参照してください。

`memory index`:

- `--force`: 完全な再インデックスを強制します。

`memory search`:

- クエリ入力: 位置引数 `[query]` または `--query <text>` のいずれかを渡します。
- 両方を指定した場合は、`--query` が優先されます。
- どちらも指定しない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--max-results <n>`: 返される結果数を制限します。
- `--min-score <n>`: スコアの低い一致を除外します。
- `--json`: JSON 結果を表示します。

`memory promote`:

短期メモリの昇格をプレビューして適用します。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 昇格を `MEMORY.md` に書き込みます（デフォルト: プレビューのみ）。
- `--limit <n>` -- 表示する候補数に上限を設定します。
- `--include-promoted` -- 前回までのサイクルですでに昇格済みのエントリを含めます。

すべてのオプション:

- 重み付けされた昇格シグナル（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）を使用して、`memory/YYYY-MM-DD.md` の短期候補をランク付けします。
- メモリリコールと日次取り込みパスの両方からの短期シグナルに加え、light/REM フェーズの強化シグナルを使用します。
- Dreaming が有効な場合、`memory-core` はバックグラウンドで完全なスイープ（`light -> REM -> deep`）を実行する 1 つの Cron ジョブを自動管理します（手動の `openclaw cron add` は不要です）。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--limit <n>`: 返す/適用する候補の最大数。
- `--min-score <n>`: 重み付けされた昇格スコアの最小値。
- `--min-recall-count <n>`: 候補に必要な最小リコール回数。
- `--min-unique-queries <n>`: 候補に必要な個別クエリ数の最小値。
- `--apply`: 選択した候補を `MEMORY.md` に追記し、昇格済みとしてマークします。
- `--include-promoted`: すでに昇格済みの候補を出力に含めます。
- `--json`: JSON 出力を表示します。

`memory promote-explain`:

特定の昇格候補と、そのスコア内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 検索する候補キー、パス断片、またはスニペット断片。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでに昇格済みの候補を含めます。
- `--json`: JSON 出力を表示します。

`memory rem-harness`:

何も書き込まずに、REM のリフレクション、候補となる真実、deep 昇格の出力をプレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでに昇格済みの deep 候補を含めます。
- `--json`: JSON 出力を表示します。

## Dreaming

Dreaming は、3 つの協調フェーズを持つバックグラウンドのメモリ統合システムです。**light**（短期素材の分類/ステージング）、**deep**（永続的な事実を `MEMORY.md` に昇格）、**REM**（振り返りとテーマの表出）です。

- `plugins.entries.memory-core.config.dreaming.enabled: true` で有効化します。
- チャットから `/dreaming on|off` で切り替えます（または `/dreaming status` で確認します）。
- Dreaming は 1 つの管理対象スイープスケジュール（`dreaming.frequency`）で実行され、light、REM、deep の順にフェーズを実行します。
- deep フェーズのみが永続メモリを `MEMORY.md` に書き込みます。
- 人間が読めるフェーズ出力と日記エントリは `DREAMS.md`（または既存の `dreams.md`）に書き込まれ、任意でフェーズごとのレポートが `memory/dreaming/<phase>/YYYY-MM-DD.md` に書き込まれます。
- ランキングは重み付けされたシグナルを使用します。リコール頻度、取得関連性、クエリ多様性、時間的な新しさ、日をまたいだ統合、派生した概念の豊かさです。
- 昇格は `MEMORY.md` に書き込む前にライブの日次ノートを再読み込みするため、編集または削除された短期スニペットが古いリコールストアのスナップショットから昇格されることはありません。
- スケジュール実行と手動の `memory promote` 実行は、CLI でしきい値の上書きを渡さない限り、同じ deep フェーズのデフォルトを共有します。
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

注:

- `memory index --verbose` はフェーズごとの詳細（プロバイダー、モデル、ソース、バッチ処理）を出力します。
- `memory status` には、`memorySearch.extraPaths` で設定された追加パスが含まれます。
- 実質的に有効なメモリのリモート API キーフィールドが SecretRefs として設定されている場合、このコマンドは有効な Gateway スナップショットからそれらの値を解決します。Gateway が利用できない場合、コマンドは即座に失敗します。
- Gateway バージョン不一致の注記: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- スケジュールされたスイープ間隔は `dreaming.frequency` で調整します。deep 昇格ポリシーはそれ以外では内部的に管理されます。一回限りの手動上書きが必要な場合は、`memory promote` で CLI フラグを使用してください。
- `memory rem-harness --path <file-or-dir> --grounded` は、何も書き込まずに、履歴の日次ノートから根拠付きの `What Happened`、`Reflections`、`Possible Lasting Updates` をプレビューします。
- `memory rem-backfill --path <file-or-dir>` は、UI レビュー用に可逆的な根拠付き日記エントリを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` は、通常の deep フェーズがランク付けできるように、根拠付きの永続候補もライブの短期昇格ストアにシードします。
- `memory rem-backfill --rollback` は以前に書き込まれた根拠付き日記エントリを削除し、`memory rem-backfill --rollback-short-term` は以前にステージングされた根拠付き短期候補を削除します。
- すべてのフェーズ説明と設定リファレンスについては、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [メモリの概要](/ja-JP/concepts/memory)
