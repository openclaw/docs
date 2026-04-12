---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/provider 버그에 대한 회귀 테스트 추가하기
    - Gateway + 에이전트 동작 디버깅하기
summary: '테스트 키트: unit/e2e/live 스위트, Docker 러너, 그리고 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-04-12T23:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a66ea672c386094ab4a8035a082c8a85d508a14301ad44b628d2a10d9cec3a52
    source_path: help/testing.md
    workflow: 15
---

# 테스트

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker 러너가 있습니다.

이 문서는 “우리가 어떻게 테스트하는지”에 대한 가이드입니다.

- 각 스위트가 무엇을 다루는지(그리고 의도적으로 _다루지 않는_ 것은 무엇인지)
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에서 어떤 명령을 실행해야 하는지
- live 테스트가 자격 증명을 어떻게 찾고 모델/provider를 어떻게 선택하는지
- 실제 모델/provider 이슈에 대한 회귀 테스트를 추가하는 방법

## 빠른 시작

대부분의 날에는:

- 전체 게이트(푸시 전에 기대됨): `pnpm build && pnpm check && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프 실행: `pnpm test:watch`
- 직접 파일 타기팅은 이제 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 중이라면 먼저 타기팅된 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 건드렸거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 provider/모델을 디버깅할 때(실제 자격 증명 필요):

- live 스위트(모델 + gateway 도구/이미지 프로브): `pnpm test:live`
- 하나의 live 파일만 조용히 타기팅: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

팁: 하나의 실패 케이스만 필요하다면, 아래에 설명된 allowlist 환경 변수를 통해 live 테스트 범위를 좁히는 것이 좋습니다.

## QA 전용 러너

이 명령들은 QA-lab 수준의 현실성이 필요할 때 메인 테스트 스위트와 함께 사용합니다.

- `pnpm openclaw qa suite`
  - 호스트에서 repo 기반 QA 시나리오를 직접 실행합니다.
  - 기본적으로 격리된 gateway 워커와 함께 선택된 여러 시나리오를 병렬로 실행하며, 최대 64개 워커 또는 선택된 시나리오 수까지 사용합니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 이전의 직렬 레인을 원하면 `--concurrency 1`을 사용하세요.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 내부에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 provider/모델 선택 플래그를 재사용합니다.
  - live 실행은 게스트에서 실용적으로 전달 가능한 지원 QA 인증 입력을 전달합니다:
    환경 변수 기반 provider 키, QA live provider config 경로, 그리고 존재하는 경우 `CODEX_HOME`
  - 게스트가 마운트된 워크스페이스를 통해 다시 기록할 수 있도록 출력 디렉터리는 repo 루트 아래에 있어야 합니다.
  - 일반 QA 보고서 + 요약과 함께 Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm qa:lab:up`
  - 운영자 스타일의 QA 작업을 위해 Docker 기반 QA 사이트를 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix live QA 레인을 실행합니다.
  - 임시 Matrix 사용자 세 명(`driver`, `sut`, `observer`)과 비공개 room 하나를 프로비저닝한 뒤, 실제 Matrix Plugin을 SUT 전송 계층으로 사용하는 QA gateway 자식을 시작합니다.
  - 기본적으로 고정된 안정 Tuwunel 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`를 사용합니다. 다른 이미지를 테스트해야 하면 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`로 재정의하세요.
  - Matrix QA 보고서, 요약, observed-events 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다.
- `pnpm openclaw qa telegram`
  - 환경 변수의 driver 및 SUT bot 토큰을 사용해 실제 비공개 그룹에서 Telegram live QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. 그룹 ID는 숫자형 Telegram 채팅 ID여야 합니다.
  - 동일한 비공개 그룹 안에 있는 서로 다른 두 bot이 필요하며, SUT bot은 Telegram 사용자 이름을 노출해야 합니다.
  - 안정적인 bot 간 관찰을 위해 `@BotFather`에서 두 bot 모두에 대해 Bot-to-Bot Communication Mode를 활성화하고, driver bot이 그룹 bot 트래픽을 관찰할 수 있도록 하세요.
  - Telegram QA 보고서, 요약, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 기록합니다.

live 전송 레인은 새 전송이 일탈하지 않도록 하나의 표준 계약을 공유합니다.

`qa-channel`은 여전히 광범위한 합성 QA 스위트이며 live 전송 커버리지 매트릭스에는 포함되지 않습니다.

| 레인     | Canary | 멘션 게이팅 | 허용 목록 차단 | 최상위 답변 | 재시작 재개 | 스레드 후속 응답 | 스레드 격리 | 반응 관찰 | 도움말 명령 |
| -------- | ------ | ----------- | -------------- | ----------- | ----------- | ---------------- | ----------- | --------- | ----------- |
| Matrix   | x      | x           | x              | x           | x           | x                | x           | x         |             |
| Telegram | x      |             |                |             |             |                  |             |           | x           |

### QA에 채널 추가하기

마크다운 QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 채널용 전송 어댑터
2. 채널 계약을 검증하는 시나리오 팩

공유 `qa-lab` 러너가 흐름을 담당할 수 있을 때는 채널별 QA 러너를 추가하지 마세요.

`qa-lab`은 공유 메커니즘을 담당합니다.

- 스위트 시작 및 종료
- 워커 동시성
- 아티팩트 기록
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오용 호환성 별칭

채널 어댑터는 전송 계약을 담당합니다.

- 해당 전송용 gateway 구성 방식
- 준비 상태 확인 방식
- 인바운드 이벤트 주입 방식
- 아웃바운드 메시지 관찰 방식
- 전사본 및 정규화된 전송 상태 노출 방식
- 전송 기반 작업 실행 방식
- 전송별 재설정 또는 정리 처리 방식

새 채널에 대한 최소 도입 기준은 다음과 같습니다.

