---
read_when:
    - Bir Plugin'den çekirdek yardımcıları çağırmanız gerekir (TTS, STT, görüntü oluşturma, web araması, alt ajan, düğümler)
    - api.runtime öğesinin neleri sunduğunu anlamak istiyorsunuz
    - Yapılandırma, ajan veya medya yardımcılarına Plugin kodundan erişiyorsunuz
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin'lerin kullanabildiği enjekte edilen çalışma zamanı yardımcıları
title: Plugin çalışma zamanı yardımcıları
x-i18n:
    generated_at: "2026-06-28T20:44:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Kayıt sırasında her Plugin'e enjekte edilen `api.runtime` nesnesi için başvuru. Host iç öğelerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" href="/tr/plugins/sdk-channel-plugins">
    Kanal Plugin'leri için bu yardımcıları bağlam içinde kullanan adım adım kılavuz.
  </Card>
  <Card title="Sağlayıcı Plugin'leri" href="/tr/plugins/sdk-provider-plugins">
    Sağlayıcı Plugin'leri için bu yardımcıları bağlam içinde kullanan adım adım kılavuz.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Yapılandırma yükleme ve yazma

Etkin çağrı yoluna zaten geçirilmiş yapılandırmayı tercih edin; örneğin kayıt sırasında `api.config` veya kanal/sağlayıcı geri çağrılarında bir `cfg` argümanı. Bu, sıcak yollarda yapılandırmayı yeniden ayrıştırmak yerine tek bir süreç anlık görüntüsünün iş boyunca akmasını sağlar.

`api.runtime.config.current()` yalnızca uzun ömürlü bir işleyicinin mevcut süreç anlık görüntüsüne ihtiyaç duyduğu ve o işleve yapılandırma geçirilmediği durumlarda kullanın. Döndürülen değer salt okunurdur; düzenlemeden önce klonlayın veya bir mutasyon yardımcısı kullanın.

Araç fabrikaları `ctx.runtimeConfig` ve `ctx.getRuntimeConfig()` alır. Yapılandırma, araç tanımı oluşturulduktan sonra değişebiliyorsa getter'ı uzun ömürlü bir aracın `execute` geri çağrısı içinde kullanın.

Değişiklikleri `api.runtime.config.mutateConfigFile(...)` veya `api.runtime.config.replaceConfigFile(...)` ile kalıcı hale getirin. Her yazma açık bir `afterWrite` politikası seçmelidir:

- `afterWrite: { mode: "auto" }`, gateway yeniden yükleme planlayıcısının karar vermesini sağlar.
- `afterWrite: { mode: "restart", reason: "..." }`, yazar sıcak yeniden yüklemenin güvenli olmadığını bildiğinde temiz bir yeniden başlatmayı zorlar.
- `afterWrite: { mode: "none", reason: "..." }`, otomatik yeniden yükleme/yeniden başlatmayı yalnızca çağıran taraf takip adımına sahip olduğunda bastırır.

Mutasyon yardımcıları, çağıranların yeniden başlatma isteyip istemediklerini günlüğe kaydedebilmesi veya test edebilmesi için `afterWrite` ile birlikte tipli bir `followUp` özeti döndürür. Yeniden başlatmanın gerçekten ne zaman gerçekleşeceğinin sahibi yine gateway'dir.

`api.runtime.config.loadConfig()` ve `api.runtime.config.writeConfigFile(...)`, `runtime-config-load-write` altındaki kullanımdan kaldırılmış uyumluluk yardımcılarıdır. Çalışma zamanında bir kez uyarı verirler ve geçiş penceresi boyunca eski harici Plugin'ler için kullanılabilir kalırlar. Paketli Plugin'ler bunları kullanmamalıdır; Plugin kodu bunları çağırırsa veya bu yardımcıları Plugin SDK alt yollarından içe aktarırsa yapılandırma sınırı korumaları başarısız olur.

