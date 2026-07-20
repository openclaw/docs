---
read_when:
    - Anda perlu memanggil helper inti dari plugin (TTS, STT, pembuatan gambar, pencarian web, Gateway, subagen, node)
    - Anda ingin memahami apa yang diekspos oleh api.runtime
    - Anda mengakses pembantu konfigurasi, agen, atau media dari kode plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- helper runtime yang diinjeksi dan tersedia untuk plugin
title: Pembantu runtime Plugin
x-i18n:
    generated_at: "2026-07-20T03:53:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 197ccf047ccefddbd515ace9f1ce195e998f3fbafcb65ee80282bf67f0c6ab8d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referensi untuk objek `api.runtime` yang disuntikkan ke setiap plugin selama pendaftaran. Gunakan pembantu ini alih-alih mengimpor internal host secara langsung.

<CardGroup cols={2}>
  <Card title="Plugin saluran" href="/id/plugins/sdk-channel-plugins">
    Panduan langkah demi langkah yang menggunakan pembantu ini dalam konteks untuk plugin saluran.
  </Card>
  <Card title="Plugin penyedia" href="/id/plugins/sdk-provider-plugins">
    Panduan langkah demi langkah yang menggunakan pembantu ini dalam konteks untuk plugin penyedia.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` adalah versi produk OpenClaw saat ini, yang bersumber dari resolver versi bersama agar plugin melihat nilai yang sama dengan yang dilaporkan CLI.

## Pemuatan dan penulisan konfigurasi

Utamakan konfigurasi yang sudah diteruskan ke jalur pemanggilan aktif, misalnya `api.config` selama pendaftaran atau argumen `cfg` pada callback saluran/penyedia. Ini menjaga satu snapshot proses tetap mengalir sepanjang pekerjaan, alih-alih mengurai ulang konfigurasi pada jalur kritis.

Gunakan `api.runtime.config.current()` hanya ketika handler berumur panjang memerlukan snapshot proses saat ini dan tidak ada konfigurasi yang diteruskan ke fungsi tersebut. Nilai yang dikembalikan bersifat hanya-baca; klon atau gunakan pembantu mutasi sebelum mengeditnya.

Factory alat menerima `ctx.runtimeConfig` beserta `ctx.getRuntimeConfig()`. Gunakan getter di dalam callback `execute` milik alat berumur panjang ketika konfigurasi dapat berubah setelah definisi alat dibuat.

Persistenkan perubahan dengan `api.runtime.config.mutateConfigFile(...)` atau `api.runtime.config.replaceConfigFile(...)`. Setiap penulisan harus memilih kebijakan `afterWrite` secara eksplisit:

- `afterWrite: { mode: "auto" }` membiarkan perencana pemuatan ulang Gateway mengambil keputusan.
- `afterWrite: { mode: "restart", reason: "..." }` memaksa mulai ulang bersih ketika penulis mengetahui bahwa pemuatan ulang langsung tidak aman.
- `afterWrite: { mode: "none", reason: "..." }` menekan pemuatan ulang/mulai ulang otomatis hanya ketika pemanggil menangani tindak lanjutnya.

Pembantu mutasi mengembalikan `afterWrite` beserta ringkasan `followUp` bertipe agar pemanggil dapat mencatat atau menguji apakah mereka meminta mulai ulang. Gateway tetap menentukan kapan mulai ulang tersebut benar-benar terjadi.

Gunakan `current()`, `cfg` yang diteruskan, `mutateConfigFile(...)`, atau
`replaceConfigFile(...)` untuk akses dan penulisan konfigurasi runtime.

Untuk impor SDK langsung, utamakan subjalur konfigurasi terfokus daripada barrel kompatibilitas `openclaw/plugin-sdk/config-runtime` yang luas: `config-contracts` untuk tipe, `runtime-config-snapshot` untuk snapshot proses saat ini, dan `config-mutation` untuk penulisan. Baca nilai yang tercakup pada entri dari `api.pluginConfig`; gunakan konteks alat yang disediakan hanya untuk snapshot konfigurasi seluruh runtime, dan pertahankan penggabungan khusus plugin pada batas tersebut. Pengujian plugin terbundel harus memalsukan subjalur terfokus ini secara langsung, bukan memalsukan barrel kompatibilitas yang luas.

Kode runtime internal OpenClaw mengikuti arah yang sama: muat konfigurasi sekali pada batas CLI, Gateway, atau proses, lalu teruskan nilai tersebut. Penulisan mutasi yang berhasil menyegarkan snapshot runtime proses dan memajukan revisi internalnya; cache berumur panjang harus menggunakan kunci cache milik runtime, bukan menserialkan konfigurasi secara lokal. Modul runtime berumur panjang memiliki pemindai tanpa toleransi untuk pemanggilan `loadConfig()` ambien; gunakan `cfg` yang diteruskan, `context.getRuntimeConfig()` permintaan, atau `getRuntimeConfig()` pada batas proses yang eksplisit.

Jalur eksekusi penyedia dan saluran harus menggunakan snapshot konfigurasi runtime aktif, bukan snapshot berkas yang dikembalikan untuk pembacaan kembali atau pengeditan konfigurasi. Snapshot berkas mempertahankan nilai sumber seperti penanda SecretRef untuk UI dan penulisan; callback penyedia memerlukan tampilan runtime yang telah di-resolve. Ketika pembantu dapat dipanggil dengan snapshot sumber aktif maupun snapshot runtime aktif, rutekan melalui `selectApplicableRuntimeConfig()` sebelum membaca kredensial.

## Utilitas runtime yang dapat digunakan kembali

Gunakan fakta `botLoopProtection` masuk untuk pesan masuk yang dibuat oleh bot. Core menerapkan pengaman jendela bergeser dalam memori bersama sebelum pencatatan dan pengiriman sesi, tanpa mengikat kebijakan tersebut ke satu saluran. Pengaman melacak kunci `(scopeId, conversationId, participant pair)`, menghitung kedua arah suatu pasangan bersama-sama, menerapkan masa jeda setelah anggaran jendela terlampaui, dan memangkas entri yang tidak aktif secara oportunistis.

Plugin saluran yang mengekspos perilaku ini kepada operator harus mengutamakan bentuk `channels.defaults.botLoopProtection` bersama untuk anggaran dasar, lalu menerapkan penggantian khusus saluran/penyedia di atasnya. Konfigurasi bersama menggunakan detik karena ditampilkan kepada pengguna:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Teruskan fakta pasangan bot yang telah dinormalisasi bersama giliran yang telah di-resolve. Core me-resolve nilai default, konversi satuan, dan semantik `enabled`:

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

Gunakan `openclaw/plugin-sdk/pair-loop-guard-runtime` secara langsung hanya untuk perulangan peristiwa
dua pihak khusus yang tidak melewati runner balasan masuk bersama.

## Namespace runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identitas agen, direktori, dan pengelolaan sesi.

    ```typescript
    // Resolve the agent's working directory (agentId is required)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

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
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` adalah pembantu netral untuk memulai giliran agen OpenClaw normal dari kode plugin. Pembantu ini menggunakan resolusi penyedia/model dan pemilihan harness agen yang sama seperti balasan yang dipicu saluran.

    `runEmbeddedPiAgent(...)` tetap tersedia sebagai alias kompatibilitas usang untuk plugin yang sudah ada. Kode baru harus menggunakan `runEmbeddedAgent(...)`.

    `resolveCliBackendDispatchEligibility({ provider, model, agentId, authProfileId, config, agentDir, workspaceDir })` membagikan keputusan pengiriman backend CLI milik runner tertanam (rute, kapabilitas `subscriptionAuthDispatch` yang dideklarasikan backend, mode kredensial tersimpan—dengan menghormati `authProfileId` yang disematkan secara eksplisit) kepada pemanggil yang menyertakan eksekusi tertanam dalam `cliBackendDispatch: "subscription-auth"`. Ini mengembalikan `{ provider }` ketika eksekusi akan dijalankan melalui backend CLI dan `undefined` ketika tetap berada pada penerusan langsung, sehingga pemanggil dapat menganggarkan batas waktu untuk eksekusi yang benar-benar akan dijalankan.

    `resolveThinkingPolicy(...)` mengembalikan tingkat penalaran yang didukung penyedia/model beserta nilai default opsional. Plugin penyedia memiliki profil khusus model melalui hook penalarannya, sehingga plugin alat harus memanggil pembantu runtime ini alih-alih mengimpor atau menduplikasi daftar penyedia.

    `normalizeThinkingLevel(...)` mengonversi teks pengguna seperti `on`, `x-high`, atau `extra high` menjadi tingkat tersimpan kanonis sebelum memeriksanya terhadap kebijakan yang telah di-resolve.

    **Pembantu penyimpanan sesi** berada di bawah `api.runtime.agent.session`:

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

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    Utamakan `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, atau `upsertSessionEntry(...)` untuk alur kerja sesi. Pembantu ini mengakses sesi berdasarkan identitas agen/sesi agar plugin tidak bergantung pada bentuk penyimpanan `sessions.json` lama. Gunakan `preserveActivity: true` untuk patch khusus metadata yang tidak boleh menyegarkan aktivitas sesi, dan `replaceEntry: true` hanya ketika callback mengembalikan entri lengkap dan kolom yang dihapus harus tetap terhapus. Jalur Doctor dan migrasi dapat menggabungkan `fallbackEntry`, `skipMaintenance`, dan `requireWriteSuccess` untuk satu perbaikan penyimpanan kanonis yang atomik.

    `createSessionEntry(...)` membuat baris sesi kanonis dan transkrip baru. Permukaan `initialEntry` tepercayanya sengaja dibuat terbatas: `agentHarnessId` yang tidak kosong, `modelSelectionLocked: true` opsional, dan `pluginExtensions` opsional. Runtime yang disuntikkan hanya menerima ID harness yang dimiliki plugin pemanggil melalui `registerAgentHarness(...)`; ini merupakan invarian kepemilikan, bukan sandbox di antara plugin dalam proses. Runtime menolak baris yang sudah ada; `label` dan `spawnedCwd` adalah kolom pembuatan terpisah, bukan patch entri tepercaya.

    Pembuatan menahan pagar mutasi siklus hidup sesi melalui `afterCreate`, sehingga pekerjaan baru menunggu inisialisasi milik plugin selesai dan pekerjaan yang telah diterima sebelumnya menyebabkan pembuatan gagal. Callback menerima klon status yang dibuat. Jika mengembalikan patch, patch tersebut hanya boleh berisi `pluginExtensions`, dan nilainya merupakan kolom `pluginExtensions` final yang lengkap. Kegagalan callback atau persistensi final mengembalikan baris dan transkrip baru yang tidak berubah ke keadaan semula; pengembalian terlindungi mempertahankan baris yang diubah atau diklaim secara bersamaan. `recoverMatchingInitialEntry: true` hanya digunakan untuk mencoba kembali inisialisasi yang terinterupsi ketika kolom tepercaya yang dipersistenkan cocok persis, dan pemulihan mengharuskan `afterCreate` mengembalikan patch final.

    Gunakan `runWithWorkAdmission(...)` ketika plugin memulai pekerjaan pada sesi yang dipersistenkan. Callback menolak sesi yang diarsipkan atau diganti secara bersamaan, menjaga koordinasi mutasi arsip/reset/hapus hingga selesai, dan menerima `AbortSignal` yang harus diteruskan ke eksekusi agen. Harness dapat secara eksplisit menentukan delegasi eksekusi tepercaya melalui kolom pendaftaran eksperimental `delegatedExecutionPluginIds`. Delegasi hanya dapat menerima dan menjalankan sesi persis yang sudah ada dan modelnya terkunci; semua mutasi sesi tetap dibatasi untuk pemilik harness. Lihat [Plugin harness agen](/id/plugins/sdk-agent-harness#delegated-execution).

    Plugin pemeliharaan dan perbaikan dapat menggunakan `deleteSessionEntry(...)` untuk satu entri sesi dengan cakupan tertentu, `cleanupSessionLifecycleArtifacts(...)` untuk sesi sementara yang dimiliki siklus hidup, dan `resolveSessionStoreBackupPaths(...)` sebelum memutasi penyimpanan. Teruskan `expectedSessionId` dan `expectedUpdatedAt` ketika penghapusan tidak boleh berpacu dengan pembaruan sesi yang berlangsung bersamaan; gunakan `expectedSessionId: null` ketika snapshot sebelumnya tidak memiliki id sesi. Helper ini merupakan permukaan perbaikan/siklus hidup yang terbatas, bukan API penghapusan penyimpanan umum.

    `resolveStorePath(...)` dan `updateSessionStoreEntry(...)` melengkapi helper sesi: `resolveStorePath` menyelesaikan jalur penyimpanan sesi untuk cakupan tertentu, dan `updateSessionStoreEntry({ storePath, sessionKey, update })` menambal satu entri secara langsung berdasarkan jalur penyimpanan ketika pemanggil sudah mengetahuinya.

    `loadTranscriptEventsSync(...)` tersedia untuk jalur doctor dan perbaikan sinkron yang tidak dapat menggunakan runtime transkrip asinkron. Ini mengembalikan rekaman `SessionStoreTranscriptEvent` mentah. Kode runtime Plugin normal sebaiknya menggunakan `openclaw/plugin-sdk/session-transcript-runtime`.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)`, dan `sqliteSessionFileMarkerMatchesSession(...)` adalah helper transisional untuk kode yang masih menerima bidang lama bernama `sessionFile`. Penanda SQLite yang telah diurai mengidentifikasi target transkrip SQLite aktif; penanda tersebut bukan jalur sistem berkas. API baru sebaiknya membawa identitas sesi bertipe alih-alih string penanda.

    Untuk membaca dan menulis transkrip, impor `openclaw/plugin-sdk/session-transcript-runtime` dan gunakan `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readSessionTranscriptRawDelta(...)`, `readSessionTranscriptVisibleMessageDelta(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, atau `withSessionTranscriptWriteLock(...)` dengan `{ agentId, sessionKey, sessionId }`. API ini memungkinkan Plugin mengidentifikasi transkrip, membaca peristiwa mentah atau entri pesan terlihat yang aman terhadap percabangan, menambahkan pesan, memublikasikan pembaruan, dan menjalankan operasi terkait di bawah kunci tulis transkrip yang sama tanpa bergantung pada jalur berkas transkrip aktif. `readVisibleSessionTranscriptMessageEntries(...)` mengembalikan metadata pembacaan yang terurut; bidang `seq` miliknya bukan kursor yang dapat dilanjutkan.

    `readSessionTranscriptRawDelta(...)` mengembalikan hasil `page`, `reset`, atau `missing` yang dibatasi. Teruskan `page.cursor` opak ke pemanggilan berikutnya. Penambahan murni mempertahankan kursor, sedangkan penggantian transkrip mengembalikan `reset` dengan kursor bootstrap baru. Halaman secara default memuat 1,000 peristiwa dan 1,000,000 byte terserialisasi; pemanggil dapat meminta hingga 10,000 peristiwa dan 64 MiB. Ketika peristiwa berikutnya saja melebihi `maxBytes`, halaman menjadi kosong dan melaporkan `requiredBytes`; coba lagi dengan setidaknya batas byte tersebut apabila nilainya tidak lebih dari 64 MiB. Peristiwa individual yang lebih besar memerlukan API pembacaan lengkap. Kursor hanya mengidentifikasi posisi dan tidak pernah memberikan akses ke sesi lain.

    `readSessionTranscriptVisibleMessageDelta(...)` menyediakan bentuk bootstrap-dan-lanjutkan terbatas yang sama untuk proyeksi pesan aktif milik host. Ini mengembalikan pesan dari yang paling lama hingga paling baru, sehingga mesin konteks dapat menguras riwayat awal dan menyimpan kursor opak sebagai penanda batasnya. Simpan dan kembalikan kursor tanpa perubahan; kursor tersebut merupakan petunjuk kelanjutan, bukan kredensial otorisasi. Penambahan linear dilanjutkan setelah pesan terakhir yang dikembalikan. Penggantian transkrip, kursor yang jangkarnya keluar atau berpindah di dalam cabang aktif, kursor yang salah format, dan kursor lintas sesi mengembalikan `reset` dengan kursor bootstrap baru. Nilai default dan batas jumlah serta byte sama dengan API delta mentah. Saat proyeksi aktif sedang dibangun ulang setelah perubahan cabang, hasilnya adalah `unavailable` dengan alasan `projection_rebuilding`; coba lagi nanti alih-alih beralih ke berkas transkrip aktif sebagai fallback.

    Helper lama untuk seluruh penyimpanan dan berkas transkrip aktif tidak lagi diekspor dari SDK Plugin. Gunakan helper entri bercakupan untuk metadata sesi dan helper identitas transkrip untuk operasi transkrip aktif. Alur kerja arsip/dukungan yang memerlukan artefak berkas sebaiknya menggunakan permukaan arsip khususnya, bukan API runtime sesi aktif.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Konstanta model dan penyedia default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // misalnya "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // misalnya "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Jalankan penyelesaian teks milik host tanpa mengimpor internal penyedia atau
    menduplikasi persiapan model/autentikasi/URL dasar OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Ringkas transkrip ini." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
      reasoning: "high",
    });
    ```

    Orkestrasi penyedia juga dapat memperoleh siklus hidup layanan lokal yang
    dikonfigurasi sebelum mengirim permintaan HTTP:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // Kirim dan konsumsi sepenuhnya permintaan penyedia.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` adalah kontrak SDK layanan penyedia yang stabil dan
    generik. Host menyelesaikan konfigurasi proses dari
    `models.providers.<providerId>.localService`; pemanggil tidak dapat menyediakan
    perintah, argumen, lingkungan, atau kebijakan siklus hidup. Pemunculan proses,
    kesiapan, diagnostik, dan kebijakan penghentian saat menganggur tetap menjadi bagian internal host.

    Teruskan id penyedia terkonfigurasi dan URL dasar permintaan yang telah diselesaikan secara persis. Jangan
    mengganti alias dengan id adaptor: alias yang berbeda dapat menunjuk ke host
    GPU lokal yang berbeda. Host menolak endpoint yang tidak cocok dengan URL dasar
    penyedia yang dikonfigurasi, kecuali normalisasi `/v1` yang digunakan oleh adaptor Ollama dan LM
    Studio. Host memiliki serialisasi awal, pemeriksaan kesiapan,
    lease permintaan, penanganan pembatalan, dan penghentian saat menganggur.

    Helper menggunakan jalur persiapan penyelesaian sederhana yang sama dengan runtime
    bawaan OpenClaw dan snapshot konfigurasi runtime milik host. Mesin konteks
    menerima kapabilitas `llm.complete` yang terikat ke sesi, sehingga pemanggilan model menggunakan
    agen sesi aktif dan tidak secara diam-diam beralih ke agen default. Hasilnya
    mencakup atribusi penyedia/model/agen beserta penggunaan token,
    cache, dan estimasi biaya yang dinormalisasi jika tersedia.

    Tetapkan `reasoning` untuk meminta tingkat upaya penalaran bagi model yang dipilih. Host
    menormalisasi tingkat pemikiran kanonis (`off`, `minimal`, `low`,
    `medium`, `high`, `xhigh`, `adaptive`, `max`, dan `ultra`) untuk
    penyedia dan model yang dipilih sebelum mengirim penyelesaian. `adaptive` menjadi
    `medium`; `max` dan `ultra` menjadi `max` jika didukung, jika tidak menjadi `xhigh`.

    <Warning>
    Penggantian model memerlukan persetujuan operator melalui `plugins.entries.<id>.llm.allowModelOverride: true` dalam konfigurasi. Gunakan `plugins.entries.<id>.llm.allowedModels` untuk membatasi Plugin tepercaya ke target `provider/model` kanonis tertentu. Penyelesaian lintas agen memerlukan `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Panggil metode Gateway lain dalam proses sambil mempertahankan identitas runtime tepercaya
    Plugin saat ini. Ini ditujukan untuk Plugin resmi bawaan atau tepercaya yang menyusun kapabilitas
    Gateway milik Plugin tanpa membuka koneksi WebSocket loopback.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    Permintaan menggunakan cakupan `operator.write` dan tidak memberikan cakupan admin. Pemanggilan dari Plugin eksternal
    arbitrer ditolak. Metode yang gagal melempar `GatewayClientRequestError`, dengan mempertahankan
    `details` terstruktur, metadata percobaan ulang, dan kode kesalahan Gateway untuk alur pemulihan. Gunakan `isAvailable()`
    sebelum memilih jalur ini dari alat yang juga dapat berjalan dalam proses agen mandiri.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Luncurkan dan kelola proses subagen di latar belakang.

    ```typescript
    // Mulai proses subagen
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Kembangkan kueri ini menjadi pencarian tindak lanjut yang terfokus.",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // penggantian opsional
      model: "gpt-5.6-sol", // penggantian opsional
      deliver: false,
    });

    // Tunggu hingga selesai
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Baca pesan sesi
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Hapus sesi
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Penggantian model (`provider`/`model`) memerlukan persetujuan operator melalui `plugins.entries.<id>.subagent.allowModelOverride: true` dalam konfigurasi. Plugin yang tidak tepercaya tetap dapat menjalankan subagen, tetapi permintaan penggantian ditolak.
    </Warning>

    `toolsAlsoAllow` menambahkan alat yang tepat dan dimiliki secara unik, yang didaftarkan oleh Plugin pemanggil, ke permukaan alat normal pekerja. Runtime menolak alat inti dan nama yang digunakan bersama dengan Plugin lain. Profil dan kebijakan alat operator tetap berlaku, termasuk daftar izin dan penolakan eksplisit.

    `deleteSession(...)` dapat menghapus sesi yang dibuat oleh Plugin yang sama melalui `api.runtime.subagent.run(...)`. Menghapus sesi pengguna atau operator arbitrer tetap memerlukan permintaan Gateway bercakupan admin.

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    Periksa otoritas ruang kerja sandbox efektif untuk sesi agen.

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    Hasilnya melaporkan apakah sesi ini berada dalam sandbox, apakah ruang kerjanya
    tidak tersedia, hanya-baca, atau dapat ditulis, serta `confinementError` opsional
    ketika kebijakan Docker, alat, sesi, browser, atau hak istimewa yang efektif dapat
    keluar dari ruang kerja tersebut. Gunakan ini untuk keputusan delegasi milik host yang
    tidak boleh memberi pekerja otoritas lebih besar daripada pemanggilnya. Ini adalah helper
    pengesahan, bukan pengganti pemeriksaan otorisasi pemanggil sendiri.

    `prepareWorkspaceAuthority(...)` menjalankan pemeriksaan kebijakan yang sama dan juga
    menyiapkan sandbox Docker untuk `workspaceDir`. Ini menolak kontainer aktif
    yang hash konfigurasi langsungnya tidak cocok dengan mount atau kebijakan yang diminta. Teruskan
    hanya nama alat persis yang implementasi terdaftarnya dibatasi oleh Plugin
    pemanggil; prefiks wildcard tidak membuktikan kepemilikan alat.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Cantumkan Node yang terhubung dan panggil perintah host Node dari kode Plugin yang dimuat Gateway atau dari perintah CLI Plugin. Gunakan ini ketika Plugin memiliki pekerjaan lokal pada perangkat yang dipasangkan, misalnya bridge browser atau audio pada Mac lain.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` mencakup deskriptor `nodePluginTools` yang diumumkan oleh
    setiap Node yang terhubung ketika Node tersebut mengekspos alat yang didukung Plugin atau MCP
    kepada agen. Deskriptor tersebut merupakan status koneksi langsung: Gateway
    menghapusnya ketika Node terputus, dan Node dapat menggantinya dengan
    `node.pluginTools.update` setelah inventaris Plugin/MCP lokal berubah.

    Di dalam Gateway, runtime ini berjalan dalam proses. Dalam perintah CLI plugin, runtime ini memanggil Gateway yang dikonfigurasi melalui RPC, sehingga perintah seperti `openclaw googlemeet recover-tab` dapat memeriksa node yang dipasangkan dari terminal. Perintah Node tetap melewati pemasangan node Gateway normal, daftar izin perintah, kebijakan pemanggilan node plugin, dan penanganan perintah lokal node.

    Plugin yang mengekspos alat agen yang dihosting di node dapat menetapkan `agentTool.defaultPlatforms` untuk perintah tidak berbahaya yang secara default harus dimasukkan ke daftar izin. Hilangkan jika operator harus memilih untuk mengaktifkannya dengan `gateway.nodes.allowCommands`. Perintah host node yang berbahaya harus mendaftarkan kebijakan pemanggilan node dengan `api.registerNodeInvokePolicy(...)`; kebijakan tersebut berjalan di Gateway setelah pemeriksaan daftar izin perintah dan sebelum perintah diteruskan ke node, sehingga pemanggilan langsung `node.invoke`, alat plugin yang dihosting di node, dan alat plugin tingkat tinggi menggunakan jalur penegakan yang sama.

    <Warning>
    Bidang opsional `scopes` meminta cakupan operator Gateway untuk pemanggilan tersebut. OpenClaw hanya menghormatinya untuk plugin bawaan dan instalasi plugin resmi tepercaya; permintaan dari plugin lain tidak meningkatkan hak akses pemanggilan. Gunakan hanya jika plugin tepercaya harus memanggil perintah node dengan cakupan Gateway yang lebih ketat, seperti `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Kaitkan status Task Flow dan Task Run ke kunci sesi OpenClaw yang sudah ada atau konteks alat tepercaya.

    - `api.runtime.tasks.managedFlows` mampu melakukan mutasi: membuat, memajukan, dan membatalkan Task Flow.
    - `api.runtime.tasks.flows` dan `api.runtime.tasks.runs` adalah tampilan DTO hanya-baca untuk pencantuman dan pencarian status; keduanya mengekspos `bindSession(...)` / `fromToolContext(...)` serta `get`, `list`, `findLatest`, dan `resolve`.

    Task Flow melacak status alur kerja multi-langkah yang persisten. Ini bukan penjadwal:
    gunakan Cron atau `api.session.workflow.scheduleSessionTurn(...)` untuk pengaktifan
    mendatang, lalu gunakan `managedFlows` dari giliran terjadwal saat pekerjaan tersebut
    memerlukan status alur, tugas anak, penantian, atau pembatalan.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Tinjau pull request baru",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Tinjau PR #123",
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

    Gunakan `bindSession({ sessionKey, requesterOrigin })` jika Anda sudah memiliki kunci sesi OpenClaw tepercaya dari lapisan pengaitan Anda sendiri. Jangan mengaitkan dari masukan mentah pengguna.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesis teks ke ucapan.

    ```typescript
    // TTS standar
    const clip = await api.runtime.tts.textToSpeech({
      text: "Halo dari OpenClaw",
      cfg: api.config,
    });

    // TTS yang dioptimalkan untuk telefoni
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Halo dari OpenClaw",
      cfg: api.config,
    });

    // Cantumkan suara yang tersedia
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Menggunakan konfigurasi inti `messages.tts` dan pemilihan penyedia. Mengembalikan buffer audio PCM + laju sampel. `textToSpeechStream` juga tersedia untuk sintesis streaming.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analisis gambar, audio, dan video.

    ```typescript
    // Deskripsikan gambar
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transkripsikan audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // opsional, ketika MIME tidak dapat disimpulkan
    });

    // Deskripsikan video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Analisis file generik
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Ekstraksi gambar terstruktur melalui penyedia/model tertentu.
    // Sertakan setidaknya satu gambar; masukan teks merupakan konteks tambahan.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Utamakan total yang dicetak daripada catatan tulisan tangan." },
      ],
      instructions: "Ekstrak vendor, total, dan tag yang dapat dicari.",
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

    Mengembalikan `{ text: undefined }` ketika tidak ada keluaran yang dihasilkan (misalnya masukan dilewati).

    `describeImageFileWithModel(...)` mendeskripsikan gambar yang sudah diketahui melalui penyedia/model tertentu, dengan melewati resolusi model aktif default yang digunakan oleh `describeImageFile(...)`.

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Pembuatan gambar.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Robot yang melukis matahari terbenam",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    Pembuatan video, mengikuti struktur pembuatan gambar.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "Rekaman drone yang terbang di atas garis pantai saat matahari terbit",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Pembuatan musik, mengikuti struktur pembuatan gambar.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "Trek lo-fi ceria untuk sesi pemrograman",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Pencarian web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "SDK plugin OpenClaw", count: 5 },
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
    konfigurasi yang sudah diteruskan ke jalur pemanggilan aktif; gunakan
    `current()` hanya jika penangan memerlukan snapshot proses secara langsung.

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
    yang mencatat maksud penulis tanpa mengambil alih kendali mulai ulang dari
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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Alias kompatibilitas yang tidak digunakan lagi.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` menjalankan satu siklus Heartbeat dengan segera, melewati pewaktu penggabungan normal. Teruskan `{ heartbeat: { target: "last" } }` untuk memaksa pengiriman ke saluran aktif terakhir, bukan menggunakan penekanan `target: "none"` default.

    `runCommandWithTimeout(...)` mengembalikan `stdout` dan `stderr` yang direkam, jumlah
    pemotongan opsional, `code`, `signal`, `killed`, `termination`, dan
    `noOutputTimedOut`. Hasil batas waktu dan batas waktu tanpa keluaran melaporkan `code: 124`
    ketika proses anak tidak memberikan kode keluar bukan nol. Keluar karena sinyal
    tanpa batas waktu masih dapat mengembalikan `code: null`, jadi gunakan `termination` dan
    `noOutputTimedOut` untuk membedakan alasan batas waktu.

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

    // Autentikasi yang siap digunakan untuk permintaan, termasuk pertukaran runtime penyedia (misalnya penyegaran OAuth)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolusi direktori status dan penyimpanan berkunci yang didukung SQLite.

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
    await store.deleteIf?.("key-1", (current) => current.value === "hello");
    await store.consume("key-1");
    await store.clear();

    const blobs = api.runtime.state.openBlobStore<MyBlobMetadata>({
      namespace: "rendered-artifacts",
      maxEntries: 100,
      maxBytesPerEntry: 4 * 1024 * 1024,
      maxBytesPerNamespace: 64 * 1024 * 1024,
      defaultTtlMs: 15 * 60_000,
    });
    await blobs.register(
      "artifact-1",
      new TextEncoder().encode("binary or text payload"),
      { contentType: "text/plain" },
    );
    const blob = await blobs.lookup("artifact-1");

    await api.runtime.state.withLease(
      {
        namespace: "my-feature",
        key: "writer",
        database: { scope: "agent", agentId },
        leaseMs: 5 * 60_000,
        waitMs: 30_000,
      },
      async ({ signal, assertOwned }) => {
        await runExternalWriter({ signal });
        assertOwned();
      },
    );
    ```

    Penyimpanan berkunci bertahan setelah dimulai ulang dan diisolasi berdasarkan id plugin yang terikat ke runtime. Gunakan `registerIfAbsent(...)` untuk klaim deduplikasi atomik: metode ini mengembalikan `true` ketika kunci tidak ada atau telah kedaluwarsa lalu didaftarkan, atau `false` ketika nilai aktif sudah ada tanpa menimpa nilai, waktu pembuatan, atau TTL-nya. Gunakan `deleteIf(...)` ketika pembersihan harus hanya menghapus nilai yang diamati sebelumnya; predikat sinkron dan penghapusannya berjalan dalam satu transaksi SQLite. Batas: `maxEntries` per namespace, 50,000 baris aktif per plugin, nilai JSON di bawah 64KB, dan kedaluwarsa TTL opsional. Secara default, penulisan pada salah satu batas baris membuang baris aktif terlama dari namespace yang sedang ditulisi; namespace lain tidak dikeluarkan untuk penulisan tersebut, dan penulisan tetap gagal jika namespace tidak dapat membebaskan cukup baris. Tetapkan `overflowPolicy: "reject-new"` untuk catatan kepemilikan persisten yang tidak boleh dikeluarkan: kunci baru gagal pada salah satu batas, sedangkan kunci yang sudah ada tetap dapat diperbarui.

    `openSyncKeyedStore<T>(...)` mengembalikan bentuk penyimpanan yang sama dengan metode sinkron (`register`, `registerIfAbsent`, `deleteIf`, `lookup`, `consume`, `clear` semuanya mengembalikan nilai secara langsung, bukan promise) untuk pemanggil yang tidak dapat menggunakan await.

    `openBlobStore<TMetadata>(...)` menyimpan muatan biner berbatas dalam SQLite bersama tanpa base64 atau berkas pendamping. Metode ini mewajibkan batas byte per entri, per namespace, dan batas baris; menyalin larik byte pada batas API; serta mencantumkan metadata tanpa memuat setiap BLOB. `register(...)` adalah upsert eksplisit, termasuk untuk kunci yang kedaluwarsa. `registerIfAbsent(...)` menyediakan pembuatan yang aman dari tabrakan: kunci yang kedaluwarsa tetap ditempati hingga pemiliknya mengklaimnya dengan `deleteExpiredKey(key)` atau `deleteExpired()`, sehingga mempertahankan metadata yang diperlukan untuk menghapus artefak bernama terkait setelah commit SQLite. Setiap baris dengan TTL bersifat sementara dan dikecualikan dari pencadangan/pemulihan bahkan sebelum kedaluwarsa; abaikan TTL untuk status persisten yang dapat dipulihkan. Sekering host membatasi setiap BLOB hingga 100 MiB, setiap plugin hingga 512 MiB BLOB yang disimpan secara fisik, dan setiap plugin hingga 50,000 baris yang disimpan secara fisik, termasuk baris kedaluwarsa yang menunggu pembersihan oleh pemilik. Gunakan `registerIfAbsent(...)` dengan `overflowPolicy: "reject-new"` ketika materialisasi eksternal tidak boleh menjadi yatim secara diam-diam akibat penggantian atau pengeluaran.

    `openChannelIngressQueue<TPayload>(...)` membuka antrean masuk persisten yang dicakup ke plugin pemanggil, untuk menyangga peristiwa masuk yang memerlukan pemrosesan setidaknya sekali meskipun terjadi mulai ulang. Ketika pemulihan klaim basi menggunakan `shouldRecover`, berikan juga `shouldRecoverCorrupt` jika muatan yang diklaim dan rusak harus dikarantina: identitas klaimnya yang tidak bergantung pada muatan memungkinkan plugin mempertahankan kebijakan pemilik dan jalur aktif sebelum antrean menandai baris sebagai terhapus.

    `withLease(...)` menserialkan pekerjaan plugin kooperatif di seluruh proses OpenClaw. Pilih `database: { scope: "shared" }` untuk satu pemilik global atau `{ scope: "agent", agentId }` untuk kepemilikan independen per agen. Teruskan `AbortSignal` milik callback ke setiap operasi yang dapat gagal. `assertOwned()` adalah titik pemeriksaan sesaat sebelum memulai langkah penting lainnya; host juga memverifikasi kepemilikan setelah callback. Hilangnya lease atau pembatalan oleh pemanggil membatalkan sinyal. Penantian akuisisi dan heartbeat berlangsung di luar transaksi SQLite sinkron yang singkat; plugin tidak pernah menerima jalur atau handle basis data. Ini adalah pembatalan kooperatif, bukan token fencing atau otorisasi untuk penulisan eksternal tanpa fencing.

    `openChannelIngressDrain(...)` membuka worker inti yang tidak bergantung pada saluran di atas antrean tersebut (atau membuat antrean jika tidak ada yang diberikan). Proses pengurasan memiliki pemulihan klaim basi, serialisasi klaim per jalur, penyelesaian saat adopsi atau penyelesaian saat dispatch kembali, disposisi percobaan ulang/dead-letter, penggantian praadopsi opsional, dan batas waktu macet klaim→adopsi. Hubungkan kepemilikan klaim ke pembuatan balasan dengan `turnAdoptionLifecycle` (melalui `bindIngressLifecycleToReplyOptions` dari `plugin-sdk/channel-outbound`). Plugin saluran mempertahankan enqueue pada sisi penerimaan, derivasi jalur, klasifikasi yang tidak dapat dicoba ulang, dan setiap kebijakan otorisasi penggantian.

    <Warning>
    `openBlobStore`, `openKeyedStore`, `openSyncKeyedStore`, `withLease`, `openChannelIngressQueue`, dan `openChannelIngressDrain` hanya tersedia bagi plugin bawaan dan instalasi plugin resmi tepercaya dalam rilis ini.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Pembantu runtime khusus saluran (tersedia ketika plugin saluran dimuat). Dikelompokkan berdasarkan fungsi:

    | Grup | Tujuan |
    | --- | --- |
    | `text` | Pemecahan menjadi potongan (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), deteksi perintah kontrol, konversi tabel Markdown. |
    | `reply` | Pengiriman balasan blok yang disangga, pemformatan amplop, resolusi konfigurasi pesan efektif/jeda manusia. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, pembacaan/penghapusan daftar yang diizinkan, upsert permintaan pemasangan, dan entri persetujuan yang berasal dari permintaan. |
    | `media` | Pengunduhan/penyimpanan media jarak jauh (lihat di bawah). |
    | `activity` | Mencatat/membaca aktivitas saluran terakhir. |
    | `session` | Metadata sesi dari peristiwa masuk, pembaruan rute terakhir. |
    | `mentions` | Pembantu kebijakan penyebutan (lihat di bawah). |
    | `reactions` | Handle reaksi pengakuan untuk indikator pemrosesan yang sedang berlangsung. |
    | `groups` | Resolusi kebijakan grup dan kewajiban penyebutan. |
    | `debounce` | Debouncing pesan masuk. |
    | `commands` | Otorisasi perintah dan pembatasan perintah teks. |
    | `outbound` | Memuat adaptor keluar suatu saluran. |
    | `inbound` | Membangun konteks peristiwa masuk dan menjalankan kernel peristiwa masuk/balasan bersama. |
    | `threadBindings` | Menyesuaikan batas waktu diam/usia maksimum untuk utas sesi yang terikat. |
    | `runtimeContexts` | Mendaftarkan, membaca, dan memantau konteks per saluran/akun/kapabilitas yang bersifat lokal terhadap proses. |

    `api.runtime.channel.media` adalah permukaan yang disarankan untuk pengunduhan dan penyimpanan media saluran:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Gunakan `saveRemoteMedia(...)` ketika URL jarak jauh harus menjadi media OpenClaw. Gunakan `saveResponseMedia(...)` ketika plugin telah mengambil `Response` dengan autentikasi, pengalihan, atau penanganan daftar yang diizinkan milik plugin. Gunakan `readRemoteMediaBuffer(...)` hanya ketika plugin memerlukan byte mentah untuk pemeriksaan, transformasi, dekripsi, atau pengunggahan ulang. `fetchRemoteMedia(...)` tetap menjadi alias kompatibilitas yang tidak digunakan lagi untuk `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` adalah permukaan kebijakan penyebutan masuk bersama bagi plugin saluran bawaan yang menggunakan injeksi runtime:

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

    Pembantu penyebutan yang tersedia:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    Gunakan jalur `{ facts, policy }` yang telah dinormalisasi untuk keputusan penyebutan.

    Beberapa bidang di bawah `reply`, `session`, dan `inbound` membawa catatan `@deprecated` per bidang yang menunjuk ke kernel giliran saluran atau adaptor keluar saluran saat ini; periksa JSDoc inline pada pembantu tertentu sebelum membangun kode baru di atasnya.

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
  <Step title="Akses dari berkas lain">
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
Utamakan `pluginId` untuk identitas penyimpanan runtime. Bentuk tingkat rendah `key` ditujukan bagi kasus yang jarang terjadi ketika satu plugin secara sengaja memerlukan lebih dari satu slot runtime.
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
  Snapshot konfigurasi saat ini (snapshot runtime aktif dalam memori jika tersedia).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfigurasi khusus plugin dari `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger bercakupan (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode pemuatan saat ini: `"full"` (aktivasi langsung), `"discovery"` / `"tool-discovery"` (penemuan kapabilitas hanya-baca), `"setup-only"` (entri penyiapan ringan), `"setup-runtime"` (alur penyiapan yang juga memerlukan entri saluran runtime), atau `"cli-metadata"` (pengumpulan metadata perintah CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Menguraikan jalur relatif terhadap root plugin.
</ParamField>

## Terkait

- [Internal Plugin](/id/plugins/architecture) — model kapabilitas dan registri
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry`
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi subjalur
