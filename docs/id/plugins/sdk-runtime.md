---
read_when:
    - Anda perlu memanggil helper inti dari sebuah Plugin (TTS, STT, pembuatan gambar, pencarian web, subagen, Node)
    - Anda ingin memahami apa yang diekspos oleh api.runtime
    - Anda sedang mengakses helper konfigurasi, agen, atau media dari kode Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- helper runtime yang diinjeksi yang tersedia untuk Plugin
title: Pembantu waktu proses Plugin
x-i18n:
    generated_at: "2026-04-30T10:03:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referensi untuk objek `api.runtime` yang disuntikkan ke setiap plugin selama pendaftaran. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/id/plugins/sdk-channel-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk plugin kanal.
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

## Pemuatan Dan Penulisan Konfigurasi

Utamakan konfigurasi yang sudah diteruskan ke jalur panggilan aktif, misalnya `api.config` selama pendaftaran atau argumen `cfg` pada callback kanal/penyedia. Ini menjaga satu snapshot proses tetap mengalir melalui pekerjaan alih-alih mem-parse ulang konfigurasi pada jalur panas.

Gunakan `api.runtime.config.current()` hanya ketika handler berumur panjang memerlukan snapshot proses saat ini dan tidak ada konfigurasi yang diteruskan ke fungsi tersebut. Nilai yang dikembalikan bersifat readonly; kloning atau gunakan helper mutasi sebelum mengedit.

Factory tool menerima `ctx.runtimeConfig` plus `ctx.getRuntimeConfig()`. Gunakan getter di dalam callback `execute` milik tool berumur panjang ketika konfigurasi dapat berubah setelah definisi tool dibuat.

Pertahankan perubahan dengan `api.runtime.config.mutateConfigFile(...)` atau `api.runtime.config.replaceConfigFile(...)`. Setiap penulisan harus memilih kebijakan `afterWrite` yang eksplisit:

- `afterWrite: { mode: "auto" }` membiarkan pemuat ulang gateway menentukan.
- `afterWrite: { mode: "restart", reason: "..." }` memaksa restart bersih ketika penulis mengetahui hot reload tidak aman.
- `afterWrite: { mode: "none", reason: "..." }` menekan reload/restart otomatis hanya ketika pemanggil memiliki tindak lanjutnya.

Helper mutasi mengembalikan `afterWrite` plus ringkasan `followUp` bertipe sehingga pemanggil dapat mencatat atau menguji apakah mereka meminta restart. Gateway tetap memiliki kendali kapan restart itu benar-benar terjadi.

`api.runtime.config.loadConfig()` dan `api.runtime.config.writeConfigFile(...)` adalah helper kompatibilitas yang sudah tidak digunakan lagi di bawah `runtime-config-load-write`. Helper ini memperingatkan sekali saat runtime, dan tetap tersedia untuk plugin eksternal lama selama jendela migrasi. Plugin bawaan tidak boleh menggunakannya; penjaga batas konfigurasi gagal jika kode plugin memanggilnya atau mengimpor helper tersebut dari subpath SDK plugin.

Untuk impor SDK langsung, gunakan subpath konfigurasi yang terfokus alih-alih barrel kompatibilitas luas
`openclaw/plugin-sdk/config-runtime`: `config-types` untuk
tipe, `plugin-config-runtime` untuk asersi konfigurasi yang sudah dimuat dan pencarian entri
plugin, `runtime-config-snapshot` untuk snapshot proses saat ini, dan
`config-mutation` untuk penulisan. Pengujian plugin bawaan harus mengejek subpath terfokus ini
secara langsung alih-alih mengejek barrel kompatibilitas luas.

Kode runtime internal OpenClaw memiliki arah yang sama: muat konfigurasi sekali pada batas CLI, Gateway, atau proses, lalu teruskan nilai tersebut. Penulisan mutasi yang berhasil menyegarkan snapshot runtime proses dan memajukan revisi internalnya; cache berumur panjang harus menggunakan kunci cache milik runtime alih-alih menserialisasi konfigurasi secara lokal. Modul runtime berumur panjang memiliki pemindai toleransi nol untuk panggilan `loadConfig()` ambient; gunakan `cfg` yang diteruskan, `context.getRuntimeConfig()` permintaan, atau `getRuntimeConfig()` pada batas proses yang eksplisit.

Jalur eksekusi penyedia dan kanal harus menggunakan snapshot konfigurasi runtime aktif, bukan snapshot file yang dikembalikan untuk pembacaan balik atau pengeditan konfigurasi. Snapshot file mempertahankan nilai sumber seperti marker SecretRef untuk UI dan penulisan; callback penyedia memerlukan tampilan runtime yang telah di-resolve. Ketika helper dapat dipanggil dengan snapshot sumber aktif atau snapshot runtime aktif, arahkan melalui `selectApplicableRuntimeConfig()` sebelum membaca kredensial.

