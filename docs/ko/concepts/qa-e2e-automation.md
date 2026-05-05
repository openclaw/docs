---
read_when:
    - QA 스택이 어떻게 맞물려 작동하는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장하기
    - 리포지토리 기반 QA 시나리오 추가
    - Gateway 대시보드를 중심으로 더 높은 현실성을 갖춘 품질 보증 자동화 구축
summary: 'QA 스택 개요: qa-lab, qa-channel, 리포지토리 기반 시나리오, 라이브 전송 레인, 전송 어댑터, 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-05-05T06:06:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

프라이빗 QA 스택은 단일 단위 테스트보다 더 현실적이고
채널 형태에 가까운 방식으로 OpenClaw를 실행하도록 만들어졌습니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 편집, 삭제 표면을 갖춘 합성 메시지 채널입니다.
- `extensions/qa-lab`: transcript를 관찰하고,
  인바운드 메시지를 주입하며, Markdown 보고서를 내보내는 디버거 UI 및 QA 버스입니다.
- `extensions/qa-matrix`, 향후 runner 플러그인: 자식 QA gateway 안에서
  실제 채널을 구동하는 라이브 전송 어댑터입니다.
- `qa/`: kickoff task 및 기준 QA
  시나리오를 위한 저장소 기반 seed asset입니다.
- [Mantis](/ko/concepts/mantis): 실제 전송, 브라우저 스크린샷,
  VM 상태, PR 증거가 필요한 버그를 위한 사전 및 사후 라이브 검증입니다.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 다수는 `pnpm qa:*`
스크립트 별칭을 가지며, 두 형식 모두 지원됩니다.

