---
read_when:
    - 로컬 또는 CI에서 테스트 실행
    - 모델/제공자 버그에 대한 회귀 테스트 추가
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: 단위/e2e/라이브 스위트, Docker 러너, 각 테스트의 검증 범위'
title: 테스트
x-i18n:
    generated_at: "2026-05-11T20:31:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소규모 Docker runner 세트가 있습니다. 이 문서는 "테스트 방법" 가이드입니다.

- 각 스위트가 다루는 범위(그리고 의도적으로 다루지 _않는_ 범위).
- 일반적인 workflow(local, pre-push, debugging)에서 실행할 명령.
- live 테스트가 자격 증명을 발견하고 model/provider를 선택하는 방법.
- 실제 model/provider 문제에 대한 regression을 추가하는 방법.

<Note>
**QA stack(qa-lab, qa-channel, live transport lane)**은 별도로 문서화되어 있습니다.

- [QA 개요](/ko/concepts/qa-e2e-automation) - 아키텍처, 명령 표면, 시나리오 작성.
- [Matrix QA](/ko/concepts/qa-matrix) - `pnpm openclaw qa matrix` 참조.
- [QA channel](/ko/channels/qa-channel) - repo-backed 시나리오에서 사용하는 synthetic transport Plugin.

이 페이지는 일반 test suite와 Docker/Parallels runner 실행을 다룹니다. 아래 QA 전용 runner 섹션([QA 전용 runner](#qa-specific-runners))에는 구체적인 `qa` 호출이 나열되어 있으며, 위의 참조로 다시 연결됩니다.
</Note>

## 빠른 시작

대부분의 경우:

- 전체 gate(push 전에 예상됨): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 local full-suite 실행: `pnpm test:max`
- 직접 Vitest watch loop: `pnpm test:watch`
- 직접 file targeting은 이제 extension/channel path도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 failure를 반복 작업 중일 때는 먼저 target run을 선호하세요.
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 건드렸거나 추가 확신이 필요할 때:

- Coverage gate: `pnpm test:coverage`
- E2E suite: `pnpm test:e2e`

실제 provider/model을 debugging할 때(실제 자격 증명 필요):

- Live suite(model + Gateway tool/image probe): `pnpm test:live`
- 하나의 live file을 조용히 target: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime performance report: 실제 `openai/gpt-5.4` agent turn에는
  `live_gpt54=true`를, Kova CPU/heap/trace artifact에는
  `deep_profile=true`를 사용해 `OpenClaw Performance`를 dispatch합니다. 일일 scheduled run은
  `CLAWGRIT_REPORTS_TOKEN`이 구성된 경우 mock-provider, deep-profile, GPT 5.4 lane artifact를
  `openclaw/clawgrit-reports`에 게시합니다. mock-provider report에는 source-level gateway boot, memory,
  plugin-pressure, repeated fake-model hello-loop, CLI startup 수치도 포함됩니다.
- Docker live model sweep: `pnpm test:docker:live-models`
  - 선택된 각 model은 이제 text turn과 작은 file-read-style probe를 실행합니다.
    metadata가 `image` input을 알리는 model은 작은 image turn도 실행합니다.
    provider failure를 격리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 probe를 비활성화하세요.
  - CI coverage: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 모두 reusable live/E2E workflow를
    `include_live_suites: true`로 호출하며, 여기에는 provider별로 shard된 별도 Docker live model
    matrix job이 포함됩니다.
  - 집중 CI rerun의 경우 `include_live_suites: true` 및 `live_models_only: true`로
    `OpenClaw Live And E2E Checks (Reusable)`를 dispatch하세요.
  - 새로운 high-signal provider secret은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 그
    scheduled/release caller에 추가하세요.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server path에 대해 Docker live lane을 실행하고, synthetic
    Slack DM을 `/codex bind`로 bind하고, `/codex fast`와
    `/codex permissions`를 실행한 다음, plain reply와 image attachment가
    ACP 대신 native Plugin binding을 통해 route되는지 검증합니다.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin-owned Codex app-server harness를 통해 Gateway agent turn을 실행하고,
    `/codex status`와 `/codex models`를 검증하며, 기본적으로 image,
    Cron MCP, sub-agent, Guardian probe를 실행합니다. 다른 Codex
    app-server failure를 격리할 때는 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`으로
    sub-agent probe를 비활성화하세요. 집중 sub-agent check의 경우 다른 probe를 비활성화하세요:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    이는 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`이 설정되지 않은 한 sub-agent probe 후 종료됩니다.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Docker에서 packaged OpenClaw tarball을 설치하고, OpenAI API-key onboarding을 실행하며,
    Codex Plugin과 `@openai/codex` dependency가 필요 시 managed npm root로 다운로드되었는지 검증합니다.
- Live Plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - 실제 `slugify` dependency가 있는 fixture Plugin을 pack하고, `npm-pack:`을 통해 설치하며,
    managed npm root 아래 dependency를 검증한 다음, live OpenAI model에 Plugin tool을 호출하고 hidden slug를 반환하도록 요청합니다.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command 표면에 대한 opt-in belt-and-suspenders check입니다.
    `/crestodian status`를 실행하고, persistent model change를 queue하고,
    `/crestodian yes`에 reply하며, audit/config write path를 검증합니다.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH`에 fake Claude CLI가 있는 configless container에서 Crestodian을 실행하고,
    fuzzy planner fallback이 audited typed config write로 변환되는지 검증합니다.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw state dir에서 시작해 bare `openclaw`를
    Crestodian으로 route하고, setup/model/agent/Discord Plugin + SecretRef write를 적용하며,
    config를 validate하고 audit entry를 검증합니다. 동일한 Ring 0 setup path는 QA Lab에서도
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`으로 다룹니다.
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY`를 설정한 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 다음,
  `moonshot/kimi-k2.6`에 대해 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`을 실행합니다.
  JSON이 Moonshot/K2.6을 report하고 assistant transcript가 normalized `usage.cost`를 저장하는지 검증합니다.

<Tip>
실패하는 case 하나만 필요할 때는 아래에 설명된 allowlist env var를 통해 live test를 좁히는 것을 선호하세요.
</Tip>

## QA 전용 runner

QA-lab realism이 필요할 때 이 명령들은 main test suite 옆에 위치합니다.

CI는 전용 workflow에서 QA Lab을 실행합니다. Agentic parity는 standalone PR workflow가 아니라
`QA-Lab - All Lanes`와 release validation 아래에 중첩되어 있습니다.
Broad validation은 `rerun_group=qa-parity`가 있는 `Full Release Validation` 또는 release-checks QA group을 사용해야 합니다.
Stable/default release check는 exhaustive live/Docker soak을 `run_release_soak=true` 뒤에 유지합니다.
`full` profile은 soak을 강제로 켭니다. `QA-Lab - All Lanes`는
mock parity lane, live Matrix lane, Convex-managed live Telegram lane, Convex-managed live Discord
lane을 parallel job으로 사용해 `main`에서 nightly 및 manual dispatch로 실행됩니다. Scheduled QA와 release check는 Matrix
`--profile fast`를 명시적으로 전달하는 반면, Matrix CLI와 manual workflow input
default는 `all`로 유지됩니다. manual dispatch는 `all`을 `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` job으로 shard할 수 있습니다. `OpenClaw Release
Checks`는 release approval 전에 parity와 fast Matrix 및 Telegram lane을 실행하며,
release transport check에는 `mock-openai/gpt-5.5`를 사용해 deterministic하게 유지하고 일반 provider-plugin startup을 피합니다.
이러한 live transport Gateway는 memory search를 비활성화합니다. memory behavior는 QA parity suite에서 계속 다룹니다.

Full release live media shard는
`ffmpeg`와 `ffprobe`가 이미 포함된
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`를 사용합니다. Docker live model/backend shard는 선택된 commit마다 한 번 build되는 공유
`ghcr.io/openclaw/openclaw-live-test:<sha>` image를 사용한 다음, 각 shard 내부에서 rebuild하는 대신
`OPENCLAW_SKIP_DOCKER_BUILD=1`로 pull합니다.

- `pnpm openclaw qa suite`
  - 호스트에서 저장소 기반 QA 시나리오를 직접 실행합니다.
  - 기본적으로 격리된 Gateway 워커를 사용하여 선택된 여러 시나리오를 병렬로 실행합니다. `qa-channel`의 기본 동시성은 4입니다(선택된 시나리오 수로 제한됨). 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 이전 직렬 레인에는 `--concurrency 1`을 사용합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용합니다.
  - 제공자 모드 `live-frontier`, `mock-openai`, `aimock`을 지원합니다.
    `aimock`은 시나리오 인식 `mock-openai` 레인을 대체하지 않고 실험적 픽스처 및 프로토콜 모의 적용 범위를 위해 로컬 AIMock 기반 제공자 서버를 시작합니다.
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab을 통해 라이브 OpenAI Kitchen Sink Plugin 검증 절차를 실행합니다. 외부 Kitchen Sink 패키지를 설치하고, Plugin SDK 표면 인벤토리를 검증하고, `/healthz`와 `/readyz`를 프로브하고, Gateway CPU/RSS 증거를 기록하고, 라이브 OpenAI 턴을 실행하며, 적대적 진단을 확인합니다.
    `OPENAI_API_KEY` 같은 라이브 OpenAI 인증이 필요합니다. 하이드레이션된 Testbox 세션에서는 `openclaw-testbox-env` 헬퍼가 있을 때 Testbox 라이브 인증 프로필을 자동으로 소싱합니다.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 시작 벤치와 작은 모의 QA Lab 시나리오 팩(`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`)을 실행하고 결합된 CPU 관찰 요약을 `.artifacts/gateway-cpu-scenarios/` 아래에 씁니다.
  - 기본적으로 지속적인 고열 CPU 관찰만 표시하므로(`--cpu-core-warn` 및 `--hot-wall-warn-ms`), 짧은 시작 버스트는 몇 분간 지속되는 Gateway 고정 회귀처럼 보이지 않고 메트릭으로 기록됩니다.
  - 빌드된 `dist` 아티팩트를 사용합니다. 체크아웃에 최신 런타임 출력이 아직 없으면 먼저 빌드를 실행합니다.
- `pnpm openclaw qa suite --runner multipass`
  - 일회용 Multipass Linux VM 안에서 동일한 QA 제품군을 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 제공자/모델 선택 플래그를 재사용합니다.
  - 라이브 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다:
    env 기반 제공자 키, QA 라이브 제공자 구성 경로, 존재하는 경우 `CODEX_HOME`.
  - 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 출력 디렉터리는 저장소 루트 아래에 있어야 합니다.
  - 일반 QA 보고서와 요약, Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 씁니다.
- `pnpm qa:lab:up`
  - 운영자 스타일 QA 작업을 위해 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드하고, Docker에 전역 설치하고, 비대화형 OpenAI API 키 온보딩을 실행하고, 기본적으로 Telegram을 구성하고, 패키징된 Plugin 런타임이 시작 시 의존성 복구 없이 로드되는지 검증하고, doctor를 실행하고, 모의 OpenAI 엔드포인트를 대상으로 로컬 에이전트 턴 하나를 실행합니다.
  - Discord로 동일한 패키지 설치 레인을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용합니다.
- `pnpm test:docker:session-runtime-context`
  - 임베디드 런타임 컨텍스트 transcript에 대해 결정론적 빌드 앱 Docker smoke를 실행합니다. 숨겨진 OpenClaw 런타임 컨텍스트가 표시되는 사용자 턴으로 유출되지 않고 비표시 사용자 지정 메시지로 유지되는지 검증한 다음, 영향받는 깨진 세션 JSONL을 시드하고 `openclaw doctor --fix`가 백업과 함께 활성 브랜치로 다시 쓰는지 검증합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 OpenClaw 패키지 후보를 설치하고, 설치된 패키지 온보딩을 실행하고, 설치된 CLI를 통해 Telegram을 구성한 다음, 설치된 패키지를 SUT Gateway로 사용하여 라이브 Telegram QA 레인을 재사용합니다.
  - 래퍼는 체크아웃에서 `qa-lab` 하네스 소스만 마운트합니다. 설치된 패키지가 `dist`, `openclaw/plugin-sdk`, 번들된 Plugin 런타임을 소유하므로 레인은 현재 체크아웃 Plugin을 테스트 대상 패키지에 섞지 않습니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다. 레지스트리에서 설치하는 대신 해석된 로컬 tarball을 테스트하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 또는 `OPENCLAW_CURRENT_PACKAGE_TGZ`를 설정합니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env 자격 증명 또는 Convex 자격 증명 소스를 사용합니다. CI/릴리스 자동화의 경우 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와 `OPENCLAW_QA_CONVEX_SITE_URL` 및 역할 시크릿을 설정합니다. CI에 `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex 역할 시크릿이 있으면 Docker 래퍼가 자동으로 Convex를 선택합니다.
  - 래퍼는 Docker 빌드/설치 작업 전에 호스트에서 Telegram 또는 Convex 자격 증명 env를 검증합니다. 자격 증명 이전 설정을 의도적으로 디버깅할 때만 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`을 설정합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 대해서만 공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다.
  - GitHub Actions는 이 레인을 수동 maintainer 워크플로 `NPM Telegram Beta E2E`로 노출합니다. 병합 시에는 실행되지 않습니다. 워크플로는 `qa-live-shared` 환경과 Convex CI 자격 증명 임대를 사용합니다.
- GitHub Actions는 후보 패키지 하나에 대한 사이드 실행 제품 증거용 `Package Acceptance`도 노출합니다. 신뢰할 수 있는 ref, 게시된 npm spec, HTTPS tarball URL과 SHA-256, 또는 다른 실행의 tarball 아티팩트를 받고, 정규화된 `openclaw-current.tgz`를 `package-under-test`로 업로드한 다음, smoke, package, product, full 또는 custom 레인 프로필로 기존 Docker E2E 스케줄러를 실행합니다. 동일한 `package-under-test` 아티팩트를 대상으로 Telegram QA 워크플로를 실행하려면 `telegram_mode=mock-openai` 또는 `live-frontier`를 설정합니다.
  - 최신 beta 제품 증거:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 정확한 tarball URL 증거에는 다이제스트가 필요합니다:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 아티팩트 증거는 다른 Actions 실행에서 tarball 아티팩트를 다운로드합니다:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 현재 OpenClaw 빌드를 Docker에서 패킹하고 설치하고, OpenAI가 구성된 상태로 Gateway를 시작한 다음 구성 편집을 통해 번들된 채널/Plugin을 활성화합니다.
  - 설정 탐지가 구성되지 않은 다운로드 가능 Plugin을 제외하는지, 첫 번째로 구성된 doctor 복구가 누락된 각 다운로드 가능 Plugin을 명시적으로 설치하는지, 두 번째 재시작이 숨겨진 의존성 복구를 실행하지 않는지 검증합니다.
  - 또한 알려진 이전 npm baseline을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화하며, 후보의 업데이트 후 doctor가 하네스 측 postinstall 복구 없이 레거시 Plugin 의존성 잔여물을 정리하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels 게스트 전반에서 네이티브 패키지 설치 업데이트 smoke를 실행합니다. 선택된 각 플랫폼은 먼저 요청된 baseline 패키지를 설치한 다음, 같은 게스트에서 설치된 `openclaw update` 명령을 실행하고 설치된 버전, 업데이트 상태, Gateway 준비 상태, 로컬 에이전트 턴 하나를 검증합니다.
  - 한 게스트에서 반복 작업할 때는 `--platform macos`, `--platform windows` 또는 `--platform linux`를 사용합니다. 요약 아티팩트 경로와 레인별 상태에는 `--json`을 사용합니다.
  - OpenAI 레인은 기본적으로 라이브 에이전트 턴 증거에 `openai/gpt-5.5`를 사용합니다. 다른 OpenAI 모델을 의도적으로 검증할 때는 `--model <provider/model>`을 전달하거나 `OPENCLAW_PARALLELS_OPENAI_MODEL`을 설정합니다.
  - Parallels 전송 정체가 나머지 테스트 시간을 소모하지 않도록 긴 로컬 실행을 호스트 timeout으로 감쌉니다:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 중첩 레인 로그를 `/tmp/openclaw-parallels-npm-update.*` 아래에 씁니다.
    외부 래퍼가 멈췄다고 가정하기 전에 `windows-update.log`, `macos-update.log` 또는 `linux-update.log`를 검사합니다.
  - Windows 업데이트는 콜드 게스트에서 업데이트 후 doctor 및 패키지 업데이트 작업에 10분에서 15분이 걸릴 수 있습니다. 중첩 npm 디버그 로그가 진행 중이라면 정상입니다.
  - 이 집계 래퍼를 개별 Parallels macOS, Windows 또는 Linux smoke 레인과 병렬로 실행하지 마세요. VM 상태를 공유하며 스냅샷 복원, 패키지 제공 또는 게스트 Gateway 상태에서 충돌할 수 있습니다.
  - 업데이트 후 증거는 일반 번들 Plugin 표면을 실행합니다. 에이전트 턴 자체가 단순한 텍스트 응답만 확인하더라도 음성, 이미지 생성, 미디어 이해 같은 capability facade가 번들 런타임 API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 smoke 테스트를 위해 로컬 AIMock 제공자 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix 라이브 QA 레인을 실행합니다. 소스 체크아웃 전용입니다. 패키징된 설치에는 `qa-lab`이 포함되지 않습니다.
  - 전체 CLI, 프로필/시나리오 카탈로그, env vars, 아티팩트 레이아웃: [Matrix QA](/ko/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT bot token을 사용하여 실제 비공개 그룹을 대상으로 Telegram 라이브 QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. 그룹 id는 숫자 Telegram chat id여야 합니다.
  - 공유 풀 자격 증명에는 `--credential-source convex`를 지원합니다. 기본적으로 env 모드를 사용하거나, 풀링된 임대를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정합니다.
  - 기본값은 canary, mention gating, command addressing, `/status`, bot-to-bot 언급 답장, core native command 답장을 포함합니다. `mock-openai` 기본값은 결정론적 reply-chain 및 Telegram final-message streaming 회귀도 포함합니다. `session_status` 같은 선택적 프로브에는 `--list-scenarios`를 사용합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용합니다.
  - 같은 비공개 그룹에 서로 다른 두 봇이 필요하며, SUT 봇은 Telegram 사용자 이름을 노출해야 합니다.
  - 안정적인 bot-to-bot 관찰을 위해 `@BotFather`에서 두 봇 모두에 Bot-to-Bot Communication Mode를 활성화하고 driver bot이 그룹 봇 트래픽을 관찰할 수 있는지 확인합니다.
  - Telegram QA 보고서, 요약, 관찰된 메시지 아티팩트를 `.artifacts/qa-e2e/...` 아래에 씁니다. 답장 시나리오에는 driver send request부터 관찰된 SUT reply까지의 RTT가 포함됩니다.

`Mantis Telegram Live`는 이 레인을 감싸는 PR 증거 래퍼입니다. 후보 ref를 Convex 임대 Telegram 자격 증명으로 실행하고, Crabbox 데스크톱 브라우저에서 수정된 관찰 메시지 transcript를 렌더링하고, MP4 증거를 기록하고, motion-trimmed GIF를 생성하고, 아티팩트 번들을 업로드하며, `pr_number`가 설정되면 Mantis GitHub App을 통해 인라인 PR 증거를 게시합니다. Maintainer는 Actions UI의 `Mantis Scenario`(`scenario_id:
telegram-live`)를 통해 시작하거나 pull request 댓글에서 직접 시작할 수 있습니다:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof`는 PR 시각적 증거를 위한 에이전트형 네이티브 Telegram Desktop before/after 래퍼입니다. 자유 형식 `instructions`를 사용해 Actions UI에서, `Mantis Scenario`(`scenario_id:
telegram-desktop-proof`)를 통해, 또는 PR 댓글에서 시작합니다:

```text
@Mantis telegram desktop proof
```

Mantis 에이전트는 PR을 읽고, 어떤 Telegram에 표시되는 동작이 변경 사항을 입증하는지 결정하며, 기준 및 후보 ref에서 실제 사용자 Crabbox Telegram Desktop 증명 레인을 실행하고, 네이티브 GIF가 유용해질 때까지 반복하며, 쌍을 이룬 `motionPreview` 매니페스트를 작성하고, `pr_number`가 설정된 경우 Mantis GitHub App을 통해 동일한 2열 GIF 표를 게시합니다.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux 데스크톱을 임대하거나 재사용하고, 네이티브 Telegram Desktop을 설치하며, 임대한 Telegram SUT 봇 토큰으로 OpenClaw를 구성하고, Gateway를 시작한 뒤, 보이는 VNC 데스크톱에서 스크린샷/MP4 증거를 기록합니다.
  - 기본값은 `--credential-source convex`이므로 워크플로에는 Convex 브로커 시크릿만 필요합니다. `pnpm openclaw qa telegram`과 동일한 `OPENCLAW_QA_TELEGRAM_*` 변수를 사용하려면 `--credential-source env`를 사용하세요.
  - Telegram Desktop에는 여전히 사용자 로그인/프로필이 필요합니다. 봇 토큰은 OpenClaw만 구성합니다. base64 `.tgz` 프로필 아카이브에는 `--telegram-profile-archive-env <name>`을 사용하거나, `--keep-lease`를 사용하고 VNC를 통해 한 번 수동으로 로그인하세요.
  - 출력 디렉터리 아래에 `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, `telegram-desktop-builder.mp4`를 작성합니다.

라이브 전송 레인은 하나의 표준 계약을 공유하므로 새 전송이 어긋나지 않습니다. 레인별 커버리지 매트릭스는 [QA 개요 → 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 있습니다. `qa-channel`은 광범위한 합성 제품군이며 해당 매트릭스의 일부가 아닙니다.

### Convex를 통한 공유 Telegram 자격 증명(v1)

라이브 전송 QA에 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면, QA 랩은 Convex 기반 풀에서 독점 임대를 획득하고, 레인이 실행되는 동안 해당 임대에 Heartbeat를 보내며, 종료 시 임대를 해제합니다. 섹션 이름은 Discord, Slack, WhatsApp 지원보다 앞서 만들어졌습니다. 임대 계약은 종류 전반에서 공유됩니다.

참조 Convex 프로젝트 스캐폴드:

- `qa/convex-credential-broker/`

필수 환경 변수:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택한 역할에 대한 시크릿 하나:
  - `maintainer`에는 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`에는 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - 환경 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본값 `ci`, 그 외에는 `maintainer`)

선택 환경 변수:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

정상 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`이 `https://`를 사용해야 합니다.

유지관리자 관리자 명령(풀 추가/제거/목록)은 특히 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

유지관리자를 위한 CLI 도우미:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용하여 시크릿 값을 출력하지 않고 Convex 사이트 URL, 브로커 시크릿, 엔드포인트 접두사, HTTP 타임아웃, 관리자/목록 도달 가능성을 확인하세요. 스크립트와 CI 유틸리티에서 기계 판독 가능 출력을 사용하려면 `--json`을 사용하세요.

기본 엔드포인트 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 성공: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /admin/add`(유지관리자 시크릿만)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(유지관리자 시크릿만)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 임대 가드: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(유지관리자 시크릿만)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram 종류의 페이로드 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자 Telegram 채팅 ID 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하고 잘못된 형식의 페이로드를 거부합니다.

Telegram 실제 사용자 종류의 페이로드 형태:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, `telegramApiId`는 숫자 문자열이어야 합니다.
- `tdlibArchiveSha256` 및 `desktopTdataArchiveSha256`는 SHA-256 16진수 문자열이어야 합니다.
- `kind: "telegram-user"`는 하나의 Telegram 버너 계정을 나타냅니다. 임대를 계정 전체로 취급하세요. TDLib CLI 드라이버와 Telegram Desktop 시각적 증인은 동일한 페이로드에서 복원하며, 한 번에 하나의 작업만 임대를 보유해야 합니다.

Telegram 실제 사용자 임대 복원:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

시각적 녹화가 필요할 때는 `Telegram -workdir "$tmp/desktop"`와 함께 복원된 Desktop 프로필을 사용하세요. 로컬 운영자 환경에서는 프로세스 환경 변수가 없으면 `scripts/e2e/telegram-user-credential.ts`가 기본적으로 `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`를 읽습니다.

에이전트 구동 Crabbox 세션:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start`는 `telegram-user` 자격 증명을 임대하고, 동일한 계정을 Crabbox Linux 데스크톱의 TDLib와 Telegram Desktop에 복원하며, 현재 체크아웃에서 로컬 모의 SUT Gateway를 시작하고, 보이는 Telegram 채팅을 열고, 데스크톱 녹화를 시작하며, 비공개 `session.json`을 작성합니다. 세션이 살아 있는 동안 에이전트는 만족할 때까지 테스트를 계속할 수 있습니다.

- `send --session <file> --text <message>`는 실제 TDLib 사용자를 통해 전송하고 SUT 응답을 기다립니다.
- `run --session <file> -- <remote command>`는 Crabbox에서 임의 명령을 실행하고 출력을 저장합니다. 예: `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>`은 현재 보이는 데스크톱을 캡처합니다.
- `status --session <file>`은 임대 및 WebVNC 명령을 출력합니다.
- `finish --session <file>`은 레코더를 중지하고, 스크린샷/비디오/동작 트리밍 아티팩트를 캡처하며, Convex 자격 증명을 해제하고, 로컬 SUT 프로세스를 중지하며, `--keep-box`가 전달되지 않은 경우 Crabbox 임대를 중지합니다.
- `publish --session <file> --pr <number>`는 기본적으로 GIF 전용 PR 댓글을 게시합니다. 로그 또는 JSON 아티팩트가 의도적으로 필요한 경우에만 `--full-artifacts`를 전달하세요.

결정적인 시각적 재현에는 `start` 또는 단일 명령 `probe` 단축형에 `--mock-response-file <path>`를 전달하세요. 러너의 기본값은 표준 Crabbox 클래스, 24fps 녹화, 24fps 동작 GIF 미리보기, 1920px GIF 너비입니다. 증명에 다른 캡처 설정이 필요할 때만 `--class`, `--record-fps`, `--preview-fps`, `--preview-width`로 재정의하세요.

단일 명령 Crabbox 증명:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

기본 `probe` 명령은 하나의 start/send/finish 주기에 대한 단축형입니다. 빠른 `/status` 스모크에 사용하세요. PR 리뷰, 버그 재현 작업, 또는 증명이 완료되었다고 판단하기 전에 에이전트가 몇 분간 임의 실험을 해야 하는 경우에는 세션 명령을 사용하세요. 따뜻한 데스크톱 임대를 재사용하려면 `--id <cbx_...>`를, finish 후 VNC를 열어 두려면 `--keep-box`를, 보이는 채팅을 선택하려면 `--desktop-chat-title <name>`을, 새 박스에서 TDLib를 빌드하는 대신 미리 빌드된 Linux `libtdjson.so` 아카이브를 사용할 때는 `--tdlib-url <tgz>`를 사용하세요. 러너는 `--tdlib-sha256 <hex>` 또는 기본적으로 형제 `<url>.sha256` 파일로 `--tdlib-url`을 검증합니다.

브로커 검증 다중 채널 페이로드:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 레인도 풀에서 임대할 수 있지만, Slack 페이로드 검증은 현재 브로커가 아니라 Slack QA 러너에 있습니다. Slack 행에는 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`을 사용하세요.

### QA에 채널 추가하기

새 채널 어댑터의 아키텍처 및 시나리오 도우미 이름은 [QA 개요 → 채널 추가하기](/ko/concepts/qa-e2e-automation#adding-a-channel)에 있습니다. 최소 기준: 공유 `qa-lab` 호스트 seam에서 전송 러너를 구현하고, Plugin 매니페스트에 `qaRunners`를 선언하며, `openclaw qa <runner>`로 마운트하고, `qa/scenarios/` 아래에 시나리오를 작성합니다.

## 테스트 제품군(어디에서 무엇이 실행되는가)

제품군을 "현실성 증가"(및 불안정성/비용 증가)로 생각하세요.

### 단위 / 통합(기본값)

- 명령: `pnpm test`
- 구성: 대상이 지정되지 않은 실행은 `vitest.full-*.config.ts` 샤드 세트를 사용하며, 병렬 스케줄링을 위해 다중 프로젝트 샤드를 프로젝트별 구성으로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 코어/단위 인벤토리. UI 단위 테스트는 전용 `unit-ui` 샤드에서 실행됩니다
- 범위:
  - 순수 단위 테스트
  - 프로세스 내 통합 테스트(Gateway 인증, 라우팅, 도구, 파싱, 구성)
  - 알려진 버그에 대한 결정적 회귀
- 기대 사항:
  - CI에서 실행
  - 실제 키 불필요
  - 빠르고 안정적이어야 함
  - 리졸버 및 공개 표면 로더 테스트는 실제 번들 Plugin 소스 API가 아니라 생성된 작은 Plugin 픽스처로 광범위한 `api.js` 및 `runtime-api.js` 대체 동작을 입증해야 합니다. 실제 Plugin API 로드는 Plugin 소유 계약/통합 제품군에 속합니다.

네이티브 의존성 정책:

- 기본 테스트 설치는 선택적 네이티브 Discord opus 빌드를 건너뜁니다. Discord 음성 수신은 순수 JS `opusscript` 디코더를 사용하며, `@discordjs/opus`는 `allowBuilds`에서 계속 비활성화되어 로컬 테스트와 Testbox 레인이 네이티브 애드온을 컴파일하지 않습니다.
- 의도적으로 네이티브 opus 빌드를 비교해야 하는 경우 전용 Discord 음성 성능 레인이나 라이브 레인을 사용하세요. 기본 `allowBuilds`에서 `@discordjs/opus`를 `true`로 설정하지 마세요. 그렇게 하면 관련 없는 설치/테스트 루프가 네이티브 코드를 컴파일하게 됩니다.

<AccordionGroup>
  <Accordion title="프로젝트, 샤드, 범위 지정 레인">

    - 대상이 지정되지 않은 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 걸린 머신에서 최대 RSS를 줄이고 auto-reply/확장 작업이 관련 없는 스위트를 굶주리게 하는 일을 피할 수 있습니다.
    - `pnpm test --watch`는 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다. 다중 샤드 watch 루프는 실용적이지 않기 때문입니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적인 파일/디렉터리 대상을 먼저 범위 지정 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
    - `pnpm test:changed`는 기본적으로 변경된 git 경로를 저렴한 범위 지정 레인으로 확장합니다. 직접 테스트 편집, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import 그래프 의존 항목이 포함됩니다. config/setup/package 편집은 명시적으로 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하지 않는 한 테스트를 광범위하게 실행하지 않습니다.
    - `pnpm check:changed`는 좁은 범위 작업을 위한 일반적인 스마트 로컬 체크 게이트입니다. diff를 코어, 코어 테스트, 확장, 확장 테스트, 앱, 문서, 릴리스 메타데이터, 라이브 Docker 도구, 도구로 분류한 다음, 그에 맞는 typecheck, lint, guard 명령을 실행합니다. Vitest 테스트는 실행하지 않습니다. 테스트 증명이 필요하면 `pnpm test:changed` 또는 명시적인 `pnpm test <target>`을 호출하세요. 릴리스 메타데이터 전용 버전 bump는 대상 지정 버전/config/root-dependency 체크를 실행하며, 최상위 버전 필드 밖의 package 변경을 거부하는 guard가 포함됩니다.
    - 라이브 Docker ACP harness 편집은 집중 체크를 실행합니다. 라이브 Docker auth 스크립트의 셸 구문과 라이브 Docker scheduler dry-run입니다. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로 제한될 때만 포함됩니다. dependency, export, version, 그 밖의 package 표면 편집은 여전히 더 넓은 guard를 사용합니다.
    - agents, commands, plugins, auto-reply 헬퍼, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import-light 단위 테스트는 `unit-fast` 레인으로 라우팅되며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태 기반/runtime-heavy 파일은 기존 레인에 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 changed-mode 실행을 해당 light 레인의 명시적인 형제 테스트로 매핑하므로, 헬퍼 편집은 해당 디렉터리의 전체 heavy 스위트를 다시 실행하지 않습니다.
    - `auto-reply`에는 최상위 코어 헬퍼, 최상위 `reply.*` 통합 테스트, `src/auto-reply/reply/**` 하위 트리를 위한 전용 버킷이 있습니다. CI는 reply 하위 트리를 agent-runner, dispatch, commands/state-routing 샤드로 추가 분할하여 하나의 import-heavy 버킷이 전체 Node 꼬리 구간을 독점하지 않게 합니다.
    - 일반 PR/main CI는 의도적으로 extension batch sweep과 release-only `agentic-plugins` 샤드를 건너뜁니다. Full Release Validation은 릴리스 후보에서 이러한 plugin/extension-heavy 스위트를 위해 별도의 `Plugin Prerelease` 자식 워크플로를 dispatch합니다.

  </Accordion>

  <Accordion title="임베디드 러너 커버리지">

    - message-tool discovery 입력이나 compaction runtime
      컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 라우팅 및 정규화 경계에 집중된 헬퍼 회귀 테스트를 추가하세요.
    - 임베디드 러너 통합 스위트를 정상 상태로 유지하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이러한 스위트는 범위 지정 id와 compaction 동작이 실제
      `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. 헬퍼 전용 테스트는
      이러한 통합 경로를 충분히 대체할 수 없습니다.

  </Accordion>

  <Accordion title="Vitest pool 및 격리 기본값">

    - 기본 Vitest config의 기본값은 `threads`입니다.
    - 공유 Vitest config는 `isolate: false`를 고정하고
      루트 프로젝트, e2e, live config 전반에서 비격리 러너를 사용합니다.
    - 루트 UI 레인은 자체 `jsdom` setup과 optimizer를 유지하지만,
      공유 비격리 러너에서도 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest config에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 대규모 로컬 실행 중 V8 compile churn을 줄이기 위해
      기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`를 추가합니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 formatting 전용입니다. 포맷된 파일을 다시 stage하며
      lint, typecheck, test는 실행하지 않습니다.
    - 스마트 로컬 체크 게이트가 필요할 때는 handoff 또는 push 전에
      `pnpm check:changed`를 명시적으로 실행하세요.
    - `pnpm test:changed`는 기본적으로 저렴한 범위 지정 레인을 통해 라우팅됩니다. agent가
      harness, config, package, contract 편집에 더 넓은
      Vitest 커버리지가 정말 필요하다고 판단할 때만
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.
    - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅
      동작을 유지하되 worker cap만 더 높입니다.
    - 로컬 worker auto-scaling은 의도적으로 보수적이며 호스트 load average가 이미 높으면
      물러나므로, 여러 개의 동시
      Vitest 실행이 기본적으로 덜 해롭게 동작합니다.
    - 기본 Vitest config는 테스트
      wiring 변경 시 changed-mode 재실행이 올바르게 유지되도록 projects/config 파일을
      `forceRerunTriggers`로 표시합니다.
    - config는 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성화된 상태로 유지합니다.
      직접 profiling을 위해 명시적인 캐시 위치 하나를 원하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration 보고와
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 profiling 뷰를
      `origin/main` 이후 변경된 파일로 범위 지정합니다.
    - 샤드 timing 데이터는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      전체 config 실행은 config 경로를 키로 사용합니다. include-pattern CI
      샤드는 샤드 이름을 덧붙여 filtered 샤드를 별도로 추적할 수 있게 합니다.
    - 하나의 hot test가 여전히 대부분의 시간을 startup imports에 쓰는 경우,
      heavy dependency를 좁은 로컬 `*.runtime.ts` seam 뒤에 두고
      `vi.mock(...)`을 통해 넘기기 위해 runtime 헬퍼를 deep-import하는 대신
      해당 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 커밋된
      diff에 대해 라우팅된 `test:changed`를 네이티브 루트 프로젝트 경로와 비교하고
      wall time과 macOS 최대 RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 현재
      dirty tree를 benchmark합니다. 변경된 파일 목록을
      `scripts/test-projects.mjs`와 루트 Vitest config를 통해 라우팅합니다.
    - `pnpm test:perf:profile:main`은
      Vitest/Vite startup 및 transform 오버헤드에 대한 main-thread CPU profile을 작성합니다.
    - `pnpm test:perf:profile:runner`는 파일 병렬 처리를 비활성화한
      unit suite에 대한 runner CPU+heap profile을 작성합니다.

  </Accordion>
</AccordionGroup>

### 안정성 (Gateway)

- 명령: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 기본적으로 진단을 활성화한 실제 loopback Gateway를 시작합니다.
  - 진단 이벤트 경로를 통해 synthetic gateway message, memory, large-payload churn을 구동합니다.
  - Gateway WS RPC를 통해 `diagnostics.stability`를 쿼리합니다.
  - 진단 stability bundle persistence 헬퍼를 커버합니다.
  - recorder가 계속 bounded 상태인지, synthetic RSS sample이 pressure budget 아래에 머무는지, session별 queue depth가 다시 0으로 drain되는지 assert합니다.
- 기대사항:
  - CI-safe이며 keyless
  - stability-regression 후속 작업을 위한 좁은 레인이고, 전체 Gateway suite의 대체물은 아님

### E2E (Gateway smoke)

- 명령: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래 bundled-plugin E2E 테스트
- Runtime 기본값:
  - repo의 나머지 부분과 일치하도록 Vitest `threads`를 `isolate: false`와 함께 사용합니다.
  - adaptive worker를 사용합니다(CI: 최대 2, local: 기본 1).
  - console I/O 오버헤드를 줄이기 위해 기본적으로 silent mode로 실행합니다.
- 유용한 override:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`을 사용하세요(최대 16으로 제한).
  - verbose console 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`을 사용하세요.
- 범위:
  - 다중 instance gateway end-to-end 동작
  - WebSocket/HTTP 표면, node pairing, 더 무거운 networking
- 기대사항:
  - CI에서 실행됨(파이프라인에서 활성화된 경우)
  - 실제 key 필요 없음
  - unit test보다 moving parts가 많음(더 느릴 수 있음)

### E2E: OpenShell backend smoke

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell gateway를 시작합니다.
  - 임시 로컬 Dockerfile에서 sandbox를 생성합니다.
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell backend를 실행합니다.
  - sandbox fs bridge를 통해 remote-canonical filesystem 동작을 검증합니다.
- 기대사항:
  - opt-in 전용이며 기본 `pnpm test:e2e` 실행의 일부가 아님
  - 로컬 `openshell` CLI와 동작하는 Docker daemon 필요
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 다음 test gateway와 sandbox를 폐기함
- 유용한 override:
  - 더 넓은 e2e suite를 수동으로 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`을 사용하세요.
  - 기본값이 아닌 CLI 바이너리나 wrapper script를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`을 사용하세요.

### Live (실제 provider + 실제 model)

- 명령: `pnpm test:live`
- 설정: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin live 테스트
- 기본값: `pnpm test:live`로 **활성화됨** (`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - "이 provider/model이 실제 자격 증명으로 _오늘_ 실제로 동작하는가?"
  - provider 형식 변경, 도구 호출 특이점, 인증 문제, rate limit 동작 포착
- 기대 사항:
  - 설계상 CI에서 안정적이지 않음(실제 네트워크, 실제 provider 정책, 할당량, 장애)
  - 비용이 들고 rate limit을 사용함
  - "모든 것" 대신 좁혀진 하위 집합 실행을 선호
- Live 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 source합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 설정/인증 자료를 임시 테스트 홈으로 복사하므로 unit fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live 테스트가 의도적으로 실제 홈 디렉터리를 사용해야 할 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본값으로 사용합니다. `[live] ...` 진행 출력은 유지하지만, 추가 `~/.profile` 알림을 숨기고 gateway 부트스트랩 로그/Bonjour 잡음을 음소거합니다. 전체 시작 로그를 다시 보려면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(provider별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`를 설정하세요(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`). 또는 `OPENCLAW_LIVE_*_KEY`를 통해 live별 override를 설정하세요. 테스트는 rate limit 응답에서 재시도합니다.
- 진행/Heartbeat 출력:
  - Live suite는 이제 stderr로 진행 줄을 내보내므로 Vitest 콘솔 캡처가 조용할 때도 긴 provider 호출이 활성 상태임을 볼 수 있습니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하므로 provider/gateway 진행 줄이 live 실행 중 즉시 스트리밍됩니다.
  - direct-model Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/probe Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 suite를 실행해야 하나요?

이 결정 표를 사용하세요:

- 로직/테스트 편집: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도 실행)
- gateway 네트워킹 / WS 프로토콜 / 페어링 변경: `pnpm test:e2e` 추가
- "내 봇이 다운됨" / provider별 실패 / 도구 호출 디버깅: 좁혀진 `pnpm test:live` 실행

## Live(네트워크에 닿는) 테스트

live 모델 matrix, CLI 백엔드 smoke, ACP smoke, Codex 앱 서버
harness, 그리고 모든 media-provider live 테스트(Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) 및 live 실행을 위한 자격 증명 처리는
[Live suite 테스트](/ko/help/testing-live)를 참조하세요. 전용 업데이트 및
Plugin 검증 체크리스트는
[업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

## Docker runner(선택적 "Linux에서 동작함" 검사)

이 Docker runner는 두 버킷으로 나뉩니다:

- Live-model runner: `test:docker:live-models`와 `test:docker:live-gateway`는 repo Docker 이미지 안에서 일치하는 profile-key live 파일만 실행하며(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`), 로컬 설정 디렉터리와 workspace를 마운트합니다(마운트된 경우 `~/.profile`도 source). 일치하는 로컬 진입점은 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker live runner는 전체 Docker sweep을 실용적으로 유지하기 위해 더 작은 smoke cap을 기본값으로 사용합니다:
  `test:docker:live-models`의 기본값은 `OPENCLAW_LIVE_MAX_MODELS=12`이고,
  `test:docker:live-gateway`의 기본값은 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`입니다. 더 큰 exhaustive scan을 명시적으로 원할 때 해당 env var를 override하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 live Docker 이미지를 한 번 빌드하고, `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 npm tarball로 한 번 패키징한 다음, 두 개의 `scripts/e2e/Dockerfile` 이미지를 빌드/재사용합니다. bare 이미지는 install/update/plugin-dependency lane을 위한 Node/Git runner일 뿐이며, 해당 lane은 미리 빌드된 tarball을 마운트합니다. functional 이미지는 built-app 기능 lane을 위해 동일한 tarball을 `/app`에 설치합니다. Docker lane 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, planner 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`가 선택된 plan을 실행합니다. aggregate는 가중치 기반 로컬 scheduler를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`은 process slot을 제어하고, resource cap은 무거운 live, npm-install, multi-service lane이 모두 동시에 시작되지 않게 합니다. 단일 lane이 활성 cap보다 무거워도 pool이 비어 있으면 scheduler가 이를 시작할 수 있으며, 이후 capacity가 다시 사용 가능해질 때까지 단독으로 계속 실행합니다. 기본값은 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker host에 더 많은 여유가 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 조정하세요. runner는 기본적으로 Docker preflight를 수행하고, 오래된 OpenClaw E2E container를 제거하며, 30초마다 상태를 출력하고, 성공한 lane timing을 `.artifacts/docker-tests/lane-timings.json`에 저장한 뒤, 이후 실행에서 더 긴 lane을 먼저 시작하는 데 해당 timing을 사용합니다. Docker를 빌드하거나 실행하지 않고 가중치 기반 lane manifest를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 선택한 lane, package/image 필요 사항, 자격 증명에 대한 CI plan을 출력하려면 `node scripts/test-docker-all.mjs --plan-json`를 사용하세요.
- `Package Acceptance`는 "이 설치 가능한 tarball이 제품으로 동작하는가?"를 확인하는 GitHub-native package gate입니다. `source=npm`, `source=ref`, `source=url`, 또는 `source=artifact`에서 하나의 candidate package를 resolve하고, 이를 `package-under-test`로 업로드한 다음, 선택한 ref를 다시 패키징하는 대신 정확히 그 tarball에 대해 재사용 가능한 Docker E2E lane을 실행합니다. profile은 폭에 따라 `smoke`, `package`, `product`, `full` 순서로 정렬됩니다. package/update/plugin contract, published-upgrade survivor matrix, release 기본값, 실패 triage는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.
- 빌드 및 release 검사는 tsdown 이후 `scripts/check-cli-bootstrap-imports.mjs`를 실행합니다. guard는 `dist/entry.js`와 `dist/cli/run-main.js`에서 static built graph를 순회하고, command dispatch 전에 pre-dispatch startup이 Commander, prompt UI, undici, logging 같은 package dependency를 import하면 실패합니다. 또한 bundled gateway run chunk를 budget 아래로 유지하고 알려진 cold gateway path의 static import를 거부합니다. 패키징된 CLI smoke는 root help, onboard help, doctor help, status, config schema, model-list command도 포함합니다.
- Package Acceptance legacy compatibility는 `2026.4.25`(`2026.4.25-beta.*` 포함)로 제한됩니다. 해당 cutoff까지 harness는 shipped-package metadata gap만 허용합니다. 생략된 private QA inventory entry, 누락된 `gateway install --wrapper`, tarball-derived git fixture의 누락된 patch 파일, 누락된 persisted `update.channel`, legacy plugin install-record 위치, 누락된 marketplace install-record persistence, 그리고 `plugins update` 중 config metadata migration입니다. `2026.4.25` 이후 package에서는 이러한 path가 strict failure입니다.
- Container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, 그리고 `test:docker:config-reload`는 하나 이상의 실제 container를 부팅하고 상위 수준 integration path를 검증합니다.

live-model Docker runner는 필요한 CLI 인증 홈만(또는 실행이 좁혀지지 않은 경우 지원되는 모든 인증 홈) bind-mount한 다음, 실행 전에 container home으로 복사하므로 external-CLI OAuth가 host auth store를 변경하지 않고 token을 refresh할 수 있습니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 포함하며, `pnpm test:docker:live-acp-bind:droid` 및 `pnpm test:docker:live-acp-bind:opencode`를 통해 엄격한 Droid/OpenCode 포함 범위를 검사)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex 앱 서버 하니스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 개발 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 관측성 스모크: `pnpm qa:otel:smoke`는 비공개 QA 소스 체크아웃 레인입니다. npm 타르볼에는 QA Lab이 포함되지 않으므로 의도적으로 패키지 Docker 릴리스 레인에는 포함되지 않습니다.
- Open WebUI 라이브 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm 타르볼 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패키징된 OpenClaw 타르볼을 Docker에 전역 설치하고, env-ref 온보딩과 기본 Telegram을 통해 OpenAI를 구성한 뒤, doctor를 실행하고 모의 OpenAI 에이전트 턴을 한 번 실행합니다. 미리 빌드한 타르볼은 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 재사용하고, 호스트 재빌드는 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`으로 건너뛰거나, 채널은 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 또는 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`으로 전환하세요.
- Skill 설치 스모크: `pnpm test:docker:skill-install`는 패키징된 OpenClaw 타르볼을 Docker에 전역 설치하고, 구성에서 업로드된 아카이브 설치를 비활성화하며, 검색에서 현재 라이브 ClawHub Skill 슬러그를 확인하고, `openclaw skills install`로 설치한 다음 설치된 Skill과 `.clawhub` 출처/잠금 메타데이터를 검증합니다.
- 업데이트 채널 전환 스모크: `pnpm test:docker:update-channel-switch`는 패키징된 OpenClaw 타르볼을 Docker에 전역 설치하고, 패키지 `stable`에서 git `dev`로 전환하며, 유지된 채널과 Plugin 업데이트 후 동작을 검증한 다음, 다시 패키지 `stable`로 전환하고 업데이트 상태를 확인합니다.
- 업그레이드 생존자 스모크: `pnpm test:docker:upgrade-survivor`는 에이전트, 채널 구성, Plugin 허용 목록, 오래된 Plugin 의존성 상태, 기존 워크스페이스/세션 파일이 있는 더티 이전 사용자 픽스처 위에 패키징된 OpenClaw 타르볼을 설치합니다. 라이브 제공자나 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, 루프백 Gateway를 시작하고 구성/상태 보존과 시작/상태 예산을 확인합니다.
- 게시된 업그레이드 생존자 스모크: `pnpm test:docker:published-upgrade-survivor`는 기본적으로 `openclaw@latest`를 설치하고, 현실적인 기존 사용자 파일을 시드하며, 내장된 명령 레시피로 해당 기준선을 구성하고, 결과 구성을 검증한 뒤, 게시된 설치를 후보 타르볼로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 작성한 다음, 루프백 Gateway를 시작하고 구성된 인텐트, 상태 보존, 시작, `/healthz`, `/readyz`, RPC 상태 예산을 확인합니다. 단일 기준선은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`로 재정의하고, 집계 스케줄러가 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` 같은 정확한 로컬 기준선을 확장하도록 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 요청하며, `reported-issues` 같은 이슈 형태 픽스처는 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`로 확장하세요. reported-issues 집합에는 외부 OpenClaw Plugin 설치 자동 복구를 위한 `configured-plugin-installs`가 포함됩니다. 패키지 승인은 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출하고, `last-stable-4` 또는 `all-since-2026.4.23` 같은 메타 기준선 토큰을 해석하며, 전체 릴리스 검증은 릴리스 소크 패키지 게이트를 `last-stable-4 2026.4.23 2026.5.2 2026.4.15`와 `reported-issues`로 확장합니다.
- 세션 런타임 컨텍스트 스모크: `pnpm test:docker:session-runtime-context`는 숨겨진 런타임 컨텍스트 트랜스크립트 지속성과 영향을 받은 중복 프롬프트 재작성 분기에 대한 doctor 복구를 검증합니다.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패키징하고, 격리된 홈에서 `bun install -g`로 설치하며, `openclaw infer image providers --json`이 중단되지 않고 번들 이미지 제공자를 반환하는지 검증합니다. 미리 빌드한 타르볼은 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 재사용하고, 호스트 빌드는 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`으로 건너뛰거나, 빌드된 Docker 이미지에서 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`로 `dist/`를 복사하세요.
- 설치 프로그램 Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 루트, 업데이트, direct-npm 컨테이너 간에 하나의 npm 캐시를 공유합니다. 업데이트 스모크는 후보 타르볼로 업그레이드하기 전 안정 기준선으로 기본값인 npm `latest`를 사용합니다. 로컬에서는 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`로, GitHub에서는 설치 스모크 워크플로의 `update_baseline_version` 입력으로 재정의하세요. 비루트 설치 프로그램 검사는 루트 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않도록 격리된 npm 캐시를 유지합니다. 로컬 재실행 간 루트/업데이트/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정하세요.
- 설치 스모크 CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 포함 범위가 필요할 때는 해당 env 없이 스크립트를 로컬에서 실행하세요.
- 에이전트 공유 워크스페이스 삭제 CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에 하나의 워크스페이스를 공유하는 두 에이전트를 시드하며, `agents delete --json`을 실행하고, 유효한 JSON과 유지된 워크스페이스 동작을 검증합니다. 설치 스모크 이미지는 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`로 재사용하세요.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 헬스): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- 브라우저 CDP 스냅샷 스모크: `pnpm test:docker:browser-cdp-snapshot` (스크립트: `scripts/e2e/browser-cdp-snapshot-docker.sh`)는 소스 E2E 이미지와 Chromium 레이어를 빌드하고, 원시 CDP로 Chromium을 시작하며, `browser doctor --deep`을 실행하고, CDP 역할 스냅샷이 링크 URL, 커서로 승격된 클릭 가능 항목, iframe 참조, 프레임 메타데이터를 포함하는지 검증합니다.
- OpenAI Responses web_search 최소 추론 회귀: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 모의 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음, 제공자 스키마 거부를 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + 원시 Claude 알림 프레임 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 내장 Pi 프로필 허용/거부 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/하위 에이전트 MCP 정리(실제 Gateway + 격리된 Cron 및 일회성 하위 에이전트 실행 후 stdio MCP 자식 종료): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(로컬 경로, `file:`, 호이스팅된 의존성이 있는 npm 레지스트리, git 이동 참조, ClawHub 키친싱크, 마켓플레이스 업데이트, Claude 번들 활성화/검사에 대한 설치/업데이트 스모크): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
  ClawHub 블록을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하거나, 기본 키친싱크 패키지/런타임 쌍을 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 및 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`로 재정의하세요. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`이 없으면 테스트는 밀폐형 로컬 ClawHub 픽스처 서버를 사용합니다.
- Plugin 업데이트 변경 없음 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin 수명 주기 매트릭스 스모크: `pnpm test:docker:plugin-lifecycle-matrix`는 패키징된 OpenClaw 타르볼을 빈 컨테이너에 설치하고, npm Plugin을 설치하며, 활성화/비활성화를 전환하고, 로컬 npm 레지스트리를 통해 업그레이드 및 다운그레이드하며, 설치된 코드를 삭제한 다음, 각 수명 주기 단계의 RSS/CPU 지표를 기록하면서 제거가 여전히 오래된 상태를 제거하는지 검증합니다.
- 구성 리로드 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`는 로컬 경로, `file:`, 호이스팅된 의존성이 있는 npm 레지스트리, git 이동 참조, ClawHub 픽스처, 마켓플레이스 업데이트, Claude 번들 활성화/검사에 대한 설치/업데이트 스모크를 포함합니다. `pnpm test:docker:plugin-update`는 설치된 plugins의 변경 없는 업데이트 동작을 포함합니다. `pnpm test:docker:plugin-lifecycle-matrix`는 리소스가 추적되는 npm Plugin 설치, 활성화, 비활성화, 업그레이드, 다운그레이드, 누락된 코드 제거를 포함합니다.

공유 기능 이미지를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 제품군별 이미지 재정의는 설정된 경우 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키면, 스크립트는 해당 이미지가 로컬에 아직 없을 때 가져옵니다. QR 및 설치 프로그램 Docker 테스트는 공유 빌드 앱 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

라이브 모델 Docker 실행기도 현재 체크아웃을 읽기 전용으로 바인드 마운트하고
컨테이너 내부의 임시 작업 디렉터리에 스테이징합니다. 이렇게 하면 런타임
이미지를 작게 유지하면서도 정확한 로컬 소스/설정에 대해 Vitest를 실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 앱 로컬 `.build` 또는
Gradle 출력 디렉터리 같은 큰 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로
Docker 라이브 실행이 머신별 아티팩트를 복사하는 데 몇 분씩 쓰지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하므로 Gateway 라이브 프로브가
컨테이너 내부에서 실제 Telegram/Discord/등의 채널 워커를 시작하지 않습니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로, 해당 Docker 레인에서
Gateway 라이브 커버리지를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도
전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크입니다. OpenAI 호환 HTTP
엔드포인트가 활성화된 OpenClaw Gateway 컨테이너를 시작하고, 해당 Gateway를 대상으로
고정된 Open WebUI 컨테이너를 시작한 뒤, Open WebUI를 통해 로그인하고,
`/api/models`가 `openclaw/default`를 노출하는지 확인한 다음, Open WebUI의
`/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
라이브 모델 완료를 기다리지 않고 Open WebUI 로그인과 모델 검색 후 중지해야 하는
릴리스 경로 CI 점검에는 `OPENWEBUI_SMOKE_MODE=models`를 설정하세요.
첫 실행은 Docker가 Open WebUI 이미지를 가져와야 할 수 있고 Open WebUI 자체의
콜드 스타트 설정을 완료해야 할 수 있으므로 눈에 띄게 느릴 수 있습니다.
이 레인은 사용 가능한 라이브 모델 키를 예상하며, Docker화된 실행에서 이를 제공하는
기본 방법은 `OPENCLAW_PROFILE_FILE`(기본값: `~/.profile`)입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON 페이로드를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord 또는
iMessage 계정이 필요하지 않습니다. 시드된 Gateway 컨테이너를 부팅하고,
`openclaw mcp serve`를 생성하는 두 번째 컨테이너를 시작한 뒤, 라우팅된 대화 검색,
트랜스크립트 읽기, 첨부 파일 메타데이터, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅,
그리고 실제 stdio MCP 브리지를 통한 Claude 스타일 채널 + 권한 알림을 확인합니다.
알림 점검은 원시 stdio MCP 프레임을 직접 검사하므로, 스모크가 특정 클라이언트 SDK가
우연히 노출하는 내용만이 아니라 브리지가 실제로 내보내는 내용을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 라이브 모델 키가 필요하지 않습니다.
repo Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP 프로브 서버를 시작하며,
임베디드 Pi 번들 MCP 런타임을 통해 해당 서버를 구체화하고, 도구를 실행한 다음,
`coding` 및 `messaging`은 `bundle-mcp` 도구를 유지하고 `minimal` 및
`tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 확인합니다.
`test:docker:cron-mcp-cleanup`은 결정적이며 라이브 모델 키가 필요하지 않습니다.
실제 stdio MCP 프로브 서버가 있는 시드된 Gateway를 시작하고, 격리된 Cron 턴과
`/subagents spawn` 일회성 자식 턴을 실행한 다음, 각 실행 후 MCP 자식 프로세스가
종료되는지 확인합니다.

수동 ACP 일반 언어 스레드 스모크(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로용으로 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 환경 변수:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)는 `/home/node/.openclaw`에 마운트됩니다.
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)는 `/home/node/.openclaw/workspace`에 마운트됩니다.
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`)는 `/home/node/.profile`에 마운트되고 테스트 실행 전에 source됩니다.
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 임시 설정/작업공간 디렉터리를 사용하고 외부 CLI 인증 마운트 없이 `OPENCLAW_PROFILE_FILE`에서 source된 환경 변수만 확인합니다.
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`)는 Docker 내부에서 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트됩니다.
- `$HOME` 아래의 외부 CLI 인증 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음, 테스트 시작 전에 `/home/node/...`로 복사됩니다.
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 제공자 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 디렉터리/파일만 마운트합니다.
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록으로 수동 재정의하세요.
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`로 실행 범위를 좁힙니다.
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`로 컨테이너 내부의 제공자를 필터링합니다.
- `OPENCLAW_SKIP_DOCKER_BUILD=1`은 다시 빌드할 필요가 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용합니다.
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`은 자격 증명이 환경 변수가 아니라 프로필 저장소에서 오도록 보장합니다.
- `OPENCLAW_OPENWEBUI_MODEL=...`은 Open WebUI 스모크를 위해 Gateway가 노출하는 모델을 선택합니다.
- `OPENCLAW_OPENWEBUI_PROMPT=...`는 Open WebUI 스모크에서 사용하는 nonce 점검 프롬프트를 재정의합니다.
- `OPENWEBUI_IMAGE=...`는 고정된 Open WebUI 이미지 태그를 재정의합니다.

## 문서 정상성 점검

문서 편집 후 문서 점검을 실행하세요: `pnpm check:docs`.
페이지 내부 heading 점검까지 필요할 때는 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀 테스트(CI 안전)

이들은 실제 제공자 없이 실행되는 "실제 파이프라인" 회귀 테스트입니다.

- Gateway 도구 호출(mock OpenAI, 실제 Gateway + 에이전트 루프): `src/gateway/gateway.test.ts`(케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway 마법사(WS `wizard.start`/`wizard.next`, 설정 작성 + 인증 강제): `src/gateway/gateway.test.ts`(케이스: "runs wizard over ws and writes auth token config")

## 에이전트 신뢰성 평가(Skills)

이미 "에이전트 신뢰성 평가"처럼 동작하는 몇 가지 CI 안전 테스트가 있습니다.

- 실제 Gateway + 에이전트 루프를 통한 mock 도구 호출(`src/gateway/gateway.test.ts`).
- 세션 배선과 설정 효과를 검증하는 엔드투엔드 마법사 흐름(`src/gateway/gateway.test.ts`).

Skills에 아직 부족한 항목([Skills](/ko/tools/skills) 참조):

- **의사 결정:** 프롬프트에 Skills가 나열될 때 에이전트가 올바른 Skill을 선택하는가(또는 관련 없는 Skill을 피하는가)?
- **준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필요한 단계/인자를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 기록 이월, sandbox 경계를 검증하는 다중 턴 시나리오.

향후 평가는 먼저 결정적으로 유지해야 합니다.

- mock 제공자를 사용해 도구 호출 + 순서, Skill 파일 읽기, 세션 배선을 검증하는 시나리오 실행기.
- Skill 중심 시나리오의 작은 모음(사용 vs 회피, 게이팅, 프롬프트 인젝션).
- CI 안전 모음이 마련된 후에만 선택적 라이브 평가(opt-in, env-gated).

## 계약 테스트(Plugin 및 채널 형태)

계약 테스트는 등록된 모든 Plugin 및 채널이 해당 인터페이스 계약을 준수하는지 확인합니다.
발견된 모든 Plugin을 순회하고 형태 및 동작 검증 모음을 실행합니다. 기본 `pnpm test`
단위 레인은 이러한 공유 이음새 및 스모크 파일을 의도적으로 건너뜁니다. 공유 채널 또는
제공자 표면을 건드릴 때는 계약 명령을 명시적으로 실행하세요.

### 명령

- 모든 계약: `pnpm test:contracts`
- 채널 계약만: `pnpm test:contracts:channels`
- 제공자 계약만: `pnpm test:contracts:plugins`

### 채널 계약

`src/channels/plugins/contracts/*.contract.test.ts`에 있습니다.

- **Plugin** - 기본 Plugin 형태(id, 이름, 기능)
- **설정** - 설정 마법사 계약
- **세션 바인딩** - 세션 바인딩 동작
- **아웃바운드 페이로드** - 메시지 페이로드 구조
- **인바운드** - 인바운드 메시지 처리
- **동작** - 채널 동작 핸들러
- **스레딩** - 스레드 ID 처리
- **디렉터리** - 디렉터리/명단 API
- **그룹 정책** - 그룹 정책 적용

### 제공자 상태 계약

`src/plugins/contracts/*.contract.test.ts`에 있습니다.

- **상태** - 채널 상태 프로브
- **레지스트리** - Plugin 레지스트리 형태

### 제공자 계약

`src/plugins/contracts/*.contract.test.ts`에 있습니다.

- **인증** - 인증 흐름 계약
- **인증 선택** - 인증 선택/선정
- **카탈로그** - 모델 카탈로그 API
- **검색** - Plugin 검색
- **로더** - Plugin 로딩
- **런타임** - 제공자 런타임
- **형태** - Plugin 형태/인터페이스
- **마법사** - 설정 마법사

### 실행 시점

- plugin-sdk export 또는 subpath를 변경한 후
- 채널 또는 제공자 Plugin을 추가하거나 수정한 후
- Plugin 등록 또는 검색을 리팩터링한 후

계약 테스트는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 테스트 추가(지침)

라이브에서 발견된 제공자/모델 문제를 수정할 때:

- 가능하면 CI 안전 회귀 테스트를 추가하세요(mock/stub 제공자 또는 정확한 요청 형태 변환 캡처).
- 본질적으로 라이브 전용인 경우(속도 제한, 인증 정책) 라이브 테스트를 좁게 유지하고 환경 변수를 통해 opt-in으로 두세요.
- 버그를 잡는 가장 작은 계층을 대상으로 하는 것을 선호하세요.
  - 제공자 요청 변환/재생 버그 → 직접 모델 테스트
  - Gateway 세션/기록/도구 파이프라인 버그 → Gateway 라이브 스모크 또는 CI 안전 Gateway mock 테스트
- SecretRef 순회 가드레일:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 레지스트리 메타데이터(`listSecretTargetRegistryEntries()`)에서 SecretRef 클래스당 하나의 샘플 대상을 파생한 다음, 순회 세그먼트 exec id가 거부되는지 검증합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef 대상 패밀리를 추가하면 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 대상 id에서 의도적으로 실패하므로 새 클래스를 조용히 건너뛸 수 없습니다.

## 관련

- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)
- [CI](/ko/ci)
