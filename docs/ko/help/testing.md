---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/제공자 버그에 대한 회귀 테스트 추가
    - Gateway 및 에이전트 동작 디버깅
summary: '테스트 도구 모음: 단위/e2e/라이브 테스트 스위트, Docker 실행기 및 각 테스트의 검증 범위'
title: 테스트
x-i18n:
    generated_at: "2026-07-12T00:49:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw에는 세 가지 Vitest 제품군(단위/통합, e2e, 라이브)과 Docker
러너가 있습니다. 이 페이지에서는 각 제품군의 검사 범위, 워크플로별 실행 명령,
라이브 테스트가 자격 증명을 검색하는 방식, 실제 공급자/모델 버그에 대한
회귀 테스트를 추가하는 방법을 설명합니다.

<Note>
**QA 스택(qa-lab, qa-channel, 라이브 전송 레인)**은 별도로 문서화되어 있습니다.

- [QA 개요](/ko/concepts/qa-e2e-automation) - 아키텍처, 명령 인터페이스, 시나리오 작성.
- [매트릭스 QA](/ko/concepts/qa-matrix) - `pnpm openclaw qa matrix` 참조 문서.
- [성숙도 점수표](/ko/maturity/scorecard) - 릴리스 QA 증거가 안정성과 LTS 결정을 뒷받침하는 방식.
- [QA 채널](/ko/channels/qa-channel) - 저장소 기반 시나리오에서 사용하는 합성 전송 Plugin.

이 페이지에서는 일반 테스트 제품군과 Docker/Parallels 러너를 다룹니다. 아래의 [QA 전용 러너](#qa-specific-runners)에는 구체적인 `qa` 호출과 위 참조 문서로 돌아가는 링크가 나와 있습니다.
</Note>

## 빠른 시작

일반적인 작업 시:

- 전체 게이트(푸시 전에 실행 권장): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠르게 전체 제품군을 로컬 실행: `pnpm test:max`
- 직접 Vitest 감시 루프 실행: `pnpm test:watch`
- 파일을 직접 지정하면 Plugin/채널 경로도 라우팅됩니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 수정할 때는 먼저 대상 범위를 좁혀 실행하는 것이 좋습니다.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 신뢰도를 더 높이고 싶을 때:

- 참고용 V8 커버리지 보고서: `pnpm test:coverage`
- E2E 제품군: `pnpm test:e2e`

## 테스트 임시 디렉터리

테스트가 소유하는 임시 디렉터리에는 `test/helpers/temp-dir.ts`의 공유
도우미를 사용하여 소유권을 명확히 하고 정리 작업이 테스트 수명 주기 안에서
이루어지도록 하세요.

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)`는 의도적으로 수동 정리 메서드를
노출하지 않습니다. 각 테스트 이후의 정리는 Vitest가 담당합니다. 아직
마이그레이션되지 않은 테스트를 위해 이전의 하위 수준 도우미
(`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`)도 남아 있지만,
새 코드에서는 사용하지 마세요. 또한 테스트에서 원시 임시 디렉터리 동작을
명시적으로 검증하는 경우가 아니라면 새로운 `fs.mkdtemp*` 호출도 피하세요.
원시 임시 디렉터리가 실제로 필요하다면 이유와 함께 감사 가능한 허용 주석을
추가하세요.

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs`는 기존 정리 방식을 차단하지
않으면서 추가된 diff 줄에서 새 원시 임시 디렉터리 생성과 공유 도우미의 새
수동 사용을 보고합니다. 이 스크립트는 `scripts/changed-lanes.mjs`와 동일한
테스트 경로 분류를 따르며 공유 도우미 구현 자체는 건너뜁니다. `check:changed`는
변경된 테스트 경로에 대해 이 보고서를 경고 전용 CI 신호로 실행합니다
(GitHub 경고 주석이며 실패로 처리하지 않음).

## 라이브 및 Docker/Parallels 워크플로

실제 공급자/모델을 디버깅할 때(실제 자격 증명 필요):

- 라이브 제품군(모델 + Gateway 도구/이미지 프로브): `pnpm test:live`
- 특정 라이브 파일 하나를 조용히 실행: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 런타임 성능 보고서: 실제 `openai/gpt-5.6-luna` 에이전트 턴에는
  `live_openai_candidate=true`로 `OpenClaw Performance`를 디스패치하고,
  Kova CPU/힙/트레이스 아티팩트에는 `deep_profile=true`를 사용합니다. 매일
  예약 실행은 별도의 아티팩트 소비 게시자 작업을 통해 모의 공급자,
  심층 프로파일, GPT-5.6 Luna 레인 보고서를 `openclaw/clawgrit-reports`에
  게시합니다. 게시자 인증이 없거나 유효하지 않으면 예약 실행과
  `profile=release` 실행이 실패합니다. 릴리스가 아닌 수동 디스패치는 GitHub
  아티팩트를 유지하며 보고서 게시를 참고 사항으로 취급합니다. 모의 공급자
  보고서에는 소스 수준 Gateway 부팅, 메모리, Plugin 부하, 반복되는 가짜 모델
  인사 루프, CLI 시작 수치도 포함됩니다.
- Docker 라이브 모델 일괄 검사: `pnpm test:docker:live-models`
  - 선택한 각 모델은 텍스트 턴과 작은 파일 읽기 형태의 프로브를 실행합니다.
    메타데이터에 `image` 입력이 명시된 모델은 작은 이미지 턴도 실행합니다.
    공급자 실패를 분리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 프로브를 비활성화하세요.
  - CI 커버리지: 매일 실행되는 `OpenClaw Scheduled Live And E2E Checks`와
    수동 `OpenClaw Release Checks`는 모두 `include_live_suites: true`로
    재사용 가능한 라이브/E2E 워크플로를 호출합니다. 여기에는 공급자별로
    샤딩된 Docker 라이브 모델 매트릭스 작업이 포함됩니다.
  - 범위를 좁힌 CI 재실행에는 `include_live_suites: true`와
    `live_models_only: true`로 `OpenClaw Live And E2E Checks (Reusable)`을
    디스패치하세요.
  - 신호 가치가 높은 새 공급자 보안 비밀은 `scripts/ci-hydrate-live-auth.sh`,
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`, 그리고
    이를 호출하는 예약/릴리스 워크플로에 추가하세요.
- 네이티브 Codex 바인딩 채팅 스모크 테스트: `pnpm test:docker:live-codex-bind`
  - Codex app-server 경로를 대상으로 Docker 라이브 레인을 실행하고,
    `/codex bind`로 합성 Slack DM을 바인딩하며, `/codex fast`와
    `/codex permissions`를 실행한 다음 일반 답변과 이미지 첨부 파일이
    ACP 대신 네이티브 Plugin 바인딩을 통해 라우팅되는지 확인합니다.
- Codex app-server 하네스 스모크 테스트: `pnpm test:docker:live-codex-harness`
  - Plugin이 소유하는 Codex app-server 하네스를 통해 Gateway 에이전트 턴을
    실행하고 `/codex status`와 `/codex models`를 확인하며, 기본적으로
    이미지, Cron MCP, 하위 에이전트, Guardian 프로브를 실행합니다. 다른
    실패를 분리할 때는 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`으로
    하위 에이전트 프로브를 비활성화하세요. 하위 에이전트만 집중적으로
    검사하려면 다른 프로브를 비활성화하세요:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`을 설정하지 않으면 하위
    에이전트 프로브 이후 종료됩니다.
- Codex 주문형 설치 스모크 테스트: `pnpm test:docker:codex-on-demand`
  - 패키징된 OpenClaw tarball을 Docker에 설치하고 OpenAI API 키 온보딩을
    실행한 다음, Codex Plugin과 `@openai/codex` 종속성이 관리형 npm 프로젝트
    루트에 주문형으로 다운로드되었는지 확인합니다.
- 라이브 Plugin 도구 종속성 스모크 테스트: `pnpm test:docker:live-plugin-tool`
  - 실제 `slugify` 종속성이 있는 픽스처 Plugin을 패키징하고 `npm-pack:`을
    통해 설치하며, 관리형 npm 프로젝트 루트 아래의 종속성을 확인한 다음,
    라이브 OpenAI 모델에 Plugin 도구를 호출하여 숨겨진 슬러그를 반환하도록
    요청합니다.
- Crestodian 복구 명령 스모크 테스트: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 복구 명령 인터페이스를 위한 선택적 이중 안전 검사입니다.
    `/crestodian status`를 실행하고, 영구 모델 변경을 대기열에 추가하고,
    `/crestodian yes`로 응답한 다음, 감사/구성 쓰기 경로를 확인합니다.
- Crestodian 최초 실행 Docker 스모크 테스트: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw 상태 디렉터리에서 시작하여 먼저 패키징된
    `openclaw crestodian` CLI가 추론 없이 안전하게 실패하는지 증명합니다.
    그런 다음 패키징된 활성화 모듈을 통해 가짜 Claude를 테스트하고
    활성화합니다. 그 이후에만 모호한 패키징 CLI 요청이 플래너에 도달하여
    형식화된 설정으로 해석되며, 이어서 일회성 모델, 에이전트, Discord Plugin,
    SecretRef 작업을 수행합니다. 구성과 감사 항목도 검증합니다. 이는 보조적인
    게이트/작업 증거이며, 대화형 온보딩이나 Crestodian 에이전트/도구/승인
    증거가 아닙니다. 동일한 레인은 QA Lab에서
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`으로도
    제공됩니다.
- Moonshot/Kimi 비용 스모크 테스트: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 다음,
  `moonshot/kimi-k2.6`을 대상으로 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  명령을 실행합니다. JSON에 Moonshot/K2.6이 보고되고 어시스턴트 기록에
  정규화된 `usage.cost`가 저장되는지 확인하세요.

<Tip>
실패 사례 하나만 필요할 때는 아래에서 설명하는 허용 목록 환경 변수를 사용하여 라이브 테스트 범위를 좁히는 것이 좋습니다.
</Tip>

## QA 전용 러너

