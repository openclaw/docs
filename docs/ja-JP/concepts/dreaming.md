---
read_when:
    - メモリー昇格を自動的に実行したい場合
    - 各 Dreaming フェーズで何が行われるかを理解したい場合
    - MEMORY.md を汚さずに統合を調整したい場合
sidebarTitle: Dreaming
summary: ライト、ディープ、REM フェーズと夢日記を備えたバックグラウンドでのメモリ統合
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming は `memory-core` のバックグラウンド記憶統合システムです。OpenClaw が強い短期シグナルを耐久的な記憶へ移しつつ、そのプロセスを説明可能かつレビュー可能に保つのに役立ちます。

<Note>
Dreaming は**オプトイン**で、デフォルトでは無効です。
</Note>

## Dreaming が書き込むもの

Dreaming は 2 種類の出力を保持します。

- `memory/.dreams/` 内の**マシン状態**（リコールストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、任意で `memory/dreaming/<phase>/YYYY-MM-DD.md` 配下のフェーズレポートファイル。

長期昇格は引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreaming は 3 つの協調フェーズを使用します。

| フェーズ | 目的                                   | 耐久的な書き込み     |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期素材を整理してステージングする | いいえ                |
| Deep  | 耐久候補をスコアリングして昇格する      | はい（`MEMORY.md`） |
| REM   | テーマや繰り返し現れるアイデアを内省する     | いいえ                |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する「モード」ではありません。

<AccordionGroup>
  <Accordion title="Light phase">
    Light フェーズは、最近の日次記憶シグナルとリコールトレースを取り込み、重複を除去し、候補行をステージングします。

    - 利用可能な場合、短期リコール状態、最近の日次記憶ファイル、編集済みセッショントランスクリプトから読み取ります。
    - ストレージがインライン出力を含む場合、管理対象の `## Light Sleep` ブロックを書き込みます。
    - 後続の Deep ランキング用に強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="Deep phase">
    Deep フェーズは、何を長期記憶にするかを決定します。

    - 重み付きスコアリングとしきい値ゲートを使って候補をランク付けします。
    - 通過するには `minScore`、`minRecallCount`、`minUniqueQueries` が必要です。
    - 書き込み前にライブの日次ファイルからスニペットを再取得するため、古くなった、または削除されたスニペットはスキップされます。
    - 昇格されたエントリを `MEMORY.md` に追記します。
    - `DREAMS.md` に `## Deep Sleep` 要約を書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` を書き込みます。

  </Accordion>
  <Accordion title="REM phase">
    REM フェーズは、パターンと内省シグナルを抽出します。

    - 最近の短期トレースからテーマと内省の要約を構築します。
    - ストレージがインライン出力を含む場合、管理対象の `## REM Sleep` ブロックを書き込みます。
    - Deep ランキングで使用される REM 強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
</AccordionGroup>

## セッショントランスクリプトの取り込み

Dreaming は、編集済みセッショントランスクリプトを Dreaming コーパスに取り込めます。トランスクリプトが利用可能な場合、日次記憶シグナルやリコールトレースと並べて Light フェーズへ渡されます。個人情報やセンシティブな内容は取り込み前に編集されます。

## Dream Diary

Dreaming は `DREAMS.md` に物語形式の **Dream Diary** も保持します。各フェーズに十分な素材が集まると、`memory-core` はベストエフォートのバックグラウンドサブエージェントターンを実行し、短い日記エントリを追記します。`dreaming.model` が設定されていない限り、デフォルトのランタイムモデルを使用します。設定されたモデルが利用できない場合、Dream Diary はセッションのデフォルトモデルで 1 回再試行します。

<Note>
この日記は Dreams UI で人が読むためのものであり、昇格ソースではありません。Dreaming が生成した日記やレポートのアーティファクトは短期昇格から除外されます。`MEMORY.md` へ昇格できるのは、根拠のある記憶スニペットのみです。
</Note>

