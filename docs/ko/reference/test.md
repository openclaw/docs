---
read_when:
    - 테스트 실행 또는 수정하기
summary: 로컬에서 테스트를 실행하는 방법(Vitest)과 force/coverage 모드를 사용해야 하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-04-23T14:08:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# 테스트

- 전체 테스트 키트(스위트, live, Docker): [Testing](/ko/help/testing)

- `pnpm test:force`: 기본 Control 포트를 점유하고 있는 남아 있는 Gateway 프로세스를 종료한 뒤, 분리된 Gateway 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 Gateway 실행이 포트 18789를 점유한 상태로 남았을 때 사용하세요.
- `pnpm test:coverage`: V8 커버리지와 함께 단위 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 이는 저장소 전체의 모든 파일 커버리지가 아니라, 로드된 파일 기준의 단위 커버리지 게이트입니다. 임계값은 lines/functions/statements 70%, branches 55%입니다. `coverage.all`이 false이므로, 이 게이트는 분할 레인 전체 소스 파일을 모두 미커버로 취급하는 대신 단위 커버리지 스위트가 로드한 파일을 기준으로 측정합니다.
- `pnpm test:coverage:changed`: `origin/main` 이후 변경된 파일에 대해서만 단위 커버리지를 실행합니다.
- `pnpm test:changed`: diff가 라우팅 가능한 소스/테스트 파일만 건드렸을 때 변경된 git 경로를 범위 지정된 Vitest 레인으로 확장합니다. config/setup 변경은 여전히 기본 루트 프로젝트 실행으로 fallback하므로, wiring 편집이 필요할 때는 넓게 다시 실행됩니다.
- `pnpm changed:lanes`: `origin/main` 대비 diff가 트리거하는 아키텍처 레인을 보여줍니다.
- `pnpm check:changed`: `origin/main` 대비 diff에 대해 스마트 변경 게이트를 실행합니다. core 작업은 core 테스트 레인과 함께, extension 작업은 extension 테스트 레인과 함께, 테스트 전용 작업은 테스트 typecheck/tests만으로 실행하며, 공개 Plugin SDK 또는 plugin-contract 변경은 extension 검증까지 확장하고, 릴리스 메타데이터 전용 버전 범프는 대상화된 버전/config/root-dependency 검사로 유지합니다.
- `pnpm test`: 명시적인 파일/디렉터리 대상을 범위 지정된 Vitest 레인을 통해 라우팅합니다. 대상이 없는 실행은 고정된 샤드 그룹을 사용하고 로컬 병렬 실행을 위해 leaf config로 확장됩니다. extension 그룹은 하나의 거대한 루트 프로젝트 프로세스 대신 항상 extension별 샤드 config로 확장됩니다.
- 전체 및 extension 샤드 실행은 `.artifacts/vitest-shard-timings.json`의 로컬 타이밍 데이터를 업데이트합니다. 이후 실행은 이 타이밍을 사용해 느린 샤드와 빠른 샤드를 균형 있게 배치합니다. 로컬 타이밍 아티팩트를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하세요.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 이제 전용 경량 레인을 통해 라우팅되며 `test/setup.ts`만 유지하고, 런타임이 무거운 케이스는 기존 레인에 남겨 둡니다.
- 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 `pnpm test:changed`를 해당 경량 레인의 명시적 형제 테스트에 매핑하므로, 작은 helper 수정이 무거운 런타임 기반 스위트를 다시 실행하지 않게 됩니다.
- `auto-reply`도 이제 세 개의 전용 config(`core`, `top-level`, `reply`)로 분리되어, reply harness가 더 가벼운 최상위 status/token/helper 테스트를 지배하지 않게 됩니다.
- 기본 Vitest config는 이제 기본값으로 `pool: "threads"`와 `isolate: false`를 사용하며, 공유 비격리 runner가 저장소 전체 config에서 활성화됩니다.
- `pnpm test:channels`는 `vitest.channels.config.ts`를 실행합니다.
- `pnpm test:extensions`와 `pnpm test extensions`는 모든 extension/Plugin 샤드를 실행합니다. 무거운 채널 extension과 OpenAI는 전용 샤드로 실행되고, 다른 extension 그룹은 배치된 상태로 유지됩니다. 번들 Plugin 레인 하나만 실행하려면 `pnpm test extensions/<id>`를 사용하세요.
- `pnpm test:perf:imports`: 명시적 파일/디렉터리 대상에 대해 범위 지정된 레인 라우팅을 계속 사용하면서 Vitest import-duration + import-breakdown 보고를 활성화합니다.
- `pnpm test:perf:imports:changed`: 동일한 import 프로파일링을 수행하지만 `origin/main` 이후 변경된 파일에 대해서만 실행합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`는 동일한 커밋된 git diff에 대해 라우팅된 changed-mode 경로와 기본 루트 프로젝트 실행을 벤치마크합니다.
- `pnpm test:perf:changed:bench -- --worktree`는 먼저 커밋하지 않고 현재 worktree 변경 집합을 벤치마크합니다.
- `pnpm test:perf:profile:main`: Vitest 메인 스레드의 CPU 프로파일을 기록합니다(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: unit runner의 CPU + heap 프로파일을 기록합니다(`.artifacts/vitest-runner-profile`).
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: Gateway end-to-end smoke 테스트(다중 인스턴스 WS/HTTP/node pairing)를 실행합니다. 기본값은 `threads` + `isolate: false`이며 `vitest.e2e.config.ts`에서 adaptive worker를 사용합니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live 테스트(minimax/zai)를 실행합니다. API key와 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 필요하며 그래야 skip 해제됩니다.
- `pnpm test:docker:all`: 공유 live-test 이미지와 Docker E2E 이미지를 한 번만 빌드한 뒤, 기본 동시성 4로 `OPENCLAW_SKIP_DOCKER_BUILD=1`을 사용해 Docker smoke 레인을 실행합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`으로 조정하세요. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되지 않으면 runner는 첫 실패 후 새로운 pooled 레인 스케줄링을 중지하며, 각 레인은 120분 타임아웃을 가지며 이는 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`로 재정의할 수 있습니다. 시작 민감 레인이나 provider 민감 레인은 병렬 풀 뒤에 단독으로 실행됩니다. 레인별 로그는 `.artifacts/docker-tests/<run-id>/` 아래에 기록됩니다.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI를 시작하고, Open WebUI를 통해 로그인하고, `/api/models`를 확인한 다음 `/api/chat/completions`를 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 live model key(예: `~/.profile`의 OpenAI)가 필요하고, 외부 Open WebUI 이미지를 pull하며, 일반 unit/e2e 스위트처럼 CI 안정성을 기대하지는 않습니다.
- `pnpm test:docker:mcp-channels`: 시드된 Gateway 컨테이너와 `openclaw mcp serve`를 실행하는 두 번째 클라이언트 컨테이너를 시작한 다음, 실제 stdio bridge를 통해 라우팅된 대화 검색, transcript 읽기, 첨부 메타데이터, live event queue 동작, outbound send 라우팅, Claude 스타일 채널 + 권한 알림을 검증합니다. Claude 알림 검증은 raw stdio MCP frame을 직접 읽으므로 smoke가 bridge가 실제로 내보내는 내용을 반영합니다.

## 로컬 PR 게이트

로컬 PR 착지/게이트 검사를 위해 다음을 실행하세요:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`가 부하가 큰 호스트에서 flaky하면 회귀로 보기 전에 한 번 더 재실행한 뒤 `pnpm test <path/to/test>`로 격리하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## model 지연 시간 벤치(로컬 key)

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

