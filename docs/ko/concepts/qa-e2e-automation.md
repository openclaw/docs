---
read_when:
    - QA 스택이 어떻게 맞물리는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장하기
    - 저장소 기반 QA 시나리오 추가
    - Gateway 대시보드 주변에 더 높은 사실성의 QA 자동화 구축
summary: 'QA 스택 개요: qa-lab, qa-channel, repo 기반 시나리오, 라이브 전송 레인, 전송 어댑터, 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-06-30T13:53:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고 채널에 가까운 방식으로 OpenClaw를 실행해 보기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드, 반응, 편집, 삭제 표면을 갖춘 합성 메시지 채널.
- `extensions/qa-lab`: transcript를 관찰하고, 인바운드 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI와 QA 버스.
- `extensions/qa-matrix`, 향후 러너 Plugin: 하위 QA gateway 안에서 실제 채널을 구동하는 라이브 전송 어댑터.
- `qa/`: 시작 작업과 기준 QA 시나리오를 위한 저장소 기반 시드 자산.
- [Mantis](/ko/concepts/mantis): 실제 전송, 브라우저 스크린샷, VM 상태, PR 증거가 필요한 버그에 대한 사전 및 사후 라이브 검증.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 많은 명령에는 `pnpm qa:*` 스크립트 별칭이 있으며, 두 형식 모두 지원됩니다.

| 명령                                                | 목적                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | `--qa-profile` 없이 번들 QA 자체 검사를 실행합니다. `--qa-profile smoke-ci`, `--qa-profile release`, 또는 `--qa-profile all`을 사용하는 taxonomy 기반 성숙도 프로필 러너입니다.                                                                                             |
| `qa suite`                                          | QA gateway 레인에 대해 저장소 기반 시나리오를 실행합니다. 별칭: 일회용 Linux VM의 경우 `pnpm openclaw qa suite --runner multipass`.                                                                                                                                       |
| `qa coverage`                                       | YAML 시나리오 커버리지 인벤토리를 출력합니다(머신 출력은 `--json`).                                                                                                                                                                                                       |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 agentic 동등성 보고서를 작성하거나, `--runtime-axis --token-efficiency`를 사용해 하나의 런타임 쌍 요약에서 Codex-vs-OpenClaw 런타임 동등성 및 토큰 효율성 보고서를 작성합니다.                                                 |
| `qa character-eval`                                 | 판정 보고서와 함께 여러 라이브 모델에 걸쳐 캐릭터 QA 시나리오를 실행합니다. [보고](#reporting)를 참조하세요.                                                                                                                                                             |
| `qa manual`                                         | 선택한 제공자/모델 레인에 대해 일회성 프롬프트를 실행합니다.                                                                                                                                                                                                             |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                                                                                                        |
| `qa docker-build-image`                             | 사전 빌드된 QA Docker 이미지를 빌드합니다.                                                                                                                                                                                                                               |
| `qa docker-scaffold`                                | QA 대시보드 + gateway 레인을 위한 docker-compose 스캐폴드를 작성합니다.                                                                                                                                                                                                  |
| `qa up`                                             | QA 사이트를 빌드하고 Docker 기반 스택을 시작한 뒤 URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다).                                                                                            |
| `qa aimock`                                         | AIMock 제공자 서버만 시작합니다.                                                                                                                                                                                                                                         |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` 제공자 서버만 시작합니다.                                                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex 자격 증명 풀을 관리합니다.                                                                                                                                                                                                                                   |
| `qa matrix`                                         | 일회용 Tuwunel homeserver를 대상으로 하는 라이브 전송 레인입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하세요.                                                                                                                                                         |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                        |
| `qa discord`                                        | 실제 비공개 Discord 길드 채널을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                    |
| `qa slack`                                          | 실제 비공개 Slack 채널을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                           |
| `qa whatsapp`                                       | 실제 WhatsApp Web 계정을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                           |
| `qa mantis`                                         | 라이브 전송 버그를 위한 사전 및 사후 검증 러너이며, Discord 상태 반응 증거, Crabbox 데스크톱/브라우저 smoke, Slack-in-VNC smoke를 포함합니다. [Mantis](/ko/concepts/mantis) 및 [Mantis Slack Desktop Runbook](/ko/concepts/mantis-slack-desktop-runbook)을 참조하세요. |

프로필 기반 `qa run`은 `taxonomy.yaml`에서 멤버십을 읽은 다음, 해석된 시나리오를 `qa suite`를 통해 디스패치합니다. `--surface`와 `--category`는 별도의 레인을 정의하는 대신 선택된 프로필을 필터링합니다. 결과 `qa-evidence.json`에는 선택된 카테고리 개수와 누락된 커버리지 ID가 포함된 프로필 스코어카드 요약이 들어 있으며, 개별 증거 항목은 테스트, 커버리지 역할, 결과에 대한 진실의 원천으로 유지됩니다. Taxonomy 기능 커버리지 ID는 별칭이 아니라 정확한 증명 대상입니다. 기본 시나리오 커버리지는 일치하는 ID를 충족하며, 보조 커버리지는 권고로 남습니다. 커버리지 ID는 소문자 영숫자/대시 세그먼트가 포함된 점 구분 `namespace.behavior` 형식을 사용합니다. 프로필, 표면, 카테고리 ID는 기존의 대시 또는 점 구분 taxonomy ID를 계속 사용할 수 있습니다.
슬림 증거는 항목별 `execution`을 생략하고 `evidenceMode: "slim"`을 설정합니다. `smoke-ci`는 기본적으로 슬림이며, `--evidence-mode full`은 전체 항목을 복원합니다.

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

모의 모델 제공자와 Crabline 로컬 제공자 서버를 사용한 결정적 프로필 증명에는 `smoke-ci`를 사용하세요. 라이브 채널을 대상으로 하는 Stable/LTS 증명에는 `release`를 사용하세요. `all`은 명시적인 전체 taxonomy 증거 실행에만 사용하세요. 이는 모든 활성 성숙도 카테고리를 선택하며 `qa_profile=all`로 `QA Profile Evidence` 워크플로를 통해 디스패치할 수 있습니다. 명령에 OpenClaw 루트 프로필도 필요한 경우, 루트 프로필을 QA 명령 앞에 두세요.

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 운영자 흐름

현재 QA 운영자 흐름은 2개 패널로 구성된 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI).
- 오른쪽: Slack과 유사한 transcript와 시나리오 계획을 표시하는 QA Lab.

다음으로 실행하세요.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고 Docker 기반 gateway 레인을 시작하며, 운영자 또는 자동화 루프가 에이전트에 QA 임무를 부여하고 실제 채널 동작을 관찰하며 무엇이 작동했는지, 실패했는지, 또는 계속 차단되었는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복하려면, bind-mounted QA Lab 번들로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지로 유지하고 `extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 bind-mount합니다. `qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 변경되면 브라우저가 자동으로 다시 로드됩니다.

로컬 OpenTelemetry 신호 smoke의 경우 다음을 실행하세요.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP 수신기를 시작하고, `diagnostics-otel` Plugin이 활성화된 상태로 `otel-trace-smoke` QA 시나리오를 실행한 다음, traces, metrics, logs가 내보내졌는지 확인합니다. 내보낸 protobuf trace span을 디코딩하고 릴리스에 중요한 형상을 검사합니다.
`openclaw.run`, `openclaw.harness.run`, 최신 GenAI 의미 규칙 모델 호출 span, `openclaw.context.assembled`, `openclaw.message.delivery`가 있어야 합니다. smoke는 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`을 강제하므로, 모델 호출 span은 `{gen_ai.operation.name} {gen_ai.request.model}` 이름을 사용해야 합니다. 모델 호출은 성공한 턴에서 `StreamAbandoned`를 내보내면 안 됩니다. 원시 진단 ID와 `openclaw.content.*` 속성은 trace에 포함되지 않아야 합니다. 원시 OTLP 페이로드에는 프롬프트 sentinel, 응답 sentinel, 또는 QA 세션 키가 포함되면 안 됩니다. QA suite artifacts 옆에 `otel-smoke-summary.json`을 작성합니다.

