---
read_when:
    - タスクごとのプロンプトなしで実行される自律エージェントワークフローを設定する
    - エージェントが独立して実行できることと、人間の承認が必要なことを定義する
    - 明確な境界とエスカレーションルールを備えたマルチプログラムエージェントを構築する
summary: 自律エージェントプログラムの恒久的な運用権限を定義する
title: 常設命令
x-i18n:
    generated_at: "2026-04-24T04:45:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

常設命令は、定義されたプログラムに対してエージェントに**恒久的な運用権限**を付与します。毎回個別のタスク指示を出す代わりに、明確なスコープ、トリガー、エスカレーションルールを持つプログラムを定義し、エージェントはその境界内で自律的に実行します。

これは、毎週金曜日にアシスタントへ「週次レポートを送って」と伝えるのと、次のように常設権限を与えることの違いです。「週次レポートはあなたの担当です。毎週金曜日にまとめて送信し、何かおかしい場合だけエスカレーションしてください。」

## なぜ常設命令なのか？

**常設命令がない場合:**

- タスクごとにエージェントへプロンプトを送る必要がある
- エージェントはリクエストの合間に待機したままになる
- 定型業務が忘れられたり遅れたりする
- あなた自身がボトルネックになる

**常設命令がある場合:**

- エージェントは定義された境界内で自律的に実行する
- 定型業務がプロンプトなしでスケジュールどおりに実行される
- あなたが関与するのは例外と承認のときだけになる
- エージェントが待機時間を生産的に埋める

## 仕組み

常設命令は、[agent workspace](/ja-JP/concepts/agent-workspace) のファイル内で定義されます。推奨される方法は、毎セッション自動注入される `AGENTS.md` に直接含めることです。これにより、エージェントは常にそれらをコンテキストとして持てます。より大規模な構成では、`standing-orders.md` のような専用ファイルに配置し、`AGENTS.md` から参照することもできます。

各プログラムでは、次を指定します。

1. **スコープ** — エージェントが実行を許可されていること
2. **トリガー** — いつ実行するか（スケジュール、イベント、または条件）
3. **承認ゲート** — 実行前に人間の承認が必要なこと
4. **エスカレーションルール** — 停止して助けを求めるべきタイミング

エージェントは、ワークスペースのブートストラップファイルを通じて毎セッションこれらの指示を読み込み（自動注入されるファイルの完全な一覧は [Agent Workspace](/ja-JP/concepts/agent-workspace) を参照）、時間ベースの実行を強制するために [Cron jobs](/ja-JP/automation/cron-jobs) と組み合わせて、それに従って実行します。

<Tip>
常設命令は `AGENTS.md` に置いて、毎セッション確実に読み込まれるようにしてください。ワークスペースのブートストラップは `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md` を自動注入しますが、サブディレクトリ内の任意のファイルは対象外です。
</Tip>

## 常設命令の構成

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## 常設命令 + Cron jobs

常設命令は、エージェントに何を実行する権限があるかという**内容**を定義します。[Cron jobs](/ja-JP/automation/cron-jobs) は、それが**いつ**実行されるかを定義します。両者は次のように連携します。

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron job のプロンプトでは、内容を重複して書くのではなく、常設命令を参照するようにしてください。

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

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

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

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### 例 3: 監視とアラート（継続実行）

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

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Execute-Verify-Report パターン

常設命令は、厳格な実行規律と組み合わせたときに最も効果を発揮します。常設命令内のすべてのタスクは、このループに従うべきです。

1. **実行** — 実際の作業を行う（指示を確認するだけではない）
2. **検証** — 結果が正しいことを確認する（ファイルが存在する、メッセージが配信された、データが解析されたなど）
3. **報告** — 何を行い、何を検証したかをオーナーへ伝える

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

このパターンは、完了せずにタスクを了承してしまうという、エージェントで最もよくある失敗モードを防ぎます。

## マルチプログラムアーキテクチャ

複数の関心領域を管理するエージェントでは、明確な境界を持つ個別のプログラムとして常設命令を整理してください。

```markdown
# Standing Orders

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

- 独自の**トリガー頻度**（週次、月次、イベント駆動、継続実行）
- 独自の**承認ゲート**（他よりも強い監督が必要なプログラムもある）
- 明確な**境界**（どこで一つのプログラムが終わり、別のプログラムが始まるかをエージェントが理解できること）

## ベストプラクティス

### 推奨事項

- 権限は狭い範囲から始め、信頼の構築に応じて拡張する
- 高リスクの操作には明示的な承認ゲートを定義する
- 「してはいけないこと」のセクションを含める — 境界は権限と同じくらい重要
- 信頼性の高い時間ベース実行のために Cron jobs と組み合わせる
- 常設命令が守られていることを確認するため、毎週エージェントログを確認する
- ニーズの変化に合わせて常設命令を更新する — これは生きたドキュメント

### 避けること

- 初日から広範な権限を与えること（「最善だと思うように何でもやって」）
- エスカレーションルールを省略すること — どのプログラムにも「いつ止まって確認を求めるか」の条項が必要
- エージェントが口頭の指示を覚えていると考えること — すべてをファイルに書く
- 単一のプログラムに複数の関心事を混在させること — ドメインごとに別プログラムにする
- Cron jobs での実行強制を忘れること — トリガーのない常設命令は提案にしかならない

## 関連

- [Automation & Tasks](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Cron Jobs](/ja-JP/automation/cron-jobs) — 常設命令のスケジュール実行
- [Hooks](/ja-JP/automation/hooks) — エージェントのライフサイクルイベント向けのイベント駆動スクリプト
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks) — 受信HTTPイベントトリガー
- [Agent Workspace](/ja-JP/concepts/agent-workspace) — 常設命令が配置される場所。自動注入されるブートストラップファイル（AGENTS.md、SOUL.md など）の完全な一覧を含む
