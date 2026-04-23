---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/provider 버그에 대한 회귀 테스트 추가하기
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: unit/e2e/live 스위트, Docker 러너, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-23T14:03:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# 테스트

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker 러너가 있습니다.

이 문서는 “어떻게 테스트하는가”에 대한 가이드입니다.

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 무엇을 다루지 않는지)
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에서 어떤 명령을 실행할지
- live 테스트가 자격 증명을 어떻게 찾고 모델/provider를 어떻게 선택하는지
- 실제 모델/provider 문제에 대한 회귀 테스트를 추가하는 방법

## 빠른 시작

대부분의 날에는:

- 전체 게이트(푸시 전 예상): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 직접 파일 타기팅은 이제 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복하는 중이라면 먼저 대상 범위를 좁힌 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 건드렸거나 더 높은 신뢰가 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 provider/모델을 디버깅할 때(실제 자격 증명 필요):

- live 스위트(모델 + Gateway 도구/이미지 프로브): `pnpm test:live`
- 하나의 live 파일만 조용히 타기팅: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 모델 스윕: `pnpm test:docker:live-models`
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 둘 다 재사용 가능한 live/E2E 워크플로를
    `include_live_suites: true`와 함께 호출하며, 여기에는 provider별로 샤딩된
    별도의 Docker live 모델 매트릭스 작업이 포함됩니다.
  - 집중된 CI 재실행의 경우 `OpenClaw Live And E2E Checks (Reusable)`를
    `include_live_suites: true`와 `live_models_only: true`로 디스패치하세요.
  - 새 고신호 provider 시크릿은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 그
    scheduled/release 호출자에 추가하세요.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`를 설정한 상태에서
  `openclaw models list --provider moonshot --json`를 실행한 뒤, `moonshot/kimi-k2.6`에 대해
  격리된 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  를 실행하세요. JSON이 Moonshot/K2.6을 보고하는지, 그리고
  어시스턴트 transcript가 정규화된 `usage.cost`를 저장하는지 확인하세요.

팁: 하나의 실패 사례만 필요할 때는 아래에 설명된 allowlist env vars로 live 테스트 범위를 좁히는 방식을 선호하세요.

## QA 전용 러너

이 명령들은 QA-lab 수준의 현실성이 필요할 때 메인 테스트 스위트 옆에 있습니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. `Parity gate`는 일치하는 PR과
수동 디스패치에서 mock provider로 실행됩니다. `QA-Lab - All Lanes`는 매일 밤 `main`에서,
그리고 수동 디스패치에서는 mock parity gate, live Matrix 레인, Convex 관리 live Telegram 레인을
병렬 작업으로 실행합니다. `OpenClaw Release Checks`는 릴리스 승인 전에 동일한 레인을 실행합니다.

- `pnpm openclaw qa suite`
  - 저장소 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 기본적으로 격리된 Gateway 워커와 함께 여러 선택된 시나리오를 병렬로 실행합니다.
    `qa-channel`은 기본 동시성 4를 사용합니다(선택된 시나리오 수에 의해 제한됨).
    워커 수를 조정하려면 `--concurrency <count>`를, 이전 직렬 레인을 원하면 `--concurrency 1`을 사용하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 종료 코드를 반환합니다. 실패 종료 코드 없이 아티팩트를 원하면 `--allow-failures`를 사용하세요.
  - provider 모드 `live-frontier`, `mock-openai`, `aimock`를 지원합니다.
    `aimock`은 시나리오 인식 `mock-openai` 레인을 대체하지 않으면서,
    실험적인 픽스처 및 프로토콜 mock 커버리지를 위해 로컬 AIMock 기반 provider 서버를 시작합니다.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 안에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 provider/모델 선택 플래그를 재사용합니다.
  - live 실행은 게스트에서 실용적인 지원 QA 인증 입력을 전달합니다:
    env 기반 provider 키, QA live provider config 경로, 그리고 존재할 경우 `CODEX_HOME`.
  - 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 출력 디렉터리는 저장소 루트 아래에 있어야 합니다.
  - 일반 QA 보고서 + 요약과 함께 Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm qa:lab:up`
  - 운영자 스타일 QA 작업을 위한 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드하고, 이를 Docker에 전역 설치한 다음,
    비대화형 OpenAI API 키 온보딩을 실행하고, 기본적으로 Telegram을 구성하며,
    plugin 활성화가 필요 시 런타임 의존성을 주문형으로 설치하는지 검증하고,
    doctor를 실행한 뒤 mock OpenAI 엔드포인트에 대해 하나의 로컬 에이전트 턴을 실행합니다.
  - Discord로 동일한 패키지 설치 레인을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- `pnpm test:docker:bundled-channel-deps`
  - 현재 OpenClaw 빌드를 패키징해 Docker에 설치하고, OpenAI가 구성된 상태로 Gateway를 시작한 다음,
    config 편집을 통해 번들 채널/plugin을 활성화합니다.
  - 설정 검색이 구성되지 않은 plugin 런타임 의존성을 그대로 두는지,
    첫 번째 구성된 Gateway 또는 doctor 실행이 각 번들 plugin의 런타임 의존성을 주문형으로 설치하는지,
    그리고 두 번째 재시작이 이미 활성화된 의존성을 재설치하지 않는지 검증합니다.
  - 또한 알려진 이전 npm 기준선을 설치하고, `openclaw update --tag <candidate>` 실행 전에 Telegram을 활성화한 뒤,
    후보 버전의 업데이트 후 doctor가 하네스 측 postinstall 복구 없이
    번들 채널 런타임 의존성을 복구하는지 검증합니다.
- `pnpm openclaw qa aimock`
  - 직접 프로토콜 스모크 테스트를 위해 로컬 AIMock provider 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix live QA 레인을 실행합니다.
  - 이 QA 호스트는 현재 저장소/개발 전용입니다. 패키지형 OpenClaw 설치에는
    `qa-lab`이 포함되지 않으므로 `openclaw qa`를 노출하지 않습니다.
  - 저장소 체크아웃은 번들 러너를 직접 로드하며, 별도 plugin 설치 단계가 필요 없습니다.
  - 세 개의 임시 Matrix 사용자(`driver`, `sut`, `observer`)와 하나의 비공개 방을 프로비저닝한 뒤,
    실제 Matrix plugin을 SUT 전송으로 사용하는 QA Gateway 자식 프로세스를 시작합니다.
  - 기본적으로 고정된 안정 Tuwunel 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`를 사용합니다.
    다른 이미지를 테스트해야 할 때는 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`로 재정의하세요.
  - Matrix는 일회용 사용자를 로컬에서 프로비저닝하므로 공유 자격 증명 소스 플래그를 노출하지 않습니다.
  - Matrix QA 보고서, 요약, observed-events 아티팩트, stdout/stderr 결합 출력 로그를
    `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm openclaw qa telegram`
  - env에 있는 driver 및 SUT 봇 토큰을 사용해 실제 비공개 그룹을 대상으로 Telegram live QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`,
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`가 필요합니다. 그룹 ID는 숫자형 Telegram 채팅 ID여야 합니다.
  - 공유 풀 자격 증명에는 `--credential-source convex`를 지원합니다.
    기본은 env 모드를 사용하고, 풀 lease를 옵트인하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 어떤 시나리오라도 실패하면 0이 아닌 종료 코드를 반환합니다. 실패 종료 코드 없이 아티팩트를 원하면 `--allow-failures`를 사용하세요.
  - 동일한 비공개 그룹 안에 서로 다른 두 봇이 필요하며, SUT 봇은 Telegram 사용자 이름을 노출해야 합니다.
  - 안정적인 봇 대 봇 관찰을 위해 두 봇 모두에서 `@BotFather`의 Bot-to-Bot Communication Mode를 활성화하고,
    driver 봇이 그룹 내 봇 트래픽을 관찰할 수 있도록 하세요.
  - Telegram QA 보고서, 요약, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
    답장 시나리오에는 driver 전송 요청부터 관찰된 SUT 답장까지의 RTT가 포함됩니다.