collector 기반 OpenTelemetry smoke의 경우 다음을 실행하세요.

```bash
pnpm qa:otel:collector-smoke
```

이 레인은 동일한 로컬 수신기 앞에 실제 OpenTelemetry Collector Docker 컨테이너를 둡니다. 엔드포인트 배선, collector 호환성, 또는 in-process 수신기가 가릴 수 있는 OTLP export 동작을 변경할 때 사용하세요.

보호된 Prometheus scrape smoke의 경우 다음을 실행하세요.

```bash
pnpm qa:prometheus:smoke
```

해당 별칭은 `diagnostics-prometheus`가 활성화된 `docker-prometheus-smoke` QA 시나리오를 실행하고, 인증되지 않은 스크레이프가 거부되는지 확인한 다음, 인증된 스크레이프에 프롬프트 내용, 응답 내용, 원시 진단 식별자, 인증 토큰 또는 로컬 경로 없이 릴리스에 중요한 메트릭 패밀리가 포함되는지 확인합니다.

두 관측 가능성 스모크를 연속으로 실행하려면 다음을 사용하세요.

```bash
pnpm qa:observability:smoke
```

컬렉터 기반 OpenTelemetry 레인과 보호된 Prometheus 스크레이프 스모크를 함께 사용하려면 다음을 사용하세요.

```bash
pnpm qa:observability:collector-smoke
```

관측 가능성 QA는 소스 체크아웃에서만 유지됩니다. npm tarball은 의도적으로 QA Lab을 포함하지 않으므로 패키지 Docker 릴리스 레인은 `qa` 명령을 실행하지 않습니다. 진단 계측을 변경할 때는 빌드된 소스 체크아웃에서 `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` 또는 `pnpm qa:observability:smoke`를 사용하세요.

모델 제공자 자격 증명이 필요 없는 실제 전송 Matrix 스모크 레인의 경우, 결정적 mock OpenAI 제공자로 빠른 프로필을 실행하세요.

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

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, 환경 변수, 아티팩트 레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 요약하면 Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고, 임시 driver/SUT/observer 사용자를 등록하고, 해당 전송으로 범위가 지정된 자식 QA gateway 안에서 실제 Matrix plugin을 실행한 다음(`qa-channel` 없음), `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 Markdown 보고서, JSON 요약, 관찰된 이벤트 아티팩트, 결합된 출력 로그를 작성합니다.

시나리오는 단위 테스트가 엔드투엔드로 증명할 수 없는 전송 동작을 다룹니다. 멘션 게이팅, bot 허용 정책, allowlist, 최상위 및 스레드 답장, DM 라우팅, 반응 처리, 인바운드 편집 억제, 재시작 재생 중복 제거, 홈서버 중단 복구, 승인 메타데이터 전달, 미디어 처리, Matrix E2EE 부트스트랩/복구/검증 플로입니다. E2EE CLI 프로필은 gateway 답장을 확인하기 전에 동일한 일회용 홈서버를 통해 `openclaw matrix encryption setup` 및 검증 명령도 실행합니다.

Discord에는 버그 재현을 위한 Mantis 전용 옵트인 시나리오도 있습니다. 명시적 상태 반응 타임라인에는 `--scenario discord-status-reactions-tool-only`를 사용하고, 실제 Discord 스레드를 만들어 `message.thread-reply`가 `filePath` 첨부 파일을 보존하는지 확인하려면 `--scenario discord-thread-reply-filepath-attachment`를 사용하세요. 이러한 시나리오는 광범위한 스모크 커버리지가 아니라 전/후 재현 프로브이므로 기본 라이브 Discord 레인에는 포함되지 않습니다. QA 환경에 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 또는 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`가 구성된 경우, 스레드 첨부 Mantis 워크플로는 로그인된 Discord Web 증인 비디오도 추가할 수 있습니다. 해당 뷰어 프로필은 시각적 캡처 전용이며, 통과/실패 결정은 여전히 Discord REST 오라클에서 나옵니다.

