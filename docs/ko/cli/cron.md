---
read_when:
    - 예약된 작업 및 절전 모드 해제 기능이 필요한 경우
    - Cron 실행 및 로그를 디버깅하고 있습니다
summary: '`openclaw cron`의 CLI 참조(백그라운드 작업 예약 및 실행)'
title: Cron
x-i18n:
    generated_at: "2026-07-12T15:02:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

<Tip>
전체 명령어 인터페이스는 `openclaw cron --help`를 실행하여 확인하십시오. 개념 가이드는 [Cron 작업](/ko/automation/cron-jobs)을 참조하십시오.
</Tip>

<Note>
모든 Cron 변경 작업(`add`/`create`, `update`/`edit`, `remove`, `run`)에는 `operator.admin`이 필요합니다. 명령 페이로드 실행은 에이전트의 `tools.exec` 도구 호출이 아니라 Gateway 프로세스에서 직접 실행됩니다. 모델에 노출되는 exec 도구에는 여전히 `tools.exec.*` 및 exec 승인이 적용됩니다.
</Note>

## 작업 빠르게 생성하기

`openclaw cron create`는 `openclaw cron add`의 별칭입니다. 새 작업에서는 일정을 먼저 지정하고 프롬프트를 두 번째로 지정합니다.

```bash
openclaw cron create "0 7 * * *" \
  "밤사이 업데이트를 요약합니다." \
  --name "아침 브리핑" \
  --agent ops
```

채팅 대상으로 전달하는 대신 완료된 페이로드를 POST해야 하는 작업에는 `--webhook <url>`을 사용합니다.

```bash
openclaw cron create "0 18 * * 1-5" \
  "오늘의 배포를 JSON으로 요약합니다." \
  --name "배포 요약" \
  --webhook "https://example.invalid/openclaw/cron"
```

격리된 에이전트/모델 실행을 시작하지 않고 OpenClaw Cron 내부에서 실행되는 결정론적 셸 스타일 작업에는 `--command`를 사용합니다.

```bash
openclaw cron create "*/15 * * * *" \
  --name "대기열 깊이 검사" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`은 `argv: ["sh", "-lc", <shell>]`을 저장합니다. 정확한 argv 실행에는 `--command-argv '["node","scripts/report.mjs"]'`를 사용합니다. 명령 작업은 stdout/stderr를 캡처하고 일반 Cron 기록을 남기며, 격리된 작업과 동일한 `announce`, `webhook`, `none` 전달 모드를 통해 출력을 라우팅합니다. `NO_REPLY`만 출력하는 명령은 억제됩니다.

## 세션

`--session`에는 `main`, `isolated`, `current` 또는 `session:<id>`를 지정할 수 있습니다.

<AccordionGroup>
  <Accordion title="세션 키">
    - `main`은 에이전트의 기본 세션에 연결됩니다.
    - `isolated`는 실행할 때마다 새로운 트랜스크립트와 세션 ID를 생성합니다.
    - `current`는 생성 시점의 활성 세션에 연결됩니다.
    - `session:<id>`는 명시적인 영구 세션 키에 고정됩니다.

  </Accordion>
  <Accordion title="격리된 세션의 의미">
    격리된 실행은 주변 대화 컨텍스트를 초기화합니다. 채널 및 그룹 라우팅, 전송/대기열 정책, 권한 상승, 출처, ACP 런타임 바인딩이 새 실행에 맞게 초기화됩니다. 안전한 환경설정과 사용자가 명시적으로 선택한 모델 또는 인증 재정의는 실행 간에 유지될 수 있습니다.
  </Accordion>
</AccordionGroup>

## 전달

`openclaw cron list`와 `openclaw cron show <job-id>`는 결정된 전달 경로의 미리보기를 표시합니다. `channel: "last"`의 경우 해당 경로가 기본 세션 또는 현재 세션에서 결정되었는지, 아니면 안전하게 실패할지를 미리보기에서 보여 줍니다.

프로바이더 접두사가 붙은 대상은 결정되지 않은 알림 채널을 명확히 구분할 수 있습니다. 예를 들어 `to: "telegram:123"`은 `delivery.channel`이 생략되었거나 `last`일 때 Telegram을 선택합니다. 로드된 Plugin이 알리는 접두사만 프로바이더 선택자로 사용할 수 있습니다. `delivery.channel`이 명시되어 있으면 접두사가 해당 채널과 일치해야 합니다. `channel: "whatsapp"`과 `to: "telegram:123"`의 조합은 거부됩니다. `imessage:` 및 `sms:`와 같은 서비스 접두사는 계속 채널이 소유하는 대상 구문으로 유지됩니다.