QA Lab 수준의 현실성이 필요할 때는 다음 명령을 주 테스트 제품군과 함께 사용합니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. 에이전트 동등성 검사는 독립형
PR 워크플로가 아니라 `QA-Lab - All Lanes`와 릴리스 검증에 포함됩니다.
광범위한 검증에는 `rerun_group=qa-parity`를 지정한
`Full Release Validation` 또는 릴리스 검사 QA 그룹을 사용해야 합니다.
안정/기본 릴리스 검사는 포괄적인 라이브/Docker 장시간 검사를
`run_release_soak=true` 뒤에 유지하며, `full` 프로파일은 장시간 검사를
강제로 활성화합니다. `QA-Lab - All Lanes`는 `main`에서 매일 밤 실행되고
수동 디스패치에서도 실행되며, 모의 동등성 레인, 라이브 Matrix 레인,
Convex 관리형 라이브 Telegram 레인, Convex 관리형 라이브 Discord 레인을
병렬 작업으로 실행합니다. 예약 QA와 릴리스 검사는 Matrix에
`--profile fast`를 명시적으로 전달하지만, Matrix CLI와 수동 워크플로 입력의
기본값은 계속 `all`입니다. 수동 디스패치는 `all`을 `transport`, `media`,
`e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩할 수 있습니다.
`OpenClaw Release Checks`는 릴리스 승인 전에 동등성 검사와 빠른 Matrix 및
Telegram 레인을 실행합니다. 릴리스 전송 검사에는
`mock-openai/gpt-5.6-luna`를 사용하여 결정성을 유지하고 일반적인 공급자
Plugin 시작을 방지합니다. 이러한 라이브 전송 Gateway는 메모리 검색을
비활성화하며, 메모리 동작은 계속 QA 동등성 제품군에서 검사합니다.

전체 릴리스 라이브 미디어 샤드는 `ffmpeg`와 `ffprobe`가 이미 포함된
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`를 사용합니다.
Docker 라이브 모델/백엔드 샤드는 선택한 커밋마다 한 번 빌드되는 공유
`ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용한 다음,
각 샤드 안에서 다시 빌드하는 대신 `OPENCLAW_SKIP_DOCKER_BUILD=1`로
이미지를 가져옵니다.

- `pnpm openclaw qa suite`
  - 저장소 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 혼합 흐름, Vitest 및 Playwright 시나리오 선택을 포함하여 선택한 시나리오 세트에 대한 최상위 `qa-evidence.json`, `qa-suite-summary.json`, `qa-suite-report.md` 아티팩트를 작성합니다.
  - `pnpm openclaw qa run --qa-profile <profile>`에서 디스패치하면 선택한 분류 체계 프로필 스코어카드를 동일한 `qa-evidence.json`에 포함합니다. `smoke-ci`는 간소화된 증거(`evidenceMode: "slim"`, 항목별 `execution` 없음)를 작성합니다. `release`는 선별된 릴리스 준비 상태 범위를 다루며, `all`은 활성화된 모든 성숙도 범주를 선택하고 전체 스코어카드 아티팩트가 필요할 때 명시적인 QA 프로필 증거 워크플로 디스패치를 대상으로 합니다.
  - 기본적으로 격리된 Gateway 워커를 사용하여 선택한 여러 시나리오를 병렬로 실행합니다. `qa-channel`의 기본 동시 실행 수는 4이며 선택한 시나리오 수로 제한됩니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 이전 직렬 실행 레인을 사용하려면 `--concurrency 1`을 사용합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트를 생성하려면 `--allow-failures`를 사용합니다.
  - `live-frontier`, `mock-openai`, `aimock` 공급자 모드를 지원합니다. `aimock`은 시나리오 인식형 `mock-openai` 레인을 대체하지 않고 실험적 픽스처 및 프로토콜 모의 적용 범위를 제공하기 위해 로컬 AIMock 기반 공급자 서버를 시작합니다.
- `pnpm openclaw qa coverage --match <query>`
  - 시나리오 ID, 제목, 표면, 적용 범위 ID, 문서 참조, 코드 참조, Plugin 및 공급자 요구 사항을 검색한 후 일치하는 제품군 대상을 출력합니다.
  - 변경된 동작이나 파일 경로는 알지만 가장 작은 시나리오는 모를 때 QA Lab 실행 전에 사용합니다. 이는 참고용일 뿐이며, 변경 중인 동작에 따라 모의, 라이브, Multipass, Matrix 또는 전송 증명을 선택해야 합니다.
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab을 통해 라이브 OpenAI Kitchen Sink Plugin 종합 테스트를 실행합니다. 외부 Kitchen Sink 패키지를 설치하고, Plugin SDK 표면 인벤토리를 확인하며, `/healthz`와 `/readyz`를 검사하고, Gateway CPU/RSS 증거를 기록하며, 라이브 OpenAI 턴을 실행하고, 적대적 진단을 확인합니다. `OPENAI_API_KEY` 같은 라이브 OpenAI 인증이 필요합니다. 준비된 Testbox 세션에서는 `openclaw-testbox-env` 도우미가 있을 때 Testbox 라이브 인증 프로필을 자동으로 불러옵니다.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 시작 벤치와 소규모 모의 QA Lab 시나리오 팩(`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`)을 실행하고 `.artifacts/gateway-cpu-scenarios/` 아래에 통합 CPU 관찰 요약을 작성합니다.
  - 기본적으로 지속적인 고부하 CPU 관찰만 표시하므로(`--cpu-core-warn`, 기본값 `0.9`; `--hot-wall-warn-ms`, 기본값 `30000`), 짧은 시작 버스트는 수분간 지속되는 Gateway 점유 회귀처럼 보이지 않고 메트릭으로 기록됩니다.
  - 빌드된 `dist` 아티팩트를 대상으로 실행됩니다. 체크아웃에 최신 런타임 출력이 아직 없으면 먼저 빌드를 실행합니다.
- `pnpm openclaw qa suite --runner multipass`
  - 폐기 가능한 Multipass Linux VM 안에서 동일한 QA 제품군을 실행하며, `qa suite`와 동일한 시나리오 선택 및 공급자/모델 플래그를 유지합니다.
  - 라이브 실행은 게스트에서 사용할 수 있는 QA 인증 입력, 즉 환경 변수 기반 공급자 키, QA 라이브 공급자 구성 경로 및 존재하는 경우 `CODEX_HOME`을 전달합니다.
  - 게스트가 마운트된 작업 공간을 통해 결과를 다시 쓸 수 있도록 출력 디렉터리는 저장소 루트 아래에 있어야 합니다.
  - 일반 QA 보고서와 요약 및 Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 작성합니다.
- `pnpm qa:lab:up`
  - 운영자 방식의 QA 작업을 위한 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm 타르볼을 빌드하고, Docker에 전역으로 설치하며, 비대화형 OpenAI API 키 온보딩을 실행하고, 기본적으로 Telegram을 구성하며, 패키징된 Plugin 런타임이 시작 시 의존성 복구 없이 로드되는지 확인하고, doctor를 실행한 다음 모의 OpenAI 엔드포인트를 대상으로 로컬 에이전트 턴 하나를 실행합니다.
  - Discord에서 동일한 패키지 설치 레인을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용합니다.
- `pnpm test:docker:session-runtime-context`
  - 내장 런타임 컨텍스트 트랜스크립트에 대해 결정론적인 빌드 앱 Docker 스모크 테스트를 실행합니다. 숨겨진 OpenClaw 런타임 컨텍스트가 표시되는 사용자 턴에 유출되지 않고 비표시 사용자 지정 메시지로 유지되는지 확인한 다음, 영향을 받는 손상된 세션 JSONL을 시드하고 `openclaw doctor --fix`가 백업과 함께 활성 브랜치로 다시 작성하는지 확인합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 OpenClaw 패키지 후보를 설치하고, 설치된 패키지의 온보딩을 실행하며, 설치된 CLI를 통해 Telegram을 구성한 다음, 설치된 패키지를 테스트 대상 시스템 Gateway로 사용하여 라이브 Telegram QA 레인을 재사용합니다.
  - 래퍼는 체크아웃에서 `qa-lab` 하네스 소스만 마운트합니다. 설치된 패키지가 `dist`, `openclaw/plugin-sdk` 및 번들 Plugin 런타임을 소유하므로, 이 레인은 현재 체크아웃의 Plugin을 테스트 중인 패키지에 혼합하지 않습니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다. 레지스트리에서 설치하는 대신 확인된 로컬 타르볼을 테스트하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 또는 `OPENCLAW_CURRENT_PACKAGE_TGZ`를 설정합니다.
  - 기본적으로 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`을 사용하여 반복 RTT 타이밍을 `qa-evidence.json`에 내보냅니다. 실행을 조정하려면 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 또는 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`를 재정의합니다. `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS`에는 표본으로 사용할 Telegram QA 검사 ID를 쉼표로 구분하여 지정할 수 있습니다. 설정하지 않으면 기본 RTT 지원 검사는 `telegram-mentioned-message-reply`입니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram 환경 변수 자격 증명 또는 Convex 자격 증명 소스를 사용합니다. CI/릴리스 자동화에서는 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와 함께 `OPENCLAW_QA_CONVEX_SITE_URL` 및 역할 시크릿을 설정합니다. CI에 `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex 역할 시크릿이 있으면 Docker 래퍼가 Convex를 자동으로 선택합니다.
  - 래퍼는 Docker 빌드/설치 작업 전에 호스트에서 Telegram 또는 Convex 자격 증명 환경 변수를 검증합니다. 자격 증명 이전 설정을 의도적으로 디버깅할 때만 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`을 설정합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 한해서만 공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다. Convex 자격 증명을 선택하고 역할을 설정하지 않으면 래퍼는 CI 안에서는 `ci`, CI 밖에서는 `maintainer`를 사용합니다.
  - GitHub Actions에서는 이 레인을 수동 유지관리자 워크플로 `NPM Telegram Beta E2E`로 제공합니다. 병합 시에는 실행되지 않습니다. 이 워크플로는 `qa-live-shared` 환경과 Convex CI 자격 증명 임대를 사용합니다.
- GitHub Actions에서는 단일 후보 패키지를 대상으로 별도 실행 제품 증명을 수행하는 `Package Acceptance`도 제공합니다. Git 참조, 게시된 npm 사양, SHA-256이 포함된 HTTPS 타르볼 URL, 신뢰할 수 있는 URL 정책 또는 다른 실행의 타르볼 아티팩트(`source=ref|npm|url|trusted-url|artifact`)를 입력으로 받고, 정규화된 `openclaw-current.tgz`를 `package-under-test`로 업로드한 다음 기존 Docker E2E 스케줄러를 `smoke`, `package`, `product`, `full` 또는 `custom` 레인 프로필로 실행합니다. 동일한 `package-under-test` 아티팩트를 대상으로 Telegram QA 워크플로를 실행하려면 `telegram_mode=mock-openai` 또는 `live-frontier`를 설정합니다.
  - 최신 베타 제품 증명:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 정확한 타르볼 URL 증명에는 다이제스트가 필요하며 공개 URL 안전 정책을 사용합니다.

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 엔터프라이즈/비공개 타르볼 미러는 명시적인 신뢰 소스 정책을 사용합니다.

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url`은 신뢰할 수 있는 워크플로 참조에서 `.github/package-trusted-sources.json`을 읽으며 URL 자격 증명이나 워크플로 입력을 통한 비공개 네트워크 우회를 허용하지 않습니다. 지정한 정책에서 베어러 인증을 선언하는 경우 고정된 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 시크릿을 구성합니다.

