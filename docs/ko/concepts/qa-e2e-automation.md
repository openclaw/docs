---
read_when:
    - QA 스택이 어떻게 맞물리는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장하기
    - 리포지토리 기반 QA 시나리오 추가
    - Gateway 대시보드를 위한 더 현실적인 QA 자동화 구축
summary: 'QA 스택 개요: qa-lab, qa-channel, 저장소 기반 시나리오, 라이브 전송 레인, 전송 어댑터 및 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-05-05T01:45:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고 채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드, 반응, 편집, 삭제 표면을 갖춘 합성 메시지 채널.
- `extensions/qa-lab`: 트랜스크립트 관찰, 인바운드 메시지 주입, Markdown 보고서 내보내기를 위한 디버거 UI 및 QA 버스.
- `extensions/qa-matrix`, 향후 러너 Plugin: 하위 QA Gateway 안에서 실제 채널을 구동하는 라이브 전송 어댑터.
- `qa/`: 시작 작업과 기준 QA 시나리오를 위한 저장소 기반 시드 에셋.
- [Mantis](/ko/concepts/mantis): 실제 전송, 브라우저 스크린샷, VM 상태, PR 증거가 필요한 버그에 대한 수정 전후 라이브 검증.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 다수는 `pnpm qa:*` 스크립트 별칭을 갖고 있으며, 두 형식 모두 지원됩니다.

| 명령                                                | 목적                                                                                                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 번들된 QA 자체 점검이며 Markdown 보고서를 작성합니다.                                                                                                                                                   |
| `qa suite`                                          | 저장소 기반 시나리오를 QA Gateway 레인에 대해 실행합니다. 별칭: 일회용 Linux VM의 경우 `pnpm openclaw qa suite --runner multipass`.                                                                       |
| `qa coverage`                                       | Markdown 시나리오 커버리지 인벤토리를 출력합니다(기계 출력은 `--json`).                                                                                                                                 |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 agentic 패리티 보고서를 작성합니다.                                                                                                                          |
| `qa character-eval`                                 | 여러 라이브 모델에서 캐릭터 QA 시나리오를 실행하고 판정된 보고서를 생성합니다. [보고](#reporting)를 참조하세요.                                                                                         |
| `qa manual`                                         | 선택한 제공자/모델 레인에 대해 일회성 프롬프트를 실행합니다.                                                                                                                                            |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                                        |
| `qa docker-build-image`                             | 사전 빌드된 QA Docker 이미지를 빌드합니다.                                                                                                                                                              |
| `qa docker-scaffold`                                | QA 대시보드 + Gateway 레인을 위한 docker-compose 스캐폴드를 작성합니다.                                                                                                                                 |
| `qa up`                                             | QA 사이트를 빌드하고, Docker 기반 스택을 시작하며, URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다).                         |
| `qa aimock`                                         | AIMock 제공자 서버만 시작합니다.                                                                                                                                                                        |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` 제공자 서버만 시작합니다.                                                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex 자격 증명 풀을 관리합니다.                                                                                                                                                                  |
| `qa matrix`                                         | 일회용 Tuwunel 홈서버를 대상으로 하는 라이브 전송 레인입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하세요.                                                                                            |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                       |
| `qa discord`                                        | 실제 비공개 Discord 길드 채널을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                   |
| `qa slack`                                          | 실제 비공개 Slack 채널을 대상으로 하는 라이브 전송 레인입니다.                                                                                                                                          |
| `qa mantis`                                         | 라이브 전송 버그를 위한 수정 전후 검증 러너이며, Discord 상태 반응 증거, Crabbox 데스크톱/브라우저 스모크, Slack-in-VNC 스모크를 포함합니다. [Mantis](/ko/concepts/mantis)를 참조하세요.                  |

## 운영자 흐름

현재 QA 운영자 흐름은 두 패널 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI).
- 오른쪽: Slack과 유사한 트랜스크립트와 시나리오 계획을 보여 주는 QA Lab.

다음으로 실행하세요.

```bash
pnpm qa:lab:up
```

그러면 QA 사이트를 빌드하고, Docker 기반 Gateway 레인을 시작하며, 운영자 또는 자동화 루프가 에이전트에 QA 임무를 제공하고 실제 채널 동작을 관찰하며 무엇이 동작했는지, 실패했는지, 또는 계속 차단되었는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복하려면, 바인드 마운트된 QA Lab 번들로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지에 유지하고 `extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하며, QA Lab 에셋 해시가 변경되면 브라우저가 자동으로 다시 로드됩니다.