CI는 `.github/workflows/qa-live-transports-convex.yml`에서 동일한 명령 표면을 사용합니다. 예약 실행 및 기본 수동 실행은 QA가 제공한 live-frontier 자격 증명, `--fast`, `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`으로 빠른 Matrix 프로필을 실행합니다. 수동 `matrix_profile=all`은 다섯 개의 프로필 샤드로 팬아웃됩니다.

실제 전송 Telegram, Discord, Slack, WhatsApp 스모크 레인의 경우:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

이들은 두 개의 bot 또는 계정(driver + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 환경 변수, 시나리오 목록, 출력 아티팩트, Convex 자격 증명 풀은 아래 [Telegram, Discord, Slack, WhatsApp QA 참조](#telegram-discord-slack-and-whatsapp-qa-reference)에 문서화되어 있습니다.

VNC 구조가 포함된 전체 Slack 데스크톱 VM 실행의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱/브라우저 머신을 임대하고, VM 안에서 Slack 라이브 레인을 실행하고, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 캡처하며, 비디오 캡처를 사용할 수 있을 때 `slack-qa/`, `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`를 Mantis 아티팩트 디렉터리로 복사합니다. Crabbox 데스크톱/브라우저 임대는 캡처 도구와 브라우저/네이티브 빌드 헬퍼 패키지를 사전에 제공하므로, 시나리오는 오래된 임대에서만 폴백을 설치해야 합니다. Mantis는 `mantis-slack-desktop-smoke-report.md`에 전체 및 단계별 타이밍을 보고하므로, 느린 실행에서 시간이 임대 워밍업, 자격 증명 획득, 원격 설정 또는 아티팩트 복사 중 어디에 쓰였는지 확인할 수 있습니다. VNC를 통해 Slack Web에 수동으로 로그인한 뒤 `--lease-id <cbx_...>`를 재사용하세요. 재사용된 임대는 Crabbox의 pnpm store 캐시도 따뜻하게 유지합니다. 기본 `--hydrate-mode source`는 소스 체크아웃에서 검증하고 VM 안에서 설치/빌드를 실행합니다. `--hydrate-mode prehydrated`는 재사용된 원격 워크스페이스에 이미 `node_modules`와 빌드된 `dist/`가 있을 때만 사용하세요. 이 모드는 비용이 큰 설치/빌드 단계를 건너뛰며, 워크스페이스가 준비되지 않았으면 fail closed합니다. `--gateway-setup`을 사용하면 Mantis는 VM 안에서 포트 `38973`에 영구 OpenClaw Slack gateway를 실행 상태로 남깁니다. 사용하지 않으면 명령은 일반 bot 간 Slack QA 레인을 실행하고 아티팩트 캡처 후 종료합니다.

데스크톱 증거로 네이티브 Slack 승인 UI를 증명하려면 Mantis 승인 체크포인트 모드를 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

이 모드는 `--gateway-setup`과 상호 배타적입니다. Slack 승인 시나리오를 실행하고, 승인 시나리오가 아닌 ID를 거부하고, 각 대기 중 및 해결된 승인 상태에서 대기하고, 관찰된 Slack API 메시지를 `approval-checkpoints/<scenario>-pending.png` 및 `approval-checkpoints/<scenario>-resolved.png`로 렌더링한 다음, 체크포인트, 메시지 증거, 확인 응답 또는 렌더링된 스크린샷 중 하나라도 누락되었거나 비어 있으면 실패합니다. 콜드 CI 임대는 여전히 `slack-desktop-smoke.png`에 Slack 로그인 화면이 표시될 수 있습니다. 승인 체크포인트 이미지는 이 레인의 시각적 증명입니다.

운영자 체크리스트, GitHub workflow dispatch 명령, 증거 댓글 계약, hydrate-mode 결정 표, 타이밍 해석, 실패 처리 단계는 [Mantis Slack 데스크톱 Runbook](/ko/concepts/mantis-slack-desktop-runbook)에 있습니다.

agent/CV 스타일 데스크톱 작업의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task`는 Crabbox 데스크톱/브라우저 머신을 임대하거나 재사용하고, `crabbox record --while`을 시작하고, 중첩된 `visual-driver`를 통해 보이는 브라우저를 조작하고, `visual-task.png`를 캡처하고, `--vision-mode image-describe`가 선택된 경우 스크린샷에 대해 `openclaw infer image describe`를 실행하며, `visual-task.mp4`, `mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json`, `mantis-visual-task-report.md`를 작성합니다. `--expect-text`가 설정되면 vision 프롬프트는 구조화된 JSON 판정을 요청하며, 모델이 긍정적인 가시 증거를 보고할 때만 통과합니다. 대상 텍스트를 단순히 인용하는 부정 응답은 어설션에 실패합니다. 이미지 이해 제공자를 호출하지 않고 데스크톱, 브라우저, 스크린샷, 비디오 배관을 증명하는 무모델 스모크에는 `--vision-mode metadata`를 사용하세요. 녹화는 `visual-task`의 필수 아티팩트입니다. Crabbox가 비어 있지 않은 `visual-task.mp4`를 기록하지 않으면, visual driver가 통과했더라도 작업은 실패합니다. 실패 시 Mantis는 작업이 이미 통과했고 `--keep-lease`가 설정되지 않은 경우가 아니면 VNC를 위해 임대를 유지합니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex broker 환경을 확인하고, 엔드포인트 설정을 검증하며, maintainer 비밀이 있을 때 admin/list 도달 가능성을 확인합니다. 비밀에 대해서는 설정됨/누락 상태만 보고합니다.

## 라이브 전송 커버리지

라이브 전송 레인은 각자 시나리오 목록 형태를 새로 만들지 않고 하나의 계약을 공유합니다. `qa-channel`은 광범위한 합성 제품 동작 스위트이며 라이브 전송 커버리지 매트릭스의 일부가 아닙니다.

라이브 전송 runner는 공유 시나리오 ID, 기준 커버리지 헬퍼, 시나리오 선택 헬퍼를 `openclaw/plugin-sdk/qa-live-transport-scenarios`에서 가져와야 합니다.

| 레인     | Canary | 멘션 게이팅 | Bot-to-bot | Allowlist 차단 | 최상위 답장 | 인용 답장 | 재시작 재개 | 스레드 후속 응답 | 스레드 격리 | 반응 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

이렇게 하면 `qa-channel`은 광범위한 제품 동작 스위트로 유지되고, Matrix, Telegram 및 다른 라이브 전송은 하나의 명시적인 전송 계약 체크리스트를 공유합니다.

QA 경로에 Docker를 들이지 않는 일회용 Linux VM 레인의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass guest를 부팅하고, 종속성을 설치하고, guest 안에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
호스트의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트 및 Multipass suite 실행은 기본적으로 격리된 gateway worker로 선택된 여러 시나리오를 병렬 실행합니다. `qa-channel`은 기본 동시성 4를 사용하며, 선택된 시나리오 수로 제한됩니다. worker 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행에는 `--concurrency 1`을 사용하세요.
개인 비서 벤치마크 pack을 실행하려면 `--pack personal-agent`를 사용하세요. pack selector는 반복된 `--scenario` 플래그와 더해집니다. 명시적 시나리오가 먼저 실행된 다음, pack 시나리오가 중복 제거 후 pack 순서대로 실행됩니다.
사용자 지정 QA runner가 이미 OpenTelemetry 컬렉터 설정을 제공하고 OpenTelemetry 및 Prometheus 진단 스모크 시나리오를 함께 선택하려는 경우 `--pack observability`를 사용하세요.
시나리오가 하나라도 실패하면 명령은 0이 아닌 값으로 종료됩니다. 실패 종료 코드 없이 아티팩트를 원할 때는 `--allow-failures`를 사용하세요.
라이브 실행은 guest에 실용적인 지원 QA 인증 입력을 전달합니다. 환경 기반 제공자 키, QA 라이브 제공자 구성 경로, 그리고 있을 경우 `CODEX_HOME`입니다. guest가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 `--output-dir`은 repo 루트 아래에 유지하세요.

## Telegram, Discord, Slack 및 WhatsApp QA 참조

Matrix는 시나리오 수와 Docker 기반 homeserver 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram, Discord, Slack 및 WhatsApp은 기존 실제 전송 수단을 대상으로 실행되므로, 해당 참조는 여기에 있습니다.

### 공유 CLI 플래그

이 레인들은 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 동일한 플래그를 받습니다.

| 플래그                                | 기본값                                             | 설명                                                                                                                                           |
| ------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 이 시나리오만 실행합니다. 반복 지정할 수 있습니다.                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 보고서, 요약, 증거, 전송별 아티팩트 및 출력 로그가 작성되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다.                      |
| `--repo-root <path>`                  | `process.cwd()`                                    | 중립적인 cwd에서 호출할 때의 리포지토리 루트입니다.                                                                                            |
| `--sut-account <id>`                  | `sut`                                              | QA gateway 구성 내부의 임시 계정 ID입니다.                                                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 또는 `live-frontier`입니다(레거시 `live-openai`도 계속 동작합니다).                                                               |
| `--model <ref>` / `--alt-model <ref>` | provider 기본값                                    | 기본/대체 모델 참조입니다.                                                                                                                      |
| `--fast`                              | 꺼짐                                               | 지원되는 경우 provider 빠른 모드입니다.                                                                                                        |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하세요.                                                                                    |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`              | `--credential-source convex`일 때 사용되는 역할입니다.                                                                                         |

각 레인은 실패한 시나리오가 있으면 0이 아닌 코드로 종료합니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 작성합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

서로 다른 두 봇(driver + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 하며, 두 봇 모두 `@BotFather`에서 **Bot-to-Bot Communication Mode**를 활성화했을 때 봇 간 관찰이 가장 잘 동작합니다.

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

암시적 기본 세트는 항상 canary, 멘션 게이팅, 네이티브 명령 응답, 명령 주소 지정, 봇 간 그룹 응답을 포함합니다. `mock-openai` 기본값에는 결정적 reply-chain 및 final-message 스트리밍 검사도 포함됩니다. `telegram-current-session-status-tool`은 canary 직후 스레드로 직접 이어질 때만 안정적이고 임의의 네이티브 명령 응답 뒤에는 안정적이지 않으므로 선택 사항으로 남아 있습니다. 현재 기본/선택 분리와 회귀 참조를 출력하려면 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`를 사용하세요.

출력 아티팩트:

- `telegram-qa-report.md`
- `qa-evidence.json` - 프로필, 커버리지, provider, 채널, 아티팩트, 결과, RTT 필드를 포함한 live transport 검사 증거 항목입니다.

패키지 Telegram 실행은 동일한 Telegram 자격 증명 계약을 사용합니다. 반복 RTT
측정은 일반 패키지 Telegram 라이브 레인의 일부입니다. RTT
분포는 선택한 RTT 검사에 대해 `result.timing` 아래의 `qa-evidence.json`에
포함됩니다.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`가 설정되면 패키지 라이브 wrapper는
`kind: "telegram"` 자격 증명을 임대하고, 임대한 그룹/driver/SUT 봇
env를 설치된 패키지 실행으로 내보내며, 임대에 Heartbeat를 보내고
종료 시 해제합니다. 패키지 wrapper는 기본적으로
`telegram-mentioned-message-reply`에 대해 RTT 검사 20회, RTT 제한 시간 30초,
Convex가 선택된 경우 CI 외부에서 Convex 역할 `maintainer`를 사용합니다.
별도의 RTT 명령이나 Telegram 전용 요약 형식을 만들지 않고 RTT 측정을 조정하려면
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`,
또는 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`를 재정의하세요.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 봇이 있는 실제 비공개 Discord guild 채널 하나를 대상으로 합니다. 하나는 harness가 제어하는 driver 봇이고, 다른 하나는 번들 Discord Plugin을 통해 하위 OpenClaw gateway가 시작하는 SUT 봇입니다. 채널 멘션 처리, SUT 봇이 Discord에 네이티브 `/help` 명령을 등록했는지, 그리고 선택형 Mantis 증거 시나리오를 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord가 반환한 SUT 봇 사용자 ID와 일치해야 합니다(그렇지 않으면 레인이 빠르게 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`는 `discord-voice-autojoin`에 사용할 음성/스테이지 채널을 선택합니다. 없으면 시나리오는 SUT 봇에 대해 처음 보이는 음성/스테이지 채널을 선택합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 선택형 음성 시나리오입니다. 단독으로 실행되며, `channels.discord.voice.autoJoin`을 활성화하고, SUT 봇의 현재 Discord 음성 상태가 대상 음성/스테이지 채널인지 검증합니다. Convex Discord 자격 증명에는 선택적 `voiceChannelId`가 포함될 수 있습니다. 그렇지 않으면 runner가 guild에서 처음 보이는 음성/스테이지 채널을 검색합니다.
- `discord-status-reactions-tool-only` - 선택형 Mantis 시나리오입니다. SUT를 `messages.statusReactions.enabled=true`로 항상 켜진 도구 전용 guild 응답으로 전환하므로 단독으로 실행됩니다. 그런 다음 REST 반응 타임라인과 HTML/PNG 시각 아티팩트를 캡처합니다. Mantis 전/후 보고서는 시나리오가 제공한 MP4 아티팩트도 `baseline.mp4` 및 `candidate.mp4`로 보존합니다.

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
- `qa-evidence.json` - live transport 검사 증거 항목입니다.
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문이 redaction됩니다.
- 상태 반응 시나리오가 실행될 때 `discord-qa-reaction-timelines.json` 및 `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

서로 다른 두 봇이 있는 실제 비공개 Slack 채널 하나를 대상으로 합니다. 하나는 harness가 제어하는 driver 봇이고, 다른 하나는 번들 Slack Plugin을 통해 하위 OpenClaw gateway가 시작하는 SUT 봇입니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

선택 사항:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`은 Mantis에 대한 시각적 승인
  체크포인트를 활성화합니다. runner는 `<scenario>.pending.json` 및
  `<scenario>.resolved.json`을 작성한 뒤, 일치하는 `.ack.json` 파일을 기다립니다.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS`는 체크포인트
  승인 제한 시간을 재정의합니다. 기본값은 `120000`입니다.

시나리오(`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - 선택형 네이티브 Slack exec 승인 시나리오입니다.
  gateway를 통해 exec 승인을 요청하고, Slack 메시지에
  네이티브 승인 버튼이 있는지 검증하며, 이를 해결한 뒤 해결된 Slack 업데이트를 검증합니다.
- `slack-approval-plugin-native` - 선택형 네이티브 Slack Plugin 승인 시나리오입니다.
  exec 및 Plugin 승인 전달을 함께 활성화하여 Plugin 이벤트가
  exec 승인 라우팅에 의해 억제되지 않게 한 뒤, 동일한 pending/resolved
  네이티브 Slack UI 경로를 검증합니다.

출력 아티팩트:

- `slack-qa-report.md`
- `qa-evidence.json` - live transport 검사 증거 항목입니다.
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`이 아니면 본문이 redaction됩니다.
- `approval-checkpoints/` - Mantis가
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`을 설정한 경우에만 해당합니다. 체크포인트 JSON,
  승인 JSON, pending/resolved 스크린샷을 포함합니다.

#### Slack 작업 영역 설정

이 레인에는 하나의 작업 영역에 서로 다른 두 Slack 앱과 두 봇이 모두 멤버인 채널이 필요합니다.

- `channelId` - 두 봇 모두 초대된 채널의 `Cxxxxxxxxxx` ID입니다. 전용 채널을 사용하세요. 레인은 실행할 때마다 게시합니다.
- `driverBotToken` - **Driver** 앱의 봇 토큰(`xoxb-...`)입니다.
- `sutBotToken` - **SUT** 앱의 봇 토큰(`xoxb-...`)입니다. 봇 사용자 ID가 서로 다르도록 driver와 별도의 Slack 앱이어야 합니다.
- `sutAppToken` - `connections:write`가 있는 SUT 앱의 앱 수준 토큰(`xapp-...`)입니다. SUT 앱이 이벤트를 받을 수 있도록 Socket Mode에서 사용됩니다.

프로덕션 작업 영역을 재사용하기보다 QA 전용 Slack 작업 영역을 선호하세요.

아래 SUT manifest는 번들 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:10`)를 live Slack QA 제품군이 다루는 권한과 이벤트로 의도적으로 좁힙니다. 사용자가 보는 프로덕션 채널 설정은 [Slack 채널 빠른 설정](/ko/channels/slack#quick-setup)을 참조하세요. QA Driver/SUT 쌍은 하나의 작업 영역에 서로 다른 두 봇 사용자 ID가 필요하므로 의도적으로 분리되어 있습니다.

**1. Driver 앱 만들기**

[api.slack.com/apps](https://api.slack.com/apps)로 이동 → _새 앱 만들기_ → _매니페스트에서_ → QA 워크스페이스 선택, 다음 매니페스트 붙여넣기, 그런 다음 _워크스페이스에 설치_:

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

_봇 사용자 OAuth 토큰_(`xoxb-...`)을 복사합니다. 이것이 `driverBotToken`이 됩니다. 드라이버는 메시지를 게시하고 자신을 식별하기만 하면 됩니다. 이벤트나 Socket Mode는 필요 없습니다.

**2. SUT 앱 만들기**

같은 워크스페이스에서 _새 앱 만들기 → 매니페스트에서_를 반복합니다. 이 QA 앱은 번들 Slack Plugin의 프로덕션 매니페스트(`extensions/slack/src/setup-shared.ts:10`)보다 좁은 버전을 의도적으로 사용합니다. 라이브 Slack QA 스위트가 아직 반응 처리를 다루지 않기 때문에 반응 범위와 이벤트는 생략되어 있습니다.

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

Slack이 앱을 만든 후 설정 페이지에서 두 가지를 수행합니다.

- _워크스페이스에 설치_ → _봇 사용자 OAuth 토큰_ 복사 → 이것이 `sutBotToken`이 됩니다.
- _기본 정보 → 앱 수준 토큰 → 토큰 및 범위 생성_ → 범위 `connections:write` 추가 → 저장 → `xapp-...` 값 복사 → 이것이 `sutAppToken`이 됩니다.

각 토큰에서 `auth.test`를 호출해 두 봇의 사용자 ID가 서로 다른지 확인합니다. 런타임은 사용자 ID로 드라이버와 SUT를 구분합니다. 두 용도에 하나의 앱을 재사용하면 멘션 게이팅에서 즉시 실패합니다.

**3. 채널 만들기**

QA 워크스페이스에서 채널(예: `#openclaw-qa`)을 만들고 채널 안에서 두 봇을 모두 초대합니다.

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_채널 정보 → 소개 → 채널 ID_에서 `Cxxxxxxxxxx` ID를 복사합니다. 이것이 `channelId`가 됩니다. 공개 채널을 사용할 수 있습니다. 비공개 채널을 사용하는 경우에도 두 앱 모두 이미 `groups:history`를 가지고 있으므로 하니스의 기록 읽기는 계속 성공합니다.

**4. 자격 증명 등록하기**

두 가지 옵션이 있습니다. 단일 머신 디버깅에는 환경 변수를 사용하거나(네 개의 `OPENCLAW_QA_SLACK_*` 변수를 설정하고 `--credential-source env` 전달), CI와 다른 유지관리자가 임대할 수 있도록 공유 Convex 풀에 시드합니다.

Convex 풀의 경우 네 필드를 JSON 파일에 작성합니다.

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

셸에 `OPENCLAW_QA_CONVEX_SITE_URL` 및 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`를 내보낸 상태에서 등록하고 확인합니다.

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"`, `lease` 필드 없음이 예상됩니다.

**5. 엔드투엔드 확인하기**

두 봇이 브로커를 통해 서로 대화할 수 있는지 확인하려면 레인을 로컬에서 실행합니다.

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

정상 실행은 30초보다 훨씬 짧은 시간 안에 완료되며, `slack-qa-report.md`에는 `slack-canary`와 `slack-mention-gating`이 모두 `pass` 상태로 표시됩니다. 레인이 약 90초 동안 멈춘 뒤 `Convex credential pool exhausted for kind "slack"`로 종료되면 풀이 비어 있거나 모든 행이 임대된 것입니다. `qa credentials list --kind slack --status all --json`이 어느 쪽인지 알려줍니다.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

두 개의 전용 WhatsApp Web 계정을 대상으로 합니다. 하나는 하니스가 제어하는 드라이버 계정이고, 다른 하나는 하위 OpenClaw Gateway가 번들 WhatsApp Plugin을 통해 시작하는 SUT 계정입니다.

`--credential-source env`일 때 필요한 환경 변수:

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
  `whatsapp-group-audio-gating`. 이들은 실제 WhatsApp 이미지, 오디오,
  문서, 위치, 연락처, 스티커 이벤트를 드라이버를 통해 보냅니다.
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

현재 카탈로그에는 36개 시나리오가 포함되어 있습니다. 빠른 스모크 범위를 위해 `live-frontier` 기본 레인은 10개 시나리오로 작게 유지됩니다. `mock-openai` 기본 레인은 모델 출력만 모킹하면서 실제 WhatsApp 전송을 통해 31개의 결정적 시나리오를 실행합니다. 승인 시나리오와 몇 가지 더 무겁거나 차단성인 검사는 시나리오 ID로 명시적으로 실행해야 합니다.

WhatsApp QA 드라이버는 구조화된 라이브 이벤트(`text`, `media`, `location`, `reaction`, `poll`)를 관찰하며 미디어, 투표, 연락처, 위치, 스티커를 능동적으로 보낼 수 있습니다. QA Lab은 비공개 WhatsApp 런타임 파일에 접근하는 대신 `@openclaw/whatsapp/api.js` 패키지 표면을 통해 해당 드라이버를 가져옵니다. 메시지 내용은 기본적으로 수정 처리됩니다. 아웃바운드 투표 및 업로드 파일 범위는 모델 프롬프트 전용 도구 호출 대신 결정적 Gateway `poll` 및 `message.action` 호출을 통해 실행됩니다.

출력 아티팩트:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 라이브 전송 검사에 대한 증거 항목입니다.
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`이 아니면 본문은 수정 처리됩니다.

### Convex 자격 증명 풀

Telegram, Discord, Slack, WhatsApp 레인은 위 환경 변수를 읽는 대신 공유 Convex 풀에서 자격 증명을 임대할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정합니다. QA Lab은 독점 임대를 획득하고 실행되는 동안 Heartbeat를 보내며 종료 시 해제합니다. 풀 종류는 `"telegram"`, `"discord"`, `"slack"`, `"whatsapp"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형태:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId`는 숫자 채팅 ID 문자열이어야 합니다.
- Telegram 실제 사용자(`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - Mantis Telegram Desktop 증명 전용입니다. 일반 QA Lab 레인은 이 종류를 획득해서는 안 됩니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp(`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 전화번호는 서로 다른 E.164 문자열이어야 합니다.

Mantis Telegram Desktop 증명 워크플로는 TDLib CLI 드라이버와 Telegram Desktop 증인 모두에 대해 하나의 독점 Convex `telegram-user` 임대를 보유한 뒤, 증명을 게시한 후 해제합니다.

PR에 결정적 시각적 diff가 필요할 때, Mantis는 Telegram 포매터 또는 전달 계층이 변경되는 동안 `main`과 PR 헤드에서 동일한 모킹 모델 답장을 사용할 수 있습니다. 캡처 기본값은 PR 댓글에 맞게 조정되어 있습니다. 표준 Crabbox 클래스, 24fps 데스크톱 녹화, 24fps 모션 GIF, 1920px 미리보기 너비입니다. 전/후 댓글은 의도한 GIF만 포함하는 깔끔한 번들을 게시해야 합니다.

Slack 레인도 풀을 사용할 수 있습니다. Slack 페이로드 형태 검사는 현재 브로커가 아니라 Slack QA 러너에 있습니다. Slack 채널 ID(예: `Cxxxxxxxxxx`)와 함께 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`을 사용하세요. 앱 및 범위 프로비저닝은 [Slack 워크스페이스 설정](#setting-up-the-slack-workspace)을 참조하세요.

운영 환경 변수와 Convex 브로커 엔드포인트 계약은 [테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다. 섹션 이름은 멀티 채널 풀보다 앞서 만들어졌지만 임대 의미론은 여러 종류에서 공유됩니다.

## 저장소 기반 시드

시드 에셋은 `qa/`에 있습니다.

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

이들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 일반 YAML 시나리오 러너로 유지되어야 합니다. 각 시나리오 YAML 파일은 하나의 테스트 실행에 대한 진실 공급원이며 다음을 정의해야 합니다.

- 최상위 `title`
- `scenario` 메타데이터
- `scenario`의 선택적 카테고리, 기능, 레인, 위험 메타데이터
- `scenario`의 문서 및 코드 참조
- `scenario`의 선택적 Plugin 요구 사항
- `scenario`의 선택적 Gateway 설정 패치
- 플로 시나리오용 실행 가능한 최상위 `flow`, 또는 Vitest 및 Playwright 시나리오용 `scenario.execution.kind` / `scenario.execution.path`

`flow`를 뒷받침하는 재사용 가능한 런타임 표면은 제네릭하고
교차 기능적으로 유지될 수 있습니다. 예를 들어 YAML 시나리오는 특별 사례 러너를 추가하지 않고도
Gateway `browser.request` 경계를 통해 내장 Control UI를 구동하는 브라우저 측
헬퍼와 전송 측 헬퍼를 결합할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 그룹화해야 합니다.
파일이 이동해도 시나리오 ID는 안정적으로 유지하고, 구현 추적성을 위해 `docsRefs`와 `codeRefs`를 사용하세요.

기준 목록은 다음을 포괄할 만큼 충분히 넓게 유지해야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명 주기
- cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 인계
- 저장소 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 프로바이더 모의 레인

`qa suite`에는 두 개의 로컬 프로바이더 모의 레인이 있습니다.

- `mock-openai`는 시나리오 인식 OpenClaw 모의입니다. 저장소 기반 QA와 패리티 게이트를 위한 기본
  결정론적 모의 레인으로 유지됩니다.
- `aimock`은 실험적 프로토콜, 픽스처, 기록/재생 및 카오스 커버리지를 위해 AIMock 기반 프로바이더 서버를 시작합니다.
  이는 추가 기능이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

프로바이더 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 프로바이더는 자체 기본값, 로컬 서버 시작, Gateway 모델 구성,
인증 프로필 스테이징 요구 사항, 라이브/모의 기능 플래그를 소유합니다. 공유 스위트와
Gateway 코드는 프로바이더 이름으로 분기하는 대신 프로바이더 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 YAML QA 시나리오용 제네릭 전송 경계를 소유합니다. `qa-channel`은
합성 기본값입니다. `crabline`은 로컬 프로바이더 형태의 서버를 시작하고
OpenClaw의 일반 채널 Plugin을 그에 대해 실행합니다. `live`는 실제
프로바이더 자격 증명과 외부 채널용으로 예약되어 있습니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 제네릭 시나리오 실행, 워커 동시성, 아티팩트 작성 및 보고를 소유합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 액션, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 YAML 시나리오 파일은 테스트 실행을 정의하며, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

YAML QA 시스템에 채널을 추가하려면 채널 구현과
채널 계약을 실행하는 시나리오 팩이 필요합니다. 스모크 CI 커버리지를 위해
일치하는 Crabline 로컬 프로바이더 서버를 추가하고 `crabline`
드라이버를 통해 노출하세요.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있을 때는 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- 스위트 시작 및 종료
- 워커 동시성
- 아티팩트 작성
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오용 호환성 별칭

러너 Plugin은 전송 계약을 소유합니다.

- 공유 `qa` 루트 아래에 `openclaw qa <runner>`가 마운트되는 방식
- 해당 전송을 위해 Gateway가 구성되는 방식
- 준비 상태를 확인하는 방식
- 인바운드 이벤트가 주입되는 방식
- 아웃바운드 메시지가 관찰되는 방식
- 트랜스크립트와 정규화된 전송 상태가 노출되는 방식
- 전송 기반 액션이 실행되는 방식
- 전송별 초기화 또는 정리가 처리되는 방식

새 채널의 최소 채택 기준:

1. 공유 `qa` 루트의 소유자로 `qa-lab`을 유지합니다.
2. 공유 `qa-lab` 호스트 경계에서 전송 러너를 구현합니다.
3. 전송별 메커니즘은 러너 Plugin 또는 채널 하네스 내부에 유지합니다.
4. 경쟁 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다. 러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 내보내야 합니다. `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI와 러너 실행은 별도 엔트리포인트 뒤에 유지해야 합니다.
5. 테마가 지정된 `qa/scenarios/` 디렉터리 아래에서 YAML 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 제네릭 시나리오 헬퍼를 사용합니다.
7. 저장소가 의도적인 마이그레이션을 수행하지 않는 한 기존 호환성 별칭이 계속 작동하도록 유지합니다.

결정 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번 표현할 수 있으면 `qa-lab`에 넣습니다.
- 동작이 하나의 채널 전송에 의존하면 해당 러너 Plugin 또는 Plugin 하네스에 유지합니다.
- 시나리오에 둘 이상의 채널에서 사용할 수 있는 새 기능이 필요하면 `suite.ts`에 채널별 분기를 추가하는 대신 제네릭 헬퍼를 추가합니다.
- 동작이 하나의 전송에서만 의미가 있으면 시나리오를 전송별로 유지하고 시나리오 계약에서 이를 명시합니다.

### 시나리오 헬퍼 이름

새 시나리오에 권장되는 제네릭 헬퍼:

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

기존 시나리오에서는 `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` 호환성 별칭을 계속 사용할 수 있지만, 새 시나리오 작성에는 제네릭 이름을 사용해야 합니다. 별칭은 일괄 마이그레이션을 피하기 위해 존재하며, 앞으로의 모델이 아닙니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음에 답해야 합니다.

- 작동한 것
- 실패한 것
- 계속 차단된 것
- 추가할 가치가 있는 후속 시나리오

사용 가능한 시나리오 인벤토리에는 후속 작업 규모를 산정하거나 새 전송을 연결할 때 유용한 `pnpm openclaw qa coverage`를 실행하세요(기계가 읽을 수 있는 출력에는 `--json` 추가).
수정한 동작이나 파일 경로에 대한 집중 증거를 선택할 때는 `pnpm openclaw qa coverage --match <query>`를 실행하세요.
일치 보고서는 시나리오 메타데이터, 문서 참조, 코드 참조, 커버리지 ID, Plugin 및 프로바이더 요구 사항을 검색한 다음 일치하는 `qa suite --scenario ...` 대상을 출력합니다.
모든 `qa suite` 실행은 선택한
시나리오 세트에 대한 최상위 `qa-evidence.json`,
`qa-suite-summary.json`, `qa-suite-report.md` 아티팩트를 작성합니다. `execution.kind: vitest` 또는
`execution.kind: playwright`를 선언한 시나리오는 일치하는 테스트 경로를 실행하고
시나리오별 로그도 작성합니다. `execution.kind: script`를 선언한 시나리오는
`node --import tsx`를 통해 `execution.path`의
증거 생성기를 실행합니다(`execution.args`의 `${outputDir}` 및 `${scenarioId}` 확장). 생성기는
자체 `qa-evidence.json`을 작성하며, 그 항목은 스위트
출력으로 가져와지고 아티팩트 경로는 해당 생성기
`qa-evidence.json`을 기준으로 해석됩니다. `qa suite`가
`qa run --qa-profile`을 통해 도달되면, 동일한 `qa-evidence.json`에는 선택한 분류 범주의 프로필
스코어카드 요약도 포함됩니다.
이를 게이트 대체가 아니라 탐색 보조 도구로 취급하세요. 선택한 시나리오에는 여전히 테스트 중인 동작에 맞는 프로바이더 모드, 라이브 전송, Multipass, Testbox 또는 릴리스 레인이 필요합니다.
스코어카드 맥락은 [성숙도 스코어카드](/ko/maturity/scorecard)를 참조하세요.

문자와 스타일 검사를 위해 동일한 시나리오를 여러 라이브 모델
참조에서 실행하고 평가된 Markdown 보고서를 작성하세요.

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

이 명령은 Docker가 아니라 로컬 QA Gateway 자식 프로세스를 실행합니다. 문자 평가
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음 채팅, 워크스페이스 도움, 작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는
평가 중이라는 사실을 알리지 않아야 합니다. 이 명령은 각 전체
트랜스크립트를 보존하고 기본 실행 통계를 기록한 다음, 지원되는 경우
`xhigh` 추론을 사용해 빠른 모드에서 심사 모델에 자연스러움, 분위기, 유머 기준으로 실행 순위를 매기도록 요청합니다.
프로바이더를 비교할 때는 `--blind-judge-models`를 사용하세요. 심사 프롬프트는 여전히 모든 트랜스크립트와 실행 상태를 받지만, 후보 참조는 `candidate-01` 같은 중립
레이블로 대체됩니다. 보고서는 파싱 후 순위를 실제 참조로 다시 매핑합니다.
후보 실행은 기본적으로 `high` 사고를 사용하며, GPT-5.5에는 `medium`, 이를 지원하는 이전 OpenAI 평가 참조에는 `xhigh`를 사용합니다. 특정 후보는
`--model provider/model,thinking=<level>`로 인라인 재정의하세요. `--thinking <level>`은 여전히
전역 폴백을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식은
호환성을 위해 유지됩니다.
OpenAI 후보 참조는 프로바이더가 지원하는 경우 우선 처리 사용을 위해 기본적으로 빠른 모드를 사용합니다. 단일 후보 또는 심사에 재정의가 필요하면
`,fast`, `,no-fast`, 또는 `,fast=false`를 인라인으로 추가하세요. 모든 후보 모델에 빠른 모드를 강제로 켜고 싶을 때만 `--fast`를 전달하세요. 후보 및 심사 소요 시간은 벤치마크 분석을 위해
보고서에 기록되지만, 심사 프롬프트는 속도로 순위를 매기지 말라고 명시합니다.
후보 및 심사 모델 실행은 모두 기본 동시성 16입니다. 프로바이더 제한이나 로컬 Gateway
부하로 인해 실행이 너무 불안정해질 때는 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 문자 평가는
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, 그리고
`google/gemini-3.1-pro-preview`를 기본값으로 사용합니다.
`--judge-model`이 전달되지 않으면 심사는
`openai/gpt-5.5,thinking=xhigh,fast`와
`anthropic/claude-opus-4-8,thinking=high`를 기본값으로 사용합니다.

## 관련 문서

- [Matrix QA](/ko/concepts/qa-matrix)
- [성숙도 스코어카드](/ko/maturity/scorecard)
- [개인 에이전트 벤치마크 팩](/ko/concepts/personal-agent-benchmark-pack)
- [QA Channel](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
