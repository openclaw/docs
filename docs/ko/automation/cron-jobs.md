---
read_when:
    - 백그라운드 작업 또는 깨우기 예약
    - 외부 트리거(Webhook, Gmail)를 OpenClaw에 연결하기
    - 예약 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Scheduled tasks
summary: Gateway 스케줄러용 예약 작업, Webhook 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-05-07T13:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 지속 저장하고, 적절한 시간에 에이전트를 깨우며, 출력을 채팅 채널이나 webhook 엔드포인트로 다시 전달할 수 있습니다.

## 빠른 시작

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 작동 방식

- Cron은 **Gateway 내부** 프로세스에서 실행됩니다(모델 내부가 아님).
- 작업 정의는 `~/.openclaw/cron/jobs.json`에 지속 저장되므로 재시작해도 스케줄이 사라지지 않습니다.
- 런타임 실행 상태는 그 옆의 `~/.openclaw/cron/jobs-state.json`에 지속 저장됩니다. Cron 정의를 git에서 추적한다면 `jobs.json`을 추적하고 `jobs-state.json`은 gitignore에 추가하세요.
- 분리 이후에는 이전 OpenClaw 버전이 `jobs.json`을 읽을 수 있지만, 이제 런타임 필드가 `jobs-state.json`에 있으므로 작업을 새 작업처럼 취급할 수 있습니다.
- Gateway가 실행 중이거나 중지된 상태에서 `jobs.json`이 편집되면, OpenClaw는 변경된 스케줄 필드를 보류 중인 런타임 슬롯 메타데이터와 비교하고 오래된 `nextRunAtMs` 값을 지웁니다. 순수한 서식 변경이나 키 순서만 바뀐 재작성은 보류 중인 슬롯을 유지합니다.
- 모든 Cron 실행은 [백그라운드 작업](/ko/automation/tasks) 레코드를 생성합니다.
- Gateway 시작 시 기한이 지난 격리된 에이전트 턴 작업은 즉시 재생되는 대신 채널 연결 구간 밖으로 다시 예약되므로, 재시작 후에도 Discord/Telegram 시작과 네이티브 명령 설정이 계속 응답성을 유지합니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다.
- 격리된 Cron 실행은 실행이 완료될 때 해당 `cron:<jobId>` 세션의 추적된 브라우저 탭/프로세스를 최선의 방식으로 닫으므로, 분리된 브라우저 자동화가 고아 프로세스를 남기지 않습니다.
- 좁은 범위의 Cron 자체 정리 권한을 받은 격리된 Cron 실행은 여전히 스케줄러 상태와 현재 작업의 자체 필터링 목록을 읽을 수 있으므로, 상태/Heartbeat 확인이 더 넓은 Cron 변경 권한을 얻지 않고도 자체 스케줄을 검사할 수 있습니다.
- 격리된 Cron 실행은 오래된 확인 응답도 방지합니다. 첫 결과가 단지 임시 상태 업데이트(`on it`, `pulling everything together` 및 유사한 힌트)이고 최종 답변을 여전히 담당하는 하위 subagent 실행이 없다면, OpenClaw는 전달 전에 실제 결과를 한 번 다시 프롬프트합니다.
- 격리된 Cron 실행은 내장 실행의 구조화된 실행 거부 메타데이터를 우선 사용한 다음, `SYSTEM_RUN_DENIED`와 `INVALID_REQUEST` 같은 알려진 최종 요약/출력 마커로 대체하므로, 차단된 명령이 성공 실행으로 보고되지 않습니다.
- 격리된 Cron 실행은 응답 페이로드가 생성되지 않은 경우에도 실행 수준 에이전트 실패를 작업 오류로 처리하므로, 모델/프로바이더 실패는 작업을 성공으로 지우는 대신 오류 카운터를 증가시키고 실패 알림을 트리거합니다.
- 격리된 에이전트 턴 작업이 `timeoutSeconds`에 도달하면 Cron은 기본 에이전트 실행을 중단하고 짧은 정리 시간을 제공합니다. 실행이 비워지지 않으면 Cron이 타임아웃을 기록하기 전에 Gateway 소유 정리가 해당 실행의 세션 소유권을 강제로 지우므로, 대기 중인 채팅 작업이 오래된 처리 세션 뒤에 남지 않습니다.

<a id="maintenance"></a>

