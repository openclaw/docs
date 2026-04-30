---
read_when:
    - タスクごとのプロンプトなしで実行される自律エージェントワークフローの設定
    - エージェントが独立して実行できることと、人間の承認が必要なことを定義する
    - 明確な境界とエスカレーションルールで複数プログラムエージェントを構成する
summary: 自律エージェントプログラムの永続的な運用権限を定義する
title: 常設の指示
x-i18n:
    generated_at: "2026-04-30T04:57:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

常時指示は、定義されたプログラムについてエージェントに**永続的な運用権限**を与えます。毎回個別のタスク指示を出す代わりに、明確なスコープ、トリガー、エスカレーションルールを備えたプログラムを定義し、エージェントはその境界内で自律的に実行します。

これは、毎週金曜日にアシスタントへ「週次レポートを送って」と伝えることと、常時権限を与えることの違いです。「週次レポートはあなたの担当です。毎週金曜日に作成して送信し、何かおかしい場合だけエスカレーションしてください。」

## 常時指示が必要な理由

**常時指示がない場合:**

- すべてのタスクについてエージェントにプロンプトを出す必要がある
- エージェントはリクエストの合間に待機するだけになる
- 定型作業が忘れられたり遅れたりする
- 自分がボトルネックになる

**常時指示がある場合:**

- エージェントは定義された境界内で自律的に実行する
- 定型作業はプロンプトなしでスケジュールどおりに行われる
- 自分が関与するのは例外や承認だけになる
- エージェントはアイドル時間を生産的に使う

## 仕組み

常時指示は [agent workspace](/ja-JP/concepts/agent-workspace) ファイルで定義します。推奨される方法は、`AGENTS.md`（各セッションで自動注入されます）に直接含めることです。これにより、エージェントは常にそれらをコンテキストに持てます。より大きな構成では、`standing-orders.md` のような専用ファイルに配置し、`AGENTS.md` から参照することもできます。

各プログラムでは次を指定します。

1. **スコープ** — エージェントに許可されていること
2. **トリガー** — 実行するタイミング（スケジュール、イベント、または条件）
3. **承認ゲート** — 実行前に人間のサインオフが必要なこと
4. **エスカレーションルール** — 停止して支援を求めるタイミング

エージェントは、ワークスペースのブートストラップファイルを通じて各セッションでこれらの指示を読み込み（自動注入されるファイルの完全な一覧は [Agent Workspace](/ja-JP/concepts/agent-workspace) を参照）、時間ベースの強制には [Cron ジョブ](/ja-JP/automation/cron-jobs) と組み合わせて実行します。

<Tip>
常時指示は `AGENTS.md` に置くと、各セッションで必ず読み込まれます。ワークスペースのブートストラップは `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md` を自動的に注入しますが、サブディレクトリ内の任意のファイルは注入しません。
</Tip>

## 常時指示の構成

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
- Do not skip delivery if metrics look bad — report accurately
```

## 常時指示と Cron ジョブ

常時指示は、エージェントに実行を許可する**内容**を定義します。[Cron ジョブ](/ja-JP/automation/cron-jobs) は、それが発生する**タイミング**を定義します。これらは連携して動作します。

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron ジョブのプロンプトは、内容を重複させるのではなく常時指示を参照するべきです。

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
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
- **Tuesday–Thursday:** Draft social posts, create blog content
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

常時指示は、厳格な実行規律と組み合わせると最も効果的です。常時指示内のすべてのタスクは、次のループに従うべきです。

1. **実行** — 実際の作業を行う（指示を認識するだけではない）
2. **検証** — 結果が正しいことを確認する（ファイルが存在する、メッセージが配信された、データが解析された）
3. **報告** — 何を行い、何を検証したかをオーナーに伝える

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

このパターンは、最も一般的なエージェントの失敗モード、つまりタスクを完了せずに認識だけすることを防ぎます。

## マルチプログラムアーキテクチャ

複数の領域を管理するエージェントでは、常時指示を明確な境界を持つ個別のプログラムとして整理します。

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
- 独自の**承認ゲート**（プログラムによって必要な監督の度合いは異なる）
- 明確な**境界**（エージェントは、あるプログラムがどこで終わり、別のプログラムがどこから始まるかを知っているべきです）

## ベストプラクティス

### すること

- 狭い権限から始め、信頼が構築されるにつれて拡張する
- 高リスクのアクションには明示的な承認ゲートを定義する
- 「してはいけないこと」セクションを含める。境界は権限と同じくらい重要です
- 信頼性の高い時間ベースの実行のために Cron ジョブと組み合わせる
- エージェントログを毎週確認し、常時指示が守られていることを検証する
- ニーズの変化に応じて常時指示を更新する。これは生きたドキュメントです

### 避けること

- 初日に広範な権限を与える（「最善だと思うことを何でもして」）
- エスカレーションルールを省略する。すべてのプログラムには「いつ停止して尋ねるか」の条項が必要です
- エージェントが口頭の指示を覚えていると仮定する。すべてをファイルに入れる
- 1 つのプログラムに複数の関心事を混在させる。別々のドメインには別々のプログラムを使う
- Cron ジョブで強制することを忘れる。トリガーのない常時指示は提案になってしまいます

## 関連

- [自動化とタスク](/ja-JP/automation): すべての自動化メカニズムの概要。
- [Cron ジョブ](/ja-JP/automation/cron-jobs): 常時指示のスケジュール強制。
- [フック](/ja-JP/automation/hooks): エージェントのライフサイクルイベント向けのイベント駆動スクリプト。
- [Webhook](/ja-JP/automation/cron-jobs#webhooks): インバウンド HTTP イベントトリガー。
- [Agent workspace](/ja-JP/concepts/agent-workspace): 常時指示を置く場所。自動注入されるブートストラップファイル（`AGENTS.md`、`SOUL.md` など）の完全な一覧を含みます。
