---
read_when:
    - qa-lab 또는 qa-channel 확장하기
    - 저장소 기반 QA 시나리오 추가하기
    - Gateway 대시보드를 중심으로 더 높은 현실성의 QA 자동화 구축하기
summary: qa-lab, qa-channel, 시드된 시나리오, 그리고 프로토콜 보고서를 위한 비공개 QA 자동화 구조
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-12T23:28:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9fe27dc049823d5e3eb7ae1eac6aad21ed9e917425611fb1dbcb28ab9210d5e
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 자동화

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고
채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  리액션, 수정, 삭제 기능을 갖춘 합성 메시지 채널
- `extensions/qa-lab`: 트랜스크립트를 관찰하고,
  인바운드 메시지를 주입하고, Markdown 보고서를 내보내기 위한
  디버거 UI 및 QA 버스
- `qa/`: 시작 작업과 기본 QA
  시나리오를 위한 저장소 기반 시드 자산

현재 QA 운영자 흐름은 2개 패널로 구성된 QA 사이트입니다:

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack 스타일의 트랜스크립트와 시나리오 계획을 보여주는 QA Lab

다음으로 실행합니다:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 Gateway 레인을 시작하며,
운영자 또는 자동화 루프가 에이전트에 QA
미션을 부여하고, 실제 채널 동작을 관찰하고, 무엇이 작동했고, 실패했고, 또는
계속 막혀 있었는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 QA Lab UI를 더 빠르게 반복 개발하려면,
바인드 마운트된 QA Lab 번들로 스택을 시작하세요:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 사전 빌드된 이미지에서 Docker 서비스를 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는
변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 변경되면 브라우저가 자동으로 새로고침됩니다.

전송이 실제인 Matrix 스모크 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa matrix
```

이 레인은 Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고,
임시 드라이버, SUT, 관찰자 사용자를 등록하고, 하나의 비공개 방을 만든 다음,
QA Gateway 하위 프로세스 안에서 실제 Matrix Plugin을 실행합니다. 라이브 전송 레인은
테스트 중인 전송에 맞게 하위 프로세스 구성을 범위 지정하므로, Matrix는
하위 프로세스 구성에서 `qa-channel` 없이 실행됩니다.

전송이 실제인 Telegram 스모크 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa telegram
```

이 레인은 일회용 서버를 프로비저닝하는 대신 하나의 실제 비공개 Telegram 그룹을 대상으로 합니다.
이를 위해서는 `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`,
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요하며,
같은 비공개 그룹에 서로 다른 두 개의 봇이 있어야 합니다. SUT 봇에는 Telegram 사용자 이름이 있어야 하며,
봇 간 관찰은 두 봇 모두 `@BotFather`에서
Bot-to-Bot Communication Mode를 활성화했을 때 가장 잘 작동합니다.

이제 라이브 전송 레인은 각자 자체 시나리오 목록 형태를 만들지 않고,
더 작은 하나의 공통 계약을 공유합니다:

`qa-channel`은 여전히 광범위한 합성 제품 동작 스위트이며
라이브 전송 커버리지 매트릭스에는 포함되지 않습니다.

| 레인     | Canary | 멘션 게이팅 | 허용 목록 차단 | 최상위 답글 | 재시작 복원 | 스레드 후속 응답 | 스레드 격리 | 리액션 관찰 | 도움말 명령 |
| -------- | ------ | ----------- | -------------- | ----------- | ----------- | ---------------- | ----------- | ----------- | ------------ |
| Matrix   | x      | x           | x              | x           | x           | x                | x           | x           |              |
| Telegram | x      |             |                |             |             |                  |             |             | x            |

이를 통해 `qa-channel`은 광범위한 제품 동작 스위트로 유지되고, Matrix,
Telegram, 그리고 향후 라이브 전송은 하나의 명시적인 전송 계약 점검 목록을 공유합니다.

Docker를 QA 경로에 포함하지 않고 일회용 Linux VM 레인을 실행하려면,
다음을 사용하세요:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새로운 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 내부에서
OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와
요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.
이 명령은 호스트에서의 `qa suite`와 동일한 시나리오 선택 동작을 재사용합니다.
호스트 및 Multipass 스위트 실행은 기본적으로
격리된 Gateway 워커와 함께 선택된 여러 시나리오를 병렬로 실행하며, 최대 64개 워커 또는
선택된 시나리오 수만큼 실행합니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하거나,
직렬 실행을 위해 `--concurrency 1`을 사용하세요.
라이브 실행은 게스트에 실용적으로 전달 가능한 지원 QA 인증 입력도 전달합니다:
환경 변수 기반 프로바이더 키, QA 라이브 프로바이더 구성 경로, 그리고
존재할 경우 `CODEX_HOME`입니다. 게스트가
마운트된 워크스페이스를 통해 다시 쓸 수 있도록 `--output-dir`은 저장소 루트 아래에 유지하세요.

