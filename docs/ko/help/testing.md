---
read_when:
    - 로컬 또는 CI에서 테스트 실행
    - 모델/공급자 버그에 대한 회귀 테스트 추가
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: 단위/e2e/라이브 스위트, Docker 러너, 각 테스트가 다루는 범위'
title: 테스트
x-i18n:
    generated_at: "2026-07-04T03:41:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의
Docker 러너가 있습니다. 이 문서는 "테스트 방식" 안내서입니다.

- 각 스위트가 다루는 범위와 의도적으로 다루지 _않는_ 범위.
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에서 실행할 명령.
- 라이브 테스트가 자격 증명을 찾고 모델/프로바이더를 선택하는 방식.
- 실제 모델/프로바이더 문제에 대한 회귀 테스트를 추가하는 방식.

<Note>
**QA 스택(qa-lab, qa-channel, 라이브 전송 레인)**은 별도로 문서화되어 있습니다.

- [QA 개요](/ko/concepts/qa-e2e-automation) - 아키텍처, 명령 표면, 시나리오 작성.
- [Matrix QA](/ko/concepts/qa-matrix) - `pnpm openclaw qa matrix` 참고 자료.
- [성숙도 스코어카드](/ko/maturity/scorecard) - 릴리스 QA 증거가 안정성과 LTS 결정에 기여하는 방식.
- [QA 채널](/ko/channels/qa-channel) - 저장소 기반 시나리오에서 사용하는 합성 전송 Plugin.

