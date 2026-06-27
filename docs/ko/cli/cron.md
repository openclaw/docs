---
read_when:
    - 예약된 작업과 깨우기를 원합니다
    - Cron 실행과 로그를 디버깅하고 있습니다
summary: '`openclaw cron`의 CLI 참조(백그라운드 작업 예약 및 실행)'
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:17:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

<Tip>
전체 명령 표면은 `openclaw cron --help`를 실행해 확인하세요. 개념 가이드는 [Cron 작업](/ko/automation/cron-jobs)을 참고하세요.
</Tip>

## 빠르게 작업 만들기

`openclaw cron create`는 `openclaw cron add`의 별칭입니다. 새 작업에서는 일정을 먼저, 프롬프트를 두 번째에 둡니다.

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

작업이 채팅 대상으로 전달하는 대신 완료된 페이로드를 POST해야 할 때는 `--webhook <url>`을 사용하세요.

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

격리된 에이전트/모델 실행을 시작하지 않고 OpenClaw Cron 안에서 실행되어야 하는 결정적 셸 스타일 작업에는 `--command`를 사용하세요.

<Note>
명령 Cron 작업은 관리자가 작성하는 Gateway 자동화입니다. 이를 만들거나, 편집하거나,
제거하거나, 수동으로 실행하려면 `operator.admin`이 필요합니다. 이후 예약된 실행은
에이전트 `tools.exec` 도구 호출이 아니라 Gateway 프로세스에서 실행됩니다.
`tools.exec.*`와 exec 승인은 여전히 모델에 보이는 exec 도구를 관리합니다.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`은 `argv: ["sh", "-lc", <shell>]`을 저장합니다. 정확한 argv 실행에는 `--command-argv '["node","scripts/report.mjs"]'`를 사용하세요. 명령 작업은 stdout/stderr를 캡처하고, 일반 Cron 기록을 남기며, 격리된 작업과 동일한 `announce`, `webhook`, 또는 `none` 전달 모드를 통해 출력을 라우팅합니다. `NO_REPLY`만 출력하는 명령은 억제됩니다.

## 세션

`--session`은 `main`, `isolated`, `current`, 또는 `session:<id>`를 받습니다.

<AccordionGroup>
  <Accordion title="세션 키">
    - `main`은 에이전트의 기본 세션에 바인딩합니다.
    - `isolated`는 각 실행마다 새 트랜스크립트와 세션 ID를 만듭니다.
    - `current`는 생성 시점의 활성 세션에 바인딩합니다.
    - `session:<id>`는 명시적인 영구 세션 키에 고정합니다.

  </Accordion>
  <Accordion title="격리 세션 의미 체계">
    격리된 실행은 주변 대화 컨텍스트를 재설정합니다. 채널 및 그룹 라우팅, 전송/큐 정책, 권한 상승, 출처, ACP 런타임 바인딩은 새 실행에 대해 재설정됩니다. 안전한 기본 설정과 사용자가 명시적으로 선택한 모델 또는 인증 재정의는 실행 간에 이어질 수 있습니다.
  </Accordion>
</AccordionGroup>

## 전달

`openclaw cron list`와 `openclaw cron show <job-id>`는 해석된 전달 경로를 미리 보여줍니다. `channel: "last"`의 경우, 미리보기는 경로가 기본 세션 또는 현재 세션에서 해석되었는지, 아니면 닫힌 실패로 끝날지를 보여줍니다.

제공자 접두사가 붙은 대상은 해석되지 않은 announce 채널을 구분할 수 있습니다. 예를 들어 `delivery.channel`이 생략되었거나 `last`일 때 `to: "telegram:123"`은 Telegram을 선택합니다. 로드된 Plugin이 알리는 접두사만 제공자 선택자입니다. `delivery.channel`이 명시적이면 접두사는 해당 채널과 일치해야 합니다. `channel: "whatsapp"`에 `to: "telegram:123"`을 쓰면 거부됩니다. `imessage:` 및 `sms:` 같은 서비스 접두사는 채널이 소유하는 대상 구문으로 유지됩니다.

<Note>
격리된 `cron add` 작업은 기본적으로 `--announce` 전달을 사용합니다. 출력을 내부에만 유지하려면 `--no-deliver`를 사용하세요. `--deliver`는 `--announce`의 사용 중단된 별칭으로 남아 있습니다.
</Note>

### 전달 소유권

격리된 Cron 채팅 전달은 에이전트와 러너가 공유합니다.

- 채팅 경로를 사용할 수 있을 때 에이전트는 `message` 도구를 사용해 직접 보낼 수 있습니다.
- `announce`는 에이전트가 해석된 대상에 직접 보내지 않았을 때만 최종 답변을 대체 전달합니다.
- `webhook`은 완료된 페이로드를 URL에 게시합니다.
- `none`은 러너 대체 전달을 비활성화합니다.

Webhook 전달을 설정하려면 `cron add|create --webhook <url>` 또는 `cron edit <job-id> --webhook <url>`을 사용하세요. `--webhook`을 `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, 또는 `--account` 같은 채팅 전달 플래그와 함께 사용하지 마세요.

