---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/provider 버그에 대한 회귀 테스트 추가하기
    - Gateway + 에이전트 동작 디버깅하기
summary: '테스트 키트: unit/e2e/live 스위트, Docker 러너, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-24T08:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker 러너가 있습니다. 이 문서는 “우리가 어떻게 테스트하는지”를 설명하는 가이드입니다.

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 무엇을 다루지 않는지)
- 일반적인 워크플로(로컬, push 전, 디버깅)에서 어떤 명령을 실행해야 하는지
- live 테스트가 자격 증명을 어떻게 찾고 모델/provider를 어떻게 선택하는지
- 실제 모델/provider 이슈에 대한 회귀 테스트를 어떻게 추가하는지

## 빠른 시작

대부분의 경우:

- 전체 게이트(push 전 예상): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프 실행: `pnpm test:watch`
- 직접 파일 지정도 이제 extension/channel 경로를 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 작업 중이라면 먼저 대상 범위를 좁힌 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 providers/models를 디버깅할 때(실제 자격 증명 필요):

- live 스위트(models + gateway 도구/이미지 프로브): `pnpm test:live`
- 하나의 live 파일만 조용히 대상 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 모델 스윕: `pnpm test:docker:live-models`
  - 이제 선택된 각 모델은 텍스트 턴 하나와 작은 파일 읽기 스타일 프로브 하나를 실행합니다.
    메타데이터가 `image` 입력을 광고하는 모델은 작은 이미지 턴도 실행합니다.
    provider 실패를 분리할 때는 추가 프로브를 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 모두 재사용 가능한 live/E2E 워크플로를
    `include_live_suites: true`와 함께 호출하며, 여기에는 provider별로 샤딩된
    별도의 Docker live 모델 매트릭스 작업이 포함됩니다.
  - 집중된 CI 재실행의 경우 `OpenClaw Live And E2E Checks (Reusable)`를
    `include_live_suites: true` 및 `live_models_only: true`로 디스패치하세요.
  - 새로운 고신호 provider 시크릿을 추가할 때는 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 해당
    schedule/release 호출자도 함께 업데이트하세요.
- 네이티브 Codex bound-chat 스모크: `pnpm test:docker:live-codex-bind`
  - Codex app-server 경로에 대해 Docker live lane을 실행하고, 합성 Slack DM을
    `/codex bind`로 바인딩한 뒤 `/codex fast`와
    `/codex permissions`를 실행하고, 이후 일반 응답과 이미지 첨부가 ACP 대신
    네이티브 Plugin 바인딩을 통해 전달되는지 검증합니다.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`를 설정한 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 뒤,
  `moonshot/kimi-k2.6`에 대해 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  를 실행하세요. JSON이 Moonshot/K2.6을 보고하고 assistant transcript가 정규화된 `usage.cost`를 저장하는지 확인하세요.

팁: 실패한 사례 하나만 필요하다면, 아래에 설명된 allowlist env 변수를 통해 live 테스트 범위를 좁히는 방식을 우선 사용하세요.

## QA 전용 러너

이 명령들은 더 현실적인 QA-lab 환경이 필요할 때 메인 테스트 스위트와 함께 사용합니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. `Parity gate`는 일치하는 PR과
수동 디스패치에서 mock providers로 실행됩니다. `QA-Lab - All Lanes`는 `main`에서
매일 밤 실행되며, 수동 디스패치에서도 mock parity gate, live Matrix lane,
Convex 관리형 live Telegram lane을 병렬 작업으로 실행합니다. `OpenClaw Release Checks`는
릴리스 승인 전에 동일한 lane들을 실행합니다.

- `pnpm openclaw qa suite`
  - 호스트에서 repo 기반 QA 시나리오를 직접 실행합니다.
  - 기본적으로 격리된 gateway worker를 사용해 여러 선택된 시나리오를 병렬로 실행합니다.
    `qa-channel`의 기본 동시성은 4이며(선택된 시나리오 수에 의해 제한됨),
    worker 수를 조정하려면 `--concurrency <count>`를 사용하고, 예전의 직렬 lane이 필요하면
    `--concurrency 1`을 사용하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요하면 `--allow-failures`를 사용하세요.
  - provider 모드 `live-frontier`, `mock-openai`, `aimock`를 지원합니다.
    `aimock`은 실험적 fixture 및 프로토콜 mock 커버리지를 위해
    시나리오 인지형 `mock-openai` lane을 대체하지 않고 로컬 AIMock 기반 provider 서버를 시작합니다.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 내부에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 provider/model 선택 플래그를 재사용합니다.
  - live 실행은 게스트에서 실용적인 범위의 지원 QA 인증 입력을 전달합니다:
    env 기반 provider 키, QA live provider config 경로, 존재할 경우 `CODEX_HOME`.
  - 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 출력 디렉터리는 repo 루트 아래에 있어야 합니다.
  - 일반 QA 리포트 + 요약과 함께 Multipass 로그를
    `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm qa:lab:up`
  - 운영자 스타일 QA 작업을 위한 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드하고, 이를 Docker에서 전역 설치한 다음,
    비대화형 OpenAI API 키 온보딩을 실행하고, 기본적으로 Telegram을 구성하고,
    Plugin 활성화 시 런타임 종속성이 필요 시 설치되는지 검증하고,
    doctor를 실행한 뒤, mock된 OpenAI 엔드포인트에 대해 로컬 agent 턴 하나를 실행합니다.
  - Discord로 동일한 패키지 설치 lane을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 공개된 OpenClaw 패키지를 설치하고, 설치된 패키지 온보딩을 실행하고,
    설치된 CLI를 통해 Telegram을 구성한 다음,
    설치된 패키지를 SUT Gateway로 사용해 live Telegram QA lane을 재사용합니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env 자격 증명 또는 Convex 자격 증명 소스를 사용합니다.
    CI/릴리스 자동화에서는
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와
    `OPENCLAW_QA_CONVEX_SITE_URL` 및 역할 시크릿을 설정하세요.
    CI에서 `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex 역할 시크릿이 있으면,
    Docker 래퍼는 자동으로 Convex를 선택합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는
    이 lane에 대해서만 공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다.
  - GitHub Actions는 이 lane을 수동 maintainer 워크플로
    `NPM Telegram Beta E2E`로 노출합니다. merge 시에는 실행되지 않습니다.
    이 워크플로는 `qa-live-shared` 환경과 Convex CI 자격 증명 lease를 사용합니다.
