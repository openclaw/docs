---
read_when:
    - 테스트 실행 또는 수정
summary: 로컬에서 테스트를 실행하는 방법(vitest) 및 force/coverage 모드를 사용하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-06-27T18:09:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- 전체 테스트 키트(스위트, 라이브, Docker): [테스트](/ko/help/testing)
- 업데이트 및 Plugin 패키지 검증: [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)

- 일반적인 로컬 테스트 순서:
  1. 변경 범위 Vitest 증명에는 `pnpm test:changed`.
  2. 단일 파일, 디렉터리 또는 명시적 대상에는 `pnpm test <path-or-filter>`.
  3. 전체 로컬 Vitest 스위트가 의도적으로 필요할 때만 `pnpm test`.
- `pnpm test:force`: 기본 제어 포트를 점유한 남아 있는 gateway 프로세스를 종료한 다음, 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 격리된 Gateway 포트로 전체 Vitest 스위트를 실행합니다. 이전 Gateway 실행으로 포트 18789가 점유된 경우 사용하세요.
- `pnpm test:coverage`: V8 커버리지로 단위 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 이는 기본 단위 레인 커버리지 게이트이며, 저장소 전체의 모든 파일 커버리지가 아닙니다. 임계값은 줄/함수/문장 70%, 분기 55%입니다. `coverage.all`이 false이고 기본 레인이 커버리지 포함 범위를 형제 소스 파일이 있는 비고속 단위 테스트로 한정하므로, 이 게이트는 우연히 로드한 모든 전이 import가 아니라 이 레인이 소유한 소스를 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 단위 커버리지를 실행합니다.
- `pnpm test:changed`: 저비용 스마트 변경 테스트 실행입니다. 직접 테스트 편집, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import 그래프에서 정밀한 대상을 실행합니다. 광범위한 설정/패키지 변경은 정밀 테스트에 매핑되지 않는 한 건너뜁니다.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 명시적인 광범위 변경 테스트 실행입니다. 테스트 하네스/설정/패키지 편집이 Vitest의 더 넓은 변경 테스트 동작으로 fallback해야 할 때 사용하세요.
- `pnpm changed:lanes`: `origin/main` 대비 diff가 트리거한 아키텍처 레인을 표시합니다.
- `pnpm check:changed`: CI 외부에서는 기본적으로 Crabbox/Testbox에 위임한 다음, 원격 자식 안에서 `origin/main` 대비 diff에 대한 스마트 변경 검사 게이트를 실행합니다. 영향을 받는 아키텍처 레인에 대해 typecheck, lint, guard 명령을 실행하지만 Vitest 테스트는 실행하지 않습니다. 테스트 증명에는 `pnpm test:changed` 또는 명시적 `pnpm test <target>`을 사용하세요.
- Codex worktree 및 linked/sparse 체크아웃: pnpm이 의존성을 재조정하지 않는다는 것을 확인하지 않았다면 직접 로컬 `pnpm test*`, `pnpm check*`, `pnpm crabbox:run`을 피하세요. 아주 작은 명시적 파일 증명에는 `node scripts/run-vitest.mjs <path-or-filter>`를 사용하세요. 변경 게이트나 광범위 증명에는 pnpm이 Testbox 내부에서 실행되도록 `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`를 사용하세요.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` 및 대상 지정 `pnpm test ...` 같은 명령에서 heavy-check 직렬화를 Git 공통 디렉터리 대신 현재 worktree 내부에 유지합니다. linked worktree 전반에 걸쳐 독립적인 검사를 의도적으로 실행하는 고용량 로컬 호스트에서만 사용하세요.
- `pnpm test`: 명시적 파일/디렉터리 대상을 범위 지정 Vitest 레인으로 라우팅합니다. 대상 없는 실행은 전체 스위트 증명입니다. 고정 샤드 그룹을 사용하고, 로컬 병렬 실행을 위해 리프 설정으로 확장하며, 시작 전에 예상 로컬 샤드 fanout을 출력합니다. 확장 그룹은 항상 하나의 거대한 루트 프로젝트 프로세스 대신 확장별 샤드 설정으로 확장됩니다.
- 테스트 wrapper 실행은 짧은 `[test] passed|failed|skipped ... in ...` 요약으로 끝납니다. Vitest 자체 duration 줄은 샤드별 세부 정보로 유지됩니다.
- 공유 OpenClaw 테스트 상태: 테스트에 격리된 `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, 설정 fixture, workspace, agent dir 또는 auth-profile store가 필요할 때 Vitest에서 `src/test-utils/openclaw-test-state.ts`를 사용하세요.
- `pnpm test:env-mutations:report`: `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` 또는 관련 OpenClaw env 키를 직접 변경하는 테스트와 하네스에 대한 비차단 보고서입니다. 공유 test-state helper로 migration할 후보를 찾는 데 사용하세요.
- Control UI 모의 E2E: Vite Control UI를 시작하고 모의 Gateway WebSocket을 상대로 실제 Chromium 페이지를 구동하는 Vitest + Playwright 레인에는 `pnpm test:ui:e2e`를 사용하세요. 테스트는 `ui/src/**/*.e2e.test.ts`에 있으며, 공유 mock과 control은 `ui/src/test-helpers/control-ui-e2e.ts`에 있습니다. `pnpm test:e2e`에는 이 레인이 포함됩니다. Codex worktree에서는 의존성이 설치된 뒤 작은 대상 지정 증명에는 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`를 선호하고, 더 광범위한 GUI 증명에는 Testbox/Crabbox를 사용하세요.
- 프로세스 E2E helper: Vitest 프로세스 수준 E2E 테스트에 실행 중인 Gateway, CLI env, 로그 캡처, 정리가 한곳에 필요할 때 `test/helpers/openclaw-test-instance.ts`를 사용하세요.
- TUI PTY 테스트: 빠른 fake-backend PTY 레인에는 `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts`를 사용하세요. 외부 모델 엔드포인트만 mock하는 더 느린 `tui --local` smoke에는 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 또는 `pnpm tui:pty:test:watch --mode local`을 사용하세요. 원시 ANSI snapshot이 아니라 안정적인 표시 텍스트나 fixture 호출을 assert하세요.
- Docker/Bash E2E helper: `scripts/lib/docker-e2e-image.sh`를 source하는 레인은 `docker_e2e_test_state_shell_b64 <label> <scenario>`를 컨테이너로 전달하고 `scripts/lib/openclaw-e2e-instance.sh`로 decode할 수 있습니다. multi-home 스크립트는 `docker_e2e_test_state_function_b64`를 전달하고 각 flow에서 `openclaw_test_state_create <label> <scenario>`를 호출할 수 있습니다. 더 낮은 수준의 caller는 컨테이너 내부 shell snippet에는 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>`를 사용하거나, source 가능한 호스트 env 파일에는 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json`을 사용할 수 있습니다. `create` 앞의 `--`는 최신 Node runtime이 `--env-file`을 Node 플래그로 처리하지 않도록 합니다. Gateway를 시작하는 Docker/Bash 레인은 entrypoint 확인, 모의 OpenAI startup, Gateway foreground/background launch, readiness probe, state env export, log dump, process cleanup을 위해 컨테이너 안에서 `scripts/lib/openclaw-e2e-instance.sh`를 source할 수 있습니다.
- 전체, 확장, include-pattern 샤드 실행은 로컬 timing 데이터를 `.artifacts/vitest-shard-timings.json`에 업데이트합니다. 이후 whole-config 실행은 해당 timing을 사용해 느린 샤드와 빠른 샤드의 균형을 맞춥니다. include-pattern CI 샤드는 timing key에 샤드 이름을 추가하므로, whole-config timing 데이터를 대체하지 않고 filtered shard timing을 표시할 수 있습니다. 로컬 timing artifact를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 light 레인을 통해 라우팅되며, runtime-heavy case는 기존 레인에 남깁니다.
- 형제 테스트가 있는 소스 파일은 더 넓은 디렉터리 glob으로 fallback하기 전에 해당 형제로 매핑됩니다. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, `src/plugins/contracts` 아래의 helper 편집은 의존성 경로가 정밀할 때 모든 샤드를 광범위하게 실행하는 대신 로컬 import 그래프를 사용해 importing 테스트를 실행합니다.
- `auto-reply`는 이제 세 개의 전용 설정(`core`, `top-level`, `reply`)으로도 분할되어 reply 하네스가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않게 합니다.
- 기본 Vitest 설정은 이제 `pool: "threads"` 및 `isolate: false`를 기본값으로 하며, 공유 non-isolated runner가 저장소 설정 전반에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions` 및 `pnpm test extensions`는 모든 확장/Plugin 샤드를 실행합니다. 무거운 채널 Plugin, 브라우저 Plugin, OpenAI는 전용 샤드로 실행되며, 다른 Plugin 그룹은 batch 상태로 유지됩니다. 하나의 번들 Plugin 레인에는 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: 명시적 파일/디렉터리 대상에는 범위 지정 레인 라우팅을 계속 사용하면서 Vitest import-duration + import-breakdown reporting을 활성화합니다.
- `pnpm test:perf:imports:changed`: 동일한 import profiling이지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 동일한 commit된 git diff에 대해 routed changed-mode path를 native root-project run과 benchmark합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 먼저 commit하지 않고 현재 worktree 변경 set을 benchmark합니다.
- `pnpm test:perf:profile:main`: Vitest main thread의 CPU profile을 작성합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: unit runner의 CPU + heap profile을 작성합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 모든 full-suite Vitest leaf config를 직렬로 실행하고 grouped duration data와 per-config JSON/log artifact를 작성합니다. Test Performance Agent는 slow-test fix를 시도하기 전 이를 baseline으로 사용합니다.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 성능 중심 변경 후 grouped report를 비교합니다.
- `pnpm test:docker:timings <summary.json>`는 Docker all run 이후 느린 Docker 레인을 검사합니다. 동일한 artifact에서 저비용 대상 지정 rerun 명령을 출력하려면 `pnpm test:docker:rerun <run-id|summary.json|failures.json>`를 사용하세요.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: 저장소 E2E aggregate를 실행합니다. Gateway end-to-end smoke 테스트와 Control UI 모의 브라우저 E2E 레인을 포함합니다.
- `pnpm test:e2e:gateway`: Gateway end-to-end smoke 테스트를 실행합니다(multi-instance WS/HTTP/node pairing). `vitest.e2e.config.ts`에서 adaptive worker와 함께 `threads` + `isolate: false`가 기본값입니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 verbose log에는 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live 테스트를 실행합니다(minimax/zai). 건너뛰기를 해제하려면 API key와 `LIVE=1` 또는 provider별 `*_LIVE_TEST=1`이 필요합니다.
- `pnpm test:docker:all`: 공유 라이브 테스트 이미지를 빌드하고, OpenClaw를 npm tarball로 한 번 패킹하며, 기본 Node/Git 러너 이미지와 해당 tarball을 `/app`에 설치하는 기능 이미지를 빌드/재사용한 다음, 가중치 스케줄러를 통해 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 Docker 스모크 레인을 실행합니다. 기본 이미지(`OPENCLAW_DOCKER_E2E_BARE_IMAGE`)는 설치 관리자/업데이트/Plugin 의존성 레인에 사용되며, 해당 레인은 복사된 저장소 소스 대신 미리 빌드된 tarball을 마운트합니다. 기능 이미지(`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`)는 일반적인 빌드된 앱 기능 레인에 사용됩니다. `scripts/package-openclaw-for-docker.mjs`는 단일 로컬/CI 패키지 패커이며 Docker가 소비하기 전에 tarball과 `dist/postinstall-inventory.json`을 검증합니다. Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`는 선택된 계획을 실행합니다. `node scripts/test-docker-all.mjs --plan-json`은 Docker를 빌드하거나 실행하지 않고 선택된 레인, 이미지 종류, 패키지/라이브 이미지 필요 사항, 상태 시나리오, 자격 증명 검사를 위한 스케줄러 소유 CI 계획을 출력합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`은 프로세스 슬롯을 제어하며 기본값은 10입니다. `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`은 공급자에 민감한 tail 풀을 제어하며 기본값은 10입니다. 무거운 레인 제한의 기본값은 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. 공급자 제한은 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`를 통해 공급자당 무거운 레인 하나가 기본값입니다. 더 큰 호스트에는 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 사용하세요. 병렬성이 낮은 호스트에서 한 레인이 유효 가중치 또는 리소스 제한을 초과하더라도, 빈 풀에서는 시작할 수 있으며 용량을 해제할 때까지 단독으로 실행됩니다. 로컬 Docker 데몬 생성 폭주를 피하기 위해 레인 시작은 기본적으로 2초씩 엇갈리게 실행됩니다. `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`로 재정의하세요. 러너는 기본적으로 Docker 사전 검사를 수행하고, 오래된 OpenClaw E2E 컨테이너를 정리하며, 30초마다 활성 레인 상태를 출력하고, 호환되는 레인 간에 공급자 CLI 도구 캐시를 공유하며, 일시적인 라이브 공급자 실패를 기본적으로 한 번 재시도하고(`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), 이후 실행에서 가장 오래 걸리는 항목 우선 정렬을 위해 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장합니다. Docker를 실행하지 않고 레인 매니페스트를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 상태 출력을 조정하려면 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`를 사용하거나, 타이밍 재사용을 비활성화하려면 `OPENCLAW_DOCKER_ALL_TIMINGS=0`을 사용하세요. 결정적/로컬 레인만 실행하려면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`을 사용하고, 라이브 공급자 레인만 실행하려면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`를 사용하세요. 패키지 별칭은 `pnpm test:docker:local:all` 및 `pnpm test:docker:live:all`입니다. 라이브 전용 모드는 main 및 tail 라이브 레인을 하나의 가장 오래 걸리는 항목 우선 풀로 병합하여 공급자 버킷이 Claude, Codex, Gemini 작업을 함께 배치할 수 있게 합니다. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되어 있지 않으면 러너는 첫 번째 실패 이후 새 풀링 레인 스케줄링을 중지합니다. 각 레인에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있는 120분 fallback 제한 시간이 있으며, 선택된 라이브/tail 레인은 더 엄격한 레인별 제한을 사용합니다. CLI 백엔드 Docker 설정 명령에는 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`(기본값 180)를 통한 자체 제한 시간이 있습니다. 레인별 로그, `summary.json`, `failures.json`, 단계 타이밍은 `.artifacts/docker-tests/<run-id>/` 아래에 작성됩니다. 느린 레인을 검사하려면 `pnpm test:docker:timings <summary.json>`를 사용하고, 저렴한 대상 재실행 명령을 출력하려면 `pnpm test:docker:rerun <run-id|summary.json|failures.json>`를 사용하세요.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium 기반 소스 E2E 컨테이너를 빌드하고, 원시 CDP와 격리된 Gateway를 시작하며, `browser doctor --deep`을 실행하고, CDP 역할 스냅샷에 링크 URL, 커서 승격 클릭 가능 요소, iframe 참조, 프레임 메타데이터가 포함되어 있는지 검증합니다.
- `pnpm test:docker:skill-install`: 기본 Docker 러너에 패킹된 OpenClaw tarball을 설치하고, `skills.install.allowUploadedArchives`를 비활성화하며, 라이브 ClawHub 검색에서 현재 skill slug를 해석하고, `openclaw skills install`을 통해 설치한 뒤, `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, `skills info --json`을 검증합니다.
- CLI 백엔드 라이브 Docker 프로브는 예를 들어 `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume`, `pnpm test:docker:live-cli-backend:claude:mcp` 같은 집중 레인으로 실행할 수 있습니다. Gemini에는 대응되는 `:resume` 및 `:mcp` 별칭이 있습니다.
- `pnpm test:docker:openwebui`: Docker화된 OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인하며, `/api/models`를 확인한 다음 `/api/chat/completions`를 통해 실제 프록시된 채팅을 실행합니다. 사용 가능한 라이브 모델 키가 필요하고, 외부 Open WebUI 이미지를 가져오며, 일반 단위/e2e 제품군처럼 CI에서 안정적일 것으로 기대하지 않습니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 생성하는 두 번째 클라이언트 컨테이너를 시작한 다음, 실제 stdio 브리지를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 파일 메타데이터, 라이브 이벤트 큐 동작, outbound 전송 라우팅, Claude 스타일 채널 및 권한 알림을 검증합니다. Claude 알림 assertion은 원시 stdio MCP 프레임을 직접 읽으므로 스모크는 브리지가 실제로 출력하는 내용을 반영합니다.
- `pnpm test:docker:upgrade-survivor`: 지저분한 이전 사용자 fixture 위에 패킹된 OpenClaw tarball을 설치하고, 라이브 공급자 또는 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, loopback Gateway를 시작하고 agent, 채널 구성, Plugin allowlist, workspace/session 파일, 오래된 레거시 Plugin 의존성 상태, startup, RPC 상태가 유지되는지 확인합니다.
- `pnpm test:docker:published-upgrade-survivor`: 기본적으로 `openclaw@latest`를 설치하고, 라이브 공급자 또는 채널 키 없이 현실적인 기존 사용자 파일을 시드하며, 구워진 `openclaw config set` 명령 레시피로 해당 baseline을 구성하고, 게시된 설치를 패킹된 OpenClaw tarball로 업데이트하며, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 작성한 다음, loopback Gateway를 시작하고 구성된 intent, workspace/session 파일, 오래된 Plugin 구성 및 레거시 의존성 상태, startup, `/healthz`, `/readyz`, RPC 상태가 유지되거나 깔끔하게 복구되는지 확인합니다. 하나의 baseline은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 재정의하고, `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` 같은 정확한 로컬 matrix는 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 확장하거나, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`로 시나리오 fixture를 추가하세요. reported-issues 세트에는 업그레이드 중 구성된 외부 OpenClaw plugins가 자동으로 설치되는지 검증하는 `configured-plugin-installs`와 source-only Plugin shadow가 startup을 깨뜨리지 않도록 하는 `stale-source-plugin-shadow`가 포함됩니다. Package Acceptance는 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출하며, 정확한 패키지 spec을 Docker 레인에 전달하기 전에 `last-stable-4` 또는 `all-since-2026.4.23` 같은 meta baseline 토큰을 해석합니다.
- `pnpm test:docker:update-migration`: 정리가 많은 `plugin-deps-cleanup` 시나리오에서 published-upgrade survivor 하네스를 실행하며, 기본적으로 `openclaw@2026.4.23`에서 시작합니다. 별도의 `Update Migration` 워크플로는 이 레인을 `baselines=all-since-2026.4.23`로 확장하여 `.23` 이후의 모든 stable 게시 패키지가 후보로 업데이트되고 Full Release CI 외부에서 구성된 Plugin 의존성 정리가 증명되도록 합니다.
- `pnpm test:docker:plugins`: 로컬 경로, `file:`, hoisted 의존성이 있는 npm 레지스트리 패키지, git 이동 ref, ClawHub fixture, marketplace 업데이트, Claude 번들 enable/inspect에 대한 install/update 스모크를 실행합니다.

