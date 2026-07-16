---
read_when:
    - 테스트 실행 또는 수정
summary: 로컬에서 테스트를 실행하는 방법(vitest)과 강제/커버리지 모드를 사용해야 하는 경우
title: 테스트
x-i18n:
    generated_at: "2026-07-16T13:05:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- 전체 테스트 키트(스위트, 라이브, Docker): [테스트](/ko/help/testing)
- 업데이트 및 Plugin 패키지 검증: [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)

## 에이전트 기본값

에이전트 세션은 신뢰할 수 있는 소스이고 기존 종속성 설치가 준비된 경우에만
하나 또는 몇 개의 집중 테스트와 저비용 정적 검사를 로컬에서 실행합니다. 신뢰할 수 없는
리포지토리 도구는 로컬에서 절대 실행하지 마십시오. 더 큰 스위트, 타입 검사/린트가
분산 실행되는 변경 게이트, 빌드, Docker, 패키지 레인, E2E, 라이브 증명 및
크로스 플랫폼 검증은 Crabbox를 통해 원격으로 실행합니다. 신뢰할 수 있는 메인테이너의
대규모 증명에는 기본적으로 Blacksmith Testbox를 사용합니다. 구성된 Testbox 워크플로는
자격 증명을 주입하므로, 신뢰할 수 없는 기여자 또는 포크 코드는 대신
비밀 정보가 없는 포크 CI나 정제된 직접 AWS Crabbox를 사용해야 합니다.

예상되는 작업을 위해 미리 워밍업하지 마십시오. 첫 번째 대규모 명령이 준비되면
백엔드를 지연 획득하고, 반환된 `tbx_...` id를 이후의 대규모
명령에 재사용하며, 실행할 때마다 현재 체크아웃을 동기화하고 인계 전에 중지하십시오.

첫 번째 재사용이 성공하면 래퍼는 리스의 베이스,
종속성 및 Testbox 워크플로 지문을 `.crabbox/testbox-leases/` 아래에 기록합니다.
소스만 편집한 경우 워밍업된 박스를 계속 재사용합니다. 병합 베이스, 잠금 파일,
패키지 관리자 입력, 래퍼 또는 Testbox 워크플로가 변경되면 안전하게 실패하고
새 리스가 필요합니다. 모든 실행은 여전히 현재 체크아웃을 동기화합니다.
`OPENCLAW_TESTBOX_ALLOW_STALE=1`은 의도적인 진단에만 사용하며
릴리스 증명에는 사용하지 않습니다.

아래의 로컬 테스트 명령은 사람이 수행하는 워크플로와 제한된 에이전트 증명을 위한 것입니다.
원격 공급자를 사용할 수 없는 경우 이를 보고해야 하며, 그렇다고 해서
광범위한 로컬 게이트를 암묵적으로 실행할 수 있는 것은 아닙니다.

