---
read_when:
    - Anda perlu memanggil helper inti dari plugin (TTS, STT, pembuatan gambar, pencarian web, subagent, node)
    - Anda ingin memahami apa yang diekspos oleh api.runtime
    - Anda mengakses helper konfigurasi, agen, atau media dari kode plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- helper runtime yang diinjeksi dan tersedia untuk Plugin
title: Helper runtime Plugin
x-i18n:
    generated_at: "2026-07-04T20:44:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referensi untuk objek `api.runtime` yang disuntikkan ke setiap plugin selama registrasi. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<CardGroup cols={2}>
  <Card title="Plugin channel" href="/id/plugins/sdk-channel-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk plugin channel.
  </Card>
  <Card title="Plugin provider" href="/id/plugins/sdk-provider-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk plugin provider.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Pemuatan dan penulisan konfigurasi

Utamakan konfigurasi yang sudah diteruskan ke jalur panggilan aktif, misalnya `api.config` selama registrasi atau argumen `cfg` pada callback channel/provider. Ini menjaga satu snapshot proses mengalir melalui pekerjaan alih-alih mem-parsing ulang konfigurasi pada jalur panas.

Gunakan `api.runtime.config.current()` hanya ketika handler berumur panjang membutuhkan snapshot proses saat ini dan tidak ada konfigurasi yang diteruskan ke fungsi tersebut. Nilai yang dikembalikan bersifat readonly; kloning atau gunakan helper mutasi sebelum mengedit.

Factory alat menerima `ctx.runtimeConfig` ditambah `ctx.getRuntimeConfig()`. Gunakan getter di dalam callback `execute` milik alat berumur panjang ketika konfigurasi dapat berubah setelah definisi alat dibuat.

Persistenkan perubahan dengan `api.runtime.config.mutateConfigFile(...)` atau `api.runtime.config.replaceConfigFile(...)`. Setiap penulisan harus memilih kebijakan `afterWrite` eksplisit:

- `afterWrite: { mode: "auto" }` membiarkan pemuat ulang gateway menentukan keputusan.
- `afterWrite: { mode: "restart", reason: "..." }` memaksa restart bersih ketika penulis mengetahui bahwa hot reload tidak aman.
- `afterWrite: { mode: "none", reason: "..." }` menekan reload/restart otomatis hanya ketika pemanggil memiliki tindak lanjutnya.

Helper mutasi mengembalikan `afterWrite` ditambah ringkasan `followUp` bertipe sehingga pemanggil dapat mencatat log atau menguji apakah mereka meminta restart. Gateway tetap memiliki kendali atas kapan restart itu benar-benar terjadi.

`api.runtime.config.loadConfig()` dan `api.runtime.config.writeConfigFile(...)` adalah helper kompatibilitas yang tidak lagi disarankan di bawah `runtime-config-load-write`. Keduanya memperingatkan sekali saat runtime, dan tetap tersedia untuk plugin eksternal lama selama jendela migrasi. Plugin bawaan tidak boleh menggunakannya; penjaga batas konfigurasi gagal jika kode plugin memanggilnya atau mengimpor helper tersebut dari subpath SDK plugin.

Untuk impor SDK langsung, gunakan subpath konfigurasi yang terfokus alih-alih barrel kompatibilitas luas
`openclaw/plugin-sdk/config-runtime`: `config-contracts` untuk
tipe, `plugin-config-runtime` untuk asersi konfigurasi yang sudah dimuat dan pencarian entri
plugin, `runtime-config-snapshot` untuk snapshot proses saat ini, dan
`config-mutation` untuk penulisan. Pengujian plugin bawaan sebaiknya me-mock subpath terfokus ini
secara langsung alih-alih me-mock barrel kompatibilitas luas.

Kode runtime internal OpenClaw memiliki arah yang sama: muat konfigurasi sekali di batas CLI, gateway, atau proses, lalu teruskan nilai itu. Penulisan mutasi yang berhasil menyegarkan snapshot runtime proses dan memajukan revisi internalnya; cache berumur panjang sebaiknya memakai kunci cache milik runtime alih-alih menserialisasi konfigurasi secara lokal. Modul runtime berumur panjang memiliki pemindai tanpa toleransi untuk panggilan ambient `loadConfig()`; gunakan `cfg` yang diteruskan, `context.getRuntimeConfig()` permintaan, atau `getRuntimeConfig()` pada batas proses eksplisit.

