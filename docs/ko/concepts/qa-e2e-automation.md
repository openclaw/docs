---
read_when:
    - 품질 보증 스택이 서로 어떻게 맞물리는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장하기
    - 리포지토리 기반 QA 시나리오 추가
    - Gateway 대시보드를 중심으로 더 현실감 높은 QA 자동화 구축
summary: 'QA 스택 개요: qa-lab, qa-channel, 리포지토리 기반 시나리오, 라이브 전송 레인, 전송 어댑터 및 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-05-10T19:33:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적인,
채널 형태의 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 수정, 삭제 표면을 갖춘 합성 메시지 채널.
- `extensions/qa-lab`: 대화 기록 관찰,
  인바운드 메시지 주입, Markdown 보고서 내보내기를 위한 디버거 UI 및 QA 버스.
- `extensions/qa-matrix`, 향후 러너 Plugin: 하위 QA Gateway 안에서
  실제 채널을 구동하는 라이브 전송 어댑터.
- `qa/`: 시작 작업과 기준 QA
  시나리오를 위한 저장소 기반 시드 자산.
- [Mantis](/ko/concepts/mantis): 실제 전송, 브라우저 스크린샷, VM 상태,
  PR 증거가 필요한 버그를 위한 수정 전후 라이브 검증.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 다수는 `pnpm qa:*`
스크립트 별칭을 가지며, 두 형식 모두 지원됩니다.

| 명령                                                | 목적                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | 번들 QA 자체 검사를 실행하고 Markdown 보고서를 작성합니다.                                                                                                                                                                                                                |
| `qa suite`                                          | QA Gateway 레인에 대해 저장소 기반 시나리오를 실행합니다. 별칭: 일회용 Linux VM을 위한 `pnpm openclaw qa suite --runner multipass`.                                                                                                                                      |
| `qa coverage`                                       | Markdown 시나리오 커버리지 인벤토리를 출력합니다(머신 출력은 `--json`).                                                                                                                                                                                                  |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 에이전트 패리티 보고서를 작성합니다.                                                                                                                                                                                          |
| `qa character-eval`                                 | 판정된 보고서와 함께 여러 라이브 모델에 대해 캐릭터 QA 시나리오를 실행합니다. [보고](#reporting)를 참조하세요.                                                                                                                                                           |
| `qa manual`                                         | 선택한 제공자/모델 레인에 대해 일회성 프롬프트를 실행합니다.                                                                                                                                                                                                              |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                                                                                                         |
| `qa docker-build-image`                             | 사전 빌드된 QA Docker 이미지를 빌드합니다.                                                                                                                                                                                                                                |
| `qa docker-scaffold`                                | QA 대시보드 + Gateway 레인을 위한 docker-compose 스캐폴드를 작성합니다.                                                                                                                                                                                                   |
| `qa up`                                             | QA 사이트를 빌드하고, Docker 기반 스택을 시작하고, URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다).                                                                                          |
| `qa aimock`                                         | AIMock 제공자 서버만 시작합니다.                                                                                                                                                                                                                                         |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` 제공자 서버만 시작합니다.                                                                                                                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex 자격 증명 풀을 관리합니다.                                                                                                                                                                                                                                   |
| `qa matrix`                                         | 일회용 Tuwunel 홈서버에 대한 라이브 전송 레인입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하세요.                                                                                                                                                                      |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹에 대한 라이브 전송 레인입니다.                                                                                                                                                                                                                  |
| `qa discord`                                        | 실제 비공개 Discord 길드 채널에 대한 라이브 전송 레인입니다.                                                                                                                                                                                                              |
| `qa slack`                                          | 실제 비공개 Slack 채널에 대한 라이브 전송 레인입니다.                                                                                                                                                                                                                     |
| `qa mantis`                                         | Discord 상태 반응 증거, Crabbox 데스크톱/브라우저 스모크, Slack-in-VNC 스모크를 포함한 라이브 전송 버그용 수정 전후 검증 러너입니다. [Mantis](/ko/concepts/mantis) 및 [Mantis Slack Desktop Runbook](/ko/concepts/mantis-slack-desktop-runbook)을 참조하세요. |

## 운영자 흐름

현재 QA 운영자 흐름은 2분할 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI).
- 오른쪽: Slack과 유사한 대화 기록 및 시나리오 계획을 표시하는 QA Lab.

다음으로 실행합니다.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 Gateway 레인을 시작하며,
운영자 또는 자동화 루프가 에이전트에 QA
임무를 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했는지, 실패했는지,
또는 차단 상태로 남았는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복 작업하려면,
바인드 마운트된 QA Lab 번들로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지에 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는
변경 시 해당 번들을 다시 빌드하며, QA Lab
자산 해시가 변경되면 브라우저가 자동으로 다시 로드됩니다.

로컬 OpenTelemetry 추적 스모크를 실행하려면 다음을 실행하세요.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP 추적 수신기를 시작하고,
`diagnostics-otel` Plugin이 활성화된 상태로 `otel-trace-smoke` QA 시나리오를 실행한 다음,
내보낸 protobuf span을 디코딩하고 릴리스에 중요한 형태를 검증합니다.
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, `openclaw.message.delivery`가 반드시 있어야 하며,
성공한 턴에서 모델 호출은 `StreamAbandoned`를 내보내면 안 되고, 원시 진단 ID와
`openclaw.content.*` 속성은 추적에 포함되지 않아야 합니다. 이 스크립트는
QA suite 아티팩트 옆에 `otel-smoke-summary.json`을 작성합니다.

관찰 가능성 QA는 소스 체크아웃 전용으로 유지됩니다. npm tarball은 의도적으로
QA Lab을 제외하므로 패키지 Docker 릴리스 레인은 `qa` 명령을 실행하지 않습니다.
진단 계측을 변경할 때는 빌드된 소스 체크아웃에서
`pnpm qa:otel:smoke`를 사용하세요.

실제 전송 Matrix 스모크 레인을 실행하려면 다음을 실행하세요.

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, 환경 변수, 아티팩트 레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 요약하면, Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고, 임시 드라이버/SUT/관찰자 사용자를 등록하며, 해당 전송에 범위가 지정된 하위 QA Gateway 안에서 실제 Matrix Plugin을 실행하고(`qa-channel` 없음), Markdown 보고서, JSON 요약, 관찰된 이벤트 아티팩트, 결합 출력 로그를 `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 작성합니다.

