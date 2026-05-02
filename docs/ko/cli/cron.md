---
read_when:
    - 예약된 작업과 깨우기가 필요한 경우
    - Cron 실행 및 로그를 디버깅하고 있습니다
summary: CLI reference for `openclaw cron` (schedule and run background jobs)
title: Cron
x-i18n:
    generated_at: "2026-05-02T20:44:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

<Tip>
전체 명령 표면은 `openclaw cron --help`를 실행해 확인하세요. 개념 가이드는 [Cron 작업](/ko/automation/cron-jobs)을 참고하세요.
</Tip>

## 세션

`--session`은 `main`, `isolated`, `current`, 또는 `session:<id>`를 허용합니다.

<AccordionGroup>
  <Accordion title="세션 키">
    - `main`은 에이전트의 기본 세션에 바인딩됩니다.
    - `isolated`는 각 실행마다 새 transcript와 세션 id를 생성합니다.
    - `current`는 생성 시점의 활성 세션에 바인딩됩니다.
    - `session:<id>`는 명시적인 영구 세션 키에 고정됩니다.

  </Accordion>
  <Accordion title="격리된 세션 의미 체계">
    격리된 실행은 주변 대화 컨텍스트를 재설정합니다. 새 실행에서는 채널 및 그룹 라우팅, 전송/대기열 정책, 권한 상승, 출처, ACP 런타임 바인딩이 재설정됩니다. 안전한 기본 설정과 사용자가 명시적으로 선택한 모델 또는 인증 재정의는 실행 간에 유지될 수 있습니다.
  </Accordion>
</AccordionGroup>

## 전달

`openclaw cron list`와 `openclaw cron show <job-id>`는 해석된 전달 경로를 미리 보여줍니다. `channel: "last"`의 경우, 미리보기는 경로가 기본 또는 현재 세션에서 해석되었는지, 아니면 닫힌 상태로 실패할지를 보여줍니다.

제공자 접두사가 붙은 대상은 해석되지 않은 공지 채널을 명확히 구분할 수 있습니다. 예를 들어 `delivery.channel`이 생략되었거나 `last`이면 `to: "telegram:123"`은 Telegram을 선택합니다. 로드된 Plugin이 광고한 접두사만 제공자 선택자입니다. `delivery.channel`이 명시적이면 접두사는 해당 채널과 일치해야 합니다. `channel: "whatsapp"`에 `to: "telegram:123"`을 함께 사용하면 거부됩니다. `imessage:` 및 `sms:` 같은 서비스 접두사는 채널이 소유한 대상 구문으로 유지됩니다.

<Note>
격리된 `cron add` 작업은 기본적으로 `--announce` 전달을 사용합니다. 출력을 내부에 유지하려면 `--no-deliver`를 사용하세요. `--deliver`는 `--announce`의 더 이상 권장되지 않는 별칭으로 남아 있습니다.
</Note>

### 전달 소유권

격리된 Cron 채팅 전달은 에이전트와 실행기가 공유합니다.

- 채팅 경로를 사용할 수 있으면 에이전트가 `message` 도구를 사용해 직접 전송할 수 있습니다.
- `announce`는 에이전트가 해석된 대상에 직접 전송하지 않았을 때만 최종 응답을 대체 전달합니다.
- `webhook`은 완료된 페이로드를 URL에 게시합니다.
- `none`은 실행기 대체 전달을 비활성화합니다.

`--announce`는 최종 응답에 대한 실행기 대체 전달입니다. `--no-deliver`는 해당 대체 전달을 비활성화하지만, 채팅 경로를 사용할 수 있을 때 에이전트의 `message` 도구를 제거하지는 않습니다.

활성 채팅에서 생성된 알림은 대체 공지 전달을 위해 실시간 채팅 전달 대상을 보존합니다. 내부 세션 키는 소문자일 수 있습니다. Matrix 방 ID처럼 대소문자를 구분하는 제공자 ID의 원천으로 사용하지 마세요.

### 실패 전달

실패 알림은 다음 순서로 해석됩니다.

1. 작업의 `delivery.failureDestination`.
2. 전역 `cron.failureDestination`.
3. 작업의 기본 공지 대상(명시적인 실패 대상이 설정되지 않은 경우).

