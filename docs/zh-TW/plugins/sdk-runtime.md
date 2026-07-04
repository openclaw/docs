---
read_when:
    - 你需要從外掛呼叫核心輔助工具（TTS、STT、影像生成、網路搜尋、子代理、節點）
    - 你想了解 api.runtime 暴露了哪些內容
    - 你正從外掛程式碼存取設定、代理或媒體輔助工具
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供外掛使用的注入式執行階段輔助工具
title: 外掛執行階段輔助工具
x-i18n:
    generated_at: "2026-07-04T20:24:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Reference for the `api.runtime` object injected into every plugin during registration. Use these helpers instead of importing host internals directly.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/zh-TW/plugins/sdk-channel-plugins">
    Step-by-step guide that uses these helpers in context for channel plugins.
  </Card>
  <Card title="Provider plugins" href="/zh-TW/plugins/sdk-provider-plugins">
    Step-by-step guide that uses these helpers in context for provider plugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Config loading and writes

Prefer config that was already passed into the active call path, for example `api.config` during registration or a `cfg` argument on channel/provider callbacks. This keeps one process snapshot flowing through the work instead of reparsing config on hot paths.

Use `api.runtime.config.current()` only when a long-lived handler needs the current process snapshot and no config was passed to that function. The returned value is readonly; clone or use a mutation helper before editing.

