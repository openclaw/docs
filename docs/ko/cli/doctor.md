---
read_when:
    - 연결/auth 문제가 있어 안내형 수정이 필요함
    - 업데이트를 마쳤고 정상 동작 확인이 필요함
summary: '`openclaw doctor`용 CLI 참조(상태 점검 + 안내형 복구)'
title: doctor
x-i18n:
    generated_at: "2026-04-23T14:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway 및 채널용 상태 점검 + 빠른 수정.

관련 항목:

- 문제 해결: [Troubleshooting](/ko/gateway/troubleshooting)
- 보안 감사: [Security](/ko/gateway/security)

## 예시

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## 옵션

- `--no-workspace-suggestions`: workspace 메모리/검색 제안을 비활성화
- `--yes`: 프롬프트 없이 기본값 수락
- `--repair`: 프롬프트 없이 권장 수정 적용
- `--fix`: `--repair`의 별칭
- `--force`: 필요 시 사용자 지정 서비스 config 덮어쓰기를 포함한 적극적인 수정 적용
- `--non-interactive`: 프롬프트 없이 실행, 안전한 마이그레이션만 수행
- `--generate-gateway-token`: gateway 토큰 생성 및 구성
- `--deep`: 시스템 서비스를 스캔하여 추가 gateway 설치 확인

참고:

- 대화형 프롬프트(예: 키체인/OAuth 수정)는 stdin이 TTY이고 `--non-interactive`가 **설정되지 않은 경우에만** 실행됩니다. 헤드리스 실행(Cron, Telegram, 터미널 없음)에서는 프롬프트를 건너뜁니다.
- 성능: non-interactive `doctor` 실행은 eager Plugin 로딩을 건너뛰므로 헤드리스 상태 점검이 빠르게 유지됩니다. 대화형 세션에서는 검사에 Plugin 기여가 필요할 때 여전히 Plugin을 완전히 로드합니다.
- `--fix`(`--repair`의 별칭)는 백업을 `~/.openclaw/openclaw.json.bak`에 기록하고, 알 수 없는 config 키를 제거하며, 제거한 각 항목을 나열합니다.
- 이제 상태 무결성 검사는 세션 디렉터리의 orphan transcript 파일을 감지하며, 공간을 안전하게 회수하기 위해 이를 `.deleted.<timestamp>`로 보관할 수 있습니다.
- Doctor는 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)도 스캔하여 레거시 Cron 작업 형태를 확인하고, 스케줄러가 런타임에 자동 정규화하기 전에 그 자리에서 다시 쓸 수 있습니다.
- Doctor는 설치된 OpenClaw 패키지에 대한 쓰기 권한 없이도 누락된 번들 Plugin 런타임 의존성을 복구합니다. 루트 소유 npm 설치 또는 강화된 systemd 유닛의 경우, `/var/lib/openclaw/plugin-runtime-deps` 같은 쓰기 가능한 디렉터리로 `OPENCLAW_PLUGIN_STAGE_DIR`를 설정하세요.
- Doctor는 레거시 평면 Talk config(`talk.voiceId`, `talk.modelId` 등)를 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- 반복된 `doctor --fix` 실행은 차이가 객체 키 순서뿐인 경우 더 이상 Talk 정규화를 보고하거나 적용하지 않습니다.
- Doctor에는 memory-search 준비 상태 검사가 포함되어 있으며, 임베딩 자격 증명이 없으면 `openclaw configure --section model`을 권장할 수 있습니다.
- sandbox 모드가 활성화되어 있지만 Docker를 사용할 수 없으면, doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 신호가 강한 경고를 보고합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되고 현재 명령 경로에서 사용할 수 없으면, doctor는 읽기 전용 경고를 보고하며 평문 fallback 자격 증명을 쓰지 않습니다.
- 채널 SecretRef 검사가 수정 경로에서 실패하면, doctor는 조기 종료하는 대신 계속 진행하며 경고를 보고합니다.
- Telegram `allowFrom` 사용자명 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없으면, doctor는 경고를 보고하고 해당 실행에서는 자동 확인을 건너뜁니다.

## macOS: `launchctl` env 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면, 해당 값이 config 파일보다 우선 적용되어 지속적인 “unauthorized” 오류를 유발할 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
