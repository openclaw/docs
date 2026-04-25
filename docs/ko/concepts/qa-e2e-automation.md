---
read_when:
    - qa-lab 또는 qa-channel 확장하기
    - 리포지토리 기반 QA 시나리오 추가하기
    - Gateway 대시보드를 중심으로 더 높은 현실성의 QA 자동화 구축하기
summary: qa-lab, qa-channel, 시드된 시나리오, 그리고 프로토콜 리포트를 위한 비공개 QA 자동화 형태
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-25T05:59:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고,
채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 편집, 삭제 표면을 갖는 합성 메시지 채널
- `extensions/qa-lab`: transcript를 관찰하고,
  인바운드 메시지를 주입하고, Markdown 리포트를 내보내는 디버거 UI 및 QA 버스
- `qa/`: kickoff 작업과 기본 QA
  시나리오를 위한 리포지토리 기반 시드 자산

현재 QA 운영자 흐름은 2개 패널의 QA 사이트입니다:

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack 스타일 transcript와 시나리오 계획을 보여주는 QA Lab

다음으로 실행합니다:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 gateway 레인을 시작하며,
운영자 또는 자동화 루프가 에이전트에 QA 미션을 부여하고,
실제 채널 동작을 관찰하고, 무엇이 동작했고 실패했고 막혀 있었는지를
기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복 개발하려면,
바인드 마운트된 QA Lab 번들로 스택을 시작하세요:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 사전 빌드된 이미지에서 Docker 서비스를 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다.
`qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하고,
QA Lab 자산 해시가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

전송이 실제인 Matrix 스모크 레인을 실행하려면 다음을 실행하세요:

```bash
pnpm openclaw qa matrix
```

이 레인은 Docker에서 일회용 Tuwunel homeserver를 프로비저닝하고,
임시 driver, SUT, observer 사용자를 등록하고, 하나의 비공개 room을 생성한 뒤,
실제 Matrix Plugin을 QA gateway 자식 프로세스 안에서 실행합니다. 라이브 전송 레인은
자식 config를 테스트 중인 전송에 한정해 유지하므로, Matrix는 자식 config에
`qa-channel` 없이 실행됩니다. 구조화된 리포트 아티팩트와
stdout/stderr를 합친 로그를 선택한 Matrix QA 출력 디렉터리에 기록합니다.
바깥쪽 `scripts/run-node.mjs` 빌드/런처 출력도 함께 캡처하려면,
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>`를 리포지토리 로컬 로그 파일로 설정하세요.
Matrix 진행 상황은 기본적으로 출력됩니다.
`OPENCLAW_QA_MATRIX_TIMEOUT_MS`는 전체 실행 시간을 제한하고,
`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`는 정리 시간을 제한하므로, Docker 정리가 멈추면
프로세스가 멈춘 채 대기하는 대신 정확한 복구 명령을 보고합니다.

전송이 실제인 Telegram 스모크 레인을 실행하려면 다음을 실행하세요:

```bash
pnpm openclaw qa telegram
```

