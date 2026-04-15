---
read_when:
    - メモリの昇格を自動的に実行したい場合
    - 各Dreamingフェーズが何をするのかを理解したい場合
    - MEMORY.mdを汚さずに統合を調整したい場合
summary: 軽い、深い、REMの各フェーズに加え、Dream Diaryを備えたバックグラウンドメモリ統合
title: Dreaming（実験的）
x-i18n:
    generated_at: "2026-04-15T04:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5882a5068f2eabe54ca9893184e5385330a432b921870c38626399ce11c31e25
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming（実験的）

Dreamingは、`memory-core` におけるバックグラウンドメモリ統合システムです。  
これにより、OpenClawは説明可能かつレビュー可能な形で、強い短期シグナルを永続的なメモリへ移すことができます。

Dreamingは**オプトイン**で、デフォルトでは無効です。

## Dreamingが書き込むもの

Dreamingは2種類の出力を保持します。

- `memory/.dreams/` 内の**マシン状態**（recall store、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、`memory/dreaming/<phase>/YYYY-MM-DD.md` 配下の任意のフェーズレポートファイル。

長期プロモーションは引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreamingは、協調して動作する3つのフェーズを使用します。

| フェーズ | 目的 | 永続的な書き込み |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期マテリアルを分類してステージする | なし |
| Deep  | 永続化候補をスコアリングして昇格する | あり（`MEMORY.md`） |
| REM   | テーマと繰り返し現れるアイデアを振り返る | なし |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する「モード」ではありません。

### Lightフェーズ

Lightフェーズは、最近の日次メモリシグナルとrecallトレースを取り込み、それらを重複排除して候補行をステージします。

- 利用可能な場合、短期recall状態、最近の日次メモリファイル、伏せ字化されたセッショントランスクリプトから読み取ります。
- ストレージにインライン出力が含まれる場合、管理された `## Light Sleep` ブロックを書き込みます。
- 後のDeepランキングのために強化シグナルを記録します。
- `MEMORY.md` には決して書き込みません。

### Deepフェーズ

Deepフェーズは、何が長期メモリになるかを決定します。

- 重み付きスコアリングとしきい値ゲートを使って候補をランキングします。
- `minScore`、`minRecallCount`、`minUniqueQueries` をすべて満たす必要があります。
- 書き込み前にライブの日次ファイルからスニペットを再取得するため、古いスニペットや削除済みスニペットはスキップされます。
- 昇格したエントリを `MEMORY.md` に追記します。
- `DREAMS.md` に `## Deep Sleep` サマリーを書き込み、必要に応じて `memory/dreaming/deep/YYYY-MM-DD.md` にも書き込みます。

### REMフェーズ

REMフェーズは、パターンと内省的シグナルを抽出します。

- 最近の短期トレースからテーマと振り返りサマリーを構築します。
- ストレージにインライン出力が含まれる場合、管理された `## REM Sleep` ブロックを書き込みます。
- Deepランキングで使われるREM強化シグナルを記録します。
- `MEMORY.md` には決して書き込みません。

## セッショントランスクリプトの取り込み

Dreamingは、伏せ字化されたセッショントランスクリプトをDreamingコーパスに取り込むことができます。  
トランスクリプトが利用可能な場合、それらは日次メモリシグナルやrecallトレースとともにLightフェーズへ入力されます。個人的な内容や機微な内容は、取り込み前に伏せ字化されます。

## Dream Diary

Dreamingは、`DREAMS.md` に物語形式の**Dream Diary**も保持します。  
各フェーズに十分な材料がそろうと、`memory-core` はベストエフォートのバックグラウンドsubagentターン（デフォルトのランタイムモデルを使用）を実行し、短い日記エントリを追記します。

この日記はDreams UIで人間が読むためのものであり、プロモーション元ではありません。  
Dreamingによって生成された日記やレポートの成果物は、短期プロモーションの対象外です。`MEMORY.md` へ昇格できるのは、根拠のあるメモリスニペットだけです。

レビューや復旧作業のために、根拠付きの履歴バックフィル経路もあります。

- `memory rem-harness --path ... --grounded` は、過去の `YYYY-MM-DD.md` ノートから生成される根拠付き日記出力をプレビューします。
- `memory rem-backfill --path ...` は、元に戻せる根拠付き日記エントリを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path ... --stage-short-term` は、通常のDeepフェーズがすでに使用しているのと同じ短期エビデンスストアに、根拠付きの永続候補をステージします。
- `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブの短期recallには触れずに、それらのステージ済みバックフィル成果物を削除します。

Control UIは同じ日記バックフィル／リセットフローを提供しているため、根拠付き候補が昇格に値するかを判断する前に、Dreamsシーンで結果を確認できます。  
このシーンは独立したgroundedレーンも表示し、どのステージ済み短期エントリが履歴リプレイ由来か、どの昇格済みアイテムがgrounded主導だったかを確認でき、通常のライブ短期状態に触れずにgrounded専用のステージ済みエントリだけをクリアできます。

## Deepランキングシグナル

Deepランキングは、6つの重み付き基本シグナルとフェーズ強化を使用します。

| シグナル | 重み | 説明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度 | 0.24   | エントリが蓄積した短期シグナルの数 |
| 関連性 | 0.30   | エントリの平均取得品質 |
| クエリ多様性 | 0.15   | そのエントリが現れた異なるクエリ／日コンテキスト |
| 新しさ | 0.15   | 時間減衰を考慮した鮮度スコア |
| 統合 | 0.10   | 複数日にまたがる再出現の強さ |
| 概念的豊かさ | 0.06   | スニペット／パスから得られる概念タグ密度 |

LightフェーズとREMフェーズのヒットは、`memory/.dreams/phase-signals.json` から小さな時間減衰付きブーストを追加します。

## スケジューリング

有効にすると、`memory-core` は完全なDreamingスイープのためのCronジョブを1つ自動管理します。各スイープは、light -> REM -> deep の順にフェーズを実行します。

デフォルトの実行間隔の動作:

| 設定 | デフォルト |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## クイックスタート

Dreamingを有効にする:

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

カスタムスイープ間隔でDreamingを有効にする:

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

## CLIワークフロー

プレビューまたは手動適用にはCLIプロモーションを使用します。

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手動の `memory promote` は、CLIフラグで上書きしない限り、デフォルトでDeepフェーズのしきい値を使用します。

特定の候補が昇格する、または昇格しない理由を説明する:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

何も書き込まずに、REMの振り返り、候補の事実、Deepプロモーション出力をプレビューする:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 主なデフォルト値

すべての設定は `plugins.entries.memory-core.config.dreaming` 配下にあります。

| キー | デフォルト |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

フェーズポリシー、しきい値、ストレージ動作は内部実装の詳細であり、ユーザー向け設定ではありません。

完全なキー一覧は、[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming-experimental) を参照してください。

## Dreams UI

有効にすると、Gatewayの**Dreams**タブには次が表示されます。

- 現在のDreaming有効状態
- フェーズレベルの状態と管理対象スイープの有無
- 短期、grounded、シグナル、本日昇格済みの各件数
- 次回の予定実行時刻
- ステージ済みの履歴リプレイエントリ用の独立したgroundedシーンレーン
- `doctor.memory.dreamDiary` を基盤とする展開可能なDream Diaryリーダー

## 関連

- [メモリ](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [memory CLI](/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