- `pnpm test:docker:bundled-channel-deps`
  - 현재 OpenClaw 빌드를 패킹하고 Docker에 설치한 후, OpenAI를 구성하여 Gateway를 시작하고,
    config 편집을 통해 번들 channel/plugins를 활성화합니다.
  - 설정 검색이 구성되지 않은 Plugin 런타임 종속성을 그대로 비활성 상태로 두는지,
    처음 구성된 Gateway 또는 doctor 실행 시 각 번들 Plugin의 런타임 종속성이 필요 시 설치되는지,
    그리고 두 번째 재시작에서 이미 활성화된 종속성이 다시 설치되지 않는지를 검증합니다.
  - 또한 알려진 이전 npm 기준 버전을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화한 뒤,
    candidate의 업데이트 후 doctor가
    하네스 측 postinstall 복구 없이 번들 channel 런타임 종속성을 복구하는지도 검증합니다.
- `pnpm openclaw qa aimock`
  - 직접 프로토콜 스모크 테스트를 위해 로컬 AIMock provider 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver에 대해 Matrix live QA lane을 실행합니다.
  - 이 QA 호스트는 현재 repo/dev 전용입니다. 패키지형 OpenClaw 설치에는
    `qa-lab`이 포함되지 않으므로 `openclaw qa`를 노출하지 않습니다.
  - repo 체크아웃은 번들 러너를 직접 로드하며, 별도의 Plugin 설치 단계가 필요하지 않습니다.
  - 임시 Matrix 사용자 세 명(`driver`, `sut`, `observer`)과 비공개 룸 하나를 프로비저닝한 뒤,
    실제 Matrix Plugin을 SUT 전송 수단으로 사용하는 QA gateway child를 시작합니다.
  - 기본적으로 고정된 안정 Tuwunel 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`을 사용합니다.
    다른 이미지를 테스트해야 하면 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`로 재정의하세요.
  - Matrix는 로컬에서 일회용 사용자를 프로비저닝하므로 공유 자격 증명 소스 플래그를 노출하지 않습니다.
  - Matrix QA 리포트, 요약, observed-events 아티팩트, 결합된 stdout/stderr 출력 로그를
    `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT bot 토큰을 사용해 실제 비공개 그룹에 대해 Telegram live QA lane을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`,
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. group id는 숫자형 Telegram chat id여야 합니다.
  - 공유 풀 자격 증명을 위해 `--credential-source convex`를 지원합니다.
    기본적으로는 env 모드를 사용하고, 풀 lease를 사용하려면
    `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요하면 `--allow-failures`를 사용하세요.
  - 동일한 비공개 그룹 안의 서로 다른 두 bot이 필요하며, SUT bot은 Telegram 사용자 이름을 노출해야 합니다.
  - 안정적인 bot 간 관찰을 위해 `@BotFather`에서 두 bot 모두에 대해 Bot-to-Bot Communication Mode를 활성화하고,
    driver bot이 그룹 bot 트래픽을 관찰할 수 있도록 하세요.
  - Telegram QA 리포트, 요약, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
    응답 시나리오에는 driver 전송 요청부터 관찰된 SUT 응답까지의 RTT가 포함됩니다.

live transport lane은 새 transport가 드리프트하지 않도록 하나의 표준 계약을 공유합니다.

`qa-channel`은 여전히 광범위한 합성 QA 스위트이며 live
transport 커버리지 매트릭스에는 포함되지 않습니다.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex를 통한 공유 Telegram 자격 증명 (v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)를 활성화하면,
QA lab은 Convex 기반 풀에서 독점 lease를 획득하고, lane이 실행되는 동안 해당 lease에 Heartbeat를 보내며,
종료 시 lease를 해제합니다.

참고용 Convex 프로젝트 스캐폴드:

- `qa/convex-credential-broker/`

필수 env 변수:

- `OPENCLAW_QA_CONVEX_SITE_URL` (예: `https://your-deployment.convex.site`)
- 선택한 역할에 대한 시크릿 하나:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI에서는 기본 `ci`, 그 외에는 `maintainer`)