<Note>
Cron의 작업 조정은 먼저 런타임 소유이고, 그다음 내구성 있는 기록 기반입니다. 활성 Cron 작업은 Cron 런타임이 해당 작업을 실행 중으로 계속 추적하는 동안, 오래된 하위 세션 행이 아직 존재하더라도 활성 상태로 유지됩니다. 런타임이 작업 소유를 중단하고 5분 유예 시간이 만료되면, 유지 관리가 일치하는 `cron:<jobId>:<startedAt>` 실행에 대해 지속 저장된 실행 로그와 작업 상태를 확인합니다. 해당 내구성 있는 기록에 종료 결과가 표시되면 작업 원장이 이를 기반으로 마무리됩니다. 그렇지 않으면 Gateway 소유 유지 관리가 작업을 `lost`로 표시할 수 있습니다. 오프라인 CLI 감사는 내구성 있는 기록에서 복구할 수 있지만, 자체의 빈 인프로세스 활성 작업 집합을 Gateway 소유 Cron 실행이 사라졌다는 증거로 취급하지는 않습니다.
</Note>

## 스케줄 유형

| 종류    | CLI 플래그  | 설명                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 일회성 타임스탬프(ISO 8601 또는 `20m` 같은 상대값)    |
| `every` | `--every` | 고정 간격                                          |
| `cron`  | `--cron`  | 선택적 `--tz`가 있는 5필드 또는 6필드 Cron 표현식 |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 로컬 벽시계 기준 스케줄링에는 `--tz America/New_York`를 추가하세요.

매시간 정각 반복 표현식은 부하 급증을 줄이기 위해 최대 5분까지 자동으로 분산됩니다. 정확한 타이밍을 강제하려면 `--exact`를 사용하고, 명시적 구간에는 `--stagger 30s`를 사용하세요.

### 월의 일과 요일은 OR 논리를 사용합니다

Cron 표현식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. 월의 일 필드와 요일 필드가 모두 와일드카드가 아닐 때, croner는 두 필드가 모두 일치할 때가 아니라 **둘 중 하나**가 일치할 때 매칭합니다. 이는 표준 Vixie cron 동작입니다.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

이는 한 달에 0~1회가 아니라 약 5~6회 실행됩니다. OpenClaw는 여기서 Croner의 기본 OR 동작을 사용합니다. 두 조건을 모두 요구하려면 Croner의 `+` 요일 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드로 스케줄링하고 작업의 프롬프트나 명령에서 다른 필드를 가드하세요.

## 실행 스타일

| 스타일           | `--session` 값   | 실행 위치                  | 적합한 용도                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 기본 세션    | `main`              | 다음 Heartbeat 턴      | 리마인더, 시스템 이벤트        |
| 격리        | `isolated`          | 전용 `cron:<jobId>` | 보고서, 백그라운드 잡무      |
| 현재 세션 | `current`           | 생성 시점에 바인딩됨   | 컨텍스트 인식 반복 작업    |
| 사용자 지정 세션  | `session:custom-id` | 지속 이름 지정 세션 | 기록을 기반으로 이어지는 워크플로 |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **기본 세션** 작업은 시스템 이벤트를 큐에 넣고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). 이러한 시스템 이벤트는 대상 세션의 일일/유휴 리셋 최신성을 연장하지 않습니다. **격리된** 작업은 새 세션으로 전용 에이전트 턴을 실행합니다. **사용자 지정 세션**(`session:xxx`)은 실행 간 컨텍스트를 지속하므로 이전 요약을 기반으로 이어지는 일일 스탠드업 같은 워크플로를 사용할 수 있습니다.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    격리된 작업에서 "fresh session"은 각 실행마다 새 transcript/session id를 의미합니다. OpenClaw는 thinking/fast/verbose 설정, 레이블, 명시적으로 사용자가 선택한 모델/인증 오버라이드 같은 안전한 선호 설정을 전달할 수 있지만, 오래된 Cron 행의 주변 대화 컨텍스트는 상속하지 않습니다. 채널/그룹 라우팅, 전송 또는 큐 정책, 권한 상승, 출처, ACP 런타임 바인딩이 여기에 포함됩니다. 반복 작업이 의도적으로 동일한 대화 컨텍스트를 기반으로 이어져야 한다면 `current` 또는 `session:<id>`를 사용하세요.
  </Accordion>
  <Accordion title="Runtime cleanup">
    격리된 작업의 경우 런타임 해제에는 이제 해당 Cron 세션의 최선의 브라우저 정리가 포함됩니다. 실제 Cron 결과가 우선하도록 정리 실패는 무시됩니다.

    격리된 Cron 실행은 공유 런타임 정리 경로를 통해 작업용으로 생성된 번들 MCP 런타임 인스턴스도 모두 폐기합니다. 이는 기본 세션 및 사용자 지정 세션 MCP 클라이언트가 해제되는 방식과 일치하므로, 격리된 Cron 작업이 실행 간 stdio 하위 프로세스나 장기 MCP 연결을 누수하지 않습니다.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    격리된 Cron 실행이 subagent를 조율할 때 전달도 오래된 부모의 임시 텍스트보다 최종 하위 출력물을 우선합니다. 하위 실행이 아직 실행 중이면 OpenClaw는 그 부분적인 부모 업데이트를 알리는 대신 억제합니다.

    텍스트 전용 Discord 알림 대상의 경우, OpenClaw는 스트리밍/중간 텍스트 페이로드와 최종 답변을 모두 재생하는 대신 표준 최종 assistant 텍스트를 한 번 보냅니다. 미디어 및 구조화된 Discord 페이로드는 첨부 파일과 컴포넌트가 누락되지 않도록 여전히 별도의 페이로드로 전달됩니다.

  </Accordion>
