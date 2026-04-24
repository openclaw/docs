---
read_when:
    - OpenClaw에서 Pi SDK 통합 설계 이해하기
    - Pi용 에이전트 세션 수명 주기, 도구 또는 프로바이더 연결 수정
summary: OpenClaw의 내장 Pi 에이전트 통합 아키텍처와 세션 수명 주기
title: Pi 통합 아키텍처
x-i18n:
    generated_at: "2026-04-24T15:21:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

이 문서는 OpenClaw가 AI 에이전트 기능을 구동하기 위해 [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 및 그 형제 패키지(`pi-ai`, `pi-agent-core`, `pi-tui`)와 어떻게 통합되는지 설명합니다.

## 개요

OpenClaw는 메시징 Gateway 아키텍처에 AI 코딩 에이전트를 내장하기 위해 pi SDK를 사용합니다. pi를 하위 프로세스로 생성하거나 RPC 모드를 사용하는 대신, OpenClaw는 `createAgentSession()`을 통해 pi의 `AgentSession`을 직접 import하고 인스턴스화합니다. 이 내장 방식은 다음을 제공합니다.

- 세션 수명 주기 및 이벤트 처리에 대한 완전한 제어
- 사용자 지정 도구 주입(메시징, sandbox, 채널별 작업)
- 채널/컨텍스트별 시스템 프롬프트 사용자 지정
- 브랜칭/Compaction 지원이 포함된 세션 영속성
- 장애 조치를 포함한 다중 계정 인증 프로필 순환
- 프로바이더에 구애받지 않는 모델 전환

## 패키지 종속성

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| 패키지           | 용도                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | 핵심 LLM 추상화: `Model`, `streamSimple`, 메시지 타입, 프로바이더 API                                  |
| `pi-agent-core`   | 에이전트 루프, 도구 실행, `AgentMessage` 타입                                                          |
| `pi-coding-agent` | 고수준 SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, 내장 도구          |
| `pi-tui`          | 터미널 UI 컴포넌트(OpenClaw의 로컬 TUI 모드에서 사용)                                                  |

## 파일 구조

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/에서 재내보내기
├── pi-embedded-runner/
│   ├── run.ts                     # 메인 진입점: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # 세션 설정이 포함된 단일 시도 로직
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 타입
│   │   ├── payloads.ts            # 실행 결과에서 응답 payload 빌드
│   │   ├── images.ts              # 비전 모델 이미지 주입
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # 중단 오류 감지
│   ├── cache-ttl.ts               # 컨텍스트 가지치기를 위한 캐시 TTL 추적
│   ├── compact.ts                 # 수동/자동 Compaction 로직
│   ├── extensions.ts              # 내장 실행용 pi 확장 로드
│   ├── extra-params.ts            # 프로바이더별 스트림 params
│   ├── google.ts                  # Google/Gemini 턴 순서 수정
│   ├── history.ts                 # 기록 제한(DM 대 그룹)
│   ├── lanes.ts                   # 세션/전역 명령 레인
│   ├── logger.ts                  # 하위 시스템 로거
│   ├── model.ts                   # ModelRegistry를 통한 모델 확인
│   ├── runs.ts                    # 활성 실행 추적, 중단, 큐
│   ├── sandbox-info.ts            # 시스템 프롬프트용 sandbox 정보
│   ├── session-manager-cache.ts   # SessionManager 인스턴스 캐싱
│   ├── session-manager-init.ts    # 세션 파일 초기화
│   ├── system-prompt.ts           # 시스템 프롬프트 빌더
│   ├── tool-split.ts              # 도구를 builtIn과 custom으로 분할
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel 매핑, 오류 설명
├── pi-embedded-subscribe.ts       # 세션 이벤트 구독/디스패치
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # 이벤트 핸들러 팩토리
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # 스트리밍 블록 응답 청킹
├── pi-embedded-messaging.ts       # 메시징 도구 sent 추적
├── pi-embedded-helpers.ts         # 오류 분류, 턴 유효성 검사
├── pi-embedded-helpers/           # 헬퍼 모듈
├── pi-embedded-utils.ts           # 서식 유틸리티
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # 도구용 AbortSignal 래핑
├── pi-tools.policy.ts             # 도구 허용 목록/거부 목록 정책
├── pi-tools.read.ts               # read 도구 사용자 지정
├── pi-tools.schema.ts             # 도구 스키마 정규화
├── pi-tools.types.ts              # AnyAgentTool 타입 별칭
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition 어댑터
├── pi-settings.ts                 # 설정 재정의
├── pi-hooks/                      # 사용자 지정 pi 훅
│   ├── compaction-safeguard.ts    # 보호 장치 확장
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL 컨텍스트 가지치기 확장
│   └── context-pruning/
├── model-auth.ts                  # 인증 프로필 확인
├── auth-profiles.ts               # 프로필 저장소, cooldown, 장애 조치
├── model-selection.ts             # 기본 모델 확인
├── models-config.ts               # models.json 생성
├── model-catalog.ts               # 모델 카탈로그 캐시
├── context-window-guard.ts        # 컨텍스트 윈도 유효성 검사
├── failover-error.ts              # FailoverError 클래스
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # 시스템 프롬프트 파라미터 확인
├── system-prompt-report.ts        # 디버그 보고서 생성
├── tool-summaries.ts              # 도구 설명 요약
├── tool-policy.ts                 # 도구 정책 확인
├── transcript-policy.ts           # 전사 유효성 검사 정책
├── skills.ts                      # Skills 스냅샷/프롬프트 빌드
├── skills/                        # Skills 하위 시스템
├── sandbox.ts                     # sandbox 컨텍스트 확인
├── sandbox/                       # sandbox 하위 시스템
├── channel-tools.ts               # 채널별 도구 주입
├── openclaw-tools.ts              # OpenClaw 전용 도구
├── bash-tools.ts                  # exec/process 도구
├── apply-patch.ts                 # apply_patch 도구(OpenAI)
├── tools/                         # 개별 도구 구현
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

채널별 메시지 작업 런타임은 이제 `src/agents/tools` 아래가 아니라 Plugin 소유 extension 디렉터리에 있습니다. 예를 들면 다음과 같습니다.

- Discord Plugin 작업 런타임 파일
- Slack Plugin 작업 런타임 파일
- Telegram Plugin 작업 런타임 파일
- WhatsApp Plugin 작업 런타임 파일

## 핵심 통합 흐름

### 1. 내장 에이전트 실행

메인 진입점은 `pi-embedded-runner/run.ts`의 `runEmbeddedPiAgent()`입니다.

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. 세션 생성

`runEmbeddedPiAgent()`에 의해 호출되는 `runEmbeddedAttempt()` 내부에서 pi SDK가 사용됩니다.

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. 이벤트 구독

`subscribeEmbeddedPiSession()`은 pi의 `AgentSession` 이벤트를 구독합니다.

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

처리되는 이벤트는 다음과 같습니다.

- `message_start` / `message_end` / `message_update`(스트리밍 텍스트/사고)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. 프롬프팅

설정 후 세션에 프롬프트가 전달됩니다.

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK는 LLM으로 전송, 도구 호출 실행, 응답 스트리밍을 포함한 전체 에이전트 루프를 처리합니다.

이미지 주입은 프롬프트 로컬 방식입니다. OpenClaw는 현재 프롬프트에서 이미지 참조를 로드하고 해당 턴에만 `images`를 통해 전달합니다. 이전 기록 턴을 다시 스캔하여 이미지 payload를 재주입하지는 않습니다.

## 도구 아키텍처

### 도구 파이프라인

1. **기본 도구**: pi의 `codingTools`(`read`, `bash`, `edit`, `write`)
2. **사용자 지정 대체**: OpenClaw는 `bash`를 `exec`/`process`로 대체하고 sandbox용으로 `read`/`edit`/`write`를 사용자 지정합니다.
3. **OpenClaw 도구**: 메시징, 브라우저, canvas, 세션, Cron, Gateway 등
4. **채널 도구**: Discord/Telegram/Slack/WhatsApp별 작업 도구
5. **정책 필터링**: 프로필, 프로바이더, 에이전트, 그룹, sandbox 정책에 따라 도구를 필터링
6. **스키마 정규화**: Gemini/OpenAI 특이 사항에 맞게 스키마 정리
7. **AbortSignal 래핑**: 중단 신호를 준수하도록 도구 래핑

### 도구 정의 어댑터

pi-agent-core의 `AgentTool`은 pi-coding-agent의 `ToolDefinition`과 `execute` 시그니처가 다릅니다. `pi-tool-definition-adapter.ts`의 어댑터가 이를 연결합니다.

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent 시그니처는 pi-agent-core와 다릅니다.
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### 도구 분할 전략

`splitSdkTools()`는 모든 도구를 `customTools`를 통해 전달합니다.

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 비어 있음. 모든 것을 재정의합니다.
    customTools: toToolDefinitions(options.tools),
  };
}
```

이를 통해 OpenClaw의 정책 필터링, sandbox 통합, 확장된 도구 세트가 프로바이더 전반에서 일관되게 유지됩니다.

## 시스템 프롬프트 구성

시스템 프롬프트는 `buildAgentSystemPrompt()`(`system-prompt.ts`)에서 빌드됩니다. 여기서는 Tooling, Tool Call Style, 안전 가드레일, OpenClaw CLI 참조, Skills, 문서, 워크스페이스, Sandbox, 메시징, Reply Tags, Voice, Silent Replies, Heartbeats, 런타임 메타데이터 섹션을 포함한 전체 프롬프트를 조합하며, 활성화된 경우 Memory와 Reactions, 그리고 선택적 컨텍스트 파일과 추가 시스템 프롬프트 콘텐츠도 포함합니다. 하위 에이전트에 사용되는 최소 프롬프트 모드에서는 섹션이 잘려 나갑니다.

프롬프트는 세션 생성 후 `applySystemPromptOverrideToSession()`을 통해 적용됩니다.

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## 세션 관리

### 세션 파일

세션은 트리 구조(`id`/`parentId` 연결)를 가진 JSONL 파일입니다. Pi의 `SessionManager`가 영속성을 처리합니다.

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw는 도구 결과 안전성을 위해 이를 `guardSessionManager()`로 감쌉니다.

### 세션 캐싱

`session-manager-cache.ts`는 반복적인 파일 파싱을 피하기 위해 SessionManager 인스턴스를 캐시합니다.

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 기록 제한

`limitHistoryTurns()`는 채널 유형(DM 대 그룹)에 따라 대화 기록을 잘라냅니다.

### Compaction

자동 Compaction은 컨텍스트 오버플로 시 트리거됩니다. 일반적인 오버플로 시그니처에는 `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded`가 포함됩니다. `compactEmbeddedPiSessionDirect()`는 수동 Compaction을 처리합니다.

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 인증 및 모델 확인

### 인증 프로필

OpenClaw는 프로바이더당 여러 API 키를 갖는 인증 프로필 저장소를 유지합니다.

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

프로필은 cooldown 추적과 함께 실패 시 순환됩니다.

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### 모델 확인

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// pi의 ModelRegistry와 AuthStorage를 사용
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### 장애 조치

`FailoverError`는 구성된 경우 모델 폴백을 트리거합니다.

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi 확장

OpenClaw는 특수 동작을 위해 사용자 지정 Pi 확장을 로드합니다.

### Compaction 보호 장치

`src/agents/pi-hooks/compaction-safeguard.ts`는 적응형 토큰 예산 책정과 도구 실패 및 파일 작업 요약을 포함한 가드레일을 Compaction에 추가합니다.

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### 컨텍스트 가지치기

`src/agents/pi-hooks/context-pruning.ts`는 캐시 TTL 기반 컨텍스트 가지치기를 구현합니다.

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## 스트리밍 및 블록 응답

### 블록 청킹

`EmbeddedBlockChunker`는 스트리밍 텍스트를 개별 응답 블록으로 관리합니다.

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final 태그 제거

스트리밍 출력은 `<think>`/`<thinking>` 블록을 제거하고 `<final>` 콘텐츠를 추출하도록 처리됩니다.

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> 콘텐츠 제거
  // enforceFinalTag인 경우 <final>...</final> 콘텐츠만 반환
};
```

