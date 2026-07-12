---
read_when:
    - 你需要從外掛呼叫核心輔助功能（TTS、STT、影像生成、網頁搜尋、閘道、子代理、節點）
    - 你想了解 `api.runtime` 公開了哪些功能
    - 你正在從外掛程式碼存取設定、代理程式或媒體輔助工具
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供外掛使用的注入式執行階段輔助工具
title: 外掛執行階段輔助工具
x-i18n:
    generated_at: "2026-07-12T14:42:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e43a2a56d15f970df68380a1b34776936777f667615bda51515b993e5bf3369
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

每個外掛註冊期間注入的 `api.runtime` 物件參考文件。請使用這些輔助函式，而不要直接匯入主機內部元件。

<CardGroup cols={2}>
  <Card title="頻道外掛" href="/zh-TW/plugins/sdk-channel-plugins">
    逐步指南，說明如何在頻道外掛的實際情境中使用這些輔助函式。
  </Card>
  <Card title="供應商外掛" href="/zh-TW/plugins/sdk-provider-plugins">
    逐步指南，說明如何在供應商外掛的實際情境中使用這些輔助函式。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` 是目前的 OpenClaw 產品版本，取自共用版本解析器，因此外掛看到的值會與命令列介面回報的值相同。

## 設定載入與寫入

優先使用已傳入目前有效呼叫路徑的設定，例如註冊期間的 `api.config`，或頻道／供應商回呼中的 `cfg` 引數。這可讓同一份程序快照在整個工作流程中持續傳遞，而不必在熱門路徑上重新解析設定。

只有在長期執行的處理常式需要目前的程序快照，且該函式未收到設定時，才使用 `api.runtime.config.current()`。傳回的值為唯讀；編輯前請先複製，或使用異動輔助函式。

工具工廠會接收 `ctx.runtimeConfig` 和 `ctx.getRuntimeConfig()`。如果工具定義建立後設定仍可能變更，請在長期執行工具的 `execute` 回呼內使用 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久保存變更。每次寫入都必須選擇明確的 `afterWrite` 政策：

- `afterWrite: { mode: "auto" }` 讓閘道的重新載入規劃器決定。
- `afterWrite: { mode: "restart", reason: "..." }` 會在寫入端確知熱重新載入不安全時，強制進行乾淨的重新啟動。
- `afterWrite: { mode: "none", reason: "..." }` 僅在呼叫端負責後續處理時，抑制自動重新載入／重新啟動。

變更輔助函式會傳回 `afterWrite`，以及具型別的 `followUp` 摘要，讓呼叫端能記錄或測試其是否要求重新啟動。實際何時重新啟動仍由閘道負責。

<Warning>
`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 已淘汰。它們會在執行階段針對每個外掛警告一次，且僅在遷移期間為舊版外部外掛保留。內建外掛不得使用它們：如果外掛程式碼呼叫這些函式，或從外掛 SDK 子路徑匯入這些輔助函式，內部設定邊界防護就會使建置失敗。請改用 `current()`、傳入的 `cfg`、`mutateConfigFile(...)` 或 `replaceConfigFile(...)`。
</Warning>

若要直接從 SDK 匯入，請優先使用專門的設定子路徑，而非廣泛的 `openclaw/plugin-sdk/config-runtime` 相容性匯出入口：型別使用 `config-contracts`、已載入設定的斷言與外掛進入點查詢使用 `plugin-config-runtime`、目前程序快照使用 `runtime-config-snapshot`，寫入則使用 `config-mutation`。內建外掛測試應直接模擬這些專門的子路徑，而非模擬廣泛的相容性匯出入口。

OpenClaw 內部執行階段程式碼也遵循相同方向：在命令列介面、閘道或程序邊界僅載入設定一次，然後將該值向下傳遞。成功的變更寫入會重新整理程序執行階段快照，並遞增其內部修訂版；長期存在的快取應以執行階段所擁有的快取鍵作為索引，而不是在本機序列化設定。長期存在的執行階段模組設有零容忍掃描器，用來偵測環境式 `loadConfig()` 呼叫；請使用傳入的 `cfg`、請求的 `context.getRuntimeConfig()`，或在明確的程序邊界使用 `getRuntimeConfig()`。

