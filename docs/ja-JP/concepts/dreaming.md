---
read_when:
    - 記憶の昇格を自動的に実行したい
    - 各 Dreaming フェーズで何が行われるかを理解したい
    - MEMORY.md を汚さずに統合を調整したい場合
sidebarTitle: Dreaming
summary: バックグラウンドのメモリ統合。ライト、ディープ、REM フェーズに加えて Dream Diary を備えています。
title: Dreaming
x-i18n:
    generated_at: "2026-07-05T11:16:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 220b41de84a3cecf932f1409faa7e53f17c3845fa90f4b67f5add6e224196aae
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming は `memory-core` のバックグラウンド記憶統合システムです。強い短期シグナルを永続的な記憶へ移しながら、プロセスを説明可能かつレビュー可能に保ちます。

<Note>
Dreaming は**オプトイン**であり、デフォルトでは無効です。
</Note>

## Dreaming が書き込むもの

- `memory/.dreams/` 内の**マシン状態**（リコールストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、任意で `memory/dreaming/<phase>/YYYY-MM-DD.md` 配下のフェーズレポートファイル。

長期昇格は引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreaming は 1 回のスイープごとに、light -> REM -> deep の順で 3 つの協調フェーズを実行します。これらは内部実装フェーズであり、ユーザーが個別に設定するモードではありません。

| フェーズ | 目的                                      | 永続書き込み    |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期素材を整理してステージする | いいえ                |
| REM   | テーマと繰り返し現れるアイデアを振り返る     | いいえ                |
| Deep  | 永続候補をスコアリングして昇格する      | はい（`MEMORY.md`） |

<AccordionGroup>
  <Accordion title="Light phase">
    - 利用可能な場合、最近の短期リコール状態、日次メモリファイル、編集済みセッショントランスクリプトを読み取ります。
    - シグナルを重複排除し、候補行をステージします。
    - ストレージにインライン出力が含まれる場合、管理された `## Light Sleep` ブロックを書き込みます。
    - 後続の deep ランキング用に強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="REM phase">
    - 最近の短期トレースからテーマとリフレクションの要約を構築します。
    - ストレージにインライン出力が含まれる場合、管理された `## REM Sleep` ブロックを書き込みます。
    - deep ランキングで使用される REM 強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="Deep phase">
    - 重み付きスコアリングとしきい値ゲートで候補をランク付けします（`minScore`、`minRecallCount`、`minUniqueQueries` はすべて通過する必要があります）。
    - 書き込み前にライブの日次ファイルからスニペットを再ハイドレートするため、古いスニペットや削除済みスニペットはスキップされます。
    - 昇格したエントリを `MEMORY.md` に追記します。
    - `## Deep Sleep` 要約を `DREAMS.md` に書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` にも書き込みます。

  </Accordion>
</AccordionGroup>

## セッショントランスクリプトの取り込み

Dreaming は編集済みセッショントランスクリプトを Dreaming コーパスに取り込めます。利用可能な場合、トランスクリプトは日次メモリシグナルやリコールトレースとともに light フェーズへ供給されます。個人情報や機微な内容は取り込み前に編集されます。

## 夢日記

Dreaming は `DREAMS.md` に物語形式の**夢日記**を保持します。各フェーズに十分な素材が集まると、`memory-core` はベストエフォートのバックグラウンドサブエージェントターンを実行し、短い日記エントリを追記します。`dreaming.model` が設定されていない限り、デフォルトのランタイムモデルを使用します。設定されたモデルが利用できない場合、日記実行はセッションのデフォルトモデルで 1 回だけ再試行します。信頼または allowlist の失敗は再試行されず、汎用の日記エントリへ黙ってフォールバックする代わりにログに表示されたままになります。

<Note>
日記は Dreams UI で人間が読むためのものであり、昇格元ではありません。日記やレポートの成果物は短期昇格から除外されます。`MEMORY.md` に昇格できるのは、根拠のあるメモリスニペットだけです。
</Note>

レビューと復旧作業向けに、根拠付きの履歴バックフィルレーンもあります。

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` は、履歴の `YYYY-MM-DD.md` ノートから根拠付き日記出力をプレビューします。
    - `memory rem-backfill --path ...` は、可逆な根拠付き日記エントリを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は、通常の deep フェーズが使用するものと同じ短期エビデンスストアに、根拠付きの永続候補をステージします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブの短期リコールには触れずに、ステージ済みのバックフィル成果物を削除します。

  </Accordion>
</AccordionGroup>

Control UI は同じ日記バックフィル/リセットフローを公開しているため、根拠付き候補を昇格に値するか判断する前に、Dreams シーンで結果を確認できます。独立した根拠付き Scene レーンでは、どのステージ済み短期エントリが履歴リプレイ由来か、どの昇格済み項目が根拠主導だったかを示し、ライブの短期状態に触れずに根拠付きのみのステージ済みエントリだけをクリアできます。

## Deep ランキングシグナル

