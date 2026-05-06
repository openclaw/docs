---
read_when:
    - 연결 또는 인증 문제가 있고 단계별 해결 안내를 원함
    - 업데이트 후 간단한 점검이 필요한 경우
summary: '`openclaw doctor`에 대한 CLI 참조(상태 검사 + 안내형 복구)'
title: 진단
x-i18n:
    generated_at: "2026-05-06T17:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 및 채널의 상태 검사와 빠른 수정.

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

- `--no-workspace-suggestions`: 워크스페이스 메모리/검색 제안 비활성화
- `--yes`: 프롬프트 없이 기본값 수락
- `--repair`: 프롬프트 없이 권장되는 비서비스 복구 적용. Gateway 서비스 설치 및 재작성은 여전히 대화형 확인 또는 명시적인 Gateway 명령이 필요함
- `--fix`: `--repair`의 별칭
- `--force`: 필요할 때 사용자 지정 서비스 설정 덮어쓰기를 포함해 적극적인 복구 적용
- `--non-interactive`: 프롬프트 없이 실행. 안전한 마이그레이션 및 비서비스 복구만 수행
- `--generate-gateway-token`: Gateway 토큰 생성 및 구성
- `--deep`: 추가 Gateway 설치를 찾기 위해 시스템 서비스를 스캔하고 최근 Gateway supervisor 재시작 핸드오프 보고

참고:

- Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 읽기 전용 doctor 검사는 계속 작동하지만, `openclaw.json`이 변경 불가능하므로 `doctor --fix`, `doctor --repair`, `doctor --yes`, `doctor --generate-gateway-token`은 비활성화됩니다. 대신 이 설치의 Nix 소스를 편집하세요. nix-openclaw의 경우 agent-first [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요.
- 대화형 프롬프트(예: keychain/OAuth 수정)는 stdin이 TTY이고 `--non-interactive`가 설정되지 않은 경우에만 실행됩니다. headless 실행(cron, Telegram, 터미널 없음)은 프롬프트를 건너뜁니다.
- 성능: 비대화형 `doctor` 실행은 즉시 Plugin 로딩을 건너뛰어 headless 상태 검사를 빠르게 유지합니다. 대화형 세션은 검사가 Plugin 기여를 필요로 할 때 여전히 Plugin을 완전히 로드합니다.
- `--fix`(`--repair`의 별칭)는 `~/.openclaw/openclaw.json.bak`에 백업을 쓰고 알 수 없는 설정 키를 제거하며, 각 제거 항목을 나열합니다.
- `doctor --fix --non-interactive`는 누락되었거나 오래된 Gateway 서비스 정의를 보고하지만 업데이트 복구 모드 밖에서는 설치하거나 재작성하지 않습니다. 서비스가 누락된 경우 `openclaw gateway install`을 실행하고, launcher를 의도적으로 교체하려면 `openclaw gateway install --force`를 실행하세요.
- 상태 무결성 검사는 이제 sessions 디렉터리의 고아 transcript 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 아카이브하려면 대화형 확인이 필요합니다. `--fix`, `--yes`, headless 실행은 그대로 둡니다.
- Doctor는 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)도 스캔하여 레거시 cron 작업 형태를 찾고, 스케줄러가 런타임에 자동 정규화하기 전에 제자리에서 재작성할 수 있습니다.
- Linux에서 doctor는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 실행할 때 경고합니다. 이 스크립트는 더 이상 유지 관리되지 않으며, cron에 systemd 사용자 버스 환경이 없을 때 잘못된 WhatsApp Gateway 중단을 기록할 수 있습니다.
- WhatsApp이 활성화된 경우 doctor는 로컬 `openclaw-tui` 클라이언트가 계속 실행 중인 상태에서 성능이 저하된 Gateway 이벤트 루프를 확인합니다. `doctor --fix`는 검증된 로컬 TUI 클라이언트만 중지하여 WhatsApp 응답이 오래된 TUI 새로 고침 루프 뒤에 대기하지 않도록 합니다.
- Doctor는 기본 모델, 폴백, heartbeat/subagent/compaction override, hook, 채널 모델 override, 오래된 세션 route pin 전반에서 레거시 `openai-codex/*` 모델 참조를 표준 `openai/*` 참조로 재작성합니다. `--fix`는 Codex Plugin이 설치되어 있고, 활성화되어 있으며, `codex` harness를 기여하고, 사용 가능한 OAuth가 있을 때만 `agentRuntime.id: "codex"`를 선택합니다. 그렇지 않으면 route가 기본 OpenClaw runner에 머물도록 `agentRuntime.id: "pi"`를 선택합니다.
- Doctor는 이전 OpenClaw 버전에서 생성된 레거시 Plugin 의존성 staging 상태를 정리합니다. 또한 `plugins.entries`, 구성된 채널, 구성된 provider/search 설정, 구성된 agent runtime처럼 설정에서 참조하는 누락된 다운로드 가능 Plugin도 복구합니다. 패키지 업데이트 중에는 패키지 교체가 완료될 때까지 doctor가 package-manager Plugin 복구를 건너뜁니다. 구성된 Plugin에 여전히 복구가 필요하면 이후 `openclaw doctor --fix`를 다시 실행하세요. 다운로드가 실패하면 doctor는 설치 오류를 보고하고 다음 복구 시도를 위해 구성된 Plugin 항목을 보존합니다.
- Doctor는 Plugin 탐색이 정상일 때 누락된 Plugin ID를 `plugins.allow`/`plugins.entries`에서 제거하고, 일치하는 dangling 채널 설정, Heartbeat 대상, 채널 모델 override도 함께 제거하여 오래된 Plugin 설정을 복구합니다.
- Doctor는 영향을 받는 `plugins.entries.<id>` 항목을 비활성화하고 잘못된 `config` payload를 제거하여 잘못된 Plugin 설정을 격리합니다. Gateway 시작은 이미 해당 잘못된 Plugin만 건너뛰므로 다른 Plugin과 채널은 계속 실행될 수 있습니다.
- 다른 supervisor가 Gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요. Doctor는 여전히 Gateway/서비스 상태를 보고하고 비서비스 복구를 적용하지만, 서비스 설치/시작/재시작/bootstrap 및 레거시 서비스 정리는 건너뜁니다.
- Linux에서 doctor는 비활성 추가 Gateway 유사 systemd unit을 무시하며, 복구 중 실행 중인 systemd Gateway 서비스의 command/entrypoint 메타데이터를 재작성하지 않습니다. 활성 launcher를 의도적으로 교체하려면 먼저 서비스를 중지하거나 `openclaw gateway install --force`를 사용하세요.
- Doctor는 레거시 flat Talk 설정(`talk.voiceId`, `talk.modelId` 등)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- 반복되는 `doctor --fix` 실행은 유일한 차이가 객체 키 순서뿐이면 더 이상 Talk 정규화를 보고/적용하지 않습니다.
- Doctor에는 메모리 검색 준비 상태 검사가 포함되며 embedding 자격 증명이 누락된 경우 `openclaw configure --section model`을 권장할 수 있습니다.
- Doctor는 command owner가 구성되지 않은 경우 경고합니다. command owner는 owner 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 사람 operator 계정입니다. DM pairing은 누군가가 bot과 대화할 수 있게만 합니다. first-owner bootstrap이 존재하기 전에 발신자를 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하세요.
- Doctor는 Codex 모드 agent가 구성되어 있고 operator의 Codex home에 개인 Codex CLI 자산이 있는 경우 경고합니다. 로컬 Codex app-server 실행은 agent별로 격리된 home을 사용하므로, 의도적으로 승격해야 하는 자산을 목록화하려면 `openclaw migrate codex --dry-run`을 사용하세요.
- Doctor는 기본 agent에 허용된 Skills가 bins, env vars, config, OS 요구 사항 누락 때문에 현재 런타임 환경에서 사용할 수 없는 경우 경고합니다. `doctor --fix`는 `skills.entries.<skill>.enabled=false`로 이러한 사용할 수 없는 Skills를 비활성화할 수 있습니다. 해당 Skills를 활성 상태로 유지하려면 대신 누락된 요구 사항을 설치/구성하세요.
- sandbox 모드가 활성화되어 있지만 Docker를 사용할 수 없는 경우 doctor는 remediation(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 핵심 경고를 보고합니다.
- 레거시 sandbox registry 파일(`~/.openclaw/sandbox/containers.json` 또는 `~/.openclaw/sandbox/browsers.json`)이 있는 경우 doctor가 이를 보고합니다. `openclaw doctor --fix`는 유효한 항목을 sharded registry 디렉터리로 마이그레이션하고 잘못된 레거시 파일을 격리합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되고 현재 명령 경로에서 사용할 수 없는 경우 doctor는 읽기 전용 경고를 보고하고 평문 fallback 자격 증명을 쓰지 않습니다.
- fix 경로에서 채널 SecretRef 검사가 실패하면 doctor는 조기 종료하지 않고 계속 진행하며 경고를 보고합니다.
- 상태 디렉터리 마이그레이션 후 활성화된 기본 Telegram 또는 Discord 계정이 env fallback에 의존하고 `TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`을 doctor 프로세스에서 사용할 수 없는 경우 doctor가 경고합니다.
- Telegram `allowFrom` username 자동 해석(`doctor --fix`)에는 현재 명령 경로에서 해석 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없는 경우 doctor는 경고를 보고하고 해당 pass의 자동 해석을 건너뜁니다.

## macOS: `launchctl` env override

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)을 실행했다면, 해당 값이 설정 파일보다 우선하며 지속적인 "unauthorized" 오류를 유발할 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 진단](/ko/gateway/doctor)