`cron edit <job-id>`는 `--clear-channel`, `--clear-to`, `--clear-thread-id`, `--clear-account`로 개별 전달 라우팅 필드를 해제할 수 있습니다(각각은 대응하는 설정 플래그와 함께 사용하면 거부됩니다). 러너 대체 전달만 비활성화하는 `--no-deliver`와 달리, 이 옵션들은 저장된 필드를 제거하여 작업이 해당 경로 부분을 다시 기본값에서 해석하게 합니다.

`--announce`는 최종 답변을 위한 러너 대체 전달입니다. `--no-deliver`는 해당 대체 전달을 비활성화하지만, 채팅 경로를 사용할 수 있을 때 에이전트의 `message` 도구를 제거하지는 않습니다.

활성 채팅에서 만든 미리 알림은 대체 announce 전달을 위해 라이브 채팅 전달 대상을 보존합니다. 내부 세션 키는 소문자일 수 있습니다. Matrix 방 ID처럼 대소문자를 구분하는 제공자 ID의 진실 공급원으로 사용하지 마세요.

### 실패 전달

실패 알림은 다음 순서로 해석됩니다.

1. 작업의 `delivery.failureDestination`.
2. 전역 `cron.failureDestination`.
3. 작업의 기본 announce 대상(명시적 실패 대상이 설정되지 않은 경우).

<Note>
기본 세션 작업은 기본 전달 모드가 `webhook`일 때만 `delivery.failureDestination`을 사용할 수 있습니다. 격리된 작업은 모든 모드에서 이를 받습니다.
</Note>

참고: 격리된 Cron 실행은 답변 페이로드가 생성되지 않더라도 실행 수준 에이전트 실패를 작업 오류로 처리하므로, 모델/제공자 실패도 오류 카운터를 증가시키고 실패 알림을 트리거합니다.

명령 Cron 작업은 격리된 에이전트 턴을 시작하지 않습니다. 종료 코드가 0이면 `ok`를 기록합니다. 0이 아닌 종료, 신호, 시간 초과, 또는 출력 없음 시간 초과는 `error`를 기록하며 동일한 실패 알림 경로를 트리거할 수 있습니다.

격리된 실행이 첫 모델 요청 전에 시간 초과되면 `openclaw cron show`와 `openclaw cron runs`는
`setup timed out before runner start` 또는
`stalled before first model call (last phase: context-engine)` 같은 단계별 오류를 포함합니다.
CLI 기반 제공자의 경우, 사전 모델 감시자는 외부 CLI 턴이 시작될 때까지 활성 상태로 유지되므로 세션 조회, 훅, 인증, 프롬프트, CLI 설정 정지는 사전 모델 Cron 실패로 보고됩니다.

## 예약

### 일회성 작업

`--at <datetime>`은 일회성 실행을 예약합니다. 오프셋이 없는 날짜/시간은 `--tz <iana>`도 전달하지 않는 한 UTC로 처리됩니다. `--tz <iana>`를 전달하면 지정한 시간대의 벽시계 시간으로 해석됩니다.