提供者與頻道執行路徑必須使用作用中的執行階段設定快照，而非為設定讀回或編輯而傳回的檔案快照。檔案快照會保留來源值（例如供 UI 與寫入使用的 SecretRef 標記）；提供者回呼需要已解析的執行階段檢視。當輔助函式可能接收作用中的來源快照或作用中的執行階段快照時，請先透過 `selectApplicableRuntimeConfig()` 再讀取認證資訊。

## 可重複使用的執行階段公用工具

對於由機器人撰寫的傳入訊息，請使用傳入的 `botLoopProtection` 事實資料。核心會在工作階段記錄與分派之前套用共用的記憶體內滑動視窗防護，而不會將政策綁定至單一頻道。此防護會追蹤 `(scopeId, conversationId, participant pair)` 鍵、合併計算配對雙向的次數、在超出視窗預算後套用冷卻期，並適時移除非作用中的項目。

向操作者公開此行為的頻道外掛，應優先使用共用的 `channels.defaults.botLoopProtection` 結構設定基準預算，再於其上套用頻道／供應商專屬的覆寫。共用設定使用秒為單位，因為它是面向使用者的：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

將正規化的機器人配對事實連同解析後的輪次傳入。核心會解析預設值、單位轉換及 `enabled` 語意：

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

只有自訂的雙方事件迴圈未經過共用的入站回覆執行器時，才直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

