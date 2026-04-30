---
read_when:
    - 백그라운드 작업 또는 깨우기 예약
    - 외부 트리거(Webhook, Gmail)를 OpenClaw에 연결하기
    - 예약 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Scheduled tasks
summary: Gateway 스케줄러용 예약 작업, Webhook 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-04-30T06:16:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 영구 저장하고, 적절한 시점에 에이전트를 깨우며, 출력을 채팅 채널이나 Webhook 엔드포인트로 다시 전달할 수 있습니다.

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

- Cron은 **Gateway 내부** 프로세스에서 실행됩니다(모델 내부가 아님).
- 작업 정의는 `~/.openclaw/cron/jobs.json`에 영구 저장되므로 다시 시작해도 일정이 사라지지 않습니다.
- 런타임 실행 상태는 그 옆의 `~/.openclaw/cron/jobs-state.json`에 영구 저장됩니다. Cron 정의를 git으로 추적한다면 `jobs.json`을 추적하고 `jobs-state.json`은 gitignore에 추가하세요.
- 분리 이후에는 이전 OpenClaw 버전이 `jobs.json`을 읽을 수는 있지만, 런타임 필드가 이제 `jobs-state.json`에 있으므로 작업을 새 작업으로 처리할 수 있습니다.
- Gateway가 실행 중이거나 중지된 동안 `jobs.json`이 편집되면 OpenClaw는 변경된 일정 필드를 대기 중인 런타임 슬롯 메타데이터와 비교하고 오래된 `nextRunAtMs` 값을 지웁니다. 순수한 형식 변경이나 키 순서만 바뀐 재작성은 대기 중인 슬롯을 보존합니다.
- 모든 Cron 실행은 [백그라운드 작업](/ko/automation/tasks) 레코드를 생성합니다.
- Gateway 시작 시 기한이 지난 격리된 에이전트 턴 작업은 즉시 재생되는 대신 채널 연결 시간대 밖으로 다시 예약되므로, 재시작 후 Discord/Telegram 시작과 네이티브 명령 설정이 계속 빠르게 응답합니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다.
- 격리된 Cron 실행은 실행이 완료되면 해당 `cron:<jobId>` 세션에 대해 추적된 브라우저 탭/프로세스를 최선의 노력으로 닫으므로, 분리된 브라우저 자동화가 고아 프로세스를 남기지 않습니다.
- 격리된 Cron 실행은 오래된 확인 응답도 방지합니다. 첫 결과가 임시 상태 업데이트(`on it`, `pulling everything together` 및 유사한 힌트)에 불과하고, 최종 답변을 책임지는 하위 서브에이전트 실행이 더 이상 없다면 OpenClaw는 전달 전에 실제 결과를 한 번 다시 요청합니다.
- 격리된 Cron 실행은 내장 실행의 구조화된 실행 거부 메타데이터를 우선 사용한 다음, `SYSTEM_RUN_DENIED` 및 `INVALID_REQUEST` 같은 알려진 최종 요약/출력 마커로 대체하므로, 차단된 명령이 정상 실행으로 보고되지 않습니다.
- 격리된 Cron 실행은 응답 페이로드가 생성되지 않은 경우에도 실행 수준의 에이전트 실패를 작업 오류로 처리하므로, 모델/프로바이더 실패는 작업을 성공으로 지우는 대신 오류 카운터를 증가시키고 실패 알림을 트리거합니다.
- 격리된 에이전트 턴 작업이 `timeoutSeconds`에 도달하면 Cron은 기본 에이전트 실행을 중단하고 짧은 정리 시간을 줍니다. 실행이 비워지지 않으면 Gateway 소유 정리가 Cron이 타임아웃을 기록하기 전에 해당 실행의 세션 소유권을 강제로 지우므로, 대기 중인 채팅 작업이 오래된 처리 세션 뒤에 남지 않습니다.

<a id="maintenance"></a>

