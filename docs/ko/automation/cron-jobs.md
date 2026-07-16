---
read_when:
    - 백그라운드 작업 또는 깨우기 예약하기
    - 외부 트리거(Webhook, Gmail)를 OpenClaw에 연결하기
    - 예약 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Scheduled tasks
summary: Gateway 스케줄러를 위한 예약 작업, Webhook 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-07-16T12:14:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 영구 저장하고, 적절한 시점에 에이전트를 깨우며, 출력을 채팅 채널이나 Webhook으로 전달하거나 어디에도 전달하지 않을 수 있습니다.

## 빠른 시작

<Steps>
  <Step title="일회성 알림 추가">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "알림" \
      --session main \
      --system-event "알림: Cron 문서 초안을 확인하십시오" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="작업 확인">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="실행 기록 확인">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 작동 방식

- Cron은 모델 내부가 아니라 **Gateway 프로세스 내부에서** 실행됩니다. 일정이 실행되려면 Gateway가 실행 중이어야 합니다.
- 작업 정의, 런타임 상태, 실행 기록은 OpenClaw의 공유 SQLite 상태 데이터베이스에 영구 저장되므로 다시 시작해도 일정이 유실되지 않습니다.
- Cron이 실행될 때마다 [백그라운드 작업](/ko/automation/tasks) 레코드가 생성됩니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다. 유지하려면 `--keep-after-run`을 전달하십시오.
- 실행별 실제 경과 시간 예산: 설정된 경우 `--timeout-seconds`입니다. 그렇지 않으면 격리된/분리된 에이전트 턴 작업에는 기본 에이전트 턴 시간 제한(`agents.defaults.timeoutSeconds`, 기본값 48시간)이 적용되기 전에 Cron 자체의 60분 감시 제한이 적용되며, 명령 작업의 기본값은 10분입니다.
- Gateway가 시작될 때 기한이 지난 격리형 에이전트 턴 작업은 즉시 재실행되는 대신 일정이 다시 예약되므로, 모델/도구 부트스트랩 작업이 채널 연결 시간대에 수행되지 않습니다.
- 시스템 Cron이나 다른 외부 스케줄러에서 `openclaw agent`을 실행하는 경우, CLI가 이미 `SIGTERM`/`SIGINT`을 처리하더라도 강제 종료 단계로 래핑하십시오. Gateway 기반 실행은 Gateway에 수락된 실행을 중단하도록 요청하며, 로컬 및 임베디드 대체 실행에도 동일한 중단 신호가 전달됩니다. GNU `timeout`에서는 일반 `timeout 600 ...`보다 `timeout -k 60 600 openclaw agent ...`을 사용하는 것이 좋습니다. `-k` 값은 프로세스가 제시간에 종료되지 못할 경우의 최후 안전장치입니다. systemd 유닛에서는 최종 강제 종료 전에 유예 시간(`TimeoutStopSec`)과 함께 `SIGTERM` 중지 신호를 사용하십시오. 원래 Gateway 실행이 아직 활성 상태일 때 `--run-id`을 재사용하면 두 번째 실행을 시작하는 대신 중복 실행이 진행 중인 것으로 보고됩니다.

<AccordionGroup>
  <Accordion title="격리 실행 강화">
    - 격리 실행은 완료 시 해당 `cron:<jobId>` 세션에서 추적되는 브라우저 탭/프로세스를 최선의 노력으로 닫고, 기본 세션 및 사용자 지정 세션 실행에서 사용하는 것과 동일한 공유 해제 경로를 통해 작업용으로 생성된 모든 번들 MCP 런타임 인스턴스를 폐기합니다. 정리 실패는 무시되므로 Cron 결과가 계속 우선합니다.
    - 제한된 Cron 자체 정리 권한이 있는 격리 실행은 스케줄러 상태, 자체 작업만 포함하도록 필터링된 목록, 해당 작업의 실행 기록을 읽을 수 있으며, 자체 작업만 제거할 수 있습니다.
    - 격리 실행은 오래된 확인 응답을 방지합니다. 첫 번째 결과가 임시 상태 업데이트(`on it`, `pulling everything together` 및 유사한 안내)에 불과하고 최종 답변을 담당하는 하위 에이전트가 더 이상 없다면, OpenClaw는 전달 전에 실제 결과를 한 번 다시 요청합니다.
    - 구조화된 실행 거부 메타데이터(중첩 오류가 `SYSTEM_RUN_DENIED` 또는 `INVALID_REQUEST`으로 시작하는 Node 호스트 `UNAVAILABLE` 래퍼 포함)를 인식하므로 차단된 명령이 성공한 실행으로 보고되지 않으며, 일반적인 어시스턴트 문구가 거부로 잘못 인식되지 않습니다.
    - 응답 페이로드가 없더라도 실행 수준의 에이전트 실패는 작업 오류로 계산되므로, 모델/제공자 실패 시 오류 카운터가 증가하고 작업을 성공으로 처리하는 대신 실패 알림이 트리거됩니다.
    - 작업이 `timeoutSeconds`에 도달하면 Cron은 실행을 중단하고 짧은 정리 시간을 부여합니다. 해당 시간 안에 종료되지 않으면 Gateway 소유 정리 작업이 Cron에서 시간 초과를 기록하기 전에 해당 실행의 세션 소유권을 강제로 해제하므로, 대기 중인 채팅 작업이 오래된 처리 세션 뒤에서 멈추지 않습니다.
    - 설정/시작 중 멈춤에는 단계별 시간 제한(예: `cron: isolated agent setup timed out before runner start` 또는 `cron: isolated agent run stalled before execution start (last phase: context-engine)`)이 적용됩니다. 이러한 감시 제한은 외부 CLI 프로세스가 시작되기 전에도 임베디드 및 CLI 기반 제공자에 적용되며, 긴 `timeoutSeconds` 값과 별도로 제한되므로 콜드 스타트/인증/컨텍스트 실패가 빠르게 드러납니다.

  </Accordion>
  <Accordion title="작업 조정">
    Cron 작업 조정은 먼저 런타임 소유권을, 그다음 영구 기록을 기준으로 합니다. 이전 하위 세션 행이 여전히 존재하더라도 Cron 런타임이 해당 작업을 실행 중인 것으로 계속 추적하는 동안에는 활성 Cron 작업이 유지됩니다. 런타임이 작업 소유를 중단하고 5분의 유예 시간이 지나면 유지 관리 검사가 일치하는 `cron:<jobId>:<startedAt>` 실행의 영구 실행 로그와 작업 상태를 확인합니다. 여기에 최종 결과가 있으면 작업 원장이 완료 처리되고, 그렇지 않으면 Gateway 소유 유지 관리 작업이 해당 작업을 `lost`으로 표시할 수 있습니다. 오프라인 CLI 감사는 영구 기록에서 복구할 수 있지만, 자체 인프로세스 활성 작업 집합이 비어 있다는 사실만으로 Gateway 소유 실행이 사라졌다고 입증할 수는 없습니다.
  </Accordion>
