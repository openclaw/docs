---
read_when:
    - メモリの昇格を自動的に実行したい場合
    - 各Dreamingフェーズが何をするのかを理解したい
    - MEMORY.md を汚さずに統合を調整したい
sidebarTitle: Dreaming
summary: 軽い、深い、REM の各フェーズと Dream Diary によるバックグラウンドメモリ統合
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T13:47:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming は `memory-core` のバックグラウンドメモリ統合システムです。OpenClaw が強い短期シグナルを永続的なメモリへ移しつつ、プロセスを説明可能かつレビュー可能に保つのを助けます。

<Note>
Dreaming は**オプトイン**であり、デフォルトでは無効です。
</Note>

## Dreaming が書き込むもの

Dreaming は 2 種類の出力を保持します。

- `memory/.dreams/` 内の**マシン状態**（リコールストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、任意の `memory/dreaming/<phase>/YYYY-MM-DD.md` 配下のフェーズレポートファイル。

長期昇格は引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreaming は 3 つの協調フェーズを使用します。

| フェーズ | 目的                                   | 永続書き込み     |
| ----- | ----------------------------------------- | ----------------- |
| ライト | 最近の短期素材を分類してステージングする | いいえ                |
| ディープ  | 永続候補をスコアリングして昇格する      | はい（`MEMORY.md`） |
| REM   | テーマと反復するアイデアを振り返る     | いいえ                |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する「モード」ではありません。

<AccordionGroup>
  <Accordion title="Light phase">
    ライトフェーズは、最近の日次メモリシグナルとリコールトレースを取り込み、重複排除し、候補行をステージングします。

    - 短期リコール状態、最近の日次メモリファイル、利用可能な場合は編集済みセッショントランスクリプトから読み取ります。
    - ストレージにインライン出力が含まれる場合、管理された `## Light Sleep` ブロックを書き込みます。
    - 後続のディープランキング用に強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="Deep phase">
    ディープフェーズは、何を長期メモリにするかを決定します。

    - 重み付きスコアリングとしきい値ゲートを使って候補をランク付けします。
    - 通過するには `minScore`、`minRecallCount`、`minUniqueQueries` が必要です。
    - 書き込み前にライブの日次ファイルからスニペットを再ハイドレートするため、古いまたは削除済みのスニペットはスキップされます。
    - 昇格されたエントリを `MEMORY.md` に追記します。
    - `DREAMS.md` に `## Deep Sleep` サマリーを書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` を書き込みます。

  </Accordion>
  <Accordion title="REM phase">
    REM フェーズは、パターンと内省的シグナルを抽出します。

    - 最近の短期トレースからテーマとリフレクションのサマリーを構築します。
    - ストレージにインライン出力が含まれる場合、管理された `## REM Sleep` ブロックを書き込みます。
    - ディープランキングで使われる REM 強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
</AccordionGroup>

## セッショントランスクリプトの取り込み

Dreaming は、編集済みセッショントランスクリプトを Dreaming コーパスへ取り込めます。トランスクリプトが利用可能な場合、日次メモリシグナルやリコールトレースと並んでライトフェーズに投入されます。個人情報や機密内容は取り込み前に編集されます。

## Dream Diary

Dreaming は `DREAMS.md` に物語形式の **Dream Diary** も保持します。各フェーズに十分な素材が集まると、`memory-core` はベストエフォートのバックグラウンドサブエージェントターンを実行し、短い日記エントリを追記します。`dreaming.model` が設定されていない限り、デフォルトのランタイムモデルを使用します。設定されたモデルが利用できない場合、Dream Diary はセッションのデフォルトモデルで一度だけ再試行します。

<Note>
この日記は Dreams UI で人間が読むためのものであり、昇格元ではありません。Dreaming が生成した日記やレポートのアーティファクトは短期昇格から除外されます。根拠のあるメモリスニペットだけが `MEMORY.md` への昇格対象になります。
</Note>

