---
read_when:
    - 백그라운드 작업 또는 웨이크업 예약하기
    - 외부 트리거(Webhook, Gmail)를 OpenClaw에 연결하기
    - 예약된 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
summary: Gateway 스케줄러용 예약 작업, Webhook, 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-04-23T13:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# 예약된 작업(Cron)

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 영속적으로 저장하고, 적절한 시점에 에이전트를 깨우며, 결과를 채팅 채널이나 Webhook 엔드포인트로 다시 전달할 수 있습니다.

## 빠른 시작

```bash
# 일회성 리마인더 추가
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# 작업 확인
openclaw cron list
openclaw cron show <job-id>

# 실행 기록 확인
openclaw cron runs --id <job-id>
```

## cron 작동 방식

- Cron은 **모델 내부가 아니라 Gateway 프로세스 내부에서** 실행됩니다.
- 작업 정의는 `~/.openclaw/cron/jobs.json`에 영속 저장되므로 재시작해도 일정이 사라지지 않습니다.
- 런타임 실행 상태는 그 옆의 `~/.openclaw/cron/jobs-state.json`에 영속 저장됩니다. cron 정의를 git으로 관리한다면 `jobs.json`은 추적하고 `jobs-state.json`은 gitignore에 추가하세요.
- 분리 이후에는 이전 OpenClaw 버전이 `jobs.json`은 읽을 수 있지만, 런타임 필드가 이제 `jobs-state.json`에 있으므로 작업을 새 작업처럼 취급할 수 있습니다.
- 모든 cron 실행은 [백그라운드 작업](/ko/automation/tasks) 레코드를 생성합니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다.
- 격리된 cron 실행은 완료 시 해당 `cron:<jobId>` 세션에 대해 추적 중인 브라우저 탭/프로세스를 최선의 노력으로 종료하므로, 분리된 브라우저 자동화가 고아 프로세스를 남기지 않습니다.
- 격리된 cron 실행은 오래된 확인 응답도 방지합니다. 첫 번째 결과가 단지 중간 상태 업데이트(`on it`, `pulling everything together` 같은 힌트)일 뿐이고, 최종 응답을 담당하는 하위 에이전트 실행이 더 이상 남아 있지 않다면, OpenClaw는 전달 전에 실제 결과를 한 번 더 요청합니다.

<a id="maintenance"></a>

cron의 작업 조정은 런타임 소유입니다. 이전 자식 세션 행이 여전히 존재하더라도, 활성 cron 작업은 cron 런타임이 해당 작업을 실행 중으로 추적하는 동안 계속 활성 상태로 유지됩니다.
런타임이 더 이상 해당 작업을 소유하지 않고 5분 유예 시간이 지나면, 유지 관리가 작업을 `lost`로 표시할 수 있습니다.

## 일정 유형

| 종류    | CLI 플래그 | 설명                                                   |
| ------- | ---------- | ------------------------------------------------------ |
| `at`    | `--at`     | 일회성 시각(ISO 8601 또는 `20m` 같은 상대 시간)        |
| `every` | `--every`  | 고정 간격                                              |
| `cron`  | `--cron`   | 선택적 `--tz`와 함께 사용하는 5필드 또는 6필드 cron 식 |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 로컬 벽시계 기준 일정으로 예약하려면 `--tz America/New_York`를 추가하세요.

정각마다 반복되는 식은 부하 급증을 줄이기 위해 최대 5분까지 자동으로 분산됩니다. 정확한 시각에 맞추려면 `--exact`를 사용하고, 명시적인 분산 범위를 지정하려면 `--stagger 30s`를 사용하세요.

### 일(day-of-month)과 요일(day-of-week)은 OR 로직을 사용합니다

Cron 식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. day-of-month와 day-of-week 필드가 둘 다 와일드카드가 아닐 경우, croner는 **두 필드가 모두 일치할 때가 아니라 둘 중 하나가 일치할 때** 매칭합니다. 이는 표준 Vixie cron 동작입니다.

```
# 의도: "15일 오전 9시, 단 월요일인 경우에만"
# 실제: "매월 15일 오전 9시, 그리고 매주 월요일 오전 9시"
0 9 15 * 1
```

이 식은 월 0~1회가 아니라 월 약 5~6회 실행됩니다. OpenClaw는 여기서 Croner의 기본 OR 동작을 사용합니다. 두 조건을 모두 요구하려면 Croner의 `+` day-of-week 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드만으로 예약한 뒤 작업의 프롬프트나 명령에서 다른 조건을 검사하세요.

