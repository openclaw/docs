---
read_when:
    - Anda perlu memanggil fungsi pembantu inti dari Plugin (TTS, STT, pembuatan gambar, pencarian web, subagen, Node)
    - Anda ingin memahami apa yang diekspos oleh api.runtime
    - Anda mengakses helper konfigurasi, agen, atau media dari kode Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- helper runtime yang diinjeksi dan tersedia untuk Plugin
title: Pembantu waktu eksekusi Plugin
x-i18n:
    generated_at: "2026-05-11T20:34:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referensi untuk objek `api.runtime` yang disuntikkan ke setiap plugin selama registrasi. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/id/plugins/sdk-channel-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk plugin channel.
  </Card>
  <Card title="Provider plugins" href="/id/plugins/sdk-provider-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk plugin provider.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Pemuatan dan penulisan konfigurasi

Utamakan konfigurasi yang sudah diteruskan ke jalur panggilan aktif, misalnya `api.config` saat registrasi atau argumen `cfg` pada callback channel/provider. Ini menjaga satu snapshot proses mengalir melalui pekerjaan alih-alih memparsing ulang konfigurasi pada hot path.

Gunakan `api.runtime.config.current()` hanya ketika handler yang berumur panjang memerlukan snapshot proses saat ini dan tidak ada konfigurasi yang diteruskan ke fungsi tersebut. Nilai yang dikembalikan bersifat readonly; clone atau gunakan helper mutasi sebelum mengedit.

