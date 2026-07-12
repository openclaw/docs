---
read_when:
    - 예약 작업과 깨우기 기능이 필요한 경우
    - Cron 실행과 로그를 디버깅하고 있습니다
summary: '`openclaw cron`의 CLI 참조(백그라운드 작업 예약 및 실행)'
title: Cron
x-i18n:
    generated_at: "2026-07-12T00:37:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

<Tip>
전체 명령어 범위를 확인하려면 `openclaw cron --help`를 실행하세요. 개념 가이드는 [Cron 작업](/ko/automation/cron-jobs)을 참조하세요.
</Tip>

<Note>
모든 Cron 변경 작업(`add`/`create`, `update`/`edit`, `remove`, `run`)에는 `operator.admin`이 필요합니다. 명령 페이로드 실행은 에이전트의 `tools.exec` 도구 호출이 아니라 Gateway 프로세스에서 직접 실행됩니다. 모델에 노출되는 실행 도구에는 여전히 `tools.exec.*`와 실행 승인이 적용됩니다.
</Note>

## 작업 빠르게 생성하기

`openclaw cron create`는 `openclaw cron add`의 별칭입니다. 새 작업에서는 일정을 먼저, 프롬프트를 두 번째로 지정하세요.

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

채팅 대상에 전달하는 대신 완료된 페이로드를 POST해야 하는 작업에는 `--webhook <url>`을 사용하세요.

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

격리된 에이전트/모델 실행을 시작하지 않고 OpenClaw Cron 내부에서 실행되는 결정론적 셸 방식 작업에는 `--command`를 사용하세요.

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`은 `argv: ["sh", "-lc", <shell>]`을 저장합니다. 정확한 argv 실행에는 `--command-argv '["node","scripts/report.mjs"]'`를 사용하세요. 명령 작업은 stdout/stderr를 캡처하고 일반 Cron 기록을 남기며, 격리 작업과 동일한 `announce`, `webhook`, `none` 전달 모드를 통해 출력을 라우팅합니다. `NO_REPLY`만 출력하는 명령은 억제됩니다.

## 세션

`--session`은 `main`, `isolated`, `current` 또는 `session:<id>`를 허용합니다.

<AccordionGroup>
  <Accordion title="세션 키">
    - `main`은 에이전트의 기본 세션에 바인딩됩니다.
    - `isolated`는 실행할 때마다 새로운 트랜스크립트와 세션 ID를 생성합니다.
    - `current`는 생성 시점의 활성 세션에 바인딩됩니다.
    - `session:<id>`는 명시적인 영구 세션 키에 고정됩니다.

  </Accordion>
  <Accordion title="격리 세션 의미 체계">
    격리 실행은 주변 대화 컨텍스트를 초기화합니다. 새 실행에서는 채널 및 그룹 라우팅, 전송/대기열 정책, 권한 상승, 출처, ACP 런타임 바인딩이 초기화됩니다. 안전한 환경설정과 사용자가 명시적으로 선택한 모델 또는 인증 재정의는 실행 간에 유지될 수 있습니다.
  </Accordion>
</AccordionGroup>

## 전달

`openclaw cron list`와 `openclaw cron show <job-id>`는 확인된 전달 경로를 미리 보여 줍니다. `channel: "last"`의 경우 경로가 기본 세션 또는 현재 세션에서 확인되었는지, 아니면 안전하게 실패할지를 미리 보기에 표시합니다.

공급자 접두사가 붙은 대상은 확인되지 않은 알림 채널을 명확히 구분할 수 있습니다. 예를 들어 `to: "telegram:123"`은 `delivery.channel`이 생략되었거나 `last`일 때 Telegram을 선택합니다. 로드된 Plugin에서 공지한 접두사만 공급자 선택자로 사용됩니다. `delivery.channel`을 명시한 경우 접두사는 해당 채널과 일치해야 합니다. `channel: "whatsapp"`과 `to: "telegram:123"`의 조합은 거부됩니다. `imessage:` 및 `sms:` 같은 서비스 접두사는 계속 채널 소유의 대상 구문으로 유지됩니다.

<Note>
격리된 `cron add` 작업의 기본 전달 방식은 `--announce`입니다. 출력을 내부에만 유지하려면 `--no-deliver`를 사용하세요. `--deliver`는 더 이상 권장되지 않는 `--announce`의 별칭으로 유지됩니다.
</Note>

### 전달 소유권

격리된 Cron 채팅 전달은 에이전트와 러너가 분담합니다.

- 채팅 경로를 사용할 수 있으면 에이전트가 `message` 도구를 사용하여 직접 전송할 수 있습니다.
- 에이전트가 확인된 대상에 직접 전송하지 않은 경우에만 `announce`가 최종 응답을 대체 전달합니다.
- `webhook`은 완료된 페이로드를 URL로 게시합니다.
- `none`은 러너의 대체 전달을 비활성화합니다.

Webhook 전달을 설정하려면 `cron add|create --webhook <url>` 또는 `cron edit <job-id> --webhook <url>`을 사용하세요. `--webhook`을 `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, `--account` 같은 채팅 전달 플래그와 함께 사용하지 마세요.