신뢰할 수 없는 대규모 증명의 경우 `--provider aws`으로 지연 워밍업하십시오. 모든 실행은
`CRABBOX_ENV_ALLOW=CI`을 설정하고, `--provider aws --no-hydrate`을 전달하며,
종속성을 설치하거나 테스트를 실행하기 전에 새로운 임시 원격 `HOME`을
사용해야 합니다. 해당 신뢰할 수 없는 소스 전용으로 새로 워밍업한 리스를 사용하고,
신뢰할 수 있거나 이전에 자격 증명이 주입된 리스는 절대 재사용하지 마십시오. 깨끗하고 신뢰할 수 있는
`main` 체크아웃에서 설치된 신뢰할 수 있는 Crabbox 바이너리를 실행하고
`--fresh-pr`을 사용하여 원격 PR만 가져오십시오. 신뢰할 수 없는 체크아웃의 래퍼나 구성을
로컬에서 절대 실행하지 마십시오.
`CRABBOX_AWS_INSTANCE_PROFILE`을 설정 해제하고, 확인된
`aws.instanceProfile`이 비어 있지 않으면 안전하게 실패하십시오. 설치/테스트 전에
신뢰할 수 있는 절대 경로 도구를 사용하여 IMDSv2 토큰을 요구하고, IAM 자격 증명
엔드포인트가 404를 반환하는지 증명하며, 원격 `git rev-parse HEAD`이 검토된
전체 PR 헤드 SHA와 같은지 확인하십시오. 리스를 해당 SHA에 바인딩하고 헤드가
변경되면 중지한 후 다시 워밍업하십시오. 깨끗한
`main`에서 신뢰할 수 있는 `scripts/crabbox-untrusted-bootstrap.sh`을
`--fresh-pr`과 함께 업로드하십시오. 이 스크립트는 고정된 Node/pnpm을 설치하고, SHA와
패키지 관리자 고정값을 확인하고, `HOME`을 격리하고, 종속성을 설치한 다음
요청된 테스트를 실행합니다. 브로커가 역할이 없거나 원격 PR이 존재하지 않음을 증명할 수 없다면
비밀 정보가 없는 포크 CI를 사용하십시오. `hydrate-github`, `--no-sync` 또는
자격 증명이 주입된 Testbox 워크플로는 사용하지 마십시오.
모든 `CRABBOX_TAILSCALE*` 재정의를 설정 해제하고, `--network public
--tailscale=false`를 강제 적용하고, 출구 노드/LAN 플래그를 지우고, 스크립트를 업로드하기 전에 `crabbox inspect`이
Tailscale 상태 없이 공용 네트워킹을 보고하도록 요구하십시오.

## 일반적인 로컬 순서

1. 변경 범위 Vitest 증명에는 `pnpm test:changed`을 사용합니다.
2. 파일 하나, 디렉터리 하나 또는 명시적 대상에는 `pnpm test <path-or-filter>`을 사용합니다.
3. 의도적으로 전체 로컬 Vitest 스위트가 필요한 경우에만 `pnpm test`을 사용합니다.

Codex 워크트리 또는 연결된/희소 체크아웃에서 에이전트는 직접적인 로컬
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`을 피합니다.

- 종속성이 준비된 제한적 집중 증명:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- 분류 우선 변경 검사: `node scripts/check-changed.mjs`; 문서 전용,
  변경 없음 및 소규모 메타데이터 계획은 종속성이 준비된 경우 로컬에서 유지하고,
  대규모이거나 종속성이 누락된 계획은 Testbox에 위임합니다.
- 명시적으로 유지된 리스를 사용하는 광범위한 증명: pnpm이 Testbox 내부에서 실행되도록 `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`을 사용합니다.
- 래퍼의 최종 `exitCode`과 타이밍 JSON이 명령 결과입니다. 위임된 Blacksmith GitHub Actions 실행에서는 Testbox가 keepalive 액션 외부에서 중지되므로 SSH 명령이 성공한 후 `cancelled`이 표시될 수 있습니다. 이를 실패로 간주하기 전에 래퍼 요약과 명령 출력을 확인하십시오.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` 및 대상이 지정된 `pnpm test ...` 같은 명령의 대규모 검사 직렬화를 Git 공통 디렉터리 대신 현재 워크트리 내부에 유지합니다. 연결된 워크트리 간에 독립적인 검사를 의도적으로 실행하는 고용량 로컬 호스트에서만 사용하십시오.

## 핵심 명령

테스트 래퍼 실행은 짧은 `[test] passed|failed|skipped ... in ...` 요약으로 끝나며, Vitest 자체의 소요 시간 줄은 샤드별 세부 정보로 유지됩니다.

