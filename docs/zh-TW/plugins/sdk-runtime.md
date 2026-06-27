---
read_when:
    - 你需要從外掛呼叫核心輔助函式（TTS、STT、影像生成、網頁搜尋、子代理、節點）
    - 你想了解 api.runtime 暴露了哪些內容
    - 你正在從外掛程式碼存取設定、代理或媒體輔助工具
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供外掛使用的注入式執行階段輔助工具
title: 外掛執行階段輔助工具
x-i18n:
    generated_at: "2026-06-27T19:48:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

每個外掛在註冊期間都會注入 `api.runtime` 物件，本頁是其參考資料。請使用這些輔助工具，而不是直接匯入主機內部實作。

<CardGroup cols={2}>
  <Card title="通道外掛" href="/zh-TW/plugins/sdk-channel-plugins">
    逐步指南，會在通道外掛的情境中使用這些輔助工具。
  </Card>
  <Card title="提供者外掛" href="/zh-TW/plugins/sdk-provider-plugins">
    逐步指南，會在提供者外掛的情境中使用這些輔助工具。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 設定載入與寫入

優先使用已經傳入目前作用中呼叫路徑的設定，例如註冊期間的 `api.config`，或通道/提供者回呼上的 `cfg` 引數。這能讓單一程序快照貫穿整個工作，而不是在熱路徑上重新剖析設定。

只有在長生命週期處理常式需要目前程序快照，且沒有設定傳入該函式時，才使用 `api.runtime.config.current()`。回傳值是唯讀的；編輯前請複製，或使用變更輔助工具。

工具工廠會收到 `ctx.runtimeConfig` 加上 `ctx.getRuntimeConfig()`。當工具定義建立後設定可能變更時，請在長生命週期工具的 `execute` 回呼內使用該 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化變更。每次寫入都必須選擇明確的 `afterWrite` 政策：

- `afterWrite: { mode: "auto" }` 讓閘道重新載入規劃器決定。
- `afterWrite: { mode: "restart", reason: "..." }` 會在寫入者知道熱重新載入不安全時，強制乾淨重新啟動。
- `afterWrite: { mode: "none", reason: "..." }` 只有在呼叫者擁有後續處理時，才抑制自動重新載入/重新啟動。

變更輔助工具會回傳 `afterWrite` 加上型別化的 `followUp` 摘要，讓呼叫者可以記錄或測試是否已要求重新啟動。閘道仍然負責決定該重新啟動實際發生的時機。