<Note>
Cron의 작업 조정은 먼저 런타임 소유이고, 그다음 내구성 있는 기록 기반입니다. 활성 Cron 작업은 오래된 하위 세션 행이 아직 존재하더라도 Cron 런타임이 해당 작업을 실행 중으로 계속 추적하는 동안 살아 있습니다. 런타임이 작업 소유를 중지하고 5분 유예 시간이 만료되면, 유지 관리가 일치하는 `cron:<jobId>:<startedAt>` 실행에 대한 영구 실행 로그와 작업 상태를 확인합니다. 해당 내구성 있는 기록이 종료 결과를 보여주면 작업 원장은 그것을 기준으로 마무리됩니다. 그렇지 않으면 Gateway 소유 유지 관리가 작업을 `lost`로 표시할 수 있습니다. 오프라인 CLI 감사는 내구성 있는 기록에서 복구할 수 있지만, 자체적인 비어 있는 인프로세스 활성 작업 집합을 Gateway 소유 Cron 실행이 사라졌다는 증거로 취급하지 않습니다.
</Note>

## 일정 유형

| 종류    | CLI 플래그 | 설명                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 일회성 타임스탬프(ISO 8601 또는 `20m` 같은 상대 시간)  |
| `every` | `--every` | 고정 간격                                               |
| `cron`  | `--cron`  | 선택적 `--tz`가 있는 5필드 또는 6필드 Cron 표현식       |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 로컬 벽시계 기준 예약에는 `--tz America/New_York`를 추가하세요.

매시 정각 반복 표현식은 부하 급증을 줄이기 위해 자동으로 최대 5분까지 분산됩니다. 정확한 시간을 강제하려면 `--exact`를 사용하고, 명시적 시간 범위를 지정하려면 `--stagger 30s`를 사용하세요.

### 일자와 요일은 OR 논리를 사용합니다

Cron 표현식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. 일자 필드와 요일 필드가 모두 와일드카드가 아닐 때 croner는 두 필드가 모두 일치할 때가 아니라 **둘 중 하나**가 일치할 때 매치합니다. 이는 표준 Vixie Cron 동작입니다.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

이것은 한 달에 0~1회가 아니라 약 5~6회 실행됩니다. OpenClaw는 여기서 Croner의 기본 OR 동작을 사용합니다. 두 조건을 모두 요구하려면 Croner의 `+` 요일 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드로 예약하고 작업의 프롬프트나 명령에서 다른 조건을 검사하세요.

## 실행 스타일

| 스타일        | `--session` 값     | 실행 위치                | 적합한 용도                    |
| ------------- | ------------------ | ------------------------ | ------------------------------ |
| 메인 세션     | `main`             | 다음 Heartbeat 턴        | 알림, 시스템 이벤트            |
| 격리          | `isolated`         | 전용 `cron:<jobId>`      | 보고서, 백그라운드 잡무        |
| 현재 세션     | `current`          | 생성 시점에 바인딩됨     | 컨텍스트 인식 반복 작업        |
| 사용자 세션   | `session:custom-id` | 영구 명명 세션           | 기록을 기반으로 쌓이는 워크플로 |