<Note>
일회성 작업은 기본적으로 성공 후 삭제됩니다. 보존하려면 `--keep-after-run`을 사용하세요.
</Note>

### 반복 작업

반복 작업은 연속 오류 후 지수 재시도 백오프를 사용합니다: 30초, 1분, 5분, 15분, 60분. 다음 실행이 성공하면 일정은 정상으로 돌아갑니다.

건너뛴 실행은 실행 오류와 별도로 추적됩니다. 이는 재시도 백오프에 영향을 주지 않지만, `openclaw cron edit <job-id> --failure-alert-include-skipped`를 사용하면 실패 알림이 반복된 건너뛴 실행 알림을 포함하도록 선택할 수 있습니다.

로컬 구성 모델 제공자를 대상으로 하는 격리된 작업의 경우, Cron은 에이전트 턴을 시작하기 전에 가벼운 제공자 사전 점검을 실행합니다. Loopback, 사설 네트워크, 그리고 `.local` `api: "ollama"` 제공자는 `/api/tags`에서 검사됩니다. vLLM, SGLang, LM Studio 같은 로컬 OpenAI 호환 제공자는 `/models`에서 검사됩니다. 엔드포인트에 연결할 수 없으면 실행은 `skipped`로 기록되고 이후 일정에서 재시도됩니다. 일치하는 죽은 엔드포인트는 여러 작업이 같은 로컬 서버를 두드리는 일을 피하기 위해 5분 동안 캐시됩니다.

참고: Cron 작업, 보류 중인 런타임 상태, 실행 기록은 공유 SQLite 상태 데이터베이스에 저장됩니다. 레거시 `jobs.json`, `jobs-state.json`, `runs/*.jsonl` 파일은 한 번 가져온 뒤 `.migrated` 접미사를 붙여 이름이 바뀝니다. 가져오기 후에는 JSON 파일을 편집하는 대신 `openclaw cron add|edit|remove`로 일정을 편집하세요.

### 수동 실행

`openclaw cron run <job-id>`는 기본적으로 강제 실행하며, 수동 실행이 큐에 들어가자마자 반환합니다. 성공 응답은 `{ ok: true, enqueued: true, runId }`를 포함합니다. 나중 결과를 검사하려면 반환된 `runId`를 사용하세요.

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

스크립트가 해당 큐 실행이 터미널 상태를 기록할 때까지 차단되어야 한다면 `--wait`를 추가하세요.

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait`를 사용해도 CLI는 먼저 `cron.run`을 호출한 다음, 반환된 `runId`에 대해 `cron.runs`를 폴링합니다. 명령은 실행이 `ok` 상태로 완료될 때만 `0`으로 종료됩니다. 실행이 `error` 또는 `skipped`로 완료되거나, Gateway 응답에 `runId`가 없거나, `--wait-timeout`이 만료되면 0이 아닌 값으로 종료됩니다. `--poll-interval`은 0보다 커야 합니다.

<Note>
작업이 현재 기한에 도달한 경우에만 수동 명령을 실행하려면 `--due`를 사용하세요. `--due --wait`가 실행을 큐에 넣지 않으면, 명령은 폴링하는 대신 일반적인 비실행 응답을 반환합니다.
</Note>

## 모델

`cron add|edit --model <ref>`는 작업에 허용된 모델을 선택합니다. `cron add|edit --fallbacks <list>`는 작업별 대체 모델을 설정합니다. 예를 들어 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`를 사용할 수 있습니다. 대체 없이 엄격하게 실행하려면 `--fallbacks ""`를 전달하세요. `cron edit <job-id> --clear-fallbacks`는 작업별 대체 재정의를 제거합니다. `cron edit <job-id> --clear-model`은 작업별 모델 재정의를 제거하여 작업이 일반 Cron 모델 선택 우선순위(저장된 Cron 세션 재정의가 있으면 그것, 없으면 에이전트/기본 모델)를 따르게 합니다. 이는 `--model`과 함께 사용할 수 없습니다.