<Note>
격리된 `cron add` 작업의 기본 전달 방식은 `--announce`입니다. 출력을 내부에만 유지하려면 `--no-deliver`를 사용하십시오. `--deliver`는 `--announce`의 사용 중단된 별칭으로 계속 제공됩니다.
</Note>

### 전달 소유권

격리된 Cron 채팅 전달은 에이전트와 러너가 공동으로 처리합니다.

- 채팅 경로를 사용할 수 있으면 에이전트가 `message` 도구를 사용하여 직접 전송할 수 있습니다.
- 에이전트가 결정된 대상으로 직접 전송하지 않은 경우에만 `announce`가 최종 응답을 대체 전달합니다.
- `webhook`은 완료된 페이로드를 URL로 게시합니다.
- `none`은 러너의 대체 전달을 비활성화합니다.

Webhook 전달을 설정하려면 `cron add|create --webhook <url>` 또는 `cron edit <job-id> --webhook <url>`을 사용합니다. `--webhook`을 `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, `--account`와 같은 채팅 전달 플래그와 함께 사용하지 마십시오.

`cron edit <job-id>`에서는 `--clear-channel`, `--clear-to`, `--clear-thread-id`, `--clear-account`를 사용하여 개별 전달 라우팅 필드를 해제할 수 있습니다. 각 플래그를 대응하는 설정 플래그와 함께 사용하면 거부됩니다. 러너의 대체 전달만 비활성화하는 `--no-deliver`와 달리, 이 플래그들은 저장된 필드를 제거하여 작업이 해당 경로 부분을 다시 기본값에서 결정하도록 합니다.

`--announce`는 최종 응답에 대한 러너의 대체 전달입니다. `--no-deliver`는 해당 대체 전달을 비활성화하지만, 채팅 경로를 사용할 수 있을 때 에이전트의 `message` 도구를 제거하지는 않습니다.

활성 채팅에서 생성된 미리 알림은 대체 알림 전달을 위해 현재 채팅의 전달 대상을 보존합니다. 내부 세션 키는 소문자일 수 있으므로 Matrix 방 ID처럼 대소문자를 구분하는 프로바이더 ID의 신뢰할 수 있는 정보원으로 사용하지 마십시오.

### 실패 전달

실패 알림은 다음 순서로 결정됩니다.

1. 작업의 `delivery.failureDestination`.
2. 전역 `cron.failureDestination`.
3. 작업의 기본 알림 대상(위 두 항목 중 어느 것도 구체적인 대상으로 결정되지 않는 경우).

<Note>
기본 세션 작업은 기본 전달 모드가 `webhook`인 경우에만 `delivery.failureDestination`을 사용할 수 있습니다. 격리된 작업에서는 모든 모드에서 사용할 수 있습니다.
</Note>

격리된 Cron 실행에서는 응답 페이로드가 생성되지 않더라도 실행 수준의 에이전트 실패를 작업 오류로 처리합니다. 따라서 모델/프로바이더 실패도 오류 카운터를 증가시키고 실패 알림을 트리거합니다.

명령 Cron 작업은 격리된 에이전트 턴을 시작하지 않습니다. 종료 코드가 0이면 `ok`로 기록되며, 0이 아닌 종료 코드, 신호, 시간 초과 또는 출력 없음 시간 초과는 `error`로 기록되고 동일한 실패 알림 경로를 트리거할 수 있습니다.

격리 실행이 첫 번째 모델 요청 전에 시간 초과되면 `openclaw cron show`와 `openclaw cron runs`에 `setup timed out before runner start`와 같은 단계별 오류 또는 마지막으로 확인된 시작 단계(예: `context-engine`)를 명시하는 정지 메시지가 포함됩니다. CLI 기반 공급자의 경우 외부 CLI 턴이 시작될 때까지 모델 실행 전 감시 타이머가 활성 상태로 유지되므로 세션 조회, 훅, 인증, 프롬프트 및 CLI 설정 중 정지는 모델 실행 전 Cron 실패로 보고됩니다.

## 예약

### 일회성 작업

`--at <datetime>`은 일회성 실행을 예약합니다. 오프셋이 없는 날짜와 시간은 UTC로 처리되지만, `--tz <iana>`도 함께 전달하면 지정된 시간대의 현지 시각으로 해석합니다.

<Note>
일회성 작업은 기본적으로 성공 후 삭제됩니다. 보존하려면 `--keep-after-run`을 사용하십시오.
</Note>

### 반복 작업

반복 작업은 연속 오류 후 지수형 재시도 백오프를 사용합니다: 30s, 1m, 5m, 15m, 60m. 다음 실행이 성공하면 일정이 정상으로 돌아갑니다.

건너뛴 실행은 실행 오류와 별도로 추적됩니다. 재시도 백오프에는 영향을 주지 않지만, `openclaw cron edit <job-id> --failure-alert-include-skipped`를 사용하면 실패 알림에 반복되는 실행 건너뜀 알림을 포함할 수 있습니다.

로컬에 구성된 모델 공급자(루프백, 사설 네트워크 또는 `.local`의 기본 URL)를 대상으로 하는 격리 작업의 경우 Cron은 에이전트 턴을 시작하기 전에 간단한 공급자 사전 검사를 실행합니다. `api: "ollama"` 공급자는 `/api/tags`에서 검사하고, 기타 로컬 OpenAI 호환 공급자(`api: "openai-completions"`, 예: vLLM, SGLang, LM Studio)는 `/models`에서 검사합니다. 엔드포인트에 연결할 수 없으면 실행은 `skipped`로 기록되고 이후 일정에서 재시도됩니다. 동일한 로컬 서버를 대상으로 하는 여러 작업이 반복 검사로 서버에 과도한 부하를 주지 않도록 연결 가능 여부 결과는 엔드포인트별로 5분 동안 캐시됩니다.

Cron 작업, 대기 중인 런타임 상태 및 실행 기록은 공유 SQLite 상태 데이터베이스에 저장됩니다. 기존 `jobs.json`, `<name>-state.json` 및 `runs/*.jsonl` 파일은 한 번 가져온 후 `.migrated` 접미사를 붙여 이름이 변경됩니다. 가져온 후에는 JSON 파일을 편집하지 말고 `openclaw cron add|edit|remove`로 일정을 편집하십시오.

### 수동 실행

`openclaw cron run <job-id>`은 기본적으로 강제 실행하며 수동 실행이 대기열에 추가되는 즉시 반환됩니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함됩니다. 반환된 `runId`를 사용하여 나중에 결과를 확인하십시오.

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

스크립트가 대기열에 추가된 해당 실행이 최종 상태를 기록할 때까지 대기해야 한다면 `--wait`를 추가하십시오.

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait`를 사용해도 CLI는 먼저 `cron.run`을 호출한 다음 반환된 `runId`를 사용하여 `cron.runs`를 폴링합니다. 실행이 `ok` 상태로 완료된 경우에만 명령이 `0`으로 종료됩니다. 실행이 `error` 또는 `skipped`로 완료되거나, Gateway 응답에 `runId`가 포함되지 않거나, `--wait-timeout`이 만료되면(기본값 `10m`, 기본적으로 `2s`마다 폴링) 0이 아닌 값으로 종료됩니다. `--poll-interval`은 0보다 커야 합니다.

<Note>
작업의 현재 실행 예정 시각이 된 경우에만 수동 명령을 실행하려면 `--due`를 사용하십시오. `--due --wait`가 실행을 대기열에 추가하지 않으면 명령은 폴링하지 않고 일반적인 미실행 응답을 반환합니다.
</Note>

## 모델

`cron add|edit --model <ref>`는 작업에 허용되는 모델을 선택합니다. `cron add|edit --fallbacks <list>`는 작업별 대체 모델을 설정합니다. 예: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. 대체 모델이 없는 엄격한 실행에는 `--fallbacks ""`를 전달하십시오. `cron edit <job-id> --clear-fallbacks`는 작업별 대체 모델 재정의를 제거합니다. `cron edit <job-id> --clear-model`은 작업별 모델 재정의를 제거하여 작업이 일반적인 Cron 모델 선택 우선순위(저장된 Cron 세션 재정의가 있으면 해당 재정의, 그렇지 않으면 에이전트/기본 모델)를 따르게 하며, `--model`과 함께 사용할 수 없습니다. `cron add|edit --thinking <level>`은 작업별 사고 수준 재정의를 설정합니다. `cron edit <job-id> --clear-thinking`은 이를 제거하여 작업이 일반적인 Cron 사고 수준 우선순위를 따르게 하며, `--thinking`과 함께 사용할 수 없습니다.

<Warning>
모델이 허용되지 않거나 확인할 수 없으면 Cron은 작업의 에이전트 또는 기본 모델 선택으로 대체하는 대신 명시적인 유효성 검사 오류로 실행을 실패 처리합니다.
</Warning>

Cron의 `--model`은 채팅 세션의 `/model` 재정의가 아니라 **작업 기본 모델**입니다. 이는 다음을 의미합니다.

- 선택된 작업 모델이 실패하면 구성된 모델 대체 항목이 계속 적용됩니다.
- 작업별 페이로드에 `fallbacks`가 있으면 구성된 대체 모델 목록을 대체합니다.
- 빈 작업별 대체 모델 목록(작업 페이로드/API의 `--fallbacks ""` 또는 `fallbacks: []`)은 Cron 실행을 엄격 모드로 만듭니다.
- 작업에 `--model`이 있지만 대체 모델 목록이 구성되지 않은 경우 OpenClaw는 에이전트 기본 모델이 숨겨진 재시도 대상으로 추가되지 않도록 명시적인 빈 대체 모델 재정의를 전달합니다.
- 로컬 공급자 사전 검사는 Cron 실행을 `skipped`로 표시하기 전에 구성된 대체 모델을 순서대로 검사합니다.

`openclaw doctor`는 `payload.model`이 이미 설정된 작업을 공급자 네임스페이스별 개수 및 `agents.defaults.model`과의 불일치 정보와 함께 보고합니다. 실시간 채팅과 예약된 작업 간에 인증, 공급자 또는 결제 동작이 다르게 보이면 이 검사를 사용하십시오.

### 격리 Cron 모델 우선순위

격리 Cron은 다음 순서로 활성 모델을 결정합니다.

1. Gmail 훅 재정의.
2. 작업별 `--model`.
3. 저장된 Cron 세션 모델 재정의(사용자가 선택한 경우).
4. 에이전트 또는 기본 모델 선택.

### 빠른 모드

격리 Cron 빠른 모드는 결정된 실시간 모델 선택을 따릅니다. 모델 구성의 `params.fastMode`가 기본적으로 적용되지만, 저장된 세션의 `fastMode` 재정의가 구성보다 우선합니다. 결정된 모드가 `auto`이면 기준 시간은 선택된 모델의 `params.fastAutoOnSeconds` 값을 사용하며 기본값은 60초입니다.

### 실시간 모델 전환 재시도

격리 실행에서 `LiveSessionModelSwitchError`가 발생하면 Cron은 재시도하기 전에 전환된 공급자와 모델 및 전환된 인증 프로필 재정의(있는 경우)를 활성 실행에 저장합니다. 외부 재시도 루프는 최초 시도 후 최대 두 번의 전환 재시도로 제한되며, 이후에는 무한 반복하지 않고 중단됩니다.

## 실행 출력 및 거부

### 오래된 확인 응답 억제

격리 Cron 턴은 오래된 확인 전용 응답을 억제합니다. 첫 번째 결과가 단순한 중간 상태 업데이트이고 최종 응답을 담당하는 하위 서브에이전트 실행이 없으면 Cron은 전달 전에 실제 결과를 얻기 위해 한 번 다시 프롬프트를 보냅니다.

### 무응답 토큰 억제

격리된 Cron 실행이 무응답 토큰(`NO_REPLY` 또는 `no_reply`)만 반환하면 Cron은 직접 외부 전달과 대체 대기열 요약 경로를 모두 억제하므로 채팅에 아무것도 게시되지 않습니다.

### 구조화된 거부

격리된 Cron 실행은 내장 실행에서 제공하는 구조화된 실행 거부 메타데이터(`SYSTEM_RUN_DENIED` 또는 `INVALID_REQUEST`로 코딩된 치명적인 실행 도구 오류)를 신뢰할 수 있는 거부 신호로 사용합니다. 또한 이러한 코드 중 하나를 포함하는 중첩된 구조화 오류를 감싼 Node 호스트의 `UNAVAILABLE` 래퍼도 인식합니다.

내장 실행이 구조화된 거부 메타데이터도 제공하지 않는 한 Cron은 최종 출력의 일반 문구나 승인 거부처럼 보이는 표현을 거부로 분류하지 않으므로, 일반적인 어시스턴트 텍스트가 차단된 명령으로 처리되지 않습니다.

`cron list`와 실행 기록은 차단된 명령을 `ok`로 보고하는 대신 거부 사유를 표시합니다.

## 보존

보존 및 정리는 구성에서 제어합니다.

- `cron.sessionRetention`(기본값 `24h`, 비활성화하려면 `false`)은 완료된 격리 실행 세션을 정리합니다.
- `cron.runLog.keepLines`(기본값 `2000`)는 작업별로 보존된 SQLite 실행 기록 행을 정리합니다. `cron.runLog.maxBytes`(기본값 `2000000`)는 이전 파일 기반 실행 로그와의 호환성을 위해 계속 허용되며, SQLite 정리는 행 수를 기준으로 합니다.

## 이전 작업 마이그레이션

<Note>
현재 전달 및 저장소 형식 이전에 생성한 Cron 작업이 있다면 `openclaw doctor --fix`를 실행하십시오. Doctor는 레거시 Cron 필드(`jobId`, `schedule.cron`, 레거시 `threadId`를 포함한 최상위 전달 필드, 페이로드 `provider` 전달 별칭)를 정규화하고, `notify: true` Webhook 대체 작업을 `cron.webhook`에서 명시적인 Webhook 전달로 마이그레이션합니다. 이미 채팅에 알림을 보내는 작업은 해당 전달을 유지하고 완료 Webhook 대상을 추가로 받습니다. `cron.webhook`이 설정되지 않은 경우 마이그레이션 대상이 없는 작업에서는 비활성 상태인 최상위 `notify` 표시가 제거되며(기존 전달은 변경 없이 유지됨), 따라서 `doctor --fix`가 해당 작업에 관해 더 이상 반복해서 경고하지 않습니다.
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

격리된 작업에 경량 부트스트랩 컨텍스트를 활성화합니다.

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

경량 부트스트랩 컨텍스트를 사용하는 격리된 작업을 생성합니다.

```bash
openclaw cron create "0 7 * * *" \
  "야간 업데이트를 요약합니다." \
  --name "경량 아침 브리핑" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context`는 격리된 에이전트 턴 작업에만 적용됩니다. Cron 실행에서 경량 모드는 전체 워크스페이스 부트스트랩 세트를 삽입하는 대신 부트스트랩 컨텍스트를 비워 둡니다.

정확한 argv, cwd, env, stdin 및 출력 제한을 지정하여 명령 작업을 생성합니다.

```bash
openclaw cron create "*/30 * * * *" \
  --name "포지션 내보내기" \
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

