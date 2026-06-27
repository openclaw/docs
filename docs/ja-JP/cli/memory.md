---
read_when:
    - セマンティックメモリのインデックス作成または検索を行いたい
    - メモリの可用性またはインデックス作成をデバッグしている
    - '`MEMORY.md` に呼び出された短期メモリを昇格させたい場合'
summary: '`openclaw memory` の CLI リファレンス (status/index/search/promote/promote-explain/rem-harness)'
title: メモリ
x-i18n:
    generated_at: "2026-06-27T10:56:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

セマンティックメモリーのインデックス作成と検索を管理します。
バンドルされた `memory-core` Plugin によって提供されます。このコマンドは
`plugins.slots.memory` が `memory-core` を選択している場合（デフォルト）に利用できます。他のメモリー Plugin は
それぞれ独自の CLI 名前空間を公開します。

関連:

- メモリーの概念: [メモリー](/ja-JP/concepts/memory)
- メモリー Wiki: [メモリー Wiki](/ja-JP/plugins/memory-wiki)
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

- `--agent <id>`: 単一のエージェントにスコープします。指定しない場合、これらのコマンドは設定済みの各エージェントに対して実行されます。エージェント一覧が設定されていない場合は、デフォルトエージェントにフォールバックします。
- `--verbose`: プローブとインデックス作成中に詳細ログを出力します。

`memory status`:

- `--deep`: ローカルベクターストアの準備状態、埋め込みプロバイダーの準備状態、セマンティックベクター検索の準備状態をプローブします。通常の `memory status` は高速なままで、ライブ埋め込みやプロバイダー探索処理を実行しません。不明なベクターストアまたはセマンティックベクター状態は、そのコマンドではプローブされなかったことを意味します。QMD 字句 `searchMode: "search"` は、`--deep` を指定していてもセマンティックベクタープローブと埋め込みメンテナンスをスキップします。
- `--index`: ストアが dirty の場合に再インデックスを実行します（`--deep` を含意します）。
- `--fix`: 古い recall ロックを修復し、プロモーションメタデータを正規化します。
- `--json`: JSON 出力を表示します。