### 응답 지시문

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` 같은 응답 지시문은 파싱되어 추출됩니다.

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## 오류 처리

### 오류 분류

`pi-embedded-helpers.ts`는 적절한 처리를 위해 오류를 분류합니다.

```typescript
isContextOverflowError(errorText)     // 컨텍스트가 너무 큼
isCompactionFailureError(errorText)   // Compaction 실패
isAuthAssistantError(lastAssistant)   // 인증 실패
isRateLimitAssistantError(...)        // 속도 제한됨
isFailoverAssistantError(...)         // 장애 조치해야 함
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Level 폴백

Thinking Level이 지원되지 않으면 폴백됩니다.

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Sandbox 통합

sandbox 모드가 활성화되면 도구와 경로가 제한됩니다.

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // sandbox 처리된 read/edit/write 도구 사용
  // Exec는 컨테이너에서 실행
  // Browser는 bridge URL 사용
}
```

## 프로바이더별 처리

### Anthropic

- 거부 매직 문자열 제거
- 연속 역할에 대한 턴 유효성 검사
- 엄격한 업스트림 Pi 도구 파라미터 유효성 검사

### Google/Gemini

- Plugin 소유 도구 스키마 정리

### OpenAI

- Codex 모델용 `apply_patch` 도구
- Thinking Level 다운그레이드 처리

## TUI 통합

OpenClaw에는 pi-tui 컴포넌트를 직접 사용하는 로컬 TUI 모드도 있습니다.

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

이는 pi의 기본 모드와 유사한 대화형 터미널 경험을 제공합니다.

## Pi CLI와의 주요 차이점

| 측면            | Pi CLI                  | OpenClaw 내장                                                                                  |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 호출 방식       | `pi` 명령 / RPC         | `createAgentSession()`을 통한 SDK                                                              |
| 도구            | 기본 코딩 도구          | 사용자 지정 OpenClaw 도구 모음                                                                 |
| 시스템 프롬프트 | AGENTS.md + 프롬프트    | 채널/컨텍스트별 동적 구성                                                                      |
| 세션 저장소     | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`(또는 `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| 인증            | 단일 자격 증명          | 순환이 포함된 다중 프로필                                                                      |
| 확장            | 디스크에서 로드         | 프로그래밍 방식 + 디스크 경로                                                                  |
| 이벤트 처리     | TUI 렌더링              | 콜백 기반(`onBlockReply` 등)                                                                   |

## 향후 고려 사항

재작업 가능성이 있는 영역은 다음과 같습니다.

1. **도구 시그니처 정렬**: 현재 pi-agent-core와 pi-coding-agent 시그니처 간을 어댑트하고 있음
2. **SessionManager 래핑**: `guardSessionManager`는 안전성을 추가하지만 복잡성을 높임
3. **확장 로딩**: pi의 `ResourceLoader`를 더 직접적으로 사용할 수 있음
4. **스트리밍 핸들러 복잡성**: `subscribeEmbeddedPiSession`이 많이 커짐
5. **프로바이더 특이 사항**: pi가 잠재적으로 처리할 수 있는 많은 프로바이더별 코드 경로

## 테스트

Pi 통합 커버리지는 다음 테스트 스위트에 걸쳐 있습니다.

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

라이브/옵트인:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`(`OPENCLAW_LIVE_TEST=1` 활성화)

현재 실행 명령은 [Pi 개발 워크플로](/ko/pi-dev)를 참조하세요.

## 관련 항목

- [Pi 개발 워크플로](/ko/pi-dev)
- [설치 개요](/ko/install)
