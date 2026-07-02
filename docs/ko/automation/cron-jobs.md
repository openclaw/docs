---
read_when:
    - 백그라운드 작업 또는 깨우기 예약
    - OpenClaw에 외부 트리거(Webhook, Gmail) 연결하기
    - 예약 작업에 Heartbeat와 Cron 중 무엇을 사용할지 결정하기
sidebarTitle: Scheduled tasks
summary: Gateway 스케줄러를 위한 예약된 작업, Webhook 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-07-02T00:47:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 지속 저장하고, 적절한 시간에 에이전트를 깨우며, 출력을 채팅 채널이나 Webhook 엔드포인트로 다시 전달할 수 있습니다.

## 빠른 시작

<Steps>
  <Step title="일회성 알림 추가">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
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
  <Step title="실행 기록 보기">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron 작동 방식

- Cron은 **Gateway 내부** 프로세스에서 실행됩니다(모델 내부가 아님).
- 작업 정의, 런타임 상태, 실행 기록은 OpenClaw의 공유 SQLite 상태 데이터베이스에 지속 저장되므로 다시 시작해도 일정이 손실되지 않습니다.
- 업그레이드 시 `openclaw doctor --fix`를 실행하여 레거시 `~/.openclaw/cron/jobs.json`, `jobs-state.json`, `runs/*.jsonl` 파일을 SQLite로 가져오고 `.migrated` 접미사로 이름을 변경합니다. 형식이 잘못된 작업 행은 런타임에서 건너뛰고 나중에 복구하거나 검토할 수 있도록 `jobs-quarantine.json`으로 복사됩니다.
- `cron.store`는 여전히 논리적 cron 저장소 키와 doctor 가져오기 경로의 이름을 지정합니다. 가져온 뒤에는 해당 JSON 파일을 편집해도 활성 cron 작업이 더 이상 변경되지 않습니다. 대신 `openclaw cron add|edit|remove` 또는 Gateway cron RPC 메서드를 사용하세요.
- 모든 cron 실행은 [백그라운드 작업](/ko/automation/tasks) 레코드를 생성합니다.
- Gateway 시작 시, 기한이 지난 격리된 에이전트 턴 작업은 즉시 재생되는 대신 채널 연결 창 밖으로 다시 예약되므로 재시작 후에도 Discord/Telegram 시작 및 네이티브 명령 설정이 응답성을 유지합니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다.
- 격리된 cron 실행은 실행이 완료될 때 해당 `cron:<jobId>` 세션의 추적된 브라우저 탭/프로세스를 최선의 방식으로 닫으므로, 분리된 브라우저 자동화가 고아 프로세스를 남기지 않습니다.
- 좁은 범위의 cron 자체 정리 권한을 받은 격리된 cron 실행은 여전히 스케줄러 상태, 현재 작업의 자체 필터링된 목록, 해당 작업의 실행 기록을 읽을 수 있으므로 상태/Heartbeat 확인이 더 넓은 cron 변경 권한을 얻지 않고도 자체 일정을 검사할 수 있습니다.
- 격리된 cron 실행은 오래된 확인 응답도 방지합니다. 첫 번째 결과가 단순한 중간 상태 업데이트(`on it`, `pulling everything together` 및 유사한 힌트)이고 최종 답변을 담당하는 하위 서브에이전트 실행이 아직 없다면, OpenClaw는 전달 전에 실제 결과를 한 번 다시 요청합니다.
- 격리된 cron 실행은 임베디드 실행의 구조화된 실행 거부 메타데이터를 사용합니다. 여기에는 중첩 오류 메시지가 `SYSTEM_RUN_DENIED` 또는 `INVALID_REQUEST`로 시작하는 node-host `UNAVAILABLE` 래퍼가 포함되므로, 차단된 명령이 성공한 실행으로 보고되지 않고 일반적인 어시스턴트 문장은 거부로 처리되지 않습니다.
- 격리된 cron 실행은 응답 페이로드가 생성되지 않은 경우에도 실행 수준 에이전트 실패를 작업 오류로 처리하므로, 모델/Provider 실패가 작업을 성공으로 정리하는 대신 오류 카운터를 증가시키고 실패 알림을 트리거합니다.
- 격리된 에이전트 턴 작업이 `timeoutSeconds`에 도달하면 cron은 기본 에이전트 실행을 중단하고 짧은 정리 시간을 제공합니다. 실행이 비워지지 않으면 Gateway 소유 정리가 cron이 타임아웃을 기록하기 전에 해당 실행의 세션 소유권을 강제로 해제하므로, 대기 중인 채팅 작업이 오래된 처리 세션 뒤에 남지 않습니다.
- 격리된 에이전트 턴이 러너 시작 전이나 첫 번째 모델 호출 전에 멈추면 cron은 `setup timed out before runner start` 또는 `stalled before first model call (last phase: context-engine)` 같은 단계별 타임아웃을 기록합니다. 이러한 워치독은 외부 CLI 프로세스가 실제로 시작되기 전에 임베디드 Provider와 CLI 기반 Provider를 포괄하며, 긴 `timeoutSeconds` 값과 독립적으로 제한되므로 콜드 스타트/인증/컨텍스트 실패가 전체 작업 예산을 기다리는 대신 빠르게 드러납니다.
- 시스템 cron이나 다른 외부 스케줄러를 사용해 `openclaw agent`를 실행한다면, CLI가 `SIGTERM`/`SIGINT`를 처리하더라도 강제 종료 에스컬레이션으로 감싸세요. Gateway 기반 실행은 Gateway에 승인된 실행 중단을 요청합니다. 로컬 및 임베디드 대체 실행도 동일한 중단 신호를 받습니다. GNU `timeout`의 경우 일반 `timeout 600 ...`보다 `timeout -k 60 600 openclaw agent ...`를 선호하세요. `-k` 값은 프로세스가 비워지지 않을 경우의 감독자 백스톱입니다. systemd 유닛의 경우 최종 강제 종료 전에 `TimeoutStopSec` 같은 유예 창과 함께 `SIGTERM` 중지 신호를 사용하여 같은 형태를 유지하세요. 원래 Gateway 실행이 아직 활성 상태인 동안 재시도가 `--run-id`를 재사용하면, 두 번째 실행을 시작하는 대신 중복 실행이 진행 중으로 보고됩니다.