시나리오는 단위 테스트가 엔드 투 엔드로 입증할 수 없는 전송 동작을 다룹니다. 멘션 게이팅, 봇 허용 정책, 허용 목록, 최상위 및 스레드 답장, DM 라우팅, 반응 처리, 인바운드 수정 억제, 재시작 리플레이 중복 제거, 홈서버 중단 복구, 승인 메타데이터 전달, 미디어 처리, Matrix E2EE 부트스트랩/복구/검증 흐름입니다. E2EE CLI 프로필은 Gateway 답장을 확인하기 전에 동일한 일회용 홈서버를 통해 `openclaw matrix encryption setup` 및 검증 명령도 구동합니다.

Discord에는 버그 재현을 위한 Mantis 전용 옵트인 시나리오도 있습니다. 명시적인 상태 반응
타임라인에는 `--scenario discord-status-reactions-tool-only`를 사용하고, 실제 Discord 스레드를 생성하여 `message.thread-reply`가
`filePath` 첨부 파일을 보존하는지 검증하려면 `--scenario discord-thread-reply-filepath-attachment`를 사용하세요. 이러한 시나리오는 광범위한 스모크 커버리지가 아니라 수정 전후 재현 프로브이므로 기본 라이브 Discord 레인에는 포함되지 않습니다.
스레드 첨부 Mantis 워크플로는 QA
환경에 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 또는
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`가 구성된 경우 로그인된 Discord Web
증인 영상을 추가할 수도 있습니다. 이 뷰어 프로필은 시각적 캡처 전용이며, 통과/실패
판정은 여전히 Discord REST 오라클에서 나옵니다.

CI는 `.github/workflows/qa-live-transports-convex.yml`에서 동일한 명령 표면을 사용합니다. 예약 실행과 기본 수동 실행은 라이브 프런티어 자격 증명, `--fast`, `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`으로 빠른 Matrix 프로필을 실행합니다. 수동 `matrix_profile=all`은 다섯 개의 프로필 샤드로 확장되어, 샤드별로 하나의 아티팩트 디렉터리를 유지하면서 전체 카탈로그를 병렬로 실행할 수 있습니다.

실제 전송 Telegram, Discord, Slack 스모크 레인의 경우:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

이 레인들은 두 봇(드라이버 + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 환경 변수, 시나리오 목록, 출력 아티팩트, Convex 자격 증명 풀은 아래 [Telegram, Discord, Slack QA 참조](#telegram-discord-and-slack-qa-reference)에 문서화되어 있습니다.

전체 Slack 데스크톱 VM 실행을 VNC 구조와 함께 수행하려면 다음을 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱/브라우저 머신을 임대하고, VM 내부에서 Slack 라이브 레인을 실행하고, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 캡처하며, 비디오 캡처를 사용할 수 있을 때 `slack-qa/`, `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`를 Mantis 아티팩트 디렉터리로 복사합니다. Crabbox 데스크톱/브라우저 임대는 캡처 도구와 브라우저/네이티브 빌드 헬퍼 패키지를 미리 제공하므로, 시나리오는 오래된 임대에서만 대체 항목을 설치해야 합니다. Mantis는 `mantis-slack-desktop-smoke-report.md`에 전체 및 단계별 타이밍을 보고하므로, 느린 실행에서 시간이 임대 워밍업, 자격 증명 획득, 원격 설정, 아티팩트 복사 중 어디에 사용되었는지 확인할 수 있습니다. VNC를 통해 Slack Web에 수동으로 로그인한 뒤 `--lease-id <cbx_...>`를 재사용하세요. 재사용된 임대는 Crabbox의 pnpm 저장소 캐시도 따뜻하게 유지합니다. 기본값인 `--hydrate-mode source`는 소스 체크아웃에서 검증하고 VM 내부에서 설치/빌드를 실행합니다. 재사용된 원격 작업 영역에 이미 `node_modules`와 빌드된 `dist/`가 있을 때만 `--hydrate-mode prehydrated`를 사용하세요. 이 모드는 비용이 큰 설치/빌드 단계를 건너뛰며, 작업 영역이 준비되지 않은 경우 닫힌 상태로 실패합니다. `--gateway-setup`을 사용하면 Mantis는 VM 내부의 포트 `38973`에서 지속 실행되는 OpenClaw Slack Gateway를 남깁니다. 이 옵션이 없으면 명령은 일반 bot-to-bot Slack QA 레인을 실행하고 아티팩트 캡처 후 종료합니다.

운영자 체크리스트, GitHub 워크플로 디스패치 명령, 증거 댓글 계약, 하이드레이션 모드 결정 표, 타이밍 해석, 실패 처리 단계는 [Mantis Slack 데스크톱 Runbook](/ko/concepts/mantis-slack-desktop-runbook)에 있습니다.

에이전트/CV 스타일 데스크톱 작업에는 다음을 실행하세요.

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task`는 Crabbox 데스크톱/브라우저 머신을 임대하거나 재사용하고, `crabbox record --while`를 시작하고, 중첩된 `visual-driver`를 통해 표시된 브라우저를 조작하고, `visual-task.png`를 캡처하며, `--vision-mode image-describe`가 선택된 경우 스크린샷에 대해 `openclaw infer image describe`를 실행하고, `visual-task.mp4`, `mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json`, `mantis-visual-task-report.md`를 작성합니다. `--expect-text`가 설정되면 비전 프롬프트는 구조화된 JSON 판정을 요청하며, 모델이 긍정적인 가시 증거를 보고할 때만 통과합니다. 대상 텍스트를 단순히 인용하는 부정 응답은 어설션에 실패합니다. 이미지 이해 제공자를 호출하지 않고 데스크톱, 브라우저, 스크린샷, 비디오 배관을 증명하는 무모델 스모크에는 `--vision-mode metadata`를 사용하세요. 녹화는 `visual-task`의 필수 아티팩트입니다. Crabbox가 비어 있지 않은 `visual-task.mp4`를 녹화하지 않으면, 시각 드라이버가 통과했더라도 작업은 실패합니다. 실패 시 Mantis는 작업이 이미 통과했고 `--keep-lease`가 설정되지 않은 경우가 아니면 VNC를 위해 임대를 유지합니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex 브로커 env를 확인하고, 엔드포인트 설정을 검증하며, 유지관리자 시크릿이 있을 때 admin/list 도달 가능성을 확인합니다. 시크릿에 대해서는 설정됨/누락 상태만 보고합니다.