| 명령                                             | 목적                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 번들 QA 자체 점검입니다. Markdown 보고서를 작성합니다.                                                                                                                                             |
| `qa suite`                                          | QA gateway lane에 대해 저장소 기반 시나리오를 실행합니다. 별칭: 일회용 Linux VM에는 `pnpm openclaw qa suite --runner multipass`를 사용합니다.                                                       |
| `qa coverage`                                       | Markdown 시나리오 커버리지 인벤토리를 출력합니다(머신 출력은 `--json`).                                                                                                                |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 에이전트 parity 보고서를 작성합니다.                                                                                                               |
| `qa character-eval`                                 | 여러 라이브 모델에서 character QA 시나리오를 실행하고 판정된 보고서를 생성합니다. [Reporting](#reporting)을 참조하세요.                                                                                 |
| `qa manual`                                         | 선택한 provider/model lane에 대해 일회성 프롬프트를 실행합니다.                                                                                                                               |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | 사전 빌드된 QA Docker 이미지를 빌드합니다.                                                                                                                                                          |
| `qa docker-scaffold`                                | QA dashboard + gateway lane용 docker-compose scaffold를 작성합니다.                                                                                                                         |
| `qa up`                                             | QA 사이트를 빌드하고, Docker 기반 스택을 시작하며, URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다).                       |
| `qa aimock`                                         | AIMock provider 서버만 시작합니다.                                                                                                                                                       |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` provider 서버만 시작합니다.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex credential pool을 관리합니다.                                                                                                                                                    |
| `qa matrix`                                         | 일회용 Tuwunel homeserver에 대한 라이브 transport lane입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하세요.                                                                                           |
| `qa telegram`                                       | 실제 프라이빗 Telegram 그룹에 대한 라이브 transport lane입니다.                                                                                                                                   |
| `qa discord`                                        | 실제 프라이빗 Discord guild 채널에 대한 라이브 transport lane입니다.                                                                                                                            |
| `qa slack`                                          | 실제 프라이빗 Slack 채널에 대한 라이브 transport lane입니다.                                                                                                                                    |
| `qa mantis`                                         | 라이브 전송 버그를 위한 사전 및 사후 검증 runner이며, Discord 상태 반응 증거, Crabbox desktop/browser smoke, Slack-in-VNC smoke를 포함합니다. [Mantis](/ko/concepts/mantis)를 참조하세요. |

## 운영자 흐름

현재 QA 운영자 흐름은 2패널 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway dashboard(Control UI)입니다.
- 오른쪽: Slack과 유사한 transcript 및 시나리오 plan을 보여 주는 QA Lab입니다.

다음으로 실행합니다.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 gateway lane을 시작하며,
운영자 또는 자동화 loop가 에이전트에 QA
mission을 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했는지, 실패했는지, 또는
blocked 상태로 남았는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복하려면,
bind mount된 QA Lab 번들로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지에 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 bind mount합니다. `qa:lab:watch`는
변경 시 해당 번들을 다시 빌드하며, QA Lab
asset hash가 변경되면 브라우저가 자동으로 다시 로드됩니다.

로컬 OpenTelemetry trace smoke에는 다음을 실행하세요.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP trace receiver를 시작하고,
`diagnostics-otel` Plugin을 활성화한 상태에서 `otel-trace-smoke` QA 시나리오를 실행한 다음
내보낸 protobuf span을 디코딩하고 릴리스에 중요한 형태를 검증합니다.
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, `openclaw.message.delivery`가 있어야 합니다.
모델 호출은 성공한 turn에서 `StreamAbandoned`를 내보내면 안 됩니다. 원시 diagnostic ID와
`openclaw.content.*` attribute는 trace 밖에 유지되어야 합니다. QA suite artifact 옆에
`otel-smoke-summary.json`을 작성합니다.

Observability QA는 source checkout 전용으로 유지됩니다. npm tarball은 의도적으로
QA Lab을 제외하므로 package Docker release lane은 `qa` 명령을 실행하지 않습니다. Diagnostics
instrumentation을 변경할 때는 빌드된 source checkout에서
`pnpm qa:otel:smoke`를 사용하세요.

전송이 실제인 Matrix smoke lane에는 다음을 실행하세요.

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

이 lane의 전체 CLI reference, profile/scenario catalog, env var, artifact layout은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 요약하면, Docker에서 일회용 Tuwunel homeserver를 프로비저닝하고, 임시 driver/SUT/observer user를 등록하며, 해당 transport에 scope된 자식 QA gateway 안에서 실제 Matrix Plugin을 실행합니다(`qa-channel` 없음). 그런 다음 `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 Markdown 보고서, JSON summary, observed-events artifact, combined output log를 작성합니다.

전송이 실제인 Telegram, Discord, Slack smoke lane에는 다음을 실행하세요.

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