<a id="maintenance"></a>

<Note>
cron의 작업 조정은 먼저 런타임이 소유하고, 그다음으로 지속 기록이 뒷받침합니다. 활성 cron 작업은 오래된 자식 세션 행이 아직 존재하더라도 cron 런타임이 해당 작업을 실행 중으로 추적하는 동안 계속 활성 상태로 유지됩니다. 런타임이 작업 소유를 중단하고 5분 유예 창이 만료되면, 유지 관리가 일치하는 `cron:<jobId>:<startedAt>` 실행에 대해 지속 저장된 실행 로그와 작업 상태를 확인합니다. 해당 지속 기록에 종료 결과가 표시되면 작업 원장이 그 결과로 확정됩니다. 그렇지 않으면 Gateway 소유 유지 관리가 작업을 `lost`로 표시할 수 있습니다. 오프라인 CLI 감사는 지속 기록에서 복구할 수 있지만, 자체 빈 인프로세스 활성 작업 집합을 Gateway 소유 cron 실행이 사라졌다는 증거로 취급하지는 않습니다.
</Note>

## 일정 유형

| 종류    | CLI 플래그  | 설명                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 일회성 타임스탬프(ISO 8601 또는 `20m` 같은 상대값)    |
| `every` | `--every` | 고정 간격                                          |
| `cron`  | `--cron`  | 선택적 `--tz`가 포함된 5필드 또는 6필드 cron 표현식 |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 로컬 벽시계 기준 예약에는 `--tz America/New_York`를 추가하세요.

매시간 정각에 반복되는 표현식은 부하 급증을 줄이기 위해 최대 5분까지 자동으로 분산됩니다. 정확한 타이밍을 강제하려면 `--exact`를 사용하고, 명시적 창을 지정하려면 `--stagger 30s`를 사용하세요.

### 월의 일과 요일은 OR 논리를 사용합니다

Cron 표현식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. 월의 일 필드와 요일 필드가 모두 와일드카드가 아닌 경우, croner는 두 필드가 모두 일치할 때가 아니라 **둘 중 하나**의 필드가 일치할 때 매칭합니다. 이는 표준 Vixie cron 동작입니다.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

이는 월 0~1회가 아니라 월 약 5~6회 실행됩니다. OpenClaw는 여기서 Croner의 기본 OR 동작을 사용합니다. 두 조건을 모두 요구하려면 Croner의 `+` 요일 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드로 예약한 뒤 작업의 프롬프트나 명령에서 다른 조건을 가드하세요.

## 실행 스타일

| 스타일           | `--session` 값   | 실행 위치                  | 적합한 용도                       |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| 기본 세션    | `main`              | 전용 cron 깨우기 레인 | 알림, 시스템 이벤트       |
| 격리됨        | `isolated`          | 전용 `cron:<jobId>` | 보고서, 백그라운드 작업     |
| 현재 세션 | `current`           | 분리된 cron 실행        | 컨텍스트 인식 반복 작업   |
| 사용자 지정 세션  | `session:custom-id` | 분리된 cron 실행        | 알려진 채팅/세션 대상으로 지정 |

