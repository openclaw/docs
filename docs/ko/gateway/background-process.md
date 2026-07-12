---
read_when:
    - 백그라운드 실행 동작 추가 또는 수정
    - 장시간 실행되는 exec 작업 디버깅
summary: 백그라운드 exec 실행 및 프로세스 관리
title: 백그라운드 실행 및 프로세스 도구
x-i18n:
    generated_at: "2026-07-12T00:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw은 `exec` 도구를 통해 셸 명령을 실행하고 장시간 실행되는 작업을 메모리에 유지합니다. `process` 도구는 이러한 백그라운드 세션을 관리합니다.

## exec 도구

매개변수:

| 매개변수     | 설명                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | 필수. 실행할 셸 명령입니다.                                                                                                                             |
| `workdir`    | 작업 디렉터리입니다. 생략하면 기본 cwd를 사용합니다.                                                                                                    |
| `env`        | 명령에 사용할 추가 환경 변수입니다.                                                                                                                     |
| `yieldMs`    | 백그라운드로 전환하기 전에 대기할 시간(밀리초)입니다(기본값 10000).                                                                                     |
| `background` | 즉시 백그라운드에서 실행합니다.                                                                                                                         |
| `timeout`    | 제한 시간(초, 기본값 `tools.exec.timeoutSec`)입니다. 시간이 만료되면 프로세스를 종료합니다. 해당 호출에서 exec 프로세스 제한 시간을 비활성화하려면 `timeout: 0`으로 설정합니다. |
| `pty`        | 사용 가능한 경우 의사 터미널에서 실행합니다(TTY가 필요한 CLI, 코딩 에이전트).                                                                           |
| `elevated`   | 상승 모드가 활성화/허용된 경우 샌드박스 외부에서 실행합니다(기본값은 `gateway`, exec 대상이 `node`인 경우에는 `node`).                                   |
| `host`       | Exec 대상: `auto`, `sandbox`, `gateway` 또는 `node`.                                                                                                    |
| `node`       | Node ID/이름으로, `host: "node"`와 함께 사용합니다.                                                                                                     |

동작:

- 포그라운드 실행은 출력을 직접 반환합니다.
- 백그라운드로 전환되면(명시적으로 지정하거나 `yieldMs` 제한 시간이 지난 경우) 도구는 `status: "running"` + `sessionId`와 짧은 출력 끝부분을 반환합니다.
- 백그라운드 실행 및 `yieldMs` 실행은 호출에서 명시적인 `timeout`을 전달하지 않는 한 `tools.exec.timeoutSec`를 상속합니다.
- 출력은 세션을 폴링하거나 지울 때까지 메모리에 유지됩니다.
- `process` 도구가 허용되지 않으면 `exec`는 동기적으로 실행되며 `yieldMs`/`background`를 무시합니다.
- 생성된 exec 명령에는 상황 인식형 셸/프로필 규칙을 위해 `OPENCLAW_SHELL=exec`가 전달됩니다.
- 지금 시작하는 장시간 작업의 경우 한 번만 시작하고, 명령이 출력을 내거나 실패했을 때 자동 완료 깨우기(활성화된 경우)에 의존하세요.
- 자동 완료 깨우기를 사용할 수 없거나 출력 없이 정상 종료되는 명령의 무출력 성공을 확인해야 한다면 `process`로 폴링하세요.
- `sleep` 루프나 반복 폴링으로 알림 또는 지연된 후속 작업을 흉내 내지 마세요. 향후 작업에는 Cron을 사용하세요.

### 환경 변수 재정의

| 변수                                     | 효과                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | 백그라운드 전환 전 기본 대기 시간(ms). 기본값은 10000이며 10~120000으로 제한됩니다.                                   |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | 메모리 내 출력 한도(문자 수).                                                                                         |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | 스트림별 대기 중인 stdout/stderr 한도(문자 수).                                                                       |
| `OPENCLAW_BASH_JOB_TTL_MS`               | 완료된 세션의 TTL(ms)이며 1분~3시간으로 제한됩니다.                                                                   |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | 쓰기 가능한 백그라운드 세션을 입력 대기 가능성이 있는 상태로 표시하기 전의 출력 유휴 임계값입니다. 기본값은 15000입니다. |

### 구성(환경 변수 재정보다 권장)