<Note>
기본 세션 작업은 기본 전달 모드가 `webhook`일 때만 `delivery.failureDestination`을 사용할 수 있습니다. 격리된 작업은 모든 모드에서 이를 허용합니다.
</Note>

참고: 격리된 Cron 실행은 응답 페이로드가 생성되지 않더라도 실행 수준의 에이전트 실패를 작업 오류로 처리하므로, 모델/제공자 실패도 오류 카운터를 증가시키고 실패 알림을 트리거합니다.

## 스케줄링

### 일회성 작업

`--at <datetime>`은 일회성 실행을 예약합니다. 오프셋이 없는 날짜/시간은 `--tz <iana>`도 함께 전달하지 않는 한 UTC로 처리되며, `--tz <iana>`를 전달하면 지정된 시간대의 벽시계 시간으로 해석됩니다.

<Note>
일회성 작업은 기본적으로 성공 후 삭제됩니다. 보존하려면 `--keep-after-run`을 사용하세요.
</Note>

### 반복 작업

반복 작업은 연속 오류 후 지수 재시도 백오프를 사용합니다: 30초, 1분, 5분, 15분, 60분. 다음 성공 실행 후 스케줄은 정상으로 돌아갑니다.

건너뛴 실행은 실행 오류와 별도로 추적됩니다. 재시도 백오프에는 영향을 주지 않지만, `openclaw cron edit <job-id> --failure-alert-include-skipped`를 사용하면 실패 알림에 반복된 건너뛴 실행 알림을 포함하도록 선택할 수 있습니다.

로컬에 구성된 모델 제공자를 대상으로 하는 격리된 작업의 경우, Cron은 에이전트 턴을 시작하기 전에 가벼운 제공자 사전 점검을 실행합니다. Loopback, private-network, `.local` `api: "ollama"` 제공자는 `/api/tags`에서 확인되며, vLLM, SGLang, LM Studio 같은 로컬 OpenAI 호환 제공자는 `/models`에서 확인됩니다. 엔드포인트에 도달할 수 없으면 실행은 `skipped`로 기록되고 이후 스케줄에서 다시 시도됩니다. 일치하는 죽은 엔드포인트는 여러 작업이 동일한 로컬 서버를 과도하게 두드리지 않도록 5분 동안 캐시됩니다.

참고: Cron 작업 정의는 `jobs.json`에 저장되고, 대기 중인 런타임 상태는 `jobs-state.json`에 저장됩니다. `jobs.json`이 외부에서 편집되면 Gateway는 변경된 스케줄을 다시 로드하고 오래된 대기 슬롯을 지웁니다. 서식만 변경한 재작성은 대기 슬롯을 지우지 않습니다.

### 수동 실행

`openclaw cron run`은 수동 실행이 대기열에 들어가자마자 반환됩니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함됩니다. 최종 결과를 따라가려면 `openclaw cron runs --id <job-id>`를 사용하세요.

<Note>
`openclaw cron run <job-id>`는 기본적으로 강제 실행합니다. 이전의 "기한이 되었을 때만 실행" 동작을 유지하려면 `--due`를 사용하세요.
</Note>

## 모델

`cron add|edit --model <ref>`는 작업에 허용된 모델을 선택합니다.

<Warning>
모델이 허용되지 않았거나 해석할 수 없으면 Cron은 작업의 에이전트 또는 기본 모델 선택으로 대체하지 않고 명시적인 검증 오류와 함께 실행을 실패시킵니다.
</Warning>

Cron `--model`은 채팅 세션 `/model` 재정의가 아니라 **작업 기본값**입니다. 이는 다음을 의미합니다.

- 선택된 작업 모델이 실패하면 구성된 모델 fallback이 계속 적용됩니다.
- 작업별 페이로드 `fallbacks`가 있으면 구성된 fallback 목록을 대체합니다.
- 빈 작업별 fallback 목록(작업 페이로드/API의 `fallbacks: []`)은 Cron 실행을 엄격하게 만듭니다.
- 작업에 `--model`이 있지만 fallback 목록이 구성되지 않은 경우, OpenClaw는 명시적인 빈 fallback 재정의를 전달하여 에이전트 기본 모델이 숨겨진 재시도 대상으로 추가되지 않게 합니다.

### 격리된 Cron 모델 우선순위

