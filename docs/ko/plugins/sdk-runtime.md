---
read_when:
    - Plugin에서 코어 헬퍼를 호출해야 합니다(TTS, STT, 이미지 생성, 웹 검색, 서브에이전트, 노드)
    - api.runtime이 무엇을 노출하는지 이해하려는 경우
    - Plugin 코드에서 구성, 에이전트 또는 미디어 헬퍼에 접근하고 있습니다
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin에서 사용할 수 있는 주입된 런타임 헬퍼
title: Plugin 런타임 헬퍼
x-i18n:
    generated_at: "2026-07-04T20:29:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

등록 중 모든 Plugin에 주입되는 `api.runtime` 객체에 대한 참조입니다. 호스트 내부를 직접 가져오는 대신 이 헬퍼들을 사용하세요.

<CardGroup cols={2}>
  <Card title="채널 Plugin" href="/ko/plugins/sdk-channel-plugins">
    채널 Plugin의 맥락에서 이 헬퍼들을 사용하는 단계별 가이드입니다.
  </Card>
  <Card title="Provider Plugin" href="/ko/plugins/sdk-provider-plugins">
    Provider Plugin의 맥락에서 이 헬퍼들을 사용하는 단계별 가이드입니다.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 구성 로드 및 쓰기

활성 호출 경로에 이미 전달된 구성을 우선 사용하세요. 예를 들어 등록 중에는 `api.config`, 채널/provider 콜백에서는 `cfg` 인수를 사용합니다. 이렇게 하면 핫 경로에서 구성을 다시 파싱하는 대신 하나의 프로세스 스냅샷이 작업 전반에 흐르게 됩니다.

오래 유지되는 핸들러에 현재 프로세스 스냅샷이 필요하고 해당 함수에 전달된 구성이 없을 때만 `api.runtime.config.current()`를 사용하세요. 반환값은 읽기 전용입니다. 수정하기 전에 복제하거나 변경 헬퍼를 사용하세요.

도구 팩터리는 `ctx.runtimeConfig`와 `ctx.getRuntimeConfig()`를 받습니다. 도구 정의가 생성된 뒤 구성이 바뀔 수 있는 오래 유지되는 도구의 `execute` 콜백 안에서는 getter를 사용하세요.

변경 사항은 `api.runtime.config.mutateConfigFile(...)` 또는 `api.runtime.config.replaceConfigFile(...)`로 유지하세요. 각 쓰기는 명시적인 `afterWrite` 정책을 선택해야 합니다.

- `afterWrite: { mode: "auto" }`는 Gateway 재로드 플래너가 결정하게 합니다.
- `afterWrite: { mode: "restart", reason: "..." }`는 작성자가 핫 재로드가 안전하지 않다는 것을 알고 있을 때 깨끗한 재시작을 강제합니다.
- `afterWrite: { mode: "none", reason: "..." }`는 호출자가 후속 조치를 소유할 때만 자동 재로드/재시작을 억제합니다.

변경 헬퍼는 호출자가 재시작을 요청했는지 로그로 남기거나 테스트할 수 있도록 `afterWrite`와 타입이 지정된 `followUp` 요약을 반환합니다. 해당 재시작이 실제로 언제 일어나는지는 여전히 Gateway가 소유합니다.

`api.runtime.config.loadConfig()`와 `api.runtime.config.writeConfigFile(...)`은 `runtime-config-load-write` 아래의 사용 중단된 호환성 헬퍼입니다. 런타임에서 한 번 경고하며, 마이그레이션 기간 동안 오래된 외부 Plugin을 위해 계속 사용할 수 있습니다. 번들 Plugin은 이를 사용하면 안 됩니다. Plugin 코드가 이를 호출하거나 Plugin SDK 하위 경로에서 해당 헬퍼를 가져오면 구성 경계 가드가 실패합니다.

직접 SDK 가져오기의 경우 넓은 범위의
`openclaw/plugin-sdk/config-runtime` 호환성 배럴 대신 초점이 맞춰진 구성 하위 경로를 사용하세요. 타입에는 `config-contracts`, 이미 로드된 구성 어설션과 Plugin
엔트리 조회에는 `plugin-config-runtime`, 현재 프로세스 스냅샷에는
`runtime-config-snapshot`, 쓰기에는 `config-mutation`을 사용합니다. 번들 Plugin 테스트는 넓은 호환성 배럴을 모킹하는 대신 이러한 초점이 맞춰진
하위 경로를 직접 모킹해야 합니다.

