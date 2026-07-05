---
read_when:
    - 您需要從外掛呼叫核心輔助工具（TTS、STT、影像生成、網頁搜尋、子代理、節點）
    - 你想了解 `api.runtime` 公開了哪些內容
    - 你正從外掛程式碼存取設定、代理或媒體輔助工具
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供外掛使用的已注入執行階段輔助工具
title: 外掛執行階段輔助工具
x-i18n:
    generated_at: "2026-07-05T11:33:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8341516832d7876e7f1412b443e7582a090b7f94893303560b3713ee7a7e6aa
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

OpenClaw 在註冊期間注入每個外掛的 `api.runtime` 物件參考。請使用這些輔助工具，而不是直接匯入主機內部項目。

<CardGroup cols={2}>
  <Card title="頻道外掛" href="/zh-TW/plugins/sdk-channel-plugins">
    逐步指南，示範在頻道外掛情境中使用這些輔助工具。
  </Card>
  <Card title="提供者外掛" href="/zh-TW/plugins/sdk-provider-plugins">
    逐步指南，示範在提供者外掛情境中使用這些輔助工具。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` 是目前的 OpenClaw 產品版本，來源為共用版本解析器，因此外掛看到的值會與命令列介面回報的值相同。

## 設定載入與寫入

優先使用已傳入作用中呼叫路徑的設定，例如註冊期間的 `api.config`，或頻道/提供者回呼上的 `cfg` 引數。這能讓單一處理程序快照在整個工作中流動，而不是在熱門路徑上重新剖析設定。

只有在長時間存在的處理常式需要目前處理程序快照，且沒有設定傳入該函式時，才使用 `api.runtime.config.current()`。傳回值為唯讀；請先複製或使用突變輔助工具再編輯。

工具工廠會收到 `ctx.runtimeConfig` 加上 `ctx.getRuntimeConfig()`。當設定可能在工具定義建立後變更時，請在長時間存在工具的 `execute` 回呼內使用該 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 保存變更。每次寫入都必須選擇明確的 `afterWrite` 政策：

- `afterWrite: { mode: "auto" }` 讓閘道重新載入規劃器決定。
- `afterWrite: { mode: "restart", reason: "..." }` 會在寫入者知道熱重新載入不安全時強制乾淨重新啟動。
- `afterWrite: { mode: "none", reason: "..." }` 只有在呼叫端擁有後續處理時，才會抑制自動重新載入/重新啟動。

突變輔助工具會傳回 `afterWrite` 加上具型別的 `followUp` 摘要，因此呼叫端可以記錄或測試自己是否要求重新啟動。實際何時重新啟動仍由閘道擁有。

<Warning>
`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 已棄用。它們會在執行階段對每個外掛警告一次，並且僅在遷移窗口期間為舊的外部外掛保留可用。內建外掛不得使用它們：如果外掛程式碼呼叫它們，或從外掛 SDK 子路徑匯入這些輔助工具，內部設定邊界防護會使建置失敗。請改用 `current()`、傳入的 `cfg`、`mutateConfigFile(...)` 或 `replaceConfigFile(...)`。
</Warning>

對於直接 SDK 匯入，請優先使用聚焦的設定子路徑，而不是寬泛的 `openclaw/plugin-sdk/config-runtime` 相容性 barrel：`config-contracts` 用於型別，`plugin-config-runtime` 用於已載入設定斷言和外掛進入點查找，`runtime-config-snapshot` 用於目前處理程序快照，`config-mutation` 用於寫入。內建外掛測試應直接模擬這些聚焦子路徑，而不是模擬寬泛的相容性 barrel。

OpenClaw 內部執行階段程式碼遵循相同方向：在命令列介面、閘道或處理程序邊界載入設定一次，然後傳遞該值。成功的突變寫入會重新整理處理程序執行階段快照，並推進其內部修訂；長時間存在的快取應以執行階段擁有的快取鍵為準，而不是在本機序列化設定。長時間存在的執行階段模組對環境式 `loadConfig()` 呼叫有零容忍掃描器；請使用傳入的 `cfg`、請求的 `context.getRuntimeConfig()`，或在明確處理程序邊界使用 `getRuntimeConfig()`。