</AccordionGroup>

### 격리된 작업의 페이로드 옵션

<ParamField path="--message" type="string" required>
  프롬프트 텍스트(격리된 작업에 필수).
</ParamField>
<ParamField path="--model" type="string">
  모델 오버라이드. 작업에 선택된 허용 모델을 사용합니다.
</ParamField>
<ParamField path="--thinking" type="string">
  사고 수준 오버라이드.
</ParamField>
<ParamField path="--light-context" type="boolean">
  워크스페이스 부트스트랩 파일 주입을 건너뜁니다.
</ParamField>
<ParamField path="--tools" type="string">
  작업이 사용할 수 있는 도구를 제한합니다. 예: `--tools exec,read`.
</ParamField>

`--model`은 선택된 허용 모델을 해당 작업의 기본 모델로 사용합니다. 이는 채팅 세션 `/model` 오버라이드와 같지 않습니다. 작업 기본 모델이 실패해도 구성된 fallback 체인은 계속 적용됩니다. 요청한 모델이 허용되지 않았거나 해석할 수 없는 경우, Cron은 작업의 에이전트/기본 모델 선택으로 조용히 대체하지 않고 명시적 검증 오류로 실행을 실패 처리합니다.

Cron 작업은 페이로드 수준 `fallbacks`도 포함할 수 있습니다. 존재하는 경우 해당 목록은 작업의 구성된 fallback 체인을 대체합니다. 선택한 모델만 시도하는 엄격한 Cron 실행을 원할 때는 작업 페이로드/API에서 `fallbacks: []`를 사용하세요. 작업에 `--model`이 있지만 페이로드나 구성된 fallback이 모두 없는 경우, OpenClaw는 명시적인 빈 fallback 오버라이드를 전달하여 에이전트 기본 모델이 숨겨진 추가 재시도 대상으로 추가되지 않게 합니다.

격리된 작업의 모델 선택 우선순위는 다음과 같습니다.

1. Gmail 훅 모델 오버라이드(실행이 Gmail에서 왔고 해당 오버라이드가 허용되는 경우)
2. 작업별 페이로드 `model`
3. 사용자가 선택해 저장한 Cron 세션 모델 오버라이드
4. 에이전트/기본 모델 선택

빠른 모드도 해석된 라이브 선택을 따릅니다. 선택된 모델 구성에 `params.fastMode`가 있으면, 격리된 Cron은 기본적으로 이를 사용합니다. 저장된 세션 `fastMode` 오버라이드는 어느 방향이든 여전히 구성보다 우선합니다.

격리된 실행에서 라이브 모델 전환 인계가 발생하면, Cron은 전환된 프로바이더/모델로 재시도하고 재시도 전에 활성 실행의 해당 라이브 선택을 지속 저장합니다. 전환에 새 인증 프로필도 포함된 경우, Cron은 활성 실행에 해당 인증 프로필 오버라이드도 지속 저장합니다. 재시도는 제한됩니다. 최초 시도와 2회의 전환 재시도 후에는 무한 루프 대신 Cron이 중단합니다.

