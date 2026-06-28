---
read_when:
    - Bir Plugin’den çekirdek yardımcıları çağırmanız gerekiyor (TTS, STT, görsel üretimi, web araması, alt ajan, düğümler)
    - api.runtime öğesinin neler sunduğunu anlamak istiyorsunuz
    - Plugin kodundan yapılandırma, ajan veya medya yardımcılarına erişiyorsunuz
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin'lerin kullanabildiği enjekte edilmiş çalışma zamanı yardımcıları
title: Plugin çalışma zamanı yardımcıları
x-i18n:
    generated_at: "2026-06-28T01:05:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Her plugin'e kayıt sırasında enjekte edilen `api.runtime` nesnesi için başvuru. Host iç bileşenlerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" href="/tr/plugins/sdk-channel-plugins">
    Kanal Plugin'leri için bu yardımcıları bağlam içinde kullanan adım adım kılavuz.
  </Card>
  <Card title="Provider Plugin'leri" href="/tr/plugins/sdk-provider-plugins">
    Provider Plugin'leri için bu yardımcıları bağlam içinde kullanan adım adım kılavuz.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Config yükleme ve yazma

Etkin çağrı yoluna zaten geçirilmiş config'i tercih edin; örneğin kayıt sırasında `api.config` veya kanal/provider callback'lerinde bir `cfg` argümanı. Bu, sıcak yollarda config'i yeniden ayrıştırmak yerine tek bir işlem snapshot'ının iş boyunca akmasını sağlar.

`api.runtime.config.current()` yalnızca uzun ömürlü bir handler geçerli işlem snapshot'ına ihtiyaç duyduğunda ve bu işleve config geçirilmediğinde kullanın. Döndürülen değer salt okunurdur; düzenlemeden önce klonlayın veya bir mutasyon yardımcısı kullanın.

Tool factory'leri `ctx.runtimeConfig` ve `ctx.getRuntimeConfig()` alır. Tool tanımı oluşturulduktan sonra config değişebiliyorsa getter'ı uzun ömürlü bir tool'un `execute` callback'i içinde kullanın.

Değişiklikleri `api.runtime.config.mutateConfigFile(...)` veya `api.runtime.config.replaceConfigFile(...)` ile kalıcı hale getirin. Her yazma açık bir `afterWrite` politikası seçmelidir:

- `afterWrite: { mode: "auto" }` gateway yeniden yükleme planlayıcısının karar vermesine izin verir.
- `afterWrite: { mode: "restart", reason: "..." }` yazıcı sıcak yeniden yüklemenin güvenli olmadığını bildiğinde temiz bir yeniden başlatmayı zorunlu kılar.
- `afterWrite: { mode: "none", reason: "..." }` otomatik yeniden yükleme/yeniden başlatmayı yalnızca çağıran taraf takip işinin sahibi olduğunda bastırır.

Mutasyon yardımcıları `afterWrite` ile birlikte tipli bir `followUp` özeti döndürür, böylece çağıranlar yeniden başlatma isteyip istemediklerini loglayabilir veya test edebilir. Bu yeniden başlatmanın gerçekte ne zaman olacağının sahibi yine gateway'dir.

`api.runtime.config.loadConfig()` ve `api.runtime.config.writeConfigFile(...)`, `runtime-config-load-write` altındaki kullanımdan kaldırılmış uyumluluk yardımcılarıdır. Çalışma zamanında bir kez uyarır ve geçiş penceresi boyunca eski harici Plugin'ler için kullanılabilir kalır. Paketli Plugin'ler bunları kullanmamalıdır; Plugin kodu bunları çağırırsa veya bu yardımcıları Plugin SDK alt yollarından içe aktarırsa config sınırı korumaları başarısız olur.