レビューと復旧作業のために、根拠付きの履歴バックフィルレーンもあります。

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` は履歴 `YYYY-MM-DD.md` ノートから根拠付きの日記出力をプレビューします。
    - `memory rem-backfill --path ...` は可逆な根拠付き日記エントリを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は根拠付きの耐久候補を、通常の Deep フェーズがすでに使用している同じ短期エビデンスストアにステージングします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブの短期リコールに触れずに、それらのステージング済みバックフィルアーティファクトを削除します。

  </Accordion>
</AccordionGroup>

Control UI は同じ日記バックフィル/リセットフローを公開しているため、根拠付き候補を昇格に値するか判断する前に、Dreams シーンで結果を確認できます。Scene には独立した根拠付きレーンも表示されるため、どのステージング済み短期エントリが履歴再生から来たか、どの昇格済み項目が根拠主導だったかを確認でき、通常のライブ短期状態に触れずに根拠付きのみのステージング済みエントリを消去できます。

## Deep ランキングシグナル

Deep ランキングは、6 つの重み付きベースシグナルとフェーズ強化を使用します。

| シグナル              | 重み | 説明                                       |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度           | 0.24   | エントリが蓄積した短期シグナルの数 |
| 関連性           | 0.30   | エントリの平均検索品質           |
| クエリ多様性     | 0.15   | それを浮上させた別個のクエリ/日コンテキスト      |
| 新しさ             | 0.15   | 時間減衰された鮮度スコア                      |
| 統合       | 0.10   | 複数日にわたる再発強度                     |
| 概念的な豊かさ | 0.06   | スニペット/パスからの概念タグ密度             |

Light と REM フェーズのヒットは、`memory/.dreams/phase-signals.json` から小さな時間減衰ブーストを追加します。

## スケジュール

有効な場合、`memory-core` は完全な Dreaming スイープ用の Cron ジョブを 1 つ自動管理します。各スイープは Light → REM → Deep の順にフェーズを実行します。

スイープにはプライマリランタイムワークスペースと設定済みのエージェントワークスペースが含まれ、パスで重複除去されます。そのため、サブエージェントワークスペースのファンアウトによってメインエージェントの `DREAMS.md` と記憶状態が除外されることはありません。

デフォルトの周期動作:

| 設定              | デフォルト       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | デフォルトモデル |

## クイックスタート

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI フラグで上書きされない限り、デフォルトで Deep フェーズのしきい値を使用します。

  </Tab>
  <Tab title="Explain promotion">
    特定の候補が昇格する理由、または昇格しない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    何も書き込まずに、REM の内省、候補となる真実、Deep 昇格出力をプレビューします。

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主なデフォルト

すべての設定は `plugins.entries.memory-core.config.dreaming` 配下にあります。

<ParamField path="enabled" type="boolean" default="false">
  Dreaming スイープを有効または無効にします。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完全な Dreaming スイープの Cron 周期です。
</ParamField>
<ParamField path="model" type="string">
  任意の Dream Diary サブエージェントモデル上書きです。サブエージェントの `allowedModels` 許可リストも設定する場合は、正規の `provider/model` 値を使用してください。
</ParamField>

<Warning>
`dreaming.model` には `plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。制限するには、`plugins.entries.memory-core.subagent.allowedModels` も設定してください。信頼または許可リストの失敗は、黙ってフォールバックせず表示されたままになります。再試行はモデル利用不可エラーのみを対象にします。
</Warning>

<Note>
フェーズポリシー、しきい値、ストレージ動作は内部実装の詳細です（ユーザー向け設定ではありません）。キーの完全な一覧は [Memory 設定リファレンス](/ja-JP/reference/memory-config#dreaming) を参照してください。
</Note>

## Dreams UI

有効な場合、Gateway の **Dreams** タブには次が表示されます。

- 現在の Dreaming 有効状態
- フェーズ単位のステータスと管理対象スイープの存在
- 短期、根拠付き、シグナル、本日昇格の件数
- 次回予定実行のタイミング
- ステージング済み履歴再生エントリ用の独立した根拠付き Scene レーン
- `doctor.memory.dreamDiary` に裏付けられた展開可能な Dream Diary リーダー

## Dreaming が実行されない: ステータスがブロック中と表示される

`openclaw memory status` が `Dreaming status: blocked` を報告する場合、管理対象 Cron は存在しますが、デフォルトエージェントの Heartbeat が発火していません。デフォルトエージェントで Heartbeat が有効になっていること、およびそのターゲットが `none` でないことを確認し、次の Heartbeat 間隔の後に `openclaw memory status --deep` をもう一度実行してください。

## 関連

- [Memory](/ja-JP/concepts/memory)
- [Memory CLI](/ja-JP/cli/memory)
- [Memory 設定リファレンス](/ja-JP/reference/memory-config)
- [Memory 検索](/ja-JP/concepts/memory-search)