이 페이지는 일반 테스트 스위트와 Docker/Parallels 러너를 실행하는 방법을 다룹니다. 아래 QA 전용 러너 섹션([QA 전용 러너](#qa-specific-runners))에는 구체적인 `qa` 호출이 나열되어 있으며 위의 참고 자료를 다시 안내합니다.
</Note>

## 빠른 시작

대부분의 날에는:

- 전체 게이트(푸시 전에 예상됨): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest 감시 루프: `pnpm test:watch`
- 이제 직접 파일 지정도 확장/채널 경로로 라우팅됩니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 수정 중이라면 먼저 대상 지정 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

## 테스트 임시 디렉터리

테스트가 소유하는 임시 디렉터리에는 `test/helpers/temp-dir.ts`의 공유 헬퍼를
선호하세요. 이 헬퍼들은 소유권을 명확히 하고 정리를 동일한 테스트 수명 주기 안에
유지합니다.

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)`는 의도적으로 수동 정리 메서드를 노출하지 않습니다. Vitest가
각 테스트 뒤 정리를 소유합니다. 아직 이전하지 않은 테스트를 위해 기존 저수준 헬퍼는
남아 있지만, 새 테스트와 이전된 테스트는 자동 정리 트래커를 사용해야 합니다.
새로운 수동 `makeTempDir`, `cleanupTempDirs`, `createTempDirTracker` 사용을 피하고,
원시 임시 디렉터리 동작을 명시적으로 검증하는 경우가 아니라면 테스트에서 새 bare
`fs.mkdtemp*` 호출도 피하세요. 테스트가 의도적으로 bare 임시 디렉터리를 필요로 할 때는
구체적인 이유가 있는 감사 가능한 허용 주석을 추가하세요.

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

마이그레이션 가시성을 위해 `node scripts/report-test-temp-creations.mjs`는 추가된 diff
라인에서 새 bare 임시 디렉터리 생성과 새 수동 공유 헬퍼 사용을 보고하지만,
기존 정리 스타일을 차단하지는 않습니다. 이 파일 범위는 별도의 테스트 헬퍼 파일명
휴리스틱을 유지하는 대신 `scripts/changed-lanes.mjs`에서 사용하는 동일한 테스트 경로
분류를 의도적으로 따르며, 공유 헬퍼 구현 자체는 건너뜁니다. `check:changed`는 변경된
테스트 경로에 대해 이 보고서를 경고 전용 CI 신호로 실행합니다. 발견 사항은 실패가
아니라 GitHub 경고 주석입니다.

실제 프로바이더/모델을 디버깅할 때(실제 자격 증명 필요):

- 라이브 스위트(모델 + Gateway 도구/이미지 프로브): `pnpm test:live`
- 라이브 파일 하나를 조용히 대상으로 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 런타임 성능 보고서: 실제 `openai/gpt-5.5` 에이전트 턴에는
  `live_openai_candidate=true`로, Kova CPU/힙/트레이스 아티팩트에는
  `deep_profile=true`로 `OpenClaw Performance`를 디스패치합니다. 예약된 일일 실행은
  `CLAWGRIT_REPORTS_TOKEN`이 구성된 경우 mock-provider, deep-profile, GPT 5.5 레인
  아티팩트를 `openclaw/clawgrit-reports`에 게시합니다. mock-provider 보고서에는
  소스 수준 Gateway 부팅, 메모리, Plugin 압력, 반복 fake-model hello-loop, CLI 시작
  수치도 포함됩니다.
- Docker 라이브 모델 스윕: `pnpm test:docker:live-models`
  - 선택된 각 모델은 이제 텍스트 턴과 작은 파일 읽기 스타일 프로브를 실행합니다.
    메타데이터가 `image` 입력을 광고하는 모델은 작은 이미지 턴도 실행합니다.
    프로바이더 실패를 격리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 프로브를 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 모두 `include_live_suites: true`로 재사용 가능한
    live/E2E 워크플로를 호출하며, 여기에는 프로바이더별로 샤딩된 별도 Docker 라이브
    모델 매트릭스 작업이 포함됩니다.
  - 집중 CI 재실행에는 `include_live_suites: true` 및 `live_models_only: true`로
    `OpenClaw Live And E2E Checks (Reusable)`를 디스패치하세요.
  - 새 고신호 프로바이더 시크릿은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 그 예약/릴리스
    호출자에 추가하세요.
- 네이티브 Codex 바운드 채팅 스모크: `pnpm test:docker:live-codex-bind`
  - Codex 앱 서버 경로에 대해 Docker 라이브 레인을 실행하고, `/codex bind`로 합성
    Slack DM을 바인딩하며, `/codex fast`와 `/codex permissions`를 실행한 다음,
    ACP 대신 네이티브 Plugin 바인딩을 통해 일반 답장과 이미지 첨부 경로를 검증합니다.
- Codex 앱 서버 하네스 스모크: `pnpm test:docker:live-codex-harness`
  - Plugin이 소유한 Codex 앱 서버 하네스를 통해 Gateway 에이전트 턴을 실행하고,
    `/codex status`와 `/codex models`를 검증하며, 기본적으로 이미지, cron MCP,
    하위 에이전트, Guardian 프로브를 실행합니다. 다른 Codex 앱 서버 실패를 격리할 때는
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`으로 하위 에이전트 프로브를
    비활성화하세요. 집중 하위 에이전트 확인에는 다른 프로브를 비활성화하세요:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`이 설정되지 않은 경우 하위 에이전트
    프로브 뒤 종료됩니다.
- Codex 온디맨드 설치 스모크: `pnpm test:docker:codex-on-demand`
  - 패키징된 OpenClaw tarball을 Docker에 설치하고, OpenAI API 키 온보딩을 실행한 뒤,
    Codex Plugin과 `@openai/codex` 의존성이 필요 시 관리되는 npm 프로젝트 루트에
    다운로드되었는지 검증합니다.
- 라이브 Plugin 도구 의존성 스모크: `pnpm test:docker:live-plugin-tool`
  - 실제 `slugify` 의존성이 있는 fixture Plugin을 패키징하고, `npm-pack:`을 통해
    설치하며, 관리되는 npm 프로젝트 루트 아래 의존성을 검증한 다음, 라이브 OpenAI
    모델에 Plugin 도구를 호출하고 숨겨진 slug를 반환하도록 요청합니다.
- Crestodian 구조 명령 스모크: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 구조 명령 표면에 대한 옵트인 이중 확인 검사입니다. `/crestodian status`를
    실행하고, 영구 모델 변경을 큐에 넣고, `/crestodian yes`에 응답하며, 감사/구성 쓰기
    경로를 검증합니다.
- Crestodian 플래너 Docker 스모크: `pnpm test:docker:crestodian-planner`
  - `PATH`에 fake Claude CLI가 있는 구성 없는 컨테이너에서 Crestodian을 실행하고,
    퍼지 플래너 폴백이 감사되는 타입 지정 구성 쓰기로 변환되는지 검증합니다.
- Crestodian 최초 실행 Docker 스모크: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw 상태 디렉터리에서 시작해 현대적인 onboard Crestodian 진입점을
    검증하고, setup/model/agent/Discord Plugin + SecretRef 쓰기를 적용하고, 구성을
    검증하며, 감사 항목을 검증합니다. 동일한 Ring 0 설정 경로는 QA Lab에서도
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`로 다룹니다.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 다음, 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`을
  `moonshot/kimi-k2.6`에 대해 실행합니다. JSON이 Moonshot/K2.6을 보고하고 어시스턴트
  트랜스크립트가 정규화된 `usage.cost`를 저장하는지 검증합니다.

<Tip>
실패 사례 하나만 필요할 때는 아래에 설명된 허용 목록 환경 변수를 통해 라이브 테스트를 좁히는 방식을 선호하세요.
</Tip>

## QA 전용 러너

QA-lab 현실성이 필요할 때 이 명령들은 기본 테스트 스위트 옆에 위치합니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. Agentic 패리티는 독립형 PR 워크플로가
아니라 `QA-Lab - All Lanes`와 릴리스 검증 아래에 중첩됩니다. 광범위한 검증에는
`rerun_group=qa-parity` 또는 릴리스 체크 QA 그룹과 함께 `Full Release Validation`을
사용해야 합니다. 안정/기본 릴리스 체크는 `run_release_soak=true` 뒤에 포괄적인
라이브/Docker 소크를 유지합니다. `full` 프로필은 소크를 강제로 켭니다.
`QA-Lab - All Lanes`는 `main`에서 야간으로 실행되고, 수동 디스패치에서는 mock 패리티
레인, 라이브 Matrix 레인, Convex 관리 라이브 Telegram 레인, Convex 관리 라이브
Discord 레인을 병렬 작업으로 실행합니다. 예약 QA와 릴리스 체크는 Matrix
`--profile fast`를 명시적으로 전달하지만, Matrix CLI와 수동 워크플로 입력의 기본값은
`all`로 남아 있습니다. 수동 디스패치는 `all`을 `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, `e2ee-cli` 작업으로 샤딩할 수 있습니다. `OpenClaw Release Checks`는
릴리스 승인 전에 패리티와 빠른 Matrix 및 Telegram 레인을 실행하며, 릴리스 전송
검사에는 `mock-openai/gpt-5.5`를 사용해 결정성을 유지하고 일반 프로바이더 Plugin
시작을 피합니다. 이러한 라이브 전송 Gateway는 메모리 검색을 비활성화합니다. 메모리
동작은 QA 패리티 스위트에서 계속 다룹니다.

전체 릴리스 라이브 미디어 샤드는 이미 `ffmpeg`와 `ffprobe`가 포함된
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`를 사용합니다. Docker 라이브
모델/백엔드 샤드는 선택된 커밋마다 한 번 빌드되는 공유
`ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용한 다음, 모든 샤드 안에서
다시 빌드하는 대신 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 가져옵니다.

- `pnpm openclaw qa suite`
  - 저장소 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 선택한 시나리오 세트에 대해 최상위 `qa-evidence.json`, `qa-suite-summary.json`,
    `qa-suite-report.md` 아티팩트를 작성하며, 혼합 플로, Vitest, Playwright 시나리오 선택을 포함합니다.
  - `pnpm openclaw qa run --qa-profile <profile>`로 디스패치되면 선택한 taxonomy 프로필
    스코어카드를 동일한 `qa-evidence.json`에 포함합니다. `smoke-ci`는 슬림 증거를 작성하며,
    이때 `evidenceMode: "slim"`을 설정하고 항목별 `execution`을 생략합니다. `release`는
    엄선된 릴리스 준비 상태 구간을 다룹니다. `all`은 모든 활성 maturity 카테고리를 선택하며,
    전체 스코어카드 아티팩트가 필요할 때 명시적인 QA Profile Evidence 워크플로 디스패치용입니다.
  - 기본적으로 격리된 Gateway 워커를 사용해 선택된 여러 시나리오를 병렬로 실행합니다.
    `qa-channel`은 기본 동시성이 4입니다(선택된 시나리오 수로 제한됨). 워커 수를 조정하려면
    `--concurrency <count>`를 사용하고, 이전 직렬 레인에는 `--concurrency 1`을 사용합니다.
  - 어떤 시나리오든 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는
    `--allow-failures`를 사용합니다.
  - 제공자 모드 `live-frontier`, `mock-openai`, `aimock`을 지원합니다. `aimock`은 시나리오 인식
    `mock-openai` 레인을 대체하지 않고, 실험적 fixture 및 프로토콜 mock 커버리지를 위해 로컬
    AIMock 기반 제공자 서버를 시작합니다.
- `pnpm openclaw qa coverage --match <query>`
  - 시나리오 ID, 제목, 표면, 커버리지 ID, 문서 참조, 코드 참조, Plugin, 제공자 요구 사항을 검색한 뒤
    일치하는 suite 대상을 출력합니다.
  - 변경된 동작이나 파일 경로는 알지만 가장 작은 시나리오를 모를 때 QA Lab 실행 전에 사용합니다.
    이는 참고용일 뿐입니다. 변경되는 동작에 따라 mock, live, Multipass, Matrix 또는 transport 증거를
    여전히 선택해야 합니다.
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab을 통해 live OpenAI Kitchen Sink Plugin gauntlet을 실행합니다. 외부 Kitchen Sink 패키지를
    설치하고, Plugin SDK 표면 인벤토리를 검증하며, `/healthz`와 `/readyz`를 검사하고, Gateway CPU/RSS
    증거를 기록하며, live OpenAI 턴을 실행하고, 적대적 진단을 확인합니다. `OPENAI_API_KEY` 같은 live
    OpenAI 인증이 필요합니다. hydrated Testbox 세션에서는 `openclaw-testbox-env` 헬퍼가 있을 때
    Testbox live-auth 프로필을 자동으로 소싱합니다.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 시작 벤치와 작은 mock QA Lab 시나리오 팩(`channel-chat-baseline`,
    `memory-failure-fallback`, `gateway-restart-inflight-run`)을 실행하고,
    `.artifacts/gateway-cpu-scenarios/` 아래에 결합된 CPU 관찰 요약을 작성합니다.
  - 기본적으로 지속적인 hot CPU 관찰만 플래그합니다(`--cpu-core-warn` 및 `--hot-wall-warn-ms`).
    따라서 짧은 시작 버스트는 몇 분 동안 Gateway가 고정되는 회귀처럼 보이지 않고 메트릭으로 기록됩니다.
  - 빌드된 `dist` 아티팩트를 사용합니다. 체크아웃에 최신 런타임 출력이 아직 없으면 먼저 빌드를 실행합니다.
- `pnpm openclaw qa suite --runner multipass`
  - disposable Multipass Linux VM 안에서 동일한 QA suite를 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 제공자/모델 선택 플래그를 재사용합니다.
  - live 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다. env 기반 제공자 키, QA live 제공자
    config 경로, 그리고 존재하는 경우 `CODEX_HOME`입니다.
  - 출력 디렉터리는 게스트가 마운트된 작업 영역을 통해 다시 쓸 수 있도록 저장소 루트 아래에 있어야 합니다.
  - 일반 QA 보고서와 요약, Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 작성합니다.
- `pnpm qa:lab:up`
  - operator 스타일 QA 작업을 위해 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드하고, Docker에 전역 설치하며, 비대화형 OpenAI API 키 온보딩을
    실행하고, 기본적으로 Telegram을 구성하며, 패키지된 Plugin 런타임이 시작 시 의존성 복구 없이 로드되는지
    검증하고, doctor를 실행하며, mock OpenAI 엔드포인트를 대상으로 로컬 agent 턴 하나를 실행합니다.
  - Discord로 동일한 패키지 설치 레인을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용합니다.
- `pnpm test:docker:session-runtime-context`
  - 내장 런타임 컨텍스트 transcript에 대한 결정적 built-app Docker smoke를 실행합니다. 숨겨진 OpenClaw
    런타임 컨텍스트가 보이는 사용자 턴으로 누출되지 않고 비표시 custom message로 유지되는지 검증한 뒤,
    영향을 받는 깨진 session JSONL을 시드하고 `openclaw doctor --fix`가 백업과 함께 활성 브랜치로
    다시 작성하는지 검증합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 OpenClaw 패키지 후보를 설치하고, 설치된 패키지 온보딩을 실행하며, 설치된 CLI로 Telegram을
    구성한 뒤, 해당 설치 패키지를 SUT Gateway로 사용해 live Telegram QA 레인을 재사용합니다.
  - wrapper는 체크아웃에서 `qa-lab` harness 소스만 마운트합니다. 설치된 패키지가 `dist`,
    `openclaw/plugin-sdk`, bundled Plugin 런타임을 소유하므로, 레인은 현재 체크아웃 Plugin을 테스트 대상
    패키지에 섞지 않습니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다. registry에서 설치하는 대신
    확인된 로컬 tarball을 테스트하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz`
    또는 `OPENCLAW_CURRENT_PACKAGE_TGZ`를 설정합니다.
  - 기본적으로 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`을 사용해 `qa-evidence.json`에 반복 RTT 타이밍을
    내보냅니다. RTT 실행을 조정하려면 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, 또는 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`를
    재정의합니다. `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS`는 샘플링할 Telegram QA check ID의 쉼표로 구분된
    목록을 받습니다. 설정하지 않으면 기본 RTT 가능 check는 `telegram-mentioned-message-reply`입니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env 자격 증명 또는 Convex 자격 증명 소스를 사용합니다.
    CI/릴리스 자동화에서는 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와
    `OPENCLAW_QA_CONVEX_SITE_URL`, 그리고 role secret을 설정합니다. CI에
    `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex role secret이 있으면 Docker wrapper가 Convex를 자동으로
    선택합니다.
  - wrapper는 Docker 빌드/설치 작업 전에 호스트에서 Telegram 또는 Convex 자격 증명 env를 검증합니다.
    자격 증명 전 설정을 의도적으로 디버깅할 때만 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`을
    설정합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 대해서만 공유
    `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다. Convex 자격 증명이 선택되고 role이 설정되지 않은 경우,
    wrapper는 CI에서는 `ci`, CI 밖에서는 `maintainer`를 사용합니다.
  - GitHub Actions는 이 레인을 수동 maintainer 워크플로 `NPM Telegram Beta E2E`로 노출합니다.
    merge 시 실행되지 않습니다. 이 워크플로는 `qa-live-shared` 환경과 Convex CI 자격 증명 lease를
    사용합니다.
- GitHub Actions는 후보 패키지 하나에 대한 side-run 제품 증거용 `Package Acceptance`도 노출합니다.
  신뢰할 수 있는 ref, published npm spec, SHA-256이 포함된 HTTPS tarball URL, 또는 다른 실행의 tarball
  아티팩트를 받고, 정규화된 `openclaw-current.tgz`를 `package-under-test`로 업로드한 뒤, smoke, package,
  product, full 또는 custom 레인 프로필로 기존 Docker E2E scheduler를 실행합니다. 동일한
  `package-under-test` 아티팩트를 대상으로 Telegram QA 워크플로를 실행하려면 `telegram_mode=mock-openai`
  또는 `live-frontier`를 설정합니다.
  - 최신 beta 제품 증거:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 정확한 tarball URL 증거에는 digest가 필요하며 공개 URL 안전 정책을 사용합니다.

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private tarball mirror는 명시적인 trusted-source 정책을 사용합니다.

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url`은 trusted workflow ref에서 `.github/package-trusted-sources.json`을 읽으며, URL 자격 증명이나 workflow-input private-network 우회를 허용하지 않습니다. 명명된 정책이 bearer auth를 선언하는 경우, 고정 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret을 구성합니다.

- 아티팩트 증거는 다른 Actions 실행에서 tarball 아티팩트를 다운로드합니다.

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 현재 OpenClaw 빌드를 Docker에서 pack 및 설치하고, OpenAI가 구성된 상태로 Gateway를 시작한 뒤,
    config 편집을 통해 bundled channel/Plugin을 활성화합니다.
  - setup discovery가 구성되지 않은 다운로드 가능 Plugin을 비워 두는지, 첫 번째 구성된 doctor repair가
    누락된 각 다운로드 가능 Plugin을 명시적으로 설치하는지, 두 번째 restart가 숨겨진 의존성 복구를 실행하지
    않는지 검증합니다.
  - 또한 알려진 이전 npm baseline을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에
    Telegram을 활성화하며, 후보의 업데이트 후 doctor가 harness 측 postinstall repair 없이 legacy Plugin
    의존성 잔여물을 정리하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels 게스트 전반에서 native packaged-install update smoke를 실행합니다. 선택된 각 platform은
    먼저 요청된 baseline 패키지를 설치한 뒤, 동일한 게스트에서 설치된 `openclaw update` 명령을 실행하고
    설치된 버전, 업데이트 상태, Gateway 준비 상태, 로컬 agent 턴 하나를 검증합니다.
  - 한 게스트를 반복 작업할 때는 `--platform macos`, `--platform windows`, 또는 `--platform linux`를
    사용합니다. 요약 아티팩트 경로와 레인별 상태에는 `--json`을 사용합니다.
  - OpenAI 레인은 기본적으로 live agent-turn 증거에 `openai/gpt-5.5`를 사용합니다. 다른 OpenAI 모델을
    의도적으로 검증할 때는 `--model <provider/model>`을 전달하거나 `OPENCLAW_PARALLELS_OPENAI_MODEL`을
    설정합니다.
  - Parallels transport stall이 남은 테스트 시간을 소모하지 않도록 긴 로컬 실행은 호스트 timeout으로
    감쌉니다.

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 `/tmp/openclaw-parallels-npm-update.*` 아래에 중첩 레인 로그를 작성합니다. 외부 wrapper가
    멈췄다고 가정하기 전에 `windows-update.log`, `macos-update.log`, 또는 `linux-update.log`를
    검사합니다.
  - Windows 업데이트는 cold guest에서 업데이트 후 doctor 및 패키지 업데이트 작업에 10~15분이 걸릴 수
    있습니다. 중첩 npm debug 로그가 진행 중이라면 여전히 정상입니다.
  - 이 aggregate wrapper를 개별 Parallels macOS, Windows 또는 Linux smoke 레인과 병렬로 실행하지
    마세요. 이들은 VM 상태를 공유하며 snapshot restore, package serving 또는 guest Gateway 상태에서
    충돌할 수 있습니다.
  - 업데이트 후 증거는 일반 bundled Plugin 표면을 실행합니다. speech, image generation, media
    understanding 같은 capability facade가 bundled runtime API를 통해 로드되기 때문이며, agent 턴 자체가
    단순 텍스트 응답만 확인하더라도 마찬가지입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 스모크 테스트를 위해 로컬 AIMock 제공자 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix 라이브 QA 레인을 실행합니다. 소스 체크아웃 전용입니다. 패키지 설치본에는 `qa-lab`이 포함되지 않습니다.
  - 전체 CLI, 프로필/시나리오 카탈로그, env vars, 아티팩트 레이아웃: [Matrix QA](/ko/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env의 드라이버 및 SUT 봇 토큰을 사용해 실제 비공개 그룹을 대상으로 Telegram 라이브 QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. 그룹 id는 숫자 Telegram chat id여야 합니다.
  - 공유 풀 자격 증명에는 `--credential-source convex`를 지원합니다. 기본적으로 env 모드를 사용하거나, 풀 lease를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 기본값은 canary, mention gating, 명령 주소 지정, `/status`, 봇 간 mention 응답, 핵심 네이티브 명령 응답을 포함합니다. `mock-openai` 기본값은 결정적 reply-chain 및 Telegram 최종 메시지 스트리밍 회귀도 포함합니다. `session_status` 같은 선택적 probe에는 `--list-scenarios`를 사용하세요.
  - 시나리오가 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트만 원할 때는 `--allow-failures`를 사용하세요.
  - 같은 비공개 그룹에 서로 다른 봇 두 개가 필요하며, SUT 봇은 Telegram 사용자 이름을 노출해야 합니다.
  - 안정적인 봇 간 관찰을 위해 두 봇 모두 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화하고, 드라이버 봇이 그룹 봇 트래픽을 관찰할 수 있게 하세요.
  - `.artifacts/qa-e2e/...` 아래에 Telegram QA 보고서, 요약, `qa-evidence.json`을 작성합니다. 응답 시나리오에는 드라이버 전송 요청부터 관찰된 SUT 응답까지의 RTT가 포함됩니다.

`Mantis Telegram Live`는 이 레인을 감싸는 PR 증거 래퍼입니다. Convex로 lease한 Telegram 자격 증명으로 후보 ref를 실행하고, Crabbox 데스크톱 브라우저에서 수정된 QA 보고서/증거 번들을 렌더링하며, MP4 증거를 녹화하고, motion-trimmed GIF를 생성하고, 아티팩트 번들을 업로드하며, `pr_number`가 설정된 경우 Mantis GitHub App을 통해 인라인 PR 증거를 게시합니다. Maintainer는 Actions UI의 `Mantis Scenario`(`scenario_id:
telegram-live`)를 통해 시작하거나 pull request 댓글에서 직접 시작할 수 있습니다.

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`는 PR 시각적 증명을 위한 agentic 네이티브 Telegram Desktop 전/후 래퍼입니다. 자유 형식 `instructions`와 함께 Actions UI에서, `Mantis Scenario`(`scenario_id:
telegram-desktop-proof`)를 통해, 또는 PR 댓글에서 시작하세요.

```text
@openclaw-mantis telegram desktop proof
```

Mantis 에이전트는 PR을 읽고, 변경을 증명하는 Telegram에서 보이는 동작을 결정하며, baseline 및 후보 ref에서 실제 사용자 Crabbox Telegram Desktop 증명 레인을 실행하고, 네이티브 GIF가 유용해질 때까지 반복하고, 쌍을 이룬 `motionPreview` manifest를 작성하며, `pr_number`가 설정된 경우 Mantis GitHub App을 통해 같은 2열 GIF 표를 게시합니다.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux 데스크톱을 lease하거나 재사용하고, 네이티브 Telegram Desktop을 설치하고, lease한 Telegram SUT 봇 토큰으로 OpenClaw를 구성하고, gateway를 시작하고, 보이는 VNC 데스크톱에서 스크린샷/MP4 증거를 녹화합니다.
  - 기본값은 `--credential-source convex`이므로 워크플로에는 Convex broker secret만 필요합니다. `pnpm openclaw qa telegram`과 같은 `OPENCLAW_QA_TELEGRAM_*` 변수로 `--credential-source env`를 사용하세요.
  - Telegram Desktop에는 여전히 사용자 로그인/프로필이 필요합니다. 봇 토큰은 OpenClaw만 구성합니다. base64 `.tgz` 프로필 아카이브에는 `--telegram-profile-archive-env <name>`을 사용하거나, `--keep-lease`를 사용하고 VNC를 통해 한 번 수동으로 로그인하세요.
  - 출력 디렉터리 아래에 `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, `telegram-desktop-builder.mp4`를 작성합니다.

라이브 전송 레인은 새 전송이 서로 달라지지 않도록 하나의 표준 contract를 공유합니다. 레인별 coverage matrix는 [QA 개요 → 라이브 전송 coverage](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 있습니다. `qa-channel`은 넓은 synthetic suite이며 해당 matrix의 일부가 아닙니다.

### Convex를 통한 공유 Telegram 자격 증명(v1)

라이브 전송 QA에 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면 QA lab은 Convex 기반 pool에서 독점 lease를 획득하고, 레인이 실행되는 동안 해당 lease에 heartbeat를 보내며, 종료 시 lease를 해제합니다. 이 섹션 이름은 Discord, Slack, WhatsApp 지원보다 먼저 만들어졌지만 lease contract는 종류 전반에서 공유됩니다.

참조 Convex 프로젝트 scaffold:

- `qa/convex-credential-broker/`

필수 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택한 role에 대한 secret 하나:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 role 선택:
  - CLI: `--credential-role maintainer|ci`
  - Env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본값 `ci`, 그 외에는 `maintainer`)

선택적 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

일반 작업에서는 `OPENCLAW_QA_CONVEX_SITE_URL`이 `https://`를 사용해야 합니다.

Maintainer admin 명령(pool 추가/제거/목록)에는 특히 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

maintainer용 CLI helper:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용해 secret 값을 출력하지 않고 Convex 사이트 URL, broker secret, endpoint prefix, HTTP timeout, admin/list 접근 가능성을 확인하세요. 스크립트와 CI utility에서 machine-readable 출력을 원하면 `--json`을 사용하세요.

기본 endpoint contract(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 고갈/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 성공: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /admin/add`(maintainer secret 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(maintainer secret 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(maintainer secret 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram kind의 payload shape:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자 Telegram chat id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 shape를 검증하고 잘못된 payload를 거부합니다.

Telegram 실제 사용자 kind의 payload shape:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, `telegramApiId`는 숫자 문자열이어야 합니다.
- `tdlibArchiveSha256` 및 `desktopTdataArchiveSha256`은 SHA-256 hex 문자열이어야 합니다.
- `kind: "telegram-user"`는 Mantis Telegram Desktop 증명 워크플로용으로 예약되어 있습니다. 일반 QA Lab 레인은 이를 획득해서는 안 됩니다.

Broker가 검증하는 다중 채널 payload:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 레인도 pool에서 lease할 수 있지만, Slack payload 검증은 현재 broker가 아니라 Slack QA runner에 있습니다. Slack row에는 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`을 사용하세요.

### QA에 채널 추가하기

새 채널 adapter의 아키텍처와 시나리오 helper 이름은 [QA 개요 → 채널 추가하기](/ko/concepts/qa-e2e-automation#adding-a-channel)에 있습니다. 최소 기준은 공유 `qa-lab` host seam에 transport runner를 구현하고, plugin manifest에 `qaRunners`를 선언하고, `openclaw qa <runner>`로 mount하고, `qa/scenarios/` 아래에 시나리오를 작성하는 것입니다.

## 테스트 suite(어디에서 무엇이 실행되는가)

suite를 "현실성이 증가하는" 순서(그리고 flakiness/비용도 증가하는 순서)로 생각하세요.

### Unit / integration(기본값)

- 명령: `pnpm test`
- Config: 대상이 지정되지 않은 실행은 `vitest.full-*.config.ts` shard set을 사용하며, 병렬 scheduling을 위해 multi-project shard를 project별 config로 확장할 수 있습니다.
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit inventory. UI unit 테스트는 전용 `unit-ui` shard에서 실행됩니다.
- 범위:
  - 순수 unit 테스트
  - in-process integration 테스트(gateway auth, routing, tooling, parsing, config)
  - 알려진 버그에 대한 결정적 회귀
- 기대 사항:
  - CI에서 실행됩니다.
  - 실제 key가 필요 없습니다.
  - 빠르고 안정적이어야 합니다.
  - Resolver 및 public-surface loader 테스트는 실제 bundled plugin source API가 아니라 생성된 작은 plugin fixture로 넓은 `api.js` 및 `runtime-api.js` fallback 동작을 증명해야 합니다. 실제 plugin API 로드는 plugin 소유 contract/integration suite에 속합니다.

네이티브 dependency 정책:

- 기본 테스트 설치는 선택적 네이티브 Discord opus build를 건너뜁니다. Discord voice는 bundled `libopus-wasm`을 사용하며, local 테스트와 Testbox 레인이 네이티브 addon을 컴파일하지 않도록 `@discordjs/opus`는 `allowBuilds`에서 비활성화된 상태로 유지됩니다.
- 네이티브 opus 성능은 기본 OpenClaw 설치/테스트 loop가 아니라 `libopus-wasm` benchmark repo에서 비교하세요. 기본 `allowBuilds`에서 `@discordjs/opus`를 `true`로 설정하지 마세요. 그러면 관련 없는 설치/테스트 loop가 네이티브 코드를 컴파일하게 됩니다.

<AccordionGroup>
  <Accordion title="프로젝트, shard, scoped lane">

    - 대상이 지정되지 않은 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 설정(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 걸린 머신에서 최대 RSS를 줄이고, auto-reply/extension 작업이 관련 없는 스위트를 굶주리게 하는 일을 피할 수 있습니다.
    - `pnpm test --watch`는 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다. 다중 샤드 watch 루프는 실용적이지 않기 때문입니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적인 파일/디렉터리 대상을 먼저 범위 지정된 lane으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
    - `pnpm test:changed`는 기본적으로 변경된 git 경로를 저렴한 범위 지정 lane으로 확장합니다. 직접 수정된 테스트, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import 그래프 종속 항목이 포함됩니다. config/setup/package 수정은 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 명시적으로 사용하지 않는 한 테스트를 광범위하게 실행하지 않습니다.
    - `pnpm check:changed`는 좁은 범위 작업을 위한 일반적인 스마트 로컬 검사 gate입니다. diff를 core, core 테스트, extensions, extension 테스트, apps, docs, release metadata, live Docker tooling, tooling으로 분류한 뒤, 일치하는 typecheck, lint, guard 명령을 실행합니다. Vitest 테스트는 실행하지 않습니다. 테스트 증거가 필요하면 `pnpm test:changed` 또는 명시적인 `pnpm test <target>`을 호출하세요. release metadata만 있는 버전 bump는 대상 버전/config/root-dependency 검사를 실행하며, 최상위 version 필드 밖의 package 변경을 거부하는 guard가 있습니다.
    - Live Docker ACP harness 수정은 집중 검사를 실행합니다. live Docker auth 스크립트의 shell syntax와 live Docker scheduler dry-run입니다. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로 제한될 때만 포함됩니다. dependency, export, version 및 기타 package 표면 수정은 여전히 더 넓은 guard를 사용합니다.
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk` 및 유사한 순수 utility 영역의 import가 가벼운 unit 테스트는 `unit-fast` lane을 통해 라우팅되며, 이 lane은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. stateful/runtime-heavy 파일은 기존 lane에 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 changed-mode 실행을 해당 가벼운 lane의 명시적 형제 테스트로 매핑하므로, helper 수정은 해당 디렉터리의 전체 heavy suite를 다시 실행하지 않습니다.
    - `auto-reply`에는 최상위 core helper, 최상위 `reply.*` integration 테스트, `src/auto-reply/reply/**` 하위 트리를 위한 전용 bucket이 있습니다. CI는 reply 하위 트리를 agent-runner, dispatch, commands/state-routing shard로 추가 분할하여 import가 무거운 한 bucket이 전체 Node tail을 독점하지 않게 합니다.
    - 일반 PR/main CI는 의도적으로 extension batch sweep과 release 전용 `agentic-plugins` shard를 건너뜁니다. Full Release Validation은 release candidate에서 이러한 plugin/extension-heavy suite를 위해 별도의 `Plugin Prerelease` child workflow를 dispatch합니다.

  </Accordion>

  <Accordion title="임베디드 러너 커버리지">

    - message-tool discovery 입력이나 compaction runtime
      context를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 routing 및 normalization
      boundary에는 집중 helper regression을 추가하세요.
    - 임베디드 러너 integration suite를 정상 상태로 유지하세요:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, 그리고
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - 이 suite들은 범위 지정된 id와 compaction 동작이 실제
      `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. helper 전용 테스트는
      이러한 integration 경로를 충분히 대체하지 못합니다.

  </Accordion>

  <Accordion title="Vitest pool 및 isolation 기본값">

    - 기본 Vitest config는 `threads`를 기본값으로 사용합니다.
    - 공유 Vitest config는 `isolate: false`를 고정하고,
      root projects, e2e, live config 전반에서 비격리 runner를 사용합니다.
    - root UI lane은 자체 `jsdom` setup과 optimizer를 유지하지만,
      공유 비격리 runner에서도 실행됩니다.
    - 각 `pnpm test` shard는 공유 Vitest config에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 큰 로컬 실행 중 V8 compile churn을 줄이기 위해
      기본적으로 Vitest child Node 프로세스에 `--no-maglev`를 추가합니다.
      stock V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
    - `scripts/run-vitest.mjs`는 stdout 또는 stderr 출력이 5분 동안 없으면
      명시적인 non-watch Vitest 실행을 종료합니다. 의도적으로 조용한 조사를 위해
      watchdog을 비활성화하려면 `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 architectural lane을 트리거하는지 보여줍니다.
    - pre-commit hook은 formatting 전용입니다. formatted 파일을 다시 stage하며
      lint, typecheck, test는 실행하지 않습니다.
    - handoff 또는 push 전에 스마트 로컬 검사 gate가 필요하면
      `pnpm check:changed`를 명시적으로 실행하세요.
    - `pnpm test:changed`는 기본적으로 저렴한 범위 지정 lane을 통해 라우팅합니다. agent가
      harness, config, package 또는 contract 수정에 더 넓은 Vitest 커버리지가 정말 필요하다고
      판단할 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.
    - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 routing 동작을 유지하되,
      worker cap만 더 높습니다.
    - 로컬 worker auto-scaling은 의도적으로 보수적이며 host load average가 이미 높으면
      물러나므로, 여러 Vitest 실행이 동시에 돌 때 기본적으로 피해를 줄입니다.
    - 기본 Vitest config는 projects/config 파일을 `forceRerunTriggers`로 표시하여
      test wiring이 변경될 때 changed-mode rerun이 올바르게 유지되게 합니다.
    - config는 지원되는 host에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성화된 상태로 유지합니다.
      direct profiling을 위해 명시적인 cache 위치 하나를 원하면
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration reporting과
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 profiling view를
      `origin/main` 이후 변경된 파일로 범위 지정합니다.
    - shard timing 데이터는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      whole-config 실행은 config 경로를 key로 사용합니다. include-pattern CI
      shard는 shard 이름을 덧붙여 filtered shard를 별도로 추적할 수 있게 합니다.
    - 하나의 hot test가 여전히 대부분의 시간을 startup import에 쓰는 경우,
      heavy dependency를 좁은 로컬 `*.runtime.ts` seam 뒤에 두고,
      runtime helper를 `vi.mock(...)`에 넘기기 위해 deep-import하지 말고 그 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 commit된 diff에 대해 routed
      `test:changed`와 네이티브 root-project 경로를 비교하고 wall time과 macOS max RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을
      `scripts/test-projects.mjs`와 root Vitest config를 통해 라우팅하여 현재
      dirty tree를 benchmark합니다.
    - `pnpm test:perf:profile:main`은 Vitest/Vite startup 및 transform overhead에 대한
      main-thread CPU profile을 작성합니다.
    - `pnpm test:perf:profile:runner`는 file parallelism을 비활성화한 상태로
      unit suite의 runner CPU+heap profile을 작성합니다.

  </Accordion>
</AccordionGroup>

### 안정성 (Gateway)

- 명령: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 기본적으로 diagnostics가 활성화된 실제 loopback Gateway를 시작합니다
  - diagnostic event 경로를 통해 synthetic gateway message, memory, large-payload churn을 구동합니다
  - Gateway WS RPC를 통해 `diagnostics.stability`를 query합니다
  - diagnostic stability bundle persistence helper를 다룹니다
  - recorder가 bounded 상태를 유지하고, synthetic RSS sample이 pressure budget 아래에 머물며, session별 queue depth가 다시 0으로 drain되는지 assert합니다
- 기대 사항:
  - CI에서 안전하며 키 없이 실행 가능
  - stability-regression 후속 작업을 위한 좁은 lane이며, 전체 Gateway suite를 대체하지 않습니다

### E2E (repo aggregate)

- 명령: `pnpm test:e2e`
- 범위:
  - gateway smoke E2E lane을 실행합니다
  - mocked Control UI browser E2E lane을 실행합니다
- 기대 사항:
  - CI에서 안전하며 키 없이 실행 가능
  - Playwright Chromium이 설치되어 있어야 합니다

### E2E (gateway smoke)

- 명령: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래 bundled-plugin E2E 테스트
- Runtime 기본값:
  - repo의 나머지와 맞춰 Vitest `threads`와 `isolate: false`를 사용합니다.
  - adaptive worker를 사용합니다(CI: 최대 2, local: 기본 1).
  - console I/O overhead를 줄이기 위해 기본적으로 silent mode로 실행합니다.
- 유용한 override:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`을 사용하세요(최대 16으로 제한).
  - verbose console 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`을 사용하세요.
- 범위:
  - multi-instance gateway end-to-end 동작
  - WebSocket/HTTP 표면, node pairing, 더 무거운 networking
- 기대 사항:
  - CI에서 실행됩니다(pipeline에서 활성화된 경우)
  - 실제 key가 필요하지 않습니다
  - unit test보다 moving part가 더 많습니다(더 느릴 수 있음)

### E2E (Control UI mocked browser)

- 명령: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- 파일: `ui/src/**/*.e2e.test.ts`
- 범위:
  - Vite Control UI를 시작합니다
  - Playwright를 통해 실제 Chromium page를 구동합니다
  - Gateway WebSocket을 deterministic in-browser mock으로 대체합니다
- 기대 사항:
  - `pnpm test:e2e`의 일부로 CI에서 실행됩니다
  - 실제 Gateway, agent 또는 provider key가 필요하지 않습니다
  - browser dependency가 있어야 합니다(`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - 활성 로컬 OpenShell gateway를 재사용합니다
  - 임시 로컬 Dockerfile에서 sandbox를 생성합니다
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell backend를 실행합니다
  - sandbox fs bridge를 통해 remote-canonical filesystem 동작을 검증합니다
- 기대 사항:
  - opt-in 전용이며 기본 `pnpm test:e2e` 실행의 일부가 아닙니다
  - 로컬 `openshell` CLI와 동작하는 Docker daemon이 필요합니다
  - 활성 로컬 OpenShell gateway와 그 config source가 필요합니다
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤 test sandbox를 제거합니다
- 유용한 override:
  - 더 넓은 e2e suite를 수동으로 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`을 사용하세요
  - 기본값이 아닌 CLI binary 또는 wrapper script를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`을 사용하세요
  - 등록된 gateway config를 격리된 test에 노출하려면 `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`를 사용하세요
  - host policy fixture에서 사용하는 Docker gateway IP를 override하려면 `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`을 사용하세요

### Live (실제 제공자 + 실제 모델)

- 명령: `pnpm test:live`
- 설정: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin 라이브 테스트
- 기본값: `pnpm test:live`로 **활성화됨** (`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - "이 공급자/모델이 실제 인증 정보로 _오늘_ 정말 동작하는가?"
  - 공급자 형식 변경, 도구 호출 특이점, 인증 문제, 속도 제한 동작 포착
- 기대 사항:
  - 의도적으로 CI에서 안정적이지 않음(실제 네트워크, 실제 공급자 정책, 할당량, 장애)
  - 비용이 발생함 / 속도 제한을 사용함
  - "전체" 대신 좁힌 하위 집합 실행 선호
- 라이브 실행은 이미 내보낸 API 키와 스테이징된 인증 프로필을 사용합니다.
- 기본적으로 라이브 실행은 여전히 `HOME`을 격리하고 설정/인증 자료를 임시 테스트 홈으로 복사하므로 단위 테스트 픽스처가 실제 `~/.openclaw`를 변경할 수 없습니다.
- 라이브 테스트가 실제 홈 디렉터리를 사용해야 한다는 의도가 있을 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 기본적으로 더 조용한 모드입니다. `[live] ...` 진행 출력은 유지하고 Gateway 부트스트랩 로그/Bonjour 잡음은 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(공급자별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나, `OPENCLAW_LIVE_*_KEY`로 라이브별 재정의를 설정하세요. 테스트는 속도 제한 응답에서 재시도합니다.
- 진행/Heartbeat 출력:
  - 이제 라이브 스위트는 stderr로 진행 줄을 내보내므로 Vitest 콘솔 캡처가 조용한 경우에도 긴 공급자 호출이 눈에 띄게 활성 상태임을 볼 수 있습니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 라이브 실행 중 공급자/Gateway 진행 줄이 즉시 스트리밍됩니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - Gateway/프로브 Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 스위트를 실행해야 하나요?

이 결정 표를 사용하세요.

- 로직/테스트 편집: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도 실행)
- Gateway 네트워킹 / WS 프로토콜 / 페어링을 건드림: `pnpm test:e2e` 추가
- "내 봇이 다운됨" / 공급자별 실패 / 도구 호출 디버깅: 좁힌 `pnpm test:live` 실행

## 라이브(네트워크 사용) 테스트

라이브 모델 매트릭스, CLI 백엔드 스모크, ACP 스모크, Codex 앱 서버
하네스, 모든 미디어 공급자 라이브 테스트(Deepgram, BytePlus, ComfyUI, 이미지,
음악, 비디오, 미디어 하네스), 그리고 라이브 실행을 위한 인증 정보 처리는
[라이브 스위트 테스트](/ko/help/testing-live)를 참조하세요. 전용 업데이트 및
Plugin 검증 체크리스트는
[업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

## Docker 러너(선택적 "Linux에서 동작" 확인)

이 Docker 러너는 두 버킷으로 나뉩니다.

- 라이브 모델 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 로컬 설정 디렉터리, 워크스페이스, 선택적 프로필 env 파일을 마운트하고, repo Docker 이미지 내부에서 일치하는 프로필 키 라이브 파일(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`)만 실행합니다. 일치하는 로컬 진입점은 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker 라이브 러너는 필요한 곳에서 자체 실용 한도를 유지합니다.
  `test:docker:live-models`는 선별된 지원 고신호 세트를 기본값으로 사용하고,
  `test:docker:live-gateway`는 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`을 기본값으로 사용합니다. 더 작은 한도나 더 큰 스캔을 명시적으로 원할 때는 `OPENCLAW_LIVE_MAX_MODELS`
  또는 Gateway env 변수를 설정하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 라이브 Docker 이미지를 한 번 빌드하고, `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 npm tarball로 한 번 패키징한 다음, 두 개의 `scripts/e2e/Dockerfile` 이미지를 빌드/재사용합니다. 기본 이미지는 install/update/plugin-dependency 레인을 위한 Node/Git 러너일 뿐이며, 해당 레인은 미리 빌드된 tarball을 마운트합니다. 기능 이미지는 빌드된 앱 기능 레인을 위해 같은 tarball을 `/app`에 설치합니다. Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`가 선택된 계획을 실행합니다. 집계는 가중 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`은 프로세스 슬롯을 제어하고, 리소스 한도는 무거운 라이브, npm-install, 다중 서비스 레인이 모두 한 번에 시작되지 않도록 합니다. 단일 레인이 활성 한도보다 무거운 경우에도 풀(pool)이 비어 있으면 스케줄러가 해당 레인을 시작할 수 있으며, 이후 용량을 다시 사용할 수 있을 때까지 해당 레인만 계속 실행합니다. 기본값은 슬롯 10개, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 여유가 더 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 조정하세요. 러너는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하고, 30초마다 상태를 출력하고, 성공한 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장하며, 이후 실행에서 더 긴 레인을 먼저 시작하는 데 해당 타이밍을 사용합니다. Docker를 빌드하거나 실행하지 않고 가중 레인 매니페스트를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 선택된 레인의 CI 계획, 패키지/이미지 요구 사항, 인증 정보를 출력하려면 `node scripts/test-docker-all.mjs --plan-json`를 사용하세요.
- `Package Acceptance`는 "이 설치 가능한 tarball이 제품으로 동작하는가?"를 확인하는 GitHub 네이티브 패키지 게이트입니다. `source=npm`, `source=ref`, `source=url`, 또는 `source=artifact`에서 후보 패키지 하나를 해석하고, 이를 `package-under-test`로 업로드한 다음, 선택된 ref를 다시 패키징하는 대신 정확히 그 tarball을 대상으로 재사용 가능한 Docker E2E 레인을 실행합니다. 프로필은 범위가 좁은 것부터 넓은 순서로 정렬됩니다: `smoke`, `package`, `product`, `full`. 패키지/update/Plugin 계약, 게시된 업그레이드 생존자 매트릭스, 릴리스 기본값, 실패 분류는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.
- 빌드 및 릴리스 검사는 tsdown 이후 `scripts/check-cli-bootstrap-imports.mjs`를 실행합니다. 이 가드는 `dist/entry.js`와 `dist/cli/run-main.js`에서 정적 빌드 그래프를 순회하며, 명령 디스패치 전에 사전 디스패치 시작 import가 Commander, 프롬프트 UI, undici, 로깅 같은 패키지 의존성을 가져오면 실패합니다. 또한 번들된 Gateway 실행 청크를 예산 이하로 유지하고 알려진 콜드 Gateway 경로의 정적 import를 거부합니다. 패키징된 CLI 스모크는 루트 도움말, onboard 도움말, doctor 도움말, status, config schema, model-list 명령도 다룹니다.
- Package Acceptance 레거시 호환성은 `2026.4.25`(`2026.4.25-beta.*` 포함)로 제한됩니다. 그 기준까지 하네스는 shipped-package 메타데이터 공백만 허용합니다: 생략된 비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`, tarball에서 파생된 git 픽스처의 누락된 패치 파일, 누락된 persisted `update.channel`, 레거시 Plugin 설치 레코드 위치, 누락된 marketplace 설치 레코드 지속성, 그리고 `plugins update` 중 설정 메타데이터 마이그레이션. `2026.4.25` 이후 패키지에서는 해당 경로가 엄격한 실패입니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, 그리고 `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 상위 수준 통합 경로를 검증합니다.
- `scripts/lib/openclaw-e2e-instance.sh`를 통해 패키징된 OpenClaw tarball을 설치하는 Docker/Bash E2E 레인은 `npm install`을 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`(기본값 `600s`; 디버깅을 위해 래퍼를 비활성화하려면 `0` 설정)으로 제한합니다.

라이브 모델 Docker 러너는 필요한 CLI 인증 홈만(또는 실행이 좁혀지지 않은 경우 지원되는 모든 인증 홈) bind-mount한 다음, 실행 전에 이를 컨테이너 홈으로 복사하여 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 갱신할 수 있게 합니다.

- 직접 모델: `pnpm test:docker:live-models`(스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind`(스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 다루며, `pnpm test:docker:live-acp-bind:droid` 및 `pnpm test:docker:live-acp-bind:opencode`를 통해 엄격한 Droid/OpenCode 커버리지 제공)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend`(스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex 앱 서버 하네스 스모크: `pnpm test:docker:live-codex-harness`(스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 개발 에이전트: `pnpm test:docker:live-gateway`(스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 관측성 스모크: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, 그리고 `pnpm qa:observability:smoke`는 비공개 QA 소스 체크아웃 레인입니다. npm tarball이 QA Lab을 생략하므로 의도적으로 패키지 Docker 릴리스 레인에 포함되지 않습니다.
- Open WebUI 라이브 스모크: `pnpm test:docker:openwebui`(스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard`(스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm tarball 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩과 기본 Telegram을 통해 OpenAI를 설정하고, doctor를 실행한 다음, 모의 OpenAI 에이전트 턴 하나를 실행합니다. 미리 빌드된 tarball은 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 재사용하고, 호스트 재빌드는 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`으로 건너뛰거나, 채널은 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 또는 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`으로 전환하세요.

- 릴리스 사용자 여정 스모크: `pnpm test:docker:release-user-journey`는 패킹된 OpenClaw tarball을 깨끗한 Docker 홈에 전역으로 설치하고, 온보딩을 실행하며, 모의 OpenAI provider를 구성하고, agent turn을 실행하며, 외부 plugin을 설치/제거하고, local fixture에 대해 ClickClack을 구성하며, outbound/inbound 메시징을 검증하고, Gateway를 재시작한 뒤 doctor를 실행합니다.
- 릴리스 typed 온보딩 스모크: `pnpm test:docker:release-typed-onboarding`은 패킹된 tarball을 설치하고, 실제 TTY를 통해 `openclaw onboard`를 구동하며, OpenAI를 env-ref provider로 구성하고, raw key가 영구 저장되지 않는지 검증한 뒤 모의 agent turn을 실행합니다.
- 릴리스 media/memory 스모크: `pnpm test:docker:release-media-memory`는 패킹된 tarball을 설치하고, PNG 첨부 파일의 이미지 이해, OpenAI 호환 이미지 생성 출력, memory 검색 recall, Gateway 재시작 후 recall 유지 여부를 검증합니다.
- 릴리스 업그레이드 사용자 여정 스모크: `pnpm test:docker:release-upgrade-user-journey`는 기본적으로 candidate tarball보다 오래된 최신 게시 baseline을 설치하고, 게시된 패키지에서 provider/plugin/ClickClack 상태를 구성하며, candidate tarball로 업그레이드한 다음 core agent/plugin/channel 여정을 다시 실행합니다. 더 오래된 게시 baseline이 없으면 candidate 버전을 재사용합니다. `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`로 baseline을 재정의합니다.
- 릴리스 plugin marketplace 스모크: `pnpm test:docker:release-plugin-marketplace`는 local fixture marketplace에서 설치하고, 설치된 plugin을 업데이트하고, 제거한 뒤 install metadata가 정리되면서 plugin CLI가 사라지는지 검증합니다.
- Skill 설치 스모크: `pnpm test:docker:skill-install`은 패킹된 OpenClaw tarball을 Docker에 전역으로 설치하고, config에서 업로드된 archive 설치를 비활성화하며, 검색에서 현재 live ClawHub skill slug를 확인하고, `openclaw skills install`로 설치한 뒤 설치된 skill과 `.clawhub` origin/lock metadata를 검증합니다.
- 업데이트 channel 전환 스모크: `pnpm test:docker:update-channel-switch`는 패킹된 OpenClaw tarball을 Docker에 전역으로 설치하고, package `stable`에서 git `dev`로 전환하며, 영구 저장된 channel과 plugin post-update 작업을 검증한 다음 package `stable`로 다시 전환하고 update status를 확인합니다.
- 업그레이드 survivor 스모크: `pnpm test:docker:upgrade-survivor`는 agent, channel config, plugin allowlist, 오래된 plugin dependency state, 기존 workspace/session 파일이 있는 지저분한 old-user fixture 위에 패킹된 OpenClaw tarball을 설치합니다. live provider나 channel key 없이 package update와 non-interactive doctor를 실행한 다음 loopback Gateway를 시작하고 config/state 보존과 startup/status budget을 확인합니다.
- 게시된 업그레이드 survivor 스모크: `pnpm test:docker:published-upgrade-survivor`는 기본적으로 `openclaw@latest`를 설치하고, 현실적인 existing-user 파일을 seed하며, baked command recipe로 해당 baseline을 구성하고, 결과 config를 검증하며, 게시된 설치를 candidate tarball로 업데이트하고, non-interactive doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 쓴 다음 loopback Gateway를 시작하고 configured intent, state 보존, startup, `/healthz`, `/readyz`, RPC status budget을 확인합니다. 하나의 baseline은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`로 재정의하고, aggregate scheduler에는 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` 같은 정확한 local baseline을 확장하도록 요청하며, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`로 `reported-issues` 같은 issue-shaped fixture를 확장합니다. reported-issues 세트에는 자동 외부 OpenClaw plugin install repair를 위한 `configured-plugin-installs`가 포함됩니다. Package Acceptance는 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출하고, `last-stable-4` 또는 `all-since-2026.4.23` 같은 meta baseline token을 해석하며, Full Release Validation은 release-soak package gate를 `last-stable-4 2026.4.23 2026.5.2 2026.4.15`와 `reported-issues`로 확장합니다.
- Session runtime context 스모크: `pnpm test:docker:session-runtime-context`는 hidden runtime context transcript 영구 저장과 영향을 받은 중복 prompt-rewrite branch의 doctor repair를 검증합니다.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 tree를 패킹하고, 격리된 홈에서 `bun install -g`로 설치한 뒤 `openclaw infer image providers --json`이 멈추지 않고 bundled image provider를 반환하는지 검증합니다. `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 미리 빌드된 tarball을 재사용하고, `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`으로 host build를 건너뛰거나, `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`로 빌드된 Docker image에서 `dist/`를 복사합니다.
- Installer Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 root, update, direct-npm container 전체에서 하나의 npm cache를 공유합니다. update smoke는 candidate tarball로 업그레이드하기 전 stable baseline으로 npm `latest`를 기본 사용합니다. 로컬에서는 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`로, GitHub에서는 Install Smoke workflow의 `update_baseline_version` input으로 재정의합니다. non-root installer check는 root-owned cache entry가 user-local install behavior를 가리지 않도록 격리된 npm cache를 유지합니다. 로컬 재실행에서 root/update/direct-npm cache를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정합니다.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` coverage가 필요하면 해당 env 없이 로컬에서 script를 실행합니다.
- Agents delete shared workspace CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace`(script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 root Dockerfile image를 빌드하고, 격리된 container home에 하나의 workspace가 있는 두 agent를 seed하며, `agents delete --json`을 실행하고, 유효한 JSON과 workspace 유지 동작을 검증합니다. install-smoke image를 재사용하려면 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`을 사용합니다.
- Gateway 네트워킹(두 container, WS auth + health): `pnpm test:docker:gateway-network`(script: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot 스모크: `pnpm test:docker:browser-cdp-snapshot`(script: `scripts/e2e/browser-cdp-snapshot-docker.sh`)는 source E2E image와 Chromium layer를 빌드하고, raw CDP로 Chromium을 시작하며, `browser doctor --deep`을 실행하고, CDP role snapshot이 link URL, cursor-promoted clickable, iframe ref, frame metadata를 포괄하는지 검증합니다.
- OpenAI Responses web_search minimal reasoning 회귀: `pnpm test:docker:openai-web-search-minimal`(script: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 모의 OpenAI server를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음 provider schema reject를 강제로 발생시키고 raw detail이 Gateway log에 나타나는지 확인합니다.
- MCP channel bridge(seed된 Gateway + stdio bridge + raw Claude notification-frame 스모크): `pnpm test:docker:mcp-channels`(script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP tools(실제 stdio MCP server + embedded OpenClaw profile allow/deny 스모크): `pnpm test:docker:agent-bundle-mcp-tools`(script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup(실제 Gateway + isolated cron 및 one-shot subagent 실행 후 stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup`(script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(local path, `file:`, hoisted dependency가 있는 npm registry, 잘못된 npm package metadata, git moving ref, ClawHub kitchen-sink, marketplace update, Claude-bundle enable/inspect에 대한 install/update 스모크): `pnpm test:docker:plugins`(script: `scripts/e2e/plugins-docker.sh`)
  ClawHub block을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하고, 기본 kitchen-sink package/runtime 쌍을 재정의하려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC`와 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`를 사용합니다. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`이 없으면 test는 hermetic local ClawHub fixture server를 사용합니다.
- Plugin update unchanged 스모크: `pnpm test:docker:plugin-update`(script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix 스모크: `pnpm test:docker:plugin-lifecycle-matrix`는 bare container에 패킹된 OpenClaw tarball을 설치하고, npm plugin을 설치하며, enable/disable을 토글하고, local npm registry를 통해 업그레이드 및 다운그레이드하며, 설치된 code를 삭제한 다음 lifecycle phase별 RSS/CPU metric을 기록하면서 uninstall이 여전히 stale state를 제거하는지 검증합니다.
- Config reload metadata 스모크: `pnpm test:docker:config-reload`(script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`는 local path, `file:`, hoisted dependency가 있는 npm registry, git moving ref, ClawHub fixture, marketplace update, Claude-bundle enable/inspect에 대한 install/update 스모크를 다룹니다. `pnpm test:docker:plugin-update`는 설치된 plugin의 unchanged update behavior를 다룹니다. `pnpm test:docker:plugin-lifecycle-matrix`는 resource-tracked npm plugin install, enable, disable, upgrade, downgrade, missing-code uninstall을 다룹니다.

공유 functional image를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 suite-specific image override는 설정된 경우 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 remote shared image를 가리키면, script는 해당 image가 로컬에 없을 경우 pull합니다. QR 및 installer Docker test는 shared built-app runtime이 아니라 package/install behavior를 검증하므로 자체 Dockerfile을 유지합니다.

라이브 모델 Docker 실행기는 현재 체크아웃도 읽기 전용으로 bind mount하고
컨테이너 내부의 임시 workdir에 스테이징합니다. 이렇게 하면 런타임
이미지를 작게 유지하면서도 정확히 로컬 소스/구성에 대해 Vitest를 실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` 같은
대형 로컬 전용 캐시와 앱 로컬 `.build` 또는 Gradle 출력 디렉터리 같은 앱 빌드 출력을 건너뛰어
Docker 라이브 실행이 머신별 아티팩트를 복사하느라 몇 분씩 쓰지 않게 합니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 Gateway 라이브 프로브가
컨테이너 내부에서 실제 Telegram/Discord 등 채널 워커를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로, 해당 Docker 레인에서
Gateway 라이브 커버리지를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. OpenAI 호환 HTTP 엔드포인트가 활성화된
OpenClaw Gateway 컨테이너를 시작하고, 해당 Gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작한 뒤,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 확인한 다음,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
라이브 모델 완료를 기다리지 않고 Open WebUI 로그인과 모델 검색 후 중단해야 하는
릴리스 경로 CI 검사에는 `OPENWEBUI_SMOKE_MODE=models`를 설정하세요.
첫 실행은 Docker가 Open WebUI 이미지를 가져와야 할 수 있고 Open WebUI가 자체 콜드 스타트 설정을
마쳐야 할 수 있으므로 눈에 띄게 느릴 수 있습니다.
이 레인은 사용 가능한 라이브 모델 키를 기대합니다. 프로세스 환경,
스테이징된 인증 프로필, 또는 명시적인 `OPENCLAW_PROFILE_FILE`을 통해 제공하세요.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON 페이로드를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제
Telegram, Discord, iMessage 계정이 필요하지 않습니다. 시드된 Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 생성하는 두 번째 컨테이너를 시작한 다음,
라우팅된 대화 검색, 트랜스크립트 읽기, 첨부 파일 메타데이터,
라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅, 그리고 실제 stdio MCP 브리지를 통한 Claude 스타일 채널 +
권한 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을 직접 검사하므로,
스모크는 특정 클라이언트 SDK가 우연히 노출하는 것만이 아니라
브리지가 실제로 내보내는 내용을 검증합니다.
`test:docker:agent-bundle-mcp-tools`는 결정적이며 라이브
모델 키가 필요하지 않습니다. repo Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP 프로브 서버를 시작하고,
내장된 OpenClaw bundle MCP 런타임을 통해 해당 서버를 구체화하고,
도구를 실행한 다음, `coding`과 `messaging`은
`bundle-mcp` 도구를 유지하는 반면 `minimal`과 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 검증합니다.
`test:docker:cron-mcp-cleanup`은 결정적이며 라이브 모델
키가 필요하지 않습니다. 실제 stdio MCP 프로브 서버가 있는 시드된 Gateway를 시작하고,
격리된 Cron 턴과 `sessions_spawn` 일회성 자식 턴을 실행한 다음,
각 실행 후 MCP 자식 프로세스가 종료되는지 검증합니다.

수동 ACP 일반 언어 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로를 위해 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 환경 변수:

- `OPENCLAW_CONFIG_DIR=...` (기본값: `~/.openclaw`) `/home/node/.openclaw`에 마운트됨
- `OPENCLAW_WORKSPACE_DIR=...` (기본값: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace`에 마운트됨
- `OPENCLAW_PROFILE_FILE=...` 마운트되고 테스트 실행 전에 소싱됨
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 임시 구성/작업공간 디렉터리를 사용하고 외부 CLI 인증 마운트 없이 `OPENCLAW_PROFILE_FILE`에서 소싱된 환경 변수만 검증
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (기본값: `~/.cache/openclaw/docker-cli-tools`) Docker 내부의 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트됨
- `$HOME` 아래의 외부 CLI 인증 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음, 테스트 시작 전에 `/home/node/...`로 복사됨
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 좁혀진 제공자 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 디렉터리/파일만 마운트함
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록으로 수동 재정의
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 실행 범위 좁히기
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 컨테이너 내부 제공자 필터링
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 다시 빌드할 필요가 없는 재실행에서 기존 `openclaw:local-live` 이미지 재사용
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 자격 증명이 환경이 아니라 프로필 저장소에서 오도록 보장
- `OPENCLAW_OPENWEBUI_MODEL=...` Open WebUI 스모크를 위해 Gateway가 노출하는 모델 선택
- `OPENCLAW_OPENWEBUI_PROMPT=...` Open WebUI 스모크가 사용하는 nonce 검사 프롬프트 재정의
- `OPENWEBUI_IMAGE=...` 고정된 Open WebUI 이미지 태그 재정의

## 문서 sanity

문서 편집 후 문서 검사를 실행하세요: `pnpm check:docs`.
페이지 내 제목 검사까지 필요할 때는 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

다음은 실제 제공자 없는 "실제 파이프라인" 회귀입니다.

- Gateway 도구 호출(mock OpenAI, 실제 Gateway + 에이전트 루프): `src/gateway/gateway.test.ts` (케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, 구성 작성 + 인증 강제): `src/gateway/gateway.test.ts` (케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

이미 "에이전트 신뢰성 평가"처럼 동작하는 몇 가지 CI 안전 테스트가 있습니다.

- 실제 Gateway + 에이전트 루프를 통한 mock 도구 호출(`src/gateway/gateway.test.ts`).
- 세션 배선과 구성 효과를 검증하는 엔드투엔드 마법사 흐름(`src/gateway/gateway.test.ts`).

Skills에 아직 부족한 것([Skills](/ko/tools/skills) 참고):

- **의사결정:** 프롬프트에 Skills가 나열될 때 에이전트가 올바른 skill을 선택하는가(또는 관련 없는 것을 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필수 단계/인자를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 기록 이월, 샌드박스 경계를 단언하는 다중 턴 시나리오.

향후 평가는 먼저 결정적으로 유지해야 합니다.

- 도구 호출 + 순서, skill 파일 읽기, 세션 배선을 단언하기 위해 mock 제공자를 사용하는 시나리오 러너.
- skill 중심 시나리오의 작은 모음(사용 대 회피, 게이팅, 프롬프트 주입).
- CI 안전 모음이 준비된 후에만 선택적 라이브 평가(옵트인, 환경 변수 게이트).

## 계약 테스트(Plugin 및 채널 형태)

계약 테스트는 등록된 모든 Plugin과 채널이 해당
인터페이스 계약을 준수하는지 검증합니다. 발견된 모든 Plugin을 순회하며
형태 및 동작 단언 모음을 실행합니다. 기본 `pnpm test` 단위 레인은 의도적으로
이 공유 경계 및 스모크 파일을 건너뜁니다. 공유 채널 또는 제공자 표면을 수정할 때는
계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- 제공자 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 위치:

- **plugin** - 기본 Plugin 형태(id, 이름, 기능)
- **setup** - 설정 마법사 계약
- **session-binding** - 세션 바인딩 동작
- **outbound-payload** - 메시지 페이로드 구조
- **inbound** - 인바운드 메시지 처리
- **actions** - 채널 액션 핸들러
- **threading** - 스레드 ID 처리
- **directory** - 디렉터리/명단 API
- **group-policy** - 그룹 정책 적용

### 제공자 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **status** - 채널 상태 프로브
- **registry** - Plugin 레지스트리 형태

### 제공자 계약

`src/plugins/contracts/*.contract.test.ts`에 위치:

- **auth** - 인증 흐름 계약
- **auth-choice** - 인증 선택/선정
- **catalog** - 모델 카탈로그 API
- **discovery** - Plugin 검색
- **loader** - Plugin 로딩
- **runtime** - 제공자 런타임
- **shape** - Plugin 형태/인터페이스
- **wizard** - 설정 마법사

### 실행 시점

- plugin-sdk 내보내기 또는 하위 경로를 변경한 후
- 채널 또는 제공자 Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 검색을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가(지침)

라이브에서 발견한 제공자/모델 문제를 수정할 때:

- 가능하면 CI 안전 회귀를 추가하세요(mock/stub 제공자, 또는 정확한 요청 형태 변환 캡처)
- 본질적으로 라이브 전용인 경우(속도 제한, 인증 정책), 라이브 테스트를 좁게 유지하고 환경 변수를 통해 옵트인하도록 하세요
- 버그를 잡는 가장 작은 계층을 대상으로 삼는 것을 선호하세요:
  - 제공자 요청 변환/재생 버그 → 직접 모델 테스트
  - Gateway 세션/기록/도구 파이프라인 버그 → Gateway 라이브 스모크 또는 CI 안전 Gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별 샘플 대상 하나를 도출한 다음, 순회 세그먼트 exec id가 거부되는지 단언합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 패밀리를 추가하는 경우, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 새 클래스를 조용히 건너뛸 수 없도록 테스트는 분류되지 않은 대상 id에서 의도적으로 실패합니다.

## 관련

- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)
- [CI](/ko/ci)