`cron edit <job-id>`에서는 `--clear-channel`, `--clear-to`, `--clear-thread-id`, `--clear-account`를 사용하여 개별 전달 라우팅 필드를 해제할 수 있습니다. 각 옵션은 대응하는 설정 플래그와 함께 사용하면 거부됩니다. 러너의 대체 전달만 비활성화하는 `--no-deliver`와 달리, 이 옵션들은 저장된 필드를 제거하여 작업이 해당 경로 부분을 다시 기본값에서 확인하도록 합니다.

`--announce`는 최종 응답을 위한 러너의 대체 전달입니다. `--no-deliver`는 이 대체 전달을 비활성화하지만 채팅 경로를 사용할 수 있을 때 에이전트의 `message` 도구를 제거하지는 않습니다.

활성 채팅에서 생성된 알림은 대체 알림 전달을 위해 현재 채팅 전달 대상을 보존합니다. 내부 세션 키는 소문자일 수 있으므로 Matrix 방 ID처럼 대소문자를 구분하는 공급자 ID의 신뢰 가능한 기준으로 사용하지 마세요.

### 실패 전달

실패 알림은 다음 순서로 확인됩니다.

1. 작업의 `delivery.failureDestination`.
2. 전역 `cron.failureDestination`.
3. 작업의 기본 알림 대상(위 두 항목 모두 구체적인 대상으로 확인되지 않는 경우).

<Note>
기본 세션 작업은 기본 전달 모드가 `webhook`일 때만 `delivery.failureDestination`을 사용할 수 있습니다. 격리 작업은 모든 모드에서 이를 허용합니다.
</Note>

격리된 Cron 실행은 응답 페이로드가 생성되지 않더라도 실행 수준의 에이전트 실패를 작업 오류로 처리하므로, 모델/공급자 실패도 오류 카운터를 증가시키고 실패 알림을 트리거합니다.

명령 Cron 작업은 격리된 에이전트 턴을 시작하지 않습니다. 종료 코드가 0이면 `ok`를 기록하고, 0이 아닌 종료 코드, 신호, 시간 초과 또는 출력 없음 시간 초과는 `error`를 기록하며 동일한 실패 알림 경로를 트리거할 수 있습니다.

격리 실행이 첫 번째 모델 요청 전에 시간 초과되면 `openclaw cron show`와 `openclaw cron runs`에 `setup timed out before runner start` 같은 단계별 오류나 마지막으로 확인된 시작 단계를 명시하는 중단 메시지(예: `context-engine`)가 포함됩니다. CLI 기반 공급자의 경우 외부 CLI 턴이 시작될 때까지 모델 실행 전 감시 장치가 활성 상태로 유지되므로 세션 조회, 훅, 인증, 프롬프트, CLI 설정 중단이 모델 실행 전 Cron 실패로 보고됩니다.

## 예약

### 일회성 작업

`--at <datetime>`은 일회성 실행을 예약합니다. 오프셋이 없는 날짜 및 시간은 UTC로 처리됩니다. 단, `--tz <iana>`도 함께 전달하면 지정된 시간대의 현지 시각으로 해석됩니다.

<Note>
일회성 작업은 기본적으로 성공 후 삭제됩니다. 보존하려면 `--keep-after-run`을 사용하세요.
</Note>

