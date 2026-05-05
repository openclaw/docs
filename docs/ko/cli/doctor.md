---
read_when:
    - 연결/인증 문제가 있으며 안내에 따라 해결하고 싶은 경우
    - 업데이트 후 정상 여부를 확인하려는 경우
summary: '`openclaw doctor`용 CLI 참조(상태 점검 + 안내형 복구)'
title: 진단
x-i18n:
    generated_at: "2026-05-05T01:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 및 채널을 위한 상태 점검 + 빠른 수정.

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

- `--no-workspace-suggestions`: 워크스페이스 메모리/검색 제안을 비활성화합니다
- `--yes`: 묻지 않고 기본값을 수락합니다
- `--repair`: 묻지 않고 권장되는 비서비스 수리를 적용합니다. Gateway 서비스 설치 및 재작성에는 여전히 대화형 확인 또는 명시적인 Gateway 명령이 필요합니다
- `--fix`: `--repair`의 별칭입니다
- `--force`: 필요할 때 사용자 지정 서비스 설정 덮어쓰기를 포함해 공격적인 수리를 적용합니다
- `--non-interactive`: 프롬프트 없이 실행합니다. 안전한 마이그레이션과 비서비스 수리만 수행합니다
- `--generate-gateway-token`: Gateway 토큰을 생성하고 설정합니다
- `--deep`: 추가 Gateway 설치를 찾기 위해 시스템 서비스를 스캔합니다

참고:

