---
read_when:
    - QA 스택이 어떻게 함께 작동하는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장하기
    - 리포지토리 기반 QA 시나리오 추가
    - Gateway 대시보드를 중심으로 더 현실적인 QA 자동화 구축하기
summary: 'QA 스택 개요: qa-lab, qa-channel, 리포지토리 기반 시나리오, 라이브 전송 레인, 전송 어댑터 및 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-05-04T06:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적인,
채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 편집, 삭제 표면을 갖춘 합성 메시지 채널입니다.
- `extensions/qa-lab`: 트랜스크립트를 관찰하고,
  인바운드 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스입니다.
- `extensions/qa-matrix`, 향후 러너 Plugin: 하위 QA Gateway 안에서
  실제 채널을 구동하는 라이브 전송 어댑터입니다.
- `qa/`: 시작 작업 및 기준 QA
  시나리오를 위한 저장소 기반 시드 자산입니다.
- [Mantis](/ko/concepts/mantis): 실제 전송, 브라우저 스크린샷,
  VM 상태, PR 증거가 필요한 버그를 위한 라이브 검증 전후 비교입니다.

## 명령어 인터페이스

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 많은 명령에는 `pnpm qa:*`
스크립트 별칭이 있으며, 두 형식 모두 지원됩니다.

| 명령어                                              | 목적                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 번들된 QA 자체 점검을 실행하고 Markdown 보고서를 작성합니다.                                                                                                                                 |
| `qa suite`                                          | QA Gateway 레인에 대해 저장소 기반 시나리오를 실행합니다. 별칭: 일회용 Linux VM에는 `pnpm openclaw qa suite --runner multipass`를 사용합니다.                                                |
| `qa coverage`                                       | Markdown 시나리오 범위 인벤토리를 출력합니다(머신 출력에는 `--json`).                                                                                                                        |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 에이전트식 패리티 보고서를 작성합니다.                                                                                                            |
| `qa character-eval`                                 | 여러 라이브 모델에서 캐릭터 QA 시나리오를 실행하고 판정 보고서를 생성합니다. [보고](#reporting)를 참조하세요.                                                                                |
| `qa manual`                                         | 선택한 공급자/모델 레인에 대해 일회성 프롬프트를 실행합니다.                                                                                                                                 |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                            |
| `qa docker-build-image`                             | 사전 빌드된 QA Docker 이미지를 빌드합니다.                                                                                                                                                   |
| `qa docker-scaffold`                                | QA 대시보드 + Gateway 레인을 위한 docker-compose 스캐폴드를 작성합니다.                                                                                                                      |
| `qa up`                                             | QA 사이트를 빌드하고, Docker 기반 스택을 시작하며, URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다).              |
| `qa aimock`                                         | AIMock 공급자 서버만 시작합니다.                                                                                                                                                             |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` 공급자 서버만 시작합니다.                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex 자격 증명 풀을 관리합니다.                                                                                                                                                       |
| `qa matrix`                                         | 일회용 Tuwunel 홈서버에 대한 라이브 전송 레인입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하세요.                                                                                          |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹에 대한 라이브 전송 레인입니다.                                                                                                                                     |
| `qa discord`                                        | 실제 비공개 Discord 길드 채널에 대한 라이브 전송 레인입니다.                                                                                                                                 |
| `qa slack`                                          | 실제 비공개 Slack 채널에 대한 라이브 전송 레인입니다.                                                                                                                                        |
| `qa mantis`                                         | 라이브 전송 버그를 위한 검증 전후 러너이며, Discord 상태 반응 증거, Crabbox 데스크톱/브라우저 스모크, Slack-in-VNC 스모크를 포함합니다. [Mantis](/ko/concepts/mantis)를 참조하세요.             |

## 운영자 흐름

현재 QA 운영자 흐름은 2개 패널로 구성된 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)입니다.
- 오른쪽: Slack과 유사한 트랜스크립트와 시나리오 계획을 보여 주는 QA Lab입니다.

다음 명령으로 실행합니다.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 Gateway 레인을 시작하며,
운영자 또는 자동화 루프가 에이전트에 QA
미션을 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했는지, 실패했는지, 또는
차단 상태로 남았는지를 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복하려면,
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

로컬 OpenTelemetry 트레이스 스모크를 실행하려면 다음을 실행하세요.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP 트레이스 수신기를 시작하고,
`diagnostics-otel` Plugin을 활성화한 상태로 `otel-trace-smoke` QA 시나리오를 실행한 다음,
내보낸 protobuf span을 디코딩하고 릴리스에 중요한 형태를 검증합니다:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, `openclaw.message.delivery`가 있어야 하며,
성공한 턴에서는 모델 호출이 `StreamAbandoned`를 내보내면 안 되고, 원시 진단 ID와
`openclaw.content.*` 속성은 트레이스에 포함되지 않아야 합니다. 이 스크립트는
QA suite 아티팩트 옆에 `otel-smoke-summary.json`을 작성합니다.

관찰 가능성 QA는 소스 체크아웃 전용으로 유지됩니다. npm tarball은 의도적으로
QA Lab을 제외하므로 패키지 Docker 릴리스 레인에서는 `qa` 명령을 실행하지 않습니다. 진단
계측을 변경할 때는 빌드된 소스 체크아웃에서 `pnpm qa:otel:smoke`를 사용하세요.

전송이 실제인 Matrix 스모크 레인을 실행하려면 다음을 실행하세요.

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, 환경 변수, 아티팩트 레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 간단히 말해, Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고, 임시 드라이버/SUT/관찰자 사용자를 등록하며, 해당 전송 범위로 제한된 하위 QA Gateway 안에서 실제 Matrix Plugin을 실행하고(`qa-channel` 없음), 그런 다음 `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 Markdown 보고서, JSON 요약, 관찰된 이벤트 아티팩트, 통합 출력 로그를 작성합니다.

