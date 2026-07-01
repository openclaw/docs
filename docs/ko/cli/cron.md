---
read_when:
    - 예약된 작업과 깨우기를 원합니다
    - Cron 실행과 로그를 디버깅하는 경우
summary: '`openclaw cron` CLI 참조(백그라운드 작업 예약 및 실행)'
title: Cron
x-i18n:
    generated_at: "2026-07-01T05:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

<Tip>
전체 명령 표면은 `openclaw cron --help`를 실행해 확인하세요. 개념 가이드는 [Cron 작업](/ko/automation/cron-jobs)을 참조하세요.
</Tip>

## 작업 빠르게 생성하기

`openclaw cron create`는 `openclaw cron add`의 별칭입니다. 새 작업의 경우 스케줄을 먼저, 프롬프트를 두 번째에 둡니다.

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

채팅 대상으로 전달하는 대신 완료된 페이로드를 POST해야 하는 작업에는 `--webhook <url>`을 사용합니다.

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

격리된 에이전트/모델 실행을 시작하지 않고 OpenClaw cron 내부에서 실행되어야 하는 결정적 셸 스타일 작업에는 `--command`를 사용합니다.

<Note>
명령 Cron 작업은 관리자가 작성하는 Gateway 자동화입니다. 이를 생성, 편집,
삭제하거나 수동 실행하려면 `operator.admin`이 필요합니다. 이후 예약 실행은
에이전트 `tools.exec` 도구 호출이 아니라 Gateway 프로세스에서 실행됩니다.
`tools.exec.*` 및 exec 승인은 모델에 보이는 exec 도구를 계속 관리합니다.
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

`--command <shell>`은 `argv: ["sh", "-lc", <shell>]`을 저장합니다. 정확한 argv 실행에는 `--command-argv '["node","scripts/report.mjs"]'`를 사용합니다. 명령 작업은 stdout/stderr를 캡처하고, 일반 Cron 기록을 기록하며, 격리된 작업과 동일한 `announce`, `webhook`, `none` 전달 모드를 통해 출력을 라우팅합니다. `NO_REPLY`만 출력하는 명령은 억제됩니다.

## 세션

`--session`은 `main`, `isolated`, `current`, 또는 `session:<id>`를 받습니다.

<AccordionGroup>
  <Accordion title="세션 키">
    - `main`은 에이전트의 메인 세션에 바인딩합니다.
    - `isolated`는 각 실행마다 새 transcript와 세션 ID를 생성합니다.
    - `current`는 생성 시점의 활성 세션에 바인딩합니다.
    - `session:<id>`는 명시적인 영구 세션 키에 고정합니다.

  </Accordion>
  <Accordion title="격리된 세션 의미론">
    격리된 실행은 주변 대화 컨텍스트를 재설정합니다. 채널 및 그룹 라우팅, 전송/대기열 정책, 권한 상승, 출처, ACP 런타임 바인딩은 새 실행에 맞게 재설정됩니다. 안전한 선호 설정과 사용자가 명시적으로 선택한 모델 또는 인증 오버라이드는 실행 간에 이어질 수 있습니다.
  </Accordion>
</AccordionGroup>

## 전달

`openclaw cron list`와 `openclaw cron show <job-id>`는 해석된 전달 경로를 미리 보여줍니다. `channel: "last"`의 경우, 미리보기는 경로가 메인 세션 또는 현재 세션에서 해석되었는지, 아니면 닫힌 상태로 실패할지를 보여줍니다.

프로바이더 접두사가 붙은 대상은 해석되지 않은 announce 채널을 명확히 구분할 수 있습니다. 예를 들어 `to: "telegram:123"`은 `delivery.channel`이 생략되었거나 `last`일 때 Telegram을 선택합니다. 로드된 Plugin이 공표한 접두사만 프로바이더 선택자입니다. `delivery.channel`이 명시적이면 접두사는 해당 채널과 일치해야 합니다. `channel: "whatsapp"`과 `to: "telegram:123"`의 조합은 거부됩니다. `imessage:` 및 `sms:` 같은 서비스 접두사는 채널이 소유하는 대상 구문으로 남습니다.

