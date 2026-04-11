---
read_when:
    - qa-lab 또는 qa-channel 확장하기
    - 리포지토리 기반 QA 시나리오 추가하기
    - Gateway 대시보드를 중심으로 더 높은 현실성의 QA 자동화 구축하기
summary: qa-lab, qa-channel, 시드된 시나리오, 그리고 프로토콜 보고서를 위한 비공개 QA 자동화 구조
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-11T02:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5427b505e26bfd542e984e3920c3f7cb825473959195ba9737eff5da944c60d0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 자동화

비공개 QA 스택은 단일 단위 테스트로는 어려운, 더 현실적이고 채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드, 리액션, 수정, 삭제 표면을 갖춘 합성 메시지 채널
- `extensions/qa-lab`: 대화 내용을 관찰하고, 인바운드 메시지를 주입하고, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스
- `qa/`: 시작 작업과 기준 QA 시나리오를 위한 리포지토리 기반 시드 자산

현재 QA 운영자 흐름은 2패널 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack과 비슷한 대화 내용과 시나리오 계획을 보여주는 QA Lab

다음으로 실행합니다:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 게이트웨이 레인을 시작하며, 운영자나 자동화 루프가 에이전트에 QA 미션을 부여하고, 실제 채널 동작을 관찰하고, 무엇이 성공했는지, 실패했는지, 또는 여전히 막혀 있는지를 기록할 수 있는 QA Lab 페이지를 노출합니다.

Docker 이미지를 매번 다시 빌드하지 않고 QA Lab UI를 더 빠르게 반복 개발하려면, 바인드 마운트된 QA Lab 번들로 스택을 시작하세요:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 미리 빌드된 이미지에서 Docker 서비스를 유지하고 `extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하고, QA Lab 자산 해시가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

실제 전송 계층 기반 Matrix 스모크 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa matrix
```

이 레인은 Docker에서 일회용 Tuwunel 홈서버를 프로비저닝하고, 임시 드라이버, SUT, 옵저버 사용자를 등록하고, 하나의 비공개 방을 만든 다음, QA 게이트웨이 자식 프로세스 안에서 실제 Matrix plugin을 실행합니다. 라이브 전송 레인은 자식 설정을 테스트 중인 전송 계층에 한정해서 적용하므로, Matrix는 자식 설정에서 `qa-channel` 없이 실행됩니다.

실제 전송 계층 기반 Telegram 스모크 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa telegram
```

이 레인은 일회용 서버를 프로비저닝하는 대신 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. 이를 위해서는 `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요하며, 동일한 비공개 그룹 안에 서로 다른 두 개의 봇이 있어야 합니다. SUT 봇은 Telegram 사용자 이름이 있어야 하며, 두 봇 모두 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화했을 때 봇 간 관찰이 가장 잘 동작합니다.

이제 라이브 전송 레인들은 각자 고유한 시나리오 목록 구조를 정의하는 대신, 하나의 더 작은 공용 계약을 공유합니다.

`qa-channel`은 여전히 폭넓은 합성 제품 동작 스위트이며 라이브 전송 커버리지 매트릭스에는 포함되지 않습니다.

| 레인     | 카나리아 | 멘션 게이팅 | 허용 목록 차단 | 최상위 답장 | 재시작 복구 | 스레드 후속 응답 | 스레드 격리 | 리액션 관찰 | 도움말 명령 |
| -------- | -------- | ----------- | -------------- | ----------- | ----------- | ---------------- | ----------- | ----------- | ----------- |
| Matrix   | x        | x           | x              | x           | x           | x                | x           | x           |             |
| Telegram | x        |             |                |             |             |                  |             |             | x           |

이를 통해 `qa-channel`은 폭넓은 제품 동작 스위트로 유지되고, Matrix, Telegram, 그리고 향후 라이브 전송 계층들은 하나의 명시적인 전송 계약 체크리스트를 공유하게 됩니다.