## 실행 방식

| 방식           | `--session` 값      | 실행 위치                | 적합한 용도                    |
| -------------- | ------------------- | ------------------------ | ------------------------------ |
| 메인 세션      | `main`              | 다음 Heartbeat 턴        | 리마인더, 시스템 이벤트        |
| 격리           | `isolated`          | 전용 `cron:<jobId>`      | 보고서, 백그라운드 작업        |
| 현재 세션      | `current`           | 생성 시점에 바인딩       | 컨텍스트 인식 반복 작업        |
| 사용자 지정 세션 | `session:custom-id` | 영속적인 이름 있는 세션 | 기록을 기반으로 하는 워크플로 |

**메인 세션** 작업은 시스템 이벤트를 큐에 넣고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). **격리된** 작업은 새 세션으로 전용 에이전트 턴을 실행합니다. **사용자 지정 세션**(`session:xxx`)은 실행 간 컨텍스트를 유지하므로, 이전 요약을 기반으로 이어지는 일일 스탠드업 같은 워크플로를 가능하게 합니다.

격리된 작업의 경우, 런타임 정리에는 이제 해당 cron 세션에 대한 최선의 노력 기반 브라우저 정리가 포함됩니다. 실제 cron 결과가 우선되도록 정리 실패는 무시됩니다.

격리된 cron 실행은 공유 런타임 정리 경로를 통해 작업을 위해 생성된 번들 MCP 런타임 인스턴스도 모두 해제합니다. 이는 메인 세션과 사용자 지정 세션의 MCP 클라이언트가 정리되는 방식과 일치하므로, 격리된 cron 작업이 stdio 자식 프로세스나 장시간 유지되는 MCP 연결을 실행 간 누수시키지 않습니다.

격리된 cron 실행이 하위 에이전트를 조정할 때는, 전달 시 오래된 상위 중간 텍스트보다 최종 하위 출력이 우선됩니다. 하위 항목이 아직 실행 중이면, OpenClaw는 해당 부분적인 상위 업데이트를 알리는 대신 억제합니다.

### 격리된 작업의 페이로드 옵션

- `--message`: 프롬프트 텍스트(격리 실행에서는 필수)
- `--model` / `--thinking`: 모델 및 사고 수준 재정의
- `--light-context`: 작업 공간 부트스트랩 파일 주입 건너뛰기
- `--tools exec,read`: 작업이 사용할 수 있는 도구 제한

`--model`은 해당 작업에 대해 선택된 허용 모델을 사용합니다. 요청한 모델이 허용되지 않으면 cron은 경고를 기록하고, 대신 작업의 에이전트/기본 모델 선택으로 대체합니다. 구성된 fallback 체인은 계속 적용되지만, 명시적인 작업별 fallback 목록 없이 단순한 모델 재정의를 사용할 경우 더 이상 에이전트의 기본 모델이 숨겨진 추가 재시도 대상으로 덧붙지 않습니다.

격리된 작업의 모델 선택 우선순위는 다음과 같습니다.

1. Gmail hook 모델 재정의(실행이 Gmail에서 왔고 해당 재정의가 허용되는 경우)
2. 작업별 페이로드 `model`
3. 저장된 cron 세션 모델 재정의
4. 에이전트/기본 모델 선택

빠른 모드도 해결된 라이브 선택을 따릅니다. 선택된 모델 구성에 `params.fastMode`가 있으면, 격리된 cron은 이를 기본값으로 사용합니다. 저장된 세션 `fastMode` 재정의는 어느 방향이든 구성보다 여전히 우선합니다.

격리된 실행이 라이브 모델 전환 handoff에 도달하면, cron은 전환된 provider/model로 다시 시도하고 재시도 전에 해당 라이브 선택을 영속 저장합니다. 전환에 새 인증 프로필도 포함되어 있으면, cron은 그 인증 프로필 재정의도 영속 저장합니다. 재시도 횟수는 제한됩니다. 초기 시도와 최대 2회의 전환 재시도 후에는 무한 반복 대신 중단됩니다.

## 전달 및 출력

| 모드       | 동작                                                               |
| ---------- | ------------------------------------------------------------------ |
| `announce` | 에이전트가 전송하지 않은 경우 최종 텍스트를 대상으로 대체 전달     |
| `webhook`  | 완료된 이벤트 페이로드를 URL로 POST                                |
| `none`     | 러너의 대체 전달 없음                                              |

