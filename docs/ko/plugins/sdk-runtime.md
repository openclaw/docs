---
read_when:
    - Plugin에서 코어 헬퍼를 호출해야 합니다(TTS, STT, 이미지 생성, 웹 검색, 하위 에이전트, 노드)
    - |-
      OpenClaw docs i18n 입력>
      api.runtime가 무엇을 노출하는지 이해하려는 경우
    - Plugin 코드에서 구성, 에이전트 또는 미디어 헬퍼에 접근하고 있습니다
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin에서 사용할 수 있는 주입된 런타임 헬퍼
title: Plugin 런타임 헬퍼
x-i18n:
    generated_at: "2026-06-30T13:55:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

OpenClaw에서 참조할 수 있는 `api.runtime` 객체입니다. 등록 중 모든 plugin에 주입됩니다. 호스트 내부를 직접 가져오는 대신 이 helper를 사용하세요.

<CardGroup cols={2}>
  <Card title="Channel plugin" href="/ko/plugins/sdk-channel-plugins">
    Channel plugin에서 이러한 helper를 맥락에 맞게 사용하는 단계별 가이드입니다.
  </Card>
  <Card title="Provider plugin" href="/ko/plugins/sdk-provider-plugins">
    Provider plugin에서 이러한 helper를 맥락에 맞게 사용하는 단계별 가이드입니다.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Config 로드 및 쓰기

활성 호출 경로에 이미 전달된 config를 우선 사용하세요. 예를 들어 등록 중의 `api.config`나 channel/provider callback의 `cfg` 인자가 있습니다. 이렇게 하면 hot path에서 config를 다시 파싱하는 대신 하나의 프로세스 snapshot이 작업 전체를 흐르게 됩니다.

수명이 긴 handler가 현재 프로세스 snapshot을 필요로 하고 해당 함수에 전달된 config가 없을 때만 `api.runtime.config.current()`를 사용하세요. 반환된 값은 읽기 전용입니다. 수정하기 전에 복제하거나 mutation helper를 사용하세요.

Tool factory는 `ctx.runtimeConfig`와 `ctx.getRuntimeConfig()`를 받습니다. tool definition이 생성된 뒤 config가 바뀔 수 있는 경우 수명이 긴 tool의 `execute` callback 안에서 getter를 사용하세요.

변경 사항은 `api.runtime.config.mutateConfigFile(...)` 또는 `api.runtime.config.replaceConfigFile(...)`로 persist하세요. 각 쓰기는 명시적인 `afterWrite` policy를 선택해야 합니다.

- `afterWrite: { mode: "auto" }`는 gateway reload planner가 결정하게 합니다.
- `afterWrite: { mode: "restart", reason: "..." }`는 writer가 hot reload가 안전하지 않다는 것을 알고 있을 때 clean restart를 강제합니다.
- `afterWrite: { mode: "none", reason: "..." }`는 caller가 후속 조치를 소유할 때만 자동 reload/restart를 억제합니다.

mutation helper는 `afterWrite`와 typed `followUp` summary를 반환하므로 caller가 restart를 요청했는지 log하거나 test할 수 있습니다. 실제 restart가 언제 일어나는지는 여전히 gateway가 소유합니다.

`api.runtime.config.loadConfig()` 및 `api.runtime.config.writeConfigFile(...)`는 `runtime-config-load-write` 아래의 deprecated compatibility helper입니다. 런타임에서 한 번 경고하며, migration window 동안 기존 외부 plugin을 위해 계속 사용할 수 있습니다. bundled plugin은 이를 사용해서는 안 됩니다. plugin code가 이를 호출하거나 plugin SDK subpath에서 해당 helper를 가져오면 config boundary guard가 실패합니다.

직접 SDK import의 경우 넓은
`openclaw/plugin-sdk/config-runtime` compatibility barrel 대신 focused config subpath를 사용하세요. type에는 `config-contracts`, 이미 로드된 config assertion과 plugin entry lookup에는 `plugin-config-runtime`, 현재 프로세스 snapshot에는 `runtime-config-snapshot`, 쓰기에는 `config-mutation`을 사용하세요. Bundled plugin test는 넓은 compatibility barrel을 mock하는 대신 이러한 focused subpath를 직접 mock해야 합니다.

