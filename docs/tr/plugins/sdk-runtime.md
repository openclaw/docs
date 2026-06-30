---
read_when:
    - Bir Plugin içinden çekirdek yardımcılarını çağırmanız gerekiyor (TTS, STT, görsel oluşturma, web araması, alt ajan, düğümler)
    - api.runtime'ın neleri sunduğunu anlamak istiyorsunuz
    - Plugin kodundan yapılandırma, ajan veya medya yardımcılarına erişiyorsunuz
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin'ler tarafından kullanılabilen enjekte edilmiş çalışma zamanı yardımcıları
title: Plugin çalışma zamanı yardımcıları
x-i18n:
    generated_at: "2026-06-30T14:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Her Plugin'e kayıt sırasında enjekte edilen `api.runtime` nesnesi için referans. Host iç bileşenlerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/tr/plugins/sdk-channel-plugins">
    Kanal Plugin'leri için bu yardımcıları bağlam içinde kullanan adım adım kılavuz.
  </Card>
  <Card title="Provider plugins" href="/tr/plugins/sdk-provider-plugins">
    Sağlayıcı Plugin'leri için bu yardımcıları bağlam içinde kullanan adım adım kılavuz.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Yapılandırma yükleme ve yazmalar

Etkin çağrı yoluna zaten geçirilmiş yapılandırmayı tercih edin; örneğin kayıt sırasında `api.config` veya kanal/sağlayıcı geri çağırmalarında bir `cfg` argümanı. Bu, sıcak yollarda yapılandırmayı yeniden ayrıştırmak yerine tek bir süreç anlık görüntüsünün iş boyunca akmasını sağlar.

`api.runtime.config.current()` öğesini yalnızca uzun ömürlü bir işleyicinin geçerli süreç anlık görüntüsüne ihtiyaç duyduğu ve o işleve hiçbir yapılandırmanın geçirilmediği durumlarda kullanın. Döndürülen değer salt okunurdur; düzenlemeden önce kopyalayın veya bir mutasyon yardımcısı kullanın.

Araç fabrikaları `ctx.runtimeConfig` ile birlikte `ctx.getRuntimeConfig()` alır. Yapılandırma araç tanımı oluşturulduktan sonra değişebiliyorsa getter'ı uzun ömürlü bir aracın `execute` geri çağırması içinde kullanın.

Değişiklikleri `api.runtime.config.mutateConfigFile(...)` veya `api.runtime.config.replaceConfigFile(...)` ile kalıcı hale getirin. Her yazma açık bir `afterWrite` politikası seçmelidir:

- `afterWrite: { mode: "auto" }`, Gateway yeniden yükleme planlayıcısının karar vermesini sağlar.
- `afterWrite: { mode: "restart", reason: "..." }`, yazıcı sıcak yeniden yüklemenin güvenli olmadığını bildiğinde temiz bir yeniden başlatmayı zorunlu kılar.
- `afterWrite: { mode: "none", reason: "..." }`, otomatik yeniden yükleme/yeniden başlatmayı yalnızca çağıran taraf takip işleminin sahibiyse bastırır.

Mutasyon yardımcıları `afterWrite` ile birlikte tiplenmiş bir `followUp` özeti döndürür; böylece çağıranlar yeniden başlatma isteyip istemediklerini günlüğe yazabilir veya test edebilir. Yeniden başlatmanın gerçekte ne zaman gerçekleşeceğinin sahibi yine Gateway'dir.

`api.runtime.config.loadConfig()` ve `api.runtime.config.writeConfigFile(...)`, `runtime-config-load-write` altındaki kullanımdan kaldırılmış uyumluluk yardımcılarıdır. Çalışma zamanında bir kez uyarı verirler ve geçiş dönemi boyunca eski harici Plugin'ler için kullanılabilir kalırlar. Paketli Plugin'ler bunları kullanmamalıdır; Plugin kodu bunları çağırırsa veya bu yardımcıları Plugin SDK alt yollarından içe aktarırsa yapılandırma sınırı korumaları başarısız olur.

