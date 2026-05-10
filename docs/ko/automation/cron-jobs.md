---
read_when:
    - 백그라운드 작업 또는 웨이크업 예약
    - 외부 트리거(Webhook, Gmail)를 OpenClaw에 연결하기
    - 예약된 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Scheduled tasks
summary: Gateway 스케줄러를 위한 예약 작업, Webhook 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-05-10T19:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 영구 저장하고, 적절한 시점에 에이전트를 깨우며, 출력을 채팅 채널이나 webhook 엔드포인트로 다시 전달할 수 있습니다.

## 빠른 시작

<Steps>
  <Step title="일회성 알림 추가">
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

## Cron 작동 방식

- Cron은 모델 내부가 아니라 **Gateway** 프로세스 내부에서 실행됩니다.
- 작업 정의는 `~/.openclaw/cron/jobs.json`에 영구 저장되므로 다시 시작해도 스케줄이 사라지지 않습니다.
- 런타임 실행 상태는 그 옆의 `~/.openclaw/cron/jobs-state.json`에 영구 저장됩니다. Cron 정의를 git에서 추적한다면 `jobs.json`을 추적하고 `jobs-state.json`은 gitignore에 추가하세요.
- 분리 이후에는 이전 OpenClaw 버전이 `jobs.json`을 읽을 수 있지만, 이제 런타임 필드가 `jobs-state.json`에 있으므로 작업을 새 작업으로 취급할 수 있습니다.
- Gateway가 실행 중이거나 중지된 상태에서 `jobs.json`이 편집되면 OpenClaw는 변경된 스케줄 필드를 대기 중인 런타임 슬롯 메타데이터와 비교하고 오래된 `nextRunAtMs` 값을 지웁니다. 순수한 형식 변경이나 키 순서만 바뀐 재작성은 대기 중인 슬롯을 유지합니다.
- 모든 Cron 실행은 [background task](/ko/automation/tasks) 레코드를 생성합니다.
- Gateway 시작 시, 기한이 지난 격리된 에이전트 턴 작업은 즉시 재생되지 않고 채널 연결 구간 밖으로 다시 스케줄되므로, 다시 시작한 뒤에도 Discord/Telegram 시작과 네이티브 명령 설정이 응답성을 유지합니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다.
- 격리된 Cron 실행은 실행이 완료되면 `cron:<jobId>` 세션에 대해 추적된 브라우저 탭/프로세스를 최선의 방식으로 닫으므로, 분리된 브라우저 자동화가 고아 프로세스를 남기지 않습니다.
- 좁은 Cron 자체 정리 권한을 받은 격리된 Cron 실행은 여전히 스케줄러 상태, 현재 작업의 자체 필터링된 목록, 해당 작업의 실행 기록을 읽을 수 있으므로 상태/Heartbeat 확인이 더 넓은 Cron 변경 권한을 얻지 않고도 자체 스케줄을 검사할 수 있습니다.
- 격리된 Cron 실행은 오래된 확인 응답도 방지합니다. 첫 번째 결과가 단순한 중간 상태 업데이트(`on it`, `pulling everything together` 및 유사한 힌트)이고 최종 답변을 책임지는 하위 서브에이전트 실행이 더 이상 없으면, OpenClaw는 전달 전에 실제 결과를 한 번 다시 요청합니다.
- 격리된 Cron 실행은 내장 실행의 구조화된 실행 거부 메타데이터를 우선 사용한 뒤, `SYSTEM_RUN_DENIED` 및 `INVALID_REQUEST` 같은 알려진 최종 요약/출력 마커로 폴백하므로, 차단된 명령이 성공한 실행으로 보고되지 않습니다.
- 격리된 Cron 실행은 응답 페이로드가 생성되지 않은 경우에도 실행 수준 에이전트 실패를 작업 오류로 취급하므로, 모델/제공자 실패가 작업을 성공으로 지우는 대신 오류 카운터를 증가시키고 실패 알림을 트리거합니다.
- 격리된 에이전트 턴 작업이 `timeoutSeconds`에 도달하면 Cron은 기본 에이전트 실행을 중단하고 짧은 정리 시간을 제공합니다. 실행이 비워지지 않으면 Gateway 소유 정리가 Cron이 타임아웃을 기록하기 전에 해당 실행의 세션 소유권을 강제로 지우므로, 대기 중인 채팅 작업이 오래된 처리 세션 뒤에 남지 않습니다.
- 격리된 에이전트 턴이 러너 시작 전이나 첫 모델 호출 전에 멈추면 Cron은 `setup timed out before runner start` 또는 `stalled before first model call (last phase: context-engine)` 같은 단계별 타임아웃을 기록합니다. 이러한 watchdog은 외부 CLI 프로세스가 실제로 시작되기 전의 내장 제공자와 CLI 기반 제공자를 포괄하며, 긴 `timeoutSeconds` 값과 독립적으로 제한되므로 콜드 스타트/인증/컨텍스트 실패가 전체 작업 예산을 기다리지 않고 빠르게 드러납니다.