1. 공유 `qa-lab` 경계에서 전송 어댑터를 구현합니다.
2. 전송 레지스트리에 어댑터를 등록합니다.
3. 전송별 메커니즘은 어댑터 또는 채널 하니스 내부에 유지합니다.
4. `qa/scenarios/` 아래에 마크다운 시나리오를 작성하거나 조정합니다.
5. 새 시나리오에는 일반 시나리오 헬퍼를 사용합니다.
6. repo가 의도적인 마이그레이션을 수행 중이 아닌 한 기존 호환성 별칭은 계속 동작하게 유지합니다.

판단 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번으로 표현할 수 있으면 `qa-lab`에 넣습니다.
- 동작이 하나의 채널 전송에 의존하면 해당 어댑터 또는 plugin 하니스에 유지합니다.
- 시나리오에 둘 이상의 채널이 사용할 수 있는 새 capability가 필요하다면, `suite.ts`에 채널별 분기를 추가하는 대신 일반 헬퍼를 추가합니다.
- 동작이 하나의 전송에서만 의미가 있다면, 그 시나리오는 전송 전용으로 유지하고 시나리오 계약에서 이를 명시합니다.

새 시나리오에 권장되는 일반 헬퍼 이름은 다음과 같습니다.

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

기존 시나리오를 위한 호환성 별칭도 계속 사용할 수 있습니다.

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

새 채널 작업에는 일반 헬퍼 이름을 사용해야 합니다.
호환성 별칭은 일괄 전환 없는 마이그레이션을 피하기 위해 존재하는 것이지, 새 시나리오 작성의 모델이 아닙니다.

## 테스트 스위트(무엇이 어디서 실행되는가)

스위트는 “현실성이 점점 높아지는 것”(그리고 불안정성/비용도 함께 증가하는 것)으로 생각하면 됩니다.

### Unit / integration (기본값)

- 명령: `pnpm test`
- 구성: 기존 범위 지정 Vitest 프로젝트에 대해 순차적으로 실행되는 10개의 샤드 실행(`vitest.full-*.config.ts`)
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리와 `vitest.unit.config.ts`에서 다루는 허용 목록 `ui` node 테스트
- 범위:
  - 순수 unit 테스트
  - 프로세스 내 integration 테스트(gateway 인증, 라우팅, 도구화, 파싱, 구성)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됨
  - 실제 키 불필요
  - 빠르고 안정적이어야 함