내부 OpenClaw 런타임 코드도 같은 방향을 따릅니다. CLI, Gateway, 또는 프로세스 경계에서 구성을 한 번 로드한 뒤 그 값을 전달하세요. 성공적인 변경 쓰기는 프로세스 런타임 스냅샷을 새로고침하고 내부 리비전을 진행합니다. 오래 유지되는 캐시는 구성을 로컬에서 직렬화하는 대신 런타임이 소유한 캐시 키를 기준으로 삼아야 합니다. 오래 유지되는 런타임 모듈에는 주변 `loadConfig()` 호출에 대한 무관용 스캐너가 있습니다. 전달된 `cfg`, 요청 `context.getRuntimeConfig()`, 또는 명시적인 프로세스 경계의 `getRuntimeConfig()`를 사용하세요.

Provider 및 채널 실행 경로는 구성 읽기 또는 편집을 위해 반환된 파일 스냅샷이 아니라 활성 런타임 구성 스냅샷을 사용해야 합니다. 파일 스냅샷은 UI와 쓰기를 위해 SecretRef 마커 같은 원본 값을 보존합니다. Provider 콜백에는 해석된 런타임 뷰가 필요합니다. 헬퍼가 활성 원본 스냅샷 또는 활성 런타임 스냅샷 중 하나로 호출될 수 있다면, 자격 증명을 읽기 전에 `selectApplicableRuntimeConfig()`를 거치도록 라우팅하세요.

## 재사용 가능한 런타임 유틸리티

봇이 작성한 인바운드 메시지에는 인바운드 `botLoopProtection` 사실을 사용하세요. 코어는 정책을 특정 채널 하나에 묶지 않고, 세션 기록 및 디스패치 전에 공유 인메모리 슬라이딩 윈도우 가드를 적용합니다. 가드는 `(scopeId, conversationId, participant pair)` 키를 추적하고, 한 쌍의 양방향 이벤트를 함께 계산하며, 윈도우 예산을 초과하면 쿨다운을 적용하고, 비활성 항목을 기회적으로 정리합니다.

이 동작을 운영자에게 노출하는 채널 Plugin은 기준 예산에 공유 `channels.defaults.botLoopProtection` 형태를 우선 사용한 뒤, 그 위에 채널/provider별 오버라이드를 계층화해야 합니다. 공유 구성은 사용자에게 표시되므로 초 단위를 사용합니다.

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

정규화된 봇 쌍 사실을 해석된 턴과 함께 전달하세요. 코어는 기본값, 단위 변환, `enabled` 의미 체계를 해석합니다.

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