격리된 Cron 실행이 에이전트 러너에 진입하기 전에, OpenClaw는 `baseUrl`이 local loopback, 사설 네트워크 또는 `.local`인 구성된 `api: "ollama"` 및 `api: "openai-completions"` 프로바이더에 대해 접근 가능한 로컬 프로바이더 엔드포인트를 확인합니다. 해당 엔드포인트가 내려가 있으면, 실행은 모델 호출을 시작하는 대신 명확한 프로바이더/모델 오류와 함께 `skipped`로 기록됩니다. 엔드포인트 결과는 5분 동안 캐시되므로, 동일한 죽은 로컬 Ollama, vLLM, SGLang 또는 LM Studio 서버를 사용하는 많은 기한 도래 작업은 요청 폭주를 만드는 대신 하나의 작은 프로브를 공유합니다. 건너뛴 프로바이더 사전 점검 실행은 실행 오류 백오프를 증가시키지 않습니다. 반복된 건너뜀 알림을 원한다면 `failureAlert.includeSkipped`를 활성화하세요.

## 전달 및 출력

| 모드       | 발생하는 일                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 에이전트가 보내지 않은 경우 대상에 최종 텍스트를 fallback 전달합니다 |
| `webhook`  | 완료 이벤트 페이로드를 URL로 POST합니다                                |
| `none`     | 러너 fallback 전달 없음                                         |

`--announce --channel telegram --to "-1001234567890"`를 사용하여 채널로 전달합니다. Telegram 포럼 주제의 경우 `-1001234567890:topic:123`을 사용하세요. 직접 RPC/config 호출자는 `delivery.threadId`를 문자열 또는 숫자로 전달할 수도 있습니다. Slack/Discord/Mattermost 대상은 명시적 접두사(`channel:<id>`, `user:<id>`)를 사용해야 합니다. Matrix 방 ID는 대소문자를 구분합니다. Matrix의 정확한 방 ID 또는 `room:!room:server` 형식을 사용하세요.

announce 전달에서 `channel: "last"`를 사용하거나 `channel`을 생략하면, `telegram:123` 같은 provider 접두사가 붙은 대상이 cron이 세션 기록 또는 구성된 단일 채널로 대체되기 전에 채널을 선택할 수 있습니다. 로드된 plugin이 알리는 접두사만 provider selector입니다. `delivery.channel`이 명시적인 경우, 대상 접두사는 동일한 provider를 지정해야 합니다. 예를 들어 `channel: "whatsapp"`와 `to: "telegram:123"`을 함께 사용하면 WhatsApp이 Telegram ID를 전화번호로 해석하도록 두지 않고 거부됩니다. `channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>` 같은 대상 종류 및 서비스 접두사는 provider selector가 아니라 채널이 소유한 대상 구문으로 남습니다.

격리된 작업에서는 채팅 전달이 공유됩니다. 채팅 경로를 사용할 수 있으면, 작업이 `--no-deliver`를 사용하더라도 agent가 `message` 도구를 사용할 수 있습니다. agent가 구성된/현재 대상으로 보내면 OpenClaw는 fallback announce를 건너뜁니다. 그렇지 않으면 `announce`, `webhook`, `none`은 agent 턴 이후 최종 응답을 runner가 어떻게 처리할지만 제어합니다.

agent가 활성 채팅에서 격리된 알림을 만들면 OpenClaw는 fallback announce 경로를 위해 보존된 라이브 전달 대상을 저장합니다. 내부 세션 키는 소문자일 수 있습니다. 현재 채팅 컨텍스트를 사용할 수 있으면 provider 전달 대상은 해당 키에서 재구성되지 않습니다.

암시적 announce 전달은 구성된 채널 allowlist를 사용하여 오래된 대상을 검증하고 다시 라우팅합니다. DM pairing-store 승인은 fallback 자동화 수신자가 아닙니다. 예약 작업이 DM으로 선제적으로 보내야 하는 경우 `delivery.to`를 설정하거나 채널 `allowFrom` 항목을 구성하세요.

실패 알림은 별도의 대상 경로를 따릅니다.

- `cron.failureDestination`은 실패 알림의 전역 기본값을 설정합니다.
- `job.delivery.failureDestination`은 작업별로 이를 재정의합니다.
- 둘 다 설정되어 있지 않고 작업이 이미 `announce`로 전달되는 경우, 실패 알림은 이제 해당 기본 announce 대상으로 대체됩니다.
- `delivery.failureDestination`은 기본 전달 모드가 `webhook`인 경우가 아니면 `sessionTarget="isolated"` 작업에서만 지원됩니다.
- `failureAlert.includeSkipped: true`는 작업 또는 전역 cron 알림 정책이 반복된 건너뛴 실행 알림을 포함하도록 합니다. 건너뛴 실행은 별도의 연속 건너뛰기 카운터를 유지하므로 실행 오류 backoff에 영향을 주지 않습니다.

