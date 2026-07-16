---
read_when:
    - Gateway 프로세스 실행 또는 디버깅
    - 단일 인스턴스 강제 적용 조사하기
summary: 'Gateway 싱글턴 보호: 파일 잠금 및 WebSocket/HTTP 바인딩'
title: Gateway 잠금
x-i18n:
    generated_at: "2026-07-16T12:37:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 이유

- 하나의 Gateway 프로세스만 상태 디렉터리를 소유해야 합니다. 추가 Gateway는 격리된 프로필, 상태 디렉터리, 구성 및 포트를 사용하여 실행하십시오.
- 비정상 종료/SIGKILL 후에도 오래된 잠금 파일이 남지 않도록 합니다.
- 다른 Gateway가 이미 포트를 소유하고 있으면 명확한 오류와 함께 즉시 실패합니다.

## 세 계층

시작 시 다음 세 단계에 따라 순서대로 소유권을 적용합니다.

1. **상태 소유권 잠금**은 정규 상태 디렉터리를 키로 사용하는 잠금을 획득합니다. `OPENCLAW_ALLOW_MULTI_GATEWAY=1`로 시작된 Gateway를 포함하여 모든 Gateway가 참여하므로, 파괴적인 SQLite 유지 관리 작업이 실행 중인 소유자와 경합할 수 없습니다.
2. **구성 잠금**은 기존의 구성별 잠금을 획득하고 런타임 포트를 기록합니다. 다중 Gateway 모드에서는 이 구성 싱글턴을 건너뛰지만 상태 소유권 잠금은 유지합니다.
3. **소켓 바인딩**은 HTTP/WebSocket 리스너(기본값 `ws://127.0.0.1:18789`)를 독점 TCP 리스너로 바인딩합니다.

각 계층은 독립적으로 실패할 수 있으며 자체 `GatewayLockError`을(를) 발생시킵니다.

### 상태 및 구성 잠금

- 잠금의 활성 여부는 기록된 PID, 사용 가능한 경우 플랫폼 프로세스 시작 ID, 그리고 Gateway 프로세스 ID를 통해 확인합니다. 검증된 소유자는 포트가 수신을 시작하기 전의 시작 과정에서도 권한을 유지합니다.
- 전용 SQLite 코디네이터가 메타데이터 검사, 오래된 소유자 회수 및 잠금 교체를 직렬화합니다. 소유 프로세스가 비정상 종료되면 독점 트랜잭션이 자동으로 해제됩니다.
- 잠금 파일이 없거나 기록된 소유자 프로세스가 종료된 경우, 시작 과정에서 잠금을 회수하고 계속 진행합니다.
- 두 잠금 중 하나라도 활성 상태로 유지되고 있으면 시작 과정에서 포기하기 전에 최대 5초(기본값) 동안 재시도합니다.

  ```text
  GatewayLockError("Gateway가 이미 실행 중입니다(pid <pid>). <ms>ms 후 잠금 시간이 초과되었습니다.")
  ```

### 소켓 바인딩

- `EADDRINUSE`에서는 최근 종료된 프로세스 이후의 `TIME_WAIT` 구간이 지나갈 때까지 기다리기 위해 500ms 간격으로 최대 20회(총 약 10초) 바인딩을 재시도합니다.
- 재시도 후에도 포트가 사용 중인 경우:

  ```text
  GatewayLockError("다른 Gateway 인스턴스가 이미 ws://127.0.0.1:<port>에서 수신 중입니다.")
  ```

- 기타 바인딩 실패:

  ```text
  GatewayLockError("ws://127.0.0.1:<port>에서 Gateway 소켓을 바인딩하지 못했습니다: <cause>")
  ```

종료 시 Gateway는 HTTP/WebSocket 서버를 닫고 상태 및 구성 잠금 파일을
제거합니다.

## 운영 참고 사항

- Gateway가 아닌 다른 프로세스가 포트를 점유한 경우에도 오류는 동일합니다. 포트를 비우거나 `openclaw gateway --port <port>`을(를) 사용하여 다른 포트를 선택하십시오.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1`은(는) 공유되는 변경 가능 상태가 아니라 여러 구성/런타임 인스턴스를 허용합니다. 각 인스턴스에는 여전히 고유한 `OPENCLAW_STATE_DIR`이(가) 필요합니다.
- 서비스 감독자 아래에서 위 오류 중 하나가 발생한 새 Gateway 프로세스는 먼저 기존 프로세스의 `/healthz`을(를) 조사합니다. 해당 프로세스가 정상이라면 새 프로세스는 실패하는 대신 기존 프로세스가 계속 제어하도록 둡니다. systemd에서는 코드 `78`로 종료됩니다. 유닛의 `RestartPreventExitStatus=78`은(는) 잠금 또는 `EADDRINUSE` 충돌로 인해 `Restart=always`이(가) 반복되는 것을 방지합니다. 기존 프로세스가 끝내 정상 상태가 되지 않으면 상태 조사 재시도는 제한된 시간 동안만 수행되며, 이후 시작 과정은 무한 반복하는 대신 위의 잠금 오류와 함께 실패합니다.
- macOS 앱은 Gateway를 생성하기 전에 자체적인 경량 PID 보호 장치를 유지합니다. 위의 파일 잠금과 소켓 바인딩이 실제 런타임 적용 수단입니다.

## 관련 문서

- [다중 Gateway](/ko/gateway/multiple-gateways) - 고유한 포트로 여러 인스턴스 실행
- [문제 해결](/ko/gateway/troubleshooting) - `EADDRINUSE` 및 포트 충돌 진단
