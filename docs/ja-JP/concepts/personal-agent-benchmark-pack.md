---
read_when:
    - ローカルの個人エージェント信頼性チェックを実行する
    - リポジトリベースのQAシナリオカタログの拡張
    - リマインダー、返信、メモリ、秘匿化、安全なツールのフォロースルー、タスクステータス、共有しても安全な診断、証拠に裏付けられた完了主張、失敗からの復旧を検証する
summary: プライバシーを保護するパーソナルアシスタントワークフローのチェック用のローカル qa-channel シナリオ。
title: パーソナルエージェントのベンチマークパック
x-i18n:
    generated_at: "2026-07-05T11:14:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack は、ローカルのパーソナルアシスタントワークフロー向けの、小さなリポジトリ管理の QA シナリオパックです。汎用的なモデルベンチマークではなく、新しいランナーも不要です。private QA スタック（[QA 概要](/ja-JP/concepts/qa-e2e-automation)）、合成 [QA チャンネル](/ja-JP/channels/qa-channel)、既存の `qa/scenarios` YAML カタログを再利用します。

## シナリオ

`qa/scenarios/personal/*.yaml` で定義された 10 個のシナリオ:

| シナリオ id                                | チェック                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | local cron 配信を通じた偽の個人リマインダー                                          |
| `personal-channel-thread-reply`            | `qa-channel` を通じた偽の DM とスレッド返信のルーティング                                        |
| `personal-memory-preference-recall`        | 一時 QA ワークスペースのメモリファイルからの偽の設定リコール                          |
| `personal-redaction-no-secret-leak`        | 偽のシークレット非エコーチェック                                                                   |
| `personal-tool-safety-followthrough`       | 短い承認形式のターン後の、安全な読み取りに裏付けられたツールのフォロースルー                        |
| `personal-approval-denial-stop`            | センシティブなローカル読み取りリクエストに対する承認拒否時の停止動作                             |
| `personal-task-followthrough-status`       | pending、blocked、done を分離して維持する、証拠に裏付けられたタスクステータス報告            |
| `personal-share-safe-diagnostics-artifact` | 生の個人コンテンツを省略しつつ有用なステータスを保持する、共有しても安全な診断アーティファクト |
| `personal-no-fake-progress`                | ローカル証拠が存在する前に偽の進捗を避ける、証拠に裏付けられた完了主張         |
| `personal-failure-recovery`                | 部分的なステータスを報告し、再試行の境界を明確に保つ障害復旧                |

機械可読なパックメタデータ（id リスト、タイトル、説明）は、`QA_PERSONAL_AGENT_SCENARIO_IDS` として `extensions/qa-lab/src/scenario-packs.ts` にあります。
`--pack personal-agent` でパックを実行します。

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` は、繰り返し指定された `--scenario` フラグに追加されます。明示的なシナリオが先に実行され、その後、重複を除いたうえでパックのシナリオが `QA_PERSONAL_AGENT_SCENARIO_IDS` の順序で実行されます。

このパックは、`mock-openai` または別のローカル QA プロバイダーレーンを使って `qa-channel` を対象にします。ライブチャットサービスや実際の個人アカウントを指定しないでください。

## プライバシーモデル

シナリオは、偽のユーザー、偽の設定、偽のシークレット、スイートが作成する一時 QA Gateway ワークスペースのみを使用します。実際の OpenClaw ユーザーメモリ、セッション、資格情報、起動エージェント、グローバル設定、ライブ Gateway 状態を読み書きしてはなりません。

アーティファクトは既存の QA スイートのアーティファクトディレクトリ配下に留まり、テスト出力として扱われます。リダクションチェックでは偽のマーカーを使用するため、失敗しても安全に調査して issue に記録できます。

## パックの拡張

新しい `.yaml` ケースを `qa/scenarios/personal/` 配下に追加し、その後シナリオ id を `QA_PERSONAL_AGENT_SCENARIO_IDS` に追加します。各ケースは小さく、ローカルで、`mock-openai` において決定的で、1 つのパーソナルアシスタント動作に焦点を当てたものにしてください。

適したフォローアップ候補: リダクション済み軌跡エクスポートチェック、ローカル限定の Plugin ワークフローチェック。

シナリオカタログに、そのサーフェスを正当化できるだけの安定したケースが十分に揃うまでは、新しいランナー、Plugin、依存関係、ライブトランスポート、モデルジャッジを追加しないでください。
