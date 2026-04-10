---
read_when:
    - qa-lab 또는 qa-channel 확장하기
    - 리포지토리 기반 QA 시나리오 추가하기
    - Gateway 대시보드를 중심으로 더 현실적인 QA 자동화 구축하기
summary: qa-lab, qa-channel, 시드된 시나리오, 프로토콜 보고서를 위한 비공개 QA 자동화 구조
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-10T05:59:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 357d6698304ff7a8c4aa8a7be97f684d50f72b524740050aa761ac0ee68266de
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 자동화

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고,
채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  리액션, 편집, 삭제 인터페이스를 갖춘 합성 메시지 채널
- `extensions/qa-lab`: 대화 기록을 관찰하고,
  인바운드 메시지를 주입하고, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스
- `qa/`: 시작 작업과 기본 QA
  시나리오를 위한 리포지토리 기반 시드 자산

현재 QA 운영자 흐름은 2개 패널로 구성된 QA 사이트입니다:

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack과 유사한 대화 기록과 시나리오 계획을 보여주는 QA Lab

다음 명령으로 실행합니다:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 Gateway 레인을 시작하며,  
운영자 또는 자동화 루프가 에이전트에 QA
미션을 부여하고, 실제 채널 동작을 관찰하고, 무엇이 작동했고, 실패했고, 계속 막혀 있었는지 기록할 수 있는
QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복 개발하려면,
바인드 마운트된 QA Lab 번들로 스택을 시작하세요:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지로 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는
변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

QA 경로에 Docker를 포함하지 않는 일회용 Linux VM 레인의 경우 다음을 실행하세요:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 내부에서 OpenClaw를 빌드하고,
`qa suite`를 실행한 다음, 일반 QA 보고서와
요약을 다시 호스트의 `.artifacts/qa-e2e/...`로 복사합니다.
시나리오 선택 동작은 호스트에서의 `qa suite`와 동일하게 재사용합니다.
라이브 실행은 게스트에서 실용적으로 사용할 수 있는 지원 QA 인증 입력을 전달합니다:
환경 변수 기반 제공자 키, QA 라이브 제공자 구성 경로,
그리고 존재할 경우 `CODEX_HOME`입니다. 게스트가
마운트된 워크스페이스를 통해 다시 쓸 수 있도록 `--output-dir`은 리포지토리 루트 아래에 유지하세요.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

이 항목들은 QA 계획이 사람과
에이전트 모두에게 보이도록 의도적으로 git에 포함됩니다. 기본 목록은 다음을 포괄할 수 있을 만큼
충분히 넓어야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명 주기
- cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 핸드오프
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders와 같은 작은 빌드 작업 하나

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
이 보고서는 다음에 답해야 합니다:

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 계속 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

캐릭터 및 스타일 점검을 위해, 동일한 시나리오를 여러 라이브 모델 ref에 걸쳐 실행하고
판정된 Markdown 보고서를 작성하세요:

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

이 명령은 Docker가 아니라 로컬 QA Gateway 자식 프로세스를 실행합니다. 캐릭터 평가
시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음, 채팅, 워크스페이스 도움말,
작은 파일 작업과 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는
평가 중이라는 사실을 알려주면 안 됩니다. 이 명령은 각 전체 대화 기록을 보존하고,
기본 실행 통계를 기록한 다음, 판정 모델에 빠른 모드와
`xhigh` 추론으로 실행 결과를 자연스러움, 분위기, 유머 기준으로 순위를 매기도록 요청합니다.
제공자 간 비교 시에는 `--blind-judge-models`를 사용하세요. 판정 프롬프트는 여전히
모든 대화 기록과 실행 상태를 받지만, 후보 ref는
`candidate-01` 같은 중립적인 레이블로 대체됩니다. 이후 보고서는 파싱 후 순위를 실제 ref에 다시 매핑합니다.
후보 실행은 기본적으로 `high` 추론을 사용하며, 이를 지원하는 OpenAI 모델의 경우 `xhigh`를 사용합니다.
특정 후보를 개별적으로 덮어쓰려면
`--model provider/model,thinking=<level>`을 사용하세요. `--thinking <level>`은 여전히
전역 대체값을 설정하며, 이전의 `--model-thinking <provider/model=level>` 형식도
호환성을 위해 유지됩니다.
OpenAI 후보 ref는 제공자가 지원하는 경우 우선 처리에 fast 모드를 사용하도록 기본 설정됩니다.
단일 후보 또는 판정자에 대해 재정의가 필요하면 인라인으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요.
모든 후보 모델에 fast 모드를 강제로 적용하려는 경우에만 `--fast`를 전달하세요. 후보 및
판정 모델 실행 시간은 벤치마크 분석을 위해 보고서에 기록되지만,
판정 프롬프트에는 속도로 순위를 매기지 말라고 명시되어 있습니다.
후보 및 판정 모델 실행은 둘 다 기본 동시성 16을 사용합니다. 제공자 제한 또는 로컬 Gateway
부하로 인해 실행 결과에 노이즈가 너무 많다면 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면, 캐릭터 평가는 기본적으로
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, 그리고
`google/gemini-3.1-pro-preview`를 사용합니다.
판정 `--judge-model`이 전달되지 않으면, 판정자는 기본적으로
`openai/gpt-5.4,thinking=xhigh,fast` 및
`anthropic/claude-opus-4-6,thinking=high`를 사용합니다.

## 관련 문서

- [테스트](/ko/help/testing)
- [QA Channel](/ko/channels/qa-channel)
- [대시보드](/web/dashboard)