<AccordionGroup>
  <Accordion title="기본 세션, 격리, 사용자 지정 비교">
    **기본 세션** 작업은 cron 소유 실행 레인에 시스템 이벤트를 큐에 넣고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). 응답에는 대상 기본 세션의 마지막 전달 컨텍스트를 사용할 수 있지만, 일상적인 cron 턴을 사람 채팅 레인에 추가하지 않으며 대상 세션의 일일/유휴 재설정 신선도를 연장하지 않습니다. **격리된** 작업은 새 세션으로 전용 에이전트 턴을 실행합니다. **현재** 및 **사용자 지정** 세션 작업(`current`, `session:xxx`)은 선택한 채팅/세션을 전달 컨텍스트와 안전한 선호도 시딩에 사용할 수 있지만, 예약된 작업이 라이브 대화 기록을 막거나 오염시키지 않도록 각 실행은 여전히 분리된 cron 세션에서 실행됩니다.

    기본 세션 cron 이벤트는 자체 완결적인 시스템 이벤트 알림입니다. 기본 Heartbeat 프롬프트의 "Read
    HEARTBEAT.md" 지침을 자동으로 포함하지 않습니다. 반복 알림이
    `HEARTBEAT.md`를 참고해야 한다면 cron 이벤트 텍스트나
    에이전트 자체 지침에 이를 명시하세요.

  </Accordion>
  <Accordion title="분리된 작업에서 '새 세션'의 의미">
    격리, 현재 세션, 사용자 지정 세션 작업에서 "새 세션"은 각 실행마다 새로운 기록/세션 ID를 의미합니다. OpenClaw는 사고/빠른 응답/상세 응답 설정, 레이블, 명시적으로 사용자가 선택한 모델/인증 오버라이드 같은 안전한 선호도를 전달할 수 있습니다. 분리된 실행은 오래된 cron 행에서 주변 대화 컨텍스트를 상속하지 않습니다. 채널/그룹 라우팅, 전송 또는 큐 정책, 승격, 출처, ACP 런타임 바인딩이 이에 해당합니다. cron 메모리로 라이브 채팅 기록에 의존하지 말고, 지속적인 반복 작업 상태는 프롬프트, 작업공간 파일, 도구 또는 작업이 작동하는 시스템에 넣으세요.
  </Accordion>
  <Accordion title="런타임 정리">
    격리된 작업의 경우 런타임 해제에는 이제 해당 cron 세션의 최선형 브라우저 정리가 포함됩니다. 정리 실패는 무시되므로 실제 cron 결과가 계속 우선합니다.

    격리된 cron 실행은 공유 런타임 정리 경로를 통해 작업용으로 생성된 번들 MCP 런타임 인스턴스도 모두 폐기합니다. 이는 기본 세션 및 사용자 지정 세션 MCP 클라이언트가 해제되는 방식과 일치하므로, 격리된 cron 작업이 실행 간 stdio 자식 프로세스나 장기 MCP 연결을 누수하지 않습니다.

  </Accordion>
  <Accordion title="서브에이전트 및 Discord 전달">
    격리된 cron 실행이 서브에이전트를 오케스트레이션할 때, 전달은 오래된 부모의 중간 텍스트보다 최종 하위 출력도 우선합니다. 하위 실행이 아직 실행 중이면 OpenClaw는 해당 부분 부모 업데이트를 알리는 대신 억제합니다.

    텍스트 전용 Discord 공지 대상의 경우, OpenClaw는 스트리밍/중간 텍스트 페이로드와 최종 답변을 모두 재생하는 대신 표준 최종 어시스턴트 텍스트를 한 번 보냅니다. 미디어 및 구조화된 Discord 페이로드는 첨부 파일과 컴포넌트가 누락되지 않도록 여전히 별도 페이로드로 전달됩니다.

  </Accordion>
</AccordionGroup>

### 명령 페이로드

모델 기반 격리 에이전트 턴을 시작하지 않고 Gateway 스케줄러 내부에서 실행되어야 하는 결정적 스크립트에는 명령 페이로드를 사용하세요. 명령 작업은 Gateway 호스트에서 실행되고, stdout/stderr를 캡처하며, cron 기록에 실행을 기록하고, 격리된 작업과 동일한 `announce`, `webhook`, `none` 전달 모드를 재사용합니다.