<Warning>
모델이 허용되지 않았거나 해석할 수 없으면 Cron은 작업의 에이전트 또는 기본 모델 선택으로 대체하지 않고 명시적인 검증 오류로 실행을 실패시킵니다.
</Warning>

Cron `--model`은 채팅 세션 `/model` 재정의가 아니라 **작업 기본 모델**입니다. 즉:

- 선택된 작업 모델이 실패해도 구성된 모델 대체가 계속 적용됩니다.
- 작업별 페이로드 `fallbacks`가 있으면 구성된 대체 목록을 대체합니다.
- 빈 작업별 대체 목록(`--fallbacks ""` 또는 작업 페이로드/API의 `fallbacks: []`)은 Cron 실행을 엄격하게 만듭니다.
- 작업에 `--model`이 있지만 대체 목록이 구성되지 않은 경우, OpenClaw는 에이전트 기본 모델이 숨은 재시도 대상으로 추가되지 않도록 명시적인 빈 대체 재정의를 전달합니다.
- 로컬 제공자 사전 점검은 Cron 실행을 `skipped`로 표시하기 전에 구성된 대체를 순회합니다.

`openclaw doctor`는 제공자 네임스페이스 수와 `agents.defaults.model`과의 불일치를 포함하여 이미 `payload.model`이 설정된 작업을 보고합니다. 인증, 제공자, 또는 청구 동작이 라이브 채팅과 예약 작업 사이에서 다르게 보일 때 이 검사를 사용하세요.

### 격리된 Cron 모델 우선순위

격리된 Cron은 다음 순서로 활성 모델을 해석합니다.

1. Gmail 훅 재정의.
2. 작업별 `--model`.
3. 저장된 Cron 세션 모델 재정의(사용자가 선택한 경우).
4. 에이전트 또는 기본 모델 선택.

### 빠른 모드

격리된 Cron 빠른 모드는 해석된 라이브 모델 선택을 따릅니다. 모델 구성 `params.fastMode`가 기본적으로 적용되지만, 저장된 세션 `fastMode` 재정의가 있으면 여전히 구성보다 우선합니다. 해석된 모드가 `auto`이면, 컷오프는 선택된 모델의 `params.fastAutoOnSeconds` 값을 사용하며 기본값은 60초입니다.

### 라이브 모델 전환 재시도

격리된 실행에서 `LiveSessionModelSwitchError`가 발생하면, Cron은 재시도 전에 활성 실행에 대해 전환된 제공자와 모델(그리고 있는 경우 전환된 인증 프로필 재정의)을 지속 저장합니다. 외부 재시도 루프는 최초 시도 후 두 번의 전환 재시도로 제한되며, 그다음에는 무한 루프 대신 중단됩니다.

## 실행 출력과 거부

### 오래된 확인 응답 억제

격리된 Cron 턴은 오래된 확인 전용 답변을 억제합니다. 첫 결과가 단지 임시 상태 업데이트이고 최종 답변을 책임지는 하위 에이전트 실행이 없다면, Cron은 전달 전에 실제 결과를 한 번 다시 프롬프트합니다.

### 무음 토큰 억제

격리된 Cron 실행이 무음 토큰(`NO_REPLY` 또는 `no_reply`)만 반환하면, Cron은 직접 아웃바운드 전달과 대체 큐 요약 경로를 모두 억제하므로 채팅에 아무것도 다시 게시되지 않습니다.

### 구조화된 거부

격리된 cron 실행은 포함된 실행의 구조화된 실행 거부 메타데이터를 권위 있는 거부 신호로 사용합니다. 또한 중첩된 구조화 오류 메시지가 `SYSTEM_RUN_DENIED` 또는 `INVALID_REQUEST`로 시작하는 경우 node-host `UNAVAILABLE` 래퍼를 존중합니다.

Cron은 포함된 실행도 구조화된 거부 메타데이터를 제공하지 않는 한 최종 출력 문구나 승인처럼 보이는 거부 문구를 거부로 분류하지 않으므로, 일반적인 어시스턴트 텍스트는 차단된 명령으로 취급되지 않습니다.

