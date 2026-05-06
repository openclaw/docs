---
read_when:
    - Bir plugin’den çekirdek yardımcıları çağırmanız gerekiyor (TTS, STT, görsel oluşturma, web araması, alt ajan, düğümler)
    - api.runtime'ın neleri sunduğunu anlamak istiyorsunuz
    - Plugin kodundan yapılandırma, ajan veya medya yardımcılarına erişiyorsunuz
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin'lerin kullanımına sunulan enjekte edilmiş çalışma zamanı yardımcıları
title: Plugin çalışma zamanı yardımcıları
x-i18n:
    generated_at: "2026-05-06T17:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ce16325613efc07bccb8baee3fdb46eb28452b760a6c265d3a25d36bfcbcf0f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

OpenClaw, kayıt sırasında her Plugin'e enjekte edilen `api.runtime` nesnesi için başvuru. Host iç bileşenlerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" href="/tr/plugins/sdk-channel-plugins">
    Bu yardımcıları kanal Plugin'leri için bağlam içinde kullanan adım adım kılavuz.
  </Card>
  <Card title="Sağlayıcı Plugin'leri" href="/tr/plugins/sdk-provider-plugins">
    Bu yardımcıları sağlayıcı Plugin'leri için bağlam içinde kullanan adım adım kılavuz.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Yapılandırma yükleme ve yazmalar

Etkin çağrı yoluna zaten geçirilmiş yapılandırmayı tercih edin; örneğin kayıt sırasında `api.config` veya kanal/sağlayıcı callback'lerinde bir `cfg` argümanı. Bu, sıcak yollarda yapılandırmayı yeniden ayrıştırmak yerine tek bir süreç anlık görüntüsünün iş boyunca akmasını sağlar.

`api.runtime.config.current()` öğesini yalnızca uzun ömürlü bir işleyici geçerli süreç anlık görüntüsüne ihtiyaç duyduğunda ve o işleve hiçbir yapılandırma geçirilmediğinde kullanın. Döndürülen değer salt okunurdur; düzenlemeden önce klonlayın veya bir mutasyon yardımcısı kullanın.

Araç fabrikaları `ctx.runtimeConfig` ve `ctx.getRuntimeConfig()` alır. Yapılandırma, araç tanımı oluşturulduktan sonra değişebiliyorsa getter'ı uzun ömürlü bir aracın `execute` callback'i içinde kullanın.

Değişiklikleri `api.runtime.config.mutateConfigFile(...)` veya `api.runtime.config.replaceConfigFile(...)` ile kalıcı hale getirin. Her yazma açık bir `afterWrite` politikası seçmelidir:

- `afterWrite: { mode: "auto" }` gateway yeniden yükleme planlayıcısının karar vermesine izin verir.
- `afterWrite: { mode: "restart", reason: "..." }` yazıcı sıcak yeniden yüklemenin güvenli olmadığını bildiğinde temiz bir yeniden başlatmayı zorunlu kılar.
- `afterWrite: { mode: "none", reason: "..." }` otomatik yeniden yükleme/yeniden başlatmayı yalnızca çağıran taraf takip işlemini üstlendiğinde bastırır.

Mutasyon yardımcıları, çağıranların yeniden başlatma isteyip istemediklerini günlüğe kaydedebilmesi veya test edebilmesi için `afterWrite` ile birlikte tipli bir `followUp` özeti döndürür. Gateway, bu yeniden başlatmanın gerçekte ne zaman olacağının sahibi olmaya devam eder.

`api.runtime.config.loadConfig()` ve `api.runtime.config.writeConfigFile(...)`, `runtime-config-load-write` altındaki uyumluluk yardımcıları olarak kullanımdan kaldırılmıştır. Çalışma zamanında bir kez uyarı verirler ve geçiş penceresi sırasında eski harici Plugin'ler için kullanılabilir kalırlar. Paketli Plugin'ler bunları kullanmamalıdır; Plugin kodu bunları çağırırsa veya bu yardımcıları Plugin SDK alt yollarından içe aktarırsa yapılandırma sınırı korumaları başarısız olur.

