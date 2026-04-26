---
read_when:
    - 백그라운드 작업 또는 웨이크업 예약
    - 외부 트리거(Webhook, Gmail)를 OpenClaw에 연결하기
    - 예약된 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Scheduled tasks
summary: Gateway 스케줄러용 예약된 작업, Webhook 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-04-26T11:22:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 지속적으로 저장하고, 적절한 시점에 에이전트를 깨우며, 출력을 채팅 채널이나 Webhook 엔드포인트로 다시 전달할 수 있습니다.

## 빠른 시작

<Steps>
  <Step title="일회성 리마인더 추가">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="작업 확인">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="실행 기록 보기">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron 작동 방식

- Cron은 **모델 내부가 아니라 Gateway 프로세스 내부에서** 실행됩니다.
- 작업 정의는 `~/.openclaw/cron/jobs.json`에 지속 저장되므로 재시작해도 일정이 사라지지 않습니다.
- 런타임 실행 상태는 그 옆의 `~/.openclaw/cron/jobs-state.json`에 지속 저장됩니다. cron 정의를 git으로 관리한다면 `jobs.json`은 추적하고 `jobs-state.json`은 gitignore에 추가하세요.
- 분리 이후에는 이전 OpenClaw 버전도 `jobs.json`을 읽을 수 있지만, 런타임 필드가 이제 `jobs-state.json`에 있기 때문에 작업을 새 작업처럼 취급할 수 있습니다.
- 모든 cron 실행은 [백그라운드 작업](/ko/automation/tasks) 레코드를 생성합니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다.
- 격리된 cron 실행은 완료 시 해당 `cron:<jobId>` 세션에 대해 추적 중인 브라우저 탭/프로세스를 가능한 범위에서 종료하므로, 분리된 브라우저 자동화가 고아 프로세스를 남기지 않습니다.
- 격리된 cron 실행은 오래된 확인 응답도 방지합니다. 첫 결과가 단지 중간 상태 업데이트(`on it`, `pulling everything together` 및 유사한 힌트)이고, 최종 답변을 담당하는 하위 에이전트 실행이 더 이상 없으면, OpenClaw는 전달 전에 실제 결과를 한 번 더 요청합니다.

<a id="maintenance"></a>

<Note>
cron의 작업 조정은 우선 런타임 소유, 그다음 내구성 있는 기록 기반으로 이루어집니다. cron 런타임이 해당 작업을 실행 중으로 계속 추적하는 동안 활성 cron 작업은 계속 살아 있으며, 오래된 하위 세션 행이 여전히 존재하더라도 마찬가지입니다. 런타임이 더 이상 작업을 소유하지 않고 5분의 유예 기간이 지나면, 유지 관리 검사는 일치하는 `cron:<jobId>:<startedAt>` 실행에 대한 지속 저장된 실행 로그와 작업 상태를 확인합니다. 이 내구성 있는 기록에 종료 결과가 있으면 작업 원장은 그 결과로 최종 확정됩니다. 그렇지 않으면 Gateway 소유 유지 관리가 작업을 `lost`로 표시할 수 있습니다. 오프라인 CLI 감사는 내구성 있는 기록을 통해 복구할 수 있지만, 자체적인 메모리 내 활성 작업 집합이 비어 있다는 사실만으로 Gateway 소유 cron 실행이 사라졌다고 판단하지는 않습니다.
</Note>

## 일정 유형

| 종류    | CLI 플래그 | 설명                                                    |
| ------- | ---------- | ------------------------------------------------------- |
| `at`    | `--at`     | 일회성 타임스탬프(ISO 8601 또는 `20m` 같은 상대 시간)   |
| `every` | `--every`  | 고정 간격                                                |
| `cron`  | `--cron`   | 선택적 `--tz`를 지원하는 5필드 또는 6필드 cron 표현식   |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 로컬 wall-clock 스케줄링이 필요하면 `--tz America/New_York`를 추가하세요.

정각마다 반복되는 표현식은 부하 급증을 줄이기 위해 최대 5분까지 자동으로 분산됩니다. 정확한 시각을 강제하려면 `--exact`를 사용하고, 명시적인 범위를 지정하려면 `--stagger 30s`를 사용하세요.

### day-of-month와 day-of-week는 OR 논리를 사용합니다