## 라이브 전송 범위

라이브 전송 레인은 각자 자체 시나리오 목록 형태를 새로 만들지 않고 하나의 계약을 공유합니다. `qa-channel`은 광범위한 합성 제품 동작 스위트이며 라이브 전송 범위 매트릭스의 일부가 아닙니다.

| 레인     | 카나리 | 멘션 게이팅 | Bot-to-bot | 허용 목록 차단 | 최상위 답장 | 재시작 재개 | 스레드 후속 응답 | 스레드 격리 | 반응 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

이렇게 하면 `qa-channel`은 광범위한 제품 동작 스위트로 유지되고, Matrix, Telegram, 향후 라이브 전송은 하나의 명시적 전송 계약 체크리스트를 공유합니다.

QA 경로에 Docker를 포함하지 않는 일회용 Linux VM 레인의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 내부에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 복사합니다.
호스트의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트 및 Multipass 스위트 실행은 기본적으로 격리된 Gateway 워커를 사용해 선택된 여러 시나리오를 병렬로 실행합니다. `qa-channel`의 기본 동시성은 4이며, 선택된 시나리오 수로 제한됩니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행에는 `--concurrency 1`을 사용하세요.
시나리오가 하나라도 실패하면 명령은 0이 아닌 값으로 종료됩니다. 실패 종료 코드 없이 아티팩트를 원할 때는 `--allow-failures`를 사용하세요.
라이브 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다. 여기에는 env 기반 제공자 키, QA 라이브 제공자 구성 경로, 존재하는 경우 `CODEX_HOME`이 포함됩니다. 게스트가 마운트된 작업 영역을 통해 다시 쓸 수 있도록 `--output-dir`를 리포지터리 루트 아래에 유지하세요.

