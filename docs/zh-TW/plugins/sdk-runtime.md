---
read_when:
    - 你需要從 Plugin 呼叫核心輔助工具（TTS、STT、image gen、web search、subagent、nodes）
    - 您想了解 api.runtime 提供了哪些內容
    - 你正在從 Plugin 程式碼存取設定、代理或媒體輔助工具
sidebarTitle: Runtime helpers
summary: api.runtime -- 可供 Plugin 使用的注入式執行階段輔助工具
title: Plugin 執行階段輔助函式
x-i18n:
    generated_at: "2026-04-30T03:26:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 399e2433e272fe30e7451690a64826df8e30a064269b8d9a7aa2dd2b0c5688b8
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Reference for the `api.runtime` 物件，會在註冊期間注入到每個 Plugin。請使用這些輔助工具，而不是直接匯入主機內部實作。

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/zh-TW/plugins/sdk-channel-plugins">
    逐步指南，在通道 Plugin 的情境中使用這些輔助工具。
  </Card>
  <Card title="Provider plugins" href="/zh-TW/plugins/sdk-provider-plugins">
    逐步指南，在供應商 Plugin 的情境中使用這些輔助工具。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 設定載入與寫入

優先使用已經傳入目前有效呼叫路徑的設定，例如註冊期間的 `api.config`，或通道/供應商回呼中的 `cfg` 引數。這會讓單一程序快照貫穿整個工作流程，而不是在熱路徑上重新剖析設定。

只有在長生命週期處理常式需要目前程序快照，且該函式沒有傳入設定時，才使用 `api.runtime.config.current()`。傳回的值是唯讀的；編輯前請先複製，或使用變更輔助工具。

工具工廠會收到 `ctx.runtimeConfig` 加上 `ctx.getRuntimeConfig()`。當設定可能在工具定義建立後變更時，請在長生命週期工具的 `execute` 回呼內使用 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化變更。每次寫入都必須選擇明確的 `afterWrite` 政策：

- `afterWrite: { mode: "auto" }` 讓 Gateway 的重新載入規劃器決定。
- `afterWrite: { mode: "restart", reason: "..." }` 會在寫入方知道熱重新載入不安全時強制乾淨重啟。
- `afterWrite: { mode: "none", reason: "..." }` 只有在呼叫方擁有後續處理時，才抑制自動重新載入/重啟。

變更輔助工具會傳回 `afterWrite` 加上具型別的 `followUp` 摘要，讓呼叫方可以記錄或測試是否已要求重啟。Gateway 仍然擁有實際發生重啟的時機。