Cron 표현식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. day-of-month와 day-of-week 필드가 모두 와일드카드가 아닐 경우, croner는 **두 필드 중 어느 하나라도** 일치하면 매칭합니다. 둘 다 일치해야 하는 것이 아닙니다. 이는 표준 Vixie cron 동작입니다.

```
# 의도: "15일 오전 9시, 단 월요일인 경우에만"
# 실제:   "매월 15일 오전 9시, 그리고 매주 월요일 오전 9시"
0 9 15 * 1
```

이 경우 월 0~1회가 아니라 약 5~6회 실행됩니다. OpenClaw는 여기서 Croner의 기본 OR 동작을 사용합니다. 두 조건이 모두 필요하면 Croner의 `+` day-of-week 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드만으로 스케줄링하고 다른 조건은 작업의 프롬프트나 명령에서 별도로 확인하세요.

## 실행 방식

| 방식            | `--session` 값      | 실행 위치                 | 적합한 용도                     |
| --------------- | ------------------- | ------------------------- | ------------------------------- |
| 메인 세션       | `main`              | 다음 Heartbeat 턴         | 리마인더, 시스템 이벤트         |
| 격리            | `isolated`          | 전용 `cron:<jobId>`       | 보고서, 백그라운드 작업         |
| 현재 세션       | `current`           | 생성 시점에 바인딩됨      | 컨텍스트 인지 반복 작업         |
| 사용자 지정 세션 | `session:custom-id` | 지속되는 명명된 세션      | 기록을 기반으로 쌓이는 워크플로 |

<AccordionGroup>
  <Accordion title="메인 세션 vs 격리 vs 사용자 지정">
    **메인 세션** 작업은 시스템 이벤트를 큐에 넣고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). 이러한 시스템 이벤트는 대상 세션의 일일/유휴 리셋 freshness를 연장하지 않습니다. **격리된** 작업은 새 세션으로 전용 에이전트 턴을 실행합니다. **사용자 지정 세션**(`session:xxx`)은 실행 간 컨텍스트를 유지하므로, 이전 요약을 바탕으로 쌓이는 일일 스탠드업 같은 워크플로를 가능하게 합니다.
  </Accordion>
  <Accordion title="격리된 작업에서 '새 세션'의 의미">
    격리된 작업에서 "새 세션"은 매 실행마다 새로운 transcript/session id를 의미합니다. OpenClaw는 thinking/fast/verbose 설정, 라벨, 명시적으로 사용자가 선택한 model/auth override 같은 안전한 선호 설정은 가져올 수 있지만, 이전 cron 행의 주변 대화 컨텍스트는 상속하지 않습니다. 여기에는 채널/그룹 라우팅, send 또는 queue 정책, 권한 상승, origin, ACP 런타임 바인딩이 포함됩니다. 반복 작업이 동일한 대화 컨텍스트를 의도적으로 기반으로 해야 한다면 `current` 또는 `session:<id>`를 사용하세요.
  </Accordion>
  <Accordion title="런타임 정리">
    격리된 작업의 경우 런타임 teardown에는 이제 해당 cron 세션에 대한 가능한 범위의 브라우저 정리도 포함됩니다. 정리 실패는 무시되므로 실제 cron 결과가 계속 우선합니다.

    격리된 cron 실행은 공유 런타임 정리 경로를 통해 작업을 위해 생성된 번들 MCP 런타임 인스턴스도 정리합니다. 이는 메인 세션 및 사용자 지정 세션 MCP 클라이언트가 정리되는 방식과 일치하므로, 격리된 cron 작업이 실행 간에 stdio 하위 프로세스나 장기 실행 MCP 연결을 누수하지 않습니다.

  </Accordion>
  <Accordion title="하위 에이전트 및 Discord 전달">
    격리된 cron 실행이 하위 에이전트를 조정할 때, 전달은 오래된 상위 중간 텍스트보다 최종 하위 결과를 우선합니다. 하위 실행이 아직 진행 중이면, OpenClaw는 그 부분적인 상위 업데이트를 알리지 않고 억제합니다.

    텍스트 전용 Discord announce 대상의 경우, OpenClaw는 스트리밍/중간 텍스트 페이로드와 최종 답변을 모두 재생하지 않고 표준 최종 assistant 텍스트를 한 번만 전송합니다. 미디어 및 구조화된 Discord 페이로드는 첨부 파일과 컴포넌트가 누락되지 않도록 계속 별도의 페이로드로 전달됩니다.

  </Accordion>
</AccordionGroup>

