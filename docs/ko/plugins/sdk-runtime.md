---
read_when:
    - Plugin에서 코어 헬퍼를 호출해야 합니다 (TTS, STT, 이미지 생성, 웹 검색, 하위 에이전트, 노드)
    - api.runtime이 무엇을 노출하는지 이해하려고 합니다
    - Plugin 코드에서 config, agent 또는 media 헬퍼에 액세스하고 있습니다
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin에서 사용할 수 있는 주입된 런타임 헬퍼
title: Plugin 런타임 헬퍼
x-i18n:
    generated_at: "2026-05-11T20:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

등록 중 모든 plugin에 주입되는 `api.runtime` 객체의 참조 문서입니다. 호스트 내부 요소를 직접 가져오는 대신 이 헬퍼를 사용하세요.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ko/plugins/sdk-channel-plugins">
    채널 Plugin에서 이러한 헬퍼를 맥락에 맞게 사용하는 단계별 가이드입니다.
  </Card>
  <Card title="Provider plugins" href="/ko/plugins/sdk-provider-plugins">
    제공자 Plugin에서 이러한 헬퍼를 맥락에 맞게 사용하는 단계별 가이드입니다.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 구성 로드 및 쓰기

활성 호출 경로에 이미 전달된 구성을 선호하세요. 예를 들어 등록 중의 `api.config`나 채널/제공자 콜백의 `cfg` 인수입니다. 이렇게 하면 핫 경로에서 구성을 다시 파싱하는 대신 하나의 프로세스 스냅샷이 작업 전반에 흐릅니다.

오래 지속되는 핸들러에 현재 프로세스 스냅샷이 필요하고 해당 함수에 구성이 전달되지 않은 경우에만 `api.runtime.config.current()`를 사용하세요. 반환된 값은 읽기 전용입니다. 수정하기 전에 복제하거나 변경 헬퍼를 사용하세요.

도구 팩터리는 `ctx.runtimeConfig`와 `ctx.getRuntimeConfig()`를 받습니다. 도구 정의가 생성된 뒤 구성이 변경될 수 있는 오래 지속되는 도구의 `execute` 콜백 안에서는 getter를 사용하세요.

변경 사항은 `api.runtime.config.mutateConfigFile(...)` 또는 `api.runtime.config.replaceConfigFile(...)`로 영속화하세요. 각 쓰기는 명시적인 `afterWrite` 정책을 선택해야 합니다.

- `afterWrite: { mode: "auto" }`는 gateway 다시 로드 플래너가 결정하게 합니다.
- `afterWrite: { mode: "restart", reason: "..." }`는 작성자가 핫 리로드가 안전하지 않다고 아는 경우 깨끗한 재시작을 강제합니다.
- `afterWrite: { mode: "none", reason: "..." }`는 호출자가 후속 조치를 소유하는 경우에만 자동 다시 로드/재시작을 억제합니다.

변경 헬퍼는 `afterWrite`와 형식화된 `followUp` 요약을 반환하므로 호출자가 재시작을 요청했는지 로그하거나 테스트할 수 있습니다. 실제로 그 재시작이 언제 일어나는지는 여전히 gateway가 소유합니다.

`api.runtime.config.loadConfig()`와 `api.runtime.config.writeConfigFile(...)`는 `runtime-config-load-write` 아래의 더 이상 권장되지 않는 호환성 헬퍼입니다. 런타임에 한 번 경고하며, 마이그레이션 기간 동안 오래된 외부 plugin을 위해 계속 사용할 수 있습니다. 번들 plugin은 이를 사용하면 안 됩니다. plugin 코드가 이를 호출하거나 plugin SDK 하위 경로에서 이러한 헬퍼를 가져오면 구성 경계 가드가 실패합니다.

직접 SDK 가져오기에는 넓은
`openclaw/plugin-sdk/config-runtime` 호환성 배럴 대신 초점이 맞춰진 구성 하위 경로를 사용하세요. 타입에는 `config-contracts`, 이미 로드된 구성 어설션과 plugin
엔트리 조회에는 `plugin-config-runtime`, 현재 프로세스 스냅샷에는
`runtime-config-snapshot`, 쓰기에는
`config-mutation`을 사용하세요. 번들 plugin 테스트는 넓은 호환성 배럴을 모킹하는 대신 이러한 초점이 맞춰진
하위 경로를 직접 모킹해야 합니다.

내부 OpenClaw 런타임 코드도 같은 방향을 따릅니다. CLI, gateway 또는 프로세스 경계에서 구성을 한 번 로드한 다음 그 값을 전달하세요. 성공적인 변경 쓰기는 프로세스 런타임 스냅샷을 새로 고치고 내부 리비전을 진행시킵니다. 오래 지속되는 캐시는 구성을 로컬에서 직렬화하는 대신 런타임이 소유한 캐시 키를 기준으로 삼아야 합니다. 오래 지속되는 런타임 모듈에는 주변 `loadConfig()` 호출에 대한 무관용 스캐너가 있습니다. 전달된 `cfg`, 요청 `context.getRuntimeConfig()`, 또는 명시적인 프로세스 경계의 `getRuntimeConfig()`를 사용하세요.

