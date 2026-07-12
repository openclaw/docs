---
read_when:
    - QA 스택의 구성 요소가 함께 작동하는 방식 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장하기
    - 리포지토리 기반 QA 시나리오 추가하기
    - Gateway 대시보드를 중심으로 더 현실적인 QA 자동화 구축하기
summary: 'QA 스택 개요: qa-lab, qa-channel, 리포지토리 기반 시나리오, 실시간 전송 레인, 전송 어댑터 및 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-07-12T21:32:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f82422737f5151bb971e93f830e3e7139c6f60887a33206d5d44259e4f5e51e7
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단위 테스트로는 불가능한 현실적이고 채널 형태에 가까운 방식으로 OpenClaw를 검증합니다.

구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드, 반응, 편집 및 삭제 표면을 제공하는 합성 메시지 채널입니다.
- `extensions/qa-lab`: 트랜스크립트를 관찰하고, 인바운드 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스입니다.
- `extensions/qa-matrix`: 자식 QA Gateway 내부에서 실제 Matrix Plugin을 구동하는 라이브 전송 어댑터입니다.
- `qa/`: 시작 작업과 기본 QA 시나리오를 위한 저장소 기반 시드 자산입니다.
- [Mantis](/ko/concepts/mantis): 실제 전송 수단, 브라우저 스크린샷, VM 상태 및 PR 증거가 필요한 버그에 대한 변경 전/후 라이브 검증입니다.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>`에서 실행됩니다. 다수의 흐름에는 `pnpm qa:*` 스크립트 별칭이 있으며, 두 형식 모두 작동합니다.

| 명령                                                | 목적                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` 없이 번들된 QA 자체 검사를 수행합니다. `--qa-profile smoke-ci`, `--qa-profile release` 또는 `--qa-profile all`을 사용하면 분류 체계 기반 성숙도 프로필 러너를 실행합니다.                                                                                                  |
| `qa suite`                                          | QA Gateway 레인에 대해 저장소 기반 시나리오를 실행합니다. `--runner multipass`는 호스트 대신 일회용 Linux VM을 사용합니다.                                                                                                                                         |
| `qa coverage`                                       | YAML 시나리오 범위 인벤토리를 출력합니다(머신 출력에는 `--json`, 변경한 동작에 대한 시나리오 검색에는 `--match <query>`, 런타임 도구 픽스처 범위에는 `--tools`를 사용합니다).                                                                                  |
| `qa parity-report`                                  | 모델 축 동등성 게이트를 위해 두 `qa-suite-summary.json` 파일을 비교하거나, `--runtime-axis --token-efficiency`를 사용하여 Codex와 OpenClaw 간 런타임 동등성 및 토큰 효율성 보고서를 작성합니다.                                                                          |
| `qa confidence-report`                              | 매니페스트에 따라 QA 증거 아티팩트를 분류하여 미확인 항목이 없는 신뢰도 보고서를 생성합니다.                                                                                                                                                                               |
| `qa confidence-self-test`                           | 신뢰도 게이트가 드리프트를 감지함을 입증하는 시드된 음성 대조군 카나리아를 작성합니다.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | 선별된 JSONL 트랜스크립트를 런타임 동등성 재생 하네스를 통해 재생합니다.                                                                                                                                                                                         |
| `qa character-eval`                                 | 여러 라이브 모델에 걸쳐 캐릭터 QA 시나리오를 실행하고 판정된 보고서를 생성합니다. [보고]를 참조하십시오(#reporting).                                                                                                                                                        |
| `qa manual`                                         | 선택한 제공자/모델 레인에 대해 일회성 프롬프트를 실행합니다.                                                                                                                                                                                                      |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | 사전 구성된 QA Docker 이미지를 빌드합니다.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | QA 대시보드와 Gateway 레인을 위한 docker-compose 스캐폴드를 작성합니다.                                                                                                                                                                                                |
| `qa up`                                             | QA 사이트를 빌드하고 Docker 기반 스택을 시작한 후 URL을 출력합니다(별칭: `pnpm qa:lab:up`, `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다).                                                                                              |
| `qa aimock`                                         | AIMock 제공자 서버만 시작합니다.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` 제공자 서버만 시작합니다.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex 자격 증명 풀을 관리합니다.                                                                                                                                                                                                                           |
| `qa discord`                                        | 실제 비공개 Discord 길드 채널을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                   |
| `qa matrix`                                         | 일회용 Tuwunel 홈서버를 대상으로 하는 라이브 전송 레인입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하십시오.                                                                                                                                                                  |
| `qa slack`                                          | 실제 비공개 Slack 채널을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                           |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 실제 WhatsApp Web 계정을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                                                                                             |
| `qa mantis`                                         | 라이브 전송 버그를 위한 변경 전/후 검증 러너로, Discord 상태 반응 증거, Crabbox 데스크톱/브라우저 스모크 테스트 및 VNC 내 Slack 스모크 테스트를 포함합니다. [Mantis](/ko/concepts/mantis) 및 [Mantis Slack 데스크톱 실행서](/ko/concepts/mantis-slack-desktop-runbook)를 참조하십시오. |

`qa matrix`는 러너 Plugin(`extensions/qa-matrix`)으로 등록되며, 위의 다른 모든 레인은 `qa-lab`에 직접 내장되어 있습니다.

### 프로필 기반 `qa run`

프로필 기반 `qa run`은 `taxonomy.yaml`에서 멤버십을 읽은 다음, 확인된 시나리오를 `qa suite`를 통해 디스패치합니다. `--surface`와 `--category`는 별도의 레인을 정의하는 대신 선택한 프로필을 필터링합니다. 생성되는 `qa-evidence.json`에는 선택된 카테고리 수와 누락된 범위 ID를 포함하는 프로필 스코어카드 요약이 들어가며, 개별 증거 항목은 테스트, 범위 역할 및 결과의 기준 정보로 유지됩니다. 분류 체계 기능 범위 ID는 별칭이 아니라 정확한 증명 대상입니다. 기본 시나리오 범위는 일치하는 ID를 충족하지만, 보조 범위는 권고용으로 유지됩니다. 범위 ID는 소문자 영숫자/대시 세그먼트로 구성된 점 구분 `namespace.behavior` 형식을 사용하며, 프로필, 표면 및 카테고리 ID는 기존의 대시 또는 점 구분 분류 체계 ID를 계속 사용할 수 있습니다.

간소화된 증거는 항목별 `execution`을 생략하고 `evidenceMode: "slim"`을 설정합니다. `smoke-ci`는 기본적으로 간소화 모드를 사용하며, `--evidence-mode full`은 전체 항목을 복원합니다.

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

모의 모델 제공자와 Crabline 로컬 제공자 서버를 사용한 결정론적 프로필 증명에는 `smoke-ci`를 사용하십시오. 라이브 채널을 대상으로 하는 Stable/LTS 증명에는 `release`를 사용하십시오. 명시적인 전체 분류 체계 증거 실행에만 `all`을 사용하십시오. 이 프로필은 모든 활성 성숙도 카테고리를 선택하며 `qa_profile=all`을 사용하여 `QA
Profile Evidence` GitHub Actions 워크플로를 통해 디스패치할 수 있습니다. 명령에 OpenClaw 루트 프로필도 필요한 경우, 루트 프로필을 QA 명령 앞에 배치하십시오.

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 운영자 흐름

현재 QA 운영자 흐름은 두 개의 창으로 구성된 QA 사이트입니다.

- 왼쪽: 에이전트가 표시되는 Gateway 대시보드(Control UI).
- 오른쪽: Slack과 유사한 트랜스크립트와 시나리오 계획을 표시하는 QA Lab.

다음 명령으로 실행하십시오.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고 Docker 기반 Gateway 레인을 시작한 후,
운영자 또는 자동화 루프가 에이전트에 QA 임무를 부여하고, 실제 채널 동작을
관찰하며, 성공한 항목, 실패한 항목 또는 차단된 상태로 남은 항목을 기록할 수
있는 QA Lab 페이지를 제공합니다.

매번 Docker 이미지를 다시 빌드하지 않고 QA Lab UI를 더 빠르게 반복 개발하려면,
바인드 마운트된 QA Lab 번들로 스택을 시작하십시오.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 사전 빌드된 이미지에서 Docker 서비스를 계속 실행하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다.
`qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가
변경되면 브라우저가 자동으로 새로고침됩니다.

### 관찰 가능성 스모크 테스트

<Note>
관찰 가능성 QA는 소스 체크아웃에서만 실행됩니다. npm tarball에는 의도적으로
QA Lab과 (`qa-channel`/`qa-matrix`)가 제외되므로, 패키지 Docker 릴리스 레인에서는
`qa` 명령을 실행하지 않습니다. 진단 계측을 변경할 때는 빌드된 소스 체크아웃에서
이 테스트를 실행하십시오.
</Note>

| 별칭                                    | 실행 내용                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 로컬 OpenTelemetry 수신기와 `diagnostics-otel`이 활성화된 `otel-trace-smoke` 시나리오를 실행합니다.                                       |
| `pnpm qa:otel:collector-smoke`          | 실제 OpenTelemetry Collector Docker 컨테이너를 거치는 동일한 레인을 실행합니다. 엔드포인트 연결이나 Collector/OTLP 호환성을 변경할 때 사용하십시오. |
| `pnpm qa:prometheus:smoke`              | `diagnostics-prometheus`가 활성화된 `docker-prometheus-smoke` 시나리오를 실행합니다.                                                      |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke`에 이어 `qa:prometheus:smoke`를 실행합니다.                                                                                |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke`에 이어 `qa:prometheus:smoke`를 실행합니다.                                                                      |

`qa:otel:smoke`는 로컬 OTLP/HTTP 수신기를 시작하고 최소한의 QA 채널
에이전트 턴을 실행한 다음, 트레이스, 메트릭, 로그가 내보내졌는지 확인합니다. 내보낸
protobuf 트레이스 스팬을 디코딩하고 릴리스에 중요한 형식을 검사합니다.
`openclaw.run`, `openclaw.harness.run`, 최신 GenAI 의미 규칙을 따르는
모델 호출 스팬, `openclaw.context.assembled`, `openclaw.message.delivery`가
모두 있어야 합니다. 이 스모크는
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`을 강제하므로 모델 호출
스팬은 `{gen_ai.operation.name} {gen_ai.request.model}` 이름을 사용해야 합니다. 모델
호출은 성공한 턴에서 `StreamAbandoned`를 내보내면 안 되며, 원시 진단
ID와 `openclaw.content.*` 속성은 트레이스에 포함되지 않아야 합니다. 시나리오
프롬프트는 모델에 고정 마커로 응답하고 고정된
비밀 문자열은 공개하지 않도록 요청합니다. 원시 OTLP 페이로드에는 이 둘은 물론
시나리오 ID에서 파생된 QA 세션 키도 포함되면 안 됩니다. QA 제품군 아티팩트
옆에 `otel-smoke-summary.json`을 기록합니다.

`qa:prometheus:smoke`는 인증되지 않은 스크레이프가 거부되는지 확인한 다음,
인증된 스크레이프에 릴리스에 중요한 메트릭 패밀리가 포함되어 있는지 검사합니다.
이때 프롬프트 콘텐츠, 응답 콘텐츠, 원시 진단 식별자, 인증
토큰 또는 로컬 경로는 포함되지 않아야 합니다.

### Matrix 스모크 레인

모델 제공자 자격 증명이 필요하지 않은 실제 전송 기반 Matrix 스모크 레인을 실행하려면,
결정론적 모의 OpenAI 제공자와 함께 빠른 프로필을 실행하십시오.

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

실제 프런티어 제공자 레인에는 OpenAI 호환 자격 증명을
명시적으로 제공하십시오.

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, 환경 변수 및 아티팩트
레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 간단히 말하면,
Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고 임시
드라이버/SUT/관찰자 사용자를 등록하며, 해당 전송 범위로 제한된 하위 QA
Gateway 안에서 실제 Matrix Plugin을 실행합니다(`qa-channel`은 사용하지 않음). 그런 다음 Markdown
보고서, JSON 요약, 관찰된 이벤트 아티팩트 및 통합 출력 로그를
`.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 기록합니다.

시나리오는 단위 테스트만으로는 엔드투엔드로 입증할 수 없는 전송 동작을 다룹니다.
멘션 게이팅, 봇 허용 정책, 허용 목록, 최상위 및 스레드
답장, DM 라우팅, 반응 처리, 수신 편집 억제, 재시작
재생 중복 제거, 홈서버 중단 복구, 승인 메타데이터 전달,
미디어 처리 및 Matrix E2EE 부트스트랩/복구/검증 흐름을 포함합니다.
E2EE CLI 프로필은 Gateway 응답을 확인하기 전에 동일한 일회용 홈서버를 통해
`openclaw matrix encryption setup` 및 검증 명령도 실행합니다.

CI는
`.github/workflows/qa-live-transports-convex.yml`에서 동일한 명령 표면을 사용합니다. 예약 실행과 기본
수동 실행은 QA가 제공하는 실제 프런티어 자격 증명, `--fast` 및
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`을 사용하여 빠른 Matrix 프로필을 실행합니다.
수동 `matrix_profile=all`은 `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, `e2ee-cli`의 다섯 프로필 샤드로 분산됩니다.

### Discord Mantis 시나리오

Discord에는 버그 재현을 위한 Mantis 전용 선택형 시나리오도 있습니다. 명시적인 상태
반응 타임라인에는 `--scenario discord-status-reactions-tool-only`를 사용하고, 실제 Discord 스레드를 생성하여 `message.thread-reply`가
`filePath` 첨부 파일을 보존하는지 확인하려면 `--scenario discord-thread-reply-filepath-attachment`를
사용하십시오. 이러한 시나리오는 광범위한 스모크 범위가 아니라
변경 전/후 재현 프로브이므로 기본 실제 Discord 레인에는 포함되지 않습니다.
QA 환경에
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 또는
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`가 구성되어 있으면 스레드 첨부 파일 Mantis 워크플로에
로그인된 Discord Web 증거 동영상을 추가할 수도 있습니다.
이 뷰어 프로필은 시각적 캡처에만 사용되며, 통과/실패
결정은 여전히 Discord REST 오라클을 따릅니다.

실제 전송 기반 Discord, Slack, Telegram 및 WhatsApp 스모크 레인에는 다음을 실행하십시오.

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

이 레인들은 두 개의 봇 또는 계정(드라이버 +
SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 환경 변수, 시나리오 목록, 출력 아티팩트 및 Convex
자격 증명 풀은 아래의
[Discord, Slack, Telegram 및 WhatsApp QA 참조](#discord-slack-telegram-and-whatsapp-qa-reference)에
문서화되어 있습니다.

### Mantis Slack 데스크톱 및 시각적 작업 러너

VNC 복구 기능이 포함된 전체 Slack 데스크톱 VM 실행에는 다음을 실행하십시오.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱/브라우저 머신을 임대하고, VM 내부에서 Slack 실제
레인을 실행하며, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 캡처한 다음,
`slack-qa/`, `slack-desktop-smoke.png` 및
`slack-desktop-smoke.mp4`(동영상 캡처를 사용할 수 있는 경우)를
Mantis 아티팩트 디렉터리로 복사합니다. Crabbox 데스크톱/브라우저 임대에는 캡처
도구와 브라우저/네이티브 빌드 도우미 패키지가 미리 제공되므로, 시나리오는
이전 임대에서만 대체 항목을 설치해야 합니다. Mantis는
`mantis-slack-desktop-smoke-report.md`에 전체 및 단계별 시간을 보고하므로 느린 실행에서
임대 준비, 자격 증명 획득, 원격 설정 또는
아티팩트 복사 중 어디에 시간이 소요되었는지 확인할 수 있습니다. VNC를 통해 Slack Web에
수동으로 로그인한 후 `--lease-id <cbx_...>`를 재사용하십시오.
재사용된 임대는 Crabbox의 pnpm 저장소 캐시도 준비된 상태로 유지합니다.
기본 `--hydrate-mode source`는 소스 체크아웃에서 검증하고
VM 내부에서 설치/빌드를 실행합니다. 재사용된 원격 작업 공간에 이미 `node_modules`와 빌드된 `dist/`가 있을 때만
`--hydrate-mode prehydrated`를 사용하십시오.
이 모드는 비용이 큰 설치/빌드 단계를 건너뛰고 작업 공간이
준비되지 않았으면 안전하게 실패합니다. `--gateway-setup`을 사용하면 Mantis는
포트 `38973`에서 실행되는 영구 OpenClaw Slack Gateway를 VM 내부에 남겨 둡니다. 이를 사용하지 않으면
명령은 일반적인 봇 간 Slack QA 레인을 실행하고 아티팩트
캡처 후 종료합니다.

데스크톱 증거로 네이티브 Slack 승인 UI를 입증하려면 Mantis
승인 체크포인트 모드를 실행하십시오.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

이 모드는 `--gateway-setup`과 함께 사용할 수 없습니다. Slack
승인 시나리오를 실행하고, 승인이 아닌 시나리오 ID를 거부하며, 각 보류 중 및
해결된 승인 상태에서 대기하고, 관찰된 Slack API 메시지를
`approval-checkpoints/<scenario>-pending.png`와
`approval-checkpoints/<scenario>-resolved.png`로 렌더링한 다음, 체크포인트,
메시지 증거, 확인 응답 또는 렌더링된 스크린샷이 누락되거나
비어 있으면 실패합니다. 콜드 CI 임대에서는
`slack-desktop-smoke.png`에 Slack 로그인 화면이 계속 표시될 수 있습니다. 승인 체크포인트 이미지는 이 레인의 시각적
증거입니다.

기본 체크포인트 실행은 두 가지 표준 Slack 승인 시나리오를 유지합니다.
선택형 Codex 승인 경로 중 하나를 캡처하려면
`--scenario slack-codex-approval-exec-native` 또는
`--scenario slack-codex-approval-plugin-native`를 사용하여 명시적으로 선택하십시오. Mantis는 둘 다 허용하고
동일한 보류/해결 스크린샷 쌍을 생성합니다. 러너는 선택된 각 Codex 경로에 대해 체크포인트
및 원격 명령 기한을 늘려 전체
승인, 에이전트 완료 및 해결 업데이트 시퀀스가 완료될 수 있도록 합니다.

운영자 체크리스트, GitHub 워크플로 디스패치 명령, 증거 댓글
계약, hydrate 모드 결정표, 시간 해석 및 실패
처리 단계는
[Mantis Slack 데스크톱 런북](/ko/concepts/mantis-slack-desktop-runbook)에 있습니다.

에이전트/CV 방식의 데스크톱 작업에는 다음을 실행하십시오.

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task`는 Crabbox 데스크톱/브라우저 머신을 임대하거나 재사용하고,
`crabbox record --while`를 시작하며, 중첩된
`visual-driver`를 통해 보이는 브라우저를 조작하고, `visual-task.png`를 캡처하며,
`--vision-mode image-describe`가 선택되었을 때 스크린샷을 대상으로 `openclaw infer image
describe`를 실행하고, `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` 및
`mantis-visual-task-report.md`를 기록합니다. `--expect-text`가 설정되면 비전
프롬프트는 구조화된 JSON 판정(`visible`, `evidence`, `reason`)을 요청하며,
모델이 예상 텍스트를 인용하는 증거와 함께 `visible: true`를 보고한 경우에만
통과합니다. 대상 텍스트를 단순히 인용하는 `visible: false` 응답은
여전히 어설션에 실패합니다. 이미지 이해 제공자를 호출하지 않고
데스크톱, 브라우저, 스크린샷 및 동영상
연결을 입증하는 무모델 스모크에는 `--vision-mode metadata`를 사용하십시오. 녹화는
`visual-task`의 필수 아티팩트입니다. Crabbox가 비어 있지 않은
`visual-task.mp4`를 녹화하지 않으면 시각적 드라이버가 통과해도 작업은 실패합니다.
실패 시 작업이 이미 통과했고 `--keep-lease`가 설정되지 않은 경우가 아니라면
Mantis는 VNC를 위해 임대를 유지합니다.

### 자격 증명 풀 상태 검사

풀링된 실제 자격 증명을 사용하기 전에 다음을 실행하십시오.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex 브로커 환경(`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`)을 검사하고, 엔드포인트 설정을 검증하며,
`OPENCLAW_QA_CONVEX_SECRET_CI`와
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`에 대해서는 설정됨/누락 상태만 보고하고,
유지 관리자 비밀이 있는 경우 관리/목록 접근 가능성을 확인합니다.

## 실제 전송 범위

실제 전송 레인은 각각 자체 시나리오 목록 형식을 고안하는 대신 하나의 계약을 공유합니다.
`qa-channel`은 광범위한 합성 제품 동작
제품군이며 실제 전송 범위 매트릭스에는 포함되지 않습니다.

실제 전송 러너는 공유 시나리오 ID, 기준 범위
도우미 및 시나리오 선택 도우미를
`openclaw/plugin-sdk/qa-live-transport-scenarios`에서 가져옵니다.

| 레인     | Canary | 멘션 게이팅 | 봇 간 통신 | 허용 목록 차단 | 최상위 답글 | 인용 답글 | 재시작 후 재개 | 스레드 후속 응답 | 스레드 격리 | 반응 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | ------ | ----------- | ---------- | -------------- | ----------- | --------- | -------------- | ---------------- | ----------- | --------- | ----------- | ------------------ |
| Discord  | x      | x           | x          |                |             |           |                |                  |             |           |             | x                  |
| Matrix   | x      | x           | x          | x              | x           |           | x              | x                | x           | x         |             |                    |
| Slack    | x      | x           | x          | x              | x           |           | x              | x                | x           |           |             |                    |
| Telegram | x      | x           | x          |                |             |           |                |                  |             |           | x           |                    |
| WhatsApp | x      | x           |            | x              | x           | x         | x              |                  |             | x         | x           |                    |

이렇게 하면 Matrix, Telegram 및 기타 라이브 전송 수단이 하나의 명시적인 전송 계약
체크리스트를 공유하면서도 `qa-channel`은 광범위한 제품 동작 제품군으로
유지됩니다.

QA 경로에 Docker를 도입하지 않고 일회용 Linux VM 레인을 실행하려면 다음을 실행하십시오.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새로운 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트
내부에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와
요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다. 호스트에서
`qa suite`를 실행할 때와 동일한 시나리오 선택 동작을 재사용합니다.

호스트 및 Multipass 제품군 실행은 기본적으로 격리된 Gateway 워커를 사용하여
선택된 여러 시나리오를 병렬로 실행합니다. `qa-channel`의 기본 동시 실행 수는
4이며, 선택된 시나리오 수를 상한으로 합니다. 워커 수를 조정하려면 `--concurrency
<count>`를 사용하고, 직렬로 실행하려면 `--concurrency 1`을 사용하십시오.
개인 비서 벤치마크 팩(10개 시나리오)을 실행하려면 `--pack personal-agent`를
사용하십시오. 팩 선택기는 반복되는 `--scenario` 플래그에 추가로 적용됩니다.
명시적인 시나리오가 먼저 실행된 다음, 팩 시나리오가 팩 순서대로 실행되며
중복은 제거됩니다. 사용자 지정 QA 러너가 이미 OpenTelemetry 컬렉터 설정을
제공하는 경우 `otel-trace-smoke`와 `docker-prometheus-smoke` 시나리오를 함께
선택하려면 `--pack observability`를 사용하십시오.

시나리오가 하나라도 실패하면 명령은 0이 아닌 값으로 종료됩니다. 실패 종료 코드
없이 아티팩트만 생성하려면 `--allow-failures`를 사용하십시오.

라이브 실행은 게스트에서 실용적으로 사용할 수 있는 지원되는 QA 인증 입력, 즉
환경 변수 기반 제공자 키, QA 라이브 제공자 구성 경로 및 존재하는 경우
`CODEX_HOME`을 전달합니다. 게스트가 마운트된 작업 공간을 통해 결과를 다시 쓸 수
있도록 `--output-dir`을 저장소 루트 아래로 유지하십시오.

## Discord, Slack, Telegram 및 WhatsApp QA 참조

Matrix는 시나리오 수와 Docker 기반 홈서버 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가
있습니다. Discord, Slack, Telegram 및 WhatsApp은 기존의 실제 전송 수단을
대상으로 실행되므로 해당 참조는 여기에 있습니다.

### 공통 CLI 플래그

이 레인들은
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해
등록되며 동일한 플래그를 허용합니다.

| 플래그                                | 기본값                                             | 설명                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 이 시나리오만 실행합니다. 반복해서 지정할 수 있습니다.                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 보고서, 요약, 증거, 전송 수단별 아티팩트 및 출력 로그가 기록되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다.                       |
| `--repo-root <path>`                  | `process.cwd()`                                    | 중립적인 현재 작업 디렉터리에서 호출할 때 사용할 저장소 루트입니다.                                                                                |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 구성 내부의 임시 계정 ID입니다.                                                                                                        |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 또는 `live-frontier`입니다(레거시 `live-openai`도 계속 작동합니다).                                                                  |
| `--model <ref>` / `--alt-model <ref>` | 제공자 기본값                                      | 기본/대체 모델 참조입니다.                                                                                                                        |
| `--fast`                              | 꺼짐                                               | 지원되는 경우 제공자 고속 모드를 사용합니다.                                                                                                      |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하십시오.                                                                                    |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`              | `--credential-source convex`일 때 사용하는 역할입니다.                                                                                            |

각 레인은 시나리오가 하나라도 실패하면 0이 아닌 값으로 종료됩니다.
`--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 기록합니다.
Telegram은 사용 가능한 시나리오 ID를 출력하고 종료하는 `--list-scenarios`도
허용하지만, 다른 레인에서는 해당 플래그를 제공하지 않습니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

서로 다른 두 봇(드라이버 + SUT)이 있는 하나의 실제 비공개 Telegram 그룹을
대상으로 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 합니다. 두 봇 모두
`@BotFather`에서 **Bot-to-Bot Communication Mode**를 활성화하면 봇 간 관찰이
가장 원활하게 작동합니다.

`--credential-source env`일 때 필요한 환경 변수는 다음과 같습니다.

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
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

암시적 기본 세트에는 항상 카나리, 멘션 게이팅, 네이티브 명령
응답, 명령 주소 지정, 봇 간 그룹 응답이 포함됩니다. `mock-openai`
기본값에는 결정론적 응답 체인 및 최종 메시지 스트리밍 검사도
포함됩니다. `telegram-current-session-status-tool`과
`telegram-tool-only-usage-footer`는 선택 사항으로 유지됩니다. 전자는
카나리 직후에 직접 이어 실행할 때만 안정적이며, 후자는 도구 전용
응답에서 `/usage` 바닥글을 검증하는 실제 Telegram 증거입니다. 현재
기본/선택 사항 구분과 회귀 참조를 출력하려면 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai`를 사용하십시오.

출력 아티팩트:

- `telegram-qa-report.md`
- `qa-evidence.json` - 프로필, 적용 범위, 제공자, 채널, 아티팩트, 결과,
  RTT 필드를 포함한 라이브 전송 검사 증거 항목입니다.

패키지 Telegram 실행은 동일한 Telegram 자격 증명 계약을 사용합니다.
반복 RTT 측정은 일반 패키지 Telegram 라이브 레인의 일부이며, 선택한
RTT 검사의 RTT 분포는 `result.timing` 아래의 `qa-evidence.json`에
통합됩니다.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`가 설정되면 패키지 라이브 래퍼는
`kind: "telegram"` 자격 증명을 임대하고, 임대한 그룹/드라이버/SUT 봇
환경 변수를 설치된 패키지 실행으로 내보내며, 임대에 Heartbeat를 보내고
종료 시 임대를 해제합니다. 패키지 래퍼는 기본적으로
`telegram-mentioned-message-reply`에 대해 20회의 RTT 검사, 30s의 RTT
시간 제한을 사용하며, Convex를 선택한 경우 CI 외부에서는 Convex 역할
`maintainer`를 사용합니다. 별도의 RTT 명령이나 Telegram 전용 요약
형식을 만들지 않고 RTT 측정을 조정하려면
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`,
또는 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`를 재정의하십시오.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 개의 봇이 있는 하나의 실제 비공개 Discord 길드 채널을 대상으로
합니다. 하나는 하네스가 제어하는 드라이버 봇이고, 다른 하나는 번들
Discord Plugin을 통해 하위 OpenClaw Gateway가 시작하는 SUT 봇입니다.
채널 멘션 처리, SUT 봇이 Discord에 네이티브 `/help` 명령을 등록했는지,
선택 사항인 Mantis 증거 시나리오를 검증합니다.

`--credential-source env` 사용 시 필요한 환경 변수:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord가 반환한 SUT 봇 사용자
  ID와 일치해야 합니다(그렇지 않으면 레인이 즉시 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에
  메시지 본문을 유지합니다.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`는 `discord-voice-autojoin`에 사용할
  음성/스테이지 채널을 선택합니다. 이 값이 없으면 시나리오는 SUT 봇에
  표시되는 첫 번째 음성/스테이지 채널을 선택합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 선택 사항인 음성 시나리오입니다. 단독으로
  실행되고 `channels.discord.voice.autoJoin`을 활성화하며, SUT 봇의 현재
  Discord 음성 상태가 대상 음성/스테이지 채널인지 검증합니다. Convex
  Discord 자격 증명에는 선택 사항인 `voiceChannelId`가 포함될 수
  있습니다. 그렇지 않으면 러너가 길드에서 표시되는 첫 번째
  음성/스테이지 채널을 찾습니다.
- `discord-status-reactions-tool-only` - 선택 사항인 Mantis 시나리오입니다.
  SUT를 `messages.statusReactions.enabled=true`가 설정된 상시 활성화 도구
  전용 길드 응답으로 전환하므로 단독으로 실행된 후, REST 반응 타임라인과
  HTML/PNG 시각적 아티팩트를 캡처합니다. Mantis 전후 보고서는
  시나리오에서 제공한 MP4 아티팩트도 `baseline.mp4`와 `candidate.mp4`로
  보존합니다.
- `discord-thread-reply-filepath-attachment` - 선택 사항인 Mantis
  시나리오입니다. [Discord Mantis 시나리오](#discord-mantis-scenarios)를
  참조하십시오.

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
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

출력 아티팩트:

- `discord-qa-report.md`
- `qa-evidence.json` - 라이브 전송 검사에 대한 증거 항목입니다.
- `discord-qa-observed-messages.json` - 다음을 설정하지 않으면 본문이 수정 처리됩니다.
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- 상태 반응 시나리오가 실행되면 `discord-qa-reaction-timelines.json` 및
  `discord-status-reactions-tool-only-timeline.png`가 생성됩니다.

### Slack QA

```bash
pnpm openclaw qa slack
```

하네스가 제어하는 드라이버 봇과 번들 Slack Plugin을 통해 하위 OpenClaw Gateway가 시작하는 SUT 봇이라는 서로 다른 두 봇으로 하나의 실제 비공개 Slack 채널을 대상으로 합니다.

`--credential-source env` 사용 시 필요한 환경 변수:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

선택 사항:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`은 Mantis의 시각적 승인 체크포인트를 활성화합니다. 실행기는 `<scenario>.pending.json` 및
  `<scenario>.resolved.json`을 작성한 다음, 일치하는 `.ack.json` 파일을 기다립니다.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS`는 체크포인트 확인 제한 시간을 재정의합니다. 기본값은 `120000`입니다.

Slack 라이브 어댑터를 통해 노출되는 표준 YAML 시나리오:

- `thread-follow-up`
- `thread-isolation`

명령형 Slack 시나리오(`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted`, `slack-progress-commentary-verbose-dedupe` - 독립적인 해설/도구 진행률 제어, 키가 생략된 경우의 레거시 기본값, 지속적 상세 진행률이 켜져 있을 때의 단일 전달 동작을 검사하는 선택적 실제 Slack 프로브입니다.
- `slack-reaction-glyph-native` - 선택적 라이브 메시지 도구 반응 시나리오입니다.
  에이전트가 정확한 `✅` 글리프를 전달하도록 지시하고, 대상 메시지의 SUT 봇에 대해 Slack이 `white_check_mark`를 저장했는지 확인합니다.
- `slack-chart-presentation-native` - 네이티브 `data_visualization` 블록과 정확한 접근성 텍스트를 확인하는 선택적 이식 가능 차트 시나리오입니다.
- `slack-table-presentation-native` - 네이티브 `data_table` 블록, 정확한 행 및 접근성 텍스트를 확인하는 선택적 이식 가능 표 시나리오입니다.
- `slack-table-invalid-blocks-fallback` - 구조적으로 읽을 수 있지만 제한을 초과한 원시 표를 헤더와 101개의 데이터 행으로 구성하여 프로덕션 Slack 전송 경로를 통해 보내고, Slack 자체가 `invalid_blocks`를 반환함을 입증하며, 저장된 서식 비활성화 대체 항목이 완전하고 네이티브 데이터 블록을 포함하지 않는지 확인하는 선택적 직접 전송 시나리오입니다. 보고서는 안전한 오류 코드, 개수 및 불리언 증거만 유지하며, 원시 합성 표 텍스트에는
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`가 적용됩니다.
- `slack-approval-exec-native` - 선택적 네이티브 Slack exec 승인 시나리오입니다.
  Gateway를 통해 exec 승인을 요청하고, Slack 메시지에 네이티브 승인 버튼이 있는지 확인하고, 이를 처리한 다음, 처리된 Slack 업데이트를 확인합니다.
- `slack-approval-plugin-native` - 선택적 네이티브 Slack Plugin 승인 시나리오입니다. Plugin 이벤트가 exec 승인 라우팅에 의해 억제되지 않도록 exec 및 Plugin 승인 전달을 함께 활성화한 다음, 동일한 보류/처리 완료 네이티브 Slack UI 경로를 확인합니다.
- `slack-codex-approval-exec-native` - 선택적 Codex Guardian 명령 승인 시나리오입니다. Guardian 모드에서 Codex Plugin을 활성화하고, Slack에서 시작된 Gateway 에이전트 턴을 Codex 앱 서버 하네스를 통해 라우팅하고,
  `openclaw-codex-app-server`에 대한 네이티브 Slack Plugin 승인 프롬프트를 기다린 후 이를 처리하며, Codex 턴이 예상된 명령 출력 및 어시스턴트 마커와 함께 완료되는지 확인합니다.
- `slack-codex-approval-plugin-native` - 선택적 Codex Guardian 파일 승인 시나리오입니다. 작업 공간 외부의 `apply_patch` 지시를 사용하여 Codex가 앱 서버 파일 변경 승인 경로를 내보내도록 한 다음, 동일한 네이티브 Slack 보류/처리 완료 승인 경로, 최종 어시스턴트 마커 및 정리 전 정확한 파일 내용을 확인합니다.

Codex 승인 시나리오에는 `openai/*` 또는 `codex/*` `--model`, 일반 라이브 모델 자격 증명, 그리고 Codex Plugin에서 허용하는 Codex 인증 또는 API 키 인증이 필요합니다.
Slack 보고서에는 수정 처리된 Slack 승인 메타데이터와 함께 Codex 앱 서버 메서드, 선택된 Codex 모델 키, 최종 Codex 턴 상태 및 작업 마커 검증이 포함됩니다.

출력 아티팩트:

- `slack-qa-report.md`
- `qa-evidence.json` - 라이브 전송 검사에 대한 증거 항목입니다.
- `slack-qa-observed-messages.json` - 다음을 설정하지 않으면 본문이 수정 처리됩니다.
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - Mantis가
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`을 설정한 경우에만 생성되며, 체크포인트 JSON, 확인 JSON 및 보류/처리 완료 스크린샷을 포함합니다.

#### Slack 작업 공간 설정

이 레인에는 한 작업 공간의 서로 다른 두 Slack 앱과 두 봇이 모두 구성원인 채널이 필요합니다.

- `channelId` - 두 봇 모두 초대된 채널의 `Cxxxxxxxxxx` ID입니다. 전용 채널을 사용하십시오. 레인은 실행할 때마다 게시합니다.
- `driverBotToken` - **Driver** 앱의 봇 토큰(`xoxb-...`)입니다.
- `sutBotToken` - **SUT** 앱의 봇 토큰(`xoxb-...`)입니다. 봇 사용자 ID가 서로 다르도록 드라이버와 별개의 Slack 앱이어야 합니다.
- `sutAppToken` - `connections:write`가 있는 SUT 앱의 앱 수준 토큰(`xapp-...`)으로, SUT 앱이 이벤트를 받을 수 있도록 Socket Mode에서 사용됩니다.

프로덕션 작업 공간을 재사용하는 것보다 QA 전용 Slack 작업 공간을 사용하는 것이 좋습니다.

아래 SUT 매니페스트는 번들 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:12`)를 라이브 Slack QA 제품군에서 다루는 권한과 이벤트로 의도적으로 제한합니다. 사용자가 보는 프로덕션 채널 설정은
[Slack 채널 빠른 설정](/ko/channels/slack#quick-setup)을 참조하십시오. 이 레인에는 한 작업 공간에서 서로 다른 두 봇 사용자 ID가 필요하므로 QA Driver/SUT 쌍은 의도적으로 분리되어 있습니다.

**1. Driver 앱 만들기**

[api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_로 이동하고 → QA 작업 공간을 선택한 후, 다음 매니페스트를 붙여 넣고
_Install to Workspace_를 실행하십시오.

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack 라이브 레인용 테스트 드라이버 봇"
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

_Bot User OAuth Token_(`xoxb-...`)을 복사하십시오. 이것이
`driverBotToken`이 됩니다. 드라이버는 메시지를 게시하고 자신을 식별하기만 하면 되며, 이벤트나 Socket Mode는 필요하지 않습니다.

**2. SUT 앱 만들기**

동일한 작업 공간에서 _Create New App → From a manifest_를 반복하십시오. 이 QA 앱은 번들 Slack Plugin의 프로덕션 매니페스트(`extensions/slack/src/setup-shared.ts:12`)보다 의도적으로 범위를 좁힌 버전을 사용합니다. 라이브 Slack QA 제품군에서는 아직 반응 처리를 다루지 않으므로 반응 범위 및 이벤트가 생략됩니다.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw용 OpenClaw QA SUT 커넥터"
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

Slack이 앱을 만든 후 설정 페이지에서 다음 두 작업을 수행하십시오.

- _Install to Workspace_ → _Bot User OAuth Token_ 복사 → 이것이
  `sutBotToken`이 됩니다.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 범위
  `connections:write` 추가 → 저장 → `xapp-...` 값 복사 → 이것이
  `sutAppToken`이 됩니다.

각 토큰에서 `auth.test`를 호출하여 두 봇의 사용자 ID가 서로 다른지 확인하십시오. 런타임은 사용자 ID로 드라이버와 SUT를 구분합니다. 두 역할에 하나의 앱을 재사용하면 멘션 게이팅이 즉시 실패합니다.

**3. 채널 만들기**

QA 작업 공간에서 채널(예: `#openclaw-qa`)을 만들고 채널 내부에서 두 봇을 모두 초대하십시오.

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_에서 `Cxxxxxxxxxx` ID를 복사하십시오. 이것이
`channelId`가 됩니다. 공개 채널을 사용할 수 있습니다. 비공개 채널을 사용하는 경우에도 두 앱에 이미 `groups:history`가 있으므로 하네스의 기록 읽기가 계속 성공합니다.

**4. 자격 증명 등록**

두 가지 옵션이 있습니다. 단일 머신 디버깅에는 환경 변수를 사용하거나(`OPENCLAW_QA_SLACK_*` 변수 4개를 설정하고 `--credential-source env` 전달), CI와 다른 유지관리자가 대여할 수 있도록 공유 Convex 풀을 시드하십시오.

Convex 풀의 경우 네 필드를 JSON 파일에 작성하십시오.

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

셸에 `OPENCLAW_QA_CONVEX_SITE_URL` 및 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`를 내보낸 상태에서 등록하고 확인하십시오.

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"`이고 `lease` 필드가 없어야 합니다.

**5. 엔드 투 엔드 확인**

두 봇이 브로커를 통해 서로 통신할 수 있는지 확인하려면 레인을 로컬에서 실행하십시오.

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

성공적인 실행은 30초보다 훨씬 짧은 시간 안에 완료되며, `slack-qa-report.md`에서 `slack-canary`와 `slack-mention-gating`의 상태가 모두 `pass`로 표시됩니다. 레인이 약 90초 동안 멈춘 후 `Convex credential pool exhausted
for kind "slack"`와 함께 종료되면 풀이 비어 있거나 모든 행이 대여된 것입니다. `qa
credentials list --kind slack --status all --json`에서 어느 경우인지 확인할 수 있습니다.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

하네스가 제어하는 드라이버 계정과 번들 WhatsApp Plugin을 통해 하위 OpenClaw Gateway가 시작하는 SUT 계정이라는 두 개의 전용 WhatsApp Web 계정을 대상으로 합니다.

`--credential-source env` 사용 시 필요한 환경 변수:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

선택 사항:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID`는
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, 그룹 작업/미디어/투표 시나리오,
  `whatsapp-group-allowlist-block`과 같은 그룹 시나리오를 활성화합니다.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에
  메시지 본문을 유지합니다.

시나리오 카탈로그(`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- 기준선 및 그룹 게이팅: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- 네이티브 명령: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- 답장 및 최종 출력 동작: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- 사용자 경로 메시지 작업: `whatsapp-agent-message-action-react`는 실제
  드라이버 DM에서 시작하여 모델이 `message` 도구를 호출하도록 하고,
  네이티브 WhatsApp 반응을 관찰합니다. `whatsapp-agent-message-action-upload-file`은
  `message(action=upload-file)`에 동일한 방식을 사용하고 네이티브
  WhatsApp 미디어를 관찰합니다. `whatsapp-group-agent-message-action-react`와
  `whatsapp-group-agent-message-action-upload-file`은 실제 WhatsApp 그룹에서
  동일하게 사용자에게 표시되는 작업을 입증합니다.
- 그룹 팬아웃: `whatsapp-broadcast-group-fanout`은 멘션이 포함된 하나의
  WhatsApp 그룹 메시지에서 시작하여 `main`과 `qa-second`에서 각각
  별도로 표시되는 답장을 검증합니다.
- 그룹 활성화: `whatsapp-group-activation-always`는 실제 그룹 세션을
  `/activation always`로 변경하고, 멘션이 없는 그룹 메시지가 에이전트를
  깨우는지 입증한 다음 `/activation mention`으로 복원합니다.
  `whatsapp-group-reply-to-bot-triggers`는 봇 답장을 먼저 생성하고, 명시적인
  멘션 없이 해당 답장에 네이티브 인용 답장을 보낸 후, 그 답장 컨텍스트에서
  에이전트가 깨어나는지 검증합니다.
- 인바운드 미디어 및 구조화된 메시지: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  드라이버를 통해 실제 WhatsApp 이미지, 오디오, 문서, 위치, 연락처,
  스티커 및 반응 이벤트를 전송합니다.
- 직접 Gateway 계약 프로브: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. 이들은 의도적으로 모델 프롬프팅을
  우회하고 결정론적인 Gateway/채널 `send`, `poll` 및
  `message.action` 계약을 입증합니다.
- 액세스 제어 범위: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- 네이티브 승인: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- 상태 반응: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

현재 카탈로그에는 52개의 시나리오가 있습니다. 빠른 스모크 범위를 위해
`live-frontier` 기본 레인은 10개의 시나리오로 작게 유지됩니다.
`mock-openai` 기본 레인은 모델 출력만 모킹하면서 실제 WhatsApp 전송을 통해
45개의 시나리오를 결정론적으로 실행합니다. 승인 시나리오와 일부 더
무겁거나 차단을 유발하는 검사는 시나리오 ID로 명시적으로 실행해야 합니다.

WhatsApp QA 드라이버는 구조화된 라이브 이벤트(`text`, `media`,
`location`, `reaction`, `poll`)를 관찰하고 미디어, 투표, 연락처,
위치 및 스티커를 능동적으로 전송할 수 있습니다. QA Lab은 비공개
WhatsApp 런타임 파일에 직접 접근하지 않고 `@openclaw/whatsapp/api.js`
패키지 표면을 통해 해당 드라이버를 가져옵니다. 그룹 관찰에서 `fromJid`는
그룹 JID이고, `participantJid`와 `fromPhoneE164`는 참여자 발신자를
식별합니다. 메시지 콘텐츠는 기본적으로 삭제 처리됩니다. 직접 Gateway
투표, 파일 업로드, 미디어, 그룹 투표, 그룹 미디어 및 답장 형태 프로브는
전송/API 계약 검사이며, 사용자 프롬프트로 인해 에이전트가 동일한 작업을
선택했다는 증거로 간주되지 않습니다. 사용자 경로 작업의 증거는
`whatsapp-agent-message-action-react` 및
`whatsapp-group-agent-message-action-react`와 같은 시나리오에서
얻습니다. 이러한 시나리오에서는 드라이버가 일반 WhatsApp 메시지를 보내고
QA Lab이 결과로 생성된 네이티브 WhatsApp 아티팩트를 관찰합니다.
WhatsApp 보고서에는 각 시나리오의 방식(`user-path`,
`direct-gateway` 또는 `native-approval`)이 포함되므로, 증거가 실제로
입증하는 것보다 더 강한 계약으로 오인될 수 없습니다.

출력 아티팩트:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 라이브 전송 검사의 증거 항목입니다.
- `whatsapp-qa-observed-messages.json` - 
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`이 아니면 본문이 삭제 처리됩니다.

### Convex 자격 증명 풀

Discord, Slack, Telegram 및 WhatsApp 레인은 위의 환경 변수를 읽는 대신
공유 Convex 풀에서 자격 증명을 임대할 수 있습니다.
`--credential-source convex`를 전달하거나
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하십시오. QA Lab은 독점
임대를 획득하고 실행하는 동안 Heartbeat로 이를 유지하며, 종료 시
해제합니다. 풀 종류는 `"discord"`, `"slack"`, `"telegram"` 및
`"whatsapp"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형태:

- Discord(`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId`는 숫자로 된 채팅 ID 문자열이어야 합니다.
- Telegram 실제 사용자(`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  Mantis Telegram Desktop 증명 전용입니다. 일반 QA Lab 레인은 이
  종류를 획득해서는 안 됩니다.
- WhatsApp(`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 전화번호는 서로 다른 E.164 문자열이어야 합니다.

Mantis Telegram Desktop 증명 워크플로는 TDLib CLI 드라이버와
Telegram Desktop 증인 모두에 대해 하나의 독점 Convex
`telegram-user` 임대를 유지한 다음, 증명을 게시한 후 해제합니다.

PR에 결정론적인 시각적 차이가 필요한 경우 Mantis는 Telegram 포매터 또는
전달 계층이 변경되는 동안 `main`과 PR 헤드에서 동일한 모의 모델 답장을
사용할 수 있습니다. 캡처 기본값은 PR 댓글에 맞게 조정되어 있습니다.
표준 Crabbox 클래스, 24fps 데스크톱 녹화, 24fps 모션 GIF 및 1920px
미리보기 너비입니다. 변경 전/후 댓글에는 의도한 GIF만 포함된 깔끔한
번들을 게시해야 합니다.

Slack 레인도 풀을 사용할 수 있습니다. 현재 Slack 페이로드 형태 검사는
브로커가 아닌 Slack QA 러너에 있습니다. `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`을
사용하고, Slack 채널 ID는 `Cxxxxxxxxxx`와 같은 형식으로 지정하십시오.
앱 및 범위 프로비저닝에 대해서는
[Slack 워크스페이스 설정](#setting-up-the-slack-workspace)을 참조하십시오.

운영 환경 변수 및 Convex 브로커 엔드포인트 계약은
[테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에
설명되어 있습니다. 해당 섹션 이름은 다중 채널 풀보다 먼저 만들어졌으며,
임대 의미 체계는 모든 종류에서 공유됩니다.

## 저장소 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

QA 계획이 사람과 에이전트 모두에게 표시되도록 의도적으로 Git에
포함되어 있습니다.

`qa-lab`은 일반적인 YAML 시나리오 러너로 유지됩니다. 각 시나리오 YAML
파일은 한 번의 테스트 실행에 대한 단일 진실 공급원이며 다음을 정의해야
합니다.

- 최상위 `title`
- `scenario` 메타데이터
- `scenario`의 선택적 범주, 기능, 레인 및 위험 메타데이터
- `scenario`의 문서 및 코드 참조
- `scenario`의 선택적 Plugin 요구 사항
- `scenario`의 선택적 Gateway 구성 패치
- 플로 시나리오의 실행 가능한 최상위 `flow`, 또는 Vitest 및
  Playwright 시나리오의 `scenario.execution.kind` /
  `scenario.execution.path`

`flow`를 지원하는 재사용 가능한 런타임 표면은 일반적이고 횡단적으로
유지됩니다. 예를 들어 YAML 시나리오는 특수 사례 러너를 추가하지 않고도
Gateway `browser.request` 심을 통해 임베디드 Control UI를 구동하는
브라우저 측 헬퍼와 전송 측 헬퍼를 결합할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아닌 제품 기능별로 그룹화해야 합니다.
파일을 이동할 때도 시나리오 ID를 안정적으로 유지하고, 구현 추적성을 위해
`docsRefs`와 `codeRefs`를 사용하십시오.

기준선 목록은 다음을 포함할 수 있도록 충분히 광범위하게 유지해야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 핸드오프
- 저장소 읽기 및 문서 읽기
- Lobster Invaders와 같은 소규모 빌드 작업 하나

## 공급자 모의 레인

`qa suite`에는 두 개의 로컬 공급자 모의 레인이 있습니다.

- `mock-openai`는 시나리오를 인식하는 OpenClaw 모의 구현입니다. 저장소
  기반 QA 및 동등성 게이트의 기본 결정론적 모의 레인으로 유지됩니다.
- `aimock`은 실험적 프로토콜, 픽스처, 기록/재생 및 카오스 범위를 위해
  AIMock 기반 공급자 서버를 시작합니다. 이는 추가적인 기능이며
  `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

공급자 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 공급자는 자체 기본값, 로컬 서버 시작, Gateway 모델 구성,
인증 프로필 스테이징 요구 사항 및 라이브/모의 기능 플래그를 소유합니다.
공유 제품군 및 Gateway 코드는 공급자 이름에 따라 분기하는 대신 공급자
레지스트리를 통해 라우팅합니다.

## 전송 어댑터

`qa-lab`은 YAML QA 시나리오를 위한 일반 전송 심을 소유합니다.
`qa-channel`은 합성 기본값입니다. `crabline`은 로컬 공급자 형태의 서버를
시작하고 이에 대해 OpenClaw의 일반 채널 Plugin을 실행합니다. `live`는
실제 공급자 자격 증명 및 외부 채널용으로 예약되어 있습니다.

아키텍처 수준에서의 구분은 다음과 같습니다.

- `qa-lab`은 일반 시나리오 실행, 작업자 동시성, 아티팩트 작성 및
  보고를 소유합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, 인바운드 및 아웃바운드 관찰,
  전송 작업 및 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 YAML 시나리오 파일이 테스트 실행을 정의하며,
  `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

YAML QA 시스템에 채널을 추가하려면 채널 구현과 함께 채널 계약을
실행하는 시나리오 팩이 필요합니다. 스모크 CI 범위를 위해 일치하는
Crabline 로컬 공급자 서버를 추가하고 `crabline` 드라이버를 통해
노출하십시오.

공유 `qa-lab` 호스트가 플로를 소유할 수 있는 경우 새 최상위 QA 명령
루트를 추가하지 마십시오.

`qa-lab`은 다음과 같은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- 제품군 시작 및 종료
- 작업자 동시성
- 아티팩트 작성
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오의 호환성 별칭

러너 Plugin은 전송 계약을 소유합니다.

- 공유 `qa` 루트 아래에 `openclaw qa <runner>`가 마운트되는 방식
- 해당 전송 수단에 맞게 Gateway를 구성하는 방식
- 준비 상태를 확인하는 방식
- 인바운드 이벤트를 주입하는 방식
- 아웃바운드 메시지를 관찰하는 방식
- 트랜스크립트와 정규화된 전송 상태를 노출하는 방식
- 전송 수단 기반 작업을 실행하는 방식
- 전송 수단별 재설정 또는 정리를 처리하는 방식

새 채널의 최소 도입 기준은 다음과 같습니다.

1. 공유 `qa` 루트의 소유자를 `qa-lab`으로 유지합니다.
2. 공유 `qa-lab` 호스트 연결부에 전송 수단 러너를 구현합니다.
3. 전송 수단별 메커니즘은 러너 Plugin 또는 채널
   하네스 내부에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로
   마운트합니다. 러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를
   선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations`
   배열을 내보내야 합니다. `runtime-api.ts`는 가볍게 유지하고, 지연 CLI 및
   러너 실행은 별도의 진입점 뒤에 두어야 합니다. 선택적
   `adapterFactory`는 명령의 기존 시나리오 카탈로그를 변경하지 않고
   공유 시나리오에 전송 수단을 노출합니다.
5. 주제별 `qa/scenarios/` 디렉터리 아래에서 YAML 시나리오를 작성하거나
   조정합니다.
6. 새 시나리오에는 범용 시나리오 헬퍼를 사용합니다.
7. 저장소에서 의도적인 마이그레이션을 수행하는 경우가 아니라면 기존
   호환성 별칭이 계속 작동하도록 유지합니다.

판단 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있다면 `qa-lab`에 둡니다.
- 동작이 하나의 채널 전송 수단에 의존한다면 해당 러너
  Plugin 또는 Plugin 하네스에 유지합니다.
- 시나리오에 둘 이상의 채널에서 사용할 수 있는 새 기능이 필요하다면
  `suite.ts`에 채널별 분기를 추가하는 대신 범용 헬퍼를 추가합니다.
- 동작이 하나의 전송 수단에서만 의미가 있다면 시나리오를
  전송 수단별로 유지하고 시나리오 계약에 이를 명시합니다.

### 시나리오 헬퍼 이름

새 시나리오에 권장되는 범용 헬퍼는 다음과 같습니다.

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

기존 시나리오에는 호환성 별칭인
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus`를 계속 사용할 수 있지만, 새 시나리오를
작성할 때는 범용 이름을 사용해야 합니다. 별칭은 일괄
마이그레이션을 피하기 위해 존재하며, 앞으로 사용할 모델이 아닙니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음 질문에 답해야 합니다.

- 성공한 항목
- 실패한 항목
- 계속 차단된 항목
- 추가할 가치가 있는 후속 시나리오

사용 가능한 시나리오 목록을 확인하려면(후속 작업의 규모를 산정하거나
새 전송 방식을 연결할 때 유용함) `pnpm openclaw qa coverage`를 실행하십시오.
기계 판독 가능 출력을 사용하려면 `--json`을 추가하십시오. 변경된 동작이나
파일 경로에 대한 집중 검증을 선택할 때는 `pnpm openclaw qa coverage --match <query>`를
실행하십시오. 일치 보고서는 시나리오 메타데이터, 문서 참조, 코드 참조, 커버리지 ID,
Plugin, 제공자 요구 사항을 검색한 다음 일치하는 `qa suite
--scenario ...` 대상을 출력합니다.

모든 `qa suite` 실행은 선택한 시나리오 세트에 대한 최상위
`qa-evidence.json`, `qa-suite-summary.json`, `qa-suite-report.md` 아티팩트를
작성합니다. `execution.kind: vitest` 또는 `execution.kind: playwright`를
선언한 시나리오는 일치하는 테스트 경로를 실행하고 시나리오별 로그도 작성합니다.
`execution.kind: script`를 선언한 시나리오는 `node --import tsx`를 통해
`execution.path`의 증거 생성기를 실행합니다(`execution.args`에서
`${outputDir}` 및 `${scenarioId}`가 확장됨). 생성기는 자체
`qa-evidence.json`을 작성하며, 해당 항목은 스위트 출력으로 가져오고 아티팩트 경로는
그 생성기의 `qa-evidence.json`을 기준으로 확인됩니다. `qa suite`가 `qa run
--qa-profile`을 통해 실행되면 동일한 `qa-evidence.json`에 선택한 분류 체계 범주의
프로필 스코어카드 요약도 포함됩니다.

커버리지 출력은 게이트를 대체하는 수단이 아니라 탐색 보조 수단으로 취급하십시오.
선택한 시나리오에는 테스트 대상 동작에 적합한 제공자 모드, 실제 전송 방식,
Multipass, Testbox 또는 릴리스 레인이 여전히 필요합니다. 스코어카드 관련 맥락은
[성숙도 스코어카드](/ko/maturity/scorecard)를 참조하십시오.

캐릭터 및 스타일 검사를 수행하려면 여러 실제 모델 참조에서 동일한 시나리오를
실행하고 평가 결과를 담은 Markdown 보고서를 작성하십시오:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

이 명령은 Docker가 아닌 로컬 QA Gateway 자식 프로세스를 실행합니다. 캐릭터
평가 시나리오에서는 `SOUL.md`를 통해 페르소나를 설정한 다음, 채팅, 작업 공간
도움말, 소규모 파일 작업과 같은 일반적인 사용자 턴을 실행해야 합니다. 후보
모델에는 평가 중이라는 사실을 알려서는 안 됩니다. 이 명령은 각각의 전체
트랜스크립트를 보존하고 기본 실행 통계를 기록한 다음, 지원되는 경우 `xhigh`
추론을 사용하는 빠른 모드에서 심사 모델에 자연스러움, 분위기, 유머를 기준으로
실행 순위를 매기도록 요청합니다. 제공자를 비교할 때는 `--blind-judge-models`를
사용하십시오. 심사 프롬프트에는 여전히 모든 트랜스크립트와 실행 상태가
제공되지만 후보 참조는 `candidate-01` 같은 중립적인 레이블로 대체되며, 보고서는
파싱 후 순위를 실제 참조에 다시 매핑합니다.

후보 실행은 기본적으로 `high` 사고 수준을 사용하며, GPT-5.6 Luna에는 `medium`을,
이를 지원하는 이전 OpenAI 평가 참조에는 `xhigh`를 사용합니다. 특정 후보를
재정의하려면 `--model provider/model,thinking=<level>`을 인라인으로 지정하십시오.
인라인 옵션은 `fast`, `no-fast`, `fast=<bool>`도 지원합니다. `--thinking
<level>`은 계속 전역 폴백을 설정하며, 이전의 `--model-thinking
<provider/model=level>` 형식은 호환성을 위해 유지됩니다. OpenAI 후보 참조는
제공자가 지원하는 경우 우선순위 처리를 사용하도록 기본적으로 빠른 모드를
사용합니다. 모든 후보 모델에 빠른 모드를 강제로 적용하려는 경우에만 `--fast`를
전달하십시오. 벤치마크 분석을 위해 후보 및 심사 소요 시간이 보고서에 기록되지만,
심사 프롬프트에는 속도를 기준으로 순위를 매기지 말라고 명시되어 있습니다. 후보
및 심사 모델 실행의 기본 동시성은 모두 16입니다. 제공자 제한이나 로컬 Gateway
부하로 인해 실행 결과에 잡음이 너무 많아지는 경우 `--concurrency` 또는
`--judge-concurrency`를 낮추십시오.

후보 `--model`을 전달하지 않으면 캐릭터 평가의 기본값은
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, `google/gemini-3.1-pro-preview`입니다.
`--judge-model`을 전달하지 않으면 심사 모델의 기본값은
`openai/gpt-5.6-sol,thinking=xhigh,fast` 및
`anthropic/claude-opus-4-8,thinking=high`입니다.

## 관련 문서

- [Matrix QA](/ko/concepts/qa-matrix)
- [성숙도 스코어카드](/ko/maturity/scorecard)
- [개인 에이전트 벤치마크 팩](/ko/concepts/personal-agent-benchmark-pack)
- [QA 채널](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
