---
read_when:
    - Anda sedang menghubungkan perilaku siklus hidup mesin konteks ke dalam kerangka Codex
    - Anda memerlukan lossless-claw atau Plugin mesin konteks lain untuk bekerja dengan sesi kerangka kerja tersemat codex/*
    - Anda sedang membandingkan perilaku konteks PI tersemat dan server aplikasi Codex
summary: Spesifikasi untuk membuat harness server aplikasi Codex yang dibundel mengindahkan Plugin context-engine OpenClaw
title: Port Mesin Konteks Harness Codex
x-i18n:
    generated_at: "2026-05-03T09:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Spesifikasi implementasi draf.

## Tujuan

Membuat harness app-server Codex bawaan mematuhi kontrak siklus hidup context-engine OpenClaw yang sama seperti yang sudah dipatuhi oleh giliran PI tertanam.

Sesi yang menggunakan `agents.defaults.embeddedHarness.runtime: "codex"` atau model `codex/*` harus tetap memungkinkan plugin context-engine yang dipilih, seperti `lossless-claw`, mengontrol penyusunan konteks, ingest pascagiliran, pemeliharaan, dan kebijakan Compaction tingkat OpenClaw sejauh yang diizinkan oleh batas app-server Codex.

## Bukan tujuan

- Jangan mengimplementasikan ulang internal app-server Codex.
- Jangan membuat Compaction thread native Codex menghasilkan ringkasan lossless-claw.
- Jangan mewajibkan model non-Codex menggunakan harness Codex.
- Jangan mengubah perilaku sesi ACP/acpx. Spesifikasi ini hanya untuk jalur harness agen tertanam non-ACP.
- Jangan membuat plugin pihak ketiga mendaftarkan factory ekstensi app-server Codex; batas kepercayaan plugin bawaan yang ada tetap tidak berubah.

## Arsitektur saat ini

Loop eksekusi tertanam menyelesaikan context engine yang dikonfigurasi satu kali per eksekusi sebelum memilih harness tingkat rendah konkret:

- `src/agents/pi-embedded-runner/run.ts`
  - menginisialisasi plugin context-engine
  - memanggil `resolveContextEngine(params.config)`
  - meneruskan `contextEngine` dan `contextTokenBudget` ke
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` mendelegasikan ke harness agen yang dipilih:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex didaftarkan oleh plugin Codex bawaan:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementasi harness Codex menerima `EmbeddedRunAttemptParams` yang sama seperti upaya berbasis PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Itu berarti titik hook yang diperlukan berada di kode yang dikendalikan OpenClaw. Batas eksternalnya adalah protokol app-server Codex itu sendiri: OpenClaw dapat mengontrol apa yang dikirim ke `thread/start`, `thread/resume`, dan `turn/start`, serta dapat mengamati notifikasi, tetapi tidak dapat mengubah penyimpanan thread internal Codex atau compactor native.

## Kesenjangan saat ini

Upaya PI tertanam memanggil siklus hidup context-engine secara langsung:

- bootstrap/pemeliharaan sebelum upaya
- assemble sebelum panggilan model
- afterTurn atau ingest setelah upaya
- pemeliharaan setelah giliran berhasil
- Compaction context-engine untuk engine yang memiliki Compaction

Kode PI terkait:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Upaya app-server Codex saat ini menjalankan hook harness agen generik dan mencerminkan transkrip, tetapi tidak memanggil `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, atau `params.contextEngine.maintain`.

Kode Codex terkait:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Perilaku yang diinginkan

Untuk giliran harness Codex, OpenClaw harus mempertahankan siklus hidup ini:

1. Baca transkrip sesi OpenClaw yang dicerminkan.
2. Bootstrap context engine aktif ketika file sesi sebelumnya ada.
3. Jalankan pemeliharaan bootstrap ketika tersedia.
4. Assemble konteks menggunakan context engine aktif.
5. Ubah konteks yang di-assemble menjadi input yang kompatibel dengan Codex.
6. Mulai atau lanjutkan thread Codex dengan instruksi developer yang menyertakan `systemPromptAddition` context-engine apa pun.
7. Mulai giliran Codex dengan prompt yang menghadap pengguna hasil assemble.
8. Cerminkan hasil Codex kembali ke transkrip OpenClaw.
9. Panggil `afterTurn` jika diimplementasikan, jika tidak gunakan `ingestBatch`/`ingest`, dengan snapshot transkrip yang dicerminkan.
10. Jalankan pemeliharaan giliran setelah giliran non-dibatalkan yang berhasil.
11. Pertahankan sinyal Compaction native Codex dan hook Compaction OpenClaw.

## Batasan desain

### App-server Codex tetap kanonis untuk status thread native

Codex memiliki thread native-nya dan riwayat diperluas internal apa pun. OpenClaw tidak boleh mencoba memutasi riwayat internal app-server kecuali melalui panggilan protokol yang didukung.

Cermin transkrip OpenClaw tetap menjadi sumber untuk fitur OpenClaw:

- riwayat chat
- pencarian
- pembukuan `/new` dan `/reset`
- perpindahan model atau harness di masa depan
- status plugin context-engine

### Assembly context engine harus diproyeksikan ke input Codex

Antarmuka context-engine mengembalikan `AgentMessage[]` OpenClaw, bukan patch thread Codex. `turn/start` app-server Codex menerima input pengguna saat ini, sementara `thread/start` dan `thread/resume` menerima instruksi developer.

Karena itu, implementasi memerlukan lapisan proyeksi. Versi awal yang aman harus menghindari berpura-pura dapat mengganti riwayat internal Codex. Versi itu harus menyuntikkan konteks hasil assemble sebagai materi prompt/instruksi developer deterministik di sekitar giliran saat ini.

### Stabilitas prompt-cache penting

Untuk engine seperti lossless-claw, konteks hasil assemble harus deterministik untuk input yang tidak berubah. Jangan tambahkan timestamp, id acak, atau pengurutan nondeterministik ke teks konteks yang dihasilkan.

### Semantik pemilihan runtime tidak berubah

Pemilihan harness tetap seperti sekarang:

- `runtime: "pi"` memaksa PI
- `runtime: "codex"` memilih harness Codex yang terdaftar
- `runtime: "auto"` membiarkan harness plugin mengklaim provider yang didukung
- eksekusi `auto` yang tidak cocok menggunakan PI

Pekerjaan ini mengubah apa yang terjadi setelah harness Codex dipilih.

## Rencana implementasi

### 1. Ekspor atau pindahkan helper upaya context-engine yang dapat digunakan ulang

Saat ini helper siklus hidup yang dapat digunakan ulang berada di bawah runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex sebaiknya tidak mengimpor dari jalur implementasi yang namanya mengimplikasikan PI jika dapat dihindari.

Buat modul netral-harness, misalnya:

- `src/agents/harness/context-engine-lifecycle.ts`

Pindahkan atau ekspor ulang:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper kecil di sekitar `runContextEngineMaintenance`

Pertahankan impor PI tetap berfungsi baik dengan mengekspor ulang dari file lama atau memperbarui call site PI dalam PR yang sama.

Nama helper netral tidak boleh menyebut PI.

Nama yang disarankan:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Tambahkan helper proyeksi konteks Codex

Tambahkan modul baru:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Tanggung jawab:

- Menerima `AgentMessage[]` hasil assemble, riwayat cermin asli, dan prompt saat ini.
- Menentukan konteks mana yang masuk ke instruksi developer vs input pengguna saat ini.
- Mempertahankan prompt pengguna saat ini sebagai permintaan akhir yang dapat ditindaklanjuti.
- Merender pesan sebelumnya dalam format yang stabil dan eksplisit.
- Menghindari metadata volatil.

API yang diusulkan:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Proyeksi awal yang direkomendasikan:

- Masukkan `systemPromptAddition` ke instruksi developer.
- Masukkan konteks transkrip hasil assemble sebelum prompt saat ini di `promptText`.
- Beri label dengan jelas sebagai konteks hasil assemble OpenClaw.
- Pertahankan prompt saat ini di bagian akhir.
- Kecualikan prompt pengguna saat ini yang duplikat jika sudah muncul di ekor.

Contoh bentuk prompt:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Ini kurang elegan daripada pembedahan riwayat native Codex, tetapi dapat diimplementasikan di dalam OpenClaw dan mempertahankan semantik context-engine.

Peningkatan masa depan: jika app-server Codex mengekspos protokol untuk mengganti atau melengkapi riwayat thread, ganti lapisan proyeksi ini untuk menggunakan API tersebut.

### 3. Hubungkan bootstrap sebelum startup thread Codex

Di `extensions/codex/src/app-server/run-attempt.ts`:

- Baca riwayat sesi cermin seperti saat ini.
- Tentukan apakah file sesi sudah ada sebelum eksekusi ini. Lebih baik gunakan helper yang memeriksa `fs.stat(params.sessionFile)` sebelum penulisan cermin.
- Buka `SessionManager` atau gunakan adapter session manager sempit jika helper memerlukannya.
- Panggil helper bootstrap netral ketika `params.contextEngine` ada.

Alur semu:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Gunakan konvensi `sessionKey` yang sama seperti bridge tool Codex dan cermin transkrip. Saat ini Codex menghitung `sandboxSessionKey` dari `params.sessionKey` atau `params.sessionId`; gunakan itu secara konsisten kecuali ada alasan untuk mempertahankan `params.sessionKey` mentah.

### 4. Hubungkan assemble sebelum `thread/start` / `thread/resume` dan `turn/start`

Di `runCodexAppServerAttempt`:

1. Bangun tool dinamis terlebih dahulu, sehingga context engine melihat nama tool aktual yang tersedia.
2. Baca riwayat sesi cermin.
3. Jalankan `assemble(...)` context-engine ketika `params.contextEngine` ada.
4. Proyeksikan hasil assemble ke:
   - tambahan instruksi developer
   - teks prompt untuk `turn/start`

Panggilan hook yang ada:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

harus menjadi sadar-konteks:

1. hitung instruksi developer dasar dengan `buildDeveloperInstructions(params)`
2. terapkan assembly/proyeksi context-engine
3. jalankan `before_prompt_build` dengan prompt/instruksi developer yang diproyeksikan

Urutan ini memungkinkan hook prompt generik melihat prompt yang sama dengan yang akan diterima Codex. Jika kita memerlukan paritas PI yang ketat, jalankan assembly context-engine sebelum komposisi hook, karena PI menerapkan `systemPromptAddition` context-engine ke prompt sistem final setelah pipeline prompt-nya. Invarian pentingnya adalah bahwa context engine dan hook sama-sama mendapatkan urutan yang deterministik dan terdokumentasi.

Urutan yang direkomendasikan untuk implementasi pertama:

1. `buildDeveloperInstructions(params)`
2. `assemble()` context-engine
3. tambahkan di akhir/awal `systemPromptAddition` ke instruksi developer
4. proyeksikan pesan hasil assemble ke teks prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. teruskan instruksi developer final ke `startOrResumeThread(...)`
7. teruskan teks prompt final ke `buildTurnStartParams(...)`

Spesifikasi harus dikodekan dalam pengujian agar perubahan mendatang tidak menyusun ulangnya secara tidak sengaja.

### 5. Pertahankan pemformatan stabil prompt-cache

Helper proyeksi harus menghasilkan output yang stabil secara byte untuk input identik:

- urutan pesan stabil
- label peran stabil
- tanpa timestamp yang dihasilkan
- tanpa kebocoran urutan key objek
- tanpa delimiter acak
- tanpa id per eksekusi

Gunakan delimiter tetap dan bagian eksplisit.

### 6. Hubungkan pascagiliran setelah pencerminan transkrip

`CodexAppServerEventProjector` milik Codex membangun `messagesSnapshot` lokal untuk giliran
saat ini. `mirrorTranscriptBestEffort(...)` menulis snapshot tersebut ke
cermin transkrip OpenClaw.

Setelah mirroring berhasil atau gagal, panggil finalizer mesin konteks dengan
snapshot pesan terbaik yang tersedia:

- Utamakan konteks sesi penuh yang sudah dicerminkan setelah penulisan, karena `afterTurn`
  mengharapkan snapshot sesi, bukan hanya giliran saat ini.
- Gunakan fallback ke `historyMessages + result.messagesSnapshot` jika file sesi
  tidak dapat dibuka ulang.

Alur semu:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Jika mirroring gagal, tetap panggil `afterTurn` dengan snapshot fallback, tetapi catat
bahwa mesin konteks sedang mencerna dari data giliran fallback.

### 7. Normalkan penggunaan dan konteks runtime cache prompt

Hasil Codex menyertakan penggunaan yang dinormalkan dari notifikasi token server aplikasi saat
tersedia. Teruskan penggunaan tersebut ke konteks runtime mesin konteks.

Jika server aplikasi Codex pada akhirnya mengekspos detail baca/tulis cache, petakan ke
`ContextEnginePromptCacheInfo`. Sampai saat itu, hilangkan `promptCache` alih-alih
menciptakan nilai nol.

### 8. Kebijakan Compaction

Ada dua sistem Compaction:

1. `compact()` mesin konteks OpenClaw
2. `thread/compact/start` native server aplikasi Codex

Jangan menggabungkannya secara diam-diam.

#### `/compact` dan Compaction OpenClaw eksplisit

Saat mesin konteks yang dipilih memiliki `info.ownsCompaction === true`, Compaction
OpenClaw eksplisit sebaiknya mengutamakan hasil `compact()` milik mesin konteks untuk
cermin transkrip OpenClaw dan state Plugin.

Saat harness Codex yang dipilih memiliki binding thread native, kita juga dapat
meminta Compaction native Codex untuk menjaga thread server aplikasi tetap sehat, tetapi ini
harus dilaporkan sebagai tindakan backend terpisah dalam detail.

Perilaku yang direkomendasikan:

- Jika `contextEngine.info.ownsCompaction === true`:
  - panggil `compact()` mesin konteks terlebih dahulu
  - lalu lakukan panggilan best-effort ke Compaction native Codex saat binding thread ada
  - kembalikan hasil mesin konteks sebagai hasil utama
  - sertakan status Compaction native Codex dalam `details.codexNativeCompaction`
- Jika mesin konteks aktif tidak memiliki Compaction:
  - pertahankan perilaku Compaction native Codex saat ini

Ini kemungkinan memerlukan perubahan pada `extensions/codex/src/app-server/compact.ts` atau
membungkusnya dari jalur Compaction generik, tergantung di mana
`maybeCompactAgentHarnessSession(...)` dipanggil.

#### Event `contextCompaction` native Codex dalam giliran

Codex dapat memancarkan event item `contextCompaction` selama sebuah giliran. Pertahankan
emisi hook Compaction sebelum/sesudah saat ini di `event-projector.ts`, tetapi jangan anggap
itu sebagai Compaction mesin konteks yang sudah selesai.

Untuk mesin yang memiliki Compaction, pancarkan diagnostik eksplisit saat Codex tetap melakukan
Compaction native:

- nama stream/event: stream `compaction` yang ada dapat digunakan
- detail: `{ backend: "codex-app-server", ownsCompaction: true }`

Ini membuat pemisahannya dapat diaudit.

### 9. Perilaku reset sesi dan binding

`reset(...)` harness Codex yang ada menghapus binding server aplikasi Codex dari
file sesi OpenClaw. Pertahankan perilaku tersebut.

Pastikan juga pembersihan state mesin konteks tetap terjadi melalui jalur siklus hidup sesi
OpenClaw yang ada. Jangan tambahkan pembersihan khusus Codex kecuali siklus hidup
mesin konteks saat ini melewatkan event reset/delete untuk semua harness.

### 10. Penanganan error

Ikuti semantik PI:

- kegagalan bootstrap memperingatkan dan melanjutkan
- kegagalan assemble memperingatkan dan fallback ke pesan/prompt pipeline yang belum dirakit
- kegagalan afterTurn/ingest memperingatkan dan menandai finalisasi pascagiliran tidak berhasil
- maintenance hanya berjalan setelah giliran berhasil, tidak dibatalkan, dan non-yield
- error Compaction tidak boleh dicoba ulang sebagai prompt baru

Tambahan khusus Codex:

- Jika proyeksi konteks gagal, peringatkan dan fallback ke prompt asli.
- Jika cermin transkrip gagal, tetap coba finalisasi mesin konteks dengan
  pesan fallback.
- Jika Compaction native Codex gagal setelah Compaction mesin konteks berhasil,
  jangan gagalkan seluruh Compaction OpenClaw saat mesin konteks adalah yang utama.

## Rencana pengujian

### Uji unit

Tambahkan pengujian di bawah `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex memanggil `bootstrap` saat file sesi ada.
   - Codex memanggil `assemble` dengan pesan yang dicerminkan, anggaran token, nama tool,
     mode sitasi, id model, dan prompt.
   - `systemPromptAddition` disertakan dalam instruksi developer.
   - Pesan yang dirakit diproyeksikan ke prompt sebelum permintaan saat ini.
   - Codex memanggil `afterTurn` setelah mirroring transkrip.
   - Tanpa `afterTurn`, Codex memanggil `ingestBatch` atau `ingest` per pesan.
   - Maintenance giliran berjalan setelah giliran berhasil.
   - Maintenance giliran tidak berjalan pada error prompt, abort, atau yield abort.

2. `context-engine-projection.test.ts`
   - output stabil untuk input identik
   - tidak ada duplikasi prompt saat ini ketika riwayat yang dirakit menyertakannya
   - menangani riwayat kosong
   - mempertahankan urutan peran
   - menyertakan tambahan prompt sistem hanya dalam instruksi developer

3. `compact.context-engine.test.ts`
   - hasil utama mesin konteks pemilik menang
   - status Compaction native Codex muncul dalam detail saat juga dicoba
   - kegagalan native Codex tidak menggagalkan Compaction mesin konteks pemilik
   - mesin konteks non-pemilik mempertahankan perilaku Compaction native saat ini

### Pengujian yang ada untuk diperbarui

- `extensions/codex/src/app-server/run-attempt.test.ts` jika ada, jika tidak
  pengujian run server aplikasi Codex terdekat.
- `extensions/codex/src/app-server/event-projector.test.ts` hanya jika detail event
  Compaction berubah.
- `src/agents/harness/selection.test.ts` tidak perlu perubahan kecuali perilaku
  konfigurasi berubah; seharusnya tetap stabil.
- Pengujian mesin konteks PI harus tetap lulus tanpa perubahan.

### Pengujian integrasi / live

Tambahkan atau perluas pengujian smoke harness Codex live:

- konfigurasikan `plugins.slots.contextEngine` ke mesin pengujian
- konfigurasikan `agents.defaults.model` ke model `codex/*`
- konfigurasikan `agents.defaults.embeddedHarness.runtime = "codex"`
- pastikan mesin pengujian mengamati:
  - bootstrap
  - assemble
  - afterTurn atau ingest
  - maintenance

Hindari mengharuskan lossless-claw dalam pengujian core OpenClaw. Gunakan Plugin
mesin konteks palsu kecil di dalam repo.

## Observabilitas

Tambahkan log debug di sekitar panggilan siklus hidup mesin konteks Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` dengan alasan
- `codex native compaction completed alongside context-engine compaction`

Hindari mencatat prompt lengkap atau isi transkrip.

Tambahkan field terstruktur jika berguna:

- `sessionId`
- `sessionKey` disensor atau dihilangkan sesuai praktik logging yang ada
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migrasi / kompatibilitas

Ini harus kompatibel mundur:

- Jika tidak ada mesin konteks yang dikonfigurasi, perilaku mesin konteks legacy harus
  setara dengan perilaku harness Codex saat ini.
- Jika `assemble` mesin konteks gagal, Codex harus melanjutkan dengan jalur
  prompt asli.
- Binding thread Codex yang ada harus tetap valid.
- Fingerprinting tool dinamis tidak boleh menyertakan output mesin konteks; jika tidak,
  setiap perubahan konteks dapat memaksa thread Codex baru. Hanya katalog tool
  yang boleh memengaruhi fingerprint tool dinamis.

## Pertanyaan terbuka

1. Apakah konteks yang dirakit harus disuntikkan sepenuhnya ke prompt pengguna, sepenuhnya
   ke instruksi developer, atau dipisah?

   Rekomendasi: pisah. Letakkan `systemPromptAddition` dalam instruksi developer;
   letakkan konteks transkrip yang dirakit dalam wrapper prompt pengguna. Ini paling sesuai
   dengan protokol Codex saat ini tanpa memutasi riwayat thread native.

2. Haruskah Compaction native Codex dinonaktifkan saat mesin konteks memiliki
   Compaction?

   Rekomendasi: tidak, belum pada awalnya. Compaction native Codex mungkin tetap
   diperlukan untuk menjaga thread server aplikasi tetap hidup. Tetapi itu harus dilaporkan sebagai
   Compaction native Codex, bukan sebagai Compaction mesin konteks.

3. Haruskah `before_prompt_build` berjalan sebelum atau sesudah assembly mesin konteks?

   Rekomendasi: setelah proyeksi mesin konteks untuk Codex, sehingga hook harness generik
   melihat prompt/instruksi developer aktual yang akan diterima Codex. Jika paritas PI
   memerlukan kebalikannya, kodekan urutan yang dipilih dalam pengujian dan dokumentasikan di
   sini.

4. Bisakah server aplikasi Codex menerima override konteks/riwayat terstruktur di masa depan?

   Tidak diketahui. Jika bisa, ganti lapisan proyeksi teks dengan protokol tersebut dan
   pertahankan panggilan siklus hidup tanpa perubahan.

## Kriteria penerimaan

- Giliran harness tertanam `codex/*` memanggil siklus hidup assemble milik mesin konteks
  yang dipilih.
- `systemPromptAddition` mesin konteks memengaruhi instruksi developer Codex.
- Konteks yang dirakit memengaruhi input giliran Codex secara deterministik.
- Giliran Codex yang berhasil memanggil `afterTurn` atau fallback ingest.
- Giliran Codex yang berhasil menjalankan maintenance giliran mesin konteks.
- Giliran gagal/dibatalkan/yield-aborted tidak menjalankan maintenance giliran.
- Compaction yang dimiliki mesin konteks tetap menjadi yang utama untuk state OpenClaw/Plugin.
- Compaction native Codex tetap dapat diaudit sebagai perilaku native Codex.
- Perilaku mesin konteks PI yang ada tidak berubah.
- Perilaku harness Codex yang ada tidak berubah saat tidak ada mesin konteks non-legacy
  yang dipilih atau saat assembly gagal.
