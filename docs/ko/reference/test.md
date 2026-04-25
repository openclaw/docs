---
read_when:
    - 테스트 실행 또는 수정하기
summary: 로컬에서 테스트를 실행하는 방법(vitest)과 force/coverage 모드를 사용해야 하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-04-25T06:10:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91009b51cee872f542a9aed0f882359c763cfb88722860eb8ef7deae434a89e7
    source_path: reference/test.md
    workflow: 15
---

- 전체 테스트 키트(스위트, live, Docker): [테스트](/ko/help/testing)

- `pnpm test:force`: 기본 control 포트를 점유하고 있는 남아 있는 Gateway 프로세스를 종료한 뒤, 격리된 Gateway 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 Gateway 실행이 포트 18789를 점유한 채 남아 있을 때 사용하세요.
- `pnpm test:coverage`: V8 커버리지와 함께 유닛 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 이는 저장소 전체 all-file 커버리지가 아니라 로드된 파일 기준 유닛 커버리지 게이트입니다. 임계값은 lines/functions/statements 70%, branches 55%입니다. `coverage.all`이 false이므로, 이 게이트는 split-lane 소스 파일 전체를 미커버로 취급하지 않고 유닛 커버리지 스위트가 로드한 파일을 기준으로 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 유닛 커버리지를 실행합니다.
- `pnpm test:changed`: 변경된 git 경로를, diff가 라우팅 가능한 소스/테스트 파일만 건드릴 때 범위 지정된 Vitest lane으로 확장합니다. config/setup 변경은 여전히 네이티브 루트 프로젝트 실행으로 되돌아가므로, wiring 편집은 필요 시 넓게 다시 실행됩니다.
- `pnpm changed:lanes`: `origin/main` 기준 diff로 트리거되는 아키텍처 lane을 표시합니다.
- `pnpm check:changed`: `origin/main` 기준 diff에 대해 스마트 changed 게이트를 실행합니다. core 작업은 core 테스트 lane으로, extension 작업은 extension 테스트 lane으로, 테스트 전용 작업은 테스트 typecheck/tests만으로 실행하고, 공개 Plugin SDK 또는 plugin-contract 변경은 extension 검증 1회로 확장하며, 릴리스 메타데이터 전용 버전 범프는 대상 version/config/root-dependency 검사로 유지합니다.
- `pnpm test`: 명시적 파일/디렉터리 대상을 범위 지정된 Vitest lane으로 라우팅합니다. 대상이 없는 실행은 고정 shard 그룹을 사용하고 로컬 병렬 실행을 위해 leaf config로 확장됩니다. extension 그룹은 하나의 거대한 루트 프로젝트 프로세스 대신 항상 extension별 shard config로 확장됩니다.
- 전체 및 extension shard 실행은 로컬 타이밍 데이터를 `.artifacts/vitest-shard-timings.json`에 업데이트하며, 이후 실행은 이 타이밍을 사용해 느린 shard와 빠른 shard의 균형을 맞춥니다. 로컬 타이밍 아티팩트를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 일부 `plugin-sdk` 및 `commands` 테스트 파일은 이제 전용 경량 lane으로 라우팅되며 `test/setup.ts`만 유지합니다. 런타임이 무거운 케이스는 기존 lane에 남습니다.
- 일부 `plugin-sdk` 및 `commands` helper 소스 파일도 `pnpm test:changed`를 이 경량 lane의 명시적 형제 테스트에 매핑하므로, 작은 helper 수정으로 무거운 런타임 기반 스위트를 다시 실행하지 않아도 됩니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분할되어, reply harness가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않도록 합니다.
- 기본 Vitest config는 이제 `pool: "threads"`와 `isolate: false`를 기본값으로 사용하며, 공유 비격리 실행기가 저장소 전체 config에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions`와 `pnpm test extensions`는 모든 extension/Plugin shard를 실행합니다. 무거운 채널 Plugins, browser Plugin, OpenAI는 전용 shard로 실행되며, 다른 Plugin 그룹은 계속 배치 상태로 유지됩니다. 번들 Plugin lane 하나만 실행하려면 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: Vitest import-duration + import-breakdown 보고를 활성화하면서도, 명시적 파일/디렉터리 대상에 대해서는 여전히 범위 지정 lane 라우팅을 사용합니다.
- `pnpm test:perf:imports:changed`: 동일한 import 프로파일링이지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 동일한 커밋된 git diff에 대해 라우팅된 changed-mode 경로와 네이티브 루트 프로젝트 실행을 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 먼저 커밋하지 않고 현재 작업 트리 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU 프로필을 기록합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: 유닛 실행기용 CPU + 힙 프로필을 기록합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 모든 full-suite Vitest leaf config를 직렬 실행하고, 그룹화된 실행 시간 데이터와 config별 JSON/로그 아티팩트를 기록합니다. Test Performance Agent는 느린 테스트 수정 전 이 결과를 baseline으로 사용합니다.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 성능 중심 변경 후 그룹화된 보고서를 비교합니다.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in.
- `pnpm test:e2e`: Gateway 종단 간 smoke 테스트(다중 인스턴스 WS/HTTP/node 페어링)를 실행합니다. 기본적으로 `vitest.e2e.config.ts`에서 `threads` + `isolate: false`와 적응형 worker를 사용합니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고, 상세 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: 공급자 live 테스트(minimax/zai)를 실행합니다. API 키와 `LIVE=1`(또는 공급자별 `*_LIVE_TEST=1`)이 필요하며, 그래야 skip이 해제됩니다.
- `pnpm test:docker:all`: 공유 live-test 이미지와 Docker E2E 이미지를 한 번 빌드한 뒤, `OPENCLAW_SKIP_DOCKER_BUILD=1`과 함께 가중 스케줄러를 통해 Docker smoke lane을 실행합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`은 프로세스 슬롯을 제어하며 기본값은 10입니다. `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`은 공급자 민감 tail pool을 제어하며 기본값은 10입니다. 무거운 lane 상한은 기본적으로 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`이며, 더 큰 호스트에서는 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 사용하세요. lane 시작은 로컬 Docker 데몬 create 폭주를 피하기 위해 기본적으로 2초 간격으로 스태거되며, `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`로 재정의할 수 있습니다. 실행기는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 정리하며, 30초마다 활성 lane 상태를 출력하고, 이후 실행에서 가장 오래 걸리는 것부터 실행하도록 `.artifacts/docker-tests/lane-timings.json`에 lane 타이밍을 저장합니다. Docker를 실행하지 않고 lane manifest만 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, 상태 출력 간격 조정에는 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, 타이밍 재사용 비활성화에는 `OPENCLAW_DOCKER_ALL_TIMINGS=0`을 사용하세요. 실행기는 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되지 않은 한 첫 실패 이후 새로운 pooled lane 스케줄링을 중단하며, 각 lane에는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의 가능한 120분 대체 타임아웃이 있습니다. 일부 live/tail lane은 더 엄격한 lane별 상한을 사용합니다. lane별 로그는 `.artifacts/docker-tests/<run-id>/` 아래에 기록됩니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인한 뒤 `/api/models`를 확인하고, `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 live 모델 키(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI 이미지를 pull하며, 일반 유닛/e2e 스위트처럼 CI 안정성을 기대하지는 않습니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와, `openclaw mcp serve`를 실행하는 두 번째 클라이언트 컨테이너를 시작한 뒤, 실제 stdio 브리지를 통해 라우팅된 대화 검색, 전사 읽기, 첨부파일 메타데이터, live 이벤트 큐 동작, 발신 전송 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 assertion은 raw stdio MCP 프레임을 직접 읽으므로, smoke가 브리지가 실제로 내보내는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR land/gate 검사에는 다음을 실행하세요:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

로드가 높은 호스트에서 `pnpm test`가 flaky하면, 회귀로 판단하기 전에 한 번 더 실행한 뒤 `pnpm test <path/to/test>`로 문제를 분리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “Reply with a single word: ok. No punctuation or extra text.”

마지막 실행(2025-12-31, 20회):

- minimax 중앙값 1279ms (최소 1114, 최대 2431)
- opus 중앙값 2454ms (최소 1224, 최대 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

프리셋:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 두 프리셋 모두

출력에는 각 명령에 대한 `sampleCount`, avg, p50, p95, min/max, exit-code/signal 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행별 V8 프로필을 기록하므로 타이밍과 프로필 캡처가 동일한 harness를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 smoke 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다.
- `pnpm test:startup:bench:save`는 `runs=5`와 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다.
- `pnpm test:startup:bench:update`는 `runs=5`와 `warmup=1`을 사용해 체크인된 baseline fixture `test/fixtures/cli-startup-bench.json`을 갱신합니다.

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 갱신
- 현재 결과를 fixture와 비교하려면 `pnpm test:startup:bench:check` 사용

## 온보딩 E2E(Docker)

Docker는 선택 사항입니다. 컨테이너화된 온보딩 smoke 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 cold-start 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 뒤 Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import smoke(Docker)

유지 관리되는 QR 런타임 helper가 지원되는 Docker Node 런타임(Node 24 기본, Node 22 호환)에서 로드되는지 보장합니다:

```bash
pnpm test:docker:qr
```

## 관련 문서

- [테스트](/ko/help/testing)
- [Testing live](/ko/help/testing-live)
