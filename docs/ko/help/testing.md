---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/provider 버그에 대한 회귀 테스트 추가하기
    - gateway + agent 동작 디버깅하기
summary: '테스트 키트: unit/e2e/live 스위트, Docker 러너, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-26T11:32:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의
Docker 러너가 있습니다. 이 문서는 "우리는 어떻게 테스트하는가" 가이드입니다.

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 무엇을 _다루지 않는지_).
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에 어떤 명령을 실행해야 하는지.
- live 테스트가 자격 증명을 어떻게 찾고 모델/providers를 어떻게 선택하는지.
- 실제 모델/provider 문제에 대한 회귀 테스트를 어떻게 추가하는지.

## 빠른 시작

대부분의 날에는:

- 전체 게이트(푸시 전 기대됨): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 직접 파일 지정은 이제 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 중일 때는 먼저 대상 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 providers/models를 디버깅할 때(실제 자격 증명 필요):

- live 스위트(models + gateway 도구/이미지 probe): `pnpm test:live`
- 하나의 live 파일만 조용히 대상으로 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 모델 스윕: `pnpm test:docker:live-models`
  - 이제 선택된 각 모델은 텍스트 턴 하나와 작은 파일 읽기 스타일 probe 하나를 실행합니다.
    메타데이터가 `image` 입력을 광고하는 모델은 작은 이미지 턴도 실행합니다.
    provider 실패를 격리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 probe를 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 둘 다 `include_live_suites: true`로 재사용 가능한 live/E2E 워크플로를 호출하며,
    여기에 provider별로 샤딩된 별도 Docker live 모델
    매트릭스 작업이 포함됩니다.
  - 집중된 CI 재실행에는 `include_live_suites: true` 및 `live_models_only: true`로
    `OpenClaw Live And E2E Checks (Reusable)`를 디스패치하세요.
  - 새 고신호 provider secret은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 그
    scheduled/release 호출자에 추가하세요.
- 네이티브 Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server 경로에 대해 Docker live 레인을 실행하고, 합성
    Slack DM을 `/codex bind`로 바인딩하며, `/codex fast`와
    `/codex permissions`를 실행한 뒤, 일반 답장과 이미지 첨부가
    ACP가 아닌 네이티브 plugin 바인딩을 통해 라우팅되는지 검증합니다.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - plugin 소유 Codex app-server harness를 통해 gateway agent 턴을 실행하고,
    `/codex status`와 `/codex models`를 검증하며, 기본적으로 image,
    Cron MCP, sub-agent, Guardian probe를 수행합니다. 다른 Codex
    app-server 실패를 격리할 때는 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`으로
    sub-agent probe를 비활성화하세요. 집중된 sub-agent 검사를 위해서는 다른 probe를 비활성화하세요:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    이 명령은
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`이 설정되지 않으면 sub-agent probe 후 종료됩니다.
- Crestodian rescue 명령 smoke: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 rescue 명령
    표면에 대한 옵트인 belt-and-suspenders 검사입니다. `/crestodian status`를 실행하고, 영구 모델
    변경을 대기열에 넣고, `/crestodian yes`에 응답한 뒤, audit/config 쓰기 경로를 검증합니다.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - config 없는 컨테이너에서 Crestodian을 실행하고 `PATH`에 가짜 Claude CLI를 둔 뒤,
    fuzzy planner fallback이 감사된 typed
    config 쓰기로 변환되는지 검증합니다.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw state dir에서 시작해 bare `openclaw`를
    Crestodian으로 라우팅하고, setup/model/agent/Discord plugin + SecretRef 쓰기를 적용하며,
    config를 검증하고, audit 항목을 확인합니다. 같은 Ring 0 setup 경로는
    QA Lab에서도
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`으로 커버됩니다.
- Moonshot/Kimi 비용 smoke: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 다음,
  `moonshot/kimi-k2.6`에 대해 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  을 실행하세요. JSON이 Moonshot/K2.6을 보고하고
  assistant transcript가 정규화된 `usage.cost`를 저장하는지 확인하세요.

팁: 실패 사례 하나만 필요하다면 아래 설명된 allowlist env vars로 live 테스트를 좁히는 방식을 선호하세요.

## QA 전용 러너

이 명령들은 QA-lab 수준의 현실성이 필요할 때 메인 테스트 스위트 옆에 있습니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. `Parity gate`는 일치하는 PR과
수동 디스패치에서 mock providers로 실행됩니다. `QA-Lab - All Lanes`는
`main`에서 매일 밤과 수동 디스패치에서 mock parity gate, live Matrix lane,
Convex 관리 live Telegram lane을 병렬 작업으로 실행합니다. `OpenClaw Release Checks`는
릴리스 승인 전에 같은 레인을 실행합니다.

- `pnpm openclaw qa suite`
  - repo 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 기본적으로 격리된
    gateway workers로 여러 선택된 시나리오를 병렬 실행합니다. `qa-channel` 기본 동시성은 4이며
    (선택한 시나리오 수로 제한됨) `--concurrency <count>`로 worker 수를 조정하거나,
    이전 직렬 레인에는 `--concurrency 1`을 사용하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트를 원하면 `--allow-failures`를 사용하세요.
  - provider 모드 `live-frontier`, `mock-openai`, `aimock`를 지원합니다.
    `aimock`은 실험적
    fixture 및 프로토콜 mock 커버리지를 위해 로컬 AIMock 기반 provider 서버를 시작하지만,
    시나리오 인식 `mock-openai` 레인을 대체하지는 않습니다.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 안에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 provider/model 선택 플래그를 재사용합니다.
  - live 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다:
    env 기반 provider 키, QA live provider config 경로, 존재할 경우 `CODEX_HOME`.
  - 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 출력 디렉터리는 repo 루트 아래에 있어야 합니다.
  - 일반 QA report + summary와 Multipass 로그를
    `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm qa:lab:up`
  - operator 스타일 QA 작업을 위한 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드해 Docker에 전역 설치하고,
    비대화형 OpenAI API-key 온보딩을 실행하며, 기본적으로 Telegram을 구성하고,
    plugin 활성화가 필요 시 런타임 의존성을 온디맨드로 설치하는지 검증하고,
    doctor를 실행하고, mock OpenAI
    엔드포인트를 대상으로 한 번의 로컬 agent 턴을 실행합니다.
  - 동일한 패키지 설치 레인을 Discord로 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- `pnpm test:docker:session-runtime-context`
  - 임베디드 런타임 컨텍스트 transcript에 대한 결정적 built-app Docker smoke를 실행합니다. 숨겨진 OpenClaw 런타임 컨텍스트가
    표시되는 사용자 턴으로 누출되지 않고 비표시 custom message로 저장되는지 검증한 다음,
    영향을 받는 깨진 세션 JSONL을 시드하고
    `openclaw doctor --fix`가 이를 백업과 함께 활성 브랜치로 다시 쓰는지 검증합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 공개된 OpenClaw 패키지를 설치하고, 설치된 패키지
    온보딩을 실행하고, 설치된 CLI를 통해 Telegram을 구성한 뒤,
    그 설치된 패키지를 SUT Gateway로 사용하여 live Telegram QA 레인을 재사용합니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env 자격 증명 또는 Convex credential 소스를 사용합니다. CI/release 자동화에서는
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와
    `OPENCLAW_QA_CONVEX_SITE_URL` 및 role secret을 설정하세요.
    CI에 `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex role secret이 있으면
    Docker 래퍼가 자동으로 Convex를 선택합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 공유
    `OPENCLAW_QA_CREDENTIAL_ROLE`을 이 레인에만 override합니다.
  - GitHub Actions는 이 레인을 수동 maintainer 워크플로
    `NPM Telegram Beta E2E`로 노출합니다. 병합 시에는 실행되지 않습니다. 워크플로는
    `qa-live-shared` 환경과 Convex CI credential lease를 사용합니다.
