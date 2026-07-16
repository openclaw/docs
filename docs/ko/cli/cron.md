---
read_when:
    - 예약된 작업과 절전 해제 기능이 필요합니다
    - Cron 실행 및 로그를 디버깅하고 있습니다
summary: '`openclaw cron`(백그라운드 작업 예약 및 실행)에 대한 CLI 참조 문서'
title: Cron
x-i18n:
    generated_at: "2026-07-16T12:27:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

<Tip>
전체 명령 표면을 확인하려면 `openclaw cron --help`을 실행하십시오. 개념 가이드는 [Cron 작업](/ko/automation/cron-jobs)을 참조하십시오.
</Tip>

<Note>
모든 Cron 변경 작업(`add`/`create`, `update`/`edit`, `remove`, `run`)에는 `operator.admin`이 필요합니다. 명령 페이로드 실행은 에이전트의 `tools.exec` 도구 호출이 아니라 Gateway 프로세스에서 직접 실행되며, 모델에 표시되는 실행 도구에는 여전히 `tools.exec.*` 및 실행 승인이 적용됩니다.
</Note>

## 작업을 빠르게 생성하기

`openclaw cron create`은 `openclaw cron add`의 별칭입니다. 새 작업에서는 일정을 먼저, 프롬프트를 두 번째로 지정하십시오.

```bash
openclaw cron create "0 7 * * *" \
  "야간 업데이트를 요약하십시오." \
  --name "아침 브리핑" \
  --agent ops
```

채팅 대상에 전달하는 대신 완료된 페이로드를 POST해야 하는 작업에는 `--webhook <url>`을 사용하십시오.

```bash
openclaw cron create "0 18 * * 1-5" \
  "오늘의 배포를 JSON으로 요약하십시오." \
  --name "배포 요약" \
  --webhook "https://example.invalid/openclaw/cron"
```

격리된 에이전트/모델 실행을 시작하지 않고 OpenClaw Cron 내부에서 실행되는 결정론적 셸 스타일 작업에는 `--command`을 사용하십시오.

```bash
openclaw cron create "*/15 * * * *" \
  --name "대기열 깊이 검사" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>`은 `argv: ["sh", "-lc", <shell>]`을 저장합니다. 정확한 argv 실행에는 `--command-argv '["node","scripts/report.mjs"]'`을 사용하십시오. 명령 작업은 stdout/stderr를 캡처하고 일반 Cron 기록을 남기며, 격리 작업과 동일한 `announce`, `webhook` 또는 `none` 전달 모드를 통해 출력을 라우팅합니다. `NO_REPLY`만 출력하는 명령은 억제됩니다.

## 세션

`--session`은 `main`, `isolated`, `current` 또는 `session:<id>`을 허용합니다.

<AccordionGroup>
  <Accordion title="세션 키">
    - `main`은 에이전트의 기본 세션에 바인딩됩니다.
    - `isolated`은 실행할 때마다 새 트랜스크립트와 세션 ID를 생성합니다.
    - `current`은 생성 시점의 활성 세션에 바인딩됩니다.
    - `session:<id>`은 명시적인 영구 세션 키에 고정됩니다.

  </Accordion>
  <Accordion title="격리 세션 의미 체계">
    격리 실행은 주변 대화 컨텍스트를 초기화합니다. 채널 및 그룹 라우팅, 전송/대기열 정책, 권한 상승, 출처 및 ACP 런타임 바인딩이 새 실행에 맞게 초기화됩니다. 안전한 기본 설정과 사용자가 명시적으로 선택한 모델 또는 인증 재정의는 실행 간에 유지될 수 있습니다.
  </Accordion>
</AccordionGroup>

## 전달

`openclaw cron list` 및 `openclaw cron show <job-id>`은 해석된 전달 경로를 미리 보여 줍니다. `channel: "last"`의 경우 미리보기에는 경로가 기본 세션 또는 현재 세션에서 해석되었는지, 아니면 안전하게 실패할지가 표시됩니다.