<AccordionGroup>
  <Accordion title="메인 세션, 격리, 사용자 세션 비교">
    **메인 세션** 작업은 시스템 이벤트를 큐에 넣고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). 이러한 시스템 이벤트는 대상 세션의 일일/유휴 재설정 최신성을 연장하지 않습니다. **격리된** 작업은 새 세션에서 전용 에이전트 턴을 실행합니다. **사용자 세션**(`session:xxx`)은 실행 간에 컨텍스트를 유지하여 이전 요약을 기반으로 쌓이는 일일 스탠드업 같은 워크플로를 가능하게 합니다.
  </Accordion>
  <Accordion title="격리된 작업에서 '새 세션'의 의미">
    격리된 작업에서 "새 세션"은 각 실행마다 새로운 transcript/session id를 의미합니다. OpenClaw는 사고/빠름/상세 설정, 레이블, 명시적으로 사용자가 선택한 모델/인증 재정의 같은 안전한 기본 설정을 전달할 수 있지만, 이전 Cron 행의 주변 대화 컨텍스트는 상속하지 않습니다. 여기에는 채널/그룹 라우팅, 전송 또는 큐 정책, 권한 상승, 출처, ACP 런타임 바인딩이 포함됩니다. 반복 작업이 같은 대화 컨텍스트를 의도적으로 기반으로 해야 한다면 `current` 또는 `session:<id>`를 사용하세요.
  </Accordion>
  <Accordion title="런타임 정리">
    격리된 작업의 경우, 런타임 해체에는 이제 해당 Cron 세션의 브라우저를 최선의 노력으로 정리하는 단계가 포함됩니다. 정리 실패는 무시되므로 실제 Cron 결과가 계속 우선합니다.

    격리된 Cron 실행은 공유 런타임 정리 경로를 통해 작업을 위해 생성된 번들 MCP 런타임 인스턴스도 모두 폐기합니다. 이는 메인 세션 및 사용자 세션 MCP 클라이언트가 해체되는 방식과 일치하므로, 격리된 Cron 작업이 실행 간에 stdio 하위 프로세스나 오래 유지되는 MCP 연결을 누수하지 않습니다.

  </Accordion>
  <Accordion title="서브에이전트와 Discord 전달">
    격리된 Cron 실행이 서브에이전트를 오케스트레이션할 때 전달은 오래된 부모 임시 텍스트보다 최종 하위 출력을 우선합니다. 하위 실행이 아직 실행 중이면 OpenClaw는 해당 부분적인 부모 업데이트를 알리는 대신 억제합니다.

    텍스트 전용 Discord 알림 대상의 경우, OpenClaw는 스트리밍/중간 텍스트 페이로드와 최종 답변을 모두 재생하는 대신 표준 최종 어시스턴트 텍스트를 한 번 전송합니다. 미디어 및 구조화된 Discord 페이로드는 첨부 파일과 컴포넌트가 누락되지 않도록 여전히 별도 페이로드로 전달됩니다.

  </Accordion>
</AccordionGroup>

### 격리된 작업의 페이로드 옵션

<ParamField path="--message" type="string" required>
  프롬프트 텍스트(격리 작업에는 필수).
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
  작업에서 사용할 수 있는 도구를 제한합니다. 예: `--tools exec,read`.
</ParamField>

`--model`은 선택된 허용 모델을 해당 작업의 기본 모델로 사용합니다. 이는 채팅 세션 `/model` 재정의와 다릅니다. 작업 기본 모델이 실패해도 구성된 대체 체인은 계속 적용됩니다. 요청한 모델이 허용되지 않았거나 해석할 수 없으면 Cron은 작업의 에이전트/기본 모델 선택으로 조용히 대체하지 않고 명시적인 검증 오류로 실행을 실패 처리합니다.

Cron 작업은 페이로드 수준 `fallbacks`도 포함할 수 있습니다. 이 목록이 있으면 작업에 대해 구성된 대체 체인을 대체합니다. 선택한 모델만 시도하는 엄격한 Cron 실행을 원할 때 작업 페이로드/API에서 `fallbacks: []`를 사용하세요. 작업에 `--model`이 있지만 페이로드 또는 구성된 대체가 모두 없다면, OpenClaw는 명시적인 빈 대체 재정의를 전달하여 에이전트 기본 모델이 숨겨진 추가 재시도 대상으로 붙지 않게 합니다.

격리된 작업의 모델 선택 우선순위는 다음과 같습니다.

1. Gmail 훅 모델 재정의(실행이 Gmail에서 왔고 해당 재정의가 허용되는 경우)
2. 작업별 페이로드 `model`
3. 사용자가 선택해 저장한 Cron 세션 모델 재정의
4. 에이전트/기본 모델 선택

빠른 모드도 해석된 라이브 선택을 따릅니다. 선택된 모델 구성에 `params.fastMode`가 있으면 격리된 Cron은 기본적으로 그것을 사용합니다. 저장된 세션 `fastMode` 재정의는 어느 방향이든 구성보다 우선합니다.

격리된 실행이 라이브 모델 전환 핸드오프에 도달하면, Cron은 전환된 프로바이더/모델로 다시 시도하고 재시도 전에 활성 실행에 대해 해당 라이브 선택을 영구 저장합니다. 전환이 새 인증 프로필도 포함하면 Cron은 활성 실행에 대해 해당 인증 프로필 재정의도 영구 저장합니다. 재시도는 제한됩니다. 최초 시도에 더해 전환 재시도 2회 이후에는 Cron이 무한 반복하는 대신 중단합니다.