출력에는 각 명령에 대한 `sampleCount`, 평균, p50, p95, 최소/최대, exit-code/signal 분포, 최대 RSS 요약이 포함됩니다. 선택적 `--cpu-prof-dir` / `--heap-prof-dir`는 실행별 V8 프로파일을 기록하므로 타이밍 측정과 프로파일 캡처가 동일한 harness를 사용합니다.

저장된 출력 규칙:

- `pnpm test:startup:bench:smoke`는 대상 smoke 아티팩트를 `.artifacts/cli-startup-bench-smoke.json`에 기록합니다
- `pnpm test:startup:bench:save`는 `runs=5`와 `warmup=1`을 사용해 전체 스위트 아티팩트를 `.artifacts/cli-startup-bench-all.json`에 기록합니다
- `pnpm test:startup:bench:update`는 `runs=5`와 `warmup=1`을 사용해 체크인된 기준 fixture를 `test/fixtures/cli-startup-bench.json`에서 갱신합니다

체크인된 fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update`로 갱신
- 현재 결과를 fixture와 비교하려면 `pnpm test:startup:bench:check` 사용

## 온보딩 E2E (Docker)

Docker는 선택 사항이며, 이는 컨테이너화된 온보딩 smoke 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 뒤, Gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import smoke (Docker)

지원되는 Docker Node 런타임(Node 24 기본, Node 22 호환)에서 `qrcode-terminal`이 로드되는지 확인합니다:

```bash
pnpm test:docker:qr
```