## 로컬 PR 게이트

로컬 PR 랜드/게이트 검사에는 다음을 실행하세요.

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

부하가 높은 호스트에서 `pnpm test`가 간헐적으로 실패하면 회귀로 간주하기 전에 한 번 다시 실행한 다음, `pnpm test <path/to/test>`로 격리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요.

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: "단일 단어로 답하세요: ok. 문장 부호나 추가 텍스트는 넣지 마세요."

마지막 실행(2025-12-31, 20회 실행):

- minimax 중앙값 1279ms(최소 1114, 최대 2431)
- opus 중앙값 2454ms(최소 1224, 최대 3170)

## CLI 시작 벤치

스크립트: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

사용법:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

프리셋:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 두 프리셋 모두

출력에는 각 명령의 `sampleCount`, 평균, p50, p95, 최소/최대, 종료 코드/시그널 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행마다 V8 프로파일을 기록하므로 타이밍과 프로파일 캡처가 같은 하네스를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 씁니다.
- `pnpm test:startup:bench:save`는 `runs=5`와 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 씁니다.
- `pnpm test:startup:bench:update`는 `runs=5`와 `warmup=1`을 사용해 체크인된 기준 픽스처를 `test/fixtures/cli-startup-bench.json`에서 새로 고칩니다.

체크인된 픽스처:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 새로 고치세요.
- `pnpm test:startup:bench:check`로 현재 결과를 픽스처와 비교하세요.

