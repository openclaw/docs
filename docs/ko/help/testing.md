---
read_when:
    - 로컬 또는 CI에서 테스트 실행하기
    - 모델/제공자 버그에 대한 회귀 테스트 추가
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: 단위/e2e/라이브 테스트 제품군, Docker 실행기, 각 테스트가 다루는 범위'
title: 테스트
x-i18n:
    generated_at: "2026-05-01T06:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

OpenClaw에는 세 가지 Vitest 스위트(unit/integration, e2e, live)와 소수의 Docker 러너가 있습니다. 이 문서는 "테스트 방식" 가이드입니다.

- 각 스위트가 다루는 범위와 의도적으로 다루지 _않는_ 범위.
- 일반적인 워크플로(local, pre-push, debugging)에서 실행할 명령.
- live 테스트가 자격 증명을 찾고 모델/프로바이더를 선택하는 방식.
- 실제 모델/프로바이더 문제에 대한 회귀 테스트를 추가하는 방식.

<Note>
**QA 스택(qa-lab, qa-channel, live transport lanes)**은 별도로 문서화되어 있습니다.

- [QA 개요](/ko/concepts/qa-e2e-automation) — 아키텍처, 명령 표면, 시나리오 작성.
- [Matrix QA](/ko/concepts/qa-matrix) — `pnpm openclaw qa matrix` 참조.
- [QA channel](/ko/channels/qa-channel) — 저장소 기반 시나리오에서 사용하는 합성 전송 Plugin.

