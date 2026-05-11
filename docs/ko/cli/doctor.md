---
read_when:
    - 연결/인증 문제가 있고 안내에 따른 해결을 원합니다
    - 업데이트했으며 기본 점검을 원합니다
summary: '`openclaw doctor`에 대한 CLI 참조 (상태 점검 + 안내형 복구)'
title: 진단
x-i18n:
    generated_at: "2026-05-11T20:26:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

채널별 권한에는 `doctor` 대신 채널 프로브를 사용하세요.

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

대상 Discord 기능 프로브는 봇의 실제 채널 권한을 보고합니다. 상태 프로브는 구성된 Discord 채널과 음성 자동 참가 대상을 감사합니다.

## 옵션

- `--no-workspace-suggestions`: 작업 공간 메모리/검색 제안 비활성화
- `--yes`: 프롬프트 없이 기본값 수락
- `--repair`: 프롬프트 없이 권장 비서비스 수리 적용. Gateway 서비스 설치 및 재작성에는 여전히 대화형 확인 또는 명시적인 Gateway 명령이 필요합니다.
- `--fix`: `--repair`의 별칭
- `--force`: 필요할 때 사용자 지정 서비스 구성을 덮어쓰는 것을 포함해 공격적인 수리 적용
- `--non-interactive`: 프롬프트 없이 실행. 안전한 마이그레이션과 비서비스 수리만 수행
- `--generate-gateway-token`: Gateway 토큰 생성 및 구성
- `--deep`: 시스템 서비스에서 추가 Gateway 설치를 스캔하고 최근 Gateway supervisor 재시작 인계를 보고

참고:

- Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 읽기 전용 doctor 점검은 계속 작동하지만, `openclaw.json`이 불변이므로 `doctor --fix`, `doctor --repair`, `doctor --yes`, `doctor --generate-gateway-token`은 비활성화됩니다. 대신 이 설치의 Nix 소스를 편집하세요. nix-openclaw에서는 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요.
- 대화형 프롬프트(예: 키체인/OAuth 수정)는 stdin이 TTY이고 `--non-interactive`가 **설정되지 않은** 경우에만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)은 프롬프트를 건너뜁니다.
- 성능: 비대화형 `doctor` 실행은 즉시 Plugin 로드를 건너뛰므로 헤드리스 상태 점검이 빠르게 유지됩니다. 대화형 세션은 점검에 Plugin 기여가 필요할 때 여전히 Plugin을 완전히 로드합니다.
- `--fix`(`--repair`의 별칭)는 `~/.openclaw/openclaw.json.bak`에 백업을 쓰고, 알 수 없는 구성 키를 제거하며 각 제거 항목을 나열합니다.
- `doctor --fix --non-interactive`는 누락되었거나 오래된 Gateway 서비스 정의를 보고하지만, 업데이트 수리 모드 밖에서는 설치하거나 재작성하지 않습니다. 서비스가 누락된 경우 `openclaw gateway install`을 실행하거나, 런처를 의도적으로 교체하려는 경우 `openclaw gateway install --force`를 실행하세요.
- 상태 무결성 점검은 이제 sessions 디렉터리에서 고아 transcript 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 보관하려면 대화형 확인이 필요합니다. `--fix`, `--yes`, 헤드리스 실행은 이를 그대로 둡니다.
- Doctor는 또한 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)에서 레거시 cron 작업 형태를 스캔하고, 스케줄러가 런타임에 자동 정규화해야 하기 전에 그 자리에서 재작성할 수 있습니다.
- Linux에서 doctor는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 실행하는 경우 경고합니다. 이 스크립트는 더 이상 유지 관리되지 않으며, cron에 systemd user-bus 환경이 없을 때 잘못된 WhatsApp Gateway 장애를 기록할 수 있습니다.
- WhatsApp이 활성화된 경우 doctor는 로컬 `openclaw-tui` 클라이언트가 계속 실행 중인 상태에서 저하된 Gateway 이벤트 루프를 점검합니다. `doctor --fix`는 검증된 로컬 TUI 클라이언트만 중지하므로 WhatsApp 응답이 오래된 TUI 새로 고침 루프 뒤에 대기하지 않습니다.
- Doctor는 기본 모델, 폴백, heartbeat/subagent/compaction 재정의, 훅, 채널 모델 재정의, 오래된 세션 경로 핀 전반에서 레거시 `openai-codex/*` 모델 참조를 표준 `openai/*` 참조로 재작성합니다. `--fix`는 Codex 의도를 provider/model 범위의 `agentRuntime.id: "codex"` 항목으로 옮기고, `openai-codex:...` 같은 세션 auth-profile 핀을 보존하며, 오래된 전체 에이전트/세션 런타임 핀을 제거하고, 수리된 OpenAI 에이전트 참조가 직접 OpenAI API 키 인증 대신 Codex 인증 라우팅을 유지하도록 합니다.
- Doctor는 이전 OpenClaw 버전이 만든 레거시 Plugin 의존성 스테이징 상태를 정리합니다. 또한 `plugins.entries`, 구성된 채널, 구성된 제공자/검색 설정, 구성된 에이전트 런타임처럼 구성에서 참조하는 누락된 다운로드 가능 Plugin을 수리합니다. 패키지 업데이트 중에는 패키지 교체가 완료될 때까지 doctor가 패키지 관리자 Plugin 수리를 건너뜁니다. 구성된 Plugin에 여전히 복구가 필요하면 이후 `openclaw doctor --fix`를 다시 실행하세요. 다운로드가 실패하면 doctor는 설치 오류를 보고하고 다음 수리 시도를 위해 구성된 Plugin 항목을 보존합니다.
- Doctor는 Plugin 검색이 정상일 때 `plugins.allow`/`plugins.deny`/`plugins.entries`에서 누락된 Plugin ID를 제거하고, 일치하는 끊어진 채널 구성, heartbeat 대상, 채널 모델 재정의도 함께 제거하여 오래된 Plugin 구성을 수리합니다.
- Doctor는 영향을 받은 `plugins.entries.<id>` 항목을 비활성화하고 잘못된 `config` 페이로드를 제거해 유효하지 않은 Plugin 구성을 격리합니다. Gateway 시작은 이미 해당 잘못된 Plugin만 건너뛰므로 다른 Plugin과 채널은 계속 실행될 수 있습니다.
- 다른 supervisor가 Gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요. Doctor는 여전히 Gateway/서비스 상태를 보고하고 비서비스 수리를 적용하지만, 서비스 설치/시작/재시작/bootstrap 및 레거시 서비스 정리는 건너뜁니다.
- Linux에서 doctor는 비활성 추가 Gateway 유사 systemd 유닛을 무시하고, 수리 중 실행 중인 systemd Gateway 서비스의 명령/엔트리포인트 메타데이터를 재작성하지 않습니다. 활성 런처를 의도적으로 교체하려면 먼저 서비스를 중지하거나 `openclaw gateway install --force`를 사용하세요.
- Doctor는 레거시 플랫 Talk 구성(`talk.voiceId`, `talk.modelId` 및 관련 항목)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다.
- 반복된 `doctor --fix` 실행은 유일한 차이가 객체 키 순서뿐인 경우 더 이상 Talk 정규화를 보고/적용하지 않습니다.
- Doctor에는 메모리 검색 준비 상태 점검이 포함되며, 임베딩 자격 증명이 누락된 경우 `openclaw configure --section model`을 권장할 수 있습니다.
- Doctor는 명령 소유자가 구성되지 않은 경우 경고합니다. 명령 소유자는 owner-only 명령을 실행하고 위험한 작업을 승인할 수 있는 사람 운영자 계정입니다. DM 페어링은 누군가가 봇과 대화할 수 있게 할 뿐입니다. first-owner bootstrap이 존재하기 전에 발신자를 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하세요.
- Doctor는 Codex 모드 에이전트가 구성되어 있고 운영자의 Codex 홈에 개인 Codex CLI 자산이 있는 경우 경고합니다. 로컬 Codex app-server 실행은 격리된 에이전트별 홈을 사용하므로, 의도적으로 승격해야 하는 자산을 인벤토리화하려면 `openclaw migrate codex --dry-run`을 사용하세요.
- Doctor는 폐기된 `plugins.entries.codex.config.codexDynamicToolsProfile`을 제거합니다. Codex app-server는 항상 Codex 네이티브 작업 공간 도구를 네이티브로 유지합니다.
- Doctor는 기본 에이전트에 허용된 Skills가 bin, env var, config 또는 OS 요구 사항 누락 때문에 현재 런타임 환경에서 사용할 수 없는 경우 경고합니다. `doctor --fix`는 사용할 수 없는 Skills를 `skills.entries.<skill>.enabled=false`로 비활성화할 수 있습니다. Skill을 활성 상태로 유지하려면 누락된 요구 사항을 대신 설치/구성하세요.
- 샌드박스 모드가 활성화되어 있지만 Docker를 사용할 수 없는 경우, doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)이 포함된 높은 신호의 경고를 보고합니다.
- 레거시 샌드박스 레지스트리 파일(`~/.openclaw/sandbox/containers.json` 또는 `~/.openclaw/sandbox/browsers.json`)이 있으면 doctor가 이를 보고합니다. `openclaw doctor --fix`는 유효한 항목을 샤딩된 레지스트리 디렉터리로 마이그레이션하고 유효하지 않은 레거시 파일을 격리합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되고 현재 명령 경로에서 사용할 수 없는 경우, doctor는 읽기 전용 경고를 보고하고 평문 폴백 자격 증명을 쓰지 않습니다.
- 수정 경로에서 채널 SecretRef 검사가 실패하면, doctor는 조기에 종료하는 대신 계속 진행하고 경고를 보고합니다.
- 상태 디렉터리 마이그레이션 이후, 활성화된 기본 Telegram 또는 Discord 계정이 env 폴백에 의존하고 `TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`을 doctor 프로세스에서 사용할 수 없는 경우 doctor가 경고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없으면 doctor는 경고를 보고하고 해당 실행에서는 자동 확인을 건너뜁니다.

## macOS: `launchctl` env 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면, 해당 값이 구성 파일을 재정의하여 지속적인 "unauthorized" 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
