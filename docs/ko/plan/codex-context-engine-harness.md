---
read_when:
    - Codex 하네스에 컨텍스트 엔진 수명 주기 동작을 연결하고 있습니다
    - codex/* 임베디드 하네스 세션으로 작업하려면 lossless-claw 또는 다른 컨텍스트 엔진 Plugin이 필요합니다.
    - OpenClaw 내장형과 Codex 앱 서버 컨텍스트 동작을 비교하고 있습니다
summary: 번들된 Codex 앱 서버 하네스가 OpenClaw 컨텍스트 엔진 Plugin을 준수하도록 만들기 위한 명세
title: Codex Harness 컨텍스트 엔진 포트
x-i18n:
    generated_at: "2026-06-27T17:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## 상태

초안 구현 사양입니다.

## 목표

번들된 Codex 앱 서버 하니스가 임베디드 OpenClaw 턴이 이미 준수하는 것과 동일한 OpenClaw 컨텍스트 엔진 수명 주기 계약을 준수하게 합니다.

프로바이더/모델 `agentRuntime.id: "codex"` 또는 `codex/*` 모델을 사용하는 세션도, Codex 앱 서버 경계가 허용하는 범위 내에서 `lossless-claw` 같은 선택된 컨텍스트 엔진 Plugin이 컨텍스트 조립, 턴 이후 수집, 유지 관리, OpenClaw 수준 Compaction 정책을 제어할 수 있어야 합니다.

## 비목표

- Codex 앱 서버 내부를 다시 구현하지 않습니다.
- Codex 네이티브 스레드 Compaction이 lossless-claw 요약을 생성하게 하지 않습니다.
- Codex가 아닌 모델이 Codex 하니스를 사용하도록 요구하지 않습니다.
- ACP/acpx 세션 동작을 변경하지 않습니다. 이 사양은 비-ACP 임베디드 에이전트 하니스 경로만을 대상으로 합니다.
- 서드파티 Plugin이 Codex 앱 서버 확장 팩터리를 등록하게 하지 않습니다. 기존 번들 Plugin 신뢰 경계는 변경되지 않습니다.

## 현재 아키텍처

임베디드 실행 루프는 구체적인 저수준 하니스를 선택하기 전에 실행마다 한 번 구성된 컨텍스트 엔진을 해석합니다.

- `src/agents/embedded-agent-runner/run.ts`
  - 컨텍스트 엔진 Plugin을 초기화합니다
  - `resolveContextEngine(params.config)`를 호출합니다
  - `contextEngine` 및 `contextTokenBudget`을 `runEmbeddedAttemptWithBackend(...)`에 전달합니다

`runEmbeddedAttemptWithBackend(...)`는 선택된 에이전트 하니스에 위임합니다.

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex 앱 서버 하니스는 번들된 Codex Plugin이 등록합니다.

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex 하니스 구현은 내장 OpenClaw 시도와 동일한 `EmbeddedRunAttemptParams`를 받습니다.

- `extensions/codex/src/app-server/run-attempt.ts`

즉 필요한 훅 지점은 OpenClaw가 제어하는 코드 안에 있습니다. 외부 경계는 Codex 앱 서버 프로토콜 자체입니다. OpenClaw는 `thread/start`, `thread/resume`, `turn/start`로 보내는 내용을 제어하고 알림을 관찰할 수 있지만, Codex의 내부 스레드 저장소나 네이티브 컴팩터를 변경할 수는 없습니다.

## 현재 격차

내장 OpenClaw 시도는 컨텍스트 엔진 수명 주기를 직접 호출합니다.

- 시도 전 부트스트랩/유지 관리
- 모델 호출 전 조립
- 시도 후 afterTurn 또는 수집
- 성공한 턴 이후 유지 관리
- Compaction을 소유한 엔진을 위한 컨텍스트 엔진 Compaction

관련 OpenClaw 코드:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex 앱 서버 시도는 현재 일반 에이전트 하니스 훅을 실행하고 transcript를 미러링하지만, `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, `params.contextEngine.maintain`을 호출하지 않습니다.

관련 Codex 코드:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 원하는 동작

Codex 하니스 턴에서 OpenClaw는 이 수명 주기를 보존해야 합니다.

1. 미러링된 OpenClaw 세션 transcript를 읽습니다.
2. 이전 세션 파일이 있으면 활성 컨텍스트 엔진을 부트스트랩합니다.
3. 가능한 경우 부트스트랩 유지 관리를 실행합니다.
4. 활성 컨텍스트 엔진을 사용해 컨텍스트를 조립합니다.
5. 조립된 컨텍스트를 Codex 호환 입력으로 변환합니다.
6. 컨텍스트 엔진 `systemPromptAddition`이 있으면 이를 포함하는 개발자 지침으로 Codex 스레드를 시작하거나 재개합니다.
7. 조립된 사용자 표시 프롬프트로 Codex 턴을 시작합니다.
8. Codex 결과를 OpenClaw transcript에 다시 미러링합니다.
9. 구현되어 있으면 `afterTurn`을 호출하고, 그렇지 않으면 미러링된 transcript 스냅샷을 사용해 `ingestBatch`/`ingest`를 호출합니다.
10. 중단되지 않고 성공한 턴 이후 턴 유지 관리를 실행합니다.
11. Codex 네이티브 Compaction 신호와 OpenClaw Compaction 훅을 보존합니다.

## 설계 제약

### Codex 앱 서버는 네이티브 스레드 상태의 정본으로 남습니다

Codex는 자체 네이티브 스레드와 내부 확장 기록을 소유합니다. OpenClaw는 지원되는 프로토콜 호출을 통하지 않고 앱 서버의 내부 기록을 변경하려고 해서는 안 됩니다.

OpenClaw의 transcript 미러는 OpenClaw 기능의 소스로 남습니다.

- 채팅 기록
- 검색
- `/new` 및 `/reset` 장부 처리
- 향후 모델 또는 하니스 전환
- 컨텍스트 엔진 Plugin 상태

### 컨텍스트 엔진 조립은 Codex 입력으로 투영되어야 합니다

컨텍스트 엔진 인터페이스는 Codex 스레드 패치가 아니라 OpenClaw `AgentMessage[]`를 반환합니다. Codex 앱 서버 `turn/start`는 현재 사용자 입력을 받는 반면, `thread/start`와 `thread/resume`은 개발자 지침을 받습니다.

따라서 구현에는 투영 계층이 필요합니다. 안전한 첫 버전은 Codex 내부 기록을 대체할 수 있는 것처럼 가장하지 않아야 합니다. 현재 턴 주변에 조립된 컨텍스트를 결정론적 프롬프트/개발자 지침 자료로 주입해야 합니다.

### 프롬프트 캐시 안정성이 중요합니다

lossless-claw 같은 엔진의 경우, 입력이 변경되지 않았으면 조립된 컨텍스트가 결정론적이어야 합니다. 생성된 컨텍스트 텍스트에 타임스탬프, 무작위 id, 비결정적 순서를 추가하지 마세요.

### 런타임 선택 의미는 변경되지 않습니다

하니스 선택은 현재와 동일하게 유지됩니다.

- `runtime: "openclaw"`는 내장 OpenClaw 하니스를 선택합니다
- `runtime: "codex"`는 등록된 Codex 하니스를 선택합니다
- `runtime: "auto"`는 Plugin 하니스가 지원되는 프로바이더를 클레임하게 합니다
- 일치하지 않는 `auto` 실행은 내장 OpenClaw 하니스를 사용합니다

이 작업은 Codex 하니스가 선택된 이후에 발생하는 동작을 변경합니다.

## 구현 계획

### 1. 재사용 가능한 컨텍스트 엔진 시도 헬퍼를 내보내거나 재배치합니다

현재 재사용 가능한 수명 주기 헬퍼는 임베디드 에이전트 러너 아래에 있습니다.

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex는 러너 구현 세부 사항에 접근하는 대신 하니스 중립 헬퍼를 가져와야 합니다.

예를 들어 하니스 중립 모듈을 만듭니다.

- `src/agents/harness/context-engine-lifecycle.ts`

다음을 이동하거나 다시 내보냅니다.

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance`를 감싸는 작은 래퍼

같은 PR에서 내장 하니스 호출 지점을 업데이트합니다.

중립 헬퍼 이름은 내장 하니스를 언급하지 않아야 합니다.

제안 이름:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex 컨텍스트 투영 헬퍼를 추가합니다

새 모듈을 추가합니다.

- `extensions/codex/src/app-server/context-engine-projection.ts`

책임:

- 조립된 `AgentMessage[]`, 원본 미러링 기록, 현재 프롬프트를 받습니다.
- 어떤 컨텍스트가 개발자 지침에 속하고 어떤 컨텍스트가 현재 사용자 입력에 속하는지 결정합니다.
- 현재 사용자 프롬프트를 최종 실행 요청으로 보존합니다.
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

권장 첫 투영:

- `systemPromptAddition`을 개발자 지침에 넣습니다.
- 조립된 transcript 컨텍스트를 `promptText`의 현재 프롬프트 앞에 넣습니다.
- OpenClaw 조립 컨텍스트임을 명확히 표시합니다.
- 현재 프롬프트를 마지막에 둡니다.
- 현재 사용자 프롬프트가 이미 꼬리에 나타나면 중복을 제외합니다.

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

이는 네이티브 Codex 기록 수정보다 덜 세련되지만, OpenClaw 내부에서 구현 가능하며 컨텍스트 엔진 의미를 보존합니다.

향후 개선: Codex 앱 서버가 스레드 기록을 대체하거나 보충하는 프로토콜을 노출하면, 이 투영 계층을 해당 API를 사용하도록 교체합니다.

### 3. Codex 스레드 시작 전 부트스트랩을 연결합니다

`extensions/codex/src/app-server/run-attempt.ts`에서:

- 현재처럼 미러링된 세션 기록을 읽습니다.
- 이 실행 전에 세션 파일이 존재했는지 확인합니다. 미러링 쓰기 전에 `fs.stat(params.sessionFile)`을 확인하는 헬퍼를 선호합니다.
- 헬퍼가 필요로 한다면 `SessionManager`를 열거나 좁은 세션 매니저 어댑터를 사용합니다.
- `params.contextEngine`이 있으면 중립 부트스트랩 헬퍼를 호출합니다.

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

Codex 도구 브리지 및 transcript 미러와 동일한 `sessionKey` 관례를 사용합니다. 현재 Codex는 `params.sessionKey` 또는 `params.sessionId`에서 `sandboxSessionKey`를 계산합니다. 원본 `params.sessionKey`를 보존해야 할 이유가 없다면 이를 일관되게 사용합니다.

### 4. `thread/start` / `thread/resume` 및 `turn/start` 전에 assemble을 연결합니다

`runCodexAppServerAttempt`에서:

1. 컨텍스트 엔진이 실제 사용 가능한 도구 이름을 볼 수 있도록 먼저 동적 도구를 빌드합니다.
2. 미러링된 세션 기록을 읽습니다.
3. `params.contextEngine`이 있으면 컨텍스트 엔진 `assemble(...)`을 실행합니다.
4. 조립된 결과를 다음으로 투영합니다.
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

은 컨텍스트를 인식하도록 바뀌어야 합니다.

1. `buildDeveloperInstructions(params)`로 기본 개발자 지침을 계산합니다
2. 컨텍스트 엔진 조립/투영을 적용합니다
3. 투영된 프롬프트/개발자 지침으로 `before_prompt_build`를 실행합니다

이 순서는 일반 프롬프트 훅이 Codex가 받을 것과 동일한 프롬프트를 보게 합니다. 엄격한 OpenClaw 동등성이 필요하다면 훅 구성 전에 컨텍스트 엔진 조립을 실행합니다. 내장 하니스는 프롬프트 파이프라인 이후 최종 시스템 프롬프트에 컨텍스트 엔진 `systemPromptAddition`을 적용하기 때문입니다. 중요한 불변 조건은 컨텍스트 엔진과 훅 모두가 결정론적이고 문서화된 순서를 갖는다는 점입니다.

첫 구현의 권장 순서:

1. `buildDeveloperInstructions(params)`
2. 컨텍스트 엔진 `assemble()`
3. `systemPromptAddition`을 개발자 지침에 추가하거나 앞에 붙입니다
4. 조립된 메시지를 프롬프트 텍스트로 투영합니다
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 최종 개발자 지침을 `startOrResumeThread(...)`에 전달합니다
7. 최종 프롬프트 텍스트를 `buildTurnStartParams(...)`에 전달합니다

향후 변경이 실수로 순서를 바꾸지 않도록 이 사양은 테스트로 인코딩해야 합니다.

### 5. 프롬프트 캐시 안정 형식을 보존합니다

투영 헬퍼는 동일한 입력에 대해 바이트 단위로 안정적인 출력을 생성해야 합니다.

- 안정적인 메시지 순서
- 안정적인 역할 레이블
- 생성된 타임스탬프 없음
- 객체 키 순서 누출 없음
- 무작위 구분자 없음
- 실행별 id 없음

고정 구분자와 명시적 섹션을 사용합니다.

### 6. transcript 미러링 후 턴 이후를 연결합니다

Codex의 `CodexAppServerEventProjector`는 현재 턴의 로컬 `messagesSnapshot`을
빌드합니다. `mirrorTranscriptBestEffort(...)`는 해당 스냅샷을
OpenClaw 트랜스크립트 미러에 기록합니다.

미러링이 성공하거나 실패한 뒤에는 사용 가능한 최선의 메시지 스냅샷으로
컨텍스트 엔진 종료 처리기를 호출하세요.

- 쓰기 이후에는 전체 미러링된 세션 컨텍스트를 우선 사용하세요. `afterTurn`은
  현재 턴만이 아니라 세션 스냅샷을 기대하기 때문입니다.
- 세션 파일을 다시 열 수 없으면 `historyMessages + result.messagesSnapshot`으로
  폴백하세요.

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

미러링에 실패해도 폴백 스냅샷으로 `afterTurn`을 계속 호출하되, 컨텍스트 엔진이
폴백 턴 데이터에서 수집 중임을 로그로 남기세요.

### 7. 사용량 및 프롬프트 캐시 런타임 컨텍스트 정규화

Codex 결과에는 사용 가능한 경우 앱 서버 토큰 알림에서 온 정규화된 사용량이
포함됩니다. 해당 사용량을 컨텍스트 엔진 런타임 컨텍스트에 전달하세요.

Codex 앱 서버가 나중에 캐시 읽기/쓰기 세부 정보를 노출하면 이를
`ContextEnginePromptCacheInfo`에 매핑하세요. 그 전까지는 0을 만들어 넣지 말고
`promptCache`를 생략하세요.

### 8. Compaction 정책

두 가지 Compaction 시스템이 있습니다.

1. OpenClaw 컨텍스트 엔진 `compact()`
2. Codex 앱 서버 네이티브 `thread/compact/start`

이 둘을 조용히 합쳐 취급하지 마세요.

#### `/compact` 및 명시적 OpenClaw Compaction

선택된 컨텍스트 엔진의 `info.ownsCompaction === true`인 경우, 명시적
OpenClaw Compaction은 OpenClaw 트랜스크립트 미러와 Plugin 상태에 대해
컨텍스트 엔진의 `compact()` 결과를 우선 사용해야 합니다.

선택된 Codex 하네스에 네이티브 스레드 바인딩이 있으면 앱 서버 스레드를
정상 상태로 유지하기 위해 Codex 네이티브 Compaction을 추가로 요청할 수 있지만,
이는 세부 정보에서 별도의 백엔드 작업으로 보고되어야 합니다.

권장 동작:

- `contextEngine.info.ownsCompaction === true`인 경우:
  - 먼저 컨텍스트 엔진 `compact()`를 호출합니다
  - 그런 다음 스레드 바인딩이 있으면 best-effort로 Codex 네이티브 Compaction을 호출합니다
  - 컨텍스트 엔진 결과를 기본 결과로 반환합니다
  - Codex 네이티브 Compaction 상태를 `details.codexNativeCompaction`에 포함합니다
- 활성 컨텍스트 엔진이 Compaction을 소유하지 않는 경우:
  - 현재 Codex 네이티브 Compaction 동작을 유지합니다

이는 `maybeCompactAgentHarnessSession(...)`이 호출되는 위치에 따라
`extensions/codex/src/app-server/compact.ts`를 변경하거나 일반 Compaction 경로에서
이를 감싸는 방식이 필요할 가능성이 있습니다.

#### 턴 내부 Codex 네이티브 contextCompaction 이벤트

Codex는 턴 중에 `contextCompaction` 항목 이벤트를 내보낼 수 있습니다. 현재
`event-projector.ts`의 Compaction 전/후 훅 방출은 유지하되, 이를 완료된
컨텍스트 엔진 Compaction으로 취급하지 마세요.

Compaction을 소유하는 엔진의 경우, Codex가 그럼에도 네이티브 Compaction을
수행하면 명시적 진단을 방출하세요.

- 스트림/이벤트 이름: 기존 `compaction` 스트림을 사용해도 됩니다
- 세부 정보: `{ backend: "codex-app-server", ownsCompaction: true }`

이렇게 하면 분리를 감사할 수 있습니다.

### 9. 세션 재설정 및 바인딩 동작

기존 Codex 하네스 `reset(...)`은 OpenClaw 세션 파일에서 Codex 앱 서버 바인딩을
지웁니다. 이 동작을 유지하세요.

또한 컨텍스트 엔진 상태 정리가 기존 OpenClaw 세션 수명 주기 경로를 통해 계속
이루어지도록 하세요. 현재 컨텍스트 엔진 수명 주기가 모든 하네스의 재설정/삭제
이벤트를 놓치고 있는 경우가 아니라면 Codex 전용 정리를 추가하지 마세요.

### 10. 오류 처리

내장 OpenClaw 의미 체계를 따르세요.

- 부트스트랩 실패는 경고하고 계속합니다
- 조립 실패는 경고하고 조립되지 않은 파이프라인 메시지/프롬프트로 폴백합니다
- afterTurn/수집 실패는 경고하고 턴 이후 종료 처리를 실패로 표시합니다
- 유지 관리는 성공했고, 중단되지 않았으며, 양보되지 않은 턴 이후에만 실행됩니다
- Compaction 오류는 새 프롬프트로 재시도해서는 안 됩니다

Codex 전용 추가 사항:

- 컨텍스트 프로젝션이 실패하면 경고하고 원래 프롬프트로 폴백합니다.
- 트랜스크립트 미러가 실패해도 폴백 메시지로 컨텍스트 엔진 종료 처리를 계속 시도합니다.
- 컨텍스트 엔진 Compaction이 성공한 뒤 Codex 네이티브 Compaction이 실패하면,
  컨텍스트 엔진이 기본인 경우 전체 OpenClaw Compaction을 실패 처리하지 마세요.

## 테스트 계획

### 단위 테스트

`extensions/codex/src/app-server` 아래에 테스트를 추가합니다.

1. `run-attempt.context-engine.test.ts`
   - 세션 파일이 있으면 Codex가 `bootstrap`을 호출합니다.
   - Codex가 미러링된 메시지, 토큰 예산, 도구 이름,
     인용 모드, 모델 ID, 프롬프트로 `assemble`을 호출합니다.
   - `systemPromptAddition`이 개발자 지침에 포함됩니다.
   - 조립된 메시지가 현재 요청 전에 프롬프트에 투영됩니다.
   - Codex가 트랜스크립트 미러링 후 `afterTurn`을 호출합니다.
   - `afterTurn`이 없으면 Codex가 `ingestBatch` 또는 메시지별 `ingest`를 호출합니다.
   - 성공한 턴 이후 턴 유지 관리가 실행됩니다.
   - 프롬프트 오류, 중단, 또는 yield 중단 시 턴 유지 관리가 실행되지 않습니다.

2. `context-engine-projection.test.ts`
   - 동일한 입력에 대해 안정적인 출력
   - 조립된 기록에 현재 프롬프트가 포함되어 있을 때 현재 프롬프트가 중복되지 않음
   - 빈 기록 처리
   - 역할 순서 보존
   - 시스템 프롬프트 추가분을 개발자 지침에만 포함

3. `compact.context-engine.test.ts`
   - 소유 컨텍스트 엔진의 기본 결과가 우선함
   - 함께 시도된 경우 Codex 네이티브 Compaction 상태가 세부 정보에 표시됨
   - Codex 네이티브 실패가 소유 컨텍스트 엔진 Compaction을 실패시키지 않음
   - 비소유 컨텍스트 엔진이 현재 네이티브 Compaction 동작을 보존함

### 업데이트할 기존 테스트

- 있으면 `extensions/codex/src/app-server/run-attempt.test.ts`, 없으면
  가장 가까운 Codex app-server 실행 테스트.
- Compaction 이벤트 세부 정보가 변경되는 경우에만 `extensions/codex/src/app-server/event-projector.test.ts`.
- config 동작이 변경되지 않는 한 `src/agents/harness/selection.test.ts`는 변경이
  필요하지 않아야 하며, 안정적으로 유지되어야 합니다.
- 내장 하네스 컨텍스트 엔진 테스트는 변경 없이 계속 통과해야 합니다.

### 통합 / 라이브 테스트

라이브 Codex 하네스 스모크 테스트를 추가하거나 확장합니다.

- `plugins.slots.contextEngine`을 테스트 엔진으로 설정
- `agents.defaults.model`을 `codex/*` 모델로 설정
- provider/model `agentRuntime.id = "codex"` 설정
- 테스트 엔진이 다음을 관찰했는지 확인:
  - bootstrap
  - assemble
  - afterTurn 또는 ingest
  - maintenance

OpenClaw 코어 테스트에서 lossless-claw를 요구하지 마세요. 작은 저장소 내 가짜
컨텍스트 엔진 Plugin을 사용하세요.

## 관측 가능성

Codex 컨텍스트 엔진 수명 주기 호출 주변에 디버그 로그를 추가합니다.

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped`와 이유
- `codex native compaction completed alongside context-engine compaction`

전체 프롬프트나 트랜스크립트 내용을 로깅하지 마세요.

유용한 곳에 구조화된 필드를 추가합니다.

- `sessionId`
- 기존 로깅 관행에 따라 수정 처리되거나 생략된 `sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 마이그레이션 / 호환성

이는 하위 호환되어야 합니다.

- 컨텍스트 엔진이 설정되지 않은 경우, 레거시 컨텍스트 엔진 동작은
  오늘의 Codex 하네스 동작과 동등해야 합니다.
- 컨텍스트 엔진 `assemble`이 실패하면 Codex는 원래
  프롬프트 경로로 계속 진행해야 합니다.
- 기존 Codex 스레드 바인딩은 계속 유효해야 합니다.
- 동적 도구 fingerprinting은 컨텍스트 엔진 출력을 포함하지 않아야 합니다. 그렇지 않으면
  모든 컨텍스트 변경이 새 Codex 스레드를 강제할 수 있습니다. 도구 카탈로그만
  동적 도구 fingerprint에 영향을 주어야 합니다.

## 열린 질문

1. 조립된 컨텍스트를 전부 사용자 프롬프트에 주입해야 하나요, 전부
   개발자 지침에 주입해야 하나요, 아니면 분할해야 하나요?

   권장 사항: 분할하세요. `systemPromptAddition`은 개발자 지침에 넣고,
   조립된 트랜스크립트 컨텍스트는 사용자 프롬프트 래퍼에 넣으세요. 이는 네이티브 스레드 기록을 변경하지 않으면서
   현재 Codex 프로토콜과 가장 잘 맞습니다.

2. 컨텍스트 엔진이 Compaction을 소유할 때 Codex 네이티브 Compaction을 비활성화해야 하나요?

   권장 사항: 초기에는 아니요. Codex 네이티브 Compaction은 app-server 스레드를
   계속 살려 두는 데 여전히 필요할 수 있습니다. 하지만 컨텍스트 엔진 Compaction이 아니라
   네이티브 Codex Compaction으로 보고되어야 합니다.

3. `before_prompt_build`는 컨텍스트 엔진 조립 전 또는 후에 실행해야 하나요?

   권장 사항: Codex의 경우 컨텍스트 엔진 투영 이후입니다. 그래야 일반 하네스
   훅이 Codex가 실제로 받을 프롬프트/개발자 지침을 볼 수 있습니다. 내장
   하네스 parity에 반대 순서가 필요하다면 선택한 순서를
   테스트에 인코딩하고 여기에 문서화하세요.

4. Codex app-server가 향후 구조화된 컨텍스트/기록 override를 받을 수 있나요?

   알 수 없습니다. 가능하다면 텍스트 투영 계층을 해당 프로토콜로 교체하고
   수명 주기 호출은 변경하지 마세요.

## 수락 기준

- `codex/*` 임베디드 하네스 턴이 선택된 컨텍스트 엔진의
  assemble 수명 주기를 호출합니다.
- 컨텍스트 엔진 `systemPromptAddition`이 Codex 개발자 지침에 영향을 줍니다.
- 조립된 컨텍스트가 Codex 턴 입력에 결정적으로 영향을 줍니다.
- 성공한 Codex 턴은 `afterTurn` 또는 ingest fallback을 호출합니다.
- 성공한 Codex 턴은 컨텍스트 엔진 턴 유지 관리를 실행합니다.
- 실패/중단/yield 중단된 턴은 턴 유지 관리를 실행하지 않습니다.
- 컨텍스트 엔진 소유 Compaction은 OpenClaw/Plugin 상태의 기본값으로 유지됩니다.
- Codex 네이티브 Compaction은 네이티브 Codex 동작으로 감사 가능하게 유지됩니다.
- 기존 내장 하네스 컨텍스트 엔진 동작은 변경되지 않습니다.
- 비레거시 컨텍스트 엔진이 선택되지 않았거나 조립이 실패한 경우 기존 Codex 하네스 동작은
  변경되지 않습니다.
