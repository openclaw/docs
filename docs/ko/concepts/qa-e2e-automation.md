---
read_when:
    - qa-lab 또는 qa-channel 확장하기
    - 리포지토리 기반 QA 시나리오 추가하기
    - Gateway 대시보드를 중심으로 더 현실적인 QA 자동화 구축하기
summary: qa-lab, qa-channel, 시드된 시나리오, 그리고 프로토콜 보고서를 위한 비공개 QA 자동화 구조
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-25T18:18:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: be2cfc97a33519e0c4263dc7da356136b10ddcbeef436ab821e645688b6b2cfc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

비공개 QA 스택은 단일 단위 테스트로는 할 수 없는, 더 현실적이고
채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 수정, 삭제 surface를 갖춘 합성 메시지 채널
- `extensions/qa-lab`: 기록을 관찰하고,
  수신 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스
- `qa/`: 시작 작업과 기본 QA
  시나리오를 위한 리포지토리 기반 시드 자산

현재 QA 운영자 흐름은 2패널 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack 비슷한 기록과 시나리오 계획을 보여주는 QA Lab

다음으로 실행합니다.

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 gateway lane을 시작하며,
운영자나 자동화 루프가 에이전트에 QA
미션을 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했고 실패했으며
무엇이 막힌 상태로 남았는지를 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복 개발하려면,
바인드 마운트된 QA Lab 번들로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 사전 빌드된 이미지에서 Docker 서비스를 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는
변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

실제 전송을 사용하는 Matrix 스모크 lane을 실행하려면 다음을 사용하세요.

```bash
pnpm openclaw qa matrix
```

이 lane은 Docker에서 일회용 Tuwunel homeserver를 프로비저닝하고,
임시 드라이버, SUT, 관찰자 사용자를 등록한 뒤, 하나의 비공개 룸을 생성하고,
실제 Matrix Plugin을 QA gateway child 안에서 실행합니다. 라이브 전송 lane은
child 구성을 테스트 중인 전송으로 한정하므로 Matrix는 child 구성에
`qa-channel` 없이 실행됩니다. 구조화된 보고서 아티팩트와
stdout/stderr가 결합된 로그를 선택된 Matrix QA 출력 디렉터리에 기록합니다. 바깥쪽
`scripts/run-node.mjs`의 빌드/런처 출력까지도 캡처하려면
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>`를 리포지토리 로컬 로그 파일로 설정하세요.
Matrix 진행 상황은 기본적으로 출력됩니다. `OPENCLAW_QA_MATRIX_TIMEOUT_MS`는
전체 실행 시간을 제한하고, `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`는 정리 시간을 제한하여
멈춘 Docker teardown이 무한 대기하는 대신 정확한 복구 명령을 보고하게 합니다.

실제 전송을 사용하는 Telegram 스모크 lane을 실행하려면 다음을 사용하세요.

```bash
pnpm openclaw qa telegram
```

이 lane은 일회용 서버를 프로비저닝하는 대신 실제 비공개 Telegram 그룹 하나를 대상으로 합니다.
이를 위해 `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`,
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요하며, 같은
비공개 그룹에 서로 다른 두 봇이 있어야 합니다. SUT 봇은 Telegram 사용자 이름이 있어야 하며,
봇 간 관찰은 두 봇 모두 `@BotFather`에서
Bot-to-Bot Communication Mode를 활성화했을 때 가장 잘 동작합니다.
어떤 시나리오든 실패하면 명령은 0이 아닌 종료 코드를 반환합니다. 실패하는 종료 코드 없이
아티팩트만 원하면 `--allow-failures`를 사용하세요.
Telegram 보고서와 요약에는 카나리아부터 시작해
드라이버 메시지 전송 요청 시점부터 관찰된 SUT 답변까지의 답변별 RTT가 포함됩니다.

풀링된 라이브 자격 증명을 사용하기 전에 다음을 실행하세요.

```bash
pnpm openclaw qa credentials doctor
```

이 doctor는 Convex broker env를 점검하고, 엔드포인트 설정을 검증하며,
관리자 비밀이 있으면 admin/list 도달 가능성도 확인합니다. 비밀에 대해서는
설정됨/누락됨 상태만 보고합니다.

실제 전송을 사용하는 Discord 스모크 lane을 실행하려면 다음을 사용하세요.

```bash
pnpm openclaw qa discord
```

이 lane은 두 개의 봇이 있는 실제 비공개 Discord guild 채널 하나를 대상으로 합니다.
하나는 하네스가 제어하는 드라이버 봇이고, 다른 하나는 번들된 Discord Plugin을 통해
child OpenClaw gateway가 시작하는 SUT 봇입니다. env 자격 증명을 사용할 때는
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
그리고 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`가 필요합니다.
이 lane은 채널 멘션 처리를 검증하고 SUT 봇이 Discord에 기본 제공 `/help`
명령을 등록했는지도 확인합니다.
어떤 시나리오든 실패하면 명령은 0이 아닌 종료 코드를 반환합니다. 실패하는 종료 코드 없이
아티팩트만 원하면 `--allow-failures`를 사용하세요.