<Note>
격리된 `cron add` 작업은 기본적으로 `--announce` 전달을 사용합니다. 출력을 내부에만 유지하려면 `--no-deliver`를 사용합니다. `--deliver`는 `--announce`의 폐기 예정 별칭으로 남아 있습니다.
</Note>

### 전달 소유권

격리된 Cron 채팅 전달은 에이전트와 러너가 공유합니다.

- 채팅 경로를 사용할 수 있으면 에이전트가 `message` 도구를 사용해 직접 전송할 수 있습니다.
- `announce`는 에이전트가 해석된 대상에 직접 전송하지 않은 경우에만 최종 답변을 폴백 전달합니다.
- `webhook`은 완료된 페이로드를 URL에 게시합니다.
- `none`은 러너 폴백 전달을 비활성화합니다.

Webhook 전달을 설정하려면 `cron add|create --webhook <url>` 또는 `cron edit <job-id> --webhook <url>`을 사용합니다. `--webhook`을 `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, `--account` 같은 채팅 전달 플래그와 함께 사용하지 마세요.

`cron edit <job-id>`는 `--clear-channel`, `--clear-to`, `--clear-thread-id`, `--clear-account`로 개별 전달 라우팅 필드를 해제할 수 있습니다. 각각은 대응하는 설정 플래그와 함께 사용하면 거부됩니다. 러너 폴백 전달만 비활성화하는 `--no-deliver`와 달리, 이 옵션들은 저장된 필드를 제거하여 작업이 해당 경로 부분을 다시 기본값에서 해석하도록 합니다.

`--announce`는 최종 답변에 대한 러너 폴백 전달입니다. `--no-deliver`는 해당 폴백을 비활성화하지만, 채팅 경로를 사용할 수 있을 때 에이전트의 `message` 도구를 제거하지는 않습니다.

활성 채팅에서 생성된 리마인더는 폴백 announce 전달을 위해 라이브 채팅 전달 대상을 보존합니다. 내부 세션 키는 소문자일 수 있으므로, Matrix 방 ID처럼 대소문자를 구분하는 프로바이더 ID의 진실 공급원으로 사용하지 마세요.

### 실패 전달

실패 알림은 다음 순서로 해석됩니다.

1. 작업의 `delivery.failureDestination`.
2. 전역 `cron.failureDestination`.
3. 작업의 기본 announce 대상(명시적 실패 대상이 설정되지 않은 경우).

<Note>
메인 세션 작업은 기본 전달 모드가 `webhook`일 때만 `delivery.failureDestination`을 사용할 수 있습니다. 격리된 작업은 모든 모드에서 이를 받습니다.
</Note>

참고: 격리된 Cron 실행은 답변 페이로드가 생성되지 않더라도 실행 수준의 에이전트 실패를 작업 오류로 취급하므로, 모델/프로바이더 실패도 오류 카운터를 증가시키고 실패 알림을 트리거합니다.

명령 Cron 작업은 격리된 에이전트 턴을 시작하지 않습니다. 종료 코드가 0이면
`ok`를 기록합니다. 0이 아닌 종료, 신호, 시간 초과 또는 출력 없음 시간 초과는 `error`를 기록하며
동일한 실패 알림 경로를 트리거할 수 있습니다.

격리된 실행이 첫 모델 요청 전에 시간 초과되면 `openclaw cron show`와
`openclaw cron runs`는 `setup timed out before runner start` 또는
`stalled before first model call (last phase: context-engine)` 같은
단계별 오류를 포함합니다.
CLI 기반 프로바이더의 경우, 외부 CLI 턴이 시작될 때까지 모델 전 워치독이 활성 상태로 유지되므로
세션 조회, 훅, 인증, 프롬프트, CLI 설정 지연이 모델 전 Cron 실패로 보고됩니다.

## 스케줄링

### 일회성 작업

`--at <datetime>`은 일회성 실행을 예약합니다. 오프셋이 없는 날짜/시간은 `--tz <iana>`도 전달하지 않는 한 UTC로 취급됩니다. `--tz <iana>`를 전달하면 지정된 시간대의 벽시계 시간으로 해석합니다.

<Note>
일회성 작업은 기본적으로 성공 후 삭제됩니다. 보존하려면 `--keep-after-run`을 사용합니다.
</Note>

### 반복 작업

반복 작업은 연속 오류 후 지수 재시도 백오프를 사용합니다: 30초, 1분, 5분, 15분, 60분. 다음 실행이 성공하면 스케줄은 정상으로 돌아갑니다.

건너뛴 실행은 실행 오류와 별도로 추적됩니다. 재시도 백오프에는 영향을 주지 않지만, `openclaw cron edit <job-id> --failure-alert-include-skipped`를 사용하면 실패 알림에 반복된 건너뛴 실행 알림을 포함하도록 선택할 수 있습니다.

로컬 구성 모델 프로바이더를 대상으로 하는 격리된 작업의 경우, Cron은 에이전트 턴을 시작하기 전에 가벼운 프로바이더 사전 점검을 실행합니다. 루프백, 사설 네트워크, `.local` `api: "ollama"` 프로바이더는 `/api/tags`에서 프로브합니다. vLLM, SGLang, LM Studio 같은 로컬 OpenAI 호환 프로바이더는 `/models`에서 프로브합니다. 엔드포인트에 연결할 수 없으면 실행은 `skipped`로 기록되고 이후 스케줄에서 재시도됩니다. 일치하는 죽은 엔드포인트는 많은 작업이 동일한 로컬 서버를 두드리는 것을 피하기 위해 5분 동안 캐시됩니다.

참고: Cron 작업, 대기 중인 런타임 상태, 실행 기록은 공유 SQLite 상태 데이터베이스에 저장됩니다. 기존 `jobs.json`, `jobs-state.json`, `runs/*.jsonl` 파일은 한 번 가져온 뒤 `.migrated` 접미사로 이름이 변경됩니다. 가져온 후에는 JSON 파일을 편집하는 대신 `openclaw cron add|edit|remove`로 스케줄을 편집하세요.

### 수동 실행

`openclaw cron run <job-id>`는 기본적으로 강제 실행하며 수동 실행이 대기열에 들어가는 즉시 반환됩니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함됩니다. 반환된 `runId`를 사용해 이후 결과를 검사하세요.

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

스크립트가 정확히 그 대기열 실행이 터미널 상태를 기록할 때까지 블록해야 한다면 `--wait`를 추가합니다.

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait`를 사용하면 CLI는 여전히 먼저 `cron.run`을 호출한 다음 반환된 `runId`에 대해 `cron.runs`를 폴링합니다. 명령은 실행이 `ok` 상태로 완료될 때만 `0`으로 종료됩니다. 실행이 `error` 또는 `skipped`로 완료되거나, Gateway 응답에 `runId`가 포함되지 않거나, `--wait-timeout`이 만료되면 0이 아닌 값으로 종료됩니다. `--poll-interval`은 0보다 커야 합니다.

<Note>
작업이 현재 만료 상태일 때만 수동 명령을 실행하려면 `--due`를 사용합니다. `--due --wait`가 실행을 대기열에 넣지 않으면 명령은 폴링 대신 일반 비실행 응답을 반환합니다.
</Note>

## 모델

`cron add|edit --model <ref>`는 작업에 허용된 모델을 선택합니다. `cron add|edit --fallbacks <list>`는 작업별 폴백 모델을 설정합니다. 예: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; 폴백 없는 엄격한 실행에는 `--fallbacks ""`를 전달합니다. `cron edit <job-id> --clear-fallbacks`는 작업별 폴백 오버라이드를 제거합니다. `cron edit <job-id> --clear-model`은 작업별 모델 오버라이드를 제거하여 작업이 일반 Cron 모델 선택 우선순위(저장된 Cron 세션 오버라이드가 있으면 그것, 없으면 에이전트/기본 모델)를 따르도록 합니다. 이는 `--model`과 함께 사용할 수 없습니다. `cron add|edit --thinking <level>`은 작업별 thinking 오버라이드를 설정합니다. `cron edit <job-id> --clear-thinking`은 이를 제거하여 작업이 일반 Cron thinking 우선순위를 따르도록 하며, `--thinking`과 함께 사용할 수 없습니다.

<Warning>
모델이 허용되지 않았거나 해석할 수 없으면 Cron은 작업의 에이전트 또는 기본 모델 선택으로 폴백하는 대신 명시적 검증 오류로 실행을 실패시킵니다.
</Warning>

Cron `--model`은 채팅 세션 `/model` 오버라이드가 아니라 **작업 기본 모델**입니다. 이는 다음을 의미합니다.

- 선택한 작업 모델이 실패할 때도 구성된 모델 폴백이 계속 적용됩니다.
- 작업별 페이로드 `fallbacks`가 있으면 구성된 폴백 목록을 대체합니다.
- 빈 작업별 폴백 목록(`--fallbacks ""` 또는 작업 페이로드/API의 `fallbacks: []`)은 Cron 실행을 엄격하게 만듭니다.
- 작업에 `--model`이 있지만 폴백 목록이 구성되어 있지 않으면, OpenClaw는 에이전트 기본 모델이 숨겨진 재시도 대상으로 추가되지 않도록 명시적인 빈 폴백 오버라이드를 전달합니다.
- 로컬 프로바이더 사전 점검은 Cron 실행을 `skipped`로 표시하기 전에 구성된 폴백을 순회합니다.

`openclaw doctor`는 `payload.model`이 이미 설정된 작업을 보고하며, 여기에는 프로바이더 네임스페이스 개수와 `agents.defaults.model`과의 불일치가 포함됩니다. 라이브 채팅과 예약 작업 간에 인증, 프로바이더 또는 결제 동작이 달라 보일 때 이 검사를 사용하세요.

### 격리된 Cron 모델 우선순위

격리된 Cron은 다음 순서로 활성 모델을 해석합니다.

1. Gmail 훅 오버라이드.
2. 작업별 `--model`.
3. 저장된 Cron 세션 모델 오버라이드(사용자가 선택한 경우).
4. 에이전트 또는 기본 모델 선택.

### 빠른 모드

격리된 Cron 빠른 모드는 해석된 라이브 모델 선택을 따릅니다. 모델 구성 `params.fastMode`가 기본적으로 적용되지만, 저장된 세션 `fastMode` 오버라이드는 여전히 구성보다 우선합니다. 해석된 모드가 `auto`이면 cutoff는 선택된 모델의 `params.fastAutoOnSeconds` 값을 사용하며, 기본값은 60초입니다.

### 라이브 모델 전환 재시도

격리된 실행에서 `LiveSessionModelSwitchError`가 발생하면 Cron은 재시도 전에 활성 실행에 대해 전환된 프로바이더와 모델(그리고 있는 경우 전환된 인증 프로필 오버라이드)을 저장합니다. 외부 재시도 루프는 최초 시도 후 두 번의 전환 재시도로 제한되며, 그 이후에는 영원히 반복하는 대신 중단됩니다.

## 실행 출력과 거부

### 오래된 확인 응답 억제

격리된 Cron 턴은 오래된 확인 전용 답변을 억제합니다. 첫 결과가 단지 중간 상태 업데이트이고 최종 답변을 담당하는 하위 에이전트 실행이 없으면, Cron은 전달 전에 실제 결과를 위해 한 번 다시 프롬프트합니다.

### 무응답 토큰 억제

격리된 Cron 실행이 무음 토큰(`NO_REPLY` 또는 `no_reply`)만 반환하면, Cron은 직접 아웃바운드 전달과 대체 큐 요약 경로를 모두 억제하므로 채팅에 아무것도 다시 게시되지 않습니다.

### 구조화된 거부

격리된 Cron 실행은 포함된 실행의 구조화된 실행 거부 메타데이터를 권위 있는 거부 신호로 사용합니다. 또한 중첩된 구조화 오류 메시지가 `SYSTEM_RUN_DENIED` 또는 `INVALID_REQUEST`로 시작할 때 node-host `UNAVAILABLE` 래퍼도 존중합니다.

Cron은 포함된 실행이 구조화된 거부 메타데이터도 제공하지 않는 한 최종 출력 산문이나 승인처럼 보이는 거절 문구를 거부로 분류하지 않으므로, 일반 어시스턴트 텍스트는 차단된 명령으로 처리되지 않습니다.

`cron list`와 실행 기록은 차단된 명령을 `ok`로 보고하는 대신 거부 이유를 표시합니다.

## 보존

보존 및 정리는 config에서 제어됩니다.

- `cron.sessionRetention`(기본값 `24h`)은 완료된 격리 실행 세션을 정리합니다.
- `cron.runLog.keepLines`는 작업별로 보존된 SQLite 실행 기록 행을 정리합니다. `cron.runLog.maxBytes`는 이전 파일 기반 실행 로그와의 호환성을 위해 계속 허용됩니다.

## 이전 작업 마이그레이션

<Note>
현재 전달 및 저장 형식 이전의 Cron 작업이 있다면 `openclaw doctor --fix`를 실행하세요. Doctor는 레거시 Cron 필드(`jobId`, `schedule.cron`, 레거시 `threadId`를 포함한 최상위 전달 필드, 페이로드 `provider` 전달 별칭)를 정규화하고, `notify: true` Webhook 대체 작업을 `cron.webhook`에서 명시적 Webhook 전달로 마이그레이션합니다. 이미 채팅에 알림을 보내는 작업은 해당 전달을 유지하고 완료 Webhook 대상을 얻습니다. `cron.webhook`이 설정되지 않은 경우 마이그레이션 대상이 없는 작업에서는 비활성 최상위 `notify` 표시가 제거되며(기존 전달은 변경 없이 보존됨), 따라서 `doctor --fix`가 더 이상 이에 대해 반복해서 경고하지 않습니다.
</Note>

## 일반적인 편집

메시지를 변경하지 않고 전달 설정을 업데이트합니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

격리된 작업의 전달을 비활성화합니다.

```bash
openclaw cron edit <job-id> --no-deliver
```

격리된 작업에 대해 경량 부트스트랩 컨텍스트를 활성화합니다.

```bash
openclaw cron edit <job-id> --light-context
```

특정 채널에 알립니다.

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram 포럼 주제에 알립니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

경량 부트스트랩 컨텍스트를 사용하여 격리된 작업을 생성합니다.

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context`는 격리된 에이전트 턴 작업에만 적용됩니다. Cron 실행의 경우 경량 모드는 전체 워크스페이스 부트스트랩 세트를 주입하는 대신 부트스트랩 컨텍스트를 비워 둡니다.

정확한 argv, cwd, env, stdin 및 출력 제한으로 명령 작업을 생성합니다.

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

## 일반적인 관리자 명령

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

`openclaw cron list`는 기본적으로 일치하는 모든 작업을 표시합니다. 유효하게 정규화된 에이전트 ID가 일치하는 작업만 표시하려면 `--agent <id>`를 전달하세요. 저장된 에이전트 ID가 없는 작업은 구성된 기본 에이전트로 계산됩니다.

`openclaw cron get <job-id>`는 저장된 작업 JSON을 직접 반환합니다. 전달 경로 미리보기가 포함된 사람이 읽기 쉬운 보기를 원할 때는 `cron show <job-id>`를 사용하세요.

`cron list --json` 및 `cron show <job-id> --json`은 각 작업에 `enabled`, `state.runningAtMs`, `state.lastRunStatus`에서 계산된 최상위 `status` 필드를 포함합니다. 값: `disabled`, `running`, `ok`, `error`, `skipped` 또는 `idle`. 이는 사람이 읽기 쉬운 상태 열을 반영하므로 외부 도구가 작업 상태를 다시 유도하지 않고 읽을 수 있습니다.

`cron runs` 항목에는 의도된 Cron 대상, 확인된 대상, 메시지 도구 전송, 대체 사용 여부 및 전달 상태가 포함된 전달 진단이 포함됩니다.

에이전트 및 세션 대상 변경:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`는 에이전트 턴 작업에서 `--agent`가 생략되면 경고하고 기본 에이전트(`main`)로 대체합니다. 특정 에이전트를 고정하려면 생성 시 `--agent <id>`를 전달하세요.

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
