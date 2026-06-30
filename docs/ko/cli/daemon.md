---
read_when:
    - 스크립트에서는 여전히 `openclaw daemon ...`을 사용합니다
    - 서비스 라이프사이클 명령(install/start/stop/restart/status)이 필요합니다
summary: 'CLI 참조 문서: `openclaw daemon`(Gateway 서비스 관리를 위한 레거시 별칭)'
title: 데몬
x-i18n:
    generated_at: "2026-06-30T13:54:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
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

- `status`: 서비스 설치 상태를 표시하고 Gateway 상태를 프로브합니다
- `install`: 서비스 설치(`launchd`/`systemd`/`schtasks`)
- `uninstall`: 서비스 제거
- `start`: 서비스 시작
- `stop`: 서비스 중지
- `restart`: 서비스 재시작

## 공통 옵션

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- 수명 주기(`uninstall|start|stop`): `--json`

참고:

- `status`는 가능한 경우 프로브 인증을 위해 구성된 인증 SecretRef를 해석합니다.
- 필수 인증 SecretRef가 이 명령 경로에서 해석되지 않으면, 프로브 연결/인증이 실패할 때 `daemon status --json`이 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 시크릿 소스를 해석하세요.
- 프로브가 성공하면 오탐을 피하기 위해 해석되지 않은 auth-ref 경고가 억제됩니다.
- `status --deep`은 최선 노력 방식의 시스템 수준 서비스 스캔을 추가합니다. 다른 gateway 유사 서비스를 찾으면 사람이 읽는 출력에 정리 힌트를 출력하고, 머신당 하나의 gateway가 여전히 일반적인 권장 사항임을 경고합니다.
- `status --deep`은 Plugin 인식 모드에서 구성 검증도 실행하고, 구성된 Plugin 매니페스트 경고(예: 누락된 채널 구성 메타데이터)를 노출하여 설치 및 업데이트 스모크 검사에서 이를 잡을 수 있게 합니다. 기본 `status`는 Plugin 검증을 건너뛰는 빠른 읽기 전용 경로를 유지합니다.
- Linux systemd 설치에서 `status` 토큰 드리프트 검사는 `Environment=` 및 `EnvironmentFile=` 유닛 소스를 모두 포함합니다.
- 드리프트 검사는 병합된 런타임 env(서비스 명령 env가 먼저, 그다음 프로세스 env 폴백)를 사용하여 `gateway.auth.token` SecretRef를 해석합니다.
- 토큰 인증이 실질적으로 활성 상태가 아닌 경우(명시적 `gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, 모드가 설정되지 않았고 비밀번호가 우선될 수 있으며 어떤 토큰 후보도 우선될 수 없는 경우), 토큰 드리프트 검사는 구성 토큰 해석을 건너뜁니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `install`은 SecretRef를 해석할 수 있는지 검증하지만 해석된 토큰을 서비스 환경 메타데이터에 영구 저장하지 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해석되지 않으면 설치는 실패로 닫힙니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 설치가 차단됩니다.
- macOS에서 `install`은 LaunchAgent plist를 소유자 전용으로 유지하고, API 키나 인증 프로필 env ref를 `EnvironmentVariables`에 직렬화하는 대신 소유자 전용 파일과 래퍼를 통해 관리형 서비스 환경 값을 로드합니다.
- 의도적으로 하나의 호스트에서 여러 gateway를 실행하는 경우 포트, 구성/상태, 작업 공간을 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.
- `restart --safe`는 실행 중인 Gateway에 활성 작업을 사전 검사하고 활성 작업이 빠진 뒤 하나로 병합된 재시작을 예약하도록 요청합니다. 기본 안전 재시작은 구성된 `gateway.reload.deferralTimeoutMs`(기본값 5분)까지 활성 작업을 기다립니다. 해당 예산이 만료되면 재시작이 강제됩니다. 절대 강제하지 않는 무기한 안전 대기를 위해 `gateway.reload.deferralTimeoutMs`를 `0`으로 설정하세요. 일반 `restart`는 기존 서비스 관리자 동작을 유지합니다. `--force`는 즉시 재정의 경로로 유지됩니다.
- `restart --safe --skip-deferral`은 OpenClaw 인식 안전 재시작을 실행하지만 활성 작업 지연 게이트를 우회하므로, 차단 요소가 보고되더라도 Gateway가 즉시 재시작을 내보냅니다. 멈춘 작업 실행이 안전 재시작을 고정할 때의 운영자 탈출구입니다. `--safe`가 필요합니다.

## 권장

현재 문서와 예시는 [`openclaw gateway`](/ko/cli/gateway)를 사용하세요.

## 관련

- [CLI 참조](/ko/cli)
- [Gateway 런북](/ko/gateway)
