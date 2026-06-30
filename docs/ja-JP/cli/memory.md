---
read_when:
    - セマンティックメモリのインデックス作成または検索を行いたい
    - メモリ可用性またはインデックス作成をデバッグしている
    - 再呼び出しされた短期記憶を `MEMORY.md` に昇格させたい場合
summary: '`openclaw memory` のCLIリファレンス（status/index/search/promote/promote-explain/rem-harness）'
title: メモリ
x-i18n:
    generated_at: "2026-06-30T13:47:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

セマンティックメモリのインデックス作成と検索を管理します。
バンドルされた `memory-core` Plugin によって提供されます。このコマンドは
`plugins.slots.memory` が `memory-core` を選択している場合（デフォルト）に利用できます。他のメモリ Plugin は
独自の CLI 名前空間を公開します。

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

- `--agent <id>`: 単一のエージェントにスコープを限定します。指定しない場合、これらのコマンドは構成済みの各エージェントに対して実行されます。エージェントリストが構成されていない場合は、デフォルトエージェントにフォールバックします。
- `--verbose`: プローブとインデックス作成中に詳細ログを出力します。

`memory status`:

- `--deep`: ローカルベクトルストアの準備状態、埋め込みプロバイダーの準備状態、セマンティックベクトル検索の準備状態をプローブします。通常の `memory status` は高速に保たれ、ライブ埋め込みやプロバイダー検出処理を実行しません。不明なベクトルストア状態またはセマンティックベクトル状態は、そのコマンドでプローブされなかったことを意味します。QMD の字句 `searchMode: "search"` は、`--deep` を指定していてもセマンティックベクトルプローブと埋め込みメンテナンスをスキップします。
- `--index`: ストアが dirty の場合に再インデックスを実行します（`--deep` を含意します）。
- `--fix`: 古いリコールロックを修復し、プロモーションメタデータを正規化します。
- `--json`: JSON 出力を表示します。

