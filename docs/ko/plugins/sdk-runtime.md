---
read_when:
    - Plugin에서 코어 헬퍼(TTS, STT, 이미지 생성, 웹 검색, 하위 에이전트, 노드)를 호출해야 합니다
    - api.runtime가 무엇을 노출하는지 이해하려는 경우
    - Plugin 코드에서 설정, 에이전트 또는 미디어 헬퍼에 접근하고 있습니다
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin에서 사용할 수 있는 주입된 런타임 헬퍼
title: Plugin 런타임 헬퍼
x-i18n:
    generated_at: "2026-04-30T06:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

`api.runtime` 객체에 대한 참조입니다. 이 객체는 등록 중 모든 Plugin에 주입됩니다. 호스트 내부 구현을 직접 가져오는 대신 이 헬퍼를 사용하세요.

<CardGroup cols={2}>
  <Card title="채널 Plugin" href="/ko/plugins/sdk-channel-plugins">
    채널 Plugin의 맥락에서 이 헬퍼를 사용하는 단계별 가이드입니다.
  </Card>
  <Card title="제공자 Plugin" href="/ko/plugins/sdk-provider-plugins">
    제공자 Plugin의 맥락에서 이 헬퍼를 사용하는 단계별 가이드입니다.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 구성 로드 및 쓰기

활성 호출 경로에 이미 전달된 구성을 우선 사용하세요. 예를 들어 등록 중에는 `api.config`, 채널/제공자 콜백에서는 `cfg` 인수를 사용합니다. 이렇게 하면 핫 경로에서 구성을 다시 파싱하는 대신 하나의 프로세스 스냅샷이 작업 전체를 따라 흐릅니다.

오래 지속되는 핸들러에 현재 프로세스 스냅샷이 필요하고 해당 함수에 구성이 전달되지 않은 경우에만 `api.runtime.config.current()`를 사용하세요. 반환된 값은 읽기 전용입니다. 편집하기 전에 복제하거나 변형 헬퍼를 사용하세요.

도구 팩터리는 `ctx.runtimeConfig`와 `ctx.getRuntimeConfig()`를 받습니다. 도구 정의가 만들어진 뒤 구성이 변경될 수 있는 오래 지속되는 도구의 `execute` 콜백 안에서는 getter를 사용하세요.

변경 사항은 `api.runtime.config.mutateConfigFile(...)` 또는 `api.runtime.config.replaceConfigFile(...)`로 유지하세요. 각 쓰기는 명시적인 `afterWrite` 정책을 선택해야 합니다.

- `afterWrite: { mode: "auto" }`는 Gateway 재로드 플래너가 결정하도록 합니다.
- `afterWrite: { mode: "restart", reason: "..." }`는 작성자가 핫 리로드가 안전하지 않다는 것을 알고 있을 때 깨끗한 재시작을 강제합니다.
- `afterWrite: { mode: "none", reason: "..." }`는 호출자가 후속 조치를 소유할 때만 자동 재로드/재시작을 억제합니다.

변형 헬퍼는 `afterWrite`와 형식이 지정된 `followUp` 요약을 반환하므로 호출자는 재시작을 요청했는지 로그로 남기거나 테스트할 수 있습니다. 해당 재시작이 실제로 언제 일어나는지는 여전히 Gateway가 소유합니다.

`api.runtime.config.loadConfig()`와 `api.runtime.config.writeConfigFile(...)`는 `runtime-config-load-write` 아래의 사용 중단된 호환성 헬퍼입니다. 런타임에서 한 번 경고하며, 마이그레이션 기간 동안 이전 외부 Plugin을 위해 계속 사용할 수 있습니다. 번들 Plugin은 이를 사용하면 안 됩니다. Plugin 코드가 이를 호출하거나 Plugin SDK 하위 경로에서 해당 헬퍼를 가져오면 구성 경계 가드가 실패합니다.

직접 SDK 가져오기에는 광범위한 `openclaw/plugin-sdk/config-runtime` 호환성 배럴 대신 집중된 구성 하위 경로를 사용하세요. 형식에는 `config-types`, 이미 로드된 구성 어설션과 Plugin 항목 조회에는 `plugin-config-runtime`, 현재 프로세스 스냅샷에는 `runtime-config-snapshot`, 쓰기에는 `config-mutation`을 사용합니다. 번들 Plugin 테스트는 광범위한 호환성 배럴을 모킹하는 대신 이러한 집중 하위 경로를 직접 모킹해야 합니다.