선택적 env 변수:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (선택적 trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

정상 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`에 `https://`를 사용해야 합니다.

maintainer 관리자 명령(pool 추가/제거/목록)에는
구체적으로 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

maintainer용 CLI 도우미:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

스크립트 및 CI 유틸리티에서 기계가 읽을 수 있는 출력을 사용하려면 `--json`을 사용하세요.

기본 엔드포인트 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }` (또는 비어 있는 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }` (또는 비어 있는 `2xx`)
- `POST /admin/add` (maintainer 시크릿 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove` (maintainer 시크릿 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease 보호: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (maintainer 시크릿 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram kind의 payload 형식:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자형 Telegram chat id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형식을 검증하고 잘못된 payload를 거부합니다.

### QA에 채널 추가하기

마크다운 QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 채널용 transport 어댑터
2. 채널 계약을 검증하는 시나리오 팩

공유 `qa-lab` 호스트가 흐름을 담당할 수 있다면 새로운 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 담당합니다.

- `openclaw qa` 명령 루트
- 스위트 시작과 종료
- worker 동시성
- 아티팩트 기록
- 리포트 생성
- 시나리오 실행
- 오래된 `qa-channel` 시나리오용 호환 별칭

러너 Plugin은 transport 계약을 담당합니다.

- 공유 `qa` 루트 아래에 `openclaw qa <runner>`를 어떻게 마운트하는지
- 해당 transport에 맞게 Gateway를 어떻게 구성하는지
- 준비 상태를 어떻게 확인하는지
- 인바운드 이벤트를 어떻게 주입하는지
- 아웃바운드 메시지를 어떻게 관찰하는지
- transcript 및 정규화된 transport 상태를 어떻게 노출하는지
- transport 기반 작업을 어떻게 실행하는지
- transport 전용 reset 또는 cleanup을 어떻게 처리하는지

새 채널 도입의 최소 기준은 다음과 같습니다.

1. 공유 `qa` 루트의 소유자는 `qa-lab`으로 유지합니다.
2. 공유 `qa-lab` 호스트 seam에서 transport 러너를 구현합니다.
3. transport 전용 메커니즘은 러너 Plugin 또는 채널 하네스 내부에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다.
   러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 export해야 합니다.
   `runtime-api.ts`는 가볍게 유지하고, 지연 CLI 및 러너 실행은 별도 엔트리포인트 뒤에 두세요.
5. 주제별 `qa/scenarios/` 디렉터리 아래에 마크다운 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 일반 시나리오 도우미를 사용합니다.
7. repo가 의도적인 마이그레이션을 수행 중이 아닌 한 기존 호환 별칭이 계속 동작하게 유지합니다.

판단 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있다면 `qa-lab`에 넣습니다.
- 동작이 하나의 채널 transport에 의존한다면 해당 러너 Plugin 또는 Plugin 하네스 안에 유지합니다.
- 둘 이상의 채널에서 사용할 수 있는 새 기능이 시나리오에 필요하다면 `suite.ts`에 채널 전용 분기를 추가하는 대신 일반 도우미를 추가합니다.
- 동작이 하나의 transport에만 의미가 있다면 시나리오를 transport 전용으로 유지하고 그 점을 시나리오 계약에서 명시합니다.

새 시나리오에 선호되는 일반 도우미 이름은 다음과 같습니다.

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

기존 시나리오용 호환 별칭도 계속 사용할 수 있습니다.

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

새 채널 작업에는 일반 도우미 이름을 사용해야 합니다.
호환 별칭은 일괄 마이그레이션을 피하기 위해 존재하는 것이며,
새 시나리오 작성의 모델이 아닙니다.

## 테스트 스위트(어디에서 무엇이 실행되는가)

스위트는 “현실성이 증가하는 순서”(그리고 flaky함/비용도 증가하는 순서)로 생각하면 됩니다.

### Unit / integration(기본값)

- 명령: `pnpm test`
- 구성: 대상 미지정 실행은 `vitest.full-*.config.ts` shard 집합을 사용하며 병렬 스케줄링을 위해 다중 프로젝트 shard를 프로젝트별 구성으로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`에서 다루는 허용 목록 `ui` node 테스트
- 범위:
  - 순수 unit 테스트
  - 프로세스 내 integration 테스트(gateway auth, 라우팅, tooling, 파싱, config)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대사항:
  - CI에서 실행됨
  - 실제 키가 필요 없음
  - 빠르고 안정적이어야 함
    <AccordionGroup>
    <Accordion title="프로젝트, shard, 범위 지정 lane"> - 대상 미지정 `pnpm test`는 거대한 단일 네이티브 루트 프로젝트 프로세스 하나 대신 열두 개의 더 작은 shard 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 있는 머신에서 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 잠식하는 일을 피할 수 있습니다. - `pnpm test --watch`는 다중 shard watch 루프가 실용적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다. - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적인 파일/디렉터리 대상을 먼저 범위 지정 lane으로 라우팅하므로 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다. - `pnpm test:changed`는 diff가 라우팅 가능한 소스/테스트 파일만 건드릴 경우 변경된 git 경로를 동일한 범위 지정 lane으로 확장합니다. config/setup 편집은 여전히 광범위한 루트 프로젝트 재실행으로 대체됩니다. - `pnpm check:changed`는 좁은 작업에 대한 일반적인 스마트 로컬 게이트입니다. diff를 core, core tests, extensions, extension tests, apps, docs, 릴리스 메타데이터, tooling으로 분류한 다음 일치하는 typecheck/lint/test lane을 실행합니다. 공개 Plugin SDK 및 plugin-contract 변경에는 extensions가 이러한 core 계약에 의존하므로 extension 검증 패스 하나가 포함됩니다. 릴리스 메타데이터 전용 버전 범프는 전체 스위트 대신 대상 지정된 version/config/root-dependency 검사를 실행하며, 최상위 version 필드 외의 package 변경을 거부하는 가드가 있습니다. - agents, commands, plugins, auto-reply 도우미, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import가 가벼운 unit 테스트는 `test/setup-openclaw-runtime.ts`를 건너뛰는 `unit-fast` lane을 통해 라우팅됩니다. 상태가 있거나 런타임이 무거운 파일은 기존 lane에 남습니다. - 선택된 `plugin-sdk` 및 `commands` 도우미 소스 파일은 변경 모드 실행을 해당하는 가벼운 lane의 명시적 sibling 테스트로도 매핑하므로, 도우미 편집 시 해당 디렉터리의 전체 무거운 스위트를 다시 실행할 필요가 없습니다. - `auto-reply`에는 세 개의 전용 버킷이 있습니다. 최상위 core 도우미, 최상위 `reply.*` integration 테스트, `src/auto-reply/reply/**` 하위 트리입니다. 이렇게 하면 가장 무거운 reply 하네스 작업이 가벼운 status/chunk/token 테스트에 얹히지 않습니다.
    </Accordion>

      <Accordion title="임베디드 러너 커버리지">
        - 메시지 도구 검색 입력 또는 Compaction 런타임 컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
        - 순수 라우팅 및 정규화 경계에는 집중된 도우미 회귀 테스트를 추가하세요.
        - 임베디드 러너 integration 스위트가 정상 상태를 유지하게 하세요:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - 이 스위트들은 범위 지정된 id와 Compaction 동작이 실제 `run.ts` / `compact.ts` 경로를 계속 통과하는지 검증합니다. 도우미 전용 테스트는 이러한 integration 경로를 대체하기에 충분하지 않습니다.
      </Accordion>

      <Accordion title="Vitest 풀 및 기본 격리 설정">
        - 기본 Vitest config는 `threads`를 기본값으로 사용합니다.
        - 공유 Vitest config는 `isolate: false`를 고정하고 루트 프로젝트, e2e, live config 전반에 걸쳐 비격리 러너를 사용합니다.
        - 루트 UI lane은 `jsdom` 설정과 optimizer를 유지하지만, 공유 비격리 러너에서도 실행됩니다.
        - 각 `pnpm test` shard는 공유 Vitest config에서 동일한 `threads` + `isolate: false` 기본값을 상속받습니다.
        - `scripts/run-vitest.mjs`는 큰 로컬 실행 중 V8 컴파일 churn을 줄이기 위해 기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`를 추가합니다.
          기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
      </Accordion>

      <Accordion title="빠른 로컬 반복 작업">
        - `pnpm changed:lanes`는 diff가 어떤 아키텍처 lane을 트리거하는지 보여줍니다.
        - pre-commit hook은 포맷팅 전용입니다. 포맷된 파일을 다시 stage하지만 lint, typecheck, 테스트는 실행하지 않습니다.
        - 스마트 로컬 게이트가 필요할 때는 handoff 또는 push 전에 `pnpm check:changed`를 명시적으로 실행하세요. 공개 Plugin SDK 및 plugin-contract 변경에는 extension 검증 패스 하나가 포함됩니다.
        - `pnpm test:changed`는 변경된 경로가 더 작은 스위트에 깔끔하게 매핑될 때 범위 지정 lane을 통해 라우팅됩니다.
        - `pnpm test:max`와 `pnpm test:changed:max`도 동일한 라우팅 동작을 유지하며, 단지 worker 상한만 더 높습니다.
        - 로컬 worker 자동 스케일링은 의도적으로 보수적이며 호스트 load average가 이미 높을 때는 후퇴하므로, 여러 Vitest 실행을 동시에 돌려도 기본적으로 피해를 덜 줍니다.
        - 기본 Vitest config는 테스트 wiring이 변경될 때 변경 모드 재실행이 올바르게 유지되도록 프로젝트/config 파일을 `forceRerunTriggers`로 표시합니다.
        - config는 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성 상태로 유지합니다. 직접 프로파일링용 명시적 캐시 위치 하나를 원한다면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.
      </Accordion>

      <Accordion title="성능 디버깅">
        - `pnpm test:perf:imports`는 Vitest import 소요 시간 리포팅과 import 세부 분석 출력을 활성화합니다.
        - `pnpm test:perf:imports:changed`는 동일한 프로파일링 보기를 `origin/main` 이후 변경된 파일로 범위 지정합니다.
        - 하나의 hot 테스트가 여전히 시작 import에 대부분의 시간을 소비한다면,
          무거운 종속성은 좁은 로컬 `*.runtime.ts` seam 뒤에 두고, 단지
          `vi.mock(...)`에 전달하기 위해 런타임 도우미를 deep-import하지 말고
          해당 seam을 직접 mock하세요.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 라우팅된
          `test:changed`와 해당 커밋된 diff에 대한 네이티브 루트 프로젝트 경로를 비교하고
          wall time과 macOS 최대 RSS를 출력합니다.
        - `pnpm test:perf:changed:bench -- --worktree`는 현재 dirty tree를
          `scripts/test-projects.mjs`와 루트 Vitest config를 통해
          변경 파일 목록에 라우팅하여 벤치마크합니다.
        - `pnpm test:perf:profile:main`은
          Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
        - `pnpm test:perf:profile:runner`는
          파일 병렬화를 비활성화한 unit 스위트의 runner CPU+heap 프로파일을 기록합니다.
      </Accordion>
    </AccordionGroup>

### 안정성(Gateway)

- 명령: `pnpm test:stability:gateway`
- 구성: `vitest.gateway.config.ts`, worker 1개로 강제
- 범위:
  - 기본적으로 진단이 활성화된 실제 loopback Gateway를 시작
  - 진단 이벤트 경로를 통해 합성 gateway 메시지, 메모리, 대형 payload churn을 구동
  - Gateway WS RPC를 통해 `diagnostics.stability` 조회
  - 진단 안정성 번들 지속성 도우미 커버
  - recorder가 제한된 상태를 유지하고, 합성 RSS 샘플이 압박 예산 아래에 머물며, 세션별 큐 깊이가 다시 0으로 배출되는지 검증
- 기대사항:
  - CI 안전 및 키 불필요
  - 안정성 회귀 후속 조치를 위한 좁은 lane이며, 전체 Gateway 스위트를 대체하지는 않음

### E2E(Gateway 스모크)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin E2E 테스트
- 런타임 기본값:
  - repo의 나머지와 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 worker를 사용합니다(CI: 최대 2, 로컬: 기본 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행됩니다.
- 유용한 재정의:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`(상한 16)
  - 자세한 콘솔 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`
- 범위:
  - 다중 인스턴스 gateway 엔드투엔드 동작
  - WebSocket/HTTP 표면, Node 페어링, 더 무거운 네트워킹
- 기대사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키 불필요
  - unit 테스트보다 구성 요소가 더 많음(더 느릴 수 있음)

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell Gateway를 시작
  - 임시 로컬 Dockerfile에서 sandbox 생성
  - 실제 `sandbox ssh-config` + SSH exec을 통해 OpenClaw의 OpenShell 백엔드를 실행
  - sandbox fs bridge를 통해 원격 정규 파일시스템 동작을 검증
- 기대사항:
  - 옵트인 전용이며 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 동작하는 Docker 데몬 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 Gateway와 sandbox를 삭제
- 유용한 재정의:
  - 더 넓은 e2e 스위트를 수동으로 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI 바이너리 또는 래퍼 스크립트를 지정하려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live(실제 provider + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin live 테스트
- 기본값: `pnpm test:live`로 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 provider/model이 실제 자격 증명으로 _오늘_ 실제로 동작하는가?”
  - provider 형식 변경, 도구 호출 특이점, 인증 문제, rate limit 동작 포착
- 기대사항:
  - 설계상 CI 안정적이지 않음(실제 네트워크, 실제 provider 정책, quota, 장애)
  - 비용이 들고 / rate limit을 사용함
  - “전체”보다는 범위를 좁힌 부분집합 실행을 선호
- live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소스로 사용합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈으로 복사하므로 unit fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 실제 홈 디렉터리를 사용하도록 의도적으로 설정한 경우에만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본값으로 사용합니다. `[live] ...` 진행 출력은 유지하지만 추가 `~/.profile` 알림은 숨기고 gateway bootstrap 로그/Bonjour chatter는 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(provider별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나 live별 재정의를 위해 `OPENCLAW_LIVE_*_KEY`를 설정하세요. 테스트는 rate limit 응답 시 재시도합니다.
- 진행/Heartbeat 출력:
  - 이제 live 스위트는 진행 줄을 stderr로 출력하므로 Vitest 콘솔 캡처가 조용할 때도 긴 provider 호출이 눈에 보이게 활성 상태를 유지합니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 provider/gateway 진행 줄이 live 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/probe Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

다음 결정 표를 사용하세요.

- 로직/테스트 수정: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도)
- gateway 네트워킹 / WS 프로토콜 / 페어링 수정: `pnpm test:e2e` 추가
- “내 봇이 다운됐다” / provider 전용 실패 / 도구 호출 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## Live(네트워크 접촉) 테스트

live 모델 매트릭스, CLI 백엔드 스모크, ACP 스모크, Codex app-server
하네스, 모든 미디어 provider live 테스트(Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) 및 live 실행용 자격 증명 처리에 대해서는
[테스트 — live 스위트](/ko/help/testing-live)를 참고하세요.

## Docker 러너(선택적 “Linux에서 동작함” 확인)

이 Docker 러너는 두 가지 범주로 나뉩니다.

- live-model 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 repo Docker 이미지 내부에서 해당 프로필 키 live 파일만 실행합니다(`src/agents/models.profiles.live.test.ts`와 `src/gateway/gateway-models.profiles.live.test.ts`). 로컬 config 디렉터리와 워크스페이스를 마운트하고(마운트된 경우 `~/.profile`도 소스로 사용) 실행합니다. 대응하는 로컬 엔트리포인트는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 러너는 전체 Docker 스윕이 실용적으로 유지되도록 기본적으로 더 작은 스모크 상한을 사용합니다:
  `test:docker:live-models`는 기본값으로 `OPENCLAW_LIVE_MAX_MODELS=12`를 사용하고,
  `test:docker:live-gateway`는 기본값으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`를 사용합니다. 더 큰 전체 스캔을 명시적으로 원할 때는 해당 env 변수를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 뒤, 이를 두 개의 live Docker lane에서 재사용합니다. 또한 `test:docker:e2e-build`를 통해 공유 `scripts/e2e/Dockerfile` 이미지 하나를 빌드하고, 빌드된 앱을 검증하는 E2E 컨테이너 스모크 러너에서 이를 재사용합니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 integration 경로를 검증합니다.

live-model Docker 러너는 필요한 CLI auth 홈만 bind-mount하고(실행 범위가 좁혀지지 않은 경우에는 지원되는 모든 홈), 실행 전에 이를 컨테이너 홈으로 복사하므로 외부 CLI OAuth가 호스트 auth 저장소를 변경하지 않고 토큰을 새로 고칠 수 있습니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server 하네스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm tarball 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패킹된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩을 통해 OpenAI와 기본적으로 Telegram을 구성하고, doctor가 활성화된 Plugin 런타임 종속성을 복구하는지 검증하며, mock된 OpenAI 에이전트 턴 하나를 실행합니다. 미리 빌드한 tarball을 재사용하려면 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하고, 호스트 재빌드를 건너뛰려면 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, 채널을 바꾸려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패킹하고, 이를 격리된 홈에서 `bun install -g`로 설치한 뒤, `openclaw infer image providers --json`이 멈추지 않고 번들 image provider를 반환하는지 검증합니다. 미리 빌드한 tarball을 재사용하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, 호스트 빌드를 건너뛰려면 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, 또는 빌드된 Docker 이미지에서 `dist/`를 복사하려면 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`을 사용하세요.
- 설치 Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 루트, 업데이트, direct-npm 컨테이너 간에 하나의 npm 캐시를 공유합니다. 업데이트 스모크는 candidate tarball로 업그레이드하기 전에 npm `latest`를 안정 기준으로 기본 사용합니다. 비 root 설치 프로그램 검사는 격리된 npm 캐시를 유지하므로 root 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않습니다. 로컬 재실행 간 루트/업데이트/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정하세요.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복되는 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요할 때는 해당 env 없이 스크립트를 로컬에서 실행하세요.
- Gateway 네트워킹(두 컨테이너, WS auth + health): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` 최소 reasoning 회귀: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)은 mock된 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 뒤, provider 스키마 거부를 강제로 발생시키고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(seed된 Gateway + stdio 브리지 + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP 도구(실제 stdio MCP 서버 + 임베디드 Pi 프로필 허용/거부 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP 정리(실제 Gateway + stdio MCP child 종료, 격리된 Cron 및 일회성 subagent 실행 후): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 시맨틱): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
- Plugin 업데이트 변경 없음 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- 번들 Plugin 런타임 종속성: `pnpm test:docker:bundled-channel-deps`는 기본적으로 작은 Docker 러너 이미지를 빌드하고, 호스트에서 OpenClaw를 한 번 빌드 및 패킹한 다음, 각 Linux 설치 시나리오에 그 tarball을 마운트합니다. 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`, 최근 로컬 빌드 후 호스트 재빌드를 건너뛰려면 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, 기존 tarball을 지정하려면 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하세요.
- 반복 작업 중에는 관련 없는 시나리오를 비활성화해 번들 Plugin 런타임 종속성 범위를 좁히세요. 예:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

공유 빌드 앱 이미지를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 스위트 전용 이미지 재정의가 설정되어 있으면 그것이 계속 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리킬 경우, 스크립트는 해당 이미지가 로컬에 없으면 pull합니다. QR 및 설치 프로그램 Docker 테스트는 공유 빌드 앱 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

live-model Docker 러너는 현재 체크아웃도 읽기 전용으로 bind-mount하고,
이를 컨테이너 내부의 임시 workdir로 stage합니다. 이렇게 하면 런타임
이미지는 가볍게 유지하면서도 정확히 로컬 소스/config에 대해 Vitest를 실행할 수 있습니다.
staging 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`,
앱 로컬 `.build` 또는 Gradle 출력 디렉터리처럼 큰 로컬 전용 캐시와 앱 빌드 출력은 건너뛰므로
Docker live 실행이 머신 전용 아티팩트를 복사하느라 몇 분씩 소비하지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 gateway live 프로브가
컨테이너 내부에서 실제 Telegram/Discord 등의 채널 worker를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로,
해당 Docker lane에서 gateway
live 커버리지를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. OpenAI 호환 HTTP 엔드포인트가 활성화된
OpenClaw gateway 컨테이너를 시작하고, 해당 gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작한 뒤,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 검증한 다음,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 전송합니다.
첫 실행은 Docker가
Open WebUI 이미지를 pull해야 하거나 Open WebUI 자체의 콜드 스타트 설정을 완료해야 할 수 있으므로 눈에 띄게 더 느릴 수 있습니다.
이 lane은 사용 가능한 live 모델 키를 기대하며, Dockerized 실행에서 이를 제공하는 주요 방법은
`OPENCLAW_PROFILE_FILE`(기본값 `~/.profile`)입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제
Telegram, Discord 또는 iMessage 계정이 필요하지 않습니다. seed된 Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 실행하는 두 번째 컨테이너를 시작한 뒤,
라우팅된 대화 검색, transcript 읽기, 첨부 메타데이터,
live 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 +
권한 알림을 실제 stdio MCP 브리지를 통해 검증합니다. 알림 검사는
원시 stdio MCP 프레임을 직접 검사하므로, 이 스모크는 특정 클라이언트 SDK가 표면화하는 내용이 아니라
브리지가 실제로 무엇을 내보내는지를 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 live
모델 키가 필요하지 않습니다. repo Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP probe 서버를 시작하고,
임베디드 Pi bundle
MCP 런타임을 통해 해당 서버를 materialize하고, 도구를 실행한 다음, `coding`과 `messaging`은
`bundle-mcp` 도구를 유지하고 `minimal` 및 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 검증합니다.
`test:docker:cron-mcp-cleanup`도 결정적이며 live 모델
키가 필요하지 않습니다. 실제 stdio MCP probe 서버가 있는 seed된 Gateway를 시작하고,
격리된 Cron 턴과 `/subagents spawn` 일회성 child 턴을 실행한 다음,
각 실행 후 MCP child 프로세스가 종료되는지 검증합니다.

수동 ACP 일반 언어 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버깅 워크플로를 위해 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env 변수:

- `OPENCLAW_CONFIG_DIR=...` (기본값: `~/.openclaw`) → `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...` (기본값: `~/.openclaw/workspace`) → `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...` (기본값: `~/.profile`) → `/home/node/.profile`에 마운트되며 테스트 실행 전에 소스로 사용
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 임시 config/workspace 디렉터리와 외부 CLI auth 마운트 없이 `OPENCLAW_PROFILE_FILE`에서 소싱된 env 변수만 검증합니다
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (기본값: `~/.cache/openclaw/docker-cli-tools`) → Docker 내부 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트
- `$HOME` 아래 외부 CLI auth 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 뒤, 테스트 시작 전에 `/home/node/...`로 복사됩니다
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 디렉터리/파일만 마운트합니다
  - 수동 재정의: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부 provider 필터링은 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 자격 증명이 profile 저장소에서 오도록 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`(env 아님)
- Open WebUI 스모크를 위해 gateway가 노출하는 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크에서 사용하는 nonce 확인 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`

## 문서 상태 점검

문서를 편집한 후에는 docs 검사를 실행하세요: `pnpm check:docs`.
페이지 내 heading 검사까지 필요할 때는 전체 Mintlify anchor 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

이들은 실제 provider 없이도 “실제 파이프라인” 회귀를 검증합니다.

- Gateway 도구 호출(mock OpenAI, 실제 gateway + agent 루프): `src/gateway/gateway.test.ts` (케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, config + auth 강제 기록): `src/gateway/gateway.test.ts` (케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

이미 몇 가지 CI 안전 테스트가 있으며, “에이전트 신뢰성 평가”처럼 동작합니다.

- 실제 gateway + agent 루프를 통한 mock 도구 호출 (`src/gateway/gateway.test.ts`)
- 세션 wiring과 config 효과를 검증하는 엔드투엔드 마법사 흐름 (`src/gateway/gateway.test.ts`)

Skills에 대해 아직 부족한 부분([Skills](/ko/tools/skills) 참고):

- **의사결정:** 프롬프트에 skills가 나열될 때, 에이전트가 올바른 skill을 선택하는가(또는 관련 없는 skill을 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필요한 단계/인수를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 기록 이어받기, 샌드박스 경계를 검증하는 다중 턴 시나리오

향후 평가는 우선 결정적으로 유지해야 합니다:

- mock provider를 사용하는 시나리오 러너로 도구 호출 + 순서, skill 파일 읽기, 세션 wiring을 검증합니다.
- skill 중심 시나리오의 작은 스위트(사용 vs 회피, gating, 프롬프트 주입)를 추가합니다.
- CI 안전 스위트가 준비된 뒤에만 선택적 live evals(옵트인, env-gated)를 추가합니다.

## Contract 테스트(Plugin 및 채널 형상)

Contract 테스트는 등록된 모든 Plugin 및 채널이 해당 인터페이스 계약을 준수하는지 검증합니다. 검색된 모든 Plugin을 순회하며 형상 및 동작 검증 스위트를 실행합니다. 기본 `pnpm test` unit lane은 이러한 공유 seam 및 스모크 파일을 의도적으로 건너뛰므로, 공유 채널 또는 provider 표면을 수정할 때는 contract 명령을 명시적으로 실행하세요.

### 명령

- 전체 contract: `pnpm test:contracts`
- 채널 contract만: `pnpm test:contracts:channels`
- provider contract만: `pnpm test:contracts:plugins`

### 채널 contract

`src/channels/plugins/contracts/*.contract.test.ts`에 위치:

- **plugin** - 기본 Plugin 형상(id, name, capabilities)
- **setup** - setup 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 action 핸들러
- **threading** - 스레드 ID 처리
- **directory** - 디렉터리/roster API
- **group-policy** - 그룹 정책 강제

### Provider 상태 contract

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **status** - 채널 상태 프로브
- **registry** - Plugin 레지스트리 형상

### Provider contract

`src/plugins/contracts/*.contract.test.ts`에 위치:

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - Plugin 검색
- **loader** - Plugin 로딩
- **runtime** - provider 런타임
- **shape** - Plugin 형상/인터페이스
- **wizard** - setup 마법사

### 실행 시점

- plugin-sdk export 또는 하위 경로를 변경한 후
- 채널 또는 provider Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 검색을 리팩터링한 후

Contract 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 테스트 추가 가이드

live에서 발견된 provider/model 이슈를 수정할 때:

- 가능하면 CI 안전 회귀 테스트를 추가하세요(mock/stub provider, 또는 정확한 요청 형상 변환 캡처)
- 본질적으로 live 전용이라면(rate limit, 인증 정책), live 테스트를 좁은 범위로 유지하고 env 변수로 옵트인하도록 하세요
- 버그를 포착할 수 있는 가장 작은 계층을 대상으로 하는 것을 우선하세요:
  - provider 요청 변환/재생 버그 → 직접 모델 테스트
  - gateway 세션/기록/도구 파이프라인 버그 → gateway live 스모크 또는 CI 안전 gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별 샘플 대상 하나를 도출한 뒤, 순회 세그먼트 exec id가 거부되는지 검증합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 계열을 추가한다면, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 id에서 의도적으로 실패하므로, 새 클래스가 조용히 건너뛰어질 수 없습니다.

## 관련 항목

- [live 테스트](/ko/help/testing-live)
- [CI](/ko/ci)