### 격리된 작업의 페이로드 옵션

<ParamField path="--message" type="string" required>
  프롬프트 텍스트(격리된 작업에서는 필수).
</ParamField>
<ParamField path="--model" type="string">
  모델 override입니다. 작업에 대해 선택된 허용 모델을 사용합니다.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 수준 override입니다.
</ParamField>
<ParamField path="--light-context" type="boolean">
  workspace bootstrap 파일 주입을 건너뜁니다.
</ParamField>
<ParamField path="--tools" type="string">
  작업이 사용할 수 있는 도구를 제한합니다. 예: `--tools exec,read`.
</ParamField>

`--model`은 해당 작업에 대해 선택된 허용 모델을 사용합니다. 요청한 모델이 허용되지 않으면 cron은 경고를 기록하고 대신 작업의 agent/default 모델 선택으로 폴백합니다. 구성된 폴백 체인은 계속 적용되지만, 명시적인 작업별 폴백 목록 없이 단순 모델 override만 있는 경우에는 에이전트 기본 모델이 숨겨진 추가 재시도 대상으로 더 이상 덧붙여지지 않습니다.

격리된 작업의 모델 선택 우선순위는 다음과 같습니다.

1. Gmail hook 모델 override(실행이 Gmail에서 왔고 해당 override가 허용된 경우)
2. 작업별 페이로드 `model`
3. 사용자가 선택해 저장한 cron 세션 모델 override
4. Agent/default 모델 선택

Fast mode도 해결된 라이브 선택을 따릅니다. 선택된 모델 설정에 `params.fastMode`가 있으면, 격리된 cron은 기본적으로 이를 사용합니다. 저장된 세션 `fastMode` override는 어느 방향이든 여전히 config보다 우선합니다.

격리된 실행이 라이브 모델 전환 handoff에 도달하면, cron은 전환된 provider/model로 재시도하고 재시도 전에 현재 실행에 대한 해당 라이브 선택을 저장합니다. 전환에 새 auth profile도 포함되면, cron은 현재 실행에 대한 해당 auth profile override도 저장합니다. 재시도는 제한됩니다. 최초 시도에 더해 전환 재시도 2회 이후에는 무한 반복 대신 중단합니다.

## 전달 및 출력

| 모드       | 동작                                                               |
| ---------- | ------------------------------------------------------------------ |
| `announce` | 에이전트가 전송하지 않으면 최종 텍스트를 대상에 폴백 전달           |
| `webhook`  | 완료된 이벤트 페이로드를 URL로 POST                                |
| `none`     | 러너의 폴백 전달 없음                                              |

채널로 전달하려면 `--announce --channel telegram --to "-1001234567890"`를 사용하세요. Telegram forum topic의 경우 `-1001234567890:topic:123`을 사용하세요. Slack/Discord/Mattermost 대상은 명시적 접두사(`channel:<id>`, `user:<id>`)를 사용해야 합니다. Matrix room ID는 대소문자를 구분하므로 정확한 room ID 또는 Matrix의 `room:!room:server` 형식을 사용하세요.

격리된 작업의 경우 채팅 전달은 공유됩니다. 채팅 경로를 사용할 수 있으면, 작업이 `--no-deliver`를 사용하더라도 에이전트는 `message` 도구를 사용할 수 있습니다. 에이전트가 구성된/현재 대상에 전송하면 OpenClaw는 폴백 announce를 건너뜁니다. 그렇지 않으면 `announce`, `webhook`, `none`은 에이전트 턴 후 러너가 최종 응답을 어떻게 처리할지만 제어합니다.

에이전트가 활성 채팅에서 격리된 리마인더를 만들면, OpenClaw는 폴백 announce 경로를 위해 보존된 라이브 전달 대상을 저장합니다. 내부 세션 키는 소문자일 수 있지만, 현재 채팅 컨텍스트를 사용할 수 있을 때 provider 전달 대상은 해당 키에서 재구성되지 않습니다.

실패 알림은 별도의 대상 경로를 따릅니다.

- `cron.failureDestination`은 실패 알림의 전역 기본값을 설정합니다.
- `job.delivery.failureDestination`은 작업별로 이를 override합니다.
- 둘 다 설정되지 않았고 작업이 이미 `announce`를 통해 전달되는 경우, 실패 알림은 이제 해당 기본 announce 대상으로 폴백됩니다.
- `delivery.failureDestination`은 `sessionTarget="isolated"` 작업에서만 지원되며, 예외적으로 기본 전달 모드가 `webhook`인 경우는 제외됩니다.

