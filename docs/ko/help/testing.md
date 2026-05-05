---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/제공자 버그에 대한 회귀 테스트 추가
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: 단위/e2e/라이브 스위트, Docker 러너, 각 테스트가 다루는 범위'
title: 테스트
x-i18n:
    generated_at: "2026-05-05T06:08:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw에는 세 가지 Vitest 제품군(단위/통합, e2e, 라이브)과 작은 Docker 러너 세트가 있습니다. 이 문서는 "테스트 방식" 안내서입니다:

- 각 제품군이 다루는 범위(그리고 의도적으로 다루지 _않는_ 범위).
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에서 실행할 명령.
- 라이브 테스트가 자격 증명을 찾고 모델/제공자를 선택하는 방식.
- 실제 모델/제공자 문제에 대한 회귀 테스트를 추가하는 방식.

<Note>
**QA 스택(qa-lab, qa-channel, 라이브 전송 레인)**은 별도로 문서화되어 있습니다:

- [QA 개요](/ko/concepts/qa-e2e-automation) — 아키텍처, 명령 표면, 시나리오 작성.
- [Matrix QA](/ko/concepts/qa-matrix) — `pnpm openclaw qa matrix` 참조.
- [QA 채널](/ko/channels/qa-channel) — 저장소 기반 시나리오에서 사용하는 합성 전송 Plugin.

