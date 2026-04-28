---
read_when:
    - memory昇格を自動実行したい場合
    - 各Dreamingフェーズが何をするのか理解したい場合
    - MEMORY.mdを汚さずに統合を調整したい場合
sidebarTitle: Dreaming
summary: light、deep、REMフェーズとDream Diaryを備えたバックグラウンドmemory統合
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreamingは `memory-core` のバックグラウンドmemory統合システムです。強い短期シグナルを耐久性のあるmemoryへ移しつつ、そのプロセスを説明可能かつレビュー可能に保つのに役立ちます。

<Note>
Dreamingは**opt-in**で、デフォルトでは無効です。
</Note>

## Dreamingが書き込むもの

Dreamingは2種類の出力を保持します。

- **マシン状態**: `memory/.dreams/`（recall store、phase signal、ingestion checkpoint、lock）
- **人間が読める出力**: `DREAMS.md`（または既存の `dreams.md`）および任意のphase report file（`memory/dreaming/<phase>/YYYY-MM-DD.md` 配下）

長期promotionは引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreamingは3つの協調フェーズを使います。

| Phase | 目的 | Durable write |
| ----- | ---- | ------------- |
| Light | 最近の短期materialを整理してstageする | なし |
| Deep  | 耐久候補をスコア付けしてpromoteする | はい（`MEMORY.md`） |
| REM   | テーマと繰り返し現れるアイデアを振り返る | なし |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する「mode」ではありません。

<AccordionGroup>
  <Accordion title="Light phase">
    Light phaseは、最近の日次memory signalとrecall traceを取り込み、重複排除し、候補行をstageします。

    - 利用可能な場合、短期recall state、最近の日次memory file、redactedされたsession transcriptから読み取ります。
    - storageにinline outputが含まれる場合、管理された `## Light Sleep` blockを書き込みます。
    - 後続のdeep ranking用にreinforcement signalを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="Deep phase">
    Deep phaseは、何が長期memoryになるかを決定します。

    - 重み付きスコアリングとthreshold gateを使って候補を順位付けします。
    - `minScore`、`minRecallCount`、`minUniqueQueries` の通過が必要です。
    - 書き込み前にliveな日次fileからsnippetをrehydrateするため、古い/削除済みsnippetはスキップされます。
    - promoted entryを `MEMORY.md` に追記します。
    - `DREAMS.md` に `## Deep Sleep` の要約を書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` にも書き込みます。

  </Accordion>
  <Accordion title="REM phase">
    REM phaseは、パターンと内省的signalを抽出します。

    - 最近の短期traceからthemeとreflectionの要約を構築します。
    - storageにinline outputが含まれる場合、管理された `## REM Sleep` blockを書き込みます。
    - deep rankingで使われるREM reinforcement signalを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
</AccordionGroup>

## Session transcript ingestion

Dreamingは、redactedされたsession transcriptをdreaming corpusに取り込めます。transcriptが利用可能な場合、それらは日次memory signalおよびrecall traceとともにlight phaseへ入力されます。個人的および機密性の高いcontentは、取り込み前にredactされます。

## Dream Diary

Dreamingは `DREAMS.md` に物語形式の**Dream Diary**も保持します。各phaseに十分なmaterialがそろうと、`memory-core` はベストエフォートのバックグラウンドsubagent turn（デフォルトruntime modelを使用）を実行し、短いdiary entryを追記します。

<Note>
このdiaryはDreams UIで人が読むためのものであり、promotion元ではありません。Dreamingが生成したdiary/report artifactは短期promotionから除外されます。`MEMORY.md` にpromoteできるのは、groundedなmemory snippetだけです。
</Note>

レビューおよび復旧作業向けに、groundedな履歴backfill laneもあります。

<AccordionGroup>
  <Accordion title="Backfillコマンド">
    - `memory rem-harness --path ... --grounded` は、過去の `YYYY-MM-DD.md` noteからgrounded diary outputをプレビューします。
    - `memory rem-backfill --path ...` は、可逆的なgrounded diary entryを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は、groundedなdurable candidateを、通常のdeep phaseがすでに使っているのと同じ短期evidence storeにstageします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常のdiary entryやliveな短期recallに触れずに、それらのstage済みbackfill artifactを削除します。

  </Accordion>
</AccordionGroup>

Control UIは同じdiary backfill/reset flowを公開しているため、grounded candidateがpromotionに値するかを判断する前に、Dreams sceneで結果を確認できます。Sceneにはdistinctなgrounded laneも表示されるため、どのstage済み短期entryが履歴replay由来なのか、どのpromoted itemがgrounded主導だったのかを確認でき、通常のlive短期stateに触れずにgrounded専用のstage済みentryだけをクリアできます。

## Deep ranking signal

Deep rankingは、6つの重み付きbase signalとphase reinforcementを使います。

| Signal | Weight | 説明 |
| ------ | ------ | ---- |
| Frequency | 0.24 | そのentryが蓄積した短期signalの数 |
| Relevance | 0.30 | そのentryの平均retrieval quality |
| Query diversity | 0.15 | それを表面化させた異なるquery/day context |
| Recency | 0.15 | 時間減衰するfreshness score |
| Consolidation | 0.10 | 複数日にわたる再発強度 |
| Conceptual richness | 0.06 | snippet/pathからのconcept-tag密度 |

LightとREM phaseのhitは、`memory/.dreams/phase-signals.json` から小さなrecency-decayed boostを追加します。

## スケジューリング

有効にすると、`memory-core` は完全なdreaming sweep用の1つのCron jobを自動管理します。各sweepはフェーズを順番に実行します: light → REM → deep。

デフォルトのcadence動作:

| Setting | Default |
| ------- | ------- |
| `dreaming.frequency` | `0 3 * * *` |

## クイックスタート

<Tabs>
  <Tab title="Dreamingを有効にする">
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
  </Tab>
  <Tab title="カスタムsweep cadence">
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
  </Tab>
</Tabs>

## スラッシュコマンド

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLIワークフロー

<Tabs>
  <Tab title="Promotionプレビュー / 適用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI flagで上書きしない限り、デフォルトでdeep-phase thresholdを使います。

  </Tab>
  <Tab title="Promotionを説明する">
    特定のcandidateがpromoteされる、またはされない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harnessプレビュー">
    何も書き込まずに、REM reflection、candidate truth、deep promotion outputをプレビューします。

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主なデフォルト

すべての設定は `plugins.entries.memory-core.config.dreaming` 配下にあります。

<ParamField path="enabled" type="boolean" default="false">
  dreaming sweepを有効または無効にします。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完全なdreaming sweepのCron cadenceです。
</ParamField>

<Note>
phase policy、threshold、storage behaviorは内部実装の詳細です（ユーザー向けconfigではありません）。完全なkey一覧は[Memory configuration reference](/ja-JP/reference/memory-config#dreaming)を参照してください。
</Note>

## Dreams UI

有効にすると、Gatewayの**Dreams** tabには次が表示されます。

- 現在のdreaming有効状態
- phaseレベルstatusと管理sweepの有無
- 短期、grounded、signal、当日promoted件数
- 次回スケジュール実行時刻
- stage済み履歴replay entry向けのdistinctなgrounded Scene lane
- `doctor.memory.dreamDiary` をバックエンドに持つ展開可能なDream Diary reader

## 関連

- [Memory](/ja-JP/concepts/memory)
- [Memory CLI](/ja-JP/cli/memory)
- [Memory configuration reference](/ja-JP/reference/memory-config)
- [Memory search](/ja-JP/concepts/memory-search)