レビューと復旧作業向けに、根拠付きの履歴バックフィルレーンもあります。

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` は、履歴 `YYYY-MM-DD.md` ノートから根拠付きの日記出力をプレビューします。
    - `memory rem-backfill --path ...` は、可逆な根拠付き日記エントリを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は、根拠付きの永続候補を、通常のディープフェーズがすでに使用している同じ短期エビデンスストアへステージングします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブ短期リコールには触れずに、それらのステージ済みバックフィルアーティファクトを削除します。

  </Accordion>
</AccordionGroup>

Control UI には同じ日記バックフィル/リセットフローが公開されているため、根拠付き候補を昇格する価値があるかを判断する前に、Dreams シーンで結果を検査できます。Scene には個別の根拠付きレーンも表示されるため、履歴リプレイから来たステージ済み短期エントリ、根拠主導で昇格された項目を確認し、通常のライブ短期状態に触れずに根拠付きのみのステージ済みエントリだけをクリアできます。

## ディープランキングシグナル

ディープランキングは、6 つの重み付きベースシグナルとフェーズ強化を使用します。

| シグナル              | 重み | 説明                                       |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度           | 0.24   | エントリが蓄積した短期シグナルの数 |
| 関連性           | 0.30   | エントリの平均検索品質           |
| クエリ多様性     | 0.15   | それを浮上させた個別のクエリ/日付コンテキスト      |
| 新しさ             | 0.15   | 時間減衰された鮮度スコア                      |
| 統合       | 0.10   | 複数日にわたる再発の強さ                     |
| 概念的な豊かさ | 0.06   | スニペット/パスからの概念タグ密度             |

ライトフェーズと REM フェーズのヒットは、`memory/.dreams/phase-signals.json` から小さな時間減衰ブーストを追加します。

シャドウトライアルの結果は、永続書き込みの前にレビューシグナルとしてそのベーススコアの上に重ねられます。役に立つトライアルは候補に小さな制限付きブーストを与え、中立のトライアルは延期のままにし、有害なトライアルはそのスコアリングパスで却下としてマークします。このシグナルは引き続きレポート専用です。候補の順序やレビューメタデータを変更できますが、それ自体では `MEMORY.md` に書き込んだり候補を昇格したりしません。

## QA シャドウトライアルレポートのカバレッジ

QA Lab には、将来の Dreaming シャドウトライアルが昇格前に候補メモリをどのようにレビューできるかを探索するための、レポート専用シナリオが含まれています。このシナリオでは、エージェントにベースライン回答と候補メモリを使用できる回答を比較させ、判定、理由、リスクフラグを含むローカルレポートを書かせます。

このカバレッジは意図的に QA に限定されています。レポートアーティファクトが `MEMORY.md` から分離されたままであること、またエージェントが候補は昇格されたと主張しないことを検証します。本番のシャドウトライアル動作を追加したり、ディープフェーズの昇格エンジンを変更したりはしません。

`memory-core` のシャドウトライアルランナーは、安定したアーティファクトを必要とするコードパス向けに、同じレポート専用契約を維持します。候補、トライアルプロンプト、ベースライン結果、候補結果、判定、理由、リスクフラグ、エビデンス参照を受け取り、`promotion action: report-only` を含むレポートを書き込みます。役に立つ判定は `promote` 推奨に、中立判定は `defer` に、有害判定は `reject` に対応します。これらの推奨はいずれも `MEMORY.md` に書き込まず、ディープフェーズ昇格も適用しません。

## スケジューリング

有効にすると、`memory-core` は完全な Dreaming スイープ用に 1 つの Cron ジョブを自動管理します。各スイープはライト → REM → ディープの順にフェーズを実行します。

スイープには、プライマリランタイムワークスペースと設定済みのエージェントワークスペースが含まれ、パスで重複排除されます。そのため、サブエージェントワークスペースのファンアウトによってメインエージェントの `DREAMS.md` とメモリ状態が除外されることはありません。

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

`/dreaming on` と `/dreaming off` は Gateway 全体の設定を変更します。チャンネル呼び出し元はオーナーでなければならず、Gateway クライアントには `operator.admin` が必要です。`/dreaming status` と `/dreaming help` は読み取り専用のままです。

## CLI ワークフロー

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI フラグで上書きされない限り、デフォルトでディープフェーズのしきい値を使用します。

  </Tab>
  <Tab title="Explain promotion">
    特定の候補が昇格する、または昇格しない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    何も書き込まずに、REM リフレクション、候補真実、ディープ昇格出力をプレビューします。

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
  完全な Dreaming スイープの Cron 周期。
</ParamField>
<ParamField path="model" type="string">
  任意の Dream Diary サブエージェントモデル上書き。サブエージェントの `allowedModels` 許可リストも設定する場合は、正規の `provider/model` 値を使用してください。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` に昇格される各短期リコールスニペットから保持される最大推定トークン数。ランキングの来歴は引き続き表示されます。
</ParamField>

<Warning>
`dreaming.model` には `plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。制限するには、`plugins.entries.memory-core.subagent.allowedModels` も設定してください。信頼または許可リストの失敗は、黙ってフォールバックする代わりに表示されたままになります。再試行はモデル利用不可エラーのみを対象とします。
</Warning>

<Note>
ほとんどのフェーズポリシー、しきい値、ストレージ動作は内部実装の詳細です。完全なキー一覧については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming) を参照してください。
</Note>

## Dreams UI

有効にすると、Gateway の **Dreams** タブには次が表示されます。

- 現在の Dreaming 有効状態
- フェーズレベルのステータスと管理スイープの有無
- 短期、根拠付き、シグナル、本日昇格済みの件数
- 次回スケジュール実行のタイミング
- ステージ済み履歴リプレイエントリ用の個別の根拠付き Scene レーン
- `doctor.memory.dreamDiary` に支えられた展開可能な Dream Diary リーダー

## Dreaming が実行されない: ステータスが blocked と表示される

`openclaw memory status` が `Dreaming status: blocked` を報告する場合、管理 Cron は存在しますが、デフォルトエージェントの Heartbeat が発火していません。デフォルトエージェントの Heartbeat が有効で、ターゲットが `none` ではないことを確認し、次の Heartbeat 間隔の後に `openclaw memory status --deep` を再実行してください。

## 関連

- [メモリ](/ja-JP/concepts/memory)
- [メモリ CLI](/ja-JP/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- [メモリ検索](/ja-JP/concepts/memory-search)