Doğrudan SDK içe aktarmaları için geniş
`openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ı yerine odaklı yapılandırma alt yollarını kullanın: tipler için `config-contracts`, zaten yüklenmiş yapılandırma doğrulamaları ve Plugin giriş araması için `plugin-config-runtime`, geçerli süreç anlık görüntüleri için `runtime-config-snapshot` ve yazmalar için `config-mutation`. Paketli Plugin testleri, geniş uyumluluk barrel'ını taklit etmek yerine bu odaklı alt yolları doğrudan taklit etmelidir.

Dahili OpenClaw çalışma zamanı kodu için de yön aynıdır: yapılandırmayı CLI, Gateway veya süreç sınırında bir kez yükleyin, sonra bu değeri aktarın. Başarılı mutasyon yazmaları süreç çalışma zamanı anlık görüntüsünü yeniler ve iç revizyonunu ilerletir; uzun ömürlü önbellekler yapılandırmayı yerel olarak serileştirmek yerine çalışma zamanına ait önbellek anahtarını temel almalıdır. Uzun ömürlü çalışma zamanı modüllerinde ortamdan `loadConfig()` çağrılarına sıfır toleranslı bir tarayıcı vardır; geçirilmiş bir `cfg`, istek `context.getRuntimeConfig()` veya açık bir süreç sınırında `getRuntimeConfig()` kullanın.

Sağlayıcı ve kanal yürütme yolları, yapılandırma geri okuması veya düzenleme için döndürülen bir dosya anlık görüntüsünü değil, etkin çalışma zamanı yapılandırma anlık görüntüsünü kullanmalıdır. Dosya anlık görüntüleri UI ve yazmalar için SecretRef işaretçileri gibi kaynak değerlerini korur; sağlayıcı geri çağırmaları çözümlenmiş çalışma zamanı görünümüne ihtiyaç duyar. Bir yardımcı etkin kaynak anlık görüntüsü veya etkin çalışma zamanı anlık görüntüsü ile çağrılabiliyorsa, kimlik bilgilerini okumadan önce `selectApplicableRuntimeConfig()` üzerinden yönlendirin.

## Yeniden kullanılabilir çalışma zamanı yardımcıları

Bot tarafından yazılmış gelen mesajlar için gelen `botLoopProtection` bilgilerini kullanın. Core, paylaşılan bellek içi kayan pencere korumasını oturum kaydından ve dağıtımdan önce, politikayı tek bir kanala bağlamadan uygular. Koruma `(scopeId, conversationId, participant pair)` anahtarlarını izler, bir çiftin iki yönünü birlikte sayar, pencere bütçesi aşıldığında bekleme süresi uygular ve etkin olmayan girişleri fırsatçı olarak budar.

Bu davranışı operatörlere sunan kanal Plugin'leri, temel bütçeler için paylaşılan `channels.defaults.botLoopProtection` şeklini tercih etmeli, ardından kanal/sağlayıcıya özgü geçersiz kılmaları bunun üzerine katmanlamalıdır. Paylaşılan yapılandırma kullanıcıya dönük olduğu için saniye kullanır:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Çözümlenmiş dönüşle birlikte normalize edilmiş bot çifti bilgilerini geçirin. Core varsayılanları, birim dönüşümünü ve `enabled` semantiğini çözümler:

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
iki taraflı olay döngüleri için yalnızca `openclaw/plugin-sdk/pair-loop-guard-runtime` öğesini doğrudan kullanın.

## Çalışma zamanı ad alanları

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Ajan kimliği, dizinler ve oturum yönetimi.

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

    `runEmbeddedAgent(...)`, Plugin kodundan normal bir OpenClaw ajan dönüşü başlatmak için tarafsız yardımcıdır. Kanal tarafından tetiklenen yanıtlarda kullanılan aynı sağlayıcı/model çözümlemesini ve ajan koşum takımı seçimini kullanır.

    `runEmbeddedPiAgent(...)`, mevcut Plugin'ler için kullanımdan kaldırılmış bir uyumluluk takma adı olarak kalır. Yeni kod `runEmbeddedAgent(...)` kullanmalıdır.

    `resolveThinkingPolicy(...)`, sağlayıcı/model tarafından desteklenen düşünme düzeylerini ve isteğe bağlı varsayılanı döndürür. Sağlayıcı Plugin'leri modele özgü profilin sahibidir; bu nedenle araç Plugin'leri sağlayıcı listelerini içe aktarmak veya çoğaltmak yerine bu çalışma zamanı yardımcısını çağırmalıdır.

    `normalizeThinkingLevel(...)`, `on`, `x-high` veya `extra high` gibi kullanıcı metnini, çözümlenmiş politikaya göre denetlemeden önce kanonik depolanan düzeye dönüştürür.

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

    Oturum iş akışları için `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` veya `upsertSessionEntry(...)` öğelerini tercih edin. Bu yardımcılar oturumları ajan/oturum kimliğiyle adresler; böylece Plugin'ler eski `sessions.json` depolama şekline bağımlı olmaz. Oturum etkinliğini yenilememesi gereken yalnızca meta veri yamaları için `preserveActivity: true`, yalnızca geri çağırma eksiksiz bir giriş döndürdüğünde ve silinen alanların silinmiş kalması gerektiğinde `replaceEntry: true` kullanın.

    Transkript okumaları ve yazmaları için `openclaw/plugin-sdk/session-transcript-runtime` öğesini içe aktarın ve `{ agentId, sessionKey, sessionId }` ile `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` veya `withSessionTranscriptWriteLock(...)` kullanın. Bu API'ler Plugin'lerin bir transkripti tanımlamasına, olaylarını okumasına, mesaj eklemesine, güncellemeler yayımlamasına ve ilgili işlemleri aynı transkript yazma kilidi altında çalıştırmasına olanak tanır. `sessionFile` geçirmek, `resolveSessionTranscriptLegacyFileTarget(...)` kullanmak veya düşük düzeyli `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` öğelerini `openclaw/plugin-sdk/agent-harness-runtime` üzerinden içe aktarmak kullanımdan kaldırılmıştır; bu yollar yalnızca halihazırda etkin bir transkript yapıtı alan eski kodlar için vardır.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` ve `resolveAndPersistSessionFile(...)`, hâlâ kasıtlı olarak eski bütün depo veya transkript dosyası şekline bağımlı olan Plugin'ler için kullanımdan kaldırılmış uyumluluk yardımcılarıdır. Yeni Plugin kodu bu yardımcıları kullanmamalıdır ve mevcut çağıranlar giriş yardımcılarına ve transkript kimliği yardımcılarına geçmelidir.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Varsayılan model ve sağlayıcı sabitleri:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Sağlayıcı iç bileşenlerini içe aktarmadan veya OpenClaw model/kimlik doğrulama/temel URL hazırlığını
    çoğaltmadan host'a ait bir metin tamamlama çalıştırın.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Yardımcı, OpenClaw'ın yerleşik çalışma zamanı ile aynı basit tamamlama hazırlık yolunu
    ve host'a ait çalışma zamanı yapılandırma anlık görüntüsünü kullanır. Bağlam motorları
    oturuma bağlı bir `llm.complete` yeteneği alır; böylece model çağrıları etkin oturumun
    ajanını kullanır ve sessizce varsayılan ajana geri dönmez. Sonuç, sağlayıcı/model/ajan atfının yanı sıra kullanılabiliyorsa normalize edilmiş belirteç,
    önbellek ve tahmini maliyet kullanımını içerir.

    <Warning>
    Model geçersiz kılmaları, yapılandırmada `plugins.entries.<id>.llm.allowModelOverride: true` üzerinden operatör onayı gerektirir. Güvenilir Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.llm.allowedModels` kullanın. Ajanlar arası tamamlamalar `plugins.entries.<id>.llm.allowAgentIdOverride: true` gerektirir.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Arka plan alt ajan çalışmalarını başlatın ve yönetin.

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
    Model geçersiz kılmaları (`provider`/`model`), config içinde `plugins.entries.<id>.subagent.allowModelOverride: true` aracılığıyla operatör onayı gerektirir. Güvenilmeyen plugin’ler yine subagent çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
    </Warning>

    `deleteSession(...)`, aynı plugin tarafından `api.runtime.subagent.run(...)` aracılığıyla oluşturulan oturumları silebilir. Rastgele kullanıcı veya operatör oturumlarını silmek için yine de yönetici kapsamlı bir Gateway isteği gerekir.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Bağlı Node’ları listeleyin ve Gateway tarafından yüklenen plugin kodundan veya plugin CLI komutlarından bir Node ana makine komutu çağırın. Bunu, bir plugin eşleştirilmiş bir cihazda yerel işi sahipleniyorsa kullanın; örneğin başka bir Mac’teki tarayıcı veya ses köprüsü.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway içinde bu runtime işlem içindedir. Plugin CLI komutlarında yapılandırılmış Gateway’i RPC üzerinden çağırır; böylece `openclaw googlemeet recover-tab` gibi komutlar terminalden eşleştirilmiş Node’ları inceleyebilir. Node komutları yine normal Gateway Node eşleştirmesinden, komut izin listelerinden, plugin Node çağırma politikalarından ve Node yerel komut işlemesinden geçer.

    Tehlikeli Node ana makine komutları sunan plugin’ler, `api.registerNodeInvokePolicy(...)` ile bir Node çağırma politikası kaydetmelidir. Politika Gateway’de, komut izin listesi kontrollerinden sonra ve komut Node’a iletilmeden önce çalışır; böylece doğrudan `node.invoke` çağrıları ve daha üst düzey plugin araçları aynı zorlama yolunu paylaşır.

    <Warning>
    İsteğe bağlı `scopes` alanı, çağrı için Gateway operatör kapsamları ister. OpenClaw bunu yalnızca paketlenmiş plugin’ler ve güvenilir resmi plugin kurulumları için dikkate alır; diğer plugin’lerden gelen istekler çağrının yetkisini yükseltmez. Bunu yalnızca güvenilir bir plugin’in `operator.admin` gibi daha katı bir Gateway kapsamıyla Node komutu çağırması gerektiğinde kullanın.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bir Task Flow runtime’ını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç bağlamına bağlayın; ardından her çağrıda sahip iletmeden Task Flow’lar oluşturup yönetin.

    Task Flow kalıcı çok adımlı iş akışı durumunu izler. Bir zamanlayıcı değildir:
    gelecekteki uyandırmalar için Cron veya `api.session.workflow.scheduleSessionTurn(...)`
    kullanın; ardından bu işin akış durumuna, alt görevlere, beklemelere veya iptale
    ihtiyacı olduğunda zamanlanmış dönüşten `managedFlows` kullanın.

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

    Kendi bağlama katmanınızdan zaten güvenilir bir OpenClaw oturum anahtarınız varsa `bindSession({ sessionKey, requesterOrigin })` kullanın. Ham kullanıcı girdisinden bağlama yapmayın.

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

    Hiç çıktı üretilmediğinde (ör. atlanan girdi) `{ text: undefined }` döndürür.

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
    Geçerli runtime config anlık görüntüsü ve işlemsel config yazımları. Etkin çağrı yoluna zaten iletilmiş config’i tercih edin; `current()` işleyicinin işlem anlık görüntüsüne doğrudan ihtiyaç duyduğu durumlarda kullanın.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` ve `replaceConfigFile(...)`, örneğin `{ mode: "restart", requiresRestart: true, reason }` gibi bir `followUp`
    değeri döndürür; bu değer, yeniden başlatma kontrolünü gateway’den almadan yazıcının niyetini kaydeder.

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
    kısaltma sayıları, `code`, `signal`, `killed`, `termination` ve
    `noOutputTimedOut` döndürür. Zaman aşımı ve çıktı yok zaman aşımı sonuçları,
    alt süreç sıfır olmayan bir çıkış kodu sağlamadığında `code: 124` bildirir.
    Zaman aşımı dışındaki sinyal çıkışları yine `code: null` döndürebilir; bu yüzden
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
    Model ve sağlayıcı kimlik doğrulaması çözümleme.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Durum dizini çözümleme ve SQLite destekli anahtarlı depolama.

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

    Anahtarlı depolar yeniden başlatmalardan sonra korunur ve çalışma zamanına bağlı plugin kimliğine göre yalıtılır. Atomik tekilleştirme hak talepleri için `registerIfAbsent(...)` kullanın: anahtar eksikse veya süresi dolmuşsa ve kaydedildiyse `true`, canlı bir değer zaten varsa ve değerin kendisi, oluşturma zamanı veya TTL üzerine yazılmadan `false` döndürür. Sınırlar: ad alanı başına `maxEntries`, plugin başına 6.000 canlı satır, 64 KB altı JSON değerleri ve isteğe bağlı TTL süresi dolumu. Bir yazma işlemi plugin satır sınırını aşacaksa çalışma zamanı, yazılan ad alanındaki en eski canlı satırları çıkarabilir; kardeş ad alanları bu yazma için çıkarılmaz ve ad alanı yeterli satır boşaltamazsa yazma yine başarısız olur.

    <Warning>
    Bu sürümde yalnızca paketlenmiş pluginler.
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
    Kanala özgü çalışma zamanı yardımcıları (bir kanal plugini yüklendiğinde kullanılabilir).

    `api.runtime.channel.media`, kanal medya indirmeleri ve depolama için tercih edilen yüzeydir:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Uzak bir URL'nin OpenClaw medyası olması gerektiğinde `saveRemoteMedia(...)` kullanın. Plugin, pluginin sahip olduğu kimlik doğrulama, yönlendirme veya izin listesi işleme ile bir `Response` zaten getirdiyse `saveResponseMedia(...)` kullanın. `readRemoteMediaBuffer(...)` öğesini yalnızca pluginin inceleme, dönüştürme, şifre çözme veya yeniden yükleme için ham baytlara ihtiyaç duyduğu durumlarda kullanın. `fetchRemoteMedia(...)`, `readRemoteMediaBuffer(...)` için kullanımdan kaldırılmış bir uyumluluk takma adı olarak kalır.

    `api.runtime.channel.mentions`, çalışma zamanı enjeksiyonu kullanan paketlenmiş kanal pluginleri için paylaşılan gelen bahsetme ilkesi yüzeyidir:

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

    `api.runtime.channel.mentions`, eski `resolveMentionGating*` uyumluluk yardımcılarını kasıtlı olarak dışa açmaz. Normalleştirilmiş `{ facts, policy }` yolunu tercih edin.

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
Çalışma zamanı deposu kimliği için `pluginId` tercih edin. Daha düşük düzeyli `key` biçimi, bir pluginin kasıtlı olarak birden fazla çalışma zamanı yuvasına ihtiyaç duyduğu yaygın olmayan durumlar içindir.
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
  `plugins.entries.<id>.config` içinden plugine özgü yapılandırma.
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

- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli ve kayıt defteri
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` seçenekleri
- [SDK genel bakış](/tr/plugins/sdk-overview) — alt yol başvurusu