### 반복 작업

반복 작업은 연속 오류 후 30초, 1분, 5분, 15분, 60분의 지수형 재시도 백오프를 사용합니다. 다음 실행이 성공하면 일정이 정상으로 돌아갑니다.

건너뛴 실행은 실행 오류와 별도로 추적됩니다. 재시도 백오프에는 영향을 주지 않지만, `openclaw cron edit <job-id> --failure-alert-include-skipped`를 사용하면 반복되는 실행 건너뜀 알림도 실패 경고에 포함할 수 있습니다.

로컬로 구성된 모델 공급자(local loopback, 사설 네트워크 또는 `.local`의 기본 URL)를 대상으로 하는 격리 작업의 경우, Cron은 에이전트 턴을 시작하기 전에 가벼운 공급자 사전 점검을 실행합니다. `api: "ollama"` 공급자는 `/api/tags`에서 점검하며, 그 밖의 로컬 OpenAI 호환 공급자(`api: "openai-completions"`, 예: vLLM, SGLang, LM Studio)는 `/models`에서 점검합니다. 엔드포인트에 연결할 수 없으면 실행은 `skipped`로 기록되고 이후 일정에서 다시 시도됩니다. 동일한 로컬 서버를 사용하는 여러 작업이 반복 점검 요청을 집중시키지 않도록 연결 가능 여부 결과는 엔드포인트별로 5분 동안 캐시됩니다.

Cron 작업, 보류 중인 런타임 상태 및 실행 기록은 공유 SQLite 상태 데이터베이스에 저장됩니다. 기존 `jobs.json`, `<name>-state.json`, `runs/*.jsonl` 파일은 한 번 가져온 후 `.migrated` 접미사를 붙여 이름이 변경됩니다. 가져온 후에는 JSON 파일을 편집하지 말고 `openclaw cron add|edit|remove`로 일정을 편집하세요.

### 수동 실행

`openclaw cron run <job-id>`은 기본적으로 강제 실행하며 수동 실행이 대기열에 추가되는 즉시 반환합니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함됩니다. 반환된 `runId`를 사용하여 나중에 결과를 확인하세요.

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