<a id="maintenance"></a>

<Note>
Cron의 작업 조정은 먼저 런타임 소유이고, 그다음 내구성 있는 기록 기반입니다. 활성 Cron 작업은 오래된 자식 세션 행이 여전히 존재하더라도 Cron 런타임이 해당 작업을 실행 중으로 추적하는 동안 계속 활성 상태로 유지됩니다. 런타임이 작업 소유를 중지하고 5분 유예 시간이 만료되면, 유지 관리가 일치하는 `cron:<jobId>:<startedAt>` 실행에 대해 영구 저장된 실행 로그와 작업 상태를 확인합니다. 해당 내구성 있는 기록에 종료 결과가 있으면 작업 원장이 그 기록을 기준으로 확정되고, 그렇지 않으면 Gateway 소유 유지 관리가 작업을 `lost`로 표시할 수 있습니다. 오프라인 CLI 감사는 내구성 있는 기록에서 복구할 수 있지만, 자체 프로세스 내 활성 작업 집합이 비어 있다는 사실만으로 Gateway 소유 Cron 실행이 사라졌다는 증거로 취급하지 않습니다.
</Note>

## 스케줄 유형

| 종류    | CLI 플래그  | 설명                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 일회성 타임스탬프(ISO 8601 또는 `20m` 같은 상대값)    |
| `every` | `--every` | 고정 간격                                          |
| `cron`  | `--cron`  | 선택적 `--tz`가 있는 5필드 또는 6필드 Cron 표현식 |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 로컬 벽시계 기준 스케줄링에는 `--tz America/New_York`를 추가하세요.

매시 정각 반복 표현식은 부하 급증을 줄이기 위해 최대 5분까지 자동으로 분산됩니다. 정확한 타이밍을 강제하려면 `--exact`를 사용하고, 명시적 창에는 `--stagger 30s`를 사용하세요.

### 일(day-of-month)과 요일(day-of-week)은 OR 논리를 사용합니다

Cron 표현식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. 일(day-of-month) 필드와 요일(day-of-week) 필드가 모두 와일드카드가 아닐 때, croner는 두 필드가 모두 아니라 **둘 중 하나**가 일치하면 매칭합니다. 이는 표준 Vixie Cron 동작입니다.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

이 경우 한 달에 0~1회가 아니라 약 5~6회 실행됩니다. OpenClaw는 여기서 Croner의 기본 OR 동작을 사용합니다. 두 조건을 모두 요구하려면 Croner의 `+` 요일 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드로 스케줄하고 작업의 프롬프트나 명령에서 다른 필드를 검사하세요.

## 실행 스타일

| 스타일           | `--session` 값   | 실행 위치                  | 적합한 용도                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 기본 세션    | `main`              | 다음 Heartbeat 턴      | 알림, 시스템 이벤트        |
| 격리        | `isolated`          | 전용 `cron:<jobId>` | 보고서, 백그라운드 잡무      |
| 현재 세션 | `current`           | 생성 시점에 바인딩   | 컨텍스트 인식 반복 작업    |
| 사용자 지정 세션  | `session:custom-id` | 영구 이름 지정 세션 | 기록을 기반으로 이어지는 워크플로 |

