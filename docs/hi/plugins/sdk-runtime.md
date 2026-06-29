---
read_when:
    - आपको Plugin से कोर हेल्पर्स को कॉल करना है (TTS, STT, इमेज जनरेशन, वेब खोज, उप-एजेंट, नोड्स)
    - आप समझना चाहते हैं कि api.runtime क्या उजागर करता है
    - आप Plugin कोड से config, agent, या media helpers एक्सेस कर रहे हैं
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin के लिए उपलब्ध इंजेक्टेड runtime helpers
title: Plugin रनटाइम सहायक
x-i18n:
    generated_at: "2026-06-28T23:52:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

हर Plugin में पंजीकरण के दौरान इंजेक्ट किए जाने वाले `api.runtime` ऑब्जेक्ट का संदर्भ। होस्ट के आंतरिक हिस्सों को सीधे import करने के बजाय इन helpers का उपयोग करें।

<CardGroup cols={2}>
  <Card title="Channel Plugin" href="/hi/plugins/sdk-channel-plugins">
    Channel Plugin के संदर्भ में इन helpers का उपयोग करने वाली चरण-दर-चरण मार्गदर्शिका।
  </Card>
  <Card title="Provider Plugin" href="/hi/plugins/sdk-provider-plugins">
    Provider Plugin के संदर्भ में इन helpers का उपयोग करने वाली चरण-दर-चरण मार्गदर्शिका।
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## कॉन्फिग लोडिंग और लिखना

उस कॉन्फिग को प्राथमिकता दें जो सक्रिय कॉल पाथ में पहले ही पास किया जा चुका था, उदाहरण के लिए पंजीकरण के दौरान `api.config` या channel/provider callbacks पर कोई `cfg` argument। इससे hot paths पर कॉन्फिग को दोबारा parse करने के बजाय एक ही process snapshot पूरे काम में प्रवाहित रहता है।

`api.runtime.config.current()` का उपयोग केवल तब करें जब किसी लंबे समय तक जीवित रहने वाले handler को वर्तमान process snapshot की आवश्यकता हो और उस function को कोई कॉन्फिग पास न किया गया हो। लौटाया गया मान readonly है; editing से पहले clone करें या mutation helper का उपयोग करें।

Tool factories को `ctx.runtimeConfig` के साथ `ctx.getRuntimeConfig()` मिलता है। लंबे समय तक जीवित रहने वाले tool के `execute` callback के अंदर getter का उपयोग करें, जब tool definition बनने के बाद कॉन्फिग बदल सकता हो।

बदलावों को `api.runtime.config.mutateConfigFile(...)` या `api.runtime.config.replaceConfigFile(...)` के साथ persist करें। हर write को स्पष्ट `afterWrite` policy चुननी होगी:

- `afterWrite: { mode: "auto" }` gateway reload planner को निर्णय लेने देता है।
- `afterWrite: { mode: "restart", reason: "..." }` तब clean restart को बाध्य करता है जब writer जानता हो कि hot reload सुरक्षित नहीं है।
- `afterWrite: { mode: "none", reason: "..." }` automatic reload/restart को केवल तब दबाता है जब caller follow-up का owner हो।

mutation helpers `afterWrite` के साथ typed `followUp` summary लौटाते हैं ताकि callers log कर सकें या test कर सकें कि उन्होंने restart request किया था या नहीं। वह restart वास्तव में कब होता है, इसका owner अब भी Gateway ही है।

`api.runtime.config.loadConfig()` और `api.runtime.config.writeConfigFile(...)`, `runtime-config-load-write` के अंतर्गत deprecated compatibility helpers हैं। वे runtime पर एक बार warning देते हैं, और migration window के दौरान पुराने external Plugin के लिए उपलब्ध रहते हैं। Bundled Plugin को उनका उपयोग नहीं करना चाहिए; यदि Plugin code उन्हें call करता है या Plugin SDK subpaths से उन helpers को import करता है, तो config boundary guards fail हो जाते हैं।

