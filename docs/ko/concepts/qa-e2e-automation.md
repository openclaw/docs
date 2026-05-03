---
read_when:
    - QA 스택이 어떻게 맞물리는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장
    - 리포지토리 기반 QA 시나리오 추가
    - Gateway 대시보드를 중심으로 더 현실성 높은 QA 자동화 구축
summary: 'QA 스택 개요: qa-lab, qa-channel, 저장소 기반 시나리오, 실시간 전송 레인, 전송 어댑터, 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-05-03T21:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적인,
채널 형태의 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 편집, 삭제 표면을 갖춘 합성 메시지 채널.
- `extensions/qa-lab`: 트랜스크립트 관찰,
  인바운드 메시지 주입, Markdown 보고서 내보내기를 위한 디버거 UI와 QA 버스.
- `extensions/qa-matrix`, 향후 러너 Plugin: 하위 QA Gateway 안에서
  실제 채널을 구동하는 라이브 전송 어댑터.
- `qa/`: 시작 작업과 기준 QA
  시나리오를 위한 리포지터리 기반 시드 자산.
- [Mantis](/ko/concepts/mantis): 실제 전송, 브라우저 스크린샷, VM 상태, PR 증거가
  필요한 버그를 위한 라이브 검증 전후 비교.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 많은 명령에 `pnpm qa:*`
스크립트 별칭이 있으며, 두 형식 모두 지원됩니다.

| 명령                                                | 목적                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 번들된 QA 자체 점검입니다. Markdown 보고서를 작성합니다.                                                                                                               |
| `qa suite`                                          | 리포지터리 기반 시나리오를 QA Gateway 레인에 대해 실행합니다. 별칭: 일회용 Linux VM에는 `pnpm openclaw qa suite --runner multipass`를 사용합니다.                      |
| `qa coverage`                                       | Markdown 시나리오 커버리지 인벤토리를 출력합니다(기계 출력에는 `--json`).                                                                                              |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 에이전트형 패리티 보고서를 작성합니다.                                                                                      |
| `qa character-eval`                                 | 판정된 보고서와 함께 여러 라이브 모델에서 캐릭터 QA 시나리오를 실행합니다. [보고](#reporting)를 참조하세요.                                                            |
| `qa manual`                                         | 선택한 공급자/모델 레인에 대해 일회성 프롬프트를 실행합니다.                                                                                                          |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                      |
| `qa docker-build-image`                             | 미리 구운 QA Docker 이미지를 빌드합니다.                                                                                                                              |
| `qa docker-scaffold`                                | QA 대시보드 + Gateway 레인을 위한 docker-compose 스캐폴드를 작성합니다.                                                                                                |
| `qa up`                                             | QA 사이트를 빌드하고, Docker 기반 스택을 시작하고, URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가). |
| `qa aimock`                                         | AIMock 공급자 서버만 시작합니다.                                                                                                                                       |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` 공급자 서버만 시작합니다.                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex 자격 증명 풀을 관리합니다.                                                                                                                                 |
| `qa matrix`                                         | 일회용 Tuwunel 홈서버에 대한 라이브 전송 레인입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하세요.                                                                    |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹에 대한 라이브 전송 레인입니다.                                                                                                               |
| `qa discord`                                        | 실제 비공개 Discord 길드 채널에 대한 라이브 전송 레인입니다.                                                                                                           |
| `qa mantis`                                         | 첫 번째 Discord 상태 반응 시나리오와 함께 라이브 전송 버그의 전후 검증 러너입니다. [Mantis](/ko/concepts/mantis)를 참조하세요.                                           |

## 운영자 흐름

현재 QA 운영자 흐름은 2분할 QA 사이트입니다.

- 왼쪽: 에이전트가 포함된 Gateway 대시보드(Control UI).
- 오른쪽: Slack 스타일 트랜스크립트와 시나리오 계획을 보여 주는 QA Lab.

다음으로 실행합니다.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 Gateway 레인을 시작하며,
운영자 또는 자동화 루프가 에이전트에 QA
임무를 부여하고, 실제 채널 동작을 관찰하고, 성공한 내용, 실패한 내용,
또는 차단 상태로 남은 내용을 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복하려면,
바인드 마운트된 QA Lab 번들로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 미리 빌드된 이미지에서 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는
변경 시 해당 번들을 다시 빌드하며, QA Lab
자산 해시가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

로컬 OpenTelemetry 추적 스모크에는 다음을 실행하세요.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP 추적 수신기를 시작하고,
`diagnostics-otel` Plugin을 활성화한 상태로 `otel-trace-smoke` QA 시나리오를 실행한 다음,
내보낸 protobuf span을 디코드하고 릴리스에 중요한 형태를 검증합니다.
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, `openclaw.message.delivery`가 반드시 있어야 하며,
성공한 턴에서 모델 호출은 `StreamAbandoned`를 내보내면 안 되고, 원시 진단 ID와
`openclaw.content.*` 속성은 추적에 포함되지 않아야 합니다. 이 스크립트는
QA suite 아티팩트 옆에 `otel-smoke-summary.json`을 작성합니다.

Observability QA는 소스 체크아웃에서만 유지됩니다. npm tarball은 의도적으로
QA Lab을 제외하므로 패키지 Docker 릴리스 레인은 `qa` 명령을 실행하지 않습니다.
진단 계측을 변경할 때는 빌드된 소스 체크아웃에서
`pnpm qa:otel:smoke`를 사용하세요.

전송이 실제인 Matrix 스모크 레인에는 다음을 실행하세요.

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, env vars, 아티팩트 레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 한눈에 보면, Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고, 임시 드라이버/SUT/관찰자 사용자를 등록하고, 해당 전송으로 범위가 제한된 하위 QA Gateway 안에서 실제 Matrix Plugin을 실행하며(`qa-channel` 없음), 그런 다음 Markdown 보고서, JSON 요약, 관찰된 이벤트 아티팩트, 결합 출력 로그를 `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 작성합니다.