## CLI 예시

<Tabs>
  <Tab title="일회성 리마인더">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="반복되는 격리 작업">
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
  </Tab>
  <Tab title="모델 및 thinking override">
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
  </Tab>
</Tabs>

## Webhook

Gateway는 외부 트리거를 위한 HTTP Webhook 엔드포인트를 노출할 수 있습니다. config에서 활성화하세요.

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

- `Authorization: Bearer <token>` (권장)
- `x-openclaw-token: <token>`

쿼리 문자열 토큰은 거부됩니다.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    메인 세션에 시스템 이벤트를 큐에 넣습니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      이벤트 설명.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 또는 `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    격리된 에이전트 턴을 실행합니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    필드: `message`(필수), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="매핑된 hooks (POST /hooks/<name>)">
    사용자 지정 hook 이름은 config의 `hooks.mappings`를 통해 해석됩니다. 매핑은 템플릿 또는 코드 변환을 사용해 임의의 페이로드를 `wake` 또는 `agent` 작업으로 변환할 수 있습니다.
  </Accordion>
</AccordionGroup>

<Warning>
hook 엔드포인트는 loopback, tailnet 또는 신뢰할 수 있는 리버스 프록시 뒤에 두세요.

- 전용 hook 토큰을 사용하세요. gateway 인증 토큰을 재사용하지 마세요.
- `hooks.path`는 전용 하위 경로로 유지하세요. `/`는 거부됩니다.
- 명시적인 `agentId` 라우팅을 제한하려면 `hooks.allowedAgentIds`를 설정하세요.
- 호출자가 세션을 선택해야 하는 요구 사항이 없다면 `hooks.allowRequestSessionKey=false`를 유지하세요.
- `hooks.allowRequestSessionKey`를 활성화하는 경우, 허용되는 세션 키 형태를 제한하기 위해 `hooks.allowedSessionKeyPrefixes`도 함께 설정하세요.
- hook 페이로드는 기본적으로 안전 경계로 감싸집니다.
  </Warning>

## Gmail PubSub 통합

Google PubSub을 통해 Gmail 받은편지함 트리거를 OpenClaw에 연결합니다.

<Note>
**사전 요구 사항:** `gcloud` CLI, `gog` (gogcli), OpenClaw hooks 활성화, 공개 HTTPS 엔드포인트용 Tailscale.
</Note>

### 마법사 설정(권장)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

이 명령은 `hooks.gmail` config를 작성하고, Gmail 프리셋을 활성화하며, push 엔드포인트에 Tailscale Funnel을 사용합니다.

### Gateway 자동 시작

`hooks.enabled=true`이고 `hooks.gmail.account`가 설정되어 있으면, Gateway는 부팅 시 `gog gmail watch serve`를 시작하고 watch를 자동 갱신합니다. 이 동작을 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.

### 수동 1회 설정

<Steps>
  <Step title="GCP 프로젝트 선택">
    `gog`에서 사용하는 OAuth 클라이언트를 소유한 GCP 프로젝트를 선택합니다.

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="토픽 생성 및 Gmail push 액세스 권한 부여">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="watch 시작">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail 모델 override

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

# 해결된 전달 경로를 포함해 하나의 작업 표시
openclaw cron show <jobId>

# 작업 편집
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 지금 작업 강제 실행
openclaw cron run <jobId>

# 실행 시점이 된 경우에만 실행
openclaw cron run <jobId> --due

# 실행 기록 보기
openclaw cron runs --id <jobId> --limit 50

# 작업 삭제
openclaw cron remove <jobId>

# 에이전트 선택(멀티 에이전트 설정)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
모델 override 참고:

- `openclaw cron add|edit --model ...`는 작업의 선택된 모델을 변경합니다.
- 모델이 허용되면 해당 정확한 provider/model이 격리된 에이전트 실행에 전달됩니다.
- 허용되지 않으면 cron은 경고를 표시하고 작업의 agent/default 모델 선택으로 폴백합니다.
- 구성된 폴백 체인은 계속 적용되지만, 명시적인 작업별 폴백 목록이 없는 일반 `--model` override는 더 이상 에이전트 기본 모델로 조용히 추가 재시도되지 않습니다.
  </Note>

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

런타임 상태 사이드카는 `cron.store`에서 파생됩니다. `~/clawd/cron/jobs.json` 같은 `.json` 저장소는 `~/clawd/cron/jobs-state.json`을 사용하고, `.json` 접미사가 없는 저장소 경로는 `-state.json`을 덧붙입니다.

cron 비활성화: `cron.enabled: false` 또는 `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="재시도 동작">
    **일회성 재시도**: 일시적 오류(rate limit, overload, network, server error)는 지수 백오프로 최대 3회까지 재시도합니다. 영구 오류는 즉시 비활성화됩니다.

    **반복 재시도**: 재시도 사이에 지수 백오프(30초~60분)를 사용합니다. 다음 성공 실행 후 백오프는 초기화됩니다.

  </Accordion>
  <Accordion title="유지 관리">
    `cron.sessionRetention`(기본값 `24h`)은 격리된 실행 세션 항목을 정리합니다. `cron.runLog.maxBytes` / `cron.runLog.keepLines`는 실행 로그 파일을 자동 정리합니다.
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron이 실행되지 않음">
    - `cron.enabled`와 `OPENCLAW_SKIP_CRON` env var를 확인하세요.
    - Gateway가 계속 실행 중인지 확인하세요.
    - `cron` 스케줄의 경우, 시간대(`--tz`)와 호스트 시간대가 맞는지 확인하세요.
    - 실행 출력의 `reason: not-due`는 `openclaw cron run <jobId> --due`로 수동 실행을 확인했지만 아직 작업 실행 시점이 아니었음을 의미합니다.
  </Accordion>
  <Accordion title="Cron은 실행되었지만 전달되지 않음">
    - 전달 모드 `none`은 러너의 폴백 전송이 없음을 의미합니다. 채팅 경로를 사용할 수 있으면 에이전트는 여전히 `message` 도구로 직접 전송할 수 있습니다.
    - 전달 대상이 없거나 잘못된 경우(`channel`/`to`)에는 아웃바운드가 건너뛰어집니다.
    - Matrix의 경우, 소문자 `delivery.to` room ID를 가진 복사되었거나 레거시 작업은 Matrix room ID가 대소문자를 구분하기 때문에 실패할 수 있습니다. 작업을 Matrix의 정확한 `!room:server` 또는 `room:!room:server` 값으로 수정하세요.
    - 채널 인증 오류(`unauthorized`, `Forbidden`)는 자격 증명 때문에 전달이 차단되었음을 의미합니다.
    - 격리된 실행이 무음 토큰(`NO_REPLY` / `no_reply`)만 반환하면, OpenClaw는 직접 아웃바운드 전달을 억제하고 폴백 대기열 요약 경로도 억제하므로 채팅으로 아무것도 다시 게시되지 않습니다.
    - 에이전트가 사용자에게 직접 메시지해야 한다면, 작업에 사용 가능한 경로가 있는지 확인하세요(`channel: "last"`와 이전 채팅 조합 또는 명시적인 채널/대상).
  </Accordion>
  <Accordion title="Cron 또는 Heartbeat 때문에 /new-style rollover가 막히는 것처럼 보임">
    - 일일 및 유휴 리셋 freshness는 `updatedAt` 기준이 아닙니다. [세션 관리](/ko/concepts/session#session-lifecycle)를 참조하세요.
    - cron wakeup, Heartbeat 실행, exec 알림, gateway bookkeeping은 라우팅/상태를 위해 세션 행을 업데이트할 수 있지만, `sessionStartedAt` 또는 `lastInteractionAt`을 연장하지는 않습니다.
    - 이러한 필드가 존재하기 전에 생성된 레거시 행의 경우, OpenClaw는 파일이 여전히 사용 가능하면 transcript JSONL 세션 헤더에서 `sessionStartedAt`을 복구할 수 있습니다. `lastInteractionAt`이 없는 레거시 유휴 행은 복구된 시작 시간을 유휴 기준 시각으로 사용합니다.
  </Accordion>
  <Accordion title="시간대 관련 주의사항">
    - `--tz`가 없는 cron은 gateway 호스트 시간대를 사용합니다.
    - 시간대가 없는 `at` 스케줄은 UTC로 처리됩니다.
    - Heartbeat `activeHours`는 구성된 시간대 해석을 사용합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — cron 실행용 작업 원장
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 메인 세션 턴
- [시간대](/ko/concepts/timezone) — 시간대 구성
