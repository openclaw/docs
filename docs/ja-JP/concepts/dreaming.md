---
read_when:
    - メモリ昇格を自動的に実行したい場合
    - 各 Dreaming フェーズで何が行われるかを理解したい
    - MEMORY.md を汚さずに統合を調整したい場合
sidebarTitle: Dreaming
summary: ライト、ディープ、REMフェーズと夢日記を備えたバックグラウンドメモリ統合
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T20:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming は `memory-core` のバックグラウンドメモリ統合システムです。OpenClaw が強い短期シグナルを永続的なメモリへ移しつつ、その処理を説明可能かつレビュー可能に保つのを支援します。

<Note>
Dreaming は**オプトイン**であり、デフォルトでは無効です。
</Note>

## Dreaming が書き込む内容

Dreaming は 2 種類の出力を保持します。

- `memory/.dreams/` 内の**マシン状態**（リコールストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、任意で `memory/dreaming/<phase>/YYYY-MM-DD.md` 配下のフェーズレポートファイル。

長期プロモーションは引き続き `MEMORY.md` のみに書き込みます。

## フェーズモデル

Dreaming は 3 つの協調フェーズを使用します。

| フェーズ | 目的 | 永続書き込み |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期素材を分類してステージングする | いいえ |
| Deep | 永続候補をスコアリングしてプロモートする | はい（`MEMORY.md`） |
| REM | テーマと繰り返し現れるアイデアを振り返る | いいえ |

これらのフェーズは内部実装の詳細であり、ユーザーが別々に設定する「モード」ではありません。

<AccordionGroup>
  <Accordion title="Light フェーズ">
    Light フェーズは、最近の日次メモリシグナルとリコールトレースを取り込み、重複を排除し、候補行をステージングします。

    - 利用可能な場合、短期リコール状態、最近の日次メモリファイル、編集済みセッショントランスクリプトから読み取ります。
    - ストレージがインライン出力を含む場合、管理対象の `## Light Sleep` ブロックを書き込みます。
    - 後続の Deep ランキング用に強化シグナルを記録します。
    - `MEMORY.md` には書き込みません。

  </Accordion>
  <Accordion title="Deep フェーズ">
    Deep フェーズは、何を長期メモリにするかを決定します。

    - 重み付きスコアリングとしきい値ゲートを使用して候補をランク付けします。
    - 通過には `minScore`、`minRecallCount`、`minUniqueQueries` が必要です。
    - 書き込み前にライブの日次ファイルからスニペットを再ハイドレートするため、古いスニペットや削除済みスニペットはスキップされます。
    - プロモートされたエントリを `MEMORY.md` に追記します。
    - `DREAMS.md` に `## Deep Sleep` の要約を書き込み、任意で `memory/dreaming/deep/YYYY-MM-DD.md` を書き込みます。

  </Accordion>
  <Accordion title="REM フェーズ">
    REM フェーズは、パターンと内省的シグナルを抽出します。

    - 最近の短期トレースからテーマとリフレクションの要約を構築します。
    - ストレージがインライン出力を含む場合、管理対象の `## REM Sleep` ブロックを書き込みます。
    - Deep ランキングで使用される REM 強化シグナルを記録します。
    - `MEMORY.md` には書き込みません。

  </Accordion>
</AccordionGroup>

## セッショントランスクリプトの取り込み

Dreaming は、編集済みセッショントランスクリプトを Dreaming コーパスに取り込めます。トランスクリプトが利用可能な場合、それらは日次メモリシグナルとリコールトレースとともに Light フェーズへ渡されます。個人情報や機微な内容は、取り込み前に編集されます。

## Dream Diary

Dreaming は `DREAMS.md` に物語形式の **Dream Diary** も保持します。各フェーズに十分な素材がある場合、`memory-core` はベストエフォートのバックグラウンドサブエージェントターンを実行し、短い日記エントリを追記します。`dreaming.model` が設定されていない限り、デフォルトのランタイムモデルを使用します。設定されたモデルを利用できない場合、Dream Diary はセッションのデフォルトモデルで 1 回だけ再試行します。

<Note>
この日記は Dreams UI で人間が読むためのものであり、プロモーション元ではありません。Dreaming が生成した日記およびレポート成果物は、短期プロモーションから除外されます。`MEMORY.md` へプロモートできるのは、根拠のあるメモリスニペットのみです。
</Note>