## 執行階段命名空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent 身分、目錄及工作階段管理。

    ```typescript
    // 解析 Agent 的工作目錄（agentId 為必填）
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // 解析 Agent 工作區
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // 取得 Agent 身分
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // 取得預設思考層級
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // 根據使用中的供應商設定檔驗證使用者提供的思考層級
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // 將層級傳給嵌入式執行
    }

    // 取得 Agent 逾時時間
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // 確保工作區存在
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 執行嵌入式 Agent 輪次
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "摘要最新變更",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` 是從外掛程式碼啟動一般 OpenClaw Agent 輪次的中立輔助函式。它使用與頻道觸發回覆相同的供應商／模型解析及 Agent 執行框架選擇。

    `runEmbeddedPiAgent(...)` 仍保留為現有外掛使用的已棄用相容性別名。新程式碼應使用 `runEmbeddedAgent(...)`。

    `resolveThinkingPolicy(...)` 會傳回供應商／模型支援的思考層級及選用的預設值。供應商外掛透過其思考掛鉤擁有模型專屬設定檔，因此工具外掛應呼叫此執行階段輔助函式，而非匯入或複製供應商清單。

    `normalizeThinkingLevel(...)` 會先將 `on`、`x-high` 或 `extra high` 等使用者文字轉換為標準儲存層級，再與解析後的原則進行比對。

    **工作階段儲存區輔助函式**位於 `api.runtime.agent.session` 下：

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // 疊代工作階段資料列，而不依賴舊版 sessions.json 結構。
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
        // 建立或更新工作階段，然後將 signal 傳給獲准執行的 Agent。
      },
    );
    ```

    工作階段工作流程應優先使用 `getSessionEntry(...)`、`listSessionEntries(...)`、`patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。這些輔助函式以 Agent／工作階段身分定位工作階段，因此外掛不會依賴舊版 `sessions.json` 儲存結構。對於不應重新整理工作階段活動時間的純中繼資料修補，請使用 `preserveActivity: true`；只有當回呼傳回完整項目，且已刪除的欄位必須維持刪除時，才使用 `replaceEntry: true`。Doctor 與遷移路徑可結合 `fallbackEntry`、`skipMaintenance` 和 `requireWriteSuccess`，以執行一次不可分割的標準儲存區修復。

    `createSessionEntry(...)` 會建立新的標準工作階段資料列及逐字記錄。其受信任的 `initialEntry` 介面刻意保持精簡：非空白的 `agentHarnessId`、選用的 `modelSelectionLocked: true`，以及選用的 `pluginExtensions`。注入的執行階段僅接受由呼叫外掛透過 `registerAgentHarness(...)` 所擁有的執行框架 ID；這是擁有權不變條件，而非程序內外掛之間的沙箱。若資料列已存在，它會拒絕建立；`label` 與 `spawnedCwd` 是獨立的建立欄位，而非受信任項目的修補欄位。

    建立期間會持續持有工作階段生命週期異動柵欄，直到 `afterCreate` 完成，因此新工作會等待外掛所擁有的初始化結束，而既有已獲准的工作會使建立失敗。回呼會收到已建立狀態的複本。若它傳回修補內容，該修補只能包含 `pluginExtensions`，且其值即為完整的最終 `pluginExtensions` 欄位。回呼或最終持久化失敗時，會回復未變更的新資料列及逐字記錄；受防護的回復機制會保留遭並行變更或認領的資料列。`recoverMatchingInitialEntry: true` 僅用於在已持久化的受信任欄位完全相符時，重試遭中斷的初始化；復原時必須由 `afterCreate` 傳回最終修補內容。

    外掛在已持久化的工作階段上啟動工作時，請使用 `runWithWorkAdmission(...)`。此回呼會拒絕已封存或遭並行取代的工作階段、在工作完成前協調封存／重設／刪除異動，並接收必須轉交給 Agent 執行的 `AbortSignal`。執行框架可透過其實驗性 `delegatedExecutionPluginIds` 註冊欄位，明確指定受信任的執行委派者。委派者只能准入並執行完全相符、已存在且鎖定模型的工作階段；所有工作階段異動仍僅限執行框架擁有者。請參閱 [Agent 執行框架外掛](/zh-TW/plugins/sdk-agent-harness#delegated-execution)。

    維護與修復外掛可針對單一具範圍的工作階段項目使用 `deleteSessionEntry(...)`，針對由生命週期擁有的暫存工作階段使用 `cleanupSessionLifecycleArtifacts(...)`，並在修改儲存區前使用 `resolveSessionStoreBackupPaths(...)`。這些輔助函式是範圍有限的修復／生命週期介面，不是通用的儲存區刪除 API。

    `resolveStorePath(...)` 與 `updateSessionStoreEntry(...)` 補齊了工作階段輔助函式：`resolveStorePath` 會解析指定範圍的工作階段儲存區路徑，而當呼叫端已知路徑時，`updateSessionStoreEntry({ storePath, sessionKey, update })` 可依儲存區路徑直接修補單一項目。

    `loadTranscriptEventsSync(...)` 可用於無法使用非同步逐字稿執行階段的同步 doctor 與修復路徑。它會傳回原始 `SessionStoreTranscriptEvent` 記錄。一般外掛執行階段程式碼應優先使用 `openclaw/plugin-sdk/session-transcript-runtime`。

    `formatSqliteSessionFileMarker(...)`、`parseSqliteSessionFileMarker(...)` 與 `sqliteSessionFileMarkerMatchesSession(...)` 是過渡期輔助函式，供仍接收名為 `sessionFile` 之舊版欄位的程式碼使用。解析後的 SQLite 標記會識別即時 SQLite 逐字稿目標；它不是檔案系統路徑。新的 API 應攜帶具型別的工作階段身分，而非標記字串。

    若要讀寫逐字稿，請匯入 `openclaw/plugin-sdk/session-transcript-runtime`，並搭配 `{ agentId, sessionKey, sessionId }` 使用 `resolveSessionTranscriptIdentity(...)`、`resolveSessionTranscriptTarget(...)`、`readSessionTranscriptEvents(...)`、`readVisibleSessionTranscriptMessageEntries(...)`、`appendSessionTranscriptMessageByIdentity(...)`、`publishSessionTranscriptUpdateByIdentity(...)` 或 `withSessionTranscriptWriteLock(...)`。這些 API 可讓外掛識別逐字稿、讀取原始事件或分支安全的可見訊息項目、附加訊息、發布更新，以及在相同的逐字稿寫入鎖定下執行相關操作，而無須依賴使用中的逐字稿檔案路徑。`readVisibleSessionTranscriptMessageEntries(...)` 會傳回已排序的讀取中繼資料；其 `seq` 欄位不是可續接的游標。

    舊版的完整儲存區與使用中逐字稿檔案輔助函式已不再從外掛 SDK 匯出。請針對工作階段中繼資料使用具範圍的項目輔助函式，並針對使用中逐字稿操作使用逐字稿身分輔助函式。需要檔案成品的封存／支援工作流程，應使用其專用封存介面，而非使用中工作階段執行階段 API。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    預設模型與供應商常數：

    ```typescript
    const model = api.runtime.agent.defaults.model; // 例如 "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // 例如 "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    執行由主機擁有的文字補全，而無須匯入供應商內部實作或
    重複 OpenClaw 的模型／驗證／基底 URL 準備作業。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "摘要這份逐字稿。" }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    供應商協調流程也可以在發出 HTTP 請求前，取得已設定之本機服務的
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
      // 傳送並完整取用供應商請求。
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` 是穩定且通用的供應商服務 SDK
    契約。主機會從
    `models.providers.<providerId>.localService` 解析程序設定；呼叫端無法提供
    命令、引數、環境或生命週期原則。程序啟動、
    就緒狀態、診斷與閒置停止原則仍由主機內部管理。

    請傳入確切的已設定供應商 ID 與解析後的請求基底 URL。不要
    以配接器 ID 取代別名：不同別名可能指向不同的
    本機 GPU 主機。除了 Ollama 與 LM
    Studio 配接器使用的 `/v1` 正規化之外，主機會拒絕與已設定
    供應商基底 URL 不符的端點。主機負責啟動序列化、就緒探查、
    請求租約、中止處理與閒置關閉。

    此輔助函式使用與 OpenClaw
    內建執行階段相同的簡易補全準備路徑，以及由主機擁有的執行階段設定快照。情境引擎
    會收到繫結至工作階段的 `llm.complete` 能力，因此模型呼叫會使用
    使用中工作階段的代理程式，而不會無聲地退回預設代理程式。此
    結果包含供應商／模型／代理程式歸屬資訊，以及可用時經正規化的 token、
    快取與預估成本用量。

    <Warning>
    模型覆寫需要操作者透過設定中的 `plugins.entries.<id>.llm.allowModelOverride: true` 明確選擇啟用。使用 `plugins.entries.<id>.llm.allowedModels` 將受信任外掛限制為特定的標準 `provider/model` 目標。跨代理程式補全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    在程序內呼叫另一個閘道方法，同時保留目前外掛受信任的執行階段
    身分。此功能適用於組合外掛自有
    閘道能力的內建或受信任官方外掛，而無須開啟回送 WebSocket 連線。

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
    外掛的呼叫會遭拒絕。方法失敗時會擲回 `GatewayClientRequestError`，並保留結構化
    `details`、重試中繼資料與閘道錯誤碼，以供復原流程使用。若工具也能在獨立代理程式程序中執行，
    請先使用 `isAvailable()` 再選擇此路徑。

  </Accordion>
  <Accordion title="api.runtime.subagent">
    啟動並管理背景子代理程式執行。

    ```typescript
    // 啟動子代理程式執行
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "將此查詢展開為聚焦的後續搜尋。",
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
    模型覆寫（`provider`／`model`）需要操作者透過設定中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確選擇啟用。不受信任的外掛仍可執行子代理程式，但覆寫請求會遭拒絕。
    </Warning>

    `deleteSession(...)` 可刪除由相同外掛透過 `api.runtime.subagent.run(...)` 建立的工作階段。刪除任意使用者或操作者工作階段，仍需要具管理員範圍的閘道請求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    從閘道載入的外掛程式碼或外掛命令列介面命令中，列出已連線的節點並叫用節點主機命令。當外掛擁有配對裝置上的本機工作時，請使用此功能，例如另一台 Mac 上的瀏覽器或音訊橋接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    當每個已連線節點向代理程式公開由外掛或 MCP 支援的
    工具時，`nodes.list(...)` 會包含該節點公告的
    `nodePluginTools` 描述元。這些描述元屬於即時連線狀態：當節點中斷連線時，閘道
    會捨棄它們；而在本機外掛／MCP 清單變更後，節點可使用
    `node.pluginTools.update` 取代它們。

    在閘道內，此執行階段位於程序內。在外掛命令列介面命令中，它會透過 RPC 呼叫已設定的閘道，因此 `openclaw googlemeet recover-tab` 等命令可從終端機檢查已配對的節點。節點命令仍會經過一般的閘道節點配對、命令允許清單、外掛節點叫用原則，以及節點本機命令處理。

    公開由節點託管之代理程式工具的外掛，可針對應預設加入允許清單的非危險命令設定 `agentTool.defaultPlatforms`。當操作者必須透過 `gateway.nodes.allowCommands` 明確選擇啟用時，請省略此設定。危險的節點主機命令應透過 `api.registerNodeInvokePolicy(...)` 註冊節點叫用原則；該原則會在命令允許清單檢查之後、命令轉送至節點之前於閘道中執行，因此直接 `node.invoke` 呼叫、由節點託管的外掛工具，以及較高階的外掛工具會共用相同的強制執行路徑。

    <Warning>
    選用的 `scopes` 欄位會為叫用要求閘道操作者範圍。OpenClaw 僅對內建外掛與受信任的官方外掛安裝項目採納此欄位；來自其他外掛的請求不會提升呼叫權限。僅當受信任外掛必須以更嚴格的閘道範圍（例如 `operator.admin`）叫用節點命令時，才使用此欄位。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    將 Task Flow 與 Task Run 狀態繫結至現有的 OpenClaw 工作階段鍵或受信任的工具情境。

    - `api.runtime.tasks.managedFlows` 可進行變更：建立、推進及取消 Task Flow。
    - `api.runtime.tasks.flows` 與 `api.runtime.tasks.runs` 是唯讀 DTO 檢視，用於列出項目與查詢狀態；兩者皆公開 `bindSession(...)`／`fromToolContext(...)`，以及 `get`、`list`、`findLatest` 與 `resolve`。
    - `api.runtime.tasks.flow` 是 `managedFlows` 已淘汰的別名。

    Task Flow 追蹤持久的多步驟工作流程狀態。它不是排程器：
    請使用排程或 `api.session.workflow.scheduleSessionTurn(...)` 進行未來
    喚醒，然後當該工作需要流程狀態、子任務、等待或取消時，
    在排定的回合中使用 `managedFlows`。

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

    當你已從自己的繫結層取得受信任的 OpenClaw 工作階段鍵時，請使用 `bindSession({ sessionKey, requesterOrigin })`。請勿從原始使用者輸入進行繫結。

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

    使用核心的 `messages.tts` 設定與供應商選擇。傳回 PCM 音訊緩衝區與取樣率。也可使用 `textToSpeechStream` 進行串流合成。

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
      mime: "audio/ogg", // 選用，適用於無法推斷 MIME 時
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
      instructions: "擷取商家、總額與可搜尋的標籤。",
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

    `describeImageFileWithModel(...)` 透過特定供應商／模型描述已知影像，略過 `describeImageFile(...)` 所使用的預設作用中模型解析。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍作為 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的相容性別名。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    影像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "一個正在繪製夕陽的機器人",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    影片生成，介面形式與影像生成一致。

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "日出時飛越海岸線的空拍鏡頭",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    音樂生成，介面形式與影像生成一致。

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "適合程式設計工作階段的輕快 lo-fi 曲目",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    網路搜尋。

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw 外掛 SDK", count: 5 },
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
    目前的執行階段設定快照與交易式設定寫入。優先使用
    已傳入作用中呼叫路徑的設定；只有在處理常式需要直接取得
    程序快照時才使用 `current()`。

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
    它會記錄寫入者的意圖，而不會從
    閘道手中奪走重新啟動的控制權。

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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // 已棄用的相容性別名。
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` 會立即執行單次心跳偵測週期，略過一般的合併計時器。傳入 `{ heartbeat: { target: "last" } }`，可強制傳送至最後一個作用中頻道，而非使用預設的 `target: "none"` 抑制行為。

    `runCommandWithTimeout(...)` 會傳回擷取到的 `stdout` 與 `stderr`、選用的
    截斷計數、`code`、`signal`、`killed`、`termination`，以及
    `noOutputTimedOut`。當子程序未提供非零結束代碼時，逾時與無輸出逾時
    結果會回報 `code: 124`。非逾時的訊號結束仍可能傳回
    `code: null`，因此請使用 `termination` 與
    `noOutputTimedOut` 來區分逾時原因。

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
    模型與供應商的驗證解析。

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
    狀態目錄解析與由 SQLite 支援的鍵值儲存。

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

    鍵值儲存會跨重新啟動保留，並依執行階段繫結的外掛 ID 隔離。使用 `registerIfAbsent(...)` 進行不可分割的去重占用：當鍵不存在或已過期並完成登錄時，它會傳回 `true`；當仍存在有效值時，則傳回 `false`，且不會覆寫其值、建立時間或 TTL。限制：每個命名空間的 `maxEntries`、每個外掛 50,000 筆有效資料列、低於 64KB 的 JSON 值，以及選用的 TTL 到期機制。預設情況下，在任一資料列限制下進行寫入時，會從正在寫入的命名空間中移除最舊的有效資料列；該次寫入不會逐出同層命名空間的資料列，而且如果命名空間無法釋出足夠的資料列，寫入仍會失敗。對於絕不可遭逐出的持久擁有權記錄，請設定 `overflowPolicy: "reject-new"`：新鍵達到任一限制時會失敗，而現有鍵仍可更新。

    `openSyncKeyedStore<T>(...)` 會傳回相同形式的儲存區，但方法為同步形式（`register`、`registerIfAbsent`、`lookup`、`consume`、`clear` 都會直接傳回值，而非 Promise），適用於無法等待的呼叫端。

    `openChannelIngressQueue<TPayload>(...)` 會開啟一個範圍限定於呼叫外掛的持久化輸入佇列，用於緩衝需要跨重新啟動進行至少一次處理的傳入事件。當過時占用復原使用 `shouldRecover` 時，如果應隔離包含損毀負載的已占用項目，也請提供 `shouldRecoverCorrupt`：它與負載無關的占用識別資訊，可讓外掛在佇列為資料列建立墓碑前保留有效擁有者與通道策略。

    <Warning>
    在此版本中，只有內建外掛與受信任的官方外掛安裝可使用 `openKeyedStore`、`openSyncKeyedStore` 和 `openChannelIngressQueue`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    頻道專用的執行階段輔助工具（載入頻道外掛時可用）。依用途分組：

    | 群組 | 用途 |
    | --- | --- |
    | `text` | 分塊（`chunkText`、`chunkMarkdownText`、`resolveChunkMode`）、控制命令偵測、Markdown 表格轉換。 |
    | `reply` | 緩衝區塊回覆分派、信封格式化、有效訊息／人為延遲設定解析。 |
    | `routing` | `buildAgentSessionKey`、`resolveAgentRoute`。 |
    | `pairing` | `buildPairingReply`、允許清單讀取、配對要求新增或更新。 |
    | `media` | 遠端媒體下載／儲存（見下文）。 |
    | `activity` | 記錄／讀取最近的頻道活動。 |
    | `session` | 從傳入事件取得工作階段中繼資料、更新最近路由。 |
    | `mentions` | 提及原則輔助函式（見下文）。 |
    | `reactions` | 用於處理中指示器的確認回應控制代碼。 |
    | `groups` | 群組原則及要求提及解析。 |
    | `debounce` | 傳入訊息防彈跳。 |
    | `commands` | 命令授權及文字命令管控。 |
    | `outbound` | 載入頻道的傳出配接器。 |
    | `inbound` | 建立傳入事件情境，並執行共用的傳入事件／回覆核心。 |
    | `threadBindings` | 調整已繫結工作階段討論串的閒置逾時／存續期限上限。 |
    | `runtimeContexts` | 註冊、讀取及監看程序本機的各頻道／帳號／能力情境。 |

    `api.runtime.channel.media` 是下載及儲存頻道媒體的首選介面：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    當遠端 URL 應成為 OpenClaw 媒體時，請使用 `saveRemoteMedia(...)`。當外掛已透過外掛擁有的驗證、重新導向或允許清單處理取得 `Response` 時，請使用 `saveResponseMedia(...)`。只有在外掛需要原始位元組以進行檢查、轉換、解密或重新上傳時，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 仍是 `readRemoteMediaBuffer(...)` 的已棄用相容性別名。

    `api.runtime.channel.mentions` 是使用執行階段注入之內建頻道外掛的共用傳入提及原則介面：

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

    `api.runtime.channel.mentions` 刻意不公開較舊的 `resolveMentionGating*` 相容性輔助函式。請優先使用標準化的 `{ facts, policy }` 路徑。

    `reply`、`session` 與 `inbound` 下的數個欄位帶有各欄位的 `@deprecated` 附註，指向目前的頻道回合核心或頻道傳出配接器；在以特定輔助函式建構新程式碼前，請先查看其行內 JSDoc。

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
      return store.getRuntime(); // 若尚未初始化則擲回例外
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 若尚未初始化則傳回 null
    }
    ```

  </Step>
</Steps>

<Note>
執行階段儲存區識別應優先使用 `pluginId`。較低階的 `key` 形式適用於單一外掛刻意需要多個執行階段位置的少見情況。
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
  來自 `plugins.entries.<id>.config` 的外掛專屬設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  具範圍的記錄器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  目前的載入模式：`"full"`（即時啟用）、`"discovery"`／`"tool-discovery"`（唯讀能力探索）、`"setup-only"`（輕量設定進入點）、`"setup-runtime"`（同時需要執行階段頻道進入點的設定流程），或 `"cli-metadata"`（命令列介面命令中繼資料收集）。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相對於外掛根目錄的路徑。
</ParamField>

## 相關內容

- [外掛內部架構](/zh-TW/plugins/architecture) — 能力模型與登錄檔
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 選項
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 子路徑參考