전송이 실제인 Telegram 및 Discord 스모크 레인:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

둘 다 두 봇(드라이버 + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 env vars, 시나리오 목록, 출력 아티팩트, Convex 자격 증명 풀은 아래 [Telegram 및 Discord QA 참조](#telegram-and-discord-qa-reference)에 문서화되어 있습니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex 브로커 env를 확인하고, 엔드포인트 설정을 검증하며, 유지관리자 secret이 있을 때 admin/list 도달 가능성을 확인합니다. secret에 대해서는 설정됨/누락 상태만 보고합니다.

## 라이브 전송 커버리지

라이브 전송 레인은 각자 고유한 시나리오 목록 형태를 발명하는 대신 하나의 계약을 공유합니다. `qa-channel`은 넓은 합성 제품 동작 suite이며 라이브 전송 커버리지 매트릭스의 일부가 아닙니다.

| 레인     | 카나리아 | 멘션 게이팅 | 봇 간 | 허용 목록 차단 | 최상위 응답 | 재시작 재개 | 스레드 후속 응답 | 스레드 격리 | 반응 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | -------- | ----------- | ----- | -------------- | ----------- | ----------- | ---------------- | ----------- | --------- | ----------- | ------------------ |
| Matrix   | x        | x           | x     | x              | x           | x           | x                | x           | x         |             |                    |
| Telegram | x        | x           | x     |                |             |             |                  |             |           | x           |                    |
| Discord  | x        | x           | x     |                |             |             |                  |             |           |             | x                  |

이를 통해 `qa-channel`은 넓은 제품 동작 suite로 유지하면서 Matrix,
Telegram, 그리고 향후 라이브 전송이 하나의 명시적 전송 계약
체크리스트를 공유하게 됩니다.

Docker를 QA 경로에 들이지 않는 일회용 Linux VM 레인에는 다음을 실행하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass 게스트를 부팅하고, 종속성을 설치하고, 게스트 안에서 OpenClaw를
빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와
요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
호스트에서 `qa suite`를 실행할 때와 동일한 시나리오 선택 동작을 재사용합니다.
호스트와 Multipass suite 실행은 기본적으로 격리된 Gateway 워커로
선택된 여러 시나리오를 병렬 실행합니다. `qa-channel`의 기본 동시성은
4이며, 선택된 시나리오 수로 제한됩니다. 워커 수를 조정하려면
`--concurrency <count>`를 사용하거나, 직렬 실행에는 `--concurrency 1`을 사용하세요.
시나리오가 하나라도 실패하면 명령은 0이 아닌 코드로 종료됩니다. 실패 종료 코드 없이
아티팩트를 원할 때는 `--allow-failures`를 사용하세요.
라이브 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다.
env 기반 공급자 키, QA 라이브 공급자 구성 경로, 그리고
있을 경우 `CODEX_HOME`입니다. 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록
`--output-dir`를 리포지터리 루트 아래에 유지하세요.

## Telegram 및 Discord QA 참조

Matrix는 시나리오 수와 Docker 기반 홈서버 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram과 Discord는 더 작습니다. 각각 몇 개의 시나리오만 있고, 프로필 시스템이 없으며, 기존 실제 채널을 대상으로 하므로 참조는 여기에 있습니다.

### 공유 CLI 플래그

두 레인은 모두 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 동일한 플래그를 허용합니다.

| 플래그                                  | 기본값                                                   | 설명                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | 이 시나리오만 실행합니다. 반복 지정할 수 있습니다.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | 보고서/요약/관찰된 메시지와 출력 로그가 작성되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다. |
| `--repo-root <path>`                  | `process.cwd()`                                           | 중립적인 cwd에서 호출할 때의 저장소 루트입니다.                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | QA gateway 구성 내부의 임시 계정 id입니다.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` 또는 `live-frontier`입니다. 레거시 `live-openai`도 여전히 동작합니다.                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider default                                          | 기본/대체 모델 ref입니다.                                                                                         |
| `--fast`                              | 꺼짐                                                       | 지원되는 경우 Provider 빠른 모드입니다.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | [Convex 자격 증명 풀](#convex-credential-pool)을 참고하세요.                                                                |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`                        | `--credential-source convex`일 때 사용되는 역할입니다.                                                                          |

어떤 시나리오라도 실패하면 둘 다 0이 아닌 코드로 종료됩니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 작성합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

서로 다른 두 bot(driver + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT bot에는 Telegram 사용자 이름이 있어야 합니다. 두 bot 모두 `@BotFather`에서 **Bot-to-Bot Communication Mode**가 활성화되어 있을 때 bot 간 관찰이 가장 잘 동작합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 숫자 chat id(문자열).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

선택 사항:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다(기본값은 삭제).

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
- `telegram-qa-summary.json` — canary부터 시작해 reply별 RTT(driver 전송 → 관찰된 SUT reply)를 포함합니다.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`이 아니면 본문이 삭제됩니다.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 bot이 있는 실제 비공개 Discord guild channel 하나를 대상으로 합니다. 하나는 하네스가 제어하는 driver bot이고, 다른 하나는 번들된 Discord Plugin을 통해 자식 OpenClaw gateway가 시작하는 SUT bot입니다. channel mention 처리, SUT bot이 Discord에 네이티브 `/help` 명령을 등록했는지, opt-in Mantis 증거 시나리오를 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord가 반환한 SUT bot user id와 일치해야 합니다(그렇지 않으면 lane이 빠르게 실패합니다).

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis 시나리오입니다. SUT를 `messages.statusReactions.enabled=true`가 설정된 always-on, tool-only guild reply로 전환한 뒤 REST reaction timeline과 HTML/PNG 시각 아티팩트를 캡처하기 때문에 단독으로 실행됩니다.

Mantis status-reaction 시나리오를 명시적으로 실행합니다.

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
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문이 삭제됩니다.
- status-reaction 시나리오가 실행될 때 `discord-qa-reaction-timelines.json` 및 `discord-status-reactions-tool-only-timeline.png`.

### Convex 자격 증명 풀

Telegram 및 Discord lane은 위 env var를 읽는 대신 공유 Convex 풀에서 자격 증명을 임대할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요. QA Lab은 배타적 임대를 획득하고, 실행 동안 Heartbeat를 보내며, 종료 시 임대를 해제합니다. 풀 종류는 `"telegram"` 및 `"discord"`입니다.

브로커가 `admin/add`에서 검증하는 Payload 형태:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId`는 숫자 chat-id 문자열이어야 합니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

운영 env var와 Convex 브로커 endpoint 계약은 [테스트 → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다(섹션 이름은 Discord 지원보다 앞서 만들어졌지만, 브로커 의미 체계는 두 종류 모두 동일합니다).

## 저장소 기반 seed

Seed asset은 `qa/`에 있습니다.

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이 항목들은 QA 계획이 사람과 agent 모두에게 보이도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 generic markdown runner로 유지되어야 합니다. 각 scenario markdown 파일은
하나의 테스트 실행에 대한 source of truth이며 다음을 정의해야 합니다.

- 시나리오 메타데이터
- 선택적 category, capability, lane 및 risk 메타데이터
- docs 및 code refs
- 선택적 Plugin 요구 사항
- 선택적 gateway config patch
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 runtime surface는 generic 및 cross-cutting으로
유지될 수 있습니다. 예를 들어, markdown 시나리오는 특별한 case runner를 추가하지 않고도
Gateway `browser.request` seam을 통해 임베드된 Control UI를 구동하는 browser-side helper와
transport-side helper를 조합할 수 있습니다.

시나리오 파일은 source tree 폴더가 아니라 제품 capability별로 그룹화해야 합니다.
파일이 이동하더라도 시나리오 ID는 안정적으로 유지하세요. 구현 추적성에는 `docsRefs` 및 `codeRefs`를 사용하세요.

baseline 목록은 다음을 다룰 수 있을 만큼 넓게 유지해야 합니다.

- DM 및 channel chat
- thread behavior
- message action lifecycle
- cron callbacks
- memory recall
- model switching
- subagent handoff
- repo-reading 및 docs-reading
- Lobster Invaders 같은 작은 build task 하나

## Provider mock lanes

`qa suite`에는 두 개의 local provider mock lane이 있습니다.

- `mock-openai`는 시나리오 인식 OpenClaw mock입니다. 저장소 기반 QA 및 parity gate를 위한
  기본 deterministic mock lane으로 유지됩니다.
- `aimock`은 experimental protocol, fixture, record/replay 및 chaos coverage를 위해
  AIMock 기반 provider server를 시작합니다. 이는 additive이며 `mock-openai` 시나리오 dispatcher를
  대체하지 않습니다.

Provider-lane 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 provider는 자체 기본값, local server startup, gateway model config,
auth-profile staging 요구 사항, live/mock capability flag를 소유합니다. Shared suite 및
gateway code는 provider name으로 분기하는 대신 provider registry를 통해 route해야 합니다.

## Transport adapter

`qa-lab`은 markdown QA 시나리오를 위한 generic transport seam을 소유합니다. `qa-channel`은 해당 seam의 첫 번째 adapter이지만, 설계 목표는 더 넓습니다. 향후 실제 또는 synthetic channel은 transport-specific QA runner를 추가하는 대신 동일한 suite runner에 연결되어야 합니다.

architecture 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 generic scenario execution, worker concurrency, artifact writing 및 reporting을 소유합니다.
- transport adapter는 gateway config, readiness, inbound 및 outbound observation, transport actions, normalized transport state를 소유합니다.
- `qa/scenarios/` 아래의 markdown scenario file은 테스트 실행을 정의하고, `qa-lab`은 이를 실행하는 재사용 가능한 runtime surface를 제공합니다.

### Channel 추가

markdown QA system에 channel을 추가하려면 정확히 두 가지가 필요합니다.

1. channel용 transport adapter.
2. channel contract를 실행하는 scenario pack.

공유 `qa-lab` host가 flow를 소유할 수 있을 때 새 top-level QA command root를 추가하지 마세요.

`qa-lab`은 공유 host mechanics를 소유합니다.

- `openclaw qa` command root
- suite startup 및 teardown
- worker concurrency
- artifact writing
- report generation
- scenario execution
- 이전 `qa-channel` 시나리오를 위한 compatibility alias

Runner Plugin은 transport contract를 소유합니다.

- 공유 `qa` root 아래에 `openclaw qa <runner>`가 mount되는 방식
- 해당 transport용 gateway가 구성되는 방식
- readiness가 확인되는 방식
- inbound event가 inject되는 방식
- outbound message가 관찰되는 방식
- transcript 및 normalized transport state가 노출되는 방식
- transport-backed action이 실행되는 방식
- transport-specific reset 또는 cleanup이 처리되는 방식

새 channel의 최소 adoption 기준:

1. 공유 `qa` root의 소유자로 `qa-lab`을 유지합니다.
2. 공유 `qa-lab` host seam에서 transport runner를 구현합니다.
3. transport-specific mechanics는 runner Plugin 또는 channel harness 내부에 유지합니다.
4. 경쟁 root command를 등록하는 대신 runner를 `openclaw qa <runner>`로 mount합니다. Runner Plugin은 `openclaw.plugin.json`에서 `qaRunners`를 선언하고, `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` array를 export해야 합니다. `runtime-api.ts`는 가볍게 유지하세요. lazy CLI 및 runner execution은 별도 entrypoint 뒤에 있어야 합니다.
5. 테마별 `qa/scenarios/` directory 아래에서 markdown scenario를 작성하거나 조정합니다.
6. 새 시나리오에는 generic scenario helper를 사용합니다.
7. 저장소가 의도적 migration을 수행하는 경우가 아니라면 기존 compatibility alias가 계속 동작하도록 유지합니다.

결정 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번 표현할 수 있으면 `qa-lab`에 넣으세요.
- 동작이 하나의 channel transport에 의존하면 해당 runner Plugin 또는 Plugin harness에 유지하세요.
- 시나리오에 여러 channel이 사용할 수 있는 새 capability가 필요하면 `suite.ts`에 channel-specific branch를 추가하는 대신 generic helper를 추가하세요.
- 동작이 하나의 transport에만 의미가 있다면 시나리오를 transport-specific으로 유지하고 scenario contract에서 이를 명시하세요.

### Scenario helper name

새 시나리오에 권장되는 generic helper:

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

기존 시나리오를 위해 호환성 별칭인 `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`는 계속 사용할 수 있지만, 새 시나리오 작성에는 일반 이름을 사용해야 합니다. 별칭은 앞으로의 모델이 아니라 일괄 마이그레이션을 피하기 위해 존재합니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음에 답해야 합니다.

- 작동한 것
- 실패한 것
- 차단된 상태로 남은 것
- 추가할 가치가 있는 후속 시나리오

사용 가능한 시나리오 목록은 후속 작업 규모를 산정하거나 새 전송 방식을 연결할 때 유용하며, 확인하려면 `pnpm openclaw qa coverage`를 실행하세요(기계가 읽을 수 있는 출력을 원하면 `--json` 추가).

문자와 스타일 검사를 위해, 동일한 시나리오를 여러 라이브 모델
참조에서 실행하고 평가된 Markdown 보고서를 작성하세요.

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

이 명령은 Docker가 아니라 로컬 QA Gateway 자식 프로세스를 실행합니다. 문자 평가
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음 채팅, 작업공간 도움말, 작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는 평가 중이라는 사실을 알려서는 안 됩니다. 이 명령은 각 전체
트랜스크립트를 보존하고 기본 실행 통계를 기록한 다음, 지원되는 경우 `xhigh` 추론과 빠른 모드로 judge 모델에 실행 결과의 자연스러움, 분위기, 유머를 기준으로 순위를 매기도록 요청합니다.
제공자를 비교할 때는 `--blind-judge-models`를 사용하세요. judge 프롬프트는 여전히 모든 트랜스크립트와 실행 상태를 받지만, 후보 참조는 `candidate-01` 같은 중립 레이블로 대체됩니다. 보고서는 파싱 후 순위를 실제 참조에 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, GPT-5.5에는 `medium`, 이를 지원하는 이전 OpenAI 평가 참조에는 `xhigh`를 사용합니다. 특정 후보를 인라인으로 재정의하려면
`--model provider/model,thinking=<level>`을 사용하세요. `--thinking <level>`은 여전히 전역 폴백을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식은 호환성을 위해 유지됩니다.
OpenAI 후보 참조는 기본적으로 빠른 모드를 사용하므로 제공자가 지원하는 경우 우선 처리가 사용됩니다. 단일 후보나 judge에 재정의가 필요하면 인라인으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요. 모든 후보 모델에 빠른 모드를 강제로 켜려는 경우에만 `--fast`를 전달하세요. 후보와 judge의 소요 시간은 벤치마크 분석을 위해 보고서에 기록되지만, judge 프롬프트는 속도로 순위를 매기지 말라고 명시합니다.
후보와 judge 모델 실행은 모두 기본 동시성 16을 사용합니다. 제공자 제한이나 로컬 Gateway
부하로 인해 실행에 잡음이 너무 많아지면 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 문자 평가는 기본적으로
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, 그리고
`google/gemini-3.1-pro-preview`를 사용합니다.
`--judge-model`이 전달되지 않으면 judge는 기본적으로
`openai/gpt-5.5,thinking=xhigh,fast`와
`anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [Matrix QA](/ko/concepts/qa-matrix)
- [QA 채널](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
