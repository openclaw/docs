---
read_when:
    - QA 스택이 어떻게 맞물리는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장하기
    - 저장소 기반 QA 시나리오 추가
    - Gateway 대시보드 주변에 더 높은 현실성의 QA 자동화 구축
summary: 'QA 스택 개요: qa-lab, qa-channel, 리포지토리 기반 시나리오, 라이브 전송 레인, 전송 어댑터, 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-06-27T17:25:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적인,
채널 형태의 방식으로 OpenClaw를 실행해 보기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 편집, 삭제 표면을 갖춘 합성 메시지 채널.
- `extensions/qa-lab`: transcript를 관찰하고,
  인바운드 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스.
- `extensions/qa-matrix`, 향후 runner Plugin: 자식 QA gateway 안에서
  실제 채널을 구동하는 라이브 전송 어댑터.
- `qa/`: kickoff 작업과 기준 QA
  시나리오를 위한 저장소 기반 시드 자산.
- [Mantis](/ko/concepts/mantis): 실제 전송, 브라우저 스크린샷,
  VM 상태, PR 증거가 필요한 버그를 위한 라이브 검증 전후 실행.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 다수는 `pnpm qa:*`
스크립트 별칭을 갖고 있으며, 두 형식 모두 지원됩니다.

| 명령                                                | 목적                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | `--qa-profile` 없이 번들된 QA 자체 점검을 실행합니다. `--qa-profile smoke-ci`, `--qa-profile release`, 또는 `--qa-profile all`을 사용하는 taxonomy 기반 maturity profile runner입니다.                                                                                   |
| `qa suite`                                          | 저장소 기반 시나리오를 QA Gateway lane에 대해 실행합니다. 별칭: 일회용 Linux VM을 위한 `pnpm openclaw qa suite --runner multipass`.                                                                                                                                       |
| `qa coverage`                                       | YAML 시나리오 coverage inventory를 출력합니다(기계 출력은 `--json`).                                                                                                                                                                                                      |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 agentic parity 보고서를 작성하거나, `--runtime-axis --token-efficiency`를 사용해 하나의 runtime-pair summary에서 Codex-vs-OpenClaw runtime parity 및 token-efficiency 보고서를 작성합니다.                                  |
| `qa character-eval`                                 | 여러 라이브 모델에 걸쳐 character QA 시나리오를 실행하고 judged report를 생성합니다. [보고](#reporting)를 참고하세요.                                                                                                                                                    |
| `qa manual`                                         | 선택된 provider/model lane에 대해 일회성 프롬프트를 실행합니다.                                                                                                                                                                                                          |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                                                                                                        |
| `qa docker-build-image`                             | 사전 빌드된 QA Docker 이미지를 빌드합니다.                                                                                                                                                                                                                               |
| `qa docker-scaffold`                                | QA dashboard + Gateway lane을 위한 docker-compose scaffold를 작성합니다.                                                                                                                                                                                                 |
| `qa up`                                             | QA 사이트를 빌드하고, Docker 기반 스택을 시작하며, URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다).                                                                                         |
| `qa aimock`                                         | AIMock provider 서버만 시작합니다.                                                                                                                                                                                                                                       |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` provider 서버만 시작합니다.                                                                                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex credential pool을 관리합니다.                                                                                                                                                                                                                                |
| `qa matrix`                                         | 일회용 Tuwunel homeserver에 대한 라이브 transport lane입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참고하세요.                                                                                                                                                             |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹에 대한 라이브 transport lane입니다.                                                                                                                                                                                                            |
| `qa discord`                                        | 실제 비공개 Discord guild 채널에 대한 라이브 transport lane입니다.                                                                                                                                                                                                       |
| `qa slack`                                          | 실제 비공개 Slack 채널에 대한 라이브 transport lane입니다.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | 실제 WhatsApp Web 계정에 대한 라이브 transport lane입니다.                                                                                                                                                                                                               |
| `qa mantis`                                         | 라이브 transport 버그를 위한 검증 전후 runner로, Discord 상태 반응 증거, Crabbox desktop/browser smoke, Slack-in-VNC smoke를 포함합니다. [Mantis](/ko/concepts/mantis) 및 [Mantis Slack Desktop 런북](/ko/concepts/mantis-slack-desktop-runbook)을 참고하세요.                |

Profile 기반 `qa run`은 `taxonomy.yaml`에서 membership을 읽은 다음,
해결된 시나리오를 `qa suite`를 통해 dispatch합니다. `--surface`와
`--category`는 별도 lane을 정의하는 대신 선택된 profile을 필터링합니다.
결과 `qa-evidence.json`에는 선택된 category 수와 누락된 coverage ID가 포함된
profile scorecard summary가 들어갑니다. 개별 evidence entry는 테스트,
coverage 역할, 결과에 대한 신뢰 가능한 원천으로 유지됩니다.
Taxonomy feature coverage ID는 별칭이 아니라 정확한 proof target입니다. Primary
scenario coverage는 일치하는 ID를 충족하며, secondary coverage는 advisory로 유지됩니다.
Coverage ID는 소문자 영숫자/대시 segment가 포함된 dotted
`namespace.behavior` 형식을 사용합니다. profile, surface, category ID는 기존의 dashed 또는 dotted taxonomy ID를 계속 사용할 수 있습니다.
Slim evidence는 entry별 `execution`을 생략하고 `evidenceMode: "slim"`을 설정합니다.
`smoke-ci`는 기본적으로 slim을 사용하며, `--evidence-mode full`은 전체 entry를 복원합니다.

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Mock model provider와 Crabline fake provider server를 사용하는 결정적 profile proof에는
`smoke-ci`를 사용하세요. 라이브 채널에 대한 Stable/LTS proof에는 `release`를 사용하세요.
`all`은 명시적인 전체 taxonomy evidence run에만 사용하세요. 이는 모든 활성 maturity category를 선택하며
`qa_profile=all`과 함께 `QA Profile
Evidence` workflow를 통해 dispatch할 수 있습니다. 명령에 OpenClaw
root profile도 필요하면, QA 명령 앞에 root profile을 두세요.

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 운영자 흐름

현재 QA 운영자 흐름은 2패널 QA 사이트입니다.

- 왼쪽: agent가 있는 Gateway dashboard(Control UI).
- 오른쪽: Slack과 비슷한 transcript 및 시나리오 계획을 보여주는 QA Lab.

다음으로 실행하세요.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 Gateway lane을 시작하며,
운영자 또는 automation loop가 agent에 QA
mission을 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했는지, 실패했는지, 또는
차단 상태로 남았는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 QA Lab UI를 더 빠르게 반복하려면,
bind-mounted QA Lab bundle로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지에 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 bind-mount합니다. `qa:lab:watch`는
변경 시 해당 bundle을 다시 빌드하며, QA Lab
asset hash가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

로컬 OpenTelemetry signal smoke의 경우 다음을 실행하세요.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP receiver를 시작하고, `diagnostics-otel` Plugin이 활성화된 상태로
`otel-trace-smoke` QA
시나리오를 실행한 다음 traces,
metrics, logs가 export되는지 assert합니다. Export된 protobuf trace span을 decode하고
release-critical shape를 확인합니다.
`openclaw.run`, `openclaw.harness.run`, 최신 GenAI semantic-convention
model-call span, `openclaw.context.assembled`, `openclaw.message.delivery`가
반드시 있어야 합니다. Smoke는
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`을 강제하므로 model-call
span은 `{gen_ai.operation.name} {gen_ai.request.model}` 이름을 사용해야 합니다.
성공한 turn에서 model call은 `StreamAbandoned`를 export해서는 안 됩니다. raw diagnostic ID와
`openclaw.content.*` attribute는 trace에 포함되지 않아야 합니다. Raw OTLP
payload에는 prompt sentinel, response sentinel, QA session
key가 포함되면 안 됩니다. QA suite artifact 옆에 `otel-smoke-summary.json`을 작성합니다.