## Telegram, Discord, Slack QA 참조

Matrix는 시나리오 수와 Docker 기반 홈서버 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram, Discord, Slack은 더 작으며, 각각 몇 개의 시나리오만 있고, 프로필 시스템 없이 기존 실제 채널을 대상으로 하므로 해당 참조는 여기에 있습니다.

### 공유 CLI 플래그

이 레인은 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 동일한 플래그를 받습니다.

| 플래그                                  | 기본값                                                         | 설명                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | 이 시나리오만 실행합니다. 반복할 수 있습니다.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 보고서/요약/관찰된 메시지와 출력 로그가 작성되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 중립 cwd에서 호출할 때의 리포지터리 루트입니다.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 구성 내부의 임시 계정 id입니다.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 또는 `live-frontier`입니다(레거시 `live-openai`도 계속 작동합니다).                                                  |
| `--model <ref>` / `--alt-model <ref>` | 제공자 기본값                                                | 기본/대체 모델 ref입니다.                                                                                         |
| `--fast`                              | 꺼짐                                                             | 지원되는 경우 제공자 빠른 모드입니다.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하세요.                                                                |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`                              | `--credential-source convex`일 때 사용되는 역할입니다.                                                                          |

각 레인은 실패한 시나리오가 하나라도 있으면 0이 아닌 값으로 종료됩니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 작성합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

두 개의 서로 다른 봇(드라이버 + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 합니다. 두 봇 모두 `@BotFather`에서 **Bot-to-Bot Communication Mode**를 활성화했을 때 bot-to-bot 관찰이 가장 잘 작동합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 숫자 채팅 id(문자열).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

선택 사항:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다(기본값은 마스킹).

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

암시적 기본 세트는 항상 카나리, 멘션 게이팅, 네이티브 명령 답장, 명령 주소 지정, bot-to-bot 그룹 답장을 포함합니다. `mock-openai` 기본값에는 결정적 답장 체인 및 최종 메시지 스트리밍 검사도 포함됩니다. `telegram-current-session-status-tool`은 임의의 네이티브 명령 답장 뒤가 아니라 카나리 직후에 스레드될 때만 안정적이므로 옵트인으로 유지됩니다. 회귀 ref와 함께 현재 기본/선택 분리를 출력하려면 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`를 사용하세요.

