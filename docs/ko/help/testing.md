---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/프로바이더 버그에 대한 회귀 테스트 추가
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: 단위/e2e/라이브 스위트, Docker 러너, 각 테스트가 다루는 범위'
title: 테스트
x-i18n:
    generated_at: "2026-05-10T19:39:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw에는 세 가지 Vitest 제품군(단위/통합, e2e, 라이브)과 작은 Docker 러너 세트가 있습니다. 이 문서는 "테스트 방식" 가이드입니다.

- 각 제품군이 다루는 것(그리고 의도적으로 다루지 _않는_ 것).
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에 실행할 명령.
- 라이브 테스트가 자격 증명을 찾고 모델/제공자를 선택하는 방식.
- 실제 모델/제공자 문제에 대한 회귀 테스트를 추가하는 방식.

<Note>
**QA 스택(qa-lab, qa-channel, 라이브 전송 레인)**은 별도로 문서화되어 있습니다.

- [QA 개요](/ko/concepts/qa-e2e-automation) - 아키텍처, 명령 표면, 시나리오 작성.
- [Matrix QA](/ko/concepts/qa-matrix) - `pnpm openclaw qa matrix` 참조.
- [QA 채널](/ko/channels/qa-channel) - 저장소 기반 시나리오에서 사용하는 합성 전송 Plugin.

