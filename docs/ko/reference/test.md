---
read_when:
    - 테스트 실행 또는 수정
summary: 로컬에서 테스트(vitest)를 실행하는 방법과 force/coverage 모드를 사용하는 시점
title: 테스트
x-i18n:
    generated_at: "2026-05-02T21:13:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- 전체 테스트 키트(스위트, 라이브, Docker): [테스트](/ko/help/testing)
- 업데이트 및 Plugin 패키지 검증: [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)

- `pnpm test:force`: 기본 제어 포트를 잡고 있는 남아 있는 gateway 프로세스를 종료한 다음, 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 격리된 gateway 포트로 전체 Vitest 스위트를 실행합니다. 이전 gateway 실행으로 포트 18789가 점유된 상태로 남았을 때 사용하세요.
- `pnpm test:coverage`: V8 커버리지로 unit 스위트를 실행합니다(`vitest.unit.config.ts` 경유). 이는 전체 repo의 모든 파일 커버리지가 아니라, 로드된 파일 기준 unit 커버리지 게이트입니다. 임계값은 라인/함수/구문 70%, 브랜치 55%입니다. `coverage.all`이 false이므로 이 게이트는 모든 split-lane 소스 파일을 미커버 상태로 취급하지 않고 unit coverage suite에서 로드한 파일을 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 unit coverage를 실행합니다.
- `pnpm test:changed`: 저렴한 smart changed test 실행입니다. 직접 테스트 편집, sibling `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import graph에서 정밀 타깃을 실행합니다. 넓은 범위의 config/package 변경은 정밀 테스트에 매핑되지 않는 한 건너뜁니다.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 명시적인 broad changed test 실행입니다. 테스트 하네스/config/package 편집이 Vitest의 더 넓은 changed-test 동작으로 fallback되어야 할 때 사용하세요.
- `pnpm changed:lanes`: `origin/main`과의 diff로 트리거되는 아키텍처 lane을 표시합니다.
- `pnpm check:changed`: `origin/main`과의 diff에 대해 smart changed check gate를 실행합니다. 영향을 받는 아키텍처 lane에 대해 typecheck, lint, guard 명령을 실행하지만 Vitest 테스트는 실행하지 않습니다. 테스트 증명에는 `pnpm test:changed` 또는 명시적 `pnpm test <target>`을 사용하세요.
- `pnpm test`: 명시적 파일/디렉터리 타깃을 scoped Vitest lane으로 라우팅합니다. 타깃이 없는 실행은 고정 shard 그룹을 사용하고 로컬 병렬 실행을 위해 leaf config로 확장됩니다. extension 그룹은 항상 하나의 거대한 root-project 프로세스 대신 per-extension shard config로 확장됩니다.
- 테스트 wrapper 실행은 짧은 `[test] passed|failed|skipped ... in ...` 요약으로 끝납니다. Vitest 자체 duration 라인은 per-shard 세부 정보로 유지됩니다.
- 공유 OpenClaw 테스트 상태: 테스트에 격리된 `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir, auth-profile store가 필요할 때 Vitest에서 `src/test-utils/openclaw-test-state.ts`를 사용하세요.
- Process E2E helpers: Vitest process-level E2E 테스트에 실행 중인 Gateway, CLI env, log capture, cleanup이 한곳에서 필요할 때 `test/helpers/openclaw-test-instance.ts`를 사용하세요.
- Docker/Bash E2E helpers: `scripts/lib/docker-e2e-image.sh`를 source하는 lane은 `docker_e2e_test_state_shell_b64 <label> <scenario>`를 컨테이너에 전달하고 `scripts/lib/openclaw-e2e-instance.sh`로 디코딩할 수 있습니다. multi-home 스크립트는 `docker_e2e_test_state_function_b64`를 전달하고 각 flow에서 `openclaw_test_state_create <label> <scenario>`를 호출할 수 있습니다. 더 낮은 수준의 호출자는 in-container shell snippet에 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>`를 사용하거나, source 가능한 host env file에 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json`을 사용할 수 있습니다. `create` 앞의 `--`는 최신 Node 런타임이 `--env-file`을 Node flag로 처리하지 않도록 합니다. Gateway를 실행하는 Docker/Bash lane은 컨테이너 안에서 `scripts/lib/openclaw-e2e-instance.sh`를 source하여 entrypoint resolution, mock OpenAI startup, Gateway foreground/background launch, readiness probe, state env export, log dump, process cleanup을 수행할 수 있습니다.
- Full, extension, include-pattern shard 실행은 `.artifacts/vitest-shard-timings.json`의 로컬 timing 데이터를 업데이트합니다. 이후 whole-config 실행은 이 timing을 사용해 느린 shard와 빠른 shard의 균형을 맞춥니다. Include-pattern CI shard는 shard 이름을 timing key에 추가하므로, whole-config timing 데이터를 대체하지 않고 filtered shard timing을 볼 수 있게 유지합니다. 로컬 timing artifact를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 light lane을 거치며, runtime-heavy case는 기존 lane에 남겨 둡니다.
- sibling 테스트가 있는 소스 파일은 더 넓은 디렉터리 glob으로 fallback하기 전에 해당 sibling으로 매핑됩니다. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, `src/plugins/contracts` 아래 helper 편집은 dependency path가 정밀할 때 모든 shard를 broad-run하는 대신 로컬 import graph를 사용해 importing test를 실행합니다.
- `auto-reply`는 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로도 분리되어 reply harness가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않게 합니다.
- 기본 Vitest config는 이제 repo config 전반에서 공유 non-isolated runner가 활성화된 상태로 `pool: "threads"` 및 `isolate: false`를 기본값으로 사용합니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions` 및 `pnpm test extensions`는 모든 extension/Plugin shard를 실행합니다. 무거운 channel Plugin, browser Plugin, OpenAI는 전용 shard로 실행되며, 다른 Plugin 그룹은 batched 상태로 유지됩니다. 번들 Plugin lane 하나에는 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: 명시적 파일/디렉터리 타깃에 대해 scoped lane routing을 계속 사용하면서 Vitest import-duration 및 import-breakdown reporting을 활성화합니다.
- `pnpm test:perf:imports:changed`: 동일한 import profiling이지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 동일하게 커밋된 git diff에 대해 routed changed-mode path를 native root-project run과 비교해 benchmark합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 먼저 커밋하지 않고 현재 worktree change set을 benchmark합니다.
- `pnpm test:perf:profile:main`: Vitest main thread의 CPU profile을 작성합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: unit runner의 CPU 및 heap profile을 작성합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 모든 full-suite Vitest leaf config를 serial로 실행하고 grouped duration data와 per-config JSON/log artifact를 작성합니다. Test Performance Agent는 slow-test fix를 시도하기 전에 이를 baseline으로 사용합니다.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 성능 중심 변경 후 grouped report를 비교합니다.
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: gateway end-to-end smoke test(multi-instance WS/HTTP/node pairing)를 실행합니다. `vitest.e2e.config.ts`에서 adaptive worker와 함께 `threads` + `isolate: false`가 기본값입니다. `OPENCLAW_E2E_WORKERS=<n>`로 조정하고 verbose log에는 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live test(minimax/zai)를 실행합니다. unskip하려면 API key와 `LIVE=1`(또는 provider-specific `*_LIVE_TEST=1`)이 필요합니다.
- `pnpm test:docker:all`: 공유 live-test image를 빌드하고, OpenClaw를 npm tarball로 한 번 pack하고, bare Node/Git runner image와 해당 tarball을 `/app`에 설치하는 functional image를 빌드/재사용한 다음, weighted scheduler를 통해 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 Docker smoke lane을 실행합니다. bare image(`OPENCLAW_DOCKER_E2E_BARE_IMAGE`)는 installer/update/plugin-dependency lane에 사용되며, 이러한 lane은 복사된 repo source를 사용하는 대신 prebuilt tarball을 mount합니다. functional image(`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`)는 일반 built-app functionality lane에 사용됩니다. `scripts/package-openclaw-for-docker.mjs`는 단일 local/CI package packer이며 Docker가 소비하기 전에 tarball과 `dist/postinstall-inventory.json`을 검증합니다. Docker lane 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, planner logic은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`는 선택된 plan을 실행합니다. `node scripts/test-docker-all.mjs --plan-json`은 Docker를 빌드하거나 실행하지 않고 선택된 lane, image kind, package/live-image 필요 사항, state scenario, credential check에 대해 scheduler-owned CI plan을 내보냅니다. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`은 process slot을 제어하며 기본값은 10입니다. `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`은 provider-sensitive tail pool을 제어하며 기본값은 10입니다. Heavy lane cap은 기본적으로 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. provider cap은 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`를 통해 provider당 heavy lane 하나가 기본입니다. 더 큰 host에는 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 사용하세요. low-parallelism host에서 하나의 lane이 effective weight 또는 resource cap을 초과해도, 빈 pool에서 시작할 수 있으며 capacity를 release할 때까지 단독으로 실행됩니다. 로컬 Docker daemon create storm을 피하기 위해 lane start는 기본적으로 2초씩 stagger됩니다. `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`로 override하세요. runner는 기본적으로 Docker를 preflight하고, stale OpenClaw E2E container를 정리하며, 30초마다 active-lane status를 내보내고, 호환되는 lane 간 provider CLI tool cache를 공유하며, transient live-provider failure를 기본적으로 한 번 retry(`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)하고, 이후 실행에서 longest-first ordering을 위해 `.artifacts/docker-tests/lane-timings.json`에 lane timing을 저장합니다. Docker를 실행하지 않고 lane manifest를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, status output을 조정하려면 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`를 사용하거나, timing reuse를 비활성화하려면 `OPENCLAW_DOCKER_ALL_TIMINGS=0`을 사용하세요. deterministic/local lane만 실행하려면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`을 사용하고, live-provider lane만 실행하려면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`를 사용하세요. package alias는 `pnpm test:docker:local:all` 및 `pnpm test:docker:live:all`입니다. Live-only mode는 main 및 tail live lane을 하나의 longest-first pool로 병합하므로 provider bucket이 Claude, Codex, Gemini 작업을 함께 pack할 수 있습니다. runner는 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되지 않은 한 첫 failure 이후 새 pooled lane scheduling을 중지하며, 각 lane에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 override 가능한 120분 fallback timeout이 있습니다. 선택된 live/tail lane은 더 엄격한 per-lane cap을 사용합니다. CLI backend Docker setup 명령에는 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`(기본값 180)를 통한 자체 timeout이 있습니다. Per-lane log, `summary.json`, `failures.json`, phase timing은 `.artifacts/docker-tests/<run-id>/` 아래에 작성됩니다. 느린 lane을 검사하려면 `pnpm test:docker:timings <summary.json>`를 사용하고, 저렴한 targeted rerun 명령을 출력하려면 `pnpm test:docker:rerun <run-id|summary.json|failures.json>`을 사용하세요.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium-backed source E2E container를 빌드하고, raw CDP와 격리된 Gateway를 시작하고, `browser doctor --deep`을 실행한 다음 CDP role snapshot에 link URL, cursor-promoted clickable, iframe ref, frame metadata가 포함되는지 검증합니다.
- CLI backend live Docker probe는 focused lane으로 실행할 수 있습니다. 예: `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, `pnpm test:docker:live-cli-backend:codex:mcp`. Claude와 Gemini에도 일치하는 `:resume` 및 `:mcp` alias가 있습니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 sign in하고, `/api/models`를 확인한 다음 `/api/chat/completions`를 통해 실제 proxied chat을 실행합니다. 사용 가능한 live model key(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI image를 pull하며, 일반 unit/e2e suite처럼 CI-stable할 것으로 기대하지 않습니다.
- `pnpm test:docker:mcp-channels`: seeded Gateway container와 `openclaw mcp serve`를 spawn하는 두 번째 client container를 시작한 다음, routed conversation discovery, transcript read, attachment metadata, live event queue behavior, outbound send routing, real stdio bridge를 통한 Claude-style channel 및 permission notification을 검증합니다. Claude notification assertion은 raw stdio MCP frame을 직접 읽으므로 smoke가 bridge가 실제로 내보내는 내용을 반영합니다.
- `pnpm test:docker:upgrade-survivor`: 정리되지 않은 기존 사용자 픽스처 위에 패키징된 OpenClaw tarball을 설치하고, 라이브 제공자 또는 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, loopback Gateway를 시작하고 에이전트, 채널 구성, Plugin 허용 목록, 워크스페이스/세션 파일, 오래된 레거시 Plugin 의존성 상태, 시작, RPC 상태가 유지되는지 확인합니다.
- `pnpm test:docker:published-upgrade-survivor`: 기본적으로 `openclaw@latest`를 설치하고, 라이브 제공자 또는 채널 키 없이 현실적인 기존 사용자 파일을 시드하며, 내장된 `openclaw config set` 명령 레시피로 해당 기준선을 구성하고, 그 게시된 설치를 패키징된 OpenClaw tarball로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 작성한 다음, loopback Gateway를 시작하고 구성된 인텐트, 워크스페이스/세션 파일, 오래된 Plugin 구성과 레거시 의존성 상태, 시작, `/healthz`, `/readyz`, RPC 상태가 유지되거나 깔끔하게 복구되는지 확인합니다. `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 기준선 하나를 재정의하거나, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`와 `all-since-2026.4.23` 같은 값으로 정확한 매트릭스를 확장하거나, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`로 시나리오 픽스처를 추가합니다. reported-issues 세트에는 업그레이드 중 구성된 외부 OpenClaw Plugin이 자동으로 설치되는지 확인하는 `configured-plugin-installs`가 포함됩니다. Package Acceptance는 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출합니다.
- `pnpm test:docker:update-migration`: 기본적으로 `openclaw@2026.4.23`에서 시작하여, 정리 작업이 많은 `plugin-deps-cleanup` 시나리오에서 게시된 업그레이드 유지 하네스를 실행합니다. 별도의 `Update Migration` 워크플로는 이 레인을 `baselines=all-since-2026.4.23`로 확장하여 `.23` 이후의 모든 안정 게시 패키지가 후보 버전으로 업데이트되고, Full Release CI 밖에서 구성된 Plugin 의존성 정리를 증명하도록 합니다.
- `pnpm test:docker:plugins`: 로컬 경로, `file:`, 호이스트된 의존성이 있는 npm 레지스트리 패키지, git 이동 참조, ClawHub 픽스처, 마켓플레이스 업데이트, Claude 번들 활성화/검사에 대한 설치/업데이트 스모크 테스트를 실행합니다.

## 로컬 PR 게이트

로컬 PR 랜딩/게이트 검사에는 다음을 실행하세요.

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

부하가 있는 호스트에서 `pnpm test`가 플레이크되면 회귀로 간주하기 전에 한 번 다시 실행한 다음, `pnpm test <path/to/test>`로 격리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요.

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 환경 변수: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “단어 하나로만 답하세요: ok. 구두점이나 추가 텍스트는 넣지 마세요.”

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

출력에는 각 명령의 `sampleCount`, 평균, p50, p95, 최소/최대, 종료 코드/시그널 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행마다 V8 프로필을 기록하므로, 타이밍과 프로필 캡처가 같은 하네스를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다.
- `pnpm test:startup:bench:save`는 `runs=5`와 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다.
- `pnpm test:startup:bench:update`는 `runs=5`와 `warmup=1`을 사용해 체크인된 기준 픽스처를 `test/fixtures/cli-startup-bench.json`에서 새로 고칩니다.

체크인된 픽스처:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 새로 고침
- `pnpm test:startup:bench:check`로 현재 결과를 픽스처와 비교

## 온보딩 E2E(Docker)

Docker는 선택 사항입니다. 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 의사 tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 다음, Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR 가져오기 스모크(Docker)

지원되는 Docker Node 런타임(Node 24 기본값, Node 22 호환)에서 유지관리되는 QR 런타임 헬퍼가 로드되는지 확인합니다.

```bash
pnpm test:docker:qr
```

## 관련 항목

- [테스트](/ko/help/testing)
- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 plugins 테스트](/ko/help/testing-updates-plugins)
