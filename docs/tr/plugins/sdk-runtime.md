---
read_when:
    - Bir Plugin içinden çekirdek yardımcıları çağırmanız gerekiyor (TTS, STT, görüntü üretimi, web arama, alt aracı, Node'lar)
    - '`api.runtime` öğesinin neleri açığa çıkardığını anlamak istiyorsunuz'
    - Plugin kodundan yapılandırma, aracı veya medya yardımcılarına erişiyorsunuz
sidebarTitle: Runtime helpers
summary: '`api.runtime` -- Plugin''ler için kullanılabilir olan enjekte edilmiş çalışma zamanı yardımcıları'
title: Plugin çalışma zamanı yardımcıları
x-i18n:
    generated_at: "2026-04-26T11:37:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Kayıt sırasında her Plugin'e enjekte edilen `api.runtime` nesnesi için başvuru. Ana makine iç bileşenlerini doğrudan içe aktarmak yerine bu yardımcıları kullanın.

<CardGroup cols={2}>
  <Card title="Kanal Plugin'leri" href="/tr/plugins/sdk-channel-plugins">
    Bu yardımcıları kanal Plugin'leri bağlamında kullanan adım adım kılavuz.
  </Card>
  <Card title="Sağlayıcı Plugin'leri" href="/tr/plugins/sdk-provider-plugins">
    Bu yardımcıları sağlayıcı Plugin'leri bağlamında kullanan adım adım kılavuz.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Çalışma zamanı ad alanları

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Aracı kimliği, dizinler ve oturum yönetimi.

    ```typescript
    // Aracının çalışma dizinini çözümle
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Aracı çalışma alanını çözümle
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Aracı kimliğini al
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Varsayılan düşünme düzeyini al
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // Aracı zaman aşımını al
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Çalışma alanının var olduğundan emin ol
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Gömülü bir aracı turu çalıştır
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

    `runEmbeddedAgent(...)`, Plugin kodundan normal bir OpenClaw aracı turu başlatmak için tarafsız yardımcıdır. Kanal tarafından tetiklenen yanıtlarla aynı sağlayıcı/model çözümlemesini ve aracı harness seçimini kullanır.

    `runEmbeddedPiAgent(...)`, uyumluluk takma adı olarak korunmaktadır.

    **Oturum deposu yardımcıları**, `api.runtime.agent.session` altında bulunur:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Varsayılan model ve sağlayıcı sabitleri:

    ```typescript
    const model = api.runtime.agent.defaults.model; // ör. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // ör. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Arka plan alt aracı çalıştırmalarını başlatın ve yönetin.

    ```typescript
    // Bir alt aracı çalıştırması başlat
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // isteğe bağlı geçersiz kılma
      model: "gpt-4.1-mini", // isteğe bağlı geçersiz kılma
      deliver: false,
    });

    // Tamamlanmasını bekle
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Oturum mesajlarını oku
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Bir oturumu sil
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Model geçersiz kılmaları (`provider`/`model`), yapılandırmada `plugins.entries.<id>.subagent.allowModelOverride: true` ile operatör onayı gerektirir. Güvenilmeyen Plugin'ler yine de alt aracı çalıştırabilir, ancak geçersiz kılma istekleri reddedilir.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Bağlı Node'ları listeleyin ve Gateway tarafından yüklenen Plugin kodundan veya Plugin CLI komutlarından bir Node ana makine komutu çağırın. Bir Plugin eşleştirilmiş bir cihazda yerel işe sahipse, örneğin başka bir Mac üzerindeki tarayıcı veya ses köprüsü gibi durumlarda bunu kullanın.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway içinde bu çalışma zamanı işlem içidir. Plugin CLI komutlarında yapılandırılmış Gateway'i RPC üzerinden çağırır; böylece `openclaw googlemeet recover-tab` gibi komutlar eşleştirilmiş Node'ları terminalden inceleyebilir. Node komutları yine de normal Gateway Node eşleştirmesi, komut izin listeleri ve Node yerel komut işleme üzerinden geçer.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Bir TaskFlow çalışma zamanını mevcut bir OpenClaw oturum anahtarına veya güvenilir araç bağlamına bağlayın, ardından her çağrıda sahip geçmeden TaskFlow'lar oluşturun ve yönetin.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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
    // Standart TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telefon için optimize edilmiş TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Kullanılabilir sesleri listele
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
    // Bir görüntüyü açıkla
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Sesi yazıya dök
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // MIME çıkarılamadığında isteğe bağlı
    });

    // Bir videoyu açıkla
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Genel dosya analizi
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Çıktı üretilmediğinde `{ text: undefined }` döndürür (ör. atlanan girdi).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`, `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` için uyumluluk takma adı olarak korunmaktadır.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Görüntü üretimi.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Web arama.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Düşük düzey medya yardımcı programları.

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
    Yapılandırma yükleme ve yazma.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    Sistem düzeyi yardımcı programlar.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    Durum dizini çözümleme.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    Active Memory araç fabrikaları ve CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanala özgü çalışma zamanı yardımcıları (bir kanal Plugin'i yüklendiğinde kullanılabilir).

    `api.runtime.channel.mentions`, çalışma zamanı enjeksiyonu kullanan paketlenmiş kanal Plugin'leri için paylaşılan gelen mention ilkesi yüzeyidir:

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

    Kullanılabilir mention yardımcıları:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions`, eski `resolveMentionGating*` uyumluluk yardımcılarını kasıtlı olarak açığa çıkarmaz. Normalize edilmiş `{ facts, policy }` yolunu tercih edin.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı başvurularını depolama

Çalışma zamanı başvurusunu `register` geri çağrısı dışında kullanmak üzere depolamak için `createPluginRuntimeStore` kullanın:

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
      return store.getRuntime(); // başlatılmamışsa hata fırlatır
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // başlatılmamışsa null döndürür
    }
    ```

  </Step>
</Steps>

<Note>
Çalışma zamanı deposu kimliği için `pluginId` tercih edin. Daha düşük düzeyli `key` biçimi, nadir durumlarda bir Plugin'in kasıtlı olarak birden fazla çalışma zamanı yuvasına ihtiyaç duyması içindir.
</Note>

## Diğer üst düzey `api` alanları

`api.runtime` ötesinde, API nesnesi şunları da sağlar:

<ParamField path="api.id" type="string">
  Plugin kimliği.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin görünen adı.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Mevcut yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` içinden Plugin'e özgü yapılandırma.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Geçerli yükleme modu; `"setup-runtime"` tam girişten önceki hafif başlatma/kurulum penceresidir.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin köküne göre bir yolu çözümleyin.
</ParamField>

## İlgili

- [Plugin iç yapıları](/tr/plugins/architecture) — yetenek modeli ve kayıt
- [SDK giriş noktaları](/tr/plugins/sdk-entrypoints) — `definePluginEntry` seçenekleri
- [SDK genel bakış](/tr/plugins/sdk-overview) — alt yol başvurusu