<Note>
명령 cron은 에이전트 `tools.exec` 호출이 아니라 운영자 관리자 Gateway 자동화 표면입니다. cron 작업을 생성, 업데이트, 제거하거나 수동 실행하려면 `operator.admin`이 필요합니다. 예약된 명령 실행은 나중에 Gateway 프로세스 내부에서 해당 관리자가 작성한 자동화로 실행됩니다. `tools.exec.mode`, 승인 프롬프트, 에이전트별 도구 허용 목록 같은 에이전트 exec 정책은 명령 cron 페이로드가 아니라 모델에 보이는 exec 도구를 제어합니다.
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

`--command <shell>`은 `argv: ["sh", "-lc", <shell>]`을 저장합니다. 셸 파싱 없이 정확한 argv 실행을 원할 때는 `--command-argv '["node","scripts/report.mjs"]'`를 사용하세요. 선택적 `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds`, `--output-max-bytes` 필드는 프로세스 환경, stdin, 출력 한계를 제어합니다.

stdout이 비어 있지 않으면 해당 텍스트가 전달된 결과입니다. stdout이 비어 있고 stderr가 비어 있지 않으면 stderr가 전달됩니다. 두 스트림이 모두 있으면 Cron은 작은 `stdout:` / `stderr:` 블록을 전달합니다. 종료 코드가 0이면 실행이 `ok`로 기록됩니다. 0이 아닌 종료, 신호, 시간 초과 또는 출력 없음 시간 초과는 `error`를 기록하며 실패 알림을 트리거할 수 있습니다. `NO_REPLY`만 출력하는 명령은 일반 Cron 무음 토큰 억제를 사용하며 채팅에 아무것도 다시 게시하지 않습니다.

### 격리된 작업의 페이로드 옵션

<ParamField path="--message" type="string" required>
  프롬프트 텍스트(격리 모드에 필요).
</ParamField>
<ParamField path="--model" type="string">
  모델 오버라이드입니다. 작업에 대해 선택된 허용 모델을 사용합니다.
</ParamField>
<ParamField path="--fallbacks" type="string">
  작업별 대체 모델 목록입니다. 예: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. 대체 없이 엄격하게 실행하려면 `--fallbacks ""`를 전달하세요.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit`에서 작업별 대체 오버라이드를 제거하여 작업이 구성된 대체 우선순위를 따르도록 합니다. `--fallbacks`와 함께 사용할 수 없습니다.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit`에서 작업별 모델 오버라이드를 제거하여 작업이 일반 Cron 모델 선택 우선순위(설정된 경우 저장된 Cron 세션 오버라이드, 아니면 에이전트/기본 모델)를 따르도록 합니다. `--model`과 함께 사용할 수 없습니다.