이 페이지는 일반 테스트 제품군과 Docker/Parallels 러너 실행을 다룹니다. 아래의 QA 전용 러너 섹션([QA 전용 러너](#qa-specific-runners))은 구체적인 `qa` 호출을 나열하고 위 참조로 다시 안내합니다.
</Note>

## 빠른 시작

대부분의 경우:

- 전체 게이트(푸시 전 예상): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 제품군 실행: `pnpm test:max`
- 직접 Vitest 감시 루프: `pnpm test:watch`
- 직접 파일 대상 지정은 이제 확장/채널 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 작업 중일 때는 먼저 대상 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 제품군: `pnpm test:e2e`

실제 제공자/모델을 디버깅할 때(실제 자격 증명 필요):

- 라이브 제품군(모델 + Gateway 도구/이미지 프로브): `pnpm test:live`
- 라이브 파일 하나를 조용히 대상으로 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 런타임 성능 보고서: 실제 `openai/gpt-5.4` 에이전트 턴에는
  `live_gpt54=true`, Kova CPU/힙/추적 아티팩트에는
  `deep_profile=true`로 `OpenClaw Performance`를 디스패치하세요. 매일 예약 실행은
  `CLAWGRIT_REPORTS_TOKEN`이 구성된 경우 mock-provider, deep-profile, GPT 5.4 레인 아티팩트를
  `openclaw/clawgrit-reports`에 게시합니다.
  mock-provider 보고서에는 소스 수준 Gateway 부팅, 메모리,
  Plugin 압박, 반복 fake-model hello-loop, CLI 시작 수치도 포함됩니다.
- Docker 라이브 모델 스윕: `pnpm test:docker:live-models`
  - 선택된 각 모델은 이제 텍스트 턴과 작은 파일 읽기 스타일 프로브를 실행합니다.
    메타데이터가 `image` 입력을 알리는 모델은 작은 이미지 턴도 실행합니다.
    제공자 실패를 격리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`로 추가 프로브를 비활성화하세요.
  - CI 커버리지: 매일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 모두 `include_live_suites: true`로 재사용 가능한 라이브/E2E 워크플로를 호출하며, 여기에는 제공자별로 샤딩된 별도 Docker 라이브 모델
    매트릭스 작업이 포함됩니다.
  - 집중 CI 재실행의 경우 `include_live_suites: true` 및 `live_models_only: true`로 `OpenClaw Live And E2E Checks (Reusable)`를 디스패치하세요.
  - 새로운 고신호 제공자 시크릿은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 해당
    예약/릴리스 호출자에 추가하세요.
- 네이티브 Codex 바운드 채팅 스모크: `pnpm test:docker:live-codex-bind`
  - Codex 앱 서버 경로에 대해 Docker 라이브 레인을 실행하고, `/codex bind`로 합성
    Slack DM을 바인딩하며, `/codex fast`와
    `/codex permissions`를 실행한 다음, 일반 답장과 이미지 첨부 파일이
    ACP 대신 네이티브 Plugin 바인딩을 통해 라우팅되는지 확인합니다.
- Codex 앱 서버 하네스 스모크: `pnpm test:docker:live-codex-harness`
  - Plugin 소유 Codex 앱 서버 하네스를 통해 Gateway 에이전트 턴을 실행하고,
    `/codex status`와 `/codex models`를 검증하며, 기본적으로 이미지,
    cron MCP, 하위 에이전트, Guardian 프로브를 실행합니다. 다른 Codex
    앱 서버 실패를 격리할 때는
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`로 하위 에이전트 프로브를 비활성화하세요. 집중 하위 에이전트 검사의 경우 다른 프로브를 비활성화하세요:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`이 설정되지 않은 한
    하위 에이전트 프로브 후 종료됩니다.
- Crestodian 구조 명령 스모크: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 구조 명령 표면에 대한 옵트인 이중 확인 검사입니다.
    `/crestodian status`를 실행하고, 지속 모델 변경을 큐에 넣고,
    `/crestodian yes`에 응답하며, 감사/구성 쓰기 경로를 검증합니다.
- Crestodian 플래너 Docker 스모크: `pnpm test:docker:crestodian-planner`
  - `PATH`에 가짜 Claude CLI가 있는 구성 없는 컨테이너에서 Crestodian을 실행하고
    퍼지 플래너 폴백이 감사된 형식 있는 구성 쓰기로 변환되는지 검증합니다.
- Crestodian 최초 실행 Docker 스모크: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw 상태 디렉터리에서 시작하고, 베어 `openclaw`를
    Crestodian으로 라우팅하며, setup/model/agent/Discord Plugin + SecretRef 쓰기를 적용하고,
    구성을 검증하며, 감사 항목을 확인합니다. 동일한 Ring 0 설정 경로는
    QA Lab에서도
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`로 다룹니다.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`를 실행한 다음, 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`를
  `moonshot/kimi-k2.6`에 대해 실행합니다. JSON이 Moonshot/K2.6을 보고하고
  어시스턴트 트랜스크립트가 정규화된 `usage.cost`를 저장하는지 확인합니다.

<Tip>
실패 사례 하나만 필요할 때는 아래에 설명된 허용 목록 환경 변수를 통해 라이브 테스트를 좁히는 것을 선호하세요.
</Tip>

## QA 전용 러너

QA-lab 현실성이 필요할 때 이 명령들은 기본 테스트 제품군 옆에 위치합니다:

CI는 전용 워크플로에서 QA Lab을 실행합니다. 에이전트형 패리티는 독립형 PR 워크플로가 아니라
`QA-Lab - All Lanes`와 릴리스 검증 아래에 중첩됩니다.
광범위한 검증은 `rerun_group=qa-parity` 또는 릴리스 검사 QA 그룹과 함께
`Full Release Validation`을 사용해야 합니다. 안정/기본 릴리스
검사는 `run_release_soak=true` 뒤에 철저한 라이브/Docker 소크를 유지하며,
`full` 프로필은 소크를 강제로 켭니다. `QA-Lab - All Lanes`는
`main`에서 매일 밤, 그리고 수동 디스패치에서 mock 패리티 레인, 라이브
Matrix 레인, Convex 관리 라이브 Telegram 레인, Convex 관리 라이브 Discord
레인을 병렬 작업으로 실행합니다. 예약 QA와 릴리스 검사는 Matrix에
`--profile fast`를 명시적으로 전달하는 반면, Matrix CLI와 수동 워크플로 입력
기본값은 `all`로 유지됩니다. 수동 디스패치는 `all`을 `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩할 수 있습니다. `OpenClaw Release
Checks`는 릴리스 승인 전에 패리티와 빠른 Matrix 및 Telegram 레인을 실행하며,
릴리스 전송 검사가 결정적이고 일반 제공자 Plugin 시작을 피하도록
`mock-openai/gpt-5.5`를 사용합니다. 이러한 라이브 전송
Gateway는 메모리 검색을 비활성화합니다. 메모리 동작은 QA 패리티
제품군에서 계속 다룹니다.

전체 릴리스 라이브 미디어 샤드는
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`를 사용하며, 여기에는 이미
`ffmpeg`와 `ffprobe`가 있습니다. Docker 라이브 모델/백엔드 샤드는 선택한
커밋마다 한 번 빌드되는 공유
`ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용한 다음, 모든 샤드 내부에서 다시 빌드하는 대신
`OPENCLAW_SKIP_DOCKER_BUILD=1`로 가져옵니다.

- `pnpm openclaw qa suite`
  - 리포지토리 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 기본적으로 격리된 Gateway 워커를 사용해 선택된 여러 시나리오를 병렬로 실행합니다. `qa-channel`은 기본 동시성이 4입니다(선택된 시나리오 수로 제한됨). 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 이전 직렬 레인을 사용하려면 `--concurrency 1`을 사용하세요.
  - 어떤 시나리오든 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용하세요.
  - provider 모드 `live-frontier`, `mock-openai`, `aimock`을 지원합니다.
    `aimock`은 시나리오 인식 `mock-openai` 레인을 대체하지 않고, 실험적 fixture 및 protocol mock 커버리지를 위해 로컬 AIMock 기반 provider 서버를 시작합니다.
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab을 통해 라이브 OpenAI Kitchen Sink Plugin gauntlet을 실행합니다. 외부 Kitchen Sink 패키지를 설치하고, Plugin SDK 표면 인벤토리를 검증하고, `/healthz`와 `/readyz`를 probe하고, Gateway CPU/RSS 증거를 기록하고, 라이브 OpenAI turn을 실행하며, adversarial 진단을 확인합니다. `OPENAI_API_KEY` 같은 라이브 OpenAI 인증이 필요합니다. hydrated Testbox 세션에서는 `openclaw-testbox-env` 헬퍼가 있으면 Testbox live-auth 프로필을 자동으로 source합니다.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 시작 bench와 작은 mock QA Lab 시나리오 팩(`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`)을 실행하고 `.artifacts/gateway-cpu-scenarios/` 아래에 결합된 CPU 관찰 요약을 씁니다.
  - 기본적으로 지속적인 고온 CPU 관찰만 플래그합니다(`--cpu-core-warn` 및 `--hot-wall-warn-ms`). 따라서 짧은 시작 burst는 몇 분 동안 지속되는 Gateway peg 회귀처럼 보이지 않고 metric으로 기록됩니다.
  - 빌드된 `dist` 아티팩트를 사용합니다. 체크아웃에 최신 런타임 출력이 아직 없으면 먼저 빌드를 실행하세요.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA suite를 폐기 가능한 Multipass Linux VM 안에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 provider/model 선택 플래그를 재사용합니다.
  - 라이브 실행은 guest에 실용적인 지원 QA 인증 입력을 전달합니다:
    env 기반 provider 키, QA live provider config 경로, 그리고 존재하는 경우 `CODEX_HOME`.
  - 출력 디렉터리는 mounted workspace를 통해 guest가 다시 쓸 수 있도록 리포지토리 루트 아래에 있어야 합니다.
  - 일반 QA report + summary와 Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 씁니다.
- `pnpm qa:lab:up`
  - operator 스타일 QA 작업을 위한 Docker 기반 QA site를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm tarball을 빌드하고 Docker에 전역 설치한 뒤, 비대화형 OpenAI API key onboarding을 실행하고, 기본적으로 Telegram을 구성하고, 패키징된 Plugin 런타임이 시작 dependency repair 없이 로드되는지 검증하고, doctor를 실행하며, mocked OpenAI endpoint를 대상으로 하나의 로컬 agent turn을 실행합니다.
  - Discord로 동일한 packaged-install 레인을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcript를 위한 결정적 built-app Docker smoke를 실행합니다. 숨겨진 OpenClaw 런타임 context가 보이는 user turn으로 누출되지 않고 non-display custom message로 유지되는지 검증한 다음, 영향받는 깨진 session JSONL을 seed하고 `openclaw doctor --fix`가 backup과 함께 active branch로 다시 쓰는지 검증합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 OpenClaw 패키지 후보를 설치하고, installed-package onboarding을 실행하고, 설치된 CLI를 통해 Telegram을 구성한 뒤, 해당 설치 패키지를 SUT Gateway로 사용해 라이브 Telegram QA 레인을 재사용합니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다. 레지스트리에서 설치하는 대신 resolved 로컬 tarball을 테스트하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 또는 `OPENCLAW_CURRENT_PACKAGE_TGZ`를 설정하세요.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env credentials 또는 Convex credential source를 사용합니다. CI/release automation의 경우 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와 `OPENCLAW_QA_CONVEX_SITE_URL`, role secret을 설정하세요. CI에 `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex role secret이 있으면 Docker wrapper가 Convex를 자동으로 선택합니다.
  - wrapper는 Docker build/install 작업 전에 호스트에서 Telegram 또는 Convex credential env를 검증합니다. credential 준비 전 설정을 의도적으로 디버깅할 때만 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`을 설정하세요.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 한해서만 공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다.
  - GitHub Actions는 이 레인을 수동 maintainer workflow `NPM Telegram Beta E2E`로 노출합니다. merge 시 실행되지 않습니다. workflow는 `qa-live-shared` environment와 Convex CI credential lease를 사용합니다.
- GitHub Actions는 하나의 후보 패키지에 대해 side-run product proof를 위한 `Package Acceptance`도 노출합니다. trusted ref, published npm spec, HTTPS tarball URL과 SHA-256, 또는 다른 run의 tarball artifact를 받아 정규화된 `openclaw-current.tgz`를 `package-under-test`로 업로드한 다음, smoke, package, product, full, custom 레인 프로필로 기존 Docker E2E scheduler를 실행합니다. 동일한 `package-under-test` artifact를 대상으로 Telegram QA workflow를 실행하려면 `telegram_mode=mock-openai` 또는 `live-frontier`를 설정하세요.
  - 최신 beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 정확한 tarball URL proof에는 digest가 필요합니다:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof는 다른 Actions run에서 tarball artifact를 다운로드합니다:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 현재 OpenClaw 빌드를 Docker에서 pack 및 install하고, OpenAI가 구성된 상태로 Gateway를 시작한 다음, config edit를 통해 번들 채널/Plugin을 활성화합니다.
  - setup discovery가 구성되지 않은 downloadable Plugin을 누락 상태로 두는지, 첫 번째 configured doctor repair가 누락된 각 downloadable Plugin을 명시적으로 설치하는지, 두 번째 restart가 숨겨진 dependency repair를 실행하지 않는지 검증합니다.
  - 또한 알려진 이전 npm baseline을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화한 뒤, candidate의 post-update doctor가 harness-side postinstall repair 없이 legacy Plugin dependency debris를 정리하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels guest 전반에서 native packaged-install update smoke를 실행합니다. 선택된 각 platform은 먼저 요청된 baseline package를 설치한 다음, 같은 guest에서 설치된 `openclaw update` 명령을 실행하고 설치된 version, update status, Gateway readiness, 그리고 하나의 local agent turn을 검증합니다.
  - 한 guest에서 반복 작업하는 동안 `--platform macos`, `--platform windows`, 또는 `--platform linux`를 사용하세요. summary artifact 경로와 per-lane status에는 `--json`을 사용하세요.
  - OpenAI 레인은 기본적으로 라이브 agent-turn proof에 `openai/gpt-5.5`를 사용합니다. 다른 OpenAI model을 의도적으로 검증할 때는 `--model <provider/model>`을 전달하거나 `OPENCLAW_PARALLELS_OPENAI_MODEL`을 설정하세요.
  - Parallels transport stall이 남은 테스트 시간을 소모하지 않도록 긴 로컬 run은 host timeout으로 감싸세요:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 `/tmp/openclaw-parallels-npm-update.*` 아래에 중첩 lane 로그를 씁니다.
    outer wrapper가 멈췄다고 판단하기 전에 `windows-update.log`, `macos-update.log`, 또는 `linux-update.log`를 확인하세요.
  - Windows update는 cold guest에서 post-update doctor와 package update 작업에 10~15분이 걸릴 수 있습니다. 중첩 npm debug log가 진행 중이면 여전히 정상입니다.
  - 이 aggregate wrapper를 개별 Parallels macOS, Windows, 또는 Linux smoke lane과 병렬로 실행하지 마세요. 이들은 VM state를 공유하며 snapshot restore, package serving, guest Gateway state에서 충돌할 수 있습니다.
  - post-update proof는 일반 bundled Plugin surface를 실행합니다. speech, image generation, media understanding 같은 capability facade가 agent turn 자체는 단순한 text response만 확인하더라도 번들 runtime API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 protocol smoke testing을 위해 로컬 AIMock provider server만 시작합니다.
- `pnpm openclaw qa matrix`
  - 폐기 가능한 Docker 기반 Tuwunel homeserver를 대상으로 Matrix live QA lane을 실행합니다. source checkout 전용입니다. packaged install은 `qa-lab`을 제공하지 않습니다.
  - 전체 CLI, profile/scenario catalog, env var, artifact layout: [Matrix QA](/ko/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT bot token을 사용해 실제 private group을 대상으로 Telegram live QA lane을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. group id는 숫자 Telegram chat id여야 합니다.
  - 공유 pooled credential을 위해 `--credential-source convex`를 지원합니다. 기본적으로 env mode를 사용하거나, pooled lease를 사용하도록 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - 어떤 시나리오든 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용하세요.
  - 같은 private group에 서로 다른 bot 두 개가 필요하며, SUT bot은 Telegram username을 노출해야 합니다.
  - 안정적인 bot-to-bot observation을 위해 `@BotFather`에서 두 bot 모두 Bot-to-Bot Communication Mode를 활성화하고 driver bot이 group bot traffic을 관찰할 수 있는지 확인하세요.
  - Telegram QA report, summary, observed-messages artifact를 `.artifacts/qa-e2e/...` 아래에 씁니다. reply scenario에는 driver send request부터 관찰된 SUT reply까지의 RTT가 포함됩니다.

Live transport lane은 새 transport가 드리프트하지 않도록 하나의 표준 contract를 공유합니다. per-lane coverage matrix는 [QA overview → Live transport coverage](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 있습니다. `qa-channel`은 광범위한 synthetic suite이며 이 matrix의 일부가 아닙니다.

### Convex를 통한 공유 Telegram credentials (v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면 QA lab은 Convex 기반 pool에서 exclusive lease를 획득하고, lane이 실행되는 동안 해당 lease에 Heartbeat를 보내며, shutdown 시 lease를 release합니다.

참조 Convex project scaffold:

- `qa/convex-credential-broker/`

필수 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택한 role을 위한 secret 하나:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`: `maintainer`용
  - `OPENCLAW_QA_CONVEX_SECRET_CI`: `ci`용
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본값 `ci`, 그 외에는 `maintainer`)

선택적 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 local-only development를 위해 loopback `http://` Convex URL을 허용합니다.

`OPENCLAW_QA_CONVEX_SITE_URL`은 일반 운영에서 `https://`를 사용해야 합니다.

유지관리자 admin 명령(pool add/remove/list)에는
특히 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

유지관리자용 CLI helper:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용해 secret 값을 출력하지 않고 Convex 사이트 URL, broker secret,
endpoint prefix, HTTP timeout, admin/list 도달 가능성을 확인하세요.
스크립트와 CI 유틸리티에서 기계가 읽을 수 있는 출력이 필요하면 `--json`을 사용하세요.

기본 endpoint 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /admin/add`(유지관리자 secret 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(유지관리자 secret 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease 보호: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(유지관리자 secret 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram 종류의 payload 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자로 된 Telegram 채팅 id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하고 잘못된 payload를 거부합니다.

### QA에 채널 추가하기

새 채널 어댑터의 아키텍처와 시나리오 helper 이름은 [QA 개요 → 채널 추가하기](/ko/concepts/qa-e2e-automation#adding-a-channel)에 있습니다. 최소 기준: 공유 `qa-lab` 호스트 seam에서 transport runner를 구현하고, Plugin manifest에 `qaRunners`를 선언하고, `openclaw qa <runner>`로 마운트하고, `qa/scenarios/` 아래에 시나리오를 작성합니다.

## 테스트 스위트(어디서 무엇이 실행되는가)

스위트를 “현실성 증가”(그리고 불안정성/비용 증가)로 생각하세요.

### 단위 / 통합(기본값)

- 명령: `pnpm test`
- 구성: 대상이 지정되지 않은 실행은 `vitest.full-*.config.ts` 샤드 세트를 사용하며, 병렬 스케줄링을 위해 다중 프로젝트 샤드를 프로젝트별 구성으로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit 인벤토리; UI 단위 테스트는 전용 `unit-ui` 샤드에서 실행됩니다
- 범위:
  - 순수 단위 테스트
  - 프로세스 내 통합 테스트(gateway auth, routing, tooling, parsing, config)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됩니다
  - 실제 key가 필요하지 않습니다
  - 빠르고 안정적이어야 합니다
  - Resolver와 공개 surface loader 테스트는 실제 번들 Plugin source API가 아니라 생성된 작은 Plugin fixture로 광범위한 `api.js` 및
    `runtime-api.js` fallback 동작을 증명해야 합니다. 실제 Plugin API load는
    Plugin 소유 contract/integration suite에 속합니다.

<AccordionGroup>
  <Accordion title="프로젝트, 샤드, 범위 지정 레인">

    - 대상이 지정되지 않은 `pnpm test`는 하나의 거대한 native root-project 프로세스 대신 더 작은 12개 샤드 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 걸린 머신의 최대 RSS를 줄이고 auto-reply/extension 작업이 관련 없는 스위트를 굶기지 않도록 합니다.
    - `pnpm test --watch`는 여전히 native root `vitest.config.ts` 프로젝트 그래프를 사용합니다. 다중 샤드 watch 루프는 실용적이지 않기 때문입니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적 파일/디렉터리 대상을 먼저 범위 지정 레인을 통해 라우팅하므로 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 root 프로젝트 시작 비용을 지불하지 않습니다.
    - `pnpm test:changed`는 변경된 git 경로를 기본적으로 저렴한 범위 지정 레인으로 확장합니다: 직접 테스트 편집, 형제 `*.test.ts` 파일, 명시적 source mapping, 로컬 import-graph 종속 항목. Config/setup/package 편집은 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 명시적으로 사용하지 않는 한 테스트를 broad-run하지 않습니다.
    - `pnpm check:changed`는 좁은 작업을 위한 일반적인 스마트 로컬 check gate입니다. diff를 core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, tooling으로 분류한 다음 일치하는 typecheck, lint, guard 명령을 실행합니다. Vitest 테스트는 실행하지 않습니다. 테스트 증명이 필요하면 `pnpm test:changed` 또는 명시적 `pnpm test <target>`을 호출하세요. Release metadata-only 버전 bump는 대상 지정 version/config/root-dependency check를 실행하며, 최상위 version 필드 밖의 package 변경을 거부하는 guard가 포함됩니다.
    - Live Docker ACP harness 편집은 집중 check를 실행합니다: live Docker auth 스크립트의 shell syntax와 live Docker scheduler dry-run. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로 제한될 때만 포함됩니다. dependency, export, version 및 기타 package-surface 편집은 여전히 더 넓은 guard를 사용합니다.
    - agents, commands, plugins, auto-reply helper, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import-light 단위 테스트는 `unit-fast` 레인을 통해 라우팅되며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태가 있거나 runtime-heavy 파일은 기존 레인에 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` helper source 파일도 changed-mode 실행을 해당 light 레인의 명시적 형제 테스트에 매핑하므로, helper 편집 시 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않아도 됩니다.
    - `auto-reply`에는 최상위 core helper, 최상위 `reply.*` 통합 테스트, `src/auto-reply/reply/**` 하위 트리에 대한 전용 bucket이 있습니다. CI는 reply 하위 트리를 agent-runner, dispatch, commands/state-routing 샤드로 추가 분할하여 하나의 import-heavy bucket이 전체 Node tail을 점유하지 않게 합니다.
    - 일반 PR/main CI는 extension batch sweep과 release-only `agentic-plugins` 샤드를 의도적으로 건너뜁니다. Full Release Validation은 release candidate에서 해당 plugin/extension-heavy suite를 위해 별도의 `Plugin Prerelease` child workflow를 dispatch합니다.

  </Accordion>

  <Accordion title="임베디드 runner 커버리지">

    - message-tool discovery 입력 또는 compaction runtime
      context를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 routing 및 normalization
      경계에 집중된 helper regression을 추가하세요.
    - 임베디드 runner 통합 suite를 건강하게 유지하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 및
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이 suite들은 scoped id와 Compaction 동작이 실제 `run.ts` / `compact.ts` 경로를
      계속 통과하는지 검증합니다. helper-only 테스트는
      이러한 통합 경로의 충분한 대체물이 아닙니다.

  </Accordion>

  <Accordion title="Vitest pool 및 isolation 기본값">

    - 기본 Vitest 구성은 `threads`를 기본값으로 사용합니다.
    - 공유 Vitest 구성은 `isolate: false`를 고정하고
      root 프로젝트, e2e, live config 전반에서 non-isolated runner를 사용합니다.
    - root UI 레인은 `jsdom` setup 및 optimizer를 유지하지만,
      공유 non-isolated runner에서도 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest 구성에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 큰 로컬 실행 중 V8 compile churn을 줄이기 위해 기본적으로 Vitest child Node
      프로세스에 `--no-maglev`를 추가합니다.
      stock V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 formatting-only입니다. 포맷된 파일을 다시 stage하며
      lint, typecheck 또는 테스트를 실행하지 않습니다.
    - handoff 또는 push 전에 스마트 로컬 check gate가 필요하면
      `pnpm check:changed`를 명시적으로 실행하세요.
    - `pnpm test:changed`는 기본적으로 저렴한 범위 지정 레인을 통해 라우팅됩니다. agent가
      harness, config, package 또는 contract 편집에 더 넓은 Vitest 커버리지가 실제로 필요하다고
      판단할 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.
    - `pnpm test:max` 및 `pnpm test:changed:max`는 동일한 routing
      동작을 유지하되 worker cap만 더 높입니다.
    - 로컬 worker auto-scaling은 의도적으로 보수적이며 host load average가 이미 높으면
      뒤로 물러나므로, 여러 Vitest 실행을 동시에 돌려도 기본적으로 피해가 덜합니다.
    - 기본 Vitest 구성은 project/config 파일을
      `forceRerunTriggers`로 표시하여 test wiring이 변경될 때 changed-mode rerun이 정확하게 유지되도록 합니다.
    - 구성은 지원되는 host에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성 상태로 유지합니다.
      직접 profiling을 위한 명시적 cache 위치 하나가 필요하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration reporting과
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 profiling 보기를
      `origin/main` 이후 변경된 파일로 범위 지정합니다.
    - 샤드 타이밍 데이터는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      전체 config 실행은 config 경로를 key로 사용합니다. include-pattern CI
      샤드는 필터링된 샤드를 별도로 추적할 수 있도록 샤드 이름을 덧붙입니다.
    - 하나의 hot test가 여전히 시작 import에 대부분의 시간을 소비한다면,
      heavy dependency를 좁은 로컬 `*.runtime.ts` seam 뒤에 두고,
      runtime helper를 `vi.mock(...)`에 넘기기 위해 deep-import하는 대신
      그 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 committed
      diff에 대해 라우팅된 `test:changed`를 native root-project 경로와 비교하고
      wall time과 macOS max RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을
      `scripts/test-projects.mjs` 및 root Vitest config를 통해 라우팅하여 현재
      dirty tree를 benchmark합니다.
    - `pnpm test:perf:profile:main`은 Vitest/Vite startup 및 transform overhead에 대한 main-thread CPU profile을 작성합니다.
    - `pnpm test:perf:profile:runner`는 파일 병렬 처리를 비활성화한 unit suite에 대해
      runner CPU+heap profile을 작성합니다.

  </Accordion>
</AccordionGroup>

### 안정성(Gateway)

- 명령: `pnpm test:stability:gateway`
- 구성: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 진단이 기본적으로 활성화된 실제 loopback Gateway를 시작합니다
  - synthetic gateway message, memory, large-payload churn을 diagnostic event path를 통해 구동합니다
  - Gateway WS RPC를 통해 `diagnostics.stability`를 쿼리합니다
  - diagnostic stability bundle persistence helper를 커버합니다
  - recorder가 bounded 상태를 유지하고, synthetic RSS sample이 pressure budget 아래에 머물며, per-session queue depth가 다시 0으로 drain되는지 assertion합니다
- 기대 사항:
  - CI-safe 및 keyless
  - stability-regression follow-up을 위한 좁은 레인이며, 전체 Gateway suite의 대체물이 아닙니다

### E2E(gateway smoke)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin E2E 테스트
- 런타임 기본값:
  - 저장소의 나머지 부분과 일치하도록 `isolate: false`로 Vitest `threads`를 사용합니다.
  - 적응형 워커를 사용합니다(CI: 최대 2개, 로컬: 기본 1개).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 무음 모드로 실행됩니다.
- 유용한 재정의:
  - `OPENCLAW_E2E_WORKERS=<n>`로 워커 수를 강제합니다(최대 16개).
  - `OPENCLAW_E2E_VERBOSE=1`로 자세한 콘솔 출력을 다시 활성화합니다.
- 범위:
  - 다중 인스턴스 Gateway 엔드투엔드 동작
  - WebSocket/HTTP 표면, Node 페어링, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됩니다(파이프라인에서 활성화된 경우).
  - 실제 키가 필요하지 않습니다.
  - 단위 테스트보다 움직이는 부분이 더 많습니다(더 느릴 수 있음).

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell Gateway를 시작합니다.
  - 임시 로컬 Dockerfile에서 샌드박스를 생성합니다.
  - 실제 `sandbox ssh-config` + SSH 실행을 통해 OpenClaw의 OpenShell 백엔드를 실행합니다.
  - 샌드박스 fs 브리지를 통해 원격 기준 파일 시스템 동작을 검증합니다.
- 기대 사항:
  - 옵트인 전용이며, 기본 `pnpm test:e2e` 실행에 포함되지 않습니다.
  - 로컬 `openshell` CLI와 작동하는 Docker 데몬이 필요합니다.
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 다음 테스트 Gateway와 샌드박스를 삭제합니다.
- 유용한 재정의:
  - `OPENCLAW_E2E_OPENSHELL=1`로 더 넓은 e2e 제품군을 수동으로 실행할 때 테스트를 활성화합니다.
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`로 기본값이 아닌 CLI 바이너리나 래퍼 스크립트를 지정합니다.

### 라이브(실제 제공자 + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin 라이브 테스트
- 기본값: `pnpm test:live`에서 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 제공자/모델이 실제 자격 증명으로 _오늘_ 실제로 작동하는가?”
  - 제공자 형식 변경, 도구 호출 특이점, 인증 문제, 속도 제한 동작을 포착합니다.
- 기대 사항:
  - 설계상 CI에서 안정적이지 않습니다(실제 네트워크, 실제 제공자 정책, 할당량, 장애).
  - 비용이 발생하거나 속도 제한을 사용합니다.
  - “전체” 대신 범위를 좁힌 하위 집합 실행을 선호합니다.
- 라이브 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소스로 읽습니다.
- 기본적으로 라이브 실행은 여전히 `HOME`을 격리하고 구성/인증 자료를 임시 테스트 홈으로 복사하므로 단위 픽스처가 실제 `~/.openclaw`를 변경할 수 없습니다.
- 라이브 테스트가 실제 홈 디렉터리를 사용해야 하는 의도적인 경우에만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본값으로 사용합니다. `[live] ...` 진행 출력은 유지하지만, 추가 `~/.profile` 알림을 억제하고 Gateway 부트스트랩 로그/Bonjour 잡음을 음소거합니다. 전체 시작 로그를 다시 원하면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(제공자별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`를 설정하거나(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) `OPENCLAW_LIVE_*_KEY`를 통해 라이브별 재정의를 설정하세요. 테스트는 속도 제한 응답 시 재시도합니다.
- 진행/Heartbeat 출력:
  - 라이브 제품군은 이제 긴 제공자 호출이 Vitest 콘솔 캡처가 조용한 경우에도 눈에 보이도록 stderr에 진행 줄을 내보냅니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 가로채기를 비활성화하여 라이브 실행 중 제공자/Gateway 진행 줄이 즉시 스트리밍되도록 합니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - Gateway/프로브 Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 제품군을 실행해야 하나요?

다음 결정 표를 사용하세요.

- 로직/테스트 편집: `pnpm test`를 실행하세요(많이 변경했다면 `pnpm test:coverage`도 실행).
- Gateway 네트워킹 / WS 프로토콜 / 페어링 변경: `pnpm test:e2e`를 추가하세요.
- “내 봇이 다운됨” / 제공자별 실패 / 도구 호출 디버깅: 범위를 좁힌 `pnpm test:live`를 실행하세요.

## 라이브(네트워크 접촉) 테스트

라이브 모델 매트릭스, CLI 백엔드 스모크, ACP 스모크, Codex 앱 서버
하네스, 모든 미디어 제공자 라이브 테스트(Deepgram, BytePlus, ComfyUI, 이미지,
음악, 비디오, 미디어 하네스), 그리고 라이브 실행의 자격 증명 처리는
[라이브 제품군 테스트](/ko/help/testing-live)를 참조하세요. 전용 업데이트 및
Plugin 검증 체크리스트는
[업데이트 및 plugins 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

## Docker 러너(선택적 "Linux에서 작동" 확인)

이 Docker 러너는 두 버킷으로 나뉩니다.

- 라이브 모델 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 저장소 Docker 이미지 안에서 일치하는 프로필 키 라이브 파일(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`)만 실행하며, 로컬 구성 디렉터리와 작업 공간을 마운트합니다(마운트된 경우 `~/.profile`도 소스로 읽음). 일치하는 로컬 엔트리포인트는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker 라이브 러너는 기본적으로 더 작은 스모크 상한을 사용하므로 전체 Docker 스윕을 실용적으로 유지합니다.
  `test:docker:live-models`는 기본값이 `OPENCLAW_LIVE_MAX_MODELS=12`이고,
  `test:docker:live-gateway`는 기본값이 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 및
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`입니다. 더 큰 완전 스캔을 명시적으로 원할 때 해당 환경 변수를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 라이브 Docker 이미지를 한 번 빌드하고, `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 npm 타볼로 한 번 패키징한 다음, 두 개의 `scripts/e2e/Dockerfile` 이미지를 빌드/재사용합니다. 베어 이미지는 install/update/plugin-dependency 레인을 위한 Node/Git 러너일 뿐이며, 해당 레인은 미리 빌드된 타볼을 마운트합니다. 기능 이미지는 빌드된 앱 기능 레인을 위해 동일한 타볼을 `/app`에 설치합니다. Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`가 선택된 계획을 실행합니다. 집계는 가중 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`은 프로세스 슬롯을 제어하고, 리소스 상한은 무거운 라이브, npm 설치, 다중 서비스 레인이 모두 동시에 시작되지 않게 합니다. 단일 레인이 활성 상한보다 무겁더라도, 풀이 비어 있으면 스케줄러가 여전히 이를 시작한 다음 용량이 다시 사용 가능해질 때까지 단독으로 실행을 유지할 수 있습니다. 기본값은 10개 슬롯, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 더 많은 여유가 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 조정하세요. 러너는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장하며, 이후 실행에서 더 긴 레인을 먼저 시작하는 데 해당 타이밍을 사용합니다. Docker를 빌드하거나 실행하지 않고 가중 레인 매니페스트를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 선택된 레인, 패키지/이미지 필요 항목, 자격 증명에 대한 CI 계획을 출력하려면 `node scripts/test-docker-all.mjs --plan-json`을 사용하세요.
- `Package Acceptance`는 "이 설치 가능한 타볼이 제품으로 작동하는가?"를 검증하는 GitHub 네이티브 패키지 게이트입니다. `source=npm`, `source=ref`, `source=url`, 또는 `source=artifact`에서 후보 패키지 하나를 해석하고, 이를 `package-under-test`로 업로드한 다음, 선택된 ref를 다시 패키징하는 대신 정확히 그 타볼에 대해 재사용 가능한 Docker E2E 레인을 실행합니다. 프로필은 범위 순서대로 `smoke`, `package`, `product`, `full`입니다. 패키지/업데이트/Plugin 계약, 게시된 업그레이드 생존자 매트릭스, 릴리스 기본값, 실패 분류는 [업데이트 및 plugins 테스트](/ko/help/testing-updates-plugins)를 참조하세요.
- 빌드 및 릴리스 확인은 tsdown 후 `scripts/check-cli-bootstrap-imports.mjs`를 실행합니다. 가드는 `dist/entry.js`와 `dist/cli/run-main.js`에서 정적 빌드 그래프를 순회하며, 명령 디스패치 전에 사전 디스패치 시작 가져오기가 Commander, 프롬프트 UI, undici, 로깅 같은 패키지 의존성을 가져오면 실패합니다. 또한 번들된 Gateway 실행 청크를 예산 아래로 유지하고, 알려진 콜드 Gateway 경로의 정적 가져오기를 거부합니다. 패키징된 CLI 스모크는 루트 도움말, onboard 도움말, doctor 도움말, 상태, 구성 스키마, 모델 목록 명령도 다룹니다.
- Package Acceptance 레거시 호환성은 `2026.4.25`(`2026.4.25-beta.*` 포함)까지로 제한됩니다. 해당 기준일까지 하네스는 배송된 패키지 메타데이터 누락만 허용합니다. 생략된 비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`, 타볼에서 파생된 git 픽스처의 누락된 패치 파일, 누락된 지속 `update.channel`, 레거시 Plugin 설치 레코드 위치, 누락된 마켓플레이스 설치 레코드 지속성, 그리고 `plugins update` 중 구성 메타데이터 마이그레이션입니다. `2026.4.25` 이후 패키지에서는 해당 경로가 엄격한 실패입니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, 그리고 `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 통합 경로를 검증합니다.

라이브 모델 Docker 러너는 필요한 CLI 인증 홈만(또는 실행 범위가 좁혀지지 않은 경우 지원되는 모든 인증 홈을) 바인드 마운트한 다음, 실행 전에 컨테이너 홈으로 복사하여 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 새로 고칠 수 있게 합니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 포함하며, `pnpm test:docker:live-acp-bind:droid` 및 `pnpm test:docker:live-acp-bind:opencode`를 통한 엄격한 Droid/OpenCode 커버리지 포함)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex 앱 서버 하니스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 개발 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 관측 가능성 스모크: `pnpm qa:otel:smoke`는 비공개 QA 소스 체크아웃 레인입니다. npm tarball에는 QA Lab이 포함되지 않으므로 의도적으로 패키지 Docker 릴리스 레인에 포함하지 않습니다.
- Open WebUI 라이브 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- npm tarball 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패킹된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩과 기본 Telegram을 통해 OpenAI를 구성하며, doctor를 실행하고, 모킹된 OpenAI 에이전트 턴 하나를 실행합니다. 사전 빌드된 tarball은 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 재사용하고, `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`으로 호스트 재빌드를 건너뛰거나, `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 또는 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`으로 채널을 전환합니다.
- 업데이트 채널 전환 스모크: `pnpm test:docker:update-channel-switch`는 패킹된 OpenClaw tarball을 Docker에 전역 설치하고, 패키지 `stable`에서 git `dev`로 전환하며, 유지된 채널과 업데이트 후 Plugin 동작을 검증한 다음, 다시 패키지 `stable`로 전환하고 업데이트 상태를 확인합니다.
- 업그레이드 생존자 스모크: `pnpm test:docker:upgrade-survivor`는 에이전트, 채널 구성, Plugin 허용 목록, 오래된 Plugin 의존성 상태, 기존 워크스페이스/세션 파일이 있는 더티한 이전 사용자 픽스처 위에 패킹된 OpenClaw tarball을 설치합니다. 라이브 제공자 또는 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, loopback Gateway를 시작하고 구성/상태 보존과 시작/상태 예산을 확인합니다.
- 게시된 업그레이드 생존자 스모크: `pnpm test:docker:published-upgrade-survivor`는 기본적으로 `openclaw@latest`를 설치하고, 현실적인 기존 사용자 파일을 시드하며, 내장된 명령 레시피로 해당 기준선을 구성하고, 결과 구성을 검증하며, 게시된 설치를 후보 tarball로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 쓴 다음, loopback Gateway를 시작하고 구성된 인텐트, 상태 보존, 시작, `/healthz`, `/readyz`, RPC 상태 예산을 확인합니다. `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 기준선 하나를 재정의하고, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`에 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` 같은 값을 지정해 집계 스케줄러가 정확한 로컬 기준선을 확장하도록 요청하고, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`에 `reported-issues` 같은 값을 지정해 이슈 형태의 픽스처를 확장합니다. reported-issues 세트에는 자동 외부 OpenClaw Plugin 설치 복구를 위한 `configured-plugin-installs`가 포함됩니다. Package Acceptance는 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출하고, `last-stable-4` 또는 `all-since-2026.4.23` 같은 메타 기준선 토큰을 해석하며, Full Release Validation은 릴리스 소크 패키지 게이트를 `last-stable-4 2026.4.23 2026.5.2 2026.4.15`와 `reported-issues`로 확장합니다.
- 세션 런타임 컨텍스트 스모크: `pnpm test:docker:session-runtime-context`는 숨겨진 런타임 컨텍스트 transcript 지속성과 영향을 받은 중복 prompt-rewrite 브랜치의 doctor 복구를 검증합니다.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패킹하고, 격리된 홈에서 `bun install -g`로 설치한 다음, `openclaw infer image providers --json`이 중단되지 않고 번들된 이미지 제공자를 반환하는지 검증합니다. 사전 빌드된 tarball은 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 재사용하고, `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`으로 호스트 빌드를 건너뛰거나, `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`로 빌드된 Docker 이미지에서 `dist/`를 복사합니다.
- 설치 프로그램 Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 root, update, direct-npm 컨테이너 전체에서 하나의 npm 캐시를 공유합니다. 업데이트 스모크는 후보 tarball로 업그레이드하기 전 안정 기준선으로 기본 npm `latest`를 사용합니다. 로컬에서는 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`로 재정의하거나, GitHub에서는 Install Smoke 워크플로의 `update_baseline_version` 입력으로 재정의합니다. 비root 설치 프로그램 검사는 격리된 npm 캐시를 유지하여 root 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않게 합니다. 로컬 재실행 간에 root/update/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정합니다.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요할 때는 해당 env 없이 로컬에서 스크립트를 실행합니다.
- 에이전트 공유 워크스페이스 삭제 CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에 하나의 워크스페이스를 가진 두 에이전트를 시드하며, `agents delete --json`을 실행하고, 유효한 JSON과 유지된 워크스페이스 동작을 검증합니다. install-smoke 이미지는 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`로 재사용합니다.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- 브라우저 CDP 스냅샷 스모크: `pnpm test:docker:browser-cdp-snapshot` (스크립트: `scripts/e2e/browser-cdp-snapshot-docker.sh`)는 소스 E2E 이미지와 Chromium 레이어를 빌드하고, 원시 CDP로 Chromium을 시작하며, `browser doctor --deep`을 실행하고, CDP 역할 스냅샷이 링크 URL, 커서 승격 클릭 가능 항목, iframe 참조, 프레임 메타데이터를 포함하는지 검증합니다.
- OpenAI Responses web_search 최소 reasoning 회귀: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 모킹된 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음, 제공자 스키마 거부를 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 내장 Pi 프로필 허용/거부 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/서브에이전트 MCP 정리(실제 Gateway + 격리된 cron 및 일회성 서브에이전트 실행 후 stdio MCP 자식 종료): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(로컬 경로, `file:`, 호이스트된 의존성이 있는 npm 레지스트리, git 이동 ref, ClawHub kitchen-sink, 마켓플레이스 업데이트, Claude-bundle 활성화/검사의 설치/업데이트 스모크): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
  ClawHub 블록을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하거나, 기본 kitchen-sink 패키지/런타임 쌍을 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 및 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`로 재정의합니다. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`이 없으면 테스트는 밀폐된 로컬 ClawHub 픽스처 서버를 사용합니다.
- Plugin 업데이트 변경 없음 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin 수명 주기 매트릭스 스모크: `pnpm test:docker:plugin-lifecycle-matrix`는 패킹된 OpenClaw tarball을 빈 컨테이너에 설치하고, npm Plugin을 설치하며, 활성화/비활성화를 전환하고, 로컬 npm 레지스트리를 통해 업그레이드 및 다운그레이드하며, 설치된 코드를 삭제한 다음, 각 수명 주기 단계의 RSS/CPU 메트릭을 로깅하면서 제거가 오래된 상태도 여전히 제거하는지 검증합니다.
- 구성 재로드 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`는 로컬 경로, `file:`, 호이스트된 의존성이 있는 npm 레지스트리, git 이동 ref, ClawHub 픽스처, 마켓플레이스 업데이트, Claude-bundle 활성화/검사의 설치/업데이트 스모크를 포함합니다. `pnpm test:docker:plugin-update`는 설치된 Plugins의 변경 없는 업데이트 동작을 포함합니다. `pnpm test:docker:plugin-lifecycle-matrix`는 리소스 추적 npm Plugin 설치, 활성화, 비활성화, 업그레이드, 다운그레이드, 코드 누락 제거를 포함합니다.

공유 기능 이미지를 수동으로 사전 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

설정된 경우 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 제품군별 이미지 재정의가 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키면, 스크립트는 해당 이미지가 아직 로컬에 없을 때 pull합니다. QR 및 설치 프로그램 Docker 테스트는 공유 빌드 앱 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

라이브 모델 Docker 실행기는 현재 checkout도 읽기 전용으로 bind-mount하고
컨테이너 내부의 임시 workdir에 stage합니다. 이렇게 하면 런타임
이미지를 가볍게 유지하면서도 정확한 로컬 소스/config에 대해 Vitest를 실행할 수 있습니다.
stage 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 그리고 앱 로컬 `.build` 또는
Gradle 출력 디렉터리처럼 큰 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로 Docker 라이브 실행이
머신별 artifact를 복사하는 데 몇 분씩 쓰지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하여 gateway 라이브 probe가 컨테이너 내부에서
실제 Telegram/Discord/기타 채널 worker를 시작하지 않도록 합니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로, 해당 Docker lane에서 gateway
라이브 coverage를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 스모크 테스트입니다. OpenAI 호환 HTTP endpoint가 활성화된
OpenClaw gateway 컨테이너를 시작하고, 그 gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작한 다음,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 확인한 뒤,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
첫 실행은 Docker가 Open WebUI 이미지를 pull해야 하거나 Open WebUI가 자체 cold-start 설정을
끝내야 할 수 있어 눈에 띄게 느릴 수 있습니다.
이 lane은 사용할 수 있는 라이브 모델 키를 기대하며, `OPENCLAW_PROFILE_FILE`
(기본값은 `~/.profile`)이 Docker화된 실행에서 이를 제공하는 주된 방법입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON payload를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 deterministic하며 실제 Telegram, Discord, 또는 iMessage 계정이
필요하지 않습니다. seeded Gateway 컨테이너를 부팅하고, `openclaw mcp serve`를 spawn하는 두 번째 컨테이너를
시작한 다음, 실제 stdio MCP bridge를 통해 routed conversation discovery, transcript read, attachment metadata,
라이브 event queue 동작, outbound send routing, 그리고 Claude 스타일 channel + permission notification을
검증합니다. notification check는 raw stdio MCP frame을 직접 inspect하므로, 스모크 테스트는 특정 client SDK가
우연히 surface하는 것만이 아니라 bridge가 실제로 emit하는 내용을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 deterministic하며 라이브 모델 키가 필요하지 않습니다.
repo Docker 이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP probe server를 시작하며,
embedded Pi bundle MCP runtime을 통해 해당 server를 materialize하고, tool을 실행한 다음,
`coding`과 `messaging`은 `bundle-mcp` tool을 유지하고 `minimal` 및 `tools.deny: ["bundle-mcp"]`는 이를
filter하는지 검증합니다.
`test:docker:cron-mcp-cleanup`은 deterministic하며 라이브 모델 키가 필요하지 않습니다.
실제 stdio MCP probe server가 있는 seeded Gateway를 시작하고, 격리된 cron turn과 `/subagents spawn`
one-shot child turn을 실행한 다음, 각 실행 후 MCP child process가 종료되는지 검증합니다.

수동 ACP 일반 언어 thread 스모크 테스트(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- regression/debug workflow를 위해 이 script를 유지하세요. ACP thread routing validation에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env var:

- `OPENCLAW_CONFIG_DIR=...` (기본값: `~/.openclaw`)는 `/home/node/.openclaw`에 mount됩니다
- `OPENCLAW_WORKSPACE_DIR=...` (기본값: `~/.openclaw/workspace`)는 `/home/node/.openclaw/workspace`에 mount됩니다
- `OPENCLAW_PROFILE_FILE=...` (기본값: `~/.profile`)는 `/home/node/.profile`에 mount되고 test 실행 전에 source됩니다
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 임시 config/workspace dir을 사용하고 외부 CLI auth mount 없이 `OPENCLAW_PROFILE_FILE`에서 source된 env var만 검증합니다
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (기본값: `~/.cache/openclaw/docker-cli-tools`)는 Docker 내부에서 cached CLI install을 위해 `/home/node/.npm-global`에 mount됩니다
- `$HOME` 아래의 외부 CLI auth dir/file은 `/host-auth...` 아래에 읽기 전용으로 mount된 다음, test 시작 전에 `/home/node/...`로 복사됩니다
  - 기본 dir: `.minimax`
  - 기본 file: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 좁혀진 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 dir/file만 mount합니다
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 comma list로 수동 override하세요
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`로 실행 범위를 좁힙니다
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`로 컨테이너 내부 provider를 filter합니다
- `OPENCLAW_SKIP_DOCKER_BUILD=1`은 rebuild가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용합니다
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`은 credential이 env가 아니라 profile store에서 오도록 보장합니다
- `OPENCLAW_OPENWEBUI_MODEL=...`은 Open WebUI 스모크 테스트를 위해 gateway가 노출하는 모델을 선택합니다
- `OPENCLAW_OPENWEBUI_PROMPT=...`은 Open WebUI 스모크 테스트가 사용하는 nonce-check prompt를 override합니다
- `OPENWEBUI_IMAGE=...`는 고정된 Open WebUI image tag를 override합니다

## 문서 sanity

문서 수정 후 docs check를 실행하세요: `pnpm check:docs`.
in-page heading check도 필요할 때는 전체 Mintlify anchor validation을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 regression(CI 안전)

이들은 실제 provider가 없는 “real pipeline” regression입니다.

- Gateway tool calling(mock OpenAI, 실제 gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard(WS `wizard.start`/`wizard.next`, config 작성 + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals(skills)

이미 “agent reliability evals”처럼 동작하는 CI 안전 test가 몇 가지 있습니다.

- 실제 gateway + agent loop를 통한 mock tool-calling(`src/gateway/gateway.test.ts`).
- session wiring과 config effect를 검증하는 end-to-end wizard flow(`src/gateway/gateway.test.ts`).

skills에서 아직 빠진 것([Skills](/ko/tools/skills) 참조):

- **Decisioning:** prompt에 skills가 나열되었을 때 agent가 올바른 skill을 선택하는가(또는 관련 없는 것을 피하는가)?
- **Compliance:** agent가 사용 전에 `SKILL.md`를 읽고 필요한 단계/arg를 따르는가?
- **Workflow contracts:** tool order, session history carryover, sandbox boundary를 assert하는 multi-turn scenario.

향후 eval은 먼저 deterministic하게 유지해야 합니다.

- mock provider를 사용하여 tool call + order, skill file read, session wiring을 assert하는 scenario runner.
- skill에 초점을 맞춘 작은 scenario suite(use vs avoid, gating, prompt injection).
- CI 안전 suite가 준비된 뒤에만 optional live eval(opt-in, env-gated).

## Contract tests(Plugin 및 channel shape)

Contract test는 등록된 모든 Plugin과 channel이 interface contract를 준수하는지 검증합니다.
발견된 모든 Plugin을 iterate하고 shape 및 behavior assertion suite를 실행합니다. 기본 `pnpm test`
unit lane은 이러한 공유 seam 및 smoke file을 의도적으로 건너뜁니다. 공유 channel 또는 provider surface를
수정할 때는 contract command를 명시적으로 실행하세요.

### Commands

- 모든 contract: `pnpm test:contracts`
- Channel contract만: `pnpm test:contracts:channels`
- Provider contract만: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **plugin** - 기본 Plugin shape(id, name, capability)
- **setup** - Setup wizard contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handler
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **status** - Channel status probe
- **registry** - Plugin registry shape

### Provider contracts

`src/plugins/contracts/*.contract.test.ts`에 위치합니다.

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### 실행 시점

- plugin-sdk export 또는 subpath를 변경한 후
- channel 또는 provider Plugin을 추가하거나 수정한 후
- Plugin registration 또는 discovery를 refactor한 후

Contract test는 CI에서 실행되며 실제 API key가 필요하지 않습니다.

## Regression 추가(가이드)

라이브에서 발견한 provider/model issue를 수정할 때:

- 가능하면 CI 안전 regression을 추가하세요(mock/stub provider, 또는 정확한 request-shape transformation capture)
- 본질적으로 live-only라면(rate limit, auth policy) live test를 좁게 유지하고 env var를 통해 opt-in으로 두세요
- bug를 잡는 가장 작은 layer를 target하는 것을 선호하세요:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 또는 CI 안전 gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 registry metadata(`listSecretTargetRegistryEntries()`)에서 SecretRef class당 하나의 sampled target을 derive한 다음, traversal-segment exec id가 reject되는지 assert합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef target family를 추가하면 해당 test의 `classifyTargetClass`를 update하세요. test는 unclassified target id에서 의도적으로 fail하므로 새 class가 조용히 skip될 수 없습니다.

## Related

- [Testing live](/ko/help/testing-live)
- [Testing updates and plugins](/ko/help/testing-updates-plugins)
- [CI](/ko/ci)