<AccordionGroup>
  <Accordion title="기본 세션 vs 격리 vs 사용자 지정">
    **기본 세션** 작업은 시스템 이벤트를 큐에 넣고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). 이러한 시스템 이벤트는 대상 세션의 일일/유휴 재설정 최신성을 연장하지 않습니다. **격리** 작업은 새 세션으로 전용 에이전트 턴을 실행합니다. **사용자 지정 세션**(`session:xxx`)은 실행 간 컨텍스트를 유지하여 이전 요약을 기반으로 하는 일일 스탠드업 같은 워크플로를 가능하게 합니다.
  </Accordion>
  <Accordion title="격리 작업에서 '새 세션'의 의미">
    격리 작업에서 "새 세션"은 각 실행마다 새로운 transcript/session id를 의미합니다. OpenClaw는 thinking/fast/verbose 설정, 레이블, 명시적으로 사용자가 선택한 모델/인증 재정의 같은 안전한 선호 설정을 전달할 수 있지만, 오래된 Cron 행의 주변 대화 컨텍스트인 채널/그룹 라우팅, 전송 또는 큐 정책, 권한 상승, 출처, ACP 런타임 바인딩은 상속하지 않습니다. 반복 작업이 의도적으로 동일한 대화 컨텍스트를 기반으로 이어져야 할 때는 `current` 또는 `session:<id>`를 사용하세요.
  </Accordion>
  <Accordion title="런타임 정리">
    격리 작업의 경우 이제 런타임 해체에 해당 Cron 세션의 최선의 브라우저 정리가 포함됩니다. 실제 Cron 결과가 우선하도록 정리 실패는 무시됩니다.

    격리된 Cron 실행은 공유 런타임 정리 경로를 통해 작업을 위해 생성된 번들 MCP 런타임 인스턴스도 폐기합니다. 이는 기본 세션 및 사용자 지정 세션 MCP 클라이언트를 해체하는 방식과 일치하므로, 격리된 Cron 작업은 실행 간에 stdio 자식 프로세스나 오래 지속되는 MCP 연결을 누수하지 않습니다.

  </Accordion>
  <Accordion title="서브에이전트 및 Discord 전달">
    격리된 Cron 실행이 서브에이전트를 조율할 때, 전달은 오래된 부모 중간 텍스트보다 최종 하위 출력을 우선합니다. 하위 항목이 아직 실행 중이면 OpenClaw는 해당 부분적인 부모 업데이트를 알리는 대신 억제합니다.

    텍스트 전용 Discord 알림 대상의 경우, OpenClaw는 스트리밍/중간 텍스트 페이로드와 최종 답변을 모두 재생하지 않고 표준 최종 어시스턴트 텍스트를 한 번 보냅니다. 미디어 및 구조화된 Discord 페이로드는 첨부 파일과 컴포넌트가 누락되지 않도록 여전히 별도 페이로드로 전달됩니다.

  </Accordion>
</AccordionGroup>

### 격리 작업의 페이로드 옵션

<ParamField path="--message" type="string" required>
  프롬프트 텍스트(격리 작업에 필수).
</ParamField>
<ParamField path="--model" type="string">
  모델 재정의. 작업에 대해 선택된 허용 모델을 사용합니다.
</ParamField>
<ParamField path="--thinking" type="string">
  사고 수준 재정의.
</ParamField>
<ParamField path="--light-context" type="boolean">
  워크스페이스 부트스트랩 파일 주입을 건너뜁니다.
</ParamField>
<ParamField path="--tools" type="string">
  작업이 사용할 수 있는 도구를 제한합니다. 예: `--tools exec,read`.
</ParamField>

