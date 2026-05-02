---
read_when:
    - 연결/인증 문제가 있어 안내에 따른 해결 방법을 원합니다
    - 업데이트 후 정상 여부를 확인하고 싶을 때
summary: '`openclaw doctor`의 CLI 참조(상태 점검 + 안내형 복구)'
title: 진단
x-i18n:
    generated_at: "2026-05-02T20:44:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway와 채널을 위한 상태 검사 + 빠른 수정.

관련 항목:

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

- `--no-workspace-suggestions`: 작업 공간 메모리/검색 제안 비활성화
- `--yes`: 묻지 않고 기본값 수락
- `--repair`: 묻지 않고 권장 비서비스 복구 적용. Gateway 서비스 설치 및 재작성에는 여전히 대화형 확인 또는 명시적 Gateway 명령이 필요함
- `--fix`: `--repair`의 별칭
- `--force`: 필요할 때 사용자 지정 서비스 구성을 덮어쓰는 것을 포함해 적극적인 복구 적용
- `--non-interactive`: 프롬프트 없이 실행. 안전한 마이그레이션 및 비서비스 복구만 수행
- `--generate-gateway-token`: Gateway 토큰 생성 및 구성
- `--deep`: 추가 Gateway 설치를 찾기 위해 시스템 서비스 스캔

참고:

- 대화형 프롬프트(예: 키체인/OAuth 수정)는 stdin이 TTY이고 `--non-interactive`가 설정되지 **않은** 경우에만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)은 프롬프트를 건너뜁니다.
- 성능: 비대화형 `doctor` 실행은 헤드리스 상태 검사가 빠르게 유지되도록 즉시 Plugin 로딩을 건너뜁니다. 대화형 세션은 검사에 Plugin의 기여가 필요할 때 여전히 Plugin을 완전히 로드합니다.
- `--fix`(`--repair`의 별칭)는 `~/.openclaw/openclaw.json.bak`에 백업을 쓰고 알 수 없는 구성 키를 제거하며, 각 제거 항목을 나열합니다.
- `doctor --fix --non-interactive`는 누락되었거나 오래된 Gateway 서비스 정의를 보고하지만, 업데이트 복구 모드 밖에서는 이를 설치하거나 재작성하지 않습니다. 누락된 서비스에는 `openclaw gateway install`을 실행하고, 런처를 의도적으로 교체하려는 경우에는 `openclaw gateway install --force`를 실행하세요.
- 상태 무결성 검사는 이제 세션 디렉터리의 고아 transcript 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 아카이브하려면 대화형 확인이 필요합니다. `--fix`, `--yes`, 헤드리스 실행은 이를 그대로 둡니다.
- Doctor는 또한 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)에서 레거시 cron 작업 형태를 스캔하고, 스케줄러가 런타임에 자동 정규화해야 하기 전에 이를 제자리에서 재작성할 수 있습니다.
- Linux에서 doctor는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 실행할 때 경고합니다. 해당 스크립트는 더 이상 유지 관리되지 않으며 cron에 systemd 사용자 버스 환경이 없을 때 잘못된 WhatsApp Gateway 장애를 로그로 남길 수 있습니다.
- Doctor는 이전 OpenClaw 버전에서 생성된 레거시 Plugin 의존성 스테이징 상태를 정리합니다. 또한 레지스트리가 이를 확인할 수 있을 때 누락된 구성된 다운로드 가능 Plugin을 복구하며, 2026.5.2 doctor 패스는 해당 릴리스에 대해 구성이 변경된 것으로 표시하기 전에 이전 구성이 이미 사용하는 다운로드 가능 Plugin을 자동으로 설치합니다.
- Doctor는 `plugins.allow`/`plugins.entries`에서 누락된 Plugin ID를 제거하고, Plugin 검색이 정상일 때 일치하는 고아 채널 구성, Heartbeat 대상, 채널 모델 오버라이드를 제거하여 오래된 Plugin 구성을 복구합니다.
- Doctor는 영향을 받는 `plugins.entries.<id>` 항목을 비활성화하고 유효하지 않은 `config` 페이로드를 제거하여 잘못된 Plugin 구성을 격리합니다. Gateway 시작은 이미 해당 잘못된 Plugin만 건너뛰므로 다른 Plugin과 채널은 계속 실행될 수 있습니다.
- 다른 supervisor가 Gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요. Doctor는 계속 Gateway/서비스 상태를 보고하고 비서비스 복구를 적용하지만, 서비스 설치/시작/재시작/bootstrap 및 레거시 서비스 정리를 건너뜁니다.
- Linux에서 doctor는 비활성 추가 Gateway 유사 systemd 유닛을 무시하고, 복구 중 실행 중인 systemd Gateway 서비스의 명령/엔트리포인트 메타데이터를 재작성하지 않습니다. 활성 런처를 의도적으로 교체하려면 먼저 서비스를 중지하거나 `openclaw gateway install --force`를 사용하세요.
- Doctor는 레거시 플랫 Talk 구성(`talk.voiceId`, `talk.modelId` 등)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- 반복되는 `doctor --fix` 실행은 유일한 차이가 객체 키 순서일 때 더 이상 Talk 정규화를 보고/적용하지 않습니다.
- Doctor에는 메모리 검색 준비 상태 검사가 포함되며, 임베딩 자격 증명이 누락된 경우 `openclaw configure --section model`을 권장할 수 있습니다.
- Doctor는 명령 소유자가 구성되지 않았을 때 경고합니다. 명령 소유자는 소유자 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 인간 운영자 계정입니다. DM 페어링은 누군가가 봇과 대화할 수 있게 할 뿐입니다. 첫 소유자 bootstrap이 존재하기 전에 보낸 사람을 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하세요.
- Doctor는 Codex 모드 에이전트가 구성되어 있고 운영자의 Codex 홈에 개인 Codex CLI 자산이 있을 때 경고합니다. 로컬 Codex 앱 서버 실행은 격리된 에이전트별 홈을 사용하므로, 의도적으로 승격해야 할 자산을 인벤토리하려면 `openclaw migrate codex --dry-run`을 사용하세요.
- Doctor는 기본 에이전트에 허용된 Skills가 bin, env var, 구성 또는 OS 요구 사항 누락으로 인해 현재 런타임 환경에서 사용할 수 없을 때 경고합니다. `doctor --fix`는 사용할 수 없는 해당 Skills를 `skills.entries.<skill>.enabled=false`로 비활성화할 수 있습니다. Skills를 활성 상태로 유지하려면 대신 누락된 요구 사항을 설치/구성하세요.
- 샌드박스 모드가 활성화되었지만 Docker를 사용할 수 없는 경우 doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 높은 신호의 경고를 보고합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되고 현재 명령 경로에서 사용할 수 없는 경우, doctor는 읽기 전용 경고를 보고하며 평문 대체 자격 증명을 쓰지 않습니다.
- 수정 경로에서 채널 SecretRef 검사가 실패하면 doctor는 조기에 종료하지 않고 계속 진행하며 경고를 보고합니다.
- 상태 디렉터리 마이그레이션 후, 활성화된 기본 Telegram 또는 Discord 계정이 env fallback에 의존하고 `TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`을 doctor 프로세스에서 사용할 수 없을 때 doctor가 경고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없으면 doctor는 경고를 보고하고 해당 패스의 자동 확인을 건너뜁니다.

## macOS: `launchctl` env 오버라이드

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면, 해당 값이 구성 파일을 오버라이드하여 지속적인 “unauthorized” 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
