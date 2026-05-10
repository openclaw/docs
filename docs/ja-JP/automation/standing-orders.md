---
read_when:
    - タスクごとのプロンプトなしで実行される自律エージェントワークフローの設定
    - エージェントが独立して実行できることと、人間の承認が必要なことを定義する
    - 明確な境界とエスカレーションルールでマルチプログラムエージェントを構造化する
summary: 自律エージェントプログラムの恒久的な運用権限を定義する
title: 継続的な指示
x-i18n:
    generated_at: "2026-05-10T19:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

スタンディングオーダーは、定義済みのプログラムに対してエージェントに**恒久的な運用権限**を付与します。毎回個別のタスク指示を出す代わりに、明確なスコープ、トリガー、エスカレーションルールを持つプログラムを定義し、その境界内でエージェントが自律的に実行します。

これは、毎週金曜日にアシスタントへ「週次レポートを送って」と指示することと、スタンディング権限として「週次レポートはあなたが担当する。毎週金曜日に作成して送信し、何か異常がある場合だけエスカレーションする」と付与することの違いです。

## スタンディングオーダーが必要な理由

**スタンディングオーダーがない場合:**

- すべてのタスクについてエージェントにプロンプトを出す必要がある
- リクエストの間、エージェントは待機したままになる
- 定型作業が忘れられたり遅れたりする
- あなたがボトルネックになる

**スタンディングオーダーがある場合:**

- エージェントは定義済みの境界内で自律的に実行する
- 定型作業がプロンプトなしでスケジュール通りに行われる
- あなたが関与するのは例外や承認だけになる
- エージェントがアイドル時間を生産的に使う

## 仕組み

スタンディングオーダーは、[エージェントワークスペース](/ja-JP/concepts/agent-workspace)のファイルで定義します。推奨される方法は、`AGENTS.md`（各セッションで自動注入される）に直接含めることです。これにより、エージェントは常にそれらをコンテキスト内に持てます。より大きな設定では、`standing-orders.md` のような専用ファイルに置き、`AGENTS.md` から参照することもできます。

各プログラムでは次を指定します。

1. **スコープ** - エージェントに実行が許可されていること
2. **トリガー** - いつ実行するか（スケジュール、イベント、条件）
3. **承認ゲート** - 実行前に人間のサインオフが必要なこと
4. **エスカレーションルール** - いつ停止して助けを求めるか

エージェントはワークスペースのブートストラップファイルを通じて各セッションでこれらの指示を読み込み（自動注入されるファイルの完全な一覧は[エージェントワークスペース](/ja-JP/concepts/agent-workspace)を参照）、時間ベースの強制には[cron ジョブ](/ja-JP/automation/cron-jobs)と組み合わせて実行します。

<Tip>
スタンディングオーダーは `AGENTS.md` に置くと、各セッションで読み込まれることを保証できます。ワークスペースブートストラップは `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md` を自動注入しますが、サブディレクトリ内の任意のファイルは注入しません。
</Tip>

## スタンディングオーダーの構成

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## スタンディングオーダーと cron ジョブ

スタンディングオーダーは、エージェントに実行が許可されている**内容**を定義します。[cron ジョブ](/ja-JP/automation/cron-jobs)は、それが**いつ**行われるかを定義します。これらは連携して動作します。

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

cron ジョブのプロンプトは、内容を重複させるのではなく、スタンディングオーダーを参照するべきです。

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## 例

### 例 1: コンテンツとソーシャルメディア（週次サイクル）

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### 例 2: 財務オペレーション（イベントトリガー）

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### 例 3: 監視とアラート（継続）

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## 実行・検証・報告パターン

スタンディングオーダーは、厳格な実行規律と組み合わせると最も効果的です。スタンディングオーダー内のすべてのタスクは、次のループに従うべきです。

1. **実行** - 実際の作業を行う（指示を承認するだけにしない）
2. **検証** - 結果が正しいことを確認する（ファイルが存在する、メッセージが配信された、データが解析された）
3. **報告** - 何を実行し、何を検証したかを所有者に伝える

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

このパターンは、タスクを完了せずに承認だけするという、最も一般的なエージェントの失敗モードを防ぎます。

## 複数プログラムのアーキテクチャ

複数の関心事を管理するエージェントでは、スタンディングオーダーを明確な境界を持つ個別のプログラムとして整理します。

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

各プログラムには次が必要です。

- 独自の**トリガー頻度**（週次、月次、イベント駆動、継続）
- 独自の**承認ゲート**（プログラムによって必要な監督の程度は異なる）
- 明確な**境界**（エージェントは、あるプログラムがどこで終わり、別のプログラムがどこから始まるかを知っているべき）

## ベストプラクティス

### 推奨

- 狭い権限から始め、信頼が高まるにつれて拡張する
- 高リスクなアクションには明示的な承認ゲートを定義する
- 「やってはいけないこと」セクションを含める。境界は権限と同じくらい重要
- cron ジョブと組み合わせて、信頼できる時間ベースの実行を行う
- エージェントログを毎週確認し、スタンディングオーダーが守られていることを検証する
- ニーズの変化に合わせてスタンディングオーダーを更新する。これは生きたドキュメントです

### 避けること

- 初日に広範な権限を付与する（「最善だと思うことを何でもして」）
- エスカレーションルールを省略する。すべてのプログラムには「いつ停止して尋ねるか」の条項が必要
- エージェントが口頭指示を覚えていると仮定する。すべてをファイルに書く
- 1つのプログラムに関心事を混在させる。異なるドメインには別々のプログラムを用意する
- cron ジョブでの強制を忘れる。トリガーのないスタンディングオーダーは提案になってしまう

## 関連

- [自動化とタスク](/ja-JP/automation): すべての自動化メカニズムの概要。
- [cron ジョブ](/ja-JP/automation/cron-jobs): スタンディングオーダーのスケジュール強制。
- [フック](/ja-JP/automation/hooks): エージェントライフサイクルイベント向けのイベント駆動スクリプト。
- [Webhook](/ja-JP/automation/cron-jobs#webhooks): 受信 HTTP イベントトリガー。
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace): スタンディングオーダーが置かれる場所。自動注入されるブートストラップファイル（`AGENTS.md`、`SOUL.md` など）の完全な一覧を含みます。