提供者和頻道執行路徑必須使用作用中的執行階段設定快照，而不是用於設定讀回或編輯而傳回的檔案快照。檔案快照會保留 SecretRef 標記等來源值，以供 UI 和寫入使用；提供者回呼需要已解析的執行階段檢視。當輔助工具可能以作用中來源快照或作用中執行階段快照呼叫時，請先透過 `selectApplicableRuntimeConfig()` 再讀取認證。

## 可重複使用的執行階段公用工具

對於由機器人撰寫的傳入訊息，請使用傳入的 `botLoopProtection` 事實。核心會在工作階段記錄和分派之前套用共用的記憶體內滑動視窗防護，而不會將政策綁定到單一頻道。防護會追蹤 `(scopeId, conversationId, participant pair)` 鍵，將配對雙向事件合併計數，在視窗預算超過後套用冷卻，並在適當時機修剪不活躍項目。

向操作員公開此行為的頻道外掛，應優先使用共用的 `channels.defaults.botLoopProtection` 形狀作為基準預算，然後在其上分層套用頻道/提供者特定覆寫。共用設定使用秒，因為它是面向使用者的：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

將標準化的機器人配對事實與已解析回合一起傳入。核心會解析預設值、單位轉換和 `enabled` 語義：

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

只有對於不經過共用傳入回覆執行器的自訂
雙方事件迴圈，才直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

