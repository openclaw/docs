---
read_when:
    - ローカルの個人用エージェントの信頼性チェックを実行する
    - リポジトリで管理される QA シナリオカタログの拡張
    - リマインダー、返信、メモリ、秘匿化、安全なツールの後続処理、タスクステータス、安全に共有できる診断情報、証拠に基づく完了報告、障害復旧の検証
summary: プライバシーを保護するパーソナルアシスタントのワークフロー検証用ローカル qa-channel シナリオ。
title: パーソナルエージェント向けベンチマークパック
x-i18n:
    generated_at: "2026-07-11T22:07:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack は、ローカルの個人アシスタントワークフロー向けに、リポジトリで管理される小規模な QA シナリオパックです。汎用的なモデルベンチマークではなく、新しいランナーも必要ありません。非公開 QA スタック（[QA の概要](/ja-JP/concepts/qa-e2e-automation)）、合成 [QA チャネル](/ja-JP/channels/qa-channel)、既存の `qa/scenarios` YAML カタログを再利用します。

## シナリオ

`qa/scenarios/personal/*.yaml` で定義されている 10 個のシナリオ：

| シナリオ ID                                | チェック内容                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | ローカル Cron 配信による架空の個人リマインダー                                                    |
| `personal-channel-thread-reply`            | `qa-channel` を介した架空の DM およびスレッド返信のルーティング                                   |
| `personal-memory-preference-recall`        | 一時的な QA ワークスペースのメモリファイルからの架空の設定内容の呼び出し                          |
| `personal-redaction-no-secret-leak`        | 架空のシークレットがエコーバックされないことのチェック                                            |
| `personal-tool-safety-followthrough`       | 短い承認形式のターン後に、安全な読み取りを根拠としてツール処理を最後まで実行すること               |
| `personal-approval-denial-stop`            | 機密性の高いローカル読み取り要求に対する承認拒否時の停止動作                                      |
| `personal-task-followthrough-status`       | 保留中、ブロック中、完了を区別する、証拠に基づくタスクステータス報告                              |
| `personal-share-safe-diagnostics-artifact` | 生の個人情報を省きつつ有用なステータスを保持する、安全に共有できる診断アーティファクト             |
| `personal-no-fake-progress`                | ローカルの証拠が存在する前に偽の進捗を示さない、証拠に基づく完了の表明                            |
| `personal-failure-recovery`                | 部分的なステータスを報告し、再試行の境界を明確に保つ障害復旧                                      |

機械可読なパックメタデータ（ID リスト、タイトル、説明）は、`extensions/qa-lab/src/scenario-packs.ts` の `QA_PERSONAL_AGENT_SCENARIO_IDS` にあります。`--pack personal-agent` を指定してパックを実行します：

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` は、繰り返し指定された `--scenario` フラグに追加されます。明示的なシナリオが先に実行され、その後、重複を除いたパックのシナリオが `QA_PERSONAL_AGENT_SCENARIO_IDS` の順序で実行されます。

このパックは、`mock-openai` または別のローカル QA プロバイダーレーンと組み合わせた `qa-channel` を対象としています。ライブチャットサービスや実在する個人アカウントを対象にしないでください。

## プライバシーモデル

シナリオでは、架空のユーザー、架空の設定内容、架空のシークレット、およびスイートによって作成される一時的な QA Gateway ワークスペースのみを使用します。実際の OpenClaw ユーザーのメモリ、セッション、認証情報、起動エージェント、グローバル設定、または稼働中の Gateway の状態を読み書きしてはなりません。

アーティファクトは既存の QA スイートのアーティファクトディレクトリ内に保持され、テスト出力として扱われます。秘匿化チェックでは架空のマーカーを使用するため、失敗時にも安全に調査して Issue に記録できます。

## パックの拡張

`qa/scenarios/personal/` に新しい `.yaml` ケースを追加してから、そのシナリオ ID を `QA_PERSONAL_AGENT_SCENARIO_IDS` に追加します。各ケースは小規模かつローカルで、`mock-openai` において決定論的に動作し、個人アシスタントの 1 つの動作に焦点を絞ってください。

有望な追加候補：秘匿化された軌跡のエクスポートチェック、ローカル専用 Plugin ワークフローのチェック。

シナリオカタログに、そのインターフェースを正当化できるだけの安定したケースが蓄積されるまでは、新しいランナー、Plugin、依存関係、ライブトランスポート、モデルジャッジを追加しないでください。