`memory status` に `Dreaming status: blocked` と表示される場合、管理対象の Dreaming Cron は有効ですが、それを駆動する Heartbeat がデフォルトエージェントで発火していません。一般的な 2 つの原因については、[Dreaming が実行されない](/ja-JP/concepts/dreaming#dreaming-never-runs-status-shows-blocked)を参照してください。

`memory index`:

- `--force`: 完全な再インデックスを強制します。

`memory search`:

- クエリ入力: 位置引数 `[query]` または `--query <text>` のどちらかを渡します。
- 両方が指定された場合、`--query` が優先されます。
- どちらも指定されない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--max-results <n>`: 返す結果数を制限します。
- `--min-score <n>`: 低スコアの一致を除外します。
- `--json`: JSON 結果を表示します。

`memory promote`:

短期メモリのプロモーションをプレビューして適用します。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- プロモーションを `MEMORY.md` に書き込みます（デフォルト: プレビューのみ）。
- `--limit <n>` -- 表示する候補数の上限を設定します。
- `--include-promoted` -- 以前のサイクルですでにプロモートされたエントリを含めます。

全オプション:

- 加重プロモーションシグナル（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）を使用して、`memory/YYYY-MM-DD.md` から短期候補をランク付けします。
- メモリリコールと日次取り込みパスの両方からの短期シグナルに加え、light/REM フェーズの強化シグナルを使用します。
- Dreaming が有効な場合、`memory-core` はバックグラウンドで完全スイープ（`light -> REM -> deep`）を実行する 1 つの Cron ジョブを自動管理します（手動の `openclaw cron add` は不要です）。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--limit <n>`: 返す/適用する候補の最大数。
- `--min-score <n>`: 最小の加重プロモーションスコア。
- `--min-recall-count <n>`: 候補に必要な最小リコール回数。
- `--min-unique-queries <n>`: 候補に必要な最小の distinct クエリ数。
- `--apply`: 選択された候補を `MEMORY.md` に追記し、プロモート済みとしてマークします。
- `--include-promoted`: すでにプロモートされた候補を出力に含めます。
- `--json`: JSON 出力を表示します。

`memory promote-explain`:

特定のプロモーション候補と、そのスコア内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 検索する候補キー、パス断片、またはスニペット断片。
- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでにプロモートされた候補を含めます。
- `--json`: JSON 出力を表示します。

`memory rem-harness`:

何も書き込まずに、REM の内省、候補 truth、deep プロモーション出力をプレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 単一のエージェントにスコープを限定します（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでにプロモートされた deep 候補を含めます。
- `--json`: JSON 出力を表示します。

## Dreaming

Dreaming は、3 つの協調フェーズを持つバックグラウンドメモリ統合システムです:
**light**（短期素材を整理/ステージング）、**deep**（永続的な
fact を `MEMORY.md` にプロモート）、**REM**（内省してテーマを表面化）。

- `plugins.entries.memory-core.config.dreaming.enabled: true` で有効化します。
- チャットから `/dreaming on|off` で切り替えます（または `/dreaming status` で確認します）。
  チャンネル呼び出し元が設定を変更するには owner である必要があります。Gateway クライアントには
  `operator.admin` が必要です。読み取り専用のステータスとヘルプは、認可された
  コマンド送信者が引き続き利用できます。
- Dreaming は 1 つの管理対象スイープスケジュール（`dreaming.frequency`）で実行され、フェーズを light、REM、deep の順に実行します。
- deep フェーズだけが永続メモリを `MEMORY.md` に書き込みます。
- 人間が読めるフェーズ出力と日記エントリは `DREAMS.md`（または既存の `dreams.md`）に書き込まれ、任意でフェーズごとのレポートが `memory/dreaming/<phase>/YYYY-MM-DD.md` に書き込まれます。
- ランキングには、リコール頻度、取得関連性、クエリ多様性、時間的な新しさ、日をまたぐ統合、派生概念の豊かさという加重シグナルを使用します。
- プロモーションは `MEMORY.md` に書き込む前にライブの日次ノートを再読み込みするため、編集または削除された短期スニペットが古いリコールストアのスナップショットからプロモートされることはありません。
- スケジュール実行と手動の `memory promote` 実行は、CLI しきい値オーバーライドを渡さない限り、同じ deep フェーズのデフォルトを共有します。
- 自動実行は、構成済みのメモリワークスペース全体にファンアウトします。

デフォルトのスケジュール:

- **スイープ間隔**: `dreaming.frequency = 0 3 * * *`
- **Deep しきい値**: `minScore=0.8`、`minRecallCount=3`、`minUniqueQueries=3`、`recencyHalfLifeDays=14`、`maxAgeDays=30`

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

メモ:

- `memory index --verbose` は、フェーズごとの詳細（プロバイダー、モデル、ソース、バッチ活動）を表示します。
- `memory status` には、`memorySearch.extraPaths` 経由で構成された追加パスが含まれます。
- 実質的に有効な Active Memory リモート API キーフィールドが SecretRef として構成されている場合、コマンドはアクティブな Gateway スナップショットからそれらの値を解決します。Gateway が利用できない場合、コマンドは即座に失敗します。
- Gateway バージョンずれの注意: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- スケジュールされたスイープ間隔は `dreaming.frequency` で調整します。deep プロモーションポリシーは、それ以外では内部扱いです。ただし `dreaming.phases.deep.maxPromotedSnippetTokens` は例外で、provenance を見える状態に保ちながらプロモートされるスニペット長を制限します。一回限りの手動しきい値オーバーライドが必要な場合は、`memory promote` の CLI フラグを使用してください。
- `memory rem-harness --path <file-or-dir> --grounded` は、何も書き込まずに、過去の日次ノートから grounded な `What Happened`、`Reflections`、`Possible Lasting Updates` をプレビューします。
- `memory rem-backfill --path <file-or-dir>` は、UI レビュー用に reversible な grounded 日記エントリを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` は、grounded な永続候補もライブの短期プロモーションストアにシードし、通常の deep フェーズがそれらをランク付けできるようにします。
- `memory rem-backfill --rollback` は以前に書き込まれた grounded 日記エントリを削除し、`memory rem-backfill --rollback-short-term` は以前にステージングされた grounded 短期候補を削除します。
- 完全なフェーズ説明と構成リファレンスについては、[Dreaming](/ja-JP/concepts/dreaming)を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [メモリ概要](/ja-JP/concepts/memory)