| 명령                                              | 수행하는 작업                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 명시적인 파일/디렉터리 대상은 범위가 지정된 Vitest 레인을 통해 라우팅됩니다. 대상이 지정되지 않은 실행은 전체 스위트 증명입니다. 고정된 샤드 그룹은 로컬 병렬 실행을 위해 리프 구성으로 확장되며, 시작 전에 예상되는 샤드 분산 실행을 출력합니다. 확장 그룹은 하나의 거대한 루트 프로젝트 프로세스 대신 항상 확장별 샤드 구성으로 확장됩니다.           |
| `pnpm test:changed`                               | 저비용 스마트 변경 테스트 실행: 직접적인 테스트 편집, 형제 `*.test.ts` 파일, 명시적 소스 매핑 및 로컬 가져오기 그래프에서 정확한 대상을 정합니다. 광범위한 변경, 구성 변경 및 패키지 변경은 정확한 테스트에 매핑되지 않으면 건너뜁니다.                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 명시적인 광범위 변경 테스트 실행입니다. 테스트 하네스/구성/패키지 편집 시 Vitest의 더 광범위한 변경 테스트 동작으로 대체해야 할 때 사용합니다.                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | 구성된 OpenClaw Gateway 포트(기본값 `18789`)를 해제한 다음, 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 격리된 Gateway 포트로 전체 스위트를 실행합니다.                                                                                                                                                                                    |
| `pnpm test:coverage`                              | 기본 단위 레인(`vitest.unit.config.ts`)에 대한 정보용 V8 커버리지 보고서를 생성합니다. 커버리지 임계값은 적용되지 않습니다.                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | `origin/main` 이후 변경된 파일만 대상으로 하는 단위 커버리지입니다.                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | `origin/main`과의 차이로 트리거되는 아키텍처 레인을 표시합니다.                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | 실행을 선택하기 전에 변경된 레인을 분류합니다. 문서 전용, 변경 없음 및 소규모 메타데이터 계획은 종속성이 준비된 경우 로컬에서 유지하고, 타입 검사/린트 분산 실행, 기타 대규모 레인 또는 누락된 로컬 종속성이 포함된 계획은 CI 외부에서 Crabbox/Testbox에 위임합니다. Vitest는 실행하지 않습니다. 테스트 증명에는 `pnpm test:changed` 또는 `pnpm test <target>`을 사용하십시오. |

## 공유 테스트 상태 및 프로세스 도우미

- `src/test-utils/openclaw-test-state.ts`: 테스트에 격리된 `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, 구성 픽스처, 워크스페이스, 에이전트 디렉터리 또는 인증 프로필 저장소가 필요할 때 Vitest에서 사용합니다.
- `pnpm test:env-mutations:report`: `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` 또는 관련 환경 키를 직접 변경하는 테스트/하네스에 대한 비차단 보고서입니다. 공유 테스트 상태 도우미로 마이그레이션할 후보를 찾는 데 사용합니다.
- `test/helpers/openclaw-test-instance.ts`: 실행 중인 Gateway, CLI 환경, 로그 캡처 및 정리가 한곳에서 필요한 프로세스 수준 E2E 테스트입니다.
- `scripts/lib/docker-e2e-image.sh`을 소싱하는 Docker/Bash E2E 레인은 `docker_e2e_test_state_shell_b64 <label> <scenario>`을 컨테이너에 전달하고 `scripts/lib/openclaw-e2e-instance.sh`으로 디코딩할 수 있습니다. 다중 홈 스크립트는 `docker_e2e_test_state_function_b64`을 전달하고 각 흐름에서 `openclaw_test_state_create <label> <scenario>`을 호출할 수 있습니다. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json`은 소싱 가능한 호스트 환경 파일을 작성합니다(`create` 앞의 `--`은 최신 Node 런타임이 `--env-file`을 Node 플래그로 취급하지 않도록 합니다). Gateway를 실행하는 레인은 엔트리포인트 확인, 모의 OpenAI 시작, 포그라운드/백그라운드 실행, 준비 상태 프로브, 상태 환경 내보내기, 로그 덤프 및 프로세스 정리를 위해 `scripts/lib/openclaw-e2e-instance.sh`을 소싱할 수 있습니다.

## Control UI, TUI 및 확장 레인

