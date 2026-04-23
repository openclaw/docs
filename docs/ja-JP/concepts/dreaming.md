---
read_when:
    - memory promotion を自動実行したいです
    - 各 Dreaming フェーズが何をするのか理解したいです
    - MEMORY.md を汚さずに統合を調整したいです
summary: Dream Diary を備えた、light、deep、REM フェーズによるバックグラウンドの memory 統合
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T14:03:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming は `memory-core` のバックグラウンド memory 統合システムです。
これにより OpenClaw は、プロセスを説明可能かつレビュー可能に保ちながら、
強い短期シグナルを durable memory へ移動できます。

Dreaming は **opt-in** で、デフォルトでは無効です。

## Dreaming が書き込むもの

Dreaming は 2 種類の出力を保持します。

- `memory/.dreams/` 内の **machine state**（recall store、phase signals、ingestion checkpoints、locks）。
- `DREAMS.md`（または既存の `dreams.md`）内の **人間が読める出力** と、任意の phase report files（`memory/dreaming/<phase>/YYYY-MM-DD.md`）。

長期 promotion は引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreaming は 3 つの協調フェーズを使います。

| Phase | 目的 | Durable write |
| ----- | ---- | ------------- |
| Light | 最近の短期 material を整理して段階化する | なし |
| Deep  | durable candidates をスコアリングして promote する | あり (`MEMORY.md`) |
| REM   | テーマや繰り返し現れる考えを振り返る | なし |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する
「modes」ではありません。

### Light フェーズ

Light フェーズは、最近の daily memory signals と recall traces を取り込み、
重複排除し、candidate lines を段階化します。

- 利用可能な場合は、短期 recall state、最近の daily memory files、redacted session transcripts から読み取ります。
- storage に inline output が含まれる場合、管理された `## Light Sleep` ブロックを書き込みます。
- 後の deep ranking のために reinforcement signals を記録します。
- `MEMORY.md` には決して書き込みません。

### Deep フェーズ

Deep フェーズは、何を長期 memory にするかを決定します。

- weighted scoring と threshold gates を使って candidates をランク付けします。
- 通過には `minScore`、`minRecallCount`、`minUniqueQueries` が必要です。
- 書き込み前に live daily files から snippets を再水和するため、古くなった snippets や削除済み snippets はスキップされます。
- promoted entries を `MEMORY.md` に追記します。
- `DREAMS.md` に `## Deep Sleep` の要約を書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` にも書き込みます。

### REM フェーズ

REM フェーズは、パターンと反省的シグナルを抽出します。

- 最近の短期 traces から theme と reflection の要約を構築します。
- storage に inline output が含まれる場合、管理された `## REM Sleep` ブロックを書き込みます。
- deep ranking で使われる REM reinforcement signals を記録します。
- `MEMORY.md` には決して書き込みません。

## Session transcript の取り込み

Dreaming は redacted session transcripts を dreaming corpus に取り込めます。transcripts が利用可能な場合、それらは daily memory signals と recall traces と一緒に light フェーズへ投入されます。個人的で機微な content は取り込み前に redacted されます。

## Dream Diary

Dreaming は `DREAMS.md` に物語的な **Dream Diary** も保持します。
各フェーズに十分な material がそろうと、`memory-core` は best-effort のバックグラウンド
subagent turn（デフォルトの runtime model を使用）を実行し、短い diary entry を追記します。

この diary は Dreams UI で人が読むためのものであり、promotion source ではありません。
Dreaming によって生成された diary/report artifacts は短期
promotion から除外されます。`MEMORY.md` に promote できるのは、
根拠のある memory snippets のみです。

レビューと復旧作業のために、根拠付きの historical backfill lane もあります。

