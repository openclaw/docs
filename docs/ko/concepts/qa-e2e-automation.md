---
read_when:
    - QA 스택이 어떻게 맞물려 작동하는지 이해하기
    - qa-lab, qa-channel 또는 전송 어댑터 확장
    - 저장소 기반 QA 시나리오 추가
    - Gateway 대시보드를 중심으로 더 높은 현실성의 QA 자동화 구축
summary: 'QA 스택 개요: qa-lab, qa-channel, 저장소 기반 시나리오, 라이브 전송 레인, 전송 어댑터 및 보고.'
title: QA 개요
x-i18n:
    generated_at: "2026-04-30T06:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고 채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드, 반응, 편집, 삭제 표면을 갖춘 합성 메시지 채널입니다.
- `extensions/qa-lab`: 대화 기록을 관찰하고, 인바운드 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스입니다.
- `extensions/qa-matrix`, 향후 runner Plugin: 하위 QA Gateway 안에서 실제 채널을 구동하는 라이브 전송 어댑터입니다.
- `qa/`: 시작 작업과 기준 QA 시나리오를 위한 저장소 기반 시드 자산입니다.

## 명령 표면

모든 QA 흐름은 `pnpm openclaw qa <subcommand>` 아래에서 실행됩니다. 다수는 `pnpm qa:*` 스크립트 별칭을 갖고 있으며, 두 형식 모두 지원됩니다.

