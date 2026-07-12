---
read_when:
    - メモリの昇格を自動的に実行したい場合
    - 各 Dreaming フェーズの動作を理解したい場合
    - MEMORY.md を汚さずに統合を調整したい場合
sidebarTitle: Dreaming
summary: 軽い睡眠、深い睡眠、REM睡眠の各フェーズと夢日記を備えたバックグラウンドでの記憶統合
title: Dreaming
x-i18n:
    generated_at: "2026-07-12T14:25:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming は、`memory-core` のバックグラウンドメモリ統合システムです。強い短期シグナルを永続的なメモリへ移行しながら、そのプロセスを説明可能かつレビュー可能に保ちます。

<Note>
Dreaming は**オプトイン**であり、デフォルトでは無効です。
</Note>

## Dreaming が書き込む内容

- `memory/.dreams/` 内の**マシン状態**（想起ストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、必要に応じて `memory/dreaming/<phase>/YYYY-MM-DD.md` 以下のフェーズレポートファイル。

長期昇格による書き込み先は、引き続き `MEMORY.md` のみです。

## フェーズモデル

Dreaming はスイープごとに、light -> REM -> deep の順で連携する 3 つのフェーズを実行します。これらは内部実装のフェーズであり、ユーザーが個別に設定するモードではありません。

| フェーズ | 目的                                         | 永続的な書き込み |
| -------- | -------------------------------------------- | ---------------- |
| Light    | 最近の短期素材を整理してステージングする     | なし             |
| REM      | テーマと繰り返し現れるアイデアを振り返る     | なし             |
| Deep     | 永続化候補をスコアリングして昇格させる       | あり（`MEMORY.md`） |

<AccordionGroup>
  <Accordion title="Light フェーズ">
    - 最近の短期想起状態、日次メモリファイル、および利用可能な場合は編集済みのセッショントランスクリプトを読み取ります。
    - シグナルの重複を排除し、候補行をステージングします。
    - ストレージにインライン出力が含まれる場合、管理対象の `## Light Sleep` ブロックを書き込みます。
    - 後続の deep ランキング用に強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="REM フェーズ">
    - 最近の短期トレースからテーマと振り返りの要約を作成します。
    - ストレージにインライン出力が含まれる場合、管理対象の `## REM Sleep` ブロックを書き込みます。
    - deep ランキングで使用する REM 強化シグナルを記録します。
    - `MEMORY.md` には決して書き込みません。

  </Accordion>
  <Accordion title="Deep フェーズ">
    - 重み付きスコアリングとしきい値ゲートを使用して候補をランク付けします（`minScore`、`minRecallCount`、`minUniqueQueries` のすべてを通過する必要があります）。
    - 書き込み前に現在の日次ファイルからスニペットを再取得するため、古いスニペットや削除済みのスニペットはスキップされます。
    - 昇格したエントリを `MEMORY.md` に追記します。
    - `DREAMS.md` に `## Deep Sleep` の要約を書き込み、必要に応じて `memory/dreaming/deep/YYYY-MM-DD.md` にも書き込みます。

  </Accordion>
</AccordionGroup>

## セッショントランスクリプトの取り込み

Dreaming は、編集済みのセッショントランスクリプトを Dreaming コーパスへ取り込めます。利用可能な場合、トランスクリプトは日次メモリシグナルおよび想起トレースとともに light フェーズへ入力されます。個人情報や機密性の高い内容は、取り込み前に編集されます。

## Dream Diary

Dreaming は、`DREAMS.md` に物語形式の**夢日記**を保持します。各フェーズに十分な素材が集まると、`memory-core` はベストエフォートのバックグラウンドサブエージェントターンを実行し、短い日記エントリを追記します。`dreaming.model` が設定されていない限り、デフォルトのランタイムモデルを使用します。設定されたモデルが利用できない場合、日記の実行はセッションのデフォルトモデルで 1 回再試行されます。信頼または許可リストの失敗は再試行されず、一般的な日記エントリへ暗黙的にフォールバックする代わりに、ログへ表示されたままになります。

<Note>
日記は Dreams UI で人間が読むためのものであり、昇格元ではありません。日記およびレポートの成果物は短期昇格から除外されます。`MEMORY.md` へ昇格できるのは、根拠のあるメモリスニペットのみです。
</Note>

レビューおよび復旧作業向けに、根拠のある履歴バックフィル経路もあります。

<AccordionGroup>
  <Accordion title="バックフィルコマンド">
    - `memory rem-harness --path ... --grounded` は、過去の `YYYY-MM-DD.md` ノートから根拠のある日記出力をプレビューします。
    - `memory rem-backfill --path ...` は、取り消し可能な根拠のある日記エントリを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は、根拠のある永続化候補を、通常の deep フェーズが使用するものと同じ短期エビデンスストアへステージングします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリや現在の短期想起に触れずに、ステージングされたバックフィル成果物を削除します。

  </Accordion>
</AccordionGroup>

Control UI では、エージェントの Memory タブ（Agents ページ）に同じ日記のバックフィル／リセットフローが用意されています。これにより、根拠のある候補を昇格させる価値があるか判断する前に、夢のシーンで結果を確認できます。独立した根拠付き Scene 経路には、ステージングされた短期エントリのうち履歴再生から生成されたもの、根拠付きシグナルが主導して昇格した項目が表示されます。また、現在の短期状態に触れずに、根拠付きのみのステージング済みエントリだけを消去できます。

## Deep ランキングシグナル