내부 OpenClaw runtime code도 같은 방향을 따릅니다. CLI, gateway 또는 process boundary에서 config를 한 번 로드한 뒤 해당 값을 전달하세요. 성공한 mutation write는 process runtime snapshot을 refresh하고 내부 revision을 advance합니다. 수명이 긴 cache는 config를 로컬에서 serialize하는 대신 runtime 소유 cache key를 기준으로 삼아야 합니다. 수명이 긴 runtime module에는 ambient `loadConfig()` 호출에 대한 zero-tolerance scanner가 있습니다. 전달된 `cfg`, request의 `context.getRuntimeConfig()`, 또는 명시적인 process boundary의 `getRuntimeConfig()`를 사용하세요.

Provider 및 channel 실행 경로는 config readback 또는 editing을 위해 반환된 file snapshot이 아니라 활성 runtime config snapshot을 사용해야 합니다. File snapshot은 UI와 쓰기를 위해 SecretRef marker 같은 source value를 보존합니다. provider callback에는 resolved runtime view가 필요합니다. helper가 활성 source snapshot 또는 활성 runtime snapshot 중 하나로 호출될 수 있는 경우 credential을 읽기 전에 `selectApplicableRuntimeConfig()`를 거치세요.

## 재사용 가능한 runtime utility

bot-authored inbound message에는 inbound `botLoopProtection` fact를 사용하세요. Core는 session record와 dispatch 전에 공유 in-memory sliding-window guard를 적용하며, policy를 하나의 channel에 묶지 않습니다. guard는 `(scopeId, conversationId, participant pair)` key를 추적하고, pair의 양방향을 함께 count하며, window budget을 초과하면 cooldown을 적용하고, 비활성 entry를 기회적으로 prune합니다.

이 동작을 operator에게 노출하는 channel plugin은 baseline budget에 공유 `channels.defaults.botLoopProtection` shape를 우선 사용한 뒤, channel/provider별 override를 위에 layer해야 합니다. 공유 config는 user-facing이므로 초 단위를 사용합니다.

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

resolved turn과 함께 normalized bot-pair fact를 전달하세요. Core가 default, unit conversion, `enabled` semantic을 resolve합니다.

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

공유 inbound reply runner를 거치지 않는 custom
two-party event loop에만 `openclaw/plugin-sdk/pair-loop-guard-runtime`를 직접 사용하세요.

