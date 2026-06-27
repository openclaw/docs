---
read_when:
    - Anda perlu memanggil helper inti dari Plugin (TTS, STT, pembuatan gambar, pencarian web, subagen, node)
    - Anda ingin memahami apa yang diekspos oleh api.runtime
    - Anda mengakses helper config, agen, atau media dari kode plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- helper runtime yang diinjeksi dan tersedia untuk Plugin
title: Pembantu runtime Plugin
x-i18n:
    generated_at: "2026-06-27T17:59:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referensi untuk objek `api.runtime` yang diinjeksi ke setiap plugin selama pendaftaran. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/id/plugins/sdk-channel-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk plugin channel.
  </Card>
  <Card title="Provider plugins" href="/id/plugins/sdk-provider-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk plugin penyedia.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Pemuatan dan penulisan konfigurasi

Utamakan konfigurasi yang sudah diteruskan ke jalur panggilan aktif, misalnya `api.config` selama pendaftaran atau argumen `cfg` pada callback channel/penyedia. Ini menjaga satu snapshot proses mengalir melalui pekerjaan alih-alih mem-parse ulang konfigurasi pada jalur panas.

Gunakan `api.runtime.config.current()` hanya saat handler berumur panjang membutuhkan snapshot proses saat ini dan tidak ada konfigurasi yang diteruskan ke fungsi tersebut. Nilai yang dikembalikan bersifat readonly; kloning atau gunakan helper mutasi sebelum mengedit.

