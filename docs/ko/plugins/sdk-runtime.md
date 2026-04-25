---
read_when:
    - Plugin에서 코어 helper(TTS, STT, 이미지 생성, 웹 검색, 서브에이전트, Node)를 호출해야 하는 경우
    - '`api.runtime`가 무엇을 노출하는지 이해하려는 경우'
    - Plugin 코드에서 config, 에이전트 또는 미디어 helper에 접근하는 경우
sidebarTitle: Runtime Helpers
summary: api.runtime -- Plugin에서 사용할 수 있는 주입된 런타임 helper
title: Plugin 런타임 helper
x-i18n:
    generated_at: "2026-04-25T06:07:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Plugin 등록 중 모든 Plugin에 주입되는 `api.runtime` 객체의 참조입니다.
호스트 내부 구현을 직접 import하는 대신 이 helper를 사용하세요.

<Tip>
  **실습 가이드를 찾고 있나요?** [Channel Plugins](/ko/plugins/sdk-channel-plugins)
  또는 [Provider Plugins](/ko/plugins/sdk-provider-plugins)에서 이 helper가 실제로 어떻게 쓰이는지 단계별 가이드를 확인하세요.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 런타임 네임스페이스

### `api.runtime.agent`

에이전트 identity, 디렉터리, 세션 관리.

```typescript
// 에이전트 작업 디렉터리 해석
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// 에이전트 워크스페이스 해석
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// 에이전트 identity 가져오기
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// 기본 thinking 수준 가져오기
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// 에이전트 timeout 가져오기
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// 워크스페이스 존재 보장
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 내장 에이전트 턴 실행
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)`는 Plugin 코드에서 일반 OpenClaw
에이전트 턴을 시작하기 위한 중립 helper입니다. 채널 트리거 응답과 동일한 provider/model 해석 및
에이전트 harness 선택을 사용합니다.

`runEmbeddedPiAgent(...)`는 호환성 별칭으로 남아 있습니다.

**세션 저장소 helper**는 `api.runtime.agent.session` 아래에 있습니다:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

기본 model 및 provider 상수:

```typescript
const model = api.runtime.agent.defaults.model; // 예: "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 예: "anthropic"
```

### `api.runtime.subagent`

백그라운드 서브에이전트 실행을 시작하고 관리합니다.

```typescript
// 서브에이전트 실행 시작
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // 선택적 재정의
  model: "gpt-4.1-mini", // 선택적 재정의
  deliver: false,
});

// 완료 대기
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// 세션 메시지 읽기
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// 세션 삭제
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  모델 재정의(`provider`/`model`)에는 config의
  `plugins.entries.<id>.subagent.allowModelOverride: true`를 통한 운영자 opt-in이 필요합니다.
  신뢰되지 않은 Plugin도 서브에이전트를 실행할 수는 있지만, 재정의 요청은 거부됩니다.
</Warning>

### `api.runtime.nodes`

연결된 Node를 나열하고 Gateway에 로드된 Plugin
코드 또는 Plugin CLI 명령에서 node-host 명령을 호출합니다. 다른 Mac의 browser 또는 오디오 브리지처럼, Plugin이 페어링된 디바이스에서 로컬 작업을 소유할 때 사용하세요.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Gateway 내부에서 이 런타임은 프로세스 내 동작입니다. Plugin CLI 명령에서는
구성된 Gateway를 RPC로 호출하므로, `openclaw googlemeet
recover-tab` 같은 명령이 터미널에서 페어링된 Node를 검사할 수 있습니다. Node 명령은 여전히 일반 Gateway Node 페어링, 명령 allowlist, node-local 명령 처리 과정을 거칩니다.

### `api.runtime.taskFlow`

기존 OpenClaw 세션 키 또는 신뢰된 도구 컨텍스트에 TaskFlow 런타임을 바인딩한 뒤, 매 호출마다 소유자를 전달하지 않고 TaskFlow를 생성하고 관리합니다.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

자체 바인딩 계층에서 이미 신뢰된 OpenClaw 세션 키를 가지고 있다면
`bindSession({ sessionKey, requesterOrigin })`를 사용하세요. 원시 사용자 입력에서 바인딩하지 마세요.

### `api.runtime.tts`

텍스트 음성 변환.

```typescript
// 일반 TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 전화용 최적화 TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 사용 가능한 음성 목록
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

코어 `messages.tts` config 및 provider 선택을 사용합니다. PCM 오디오
버퍼 + 샘플 레이트를 반환합니다.

### `api.runtime.mediaUnderstanding`

이미지, 오디오, 비디오 분석.

```typescript
// 이미지 설명
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// 오디오 전사
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // 선택 사항, MIME을 추론할 수 없을 때 사용
});

// 비디오 설명
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// 일반 파일 분석
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

출력이 생성되지 않으면(예: 입력이 건너뛰어진 경우) `{ text: undefined }`를 반환합니다.

<Info>
  `api.runtime.stt.transcribeAudioFile(...)`는
  `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`의 호환성 별칭으로 남아 있습니다.
</Info>

### `api.runtime.imageGeneration`

이미지 생성.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

웹 검색.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

저수준 미디어 유틸리티.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Config 로드 및 쓰기.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

시스템 수준 유틸리티.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

이벤트 구독.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

로깅.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

모델 및 provider 인증 해석.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

state 디렉터리 해석.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

메모리 도구 factory 및 CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

채널 전용 런타임 helper(채널 Plugin이 로드된 경우 사용 가능).

`api.runtime.channel.mentions`는 런타임 주입을 사용하는
번들 채널 Plugin을 위한 공용 인바운드 멘션 정책 인터페이스입니다:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

사용 가능한 멘션 helper:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions`는 의도적으로 오래된
`resolveMentionGating*` 호환성 helper를 노출하지 않습니다. 정규화된
`{ facts, policy }` 경로를 우선 사용하세요.

## 런타임 참조 저장

`register` 콜백 밖에서 사용할 런타임 참조를 저장하려면
`createPluginRuntimeStore`를 사용하세요:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// 엔트리 포인트에서
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// 다른 파일에서
export function getRuntime() {
  return store.getRuntime(); // 초기화되지 않았으면 throw
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // 초기화되지 않았으면 null 반환
}
```

런타임 저장소 identity에는 `pluginId`를 우선 사용하세요. 더 낮은 수준의 `key` 형식은
하나의 Plugin이 의도적으로 둘 이상의 런타임 슬롯이 필요할 때 같은 드문 경우를 위한 것입니다.

## 기타 최상위 `api` 필드

`api.runtime` 외에도 API 객체는 다음을 제공합니다:

| 필드                     | 타입                      | 설명                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                    |
| `api.name`               | `string`                  | Plugin 표시 이름                                                                             |
| `api.config`             | `OpenClawConfig`          | 현재 config 스냅샷(가능한 경우 활성 메모리 내 런타임 스냅샷)                                 |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin 전용 config                                           |
| `api.logger`             | `PluginLogger`            | 범위가 지정된 로거(`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 전체 엔트리 이전의 가벼운 시작/setup 창입니다            |
| `api.resolvePath(input)` | `(string) => string`      | Plugin 루트를 기준으로 상대 경로 해석                                                        |

## 관련 항목

- [SDK overview](/ko/plugins/sdk-overview) — subpath 참조
- [SDK entry points](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 옵션
- [Plugin internals](/ko/plugins/architecture) — capability 모델 및 레지스트리