## Runtime namespace

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent identity, directory, session management입니다.

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)`는 plugin code에서 일반 OpenClaw agent turn을 시작하기 위한 중립 helper입니다. channel-triggered reply와 동일한 provider/model resolution 및 agent-harness selection을 사용합니다.

    `runEmbeddedPiAgent(...)`는 기존 plugin을 위한 deprecated compatibility alias로 남아 있습니다. 새 code는 `runEmbeddedAgent(...)`를 사용해야 합니다.

    `resolveThinkingPolicy(...)`는 provider/model이 지원하는 thinking level과 optional default를 반환합니다. Provider plugin은 thinking hook을 통해 model-specific profile을 소유하므로, tool plugin은 provider list를 import하거나 duplicate하는 대신 이 runtime helper를 호출해야 합니다.

    `normalizeThinkingLevel(...)`은 `on`, `x-high`, `extra high` 같은 user text를 resolved policy와 대조하기 전에 canonical stored level로 변환합니다.

    **Session store helper**는 `api.runtime.agent.session` 아래에 있습니다.

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });
    ```

    session workflow에는 `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` 또는 `upsertSessionEntry(...)`를 우선 사용하세요. 이러한 helper는 agent/session identity로 session을 address하므로 plugin이 legacy `sessions.json` storage shape에 의존하지 않습니다. session activity를 refresh하지 않아야 하는 metadata-only patch에는 `preserveActivity: true`를 사용하고, callback이 complete entry를 반환하며 삭제된 field가 삭제된 상태로 남아야 할 때만 `replaceEntry: true`를 사용하세요.

    transcript 읽기와 쓰기의 경우 `openclaw/plugin-sdk/session-transcript-runtime`을 import하고 `{ agentId, sessionKey, sessionId }`와 함께 `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` 또는 `withSessionTranscriptWriteLock(...)`를 사용하세요. 이러한 API를 통해 plugin은 transcript를 identify하고, event를 읽고, message를 append하고, update를 publish하며, 동일한 transcript write lock 아래에서 관련 operation을 실행할 수 있습니다. `sessionFile`을 전달하거나, `resolveSessionTranscriptLegacyFileTarget(...)`을 사용하거나, `openclaw/plugin-sdk/agent-harness-runtime`에서 low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)`를 import하는 것은 deprecated입니다. 이러한 path는 이미 활성 transcript artifact를 받는 legacy code를 위해서만 존재합니다.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)`, `resolveAndPersistSessionFile(...)`는 여전히 legacy whole-store 또는 transcript-file shape에 의도적으로 의존하는 plugin을 위한 deprecated compatibility helper입니다. 새 plugin code는 이러한 helper를 사용해서는 안 되며, 기존 caller는 entry helper와 transcript identity helper로 migration해야 합니다.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    기본 model 및 provider constant:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    provider internal을 import하거나 OpenClaw model/auth/base URL preparation을
    duplicate하지 않고 host-owned text completion을 실행합니다.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    helper는 OpenClaw의 built-in runtime과 동일한 simple-completion preparation path 및 host-owned runtime config snapshot을 사용합니다. Context engine은 session-bound `llm.complete` capability를 받으므로 model call은 활성 session의 agent를 사용하며 default agent로 조용히 fall back하지 않습니다. result에는 provider/model/agent attribution과 함께 사용 가능한 경우 normalized token, cache, estimated cost usage가 포함됩니다.

    <Warning>
    Model override는 config에서 `plugins.entries.<id>.llm.allowModelOverride: true`를 통한 operator opt-in이 필요합니다. trusted plugin을 특정 canonical `provider/model` target으로 제한하려면 `plugins.entries.<id>.llm.allowedModels`를 사용하세요. Cross-agent completion에는 `plugins.entries.<id>.llm.allowAgentIdOverride: true`가 필요합니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    background subagent run을 launch하고 manage합니다.

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
    모델 재정의(`provider`/`model`)에는 config에서 `plugins.entries.<id>.subagent.allowModelOverride: true`를 통해 운영자가 명시적으로 동의해야 합니다. 신뢰할 수 없는 Plugin도 여전히 하위 에이전트를 실행할 수 있지만, 재정의 요청은 거부됩니다.
    </Warning>

    `deleteSession(...)`은 같은 Plugin이 `api.runtime.subagent.run(...)`을 통해 만든 세션을 삭제할 수 있습니다. 임의의 사용자 또는 운영자 세션을 삭제하려면 여전히 관리자 범위의 Gateway 요청이 필요합니다.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gateway에 로드된 Plugin 코드 또는 Plugin CLI 명령에서 연결된 노드를 나열하고 노드 호스트 명령을 호출합니다. Plugin이 페어링된 기기에서 로컬 작업을 소유할 때 사용하세요. 예를 들어 다른 Mac의 브라우저 또는 오디오 브리지입니다.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 내부에서 이 런타임은 인프로세스입니다. Plugin CLI 명령에서는 구성된 Gateway를 RPC로 호출하므로, `openclaw googlemeet recover-tab` 같은 명령이 터미널에서 페어링된 노드를 검사할 수 있습니다. 노드 명령은 여전히 일반적인 Gateway 노드 페어링, 명령 허용 목록, Plugin 노드 호출 정책, 노드 로컬 명령 처리를 거칩니다.

    위험한 노드 호스트 명령을 노출하는 Plugin은 `api.registerNodeInvokePolicy(...)`로 노드 호출 정책을 등록해야 합니다. 이 정책은 명령 허용 목록 검사 후, 명령이 노드로 전달되기 전에 Gateway에서 실행되므로 직접 `node.invoke` 호출과 상위 수준 Plugin 도구가 같은 적용 경로를 공유합니다.

    <Warning>
    선택적 `scopes` 필드는 호출에 필요한 Gateway 운영자 범위를 요청합니다. OpenClaw는 번들 Plugin과 신뢰할 수 있는 공식 Plugin 설치에 대해서만 이를 적용합니다. 다른 Plugin의 요청은 호출 권한을 승격하지 않습니다. 신뢰할 수 있는 Plugin이 `operator.admin` 같은 더 엄격한 Gateway 범위로 노드 명령을 호출해야 할 때만 사용하세요.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow 런타임을 기존 OpenClaw 세션 키 또는 신뢰할 수 있는 도구 컨텍스트에 바인딩한 다음, 모든 호출에 소유자를 전달하지 않고 Task Flow를 만들고 관리합니다.

    Task Flow는 지속적인 다단계 워크플로 상태를 추적합니다. 스케줄러가 아닙니다.
    향후 깨우기에는 Cron 또는 `api.session.workflow.scheduleSessionTurn(...)`을 사용하고,
    해당 작업에 플로 상태, 하위 작업, 대기 또는 취소가 필요할 때 예약된 턴에서
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

    자체 바인딩 계층에서 신뢰할 수 있는 OpenClaw 세션 키를 이미 가지고 있을 때는 `bindSession({ sessionKey, requesterOrigin })`을 사용하세요. 원시 사용자 입력에서 바인딩하지 마세요.

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

    코어 `messages.tts` 구성과 제공자 선택을 사용합니다. PCM 오디오 버퍼와 샘플 레이트를 반환합니다.

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

    출력이 생성되지 않으면(예: 건너뛴 입력) `{ text: undefined }`를 반환합니다.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`은 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`의 호환성 별칭으로 남아 있습니다.
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
    현재 런타임 구성 스냅샷과 트랜잭션 방식의 구성 쓰기입니다. 활성 호출 경로에
    이미 전달된 구성을 선호하세요. 핸들러가 프로세스 스냅샷을 직접 필요로 할 때만
    `current()`를 사용하세요.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)`과 `replaceConfigFile(...)`은 `followUp`
    값을 반환합니다. 예를 들어 `{ mode: "restart", requiresRestart: true, reason }`이며,
    이는 gateway에서 재시작 제어를 빼앗지 않고 작성자의 의도를 기록합니다.

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

    `runCommandWithTimeout(...)`은 캡처된 `stdout`과 `stderr`, 선택적
    잘림 개수, `code`, `signal`, `killed`, `termination`, 그리고
    `noOutputTimedOut`을 반환합니다. 시간 초과 및 무출력 시간 초과 결과는
    자식 프로세스가 0이 아닌 종료 코드를 제공하지 않을 때 `code: 124`를 보고합니다.
    시간 초과가 아닌 시그널 종료는 여전히 `code: null`을 반환할 수 있으므로,
    시간 초과 이유를 구분하려면 `termination`과 `noOutputTimedOut`을 사용하세요.

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
    모델 및 제공자 인증 확인입니다.

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
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    키 기반 저장소는 재시작 후에도 유지되며 런타임에 바인딩된 Plugin id별로 격리됩니다. 원자적 중복 제거 클레임에는 `registerIfAbsent(...)`를 사용하세요. 키가 없거나 만료되어 등록되면 `true`를 반환하고, 이미 활성 값이 있으면 해당 값, 생성 시간 또는 TTL을 덮어쓰지 않고 `false`를 반환합니다. 제한: 네임스페이스당 `maxEntries`, Plugin당 활성 행 6,000개, 64KB 미만의 JSON 값, 선택적 TTL 만료. 쓰기가 Plugin 행 한도를 초과할 경우, 런타임은 쓰기 대상 네임스페이스에서 가장 오래된 활성 행을 제거할 수 있습니다. 형제 네임스페이스는 해당 쓰기로 제거되지 않으며, 네임스페이스가 충분한 행을 확보할 수 없으면 쓰기는 여전히 실패합니다.

    <Warning>
    이 릴리스에서는 번들 Plugin만 지원됩니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    메모리 도구 팩토리와 CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    채널별 런타임 헬퍼(채널 Plugin이 로드된 경우 사용 가능).

    `api.runtime.channel.media`는 채널 미디어 다운로드와 저장에 권장되는 표면입니다.

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    원격 URL을 OpenClaw 미디어로 만들어야 할 때는 `saveRemoteMedia(...)`를 사용하세요. Plugin이 Plugin 소유 인증, 리디렉션 또는 허용 목록 처리를 통해 이미 `Response`를 가져온 경우에는 `saveResponseMedia(...)`를 사용하세요. Plugin이 검사, 변환, 복호화 또는 재업로드를 위해 원시 바이트가 필요한 경우에만 `readRemoteMediaBuffer(...)`를 사용하세요. `fetchRemoteMedia(...)`는 `readRemoteMediaBuffer(...)`의 더 이상 사용되지 않는 호환성 별칭으로 남아 있습니다.

    `api.runtime.channel.mentions`는 런타임 주입을 사용하는 번들 채널 Plugin을 위한 공유 인바운드 멘션 정책 표면입니다.

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

`register` 콜백 외부에서 사용할 런타임 참조를 저장하려면 `createPluginRuntimeStore`를 사용하세요.

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
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
  <Step title="Access from other files">
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
런타임 저장소 ID에는 `pluginId`를 선호하세요. 더 낮은 수준의 `key` 형식은 하나의 Plugin이 의도적으로 둘 이상의 런타임 슬롯을 필요로 하는 드문 경우를 위한 것입니다.
</Note>

## 기타 최상위 `api` 필드

`api.runtime` 외에도 API 객체는 다음을 제공합니다.

<ParamField path="api.id" type="string">
  Plugin id.
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
- [SDK 엔트리 포인트](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 옵션
- [SDK 개요](/ko/plugins/sdk-overview) — 하위 경로 참조
