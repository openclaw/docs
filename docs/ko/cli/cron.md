---
read_when:
    - 예약된 작업과 wakeup이 필요합니다
    - Cron 실행 및 로그를 디버깅하고 있습니다
summary: '`openclaw cron`에 대한 CLI 참조(백그라운드 작업 예약 및 실행)'
title: Cron
x-i18n:
    generated_at: "2026-04-23T14:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway 스케줄러의 Cron 작업을 관리합니다.

관련 항목:

- Cron 작업: [Cron jobs](/ko/automation/cron-jobs)

팁: 전체 명령 표면은 `openclaw cron --help`를 실행해 확인하세요.

참고: `openclaw cron list`와 `openclaw cron show <job-id>`는 해석된 전송 경로를 미리 보여줍니다. `channel: "last"`의 경우, 미리보기에는 경로가 메인/현재 session에서 해석되었는지 또는 fail closed될지가 표시됩니다.

참고: 격리된 `cron add` 작업은 기본적으로 `--announce` 전송을 사용합니다. 출력을 내부에만 유지하려면 `--no-deliver`를 사용하세요. `--deliver`는 더 이상 권장되지 않는 `--announce`의 별칭으로 유지됩니다.

참고: 격리된 cron 채팅 전송은 공유됩니다. `--announce`는 최종 응답에 대한 runner fallback 전송이고, `--no-deliver`는 해당 fallback을 비활성화하지만 채팅 경로를 사용할 수 있을 때 agent의 `message` tool을 제거하지는 않습니다.

참고: 원샷(`--at`) 작업은 기본적으로 성공 후 삭제됩니다. 유지하려면 `--keep-after-run`을 사용하세요.

참고: `--session`은 `main`, `isolated`, `current`, `session:<id>`를 지원합니다.
생성 시점의 활성 session에 바인딩하려면 `current`를 사용하고, 명시적인 영구 session 키에는 `session:<id>`를 사용하세요.

참고: 원샷 CLI 작업에서 오프셋이 없는 `--at` datetime은 `--tz <iana>`도 함께 전달하지 않는 한 UTC로 처리됩니다. `--tz <iana>`를 함께 전달하면 해당 로컬 wall-clock 시간이 지정한 timezone에서 해석됩니다.

참고: 반복 작업은 이제 연속 오류 후 지수 재시도 backoff(30초 → 1분 → 5분 → 15분 → 60분)를 사용하며, 다음 성공 실행 후에는 일반 스케줄로 돌아갑니다.

참고: `openclaw cron run`은 이제 수동 실행이 실행 대기열에 들어가는 즉시 반환됩니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함되며, 최종 결과는 `openclaw cron runs --id <job-id>`로 추적하세요.

참고: `openclaw cron run <job-id>`는 기본적으로 force-run합니다. 이전의 "기한이 된 경우에만 실행" 동작을 유지하려면 `--due`를 사용하세요.

참고: 격리된 cron turn은 오래된 acknowledgement 전용 응답을 억제합니다. 첫 번째 결과가 단지 중간 상태 업데이트이고 최종 답변에 대해 책임지는 하위 subagent 실행이 없다면, cron은 전송 전에 실제 결과를 한 번 더 다시 요청합니다.

참고: 격리된 cron 실행이 silent token(`NO_REPLY` / `no_reply`)만 반환하면, cron은 직접 outbound 전송과 fallback queued summary 경로도 모두 억제하므로 채팅에 아무것도 게시되지 않습니다.

참고: `cron add|edit --model ...`은 해당 작업에 대해 선택한 허용 model을 사용합니다.
model이 허용되지 않으면 cron은 경고를 표시하고 대신 작업의 agent/default
model 선택으로 fallback합니다. 구성된 fallback chain은 계속 적용되지만, 명시적인 작업별 fallback 목록이 없는 단순 model 재정의는 더 이상 agent primary를 숨겨진 추가 재시도 대상으로 덧붙이지 않습니다.

참고: 격리된 cron model 우선순위는 Gmail-hook 재정의가 먼저, 그다음 작업별
`--model`, 그다음 저장된 cron-session model 재정의, 마지막으로 일반
agent/default 선택입니다.

참고: 격리된 cron fast mode는 해석된 live model 선택을 따릅니다. Model
config `params.fastMode`가 기본적으로 적용되지만, 저장된 session `fastMode`
재정의는 여전히 config보다 우선합니다.

참고: 격리된 실행이 `LiveSessionModelSwitchError`를 발생시키면, cron은
재시도 전에 전환된 provider/model(및 존재하는 경우 전환된 auth profile 재정의)을 저장합니다. 바깥쪽 재시도 루프는 초기 시도 후 최대 2회의 switch 재시도로 제한되며, 이후에는 무한 반복하지 않고 중단됩니다.

참고: 실패 알림은 먼저 `delivery.failureDestination`을 사용하고, 그다음
전역 `cron.failureDestination`, 마지막으로 명시적인 실패 대상이 구성되지 않은 경우 작업의 기본 announce 대상로 fallback합니다.

참고: 보존/정리는 config에서 제어됩니다:

- `cron.sessionRetention`(기본값 `24h`)은 완료된 격리 실행 session을 정리합니다.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl`을 정리합니다.

업그레이드 참고: 현재 전송/저장 형식 이전의 오래된 cron 작업이 있다면
`openclaw doctor --fix`를 실행하세요. Doctor는 이제 레거시 cron 필드(`jobId`, `schedule.cron`,
레거시 `threadId`를 포함한 최상위 전송 필드, payload `provider` 전송 alias)를 정규화하고,
`cron.webhook`이 구성된 경우 단순한 `notify: true` Webhook fallback 작업을 명시적인 Webhook 전송으로 마이그레이션합니다.

## 일반적인 수정

메시지를 변경하지 않고 전송 설정 업데이트:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

격리된 작업의 전송 비활성화:

```bash
openclaw cron edit <job-id> --no-deliver
```

격리된 작업에 경량 bootstrap 컨텍스트 활성화:

```bash
openclaw cron edit <job-id> --light-context
```

특정 채널로 announce:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

경량 bootstrap 컨텍스트로 격리된 작업 생성:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context`는 격리된 agent-turn 작업에만 적용됩니다. Cron 실행에서는 경량 모드가 전체 workspace bootstrap 세트를 주입하는 대신 bootstrap 컨텍스트를 비어 있게 유지합니다.

전송 소유권 참고:

- 격리된 cron 채팅 전송은 공유됩니다. 채팅 경로를 사용할 수 있을 때
  agent는 `message` tool로 직접 전송할 수 있습니다.
- `announce`는 agent가 해석된 대상에 직접 전송하지 않았을 때만 최종 응답을 fallback 전송합니다. `webhook`은 완료된 payload를 URL로 게시합니다.
  `none`은 runner fallback 전송을 비활성화합니다.

## 일반적인 관리자 명령

수동 실행:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 항목에는 의도된 cron 대상,
해석된 대상, message-tool 전송, fallback 사용 여부, 전송 상태를 포함한 전송 진단 정보가 들어 있습니다.

Agent/session 대상 변경:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

전송 조정:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

실패 전송 참고:

- `delivery.failureDestination`은 격리된 작업에서 지원됩니다.
- 메인 session 작업은 기본
  전송 모드가 `webhook`일 때만 `delivery.failureDestination`을 사용할 수 있습니다.
- 실패 대상을 설정하지 않았고 작업이 이미 채널에
  announce하고 있다면, 실패 알림은 동일한 announce 대상을 재사용합니다.