Tool factories receive `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Use the getter inside a long-lived tool's `execute` callback when config can change after the tool definition was created.

Persist changes with `api.runtime.config.mutateConfigFile(...)` or `api.runtime.config.replaceConfigFile(...)`. Each write must choose an explicit `afterWrite` policy:

- `afterWrite: { mode: "auto" }` lets the gateway reload planner decide.
- `afterWrite: { mode: "restart", reason: "..." }` forces a clean restart when the writer knows hot reload is unsafe.
- `afterWrite: { mode: "none", reason: "..." }` suppresses automatic reload/restart only when the caller owns the follow-up.

The mutation helpers return `afterWrite` plus a typed `followUp` summary so callers can log or test whether they requested a restart. The gateway still owns when that restart actually happens.

`api.runtime.config.loadConfig()` and `api.runtime.config.writeConfigFile(...)` are deprecated compatibility helpers under `runtime-config-load-write`. They warn once at runtime, and remain available for old external plugins during the migration window. Bundled plugins must not use them; the config boundary guards fail if plugin code calls them or imports those helpers from plugin SDK subpaths.

For direct SDK imports, use the focused config subpaths instead of the broad
`openclaw/plugin-sdk/config-runtime` compatibility barrel: `config-contracts` for
types, `plugin-config-runtime` for already-loaded config assertions and plugin
entry lookup, `runtime-config-snapshot` for current process snapshots, and
`config-mutation` for writes. Bundled plugin tests should mock these focused
subpaths directly instead of mocking the broad compatibility barrel.

Internal OpenClaw runtime code has the same direction: load config once at the CLI, gateway, or process boundary, then pass that value through. Successful mutation writes refresh the process runtime snapshot and advance its internal revision; long-lived caches should key off the runtime-owned cache key instead of serializing config locally. Long-lived runtime modules have a zero-tolerance scanner for ambient `loadConfig()` calls; use a passed `cfg`, a request `context.getRuntimeConfig()`, or `getRuntimeConfig()` at an explicit process boundary.

Provider and channel execution paths must use the active runtime config snapshot, not a file snapshot returned for config readback or editing. File snapshots preserve source values such as SecretRef markers for UI and writes; provider callbacks need the resolved runtime view. When a helper may be called with either the active source snapshot or the active runtime snapshot, route through `selectApplicableRuntimeConfig()` before reading credentials.

## Reusable runtime utilities

Use inbound `botLoopProtection` facts for bot-authored inbound messages. Core applies the shared in-memory sliding-window guard before session record and dispatch, without tying the policy to one channel. The guard tracks `(scopeId, conversationId, participant pair)` keys, counts both directions of a pair together, applies a cooldown once the window budget is exceeded, and prunes inactive entries opportunistically.

Channel plugins that expose this behavior to operators should prefer the shared `channels.defaults.botLoopProtection` shape for baseline budgets, then layer channel/provider-specific overrides on top. The shared config uses seconds because it is user-facing:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Pass normalized bot-pair facts with the resolved turn. Core resolves defaults, unit conversion, and `enabled` semantics:

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

Use `openclaw/plugin-sdk/pair-loop-guard-runtime` directly only for custom
two-party event loops that do not go through the shared inbound reply runner.

## Runtime namespaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent identity, directories, and session management.

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

    `runEmbeddedAgent(...)` is the neutral helper for starting a normal OpenClaw agent turn from plugin code. It uses the same provider/model resolution and agent-harness selection as channel-triggered replies.

    `runEmbeddedPiAgent(...)` remains as a deprecated compatibility alias for existing plugins. New code should use `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` returns the provider/model's supported thinking levels and optional default. Provider plugins own the model-specific profile through their thinking hooks, so tool plugins should call this runtime helper instead of importing or duplicating provider lists.

    `normalizeThinkingLevel(...)` converts user text such as `on`, `x-high`, or `extra high` to the canonical stored level before checking it against the resolved policy.

    **Session store helpers** are under `api.runtime.agent.session`:

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

    Prefer `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, or `upsertSessionEntry(...)` for session workflows. These helpers address sessions by agent/session identity so plugins do not depend on the legacy `sessions.json` storage shape. Use `preserveActivity: true` for metadata-only patches that should not refresh session activity, and `replaceEntry: true` only when the callback returns a complete entry and deleted fields must stay deleted.

    Use `runWithWorkAdmission(...)` when a plugin starts work on a persisted session. The callback rejects archived or concurrently replaced sessions, keeps archive/reset/delete mutations coordinated through completion, and receives an `AbortSignal` that must be forwarded to the agent run.

    For transcript reads and writes, import `openclaw/plugin-sdk/session-transcript-runtime` and use `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, or `withSessionTranscriptWriteLock(...)` with `{ agentId, sessionKey, sessionId }`. These APIs let plugins identify a transcript, read its events, append messages, publish updates, and run related operations under the same transcript write lock. Passing `sessionFile`, using `resolveSessionTranscriptLegacyFileTarget(...)`, or importing low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` from `openclaw/plugin-sdk/agent-harness-runtime` is deprecated; those paths exist only for legacy code that already receives an active transcript artifact.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)`, and `resolveAndPersistSessionFile(...)` are deprecated compatibility helpers for plugins that still intentionally depend on the legacy whole-store or transcript-file shape. New plugin code must not use those helpers, and existing callers should migrate to entry helpers and transcript identity helpers.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Default model and provider constants:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Run a host-owned text completion without importing provider internals or
    duplicating OpenClaw model/auth/base URL preparation.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    The helper uses the same simple-completion preparation path as OpenClaw's
    built-in runtime and the host-owned runtime config snapshot. Context engines
    receive a session-bound `llm.complete` capability, so model calls use the
    active session's agent and do not silently fall back to the default agent. The
    result includes provider/model/agent attribution plus normalized token,
    cache, and estimated cost usage when available.

    <Warning>
    模型覆寫需要操作者透過設定中的 `plugins.entries.<id>.llm.allowModelOverride: true` 選擇啟用。使用 `plugins.entries.<id>.llm.allowedModels` 將受信任外掛限制為特定的標準 `provider/model` 目標。跨代理完成需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    啟動並管理背景子代理執行。

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
    模型覆寫（`provider`/`model`）需要操作者透過設定中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 選擇啟用。不受信任的外掛仍可執行子代理，但覆寫請求會被拒絕。
    </Warning>

    `deleteSession(...)` 可刪除同一個外掛透過 `api.runtime.subagent.run(...)` 建立的工作階段。刪除任意使用者或操作者工作階段仍需要具備管理員範圍的閘道請求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已連線節點，並從閘道載入的外掛程式碼或外掛命令列介面命令呼叫節點主機命令。當外掛擁有配對裝置上的本機工作時使用，例如另一台 Mac 上的瀏覽器或音訊橋接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在閘道內，此執行階段位於同一行程中。在外掛命令列介面命令中，它會透過 RPC 呼叫已設定的閘道，因此像 `openclaw googlemeet recover-tab` 這樣的命令可以從終端機檢查配對節點。節點命令仍會經過一般的閘道節點配對、命令允許清單、外掛節點呼叫政策，以及節點本機命令處理。

    暴露危險節點主機命令的外掛應使用 `api.registerNodeInvokePolicy(...)` 註冊節點呼叫政策。該政策會在閘道中於命令允許清單檢查後、命令轉送至節點前執行，因此直接的 `node.invoke` 呼叫和較高階的外掛工具會共用相同的強制執行路徑。

    <Warning>
    選用的 `scopes` 欄位會為此次呼叫請求閘道操作者範圍。OpenClaw 只會對內建外掛和受信任的官方外掛安裝尊重它；其他外掛的請求不會提升該呼叫的權限。只有在受信任外掛必須以更嚴格的閘道範圍呼叫節點命令時才使用，例如 `operator.admin`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    將 Task Flow 執行階段繫結到現有的 OpenClaw 工作階段鍵或受信任的工具內容，然後建立並管理 Task Flow，而不必在每次呼叫時傳入擁有者。

    Task Flow 會追蹤持久的多步驟工作流程狀態。它不是排程器：
    請使用排程或 `api.session.workflow.scheduleSessionTurn(...)` 進行未來的
    喚醒，然後在排程的回合中，當該工作需要流程狀態、子任務、等待或取消時
    使用 `managedFlows`。

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

    當你已從自己的繫結層取得受信任的 OpenClaw 工作階段鍵時，請使用 `bindSession({ sessionKey, requesterOrigin })`。不要從原始使用者輸入進行繫結。

  </Accordion>
  <Accordion title="api.runtime.tts">
    文字轉語音合成。

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

    使用核心 `messages.tts` 設定與供應商選擇。傳回 PCM 音訊緩衝區 + 取樣率。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    影像、音訊與影片分析。

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

    未產生輸出時（例如略過輸入）會傳回 `{ text: undefined }`。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍作為 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的相容性別名保留。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    影像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    網頁搜尋。

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    低階媒體工具。

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
    目前執行階段設定快照與交易式設定寫入。優先使用
    已傳入作用中呼叫路徑的設定；只有在處理常式需要直接存取行程快照時才使用
    `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 會傳回 `followUp`
    值，例如 `{ mode: "restart", requiresRestart: true, reason }`，
    它會記錄寫入者意圖，而不會從
    閘道奪走重新啟動控制權。

  </Accordion>
  <Accordion title="api.runtime.system">
    系統層級工具。

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

    `runCommandWithTimeout(...)` 會傳回擷取到的 `stdout` 和 `stderr`、選用的
    截斷計數、`code`、`signal`、`killed`、`termination`，以及
    `noOutputTimedOut`。當子行程未提供非零結束碼時，逾時與無輸出逾時結果會回報 `code: 124`。
    非逾時的
    訊號結束仍可能傳回 `code: null`，因此請使用 `termination` 和
    `noOutputTimedOut` 區分逾時原因。

  </Accordion>
  <Accordion title="api.runtime.events">
    事件訂閱。

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
    記錄。

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    模型與供應商驗證解析。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    狀態目錄解析與 SQLite 支援的鍵控儲存。

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

    鍵控儲存會在重新啟動後保留，並依執行階段繫結的外掛 id 隔離。使用 `registerIfAbsent(...)` 進行原子去重宣告：當鍵不存在或已過期且已註冊時，它會回傳 `true`；當已有即時值存在時，它會回傳 `false`，且不覆寫其值、建立時間或 TTL。限制：每個命名空間 `maxEntries`、每個外掛 6,000 筆即時列、JSON 值小於 64KB，以及選用的 TTL 到期。當寫入會超過外掛列數上限時，執行階段可能會從正在寫入的命名空間中逐出最舊的即時列；同層命名空間不會因該寫入而被逐出，且如果該命名空間無法釋放足夠列數，寫入仍會失敗。

    <Warning>
    此版本僅限內建外掛。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    記憶工具工廠與命令列介面。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    頻道專用執行階段輔助工具（在載入頻道外掛時可用）。

    `api.runtime.channel.media` 是頻道媒體下載與儲存的首選介面：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    當遠端 URL 應成為 OpenClaw 媒體時，使用 `saveRemoteMedia(...)`。當外掛已經使用外掛擁有的驗證、重新導向或允許清單處理擷取 `Response` 時，使用 `saveResponseMedia(...)`。只有在外掛需要原始位元組用於檢查、轉換、解密或重新上傳時，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已棄用相容別名。

    `api.runtime.channel.mentions` 是使用執行階段注入的內建頻道外掛共用的傳入提及政策介面：

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

    可用的提及輔助工具：

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` 刻意不公開較舊的 `resolveMentionGating*` 相容輔助工具。請優先使用標準化的 `{ facts, policy }` 路徑。

  </Accordion>
</AccordionGroup>

## 儲存執行階段參照

使用 `createPluginRuntimeStore` 儲存執行階段參照，以便在 `register` 回呼之外使用：

<Steps>
  <Step title="建立儲存">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="接入進入點">
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
  <Step title="從其他檔案存取">
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
執行階段儲存身分請優先使用 `pluginId`。較低階的 `key` 形式適用於少見情況，也就是一個外掛刻意需要多個執行階段插槽。
</Note>

## 其他頂層 `api` 欄位

除了 `api.runtime` 之外，API 物件也提供：

<ParamField path="api.id" type="string">
  外掛 id。
</ParamField>
<ParamField path="api.name" type="string">
  外掛顯示名稱。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  目前設定快照（可用時為作用中的記憶體內執行階段快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  來自 `plugins.entries.<id>.config` 的外掛專屬設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  限定範圍的記錄器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  目前載入模式；`"setup-runtime"` 是完整進入點啟動前的輕量啟動/設定時段。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相對於外掛根目錄的路徑。
</ParamField>

## 相關

- [外掛內部](/zh-TW/plugins/architecture) — 能力模型與登錄
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 選項
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 子路徑參考
