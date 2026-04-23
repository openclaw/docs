---
read_when:
    - QA 시나리오 정의 또는 qa-lab 하니스 코드 리팩터링
    - Markdown 시나리오와 TypeScript 하니스 로직 간 QA 동작 이동
summary: 시나리오 카탈로그와 하니스 통합을 위한 QA 리팩터 계획
title: QA 리팩터링
x-i18n:
    generated_at: "2026-04-23T14:08:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# QA 리팩터링

상태: 기반 마이그레이션 반영 완료.

## 목표

OpenClaw QA를 분리된 정의 모델에서 단일 source of truth로 이동합니다:

- 시나리오 메타데이터
- 모델에 전송되는 프롬프트
- 설정 및 정리
- 하니스 로직
- assertion 및 성공 기준
- 아티팩트 및 리포트 힌트

목표하는 최종 상태는, 대부분의 동작을 TypeScript에 하드코딩하는 대신 강력한 시나리오 정의 파일을 로드하는 범용 QA 하니스입니다.

## 현재 상태

이제 기본 source of truth는 `qa/scenarios/index.md`와
`qa/scenarios/<theme>/*.md` 아래의 시나리오별 파일에 있습니다.

구현 완료:

- `qa/scenarios/index.md`
  - 정식 QA pack 메타데이터
  - operator identity
  - kickoff 미션
- `qa/scenarios/<theme>/*.md`
  - 시나리오별 markdown 파일 하나
  - 시나리오 메타데이터
  - 핸들러 바인딩
  - 시나리오별 실행 config
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown pack parser + zod 검증
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - markdown pack에서 plan 렌더링
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 생성된 호환성 파일 및 `QA_SCENARIOS.md` 시드
- `extensions/qa-lab/src/suite.ts`
  - markdown로 정의된 핸들러 바인딩을 통해 실행 가능한 시나리오 선택
- QA bus protocol + UI
  - 이미지/비디오/오디오/파일 렌더링을 위한 범용 inline attachment

여전히 분리된 surface:

- `extensions/qa-lab/src/suite.ts`
  - 여전히 대부분의 실행 가능한 사용자 정의 핸들러 로직을 소유
- `extensions/qa-lab/src/report.ts`
  - 여전히 런타임 출력에서 리포트 구조를 파생

즉 source-of-truth 분리는 해결되었지만, 실행은 아직 완전한 선언형보다는 핸들러 기반이 중심입니다.

## 실제 시나리오 surface의 모습

현재 suite를 읽어보면 몇 가지 뚜렷한 시나리오 클래스가 보입니다.

### 단순 상호작용

- 채널 baseline
- DM baseline
- 스레드 후속 응답
- 모델 전환
- 승인 후속 진행
- 반응/편집/삭제

### Config 및 런타임 변경

- config patch skill 비활성화
- config apply 재시작 wake-up
- config 재시작 capability 전환
- 런타임 inventory drift 검사

### 파일시스템 및 저장소 assertion

- source/docs discovery 리포트
- build Lobster Invaders
- 생성된 이미지 아티팩트 조회

### 메모리 오케스트레이션

- 메모리 회상
- 채널 컨텍스트의 메모리 도구
- 메모리 실패 폴백
- 세션 메모리 순위
- 스레드 메모리 격리
- memory Dreaming sweep

### 도구 및 plugin 통합

- MCP plugin-tools 호출
- Skills 가시성
- Skill hot install
- 네이티브 이미지 생성
- 이미지 왕복
- 첨부에서의 이미지 이해

### 다중 턴 및 다중 행위자

- subagent handoff
- subagent fanout synthesis
- 재시작 복구 스타일 흐름

이 범주는 DSL 요구 사항을 좌우하므로 중요합니다. 단순한 프롬프트 + 기대 텍스트 목록만으로는 충분하지 않습니다.

## 방향

### 단일 source of truth

`qa/scenarios/index.md`와 `qa/scenarios/<theme>/*.md`를 작성된
source of truth로 사용합니다.

이 pack은 다음 특성을 유지해야 합니다:

- 리뷰에서 사람이 읽기 쉬움
- 기계가 parse 가능함
- 다음을 구동할 만큼 충분히 풍부함:
  - suite 실행
  - QA workspace bootstrap
  - QA Lab UI 메타데이터
  - docs/discovery 프롬프트
  - 리포트 생성

### 선호하는 작성 형식

최상위 형식은 markdown을 사용하고, 내부에 구조화된 YAML을 둡니다.

권장 형태:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider 재정의
  - prerequisites
- prose 섹션
  - objective
  - notes
  - 디버깅 힌트
- fenced YAML 블록
  - setup
  - steps
  - assertions
  - cleanup

이 방식의 장점:

- 거대한 JSON보다 PR 가독성이 좋음
- 순수 YAML보다 컨텍스트가 풍부함
- 엄격한 parsing 및 zod 검증 가능

원시 JSON은 중간 생성 형식으로만 허용됩니다.

## 제안하는 시나리오 파일 형태

예시:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## DSL이 다뤄야 하는 runner capability

현재 suite를 기준으로 보면, 범용 runner는 단순한 프롬프트 실행 이상의 기능이 필요합니다.

### 환경 및 설정 action

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Agent 턴 action

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Config 및 런타임 action

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 파일 및 아티팩트 action

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### 메모리 및 Cron action

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP action

- `mcp.callTool`

### Assertion

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## 변수 및 아티팩트 참조

DSL은 저장된 출력과 이후 참조를 지원해야 합니다.

현재 suite의 예시:

- 스레드를 생성한 뒤 `threadId` 재사용
- 세션을 생성한 뒤 `sessionKey` 재사용
- 이미지를 생성한 뒤 다음 턴에서 그 파일을 첨부
- wake marker 문자열을 생성한 뒤 나중에 나타나는지 assertion

필요한 capability:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 경로, 세션 키, 스레드 id, marker, 도구 출력용 타입 지정 참조

변수 지원이 없으면 하니스는 시나리오 로직을 계속 TypeScript 쪽으로 새어나가게 됩니다.

## 이스케이프 해치로 남겨둘 것

1단계에서 완전히 순수한 선언형 runner는 현실적이지 않습니다.

일부 시나리오는 본질적으로 오케스트레이션 중심입니다:

- memory Dreaming sweep
- config apply 재시작 wake-up
- config 재시작 capability 전환
- 타임스탬프/경로 기준 생성 이미지 아티팩트 확인
- discovery-report 평가

이들은 당분간 명시적인 사용자 정의 핸들러를 사용해야 합니다.

권장 규칙:

- 85~90% 선언형
- 어려운 나머지를 위한 명시적 `customHandler` step
- 이름이 있고 문서화된 사용자 정의 핸들러만 허용
- 시나리오 파일 안에 익명 inline code 금지

이렇게 하면 범용 엔진을 깔끔하게 유지하면서도 계속 진전할 수 있습니다.

## 아키텍처 변경

### 현재

시나리오 markdown은 이미 다음의 source of truth입니다:

- suite 실행
- workspace bootstrap 파일
- QA Lab UI 시나리오 카탈로그
- 리포트 메타데이터
- discovery 프롬프트

생성된 호환성 항목:

- 시드된 workspace는 여전히 `QA_KICKOFF_TASK.md`를 포함
- 시드된 workspace는 여전히 `QA_SCENARIO_PLAN.md`를 포함
- 시드된 workspace는 이제 `QA_SCENARIOS.md`도 포함

## 리팩터링 계획

### 1단계: loader 및 스키마

완료.

- `qa/scenarios/index.md` 추가
- 시나리오를 `qa/scenarios/<theme>/*.md`로 분리
- 이름 있는 markdown YAML pack 콘텐츠용 parser 추가
- zod로 검증
- consumer를 parse된 pack으로 전환
- 저장소 수준 `qa/seed-scenarios.json` 및 `qa/QA_KICKOFF_TASK.md` 제거

### 2단계: 범용 엔진

- `extensions/qa-lab/src/suite.ts`를 다음으로 분리:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 기존 helper 함수를 엔진 연산으로 유지

산출물:

- 엔진이 단순 선언형 시나리오를 실행