로컬 OpenTelemetry trace smoke의 경우 다음을 실행하세요.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP trace 수신기를 시작하고, `diagnostics-otel` Plugin이 활성화된 상태로 `otel-trace-smoke` QA 시나리오를 실행한 다음, 내보낸 protobuf span을 디코딩하고 릴리스에 중요한 형태를 검증합니다. `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`, `openclaw.context.assembled`, `openclaw.message.delivery`가 있어야 합니다. 모델 호출은 성공한 턴에서 `StreamAbandoned`를 내보내면 안 됩니다. 원시 진단 ID와 `openclaw.content.*` 속성은 trace에 포함되지 않아야 합니다. QA suite 아티팩트 옆에 `otel-smoke-summary.json`을 작성합니다.

관측 가능성 QA는 소스 체크아웃 전용으로 유지됩니다. npm tarball은 의도적으로 QA Lab을 생략하므로 패키지 Docker 릴리스 레인은 `qa` 명령을 실행하지 않습니다. 진단 계측을 변경할 때는 빌드된 소스 체크아웃에서 `pnpm qa:otel:smoke`를 사용하세요.

실제 전송 Matrix smoke 레인의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, env var, 아티팩트 레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 한눈에 보면, Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고, 임시 driver/SUT/observer 사용자를 등록하며, 해당 전송으로 범위가 지정된 하위 QA Gateway 안에서 실제 Matrix Plugin을 실행합니다(`qa-channel` 없음). 그런 다음 `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 Markdown 보고서, JSON 요약, 관찰된 이벤트 아티팩트, 결합된 출력 로그를 작성합니다.

실제 전송 Telegram, Discord, Slack smoke 레인의 경우:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

이들은 두 봇(driver + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 env var, 시나리오 목록, 출력 아티팩트, Convex 자격 증명 풀은 아래 [Telegram, Discord, Slack QA 참조](#telegram-discord-and-slack-qa-reference)에 문서화되어 있습니다.

VNC 구조 기능이 있는 전체 Slack 데스크톱 VM 실행의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱/브라우저 머신을 임대하고, VM 안에서 Slack 라이브 레인을 실행하며, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 캡처한 다음 `slack-qa/`와 `slack-desktop-smoke.png`를 Mantis 아티팩트 디렉터리로 복사합니다. VNC를 통해 Slack Web에 수동으로 로그인한 뒤 `--lease-id <cbx_...>`를 재사용하세요. `--gateway-setup`을 사용하면 Mantis는 포트 `38973`에서 VM 안에 지속적인 OpenClaw Slack Gateway를 실행한 상태로 둡니다. 이를 사용하지 않으면 명령은 일반 봇 간 Slack QA 레인을 실행하고 아티팩트 캡처 후 종료합니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex 브로커 env를 확인하고, 엔드포인트 설정을 검증하며, 유지관리자 비밀이 있을 때 admin/list 도달 가능성을 확인합니다. 비밀에 대해서는 설정됨/누락 상태만 보고합니다.

## 라이브 전송 커버리지

라이브 전송 레인은 각자 고유한 시나리오 목록 형태를 만들지 않고 하나의 계약을 공유합니다. `qa-channel`은 폭넓은 합성 제품 동작 suite이며 라이브 전송 커버리지 매트릭스의 일부가 아닙니다.

| 레인     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

이렇게 하면 `qa-channel`은 폭넓은 제품 동작 suite로 유지되고, Matrix, Telegram, 향후 라이브 전송은 하나의 명시적 전송 계약 체크리스트를 공유합니다.

QA 경로에 Docker를 들이지 않는 일회용 Linux VM 레인의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

새 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 안에서 OpenClaw를
빌드하고, `qa suite`를 실행한 다음 일반 QA 보고서와 요약을 호스트의
`.artifacts/qa-e2e/...`로 다시 복사합니다.
호스트의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트 및 Multipass suite 실행은 기본적으로 격리된 gateway 워커로 선택된 여러 시나리오를
병렬 실행합니다. `qa-channel`의 기본 동시성은 4이며, 선택된 시나리오 수로 제한됩니다.
워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행에는
`--concurrency 1`을 사용하세요.
시나리오 하나라도 실패하면 명령은 0이 아닌 코드로 종료됩니다. 실패 종료 코드 없이
아티팩트가 필요할 때는 `--allow-failures`를 사용하세요.
Live 실행은 게스트에서 실용적으로 사용할 수 있는 지원 QA 인증 입력을 전달합니다:
env 기반 provider 키, QA live provider 구성 경로, 그리고 존재하는 경우
`CODEX_HOME`입니다. 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록
`--output-dir`는 repo 루트 아래에 두세요.

## Telegram, Discord, Slack QA 참조

Matrix는 시나리오 수와 Docker 기반 홈서버 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram, Discord, Slack은 더 작아서 각각 몇 개의 시나리오만 있고, 프로필 시스템 없이 기존 실제 채널을 대상으로 하므로 해당 참조는 여기에 있습니다.

### 공유 CLI 플래그

이 lane들은 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 동일한 플래그를 받습니다:

| 플래그                                  | 기본값                                                         | 설명                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 이 시나리오만 실행합니다. 반복할 수 있습니다.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 보고서/요약/관찰된 메시지와 출력 로그가 기록되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 중립적인 cwd에서 호출할 때의 저장소 루트입니다.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA gateway 구성 내부의 임시 계정 id입니다.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 또는 `live-frontier`입니다(레거시 `live-openai`도 여전히 작동합니다).                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider 기본값                                                | 기본/대체 모델 ref입니다.                                                                                         |
| `--fast`                              | 꺼짐                                                             | 지원되는 경우 provider 빠른 모드입니다.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하세요.                                                                |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`                              | `--credential-source convex`일 때 사용되는 역할입니다.                                                                          |