격리된 Cron은 활성 모델을 다음 순서로 해석합니다.

1. Gmail-hook 재정의.
2. 작업별 `--model`.
3. 저장된 Cron 세션 모델 재정의(사용자가 하나를 선택한 경우).
4. 에이전트 또는 기본 모델 선택.

### 빠른 모드

격리된 Cron 빠른 모드는 해석된 실시간 모델 선택을 따릅니다. 모델 구성 `params.fastMode`가 기본적으로 적용되지만, 저장된 세션 `fastMode` 재정의가 여전히 구성보다 우선합니다.

### 실시간 모델 전환 재시도

격리된 실행이 `LiveSessionModelSwitchError`를 던지면, Cron은 다시 시도하기 전에 활성 실행에 대해 전환된 제공자와 모델(그리고 존재하는 경우 전환된 인증 프로필 재정의)을 저장합니다. 외부 재시도 루프는 최초 시도 후 두 번의 전환 재시도로 제한되며, 이후에는 무한 루프 대신 중단됩니다.

## 실행 출력 및 거부

### 오래된 확인 응답 억제

격리된 Cron 턴은 오래된 확인 전용 응답을 억제합니다. 첫 번째 결과가 단지 임시 상태 업데이트이고 최종 답변을 책임지는 하위 에이전트 실행이 없으면, Cron은 전달 전에 실제 결과를 한 번 다시 요청합니다.

### 무응답 토큰 억제

격리된 Cron 실행이 무응답 토큰(`NO_REPLY` 또는 `no_reply`)만 반환하면, Cron은 직접 발신 전달과 대체 대기열 요약 경로를 모두 억제하므로 채팅에 아무것도 다시 게시되지 않습니다.

### 구조화된 거부

격리된 Cron 실행은 내장 실행의 구조화된 실행 거부 메타데이터를 우선 사용한 뒤, `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, 승인 바인딩 거부 문구 같은 최종 출력의 알려진 거부 표식으로 fallback합니다.

`cron list`와 실행 기록은 차단된 명령을 `ok`로 보고하는 대신 거부 이유를 표시합니다.

## 보존

보존 및 정리는 구성에서 제어됩니다.

- `cron.sessionRetention`(기본값 `24h`)은 완료된 격리 실행 세션을 정리합니다.
- `cron.runLog.maxBytes`와 `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl`을 정리합니다.

## 이전 작업 마이그레이션

<Note>
현재 전달 및 저장소 형식 이전의 Cron 작업이 있는 경우 `openclaw doctor --fix`를 실행하세요. Doctor는 레거시 Cron 필드(`jobId`, `schedule.cron`, 레거시 `threadId`를 포함한 최상위 전달 필드, 페이로드 `provider` 전달 별칭)를 정규화하고, `cron.webhook`이 구성된 경우 단순한 `notify: true` Webhook fallback 작업을 명시적인 Webhook 전달로 마이그레이션합니다.
</Note>

## 일반 편집

메시지를 변경하지 않고 전달 설정을 업데이트합니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

격리된 작업의 전달을 비활성화합니다.

```bash
openclaw cron edit <job-id> --no-deliver
```

격리된 작업에 가벼운 부트스트랩 컨텍스트를 활성화합니다.

```bash
openclaw cron edit <job-id> --light-context
```

특정 채널에 공지합니다.

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Telegram 포럼 주제에 공지합니다.

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

가벼운 부트스트랩 컨텍스트가 있는 격리된 작업을 생성합니다.

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context`는 격리된 에이전트 턴 작업에만 적용됩니다. Cron 실행에서 가벼운 모드는 전체 작업공간 부트스트랩 세트를 주입하는 대신 부트스트랩 컨텍스트를 비워 둡니다.

## 일반 관리자 명령

수동 실행 및 검사:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 항목에는 의도된 Cron 대상, 해석된 대상, message-tool 전송, fallback 사용, 전달 상태가 포함된 전달 진단이 포함됩니다.

에이전트 및 세션 재대상 지정:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add`는 에이전트 턴 작업에서 `--agent`가 생략되면 경고하고 기본 에이전트(`main`)로 fallback합니다. 특정 에이전트에 고정하려면 생성 시 `--agent <id>`를 전달하세요.

전달 조정:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [예약된 작업](/ko/automation/cron-jobs)