Collector 기반 OpenTelemetry smoke의 경우 다음을 실행하세요.

```bash
pnpm qa:otel:collector-smoke
```

이 lane은 동일한 로컬 receiver 앞에 실제 OpenTelemetry Collector Docker 컨테이너를 둡니다.
Endpoint wiring, collector
compatibility, 또는 in-process receiver가 가릴 수 있는 OTLP export behavior를 변경할 때 사용하세요.

보호된 Prometheus scrape smoke의 경우 다음을 실행하세요.

```bash
pnpm qa:prometheus:smoke
```

이 별칭은 `diagnostics-prometheus`가 활성화된 `docker-prometheus-smoke` QA 시나리오를 실행하고, 인증되지 않은 스크레이프가 거부되는지 확인한 다음, 인증된 스크레이프에 프롬프트 내용, 응답 내용, 원시 진단 식별자, 인증 토큰 또는 로컬 경로 없이 릴리스에 중요한 메트릭 패밀리가 포함되어 있는지 확인합니다.

두 관찰 가능성 스모크를 연달아 실행하려면 다음을 사용하세요.

```bash
pnpm qa:observability:smoke
```

컬렉터 기반 OpenTelemetry 레인과 보호된 Prometheus 스크레이프 스모크를 함께 사용하려면 다음을 사용하세요.

```bash
pnpm qa:observability:collector-smoke
```

관찰 가능성 QA는 소스 체크아웃 전용으로 유지됩니다. npm tarball은 의도적으로 QA Lab을 제외하므로 패키지 Docker 릴리스 레인은 `qa` 명령을 실행하지 않습니다. 진단 계측을 변경할 때는 빌드된 소스 체크아웃에서 `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` 또는 `pnpm qa:observability:smoke`를 사용하세요.

모델 제공자 자격 증명이 필요 없는 실제 전송 Matrix 스모크 레인의 경우, 결정적 모의 OpenAI 제공자와 함께 빠른 프로필을 실행하세요.

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

라이브 프런티어 제공자 레인의 경우 OpenAI 호환 자격 증명을 명시적으로 제공하세요.

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, 환경 변수, 아티팩트 레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 개요: Docker에서 일회용 Tuwunel homeserver를 프로비저닝하고, 임시 드라이버/SUT/관찰자 사용자를 등록하고, 해당 전송 범위로 제한된 자식 QA gateway 안에서 실제 Matrix Plugin을 실행하며(`qa-channel` 없음), 그런 다음 Markdown 보고서, JSON 요약, 관찰된 이벤트 아티팩트, 결합 출력 로그를 `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 작성합니다.

시나리오는 단위 테스트만으로는 종단 간 증명할 수 없는 전송 동작을 다룹니다. 멘션 게이팅, allow-bot 정책, allowlist, 최상위 및 스레드 답장, DM 라우팅, 반응 처리, 인바운드 편집 억제, 재시작 재생 중복 제거, homeserver 중단 복구, 승인 메타데이터 전달, 미디어 처리, Matrix E2EE 부트스트랩/복구/검증 흐름입니다. E2EE CLI 프로필은 Gateway 답장을 확인하기 전에 동일한 일회용 homeserver를 통해 `openclaw matrix encryption setup` 및 검증 명령도 구동합니다.

Discord에는 버그 재현을 위한 Mantis 전용 옵트인 시나리오도 있습니다. 명시적 상태 반응 타임라인에는 `--scenario discord-status-reactions-tool-only`를 사용하고, 실제 Discord 스레드를 생성해 `message.thread-reply`가 `filePath` 첨부 파일을 보존하는지 확인하려면 `--scenario discord-thread-reply-filepath-attachment`를 사용하세요. 이러한 시나리오는 광범위한 스모크 커버리지가 아니라 전/후 재현 프로브이므로 기본 라이브 Discord 레인에서 제외됩니다. QA 환경에 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 또는 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`가 구성되어 있으면, 스레드 첨부 Mantis 워크플로는 로그인된 Discord Web 증거 비디오도 추가할 수 있습니다. 해당 뷰어 프로필은 시각적 캡처 전용이며, 통과/실패 결정은 여전히 Discord REST oracle에서 나옵니다.

