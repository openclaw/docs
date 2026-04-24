---
read_when:
    - メモリ昇格を自動実行したい場合
    - 各 Dreaming フェーズが何をするのかを理解したい場合
    - MEMORY.md を汚さずに統合を調整したい場合
summary: Dream Diary を伴う light、deep、REM フェーズによるバックグラウンドの記憶統合
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T04:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a2a399259e1ec9db52f761308686c7d6d377fd21528b77a9057fa690802c3db
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming は `memory-core` にあるバックグラウンドの記憶統合システムです。
これにより OpenClaw は、強い短期シグナルを耐久的な memory に移しつつ、
そのプロセスを説明可能でレビュー可能な状態に保てます。

Dreaming は**オプトイン**で、デフォルトでは無効です。

## Dreaming が書き込むもの

Dreaming は 2 種類の出力を保持します。

- `memory/.dreams/` 内の**マシン状態**（recall store、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、任意の `memory/dreaming/<phase>/YYYY-MM-DD.md` 配下のフェーズレポートファイル。

長期昇格は引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreaming は、協調して動作する 3 つのフェーズを使います。

| フェーズ | 目的                                      | 永続書き込み        |
| -------- | ----------------------------------------- | ------------------- |
| Light    | 最近の短期素材を整理してステージングする  | なし                |
| Deep     | 耐久的候補をスコア付けして昇格させる      | はい（`MEMORY.md`） |
| REM      | テーマと繰り返し現れるアイデアを内省する  | なし                |

これらのフェーズは内部実装の詳細であり、ユーザーが別々に設定する
「モード」ではありません。

### Light フェーズ

Light フェーズは、最近の日次 memory シグナルと recall trace を取り込み、重複排除し、
候補行をステージングします。

- 利用可能な場合、短期 recall 状態、最近の日次 memory ファイル、秘匿化済みセッショントランスクリプトを読み取ります。
- ストレージにインライン出力が含まれる場合、管理された `## Light Sleep` ブロックを書き込みます。
- 後の deep ランキング用に reinforcement シグナルを記録します。
- `MEMORY.md` には決して書き込みません。

### Deep フェーズ

Deep フェーズは、何を長期 memory にするかを決定します。

- 重み付きスコアリングと閾値ゲートを使って候補を順位付けします。
- 通過には `minScore`、`minRecallCount`、`minUniqueQueries` を満たす必要があります。
- 書き込み前に生きている日次ファイルからスニペットを再取得するため、古い/削除済みスニペットはスキップされます。
- 昇格したエントリーを `MEMORY.md` に追記します。
- `DREAMS.md` に `## Deep Sleep` サマリーを書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` にも書き込みます。

### REM フェーズ

REM フェーズは、パターンと内省的シグナルを抽出します。

- 最近の短期 trace からテーマと内省サマリーを構築します。
- ストレージにインライン出力が含まれる場合、管理された `## REM Sleep` ブロックを書き込みます。
- deep ランキングで使われる REM reinforcement シグナルを記録します。
- `MEMORY.md` には決して書き込みません。

## セッショントランスクリプトの取り込み

Dreaming は、秘匿化済みセッショントランスクリプトを Dreaming コーパスに取り込むことができます。トランスクリプトが利用可能な場合、それらは日次 memory シグナルおよび recall trace とともに Light フェーズに入力されます。個人的・機微な内容は取り込み前に秘匿化されます。

## Dream Diary

Dreaming は `DREAMS.md` に物語的な**Dream Diary** も保持します。
各フェーズに十分な素材がそろうと、`memory-core` はベストエフォートのバックグラウンド
サブエージェントターン（デフォルトのランタイムモデルを使用）を実行し、
短い日記エントリーを追記します。

この日記は Dreams UI で人間が読むためのものであり、昇格元ではありません。
Dreaming によって生成された日記/レポートアーティファクトは短期
昇格から除外されます。`MEMORY.md` に昇格できるのは、根拠のある
memory スニペットのみです。

レビューや回復作業のために、根拠付きの履歴バックフィルレーンもあります。

- `memory rem-harness --path ... --grounded` は、履歴 `YYYY-MM-DD.md` ノートからの根拠付き日記出力をプレビューします。
- `memory rem-backfill --path ...` は、可逆的な根拠付き日記エントリーを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path ... --stage-short-term` は、通常の deep フェーズがすでに使っている同じ短期証拠ストアに、根拠付きの耐久候補をステージングします。
- `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリーやライブの短期 recall に触れずに、ステージされたバックフィルアーティファクトを削除します。

