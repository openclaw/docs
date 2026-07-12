---
read_when:
    - Gateway 프로세스 실행 또는 디버깅
    - 단일 인스턴스 강제 적용 조사하기
summary: 'Gateway 싱글턴 보호: 파일 잠금 및 WebSocket/HTTP 바인딩'
title: Gateway 잠금
x-i18n:
    generated_at: "2026-07-12T00:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 이유

- 호스트에서 지정된 구성과 포트는 하나의 Gateway 프로세스만 소유해야 합니다. Gateway를 추가로 실행하려면 격리된 프로필과 고유한 포트를 사용하세요.
- 오래된 잠금 파일을 남기지 않고 충돌이나 `SIGKILL`을 견딥니다.
- 다른 Gateway가 이미 포트를 소유하고 있으면 명확한 오류와 함께 즉시 실패합니다.

## 두 계층

시작 시 다음 두 가지 독립적인 단계를 순서대로 수행하여 단일 인스턴스 소유권을 적용합니다.

1. **파일 잠금**은 상태 잠금 디렉터리에서 구성별 잠금 파일을 획득합니다. 잠금을 획득하는 과정에서 구성된 포트에 활성 리스너가 있는지 확인하여 오래된(충돌한) 잠금 소유자를 감지합니다.
2. **소켓 바인딩**은 HTTP/WebSocket 리스너(기본값 `ws://127.0.0.1:18789`)를 배타적 TCP 리스너로 바인딩합니다.

각 계층은 독립적으로 실패할 수 있으며 각각 자체 `GatewayLockError`를 발생시킵니다.

### 파일 잠금

- 잠금 파일이 없거나, 기록된 소유자 프로세스가 종료되었거나, 소유자의 포트 확인 결과 활성 리스너가 없으면 시작 과정에서 잠금을 회수하고 계속 진행합니다.
- 잠금이 현재 사용 중이고 위 조건 중 어느 것도 해당하지 않으면 시작 과정에서 포기하기 전에 최대 5초(기본값) 동안 재시도합니다.

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### 소켓 바인딩

- `EADDRINUSE`가 발생하면 최근 종료된 프로세스의 `TIME_WAIT` 기간이 끝날 때까지 기다리기 위해 시작 과정에서 500ms 간격으로 최대 20회(총 약 10초) 바인딩을 재시도합니다.
- 재시도 후에도 포트가 사용 중이면 다음 오류가 발생합니다.

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- 기타 바인딩 실패:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

종료 시 Gateway는 HTTP/WebSocket 서버를 닫고 잠금 파일을 제거합니다.

## 운영 참고 사항

- Gateway가 아닌 다른 프로세스가 포트를 점유한 경우에도 같은 오류가 발생합니다. 포트를 비우거나 `openclaw gateway --port <port>`로 다른 포트를 선택하세요.
- 서비스 관리자의 감독하에서 위 오류 중 하나가 발생한 새 Gateway 프로세스는 먼저 기존 프로세스의 `/healthz`를 확인합니다. 해당 프로세스가 정상 상태이면 새 프로세스는 실패하는 대신 기존 프로세스가 계속 제어하도록 둡니다. systemd에서는 종료 코드 `78`로 종료되며, 유닛의 `RestartPreventExitStatus=78`은 잠금 또는 `EADDRINUSE` 충돌로 인해 `Restart=always`가 반복 실행되는 것을 방지합니다. 기존 프로세스가 끝내 정상 상태가 되지 않으면 상태 확인 재시도는 제한된 시간 동안만 수행되고, 이후 시작 과정은 무한 반복하는 대신 위의 잠금 오류와 함께 실패합니다.
- macOS 앱은 Gateway를 생성하기 전에 자체 경량 PID 보호 기능을 유지합니다. 위의 파일 잠금과 소켓 바인딩이 실제 런타임 적용 수단입니다.

## 관련 문서

- [여러 Gateway](/ko/gateway/multiple-gateways) - 고유한 포트로 여러 인스턴스 실행
- [문제 해결](/ko/gateway/troubleshooting) - `EADDRINUSE` 및 포트 충돌 진단