</ParamField>
<ParamField path="--thinking" type="string">
  사고 수준 오버라이드입니다.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit`에서 작업별 사고 오버라이드를 제거하여 작업이 일반 Cron 사고 우선순위를 따르도록 합니다. `--thinking`과 함께 사용할 수 없습니다.
</ParamField>
<ParamField path="--light-context" type="boolean">
  워크스페이스 부트스트랩 파일 주입을 건너뜁니다.
</ParamField>
<ParamField path="--tools" type="string">
  작업이 사용할 수 있는 도구를 제한합니다. 예: `--tools exec,read`.
</ParamField>

`--model`은 선택된 허용 모델을 해당 작업의 기본 모델로 사용합니다. 이는 채팅 세션의 `/model` 오버라이드와 같지 않습니다. 작업 기본 모델이 실패해도 구성된 대체 체인은 계속 적용됩니다. 요청한 모델이 허용되지 않았거나 해석할 수 없으면 Cron은 작업의 에이전트/기본 모델 선택으로 조용히 대체하지 않고 명시적인 검증 오류로 실행을 실패 처리합니다.

Cron 작업은 페이로드 수준 `fallbacks`도 포함할 수 있습니다. 이 목록이 있으면 작업에 대해 구성된 대체 체인을 대체합니다. 선택한 모델만 시도하는 엄격한 Cron 실행을 원할 때는 작업 페이로드/API에서 `fallbacks: []`를 사용하세요. 작업에 `--model`이 있지만 페이로드 또는 구성된 대체가 없으면 OpenClaw는 명시적인 빈 대체 오버라이드를 전달하여 에이전트 기본 모델이 숨겨진 추가 재시도 대상으로 추가되지 않도록 합니다.

로컬 제공자 사전 점검은 Cron 실행을 `skipped`로 표시하기 전에 구성된 대체를 순회합니다. `fallbacks: []`는 해당 사전 점검 경로를 엄격하게 유지합니다.

격리된 작업의 모델 선택 우선순위는 다음과 같습니다.

1. Gmail 훅 모델 오버라이드(실행이 Gmail에서 왔고 해당 오버라이드가 허용된 경우)
2. 작업별 페이로드 `model`
3. 사용자가 선택해 저장한 Cron 세션 모델 오버라이드
4. 에이전트/기본 모델 선택

빠른 모드도 해석된 라이브 선택을 따릅니다. 선택된 모델 구성에 `params.fastMode`가 있으면 격리된 Cron은 기본적으로 이를 사용합니다. 저장된 세션 `fastMode` 오버라이드는 어느 방향이든 구성보다 우선합니다. 자동 모드는 선택된 모델의 `params.fastAutoOnSeconds` 컷오프가 있으면 이를 사용하고, 기본값은 60초입니다.

격리된 실행에서 라이브 모델 전환 핸드오프가 발생하면 Cron은 전환된 제공자/모델로 재시도하고, 재시도하기 전에 활성 실행에 대해 해당 라이브 선택을 유지합니다. 전환에 새 인증 프로필도 포함된 경우 Cron은 활성 실행에 대해 해당 인증 프로필 오버라이드도 유지합니다. 재시도는 제한됩니다. 최초 시도에 더해 2번의 전환 재시도 후에는 Cron이 무한 루프 대신 중단합니다.

격리된 Cron 실행이 에이전트 러너에 들어가기 전에 OpenClaw는 `baseUrl`이 loopback, 사설 네트워크 또는 `.local`인 구성된 `api: "ollama"` 및 `api: "openai-completions"` 제공자에 대해 도달 가능한 로컬 제공자 엔드포인트를 확인합니다. 해당 엔드포인트가 중단된 경우 실행은 모델 호출을 시작하는 대신 명확한 제공자/모델 오류와 함께 `skipped`로 기록됩니다. 엔드포인트 결과는 5분 동안 캐시되므로, 동일하게 중단된 로컬 Ollama, vLLM, SGLang 또는 LM Studio 서버를 사용하는 많은 예정 작업은 요청 폭주를 만드는 대신 하나의 작은 프로브를 공유합니다. 제공자 사전 점검으로 건너뛴 실행은 실행 오류 백오프를 증가시키지 않습니다. 반복 건너뜀 알림을 원하면 `failureAlert.includeSkipped`를 활성화하세요.

## 전달 및 출력

| 모드       | 발생하는 일                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 에이전트가 보내지 않은 경우 최종 텍스트를 대상으로 대체 전달합니다 |
| `webhook`  | 완료 이벤트 페이로드를 URL에 POST합니다                                |
| `none`     | 러너 대체 전달 없음                                         |

채널 전달에는 `--announce --channel telegram --to "-1001234567890"`를 사용하세요. Telegram 포럼 주제에는 `-1001234567890:topic:123`를 사용하세요. OpenClaw는 Telegram 소유의 `-1001234567890:123` 축약형도 허용합니다. 직접 RPC/구성 호출자는 `delivery.threadId`를 문자열 또는 숫자로 전달할 수 있습니다. Slack/Discord/Mattermost 대상은 명시적인 접두사(`channel:<id>`, `user:<id>`)를 사용해야 합니다. Matrix 방 ID는 대소문자를 구분합니다. 정확한 방 ID 또는 Matrix의 `room:!room:server` 형식을 사용하세요.

announce 전달에서 `channel: "last"`를 사용하거나 `channel`을 생략하면, `telegram:123` 같은 제공자 접두사가 붙은 대상이 Cron이 세션 기록 또는 하나의 구성된 채널로 대체하기 전에 채널을 선택할 수 있습니다. 로드된 Plugin이 광고하는 접두사만 제공자 선택자입니다. `delivery.channel`이 명시적인 경우 대상 접두사는 동일한 제공자를 가리켜야 합니다. 예를 들어 `channel: "whatsapp"`와 `to: "telegram:123"`는 WhatsApp이 Telegram ID를 전화번호로 해석하도록 두는 대신 거부됩니다. `channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>` 같은 대상 종류 및 서비스 접두사는 제공자 선택자가 아니라 채널 소유 대상 문법으로 유지됩니다.

격리된 작업에서는 채팅 전달이 공유됩니다. 채팅 경로를 사용할 수 있으면 작업이 `--no-deliver`를 사용하더라도 에이전트는 `message` 도구를 사용할 수 있습니다. 에이전트가 구성된/현재 대상으로 보내면 OpenClaw는 대체 announce를 건너뜁니다. 그렇지 않으면 `announce`, `webhook`, `none`은 에이전트 턴 이후 최종 응답을 러너가 어떻게 처리하는지만 제어합니다.

에이전트가 활성 채팅에서 격리된 알림을 만들면 OpenClaw는 대체 announce 경로를 위해 보존된 라이브 전달 대상을 저장합니다. 내부 세션 키는 소문자일 수 있지만, 현재 채팅 컨텍스트를 사용할 수 있을 때 제공자 전달 대상은 해당 키에서 재구성되지 않습니다.

암시적 announce 전달은 구성된 채널 허용 목록을 사용해 오래된 대상을 검증하고 재라우팅합니다. DM 페어링 저장소 승인은 대체 자동화 수신자가 아닙니다. 예약 작업이 DM으로 선제적으로 보내야 하는 경우 `delivery.to`를 설정하거나 채널 `allowFrom` 항목을 구성하세요.

## 출력 언어

Cron 작업은 채널, 로캘 또는 이전
메시지에서 답변 언어를 추론하지 않습니다. 예약된 메시지 또는 템플릿에 언어 규칙을 넣으세요:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

템플릿 파일의 경우 렌더링된 프롬프트에 언어 지시를 유지하고
작업이 실행되기 전에 `{{language}}` 같은 플레이스홀더가 채워졌는지 확인하세요. 출력에 여러 언어가 섞이면 규칙을 명시적으로 작성하세요. 예: "서술 텍스트에는 중국어를 사용하고 기술 용어는 영어로 유지하세요."

실패 알림은 별도의 대상 경로를 따릅니다.

- `cron.failureDestination`은 실패 알림의 전역 기본값을 설정합니다.
- `job.delivery.failureDestination`은 작업별로 이를 재정의합니다.
- 둘 다 설정되지 않았고 작업이 이미 `announce`로 전달되는 경우, 실패 알림은 이제 기본 announce 대상으로 폴백됩니다.
- `delivery.failureDestination`은 기본 전달 모드가 `webhook`이 아닌 한 `sessionTarget="isolated"` 작업에서만 지원됩니다.
- `failureAlert.includeSkipped: true`는 작업 또는 전역 cron 알림 정책이 반복된 건너뛴 실행 알림을 사용하도록 선택합니다. 건너뛴 실행은 별도의 연속 건너뛰기 카운터를 유지하므로 실행 오류 백오프에 영향을 주지 않습니다.

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
  <Tab title="반복 isolated 작업">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="모델 및 thinking 재정의">
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
  <Tab title="Webhook 출력">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="명령 출력">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
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

- `Authorization: Bearer <token>`(권장)
- `x-openclaw-token: <token>`

쿼리 문자열 토큰은 거부됩니다.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    main 세션에 시스템 이벤트를 대기열에 넣습니다.

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
    isolated agent 턴을 실행합니다.

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    필드: `message`(필수), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="매핑된 hook(POST /hooks/<name>)">
    사용자 지정 hook 이름은 config의 `hooks.mappings`를 통해 확인됩니다. 매핑은 템플릿 또는 코드 변환을 사용해 임의의 페이로드를 `wake` 또는 `agent` 작업으로 변환할 수 있습니다.
  </Accordion>
</AccordionGroup>

<Warning>
hook 엔드포인트는 loopback, tailnet 또는 신뢰할 수 있는 reverse proxy 뒤에 두세요.

- 전용 hook 토큰을 사용하세요. gateway 인증 토큰을 재사용하지 마세요.
- `hooks.path`는 전용 하위 경로에 두세요. `/`는 거부됩니다.
- `agentId`가 생략된 경우 기본 에이전트를 포함하여 hook이 대상으로 삼을 수 있는 유효 에이전트를 제한하려면 `hooks.allowedAgentIds`를 설정하세요.
- 호출자가 선택하는 세션이 필요하지 않다면 `hooks.allowRequestSessionKey=false`를 유지하세요.
- `hooks.allowRequestSessionKey`를 활성화하는 경우 허용되는 세션 키 형태를 제한하려면 `hooks.allowedSessionKeyPrefixes`도 설정하세요.
- Hook 페이로드는 기본적으로 안전 경계로 래핑됩니다.

</Warning>

## Gmail PubSub 통합

Google PubSub을 통해 Gmail 받은편지함 트리거를 OpenClaw에 연결합니다.

<Note>
**사전 요구 사항:** `gcloud` CLI, `gog`(gogcli), OpenClaw hooks 활성화, 공개 HTTPS 엔드포인트용 Tailscale.
</Note>

### 마법사 설정(권장)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

이 명령은 `hooks.gmail` 구성을 작성하고, Gmail 프리셋을 활성화하며, push 엔드포인트에 Tailscale Funnel을 사용합니다.

### Gateway 자동 시작

`hooks.enabled=true`이고 `hooks.gmail.account`가 설정되어 있으면 Gateway는 부팅 시 `gog gmail watch serve`를 시작하고 watch를 자동으로 갱신합니다. 사용하지 않으려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.

### 수동 일회성 설정

<Steps>
  <Step title="GCP 프로젝트 선택">
    `gog`에서 사용하는 OAuth 클라이언트를 소유한 GCP 프로젝트를 선택합니다.

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="주제를 만들고 Gmail push 접근 권한 부여">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Watch 시작">
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
# 모든 작업 나열
openclaw cron list

# 저장된 작업 하나를 JSON으로 가져오기
openclaw cron get <jobId>

# 확인된 delivery 경로를 포함해 작업 하나 표시
openclaw cron show <jobId>

# 작업 편집
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 지금 작업 강제 실행
openclaw cron run <jobId>

# 지금 작업을 강제 실행하고 터미널 상태까지 대기
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 기한이 된 경우에만 실행
openclaw cron run <jobId> --due

# 실행 기록 보기
openclaw cron runs --id <jobId> --limit 50

# 정확한 실행 하나 보기
openclaw cron runs --id <jobId> --run-id <runId>

# 작업 삭제
openclaw cron remove <jobId>

# 에이전트 선택(다중 에이전트 설정)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>`는 수동 실행을 대기열에 넣은 뒤 반환됩니다. 대기열에 들어간 실행이 끝날 때까지 차단되어야 하는 shutdown hook, 유지 관리 스크립트 또는 기타 자동화에는 `--wait`를 사용하세요. 대기 모드는 반환된 정확한 `runId`를 폴링합니다. 상태가 `ok`이면 `0`으로 종료하고, `error`, `skipped` 또는 대기 시간 초과이면 0이 아닌 값으로 종료합니다.

