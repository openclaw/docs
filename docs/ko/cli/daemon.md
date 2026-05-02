---
read_when:
    - 여전히 스크립트에서 `openclaw daemon ...`을 사용하고 있습니다
    - 서비스 수명 주기 명령(install/start/stop/restart/status)이 필요합니다
summary: '`openclaw daemon`용 CLI 참조(Gateway 서비스 관리를 위한 레거시 별칭)'
title: 데몬
x-i18n:
    generated_at: "2026-05-02T22:17:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
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
- `restart`: `--force`, `--wait <duration>`, `--json`
- 수명 주기(`uninstall|start|stop`): `--json`

참고:

- `status`는 가능한 경우 프로브 인증을 위해 구성된 인증 SecretRefs를 확인합니다.
- 이 명령 경로에서 필요한 인증 SecretRef를 확인할 수 없으면, 프로브 연결/인증이 실패할 때 `daemon status --json`은 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 비밀 소스를 확인하세요.
- 프로브가 성공하면, 오탐을 피하기 위해 확인되지 않은 auth-ref 경고가 표시되지 않습니다.
- `status --deep`은 최선형 시스템 수준 서비스 스캔을 추가합니다. 다른 Gateway 유사 서비스를 찾으면, 사람이 읽는 출력은 정리 힌트를 표시하고 머신당 하나의 Gateway가 여전히 일반적인 권장 사항이라고 경고합니다.
- Linux systemd 설치에서 `status` 토큰 드리프트 검사는 `Environment=` 및 `EnvironmentFile=` 유닛 소스를 모두 포함합니다.
- 드리프트 검사는 병합된 런타임 env를 사용해 `gateway.auth.token` SecretRefs를 확인합니다. 서비스 명령 env를 먼저 사용하고, 그다음 프로세스 env로 폴백합니다.
- 토큰 인증이 실질적으로 활성화되어 있지 않으면(`password`/`none`/`trusted-proxy`의 명시적 `gateway.auth.mode`, 또는 암호가 우선할 수 있고 토큰 후보가 우선할 수 없는 상태에서 mode 미설정), 토큰 드리프트 검사는 구성 토큰 확인을 건너뜁니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `install`은 SecretRef를 확인할 수 있는지 검증하지만 확인된 토큰을 서비스 환경 메타데이터에 유지하지 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef를 확인할 수 없으면, 설치는 실패로 닫힙니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, mode가 명시적으로 설정될 때까지 설치가 차단됩니다.
- macOS에서 `install`은 LaunchAgent plists를 소유자 전용으로 유지하고, API 키나 auth-profile env refs를 `EnvironmentVariables`에 직렬화하는 대신 소유자 전용 파일과 래퍼를 통해 관리형 서비스 환경 값을 로드합니다.
- 하나의 호스트에서 의도적으로 여러 Gateway를 실행하는 경우, 포트, 구성/상태, 워크스페이스를 격리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참고하세요.

## 권장

현재 문서와 예제는 [`openclaw gateway`](/ko/cli/gateway)를 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 런북](/ko/gateway)
