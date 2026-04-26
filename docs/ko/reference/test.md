---
read_when:
    - 테스트 실행 또는 수정
summary: 로컬에서 테스트(vitest)를 실행하는 방법과 force/coverage 모드를 사용해야 하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-04-26T11:38:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- 전체 테스트 키트(스위트, 라이브, Docker): [Testing](/ko/help/testing)

- `pnpm test:force`: 기본 control 포트를 점유하고 있는 남아 있는 Gateway 프로세스를 종료한 다음, 격리된 Gateway 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 Gateway 실행으로 포트 18789가 점유된 상태로 남았을 때 사용하세요.
- `pnpm test:coverage`: V8 커버리지와 함께 유닛 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 이것은 전체 리포지토리의 모든 파일 커버리지가 아니라, 로드된 파일 기준의 유닛 커버리지 게이트입니다. 기준값은 lines/functions/statements 70%, branches 55%입니다. `coverage.all`이 false이므로, 이 게이트는 분할 레인의 모든 소스 파일을 미커버 상태로 간주하는 대신 유닛 커버리지 스위트에서 로드된 파일을 기준으로 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 유닛 커버리지를 실행합니다.
- `pnpm test:changed`: diff가 라우팅 가능한 소스/테스트 파일만 건드린 경우, 변경된 git 경로를 범위 지정된 Vitest 레인으로 확장합니다. 구성/설정 변경은 여전히 네이티브 루트 프로젝트 실행으로 폴백하므로, wiring 수정 시 필요하면 폭넓게 다시 실행됩니다.
- `pnpm test:changed:focused`: 내부 루프용 변경 테스트 실행입니다. 직접 수정한 테스트, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import 그래프에서 나온 정확한 대상만 실행합니다. 광범위한 구성/패키지 변경은 전체 changed-test 폴백으로 확장하는 대신 건너뜁니다.
- `pnpm changed:lanes`: `origin/main` 대비 diff로 인해 트리거되는 아키텍처 레인을 표시합니다.
- `pnpm check:changed`: `origin/main` 대비 diff에 대해 스마트 changed 게이트를 실행합니다. 코어 작업은 코어 테스트 레인과 함께, extension 작업은 extension 테스트 레인과 함께, 테스트 전용 작업은 테스트 typecheck/tests만 실행하며, 공개 Plugin SDK 또는 plugin-contract 변경은 extension 검증 한 번으로 확장하고, 릴리스 메타데이터 전용 버전 범프는 대상 버전/구성/루트 의존성 검사로 유지합니다.
- `pnpm test`: 명시적 파일/디렉터리 대상을 범위 지정된 Vitest 레인으로 라우팅합니다. 대상을 지정하지 않은 실행은 고정 shard 그룹을 사용하고, 로컬 병렬 실행을 위해 leaf config로 확장됩니다. extension 그룹은 하나의 거대한 루트 프로젝트 프로세스 대신 항상 extension별 shard config로 확장됩니다.
- 전체, extension, include-pattern shard 실행은 로컬 타이밍 데이터를 `.artifacts/vitest-shard-timings.json`에 업데이트합니다. 이후 전체 config 실행은 이 타이밍을 사용해 느린 shard와 빠른 shard의 균형을 맞춥니다. include-pattern CI shard는 타이밍 키에 shard 이름을 덧붙여, 필터된 shard 타이밍이 전체 config 타이밍 데이터를 덮어쓰지 않고 계속 보이도록 합니다. 로컬 타이밍 아티팩트를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 경량 레인으로 라우팅되며, 런타임이 무거운 케이스는 기존 레인에 남습니다.
- 형제 테스트가 있는 소스 파일은 더 넓은 디렉터리 glob으로 폴백하기 전에 해당 형제 테스트로 매핑됩니다. `test/helpers/channels` 및 `test/helpers/plugins` 아래의 helper 수정은 의존 경로가 정확할 때 모든 shard를 광범위하게 실행하는 대신 로컬 import 그래프를 사용해 importing 테스트를 실행합니다.
- `auto-reply`는 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로도 분할되므로, reply harness가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않습니다.
- 기본 Vitest config는 이제 기본값으로 `pool: "threads"`와 `isolate: false`를 사용하며, 공유 비격리 runner가 리포지토리 전반의 config에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions` 및 `pnpm test extensions`는 모든 extension/plugin shard를 실행합니다. 무거운 채널 plugin, 브라우저 plugin, OpenAI는 전용 shard로 실행되며, 다른 plugin 그룹은 계속 배치 상태로 유지됩니다. 하나의 번들 plugin 레인만 실행하려면 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: Vitest import-duration + import-breakdown 보고를 활성화하면서, 명시적 파일/디렉터리 대상에는 여전히 범위 지정 레인 라우팅을 사용합니다.
- `pnpm test:perf:imports:changed`: 동일한 import 프로파일링을 수행하지만, `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: 동일한 커밋된 git diff에 대해 라우팅된 changed-mode 경로를 네이티브 루트 프로젝트 실행과 비교 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`: 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU 프로파일을 기록합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: 유닛 runner용 CPU + 힙 프로파일을 기록합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 전체 스위트 Vitest leaf config를 모두 직렬로 실행하고, 그룹별 duration 데이터와 config별 JSON/로그 아티팩트를 기록합니다. Test Performance Agent는 느린 테스트 수정 전 기준선으로 이를 사용합니다.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 성능 중심 변경 후 그룹별 보고서를 비교합니다.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: Gateway 엔드투엔드 스모크 테스트(멀티 인스턴스 WS/HTTP/node 페어링)를 실행합니다. 기본값은 `vitest.e2e.config.ts`에서 `threads` + `isolate: false`와 적응형 workers를 사용합니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고, 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider 라이브 테스트(minimax/zai)를 실행합니다. API 키와 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 있어야 skip 해제됩니다.
- `pnpm test:docker:all`: 공유 라이브 테스트 이미지와 Docker E2E 이미지를 한 번 빌드한 뒤, 가중치 기반 스케줄러를 통해 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 Docker 스모크 레인을 실행합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`은 프로세스 슬롯을 제어하며 기본값은 10입니다. `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`은 provider 민감 tail 풀을 제어하며 기본값은 10입니다. 무거운 레인 cap 기본값은 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`이며, provider cap 기본값은 provider당 무거운 레인 하나 기준으로 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`입니다. 더 큰 호스트에서는 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 사용하세요. 레인 시작은 로컬 Docker 데몬 생성 폭주를 피하기 위해 기본적으로 2초 간격으로 stagger되며, `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`로 재정의할 수 있습니다. runner는 기본적으로 Docker를 사전 점검하고, 오래된 OpenClaw E2E 컨테이너를 정리하며, 30초마다 활성 레인 상태를 출력하고, 호환 가능한 레인 간 provider CLI 도구 캐시를 공유하며, 일시적인 라이브 provider 실패는 기본적으로 한 번 재시도하고(`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), 이후 실행에서 longest-first 정렬에 사용하기 위해 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장합니다. Docker를 실행하지 않고 레인 매니페스트만 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, 상태 출력 조정을 위해 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, 타이밍 재사용을 비활성화하려면 `OPENCLAW_DOCKER_ALL_TIMINGS=0`을 사용하세요. 결정적/로컬 레인만 원하면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`, 라이브 provider 레인만 원하면 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`를 사용하세요. 패키지 별칭은 `pnpm test:docker:local:all` 및 `pnpm test:docker:live:all`입니다. live-only 모드는 main과 tail live 레인을 하나의 longest-first 풀로 합쳐 provider 버킷이 Claude, Codex, Gemini 작업을 함께 패킹할 수 있게 합니다. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`을 설정하지 않으면 첫 번째 실패 후 새 pooled 레인 스케줄링을 중단하며, 각 레인은 기본 120분의 폴백 타임아웃을 가지며 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있습니다. 선택된 live/tail 레인은 더 엄격한 레인별 cap을 사용합니다. CLI 백엔드 Docker 설정 명령은 별도 타임아웃을 가지며 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`로 설정합니다(기본값 180). 레인별 로그는 `.artifacts/docker-tests/<run-id>/` 아래에 기록됩니다.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium 기반 소스 E2E 컨테이너를 빌드하고, raw CDP와 격리된 Gateway를 시작한 뒤, `browser doctor --deep`를 실행하고, CDP role 스냅샷에 링크 URL, 커서 승격 clickable, iframe ref, 프레임 메타데이터가 포함되는지 검증합니다.
- CLI 백엔드 live Docker 프로브는 집중 레인으로 실행할 수 있습니다. 예: `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, `pnpm test:docker:live-cli-backend:codex:mcp`. Claude와 Gemini에도 동일한 `:resume` 및 `:mcp` 별칭이 있습니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인한 뒤, `/api/models`를 확인하고, `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 라이브 모델 키(예: `~/.profile`의 OpenAI)가 필요하며, 외부 Open WebUI 이미지를 pull하고, 일반 유닛/e2e 스위트처럼 CI 안정성을 기대하는 대상은 아닙니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 실행하는 두 번째 클라이언트 컨테이너를 시작한 뒤, 실제 stdio 브리지를 통해 라우팅된 대화 탐색, transcript 읽기, 첨부 메타데이터, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 단언은 raw stdio MCP 프레임을 직접 읽으므로, 이 스모크는 브리지가 실제로 출력하는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR land/gate 확인에는 다음을 실행하세요:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

로드가 높은 호스트에서 `pnpm test`가 플래키하면, 회귀로 판단하기 전에 한 번 더 재실행한 뒤 `pnpm test <path/to/test>`로 분리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치마크(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “한 단어로 답하세요: ok. 구두점이나 추가 텍스트는 넣지 마세요.”

마지막 실행(2025-12-31, 20회):

- minimax 중앙값 1279ms (최소 1114, 최대 2431)
- opus 중앙값 2454ms (최소 1224, 최대 3170)

## CLI 시작 벤치마크

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

출력에는 각 명령에 대한 `sampleCount`, avg, p50, p95, min/max, exit-code/signal 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행별 V8 프로파일을 기록하므로, 타이밍과 프로파일 캡처가 동일한 하네스를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다.
- `pnpm test:startup:bench:save`는 `runs=5` 및 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다.
- `pnpm test:startup:bench:update`는 `runs=5` 및 `warmup=1`을 사용해 체크인된 기준 fixture `test/fixtures/cli-startup-bench.json`을 갱신합니다.

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 갱신
- `pnpm test:startup:bench:check`로 현재 결과를 fixture와 비교

## 온보딩 E2E (Docker)

Docker는 선택 사항이며, 이는 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 다음, Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import 스모크 (Docker)

유지 관리되는 QR 런타임 헬퍼가 지원되는 Docker Node 런타임(Node 24 기본값, Node 22 호환)에서 로드되는지 확인합니다:

```bash
pnpm test:docker:qr
```

## 관련 항목

- [Testing](/ko/help/testing)
- [Testing live](/ko/help/testing-live)