live 전송 레인은 새 전송이 드리프트하지 않도록 하나의 표준 계약을 공유합니다.

`qa-channel`은 광범위한 합성 QA 스위트로 유지되며 live 전송 커버리지 매트릭스의 일부는 아닙니다.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex를 통한 공유 Telegram 자격 증명(v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면,
QA lab은 Convex 기반 풀에서 독점 lease를 획득하고, 레인이 실행되는 동안 해당 lease에 Heartbeat를 보내며,
종료 시 lease를 해제합니다.

참조용 Convex 프로젝트 스캐폴드:

- `qa/convex-credential-broker/`

필수 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택된 역할용 시크릿 하나:
  - `maintainer`에는 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`에는 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본 `ci`, 그 외에는 `maintainer`)

선택적 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

일반 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`에 `https://`를 사용해야 합니다.

유지관리자 관리자 명령(pool add/remove/list)에는
특히 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

유지관리자용 CLI 도우미:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

스크립트와 CI 유틸리티에서 기계가 읽기 쉬운 출력을 원하면 `--json`을 사용하세요.

기본 엔드포인트 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /admin/add`(유지관리자 시크릿 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(유지관리자 시크릿 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease 가드: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(유지관리자 시크릿 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram kind용 payload 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자형 Telegram 채팅 ID 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하고 잘못된 payload를 거부합니다.

### QA에 채널 추가하기

markdown QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 채널용 전송 어댑터
2. 채널 계약을 실행하는 시나리오 팩

공유 `qa-lab` 호스트가 흐름을 소유할 수 있는데도 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- 스위트 시작과 종료
- 워커 동시성
- 아티팩트 기록
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오용 호환성 별칭

러너 plugin은 전송 계약을 소유합니다.

- 공유 `qa` 루트 아래에 `openclaw qa <runner>`를 어떻게 마운트할지
- 해당 전송용으로 Gateway를 어떻게 구성할지
- 준비 상태를 어떻게 확인할지
- 인바운드 이벤트를 어떻게 주입할지
- 아웃바운드 메시지를 어떻게 관찰할지
- transcript와 정규화된 전송 상태를 어떻게 노출할지
- 전송 기반 작업을 어떻게 실행할지
- 전송별 리셋 또는 정리를 어떻게 처리할지

새 채널 채택의 최소 기준은 다음과 같습니다.

1. 공유 `qa` 루트의 소유자는 `qa-lab`으로 유지합니다.
2. 공유 `qa-lab` 호스트 seam에서 전송 러너를 구현합니다.
3. 전송별 메커니즘은 러너 plugin 또는 채널 하네스 내부에 둡니다.
4. 경쟁하는 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다.
   러너 plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 export해야 합니다.
   `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI와 러너 실행은 별도의 entrypoint 뒤에 남겨 두어야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 markdown 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 일반 시나리오 도우미를 사용합니다.
7. 저장소가 의도적인 마이그레이션 중이 아닌 한 기존 호환성 별칭은 계속 동작하게 유지합니다.

판단 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있다면 `qa-lab`에 넣습니다.
- 동작이 하나의 채널 전송에 의존한다면 그 러너 plugin 또는 plugin 하네스에 둡니다.
- 시나리오가 둘 이상의 채널이 사용할 수 있는 새 기능을 필요로 한다면 `suite.ts`에 채널별 분기를 넣는 대신 일반 도우미를 추가합니다.
- 동작이 하나의 전송에서만 의미가 있다면 시나리오를 전송 전용으로 유지하고 시나리오 계약에서 이를 명시합니다.

새 시나리오에 권장되는 일반 도우미 이름은 다음과 같습니다.

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

기존 시나리오용 호환성 별칭도 계속 사용할 수 있습니다.

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

새 채널 작업에는 일반 도우미 이름을 사용해야 합니다.
호환성 별칭은 일괄 전환 없는 마이그레이션을 피하기 위해 존재하는 것이지,
새 시나리오 작성의 모델이 아닙니다.

## 테스트 스위트(어디에서 무엇이 실행되는지)

스위트는 “현실성이 증가하는 순서”(그리고 불안정성/비용도 증가하는 순서)로 생각하세요.

### Unit / integration(기본)

- 명령: `pnpm test`
- 구성: 대상이 없는 실행은 `vitest.full-*.config.ts` 샤드 세트를 사용하며 병렬 스케줄링을 위해 다중 프로젝트 샤드를 프로젝트별 구성으로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`가 다루는 화이트리스트 `ui` Node 테스트
- 범위:
  - 순수 unit 테스트
  - 인프로세스 integration 테스트(Gateway 인증, 라우팅, 도구화, 파싱, 구성)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됨
  - 실제 키 필요 없음
  - 빠르고 안정적이어야 함
- 프로젝트 참고:
  - 대상이 없는 `pnpm test`는 이제 거대한 하나의 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 로드된 머신에서 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않게 합니다.
  - `pnpm test --watch`는 다중 샤드 watch 루프가 실용적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
  - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 이제 명시적인 파일/디렉터리 대상을 먼저 범위 지정된 레인으로 라우팅하므로 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 지불하지 않습니다.
  - `pnpm test:changed`는 변경된 git 경로가 라우팅 가능한 더 작은 스위트에 깔끔하게 매핑될 때 동일한 범위 지정 레인을 통해 라우팅합니다. config/setup 편집은 여전히 넓은 루트 프로젝트 재실행으로 폴백합니다.
  - `pnpm check:changed`는 좁은 작업을 위한 일반적인 스마트 로컬 게이트입니다. diff를 core, core 테스트, extensions, extension 테스트, apps, docs, 릴리스 메타데이터, tooling으로 분류한 뒤, 일치하는 typecheck/lint/test 레인을 실행합니다. 공개 Plugin SDK와 plugin-contract 변경은 extension이 해당 core 계약에 의존하므로 extension 검증을 포함합니다. 릴리스 메타데이터 전용 버전 범프는 전체 스위트 대신 대상 버전/config/root-dependency 검사를 실행하며, 최상위 버전 필드 외의 package 변경을 거부하는 가드를 둡니다.
  - agents, commands, plugins, auto-reply helpers, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import-light unit 테스트는 `test/setup-openclaw-runtime.ts`를 건너뛰는 `unit-fast` 레인을 통해 라우팅됩니다. 상태 보유/런타임 중심 파일은 기존 레인에 남습니다.
  - 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 변경 모드 실행을 그 경량 레인의 명시적 sibling 테스트에 매핑하므로 helper 편집 시 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않아도 됩니다.
  - `auto-reply`는 이제 세 개의 전용 버킷을 가집니다: 최상위 core helpers, 최상위 `reply.*` integration 테스트, 그리고 `src/auto-reply/reply/**` 하위 트리. 이렇게 하면 가장 무거운 reply 하네스 작업이 저렴한 status/chunk/token 테스트에 섞이지 않습니다.
- 내장 러너 참고:
  - 메시지 도구 검색 입력이나 Compaction 런타임 컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
  - 순수 라우팅/정규화 경계에 대해 집중된 helper 회귀 테스트를 추가하세요.
  - 또한 내장 러너 integration 스위트도 건강하게 유지하세요:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - 이 스위트는 범위 지정된 ID와 Compaction 동작이 실제 `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. helper 전용 테스트는 해당 integration 경로의 충분한 대체물이 아닙니다.
- 풀 참고:
  - 기본 Vitest 구성은 이제 기본적으로 `threads`를 사용합니다.
  - 공유 Vitest 구성은 또한 `isolate: false`를 고정하고 루트 프로젝트, e2e, live 구성 전반에서 비격리 러너를 사용합니다.
  - 루트 UI 레인은 `jsdom` 설정과 optimizer를 유지하지만, 이제 공유 비격리 러너에서도 실행됩니다.
  - 각 `pnpm test` 샤드는 공유 Vitest 구성에서 동일한 `threads` + `isolate: false` 기본값을 상속합니다.
  - 공유 `scripts/run-vitest.mjs` 실행기는 이제 큰 로컬 실행 중 V8 컴파일 churn을 줄이기 위해 기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`도 추가합니다. 기본 V8 동작과 비교해야 한다면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
- 빠른 로컬 반복 참고:
  - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
  - pre-commit hook은 staged formatting/linting 후 `pnpm check:changed --staged`를 실행하므로 core 전용 커밋은 공개 extension 대상 계약을 건드리지 않는 한 extension 테스트 비용을 치르지 않습니다. 릴리스 메타데이터 전용 커밋은 대상 버전/config/root-dependency 레인에 남습니다.
  - 정확한 staged 변경 세트가 이미 동등하거나 더 강한 게이트로 검증되었다면 `scripts/committer --fast "<message>" <files...>`를 사용해 변경 범위 hook 재실행만 건너뛰세요. staged format/lint는 여전히 실행됩니다. 핸드오프에 완료한 게이트를 언급하세요. 이는 격리된 flaky hook 실패를 scoped proof로 재실행해 통과한 뒤에도 허용됩니다.
  - `pnpm test:changed`는 변경된 경로가 더 작은 스위트에 깔끔하게 매핑될 때 범위 지정된 레인을 통해 라우팅합니다.
  - `pnpm test:max`와 `pnpm test:changed:max`는 더 높은 워커 상한만 제외하면 동일한 라우팅 동작을 유지합니다.
  - 로컬 워커 자동 스케일링은 이제 의도적으로 보수적이며 호스트 load average가 이미 높을 때도 물러나므로, 여러 동시 Vitest 실행이 기본적으로 덜 큰 피해를 줍니다.
  - 기본 Vitest 구성은 프로젝트/구성 파일을 `forceRerunTriggers`로 표시하므로 테스트 wiring이 바뀔 때 변경 모드 재실행의 정확성을 유지합니다.
  - 이 구성은 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 계속 활성화합니다. 직접 프로파일링을 위한 명시적 캐시 위치 하나를 원하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.
- 성능 디버그 참고:
  - `pnpm test:perf:imports`는 Vitest import-duration 보고와 import-breakdown 출력을 활성화합니다.
  - `pnpm test:perf:imports:changed`는 동일한 프로파일링 보기를 `origin/main` 이후 변경된 파일로 범위 지정합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋 diff에 대해 라우팅된 `test:changed`를 네이티브 루트 프로젝트 경로와 비교하고 wall time과 macOS max RSS를 출력합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을 `scripts/test-projects.mjs`와 루트 Vitest 구성에 라우팅해 현재 dirty tree를 벤치마크합니다.
  - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
  - `pnpm test:perf:profile:runner`는 파일 병렬화를 비활성화한 상태에서 unit 스위트의 러너 CPU+힙 프로파일을 기록합니다.

### 안정성(Gateway)

- 명령: `pnpm test:stability:gateway`
- 구성: `vitest.gateway.config.ts`, 강제로 워커 1개 사용
- 범위:
  - 기본적으로 진단 기능이 활성화된 실제 loopback Gateway 시작
  - 진단 이벤트 경로를 통해 합성 Gateway 메시지, 메모리, 대형 payload churn 구동
  - Gateway WS RPC를 통해 `diagnostics.stability` 조회
  - 진단 안정성 번들 영속성 helper 커버
  - recorder가 bounded 상태를 유지하고, 합성 RSS 샘플이 압력 예산 아래에 머무르며, 세션별 queue depth가 다시 0으로 배출되는지 단언
- 기대 사항:
  - CI 안전, 키 필요 없음
  - 안정성 회귀 후속 조치를 위한 좁은 레인이지 전체 Gateway 스위트의 대체품은 아님

### E2E(Gateway 스모크)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래 번들 plugin E2E 테스트
- 런타임 기본값:
  - 저장소의 나머지와 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 워커를 사용합니다(CI: 최대 2, 로컬: 기본값 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행됩니다.
- 유용한 재정의:
  - 워커 수를 강제로 지정하려면 `OPENCLAW_E2E_WORKERS=<n>`(최대 16)
  - 자세한 콘솔 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`
- 범위:
  - 다중 인스턴스 Gateway 엔드투엔드 동작
  - WebSocket/HTTP 표면, Node 페어링, 더 무거운 네트워킹
- 기대 사항:
  - 파이프라인에서 활성화되면 CI에서 실행됨
  - 실제 키 필요 없음
  - unit 테스트보다 더 많은 가동 부품이 있음(더 느릴 수 있음)

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell Gateway를 시작
  - 임시 로컬 Dockerfile에서 샌드박스 생성
  - 실제 `sandbox ssh-config` + SSH exec을 통해 OpenClaw의 OpenShell 백엔드 실행
  - 샌드박스 fs bridge를 통해 원격 canonical 파일시스템 동작 검증
- 기대 사항:
  - 옵트인 전용이며 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 동작하는 Docker 데몬 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 테스트 Gateway와 샌드박스를 제거
- 유용한 재정의:
  - 더 넓은 e2e 스위트를 수동 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI 바이너리 또는 래퍼 스크립트를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### live(실제 provider + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래 번들 plugin live 테스트
- 기본값: `pnpm test:live`로 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 provider/모델이 _오늘_ 실제 자격 증명으로 실제로 동작하는가?”
  - provider 포맷 변경, 도구 호출 특이점, 인증 문제, 속도 제한 동작 포착
- 기대 사항:
  - 설계상 CI에서 안정적이지 않음(실제 네트워크, 실제 provider 정책, 쿼터, 장애)
  - 비용이 들거나 속도 제한을 사용함
  - “모든 것”보다 좁힌 하위 집합 실행을 선호
- live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 source합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 구성/인증 자료를 임시 테스트 홈에 복사하므로 unit 픽스처가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 실제 홈 디렉터리를 사용해야 하는 경우에만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본으로 사용합니다. `[live] ...` 진행 출력은 유지하지만 추가 `~/.profile` 안내를 숨기고 Gateway bootstrap 로그/Bonjour chatter를 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 교체(provider별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`를 설정하세요(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`). 또는 live 전용 재정의로 `OPENCLAW_LIVE_*_KEY`를 사용하세요. 테스트는 속도 제한 응답에서 재시도합니다.
- 진행/Heartbeat 출력:
  - live 스위트는 이제 진행 줄을 stderr로 출력하므로 Vitest 콘솔 캡처가 조용해도 긴 provider 호출이 진행 중임을 볼 수 있습니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 provider/Gateway 진행 줄이 live 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - Gateway/프로브 Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

다음 결정 표를 사용하세요.

- 로직/테스트 편집: `pnpm test` 실행(많이 바꿨다면 `pnpm test:coverage`도)
- Gateway 네트워킹 / WS 프로토콜 / 페어링 수정: `pnpm test:e2e` 추가
- “내 봇이 다운됨” / provider별 실패 / 도구 호출 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## live: Android Node 기능 스윕

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android Node가 현재 광고하는 **모든 명령을 호출**하고 명령 계약 동작을 단언
- 범위:
  - 사전 조건/수동 설정 기반(스위트는 앱을 설치/실행/페어링하지 않음)
  - 선택된 Android Node에 대한 명령별 Gateway `node.invoke` 검증
- 필요한 사전 설정:
  - Android 앱이 이미 Gateway에 연결되고 페어링되어 있어야 함
  - 앱이 전면에 유지되어야 함
  - 통과를 기대하는 기능에 대해 권한/캡처 동의가 부여되어 있어야 함
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- 전체 Android 설정 세부 정보: [Android App](/ko/platforms/android)

## live: 모델 스모크(profile 키)

live 테스트는 실패를 격리할 수 있도록 두 계층으로 나뉩니다.

- “직접 모델”은 주어진 키로 provider/모델이 실제로 응답할 수 있는지를 알려줍니다.
- “Gateway 스모크”는 해당 모델에 대해 전체 Gateway+에이전트 파이프라인이 동작하는지를 알려줍니다(세션, 히스토리, 도구, 샌드박스 정책 등).

### 계층 1: 직접 모델 완료(Gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 검색된 모델 나열
  - `getApiKeyForModel`을 사용해 자격 증명이 있는 모델 선택
  - 모델별 작은 완료 실행(필요한 경우 대상 회귀 포함)
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출할 경우 `OPENCLAW_LIVE_TEST=1`)
- 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 `all`, modern의 별칭)을 설정하세요. 그렇지 않으면 `pnpm test:live`를 Gateway 스모크에 집중시키기 위해 건너뜁니다.
- 모델 선택 방법:
  - modern allowlist를 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`은 modern allowlist의 별칭
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`(쉼표 allowlist)
  - modern/all 스윕은 기본적으로 선별된 고신호 상한을 사용합니다. exhaustive modern 스윕에는 `OPENCLAW_LIVE_MAX_MODELS=0`, 더 작은 상한에는 양수를 설정하세요.
- provider 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(쉼표 allowlist)
- 키 출처:
  - 기본값: profile 저장소와 env 폴백
  - **profile 저장소만** 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- 존재 이유:
  - “provider API가 깨짐 / 키가 잘못됨”과 “Gateway 에이전트 파이프라인이 깨짐”을 분리
  - 작고 격리된 회귀를 담기 위함(예: OpenAI Responses/Codex Responses reasoning replay + tool-call 흐름)

### 계층 2: Gateway + dev 에이전트 스모크(`@openclaw`가 실제로 하는 일)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 인프로세스 Gateway 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 재정의)
  - 키가 있는 모델을 반복하며 다음을 단언:
    - “의미 있는” 응답(도구 없음)
    - 실제 도구 호출이 동작함(read probe)
    - 선택적 추가 도구 프로브(exec+read probe)
    - OpenAI 회귀 경로(tool-call-only → follow-up)가 계속 동작함
- 프로브 세부 정보(실패를 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 워크스페이스에 nonce 파일을 쓰고 에이전트에게 이를 `read`하고 nonce를 다시 에코하라고 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 temp 파일에 nonce를 `exec`로 기록한 뒤 다시 `read`하라고 요청합니다.
  - 이미지 프로브: 테스트가 생성된 PNG(고양이 + 랜덤 코드)를 첨부하고 모델이 `cat <CODE>`를 반환하기를 기대합니다.
  - 구현 참고: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출할 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: modern allowlist(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 modern allowlist의 별칭
  - 또는 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록)로 좁히기
  - modern/all Gateway 스윕은 기본적으로 선별된 고신호 상한을 사용합니다. exhaustive modern 스윕에는 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, 더 작은 상한에는 양수를 설정하세요.
- provider 선택 방법(“OpenRouter 전체” 피하기):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(쉼표 allowlist)
- 도구 + 이미지 프로브는 이 live 테스트에서 항상 켜져 있습니다:
  - `read` 프로브 + `exec+read` 프로브(도구 스트레스)
  - 이미지 프로브는 모델이 이미지 입력 지원을 광고할 때 실행
  - 흐름(상위 수준):
    - 테스트는 “CAT” + 랜덤 코드가 있는 작은 PNG를 생성합니다(`src/gateway/live-image-probe.ts`)
    - 이를 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`로 전송합니다
    - Gateway는 첨부파일을 `images[]`로 파싱합니다(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - 내장 에이전트는 멀티모달 사용자 메시지를 모델로 전달합니다
    - 단언: 답변에 `cat` + 코드가 포함되어야 합니다(OCR 허용 범위: 사소한 실수 허용)

팁: 머신에서 무엇을 테스트할 수 있는지(정확한 `provider/model` ID 포함) 보려면 다음을 실행하세요.

```bash
openclaw models list
openclaw models list --json
```

## live: CLI 백엔드 스모크(Claude, Codex, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 구성을 건드리지 않고 로컬 CLI 백엔드를 사용해 Gateway + 에이전트 파이프라인을 검증
- 백엔드별 스모크 기본값은 소유 extension의 `cli-backend.ts` 정의에 있습니다.
- 활성화:
  - `pnpm test:live`(또는 Vitest를 직접 호출할 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 provider/모델: `claude-cli/claude-sonnet-4-6`
  - 명령/인수/이미지 동작은 소유 CLI 백엔드 plugin 메타데이터에서 가져옵니다.
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 이미지 첨부를 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`(경로는 프롬프트에 주입됨)
  - 프롬프트 주입 대신 이미지 파일 경로를 CLI 인수로 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG`가 설정되었을 때 이미지 인수 전달 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)
  - 두 번째 턴을 보내고 resume 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - 기본 Claude Sonnet -> Opus 동일 세션 연속성 프로브를 비활성화하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`(선택된 모델이 switch 대상을 지원할 때 강제로 켜려면 `1`)
  
예시:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-cli-backend
```

단일 provider Docker 레시피:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

참고:

- Docker 러너는 `scripts/test-live-cli-backend-docker.sh`에 있습니다.
- 저장소 Docker 이미지 내부에서 비루트 `node` 사용자로 live CLI 백엔드 스모크를 실행합니다.
- 소유 extension에서 CLI 스모크 메타데이터를 확인한 뒤, 일치하는 Linux CLI 패키지(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)를 캐시 가능한 쓰기 가능 prefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`(기본값: `~/.cache/openclaw/docker-cli-tools`)에 설치합니다.
- `pnpm test:docker:live-cli-backend:claude-subscription`에는 `~/.claude/.credentials.json`의 `claudeAiOauth.subscriptionType` 또는 `claude setup-token`의 `CLAUDE_CODE_OAUTH_TOKEN`을 통한 이동 가능한 Claude Code 구독 OAuth가 필요합니다. 먼저 Docker에서 직접 `claude -p`를 입증한 뒤, Anthropic API 키 env vars를 유지하지 않은 상태로 두 번의 Gateway CLI 백엔드 턴을 실행합니다. 이 구독 레인은 Claude가 현재 제3자 앱 사용을 일반 구독 플랜 제한 대신 추가 사용량 과금으로 라우팅하기 때문에 기본적으로 Claude MCP/tool 및 이미지 프로브를 비활성화합니다.
- live CLI 백엔드 스모크는 이제 Claude, Codex, Gemini에 대해 동일한 엔드투엔드 흐름을 실행합니다: 텍스트 턴, 이미지 분류 턴, 그리고 Gateway CLI를 통해 검증되는 MCP `cron` 도구 호출.
- Claude의 기본 스모크는 세션을 Sonnet에서 Opus로 패치하고, 재개된 세션이 여전히 이전 메모를 기억하는지도 검증합니다.

## live: ACP bind 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: live ACP 에이전트와 실제 ACP 대화 바인드 흐름 검증:
  - `/acp spawn <agent> --bind here` 전송
  - 합성 message-channel 대화를 제자리에서 바인드
  - 같은 대화에서 일반 후속 메시지 전송
  - 후속 메시지가 바인드된 ACP 세션 transcript에 기록되는지 검증
- 활성화:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 기본값:
  - Docker의 ACP 에이전트: `claude,codex,gemini`
  - 직접 `pnpm test:live ...`용 ACP 에이전트: `claude`
  - 합성 채널: Slack DM 스타일 대화 컨텍스트
  - ACP 백엔드: `acpx`
- 재정의:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- 참고:
  - 이 레인은 관리자 전용 합성 originating-route 필드가 있는 Gateway `chat.send` 표면을 사용하므로, 테스트가 외부로 실제 전달하는 척하지 않고 message-channel 컨텍스트를 붙일 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않으면, 테스트는 선택된 ACP 하네스 에이전트에 대해 내장 `acpx` plugin의 내장 에이전트 레지스트리를 사용합니다.

예시:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 레시피:

```bash
pnpm test:docker:live-acp-bind
```

단일 에이전트 Docker 레시피:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 참고:

- Docker 러너는 `scripts/test-live-acp-bind-docker.sh`에 있습니다.
- 기본적으로 지원되는 모든 live CLI 에이전트 `claude`, `codex`, `gemini`를 순서대로 대상으로 ACP bind 스모크를 실행합니다.
- 매트릭스를 좁히려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`를 사용하세요.
- `~/.profile`을 source하고, 일치하는 CLI 인증 자료를 컨테이너에 staging한 뒤, 쓰기 가능한 npm prefix에 `acpx`를 설치하고, 요청된 live CLI(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)가 없으면 설치합니다.
- Docker 내부에서 러너는 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`를 설정하므로, sourced profile의 provider env vars를 자식 하네스 CLI가 계속 사용할 수 있습니다.

## live: Codex app-server 하네스 스모크

- 목표: 일반 Gateway `agent` 메서드를 통해 plugin 소유 Codex 하네스를 검증:
  - 번들 `codex` plugin 로드
  - `OPENCLAW_AGENT_RUNTIME=codex` 선택
  - `codex/gpt-5.4`에 첫 Gateway 에이전트 턴 전송
  - 동일한 OpenClaw 세션에 두 번째 턴을 보내 app-server 스레드가 재개될 수 있는지 검증
  - 동일한 Gateway 명령 경로를 통해 `/codex status`와 `/codex models` 실행
  - 선택적으로 Guardian 검토가 있는 두 개의 권한 상승 셸 프로브 실행:
    승인되어야 하는 무해한 명령 하나와, 거부되어 에이전트가 다시 물어봐야 하는 가짜 시크릿 업로드 하나
- 테스트: `src/gateway/gateway-codex-harness.live.test.ts`
- 활성화: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 기본 모델: `codex/gpt-5.4`
- 선택적 이미지 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 선택적 MCP/tool 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 선택적 Guardian 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 이 스모크는 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 설정하므로, 깨진 Codex 하네스가 PI로 조용히 폴백되어 통과할 수 없습니다.
- 인증: 셸/profile의 `OPENAI_API_KEY`, 그리고 선택적으로 복사된 `~/.codex/auth.json` 및 `~/.codex/config.toml`

로컬 레시피:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 레시피:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 참고:

- Docker 러너는 `scripts/test-live-codex-harness-docker.sh`에 있습니다.
- 마운트된 `~/.profile`을 source하고, `OPENAI_API_KEY`를 전달하며, Codex CLI 인증 파일이 있으면 복사하고, 쓰기 가능한 마운트된 npm prefix에 `@openai/codex`를 설치한 뒤, 소스 트리를 staging하고, Codex 하네스 live 테스트만 실행합니다.
- Docker는 기본적으로 이미지, MCP/tool, Guardian 프로브를 활성화합니다. 더 좁은 디버그 실행이 필요하면 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 또는 `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 또는 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`을 설정하세요.
- Docker는 또한 live 테스트 구성과 일치하게 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 export하므로 `openai-codex/*` 또는 PI 폴백이 Codex 하네스 회귀를 숨길 수 없습니다.

### 권장 live 레시피

좁고 명시적인 allowlist가 가장 빠르고 가장 덜 불안정합니다.

- 단일 모델, 직접 실행(Gateway 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, Gateway 스모크:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 provider에 걸친 도구 호출:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 집중(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth bridge(Cloud Code Assist 스타일 에이전트 엔드포인트)를 사용합니다.
- `google-gemini-cli/...`는 사용자의 머신에 있는 로컬 Gemini CLI를 사용합니다(별도의 인증 + 도구 동작 특이점).
- Gemini API vs Gemini CLI:
  - API: OpenClaw가 HTTP를 통해 Google의 호스팅 Gemini API를 호출합니다(API 키 / profile 인증). 대부분 사용자가 “Gemini”라고 말할 때 의미하는 것이 이것입니다.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리를 셸 실행합니다. 자체 인증이 있으며 동작이 다를 수 있습니다(스트리밍/도구 지원/버전 차이).

## live: 모델 매트릭스(무엇을 커버하는지)

고정된 “CI 모델 목록”은 없습니다(live는 옵트인). 하지만 실제 키가 있는 개발자 머신에서 정기적으로 커버하기를 권장하는 모델은 다음과 같습니다.

### 현대적 스모크 세트(도구 호출 + 이미지)

이것은 계속 동작해야 한다고 기대하는 “일반 모델” 실행입니다.

- OpenAI(non-Codex): `openai/gpt-5.4`(선택 사항: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google(Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview`(이전 Gemini 2.x 모델은 피하세요)
- Google(Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

도구 + 이미지와 함께 Gateway 스모크 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기준선: 도구 호출(Read + 선택적 Exec)

provider 계열별로 최소 하나는 선택하세요.

- OpenAI: `openai/gpt-5.4`(또는 `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview`(또는 `google/gemini-3.1-pro-preview`)
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

선택적 추가 커버리지(있으면 좋음):

- xAI: `xai/grok-4`(또는 최신 사용 가능 버전)
- Mistral: `mistral/...`(활성화된 “tools” 가능 모델 하나 선택)
- Cerebras: `cerebras/...`(접근 권한이 있는 경우)
- LM Studio: `lmstudio/...`(로컬, 도구 호출은 API 모드에 따라 다름)

### 비전: 이미지 전송(첨부파일 → 멀티모달 메시지)

이미지 프로브를 실행하려면 `OPENCLAW_LIVE_GATEWAY_MODELS`에 최소 하나의 이미지 지원 모델(Claude/Gemini/OpenAI의 vision 지원 변형 등)을 포함하세요.

### 집계기 / 대체 Gateway

키가 활성화되어 있다면 다음 경로를 통한 테스트도 지원합니다.

- OpenRouter: `openrouter/...`(수백 개 모델, 도구+이미지 가능한 후보는 `openclaw models scan` 사용)
- OpenCode: Zen에는 `opencode/...`, Go에는 `opencode-go/...`(`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`로 인증)

자격 증명/구성이 있다면 live 매트릭스에 포함할 수 있는 provider 추가 목록:

- 내장: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(사용자 지정 엔드포인트): `minimax`(클라우드/API), 그리고 모든 OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

팁: 문서에 “모든 모델”을 하드코딩하려고 하지 마세요. 권위 있는 목록은 사용자의 머신에서 `discoverModels(...)`가 반환하는 것 + 사용 가능한 키의 조합입니다.

## 자격 증명(절대 커밋 금지)

live 테스트는 CLI와 같은 방식으로 자격 증명을 찾습니다. 실질적 의미는 다음과 같습니다.

- CLI가 동작하면 live 테스트도 같은 키를 찾아야 합니다.
- live 테스트가 “자격 증명 없음”이라고 하면 `openclaw models list` / 모델 선택을 디버깅하듯이 디버그하세요.

- 에이전트별 인증 profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(live 테스트에서 “profile 키”가 의미하는 것)
- 구성: `~/.openclaw/openclaw.json`(또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 상태 디렉터리: `~/.openclaw/credentials/`(존재할 경우 staging된 live 홈에 복사되지만, 메인 profile-key 저장소는 아님)
- 로컬 live 실행은 기본적으로 활성 구성, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 지원되는 외부 CLI 인증 디렉터리를 임시 테스트 홈에 복사합니다. staging된 live 홈은 `workspace/`와 `sandboxes/`를 건너뛰며, probe가 실제 호스트 워크스페이스에 닿지 않도록 `agents.*.workspace` / `agentDir` 경로 재정의를 제거합니다.

env 키(예: `~/.profile`에 export된 키)에 의존하려면 로컬 테스트 전에 `source ~/.profile`을 실행하거나 아래의 Docker 러너를 사용하세요(컨테이너에 `~/.profile`을 마운트할 수 있음).

## Deepgram live(오디오 전사)

- 테스트: `extensions/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 테스트: `extensions/byteplus/live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 워크플로 미디어 live

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들 comfy 이미지, 비디오, `music_generate` 경로 실행
  - `models.providers.comfy.<capability>`가 구성되지 않으면 각 기능을 건너뜀
  - comfy 워크플로 제출, 폴링, 다운로드, plugin 등록을 변경한 뒤 유용함

## 이미지 생성 live

- 테스트: `test/image-generation.runtime.live.test.ts`
- 명령: `pnpm test:live test/image-generation.runtime.live.test.ts`
- 하네스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 이미지 생성 provider plugin 나열
  - 프로브 전에 로그인 셸(`~/.profile`)에서 누락된 provider env vars 로드
  - 기본적으로 저장된 인증 profile보다 live/env API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/profile/모델이 없는 provider는 건너뜀
  - 공유 런타임 기능을 통해 기본 이미지 생성 변형 실행:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 현재 커버되는 번들 provider:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 선택적 인증 동작:
  - profile 저장소 인증을 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 음악 생성 live

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 음악 생성 provider 경로 실행
  - 현재 Google과 MiniMax를 다룸
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider env vars 로드
  - 기본적으로 저장된 인증 profile보다 live/env API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/profile/모델이 없는 provider는 건너뜀
  - 가능할 때 선언된 런타임 모드를 둘 다 실행:
    - 프롬프트 전용 입력의 `generate`
    - provider가 `capabilities.edit.enabled`를 선언한 경우 `edit`
  - 현재 공유 레인 커버리지:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 이 공유 스윕이 아닌 별도 Comfy live 파일
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 선택적 인증 동작:
  - profile 저장소 인증을 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 비디오 생성 live

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하네스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 비디오 생성 provider 경로 실행
  - 기본적으로 릴리스 안전 스모크 경로를 사용: FAL이 아닌 provider, provider별 텍스트-비디오 요청 1회, 1초 랍스터 프롬프트, `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`의 provider별 작업 상한(기본값 `180000`)
  - provider 측 큐 지연이 릴리스 시간을 지배할 수 있으므로 기본적으로 FAL을 건너뜁니다. 명시적으로 실행하려면 `--video-providers fal` 또는 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`을 전달하세요.
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider env vars 로드
  - 기본적으로 저장된 인증 profile보다 live/env API 키를 우선 사용하므로 `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/profile/모델이 없는 provider는 건너뜀
  - 기본적으로 `generate`만 실행
  - 가능할 때 선언된 transform 모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 설정:
    - provider가 `capabilities.imageToVideo.enabled`를 선언하고 선택된 provider/모델이 공유 스윕에서 버퍼 기반 로컬 이미지 입력을 허용할 때 `imageToVideo`
    - provider가 `capabilities.videoToVideo.enabled`를 선언하고 선택된 provider/모델이 공유 스윕에서 버퍼 기반 로컬 비디오 입력을 허용할 때 `videoToVideo`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `imageToVideo` provider:
    - 번들 `veo3`는 텍스트 전용이고 번들 `kling`은 원격 이미지 URL이 필요하므로 `vydra`
  - provider별 Vydra 커버리지:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 이 파일은 기본적으로 원격 이미지 URL 픽스처를 사용하는 `kling` 레인과 함께 `veo3` 텍스트-비디오를 실행합니다
  - 현재 `videoToVideo` live 커버리지:
    - 선택된 모델이 `runway/gen4_aleph`일 때만 `runway`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `videoToVideo` provider:
    - 현재 그 경로들이 원격 `http(s)` / MP4 참조 URL을 필요로 하므로 `alibaba`, `qwen`, `xai`
    - 현재 공유 Gemini/Veo 레인이 로컬 버퍼 기반 입력을 사용하고 그 경로가 공유 스윕에서 허용되지 않으므로 `google`
    - 현재 공유 레인에 org별 비디오 inpaint/remix 접근 보장이 없으므로 `openai`
- 선택적 범위 좁히기:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - 기본 스윕에 FAL을 포함한 모든 provider를 포함하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 공격적인 스모크 실행을 위해 provider별 작업 상한을 줄이려면 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 선택적 인증 동작:
  - profile 저장소 인증을 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 미디어 live 하네스

- 명령: `pnpm test:live:media`
- 목적:
  - 공유 이미지, 음악, 비디오 live 스위트를 하나의 저장소 네이티브 entrypoint로 실행
  - `~/.profile`에서 누락된 provider env vars 자동 로드
  - 기본적으로 현재 사용 가능한 인증이 있는 provider로 각 스위트를 자동 축소
  - `scripts/test-live.mjs`를 재사용하므로 Heartbeat 및 quiet-mode 동작이 일관됨
- 예시:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 러너(선택적 “Linux에서 동작함” 검사)

이 Docker 러너는 두 버킷으로 나뉩니다.

- live 모델 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 일치하는 profile-key live 파일만 저장소 Docker 이미지 내부에서 실행합니다(`src/agents/models.profiles.live.test.ts`와 `src/gateway/gateway-models.profiles.live.test.ts`). 로컬 config 디렉터리와 워크스페이스를 마운트하고(마운트되면 `~/.profile`도 source) 실행합니다. 일치하는 로컬 entrypoint는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 러너는 전체 Docker 스윕을 실용적으로 유지하기 위해 더 작은 스모크 상한을 기본으로 사용합니다:
  `test:docker:live-models`는 기본적으로 `OPENCLAW_LIVE_MAX_MODELS=12`를 사용하고,
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`를 사용합니다. 명시적으로 더 큰 exhaustive 스캔을 원할 때는 이 env vars를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 뒤 두 live Docker 레인에 재사용합니다. 또한 `test:docker:e2e-build`를 통해 공유 `scripts/e2e/Dockerfile` 이미지 하나를 빌드하고, 빌드된 앱을 실행하는 E2E 컨테이너 스모크 러너에 재사용합니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 integration 경로를 검증합니다.

live 모델 Docker 러너는 필요한 CLI 인증 홈만 bind-mount하거나(실행 범위를 좁히지 않은 경우 지원되는 모든 인증 홈),
실행 전에 이를 컨테이너 홈으로 복사하므로 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 새로고침할 수 있습니다.

- 직접 모델: `pnpm test:docker:live-models`(스크립트: `scripts/test-live-models-docker.sh`)
- ACP bind 스모크: `pnpm test:docker:live-acp-bind`(스크립트: `scripts/test-live-acp-bind-docker.sh`)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend`(스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server 하네스 스모크: `pnpm test:docker:live-codex-harness`(스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev 에이전트: `pnpm test:docker:live-gateway`(스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live 스모크: `pnpm test:docker:openwebui`(스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard`(스크립트: `scripts/e2e/onboard-docker.sh`)
- npm tarball 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩과 기본 Telegram으로 OpenAI를 구성하며, plugin 활성화가 런타임 의존성을 주문형으로 설치하는지 검증하고, doctor를 실행한 뒤, mock OpenAI 에이전트 턴 하나를 실행합니다. 미리 빌드한 tarball을 재사용하려면 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, 호스트 재빌드를 건너뛰려면 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, 채널을 바꾸려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태 확인): `pnpm test:docker:gateway-network`(스크립트: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` 최소 reasoning 회귀: `pnpm test:docker:openai-web-search-minimal`(스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 mock OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음, provider schema 거부를 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(seeded Gateway + stdio bridge + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels`(스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 내장 Pi profile allow/deny 스모크): `pnpm test:docker:pi-bundle-mcp-tools`(스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP 정리(실제 Gateway + stdio MCP 자식 teardown, 격리된 Cron 및 원샷 하위 에이전트 실행 후): `pnpm test:docker:cron-mcp-cleanup`(스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 동작): `pnpm test:docker:plugins`(스크립트: `scripts/e2e/plugins-docker.sh`)
- Plugin update 변경 없음 스모크: `pnpm test:docker:plugin-update`(스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload 메타데이터 스모크: `pnpm test:docker:config-reload`(스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- 번들 plugin 런타임 의존성: `pnpm test:docker:bundled-channel-deps`는 기본적으로 작은 Docker 러너 이미지를 빌드하고, 호스트에서 OpenClaw를 한 번 빌드/패키징한 뒤, 각 Linux 설치 시나리오에 그 tarball을 마운트합니다. 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`, 새 로컬 빌드 후 호스트 재빌드를 건너뛰려면 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, 기존 tarball을 가리키려면 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하세요.
- 반복 작업 중에는 관련 없는 시나리오를 비활성화해 번들 plugin 런타임 의존성 범위를 좁히세요. 예:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

공유 built-app 이미지를 수동으로 사전 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 스위트별 이미지 재정의는 설정되어 있으면 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리킬 때, 스크립트는 해당 이미지가 로컬에 없으면 pull합니다. QR 및 설치 프로그램 Docker 테스트는 공유 built-app 런타임이 아니라 패키지/설치 동작을 검증하기 때문에 자체 Dockerfile을 유지합니다.

live 모델 Docker 러너는 현재 체크아웃도 읽기 전용으로 bind-mount하고,
컨테이너 내부의 임시 workdir로 staging합니다. 이렇게 하면 런타임
이미지를 슬림하게 유지하면서도 정확히 사용자의 로컬 소스/구성에 대해 Vitest를 실행할 수 있습니다.
staging 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 그리고 앱 로컬 `.build` 또는
Gradle 출력 디렉터리 같은 대형 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로,
Docker live 실행이 머신별 아티팩트를 복사하느라 몇 분씩 쓰지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 Gateway live 프로브가
컨테이너 내부에서 실제 Telegram/Discord 등의 채널 워커를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로,
해당 Docker 레인에서 Gateway live 커버리지를 좁히거나 제외해야 할 때는
`OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. OpenAI 호환 HTTP 엔드포인트가 활성화된
OpenClaw Gateway 컨테이너를 시작하고, 해당 Gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작하며,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 검증한 뒤,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
첫 실행은 Docker가 Open WebUI 이미지를 pull해야 하거나 Open WebUI가
자체 콜드 스타트 설정을 끝내야 할 수 있으므로 눈에 띄게 느릴 수 있습니다.
이 레인은 사용 가능한 live 모델 키를 기대하며, Dockerized 실행에서 이를 제공하는 주요 방법은
`OPENCLAW_PROFILE_FILE`(기본값 `~/.profile`)입니다.
성공적인 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord, iMessage 계정이 필요하지 않습니다.
seeded Gateway 컨테이너를 부팅하고,
`openclaw mcp serve`를 spawn하는 두 번째 컨테이너를 시작한 뒤,
실제 stdio MCP bridge를 통해 라우팅된 대화 검색, transcript 읽기, 첨부파일 메타데이터,
live 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 +
권한 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을 직접 검사하므로
특정 client SDK가 우연히 노출하는 내용이 아니라 bridge가 실제로 방출하는 것을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 live
모델 키가 필요하지 않습니다. 저장소 Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP 프로브 서버를 시작하며,
해당 서버를 내장 Pi 번들 MCP 런타임을 통해 materialize하고, 도구를 실행한 다음,
`coding`과 `messaging`은 `bundle-mcp` 도구를 유지하는 반면 `minimal`과 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 검증합니다.
`test:docker:cron-mcp-cleanup`도 결정적이며 live 모델
키가 필요하지 않습니다. 실제 stdio MCP 프로브 서버가 있는 seeded Gateway를 시작하고,
격리된 Cron 턴과 `/subagents spawn` 원샷 자식 턴을 실행한 뒤,
각 실행 후 MCP 자식 프로세스가 종료되는지 검증합니다.

수동 ACP 평문 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로용으로 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env vars:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`) → `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`) → `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`) → `/home/node/.profile`에 마운트되며 테스트 실행 전에 source됨
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 `OPENCLAW_PROFILE_FILE`에서 source된 env vars만 검증하며, 임시 config/workspace 디렉터리를 사용하고 외부 CLI 인증 마운트는 사용하지 않음
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`) → Docker 내부 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트
- `$HOME` 아래 외부 CLI 인증 디렉터리/파일은 `/host-auth...` 아래 읽기 전용으로 마운트된 뒤, 테스트 시작 전에 `/home/node/...`로 복사됨
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 디렉터리/파일만 마운트
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록으로 수동 재정의 가능
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부 provider를 필터링하려면 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 자격 증명이 profile 저장소에서 오도록 보장하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`(env 아님)
- Open WebUI 스모크를 위해 Gateway가 노출하는 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크가 사용하는 nonce-check 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`

## 문서 sanity

문서 편집 후 문서 검사를 실행하세요: `pnpm check:docs`.
페이지 내 heading 검사까지 필요할 때는 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

이것들은 실제 provider 없이도 “실제 파이프라인” 회귀를 검증합니다.

- Gateway 도구 호출(mock OpenAI, 실제 Gateway + 에이전트 루프): `src/gateway/gateway.test.ts`(케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, config + auth 강제 기록): `src/gateway/gateway.test.ts`(케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

이미 CI 안전한 테스트 몇 개가 있으며, 이들은 “에이전트 신뢰성 평가”처럼 동작합니다.

- 실제 Gateway + 에이전트 루프를 통한 mock 도구 호출(`src/gateway/gateway.test.ts`)
- 세션 wiring과 config 효과를 검증하는 엔드투엔드 마법사 흐름(`src/gateway/gateway.test.ts`)

Skills 관련해서 여전히 부족한 점([Skills](/ko/tools/skills) 참고):

- **의사결정:** 프롬프트에 skill이 나열되어 있을 때 에이전트가 올바른 skill을 선택하는가(또는 관련 없는 skill은 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필요한 단계/인수를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 히스토리 유지, 샌드박스 경계를 단언하는 다중 턴 시나리오

향후 평가는 우선 결정적이어야 합니다.

- mock provider를 사용해 도구 호출 + 순서, skill 파일 읽기, 세션 wiring을 단언하는 시나리오 러너
- skill 중심 시나리오의 작은 스위트(사용 vs 회피, 게이팅, 프롬프트 인젝션)
- CI 안전 스위트가 자리 잡은 뒤에만 선택적인 live 평가(옵트인, env 게이트)

## 계약 테스트(plugin 및 channel 형태)

계약 테스트는 등록된 모든 plugin과 채널이 자신의
인터페이스 계약을 준수하는지 검증합니다. 검색된 모든 plugin을 순회하며 형태와 동작 단언 스위트를 실행합니다. 기본 `pnpm test` unit 레인은 의도적으로 이 공유 seam 및 스모크 파일을 건너뛰므로, 공유 채널 또는 provider 표면을 건드렸다면 계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- provider 계약만: `pnpm test:contracts:plugins`

### 채널 계약

위치: `src/channels/plugins/contracts/*.contract.test.ts`

- **plugin** - 기본 plugin 형태(id, name, capabilities)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 action 핸들러
- **threading** - 스레드 ID 처리
- **directory** - 디렉터리/로스터 API
- **group-policy** - 그룹 정책 강제

### provider 상태 계약

위치: `src/plugins/contracts/*.contract.test.ts`

- **status** - 채널 상태 프로브
- **registry** - plugin 레지스트리 형태

### provider 계약

위치: `src/plugins/contracts/*.contract.test.ts`

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - plugin 검색
- **loader** - plugin 로딩
- **runtime** - provider 런타임
- **shape** - plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 하위 경로를 변경한 뒤
- 채널 또는 provider plugin을 추가하거나 수정한 뒤
- plugin 등록 또는 검색을 리팩터링한 뒤

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가(가이드)

live에서 발견된 provider/모델 문제를 수정할 때:

- 가능하다면 CI 안전 회귀를 추가하세요(mock/stub provider 또는 정확한 요청 형태 변환을 포착)
- 본질적으로 live 전용인 경우(속도 제한, 인증 정책), live 테스트는 좁고 env vars로 옵트인되게 유지하세요
- 버그를 잡는 가장 작은 계층을 타기팅하는 것을 선호하세요:
  - provider 요청 변환/replay 버그 → 직접 모델 테스트
  - Gateway 세션/히스토리/도구 파이프라인 버그 → Gateway live 스모크 또는 CI 안전 Gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별 샘플 대상 하나를 도출한 뒤, 순회 세그먼트 exec ID가 거부되는지 단언합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 계열을 추가하면, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 테스트는 분류되지 않은 대상 ID에서 의도적으로 실패하므로 새 클래스가 조용히 건너뛰어질 수 없습니다.
