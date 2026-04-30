---
read_when:
    - メモリ昇格を自動的に実行したい場合
    - 各Dreamingフェーズの役割を理解したい場合
    - MEMORY.md を汚染せずに統合を調整したい場合
sidebarTitle: Dreaming
summary: ライト、ディープ、REMの各フェーズと夢日記を備えたバックグラウンドでのメモリ統合
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T05:07:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming は `memory-core` のバックグラウンドメモリ統合システムです。OpenClaw が強い短期シグナルを永続メモリへ移動しながら、そのプロセスを説明可能かつレビュー可能に保つのに役立ちます。

<Note>
Dreaming は**オプトイン**であり、デフォルトでは無効です。
</Note>

## Dreaming が書き込むもの

Dreaming は 2 種類の出力を保持します。

- `memory/.dreams/` の**マシン状態**（リコールストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）の**人間が読める出力**と、`memory/dreaming/<phase>/YYYY-MM-DD.md` 配下の任意のフェーズレポートファイル。

長期昇格は引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreaming は 3 つの協調フェーズを使用します。

| フェーズ | 目的                                   | 永続書き込み     |
| ----- | ----------------------------------------- | ----------------- |
| ライト | 最近の短期素材を分類してステージングする | いいえ                |
| ディープ  | 永続候補をスコアリングして昇格する      | はい（`MEMORY.md`） |
| REM   | テーマと繰り返し現れるアイデアを内省する     | いいえ                |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する「モード」ではありません。

<AccordionGroup>
  <Accordion title="ライトフェーズ">
    ライトフェーズは、最近の日次メモリシグナルとリコールトレースを取り込み、重複排除し、候補行をステージングします。

    - 短期リコール状態、最近の日次メモリファイル、利用可能な場合は編集済みセッショントランスクリプトから読み取ります。
    - ストレージにインライン出力が含まれる場合、管理対象の `## Light Sleep` ブロックを書き込みます。
    - 後のディープランキング用に強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="ディープフェーズ">
    ディープフェーズは、何を長期メモリにするかを決定します。

    - 重み付きスコアリングとしきい値ゲートを使って候補をランク付けします。
    - 通過するには `minScore`、`minRecallCount`、`minUniqueQueries` が必要です。
    - 書き込み前にライブの日次ファイルからスニペットを再ハイドレートするため、古いスニペットや削除されたスニペットはスキップされます。
    - 昇格したエントリを `MEMORY.md` に追記します。
    - `DREAMS.md` に `## Deep Sleep` サマリーを書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` を書き込みます。

  </Accordion>
  <Accordion title="REM フェーズ">
    REM フェーズはパターンと内省的シグナルを抽出します。

    - 最近の短期トレースからテーマと内省サマリーを構築します。
    - ストレージにインライン出力が含まれる場合、管理対象の `## REM Sleep` ブロックを書き込みます。
    - ディープランキングで使用される REM 強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
</AccordionGroup>

## セッショントランスクリプトの取り込み

Dreaming は、編集済みセッショントランスクリプトを Dreaming コーパスに取り込めます。トランスクリプトが利用可能な場合、それらは日次メモリシグナルとリコールトレースとともにライトフェーズへ渡されます。個人情報や機密コンテンツは取り込み前に編集されます。

## 夢日記

Dreaming は `DREAMS.md` に物語形式の**夢日記**も保持します。各フェーズに十分な素材が集まると、`memory-core` はベストエフォートのバックグラウンドサブエージェントターンを実行し、短い日記エントリを追記します。`dreaming.model` が設定されていない限り、デフォルトのランタイムモデルを使用します。設定されたモデルが利用できない場合、夢日記はセッションのデフォルトモデルで 1 回再試行します。

<Note>
この日記は Dreams UI で人が読むためのものであり、昇格元ではありません。Dreaming が生成した日記/レポートアーティファクトは短期昇格から除外されます。根拠のあるメモリスニペットだけが `MEMORY.md` に昇格できます。
</Note>

レビューと復旧作業のために、根拠付きの履歴バックフィルレーンもあります。

