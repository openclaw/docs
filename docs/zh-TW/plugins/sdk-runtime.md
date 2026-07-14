---
read_when:
    - 你需要從外掛呼叫核心輔助函式（TTS、STT、圖片生成、網頁搜尋、閘道、子代理、節點）
    - 你想瞭解 `api.runtime` 公開了哪些內容
    - 你正在從外掛程式碼存取設定、代理程式或媒體輔助工具
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供外掛使用的注入式執行階段輔助工具
title: 外掛執行階段輔助工具
x-i18n:
    generated_at: "2026-07-14T14:02:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5126ad814597ce5c23232624d4ea38d188f3a7efac39607312546476e6964e6f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

注入至每個外掛並在註冊期間使用的 `api.runtime` 物件參考。請使用這些輔助工具，而非直接匯入主機內部元件。

<CardGroup cols={2}>
  <Card title="頻道外掛" href="/zh-TW/plugins/sdk-channel-plugins">
    逐步指南，說明如何在頻道外掛的情境中使用這些輔助工具。
  </Card>
  <Card title="提供者外掛" href="/zh-TW/plugins/sdk-provider-plugins">
    逐步指南，說明如何在提供者外掛的情境中使用這些輔助工具。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` 是目前的 OpenClaw 產品版本，來源為共用版本解析器，因此外掛看到的值會與命令列介面回報的值相同。

## 設定載入與寫入

優先使用已傳入目前有效呼叫路徑的設定，例如註冊期間的 `api.config`，或頻道／提供者回呼中的 `cfg` 引數。這可讓單一程序快照持續流經整項工作，而非在熱路徑上重新剖析設定。

只有在長期執行的處理常式需要目前程序快照，且該函式未收到設定時，才使用 `api.runtime.config.current()`。傳回的值為唯讀；編輯前請先複製，或使用變更輔助工具。

工具工廠會收到 `ctx.runtimeConfig` 與 `ctx.getRuntimeConfig()`。如果設定可能在工具定義建立後變更，請在長期存在工具的 `execute` 回呼中使用 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 保存變更。每次寫入都必須明確選擇 `afterWrite` 原則：

- `afterWrite: { mode: "auto" }` 讓閘道重新載入規劃器決定。
- `afterWrite: { mode: "restart", reason: "..." }` 會在寫入者確認熱重新載入不安全時，強制執行乾淨重新啟動。
- `afterWrite: { mode: "none", reason: "..." }` 只有在呼叫端負責後續處理時，才會抑制自動重新載入／重新啟動。

變更輔助工具會傳回 `afterWrite`，以及具型別的 `followUp` 摘要，讓呼叫端可以記錄或測試是否已要求重新啟動。實際重新啟動的時機仍由閘道負責。

<Warning>
`api.runtime.config.loadConfig()` 與 `api.runtime.config.writeConfigFile(...)` 已淘汰。它們會在執行階段對每個外掛警告一次，且僅在遷移期間為舊版外部外掛保留。隨附外掛不得使用它們：如果外掛程式碼呼叫這些工具，或從外掛 SDK 子路徑匯入這些輔助工具，內部設定邊界防護就會使建置失敗。請改用 `current()`、傳入的 `cfg`、`mutateConfigFile(...)` 或 `replaceConfigFile(...)`。
</Warning>

直接從 SDK 匯入時，請優先使用聚焦的設定子路徑，而非廣泛的 `openclaw/plugin-sdk/config-runtime` 相容性彙總入口：`config-contracts` 用於型別，`plugin-config-runtime` 用於已載入設定的斷言、外掛進入點查詢與標準設定合併，`runtime-config-snapshot` 用於目前程序快照，而 `config-mutation` 用於寫入。隨附外掛測試應直接模擬這些聚焦子路徑，而非模擬廣泛的相容性彙總入口。

OpenClaw 內部執行階段程式碼也遵循相同方向：在命令列介面、閘道或程序邊界載入設定一次，然後持續傳遞該值。成功的變更寫入會重新整理程序執行階段快照，並推進其內部修訂版本；長期快取應以執行階段所擁有的快取鍵為依據，而非在本機序列化設定。長期執行階段模組針對環境中的 `loadConfig()` 呼叫設有零容忍掃描器；請使用傳入的 `cfg`、要求中的 `context.getRuntimeConfig()`，或在明確的程序邊界使用 `getRuntimeConfig()`。

提供者與頻道執行路徑必須使用目前有效的執行階段設定快照，而非用於設定讀回或編輯的檔案快照。檔案快照會保留 SecretRef 標記等來源值，以供 UI 與寫入使用；提供者回呼則需要已解析的執行階段檢視。當輔助工具可能收到目前有效的來源快照或目前有效的執行階段快照時，請先透過 `selectApplicableRuntimeConfig()` 路由，再讀取認證資訊。

## 可重複使用的執行階段公用工具

對於由機器人撰寫的輸入訊息，請使用輸入的 `botLoopProtection` 事實。核心會在工作階段記錄與分派前套用共用的記憶體內滑動視窗防護，而不將原則綁定至單一頻道。此防護會追蹤 `(scopeId, conversationId, participant pair)` 鍵、合併計算配對的兩個方向、在超過視窗預算後套用冷卻時間，並伺機清除非活躍項目。

向操作人員公開此行為的頻道外掛，應優先使用共用的 `channels.defaults.botLoopProtection` 結構作為基準預算，再於其上疊加頻道／提供者特定的覆寫。共用設定使用秒，因為這是面向使用者的設定：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

將標準化的機器人配對事實連同已解析的回合一起傳入。核心會解析預設值、單位轉換與 `enabled` 語意：

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

只有對於不經過共用輸入回覆執行器的自訂
雙方事件迴圈，才直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

## 執行階段命名空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    代理程式身分、目錄與工作階段管理。

    ```typescript
    // 解析代理程式的工作目錄（agentId 為必填）
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // 解析代理程式工作區
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // 取得代理程式身分
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // 取得預設思考層級
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // 依目前有效的提供者設定檔驗證使用者提供的思考層級
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // 將層級傳給內嵌執行
    }

    // 取得代理程式逾時
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // 確保工作區存在
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 執行內嵌代理程式回合
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "摘要最新變更",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` 是從外掛程式碼啟動一般 OpenClaw 代理程式回合的中立輔助工具。它使用與頻道觸發回覆相同的提供者／模型解析與代理程式控制框架選擇方式。

    `runEmbeddedPiAgent(...)` 仍作為既有外掛的已淘汰相容性別名保留。新程式碼應使用 `runEmbeddedAgent(...)`。

    `resolveThinkingPolicy(...)` 會傳回提供者／模型支援的思考層級與選用的預設值。提供者外掛透過自身的思考鉤點擁有模型特定的設定檔，因此工具外掛應呼叫此執行階段輔助工具，而非匯入或複製提供者清單。

    `normalizeThinkingLevel(...)` 會將 `on`、`x-high` 或 `extra high` 等使用者文字轉換為標準儲存層級，再依已解析原則進行檢查。

    **工作階段儲存區輔助工具**位於 `api.runtime.agent.session`：

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // 逐一處理工作階段資料列，不依賴舊版 sessions.json 結構。
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // 建立或更新工作階段，然後將 signal 傳給已准入的代理程式執行。
      },
    );
    ```

    工作階段工作流程請優先使用 `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。這些輔助工具會依代理程式／工作階段身分定址工作階段，使外掛不需依賴舊版 `sessions.json` 儲存結構。對於不應重新整理工作階段活動的僅中繼資料修補，請使用 `preserveActivity: true`；只有在回呼傳回完整項目，且已刪除欄位必須維持刪除時，才使用 `replaceEntry: true`。Doctor 與遷移路徑可結合 `fallbackEntry`、`skipMaintenance` 和 `requireWriteSuccess`，執行一次不可分割的標準儲存區修復。

    `createSessionEntry(...)` 會建立新的標準工作階段資料列與文字記錄。其受信任的 `initialEntry` 介面刻意保持狹窄：非空白的 `agentHarnessId`、選用的 `modelSelectionLocked: true`，以及選用的 `pluginExtensions`。注入的執行階段僅接受由呼叫外掛透過 `registerAgentHarness(...)` 擁有的控制框架 ID；這是所有權不變條件，而非程序內外掛之間的沙箱。它會拒絕既有資料列；`label` 與 `spawnedCwd` 是獨立的建立欄位，而非受信任項目的修補。

    建立期間會透過 `afterCreate` 持有工作階段生命週期變更柵欄，因此新工作會等待外掛擁有的初始化完成，而預先存在的已准入工作會使建立失敗。回呼會收到已建立狀態的複本。如果它傳回修補，該修補只能包含 `pluginExtensions`，且其值必須是完整的最終 `pluginExtensions` 欄位。回呼或最終保存失敗時，會回復未變更的新資料列與文字記錄；受防護的回復會保留已被並行變更或認領的資料列。`recoverMatchingInitialEntry: true` 僅用於在已保存的受信任欄位完全相符時，重試遭中斷的初始化；復原時要求 `afterCreate` 傳回最終修補。

    當外掛開始處理已保存的工作階段時，請使用 `runWithWorkAdmission(...)`。此回呼會拒絕已封存或遭並行取代的工作階段、持續協調封存／重設／刪除變更直到作業完成，並接收必須轉交給代理程式執行的 `AbortSignal`。控制框架可透過實驗性的 `delegatedExecutionPluginIds` 註冊欄位，明確指定受信任的執行委派者。委派者只能准入並執行完全相符且已存在的模型鎖定工作階段；所有工作階段變更仍僅限控制框架擁有者執行。請參閱[代理程式控制框架外掛](/zh-TW/plugins/sdk-agent-harness#delegated-execution)。

    維護與修復外掛可針對單一限定範圍的工作階段項目使用 `deleteSessionEntry(...)`、針對生命週期擁有的暫存工作階段使用 `cleanupSessionLifecycleArtifacts(...)`，並在變更儲存區前使用 `resolveSessionStoreBackupPaths(...)`。這些輔助工具是範圍狹窄的修復／生命週期介面，而非通用的儲存區刪除 API。

    `resolveStorePath(...)` 和 `updateSessionStoreEntry(...)` 補齊了工作階段輔助函式：`resolveStorePath` 會解析指定範圍的工作階段儲存路徑，而當呼叫端已知儲存路徑時，`updateSessionStoreEntry({ storePath, sessionKey, update })` 會直接修補其中一個項目。

    `loadTranscriptEventsSync(...)` 可供無法使用非同步逐字稿執行階段的同步 doctor 與修復路徑使用。它會傳回原始 `SessionStoreTranscriptEvent` 記錄。一般外掛執行階段程式碼應優先使用 `openclaw/plugin-sdk/session-transcript-runtime`。

    `formatSqliteSessionFileMarker(...)`、`parseSqliteSessionFileMarker(...)` 和 `sqliteSessionFileMarkerMatchesSession(...)` 是過渡期輔助函式，適用於仍會接收名為 `sessionFile` 的舊版欄位之程式碼。解析後的 SQLite 標記識別的是即時 SQLite 逐字稿目標，而不是檔案系統路徑。新的 API 應攜帶具型別的工作階段身分，而非標記字串。

    若要讀寫逐字稿，請匯入 `openclaw/plugin-sdk/session-transcript-runtime`，並搭配 `{ agentId, sessionKey, sessionId }` 使用 `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`readVisibleSessionTranscriptMessageEntries(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)` 或 `withSessionTranscriptWriteLock(...)`。這些 API 讓外掛能識別逐字稿、讀取原始事件或分支安全的可見訊息項目、附加訊息、發布更新，以及在相同的逐字稿寫入鎖定下執行相關操作，而不必依賴作用中逐字稿的檔案路徑。`readVisibleSessionTranscriptMessageEntries(...)` 會傳回有序的讀取中繼資料；其 `seq` 欄位並非可續接的游標。

    外掛 SDK 不再匯出舊版的完整儲存區與作用中逐字稿檔案輔助函式。工作階段中繼資料請使用具範圍的項目輔助函式，而作用中逐字稿操作請使用逐字稿身分輔助函式。需要檔案成品的封存／支援工作流程，應使用其專用封存介面，而非作用中工作階段執行階段 API。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    預設模型與提供者常數：

    ```typescript
    const model = api.runtime.agent.defaults.model; // 例如 "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // 例如 "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    執行由主機擁有的文字補全，無須匯入提供者內部實作，也無須
    重複 OpenClaw 的模型／驗證／基礎 URL 準備流程。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "摘要這份逐字稿。" }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    提供者協調流程也可以在發出 HTTP 請求前，取得已設定的本機服務
    生命週期：

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // 傳送並完整取用提供者請求。
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` 是穩定、通用的提供者服務 SDK
    合約。主機會從 `models.providers.<providerId>.localService` 解析程序設定；
    呼叫端無法提供命令、引數、環境或生命週期原則。程序啟動、
    就緒狀態、診斷與閒置停止原則仍由主機內部管理。

    請傳入已設定提供者的確切 ID，以及解析後的請求基礎 URL。不要
    以轉接器 ID 取代別名：不同別名可能指向不同的
    本機 GPU 主機。除了 Ollama 與 LM
    Studio 轉接器所使用的 `/v1` 正規化外，主機會拒絕與已設定
    提供者基礎 URL 不相符的端點。主機負責啟動序列化、就緒探測、
    請求租約、中止處理與閒置關閉。

    此輔助函式使用與 OpenClaw
    內建執行階段相同的簡易補全準備路徑，以及由主機擁有的執行階段設定快照。情境引擎
    會收到綁定工作階段的 `llm.complete` 能力，因此模型呼叫會使用
    作用中工作階段的代理程式，而不會在未告知的情況下退回預設代理程式。
    結果包含提供者／模型／代理程式歸屬資訊，以及可取得時經正規化的權杖、
    快取與預估成本用量。

    <Warning>
    模型覆寫需要操作員透過設定中的 `plugins.entries.<id>.llm.allowModelOverride: true` 明確選擇啟用。使用 `plugins.entries.<id>.llm.allowedModels` 將受信任的外掛限制為特定的標準 `provider/model` 目標。跨代理程式補全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    在程序內呼叫另一個閘道方法，同時保留目前外掛的受信任執行階段
    身分。這適用於組合外掛自有
    閘道能力的內建或受信任官方外掛，而無須開啟迴送 WebSocket 連線。

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    請求使用 `operator.write` 範圍，且不會授予管理員範圍。來自任意外部
    外掛的呼叫會遭到拒絕。方法失敗時會擲回 `GatewayClientRequestError`，並保留結構化的
    `details`、重試中繼資料及閘道錯誤碼，以供復原流程使用。若工具也能在獨立代理程式程序中執行，請先使用 `isAvailable()`
    再選擇此路徑。

  </Accordion>
  <Accordion title="api.runtime.subagent">
    啟動及管理背景子代理程式執行。

    ```typescript
    // 啟動子代理程式執行
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "將此查詢展開為聚焦的後續搜尋。",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // 選用覆寫
      model: "gpt-5.6-sol", // 選用覆寫
      deliver: false,
    });

    // 等待完成
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // 讀取工作階段訊息
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // 刪除工作階段
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    模型覆寫（`provider`/`model`）需要操作員透過設定中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確選擇啟用。不受信任的外掛仍可執行子代理程式，但覆寫請求會遭到拒絕。
    </Warning>

    `toolsAlsoAllow` 會將呼叫外掛所註冊、由其明確且唯一擁有的工具，加入工作程式的一般工具介面。執行階段會拒絕核心工具，以及與其他外掛共用名稱的工具。設定檔與操作員工具原則仍會套用，包括明確的允許清單與拒絕規則。

    `deleteSession(...)` 可以刪除同一外掛透過 `api.runtime.subagent.run(...)` 建立的工作階段。刪除任意使用者或操作員工作階段仍需要具管理員範圍的閘道請求。

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    檢查代理程式工作階段的有效沙箱工作區權限。

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    結果會回報此工作階段是否受沙箱限制、其工作區是否
    無法使用、唯讀或可寫入，以及當有效的 Docker、工具、工作階段、瀏覽器或提高權限原則可能
    逸出該工作區時，提供選用的 `confinementError`。
    對於不得授予工作程式超過其呼叫端權限的主機自有委派決策，請使用此功能。它是證明
    輔助函式，不能取代檢查呼叫端本身的授權。

    `prepareWorkspaceAuthority(...)` 會執行相同的原則檢查，並且
    為 `workspaceDir` 準備 Docker 沙箱。若運作中容器的即時設定雜湊與要求的掛載或原則不符，它會拒絕該容器。僅傳入呼叫外掛確實限制其已註冊實作的工具名稱；
    萬用字元前綴無法證明工具所有權。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    從閘道載入的外掛程式碼或外掛命令列介面命令列出已連線的節點，並叫用節點主機命令。當外掛擁有配對裝置上的本機工作時使用此功能，例如另一台 Mac 上的瀏覽器或音訊橋接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    當節點向代理程式公開由外掛或 MCP 支援的
    工具時，`nodes.list(...)` 會包含每個已連線節點公告的
    `nodePluginTools` 描述元。這些描述元屬於即時連線狀態：節點中斷連線時，閘道
    會捨棄它們；在本機外掛／MCP 清單變更後，節點可用
    `node.pluginTools.update` 取代它們。

    在閘道內，此執行階段位於程序內。在外掛命令列介面命令中，它會透過 RPC 呼叫已設定的閘道，因此 `openclaw googlemeet recover-tab` 等命令可從終端機檢查已配對的節點。節點命令仍會經過一般的閘道節點配對、命令允許清單、外掛節點叫用原則，以及節點本機命令處理。

    公開節點託管代理程式工具的外掛，可為預設應列入允許清單的非危險命令設定 `agentTool.defaultPlatforms`。若必須由操作員透過 `gateway.nodes.allowCommands` 明確選擇啟用，請省略此設定。危險的節點主機命令應使用 `api.registerNodeInvokePolicy(...)` 註冊節點叫用原則；該原則會在閘道完成命令允許清單檢查之後、將命令轉送至節點之前執行，因此直接的 `node.invoke` 呼叫、節點託管的外掛工具及較高階的外掛工具會共用相同的強制執行路徑。

    <Warning>
    選用的 `scopes` 欄位會為叫用要求閘道操作員範圍。OpenClaw 僅對內建外掛及受信任的官方外掛安裝採用此欄位；來自其他外掛的請求不會提升呼叫權限。只有當受信任外掛必須叫用要求更嚴格閘道範圍的節點命令（例如 `operator.admin`）時，才使用此欄位。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    將 Task Flow 與 Task Run 狀態綁定至現有的 OpenClaw 工作階段金鑰或受信任的工具情境。

    - `api.runtime.tasks.managedFlows` 具備異動能力：建立、推進及取消 Task Flow。
    - `api.runtime.tasks.flows` 和 `api.runtime.tasks.runs` 是用於列出及查詢狀態的唯讀 DTO 檢視；兩者都公開 `bindSession(...)` / `fromToolContext(...)`，以及 `get`、`list`、`findLatest` 和 `resolve`。
    - `api.runtime.tasks.flow` 是 `managedFlows` 的已棄用別名。

    Task Flow 會追蹤持久的多步驟工作流程狀態。它不是排程器：
    若要在未來喚醒，請使用排程或 `api.session.workflow.scheduleSessionTurn(...)`，
    接著當該工作需要流程狀態、子任務、等待或取消時，請在排程觸發的回合中使用 `managedFlows`。

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "審查新的提取要求",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "審查 PR #123",
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

    當你已從自己的繫結層取得受信任的 OpenClaw 工作階段金鑰時，請使用 `bindSession({ sessionKey, requesterOrigin })`。請勿從原始使用者輸入進行繫結。

  </Accordion>
  <Accordion title="api.runtime.tts">
    文字轉語音合成。

    ```typescript
    // 標準 TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "來自 OpenClaw 的問候",
      cfg: api.config,
    });

    // 針對電話語音最佳化的 TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "來自 OpenClaw 的問候",
      cfg: api.config,
    });

    // 列出可用語音
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    使用核心 `messages.tts` 設定與供應商選擇。傳回 PCM 音訊緩衝區與取樣率。`textToSpeechStream` 也可用於串流合成。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    影像、音訊與影片分析。

    ```typescript
    // 描述影像
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // 轉錄音訊
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // 選填，用於無法推斷 MIME 時
    });

    // 描述影片
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // 通用檔案分析
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // 透過特定供應商／模型進行結構化影像擷取。
    // 至少包含一張影像；文字輸入是補充情境。
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "優先採用印刷的總額，而非手寫註記。" },
      ],
      instructions: "擷取商家、總額及可搜尋的標籤。",
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

    未產生輸出時（例如略過輸入），傳回 `{ text: undefined }`。

    `describeImageFileWithModel(...)` 會透過特定供應商／模型描述已知影像，略過 `describeImageFile(...)` 所使用的預設作用中模型解析。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍保留為 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的相容性別名。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    影像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "一個正在描繪夕陽的機器人",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    影片生成，其形式與影像生成相同。

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "日出時飛越海岸線的無人機航拍鏡頭",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    音樂生成，其形式與影像生成相同。

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "適合程式設計工作階段的輕快 lo-fi 曲目",
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
      args: { query: "OpenClaw 外掛 SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    低階媒體公用程式。

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
    目前的執行階段設定快照與交易式設定寫入。應優先使用
    已傳入作用中呼叫路徑的設定；只有處理常式需要直接使用處理程序快照時，
    才使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 與 `replaceConfigFile(...)` 會傳回 `followUp`
    值，例如 `{ mode: "restart", requiresRestart: true, reason }`，
    用於記錄寫入者意圖，而不會從閘道手中奪走重新啟動控制權。

  </Accordion>
  <Accordion title="api.runtime.system">
    系統層級公用程式。

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // 已淘汰的相容性別名。
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` 會立即執行單次心跳偵測週期，略過一般的合併計時器。傳入 `{ heartbeat: { target: "last" } }` 可強制傳送至最後一個作用中頻道，而不採用預設的 `target: "none"` 抑制。

    `runCommandWithTimeout(...)` 會傳回擷取到的 `stdout` 與 `stderr`、選填的
    截斷計數、`code`、`signal`、`killed`、`termination`，以及
    `noOutputTimedOut`。當子處理程序未提供非零結束代碼時，逾時與無輸出逾時結果會回報 `code: 124`。
    非逾時的訊號結束仍可能傳回 `code: null`，因此請使用 `termination` 與
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

    // 可直接用於要求的驗證，包括供應商執行階段交換（例如 OAuth 重新整理）
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    狀態目錄解析與由 SQLite 支援的鍵值儲存空間。

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

    鍵值儲存空間可跨重新啟動保留，並依執行階段繫結的外掛 ID 隔離。使用 `registerIfAbsent(...)` 進行不可分割的去重占用：若鍵不存在或已過期並完成註冊，會傳回 `true`；若仍有效的值已存在，則傳回 `false`，且不會覆寫其值、建立時間或 TTL。限制：每個命名空間 `maxEntries`、每個外掛 50,000 筆有效資料列、JSON 值小於 64KB，以及選填的 TTL 到期機制。依預設，在任一資料列限制下進行寫入時，會從正在寫入的命名空間移除最舊的有效資料列；該次寫入不會逐出同層命名空間的資料列，而若命名空間無法釋放足夠的資料列，寫入仍會失敗。對絕不可被逐出的持久擁有權記錄設定 `overflowPolicy: "reject-new"`：達到任一限制時，新鍵會失敗，而現有鍵仍可更新。

    `openSyncKeyedStore<T>(...)` 會傳回相同形式、但具有同步方法的儲存空間（`register`、`registerIfAbsent`、`lookup`、`consume`、`clear` 都會直接傳回值，而非 Promise），供無法等待的呼叫端使用。

    `openChannelIngressQueue<TPayload>(...)` 會開啟限定於呼叫外掛的持久化輸入佇列，用於緩衝需要在重新啟動後至少處理一次的輸入事件。當過期占用復原使用 `shouldRecover` 時，若損毀的已占用承載資料應被隔離，也請提供 `shouldRecoverCorrupt`：其不依賴承載資料的占用識別資訊，可讓外掛在佇列將資料列標記為已刪除前，保留有效的擁有者與通道原則。

    <Warning>
    在此版本中，`openKeyedStore`、`openSyncKeyedStore` 與 `openChannelIngressQueue` 僅供內建外掛和受信任的官方外掛安裝使用。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    頻道專用的執行階段輔助函式（載入頻道外掛時可用）。依用途分組：

    | 群組 | 用途 |
    | --- | --- |
    | `text` | 分塊（`chunkText`、`chunkMarkdownText`、`resolveChunkMode`）、控制命令偵測、Markdown 表格轉換。 |
    | `reply` | 緩衝區塊回覆分派、信封格式化、有效訊息／模擬真人延遲設定解析。 |
    | `routing` | `buildAgentSessionKey`、`resolveAgentRoute`。 |
    | `pairing` | `buildPairingReply`、允許清單讀取、配對請求新增或更新。 |
    | `media` | 遠端媒體下載／儲存（見下文）。 |
    | `activity` | 記錄／讀取頻道最近活動。 |
    | `session` | 從傳入事件取得工作階段中繼資料、更新最近路由。 |
    | `mentions` | 提及政策輔助函式（見下文）。 |
    | `reactions` | 用於進行中處理指示器的確認回應控制代碼。 |
    | `groups` | 群組政策與要求提及解析。 |
    | `debounce` | 傳入訊息防彈跳。 |
    | `commands` | 命令授權與文字命令閘控。 |
    | `outbound` | 載入頻道的傳出配接器。 |
    | `inbound` | 建構傳入事件內容，並執行共用的傳入事件／回覆核心。 |
    | `threadBindings` | 調整已繫結工作階段討論串的閒置逾時／存續時間上限。 |
    | `runtimeContexts` | 註冊、讀取及監看處理程序本機的各頻道／帳號／能力內容。 |

    `api.runtime.channel.media` 是下載及儲存頻道媒體的首選介面：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    當遠端 URL 應成為 OpenClaw 媒體時，請使用 `saveRemoteMedia(...)`。當外掛已使用外掛自有的驗證、重新導向或允許清單處理取得 `Response` 時，請使用 `saveResponseMedia(...)`。只有在外掛需要原始位元組進行檢查、轉換、解密或重新上傳時，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已淘汰相容性別名。

    `api.runtime.channel.mentions` 是使用執行階段注入之內建頻道外掛的共用傳入提及政策介面：

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

    可用的提及輔助函式：

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` 刻意不公開較舊的 `resolveMentionGating*` 相容性輔助函式。請優先使用正規化的 `{ facts, policy }` 路徑。

    `reply`、`session` 和 `inbound` 下的數個欄位帶有各欄位的 `@deprecated` 註記，指向目前的頻道回合核心或頻道傳出配接器；在以特定輔助函式建構新程式碼之前，請先查看其行內 JSDoc。

  </Accordion>
</AccordionGroup>

## 儲存執行階段參照

使用 `createPluginRuntimeStore` 儲存執行階段參照，以便在 `register` 回呼之外使用：

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
  <Step title="連接至進入點">
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
執行階段儲存區識別資訊請優先使用 `pluginId`。較低階的 `key` 形式適用於單一外掛刻意需要多個執行階段槽位的罕見情況。
</Note>

## 其他頂層 `api` 欄位

除了 `api.runtime`，API 物件也提供：

<ParamField path="api.id" type="string">
  外掛 ID。
</ParamField>
<ParamField path="api.name" type="string">
  外掛顯示名稱。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  目前的設定快照（可用時為記憶體中作用中的執行階段快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  來自 `plugins.entries.<id>.config` 的外掛專屬設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  範圍限定的記錄器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  目前的載入模式：`"full"`（即時啟用）、`"discovery"`／`"tool-discovery"`（唯讀能力探索）、`"setup-only"`（輕量設定進入點）、`"setup-runtime"`（也需要執行階段頻道進入點的設定流程），或 `"cli-metadata"`（命令列介面命令中繼資料收集）。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相對於外掛根目錄的路徑。
</ParamField>

## 相關內容

- [外掛內部架構](/zh-TW/plugins/architecture) — 能力模型與登錄檔
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 選項
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 子路徑參照