`cron list`와 실행 기록은 차단된 명령을 `ok`로 보고하는 대신 거부 사유를 표시합니다.

## 보존

보존 및 정리는 config에서 제어됩니다.

- `cron.sessionRetention`(기본값 `24h`)은 완료된 격리 실행 세션을 정리합니다.
- `cron.runLog.keepLines`는 작업별로 보존되는 SQLite 실행 기록 행을 정리합니다. `cron.runLog.maxBytes`는 이전 파일 기반 실행 로그와의 호환성을 위해 계속 허용됩니다.

## 이전 작업 마이그레이션

<Note>
현재 전달 및 저장 형식 이전의 cron 작업이 있다면 `openclaw doctor --fix`를 실행하세요. Doctor는 레거시 cron 필드(`jobId`, `schedule.cron`, 레거시 `threadId`를 포함한 최상위 전달 필드, payload `provider` 전달 alias)를 정규화하고, `cron.webhook`에서 `notify: true` Webhook fallback 작업을 명시적 Webhook 전달로 마이그레이션합니다. 이미 채팅으로 알림을 보내는 작업은 해당 전달을 유지하고 완료 Webhook 대상을 받습니다. `cron.webhook`이 설정되지 않은 경우 마이그레이션 대상이 없는 작업에서는 비활성 최상위 `notify` 마커가 제거되며(기존 전달은 변경 없이 보존됨), 따라서 `doctor --fix`가 더 이상 해당 작업에 대해 반복해서 경고하지 않습니다.
</Note>

## 일반 편집

메시지는 변경하지 않고 전달 설정을 업데이트합니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

격리된 작업의 전달을 비활성화합니다.

```bash
openclaw cron edit <job-id> --no-deliver
```

격리된 작업에 경량 bootstrap 컨텍스트를 활성화합니다.

```bash
openclaw cron edit <job-id> --light-context
```

특정 채널로 알림을 보냅니다.

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram 포럼 토픽으로 알림을 보냅니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

경량 bootstrap 컨텍스트가 있는 격리된 작업을 생성합니다.

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context`는 격리된 agent-turn 작업에만 적용됩니다. cron 실행의 경우 경량 모드는 전체 workspace bootstrap 세트를 삽입하는 대신 bootstrap 컨텍스트를 비워 둡니다.

정확한 argv, cwd, env, stdin 및 출력 제한이 있는 command 작업을 생성합니다.

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## 일반 admin 명령

수동 실행 및 검사:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list`는 기본적으로 일치하는 모든 작업을 표시합니다. 유효하게 정규화된 agent id가 일치하는 작업만 표시하려면 `--agent <id>`를 전달하세요. 저장된 agent id가 없는 작업은 구성된 기본 agent로 간주됩니다.

`openclaw cron get <job-id>`는 저장된 작업 JSON을 직접 반환합니다. 전달 경로 미리보기가 포함된 사람이 읽기 쉬운 보기를 원할 때는 `cron show <job-id>`를 사용하세요.

`cron list --json`과 `cron show <job-id> --json`은 각 작업에 최상위 `status` 필드를 포함하며, 이 필드는 `enabled`, `state.runningAtMs`, `state.lastRunStatus`에서 계산됩니다. 값은 `disabled`, `running`, `ok`, `error`, `skipped`, `idle`입니다. 이는 사람이 읽기 쉬운 상태 열과 동일하므로 외부 도구가 작업 상태를 다시 도출하지 않고 읽을 수 있습니다.

`cron runs` 항목에는 의도한 cron 대상, 해석된 대상, message-tool 전송, fallback 사용 여부, 전달 상태가 포함된 전달 진단이 포함됩니다.

Agent 및 세션 대상 변경:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`는 agent-turn 작업에서 `--agent`가 생략되면 경고하고 기본 agent(`main`)로 fallback합니다. 특정 agent를 고정하려면 생성 시 `--agent <id>`를 전달하세요.

전달 조정:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [예약된 작업](/ko/automation/cron-jobs)
