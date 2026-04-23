---
read_when:
    - セマンティックメモリをインデックス化または検索したい。
    - メモリの可用性またはインデックス化をデバッグしている。
    - 想起された短期メモリを `MEMORY.md` に昇格したい。
summary: '`openclaw memory` のCLIリファレンス（status/index/search/promote/promote-explain/rem-harness）'
title: memory
x-i18n:
    generated_at: "2026-04-23T14:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

セマンティックメモリのインデックス化と検索を管理します。
アクティブなmemory Pluginによって提供されます（デフォルト: `memory-core`; 無効にするには `plugins.slots.memory = "none"` を設定）。

関連:

- メモリの概念: [Memory](/ja-JP/concepts/memory)
- メモリwiki: [Memory Wiki](/ja-JP/plugins/memory-wiki)
- wiki CLI: [wiki](/ja-JP/cli/wiki)
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

- `--agent <id>`: 単一のagentにスコープを限定します。これを指定しない場合、これらのコマンドは設定済みの各agentに対して実行されます。agentリストが設定されていない場合は、デフォルトagentにフォールバックします。
- `--verbose`: probeとインデックス化の間に詳細ログを出力します。

`memory status`:

- `--deep`: ベクター + 埋め込みの可用性をprobeします。
- `--index`: storeがdirtyであれば再インデックス化を実行します（`--deep` を含意）。
- `--fix`: 古いrecall lockを修復し、promote metadataを正規化します。
- `--json`: JSON出力を表示します。

`memory status` で `Dreaming status: blocked` と表示される場合、managed dreaming Cronは有効ですが、それを駆動するHeartbeatがデフォルトagentに対して発火していません。よくある2つの原因については、[Dreaming never runs](/ja-JP/concepts/dreaming#dreaming-never-runs-status-shows-blocked) を参照してください。

`memory index`:

- `--force`: 完全な再インデックス化を強制します。

`memory search`:

- クエリ入力: 位置引数の `[query]` または `--query <text>` のいずれかを渡します。
- 両方が指定された場合は、`--query` が優先されます。
- どちらも指定されていない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一のagentにスコープを限定します（デフォルト: デフォルトagent）。
- `--max-results <n>`: 返される結果数を制限します。
- `--min-score <n>`: 低スコアの一致を除外します。
- `--json`: JSON結果を表示します。

`memory promote`:

短期メモリのpromoteをプレビューして適用します。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promoteを `MEMORY.md` に書き込みます（デフォルト: プレビューのみ）。
- `--limit <n>` -- 表示する候補数の上限を設定します。
- `--include-promoted` -- 以前のサイクルですでにpromoteされたエントリーを含めます。

完全なオプション:

- `frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness` の重み付きpromoteシグナルを使って、`memory/YYYY-MM-DD.md` の短期候補を順位付けします。
- memory recallsとdaily-ingestion passの両方からの短期シグナルに加え、light/REM phaseの強化シグナルを使います。
- dreamingが有効な場合、`memory-core` はバックグラウンドで完全スイープ（`light -> REM -> deep`）を実行する1つのCronジョブを自動管理します（手動の `openclaw cron add` は不要）。
- `--agent <id>`: 単一のagentにスコープを限定します（デフォルト: デフォルトagent）。
- `--limit <n>`: 返す/適用する候補数の上限。
- `--min-score <n>`: 重み付きpromoteスコアの最小値。
- `--min-recall-count <n>`: 候補に必要な最小recall回数。
- `--min-unique-queries <n>`: 候補に必要な最小の異なるクエリ数。
- `--apply`: 選択した候補を `MEMORY.md` に追記し、promotedとしてマークします。
- `--include-promoted`: すでにpromote済みの候補を出力に含めます。
- `--json`: JSON出力を表示します。

`memory promote-explain`:

特定のpromote候補とそのスコア内訳を説明します。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 候補キー、パス断片、または検索対象のスニペット断片。
- `--agent <id>`: 単一のagentにスコープを限定します（デフォルト: デフォルトagent）。
- `--include-promoted`: すでにpromote済みの候補を含めます。
- `--json`: JSON出力を表示します。

`memory rem-harness`:

何も書き込まずに、REM reflections、candidate truths、deep promote出力をプレビューします。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 単一のagentにスコープを限定します（デフォルト: デフォルトagent）。
- `--include-promoted`: すでにpromote済みのdeep候補を含めます。
- `--json`: JSON出力を表示します。

## Dreaming

Dreamingは、3つの協調フェーズを持つバックグラウンドメモリ統合システムです:
**light**（短期素材の分類/ステージング）、**deep**（永続的な
事実を `MEMORY.md` にpromote）、**REM**（振り返りとテーマの抽出）です。

- `plugins.entries.memory-core.config.dreaming.enabled: true` で有効化します。
- チャットから `/dreaming on|off` で切り替えます（または `/dreaming status` で確認）。
- Dreamingは1つのmanaged sweep schedule（`dreaming.frequency`）で実行され、フェーズを順に実行します: light、REM、deep。
- 永続メモリを `MEMORY.md` に書き込むのはdeep phaseだけです。
- 人が読めるphase出力とdiary entriesは `DREAMS.md`（または既存の `dreams.md`）に書き込まれ、任意でphaseごとのレポートが `memory/dreaming/<phase>/YYYY-MM-DD.md` に出力されます。
- 順位付けでは、recall頻度、取得関連性、クエリ多様性、時間的再近性、日をまたぐ統合、および導出された概念の豊かさの重み付きシグナルを使います。
- Promoteでは、`MEMORY.md` に書き込む前にライブの日次ノートを再読み込みするため、編集または削除された短期スニペットが古いrecall-storeスナップショットからpromoteされることはありません。
- スケジュール実行と手動の `memory promote` 実行は、CLIしきい値overrideを渡さない限り、同じdeep phaseデフォルトを共有します。
- 自動実行は設定済みのmemory workspace全体にfan outします。

デフォルトスケジュール:

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

注記:

- `memory index --verbose` はphaseごとの詳細（provider、model、sources、batch activity）を表示します。
- `memory status` には `memorySearch.extraPaths` で設定された追加パスも含まれます。
- 実効的に有効なactive memoryリモートAPI key fieldsがSecretRefsとして設定されている場合、このコマンドはアクティブなGatewayスナップショットからそれらの値を解決します。Gatewayが利用できない場合、コマンドは即座に失敗します。
- Gatewayバージョン差異に関する注記: このコマンドパスには `secrets.resolve` をサポートするGatewayが必要です。古いGatewayはunknown-methodエラーを返します。
- スケジュールされたsweep頻度は `dreaming.frequency` で調整します。deep promote policy自体はそれ以外では内部仕様です。1回限りの手動overrideが必要な場合は `memory promote` にCLIフラグを使用してください。
- `memory rem-harness --path <file-or-dir> --grounded` は、履歴の日次ノートから、根拠付きの `What Happened`、`Reflections`、`Possible Lasting Updates` を何も書き込まずにプレビューします。
- `memory rem-backfill --path <file-or-dir>` は、UIレビュー用に取り消し可能な根拠付きdiary entriesを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` は、通常のdeep phaseが順位付けできるように、根拠付きの永続候補をライブの短期promote storeにも投入します。
- `memory rem-backfill --rollback` は以前に書き込まれた根拠付きdiary entriesを削除し、`memory rem-backfill --rollback-short-term` は以前にステージされた根拠付き短期候補を削除します。
- 完全なphase説明と設定リファレンスについては、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
