---
read_when:
    - メモリ昇格を自動的に実行したい場合
    - Dreaming の各フェーズが何をするのかを理解したい
    - MEMORY.md を汚さずに統合を調整したい場合
sidebarTitle: Dreaming
summary: ライト、ディープ、REM フェーズと夢日記を備えたバックグラウンドメモリ統合
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T11:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming は `memory-core` のバックグラウンドメモリ統合システムです。OpenClaw が強い短期シグナルを永続的なメモリへ移しつつ、そのプロセスを説明可能かつレビュー可能に保つのに役立ちます。

<Note>
Dreaming は**オプトイン**であり、デフォルトでは無効です。
</Note>

## Dreaming が書き込むもの

Dreaming は 2 種類の出力を保持します。

- `memory/.dreams/` 内の**マシン状態**（recall store、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、任意で `memory/dreaming/<phase>/YYYY-MM-DD.md` 配下のフェーズレポートファイル。

長期プロモーションは引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreaming は 3 つの協調フェーズを使用します。

| フェーズ | 目的 | 永続書き込み |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期素材を分類してステージングする | いいえ |
| Deep  | 永続候補をスコアリングしてプロモーションする | はい（`MEMORY.md`） |
| REM   | テーマと繰り返されるアイデアを振り返る | いいえ |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する「モード」ではありません。

<AccordionGroup>
  <Accordion title="Light フェーズ">
    Light フェーズは、最近の日次メモリシグナルと recall トレースを取り込み、重複排除して、候補行をステージングします。

    - 短期 recall 状態、最近の日次メモリファイル、利用可能な場合は墨消し済みセッショントランスクリプトから読み取ります。
    - ストレージにインライン出力が含まれる場合、管理対象の `## Light Sleep` ブロックを書き込みます。
    - 後続の deep ランキングのために強化シグナルを記録します。
    - `MEMORY.md` には書き込みません。

  </Accordion>
  <Accordion title="Deep フェーズ">
    Deep フェーズは、何を長期メモリにするかを決定します。

    - 重み付きスコアリングとしきい値ゲートを使用して候補をランク付けします。
    - 通過には `minScore`、`minRecallCount`、`minUniqueQueries` が必要です。
    - 書き込み前にライブの日次ファイルからスニペットを再ハイドレートするため、古いまたは削除済みのスニペットはスキップされます。
    - プロモーションされたエントリを `MEMORY.md` に追記します。
    - `## Deep Sleep` の要約を `DREAMS.md` に書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` を書き込みます。

  </Accordion>
  <Accordion title="REM フェーズ">
    REM フェーズは、パターンと内省シグナルを抽出します。

    - 最近の短期トレースからテーマと内省の要約を構築します。
    - ストレージにインライン出力が含まれる場合、管理対象の `## REM Sleep` ブロックを書き込みます。
    - deep ランキングで使用される REM 強化シグナルを記録します。
    - `MEMORY.md` には書き込みません。

  </Accordion>
</AccordionGroup>

## セッショントランスクリプトの取り込み

Dreaming は、墨消し済みセッショントランスクリプトを Dreaming コーパスに取り込めます。トランスクリプトが利用可能な場合、それらは日次メモリシグナルおよび recall トレースとともに light フェーズへ渡されます。個人情報と機微な内容は取り込み前に墨消しされます。

## Dream Diary

Dreaming は `DREAMS.md` にナラティブな **Dream Diary** も保持します。各フェーズに十分な素材があると、`memory-core` はベストエフォートのバックグラウンドサブエージェントターンを実行し、短い日記エントリを追記します。`dreaming.model` が設定されていない限り、デフォルトのランタイムモデルを使用します。設定されたモデルが利用できない場合、Dream Diary はセッションのデフォルトモデルで 1 回再試行します。

<Note>
この日記は Dreams UI で人が読むためのものであり、プロモーション元ではありません。Dreaming が生成した日記/レポート成果物は短期プロモーションから除外されます。根拠付きメモリスニペットのみが `MEMORY.md` へのプロモーション対象になります。
</Note>

レビューと復旧作業向けに、根拠付きの履歴バックフィルレーンもあります。

<AccordionGroup>
  <Accordion title="バックフィルコマンド">
    - `memory rem-harness --path ... --grounded` は、履歴 `YYYY-MM-DD.md` ノートから根拠付き日記出力をプレビューします。
    - `memory rem-backfill --path ...` は、可逆な根拠付き日記エントリを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は、通常の deep フェーズがすでに使用している同じ短期エビデンスストアに、根拠付きの永続候補をステージングします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブの短期 recall に触れずに、それらのステージング済みバックフィル成果物を削除します。

  </Accordion>
</AccordionGroup>

Control UI は同じ日記バックフィル/リセットフローを公開しているため、根拠付き候補をプロモーションする価値があるかを決める前に、Dreams シーンで結果を検査できます。Scene には独立した根拠付きレーンも表示されるため、ステージングされた短期エントリのうちどれが履歴リプレイ由来か、プロモーションされた項目のうちどれが根拠主導かを確認でき、通常のライブ短期状態に触れずに、根拠付きのみのステージング済みエントリだけを消去できます。

## Deep ランキングシグナル

Deep ランキングは、6 つの重み付きベースシグナルとフェーズ強化を使用します。