공급자 접두사가 붙은 대상은 해석되지 않은 알림 채널을 명확히 구분할 수 있습니다. 예를 들어 `to: "telegram:123"`은 `delivery.channel`이 생략되거나 `last`일 때 Telegram을 선택합니다. 로드된 Plugin에서 공시하는 접두사만 공급자 선택자로 사용됩니다. `delivery.channel`이 명시된 경우 접두사는 해당 채널과 일치해야 하며, `channel: "whatsapp"`과 `to: "telegram:123"`의 조합은 거부됩니다. `imessage:` 및 `sms:`과 같은 서비스 접두사는 계속 채널 소유의 대상 구문으로 유지됩니다.

<Note>
격리된 `cron add` 작업의 기본 전달 방식은 `--announce`입니다. 출력을 내부에 유지하려면 `--no-deliver`을 사용하십시오. `--deliver`은 `--announce`의 사용 중단된 별칭으로 유지됩니다.
</Note>

### 전달 소유권

격리된 Cron 채팅 전달은 에이전트와 러너가 공동으로 담당합니다.

- 채팅 경로를 사용할 수 있으면 에이전트는 `message` 도구를 사용하여 직접 전송할 수 있습니다.
- `announce`은 에이전트가 해석된 대상에 직접 전송하지 않은 경우에만 최종 응답을 대체 전달합니다.
- `webhook`은 완료된 페이로드를 URL에 게시합니다.
- `none`은 러너 대체 전달을 비활성화합니다.

Webhook 전달을 설정하려면 `cron add|create --webhook <url>` 또는 `cron edit <job-id> --webhook <url>`을 사용하십시오. `--webhook`을 `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` 또는 `--account`과 같은 채팅 전달 플래그와 함께 사용하지 마십시오.

`cron edit <job-id>`은 `--clear-channel`, `--clear-to`, `--clear-thread-id` 및 `--clear-account`을 사용하여 개별 전달 라우팅 필드의 설정을 해제할 수 있습니다. 각 옵션을 대응하는 설정 플래그와 함께 사용하면 거부됩니다. 러너 대체 전달만 비활성화하는 `--no-deliver`과 달리, 이 옵션들은 저장된 필드를 제거하므로 작업이 해당 경로 부분을 다시 기본값에서 해석합니다.

`--announce`은 최종 응답을 위한 러너 대체 전달입니다. `--no-deliver`은 이 대체 전달을 비활성화하지만, 채팅 경로를 사용할 수 있을 때 에이전트의 `message` 도구를 제거하지는 않습니다.

활성 채팅에서 생성된 미리 알림은 대체 알림 전달을 위해 실시간 채팅 전달 대상을 유지합니다. 내부 세션 키는 소문자일 수 있으므로 Matrix 방 ID와 같이 대소문자를 구분하는 공급자 ID의 신뢰할 수 있는 출처로 사용하지 마십시오.

### 실패 전달

실패 알림은 다음 순서로 해석됩니다.

1. 작업의 `delivery.failureDestination`.
2. 전역 `cron.failureDestination`.
3. 작업의 기본 알림 대상(위 항목 중 어느 것도 구체적인 대상으로 해석되지 않는 경우).

<Note>
기본 세션 작업은 기본 전달 모드가 `webhook`인 경우에만 `delivery.failureDestination`을 사용할 수 있습니다. 격리 작업은 모든 모드에서 이를 허용합니다.
</Note>

격리된 Cron 실행은 응답 페이로드가 생성되지 않은 경우에도 실행 수준의 에이전트 실패를 작업 오류로 처리하므로, 모델/공급자 실패도 오류 카운터를 증가시키고 실패 알림을 트리거합니다.

명령 Cron 작업은 격리된 에이전트 턴을 시작하지 않습니다. 종료 코드가 0이면 `ok`을 기록하고, 0이 아닌 종료 코드, 신호, 시간 초과 또는 출력 없음 시간 초과는 `error`을 기록하며 동일한 실패 알림 경로를 트리거할 수 있습니다.

격리된 실행이 첫 번째 모델 요청 전에 시간 초과되면 `openclaw cron show` 및 `openclaw cron runs`에 `setup timed out before runner start`과 같은 단계별 오류 또는 마지막으로 확인된 시작 단계의 이름을 포함하는 정지 메시지(예: `context-engine`)가 포함됩니다. CLI 기반 공급자의 경우 모델 실행 전 감시 장치는 외부 CLI 턴이 시작될 때까지 활성 상태를 유지하므로 세션 조회, 훅, 인증, 프롬프트 및 CLI 설정 중 정지가 모델 실행 전 Cron 실패로 보고됩니다.

