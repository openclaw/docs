---
read_when:
    - 작업별 프롬프트 없이 실행되는 자율 에이전트 워크플로 설정하기
    - 에이전트가 독립적으로 수행할 수 있는 작업과 사람의 승인이 필요한 작업 정의하기
    - 명확한 경계와 에스컬레이션 규칙을 갖춘 다중 프로그램 에이전트 구성하기
summary: 자율 에이전트 프로그램에 대한 영구 운영 권한 정의
title: 상설 지침
x-i18n:
    generated_at: "2026-04-25T05:56:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

상설 지침은 정의된 프로그램에 대해 에이전트에 **영구 운영 권한**을 부여합니다. 매번 개별 작업 지시를 내리는 대신, 명확한 범위, 트리거, 에스컬레이션 규칙을 갖춘 프로그램을 정의하면 에이전트가 그 경계 내에서 자율적으로 실행합니다.

이는 매주 금요일마다 보조자에게 "주간 보고서를 보내"라고 지시하는 것과, 상설 권한을 부여하는 것의 차이입니다. 예: "주간 보고서는 네 책임이다. 매주 금요일에 작성해서 보내고, 뭔가 이상해 보일 때만 에스컬레이션해."

## 왜 상설 지침이 필요한가?

**상설 지침이 없을 때:**

- 모든 작업마다 에이전트에 프롬프트를 보내야 합니다
- 에이전트는 요청 사이에 유휴 상태로 머뭅니다
- 반복 업무가 잊히거나 지연됩니다
- 당신이 병목이 됩니다

**상설 지침이 있을 때:**

- 에이전트가 정의된 경계 내에서 자율적으로 실행합니다
- 반복 업무가 프롬프트 없이 일정에 따라 수행됩니다
- 예외와 승인만 직접 개입하면 됩니다
- 에이전트가 유휴 시간을 생산적으로 활용합니다

## 작동 방식

상설 지침은 [agent workspace](/ko/concepts/agent-workspace) 파일에 정의됩니다. 권장 방식은 이를 `AGENTS.md`에 직접 포함하는 것입니다(`AGENTS.md`는 매 세션 자동 주입됨). 이렇게 하면 에이전트가 항상 이를 컨텍스트에 포함합니다. 더 큰 설정의 경우 `standing-orders.md` 같은 전용 파일에 둘 수도 있고, `AGENTS.md`에서 이를 참조할 수도 있습니다.

각 프로그램은 다음을 지정합니다.

1. **범위** — 에이전트가 수행하도록 권한이 부여된 작업
2. **트리거** — 실행 시점(일정, 이벤트 또는 조건)
3. **승인 게이트** — 수행 전에 사람의 승인이 필요한 항목
4. **에스컬레이션 규칙** — 멈추고 도움을 요청해야 하는 시점

에이전트는 워크스페이스 부트스트랩 파일을 통해 매 세션 이 지침을 불러오고([Agent Workspace](/ko/concepts/agent-workspace)에서 자동 주입 파일 전체 목록 확인), 시간 기반 강제를 위해 [Cron 작업](/ko/automation/cron-jobs)과 함께 이를 실행합니다.

<Tip>
상설 지침은 `AGENTS.md`에 두어 매 세션 로드되도록 보장하세요. 워크스페이스 부트스트랩은 `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`를 자동 주입하지만, 하위 디렉터리의 임의 파일은 자동 주입하지 않습니다.
</Tip>

## 상설 지침의 구성 요소

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

## 상설 지침 + Cron 작업

상설 지침은 에이전트가 수행하도록 권한이 부여된 **무엇**을 정의합니다. [Cron 작업](/ko/automation/cron-jobs)은 **언제** 수행되는지를 정의합니다. 둘은 함께 작동합니다.

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron 작업 프롬프트는 상설 지침을 중복 작성하는 대신 이를 참조해야 합니다.

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

## 예시

### 예시 1: 콘텐츠 및 소셜 미디어(주간 주기)

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

### 예시 2: 재무 운영(이벤트 트리거)

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

### 예시 3: 모니터링 및 알림(연속)

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

## Execute-Verify-Report 패턴

상설 지침은 엄격한 실행 규율과 결합될 때 가장 효과적입니다. 상설 지침의 모든 작업은 다음 루프를 따라야 합니다.

1. **실행** — 실제 작업을 수행합니다(지시를 확인만 하지 않음)
2. **검증** — 결과가 올바른지 확인합니다(파일 존재, 메시지 전달, 데이터 파싱)
3. **보고** — 무엇을 했고 무엇을 검증했는지 소유자에게 알립니다

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

이 패턴은 가장 흔한 에이전트 실패 모드, 즉 작업을 완료하지 않고 확인만 하는 문제를 방지합니다.

## 다중 프로그램 아키텍처

여러 관심사를 관리하는 에이전트의 경우, 상설 지침을 명확한 경계를 가진 별도의 프로그램으로 구성하세요.

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

각 프로그램에는 다음이 있어야 합니다.

- 자체 **트리거 주기**(주간, 월간, 이벤트 기반, 연속)
- 자체 **승인 게이트**(일부 프로그램은 더 많은 감독이 필요함)
- 명확한 **경계**(에이전트가 한 프로그램이 끝나고 다른 프로그램이 시작되는 지점을 알아야 함)

## 모범 사례

### 권장 사항

- 좁은 권한부터 시작하고 신뢰가 쌓이면 확장하세요
- 고위험 작업에는 명시적인 승인 게이트를 정의하세요
- "하지 말아야 할 것" 섹션을 포함하세요 — 경계는 권한만큼 중요합니다
- 신뢰할 수 있는 시간 기반 실행을 위해 Cron 작업과 결합하세요
- 에이전트 로그를 매주 검토하여 상설 지침이 준수되고 있는지 확인하세요
- 필요에 따라 상설 지침을 업데이트하세요 — 이는 살아 있는 문서입니다

### 피해야 할 사항

- 첫날부터 광범위한 권한을 부여하지 마세요("최선이라고 생각하는 대로 뭐든 해")
- 에스컬레이션 규칙을 생략하지 마세요 — 모든 프로그램에는 "언제 멈추고 물어볼지" 조항이 필요합니다
- 에이전트가 구두 지시를 기억할 것이라 가정하지 마세요 — 모든 내용을 파일에 적으세요
- 하나의 프로그램에 여러 관심사를 섞지 마세요 — 별도의 도메인은 별도의 프로그램으로 분리하세요
- Cron 작업으로 강제하는 것을 잊지 마세요 — 트리거 없는 상설 지침은 제안에 불과합니다

## 관련 항목

- [Automation & Tasks](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [Cron Jobs](/ko/automation/cron-jobs) — 상설 지침을 위한 일정 강제
- [Hooks](/ko/automation/hooks) — 에이전트 라이프사이클 이벤트를 위한 이벤트 기반 스크립트
- [Webhooks](/ko/automation/cron-jobs#webhooks) — 인바운드 HTTP 이벤트 트리거
- [Agent Workspace](/ko/concepts/agent-workspace) — 상설 지침이 위치하는 곳과 자동 주입되는 부트스트랩 파일 전체 목록(AGENTS.md, SOUL.md 등)