스크립트가 해당 대기 실행이 종료 상태를 기록할 때까지 대기해야 한다면 `--wait`를 추가하세요.

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait`를 사용해도 CLI는 먼저 `cron.run`을 호출한 다음 반환된 `runId`에 대해 `cron.runs`를 폴링합니다. 실행이 `ok` 상태로 완료된 경우에만 명령이 `0`으로 종료됩니다. 실행이 `error` 또는 `skipped`로 완료되거나, Gateway 응답에 `runId`가 없거나, `--wait-timeout`이 만료되면 0이 아닌 값으로 종료됩니다. 기본 시간 초과는 `10m`이며 기본 폴링 간격은 `2s`입니다. `--poll-interval`은 0보다 커야 합니다.

<Note>
현재 작업의 실행 시점이 된 경우에만 수동 명령을 실행하려면 `--due`를 사용하세요. `--due --wait`가 실행을 대기열에 추가하지 않으면 명령은 폴링하지 않고 일반적인 미실행 응답을 반환합니다.
</Note>

## 모델

`cron add|edit --model <ref>`는 작업에 허용된 모델을 선택합니다. `cron add|edit --fallbacks <list>`는 작업별 대체 모델을 설정합니다. 예: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. 대체 모델 없이 엄격하게 실행하려면 `--fallbacks ""`를 전달하세요. `cron edit <job-id> --clear-fallbacks`는 작업별 대체 모델 재정의를 제거합니다. `cron edit <job-id> --clear-model`은 작업별 모델 재정의를 제거하여 작업이 일반적인 Cron 모델 선택 우선순위(저장된 Cron 세션 재정의가 있으면 해당 값, 없으면 에이전트/기본 모델)를 따르도록 하며 `--model`과 함께 사용할 수 없습니다. `cron add|edit --thinking <level>`은 작업별 사고 수준 재정의를 설정합니다. `cron edit <job-id> --clear-thinking`은 이를 제거하여 작업이 일반적인 Cron 사고 수준 우선순위를 따르도록 하며 `--thinking`과 함께 사용할 수 없습니다.

<Warning>
모델이 허용되지 않거나 확인할 수 없는 경우, Cron은 작업의 에이전트 또는 기본 모델 선택으로 대체하지 않고 명시적인 유효성 검사 오류와 함께 실행을 실패 처리합니다.
</Warning>

Cron의 `--model`은 **작업 기본 모델**이며 채팅 세션의 `/model` 재정의가 아닙니다. 이는 다음을 의미합니다.

- 선택한 작업 모델이 실패해도 구성된 대체 모델이 계속 적용됩니다.
- 작업별 페이로드에 `fallbacks`가 있으면 구성된 대체 모델 목록을 대체합니다.
- 빈 작업별 대체 모델 목록(`--fallbacks ""` 또는 작업 페이로드/API의 `fallbacks: []`)은 Cron 실행을 엄격 모드로 만듭니다.
- 작업에 `--model`이 있지만 대체 모델 목록이 구성되지 않은 경우, OpenClaw는 에이전트 기본 모델이 숨겨진 재시도 대상으로 추가되지 않도록 명시적인 빈 대체 모델 재정의를 전달합니다.
- 로컬 공급자 사전 점검은 Cron 실행을 `skipped`로 표시하기 전에 구성된 대체 모델을 순회합니다.

`openclaw doctor`는 `payload.model`이 이미 설정된 작업을 보고하며, 여기에는 공급자 네임스페이스 개수와 `agents.defaults.model` 불일치가 포함됩니다. 실시간 채팅과 예약 작업에서 인증, 공급자 또는 요금 청구 동작이 다르게 보일 때 이 검사를 사용하세요.

### 격리된 Cron 모델 우선순위

격리된 Cron은 다음 순서로 활성 모델을 결정합니다.

1. Gmail 훅 재정의.
2. 작업별 `--model`.
3. 저장된 Cron 세션 모델 재정의(사용자가 선택한 경우).
4. 에이전트 또는 기본 모델 선택.

### 빠른 모드

격리된 Cron의 빠른 모드는 확인된 실시간 모델 선택을 따릅니다. 모델 구성의 `params.fastMode`가 기본적으로 적용되지만 저장된 세션의 `fastMode` 재정의가 구성보다 우선합니다. 확인된 모드가 `auto`이면 임계값은 선택된 모델의 `params.fastAutoOnSeconds` 값을 사용하며 기본값은 60초입니다.

### 실시간 모델 전환 재시도

격리 실행에서 `LiveSessionModelSwitchError`가 발생하면 Cron은 재시도하기 전에 전환된 공급자와 모델을 활성 실행에 영구 저장하며, 전환된 인증 프로필 재정의가 있으면 이 값도 저장합니다. 외부 재시도 루프는 최초 시도 후 모델 전환 재시도를 두 번으로 제한하며, 이후에는 무한 반복하는 대신 중단합니다.

## 실행 출력 및 거부

### 오래된 확인 응답 억제

격리된 Cron 턴은 오래된 확인 전용 응답을 억제합니다. 첫 번째 결과가 단순한 중간 상태 업데이트이고 이후 최종 응답을 담당하는 하위 에이전트 실행이 없다면, Cron은 전달하기 전에 실제 결과를 얻기 위해 한 번 다시 프롬프트를 보냅니다.

### 무응답 토큰 억제

격리된 Cron 실행이 무응답 토큰(`NO_REPLY` 또는 `no_reply`)만 반환하면 Cron은 직접 외부 전달과 대체 대기열 요약 경로를 모두 억제하므로 채팅에 아무것도 게시되지 않습니다.

### 구조화된 거부

격리된 Cron 실행은 내장 실행에서 제공하는 구조화된 실행 거부 메타데이터(`SYSTEM_RUN_DENIED` 또는 `INVALID_REQUEST` 코드가 지정된 치명적인 실행 도구 오류)를 신뢰할 수 있는 거부 신호로 사용합니다. 또한 이러한 코드 중 하나를 포함하는 중첩된 구조화 오류를 감싸는 Node 호스트의 `UNAVAILABLE` 래퍼도 인식합니다.

내장 실행에서 구조화된 거부 메타데이터도 제공하지 않는 한 Cron은 최종 출력의 일반 문구나 승인 거부처럼 보이는 표현을 거부로 분류하지 않으므로, 일반적인 어시스턴트 텍스트는 차단된 명령으로 취급되지 않습니다.

`cron list`와 실행 기록은 차단된 명령을 `ok`로 보고하는 대신 거부 이유를 표시합니다.

## 보존

보존 및 정리는 구성에서 제어합니다.

- `cron.sessionRetention`(기본값 `24h`, 비활성화하려면 `false`)은 완료된 격리 실행 세션을 정리합니다.
- `cron.runLog.keepLines`(기본값 `2000`)는 작업별로 보존된 SQLite 실행 기록 행을 정리합니다. `cron.runLog.maxBytes`(기본값 `2000000`)는 이전 파일 기반 실행 로그와의 호환성을 위해 계속 허용되며, SQLite 정리는 행 수를 기준으로 합니다.

## 이전 작업 마이그레이션

<Note>
현재 전달 및 저장소 형식 이전에 생성된 Cron 작업이 있다면 `openclaw doctor --fix`를 실행하세요. Doctor는 레거시 Cron 필드(`jobId`, `schedule.cron`, 레거시 `threadId`를 포함한 최상위 전달 필드, 페이로드 `provider` 전달 별칭)를 정규화하고, `notify: true` Webhook 대체 작업을 `cron.webhook`에서 명시적인 Webhook 전달로 마이그레이션합니다. 이미 채팅에 알림을 보내는 작업은 해당 전달을 유지하고 완료 Webhook 대상을 추가로 받습니다. `cron.webhook`이 설정되지 않은 경우 마이그레이션 대상이 없는 작업에서 비활성 최상위 `notify` 마커가 제거되며(기존 전달은 변경 없이 유지됨), 따라서 `doctor --fix`는 더 이상 해당 작업에 대해 반복해서 경고하지 않습니다.
</Note>

## 일반적인 편집

메시지를 변경하지 않고 전달 설정을 업데이트합니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

격리 작업의 전달을 비활성화합니다.

```bash
openclaw cron edit <job-id> --no-deliver
```

격리 작업에 경량 부트스트랩 컨텍스트를 활성화합니다.

```bash
openclaw cron edit <job-id> --light-context
```

특정 채널에 알림을 보냅니다.

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram 포럼 주제에 알림을 보냅니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

경량 부트스트랩 컨텍스트가 적용된 격리 작업을 생성합니다.

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context`는 격리된 에이전트 턴 작업에만 적용됩니다. Cron 실행에서 경량 모드는 전체 워크스페이스 부트스트랩 집합을 주입하는 대신 부트스트랩 컨텍스트를 비워 둡니다.

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