이 레인은 일회용 서버를 프로비저닝하는 대신 하나의 실제 비공개 Telegram 그룹을 대상으로 합니다.
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`,
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요하며,
같은 비공개 그룹에 서로 다른 두 개의 봇이 있어야 합니다. SUT 봇은 Telegram 사용자 이름이 있어야 하며,
봇 간 관찰은 두 봇 모두 `@BotFather`에서 Bot-to-Bot Communication Mode가
활성화되어 있을 때 가장 잘 동작합니다.
어떤 시나리오라도 실패하면 명령은 0이 아닌 종료 코드를 반환합니다.
실패 종료 코드 없이 아티팩트만 원한다면 `--allow-failures`를 사용하세요.
Telegram 리포트와 요약에는 카나리부터 시작해
driver 메시지 전송 요청부터 관찰된 SUT 응답까지의 응답별 RTT가 포함됩니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요:

```bash
pnpm openclaw qa credentials doctor
```

doctor는 Convex broker env를 확인하고, 엔드포인트 설정을 검증하며,
maintainer secret이 있을 때 admin/list 접근 가능성도 확인합니다.
secret에 대해서는 설정됨/누락됨 상태만 보고합니다.

전송이 실제인 Discord 스모크 레인을 실행하려면 다음을 실행하세요:

```bash
pnpm openclaw qa discord
```

이 레인은 두 개의 봇이 있는 하나의 실제 비공개 Discord guild 채널을 대상으로 합니다:
하나는 harness가 제어하는 driver bot이고,
다른 하나는 번들된 Discord Plugin을 통해 자식 OpenClaw gateway가 시작하는 SUT bot입니다.
env 자격 증명을 사용할 때는
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
`OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`가 필요합니다.
이 레인은 채널 멘션 처리 여부를 검증하고,
SUT bot이 Discord에 네이티브 `/help` 명령을 등록했는지도 확인합니다.
어떤 시나리오라도 실패하면 명령은 0이 아닌 종료 코드를 반환합니다.
실패 종료 코드 없이 아티팩트만 원한다면 `--allow-failures`를 사용하세요.

이제 라이브 전송 레인은 각자 별도의 시나리오 목록 형식을 만들지 않고,
더 작고 공통된 하나의 계약을 공유합니다:

`qa-channel`은 여전히 폭넓은 합성 제품 동작 스위트이며,
라이브 전송 커버리지 매트릭스에는 포함되지 않습니다.

| 레인     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

이렇게 하면 `qa-channel`은 폭넓은 제품 동작 스위트로 유지되고,
Matrix, Telegram, 그리고 향후 라이브 전송은 하나의 명시적인 전송 계약 체크리스트를 공유합니다.

Docker를 QA 경로에 포함하지 않고 일회용 Linux VM 레인을 실행하려면 다음을 실행하세요:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass guest를 부팅하고, 의존성을 설치하고,
guest 내부에서 OpenClaw를 빌드하고, `qa suite`를 실행한 뒤,
일반 QA 리포트와 요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
호스트에서의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트와 Multipass 스위트 실행은 기본적으로
격리된 gateway worker와 함께 선택된 여러 시나리오를 병렬로 실행합니다.
`qa-channel`의 기본 동시성은 4이며, 선택된 시나리오 수를 상한으로 합니다.
worker 수를 조정하려면 `--concurrency <count>`를 사용하고,
직렬 실행하려면 `--concurrency 1`을 사용하세요.
어떤 시나리오라도 실패하면 명령은 0이 아닌 종료 코드를 반환합니다.
실패 종료 코드 없이 아티팩트만 원한다면 `--allow-failures`를 사용하세요.
라이브 실행은 guest에 실용적으로 전달 가능한 지원 QA 인증 입력을 전달합니다:
env 기반 provider 키, QA 라이브 provider config 경로,
그리고 존재할 경우 `CODEX_HOME`입니다. guest가 마운트된 워크스페이스를 통해
다시 쓸 수 있도록 `--output-dir`은 리포지토리 루트 아래에 두세요.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함됩니다.

`qa-lab`은 일반적인 Markdown runner로 유지되어야 합니다. 각 시나리오 Markdown 파일은
하나의 테스트 실행을 위한 단일 source of truth여야 하며, 다음을 정의해야 합니다:

- 시나리오 메타데이터
- 선택적 category, capability, lane, risk 메타데이터
- docs 및 code refs
- 선택적 Plugin 요구 사항
- 선택적 Gateway config patch
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은
일반적이고 교차 기능적으로 유지되어도 됩니다. 예를 들어, Markdown 시나리오는
특수한 runner를 추가하지 않고도, transport 측 helper와
Gateway `browser.request` seam을 통해 임베드된 Control UI를 구동하는 browser 측 helper를
함께 결합할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 그룹화해야 합니다.
파일이 이동해도 시나리오 ID는 안정적으로 유지하고,
구현 추적성에는 `docsRefs`와 `codeRefs`를 사용하세요.

기본 목록은 다음을 포괄할 만큼 충분히 넓어야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 lifecycle
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 handoff
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## provider mock 레인

`qa suite`에는 두 개의 로컬 provider mock 레인이 있습니다:

- `mock-openai`는 시나리오 인식 OpenClaw mock입니다. 리포지토리 기반 QA와
  parity gate를 위한 기본 결정론적 mock 레인으로 유지됩니다.
- `aimock`은 실험적인 프로토콜,
  fixture, record/replay, chaos 커버리지를 위해 AIMock 기반 provider 서버를 시작합니다.
  추가적인 옵션이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

provider 레인 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 provider는 자신의 기본값, 로컬 서버 시작, Gateway 모델 config,
auth-profile 준비 요구 사항, 라이브/모의 capability 플래그를 소유합니다.
공유된 스위트 및 gateway 코드는 provider 이름으로 분기하지 말고
provider registry를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 Markdown QA 시나리오를 위한 일반적인 전송 seam을 소유합니다.
`qa-channel`은 그 seam 위의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다:
향후 실제 또는 합성 채널도 전송별 QA runner를 추가하지 않고
같은 스위트 runner에 연결되어야 합니다.

아키텍처 수준에서의 분리는 다음과 같습니다:

- `qa-lab`은 일반적인 시나리오 실행, worker 동시성, 아티팩트 쓰기, 리포팅을 소유합니다.
- 전송 어댑터는 Gateway config, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 작업, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 Markdown 시나리오 파일이 테스트 실행을 정의하며, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

새 채널 어댑터를 위한 maintainer 대상 도입 가이드는
[Testing](/ko/help/testing#adding-a-channel-to-qa)에 있습니다.

## 리포팅

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 리포트를 내보냅니다.
리포트는 다음에 답해야 합니다:

- 무엇이 동작했는가
- 무엇이 실패했는가
- 무엇이 계속 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

캐릭터 및 스타일 검사를 위해서는 같은 시나리오를 여러 라이브 모델 ref에서 실행하고,
판정된 Markdown 리포트를 작성하세요:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

이 명령은 Docker가 아니라 로컬 QA gateway 자식 프로세스를 실행합니다. character eval
시나리오는 `SOUL.md`를 통해 persona를 설정한 다음, 채팅, workspace 도움말,
작은 파일 작업 같은 일반적인 사용자 턴을 실행해야 합니다. 후보 모델에는
평가 중이라는 사실을 알려주면 안 됩니다. 이 명령은 각 전체 transcript를 보존하고,
기본 실행 통계를 기록한 다음, 지원되는 경우 빠른 모드와 `xhigh` reasoning을 사용하는
judge 모델에게 자연스러움, 분위기, 유머를 기준으로 실행 결과의 순위를 매기도록 요청합니다.
provider를 비교할 때는 `--blind-judge-models`를 사용하세요. judge 프롬프트는 여전히
모든 transcript와 실행 상태를 받지만, 후보 ref는 `candidate-01` 같은 중립 레이블로
대체됩니다. 리포트는 파싱 후 순위를 실제 ref에 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, GPT-5.4는 `medium`,
이를 지원하는 더 오래된 OpenAI eval ref는 `xhigh`를 사용합니다. 특정 후보를 개별적으로 override하려면
`--model provider/model,thinking=<level>`을 사용하세요. `--thinking <level>`은 여전히
전역 폴백을 설정하고, 이전 형식인 `--model-thinking <provider/model=level>`도
호환성을 위해 유지됩니다.
OpenAI 후보 ref는 provider가 지원하는 곳에서 우선 처리에 fast 모드가 사용되도록 기본적으로 fast 모드를 사용합니다.
단일 후보 또는 judge에 override가 필요하면 인라인으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요.
모든 후보 모델에 fast 모드를 강제로 켜고 싶을 때만 `--fast`를 전달하세요. 후보와 judge의 실행 시간은
벤치마크 분석을 위해 리포트에 기록되지만, judge 프롬프트는 속도로 순위를 매기지 말라고
명시적으로 지시합니다.
후보 및 judge 모델 실행은 모두 기본적으로 동시성 16을 사용합니다. provider 제한이나 로컬 gateway
부하 때문에 실행이 너무 시끄러우면 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`을 전달하지 않으면 character eval은 기본적으로
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`,
`google/gemini-3.1-pro-preview`를 사용합니다.
`--judge-model`을 전달하지 않으면 judge는 기본적으로
`openai/gpt-5.4,thinking=xhigh,fast`와
`anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [Testing](/ko/help/testing)
- [QA Channel](/ko/channels/qa-channel)
- [대시보드](/ko/web/dashboard)