출력 아티팩트:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - 카나리부터 시작하는 답장별 RTT(드라이버 전송 → 관찰된 SUT 답장)를 포함합니다.
- `telegram-qa-observed-messages.json` - `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`이 아니면 본문은 마스킹됩니다.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 봇이 있는 실제 비공개 Discord 길드 채널 하나를 대상으로 합니다. 하나는 하니스가 제어하는 드라이버 봇이고, 다른 하나는 번들된 Discord Plugin을 통해 자식 OpenClaw Gateway가 시작한 SUT 봇입니다. 채널 멘션 처리, SUT 봇이 Discord에 네이티브 `/help` 명령을 등록했는지, 옵트인 Mantis 증거 시나리오를 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord가 반환한 SUT bot 사용자 id와 일치해야 합니다(그렇지 않으면 레인이 빠르게 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`는 `discord-voice-autojoin`에 사용할 음성/스테이지 채널을 선택합니다. 없으면 시나리오가 SUT bot에 대해 처음 보이는 음성/스테이지 채널을 선택합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in 음성 시나리오입니다. 단독으로 실행되며, `channels.discord.voice.autoJoin`을 활성화하고 SUT bot의 현재 Discord 음성 상태가 대상 음성/스테이지 채널인지 확인합니다. Convex Discord 자격 증명에는 선택적 `voiceChannelId`가 포함될 수 있습니다. 그렇지 않으면 러너가 길드에서 처음 보이는 음성/스테이지 채널을 검색합니다.
- `discord-status-reactions-tool-only` - opt-in Mantis 시나리오입니다. SUT를 `messages.statusReactions.enabled=true`가 설정된 항상 켜짐, 도구 전용 길드 응답으로 전환하기 때문에 단독으로 실행되며, 이후 REST 반응 타임라인과 HTML/PNG 시각 아티팩트를 캡처합니다. Mantis 전후 보고서도 시나리오가 제공한 MP4 아티팩트를 `baseline.mp4` 및 `candidate.mp4`로 보존합니다.

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
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

출력 아티팩트:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문은 삭제됩니다.
- 상태 반응 시나리오가 실행될 때 `discord-qa-reaction-timelines.json` 및 `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

두 개의 서로 다른 bot이 있는 실제 비공개 Slack 채널 하나를 대상으로 합니다. 하나는 하네스가 제어하는 드라이버 bot이고, 다른 하나는 번들된 Slack Plugin을 통해 하위 OpenClaw Gateway가 시작하는 SUT bot입니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

선택 사항:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.

시나리오(`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

출력 아티팩트:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`이 아니면 본문은 삭제됩니다.

#### Slack 워크스페이스 설정

이 레인에는 하나의 워크스페이스 안에 서로 다른 두 Slack 앱과 두 bot이 모두 멤버인 채널이 필요합니다.

- `channelId` - 두 bot이 모두 초대된 채널의 `Cxxxxxxxxxx` id입니다. 전용 채널을 사용하세요. 레인은 실행할 때마다 게시합니다.
- `driverBotToken` - **Driver** 앱의 bot 토큰(`xoxb-...`)입니다.
- `sutBotToken` - **SUT** 앱의 bot 토큰(`xoxb-...`)입니다. 드라이버와 별도의 Slack 앱이어야 bot 사용자 id가 구분됩니다.
- `sutAppToken` - SUT 앱의 `connections:write`가 있는 앱 수준 토큰(`xapp-...`)입니다. Socket Mode에서 SUT 앱이 이벤트를 받을 수 있도록 사용됩니다.

프로덕션 워크스페이스를 재사용하기보다 QA 전용 Slack 워크스페이스를 권장합니다.

아래 SUT 매니페스트는 번들된 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:10`)를 라이브 Slack QA 스위트가 다루는 권한과 이벤트로 의도적으로 좁힙니다. 사용자가 보는 프로덕션 채널 설정은 [Slack 채널 빠른 설정](/ko/channels/slack#quick-setup)을 참조하세요. QA Driver/SUT 쌍은 하나의 워크스페이스에 서로 다른 두 bot 사용자 id가 필요하기 때문에 의도적으로 분리되어 있습니다.

**1. Driver 앱 만들기**

[api.slack.com/apps](https://api.slack.com/apps)로 이동 → _Create New App_ → _From a manifest_ → QA 워크스페이스를 선택하고 다음 매니페스트를 붙여넣은 다음 _Install to Workspace_:

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

_Bot User OAuth Token_(`xoxb-...`)을 복사합니다. 이것이 `driverBotToken`이 됩니다. 드라이버는 메시지를 게시하고 자신을 식별하기만 하면 됩니다. 이벤트도 Socket Mode도 필요하지 않습니다.

**2. SUT 앱 만들기**

같은 워크스페이스에서 _Create New App → From a manifest_를 반복합니다. 이 QA 앱은 번들된 Slack Plugin의 프로덕션 매니페스트(`extensions/slack/src/setup-shared.ts:10`)보다 좁은 버전을 의도적으로 사용합니다. 라이브 Slack QA 스위트가 아직 반응 처리를 다루지 않기 때문에 반응 스코프와 이벤트는 생략되어 있습니다.

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
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 스코프 `connections:write` 추가 → 저장 → `xapp-...` 값 복사 → 이것이 `sutAppToken`이 됩니다.

각 토큰에서 `auth.test`를 호출해 두 bot의 사용자 id가 서로 다른지 확인합니다. 런타임은 사용자 id로 드라이버와 SUT를 구분합니다. 하나의 앱을 둘 다에 재사용하면 멘션 게이팅이 즉시 실패합니다.

**3. 채널 만들기**

QA 워크스페이스에서 채널(예: `#openclaw-qa`)을 만들고 채널 안에서 두 bot을 모두 초대합니다.

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_에서 `Cxxxxxxxxxx` id를 복사합니다. 이것이 `channelId`가 됩니다. 공개 채널도 동작합니다. 비공개 채널을 사용해도 두 앱에는 이미 `groups:history`가 있으므로 하네스의 기록 읽기는 계속 성공합니다.

**4. 자격 증명 등록**

두 가지 옵션이 있습니다. 단일 머신 디버깅에는 env var를 사용하거나(네 개의 `OPENCLAW_QA_SLACK_*` 변수를 설정하고 `--credential-source env`를 전달), CI와 다른 유지관리자가 임대할 수 있도록 공유 Convex 풀에 시드합니다.

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

**5. 엔드 투 엔드 확인**

브로커를 통해 두 bot이 서로 통신할 수 있는지 확인하려면 레인을 로컬에서 실행합니다.

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

성공한 실행은 30초보다 훨씬 짧은 시간 안에 완료되며, `slack-qa-report.md`에는 `slack-canary`와 `slack-mention-gating`이 모두 `pass` 상태로 표시됩니다. 레인이 약 90초 동안 멈춘 뒤 `Convex credential pool exhausted for kind "slack"`로 종료되면 풀이 비어 있거나 모든 행이 임대 중인 것입니다. `qa credentials list --kind slack --status all --json`이 어느 쪽인지 알려줍니다.

### Convex 자격 증명 풀

Telegram, Discord, Slack, WhatsApp 레인은 위 env var를 읽는 대신 공유 Convex 풀에서 자격 증명을 임대할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요. QA Lab은 독점 임대를 획득하고, 실행 기간 동안 Heartbeat를 보내며, 종료 시 이를 해제합니다. 풀 종류는 `"telegram"`, `"discord"`, `"slack"`, `"whatsapp"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형태:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId`는 숫자 chat-id 문자열이어야 합니다.
- Telegram 실제 사용자(`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - TDLib CLI 드라이버와 Telegram Desktop 시각 증인이 모두 사용하는 하나의 독점 버너 계정 임대입니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp(`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 전화번호는 서로 다른 E.164 문자열이어야 합니다.

시각적 실제 사용자 Telegram 증명에는 유지되는 Crabbox 세션을 권장합니다.

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start`는 TDLib CLI 드라이버와 Telegram Desktop 증인 모두에 대해 하나의 독점 Convex `telegram-user` 임대를 유지하고, 데스크톱 녹화를 시작하며, 임의의 에이전트 주도 재현 단계를 위해 Crabbox를 계속 실행 상태로 둡니다. 에이전트는 만족할 때까지 `send`, `run`, `screenshot`, `status`를 사용할 수 있으며, 이후 `finish`가 자격 증명을 해제하기 전에 스크린샷, 비디오, 움직임이 다듬어진 비디오/GIF, TDLib 프로브 출력, 로그를 수집합니다. `publish --session <file> --pr <number>`는 기본적으로 움직임 GIF만 댓글로 남깁니다. `--full-artifacts`는 로그와 JSON 출력에 대한 명시적 opt-in입니다. 기본 `probe` 명령은 빠른 `/status` 스모크 확인을 위한 단일 명령 축약형으로 유지됩니다.

결정론적 시각적 diff가 PR에 필요할 때 `--mock-response-file <path>`를 사용하세요:
Telegram 포매터나 전달 계층이 변경되는 동안 동일한 mock 모델 응답을 `main`과 PR 헤드에서 실행할 수 있습니다. 캡처 기본값은 PR 댓글에 맞게 조정되어 있습니다: 표준 Crabbox 클래스, 24fps 데스크톱 녹화, 24fps 모션 GIF, 1920px 미리보기 너비. 전/후 댓글은 의도한 GIF만 포함하는 깔끔한 번들을 게시해야 합니다.

Slack 레인도 풀을 사용할 수 있습니다. Slack 페이로드 형태 검사는 현재 브로커가 아니라 Slack QA 러너에 있습니다. Slack 채널 ID는 `Cxxxxxxxxxx` 같은 형식으로, `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`를 사용하세요. 앱과 범위 프로비저닝은 [Slack 작업 영역 설정](#setting-up-the-slack-workspace)을 참조하세요.

운영 env var와 Convex 브로커 엔드포인트 계약은 [테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다(섹션 이름은 다중 채널 풀보다 먼저 만들어졌지만, lease 의미 체계는 종류 전반에서 공유됩니다).

## 저장소 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이 항목들은 QA 계획이 사람과 agent 모두에게 보이도록 의도적으로 git에 포함됩니다.

`qa-lab`은 범용 markdown 러너로 유지되어야 합니다. 각 시나리오 markdown 파일은 하나의 테스트 실행에 대한 진실 공급원이며 다음을 정의해야 합니다:

- 시나리오 메타데이터
- 선택적 category, capability, lane, risk 메타데이터
- 문서 및 코드 참조
- 선택적 Plugin 요구 사항
- 선택적 Gateway 구성 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은 범용적이고 교차 영역으로 유지될 수 있습니다. 예를 들어 markdown 시나리오는 Gateway `browser.request` 연결부를 통해 내장 Control UI를 구동하는 브라우저 측 헬퍼와 전송 측 헬퍼를 결합할 수 있으며, 특수 사례 러너를 추가할 필요가 없습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 capability별로 그룹화해야 합니다. 파일이 이동해도 시나리오 ID를 안정적으로 유지하세요. 구현 추적 가능성에는 `docsRefs`와 `codeRefs`를 사용하세요.

기준 목록은 다음을 포괄할 수 있을 만큼 넓게 유지해야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 agent 핸드오프
- 저장소 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 프로바이더 mock 레인

`qa suite`에는 두 개의 로컬 프로바이더 mock 레인이 있습니다:

- `mock-openai`는 시나리오 인식 OpenClaw mock입니다. 저장소 기반 QA와 패리티 게이트를 위한 기본 결정론적 mock 레인으로 유지됩니다.
- `aimock`은 실험적 프로토콜, fixture, record/replay, chaos 커버리지를 위해 AIMock 기반 프로바이더 서버를 시작합니다. 이는 추가적인 것이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

프로바이더 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다. 각 프로바이더는 자체 기본값, 로컬 서버 시작, Gateway 모델 구성, auth-profile 스테이징 요구 사항, live/mock capability 플래그를 소유합니다. 공유 suite 및 Gateway 코드는 프로바이더 이름으로 분기하는 대신 프로바이더 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 markdown QA 시나리오를 위한 범용 전송 연결부를 소유합니다. `qa-channel`은 해당 연결부의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다. 향후 실제 또는 합성 채널은 전송별 QA 러너를 추가하는 대신 동일한 suite 러너에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다:

- `qa-lab`은 범용 시나리오 실행, worker 동시성, artifact 작성, 보고를 소유합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, inbound 및 outbound 관찰, 전송 작업, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 markdown 시나리오 파일이 테스트 실행을 정의합니다. `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

markdown QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다:

1. 채널용 전송 어댑터.
2. 채널 계약을 실행하는 시나리오 팩.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있을 때는 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다:

- `openclaw qa` 명령 루트
- suite 시작 및 종료
- worker 동시성
- artifact 작성
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오를 위한 호환성 alias

러너 Plugin은 전송 계약을 소유합니다:

- `openclaw qa <runner>`가 공유 `qa` 루트 아래에 마운트되는 방식
- 해당 전송에 맞게 Gateway가 구성되는 방식
- 준비 상태가 확인되는 방식
- inbound 이벤트가 주입되는 방식
- outbound 메시지가 관찰되는 방식
- transcript와 정규화된 전송 상태가 노출되는 방식
- 전송 기반 작업이 실행되는 방식
- 전송별 reset 또는 cleanup이 처리되는 방식

새 채널의 최소 도입 기준:

1. `qa-lab`을 공유 `qa` 루트의 소유자로 유지합니다.
2. 공유 `qa-lab` 호스트 연결부 위에 전송 러너를 구현합니다.
3. 전송별 메커니즘을 러너 Plugin 또는 채널 harness 내부에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다. 러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 내보내야 합니다. `runtime-api.ts`는 가볍게 유지하세요. lazy CLI와 러너 실행은 별도의 entrypoint 뒤에 유지해야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 markdown 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 범용 시나리오 헬퍼를 사용합니다.
7. 저장소가 의도적인 migration을 수행하는 경우가 아니라면 기존 호환성 alias가 계속 작동하게 유지합니다.

결정 규칙은 엄격합니다:

- 동작을 `qa-lab`에서 한 번 표현할 수 있다면 `qa-lab`에 넣으세요.
- 동작이 하나의 채널 전송에 의존한다면 해당 러너 Plugin 또는 Plugin harness에 유지하세요.
- 시나리오에 둘 이상의 채널에서 사용할 수 있는 새 capability가 필요하다면 `suite.ts`에 채널별 분기를 추가하는 대신 범용 헬퍼를 추가하세요.
- 동작이 하나의 전송에서만 의미 있다면 시나리오를 전송별로 유지하고 시나리오 계약에 이를 명시하세요.

### 시나리오 헬퍼 이름

새 시나리오에 권장되는 범용 헬퍼:

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

기존 시나리오에는 호환성 alias인 `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`가 계속 제공됩니다. 하지만 새 시나리오 작성에는 범용 이름을 사용해야 합니다. alias는 일괄 migration을 피하기 위해 존재하는 것이며, 앞으로의 모델은 아닙니다.

## 보고

`qa-lab`은 관찰된 bus timeline에서 Markdown 프로토콜 보고서를 내보냅니다. 보고서는 다음에 답해야 합니다:

- 무엇이 작동했는지
- 무엇이 실패했는지
- 무엇이 계속 차단되었는지
- 추가할 가치가 있는 후속 시나리오

사용 가능한 시나리오의 인벤토리는 후속 작업의 규모를 산정하거나 새 전송을 연결할 때 유용합니다. `pnpm openclaw qa coverage`를 실행하세요(기계가 읽을 수 있는 출력은 `--json` 추가).

문자와 스타일 검사를 위해 여러 live 모델 ref에서 동일한 시나리오를 실행하고 평가된 Markdown 보고서를 작성하세요:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

이 명령은 Docker가 아니라 로컬 QA Gateway 자식 프로세스를 실행합니다. Character eval 시나리오는 `SOUL.md`를 통해 persona를 설정한 다음 채팅, 작업 영역 도움말, 작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는 평가 중이라는 사실을 알려서는 안 됩니다. 이 명령은 각 전체 transcript를 보존하고 기본 실행 통계를 기록한 다음, 지원되는 경우 `xhigh` reasoning과 함께 fast mode로 judge 모델에 naturalness, vibe, humor 기준으로 실행 순위를 매기도록 요청합니다. 프로바이더를 비교할 때는 `--blind-judge-models`를 사용하세요. judge prompt는 여전히 모든 transcript와 실행 상태를 받지만, 후보 ref는 `candidate-01` 같은 중립 label로 대체됩니다. 보고서는 parsing 후 순위를 실제 ref에 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, GPT-5.5에는 `medium`, 이를 지원하는 이전 OpenAI eval ref에는 `xhigh`를 사용합니다. 특정 후보는 `--model provider/model,thinking=<level>`로 inline override하세요. `--thinking <level>`은 여전히 전역 fallback을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식은 호환성을 위해 유지됩니다.
OpenAI 후보 ref는 기본적으로 fast mode를 사용하므로, 프로바이더가 지원하는 경우 priority processing이 사용됩니다. 단일 후보 또는 judge에 override가 필요할 때는 inline으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요. 모든 후보 모델에 fast mode를 강제하려는 경우에만 `--fast`를 전달하세요. 후보 및 judge duration은 benchmark 분석을 위해 보고서에 기록되지만, judge prompt는 속도로 순위를 매기지 말라고 명시합니다.
후보 및 judge 모델 실행은 모두 기본 동시성 16을 사용합니다. 프로바이더 제한이나 로컬 Gateway 압력 때문에 실행이 너무 noisy해질 때는 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 character eval은 `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5`, 그리고 `google/gemini-3.1-pro-preview`를 기본값으로 사용합니다.
`--judge-model`이 전달되지 않으면 judge는 기본적으로 `openai/gpt-5.5,thinking=xhigh,fast`와 `anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [매트릭스 QA](/ko/concepts/qa-matrix)
- [QA Channel](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
