---
read_when:
    - Codex harness에 context-engine lifecycle 동작을 연결하는 작업을 진행 중입니다
    - codex/* 내장 harness 세션에서 lossless-claw 또는 다른 context-engine Plugin이 동작하도록 해야 합니다
    - 내장 Pi와 Codex app-server의 context 동작을 비교 중입니다
summary: 번들 Codex app-server harness가 OpenClaw context-engine Plugin을 따르도록 만들기 위한 사양
title: Codex Harness Context Engine 포트
x-i18n:
    generated_at: "2026-04-25T06:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## 상태

초안 구현 사양입니다.

## 목표

번들 Codex app-server harness가 내장 Pi 턴이 이미 따르고 있는 것과 동일한 OpenClaw context-engine
lifecycle 계약을 따르도록 만듭니다.

`agents.defaults.embeddedHarness.runtime: "codex"` 또는
`codex/*` 모델을 사용하는 세션도 선택된 context-engine Plugin(예:
`lossless-claw`)이 Codex app-server 경계가 허용하는 범위 내에서
컨텍스트 조립, 턴 후 ingest, 유지 관리, OpenClaw 수준 Compaction 정책을 제어할 수 있어야 합니다.

## 비목표

- Codex app-server 내부를 재구현하지 않습니다.
- Codex 네이티브 스레드 Compaction이 lossless-claw 요약을 생성하도록 만들지 않습니다.
- non-Codex 모델이 Codex harness를 사용하도록 요구하지 않습니다.
- ACP/acpx 세션 동작을 변경하지 않습니다. 이 사양은
  non-ACP 내장 에이전트 harness 경로 전용입니다.
- 서드파티 Plugin이 Codex app-server extension factory를 등록하도록 만들지 않습니다.
  기존 번들 Plugin 신뢰 경계는 그대로 유지됩니다.

## 현재 아키텍처

내장 실행 루프는 구체적인 저수준 harness를 선택하기 전에 실행당 한 번
구성된 context engine을 해석합니다:

- `src/agents/pi-embedded-runner/run.ts`
  - context-engine Plugin 초기화
  - `resolveContextEngine(params.config)` 호출
  - `contextEngine`과 `contextTokenBudget`을
    `runEmbeddedAttemptWithBackend(...)`에 전달

`runEmbeddedAttemptWithBackend(...)`는 선택된 에이전트 harness에 위임합니다:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness는 번들 Codex Plugin에 의해 등록됩니다:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness 구현은 Pi 기반 attempt와 동일한 `EmbeddedRunAttemptParams`를 받습니다:

- `extensions/codex/src/app-server/run-attempt.ts`

즉, 필요한 hook 지점은 OpenClaw가 제어하는 코드에 있습니다. 외부
경계는 Codex app-server 프로토콜 자체입니다. OpenClaw는
`thread/start`, `thread/resume`, `turn/start`에 무엇을 보낼지 제어하고
notification을 관찰할 수는 있지만, Codex의 내부 스레드 저장소나 네이티브 compactor는 변경할 수 없습니다.

## 현재 격차

내장 Pi attempt는 context-engine lifecycle을 직접 호출합니다:

- attempt 전 bootstrap/유지 관리
- 모델 호출 전 assemble
- attempt 후 afterTurn 또는 ingest
- 성공한 턴 후 유지 관리
- Compaction을 소유하는 엔진에 대한 context-engine Compaction

관련 Pi 코드:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server attempt는 현재 일반 에이전트 harness hook을 실행하고
transcript를 미러링하지만, `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, 또는
`params.contextEngine.maintain`은 호출하지 않습니다.

관련 Codex 코드:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 원하는 동작

Codex harness 턴에 대해 OpenClaw는 다음 lifecycle을 보존해야 합니다:

1. 미러링된 OpenClaw 세션 transcript를 읽습니다.
2. 이전 세션 파일이 존재하면 활성 context engine을 bootstrap합니다.
3. 가능하면 bootstrap 유지 관리를 실행합니다.
4. 활성 context engine을 사용해 컨텍스트를 assemble합니다.
5. assemble된 컨텍스트를 Codex 호환 입력으로 변환합니다.
6. context-engine `systemPromptAddition`이 포함된 developer instruction으로
   Codex 스레드를 시작하거나 재개합니다.
7. assemble된 사용자 대상 prompt로 Codex 턴을 시작합니다.
8. Codex 결과를 OpenClaw transcript에 다시 미러링합니다.
9. 구현되어 있으면 `afterTurn`을 호출하고, 아니면 미러링된 transcript 스냅샷을 사용해
   `ingestBatch`/`ingest`를 호출합니다.
10. 성공했고 중단되지 않은 턴 후 턴 유지 관리를 실행합니다.
11. Codex 네이티브 Compaction 신호와 OpenClaw Compaction hook을 보존합니다.

## 설계 제약

### Codex app-server는 네이티브 스레드 state의 기준으로 유지됨

Codex는 자체 네이티브 스레드와 내부 확장 기록을 소유합니다. OpenClaw는
지원되는 프로토콜 호출 외의 방식으로 app-server의 내부 기록을 변경하려 해서는 안 됩니다.

OpenClaw의 transcript 미러는 OpenClaw 기능의 소스로 유지됩니다:

- 채팅 기록
- 검색
- `/new` 및 `/reset` bookkeeping
- 향후 모델 또는 harness 전환
- context-engine Plugin state

### context engine assemble은 Codex 입력으로 투영되어야 함

context-engine 인터페이스는 Codex 스레드 패치가 아니라 OpenClaw `AgentMessage[]`를 반환합니다. Codex app-server의 `turn/start`는 현재 사용자 입력을 받는 반면,
`thread/start`와 `thread/resume`은 developer instruction을 받습니다.

따라서 구현에는 projection 계층이 필요합니다. 안전한 첫 번째 버전은
Codex 내부 기록을 대체할 수 있는 척하지 않아야 합니다. assemble된
컨텍스트를 현재 턴 주변의 결정적인 prompt/developer-instruction 자료로 주입해야 합니다.

### prompt-cache 안정성이 중요함

lossless-claw 같은 엔진의 경우 assemble된 컨텍스트는
입력이 바뀌지 않으면 결정적이어야 합니다. 생성된 컨텍스트 텍스트에 타임스탬프,
무작위 ID 또는 비결정적 순서를 추가하지 마세요.

### Pi fallback 의미는 바뀌지 않음

harness 선택은 그대로 유지됩니다:

- `runtime: "pi"`는 Pi를 강제
- `runtime: "codex"`는 등록된 Codex harness를 선택
- `runtime: "auto"`는 Plugin harness가 지원되는 provider를 claim하도록 허용
- `fallback: "none"`은 일치하는 Plugin harness가 없을 때 Pi fallback을 비활성화

이 작업은 Codex harness가 선택된 후에 일어나는 일을 변경합니다.

## 구현 계획

### 1. 재사용 가능한 context-engine attempt helper를 export하거나 재배치

현재 재사용 가능한 lifecycle helper는 Pi runner 아래에 있습니다:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

가능하다면 Codex가 이름상 Pi를 암시하는 구현 경로에서 import하지 않도록 해야 합니다.

예를 들어 harness 중립 모듈을 만듭니다:

- `src/agents/harness/context-engine-lifecycle.ts`

다음을 이동하거나 재-export합니다:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance`를 감싸는 작은 wrapper

이전 파일에서 재-export하거나 같은 PR에서 Pi
호출 지점을 업데이트하여 Pi import가 계속 작동하도록 유지합니다.

중립 helper 이름에는 Pi가 들어가지 않아야 합니다.

권장 이름:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex context projection helper 추가

새 모듈을 추가합니다:

- `extensions/codex/src/app-server/context-engine-projection.ts`

책임:

- assemble된 `AgentMessage[]`, 원본 미러링 기록, 현재
  prompt를 받습니다.
- 어떤 컨텍스트가 developer instruction에 들어가고 어떤 것이 현재 사용자
  입력에 들어가는지 결정합니다.
- 현재 사용자 prompt를 최종 실행 가능한 요청으로 보존합니다.
- 이전 메시지를 안정적이고 명시적인 형식으로 렌더링합니다.
- 변동성 있는 메타데이터를 피합니다.

제안 API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

권장되는 첫 번째 projection:

- `systemPromptAddition`은 developer instruction에 넣습니다.
- assemble된 transcript 컨텍스트는 현재 prompt 앞의 `promptText`에 넣습니다.
- 이를 OpenClaw assemble 컨텍스트로 명확히 표시합니다.
- 현재 prompt는 마지막에 유지합니다.
- 현재 사용자 prompt가 이미 끝부분에 중복되어 있으면 제외합니다.

예시 prompt 형태:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

이 방식은 네이티브 Codex 기록 수정보다 덜 우아하지만, OpenClaw 내부에서 구현 가능하며 context-engine 의미를 보존합니다.

향후 개선: Codex app-server가 스레드 기록을 교체하거나 보완하는 프로토콜을 노출하면, 이 projection 계층을 해당 API를 사용하도록 바꿉니다.

### 3. Codex 스레드 시작 전에 bootstrap 연결

`extensions/codex/src/app-server/run-attempt.ts`에서:

- 현재처럼 미러링된 세션 기록을 읽습니다.
- 이 실행 전에 세션 파일이 존재했는지 판단합니다. 미러링 쓰기 전에
  `fs.stat(params.sessionFile)`를 확인하는 helper를 우선 사용하세요.
- `SessionManager`를 열거나, helper가 필요로 한다면 좁은 session manager adapter를 사용하세요.
- `params.contextEngine`이 존재할 때 중립 bootstrap helper를 호출합니다.

의사 흐름:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Codex 도구 브리지 및 transcript 미러와 같은 `sessionKey` 규칙을 사용하세요. 현재 Codex는 `params.sessionKey` 또는
`params.sessionId`에서 `sandboxSessionKey`를 계산하므로, 원시 `params.sessionKey`를 보존해야 할 이유가 없는 한 이를 일관되게 사용하세요.

### 4. `thread/start` / `thread/resume` 및 `turn/start` 전에 assemble 연결

`runCodexAppServerAttempt`에서:

1. 실제 사용 가능한 도구 이름을 context engine이 볼 수 있도록 먼저 동적 도구를 빌드합니다.
2. 미러링된 세션 기록을 읽습니다.
3. `params.contextEngine`이 존재하면 context-engine `assemble(...)`을 실행합니다.
4. assemble된 결과를 다음으로 projection합니다:
   - developer instruction 추가분
   - `turn/start`용 prompt 텍스트

기존 hook 호출:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

는 context-aware하게 바뀌어야 합니다:

1. `buildDeveloperInstructions(params)`로 기본 developer instruction을 계산
2. context-engine assemble/projection 적용
3. projection된 prompt/developer instruction으로 `before_prompt_build` 실행

이 순서를 사용하면 일반 prompt hook이 Codex가 실제로 받을 동일한 prompt를 보게 됩니다. 엄격한 Pi 동등성이 필요하다면, context-engine
`systemPromptAddition`을 Pi가 자체 prompt 파이프라인 뒤의 최종 시스템 prompt에 적용하므로 context-engine assemble을 hook 조합 전에 실행하세요. 중요한 불변 조건은 context engine과 hook 둘 다가
결정적이고 문서화된 순서를 갖는다는 것입니다.

첫 구현에 권장되는 순서:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. `systemPromptAddition`을 developer instruction에 append/prepend
4. assemble된 메시지를 prompt 텍스트로 projection
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 최종 developer instruction을 `startOrResumeThread(...)`에 전달
7. 최종 prompt 텍스트를 `buildTurnStartParams(...)`에 전달

향후 변경이 실수로 순서를 바꾸지 않도록 이 사양은 테스트에 인코딩되어야 합니다.

### 5. prompt-cache 안정적 형식 보존

projection helper는 동일한 입력에 대해 바이트 단위로 안정적인 출력을 생성해야 합니다:

- 안정적인 메시지 순서
- 안정적인 역할 라벨
- 생성된 타임스탬프 없음
- 객체 키 순서 누출 없음
- 무작위 구분자 없음
- 실행별 ID 없음

고정 구분자와 명시적 섹션을 사용하세요.

### 6. transcript 미러링 후 post-turn 연결

Codex의 `CodexAppServerEventProjector`는 현재 턴에 대한 로컬 `messagesSnapshot`을 구성합니다. `mirrorTranscriptBestEffort(...)`는 그 스냅샷을
OpenClaw transcript 미러에 기록합니다.

미러링 성공 여부와 관계없이, 가능한 최선의 메시지 스냅샷으로 context-engine finalizer를 호출합니다:

- `afterTurn`은 현재 턴만이 아니라 세션 스냅샷을 기대하므로, 쓰기 후의 전체 미러링 세션 컨텍스트를 우선 사용합니다.
- 세션 파일을 다시 열 수 없으면 `historyMessages + result.messagesSnapshot`으로 fallback합니다.

의사 흐름:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

미러링이 실패하더라도 fallback 스냅샷으로 `afterTurn`을 계속 호출하되,
context engine이 fallback 턴 데이터에서 ingest 중이라는 점을 로그에 남깁니다.

### 7. 사용량 및 prompt-cache 런타임 컨텍스트 정규화

Codex 결과에는 가능한 경우 app-server 토큰 알림에서 정규화된 사용량이 포함됩니다. 이 사용량을 context-engine 런타임 컨텍스트에 전달하세요.

Codex app-server가 나중에 캐시 read/write 세부 정보를 노출하면 이를 `ContextEnginePromptCacheInfo`에 매핑하세요. 그전까지는 0을 만들어 넣지 말고 `promptCache`를 생략하세요.

### 8. Compaction 정책

Compaction 시스템은 두 가지입니다:

1. OpenClaw context-engine `compact()`
2. Codex app-server 네이티브 `thread/compact/start`

둘을 조용히 혼동하지 마세요.

#### `/compact` 및 명시적 OpenClaw Compaction

선택된 context engine에 `info.ownsCompaction === true`가 있으면,
명시적 OpenClaw Compaction은 OpenClaw transcript 미러와 Plugin state에 대해
context engine의 `compact()` 결과를 우선해야 합니다.

선택된 Codex harness에 네이티브 스레드 바인딩이 있는 경우, app-server 스레드 상태를 유지하기 위해 Codex 네이티브 Compaction도 추가로 요청할 수 있지만, 이것은 세부 정보에서 별도의 backend 작업으로 보고되어야 합니다.

권장 동작:

- `contextEngine.info.ownsCompaction === true`인 경우:
  - 먼저 context-engine `compact()` 호출
  - 그다음 스레드 바인딩이 있으면 best-effort로 Codex 네이티브 Compaction 호출
  - context-engine 결과를 기본 결과로 반환
  - Codex 네이티브 Compaction 상태를 `details.codexNativeCompaction`에 포함
- 활성 context engine이 Compaction을 소유하지 않으면:
  - 현재 Codex 네이티브 Compaction 동작을 유지

이는 `extensions/codex/src/app-server/compact.ts`를 변경하거나,
`maybeCompactAgentHarnessSession(...)`이 호출되는 위치에 따라 일반 Compaction 경로에서 이를 감싸는 작업이 필요할 수 있습니다.

#### 턴 중 Codex 네이티브 contextCompaction 이벤트

Codex는 턴 중에 `contextCompaction` 항목 이벤트를 발생시킬 수 있습니다. `event-projector.ts`의 현재 before/after Compaction hook 발생은 유지하되, 이를 완료된 context-engine Compaction으로 취급하지 마세요.

Compaction을 소유하는 엔진의 경우, Codex가 어쨌든 네이티브 Compaction을 수행하면 명시적 진단을 발생시키세요:

- stream/event 이름: 기존 `compaction` 스트림 사용 가능
- 세부 정보: `{ backend: "codex-app-server", ownsCompaction: true }`

이렇게 하면 구분을 감사 가능하게 만들 수 있습니다.

### 9. 세션 재설정 및 바인딩 동작

기존 Codex harness `reset(...)`은 OpenClaw 세션 파일에서 Codex app-server 바인딩을 제거합니다. 이 동작을 유지하세요.

또한 context-engine state 정리가 기존 OpenClaw 세션 lifecycle 경로를 통해 계속 일어나도록 하세요. context-engine lifecycle이 현재 모든 harness에 대해 reset/delete 이벤트를 놓치고 있는 것이 아니라면 Codex 전용 정리를 추가하지 마세요.

### 10. 오류 처리

Pi 의미를 따르세요:

- bootstrap 실패는 경고만 남기고 계속 진행
- assemble 실패는 경고를 남기고 assemble되지 않은 파이프라인 메시지/prompt로 fallback
- afterTurn/ingest 실패는 경고를 남기고 post-turn finalization을 실패로 표시
- 유지 관리는 성공했고, 중단되지 않았고, yield 턴이 아닌 경우에만 실행
- Compaction 오류는 새 prompt로 재시도하지 않아야 함

Codex 전용 추가 사항:

- context projection이 실패하면 경고를 남기고 원래 prompt로 fallback
- transcript 미러가 실패하더라도 fallback 메시지로 context-engine finalization을 계속 시도
- context-engine Compaction이 성공한 뒤 Codex 네이티브 Compaction이 실패하더라도,
  context engine이 기본인 경우 전체 OpenClaw Compaction을 실패로 처리하지 않음

## 테스트 계획

### 단위 테스트

`extensions/codex/src/app-server` 아래에 테스트를 추가합니다:

1. `run-attempt.context-engine.test.ts`
   - 세션 파일이 존재하면 Codex가 `bootstrap`을 호출함
   - Codex가 미러링된 메시지, token budget, 도구 이름,
     citation mode, 모델 ID, prompt와 함께 `assemble`을 호출함
   - `systemPromptAddition`이 developer instruction에 포함됨
   - assemble된 메시지가 현재 요청 전에 prompt에 projection됨
   - transcript 미러링 후 Codex가 `afterTurn`을 호출함
   - `afterTurn`이 없으면 Codex가 `ingestBatch` 또는 메시지별 `ingest`를 호출함
   - 성공한 턴 후 턴 유지 관리가 실행됨
   - prompt 오류, abort, yield abort에서는 턴 유지 관리가 실행되지 않음

2. `context-engine-projection.test.ts`
   - 동일 입력에 대해 안정적인 출력
   - assemble된 기록에 현재 prompt가 포함된 경우 중복 현재 prompt 없음
   - 빈 기록 처리
   - 역할 순서 보존
   - system prompt 추가분은 developer instruction에만 포함

3. `compact.context-engine.test.ts`
   - Compaction을 소유한 context engine의 기본 결과가 우선함
   - 함께 시도된 경우 Codex 네이티브 Compaction 상태가 details에 나타남
   - Codex 네이티브 실패가 Compaction 소유 context-engine Compaction을 실패시키지 않음
   - Compaction을 소유하지 않는 context engine은 현재 네이티브 Compaction 동작을 보존함

### 업데이트할 기존 테스트

- `extensions/codex/src/app-server/run-attempt.test.ts`가 있으면 그것을, 없으면
  가장 가까운 Codex app-server 실행 테스트를 사용
- Compaction 이벤트 세부 정보가 바뀌는 경우에만 `extensions/codex/src/app-server/event-projector.test.ts`
- `src/agents/harness/selection.test.ts`는 config
  동작이 바뀌지 않는 한 변경이 필요하지 않아야 하며, 그대로 안정적으로 유지되어야 함
- Pi context-engine 테스트는 변경 없이 계속 통과해야 함

### 통합 / 라이브 테스트

라이브 Codex harness smoke 테스트를 추가하거나 확장합니다:

- `plugins.slots.contextEngine`을 테스트 엔진으로 구성
- `agents.defaults.model`을 `codex/*` 모델로 구성
- `agents.defaults.embeddedHarness.runtime = "codex"` 구성
- 테스트 엔진이 다음을 관찰했는지 검증:
  - bootstrap
  - assemble
  - afterTurn 또는 ingest
  - 유지 관리

OpenClaw 코어 테스트에서 lossless-claw를 요구하지 마세요. repo 내부의 작은 가짜
context engine Plugin을 사용하세요.

## 관찰 가능성

Codex context-engine lifecycle 호출 주변에 디버그 로그를 추가합니다:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped`와 그 이유
- `codex native compaction completed alongside context-engine compaction`

전체 prompt나 transcript 내용은 로그에 남기지 마세요.

유용한 곳에는 구조화된 필드를 추가하세요:

- `sessionId`
- `sessionKey`는 기존 로깅 관행에 따라 가리거나 생략
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 마이그레이션 / 호환성

이 작업은 하위 호환이어야 합니다:

- context engine이 구성되지 않은 경우, 레거시 context engine 동작은
  현재 Codex harness 동작과 동등해야 합니다.
- context-engine `assemble`이 실패하면 Codex는 원래 prompt 경로로 계속 진행해야 합니다.
- 기존 Codex 스레드 바인딩은 계속 유효해야 합니다.
- 동적 도구 fingerprinting에는 context-engine 출력이 포함되면 안 됩니다. 그렇지 않으면
  모든 컨텍스트 변경이 새 Codex 스레드를 강제할 수 있습니다. 동적 도구 fingerprint에는
  도구 카탈로그만 영향을 줘야 합니다.

## 열린 질문

1. assemble된 컨텍스트는 전부 사용자 prompt에 주입해야 하나요, 전부
   developer instruction에 넣어야 하나요, 아니면 나눠야 하나요?

   권장 사항: 나눕니다. `systemPromptAddition`은 developer instruction에 넣고,
   assemble된 transcript 컨텍스트는 사용자 prompt wrapper에 넣습니다. 이것이
   네이티브 스레드 기록을 변경하지 않으면서 현재 Codex 프로토콜과 가장 잘 맞습니다.

2. context engine이 Compaction을 소유할 때 Codex 네이티브 Compaction을 비활성화해야 하나요?

   권장 사항: 아니요, 적어도 처음에는 그렇지 않습니다. Codex 네이티브 Compaction은
   app-server 스레드를 유지하는 데 여전히 필요할 수 있습니다. 하지만 이것은
   context-engine Compaction이 아니라 네이티브 Codex Compaction으로 보고되어야 합니다.

3. `before_prompt_build`는 context-engine assemble 전과 후 중 언제 실행해야 하나요?

   권장 사항: Codex에서는 context-engine projection 후에 실행해서 일반 harness
   hook이 Codex가 실제로 받을 prompt/developer instruction을 볼 수 있게 합니다. Pi
   동등성이 반대를 요구한다면, 선택된 순서를 테스트에 인코딩하고
   여기에 문서화하세요.

4. Codex app-server는 향후 구조화된 컨텍스트/기록 재정의를 받을 수 있나요?

   알 수 없습니다. 가능하다면 텍스트 projection 계층을 해당 프로토콜로 교체하고
   lifecycle 호출은 그대로 유지하세요.

## 승인 기준

- `codex/*` 내장 harness 턴이 선택된 context engine의
  assemble lifecycle을 호출한다.
- context-engine `systemPromptAddition`이 Codex developer instruction에 영향을 준다.
- assemble된 컨텍스트가 결정적으로 Codex 턴 입력에 영향을 준다.
- 성공한 Codex 턴이 `afterTurn` 또는 ingest fallback을 호출한다.
- 성공한 Codex 턴이 context-engine 턴 유지 관리를 실행한다.
- 실패/abort/yield-abort 턴은 턴 유지 관리를 실행하지 않는다.
- context-engine 소유 Compaction은 OpenClaw/Plugin state에 대해 기본으로 유지된다.
- Codex 네이티브 Compaction은 네이티브 Codex 동작으로 감사 가능하게 유지된다.
- 기존 Pi context-engine 동작은 변경되지 않는다.
- non-legacy context engine이 선택되지 않았거나 assemble이 실패한 경우 기존 Codex harness
  동작은 변경되지 않는다.