공유 인바운드 답장 러너를 거치지 않는 사용자 지정
양자 이벤트 루프에만 `openclaw/plugin-sdk/pair-loop-guard-runtime`를 직접 사용하세요.

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)`는 Plugin 코드에서 일반 OpenClaw 에이전트 턴을 시작하기 위한 중립 헬퍼입니다. 채널에서 트리거된 답장과 동일한 provider/model 해석 및 에이전트 하네스 선택을 사용합니다.

    `runEmbeddedPiAgent(...)`는 기존 Plugin을 위한 사용 중단된 호환성 별칭으로 남아 있습니다. 새 코드는 `runEmbeddedAgent(...)`를 사용해야 합니다.

    `resolveThinkingPolicy(...)`는 provider/model이 지원하는 thinking level과 선택적 기본값을 반환합니다. Provider Plugin은 thinking 훅을 통해 모델별 프로필을 소유하므로, 도구 Plugin은 provider 목록을 가져오거나 중복하는 대신 이 런타임 헬퍼를 호출해야 합니다.

    `normalizeThinkingLevel(...)`은 `on`, `x-high`, 또는 `extra high` 같은 사용자 텍스트를 해석된 정책과 대조하기 전에 정규 저장 level로 변환합니다.

    **세션 저장소 헬퍼**는 `api.runtime.agent.session` 아래에 있습니다.

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    세션 워크플로에는 `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, 또는 `upsertSessionEntry(...)`를 우선 사용하세요. 이 헬퍼들은 Plugin이 레거시 `sessions.json` 저장 형태에 의존하지 않도록 에이전트/세션 ID로 세션을 다룹니다. 세션 활동을 새로고침하면 안 되는 메타데이터 전용 패치에는 `preserveActivity: true`를 사용하고, 콜백이 완전한 엔트리를 반환하며 삭제된 필드가 삭제된 상태로 유지되어야 할 때만 `replaceEntry: true`를 사용하세요.

    Plugin이 유지된 세션에서 작업을 시작할 때 `runWithWorkAdmission(...)`을 사용하세요. 콜백은 보관되었거나 동시에 교체된 세션을 거부하고, 보관/재설정/삭제 변경이 완료와 조율되도록 유지하며, 에이전트 실행으로 전달해야 하는 `AbortSignal`을 받습니다.

    transcript 읽기 및 쓰기의 경우 `openclaw/plugin-sdk/session-transcript-runtime`를 가져오고 `{ agentId, sessionKey, sessionId }`와 함께 `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, 또는 `withSessionTranscriptWriteLock(...)`를 사용하세요. 이 API를 통해 Plugin은 transcript를 식별하고, 이벤트를 읽고, 메시지를 추가하고, 업데이트를 게시하며, 같은 transcript 쓰기 잠금 아래에서 관련 작업을 실행할 수 있습니다. `sessionFile`을 전달하거나, `resolveSessionTranscriptLegacyFileTarget(...)`을 사용하거나, `openclaw/plugin-sdk/agent-harness-runtime`에서 저수준 `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)`를 가져오는 것은 사용 중단되었습니다. 해당 경로는 이미 활성 transcript 아티팩트를 받는 레거시 코드만을 위해 존재합니다.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)`, `resolveAndPersistSessionFile(...)`은 여전히 레거시 전체 저장소 또는 transcript 파일 형태에 의도적으로 의존하는 Plugin을 위한 사용 중단된 호환성 헬퍼입니다. 새 Plugin 코드는 이 헬퍼들을 사용하면 안 되며, 기존 호출자는 엔트리 헬퍼와 transcript ID 헬퍼로 마이그레이션해야 합니다.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    기본 모델 및 provider 상수입니다.

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Provider 내부를 가져오거나 OpenClaw 모델/인증/기본 URL 준비를
    중복하지 않고 호스트가 소유한 텍스트 완성을 실행합니다.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    이 헬퍼는 OpenClaw의 내장 런타임과 동일한 단순 완성 준비 경로 및
    호스트 소유 런타임 구성 스냅샷을 사용합니다. 컨텍스트 엔진은 세션에 바인딩된 `llm.complete` 기능을 받으므로, 모델 호출은
    활성 세션의 에이전트를 사용하며 기본 에이전트로 조용히 폴백하지 않습니다. 결과에는 provider/model/agent 귀속 정보와 함께, 사용 가능한 경우 정규화된 토큰,
    캐시, 추정 비용 사용량이 포함됩니다.

    <Warning>
    모델 재정의는 config에서 `plugins.entries.<id>.llm.allowModelOverride: true`를 통해 운영자가 명시적으로 선택해야 합니다. `plugins.entries.<id>.llm.allowedModels`를 사용하여 신뢰할 수 있는 Plugin을 특정 표준 `provider/model` 대상으로 제한하세요. 에이전트 간 완성에는 `plugins.entries.<id>.llm.allowAgentIdOverride: true`가 필요합니다.
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
    모델 재정의(`provider`/`model`)는 config에서 `plugins.entries.<id>.subagent.allowModelOverride: true`를 통해 운영자가 명시적으로 선택해야 합니다. 신뢰할 수 없는 Plugin도 하위 에이전트를 실행할 수 있지만, 재정의 요청은 거부됩니다.
    </Warning>

    `deleteSession(...)`은 같은 Plugin이 `api.runtime.subagent.run(...)`을 통해 만든 세션을 삭제할 수 있습니다. 임의의 사용자 또는 운영자 세션을 삭제하려면 여전히 관리자 범위의 Gateway 요청이 필요합니다.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    연결된 노드를 나열하고 Gateway에서 로드된 Plugin 코드 또는 Plugin CLI 명령에서 노드 호스트 명령을 호출합니다. Plugin이 페어링된 기기에서 로컬 작업을 소유할 때 사용하세요. 예를 들어 다른 Mac의 브라우저 또는 오디오 브리지입니다.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 내부에서는 이 런타임이 프로세스 내에 있습니다. Plugin CLI 명령에서는 구성된 Gateway를 RPC로 호출하므로, `openclaw googlemeet recover-tab` 같은 명령이 터미널에서 페어링된 노드를 검사할 수 있습니다. 노드 명령은 여전히 일반적인 Gateway 노드 페어링, 명령 허용 목록, Plugin 노드 호출 정책, 노드 로컬 명령 처리를 거칩니다.

    위험한 노드 호스트 명령을 노출하는 Plugin은 `api.registerNodeInvokePolicy(...)`로 노드 호출 정책을 등록해야 합니다. 정책은 Gateway에서 명령 허용 목록 검사가 끝난 뒤, 명령이 노드로 전달되기 전에 실행되므로 직접 `node.invoke` 호출과 더 높은 수준의 Plugin 도구가 같은 강제 적용 경로를 공유합니다.

    <Warning>
    선택 사항인 `scopes` 필드는 호출에 사용할 Gateway 운영자 범위를 요청합니다. OpenClaw는 번들 Plugin 및 신뢰할 수 있는 공식 Plugin 설치에 대해서만 이를 존중하며, 다른 Plugin의 요청은 호출 권한을 승격하지 않습니다. 신뢰할 수 있는 Plugin이 `operator.admin` 같은 더 엄격한 Gateway 범위로 노드 명령을 호출해야 할 때만 사용하세요.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow 런타임을 기존 OpenClaw 세션 키 또는 신뢰할 수 있는 도구 컨텍스트에 바인딩한 다음, 매 호출마다 소유자를 전달하지 않고 Task Flow를 만들고 관리합니다.

    Task Flow는 지속적인 다단계 워크플로 상태를 추적합니다. 스케줄러가 아닙니다.
    이후 깨우기에는 Cron 또는 `api.session.workflow.scheduleSessionTurn(...)`을 사용한 다음,
    해당 작업에 흐름 상태, 자식 작업, 대기 또는 취소가 필요할 때 예약된 턴에서
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

    출력이 생성되지 않으면(예: 입력을 건너뜀) `{ text: undefined }`를 반환합니다.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`은 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`의 호환성 별칭으로 유지됩니다.
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
    현재 런타임 config 스냅샷과 트랜잭션 방식의 config 쓰기입니다. 활성 호출 경로에 이미 전달된
    config를 우선 사용하세요. 핸들러가 프로세스 스냅샷을 직접 필요로 할 때만
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
    값을 반환합니다. 예: `{ mode: "restart", requiresRestart: true, reason }`.
    이 값은 gateway에서 재시작 제어를 빼앗지 않고 작성자의 의도를 기록합니다.

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
    잘림 횟수, `code`, `signal`, `killed`, `termination`, 그리고
    `noOutputTimedOut`을 반환합니다. 제한 시간 및 출력 없음 제한 시간 결과는 자식 프로세스가 0이 아닌 종료 코드를 제공하지 않을 때
    `code: 124`를 보고합니다. 제한 시간이 아닌
    signal 종료는 여전히 `code: null`을 반환할 수 있으므로, 제한 시간 이유를 구분하려면
    `termination`과 `noOutputTimedOut`을 사용하세요.

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
    상태 디렉터리 해석 및 SQLite 기반 키 저장소.

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

    키 저장소는 재시작 후에도 유지되며 런타임에 바인딩된 Plugin id별로 격리됩니다. 원자적 중복 제거 클레임에는 `registerIfAbsent(...)`를 사용하세요. 키가 없거나 만료되어 등록되면 `true`를 반환하고, 이미 살아 있는 값이 있으면 그 값, 생성 시간 또는 TTL을 덮어쓰지 않고 `false`를 반환합니다. 제한: 네임스페이스당 `maxEntries`, Plugin당 살아 있는 행 6,000개, 64KB 미만의 JSON 값, 선택적 TTL 만료. 쓰기가 Plugin 행 한도를 초과할 경우 런타임은 쓰기 대상 네임스페이스에서 가장 오래된 살아 있는 행을 제거할 수 있습니다. 해당 쓰기에서는 형제 네임스페이스가 제거되지 않으며, 네임스페이스가 충분한 행을 비울 수 없으면 쓰기는 여전히 실패합니다.

    <Warning>
    이 릴리스에서는 번들 Plugin만 지원됩니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    메모리 도구 팩터리와 CLI.

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

    원격 URL이 OpenClaw 미디어가 되어야 할 때 `saveRemoteMedia(...)`를 사용하세요. Plugin이 Plugin 소유 인증, 리디렉션 또는 허용 목록 처리를 통해 이미 `Response`를 가져온 경우 `saveResponseMedia(...)`를 사용하세요. Plugin이 검사, 변환, 복호화 또는 재업로드를 위해 원시 바이트가 필요한 경우에만 `readRemoteMediaBuffer(...)`를 사용하세요. `fetchRemoteMedia(...)`는 `readRemoteMediaBuffer(...)`의 더 이상 사용되지 않는 호환성 별칭으로 남아 있습니다.

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

    `api.runtime.channel.mentions`는 의도적으로 이전 `resolveMentionGating*` 호환성 헬퍼를 노출하지 않습니다. 정규화된 `{ facts, policy }` 경로를 선호하세요.

  </Accordion>
</AccordionGroup>

## 런타임 참조 저장

`register` 콜백 밖에서 사용할 런타임 참조를 저장하려면 `createPluginRuntimeStore`를 사용하세요.

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
  <Step title="엔트리 포인트에 연결">
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
runtime-store ID에는 `pluginId`를 선호하세요. 더 낮은 수준의 `key` 형식은 하나의 Plugin이 의도적으로 런타임 슬롯을 둘 이상 필요로 하는 드문 경우를 위한 것입니다.
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
  현재 로드 모드. `"setup-runtime"`은 가벼운 전체 엔트리 전 시작/설정 구간입니다.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin 루트를 기준으로 경로를 해석합니다.
</ParamField>

## 관련 항목

- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델 및 레지스트리
- [SDK 엔트리 포인트](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 옵션
- [SDK 개요](/ko/plugins/sdk-overview) — 하위 경로 참조