Deep ランキングでは、6 つの重み付き基本シグナルに加えて、フェーズ強化を使用します。

| シグナル       | 重み | 説明                                               |
| -------------- | ---- | -------------------------------------------------- |
| 関連性         | 0.30 | エントリの平均取得品質                             |
| 頻度           | 0.24 | エントリに蓄積された短期シグナルの数               |
| クエリの多様性 | 0.15 | エントリを表出させた個別のクエリ／日付コンテキスト |
| 新しさ         | 0.15 | 時間減衰を適用した鮮度スコア                       |
| 統合           | 0.10 | 複数日にわたる再出現の強さ                         |
| 概念的な豊かさ | 0.06 | スニペット／パスから得られる概念タグの密度         |

Light および REM フェーズでのヒットは、`memory/.dreams/phase-signals.json` から小さな時間減衰ブーストを追加します。

シャドウトライアルの結果は、永続的な書き込みが行われる前に、レビューシグナルとして基本スコアへ重ねられます。有用なトライアルは候補に小さな上限付きブーストを与え、中立的なトライアルは候補を保留のままにし、有害なトライアルはそのスコアリング処理で候補を却下済みとしてマークします。このシグナルはレポート専用です。候補の順序やレビューメタデータを変更することはありますが、それ自体が `MEMORY.md` へ書き込んだり、候補を昇格させたりすることはありません。

### QA シャドウトライアルのレポート範囲

QA Lab には、将来の Dreaming シャドウトライアルが昇格前の候補メモリをどのようにレビューできるかを検証する、レポート専用シナリオが含まれています。エージェントはベースライン回答と候補メモリを使用できる回答を比較し、判定、理由、リスクフラグを含むローカルレポートを書き込みます。この範囲は QA に限定されています。レポート成果物が `MEMORY.md` から分離されたままであること、およびエージェントが候補を昇格したと主張しないことを検証します。本番環境のシャドウトライアル動作を追加したり、deep フェーズの昇格エンジンを変更したりするものではありません。

`memory-core` のシャドウトライアルランナーは、安定した成果物を必要とするコードパス向けに、同じレポート専用の契約を維持します。候補、トライアルプロンプト、ベースライン結果、候補使用時の結果、判定、理由、リスクフラグ、エビデンス参照を受け取り、`promotion action: report-only` を含むレポートを書き込みます。有用という判定は `promote` の推奨、中立という判定は `defer`、有害という判定は `reject` に対応します。いずれも `MEMORY.md` へ書き込まず、deep フェーズの昇格を適用しません。

## スケジュール

有効にすると、`memory-core` は Dreaming の完全なスイープ用 Cron ジョブを 1 つ自動管理します。プライマリランタイムワークスペースと設定済みのすべてのエージェントワークスペース間で重複が排除されるため、サブエージェントのワークスペース展開によってメインエージェントの `DREAMS.md` とメモリ状態が除外されることはありません。

| 設定                 | デフォルト       |
| -------------------- | ---------------- |
| `dreaming.frequency` | `0 3 * * *`      |
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
  <Tab title="カスタムスイープ間隔">
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

`/dreaming on` と `/dreaming off` を実行するには、チャンネル呼び出し元の場合はオーナーステータス、Gateway クライアントの場合は `operator.admin` が必要です。`/dreaming status` と `/dreaming help` は読み取り専用です。

## CLI ワークフロー

<Tabs>
  <Tab title="昇格のプレビュー／適用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI フラグで上書きしない限り、デフォルトで deep フェーズのしきい値を使用します。

  </Tab>
  <Tab title="昇格の説明">
    特定の候補が昇格する、または昇格しない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM ハーネスのプレビュー">
    何も書き込まずに、REM の振り返り、候補となる事実、deep 昇格の出力をプレビューします。

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主なデフォルト設定

すべての設定は `plugins.entries.memory-core.config.dreaming` 以下にあります。

<ParamField path="enabled" type="boolean" default="false">
  Dreaming スイープを有効または無効にします。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Dreaming の完全なスイープの Cron 実行間隔です。
</ParamField>
<ParamField path="model" type="string">
  任意の Dream Diary サブエージェントモデル上書きです。サブエージェントの `allowedModels` 許可リストも設定する場合は、正規の `provider/model` 値を使用してください。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md` へ昇格する各短期想起スニペットから保持される、推定トークン数の上限です。ランキングの来歴は引き続き表示されます。
</ParamField>

<Warning>
`dreaming.model` には `plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。制限するには、`plugins.entries.memory-core.subagent.allowedModels` も設定してください。自動再試行の対象はモデルを利用できないエラーのみです。信頼または許可リストの失敗は暗黙的にフォールバックせず、ログに表示されたままになります。
</Warning>

<Note>
フェーズポリシー、しきい値、ストレージ動作の大半は内部実装の詳細です。すべてのキーの一覧については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming)を参照してください。
</Note>

## Dreams UI

有効にすると、Gateway の **Dreams** タブには次の情報が表示されます。

- 現在の Dreaming 有効状態
- フェーズレベルの状態と管理対象スイープの有無
- 短期、根拠付き、シグナル、本日昇格済みの件数
- 次回のスケジュール実行時刻
- ステージングされた履歴再生エントリ用の独立した根拠付き Scene 経路
- `doctor.memory.dreamDiary` をデータソースとする、展開可能な Dream Diary リーダー

## 関連項目

- [メモリ](/ja-JP/concepts/memory)
- [メモリ CLI](/ja-JP/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- [メモリ検索](/ja-JP/concepts/memory-search)