- 프로젝트 참고:
  - 범위를 지정하지 않은 `pnpm test`는 이제 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 11개의 더 작은 샤드 구성(`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 있는 머신에서 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않도록 합니다.
  - `pnpm test --watch`는 다중 샤드 watch 루프가 실용적이지 않기 때문에 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
  - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 이제 명시적 파일/디렉터리 대상을 먼저 범위 지정 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
  - `pnpm test:changed`는 변경 diff가 라우팅 가능한 소스/테스트 파일만 건드리는 경우 변경된 git 경로를 동일한 범위 지정 레인으로 확장합니다. config/setup 편집은 여전히 넓은 루트 프로젝트 재실행으로 대체됩니다.
  - agents, commands, plugins, auto-reply 헬퍼, `plugin-sdk`, 그리고 유사한 순수 유틸리티 영역의 import 경량 unit 테스트는 `unit-fast` 레인을 통해 라우팅되며, 여기서는 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태를 가지거나 런타임이 무거운 파일은 기존 레인에 남습니다.
  - 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 changed 모드 실행을 이러한 경량 레인의 명시적 인접 테스트에 매핑하므로, 헬퍼 편집 시 해당 디렉터리의 전체 무거운 스위트를 재실행하지 않아도 됩니다.
  - `auto-reply`는 이제 세 가지 전용 버킷을 가집니다: 최상위 core 헬퍼, 최상위 `reply.*` integration 테스트, 그리고 `src/auto-reply/reply/**` 하위 트리입니다. 이렇게 하면 가장 무거운 reply 하니스 작업이 저렴한 status/chunk/token 테스트에 영향을 주지 않게 됩니다.
- Embedded 러너 참고:
  - 메시지 도구 탐색 입력 또는 compaction 런타임 컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
  - 순수 라우팅/정규화 경계를 위한 집중된 헬퍼 회귀 테스트를 추가하세요.
  - 또한 embedded 러너 integration 스위트도 정상 상태를 유지해야 합니다:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
  - 이 스위트들은 범위 지정 ID와 compaction 동작이 실제 `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. 헬퍼 전용 테스트만으로는 이러한 integration 경로를 충분히 대체할 수 없습니다.
- 풀 참고:
  - 기본 Vitest 구성은 이제 기본적으로 `threads`를 사용합니다.
  - 공유 Vitest 구성은 `isolate: false`도 고정하며, 루트 프로젝트, e2e, live 구성 전반에서 비격리 러너를 사용합니다.
  - 루트 UI 레인은 `jsdom` 설정과 optimizer를 유지하지만, 이제 공유 비격리 러너에서 역시 실행됩니다.
  - 각 `pnpm test` 샤드는 공유 Vitest 구성에서 동일한 `threads` + `isolate: false` 기본값을 상속합니다.
  - 공유 `scripts/run-vitest.mjs` 실행기는 이제 대규모 로컬 실행 중 V8 컴파일 churn을 줄이기 위해 기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`도 추가합니다. 기본 V8 동작과 비교해야 하면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
- 빠른 로컬 반복 참고:
  - `pnpm test:changed`는 변경된 경로가 더 작은 스위트에 깔끔하게 매핑될 때 범위 지정 레인을 통해 라우팅됩니다.
  - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅 동작을 유지하되 워커 상한만 더 높습니다.
  - 로컬 워커 자동 스케일링은 이제 의도적으로 더 보수적이며 호스트 load average가 이미 높은 경우에도 물러서므로, 여러 동시 Vitest 실행이 기본적으로 덜 큰 피해를 주게 됩니다.
  - 기본 Vitest 구성은 프로젝트/구성 파일을 `forceRerunTriggers`로 표시하므로 테스트 연결이 바뀔 때 changed 모드 재실행도 정확성을 유지합니다.
  - 구성은 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 계속 활성화합니다. 직접 프로파일링을 위해 명시적 캐시 위치 하나를 원하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.
- 성능 디버그 참고:
  - `pnpm test:perf:imports`는 Vitest import-duration 보고와 import-breakdown 출력을 활성화합니다.
  - `pnpm test:perf:imports:changed`는 동일한 프로파일링 보기를 `origin/main` 이후 변경된 파일에만 범위를 좁혀 적용합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋된 diff에 대해 라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고 wall time과 macOS 최대 RSS를 출력합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을 `scripts/test-projects.mjs`와 루트 Vitest 구성으로 라우팅해 현재 dirty 트리를 벤치마크합니다.
  - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 transform 오버헤드에 대한 메인 스레드 CPU 프로파일을 기록합니다.
  - `pnpm test:perf:profile:runner`는 파일 병렬화를 비활성화한 unit 스위트에 대해 러너 CPU+힙 프로파일을 기록합니다.

### E2E (gateway 스모크)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- 런타임 기본값:
  - repo의 나머지와 동일하게 Vitest `threads`와 `isolate: false`를 사용합니다.
  - 적응형 워커를 사용합니다(CI: 최대 2, 로컬: 기본 1).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 silent 모드로 실행됩니다.
- 유용한 재정의:
  - 워커 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`(상한 16)
  - 자세한 콘솔 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`
- 범위:
  - 다중 인스턴스 gateway 종단 간 동작
  - WebSocket/HTTP 표면, Node 페어링, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 키 불필요
  - unit 테스트보다 움직이는 부분이 더 많음(더 느릴 수 있음)

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `test/openshell-sandbox.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell gateway를 시작
  - 임시 로컬 Dockerfile에서 sandbox 생성
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell 백엔드 동작 검증
  - sandbox fs 브리지를 통해 원격 canonical 파일시스템 동작 검증
- 기대 사항:
  - 옵트인 전용이며 기본 `pnpm test:e2e` 실행에는 포함되지 않음
  - 로컬 `openshell` CLI와 정상 동작하는 Docker 데몬 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`를 사용한 뒤 테스트 gateway와 sandbox를 제거함
- 유용한 재정의:
  - 더 넓은 e2e 스위트를 수동으로 실행할 때 이 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI 바이너리 또는 래퍼 스크립트를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (실제 provider + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`
- 기본값: `pnpm test:live`에 의해 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 provider/모델이 _오늘_ 실제 자격 증명으로 실제로 동작하는가?”
  - provider 형식 변경, 도구 호출 특성, 인증 문제, rate limit 동작 포착
- 기대 사항:
  - 설계상 CI에서 안정적이지 않음(실제 네트워크, 실제 provider 정책, 할당량, 장애)
  - 비용이 들거나 rate limit을 사용함
  - “전부”보다는 범위를 좁힌 하위 집합 실행을 선호
- live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소스로 읽습니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 config/auth 자료를 임시 테스트 홈으로 복사하므로 unit fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 의도적으로 실제 홈 디렉터리를 사용해야 할 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본으로 사용합니다. `[live] ...` 진행 출력은 유지하지만 추가 `~/.profile` 안내를 숨기고 gateway 부트스트랩 로그/Bonjour chatter를 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 로테이션(provider별):
  - 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`를 설정하세요(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)
  - 또는 live 전용 재정의로 `OPENCLAW_LIVE_*_KEY`를 사용하세요.
  - 테스트는 rate limit 응답 시 재시도합니다.
- 진행/Heartbeat 출력:
  - live 스위트는 이제 진행 줄을 stderr로 출력하므로 Vitest 콘솔 캡처가 조용하더라도 긴 provider 호출이 눈에 띄게 활성 상태로 보입니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 provider/gateway 진행 줄이 live 실행 중 즉시 스트리밍됩니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정합니다.
  - gateway/프로브 Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정합니다.

## 어떤 스위트를 실행해야 하나요?

다음 결정 표를 사용하세요.

- 로직/테스트 편집: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도)
- gateway 네트워킹 / WS 프로토콜 / 페어링 수정: `pnpm test:e2e` 추가
- “내 봇이 죽었어요” / provider별 실패 / 도구 호출 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## Live: Android Node capability 스윕

- 테스트: `src/gateway/android-node.capabilities.live.test.ts`
- 스크립트: `pnpm android:test:integration`
- 목표: 연결된 Android Node가 현재 광고하는 **모든 명령을 호출**하고 명령 계약 동작을 검증
- 범위:
  - 사전 조건이 필요한 수동 설정(이 스위트는 앱을 설치/실행/페어링하지 않음)
  - 선택된 Android Node에 대한 명령별 gateway `node.invoke` 검증
- 필요한 사전 설정:
  - Android 앱이 이미 gateway에 연결되고 페어링되어 있어야 함
  - 앱이 포그라운드 상태로 유지되어야 함
  - 통과를 기대하는 capability에 대해 권한/캡처 동의가 부여되어야 함
- 선택적 대상 재정의:
  - `OPENCLAW_ANDROID_NODE_ID` 또는 `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- 전체 Android 설정 세부 정보: [Android App](/ko/platforms/android)

## Live: 모델 스모크(profile 키)

live 테스트는 실패를 분리할 수 있도록 두 계층으로 나뉩니다.

- “직접 모델”은 주어진 키로 provider/모델이 최소한 응답할 수 있는지 알려줍니다.
- “Gateway 스모크”는 해당 모델에 대해 전체 gateway+에이전트 파이프라인(세션, 기록, 도구, sandbox 정책 등)이 동작하는지 알려줍니다.

### 계층 1: 직접 모델 completion(gateway 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델 열거
  - `getApiKeyForModel`을 사용해 자격 증명이 있는 모델 선택
  - 모델별 작은 completion 실행(그리고 필요 시 타기팅된 회귀 테스트)
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern`(또는 modern의 별칭인 `all`)을 설정해야 합니다. 그렇지 않으면 `pnpm test:live`가 gateway 스모크에 집중되도록 건너뜁니다.
- 모델 선택 방법:
  - 최신 허용 목록(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)을 실행하려면 `OPENCLAW_LIVE_MODELS=modern`
  - `OPENCLAW_LIVE_MODELS=all`은 최신 허용 목록의 별칭
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`(쉼표로 구분한 허용 목록)
  - modern/all 스윕은 기본적으로 선별된 고신호 상한을 사용합니다. exhaustive modern 스윕을 원하면 `OPENCLAW_LIVE_MAX_MODELS=0`, 더 작은 상한을 원하면 양수를 설정하세요.
- provider 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(쉼표 허용 목록)
- 키 출처:
  - 기본값: profile 저장소와 환경 변수 대체값
  - **profile 저장소만** 강제하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- 존재 이유:
  - “provider API가 망가졌는지 / 키가 유효하지 않은지”와 “gateway 에이전트 파이프라인이 망가졌는지”를 분리
  - 작고 격리된 회귀 테스트를 포함(예: OpenAI Responses/Codex Responses reasoning replay + tool-call 흐름)

### 계층 2: Gateway + dev agent 스모크(`"@openclaw"`가 실제로 하는 일)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 프로세스 내 gateway를 시작
  - `agent:dev:*` 세션 생성/패치(실행별 모델 재정의)
  - 키가 있는 모델들을 순회하며 다음을 검증:
    - “의미 있는” 응답(도구 없음)
    - 실제 도구 호출 동작(`read` 프로브)
    - 선택적 추가 도구 프로브(`exec+read` 프로브)
    - OpenAI 회귀 경로(tool-call-only → 후속 응답)가 계속 동작함
- 프로브 세부 정보(실패를 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 워크스페이스에 nonce 파일을 쓰고, 에이전트에게 이를 `read`한 뒤 nonce를 다시 출력하도록 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 `exec`로 임시 파일에 nonce를 쓴 뒤, 이를 다시 `read`하도록 요청합니다.
  - image 프로브: 테스트가 생성된 PNG(고양이 + 무작위 코드)를 첨부하고, 모델이 `cat <CODE>`를 반환할 것으로 기대합니다.
  - 구현 참고: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`
- 활성화 방법:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: 최신 허용 목록(Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 최신 허용 목록의 별칭
  - 또는 범위를 좁히기 위해 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(또는 쉼표 목록) 설정
  - modern/all gateway 스윕은 기본적으로 선별된 고신호 상한을 사용합니다. exhaustive modern 스윕을 원하면 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, 더 작은 상한을 원하면 양수를 설정하세요.
- provider 선택 방법(“OpenRouter 전체” 피하기):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(쉼표 허용 목록)
- 이 live 테스트에서는 도구 + image 프로브가 항상 켜져 있습니다:
  - `read` 프로브 + `exec+read` 프로브(도구 스트레스)
  - 모델이 image 입력 지원을 광고하는 경우 image 프로브 실행
  - 흐름(상위 수준):
    - 테스트가 “CAT” + 무작위 코드가 들어간 작은 PNG를 생성합니다(`src/gateway/live-image-probe.ts`).
    - 이를 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`로 전송합니다.
    - Gateway가 첨부파일을 `images[]`로 파싱합니다(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`).
    - Embedded 에이전트가 멀티모달 사용자 메시지를 모델에 전달합니다.
    - 검증: 응답에 `cat` + 코드가 포함되어야 합니다(OCR 허용 오차: 사소한 실수는 허용).

팁: 자신의 머신에서 무엇을 테스트할 수 있는지(그리고 정확한 `provider/model` ID)를 보려면 다음을 실행하세요.

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI 백엔드 스모크(Claude, Codex, Gemini 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 기본 구성을 건드리지 않고 로컬 CLI 백엔드를 사용해 Gateway + 에이전트 파이프라인을 검증합니다.
- 백엔드별 스모크 기본값은 해당 확장의 `cli-backend.ts` 정의에 있습니다.
- 활성화:
  - `pnpm test:live`(또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 기본 provider/model: `claude-cli/claude-sonnet-4-6`
  - 명령/인자/image 동작은 해당 CLI 백엔드 Plugin 메타데이터에서 가져옵니다.
- 재정의(선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 실제 image 첨부를 보내려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`(경로가 프롬프트에 주입됨)
  - 프롬프트 주입 대신 image 파일 경로를 CLI 인자로 전달하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG`가 설정된 경우 image 인자 전달 방식을 제어하려면 `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(또는 `"list"`)
  - 두 번째 턴을 보내고 resume 흐름을 검증하려면 `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - 기본 Claude Sonnet -> Opus 동일 세션 연속성 프로브를 비활성화하려면 `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`(선택된 모델이 전환 대상을 지원할 때 강제로 켜려면 `1`)

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
- repo Docker 이미지 안에서 비root `node` 사용자로 live CLI 백엔드 스모크를 실행합니다.
- 해당 확장에서 CLI 스모크 메타데이터를 해석한 뒤, 쓰기 가능한 캐시 접두사 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`(기본값: `~/.cache/openclaw/docker-cli-tools`)에 일치하는 Linux CLI 패키지(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)를 설치합니다.
- `pnpm test:docker:live-cli-backend:claude-subscription`은 `~/.claude/.credentials.json`의 `claudeAiOauth.subscriptionType` 또는 `claude setup-token`의 `CLAUDE_CODE_OAUTH_TOKEN`을 통한 portable Claude Code subscription OAuth가 필요합니다. 이 레인은 먼저 Docker에서 직접 `claude -p`를 증명한 뒤, Anthropic API 키 환경 변수를 유지하지 않은 상태에서 두 번의 Gateway CLI 백엔드 턴을 실행합니다. Claude가 현재 서드파티 앱 사용량을 일반 subscription 플랜 한도 대신 추가 사용량 과금으로 라우팅하기 때문에, 이 subscription 레인은 기본적으로 Claude MCP/도구 및 image 프로브를 비활성화합니다.
- live CLI 백엔드 스모크는 이제 Claude, Codex, Gemini에 대해 동일한 종단 간 흐름을 검증합니다: 텍스트 턴, image 분류 턴, 그다음 gateway CLI를 통해 검증되는 MCP `cron` 도구 호출
- Claude의 기본 스모크는 세션을 Sonnet에서 Opus로 패치하고, 재개된 세션이 이전 메모를 여전히 기억하는지도 검증합니다.

## Live: ACP bind 스모크(`/acp spawn ... --bind here`)

- 테스트: `src/gateway/gateway-acp-bind.live.test.ts`
- 목표: live ACP 에이전트로 실제 ACP 대화 바인드 흐름을 검증합니다.
  - `/acp spawn <agent> --bind here` 전송
  - 합성 message-channel 대화를 제자리에서 바인드
  - 동일한 대화에서 일반 후속 메시지 전송
  - 후속 메시지가 바인드된 ACP 세션 전사본에 도달하는지 검증
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
- 참고:
  - 이 레인은 관리 전용 합성 originating-route 필드와 함께 gateway `chat.send` 표면을 사용하므로, 테스트가 외부 전달을 가장하지 않고도 message-channel 컨텍스트를 첨부할 수 있습니다.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`가 설정되지 않은 경우, 테스트는 선택된 ACP 하니스 에이전트에 대해 embedded `acpx` Plugin의 내장 에이전트 레지스트리를 사용합니다.

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
- 기본적으로 지원되는 모든 live CLI 에이전트(`claude`, `codex`, `gemini`)에 대해 ACP bind 스모크를 순서대로 실행합니다.
- 매트릭스를 좁히려면 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, 또는 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`를 사용하세요.
- `~/.profile`을 소스로 읽고, 일치하는 CLI 인증 자료를 컨테이너에 스테이징하며, 쓰기 가능한 npm 접두사에 `acpx`를 설치한 뒤, 누락된 경우 요청된 live CLI(`@anthropic-ai/claude-code`, `@openai/codex`, 또는 `@google/gemini-cli`)를 설치합니다.
- Docker 내부에서 러너는 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`를 설정하므로, acpx가 소스로 읽은 profile의 provider 환경 변수를 자식 하니스 CLI에서 계속 사용할 수 있습니다.

## Live: Codex app-server 하니스 스모크

- 목표: 일반 gateway `agent` 메서드를 통해 Plugin 소유 Codex 하니스를 검증합니다.
  - 번들된 `codex` Plugin 로드
  - `OPENCLAW_AGENT_RUNTIME=codex` 선택
  - `codex/gpt-5.4`에 첫 번째 gateway agent 턴 전송
  - 동일한 OpenClaw 세션에 두 번째 턴을 전송하고 app-server 스레드가 재개될 수 있는지 검증
  - 동일한 gateway 명령 경로를 통해 `/codex status`와 `/codex models` 실행
- 테스트: `src/gateway/gateway-codex-harness.live.test.ts`
- 활성화: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 기본 모델: `codex/gpt-5.4`
- 선택적 image 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 선택적 MCP/도구 프로브: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 이 스모크는 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 설정하므로, 깨진 Codex 하니스가 PI로 조용히 대체되어 통과할 수 없습니다.
- 인증: 셸/profile의 `OPENAI_API_KEY`, 그리고 존재하는 경우 복사된 `~/.codex/auth.json` 및 `~/.codex/config.toml`

로컬 레시피:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
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
- 마운트된 `~/.profile`을 소스로 읽고, `OPENAI_API_KEY`를 전달하며, 존재하는 경우 Codex CLI 인증 파일을 복사하고, 쓰기 가능한 마운트 npm 접두사에 `@openai/codex`를 설치한 뒤, 소스 트리를 스테이징하고 Codex 하니스 live 테스트만 실행합니다.
- Docker는 기본적으로 image 및 MCP/도구 프로브를 활성화합니다. 더 좁은 디버그 실행이 필요하면 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 또는 `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`을 설정하세요.
- Docker는 또한 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 내보내며, 이는 live 테스트 구성과 일치하므로 `openai-codex/*` 또는 PI 대체가 Codex 하니스 회귀를 숨길 수 없습니다.

### 권장 live 레시피

좁고 명시적인 허용 목록이 가장 빠르고 가장 덜 불안정합니다.

- 단일 모델, 직접(gateway 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, gateway 스모크:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 provider에서의 도구 호출:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 집중(Gemini API 키 + Antigravity):
  - Gemini(API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API(API 키)를 사용합니다.
- `google-antigravity/...`는 Antigravity OAuth 브리지(Cloud Code Assist 스타일 에이전트 엔드포인트)를 사용합니다.
- `google-gemini-cli/...`는 머신의 로컬 Gemini CLI를 사용합니다(별도 인증 + 도구 관련 특이점).
- Gemini API와 Gemini CLI의 차이:
  - API: OpenClaw가 HTTP를 통해 Google의 호스팅된 Gemini API를 호출합니다(API 키 / profile 인증). 대부분의 사용자가 “Gemini”라고 할 때 의미하는 것이 이것입니다.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리를 셸 호출합니다. 자체 인증을 가지며 동작이 다를 수 있습니다(스트리밍/도구 지원/버전 차이).

## Live: 모델 매트릭스(무엇을 커버하는가)

고정된 “CI 모델 목록”은 없습니다(live는 옵트인). 하지만 키가 있는 개발 머신에서 정기적으로 커버하기를 권장하는 **추천 모델**은 다음과 같습니다.

### 최신 스모크 세트(도구 호출 + image)

이것이 우리가 계속 동작하길 기대하는 “일반 모델” 실행입니다.

- OpenAI(non-Codex): `openai/gpt-5.4`(선택 사항: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`(또는 `anthropic/claude-sonnet-4-6`)
- Google(Gemini API): `google/gemini-3.1-pro-preview` 및 `google/gemini-3-flash-preview`(구형 Gemini 2.x 모델은 피하세요)
- Google(Antigravity): `google-antigravity/claude-opus-4-6-thinking` 및 `google-antigravity/gemini-3-flash`
- Z.AI(GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

도구 + image를 포함한 gateway 스모크 실행:
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
- Mistral: `mistral/...`(활성화된 “tools” 지원 모델 하나 선택)
- Cerebras: `cerebras/...`(접근 권한이 있다면)
- LM Studio: `lmstudio/...`(로컬; 도구 호출은 API 모드에 따라 달라짐)

### Vision: image 전송(첨부파일 → 멀티모달 메시지)

image 프로브를 검증하려면 `OPENCLAW_LIVE_GATEWAY_MODELS`에 최소 하나의 image 지원 모델(Claude/Gemini/OpenAI의 vision 지원 변형 등)을 포함하세요.

### Aggregator / 대체 gateway

키가 활성화되어 있다면 다음 경로로도 테스트를 지원합니다.

- OpenRouter: `openrouter/...`(수백 개의 모델; 도구+image 지원 후보를 찾으려면 `openclaw models scan` 사용)
- OpenCode: Zen용 `opencode/...`, Go용 `opencode-go/...`(`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`로 인증)

live 매트릭스에 포함할 수 있는 다른 provider(자격 증명/구성이 있는 경우):

- 내장: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해(커스텀 엔드포인트): `minimax`(클라우드/API), 그리고 모든 OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

팁: 문서에 “모든 모델”을 하드코딩하려고 하지 마세요. 권위 있는 목록은 현재 머신에서 `discoverModels(...)`가 반환하는 것과 사용 가능한 키가 결정합니다.

## 자격 증명(절대 커밋 금지)

live 테스트는 CLI와 동일한 방식으로 자격 증명을 찾습니다. 실질적인 의미는 다음과 같습니다.

- CLI가 동작하면 live 테스트도 동일한 키를 찾아야 합니다.
- live 테스트가 “자격 증명 없음”이라고 하면, `openclaw models list` / 모델 선택을 디버깅하듯 동일하게 디버깅하세요.

- 에이전트별 인증 profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(live 테스트에서 “profile keys”가 의미하는 것)
- 구성: `~/.openclaw/openclaw.json`(또는 `OPENCLAW_CONFIG_PATH`)
- 레거시 상태 디렉터리: `~/.openclaw/credentials/`(존재할 경우 staging된 live 홈으로 복사되지만, 주 profile-key 저장소는 아님)
- 로컬 live 실행은 기본적으로 활성 구성, 에이전트별 `auth-profiles.json` 파일, 레거시 `credentials/`, 그리고 지원되는 외부 CLI 인증 디렉터리를 임시 테스트 홈으로 복사합니다. staging된 live 홈은 `workspace/`와 `sandboxes/`를 건너뛰며, `agents.*.workspace` / `agentDir` 경로 재정의는 제거되어 프로브가 실제 호스트 워크스페이스에 닿지 않도록 합니다.

환경 변수 키(예: `~/.profile`에 export된 키)에 의존하려면 `source ~/.profile` 후 로컬 테스트를 실행하거나, 아래 Docker 러너를 사용하세요(컨테이너에 `~/.profile`을 마운트할 수 있음).

## Deepgram live(오디오 전사)

- 테스트: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 테스트: `src/agents/byteplus.live.test.ts`
- 활성화: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 선택적 모델 재정의: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 테스트: `extensions/comfy/comfy.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 범위:
  - 번들된 comfy image, video, `music_generate` 경로 검증
  - `models.providers.comfy.<capability>`가 구성되지 않은 capability는 각각 건너뜀
  - comfy 워크플로 제출, 폴링, 다운로드 또는 Plugin 등록을 변경한 후 유용함

## Image generation live

- 테스트: `src/image-generation/runtime.live.test.ts`
- 명령: `pnpm test:live src/image-generation/runtime.live.test.ts`
- 하니스: `pnpm test:live:media image`
- 범위:
  - 등록된 모든 image-generation provider Plugin 열거
  - 프로브 전에 로그인 셸(`~/.profile`)에서 누락된 provider 환경 변수를 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/profile/모델이 없는 provider는 건너뜀
  - 공유 런타임 capability를 통해 기본 image-generation 변형 실행:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 현재 커버되는 번들 provider:
  - `openai`
  - `google`
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 선택적 인증 동작:
  - profile 저장소 인증만 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation live

- 테스트: `extensions/music-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media music`
- 범위:
  - 공유 번들 music-generation provider 경로 검증
  - 현재 Google과 MiniMax를 커버
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider 환경 변수 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/profile/모델이 없는 provider는 건너뜀
  - 사용 가능한 경우 선언된 두 런타임 모드를 모두 실행:
    - 프롬프트 전용 입력의 `generate`
    - provider가 `capabilities.edit.enabled`를 선언한 경우의 `edit`
  - 현재 공유 레인 커버리지:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 이 공유 스윕이 아닌 별도 Comfy live 파일
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 선택적 인증 동작:
  - profile 저장소 인증만 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation live

- 테스트: `extensions/video-generation-providers.live.test.ts`
- 활성화: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 하니스: `pnpm test:live:media video`
- 범위:
  - 공유 번들 video-generation provider 경로 검증
  - 프로브 전에 로그인 셸(`~/.profile`)에서 provider 환경 변수 로드
  - 기본적으로 저장된 auth profile보다 live/env API 키를 우선 사용하므로, `auth-profiles.json`의 오래된 테스트 키가 실제 셸 자격 증명을 가리지 않음
  - 사용 가능한 인증/profile/모델이 없는 provider는 건너뜀
  - 사용 가능한 경우 선언된 두 런타임 모드를 모두 실행:
    - 프롬프트 전용 입력의 `generate`
    - provider가 `capabilities.imageToVideo.enabled`를 선언하고 선택된 provider/모델이 공유 스윕에서 버퍼 기반 로컬 image 입력을 수락하는 경우의 `imageToVideo`
    - provider가 `capabilities.videoToVideo.enabled`를 선언하고 선택된 provider/모델이 공유 스윕에서 버퍼 기반 로컬 video 입력을 수락하는 경우의 `videoToVideo`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `imageToVideo` provider:
    - 번들 `veo3`는 텍스트 전용이고 번들 `kling`은 원격 image URL이 필요하므로 `vydra`
  - provider별 Vydra 커버리지:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 이 파일은 기본적으로 원격 image URL fixture를 사용하는 `kling` 레인과 함께 `veo3` text-to-video를 실행합니다.
  - 현재 `videoToVideo` live 커버리지:
    - 선택된 모델이 `runway/gen4_aleph`일 때만 `runway`
  - 현재 공유 스윕에서 선언되었지만 건너뛰는 `videoToVideo` provider:
    - 현재 해당 경로가 원격 `http(s)` / MP4 참조 URL을 필요로 하므로 `alibaba`, `qwen`, `xai`
    - 현재 공유 Gemini/Veo 레인이 로컬 버퍼 기반 입력을 사용하고, 그 경로가 공유 스윕에서는 허용되지 않으므로 `google`
    - 현재 공유 레인에는 조직별 video inpaint/remix 접근 보장이 없으므로 `openai`
- 선택적 범위 축소:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 선택적 인증 동작:
  - profile 저장소 인증만 강제하고 env 전용 재정의를 무시하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media live 하니스

- 명령: `pnpm test:live:media`
- 목적:
  - 공유 image, music, video live 스위트를 하나의 repo 네이티브 진입점으로 실행
  - `~/.profile`에서 누락된 provider 환경 변수를 자동 로드
  - 기본적으로 현재 사용 가능한 인증이 있는 provider로 각 스위트 범위를 자동 축소
  - `scripts/test-live.mjs`를 재사용하므로 Heartbeat 및 quiet 모드 동작이 일관되게 유지됨
- 예시:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 러너(선택적 “Linux에서도 동작하는가” 확인)

이 Docker 러너는 두 가지 범주로 나뉩니다:

- Live 모델 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 repo Docker 이미지 안에서 해당 profile-key live 파일만 실행합니다(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`). 이때 로컬 config 디렉터리와 워크스페이스를 마운트하고(마운트된 경우 `~/.profile`도 source) 실행합니다. 대응하는 로컬 진입점은 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live 러너는 전체 Docker 스윕이 실용적으로 유지되도록 기본적으로 더 작은 스모크 상한을 사용합니다:
  `test:docker:live-models`는 기본적으로 `OPENCLAW_LIVE_MAX_MODELS=12`,
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`을 사용합니다. 더 큰 exhaustive 스캔을 명시적으로 원할 때는 해당 환경 변수를 재정의하세요.
- `test:docker:all`은 먼저 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드한 뒤, 두 live Docker 레인에서 이를 재사용합니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:plugins`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 integration 경로를 검증합니다.

live 모델 Docker 러너는 또한 필요한 CLI 인증 홈만 바인드 마운트하고(또는 실행이 좁혀지지 않은 경우 지원되는 모든 홈), 실행 전에 이를 컨테이너 홈에 복사합니다. 이렇게 하면 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고도 토큰을 새로 고칠 수 있습니다.

- 직접 모델: `pnpm test:docker:live-models`(스크립트: `scripts/test-live-models-docker.sh`)
- ACP bind 스모크: `pnpm test:docker:live-acp-bind`(스크립트: `scripts/test-live-acp-bind-docker.sh`)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend`(스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server 하니스 스모크: `pnpm test:docker:live-codex-harness`(스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway`(스크립트: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live 스모크: `pnpm test:docker:openwebui`(스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard`(스크립트: `scripts/e2e/onboard-docker.sh`)
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태 확인): `pnpm test:docker:gateway-network`(스크립트: `scripts/e2e/gateway-network-docker.sh`)
- MCP 채널 브리지(seed된 Gateway + stdio 브리지 + raw Claude notification-frame 스모크): `pnpm test:docker:mcp-channels`(스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins(설치 스모크 + `/plugin` 별칭 + Claude 번들 재시작 시맨틱): `pnpm test:docker:plugins`(스크립트: `scripts/e2e/plugins-docker.sh`)

live 모델 Docker 러너는 현재 체크아웃도 읽기 전용으로 바인드 마운트하고,
이를 컨테이너 내부의 임시 workdir에 스테이징합니다. 이렇게 하면 런타임
이미지를 슬림하게 유지하면서도 정확한 로컬 소스/구성에 대해 Vitest를
실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 그리고
앱 로컬 `.build` 또는 Gradle 출력 디렉터리와 같은 대형 로컬 전용 캐시 및
앱 빌드 출력을 건너뛰므로 Docker live 실행이 머신별 아티팩트를 복사하느라
몇 분씩 걸리지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 gateway live 프로브가
컨테이너 내부에서 실제 Telegram/Discord 등의 채널 워커를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로,
해당 Docker 레인에서 gateway live 커버리지를 좁히거나 제외해야 할 때는
`OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. 이 레인은
OpenAI 호환 HTTP 엔드포인트가 활성화된 OpenClaw gateway 컨테이너를 시작하고,
그 gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작한 뒤, Open WebUI를
통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 검증한 다음,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
첫 실행은 Docker가 Open WebUI 이미지를 가져와야 하거나 Open WebUI 자체의
콜드 스타트 설정을 마쳐야 할 수 있으므로 눈에 띄게 더 느릴 수 있습니다.
이 레인에는 사용 가능한 live 모델 키가 필요하며, Docker 실행에서 이를
제공하는 기본 방법은 `OPENCLAW_PROFILE_FILE`(기본값 `~/.profile`)입니다.
성공적인 실행은 `{ "ok": true, "model": "openclaw/default", ... }` 같은
작은 JSON 페이로드를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord,
iMessage 계정이 필요하지 않습니다. 이 레인은 seed된 Gateway 컨테이너를
부팅하고, `openclaw mcp serve`를 시작하는 두 번째 컨테이너를 띄운 뒤,
실제 stdio MCP 브리지를 통해 라우팅된 대화 탐색, 전사본 읽기, 첨부파일
메타데이터, live 이벤트 큐 동작, 아웃바운드 전송 라우팅, 그리고 Claude 스타일
채널 + 권한 알림을 검증합니다. 알림 검사는 raw stdio MCP 프레임을 직접
검사하므로, 특정 클라이언트 SDK가 우연히 노출하는 내용이 아니라 브리지가
실제로 무엇을 내보내는지를 검증합니다.

수동 ACP plain-language 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로를 위해 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 환경 변수:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)를 `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)를 `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`)를 `/home/node/.profile`에 마운트하고 테스트 실행 전에 source
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`)를 `/home/node/.npm-global`에 마운트해 Docker 내부 CLI 설치 캐시로 사용
- `$HOME` 아래 외부 CLI 인증 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 뒤 테스트 시작 전에 `/home/node/...`로 복사됨
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론된 필요한 디렉터리/파일만 마운트
  - 수동 재정의: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록
- 실행 범위를 좁히려면 `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- 컨테이너 내부 provider 필터링을 위해 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 자격 증명이 profile 저장소에서 오도록 강제하려면(환경 변수 제외) `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI 스모크에서 gateway가 노출할 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI 스모크에서 사용하는 nonce 확인 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`

## 문서 점검

문서 편집 후에는 docs 검사를 실행하세요: `pnpm check:docs`.
인페이지 헤딩 검사까지 필요하면 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

실제 provider 없이도 동작하는 “실제 파이프라인” 회귀 테스트입니다.

- Gateway 도구 호출(mock OpenAI, 실제 gateway + 에이전트 루프): `src/gateway/gateway.test.ts`(케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, config 작성 + 인증 강제): `src/gateway/gateway.test.ts`(케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

이미 몇 가지 CI 안전 테스트가 있으며, 이는 “에이전트 신뢰성 평가”처럼 동작합니다.

- 실제 gateway + 에이전트 루프를 통한 mock 도구 호출(`src/gateway/gateway.test.ts`)
- 세션 연결과 config 효과를 검증하는 종단 간 마법사 흐름(`src/gateway/gateway.test.ts`)

Skills에 대해 아직 부족한 부분은 다음과 같습니다([Skills](/ko/tools/skills) 참고).

- **의사결정:** prompt에 skills가 나열되어 있을 때, 에이전트가 올바른 skill을 선택하는가(또는 관련 없는 skill을 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필수 단계/인자를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 기록 유지, sandbox 경계를 검증하는 다중 턴 시나리오

향후 평가는 먼저 결정적으로 유지되어야 합니다.

- mock provider를 사용해 도구 호출 + 순서, skill 파일 읽기, 세션 연결을 검증하는 시나리오 러너
- skill 중심 시나리오의 소규모 스위트(사용 vs 회피, 게이팅, prompt injection)
- CI 안전 스위트가 먼저 마련된 뒤에만 선택적으로 live 평가(옵트인, env 게이트)

## 계약 테스트(Plugin 및 채널 형태)

계약 테스트는 등록된 모든 Plugin 및 채널이 해당 인터페이스 계약을 준수하는지 검증합니다. 이 테스트는 발견된 모든 Plugin을 순회하며 형태와 동작에 대한 일련의 검증을 수행합니다. 기본 `pnpm test` unit 레인은 의도적으로 이러한 공유 경계 및 스모크 파일을 건너뛰므로, 공유 채널 또는 provider 표면을 건드릴 때는 계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- provider 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 있습니다.

- **plugin** - 기본 Plugin 형태(id, name, capabilities)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 페이로드 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 액션 핸들러
- **threading** - 스레드 ID 처리
- **directory** - 디렉터리/roster API
- **group-policy** - 그룹 정책 적용

### provider 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 있습니다.

- **status** - 채널 상태 프로브
- **registry** - Plugin 레지스트리 형태

### provider 계약

`src/plugins/contracts/*.contract.test.ts`에 있습니다.

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - Plugin 발견
- **loader** - Plugin 로딩
- **runtime** - provider 런타임
- **shape** - Plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 subpath를 변경한 후
- 채널 또는 provider Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 발견을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 테스트 추가(가이드)

live에서 발견된 provider/모델 이슈를 수정할 때:

- 가능하면 CI 안전 회귀 테스트를 추가하세요(mock/stub provider 사용, 또는 정확한 요청 형태 변환 캡처)
- 본질적으로 live 전용이라면(rate limit, 인증 정책), live 테스트는 env 변수를 통해 좁고 옵트인으로 유지하세요
- 버그를 포착하는 가장 작은 계층을 타기팅하는 것을 선호하세요:
  - provider 요청 변환/재생 버그 → 직접 모델 테스트
  - gateway 세션/기록/도구 파이프라인 버그 → gateway live 스모크 또는 CI 안전 gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스당 하나의 샘플 대상을 도출한 뒤, 순회 세그먼트 exec ID가 거부되는지 검증합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 계열을 추가하면, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 ID에서 의도적으로 실패하므로 새 클래스가 조용히 건너뛰어질 수 없습니다.