내부 OpenClaw 런타임 코드도 같은 방향을 따릅니다. CLI, Gateway 또는 프로세스 경계에서 구성을 한 번 로드한 다음 해당 값을 전달하세요. 성공한 변형 쓰기는 프로세스 런타임 스냅샷을 새로 고치고 내부 리비전을 증가시킵니다. 오래 지속되는 캐시는 구성을 로컬에서 직렬화하는 대신 런타임이 소유한 캐시 키를 기준으로 삼아야 합니다. 오래 지속되는 런타임 모듈에는 주변 `loadConfig()` 호출에 대해 무관용 스캐너가 있습니다. 전달된 `cfg`, 요청 `context.getRuntimeConfig()`, 또는 명시적 프로세스 경계의 `getRuntimeConfig()`를 사용하세요.

제공자 및 채널 실행 경로는 구성 읽기 또는 편집을 위해 반환된 파일 스냅샷이 아니라 활성 런타임 구성 스냅샷을 사용해야 합니다. 파일 스냅샷은 UI와 쓰기를 위해 SecretRef 마커 같은 소스 값을 보존합니다. 제공자 콜백에는 해석된 런타임 뷰가 필요합니다. 헬퍼가 활성 소스 스냅샷 또는 활성 런타임 스냅샷 중 하나로 호출될 수 있다면, 자격 증명을 읽기 전에 `selectApplicableRuntimeConfig()`를 거치도록 라우팅하세요.