- `memory rem-harness --path ... --grounded` は、過去の `YYYY-MM-DD.md` notes から grounded diary output をプレビューします。
- `memory rem-backfill --path ...` は、可逆的な grounded diary entries を `DREAMS.md` に書き込みます。
- `memory rem-backfill --path ... --stage-short-term` は、grounded durable candidates を、通常の deep フェーズがすでに使用しているのと同じ短期 evidence store に段階化します。
- `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の diary entries や live short-term recall には触れずに、それらの staged backfill artifacts を削除します。

Control UI も同じ diary backfill/reset フローを公開しているため、
grounded candidates を promote すべきか判断する前に、Dreams scene で結果を確認できます。
Scene には distinct grounded lane も表示されるため、どの staged short-term entries が historical replay 由来か、どの promoted items が grounded 主導かを確認でき、通常の live short-term state には触れずに grounded-only の staged entries だけを消去できます。

## Deep ranking signals

Deep ranking は、6 つの weighted base signals と phase reinforcement を使います。

| Signal | Weight | 説明 |
| ------ | ------ | ---- |
| Frequency | 0.24 | entry が蓄積した短期シグナルの数 |
| Relevance | 0.30 | entry の平均取得品質 |
| Query diversity | 0.15 | それを浮上させた異なる query/day contexts |
| Recency | 0.15 | 時間減衰する鮮度スコア |
| Consolidation | 0.10 | 複数日にわたる再発強度 |
| Conceptual richness | 0.06 | snippet/path 由来の concept-tag 密度 |

Light フェーズと REM フェーズのヒットは、
`memory/.dreams/phase-signals.json` からの小さな recency-decayed boost を加えます。

## スケジューリング

有効にすると、`memory-core` は完全な dreaming
sweep 用の 1 つの Cron ジョブを自動管理します。各 sweep は、light -> REM -> deep の順にフェーズを実行します。

デフォルトの cadence 動作:

| Setting | Default |
| ------- | ------- |
| `dreaming.frequency` | `0 3 * * *` |

## クイックスタート

Dreaming を有効化する:

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

カスタム sweep cadence で Dreaming を有効化する:

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

プレビューまたは手動適用には CLI promotion を使用します。

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手動の `memory promote` は、CLI flags で上書きしない限り、デフォルトで deep-phase thresholds を使用します。

特定の candidate が promote される、またはされない理由を説明する:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

何も書き込まずに REM reflections、candidate truths、deep promotion output をプレビューする:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 主なデフォルト

すべての設定は `plugins.entries.memory-core.config.dreaming` の下にあります。

| Key | Default |
| --- | ------- |
| `enabled` | `false` |
| `frequency` | `0 3 * * *` |

フェーズポリシー、thresholds、storage behavior は内部実装の
詳細であり（ユーザー向け config ではありません）。

完全なキー一覧は [Memory configuration reference](/ja-JP/reference/memory-config#dreaming)
を参照してください。

## Dreams UI

有効にすると、Gateway の **Dreams** タブには次が表示されます。

- 現在の dreaming 有効状態
- phase レベルの状態と managed-sweep の有無
- short-term、grounded、signal、promoted-today の件数
- 次回の scheduled run 時刻
- staged historical replay entries 用の distinct grounded Scene lane
- `doctor.memory.dreamDiary` をバックエンドとする展開可能な Dream Diary reader

## トラブルシューティング

### Dreaming がまったく実行されない（status が blocked を示す）

管理された dreaming Cron はデフォルト agent の Heartbeat に乗っています。その agent で heartbeat が発火していない場合、Cron は誰にも消費されない system event を enqueue し、dreaming は何も起きずに実行されません。その場合、`openclaw memory status` と `/dreaming status` の両方が `blocked` を報告し、どの agent の heartbeat がボトルネックかを示します。

よくある原因は 2 つあります。

- 別の agent が明示的な `heartbeat:` ブロックを宣言している。`agents.list` 内のいずれかの entry に独自の `heartbeat` ブロックがあると、その agents だけが heartbeat し、defaults は他のすべてに適用されなくなるため、デフォルト agent が沈黙することがあります。heartbeat 設定を `agents.defaults.heartbeat` に移すか、デフォルト agent に明示的な `heartbeat` ブロックを追加してください。[Scope and precedence](/ja-JP/gateway/heartbeat#scope-and-precedence) を参照してください。
- `heartbeat.every` が `0`、空、または解析不能。Cron にはスケジュール対象の interval がなく、heartbeat は事実上無効です。`every` を `30m` のような正の duration に設定してください。[Defaults](/ja-JP/gateway/heartbeat#defaults) を参照してください。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [Memory](/ja-JP/concepts/memory)
- [Memory Search](/ja-JP/concepts/memory-search)
- [memory CLI](/ja-JP/cli/memory)
- [Memory configuration reference](/ja-JP/reference/memory-config)