- `pnpm test:docker:bundled-channel-deps`
  - 현재 OpenClaw 빌드를 Docker에서 pack 및 설치하고, OpenAI가 구성된 상태로 Gateway를 시작한 뒤, config
    편집을 통해 번들 channel/plugins를 활성화합니다.
  - setup 검색이 구성되지 않은 plugin 런타임 의존성을
    남겨 둔 채 유지하는지, 첫 번째 구성된 Gateway 또는 doctor 실행이 각 번들
    plugin의 런타임 의존성을 온디맨드로 설치하는지, 두 번째 재시작이 이미 활성화된 의존성을 재설치하지 않는지 검증합니다.
  - 또한 알려진 이전 npm baseline을 설치하고, `openclaw update --tag <candidate>` 실행 전에 Telegram을 활성화한 뒤,
    candidate의 post-update doctor가
    harness 측 postinstall repair 없이 번들 channel 런타임 의존성을 복구하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels 게스트 전반에서 네이티브 패키지 설치 업데이트 smoke를 실행합니다. 선택된 각 플랫폼은 먼저 요청된 baseline 패키지를 설치한 다음,
    같은 게스트에서 설치된 `openclaw update` 명령을 실행하고 설치된 버전, 업데이트 상태, gateway 준비 상태, 한 번의 로컬 agent 턴을 검증합니다.
  - 하나의 게스트만 반복 작업 중일 때는 `--platform macos`, `--platform windows`, 또는 `--platform linux`를 사용하세요. 요약 아티팩트 경로와 레인별 상태에는 `--json`을 사용하세요.
  - OpenAI 레인은 기본적으로 live agent-turn 증명에 `openai/gpt-5.5`를 사용합니다. 다른
    OpenAI 모델을 의도적으로 검증할 때는 `--model <provider/model>`을 전달하거나
    `OPENCLAW_PARALLELS_OPENAI_MODEL`을 설정하세요.
  - Parallels 전송 정지로 나머지 테스트 시간을 모두 소모하지 않도록
    긴 로컬 실행은 호스트 timeout으로 감싸세요.

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 중첩된 레인 로그를 `/tmp/openclaw-parallels-npm-update.*` 아래에 기록합니다.
    외부 래퍼가 멈췄다고 보기 전에 `windows-update.log`, `macos-update.log`, 또는 `linux-update.log`
    를 확인하세요.
  - Windows 업데이트는 차가운 게스트에서 post-update doctor/런타임
    의존성 복구에 10~15분이 걸릴 수 있습니다. 중첩된
    npm 디버그 로그가 진행 중이라면 여전히 정상입니다.
  - 이 집계 래퍼를 개별 Parallels
    macOS, Windows, Linux smoke 레인과 병렬로 실행하지 마세요. 이들은 VM 상태를 공유하므로
    스냅샷 복원, 패키지 제공, 게스트 gateway 상태에서 충돌할 수 있습니다.
  - post-update 증명은 정상적인 번들 plugin 표면을 실행합니다.
    음성, 이미지 생성, 미디어
    이해 같은 capability facade는 agent 턴 자체가 단순 텍스트 응답만 확인하더라도 번들 런타임 API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 smoke
    테스트를 위해 로컬 AIMock provider 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix live QA 레인을 실행합니다.
  - 이 QA 호스트는 현재 repo/dev 전용입니다. 패키지된 OpenClaw 설치에는
    `qa-lab`이 포함되지 않으므로 `openclaw qa`를 노출하지 않습니다.
  - repo 체크아웃은 번들 runner를 직접 로드하므로 별도의 plugin 설치
    단계가 필요하지 않습니다.
  - 임시 Matrix 사용자 세 명(`driver`, `sut`, `observer`)과 private room 하나를 프로비저닝한 뒤, 실제 Matrix plugin을 SUT 전송으로 사용하는 QA gateway child를 시작합니다.
  - 기본적으로 고정된 안정 Tuwunel 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`를 사용합니다. 다른 이미지를 테스트해야 할 때는 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`로 override하세요.
  - Matrix는 일회용 사용자를 로컬에서 프로비저닝하므로 공통 credential-source 플래그를 노출하지 않습니다.
  - Matrix QA report, summary, observed-events 아티팩트, 결합된 stdout/stderr 출력 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
  - 기본적으로 진행 상황을 출력하며 `OPENCLAW_QA_MATRIX_TIMEOUT_MS`(기본값 30분)로 하드 실행 timeout을 강제합니다. 정리는 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`로 제한되며, 실패 시 복구용 `docker compose ... down --remove-orphans` 명령이 포함됩니다.
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT bot 토큰을 사용해 실제 private group을 대상으로 Telegram live QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. group id는 숫자형 Telegram chat id여야 합니다.
  - 공유 풀 자격 증명에는 `--credential-source convex`를 지원합니다. 기본적으로는 env 모드를 사용하고, 풀 lease를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트를 원하면 `--allow-failures`를 사용하세요.
  - 같은 private group 안에 있는 서로 다른 두 개의 bot이 필요하며, SUT bot은 Telegram username을 노출해야 합니다.
  - 안정적인 bot-to-bot 관측을 위해 `@BotFather`에서 두 bot 모두에 대해 Bot-to-Bot Communication Mode를 활성화하고, driver bot이 그룹 bot 트래픽을 관측할 수 있도록 하세요.
  - Telegram QA report, summary, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다. 답장 시나리오에는 driver 전송 요청부터 관측된 SUT 답장까지의 RTT가 포함됩니다.

live 전송 레인은 새 전송이 드리프트하지 않도록 하나의 표준 계약을 공유합니다.

`qa-channel`은 광범위한 합성 QA 스위트로 남아 있으며 live
전송 커버리지 매트릭스에는 포함되지 않습니다.

| 레인     | Canary | 멘션 게이팅 | Allowlist 차단 | 최상위 답장 | 재시작 재개 | thread 후속 조치 | thread 격리 | reaction 관측 | 도움말 명령 |
| -------- | ------ | ----------- | -------------- | ----------- | ----------- | ---------------- | ----------- | ------------- | ----------- |
| Matrix   | x      | x           | x              | x           | x           | x                | x           | x             |             |
| Telegram | x      |             |                |             |             |                  |             |               | x           |

### Convex를 통한 공유 Telegram 자격 증명 (v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면,
QA lab은 Convex 기반 풀에서 독점 lease를 획득하고, 레인이 실행되는 동안 해당 lease에 heartbeat를 보내며,
종료 시 lease를 해제합니다.

참조 Convex 프로젝트 스캐폴드:

- `qa/convex-credential-broker/`

필수 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (예: `https://your-deployment.convex.site`)
- 선택한 역할에 대한 secret 하나:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- credential 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI에서는 기본값 `ci`, 그 외에는 `maintainer`)