## 런타임 네임스페이스

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    에이전트 ID, 디렉터리, 세션 관리입니다.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
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

    `runEmbeddedAgent(...)`는 Plugin 코드에서 일반 OpenClaw 에이전트 턴을 시작하기 위한 중립 헬퍼입니다. 채널이 트리거한 답장과 동일한 제공자/모델 해석 및 에이전트 하네스 선택을 사용합니다.

    `runEmbeddedPiAgent(...)`는 호환성 별칭으로 남아 있습니다.

    `resolveThinkingPolicy(...)`는 제공자/모델이 지원하는 추론 수준과 선택적 기본값을 반환합니다. 제공자 Plugin이 추론 훅을 통해 모델별 프로필을 소유하므로, 도구 Plugin은 제공자 목록을 가져오거나 복제하는 대신 이 런타임 헬퍼를 호출해야 합니다.

    `normalizeThinkingLevel(...)`는 `on`, `x-high`, `extra high` 같은 사용자 텍스트를 해석된 정책과 비교하기 전에 표준 저장 수준으로 변환합니다.

    **세션 저장소 헬퍼**는 `api.runtime.agent.session` 아래에 있습니다.

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    기본 모델 및 제공자 상수입니다.

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    백그라운드 하위 에이전트 실행을 시작하고 관리합니다.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    모델 재정의(`provider`/`model`)에는 구성의 `plugins.entries.<id>.subagent.allowModelOverride: true`를 통한 운영자 옵트인이 필요합니다. 신뢰할 수 없는 Plugin도 하위 에이전트를 실행할 수 있지만, 재정의 요청은 거부됩니다.
    </Warning>

    `deleteSession(...)`은 동일한 Plugin이 `api.runtime.subagent.run(...)`을 통해 만든 세션을 삭제할 수 있습니다. 임의의 사용자 또는 운영자 세션 삭제에는 여전히 관리자 범위의 Gateway 요청이 필요합니다.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gateway에 로드된 Plugin 코드 또는 Plugin CLI 명령에서 연결된 Node를 나열하고 Node 호스트 명령을 호출합니다. Plugin이 페어링된 기기에서 로컬 작업을 소유할 때 사용하세요. 예를 들어 다른 Mac의 브라우저 또는 오디오 브리지입니다.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 내부에서는 이 런타임이 인프로세스입니다. Plugin CLI 명령에서는 구성된 Gateway를 RPC로 호출하므로, `openclaw googlemeet recover-tab` 같은 명령이 터미널에서 페어링된 Node를 검사할 수 있습니다. Node 명령은 여전히 일반 Gateway Node 페어링, 명령 허용 목록, Plugin Node 호출 정책, Node 로컬 명령 처리를 거칩니다.

    위험한 Node 호스트 명령을 노출하는 Plugin은 `api.registerNodeInvokePolicy(...)`로 Node 호출 정책을 등록해야 합니다. 이 정책은 명령 허용 목록 검사 이후, 명령이 Node로 전달되기 전에 Gateway에서 실행되므로, 직접 `node.invoke` 호출과 더 높은 수준의 Plugin 도구가 동일한 적용 경로를 공유합니다.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow 런타임을 기존 OpenClaw 세션 키 또는 신뢰할 수 있는 도구 컨텍스트에 바인딩한 다음, 모든 호출에서 소유자를 전달하지 않고 Task Flow를 만들고 관리합니다.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

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

    자체 바인딩 계층에서 신뢰할 수 있는 OpenClaw 세션 키를 이미 가지고 있을 때 `bindSession({ sessionKey, requesterOrigin })`을 사용하세요. 원시 사용자 입력에서 바인딩하지 마세요.

  </Accordion>
  <Accordion title="api.runtime.tts">
    텍스트 음성 변환 합성입니다.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    코어 `messages.tts` 구성과 제공자 선택을 사용합니다. PCM 오디오 버퍼와 샘플 속도를 반환합니다.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    이미지, 오디오, 비디오 분석입니다.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    출력이 생성되지 않으면(예: 건너뛴 입력) `{ text: undefined }`를 반환합니다.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`는 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`의 호환성 별칭으로 남아 있습니다.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    이미지 생성.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    웹 검색.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
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

  </Accordion>
  <Accordion title="api.runtime.config">
    현재 런타임 구성 스냅샷 및 트랜잭션 방식 구성 쓰기. 활성 호출 경로에 이미 전달된 구성을 우선 사용하세요. 핸들러가 프로세스 스냅샷을 직접 필요로 할 때만 `current()`를 사용하세요.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 및 `replaceConfigFile(...)`는 `followUp` 값을 반환합니다. 예를 들어 `{ mode: "restart", requiresRestart: true, reason }`이며, 이는 Gateway에서 재시작 제어를 가져오지 않고 작성자의 의도를 기록합니다.

  </Accordion>
  <Accordion title="api.runtime.system">
    시스템 수준 유틸리티.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    이벤트 구독.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    로깅.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    모델 및 제공자 인증 확인.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    상태 디렉터리 확인 및 SQLite 기반 키 저장소.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    키 저장소는 재시작 후에도 유지되며 런타임에 바인딩된 Plugin ID별로 격리됩니다. 제한: 네임스페이스당 `maxEntries`, Plugin당 1,000개의 활성 행, 64KB 미만의 JSON 값, 선택적 TTL 만료.

    <Warning>
    이 릴리스에서는 번들 Plugin만 지원됩니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    메모리 도구 팩터리 및 CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    채널별 런타임 헬퍼(채널 Plugin이 로드된 경우 사용 가능).

    `api.runtime.channel.mentions`는 런타임 주입을 사용하는 번들 채널 Plugin의 공유 인바운드 멘션 정책 표면입니다.

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

    사용 가능한 멘션 헬퍼:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions`는 이전 `resolveMentionGating*` 호환성 헬퍼를 의도적으로 노출하지 않습니다. 정규화된 `{ facts, policy }` 경로를 우선 사용하세요.

  </Accordion>
</AccordionGroup>

## 런타임 참조 저장

`register` 콜백 외부에서 사용할 런타임 참조를 저장하려면 `createPluginRuntimeStore`를 사용하세요.

<Steps>
  <Step title="스토어 만들기">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="진입점에 연결">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="다른 파일에서 접근">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
런타임 스토어 ID에는 `pluginId`를 사용하는 것이 좋습니다. 더 낮은 수준의 `key` 형식은 하나의 Plugin이 의도적으로 둘 이상의 런타임 슬롯을 필요로 하는 드문 경우를 위한 것입니다.
</Note>

## 기타 최상위 `api` 필드

`api.runtime` 외에도 API 객체는 다음을 제공합니다.

<ParamField path="api.id" type="string">
  Plugin ID.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 표시 이름.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  현재 구성 스냅샷(사용 가능한 경우 활성 메모리 내 런타임 스냅샷).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config`의 Plugin별 구성.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  범위가 지정된 로거(`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  현재 로드 모드. `"setup-runtime"`은 전체 진입 전의 경량 시작/설정 구간입니다.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin 루트를 기준으로 경로를 확인합니다.
</ParamField>

## 관련 항목

- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델 및 레지스트리
- [SDK 진입점](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 옵션
- [SDK 개요](/ko/plugins/sdk-overview) — 하위 경로 참조
