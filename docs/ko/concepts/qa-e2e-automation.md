---
read_when:
    - qa-lab 또는 qa-channel 확장
    - 리포지토리 기반 QA 시나리오 추가
    - Gateway 대시보드를 중심으로 더 높은 현실성의 QA 자동화 구축
summary: qa-lab, qa-channel, 시드된 시나리오 및 프로토콜 보고서를 위한 비공개 QA 자동화 구조
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-23T14:02:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 자동화

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고 채널 형태에 가까운 방식으로 OpenClaw를 검증하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드, 리액션, 수정, 삭제 표면을 갖는 합성 메시지 채널
- `extensions/qa-lab`: transcript 관찰, inbound 메시지 주입, Markdown 보고서 내보내기를 위한 디버거 UI 및 QA 버스
- `qa/`: 시작 작업 및 기본 QA 시나리오를 위한 리포지토리 기반 시드 자산

현재 QA 운영자 흐름은 2패널 QA 사이트입니다.

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack 유사 transcript와 시나리오 계획을 보여주는 QA Lab

실행:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 gateway lane을 시작하며, 운영자 또는 자동화 루프가 에이전트에 QA 미션을 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했고 실패했으며 막혀 있었는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

Docker 이미지를 매번 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복 개발하려면, 바인드 마운트된 QA Lab 번들로 스택을 시작하세요.

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 사전 빌드된 이미지로 Docker 서비스를 유지하고 `extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는 변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 바뀌면 브라우저가 자동으로 다시 로드됩니다.

전송 계층이 실제인 Matrix 스모크 lane을 실행하려면:

```bash
pnpm openclaw qa matrix
```

이 lane은 Docker에서 일회용 Tuwunel homeserver를 프로비저닝하고, 임시 driver, SUT, observer 사용자를 등록하고, 하나의 비공개 room을 만든 뒤, 실제 Matrix Plugin을 QA gateway child 내부에서 실행합니다. 라이브 전송 lane은 child config를 테스트 중인 전송으로 제한하므로, Matrix는 child config에서 `qa-channel` 없이 실행됩니다. 구조화된 보고서 아티팩트와 stdout/stderr 통합 로그를 선택한 Matrix QA 출력 디렉터리에 기록합니다. 바깥쪽 `scripts/run-node.mjs` 빌드/실행기 출력까지 캡처하려면 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>`를 리포지토리 로컬 로그 파일로 설정하세요.

전송 계층이 실제인 Telegram 스모크 lane을 실행하려면:

```bash
pnpm openclaw qa telegram
```

이 lane은 일회용 서버를 프로비저닝하는 대신 실제 비공개 Telegram 그룹 하나를 대상으로 합니다. `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`이 필요하며, 같은 비공개 그룹 안에 서로 다른 두 봇이 있어야 합니다. SUT 봇에는 Telegram 사용자명이 있어야 하며, 두 봇 모두 `@BotFather`에서 Bot-to-Bot Communication Mode를 활성화하면 봇 간 관찰이 가장 잘 작동합니다.
어떤 시나리오라도 실패하면 명령은 0이 아닌 종료 코드를 반환합니다. 실패 종료 코드 없이 아티팩트만 원하면 `--allow-failures`를 사용하세요.
Telegram 보고서와 요약에는 카나리부터 시작하여 driver 메시지 전송 요청 시점부터 관찰된 SUT 답글 시점까지의 답글별 RTT가 포함됩니다.

이제 라이브 전송 lane은 각자 고유한 시나리오 목록 형식을 만드는 대신 더 작은 하나의 공통 계약을 공유합니다.

`qa-channel`은 여전히 폭넓은 합성 제품 동작 스위트이며 라이브 전송 커버리지 매트릭스에는 포함되지 않습니다.

| Lane | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| ---- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix | x | x | x | x | x | x | x | x |  |
| Telegram | x |  |  |  |  |  |  |  | x |

이렇게 하면 `qa-channel`은 폭넓은 제품 동작 스위트로 유지되고, Matrix, Telegram 및 향후 라이브 전송은 하나의 명시적인 전송 계약 체크리스트를 공유하게 됩니다.