Factory tool menerima `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gunakan getter di dalam callback `execute` milik tool berumur panjang ketika konfigurasi dapat berubah setelah definisi tool dibuat.

Persistenkan perubahan dengan `api.runtime.config.mutateConfigFile(...)` atau `api.runtime.config.replaceConfigFile(...)`. Setiap penulisan harus memilih kebijakan `afterWrite` eksplisit:

- `afterWrite: { mode: "auto" }` membiarkan pemuat ulang Gateway menentukan.
- `afterWrite: { mode: "restart", reason: "..." }` memaksa restart bersih ketika penulis tahu hot reload tidak aman.
- `afterWrite: { mode: "none", reason: "..." }` menekan reload/restart otomatis hanya ketika pemanggil memiliki tindak lanjutnya.

Helper mutasi mengembalikan `afterWrite` plus ringkasan `followUp` bertipe sehingga pemanggil dapat mencatat log atau menguji apakah mereka meminta restart. Gateway tetap memiliki kendali atas kapan restart itu benar-benar terjadi.

`api.runtime.config.loadConfig()` dan `api.runtime.config.writeConfigFile(...)` adalah helper kompatibilitas yang sudah tidak direkomendasikan di bawah `runtime-config-load-write`. Helper ini memberi peringatan sekali saat runtime, dan tetap tersedia untuk plugin eksternal lama selama jendela migrasi. Plugin bawaan tidak boleh menggunakannya; guard batas konfigurasi gagal jika kode plugin memanggilnya atau mengimpor helper tersebut dari subpath SDK plugin.

Untuk impor SDK langsung, gunakan subpath konfigurasi yang terfokus alih-alih barrel kompatibilitas luas
`openclaw/plugin-sdk/config-runtime`: `config-contracts` untuk
tipe, `plugin-config-runtime` untuk asersi konfigurasi yang sudah dimuat dan pencarian entri
plugin, `runtime-config-snapshot` untuk snapshot proses saat ini, dan
`config-mutation` untuk penulisan. Pengujian plugin bawaan sebaiknya me-mock subpath terfokus ini
secara langsung alih-alih me-mock barrel kompatibilitas luas.

Kode runtime internal OpenClaw memiliki arah yang sama: muat konfigurasi sekali di CLI, Gateway, atau batas proses, lalu teruskan nilai itu. Penulisan mutasi yang berhasil menyegarkan snapshot runtime proses dan memajukan revisi internalnya; cache berumur panjang sebaiknya memakai cache key milik runtime sebagai key alih-alih menserialisasi konfigurasi secara lokal. Modul runtime berumur panjang memiliki scanner tanpa toleransi untuk panggilan `loadConfig()` ambient; gunakan `cfg` yang diteruskan, `context.getRuntimeConfig()` permintaan, atau `getRuntimeConfig()` pada batas proses eksplisit.

Jalur eksekusi penyedia dan channel harus menggunakan snapshot konfigurasi runtime aktif, bukan snapshot file yang dikembalikan untuk pembacaan ulang atau pengeditan konfigurasi. Snapshot file mempertahankan nilai sumber seperti penanda SecretRef untuk UI dan penulisan; callback penyedia membutuhkan tampilan runtime yang sudah di-resolve. Ketika helper dapat dipanggil dengan snapshot sumber aktif atau snapshot runtime aktif, alihkan melalui `selectApplicableRuntimeConfig()` sebelum membaca kredensial.

## Utilitas runtime yang dapat digunakan ulang

Gunakan fakta `botLoopProtection` masuk untuk pesan masuk yang ditulis oleh bot. Core menerapkan guard sliding-window dalam memori bersama sebelum record sesi dan dispatch, tanpa mengikat kebijakan ke satu channel. Guard melacak key `(scopeId, conversationId, participant pair)`, menghitung kedua arah suatu pasangan bersama-sama, menerapkan cooldown setelah anggaran jendela terlampaui, dan memangkas entri tidak aktif secara oportunistik.

Plugin channel yang mengekspos perilaku ini ke operator sebaiknya mengutamakan bentuk bersama `channels.defaults.botLoopProtection` untuk anggaran dasar, lalu melapisi override khusus channel/penyedia di atasnya. Konfigurasi bersama menggunakan detik karena terlihat oleh pengguna:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Teruskan fakta pasangan bot yang dinormalisasi dengan giliran yang di-resolve. Core me-resolve default, konversi unit, dan semantik `enabled`:

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

Gunakan `openclaw/plugin-sdk/pair-loop-guard-runtime` secara langsung hanya untuk loop event dua pihak kustom yang tidak melalui runner balasan masuk bersama.

## Namespace runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identitas agen, direktori, dan manajemen sesi.

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

    `runEmbeddedAgent(...)` adalah helper netral untuk memulai giliran agen OpenClaw normal dari kode plugin. Helper ini menggunakan resolusi penyedia/model dan pemilihan agent-harness yang sama seperti balasan yang dipicu channel.

    `runEmbeddedPiAgent(...)` tetap ada sebagai alias kompatibilitas yang sudah tidak direkomendasikan untuk plugin yang ada. Kode baru sebaiknya menggunakan `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` mengembalikan level berpikir yang didukung penyedia/model dan default opsional. Plugin penyedia memiliki profil khusus model melalui hook berpikir mereka, jadi plugin tool sebaiknya memanggil helper runtime ini alih-alih mengimpor atau menduplikasi daftar penyedia.

    `normalizeThinkingLevel(...)` mengonversi teks pengguna seperti `on`, `x-high`, atau `extra high` ke level tersimpan kanonis sebelum memeriksanya terhadap kebijakan yang di-resolve.

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
    ```

    Utamakan `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, atau `upsertSessionEntry(...)` untuk workflow sesi. Helper ini mengalamatkan sesi berdasarkan identitas agen/sesi sehingga plugin tidak bergantung pada bentuk penyimpanan lama `sessions.json`. Gunakan `preserveActivity: true` untuk patch khusus metadata yang tidak boleh menyegarkan aktivitas sesi, dan `replaceEntry: true` hanya ketika callback mengembalikan entri lengkap dan field yang dihapus harus tetap terhapus.

    Untuk pembacaan dan penulisan transkrip, impor `openclaw/plugin-sdk/session-transcript-runtime` dan gunakan `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, atau `withSessionTranscriptWriteLock(...)` dengan `{ agentId, sessionKey, sessionId }`. API ini memungkinkan plugin mengidentifikasi transkrip, membaca event-nya, menambahkan pesan, menerbitkan pembaruan, dan menjalankan operasi terkait di bawah write lock transkrip yang sama. Teruskan `sessionFile` hanya saat mengadaptasi kode yang sudah menerima artefak transkrip aktif dan membutuhkan setiap helper untuk beroperasi pada artefak yang sama.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, dan `resolveSessionFilePath(...)` adalah helper kompatibilitas untuk plugin yang masih sengaja bergantung pada bentuk whole-store atau file transkrip lama. Kode plugin baru tidak boleh menggunakan helper tersebut, dan pemanggil yang ada sebaiknya bermigrasi ke helper entri.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Konstanta model dan penyedia default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Jalankan completion teks milik host tanpa mengimpor internal penyedia atau
    menduplikasi persiapan model/auth/base URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Helper ini menggunakan jalur persiapan simple-completion yang sama seperti runtime
    bawaan OpenClaw dan snapshot konfigurasi runtime milik host. Engine konteks
    menerima kapabilitas `llm.complete` yang terikat sesi, sehingga panggilan model menggunakan
    agen sesi aktif dan tidak diam-diam fallback ke agen default. Hasilnya
    menyertakan atribusi penyedia/model/agen plus penggunaan token,
    cache, dan estimasi biaya yang dinormalisasi ketika tersedia.

    <Warning>
    Override model memerlukan opt-in operator melalui `plugins.entries.<id>.llm.allowModelOverride: true` dalam konfigurasi. Gunakan `plugins.entries.<id>.llm.allowedModels` untuk membatasi plugin tepercaya ke target kanonis `provider/model` tertentu. Completion lintas-agen memerlukan `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Penggantian model (`provider`/`model`) memerlukan persetujuan operator melalui `plugins.entries.<id>.subagent.allowModelOverride: true` dalam konfigurasi. Plugin yang tidak tepercaya tetap dapat menjalankan subagent, tetapi permintaan penggantian akan ditolak.
    </Warning>

    `deleteSession(...)` dapat menghapus sesi yang dibuat oleh Plugin yang sama melalui `api.runtime.subagent.run(...)`. Menghapus sesi pengguna atau operator sembarang tetap memerlukan permintaan Gateway bercakupan admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Cantumkan node yang terhubung dan panggil perintah host node dari kode Plugin yang dimuat Gateway atau dari perintah CLI Plugin. Gunakan ini ketika Plugin memiliki pekerjaan lokal pada perangkat yang dipasangkan, misalnya browser atau jembatan audio di Mac lain.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Di dalam Gateway, runtime ini berada dalam proses. Dalam perintah CLI Plugin, runtime ini memanggil Gateway yang dikonfigurasi melalui RPC, sehingga perintah seperti `openclaw googlemeet recover-tab` dapat memeriksa node yang dipasangkan dari terminal. Perintah Node tetap melalui pemasangan node Gateway normal, daftar izin perintah, kebijakan pemanggilan node Plugin, dan penanganan perintah lokal node.

    Plugin yang mengekspos perintah host node berbahaya sebaiknya mendaftarkan kebijakan pemanggilan node dengan `api.registerNodeInvokePolicy(...)`. Kebijakan berjalan di Gateway setelah pemeriksaan daftar izin perintah dan sebelum perintah diteruskan ke node, sehingga pemanggilan `node.invoke` langsung dan alat Plugin tingkat lebih tinggi berbagi jalur penegakan yang sama.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Ikat runtime Alur Tugas ke kunci sesi OpenClaw yang sudah ada atau konteks alat tepercaya, lalu buat dan kelola Alur Tugas tanpa meneruskan pemilik pada setiap panggilan.

    Alur Tugas melacak status alur kerja multi-langkah yang tahan lama. Ini bukan penjadwal:
    gunakan Cron atau `api.session.workflow.scheduleSessionTurn(...)` untuk
    wakeup mendatang, lalu gunakan `managedFlows` dari giliran terjadwal ketika pekerjaan itu
    memerlukan status alur, tugas anak, penantian, atau pembatalan.

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

    Gunakan `bindSession({ sessionKey, requesterOrigin })` ketika Anda sudah memiliki kunci sesi OpenClaw tepercaya dari lapisan pengikatan Anda sendiri. Jangan mengikat dari input pengguna mentah.

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

    Menggunakan konfigurasi inti `messages.tts` dan pemilihan penyedia. Mengembalikan buffer audio PCM + laju sampel.

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
    `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas untuk `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Snapshot konfigurasi runtime saat ini dan penulisan konfigurasi transaksional. Utamakan
    konfigurasi yang sudah diteruskan ke jalur panggilan aktif; gunakan
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
    yang mencatat niat penulis tanpa mengambil alih kendali restart dari
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

    `runCommandWithTimeout(...)` mengembalikan `stdout` dan `stderr` yang ditangkap, jumlah
    pemotongan opsional, `code`, `signal`, `killed`, `termination`, dan
    `noOutputTimedOut`. Hasil timeout dan tanpa-output-timeout melaporkan `code: 124`
    ketika proses anak tidak menyediakan kode keluar bukan nol. Keluar karena sinyal
    selain timeout tetap dapat mengembalikan `code: null`, jadi gunakan `termination` dan
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
    Pencatatan log.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Resolusi autentikasi model dan penyedia.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolusi direktori status dan penyimpanan berkunci berbasis SQLite.

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

    Penyimpanan berkunci bertahan setelah mulai ulang dan diisolasi oleh id plugin yang terikat runtime. Gunakan `registerIfAbsent(...)` untuk klaim dedupe atomik: fungsi ini mengembalikan `true` saat kunci tidak ada atau sudah kedaluwarsa lalu didaftarkan, atau `false` saat nilai aktif sudah ada tanpa menimpa nilainya, waktu pembuatan, atau TTL. Batas: `maxEntries` per namespace, 6.000 baris aktif per plugin, nilai JSON di bawah 64KB, dan kedaluwarsa TTL opsional. Saat sebuah penulisan akan melampaui batas baris plugin, runtime dapat mengeluarkan baris aktif tertua dari namespace yang sedang ditulis; namespace saudara tidak dikeluarkan untuk penulisan tersebut, dan penulisan tetap gagal jika namespace tidak dapat membebaskan cukup baris.

    <Warning>
    Hanya plugin bawaan dalam rilis ini.
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
    Helper runtime khusus channel (tersedia saat plugin channel dimuat).

    `api.runtime.channel.media` adalah surface yang disarankan untuk pengunduhan dan penyimpanan media channel:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Gunakan `saveRemoteMedia(...)` saat URL jarak jauh harus menjadi media OpenClaw. Gunakan `saveResponseMedia(...)` saat plugin sudah mengambil `Response` dengan penanganan autentikasi, pengalihan, atau allowlist milik plugin. Gunakan `readRemoteMediaBuffer(...)` hanya saat plugin membutuhkan byte mentah untuk inspeksi, transformasi, dekripsi, atau unggah ulang. `fetchRemoteMedia(...)` tetap menjadi alias kompatibilitas yang sudah deprecated untuk `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` adalah surface kebijakan mention masuk bersama untuk plugin channel bawaan yang menggunakan injeksi runtime:

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

    `api.runtime.channel.mentions` sengaja tidak mengekspos helper kompatibilitas `resolveMentionGating*` yang lebih lama. Utamakan jalur `{ facts, policy }` yang ternormalisasi.

  </Accordion>
</AccordionGroup>

## Menyimpan referensi runtime

Gunakan `createPluginRuntimeStore` untuk menyimpan referensi runtime agar dapat digunakan di luar callback `register`:

<Steps>
  <Step title="Buat penyimpanan">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Hubungkan ke entry point">
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
  <Step title="Akses dari file lain">
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
Utamakan `pluginId` untuk identitas runtime-store. Bentuk `key` tingkat lebih rendah digunakan untuk kasus tidak umum ketika satu plugin sengaja membutuhkan lebih dari satu slot runtime.
</Note>

## Field `api` tingkat atas lainnya

Selain `api.runtime`, objek API juga menyediakan:

<ParamField path="api.id" type="string">
  Id plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nama tampilan plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot config saat ini (snapshot runtime dalam memori aktif saat tersedia).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Config khusus plugin dari `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger berskup (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entry penuh.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Menyelesaikan path relatif terhadap root plugin.
</ParamField>

## Terkait

- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan registry
- [Entry point SDK](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry`
- [Ringkasan SDK](/id/plugins/sdk-overview) — referensi subpath