제공자 및 채널 실행 경로는 구성 되읽기나 편집을 위해 반환된 파일 스냅샷이 아니라 활성 런타임 구성 스냅샷을 사용해야 합니다. 파일 스냅샷은 UI와 쓰기를 위해 SecretRef 마커 같은 원본 값을 보존합니다. 제공자 콜백에는 해석된 런타임 뷰가 필요합니다. 헬퍼가 활성 원본 스냅샷 또는 활성 런타임 스냅샷 중 하나로 호출될 수 있는 경우, 자격 증명을 읽기 전에 `selectApplicableRuntimeConfig()`를 거치도록 라우팅하세요.

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

    `runEmbeddedAgent(...)`는 plugin 코드에서 일반 OpenClaw 에이전트 턴을 시작하기 위한 중립적인 헬퍼입니다. 채널에서 트리거된 답변과 동일한 제공자/모델 해석 및 에이전트 하네스 선택을 사용합니다.

    `runEmbeddedPiAgent(...)`는 호환성 별칭으로 유지됩니다.

    `resolveThinkingPolicy(...)`는 제공자/모델이 지원하는 사고 수준과 선택적 기본값을 반환합니다. 제공자 Plugin은 해당 사고 훅을 통해 모델별 프로필을 소유하므로, 도구 plugin은 제공자 목록을 가져오거나 중복하는 대신 이 런타임 헬퍼를 호출해야 합니다.

    `normalizeThinkingLevel(...)`은 `on`, `x-high`, `extra high` 같은 사용자 텍스트를 해석된 정책과 대조하기 전에 정규 저장 수준으로 변환합니다.

    **세션 저장소 헬퍼**는 `api.runtime.agent.session` 아래에 있습니다.

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    런타임 쓰기에는 `updateSessionStore(...)` 또는 `updateSessionStoreEntry(...)`를 선호하세요. 이들은 Gateway가 소유한 세션 저장소 작성자를 거치며, 동시 업데이트를 보존하고 핫 캐시를 재사용합니다. `saveSessionStore(...)`는 호환성과 오프라인 유지관리식 재작성에 계속 사용할 수 있습니다.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    기본 모델 및 제공자 상수입니다.

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    제공자 내부 요소를 가져오거나 OpenClaw 모델/인증/기본 URL 준비를
    중복하지 않고 호스트가 소유한 텍스트 완성을 실행합니다.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    이 헬퍼는 OpenClaw 내장 런타임과 호스트가 소유한 런타임 구성 스냅샷이
    사용하는 것과 동일한 단순 완성 준비 경로를 사용합니다. 컨텍스트 엔진은
    세션에 바인딩된 `llm.complete` 기능을 받으므로, 모델 호출은 활성 세션의
    에이전트를 사용하며 기본 에이전트로 조용히 폴백하지 않습니다. 결과에는
    제공자/모델/에이전트 귀속 정보와, 사용 가능한 경우 정규화된 토큰,
    캐시, 추정 비용 사용량이 포함됩니다.

    <Warning>
    모델 재정의에는 구성에서 `plugins.entries.<id>.llm.allowModelOverride: true`를 통한 운영자 동의가 필요합니다. 신뢰된 plugin을 특정 정규 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.llm.allowedModels`를 사용하세요. 에이전트 간 완성에는 `plugins.entries.<id>.llm.allowAgentIdOverride: true`가 필요합니다.
    </Warning>

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
    모델 재정의(`provider`/`model`)에는 구성에서 `plugins.entries.<id>.subagent.allowModelOverride: true`를 통한 운영자 동의가 필요합니다. 신뢰되지 않은 plugin도 하위 에이전트를 실행할 수 있지만, 재정의 요청은 거부됩니다.
    </Warning>

    `deleteSession(...)`은 동일한 plugin이 `api.runtime.subagent.run(...)`을 통해 만든 세션을 삭제할 수 있습니다. 임의의 사용자 또는 운영자 세션을 삭제하려면 여전히 관리자 범위의 Gateway 요청이 필요합니다.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gateway에서 로드한 plugin 코드 또는 plugin CLI 명령에서 연결된 노드를 나열하고 노드 호스트 명령을 호출합니다. plugin이 페어링된 기기에서 로컬 작업을 소유할 때 사용하세요. 예를 들어 다른 Mac의 브라우저나 오디오 브리지입니다.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 내부에서는 이 런타임이 프로세스 내에서 동작합니다. plugin CLI 명령에서는 구성된 Gateway를 RPC로 호출하므로, `openclaw googlemeet recover-tab` 같은 명령이 터미널에서 페어링된 노드를 검사할 수 있습니다. Node 명령은 여전히 일반적인 Gateway 노드 페어링, 명령 허용 목록, plugin 노드 호출 정책, 노드 로컬 명령 처리를 거칩니다.

    위험한 노드 호스트 명령을 노출하는 Plugin은 `api.registerNodeInvokePolicy(...)`로 노드 호출 정책을 등록해야 합니다. 정책은 명령 허용 목록 검사 후, 명령이 노드로 전달되기 전에 Gateway에서 실행되므로 직접 `node.invoke` 호출과 더 높은 수준의 plugin 도구가 동일한 적용 경로를 공유합니다.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    TaskFlow 런타임을 기존 OpenClaw 세션 키 또는 신뢰된 도구 컨텍스트에 바인딩한 다음, 모든 호출에 소유자를 전달하지 않고 TaskFlow를 생성하고 관리합니다.

    TaskFlow는 내구성 있는 다단계 워크플로 상태를 추적합니다. 스케줄러가 아닙니다.
    향후 깨우기에는 Cron 또는 `api.session.workflow.scheduleSessionTurn(...)`을 사용한 뒤,
    해당 작업에 플로 상태, 하위 작업, 대기, 취소가 필요할 때 예약된 턴에서
    `managedFlows`를 사용하세요.

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

    자체 바인딩 계층에서 신뢰할 수 있는 OpenClaw 세션 키가 이미 있는 경우 `bindSession({ sessionKey, requesterOrigin })`를 사용하세요. 원시 사용자 입력에서 바인딩하지 마세요.

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

    코어 `messages.tts` 구성과 공급자 선택을 사용합니다. PCM 오디오 버퍼와 샘플 레이트를 반환합니다.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    이미지, 오디오, 동영상 분석입니다.

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

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    출력이 생성되지 않으면(예: 입력을 건너뜀) `{ text: undefined }`를 반환합니다.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`는 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`의 호환성 별칭으로 남아 있습니다.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    이미지 생성입니다.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    웹 검색입니다.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    저수준 미디어 유틸리티입니다.

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
    현재 런타임 구성 스냅샷과 트랜잭션 구성 쓰기입니다. 활성 호출 경로에 이미 전달된 구성을 우선 사용하세요. 핸들러가 프로세스 스냅샷을 직접 필요로 할 때만 `current()`를 사용하세요.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 및 `replaceConfigFile(...)`는 예를 들어 `{ mode: "restart", requiresRestart: true, reason }` 같은 `followUp` 값을 반환하며, 이는 Gateway에서 재시작 제어권을 가져오지 않고 작성자의 의도를 기록합니다.

  </Accordion>
  <Accordion title="api.runtime.system">
    시스템 수준 유틸리티입니다.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    이벤트 구독입니다.

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
    로깅입니다.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    모델 및 공급자 인증 확인입니다.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    상태 디렉터리 확인 및 SQLite 기반 키 지정 저장소입니다.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    키 지정 저장소는 재시작 후에도 유지되며 런타임에 바인딩된 plugin id별로 격리됩니다. 원자적 중복 제거 클레임에는 `registerIfAbsent(...)`를 사용하세요. 키가 없거나 만료되어 등록되면 `true`를 반환하고, 기존 활성 값이 이미 있으면 해당 값, 생성 시간 또는 TTL을 덮어쓰지 않고 `false`를 반환합니다. 제한: namespace당 `maxEntries`, Plugin당 활성 행 1,000개, 64KB 미만의 JSON 값, 선택적 TTL 만료.

    <Warning>
    이 릴리스에서는 번들 Plugin만 지원됩니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    메모리 도구 팩터리와 CLI입니다.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    채널별 런타임 헬퍼입니다(채널 Plugin이 로드된 경우 사용 가능).

    `api.runtime.channel.mentions`는 런타임 주입을 사용하는 번들 채널 Plugin을 위한 공유 수신 멘션 정책 표면입니다.

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

    `api.runtime.channel.mentions`는 이전 `resolveMentionGating*` 호환성 헬퍼를 의도적으로 노출하지 않습니다. 정규화된 `{ facts, policy }` 경로를 선호하세요.

  </Accordion>
</AccordionGroup>

## 런타임 참조 저장

`createPluginRuntimeStore`를 사용하여 `register` 콜백 외부에서 사용할 런타임 참조를 저장하세요.

<Steps>
  <Step title="저장소 만들기">
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
runtime-store ID에는 `pluginId`를 선호하세요. 더 낮은 수준의 `key` 형식은 하나의 Plugin이 의도적으로 둘 이상의 런타임 슬롯을 필요로 하는 드문 경우를 위한 것입니다.
</Note>

## 기타 최상위 `api` 필드

`api.runtime` 외에도 API 객체는 다음을 제공합니다:

<ParamField path="api.id" type="string">
  Plugin ID.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 표시 이름.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  현재 구성 스냅샷(사용 가능한 경우 활성 인메모리 런타임 스냅샷).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config`의 Plugin별 구성.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  범위가 지정된 로거(`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  현재 로드 모드. `"setup-runtime"`은 전체 엔트리 이전의 경량 시작/설정 구간입니다.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin 루트를 기준으로 경로를 해석합니다.
</ParamField>

## 관련 항목

- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델 및 레지스트리
- [SDK 진입점](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 옵션
- [SDK 개요](/ko/plugins/sdk-overview) — 하위 경로 참조