- 대화형 프롬프트(예: 키체인/OAuth 수정)는 stdin이 TTY이고 `--non-interactive`가 설정되어 있지 않을 때만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)은 프롬프트를 건너뜁니다.
- 성능: 비대화형 `doctor` 실행은 헤드리스 상태 점검을 빠르게 유지하기 위해 즉시 Plugin 로드를 건너뜁니다. 대화형 세션은 점검에 Plugin 기여가 필요할 때 여전히 Plugin을 완전히 로드합니다.
- `--fix`(`--repair`의 별칭)는 `~/.openclaw/openclaw.json.bak`에 백업을 작성하고 알 수 없는 설정 키를 제거하며, 각 제거 항목을 나열합니다.
- `doctor --fix --non-interactive`는 누락되었거나 오래된 Gateway 서비스 정의를 보고하지만, 업데이트 수리 모드 밖에서는 설치하거나 재작성하지 않습니다. 누락된 서비스에는 `openclaw gateway install`을 실행하고, 런처를 의도적으로 교체하려면 `openclaw gateway install --force`를 실행하세요.
- 상태 무결성 점검은 이제 세션 디렉터리의 고아 트랜스크립트 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 아카이브하려면 대화형 확인이 필요합니다. `--fix`, `--yes`, 헤드리스 실행은 이를 그대로 둡니다.
- Doctor는 또한 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)에서 레거시 Cron 작업 형태를 스캔하고, 스케줄러가 런타임에 자동 정규화해야 하기 전에 제자리에서 재작성할 수 있습니다.
- Linux에서 doctor는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 실행할 때 경고합니다. 이 스크립트는 더 이상 유지 관리되지 않으며 Cron에 systemd 사용자 버스 환경이 없을 때 잘못된 WhatsApp Gateway 중단 로그를 남길 수 있습니다.
- Doctor는 이전 OpenClaw 버전이 만든 레거시 Plugin 의존성 스테이징 상태를 정리합니다. 또한 `plugins.entries`, 설정된 채널, 설정된 provider/검색 설정, 설정된 에이전트 런타임처럼 설정에서 참조하는 다운로드 가능한 Plugin이 누락된 경우 이를 복구합니다. 패키지 업데이트 중에는 패키지 교체가 완료될 때까지 doctor가 패키지 관리자 Plugin 복구를 건너뜁니다. 설정된 Plugin에 여전히 복구가 필요하면 이후 `openclaw doctor --fix`를 다시 실행하세요. 다운로드가 실패하면 doctor는 설치 오류를 보고하고 다음 수리 시도를 위해 설정된 Plugin 항목을 보존합니다.
- Doctor는 Plugin 탐색이 정상일 때 `plugins.allow`/`plugins.entries`에서 누락된 Plugin ID와 일치하는 dangling 채널 설정, Heartbeat 대상, 채널 모델 재정의를 제거하여 오래된 Plugin 설정을 복구합니다.
- Doctor는 영향을 받은 `plugins.entries.<id>` 항목을 비활성화하고 잘못된 `config` 페이로드를 제거하여 유효하지 않은 Plugin 설정을 격리합니다. Gateway 시작은 이미 해당 잘못된 Plugin만 건너뛰므로 다른 Plugin과 채널은 계속 실행될 수 있습니다.
- 다른 supervisor가 Gateway 수명 주기를 소유할 때는 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요. Doctor는 여전히 Gateway/서비스 상태를 보고하고 비서비스 수리를 적용하지만, 서비스 설치/시작/재시작/부트스트랩과 레거시 서비스 정리를 건너뜁니다.
- Linux에서 doctor는 비활성 추가 Gateway 유사 systemd 유닛을 무시하며, 수리 중 실행 중인 systemd Gateway 서비스의 명령/엔트리포인트 메타데이터를 재작성하지 않습니다. 활성 런처를 의도적으로 교체하려면 먼저 서비스를 중지하거나 `openclaw gateway install --force`를 사용하세요.
- Doctor는 레거시 플랫 Talk 설정(`talk.voiceId`, `talk.modelId` 및 관련 항목)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- `doctor --fix` 반복 실행은 유일한 차이가 객체 키 순서뿐일 때 더 이상 Talk 정규화를 보고/적용하지 않습니다.
- Doctor에는 메모리 검색 준비 상태 점검이 포함되며, 임베딩 자격 증명이 누락된 경우 `openclaw configure --section model`을 권장할 수 있습니다.
- Doctor는 명령 소유자가 설정되어 있지 않을 때 경고합니다. 명령 소유자는 소유자 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 사람 운영자 계정입니다. DM 페어링은 누군가가 봇과 대화할 수 있게 할 뿐입니다. 첫 소유자 부트스트랩이 생기기 전에 발신자를 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하세요.
- Doctor는 Codex 모드 에이전트가 설정되어 있고 운영자의 Codex 홈에 개인 Codex CLI 자산이 존재할 때 경고합니다. 로컬 Codex 앱 서버 실행은 에이전트별로 격리된 홈을 사용하므로, 의도적으로 승격해야 하는 자산을 인벤터리하려면 `openclaw migrate codex --dry-run`을 사용하세요.
- Doctor는 기본 에이전트에 허용된 Skills가 bin, env var, 설정 또는 OS 요구 사항 누락으로 인해 현재 런타임 환경에서 사용할 수 없을 때 경고합니다. `doctor --fix`는 `skills.entries.<skill>.enabled=false`로 사용할 수 없는 Skills를 비활성화할 수 있습니다. 해당 Skills를 활성 상태로 유지하려면 대신 누락된 요구 사항을 설치/설정하세요.
- 샌드박스 모드가 활성화되어 있지만 Docker를 사용할 수 없는 경우, doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)이 포함된 고신호 경고를 보고합니다.
- 레거시 샌드박스 레지스트리 파일(`~/.openclaw/sandbox/containers.json` 또는 `~/.openclaw/sandbox/browsers.json`)이 있으면 doctor가 이를 보고합니다. `openclaw doctor --fix`는 유효한 항목을 샤딩된 레지스트리 디렉터리로 마이그레이션하고 유효하지 않은 레거시 파일을 격리합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되고 현재 명령 경로에서 사용할 수 없는 경우, doctor는 읽기 전용 경고를 보고하고 일반 텍스트 대체 자격 증명을 쓰지 않습니다.
- 수정 경로에서 채널 SecretRef 검사가 실패하면 doctor는 일찍 종료하는 대신 계속 진행하고 경고를 보고합니다.
- 상태 디렉터리 마이그레이션 후, 활성화된 기본 Telegram 또는 Discord 계정이 env 대체에 의존하지만 doctor 프로세스에서 `TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`을 사용할 수 없으면 doctor가 경고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없으면 doctor는 경고를 보고하고 해당 실행에서는 자동 확인을 건너뜁니다.

## macOS: `launchctl` env 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면, 그 값이 설정 파일을 재정의하여 지속적인 “unauthorized” 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
