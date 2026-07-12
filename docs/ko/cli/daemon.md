---
read_when:
    - 스크립트에서 여전히 `openclaw daemon ...`을 사용합니다.
    - 서비스 수명 주기 명령어(설치/시작/중지/재시작/상태)가 필요합니다.
summary: '`openclaw daemon`의 CLI 참조(Gateway 서비스 관리를 위한 레거시 별칭)'
title: 데몬
x-i18n:
    generated_at: "2026-07-12T15:04:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 서비스 관리를 위한 레거시 별칭입니다. `openclaw daemon ...`은 `openclaw gateway ...`와 동일한 서비스 제어 명령에 매핑됩니다. 최신 문서와 예제에서는 [`openclaw gateway`](/ko/cli/gateway)를 사용하십시오.

## 사용법

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 하위 명령 및 옵션

| 하위 명령   | 옵션                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable`(launchd 전용: 다음 시작 시까지 KeepAlive/RunAtLoad를 지속적으로 억제)      |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: 서비스 설치 상태(launchd/systemd/schtasks)를 표시하고 Gateway 상태를 점검합니다.
- `install`: 서비스를 설치합니다. `--force`는 기존 설치를 다시 설치하거나 덮어씁니다.
- `restart --safe`: 실행 중인 Gateway에 활성 작업을 사전 점검하고 작업이 모두 종료된 후 하나로 병합된 재시작을 예약하도록 요청합니다. 대기 시간은 `gateway.reload.deferralTimeoutMs`로 제한됩니다(기본값 300000ms/5분, 무기한 대기하려면 `0`으로 설정). 이 제한 시간이 만료되면 재시작이 강제로 진행됩니다. 일반 `restart`는 서비스 관리자를 직접 사용하며, `--force`는 즉시 재시작하도록 재정의합니다.
- `restart --safe --skip-deferral`: 활성 작업 연기 게이트를 우회하여 차단 요소가 보고되더라도 Gateway를 즉시 재시작합니다. `--safe`가 필요합니다.

## 참고 사항

- `status`는 가능한 경우 점검 인증을 위해 구성된 인증 SecretRef를 확인합니다. 필수 SecretRef를 확인할 수 없으면 `status --json`은 `rpc.authWarning`을 보고합니다. `--token`/`--password`를 명시적으로 전달하거나 먼저 비밀 소스를 확인하십시오. 그 외에는 점검이 성공하면 확인되지 않은 인증 경고가 표시되지 않습니다.
- `status --deep`은 다른 Gateway 유사 서비스를 찾기 위한 최선형 시스템 수준 검사를 추가하고(정리 방법을 출력하며, 여전히 머신당 하나의 Gateway를 권장함) Plugin 인식 모드로 구성 검증을 실행하여 빠른 기본 경로에서 건너뛰는 Plugin 매니페스트 경고를 표시합니다.
- Linux systemd 설치에서는 토큰 불일치 검사가 `Environment=` 및 `EnvironmentFile=` 단위 소스를 모두 검사합니다.
- 토큰 불일치 검사는 병합된 런타임 환경(서비스 명령 환경 우선, 그다음 프로세스 환경)을 사용하여 `gateway.auth.token` SecretRef를 확인합니다. 토큰 인증이 실질적으로 활성화되지 않은 경우(`gateway.auth.mode`가 `password`/`none`/`trusted-proxy`이거나, 설정되지 않았으며 비밀번호가 우선 적용될 수 있는 경우) 구성 토큰 확인을 건너뜁니다.
- `install`은 SecretRef로 관리되는 `gateway.auth.token`을 확인할 수 있는지 검증하지만, 확인된 값을 서비스 환경 메타데이터에 절대 저장하지 않습니다. 확인할 수 없으면 설치가 안전하게 실패합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드를 명시적으로 설정할 때까지 `install`이 차단됩니다.
- macOS에서 `install`은 비밀을 `EnvironmentVariables`에 포함하는 대신 LaunchAgent plist와 생성된 환경 파일/래퍼를 소유자 전용(모드 `0600`/`0700`)으로 유지합니다.
- 하나의 호스트에서 여러 Gateway를 실행하려면 포트, 구성/상태 및 작업 공간을 분리하십시오. [여러 Gateway](/ko/gateway#multiple-gateways-same-host)를 참조하십시오.

## 관련 문서

- [CLI 참조](/ko/cli)
- [Gateway 운영 가이드](/ko/gateway)