Deep ランキングは、6 つの重み付きベースシグナルとフェーズ強化を使用します。

| シグナル              | 重み | 説明                                       |
| ------------------- | ------ | ------------------------------------------------- |
| 関連性           | 0.30   | エントリの平均検索品質           |
| 頻度           | 0.24   | エントリに蓄積された短期シグナル数 |
| クエリ多様性     | 0.15   | それを浮上させた個別のクエリ/日コンテキスト      |
| 新しさ             | 0.15   | 時間減衰された鮮度スコア                      |
| 統合       | 0.10   | 複数日にわたる再出現の強さ                     |
| 概念的な豊かさ | 0.06   | スニペット/パスからの概念タグ密度             |

Light と REM フェーズのヒットは、`memory/.dreams/phase-signals.json` から小さな新しさ減衰ブーストを追加します。

シャドウトライアル結果は、永続書き込みの前にレビューシグナルとしてベーススコアの上に重ねられます。有用なトライアルは候補に小さな範囲付きブーストを与え、中立的なトライアルは保留のままにし、有害なトライアルはそのスコアリングパスで拒否済みとしてマークします。このシグナルはレポート専用です。候補の順序やレビューメタデータを変更できますが、`MEMORY.md` に書き込んだり、それ自体で候補を昇格したりすることはありません。

### QA シャドウトライアルレポートのカバレッジ

QA Lab には、将来の Dreaming シャドウトライアルが昇格前に候補メモリをどのようにレビューできるかを探索するための、レポート専用シナリオが含まれます。エージェントはベースライン回答と候補メモリを使用できる回答を比較し、判定、理由、リスクフラグを含むローカルレポートを書き込みます。このカバレッジは QA に限定されています。レポート成果物が `MEMORY.md` から分離されたままであることと、エージェントが候補が昇格されたと主張しないことを検証します。本番のシャドウトライアル動作を追加したり、deep フェーズ昇格エンジンを変更したりするものではありません。

`memory-core` シャドウトライアルランナーは、安定した成果物を必要とするコードパス向けに、同じレポート専用契約を維持します。候補、トライアルプロンプト、ベースライン結果、候補結果、判定、理由、リスクフラグ、エビデンス参照を受け取り、`promotion action: report-only` を含むレポートを書き込みます。有用な判定は `promote` 推奨に、中立的な判定は `defer` に、有害な判定は `reject` に対応します。これらはいずれも `MEMORY.md` に書き込まず、deep フェーズ昇格を適用しません。

## スケジューリング

有効な場合、`memory-core` は完全な Dreaming スイープ用の Cron ジョブを 1 つ自動管理します。プライマリランタイムワークスペースと設定済みの任意のエージェントワークスペースにわたって重複排除されるため、サブエージェントワークスペースのファンアウトによってメインエージェントの `DREAMS.md` とメモリ状態が除外されることはありません。

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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` と `/dreaming off` は、チャネル呼び出し元ではオーナー状態、Gateway クライアントでは `operator.admin` を必要とします。`/dreaming status` と `/dreaming help` は読み取り専用です。

## CLI ワークフロー

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI フラグで上書きされない限り、デフォルトで deep フェーズのしきい値を使用します。

  </Tab>
  <Tab title="Explain promotion">
    特定の候補が昇格する理由、または昇格しない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    何も書き込まずに、REM リフレクション、候補となる真実、deep 昇格出力をプレビューします。

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
  完全な Dreaming スイープの Cron 間隔。
</ParamField>
<ParamField path="model" type="string">
  任意の夢日記サブエージェントモデル上書き。サブエージェントの `allowedModels` allowlist も設定する場合は、正規の `provider/model` 値を使用してください。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` に昇格される各短期リコールスニペットから保持される推定トークン数の上限。ランキングの由来は引き続き表示されます。
</ParamField>

<Warning>
`dreaming.model` には `plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。制限するには、`plugins.entries.memory-core.subagent.allowedModels` も設定してください。自動再試行の対象はモデル利用不可エラーのみです。信頼または allowlist の失敗は、黙ってフォールバックする代わりにログに表示されたままになります。
</Warning>

<Note>
ほとんどのフェーズポリシー、しきい値、ストレージ動作は内部実装の詳細です。完全なキー一覧は [メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming) を参照してください。
</Note>

## Dreams UI

有効な場合、Gateway の**Dreams**タブには次が表示されます。

- 現在の Dreaming 有効状態
- フェーズ単位の状態と管理スイープの存在
- 短期、根拠付き、シグナル、今日昇格済みの件数
- 次回スケジュール実行のタイミング
- ステージ済み履歴リプレイエントリ用の独立した根拠付き Scene レーン
- `doctor.memory.dreamDiary` に基づく展開可能な夢日記リーダー

## 関連

- [メモリ](/ja-JP/concepts/memory)
- [メモリ CLI](/ja-JP/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- [メモリ検索](/ja-JP/concepts/memory-search)
