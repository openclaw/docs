---
read_when:
    - 誰がエージェントまたはツールを実行したか、いつ実行されたか、そしてどのように終了したかを回答する必要があります。
    - 範囲が限定され、リダクション安全なアクティビティエクスポートが必要です
summary: メタデータのみのエージェント実行およびツールアクション監査レコードの CLI リファレンス
title: 監査レコード
x-i18n:
    generated_at: "2026-07-06T21:47:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f3163f5fe4d1e15c2364d71927299caad4fd8a2b0101347cecab5d4d97f11c0
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

エージェント実行とツールアクションについて、Gateway のメタデータのみの監査台帳をクエリします。

記録はデフォルトで有効です。新しい書き込みを停止するには、[`audit.enabled: false`](/ja-JP/gateway/configuration-reference#audit)
を設定します。既存のレコードは期限切れになるまで（30日間）クエリ可能なままです。
台帳は会話トランスクリプトとは別です。ID、
順序、出所、アクション、ステータス、正規化されたエラーコードを記録しますが、プロンプト、メッセージ、ツール引数、ツール結果、コマンド出力、生のエラーテキストは
保存しません。

Gateway は、境界付きのバックグラウンドライターを通じて、共有 OpenClaw 状態データベースにレコードを書き込みます。
クエリは 30 日より古いレコードを返さず、
台帳は 100,000 行に制限されます。期限切れの行は、
Gateway 起動時、毎時のメンテナンス時、および以後の書き込み時に削除されます。

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
```

## フィルター

- `--agent <id>`: 正確なエージェント ID
- `--session <key>`: 正確なセッションキー
- `--run <id>`: 正確な実行 ID
- `--kind <kind>`: `agent_run` または `tool_action`
- `--status <status>`: `started`、`succeeded`、`failed`、`cancelled`、
  `timed_out`、`blocked`、または `unknown`
- `--after <timestamp>` / `--before <timestamp>`: 包含的な ISO タイムスタンプまたは
  Unix ミリ秒
- `--limit <count>`: 1 から 500 までのページサイズ。デフォルトは `100`
- `--cursor <sequence>`: 以前の新しい順クエリを続行
- `--json`: 境界付きページを JSON として出力

テキスト出力には、時刻、種類、ステータス、エージェント、実行、アクションが表示されます。ツールアクションでは、
ツール名も表示されます。JSON 出力は同じメタデータの安全な境界付きエクスポートであり、
別のページが存在する場合は `nextCursor` を含みます。その値を
`--cursor` に渡すと、ページング中に到着したレコードを並べ替えずに続行できます。

## 記録されるイベント

Gateway は既存のエージェントイベントストリームを 4 つのアクションに投影します。

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`

すべてのレコードには、安定したイベント ID、単調増加する台帳シーケンス、
元の実行イベントシーケンス、ランタイムが提供する場合はライフサイクルタイムスタンプ
（それ以外の場合は観測時刻）、エージェント/実行の出所、アクター、および
`redaction: "metadata_only"` マーカーがあります。終端レコードは、成功、
失敗、キャンセル、タイムアウト、ポリシーブロックを、閉じたステータスとエラーコードで区別します。
`unknown` は、上流ランタイムが信頼できる終端結果を公開しない場合の明示的な非成功結果です。ツール呼び出し ID は、
安定した一方向フィンガープリントとしてのみエクスポートされます。ツール名はコンパクトな
モデル向け名前契約に一致する必要があります。それ以外の値は `unknown` になります。セッション ID、セッション
キー、実行 ID、および保持されたツール名はオペレーターメタデータです。エクスポートは
運用レコードとして保護してください。

監査台帳は、トランスクリプト、タスク履歴、Cron 実行履歴、
ログを置き換えるものではありません。会話内容を別のストアにコピーすることなく、
オペレーターの質問に対応する小さな実行横断インデックスを提供します。

## Gateway RPC

`audit.list` には `operator.read` が必要で、同じフィルターを受け付けます。例:

```bash
openclaw gateway call audit.list --params '{"agentId":"main","status":"failed","limit":50}'
```

結果は `{ "events": AuditEvent[], "nextCursor"?: string }` です。結果は
新しい順で、リクエストごとに 500 レコードに制限されます。

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol#audit-ledger-rpc)
- [セッション](/ja-JP/cli/sessions)
- [タスク](/ja-JP/cli/tasks)
- [Cron ジョブ](/ja-JP/automation/cron-jobs)
