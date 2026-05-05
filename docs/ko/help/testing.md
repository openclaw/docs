---
read_when:
    - 로컬 또는 CI에서 테스트 실행
    - 모델/Provider 버그에 대한 회귀 테스트 추가
    - Gateway + 에이전트 동작 디버깅
summary: '테스트 키트: 단위/e2e/라이브 스위트, Docker 러너, 각 테스트가 다루는 내용'
title: 테스트
x-i18n:
    generated_at: "2026-05-05T01:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw에는 세 가지 Vitest 제품군(unit/integration, e2e, live)과 소수의 Docker 러너가 있습니다. 이 문서는 "테스트 방식" 가이드입니다.

- 각 제품군이 다루는 범위와 의도적으로 다루지 _않는_ 범위.
- 일반적인 워크플로(local, pre-push, debugging)에서 실행할 명령.
- live 테스트가 자격 증명을 찾고 모델/프로바이더를 선택하는 방식.
- 실제 모델/프로바이더 문제에 대한 회귀 테스트를 추가하는 방법.

<Note>
**QA 스택(qa-lab, qa-channel, live transport lanes)**은 별도로 문서화되어 있습니다.

- [QA 개요](/ko/concepts/qa-e2e-automation) — 아키텍처, 명령 표면, 시나리오 작성.
- [Matrix QA](/ko/concepts/qa-matrix) — `pnpm openclaw qa matrix` 참조.
- [QA 채널](/ko/channels/qa-channel) — 저장소 기반 시나리오에서 사용하는 합성 전송 플러그인.