## 예약

### 일회성 작업

`--at <datetime>`은 일회성 실행을 예약합니다. 오프셋이 없는 날짜와 시간은 `--tz <iana>`도 전달하지 않는 한 UTC로 처리됩니다. 이 옵션을 전달하면 지정된 시간대의 현지 시각으로 해석됩니다.

<Note>
일회성 작업은 성공 후 기본적으로 삭제됩니다. 유지하려면 `--keep-after-run`을 사용하십시오.
</Note>

### 반복 작업

반복 작업은 연속 오류 후 30s, 1m, 5m, 15m, 60m의 지수 재시도 백오프를 사용합니다. 다음 실행이 성공하면 일정이 정상으로 돌아옵니다.

건너뛴 실행은 실행 오류와 별도로 추적됩니다. 재시도 백오프에는 영향을 주지 않지만, `openclaw cron edit <job-id> --failure-alert-include-skipped`을 사용하면 실패 경고에 반복된 실행 건너뜀 알림을 포함할 수 있습니다.

로컬로 구성된 모델 공급자(루프백, 사설 네트워크 또는 `.local`의 기본 URL)를 대상으로 하는 격리 작업의 경우, Cron은 에이전트 턴을 시작하기 전에 가벼운 공급자 사전 점검을 실행합니다. `api: "ollama"` 공급자는 `/api/tags`에서 검사되며, 기타 로컬 OpenAI 호환 공급자(`api: "openai-completions"`, 예: vLLM, SGLang, LM Studio)는 `/models`에서 검사됩니다. 엔드포인트에 연결할 수 없으면 실행은 `skipped`으로 기록되고 이후 일정에서 재시도됩니다. 동일한 로컬 서버를 사용하는 많은 작업이 반복 검사로 서버에 과부하를 주지 않도록 연결 가능 여부 결과는 엔드포인트별로 5분 동안 캐시됩니다.

Cron 작업, 보류 중인 런타임 상태 및 실행 기록은 공유 SQLite 상태 데이터베이스에 저장됩니다. 기존 `jobs.json`, `<name>-state.json` 및 `runs/*.jsonl` 파일은 한 번 가져온 후 `.migrated` 접미사가 붙도록 이름이 변경됩니다. 가져온 후에는 JSON 파일을 편집하지 말고 `openclaw cron add|edit|remove`을 사용하여 일정을 편집하십시오.

### 수동 실행

`openclaw cron run <job-id>`은 기본적으로 강제 실행하며 수동 실행이 대기열에 추가되는 즉시 반환됩니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`이 포함됩니다. 반환된 `runId`을 사용하여 이후 결과를 확인하십시오.

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

스크립트가 해당 대기열 실행의 최종 상태가 기록될 때까지 차단되어야 하는 경우 `--wait`을 추가하십시오.

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

`--wait`을 사용해도 CLI는 먼저 `cron.run`을 호출한 다음 반환된 `runId`에 대해 `cron.runs`을 폴링합니다. 실행이 `ok` 상태로 완료된 경우에만 명령이 `0`으로 종료됩니다. 실행이 `error` 또는 `skipped`으로 완료되거나, Gateway 응답에 `runId`이 포함되지 않거나, `--wait-timeout`이 만료되면 0이 아닌 코드로 종료됩니다. 기본값은 `10m`이며 기본적으로 `2s`마다 폴링합니다. `--poll-interval`은 0보다 커야 합니다.

<Note>
작업 실행 예정 시간이 현재 도래한 경우에만 수동 명령을 실행하려면 `--due`을 사용하십시오. `--due --wait`이 실행을 대기열에 추가하지 않으면 명령은 폴링하지 않고 일반적인 미실행 응답을 반환합니다.
</Note>

## 모델

`cron add|edit --model <ref>`은 작업에 허용된 모델을 선택합니다. `cron add|edit --fallbacks <list>`은 작업별 대체 모델을 설정합니다(예: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`). 대체 모델이 없는 엄격한 실행에는 `--fallbacks ""`을 전달하십시오. `cron edit <job-id> --clear-fallbacks`은 작업별 대체 모델 재정의를 제거합니다. `cron edit <job-id> --clear-model`은 작업별 모델 재정의를 제거하여 작업이 일반적인 Cron 모델 선택 우선순위(저장된 Cron 세션 재정의가 있으면 이를 사용하고, 그렇지 않으면 에이전트/기본 모델 사용)를 따르게 합니다. 이 옵션은 `--model`과 함께 사용할 수 없습니다. `cron add|edit --thinking <level>`은 작업별 사고 재정의를 설정합니다. `cron edit <job-id> --clear-thinking`은 이를 제거하여 작업이 일반적인 Cron 사고 우선순위를 따르게 하며, `--thinking`과 함께 사용할 수 없습니다.