에이전트 `cron` 도구는 `cron(action: "list")`에서 간결한 작업 요약(`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`)을 반환합니다. 전체 작업 정의 하나를 보려면 `cron(action: "get", jobId: "...")`를 사용하세요. 직접 Gateway 호출자는 `cron.list`에 `compact: true`를 전달할 수 있습니다. 이를 생략하면 delivery 미리 보기가 포함된 기존 전체 응답이 유지됩니다.

`openclaw cron create`는 `openclaw cron add`의 별칭이며, 새 작업은 위치 인자 schedule(`"0 9 * * 1"`, `"every 1h"`, `"20m"` 또는 ISO 타임스탬프) 뒤에 위치 인자 에이전트 프롬프트를 사용할 수 있습니다. 완료된 실행 페이로드를 HTTP 엔드포인트에 POST하려면 `cron add|create` 또는 `cron edit`에서 `--webhook <url>`을 사용하세요. Webhook delivery는 `--announce`, `--channel`, `--to`, `--thread-id`, `--account` 같은 chat delivery 플래그와 함께 사용할 수 없습니다. `cron edit`에서 `--clear-channel`, `--clear-to`, `--clear-thread-id`, `--clear-account`는 해당 라우팅 필드를 개별적으로 해제하며(각각 대응되는 설정 플래그와 함께 사용하면 거부됨), 이는 `--no-deliver`가 runner fallback delivery를 비활성화하는 것과는 다릅니다.