## 執行階段命名空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent 身分、目錄與工作階段管理。

    ```typescript
    // Resolve the agent's working directory (agentId is required)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

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
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` 是從外掛程式碼啟動一般 OpenClaw Agent 回合的中立輔助工具。它使用與頻道觸發回覆相同的提供者/模型解析和 Agent harness 選擇。

    `runEmbeddedPiAgent(...)` 仍作為現有外掛的已棄用相容性別名保留。新程式碼應使用 `runEmbeddedAgent(...)`。

    `resolveThinkingPolicy(...)` 會傳回提供者/模型支援的思考層級和選用預設值。提供者外掛透過其 thinking hooks 擁有模型特定設定檔，因此工具外掛應呼叫此執行階段輔助工具，而不是匯入或複製提供者清單。

    `normalizeThinkingLevel(...)` 會將使用者文字（例如 `on`、`x-high` 或 `extra high`）轉換為標準儲存層級，再與已解析政策比對。

    **工作階段儲存輔助工具** 位於 `api.runtime.agent.session` 下：

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

    工作階段工作流程請優先使用 `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。這些輔助工具會依 Agent/工作階段身分處理工作階段，因此外掛不需依賴舊版 `sessions.json` 儲存形狀。對於不應重新整理工作階段活動的純中繼資料修補，請使用 `preserveActivity: true`；只有在回呼傳回完整項目且已刪除欄位必須保持刪除時，才使用 `replaceEntry: true`。

    當外掛在持久化工作階段上開始工作時，請使用 `runWithWorkAdmission(...)`。回呼會拒絕已封存或同時遭取代的工作階段，讓封存/重設/刪除突變在完成期間保持協調，並收到必須轉發給 Agent 執行的 `AbortSignal`。

    對於轉錄讀取和寫入，請匯入 `openclaw/plugin-sdk/session-transcript-runtime`，並使用 `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)` 或 `withSessionTranscriptWriteLock(...)` 搭配 `{ agentId, sessionKey, sessionId }`。這些 API 讓外掛能識別轉錄、讀取其事件、附加訊息、發布更新，並在同一個轉錄寫入鎖下執行相關操作。傳遞 `sessionFile`、使用 `resolveSessionTranscriptLegacyFileTarget(...)`，或從 `openclaw/plugin-sdk/agent-harness-runtime` 匯入低階 `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` 已棄用；這些路徑僅供已接收作用中轉錄成品的舊版程式碼使用。

    `resolveStorePath(...)` 和 `updateSessionStoreEntry(...)` 補足了工作階段輔助工具：`resolveStorePath` 會解析指定範圍的工作階段儲存路徑，而 `updateSessionStoreEntry({ storePath, sessionKey, update })` 會在呼叫端已知道儲存路徑時，直接依儲存路徑修補單一項目。

    `loadSessionStore(...)`、`saveSessionStore(...)`、`updateSessionStore(...)` 和 `resolveSessionFilePath(...)` 是已棄用的相容性輔助工具，供仍刻意依賴舊版完整儲存或轉錄檔案形狀的外掛使用。新的外掛程式碼不得使用這些輔助工具，現有呼叫端應遷移到項目輔助工具和轉錄身分輔助工具。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    預設模型和提供者常數：

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "gpt-5.5"
    const provider = api.runtime.agent.defaults.provider; // e.g. "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    執行由主機擁有的文字補完，而不匯入提供者內部項目或
    複製 OpenClaw 模型/驗證/base URL 準備。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    此輔助工具使用與 OpenClaw 內建執行階段相同的簡易補全準備路徑，以及由主機擁有的執行階段設定快照。內容引擎會收到繫結至工作階段的 `llm.complete` 能力，因此模型呼叫會使用作用中工作階段的代理，不會靜默退回預設代理。結果會包含提供者/模型/代理歸因，以及可用時經正規化的權杖、快取和預估成本用量。

    <Warning>
    模型覆寫需要操作者在設定中透過 `plugins.entries.<id>.llm.allowModelOverride: true` 選擇啟用。使用 `plugins.entries.<id>.llm.allowedModels` 將受信任外掛限制為特定的標準 `provider/model` 目標。跨代理補全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
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
      model: "gpt-5.5", // optional override
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
    模型覆寫（`provider`/`model`）需要操作者在設定中透過 `plugins.entries.<id>.subagent.allowModelOverride: true` 選擇啟用。不受信任的外掛仍可執行子代理，但覆寫請求會遭到拒絕。
    </Warning>

    `deleteSession(...)` 可刪除同一外掛透過 `api.runtime.subagent.run(...)` 建立的工作階段。刪除任意使用者或操作者工作階段仍需要具備管理員範圍的閘道請求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已連線節點，並從閘道載入的外掛程式碼或外掛命令列介面命令呼叫節點主機命令。當外掛擁有配對裝置上的本機工作時使用此功能，例如另一台 Mac 上的瀏覽器或音訊橋接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在閘道內，此執行階段為同程序執行。在外掛命令列介面命令中，它會透過 RPC 呼叫已設定的閘道，因此像 `openclaw googlemeet recover-tab` 這類命令可從終端機檢查配對節點。節點命令仍會經過一般的閘道節點配對、命令允許清單、外掛節點呼叫政策，以及節點本機命令處理。

    暴露危險節點主機命令的外掛應使用 `api.registerNodeInvokePolicy(...)` 註冊節點呼叫政策。該政策會在閘道中於命令允許清單檢查之後、命令轉送至節點之前執行，因此直接的 `node.invoke` 呼叫與較高階的外掛工具會共用相同的強制執行路徑。

    <Warning>
    選用的 `scopes` 欄位會為此呼叫請求閘道操作者範圍。OpenClaw 只會對內建外掛和受信任的官方外掛安裝遵循此欄位；其他外掛的請求不會提升該呼叫。僅在受信任外掛必須以更嚴格的閘道範圍呼叫節點命令時使用，例如 `operator.admin`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    將任務流程和任務執行狀態繫結至現有的 OpenClaw 工作階段金鑰或受信任工具內容。

    - `api.runtime.tasks.managedFlows` 可變更：建立、推進和取消任務流程。
    - `api.runtime.tasks.flows` 和 `api.runtime.tasks.runs` 是唯讀 DTO 檢視，用於列出和查詢狀態；兩者都暴露 `bindSession(...)` / `fromToolContext(...)`，以及 `get`、`list`、`findLatest` 和 `resolve`。
    - `api.runtime.tasks.flow` 是 `managedFlows` 的已淘汰別名。

    任務流程會追蹤持久的多步驟工作流程狀態。它不是排程器：
    未來喚醒請使用排程或 `api.session.workflow.scheduleSessionTurn(...)`，
    然後在排程的輪次中，當該工作需要流程狀態、子任務、等待或取消時，
    再使用 `managedFlows`。

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

    當你已從自己的繫結層取得受信任的 OpenClaw 工作階段金鑰時，使用 `bindSession({ sessionKey, requesterOrigin })`。不要從原始使用者輸入進行繫結。

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

    使用核心 `messages.tts` 設定與提供者選擇。傳回 PCM 音訊緩衝區 + 取樣率。`textToSpeechStream` 也可用於串流合成。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    影像、音訊和影片分析。

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

    未產生輸出時會傳回 `{ text: undefined }`（例如略過的輸入）。

    `describeImageFileWithModel(...)` 會透過特定提供者/模型描述已知影像，並略過 `describeImageFile(...)` 使用的預設作用中模型解析。

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
  <Accordion title="api.runtime.videoGeneration">
    影片生成，與影像生成的形狀一致。

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "A drone shot flying over a coastline at sunrise",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    音樂生成，與影像生成的形狀一致。

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "An upbeat lo-fi track for a coding session",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
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
    目前的執行階段設定快照與交易式設定寫入。優先使用已傳入作用中呼叫路徑的設定；只有在處理常式需要直接使用程序快照時，才使用 `current()`。

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
    用於記錄寫入者意圖，而不會從閘道手中接管重新啟動控制。

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
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` 會立即執行單次心跳偵測循環，略過一般的合併計時器。傳入 `{ heartbeat: { target: "last" } }` 可強制傳送到最後一個作用中的頻道，而不是預設的 `target: "none"` 抑制。

    `runCommandWithTimeout(...)` 會回傳擷取到的 `stdout` 和 `stderr`、可選的截斷計數、`code`、`signal`、`killed`、`termination`，以及 `noOutputTimedOut`。當子程序未提供非零結束代碼時，逾時與無輸出逾時結果會回報 `code: 124`。非逾時的訊號結束仍可能回傳 `code: null`，因此請使用 `termination` 和 `noOutputTimedOut` 來區分逾時原因。

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

    // Request-ready auth, including provider runtime exchanges (e.g. OAuth refresh)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

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

    鍵值儲存在重新啟動後仍會保留，並依執行階段繫結的外掛 ID 隔離。使用 `registerIfAbsent(...)` 進行原子去重宣告：當鍵不存在或已過期並完成註冊時，它會回傳 `true`；當已有仍有效的值存在時，則會回傳 `false`，且不會覆寫其值、建立時間或 TTL。限制：每個命名空間的 `maxEntries`、每個外掛 50,000 筆有效資料列、低於 64KB 的 JSON 值，以及可選的 TTL 到期。當寫入會超過外掛資料列上限時，執行階段會從正在寫入的命名空間移除最舊的有效資料列；同層命名空間不會因該次寫入而被逐出，且若該命名空間無法釋放足夠資料列，寫入仍會失敗。

    `openSyncKeyedStore<T>(...)` 會回傳相同形狀的儲存區，但使用同步方法（`register`、`registerIfAbsent`、`lookup`、`consume`、`clear` 都會直接回傳值，而非 promise），適用於無法 await 的呼叫端。

    `openChannelIngressQueue<TPayload>(...)` 會開啟一個限定於呼叫外掛的持久化輸入佇列，用來緩衝需要跨重新啟動進行至少一次處理的傳入事件。

    <Warning>
    `openKeyedStore`、`openSyncKeyedStore` 和 `openChannelIngressQueue` 在此版本中僅提供給內建外掛與受信任的官方外掛安裝使用。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    頻道特定的執行階段輔助工具（載入頻道外掛時可用）。依關注點分組：

    | 群組 | 用途 |
    | --- | --- |
    | `text` | 分段（`chunkText`、`chunkMarkdownText`、`resolveChunkMode`）、控制命令偵測、Markdown 表格轉換。 |
    | `reply` | 緩衝區塊回覆派送、封套格式化、有效訊息/人工延遲設定解析。 |
    | `routing` | `buildAgentSessionKey`、`resolveAgentRoute`。 |
    | `pairing` | `buildPairingReply`、允許清單讀取、配對請求 upsert。 |
    | `media` | 遠端媒體下載/儲存（見下方）。 |
    | `activity` | 記錄/讀取最後的頻道活動。 |
    | `session` | 來自傳入事件的工作階段中繼資料、最後路由更新。 |
    | `mentions` | 提及政策輔助工具（見下方）。 |
    | `reactions` | 進行中處理指示器的確認反應控制代碼。 |
    | `groups` | 群組政策與必要提及解析。 |
    | `debounce` | 傳入訊息防抖。 |
    | `commands` | 命令授權與文字命令門控。 |
    | `outbound` | 載入頻道的傳出配接器。 |
    | `inbound` | 建立傳入事件情境，並執行共用的傳入事件/回覆核心。 |
    | `threadBindings` | 調整已繫結工作階段執行緒的閒置逾時/最大存在時間。 |
    | `runtimeContexts` | 註冊、讀取並監看程序本機的每頻道/帳號/能力情境。 |

    `api.runtime.channel.media` 是頻道媒體下載與儲存的首選介面：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    當遠端 URL 應成為 OpenClaw 媒體時，請使用 `saveRemoteMedia(...)`。當外掛已使用外掛自有的驗證、重新導向或允許清單處理擷取 `Response` 時，請使用 `saveResponseMedia(...)`。只有在外掛需要原始位元組以供檢查、轉換、解密或重新上傳時，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已棄用相容性別名。

    `api.runtime.channel.mentions` 是使用執行階段注入的內建頻道外掛共用傳入提及政策介面：

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

    `api.runtime.channel.mentions` 有意不公開較舊的 `resolveMentionGating*` 相容性輔助工具。請優先使用正規化的 `{ facts, policy }` 路徑。

    `reply`、`session` 和 `inbound` 下的多個欄位帶有每欄位的 `@deprecated` 註記，指向目前的頻道回合核心或頻道傳出配接器；在其上建置新程式碼前，請檢查特定輔助工具的內嵌 JSDoc。

  </Accordion>
</AccordionGroup>

## 儲存執行階段參照

使用 `createPluginRuntimeStore` 儲存執行階段參照，以便在 `register` 回呼外使用：

<Steps>
  <Step title="建立儲存區">
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
執行階段儲存區身分識別建議使用 `pluginId`。較低階的 `key` 形式適用於少見情況，也就是同一個外掛有意需要多個執行階段槽位。
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
  目前的設定快照（可用時為作用中的記憶體內執行階段快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  來自 `plugins.entries.<id>.config` 的外掛特定設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  作用域記錄器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  目前載入模式：`"full"`（即時啟用）、`"discovery"` / `"tool-discovery"`（唯讀能力探索）、`"setup-only"`（輕量設定進入點）、`"setup-runtime"`（也需要執行階段頻道進入點的設定流程），或 `"cli-metadata"`（命令列介面命令中繼資料收集）。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相對於外掛根目錄的路徑。
</ParamField>

## 相關

- [外掛內部機制](/zh-TW/plugins/architecture) — 能力模型與登錄
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 選項
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 子路徑參考