`--model`은 선택된 허용 모델을 해당 작업의 기본 모델로 사용합니다. 이는 채팅 세션 `/model` 재정의와 같지 않습니다. 작업 기본 모델이 실패해도 구성된 폴백 체인은 계속 적용됩니다. 요청한 모델이 허용되지 않았거나 해석할 수 없으면, Cron은 작업의 에이전트/기본 모델 선택으로 조용히 폴백하지 않고 명시적 검증 오류로 실행을 실패 처리합니다.

Cron 작업은 페이로드 수준 `fallbacks`도 포함할 수 있습니다. 존재하는 경우 해당 목록은 작업에 대해 구성된 폴백 체인을 대체합니다. 선택한 모델만 시도하는 엄격한 Cron 실행을 원할 때는 작업 페이로드/API에서 `fallbacks: []`를 사용하세요. 작업에 `--model`이 있지만 페이로드나 구성된 폴백이 없으면, OpenClaw는 에이전트 기본 모델이 숨겨진 추가 재시도 대상으로 덧붙지 않도록 명시적인 빈 폴백 재정의를 전달합니다.

격리 작업의 모델 선택 우선순위는 다음과 같습니다.

1. Gmail 훅 모델 재정의(실행이 Gmail에서 왔고 해당 재정의가 허용된 경우)
2. 작업별 페이로드 `model`
3. 사용자가 선택해 저장한 Cron 세션 모델 재정의
4. 에이전트/기본 모델 선택

빠른 모드도 해석된 실시간 선택을 따릅니다. 선택된 모델 구성에 `params.fastMode`가 있으면 격리된 Cron은 기본적으로 이를 사용합니다. 저장된 세션 `fastMode` 재정의는 어느 방향이든 구성보다 우선합니다.

격리된 실행이 실시간 모델 전환 핸드오프에 도달하면, Cron은 전환된 제공자/모델로 다시 시도하고 재시도 전에 해당 활성 실행의 실시간 선택을 영구 저장합니다. 전환에 새 인증 프로필도 포함되어 있으면, Cron은 해당 활성 실행의 인증 프로필 재정의도 영구 저장합니다. 재시도는 제한됩니다. 최초 시도와 2회의 전환 재시도 후에는 Cron이 무한 루프를 도는 대신 중단합니다.

격리된 Cron 실행이 에이전트 러너에 들어가기 전에, OpenClaw는 구성된 `api: "ollama"` 및 `api: "openai-completions"` provider 중 `baseUrl`이 루프백, 사설 네트워크 또는 `.local`인 경우 도달 가능한 로컬 provider 엔드포인트를 확인합니다. 해당 엔드포인트가 내려가 있으면 모델 호출을 시작하는 대신 명확한 provider/모델 오류와 함께 실행이 `skipped`로 기록됩니다. 엔드포인트 결과는 5분 동안 캐시되므로, 동일하게 죽은 로컬 Ollama, vLLM, SGLang 또는 LM Studio 서버를 사용하는 여러 예정 작업이 요청 폭주를 만들지 않고 하나의 작은 probe를 공유합니다. 건너뛴 provider-preflight 실행은 실행 오류 backoff를 증가시키지 않습니다. 반복적인 건너뜀 알림을 원하면 `failureAlert.includeSkipped`를 활성화하세요.

## 전달 및 출력

| 모드       | 발생하는 일                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 에이전트가 보내지 않은 경우 최종 텍스트를 대상으로 fallback 전달 |
| `webhook`  | 완료된 이벤트 payload를 URL로 POST                                |
| `none`     | 러너 fallback 전달 없음                                         |

채널 전달에는 `--announce --channel telegram --to "-1001234567890"`을 사용하세요. Telegram 포럼 주제에는 `-1001234567890:topic:123`을 사용하세요. 직접 RPC/config 호출자는 `delivery.threadId`를 문자열이나 숫자로 전달할 수도 있습니다. Slack/Discord/Mattermost 대상은 명시적 prefix(`channel:<id>`, `user:<id>`)를 사용해야 합니다. Matrix room ID는 대소문자를 구분합니다. 정확한 room ID 또는 Matrix의 `room:!room:server` 형식을 사용하세요.