이들은 두 bot(driver + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 env var, scenario list, output artifact, Convex credential pool은 아래 [Telegram, Discord, Slack QA reference](#telegram-discord-and-slack-qa-reference)에 문서화되어 있습니다.

VNC rescue가 있는 전체 Slack desktop VM 실행에는 다음을 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox desktop/browser machine을 임대하고, VM 내부에서 Slack live lane을
실행하며, VNC 브라우저에서 Slack Web을 열고, desktop을 캡처하며,
video capture가 가능할 때 `slack-qa/`, `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`를
Mantis artifact directory로 복사합니다. VNC를 통해 Slack Web에 수동으로 로그인한 뒤 `--lease-id <cbx_...>`를 재사용하세요.
`--gateway-setup`을 사용하면 Mantis는 VM 내부의 port `38973`에서 영구 OpenClaw Slack
gateway를 계속 실행합니다. 사용하지 않으면 명령은 일반 bot-to-bot Slack QA lane을 실행하고 artifact capture 후 종료합니다.

에이전트/CV 스타일 desktop task에는 다음을 실행하세요.

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task`는 Crabbox desktop/browser machine을 임대하거나 재사용하고,
`crabbox record --while`을 시작하며, 중첩된 `visual-driver`를 통해 보이는 브라우저를
구동하고, `visual-task.png`를 캡처하며, `--vision-mode image-describe`가 선택된 경우
스크린샷에 대해 `openclaw infer image describe`를 실행하고,
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, `mantis-visual-task-report.md`를 작성합니다.
`--expect-text`가 설정되면 vision prompt는 구조화된 JSON
verdict를 요청하며, 모델이 긍정적인 visible evidence를 보고할 때만 통과합니다. 단순히 target text를 인용하는
negative response는 assertion에 실패합니다.
이미지 이해 provider를 호출하지 않고 desktop,
browser, screenshot, video plumbing을 증명하는 no-model smoke에는 `--vision-mode metadata`를 사용하세요.
Recording은 `visual-task`의 필수 artifact입니다. Crabbox가 비어 있지 않은 `visual-task.mp4`를
기록하지 않으면 visual driver가 통과했더라도 task는 실패합니다. 실패 시 Mantis는 task가 이미
통과했고 `--keep-lease`가 설정되지 않은 경우가 아니면 VNC용 lease를 유지합니다.

풀링된 라이브 credential을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex broker env를 확인하고, endpoint setting을 검증하며, maintainer secret이 있을 때 admin/list 접근 가능성을 확인합니다. secret에 대해서는 set/missing status만 보고합니다.

## 라이브 전송 커버리지

라이브 transport lane은 각각 고유한 scenario list shape를 만들지 않고 하나의 contract를 공유합니다. `qa-channel`은 광범위한 합성 product-behavior suite이며 라이브 transport coverage matrix의 일부가 아닙니다.

| 레인     | 카나리아 | 멘션 게이팅 | 봇 간 | 허용 목록 차단 | 최상위 답장 | 재시작 후 재개 | 스레드 후속 응답 | 스레드 격리 | 리액션 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

이렇게 하면 `qa-channel`은 광범위한 제품 동작 스위트로 유지되며, Matrix,
Telegram, 그리고 향후 라이브 전송은 하나의 명시적인 전송 계약
체크리스트를 공유합니다.

QA 경로에 Docker를 포함하지 않는 일회용 Linux VM 레인의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새로운 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트
내부에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음 일반 QA 보고서와
요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
호스트의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트 및 Multipass 스위트 실행은 기본적으로 격리된 Gateway 워커로 선택된
여러 시나리오를 병렬 실행합니다. `qa-channel`은 기본 동시성이 4이며,
선택된 시나리오 수로 제한됩니다. 워커 수를 조정하려면 `--concurrency <count>`를
사용하고, 직렬 실행에는 `--concurrency 1`을 사용하세요.
어떤 시나리오든 실패하면 명령은 0이 아닌 값으로 종료됩니다. 실패 종료 코드 없이
아티팩트만 원할 때는 `--allow-failures`를 사용하세요.
라이브 실행은 게스트에서 실용적으로 지원 가능한 QA 인증 입력을 전달합니다:
env 기반 공급자 키, QA 라이브 공급자 구성 경로, 그리고 존재하는 경우
`CODEX_HOME`입니다. 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록
`--output-dir`은 저장소 루트 아래에 두세요.

## Telegram, Discord, Slack QA 참조

Matrix는 시나리오 수와 Docker 기반 홈서버 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram, Discord, Slack은 더 작으며, 각각 몇 가지 시나리오만 있고, 프로필 시스템 없이 기존 실제 채널을 대상으로 하므로 해당 참조는 여기에 있습니다.

### 공유 CLI 플래그

이 레인들은 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 동일한 플래그를 허용합니다.

| 플래그                                  | 기본값                                                         | 설명                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 이 시나리오만 실행합니다. 반복할 수 있습니다.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 보고서/요약/관찰된 메시지와 출력 로그가 작성되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 중립 cwd에서 호출할 때의 저장소 루트입니다.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 구성 안의 임시 계정 id입니다.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 또는 `live-frontier`입니다(레거시 `live-openai`도 계속 동작합니다).                                                  |
| `--model <ref>` / `--alt-model <ref>` | 공급자 기본값                                                | 기본/대체 모델 참조입니다.                                                                                         |
| `--fast`                              | 꺼짐                                                             | 지원되는 경우 공급자 빠른 모드입니다.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하세요.                                                                |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`                              | `--credential-source convex`일 때 사용되는 역할입니다.                                                                          |

각 레인은 실패한 시나리오가 있으면 0이 아닌 값으로 종료됩니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 작성합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

두 개의 서로 다른 봇(드라이버 + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 합니다. 두 봇 모두 `@BotFather`에서 **Bot-to-Bot Communication Mode**를 활성화하면 봇 간 관찰이 가장 잘 동작합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 숫자 채팅 id(문자열).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

선택 사항:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다(기본값은 수정 처리).

시나리오(`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

출력 아티팩트:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 카나리아부터 시작해 답장별 RTT(드라이버 전송 → 관찰된 SUT 답장)를 포함합니다.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`이 아니면 본문이 수정 처리됩니다.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 봇이 있는 실제 비공개 Discord 길드 채널 하나를 대상으로 합니다. 하나는 하네스가 제어하는 드라이버 봇이고, 다른 하나는 번들 Discord Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 봇입니다. 채널 멘션 처리, SUT 봇이 Discord에 네이티브 `/help` 명령을 등록했는지, 그리고 옵트인 Mantis 증거 시나리오를 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord가 반환한 SUT 봇 사용자 id와 일치해야 합니다(그렇지 않으면 레인이 빠르게 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 옵트인 Mantis 시나리오입니다. SUT를 `messages.statusReactions.enabled=true`가 설정된 상시 활성, 도구 전용 길드 답장으로 전환하므로 단독으로 실행되며, REST 리액션 타임라인과 HTML/PNG 시각 아티팩트를 캡처합니다. Mantis 전/후 보고서도 시나리오가 제공한 MP4 아티팩트를 `baseline.mp4`와 `candidate.mp4`로 보존합니다.

Mantis 상태 리액션 시나리오를 명시적으로 실행합니다.

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
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문이 수정 처리됩니다.
- 상태 리액션 시나리오가 실행될 때 `discord-qa-reaction-timelines.json` 및 `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

두 개의 서로 다른 봇이 있는 실제 비공개 Slack 채널 하나를 대상으로 합니다. 하나는 하네스가 제어하는 드라이버 봇이고, 다른 하나는 번들 Slack Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 봇입니다.

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

출력 아티팩트:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`이 아니면 본문이 수정 처리됩니다.

#### Slack 워크스페이스 설정

이 레인에는 한 워크스페이스 안에 두 개의 서로 다른 Slack 앱과 두 봇이 모두 멤버인 채널이 필요합니다.

- `channelId` — 두 봇이 모두 초대된 채널의 `Cxxxxxxxxxx` id입니다. 전용 채널을 사용하세요. 레인은 매 실행마다 게시합니다.
- `driverBotToken` — **Driver** 앱의 봇 토큰(`xoxb-...`)입니다.
- `sutBotToken` — **SUT** 앱의 봇 토큰(`xoxb-...`)입니다. 봇 사용자 id가 구분되도록 드라이버와는 별도의 Slack 앱이어야 합니다.
- `sutAppToken` — `connections:write`가 있는 SUT 앱의 앱 수준 토큰(`xapp-...`)입니다. SUT 앱이 이벤트를 수신할 수 있도록 Socket Mode에서 사용됩니다.

프로덕션 워크스페이스를 재사용하는 것보다 QA 전용 Slack 워크스페이스를 선호하세요.

아래 SUT 매니페스트는 번들 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:10`)를 그대로 반영합니다. 사용자가 보게 되는 프로덕션 채널 설정은 [Slack 채널 빠른 설정](/ko/channels/slack#quick-setup)을 참조하세요. QA Driver/SUT 쌍은 하나의 워크스페이스에서 서로 다른 봇 사용자 id 두 개가 필요하므로 의도적으로 별도입니다.

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

_Bot User OAuth Token_(`xoxb-...`)을 복사하세요. 이것이 `driverBotToken`이 됩니다. 드라이버는 메시지를 게시하고 자신을 식별하기만 하면 됩니다. 이벤트도, Socket Mode도 필요하지 않습니다.

**2. SUT 앱 만들기**

동일한 워크스페이스에서 _Create New App → From a manifest_를 반복하세요. 범위 집합은 번들 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:10`)를 그대로 반영합니다:

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Slack이 앱을 만든 뒤, 해당 설정 페이지에서 두 가지를 수행합니다.

- _Install to Workspace_ → _Bot User OAuth Token_을 복사 → 이것이 `sutBotToken`이 됩니다.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 범위 `connections:write` 추가 → 저장 → `xapp-...` 값 복사 → 이것이 `sutAppToken`이 됩니다.

각 토큰에서 `auth.test`를 호출하여 두 봇의 사용자 ID가 서로 다른지 확인합니다. 런타임은 사용자 ID로 드라이버와 SUT를 구분합니다. 하나의 앱을 양쪽에 재사용하면 멘션 게이팅이 즉시 실패합니다.

**3. 채널 만들기**

QA 워크스페이스에서 채널(예: `#openclaw-qa`)을 만들고 채널 안에서 두 봇을 모두 초대합니다.

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_에서 `Cxxxxxxxxxx` ID를 복사합니다. 이것이 `channelId`가 됩니다. 공개 채널을 사용할 수 있습니다. 비공개 채널을 사용하는 경우에도 두 앱 모두 이미 `groups:history`를 가지고 있으므로 하네스의 기록 읽기는 계속 성공합니다.

**4. 자격 증명 등록**

두 가지 옵션이 있습니다. 단일 머신 디버깅에는 환경 변수를 사용하거나(네 개의 `OPENCLAW_QA_SLACK_*` 변수를 설정하고 `--credential-source env` 전달), CI와 다른 유지관리자가 대여할 수 있도록 공유 Convex 풀을 시드합니다.

Convex 풀의 경우 네 필드를 JSON 파일에 씁니다.

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

셸에서 `OPENCLAW_QA_CONVEX_SITE_URL`과 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`를 내보낸 상태로 등록하고 확인합니다.

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"`, `lease` 필드 없음이 예상됩니다.

**5. 종단 간 확인**

두 봇이 브로커를 통해 서로 대화할 수 있는지 확인하려면 로컬에서 lane을 실행합니다.

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

성공한 실행은 30초보다 훨씬 짧게 완료되며, `slack-qa-report.md`에는 `slack-canary`와 `slack-mention-gating`이 모두 상태 `pass`로 표시됩니다. lane이 약 90초 동안 멈춘 뒤 `Convex credential pool exhausted for kind "slack"`로 종료되면, 풀이 비어 있거나 모든 행이 대여된 상태입니다. `qa credentials list --kind slack --status all --json`으로 어느 쪽인지 확인할 수 있습니다.

### Convex 자격 증명 풀

Telegram, Discord, Slack lane은 위의 환경 변수를 읽는 대신 공유 Convex 풀에서 자격 증명을 대여할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정합니다. QA Lab은 독점 lease를 획득하고, 실행되는 동안 Heartbeat를 보내며, 종료 시 해제합니다. 풀 종류는 `"telegram"`, `"discord"`, `"slack"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형태:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId`는 숫자 채팅 ID 문자열이어야 합니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack(`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId`는 `^[A-Z][A-Z0-9]+$`와 일치해야 합니다(`Cxxxxxxxxxx` 같은 Slack ID). 앱과 범위 프로비저닝은 [Slack 워크스페이스 설정](#setting-up-the-slack-workspace)을 참고하세요.

운영 환경 변수와 Convex 브로커 엔드포인트 계약은 [테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다. 이 섹션 이름은 Discord 지원보다 먼저 만들어졌지만, 브로커 의미 체계는 두 종류 모두 동일합니다.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이 파일들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 범용 Markdown 러너로 유지되어야 합니다. 각 시나리오 Markdown 파일은 하나의 테스트 실행에 대한 단일 진실 공급원이며 다음을 정의해야 합니다.

- 시나리오 메타데이터
- 선택적 카테고리, 기능, lane, 위험 메타데이터
- 문서 및 코드 참조
- 선택적 Plugin 요구 사항
- 선택적 Gateway 구성 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은 범용 및 교차 기능으로 유지될 수 있습니다. 예를 들어 Markdown 시나리오는 Gateway `browser.request` seam을 통해 내장 Control UI를 구동하는 브라우저 측 헬퍼와 전송 측 헬퍼를 결합할 수 있으며, 이를 위해 특수 사례 러너를 추가할 필요는 없습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 그룹화해야 합니다. 파일이 이동하더라도 시나리오 ID는 안정적으로 유지하세요. 구현 추적 가능성에는 `docsRefs`와 `codeRefs`를 사용합니다.

기준 목록은 다음을 포괄할 수 있을 만큼 충분히 넓게 유지해야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 핸드오프
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## Provider mock lane

`qa suite`에는 두 개의 로컬 Provider mock lane이 있습니다.

- `mock-openai`는 시나리오 인식 OpenClaw mock입니다. 리포지토리 기반 QA와 패리티 게이트의 기본 결정적 mock lane으로 유지됩니다.
- `aimock`은 실험적 프로토콜, fixture, 기록/재생, chaos 커버리지를 위한 AIMock 기반 Provider 서버를 시작합니다. 이는 추가 항목이며 `mock-openai` 시나리오 dispatcher를 대체하지 않습니다.

Provider lane 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다. 각 Provider는 자체 기본값, 로컬 서버 시작, Gateway 모델 구성, 인증 프로필 스테이징 요구 사항, 라이브/mock 기능 플래그를 소유합니다. 공유 suite 및 Gateway 코드는 Provider 이름으로 분기하는 대신 Provider registry를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 Markdown QA 시나리오를 위한 범용 전송 seam을 소유합니다. `qa-channel`은 이 seam의 첫 번째 어댑터이지만 설계 목표는 더 넓습니다. 향후 실제 또는 합성 채널은 전송 전용 QA 러너를 추가하는 대신 동일한 suite 러너에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 범용 시나리오 실행, 작업자 동시성, 아티팩트 작성, 보고를 소유합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 작업, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 Markdown 시나리오 파일은 테스트 실행을 정의합니다. `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

Markdown QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 채널의 전송 어댑터.
2. 채널 계약을 실행하는 시나리오 팩.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있을 때 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- suite 시작 및 종료
- 작업자 동시성
- 아티팩트 작성
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오를 위한 호환성 별칭

러너 Plugin은 전송 계약을 소유합니다.

- `openclaw qa <runner>`가 공유 `qa` 루트 아래에 마운트되는 방식
- 해당 전송에 대해 Gateway가 구성되는 방식
- 준비 상태를 확인하는 방식
- 인바운드 이벤트를 주입하는 방식
- 아웃바운드 메시지를 관찰하는 방식
- transcript와 정규화된 전송 상태를 노출하는 방식
- 전송 기반 작업을 실행하는 방식
- 전송별 reset 또는 cleanup을 처리하는 방식

새 채널의 최소 도입 기준:

1. 공유 `qa` 루트의 소유자로 `qa-lab`을 유지합니다.
2. 공유 `qa-lab` 호스트 seam에 전송 러너를 구현합니다.
3. 전송별 메커니즘은 러너 Plugin 또는 채널 하네스 안에 유지합니다.
4. 경쟁 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다. 러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 내보내야 합니다. `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI 및 러너 실행은 별도의 엔트리포인트 뒤에 있어야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 Markdown 시나리오를 작성하거나 조정합니다.
6. 새 시나리오에는 범용 시나리오 헬퍼를 사용합니다.
7. 리포지토리가 의도적인 migration을 수행하는 경우가 아니라면 기존 호환성 별칭이 계속 작동하도록 유지합니다.

판단 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있으면 `qa-lab`에 넣습니다.
- 동작이 하나의 채널 전송에 의존하면 해당 러너 Plugin 또는 Plugin 하네스에 유지합니다.
- 시나리오에 둘 이상의 채널이 사용할 수 있는 새 기능이 필요하면 `suite.ts`에 채널별 분기를 추가하는 대신 범용 헬퍼를 추가합니다.
- 동작이 하나의 전송에서만 의미가 있다면 시나리오를 전송별로 유지하고 시나리오 계약에서 이를 명확히 합니다.

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

기존 시나리오에는 호환성 별칭인 `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`를 계속 사용할 수 있습니다. 하지만 새 시나리오 작성에는 범용 이름을 사용해야 합니다. 별칭은 일괄 migration을 피하기 위해 존재하며, 앞으로의 모델은 아닙니다.

## 보고

`qa-lab`은 관찰된 bus timeline에서 Markdown 프로토콜 보고서를 내보냅니다. 보고서는 다음에 답해야 합니다.

- 작동한 것
- 실패한 것
- 계속 차단된 것
- 추가할 가치가 있는 후속 시나리오

사용 가능한 시나리오 목록은 후속 작업 규모를 산정하거나 새 전송을 연결할 때 유용합니다. `pnpm openclaw qa coverage`를 실행하세요. 기계가 읽을 수 있는 출력이 필요하면 `--json`을 추가합니다.

문자 및 스타일 검사의 경우 여러 라이브 모델 refs에서 동일한 시나리오를 실행하고 평가된 Markdown 보고서를 작성합니다.

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

이 명령은 Docker가 아니라 로컬 QA Gateway 자식 프로세스를 실행합니다. 캐릭터 평가
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음 채팅, 작업 공간 지원, 작은 파일 작업과
같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는 평가 중이라는 사실을
알려서는 안 됩니다. 이 명령은 각 전체 대화 기록을 보존하고, 기본 실행 통계를 기록한 다음,
지원되는 경우 `xhigh` 추론을 사용하는 빠른 모드에서 심사 모델에 자연스러움, 분위기, 유머를 기준으로 실행 순위를 매기도록 요청합니다.
제공자를 비교할 때는 `--blind-judge-models`를 사용하세요. 심사 프롬프트는 여전히
모든 대화 기록과 실행 상태를 받지만, 후보 참조는 `candidate-01` 같은 중립
라벨로 대체됩니다. 보고서는 파싱 후 순위를 실제 참조에 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, GPT-5.5에는 `medium`, 이를 지원하는
이전 OpenAI 평가 참조에는 `xhigh`를 사용합니다. 특정 후보는
`--model provider/model,thinking=<level>`로 인라인 재정의하세요. `--thinking <level>`은 여전히
전역 폴백을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식은
호환성을 위해 유지됩니다.
OpenAI 후보 참조는 기본적으로 빠른 모드를 사용하므로, 제공자가 지원하는 경우
우선 처리됩니다. 단일 후보 또는 심사에 재정의가 필요할 때는 인라인으로
`,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요. 모든 후보 모델에
빠른 모드를 강제로 켜려는 경우에만 `--fast`를 전달하세요. 후보 및 심사 소요 시간은
벤치마크 분석을 위해 보고서에 기록되지만, 심사 프롬프트는 속도로 순위를 매기지 말라고 명시합니다.
후보 및 심사 모델 실행은 모두 기본 동시성 16을 사용합니다. 제공자 제한 또는 로컬 Gateway
부하로 인해 실행이 너무 불안정해질 때는 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면, 캐릭터 평가는 기본적으로
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, 그리고
`google/gemini-3.1-pro-preview`를 사용합니다.
`--judge-model`이 전달되지 않으면, 심사는 기본적으로
`openai/gpt-5.5,thinking=xhigh,fast` 및
`anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [Matrix QA](/ko/concepts/qa-matrix)
- [QA 채널](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
