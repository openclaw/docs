---
read_when:
    - 작업별 프롬프트 없이 실행되는 자율 에이전트 워크플로 설정
    - 에이전트가 독립적으로 수행할 수 있는 작업과 사람의 승인이 필요한 작업 정의
    - 명확한 경계와 에스컬레이션 규칙을 갖춘 다중 프로그램 에이전트 구조화
summary: 자율 에이전트 프로그램을 위한 영구 운영 권한 정의
title: 상시 지시사항
x-i18n:
    generated_at: "2026-04-30T06:16:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

상시 지시는 정의된 프로그램에 대해 에이전트에 **영구 운영 권한**을 부여합니다. 매번 개별 작업 지시를 내리는 대신 명확한 범위, 트리거, 에스컬레이션 규칙이 있는 프로그램을 정의하면, 에이전트는 그 경계 안에서 자율적으로 실행합니다.

이는 매주 금요일마다 어시스턴트에게 "주간 보고서를 보내"라고 말하는 것과 다음과 같이 상시 권한을 부여하는 것의 차이입니다. "주간 보고서는 네가 담당한다. 매주 금요일에 작성해서 보내고, 이상해 보이는 것이 있을 때만 에스컬레이션한다."

## 상시 지시가 필요한 이유

**상시 지시가 없으면:**

- 모든 작업마다 에이전트에 프롬프트를 입력해야 합니다
- 요청 사이에는 에이전트가 유휴 상태로 있습니다
- 반복 작업이 잊히거나 지연됩니다
- 사용자가 병목이 됩니다

**상시 지시가 있으면:**

- 에이전트가 정의된 경계 안에서 자율적으로 실행합니다
- 반복 작업이 프롬프트 없이 일정에 따라 진행됩니다
- 예외와 승인에 대해서만 사용자가 관여합니다
- 에이전트가 유휴 시간을 생산적으로 활용합니다

## 작동 방식

상시 지시는 [에이전트 작업공간](/ko/concepts/agent-workspace) 파일에 정의됩니다. 권장 방식은 이를 `AGENTS.md`에 직접 포함하는 것입니다. `AGENTS.md`는 모든 세션에 자동으로 주입되므로 에이전트가 항상 이를 컨텍스트에 포함합니다. 더 큰 구성의 경우 `standing-orders.md` 같은 전용 파일에 배치하고 `AGENTS.md`에서 참조할 수도 있습니다.

각 프로그램은 다음을 지정합니다.

1. **범위** — 에이전트가 수행할 권한이 있는 작업
2. **트리거** — 실행 시점(일정, 이벤트 또는 조건)
3. **승인 게이트** — 실행 전에 사람의 승인이 필요한 항목
4. **에스컬레이션 규칙** — 멈추고 도움을 요청해야 하는 시점

에이전트는 작업공간 부트스트랩 파일을 통해 모든 세션에서 이러한 지시를 로드하고(자동 주입 파일의 전체 목록은 [Agent Workspace](/ko/concepts/agent-workspace) 참조), 시간 기반 강제를 위해 [Cron 작업](/ko/automation/cron-jobs)과 결합하여 이를 실행합니다.

<Tip>
상시 지시를 `AGENTS.md`에 넣어 모든 세션에서 로드되도록 보장하세요. 작업공간 부트스트랩은 `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`를 자동으로 주입하지만, 하위 디렉터리의 임의 파일은 주입하지 않습니다.
</Tip>

## 상시 지시의 구조

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

## 상시 지시와 Cron 작업

상시 지시는 에이전트가 수행할 권한이 있는 **무엇**을 정의합니다. [Cron 작업](/ko/automation/cron-jobs)은 그것이 발생하는 **시점**을 정의합니다. 둘은 함께 작동합니다.

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron 작업 프롬프트는 내용을 중복하지 말고 상시 지시를 참조해야 합니다.

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

### 예시 1: 콘텐츠와 소셜 미디어(주간 주기)

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

### 예시 2: 재무 운영(이벤트 트리거)

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

### 예시 3: 모니터링과 알림(지속적)

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

## 실행-검증-보고 패턴

상시 지시는 엄격한 실행 규율과 결합할 때 가장 잘 작동합니다. 상시 지시의 모든 작업은 다음 루프를 따라야 합니다.

1. **실행** — 실제 작업을 수행합니다(지시를 단순히 확인만 하지 않음)
2. **검증** — 결과가 올바른지 확인합니다(파일 존재, 메시지 전달, 데이터 파싱)
3. **보고** — 무엇을 수행했고 무엇을 검증했는지 소유자에게 알립니다

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

이 패턴은 에이전트의 가장 흔한 실패 모드, 즉 작업을 완료하지 않고 확인만 하는 일을 방지합니다.

## 다중 프로그램 아키텍처

여러 관심사를 관리하는 에이전트의 경우 상시 지시를 명확한 경계가 있는 별도 프로그램으로 구성하세요.

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

- 자체 **트리거 주기**(주간, 월간, 이벤트 기반, 지속적)
- 자체 **승인 게이트**(일부 프로그램은 다른 프로그램보다 더 많은 감독이 필요함)
- 명확한 **경계**(에이전트가 한 프로그램이 끝나는 지점과 다른 프로그램이 시작되는 지점을 알아야 함)

## 모범 사례

### 권장 사항

- 좁은 권한으로 시작하고 신뢰가 쌓이면 확장하세요
- 고위험 작업에 대해 명시적인 승인 게이트를 정의하세요
- "하지 말아야 할 일" 섹션을 포함하세요. 경계는 권한만큼 중요합니다
- 신뢰할 수 있는 시간 기반 실행을 위해 Cron 작업과 결합하세요
- 에이전트 로그를 매주 검토하여 상시 지시가 준수되고 있는지 확인하세요
- 필요가 변화하면 상시 지시를 업데이트하세요. 이는 살아 있는 문서입니다

### 피해야 할 사항

- 첫날부터 광범위한 권한을 부여하지 마세요("네가 최선이라고 생각하는 대로 해")
- 에스컬레이션 규칙을 생략하지 마세요. 모든 프로그램에는 "언제 멈추고 물어볼지"에 대한 조항이 필요합니다
- 에이전트가 구두 지시를 기억한다고 가정하지 마세요. 모든 것을 파일에 넣으세요
- 하나의 프로그램에 여러 관심사를 섞지 마세요. 별도 도메인에는 별도 프로그램을 사용하세요
- Cron 작업으로 강제하는 것을 잊지 마세요. 트리거 없는 상시 지시는 제안에 그칩니다

## 관련 문서

- [자동화 및 작업](/ko/automation): 모든 자동화 메커니즘을 한눈에 볼 수 있습니다.
- [Cron 작업](/ko/automation/cron-jobs): 상시 지시를 위한 일정 강제입니다.
- [훅](/ko/automation/hooks): 에이전트 수명 주기 이벤트를 위한 이벤트 기반 스크립트입니다.
- [Webhook](/ko/automation/cron-jobs#webhooks): 인바운드 HTTP 이벤트 트리거입니다.
- [에이전트 작업공간](/ko/concepts/agent-workspace): 자동 주입 부트스트랩 파일(`AGENTS.md`, `SOUL.md` 등)의 전체 목록을 포함하여 상시 지시가 위치하는 곳입니다.