Factory tool menerima `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gunakan getter di dalam callback `execute` milik tool yang berumur panjang ketika konfigurasi dapat berubah setelah definisi tool dibuat.

Pertahankan perubahan dengan `api.runtime.config.mutateConfigFile(...)` atau `api.runtime.config.replaceConfigFile(...)`. Setiap penulisan harus memilih kebijakan `afterWrite` yang eksplisit:

- `afterWrite: { mode: "auto" }` membiarkan pemuat ulang gateway menentukan.
- `afterWrite: { mode: "restart", reason: "..." }` memaksa restart bersih ketika penulis mengetahui hot reload tidak aman.
- `afterWrite: { mode: "none", reason: "..." }` menekan reload/restart otomatis hanya ketika pemanggil memiliki tindak lanjutnya.

Helper mutasi mengembalikan `afterWrite` plus ringkasan `followUp` bertipe agar pemanggil dapat mencatat log atau menguji apakah mereka meminta restart. Gateway tetap memiliki kewenangan atas kapan restart itu benar-benar terjadi.

`api.runtime.config.loadConfig()` dan `api.runtime.config.writeConfigFile(...)` adalah helper kompatibilitas yang sudah deprecated di bawah `runtime-config-load-write`. Keduanya memperingatkan sekali saat runtime, dan tetap tersedia untuk plugin eksternal lama selama jendela migrasi. Plugin bawaan tidak boleh menggunakannya; penjaga batas konfigurasi gagal jika kode plugin memanggilnya atau mengimpor helper tersebut dari subpath SDK plugin.

Untuk impor SDK langsung, gunakan subpath konfigurasi yang terfokus alih-alih barrel kompatibilitas luas
`openclaw/plugin-sdk/config-runtime`: `config-contracts` untuk
tipe, `plugin-config-runtime` untuk asersi konfigurasi yang sudah dimuat dan pencarian entri plugin,
`runtime-config-snapshot` untuk snapshot proses saat ini, dan
`config-mutation` untuk penulisan. Pengujian plugin bawaan harus me-mock subpath terfokus ini secara langsung alih-alih me-mock barrel kompatibilitas luas.

Kode runtime internal OpenClaw memiliki arah yang sama: muat konfigurasi sekali di batas CLI, gateway, atau proses, lalu teruskan nilai itu. Penulisan mutasi yang berhasil memperbarui snapshot runtime proses dan memajukan revisi internalnya; cache yang berumur panjang harus menggunakan kunci cache milik runtime alih-alih menserialisasi konfigurasi secara lokal. Modul runtime yang berumur panjang memiliki pemindai tanpa toleransi untuk panggilan ambient `loadConfig()`; gunakan `cfg` yang diteruskan, `context.getRuntimeConfig()` permintaan, atau `getRuntimeConfig()` pada batas proses eksplisit.

Jalur eksekusi provider dan channel harus menggunakan snapshot konfigurasi runtime aktif, bukan snapshot file yang dikembalikan untuk pembacaan ulang atau pengeditan konfigurasi. Snapshot file mempertahankan nilai sumber seperti marker SecretRef untuk UI dan penulisan; callback provider memerlukan tampilan runtime yang sudah di-resolve. Ketika helper dapat dipanggil dengan snapshot sumber aktif atau snapshot runtime aktif, rute melalui `selectApplicableRuntimeConfig()` sebelum membaca kredensial.

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

    `runEmbeddedAgent(...)` adalah helper netral untuk memulai giliran agent OpenClaw normal dari kode plugin. Helper ini menggunakan resolusi provider/model dan pemilihan agent-harness yang sama seperti balasan yang dipicu channel.

    `runEmbeddedPiAgent(...)` tetap menjadi alias kompatibilitas.

    `resolveThinkingPolicy(...)` mengembalikan tingkat thinking yang didukung provider/model dan default opsional. Plugin provider memiliki profil khusus model melalui hook thinking mereka, jadi plugin tool harus memanggil helper runtime ini alih-alih mengimpor atau menduplikasi daftar provider.

    `normalizeThinkingLevel(...)` mengonversi teks pengguna seperti `on`, `x-high`, atau `extra high` ke tingkat tersimpan kanonis sebelum memeriksanya terhadap kebijakan yang sudah di-resolve.

    **Helper penyimpanan sesi** berada di bawah `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Utamakan `updateSessionStore(...)` atau `updateSessionStoreEntry(...)` untuk penulisan runtime. Keduanya dirutekan melalui penulis session-store milik Gateway, mempertahankan pembaruan bersamaan, dan menggunakan ulang cache panas. `saveSessionStore(...)` tetap tersedia untuk kompatibilitas dan penulisan ulang bergaya pemeliharaan offline.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Konstanta model dan provider default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Jalankan text completion milik host tanpa mengimpor internal provider atau
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
    agent sesi aktif dan tidak diam-diam fallback ke agent default. Hasilnya
    mencakup atribusi provider/model/agent plus penggunaan token,
    cache, dan estimasi biaya yang dinormalisasi saat tersedia.

    <Warning>
    Override model memerlukan operator opt-in melalui `plugins.entries.<id>.llm.allowModelOverride: true` dalam konfigurasi. Gunakan `plugins.entries.<id>.llm.allowedModels` untuk membatasi plugin tepercaya ke target `provider/model` kanonis tertentu. Completion lintas-agent memerlukan `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Luncurkan dan kelola run subagent latar belakang.

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
    Override model (`provider`/`model`) memerlukan operator opt-in melalui `plugins.entries.<id>.subagent.allowModelOverride: true` dalam konfigurasi. Plugin tidak tepercaya tetap dapat menjalankan subagent, tetapi permintaan override ditolak.
    </Warning>

    `deleteSession(...)` dapat menghapus sesi yang dibuat oleh plugin yang sama melalui `api.runtime.subagent.run(...)`. Menghapus sesi pengguna atau operator sembarang tetap memerlukan permintaan Gateway dengan cakupan admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Daftar node yang terhubung dan panggil perintah node-host dari kode plugin yang dimuat Gateway atau dari perintah CLI plugin. Gunakan ini ketika plugin memiliki pekerjaan lokal pada perangkat yang dipasangkan, misalnya browser atau bridge audio di Mac lain.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Di dalam Gateway, runtime ini berada dalam proses. Dalam perintah CLI plugin, ia memanggil Gateway yang dikonfigurasi melalui RPC, sehingga perintah seperti `openclaw googlemeet recover-tab` dapat memeriksa node yang dipasangkan dari terminal. Perintah Node tetap melalui pairing node Gateway normal, allowlist perintah, kebijakan node-invoke plugin, dan penanganan perintah lokal node.

    Plugin yang mengekspos perintah node-host berbahaya harus mendaftarkan kebijakan node-invoke dengan `api.registerNodeInvokePolicy(...)`. Kebijakan berjalan di Gateway setelah pemeriksaan allowlist perintah dan sebelum perintah diteruskan ke node, sehingga panggilan `node.invoke` langsung dan tool plugin tingkat lebih tinggi berbagi jalur penegakan yang sama.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Ikat runtime Task Flow ke kunci sesi OpenClaw yang ada atau konteks tool tepercaya, lalu buat dan kelola Task Flow tanpa meneruskan owner pada setiap panggilan.

    Task Flow melacak state workflow multi-langkah yang tahan lama. Ini bukan scheduler:
    gunakan Cron atau `api.session.workflow.scheduleSessionTurn(...)` untuk wakeup
    masa depan, lalu gunakan `managedFlows` dari giliran terjadwal ketika pekerjaan itu
    memerlukan state flow, child task, penantian, atau pembatalan.

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

    Gunakan `bindSession({ sessionKey, requesterOrigin })` ketika Anda sudah memiliki kunci sesi OpenClaw tepercaya dari lapisan binding Anda sendiri. Jangan lakukan binding dari input pengguna mentah.

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
    `current()` hanya ketika handler membutuhkan snapshot proses secara langsung.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` dan `replaceConfigFile(...)` mengembalikan nilai `followUp`,
    misalnya `{ mode: "restart", requiresRestart: true, reason }`,
    yang mencatat intensi penulis tanpa mengambil alih kontrol restart dari
    Gateway.

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
    Resolusi direktori state dan penyimpanan berbasis kunci yang didukung SQLite.

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

    Penyimpanan berbasis kunci tetap bertahan setelah restart dan diisolasi oleh id Plugin yang terikat runtime. Gunakan `registerIfAbsent(...)` untuk klaim deduplikasi atomik: fungsi ini mengembalikan `true` ketika kunci tidak ada atau sudah kedaluwarsa dan didaftarkan, atau `false` ketika nilai aktif sudah ada tanpa menimpa nilainya, waktu pembuatannya, atau TTL. Batasan: `maxEntries` per namespace, 1.000 baris aktif per Plugin, nilai JSON di bawah 64KB, dan kedaluwarsa TTL opsional.

    <Warning>
    Hanya Plugin bundel dalam rilis ini.
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
    Helper runtime khusus channel (tersedia ketika Plugin channel dimuat).

    `api.runtime.channel.mentions` adalah surface kebijakan mention inbound bersama untuk Plugin channel bundel yang menggunakan injeksi runtime:

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
Utamakan `pluginId` untuk identitas runtime-store. Bentuk `key` tingkat lebih rendah ditujukan untuk kasus yang jarang, ketika satu Plugin secara sengaja membutuhkan lebih dari satu slot runtime.
</Note>

## Field `api` tingkat atas lainnya

Selain `api.runtime`, objek API juga menyediakan:

<ParamField path="api.id" type="string">
  ID Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nama tampilan Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot konfigurasi saat ini (snapshot runtime dalam memori yang aktif bila tersedia).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger dengan cakupan (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/penyiapan ringan sebelum entri penuh.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Selesaikan path relatif terhadap root Plugin.
</ParamField>

## Terkait

- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan registri
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry`
- [Ringkasan SDK](/id/plugins/sdk-overview) — referensi subpath
