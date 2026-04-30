---
read_when:
    - 연결/인증 문제가 있고 안내에 따라 해결하고 싶은 경우
    - 업데이트한 후 정상 동작 확인이 필요합니다
summary: '`openclaw doctor`에 대한 CLI 참조 (상태 점검 + 안내형 복구)'
title: 진단
x-i18n:
    generated_at: "2026-04-30T06:22:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway와 채널의 상태 점검 + 빠른 수정입니다.

관련:

- 문제 해결: [문제 해결](/ko/gateway/troubleshooting)
- 보안 감사: [보안](/ko/gateway/security)

## 예시

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## 옵션

- `--no-workspace-suggestions`: 워크스페이스 메모리/검색 제안을 비활성화합니다
- `--yes`: 확인 없이 기본값을 수락합니다
- `--repair`: 확인 없이 권장 복구를 적용합니다
- `--fix`: `--repair`의 별칭입니다
- `--force`: 필요할 때 사용자 지정 서비스 구성을 덮어쓰는 것을 포함해 적극적인 복구를 적용합니다
- `--non-interactive`: 프롬프트 없이 실행합니다. 안전한 마이그레이션만 수행합니다
- `--generate-gateway-token`: Gateway 토큰을 생성하고 구성합니다
- `--deep`: 추가 Gateway 설치를 찾기 위해 시스템 서비스를 스캔합니다

참고:

- 대화형 프롬프트(예: 키체인/OAuth 수정)는 stdin이 TTY이고 `--non-interactive`가 설정되지 **않은** 경우에만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)은 프롬프트를 건너뜁니다.
- 성능: 비대화형 `doctor` 실행은 헤드리스 상태 점검이 빠르게 유지되도록 즉시 Plugin 로드를 건너뜁니다. 대화형 세션은 검사에 Plugin 기여가 필요할 때 여전히 Plugin을 완전히 로드합니다.
- `--fix`(`--repair`의 별칭)는 `~/.openclaw/openclaw.json.bak`에 백업을 쓰고, 알 수 없는 구성 키를 삭제하며 각 제거 항목을 나열합니다.
- 상태 무결성 검사는 이제 세션 디렉터리의 고아 트랜스크립트 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 보관하려면 대화형 확인이 필요합니다. `--fix`, `--yes`, 헤드리스 실행은 이를 그대로 둡니다.
- Doctor는 레거시 cron 작업 형태를 찾기 위해 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)도 스캔하며, 스케줄러가 런타임에 자동 정규화해야 하기 전에 이를 제자리에서 다시 쓸 수 있습니다.
- Doctor는 패키징된 전역 설치에 쓰지 않고 누락된 번들 Plugin 런타임 의존성을 복구합니다. root 소유 npm 설치 또는 강화된 systemd 유닛의 경우 `OPENCLAW_PLUGIN_STAGE_DIR`을 `/var/lib/openclaw/plugin-runtime-deps` 같은 쓰기 가능한 디렉터리로 설정하세요. `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` 같은 경로 목록도 사용할 수 있으며, 앞쪽 루트는 읽기 전용 조회 계층이고 마지막 루트가 복구 대상입니다.
- Doctor는 Plugin 검색이 정상일 때 `plugins.allow`/`plugins.entries`에서 누락된 Plugin ID를 제거하고, 일치하는 매달린 채널 구성, Heartbeat 대상, 채널 모델 재정의도 제거하여 오래된 Plugin 구성을 복구합니다.
- Doctor는 영향을 받는 `plugins.entries.<id>` 항목을 비활성화하고 잘못된 `config` 페이로드를 제거하여 잘못된 Plugin 구성을 격리합니다. Gateway 시작은 이미 해당 잘못된 Plugin만 건너뛰므로 다른 Plugin과 채널은 계속 실행될 수 있습니다.
- 다른 슈퍼바이저가 Gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요. Doctor는 여전히 Gateway/서비스 상태를 보고하고 비서비스 복구를 적용하지만, 서비스 설치/시작/재시작/부트스트랩 및 레거시 서비스 정리는 건너뜁니다.
- Linux에서 doctor는 비활성 상태인 추가 Gateway 유사 systemd 유닛을 무시하며, 복구 중 실행 중인 systemd Gateway 서비스의 명령/진입점 메타데이터를 다시 쓰지 않습니다. 활성 런처를 의도적으로 교체하려면 먼저 서비스를 중지하거나 `openclaw gateway install --force`를 사용하세요.
- Doctor는 레거시 평면 Talk 구성(`talk.voiceId`, `talk.modelId` 등)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- `doctor --fix`를 반복 실행해도 유일한 차이가 객체 키 순서뿐이면 더 이상 Talk 정규화를 보고/적용하지 않습니다.
- Doctor에는 메모리 검색 준비 상태 검사가 포함되며, 임베딩 자격 증명이 없을 때 `openclaw configure --section model`을 권장할 수 있습니다.
- Doctor는 명령 소유자가 구성되지 않았을 때 경고합니다. 명령 소유자는 소유자 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 인간 운영자 계정입니다. DM 페어링은 누군가가 봇과 대화할 수 있게 해줄 뿐입니다. 첫 소유자 부트스트랩이 생기기 전에 발신자를 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하세요.
- 샌드박스 모드가 활성화되어 있지만 Docker를 사용할 수 없으면 doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 신호가 높은 경고를 보고합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되고 현재 명령 경로에서 사용할 수 없으면 doctor는 읽기 전용 경고를 보고하고 평문 대체 자격 증명을 쓰지 않습니다.
- 수정 경로에서 채널 SecretRef 검사가 실패하면 doctor는 조기 종료하지 않고 계속 진행하며 경고를 보고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없으면 doctor는 경고를 보고하고 해당 실행의 자동 확인을 건너뜁니다.

## macOS: `launchctl` 환경 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면 해당 값이 구성 파일을 재정의하여 지속적인 “unauthorized” 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
