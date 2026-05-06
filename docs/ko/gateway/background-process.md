---
read_when:
    - 백그라운드 실행 동작 추가 또는 수정
    - 장시간 실행되는 exec 작업 디버깅
summary: 백그라운드 exec 실행 및 프로세스 관리
title: 백그라운드 exec 및 프로세스 도구
x-i18n:
    generated_at: "2026-05-06T06:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw는 `exec` 도구를 통해 셸 명령을 실행하고 장기 실행 작업을 메모리에 유지합니다. `process` 도구는 이러한 백그라운드 세션을 관리합니다.

## exec 도구

주요 매개변수:

- `command`(필수)
- `yieldMs`(기본값 10000): 이 지연 시간 이후 자동으로 백그라운드 전환
- `background`(bool): 즉시 백그라운드 실행
- `timeout`(초, 기본값 `tools.exec.timeoutSec`): 이 제한 시간이 지나면 프로세스를 종료합니다. 해당 호출에서 exec 프로세스 제한 시간만 비활성화하려면 `timeout: 0`을 설정하세요
- `elevated`(bool): elevated 모드가 활성화/허용된 경우 샌드박스 밖에서 실행합니다(기본값은 `gateway`, exec 대상이 `node`이면 `node`)
- 실제 TTY가 필요하신가요? `pty: true`를 설정하세요.
- `workdir`, `env`

동작:

- 포그라운드 실행은 출력을 직접 반환합니다.
- 백그라운드로 전환되면(명시적이거나 제한 시간으로 인해) 도구는 `status: "running"` + `sessionId`와 짧은 tail을 반환합니다.
- 백그라운드 및 `yieldMs` 실행은 호출에서 명시적 `timeout`을 제공하지 않는 한 `tools.exec.timeoutSec`를 상속합니다.
- 출력은 세션이 폴링되거나 지워질 때까지 메모리에 유지됩니다.
- `process` 도구가 허용되지 않으면 `exec`는 동기적으로 실행되고 `yieldMs`/`background`를 무시합니다.
- 생성된 exec 명령은 컨텍스트 인식 셸/프로필 규칙을 위해 `OPENCLAW_SHELL=exec`를 받습니다.
- 지금 시작하는 장기 실행 작업은 한 번만 시작하고, 활성화되어 있으며 명령이 출력을 내거나 실패할 때 자동 완료 깨우기에 의존하세요.
- 자동 완료 깨우기를 사용할 수 없거나, 출력 없이 정상 종료된 명령에 대한 무출력 성공 확인이 필요하면 `process`를 사용해 완료를 확인하세요.
- `sleep` 루프나 반복 폴링으로 알림 또는 지연된 후속 작업을 흉내 내지 마세요. 향후 작업에는 cron을 사용하세요.

## 자식 프로세스 브리징

exec/process 도구 밖에서 장기 실행 자식 프로세스를 생성할 때(예: CLI 재시작 또는 gateway 헬퍼), 종료 신호가 전달되고 종료/오류 시 리스너가 분리되도록 자식 프로세스 브리지 헬퍼를 연결하세요. 이렇게 하면 systemd에서 고아 프로세스를 방지하고 플랫폼 전반에서 종료 동작을 일관되게 유지할 수 있습니다.

환경 재정의:

- `PI_BASH_YIELD_MS`: 기본 yield(ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: 메모리 내 출력 한도(문자)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: 스트림별 대기 중인 stdout/stderr 한도(문자)
- `PI_BASH_JOB_TTL_MS`: 완료된 세션의 TTL(ms, 1분~3시간으로 제한)

설정(권장):

- `tools.exec.backgroundMs`(기본값 10000)
- `tools.exec.timeoutSec`(기본값 1800)
- `tools.exec.cleanupMs`(기본값 1800000)
- `tools.exec.notifyOnExit`(기본값 true): 백그라운드 exec가 종료되면 시스템 이벤트를 큐에 넣고 Heartbeat를 요청합니다.
- `tools.exec.notifyOnExitEmptySuccess`(기본값 false): true이면 출력이 없었던 성공적인 백그라운드 실행에 대해서도 완료 이벤트를 큐에 넣습니다.

## process 도구

동작:

- `list`: 실행 중 + 완료된 세션
- `poll`: 세션의 새 출력 비우기(종료 상태도 보고)
- `log`: 집계된 출력 읽기(`offset` + `limit` 지원)
- `write`: stdin 전송(`data`, 선택 사항 `eof`)
- `send-keys`: PTY 기반 세션에 명시적 키 토큰 또는 바이트 전송
- `submit`: PTY 기반 세션에 Enter / carriage return 전송
- `paste`: 리터럴 텍스트 전송, 선택적으로 bracketed paste 모드로 감쌈
- `kill`: 백그라운드 세션 종료
- `clear`: 완료된 세션을 메모리에서 제거
- `remove`: 실행 중이면 종료하고, 완료되었으면 지우기

참고:

- 백그라운드 세션만 메모리에 나열/유지됩니다.
- 프로세스 재시작 시 세션은 손실됩니다(디스크 지속성 없음).
- 세션 로그는 `process poll/log`를 실행하고 도구 결과가 기록된 경우에만 채팅 기록에 저장됩니다.
- `process`는 에이전트별로 범위가 지정됩니다. 해당 에이전트가 시작한 세션만 볼 수 있습니다.
- 자동 완료 깨우기를 사용할 수 없을 때 상태, 로그, 무출력 성공 확인 또는 완료 확인에는 `poll` / `log`를 사용하세요.
- 입력이나 개입이 필요할 때는 `write` / `send-keys` / `submit` / `paste` / `kill`을 사용하세요.
- `process list`에는 빠른 검토를 위한 파생 `name`(명령 동사 + 대상)이 포함됩니다.
- `process log`는 줄 기반 `offset`/`limit`을 사용합니다.
- `offset`과 `limit`이 모두 생략되면 마지막 200줄을 반환하고 페이징 힌트를 포함합니다.
- `offset`이 제공되고 `limit`이 생략되면 `offset`부터 끝까지 반환합니다(200줄로 제한되지 않음).
- 폴링은 요청 시 상태 확인용이지 대기 루프 스케줄링용이 아닙니다. 작업이 나중에 실행되어야 한다면 대신 cron을 사용하세요.

## 예시

긴 작업을 실행하고 나중에 폴링:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

즉시 백그라운드에서 시작:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin 전송:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY 키 전송:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

현재 줄 제출:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

리터럴 텍스트 붙여넣기:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 관련 항목

- [Exec 도구](/ko/tools/exec)
- [Exec 승인](/ko/tools/exec-approvals)