Jalur eksekusi provider dan channel harus menggunakan snapshot konfigurasi runtime aktif, bukan snapshot file yang dikembalikan untuk pembacaan balik atau pengeditan konfigurasi. Snapshot file mempertahankan nilai sumber seperti penanda SecretRef untuk UI dan penulisan; callback provider membutuhkan tampilan runtime yang telah di-resolve. Ketika helper dapat dipanggil dengan snapshot sumber aktif atau snapshot runtime aktif, rutekan melalui `selectApplicableRuntimeConfig()` sebelum membaca kredensial.

## Utilitas runtime yang dapat digunakan ulang

Gunakan fakta `botLoopProtection` masuk untuk pesan masuk yang dibuat bot. Core menerapkan penjaga sliding-window dalam memori bersama sebelum pencatatan sesi dan dispatch, tanpa mengikat kebijakan ke satu channel. Penjaga melacak kunci `(scopeId, conversationId, participant pair)`, menghitung kedua arah dari satu pasangan bersama-sama, menerapkan cooldown setelah anggaran window terlampaui, dan memangkas entri tidak aktif secara oportunistik.

Plugin channel yang mengekspos perilaku ini kepada operator sebaiknya mengutamakan bentuk bersama `channels.defaults.botLoopProtection` untuk anggaran dasar, lalu melapisi override khusus channel/provider di atasnya. Konfigurasi bersama menggunakan detik karena bersifat menghadap pengguna:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Teruskan fakta pasangan bot yang dinormalisasi bersama turn yang telah di-resolve. Core me-resolve default, konversi unit, dan semantik `enabled`:

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

Gunakan `openclaw/plugin-sdk/pair-loop-guard-runtime` secara langsung hanya untuk loop peristiwa
dua pihak khusus yang tidak melalui runner balasan masuk bersama.