전송이 실제인 Telegram, Discord, Slack 스모크 레인의 경우:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

이들은 두 봇(드라이버 + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 환경 변수, 시나리오 목록, 출력 아티팩트, Convex 자격 증명 풀은 아래의 [Telegram, Discord 및 Slack QA 참조](#telegram-discord-and-slack-qa-reference)에 문서화되어 있습니다.

VNC 복구가 포함된 전체 Slack 데스크톱 VM 실행의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱/브라우저 머신을 임대하고, VM 안에서 Slack 라이브 레인을
실행하며, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 캡처한 다음,
`slack-qa/`와 `slack-desktop-smoke.png`를 Mantis 아티팩트
디렉터리로 복사합니다. VNC를 통해 Slack Web에 수동으로 로그인한 뒤에는
`--lease-id <cbx_...>`를 재사용하세요. `--gateway-setup`을 사용하면 Mantis는 VM 안에서 포트 `38973`에
영구 OpenClaw Slack
Gateway를 실행 상태로 둡니다. 이 옵션이 없으면 명령은
일반적인 봇 간 Slack QA 레인을 실행하고 아티팩트 캡처 후 종료합니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex 브로커 환경을 확인하고, 엔드포인트 설정을 검증하며, 유지 관리자 시크릿이 있을 때 admin/list 도달 가능성을 확인합니다. 시크릿에 대해서는 설정됨/누락 상태만 보고합니다.

## 라이브 전송 범위

라이브 전송 레인은 각자 고유한 시나리오 목록 형태를 만들지 않고 하나의 계약을 공유합니다. `qa-channel`은 폭넓은 합성 제품 동작 suite이며 라이브 전송 범위 매트릭스의 일부가 아닙니다.

| 레인     | Canary | 멘션 게이팅 | 봇 간 | 허용 목록 차단 | 최상위 답장 | 재시작 재개 | 스레드 후속 응답 | 스레드 격리 | 반응 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | ------ | ----------- | ----- | --------------- | ----------- | ----------- | ---------------- | ----------- | --------- | ----------- | ------------------ |
| Matrix   | x      | x           | x     | x               | x           | x           | x                | x           | x         |             |                    |
| Telegram | x      | x           | x     |                 |             |             |                  |             |           | x           |                    |
| Discord  | x      | x           | x     |                 |             |             |                  |             |           |             | x                  |
| Slack    | x      | x           | x     |                 |             |             |                  |             |           |             |                    |

이는 `qa-channel`을 폭넓은 제품 동작 suite로 유지하면서, Matrix,
Telegram 및 향후 라이브 전송이 하나의 명시적인 전송 계약
체크리스트를 공유하도록 합니다.

QA 경로에 Docker를 포함하지 않는 일회용 Linux VM 레인의 경우 다음을 실행하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

새 Multipass 게스트를 부팅하고, 종속성을 설치하고, 게스트 안에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
호스트의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트와 Multipass 스위트 실행은 기본적으로 격리된 Gateway 워커로 선택된 여러 시나리오를 병렬 실행합니다. `qa-channel`은 기본 동시 실행 수가 4이며, 선택된 시나리오 수로 상한이 제한됩니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행에는 `--concurrency 1`을 사용하세요.
시나리오 하나라도 실패하면 명령은 0이 아닌 값으로 종료됩니다. 실패 종료 코드 없이 아티팩트를 얻고 싶을 때는 `--allow-failures`를 사용하세요.
라이브 실행은 게스트에서 실용적으로 사용할 수 있는 지원 QA 인증 입력을 전달합니다. 여기에는 env 기반 공급자 키, QA 라이브 공급자 구성 경로, 그리고 있을 경우 `CODEX_HOME`이 포함됩니다. 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 `--output-dir`을 리포지토리 루트 아래에 두세요.

## Telegram, Discord, Slack QA 참조

Matrix는 시나리오 수와 Docker 기반 homeserver 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram, Discord, Slack은 각각 몇 개의 시나리오만 있고, 프로필 시스템이 없으며, 기존 실제 채널을 대상으로 하므로 해당 참조는 여기에 있습니다.

### 공유 CLI 플래그

이 레인들은 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 같은 플래그를 받습니다.

| 플래그                                  | 기본값                                                         | 설명                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 이 시나리오만 실행합니다. 반복할 수 있습니다.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 보고서/요약/관찰된 메시지와 출력 로그가 기록되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 중립적인 cwd에서 호출할 때의 리포지토리 루트입니다.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 구성 안의 임시 계정 ID입니다.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 또는 `live-frontier`입니다. 레거시 `live-openai`도 계속 작동합니다.                                                  |
| `--model <ref>` / `--alt-model <ref>` | 공급자 기본값                                                | 기본/대체 모델 참조입니다.                                                                                         |
| `--fast`                              | 꺼짐                                                             | 지원되는 경우 공급자 빠른 모드입니다.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하세요.                                                                |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`                              | `--credential-source convex`일 때 사용되는 역할입니다.                                                                          |

각 레인은 실패한 시나리오가 하나라도 있으면 0이 아닌 값으로 종료됩니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 작성합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

서로 다른 두 봇(드라이버 + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 합니다. 봇 간 관찰은 두 봇 모두 `@BotFather`에서 **봇 간 통신 모드**가 활성화되어 있을 때 가장 잘 작동합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 숫자 채팅 ID(문자열).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

선택 사항:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다(기본값은 마스킹).

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
- `telegram-qa-summary.json` — 카나리부터 답장별 RTT(드라이버 전송 → 관찰된 SUT 답장)를 포함합니다.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`이 아니면 본문이 마스킹됩니다.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 봇이 있는 실제 비공개 Discord 길드 채널 하나를 대상으로 합니다. 하니스가 제어하는 드라이버 봇과 번들 Discord Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 봇입니다. 채널 멘션 처리를 검증하고, SUT 봇이 Discord에 네이티브 `/help` 명령을 등록했는지 확인하며, 옵트인 Mantis 증거 시나리오를 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord가 반환한 SUT 봇 사용자 ID와 일치해야 합니다(그렇지 않으면 레인이 빠르게 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 옵트인 Mantis 시나리오입니다. SUT를 `messages.statusReactions.enabled=true`가 있는 항상 켜짐, 도구 전용 길드 답장으로 전환한 뒤 REST 반응 타임라인과 HTML/PNG 시각적 아티팩트를 캡처하므로 단독으로 실행됩니다.

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
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문이 마스킹됩니다.
- 상태 반응 시나리오가 실행될 때 `discord-qa-reaction-timelines.json` 및 `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

서로 다른 두 봇이 있는 실제 비공개 Slack 채널 하나를 대상으로 합니다. 하니스가 제어하는 드라이버 봇과 번들 Slack Plugin을 통해 자식 OpenClaw Gateway가 시작하는 SUT 봇입니다.

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
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`이 아니면 본문이 마스킹됩니다.

### Convex 자격 증명 풀

Telegram, Discord, Slack 레인은 위 env vars를 읽는 대신 공유 Convex 풀에서 자격 증명을 임대할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요. QA Lab은 독점 임대를 획득하고, 실행 기간 동안 Heartbeat를 보내며, 종료 시 해제합니다. 풀 종류는 `"telegram"`, `"discord"`, `"slack"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형태:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId`는 숫자 채팅 ID 문자열이어야 합니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

운영 env vars와 Convex 브로커 엔드포인트 계약은 [테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다(섹션 이름은 Discord 지원보다 앞서 만들어졌지만, 브로커 의미 체계는 두 종류 모두 동일합니다).

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 범용 마크다운 러너로 유지되어야 합니다. 각 시나리오 마크다운 파일은
하나의 테스트 실행에 대한 진실 공급원이며 다음을 정의해야 합니다.

- 시나리오 메타데이터
- 선택적 범주, 기능, 레인, 위험 메타데이터
- 문서 및 코드 참조
- 선택적 Plugin 요구 사항
- 선택적 Gateway 구성 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은 범용적이고 교차 영역적으로 유지될 수 있습니다. 예를 들어, 마크다운 시나리오는 전송 측 헬퍼와 브라우저 측 헬퍼를 결합하여, 특수 사례 러너를 추가하지 않고도 Gateway `browser.request` 연결부를 통해 내장 Control UI를 구동할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 그룹화해야 합니다. 파일이 이동하더라도 시나리오 ID는 안정적으로 유지하세요. 구현 추적 가능성에는 `docsRefs`와 `codeRefs`를 사용하세요.

기준 목록은 다음을 포함할 수 있을 만큼 넓게 유지해야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 인계
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 공급자 모의 레인

`qa suite`에는 두 개의 로컬 공급자 모의 레인이 있습니다.

- `mock-openai`는 시나리오 인식 OpenClaw 모의입니다. 리포지토리 기반 QA 및 동등성 게이트를 위한 기본 결정론적 모의 레인으로 남습니다.
- `aimock`은 실험적 프로토콜, 픽스처, 기록/재생, 카오스 커버리지를 위해 AIMock 기반 공급자 서버를 시작합니다. 이는 추가적인 것이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

공급자 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 공급자는 자체 기본값, 로컬 서버 시작, Gateway 모델 구성,
인증 프로필 스테이징 요구 사항, 라이브/모의 기능 플래그를 소유합니다. 공유 스위트 및
Gateway 코드는 공급자 이름으로 분기하는 대신 공급자 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 마크다운 QA 시나리오를 위한 범용 전송 연결부를 소유합니다. `qa-channel`은 이 연결부의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다. 향후 실제 또는 합성 채널은 전송별 QA 러너를 추가하는 대신 같은 스위트 러너에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 범용 시나리오 실행, 워커 동시성, 아티팩트 작성, 보고를 소유합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 작업, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 마크다운 시나리오 파일은 테스트 실행을 정의하고, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

마크다운 QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 해당 채널의 전송 어댑터.
2. 채널 계약을 실행하는 시나리오 팩.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있을 때는 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`는 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- suite 시작 및 종료
- worker 동시성
- artifact 작성
- 보고서 생성
- scenario 실행
- 이전 `qa-channel` scenario와의 호환성 alias

러너 Plugin은 전송 계약을 소유합니다.

- `openclaw qa <runner>`가 공유 `qa` 루트 아래에 마운트되는 방식
- 해당 전송을 위해 Gateway가 구성되는 방식
- 준비 상태를 확인하는 방식
- 인바운드 이벤트를 주입하는 방식
- 아웃바운드 메시지를 관찰하는 방식
- transcript와 정규화된 전송 상태를 노출하는 방식
- 전송 기반 action을 실행하는 방식
- 전송별 reset 또는 cleanup을 처리하는 방식

새 채널의 최소 도입 기준은 다음과 같습니다.

1. `qa-lab`를 공유 `qa` 루트의 소유자로 유지합니다.
2. 공유 `qa-lab` 호스트 확장 지점 위에 전송 러너를 구현합니다.
3. 전송별 메커니즘은 러너 Plugin 또는 채널 harness 안에 유지합니다.
4. 경쟁하는 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다. 러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 export해야 합니다. `runtime-api.ts`는 가볍게 유지하세요. lazy CLI와 러너 실행은 별도 entrypoint 뒤에 있어야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 markdown scenario를 작성하거나 조정합니다.
6. 새 scenario에는 generic scenario helper를 사용합니다.
7. repo가 의도적인 migration을 진행하는 경우가 아니라면 기존 호환성 alias가 계속 작동하도록 유지합니다.

판단 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번만 표현할 수 있다면 `qa-lab`에 둡니다.
- 동작이 하나의 채널 전송에 의존한다면 해당 러너 Plugin 또는 Plugin harness에 유지합니다.
- scenario에 둘 이상의 채널이 사용할 수 있는 새 capability가 필요하다면 `suite.ts`에 채널별 branch를 추가하지 말고 generic helper를 추가합니다.
- 동작이 하나의 전송에만 의미가 있다면 scenario를 전송별로 유지하고 scenario 계약에 이를 명시합니다.

### Scenario helper 이름

새 scenario에 선호되는 generic helper:

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

기존 scenario를 위해 호환성 alias인 `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`는 계속 사용할 수 있지만, 새 scenario 작성에는 generic 이름을 사용해야 합니다. 이 alias들은 일괄 migration을 피하기 위해 존재하며, 앞으로의 모델로 삼기 위한 것이 아닙니다.

## 보고

`qa-lab`는 관찰된 bus timeline에서 Markdown protocol 보고서를 export합니다.
보고서는 다음에 답해야 합니다.

- 작동한 것
- 실패한 것
- 계속 차단된 것
- 추가할 가치가 있는 후속 scenario

사용 가능한 scenario의 inventory를 확인하려면, 후속 작업 규모를 산정하거나 새 전송을 연결할 때 유용한 `pnpm openclaw qa coverage`를 실행하세요. machine-readable 출력을 원하면 `--json`을 추가합니다.

문자와 스타일 확인을 위해 여러 live model ref에서 동일한 scenario를 실행하고
판정된 Markdown 보고서를 작성합니다.

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

이 명령은 Docker가 아니라 로컬 QA Gateway child process를 실행합니다. Character eval
scenario는 `SOUL.md`를 통해 persona를 설정한 다음 chat, workspace help, 작은 파일 작업 같은 일반 user turn을 실행해야 합니다. 후보 model에게 평가 중이라는 사실을 알려서는 안 됩니다. 이 명령은 각 전체 transcript를 보존하고 기본 run stats를 기록한 다음, 지원되는 경우 `xhigh` reasoning이 적용된 fast mode로 judge model에 실행 결과를 naturalness, vibe, humor 기준으로 순위를 매기도록 요청합니다.
provider를 비교할 때는 `--blind-judge-models`를 사용하세요. judge prompt는 여전히 모든 transcript와 run status를 받지만, candidate ref는 `candidate-01` 같은 중립 label로 대체되며, 보고서는 parsing 후 순위를 실제 ref에 다시 매핑합니다.
Candidate run은 기본적으로 `high` thinking을 사용하며, GPT-5.5에는 `medium`, 이를 지원하는 이전 OpenAI eval ref에는 `xhigh`를 사용합니다. 특정 candidate를 override하려면 `--model provider/model,thinking=<level>` 형식으로 inline 지정하세요. `--thinking <level>`은 여전히 global fallback을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식은 호환성을 위해 유지됩니다.
OpenAI candidate ref는 provider가 지원하는 경우 priority processing이 사용되도록 기본적으로 fast mode를 사용합니다. 단일 candidate 또는 judge에 override가 필요하면 inline으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가합니다. 모든 candidate model에 fast mode를 강제로 켜려는 경우에만 `--fast`를 전달하세요. Candidate와 judge duration은 benchmark 분석을 위해 보고서에 기록되지만, judge prompt는 속도 기준으로 순위를 매기지 말라고 명시합니다.
Candidate와 judge model run은 모두 기본 concurrency 16을 사용합니다. provider limit 또는 로컬 Gateway pressure 때문에 run이 너무 noisy해지면 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
candidate `--model`이 전달되지 않으면 character eval은
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, 그리고
`google/gemini-3.1-pro-preview`를 기본값으로 사용합니다.
`--judge-model`이 전달되지 않으면 judge는 기본적으로
`openai/gpt-5.5,thinking=xhigh,fast`와
`anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [매트릭스 QA](/ko/concepts/qa-matrix)
- [QA 채널](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