프롬프트 + 대기 + assertion 중심인 시나리오부터 시작:

- 스레드 후속 응답
- 첨부에서의 이미지 이해
- Skills 가시성 및 호출
- 채널 baseline

산출물:

- 첫 번째 실제 markdown 정의 시나리오가 범용 엔진을 통해 배포됨

### 4단계: 중간 난이도 시나리오 마이그레이션

- 이미지 생성 왕복
- 채널 컨텍스트의 메모리 도구
- 세션 메모리 순위
- subagent handoff
- subagent fanout synthesis

산출물:

- 변수, 아티팩트, 도구 assertion, request-log assertion이 실제로 검증됨

### 5단계: 어려운 시나리오는 사용자 정의 핸들러 유지

- memory Dreaming sweep
- config apply 재시작 wake-up
- config 재시작 capability 전환
- 런타임 inventory drift

산출물:

- 동일한 작성 형식 유지, 단 어려운 경우에는 명시적인 custom-step 블록 사용

### 6단계: 하드코딩된 시나리오 맵 삭제

pack 커버리지가 충분해지면:

- `extensions/qa-lab/src/suite.ts`에서 대부분의 시나리오별 TypeScript 분기 제거

## Fake Slack / 리치 미디어 지원

현재 QA bus는 텍스트 우선입니다.

관련 파일:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

현재 QA bus가 지원하는 것:

- 텍스트
- 반응
- 스레드

아직 inline media attachment는 모델링하지 않습니다.

### 필요한 전송 계약

범용 QA bus attachment 모델을 추가합니다:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

그다음 `attachments?: QaBusAttachment[]`를 다음에 추가합니다:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 먼저 범용으로 가야 하는 이유

Slack 전용 미디어 모델을 만들지 마세요.

대신:

- 하나의 범용 QA 전송 모델
- 그 위에 여러 renderer
  - 현재 QA Lab 채팅
  - 미래의 fake Slack 웹
  - 그 외 다른 fake transport view

이렇게 하면 로직 중복을 막고 미디어 시나리오를 transport 불가지론적으로 유지할 수 있습니다.

### 필요한 UI 작업

QA UI가 다음을 렌더링하도록 업데이트합니다:

- inline 이미지 미리보기
- inline 오디오 플레이어
- inline 비디오 플레이어
- 파일 attachment 칩

현재 UI는 이미 스레드와 반응을 렌더링할 수 있으므로, attachment 렌더링은 같은 메시지 카드 모델 위에 얹을 수 있어야 합니다.

### 미디어 전송이 가능하게 하는 시나리오 작업

attachment가 QA bus를 통해 흐르면 더 풍부한 fake-chat 시나리오를 추가할 수 있습니다:

- fake Slack에서 inline 이미지 응답
- 오디오 attachment 이해
- 비디오 attachment 이해
- 혼합 attachment 순서
- 미디어가 유지되는 스레드 응답

## 권장 사항

다음 구현 덩어리는 다음이어야 합니다:

1. markdown 시나리오 loader + zod 스키마 추가
2. markdown에서 현재 카탈로그 생성
3. 몇 개의 단순 시나리오부터 먼저 마이그레이션
4. 범용 QA bus attachment 지원 추가
5. QA UI에서 inline 이미지 렌더링
6. 그다음 오디오와 비디오로 확장

이것이 두 목표를 모두 입증하는 가장 작은 경로입니다:

- 범용 markdown 정의 QA
- 더 풍부한 fake 메시징 surface

## 열린 질문

- 시나리오 파일이 변수 보간이 포함된 내장 markdown 프롬프트 템플릿을 허용해야 하는지
- setup/cleanup가 이름 있는 섹션이어야 하는지, 아니면 단순한 순서형 action 목록이어야 하는지
- 아티팩트 참조가 스키마에서 강한 타입이어야 하는지, 아니면 문자열 기반이어야 하는지
- 사용자 정의 핸들러가 하나의 registry에 있어야 하는지, surface별 registry에 있어야 하는지
- 생성된 JSON 호환성 파일을 마이그레이션 중에도 계속 체크인 상태로 유지해야 하는지