Doğrudan SDK içe aktarmaları için geniş `openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ı yerine odaklanmış yapılandırma alt yollarını kullanın: tipler için `config-contracts`, zaten yüklenmiş yapılandırma doğrulamaları ve Plugin giriş araması için `plugin-config-runtime`, mevcut süreç anlık görüntüleri için `runtime-config-snapshot` ve yazmalar için `config-mutation`. Paketli Plugin testleri, geniş uyumluluk barrel'ını mock'lamak yerine bu odaklanmış alt yolları doğrudan mock'lamalıdır.

Dahili OpenClaw çalışma zamanı kodu için yön aynıdır: yapılandırmayı CLI, gateway veya süreç sınırında bir kez yükleyin, sonra bu değeri iletin. Başarılı mutasyon yazmaları süreç çalışma zamanı anlık görüntüsünü yeniler ve dahili revizyonunu ilerletir; uzun ömürlü önbellekler, yapılandırmayı yerel olarak serileştirmek yerine çalışma zamanının sahip olduğu önbellek anahtarını temel almalıdır. Uzun ömürlü çalışma zamanı modüllerinde ortamdan `loadConfig()` çağrılarına sıfır toleranslı bir tarayıcı vardır; geçirilmiş bir `cfg`, bir istek `context.getRuntimeConfig()` veya açık bir süreç sınırında `getRuntimeConfig()` kullanın.

Sağlayıcı ve kanal yürütme yolları, yapılandırma geri okuması veya düzenleme için döndürülen dosya anlık görüntüsünü değil, etkin çalışma zamanı yapılandırma anlık görüntüsünü kullanmalıdır. Dosya anlık görüntüleri, UI ve yazmalar için SecretRef işaretleri gibi kaynak değerleri korur; sağlayıcı geri çağrılarının çözümlenmiş çalışma zamanı görünümüne ihtiyacı vardır. Bir yardımcı etkin kaynak anlık görüntüsü veya etkin çalışma zamanı anlık görüntüsü ile çağrılabiliyorsa, kimlik bilgilerini okumadan önce `selectApplicableRuntimeConfig()` üzerinden yönlendirin.

## Yeniden kullanılabilir çalışma zamanı yardımcıları

Bot tarafından yazılmış gelen mesajlar için gelen `botLoopProtection` olgularını kullanın. Core, politikayı tek bir kanala bağlamadan, oturum kaydı ve dispatch öncesinde paylaşılan bellek içi kayan pencere korumasını uygular. Koruma `(scopeId, conversationId, participant pair)` anahtarlarını izler, bir çiftin iki yönünü birlikte sayar, pencere bütçesi aşıldığında bir bekleme süresi uygular ve etkin olmayan girdileri fırsat buldukça budar.

Bu davranışı operatörlere sunan kanal Plugin'leri, temel bütçeler için paylaşılan `channels.defaults.botLoopProtection` şeklini tercih etmeli, sonra kanal/sağlayıcıya özel geçersiz kılmaları bunun üzerine katmanlamalıdır. Paylaşılan yapılandırma kullanıcıya dönük olduğu için saniye kullanır:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Çözümlenmiş turn ile normalize edilmiş bot çifti olgularını geçirin. Core varsayılanları, birim dönüşümünü ve `enabled` semantiğini çözümler:

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

`openclaw/plugin-sdk/pair-loop-guard-runtime` öğesini doğrudan yalnızca paylaşılan gelen yanıt çalıştırıcısından geçmeyen özel iki taraflı olay döngüleri için kullanın.

## Çalışma zamanı ad alanları

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent kimliği, dizinleri ve oturum yönetimi.

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

    `runEmbeddedAgent(...)`, Plugin kodundan normal bir OpenClaw agent turn'ü başlatmak için tarafsız yardımcıdır. Kanal tetiklemeli yanıtlarla aynı sağlayıcı/model çözümlemesini ve agent harness seçimini kullanır.

    `runEmbeddedPiAgent(...)`, mevcut Plugin'ler için kullanımdan kaldırılmış bir uyumluluk takma adı olarak kalır. Yeni kod `runEmbeddedAgent(...)` kullanmalıdır.

    `resolveThinkingPolicy(...)`, sağlayıcı/model tarafından desteklenen düşünme seviyelerini ve isteğe bağlı varsayılanı döndürür. Sağlayıcı Plugin'leri, modele özgü profilin sahibi olan thinking hook'ları üzerinden yönetir; bu nedenle araç Plugin'leri sağlayıcı listelerini içe aktarmak veya çoğaltmak yerine bu çalışma zamanı yardımcısını çağırmalıdır.

    `normalizeThinkingLevel(...)`, `on`, `x-high` veya `extra high` gibi kullanıcı metnini çözümlenmiş politikaya karşı kontrol etmeden önce kanonik saklanan seviyeye dönüştürür.

    **Oturum deposu yardımcıları** `api.runtime.agent.session` altındadır:

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

    Oturum iş akışları için `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` veya `upsertSessionEntry(...)` tercih edin. Bu yardımcılar oturumları agent/oturum kimliğine göre adresler, böylece Plugin'ler eski `sessions.json` depolama şekline bağımlı olmaz. Oturum etkinliğini yenilememesi gereken yalnızca metadata yamaları için `preserveActivity: true`, yalnızca geri çağrı eksiksiz bir girdi döndürdüğünde ve silinen alanlar silinmiş kalması gerektiğinde `replaceEntry: true` kullanın.

    Transcript okuma ve yazmaları için `openclaw/plugin-sdk/session-transcript-runtime` öğesini içe aktarın ve `{ agentId, sessionKey, sessionId }` ile `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` veya `withSessionTranscriptWriteLock(...)` kullanın. Bu API'ler Plugin'lerin bir transcript'i tanımlamasına, olaylarını okumasına, mesaj eklemesine, güncellemeler yayımlamasına ve ilgili işlemleri aynı transcript yazma kilidi altında çalıştırmasına olanak tanır. `sessionFile` geçirmek, `resolveSessionTranscriptLegacyFileTarget(...)` kullanmak veya `openclaw/plugin-sdk/agent-harness-runtime` içinden düşük seviyeli `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` içe aktarmak kullanımdan kaldırılmıştır; bu yollar yalnızca zaten etkin bir transcript artifact'i alan eski kod için vardır.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` ve `resolveAndPersistSessionFile(...)`, hâlâ bilinçli olarak eski tüm depo veya transcript dosyası şekline bağımlı olan Plugin'ler için kullanımdan kaldırılmış uyumluluk yardımcılarıdır. Yeni Plugin kodu bu yardımcıları kullanmamalıdır ve mevcut çağıranlar giriş yardımcılarına ve transcript kimliği yardımcılarına geçmelidir.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Varsayılan model ve sağlayıcı sabitleri:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Sağlayıcı iç öğelerini içe aktarmadan veya OpenClaw model/auth/base URL hazırlığını çoğaltmadan host sahipliğinde bir metin tamamlama çalıştırın.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Yardımcı, OpenClaw'ın yerleşik çalışma zamanı ile aynı basit tamamlama hazırlama yolunu ve host sahipliğindeki çalışma zamanı yapılandırma anlık görüntüsünü kullanır. Bağlam motorları oturuma bağlı bir `llm.complete` yeteneği alır; böylece model çağrıları etkin oturumun agent'ını kullanır ve sessizce varsayılan agent'a geri dönmez. Sonuç, sağlayıcı/model/agent atfının yanı sıra mevcut olduğunda normalize edilmiş token, önbellek ve tahmini maliyet kullanımını içerir.

    <Warning>
    Model geçersiz kılmaları, yapılandırmada `plugins.entries.<id>.llm.allowModelOverride: true` üzerinden operatör onayı gerektirir. Güvenilen Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlandırmak için `plugins.entries.<id>.llm.allowedModels` kullanın. Agent'lar arası tamamlamalar `plugins.entries.<id>.llm.allowAgentIdOverride: true` gerektirir.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Arka plan subagent çalışmalarını başlatın ve yönetin.

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
    Model geçersiz kılmaları (`provider`/`model`), yapılandırmada `plugins.entries.<id>.subagent.allowModelOverride: true` üzerinden operatörün etkinleştirmesini gerektirir. Güvenilmeyen Plugin'ler yine de alt ajan çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
    </Warning>

    `deleteSession(...)`, aynı Plugin tarafından `api.runtime.subagent.run(...)` aracılığıyla oluşturulan oturumları silebilir. Rastgele kullanıcı veya operatör oturumlarını silmek yine de admin kapsamlı bir Gateway isteği gerektirir.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Bağlı Node'ları listeleyin ve Gateway tarafından yüklenen Plugin kodundan veya Plugin CLI komutlarından Node barındırıcılı bir komutu çağırın. Bunu, bir Plugin eşleştirilmiş bir cihazda yerel işi sahiplendiğinde kullanın; örneğin başka bir Mac üzerindeki tarayıcı veya ses köprüsü.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway içinde bu çalışma zamanı süreç içindedir. Plugin CLI komutlarında yapılandırılmış Gateway'i RPC üzerinden çağırır; böylece `openclaw googlemeet recover-tab` gibi komutlar terminalden eşleştirilmiş Node'ları inceleyebilir. Node komutları yine de normal Gateway Node eşleştirmesinden, komut izin listelerinden, Plugin Node çağırma politikalarından ve Node-yerel komut işlemeden geçer.

    Tehlikeli Node barındırıcılı komutları açığa çıkaran Plugin'ler, `api.registerNodeInvokePolicy(...)` ile bir Node çağırma politikası kaydetmelidir. Politika, Gateway içinde komut izin listesi kontrollerinden sonra ve komut Node'a iletilmeden önce çalışır; bu nedenle doğrudan `node.invoke` çağrıları ve daha üst düzey Plugin araçları aynı zorunlu uygulama yolunu paylaşır.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bir Task Flow çalışma zamanını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç bağlamına bağlayın, ardından her çağrıda sahip geçmeden Task Flow'lar oluşturup yönetin.

    Task Flow, kalıcı çok adımlı iş akışı durumunu izler. Bir zamanlayıcı değildir:
    gelecekteki uyandırmalar için Cron veya `api.session.workflow.scheduleSessionTurn(...)` kullanın,
    ardından bu iş akışı durumu, alt görevler, beklemeler veya iptal gerektirdiğinde
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

    Kendi bağlama katmanınızdan zaten güvenilir bir OpenClaw oturum anahtarınız olduğunda `bindSession({ sessionKey, requesterOrigin })` kullanın. Ham kullanıcı girdisinden bağlama yapmayın.

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

    Hiçbir çıktı üretilmediğinde (ör. atlanan girdi) `{ text: undefined }` döndürür.

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
    Düşük seviyeli medya yardımcıları.

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
    Geçerli çalışma zamanı yapılandırma anlık görüntüsü ve işlemsel yapılandırma yazımları. Etkin çağrı yoluna zaten geçirilmiş yapılandırmayı tercih edin; `current()` öğesini yalnızca işleyicinin süreç anlık görüntüsüne doğrudan ihtiyaç duyması halinde kullanın.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` ve `replaceConfigFile(...)`, örneğin `{ mode: "restart", requiresRestart: true, reason }` gibi bir `followUp` değeri döndürür; bu değer, yeniden başlatma denetimini Gateway'den almadan yazıcının niyetini kaydeder.

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

    `runCommandWithTimeout(...)` yakalanan `stdout` ve `stderr`, isteğe bağlı kesme sayıları, `code`, `signal`, `killed`, `termination` ve `noOutputTimedOut` döndürür. Zaman aşımı ve çıktısız zaman aşımı sonuçları, alt süreç sıfır olmayan bir çıkış kodu sağlamadığında `code: 124` bildirir. Zaman aşımı olmayan sinyal çıkışları yine de `code: null` döndürebilir; bu nedenle zaman aşımı nedenlerini ayırt etmek için `termination` ve `noOutputTimedOut` kullanın.

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

    Anahtarlı depolar yeniden başlatmalardan sonra korunur ve çalışma zamanına bağlı Plugin kimliğine göre yalıtılır. Atomik tekilleştirme talepleri için `registerIfAbsent(...)` kullanın: anahtar yoksa veya süresi dolmuşsa ve kaydedildiyse `true`, canlı bir değer zaten varsa değerini, oluşturulma zamanını veya TTL değerini üzerine yazmadan `false` döndürür. Sınırlar: ad alanı başına `maxEntries`, Plugin başına 6.000 canlı satır, 64KB altındaki JSON değerleri ve isteğe bağlı TTL süre sonu. Bir yazma işlemi Plugin satır üst sınırını aşacaksa çalışma zamanı, yazılan ad alanındaki en eski canlı satırları çıkarabilir; kardeş ad alanları bu yazma için çıkarılmaz ve ad alanı yeterli satırı boşaltamazsa yazma yine başarısız olur.

    <Warning>
    Bu sürümde yalnızca paketlenmiş Plugin'ler.
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

    `api.runtime.channel.media`, kanal medyası indirmeleri ve depolaması için tercih edilen yüzeydir:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Uzak bir URL'nin OpenClaw medyası haline gelmesi gerektiğinde `saveRemoteMedia(...)` kullanın. Plugin, Plugin'e ait kimlik doğrulama, yönlendirme veya izin listesi işlemesiyle bir `Response` değerini zaten getirdiyse `saveResponseMedia(...)` kullanın. `readRemoteMediaBuffer(...)` yalnızca Plugin'in inceleme, dönüştürme, şifre çözme veya yeniden yükleme için ham baytlara ihtiyaç duyduğu durumlarda kullanılmalıdır. `fetchRemoteMedia(...)`, `readRemoteMediaBuffer(...)` için kullanımdan kaldırılmış bir uyumluluk takma adı olarak kalır.

    `api.runtime.channel.mentions`, çalışma zamanı enjeksiyonu kullanan paketlenmiş kanal Plugin'leri için paylaşılan gelen bahsetme ilkesi yüzeyidir:

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

    `api.runtime.channel.mentions`, eski `resolveMentionGating*` uyumluluk yardımcılarını kasıtlı olarak açığa çıkarmaz. Normalleştirilmiş `{ facts, policy }` yolunu tercih edin.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı referanslarını depolama

`register` geri çağrısı dışında kullanmak üzere çalışma zamanı referansını depolamak için `createPluginRuntimeStore` kullanın:

<Steps>
  <Step title="Depoyu oluştur">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Giriş noktasına bağla">
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
  <Step title="Diğer dosyalardan eriş">
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
Çalışma zamanı deposu kimliği için `pluginId` tercih edin. Daha düşük seviyeli `key` biçimi, bir Plugin'in kasıtlı olarak birden fazla çalışma zamanı yuvasına ihtiyaç duyduğu yaygın olmayan durumlar içindir.
</Note>

## Diğer üst düzey `api` alanları

`api.runtime` dışında API nesnesi şunları da sağlar:

<ParamField path="api.id" type="string">
  Plugin kimliği.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin görünen adı.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Geçerli yapılandırma anlık görüntüsü (kullanılabilir olduğunda etkin bellek içi çalışma zamanı anlık görüntüsü).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` içinden Plugin'e özgü yapılandırma.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Geçerli yükleme modu; `"setup-runtime"` hafif, tam giriş öncesi başlatma/kurulum penceresidir.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin köküne göreli bir yolu çözümle.
</ParamField>

## İlgili

- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli ve kayıt defteri
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` seçenekleri
- [SDK genel bakışı](/tr/plugins/sdk-overview) — alt yol referansı