</AccordionGroup>

## 일정 유형

| 종류      | CLI 플래그    | 설명                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 일회성 타임스탬프(ISO 8601 또는 `20m` 같은 상대 시간)                                                     |
| `every`   | `--every`   | 고정 간격(`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | 선택적 `--tz`이 포함된 5필드 또는 6필드 Cron 표현식                                                  |
| `on-exit` | `--on-exit` | 감시 중인 명령이 종료될 때 한 번 실행(이벤트 트리거, 턴 해제 후에도 유지, 선택적 `--on-exit-cwd`) |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 오프셋이 없는 `--at` 날짜 및 시간을 해당 IANA 시간대로 해석하거나 Cron 표현식을 해당 시간대에서 평가하려면 `--tz America/New_York`을 추가하십시오. `--tz`이 없는 Cron 표현식은 Gateway 호스트의 시간대를 사용합니다. `--tz`은 `--every` 또는 `--on-exit`과 함께 사용할 수 없습니다.

매시 정각에 반복되는 표현식(분 필드가 `0`이고 시간 필드가 와일드카드인 경우)은 부하 급증을 줄이기 위해 최대 5분까지 자동으로 분산됩니다. 정확한 시각을 강제하려면 `--exact`을 사용하고, 명시적인 시간 범위를 지정하려면 `--stagger 30s`을 사용하십시오(Cron 일정에만 해당).

### 일과 요일에는 OR 논리가 적용됩니다

Cron 표현식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. 일 필드와 요일 필드가 모두 와일드카드가 아닌 경우, croner는 두 필드 모두가 아니라 **둘 중 하나**가 일치할 때 조건이 충족된 것으로 판단합니다. 이는 표준 Vixie Cron 동작입니다.

```bash
# 의도: "월요일인 경우에만 15일 오전 9시"
# 실제: "매월 15일 오전 9시, 그리고 매주 월요일 오전 9시"
0 9 15 * 1
```

따라서 한 달에 0~1번이 아니라 약 5~6번 실행됩니다. 두 조건을 모두 요구하려면 croner의 `+` 요일 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드로 일정을 지정한 후 작업 프롬프트 또는 명령에서 다른 필드를 검사하십시오.

## 이벤트 트리거(조건 감시기)

이벤트 트리거는 `every` 또는 `cron` 일정에 헤드리스 조건 스크립트를 추가합니다. Cron은 작업 실행 시점에 스크립트를 평가하며, 스크립트가 `fire: true`을 반환할 때만 일반 페이로드를 실행합니다.

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // 관찰된 상태가 이전 평가와 다를 때만 실행합니다.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "CI 상태 변경을 조사하십시오." },
}
```

스크립트는 `{ fire, message?, state? }`을 반환해야 합니다. 이전 JSON 상태는 깊이 동결된 `trigger.state`으로 사용할 수 있습니다. 새 `state` 값을 반환하면 영구 저장됩니다. 상태 크기는 16 KB로 제한됩니다. 실행 결과에 `message`이 포함되면 Cron은 실행 전에 이를 시스템 이벤트 텍스트 또는 에이전트 턴 메시지에 추가합니다. `once: true`은 처음으로 성공한 페이로드가 실행된 후 작업을 비활성화합니다.

`fire: false`은 평가 상태와 카운터를 영구 저장한 후 실행 기록을 생성하지 않고 일정을 다시 예약합니다. 실행된 페이로드가 실패하면 반환된 `state`은 영구 저장되지 **않습니다**. 다음 평가에서는 이전 상태를 확인하고 다시 실행할 수 있으므로, 스크립트는 읽기 전용 검사로 작성하고 동작은 페이로드에 포함하십시오. 트리거 일정에는 설정 가능한 최소 간격이 있습니다(기본값 30초). 각 평가에는 30초의 실제 경과 시간 예산과 최대 5회의 도구 호출이 허용됩니다.

<Warning>
`cron.triggers.enabled`을 활성화하면 에이전트가 작성한 스크립트가 소유 에이전트의 **`exec`을 포함한 전체 도구 정책**으로 헤드리스 실행될 수 있습니다. 이를 해당 에이전트의 권한으로 수행되는 무인 코드 실행으로 취급하십시오. Cron 작업을 생성하도록 허용된 모든 에이전트를 그에 맞게 신뢰할 수 있는 경우가 아니라면 비활성화된 상태로 두십시오.
</Warning>

로컬 스크립트 파일에서 감시기를 생성합니다(`-`은 stdin에서 스크립트를 읽습니다).

```bash
openclaw cron add \
  --name "PR CI 감시기" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "CI 상태 변경에 대응하십시오" \
  --session isolated
```

## 페이로드

각 작업에는 플래그로 선택한 정확히 하나의 페이로드 종류가 포함됩니다.

| 페이로드       | 플래그                                           | 실행 방식                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 시스템 이벤트  | `--system-event <text>`                        | 기본 세션의 대기열에 추가되며, 자체적으로 모델을 호출하지 않음 |
| 에이전트 메시지 | `--message <text>`                             | 모델 기반 에이전트 턴                               |
| 명령       | `--command <shell>` 또는 `--command-argv <json>` | Gateway 호스트의 셸/프로세스이며, 모델을 호출하지 않음      |

### 에이전트 턴 옵션

<ParamField path="--message" type="string" required>
  프롬프트 텍스트(격리/현재/사용자 지정 세션 작업에 필수).
</ParamField>
<ParamField path="--model" type="string">
  모델 재정의입니다. 허용된 모델로 확인되어야 하며, 그렇지 않으면 실행이 유효성 검사 오류로 실패합니다.
</ParamField>
<ParamField path="--fallbacks" type="string">
  작업별 대체 모델 목록입니다(예: `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`). 대체 모델 없이 엄격하게 실행하려면 `--fallbacks ""`을 전달하십시오.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit`에서 작업이 구성된 대체 모델 우선순위를 따르도록 작업별 대체 모델 재정의를 제거합니다. `--fallbacks`과 함께 사용할 수 없습니다.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit`에서 작업이 일반 Cron 모델 우선순위(저장된 Cron 세션 재정의, 없으면 에이전트/기본 모델)를 따르도록 작업별 모델 재정의를 제거합니다. `--model`과 함께 사용할 수 없습니다.
</ParamField>
<ParamField path="--thinking" type="string">
  사고 수준 재정의(`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`)입니다. 사용 가능한 수준은 여전히 선택한 모델과 에이전트 런타임에 따라 달라집니다.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit`에서 작업별 사고 수준 재정의를 제거합니다. `--thinking`과 함께 사용할 수 없습니다.
</ParamField>
<ParamField path="--light-context" type="boolean">
  워크스페이스 부트스트랩 파일 삽입을 건너뜁니다.
</ParamField>
<ParamField path="--tools" type="string">
  작업에서 사용할 수 있는 도구를 제한합니다(예: `--tools exec,read`).
</ParamField>

`--model`은 작업의 기본 모델을 설정하지만 세션 `/model` 재정의를 대체하지 않으므로, 구성된 대체 모델 체인이 그 위에 계속 적용됩니다. 확인할 수 없거나 허용되지 않은 모델은 기본값으로 자동 대체되지 않고 명시적인 유효성 검사 오류와 함께 실행에 실패합니다. 작업에 `--model`이 있지만 명시적이거나 구성된 대체 모델 목록이 없으면, OpenClaw는 에이전트 기본 모델을 숨겨진 재시도 대상으로 자동 추가하지 않고 빈 대체 모델 재정의를 전달합니다.

격리 작업의 모델 선택 우선순위는 높은 순서대로 다음과 같습니다.

1. 작업별 페이로드 `model`(명시적 구성, 허용되지 않은 모델이면 실행 실패)
2. Gmail 훅 모델 재정의(실행이 Gmail에서 시작되었으며 해당 재정의가 허용된 경우에만 해당)
3. 사용자가 선택하여 저장된 Cron 세션 모델 재정의
4. 에이전트/기본 모델 선택

고속 모드는 확인된 라이브 선택을 따릅니다. 선택한 모델 구성에 `params.fastMode`이 있으면 격리 Cron은 이를 기본적으로 사용하지만, 저장된 세션 `fastMode` 재정의(그다음 에이전트 `fastModeDefault`)가 어느 방향으로든 모델 구성보다 계속 우선합니다. 자동 모드는 모델의 `params.fastAutoOnSeconds` 기준값을 사용하며 기본값은 60초입니다.

실행 중 라이브 모델 전환 인계가 발생하면 Cron은 전환된 제공자/모델로 재시도하고 해당 선택(및 모든 새 인증 프로필)을 활성 실행에 유지합니다. 재시도 횟수는 제한됩니다. 최초 시도 후 2회의 전환 재시도를 마치면 Cron은 반복하지 않고 중단합니다.

격리 실행을 시작하기 전에 OpenClaw는 구성된 `api: "ollama"` 및 `api: "openai-completions"` 제공자 중 `baseUrl`이 루프백, 사설 네트워크 또는 `.local`인 경우 연결 가능한 로컬 엔드포인트를 확인합니다. 이 사전 점검은 작업에 구성된 대체 모델 체인을 순회하며 모든 후보에 연결할 수 없을 때만 실행을 `skipped`으로 표시합니다. `--fallbacks ""`은 이 순회를 기본 모델로만 엄격하게 제한합니다. 엔드포인트가 중단된 경우 모델 호출을 시작하지 않고 명확한 오류와 함께 실행을 `skipped`으로 기록합니다. 결과는 작업이나 모델별이 아닌 엔드포인트별로 5분 동안 캐시되므로, 중단된 동일한 로컬 Ollama/vLLM/SGLang/LM Studio 서버를 공유하는 다수의 예정 작업은 요청 폭주 대신 한 번만 점검합니다. 사전 점검으로 건너뛴 실행은 실행 오류 백오프를 증가시키지 않습니다. 반복적인 건너뛰기 알림을 받으려면 `failureAlert.includeSkipped`을 설정하십시오.

### 명령 페이로드

명령 페이로드는 모델 기반 턴을 시작하지 않고 Gateway 스케줄러 내부에서 결정론적 스크립트를 실행합니다. Gateway 호스트에서 실행되고 stdout/stderr를 캡처하며, Cron 기록에 실행을 기록하고 에이전트 턴 작업과 동일한 `announce`, `webhook`, `none` 전송 모드를 재사용합니다.

<Note>
명령 Cron은 운영자 관리자용 Gateway 자동화 표면이며 에이전트 `tools.exec` 호출이 아닙니다. Cron 작업을 생성, 업데이트, 제거하거나 수동으로 실행하려면 `operator.admin`이 필요합니다. 이후 예약된 명령 실행은 관리자가 작성한 자동화로서 Gateway 프로세스 내부에서 실행됩니다. 에이전트 실행 정책(`tools.exec.mode`, 승인 프롬프트, 에이전트별 도구 허용 목록)은 명령 Cron 페이로드가 아니라 모델에 노출되는 실행 도구를 제어합니다.
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

`--command <shell>`은 `argv: ["sh", "-lc", <shell>]`을 저장합니다. 셸 구문 분석 없이 정확한 argv를 실행하려면 `--command-argv '["node","scripts/report.mjs"]'`을 사용하십시오. 선택 사항인 `--command-env KEY=VALUE`(반복 가능), `--command-input`, `--timeout-seconds`(기본값 10분), `--no-output-timeout-seconds`, `--output-max-bytes`은 프로세스 환경, stdin 및 출력 한도를 제어합니다.

전송되는 텍스트는 프로세스 출력에서 파생됩니다. 비어 있지 않은 stdout이 우선하며, stdout이 비어 있고 stderr가 비어 있지 않으면 stderr가 전송됩니다. 둘 다 있으면 Cron은 작은 `stdout:` / `stderr:` 블록을 보냅니다. 종료 코드 `0`은 실행을 `ok`로 기록합니다. 0이 아닌 종료 코드, 신호, 시간 초과 또는 출력 없음 시간 초과는 `error`로 기록되며 실패 알림을 트리거할 수 있습니다. `NO_REPLY`만 출력하는 명령에는 일반 Cron 무음 토큰 억제가 적용되어 채팅에 아무것도 게시되지 않습니다.

## 실행 방식

| 방식           | `--session` 값   | 실행 위치                  | 적합한 용도                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 기본 세션    | `main`              | 전용 Cron 깨우기 레인 | 미리 알림, 시스템 이벤트        |
| 격리        | `isolated`          | 전용 `cron:<jobId>` | 보고서, 백그라운드 작업      |
| 현재 세션 | `current`           | 생성 시점에 바인딩   | 컨텍스트 인식 반복 작업    |
| 사용자 지정 세션  | `session:custom-id` | 지속되는 명명 세션 | 기록을 기반으로 이어지는 워크플로 |

<AccordionGroup>
  <Accordion title="기본 세션과 격리 세션 및 사용자 지정 세션 비교">
    **기본 세션** 작업은 Cron이 소유한 실행 레인에 시스템 이벤트를 대기열로 추가하고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). 응답에 대상 기본 세션의 마지막 전송 컨텍스트를 사용할 수 있지만, 일상적인 Cron 턴을 사람의 채팅 레인에 추가하지 않으며 대상 세션의 일별/유휴 초기화 최신 상태를 연장하지 않습니다. **격리** 작업은 새로운 세션으로 전용 에이전트 턴을 실행합니다. **사용자 지정 세션**(`session:xxx`)은 실행 간에 컨텍스트를 유지하여 이전 요약을 기반으로 이어지는 일일 스탠드업 같은 워크플로를 지원합니다.

    기본 세션 Cron 이벤트는 자체적으로 완결된 시스템 이벤트 미리 알림입니다. 기본 Heartbeat 프롬프트의 "HEARTBEAT.md 읽기" 지침을 자동으로 포함하지 않습니다. 미리 알림에서 `HEARTBEAT.md`을 참조해야 한다면 Cron 이벤트 텍스트에 이를 명시하십시오.

  </Accordion>
  <Accordion title="격리 작업에서 '새 세션'의 의미">
    실행마다 새 트랜스크립트/세션 ID가 생성됩니다. OpenClaw는 안전한 기본 설정(사고/고속/상세 출력 설정, 레이블, 사용자가 명시적으로 선택한 모델/인증 재정의)을 유지하지만, 이전 Cron 행의 주변 대화 컨텍스트인 채널/그룹 라우팅, 전송 또는 대기열 정책, 권한 상승, 출처 또는 ACP 런타임 바인딩은 상속하지 않습니다. 반복 작업에서 의도적으로 동일한 대화 컨텍스트를 기반으로 이어가야 한다면 `current` 또는 `session:<id>`을 사용하십시오.
  </Accordion>
  <Accordion title="하위 에이전트 및 Discord 전송">
    격리 Cron 실행이 하위 에이전트를 조정할 때는 오래된 상위 에이전트의 중간 텍스트보다 최종 하위 에이전트 출력을 우선하여 전송합니다. 하위 에이전트가 계속 실행 중이면 OpenClaw는 해당 부분적인 상위 에이전트 업데이트를 알리지 않고 억제합니다.

    텍스트 전용 Discord 공지 대상에는 OpenClaw가 스트리밍/중간 텍스트와 최종 답변을 모두 재생하지 않고 정규화된 최종 어시스턴트 텍스트를 한 번만 보냅니다. 미디어 및 구조화된 Discord 페이로드는 첨부 파일과 구성 요소가 누락되지 않도록 계속 별도로 전송됩니다.

  </Accordion>
</AccordionGroup>

## 전송 및 출력

| 모드       | 동작                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 에이전트가 전송하지 않은 경우 최종 텍스트를 대상으로 대체 전송합니다 |
| `webhook`  | 완료된 이벤트 페이로드를 URL로 POST합니다                                |
| `none`     | 실행기의 대체 전송이 없습니다                                         |

채널 전송에는 `--announce --channel telegram --to "-1001234567890"`을 사용하십시오. Telegram 포럼 주제에는 `-1001234567890:topic:123`을 사용하십시오. OpenClaw는 Telegram이 소유한 `-1001234567890:123` 단축 표기도 허용합니다. 직접 RPC/구성 호출자는 `delivery.threadId`을 문자열 또는 숫자로 전달할 수 있습니다. Slack/Discord/Mattermost 대상은 명시적인 접두사(`channel:<id>`, `user:<id>`)를 사용합니다. Matrix 방 ID는 대소문자를 구분합니다. 정확한 방 ID 또는 Matrix의 `room:!room:server` 형식을 사용하십시오.

공지 전송에서 `channel: "last"`을 사용하거나 `channel`을 생략하면, Cron이 세션 기록이나 구성된 단일 채널로 대체하기 전에 `telegram:123`과 같이 제공자 접두사가 붙은 대상이 채널을 선택할 수 있습니다. 로드된 Plugin에서 알리는 접두사만 제공자 선택자입니다. `delivery.channel`이 명시된 경우 대상 접두사는 동일한 제공자를 지정해야 합니다. `channel: "whatsapp"`과 `to: "telegram:123"`의 조합은 WhatsApp이 Telegram ID를 전화번호로 해석하도록 두지 않고 거부됩니다. 대상 종류 및 서비스 접두사(`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`)는 제공자 선택자가 아니라 채널이 소유한 대상 구문으로 유지됩니다.

격리 작업에서는 채팅 전송이 공유됩니다. 채팅 경로를 사용할 수 있으면 에이전트는 `--no-deliver`인 경우에도 `message` 도구를 사용할 수 있습니다. 에이전트가 구성된/현재 대상으로 전송하면 OpenClaw는 대체 공지를 건너뜁니다. 그렇지 않으면 `announce`, `webhook`, `none`은 에이전트 턴 후 실행기가 최종 응답을 처리하는 방식만 제어합니다.

에이전트가 활성 채팅에서 격리 미리 알림을 생성하면 OpenClaw는 보존된 라이브 전송 대상을 대체 공지 경로로 저장합니다. 내부 세션 키는 소문자일 수 있습니다. 현재 채팅 컨텍스트를 사용할 수 있으면 해당 키에서 제공자 전송 대상을 재구성하지 않습니다.

암시적 공지 전송은 구성된 채널 허용 목록을 사용하여 오래된 대상을 검증하고 경로를 변경합니다. DM 페어링 저장소 승인은 대체 자동화 수신자가 아닙니다. 예약 작업에서 DM으로 선제적으로 전송해야 한다면 `delivery.to`을 설정하거나 채널 `allowFrom` 항목을 구성하십시오.

### 실패 알림

실패 알림은 별도의 대상 경로를 따릅니다:

- `cron.failureDestination`은 실패 알림의 전역 기본값을 설정합니다.
- `job.delivery.failureDestination`은 작업별로 이를 재정의합니다.
- 둘 다 설정되지 않았고 작업이 이미 `announce`을 통해 전달되는 경우, 실패 알림은 해당 기본 알림 대상으로 대체됩니다.
- `delivery.failureDestination`은 기본 전달 모드가 `webhook`인 경우를 제외하면 `sessionTarget="isolated"` 작업에서만 지원됩니다.
- `failureAlert.includeSkipped: true`은 작업 또는 전역 Cron 알림 정책에서 건너뛴 실행에 대한 반복 알림을 사용하도록 설정합니다. 건너뛴 실행은 별도의 연속 건너뛰기 카운터를 유지하므로 실행 오류 백오프에 영향을 주지 않습니다.
- `openclaw cron edit`은 작업별 알림 조정 항목인 `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode`, `--failure-alert-account-id`을 제공합니다.

### 출력 언어

Cron 작업은 채널, 로캘 또는 이전 메시지에서 응답 언어를 추론하지 않습니다. 예약된 메시지나 템플릿에 언어 규칙을 넣으십시오.

```bash
openclaw cron edit <jobId> \
  --message "업데이트를 요약하십시오. 중국어로 응답하고 URL, 코드 및 제품 이름은 변경하지 마십시오."
```

템플릿 파일에서는 렌더링된 프롬프트에 언어 지침을 유지하고, 작업이 실행되기 전에 `{{language}}` 같은 자리표시자가 채워졌는지 확인하십시오. 출력에 여러 언어가 섞이면 규칙을 명확히 지정하십시오. 예: "서술형 텍스트에는 중국어를 사용하고 기술 용어는 영어로 유지하십시오."

## CLI 예시

<Tabs>
  <Tab title="일회성 알림">
    ```bash
    openclaw cron add \
      --name "캘린더 확인" \
      --at "20m" \
      --session main \
      --system-event "다음 Heartbeat: 캘린더를 확인하십시오." \
      --wake now
    ```
  </Tab>
  <Tab title="반복 격리 작업">
    ```bash
    openclaw cron create "0 7 * * *" \
      "밤사이의 업데이트를 요약하십시오." \
      --name "아침 요약" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="모델 및 사고 재정의">
    ```bash
    openclaw cron add \
      --name "심층 분석" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "프로젝트 진행 상황을 매주 심층 분석하십시오." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook 출력">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "오늘의 배포를 JSON으로 요약하십시오." \
      --name "배포 요약" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="명령 출력">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "대기열 깊이 검사" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## 작업 관리

```bash
# 모든 작업 나열
openclaw cron list

# 저장된 작업 하나를 JSON으로 가져오기
openclaw cron get <jobId>

# 확인된 전달 경로를 포함하여 작업 하나 표시
openclaw cron show <jobId>

# 삭제하지 않고 활성화/비활성화
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# 작업 편집
openclaw cron edit <jobId> --message "업데이트된 프롬프트" --model "opus"

# 지금 작업 강제 실행
openclaw cron run <jobId>

# 지금 작업을 강제 실행하고 최종 상태까지 대기
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 실행 예정인 경우에만 실행
openclaw cron run <jobId> --due

# 실행 기록 보기
openclaw cron runs --id <jobId> --limit 50

# 특정 실행 하나 보기
openclaw cron runs --id <jobId> --run-id <runId>

# 작업 삭제
openclaw cron remove <jobId>

# 에이전트 선택(다중 에이전트 구성)
openclaw cron create "0 6 * * *" "운영 대기열을 확인하십시오" --name "운영 점검" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

세션을 보관하면(Control UI 또는 운영자 관리자 호출자의 `sessions.patch { archived: true }`) 해당 세션에 연결된 활성화 상태의 모든 Cron 작업이 비활성화됩니다. 여기에는 격리된 `cron:<jobId>` 세션, `session:<key>` 대상 또는 전달/깨우기 `sessionKey` 레인이 포함됩니다. 세션을 복원해도 해당 작업은 다시 활성화되지 않습니다. `openclaw cron enable <jobId>`을 사용하십시오. 활성화된 연결 작업이 있는 세션은 Control UI 사이드바에 시계 배지를 표시합니다.

`openclaw cron run <jobId>`은 수동 실행을 대기열에 추가한 후 반환됩니다. 대기열에 추가된 실행이 완료될 때까지 차단해야 하는 종료 후크, 유지보수 스크립트 또는 기타 자동화에는 `--wait`을 사용하십시오. 이 기능은 반환된 `runId`을 폴링하며(기본 제한 시간 `10m`, 폴링 간격 `2s`), 상태가 `ok`이면 `0`로 종료하고, `error`, `skipped` 또는 대기 제한 시간이 초과되면 0이 아닌 값으로 종료합니다.

에이전트 `cron` 도구는 `cron(action: "list")`에서 간결한 작업 요약(`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`)을 반환합니다. 전체 작업 정의 하나를 가져오려면 `cron(action: "get", jobId: "...")`을 사용하십시오. Gateway 직접 호출자는 `cron.list`에 `compact: true`을 전달할 수 있습니다. 이를 생략하면 전달 미리보기가 포함된 전체 응답이 유지됩니다.

`openclaw cron create`은 `openclaw cron add`의 별칭입니다. 새 작업은 위치 기반 일정(`"0 9 * * 1"`, `"every 1h"`, `"20m"` 또는 ISO 타임스탬프) 다음에 위치 기반 에이전트 프롬프트를 사용할 수 있습니다. 완료된 실행 페이로드를 HTTP 엔드포인트에 POST하려면 `cron add|create` 또는 `cron edit`에서 `--webhook <url>`을 사용하십시오. Webhook 전달은 채팅 전달 플래그(`--announce`, `--channel`, `--to`, `--thread-id`, `--account`)와 함께 사용할 수 없습니다. `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id`, `--clear-account`에서는 해당 라우팅 필드를 개별적으로 설정 해제합니다(각각 대응하는 설정 플래그와 함께 사용하면 거부됨). 이는 실행기 대체 전달만 비활성화하는 `--no-deliver`과 다릅니다.

<Note>
모델 재정의 참고 사항:

- `openclaw cron add|edit --model ...`은 작업에서 선택한 모델을 변경합니다.
- 모델이 허용되면 해당 공급자/모델이 정확히 격리된 에이전트 실행에 전달됩니다.
- 허용되지 않거나 확인할 수 없으면 Cron은 명시적인 유효성 검사 오류와 함께 실행을 실패 처리합니다.
- API `cron.update` 페이로드 패치는 저장된 작업 모델 재정의를 지우도록 `model: null`을 설정할 수 있습니다.
- `openclaw cron edit <job-id> --clear-model`은 CLI에서 해당 재정의를 지우며(`model: null` 패치와 동일한 효과), `--model`와 함께 사용할 수 없습니다.
- Cron `--model`은 세션 `/model` 재정의가 아니라 작업 기본 모델이므로 구성된 대체 체인이 계속 적용됩니다.
- `openclaw cron add|edit --fallbacks ...`은 페이로드 `fallbacks`을 설정하여 해당 작업에 구성된 대체 항목을 교체합니다. `--fallbacks ""`은 대체를 비활성화하고 실행을 엄격 모드로 만듭니다. `openclaw cron edit <job-id> --clear-fallbacks`은 작업별 재정의를 지웁니다.
- 명시적이거나 구성된 대체 목록이 없는 일반 `--model`은 에이전트 기본 모델을 묵시적인 추가 재시도 대상으로 사용하지 않습니다.

</Note>

## Webhook

Gateway는 외부 트리거용 HTTP Webhook 엔드포인트를 제공할 수 있습니다. 구성에서 활성화하십시오.

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

모든 요청은 헤더를 통해 후크 토큰을 포함해야 합니다.

- `Authorization: Bearer <token>`(권장)
- `x-openclaw-token: <token>`

쿼리 문자열 토큰은 거부됩니다.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    기본 세션의 시스템 이벤트를 대기열에 추가합니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"새 이메일을 받았습니다","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      이벤트 설명입니다.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 또는 `next-heartbeat`입니다.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    격리된 에이전트 턴을 실행합니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"받은편지함을 요약하십시오","name":"이메일","model":"openai/gpt-5.6-sol"}'
    ```

    필드: `message`(필수), `name`, `agentId`, `sessionKey`(`hooks.allowRequestSessionKey=true` 필요), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="매핑된 후크(POST /hooks/<name>)">
    사용자 지정 후크 이름은 구성의 `hooks.mappings`을 통해 확인됩니다. 매핑은 템플릿 또는 코드 변환을 사용하여 임의의 페이로드를 `wake` 또는 `agent` 작업으로 변환할 수 있습니다.
  </Accordion>
</AccordionGroup>

<Warning>
후크 엔드포인트를 루프백, tailnet 또는 신뢰할 수 있는 역방향 프록시 뒤에 유지하십시오.

- 전용 후크 토큰을 사용하고 Gateway 인증 토큰을 재사용하지 마십시오.
- `hooks.path`을 전용 하위 경로에 유지하십시오. `/`은 거부됩니다.
- `agentId`이 생략된 경우의 기본 에이전트를 포함하여 후크가 대상으로 지정할 수 있는 유효 에이전트를 제한하려면 `hooks.allowedAgentIds`을 설정하십시오.
- 호출자가 세션을 선택해야 하는 경우가 아니라면 `hooks.allowRequestSessionKey=false`을 유지하십시오.
- `hooks.allowRequestSessionKey`을 활성화하는 경우 허용되는 세션 키 형태를 제한하도록 `hooks.allowedSessionKeyPrefixes`도 설정하십시오.
- 후크 페이로드는 기본적으로 안전 경계로 래핑됩니다.

</Warning>

## Gmail PubSub 통합

Google PubSub를 통해 Gmail 받은편지함 트리거를 OpenClaw에 연결합니다.

<Note>
**사전 요구 사항:** `gcloud` CLI, `gog`(gogcli), 활성화된 OpenClaw 후크, 공개 HTTPS 엔드포인트용 Tailscale.
</Note>

### 마법사 설정(권장)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

이 명령은 `hooks.gmail` 구성을 작성하고 Gmail 사전 설정을 활성화하며 푸시 엔드포인트의 기본값을 Tailscale Funnel로 설정합니다(`--tailscale funnel|serve|off`).

<Warning>
Gmail 사전 설정의 메시지별 세션은 대화 컨텍스트를 분리하지만 대상 에이전트의 도구나 작업 공간을 제한하지는 않습니다. `agentId`을 설정하는 사용자 지정 매핑이 없으면 Gmail 후크는 기본 에이전트로 실행됩니다.

신뢰할 수 없는 받은편지함의 경우 후크를 전용 읽기 에이전트로 라우팅하고, 해당 에이전트에 읽기 전용 작업 공간 액세스만 부여하거나 작업 공간 액세스를 부여하지 마십시오. 또한 파일 시스템 쓰기, 셸, 브라우저 및 기타 불필요한 도구를 거부하십시오. 기본 에이전트에 알려야 하는 경우 필요한 에이전트 간 전달만 허용하십시오. [프롬프트 인젝션](/ko/gateway/security#prompt-injection), [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools), [`tools.agentToAgent`](/ko/gateway/config-tools#toolsagenttoagent)을 참조하십시오.
</Warning>

### Gateway 자동 시작

`hooks.enabled=true` 및 `hooks.gmail.account`이 설정되면 Gateway는 부팅 시 `gog gmail watch serve`을 시작하고 감시를 자동으로 갱신합니다. 사용하지 않으려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하십시오.

### 수동 일회성 설정

<Steps>
  <Step title="GCP 프로젝트 선택">
    `gog`에서 사용하는 OAuth 클라이언트를 소유한 GCP 프로젝트를 선택하십시오.

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="주제 생성 및 Gmail 푸시 액세스 권한 부여">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="감시 시작">
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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

신뢰할 수 없는 받은편지함에는 제공업체에서 사용할 수 있는 최신 세대의 최상위 모델을 사용하십시오. 위 값은 예시이며, 모델이 구성된 카탈로그와 허용 목록에 존재해야 합니다.

## 구성

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

위의 `retry` 값은 기본값입니다. `30s/60s/5m` 백오프를 사용해 최대 3회 재시도하며, 일시적인 오류 범주 5개를 모두 재시도합니다. `webhookToken`은(는) Cron Webhook POST에서 `Authorization: Bearer <token>`(으)로 전송됩니다.

`maxConcurrentRuns`은(는) 예약된 Cron 디스패치와 격리된 에이전트 턴 실행을 모두 제한하며, 기본값은 8입니다. 격리된 Cron 에이전트 턴은 내부적으로 큐의 전용 `cron-nested` 실행 레인을 사용하므로, 이 값을 높이면 독립적인 Cron LLM 실행이 외부 Cron 래퍼만 시작하는 대신 병렬로 진행될 수 있습니다. 공유되는 비 Cron `nested` 레인은 이 설정으로 확장되지 않습니다.

`cron.store`은(는) 논리적 저장소 키이자 doctor 마이그레이션 경로이며, 직접 편집할 실제 JSON 파일이 아닙니다. 작업 데이터는 SQLite에 저장됩니다. 변경하려면 CLI 또는 Gateway API를 사용하십시오.

Cron 비활성화: `cron.enabled: false` 또는 `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="재시도 동작">
    **일회성 재시도**: 일시적인 오류(속도 제한, 과부하, 네트워크, 시간 초과, 서버 오류)는 `retry.backoffMs`(기본값 30초, 60초, 5분)을 사용하여 최대 `retry.maxAttempts`회(기본값 3회) 재시도합니다. 영구적인 오류가 발생하면 작업을 즉시 비활성화합니다.

    **반복 재시도**: 연속 실행 오류가 발생하면 확장된 일정(30초, 60초, 5분, 15분, 60분)에 따라 백오프합니다. 다음 실행이 성공하면 백오프가 초기화됩니다.

  </Accordion>
  <Accordion title="유지 관리">
    `cron.sessionRetention`(기본값 `24h`, `false`은(는) 비활성화)은(는) 격리된 실행 세션 항목을 정리합니다. 실행 기록은 작업별로 최신 터미널 행 2000개를 유지하며, 유실된 행에는 24시간 정리 기간이 유지됩니다.
  </Accordion>
  <Accordion title="레거시 저장소 마이그레이션">
    업그레이드 시 `openclaw doctor --fix`을(를) 실행하여 레거시 `~/.openclaw/cron/jobs.json`, `jobs-state.json` 및 `runs/*.jsonl` 파일을 SQLite로 가져오고 `.migrated` 접미사를 붙여 이름을 변경하십시오. 형식이 잘못된 작업 행은 런타임에서 건너뛰고, 나중에 복구하거나 검토할 수 있도록 `jobs-quarantine.json`(으)로 복사됩니다.
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
    - `cron.enabled` 및 `OPENCLAW_SKIP_CRON` 환경 변수를 확인하십시오.
    - Gateway가 계속 실행 중인지 확인하십시오.
    - `cron` 일정의 경우 시간대(`--tz`)와 호스트 시간대를 비교하여 확인하십시오.
    - 실행 출력의 `reason: not-due`은(는) 수동 실행이 `openclaw cron run <jobId> --due`(으)로 확인되었으며 작업의 실행 시점이 아직 되지 않았음을 의미합니다.

  </Accordion>
  <Accordion title="Cron이 실행되었지만 전달되지 않음">
    - 전달 모드가 `none`이면 러너의 대체 전송은 수행되지 않습니다. 채팅 경로를 사용할 수 있는 경우 에이전트는 여전히 `message` 도구를 사용하여 직접 전송할 수 있습니다.
    - 전달 대상 누락/잘못됨(`channel`/`to`)은(는) 아웃바운드 전송을 건너뛰었음을 의미합니다.
    - Matrix의 경우 소문자로 변환된 `delivery.to` 방 ID가 포함된 복사되었거나 레거시인 작업은 Matrix 방 ID가 대소문자를 구분하므로 실패할 수 있습니다. 작업을 Matrix의 정확한 `!room:server` 또는 `room:!room:server` 값으로 편집하십시오.
    - 채널 인증 오류(`unauthorized`, `Forbidden`)는 자격 증명 때문에 전달이 차단되었음을 의미합니다.
    - 격리된 실행이 무응답 토큰(`NO_REPLY` / `no_reply`)만 반환하면 OpenClaw는 직접 아웃바운드 전달과 대체 대기열 요약 경로를 억제하므로 채팅에 아무것도 게시되지 않습니다.
    - 에이전트가 사용자에게 직접 메시지를 보내야 하는 경우 작업에 사용할 수 있는 경로(이전 채팅이 있는 `channel: "last"` 또는 명시적 채널/대상)가 있는지 확인하십시오.

  </Accordion>
  <Accordion title="Cron 또는 Heartbeat가 /new 스타일 롤오버를 방해하는 것으로 보임">
    - 일일 및 유휴 초기화의 최신성은 `updatedAt`을(를) 기준으로 하지 않습니다. [세션 관리](/ko/concepts/session#session-lifecycle)를 참조하십시오.
    - Cron 깨우기, Heartbeat 실행, exec 알림 및 Gateway 부기 작업은 라우팅/상태를 위해 세션 행을 업데이트할 수 있지만, `sessionStartedAt` 또는 `lastInteractionAt`을(를) 연장하지는 않습니다.
    - 해당 필드가 존재하기 전에 생성된 레거시 행의 경우 파일을 계속 사용할 수 있으면 OpenClaw가 트랜스크립트 JSONL 세션 헤더에서 `sessionStartedAt`을(를) 복구할 수 있습니다. `lastInteractionAt`이(가) 없는 레거시 유휴 행은 복구된 시작 시간을 유휴 기준선으로 사용합니다.

  </Accordion>
  <Accordion title="시간대 관련 주의 사항">
    - `--tz`이(가) 없는 Cron은 Gateway 호스트 시간대를 사용합니다.
    - 시간대가 없는 `at` 일정은 UTC로 처리됩니다.
    - Heartbeat `activeHours`은(는) 구성된 시간대 확인 방식을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [자동화](/ko/automation) — 모든 자동화 메커니즘 개요
- [백그라운드 작업](/ko/automation/tasks) — Cron 실행을 위한 작업 원장
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 기본 세션 턴
- [시간대](/ko/concepts/timezone) — 시간대 구성