| 키                                    | 기본값  | 효과                                                                                         |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | `OPENCLAW_BASH_YIELD_MS`와 동일합니다.                                                       |
| `tools.exec.timeoutSec`               | 1800    | 호출별 기본 제한 시간입니다.                                                                 |
| `tools.exec.cleanupMs`                | 1800000 | `OPENCLAW_BASH_JOB_TTL_MS`와 동일합니다.                                                     |
| `tools.exec.notifyOnExit`             | true    | 백그라운드 exec가 종료되면 시스템 이벤트를 큐에 추가하고 Heartbeat를 요청합니다.             |
| `tools.exec.notifyOnExitEmptySuccess` | false   | 출력 없이 성공한 백그라운드 실행에 대해서도 완료 이벤트를 큐에 추가합니다.                  |

## 자식 프로세스 연결

exec/process 도구 외부에서 장시간 실행되는 자식 프로세스(CLI 재실행, Gateway 헬퍼)를 생성할 때는 종료 신호가 전달되고 종료/오류 시 리스너가 분리되도록 자식 프로세스 브리지 헬퍼를 연결하세요. 이렇게 하면 systemd에서 고아 프로세스가 생기는 것을 방지하고 플랫폼 전반에서 일관된 종료 동작을 유지할 수 있습니다.

## process 도구

작업:

| 작업        | 효과                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------ |
| `list`      | 실행 중 + 완료된 세션입니다.                                                               |
| `poll`      | 세션의 새 출력을 비웁니다(종료 상태도 보고함).                                             |
| `log`       | 집계된 출력과 입력 복구 힌트를 읽습니다. `offset` + `limit`를 지원합니다.                   |
| `write`     | stdin을 전송합니다(`data`, 선택적 `eof`).                                                  |
| `send-keys` | PTY 기반 세션에 명시적인 키 토큰 또는 바이트를 전송합니다.                                 |
| `submit`    | PTY 기반 세션에 Enter/캐리지 리턴을 전송합니다.                                            |
| `paste`     | 리터럴 텍스트를 전송하며, 선택적으로 브래킷 붙여넣기 모드로 감쌉니다.                       |
| `kill`      | 백그라운드 세션을 종료합니다.                                                               |
| `clear`     | 완료된 세션을 메모리에서 제거합니다.                                                       |
| `remove`    | 실행 중이면 종료하고, 완료되었으면 지웁니다.                                               |

참고:

- 백그라운드 세션만 나열되고 유지됩니다. 디스크가 아닌 메모리에만 저장됩니다. 프로세스를 다시 시작하면 세션이 사라집니다.
- 활성 백그라운드 세션은 프로세스 소유자가 실제 종료를 확인할 때까지 협력적 호스트 일시 중단과 안전한 Gateway 재시작을 차단합니다.
- `process remove`는 종료를 요청한 직후 실행 중인 세션을 숨길 수 있지만, 종료가 확인될 때까지 일시 중단과 재시작은 계속 차단됩니다.
- 세션 로그는 `process poll`/`log`를 실행하여 도구 결과가 기록된 경우에만 채팅 기록에 저장됩니다.
- `process`의 범위는 에이전트별로 한정되며, 해당 에이전트가 시작한 세션만 볼 수 있습니다.
- 자동 완료 깨우기를 사용할 수 없는 경우 상태, 로그 또는 완료 확인을 위해 `poll`/`log`를 사용하세요.
- 대화형 CLI를 복구하기 전에 `log`를 사용하여 현재 기록, stdin 상태 및 입력 대기 힌트를 함께 확인하세요.
- 입력이나 개입이 필요할 때는 `write`/`send-keys`/`submit`/`paste`/`kill`을 사용하세요.
- 빠르게 훑어볼 수 있도록 `process list`에는 파생된 `name`(명령 동사 + 대상)이 포함됩니다.
- `process list`, `poll`, `log`는 세션에 여전히 쓰기 가능한 stdin이 있고 입력 대기 임계값(기본값 15000ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`)보다 오랫동안 유휴 상태인 경우에만 `waitingForInput`을 보고합니다.
- `process log`는 줄 기반 `offset`/`limit`를 사용합니다. 둘 다 생략하면 페이징 힌트와 함께 마지막 200줄을 반환합니다. `offset`이 설정되고 `limit`가 없으면 `offset`부터 끝까지 반환합니다(200줄로 제한되지 않음).
- `poll`의 `timeout`은 반환하기 전에 해당 밀리초만큼 기다리며, 30000보다 큰 값은 30000으로 제한됩니다.
- 폴링은 요청 시 상태 확인을 위한 것이지 대기 루프 예약을 위한 것이 아닙니다. 작업을 나중에 수행해야 한다면 Cron을 사용하세요.

## 예시

장시간 작업을 실행하고 나중에 폴링하기:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

입력을 보내기 전에 대화형 세션 검사하기:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

즉시 백그라운드에서 시작하기:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin 전송하기:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY 키 전송하기:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

현재 줄 제출하기:

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