Doğrudan SDK içe aktarmaları için geniş
`openclaw/plugin-sdk/config-runtime` uyumluluk barrel'ı yerine odaklanmış yapılandırma alt yollarını kullanın: tipler için `config-types`, zaten yüklenmiş yapılandırma doğrulamaları ve Plugin
giriş araması için `plugin-config-runtime`, geçerli süreç anlık görüntüleri için `runtime-config-snapshot` ve
yazmalar için `config-mutation`. Paketli Plugin testleri, geniş uyumluluk barrel'ını mock'lamak yerine bu odaklanmış
alt yolları doğrudan mock'lamalıdır.

Dahili OpenClaw çalışma zamanı kodu da aynı yöndedir: yapılandırmayı CLI, gateway veya süreç sınırında bir kez yükleyin, ardından bu değeri aktarın. Başarılı mutasyon yazmaları süreç çalışma zamanı anlık görüntüsünü yeniler ve dahili revizyonunu ilerletir; uzun ömürlü önbellekler, yapılandırmayı yerelde serileştirmek yerine çalışma zamanının sahip olduğu önbellek anahtarını temel almalıdır. Uzun ömürlü çalışma zamanı modüllerinde ortamdan `loadConfig()` çağrıları için sıfır toleranslı bir tarayıcı vardır; geçirilmiş bir `cfg`, bir istek `context.getRuntimeConfig()` veya açık bir süreç sınırında `getRuntimeConfig()` kullanın.

Sağlayıcı ve kanal yürütme yolları, yapılandırma geri okuma veya düzenleme için döndürülen bir dosya anlık görüntüsünü değil, etkin çalışma zamanı yapılandırma anlık görüntüsünü kullanmalıdır. Dosya anlık görüntüleri, UI ve yazmalar için SecretRef işaretçileri gibi kaynak değerleri korur; sağlayıcı callback'leri çözümlenmiş çalışma zamanı görünümüne ihtiyaç duyar. Bir yardımcı etkin kaynak anlık görüntüsü veya etkin çalışma zamanı anlık görüntüsüyle çağrılabiliyorsa kimlik bilgilerini okumadan önce `selectApplicableRuntimeConfig()` üzerinden yönlendirin.