<AccordionGroup>
  <Accordion title="バックフィルコマンド">
    - `memory rem-harness --path ... --grounded` は、履歴 `YYYY-MM-DD.md` ノートから根拠付き日記出力をプレビューします。
    - `memory rem-backfill --path ...` は、取り消し可能な根拠付き日記エントリを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は、根拠付き永続候補を、通常のディープフェーズがすでに使用しているものと同じ短期エビデンスストアにステージングします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブの短期リコールには触れずに、それらのステージ済みバックフィルアーティファクトを削除します。

  </Accordion>
</AccordionGroup>

Control UI には同じ日記バックフィル/リセットフローが表示されるため、根拠付き候補を昇格する価値があるかを決める前に、Dreams シーンで結果を確認できます。シーンには個別の根拠付きレーンも表示されるため、どのステージ済み短期エントリが履歴再生由来か、どの昇格項目が根拠主導だったかを確認でき、通常のライブ短期状態に触れずに根拠付きのみのステージ済みエントリだけを消去できます。

## ディープランキングシグナル

ディープランキングは、6 つの重み付きベースシグナルとフェーズ強化を使用します。

| シグナル              | 重み | 説明                                       |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度           | 0.24   | エントリが蓄積した短期シグナルの数 |
| 関連性           | 0.30   | エントリの平均検索品質           |
| クエリの多様性     | 0.15   | それを表面化させた個別のクエリ/日コンテキスト      |
| 新しさ             | 0.15   | 時間減衰された鮮度スコア                      |
| 統合       | 0.10   | 複数日にわたる再発の強さ                     |
| 概念的な豊かさ | 0.06   | スニペット/パスからの概念タグ密度             |

ライトフェーズと REM フェーズのヒットは、`memory/.dreams/phase-signals.json` から小さな新しさ減衰ブーストを追加します。

## スケジュール

有効な場合、`memory-core` は完全な Dreaming スイープ用に 1 つの Cron ジョブを自動管理します。各スイープは、ライト → REM → ディープの順にフェーズを実行します。

デフォルトの頻度動作:

| 設定              | デフォルト       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | デフォルトモデル |

## クイックスタート

<Tabs>
  <Tab title="Dreaming を有効にする">
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
  <Tab title="カスタムスイープ頻度">
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

## CLI ワークフロー

<Tabs>
  <Tab title="昇格のプレビュー / 適用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI フラグで上書きされない限り、デフォルトでディープフェーズのしきい値を使用します。

  </Tab>
  <Tab title="昇格を説明する">
    特定の候補が昇格する理由、または昇格しない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM ハーネスプレビュー">
    何も書き込まずに、REM の内省、候補真実、ディープ昇格出力をプレビューします。

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主要なデフォルト

すべての設定は `plugins.entries.memory-core.config.dreaming` 配下にあります。

<ParamField path="enabled" type="boolean" default="false">
  Dreaming スイープを有効または無効にします。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完全な Dreaming スイープの Cron 頻度。
</ParamField>
<ParamField path="model" type="string">
  任意の夢日記サブエージェントモデル上書き。サブエージェントの `allowedModels` 許可リストも設定する場合は、正規の `provider/model` 値を使用してください。
</ParamField>

<Warning>
`dreaming.model` には `plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。制限するには、`plugins.entries.memory-core.subagent.allowedModels` も設定してください。信頼または許可リストの失敗は、黙ってフォールバックされるのではなく可視のままになります。再試行はモデル利用不可エラーのみを対象にします。
</Warning>

<Note>
フェーズポリシー、しきい値、ストレージ動作は内部実装の詳細です（ユーザー向け設定ではありません）。完全なキー一覧については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming)を参照してください。
</Note>

## Dreams UI

有効な場合、Gateway の **Dreams** タブには次が表示されます。

- 現在の Dreaming 有効状態
- フェーズレベルの状態と管理対象スイープの存在
- 短期、根拠付き、シグナル、今日昇格された数
- 次回スケジュール実行のタイミング
- ステージ済み履歴再生エントリ用の個別の根拠付きシーンレーン
- `doctor.memory.dreamDiary` に基づく展開可能な夢日記リーダー

## 関連

- [メモリ](/ja-JP/concepts/memory)
- [メモリ CLI](/ja-JP/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- [メモリ検索](/ja-JP/concepts/memory-search)