이 페이지는 일반 테스트 제품군과 Docker/Parallels 러너 실행을 다룹니다. 아래 QA 전용 러너 섹션([QA 전용 러너](#qa-specific-runners))에는 구체적인 `qa` 호출이 나열되어 있으며 위 참조로 다시 안내합니다.
</Note>

## 빠른 시작

대부분의 경우:

- 전체 게이트(푸시 전에 예상됨): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 제품군 실행: `pnpm test:max`
- 직접 Vitest 감시 루프: `pnpm test:watch`
- 직접 파일 대상 지정은 이제 확장/채널 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 작업 중이라면 먼저 대상 지정 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA 레인: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 제품군: `pnpm test:e2e`

실제 제공자/모델을 디버깅할 때(실제 자격 증명 필요):

- 라이브 제품군(모델 + Gateway 도구/이미지 프로브): `pnpm test:live`
- 하나의 라이브 파일을 조용히 대상으로 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 런타임 성능 보고서: 실제 `openai/gpt-5.4` 에이전트 턴에는
  `live_gpt54=true`로, Kova CPU/힙/추적 아티팩트에는
  `deep_profile=true`로 `OpenClaw Performance`를 디스패치하세요. 일일 예약 실행은
  `CLAWGRIT_REPORTS_TOKEN`이 구성된 경우 mock-provider, deep-profile, GPT 5.4 레인 아티팩트를
  `openclaw/clawgrit-reports`에 게시합니다.
  mock-provider 보고서에는 소스 수준 Gateway 부팅, 메모리,
  Plugin 압력, 반복 fake-model hello-loop, CLI 시작 수치도 포함됩니다.
- Docker 라이브 모델 스윕: `pnpm test:docker:live-models`
  - 선택된 각 모델은 이제 텍스트 턴과 작은 파일 읽기 스타일 프로브를 실행합니다.
    메타데이터가 `image` 입력을 알리는 모델은 작은 이미지 턴도 실행합니다.
    제공자 실패를 격리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 프로브를 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 모두 `include_live_suites: true`로 재사용 가능한 라이브/E2E 워크플로를 호출하며,
    여기에는 제공자별로 샤딩된 별도 Docker 라이브 모델 매트릭스 작업이 포함됩니다.
  - 집중 CI 재실행에는 `include_live_suites: true` 및 `live_models_only: true`로
    `OpenClaw Live And E2E Checks (Reusable)`를 디스패치하세요.
  - 새로운 고신호 제공자 시크릿은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 해당
    예약/릴리스 호출자에 추가하세요.
- 네이티브 Codex 바인드 채팅 스모크: `pnpm test:docker:live-codex-bind`
  - Codex 앱 서버 경로에 대해 Docker 라이브 레인을 실행하고, `/codex bind`로 합성
    Slack DM을 바인딩하며, `/codex fast`와
    `/codex permissions`를 실행한 다음 일반 답장과 이미지 첨부 파일이
    ACP 대신 네이티브 Plugin 바인딩을 통해 라우팅되는지 확인합니다.
- Codex 앱 서버 하네스 스모크: `pnpm test:docker:live-codex-harness`
  - Plugin 소유 Codex 앱 서버 하네스를 통해 Gateway 에이전트 턴을 실행하고,
    `/codex status`와 `/codex models`를 확인하며, 기본적으로 이미지,
    Cron MCP, 하위 에이전트, Guardian 프로브를 실행합니다. 다른 Codex
    앱 서버 실패를 격리할 때는 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`으로
    하위 에이전트 프로브를 비활성화하세요. 하위 에이전트 검사에 집중하려면 다른 프로브를 비활성화하세요:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    이 명령은 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`이 설정되지 않는 한
    하위 에이전트 프로브 후 종료됩니다.
- Codex 온디맨드 설치 스모크: `pnpm test:docker:codex-on-demand`
  - Docker에 패키지된 OpenClaw 타르볼을 설치하고, OpenAI API 키
    온보딩을 실행하며, Codex Plugin과 `@openai/codex` 의존성이
    필요 시 관리형 npm 루트에 다운로드되었는지 확인합니다.
- 라이브 Plugin 도구 의존성 스모크: `pnpm test:docker:live-plugin-tool`
  - 실제 `slugify` 의존성이 있는 픽스처 Plugin을 패키징하고,
    `npm-pack:`을 통해 설치하며, 관리형 npm 루트 아래 의존성을 확인한 다음,
    라이브 OpenAI 모델에 Plugin 도구를 호출하고 숨겨진 슬러그를 반환하도록 요청합니다.
- Crestodian 구조 명령 스모크: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 구조 명령 표면을 위한 선택형 중복 안전 검사입니다.
    `/crestodian status`를 실행하고, 영구 모델 변경을 큐에 넣고,
    `/crestodian yes`에 답장하며, 감사/구성 쓰기 경로를 확인합니다.
- Crestodian 플래너 Docker 스모크: `pnpm test:docker:crestodian-planner`
  - `PATH`에 가짜 Claude CLI가 있는 무구성 컨테이너에서 Crestodian을 실행하고
    퍼지 플래너 폴백이 감사된 형식 지정 구성 쓰기로 변환되는지 확인합니다.
- Crestodian 첫 실행 Docker 스모크: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw 상태 디렉터리에서 시작해 일반 `openclaw`를
    Crestodian으로 라우팅하고, 설정/모델/에이전트/Discord Plugin + SecretRef 쓰기를 적용하며,
    구성을 검증하고 감사 항목을 확인합니다. 동일한 Ring 0 설정 경로는
    QA Lab에서도
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`로 다룹니다.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 다음,
  `moonshot/kimi-k2.6`에 대해 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  를 실행합니다. JSON이 Moonshot/K2.6을 보고하고 어시스턴트 트랜스크립트가 정규화된 `usage.cost`를 저장하는지 확인합니다.

<Tip>
실패 사례 하나만 필요하면 아래에 설명된 허용 목록 환경 변수를 통해 라이브 테스트를 좁히는 방식을 선호하세요.
</Tip>

## QA 전용 러너

QA-lab 수준의 현실성이 필요할 때 이 명령들은 기본 테스트 제품군과 나란히 사용됩니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. 에이전트 동등성은 독립 PR 워크플로가 아니라
`QA-Lab - All Lanes`와 릴리스 검증 아래에 포함됩니다.
광범위한 검증에는 `rerun_group=qa-parity`를 지정한 `Full Release Validation` 또는 릴리스 검사 QA 그룹을 사용해야 합니다. 안정/기본 릴리스
검사는 `run_release_soak=true` 뒤에 철저한 라이브/Docker 소크를 유지하며,
`full` 프로필은 소크를 강제합니다. `QA-Lab - All Lanes`는
`main`에서 야간에 실행되고 수동 디스패치에서 mock parity 레인, 라이브
Matrix 레인, Convex 관리형 라이브 Telegram 레인, Convex 관리형 라이브 Discord
레인을 병렬 작업으로 실행합니다. 예약 QA와 릴리스 검사는 Matrix에
`--profile fast`를 명시적으로 전달하는 반면, Matrix CLI와 수동 워크플로 입력
기본값은 `all`로 유지됩니다. 수동 디스패치는 `all`을 `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩할 수 있습니다. `OpenClaw Release
Checks`는 릴리스 승인 전에 동등성과 빠른 Matrix 및 Telegram 레인을 실행하며,
릴리스 전송 검사가 결정적이고 일반 제공자 Plugin 시작을 피하도록
`mock-openai/gpt-5.5`를 사용합니다. 이러한 라이브 전송
Gateway는 메모리 검색을 비활성화합니다. 메모리 동작은 QA 동등성
제품군에서 계속 다룹니다.

전체 릴리스 라이브 미디어 샤드는 이미 `ffmpeg`와 `ffprobe`가 포함된
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`를 사용합니다.
Docker 라이브 모델/백엔드 샤드는 선택된 커밋마다 한 번 빌드되는 공유
`ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용한 다음, 각 샤드 안에서 다시 빌드하는 대신
`OPENCLAW_SKIP_DOCKER_BUILD=1`로 가져옵니다.

- `pnpm openclaw qa suite`
  - repo 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 기본적으로 격리된 Gateway 워커로 선택된 여러 시나리오를 병렬 실행합니다. `qa-channel`은 기본 동시성 4를 사용합니다(선택된 시나리오 수로 제한). 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 기존 직렬 레인에는 `--concurrency 1`을 사용합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용합니다.
  - provider 모드 `live-frontier`, `mock-openai`, `aimock`을 지원합니다. `aimock`은 시나리오 인식 `mock-openai` 레인을 대체하지 않으면서 실험적 fixture 및 프로토콜 모의 coverage를 위해 로컬 AIMock 기반 provider 서버를 시작합니다.
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab을 통해 라이브 OpenAI Kitchen Sink Plugin gauntlet을 실행합니다. 외부 Kitchen Sink 패키지를 설치하고, Plugin SDK surface inventory를 검증하고, `/healthz`와 `/readyz`를 probe하고, Gateway CPU/RSS 증거를 기록하고, 라이브 OpenAI turn을 실행하고, adversarial diagnostics를 확인합니다. `OPENAI_API_KEY` 같은 라이브 OpenAI 인증이 필요합니다. hydrated Testbox 세션에서는 `openclaw-testbox-env` helper가 있으면 Testbox 라이브 인증 프로필을 자동으로 source합니다.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway startup bench와 작은 mock QA Lab 시나리오 팩(`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`)을 실행하고, 결합된 CPU 관찰 요약을 `.artifacts/gateway-cpu-scenarios/` 아래에 작성합니다.
  - 기본적으로 지속적인 hot CPU 관찰만 flag합니다(`--cpu-core-warn` 및 `--hot-wall-warn-ms`). 따라서 짧은 시작 burst는 수 분 동안 지속되는 Gateway peg regression처럼 보이지 않고 metric으로 기록됩니다.
  - 빌드된 `dist` 아티팩트를 사용합니다. checkout에 최신 runtime output이 아직 없으면 먼저 build를 실행합니다.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA suite를 일회용 Multipass Linux VM 안에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 provider/model 선택 flag를 재사용합니다.
  - 라이브 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다: env 기반 provider key, QA live provider config path, 그리고 있을 경우 `CODEX_HOME`.
  - output dir은 guest가 mounted workspace를 통해 다시 쓸 수 있도록 repo root 아래에 있어야 합니다.
  - 일반 QA report와 summary, 그리고 Multipass log를 `.artifacts/qa-e2e/...` 아래에 작성합니다.
- `pnpm qa:lab:up`
  - operator 스타일 QA 작업을 위해 Docker 기반 QA site를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 checkout에서 npm tarball을 빌드하고, Docker에 전역 설치하고, non-interactive OpenAI API-key onboarding을 실행하고, 기본적으로 Telegram을 구성하고, 패키징된 Plugin runtime이 startup dependency repair 없이 로드되는지 검증하고, doctor를 실행하고, mocked OpenAI endpoint를 대상으로 로컬 agent turn 하나를 실행합니다.
  - Discord로 동일한 packaged-install 레인을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용합니다.
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcript를 위한 결정론적 built-app Docker smoke를 실행합니다. 숨겨진 OpenClaw runtime context가 보이는 사용자 turn에 누출되지 않고 non-display custom message로 지속 저장되는지 검증한 다음, 영향을 받는 깨진 session JSONL을 seed하고 `openclaw doctor --fix`가 backup과 함께 active branch로 다시 작성하는지 검증합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 OpenClaw package candidate를 설치하고, installed-package onboarding을 실행하고, 설치된 CLI를 통해 Telegram을 구성한 다음, 해당 설치 패키지를 SUT Gateway로 사용하여 라이브 Telegram QA 레인을 재사용합니다.
  - wrapper는 checkout에서 `qa-lab` harness source만 mount합니다. 설치된 패키지가 `dist`, `openclaw/plugin-sdk`, bundled Plugin runtime을 소유하므로 레인이 현재 checkout Plugin을 테스트 중인 패키지에 섞지 않습니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다. registry에서 설치하는 대신 해결된 로컬 tarball을 테스트하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 또는 `OPENCLAW_CURRENT_PACKAGE_TGZ`를 설정합니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env credential 또는 Convex credential source를 사용합니다. CI/release 자동화에서는 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와 `OPENCLAW_QA_CONVEX_SITE_URL`, role secret을 설정합니다. CI에 `OPENCLAW_QA_CONVEX_SITE_URL`과 Convex role secret이 있으면 Docker wrapper가 Convex를 자동 선택합니다.
  - wrapper는 Docker build/install 작업 전에 호스트에서 Telegram 또는 Convex credential env를 검증합니다. pre-credential setup을 의도적으로 디버그할 때만 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`을 설정합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 대해서만 공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 override합니다.
  - GitHub Actions는 이 레인을 수동 maintainer workflow `NPM Telegram Beta E2E`로 노출합니다. merge 시에는 실행되지 않습니다. workflow는 `qa-live-shared` environment와 Convex CI credential lease를 사용합니다.
- GitHub Actions는 하나의 candidate package에 대한 side-run product proof용 `Package Acceptance`도 노출합니다. 신뢰된 ref, published npm spec, HTTPS tarball URL과 SHA-256, 또는 다른 실행의 tarball artifact를 받아 정규화된 `openclaw-current.tgz`를 `package-under-test`로 upload한 다음, smoke, package, product, full 또는 custom lane profile로 기존 Docker E2E scheduler를 실행합니다. 동일한 `package-under-test` artifact를 대상으로 Telegram QA workflow를 실행하려면 `telegram_mode=mock-openai` 또는 `live-frontier`를 설정합니다.
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
  - 현재 OpenClaw build를 Docker에서 pack 및 install하고, OpenAI가 구성된 Gateway를 시작한 다음, config edit을 통해 bundled channel/Plugin을 활성화합니다.
  - setup discovery가 구성되지 않은 downloadable Plugin을 absent로 남기는지, 처음 구성된 doctor repair가 누락된 각 downloadable Plugin을 명시적으로 설치하는지, 두 번째 restart가 hidden dependency repair를 실행하지 않는지 검증합니다.
  - 또한 알려진 이전 npm baseline을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화한 다음, candidate의 post-update doctor가 harness-side postinstall repair 없이 legacy Plugin dependency debris를 정리하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels guest 전반에서 native packaged-install update smoke를 실행합니다. 선택된 각 platform은 먼저 요청된 baseline package를 설치한 다음, 동일한 guest에서 설치된 `openclaw update` command를 실행하고 설치된 version, update status, Gateway readiness, local agent turn 하나를 검증합니다.
  - 한 guest에서 반복 작업할 때는 `--platform macos`, `--platform windows` 또는 `--platform linux`를 사용합니다. summary artifact path와 per-lane status에는 `--json`을 사용합니다.
  - OpenAI 레인은 기본적으로 live agent-turn proof에 `openai/gpt-5.5`를 사용합니다. 다른 OpenAI model을 의도적으로 검증할 때는 `--model <provider/model>`을 전달하거나 `OPENCLAW_PARALLELS_OPENAI_MODEL`을 설정합니다.
  - Parallels transport stall이 남은 testing window를 소비하지 않도록 긴 로컬 실행을 host timeout으로 감쌉니다:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script는 nested lane log를 `/tmp/openclaw-parallels-npm-update.*` 아래에 작성합니다. outer wrapper가 hung 상태라고 가정하기 전에 `windows-update.log`, `macos-update.log` 또는 `linux-update.log`를 inspect합니다.
  - Windows update는 cold guest에서 post-update doctor와 package update 작업에 10~15분을 사용할 수 있습니다. nested npm debug log가 진행 중이면 여전히 정상입니다.
  - 이 aggregate wrapper를 개별 Parallels macOS, Windows 또는 Linux smoke lane과 병렬로 실행하지 마십시오. 이들은 VM state를 공유하며 snapshot restore, package serving 또는 guest Gateway state에서 충돌할 수 있습니다.
  - post-update proof는 일반 bundled Plugin surface를 실행합니다. speech, image generation, media understanding 같은 capability facade가 agent turn 자체는 단순 text response만 확인하더라도 bundled runtime API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 protocol smoke testing을 위해 로컬 AIMock provider server만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix live QA lane을 실행합니다. source-checkout 전용입니다. packaged install은 `qa-lab`을 ship하지 않습니다.
  - 전체 CLI, profile/scenario catalog, env var, artifact layout: [Matrix QA](/ko/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT bot token을 사용하여 실제 private group을 대상으로 Telegram live QA lane을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. group id는 숫자 Telegram chat id여야 합니다.
  - 공유 pooled credential에는 `--credential-source convex`를 지원합니다. 기본적으로 env mode를 사용하거나, pooled lease를 opt in하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정합니다.
  - 기본값은 canary, mention gating, command addressing, `/status`, bot-to-bot mentioned reply, core native command reply를 포함합니다. `mock-openai` 기본값은 deterministic reply-chain과 Telegram final-message streaming regression도 포함합니다. `session_status` 같은 optional probe에는 `--list-scenarios`를 사용합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용합니다.
  - 동일한 private group에 서로 다른 bot 두 개가 필요하며, SUT bot은 Telegram username을 노출해야 합니다.
  - 안정적인 bot-to-bot 관찰을 위해 두 bot 모두에 대해 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화하고 driver bot이 group bot traffic을 관찰할 수 있는지 확인합니다.
  - Telegram QA report, summary, observed-messages artifact를 `.artifacts/qa-e2e/...` 아래에 작성합니다. reply 시나리오에는 driver send request부터 관찰된 SUT reply까지의 RTT가 포함됩니다.

`Mantis Telegram Live`는 이 레인을 둘러싼 PR-evidence wrapper입니다. candidate ref를 Convex-leased Telegram credential로 실행하고, redacted observed-message transcript를 Crabbox desktop browser에 render하고, MP4 evidence를 기록하고, motion-trimmed GIF를 생성하고, artifact bundle을 upload하고, `pr_number`가 설정된 경우 Mantis GitHub App을 통해 inline PR evidence를 게시합니다. Maintainer는 Actions UI의 `Mantis Scenario`(`scenario_id: telegram-live`)를 통해 또는 pull request comment에서 직접 시작할 수 있습니다:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux 데스크톱을 임대하거나 재사용하고, 네이티브 Telegram Desktop을 설치하며, 임대한 Telegram SUT 봇 토큰으로 OpenClaw를 구성하고, Gateway를 시작한 뒤 보이는 VNC 데스크톱에서 스크린샷/MP4 증거를 기록합니다.
  - 기본값은 `--credential-source convex`이므로 워크플로에는 Convex 브로커 시크릿만 필요합니다. `pnpm openclaw qa telegram`과 동일한 `OPENCLAW_QA_TELEGRAM_*` 변수를 사용하려면 `--credential-source env`를 사용하세요.
  - Telegram Desktop에는 여전히 사용자 로그인/프로필이 필요합니다. 봇 토큰은 OpenClaw만 구성합니다. base64 `.tgz` 프로필 아카이브에는 `--telegram-profile-archive-env <name>`을 사용하거나, `--keep-lease`를 사용한 뒤 VNC를 통해 한 번 수동으로 로그인하세요.
  - 출력 디렉터리 아래에 `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, `telegram-desktop-builder.mp4`를 씁니다.

라이브 전송 레인은 새 전송이 어긋나지 않도록 하나의 표준 계약을 공유합니다. 레인별 커버리지 매트릭스는 [QA 개요 → 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 있습니다. `qa-channel`은 광범위한 합성 스위트이며 이 매트릭스의 일부가 아닙니다.

### Convex를 통한 공유 Telegram 자격 증명(v1)

라이브 전송 QA에 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면, QA lab은 Convex 기반 풀에서 독점 임대를 획득하고, 레인이 실행되는 동안 해당 임대에 Heartbeat를 보내며, 종료 시 임대를 해제합니다. 섹션 이름은 Discord, Slack, WhatsApp 지원보다 먼저 만들어졌습니다. 임대 계약은 종류 전반에서 공유됩니다.

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

선택적 환경 변수:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

일반 운영에서는 `OPENCLAW_QA_CONVEX_SITE_URL`이 `https://`를 사용해야 합니다.

관리자 관리 명령(풀 추가/제거/목록)에는 특히 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

관리자를 위한 CLI 헬퍼:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용하여 시크릿 값을 출력하지 않고 Convex 사이트 URL, 브로커 시크릿, 엔드포인트 접두사, HTTP 타임아웃, 관리자/목록 접근 가능성을 확인하세요. 스크립트와 CI 유틸리티에서 기계가 읽을 수 있는 출력을 원하면 `--json`을 사용하세요.

기본 엔드포인트 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add`(관리자 시크릿만)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(관리자 시크릿만)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 임대 가드: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(관리자 시크릿만)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram 종류의 페이로드 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자 Telegram 채팅 id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하고 잘못된 페이로드를 거부합니다.

Telegram 실제 사용자 종류의 페이로드 형태:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, `telegramApiId`는 숫자 문자열이어야 합니다.
- `tdlibArchiveSha256` 및 `desktopTdataArchiveSha256`는 SHA-256 16진수 문자열이어야 합니다.
- `kind: "telegram-user"`는 하나의 Telegram 버너 계정을 나타냅니다. 임대를 계정 전체 범위로 취급하세요. TDLib CLI 드라이버와 Telegram Desktop 시각적 증인은 같은 페이로드에서 복원하며, 한 번에 하나의 작업만 임대를 보유해야 합니다.

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

시각적 기록이 필요할 때는 복원된 Desktop 프로필을 `Telegram -workdir "$tmp/desktop"`와 함께 사용하세요. 로컬 운영자 환경에서는 프로세스 환경 변수가 없으면 `scripts/e2e/telegram-user-credential.ts`가 기본적으로 `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`를 읽습니다.

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

`start`는 `telegram-user` 자격 증명을 임대하고, Crabbox Linux 데스크톱에서 같은 계정을 TDLib와 Telegram Desktop에 복원하며, 현재 체크아웃에서 로컬 모의 SUT Gateway를 시작하고, 보이는 Telegram 채팅을 열고, 데스크톱 기록을 시작하며, 비공개 `session.json`을 씁니다. 세션이 살아 있는 동안 에이전트는 만족할 때까지 테스트를 계속할 수 있습니다.

- `send --session <file> --text <message>`는 실제 TDLib 사용자를 통해 보내고 SUT 응답을 기다립니다.
- `run --session <file> -- <remote command>`는 Crabbox에서 임의 명령을 실행하고 그 출력을 저장합니다. 예: `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>`은 현재 보이는 데스크톱을 캡처합니다.
- `status --session <file>`은 임대 및 WebVNC 명령을 출력합니다.
- `finish --session <file>`은 레코더를 중지하고, 스크린샷/비디오/모션 트림 아티팩트를 캡처하며, Convex 자격 증명을 해제하고, 로컬 SUT 프로세스를 중지하며, `--keep-box`가 전달되지 않은 경우 Crabbox 임대를 중지합니다.
- `publish --session <file> --pr <number>`는 기본적으로 GIF 전용 PR 댓글을 게시합니다. 로그 또는 JSON 아티팩트가 의도적으로 필요할 때만 `--full-artifacts`를 전달하세요.

결정론적인 시각적 재현에는 `start` 또는 단일 명령 `probe` 축약형에 `--mock-response-file <path>`를 전달하세요. 러너의 기본값은 표준 Crabbox 클래스, 24fps 기록, 24fps 모션 GIF 미리보기, 1920px GIF 너비입니다. 증거에 다른 캡처 설정이 필요할 때만 `--class`, `--record-fps`, `--preview-fps`, `--preview-width`로 재정의하세요.

단일 명령 Crabbox 증거:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

기본 `probe` 명령은 하나의 시작/전송/종료 사이클을 위한 축약형입니다. 빠른 `/status` 스모크에 사용하세요. PR 검토, 버그 재현 작업, 또는 에이전트가 증거 완료 여부를 결정하기 전에 몇 분간 임의 실험이 필요한 모든 경우에는 세션 명령을 사용하세요. 따뜻한 데스크톱 임대를 재사용하려면 `--id <cbx_...>`를, 종료 후 VNC를 열어 두려면 `--keep-box`를, 보이는 채팅을 선택하려면 `--desktop-chat-title <name>`을, 새 박스에서 TDLib를 빌드하는 대신 미리 구운 Linux `libtdjson.so` 아카이브를 사용할 때는 `--tdlib-url <tgz>`를 사용하세요. 러너는 `--tdlib-sha256 <hex>` 또는 기본적으로 형제 `<url>.sha256` 파일로 `--tdlib-url`을 검증합니다.

브로커가 검증하는 다중 채널 페이로드:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 레인도 풀에서 임대할 수 있지만, Slack 페이로드 검증은 현재 브로커가 아니라 Slack QA 러너에 있습니다. Slack 행에는 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`를 사용하세요.

### QA에 채널 추가

새 채널 어댑터의 아키텍처 및 시나리오 헬퍼 이름은 [QA 개요 → 채널 추가](/ko/concepts/qa-e2e-automation#adding-a-channel)에 있습니다. 최소 기준: 공유 `qa-lab` 호스트 seam에서 전송 러너를 구현하고, Plugin manifest에 `qaRunners`를 선언하고, `openclaw qa <runner>`로 마운트하며, `qa/scenarios/` 아래에 시나리오를 작성합니다.

## 테스트 스위트(무엇이 어디에서 실행되는가)

스위트를 “현실성 증가”(그리고 불안정성/비용 증가)로 생각하세요.

### 단위 / 통합(기본값)

- 명령: `pnpm test`
- 구성: 대상이 지정되지 않은 실행은 `vitest.full-*.config.ts` 샤드 세트를 사용하며 병렬 스케줄링을 위해 다중 프로젝트 샤드를 프로젝트별 구성으로 확장할 수 있습니다.
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 코어/단위 인벤토리. UI 단위 테스트는 전용 `unit-ui` 샤드에서 실행됩니다.
- 범위:
  - 순수 단위 테스트
  - 인프로세스 통합 테스트(Gateway 인증, 라우팅, 도구, 파싱, 구성)
  - 알려진 버그에 대한 결정론적 회귀
- 기대 사항:
  - CI에서 실행됨
  - 실제 키가 필요 없음
  - 빠르고 안정적이어야 함
  - 리졸버 및 공개 표면 로더 테스트는 실제 번들 Plugin 소스 API가 아니라 생성된 작은 Plugin fixture로 광범위한 `api.js` 및 `runtime-api.js` fallback 동작을 증명해야 합니다. 실제 Plugin API 로드는 Plugin 소유 계약/통합 스위트에 속합니다.

네이티브 의존성 정책:

- 기본 테스트 설치는 선택적 네이티브 Discord opus 빌드를 건너뜁니다. Discord 음성 수신은 순수 JS `opusscript` 디코더를 사용하며, `@discordjs/opus`는 `ignoredBuiltDependencies`에 남아 로컬 테스트와 Testbox 레인이 네이티브 애드온을 컴파일하지 않도록 합니다.
- 네이티브 opus 빌드를 의도적으로 비교해야 하는 경우 전용 Discord 음성 성능 또는 라이브 레인을 사용하세요. 기본 `onlyBuiltDependencies`에 `@discordjs/opus`를 다시 추가하지 마세요. 그러면 관련 없는 설치/테스트 루프가 네이티브 코드를 컴파일하게 됩니다.

<AccordionGroup>
  <Accordion title="프로젝트, 샤드, 범위 지정 레인">

    - 대상이 지정되지 않은 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 걸린 머신에서 피크 RSS가 줄고, auto-reply/extension 작업이 관련 없는 스위트를 굶주리게 하는 일을 피할 수 있습니다.
    - `pnpm test --watch`는 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다. 다중 샤드 watch 루프는 실용적이지 않기 때문입니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적 파일/디렉터리 대상을 먼저 범위 지정된 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않아도 됩니다.
    - `pnpm test:changed`는 변경된 git 경로를 기본적으로 저렴한 범위 지정 레인으로 확장합니다. 직접 테스트 편집, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import 그래프 의존 항목이 해당됩니다. config/setup/package 편집은 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 명시적으로 사용하지 않는 한 테스트를 광범위하게 실행하지 않습니다.
    - `pnpm check:changed`는 좁은 범위 작업을 위한 일반적인 스마트 로컬 check 게이트입니다. diff를 core, core 테스트, extensions, extension 테스트, apps, docs, release 메타데이터, live Docker tooling, tooling으로 분류한 다음, 그에 맞는 typecheck, lint, guard 명령을 실행합니다. Vitest 테스트는 실행하지 않습니다. 테스트 증거에는 `pnpm test:changed` 또는 명시적 `pnpm test <target>`을 호출하세요. release 메타데이터 전용 버전 범프는 대상 버전/config/root-dependency check를 실행하며, 최상위 version 필드 밖의 package 변경을 거부하는 guard가 포함됩니다.
    - Live Docker ACP harness 편집은 집중 check를 실행합니다. live Docker auth 스크립트의 shell 구문과 live Docker scheduler dry-run입니다. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로 제한된 경우에만 포함됩니다. dependency, export, version, 기타 package surface 편집은 여전히 더 넓은 guard를 사용합니다.
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk` 및 유사한 순수 utility 영역의 import-light unit 테스트는 `unit-fast` 레인으로 라우팅되며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. stateful/runtime-heavy 파일은 기존 레인에 그대로 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 changed-mode 실행을 해당 light 레인의 명시적 형제 테스트에 매핑하므로, helper 편집은 해당 디렉터리의 전체 heavy suite를 다시 실행하지 않아도 됩니다.
    - `auto-reply`에는 최상위 core helper, 최상위 `reply.*` 통합 테스트, `src/auto-reply/reply/**` 하위 트리를 위한 전용 bucket이 있습니다. CI는 reply 하위 트리를 agent-runner, dispatch, commands/state-routing shard로 추가 분할하므로 하나의 import-heavy bucket이 전체 Node tail을 독점하지 않습니다.
    - 일반 PR/main CI는 의도적으로 extension batch sweep과 release 전용 `agentic-plugins` shard를 건너뜁니다. Full Release Validation은 release candidate에서 이러한 plugin/extension-heavy suite를 위해 별도의 `Plugin Prerelease` child workflow를 dispatch합니다.

  </Accordion>

  <Accordion title="임베디드 runner 커버리지">

    - message-tool discovery 입력 또는 compaction runtime
      context를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 routing 및 normalization
      boundary에 대한 집중 helper regression을 추가하세요.
    - 임베디드 runner 통합 suite를 건강하게 유지하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이 suite들은 scoped id와 compaction 동작이 실제 `run.ts` / `compact.ts`
      경로를 통해 계속 흐르는지 검증합니다. helper 전용 테스트는
      이러한 통합 경로를 충분히 대체하지 못합니다.

  </Accordion>

  <Accordion title="Vitest pool 및 isolation 기본값">

    - 기본 Vitest config는 `threads`를 기본값으로 사용합니다.
    - 공유 Vitest config는 `isolate: false`를 고정하고
      root projects, e2e, live configs 전반에서 non-isolated runner를 사용합니다.
    - root UI 레인은 자체 `jsdom` setup과 optimizer를 유지하지만,
      공유 non-isolated runner에서도 실행됩니다.
    - 각 `pnpm test` shard는 공유 Vitest config에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 대규모 로컬 실행 중 V8 compile churn을 줄이기 위해
      기본적으로 Vitest child Node 프로세스에 `--no-maglev`를 추가합니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 formatting 전용입니다. format된 파일을 다시 stage하며,
      lint, typecheck, test는 실행하지 않습니다.
    - handoff 또는 push 전에 스마트 로컬 check 게이트가 필요하면
      `pnpm check:changed`를 명시적으로 실행하세요.
    - `pnpm test:changed`는 기본적으로 저렴한 범위 지정 레인을 통해 라우팅됩니다.
      harness, config, package, contract 편집에 정말 더 넓은 Vitest 커버리지가 필요하다고
      agent가 판단한 경우에만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.
    - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 routing
      동작을 유지하되, 더 높은 worker cap만 사용합니다.
    - 로컬 worker auto-scaling은 의도적으로 보수적이며 host load average가 이미 높을 때
      물러서므로, 여러 Vitest 실행이 동시에 일어나도 기본적으로 피해가 줄어듭니다.
    - 기본 Vitest config는 projects/config 파일을 `forceRerunTriggers`로 표시하여
      test wiring이 변경될 때 changed-mode rerun이 올바르게 유지되도록 합니다.
    - config는 지원되는 host에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성 상태로 유지합니다.
      직접 profiling을 위해 명시적 cache 위치 하나를 원하면
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration reporting과
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 profiling view를
      `origin/main` 이후 변경된 파일로 범위 지정합니다.
    - shard timing data는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      whole-config 실행은 config 경로를 key로 사용합니다. include-pattern CI
      shard는 shard 이름을 추가하므로 filtered shard를 별도로 추적할 수 있습니다.
    - 하나의 hot test가 여전히 대부분의 시간을 startup import에 소비한다면,
      heavy dependency를 좁은 로컬 `*.runtime.ts` seam 뒤에 두고
      runtime helper를 `vi.mock(...)`으로 넘기기 위해 deep-import하는 대신
      해당 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 committed
      diff에 대해 라우팅된 `test:changed`를 네이티브 root-project 경로와 비교하고,
      wall time과 macOS max RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 변경된 file list를
      `scripts/test-projects.mjs`와 root Vitest config를 통해 라우팅하여
      현재 dirty tree를 benchmark합니다.
    - `pnpm test:perf:profile:main`은 Vitest/Vite startup 및 transform overhead에 대한
      main-thread CPU profile을 기록합니다.
    - `pnpm test:perf:profile:runner`는 file parallelism을 비활성화한 상태로
      unit suite의 runner CPU+heap profile을 기록합니다.

  </Accordion>
</AccordionGroup>

### 안정성 (gateway)

- 명령: `pnpm test:stability:gateway`
- config: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 기본적으로 diagnostics가 활성화된 실제 loopback Gateway를 시작합니다
  - diagnostic event path를 통해 synthetic gateway message, memory, large-payload churn을 구동합니다
  - Gateway WS RPC를 통해 `diagnostics.stability`를 query합니다
  - diagnostic stability bundle persistence helper를 커버합니다
  - recorder가 bounded 상태로 유지되고, synthetic RSS sample이 pressure budget 아래에 머물며, per-session queue depth가 다시 0으로 drain되는지 assert합니다
- 기대 사항:
  - CI-safe 및 keyless
  - stability-regression follow-up을 위한 좁은 레인이며, 전체 Gateway suite의 대체물이 아닙니다

### E2E (gateway smoke)

- 명령: `pnpm test:e2e`
- config: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래 bundled-plugin E2E 테스트
- runtime 기본값:
  - repo의 나머지 부분과 일치하도록 Vitest `threads`를 `isolate: false`와 함께 사용합니다.
  - adaptive worker를 사용합니다(CI: 최대 2, local: 기본값 1).
  - console I/O overhead를 줄이기 위해 기본적으로 silent mode로 실행합니다.
- 유용한 override:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`(최대 16으로 제한).
  - verbose console 출력을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`.
- 범위:
  - multi-instance gateway end-to-end 동작
  - WebSocket/HTTP surface, node pairing, 더 무거운 networking
- 기대 사항:
  - CI에서 실행됩니다(pipeline에서 활성화된 경우)
  - 실제 key가 필요하지 않습니다
  - unit 테스트보다 moving part가 많습니다(느릴 수 있음)

### E2E: OpenShell backend smoke

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 host에서 isolated OpenShell gateway를 시작합니다
  - 임시 로컬 Dockerfile에서 sandbox를 생성합니다
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell backend를 exercise합니다
  - sandbox fs bridge를 통해 remote-canonical filesystem 동작을 검증합니다
- 기대 사항:
  - opt-in 전용이며, 기본 `pnpm test:e2e` 실행에는 포함되지 않습니다
  - 로컬 `openshell` CLI와 작동하는 Docker daemon이 필요합니다
  - isolated `HOME` / `XDG_CONFIG_HOME`을 사용한 다음 test gateway와 sandbox를 제거합니다
- 유용한 override:
  - 더 넓은 e2e suite를 수동으로 실행할 때 test를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`
  - 기본이 아닌 CLI binary 또는 wrapper script를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (실제 providers + 실제 models)

- 명령: `pnpm test:live`
- config: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래 bundled-plugin live tests
- 기본값: `pnpm test:live`에 의해 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - "이 provider/model이 실제 creds로 _오늘_ 실제로 동작하는가?"
  - provider format 변경, tool-calling quirks, auth 문제, rate limit 동작을 포착합니다
- 기대 사항:
  - 설계상 CI-stable하지 않습니다(실제 network, 실제 provider policies, quotas, outages)
  - 비용이 발생하거나 rate limit을 사용합니다
  - "everything" 대신 좁힌 subset 실행을 선호하세요
- Live 실행은 누락된 API key를 가져오기 위해 `~/.profile`을 source합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 격리하고 config/auth material을 임시 test home으로 복사하므로 unit fixture가 실제 `~/.openclaw`를 mutate할 수 없습니다.
- live test가 실제 home directory를 사용해야 할 의도가 있을 때만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 기본적으로 더 조용한 mode를 사용합니다. `[live] ...` progress output은 유지하지만, 추가 `~/.profile` notice를 억제하고 gateway bootstrap logs/Bonjour chatter를 mute합니다. 전체 startup log를 다시 원하면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API key rotation(provider-specific): comma/semicolon format의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나 `OPENCLAW_LIVE_*_KEY`를 통한 per-live override를 사용하세요. test는 rate limit response에서 retry합니다.
- Progress/heartbeat output:
  - Live suite는 이제 stderr로 progress line을 emit하므로 Vitest console capture가 조용해도 긴 provider call이 visibly active 상태임을 볼 수 있습니다.
  - `vitest.live.config.ts`는 Vitest console interception을 비활성화하여 live 실행 중 provider/gateway progress line이 즉시 stream되도록 합니다.
  - direct-model Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/probe Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 suite를 실행해야 하나요?

이 decision table을 사용하세요:

- 편집 로직/테스트: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도 실행)
- Gateway 네트워킹 / WS 프로토콜 / 페어링을 건드린 경우: `pnpm test:e2e` 추가
- "내 봇이 다운됨" / 제공자별 실패 / 도구 호출 디버깅: 범위를 좁혀 `pnpm test:live` 실행

## 라이브(네트워크 접촉) 테스트

라이브 모델 매트릭스, CLI 백엔드 스모크, ACP 스모크, Codex 앱 서버
하니스, 모든 미디어 제공자 라이브 테스트(Deepgram, BytePlus, ComfyUI, 이미지,
음악, 비디오, 미디어 하니스), 그리고 라이브 실행을 위한 자격 증명 처리는
[라이브 스위트 테스트](/ko/help/testing-live)를 참조하세요. 전용 업데이트 및
Plugin 검증 체크리스트는
[업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

## Docker 러너(선택적 "Linux에서 동작" 확인)

이 Docker 러너들은 두 버킷으로 나뉩니다.

- 라이브 모델 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 repo Docker 이미지 안에서 일치하는 프로필 키 라이브 파일만 실행하며(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`), 로컬 config 디렉터리와 workspace를 마운트합니다(마운트된 경우 `~/.profile`도 소싱). 일치하는 로컬 진입점은 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker 라이브 러너는 전체 Docker 스윕이 실용적인 수준으로 유지되도록 더 작은 스모크 상한을 기본값으로 사용합니다.
  `test:docker:live-models`의 기본값은 `OPENCLAW_LIVE_MAX_MODELS=12`이고,
  `test:docker:live-gateway`의 기본값은 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`입니다. 명시적으로 더 큰
  전체 스캔을 원할 때 해당 환경 변수를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`로 라이브 Docker 이미지를 한 번 빌드하고, `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 npm tarball로 한 번 패키징한 다음, 두 개의 `scripts/e2e/Dockerfile` 이미지를 빌드/재사용합니다. 기본 이미지는 install/update/plugin-dependency 레인을 위한 Node/Git 러너일 뿐이며, 해당 레인들은 미리 빌드된 tarball을 마운트합니다. 기능 이미지는 built-app 기능 레인을 위해 동일한 tarball을 `/app`에 설치합니다. Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`가 선택된 계획을 실행합니다. 집계는 가중치 기반 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`은 프로세스 슬롯을 제어하고, 리소스 상한은 무거운 라이브, npm-install, 멀티 서비스 레인이 한꺼번에 시작되지 않도록 합니다. 단일 레인이 활성 상한보다 무거운 경우에도 풀(pool)이 비어 있으면 스케줄러가 이를 시작할 수 있으며, 다시 용량이 생길 때까지 단독으로 실행되도록 유지합니다. 기본값은 슬롯 10개, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 더 많은 여유가 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 조정하세요. 러너는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 레인의 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장한 뒤, 이후 실행에서 더 오래 걸리는 레인을 먼저 시작하는 데 해당 타이밍을 사용합니다. 빌드하거나 Docker를 실행하지 않고 가중치가 적용된 레인 매니페스트를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 선택된 레인의 CI 계획, 패키지/이미지 필요 사항, 자격 증명을 출력하려면 `node scripts/test-docker-all.mjs --plan-json`을 사용하세요.
- `Package Acceptance`는 "이 설치 가능한 tarball이 제품으로 동작하는가?"를 확인하는 GitHub 네이티브 패키지 게이트입니다. `source=npm`, `source=ref`, `source=url`, 또는 `source=artifact`에서 후보 패키지 하나를 해석해 `package-under-test`로 업로드한 다음, 선택된 ref를 다시 패키징하는 대신 정확히 그 tarball을 대상으로 재사용 가능한 Docker E2E 레인을 실행합니다. 프로필은 범위가 좁은 순서부터 `smoke`, `package`, `product`, `full`로 정렬됩니다. 패키지/업데이트/Plugin 계약, published-upgrade survivor 매트릭스, 릴리스 기본값, 실패 트리아지는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.
- 빌드 및 릴리스 확인은 tsdown 이후 `scripts/check-cli-bootstrap-imports.mjs`를 실행합니다. 이 가드는 `dist/entry.js`와 `dist/cli/run-main.js`에서 정적 빌드 그래프를 따라가며, 명령 디스패치 전에 pre-dispatch 시작 경로가 Commander, 프롬프트 UI, undici, 로깅 같은 패키지 의존성을 가져오면 실패합니다. 또한 번들된 Gateway 실행 청크를 예산 이내로 유지하고, 알려진 콜드 Gateway 경로의 정적 import를 거부합니다. 패키징된 CLI 스모크는 root help, onboard help, doctor help, status, config schema, model-list 명령도 포함합니다.
- Package Acceptance 레거시 호환성은 `2026.4.25`(`2026.4.25-beta.*` 포함)까지로 제한됩니다. 해당 기준까지 하니스는 출시된 패키지 메타데이터 공백만 허용합니다. 여기에는 생략된 비공개 QA 인벤터리 항목, 누락된 `gateway install --wrapper`, tarball에서 파생된 git fixture의 누락된 패치 파일, 누락된 영속 `update.channel`, 레거시 Plugin 설치 기록 위치, 누락된 marketplace 설치 기록 영속화, `plugins update` 중 config 메타데이터 마이그레이션이 포함됩니다. `2026.4.25` 이후 패키지에서는 이러한 경로가 엄격한 실패입니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 통합 경로를 검증합니다.

라이브 모델 Docker 러너는 필요한 CLI 인증 홈만(또는 실행 범위가 좁혀지지 않은 경우 지원되는 모든 홈) bind mount한 다음, 실행 전에 컨테이너 홈으로 복사합니다. 이를 통해 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 갱신할 수 있습니다.

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인딩 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 포함하며, `pnpm test:docker:live-acp-bind:droid` 및 `pnpm test:docker:live-acp-bind:opencode`를 통한 엄격한 Droid/OpenCode 커버리지를 포함)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex 앱 서버 하니스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 개발 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 관측 가능성 스모크: `pnpm qa:otel:smoke`는 비공개 QA 소스 체크아웃 레인입니다. npm 타볼에는 QA Lab이 포함되지 않기 때문에 의도적으로 패키지 Docker 릴리스 레인에 포함되지 않습니다.
- Open WebUI 라이브 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm 타볼 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패키징된 OpenClaw 타볼을 Docker에 전역 설치하고, env-ref 온보딩과 기본 Telegram을 통해 OpenAI를 구성한 다음, doctor를 실행하고 모의 OpenAI 에이전트 턴 하나를 실행합니다. 사전 빌드된 타볼은 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 재사용하고, `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`으로 호스트 재빌드를 건너뛰거나, `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 또는 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`으로 채널을 전환합니다.
- Skill 설치 스모크: `pnpm test:docker:skill-install`는 패키징된 OpenClaw 타볼을 Docker에 전역 설치하고, 구성에서 업로드된 아카이브 설치를 비활성화하고, 검색에서 현재 라이브 ClawHub Skill 슬러그를 해석하고, `openclaw skills install`로 설치한 뒤 설치된 Skill과 `.clawhub` 원본/잠금 메타데이터를 검증합니다.
- 업데이트 채널 전환 스모크: `pnpm test:docker:update-channel-switch`는 패키징된 OpenClaw 타볼을 Docker에 전역 설치하고, 패키지 `stable`에서 git `dev`로 전환하고, 지속 저장된 채널과 Plugin 업데이트 후 작업을 검증한 다음, 다시 패키지 `stable`로 전환하고 업데이트 상태를 확인합니다.
- 업그레이드 생존자 스모크: `pnpm test:docker:upgrade-survivor`는 에이전트, 채널 구성, Plugin 허용 목록, 오래된 Plugin 의존성 상태, 기존 작업공간/세션 파일이 있는 더러운 기존 사용자 픽스처 위에 패키징된 OpenClaw 타볼을 설치합니다. 라이브 제공자 또는 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, loopback Gateway를 시작하고 시작/상태 예산과 함께 구성/상태 보존을 확인합니다.
- 게시된 업그레이드 생존자 스모크: `pnpm test:docker:published-upgrade-survivor`는 기본적으로 `openclaw@latest`를 설치하고, 현실적인 기존 사용자 파일을 시드하고, 내장된 명령 레시피로 해당 기준선을 구성하고, 결과 구성을 검증하고, 게시된 설치를 후보 타볼로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 작성한 다음, loopback Gateway를 시작하고 구성된 의도, 상태 보존, 시작, `/healthz`, `/readyz`, RPC 상태 예산을 확인합니다. 하나의 기준선은 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`으로 재정의하고, 집계 스케줄러에 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` 같은 정확한 로컬 기준선을 확장하도록 요청하며, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`로 `reported-issues` 같은 이슈 형태 픽스처를 확장합니다. reported-issues 세트에는 자동 외부 OpenClaw Plugin 설치 복구를 위한 `configured-plugin-installs`가 포함됩니다. Package Acceptance는 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출하고, `last-stable-4` 또는 `all-since-2026.4.23` 같은 메타 기준선 토큰을 해석하며, Full Release Validation은 릴리스 soak 패키지 게이트를 `last-stable-4 2026.4.23 2026.5.2 2026.4.15`와 `reported-issues`로 확장합니다.
- 세션 런타임 컨텍스트 스모크: `pnpm test:docker:session-runtime-context`는 숨겨진 런타임 컨텍스트 transcript 지속성과 영향을 받는 중복 prompt-rewrite 브랜치의 doctor 복구를 검증합니다.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패키징하고, 격리된 홈에서 `bun install -g`로 설치하며, `openclaw infer image providers --json`이 멈추지 않고 번들 이미지 제공자를 반환하는지 검증합니다. 사전 빌드된 타볼은 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 재사용하고, `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`으로 호스트 빌드를 건너뛰거나, `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`로 빌드된 Docker 이미지에서 `dist/`를 복사합니다.
- 설치 관리자 Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 root, update, direct-npm 컨테이너 전체에서 하나의 npm 캐시를 공유합니다. 업데이트 스모크는 후보 타볼로 업그레이드하기 전에 npm `latest`를 안정 기준선으로 기본 사용합니다. 로컬에서는 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`로, GitHub에서는 Install Smoke 워크플로의 `update_baseline_version` 입력으로 재정의합니다. 비 root 설치 관리자 검사는 격리된 npm 캐시를 유지하므로 root 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않습니다. 로컬 재실행 간 root/update/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정합니다.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요할 때는 해당 env 없이 스크립트를 로컬에서 실행하세요.
- 에이전트 공유 작업공간 삭제 CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에 하나의 작업공간을 가진 두 에이전트를 시드하고, `agents delete --json`을 실행하며, 유효한 JSON과 작업공간 유지 동작을 검증합니다. `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`로 install-smoke 이미지를 재사용합니다.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- 브라우저 CDP 스냅샷 스모크: `pnpm test:docker:browser-cdp-snapshot` (스크립트: `scripts/e2e/browser-cdp-snapshot-docker.sh`)는 소스 E2E 이미지와 Chromium 레이어를 빌드하고, 원시 CDP로 Chromium을 시작하고, `browser doctor --deep`을 실행하며, CDP 역할 스냅샷이 링크 URL, 커서로 승격된 클릭 가능 요소, iframe 참조, 프레임 메타데이터를 포함하는지 검증합니다.
- OpenAI Responses web_search 최소 reasoning 회귀: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 모의 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음, 제공자 스키마 거부를 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 내장 Pi 프로필 허용/거부 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/하위 에이전트 MCP 정리(실제 Gateway + 격리된 cron 및 일회성 하위 에이전트 실행 후 stdio MCP 자식 프로세스 해제): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin(로컬 경로, `file:`, hoisted 의존성이 있는 npm 레지스트리, git 이동 참조, ClawHub kitchen-sink, 마켓플레이스 업데이트, Claude-bundle 활성화/검사에 대한 설치/업데이트 스모크): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
  ClawHub 블록을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하거나, 기본 kitchen-sink 패키지/런타임 쌍을 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 및 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`로 재정의합니다. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`이 없으면 테스트는 hermetic 로컬 ClawHub 픽스처 서버를 사용합니다.
- Plugin 업데이트 변경 없음 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin 수명 주기 매트릭스 스모크: `pnpm test:docker:plugin-lifecycle-matrix`는 패키징된 OpenClaw 타볼을 빈 컨테이너에 설치하고, npm Plugin을 설치하고, 활성화/비활성화를 전환하고, 로컬 npm 레지스트리를 통해 업그레이드 및 다운그레이드하고, 설치된 코드를 삭제한 다음, 각 수명 주기 단계의 RSS/CPU 메트릭을 기록하면서 제거가 여전히 오래된 상태를 제거하는지 검증합니다.
- 구성 다시 로드 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins`는 로컬 경로, `file:`, hoisted 의존성이 있는 npm 레지스트리, git 이동 참조, ClawHub 픽스처, 마켓플레이스 업데이트, Claude-bundle 활성화/검사에 대한 설치/업데이트 스모크를 포함합니다. `pnpm test:docker:plugin-update`는 설치된 Plugin의 변경 없는 업데이트 동작을 포함합니다. `pnpm test:docker:plugin-lifecycle-matrix`는 리소스 추적 npm Plugin 설치, 활성화, 비활성화, 업그레이드, 다운그레이드, 누락 코드 제거를 포함합니다.

공유 기능 이미지를 수동으로 사전 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 제품군별 이미지 재정의는 설정된 경우 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키면, 스크립트는 이미지가 아직 로컬에 없을 때 이를 pull합니다. QR 및 설치 관리자 Docker 테스트는 공유 빌드 앱 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

라이브 모델 Docker 러너는 현재 체크아웃을 읽기 전용으로 바인드 마운트하고
컨테이너 내부의 임시 workdir에 스테이징합니다. 이렇게 하면 런타임
이미지를 작게 유지하면서도 정확한 로컬 소스/설정에 대해 Vitest를 실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 앱 로컬 `.build` 또는
Gradle 출력 디렉터리처럼 큰 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로 Docker 라이브 실행이
머신별 산출물을 복사하는 데 몇 분씩 쓰지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하여 Gateway 라이브 프로브가
컨테이너 내부에서 실제 Telegram/Discord 등 채널 워커를 시작하지 않도록 합니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로, 해당 Docker lane에서
Gateway 라이브 커버리지를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도
전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 smoke입니다. OpenAI 호환 HTTP 엔드포인트가
활성화된 OpenClaw Gateway 컨테이너를 시작하고, 해당 Gateway를 대상으로 고정된 Open WebUI
컨테이너를 시작한 뒤, Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를
노출하는지 확인한 다음, Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을
보냅니다.
라이브 모델 완료를 기다리지 않고 Open WebUI 로그인과 모델 검색 후 중지해야 하는 릴리스 경로
CI 검사에는 `OPENWEBUI_SMOKE_MODE=models`를 설정하세요.
첫 실행은 Docker가 Open WebUI 이미지를 가져와야 할 수 있고 Open WebUI 자체의 콜드 스타트
설정을 끝내야 할 수 있어 눈에 띄게 느릴 수 있습니다.
이 lane은 사용 가능한 라이브 모델 키를 기대하며, Docker화된 실행에서 이를 제공하는 기본 방법은
`OPENCLAW_PROFILE_FILE`(기본값: `~/.profile`)입니다.
성공한 실행은 `{ "ok": true, "model":
"openclaw/default", ... }` 같은 작은 JSON 페이로드를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord 또는 iMessage
계정이 필요하지 않습니다. 시드된 Gateway 컨테이너를 부팅하고, `openclaw mcp serve`를 생성하는
두 번째 컨테이너를 시작한 다음, 실제 stdio MCP 브리지 위에서 라우팅된 대화 검색, transcript 읽기,
attachment metadata, 라이브 이벤트 큐 동작, 아웃바운드 전송 라우팅, Claude 스타일 채널 +
permission 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을 직접 검사하므로, smoke는 특정
클라이언트 SDK가 우연히 표면화하는 내용이 아니라 브리지가 실제로 내보내는 내용을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 라이브 모델 키가 필요하지 않습니다. repo Docker
이미지를 빌드하고, 컨테이너 내부에서 실제 stdio MCP 프로브 서버를 시작하며, embedded Pi bundle
MCP 런타임을 통해 해당 서버를 materialize하고, 도구를 실행한 다음, `coding`과 `messaging`은
`bundle-mcp` 도구를 유지하는 반면 `minimal`과 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지
확인합니다.
`test:docker:cron-mcp-cleanup`은 결정적이며 라이브 모델 키가 필요하지 않습니다. 실제 stdio MCP
프로브 서버가 있는 시드된 Gateway를 시작하고, 격리된 Cron turn과 `/subagents spawn` 일회성
하위 turn을 실행한 다음, 각 실행 후 MCP 하위 프로세스가 종료되는지 확인합니다.

수동 ACP 일반 언어 스레드 smoke(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 이 스크립트는 회귀/디버그 워크플로를 위해 유지하세요. ACP 스레드 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env vars:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)는 `/home/node/.openclaw`에 마운트됩니다
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)는 `/home/node/.openclaw/workspace`에 마운트됩니다
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`)는 `/home/node/.profile`에 마운트되고 테스트 실행 전에 source됩니다
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 임시 설정/workspace 디렉터리를 사용하고 외부 CLI auth 마운트 없이 `OPENCLAW_PROFILE_FILE`에서 source된 env vars만 검증합니다
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`)는 Docker 내부의 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트됩니다
- `$HOME` 아래의 외부 CLI auth dirs/files는 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음, 테스트 시작 전에 `/home/node/...`로 복사됩니다
  - 기본 dirs: `.minimax`
  - 기본 files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 좁혀진 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 dirs/files만 마운트합니다
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록으로 수동 재정의하세요
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`로 실행 범위를 좁힙니다
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`로 컨테이너 내부 provider를 필터링합니다
- 재빌드가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용하려면 `OPENCLAW_SKIP_DOCKER_BUILD=1`을 사용하세요
- 자격 증명이 env가 아니라 profile store에서 오는지 보장하려면 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`을 사용하세요
- Open WebUI smoke를 위해 Gateway가 노출하는 모델을 선택하려면 `OPENCLAW_OPENWEBUI_MODEL=...`을 사용하세요
- Open WebUI smoke에서 사용하는 nonce-check 프롬프트를 재정의하려면 `OPENCLAW_OPENWEBUI_PROMPT=...`를 사용하세요
- 고정된 Open WebUI 이미지 태그를 재정의하려면 `OPENWEBUI_IMAGE=...`를 사용하세요

## 문서 무결성

문서 수정 후 문서 검사를 실행하세요: `pnpm check:docs`.
페이지 내부 heading 검사까지 필요하면 전체 Mintlify 앵커 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

다음은 실제 provider 없는 "실제 파이프라인" 회귀입니다.

- Gateway 도구 호출(mock OpenAI, 실제 gateway + agent loop): `src/gateway/gateway.test.ts`(케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard(WS `wizard.start`/`wizard.next`, config 작성 + auth 강제): `src/gateway/gateway.test.ts`(케이스: "runs wizard over ws and writes auth token config")

## 에이전트 안정성 evals(skills)

이미 "agent reliability evals"처럼 동작하는 CI 안전 테스트가 몇 개 있습니다.

- 실제 gateway + agent loop를 통한 mock 도구 호출(`src/gateway/gateway.test.ts`).
- session wiring과 config 효과를 검증하는 end-to-end wizard 흐름(`src/gateway/gateway.test.ts`).

skills에 아직 빠진 항목([Skills](/ko/tools/skills) 참조):

- **의사 결정:** prompt에 skills가 나열되어 있을 때 agent가 올바른 skill을 선택하는가(또는 관련 없는 skill을 피하는가)?
- **준수:** agent가 사용 전에 `SKILL.md`를 읽고 필수 단계/인수를 따르는가?
- **Workflow contracts:** 도구 순서, session history carryover, sandbox boundaries를 assert하는 멀티턴 시나리오.

향후 evals는 먼저 결정적으로 유지해야 합니다.

- mock provider를 사용해 도구 호출 + 순서, skill 파일 읽기, session wiring을 assert하는 scenario runner.
- skill 중심 시나리오의 작은 suite(사용 vs 회피, gating, prompt injection).
- CI 안전 suite가 마련된 뒤에만 선택적 live evals(opt-in, env-gated).

## Contract tests(Plugin 및 채널 shape)

Contract tests는 등록된 모든 Plugin과 채널이 해당 인터페이스 contract를 준수하는지 검증합니다. 발견된 모든 Plugin을 반복하고 shape 및 behavior assertion suite를 실행합니다. 기본 `pnpm test` unit lane은 이러한 shared seam 및 smoke 파일을 의도적으로 건너뜁니다. 공유 채널 또는 provider surface를 만질 때는 contract commands를 명시적으로 실행하세요.

### Commands

- 모든 contracts: `pnpm test:contracts`
- Channel contracts만: `pnpm test:contracts:channels`
- Provider contracts만: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts`에 위치:

- **plugin** - 기본 Plugin shape(id, name, capabilities)
- **setup** - 설정 wizard contract
- **session-binding** - session binding 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - inbound message 처리
- **actions** - 채널 action handlers
- **threading** - thread ID 처리
- **directory** - directory/roster API
- **group-policy** - group policy enforcement

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts`에 위치.

- **status** - 채널 status probes
- **registry** - Plugin registry shape

### Provider contracts

`src/plugins/contracts/*.contract.test.ts`에 위치:

- **auth** - auth flow contract
- **auth-choice** - auth choice/selection
- **catalog** - 모델 catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - provider runtime
- **shape** - Plugin shape/interface
- **wizard** - 설정 wizard

### 실행 시점

- plugin-sdk exports 또는 subpaths 변경 후
- 채널 또는 provider Plugin 추가/수정 후
- Plugin registration 또는 discovery 리팩터링 후

Contract tests는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가(가이드)

라이브에서 발견한 provider/모델 문제를 수정할 때:

- 가능하면 CI 안전 회귀를 추가하세요(mock/stub provider 또는 정확한 request-shape transformation 캡처)
- 본질적으로 live-only인 경우(rate limits, auth policies), live test를 좁게 유지하고 env vars를 통한 opt-in으로 두세요
- 버그를 잡는 가장 작은 레이어를 대상으로 삼는 것을 선호하세요:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 또는 CI 안전 gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 registry metadata(`listSecretTargetRegistryEntries()`)에서 SecretRef class마다 샘플링된 target 하나를 도출한 다음 traversal-segment exec ids가 거부되는지 assert합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef target family를 추가하는 경우, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 target ids에서 의도적으로 실패하므로 새 class가 조용히 건너뛰어질 수 없습니다.

## 관련

- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 plugins 테스트](/ko/help/testing-updates-plugins)
- [CI](/ko/ci)