- 아티팩트 증명은 다른 Actions 실행에서 타르볼 아티팩트를 다운로드합니다.

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 현재 OpenClaw 빌드를 패키징하여 Docker에 설치하고, OpenAI가 구성된 상태로 Gateway를 시작한 다음 구성 편집을 통해 번들 채널/Plugin을 활성화합니다.
  - 설정 검색 과정에서 구성되지 않은 다운로드 가능 Plugin이 설치되지 않은 상태로 유지되는지, 처음 구성한 doctor 복구가 누락된 각 다운로드 가능 Plugin을 명시적으로 설치하는지, 두 번째 재시작에서는 숨겨진 의존성 복구가 실행되지 않는지 확인합니다.
  - 또한 알려진 이전 npm 기준 버전을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화하며, 후보 버전의 업데이트 후 doctor가 하네스 측 설치 후 복구 없이 레거시 Plugin 의존성 잔여물을 정리하는지 확인합니다.
- `pnpm test:parallels:npm-update`
  - Parallels 게스트 전반에서 네이티브 패키지 설치 업데이트 스모크 테스트를 실행합니다. 선택한 각 플랫폼은 먼저 요청된 기준 패키지를 설치한 다음 동일한 게스트에서 설치된 `openclaw update` 명령을 실행하고, 설치된 버전, 업데이트 상태, Gateway 준비 상태 및 로컬 에이전트 턴 하나를 확인합니다.
  - 하나의 게스트에서 반복 작업할 때는 `--platform macos`, `--platform windows` 또는 `--platform linux`를 사용합니다. 요약 아티팩트 경로와 레인별 상태를 확인하려면 `--json`을 사용합니다.
  - OpenAI 레인은 기본적으로 라이브 에이전트 턴 증명에 `openai/gpt-5.6-luna`를 사용합니다. 다른 OpenAI 모델을 검증하려면 `--model <provider/model>`을 전달하거나 `OPENCLAW_PARALLELS_OPENAI_MODEL`을 설정합니다.
  - Parallels 전송 중단이 남은 테스트 시간을 모두 소모하지 않도록 긴 로컬 실행을 호스트 시간 제한으로 감쌉니다.

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 `/tmp/openclaw-parallels-npm-update.*` 아래에 중첩된 레인 로그를 작성합니다. 외부 래퍼가 멈췄다고 판단하기 전에 `windows-update.log`, `macos-update.log` 또는 `linux-update.log`를 확인합니다.
  - 콜드 게스트에서는 Windows 업데이트 후 doctor 및 패키지 업데이트 작업에 10~15분이 걸릴 수 있습니다. 중첩된 npm 디버그 로그가 계속 진행 중이라면 정상 상태입니다.
  - 이 집계 래퍼를 개별 Parallels macOS, Windows 또는 Linux 스모크 레인과 병렬로 실행하지 마십시오. 이들은 VM 상태를 공유하며 스냅샷 복원, 패키지 제공 또는 게스트 Gateway 상태에서 충돌할 수 있습니다.
  - 업데이트 후 증명은 일반적인 번들 Plugin 표면을 실행합니다. 에이전트 턴 자체는 단순한 텍스트 응답만 확인하더라도 음성, 이미지 생성 및 미디어 이해 같은 기능 퍼사드는 번들 런타임 API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 스모크 테스트를 위해 로컬 AIMock 제공자 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel 홈 서버를 대상으로 Matrix 라이브 QA 레인을 실행합니다. 소스 체크아웃에서만 사용할 수 있으며, 패키지 설치본에는 `qa-lab`이 포함되지 않습니다.
  - 전체 CLI, 프로필/시나리오 카탈로그, 환경 변수 및 아티팩트 레이아웃:
    [Matrix QA](/ko/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - 환경 변수의 드라이버 및 SUT 봇 토큰을 사용하여 실제 비공개 그룹을 대상으로 Telegram 라이브 QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`,
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. 그룹 ID는 숫자로 된
    Telegram 채팅 ID여야 합니다.
  - 공유 풀 자격 증명에 `--credential-source convex`를 지원합니다.
    기본적으로 환경 변수 모드를 사용하거나, 풀의 임대를 사용하도록
    `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정합니다.
  - 기본 시나리오는 카나리, 멘션 게이팅, 명령 주소 지정, `/status`,
    봇 간 멘션 응답 및 핵심 네이티브 명령 응답을 포함합니다.
    `mock-openai` 기본값에는 결정론적 응답 체인과
    Telegram 최종 메시지 스트리밍 회귀도 포함됩니다. `session_status` 같은
    선택적 프로브에는 `--list-scenarios`를 사용합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 코드로 종료됩니다. 실패 종료 코드 없이
    아티팩트를 생성하려면 `--allow-failures`를 사용합니다.
  - 동일한 비공개 그룹에 서로 다른 두 봇이 있어야 하며, SUT 봇에는
    Telegram 사용자 이름이 공개되어 있어야 합니다.
  - 안정적으로 봇 간 동작을 관찰하려면 두 봇 모두에 대해 `@BotFather`에서
    Bot-to-Bot Communication Mode를 활성화하고, 드라이버 봇이
    그룹 내 봇 트래픽을 관찰할 수 있는지 확인합니다.
  - `.artifacts/qa-e2e/...` 아래에 Telegram QA 보고서, 요약 및
    `qa-evidence.json`을 기록합니다. 응답 시나리오에는 드라이버 전송
    요청부터 관찰된 SUT 응답까지의 RTT가 포함됩니다.

`Mantis Telegram Live`는 이 레인을 감싸는 PR 증거 래퍼입니다. 후보 ref를
Convex에서 임대한 Telegram 자격 증명으로 실행하고, 수정된 QA 보고서/증거
번들을 Crabbox 데스크톱 브라우저에 렌더링하고, MP4 증거를 녹화하고,
움직임 구간만 남긴 GIF를 생성하고, 아티팩트 번들을 업로드하며,
`pr_number`가 설정된 경우 Mantis GitHub App을 통해 PR에 인라인 증거를
게시합니다. 유지관리자는 Actions UI에서 `Mantis Scenario`
(`scenario_id: telegram-live`)를 통해 시작하거나, 풀 리퀘스트 댓글에서
직접 시작할 수 있습니다.

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`는 PR 시각적 증명을 위한 에이전트형 네이티브
Telegram Desktop 전후 비교 래퍼입니다. 자유 형식 `instructions`를 사용하여
Actions UI에서 시작하거나, `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)를 통해 시작하거나, PR 댓글에서 시작합니다.

```text
@openclaw-mantis telegram desktop proof
```

Mantis 에이전트는 PR을 읽고 어떤 Telegram 표시 동작이 변경 사항을
증명하는지 결정한 다음, 기준 및 후보 ref에서 실제 사용자용 Crabbox
Telegram Desktop 증명 레인을 실행하고, 네이티브 GIF가 유용해질 때까지
반복하고, 쌍으로 구성된 `motionPreview` 매니페스트를 작성하며,
`pr_number`가 설정된 경우 Mantis GitHub App을 통해 동일한 2열 GIF
표를 게시합니다.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux 데스크톱을 임대하거나 재사용하고, 네이티브 Telegram
    Desktop을 설치하고, 임대한 Telegram SUT 봇 토큰으로 OpenClaw를
    구성하고, Gateway를 시작한 다음, 표시되는 VNC 데스크톱에서
    스크린샷/MP4 증거를 녹화합니다.
  - 워크플로에 Convex 브로커 시크릿만 필요하도록 기본값은
    `--credential-source convex`입니다. `pnpm openclaw qa telegram`과
    동일한 `OPENCLAW_QA_TELEGRAM_*` 변수를 사용하려면
    `--credential-source env`를 사용합니다.
  - Telegram Desktop에는 여전히 사용자 로그인/프로필이 필요합니다. 봇 토큰은
    OpenClaw만 구성합니다. base64 `.tgz` 프로필 아카이브에는
    `--telegram-profile-archive-env <name>`을 사용하거나, `--keep-lease`를
    사용하여 VNC를 통해 한 번 수동으로 로그인합니다.
  - 출력 디렉터리 아래에 `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png`, `telegram-desktop-builder.mp4`를
    기록합니다.

새 전송 수단이 서로 달라지지 않도록 라이브 전송 레인은 하나의 표준 계약을
공유합니다. 레인별 커버리지 매트릭스는
[QA 개요 - 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에
있습니다. `qa-channel`은 광범위한 합성 테스트 모음이며 이 매트릭스에는
포함되지 않습니다.

### Convex를 통한 공유 Telegram 자격 증명(v1)

라이브 전송 QA에 `--credential-source convex` 또는
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 활성화하면 QA 랩은 Convex 기반
풀에서 독점 임대를 획득하고, 레인이 실행되는 동안 해당 임대에 Heartbeat를
보내며, 종료 시 임대를 해제합니다. 이 섹션 이름은 Discord, Slack 및
WhatsApp 지원보다 먼저 만들어졌으며, 임대 계약은 모든 종류에서 공유됩니다.

참조 Convex 프로젝트 스캐폴드: `qa/convex-credential-broker/`

필수 환경 변수:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택한 역할에 해당하는 시크릿 하나:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - 환경 변수 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본값이 `ci`, 그 외에는 `maintainer`)

선택적 환경 변수:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 local loopback `http://` Convex URL을 허용합니다.

일반 작업에서는 `OPENCLAW_QA_CONVEX_SITE_URL`에 `https://`를 사용해야 합니다.

유지관리자 관리 명령(풀 추가/제거/목록 조회)에는 반드시
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

유지관리자용 CLI 도우미:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용하여 시크릿 값을 출력하지 않고 Convex 사이트
URL, 브로커 시크릿, 엔드포인트 접두사, HTTP 시간 제한 및 관리/목록 접근
가능성을 확인합니다. 스크립트 및 CI 유틸리티에서 기계 판독 가능한 출력을
얻으려면 `--json`을 사용합니다.

