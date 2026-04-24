---
read_when:
    - 테스트 실행 또는 수정하기
summary: 로컬에서 테스트를 실행하는 방법(vitest)과 force/coverage 모드를 언제 사용해야 하는지
title: 테스트
x-i18n:
    generated_at: "2026-04-24T09:01:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- 전체 테스트 키트(스위트, live, Docker): [테스트](/ko/help/testing)

- `pnpm test:force`: 기본 control 포트를 점유한 남아 있는 Gateway 프로세스를 종료한 다음, 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 분리된 Gateway 포트로 전체 Vitest 스위트를 실행합니다. 이전 Gateway 실행이 포트 18789를 점유한 채 남아 있을 때 사용하세요.
- `pnpm test:coverage`: V8 커버리지와 함께 유닛 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 이것은 저장소 전체 모든 파일 커버리지가 아니라, 로드된 파일 기준 유닛 커버리지 게이트입니다. 임계값은 lines/functions/statements 70%, branches 55%입니다. `coverage.all`이 false이므로, 이 게이트는 분할 레인 소스 파일 전체를 미커버 상태로 간주하는 대신 유닛 커버리지 스위트에서 로드된 파일을 기준으로 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 유닛 커버리지를 실행합니다.
- `pnpm test:changed`: diff가 라우팅 가능한 소스/테스트 파일만 건드린 경우, 변경된 git 경로를 범위 지정된 Vitest 레인으로 확장합니다. config/setup 변경은 여전히 네이티브 루트 프로젝트 실행으로 폴백하므로, wiring 수정이 필요할 때는 광범위하게 다시 실행됩니다.
- `pnpm changed:lanes`: `origin/main` 대비 diff로 인해 트리거되는 아키텍처 레인을 표시합니다.
- `pnpm check:changed`: `origin/main` 대비 diff에 대한 스마트 changed 게이트를 실행합니다. 코어 작업은 코어 테스트 레인과 함께, 확장 작업은 확장 테스트 레인과 함께, 테스트 전용 작업은 테스트 타입체크/테스트만으로 실행하며, 공개 Plugin SDK 또는 plugin-contract 변경은 확장 검증 1회를 추가로 수행하고, 릴리스 메타데이터 전용 버전 증가의 경우 대상 버전/config/루트 의존성 검사만 유지합니다.
- `pnpm test`: 명시적 파일/디렉터리 대상을 범위 지정된 Vitest 레인을 통해 라우팅합니다. 대상이 없는 실행은 고정된 샤드 그룹을 사용하고 로컬 병렬 실행을 위해 리프 config로 확장됩니다. 확장 그룹은 하나의 거대한 루트 프로젝트 프로세스 대신 항상 확장별 샤드 config로 확장됩니다.
- 전체 및 확장 샤드 실행은 `.artifacts/vitest-shard-timings.json`의 로컬 타이밍 데이터를 갱신하며, 이후 실행은 해당 타이밍을 사용해 느린 샤드와 빠른 샤드의 균형을 맞춥니다. 로컬 타이밍 artifact를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 `test/setup.ts`만 유지하는 전용 경량 레인을 통해 라우팅되며, 런타임이 무거운 케이스는 기존 레인에 남습니다.
- 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 `pnpm test:changed`를 해당 경량 레인의 명시적 형제 테스트로 매핑하므로, 작은 헬퍼 수정으로 무거운 런타임 기반 스위트를 다시 실행하지 않아도 됩니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분할되므로, reply harness가 더 가벼운 top-level status/token/helper 테스트를 지배하지 않습니다.
- 기본 Vitest config는 이제 기본값으로 `pool: "threads"`와 `isolate: false`를 사용하며, 공유 non-isolated runner가 저장소 전체 config에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions` 및 `pnpm test extensions`는 모든 확장/Plugin 샤드를 실행합니다. 무거운 채널 Plugin, 브라우저 Plugin, OpenAI는 전용 샤드로 실행되고, 다른 Plugin 그룹은 배치 상태로 유지됩니다. 번들된 Plugin 레인 하나만 실행하려면 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: Vitest import-duration + import-breakdown 보고를 활성화하면서도, 명시적 파일/디렉터리 대상에 대해서는 여전히 범위 지정 레인 라우팅을 사용합니다.
- `pnpm test:perf:imports:changed`: 동일한 import 프로파일링이지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 동일한 커밋된 git diff에 대해 라우팅된 changed 모드 경로를 네이티브 루트 프로젝트 실행과 비교 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드용 CPU 프로필을 작성합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: 유닛 runner용 CPU + 힙 프로필을 작성합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 전체 스위트 Vitest 리프 config를 모두 직렬 실행하고 그룹화된 실행 시간 데이터와 config별 JSON/로그 artifact를 기록합니다. Test Performance Agent는 느린 테스트 수정을 시도하기 전 기준선으로 이를 사용합니다.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 성능 중심 변경 후 그룹화된 보고서를 비교합니다.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: Gateway 엔드투엔드 스모크 테스트(다중 인스턴스 WS/HTTP/Node 페어링)를 실행합니다. 기본값은 `vitest.e2e.config.ts`에서 `threads` + `isolate: false`와 적응형 worker이며, `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live 테스트(minimax/zai)를 실행합니다. API 키와, skip 해제를 위한 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 필요합니다.
- `pnpm test:docker:all`: 공유 live-test 이미지와 Docker E2E 이미지를 한 번만 빌드한 다음, 기본적으로 동시성 8로 `OPENCLAW_SKIP_DOCKER_BUILD=1`과 함께 Docker 스모크 레인을 실행합니다. 메인 풀은 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`, provider 민감 tail 풀은 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`으로 조정하며 둘 다 기본값은 8입니다. 로컬 Docker 데몬 생성 폭주를 피하기 위해 레인 시작은 기본적으로 2초 간격으로 분산되며, `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`로 재정의할 수 있습니다. runner는 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되지 않은 한 첫 실패 후 새로운 풀 레인 스케줄링을 중단하며, 각 레인의 타임아웃은 기본 120분이고 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있습니다. 레인별 로그는 `.artifacts/docker-tests/<run-id>/` 아래에 기록됩니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인하고, `/api/models`를 확인한 뒤, `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 live 모델 키(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI 이미지를 가져오며, 일반 유닛/e2e 스위트처럼 CI 안정성을 기대하는 대상은 아닙니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 실행하는 두 번째 클라이언트 컨테이너를 시작한 다음, 실제 stdio 브리지를 통해 라우팅된 대화 검색, 전사 읽기, 첨부 메타데이터, live 이벤트 큐 동작, outbound send 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 검증은 원시 stdio MCP 프레임을 직접 읽으므로, 스모크가 브리지가 실제로 emit하는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR 랜드/게이트 점검에는 다음을 실행하세요:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`가 부하가 큰 호스트에서 flaky하다면, 회귀로 판단하기 전에 한 번 더 재실행한 다음 `pnpm test <path/to/test>`로 격리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 모델 지연 시간 벤치(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “Reply with a single word: ok. No punctuation or extra text.”

마지막 실행(2025-12-31, 20회):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

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

출력에는 각 명령별 `sampleCount`, avg, p50, p95, min/max, exit-code/signal 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행별 V8 프로필을 기록하므로, 타이밍 측정과 프로필 수집에 동일한 harness를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 스모크 artifact를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다.
- `pnpm test:startup:bench:save`는 `runs=5` 및 `warmup=1`로 전체 스위트 artifact를 `.artifacts/cli-startup-bench-all.json`에 기록합니다.
- `pnpm test:startup:bench:update`는 `runs=5` 및 `warmup=1`로 체크인된 기준선 fixture `test/fixtures/cli-startup-bench.json`를 갱신합니다.

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 갱신
- `pnpm test:startup:bench:check`로 현재 결과를 fixture와 비교

## 온보딩 E2E(Docker)

Docker는 선택 사항이며, 이는 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 wizard를 구동하고, config/workspace/session 파일을 검증한 다음, Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import 스모크(Docker)

유지 관리되는 QR 런타임 헬퍼가 지원되는 Docker Node 런타임(Node 24 기본, Node 22 호환)에서 로드되는지 확인합니다:

```bash
pnpm test:docker:qr
```

## 관련 항목

- [테스트](/ko/help/testing)
- [live 테스트](/ko/help/testing-live)