<Note>
모델 재정의 참고:

- `openclaw cron add|edit --model ...`은 작업의 선택된 모델을 변경합니다.
- 모델이 허용되면 해당 provider/model이 isolated 에이전트 실행에 그대로 도달합니다.
- 허용되지 않았거나 확인할 수 없으면 cron은 명시적 검증 오류와 함께 실행을 실패 처리합니다.
- API `cron.update` 페이로드 패치는 저장된 작업 모델 재정의를 지우도록 `model: null`을 설정할 수 있습니다.
- `openclaw cron edit <job-id> --clear-model`은 CLI에서 해당 재정의를 지웁니다(`model: null` 패치와 같은 효과). `--model`과 함께 사용할 수 없습니다.
- cron `--model`은 세션 `/model` 재정의가 아니라 작업의 기본 모델이므로 구성된 fallback 체인은 계속 적용됩니다.
- `openclaw cron add|edit --fallbacks ...`는 페이로드 `fallbacks`를 설정하여 해당 작업의 구성된 fallbacks를 대체합니다. `--fallbacks ""`는 fallback을 비활성화하고 실행을 strict하게 만듭니다. `openclaw cron edit <job-id> --clear-fallbacks`는 작업별 재정의를 지웁니다.
- 명시적 또는 구성된 fallback 목록이 없는 일반 `--model`은 조용히 추가 재시도 대상으로 에이전트 기본 모델로 넘어가지 않습니다.

</Note>

## 구성

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