Control UI でも同じ日記バックフィル/リセットフローが公開されるため、根拠付き候補が昇格に値するか判断する前に、Dreams シーンで結果を確認できます。シーンには独立した grounded レーンも表示されるため、どのステージ済み短期エントリーが履歴リプレイ由来か、どの昇格項目が grounded 主導かを確認でき、通常のライブ短期状態に触れずに grounded のみのステージ済みエントリーをクリアできます。

## Deep ランキングシグナル

Deep ランキングは、6 つの重み付きベースシグナルとフェーズ reinforcement を使います。

| シグナル            | 重み   | 説明                                              |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency           | 0.24   | エントリーが蓄積した短期シグナルの数              |
| Relevance           | 0.30   | そのエントリーの平均取得品質                      |
| Query diversity     | 0.15   | それを浮上させた異なるクエリ/日コンテキスト       |
| Recency             | 0.15   | 時間減衰付きの新しさスコア                        |
| Consolidation       | 0.10   | 複数日にわたる再出現の強さ                        |
| Conceptual richness | 0.06   | スニペット/パス由来の concept タグ密度            |

Light フェーズと REM フェーズでのヒットは、
`memory/.dreams/phase-signals.json` から小さな時間減衰付きブーストを加えます。

## スケジューリング

有効化されると、`memory-core` は完全な Dreaming
スイープ用の 1 つの Cron ジョブを自動管理します。各スイープはフェーズを順に実行します: light -> REM -> deep。

デフォルトの頻度動作:

| 設定                 | デフォルト  |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## クイックスタート

Dreaming を有効にする:

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

カスタムスイープ頻度で Dreaming を有効にする:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## スラッシュコマンド

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI ワークフロー

プレビューまたは手動適用には CLI 昇格を使います。

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手動の `memory promote` は、CLI フラグで上書きしない限り、デフォルトで deep フェーズの閾値を使います。

特定の候補がなぜ昇格するのか、または昇格しないのかを説明する:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

何も書き込まずに、REM の内省、候補の真実、deep 昇格出力をプレビューする:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 主なデフォルト

すべての設定は `plugins.entries.memory-core.config.dreaming` 配下にあります。

| キー        | デフォルト  |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

フェーズポリシー、閾値、ストレージ動作は内部実装の
詳細であり（ユーザー向け設定ではありません）。

完全なキー一覧は [Memory 設定リファレンス](/ja-JP/reference/memory-config#dreaming)
を参照してください。

## Dreams UI

有効化されると、Gateway の **Dreams** タブには次が表示されます。

- 現在の Dreaming 有効状態
- フェーズレベルの状態と管理済みスイープの有無
- 短期、grounded、signal、本日昇格済みの件数
- 次回予定実行時刻
- ステージされた履歴リプレイエントリー用の独立した grounded シーンレーン
- `doctor.memory.dreamDiary` をバックエンドに持つ展開可能な Dream Diary リーダー

## トラブルシューティング

### Dreaming がまったく実行されない（ステータスが blocked を示す）

管理された Dreaming Cron は、デフォルトエージェントの Heartbeat に乗っています。そのエージェントの Heartbeat が発火していない場合、Cron は誰にも消費されないシステムイベントをキューに入れ、Dreaming は静かに実行されません。`openclaw memory status` と `/dreaming status` の両方が、その場合 `blocked` を報告し、どのエージェントの Heartbeat がブロッカーかを示します。

よくある原因は 2 つあります。

- 別のエージェントが明示的な `heartbeat:` ブロックを宣言している。`agents.list` のいずれかのエントリーに独自の `heartbeat` ブロックがあると、それらのエージェントだけが Heartbeat し、defaults は他すべてに適用されなくなるため、デフォルトエージェントが停止することがあります。Heartbeat 設定を `agents.defaults.heartbeat` に移動するか、デフォルトエージェントに明示的な `heartbeat` ブロックを追加してください。[スコープと優先順位](/ja-JP/gateway/heartbeat#scope-and-precedence) を参照してください。
- `heartbeat.every` が `0`、空、または解析不能。Cron にはスケジュール対象の間隔がないため、Heartbeat は事実上無効です。`every` を `30m` のような正の duration に設定してください。[デフォルト](/ja-JP/gateway/heartbeat#defaults) を参照してください。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [Memory](/ja-JP/concepts/memory)
- [Memory Search](/ja-JP/concepts/memory-search)
- [memory CLI](/ja-JP/cli/memory)
- [Memory 設定リファレンス](/ja-JP/reference/memory-config)
