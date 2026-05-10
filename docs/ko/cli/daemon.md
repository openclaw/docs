---
read_when:
    - 스크립트에서 여전히 `openclaw daemon ...`을 사용합니다
    - 서비스 수명 주기 명령(install/start/stop/restart/status)이 필요합니다
summary: '`openclaw daemon`에 대한 CLI 참조(게이트웨이 서비스 관리를 위한 레거시 별칭)'
title: 데몬
x-i18n:
    generated_at: "2026-05-10T19:28:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 서비스 관리 명령의 레거시 별칭입니다.

`openclaw daemon ...`은 `openclaw gateway ...` 서비스 명령과 동일한 서비스 제어 표면에 매핑됩니다.

## 사용법

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 하위 명령

- `status`: 서비스 설치 상태를 표시하고 Gateway 상태를 검사합니다
- `install`: 서비스를 설치합니다(`launchd`/`systemd`/`schtasks`)
- `uninstall`: 서비스를 제거합니다
- `start`: 서비스를 시작합니다
- `stop`: 서비스를 중지합니다
- `restart`: 서비스를 다시 시작합니다

## 공통 옵션

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- 수명 주기(`uninstall|start|stop`): `--json`

참고:

- `status`는 가능할 때 검사 인증에 구성된 인증 SecretRefs를 해석합니다.
- 이 명령 경로에서 필수 인증 SecretRef가 해석되지 않은 경우, 검사 연결/인증이 실패하면 `daemon status --json`이 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 비밀 소스를 해석하세요.
- 검사가 성공하면 미해결 auth-ref 경고는 거짓 양성을 피하기 위해 표시되지 않습니다.
- `status --deep`은 최선 노력 방식의 시스템 수준 서비스 스캔을 추가합니다. 다른 gateway 유사 서비스를 찾으면 사람이 읽는 출력에 정리 힌트를 표시하고, 머신당 하나의 gateway가 여전히 일반적인 권장 사항임을 경고합니다.
- Linux systemd 설치에서 `status` 토큰 드리프트 검사는 `Environment=` 및 `EnvironmentFile=` 유닛 소스를 모두 포함합니다.
- 드리프트 검사는 병합된 런타임 env를 사용해 `gateway.auth.token` SecretRefs를 해석합니다(서비스 명령 env가 먼저, 그다음 프로세스 env 폴백).
- 토큰 인증이 실질적으로 활성 상태가 아닌 경우(명시적 `gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, 모드가 설정되지 않았고 비밀번호가 우선될 수 있으며 토큰 후보가 우선될 수 없는 경우), 토큰 드리프트 검사는 구성 토큰 해석을 건너뜁니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `install`은 SecretRef를 해석할 수 있는지 검증하지만 해석된 토큰을 서비스 환경 메타데이터에 유지하지 않습니다.
- 토큰 인증에 토큰이 필요하지만 구성된 토큰 SecretRef가 해석되지 않으면 설치는 실패 폐쇄됩니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 설치가 차단됩니다.
- macOS에서 `install`은 LaunchAgent plist를 소유자 전용으로 유지하고, API 키나 auth-profile env refs를 `EnvironmentVariables`에 직렬화하는 대신 소유자 전용 파일과 래퍼를 통해 관리형 서비스 환경 값을 로드합니다.
- 하나의 호스트에서 여러 gateways를 의도적으로 실행하는 경우 포트, 구성/상태, 워크스페이스를 격리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.
- `restart --safe`는 실행 중인 Gateway에 활성 작업을 사전 검사하고 활성 작업이 빠져나간 뒤 하나로 합쳐진 재시작을 예약하도록 요청합니다. 일반 `restart`는 기존 서비스 관리자 동작을 유지합니다. `--force`는 즉시 재정의 경로로 유지됩니다.
- `restart --safe --skip-deferral`은 OpenClaw 인식 안전 재시작을 실행하지만 활성 작업 지연 게이트를 우회하므로, 차단 요인이 보고되더라도 Gateway가 즉시 재시작을 내보냅니다. 멈춘 작업 실행이 안전 재시작을 고정할 때 사용하는 운영자 탈출구이며, `--safe`가 필요합니다.

## 권장

현재 문서와 예시는 [`openclaw gateway`](/ko/cli/gateway)를 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 런북](/ko/gateway)
