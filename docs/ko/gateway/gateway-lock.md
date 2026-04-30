---
read_when:
    - Gateway 프로세스 실행 또는 디버깅
    - 단일 인스턴스 강제 적용 조사 중
summary: WebSocket 리스너 바인딩을 사용하는 Gateway 싱글턴 가드
title: Gateway 잠금
x-i18n:
    generated_at: "2026-04-30T06:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 이유

- 동일한 호스트의 같은 기본 포트에서 Gateway 인스턴스가 하나만 실행되도록 보장합니다. 추가 Gateway는 격리된 프로필과 고유한 포트를 사용해야 합니다.
- 오래된 잠금 파일을 남기지 않고 충돌/SIGKILL을 견딥니다.
- 제어 포트가 이미 사용 중이면 명확한 오류와 함께 빠르게 실패합니다.

## 메커니즘

- Gateway는 먼저 상태 잠금 디렉터리 아래의 구성별 잠금 파일을 획득하고, 구성된 포트에 기존 리스너가 있는지 검사합니다.
- 기록된 잠금 소유자가 사라졌거나, 포트가 비어 있거나, 잠금이 오래된 경우 시작 과정에서 잠금을 회수하고 계속 진행합니다.
- 그런 다음 Gateway는 배타적 TCP 리스너를 사용해 HTTP/WebSocket 리스너(기본값 `ws://127.0.0.1:18789`)를 바인딩합니다.
- 바인딩이 `EADDRINUSE`로 실패하면 시작 과정에서 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`를 발생시킵니다.
- 종료 시 Gateway는 HTTP/WebSocket 서버를 닫고 잠금 파일을 제거합니다.

## 오류 표면

- 다른 프로세스가 포트를 점유하고 있으면 시작 과정에서 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`를 발생시킵니다.
- 그 밖의 바인딩 실패는 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`로 표면화됩니다.

## 운영 참고 사항

- 포트가 _다른_ 프로세스에 의해 점유된 경우에도 오류는 동일합니다. 포트를 비우거나 `openclaw gateway --port <port>`로 다른 포트를 선택하세요.
- 서비스 슈퍼바이저 아래에서 정상 상태인 기존 `/healthz` 응답자를 발견한 새 Gateway 프로세스는 성공적으로 종료하고 해당 프로세스가 제어를 유지하도록 둡니다. 기존 프로세스가 정상 상태가 되지 않으면 재시도는 제한되며, 시작 과정은 무한히 반복하는 대신 명확한 잠금 오류로 실패합니다.
- macOS 앱은 Gateway를 생성하기 전에 여전히 자체적인 경량 PID 가드를 유지합니다. 런타임 잠금은 잠금 파일과 HTTP/WebSocket 바인딩으로 강제됩니다.

## 관련 항목

- [여러 Gateway](/ko/gateway/multiple-gateways) — 고유한 포트로 여러 인스턴스 실행
- [문제 해결](/ko/gateway/troubleshooting) — `EADDRINUSE` 및 포트 충돌 진단
