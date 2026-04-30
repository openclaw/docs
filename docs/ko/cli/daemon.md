---
read_when:
    - 스크립트에서 아직 `openclaw daemon ...`을 사용하고 있습니다
    - 서비스 수명 주기 명령(install/start/stop/restart/status)이 필요합니다
summary: '`openclaw daemon`에 대한 CLI 참조(Gateway 서비스 관리를 위한 레거시 별칭)'
title: 데몬
x-i18n:
    generated_at: "2026-04-30T06:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
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
- `install`: 서비스 설치(`launchd`/`systemd`/`schtasks`)
- `uninstall`: 서비스 제거
- `start`: 서비스 시작
- `stop`: 서비스 중지
- `restart`: 서비스 재시작

## 공통 옵션

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- 수명 주기(`uninstall|start|stop|restart`): `--json`

참고:

- `status`는 가능한 경우 검사 인증을 위해 구성된 인증 SecretRef를 확인합니다.
- 이 명령 경로에서 필요한 인증 SecretRef가 확인되지 않은 경우, 검사 연결/인증이 실패하면 `daemon status --json`은 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 시크릿 소스를 확인하세요.
- 검사가 성공하면 거짓 양성을 피하기 위해 확인되지 않은 auth-ref 경고가 억제됩니다.
- `status --deep`은 최선의 시스템 수준 서비스 스캔을 추가합니다. 다른 gateway 유사 서비스를 찾으면, 사람이 읽는 출력은 정리 힌트를 출력하고 머신당 하나의 gateway가 여전히 일반적인 권장 사항임을 경고합니다.
- Linux systemd 설치에서 `status` 토큰 드리프트 검사는 `Environment=` 및 `EnvironmentFile=` 유닛 소스를 모두 포함합니다.
- 드리프트 검사는 병합된 런타임 env(먼저 서비스 명령 env, 그다음 프로세스 env 폴백)를 사용해 `gateway.auth.token` SecretRef를 확인합니다.
- 토큰 인증이 실질적으로 활성 상태가 아닌 경우(명시적 `gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, 모드가 설정되지 않았고 password가 우선될 수 있으며 토큰 후보가 우선될 수 없는 경우) 토큰 드리프트 검사는 config 토큰 확인을 건너뜁니다.
- 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, `install`은 SecretRef를 확인할 수 있는지 검증하지만 확인된 토큰을 서비스 환경 메타데이터에 유지하지 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 확인되지 않으면, 설치는 닫힌 상태로 실패합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 설치가 차단됩니다.
- macOS에서 `install`은 LaunchAgent plist를 소유자 전용으로 유지하고, API 키 또는 auth-profile env ref를 `EnvironmentVariables`에 직렬화하는 대신 소유자 전용 파일과 래퍼를 통해 관리형 서비스 환경 값을 로드합니다.
- 한 호스트에서 여러 gateway를 의도적으로 실행하는 경우 포트, config/state, 워크스페이스를 격리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.

## 권장

현재 문서와 예제는 [`openclaw gateway`](/ko/cli/gateway)를 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 런북](/ko/gateway)