Direct SDK imports के लिए, व्यापक
`openclaw/plugin-sdk/config-runtime` compatibility barrel के बजाय केंद्रित config subpaths का उपयोग करें: types के लिए `config-contracts`, पहले से loaded config assertions और Plugin entry lookup के लिए `plugin-config-runtime`, वर्तमान process snapshots के लिए `runtime-config-snapshot`, और writes के लिए `config-mutation`। Bundled Plugin tests को व्यापक compatibility barrel को mock करने के बजाय इन केंद्रित subpaths को सीधे mock करना चाहिए।

Internal OpenClaw runtime code की दिशा भी यही है: CLI, Gateway, या process boundary पर config एक बार load करें, फिर उस value को आगे pass करें। सफल mutation writes process runtime snapshot को refresh करते हैं और उसकी internal revision को आगे बढ़ाते हैं; लंबे समय तक जीवित रहने वाले caches को config को locally serialize करने के बजाय runtime-owned cache key पर key करना चाहिए। लंबे समय तक जीवित रहने वाले runtime modules में ambient `loadConfig()` calls के लिए zero-tolerance scanner है; passed `cfg`, request `context.getRuntimeConfig()`, या explicit process boundary पर `getRuntimeConfig()` का उपयोग करें।

Provider और channel execution paths को active runtime config snapshot का उपयोग करना चाहिए, config readback या editing के लिए लौटाए गए file snapshot का नहीं। File snapshots UI और writes के लिए SecretRef markers जैसे source values को preserve करते हैं; provider callbacks को resolved runtime view चाहिए। जब कोई helper active source snapshot या active runtime snapshot में से किसी के साथ call किया जा सकता हो, तो credentials पढ़ने से पहले `selectApplicableRuntimeConfig()` के माध्यम से route करें।

## दोबारा उपयोग होने वाली runtime utilities

bot-authored inbound messages के लिए inbound `botLoopProtection` facts का उपयोग करें। Core session record और dispatch से पहले shared in-memory sliding-window guard लागू करता है, policy को किसी एक channel से बांधे बिना। Guard `(scopeId, conversationId, participant pair)` keys को track करता है, pair की दोनों दिशाओं को साथ गिनता है, window budget पार होने पर cooldown लागू करता है, और inactive entries को opportunistically prune करता है।

जो Channel Plugin इस behavior को operators के सामने expose करते हैं, उन्हें baseline budgets के लिए shared `channels.defaults.botLoopProtection` shape को प्राथमिकता देनी चाहिए, फिर ऊपर channel/provider-specific overrides layer करने चाहिए। Shared config seconds का उपयोग करता है क्योंकि यह user-facing है:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Resolved turn के साथ normalized bot-pair facts pass करें। Core defaults, unit conversion, और `enabled` semantics resolve करता है:

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

`openclaw/plugin-sdk/pair-loop-guard-runtime` का सीधे उपयोग केवल custom
two-party event loops के लिए करें जो shared inbound reply runner से होकर नहीं गुजरते।