`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 是 `runtime-config-load-write` 下已棄用的相容性輔助工具。它們會在執行階段警告一次，並在遷移期間持續供舊版外部 Plugin 使用。內建 Plugin 不得使用它們；如果 Plugin 程式碼呼叫它們，或從 Plugin SDK 子路徑匯入這些輔助工具，設定邊界守衛會失敗。

若要直接匯入 SDK，請使用聚焦的設定子路徑，而不是寬泛的
`openclaw/plugin-sdk/config-runtime` 相容性 barrel：`config-types` 用於
型別，`plugin-config-runtime` 用於已載入設定的斷言和 Plugin
進入點查找，`runtime-config-snapshot` 用於目前程序快照，而
`config-mutation` 用於寫入。內建 Plugin 測試應直接 mock 這些聚焦的
子路徑，而不是 mock 寬泛的相容性 barrel。

OpenClaw 內部執行階段程式碼也遵循相同方向：在 CLI、Gateway 或程序邊界載入一次設定，然後傳遞該值。成功的變更寫入會重新整理程序執行階段快照，並推進其內部修訂版；長生命週期快取應以執行階段擁有的快取鍵為 key，而不是在本機序列化設定。長生命週期執行階段模組對環境式 `loadConfig()` 呼叫有零容忍掃描器；請使用傳入的 `cfg`、請求的 `context.getRuntimeConfig()`，或在明確程序邊界上的 `getRuntimeConfig()`。

供應商和通道執行路徑必須使用有效的執行階段設定快照，而不是為了設定讀回或編輯而傳回的檔案快照。檔案快照會保留 UI 和寫入所需的來源值，例如 SecretRef 標記；供應商回呼需要已解析的執行階段檢視。當輔助工具可能以有效來源快照或有效執行階段快照呼叫時，請先透過 `selectApplicableRuntimeConfig()` 再讀取憑證。

## 執行階段命名空間

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent 身分、目錄和工作階段管理。

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

    `runEmbeddedAgent(...)` 是從 Plugin 程式碼啟動一般 OpenClaw Agent 回合的中立輔助工具。它使用與通道觸發回覆相同的供應商/模型解析和 Agent harness 選擇。

    `runEmbeddedPiAgent(...)` 仍保留為相容性別名。

    `resolveThinkingPolicy(...)` 會傳回供應商/模型支援的思考等級和選用預設值。供應商 Plugin 透過其 thinking hook 擁有模型特定的設定檔，因此工具 Plugin 應呼叫這個執行階段輔助工具，而不是匯入或重複供應商清單。

    `normalizeThinkingLevel(...)` 會將使用者文字，例如 `on`、`x-high` 或 `extra high`，轉換為標準儲存等級，再對照已解析的政策檢查。

    **工作階段儲存輔助工具** 位於 `api.runtime.agent.session` 下：

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    預設模型和供應商常數：

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    啟動並管理背景子 Agent 執行。

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
    模型覆寫（`provider`/`model`）需要操作員透過設定中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 明確同意。不受信任的 Plugin 仍可執行子 Agent，但覆寫要求會被拒絕。
    </Warning>

    `deleteSession(...)` 可以刪除同一個 Plugin 透過 `api.runtime.subagent.run(...)` 建立的工作階段。刪除任意使用者或操作員工作階段仍需要管理員範圍的 Gateway 要求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已連線的節點，並從 Gateway 載入的 Plugin 程式碼或 Plugin CLI 命令叫用節點主機命令。當 Plugin 擁有已配對裝置上的本機工作時使用，例如另一台 Mac 上的瀏覽器或音訊橋接器。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在 Gateway 內部，這個執行階段是在程序內。在 Plugin CLI 命令中，它會透過 RPC 呼叫已設定的 Gateway，因此像 `openclaw googlemeet recover-tab` 這類命令可以從終端機檢查已配對節點。Node 命令仍會經過一般 Gateway 節點配對、命令允許清單和節點本機命令處理。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    將 Task Flow 執行階段繫結到現有的 OpenClaw 工作階段鍵或受信任工具情境，然後建立並管理 Task Flow，而不必在每次呼叫時傳入擁有者。

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

    當你已經從自己的繫結層取得受信任的 OpenClaw 工作階段鍵時，請使用 `bindSession({ sessionKey, requesterOrigin })`。不要從原始使用者輸入進行繫結。

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

    使用核心 `messages.tts` 設定和供應商選擇。傳回 PCM 音訊緩衝區 + 取樣率。

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
    ```

    未產生輸出時會傳回 `{ text: undefined }`（例如略過的輸入）。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 仍作為 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的相容性別名。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    圖片生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Web 搜尋。

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
    目前的執行階段設定快照與交易式設定寫入。優先使用已傳入有效呼叫路徑的設定；只有在處理常式需要直接取得程序快照時，才使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 會回傳 `followUp` 值，例如 `{ mode: "restart", requiresRestart: true, reason }`，用來記錄寫入者意圖，同時不會從 gateway 手中接管重新啟動控制權。

  </Accordion>
  <Accordion title="api.runtime.system">
    系統層級工具。

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

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
    狀態目錄解析與以 SQLite 為後端的鍵值儲存。

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

    鍵值儲存會在重新啟動後保留，並依執行階段繫結的 plugin id 隔離。限制：每個命名空間 `maxEntries`、每個 Plugin 1,000 筆即時資料列、JSON 值小於 64KB，以及選用的 TTL 到期。

    <Warning>
    此版本僅限內建 plugins。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    記憶體工具工廠與 CLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    頻道特定的執行階段輔助工具（載入頻道 Plugin 時可用）。

    `api.runtime.channel.mentions` 是供使用執行階段注入的內建頻道 plugins 共用的傳入提及政策介面：

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

    `api.runtime.channel.mentions` 刻意不公開較舊的 `resolveMentionGating*` 相容性輔助工具。請優先使用正規化的 `{ facts, policy }` 路徑。

  </Accordion>
</AccordionGroup>

## 儲存執行階段參照

使用 `createPluginRuntimeStore` 儲存執行階段參照，以便在 `register` 回呼外使用：

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
執行階段儲存身分請優先使用 `pluginId`。較低階的 `key` 形式適用於一個 Plugin 有意需要多個執行階段槽位的少見情況。
</Note>

## 其他頂層 `api` 欄位

除了 `api.runtime` 之外，API 物件也提供：

<ParamField path="api.id" type="string">
  Plugin id。
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 顯示名稱。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  目前設定快照（可用時為有效的記憶體內執行階段快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  來自 `plugins.entries.<id>.config` 的 Plugin 特定設定。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  作用域記錄器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  目前載入模式；`"setup-runtime"` 是啟動/設定時的輕量前置完整進入點視窗。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  解析相對於 Plugin 根目錄的路徑。
</ParamField>

## 相關

- [Plugin 內部](/zh-TW/plugins/architecture) — 能力模型與登錄檔
- [SDK 進入點](/zh-TW/plugins/sdk-entrypoints) — `definePluginEntry` 選項
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 子路徑參考