## CLI 예시

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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

모든 요청은 헤더를 통해 hook token을 포함해야 합니다.

- `Authorization: Bearer <token>`(권장)
- `x-openclaw-token: <token>`

쿼리 문자열 토큰은 거부됩니다.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    main 세션에 system event를 대기열에 넣습니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      이벤트 설명입니다.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 또는 `next-heartbeat`입니다.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    격리된 agent 턴을 실행합니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    필드: `message`(필수), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    사용자 지정 hook 이름은 config의 `hooks.mappings`를 통해 해석됩니다. 매핑은 템플릿 또는 코드 변환으로 임의의 payload를 `wake` 또는 `agent` 작업으로 변환할 수 있습니다.
  </Accordion>
</AccordionGroup>

<Warning>
hook 엔드포인트는 loopback, tailnet 또는 신뢰할 수 있는 reverse proxy 뒤에 두세요.

- 전용 hook token을 사용하세요. gateway auth token을 재사용하지 마세요.
- `hooks.path`를 전용 하위 경로에 유지하세요. `/`는 거부됩니다.
- 명시적 `agentId` 라우팅을 제한하려면 `hooks.allowedAgentIds`를 설정하세요.
- 호출자가 선택한 세션이 필요한 경우가 아니라면 `hooks.allowRequestSessionKey=false`를 유지하세요.
- `hooks.allowRequestSessionKey`를 활성화하는 경우, 허용되는 session key 형태를 제한하도록 `hooks.allowedSessionKeyPrefixes`도 설정하세요.
- Hook payload는 기본적으로 안전 경계로 래핑됩니다.

</Warning>

## Gmail PubSub 통합

Google PubSub을 통해 Gmail inbox 트리거를 OpenClaw에 연결합니다.

<Note>
**필수 조건:** `gcloud` CLI, `gog`(gogcli), 활성화된 OpenClaw hooks, 공개 HTTPS 엔드포인트용 Tailscale.
</Note>

### 마법사 설정(권장)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

이 명령은 `hooks.gmail` config를 쓰고, Gmail preset을 활성화하며, push endpoint에 Tailscale Funnel을 사용합니다.

### Gateway 자동 시작

`hooks.enabled=true`이고 `hooks.gmail.account`가 설정된 경우, Gateway는 부팅 시 `gog gmail watch serve`를 시작하고 watch를 자동 갱신합니다. 사용하지 않으려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.

### 수동 1회 설정

<Steps>
  <Step title="Select the GCP project">
    `gog`에서 사용하는 OAuth 클라이언트를 소유한 GCP 프로젝트를 선택합니다.

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail model 재정의

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
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Model 재정의 참고:

- `openclaw cron add|edit --model ...`는 작업의 선택된 model을 변경합니다.
- model이 허용되는 경우, 해당 정확한 provider/model이 격리된 agent 실행에 도달합니다.
- 허용되지 않거나 해석할 수 없는 경우, cron은 명시적 검증 오류와 함께 실행에 실패합니다.
- 구성된 fallback chain은 계속 적용됩니다. cron `--model`은 session `/model` 재정의가 아니라 작업의 primary이기 때문입니다.
- Payload `fallbacks`는 해당 작업의 구성된 fallback을 대체합니다. `fallbacks: []`는 fallback을 비활성화하고 실행을 strict하게 만듭니다.
- 명시적 또는 구성된 fallback list가 없는 일반 `--model`은 agent primary로 조용한 추가 retry target처럼 넘어가지 않습니다.

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

`maxConcurrentRuns`는 예약된 cron dispatch와 격리된 agent 턴 실행을 모두 제한합니다. 격리된 cron agent 턴은 내부적으로 queue의 전용 `cron-nested` 실행 lane을 사용하므로, 이 값을 높이면 독립적인 cron LLM 실행이 외부 cron wrapper만 시작하는 대신 병렬로 진행될 수 있습니다. 공유 non-cron `nested` lane은 이 설정으로 확장되지 않습니다.

runtime state sidecar는 `cron.store`에서 파생됩니다. `~/clawd/cron/jobs.json` 같은 `.json` store는 `~/clawd/cron/jobs-state.json`을 사용하며, `.json` 접미사가 없는 store 경로는 `-state.json`을 추가합니다.