기본 엔드포인트 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
요청은 `Authorization: Bearer <role secret>` 헤더로 인증되며, 아래 본문에서는
해당 헤더를 생략합니다.

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
- `POST /admin/add`(유지관리자 시크릿 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(유지관리자 시크릿 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 임대 보호: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(유지관리자 시크릿 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram 종류의 페이로드 형식:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자로 된 Telegram 채팅 ID 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형식을 검증하며 잘못된 페이로드를 거부합니다.

Telegram 실제 사용자 종류의 페이로드 형식:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, `telegramApiId`는 숫자 문자열이어야 합니다.
- `tdlibArchiveSha256`과 `desktopTdataArchiveSha256`은 SHA-256 16진수 문자열이어야 합니다.
- `kind: "telegram-user"`는 Mantis Telegram Desktop 증명 워크플로용으로 예약되어 있습니다. 일반 QA Lab 레인은 이를 획득해서는 안 됩니다.

브로커에서 검증하는 다중 채널 페이로드:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 레인도 풀에서 임대할 수 있지만, 현재 Slack 페이로드 검증은 브로커가
아니라 Slack QA 실행기에 있습니다. Slack 행에는
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`을
사용합니다.

### QA에 채널 추가하기

새 채널 어댑터의 아키텍처와 시나리오 도우미 이름은
[QA 개요 - 채널 추가하기](/ko/concepts/qa-e2e-automation#adding-a-channel)에
있습니다. 최소 요구 사항은 공유 `qa-lab` 호스트 접점에 전송 실행기를
구현하고, 공유 시나리오용 `adapterFactory`를 추가하고, Plugin 매니페스트에
`qaRunners`를 선언하고, `openclaw qa <runner>`로 마운트하고,
`qa/scenarios/` 아래에 시나리오를 작성하는 것입니다.

## 테스트 모음(실행 위치별 구분)

테스트 모음을 “현실성이 점차 높아지는” 순서로 생각할 수 있습니다(불안정성과
비용도 함께 증가합니다).

### 단위/통합(기본값)

- 명령: `pnpm test`
- 구성: 대상이 지정되지 않은 실행은 `vitest.full-*.config.ts` 샤드 집합을
  사용하며, 병렬 예약을 위해 다중 프로젝트 샤드를 프로젝트별 구성으로
  확장할 수 있습니다.
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`
  아래의 핵심/단위 인벤토리이며, UI 단위 테스트는 전용 `unit-ui` 샤드에서
  실행됩니다.
- 범위:
  - 순수 단위 테스트
  - 프로세스 내 통합 테스트(Gateway 인증, 라우팅, 도구, 구문 분석, 구성)
  - 알려진 버그에 대한 결정론적 회귀 테스트
- 기대 사항:
  - CI에서 실행
  - 실제 키가 필요하지 않음
  - 빠르고 안정적이어야 함
  - 리졸버 및 공개 표면 로더 테스트는 실제 번들 Plugin 소스 API가 아니라,
    생성된 소형 Plugin 픽스처를 사용하여 광범위한 `api.js` 및
    `runtime-api.js` 대체 동작을 증명해야 합니다. 실제 Plugin API 로드는
    Plugin 소유 계약/통합 테스트 모음에 포함해야 합니다.

네이티브 종속성 정책:

- 기본 테스트 설치에서는 선택적 네이티브 Discord opus 빌드를 건너뜁니다.
  Discord 음성은 번들된 `libopus-wasm`을 사용하며, 로컬 테스트와 Testbox
  레인에서 네이티브 애드온을 컴파일하지 않도록 `@discordjs/opus`는
  `allowBuilds`에서 비활성화 상태를 유지합니다.
- 네이티브 opus 성능은 기본 OpenClaw 설치/테스트 루프가 아니라
  `libopus-wasm` 벤치마크 저장소에서 비교합니다. 기본 `allowBuilds`에서
  `@discordjs/opus`를 `true`로 설정하지 마세요. 그렇게 하면 관련 없는
  설치/테스트 루프에서 네이티브 코드를 컴파일하게 됩니다.

<AccordionGroup>
  <Accordion title="프로젝트, 샤드 및 범위 지정 레인">

    - 대상을 지정하지 않은 `pnpm test` 실행은 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 13개의 더 작은 샤드 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 있는 시스템에서 최대 RSS를 줄이고 auto-reply/Plugin 작업 때문에 관련 없는 테스트 스위트가 리소스를 받지 못하는 상황을 방지할 수 있습니다.
    - 다중 샤드 감시 루프는 실용적이지 않으므로 `pnpm test --watch`는 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적인 파일/디렉터리 대상을 먼저 범위가 지정된 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 실행 시 전체 루트 프로젝트의 시작 비용을 부담하지 않습니다.
    - `pnpm test:changed`는 기본적으로 변경된 git 경로를 저비용의 범위 지정 레인으로 확장합니다. 여기에는 직접 수정된 테스트, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 가져오기 그래프의 종속 파일이 포함됩니다. `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 명시적으로 사용하지 않는 한 구성/설정/패키지 수정으로 인해 테스트가 광범위하게 실행되지는 않습니다.
    - `pnpm check:changed`는 범위가 좁은 작업에 사용하는 일반적인 스마트 로컬 검사 게이트입니다. diff를 코어, 코어 테스트, 확장 기능, 확장 기능 테스트, 앱, 문서, 릴리스 메타데이터, 라이브 Docker 도구, 일반 도구로 분류한 다음 일치하는 타입 검사, 린트, 가드 명령을 실행합니다. Vitest 테스트는 실행하지 않으므로 테스트 증명이 필요하면 `pnpm test:changed` 또는 명시적인 `pnpm test <target>`을 호출하세요. 릴리스 메타데이터만 변경하는 버전 증가는 대상이 지정된 버전/구성/루트 종속성 검사를 실행하며, 최상위 버전 필드 이외의 패키지 변경을 거부하는 가드도 적용됩니다.
    - 라이브 Docker ACP 하네스 수정은 라이브 Docker 인증 스크립트의 셸 구문 검사와 라이브 Docker 스케줄러 시험 실행이라는 집중 검사를 수행합니다. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로만 제한될 때만 포함됩니다. 종속성, 내보내기, 버전 및 기타 패키지 표면 수정에는 여전히 더 광범위한 가드가 적용됩니다.
    - 에이전트, 명령, Plugin, auto-reply 헬퍼, `plugin-sdk` 및 이와 유사한 순수 유틸리티 영역의 가져오기가 가벼운 단위 테스트는 `test/setup-openclaw-runtime.ts`를 건너뛰는 `unit-fast` 레인을 통해 라우팅됩니다. 상태를 유지하거나 런타임 부하가 큰 파일은 기존 레인에 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 변경 모드 실행 시 해당 경량 레인의 명시적인 형제 테스트에 매핑되므로, 헬퍼 수정 때문에 해당 디렉터리의 전체 무거운 테스트 스위트를 다시 실행하지 않습니다.
    - `auto-reply`에는 최상위 코어 헬퍼, 최상위 `reply.*` 통합 테스트 및 `src/auto-reply/reply/**` 하위 트리를 위한 전용 버킷이 있습니다. CI에서는 reply 하위 트리를 agent-runner, dispatch 및 commands/state-routing 샤드로 추가 분할하여 가져오기 부하가 큰 단일 버킷이 전체 Node 후반부를 차지하지 않도록 합니다.
    - 일반 PR/main CI는 번들 Plugin 일괄 스윕과 릴리스 전용 `agentic-plugins` 샤드를 의도적으로 건너뜁니다. 전체 릴리스 검증은 릴리스 후보에서 이러한 Plugin 중심 테스트 스위트를 위해 별도의 `Plugin Prerelease` 하위 워크플로를 디스패치합니다.

  </Accordion>

  <Accordion title="임베디드 러너 커버리지">

    - 메시지 도구 검색 입력 또는 Compaction 런타임 컨텍스트를 변경할 때는
      두 수준의 커버리지를 모두 유지하세요.
    - 순수 라우팅 및 정규화 경계에는 집중된 헬퍼 회귀 테스트를
      추가하세요.
    - 임베디드 러너 통합 테스트 스위트를 정상 상태로 유지하세요.
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - 이러한 테스트 스위트는 범위가 지정된 ID와 Compaction 동작이 실제
      `run.ts` / `compact.ts` 경로를 계속 통과하는지 검증합니다. 헬퍼 전용 테스트는
      이러한 통합 경로를 충분히 대체하지 못합니다.

  </Accordion>

  <Accordion title="Vitest 풀 및 격리 기본값">

    - 기본 Vitest 구성은 `threads`를 기본값으로 사용합니다.
    - 공유 Vitest 구성은 `isolate: false`를 고정하고 루트 프로젝트, e2e 및
      라이브 구성 전반에서 비격리 러너를 사용합니다.
    - 루트 UI 레인은 자체 `jsdom` 설정과 최적화 도구를 유지하지만
      공유 비격리 러너에서도 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest 구성에서 동일한
      `threads` + `isolate: false` 기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 대규모 로컬 실행 중 V8 컴파일 변동을 줄이기 위해
      기본적으로 Vitest 하위 Node 프로세스에 `--no-maglev`를 추가합니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.
    - `scripts/run-vitest.mjs`는 stdout 또는 stderr 출력이 5분 동안 없는
      명시적 비감시 Vitest 실행을 종료합니다. 의도적으로 출력이 없는 조사를 위해
      감시 기능을 비활성화하려면 `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`을
      설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복 작업">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여 줍니다.
    - 커밋 전 훅은 포매팅만 수행합니다. 포매팅된 파일을 다시 스테이징하며
      린트, 타입 검사 또는 테스트는 실행하지 않습니다.
    - 스마트 로컬 검사 게이트가 필요하면 인계 또는 푸시 전에
      `pnpm check:changed`를 명시적으로 실행하세요.
    - `pnpm test:changed`는 기본적으로 저비용의 범위 지정 레인을 통해 라우팅됩니다.
      에이전트가 하네스, 구성, 패키지 또는 계약 수정에 실제로 더 광범위한
      Vitest 커버리지가 필요하다고 판단할 때만
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.
    - `pnpm test:max`와 `pnpm test:changed:max`는 워커 상한만 더 높을 뿐
      동일한 라우팅 동작을 유지합니다.
    - 로컬 워커 자동 확장은 의도적으로 보수적이며 호스트의 평균 부하가 이미 높으면
      축소되므로, 기본적으로 여러 Vitest 동시 실행이 끼치는 피해가 줄어듭니다.
    - 기본 Vitest 구성은 테스트 연결이 변경될 때 변경 모드 재실행의 정확성을 유지하도록
      프로젝트/구성 파일을 `forceRerunTriggers`로 표시합니다.
    - 구성은 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를
      활성화된 상태로 유지합니다. 직접 프로파일링을 위해 단일 명시적 캐시 위치를
      사용하려면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest 가져오기 시간 보고와
      가져오기 세부 내역 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 프로파일링 보기를
      `origin/main` 이후 변경된 파일로 한정합니다.
    - 샤드 타이밍 데이터는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      전체 구성 실행은 구성 경로를 키로 사용합니다. 포함 패턴 CI 샤드는 필터링된
      샤드를 별도로 추적할 수 있도록 샤드 이름을 덧붙입니다.
    - 부하가 높은 테스트 하나가 여전히 시작 시 가져오기에 대부분의 시간을 소비한다면,
      무거운 종속성을 좁은 로컬 `*.runtime.ts` 경계 뒤에 두고 런타임 헬퍼를
      `vi.mock(...)`에 전달하기 위해 깊은 경로로 가져오는 대신 해당 경계를 직접 모킹하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 커밋된 해당 diff에 대해
      라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고 경과 시간과
      macOS 최대 RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을
      `scripts/test-projects.mjs`와 루트 Vitest 구성을 통해 라우팅하여
      현재 수정된 작업 트리를 벤치마크합니다.
    - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 변환 오버헤드에 대한
      메인 스레드 CPU 프로파일을 기록합니다.
    - `pnpm test:perf:profile:runner`는 파일 병렬 처리를 비활성화한 단위 테스트 스위트의
      러너 CPU+힙 프로파일을 기록합니다.

  </Accordion>
</AccordionGroup>

### 안정성(Gateway)

- 명령: `pnpm test:stability:gateway`
- 구성: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts`, `test/vitest/vitest.infra.config.ts`. 각각 워커 하나로 강제됩니다.
- 범위:
  - 기본적으로 진단을 활성화한 실제 local loopback Gateway를 시작합니다.
  - 진단 이벤트 경로를 통해 합성 Gateway 메시지, 메모리 및 대용량 페이로드 부하를 발생시킵니다.
  - Gateway WS RPC를 통해 `diagnostics.stability`를 조회합니다.
  - 진단 안정성 번들 영속화 헬퍼를 다룹니다.
  - 레코더가 제한 범위 내에 유지되고, 합성 RSS 샘플이 부하 예산 미만에 머물며, 세션별 큐 깊이가 다시 0까지 소진되는지 검증합니다.
- 기대 사항:
  - CI에 안전하며 키가 필요하지 않습니다.
  - 안정성 회귀 후속 조사를 위한 좁은 레인이며 전체 Gateway 테스트 스위트를 대체하지 않습니다.

### E2E(저장소 통합)

- 명령: `pnpm test:e2e`
- 범위:
  - Gateway 스모크 E2E 레인을 실행합니다.
  - 모킹된 Control UI 브라우저 E2E 레인을 실행합니다.
- 기대 사항:
  - CI에 안전하며 키가 필요하지 않습니다.
  - Playwright Chromium이 설치되어 있어야 합니다.

### E2E(Gateway 스모크)

- 명령: `pnpm test:e2e:gateway`
- 구성: `test/vitest/vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` 및 `extensions/` 아래의 번들 Plugin E2E 테스트
- 런타임 기본값:
  - 저장소의 나머지 부분과 일치하도록 `isolate: false`인 Vitest `threads`를 사용합니다.
  - 적응형 워커를 사용합니다(CI: 최대 2개, 로컬: 기본 1개).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 자동 모드로 실행됩니다.
- 유용한 재정의:
  - 워커 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`을 사용합니다(최대 16개).
  - 상세 콘솔 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`을 사용합니다.
- 범위:
  - 다중 인스턴스 Gateway 엔드 투 엔드 동작
  - WebSocket/HTTP 표면, Node 페어링 및 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됩니다(파이프라인에서 활성화된 경우).
  - 실제 키가 필요하지 않습니다.
  - 단위 테스트보다 구성 요소가 많아 더 느릴 수 있습니다.

### E2E(Control UI 모킹 브라우저)

- 명령: `pnpm test:ui:e2e`
- 구성: `test/vitest/vitest.ui-e2e.config.ts`
- 파일: `ui/src/**/*.e2e.test.ts`
- 범위:
  - Vite Control UI를 시작합니다.
  - Playwright를 통해 실제 Chromium 페이지를 구동합니다.
  - Gateway WebSocket을 결정론적인 브라우저 내 모킹으로 대체합니다.
- 기대 사항:
  - `pnpm test:e2e`의 일부로 CI에서 실행됩니다.
  - 실제 Gateway, 에이전트 또는 제공자 키가 필요하지 않습니다.
  - 브라우저 종속성이 있어야 합니다(`pnpm --dir ui exec playwright install chromium`).

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - 활성 로컬 OpenShell Gateway를 재사용합니다.
  - 임시 로컬 Dockerfile에서 샌드박스를 생성합니다.
  - 실제 `sandbox ssh-config` + SSH 실행을 통해 OpenClaw의 OpenShell 백엔드를 테스트합니다.
  - 샌드박스 fs 브리지를 통해 원격 기준 파일 시스템 동작을 검증합니다.
- 기대 사항:
  - 명시적으로 선택한 경우에만 실행되며 기본 `pnpm test:e2e` 실행에는 포함되지 않습니다.
  - 로컬 `openshell` CLI와 작동하는 Docker 데몬이 필요합니다.
  - 활성 로컬 OpenShell Gateway와 해당 구성 소스가 필요합니다.
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 다음 테스트 샌드박스를 제거합니다.
- 유용한 재정의:
  - 더 광범위한 e2e 테스트 스위트를 수동 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`을 사용합니다.
  - 기본값이 아닌 CLI 바이너리 또는 래퍼 스크립트를 지정하려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`을 사용합니다.
  - 등록된 Gateway 구성을 격리된 테스트에 노출하려면 `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`을 사용합니다.
  - 호스트 정책 픽스처에서 사용하는 Docker Gateway IP를 재정의하려면 `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`을 사용합니다.

### 라이브(실제 제공자 + 실제 모델)

- 명령어: `pnpm test:live`
- 구성: `test/vitest/vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin 라이브 테스트
- 기본값: `pnpm test:live`에서 **활성화됨** (`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - "이 제공자/모델이 실제 자격 증명으로 _오늘_ 실제로 작동하는가?"
  - 제공자 형식 변경, 도구 호출 특이점, 인증 문제 및 사용량 제한 동작 감지
- 예상 사항:
  - 설계상 CI에서 안정적이지 않음(실제 네트워크, 실제 제공자 정책, 할당량, 장애)
  - 비용이 발생하거나 사용량 제한을 소모함
  - "전체" 대신 범위를 좁힌 하위 집합 실행 권장
- 라이브 실행은 이미 내보낸 API 키와 준비된 인증 프로필을 사용합니다.
- 기본적으로 라이브 실행에서도 `HOME`을 격리하고 구성/인증 자료를 임시 테스트 홈으로 복사하므로 단위 테스트 픽스처가 실제 `~/.openclaw`를 변경할 수 없습니다.
- 라이브 테스트가 실제 홈 디렉터리를 사용해야 하는 경우에만 의도적으로 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 기본적으로 더 조용한 모드를 사용합니다. `[live] ...` 진행률 출력은 유지하고 Gateway 부트스트랩 로그와 Bonjour 관련 출력을 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(제공자별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나 `OPENCLAW_LIVE_*_KEY`를 통해 라이브 실행별 재정의를 설정하세요. 테스트는 사용량 제한 응답이 발생하면 재시도합니다.
- 진행률/Heartbeat 출력:
  - 라이브 스위트는 stderr에 진행률 행을 출력하므로 Vitest 콘솔 캡처가 조용한 경우에도 오래 걸리는 제공자 호출이 활성 상태임을 확인할 수 있습니다.
  - `test/vitest/vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하여 라이브 실행 중 제공자/Gateway 진행률 행이 즉시 스트리밍되도록 합니다.
  - `OPENCLAW_LIVE_HEARTBEAT_MS`로 직접 모델 Heartbeat를 조정하세요.
  - `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 Gateway/프로브 Heartbeat를 조정하세요.

## 어떤 스위트를 실행해야 하나요?

다음 결정표를 사용하세요.

- 로직/테스트 편집: `pnpm test` 실행(많은 부분을 변경한 경우 `pnpm test:coverage`도 실행)
- Gateway 네트워킹 / WS 프로토콜 / 페어링 수정: `pnpm test:e2e` 추가
- "내 봇이 작동하지 않음" / 제공자별 실패 / 도구 호출 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## 라이브(네트워크 사용) 테스트

라이브 모델 매트릭스, CLI 백엔드 스모크 테스트, ACP 스모크 테스트, Codex 앱 서버
하네스 및 모든 미디어 제공자 라이브 테스트(Deepgram, BytePlus, ComfyUI,
이미지, 음악, 동영상, 미디어 하네스)와 라이브 실행의 자격 증명 처리에 대해서는

- [라이브 스위트 테스트](/ko/help/testing-live)를 참조하세요. 전용 업데이트 및
  Plugin 검증 체크리스트는
  [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

## Docker 실행기(선택적 "Linux에서 작동하는지" 확인)

이 Docker 실행기는 다음 두 범주로 나뉩니다.

- 라이브 모델 실행기: `test:docker:live-models`와 `test:docker:live-gateway`는 저장소 Docker 이미지 안에서 각각 일치하는 프로필 키 라이브 파일(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`)만 실행하며, 로컬 구성 디렉터리, 작업 공간 및 선택적 프로필 환경 파일을 마운트합니다. 이에 대응하는 로컬 진입점은 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker 라이브 실행기는 필요한 경우 자체적인 실용적 상한을 유지합니다.
  `test:docker:live-models`는 기본적으로 엄선된 지원 대상 중 신호 가치가 높은 집합을 사용하며,
  `test:docker:live-gateway`는 기본적으로 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 및
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`을 사용합니다. 더 작은 상한이나 더 큰 탐색 범위가 명시적으로 필요한 경우 `OPENCLAW_LIVE_MAX_MODELS`
  또는 Gateway 환경 변수를 설정하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 라이브 Docker 이미지를 한 번 빌드하고, `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 npm 타르볼로 한 번 패키징한 다음, 두 개의 `scripts/e2e/Dockerfile` 이미지를 빌드하거나 재사용합니다. 기본 이미지는 설치/업데이트/Plugin 종속성 실행 구간을 위한 Node/Git 실행기일 뿐이며, 해당 실행 구간은 미리 빌드된 타르볼을 마운트합니다. 기능 이미지는 빌드된 앱의 기능 실행 구간을 위해 동일한 타르볼을 `/app`에 설치합니다. Docker 실행 구간 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있으며, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있고, `scripts/test-docker-all.mjs`가 선택된 계획을 실행합니다. 집계 실행은 가중치 기반 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`은 프로세스 슬롯을 제어하며, 리소스 상한은 무거운 라이브, npm 설치 및 다중 서비스 실행 구간이 모두 동시에 시작되지 않도록 합니다. 단일 실행 구간이 활성 상한보다 무거운 경우에도 풀이 비어 있으면 스케줄러가 이를 시작할 수 있으며, 용량을 다시 사용할 수 있을 때까지 해당 실행 구간만 단독으로 실행합니다. 기본값은 슬롯 10개, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 여유 용량이 더 있는 경우에만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` 및 기타 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 재정의를 조정하세요. 실행기는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 실행 구간의 소요 시간을 `.artifacts/docker-tests/lane-timings.json`에 저장한 뒤 이후 실행에서는 이 시간을 사용하여 오래 걸리는 실행 구간부터 시작합니다. Docker를 빌드하거나 실행하지 않고 가중치 기반 실행 구간 매니페스트를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 선택된 실행 구간, 패키지/이미지 요구 사항 및 자격 증명에 대한 CI 계획을 출력하려면 `node scripts/test-docker-all.mjs --plan-json`을 사용하세요.
- `패키지 승인`은 "이 설치 가능한 타르볼이 제품으로 작동하는가?"를 확인하는 GitHub 네이티브 패키지 게이트입니다. `source=npm`, `source=ref`, `source=url`, `source=trusted-url` 또는 `source=artifact`에서 후보 패키지 하나를 결정하여 `package-under-test`로 업로드한 다음, 선택된 참조를 다시 패키징하는 대신 정확히 해당 타르볼을 대상으로 재사용 가능한 Docker E2E 실행 구간을 실행합니다. 프로필은 범위가 넓어지는 순서대로 `smoke`, `package`, `product`, `full`이며, 명시적인 실행 구간 목록을 위한 `custom`도 있습니다. 패키지/업데이트/Plugin 계약, 게시된 업그레이드 생존 매트릭스, 릴리스 기본값 및 실패 분류에 대해서는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.
- 빌드 및 릴리스 검사는 tsdown 이후 `scripts/check-cli-bootstrap-imports.mjs`를 실행합니다. 이 보호 장치는 `dist/entry.js`와 `dist/cli/run-main.js`에서 시작하는 정적 빌드 그래프를 탐색하며, 명령 디스패치 전에 해당 사전 디스패치 부트스트랩 그래프가 외부 패키지(Commander, 프롬프트 UI, undici, 로깅 및 이와 유사하게 시작 비용이 큰 종속성 포함)를 정적으로 가져오면 실패합니다. 또한 번들된 Gateway 실행 청크를 70 KB로 제한하고 해당 청크에서 사용 빈도가 낮은 것으로 알려진 Gateway 경로(`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`)를 정적으로 가져오는 것을 거부합니다. 별도로 `scripts/release-check.ts`는 패키징된 CLI를 `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` 및 `models list --provider openai`로 스모크 테스트합니다.
- 패키지 승인 레거시 호환성은 `2026.4.25`까지로 제한됩니다(`2026.4.25-beta.*` 포함). 이 기준 버전까지 하네스가 허용하는 것은 출시된 패키지의 메타데이터 누락뿐입니다. 즉, 비공개 QA 인벤토리 항목 생략, `gateway install --wrapper` 누락, 타르볼에서 파생된 Git 픽스처의 패치 파일 누락, 지속 저장된 `update.channel` 누락, 레거시 Plugin 설치 기록 위치, 마켓플레이스 설치 기록 지속성 누락 및 `plugins update` 중의 구성 메타데이터 마이그레이션입니다. `2026.4.25` 이후 패키지에서는 이러한 경로가 엄격한 실패로 처리됩니다.
- 컨테이너 스모크 실행기: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` 및 `test:docker:config-reload`은 하나 이상의 실제 컨테이너를 부팅하고 상위 수준 통합 경로를 검증합니다.
- `scripts/lib/openclaw-e2e-instance.sh`를 통해 패키징된 OpenClaw 타르볼을 설치하는 Docker/Bash E2E 실행 구간은 `npm install`을 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`으로 제한합니다(기본값 `600s`, 디버깅을 위해 래퍼를 비활성화하려면 `0` 설정).

라이브 모델 Docker 실행기는 필요한 CLI 인증 홈만 바인드 마운트하고
(실행 범위가 좁혀지지 않은 경우 지원되는 모든 인증 홈), 실행 전에 이를
컨테이너 홈으로 복사합니다. 따라서 외부 CLI OAuth가 호스트 인증 저장소를
변경하지 않고 토큰을 갱신할 수 있습니다.

- 직접 모델: `pnpm test:docker:live-models`(스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크 테스트: `pnpm test:docker:live-acp-bind`(스크립트: `scripts/test-live-acp-bind-docker.sh`, 기본적으로 Claude, Codex 및 Gemini를 포함하며, `pnpm test:docker:live-acp-bind:droid`와 `pnpm test:docker:live-acp-bind:opencode`를 통해 엄격한 Droid/OpenCode 범위 제공)
- CLI 백엔드 스모크 테스트: `pnpm test:docker:live-cli-backend`(스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex 앱 서버 하네스 스모크 테스트: `pnpm test:docker:live-codex-harness`(스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 개발 에이전트: `pnpm test:docker:live-gateway`(스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 관측 가능성 스모크 테스트: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` 및 `pnpm qa:observability:smoke`는 비공개 QA 소스 체크아웃 실행 구간입니다. npm 타르볼에는 QA Lab이 포함되지 않으므로 의도적으로 패키지 Docker 릴리스 실행 구간에 포함되지 않습니다.
- Open WebUI 라이브 스모크 테스트: `pnpm test:docker:openwebui`(스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard`(스크립트: `scripts/e2e/onboard-docker.sh`)
- npm 타르볼 온보딩/채널/에이전트 스모크 테스트: `pnpm test:docker:npm-onboard-channel-agent`는 패키징된 OpenClaw 타르볼을 Docker에 전역 설치하고, 환경 변수 참조 온보딩을 통해 OpenAI를 구성하며 기본적으로 Telegram도 구성한 다음, doctor를 실행하고 모의 OpenAI 에이전트 턴 하나를 실행합니다. 미리 빌드된 타르볼을 재사용하려면 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`를 사용하고, 호스트 재빌드를 건너뛰려면 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`을 설정하거나, 채널을 전환하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 또는 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`을 설정하세요.

- 릴리스 사용자 여정 스모크 테스트: `pnpm test:docker:release-user-journey`는 패키징된 OpenClaw tarball을 깨끗한 Docker 홈에 전역 설치하고, 온보딩을 실행하고, 모의 OpenAI 공급자를 구성하고, 에이전트 턴을 실행하고, 외부 Plugin을 설치/제거하고, 로컬 픽스처를 대상으로 ClickClack을 구성하고, 발신/수신 메시징을 검증하고, Gateway를 재시작한 뒤 doctor를 실행합니다.
- 릴리스 유형 기반 온보딩 스모크 테스트: `pnpm test:docker:release-typed-onboarding`은 패키징된 tarball을 설치하고, 실제 TTY를 통해 `openclaw onboard`를 구동하고, OpenAI를 환경 변수 참조 공급자로 구성하고, 원시 키가 영구 저장되지 않는지 검증한 뒤 모의 에이전트 턴을 실행합니다.
- 릴리스 미디어/메모리 스모크 테스트: `pnpm test:docker:release-media-memory`는 패키징된 tarball을 설치하고, PNG 첨부 파일의 이미지 이해, OpenAI 호환 이미지 생성 출력, 메모리 검색 회상, Gateway 재시작 후에도 회상이 유지되는지를 검증합니다.
- 릴리스 업그레이드 사용자 여정 스모크 테스트: `pnpm test:docker:release-upgrade-user-journey`는 기본적으로 후보 tarball보다 오래된 게시 버전 중 가장 최신 기준 버전을 설치하고, 게시된 패키지에서 공급자/Plugin/ClickClack 상태를 구성하고, 후보 tarball로 업그레이드한 다음 핵심 에이전트/Plugin/채널 여정을 다시 실행합니다. 더 오래된 게시 기준 버전이 없으면 후보 버전을 재사용합니다. `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`으로 기준 버전을 재정의할 수 있습니다.
- 릴리스 Plugin 마켓플레이스 스모크 테스트: `pnpm test:docker:release-plugin-marketplace`는 로컬 픽스처 마켓플레이스에서 설치하고, 설치된 Plugin을 업데이트하고, 제거한 뒤 설치 메타데이터가 정리되면서 Plugin CLI가 사라지는지 검증합니다.
- Skill 설치 스모크 테스트: `pnpm test:docker:skill-install`은 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, 구성에서 업로드된 아카이브 설치를 비활성화하고, 검색을 통해 현재 실제 ClawHub Skill 슬러그를 확인하고, `openclaw skills install`로 설치한 뒤 설치된 Skill과 `.clawhub` 출처/잠금 메타데이터를 검증합니다.
- 업데이트 채널 전환 스모크 테스트: `pnpm test:docker:update-channel-switch`는 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, 패키지 `stable`에서 git `dev`로 전환하고, 영구 저장된 채널과 업데이트 후 Plugin 작동을 검증한 다음 패키지 `stable`로 다시 전환하고 업데이트 상태를 확인합니다.
- 업그레이드 생존성 스모크 테스트: `pnpm test:docker:upgrade-survivor`는 에이전트, 채널 구성, Plugin 허용 목록, 오래된 Plugin 종속성 상태, 기존 워크스페이스/세션 파일이 포함된 정리되지 않은 이전 사용자 픽스처 위에 패키징된 OpenClaw tarball을 설치합니다. 실제 공급자 또는 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, local loopback Gateway를 시작하고 구성/상태 보존과 시작/상태 시간 예산을 확인합니다.
- 게시 버전 업그레이드 생존성 스모크 테스트: `pnpm test:docker:published-upgrade-survivor`는 기본적으로 `openclaw@latest`를 설치하고, 현실적인 기존 사용자 파일을 시드하고, 내장된 명령 레시피로 해당 기준 버전을 구성하고, 생성된 구성을 검증하고, 게시된 설치를 후보 tarball로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 작성한 다음 local loopback Gateway를 시작하고 구성된 의도, 상태 보존, 시작, `/healthz`, `/readyz`, RPC 상태 시간 예산을 확인합니다. 단일 기준 버전은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 재정의할 수 있으며, 집계 스케줄러가 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` 같은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 정확한 로컬 기준 버전을 확장하도록 요청할 수 있고, `reported-issues` 같은 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`로 이슈 형태의 픽스처를 확장할 수 있습니다. 보고된 이슈 집합에는 외부 OpenClaw Plugin 설치 자동 복구를 위한 `configured-plugin-installs`가 포함됩니다. 패키지 승인에서는 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출하고, `last-stable-4` 또는 `all-since-2026.4.23` 같은 메타 기준 버전 토큰을 해석하며, 전체 릴리스 검증에서는 릴리스 장시간 검증 패키지 게이트를 `last-stable-4 2026.4.23 2026.5.2 2026.4.15`와 `reported-issues`로 확장합니다.
- 세션 런타임 컨텍스트 스모크 테스트: `pnpm test:docker:session-runtime-context`는 숨겨진 런타임 컨텍스트 트랜스크립트의 영구 저장과 영향을 받는 중복 프롬프트 재작성 분기에 대한 doctor 복구를 검증합니다.
- Bun 전역 설치 스모크 테스트: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패키징하고, 격리된 홈에서 `bun install -g`로 설치한 뒤 `openclaw infer image providers --json`이 멈추지 않고 번들 이미지 공급자를 반환하는지 검증합니다. `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 미리 빌드된 tarball을 재사용하거나, `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`으로 호스트 빌드를 건너뛰거나, `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`로 빌드된 Docker 이미지에서 `dist/`를 복사할 수 있습니다.
- 설치 프로그램 Docker 스모크 테스트: `bash scripts/test-install-sh-docker.sh`는 루트, 업데이트, 직접 npm 컨테이너에서 하나의 npm 캐시를 공유합니다. 업데이트 스모크 테스트는 후보 tarball로 업그레이드하기 전 안정 기준 버전으로 기본적으로 npm `latest`를 사용합니다. 로컬에서는 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`로, GitHub에서는 설치 스모크 워크플로의 `update_baseline_version` 입력으로 재정의할 수 있습니다. 비루트 설치 프로그램 검사는 루트 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않도록 격리된 npm 캐시를 유지합니다. 로컬 재실행 간에 루트/업데이트/직접 npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정합니다.
- 설치 스모크 CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`을 사용해 중복되는 직접 npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 범위 검증이 필요하면 해당 환경 변수 없이 스크립트를 로컬에서 실행합니다.
- 에이전트 공유 워크스페이스 삭제 CLI 스모크 테스트: `pnpm test:docker:agents-delete-shared-workspace`(스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에서 하나의 워크스페이스를 사용하는 두 에이전트를 시드하고, `agents delete --json`을 실행한 뒤 유효한 JSON과 워크스페이스 유지 동작을 검증합니다. `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`로 설치 스모크 이미지를 재사용할 수 있습니다.
- Gateway 네트워킹 및 호스트 수명 주기: `pnpm test:docker:gateway-network`(스크립트: `scripts/e2e/gateway-network-docker.sh`)는 두 컨테이너 LAN WebSocket 인증/상태 스모크 테스트를 유지한 다음, local loopback 관리 HTTP를 사용해 준비 차단, 유지된 제어 접근, 재개 복구, 준비된 동일 컨테이너 중지/시작을 입증합니다. 재시작 검사는 원래 임대가 만료되기 전에 완료되어야 하며, 영구 저장된 Gateway 구성과 컨테이너 ID는 유지되는 반면 일시 중단 상태는 프로세스 로컬임을 검증하고, 머신 판독 가능한 단계별 타이밍 JSON을 출력합니다.
- 브라우저 CDP 스냅샷 스모크 테스트: `pnpm test:docker:browser-cdp-snapshot`(스크립트: `scripts/e2e/browser-cdp-snapshot-docker.sh`)은 소스 E2E 이미지와 Chromium 계층을 빌드하고, 원시 CDP로 Chromium을 시작하고, `browser doctor --deep`을 실행한 뒤 CDP 역할 스냅샷이 링크 URL, 커서에 의해 클릭 가능으로 승격된 요소, iframe 참조, 프레임 메타데이터를 포함하는지 검증합니다.
- OpenAI Responses `web_search` 최소 추론 회귀 테스트: `pnpm test:docker:openai-web-search-minimal`(스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)은 Gateway를 통해 모의 OpenAI 서버를 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 높이는지 검증한 다음 공급자 스키마가 요청을 거부하도록 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + 원시 Claude 알림 프레임 스모크 테스트): `pnpm test:docker:mcp-channels`(스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw 번들 MCP 도구(실제 stdio MCP 서버 + 내장 OpenClaw 프로필 허용/거부 스모크 테스트): `pnpm test:docker:agent-bundle-mcp-tools`(스크립트: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/하위 에이전트 MCP 정리(격리된 Cron 및 일회성 하위 에이전트 실행 후 실제 Gateway + stdio MCP 자식 프로세스 종료): `pnpm test:docker:cron-mcp-cleanup`(스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin(로컬 경로, `file:`, 상위로 끌어올린 종속성이 있는 npm 레지스트리, 잘못된 npm 패키지 메타데이터, 이동하는 git 참조, ClawHub 종합 픽스처, 마켓플레이스 업데이트, Claude 번들 활성화/검사를 위한 설치/업데이트 스모크 테스트): `pnpm test:docker:plugins`(스크립트: `scripts/e2e/plugins-docker.sh`)
  ClawHub 블록을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하거나, 기본 종합 패키지/런타임 쌍을 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 및 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`로 재정의합니다. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`이 없으면 테스트는 완전히 격리된 로컬 ClawHub 픽스처 서버를 사용합니다.
- Plugin 업데이트 변경 없음 스모크 테스트: `pnpm test:docker:plugin-update`(스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin 수명 주기 매트릭스 스모크 테스트: `pnpm test:docker:plugin-lifecycle-matrix`는 빈 컨테이너에 패키징된 OpenClaw tarball을 설치하고, npm Plugin을 설치하고, 활성화/비활성화를 전환하고, 로컬 npm 레지스트리를 통해 업그레이드 및 다운그레이드하고, 설치된 코드를 삭제한 다음, 각 수명 주기 단계의 RSS/CPU 지표를 기록하면서 제거가 오래된 상태를 계속 삭제하는지 검증합니다.
- 구성 다시 로드 메타데이터 스모크 테스트: `pnpm test:docker:config-reload`(스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins`는 로컬 경로, `file:`, 상위로 끌어올린 종속성이 있는 npm 레지스트리, 이동하는 git 참조, ClawHub 픽스처, 마켓플레이스 업데이트, Claude 번들 활성화/검사에 대한 설치/업데이트 스모크 테스트를 다룹니다. `pnpm test:docker:plugin-update`는 설치된 Plugin의 변경 없는 업데이트 동작을 다룹니다. `pnpm test:docker:plugin-lifecycle-matrix`는 리소스를 추적하는 npm Plugin 설치, 활성화, 비활성화, 업그레이드, 다운그레이드, 코드 누락 상태의 제거를 다룹니다.

공유 기능 이미지를 수동으로 미리 빌드하고 재사용하려면 다음을 실행합니다.

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 제품군별 이미지 재정의가 설정되어 있으면 여전히 우선 적용됩니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리킬 때 해당 이미지가 로컬에 없으면 스크립트가 가져옵니다. QR 및 설치 프로그램 Docker 테스트는 공유 빌드 앱 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

실제 모델 Docker 실행기는 현재 체크아웃을 읽기 전용으로 바인드 마운트하고
컨테이너 내부의 임시 작업 디렉터리에 준비합니다. 이를 통해 런타임 이미지를
간결하게 유지하면서도 정확한 로컬 소스/구성을 대상으로 Vitest를 실행할 수
있습니다. 준비 단계에서는 `.pnpm-store`, `.worktrees`,
`__openclaw_vitest__`, 앱 로컬 `.build` 또는 Gradle 출력 디렉터리 같은
대용량 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로 Docker 실제 실행이
머신별 아티팩트를 복사하는 데 수 분을 소비하지 않습니다. 또한
`OPENCLAW_SKIP_CHANNELS=1`을 설정하여 Gateway 실제 프로브가 컨테이너
내부에서 실제 Telegram/Discord 등의 채널 워커를 시작하지 않도록 합니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로 해당 Docker
실행 경로에서 Gateway 실제 검증 범위를 좁히거나 제외해야 할 때는
`OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하십시오.

`test:docker:openwebui`는 상위 수준의 호환성 스모크 테스트입니다. OpenAI 호환 HTTP 엔드포인트를 활성화한 OpenClaw Gateway 컨테이너를 시작하고, 해당 Gateway를 대상으로 고정 버전의 Open WebUI 컨테이너를 시작한 다음, Open WebUI를 통해 로그인하고 `/api/models`가 `openclaw/default`를 노출하는지 확인한 후 Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 전송합니다. 라이브 모델 완료를 기다리지 않고 Open WebUI 로그인과 모델 검색 후 중단해야 하는 릴리스 경로 CI 검사에서는 `OPENWEBUI_SMOKE_MODE=models`를 설정하세요. 첫 실행은 Docker가 Open WebUI 이미지를 가져오고 Open WebUI가 자체 콜드 스타트 설정을 완료해야 할 수 있으므로 눈에 띄게 느릴 수 있습니다. 이 실행 경로에는 프로세스 환경, 준비된 인증 프로필 또는 명시적인 `OPENCLAW_PROFILE_FILE`을 통해 제공되는 사용 가능한 라이브 모델 키가 필요합니다. 성공한 실행은 `{ "ok": true, "model": "openclaw/default", ... }`와 같은 작은 JSON 페이로드를 출력합니다.

`test:docker:mcp-channels`는 의도적으로 결정론적이며 실제 Telegram, Discord 또는 iMessage 계정이 필요하지 않습니다. 시드 데이터가 포함된 Gateway 컨테이너를 부팅하고, `openclaw mcp serve`를 생성하는 두 번째 컨테이너를 시작한 다음, 실제 stdio MCP 브리지를 통해 라우팅된 대화 검색, 트랜스크립트 읽기, 첨부 파일 메타데이터, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅 및 Claude 스타일의 채널 및 권한 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을 직접 검사하므로, 특정 클라이언트 SDK가 우연히 노출하는 내용만이 아니라 브리지가 실제로 내보내는 내용을 스모크 테스트가 검증합니다.

`test:docker:agent-bundle-mcp-tools`는 결정론적이며 라이브 모델 키가 필요하지 않습니다. 저장소 Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP 프로브 서버를 시작하고, 내장된 OpenClaw 번들 MCP 런타임을 통해 해당 서버를 구체화하고, 도구를 실행한 다음, `coding`과 `messaging`은 `bundle-mcp` 도구를 유지하는 반면 `minimal`과 `tools.deny: ["bundle-mcp"]`는 해당 도구를 필터링하는지 검증합니다.

`test:docker:cron-mcp-cleanup`은 결정론적이며 라이브 모델 키가 필요하지 않습니다. 실제 stdio MCP 프로브 서버가 포함된 시드 Gateway를 시작하고, 격리된 Cron 턴과 `sessions_spawn` 일회성 자식 턴을 실행한 다음, 각 실행 후 MCP 자식 프로세스가 종료되는지 검증합니다.

수동 ACP 자연어 스레드 스모크 테스트(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 회귀/디버그 워크플로를 위해 이 스크립트를 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 환경 변수:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)은 `/home/node/.openclaw`에 마운트됨
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)은 `/home/node/.openclaw/workspace`에 마운트됨
- `OPENCLAW_PROFILE_FILE=...`은 테스트 실행 전에 마운트되고 로드됨
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 임시 구성/작업 공간 디렉터리를 사용하고 외부 CLI 인증 마운트 없이 `OPENCLAW_PROFILE_FILE`에서 로드된 환경 변수만 검증함
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: 실행에서 이미 CI/관리형 바인드 디렉터리를 사용하지 않는 한 `~/.cache/openclaw/docker-cli-tools`)은 Docker 내부의 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트됨
- `$HOME` 아래의 외부 CLI 인증 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음 테스트 시작 전에 `/home/node/...`로 복사됨
  - 기본 디렉터리(실행 범위가 특정 제공자로 제한되지 않은 경우 사용): `.factory`, `.gemini`, `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 제공자 범위가 제한된 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 디렉터리/파일만 마운트함
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`와 같은 쉼표 구분 목록으로 수동 재정의
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`은 실행 범위를 제한함
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`는 컨테이너 내부의 제공자를 필터링함
- `OPENCLAW_SKIP_DOCKER_BUILD=1`은 재빌드가 필요하지 않은 재실행에서 기존 `openclaw:local-live` 이미지를 재사용함
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`은 자격 증명이 환경이 아닌 프로필 저장소에서 제공되도록 보장함
- `OPENCLAW_OPENWEBUI_MODEL=...`은 Open WebUI 스모크 테스트를 위해 Gateway가 노출하는 모델을 선택함
- `OPENCLAW_OPENWEBUI_PROMPT=...`는 Open WebUI 스모크 테스트에서 사용하는 논스 검사 프롬프트를 재정의함
- `OPENWEBUI_IMAGE=...`은 고정된 Open WebUI 이미지 태그를 재정의함

## 문서 건전성 검사

문서를 편집한 후 문서 검사를 실행하세요: `pnpm check:docs`.
페이지 내 제목 검사도 필요한 경우 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀 테스트(CI 안전)

다음은 실제 제공자 없이 수행하는 "실제 파이프라인" 회귀 테스트입니다.

- Gateway 도구 호출(모의 OpenAI, 실제 Gateway + 에이전트 루프): `src/gateway/gateway.test.ts`(케이스: "Gateway 에이전트 루프를 통해 모의 OpenAI 도구 호출을 엔드투엔드로 실행")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, 구성 작성 + 인증 적용): `src/gateway/gateway.test.ts`(케이스: "WS를 통해 마법사를 실행하고 인증 토큰 구성을 작성")

## 에이전트 신뢰성 평가(Skills)

이미 "에이전트 신뢰성 평가"처럼 동작하는 몇 가지 CI 안전 테스트가 있습니다.

- 실제 Gateway + 에이전트 루프를 통한 모의 도구 호출(`src/gateway/gateway.test.ts`).
- 세션 연결과 구성 효과를 검증하는 엔드투엔드 마법사 흐름(`src/gateway/gateway.test.ts`).

Skills와 관련해 아직 누락된 항목([Skills](/ko/tools/skills) 참조):

- **의사 결정:** 프롬프트에 Skills가 나열되었을 때 에이전트가 올바른 Skill을 선택하거나 관련 없는 Skill을 피하는가?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필수 단계/인수를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 기록 승계 및 샌드박스 경계를 단언하는 다중 턴 시나리오.

향후 평가는 먼저 결정론적으로 유지해야 합니다.

- 모의 제공자를 사용하여 도구 호출과 순서, Skill 파일 읽기 및 세션 연결을 단언하는 시나리오 실행기.
- Skill 중심 시나리오의 소규모 모음(사용 여부, 게이팅, 프롬프트 인젝션).
- CI 안전 모음이 마련된 후에만 선택적 라이브 평가(옵트인, 환경 변수로 제어).

## 계약 테스트(Plugin 및 채널 형태)

계약 테스트는 등록된 모든 Plugin과 채널이 해당 인터페이스 계약을 준수하는지 검증합니다. 검색된 모든 Plugin을 순회하며 형태와 동작에 대한 단언 모음을 실행합니다. 기본 `pnpm test` 단위 테스트 실행 경로는 이러한 공유 경계 및 스모크 파일을 의도적으로 건너뜁니다. 공유 채널 또는 제공자 표면을 수정할 때는 계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- 제공자 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 있습니다. 현재 최상위 범주는 다음과 같습니다.

- **채널 카탈로그** - 번들/레지스트리 채널 카탈로그 항목 메타데이터
- **Plugin**(레지스트리 기반, 샤딩됨) - 기본 Plugin 등록 형태
- **표면 전용**(레지스트리 기반, 샤딩됨) - `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory`, `gateway`에 대한 표면별 형태 검사
- **세션 바인딩**(레지스트리 기반) - 세션 바인딩 동작
- **아웃바운드 페이로드** - 메시지 페이로드 구조 및 정규화
- **그룹 정책**(폴백) - 채널별 기본 그룹 정책 적용
- **스레딩**(레지스트리 기반, 샤딩됨) - 스레드 ID 처리
- **디렉터리**(레지스트리 기반, 샤딩됨) - 디렉터리/명단 API
- **레지스트리** 및 **Plugin 핵심.\*** - 채널 Plugin 레지스트리, 로더 및 구성 쓰기 권한 부여 내부 구조

이러한 테스트 모음에서 사용하는 인바운드 디스패치 캡처 및 아웃바운드 페이로드 하네스 도우미는 `src/plugin-sdk/channel-contract-testing.ts`를 통해 내부적으로 노출됩니다(npm에서 제외되며 공개 SDK 하위 경로가 아님). 이 디렉터리에는 독립적인 `inbound.contract.test.ts` 파일이 없습니다.

### 제공자 계약

`src/plugins/contracts/*.contract.test.ts`에 있습니다. 현재 범주는 다음을 포함합니다.

- **형태** - Plugin 매니페스트, API 및 런타임 내보내기 형태
- **Plugin 등록**(+ 병렬) - 매니페스트 등록 사례
- **패키지 매니페스트** - 패키지 매니페스트 요구 사항
- **로더** - Plugin 로더 설정/해제 동작
- **레지스트리** - Plugin 계약 레지스트리 내용 및 조회
- **제공자** - 번들 제공자 및 웹 검색 제공자 전반의 공유 제공자 동작
- **인증 선택** - 인증 선택 메타데이터 및 설정 동작
- **제공자 카탈로그 사용 중단** - 사용 중단된 제공자 카탈로그 메타데이터
- **마법사 선택 해석**, **마법사 모델 선택기**, **마법사 설정 옵션** - 제공자 설정 마법사 계약
- **임베딩 제공자**, **메모리 임베딩 제공자**, **웹 가져오기 제공자**, **TTS** - 기능별 제공자 계약
- **세션 작업**, **세션 첨부 파일**, **세션 항목 투영** - Plugin 소유 세션 상태 계약
- **예약된 턴** - Plugin 예약 턴 메타데이터 및 타임스탬프 범위
- **호스트 훅**, **실행 컨텍스트 수명 주기**, **런타임 가져오기 부작용**, **런타임 경계** - Plugin 호스트/런타임 수명 주기 및 가져오기 경계 계약
- **확장 런타임 종속성** - 확장의 런타임 종속성 배치

### 실행 시점

- Plugin SDK 내보내기 또는 하위 경로를 변경한 후
- 채널 또는 제공자 Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 검색을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 테스트 추가(지침)

라이브 환경에서 발견된 제공자/모델 문제를 수정할 때:

- 가능하면 CI 안전 회귀 테스트를 추가하세요(모의/스텁 제공자 또는 정확한 요청 형태 변환 캡처).
- 본질적으로 라이브 전용인 경우(속도 제한, 인증 정책) 라이브 테스트 범위를 좁게 유지하고 환경 변수를 통해 옵트인하도록 하세요.
- 버그를 포착하는 가장 작은 계층을 대상으로 하는 것이 좋습니다.
  - 제공자 요청 변환/재생 버그 -> 직접 모델 테스트
  - Gateway 세션/기록/도구 파이프라인 버그 -> Gateway 라이브 스모크 테스트 또는 CI 안전 Gateway 모의 테스트
- SecretRef 순회 보호 장치:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스별로 하나의 샘플 대상을 도출한 다음, 순회 세그먼트 실행 ID가 거부되는지 단언합니다.
  - `src/secrets/target-registry-data.ts`에 새로운 `includeInPlan` SecretRef 대상 계열을 추가하는 경우 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 ID에서 의도적으로 실패하므로 새 클래스를 조용히 건너뛸 수 없습니다.

## 관련 항목

- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)
- [CI](/ko/ci)