Doğrudan SDK içe aktarmaları için geniş
`openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ı yerine odaklanmış config alt yollarını kullanın: tipler için
`config-contracts`, zaten yüklenmiş config doğrulamaları ve Plugin
entry araması için `plugin-config-runtime`, geçerli işlem snapshot'ları için `runtime-config-snapshot` ve
yazmalar için `config-mutation`. Paketli Plugin testleri, geniş uyumluluk barrel'ını mock'lamak yerine bu odaklanmış
alt yolları doğrudan mock'lamalıdır.

Dahili OpenClaw runtime kodu da aynı yöne sahiptir: config'i CLI, gateway veya işlem sınırında bir kez yükleyin, sonra bu değeri iletin. Başarılı mutasyon yazmaları işlem runtime snapshot'ını yeniler ve dahili revision'ını ilerletir; uzun ömürlü cache'ler config'i yerel olarak serialize etmek yerine runtime'ın sahip olduğu cache key'e göre anahtarlanmalıdır. Uzun ömürlü runtime modüllerinde ortamdan `loadConfig()` çağrıları için sıfır toleranslı bir tarayıcı vardır; geçirilmiş bir `cfg`, istek `context.getRuntimeConfig()`'i veya açık bir işlem sınırında `getRuntimeConfig()` kullanın.

Provider ve kanal yürütme yolları, config readback veya düzenleme için döndürülen bir dosya snapshot'ını değil, etkin runtime config snapshot'ını kullanmalıdır. Dosya snapshot'ları UI ve yazmalar için SecretRef işaretleri gibi kaynak değerlerini korur; provider callback'leri çözümlenmiş runtime görünümüne ihtiyaç duyar. Bir yardımcı hem etkin kaynak snapshot'ı hem de etkin runtime snapshot'ı ile çağrılabiliyorsa kimlik bilgilerini okumadan önce `selectApplicableRuntimeConfig()` üzerinden yönlendirin.

## Yeniden kullanılabilir runtime yardımcıları

Bot tarafından yazılmış gelen iletiler için gelen `botLoopProtection` olgularını kullanın. Core, politikayı tek bir kanala bağlamadan, session kaydı ve dispatch öncesinde paylaşılan bellek içi sliding-window korumasını uygular. Koruma `(scopeId, conversationId, participant pair)` anahtarlarını izler, bir çiftin iki yönünü birlikte sayar, pencere bütçesi aşıldığında cooldown uygular ve etkin olmayan girdileri fırsat buldukça budar.

Bu davranışı operatörlere sunan kanal Plugin'leri, taban bütçeler için paylaşılan `channels.defaults.botLoopProtection` şeklini tercih etmeli, sonra bunun üzerine kanala/provider'a özgü geçersiz kılmaları katmanlamalıdır. Paylaşılan config kullanıcıya dönük olduğu için saniye kullanır:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Çözümlenmiş turn ile normalleştirilmiş bot çifti olgularını geçirin. Core varsayılanları, birim dönüşümünü ve `enabled` semantiğini çözümler:

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

Paylaşılan gelen yanıt çalıştırıcısından geçmeyen özel
iki taraflı event loop'ları için yalnızca `openclaw/plugin-sdk/pair-loop-guard-runtime` doğrudan kullanın.

## Runtime namespace'leri

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent kimliği, dizinler ve session yönetimi.

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

    `runEmbeddedAgent(...)`, Plugin kodundan normal bir OpenClaw agent turn'ü başlatmak için nötr yardımcıdır. Kanal tetikli yanıtlarla aynı provider/model çözümlemesini ve agent harness seçimini kullanır.

    `runEmbeddedPiAgent(...)`, mevcut Plugin'ler için kullanımdan kaldırılmış bir uyumluluk alias'ı olarak kalır. Yeni kod `runEmbeddedAgent(...)` kullanmalıdır.

    `resolveThinkingPolicy(...)`, provider/model'in desteklediği thinking level'ları ve isteğe bağlı varsayılanı döndürür. Provider Plugin'leri modele özgü profile thinking hook'ları üzerinden sahip olduğundan, tool Plugin'leri provider listelerini içe aktarmak veya çoğaltmak yerine bu runtime yardımcısını çağırmalıdır.

    `normalizeThinkingLevel(...)`, `on`, `x-high` veya `extra high` gibi kullanıcı metnini çözümlenmiş politikaya göre kontrol etmeden önce canonical saklanan seviyeye dönüştürür.

    **Session store yardımcıları** `api.runtime.agent.session` altındadır:

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

    Session iş akışları için `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` veya `upsertSessionEntry(...)` tercih edin. Bu yardımcılar session'ları agent/session kimliğiyle adresler, böylece Plugin'ler legacy `sessions.json` depolama şekline bağlı kalmaz. Session activity'sini yenilememesi gereken yalnızca metadata patch'leri için `preserveActivity: true` kullanın; `replaceEntry: true` yalnızca callback eksiksiz bir entry döndürdüğünde ve silinen alanlar silinmiş kalması gerektiğinde kullanılmalıdır.

    Transcript okuma ve yazmaları için `openclaw/plugin-sdk/session-transcript-runtime` içe aktarın ve `{ agentId, sessionKey, sessionId }` ile `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` veya `withSessionTranscriptWriteLock(...)` kullanın. Bu API'ler Plugin'lerin bir transcript'i tanımlamasına, event'lerini okumasına, iletiler eklemesine, güncellemeler yayınlamasına ve ilgili işlemleri aynı transcript yazma kilidi altında çalıştırmasına izin verir. `sessionFile` yalnızca zaten etkin bir transcript artifact'i alan ve her yardımcının aynı artifact üzerinde işlem yapmasına ihtiyaç duyan kodu uyarlarken geçirin.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)` ve `resolveSessionFilePath(...)`, hâlâ bilerek legacy bütün-store veya transcript-file şekline bağlı olan Plugin'ler için uyumluluk yardımcılarıdır. Yeni Plugin kodu bu yardımcıları kullanmamalı ve mevcut çağıranlar entry yardımcılarına taşınmalıdır.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Varsayılan model ve provider sabitleri:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Provider iç bileşenlerini içe aktarmadan veya
    OpenClaw model/auth/base URL hazırlığını çoğaltmadan host'a ait bir text completion çalıştırın.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Yardımcı, OpenClaw'ın
    yerleşik runtime'ı ve host'a ait runtime config snapshot'ı ile aynı simple-completion hazırlık yolunu kullanır. Context engine'leri
    session'a bağlı bir `llm.complete` capability'si alır, böylece model çağrıları
    etkin session'ın agent'ını kullanır ve sessizce varsayılan agent'a fallback yapmaz. Sonuç, mevcut olduğunda normalleştirilmiş token,
    cache ve tahmini maliyet kullanımıyla birlikte provider/model/agent atfını içerir.

    <Warning>
    Model geçersiz kılmaları config içinde `plugins.entries.<id>.llm.allowModelOverride: true` üzerinden operatör opt-in'i gerektirir. Güvenilir Plugin'leri belirli canonical `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.llm.allowedModels` kullanın. Agent'lar arası completion'lar `plugins.entries.<id>.llm.allowAgentIdOverride: true` gerektirir.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Arka plan subagent çalıştırmalarını başlatın ve yönetin.

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
    Model geçersiz kılmaları (`provider`/`model`), yapılandırmada `plugins.entries.<id>.subagent.allowModelOverride: true` ile operatörün etkinleştirmesini gerektirir. Güvenilmeyen Plugin'ler yine de alt ajanları çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
    </Warning>

    `deleteSession(...)`, aynı Plugin tarafından `api.runtime.subagent.run(...)` aracılığıyla oluşturulan oturumları silebilir. Herhangi bir kullanıcı veya operatör oturumunu silmek yine de yönetici kapsamlı bir Gateway isteği gerektirir.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gateway tarafından yüklenen Plugin kodundan veya Plugin CLI komutlarından bağlı düğümleri listeleyin ve bir düğüm ana makine komutu çağırın. Bunu, bir Plugin eşleştirilmiş bir cihazda yerel işi sahiplendiğinde kullanın; örneğin başka bir Mac üzerindeki tarayıcı veya ses köprüsü.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway içinde bu çalışma zamanı süreç içindedir. Plugin CLI komutlarında yapılandırılmış Gateway'i RPC üzerinden çağırır; böylece `openclaw googlemeet recover-tab` gibi komutlar terminalden eşleştirilmiş düğümleri inceleyebilir. Düğüm komutları yine de normal Gateway düğüm eşleştirmesinden, komut izin listelerinden, Plugin düğüm çağırma ilkelerinden ve düğüm yerel komut işleme sürecinden geçer.

    Tehlikeli düğüm ana makine komutları sunan Plugin'ler, `api.registerNodeInvokePolicy(...)` ile bir düğüm çağırma ilkesi kaydetmelidir. İlke, Gateway içinde komut izin listesi kontrollerinden sonra ve komut düğüme iletilmeden önce çalışır; böylece doğrudan `node.invoke` çağrıları ve daha üst düzey Plugin araçları aynı uygulama yolunu paylaşır.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bir Görev Akışı çalışma zamanını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç bağlamına bağlayın, ardından her çağrıda sahip iletmeden Görev Akışları oluşturup yönetin.

    Görev Akışı kalıcı çok adımlı iş akışı durumunu izler. Bu bir zamanlayıcı değildir:
    gelecekteki uyandırmalar için Cron veya `api.session.workflow.scheduleSessionTurn(...)`
    kullanın, ardından bu iş akış durumu, alt görevler, beklemeler veya iptal gerektirdiğinde
    zamanlanmış turdan `managedFlows` kullanın.

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

    Kendi bağlama katmanınızdan güvenilir bir OpenClaw oturum anahtarınız zaten varsa `bindSession({ sessionKey, requesterOrigin })` kullanın. Ham kullanıcı girdisinden bağlama yapmayın.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Metinden konuşmaya sentezi.

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

    Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır. PCM ses arabelleği + örnekleme hızı döndürür.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Görüntü, ses ve video analizi.

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

    Çıktı üretilmediğinde (ör. atlanan girdi) `{ text: undefined }` döndürür.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`, `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` için uyumluluk takma adı olarak kalır.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Görüntü oluşturma.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Web araması.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Düşük düzey medya yardımcıları.

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
    Geçerli çalışma zamanı yapılandırma anlık görüntüsü ve işlemsel yapılandırma yazımları. Etkin çağrı yoluna zaten iletilmiş yapılandırmayı tercih edin; `current()` yalnızca işleyicinin süreç anlık görüntüsüne doğrudan ihtiyaç duyduğu durumlarda kullanın.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` ve `replaceConfigFile(...)` bir `followUp`
    değeri döndürür; örneğin `{ mode: "restart", requiresRestart: true, reason }`.
    Bu değer, yeniden başlatma denetimini gateway'den almadan yazar niyetini kaydeder.

  </Accordion>
  <Accordion title="api.runtime.system">
    Sistem düzeyi yardımcılar.

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

    `runCommandWithTimeout(...)`, yakalanan `stdout` ve `stderr`, isteğe bağlı
    kesme sayıları, `code`, `signal`, `killed`, `termination` ve
    `noOutputTimedOut` döndürür. Zaman aşımı ve çıktı olmama zaman aşımı sonuçları,
    alt süreç sıfır olmayan bir çıkış kodu sağlamadığında `code: 124` bildirir.
    Zaman aşımı olmayan sinyal çıkışları yine de `code: null` döndürebilir; bu yüzden
    zaman aşımı nedenlerini ayırt etmek için `termination` ve `noOutputTimedOut` kullanın.

  </Accordion>
  <Accordion title="api.runtime.events">
    Olay abonelikleri.

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
    Günlükleme.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Model ve sağlayıcı kimlik doğrulama çözümlemesi.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Durum dizini çözümlemesi ve SQLite destekli anahtarlı depolama.

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

    Anahtarlı depolar yeniden başlatmalardan sonra korunur ve çalışma zamanına bağlı Plugin kimliğine göre yalıtılır. Atomik yinelenen kayıt önleme talepleri için `registerIfAbsent(...)` kullanın: anahtar eksik ya da süresi dolmuş olup kaydedildiğinde `true`, canlı bir değer zaten mevcut olduğunda ise değerini, oluşturulma zamanını veya TTL değerini üzerine yazmadan `false` döndürür. Sınırlar: ad alanı başına `maxEntries`, Plugin başına 6.000 canlı satır, 64 KB altındaki JSON değerleri ve isteğe bağlı TTL sona ermesi. Bir yazma işlemi Plugin satır üst sınırını aşacaksa çalışma zamanı, yazılan ad alanındaki en eski canlı satırları çıkarabilir; kardeş ad alanları bu yazma için çıkarılmaz ve ad alanı yeterli satır boşaltamazsa yazma yine başarısız olur.

    <Warning>
    Bu sürümde yalnızca paketle gelen Plugin'ler.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Bellek aracı fabrikaları ve CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanala özgü çalışma zamanı yardımcıları (bir kanal Plugin'i yüklendiğinde kullanılabilir).

    `api.runtime.channel.media`, kanal medyası indirmeleri ve depolama için tercih edilen yüzeydir:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Uzak bir URL OpenClaw medyasına dönüşmesi gerektiğinde `saveRemoteMedia(...)` kullanın. Plugin, Plugin'e ait kimlik doğrulama, yönlendirme veya izin listesi işleme ile bir `Response` zaten getirdiyse `saveResponseMedia(...)` kullanın. `readRemoteMediaBuffer(...)` yalnızca Plugin'in inceleme, dönüştürme, şifre çözme veya yeniden yükleme için ham baytlara ihtiyaç duyması halinde kullanın. `fetchRemoteMedia(...)`, `readRemoteMediaBuffer(...)` için kullanımdan kaldırılmış bir uyumluluk takma adı olarak kalır.

    `api.runtime.channel.mentions`, çalışma zamanı enjeksiyonu kullanan paketle gelen kanal Plugin'leri için paylaşılan gelen bahsetme ilkesi yüzeyidir:

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

    Kullanılabilir bahsetme yardımcıları:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions`, eski `resolveMentionGating*` uyumluluk yardımcılarını bilerek kullanıma sunmaz. Normalleştirilmiş `{ facts, policy }` yolunu tercih edin.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı başvurularını depolama

`register` geri çağrısı dışında kullanmak üzere çalışma zamanı başvurusunu depolamak için `createPluginRuntimeStore` kullanın:

<Steps>
  <Step title="Depoyu oluşturun">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Giriş noktasına bağlayın">
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
  <Step title="Diğer dosyalardan erişin">
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
Çalışma zamanı deposu kimliği için `pluginId` değerini tercih edin. Daha düşük seviyeli `key` biçimi, bir Plugin'in bilerek birden fazla çalışma zamanı yuvasına ihtiyaç duyduğu yaygın olmayan durumlar içindir.
</Note>

## Diğer üst düzey `api` alanları

`api.runtime` dışında API nesnesi ayrıca şunları sağlar:

<ParamField path="api.id" type="string">
  Plugin kimliği.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin görüntü adı.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` üzerinden Plugin'e özgü yapılandırma.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Geçerli yükleme modu; `"setup-runtime"` hafif, tam giriş öncesi başlatma/kurulum penceresidir.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin köküne göre göreli bir yolu çözümleyin.
</ParamField>

## İlgili

- [Plugin iç yapıları](/tr/plugins/architecture) — yetenek modeli ve kayıt defteri
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` seçenekleri
- [SDK genel bakışı](/tr/plugins/sdk-overview) — alt yol başvurusu
