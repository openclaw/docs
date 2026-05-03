---
read_when:
    - Codex 하네스에 컨텍스트 엔진 수명 주기 동작을 연결하고 있습니다
    - codex/* 내장 하네스 세션으로 작업하려면 lossless-claw 또는 다른 context-engine Plugin이 필요합니다
    - 내장된 PI와 Codex 앱 서버 컨텍스트 동작을 비교하고 있습니다
summary: 번들로 제공되는 Codex app-server 하네스가 OpenClaw context-engine Plugin을 반영하도록 만들기 위한 사양
title: Codex 하네스 컨텍스트 엔진 이식
x-i18n:
    generated_at: "2026-05-03T06:18:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## 상태

초안 구현 사양.

## 목표

번들된 Codex 앱 서버 하네스가 내장 PI 턴이 이미 준수하는 것과 동일한 OpenClaw 컨텍스트 엔진 수명 주기 계약을 따르도록 한다.

`agents.defaults.embeddedHarness.runtime: "codex"` 또는 `codex/*` 모델을 사용하는 세션도 `lossless-claw` 같은 선택된 컨텍스트 엔진 Plugin이 Codex 앱 서버 경계가 허용하는 범위 안에서 컨텍스트 조립, 턴 이후 수집, 유지 관리, OpenClaw 수준 Compaction 정책을 제어할 수 있어야 한다.

## 비목표

- Codex 앱 서버 내부를 다시 구현하지 않는다.
- Codex 네이티브 스레드 Compaction이 lossless-claw 요약을 생성하게 만들지 않는다.
- Codex가 아닌 모델이 Codex 하네스를 사용하도록 요구하지 않는다.
- ACP/acpx 세션 동작을 변경하지 않는다. 이 사양은 비 ACP 내장 에이전트 하네스 경로에만 적용된다.
- 서드파티 plugins가 Codex 앱 서버 확장 팩터리를 등록하게 만들지 않는다. 기존 번들 Plugin 신뢰 경계는 그대로 유지된다.

## 현재 아키텍처

내장 실행 루프는 구체적인 저수준 하네스를 선택하기 전에 실행마다 한 번 구성된 컨텍스트 엔진을 해석한다.

- `src/agents/pi-embedded-runner/run.ts`
  - 컨텍스트 엔진 plugins를 초기화한다
  - `resolveContextEngine(params.config)`를 호출한다
  - `contextEngine`과 `contextTokenBudget`을 `runEmbeddedAttemptWithBackend(...)`에 전달한다

`runEmbeddedAttemptWithBackend(...)`는 선택된 에이전트 하네스에 위임한다.

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex 앱 서버 하네스는 번들된 Codex Plugin이 등록한다.

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex 하네스 구현은 PI 기반 시도와 동일한 `EmbeddedRunAttemptParams`를 받는다.

- `extensions/codex/src/app-server/run-attempt.ts`

즉, 필요한 훅 지점은 OpenClaw가 제어하는 코드 안에 있다. 외부 경계는 Codex 앱 서버 프로토콜 자체다. OpenClaw는 `thread/start`, `thread/resume`, `turn/start`로 무엇을 보낼지 제어할 수 있고 알림을 관찰할 수 있지만, Codex의 내부 스레드 저장소나 네이티브 압축기를 변경할 수는 없다.

## 현재 공백

내장 PI 시도는 컨텍스트 엔진 수명 주기를 직접 호출한다.

- 시도 전 부트스트랩/유지 관리
- 모델 호출 전 조립
- 시도 후 afterTurn 또는 수집
- 성공한 턴 이후 유지 관리
- Compaction을 소유하는 엔진을 위한 컨텍스트 엔진 Compaction

관련 PI 코드:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex 앱 서버 시도는 현재 일반 에이전트 하네스 훅을 실행하고 트랜스크립트를 미러링하지만, `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, 또는 `params.contextEngine.maintain`을 호출하지 않는다.

관련 Codex 코드:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 원하는 동작

Codex 하네스 턴에서 OpenClaw는 다음 수명 주기를 보존해야 한다.

1. 미러링된 OpenClaw 세션 트랜스크립트를 읽는다.
2. 이전 세션 파일이 있으면 활성 컨텍스트 엔진을 부트스트랩한다.
3. 가능하면 부트스트랩 유지 관리를 실행한다.
4. 활성 컨텍스트 엔진을 사용해 컨텍스트를 조립한다.
5. 조립된 컨텍스트를 Codex 호환 입력으로 변환한다.
6. 컨텍스트 엔진 `systemPromptAddition`이 있으면 이를 포함하는 개발자 지침으로 Codex 스레드를 시작하거나 재개한다.
7. 조립된 사용자 대상 프롬프트로 Codex 턴을 시작한다.
8. Codex 결과를 OpenClaw 트랜스크립트로 다시 미러링한다.
9. 구현되어 있으면 `afterTurn`을 호출하고, 그렇지 않으면 미러링된 트랜스크립트 스냅샷을 사용해 `ingestBatch`/`ingest`를 호출한다.
10. 성공한 비중단 턴 이후 턴 유지 관리를 실행한다.
11. Codex 네이티브 Compaction 신호와 OpenClaw Compaction 훅을 보존한다.

## 설계 제약

### Codex 앱 서버는 네이티브 스레드 상태의 기준으로 유지된다

Codex는 자체 네이티브 스레드와 내부 확장 기록을 소유한다. OpenClaw는 지원되는 프로토콜 호출 외의 방식으로 앱 서버의 내부 기록을 변경하려고 해서는 안 된다.

OpenClaw의 트랜스크립트 미러는 OpenClaw 기능의 소스로 유지된다.

- 채팅 기록
- 검색
- `/new` 및 `/reset` 장부 처리
- 향후 모델 또는 하네스 전환
- 컨텍스트 엔진 Plugin 상태

### 컨텍스트 엔진 조립은 Codex 입력으로 투영되어야 한다

컨텍스트 엔진 인터페이스는 Codex 스레드 패치가 아니라 OpenClaw `AgentMessage[]`를 반환한다. Codex 앱 서버 `turn/start`는 현재 사용자 입력을 받는 반면, `thread/start`와 `thread/resume`은 개발자 지침을 받는다.

따라서 구현에는 투영 계층이 필요하다. 안전한 첫 버전은 Codex 내부 기록을 대체할 수 있는 척하지 않아야 한다. 대신 현재 턴 주변에 결정적인 프롬프트/개발자 지침 자료로 조립된 컨텍스트를 주입해야 한다.

### 프롬프트 캐시 안정성이 중요하다

lossless-claw 같은 엔진에서는 입력이 변경되지 않으면 조립된 컨텍스트도 결정적이어야 한다. 생성된 컨텍스트 텍스트에 타임스탬프, 무작위 ID 또는 비결정적 순서를 추가하지 않는다.

### 런타임 선택 의미 체계는 변경하지 않는다

하네스 선택은 그대로 유지된다.

- `runtime: "pi"`는 PI를 강제한다
- `runtime: "codex"`는 등록된 Codex 하네스를 선택한다
- `runtime: "auto"`는 Plugin 하네스가 지원되는 제공자를 클레임할 수 있게 한다
- 일치하지 않는 `auto` 실행은 PI를 사용한다

이 작업은 Codex 하네스가 선택된 이후의 동작을 변경한다.

## 구현 계획

### 1. 재사용 가능한 컨텍스트 엔진 시도 헬퍼를 내보내거나 재배치한다

현재 재사용 가능한 수명 주기 헬퍼는 PI 러너 아래에 있다.

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

가능하다면 Codex가 이름상 PI를 암시하는 구현 경로에서 가져오지 않도록 해야 한다.

예를 들어 하네스 중립 모듈을 만든다.

- `src/agents/harness/context-engine-lifecycle.ts`

다음을 이동하거나 다시 내보낸다.

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance`를 감싸는 작은 래퍼

기존 파일에서 다시 내보내거나 같은 PR에서 PI 호출 지점을 업데이트해 PI import가 계속 동작하게 한다.

중립 헬퍼 이름에는 PI를 언급하지 않아야 한다.

제안 이름:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex 컨텍스트 투영 헬퍼를 추가한다

새 모듈을 추가한다.

- `extensions/codex/src/app-server/context-engine-projection.ts`

책임:

- 조립된 `AgentMessage[]`, 원래 미러링된 기록, 현재 프롬프트를 받는다.
- 어떤 컨텍스트가 개발자 지침에 속하고 어떤 컨텍스트가 현재 사용자 입력에 속하는지 결정한다.
- 현재 사용자 프롬프트를 마지막 실행 가능 요청으로 보존한다.
- 이전 메시지를 안정적이고 명시적인 형식으로 렌더링한다.
- 변동성 있는 메타데이터를 피한다.

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

권장 첫 투영:

- `systemPromptAddition`을 개발자 지침에 넣는다.
- 조립된 트랜스크립트 컨텍스트를 `promptText`에서 현재 프롬프트 앞에 넣는다.
- OpenClaw 조립 컨텍스트임을 명확하게 표시한다.
- 현재 프롬프트를 마지막에 둔다.
- 현재 사용자 프롬프트가 이미 끝에 나타나 있으면 중복을 제외한다.

예시 프롬프트 형태:

```text
이 턴을 위한 OpenClaw 조립 컨텍스트:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

현재 사용자 요청:
...
```

이는 네이티브 Codex 기록 수술보다 덜 우아하지만, OpenClaw 내부에서 구현 가능하며 컨텍스트 엔진 의미 체계를 보존한다.

향후 개선: Codex 앱 서버가 스레드 기록을 대체하거나 보충하는 프로토콜을 노출하면, 이 투영 계층을 해당 API를 사용하도록 교체한다.

### 3. Codex 스레드 시작 전에 부트스트랩을 연결한다

`extensions/codex/src/app-server/run-attempt.ts`에서:

- 현재처럼 미러링된 세션 기록을 읽는다.
- 이 실행 전에 세션 파일이 있었는지 확인한다. 미러링 쓰기 전에 `fs.stat(params.sessionFile)`를 확인하는 헬퍼를 선호한다.
- `SessionManager`를 열거나 헬퍼가 요구한다면 좁은 세션 관리자 어댑터를 사용한다.
- `params.contextEngine`이 있으면 중립 부트스트랩 헬퍼를 호출한다.

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

Codex 도구 브리지와 트랜스크립트 미러와 동일한 `sessionKey` 규칙을 사용한다. 현재 Codex는 `params.sessionKey` 또는 `params.sessionId`에서 `sandboxSessionKey`를 계산한다. 원본 `params.sessionKey`를 보존해야 할 이유가 없다면 이를 일관되게 사용한다.

### 4. `thread/start` / `thread/resume` 및 `turn/start` 전에 조립을 연결한다

`runCodexAppServerAttempt`에서:

1. 먼저 동적 도구를 빌드해 컨텍스트 엔진이 실제 사용 가능한 도구 이름을 보게 한다.
2. 미러링된 세션 기록을 읽는다.
3. `params.contextEngine`이 있으면 컨텍스트 엔진 `assemble(...)`을 실행한다.
4. 조립된 결과를 다음으로 투영한다.
   - 개발자 지침 추가분
   - `turn/start`용 프롬프트 텍스트

기존 훅 호출:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

은 컨텍스트 인식형이 되어야 한다.

1. `buildDeveloperInstructions(params)`로 기본 개발자 지침을 계산한다
2. 컨텍스트 엔진 조립/투영을 적용한다
3. 투영된 프롬프트/개발자 지침으로 `before_prompt_build`를 실행한다

이 순서는 일반 프롬프트 훅이 Codex가 받을 프롬프트와 동일한 프롬프트를 보게 한다. 엄격한 PI 동등성이 필요하다면 훅 조합 전에 컨텍스트 엔진 조립을 실행한다. PI는 프롬프트 파이프라인 이후 최종 시스템 프롬프트에 컨텍스트 엔진 `systemPromptAddition`을 적용하기 때문이다. 중요한 불변 조건은 컨텍스트 엔진과 훅 모두가 결정적이고 문서화된 순서를 갖는다는 점이다.

첫 구현의 권장 순서:

1. `buildDeveloperInstructions(params)`
2. 컨텍스트 엔진 `assemble()`
3. `systemPromptAddition`을 개발자 지침에 추가하거나 앞에 붙인다
4. 조립된 메시지를 프롬프트 텍스트로 투영한다
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 최종 개발자 지침을 `startOrResumeThread(...)`에 전달한다
7. 최종 프롬프트 텍스트를 `buildTurnStartParams(...)`에 전달한다

향후 변경이 실수로 순서를 바꾸지 않도록 이 사양을 테스트에 인코딩해야 한다.

### 5. 프롬프트 캐시 안정적 형식을 보존한다

투영 헬퍼는 동일한 입력에 대해 바이트 단위로 안정적인 출력을 생성해야 한다.

- 안정적인 메시지 순서
- 안정적인 역할 레이블
- 생성된 타임스탬프 없음
- 객체 키 순서 누출 없음
- 무작위 구분자 없음
- 실행별 ID 없음

고정 구분자와 명시적 섹션을 사용한다.

### 6. 트랜스크립트 미러링 이후 턴 이후 처리를 연결한다

Codex의 `CodexAppServerEventProjector`는 현재 턴에 대한 로컬 `messagesSnapshot`을 빌드합니다. `mirrorTranscriptBestEffort(...)`는 해당 스냅샷을 OpenClaw transcript mirror에 씁니다.

미러링이 성공하거나 실패한 뒤에는 사용 가능한 최선의 메시지 스냅샷으로 context-engine finalizer를 호출합니다.

- 쓰기 후에는 전체 미러링된 세션 컨텍스트를 우선 사용하세요. `afterTurn`은 현재 턴만이 아니라 세션 스냅샷을 기대하기 때문입니다.
- 세션 파일을 다시 열 수 없으면 `historyMessages + result.messagesSnapshot`으로 폴백하세요.

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

미러링이 실패해도 폴백 스냅샷으로 `afterTurn` 호출을 계속 시도하되, context engine이 폴백 턴 데이터에서 수집하고 있음을 로그로 남기세요.

### 7. 사용량 및 prompt-cache 런타임 컨텍스트 정규화

Codex 결과에는 사용 가능한 경우 app-server 토큰 알림에서 정규화된 사용량이 포함됩니다. 해당 사용량을 context-engine 런타임 컨텍스트로 전달하세요.

Codex app-server가 향후 캐시 읽기/쓰기 세부 정보를 노출하면 이를 `ContextEnginePromptCacheInfo`로 매핑하세요. 그때까지는 0을 만들어 넣지 말고 `promptCache`를 생략하세요.

### 8. Compaction 정책

Compaction 시스템은 두 가지입니다.

1. OpenClaw context-engine `compact()`
2. Codex app-server 네이티브 `thread/compact/start`

이를 조용히 한데 섞지 마세요.

#### `/compact` 및 명시적 OpenClaw Compaction

선택된 context engine의 `info.ownsCompaction === true`이면 명시적 OpenClaw Compaction은 OpenClaw transcript mirror 및 Plugin 상태에 대해 context engine의 `compact()` 결과를 우선 사용해야 합니다.

선택된 Codex harness에 네이티브 스레드 바인딩이 있는 경우 app-server 스레드를 정상 상태로 유지하기 위해 Codex 네이티브 Compaction을 추가로 요청할 수 있지만, 이는 세부 정보에서 별도의 백엔드 작업으로 보고되어야 합니다.

권장 동작:

- `contextEngine.info.ownsCompaction === true`인 경우:
  - context-engine `compact()`를 먼저 호출
  - 스레드 바인딩이 있으면 그다음 최선 노력으로 Codex 네이티브 Compaction 호출
  - context-engine 결과를 기본 결과로 반환
  - Codex 네이티브 Compaction 상태를 `details.codexNativeCompaction`에 포함
- 활성 context engine이 Compaction을 소유하지 않는 경우:
  - 현재 Codex 네이티브 Compaction 동작 유지

이는 `maybeCompactAgentHarnessSession(...)`가 호출되는 위치에 따라 `extensions/codex/src/app-server/compact.ts`를 변경하거나 일반 Compaction 경로에서 래핑해야 할 가능성이 높습니다.

#### 턴 내부 Codex 네이티브 contextCompaction 이벤트

Codex는 턴 중에 `contextCompaction` 항목 이벤트를 내보낼 수 있습니다. `event-projector.ts`의 현재 Compaction 전/후 훅 방출은 유지하되, 이를 완료된 context-engine Compaction으로 취급하지 마세요.

Compaction을 소유하는 엔진의 경우 Codex가 그래도 네이티브 Compaction을 수행하면 명시적 진단을 내보내세요.

- 스트림/이벤트 이름: 기존 `compaction` 스트림 사용 가능
- 세부 정보: `{ backend: "codex-app-server", ownsCompaction: true }`

이렇게 하면 분리를 감사할 수 있습니다.

### 9. 세션 재설정 및 바인딩 동작

기존 Codex harness `reset(...)`은 OpenClaw 세션 파일에서 Codex app-server 바인딩을 지웁니다. 이 동작을 유지하세요.

또한 context-engine 상태 정리가 기존 OpenClaw 세션 수명 주기 경로를 통해 계속 수행되도록 하세요. context-engine 수명 주기가 현재 모든 harness의 reset/delete 이벤트를 놓치고 있지 않다면 Codex 전용 정리를 추가하지 마세요.

### 10. 오류 처리

PI 의미 체계를 따르세요.

- bootstrap 실패는 경고하고 계속 진행
- assemble 실패는 경고하고 조립되지 않은 파이프라인 메시지/프롬프트로 폴백
- afterTurn/ingest 실패는 경고하고 턴 이후 finalization을 실패로 표시
- maintenance는 성공했고 중단되지 않았으며 yield되지 않은 턴 이후에만 실행
- Compaction 오류를 새 프롬프트로 재시도하면 안 됨

Codex 전용 추가 사항:

- 컨텍스트 projection이 실패하면 경고하고 원래 프롬프트로 폴백하세요.
- transcript mirror가 실패해도 폴백 메시지로 context-engine finalization을 계속 시도하세요.
- context-engine Compaction이 성공한 후 Codex 네이티브 Compaction이 실패하더라도 context engine이 기본이면 전체 OpenClaw Compaction을 실패시키지 마세요.

## 테스트 계획

### 단위 테스트

`extensions/codex/src/app-server` 아래에 테스트를 추가하세요.

1. `run-attempt.context-engine.test.ts`
   - 세션 파일이 있으면 Codex가 `bootstrap`을 호출합니다.
   - Codex가 미러링된 메시지, 토큰 예산, 도구 이름, citations 모드, 모델 ID, 프롬프트로 `assemble`을 호출합니다.
   - `systemPromptAddition`이 developer instructions에 포함됩니다.
   - 조립된 메시지가 현재 요청 전에 프롬프트로 projected됩니다.
   - Codex가 transcript 미러링 이후 `afterTurn`을 호출합니다.
   - `afterTurn`이 없으면 Codex가 `ingestBatch` 또는 메시지별 `ingest`를 호출합니다.
   - 성공한 턴 이후 턴 maintenance가 실행됩니다.
   - 프롬프트 오류, 중단 또는 yield 중단 시 턴 maintenance가 실행되지 않습니다.

2. `context-engine-projection.test.ts`
   - 동일한 입력에 대한 안정적인 출력
   - 조립된 기록에 현재 프롬프트가 포함된 경우 중복 없음
   - 빈 기록 처리
   - 역할 순서 보존
   - system prompt addition은 developer instructions에만 포함

3. `compact.context-engine.test.ts`
   - 소유 context engine의 기본 결과가 우선
   - 함께 시도된 경우 Codex 네이티브 Compaction 상태가 세부 정보에 표시됨
   - Codex 네이티브 실패가 소유 context-engine Compaction을 실패시키지 않음
   - 비소유 context engine은 현재 네이티브 Compaction 동작을 유지

### 업데이트할 기존 테스트

- 있으면 `extensions/codex/src/app-server/run-attempt.test.ts`, 없으면 가장 가까운 Codex app-server 실행 테스트.
- Compaction 이벤트 세부 정보가 변경되는 경우에만 `extensions/codex/src/app-server/event-projector.test.ts`.
- config 동작이 변경되지 않는 한 `src/agents/harness/selection.test.ts`는 변경이 필요하지 않아야 하며 안정적으로 유지되어야 합니다.
- PI context-engine 테스트는 변경 없이 계속 통과해야 합니다.

### 통합 / 라이브 테스트

라이브 Codex harness smoke 테스트를 추가하거나 확장하세요.

- `plugins.slots.contextEngine`을 테스트 엔진으로 구성
- `agents.defaults.model`을 `codex/*` 모델로 구성
- `agents.defaults.embeddedHarness.runtime = "codex"` 구성
- 테스트 엔진이 다음을 관찰했는지 assert:
  - bootstrap
  - assemble
  - afterTurn 또는 ingest
  - maintenance

OpenClaw 코어 테스트에서 lossless-claw를 요구하지 마세요. 작은 in-repo 가짜 context engine Plugin을 사용하세요.

## 관측 가능성

Codex context-engine 수명 주기 호출 주변에 debug 로그를 추가하세요.

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- 이유와 함께 `codex context engine maintenance skipped`
- `codex native compaction completed alongside context-engine compaction`

전체 프롬프트나 transcript 내용을 로그로 남기지 마세요.

유용한 경우 구조화된 필드를 추가하세요.

- `sessionId`
- 기존 로깅 관행에 따라 redact하거나 생략한 `sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 마이그레이션 / 호환성

이는 하위 호환되어야 합니다.

- context engine이 구성되지 않은 경우 기존 context engine 동작은 오늘의 Codex harness 동작과 동일해야 합니다.
- context-engine `assemble`이 실패하면 Codex는 원래 프롬프트 경로로 계속 진행해야 합니다.
- 기존 Codex 스레드 바인딩은 계속 유효해야 합니다.
- 동적 도구 fingerprinting에는 context-engine 출력이 포함되면 안 됩니다. 그렇지 않으면 모든 컨텍스트 변경이 새 Codex 스레드를 강제할 수 있습니다. 도구 카탈로그만 동적 도구 fingerprint에 영향을 주어야 합니다.

## 미해결 질문

1. 조립된 컨텍스트를 전부 사용자 프롬프트에 주입해야 하나요, 전부 developer instructions에 주입해야 하나요, 아니면 나누어야 하나요?

   권장 사항: 나누세요. `systemPromptAddition`은 developer instructions에 넣고, 조립된 transcript 컨텍스트는 사용자 프롬프트 wrapper에 넣으세요. 이는 네이티브 스레드 기록을 변경하지 않으면서 현재 Codex 프로토콜에 가장 잘 맞습니다.

2. context engine이 Compaction을 소유할 때 Codex 네이티브 Compaction을 비활성화해야 하나요?

   권장 사항: 처음에는 아니요. Codex 네이티브 Compaction은 app-server 스레드를 유지하기 위해 여전히 필요할 수 있습니다. 하지만 이는 context-engine Compaction이 아니라 네이티브 Codex Compaction으로 보고되어야 합니다.

3. `before_prompt_build`는 context-engine assembly 전 또는 후 중 언제 실행해야 하나요?

   권장 사항: Codex의 경우 context-engine projection 이후입니다. 그러면 일반 harness 훅이 Codex가 실제로 받을 프롬프트/developer instructions를 볼 수 있습니다. PI parity가 반대 순서를 요구한다면 선택한 순서를 테스트에 인코딩하고 여기에 문서화하세요.

4. Codex app-server가 향후 구조화된 context/history override를 받을 수 있나요?

   알 수 없습니다. 가능해지면 텍스트 projection 계층을 해당 프로토콜로 교체하고 수명 주기 호출은 변경하지 마세요.

## 승인 기준

- `codex/*` embedded harness 턴이 선택된 context engine의 assemble 수명 주기를 호출합니다.
- context-engine `systemPromptAddition`이 Codex developer instructions에 영향을 줍니다.
- 조립된 컨텍스트가 Codex 턴 입력에 결정적으로 영향을 줍니다.
- 성공한 Codex 턴은 `afterTurn` 또는 ingest 폴백을 호출합니다.
- 성공한 Codex 턴은 context-engine 턴 maintenance를 실행합니다.
- 실패/중단/yield 중단 턴은 턴 maintenance를 실행하지 않습니다.
- context-engine이 소유한 Compaction은 OpenClaw/Plugin 상태에 대해 기본으로 유지됩니다.
- Codex 네이티브 Compaction은 네이티브 Codex 동작으로 감사 가능하게 유지됩니다.
- 기존 PI context-engine 동작은 변경되지 않습니다.
- 비레거시 context engine이 선택되지 않았거나 assembly가 실패한 경우 기존 Codex harness 동작은 변경되지 않습니다.