## Namespace runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identitas agent, direktori, dan manajemen sesi.

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

    `runEmbeddedAgent(...)` adalah helper netral untuk memulai turn agent OpenClaw normal dari kode plugin. Ini menggunakan resolusi provider/model dan pemilihan agent-harness yang sama seperti balasan yang dipicu channel.

    `runEmbeddedPiAgent(...)` tetap menjadi alias kompatibilitas yang tidak lagi disarankan untuk plugin yang ada. Kode baru sebaiknya menggunakan `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` mengembalikan level berpikir yang didukung provider/model dan default opsional. Plugin provider memiliki profil khusus model melalui hook berpikir mereka, sehingga plugin alat sebaiknya memanggil helper runtime ini alih-alih mengimpor atau menduplikasi daftar provider.

    `normalizeThinkingLevel(...)` mengonversi teks pengguna seperti `on`, `x-high`, atau `extra high` ke level tersimpan kanonis sebelum memeriksanya terhadap kebijakan yang telah di-resolve.

    **Helper penyimpanan sesi** berada di bawah `api.runtime.agent.session`:

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

    Utamakan `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, atau `upsertSessionEntry(...)` untuk alur kerja sesi. Helper ini mengalamatkan sesi berdasarkan identitas agent/sesi sehingga plugin tidak bergantung pada bentuk penyimpanan `sessions.json` lama. Gunakan `preserveActivity: true` untuk patch khusus metadata yang tidak boleh menyegarkan aktivitas sesi, dan `replaceEntry: true` hanya ketika callback mengembalikan entri lengkap dan field yang dihapus harus tetap terhapus.

    Gunakan `runWithWorkAdmission(...)` ketika plugin memulai pekerjaan pada sesi yang dipersistenkan. Callback menolak sesi yang diarsipkan atau diganti secara bersamaan, menjaga mutasi arsip/reset/hapus tetap terkoordinasi hingga selesai, dan menerima `AbortSignal` yang harus diteruskan ke run agent.

    Untuk pembacaan dan penulisan transkrip, impor `openclaw/plugin-sdk/session-transcript-runtime` dan gunakan `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, atau `withSessionTranscriptWriteLock(...)` dengan `{ agentId, sessionKey, sessionId }`. API ini memungkinkan plugin mengidentifikasi transkrip, membaca peristiwanya, menambahkan pesan, memublikasikan pembaruan, dan menjalankan operasi terkait di bawah write lock transkrip yang sama. Meneruskan `sessionFile`, menggunakan `resolveSessionTranscriptLegacyFileTarget(...)`, atau mengimpor `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` tingkat rendah dari `openclaw/plugin-sdk/agent-harness-runtime` tidak lagi disarankan; jalur tersebut hanya ada untuk kode lama yang sudah menerima artefak transkrip aktif.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)`, dan `resolveAndPersistSessionFile(...)` adalah helper kompatibilitas yang tidak lagi disarankan untuk plugin yang masih sengaja bergantung pada bentuk whole-store atau transcript-file lama. Kode plugin baru tidak boleh menggunakan helper tersebut, dan pemanggil yang ada sebaiknya bermigrasi ke helper entri dan helper identitas transkrip.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Konstanta model dan provider default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Jalankan penyelesaian teks milik host tanpa mengimpor internal provider atau
    menduplikasi persiapan model/auth/base URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Helper ini menggunakan jalur persiapan penyelesaian sederhana yang sama seperti runtime
    bawaan OpenClaw dan snapshot konfigurasi runtime milik host. Mesin konteks
    menerima kapabilitas `llm.complete` yang terikat sesi, sehingga panggilan model menggunakan
    agent milik sesi aktif dan tidak diam-diam fallback ke agent default. Hasilnya
    menyertakan atribusi provider/model/agent ditambah penggunaan token,
    cache, dan estimasi biaya yang dinormalisasi saat tersedia.

    <Warning>
    Penggantian model memerlukan persetujuan operator melalui `plugins.entries.<id>.llm.allowModelOverride: true` di config. Gunakan `plugins.entries.<id>.llm.allowedModels` untuk membatasi plugin tepercaya ke target kanonis `provider/model` tertentu. Penyelesaian lintas agen memerlukan `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Luncurkan dan kelola run subagen latar belakang.

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
    Penggantian model (`provider`/`model`) memerlukan persetujuan operator melalui `plugins.entries.<id>.subagent.allowModelOverride: true` di config. Plugin yang tidak tepercaya tetap dapat menjalankan subagen, tetapi permintaan penggantian ditolak.
    </Warning>

    `deleteSession(...)` dapat menghapus sesi yang dibuat oleh plugin yang sama melalui `api.runtime.subagent.run(...)`. Menghapus sesi pengguna atau operator sembarang tetap memerlukan permintaan Gateway dengan cakupan admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Cantumkan node yang terhubung dan panggil perintah host node dari kode plugin yang dimuat Gateway atau dari perintah CLI plugin. Gunakan ini ketika plugin memiliki pekerjaan lokal pada perangkat yang dipasangkan, misalnya browser atau jembatan audio di Mac lain.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Di dalam Gateway, runtime ini berjalan dalam proses. Dalam perintah CLI plugin, runtime ini memanggil Gateway yang dikonfigurasi melalui RPC, sehingga perintah seperti `openclaw googlemeet recover-tab` dapat memeriksa node yang dipasangkan dari terminal. Perintah Node tetap melewati pemasangan node Gateway normal, daftar izin perintah, kebijakan pemanggilan node plugin, dan penanganan perintah lokal node.

    Plugin yang mengekspos perintah host node berbahaya harus mendaftarkan kebijakan pemanggilan node dengan `api.registerNodeInvokePolicy(...)`. Kebijakan berjalan di Gateway setelah pemeriksaan daftar izin perintah dan sebelum perintah diteruskan ke node, sehingga panggilan langsung `node.invoke` dan alat plugin tingkat lebih tinggi berbagi jalur penegakan yang sama.

    <Warning>
    Kolom opsional `scopes` meminta cakupan operator Gateway untuk pemanggilan. OpenClaw menghormatinya hanya untuk plugin bawaan dan instalasi plugin resmi tepercaya; permintaan dari plugin lain tidak meningkatkan hak panggilan. Gunakan hanya ketika plugin tepercaya harus memanggil perintah node dengan cakupan Gateway yang lebih ketat, seperti `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Ikat runtime Task Flow ke kunci sesi OpenClaw yang sudah ada atau konteks alat tepercaya, lalu buat dan kelola Task Flow tanpa meneruskan owner pada setiap panggilan.

    Task Flow melacak status alur kerja beberapa langkah yang tahan lama. Ini bukan penjadwal:
    gunakan Cron atau `api.session.workflow.scheduleSessionTurn(...)` untuk wakeup
    mendatang, lalu gunakan `managedFlows` dari giliran terjadwal ketika pekerjaan itu
    memerlukan status flow, tugas anak, penantian, atau pembatalan.

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

    Gunakan `bindSession({ sessionKey, requesterOrigin })` ketika Anda sudah memiliki kunci sesi OpenClaw tepercaya dari lapisan binding Anda sendiri. Jangan ikat dari input pengguna mentah.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesis teks-ke-ucapan.

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

    Menggunakan konfigurasi inti `messages.tts` dan pemilihan provider. Mengembalikan buffer audio PCM + laju sampel.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analisis gambar, audio, dan video.

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

    Mengembalikan `{ text: undefined }` ketika tidak ada output yang dihasilkan (misalnya input dilewati).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` tetap menjadi alias kompatibilitas untuk `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Pembuatan gambar.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Pencarian web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilitas media tingkat rendah.

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
    Snapshot config runtime saat ini dan penulisan config transaksional. Utamakan
    config yang sudah diteruskan ke jalur panggilan aktif; gunakan
    `current()` hanya ketika handler memerlukan snapshot proses secara langsung.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` dan `replaceConfigFile(...)` mengembalikan nilai
    `followUp`, misalnya `{ mode: "restart", requiresRestart: true, reason }`,
    yang mencatat maksud penulis tanpa mengambil kendali restart dari
    gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitas tingkat sistem.

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

    `runCommandWithTimeout(...)` mengembalikan `stdout` dan `stderr` yang ditangkap,
    jumlah pemotongan opsional, `code`, `signal`, `killed`, `termination`, dan
    `noOutputTimedOut`. Hasil timeout dan timeout-tanpa-output melaporkan `code: 124`
    ketika proses anak tidak menyediakan kode keluar bukan nol. Keluar karena sinyal
    non-timeout masih dapat mengembalikan `code: null`, jadi gunakan `termination` dan
    `noOutputTimedOut` untuk membedakan alasan timeout.

  </Accordion>
  <Accordion title="api.runtime.events">
    Langganan peristiwa.

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
    Logging.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Resolusi autentikasi model dan provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolusi direktori state dan penyimpanan berkunci berbasis SQLite.

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

    Penyimpanan berkunci bertahan setelah restart dan diisolasi berdasarkan id plugin yang terikat runtime. Gunakan `registerIfAbsent(...)` untuk klaim dedupe atomik: fungsi ini mengembalikan `true` ketika kunci tidak ada atau sudah kedaluwarsa lalu didaftarkan, atau `false` ketika nilai aktif sudah ada tanpa menimpa nilainya, waktu pembuatannya, atau TTL. Batas: `maxEntries` per namespace, 6.000 baris aktif per plugin, nilai JSON di bawah 64KB, dan kedaluwarsa TTL opsional. Ketika penulisan akan melampaui batas baris plugin, runtime dapat mengeluarkan baris aktif paling lama dari namespace yang sedang ditulis; namespace saudara tidak dikeluarkan untuk penulisan tersebut, dan penulisan tetap gagal jika namespace tidak dapat membebaskan cukup baris.

    <Warning>
    Plugin bundel saja dalam rilis ini.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factory alat memori dan CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helper runtime khusus channel (tersedia ketika plugin channel dimuat).

    `api.runtime.channel.media` adalah permukaan yang disarankan untuk pengunduhan dan penyimpanan media channel:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Gunakan `saveRemoteMedia(...)` ketika URL jarak jauh harus menjadi media OpenClaw. Gunakan `saveResponseMedia(...)` ketika plugin sudah mengambil `Response` dengan penanganan autentikasi, pengalihan, atau allowlist milik plugin. Gunakan `readRemoteMediaBuffer(...)` hanya ketika plugin membutuhkan byte mentah untuk inspeksi, transformasi, dekripsi, atau unggah ulang. `fetchRemoteMedia(...)` tetap menjadi alias kompatibilitas yang sudah deprecated untuk `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` adalah permukaan kebijakan mention masuk bersama untuk plugin channel bundel yang menggunakan injeksi runtime:

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

    Helper mention yang tersedia:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` sengaja tidak mengekspos helper kompatibilitas lama `resolveMentionGating*`. Pilih jalur `{ facts, policy }` yang sudah dinormalisasi.

  </Accordion>
</AccordionGroup>

## Menyimpan referensi runtime

Gunakan `createPluginRuntimeStore` untuk menyimpan referensi runtime agar dapat digunakan di luar callback `register`:

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
Pilih `pluginId` untuk identitas runtime-store. Bentuk `key` tingkat lebih rendah ditujukan untuk kasus yang jarang terjadi ketika satu plugin sengaja membutuhkan lebih dari satu slot runtime.
</Note>

## Bidang `api` tingkat atas lainnya

Selain `api.runtime`, objek API juga menyediakan:

<ParamField path="api.id" type="string">
  Id plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nama tampilan plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot config saat ini (snapshot runtime dalam memori yang aktif jika tersedia).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Config khusus plugin dari `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger berskup (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Selesaikan path relatif terhadap root plugin.
</ParamField>

## Terkait

- [Internal Plugin](/id/plugins/architecture) — model capability dan registry
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry`
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi subpath