## Gateway 시작 벤치

스크립트: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

벤치마크는 기본적으로 `dist/entry.js`의 빌드된 CLI 엔트리를 사용합니다. 패키지 스크립트 명령을 사용하기 전에
`pnpm build`를 실행하세요. 대신 소스
러너를 측정하려면 `--entry scripts/run-node.mjs`를 전달하고, 해당 결과를
빌드된 엔트리 기준선과 분리해 두세요.

사용법:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

케이스 ID:

- `default`: 일반 Gateway 시작.
- `skipChannels`: 채널 시작을 건너뛴 Gateway 시작.
- `oneInternalHook`: 구성된 내부 훅 하나.
- `allInternalHooks`: 모든 내부 훅.
- `fiftyPlugins`: 매니페스트 Plugin 50개.
- `fiftyStartupLazyPlugins`: startup-lazy 매니페스트 Plugin 50개.

출력에는 첫 프로세스 출력, `/healthz`, `/readyz`, HTTP 수신 로그 시간,
Gateway 준비 로그 시간, CPU 시간, CPU 코어 비율, 최대 RSS, 힙, 시작 추적
메트릭, 이벤트 루프 지연, Plugin 조회 테이블 세부 메트릭이 포함됩니다. 이 스크립트는
자식 Gateway 환경에서 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`을 활성화합니다.

`/healthz`는 활성 상태로 읽으세요. HTTP 서버가 응답할 수 있다는 뜻입니다. `/readyz`는
사용 가능한 준비 상태로 읽으세요. 시작 Plugin 사이드카, 채널, 준비에 중요한
post-attach 작업이 안정화되었다는 뜻입니다. Gateway 시작 훅은
비동기적으로 디스패치되며 준비 보장의 일부가 아닙니다. 준비 로그 시간은
Gateway의 내부 준비 로그 타임스탬프입니다. 프로세스 측
귀속 분석에는 유용하지만 외부 `/readyz` 프로브를 대체하지는 않습니다.

변경 사항을 비교할 때는 JSON 출력 또는 `--output`을 사용하세요. 추적 출력만으로
import, compile 또는 CPU 바운드 작업을 단계 타이밍만으로 설명할 수 없다고 가리킬 때에만
`--cpu-prof-dir`를 사용하세요. 소스 러너 결과와
빌드된 `dist/entry.js` 결과를 같은 기준선으로 비교하지 마세요.

## Gateway 재시작 벤치

스크립트: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

재시작 벤치마크는 macOS와 Linux에서만 지원됩니다. 인프로세스 재시작에
SIGUSR1을 사용하며 Windows에서는 즉시 실패합니다.

벤치마크는 기본적으로 `dist/entry.js`의 빌드된 CLI 엔트리를 사용합니다. 패키지 스크립트 명령을 사용하기 전에
`pnpm build`를 실행하세요. 대신 소스
러너를 측정하려면 `--entry scripts/run-node.mjs`를 전달하고, 해당 결과를
빌드된 엔트리 기준선과 분리해 두세요.

사용법:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

케이스 ID:

- `skipChannels`: 채널을 건너뛴 재시작.
- `skipChannelsAcpxProbe`: 채널을 건너뛰고 ACPX 시작 프로브를 켠 재시작.
- `skipChannelsNoAcpxProbe`: 채널을 건너뛰고 ACPX 시작 프로브를 끈 재시작.
- `default`: 일반 재시작.
- `fiftyPlugins`: 매니페스트 Plugin 50개가 있는 재시작.

출력에는 다음 `/healthz`, 다음 `/readyz`, 다운타임, 재시작 준비 타이밍,
CPU, RSS, 대체 프로세스의 시작 추적 메트릭, 그리고 시그널 처리,
활성 작업 드레인, 종료 단계, 다음 시작, 준비 타이밍, 메모리 스냅샷에 대한 재시작 추적
메트릭이 포함됩니다. 이 스크립트는
자식 Gateway 환경에서 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 및 `OPENCLAW_GATEWAY_RESTART_TRACE=1`을 활성화합니다.

변경 사항이 재시작 시그널링, 종료 핸들러,
재시작 후 시작, 사이드카 종료, 서비스 핸드오프 또는 재시작 후 준비 상태를 건드릴 때 이 벤치마크를 사용하세요.
Gateway 메커니즘을 채널 시작과 분리해 격리할 때는 `skipChannels`로 시작하세요.
좁은 케이스가 재시작 경로를 설명한 뒤에만 `default` 또는 Plugin이 많은 케이스를 사용하세요.

추적 메트릭은 귀속 힌트이지 판정이 아닙니다. 재시작 변경은
여러 샘플, 일치하는 소유자 span, `/healthz` 및 `/readyz`
동작, 사용자에게 보이는 재시작 계약을 기준으로 판단해야 합니다.

## 온보딩 E2E(Docker)

Docker는 선택 사항입니다. 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 다음 Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR 가져오기 스모크(Docker)

지원되는 Docker Node 런타임(Node 24 기본, Node 22 호환)에서 유지관리되는 QR 런타임 헬퍼가 로드되는지 확인합니다.

```bash
pnpm test:docker:qr
```

## 관련

- [테스트](/ko/help/testing)
- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)