| 명령                                                | 목적                                                                                                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 번들된 QA 자체 점검이며, Markdown 보고서를 작성합니다.                                                                                                                           |
| `qa suite`                                          | QA Gateway 레인에 대해 저장소 기반 시나리오를 실행합니다. 별칭: 폐기 가능한 Linux VM에서는 `pnpm openclaw qa suite --runner multipass`를 사용합니다.                              |
| `qa coverage`                                       | Markdown 시나리오 커버리지 인벤토리를 출력합니다(기계 출력에는 `--json`).                                                                                                        |
| `qa parity-report`                                  | 두 `qa-suite-summary.json` 파일을 비교하고 에이전트형 패리티 게이트 보고서를 작성합니다.                                                                                         |
| `qa character-eval`                                 | 판정된 보고서와 함께 여러 라이브 모델에서 캐릭터 QA 시나리오를 실행합니다. [보고](#reporting)를 참조하세요.                                                                      |
| `qa manual`                                         | 선택한 제공자/모델 레인에 대해 일회성 프롬프트를 실행합니다.                                                                                                                     |
| `qa ui`                                             | QA 디버거 UI와 로컬 QA 버스를 시작합니다(별칭: `pnpm qa:lab:ui`).                                                                                                                |
| `qa docker-build-image`                             | 사전 구성된 QA Docker 이미지를 빌드합니다.                                                                                                                                       |
| `qa docker-scaffold`                                | QA 대시보드 + Gateway 레인을 위한 docker-compose 스캐폴드를 작성합니다.                                                                                                          |
| `qa up`                                             | QA 사이트를 빌드하고, Docker 기반 스택을 시작하며, URL을 출력합니다(별칭: `pnpm qa:lab:up`; `:fast` 변형은 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`를 추가합니다). |
| `qa aimock`                                         | AIMock 제공자 서버만 시작합니다.                                                                                                                                                 |
| `qa mock-openai`                                    | 시나리오 인식 `mock-openai` 제공자 서버만 시작합니다.                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 공유 Convex 자격 증명 풀을 관리합니다.                                                                                                                                           |
| `qa matrix`                                         | 폐기 가능한 Tuwunel 홈서버에 대한 라이브 전송 레인입니다. [Matrix QA](/ko/concepts/qa-matrix)를 참조하세요.                                                                         |
| `qa telegram`                                       | 실제 비공개 Telegram 그룹에 대한 라이브 전송 레인입니다.                                                                                                                         |
| `qa discord`                                        | 실제 비공개 Discord 길드 채널에 대한 라이브 전송 레인입니다.                                                                                                                     |

## 운영자 흐름

현재 QA 운영자 흐름은 2분할 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI).
- 오른쪽: Slack 스타일 대화 기록과 시나리오 계획을 보여주는 QA Lab.

다음으로 실행합니다.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 Gateway 레인을 시작하며, 운영자나 자동화 루프가 에이전트에 QA 임무를 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했는지, 실패했는지, 또는 계속 차단되었는지를 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 QA Lab UI를 더 빠르게 반복하려면, 바인드 마운트된 QA Lab 번들로 스택을 시작합니다.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지로 유지하고 `extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 변경되면 브라우저가 자동으로 다시 로드됩니다.

로컬 OpenTelemetry 트레이스 스모크를 실행하려면 다음을 실행합니다.

```bash
pnpm qa:otel:smoke
```

이 스크립트는 로컬 OTLP/HTTP 트레이스 수신기를 시작하고, `diagnostics-otel` Plugin을 활성화한 상태로 `otel-trace-smoke` QA 시나리오를 실행한 다음, 내보낸 protobuf span을 디코딩하고 릴리스에 중요한 형태를 검증합니다. `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`, `openclaw.context.assembled`, `openclaw.message.delivery`가 반드시 있어야 하며, 성공한 턴의 모델 호출은 `StreamAbandoned`를 내보내면 안 되고, 원시 진단 ID와 `openclaw.content.*` 속성은 트레이스에 포함되면 안 됩니다. 이 스크립트는 QA suite 아티팩트 옆에 `otel-smoke-summary.json`을 작성합니다.

관찰 가능성 QA는 소스 체크아웃 전용으로 유지됩니다. npm tarball은 의도적으로 QA Lab을 제외하므로, 패키지 Docker 릴리스 레인은 `qa` 명령을 실행하지 않습니다. 진단 계측을 변경할 때는 빌드된 소스 체크아웃에서 `pnpm qa:otel:smoke`를 사용하세요.

전송이 실제인 Matrix 스모크 레인의 경우 다음을 실행합니다.

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

이 레인의 전체 CLI 참조, 프로필/시나리오 카탈로그, env var, 아티팩트 레이아웃은 [Matrix QA](/ko/concepts/qa-matrix)에 있습니다. 한눈에 보면, Docker에서 폐기 가능한 Tuwunel 홈서버를 프로비저닝하고, 임시 driver/SUT/observer 사용자를 등록하며, 해당 전송으로 범위가 제한된 하위 QA Gateway 안에서 실제 Matrix Plugin을 실행하고(`qa-channel` 없음), 그런 다음 `.artifacts/qa-e2e/matrix-<timestamp>/` 아래에 Markdown 보고서, JSON 요약, 관찰된 이벤트 아티팩트, 결합 출력 로그를 작성합니다.

전송이 실제인 Telegram 및 Discord 스모크 레인의 경우:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

둘 다 두 개의 봇(driver + SUT)이 있는 기존 실제 채널을 대상으로 합니다. 필수 env var, 시나리오 목록, 출력 아티팩트, Convex 자격 증명 풀은 아래 [Telegram 및 Discord QA 참조](#telegram-and-discord-qa-reference)에 문서화되어 있습니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행합니다.

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex 브로커 env를 확인하고, 엔드포인트 설정을 검증하며, 메인테이너 비밀이 있을 때 admin/list 도달 가능성을 확인합니다. 비밀에 대해서는 설정됨/누락됨 상태만 보고합니다.

## 라이브 전송 커버리지

라이브 전송 레인은 각자 고유한 시나리오 목록 형태를 새로 만들지 않고 하나의 계약을 공유합니다. `qa-channel`은 광범위한 합성 제품 동작 suite이며 라이브 전송 커버리지 매트릭스의 일부가 아닙니다.

| 레인     | Canary | 멘션 게이팅 | 봇 간 | 허용 목록 차단 | 최상위 답장 | 재시작 재개 | 스레드 후속 조치 | 스레드 격리 | 반응 관찰 | 도움말 명령 | 네이티브 명령 등록 |
| -------- | ------ | ----------- | ----- | -------------- | ----------- | ----------- | ---------------- | ----------- | --------- | ----------- | ------------------ |
| Matrix   | x      | x           | x     | x              | x           | x           | x                | x           | x         |             |                    |
| Telegram | x      | x           | x     |                |             |             |                  |             |           | x           |                    |
| Discord  | x      | x           | x     |                |             |             |                  |             |           |             | x                  |

이렇게 하면 `qa-channel`은 광범위한 제품 동작 suite로 유지되며, Matrix, Telegram 및 향후 라이브 전송은 하나의 명시적인 전송 계약 체크리스트를 공유합니다.

Docker를 QA 경로에 포함하지 않고 폐기 가능한 Linux VM 레인을 실행하려면 다음을 실행합니다.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass 게스트를 부팅하고, 의존성을 설치하며, 게스트 안에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
호스트의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트 및 Multipass suite 실행은 기본적으로 격리된 Gateway worker를 사용하여 선택된 여러 시나리오를 병렬로 실행합니다. `qa-channel`은 기본 동시성이 4이며, 선택된 시나리오 수로 제한됩니다. worker 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행에는 `--concurrency 1`을 사용하세요.
어떤 시나리오라도 실패하면 명령은 0이 아닌 값으로 종료됩니다. 실패 종료 코드 없이 아티팩트가 필요할 때는 `--allow-failures`를 사용하세요.
라이브 실행은 게스트에 실용적인 지원 QA 인증 입력을 전달합니다. env 기반 제공자 키, QA 라이브 제공자 config 경로, 그리고 존재하는 경우 `CODEX_HOME`입니다. 게스트가 마운트된 작업공간을 통해 다시 쓸 수 있도록 `--output-dir`는 저장소 루트 아래에 두세요.

## Telegram 및 Discord QA 참조

Matrix는 시나리오 수와 Docker 기반 홈서버 프로비저닝 때문에 [전용 페이지](/ko/concepts/qa-matrix)가 있습니다. Telegram과 Discord는 더 작습니다. 각각 몇 가지 시나리오만 있고, 프로필 시스템이 없으며, 기존 실제 채널을 대상으로 하므로 해당 참조는 여기에 있습니다.

### 공유 CLI 플래그

두 레인 모두 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`를 통해 등록되며 동일한 플래그를 받습니다:

| 플래그                                | 기본값                                                    | 설명                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | 이 시나리오만 실행합니다. 반복 지정할 수 있습니다.                                                                    |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | 보고서/요약/관찰된 메시지와 출력 로그가 기록되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다.        |
| `--repo-root <path>`                  | `process.cwd()`                                           | 중립적인 cwd에서 호출할 때의 저장소 루트입니다.                                                                      |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 설정 내부의 임시 계정 ID입니다.                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` 또는 `live-frontier`입니다. 기존 `live-openai`도 계속 작동합니다.                                      |
| `--model <ref>` / `--alt-model <ref>` | 공급자 기본값                                             | 기본/대체 모델 참조입니다.                                                                                           |
| `--fast`                              | 꺼짐                                                      | 지원되는 경우 공급자 빠른 모드입니다.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                     | [Convex 자격 증명 풀](#convex-credential-pool)을 참조하세요.                                                        |
| `--credential-role <maintainer\|ci>`  | CI에서는 `ci`, 그 외에는 `maintainer`                     | `--credential-source convex`일 때 사용되는 역할입니다.                                                               |

시나리오가 하나라도 실패하면 둘 다 0이 아닌 코드로 종료합니다. `--allow-failures`는 실패 종료 코드를 설정하지 않고 아티팩트를 기록합니다.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

두 개의 서로 다른 봇(driver + SUT)이 있는 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 합니다. 봇 간 관찰은 두 봇 모두 `@BotFather`에서 **봇 간 통신 모드**를 활성화했을 때 가장 잘 작동합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 숫자 채팅 ID(문자열).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

선택 사항:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다. 기본값은 수정 처리입니다.

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
- `telegram-qa-summary.json` — 카나리아부터 시작하여 답장별 RTT(driver 전송 → 관찰된 SUT 답장)를 포함합니다.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`이 아니면 본문이 수정 처리됩니다.

### Discord QA

```bash
pnpm openclaw qa discord
```

두 봇이 있는 실제 비공개 Discord 길드 채널 하나를 대상으로 합니다. 하나는 하네스가 제어하는 driver 봇이고, 다른 하나는 번들된 Discord Plugin을 통해 하위 OpenClaw Gateway가 시작하는 SUT 봇입니다. 채널 멘션 처리와 SUT 봇이 Discord에 네이티브 `/help` 명령을 등록했는지 검증합니다.

`--credential-source env`일 때 필요한 env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord가 반환한 SUT 봇 사용자 ID와 일치해야 합니다. 그렇지 않으면 해당 레인이 빠르게 실패합니다.

선택 사항:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`은 관찰된 메시지 아티팩트에 메시지 본문을 유지합니다.

시나리오(`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

출력 아티팩트:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`이 아니면 본문이 수정 처리됩니다.

### Convex 자격 증명 풀

Telegram 및 Discord 레인은 위 env vars를 읽는 대신 공유 Convex 풀에서 자격 증명을 임대할 수 있습니다. `--credential-source convex`를 전달하거나 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`를 설정하세요. QA Lab은 배타적 임대를 획득하고, 실행 중에는 Heartbeat를 보내며, 종료 시 해제합니다. 풀 종류는 `"telegram"` 및 `"discord"`입니다.

브로커가 `admin/add`에서 검증하는 페이로드 형식:

- Telegram(`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId`는 숫자 채팅 ID 문자열이어야 합니다.
- Discord(`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

운영 env vars 및 Convex 브로커 엔드포인트 계약은 [Testing → Convex를 통한 공유 Telegram 자격 증명](/ko/help/testing#shared-telegram-credentials-via-convex-v1)에 있습니다. 섹션 이름은 Discord 지원보다 먼저 만들어졌지만, 브로커 의미 체계는 두 종류에서 동일합니다.

## 저장소 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이들은 QA 계획을 사람과 에이전트 모두가 볼 수 있도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 범용 Markdown 러너로 유지되어야 합니다. 각 시나리오 Markdown 파일은 하나의 테스트 실행에 대한 진실의 원천이어야 하며 다음을 정의해야 합니다.

- 시나리오 메타데이터
- 선택적 카테고리, 기능, 레인, 위험 메타데이터
- 문서 및 코드 참조
- 선택적 Plugin 요구 사항
- 선택적 Gateway 설정 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은 범용적이고 교차 기능적으로 유지될 수 있습니다. 예를 들어 Markdown 시나리오는 전송 측 헬퍼와 브라우저 측 헬퍼를 조합하여, 특수 사례 러너를 추가하지 않고도 Gateway `browser.request` 심을 통해 내장 Control UI를 구동할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 그룹화해야 합니다. 파일이 이동해도 시나리오 ID는 안정적으로 유지하세요. 구현 추적성에는 `docsRefs` 및 `codeRefs`를 사용하세요.

기준 목록은 다음을 포괄할 만큼 충분히 넓게 유지해야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 인계
- 저장소 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 공급자 mock 레인

`qa suite`에는 두 개의 로컬 공급자 mock 레인이 있습니다.

- `mock-openai`는 시나리오 인식 OpenClaw mock입니다. 저장소 기반 QA 및 패리티 게이트의 기본 결정론적 mock 레인으로 유지됩니다.
- `aimock`은 실험적 프로토콜, 픽스처, 기록/재생, 카오스 커버리지를 위해 AIMock 기반 공급자 서버를 시작합니다. 이는 추가 기능이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

공급자 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다. 각 공급자는 자체 기본값, 로컬 서버 시작, Gateway 모델 설정, auth-profile 스테이징 요구 사항, live/mock 기능 플래그를 소유합니다. 공유 suite 및 Gateway 코드는 공급자 이름으로 분기하지 말고 공급자 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 Markdown QA 시나리오를 위한 범용 전송 심을 소유합니다. `qa-channel`은 해당 심의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다. 향후 실제 또는 합성 채널은 전송별 QA 러너를 추가하는 대신 동일한 suite 러너에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 범용 시나리오 실행, 워커 동시성, 아티팩트 기록, 보고를 소유합니다.
- 전송 어댑터는 Gateway 설정, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 작업, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 Markdown 시나리오 파일은 테스트 실행을 정의하고, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

### 채널 추가

Markdown QA 시스템에 채널을 추가하려면 정확히 두 가지가 필요합니다.

1. 채널용 전송 어댑터.
2. 채널 계약을 실행하는 시나리오 팩.

공유 `qa-lab` 호스트가 흐름을 소유할 수 있을 때는 새 최상위 QA 명령 루트를 추가하지 마세요.

`qa-lab`은 공유 호스트 메커니즘을 소유합니다.

- `openclaw qa` 명령 루트
- suite 시작 및 종료
- 워커 동시성
- 아티팩트 기록
- 보고서 생성
- 시나리오 실행
- 이전 `qa-channel` 시나리오에 대한 호환성 별칭

러너 Plugin은 전송 계약을 소유합니다.

- `openclaw qa <runner>`가 공유 `qa` 루트 아래에 마운트되는 방식
- 해당 전송용 Gateway가 설정되는 방식
- 준비 상태를 확인하는 방식
- 인바운드 이벤트를 주입하는 방식
- 아웃바운드 메시지를 관찰하는 방식
- 대화 기록 및 정규화된 전송 상태를 노출하는 방식
- 전송 기반 작업을 실행하는 방식
- 전송별 재설정 또는 정리가 처리되는 방식

새 채널의 최소 채택 기준:

1. `qa-lab`을 공유 `qa` 루트의 소유자로 유지합니다.
2. 공유 `qa-lab` 호스트 심에서 전송 러너를 구현합니다.
3. 전송별 메커니즘은 러너 Plugin 또는 채널 하네스 내부에 유지합니다.
4. 경쟁 루트 명령을 등록하는 대신 러너를 `openclaw qa <runner>`로 마운트합니다. 러너 Plugin은 `openclaw.plugin.json`에 `qaRunners`를 선언하고 `runtime-api.ts`에서 일치하는 `qaRunnerCliRegistrations` 배열을 내보내야 합니다. `runtime-api.ts`는 가볍게 유지하세요. 지연 CLI 및 러너 실행은 별도 진입점 뒤에 있어야 합니다.
5. 테마별 `qa/scenarios/` 디렉터리 아래에 Markdown 시나리오를 작성하거나 맞게 조정합니다.
6. 새 시나리오에는 범용 시나리오 헬퍼를 사용합니다.
7. 저장소가 의도적인 마이그레이션을 수행하는 경우가 아니라면 기존 호환성 별칭이 계속 작동하도록 유지합니다.

결정 규칙은 엄격합니다.

- 동작을 `qa-lab`에서 한 번 표현할 수 있으면 `qa-lab`에 넣습니다.
- 동작이 하나의 채널 전송에 의존하면 해당 러너 Plugin 또는 Plugin 하네스에 유지합니다.
- 시나리오에 둘 이상의 채널이 사용할 수 있는 새 기능이 필요하면 `suite.ts`에 채널별 분기를 추가하지 말고 범용 헬퍼를 추가합니다.
- 동작이 하나의 전송에서만 의미가 있으면 시나리오를 전송별로 유지하고 시나리오 계약에서 이를 명시합니다.

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

호환성 별칭은 기존 시나리오에서 계속 사용할 수 있습니다. `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`가 이에 해당합니다. 하지만 새 시나리오 작성에는 범용 이름을 사용해야 합니다. 별칭은 일괄 마이그레이션을 피하기 위해 존재하는 것이지, 앞으로의 모델이 아닙니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음에 답해야 합니다.

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 계속 차단되었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

사용 가능한 시나리오 목록은 후속 작업 규모를 산정하거나 새 전송 방식을 연결할 때 유용합니다. 실행하려면 `pnpm openclaw qa coverage`를 사용하세요(기계가 읽을 수 있는 출력은 `--json` 추가).

문자와 스타일 검사를 위해 동일한 시나리오를 여러 라이브 모델
참조에서 실행하고 판정된 Markdown 보고서를 작성합니다.

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
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음 채팅, 작업 공간 도움말,
작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는
평가 중이라는 사실을 알려서는 안 됩니다. 이 명령은 각 전체
트랜스크립트를 보존하고 기본 실행 통계를 기록한 다음, 지원되는 경우
`xhigh` 추론을 사용하는 빠른 모드로 판정 모델에 자연스러움, 분위기, 유머를 기준으로 실행 순위를 매기도록 요청합니다.
제공자를 비교할 때는 `--blind-judge-models`를 사용하세요. 판정 프롬프트는 여전히
모든 트랜스크립트와 실행 상태를 받지만, 후보 참조는 `candidate-01` 같은 중립
라벨로 대체됩니다. 보고서는 파싱 후 순위를 실제 참조로 다시 매핑합니다.
후보 실행은 기본적으로 `high` 사고를 사용하며, GPT-5.5는 `medium`, 이를 지원하는
이전 OpenAI 평가 참조는 `xhigh`를 사용합니다. 특정 후보를 재정의하려면
`--model provider/model,thinking=<level>`로 인라인 지정하세요. `--thinking <level>`은 여전히
전역 폴백을 설정하며, 이전 형식인 `--model-thinking <provider/model=level>`은
호환성을 위해 유지됩니다.
OpenAI 후보 참조는 제공자가 지원하는 경우 우선순위 처리를 사용하도록 기본적으로 빠른 모드를 사용합니다.
단일 후보나 판정 모델에 재정의가 필요하면 인라인으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요.
모든 후보 모델에서 빠른 모드를 강제로 켜고 싶을 때만 `--fast`를 전달하세요.
후보와 판정 모델의 소요 시간은 벤치마크 분석을 위해 보고서에 기록되지만, 판정 프롬프트는
속도 기준으로 순위를 매기지 말라고 명시합니다.
후보와 판정 모델 실행은 모두 기본적으로 동시성 16을 사용합니다. 제공자 제한이나 로컬 Gateway
부하로 인해 실행 노이즈가 너무 커질 때는 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 문자 평가는 기본적으로
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, 및
`google/gemini-3.1-pro-preview`를 사용합니다.
`--judge-model`이 전달되지 않으면 판정 모델은 기본적으로
`openai/gpt-5.5,thinking=xhigh,fast` 및
`anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [매트릭스 QA](/ko/concepts/qa-matrix)
- [QA 채널](/ko/channels/qa-channel)
- [테스트](/ko/help/testing)
- [대시보드](/ko/web/dashboard)