announce 전달에서 `channel: "last"`를 사용하거나 `channel`을 생략하면, `telegram:123` 같은 provider-prefix 대상이 Cron이 세션 기록 또는 하나의 구성된 채널로 fallback하기 전에 채널을 선택할 수 있습니다. 로드된 Plugin이 광고한 prefix만 provider selector입니다. `delivery.channel`이 명시된 경우 대상 prefix는 동일한 provider를 지정해야 합니다. 예를 들어 `channel: "whatsapp"`에 `to: "telegram:123"`을 함께 사용하면 WhatsApp이 Telegram ID를 전화번호로 해석하게 두는 대신 거부됩니다. `channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>` 같은 대상 종류 및 서비스 prefix는 provider selector가 아니라 채널이 소유한 대상 문법으로 남습니다.

격리된 작업에서는 채팅 전달이 공유됩니다. 채팅 route를 사용할 수 있으면 작업이 `--no-deliver`를 사용하더라도 에이전트가 `message` 도구를 사용할 수 있습니다. 에이전트가 구성된/현재 대상으로 보내면 OpenClaw는 fallback announce를 건너뜁니다. 그렇지 않으면 `announce`, `webhook`, `none`은 에이전트 turn 이후 러너가 최종 응답으로 무엇을 할지만 제어합니다.

에이전트가 활성 채팅에서 격리된 reminder를 만들면 OpenClaw는 fallback announce route를 위해 보존된 live 전달 대상을 저장합니다. 내부 세션 키는 소문자일 수 있습니다. 현재 채팅 context를 사용할 수 있으면 provider 전달 대상은 해당 키에서 재구성되지 않습니다.

암시적 announce 전달은 구성된 채널 allowlist를 사용해 오래된 대상을 검증하고 reroute합니다. DM pairing-store approval은 fallback automation 수신자가 아닙니다. 예약 작업이 DM으로 선제적으로 보내야 하는 경우 `delivery.to`를 설정하거나 채널 `allowFrom` 항목을 구성하세요.

실패 알림은 별도의 destination path를 따릅니다.

- `cron.failureDestination`은 실패 알림의 전역 기본값을 설정합니다.
- `job.delivery.failureDestination`은 작업별로 이를 override합니다.
- 둘 다 설정되지 않았고 작업이 이미 `announce`로 전달하는 경우, 실패 알림은 이제 해당 기본 announce 대상으로 fallback합니다.
- `delivery.failureDestination`은 기본 전달 모드가 `webhook`인 경우를 제외하고 `sessionTarget="isolated"` 작업에서만 지원됩니다.
- `failureAlert.includeSkipped: true`는 작업 또는 전역 Cron 알림 정책이 반복적인 건너뛴 실행 알림을 사용하도록 합니다. 건너뛴 실행은 별도의 연속 건너뜀 counter를 유지하므로 실행 오류 backoff에는 영향을 주지 않습니다.

## CLI 예시

<Tabs>
  <Tab title="일회성 reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="반복 격리 작업">
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

Gateway는 외부 trigger를 위한 HTTP Webhook 엔드포인트를 노출할 수 있습니다. config에서 활성화하세요.

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

모든 요청은 header를 통해 hook token을 포함해야 합니다.

- `Authorization: Bearer <token>`(권장)
- `x-openclaw-token: <token>`