선택적 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (선택적 trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

정상 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`이 `https://`를 사용해야 합니다.

관리자용 maintainer 명령(pool add/remove/list)에는
특히 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

maintainer용 CLI 헬퍼:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live 실행 전에 `doctor`를 사용해 Convex site URL, broker secrets,
endpoint prefix, HTTP timeout, admin/list 도달 가능성을
secret 값을 출력하지 않고 확인하세요. 스크립트 및 CI
유틸리티에서 기계 판독 가능한 출력이 필요하면 `--json`을 사용하세요.

기본 엔드포인트 계약 (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }` (또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }` (또는 빈 `2xx`)
- `POST /admin/add` (maintainer secret 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove` (maintainer secret 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease 가드: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (maintainer secret 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram kind용 payload 형식:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자형 Telegram chat id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형식을 검증하고 잘못된 payload를 거부합니다.

### QA에 채널 추가하기

Markdown QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 채널용 전송 어댑터.
2. 채널 계약을 실행하는 시나리오 팩.

공유 `qa-lab` 호스트가
흐름을 소유할 수 있는데 새로운 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- 스위트 시작 및 종료
- worker 동시성
- 아티팩트 기록
- report 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오용 호환성 별칭

러너 plugins는 전송 계약을 소유합니다.

- 공유 `qa` 루트 아래에서 `openclaw qa <runner>`가 어떻게 마운트되는지
- 해당 전송에 맞게 gateway가 어떻게 구성되는지
- 준비 상태를 어떻게 확인하는지
- 인바운드 이벤트를 어떻게 주입하는지
- 아웃바운드 메시지를 어떻게 관측하는지
- transcript와 정규화된 전송 상태를 어떻게 노출하는지
- 전송 기반 작업을 어떻게 실행하는지
- 전송별 reset 또는 cleanup을 어떻게 처리하는지

새 채널의 최소 도입 기준은 다음과 같습니다.

1. 공유 `qa` 루트의 소유자를 계속 `qa-lab`으로 유지합니다.
2. 공유 `qa-lab` 호스트 seam에서 전송 runner를 구현합니다.
3. 전송별 메커니즘은 runner plugin 또는 채널 harness 내부에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다.
   Runner plugins는 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 export해야 합니다.
   `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI 및 runner 실행은 별도 entrypoint 뒤에 있어야 합니다.
5. 주제별 `qa/scenarios/` 디렉터리 아래에 Markdown 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 일반 시나리오 헬퍼를 사용합니다.
7. repo가 의도적인 마이그레이션을 수행 중이 아니라면 기존 호환성 별칭이 계속 동작하도록 유지합니다.

결정 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번 표현할 수 있다면 `qa-lab`에 넣습니다.
- 동작이 한 채널 전송에 의존한다면 해당 runner plugin 또는 plugin harness에 유지합니다.
- 둘 이상의 채널이 사용할 수 있는 새 capability가 시나리오에 필요하다면 `suite.ts`에 채널 전용 분기를 넣는 대신 일반 헬퍼를 추가합니다.
- 동작이 한 전송에만 의미가 있다면 시나리오를 전송 전용으로 유지하고 시나리오 계약에서 이를 명시합니다.

새 시나리오에 권장되는 일반 헬퍼 이름:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

기존 시나리오에는 다음을 포함한 호환성 별칭이 계속 제공됩니다.

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

새 채널 작업에는 일반 헬퍼 이름을 사용해야 합니다.
호환성 별칭은 flag day 마이그레이션을 피하기 위해 존재하는 것이지,
새 시나리오 작성의 모델이 아닙니다.

## 테스트 스위트 (무엇이 어디서 실행되는가)

스위트를 “현실성이 증가하는 순서”(그리고 불안정성/비용도 증가)로 생각하세요.

### Unit / integration (기본값)

- 명령: `pnpm test`
- Config: 대상 없는 실행은 `vitest.full-*.config.ts` 샤드 세트를 사용하며 병렬 스케줄링을 위해 다중 프로젝트 샤드를 프로젝트별 config로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`가 다루는 허용된 `ui` node 테스트
- 범위:
  - 순수 unit 테스트
  - 인프로세스 integration 테스트(gateway 인증, 라우팅, 도구, 파싱, config)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됨
  - 실제 키 필요 없음
  - 빠르고 안정적이어야 함

<AccordionGroup>
  <Accordion title="프로젝트, 샤드, 범위 지정 레인">

    - 대상이 없는 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 config(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)를 실행합니다. 이렇게 하면 부하가 걸린 머신에서 peak RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않도록 합니다.
    - `pnpm test --watch`는 다중 샤드 watch 루프가 현실적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적 파일/디렉터리 대상을 먼저 범위 지정된 레인으로 라우팅하므로 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
    - `pnpm test:changed`는 diff가 라우팅 가능한 소스/테스트 파일만 건드릴 때 변경된 git 경로를 동일한 범위 지정 레인으로 확장합니다. config/setup 편집은 여전히 광범위한 루트 프로젝트 재실행으로 fallback합니다.
    - `pnpm check:changed`는 좁은 작업에 대한 일반적인 스마트 로컬 게이트입니다. diff를 core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, tooling으로 분류한 뒤 일치하는 typecheck/lint/test 레인을 실행합니다. 공개 Plugin SDK 및 plugin-contract 변경에는 extensions가 이런 core 계약에 의존하므로 extension 검증 패스 하나가 포함됩니다. 릴리스 메타데이터 전용 버전 범프는 전체 스위트 대신 대상화된 version/config/root-dependency 검사를 실행하며, 최상위 version 필드 밖의 package 변경은 거부하는 가드를 둡니다.
    - live Docker ACP harness 편집은 집중된 로컬 게이트를 실행합니다: live Docker auth 스크립트의 셸 문법, live Docker scheduler dry-run, ACP bind unit 테스트, ACPX extension 테스트. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로 제한될 때만 포함됩니다. dependency, export, version 및 기타 package 표면 편집은 여전히 더 넓은 가드를 사용합니다.
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import-light unit 테스트는 `unit-fast` 레인을 통해 라우팅되며 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태가 있거나 런타임이 무거운 파일은 기존 레인에 남습니다.
    - 선택된 `plugin-sdk`와 `commands` helper 소스 파일도 changed-mode 실행을 해당 경량 레인의 명시적 형제 테스트에 매핑하므로 helper 편집 시 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않아도 됩니다.
    - `auto-reply`에는 최상위 core helpers, 최상위 `reply.*` integration 테스트, `src/auto-reply/reply/**` 하위 트리에 대한 전용 버킷이 있습니다. CI는 reply 하위 트리를 agent-runner, dispatch, commands/state-routing 샤드로 추가 분할하여 import가 무거운 하나의 버킷이 전체 Node tail을 독점하지 않도록 합니다.

  </Accordion>

  <Accordion title="임베디드 runner 커버리지">

    - message-tool 검색 입력 또는 Compaction 런타임
      컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 라우팅 및 정규화
      경계를 위한 집중된 helper 회귀 테스트를 추가하세요.
    - 임베디드 runner integration 스위트도 정상 상태를 유지하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이 스위트는 범위 지정된 id 및 Compaction 동작이 여전히
      실제 `run.ts` / `compact.ts` 경로를 통해 흐르는지 검증합니다. helper-only 테스트는
      해당 integration 경로를 대체하기에 충분하지 않습니다.

  </Accordion>

  <Accordion title="Vitest pool 및 격리 기본값">

    - 기본 Vitest config의 기본값은 `threads`입니다.
    - 공유 Vitest config는 `isolate: false`를 고정하고
      루트 프로젝트, e2e, live config 전반에서
      비격리 runner를 사용합니다.
    - 루트 UI 레인은 `jsdom` 설정과 optimizer를 유지하지만
      공유 비격리 runner에서도 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest config에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 큰 로컬 실행 중 V8 compile churn을 줄이기 위해
      기본적으로 Vitest child Node
      프로세스에 `--no-maglev`를 추가합니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 formatting 전용입니다. 포맷된 파일을 다시 스테이징할 뿐
      lint, typecheck, 테스트는 실행하지 않습니다.
    - 인계나 푸시 전에
      스마트 로컬 게이트가 필요하면 `pnpm check:changed`를 명시적으로 실행하세요. 공개 Plugin SDK와 plugin-contract
      변경에는 extension 검증 패스 하나가 포함됩니다.
    - `pnpm test:changed`는 변경된 경로가 더 작은 스위트에 깔끔하게 매핑될 때 범위 지정 레인을 통해 라우팅됩니다.
    - `pnpm test:max`와 `pnpm test:changed:max`도 같은 라우팅
      동작을 유지하며 worker 상한만 더 높습니다.
    - 로컬 worker 자동 스케일링은 의도적으로 보수적이며 호스트 load average가 이미 높을 때는 자동으로 물러서므로, 여러 동시
      Vitest 실행이 기본적으로 덜 큰 피해를 주게 됩니다.
    - 기본 Vitest config는 프로젝트/config 파일을
      `forceRerunTriggers`로 표시하므로 테스트 wiring이 바뀌었을 때 changed-mode 재실행이 정확하게 유지됩니다.
    - 이 config는 지원되는
      호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성화된 상태로 유지합니다. 직접 프로파일링을 위한 명시적 캐시 위치 하나를 원하면
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration 리포팅과
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 프로파일링 보기를
      `origin/main` 이후 변경된 파일로 범위 지정합니다.
    - 샤드 타이밍 데이터는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      전체 config 실행은 config 경로를 키로 사용합니다. include-pattern CI
      샤드는 필터링된 샤드를 별도로 추적할 수 있도록 샤드 이름을 추가합니다.
    - 하나의 hot 테스트가 여전히 시작 import에 대부분의 시간을 쓴다면,
      무거운 의존성은 좁은 로컬 `*.runtime.ts` seam 뒤에 두고
      단지 `vi.mock(...)`에 전달하기 위해 런타임 헬퍼를 deep-import하지 말고
      그 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 라우팅된
      `test:changed`를 해당 커밋 diff의 네이티브 루트 프로젝트 경로와 비교하고 wall time과 macOS max RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 현재 더러운 트리를
      변경 파일 목록을 `scripts/test-projects.mjs`와 루트 Vitest config를 통해 라우팅하여 벤치마크합니다.
    - `pnpm test:perf:profile:main`은
      Vitest/Vite 시작 및 transform 오버헤드에 대한 main-thread CPU 프로파일을 기록합니다.
    - `pnpm test:perf:profile:runner`는
      unit 스위트에 대해 파일 병렬화를 비활성화한 상태의 runner CPU+heap 프로파일을 기록합니다.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- 명령: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 기본적으로 diagnostics가 활성화된 실제 loopback Gateway를 시작
  - 진단 이벤트 경로를 통해 합성 gateway 메시지, 메모리, 대형 payload churn을 구동
  - Gateway WS RPC를 통해 `diagnostics.stability`를 질의
  - 진단 stability bundle persistence helper를 커버
  - recorder가 bounded 상태를 유지하고, 합성 RSS 샘플이 pressure 예산 아래에 머무르며, 세션별 큐 깊이가 다시 0으로 배수되는지 검증
- 기대 사항:
  - CI 안전, 키 불필요
  - stability 회귀 후속 조치를 위한 좁은 레인이며 전체 Gateway 스위트를 대체하지는 않음

### E2E (gateway smoke)

- 명령: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래 번들 plugin E2E 테스트
- 런타임 기본값:
  - repo의 나머지와 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 workers를 사용합니다(CI: 최대 2, 로컬: 기본값 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행됩니다.
- 유용한 override:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>` (최대 16).
  - 자세한 콘솔 출력을 다시 켜려면 `OPENCLAW_E2E_VERBOSE=1`.
- 범위:
  - 다중 인스턴스 gateway 종단 간 동작
  - WebSocket/HTTP 표면, node pairing, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키 필요 없음
  - unit 테스트보다 더 많은 구성 요소가 있어 느릴 수 있음

### E2E: OpenShell 백엔드 smoke

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell gateway를 시작
  - 임시 로컬 Dockerfile에서 sandbox를 생성
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell 백엔드를 실행
  - sandbox fs bridge를 통해 원격 정본 파일 시스템 동작을 검증
- 기대 사항:
  - 옵트인 전용이며 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 작동하는 Docker daemon 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 gateway와 sandbox를 제거
- 유용한 override:
  - 더 넓은 e2e 스위트를 수동 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI 바이너리 또는 래퍼 스크립트를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (실제 providers + 실제 모델)

- 명령: `pnpm test:live`
- Config: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래 번들 plugin live 테스트
- 기본값: `pnpm test:live`에서 **활성화됨** (`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 provider/model이 실제 자격 증명으로 _오늘_ 실제로 동작하는가?”
  - provider 형식 변경, tool-calling 특성, 인증 문제, rate limit 동작 포착
- 기대 사항:
  - 설계상 CI 안정적이지 않음(실제 네트워크, 실제 provider 정책, 할당량, 장애)
  - 비용이 들거나 rate limit을 사용함
  - “모든 것”보다 좁혀진 부분집합 실행을 선호
- live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소싱합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈에 복사하므로 unit fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 실제 홈 디렉터리를 사용하도록 의도적으로 원할 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본으로 사용합니다. `[live] ...` 진행 출력은 유지하지만 추가 `~/.profile` 알림을 숨기고 gateway bootstrap 로그/Bonjour chatter를 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API key 회전(provider별): `*_API_KEYS`를 쉼표/세미콜론 형식으로 설정하거나 `*_API_KEY_1`, `*_API_KEY_2`를 설정하세요(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`). 또는 `OPENCLAW_LIVE_*_KEY`를 통한 live override를 사용하세요. 테스트는 rate limit 응답에서 재시도합니다.
- 진행/heartbeat 출력:
  - live 스위트는 이제 stderr로 진행 라인을 출력하므로 Vitest 콘솔 캡처가 조용해도 긴 provider 호출이 실제로 진행 중임을 볼 수 있습니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 provider/gateway 진행 라인이 live 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/probe heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

다음 결정 표를 사용하세요.

- 로직/테스트를 편집 중: `pnpm test` 실행 (`많이 바꿨다면 pnpm test:coverage`도)
- gateway 네트워킹 / WS 프로토콜 / pairing을 건드림: `pnpm test:e2e` 추가
- “내 봇이 다운됨” / provider 전용 실패 / tool calling 디버깅: 좁힌 `pnpm test:live` 실행

## Live (네트워크를 건드리는) 테스트

live 모델 매트릭스, CLI 백엔드 smoke, ACP smoke, Codex app-server
harness, 모든 미디어 provider live 테스트(Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), 그리고 live 실행용 자격 증명 처리에 대해서는
[Testing — live suites](/ko/help/testing-live)를 참조하세요.

## Docker 러너 (선택적 "Linux에서 동작함" 검사)

이 Docker 러너는 두 가지 범주로 나뉩니다.

- Live-model 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 repo Docker 이미지 내부에서 일치하는 profile-key live 파일만 실행합니다(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`). 로컬 config dir와 workspace를 마운트하고(마운트된 경우 `~/.profile`도 소싱함) 실행합니다. 일치하는 로컬 entrypoint는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 러너는 전체 Docker 스윕이 실용적이도록 기본적으로 더 작은 smoke 상한을 사용합니다:
  `test:docker:live-models`는 기본값으로 `OPENCLAW_LIVE_MAX_MODELS=12`,
  `test:docker:live-gateway`는 기본값으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`를 사용합니다. 더 큰 exhaustive scan을 명시적으로 원할 때는 이 env vars를 override하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 뒤, 이를 live Docker 레인에 재사용합니다. 또한 `test:docker:e2e-build`를 통해 하나의 공유 `scripts/e2e/Dockerfile` 이미지를 빌드하고, 빌드된 앱을 실행하는 E2E 컨테이너 smoke 러너에 이를 재사용합니다. 이 집계는 가중치 기반 로컬 스케줄러를 사용합니다: `OPENCLAW_DOCKER_ALL_PARALLELISM`이 프로세스 슬롯을 제어하고, 리소스 상한은 무거운 live, npm-install, multi-service 레인이 한꺼번에 시작되지 않도록 합니다. 기본값은 10 슬롯, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 더 많은 여유가 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`을 조정하세요. 러너는 기본적으로 Docker preflight를 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장하고, 다음 실행에서는 해당 타이밍을 사용해 더 긴 레인을 먼저 시작합니다. 빌드나 Docker 실행 없이 가중치 기반 레인 manifest만 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하세요.
- 컨테이너 smoke 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 integration 경로를 검증합니다.

live-model Docker 러너는 또한 필요한 CLI auth 홈만 바인드 마운트합니다(또는 실행이 좁혀지지 않은 경우 지원되는 모든 홈을 마운트함). 그런 다음 실행 전에 이를 컨테이너 홈으로 복사하므로 외부 CLI OAuth가 호스트 auth 저장소를 변경하지 않고 토큰을 갱신할 수 있습니다.

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 다루며, 엄격한 Droid/OpenCode 커버리지는 `pnpm test:docker:live-acp-bind:droid` 및 `pnpm test:docker:live-acp-bind:opencode`로 제공)
- CLI 백엔드 smoke: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 scaffolding): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent`는 패킹된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref onboarding을 통한 OpenAI 구성과 기본 Telegram 구성을 수행하며, doctor가 활성화된 plugin 런타임 deps를 복구하는지 검증하고, mock OpenAI agent 턴 하나를 실행합니다. 미리 빌드된 tarball을 재사용하려면 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, 호스트 재빌드를 건너뛰려면 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, 채널을 바꾸려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch`는 패킹된 OpenClaw tarball을 Docker에 전역 설치하고, package `stable`에서 git `dev`로 전환한 뒤, 유지된 채널과 plugin이 업데이트 후에도 동작하는지 검증하고, 다시 package `stable`로 전환하여 업데이트 상태를 확인합니다.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context`는 숨겨진 런타임 컨텍스트 transcript persistence와 영향을 받은 중복 prompt-rewrite 브랜치에 대한 doctor 복구를 검증합니다.
- Bun 전역 설치 smoke: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 pack하고, 격리된 홈에서 `bun install -g`로 설치한 뒤, `openclaw infer image providers --json`이 멈추는 대신 번들 image providers를 반환하는지 검증합니다. 미리 빌드된 tarball을 재사용하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, 호스트 빌드를 건너뛰려면 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, 빌드된 Docker 이미지에서 `dist/`를 복사하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`을 사용하세요.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh`는 root, update, direct-npm 컨테이너 전체에서 하나의 npm 캐시를 공유합니다. update smoke는 후보 tarball로 업그레이드하기 전 stable baseline으로 기본적으로 npm `latest`를 사용합니다. 비루트 installer 검사는 root 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않도록 격리된 npm 캐시를 유지합니다. 로컬 재실행에서 root/update/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정하세요.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복된 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요하면 이 env 없이 로컬에서 스크립트를 실행하세요.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에서 워크스페이스 하나를 공유하는 두 에이전트를 시드한 뒤, `agents delete --json`을 실행하고, 유효한 JSON과 유지된 워크스페이스 동작을 검증합니다. install-smoke 이미지를 재사용하려면 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`을 사용하세요.
- Gateway 네트워킹(두 컨테이너, WS auth + health): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (스크립트: `scripts/e2e/browser-cdp-snapshot-docker.sh`)는 소스 E2E 이미지와 Chromium 레이어를 빌드하고, raw CDP로 Chromium을 시작하며, `browser doctor --deep`를 실행하고, CDP role snapshots가 링크 URL, cursor-promoted clickables, iframe refs, frame metadata를 다루는지 검증합니다.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 mock OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음, provider schema reject를 강제로 발생시켜 raw detail이 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 bridge (시드된 Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (실제 stdio MCP 서버 + 임베디드 Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (실제 Gateway + stdio MCP child teardown, 격리된 Cron 및 one-shot subagent 실행 후): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, ClawHub install/uninstall, marketplace 업데이트, Claude-bundle enable/inspect): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
  live ClawHub 블록을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, 기본 package를 override하려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 및 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`를 설정하세요.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin 런타임 deps: `pnpm test:docker:bundled-channel-deps`는 기본적으로 작은 Docker runner 이미지를 빌드하고, 호스트에서 OpenClaw를 한 번 빌드 및 pack한 뒤, 해당 tarball을 각 Linux install 시나리오에 마운트합니다. 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`, 새 로컬 빌드 후 호스트 재빌드를 건너뛰려면 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, 기존 tarball을 가리키려면 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하세요. 전체 Docker 집계는 이 tarball을 한 번 미리 pack한 뒤, bundled channel 검사를 독립적인 레인으로 샤딩하며, Telegram, Discord, Slack, Feishu, memory-lancedb, ACPX에 대한 별도 update 레인도 포함합니다. bundled 레인을 직접 실행할 때 채널 매트릭스를 좁히려면 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, update 시나리오를 좁히려면 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`를 사용하세요. 이 레인은 또한 `channels.<id>.enabled=false`와 `plugins.entries.<id>.enabled=false`가 doctor/런타임 dependency 복구를 억제하는지 검증합니다.
- 반복 작업 중 관련 없는 시나리오를 비활성화하여 bundled plugin 런타임 deps를 좁히세요. 예:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

공유 built-app 이미지를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 스위트별 이미지 override는 설정되면 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키는 경우, 스크립트는 해당 이미지가 로컬에 없으면 pull합니다. QR 및 installer Docker 테스트는 공유 built-app 런타임이 아니라 package/install 동작을 검증하므로 자체 Dockerfile을 유지합니다.

live-model Docker 러너는 또한 현재 체크아웃을 읽기 전용으로 바인드 마운트하고,
이를 컨테이너 내부의 임시 workdir에 staging합니다. 이렇게 하면 런타임
이미지는 슬림하게 유지하면서도 정확히 로컬 소스/config에 대해 Vitest를 실행할 수 있습니다.
staging 단계는
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 앱 로컬 `.build` 또는
Gradle 출력 디렉터리 같은 큰 로컬 전용 캐시 및 앱 빌드 출력을 건너뛰므로 Docker live 실행이
머신별 아티팩트를 복사하느라 몇 분씩 소비하지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 gateway live probe가 컨테이너 내부에서
실제 Telegram/Discord 등의 채널 worker를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로,
해당 Docker 레인에서 gateway
live 커버리지를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 smoke입니다. OpenAI 호환 HTTP 엔드포인트가 활성화된
OpenClaw gateway 컨테이너를 시작하고,
그 gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작하며, Open WebUI를 통해
로그인한 뒤, `/api/models`가 `openclaw/default`를 노출하는지 확인하고, 그 다음
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
첫 실행은 Docker가
Open WebUI 이미지를 pull해야 하거나 Open WebUI가 자체 cold-start 설정을 완료해야 할 수 있어 눈에 띄게 느릴 수 있습니다.
이 레인은 사용 가능한 live 모델 키를 기대하며, Dockerized 실행에서 이를 제공하는 주요 방법은
`OPENCLAW_PROFILE_FILE`
(기본값 `~/.profile`)입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며
실제 Telegram, Discord 또는 iMessage 계정이 필요하지 않습니다. 시드된 Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 생성하는 두 번째 컨테이너를 시작한 뒤,
실제 stdio MCP bridge를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 파일 메타데이터,
live 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 +
권한 알림을 검증합니다. 알림 검사는 raw stdio MCP frame을 직접 검사하므로,
특정 클라이언트 SDK가 우연히 노출하는 내용이 아니라
bridge가 실제로 내보내는 내용을 smoke가 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 live
모델 키가 필요하지 않습니다. repo Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP probe 서버를 시작하고,
그 서버를 임베디드 Pi bundle
MCP 런타임을 통해 구체화한 다음, 도구를 실행하고, `coding`과 `messaging`이
`bundle-mcp` 도구를 유지하는 반면 `minimal`과 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 검증합니다.
`test:docker:cron-mcp-cleanup`도 결정적이며 live 모델
키가 필요하지 않습니다. 실제 stdio MCP probe 서버가 포함된 시드된 Gateway를 시작하고,
격리된 Cron 턴과 `/subagents spawn` one-shot child 턴을 실행한 뒤,
각 실행 후 MCP child 프로세스가 종료되는지 검증합니다.

수동 ACP 평문 thread smoke(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로용으로 유지하세요. ACP thread 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env vars:

- `OPENCLAW_CONFIG_DIR=...` (기본값: `~/.openclaw`) → `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...` (기본값: `~/.openclaw/workspace`) → `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...` (기본값: `~/.profile`) → `/home/node/.profile`에 마운트되며 테스트 실행 전에 소싱됨
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 `OPENCLAW_PROFILE_FILE`에서 소싱된 env vars만 검증하며, 임시 config/workspace dir를 사용하고 외부 CLI auth 마운트는 사용하지 않음
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (기본값: `~/.cache/openclaw/docker-cli-tools`) → Docker 내부 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트
- `$HOME` 아래 외부 CLI auth dir/files는 `/host-auth...` 아래 읽기 전용으로 마운트된 뒤, 테스트 시작 전에 `/home/node/...`로 복사됨
  - 기본 dir: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 좁혀진 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 dir/files만 마운트
  - 수동 override: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행을 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부에서 providers를 필터링하려면 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 자격 증명이 env가 아니라 profile 저장소에서 오도록 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke를 위해 gateway가 노출할 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke가 사용하는 nonce-check prompt를 override하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 override하려면 `OPENWEBUI_IMAGE=...`

## Docs sanity

문서 수정 후 docs 검사를 실행하세요: `pnpm check:docs`.
페이지 내 heading 검사까지 필요할 때는 전체 Mintlify anchor 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀 (CI 안전)

이들은 실제 provider 없이도 “실제 파이프라인” 회귀를 검증합니다.

- Gateway tool calling (mock OpenAI, 실제 gateway + agent loop): `src/gateway/gateway.test.ts` (케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config + auth enforced 쓰기): `src/gateway/gateway.test.ts` (케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 evals (Skills)

이미 몇 가지 CI 안전 테스트가 있으며, 이는 “에이전트 신뢰성 evals”처럼 동작합니다.

- 실제 gateway + agent loop를 통한 mock tool-calling (`src/gateway/gateway.test.ts`).
- 세션 wiring과 config 효과를 검증하는 종단 간 wizard 흐름 (`src/gateway/gateway.test.ts`).

Skills에 대해 아직 부족한 것([Skills](/ko/tools/skills) 참조):

- **Decisioning:** prompt에 Skills가 나열되었을 때 에이전트가 올바른 Skill을 선택하는가(또는 관련 없는 것은 피하는가)?
- **Compliance:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필요한 단계/인수를 따르는가?
- **Workflow 계약:** 도구 순서, 세션 기록 유지, sandbox 경계를 검증하는 다중 턴 시나리오.

향후 eval은 먼저 결정적이어야 합니다.

- mock providers를 사용하여 도구 호출 + 순서, Skill 파일 읽기, 세션 wiring을 검증하는 시나리오 러너.
- Skill 중심 시나리오의 소규모 스위트(사용 vs 회피, 게이팅, prompt injection).
- CI 안전 스위트가 먼저 자리잡은 뒤에만 선택적으로 live evals(옵트인, env 게이트).

## 계약 테스트 (plugin 및 채널 형태)

계약 테스트는 등록된 모든 plugin과 channel이 해당
인터페이스 계약을 준수하는지 검증합니다. 검색된 모든 plugins를 순회하며
형태 및 동작 검증 스위트를 실행합니다. 기본 `pnpm test` unit 레인은 의도적으로
이 공유 seam 및 smoke 파일을 건너뛰므로, 공유 channel 또는 provider 표면을 건드렸다면
계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- provider 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **plugin** - 기본 plugin 형태(id, name, capabilities)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 작업 핸들러
- **threading** - thread ID 처리
- **directory** - 디렉터리/roster API
- **group-policy** - 그룹 정책 강제

### Provider 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **status** - 채널 상태 probe
- **registry** - plugin registry 형태

### Provider 계약

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - plugin 검색
- **loader** - plugin 로딩
- **runtime** - provider 런타임
- **shape** - plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 하위 경로를 변경한 후
- 채널 또는 provider plugin을 추가하거나 수정한 후
- plugin 등록 또는 검색을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가하기 (가이드)

live에서 발견된 provider/model 문제를 수정할 때:

- 가능하면 CI 안전 회귀를 추가하세요(mock/stub provider, 또는 정확한 request-shape 변환 포착)
- 본질적으로 live 전용이라면(rate limit, 인증 정책) live 테스트를 좁게 유지하고 env vars를 통해 옵트인하게 하세요
- 버그를 잡을 수 있는 가장 작은 계층을 대상으로 삼는 것을 선호하세요:
  - provider request 변환/replay 버그 → 직접 모델 테스트
  - gateway session/history/tool pipeline 버그 → gateway live smoke 또는 CI 안전 gateway mock 테스트
- SecretRef traversal 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 registry 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별 샘플 대상 하나를 도출한 다음, traversal-segment exec id가 거부되는지 검증합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 패밀리를 추가한다면, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 id에서 의도적으로 실패하므로 새 클래스가 조용히 건너뛰어질 수 없습니다.

## 관련 항목

- [Testing live](/ko/help/testing-live)
- [CI](/ko/ci)