각 lane은 실패한 시나리오가 있으면 0이 아닌 코드로 종료됩니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 기록합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

두 개의 구분된 bot(driver + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT bot에는 Telegram 사용자 이름이 있어야 합니다. bot 간 관찰은 두 bot 모두 `@BotFather`에서 **Bot-to-Bot Communication Mode**가 활성화되어 있을 때 가장 잘 작동합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 숫자 chat id(문자열).
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

출력 아티팩트:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — canary부터 reply별 RTT(driver 전송 → 관찰된 SUT reply)를 포함합니다.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`이 아니면 본문은 수정 처리됩니다.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 bot이 있는 실제 비공개 Discord guild 채널 하나를 대상으로 합니다: harness가 제어하는 driver bot과 bundled Discord Plugin을 통해 자식 OpenClaw gateway가 시작하는 SUT bot입니다. 채널 mention 처리, SUT bot이 Discord에 네이티브 `/help` 명령을 등록했는지, 그리고 opt-in Mantis 증거 시나리오를 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord가 반환한 SUT bot 사용자 id와 일치해야 합니다(그렇지 않으면 lane이 빠르게 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis 시나리오입니다. SUT를 `messages.statusReactions.enabled=true`로 항상 켜짐, 도구 전용 guild reply로 전환한 다음 REST reaction 타임라인과 HTML/PNG 시각 아티팩트를 캡처하므로 단독으로 실행됩니다.

Mantis status-reaction 시나리오를 명시적으로 실행하세요:

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
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문은 수정 처리됩니다.
- 상태 반응 시나리오가 실행될 때 `discord-qa-reaction-timelines.json` 및 `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

하네스가 제어하는 드라이버 봇과 번들 Slack Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 봇, 이렇게 서로 다른 두 봇이 있는 실제 비공개 Slack 채널 하나를 대상으로 합니다.

`--credential-source env` 사용 시 필요한 환경 변수:

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
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`이 아니면 본문은 수정 처리됩니다.

#### Slack 워크스페이스 설정

이 레인에는 하나의 워크스페이스 안에 서로 다른 Slack 앱 두 개와 두 봇이 모두 멤버인 채널이 필요합니다.

- `channelId` — 두 봇이 모두 초대된 채널의 `Cxxxxxxxxxx` id입니다. 전용 채널을 사용하세요. 이 레인은 실행할 때마다 게시합니다.
- `driverBotToken` — **Driver** 앱의 봇 토큰(`xoxb-...`)입니다.
- `sutBotToken` — **SUT** 앱의 봇 토큰(`xoxb-...`)입니다. 봇 사용자 id가 서로 다르도록 드라이버와 별도의 Slack 앱이어야 합니다.
- `sutAppToken` — `connections:write`가 있는 SUT 앱의 앱 수준 토큰(`xapp-...`)입니다. Socket Mode에서 SUT 앱이 이벤트를 받을 수 있도록 사용됩니다.

프로덕션 워크스페이스를 재사용하기보다는 QA 전용 Slack 워크스페이스를 권장합니다.

아래 SUT 매니페스트는 번들 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:10`)를 반영합니다. 사용자가 보게 되는 프로덕션 채널 설정은 [Slack 채널 빠른 설정](/ko/channels/slack#quick-setup)을 참조하세요. QA Driver/SUT 쌍은 이 레인에 하나의 워크스페이스 안에서 서로 다른 봇 사용자 id 두 개가 필요하므로 의도적으로 분리되어 있습니다.

**1. Driver 앱 만들기**

[api.slack.com/apps](https://api.slack.com/apps)로 이동 → _Create New App_ → _From a manifest_ → QA 워크스페이스 선택, 다음 매니페스트를 붙여넣은 다음 _Install to Workspace_:

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

_Bot User OAuth Token_(`xoxb-...`)을 복사합니다. 이것이 `driverBotToken`이 됩니다. 드라이버는 메시지를 게시하고 자신을 식별하기만 하면 됩니다. 이벤트와 Socket Mode는 필요하지 않습니다.

**2. SUT 앱 만들기**

같은 워크스페이스에서 _Create New App → From a manifest_를 반복합니다. 범위 집합은 번들 Slack Plugin의 프로덕션 설치(`extensions/slack/src/setup-shared.ts:10`)를 반영합니다.

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

Slack이 앱을 만든 후 해당 설정 페이지에서 두 가지 작업을 수행합니다.

- _Install to Workspace_ → _Bot User OAuth Token_ 복사 → 이것이 `sutBotToken`이 됩니다.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 범위 `connections:write` 추가 → 저장 → `xapp-...` 값 복사 → 이것이 `sutAppToken`이 됩니다.

`auth.test`를 각 토큰에 호출해 두 봇의 사용자 ID가 서로 다른지 확인하세요. 런타임은 사용자 ID로 드라이버와 SUT를 구분합니다. 하나의 앱을 둘 모두에 재사용하면 멘션 게이팅이 즉시 실패합니다.

**3. 채널 생성**

QA 워크스페이스에서 채널(예: `#openclaw-qa`)을 만들고, 채널 안에서 두 봇을 모두 초대하세요.

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_채널 정보 → 정보 → 채널 ID_에서 `Cxxxxxxxxxx` ID를 복사하세요. 이것이 `channelId`가 됩니다. 공개 채널을 사용해도 됩니다. 비공개 채널을 사용하는 경우에도 두 앱 모두 이미 `groups:history`를 가지고 있으므로 하네스의 기록 읽기는 계속 성공합니다.

**4. 자격 증명 등록**

두 가지 옵션이 있습니다. 단일 머신 디버깅에는 환경 변수를 사용하거나(`OPENCLAW_QA_SLACK_*` 변수 네 개를 설정하고 `--credential-source env` 전달), CI와 다른 메인테이너가 대여할 수 있도록 공유 Convex 풀에 시드할 수 있습니다.

Convex 풀의 경우 네 필드를 JSON 파일에 작성하세요.

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

셸에 `OPENCLAW_QA_CONVEX_SITE_URL` 및 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`를 내보낸 상태에서 등록하고 확인하세요.

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"`가 표시되고 `lease` 필드는 없어야 합니다.

**5. 엔드 투 엔드 확인**

브로커를 통해 두 봇이 서로 대화할 수 있는지 확인하려면 로컬에서 레인을 실행하세요.

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

정상 실행은 30초보다 훨씬 짧은 시간 안에 완료되며, `slack-qa-report.md`에는 `slack-canary`와 `slack-mention-gating`이 모두 `pass` 상태로 표시됩니다. 레인이 약 90초 동안 멈춘 뒤 `Convex credential pool exhausted for kind "slack"`로 종료되면 풀이 비어 있거나 모든 행이 대여 중인 것입니다. `qa credentials list --kind slack --status all --json`으로 어느 쪽인지 확인할 수 있습니다.

### Convex 자격 증명 풀

Telegram, Discord, Slack 레인은 위 환경 변수를 읽는 대신 공유 Convex 풀에서 자격 증명을 대여할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요. QA Lab은 독점 대여를 획득하고, 실행 기간 동안 Heartbeat를 보내며, 종료 시 이를 해제합니다. 풀 종류는 `"telegram"`, `"discord"`, `"slack"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형태:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId`는 숫자 채팅 ID 문자열이어야 합니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack(`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId`는 `^[A-Z][A-Z0-9]+$`와 일치해야 합니다(Slack ID 예: `Cxxxxxxxxxx`). 앱 및 범위 프로비저닝은 [Slack 워크스페이스 설정](#setting-up-the-slack-workspace)을 참고하세요.

운영 환경 변수와 Convex 브로커 엔드포인트 계약은 [테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다. 섹션 이름은 Discord 지원보다 먼저 만들어졌지만, 브로커 의미 체계는 두 종류 모두 동일합니다.

## 저장소 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 범용 Markdown 러너로 유지되어야 합니다. 각 시나리오 Markdown 파일은 하나의 테스트 실행에 대한 원본 소스이며 다음을 정의해야 합니다.

- 시나리오 메타데이터
- 선택적 카테고리, 기능, 레인, 위험 메타데이터
- 문서 및 코드 참조
- 선택적 Plugin 요구 사항
- 선택적 Gateway 구성 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은 범용적이고 횡단적으로 유지될 수 있습니다. 예를 들어, Markdown 시나리오는 특별 사례 러너를 추가하지 않고도 Gateway `browser.request` 심을 통해 임베디드 Control UI를 구동하는 브라우저 측 헬퍼와 전송 측 헬퍼를 조합할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 그룹화해야 합니다. 파일이 이동하더라도 시나리오 ID는 안정적으로 유지하세요. 구현 추적성에는 `docsRefs`와 `codeRefs`를 사용하세요.

기준 목록은 다음을 포괄할 만큼 충분히 넓게 유지해야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명 주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 서브에이전트 핸드오프
- 저장소 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 제공자 모의 레인

`qa suite`에는 두 개의 로컬 제공자 모의 레인이 있습니다.

- `mock-openai`는 시나리오 인식 OpenClaw 모의입니다. 저장소 기반 QA와 패리티 게이트의 기본 결정적 모의 레인으로 유지됩니다.
- `aimock`은 실험적 프로토콜, 픽스처, 기록/재생, 카오스 커버리지를 위해 AIMock 기반 제공자 서버를 시작합니다. 이는 추가 기능이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

제공자 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다. 각 제공자는 자체 기본값, 로컬 서버 시작, Gateway 모델 구성, 인증 프로필 스테이징 요구 사항, 라이브/모의 기능 플래그를 소유합니다. 공유 suite 및 Gateway 코드는 제공자 이름으로 분기하는 대신 제공자 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 Markdown QA 시나리오를 위한 범용 전송 심을 소유합니다. `qa-channel`은 이 심의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다. 향후 실제 또는 합성 채널은 전송별 QA 러너를 추가하는 대신 동일한 suite 러너에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 범용 시나리오 실행, 워커 동시성, 아티팩트 작성, 보고를 소유합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 액션, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 Markdown 시나리오 파일은 테스트 실행을 정의하고, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

Markdown QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 채널용 전송 어댑터.
2. 채널 계약을 실행하는 시나리오 팩.

공유 `qa-lab` 호스트가 플로를 소유할 수 있을 때는 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- suite 시작 및 종료
- 워커 동시성
- 아티팩트 작성
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오용 호환성 별칭

러너 Plugin은 전송 계약을 소유합니다.

- 공유 `qa` 루트 아래에 `openclaw qa <runner>`를 마운트하는 방식
- 해당 전송을 위해 Gateway를 구성하는 방식
- 준비 상태를 확인하는 방식
- 인바운드 이벤트를 주입하는 방식
- 아웃바운드 메시지를 관찰하는 방식
- 트랜스크립트와 정규화된 전송 상태를 노출하는 방식
- 전송 기반 액션을 실행하는 방식
- 전송별 재설정 또는 정리를 처리하는 방식

새 채널의 최소 도입 기준:

1. `qa-lab`을 공유 `qa` 루트의 소유자로 유지하세요.
2. 공유 `qa-lab` 호스트 심에 전송 러너를 구현하세요.
3. 전송별 메커니즘은 러너 Plugin 또는 채널 하네스 안에 유지하세요.
4. 경쟁하는 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트하세요. 러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고, `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 내보내야 합니다. `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI 및 러너 실행은 별도의 엔트리포인트 뒤에 유지해야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 Markdown 시나리오를 작성하거나 조정하세요.
6. 새 시나리오에는 범용 시나리오 헬퍼를 사용하세요.
7. 저장소가 의도적 마이그레이션을 수행하는 경우가 아니라면 기존 호환성 별칭이 계속 작동하도록 유지하세요.

결정 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있다면 `qa-lab`에 두세요.
- 동작이 하나의 채널 전송에 의존한다면 해당 러너 Plugin 또는 Plugin 하네스에 유지하세요.
- 둘 이상의 채널이 사용할 수 있는 새 기능이 시나리오에 필요하다면 `suite.ts`에 채널별 분기를 추가하는 대신 범용 헬퍼를 추가하세요.
- 동작이 하나의 전송에서만 의미가 있다면 시나리오를 전송별로 유지하고 시나리오 계약에 이를 명확히 하세요.

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

기존 시나리오에는 호환성 별칭 `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`가 계속 제공됩니다. 하지만 새 시나리오 작성에는 범용 이름을 사용해야 합니다. 별칭은 일괄 마이그레이션을 피하기 위해 존재하는 것이며, 앞으로의 모델이 아닙니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음에 답해야 합니다.

- 작동한 것
- 실패한 것
- 계속 차단된 것
- 추가할 가치가 있는 후속 시나리오

사용 가능한 시나리오 인벤토리는 후속 작업 규모를 산정하거나 새 전송을 연결할 때 유용합니다. `pnpm openclaw qa coverage`를 실행하세요(머신 판독 가능 출력이 필요하면 `--json` 추가).

문자 및 스타일 검사를 위해 동일한 시나리오를 여러 라이브 모델 참조에서 실행하고, 판정된 Markdown 보고서를 작성하세요.

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

이 명령은 Docker가 아니라 로컬 QA Gateway 하위 프로세스를 실행합니다. 캐릭터 평가
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음 채팅, 작업공간 도움말, 작은 파일 작업 같은
일반적인 사용자 턴을 실행해야 합니다. 후보 모델에는 평가 중이라는 사실을
알려서는 안 됩니다. 이 명령은 각 전체
트랜스크립트를 보존하고, 기본 실행 통계를 기록한 다음, 지원되는 경우
`xhigh` 추론과 함께 빠른 모드로 심사 모델에 실행 결과를 자연스러움, 분위기, 유머 기준으로 순위 매기도록 요청합니다.
제공자를 비교할 때는 `--blind-judge-models`를 사용하세요. 심사 프롬프트에는 여전히
모든 트랜스크립트와 실행 상태가 전달되지만, 후보 참조는 `candidate-01` 같은 중립
레이블로 대체됩니다. 보고서는 파싱 후 순위를 실제 참조로 다시
매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, GPT-5.5에는 `medium`, 이를 지원하는 더 오래된 OpenAI 평가 참조에는 `xhigh`를 사용합니다. 특정 후보는
`--model provider/model,thinking=<level>`로 인라인 재정의할 수 있습니다. `--thinking <level>`은 여전히
전역 fallback을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식은
호환성을 위해 유지됩니다.
OpenAI 후보 참조는 기본적으로 빠른 모드를 사용하므로, 제공자가 지원하는 경우
우선 처리됩니다. 단일 후보 또는 심사 모델에 재정의가 필요할 때는
`,fast`, `,no-fast`, 또는 `,fast=false`를 인라인으로 추가하세요. 모든 후보 모델에 대해
빠른 모드를 강제로 켜려는 경우에만 `--fast`를 전달하세요. 후보 및 심사 모델의 실행 시간은
벤치마크 분석을 위해 보고서에 기록되지만, 심사 프롬프트는 속도로
순위를 매기지 말라고 명시합니다.
후보 및 심사 모델 실행은 모두 기본 동시성 16을 사용합니다. 제공자 제한이나 로컬 Gateway
부하로 인해 실행 노이즈가 너무 커질 때는
`--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 캐릭터 평가는 기본적으로
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, 그리고
`google/gemini-3.1-pro-preview`를 사용합니다.
`--judge-model`이 전달되지 않으면 심사 모델은 기본적으로
`openai/gpt-5.5,thinking=xhigh,fast` 및
`anthropic/claude-opus-4-6,thinking=high`입니다.

## 관련 문서

- [Matrix QA](/ko/concepts/qa-matrix)
- [QA Channel](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