격리된 Cron 실행이 에이전트 러너에 들어가기 전에 OpenClaw는 `baseUrl`이 loopback, private-network 또는 `.local`인 구성된 `api: "ollama"` 및 `api: "openai-completions"` 프로바이더에 대해 도달 가능한 로컬 프로바이더 엔드포인트를 확인합니다. 해당 엔드포인트가 다운되어 있으면 실행은 모델 호출을 시작하는 대신 명확한 프로바이더/모델 오류와 함께 `skipped`로 기록됩니다. 엔드포인트 결과는 5분 동안 캐시되므로, 같은 죽은 로컬 Ollama, vLLM, SGLang 또는 LM Studio 서버를 사용하는 많은 기한 도래 작업이 요청 폭주를 만들지 않고 하나의 작은 프로브를 공유합니다. 프로바이더 사전 점검으로 건너뛴 실행은 실행 오류 백오프를 증가시키지 않습니다. 반복되는 건너뜀 알림을 원하면 `failureAlert.includeSkipped`를 활성화하세요.

## 전달 및 출력

| 모드       | 동작                                                                |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 에이전트가 보내지 않은 경우 최종 텍스트를 대상에 대체 전달합니다   |
| `webhook`  | 완료 이벤트 페이로드를 URL로 POST합니다                             |
| `none`     | 러너 대체 전달 없음                                                 |

채널 전달에는 `--announce --channel telegram --to "-1001234567890"`를 사용하세요. Telegram 포럼 주제에는 `-1001234567890:topic:123`을 사용하세요. 직접 RPC/config 호출자는 `delivery.threadId`를 문자열이나 숫자로 전달할 수도 있습니다. Slack/Discord/Mattermost 대상은 명시적 접두사(`channel:<id>`, `user:<id>`)를 사용해야 합니다. Matrix 방 ID는 대소문자를 구분합니다. Matrix의 정확한 방 ID 또는 `room:!room:server` 형식을 사용하세요.

격리된 작업의 경우 채팅 전달은 공유됩니다. 채팅 경로가 있으면 작업이 `--no-deliver`를 사용하더라도 agent는 `message` 도구를 사용할 수 있습니다. agent가 구성된/현재 대상으로 보내면 OpenClaw는 폴백 공지를 건너뜁니다. 그렇지 않으면 `announce`, `webhook`, `none`은 agent 턴 이후 최종 답변을 runner가 어떻게 처리하는지만 제어합니다.

agent가 활성 채팅에서 격리된 알림을 만들면 OpenClaw는 폴백 공지 경로를 위해 보존된 실시간 전달 대상을 저장합니다. 내부 세션 키는 소문자일 수 있습니다. 현재 채팅 컨텍스트가 있으면 provider 전달 대상은 해당 키에서 재구성되지 않습니다.

실패 알림은 별도의 대상 경로를 따릅니다.

- `cron.failureDestination`은 실패 알림의 전역 기본값을 설정합니다.
- `job.delivery.failureDestination`은 작업별로 이를 재정의합니다.
- 둘 다 설정되지 않았고 작업이 이미 `announce`를 통해 전달되는 경우, 실패 알림은 이제 해당 기본 공지 대상으로 폴백됩니다.
- `delivery.failureDestination`은 기본 전달 모드가 `webhook`인 경우를 제외하고 `sessionTarget="isolated"` 작업에서만 지원됩니다.
- `failureAlert.includeSkipped: true`는 작업 또는 전역 cron 알림 정책이 반복된 건너뛴 실행 알림을 받도록 합니다. 건너뛴 실행은 별도의 연속 건너뜀 카운터를 유지하므로 실행 오류 백오프에 영향을 주지 않습니다.

## CLI 예시

<Tabs>
  <Tab title="일회성 알림">
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
  <Tab title="모델 및 추론 재정의">
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
    기본 세션에 시스템 이벤트를 큐에 넣습니다.

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
  <Accordion title="매핑된 hook (POST /hooks/<name>)">
    사용자 지정 hook 이름은 config의 `hooks.mappings`를 통해 해석됩니다. 매핑은 템플릿이나 코드 변환을 사용해 임의의 payload를 `wake` 또는 `agent` 작업으로 변환할 수 있습니다.
  </Accordion>