이 페이지는 일반 테스트 제품군과 Docker/Parallels 러너 실행을 다룹니다. 아래의 QA 전용 러너 섹션([QA 전용 러너](#qa-specific-runners))에는 구체적인 `qa` 호출이 나열되어 있으며 위의 참조로 다시 안내합니다.
</Note>

## 빠른 시작

대부분의 날에는:

- 전체 게이트(push 전에 예상됨): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 여유 있는 머신에서 더 빠른 로컬 전체 제품군 실행: `pnpm test:max`
- 직접 Vitest watch 루프: `pnpm test:watch`
- 직접 파일 대상 지정은 이제 확장/채널 경로도 라우팅합니다: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 단일 실패를 반복 처리할 때는 먼저 대상 범위를 좁힌 실행을 선호하세요.
- Docker 기반 QA 사이트: `pnpm qa:lab:up`
- Linux VM 기반 QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

테스트를 수정했거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 제품군: `pnpm test:e2e`

실제 프로바이더/모델을 디버깅할 때(실제 자격 증명 필요):

- live 제품군(모델 + Gateway 도구/이미지 프로브): `pnpm test:live`
- 하나의 live 파일을 조용히 대상으로 지정: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 런타임 성능 보고서: 실제 `openai/gpt-5.4` 에이전트 턴에는 `live_gpt54=true`로, Kova CPU/heap/trace 아티팩트에는 `deep_profile=true`로 `OpenClaw Performance`를 디스패치합니다. `CLAWGRIT_REPORTS_TOKEN`이 구성된 경우 일일 예약 실행은 mock-provider, deep-profile, GPT 5.4 lane 아티팩트를 `openclaw/clawgrit-reports`에 게시합니다. mock-provider 보고서에는 소스 수준 Gateway 부팅, 메모리, 플러그인 압력, 반복 fake-model hello-loop, CLI 시작 수치도 포함됩니다.
- Docker live 모델 스윕: `pnpm test:docker:live-models`
  - 선택된 각 모델은 이제 텍스트 턴과 작은 파일 읽기 스타일 프로브를 실행합니다. 메타데이터가 `image` 입력을 알리는 모델은 작은 이미지 턴도 실행합니다. 프로바이더 실패를 격리할 때는 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 또는 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`으로 추가 프로브를 비활성화하세요.
  - CI 커버리지: 일일 `OpenClaw Scheduled Live And E2E Checks`와 수동 `OpenClaw Release Checks`는 모두 `include_live_suites: true`로 재사용 가능한 live/E2E 워크플로를 호출하며, 여기에는 프로바이더별로 샤딩된 별도의 Docker live 모델 매트릭스 작업이 포함됩니다.
  - 집중 CI 재실행의 경우 `include_live_suites: true` 및 `live_models_only: true`로 `OpenClaw Live And E2E Checks (Reusable)`를 디스패치하세요.
  - 새로운 고신호 프로바이더 시크릿은 `scripts/ci-hydrate-live-auth.sh`와 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 및 해당 scheduled/release 호출자에 추가하세요.
- 네이티브 Codex 바운드 채팅 스모크: `pnpm test:docker:live-codex-bind`
  - Codex app-server 경로에 대해 Docker live lane을 실행하고, 합성 Slack DM을 `/codex bind`로 바인딩하고, `/codex fast` 및 `/codex permissions`를 실행한 다음, 일반 답장과 이미지 첨부가 ACP 대신 네이티브 플러그인 바인딩을 통해 라우팅되는지 확인합니다.
- Codex app-server 하네스 스모크: `pnpm test:docker:live-codex-harness`
  - 플러그인 소유 Codex app-server 하네스를 통해 Gateway 에이전트 턴을 실행하고, `/codex status` 및 `/codex models`를 확인하며, 기본적으로 이미지, cron MCP, 하위 에이전트, Guardian 프로브를 실행합니다. 다른 Codex app-server 실패를 격리할 때는 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`으로 하위 에이전트 프로브를 비활성화하세요. 집중 하위 에이전트 확인의 경우 다른 프로브를 비활성화하세요: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`이 설정되지 않은 한 하위 에이전트 프로브 후 종료됩니다.
- Crestodian 구조 명령 스모크: `pnpm test:live:crestodian-rescue-channel`
  - 메시지 채널 구조 명령 표면을 위한 선택적 이중 안전 확인입니다. `/crestodian status`를 실행하고, 지속 모델 변경을 큐에 넣고, `/crestodian yes`로 답장한 다음, 감사/config 쓰기 경로를 확인합니다.
- Crestodian planner Docker 스모크: `pnpm test:docker:crestodian-planner`
  - `PATH`에 가짜 Claude CLI가 있는 configless 컨테이너에서 Crestodian을 실행하고, 퍼지 planner fallback이 감사된 typed config 쓰기로 변환되는지 확인합니다.
- Crestodian 첫 실행 Docker 스모크: `pnpm test:docker:crestodian-first-run`
  - 빈 OpenClaw 상태 디렉터리에서 시작하여 bare `openclaw`를 Crestodian으로 라우팅하고, setup/model/agent/Discord 플러그인 + SecretRef 쓰기를 적용하고, config를 검증하며 감사 항목을 확인합니다. 동일한 Ring 0 설정 경로는 QA Lab에서도 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`으로 다룹니다.
- Moonshot/Kimi 비용 스모크: `MOONSHOT_API_KEY`가 설정된 상태에서 `openclaw models list --provider moonshot --json`을 실행한 다음, `moonshot/kimi-k2.6`에 대해 격리된 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`을 실행합니다. JSON이 Moonshot/K2.6을 보고하고 assistant transcript가 정규화된 `usage.cost`를 저장하는지 확인합니다.

<Tip>
실패 사례 하나만 필요할 때는 아래에 설명된 allowlist env vars를 통해 live 테스트 범위를 좁히는 방식을 선호하세요.
</Tip>

## QA 전용 러너

QA-lab 수준의 현실성이 필요할 때 이 명령들은 기본 테스트 제품군 옆에 있습니다.

CI는 전용 워크플로에서 QA Lab을 실행합니다. Agentic parity는 독립형 PR 워크플로가 아니라 `QA-Lab - All Lanes` 및 release validation 아래에 중첩되어 있습니다. 광범위한 검증에는 `rerun_group=qa-parity`가 포함된 `Full Release Validation` 또는 release-checks QA 그룹을 사용해야 합니다. Stable/default release checks는 `run_release_soak=true` 뒤에 exhaustive live/Docker soak를 유지하며, `full` 프로필은 soak를 강제로 켭니다. `QA-Lab - All Lanes`는 `main`에서 야간 실행되고 수동 디스패치에서 mock parity lane, live Matrix lane, Convex 관리 live Telegram lane, Convex 관리 live Discord lane을 병렬 작업으로 실행합니다. 예약 QA 및 release checks는 Matrix `--profile fast`를 명시적으로 전달하는 반면, Matrix CLI와 수동 워크플로 입력 기본값은 `all`로 유지됩니다. 수동 디스패치는 `all`을 `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli` 작업으로 샤딩할 수 있습니다. `OpenClaw Release Checks`는 릴리스 승인 전에 parity와 fast Matrix 및 Telegram lane을 실행하며, 릴리스 전송 확인에 `mock-openai/gpt-5.5`를 사용하여 결정성을 유지하고 일반 프로바이더 플러그인 시작을 피합니다. 이러한 live 전송 Gateway는 메모리 검색을 비활성화합니다. 메모리 동작은 QA parity 제품군에서 계속 다룹니다.

전체 릴리스 live media 샤드는 이미 `ffmpeg`와 `ffprobe`가 포함된 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`를 사용합니다. Docker live 모델/백엔드 샤드는 선택한 커밋마다 한 번 빌드되는 공유 `ghcr.io/openclaw/openclaw-live-test:<sha>` 이미지를 사용한 다음, 모든 샤드 내부에서 다시 빌드하는 대신 `OPENCLAW_SKIP_DOCKER_BUILD=1`로 이미지를 가져옵니다.

- `pnpm openclaw qa suite`
  - 저장소 기반 QA 시나리오를 호스트에서 직접 실행합니다.
  - 기본적으로 격리된 Gateway 워커를 사용해 선택한 여러 시나리오를 병렬로 실행합니다. `qa-channel`은 기본 동시성 4를 사용합니다(선택한 시나리오 수로 제한됨). 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 기존 직렬 레인에는 `--concurrency 1`을 사용합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용합니다.
  - 제공자 모드 `live-frontier`, `mock-openai`, `aimock`를 지원합니다. `aimock`는 시나리오 인식 `mock-openai` 레인을 대체하지 않고도 실험적 픽스처 및 프로토콜 목 커버리지를 위해 로컬 AIMock 기반 제공자 서버를 시작합니다.
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab을 통해 라이브 OpenAI Kitchen Sink Plugin 건틀릿을 실행합니다. 외부 Kitchen Sink 패키지를 설치하고, Plugin SDK 표면 인벤토리를 검증하며, `/healthz`와 `/readyz`를 프로브하고, Gateway CPU/RSS 증거를 기록하고, 라이브 OpenAI 턴을 실행하며, 적대적 진단을 확인합니다. `OPENAI_API_KEY` 같은 라이브 OpenAI 인증이 필요합니다. 하이드레이션된 Testbox 세션에서는 `openclaw-testbox-env` 헬퍼가 있을 때 Testbox 라이브 인증 프로필을 자동으로 소싱합니다.
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 시작 벤치와 작은 목 QA Lab 시나리오 팩(`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`)을 실행하고 `.artifacts/gateway-cpu-scenarios/` 아래에 결합된 CPU 관찰 요약을 작성합니다.
  - 기본적으로 지속적인 고온 CPU 관찰만 플래그 처리하므로(`--cpu-core-warn`와 `--hot-wall-warn-ms`), 짧은 시작 버스트는 수 분 동안 지속되는 Gateway 고정 회귀처럼 보이지 않고 메트릭으로 기록됩니다.
  - 빌드된 `dist` 아티팩트를 사용합니다. 체크아웃에 최신 런타임 출력이 아직 없으면 먼저 빌드를 실행합니다.
- `pnpm openclaw qa suite --runner multipass`
  - 동일한 QA 스위트를 일회용 Multipass Linux VM 안에서 실행합니다.
  - 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 유지합니다.
  - `qa suite`와 동일한 제공자/모델 선택 플래그를 재사용합니다.
  - 라이브 실행은 게스트에서 실용적으로 지원되는 QA 인증 입력을 전달합니다: env 기반 제공자 키, QA 라이브 제공자 구성 경로, 그리고 있을 경우 `CODEX_HOME`.
  - 출력 디렉터리는 게스트가 마운트된 작업 공간을 통해 다시 쓸 수 있도록 저장소 루트 아래에 유지해야 합니다.
  - 일반 QA 보고서와 요약, 그리고 Multipass 로그를 `.artifacts/qa-e2e/...` 아래에 작성합니다.
- `pnpm qa:lab:up`
  - 운영자 스타일 QA 작업을 위해 Docker 기반 QA 사이트를 시작합니다.
- `pnpm test:docker:npm-onboard-channel-agent`
  - 현재 체크아웃에서 npm 타볼을 빌드하고, Docker에 전역 설치하고, 비대화형 OpenAI API 키 온보딩을 실행하고, 기본적으로 Telegram을 구성하고, 패키징된 Plugin 런타임이 시작 시 의존성 복구 없이 로드되는지 검증하고, doctor를 실행하고, 목 OpenAI 엔드포인트를 대상으로 로컬 에이전트 턴 하나를 실행합니다.
  - Discord로 동일한 패키지 설치 레인을 실행하려면 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`를 사용합니다.
- `pnpm test:docker:session-runtime-context`
  - 내장 런타임 컨텍스트 transcript에 대해 결정론적인 빌드 앱 Docker smoke를 실행합니다. 숨겨진 OpenClaw 런타임 컨텍스트가 표시되는 사용자 턴에 누출되지 않고 비표시 사용자 지정 메시지로 지속되는지 검증한 다음, 영향을 받는 손상된 세션 JSONL을 시드하고 `openclaw doctor --fix`가 백업과 함께 이를 활성 브랜치로 다시 작성하는지 검증합니다.
- `pnpm test:docker:npm-telegram-live`
  - Docker에 OpenClaw 패키지 후보를 설치하고, 설치된 패키지 온보딩을 실행하고, 설치된 CLI를 통해 Telegram을 구성한 다음, 해당 설치 패키지를 SUT Gateway로 사용해 라이브 Telegram QA 레인을 재사용합니다.
  - 기본값은 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`입니다. 레지스트리에서 설치하는 대신 확인된 로컬 타볼을 테스트하려면 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 또는 `OPENCLAW_CURRENT_PACKAGE_TGZ`를 설정합니다.
  - `pnpm openclaw qa telegram`과 동일한 Telegram env 자격 증명 또는 Convex 자격 증명 소스를 사용합니다. CI/릴리스 자동화의 경우 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`와 `OPENCLAW_QA_CONVEX_SITE_URL`, 역할 시크릿을 설정합니다. CI에 `OPENCLAW_QA_CONVEX_SITE_URL`와 Convex 역할 시크릿이 있으면 Docker 래퍼가 Convex를 자동으로 선택합니다.
  - 래퍼는 Docker 빌드/설치 작업 전에 호스트에서 Telegram 또는 Convex 자격 증명 env를 검증합니다. 사전 자격 증명 설정을 의도적으로 디버깅할 때만 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`을 설정합니다.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`는 이 레인에 대해서만 공유 `OPENCLAW_QA_CREDENTIAL_ROLE`을 재정의합니다.
  - GitHub Actions는 이 레인을 수동 유지관리자 워크플로 `NPM Telegram Beta E2E`로 노출합니다. 병합 시에는 실행되지 않습니다. 워크플로는 `qa-live-shared` 환경과 Convex CI 자격 증명 임대를 사용합니다.
- GitHub Actions는 후보 패키지 하나에 대한 사이드 실행 제품 증명을 위해 `Package Acceptance`도 노출합니다. 신뢰할 수 있는 ref, 게시된 npm 사양, SHA-256이 포함된 HTTPS 타볼 URL, 또는 다른 실행의 타볼 아티팩트를 허용하고, 정규화된 `openclaw-current.tgz`를 `package-under-test`로 업로드한 다음, 기존 Docker E2E 스케줄러를 smoke, package, product, full 또는 사용자 지정 레인 프로필로 실행합니다. 동일한 `package-under-test` 아티팩트를 대상으로 Telegram QA 워크플로를 실행하려면 `telegram_mode=mock-openai` 또는 `live-frontier`를 설정합니다.
  - 최신 베타 제품 증명:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 정확한 타볼 URL 증명에는 다이제스트가 필요합니다:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 아티팩트 증명은 다른 Actions 실행에서 타볼 아티팩트를 다운로드합니다:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 현재 OpenClaw 빌드를 Docker에서 패킹 및 설치하고, OpenAI가 구성된 상태로 Gateway를 시작한 다음, 구성 편집을 통해 번들 채널/Plugin을 활성화합니다.
  - 설정 검색에서 구성되지 않은 다운로드 가능 Plugin이 없는 상태로 남는지, 첫 번째 구성된 doctor 복구가 누락된 각 다운로드 가능 Plugin을 명시적으로 설치하는지, 그리고 두 번째 재시작에서는 숨겨진 의존성 복구가 실행되지 않는지 검증합니다.
  - 또한 알려진 이전 npm 기준선을 설치하고, `openclaw update --tag <candidate>`를 실행하기 전에 Telegram을 활성화한 뒤, 후보의 업데이트 후 doctor가 harness 측 postinstall 복구 없이 레거시 Plugin 의존성 잔여물을 정리하는지 검증합니다.
- `pnpm test:parallels:npm-update`
  - Parallels 게스트 전반에서 네이티브 패키지 설치 업데이트 smoke를 실행합니다. 선택한 각 플랫폼은 먼저 요청된 기준 패키지를 설치한 다음, 동일한 게스트에서 설치된 `openclaw update` 명령을 실행하고 설치된 버전, 업데이트 상태, Gateway 준비 상태, 로컬 에이전트 턴 하나를 검증합니다.
  - 게스트 하나를 반복 작업할 때는 `--platform macos`, `--platform windows`, 또는 `--platform linux`를 사용합니다. 요약 아티팩트 경로와 레인별 상태에는 `--json`을 사용합니다.
  - OpenAI 레인은 기본적으로 라이브 에이전트 턴 증명에 `openai/gpt-5.5`를 사용합니다. 다른 OpenAI 모델을 의도적으로 검증할 때는 `--model <provider/model>`을 전달하거나 `OPENCLAW_PARALLELS_OPENAI_MODEL`을 설정합니다.
  - Parallels 전송 정지가 남은 테스트 시간을 소모하지 않도록 긴 로컬 실행을 호스트 timeout으로 감쌉니다:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 스크립트는 중첩 레인 로그를 `/tmp/openclaw-parallels-npm-update.*` 아래에 작성합니다. 외부 래퍼가 멈췄다고 가정하기 전에 `windows-update.log`, `macos-update.log`, 또는 `linux-update.log`를 검사합니다.
  - Windows 업데이트는 콜드 게스트에서 업데이트 후 doctor와 패키지 업데이트 작업에 10분에서 15분이 걸릴 수 있습니다. 중첩 npm 디버그 로그가 진행 중이면 이는 정상입니다.
  - 이 집계 래퍼를 개별 Parallels macOS, Windows, 또는 Linux smoke 레인과 병렬로 실행하지 마십시오. VM 상태를 공유하며 스냅샷 복원, 패키지 제공, 또는 게스트 Gateway 상태에서 충돌할 수 있습니다.
  - 업데이트 후 증명은 일반 번들 Plugin 표면을 실행합니다. speech, 이미지 생성, 미디어 이해 같은 capability facade는 에이전트 턴 자체가 단순 텍스트 응답만 확인하더라도 번들 런타임 API를 통해 로드되기 때문입니다.

- `pnpm openclaw qa aimock`
  - 직접 프로토콜 smoke 테스트를 위해 로컬 AIMock 제공자 서버만 시작합니다.
- `pnpm openclaw qa matrix`
  - 일회용 Docker 기반 Tuwunel homeserver를 대상으로 Matrix 라이브 QA 레인을 실행합니다. 소스 체크아웃 전용입니다. 패키지 설치에는 `qa-lab`가 포함되지 않습니다.
  - 전체 CLI, 프로필/시나리오 카탈로그, env vars, 아티팩트 레이아웃: [Matrix QA](/ko/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env의 driver 및 SUT 봇 토큰을 사용해 실제 비공개 그룹을 대상으로 Telegram 라이브 QA 레인을 실행합니다.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요합니다. 그룹 ID는 숫자 Telegram 채팅 ID여야 합니다.
  - 공유 풀 자격 증명에는 `--credential-source convex`를 지원합니다. 기본적으로 env 모드를 사용하거나, 풀 임대를 사용하려면 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정합니다.
  - 시나리오가 하나라도 실패하면 0이 아닌 코드로 종료합니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용합니다.
  - 동일한 비공개 그룹에 서로 다른 두 봇이 필요하며, SUT 봇은 Telegram 사용자 이름을 노출해야 합니다.
  - 안정적인 봇 간 관찰을 위해 두 봇 모두에 대해 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화하고, driver 봇이 그룹 봇 트래픽을 관찰할 수 있게 합니다.
  - Telegram QA 보고서, 요약, 관찰된 메시지 아티팩트를 `.artifacts/qa-e2e/...` 아래에 작성합니다. 응답 시나리오에는 driver 전송 요청부터 관찰된 SUT 응답까지의 RTT가 포함됩니다.

라이브 전송 레인은 하나의 표준 계약을 공유하므로 새 전송이 어긋나지 않습니다. 레인별 커버리지 매트릭스는 [QA 개요 → 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 있습니다. `qa-channel`은 광범위한 합성 스위트이며 해당 매트릭스의 일부가 아닙니다.

### Convex를 통한 공유 Telegram 자격 증명(v1)

`openclaw qa telegram`에 대해 `--credential-source convex`(또는 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)가 활성화되면 QA lab은 Convex 기반 풀에서 독점 임대를 획득하고, 레인이 실행되는 동안 해당 임대에 Heartbeat를 보내며, 종료 시 임대를 해제합니다.

참조 Convex 프로젝트 scaffold:

- `qa/convex-credential-broker/`

필수 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`(예: `https://your-deployment.convex.site`)
- 선택한 역할에 대한 시크릿 하나:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`: `maintainer`용
  - `OPENCLAW_QA_CONVEX_SECRET_CI`: `ci`용
- 자격 증명 역할 선택:
  - CLI: `--credential-role maintainer|ci`
  - Env 기본값: `OPENCLAW_QA_CREDENTIAL_ROLE`(CI에서는 기본값 `ci`, 그 외에는 `maintainer`)

선택적 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`(기본값 `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`(기본값 `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`(기본값 `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`(기본값 `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`(기본값 `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`(선택적 추적 ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`은 로컬 전용 개발을 위해 loopback `http://` Convex URL을 허용합니다.

`OPENCLAW_QA_CONVEX_SITE_URL`은 정상 운영 시 `https://`를 사용해야 합니다.

유지관리자 관리자 명령(pool add/remove/list)에는 특히
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`가 필요합니다.

유지관리자를 위한 CLI 헬퍼:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

라이브 실행 전에 `doctor`를 사용해 비밀 값을 출력하지 않고 Convex 사이트 URL, 브로커 시크릿, 엔드포인트 접두사, HTTP 타임아웃, 관리자/목록 접근 가능성을 확인하세요. 스크립트와 CI 유틸리티에서 기계가 읽을 수 있는 출력을 사용하려면 `--json`을 사용하세요.

기본 엔드포인트 계약(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add`(유지관리자 시크릿 전용)
  - 요청: `{ kind, actorId, payload, note?, status? }`
  - 성공: `{ status: "ok", credential }`
- `POST /admin/remove`(유지관리자 시크릿 전용)
  - 요청: `{ credentialId, actorId }`
  - 성공: `{ status: "ok", changed, credential }`
  - 활성 리스 가드: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`(유지관리자 시크릿 전용)
  - 요청: `{ kind?, status?, includePayload?, limit? }`
  - 성공: `{ status: "ok", credentials, count }`

Telegram 종류의 페이로드 형태:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`는 숫자형 Telegram 채팅 ID 문자열이어야 합니다.
- `admin/add`는 `kind: "telegram"`에 대해 이 형태를 검증하고 잘못된 페이로드를 거부합니다.

### QA에 채널 추가하기

새 채널 어댑터의 아키텍처와 시나리오 헬퍼 이름은 [QA 개요 → 채널 추가하기](/ko/concepts/qa-e2e-automation#adding-a-channel)에 있습니다. 최소 기준: 공유 `qa-lab` 호스트 seam에 transport runner를 구현하고, Plugin 매니페스트에 `qaRunners`를 선언하고, `openclaw qa <runner>`로 마운트하고, `qa/scenarios/` 아래에 시나리오를 작성하는 것입니다.

## 테스트 스위트(어디서 무엇이 실행되는지)

스위트를 “현실성 증가”(그리고 불안정성/비용 증가)로 생각하세요.

### 단위 / 통합(기본값)

- 명령: `pnpm test`
- 설정: 타깃 없는 실행은 `vitest.full-*.config.ts` 샤드 세트를 사용하며 병렬 스케줄링을 위해 다중 프로젝트 샤드를 프로젝트별 설정으로 확장할 수 있습니다
- 파일: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 아래의 코어/단위 인벤토리; UI 단위 테스트는 전용 `unit-ui` 샤드에서 실행됩니다
- 범위:
  - 순수 단위 테스트
  - 인프로세스 통합 테스트(Gateway 인증, 라우팅, 도구, 파싱, 설정)
  - 알려진 버그에 대한 결정적 회귀 테스트
- 기대 사항:
  - CI에서 실행됩니다
  - 실제 키가 필요 없습니다
  - 빠르고 안정적이어야 합니다
  - 리졸버와 공개 표면 로더 테스트는 실제 번들 Plugin 소스 API가 아니라 생성된 작은 Plugin 픽스처로 넓은 `api.js` 및
    `runtime-api.js` 폴백 동작을 증명해야 합니다. 실제 Plugin API 로드는
    Plugin 소유 계약/통합 스위트에 속합니다.

<AccordionGroup>
  <Accordion title="프로젝트, 샤드, 범위 지정 레인">

    - 타깃 없는 `pnpm test`는 하나의 거대한 네이티브 루트 프로젝트 프로세스 대신 열두 개의 더 작은 샤드 설정(`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`)을 실행합니다. 이렇게 하면 부하가 있는 머신의 최대 RSS가 줄고 auto-reply/확장 작업이 관련 없는 스위트를 굶주리게 하는 일을 피할 수 있습니다.
    - `pnpm test --watch`는 여전히 네이티브 루트 `vitest.config.ts` 프로젝트 그래프를 사용합니다. 다중 샤드 watch 루프는 실용적이지 않기 때문입니다.
    - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports`는 명시적 파일/디렉터리 타깃을 먼저 범위 지정 레인으로 라우팅하므로, `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`는 전체 루트 프로젝트 시작 비용을 치르지 않습니다.
    - `pnpm test:changed`는 기본적으로 변경된 git 경로를 저렴한 범위 지정 레인으로 확장합니다: 직접 테스트 편집, 형제 `*.test.ts` 파일, 명시적 소스 매핑, 로컬 import 그래프 의존 항목. 설정/셋업/패키지 편집은 명시적으로 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하지 않는 한 테스트를 광범위하게 실행하지 않습니다.
    - `pnpm check:changed`는 좁은 작업을 위한 일반적인 스마트 로컬 검사 게이트입니다. diff를 코어, 코어 테스트, 확장, 확장 테스트, 앱, 문서, 릴리스 메타데이터, 라이브 Docker 도구, 도구로 분류한 뒤 일치하는 타입 검사, lint, 가드 명령을 실행합니다. Vitest 테스트는 실행하지 않습니다. 테스트 증명이 필요하면 `pnpm test:changed` 또는 명시적 `pnpm test <target>`을 호출하세요. 릴리스 메타데이터 전용 버전 범프는 타깃 버전/설정/루트 의존성 검사를 실행하며, 최상위 버전 필드 밖의 패키지 변경을 거부하는 가드가 있습니다.
    - 라이브 Docker ACP harness 편집은 집중 검사를 실행합니다: 라이브 Docker 인증 스크립트의 셸 문법과 라이브 Docker 스케줄러 dry-run. `package.json` 변경은 diff가 `scripts["test:docker:live-*"]`로 제한된 경우에만 포함됩니다. 의존성, export, 버전 및 기타 패키지 표면 편집은 여전히 더 넓은 가드를 사용합니다.
    - agents, commands, plugins, auto-reply 헬퍼, `plugin-sdk` 및 유사한 순수 유틸리티 영역의 import가 가벼운 단위 테스트는 `unit-fast` 레인을 통과하며, 이 레인은 `test/setup-openclaw-runtime.ts`를 건너뜁니다. 상태가 있거나 런타임이 무거운 파일은 기존 레인에 남습니다.
    - 선택된 `plugin-sdk` 및 `commands` 헬퍼 소스 파일도 변경 모드 실행을 해당 가벼운 레인의 명시적 형제 테스트로 매핑하므로, 헬퍼 편집은 해당 디렉터리의 전체 무거운 스위트를 다시 실행하지 않습니다.
    - `auto-reply`에는 최상위 코어 헬퍼, 최상위 `reply.*` 통합 테스트, `src/auto-reply/reply/**` 하위 트리에 대한 전용 버킷이 있습니다. CI는 reply 하위 트리를 agent-runner, dispatch, commands/state-routing 샤드로 추가 분할하여 import가 무거운 버킷 하나가 전체 Node 꼬리를 소유하지 않도록 합니다.
    - 일반 PR/main CI는 의도적으로 확장 배치 스윕과 릴리스 전용 `agentic-plugins` 샤드를 건너뜁니다. 전체 릴리스 검증은 릴리스 후보에 대해 이러한 Plugin/확장 중심 스위트를 위한 별도 `Plugin Prerelease` 자식 워크플로를 디스패치합니다.

  </Accordion>

  <Accordion title="임베디드 runner 커버리지">

    - 메시지 도구 탐색 입력 또는 compaction 런타임
      컨텍스트를 변경할 때는 두 수준의 커버리지를 모두 유지하세요.
    - 순수 라우팅 및 정규화
      경계에는 집중 헬퍼 회귀 테스트를 추가하세요.
    - 임베디드 runner 통합 스위트를 건강하게 유지하세요:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, 그리고
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - 이 스위트들은 범위 지정 ID와 compaction 동작이 실제
      `run.ts` / `compact.ts` 경로를 통해 계속 흐르는지 검증합니다. 헬퍼 전용 테스트는
      이러한 통합 경로를 충분히 대체하지 못합니다.

  </Accordion>

  <Accordion title="Vitest pool 및 격리 기본값">

    - 기본 Vitest 설정은 `threads`를 기본값으로 사용합니다.
    - 공유 Vitest 설정은 `isolate: false`를 고정하고 루트 프로젝트, e2e, 라이브 설정 전반에서
      비격리 runner를 사용합니다.
    - 루트 UI 레인은 자체 `jsdom` 셋업과 옵티마이저를 유지하지만,
      공유 비격리 runner에서도 실행됩니다.
    - 각 `pnpm test` 샤드는 공유 Vitest 설정에서 동일한 `threads` + `isolate: false`
      기본값을 상속합니다.
    - `scripts/run-vitest.mjs`는 큰 로컬 실행 중 V8 컴파일 churn을 줄이기 위해 Vitest 자식 Node
      프로세스에 기본적으로 `--no-maglev`를 추가합니다.
      기본 V8 동작과 비교하려면 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`을 설정하세요.

  </Accordion>

  <Accordion title="빠른 로컬 반복">

    - `pnpm changed:lanes`는 diff가 어떤 아키텍처 레인을 트리거하는지 보여줍니다.
    - pre-commit hook은 포맷팅 전용입니다. 포맷된 파일을 다시 stage하며
      lint, 타입 검사, 테스트는 실행하지 않습니다.
    - 스마트 로컬 검사 게이트가 필요할 때는 인계 또는 push 전에
      `pnpm check:changed`를 명시적으로 실행하세요.
    - `pnpm test:changed`는 기본적으로 저렴한 범위 지정 레인을 통과합니다. agent가 harness, 설정, 패키지 또는 계약 편집에 더 넓은
      Vitest 커버리지가 정말 필요하다고 판단할 때만
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`를 사용하세요.
    - `pnpm test:max`와 `pnpm test:changed:max`는 동일한 라우팅
      동작을 유지하되, 더 높은 worker cap만 사용합니다.
    - 로컬 worker 자동 스케일링은 의도적으로 보수적이며 호스트 load average가 이미 높으면
      물러나므로, 여러 동시
      Vitest 실행이 기본적으로 덜 해를 끼칩니다.
    - 기본 Vitest 설정은 test
      wiring이 변경될 때 changed-mode 재실행이 올바르게 유지되도록 프로젝트/설정 파일을
      `forceRerunTriggers`로 표시합니다.
    - 설정은 지원되는 호스트에서 `OPENCLAW_VITEST_FS_MODULE_CACHE`를 활성화된 상태로 유지합니다.
      직접 프로파일링을 위한 명시적 캐시 위치 하나를 원하면 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`를 설정하세요.

  </Accordion>

  <Accordion title="성능 디버깅">

    - `pnpm test:perf:imports`는 Vitest import-duration 보고와
      import-breakdown 출력을 활성화합니다.
    - `pnpm test:perf:imports:changed`는 동일한 프로파일링 뷰를
      `origin/main` 이후 변경된 파일로 범위 지정합니다.
    - 샤드 타이밍 데이터는 `.artifacts/vitest-shard-timings.json`에 기록됩니다.
      전체 설정 실행은 설정 경로를 키로 사용합니다. include-pattern CI
      샤드는 필터링된 샤드를 별도로 추적할 수 있도록 샤드 이름을 덧붙입니다.
    - 하나의 hot test가 여전히 대부분의 시간을 시작 import에 쓰는 경우,
      무거운 의존성을 좁은 로컬 `*.runtime.ts` seam 뒤에 두고,
      단지 `vi.mock(...)`을 통과시키기 위해 런타임 헬퍼를 deep import하는 대신
      해당 seam을 직접 mock하세요.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>`는 해당 커밋된
      diff에 대해 라우팅된 `test:changed`와 네이티브 루트 프로젝트 경로를 비교하고
      wall time과 macOS 최대 RSS를 출력합니다.
    - `pnpm test:perf:changed:bench -- --worktree`는 변경된 파일 목록을
      `scripts/test-projects.mjs`와 루트 Vitest 설정을 통해 라우팅하여 현재
      dirty tree를 벤치마크합니다.
    - `pnpm test:perf:profile:main`은
      Vitest/Vite 시작과 transform 오버헤드를 위한 메인 스레드 CPU 프로파일을 기록합니다.
    - `pnpm test:perf:profile:runner`는 파일 병렬 처리를 비활성화한 상태에서
      단위 스위트에 대한 runner CPU+heap 프로파일을 기록합니다.

  </Accordion>
</AccordionGroup>

### 안정성(Gateway)

- 명령: `pnpm test:stability:gateway`
- 설정: `vitest.gateway.config.ts`, worker 하나로 강제
- 범위:
  - 진단이 기본적으로 활성화된 실제 loopback Gateway를 시작합니다
  - 진단 이벤트 경로를 통해 합성 gateway 메시지, 메모리, 대용량 페이로드 churn을 구동합니다
  - Gateway WS RPC를 통해 `diagnostics.stability`를 쿼리합니다
  - 진단 안정성 번들 영속화 헬퍼를 다룹니다
  - recorder가 bounded 상태를 유지하고, 합성 RSS 샘플이 압력 예산 아래에 머물며, 세션별 queue depth가 다시 0으로 drain되는지 assert합니다
- 기대 사항:
  - CI에 안전하고 키가 필요 없습니다
  - 안정성 회귀 후속 조치를 위한 좁은 레인이며, 전체 Gateway 스위트를 대체하지 않습니다

### E2E(Gateway smoke)

- 명령: `pnpm test:e2e`
- 구성: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin E2E 테스트
- 런타임 기본값:
  - 저장소의 나머지 부분과 일치하도록 `isolate: false`와 함께 Vitest `threads`를 사용합니다.
  - 적응형 워커를 사용합니다(CI: 최대 2개, 로컬: 기본값 1개).
  - 콘솔 I/O 오버헤드를 줄이기 위해 기본적으로 무음 모드로 실행됩니다.
- 유용한 오버라이드:
  - `OPENCLAW_E2E_WORKERS=<n>`으로 워커 수를 강제합니다(최대 16개).
  - `OPENCLAW_E2E_VERBOSE=1`로 상세 콘솔 출력을 다시 활성화합니다.
- 범위:
  - 다중 인스턴스 Gateway 엔드투엔드 동작
  - WebSocket/HTTP 표면, Node 페어링, 더 무거운 네트워킹
- 기대 사항:
  - CI에서 실행됩니다(파이프라인에서 활성화된 경우).
  - 실제 키가 필요하지 않습니다.
  - 단위 테스트보다 구성 요소가 더 많습니다(더 느릴 수 있음).

### E2E: OpenShell 백엔드 스모크

- 명령: `pnpm test:e2e:openshell`
- 파일: `extensions/openshell/src/backend.e2e.test.ts`
- 범위:
  - Docker를 통해 호스트에서 격리된 OpenShell Gateway를 시작합니다.
  - 임시 로컬 Dockerfile에서 샌드박스를 생성합니다.
  - 실제 `sandbox ssh-config` + SSH exec를 통해 OpenClaw의 OpenShell 백엔드를 실행합니다.
  - 샌드박스 fs 브리지를 통해 원격 기준 파일시스템 동작을 검증합니다.
- 기대 사항:
  - 옵트인 전용이며, 기본 `pnpm test:e2e` 실행의 일부가 아닙니다.
  - 로컬 `openshell` CLI와 작동하는 Docker 데몬이 필요합니다.
  - 격리된 `HOME` / `XDG_CONFIG_HOME`을 사용한 다음 테스트 Gateway와 샌드박스를 삭제합니다.
- 유용한 오버라이드:
  - 더 넓은 e2e 스위트를 수동으로 실행할 때 테스트를 활성화하려면 `OPENCLAW_E2E_OPENSHELL=1`을 사용합니다.
  - 기본이 아닌 CLI 바이너리나 래퍼 스크립트를 가리키려면 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`을 사용합니다.

### 라이브(실제 공급자 + 실제 모델)

- 명령: `pnpm test:live`
- 구성: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, 그리고 `extensions/` 아래의 번들 Plugin 라이브 테스트
- 기본값: `pnpm test:live`에서 **활성화됨**(`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - “이 공급자/모델이 실제 자격 증명으로 _오늘_ 실제로 작동하는가?”
  - 공급자 형식 변경, 도구 호출 특이점, 인증 문제, 속도 제한 동작 포착
- 기대 사항:
  - 설계상 CI에서 안정적이지 않습니다(실제 네트워크, 실제 공급자 정책, 할당량, 장애).
  - 비용이 발생하거나 속도 제한을 사용합니다.
  - “전체” 대신 좁힌 하위 집합을 실행하는 것이 좋습니다.
- 라이브 실행은 누락된 API 키를 가져오기 위해 `~/.profile`을 소스로 사용합니다.
- 기본적으로 라이브 실행은 여전히 `HOME`을 격리하고 구성/인증 자료를 임시 테스트 홈으로 복사하므로 단위 픽스처가 실제 `~/.openclaw`를 변경할 수 없습니다.
- 라이브 테스트가 실제 홈 디렉터리를 사용해야 하는 경우에만 `OPENCLAW_LIVE_USE_REAL_HOME=1`을 설정하세요.
- `pnpm test:live`는 이제 더 조용한 모드를 기본값으로 사용합니다. `[live] ...` 진행 출력은 유지하지만, 추가 `~/.profile` 알림을 억제하고 Gateway 부트스트랩 로그/Bonjour 잡담을 음소거합니다. 전체 시작 로그를 다시 원하면 `OPENCLAW_LIVE_TEST_QUIET=0`을 설정하세요.
- API 키 순환(공급자별): 쉼표/세미콜론 형식의 `*_API_KEYS` 또는 `*_API_KEY_1`, `*_API_KEY_2`(예: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`)를 설정하거나 `OPENCLAW_LIVE_*_KEY`로 라이브별 오버라이드를 설정하세요. 테스트는 속도 제한 응답에서 재시도합니다.
- 진행/Heartbeat 출력:
  - 이제 라이브 스위트는 긴 공급자 호출이 Vitest 콘솔 캡처가 조용할 때도 눈에 보이게 활성 상태임을 알 수 있도록 진행 줄을 stderr로 내보냅니다.
  - `vitest.live.config.ts`는 Vitest 콘솔 인터셉션을 비활성화하여 라이브 실행 중 공급자/Gateway 진행 줄이 즉시 스트리밍되도록 합니다.
  - 직접 모델 Heartbeat는 `OPENCLAW_LIVE_HEARTBEAT_MS`로 조정합니다.
  - Gateway/프로브 Heartbeat는 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`로 조정합니다.

## 어떤 스위트를 실행해야 하나요?

이 결정 표를 사용하세요.

- 로직/테스트 편집: `pnpm test`를 실행합니다(많이 변경했다면 `pnpm test:coverage`도 실행).
- Gateway 네트워킹 / WS 프로토콜 / 페어링 변경: `pnpm test:e2e`를 추가합니다.
- “내 봇이 중단됨” / 공급자별 실패 / 도구 호출 디버깅: 좁힌 `pnpm test:live`를 실행합니다.

## 라이브(네트워크 접촉) 테스트

라이브 모델 매트릭스, CLI 백엔드 스모크, ACP 스모크, Codex 앱 서버
하네스, 모든 미디어 공급자 라이브 테스트(Deepgram, BytePlus, ComfyUI, 이미지,
음악, 비디오, 미디어 하네스)와 라이브 실행의 자격 증명 처리는
[라이브 스위트 테스트](/ko/help/testing-live)를 참조하세요. 전용 업데이트 및
Plugin 검증 체크리스트는
[업데이트와 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.

## Docker 러너(선택적 "Linux에서 작동" 확인)

이 Docker 러너는 두 버킷으로 나뉩니다.

- 라이브 모델 러너: `test:docker:live-models`와 `test:docker:live-gateway`는 저장소 Docker 이미지 안에서 일치하는 프로필 키 라이브 파일만 실행합니다(`src/agents/models.profiles.live.test.ts` 및 `src/gateway/gateway-models.profiles.live.test.ts`). 로컬 구성 디렉터리와 작업 영역을 마운트합니다(마운트된 경우 `~/.profile`도 소스로 사용). 일치하는 로컬 엔트리포인트는 `test:live:models-profiles`와 `test:live:gateway-profiles`입니다.
- Docker 라이브 러너는 전체 Docker 스윕이 실용적으로 유지되도록 더 작은 스모크 상한을 기본값으로 사용합니다.
  `test:docker:live-models`의 기본값은 `OPENCLAW_LIVE_MAX_MODELS=12`이고,
  `test:docker:live-gateway`의 기본값은 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, 그리고
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`입니다. 더 큰 포괄 스캔을 명시적으로 원할 때는 해당 env vars를 오버라이드하세요.
- `test:docker:all`은 `test:docker:live-build`를 통해 라이브 Docker 이미지를 한 번 빌드하고, `scripts/package-openclaw-for-docker.mjs`를 통해 OpenClaw를 npm tarball로 한 번 패키징한 다음, 두 개의 `scripts/e2e/Dockerfile` 이미지를 빌드/재사용합니다. 베어 이미지는 설치/업데이트/Plugin 의존성 레인을 위한 Node/Git 러너일 뿐이며, 해당 레인은 사전 빌드된 tarball을 마운트합니다. 기능 이미지는 빌드된 앱 기능 레인을 위해 동일한 tarball을 `/app`에 설치합니다. Docker 레인 정의는 `scripts/lib/docker-e2e-scenarios.mjs`에 있고, 플래너 로직은 `scripts/lib/docker-e2e-plan.mjs`에 있으며, `scripts/test-docker-all.mjs`가 선택된 계획을 실행합니다. 집계는 가중치 기반 로컬 스케줄러를 사용합니다. `OPENCLAW_DOCKER_ALL_PARALLELISM`은 프로세스 슬롯을 제어하고, 리소스 상한은 무거운 라이브, npm-install, 다중 서비스 레인이 모두 동시에 시작되지 않도록 합니다. 단일 레인이 활성 상한보다 무거운 경우에도, 풀이 비어 있으면 스케줄러가 시작할 수 있고 이후 용량이 다시 사용 가능해질 때까지 단독으로 계속 실행합니다. 기본값은 10개 슬롯, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`입니다. Docker 호스트에 더 많은 여유가 있을 때만 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 또는 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`를 조정하세요. 러너는 기본적으로 Docker 사전 검사를 수행하고, 오래된 OpenClaw E2E 컨테이너를 제거하며, 30초마다 상태를 출력하고, 성공한 레인 타이밍을 `.artifacts/docker-tests/lane-timings.json`에 저장한 뒤 이후 실행에서 더 긴 레인을 먼저 시작하는 데 해당 타이밍을 사용합니다. Docker를 빌드하거나 실행하지 않고 가중치 레인 매니페스트를 출력하려면 `OPENCLAW_DOCKER_ALL_DRY_RUN=1`을 사용하고, 선택된 레인, 패키지/이미지 요구 사항, 자격 증명의 CI 계획을 출력하려면 `node scripts/test-docker-all.mjs --plan-json`를 사용하세요.
- `Package Acceptance`는 "이 설치 가능한 tarball이 제품으로 작동하는가?"를 검증하는 GitHub 네이티브 패키지 게이트입니다. `source=npm`, `source=ref`, `source=url`, 또는 `source=artifact`에서 하나의 후보 패키지를 확인하고, 이를 `package-under-test`로 업로드한 다음, 선택한 ref를 다시 패키징하는 대신 정확히 그 tarball을 대상으로 재사용 가능한 Docker E2E 레인을 실행합니다. 프로필은 폭 순서대로 `smoke`, `package`, `product`, `full`입니다. 패키지/업데이트/Plugin 계약, 게시된 업그레이드 생존자 매트릭스, 릴리스 기본값, 실패 분류는 [업데이트와 Plugin 테스트](/ko/help/testing-updates-plugins)를 참조하세요.
- 빌드 및 릴리스 검사는 tsdown 후 `scripts/check-cli-bootstrap-imports.mjs`를 실행합니다. 가드는 `dist/entry.js`와 `dist/cli/run-main.js`에서 정적 빌드 그래프를 순회하고, 명령 디스패치 전의 사전 디스패치 시작이 Commander, prompt UI, undici 또는 logging 같은 패키지 의존성을 가져오면 실패합니다. 또한 번들 Gateway 실행 청크를 예산 이하로 유지하고 알려진 콜드 Gateway 경로의 정적 import를 거부합니다. 패키징된 CLI 스모크는 루트 도움말, 온보드 도움말, doctor 도움말, 상태, 구성 스키마, 모델 목록 명령도 포함합니다.
- Package Acceptance 레거시 호환성은 `2026.4.25`(`2026.4.25-beta.*` 포함)까지로 제한됩니다. 해당 기준일까지 하네스는 배송된 패키지 메타데이터 공백만 허용합니다. 누락된 비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`, tarball에서 파생된 git 픽스처의 누락된 패치 파일, 누락된 영속 `update.channel`, 레거시 Plugin 설치 기록 위치, 누락된 marketplace 설치 기록 영속성, `plugins update` 중 구성 메타데이터 마이그레이션입니다. `2026.4.25` 이후 패키지에서는 이러한 경로가 엄격한 실패입니다.
- 컨테이너 스모크 러너: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, 그리고 `test:docker:config-reload`는 하나 이상의 실제 컨테이너를 부팅하고 더 높은 수준의 통합 경로를 검증합니다.

라이브 모델 Docker 러너는 필요한 CLI 인증 홈만(또는 실행이 좁혀지지 않은 경우 지원되는 모든 홈을) 바인드 마운트한 다음, 실행 전에 이를 컨테이너 홈으로 복사하므로 외부 CLI OAuth가 호스트 인증 저장소를 변경하지 않고 토큰을 갱신할 수 있습니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- ACP 바인드 스모크: `pnpm test:docker:live-acp-bind` (스크립트: `scripts/test-live-acp-bind-docker.sh`; 기본적으로 Claude, Codex, Gemini를 다루며, `pnpm test:docker:live-acp-bind:droid` 및 `pnpm test:docker:live-acp-bind:opencode`를 통해 엄격한 Droid/OpenCode 커버리지를 제공합니다)
- CLI 백엔드 스모크: `pnpm test:docker:live-cli-backend` (스크립트: `scripts/test-live-cli-backend-docker.sh`)
- Codex 앱 서버 하네스 스모크: `pnpm test:docker:live-codex-harness` (스크립트: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 개발 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 관측 가능성 스모크: `pnpm qa:otel:smoke`는 비공개 QA 소스 체크아웃 레인입니다. npm tarball은 QA Lab을 생략하므로 의도적으로 패키지 Docker 릴리스 레인에 포함되지 않습니다.
- Open WebUI 라이브 스모크: `pnpm test:docker:openwebui` (스크립트: `scripts/e2e/openwebui-docker.sh`)
- 온보딩 마법사(TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- Npm tarball 온보딩/채널/에이전트 스모크: `pnpm test:docker:npm-onboard-channel-agent`는 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, env-ref 온보딩과 기본 Telegram을 통해 OpenAI를 구성하고, doctor를 실행한 다음 모의 OpenAI 에이전트 턴 하나를 실행합니다. `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 미리 빌드된 tarball을 재사용하거나, `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`으로 호스트 재빌드를 건너뛰거나, `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 또는 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`으로 채널을 전환합니다.
- 업데이트 채널 전환 스모크: `pnpm test:docker:update-channel-switch`는 패키징된 OpenClaw tarball을 Docker에 전역 설치하고, 패키지 `stable`에서 git `dev`로 전환하고, 유지된 채널과 Plugin 업데이트 후 동작을 검증한 다음, 다시 패키지 `stable`로 전환하고 업데이트 상태를 확인합니다.
- 업그레이드 생존자 스모크: `pnpm test:docker:upgrade-survivor`는 에이전트, 채널 구성, Plugin 허용 목록, 오래된 Plugin 의존성 상태, 기존 워크스페이스/세션 파일이 있는 지저분한 기존 사용자 픽스처 위에 패키징된 OpenClaw tarball을 설치합니다. 라이브 공급자나 채널 키 없이 패키지 업데이트와 비대화형 doctor를 실행한 다음, loopback Gateway를 시작하고 시작/상태 예산과 함께 구성/상태 보존을 확인합니다.
- 게시된 업그레이드 생존자 스모크: `pnpm test:docker:published-upgrade-survivor`는 기본적으로 `openclaw@latest`를 설치하고, 현실적인 기존 사용자 파일을 시드하고, 내장된 명령 레시피로 해당 기준선을 구성하고, 결과 구성을 검증하고, 게시된 설치를 후보 tarball로 업데이트하고, 비대화형 doctor를 실행하고, `.artifacts/upgrade-survivor/summary.json`을 작성한 다음, loopback Gateway를 시작하고 구성된 인텐트, 상태 보존, 시작, `/healthz`, `/readyz`, RPC 상태 예산을 확인합니다. `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`로 기준선 하나를 재정의하고, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`로 집계 스케줄러에 `all-since-2026.4.23` 같은 정확한 기준선을 확장하도록 요청하고, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`로 `reported-issues` 같은 이슈 형태의 픽스처를 확장합니다. reported-issues 세트에는 자동 외부 OpenClaw Plugin 설치 복구를 위한 `configured-plugin-installs`가 포함됩니다. Package Acceptance는 이를 `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, `published_upgrade_survivor_scenarios`로 노출합니다. Full Release Validation은 차단 경로에서 기본 최신 기준선을 사용하고, `run_release_soak=true` 또는 `release_profile=full`에 대해서만 all-since/reported-issues로 확장합니다.
- 세션 런타임 컨텍스트 스모크: `pnpm test:docker:session-runtime-context`는 숨겨진 런타임 컨텍스트 트랜스크립트 지속성과 영향받은 중복 prompt-rewrite 브랜치의 doctor 복구를 검증합니다.
- Bun 전역 설치 스모크: `bash scripts/e2e/bun-global-install-smoke.sh`는 현재 트리를 패키징하고, 격리된 홈에서 `bun install -g`로 설치한 다음, `openclaw infer image providers --json`이 멈추지 않고 번들 이미지 공급자를 반환하는지 검증합니다. `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`로 미리 빌드된 tarball을 재사용하거나, `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`으로 호스트 빌드를 건너뛰거나, `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`로 빌드된 Docker 이미지에서 `dist/`를 복사합니다.
- 설치 프로그램 Docker 스모크: `bash scripts/test-install-sh-docker.sh`는 root, update, direct-npm 컨테이너 전반에서 하나의 npm 캐시를 공유합니다. 업데이트 스모크는 후보 tarball로 업그레이드하기 전에 안정 기준선으로 기본 npm `latest`를 사용합니다. 로컬에서는 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`로, GitHub에서는 Install Smoke 워크플로의 `update_baseline_version` 입력으로 재정의합니다. 비 root 설치 프로그램 확인은 root 소유 캐시 항목이 사용자 로컬 설치 동작을 가리지 않도록 격리된 npm 캐시를 유지합니다. 로컬 재실행 전반에서 root/update/direct-npm 캐시를 재사용하려면 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`를 설정합니다.
- Install Smoke CI는 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`로 중복 direct-npm 전역 업데이트를 건너뜁니다. 직접 `npm install -g` 커버리지가 필요할 때는 해당 env 없이 로컬에서 스크립트를 실행합니다.
- 에이전트 공유 워크스페이스 삭제 CLI 스모크: `pnpm test:docker:agents-delete-shared-workspace` (스크립트: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)는 기본적으로 루트 Dockerfile 이미지를 빌드하고, 격리된 컨테이너 홈에 하나의 워크스페이스를 가진 두 에이전트를 시드하고, `agents delete --json`을 실행한 다음, 유효한 JSON과 유지된 워크스페이스 동작을 검증합니다. `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`로 install-smoke 이미지를 재사용합니다.
- Gateway 네트워킹(두 컨테이너, WS 인증 + 상태 확인): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- 브라우저 CDP 스냅샷 스모크: `pnpm test:docker:browser-cdp-snapshot` (스크립트: `scripts/e2e/browser-cdp-snapshot-docker.sh`)는 소스 E2E 이미지와 Chromium 레이어를 빌드하고, 원시 CDP로 Chromium을 시작하고, `browser doctor --deep`을 실행한 다음, CDP 역할 스냅샷이 링크 URL, 커서 승격 클릭 가능 요소, iframe refs, 프레임 메타데이터를 포함하는지 검증합니다.
- OpenAI Responses web_search minimal reasoning 회귀: `pnpm test:docker:openai-web-search-minimal` (스크립트: `scripts/e2e/openai-web-search-minimal-docker.sh`)는 모의 OpenAI 서버를 Gateway를 통해 실행하고, `web_search`가 `reasoning.effort`를 `minimal`에서 `low`로 올리는지 검증한 다음, 공급자 스키마 거부를 강제로 발생시키고 원시 세부 정보가 Gateway 로그에 표시되는지 확인합니다.
- MCP 채널 브리지(시드된 Gateway + stdio 브리지 + 원시 Claude notification-frame 스모크): `pnpm test:docker:mcp-channels` (스크립트: `scripts/e2e/mcp-channels-docker.sh`)
- Pi 번들 MCP 도구(실제 stdio MCP 서버 + 내장 Pi 프로필 허용/거부 스모크): `pnpm test:docker:pi-bundle-mcp-tools` (스크립트: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/하위 에이전트 MCP 정리(실제 Gateway + 격리된 Cron 및 일회성 하위 에이전트 실행 후 stdio MCP 자식 종료): `pnpm test:docker:cron-mcp-cleanup` (스크립트: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins(로컬 경로, `file:`, 호이스트된 의존성이 있는 npm 레지스트리, git 이동 refs, ClawHub kitchen-sink, 마켓플레이스 업데이트, Claude-bundle 활성화/검사를 위한 설치/업데이트 스모크): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)
  ClawHub 블록을 건너뛰려면 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`을 설정하거나, `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 및 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`로 기본 kitchen-sink 패키지/런타임 쌍을 재정의합니다. `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`이 없으면 테스트는 완전 격리된 로컬 ClawHub 픽스처 서버를 사용합니다.
- Plugin 업데이트 변경 없음 스모크: `pnpm test:docker:plugin-update` (스크립트: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin 수명 주기 매트릭스 스모크: `pnpm test:docker:plugin-lifecycle-matrix`는 빈 컨테이너에 패키징된 OpenClaw tarball을 설치하고, npm Plugin을 설치하고, 활성화/비활성화를 전환하고, 로컬 npm 레지스트리를 통해 업그레이드 및 다운그레이드하고, 설치된 코드를 삭제한 다음, 각 수명 주기 단계의 RSS/CPU 메트릭을 기록하면서 제거가 여전히 오래된 상태를 제거하는지 검증합니다.
- 구성 다시 로드 메타데이터 스모크: `pnpm test:docker:config-reload` (스크립트: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`는 로컬 경로, `file:`, 호이스트된 의존성이 있는 npm 레지스트리, git 이동 refs, ClawHub 픽스처, 마켓플레이스 업데이트, Claude-bundle 활성화/검사에 대한 설치/업데이트 스모크를 다룹니다. `pnpm test:docker:plugin-update`는 설치된 Plugins의 변경 없는 업데이트 동작을 다룹니다. `pnpm test:docker:plugin-lifecycle-matrix`는 리소스 추적 npm Plugin 설치, 활성화, 비활성화, 업그레이드, 다운그레이드, 누락된 코드 제거를 다룹니다.

공유 함수형 이미지를 수동으로 미리 빌드하고 재사용하려면:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 같은 스위트별 이미지 재정의는 설정된 경우 여전히 우선합니다. `OPENCLAW_SKIP_DOCKER_BUILD=1`이 원격 공유 이미지를 가리키면, 스크립트는 해당 이미지가 아직 로컬에 없을 때 가져옵니다. QR 및 설치 프로그램 Docker 테스트는 공유 빌드 앱 런타임이 아니라 패키지/설치 동작을 검증하므로 자체 Dockerfile을 유지합니다.

라이브 모델 Docker 러너는 현재 체크아웃도 읽기 전용으로 bind-mount하고
컨테이너 안의 임시 workdir로 스테이징합니다. 이렇게 하면 런타임
이미지를 슬림하게 유지하면서도 정확한 로컬 소스/구성을 대상으로 Vitest를 실행할 수 있습니다.
스테이징 단계는 `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, 앱 로컬 `.build` 또는
Gradle 출력 디렉터리처럼 큰 로컬 전용 캐시와 앱 빌드 출력을 건너뛰므로
Docker 라이브 실행이 머신별 아티팩트를 복사하는 데 몇 분을 쓰지 않습니다.
또한 `OPENCLAW_SKIP_CHANNELS=1`을 설정하여 Gateway 라이브 프로브가 컨테이너 안에서
실제 Telegram/Discord/기타 채널 워커를 시작하지 않게 합니다.
`test:docker:live-models`는 여전히 `pnpm test:live`를 실행하므로 해당 Docker lane에서
Gateway 라이브 커버리지를 좁히거나 제외해야 할 때는 `OPENCLAW_LIVE_GATEWAY_*`도 함께 전달하세요.
`test:docker:openwebui`는 더 높은 수준의 호환성 smoke입니다. OpenAI 호환 HTTP 엔드포인트가 활성화된
OpenClaw Gateway 컨테이너를 시작하고, 그 Gateway를 대상으로 고정된 Open WebUI 컨테이너를 시작한 다음,
Open WebUI를 통해 로그인하고, `/api/models`가 `openclaw/default`를 노출하는지 확인한 뒤,
Open WebUI의 `/api/chat/completions` 프록시를 통해 실제 채팅 요청을 보냅니다.
첫 실행은 Docker가 Open WebUI 이미지를 가져와야 하거나 Open WebUI가 자체 cold-start 설정을
끝내야 할 수 있어서 눈에 띄게 느릴 수 있습니다.
이 lane은 사용할 수 있는 라이브 모델 키를 기대하며, Docker화된 실행에서는
`OPENCLAW_PROFILE_FILE`(`~/.profile`이 기본값)이 이를 제공하는 주된 방법입니다.
성공한 실행은 `{ "ok": true, "model": "openclaw/default", ... }` 같은 작은 JSON 페이로드를 출력합니다.
`test:docker:mcp-channels`는 의도적으로 결정적이며 실제 Telegram, Discord 또는 iMessage 계정이 필요하지 않습니다. seeded Gateway
컨테이너를 부팅하고, `openclaw mcp serve`를 생성하는 두 번째 컨테이너를 시작한 다음,
라우팅된 대화 발견, transcript 읽기, 첨부 파일 메타데이터,
라이브 이벤트 큐 동작, outbound 전송 라우팅, 실제 stdio MCP 브리지를 통한 Claude 스타일 채널 +
권한 알림을 검증합니다. 알림 검사는 원시 stdio MCP 프레임을 직접 검사하므로
smoke는 특정 클라이언트 SDK가 우연히 노출하는 것만이 아니라
브리지가 실제로 내보내는 것을 검증합니다.
`test:docker:pi-bundle-mcp-tools`는 결정적이며 라이브 모델 키가 필요하지 않습니다.
repo Docker 이미지를 빌드하고, 컨테이너 안에서 실제 stdio MCP 프로브 서버를 시작하고,
임베디드 Pi bundle MCP 런타임을 통해 해당 서버를 materialize하고,
도구를 실행한 다음, `coding`과 `messaging`은 `bundle-mcp` 도구를 유지하는 반면
`minimal`과 `tools.deny: ["bundle-mcp"]`는 이를 필터링하는지 확인합니다.
`test:docker:cron-mcp-cleanup`은 결정적이며 라이브 모델 키가 필요하지 않습니다.
실제 stdio MCP 프로브 서버가 있는 seeded Gateway를 시작하고,
격리된 cron turn과 `/subagents spawn` one-shot child turn을 실행한 다음,
각 실행 후 MCP child process가 종료되는지 확인합니다.

수동 ACP 일반 언어 thread smoke(CI 아님):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 회귀/디버그 워크플로를 위해 이 스크립트를 유지하세요. ACP thread 라우팅 검증에 다시 필요할 수 있으므로 삭제하지 마세요.

유용한 env vars:

- `OPENCLAW_CONFIG_DIR=...`(기본값: `~/.openclaw`)는 `/home/node/.openclaw`에 마운트됩니다
- `OPENCLAW_WORKSPACE_DIR=...`(기본값: `~/.openclaw/workspace`)는 `/home/node/.openclaw/workspace`에 마운트됩니다
- `OPENCLAW_PROFILE_FILE=...`(기본값: `~/.profile`)는 `/home/node/.profile`에 마운트되며 테스트 실행 전에 source됩니다
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`은 임시 config/workspace 디렉터리를 사용하고 외부 CLI auth 마운트 없이 `OPENCLAW_PROFILE_FILE`에서 source된 env vars만 검증합니다
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`(기본값: `~/.cache/openclaw/docker-cli-tools`)는 Docker 안의 캐시된 CLI 설치를 위해 `/home/node/.npm-global`에 마운트됩니다
- `$HOME` 아래의 외부 CLI auth 디렉터리/파일은 `/host-auth...` 아래에 읽기 전용으로 마운트된 다음, 테스트 시작 전에 `/home/node/...`로 복사됩니다
  - 기본 디렉터리: `.minimax`
  - 기본 파일: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 좁혀진 provider 실행은 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`에서 추론한 필요한 디렉터리/파일만 마운트합니다
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` 또는 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 같은 쉼표 목록으로 수동 override하세요
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`로 실행 범위를 좁힙니다
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`로 컨테이너 안의 provider를 필터링합니다
- `OPENCLAW_SKIP_DOCKER_BUILD=1`은 rebuild가 필요 없는 재실행에서 기존 `openclaw:local-live` 이미지를 재사용합니다
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`은 creds가 env가 아닌 profile store에서 오도록 보장합니다
- `OPENCLAW_OPENWEBUI_MODEL=...`은 Open WebUI smoke를 위해 Gateway가 노출하는 모델을 선택합니다
- `OPENCLAW_OPENWEBUI_PROMPT=...`은 Open WebUI smoke가 사용하는 nonce-check prompt를 override합니다
- `OPENWEBUI_IMAGE=...`은 고정된 Open WebUI 이미지 태그를 override합니다

## Docs sanity

문서 수정 후 docs check를 실행하세요: `pnpm check:docs`.
in-page heading check까지 필요할 때 전체 Mintlify anchor 검증을 실행하세요: `pnpm docs:check-links:anchors`.

## 오프라인 회귀(CI 안전)

실제 provider 없는 “실제 pipeline” 회귀입니다:

- Gateway 도구 호출(mock OpenAI, 실제 Gateway + agent loop): `src/gateway/gateway.test.ts`(케이스: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard(WS `wizard.start`/`wizard.next`, config 작성 + auth 강제): `src/gateway/gateway.test.ts`(케이스: "runs wizard over ws and writes auth token config")

## Agent 안정성 evals(Skills)

이미 “agent 안정성 evals”처럼 동작하는 몇 가지 CI 안전 테스트가 있습니다:

- 실제 Gateway + agent loop를 통한 mock 도구 호출(`src/gateway/gateway.test.ts`).
- session wiring과 config 효과를 검증하는 end-to-end wizard flow(`src/gateway/gateway.test.ts`).

Skills에 아직 빠진 것([Skills](/ko/tools/skills) 참고):

- **Decisioning:** prompt에 Skills가 나열되어 있을 때 agent가 올바른 skill을 선택하는가(또는 관련 없는 것을 피하는가)?
- **Compliance:** agent가 사용 전에 `SKILL.md`를 읽고 필요한 단계/args를 따르는가?
- **Workflow contracts:** tool order, session history carryover, sandbox boundary를 assert하는 multi-turn scenario.

향후 evals는 먼저 결정적으로 유지해야 합니다:

- mock provider를 사용해 tool call + order, skill file read, session wiring을 assert하는 scenario runner.
- skill 중심 scenario의 작은 suite(use vs avoid, gating, prompt injection).
- CI 안전 suite가 마련된 뒤에만 선택적 라이브 evals(opt-in, env-gated).

## Contract tests(Plugin 및 채널 shape)

Contract tests는 등록된 모든 Plugin과 채널이 해당 interface contract를 준수하는지 검증합니다.
발견된 모든 Plugin을 순회하고 shape 및 동작 assertion suite를 실행합니다.
기본 `pnpm test` unit lane은 이러한 공유 seam 및 smoke 파일을 의도적으로 건너뜁니다.
공유 채널 또는 provider surface를 건드릴 때는 contract command를 명시적으로 실행하세요.

### Commands

- 모든 contracts: `pnpm test:contracts`
- 채널 contracts만: `pnpm test:contracts:channels`
- Provider contracts만: `pnpm test:contracts:plugins`

### 채널 contracts

`src/channels/plugins/contracts/*.contract.test.ts`에 있습니다:

- **plugin** - 기본 Plugin shape(id, name, capabilities)
- **setup** - 설정 wizard contract
- **session-binding** - Session binding 동작
- **outbound-payload** - 메시지 payload 구조
- **inbound** - Inbound 메시지 처리
- **actions** - 채널 action handler
- **threading** - Thread ID 처리
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts`에 있습니다.

- **status** - 채널 status probe
- **registry** - Plugin registry shape

### Provider contracts

`src/plugins/contracts/*.contract.test.ts`에 있습니다:

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - 설정 wizard

### 실행 시점

- plugin-sdk exports 또는 subpath를 변경한 후
- 채널 또는 provider Plugin을 추가하거나 수정한 후
- Plugin registration 또는 discovery를 refactor한 후

Contract tests는 CI에서 실행되며 실제 API 키가 필요하지 않습니다.

## 회귀 추가(가이드)

라이브에서 발견한 provider/model 문제를 고칠 때:

- 가능하면 CI 안전 회귀를 추가하세요(mock/stub provider 또는 정확한 request-shape transformation 캡처)
- 본질적으로 live-only(rate limits, auth policies)라면 live test를 좁게 유지하고 env vars를 통해 opt-in으로 둡니다
- 버그를 잡는 가장 작은 layer를 대상으로 삼는 것을 선호하세요:
  - provider request conversion/replay 버그 → 직접 models test
  - Gateway session/history/tool pipeline 버그 → Gateway live smoke 또는 CI 안전 Gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`는 registry metadata(`listSecretTargetRegistryEntries()`)에서 SecretRef class별 sampled target 하나를 derive한 다음 traversal-segment exec ids가 거부되는지 assert합니다.
  - `src/secrets/target-registry-data.ts`에 새 `includeInPlan` SecretRef target family를 추가하면 해당 테스트의 `classifyTargetClass`를 업데이트하세요. 이 테스트는 분류되지 않은 target ids에서 의도적으로 실패하므로 새 class가 조용히 건너뛰어질 수 없습니다.

## 관련 항목

- [라이브 테스트](/ko/help/testing-live)
- [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)
- [CI](/ko/ci)