이제 라이브 전송 lane은 각자 자체 시나리오 목록 형태를 만드는 대신
하나의 더 작은 공통 계약을 공유합니다.

`qa-channel`은 여전히 폭넓은 합성 제품 동작 스위트이며
라이브 전송 커버리지 매트릭스에는 포함되지 않습니다.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

이렇게 하면 `qa-channel`은 폭넓은 제품 동작 스위트로 유지되고, Matrix,
Telegram, 그리고 향후 라이브 전송은 하나의 명시적인 전송 계약 체크리스트를 공유하게 됩니다.

Docker를 QA 경로에 포함하지 않는 일회용 Linux VM lane을 실행하려면 다음을 사용하세요.

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 내부에서
OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와
요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
시나리오 선택 동작은 호스트에서의 `qa suite`와 동일하게 재사용합니다.
호스트와 Multipass suite 실행은 기본적으로 격리된 gateway worker와 함께
선택된 여러 시나리오를 병렬로 실행합니다. `qa-channel`의 기본 동시성은 4이며,
선택된 시나리오 수를 상한으로 합니다. worker 수를 조정하려면
`--concurrency <count>`를 사용하고, 직렬 실행에는 `--concurrency 1`을 사용하세요.
어떤 시나리오든 실패하면 명령은 0이 아닌 종료 코드를 반환합니다. 실패하는 종료 코드 없이
아티팩트만 원하면 `--allow-failures`를 사용하세요.
라이브 실행은 게스트에 실용적으로 전달 가능한 지원 QA 인증 입력을 전달합니다.
여기에는 env 기반 provider 키, QA 라이브 provider 구성 경로,
그리고 존재할 경우 `CODEX_HOME`이 포함됩니다. 게스트가 마운트된 워크스페이스를 통해
다시 쓸 수 있도록 `--output-dir`은 리포지토리 루트 아래에 두세요.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이 파일들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함됩니다.

`qa-lab`은 범용 Markdown 러너로 유지되어야 합니다. 각 시나리오 Markdown 파일은
한 번의 테스트 실행에 대한 기준 정보여야 하며, 다음을 정의해야 합니다.

- 시나리오 메타데이터
- 선택적 category, capability, lane, risk 메타데이터
- docs 및 code 참조
- 선택적 Plugin 요구 사항
- 선택적 gateway 구성 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 surface는 범용적이고
횡단 관심사로 유지되어도 됩니다. 예를 들어 Markdown 시나리오는
특수한 러너를 추가하지 않고도 Gateway `browser.request` seam을 통해
내장된 Control UI를 구동하는 브라우저 측 도우미와 전송 측 도우미를 결합할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능별로 그룹화해야 합니다.
파일이 이동해도 시나리오 ID는 안정적으로 유지하고, 구현 추적 가능성을 위해
`docsRefs`와 `codeRefs`를 사용하세요.

기본 목록은 다음을 포괄할 만큼 충분히 넓어야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 핸드오프
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## Provider mock lane

`qa suite`에는 두 개의 로컬 provider mock lane이 있습니다.