</AccordionGroup>

<Warning>
hook 엔드포인트를 loopback, tailnet 또는 신뢰할 수 있는 reverse proxy 뒤에 두세요.

- 전용 hook 토큰을 사용하세요. gateway auth 토큰을 재사용하지 마세요.
- `hooks.path`를 전용 하위 경로에 두세요. `/`는 거부됩니다.
- 명시적 `agentId` 라우팅을 제한하려면 `hooks.allowedAgentIds`를 설정하세요.
- 호출자가 세션을 선택해야 하는 경우가 아니라면 `hooks.allowRequestSessionKey=false`로 유지하세요.
- `hooks.allowRequestSessionKey`를 활성화하는 경우 허용되는 세션 키 형태를 제한하도록 `hooks.allowedSessionKeyPrefixes`도 설정하세요.
- hook payload는 기본적으로 안전 경계로 감싸집니다.

</Warning>

## Gmail PubSub 통합

Google PubSub를 통해 Gmail 받은편지함 트리거를 OpenClaw에 연결하세요.

<Note>
**필수 조건:** `gcloud` CLI, `gog`(gogcli), 활성화된 OpenClaw hook, 공개 HTTPS 엔드포인트를 위한 Tailscale.
</Note>

### 마법사 설정(권장)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

이 명령은 `hooks.gmail` config를 작성하고, Gmail preset을 활성화하며, push 엔드포인트에 Tailscale Funnel을 사용합니다.

### Gateway 자동 시작

`hooks.enabled=true`이고 `hooks.gmail.account`가 설정되면 Gateway는 부팅 시 `gog gmail watch serve`를 시작하고 watch를 자동 갱신합니다. 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.

### 수동 일회성 설정

<Steps>
  <Step title="GCP 프로젝트 선택">
    `gog`에서 사용하는 OAuth client를 소유한 GCP 프로젝트를 선택합니다.

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="주제 생성 및 Gmail push 접근 권한 부여">
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
모델 재정의 참고:

- `openclaw cron add|edit --model ...`은 작업의 선택된 모델을 변경합니다.
- 모델이 허용되면 정확한 해당 provider/model이 격리된 agent 실행에 전달됩니다.
- 허용되지 않거나 해석할 수 없으면 cron은 명시적 검증 오류와 함께 실행을 실패시킵니다.
- 구성된 폴백 체인은 계속 적용됩니다. cron `--model`은 세션 `/model` 재정의가 아니라 작업의 기본값이기 때문입니다.
- payload `fallbacks`는 해당 작업의 구성된 폴백을 대체합니다. `fallbacks: []`는 폴백을 비활성화하고 실행을 엄격하게 만듭니다.
- 명시적이거나 구성된 폴백 목록이 없는 일반 `--model`은 조용한 추가 재시도 대상으로 agent 기본값까지 이어지지 않습니다.

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

`maxConcurrentRuns`는 예약된 cron dispatch와 격리된 agent 턴 실행을 모두 제한합니다. 격리된 cron agent 턴은 내부적으로 큐의 전용 `cron-nested` 실행 lane을 사용하므로, 이 값을 높이면 독립적인 cron LLM 실행이 외부 cron wrapper만 시작하는 대신 병렬로 진행될 수 있습니다. 공유되는 비 cron `nested` lane은 이 설정으로 확장되지 않습니다.

runtime 상태 sidecar는 `cron.store`에서 파생됩니다. `~/clawd/cron/jobs.json` 같은 `.json` store는 `~/clawd/cron/jobs-state.json`을 사용하며, `.json` 접미사가 없는 store 경로는 `-state.json`을 덧붙입니다.

`jobs.json`을 직접 편집하는 경우 `jobs-state.json`은 source control에 포함하지 마세요. OpenClaw는 해당 sidecar를 pending slot, 활성 marker, 마지막 실행 metadata, 외부에서 편집된 작업에 새로운 `nextRunAtMs`가 필요한 시점을 scheduler에게 알려주는 schedule identity에 사용합니다.