`maxConcurrentRuns`는 예약된 cron dispatch와 isolated 에이전트 turn 실행을 모두 제한하며, 기본값은 8입니다. Isolated cron 에이전트 turn은 내부적으로 큐의 전용 `cron-nested` 실행 lane을 사용하므로, 이 값을 높이면 독립적인 cron LLM 실행이 바깥쪽 cron wrapper만 시작되는 대신 병렬로 진행될 수 있습니다. 공유 non-cron `nested` lane은 이 설정으로 넓어지지 않습니다.

`cron.store`는 논리적 저장소 키이자 legacy doctor 가져오기 경로입니다. 기존 JSON 저장소를 SQLite로 가져오고 보관하려면 `openclaw doctor --fix`를 실행하세요. 향후 cron 변경은 CLI 또는 Gateway API를 통해 수행해야 합니다.

cron 비활성화: `cron.enabled: false` 또는 `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="재시도 동작">
    **One-shot 재시도**: 일시적 오류(rate limit, overload, network, server error)는 exponential backoff로 최대 3회 재시도됩니다. 영구 오류는 즉시 비활성화됩니다.

    **Recurring 재시도**: 재시도 사이에 exponential backoff(30초에서 60분)를 적용합니다. 다음 성공 실행 후 backoff가 초기화됩니다.

  </Accordion>
  <Accordion title="유지 관리">
    `cron.sessionRetention`(기본값 `24h`)은 isolated 실행 세션 항목을 정리합니다. `cron.runLog.keepLines`는 작업별로 보존되는 SQLite 실행 기록 행을 제한합니다. `maxBytes`는 이전 파일 기반 실행 로그와의 구성 호환성을 위해 유지됩니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

### 명령 ladder

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
    - `cron` schedule의 경우 timezone(`--tz`)과 host timezone을 확인하세요.
    - 실행 출력의 `reason: not-due`는 수동 실행이 `openclaw cron run <jobId> --due`로 확인되었고 아직 작업 기한이 되지 않았음을 의미합니다.

  </Accordion>
  <Accordion title="Cron은 실행되었지만 delivery가 없음">
    - Delivery mode `none`은 runner fallback send가 예상되지 않는다는 의미입니다. chat route를 사용할 수 있으면 에이전트는 여전히 `message` 도구로 직접 보낼 수 있습니다.
    - Delivery target이 없거나 잘못됨(`channel`/`to`)은 outbound가 건너뛰어졌음을 의미합니다.
    - Matrix의 경우, 복사되었거나 legacy 작업에서 소문자화된 `delivery.to` room ID를 사용하면 Matrix room ID가 대소문자를 구분하므로 실패할 수 있습니다. Matrix의 정확한 `!room:server` 또는 `room:!room:server` 값으로 작업을 편집하세요.
    - Channel auth 오류(`unauthorized`, `Forbidden`)는 자격 증명으로 인해 delivery가 차단되었음을 의미합니다.
    - isolated 실행이 silent token(`NO_REPLY` / `no_reply`)만 반환하면 OpenClaw는 direct outbound delivery를 억제하고 fallback queued summary 경로도 억제하므로 chat에 아무것도 다시 게시되지 않습니다.
    - 에이전트가 사용자에게 직접 메시지를 보내야 한다면 작업에 사용할 수 있는 route(`channel: "last"`와 이전 chat, 또는 명시적 channel/target)가 있는지 확인하세요.

  </Accordion>
  <Accordion title="Cron 또는 Heartbeat가 /new-style rollover를 막는 것처럼 보임">
    - 일일 및 idle reset freshness는 `updatedAt` 기반이 아닙니다. [세션 관리](/ko/concepts/session#session-lifecycle)를 참조하세요.
    - Cron wakeup, Heartbeat 실행, exec 알림, gateway bookkeeping은 라우팅/상태를 위해 세션 행을 업데이트할 수 있지만, `sessionStartedAt` 또는 `lastInteractionAt`를 연장하지 않습니다.
    - 해당 필드가 존재하기 전에 생성된 legacy 행의 경우 파일을 아직 사용할 수 있으면 OpenClaw가 transcript JSONL 세션 헤더에서 `sessionStartedAt`를 복구할 수 있습니다. `lastInteractionAt`가 없는 legacy idle 행은 복구된 시작 시간을 idle 기준선으로 사용합니다.

  </Accordion>
  <Accordion title="Timezone 주의 사항">
    - `--tz`가 없는 Cron은 gateway host timezone을 사용합니다.
    - timezone이 없는 `at` schedule은 UTC로 처리됩니다.
    - Heartbeat `activeHours`는 구성된 timezone resolution을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Automation](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [Background Tasks](/ko/automation/tasks) — cron 실행용 task ledger
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 main-session turn
- [Timezone](/ko/concepts/timezone) — timezone 구성