<Warning>
모델이 허용되지 않거나 해석할 수 없으면 Cron은 작업의 에이전트 또는 기본 모델 선택으로 대체하지 않고 명시적인 검증 오류로 실행을 실패 처리합니다.
</Warning>

Cron `--model`은 채팅 세션의 `/model` 재정의가 아니라 **작업 기본 모델**입니다. 즉, 다음과 같이 동작합니다.

- 선택한 작업 모델이 실패해도 구성된 모델 대체 항목이 계속 적용됩니다.
- 작업별 페이로드 `fallbacks`이 있으면 구성된 대체 목록을 대체합니다.
- 빈 작업별 대체 목록(작업 페이로드/API의 `--fallbacks ""` 또는 `fallbacks: []`)은 Cron 실행을 엄격 모드로 설정합니다.
- 작업에 `--model`이 있지만 대체 목록이 구성되지 않은 경우, OpenClaw는 에이전트 기본 모델이 숨겨진 재시도 대상으로 추가되지 않도록 명시적인 빈 대체 재정의를 전달합니다.
- 로컬 공급자 사전 점검은 Cron 실행을 `skipped`으로 표시하기 전에 구성된 대체 항목을 순회합니다.

`openclaw doctor`은 공급자 네임스페이스 수와 `agents.defaults.model`과의 불일치를 포함하여 이미 `payload.model`이 설정된 작업을 보고합니다. 실시간 채팅과 예약 작업 간에 인증, 공급자 또는 청구 동작이 다르게 보일 때 이 검사를 사용하십시오.

### 격리된 Cron 모델 우선순위

격리된 Cron은 다음 순서로 활성 모델을 해석합니다.

1. Gmail 훅 재정의.
2. 작업별 `--model`.
3. 저장된 Cron 세션 모델 재정의(사용자가 선택한 경우).
4. 에이전트 또는 기본 모델 선택.

### 빠른 모드

격리된 Cron 빠른 모드는 해석된 라이브 모델 선택을 따릅니다. 모델 구성 `params.fastMode`이 기본적으로 적용되지만, 저장된 세션의 `fastMode` 재정의가 여전히 구성보다 우선합니다. 해석된 모드가 `auto`이면 제한 시간은 선택된 모델의 `params.fastAutoOnSeconds` 값을 사용하며, 기본값은 60초입니다.

### 라이브 모델 전환 재시도

격리된 실행에서 `LiveSessionModelSwitchError`이 발생하면 Cron은 재시도하기 전에 활성 실행에 대해 전환된 제공자와 모델을 저장하고, 전환된 인증 프로필 재정의가 있으면 함께 저장합니다. 외부 재시도 루프는 최초 시도 후 전환 재시도를 두 번으로 제한하며, 이후에는 무한 반복하지 않고 중단합니다.

## 실행 출력 및 거부

### 오래된 확인 응답 억제

격리된 Cron 턴은 오래된 확인 전용 응답을 억제합니다. 첫 번째 결과가 단순한 중간 상태 업데이트이고 최종 답변을 담당하는 하위 서브에이전트 실행이 없으면, Cron은 전달 전에 실제 결과를 얻기 위해 한 번 다시 프롬프트합니다.

### 무응답 토큰 억제

격리된 Cron 실행이 무응답 토큰(`NO_REPLY` 또는 `no_reply`)만 반환하면, Cron은 직접 아웃바운드 전달과 대체 대기열 요약 경로를 모두 억제하므로 채팅에 아무것도 게시되지 않습니다.

### 구조화된 거부