- **Control UI 모의 E2E:** `pnpm test:ui:e2e`은 Vite Control UI를 시작하고 모의 Gateway WebSocket을 대상으로 실제 Chromium 페이지를 구동하는 Vitest + Playwright 레인을 실행합니다. 테스트는 `ui/src/**/*.e2e.test.ts`에 있으며, 공유 모의 객체/제어 기능은 `ui/src/test-helpers/control-ui-e2e.ts`에 있습니다. `pnpm test:e2e`에는 이 레인이 포함됩니다. 에이전트 실행은 대상 증명을 포함하여 기본적으로 Testbox/Crabbox를 사용하며, 명시적으로 로컬 대체 수단이 필요한 경우에만 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`을 사용하십시오.
- **TUI PTY 테스트:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts`은 빠른 가짜 백엔드 PTY 레인을 실행합니다. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 또는 `pnpm tui:pty:test:watch --mode local`은 외부 모델 엔드포인트만 모의하는 더 느린 `tui --local` 스모크 테스트를 실행합니다. 원시 ANSI 스냅샷이 아니라 안정적으로 표시되는 텍스트나 픽스처 호출을 단언하십시오.
- `pnpm test:extensions` 및 `pnpm test extensions`은 모든 확장 프로그램/Plugin 샤드를 실행합니다. 무거운 채널 Plugin, 브라우저 Plugin 및 OpenAI는 전용 샤드로 실행되며, 다른 Plugin 그룹은 배치로 유지됩니다. `pnpm test extensions/<id>`은 번들 Plugin 레인 하나를 실행합니다.
- 형제 테스트가 있는 소스 파일은 더 넓은 디렉터리 glob으로 대체하기 전에 해당 형제 테스트에 매핑됩니다. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` 및 `src/plugins/contracts` 아래의 헬퍼 편집은 종속성 경로가 명확할 때 모든 샤드를 광범위하게 실행하는 대신 로컬 가져오기 그래프를 사용하여 이를 가져오는 테스트를 실행합니다.
- 계약 디렉터리 대상은 해당 계약 레인으로 분산됩니다. `pnpm test src/channels/plugins/contracts`은 네 개의 채널 계약 구성을 실행하고 `pnpm test src/plugins/contracts`은 Plugin 계약 구성을 실행합니다. 이는 일반 `channels`/`plugins` 프로젝트가 `contracts/**`을 제외하기 때문입니다.
- `auto-reply`은 세 개의 전용 구성(`core`, `top-level`, `reply`)으로 분할되어 응답 하네스가 더 가벼운 최상위 상태/토큰/헬퍼 테스트를 압도하지 않도록 합니다.
- 선택된 `plugin-sdk` 및 `commands` 테스트 파일은 `test/setup.ts`만 유지하는 전용 경량 레인을 통해 라우팅되며, 런타임 부하가 큰 사례는 기존 레인에 남겨 둡니다.
- 기본 Vitest 구성은 `pool: "threads"` 및 `isolate: false`을 기본값으로 사용하며, 저장소 전체 구성에서 공유 비격리 실행기가 활성화됩니다.
- `pnpm test:channels`은 `vitest.channels.config.ts`을 실행합니다.

## Gateway 및 E2E

- Gateway 통합은 선택적으로 활성화합니다: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`.
- `pnpm test:e2e`: 저장소 E2E 집계 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: Gateway 엔드투엔드 스모크 테스트(다중 인스턴스 WS/HTTP/Node 페어링)입니다. `vitest.e2e.config.ts`의 적응형 워커와 함께 기본적으로 `threads` + `isolate: false`을 사용합니다. `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 `OPENCLAW_E2E_VERBOSE=1`으로 상세 로그를 활성화하십시오.
- `pnpm test:live`: 제공자 라이브 테스트(Claude/Minimax/DeepSeek/z.ai 등, `*.live.test.ts`으로 제한됨)입니다. 건너뛰기를 해제하려면 API 키와 `LIVE=1`(또는 `OPENCLAW_LIVE_TEST=1`)이 필요하며, `OPENCLAW_LIVE_TEST_QUIET=0`으로 상세 출력을 활성화합니다.

## 전체 Docker 제품군(`pnpm test:docker:all`)

공유 라이브 테스트 이미지를 빌드하고, OpenClaw를 npm tarball로 한 번 패키징하고, 기본 Node/Git 실행기 이미지와 해당 tarball을 `/app`에 설치하는 기능 이미지를 빌드하거나 재사용한 다음, 가중치 기반 스케줄러를 통해 Docker 스모크 레인을 실행합니다. `scripts/package-openclaw-for-docker.mjs`은 유일한 로컬/CI 패키지 패키저이며, Docker가 사용하기 전에 tarball과 `dist/postinstall-inventory.json`을 검증합니다.

- 기본 이미지(`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): 설치 프로그램/업데이트/Plugin 종속성 레인으로, 복사된 저장소 소스 대신 미리 빌드된 tarball을 마운트합니다.
- 기능 이미지(`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): 일반적인 빌드된 앱 기능 레인입니다.
- 레인 정의: `scripts/lib/docker-e2e-scenarios.mjs`. 플래너: `scripts/lib/docker-e2e-plan.mjs`. 실행기: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json`은 Docker를 빌드하거나 실행하지 않고 스케줄러가 소유하는 CI 계획(레인, 이미지 종류, 패키지/라이브 이미지 요구 사항, 상태 시나리오, 자격 증명 검사)을 출력합니다.

스케줄링 조정 항목(환경 변수, 괄호 안은 기본값):

| 환경 변수                                                                                                         | 기본값             | 용도                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | 프로세스 슬롯입니다.                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | 제공자에 민감한 후반부 풀입니다.                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 무거운 라이브 제공자 레인의 상한입니다.                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm 리소스 레인의 상한입니다.                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | 서비스 리소스 레인의 상한입니다.                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | 제공자별 무거운 레인의 상한입니다.                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | 더 제한적인 제공자별 상한입니다.                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | 더 큰 호스트용 재정의입니다.                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | 레인 시작 간 지연으로, 로컬 Docker 데몬 생성 폭주를 방지합니다.                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120분) | 레인별 대체 제한 시간이며, 선택된 라이브/후반부 레인은 더 엄격한 상한을 사용합니다.                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 일시적인 라이브 제공자 실패에 대한 재시도 횟수입니다.                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | 꺼짐                 | Docker를 실행하지 않고 레인 매니페스트를 출력합니다.                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | 활성 레인 상태 출력 간격입니다.                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | 켜짐                  | 최장 우선 순서 지정에 `.artifacts/docker-tests/lane-timings.json`을 재사용하며, 비활성화하려면 `0`으로 설정합니다.                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | 결정적/로컬 레인만 실행하려면 `skip`, 라이브 제공자 레인만 실행하려면 `only`을 사용합니다. 별칭: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. 라이브 전용 모드는 기본 라이브 레인과 후반부 라이브 레인을 하나의 최장 우선 풀로 병합하여 제공자 버킷이 Claude/Codex/Gemini 작업을 함께 구성하도록 합니다. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI 백엔드 Docker 설정 제한 시간입니다.                                                                                                                                                                                                                                                          |

리소스 상한의 환경 변수 패턴은 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`입니다(리소스 이름은 대문자로 변환되고 영숫자가 아닌 문자는 `_`으로 통합됨).

기타 동작: 러너는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 정리하며, 호환되는 레인 간에 제공자 CLI 도구 캐시를 공유하고, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`이 설정되지 않은 경우 첫 번째 실패 이후 새로운 풀링 레인의 예약을 중단합니다. 병렬 처리 수준이 낮은 호스트에서 한 레인이 유효 가중치/리소스 상한을 초과하더라도 빈 풀에서 시작하여 용량을 해제할 때까지 단독으로 실행할 수 있습니다. 레인별 로그, `summary.json`, `failures.json`, 단계별 소요 시간은 `.artifacts/docker-tests/<run-id>/` 아래에 기록됩니다. 느린 레인을 검사하려면 `pnpm test:docker:timings <summary.json>`을 사용하고, 비용이 적게 드는 대상별 재실행 명령을 출력하려면 `pnpm test:docker:rerun <run-id|summary.json|failures.json>`를 사용하십시오.

### 주요 Docker 레인

| 명령                                                                        | 검증 항목                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | 원시 CDP와 격리된 Gateway를 사용하는 Chromium 기반 소스 E2E 컨테이너입니다. `browser doctor --deep` CDP 역할 스냅샷에는 링크 URL, 커서에 의해 클릭 가능 항목으로 승격된 요소, iframe 참조 및 프레임 메타데이터가 포함됩니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | `skills.install.allowUploadedArchives: false`을 사용하는 기본 Docker 러너에 패키징된 tarball을 설치하고, 실시간 ClawHub 검색에서 현재 Skills 슬러그를 확인하고, `openclaw skills install`을 통해 설치한 다음, `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` 및 `skills info --json`을 검증합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 집중형 CLI 백엔드 실시간 프로브입니다. Gemini에는 대응하는 `:resume` 및 `:mcp` 별칭이 있습니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | Docker에서 실행되는 OpenClaw + Open WebUI입니다. 로그인하고 `/api/models`을 확인한 다음, `/api/chat/completions`을 통해 실제 프록시 채팅을 실행합니다. 사용 가능한 실시간 모델 키가 필요하고 외부 이미지를 가져옵니다. 단위/E2E 스위트와 같은 CI 안정성은 기대하지 않습니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | 시드된 Gateway 컨테이너와 `openclaw mcp serve`을 생성하는 클라이언트 컨테이너입니다. 실제 stdio 브리지를 통해 라우팅된 대화 탐색, 트랜스크립트 읽기, 첨부 파일 메타데이터, 실시간 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 및 권한 알림을 검증합니다(어설션은 원시 stdio MCP 프레임을 직접 읽습니다).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | 변경 사항이 남아 있는 이전 사용자 픽스처 위에 패키징된 tarball을 설치하고, 실시간 제공자/채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행하고, 루프백 Gateway를 시작한 다음 에이전트/채널 구성, Plugin 허용 목록, 작업 공간/세션 파일, 오래된 레거시 Plugin 의존성 상태, 시작 및 RPC 상태가 유지되는지 확인합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | 기본적으로 `openclaw@latest`을 설치하고, 현실적인 기존 사용자 파일을 시드하고, 내장된 `openclaw config set` 레시피를 통해 구성하고, 패키징된 tarball로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 기록한 다음, `/healthz`, `/readyz` 및 RPC 상태를 확인합니다. `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 재정의하거나, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`으로 매트릭스를 확장하거나, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`으로 시나리오 픽스처를 추가할 수 있습니다(`configured-plugin-installs` 및 `stale-source-plugin-shadow` 포함). 패키지 인수 테스트에서는 이를 `published_upgrade_survivor_baseline(s)` / `_scenarios`로 노출하고 `last-stable-4` 또는 `all-since-2026.4.23` 같은 메타 토큰을 해석합니다. |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` 시나리오의 게시된 업그레이드 생존성 하네스로, 기본적으로 `openclaw@2026.4.23`에서 시작합니다. `Update Migration` 워크플로는 `baselines=all-since-2026.4.23`를 사용하여 이를 확장하고, 전체 릴리스 CI 외부에서 구성된 Plugin의 의존성 정리를 입증합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | 로컬 경로, `file:`, 호이스팅된 의존성이 있는 npm 레지스트리 패키지, 이동하는 git 참조, ClawHub 픽스처, 마켓플레이스 업데이트, Claude 번들 활성화/검사에 대한 설치/업데이트 스모크 테스트입니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## 로컬 PR 게이트

로컬 PR 랜딩/게이트 검사를 실행하려면 다음을 실행하십시오.

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

부하가 높은 호스트에서 `pnpm test`이 간헐적으로 실패하면 회귀로 간주하기 전에 한 번 재실행한 다음, `pnpm test <path/to/test>`를 사용하여 격리하십시오. 메모리가 제한된 호스트에서는 다음을 사용하십시오.

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 테스트 성능 도구

- `pnpm test:perf:imports`: 명시적인 파일/디렉터리 대상을 위한 범위 지정 레인 라우팅을 계속 사용하면서 Vitest 가져오기 소요 시간 및 가져오기 세부 내역 보고를 활성화합니다. `pnpm test:perf:imports:changed`은 동일한 프로파일링 범위를 `origin/main` 이후 변경된 파일로 한정합니다.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`은 동일하게 커밋된 git diff에 대해 라우팅된 변경 모드 경로와 네이티브 루트 프로젝트 실행을 벤치마크합니다. `pnpm test:perf:changed:bench -- --worktree`은 먼저 커밋하지 않고 현재 작업 트리 변경 세트를 벤치마크합니다.
- `pnpm test:perf:profile:main`은 Vitest 기본 스레드의 CPU 프로파일을 기록합니다(`.artifacts/vitest-main-profile`). `pnpm test:perf:profile:runner`는 단위 테스트 러너의 CPU 및 힙 프로파일을 기록합니다(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 모든 전체 스위트 Vitest 리프 구성을 직렬로 실행하고, 그룹화된 소요 시간 데이터와 구성별 JSON/로그 아티팩트를 기록합니다. 전체 스위트 보고서는 기본적으로 파일을 격리하므로 이전 파일에서 유지된 모듈 그래프와 GC 일시 중지 시간이 이후 어설션에 부과되지 않습니다. 공유 워커 누적을 의도적으로 프로파일링하는 경우에만 `-- --no-isolate`를 전달하십시오. 테스트 성능 에이전트는 느린 테스트 수정을 시도하기 전에 이를 기준선으로 사용합니다. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`은 성능 중심 변경 후 그룹화된 보고서를 비교합니다.
- 전체, 확장 및 포함 패턴 샤드 실행은 `.artifacts/vitest-shard-timings.json`의 로컬 타이밍 데이터를 업데이트하며, 이후 전체 구성 실행에서는 해당 타이밍을 사용하여 느린 샤드와 빠른 샤드의 균형을 맞춥니다. 포함 패턴 CI 샤드는 타이밍 키에 샤드 이름을 추가하므로 전체 구성 타이밍 데이터를 대체하지 않고 필터링된 샤드 타이밍을 계속 표시할 수 있습니다. 로컬 타이밍 아티팩트를 무시하려면 `OPENCLAW_TEST_PROJECTS_TIMINGS=0`을 설정하십시오.

## 벤치마크

<Accordion title="모델 지연 시간(scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

선택적 환경 변수: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. 기본 프롬프트: "한 단어로만 답하십시오: ok. 구두점이나 추가 텍스트를 포함하지 마십시오."

</Accordion>

<Accordion title="CLI 시작(scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

프리셋:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 두 프리셋을 결합

출력에는 명령별 `sampleCount`, 평균, p50, p95, 최솟값/최댓값, 종료 코드/신호 분포 및 최대 RSS가 포함됩니다. `--cpu-prof-dir` / `--heap-prof-dir`는 실행마다 V8 프로파일을 기록합니다.

저장된 출력: `pnpm test:startup:bench:smoke`는 `.artifacts/cli-startup-bench-smoke.json`를 기록하고, `pnpm test:startup:bench:save`는 `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`)를 기록합니다. 체크인된 픽스처: `test/fixtures/cli-startup-bench.json`이며, `pnpm test:startup:bench:update`로 갱신하고 `pnpm test:startup:bench:check`로 비교합니다.

</Accordion>

<Accordion title="Gateway 시작(scripts/bench-gateway-startup.ts)">

기본값은 `dist/entry.js`의 빌드된 CLI 진입점입니다. 먼저 `pnpm build`을 실행하십시오. 대신 소스 러너를 측정하려면 `--entry scripts/run-node.mjs`을 전달하고, 해당 결과를 빌드된 진입점 기준선과 분리하여 관리하십시오.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

케이스 ID: `default`, `skipChannels`(채널 시작 건너뜀), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins`(매니페스트 Plugin 50개), `fiftyStartupLazyPlugins`(시작 시 지연 로드되는 매니페스트 Plugin 50개).

출력에는 첫 번째 프로세스 출력, `/healthz`, `/readyz`, HTTP 수신 로그 시간, Gateway 준비 로그 시간, CPU 시간, CPU 코어 비율, 최대 RSS, 힙, 시작 추적 지표, 이벤트 루프 지연 및 Plugin 조회 테이블 세부 지표가 포함됩니다. 스크립트는 자식 Gateway 환경에 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`을 설정합니다.

`/healthz`은 활성 상태입니다(HTTP 서버가 응답할 수 있음). `/readyz`은 사용 가능한 준비 상태입니다(시작 Plugin 사이드카, 채널 및 연결 후 준비에 필수적인 작업이 안정화됨). 시작 훅은 비동기적으로 디스패치되며 준비 상태 보장에 포함되지 않습니다. 준비 로그 시간은 Gateway의 내부 타임스탬프로, 프로세스 측의 원인 귀속에는 유용하지만 외부 `/readyz` 프로브를 대체하지는 않습니다.

변경 사항을 비교할 때는 JSON 출력 또는 `--output`을 사용하십시오. 추적 출력이 단계 타이밍만으로는 설명할 수 없는 가져오기, 컴파일 또는 CPU 바운드 작업을 가리키는 경우에만 `--cpu-prof-dir`를 사용하십시오.

</Accordion>

<Accordion title="Gateway 재시작(scripts/bench-gateway-restart.ts)">

macOS와 Linux에서만 지원됩니다(프로세스 내 재시작에 SIGUSR1을 사용하며 Windows에서는 즉시 실패함). 위의 Gateway 시작과 동일하게 빌드된 진입점이 기본값이며 `--entry scripts/run-node.mjs`으로 재정의할 수 있습니다.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

케이스 ID: `skipChannels`, `skipChannelsAcpxProbe`(ACPX 시작 프로브 켜짐), `skipChannelsNoAcpxProbe`(프로브 꺼짐), `default`, `fiftyPlugins`.

출력에는 다음 `/healthz`, 다음 `/readyz`, 중단 시간, 재시작 준비 타이밍, CPU, RSS, 대체 프로세스의 시작 추적 지표와 신호 처리, 활성 작업 드레이닝, 종료 단계, 다음 시작, 준비 타이밍 및 메모리 스냅샷에 대한 재시작 추적 지표가 포함됩니다. 스크립트는 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 및 `OPENCLAW_GATEWAY_RESTART_TRACE=1`를 설정합니다.

변경 사항이 재시작 신호 처리, 종료 핸들러, 재시작 후 시작, 사이드카 종료, 서비스 인계 또는 재시작 후 준비 상태에 영향을 미치는 경우 이 벤치마크를 사용하십시오. 채널 시작과 Gateway 메커니즘을 분리하려면 `skipChannels`부터 시작하고, 좁은 범위의 케이스로 재시작 경로를 설명한 후에만 `default` 또는 Plugin이 많은 케이스를 사용하십시오. 추적 지표는 원인 귀속을 위한 단서이지 판정 결과가 아닙니다. 여러 샘플, 일치하는 소유자 구간, `/healthz`/`/readyz` 동작 및 사용자에게 표시되는 재시작 계약을 기준으로 재시작 변경 사항을 판단하십시오.

</Accordion>

## 온보딩 E2E(Docker)

선택 사항이며 컨테이너화된 온보딩 스모크 테스트에만 필요합니다. 깨끗한 Linux 컨테이너에서 전체 콜드 스타트 흐름을 실행합니다.

```bash
scripts/e2e/onboard-docker.sh
```

의사 TTY를 통해 대화형 마법사를 구동하고 구성/작업 공간/세션 파일을 검증한 다음, Gateway를 시작하고 `openclaw health`을 실행합니다.

## QR 가져오기 스모크(Docker)

유지 관리되는 QR 런타임 헬퍼가 지원되는 Docker Node 런타임에서 로드되는지 확인합니다(Node 24가 기본값이며 Node 22와 호환됨).

```bash
pnpm test:docker:qr
```

## 관련 항목

- [테스트](/ko/help/testing)
- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)