CI는 `.github/workflows/qa-live-transports-convex.yml`에서 동일한 명령 표면을 사용합니다. 예약 실행과 기본 수동 실행은 QA 제공 라이브 프런티어 자격 증명, `--fast`, `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`을 사용해 빠른 Matrix 프로필을 실행합니다. 수동 `matrix_profile=all`은 다섯 개 프로필 샤드로 팬아웃됩니다.

실제 전송 Telegram, Discord, Slack, WhatsApp 스모크 레인의 경우:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

이들은 두 개의 봇 또는 계정(드라이버 + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 환경 변수, 시나리오 목록, 출력 아티팩트, Convex 자격 증명 풀은 아래 [Telegram, Discord, Slack, WhatsApp QA 참조](#telegram-discord-slack-and-whatsapp-qa-reference)에 문서화되어 있습니다.

VNC 구조가 포함된 전체 Slack 데스크톱 VM 실행의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱/브라우저 머신을 임대하고, VM 안에서 Slack 라이브 레인을 실행하고, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 캡처하며, 비디오 캡처를 사용할 수 있는 경우 `slack-qa/`, `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`를 Mantis 아티팩트 디렉터리로 복사합니다. Crabbox 데스크톱/브라우저 임대는 캡처 도구와 브라우저/네이티브 빌드 헬퍼 패키지를 미리 제공하므로, 시나리오는 오래된 임대에서만 폴백을 설치해야 합니다. Mantis는 `mantis-slack-desktop-smoke-report.md`에 총 소요 시간과 단계별 시간을 보고하므로 느린 실행에서 임대 워밍업, 자격 증명 획득, 원격 설정 또는 아티팩트 복사 중 어디에 시간이 사용되었는지 확인할 수 있습니다. VNC를 통해 Slack Web에 수동으로 로그인한 후에는 `--lease-id <cbx_...>`를 재사용하세요. 재사용된 임대는 Crabbox의 pnpm 저장소 캐시도 따뜻하게 유지합니다. 기본 `--hydrate-mode source`는 소스 체크아웃에서 검증하고 VM 안에서 install/build를 실행합니다. 재사용된 원격 작업공간에 이미 `node_modules`와 빌드된 `dist/`가 있을 때만 `--hydrate-mode prehydrated`를 사용하세요. 이 모드는 비용이 큰 install/build 단계를 건너뛰고, 작업공간이 준비되지 않은 경우 실패하도록 닫힙니다. `--gateway-setup`을 사용하면 Mantis는 포트 `38973`에서 VM 안에 지속적인 OpenClaw Slack Gateway를 실행 상태로 남깁니다. 이를 사용하지 않으면 명령은 일반 bot-to-bot Slack QA 레인을 실행하고 아티팩트 캡처 후 종료합니다.

데스크톱 증거로 네이티브 Slack 승인 UI를 증명하려면 Mantis 승인 체크포인트 모드를 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

이 모드는 `--gateway-setup`과 함께 사용할 수 없습니다. Slack 승인 시나리오를 실행하고, 비승인 시나리오 ID를 거부하며, 각 보류 및 해결된 승인 상태에서 대기하고, 관찰된 Slack API 메시지를 `approval-checkpoints/<scenario>-pending.png` 및 `approval-checkpoints/<scenario>-resolved.png`로 렌더링한 다음, 체크포인트, 메시지 증거, 확인 응답 또는 렌더링된 스크린샷 중 하나라도 누락되었거나 비어 있으면 실패합니다. 콜드 CI 임대에서는 여전히 `slack-desktop-smoke.png`에 Slack 로그인 화면이 보일 수 있습니다. 승인 체크포인트 이미지는 이 레인의 시각적 증거입니다.

운영자 체크리스트, GitHub 워크플로 디스패치 명령, 증거 댓글 계약, hydrate-mode 결정표, 타이밍 해석, 실패 처리 단계는 [Mantis Slack Desktop Runbook](/ko/concepts/mantis-slack-desktop-runbook)에 있습니다.

에이전트/CV 스타일 데스크톱 작업의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task`는 Crabbox 데스크톱/브라우저 머신을 임대하거나 재사용하고, `crabbox record --while`을 시작하며, 중첩된 `visual-driver`를 통해 표시된 브라우저를 조작하고, `visual-task.png`를 캡처하며, `--vision-mode image-describe`가 선택된 경우 스크린샷에 대해 `openclaw infer image describe`를 실행하고, `visual-task.mp4`, `mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json`, `mantis-visual-task-report.md`를 작성합니다. `--expect-text`가 설정되면 비전 프롬프트는 구조화된 JSON 판정을 요청하고, 모델이 긍정적인 가시적 증거를 보고할 때만 통과합니다. 대상 텍스트를 단순히 인용하는 부정 응답은 어설션에 실패합니다. 이미지 이해 제공자를 호출하지 않고 데스크톱, 브라우저, 스크린샷, 비디오 배관을 증명하는 무모델 스모크에는 `--vision-mode metadata`를 사용하세요. 녹화는 `visual-task`의 필수 아티팩트입니다. Crabbox가 비어 있지 않은 `visual-task.mp4`를 녹화하지 못하면 시각 드라이버가 통과했더라도 작업은 실패합니다. 실패 시 Mantis는 작업이 이미 통과했고 `--keep-lease`가 설정되지 않은 경우가 아니라면 VNC를 위해 임대를 유지합니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex 브로커 환경을 확인하고, 엔드포인트 설정을 검증하며, maintainer secret이 있을 때 admin/list 도달 가능성을 확인합니다. secret에 대해서는 설정됨/누락됨 상태만 보고합니다.

## 라이브 전송 커버리지

라이브 전송 레인은 각자 자체 시나리오 목록 형태를 만들지 않고 하나의 계약을 공유합니다. `qa-channel`은 광범위한 합성 제품 동작 제품군이며 라이브 전송 커버리지 매트릭스의 일부가 아닙니다.

라이브 전송 러너는 공유 시나리오 ID, 기준 커버리지 헬퍼, 시나리오 선택 헬퍼를 `openclaw/plugin-sdk/qa-live-transport-scenarios`에서 가져와야 합니다.

| 레인     | 카나리 | 멘션 게이팅 | Bot-to-bot | Allowlist 차단 | 최상위 답장 | 인용 답장 | 재시작 재개 | 스레드 후속 응답 | 스레드 격리 | 반응 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

이를 통해 `qa-channel`은 광범위한 제품 동작 제품군으로 유지되고, Matrix, Telegram 및 기타 라이브 전송은 하나의 명시적 전송 계약 체크리스트를 공유합니다.

QA 경로에 Docker를 들여오지 않는 일회용 Linux VM 레인의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이는 새 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 안에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 복사합니다. 호스트의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다. 호스트 및 Multipass suite 실행은 기본적으로 격리된 Gateway 워커를 사용해 선택된 여러 시나리오를 병렬로 실행합니다. `qa-channel`의 기본 동시성은 4이며 선택된 시나리오 수로 상한이 설정됩니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하거나, 직렬 실행에는 `--concurrency 1`을 사용하세요. 개인 비서 벤치마크 팩을 실행하려면 `--pack personal-agent`를 사용하세요. 팩 선택기는 반복된 `--scenario` 플래그와 추가적으로 동작합니다. 명시적 시나리오가 먼저 실행된 다음, 중복이 제거된 팩 시나리오가 팩 순서대로 실행됩니다. 커스텀 QA 러너가 이미 OpenTelemetry 컬렉터 설정을 제공하고 OpenTelemetry 및 Prometheus 진단 스모크 시나리오를 함께 선택하려는 경우 `--pack observability`를 사용하세요. 시나리오가 하나라도 실패하면 명령은 0이 아닌 코드로 종료됩니다. 실패 종료 코드 없이 아티팩트를 원하면 `--allow-failures`를 사용하세요. 라이브 실행은 게스트에서 실용적으로 지원되는 QA 인증 입력을 전달합니다. 환경 기반 제공자 키, QA 라이브 제공자 구성 경로, 존재하는 경우 `CODEX_HOME`입니다. 게스트가 마운트된 작업공간을 통해 다시 쓸 수 있도록 `--output-dir`를 저장소 루트 아래에 유지하세요.

## Telegram, Discord, Slack 및 WhatsApp QA 참조

Matrix는 시나리오 수와 Docker 기반 homeserver 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram, Discord, Slack 및 WhatsApp은 기존 실제 전송 수단을 대상으로 실행되므로, 해당 참조는 여기에 있습니다.

### 공유 CLI 플래그

이 lane들은 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 동일한 플래그를 허용합니다.

| 플래그                                | 기본값                                             | 설명                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 이 시나리오만 실행합니다. 반복 지정할 수 있습니다.                                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 보고서, 요약, 증거, 전송 수단별 아티팩트 및 출력 로그가 기록되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다. |
| `--repo-root <path>`                  | `process.cwd()`                                    | 중립 cwd에서 호출할 때의 저장소 루트입니다.                                                                                              |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 구성 내부의 임시 계정 ID입니다.                                                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 또는 `live-frontier`입니다(레거시 `live-openai`도 계속 작동합니다).                                                        |
| `--model <ref>` / `--alt-model <ref>` | 제공자 기본값                                      | 기본/대체 모델 참조입니다.                                                                                                               |
| `--fast`                              | 꺼짐                                               | 지원되는 경우 제공자 빠른 모드입니다.                                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하세요.                                                                             |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`              | `--credential-source convex`일 때 사용되는 역할입니다.                                                                                   |

각 lane은 실패한 시나리오가 있으면 0이 아닌 값으로 종료됩니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 작성합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

두 개의 서로 다른 봇(driver + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 합니다. 두 봇 모두 `@BotFather`에서 **Bot-to-Bot Communication Mode**를 활성화했을 때 봇 간 관찰이 가장 잘 작동합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 숫자 채팅 ID(문자열).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

시나리오(`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

암시적 기본 세트는 항상 canary, 멘션 게이팅, 네이티브 명령 응답, 명령 주소 지정, 봇 간 그룹 응답을 포함합니다. `mock-openai` 기본값에는 결정적 reply-chain 및 최종 메시지 스트리밍 검사도 포함됩니다. `telegram-current-session-status-tool`은 canary 바로 뒤에 스레드될 때만 안정적이고 임의의 네이티브 명령 응답 뒤에서는 안정적이지 않으므로 옵트인으로 유지됩니다. 현재 기본/선택 분할과 회귀 참조를 출력하려면 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`를 사용하세요.

출력 아티팩트:

- `telegram-qa-report.md`
- `qa-evidence.json` - 프로필, 적용 범위, 제공자, 채널, 아티팩트, 결과 및 RTT 필드를 포함하는 라이브 전송 검사 증거 항목입니다.

패키지 Telegram 실행은 동일한 Telegram 자격 증명 계약을 사용합니다. 반복 RTT
측정은 일반 패키지 Telegram 라이브 lane의 일부입니다. RTT
분포는 선택된 RTT 검사에 대해 `result.timing` 아래의 `qa-evidence.json`에
접혀 들어갑니다.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`가 설정되면 패키지 라이브 래퍼는
`kind: "telegram"` 자격 증명을 lease하고, lease된 그룹/driver/SUT 봇
env를 설치된 패키지 실행으로 내보내고, lease에 Heartbeat를 보내며,
종료 시 해제합니다. 패키지 래퍼는 기본적으로
`telegram-mentioned-message-reply`의 RTT 검사 20회, 30초 RTT timeout,
Convex가 선택된 경우 CI 외부에서 Convex 역할 `maintainer`를 사용합니다.
별도의 RTT 명령이나 Telegram 전용 요약 형식을 만들지 않고 RTT 측정을 조정하려면
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`,
또는 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`를 재정의하세요.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 개의 봇이 있는 실제 비공개 Discord guild 채널 하나를 대상으로 합니다. 하나는 harness가 제어하는 driver 봇이고, 다른 하나는 번들 Discord Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 봇입니다. 채널 멘션 처리, SUT 봇이 Discord에 네이티브 `/help` 명령을 등록했는지, 그리고 옵트인 Mantis 증거 시나리오를 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord가 반환한 SUT 봇 사용자 ID와 일치해야 합니다(그렇지 않으면 lane이 빠르게 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`는 `discord-voice-autojoin`에 사용할 음성/스테이지 채널을 선택합니다. 없으면 시나리오가 SUT 봇에 보이는 첫 번째 음성/스테이지 채널을 선택합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 옵트인 음성 시나리오입니다. 단독으로 실행되고, `channels.discord.voice.autoJoin`을 활성화하며, SUT 봇의 현재 Discord 음성 상태가 대상 음성/스테이지 채널인지 검증합니다. Convex Discord 자격 증명에는 선택적 `voiceChannelId`가 포함될 수 있습니다. 그렇지 않으면 runner가 guild에서 보이는 첫 번째 음성/스테이지 채널을 검색합니다.
- `discord-status-reactions-tool-only` - 옵트인 Mantis 시나리오입니다. SUT를 `messages.statusReactions.enabled=true`로 항상 켜진 tool-only guild 응답으로 전환하므로 단독으로 실행한 다음 REST 반응 타임라인과 HTML/PNG 시각적 아티팩트를 캡처합니다. Mantis 전/후 보고서도 시나리오가 제공한 MP4 아티팩트를 `baseline.mp4` 및 `candidate.mp4`로 보존합니다.

Discord 음성 자동 참여 시나리오를 명시적으로 실행합니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis 상태 반응 시나리오를 명시적으로 실행합니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

출력 아티팩트:

- `discord-qa-report.md`
- `qa-evidence.json` - 라이브 전송 검사에 대한 증거 항목입니다.
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문이 수정됩니다.
- 상태 반응 시나리오가 실행될 때 `discord-qa-reaction-timelines.json` 및 `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

두 개의 서로 다른 봇이 있는 실제 비공개 Slack 채널 하나를 대상으로 합니다. 하나는 harness가 제어하는 driver 봇이고, 다른 하나는 번들 Slack Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 봇입니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

선택 사항:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`는 Mantis의 시각적 승인
  체크포인트를 활성화합니다. runner는 `<scenario>.pending.json` 및
  `<scenario>.resolved.json`을 작성한 다음 일치하는 `.ack.json` 파일을 기다립니다.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS`는 체크포인트
  승인 timeout을 재정의합니다. 기본값은 `120000`입니다.

시나리오(`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - 옵트인 네이티브 Slack exec 승인 시나리오입니다.
  Gateway를 통해 exec 승인을 요청하고, Slack 메시지에 네이티브 승인 버튼이 있는지
  검증하며, 이를 해결한 뒤 해결된 Slack 업데이트를 검증합니다.
- `slack-approval-plugin-native` - 옵트인 네이티브 Slack Plugin 승인 시나리오입니다.
  exec 및 Plugin 승인 전달을 함께 활성화하여 Plugin 이벤트가 exec 승인 라우팅에 의해
  억제되지 않도록 한 다음, 동일한 pending/resolved 네이티브 Slack UI 경로를 검증합니다.

출력 아티팩트:

- `slack-qa-report.md`
- `qa-evidence.json` - 라이브 전송 검사에 대한 증거 항목입니다.
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`이 아니면 본문이 수정됩니다.
- `approval-checkpoints/` - Mantis가
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`를 설정한 경우에만 해당합니다. 체크포인트 JSON,
  승인 JSON 및 pending/resolved 스크린샷을 포함합니다.

#### Slack 워크스페이스 설정

이 lane에는 하나의 워크스페이스 안에 서로 다른 Slack 앱 두 개와 두 봇이 모두 멤버인 채널이 필요합니다.

- `channelId` - 두 봇 모두 초대된 채널의 `Cxxxxxxxxxx` ID입니다. 전용 채널을 사용하세요. 이 lane은 실행할 때마다 게시합니다.
- `driverBotToken` - **Driver** 앱의 봇 토큰(`xoxb-...`)입니다.
- `sutBotToken` - **SUT** 앱의 봇 토큰(`xoxb-...`)입니다. 봇 사용자 ID가 구분되도록 driver와 별도의 Slack 앱이어야 합니다.
- `sutAppToken` - `connections:write`가 있는 SUT 앱의 앱 수준 토큰(`xapp-...`)이며, Socket Mode에서 SUT 앱이 이벤트를 받을 수 있도록 사용됩니다.

프로덕션 워크스페이스를 재사용하기보다 QA 전용 Slack 워크스페이스를 선호하세요.

아래 SUT manifest는 번들 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:10`)를 라이브 Slack QA 제품군에서 다루는 권한과 이벤트로 의도적으로 좁힙니다. 사용자가 보는 프로덕션 채널 설정은 [Slack 채널 빠른 설정](/ko/channels/slack#quick-setup)을 참조하세요. QA Driver/SUT 쌍은 하나의 워크스페이스 안에서 두 개의 서로 다른 봇 사용자 ID가 필요하므로 의도적으로 별도입니다.

**1. Driver 앱 만들기**

[api.slack.com/apps](https://api.slack.com/apps)로 이동 → _Create New App_ → _From a manifest_ → QA 워크스페이스 선택, 다음 매니페스트 붙여넣기, 그런 다음 _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

_Bot User OAuth Token_(`xoxb-...`)을 복사합니다. 이것이 `driverBotToken`이 됩니다. 드라이버는 메시지를 게시하고 자기 자신을 식별하기만 하면 됩니다. 이벤트나 Socket Mode는 필요하지 않습니다.

**2. SUT 앱 만들기**

같은 워크스페이스에서 _Create New App → From a manifest_를 반복합니다. 이 QA 앱은 번들 Slack Plugin의 프로덕션 매니페스트(`extensions/slack/src/setup-shared.ts:10`)보다 좁은 버전을 의도적으로 사용합니다. 라이브 Slack QA 스위트가 아직 반응 처리를 다루지 않으므로 반응 범위와 이벤트는 생략되어 있습니다.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Slack이 앱을 만든 뒤 설정 페이지에서 두 가지를 수행합니다.

- _Install to Workspace_ → _Bot User OAuth Token_ 복사 → 이것이 `sutBotToken`이 됩니다.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 범위 `connections:write` 추가 → 저장 → `xapp-...` 값 복사 → 이것이 `sutAppToken`이 됩니다.

각 토큰에서 `auth.test`를 호출해 두 봇의 사용자 id가 서로 다른지 확인합니다. 런타임은 사용자 id로 드라이버와 SUT를 구분합니다. 하나의 앱을 둘 다에 재사용하면 멘션 게이팅이 즉시 실패합니다.

**3. 채널 만들기**

QA 워크스페이스에서 채널(예: `#openclaw-qa`)을 만들고 채널 안에서 두 봇을 모두 초대합니다.

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_에서 `Cxxxxxxxxxx` id를 복사합니다. 이것이 `channelId`가 됩니다. 공개 채널을 사용할 수 있습니다. 비공개 채널을 사용해도 두 앱 모두 이미 `groups:history`를 가지고 있으므로 하네스의 기록 읽기는 계속 성공합니다.

**4. 자격 증명 등록하기**

두 가지 옵션이 있습니다. 단일 머신 디버깅에는 env var를 사용하거나(`OPENCLAW_QA_SLACK_*` 변수 네 개를 설정하고 `--credential-source env` 전달), CI와 다른 유지관리자가 임대할 수 있도록 공유 Convex 풀을 시드합니다.

Convex 풀의 경우 네 필드를 JSON 파일에 작성합니다.

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

셸에 `OPENCLAW_QA_CONVEX_SITE_URL`과 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`를 export한 상태에서 등록하고 확인합니다.

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"`가 예상되며, `lease` 필드는 없어야 합니다.

**5. 엔드 투 엔드 확인하기**

브로커를 통해 두 봇이 서로 대화할 수 있는지 확인하려면 로컬에서 레인을 실행합니다.

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

성공한 실행은 30초보다 훨씬 짧은 시간 안에 완료되며 `slack-qa-report.md`에는 `slack-canary`와 `slack-mention-gating`이 모두 `pass` 상태로 표시됩니다. 레인이 약 90초 동안 멈춘 뒤 `Convex credential pool exhausted for kind "slack"`와 함께 종료되면 풀이 비어 있거나 모든 행이 임대된 것입니다. `qa credentials list --kind slack --status all --json`이 어느 쪽인지 알려줍니다.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

두 전용 WhatsApp Web 계정을 대상으로 합니다. 하나는 하네스가 제어하는 드라이버 계정이고, 다른 하나는 번들 WhatsApp Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 계정입니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

선택 사항:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID`는 `whatsapp-mention-gating` 및 `whatsapp-group-allowlist-block` 같은 그룹 시나리오를 활성화합니다.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.

시나리오 카탈로그(`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- 기준선 및 그룹 게이팅: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- 네이티브 명령: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- 답장 및 최종 출력 동작: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- 인바운드 미디어 및 구조화된 메시지: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. 이들은 드라이버를 통해 실제 WhatsApp 이미지, 오디오,
  문서, 위치, 연락처, 스티커 이벤트를 보냅니다.
- 아웃바운드 Gateway 및 메시지 액션 범위:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- 접근 제어 범위: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- 네이티브 승인: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- 상태 반응: `whatsapp-status-reactions`.

현재 카탈로그에는 36개 시나리오가 포함되어 있습니다. `live-frontier` 기본 레인은 빠른 스모크 범위를 위해 10개 시나리오로 작게 유지됩니다. `mock-openai` 기본 레인은 모델 출력만 모킹하면서 실제 WhatsApp 전송을 통해 31개의 결정적 시나리오를 실행합니다. 승인 시나리오와 몇 가지 더 무겁거나 차단적인 검사는 시나리오 id로 명시적으로 남아 있습니다.

WhatsApp QA 드라이버는 구조화된 라이브 이벤트(`text`, `media`, `location`, `reaction`, `poll`)를 관찰하며, 미디어, 투표, 연락처, 위치, 스티커를 능동적으로 보낼 수 있습니다. QA Lab은 비공개 WhatsApp 런타임 파일에 접근하는 대신 `@openclaw/whatsapp/api.js` 패키지 표면을 통해 해당 드라이버를 가져옵니다. 메시지 내용은 기본적으로 수정됩니다. 아웃바운드 투표 및 업로드 파일 범위는 모델 프롬프트 전용 도구 호출 대신 결정적 Gateway `poll` 및 `message.action` 호출을 통해 실행됩니다.

출력 아티팩트:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 라이브 전송 검사에 대한 증거 항목.
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`이 아니면 본문은 수정됩니다.

### Convex 자격 증명 풀

Telegram, Discord, Slack, WhatsApp 레인은 위 env var를 읽는 대신 공유 Convex 풀에서 자격 증명을 임대할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정합니다. QA Lab은 독점 임대를 획득하고, 실행 기간 동안 Heartbeat를 보내며, 종료 시 해제합니다. 풀 종류는 `"telegram"`, `"discord"`, `"slack"`, `"whatsapp"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형태:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId`는 숫자 채팅 id 문자열이어야 합니다.
- Telegram 실제 사용자(`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - Mantis Telegram Desktop 증명 전용입니다. 일반 QA Lab 레인은 이 종류를 획득하면 안 됩니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp(`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 전화번호는 서로 다른 E.164 문자열이어야 합니다.

Mantis Telegram Desktop 증명 워크플로는 TDLib CLI 드라이버와 Telegram Desktop 증인 모두에 대해 하나의 독점 Convex `telegram-user` 임대를 보유한 뒤, 증명을 게시한 후 해제합니다.

PR에 결정적 시각적 diff가 필요한 경우, Mantis는 Telegram 포매터 또는 전달 계층이 변경되는 동안 `main`과 PR head에서 같은 모의 모델 답장을 사용할 수 있습니다. 캡처 기본값은 PR 댓글에 맞게 조정되어 있습니다. 표준 Crabbox 클래스, 24fps 데스크톱 녹화, 24fps 모션 GIF, 1920px 미리보기 너비입니다. 전/후 댓글은 의도한 GIF만 포함하는 깔끔한 번들을 게시해야 합니다.

Slack 레인도 풀을 사용할 수 있습니다. Slack 페이로드 형태 검사는 현재 브로커가 아니라 Slack QA 러너에 있습니다. Slack 채널 id는 `Cxxxxxxxxxx` 같은 형식이며, `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`를 사용합니다. 앱 및 범위 프로비저닝은 [Slack 워크스페이스 설정](#setting-up-the-slack-workspace)을 참조하세요.

운영 env var와 Convex 브로커 엔드포인트 계약은 [테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다. 이 섹션 이름은 멀티 채널 풀보다 오래되었지만 임대 의미론은 종류 전반에 공유됩니다.

## 저장소 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

이들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 일반 YAML 시나리오 러너로 유지되어야 합니다. 각 시나리오 YAML 파일은 하나의 테스트 실행에 대한 단일 진실 공급원이며 다음을 정의해야 합니다.

- 최상위 `title`
- `scenario` 메타데이터
- `scenario`의 선택적 category, capability, lane, risk 메타데이터
- `scenario`의 문서 및 코드 참조
- `scenario`의 선택적 Plugin 요구 사항
- `scenario`의 선택적 Gateway config 패치
- 플로우 시나리오용 실행 가능한 최상위 `flow` 또는 Vitest 및 Playwright 시나리오용 `scenario.execution.kind` / `scenario.execution.path`

`flow`를 뒷받침하는 재사용 가능한 런타임 표면은 범용적이고
횡단적인 상태로 유지해도 됩니다. 예를 들어 YAML 시나리오는 특수 사례
러너를 추가하지 않고도 Gateway `browser.request` 이음새를 통해 내장
Control UI를 구동하는 브라우저 측 헬퍼와 전송 측 헬퍼를 결합할 수
있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 묶어야 합니다.
파일을 이동할 때도 시나리오 ID를 안정적으로 유지하고, 구현 추적성을 위해
`docsRefs` 및 `codeRefs`를 사용하세요.

기준 목록은 다음을 포괄할 수 있을 만큼 넓게 유지해야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 인계
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 공급자 모의 레인

`qa suite`에는 두 개의 로컬 공급자 모의 레인이 있습니다.

- `mock-openai`는 시나리오를 인식하는 OpenClaw 모의입니다. 리포지토리 기반 QA 및 동등성 게이트를 위한 기본
  결정적 모의 레인으로 유지됩니다.
- `aimock`은 실험적 프로토콜,
  픽스처, 기록/재생, 카오스 커버리지를 위해 AIMock 기반 공급자 서버를 시작합니다. 이는 추가되는 기능이며
  `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

공급자 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 공급자는 자체 기본값, 로컬 서버 시작, Gateway 모델 구성,
인증 프로필 스테이징 요구 사항, 라이브/모의 기능 플래그를 소유합니다. 공유 suite 및
Gateway 코드는 공급자 이름으로 분기하는 대신 공급자 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 YAML QA 시나리오를 위한 범용 전송 이음새를 소유합니다. `qa-channel`은
합성 기본값입니다. `crabline`은 로컬 공급자 형태의 서버를 시작하고
OpenClaw의 일반 채널 Plugin을 그 서버에 대해 실행합니다. `live`는 실제
공급자 자격 증명 및 외부 채널용으로 예약되어 있습니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 범용 시나리오 실행, 워커 동시성, 아티팩트 작성, 보고를 소유합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 작업, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 YAML 시나리오 파일은 테스트 실행을 정의하고, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

YAML QA 시스템에 채널을 추가하려면 채널 구현과
채널 계약을 실행하는 시나리오 팩이 필요합니다. 스모크 CI 커버리지를 위해
일치하는 Crabline 가짜 공급자 서버를 추가하고 `crabline`
드라이버를 통해 노출하세요.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있다면 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- suite 시작 및 종료
- 워커 동시성
- 아티팩트 작성
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오를 위한 호환성 별칭

러너 Plugin은 전송 계약을 소유합니다.

- `openclaw qa <runner>`가 공유 `qa` 루트 아래에 마운트되는 방식
- 해당 전송에 맞게 Gateway가 구성되는 방식
- 준비 상태를 확인하는 방식
- 인바운드 이벤트를 주입하는 방식
- 아웃바운드 메시지를 관찰하는 방식
- 기록과 정규화된 전송 상태를 노출하는 방식
- 전송 기반 작업을 실행하는 방식
- 전송별 재설정 또는 정리를 처리하는 방식

새 채널의 최소 도입 기준은 다음과 같습니다.

1. 공유 `qa` 루트의 소유자로 `qa-lab`을 유지합니다.
2. 공유 `qa-lab` 호스트 이음새에서 전송 러너를 구현합니다.
3. 전송별 메커니즘은 러너 Plugin 또는 채널 하네스 내부에 유지합니다.
4. 경쟁 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다. 러너 Plugin은 `openclaw.plugin.json`에서 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 내보내야 합니다. `runtime-api.ts`는 가볍게 유지하고, 지연 CLI 및 러너 실행은 별도 진입점 뒤에 두어야 합니다.
5. 주제별 `qa/scenarios/` 디렉터리 아래에 YAML 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 범용 시나리오 헬퍼를 사용합니다.
7. 리포지토리가 의도적인 마이그레이션을 수행하는 경우가 아니라면 기존 호환성 별칭이 계속 작동하도록 유지합니다.

판단 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있다면 `qa-lab`에 넣습니다.
- 동작이 하나의 채널 전송에 의존한다면 해당 러너 Plugin 또는 Plugin 하네스에 유지합니다.
- 둘 이상의 채널이 사용할 수 있는 새 기능이 시나리오에 필요하다면 `suite.ts`에 채널별 분기를 추가하는 대신 범용 헬퍼를 추가합니다.
- 동작이 한 전송에서만 의미가 있다면 시나리오를 전송별로 유지하고 시나리오 계약에서 이를 명시합니다.

### 시나리오 헬퍼 이름

새 시나리오에 선호되는 범용 헬퍼:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

기존 시나리오에는 호환성 별칭인 `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`가 계속 제공되지만, 새 시나리오 작성에는 범용 이름을 사용해야 합니다. 별칭은 일괄 마이그레이션을 피하기 위해 존재하는 것이며, 앞으로의 모델이 아닙니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음에 답해야 합니다.

- 작동한 것
- 실패한 것
- 차단된 상태로 남은 것
- 추가할 가치가 있는 후속 시나리오

사용 가능한 시나리오 인벤토리를 확인하려면, 후속 작업 규모를 산정하거나 새 전송을 연결할 때 유용한 `pnpm openclaw qa coverage`를 실행하세요. 기계가 읽을 수 있는 출력을 원하면 `--json`을 추가하세요.
변경된 동작 또는 파일 경로에 대한 집중 증거를 선택할 때는 `pnpm openclaw qa coverage --match <query>`를 실행하세요.
매치 보고서는 시나리오 메타데이터, 문서 참조, 코드 참조, 커버리지 ID, Plugin, 공급자 요구 사항을 검색한 뒤 일치하는 `qa suite --scenario ...` 대상을 출력합니다.
모든 `qa suite` 실행은 선택된
시나리오 세트에 대해 최상위 `qa-evidence.json`,
`qa-suite-summary.json`, `qa-suite-report.md` 아티팩트를 작성합니다. `execution.kind: vitest` 또는
`execution.kind: playwright`를 선언하는 시나리오는 일치하는 테스트 경로를 실행하고
시나리오별 로그도 작성합니다. `execution.kind: script`를 선언하는 시나리오는
`execution.path`의 증거 생성기를 `node --import tsx`를 통해 실행하며
(`execution.args`에서 `${outputDir}` 및 `${scenarioId}`가 확장됨), 생성기는
자체 `qa-evidence.json`을 작성합니다. 그 항목은 suite
출력으로 가져오며, 아티팩트 경로는 해당 생성기
`qa-evidence.json`을 기준으로 해석됩니다. `qa suite`에
`qa run --qa-profile`을 통해 도달한 경우 같은 `qa-evidence.json`에는 선택된 분류 범주에 대한 프로필
스코어카드 요약도 포함됩니다.
이를 검색 보조 도구로 다루고 게이트 대체물로 보지 마세요. 선택한 시나리오에는 여전히 테스트 대상 동작에 맞는 공급자 모드, 라이브 전송, Multipass, Testbox 또는 릴리스 레인이 필요합니다.
스코어카드 맥락은 [성숙도 스코어카드](/ko/maturity/scorecard)를 참조하세요.

캐릭터 및 스타일 검사를 위해 여러 라이브 모델
참조에서 같은 시나리오를 실행하고 판정된 Markdown 보고서를 작성하세요.

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

이 명령은 Docker가 아니라 로컬 QA Gateway 자식 프로세스를 실행합니다. 캐릭터 평가
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음 채팅, 작업공간 도움말, 작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는
평가 중이라는 사실을 알려서는 안 됩니다. 이 명령은 각 전체
기록을 보존하고 기본 실행 통계를 기록한 뒤, 지원되는 경우
`xhigh` 추론을 사용하는 빠른 모드에서 판정 모델에 자연스러움, 분위기, 유머 기준으로 실행 순위를 매기도록 요청합니다.
공급자를 비교할 때는 `--blind-judge-models`를 사용하세요. 판정 프롬프트에는 여전히
모든 기록과 실행 상태가 제공되지만 후보 참조는
`candidate-01` 같은 중립
레이블로 대체됩니다. 보고서는 파싱 후 순위를 실제 참조에 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, GPT-5.5는 `medium`, 이를 지원하는
이전 OpenAI 평가 참조는 `xhigh`를 사용합니다. 특정 후보는
`--model provider/model,thinking=<level>`로 인라인 재정의하세요. `--thinking <level>`은 여전히
전역 폴백을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식은
호환성을 위해 유지됩니다.
OpenAI 후보 참조는 기본적으로 빠른 모드를 사용하므로 공급자가 지원하는 경우
우선순위 처리가 사용됩니다. 단일 후보 또는 판정자에 재정의가 필요하면
`,fast`, `,no-fast`, 또는 `,fast=false`를 인라인으로 추가하세요. 모든 후보 모델에
빠른 모드를 강제로 켜고 싶을 때만 `--fast`를 전달하세요. 후보 및 판정자 소요 시간은
벤치마크 분석을 위해 보고서에 기록되지만, 판정 프롬프트는
속도로 순위를 매기지 말라고 명시합니다.
후보 및 판정 모델 실행은 모두 기본 동시성 16을 사용합니다. 공급자 제한 또는 로컬 Gateway
부하로 실행이 너무 불안정해지면
`--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 캐릭터 평가는
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`,
`google/gemini-3.1-pro-preview`를 기본값으로 사용합니다.
`--judge-model`이 전달되지 않으면 판정자는 기본적으로
`openai/gpt-5.5,thinking=xhigh,fast` 및
`anthropic/claude-opus-4-8,thinking=high`를 사용합니다.

## 관련 문서

- [매트릭스 QA](/ko/concepts/qa-matrix)
- [성숙도 스코어카드](/ko/maturity/scorecard)
- [개인 에이전트 벤치마크 팩](/ko/concepts/personal-agent-benchmark-pack)
- [QA 채널](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