レビューおよび復旧作業用に、根拠付きの履歴バックフィルレーンもあります。

<AccordionGroup>
  <Accordion title="バックフィルコマンド">
    - `memory rem-harness --path ... --grounded` は、履歴 `YYYY-MM-DD.md` ノートから根拠付き日記出力をプレビューします。
    - `memory rem-backfill --path ...` は、可逆な根拠付き日記エントリを `DREAMS.md` に書き込みます。
    - `memory rem-backfill --path ... --stage-short-term` は、通常の Deep フェーズがすでに使用しているものと同じ短期エビデンスストアに、根拠付きの永続候補をステージングします。
    - `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブ短期リコールに触れずに、それらのステージング済みバックフィル成果物を削除します。

  </Accordion>
</AccordionGroup>

Control UI は同じ日記のバックフィル/リセットフローを公開しているため、根拠付き候補をプロモートする価値があるかを決める前に、Dreams シーンで結果を確認できます。Scene には個別の根拠付きレーンも表示されるため、どのステージング済み短期エントリが履歴リプレイから来たか、どのプロモート済み項目が根拠主導だったかを確認でき、通常のライブ短期状態に触れずに根拠付きのみのステージング済みエントリだけを消去できます。

## Deep ランキングシグナル

Deep ランキングは、6 つの重み付き基本シグナルとフェーズ強化を使用します。

| シグナル | 重み | 説明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度 | 0.24 | エントリが蓄積した短期シグナルの数 |
| 関連性 | 0.30 | エントリの平均取得品質 |
| クエリ多様性 | 0.15 | それを浮上させた個別のクエリ/日コンテキスト |
| 新しさ | 0.15 | 時間減衰された鮮度スコア |
| 統合 | 0.10 | 複数日にわたる再発の強さ |
| 概念的な豊かさ | 0.06 | スニペット/パスからの概念タグ密度 |

Light および REM フェーズのヒットは、`memory/.dreams/phase-signals.json` から小さな時間減衰ブーストを追加します。

## スケジューリング

有効な場合、`memory-core` は完全な Dreaming スイープ用に 1 つの cron ジョブを自動管理します。各スイープは、light → REM → deep の順でフェーズを実行します。

スイープには、プライマリランタイムワークスペースと設定済みのエージェントワークスペースが含まれ、パスで重複排除されるため、サブエージェントのワークスペースファンアウトによってメインエージェントの `DREAMS.md` とメモリ状態が除外されることはありません。

デフォルトの頻度動作:

| 設定 | デフォルト |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *` |
| `dreaming.model` | デフォルトモデル |

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
  <Tab title="プロモーションのプレビュー / 適用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動の `memory promote` は、CLI フラグで上書きされない限り、デフォルトで Deep フェーズのしきい値を使用します。

  </Tab>
  <Tab title="プロモーションの説明">
    特定の候補がプロモートされる、またはされない理由を説明します。

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM ハーネスプレビュー">
    何も書き込まずに、REM リフレクション、候補となる真実、Deep プロモーション出力をプレビューします。

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
  任意の Dream Diary サブエージェントモデル上書き。サブエージェントの `allowedModels` 許可リストも設定する場合は、正規の `provider/model` 値を使用します。
</ParamField>

<Warning>
`dreaming.model` には `plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。制限するには、`plugins.entries.memory-core.subagent.allowedModels` も設定します。信頼または許可リストの失敗は、暗黙にフォールバックせず表示されたままになります。再試行が対象にするのは、モデル利用不可エラーのみです。
</Warning>

<Note>
フェーズポリシー、しきい値、ストレージ動作は内部実装の詳細です（ユーザー向け設定ではありません）。完全なキー一覧については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming)を参照してください。
</Note>

## Dreams UI

有効な場合、Gateway の **Dreams** タブには以下が表示されます。

- 現在の Dreaming 有効状態
- フェーズ単位のステータスと管理対象スイープの有無
- 短期、根拠付き、シグナル、今日プロモートされた数
- 次回スケジュール実行タイミング
- ステージング済み履歴リプレイエントリ用の個別の根拠付き Scene レーン
- `doctor.memory.dreamDiary` を基にした展開可能な Dream Diary リーダー

## 関連

- [メモリ](/ja-JP/concepts/memory)
- [メモリ CLI](/ja-JP/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- [メモリ検索](/ja-JP/concepts/memory-search)