## 저장소 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

이들은 QA 계획이 사람과
에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다.

`qa-lab`은 일반적인 Markdown 실행기로 유지되어야 합니다. 각 시나리오 Markdown 파일은
하나의 테스트 실행에 대한 기준 원본이며, 다음을 정의해야 합니다:

- 시나리오 메타데이터
- 문서 및 코드 참조
- 선택적 Plugin 요구 사항
- 선택적 Gateway 구성 패치
- 실행 가능한 `qa-flow`

기본 목록은 다음을 포괄할 수 있을 만큼 충분히 광범위해야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명 주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 핸드오프
- 저장소 읽기 및 문서 읽기
- Lobster Invaders와 같은 작은 빌드 작업 하나

## 전송 어댑터

`qa-lab`은 Markdown QA 시나리오를 위한 일반적인 전송 인터페이스를 담당합니다.
`qa-channel`은 해당 인터페이스의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다.
향후 실제 또는 합성 채널도 전송별 QA 실행기를 추가하는 대신
같은 스위트 실행기에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다:

- `qa-lab`은 일반적인 시나리오 실행, 워커 동시성, 아티팩트 기록, 보고를 담당합니다.
- 전송 어댑터는 Gateway 구성, 준비 상태, 인바운드 및 아웃바운드 관찰, 전송 액션, 정규화된 전송 상태를 담당합니다.
- `qa/scenarios/` 아래의 Markdown 시나리오 파일이 테스트 실행을 정의하며, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 인터페이스를 제공합니다.

새 채널 어댑터를 위한 유지관리자용 도입 가이드는
[Testing](/ko/help/testing#adding-a-channel-to-qa)에 있습니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음 질문에 답해야 합니다:

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 계속 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

문체와 스타일 점검을 위해 동일한 시나리오를 여러 라이브 모델
ref에서 실행하고 평가된 Markdown 보고서를 작성하세요:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

이 명령은 Docker가 아니라 로컬 QA Gateway 하위 프로세스를 실행합니다. character eval
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음, 채팅,
워크스페이스 도움말, 작은 파일 작업과 같은 일반적인 사용자 턴을 실행해야 합니다. 후보 모델에는
자신이 평가 중이라는 사실을 알려주면 안 됩니다. 이 명령은 각 전체
트랜스크립트를 보존하고, 기본 실행 통계를 기록한 다음,
`xhigh` 추론을 사용하는 빠른 모드의 판정 모델에 자연스러움, 분위기, 유머를 기준으로 실행 결과의 순위를 매기도록 요청합니다.
프로바이더를 비교할 때는 `--blind-judge-models`를 사용하세요.
그러면 판정 프롬프트는 여전히 모든 트랜스크립트와 실행 상태를 받지만,
후보 ref는 `candidate-01`과 같은 중립적인 레이블로 대체됩니다. 보고서는
파싱 후 순위를 실제 ref에 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며,
이를 지원하는 OpenAI 모델에는 `xhigh`를 사용합니다. 특정 후보를 개별적으로 재정의하려면
`--model provider/model,thinking=<level>`을 사용하세요. `--thinking <level>`은
여전히 전역 대체값을 설정하며, 이전의 `--model-thinking <provider/model=level>` 형식도
호환성을 위해 유지됩니다.
OpenAI 후보 ref는 기본적으로 fast mode를 사용하므로,
프로바이더가 지원하는 경우 우선 처리 프로세싱이 사용됩니다. 하나의
후보 또는 판정 모델에 대해 재정의가 필요하면 `,fast`, `,no-fast`, 또는 `,fast=false`를 인라인으로 추가하세요.
모든 후보 모델에 대해 fast mode를 강제로 켜고 싶은 경우에만 `--fast`를 전달하세요. 후보와 판정 실행 시간은
벤치마크 분석을 위해 보고서에 기록되지만, 판정 프롬프트에는 명시적으로
속도로 순위를 매기지 말라고 적혀 있습니다.
후보 및 판정 모델 실행은 모두 기본적으로 동시성 16을 사용합니다. 프로바이더 제한이나
로컬 Gateway 부하 때문에 실행 결과가 너무 불안정해지면
`--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 character eval은 기본적으로
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`,
그리고 `google/gemini-3.1-pro-preview`를 사용합니다.
후보 `--model`이 전달되지 않았을 때 이 기본값이 사용됩니다.
`--judge-model`이 전달되지 않으면 판정 모델은 기본적으로
`openai/gpt-5.4,thinking=xhigh,fast`와
`anthropic/claude-opus-4-6,thinking=high`입니다.

## 관련 문서

- [Testing](/ko/help/testing)
- [QA Channel](/ko/channels/qa-channel)
- [Dashboard](/web/dashboard)