`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 是 `runtime-config-load-write` 下已棄用的相容性輔助工具。它們會在執行階段警告一次，並在遷移期間繼續提供給舊的外部外掛使用。內建外掛不得使用它們；如果外掛程式碼呼叫它們，或從外掛 SDK 子路徑匯入這些輔助工具，設定邊界守衛會失敗。

對於直接 SDK 匯入，請使用聚焦的設定子路徑，而不是寬泛的
`openclaw/plugin-sdk/config-runtime` 相容性匯出入口：`config-contracts` 用於
型別、`plugin-config-runtime` 用於已載入設定的斷言和外掛
進入點查找、`runtime-config-snapshot` 用於目前程序快照，以及
`config-mutation` 用於寫入。內建外掛測試應直接模擬這些聚焦的
子路徑，而不是模擬寬泛的相容性匯出入口。

OpenClaw 內部執行階段程式碼也遵循相同方向：在命令列介面、閘道或程序邊界載入設定一次，然後將該值傳遞下去。成功的變更寫入會重新整理程序執行階段快照，並推進其內部修訂版；長生命週期快取應以執行階段擁有的快取鍵為索引，而不是在本機序列化設定。長生命週期執行階段模組對環境中的 `loadConfig()` 呼叫採取零容忍掃描；請使用傳入的 `cfg`、請求的 `context.getRuntimeConfig()`，或在明確的程序邊界使用 `getRuntimeConfig()`。

提供者和通道執行路徑必須使用作用中的執行階段設定快照，而不是用於設定讀回或編輯的檔案快照。檔案快照會保留來源值，例如供 UI 和寫入使用的 SecretRef 標記；提供者回呼需要已解析的執行階段視圖。當輔助工具可能以作用中的來源快照或作用中的執行階段快照呼叫時，請先透過 `selectApplicableRuntimeConfig()` 路由，再讀取憑證。

## 可重複使用的執行階段工具

針對機器人撰寫的傳入訊息，使用傳入的 `botLoopProtection` 事實。核心會在工作階段記錄與分派之前套用共用的記憶體內滑動視窗守衛，而不會把政策綁定到單一通道。該守衛會追蹤 `(scopeId, conversationId, participant pair)` 鍵、合併計算同一對參與者的雙向事件、在視窗配額超過後套用冷卻，並伺機修剪非作用中項目。

向操作員公開此行為的通道外掛，應優先使用共用的 `channels.defaults.botLoopProtection` 形狀作為基準配額，然後在其上疊加通道/提供者特定的覆寫。共用設定使用秒，因為它面向使用者：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

將正規化的機器人配對事實連同已解析的回合一起傳入。核心會解析預設值、單位轉換和 `enabled` 語意：

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

  僅對未經共用傳入回覆執行器的自訂雙方事件迴圈，才直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

  ## 執行階段命名空間

  <AccordionGroup>
  <Accordion title="api.runtime.agent">
    代理程式身分、目錄與工作階段管理。

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

    `runEmbeddedAgent(...)` 是從外掛程式碼啟動一般 OpenClaw 代理程式回合的中立輔助工具。它使用與頻道觸發回覆相同的 provider/model 解析與代理程式 harness 選擇。

    `runEmbeddedPiAgent(...)` 仍作為現有外掛的已棄用相容性別名保留。新程式碼應使用 `runEmbeddedAgent(...)`。

    `resolveThinkingPolicy(...)` 會傳回 provider/model 支援的思考等級與選用預設值。Provider 外掛透過其思考 hook 擁有模型專屬設定檔，因此工具外掛應呼叫此執行階段輔助工具，而不是匯入或複製 provider 清單。

    `normalizeThinkingLevel(...)` 會先將 `on`、`x-high` 或 `extra high` 等使用者文字轉換為標準儲存等級，再依解析後的政策檢查。

    **工作階段儲存輔助工具**位於 `api.runtime.agent.session` 下：

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

    工作階段工作流程應優先使用 `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。這些輔助工具會依代理程式/工作階段身分定址工作階段，因此外掛不會依賴舊版 `sessions.json` 儲存形狀。對於不應重新整理工作階段活動的純中繼資料修補，請使用 `preserveActivity: true`；只有在回呼傳回完整項目且已刪除欄位必須維持刪除時，才使用 `replaceEntry: true`。

    若要讀寫逐字稿，請匯入 `openclaw/plugin-sdk/session-transcript-runtime`，並搭配 `{ agentId, sessionKey, sessionId }` 使用 `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)` 或 `withSessionTranscriptWriteLock(...)`。這些 API 可讓外掛識別逐字稿、讀取其事件、附加訊息、發布更新，並在同一個逐字稿寫入鎖下執行相關操作。只有在調整已收到作用中逐字稿成品，且需要每個輔助工具都操作同一成品的程式碼時，才傳入 `sessionFile`。

    `loadSessionStore(...)`、`saveSessionStore(...)`、`updateSessionStore(...)` 和 `resolveSessionFilePath(...)` 是相容性輔助工具，供仍刻意依賴舊版整體儲存或逐字稿檔案形狀的外掛使用。新的外掛程式碼不得使用這些輔助工具，現有呼叫端也應遷移到項目輔助工具。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    預設模型與 provider 常數：

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    執行主機擁有的文字補全，而不匯入 provider 內部項目或複製 OpenClaw 模型/驗證/基底 URL 準備流程。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    此輔助工具使用與 OpenClaw 內建執行階段相同的簡易補全準備路徑，以及主機擁有的執行階段設定快照。脈絡引擎會收到繫結至工作階段的 `llm.complete` capability，因此模型呼叫會使用作用中工作階段的代理程式，且不會無聲退回預設代理程式。結果會包含 provider/model/agent 歸屬，以及可用時正規化後的 token、快取與估算成本用量。

    <Warning>
    模型覆寫需要操作者透過設定中的 `plugins.entries.<id>.llm.allowModelOverride: true` 明確選擇啟用。使用 `plugins.entries.<id>.llm.allowedModels` 可將受信任外掛限制為特定標準 `provider/model` 目標。跨代理程式補全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    啟動並管理背景子代理程式執行。

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
    模型覆寫（`provider`/`model`）需要操作者透過設定中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確啟用。不受信任的外掛仍可執行子代理，但覆寫請求會被拒絕。
    </Warning>

    `deleteSession(...)` 可以刪除同一個外掛透過 `api.runtime.subagent.run(...)` 建立的工作階段。刪除任意使用者或操作者工作階段仍需要具備管理員範圍的閘道請求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已連線的節點，並從閘道載入的外掛程式碼或外掛命令列介面命令叫用節點主機命令。當外掛擁有配對裝置上的本機工作時使用此項，例如另一台 Mac 上的瀏覽器或音訊橋接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在閘道內，此執行階段為程序內執行。在外掛命令列介面命令中，它會透過 RPC 呼叫已設定的閘道，因此像 `openclaw googlemeet recover-tab` 這類命令可以從終端機檢查已配對的節點。節點命令仍會經過一般的閘道節點配對、命令允許清單、外掛節點叫用政策，以及節點本機命令處理。

    暴露危險節點主機命令的外掛，應使用 `api.registerNodeInvokePolicy(...)` 註冊節點叫用政策。該政策會在閘道中執行，時機在命令允許清單檢查之後、命令轉送至節點之前，因此直接的 `node.invoke` 呼叫與較高階的外掛工具會共用同一條強制執行路徑。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    將 Task Flow 執行階段繫結至現有的 OpenClaw 工作階段金鑰或受信任的工具脈絡，然後建立並管理 Task Flow，而不必在每次呼叫時傳入擁有者。

    Task Flow 會追蹤持久的多步驟工作流程狀態。它不是排程器：
    請使用排程或 `api.session.workflow.scheduleSessionTurn(...)` 進行未來喚醒，然後在排程回合需要流程狀態、子任務、等待或取消時，從該回合使用 `managedFlows`。

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

    當你已經從自己的繫結層取得受信任的 OpenClaw 工作階段金鑰時，請使用 `bindSession({ sessionKey, requesterOrigin })`。不要從原始使用者輸入進行繫結。

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

    使用核心 `messages.tts` 設定與提供者選擇。回傳 PCM 音訊緩衝區與取樣率。

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

    未產生輸出時（例如輸入被略過）會回傳 `{ text: undefined }`。

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
    網路搜尋。

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
    目前執行階段設定快照與交易式設定寫入。優先使用已傳入作用中呼叫路徑的設定；只有在處理常式需要直接取得程序快照時，才使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 會回傳 `followUp`
    值，例如 `{ mode: "restart", requiresRestart: true, reason }`，
    用來記錄寫入者意圖，而不會從閘道取走重新啟動控制權。

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

    `runCommandWithTimeout(...)` 會回傳擷取到的 `stdout` 和 `stderr`、選用的截斷計數、`code`、`signal`、`killed`、`termination`，以及 `noOutputTimedOut`。逾時與無輸出逾時結果在子程序未提供非零結束碼時，會回報 `code: 124`。非逾時的訊號結束仍可能回傳 `code: null`，因此請使用 `termination` 和 `noOutputTimedOut` 來區分逾時原因。

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
    模型與提供者驗證解析。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    狀態目錄解析與 SQLite 支援的鍵值儲存。

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

    鍵控儲存會在重新啟動後保留，並依執行階段綁定的外掛 ID 隔離。使用 `registerIfAbsent(...)` 進行原子去重宣告：當鍵不存在或已過期且已註冊時回傳 `true`，或當已有有效值存在時回傳 `false`，且不會覆寫其值、建立時間或 TTL。限制：每個命名空間的 `maxEntries`、每個外掛 6,000 筆有效資料列、JSON 值小於 64KB，以及選用的 TTL 過期。當一次寫入會超過外掛資料列上限時，執行階段可能會從正在寫入的命名空間中淘汰最舊的有效資料列；同層命名空間不會因該次寫入而被淘汰，且如果命名空間無法釋放足夠資料列，該次寫入仍會失敗。

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
    通道專用的執行階段輔助工具（在載入通道外掛時可用）。

    `api.runtime.channel.media` 是通道媒體下載與儲存的偏好介面：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    當遠端 URL 應成為 OpenClaw 媒體時，請使用 `saveRemoteMedia(...)`。當外掛已使用外掛自有的驗證、重新導向或允許清單處理擷取 `Response` 時，請使用 `saveResponseMedia(...)`。只有在外掛需要原始位元組以進行檢查、轉換、解密或重新上傳時，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已淘汰相容別名。

    `api.runtime.channel.mentions` 是使用執行階段注入的內建通道外掛共用的傳入提及政策介面：

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

    `api.runtime.channel.mentions` 刻意不公開較舊的 `resolveMentionGating*` 相容輔助工具。請偏好使用標準化的 `{ facts, policy }` 路徑。

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
執行階段儲存身分識別請偏好使用 `pluginId`。較低階的 `key` 形式適用於少見情況，也就是一個外掛刻意需要多個執行階段插槽。
</Note>

## 其他頂層 `api` 欄位

除了 `api.runtime` 之外，API 物件也提供：

<ParamField path="api.id" type="string">
  外掛 ID。
</ParamField>
<ParamField path="api.name" type="string">
  外掛顯示名稱。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  目前設定快照（可用時為作用中的記憶體內執行階段快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  來自 `plugins.entries.<id>.config` 的外掛專用設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  範圍限定的記錄器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  目前載入模式；`"setup-runtime"` 是完整進入點之前的輕量啟動／設定時段。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相對於外掛根目錄的路徑。
</ParamField>

## 相關

- [外掛內部機制](/zh-TW/plugins/architecture) — 能力模型與登錄檔
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 選項
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — 子路徑參考