- `mock-openai`는 시나리오 인식 OpenClaw mock입니다. 이는 리포지토리 기반 QA와 parity gate를 위한
  기본 결정론적 mock lane으로 유지됩니다.
- `aimock`은 실험적인 프로토콜,
  픽스처, record/replay, chaos 커버리지를 위해 AIMock 기반 provider 서버를 시작합니다. 이는
  추가 기능이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

Provider-lane 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 provider는 자체 기본값, 로컬 서버 시작, gateway 모델 구성,
auth-profile 준비 요구 사항, 라이브/mock 기능 플래그를 소유합니다. 공유 suite 및
gateway 코드는 provider 이름으로 분기하지 말고 provider 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 Markdown QA 시나리오를 위한 범용 전송 seam을 소유합니다.
`qa-channel`은 그 seam 위의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다.
향후 실제 또는 합성 채널도 전송별 QA 러너를 추가하는 대신
같은 suite 러너에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 범용 시나리오 실행, worker 동시성, 아티팩트 작성, 보고를 소유합니다.
- 전송 어댑터는 gateway 구성, 준비 상태, 수신 및 발신 관찰, 전송 액션, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래의 Markdown 시나리오 파일이 테스트 실행을 정의하고, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 surface를 제공합니다.

새 채널 어댑터를 위한 유지관리자 대상 도입 가이드는
[테스트](/ko/help/testing#adding-a-channel-to-qa)에 있습니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
이 보고서는 다음 질문에 답해야 합니다.

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 막힌 상태로 남았는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

문체와 스타일 검사를 위해 같은 시나리오를 여러 라이브 모델
참조에서 실행하고, 판정된 Markdown 보고서를 작성하세요.

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

이 명령은 Docker가 아니라 로컬 QA gateway child 프로세스를 실행합니다. character eval
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음, 채팅, 워크스페이스 도움말,
작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는
평가 중이라는 사실을 알려주지 않아야 합니다. 이 명령은 각 전체 기록을 보존하고,
기본 실행 통계를 기록한 뒤, 지원되는 경우 `xhigh` 추론과 fast 모드의
judge 모델에게 자연스러움, vibe, humor 기준으로 실행 결과의 순위를 매기도록 요청합니다.
provider를 비교할 때는 `--blind-judge-models`를 사용하세요. judge 프롬프트는 여전히
모든 기록과 실행 상태를 받지만, 후보 참조는 `candidate-01` 같은
중립 라벨로 대체됩니다. 보고서는 파싱 후 순위를 실제 참조로 다시 매핑합니다.

후보 실행의 기본값은 `high` thinking이며, GPT-5.5는 `medium`,
이를 지원하는 이전 OpenAI eval 참조는 `xhigh`입니다. 특정 후보를 재정의하려면
`--model provider/model,thinking=<level>`을 인라인으로 사용하세요. `--thinking <level>`은
여전히 전역 대체값을 설정하며, 이전 형식인
`--model-thinking <provider/model=level>`도 호환성을 위해 유지됩니다.
OpenAI 후보 참조는 provider가 지원하는 경우 우선 처리에 fast 모드를
기본으로 사용합니다. 단일 후보 또는 judge에 재정의가 필요하면 인라인으로
`,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요. 모든 후보 모델에
fast 모드를 강제로 켜려는 경우에만 `--fast`를 전달하세요. 후보 및 judge 실행 시간은
벤치마크 분석을 위해 보고서에 기록되지만, judge 프롬프트에는 속도로 순위를 매기지
말라고 명시되어 있습니다.

후보 및 judge 모델 실행은 모두 기본적으로 동시성 16을 사용합니다. provider 제한이나
로컬 gateway 부하 때문에 실행이 너무 불안정해지면 `--concurrency` 또는
`--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 character eval의 기본값은
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`,
그리고 `google/gemini-3.1-pro-preview`입니다.
`--judge-model`이 전달되지 않으면 judge 기본값은
`openai/gpt-5.5,thinking=xhigh,fast`와
`anthropic/claude-opus-4-6,thinking=high`입니다.

## 관련 문서

- [테스트](/ko/help/testing)
- [QA Channel](/ko/channels/qa-channel)
- [대시보드](/ko/web/dashboard)