Docker를 QA 경로에 포함하지 않는 일회용 Linux VM lane을 실행하려면:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

이 명령은 새 Multipass guest를 부팅하고, guest 내부에 의존성을 설치하고, guest 안에서 OpenClaw를 빌드하고, `qa suite`를 실행한 다음, 일반 QA 보고서와 요약을 호스트의 `.artifacts/qa-e2e/...`로 복사합니다.
시나리오 선택 동작은 호스트에서의 `qa suite`와 동일합니다.
호스트와 Multipass suite 실행은 기본적으로 여러 선택 시나리오를 격리된 gateway worker와 함께 병렬 실행합니다. `qa-channel`은 기본 동시성 4를 사용하며, 선택한 시나리오 수를 상한으로 둡니다. worker 수를 조정하려면 `--concurrency <count>`를 사용하고, 직렬 실행하려면 `--concurrency 1`을 사용하세요.
어떤 시나리오라도 실패하면 명령은 0이 아닌 종료 코드를 반환합니다. 실패 종료 코드 없이 아티팩트만 원하면 `--allow-failures`를 사용하세요.
라이브 실행은 guest에 실용적으로 전달 가능한 지원 QA auth 입력을 전달합니다. 여기에는 env 기반 provider 키, QA live provider config 경로, 그리고 존재할 경우 `CODEX_HOME`이 포함됩니다. guest가 마운트된 workspace를 통해 다시 쓸 수 있도록 `--output-dir`은 리포지토리 루트 아래에 두세요.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다.

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

이들은 QA 계획이 사람과 에이전트 모두에게 보이도록 의도적으로 git에 포함됩니다.

`qa-lab`은 일반적인 markdown 실행기로 유지되어야 합니다. 각 시나리오 markdown 파일은 하나의 테스트 실행에 대한 단일 진실 공급원이어야 하며, 다음을 정의해야 합니다.

- 시나리오 메타데이터
- 선택적 category, capability, lane, risk 메타데이터
- docs 및 code 참조
- 선택적 Plugin 요구 사항
- 선택적 gateway config 패치
- 실행 가능한 `qa-flow`

`qa-flow`를 뒷받침하는 재사용 가능한 런타임 표면은 일반적이고 교차 기능적으로 유지될 수 있습니다. 예를 들어 markdown 시나리오는 특수한 실행기를 추가하지 않고도 전송 측 헬퍼와 브라우저 측 헬퍼를 조합해, Gateway `browser.request` seam을 통해 임베드된 Control UI를 구동할 수 있습니다.

시나리오 파일은 소스 트리 폴더가 아니라 제품 기능 기준으로 그룹화해야 합니다. 파일이 이동하더라도 시나리오 ID는 안정적으로 유지하세요. 구현 추적 가능성을 위해 `docsRefs`와 `codeRefs`를 사용하세요.

기본 목록은 다음을 포괄할 만큼 충분히 넓어야 합니다.

- DM 및 채널 채팅
- 스레드 동작
- 메시지 액션 수명 주기
- Cron 콜백
- 메모리 회상
- 모델 전환
- subagent 핸드오프
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## Provider mock lane

`qa suite`에는 두 개의 로컬 provider mock lane이 있습니다.

- `mock-openai`는 시나리오를 인식하는 OpenClaw mock입니다. 리포지토리 기반 QA 및 패리티 게이트를 위한 기본 결정적 mock lane으로 유지됩니다.
- `aimock`은 실험적 프로토콜, 픽스처, 기록/재생, 카오스 커버리지를 위해 AIMock 기반 provider 서버를 시작합니다. 이는 추가 기능이며 `mock-openai` 시나리오 디스패처를 대체하지 않습니다.

provider lane 구현은 `extensions/qa-lab/src/providers/` 아래에 있습니다.
각 provider는 자체 기본값, 로컬 서버 시작, gateway 모델 config, auth-profile 스테이징 필요 사항, 라이브/mock 기능 플래그를 소유합니다. 공유 suite 및 gateway 코드는 provider 이름으로 분기하지 말고 provider 레지스트리를 통해 라우팅해야 합니다.

## 전송 어댑터