Query-string token은 거부됩니다.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    main session에 system event를 queue에 넣습니다.

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
      `now` 또는 `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    격리된 에이전트 turn을 실행합니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    필드: `message`(필수), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="매핑된 hook (POST /hooks/<name>)">
    사용자 지정 hook 이름은 config의 `hooks.mappings`를 통해 해석됩니다. Mapping은 template 또는 code transform을 사용해 임의의 payload를 `wake` 또는 `agent` action으로 변환할 수 있습니다.
  </Accordion>
</AccordionGroup>

<Warning>
hook 엔드포인트는 루프백, tailnet 또는 신뢰할 수 있는 reverse proxy 뒤에 두세요.

- 전용 hook token을 사용하세요. gateway auth token을 재사용하지 마세요.
- `hooks.path`는 전용 subpath로 유지하세요. `/`는 거부됩니다.
- 명시적 `agentId` routing을 제한하려면 `hooks.allowedAgentIds`를 설정하세요.
- 호출자가 선택한 session이 필요한 경우가 아니라면 `hooks.allowRequestSessionKey=false`로 유지하세요.
- `hooks.allowRequestSessionKey`를 활성화하는 경우, 허용되는 session key 형태를 제한하도록 `hooks.allowedSessionKeyPrefixes`도 설정하세요.
- Hook payload는 기본적으로 safety boundary로 감싸집니다.

</Warning>

## Gmail PubSub 통합

Google PubSub을 통해 Gmail inbox trigger를 OpenClaw에 연결하세요.

<Note>
**필수 조건:** `gcloud` CLI, `gog`(gogcli), OpenClaw hook 활성화, 공개 HTTPS 엔드포인트용 Tailscale.
</Note>

### Wizard 설정(권장)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

이는 `hooks.gmail` config를 작성하고, Gmail preset을 활성화하며, push 엔드포인트에 Tailscale Funnel을 사용합니다.

### Gateway 자동 시작

`hooks.enabled=true`이고 `hooks.gmail.account`가 설정되면 Gateway는 부팅 시 `gog gmail watch serve`를 시작하고 watch를 자동 갱신합니다. opt out하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.

### 수동 일회성 설정

<Steps>
  <Step title="GCP 프로젝트 선택">
    `gog`에서 사용하는 OAuth client를 소유한 GCP 프로젝트를 선택하세요.

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="topic 생성 및 Gmail push 접근 권한 부여">
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
모델 override 참고:

- `openclaw cron add|edit --model ...`은 작업의 선택된 모델을 변경합니다.
- 모델이 허용되면 해당 정확한 provider/model이 격리된 에이전트 실행에 도달합니다.
- 허용되지 않거나 해석할 수 없으면 Cron은 명시적 validation 오류와 함께 실행을 실패 처리합니다.
- 구성된 fallback chain은 계속 적용됩니다. Cron `--model`은 session `/model` override가 아니라 작업 기본값이기 때문입니다.
- Payload `fallbacks`는 해당 작업의 구성된 fallback을 대체합니다. `fallbacks: []`는 fallback을 비활성화하고 실행을 strict하게 만듭니다.
- 명시적 또는 구성된 fallback list가 없는 단순 `--model`은 조용한 추가 retry 대상으로 에이전트 기본값까지 fall through하지 않습니다.

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

`maxConcurrentRuns`는 예약된 Cron dispatch와 격리된 에이전트 turn 실행을 모두 제한합니다. 격리된 Cron 에이전트 turn은 내부적으로 queue의 전용 `cron-nested` 실행 lane을 사용하므로, 이 값을 높이면 독립적인 Cron LLM 실행이 외부 Cron wrapper만 시작하는 대신 병렬로 진행될 수 있습니다. 공유 non-cron `nested` lane은 이 설정으로 확장되지 않습니다.

runtime state sidecar는 `cron.store`에서 파생됩니다. `~/clawd/cron/jobs.json` 같은 `.json` store는 `~/clawd/cron/jobs-state.json`을 사용하며, `.json` suffix가 없는 store path는 `-state.json`을 append합니다.

`jobs.json`을 직접 편집하는 경우 `jobs-state.json`은 source control에서 제외하세요. OpenClaw는 해당 sidecar를 pending slot, active marker, last-run metadata, 그리고 외부에서 편집된 작업에 새로운 `nextRunAtMs`가 필요한 시점을 scheduler에 알려주는 schedule identity에 사용합니다.

Cron 비활성화: `cron.enabled: false` 또는 `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry 동작">
    **일회성 retry**: 일시적 오류(rate limit, overload, network, server error)는 exponential backoff로 최대 3회 retry합니다. 영구 오류는 즉시 비활성화합니다.

    **반복 retry**: retry 사이에 exponential backoff(30초에서 60분)를 적용합니다. Backoff는 다음 성공 실행 후 reset됩니다.

  </Accordion>
  <Accordion title="유지 관리">
    `cron.sessionRetention`(기본값 `24h`)은 격리된 run-session 항목을 prune합니다. `cron.runLog.maxBytes` / `cron.runLog.keepLines`는 run-log 파일을 자동 prune합니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