채널로 전달하려면 `--announce --channel telegram --to "-1001234567890"`을 사용하세요. Telegram 포럼 토픽의 경우 `-1001234567890:topic:123`을 사용하세요. Slack/Discord/Mattermost 대상은 명시적인 접두사(`channel:<id>`, `user:<id>`)를 사용해야 합니다.

격리된 작업의 경우 채팅 전달은 공유됩니다. 채팅 라우트가 사용 가능하다면, 작업이 `--no-deliver`를 사용하더라도 에이전트는 `message` 도구를 사용할 수 있습니다. 에이전트가 구성된/현재 대상에 전송하면 OpenClaw는 대체 announce를 건너뜁니다. 그렇지 않으면 `announce`, `webhook`, `none`은 에이전트 턴 이후 최종 응답을 러너가 어떻게 처리할지만 제어합니다.

실패 알림은 별도의 대상 경로를 따릅니다.

- `cron.failureDestination`은 실패 알림의 전역 기본값을 설정합니다.
- `job.delivery.failureDestination`은 작업별로 이를 재정의합니다.
- 둘 다 설정되지 않았고 작업이 이미 `announce`로 전달 중인 경우, 이제 실패 알림은 해당 기본 announce 대상으로 대체됩니다.
- `delivery.failureDestination`은 기본 전달 모드가 `webhook`인 경우를 제외하면 `sessionTarget="isolated"` 작업에서만 지원됩니다.

## CLI 예제

일회성 리마인더(메인 세션):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

전달이 포함된 반복 격리 작업:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

모델 및 사고 수준 재정의가 있는 격리 작업:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Gateway는 외부 트리거를 위한 HTTP Webhook 엔드포인트를 노출할 수 있습니다. 구성에서 활성화하세요.

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 인증

모든 요청은 헤더를 통해 hook 토큰을 포함해야 합니다.

- `Authorization: Bearer <token>`(권장)
- `x-openclaw-token: <token>`

쿼리 문자열 토큰은 거부됩니다.

### POST /hooks/wake

메인 세션에 대한 시스템 이벤트를 큐에 넣습니다.

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`(필수): 이벤트 설명
- `mode`(선택 사항): `now`(기본값) 또는 `next-heartbeat`

### POST /hooks/agent

격리된 에이전트 턴을 실행합니다.

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

필드: `message`(필수), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### 매핑된 hook(POST /hooks/\<name\>)

사용자 지정 hook 이름은 구성의 `hooks.mappings`를 통해 해석됩니다. 매핑은 템플릿이나 코드 변환을 사용해 임의의 페이로드를 `wake` 또는 `agent` 동작으로 변환할 수 있습니다.

### 보안

- hook 엔드포인트는 loopback, tailnet 또는 신뢰할 수 있는 리버스 프록시 뒤에 두세요.
- 전용 hook 토큰을 사용하고, gateway 인증 토큰을 재사용하지 마세요.
- `hooks.path`는 전용 하위 경로로 유지하세요. `/`는 거부됩니다.
- 명시적 `agentId` 라우팅을 제한하려면 `hooks.allowedAgentIds`를 설정하세요.
- 호출자가 세션을 선택해야 하는 경우가 아니라면 `hooks.allowRequestSessionKey=false`를 유지하세요.
- `hooks.allowRequestSessionKey`를 활성화하는 경우, 허용되는 세션 키 형태를 제한하기 위해 `hooks.allowedSessionKeyPrefixes`도 설정하세요.
- hook 페이로드는 기본적으로 안전 경계로 감싸집니다.

## Gmail PubSub 통합

Google PubSub를 통해 Gmail 받은편지함 트리거를 OpenClaw에 연결합니다.

**사전 요구 사항**: `gcloud` CLI, `gog`(gogcli), OpenClaw hooks 활성화, 공개 HTTPS 엔드포인트용 Tailscale.

### 마법사 설정(권장)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

이 명령은 `hooks.gmail` 구성을 작성하고, Gmail 프리셋을 활성화하며, push 엔드포인트에 Tailscale Funnel을 사용합니다.

### Gateway 자동 시작

`hooks.enabled=true`이고 `hooks.gmail.account`가 설정되어 있으면, Gateway는 부팅 시 `gog gmail watch serve`를 시작하고 watch를 자동 갱신합니다. 이 동작을 끄려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.

### 수동 1회 설정

1. `gog`가 사용하는 OAuth 클라이언트를 소유한 GCP 프로젝트를 선택합니다.

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. 토픽을 생성하고 Gmail push 액세스 권한을 부여합니다.

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. watch를 시작합니다:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail 모델 재정의

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## 작업 관리

```bash
# 모든 작업 나열
openclaw cron list