| シグナル | 重み | 説明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度 | 0.24   | エントリが蓄積した短期シグナルの数 |
| 関連性 | 0.30   | エントリの平均検索品質 |
| クエリ多様性 | 0.15   | それを浮上させた個別のクエリ/日コンテキスト |
| 新しさ | 0.15   | 時間減衰された鮮度スコア |
| 統合 | 0.10   | 複数日にわたる再発強度 |
| 概念的な豊かさ | 0.06   | スニペット/パスからの概念タグ密度 |

Light および REM フェーズのヒットは、`memory/.dreams/phase-signals.json` から小さな時間減衰ブーストを追加します。

shadow-trial の結果は、永続書き込みの前にレビューシグナルとしてそのベーススコアへ重ねられます。有用な trial は候補に小さな上限付きブーストを与え、中立的な trial は保留のままにし、有害な trial はそのスコアリングパスで rejected としてマークします。このシグナルは引き続きレポート専用です。候補の順序やレビューメタデータは変更できますが、`MEMORY.md` へ書き込んだり、それ自体で候補をプロモーションしたりはしません。

## QA shadow trial レポートカバレッジ

QA Lab には、将来の Dreaming shadow trial がプロモーション前に候補メモリをどのようにレビューできるかを探索するための、レポート専用シナリオが含まれています。このシナリオでは、エージェントにベースライン回答と候補メモリを使用できる回答を比較させ、判定、理由、リスクフラグを含むローカルレポートを書かせます。

このカバレッジは意図的に QA に限定されています。レポート成果物が `MEMORY.md` から分離されたままであること、およびエージェントが候補がプロモーションされたと主張しないことを検証します。本番の shadow-trial 動作を追加したり、deep フェーズのプロモーションエンジンを変更したりはしません。

`memory-core` の shadow-trial ランナーは、安定した成果物を必要とするコードパス向けに、同じレポート専用契約を維持します。候補、trial プロンプト、ベースライン結果、候補結果、判定、理由、リスクフラグ、エビデンス参照を受け取り、`promotion action: report-only` を含むレポートを書き込みます。有用な判定は `promote` 推奨に、中立的な判定は `defer` に、有害な判定は `reject` にマップされます。これらの推奨はいずれも `MEMORY.md` に書き込まず、deep フェーズのプロモーションも適用しません。

## スケジューリング

有効化すると、`memory-core` は完全な Dreaming sweep 用に 1 つの Cron ジョブを自動管理します。各 sweep は light → REM → deep の順にフェーズを実行します。

sweep には、プライマリランタイムワークスペースと、設定済みのエージェントワークスペースが含まれます。パスで重複排除されるため、サブエージェントワークスペースのファンアウトによってメインエージェントの `DREAMS.md` とメモリ状態が除外されることはありません。

デフォルトの周期動作:

| 設定 | デフォルト |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | デフォルトモデル |

## クイックスタート

<Tabs>
  <Tab title="Dreaming を有効化">
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
  <Tab title="カスタム sweep 周期">
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
  <Tab title="プロモーションのプレビュー / 適用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI フラグで上書きしない限り、デフォルトで deep フェーズのしきい値を使用します。

  </Tab>
  <Tab title="プロモーションを説明">
    特定の候補がプロモーションされる、またはされない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM ハーネスプレビュー">
    何も書き込まずに、REM の内省、候補 truth、deep プロモーション出力をプレビューします。

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主要なデフォルト

すべての設定は `plugins.entries.memory-core.config.dreaming` 配下にあります。

<ParamField path="enabled" type="boolean" default="false">
  Dreaming sweep を有効または無効にします。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完全な Dreaming sweep の Cron 周期。
</ParamField>
<ParamField path="model" type="string">
  任意の Dream Diary サブエージェントモデル上書き。サブエージェントの `allowedModels` allowlist も設定する場合は、正規の `provider/model` 値を使用します。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` にプロモーションされる各短期 recall スニペットから保持される推定トークン数の最大値。ランキングの由来は引き続き表示されます。
</ParamField>

<Warning>
`dreaming.model` には `plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。制限するには、`plugins.entries.memory-core.subagent.allowedModels` も設定します。信頼または allowlist の失敗はサイレントにフォールバックせず、表示されたままになります。再試行はモデル利用不可エラーのみを対象にします。
</Warning>

<Note>
ほとんどのフェーズポリシー、しきい値、ストレージ動作は内部実装の詳細です。完全なキー一覧については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming) を参照してください。
</Note>

## Dreams UI

有効化すると、Gateway の **Dreams** タブには次が表示されます。

- 現在の Dreaming 有効化状態
- フェーズレベルの状態と管理対象 sweep の有無
- 短期、根拠付き、シグナル、本日プロモーション済みの件数
- 次回スケジュール実行のタイミング
- ステージング済み履歴リプレイエントリ用の独立した根拠付き Scene レーン
- `doctor.memory.dreamDiary` に支えられた展開可能な Dream Diary リーダー

## Dreaming が実行されない: status が blocked を表示する

`openclaw memory status` が `Dreaming status: blocked` を報告する場合、管理対象 Cron は存在しますが、デフォルトエージェントの Heartbeat が発火していません。デフォルトエージェントで Heartbeat が有効になっていること、およびそのターゲットが `none` ではないことを確認してから、次の Heartbeat 間隔後に `openclaw memory status --deep` を再度実行してください。

## 関連

- [Memory](/ja-JP/concepts/memory)
- [Memory CLI](/ja-JP/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- [Memory search](/ja-JP/concepts/memory-search)