`memory status` が `Dreaming status: blocked` を表示する場合、管理対象の dreaming cron は有効ですが、それを駆動する heartbeat がデフォルトエージェントに対して発火していません。一般的な 2 つの原因については、[Dreaming がまったく実行されない](/ja-JP/concepts/dreaming#dreaming-never-runs-status-shows-blocked) を参照してください。

`memory index`:

- `--force`: 完全な再インデックスを強制します。

`memory search`:

- クエリ入力: 位置指定の `[query]` または `--query <text>` のどちらかを渡します。
- 両方を指定した場合は、`--query` が優先されます。
- どちらも指定しない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一のエージェントにスコープします（デフォルト: デフォルトエージェント）。
- `--max-results <n>`: 返される結果数を制限します。
- `--min-score <n>`: 低スコアの一致を除外します。
- `--json`: JSON 結果を表示します。

`memory promote`:

短期メモリーのプロモーションをプレビューして適用します。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- プロモーションを `MEMORY.md` に書き込みます（デフォルト: プレビューのみ）。
- `--limit <n>` -- 表示する候補数に上限を設定します。
- `--include-promoted` -- 以前のサイクルですでに昇格済みのエントリを含めます。

全オプション:

- 重み付けされたプロモーションシグナル（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）を使用して、`memory/YYYY-MM-DD.md` から短期候補をランク付けします。
- メモリー recall と日次取り込みパスの両方からの短期シグナルに加え、light/REM フェーズの強化シグナルを使用します。
- Dreaming が有効な場合、`memory-core` はバックグラウンドでフルスイープ（`light -> REM -> deep`）を実行する 1 つの cron ジョブを自動管理します（手動の `openclaw cron add` は不要）。
- `--agent <id>`: 単一のエージェントにスコープします（デフォルト: デフォルトエージェント）。
- `--limit <n>`: 返す/適用する候補の最大数。
- `--min-score <n>`: 最小の重み付きプロモーションスコア。
- `--min-recall-count <n>`: 候補に必要な最小 recall 数。
- `--min-unique-queries <n>`: 候補に必要な最小の個別クエリ数。
- `--apply`: 選択した候補を `MEMORY.md` に追記し、昇格済みとしてマークします。
- `--include-promoted`: すでに昇格済みの候補を出力に含めます。
- `--json`: JSON 出力を表示します。

`memory promote-explain`:

特定のプロモーション候補とそのスコア内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 検索する候補キー、パス断片、またはスニペット断片。
- `--agent <id>`: 単一のエージェントにスコープします（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでに昇格済みの候補を含めます。
- `--json`: JSON 出力を表示します。

`memory rem-harness`:

何も書き込まずに、REM reflections、候補 truths、deep プロモーション出力をプレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 単一のエージェントにスコープします（デフォルト: デフォルトエージェント）。
- `--include-promoted`: すでに昇格済みの deep 候補を含めます。
- `--json`: JSON 出力を表示します。

## Dreaming

Dreaming は、3 つの協調フェーズを持つバックグラウンドメモリー統合システムです:
**light**（短期素材のソート/ステージング）、**deep**（永続的な
事実を `MEMORY.md` に昇格）、**REM**（テーマの振り返りと浮上）。

- `plugins.entries.memory-core.config.dreaming.enabled: true` で有効化します。
- チャットから `/dreaming on|off` で切り替えます（または `/dreaming status` で確認します）。
- Dreaming は 1 つの管理対象スイープスケジュール（`dreaming.frequency`）で実行され、フェーズを light、REM、deep の順に実行します。
- deep フェーズだけが永続メモリーを `MEMORY.md` に書き込みます。
- 人間が読めるフェーズ出力と日記エントリは `DREAMS.md`（または既存の `dreams.md`）に書き込まれ、任意でフェーズごとのレポートが `memory/dreaming/<phase>/YYYY-MM-DD.md` に書き込まれます。
- ランキングは重み付けされたシグナルを使用します: recall 頻度、取得関連性、クエリ多様性、時間的近さ、日をまたぐ統合、派生した概念の豊かさ。
- プロモーションは `MEMORY.md` に書き込む前にライブの日次ノートを再読み込みするため、編集または削除された短期スニペットが古い recall ストアスナップショットから昇格されることはありません。
- スケジュール実行と手動の `memory promote` 実行は、CLI しきい値オーバーライドを渡さない限り、同じ deep フェーズのデフォルトを共有します。
- 自動実行は、設定済みのメモリーワークスペース全体にファンアウトします。

デフォルトのスケジュール:

- **スイープ頻度**: `dreaming.frequency = 0 3 * * *`
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

注記:

- `memory index --verbose` は、フェーズごとの詳細（プロバイダー、モデル、ソース、バッチ活動）を表示します。
- `memory status` には、`memorySearch.extraPaths` で設定された追加パスが含まれます。
- 実質的に有効な Active Memory リモート API キーフィールドが SecretRefs として設定されている場合、コマンドは有効な Gateway スナップショットからそれらの値を解決します。Gateway が利用できない場合、コマンドは即座に失敗します。
- Gateway バージョンスキューに関する注記: このコマンドパスには `secrets.resolve` をサポートする Gateway が必要です。古い Gateway は unknown-method エラーを返します。
- スケジュール済みスイープの頻度は `dreaming.frequency` で調整します。Deep プロモーションポリシーは、それ以外では `dreaming.phases.deep.maxPromotedSnippetTokens` を除き内部的です。この設定は、来歴を見える状態に保ちながら、昇格されるスニペット長を制限します。一回限りの手動しきい値オーバーライドが必要な場合は、`memory promote` の CLI フラグを使用します。
- `memory rem-harness --path <file-or-dir> --grounded` は、何も書き込まずに、履歴の日次ノートから grounded な `What Happened`、`Reflections`、`Possible Lasting Updates` をプレビューします。
- `memory rem-backfill --path <file-or-dir>` は、UI レビュー用に可逆な grounded 日記エントリを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` は、通常の deep フェーズでランク付けできるように、grounded な永続候補もライブの短期プロモーションストアにシードします。
- `memory rem-backfill --rollback` は以前に書き込まれた grounded 日記エントリを削除し、`memory rem-backfill --rollback-short-term` は以前にステージングされた grounded 短期候補を削除します。
- フェーズの完全な説明と設定リファレンスについては、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [メモリー概要](/ja-JP/concepts/memory)