cron 비활성화: `cron.enabled: false` 또는 `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="재시도 동작">
    **일회성 재시도**: 일시적 오류(rate limit, overload, network, server error)는 exponential backoff를 사용해 최대 3회 재시도합니다. 영구 오류는 즉시 비활성화됩니다.

    **반복 재시도**: 재시도 사이에 exponential backoff(30초에서 60분)를 적용합니다. 백오프는 다음 성공 실행 후 초기화됩니다.

  </Accordion>
  <Accordion title="유지 관리">
    `cron.sessionRetention`(기본값 `24h`)은 격리된 실행 세션 항목을 정리합니다. `cron.runLog.maxBytes` / `cron.runLog.keepLines`는 run-log 파일을 자동 정리합니다.
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
  <Accordion title="Cron이 실행되지 않음">
    - `cron.enabled`와 `OPENCLAW_SKIP_CRON` env var를 확인하세요.
    - Gateway가 지속적으로 실행 중인지 확인하세요.
    - `cron` schedule의 경우 timezone(`--tz`)과 host timezone을 확인하세요.
    - 실행 출력의 `reason: not-due`는 수동 실행이 `openclaw cron run <jobId> --due`로 확인되었고 작업이 아직 예정 시간이 아니었음을 의미합니다.

  </Accordion>
  <Accordion title="Cron은 실행되었지만 전달되지 않음">
    - 전달 모드 `none`은 runner 폴백 전송이 예상되지 않는다는 의미입니다. 채팅 경로가 있으면 agent는 여전히 `message` 도구로 직접 보낼 수 있습니다.
    - 전달 대상이 없거나 유효하지 않으면(`channel`/`to`) outbound가 건너뛰어집니다.
    - Matrix의 경우, 복사되었거나 legacy 작업에서 소문자로 바뀐 `delivery.to` 방 ID는 Matrix 방 ID가 대소문자를 구분하기 때문에 실패할 수 있습니다. 작업을 Matrix의 정확한 `!room:server` 또는 `room:!room:server` 값으로 편집하세요.
    - 채널 인증 오류(`unauthorized`, `Forbidden`)는 credential에 의해 전달이 차단되었음을 의미합니다.
    - 격리된 실행이 silent token(`NO_REPLY` / `no_reply`)만 반환하면 OpenClaw는 직접 outbound 전달을 억제하고 폴백 큐 summary 경로도 억제하므로 채팅에 아무것도 게시되지 않습니다.
    - agent가 사용자에게 직접 메시지를 보내야 한다면 작업에 사용 가능한 경로(`channel: "last"`와 이전 채팅, 또는 명시적 채널/대상)가 있는지 확인하세요.

  </Accordion>
  <Accordion title="Cron 또는 Heartbeat가 /new-style 롤오버를 막는 것처럼 보임">
    - 일일 및 유휴 재설정의 최신 상태 판단은 `updatedAt`을 기준으로 하지 않습니다. [세션 관리](/ko/concepts/session#session-lifecycle)를 참조하세요.
    - Cron 깨우기, Heartbeat 실행, exec 알림, Gateway 부기 처리는 라우팅/상태를 위해 세션 행을 업데이트할 수 있지만, `sessionStartedAt` 또는 `lastInteractionAt`을 연장하지는 않습니다.
    - 해당 필드가 생기기 전에 생성된 레거시 행의 경우, 파일이 아직 사용 가능하면 OpenClaw가 transcript JSONL 세션 헤더에서 `sessionStartedAt`을 복구할 수 있습니다. `lastInteractionAt`이 없는 레거시 유휴 행은 복구된 시작 시간을 유휴 기준선으로 사용합니다.

  </Accordion>
  <Accordion title="시간대 주의 사항">
    - `--tz`가 없는 Cron은 Gateway 호스트 시간대를 사용합니다.
    - 시간대가 없는 `at` 일정은 UTC로 처리됩니다.
    - Heartbeat `activeHours`는 구성된 시간대 해석을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — cron 실행을 위한 작업 원장
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 메인 세션 턴
- [시간대](/ko/concepts/timezone) — 시간대 구성