격리된 Cron 실행은 내장 실행에서 제공하는 구조화된 실행 거부 메타데이터(코드가 `SYSTEM_RUN_DENIED` 또는 `INVALID_REQUEST`인 치명적 실행 도구 오류)를 권위 있는 거부 신호로 사용합니다. 또한 해당 코드 중 하나를 포함하는 중첩된 구조화 오류를 감싸는 Node 호스트 `UNAVAILABLE` 래퍼도 인식합니다.

내장 실행이 구조화된 거부 메타데이터도 제공하지 않는 한, Cron은 최종 출력의 문구나 승인 거부처럼 보이는 표현을 거부로 분류하지 않습니다. 따라서 일반적인 어시스턴트 텍스트가 차단된 명령으로 처리되지 않습니다.

`cron list` 및 실행 기록에는 차단된 명령을 `ok`로 보고하는 대신 거부 사유가 표시됩니다.

## 보존

보존 동작:

- `cron.sessionRetention`(기본값 `24h`, 비활성화하려면 `false`)은 완료된 격리 실행 세션을 정리합니다.
- 실행 기록은 Cron 작업별로 최신 터미널 행 2000개를 유지합니다. 유실된 행에는 표준 24시간 유실 작업 정리 기간이 유지됩니다.

## 이전 작업 마이그레이션

<Note>
현재 전달 및 저장 형식 이전에 만든 Cron 작업이 있다면 `openclaw doctor --fix`을 실행하십시오. Doctor는 레거시 Cron 필드(`jobId`, `schedule.cron`, 레거시 `threadId`을 포함한 최상위 전달 필드, 페이로드 `provider` 전달 별칭)를 정규화하고, `notify: true` Webhook 대체 작업을 `cron.webhook`에서 명시적 Webhook 전달로 마이그레이션합니다. 이미 채팅에 알림을 보내는 작업은 해당 전달을 유지하며 완료 Webhook 대상을 추가로 받습니다. `cron.webhook`이 설정되지 않은 경우, 마이그레이션 대상이 없는 작업에서는 비활성 상태인 최상위 `notify` 표시가 제거되며 기존 전달은 변경 없이 유지됩니다. 따라서 `doctor --fix`이 더 이상 해당 작업에 대해 반복해서 경고하지 않습니다.
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
  "야간 업데이트를 요약하십시오." \
  --name "경량 아침 브리핑" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context`은 격리된 에이전트 턴 작업에만 적용됩니다. Cron 실행에서 경량 모드는 전체 워크스페이스 부트스트랩 세트를 주입하는 대신 부트스트랩 컨텍스트를 비워 둡니다.

정확한 argv, cwd, env, stdin 및 출력 제한을 사용하는 명령 작업을 생성합니다.

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

`openclaw cron list`은 기본적으로 일치하는 모든 작업을 표시합니다. 유효하게 정규화된 에이전트 ID가 일치하는 작업만 표시하려면 `--agent <id>`을 전달하십시오. 저장된 에이전트 ID가 없는 작업은 구성된 기본 에이전트를 사용하는 것으로 간주됩니다.

`openclaw cron get <job-id>`은 저장된 작업 JSON을 직접 반환합니다. 전달 경로 미리보기가 포함된 사람이 읽기 쉬운 보기가 필요하면 `cron show <job-id>`을 사용하십시오.

`cron list --json` 및 `cron show <job-id> --json`은 각 작업에 `enabled`, `state.runningAtMs`, `state.lastRunStatus`을 기반으로 계산된 최상위 `status` 필드를 포함합니다. 값은 `disabled`, `running`, `ok`, `error`, `skipped` 또는 `idle`입니다. 외부 도구가 작업 상태를 다시 계산하지 않고 읽을 수 있도록 JSON 상태는 표준 형식 그대로 꾸밈 없이 유지됩니다. 사람이 읽는 출력에서는 반복되는 `error` 상태에 실패 횟수를 표시할 수 있습니다.

`cron runs` 항목에는 의도된 Cron 대상, 해석된 대상, 메시지 도구 전송, 대체 경로 사용 및 전달 상태에 대한 전달 진단이 포함됩니다.

에이전트 및 세션 대상 재지정:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`은 에이전트 턴 작업에서 `--agent`이 생략되면 경고하고 기본 에이전트(`main`)를 사용합니다. 특정 에이전트를 고정하려면 생성 시 `--agent <id>`을 전달하십시오.

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