`openclaw cron list`는 기본적으로 일치하는 모든 작업을 표시합니다. `--agent <id>`를 전달하면 유효한 정규화 에이전트 ID가 일치하는 작업만 표시하며, 저장된 에이전트 ID가 없는 작업은 구성된 기본 에이전트에 속하는 것으로 간주합니다.

`openclaw cron get <job-id>`는 저장된 작업 JSON을 직접 반환합니다. 전달 경로 미리보기가 포함된 사람이 읽기 쉬운 보기가 필요하면 `cron show <job-id>`를 사용하십시오.

`cron list --json`과 `cron show <job-id> --json`은 각 작업에 `enabled`, `state.runningAtMs`, `state.lastRunStatus`를 기반으로 계산된 최상위 `status` 필드를 포함합니다. 값은 `disabled`, `running`, `ok`, `error`, `skipped` 또는 `idle`입니다. 외부 도구가 작업 상태를 다시 계산하지 않고 읽을 수 있도록 JSON 상태는 정규 형식이며 별도의 장식이 없습니다. 사람이 읽는 출력에서는 반복된 `error` 상태에 실패 횟수를 표시할 수 있습니다.

`cron runs` 항목에는 의도한 Cron 대상, 확인된 대상, 메시지 도구 전송, 대체 경로 사용 여부 및 전달 상태를 포함한 전달 진단 정보가 들어 있습니다.

에이전트 및 세션 대상 변경:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

에이전트 턴 작업에서 `--agent`를 생략하면 `openclaw cron add`가 경고하고 기본 에이전트(`main`)를 사용합니다. 생성 시 특정 에이전트를 고정하려면 `--agent <id>`를 전달하십시오.

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
- [예약된 작업](/ko/automation/cron-jobs)