## Namespace Runtime

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

    `runEmbeddedAgent(...)` adalah helper netral untuk memulai giliran agen OpenClaw normal dari kode plugin. Helper ini menggunakan resolusi penyedia/model dan pemilihan agent-harness yang sama seperti balasan yang dipicu kanal.

    `runEmbeddedPiAgent(...)` tetap sebagai alias kompatibilitas.

    `resolveThinkingPolicy(...)` mengembalikan tingkat berpikir yang didukung penyedia/model dan default opsional. Plugin penyedia memiliki profil khusus model melalui hook berpikirnya, jadi plugin tool harus memanggil helper runtime ini alih-alih mengimpor atau menduplikasi daftar penyedia.

    `normalizeThinkingLevel(...)` mengonversi teks pengguna seperti `on`, `x-high`, atau `extra high` ke tingkat tersimpan kanonis sebelum memeriksanya terhadap kebijakan yang telah di-resolve.

    **Helper penyimpanan sesi** berada di bawah `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Konstanta model dan penyedia default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Luncurkan dan kelola proses subagen latar belakang.

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
    Override model (`provider`/`model`) memerlukan opt-in operator melalui `plugins.entries.<id>.subagent.allowModelOverride: true` dalam konfigurasi. Plugin yang tidak tepercaya masih dapat menjalankan subagen, tetapi permintaan override ditolak.
    </Warning>

    `deleteSession(...)` dapat menghapus sesi yang dibuat oleh plugin yang sama melalui `api.runtime.subagent.run(...)`. Menghapus sesi pengguna atau operator sembarang tetap memerlukan permintaan Gateway dengan cakupan admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Cantumkan node yang terhubung dan panggil perintah yang di-host node dari kode plugin yang dimuat Gateway atau dari perintah CLI plugin. Gunakan ini ketika plugin memiliki pekerjaan lokal pada perangkat yang dipasangkan, misalnya browser atau bridge audio pada Mac lain.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Di dalam Gateway, runtime ini berjalan dalam proses. Dalam perintah CLI plugin, runtime ini memanggil Gateway yang dikonfigurasi melalui RPC, sehingga perintah seperti `openclaw googlemeet recover-tab` dapat memeriksa node yang dipasangkan dari terminal. Perintah node tetap melalui pemasangan node Gateway normal, allowlist perintah, kebijakan node-invoke plugin, dan penanganan perintah lokal node.

    Plugin yang mengekspos perintah host node berbahaya harus mendaftarkan kebijakan node-invoke dengan `api.registerNodeInvokePolicy(...)`. Kebijakan berjalan di Gateway setelah pemeriksaan allowlist perintah dan sebelum perintah diteruskan ke node, sehingga panggilan `node.invoke` langsung dan tool plugin tingkat lebih tinggi berbagi jalur penegakan yang sama.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Ikat runtime Task Flow ke kunci sesi OpenClaw yang ada atau konteks tool tepercaya, lalu buat dan kelola Task Flow tanpa meneruskan pemilik pada setiap panggilan.

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

    Gunakan `bindSession({ sessionKey, requesterOrigin })` ketika Anda sudah memiliki kunci sesi OpenClaw tepercaya dari lapisan binding Anda sendiri. Jangan mengikat dari input pengguna mentah.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesis text-to-speech.

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
    ```

    Mengembalikan `{ text: undefined }` ketika tidak ada keluaran yang dihasilkan (misalnya input dilewati).

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
    yang mencatat maksud penulis tanpa mengambil alih kontrol restart dari
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitas tingkat sistem.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Penyimpanan berkunci bertahan setelah restart dan diisolasi oleh id Plugin yang terikat runtime. Batas: `maxEntries` per namespace, 1.000 baris aktif per Plugin, nilai JSON di bawah 64 KB, dan kedaluwarsa TTL opsional.

    <Warning>
    Hanya Plugin bawaan dalam rilis ini.
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
    Helper runtime khusus kanal (tersedia ketika Plugin kanal dimuat).

    `api.runtime.channel.mentions` adalah permukaan kebijakan mention masuk bersama untuk Plugin kanal bawaan yang menggunakan injeksi runtime:

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
  <Step title="Hubungkan ke titik masuk">
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
Utamakan `pluginId` untuk identitas runtime-store. Bentuk `key` tingkat lebih rendah ditujukan untuk kasus tidak umum ketika satu Plugin secara sengaja membutuhkan lebih dari satu slot runtime.
</Note>

## Field `api` tingkat atas lainnya

Di luar `api.runtime`, objek API juga menyediakan:

<ParamField path="api.id" type="string">
  Id Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nama tampilan Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot konfigurasi saat ini (snapshot runtime dalam memori yang aktif jika tersedia).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger terskup (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Selesaikan path relatif terhadap root Plugin.
</ParamField>

## Terkait

- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan registry
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry`
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi subpath