`qa-lab`은 markdown QA 시나리오를 위한 일반적인 전송 seam을 소유합니다.
`qa-channel`은 이 seam 위의 첫 번째 어댑터이지만, 설계 목표는 더 넓습니다. 향후 실제 또는 합성 채널은 전송별 QA 실행기를 추가하는 대신 동일한 suite 실행기에 연결되어야 합니다.

아키텍처 수준에서 분리는 다음과 같습니다.

- `qa-lab`은 일반적인 시나리오 실행, worker 동시성, 아티팩트 기록, 보고를 소유합니다.
- 전송 어댑터는 gateway config, 준비 상태, inbound/outbound 관찰, 전송 액션, 정규화된 전송 상태를 소유합니다.
- `qa/scenarios/` 아래 markdown 시나리오 파일이 테스트 실행을 정의하고, `qa-lab`은 이를 실행하는 재사용 가능한 런타임 표면을 제공합니다.

새 채널 어댑터를 위한 유지보수자용 도입 가이드는 [Testing](/ko/help/testing#adding-a-channel-to-qa)에 있습니다.

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음에 답해야 합니다.

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 계속 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

캐릭터 및 스타일 점검의 경우, 동일한 시나리오를 여러 라이브 모델 ref로 실행하고 판정된 Markdown 보고서를 작성하세요.

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

이 명령은 Docker가 아니라 로컬 QA gateway child 프로세스를 실행합니다. character eval 시나리오는 `SOUL.md`를 통해 페르소나를 설정한 다음, 채팅, workspace 도움말, 작은 파일 작업 같은 일반 사용자 턴을 실행해야 합니다. 후보 모델에는 자신이 평가 중이라는 사실을 알려주지 않아야 합니다. 이 명령은 각 전체 transcript를 보존하고, 기본 실행 통계를 기록한 뒤, 자연스러움, vibe, humor 기준으로 실행 순위를 매기도록 판정 모델에 fast 모드와 `xhigh` 추론으로 요청합니다.
provider를 비교할 때는 `--blind-judge-models`를 사용하세요. 이 경우 판정 프롬프트는 여전히 모든 transcript와 실행 상태를 받지만, 후보 ref는 `candidate-01` 같은 중립 레이블로 대체되며, 보고서는 파싱 후 순위를 실제 ref로 다시 매핑합니다.
후보 실행은 기본적으로 `high` thinking을 사용하며, 이를 지원하는 OpenAI 모델에는 `xhigh`를 사용합니다. 특정 후보를 개별적으로 재정의하려면 `--model provider/model,thinking=<level>`을 사용하세요. `--thinking <level>`은 여전히 전역 fallback을 설정하며, 이전 `--model-thinking <provider/model=level>` 형식도 호환성을 위해 유지됩니다.
OpenAI 후보 ref는 기본적으로 fast 모드를 사용하므로, provider가 이를 지원하는 경우 우선 처리됩니다. 특정 후보 또는 판정자만 재정의해야 하면 인라인으로 `,fast`, `,no-fast`, 또는 `,fast=false`를 추가하세요. 모든 후보 모델에 fast 모드를 강제로 적용하려는 경우에만 `--fast`를 전달하세요. 후보와 판정자 실행 시간은 벤치마크 분석을 위해 보고서에 기록되지만, 판정 프롬프트는 속도로 순위를 매기지 말라고 명시합니다.
후보 및 판정 모델 실행은 모두 기본 동시성 16을 사용합니다. provider 한도 또는 로컬 gateway 부하로 인해 실행이 너무 불안정해지면 `--concurrency` 또는 `--judge-concurrency`를 낮추세요.
후보 `--model`이 전달되지 않으면 character eval의 기본값은 `openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5`, `google/gemini-3.1-pro-preview`입니다.
`--judge-model`이 전달되지 않으면 판정자의 기본값은 `openai/gpt-5.4,thinking=xhigh,fast` 및 `anthropic/claude-opus-4-6,thinking=high`입니다.

## 관련 문서

- [Testing](/ko/help/testing)
- [QA Channel](/ko/channels/qa-channel)
- [Dashboard](/ko/web/dashboard)