### Command ladder

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
    - `cron.enabled`와 `OPENCLAW_SKIP_CRON` 환경 변수를 확인합니다.
    - Gateway가 계속 실행 중인지 확인합니다.
    - `cron` 일정의 경우 시간대(`--tz`)와 호스트 시간대를 확인합니다.
    - 실행 출력의 `reason: not-due`는 `openclaw cron run <jobId> --due`로 수동 실행을 확인했으며 작업의 실행 시점이 아직 되지 않았음을 의미합니다.

  </Accordion>
  <Accordion title="Cron은 실행되었지만 전달되지 않음">
    - 전달 모드 `none`은 러너 대체 전송이 예상되지 않는다는 뜻입니다. 채팅 라우트가 사용 가능하면 에이전트는 여전히 `message` 도구로 직접 보낼 수 있습니다.
    - 전달 대상이 없거나 유효하지 않음(`channel`/`to`)은 아웃바운드가 건너뛰어졌음을 의미합니다.
    - Matrix의 경우, 복사되었거나 레거시 작업에서 소문자로 된 `delivery.to` 룸 ID를 사용하면 Matrix 룸 ID가 대소문자를 구분하므로 실패할 수 있습니다. 작업을 Matrix의 정확한 `!room:server` 또는 `room:!room:server` 값으로 수정하세요.
    - 채널 인증 오류(`unauthorized`, `Forbidden`)는 자격 증명으로 인해 전달이 차단되었음을 의미합니다.
    - 격리된 실행이 무음 토큰(`NO_REPLY` / `no_reply`)만 반환하면 OpenClaw는 직접 아웃바운드 전달을 억제하고 대체 대기열 요약 경로도 억제하므로 채팅에 아무것도 다시 게시되지 않습니다.
    - 에이전트가 사용자에게 직접 메시지를 보내야 한다면 작업에 사용 가능한 라우트가 있는지 확인하세요(`channel: "last"`와 이전 채팅, 또는 명시적 채널/대상).

  </Accordion>
  <Accordion title="Cron 또는 Heartbeat가 /new-style 롤오버를 막는 것처럼 보임">
    - 일일 및 유휴 재설정의 최신성은 `updatedAt`을 기준으로 하지 않습니다. [세션 관리](/ko/concepts/session#session-lifecycle)를 참조하세요.
    - Cron 깨우기, Heartbeat 실행, exec 알림, Gateway 장부 기록은 라우팅/상태를 위해 세션 행을 업데이트할 수 있지만, `sessionStartedAt` 또는 `lastInteractionAt`을 연장하지는 않습니다.
    - 해당 필드가 존재하기 전에 생성된 레거시 행의 경우, 파일이 아직 사용 가능하면 OpenClaw는 transcript JSONL 세션 헤더에서 `sessionStartedAt`을 복구할 수 있습니다. `lastInteractionAt`이 없는 레거시 유휴 행은 복구된 시작 시간을 유휴 기준선으로 사용합니다.

  </Accordion>
  <Accordion title="시간대 주의 사항">
    - `--tz`가 없는 Cron은 gateway 호스트 시간대를 사용합니다.
    - 시간대가 없는 `at` 일정은 UTC로 처리됩니다.
    - Heartbeat `activeHours`는 구성된 시간대 해석을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — cron 실행을 위한 작업 원장
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 메인 세션 턴
- [시간대](/ko/concepts/timezone) — 시간대 구성