이 페이지는 일반 테스트 스위트와 Docker/Parallels 러너 실행을 다룹니다. 아래 QA 전용 러너 섹션([QA 전용 러너](#qa-specific-runners))에는 구체적인 `qa` 호출이 나열되어 있으며 위 참조로 다시 연결됩니다.
</Note>

## 빠른 시작

대부분의 경우:

- 전체 게이트(push 전 예상): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 local 전체 스위트 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 직접 파일 타기팅은 이제 extension/channel 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 작업 중이라면 먼저 타기팅된 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 프로바이더/모델을 디버깅할 때(실제 자격 증명 필요):

- Live 스위트(모델 + Gateway tool/image probe): `pnpm test:live`
- 하나의 live 파일을 조용히 타기팅: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - 선택된 각 모델은 이제 텍스트 턴과 작은 파일 읽기 스타일 probe를 실행합니다.
    메타데이터가 `image` 입력을 알리는 모델은 작은 이미지 턴도 실행합니다.
    프로바이더 실패를 격리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 probe를 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동
    `OpenClaw Release Checks`는 모두 재사용 가능한 live/E2E 워크플로를
    `include_live_suites: true`로 호출하며, 여기에는 프로바이더별로 샤딩된 별도 Docker live model
    matrix 작업이 포함됩니다.
  - 집중 CI 재실행의 경우 `include_live_suites: true` 및 `live_models_only: true`로
    `OpenClaw Live And E2E Checks (Reusable)`를 dispatch하세요.
  - 새로운 고신호 프로바이더 secret은 `scripts/ci-hydrate-live-auth.sh`와
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 해당
    scheduled/release caller에 추가하세요.
- 네이티브 Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server 경로에 대해 Docker live lane을 실행하고, 합성
    Slack DM을 `/codex bind`로 바인딩하며, `/codex fast`와
    `/codex permissions`를 실행한 뒤, 일반 답장과 이미지 첨부가
    ACP 대신 네이티브 Plugin 바인딩을 통해 라우팅되는지 확인합니다.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin 소유 Codex app-server harness를 통해 Gateway agent 턴을 실행하고,
    `/codex status`와 `/codex models`를 검증하며, 기본적으로 image,
    cron MCP, sub-agent, Guardian probe를 실행합니다. 다른 Codex
    app-server 실패를 격리할 때는 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`으로
    sub-agent probe를 비활성화하세요. 집중 sub-agent 검사를 위해서는 다른 probe를 비활성화하세요:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`이 설정되어 있지 않으면
    sub-agent probe 후 종료됩니다.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command 표면을 위한 opt-in 이중 안전 검사입니다.
    `/crestodian status`를 실행하고, 영구 모델 변경을 큐에 넣고,
    `/crestodian yes`에 응답하며, audit/config 쓰기 경로를 검증합니다.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH`에 가짜 Claude CLI가 있는 config 없는 컨테이너에서 Crestodian을 실행하고,
    fuzzy planner fallback이 감사되는 typed config 쓰기로 변환되는지 검증합니다.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw state dir에서 시작해 bare `openclaw`를
    Crestodian으로 라우팅하고, setup/model/agent/Discord Plugin + SecretRef 쓰기를 적용하며,
    config를 검증하고 audit 항목을 확인합니다. 동일한 Ring 0 setup 경로는
    QA Lab에서도
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`로 다룹니다.
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY`가 설정된 상태에서
  `openclaw models list --provider moonshot --json`을 실행한 다음, 격리된
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`을
  `moonshot/kimi-k2.6`에 대해 실행하세요. JSON이 Moonshot/K2.6을 보고하고
  assistant transcript가 정규화된 `usage.cost`를 저장하는지 검증하세요.

<Tip>
실패 사례 하나만 필요할 때는 아래에 설명된 allowlist env var로 live 테스트를 좁히는 방식을 선호하세요.
</Tip>

## QA 전용 러너

QA-lab 현실성이 필요할 때 이 명령들은 main 테스트 스위트 옆에 위치합니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. `Parity gate`는 일치하는 PR과
mock 프로바이더를 사용하는 수동 dispatch에서 실행됩니다. `QA-Lab - All Lanes`는
`main`에서 야간에, 그리고 수동 dispatch에서 mock parity gate, live Matrix lane,
Convex 관리 live Telegram lane, Convex 관리 live Discord lane을
병렬 작업으로 실행합니다. Scheduled QA와 release checks는 Matrix `--profile fast`를
명시적으로 전달하는 반면, Matrix CLI와 수동 워크플로 입력 기본값은
`all`로 유지됩니다. 수동 dispatch는 `all`을 `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, `e2ee-cli` 작업으로 샤딩할 수 있습니다. `OpenClaw Release Checks`는 release approval 전에
parity와 fast Matrix 및 Telegram lane을 실행하며,
release transport check가 결정적으로 유지되고 일반 provider-plugin 시작을 피하도록
`mock-openai/gpt-5.5`를 사용합니다. 이러한 live transport gateway는
memory search를 비활성화합니다. memory 동작은 QA parity suite에서 계속 다룹니다.

전체 release live media shard는
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`를 사용하며, 여기에는 이미
`ffmpeg`와 `ffprobe`가 포함되어 있습니다. Docker live model/backend shard는 선택된
commit당 한 번 빌드되는 공유
`ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용한 다음, 각 shard 안에서 다시 빌드하는 대신
`OPENCLAW_SKIP_DOCKER_BUILD=1`로 pull합니다.

- `pnpm openclaw qa suite`
  - 저장소 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 격리된 Gateway worker로 선택된 여러 시나리오를 기본적으로 병렬 실행합니다.
    `qa-channel`의 기본 concurrency는 4입니다(선택된 시나리오 수로 제한).
    worker 수를 조정하려면 `--concurrency <count>`를 사용하고,
    이전 serial lane을 사용하려면 `--concurrency 1`을 사용하세요.
  - 시나리오 하나라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이
    artifact를 원할 때는 `--allow-failures`를 사용하세요.
  - 프로바이더 모드 `live-frontier`, `mock-openai`, `aimock`을 지원합니다.
    `aimock`은 시나리오 인식
    `mock-openai` lane을 대체하지 않고, 실험적 fixture 및 protocol-mock 커버리지를 위한
    local AIMock 기반 프로바이더 서버를 시작합니다.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway startup bench와 작은 mock QA Lab 시나리오 팩
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`)을 실행하고, 결합된 CPU 관찰
    요약을 `.artifacts/gateway-cpu-scenarios/` 아래에 씁니다.
  - 기본적으로 지속적인 hot CPU 관찰만 flag합니다(`--cpu-core-warn`
    및 `--hot-wall-warn-ms`). 따라서 짧은 startup burst는 몇 분 동안 지속되는 gateway peg regression처럼 보이지 않고
    metric으로 기록됩니다.
  - 빌드된 `dist` artifact를 사용합니다. checkout에 최신 runtime output이
    아직 없으면 먼저 build를 실행하세요.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 안에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 프로바이더/모델 선택 flag를 재사용합니다.
  - Live 실행은 guest에 실용적인 지원 QA auth 입력을 전달합니다:
    env 기반 프로바이더 키, QA live provider config 경로, 그리고 존재할 경우 `CODEX_HOME`.
  - output dir은 guest가 마운트된 workspace를 통해 다시 쓸 수 있도록 repo root 아래에 있어야 합니다.
  - 일반 QA report + summary와 Multipass log를
    `.artifacts/qa-e2e/...` 아래에 씁니다.
- `pnpm qa:lab:up`
  - operator-style QA 작업을 위한 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 checkout에서 npm tarball을 빌드하고, Docker에 전역 설치한 뒤,
    비대화형 OpenAI API-key onboarding을 실행하고, 기본적으로 Telegram을
    구성하며, Plugin 활성화가 runtime dependency를 필요 시 설치하는지 확인하고,
    doctor를 실행한 다음 mocked OpenAI endpoint에 대해 local agent turn 하나를 실행합니다.
  - Discord로 동일한 packaged-install lane을 실행하려면
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용하세요.
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcript를 위한 결정적 built-app Docker smoke를 실행합니다.
    숨겨진 OpenClaw runtime context가 보이는 user turn으로 누출되지 않고
    non-display custom message로 유지되는지 확인한 다음,
    영향을 받는 broken session JSONL을 seed하고
    `openclaw doctor --fix`가 backup과 함께 active branch로 다시 쓰는지 검증합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 OpenClaw package candidate를 설치하고, installed-package
    onboarding을 실행하며, 설치된 CLI를 통해 Telegram을 구성한 다음,
    해당 설치 package를 SUT Gateway로 사용해 live Telegram QA lane을 재사용합니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다. registry에서
    설치하는 대신 해석된 local tarball을 테스트하려면
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 또는
    `OPENCLAW_CURRENT_PACKAGE_TGZ`를 설정하세요.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env credential 또는 Convex credential source를 사용합니다.
    CI/release 자동화의 경우
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와
    `OPENCLAW_QA_CONVEX_SITE_URL` 및 role secret을 설정하세요. CI에
    `OPENCLAW_QA_CONVEX_SITE_URL`와 Convex role secret이 있으면,
    Docker wrapper가 Convex를 자동으로 선택합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 lane에만 공유
    `OPENCLAW_QA_CREDENTIAL_ROLE`을 override합니다.
  - GitHub Actions는 이 lane을 수동 maintainer 워크플로
    `NPM Telegram Beta E2E`로 노출합니다. merge 시 실행되지 않습니다. 이 워크플로는
    `qa-live-shared` environment와 Convex CI credential lease를 사용합니다.
- GitHub Actions는 side-run product proof를 위한 `Package Acceptance`도
  하나의 candidate package에 대해 노출합니다. trusted ref, published npm spec,
  SHA-256이 있는 HTTPS tarball URL, 또는 다른 run의 tarball artifact를 받을 수 있으며,
  정규화된 `openclaw-current.tgz`를 `package-under-test`로 업로드한 다음,
  smoke, package, product, full, custom
  lane profile로 기존 Docker E2E scheduler를 실행합니다. 동일한 `package-under-test` artifact에 대해
  Telegram QA 워크플로를 실행하려면 `telegram_mode=mock-openai` 또는 `live-frontier`를 설정하세요.
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

- 아티팩트 증명은 다른 Actions 실행에서 tarball 아티팩트를 다운로드합니다.

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 현재 OpenClaw 빌드를 Docker에서 패키징하고 설치한 뒤, OpenAI가 설정된 Gateway를 시작하고, config 편집을 통해 번들 채널/Plugin을 활성화합니다.
  - 설정 탐지가 구성되지 않은 Plugin 런타임 의존성을 남기지 않는지, 처음 구성된 Gateway 또는 doctor 실행이 각 번들 Plugin의 런타임 의존성을 필요할 때 설치하는지, 두 번째 재시작에서는 이미 활성화된 의존성을 다시 설치하지 않는지 검증합니다.
  - 또한 알려진 이전 npm 기준선을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화한 뒤, 후보 버전의 업데이트 후 doctor가 하네스 측 postinstall 복구 없이 번들 채널 런타임 의존성을 복구하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels 게스트 전반에서 네이티브 패키지 설치 업데이트 smoke를 실행합니다. 선택된 각 플랫폼은 먼저 요청된 기준선 패키지를 설치한 뒤, 같은 게스트에서 설치된 `openclaw update` 명령을 실행하고 설치된 버전, 업데이트 상태, Gateway 준비 상태, 로컬 에이전트 턴 하나를 검증합니다.
  - 한 게스트에서 반복 작업할 때는 `--platform macos`, `--platform windows`, 또는 `--platform linux`를 사용하세요. 요약 아티팩트 경로와 lane별 상태에는 `--json`을 사용하세요.
  - OpenAI lane은 기본적으로 라이브 에이전트 턴 증명에 `openai/gpt-5.5`를 사용합니다. 다른 OpenAI 모델을 의도적으로 검증할 때는 `--model <provider/model>`을 전달하거나 `OPENCLAW_PARALLELS_OPENAI_MODEL`을 설정하세요.
  - Parallels 전송 지연이 남은 테스트 시간을 소모하지 않도록 긴 로컬 실행은 호스트 timeout으로 감싸세요.

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 중첩 lane 로그를 `/tmp/openclaw-parallels-npm-update.*` 아래에 씁니다. 외부 래퍼가 멈췄다고 가정하기 전에 `windows-update.log`, `macos-update.log`, 또는 `linux-update.log`를 확인하세요.
  - Windows 업데이트는 콜드 게스트에서 업데이트 후 doctor/런타임 의존성 복구에 10~15분이 걸릴 수 있습니다. 중첩 npm debug 로그가 진행 중이라면 여전히 정상입니다.
  - 이 집계 래퍼를 개별 Parallels macOS, Windows, 또는 Linux smoke lane과 병렬로 실행하지 마세요. 이들은 VM 상태를 공유하며 스냅샷 복원, 패키지 제공, 또는 게스트 Gateway 상태에서 충돌할 수 있습니다.
  - 업데이트 후 증명은 일반 번들 Plugin 표면을 실행합니다. 에이전트 턴 자체가 단순 텍스트 응답만 확인하더라도 speech, 이미지 생성, 미디어 이해 같은 capability facade는 번들 런타임 API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 smoke 테스트를 위해 로컬 AIMock provider 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix 라이브 QA lane을 실행합니다. 소스 체크아웃 전용입니다. 패키지 설치에는 `qa-lab`이 포함되지 않습니다.
  - 전체 CLI, profile/scenario 카탈로그, env var, 아티팩트 레이아웃: [Matrix QA](/ko/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT bot token을 사용해 실제 비공개 그룹을 대상으로 Telegram 라이브 QA lane을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. 그룹 id는 숫자 Telegram chat id여야 합니다.
  - 공유 pooled credentials에는 `--credential-source convex`를 지원합니다. 기본적으로 env 모드를 사용하거나, pooled lease를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요.
  - scenario가 하나라도 실패하면 0이 아닌 값으로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용하세요.
  - 같은 비공개 그룹에 서로 다른 bot 두 개가 필요하며, SUT bot은 Telegram username을 노출해야 합니다.
  - 안정적인 bot 간 관찰을 위해 두 bot 모두 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화하고 driver bot이 그룹 bot 트래픽을 관찰할 수 있는지 확인하세요.
  - Telegram QA report, summary, observed-messages 아티팩트를 `.artifacts/qa-e2e/...` 아래에 씁니다. reply scenario에는 driver send request부터 관찰된 SUT reply까지의 RTT가 포함됩니다.

라이브 전송 lane은 새 전송이 어긋나지 않도록 하나의 표준 계약을 공유합니다. lane별 커버리지 매트릭스는 [QA 개요 → 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 있습니다. `qa-channel`은 광범위한 합성 suite이며 해당 매트릭스의 일부가 아닙니다.

### Convex를 통한 공유 Telegram credentials(v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면 QA lab은 Convex 기반 pool에서 독점 lease를 획득하고, lane이 실행되는 동안 해당 lease에 Heartbeat를 보내며, 종료 시 lease를 해제합니다.

참조 Convex 프로젝트 scaffold:

- `qa/convex-credential-broker/`

필수 env var:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택된 역할에 대한 secret 하나:
  - `maintainer`용 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`용 `OPENCLAW_QA_CONVEX_SECRET_CI`
- credential 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - Env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본값 `ci`, 그 외에는 `maintainer`)

선택적 env var:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

일반 작업에서는 `OPENCLAW_QA_CONVEX_SITE_URL`이 `https://`를 사용해야 합니다.

Maintainer admin 명령(pool add/remove/list)에는 특히 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

maintainer용 CLI helper:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용하여 secret 값을 출력하지 않고 Convex site URL, broker secret, endpoint prefix, HTTP timeout, admin/list 도달 가능성을 확인하세요. 스크립트와 CI 유틸리티에서 기계가 읽을 수 있는 출력에는 `--json`을 사용하세요.

기본 endpoint 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - 요청: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 성공: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 소진됨/재시도 가능: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /release`
  - 요청: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 성공: `{ status: "ok" }`(또는 빈 `2xx`)
- `POST /admin/add`(maintainer secret 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(maintainer secret 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(maintainer secret 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram kind의 payload shape:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자 Telegram chat id 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 shape을 검증하고 잘못된 payload를 거부합니다.

### QA에 채널 추가

새 채널 adapter의 architecture 및 scenario helper 이름은 [QA 개요 → 채널 추가](/ko/concepts/qa-e2e-automation#adding-a-channel)에 있습니다. 최소 기준: 공유 `qa-lab` host seam에서 transport runner를 구현하고, Plugin manifest에 `qaRunners`를 선언하고, `openclaw qa <runner>`로 mount하며, `qa/scenarios/` 아래에 scenario를 작성합니다.

## 테스트 suite(어디서 무엇이 실행되는지)

suite를 “현실성 증가”(그리고 flaky/비용 증가)로 생각하세요.

### Unit / integration(기본값)

- 명령: `pnpm test`
- Config: 대상이 지정되지 않은 실행은 `vitest.full-*.config.ts` shard set을 사용하며, 병렬 scheduling을 위해 multi-project shard를 project별 config로 확장할 수 있습니다.
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 core/unit inventory. UI unit test는 전용 `unit-ui` shard에서 실행됩니다.
- 범위:
  - 순수 unit test
  - In-process integration test(Gateway auth, routing, tooling, parsing, config)
  - 알려진 bug에 대한 deterministic regression
- 기대사항:
  - CI에서 실행됩니다.
  - 실제 key가 필요하지 않습니다.
  - 빠르고 안정적이어야 합니다.
  - Resolver 및 public-surface loader test는 실제 번들 Plugin 소스 API가 아니라 생성된 작은 Plugin fixture로 넓은 `api.js` 및 `runtime-api.js` fallback 동작을 증명해야 합니다. 실제 Plugin API load는 Plugin 소유 contract/integration suite에 속합니다.

<AccordionGroup>
  <Accordion title="Project, shard, scoped lane">

    - 대상 지정 없는 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 구성(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 걸린 머신에서 최대 RSS를 줄이고 auto-reply/확장 작업이 관련 없는 스위트를 굶주리게 하는 일을 피할 수 있습니다.
    - `pnpm test --watch`는 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다. 다중 샤드 watch 루프는 실용적이지 않기 때문입니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적 파일/디렉터리 대상을 먼저 범위 지정된 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
    - `pnpm test:changed`는 변경된 git 경로를 기본적으로 저렴한 범위 지정 레인으로 확장합니다. 직접 테스트 편집, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import 그래프 의존 항목이 여기에 포함됩니다. 구성/setup/package 편집은 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 명시적으로 사용하지 않는 한 테스트를 광범위하게 실행하지 않습니다.
    - `pnpm check:changed`는 좁은 범위 작업을 위한 일반적인 스마트 로컬 확인 게이트입니다. diff를 core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, tooling으로 분류한 뒤, 매칭되는 typecheck, lint, guard 명령을 실행합니다. Vitest 테스트는 실행하지 않습니다. 테스트 증명이 필요하면 `pnpm test:changed` 또는 명시적 `pnpm test <target>`을 호출하세요. 릴리스 메타데이터만 있는 버전 범프는 대상 지정 버전/config/root-dependency 검사를 실행하며, 최상위 버전 필드 밖의 package 변경을 거부하는 guard가 있습니다.
    - Live Docker ACP 하네스 편집은 집중 검사를 실행합니다. Live Docker 인증 스크립트의 셸 문법과 Live Docker 스케줄러 dry-run입니다. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로 제한될 때만 포함됩니다. 의존성, export, 버전 및 기타 package 표면 편집은 여전히 더 넓은 guard를 사용합니다.
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import가 가벼운 단위 테스트는 `unit-fast` 레인으로 라우팅되며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태를 가지거나 런타임이 무거운 파일은 기존 레인에 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` helper 소스 파일도 changed-mode 실행을 해당 가벼운 레인의 명시적 형제 테스트로 매핑하므로, helper 편집은 그 디렉터리의 전체 무거운 스위트를 다시 실행하지 않습니다.
    - `auto-reply`에는 최상위 core helpers, 최상위 `reply.*` 통합 테스트, `src/auto-reply/reply/**` 하위 트리를 위한 전용 버킷이 있습니다. CI는 reply 하위 트리를 agent-runner, dispatch, commands/state-routing 샤드로 추가 분할하여 import가 무거운 하나의 버킷이 전체 Node 꼬리를 소유하지 않도록 합니다.
    - 일반 PR/main CI는 의도적으로 확장 배치 스윕과 릴리스 전용 `agentic-plugins` 샤드를 건너뜁니다. 전체 Release Validation은 릴리스 후보에서 plugin/확장이 많은 스위트를 위해 별도의 `Plugin Prerelease` 하위 워크플로를 dispatch합니다.

  </Accordion>

  <Accordion title="임베디드 러너 커버리지">

    - 메시지 도구 발견 입력 또는 Compaction 런타임 컨텍스트를 변경할 때는
      두 수준의 커버리지를 모두 유지하세요.
    - 순수 라우팅 및 정규화 경계에는 집중 helper 회귀 테스트를 추가하세요.
    - 임베디드 러너 통합 스위트를 정상 상태로 유지하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이 스위트들은 범위 지정 id와 compaction 동작이 실제 `run.ts` /
      `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. helper 전용 테스트는
      이러한 통합 경로를 충분히 대체할 수 없습니다.

  </Accordion>

  <Accordion title="Vitest pool 및 isolation 기본값">

    - 기본 Vitest 구성은 `threads`를 기본값으로 사용합니다.
    - 공유 Vitest 구성은 `isolate: false`를 고정하고 루트 프로젝트, e2e, live 구성 전반에서
      non-isolated runner를 사용합니다.
    - 루트 UI 레인은 자체 `jsdom` setup과 optimizer를 유지하지만,
      공유 non-isolated runner에서도 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest 구성에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 대규모 로컬 실행 중 V8 컴파일 churn을 줄이기 위해
      기본적으로 Vitest 자식 Node 프로세스에 `--no-maglev`를 추가합니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 formatting 전용입니다. 형식이 적용된 파일을 다시 stage하며
      lint, typecheck, test는 실행하지 않습니다.
    - handoff 또는 push 전에 스마트 로컬 확인 게이트가 필요할 때는
      `pnpm check:changed`를 명시적으로 실행하세요.
    - `pnpm test:changed`는 기본적으로 저렴한 범위 지정 레인을 통해 라우팅됩니다. agent가
      harness, config, package 또는 contract 편집에 더 넓은 Vitest 커버리지가
      실제로 필요하다고 판단할 때만 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.
    - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅 동작을 유지하되,
      더 높은 worker cap만 사용합니다.
    - 로컬 worker 자동 스케일링은 의도적으로 보수적이며 호스트 load average가 이미 높으면
      물러나므로, 여러 동시 Vitest 실행이 기본적으로 피해를 덜 줍니다.
    - 기본 Vitest 구성은 프로젝트/config 파일을 `forceRerunTriggers`로 표시하여
      테스트 wiring이 변경될 때 changed-mode 재실행이 올바르게 유지되도록 합니다.
    - 구성은 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성 상태로 유지합니다.
      직접 profiling을 위한 명시적 캐시 위치 하나를 원하면
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration reporting과
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 profiling view를
      `origin/main` 이후 변경된 파일로 범위 지정합니다.
    - 샤드 timing 데이터는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      전체 config 실행은 config 경로를 key로 사용합니다. include-pattern CI
      샤드는 필터링된 샤드를 별도로 추적할 수 있도록 샤드 이름을 덧붙입니다.
    - 하나의 hot test가 여전히 시작 import에 대부분의 시간을 소비한다면,
      무거운 의존성을 좁은 로컬 `*.runtime.ts` seam 뒤에 두고,
      런타임 helper를 `vi.mock(...)`에 통과시키기 위해 deep-import하지 말고
      그 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋된 diff에 대해
      라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고
      wall time과 macOS max RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을
      `scripts/test-projects.mjs`와 루트 Vitest 구성을 통해 라우팅하여 현재
      dirty tree를 benchmark합니다.
    - `pnpm test:perf:profile:main`은 Vitest/Vite 시작 및 transform overhead에 대한
      main-thread CPU profile을 기록합니다.
    - `pnpm test:perf:profile:runner`는 file parallelism을 비활성화한 unit suite에 대해
      runner CPU+heap profile을 기록합니다.

  </Accordion>
</AccordionGroup>

### 안정성(Gateway)

- 명령: `pnpm test:stability:gateway`
- 구성: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 진단이 기본적으로 활성화된 실제 루프백 Gateway를 시작합니다
  - 진단 이벤트 경로를 통해 합성 gateway message, memory, large-payload churn을 구동합니다
  - Gateway WS RPC를 통해 `diagnostics.stability`를 쿼리합니다
  - 진단 안정성 번들 영속화 helper를 다룹니다
  - recorder가 bounded 상태를 유지하고, 합성 RSS 샘플이 pressure budget 아래에 머물며, session별 queue depth가 다시 0으로 drain되는지 assert합니다
- 기대 사항:
  - CI-safe 및 keyless
  - 안정성 회귀 후속 작업을 위한 좁은 레인이며, 전체 Gateway suite의 대체물이 아닙니다

### E2E(Gateway smoke)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래 bundled-plugin E2E 테스트
- 런타임 기본값:
  - 저장소 나머지와 맞춰 Vitest `threads`를 `isolate: false`와 함께 사용합니다.
  - adaptive workers를 사용합니다(CI: 최대 2, local: 기본값 1).
  - 콘솔 I/O overhead를 줄이기 위해 기본적으로 silent mode로 실행합니다.
- 유용한 override:
  - worker 수를 강제하려면 `OPENCLAW_E2E_WORKERS=<n>`을 사용합니다(최대 16으로 제한).
  - verbose console output을 다시 활성화하려면 `OPENCLAW_E2E_VERBOSE=1`을 사용합니다.
- 범위:
  - 다중 인스턴스 gateway end-to-end 동작
  - WebSocket/HTTP 표면, node pairing, 더 무거운 networking
- 기대 사항:
  - CI에서 실행됩니다(파이프라인에서 활성화된 경우)
  - 실제 key가 필요하지 않습니다
  - unit test보다 moving parts가 많습니다(더 느릴 수 있음)

### E2E: OpenShell backend smoke

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 isolated OpenShell gateway를 시작합니다
  - 임시 로컬 Dockerfile에서 sandbox를 생성합니다
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell backend를 실행합니다
  - sandbox fs bridge를 통해 remote-canonical filesystem 동작을 검증합니다
- 기대 사항:
  - opt-in 전용입니다. 기본 `pnpm test:e2e` 실행의 일부가 아닙니다
  - 로컬 `openshell` CLI와 동작하는 Docker daemon이 필요합니다
  - isolated `HOME` / `XDG_CONFIG_HOME`을 사용한 뒤, test gateway와 sandbox를 제거합니다
- 유용한 override:
  - 더 넓은 e2e suite를 수동으로 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`을 사용합니다
  - 기본값이 아닌 CLI binary 또는 wrapper script를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`을 사용합니다

### Live(실제 provider + 실제 model)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래 bundled-plugin live 테스트
- 기본값: `pnpm test:live`에 의해 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 provider/model이 실제 creds로 _오늘_ 실제로 동작하는가?”
  - provider format 변경, tool-calling quirks, auth 문제, rate limit 동작을 포착합니다
- 기대 사항:
  - 설계상 CI-stable이 아닙니다(실제 network, 실제 provider policy, quota, outage)
  - 비용이 들거나 rate limit을 사용합니다
  - “everything” 대신 좁혀진 subset 실행을 선호하세요
- Live 실행은 누락된 API key를 가져오기 위해 `~/.profile`을 source합니다.
- 기본적으로 live 실행은 여전히 `HOME`을 isolate하고 config/auth material을 임시 test home으로 복사하므로 unit fixture가 실제 `~/.openclaw`를 변경할 수 없습니다.
- live test가 실제 home directory를 사용해야 한다고 의도적으로 필요한 경우에만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 mode를 기본값으로 사용합니다. `[live] ...` progress output은 유지하지만, 추가 `~/.profile` notice를 suppress하고 gateway bootstrap logs/Bonjour chatter를 mute합니다. 전체 startup logs를 다시 원하면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API key rotation(provider별): comma/semicolon format의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`를 설정하거나(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) `OPENCLAW_LIVE_*_KEY`를 통해 live별 override를 설정하세요. 테스트는 rate limit response에서 retry합니다.
- Progress/Heartbeat output:
  - Live suite는 이제 stderr로 progress line을 emit하므로 Vitest console capture가 조용할 때도 긴 provider call이 눈에 보이게 active 상태임을 알 수 있습니다.
  - `vitest.live.config.ts`는 Vitest console interception을 비활성화하여 live 실행 중 provider/gateway progress line이 즉시 stream되도록 합니다.
  - direct-model Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정하세요.
  - gateway/probe Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정하세요.

## 어떤 suite를 실행해야 하나요?

이 decision table을 사용하세요:

- 로직/테스트 편집: `pnpm test` 실행(많이 변경했다면 `pnpm test:coverage`도 실행)
- Gateway 네트워킹 / WS 프로토콜 / 페어링을 건드리는 경우: `pnpm test:e2e` 추가
- “내 봇이 다운됨” / 제공자별 실패 / 도구 호출 디버깅: 범위를 좁힌 `pnpm test:live` 실행

## 라이브(네트워크 접촉) 테스트

라이브 모델 매트릭스, CLI 백엔드 스모크, ACP 스모크, Codex 앱 서버
하네스, 모든 미디어 제공자 라이브 테스트(Deepgram, BytePlus, ComfyUI, 이미지,
음악, 비디오, 미디어 하네스) 및 라이브 실행을 위한 자격 증명 처리는
[Testing — live suites](/ko/help/testing-live)를 참조하세요.

## Docker 실행기(선택적 "Linux에서 작동" 검사)

이 Docker 실행기는 두 버킷으로 나뉩니다.

- 라이브 모델 실행기: `test:docker:live-models`와 `test:docker:live-gateway`는 저장소 Docker 이미지 안에서 일치하는 프로필 키 라이브 파일(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`)만 실행하며, 로컬 설정 디렉터리와 작업공간을 마운트합니다(마운트된 경우 `~/.profile`도 소싱). 일치하는 로컬 진입점은 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker 라이브 실행기는 전체 Docker 스윕을 실용적으로 유지하기 위해 기본적으로 더 작은 스모크 한도를 사용합니다.
  `test:docker:live-models`의 기본값은 `OPENCLAW_LIVE_MAX_MODELS=12`이고,
  `test:docker:live-gateway`의 기본값은 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`,
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`입니다. 더 큰 전체 스캔을
  명시적으로 원할 때는 해당 env var를 재정의하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 라이브 Docker 이미지를 한 번 빌드하고, `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 npm tarball로 한 번 패키징한 다음, 두 개의 `scripts/e2e/Dockerfile` 이미지를 빌드/재사용합니다. 베어 이미지는 설치/업데이트/Plugin 의존성 레인용 Node/Git 실행기일 뿐이며, 해당 레인은 미리 빌드된 tarball을 마운트합니다. 기능 이미지는 빌드된 앱 기능 레인을 위해 같은 tarball을 `/app`에 설치합니다. Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`는 선택된 계획을 실행합니다. 집계는 가중치 기반 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`은 프로세스 슬롯을 제어하고, 리소스 한도는 무거운 라이브, npm 설치, 다중 서비스 레인이 모두 동시에 시작되지 않도록 합니다. 단일 레인이 활성 한도보다 무거운 경우에도, 풀이 비어 있으면 스케줄러가 이를 시작할 수 있으며 다시 용량을 사용할 수 있을 때까지 해당 레인만 계속 실행합니다. 기본값은 슬롯 10개, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 여유가 더 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 조정하세요. 실행기는 기본적으로 Docker 사전 점검을 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장한 뒤, 이후 실행에서 더 긴 레인을 먼저 시작하는 데 해당 타이밍을 사용합니다. 빌드하거나 Docker를 실행하지 않고 가중치 적용 레인 매니페스트를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 선택된 레인, 패키지/이미지 필요 사항, 자격 증명에 대한 CI 계획을 출력하려면 `node scripts/test-docker-all.mjs --plan-json`을 사용하세요.
- `Package Acceptance`는 "이 설치 가능한 tarball이 제품으로서 작동하는가?"를 확인하는 GitHub 네이티브 패키지 게이트입니다. `source=npm`, `source=ref`, `source=url`, `source=artifact` 중 하나에서 후보 패키지 하나를 해석하고, 이를 `package-under-test`로 업로드한 다음, 선택된 ref를 다시 패키징하는 대신 해당 정확한 tarball을 대상으로 재사용 가능한 Docker E2E 레인을 실행합니다. `workflow_ref`는 신뢰된 워크플로/하네스 스크립트를 선택하고, `package_ref`는 `source=ref`일 때 패키징할 소스 커밋/브랜치/태그를 선택합니다. 이를 통해 현재 승인 로직이 이전의 신뢰된 커밋을 검증할 수 있습니다. 프로필은 범위 순으로 정렬됩니다. `smoke`는 빠른 설치/채널/에이전트와 Gateway/설정이고, `package`는 패키지/업데이트/Plugin 계약과 키 없는 업그레이드 생존자 픽스처, 게시된 기준 업그레이드 생존자 레인, 대부분의 Parallels 패키지/업데이트 커버리지에 대한 기본 네이티브 대체를 포함하며, `product`는 MCP 채널, cron/하위 에이전트 정리, OpenAI 웹 검색, OpenWebUI를 추가하고, `full`은 OpenWebUI와 함께 릴리스 경로 Docker 청크를 실행합니다. `published-upgrade-survivor`의 경우 Package Acceptance는 항상 후보로 `package-under-test`를 사용하고 게시된 기준으로 `published_upgrade_survivor_baseline`을 사용하며, 기본값은 `openclaw@latest`입니다. 정확한 기준값으로 여러 실행을 디스패치하여 더 넓은 커버리지를 샤딩하세요. 게시된 레인은 내장된 `openclaw config set` 명령 레시피로 기준을 구성한 다음, 레인 요약에 레시피 단계를 기록합니다. 릴리스 검증은 릴리스 경로 Docker 청크가 겹치는 패키지/업데이트/Plugin 레인을 이미 커버하므로, 사용자 지정 패키지 델타(`bundled-channel-deps-compat plugins-offline`)와 Telegram 패키지 QA를 실행합니다. 아티팩트에서 생성된 대상 지정 GitHub Docker 재실행 명령에는 이전 패키지 아티팩트, 준비된 이미지 입력, 사용 가능한 경우 게시된 업그레이드 생존자 기준이 포함되므로, 실패한 레인은 패키지와 이미지를 다시 빌드하지 않아도 됩니다.
- 빌드 및 릴리스 검사는 tsdown 이후 `scripts/check-cli-bootstrap-imports.mjs`를 실행합니다. 이 가드는 `dist/entry.js`와 `dist/cli/run-main.js`에서 정적 빌드 그래프를 따라가며, 명령 디스패치 전에 Commander, 프롬프트 UI, undici, 로깅 같은 패키지 의존성이 사전 디스패치 시작 과정에서 임포트되면 실패합니다. 또한 번들된 Gateway 실행 청크를 예산 아래로 유지하고 알려진 콜드 Gateway 경로의 정적 임포트를 거부합니다. 패키징된 CLI 스모크는 루트 도움말, 온보딩 도움말, doctor 도움말, 상태, 설정 스키마, 모델 목록 명령도 커버합니다.
- Package Acceptance 레거시 호환성은 `2026.4.25`(`2026.4.25-beta.*` 포함)로 제한됩니다. 해당 기준일까지 하네스는 출시된 패키지 메타데이터 공백만 허용합니다. 생략된 비공개 QA 인벤터리 항목, 누락된 `gateway install --wrapper`, tarball에서 파생된 git 픽스처의 누락된 패치 파일, 누락된 지속 `update.channel`, 레거시 Plugin 설치 기록 위치, 누락된 마켓플레이스 설치 기록 지속성, `plugins update` 중 설정 메타데이터 마이그레이션이 여기에 해당합니다. `2026.4.25` 이후 패키지에서는 이러한 경로가 엄격한 실패입니다.
- 컨테이너 스모크 실행기: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 통합 경로를 검증합니다.

라이브 모델 Docker 실행기는 필요한 CLI 인증 홈만(또는 실행 범위가 좁혀지지 않은 경우 지원되는 모든 인증 홈을) 바인드 마운트한 다음, 실행 전에 이를 컨테이너 홈으로 복사하므로 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 새로 고칠 수 있습니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 포함하며, `pnpm test:docker:live-acp-bind:droid` 및 `pnpm test:docker:live-acp-bind:opencode`를 통해 엄격한 Droid/OpenCode 커버리지를 제공합니다)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex 앱 서버 하니스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 개발 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 관측 가능성 스모크: `pnpm qa:otel:smoke`는 비공개 QA 소스 체크아웃 레인입니다. npm tarball은 QA Lab을 생략하므로 의도적으로 패키지 Docker 릴리스 레인에 포함되지 않습니다.
- Open WebUI 라이브 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm tarball 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩과 기본 Telegram을 통해 OpenAI를 구성하며, doctor가 활성화된 Plugin 런타임 deps를 복구했는지 확인하고, 모킹된 OpenAI 에이전트 턴 하나를 실행합니다. `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 미리 빌드된 tarball을 재사용하거나, `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`으로 호스트 재빌드를 건너뛰거나, `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`로 채널을 전환하세요.
- 업데이트 채널 전환 스모크: `pnpm test:docker:update-channel-switch`는 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, 패키지 `stable`에서 git `dev`로 전환하며, 유지된 채널과 Plugin 업데이트 후 동작을 확인한 다음, 다시 패키지 `stable`로 전환하고 업데이트 상태를 확인합니다.
- 업그레이드 생존자 스모크: `pnpm test:docker:upgrade-survivor`는 에이전트, 채널 구성, Plugin 허용 목록, 오래된 Plugin 런타임 deps 상태, 기존 워크스페이스/세션 파일이 있는 지저분한 기존 사용자 픽스처 위에 패키징된 OpenClaw tarball을 설치합니다. 라이브 공급자나 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, loopback Gateway를 시작하고 구성/상태 보존과 시작/상태 예산을 확인합니다.
- 게시된 업그레이드 생존자 스모크: `pnpm test:docker:published-upgrade-survivor`는 기본적으로 `openclaw@latest`를 설치하고, 현실적인 기존 사용자 파일을 시드하며, 구운 명령 레시피로 해당 기준선을 구성하고, 결과 구성을 검증하며, 게시된 설치를 후보 tarball로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 작성한 다음, loopback Gateway를 시작하고 구성된 인텐트, 상태 보존, 시작, 상태 예산을 확인합니다. `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`로 기준선을 재정의하세요. Package Acceptance는 같은 값을 `published_upgrade_survivor_baseline`로 노출합니다.
- 세션 런타임 컨텍스트 스모크: `pnpm test:docker:session-runtime-context`는 숨겨진 런타임 컨텍스트 transcript 유지와 영향을 받은 중복 프롬프트 재작성 브랜치의 doctor 복구를 검증합니다.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패키징하고, 격리된 홈에 `bun install -g`로 설치하며, `openclaw infer image providers --json`이 멈추지 않고 번들 이미지 공급자를 반환하는지 확인합니다. `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 미리 빌드된 tarball을 재사용하거나, `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`으로 호스트 빌드를 건너뛰거나, `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`로 빌드된 Docker 이미지에서 `dist/`를 복사하세요.
- 설치 프로그램 Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 root, update, direct-npm 컨테이너 전반에서 하나의 npm 캐시를 공유합니다. 업데이트 스모크는 후보 tarball로 업그레이드하기 전에 안정 기준선으로 npm `latest`를 기본 사용합니다. 로컬에서는 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`로, GitHub에서는 Install Smoke 워크플로의 `update_baseline_version` 입력으로 재정의하세요. 비 root 설치 프로그램 검사는 root 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않도록 격리된 npm 캐시를 유지합니다. 로컬 재실행 간 root/update/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정하세요.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요할 때는 해당 env 없이 로컬에서 스크립트를 실행하세요.
- 에이전트 공유 워크스페이스 삭제 CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에 하나의 워크스페이스를 가진 두 에이전트를 시드하며, `agents delete --json`을 실행하고, 유효한 JSON과 유지된 워크스페이스 동작을 확인합니다. `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`로 install-smoke 이미지를 재사용하세요.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- 브라우저 CDP 스냅샷 스모크: `pnpm test:docker:browser-cdp-snapshot` (스크립트: `scripts/e2e/browser-cdp-snapshot-docker.sh`)는 소스 E2E 이미지와 Chromium 레이어를 빌드하고, 원시 CDP로 Chromium을 시작하며, `browser doctor --deep`을 실행하고, CDP 역할 스냅샷이 링크 URL, 커서 승격 클릭 가능 요소, iframe ref, 프레임 메타데이터를 포함하는지 확인합니다.
- OpenAI Responses web_search 최소 reasoning 회귀: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 모킹된 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 확인한 다음, 공급자 스키마 거부를 강제하고 원시 세부 정보가 Gateway 로그에 나타나는지 확인합니다.
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + 원시 Claude 알림 프레임 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 내장 Pi 프로필 허용/거부 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP 정리(실제 Gateway + 격리된 cron 및 일회성 subagent 실행 후 stdio MCP 자식 종료): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin(설치 스모크, ClawHub kitchen-sink 설치/제거, 마켓플레이스 업데이트, Claude 번들 활성화/검사): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
  ClawHub 블록을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하거나, 기본 kitchen-sink 패키지/런타임 쌍을 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 및 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`로 재정의하세요. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`이 없으면 테스트는 hermetic 로컬 ClawHub 픽스처 서버를 사용합니다.
- Plugin 업데이트 변경 없음 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- 구성 reload 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- 번들 Plugin 런타임 deps: `pnpm test:docker:bundled-channel-deps`는 기본적으로 작은 Docker 러너 이미지를 빌드하고, 호스트에서 OpenClaw를 한 번 빌드하고 패키징한 다음, 해당 tarball을 각 Linux 설치 시나리오에 마운트합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`로 이미지를 재사용하거나, 최신 로컬 빌드 후 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`으로 호스트 재빌드를 건너뛰거나, `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 기존 tarball을 지정하세요. 전체 Docker 집계와 릴리스 경로 번들 채널 청크는 이 tarball을 한 번 미리 패키징한 다음, Telegram, Discord, Slack, Feishu, memory-lancedb, ACPX의 별도 업데이트 레인을 포함해 번들 채널 검사를 독립 레인으로 샤딩합니다. 릴리스 청크는 채널 스모크, 업데이트 대상, setup/runtime 계약을 `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b`, `bundled-channels-contracts`로 나눕니다. 집계 `bundled-channels` 청크는 수동 재실행용으로 계속 사용할 수 있습니다. 릴리스 워크플로는 공급자 설치 프로그램 청크와 번들 Plugin 설치/제거 청크도 나눕니다. 기존 `package-update`, `plugins-runtime`, `plugins-integrations` 청크는 수동 재실행용 집계 별칭으로 남아 있습니다. 번들 레인을 직접 실행할 때 채널 매트릭스를 좁히려면 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`를 사용하거나, 업데이트 시나리오를 좁히려면 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`를 사용하세요. 시나리오별 Docker 실행은 기본적으로 `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`를 사용합니다. 다중 대상 업데이트 시나리오는 기본적으로 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`를 사용합니다. 이 레인은 또한 `channels.<id>.enabled=false` 및 `plugins.entries.<id>.enabled=false`가 doctor/runtime-dependency 복구를 억제하는지 확인합니다.
- 반복 작업 중 관련 없는 시나리오를 비활성화하여 번들 Plugin 런타임 deps 범위를 좁히세요. 예:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

공유 함수형 이미지를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 제품군별 이미지 재정의가 설정되어 있으면 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키는 경우, 스크립트는 해당 이미지가 아직 로컬에 없으면 pull합니다. QR 및 설치 프로그램 Docker 테스트는 공유 빌드 앱 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

라이브 모델 Docker 러너는 현재 체크아웃을 읽기 전용으로 bind-mount하고
컨테이너 내부의 임시 작업 디렉터리에 stage합니다. 이렇게 하면 런타임
이미지는 슬림하게 유지하면서도 정확한 로컬 소스/구성에 대해 Vitest를 실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 앱 로컬 `.build` 또는
Gradle 출력 디렉터리처럼 큰 로컬 전용 캐시와 앱 빌드 출력을 건너뛰어
Docker 라이브 실행이 머신별 아티팩트를 복사하느라 몇 분을 쓰지 않게 합니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정해 Gateway 라이브 프로브가 컨테이너 안에서
실제 Telegram/Discord/기타 채널 워커를 시작하지 않게 합니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로, 해당 Docker lane에서
Gateway 라이브 범위를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 smoke입니다. OpenAI 호환 HTTP 엔드포인트가 활성화된
OpenClaw Gateway 컨테이너를 시작하고, 해당 Gateway를 대상으로 pinned Open WebUI 컨테이너를 시작한 뒤,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 확인한 다음,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
첫 실행은 Docker가 Open WebUI 이미지를 가져와야 할 수 있고 Open WebUI도 자체 cold-start 설정을
마쳐야 할 수 있으므로 눈에 띄게 더 느릴 수 있습니다.
이 lane은 사용할 수 있는 라이브 모델 키를 기대하며, Docker화된 실행에서 이를 제공하는 기본 방법은
`OPENCLAW_PROFILE_FILE`(기본값: `~/.profile`)입니다.
성공한 실행은 `{ "ok": true, "model": "openclaw/default", ... }` 같은 작은 JSON 페이로드를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord 또는 iMessage 계정이 필요하지 않습니다.
시드된 Gateway 컨테이너를 부팅하고, `openclaw mcp serve`를 spawning하는 두 번째 컨테이너를 시작한 다음,
라우팅된 대화 검색, transcript 읽기, 첨부 파일 메타데이터, 라이브 이벤트 큐 동작, outbound send 라우팅,
그리고 실제 stdio MCP bridge를 통한 Claude 스타일 채널 + 권한 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을
직접 검사하므로, smoke는 특정 클라이언트 SDK가 우연히 표면화하는 내용만이 아니라 bridge가 실제로 emit하는 내용을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 라이브 모델 키가 필요하지 않습니다. repo Docker 이미지를 빌드하고,
컨테이너 안에서 실제 stdio MCP probe 서버를 시작하고, 내장 Pi bundle MCP 런타임을 통해 해당 서버를 materialize하고,
도구를 실행한 다음, `coding` 및 `messaging`은 `bundle-mcp` 도구를 유지하는 반면 `minimal` 및
`tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 검증합니다.
`test:docker:cron-mcp-cleanup`은 결정적이며 라이브 모델 키가 필요하지 않습니다. 실제 stdio MCP probe 서버가 있는
시드된 Gateway를 시작하고, 격리된 Cron turn과 `/subagents spawn` one-shot child turn을 실행한 다음,
각 실행 후 MCP child process가 종료되는지 검증합니다.

수동 ACP 평문 thread smoke(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 회귀/디버그 워크플로를 위해 이 스크립트를 유지하세요. ACP thread 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env vars:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)는 `/home/node/.openclaw`에 마운트됩니다.
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)는 `/home/node/.openclaw/workspace`에 마운트됩니다.
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`)는 `/home/node/.profile`에 마운트되며 테스트 실행 전에 sourced됩니다.
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 임시 config/workspace dirs를 사용하고 외부 CLI auth mounts 없이 `OPENCLAW_PROFILE_FILE`에서 sourced된 env vars만 검증합니다.
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`)는 Docker 내부의 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트됩니다.
- `$HOME` 아래의 외부 CLI auth dirs/files는 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음, 테스트 시작 전에 `/home/node/...`로 복사됩니다.
  - 기본 dirs: `.minimax`
  - 기본 files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 범위를 좁힌 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 dirs/files만 마운트합니다.
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 comma list로 수동 override합니다.
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`로 실행 범위를 좁힙니다.
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`로 컨테이너 내부 provider를 필터링합니다.
- `OPENCLAW_SKIP_DOCKER_BUILD=1`로 rebuild가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용합니다.
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`로 creds가 env가 아닌 profile store에서 오도록 보장합니다.
- `OPENCLAW_OPENWEBUI_MODEL=...`로 Open WebUI smoke를 위해 Gateway가 노출하는 모델을 선택합니다.
- `OPENCLAW_OPENWEBUI_PROMPT=...`로 Open WebUI smoke에서 사용하는 nonce-check prompt를 override합니다.
- `OPENWEBUI_IMAGE=...`로 pinned Open WebUI image tag를 override합니다.

## 문서 sanity

문서 수정 후 docs check를 실행하세요: `pnpm check:docs`.
인페이지 heading 검사까지 필요할 때는 전체 Mintlify anchor 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI-safe)

이들은 실제 provider 없는 “real pipeline” 회귀입니다.

- Gateway tool calling(mock OpenAI, 실제 gateway + agent loop): `src/gateway/gateway.test.ts`(case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard(WS `wizard.start`/`wizard.next`, config 작성 + auth 강제): `src/gateway/gateway.test.ts`(case: "runs wizard over ws and writes auth token config")

## Agent reliability evals(skills)

이미 “agent reliability evals”처럼 동작하는 몇 가지 CI-safe 테스트가 있습니다.

- 실제 gateway + agent loop를 통한 mock tool-calling(`src/gateway/gateway.test.ts`).
- session wiring과 config effect를 검증하는 end-to-end wizard flows(`src/gateway/gateway.test.ts`).

Skills에 아직 빠져 있는 것([Skills](/ko/tools/skills) 참조):

- **Decisioning:** prompt에 skills가 나열되어 있을 때 agent가 올바른 skill을 선택하거나 관련 없는 skill을 피하는가?
- **Compliance:** agent가 사용 전에 `SKILL.md`를 읽고 필수 steps/args를 따르는가?
- **Workflow contracts:** tool order, session history carryover, sandbox boundaries를 assertion하는 multi-turn scenarios.

향후 eval은 먼저 결정적으로 유지해야 합니다.

- mock providers를 사용해 tool calls + order, skill file reads, session wiring을 assertion하는 scenario runner.
- skill 중심 scenarios의 작은 suite(use vs avoid, gating, prompt injection).
- 선택적 live evals(opt-in, env-gated)는 CI-safe suite가 마련된 뒤에만 추가합니다.

## Contract tests(Plugin 및 채널 shape)

Contract tests는 등록된 모든 Plugin과 채널이 해당 interface contract를 준수하는지 검증합니다.
발견된 모든 Plugin을 순회하며 shape 및 behavior assertions suite를 실행합니다. 기본 `pnpm test` unit lane은
이러한 shared seam 및 smoke files를 의도적으로 건너뜁니다. shared channel 또는 provider surface를 건드렸을 때는
contract commands를 명시적으로 실행하세요.

### 명령

- 모든 contracts: `pnpm test:contracts`
- Channel contracts only: `pnpm test:contracts:channels`
- Provider contracts only: `pnpm test:contracts:plugins`

### Channel contracts

위치: `src/channels/plugins/contracts/*.contract.test.ts`

- **plugin** - 기본 Plugin shape(id, name, capabilities)
- **setup** - 설정 wizard contract
- **session-binding** - session binding 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - inbound message 처리
- **actions** - 채널 action handlers
- **threading** - thread ID 처리
- **directory** - directory/roster API
- **group-policy** - group policy 강제

### Provider status contracts

위치: `src/plugins/contracts/*.contract.test.ts`.

- **status** - 채널 status probes
- **registry** - Plugin registry shape

### Provider contracts

위치: `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - 설정 wizard

### 실행 시점

- plugin-sdk exports 또는 subpaths 변경 후
- 채널 또는 provider Plugin을 추가하거나 수정한 후
- Plugin registration 또는 discovery를 refactor한 후

Contract tests는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가(guidance)

라이브에서 발견한 provider/model 문제를 수정할 때:

- 가능하면 CI-safe regression을 추가하세요(mock/stub provider 또는 정확한 request-shape transformation capture).
- 본질적으로 live-only인 경우(rate limits, auth policies), live test를 좁게 유지하고 env vars를 통한 opt-in으로 만드세요.
- 버그를 잡는 가장 작은 layer를 targeting하는 것을 선호하세요.
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 또는 CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 registry metadata(`listSecretTargetRegistryEntries()`)에서 SecretRef class마다 sampled target 하나를 도출한 다음, traversal-segment exec ids가 거부되는지 assertion합니다.
  - `src/secrets/target-registry-data.ts`에 새로운 `includeInPlan` SecretRef target family를 추가하는 경우, 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 unclassified target ids에서 의도적으로 실패하므로 새 classes가 조용히 skipped될 수 없습니다.

## 관련 항목

- [라이브 테스트](/ko/help/testing-live)
- [CI](/ko/ci)