## Çalışma zamanı ad alanları

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent kimliği, dizinler ve oturum yönetimi.

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

    `runEmbeddedAgent(...)`, Plugin kodundan normal bir OpenClaw agent turu başlatmak için tarafsız yardımcıdır. Kanal tarafından tetiklenen yanıtlarla aynı sağlayıcı/model çözümlemesini ve agent-harness seçimini kullanır.

    `runEmbeddedPiAgent(...)` uyumluluk takma adı olarak kalır.

    `resolveThinkingPolicy(...)`, sağlayıcı/model tarafından desteklenen thinking düzeylerini ve isteğe bağlı varsayılanı döndürür. Sağlayıcı Plugin'leri modele özgü profilin sahibi thinking hook'ları üzerinden olduğundan, araç Plugin'leri sağlayıcı listelerini içe aktarmak veya çoğaltmak yerine bu çalışma zamanı yardımcısını çağırmalıdır.

    `normalizeThinkingLevel(...)`, `on`, `x-high` veya `extra high` gibi kullanıcı metnini çözümlenmiş politikaya göre denetlemeden önce kanonik saklanan düzeye dönüştürür.

    **Oturum deposu yardımcıları** `api.runtime.agent.session` altındadır:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Çalışma zamanı yazmaları için `updateSessionStore(...)` veya `updateSessionStoreEntry(...)` tercih edin. Bunlar Gateway'in sahip olduğu oturum deposu yazıcısı üzerinden yönlendirilir, eşzamanlı güncellemeleri korur ve sıcak önbelleği yeniden kullanır. `saveSessionStore(...)`, uyumluluk ve çevrimdışı bakım tarzı yeniden yazmalar için kullanılabilir kalır.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Varsayılan model ve sağlayıcı sabitleri:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Arka plan alt agent çalıştırmalarını başlatın ve yönetin.

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
    Model geçersiz kılmaları (`provider`/`model`), yapılandırmada `plugins.entries.<id>.subagent.allowModelOverride: true` üzerinden operatör onayı gerektirir. Güvenilmeyen Plugin'ler yine de alt agent'lar çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
    </Warning>

    `deleteSession(...)`, aynı Plugin tarafından `api.runtime.subagent.run(...)` üzerinden oluşturulan oturumları silebilir. Rastgele kullanıcı veya operatör oturumlarını silmek yine de admin kapsamlı bir Gateway isteği gerektirir.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Bağlı node'ları listeleyin ve Gateway tarafından yüklenen Plugin kodundan veya Plugin CLI komutlarından node-host komutu çağırın. Bir Plugin eşleştirilmiş bir cihazda yerel işin sahibi olduğunda bunu kullanın; örneğin başka bir Mac üzerindeki tarayıcı veya ses köprüsü.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway içinde bu çalışma zamanı süreç içindedir. Plugin CLI komutlarında yapılandırılmış Gateway'i RPC üzerinden çağırır; böylece `openclaw googlemeet recover-tab` gibi komutlar terminalden eşleştirilmiş node'ları inceleyebilir. Node komutları yine de normal Gateway node eşleştirmesi, komut izin listeleri, Plugin node-invoke politikaları ve node-yerel komut işleme üzerinden geçer.

    Tehlikeli node-host komutları açığa çıkaran Plugin'ler `api.registerNodeInvokePolicy(...)` ile bir node-invoke politikası kaydetmelidir. Politika, komut izin listesi denetimlerinden sonra ve komut node'a iletilmeden önce Gateway içinde çalışır; bu nedenle doğrudan `node.invoke` çağrıları ve daha üst düzey Plugin araçları aynı uygulama yolunu paylaşır.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Bir Task Flow çalışma zamanını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç bağlamına bağlayın, ardından her çağrıda bir sahip geçirmeden Task Flow'lar oluşturun ve yönetin.

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

    Kendi bağlama katmanınızdan gelen güvenilir bir OpenClaw oturum anahtarınız zaten varsa `bindSession({ sessionKey, requesterOrigin })` kullanın. Ham kullanıcı girdisinden bağlama yapmayın.

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

    Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır. PCM ses tamponu + örnekleme hızı döndürür.

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
    Düşük seviyeli medya yardımcı araçları.

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
    Geçerli çalışma zamanı yapılandırma anlık görüntüsü ve işlemsel yapılandırma yazımları. Etkin çağrı yoluna zaten geçirilmiş yapılandırmayı tercih edin; `current()` öğesini yalnızca işleyici doğrudan işlem anlık görüntüsüne ihtiyaç duyduğunda kullanın.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` ve `replaceConfigFile(...)`, örneğin `{ mode: "restart", requiresRestart: true, reason }` gibi bir `followUp` değeri döndürür; bu değer, yeniden başlatma denetimini gateway'den almadan yazıcı niyetini kaydeder.

  </Accordion>
  <Accordion title="api.runtime.system">
    Sistem seviyesindeki yardımcı araçlar.

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

    Anahtarlı depolar yeniden başlatmalardan sonra korunur ve çalışma zamanına bağlı Plugin kimliğine göre yalıtılır. Atomik tekilleştirme hak talepleri için `registerIfAbsent(...)` kullanın: anahtar eksikse veya süresi dolmuşsa ve kaydedildiyse `true`; canlı bir değer, değerinin, oluşturulma zamanının veya TTL değerinin üzerine yazılmadan zaten varsa `false` döndürür. Sınırlar: ad alanı başına `maxEntries`, Plugin başına 1.000 canlı satır, 64 KB altında JSON değerleri ve isteğe bağlı TTL sona ermesi.

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

    `api.runtime.channel.mentions`, eski `resolveMentionGating*` uyumluluk yardımcılarını bilerek açığa çıkarmaz. Normalleştirilmiş `{ facts, policy }` yolunu tercih edin.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı başvurularını depolama

`register` geri çağrısı dışında kullanılmak üzere çalışma zamanı başvurusunu depolamak için `createPluginRuntimeStore` kullanın:

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
runtime-store kimliği için `pluginId` öğesini tercih edin. Daha düşük seviyeli `key` biçimi, bir Plugin'in bilerek birden fazla çalışma zamanı yuvasına ihtiyaç duyduğu yaygın olmayan durumlar içindir.
</Note>

## Diğer üst düzey `api` alanları

`api.runtime` öğesinin ötesinde, API nesnesi şunları da sağlar:

<ParamField path="api.id" type="string">
  Plugin kimliği.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin görüntüleme adı.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Geçerli yapılandırma anlık görüntüsü (kullanılabilir olduğunda etkin bellek içi çalışma zamanı anlık görüntüsü).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` içinden Plugin'e özgü yapılandırma.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Kapsamlı logger (`debug`, `info`, `warn`, `error`).
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
