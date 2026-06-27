---
read_when:
    - ローカルの個人エージェント信頼性チェックの実行
    - リポジトリに裏付けられた QA シナリオカタログの拡張
    - 検証リマインダー、返信、メモリ、墨消し、安全なツールのフォロースルー、タスクステータス、共有しても安全な診断、証拠に裏付けられた完了主張、失敗からの復旧
summary: プライバシーを保護するパーソナルアシスタントワークフローのチェック用のローカル qa-channel シナリオ。
title: 個人エージェントのベンチマークパック
x-i18n:
    generated_at: "2026-06-27T11:15:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack は、ローカルのパーソナルアシスタントワークフロー向けの小さな repo-backed QA シナリオパックです。汎用的なモデルベンチマークではなく、新しいランナーも必要ありません。このパックは、[QA 概要](/ja-JP/concepts/qa-e2e-automation)、合成 [QA チャネル](/ja-JP/channels/qa-channel)、既存の `qa/scenarios` YAML カタログで説明されているプライベート QA スタックを再利用します。

最初のパックは意図的に範囲を絞っています。

- ローカル cron 配信による偽の個人リマインダー
- `qa-channel` による偽の DM とスレッド返信ルーティング
- 一時 QA ワークスペースのメモリファイルからの偽の設定リコール
- 偽のシークレットをエコーしないチェック
- 短い承認形式のターン後の、安全な読み取りに裏付けられたツールのフォロースルー
- 機密性の高いローカル読み取りリクエストに対する承認拒否時の停止動作
- pending、blocked、done を分離したままにする、証拠に裏付けられたタスクステータス報告
- 生の個人コンテンツを省略しつつ有用なステータスを保持する、共有しても安全な診断アーティファクト
- ローカル証拠が存在する前の偽の進捗を避ける、証拠に裏付けられた完了主張
- 部分的なステータスを報告し、リトライ境界を明確に保つ障害復旧

## シナリオ

機械可読なパックメタデータは
`extensions/qa-lab/src/scenario-packs.ts` にあります。`--pack personal-agent` でパックを実行します。

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` は繰り返し指定した `--scenario` フラグに追加されます。明示的なシナリオが先に実行され、その後、重複を削除したうえで `QA_PERSONAL_AGENT_SCENARIO_IDS` の順序でパックシナリオが実行されます。

このパックは、`mock-openai` または別のローカル QA プロバイダーレーンと併用する `qa-channel` 向けに設計されています。ライブチャットサービスや実際の個人アカウントを対象にしてはいけません。

## プライバシーモデル

シナリオは、偽のユーザー、偽の設定、偽のシークレット、スイートによって作成される一時 QA gateway ワークスペースのみを使用します。実際の OpenClaw ユーザーメモリ、セッション、認証情報、launch agent、グローバル設定、ライブ gateway 状態を読み書きしてはいけません。

アーティファクトは既存の QA スイートアーティファクトディレクトリ配下に残り、テスト出力として扱う必要があります。編集チェックは偽のマーカーを使用するため、失敗しても安全に調査して issue に記録できます。

## パックの拡張

`qa/scenarios/personal/` 配下に新しい `.yaml` ケースを追加し、そのシナリオ ID を `QA_PERSONAL_AGENT_SCENARIO_IDS` に追加します。各ケースは小さく、ローカルで、`mock-openai` において決定的で、1 つのパーソナルアシスタント動作に集中させてください。

有力なフォローアップ候補:

- 編集済み trajectory エクスポートのチェック
- ローカル専用 Plugin ワークフローのチェック

シナリオカタログに、その surface を正当化できるだけの安定したケースが十分に揃うまでは、新しいランナー、Plugin、依存関係、ライブ transport、モデル judge を追加しないでください。