`jobs.json`을 직접 편집하는 경우 `jobs-state.json`은 소스 제어에서 제외하세요. OpenClaw는 해당 sidecar를 pending slot, active marker, last-run metadata, 그리고 외부에서 편집된 작업에 새 `nextRunAtMs`가 필요할 때 scheduler에 알려주는 schedule identity에 사용합니다.

cron 비활성화: `cron.enabled: false` 또는 `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **일회성 retry**: 일시적 오류(rate limit, overload, network, server error)는 exponential backoff로 최대 3회까지 retry합니다. 영구 오류는 즉시 비활성화됩니다.

    **반복 retry**: retry 사이에 exponential backoff(30초에서 60분)를 사용합니다. Backoff는 다음 성공한 실행 후 재설정됩니다.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`(기본값 `24h`)은 격리된 run-session 항목을 정리합니다. `cron.runLog.maxBytes` / `cron.runLog.keepLines`는 run-log 파일을 자동 정리합니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

### 명령 사다리

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
  <Accordion title="Cron not firing">
    - `cron.enabled`와 `OPENCLAW_SKIP_CRON` env var를 확인하세요.
    - Gateway가 계속 실행 중인지 확인하세요.
    - `cron` schedule의 경우 timezone(`--tz`)과 host timezone을 비교해 확인하세요.
    - run output의 `reason: not-due`는 수동 실행을 `openclaw cron run <jobId> --due`로 확인했으며 작업이 아직 due가 아니었음을 의미합니다.

  </Accordion>
  <Accordion title="Cron이 실행되었지만 전달되지 않음">
    - 전달 모드가 `none`이면 runner 대체 전송이 예상되지 않습니다. 채팅 경로를 사용할 수 있으면 agent는 여전히 `message` 도구로 직접 보낼 수 있습니다.
    - 전달 대상이 없거나 잘못된 경우(`channel`/`to`) 아웃바운드가 건너뛰어졌음을 의미합니다.
    - Matrix의 경우, 복사된 작업 또는 레거시 작업에서 `delivery.to` 방 ID가 소문자로 바뀌어 있으면 Matrix 방 ID는 대소문자를 구분하므로 실패할 수 있습니다. 작업을 Matrix의 정확한 `!room:server` 또는 `room:!room:server` 값으로 수정하세요.
    - 채널 인증 오류(`unauthorized`, `Forbidden`)는 자격 증명 때문에 전달이 차단되었음을 의미합니다.
    - 격리된 실행이 무음 토큰(`NO_REPLY` / `no_reply`)만 반환하면 OpenClaw는 직접 아웃바운드 전달을 억제하고 대체 대기열 요약 경로도 억제하므로 채팅에 아무것도 다시 게시되지 않습니다.
    - agent가 사용자에게 직접 메시지를 보내야 한다면 작업에 사용 가능한 경로가 있는지 확인하세요(`channel: "last"`와 이전 채팅, 또는 명시적인 채널/대상).

  </Accordion>
  <Accordion title="Cron 또는 heartbeat가 /new-style 롤오버를 막는 것처럼 보임">
    - 일일 및 유휴 재설정의 최신성은 `updatedAt`을 기준으로 하지 않습니다. [세션 관리](/ko/concepts/session#session-lifecycle)를 참고하세요.
    - Cron wakeup, heartbeat 실행, exec 알림, Gateway bookkeeping은 라우팅/상태를 위해 세션 행을 업데이트할 수 있지만 `sessionStartedAt` 또는 `lastInteractionAt`을 연장하지는 않습니다.
    - 해당 필드가 존재하기 전에 생성된 레거시 행의 경우, 파일을 계속 사용할 수 있으면 OpenClaw가 transcript JSONL 세션 헤더에서 `sessionStartedAt`을 복구할 수 있습니다. `lastInteractionAt`이 없는 레거시 유휴 행은 복구된 시작 시간을 유휴 기준선으로 사용합니다.

  </Accordion>
  <Accordion title="시간대 관련 주의 사항">
    - `--tz`가 없는 Cron은 Gateway 호스트 시간대를 사용합니다.
    - 시간대가 없는 `at` 일정은 UTC로 처리됩니다.
    - Heartbeat `activeHours`는 구성된 시간대 해석을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — cron 실행의 작업 원장
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 기본 세션 턴
- [시간대](/ko/concepts/timezone) — 시간대 구성