## 일반적인 관리 명령

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

`openclaw cron list`는 기본적으로 조건과 일치하는 모든 작업을 표시합니다. 유효한 정규화 에이전트 ID가 일치하는 작업만 표시하려면 `--agent <id>`를 전달하세요. 저장된 에이전트 ID가 없는 작업은 구성된 기본 에이전트에 속하는 것으로 간주합니다.

`openclaw cron get <job-id>`은 저장된 작업 JSON을 직접 반환합니다. 전달 경로 미리보기가 포함된 사람이 읽기 쉬운 보기가 필요하면 `cron show <job-id>`를 사용하세요.

`cron list --json`과 `cron show <job-id> --json`은 `enabled`, `state.runningAtMs`, `state.lastRunStatus`에서 계산된 최상위 `status` 필드를 각 작업에 포함합니다. 값은 `disabled`, `running`, `ok`, `error`, `skipped` 또는 `idle`입니다. 외부 도구에서 작업 상태를 다시 계산하지 않고 읽을 수 있도록 JSON 상태는 표준 형식 그대로 장식 없이 유지됩니다. 사람이 읽는 출력에서는 반복되는 `error` 상태에 실패 횟수를 표시할 수 있습니다.

`cron runs` 항목에는 의도된 Cron 대상, 확인된 대상, 메시지 도구 전송, 대체 경로 사용 여부 및 전달 상태가 포함된 전달 진단 정보가 들어 있습니다.

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

## 관련 문서

- [CLI 참조](/ko/cli)
- [예약 작업](/ko/automation/cron-jobs)