QA 경로에 Docker를 포함하지 않는 일회용 Linux VM 레인을 실행하려면 다음을 사용하세요:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass 게스트를 부팅하고, 의존성을 설치하고, 게스트 내부에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 다시 복사합니다.  
시나리오 선택 동작은 호스트에서의 `qa suite`와 동일하게 재사용합니다.  
호스트와 Multipass 스위트 실행은 기본적으로 선택된 여러 시나리오를 격리된 게이트웨이 워커로 병렬 실행하며, 최대 64개 워커 또는 선택된 시나리오 수만큼 실행합니다. 워커 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행하려면 `--concurrency 1`을 사용하세요.  
라이브 실행은 게스트에서 실용적으로 전달 가능한 지원 QA 인증 입력을 전달합니다: env 기반 provider 키, QA 라이브 provider 설정 경로, 그리고 존재하는 경우 `CODEX_HOME`입니다. 게스트가 마운트된 워크스페이스를 통해 다시 쓸 수 있도록 `--output-dir`은 리포지토리 루트 아래에 유지하세요.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

이 파일들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함됩니다. 기준 목록은 다음을 포괄할 만큼 충분히 넓어야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명 주기
- cron 콜백
- 메모리 회상
- 모델 전환
- 서브에이전트 핸드오프
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 보고

`qa-lab`은 관찰된 버스 타임라인으로부터 Markdown 프로토콜 보고서를 내보냅니다.  
이 보고서는 다음에 답해야 합니다:

- 무엇이 잘 작동했는가
- 무엇이 실패했는가
- 무엇이 여전히 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

캐릭터 및 스타일 검사를 위해, 동일한 시나리오를 여러 라이브 모델 ref에 걸쳐 실행하고 평가된 Markdown 보고서를 작성하세요:

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

이 명령은 Docker가 아니라 로컬 QA 게이트웨이 자식 프로세스를 실행합니다. 캐릭터 평가 시나리오는 `SOUL.md`를 통해 페르소나를 설정한 뒤, 채팅, 워크스페이스 도움말, 작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는 자신이 평가 중이라는 사실을 알려서는 안 됩니다. 이 명령은 각 전체 대화 내용을 보존하고, 기본 실행 통계를 기록한 뒤, 자연스러움, 분위기, 유머를 기준으로 실행 결과의 순위를 매기도록 빠른 모드의 심사 모델에 `xhigh` 추론과 함께 요청합니다.  
provider를 비교할 때는 `--blind-judge-models`를 사용하세요. 이 경우 심사 프롬프트는 여전히 모든 대화 내용과 실행 상태를 받지만, 후보 ref는 `candidate-01` 같은 중립적인 레이블로 대체됩니다. 보고서는 파싱 후 순위를 실제 ref에 다시 매핑합니다.  
후보 실행은 기본적으로 `high` 사고 수준을 사용하며, 이를 지원하는 OpenAI 모델은 `xhigh`를 사용합니다. 특정 후보를 개별적으로 재정의하려면 `--model provider/model,thinking=<level>`을 사용하세요. `--thinking <level>`은 여전히 전역 폴백을 설정하며, 이전의 `--model-thinking <provider/model=level>` 형식도 호환성을 위해 유지됩니다.  
OpenAI 후보 ref는 provider가 이를 지원하는 경우 우선 처리에 빠른 모드를 기본 적용합니다. 특정 후보나 심사자에 대해 재정의가 필요하면 `,fast`, `,no-fast`, 또는 `,fast=false`를 인라인으로 추가하세요. 모든 후보 모델에 빠른 모드를 강제로 켜고 싶을 때만 `--fast`를 전달하세요. 후보와 심사자의 실행 시간은 벤치마크 분석을 위해 보고서에 기록되지만, 심사 프롬프트에는 속도로 순위를 매기지 말라고 명시되어 있습니다.  
후보와 심사 모델 실행은 모두 기본적으로 동시성 16을 사용합니다. provider 제한이나 로컬 게이트웨이 부하 때문에 실행이 너무 불안정해지면 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.  
후보 `--model`이 전달되지 않으면, 캐릭터 평가는 기본적으로 `openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5`, `google/gemini-3.1-pro-preview`를 사용합니다.  
심사 `--judge-model`이 전달되지 않으면, 기본 심사자는 `openai/gpt-5.4,thinking=xhigh,fast`와 `anthropic/claude-opus-4-6,thinking=high`입니다.

## 관련 문서

- [테스팅](/ko/help/testing)
- [QA Channel](/ko/channels/qa-channel)
- [대시보드](/web/dashboard)