## Runtime namespaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent identity, directories, और session management।

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

    `runEmbeddedAgent(...)` Plugin code से सामान्य OpenClaw agent turn शुरू करने के लिए neutral helper है। यह वही provider/model resolution और agent-harness selection उपयोग करता है जो channel-triggered replies करते हैं।

    `runEmbeddedPiAgent(...)` मौजूदा Plugin के लिए deprecated compatibility alias के रूप में रहता है। नए code को `runEmbeddedAgent(...)` का उपयोग करना चाहिए।

    `resolveThinkingPolicy(...)` provider/model के supported thinking levels और optional default लौटाता है। Provider Plugin अपने thinking hooks के माध्यम से model-specific profile own करते हैं, इसलिए tool Plugin को provider lists import या duplicate करने के बजाय इस runtime helper को call करना चाहिए।

    `normalizeThinkingLevel(...)` user text जैसे `on`, `x-high`, या `extra high` को resolved policy के विरुद्ध check करने से पहले canonical stored level में convert करता है।

    **Session store helpers** `api.runtime.agent.session` के अंतर्गत हैं:

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

    session workflows के लिए `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, या `upsertSessionEntry(...)` को प्राथमिकता दें। ये helpers sessions को agent/session identity से address करते हैं ताकि Plugin legacy `sessions.json` storage shape पर निर्भर न हों। metadata-only patches के लिए `preserveActivity: true` का उपयोग करें जिन्हें session activity refresh नहीं करनी चाहिए, और `replaceEntry: true` केवल तब जब callback complete entry लौटाता हो और deleted fields को deleted ही रहना हो।

    transcript reads और writes के लिए, `openclaw/plugin-sdk/session-transcript-runtime` import करें और `{ agentId, sessionKey, sessionId }` के साथ `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, या `withSessionTranscriptWriteLock(...)` का उपयोग करें। ये APIs Plugin को transcript identify करने, उसके events पढ़ने, messages append करने, updates publish करने, और related operations को उसी transcript write lock के अंतर्गत run करने देते हैं। `sessionFile` pass करना, `resolveSessionTranscriptLegacyFileTarget(...)` का उपयोग करना, या `openclaw/plugin-sdk/agent-harness-runtime` से low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` import करना deprecated है; वे paths केवल legacy code के लिए मौजूद हैं जिसे पहले से active transcript artifact मिलता है।

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)`, और `resolveAndPersistSessionFile(...)` उन Plugin के लिए deprecated compatibility helpers हैं जो अभी भी जानबूझकर legacy whole-store या transcript-file shape पर निर्भर हैं। नए Plugin code को उन helpers का उपयोग नहीं करना चाहिए, और मौजूदा callers को entry helpers और transcript identity helpers पर migrate करना चाहिए।

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Default model और provider constants:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    provider internals import किए बिना या OpenClaw model/auth/base URL preparation duplicate किए बिना host-owned text completion run करें।

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Helper वही simple-completion preparation path उपयोग करता है जो OpenClaw का built-in runtime और host-owned runtime config snapshot उपयोग करते हैं। Context engines को session-bound `llm.complete` capability मिलती है, इसलिए model calls active session के agent का उपयोग करते हैं और default agent पर चुपचाप fall back नहीं करते। Result में provider/model/agent attribution के साथ normalized token, cache, और estimated cost usage शामिल होता है, जब उपलब्ध हो।

    <Warning>
    Model overrides के लिए config में `plugins.entries.<id>.llm.allowModelOverride: true` के माध्यम से operator opt-in आवश्यक है। trusted Plugin को specific canonical `provider/model` targets तक सीमित करने के लिए `plugins.entries.<id>.llm.allowedModels` का उपयोग करें। Cross-agent completions के लिए `plugins.entries.<id>.llm.allowAgentIdOverride: true` आवश्यक है।
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Background subagent runs launch और manage करें।

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
    मॉडल ओवरराइड (`provider`/`model`) के लिए config में `plugins.entries.<id>.subagent.allowModelOverride: true` के माध्यम से ऑपरेटर की ऑप्ट-इन आवश्यक है। अविश्वसनीय Plugin अब भी सबएजेंट चला सकते हैं, लेकिन ओवरराइड अनुरोध अस्वीकार कर दिए जाते हैं।
    </Warning>

    `deleteSession(...)` उसी Plugin द्वारा `api.runtime.subagent.run(...)` के माध्यम से बनाए गए सेशन मिटा सकता है। मनमाने उपयोगकर्ता या ऑपरेटर सेशन मिटाने के लिए अब भी admin-स्कोप वाले Gateway अनुरोध की आवश्यकता होती है।

  </Accordion>
  <Accordion title="api.runtime.nodes">
    कनेक्टेड Node सूचीबद्ध करें और Gateway-लोडेड Plugin कोड या Plugin CLI कमांड से node-host कमांड चलाएं। इसका उपयोग तब करें जब कोई Plugin किसी पेयर्ड डिवाइस पर स्थानीय काम का स्वामी हो, उदाहरण के लिए किसी दूसरे Mac पर ब्राउज़र या ऑडियो ब्रिज।

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway के अंदर यह रनटाइम in-process होता है। Plugin CLI कमांड में यह configured Gateway को RPC पर कॉल करता है, इसलिए `openclaw googlemeet recover-tab` जैसे कमांड टर्मिनल से पेयर्ड Node का निरीक्षण कर सकते हैं। Node कमांड अब भी सामान्य Gateway Node पेयरिंग, कमांड allowlists, Plugin node-invoke नीतियों, और node-local कमांड हैंडलिंग से गुजरते हैं।

    खतरनाक node-host कमांड उजागर करने वाले Plugin को `api.registerNodeInvokePolicy(...)` के साथ node-invoke नीति रजिस्टर करनी चाहिए। नीति Gateway में कमांड allowlist जांचों के बाद और कमांड को Node पर फॉरवर्ड किए जाने से पहले चलती है, इसलिए सीधे `node.invoke` कॉल और उच्च-स्तरीय Plugin टूल समान enforcement path साझा करते हैं।

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Task Flow रनटाइम को किसी मौजूदा OpenClaw सेशन key या विश्वसनीय टूल context से बांधें, फिर हर कॉल पर owner पास किए बिना Task Flows बनाएं और प्रबंधित करें।

    Task Flow टिकाऊ बहु-चरणीय workflow state को ट्रैक करता है। यह scheduler नहीं है:
    भविष्य के wakeups के लिए Cron या `api.session.workflow.scheduleSessionTurn(...)` का उपयोग करें,
    फिर scheduled turn से `managedFlows` का उपयोग करें जब उस काम को flow state,
    child tasks, waits, या cancellation की आवश्यकता हो।

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

    जब आपके पास अपनी binding layer से पहले से विश्वसनीय OpenClaw सेशन key हो, तो `bindSession({ sessionKey, requesterOrigin })` का उपयोग करें। कच्चे उपयोगकर्ता input से bind न करें।

  </Accordion>
  <Accordion title="api.runtime.tts">
    टेक्स्ट-से-स्पीच synthesis।

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

    core `messages.tts` configuration और provider selection का उपयोग करता है। PCM audio buffer + sample rate लौटाता है।

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    इमेज, ऑडियो, और वीडियो विश्लेषण।

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

    जब कोई output produced नहीं होता है, तो `{ text: undefined }` लौटाता है (जैसे skipped input)।

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`, `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` के लिए compatibility alias के रूप में बना रहता है।
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    इमेज generation।

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    वेब खोज।

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    निम्न-स्तरीय media utilities।

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
    मौजूदा runtime config snapshot और transactional config writes। सक्रिय call path में पहले से पास किए गए
    config को प्राथमिकता दें; `current()` का उपयोग केवल तब करें जब handler को सीधे process snapshot चाहिए।

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` और `replaceConfigFile(...)` एक `followUp`
    value लौटाते हैं, उदाहरण के लिए `{ mode: "restart", requiresRestart: true, reason }`,
    जो gateway से restart control छीने बिना writer intent रिकॉर्ड करता है।

  </Accordion>
  <Accordion title="api.runtime.system">
    सिस्टम-स्तरीय utilities।

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

    `runCommandWithTimeout(...)` captured `stdout` और `stderr`, optional
    truncation counts, `code`, `signal`, `killed`, `termination`, और
    `noOutputTimedOut` लौटाता है। Timeout और no-output-timeout results `code: 124`
    रिपोर्ट करते हैं जब child process non-zero exit code प्रदान नहीं करता। Non-timeout
    signal exits अब भी `code: null` लौटा सकते हैं, इसलिए timeout reasons अलग करने के लिए `termination` और
    `noOutputTimedOut` का उपयोग करें।

  </Accordion>
  <Accordion title="api.runtime.events">
    Event subscriptions।

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
    Logging।

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    मॉडल और provider auth resolution।

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    State directory resolution और SQLite-backed keyed storage।

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

    की वाले स्टोर restart के बाद भी बने रहते हैं और runtime-बाउंड plugin id के आधार पर अलग-थलग रहते हैं। परमाणु dedupe दावों के लिए `registerIfAbsent(...)` का उपयोग करें: जब key गायब या expired थी और registered हो गई, तो यह `true` लौटाता है, या जब कोई live value पहले से मौजूद हो, तो उसकी value, creation time, या TTL को overwrite किए बिना `false` लौटाता है। सीमाएं: प्रति namespace `maxEntries`, प्रति Plugin 6,000 live rows, 64KB से कम JSON values, और वैकल्पिक TTL expiry। जब कोई write Plugin row cap से अधिक हो जाएगा, तो runtime लिखे जा रहे namespace से सबसे पुराने live rows को evict कर सकता है; उस write के लिए sibling namespaces evict नहीं होते, और अगर namespace पर्याप्त rows free नहीं कर सकता तो write फिर भी fail होता है।

    <Warning>
    इस release में केवल bundled Plugins।
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Memory tool factories और CLI।

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Channel-specific runtime helpers (channel Plugin loaded होने पर उपलब्ध)।

    `api.runtime.channel.media` channel media downloads और storage के लिए preferred surface है:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    जब किसी remote URL को OpenClaw media बनना चाहिए, तो `saveRemoteMedia(...)` का उपयोग करें। जब Plugin ने Plugin-owned auth, redirect, या allowlist handling के साथ पहले ही एक `Response` fetch कर लिया हो, तो `saveResponseMedia(...)` का उपयोग करें। `readRemoteMediaBuffer(...)` का उपयोग केवल तब करें जब Plugin को inspection, transforms, decryption, या reupload के लिए raw bytes चाहिए हों। `fetchRemoteMedia(...)`, `readRemoteMediaBuffer(...)` के लिए deprecated compatibility alias बना हुआ है।

    `api.runtime.channel.mentions` उन bundled channel Plugins के लिए shared inbound mention-policy surface है जो runtime injection का उपयोग करते हैं:

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

    उपलब्ध mention helpers:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` जानबूझकर पुराने `resolveMentionGating*` compatibility helpers को expose नहीं करता। normalized `{ facts, policy }` path को प्राथमिकता दें।

  </Accordion>
</AccordionGroup>

## runtime references स्टोर करना

`register` callback के बाहर उपयोग के लिए runtime reference स्टोर करने हेतु `createPluginRuntimeStore` का उपयोग करें:

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
runtime-store identity के लिए `pluginId` को प्राथमिकता दें। lower-level `key` form उन असामान्य मामलों के लिए है जहां एक Plugin को जानबूझकर एक से अधिक runtime slot चाहिए।
</Note>

## अन्य top-level `api` fields

`api.runtime` के अलावा, API object यह भी प्रदान करता है:

<ParamField path="api.id" type="string">
  Plugin id।
</ParamField>
<ParamField path="api.name" type="string">
  Plugin display name।
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  वर्तमान config snapshot (उपलब्ध होने पर active in-memory runtime snapshot)।
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` से Plugin-specific config।
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  scoped logger (`debug`, `info`, `warn`, `error`)।
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  वर्तमान load mode; `"setup-runtime"` lightweight pre-full-entry startup/setup window है।
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin root के relative path resolve करें।
</ParamField>

## संबंधित

- [Plugin internals](/hi/plugins/architecture) — capability model और registry
- [SDK entry points](/hi/plugins/sdk-entrypoints) — `definePluginEntry` options
- [SDK overview](/hi/plugins/sdk-overview) — subpath reference