# 확인된 전달 경로를 포함해 작업 하나 보기
openclaw cron show <jobId>

# 작업 편집
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 작업을 지금 강제 실행
openclaw cron run <jobId>

# 기한이 된 경우에만 실행
openclaw cron run <jobId> --due

# 실행 기록 보기
openclaw cron runs --id <jobId> --limit 50

# 작업 삭제
openclaw cron remove <jobId>

# 에이전트 선택(멀티 에이전트 설정)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

모델 재정의 참고:

- `openclaw cron add|edit --model ...`는 작업의 선택된 모델을 변경합니다.
- 모델이 허용되면, 정확히 그 provider/model이 격리된 에이전트 실행에 전달됩니다.
- 허용되지 않으면 cron은 경고를 표시하고 작업의 에이전트/기본 모델 선택으로 대체합니다.
- 구성된 fallback 체인은 계속 적용되지만, 명시적인 작업별 fallback 목록이 없는 일반 `--model` 재정의는 더 이상 에이전트 기본 모델로 조용히 추가 재시도 대상이 되지 않습니다.

## 구성

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

런타임 상태 사이드카는 `cron.store`에서 파생됩니다. 예를 들어 `~/clawd/cron/jobs.json` 같은 `.json` 저장소는 `~/clawd/cron/jobs-state.json`을 사용하고, `.json` 접미사가 없는 저장소 경로는 `-state.json`을 덧붙입니다.

cron 비활성화: `cron.enabled: false` 또는 `OPENCLAW_SKIP_CRON=1`.

**일회성 재시도**: 일시적 오류(rate limit, overload, network, server error)는 지수 백오프와 함께 최대 3회까지 재시도합니다. 영구 오류는 즉시 비활성화됩니다.

**반복 재시도**: 재시도 사이에 지수 백오프(30초~60분)를 사용합니다. 다음 성공 실행 후 백오프는 초기화됩니다.

**유지 관리**: `cron.sessionRetention`(기본값 `24h`)은 격리된 실행 세션 항목을 정리합니다. `cron.runLog.maxBytes` / `cron.runLog.keepLines`는 실행 로그 파일을 자동으로 정리합니다.

## 문제 해결

### 명령 순서

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron이 실행되지 않음

- `cron.enabled`와 `OPENCLAW_SKIP_CRON` 환경 변수를 확인하세요.
- Gateway가 계속 실행 중인지 확인하세요.
- `cron` 일정의 경우 호스트 시간대 대비 시간대(`--tz`)가 올바른지 확인하세요.
- 실행 출력의 `reason: not-due`는 수동 실행이 `openclaw cron run <jobId> --due`로 확인되었고 작업 기한이 아직 되지 않았음을 의미합니다.

### Cron이 실행되었지만 전달되지 않음

- 전달 모드가 `none`이면 러너의 대체 전송은 예상되지 않습니다. 채팅 경로를 사용할 수 있으면 에이전트는 여전히 `message` 도구로 직접 전송할 수 있습니다.
- 전달 대상이 없거나 유효하지 않으면(`channel`/`to`) 아웃바운드가 건너뛰어집니다.
- 채널 인증 오류(`unauthorized`, `Forbidden`)는 자격 증명 때문에 전달이 차단되었음을 의미합니다.
- 격리된 실행이 무음 토큰(`NO_REPLY` / `no_reply`)만 반환하면, OpenClaw는 직접 아웃바운드 전달을 억제하고 대체 대기 요약 경로도 억제하므로 채팅으로 아무것도 게시되지 않습니다.
- 에이전트가 사용자에게 직접 메시지를 보내야 한다면, 작업에 사용 가능한 경로가 있는지 확인하세요(`channel: "last"`와 이전 채팅 조합 또는 명시적 채널/대상).

### 시간대 관련 주의사항

- `--tz`가 없는 cron은 gateway 호스트 시간대를 사용합니다.
- 시간대가 없는 `at` 일정은 UTC로 처리됩니다.
- Heartbeat `activeHours`는 구성된 시간대 해석을 사용합니다.

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — cron 실행용 작업 원장
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 메인 세션 턴
- [시간대](/ko/concepts/timezone) — 시간대 구성
