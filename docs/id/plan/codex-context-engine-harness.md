---
read_when:
    - Anda sedang mengintegrasikan perilaku siklus hidup context-engine ke dalam harness Codex
    - Anda memerlukan lossless-claw atau Plugin mesin konteks lain untuk bekerja dengan sesi harness tertanam codex/*
    - Anda sedang membandingkan perilaku konteks OpenClaw tertanam dan server aplikasi Codex
summary: Spesifikasi untuk membuat harness app-server Codex bawaan mematuhi Plugin context-engine OpenClaw
title: Port Mesin Konteks Harness Codex
x-i18n:
    generated_at: "2026-06-27T17:41:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Spesifikasi implementasi draf.

## Tujuan

Membuat harness app-server Codex bawaan mematuhi kontrak siklus hidup context-engine OpenClaw yang sama seperti yang sudah dipatuhi oleh giliran OpenClaw tersemat.

Sesi yang menggunakan provider/model `agentRuntime.id: "codex"` atau model `codex/*` tetap harus memungkinkan Plugin context-engine yang dipilih, seperti `lossless-claw`, mengendalikan perakitan konteks, ingest pasca-giliran, pemeliharaan, dan kebijakan Compaction tingkat OpenClaw sejauh yang diizinkan oleh batas app-server Codex.

## Bukan Tujuan

- Jangan mengimplementasikan ulang internal app-server Codex.
- Jangan membuat Compaction thread native Codex menghasilkan ringkasan lossless-claw.
- Jangan mewajibkan model non-Codex menggunakan harness Codex.
- Jangan mengubah perilaku sesi ACP/acpx. Spesifikasi ini hanya untuk jalur harness agen tersemat non-ACP.
- Jangan membuat Plugin pihak ketiga mendaftarkan factory ekstensi app-server Codex; batas kepercayaan Plugin bawaan yang ada tetap tidak berubah.

## Arsitektur Saat Ini

Loop run tersemat menyelesaikan context engine yang dikonfigurasi sekali per run sebelum memilih harness level rendah konkret:

- `src/agents/embedded-agent-runner/run.ts`
  - menginisialisasi Plugin context-engine
  - memanggil `resolveContextEngine(params.config)`
  - meneruskan `contextEngine` dan `contextTokenBudget` ke
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` mendelegasikan ke harness agen yang dipilih:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex didaftarkan oleh Plugin Codex bawaan:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementasi harness Codex menerima `EmbeddedRunAttemptParams` yang sama seperti upaya OpenClaw bawaan:

- `extensions/codex/src/app-server/run-attempt.ts`

Itu berarti titik hook yang diperlukan berada dalam kode yang dikendalikan OpenClaw. Batas eksternalnya adalah protokol app-server Codex itu sendiri: OpenClaw dapat mengendalikan apa yang dikirim ke `thread/start`, `thread/resume`, dan `turn/start`, serta dapat mengamati notifikasi, tetapi tidak dapat mengubah penyimpanan thread internal Codex atau compactor native.

## Kesenjangan Saat Ini

Upaya OpenClaw bawaan memanggil siklus hidup context-engine secara langsung:

- bootstrap/pemeliharaan sebelum upaya
- assemble sebelum panggilan model
- afterTurn atau ingest setelah upaya
- pemeliharaan setelah giliran berhasil
- Compaction context-engine untuk engine yang memiliki Compaction

Kode OpenClaw yang relevan:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Upaya app-server Codex saat ini menjalankan hook harness agen generik dan mencerminkan transkrip, tetapi tidak memanggil `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, atau `params.contextEngine.maintain`.

Kode Codex yang relevan:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Perilaku yang Diinginkan

Untuk giliran harness Codex, OpenClaw harus mempertahankan siklus hidup ini:

1. Membaca transkrip sesi OpenClaw yang dicerminkan.
2. Melakukan bootstrap context engine aktif saat file sesi sebelumnya ada.
3. Menjalankan pemeliharaan bootstrap saat tersedia.
4. Merakit konteks menggunakan context engine aktif.
5. Mengonversi konteks yang dirakit menjadi input yang kompatibel dengan Codex.
6. Memulai atau melanjutkan thread Codex dengan instruksi developer yang menyertakan `systemPromptAddition` context-engine apa pun.
7. Memulai giliran Codex dengan prompt yang dirakit dan terlihat oleh pengguna.
8. Mencerminkan hasil Codex kembali ke transkrip OpenClaw.
9. Memanggil `afterTurn` jika diimplementasikan, jika tidak `ingestBatch`/`ingest`, menggunakan snapshot transkrip yang dicerminkan.
10. Menjalankan pemeliharaan giliran setelah giliran non-aborted yang berhasil.
11. Mempertahankan sinyal Compaction native Codex dan hook Compaction OpenClaw.

## Batasan Desain

### App-server Codex tetap kanonis untuk state thread native

Codex memiliki thread native-nya dan riwayat diperluas internal apa pun. OpenClaw tidak boleh mencoba memutasi riwayat internal app-server kecuali melalui panggilan protokol yang didukung.

Cermin transkrip OpenClaw tetap menjadi sumber untuk fitur OpenClaw:

- riwayat chat
- pencarian
- pembukuan `/new` dan `/reset`
- perpindahan model atau harness di masa mendatang
- state Plugin context-engine

### Perakitan context engine harus diproyeksikan ke input Codex

Antarmuka context-engine mengembalikan `AgentMessage[]` OpenClaw, bukan patch thread Codex. `turn/start` app-server Codex menerima input pengguna saat ini, sementara `thread/start` dan `thread/resume` menerima instruksi developer.

Karena itu implementasi memerlukan lapisan proyeksi. Versi pertama yang aman harus menghindari pura-pura dapat mengganti riwayat internal Codex. Versi itu harus menyuntikkan konteks yang dirakit sebagai materi prompt/instruksi developer deterministik di sekitar giliran saat ini.

### Stabilitas prompt-cache penting

Untuk engine seperti lossless-claw, konteks yang dirakit harus deterministik untuk input yang tidak berubah. Jangan menambahkan timestamp, id acak, atau pengurutan nondeterministik ke teks konteks yang dihasilkan.

### Semantik pemilihan runtime tidak berubah

Pemilihan harness tetap seperti sebelumnya:

- `runtime: "openclaw"` memilih harness OpenClaw bawaan
- `runtime: "codex"` memilih harness Codex terdaftar
- `runtime: "auto"` memungkinkan harness Plugin mengklaim provider yang didukung
- run `auto` yang tidak cocok menggunakan harness OpenClaw bawaan

Pekerjaan ini mengubah apa yang terjadi setelah harness Codex dipilih.

## Rencana Implementasi

### 1. Ekspor atau pindahkan helper upaya context-engine yang dapat digunakan ulang

Saat ini helper siklus hidup yang dapat digunakan ulang berada di bawah runner agen tersemat:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex harus mengimpor helper yang netral terhadap harness, bukan menjangkau detail implementasi runner.

Buat modul yang netral terhadap harness, misalnya:

- `src/agents/harness/context-engine-lifecycle.ts`

Pindahkan atau ekspor ulang:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper kecil di sekitar `runContextEngineMaintenance`

Perbarui lokasi panggilan harness bawaan dalam PR yang sama.

Nama helper netral tidak boleh menyebut harness bawaan.

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

- Menerima `AgentMessage[]` yang dirakit, riwayat asli yang dicerminkan, dan prompt saat ini.
- Menentukan konteks mana yang termasuk dalam instruksi developer vs input pengguna saat ini.
- Mempertahankan prompt pengguna saat ini sebagai permintaan final yang dapat ditindaklanjuti.
- Merender pesan sebelumnya dalam format stabil dan eksplisit.
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

Proyeksi pertama yang direkomendasikan:

- Masukkan `systemPromptAddition` ke instruksi developer.
- Masukkan konteks transkrip yang dirakit sebelum prompt saat ini dalam `promptText`.
- Beri label dengan jelas sebagai konteks rakitan OpenClaw.
- Pertahankan prompt saat ini di bagian terakhir.
- Kecualikan duplikat prompt pengguna saat ini jika sudah muncul di ekor.

Bentuk prompt contoh:

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

Ini kurang elegan dibanding pembedahan riwayat native Codex, tetapi dapat diimplementasikan di dalam OpenClaw dan mempertahankan semantik context-engine.

Perbaikan masa depan: jika app-server Codex mengekspos protokol untuk mengganti atau melengkapi riwayat thread, ubah lapisan proyeksi ini agar menggunakan API tersebut.

### 3. Hubungkan bootstrap sebelum startup thread Codex

Di `extensions/codex/src/app-server/run-attempt.ts`:

- Baca riwayat sesi yang dicerminkan seperti saat ini.
- Tentukan apakah file sesi sudah ada sebelum run ini. Utamakan helper yang memeriksa `fs.stat(params.sessionFile)` sebelum penulisan cermin.
- Buka `SessionManager` atau gunakan adapter session manager yang sempit jika helper memerlukannya.
- Panggil helper bootstrap netral saat `params.contextEngine` ada.

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

1. Bangun dynamic tools terlebih dahulu, agar context engine melihat nama tool aktual yang tersedia.
2. Baca riwayat sesi yang dicerminkan.
3. Jalankan `assemble(...)` context-engine saat `params.contextEngine` ada.
4. Proyeksikan hasil rakitan menjadi:
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

harus menjadi sadar konteks:

1. hitung instruksi developer dasar dengan `buildDeveloperInstructions(params)`
2. terapkan perakitan/proyeksi context-engine
3. jalankan `before_prompt_build` dengan prompt/instruksi developer yang diproyeksikan

Urutan ini membuat hook prompt generik melihat prompt yang sama dengan yang akan diterima Codex. Jika kita membutuhkan paritas OpenClaw yang ketat, jalankan perakitan context-engine sebelum komposisi hook, karena harness bawaan menerapkan `systemPromptAddition` context-engine ke prompt sistem final setelah pipeline prompt-nya. Invarian pentingnya adalah bahwa context engine dan hook sama-sama mendapatkan urutan yang deterministik dan terdokumentasi.

Urutan yang direkomendasikan untuk implementasi pertama:

1. `buildDeveloperInstructions(params)`
2. `assemble()` context-engine
3. tambahkan di akhir/awal `systemPromptAddition` ke instruksi developer
4. proyeksikan pesan yang dirakit ke teks prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. teruskan instruksi developer final ke `startOrResumeThread(...)`
7. teruskan teks prompt final ke `buildTurnStartParams(...)`

Spesifikasi harus dienkode dalam pengujian agar perubahan masa depan tidak mengubah urutannya secara tidak sengaja.

### 5. Pertahankan pemformatan stabil prompt-cache

Helper proyeksi harus menghasilkan output yang stabil pada tingkat byte untuk input yang identik:

- urutan pesan stabil
- label peran stabil
- tanpa timestamp yang dihasilkan
- tanpa kebocoran urutan key objek
- tanpa delimiter acak
- tanpa id per-run

Gunakan delimiter tetap dan bagian eksplisit.

### 6. Hubungkan pasca-giliran setelah pencerminan transkrip

`CodexAppServerEventProjector` milik Codex membangun `messagesSnapshot` lokal untuk
giliran saat ini. `mirrorTranscriptBestEffort(...)` menulis snapshot tersebut ke
cermin transkrip OpenClaw.

Setelah pencerminan berhasil atau gagal, panggil finalizer mesin konteks dengan
snapshot pesan terbaik yang tersedia:

- Utamakan konteks sesi penuh yang telah dicerminkan setelah penulisan, karena `afterTurn`
  mengharapkan snapshot sesi, bukan hanya giliran saat ini.
- Gunakan cadangan `historyMessages + result.messagesSnapshot` jika file sesi
  tidak dapat dibuka kembali.

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

Jika pencerminan gagal, tetap panggil `afterTurn` dengan snapshot cadangan, tetapi catat
bahwa mesin konteks sedang mencerna dari data giliran cadangan.

### 7. Normalkan konteks runtime penggunaan dan cache prompt

Hasil Codex menyertakan penggunaan ternormalisasi dari notifikasi token server aplikasi jika
tersedia. Teruskan penggunaan tersebut ke konteks runtime mesin konteks.

Jika server aplikasi Codex pada akhirnya mengekspos detail baca/tulis cache, petakan detail itu ke
`ContextEnginePromptCacheInfo`. Sampai saat itu, hilangkan `promptCache` alih-alih
mengarang nilai nol.

### 8. Kebijakan Compaction

Ada dua sistem Compaction:

1. `compact()` mesin konteks OpenClaw
2. `thread/compact/start` native server aplikasi Codex

Jangan menggabungkannya secara diam-diam.

#### `/compact` dan Compaction OpenClaw eksplisit

Ketika mesin konteks yang dipilih memiliki `info.ownsCompaction === true`, Compaction
OpenClaw eksplisit sebaiknya mengutamakan hasil `compact()` mesin konteks untuk
cermin transkrip OpenClaw dan status Plugin.

Ketika harness Codex yang dipilih memiliki pengikatan utas native, kita juga dapat
meminta Compaction native Codex untuk menjaga utas server aplikasi tetap sehat, tetapi ini
harus dilaporkan sebagai tindakan backend terpisah dalam detail.

Perilaku yang direkomendasikan:

- Jika `contextEngine.info.ownsCompaction === true`:
  - panggil `compact()` mesin konteks terlebih dahulu
  - lalu panggil Compaction native Codex secara upaya terbaik ketika pengikatan utas ada
  - kembalikan hasil mesin konteks sebagai hasil utama
  - sertakan status Compaction native Codex di `details.codexNativeCompaction`
- Jika mesin konteks aktif tidak memiliki Compaction:
  - pertahankan perilaku Compaction native Codex saat ini

Ini kemungkinan memerlukan perubahan `extensions/codex/src/app-server/compact.ts` atau
membungkusnya dari jalur Compaction generik, bergantung pada tempat
`maybeCompactAgentHarnessSession(...)` dipanggil.

#### Peristiwa contextCompaction native Codex dalam giliran

Codex dapat memancarkan peristiwa item `contextCompaction` selama satu giliran. Pertahankan
pemancaran hook sebelum/sesudah Compaction saat ini di `event-projector.ts`, tetapi jangan perlakukan
itu sebagai Compaction mesin konteks yang selesai.

Untuk mesin yang memiliki Compaction, pancarkan diagnostik eksplisit ketika Codex tetap melakukan
Compaction native:

- nama stream/peristiwa: stream `compaction` yang ada dapat diterima
- detail: `{ backend: "codex-app-server", ownsCompaction: true }`

Ini membuat pemisahan dapat diaudit.

### 9. Perilaku reset sesi dan pengikatan

`reset(...)` harness Codex yang ada menghapus pengikatan server aplikasi Codex dari
file sesi OpenClaw. Pertahankan perilaku itu.

Pastikan juga pembersihan status mesin konteks tetap terjadi melalui jalur
siklus hidup sesi OpenClaw yang ada. Jangan tambahkan pembersihan khusus Codex kecuali
siklus hidup mesin konteks saat ini melewatkan peristiwa reset/hapus untuk semua harness.

### 10. Penanganan kesalahan

Ikuti semantik bawaan OpenClaw:

- kegagalan bootstrap memberi peringatan dan berlanjut
- kegagalan perakitan memberi peringatan dan kembali ke pesan/prompt pipeline yang tidak dirakit
- kegagalan `afterTurn`/pencernaan memberi peringatan dan menandai finalisasi pasca-giliran tidak berhasil
- pemeliharaan hanya berjalan setelah giliran yang berhasil, tidak dibatalkan, dan tidak yield
- kesalahan Compaction tidak boleh dicoba ulang sebagai prompt baru

Tambahan khusus Codex:

- Jika proyeksi konteks gagal, beri peringatan dan kembali ke prompt asli.
- Jika cermin transkrip gagal, tetap coba finalisasi mesin konteks dengan
  pesan cadangan.
- Jika Compaction native Codex gagal setelah Compaction mesin konteks berhasil,
  jangan gagalkan seluruh Compaction OpenClaw ketika mesin konteks adalah yang utama.

## Rencana pengujian

### Pengujian unit

Tambahkan pengujian di bawah `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex memanggil `bootstrap` saat file sesi ada.
   - Codex memanggil `assemble` dengan pesan yang dicerminkan, anggaran token, nama alat,
     mode sitasi, id model, dan prompt.
   - `systemPromptAddition` disertakan dalam instruksi developer.
   - Pesan yang dirakit diproyeksikan ke dalam prompt sebelum permintaan saat ini.
   - Codex memanggil `afterTurn` setelah pencerminan transkrip.
   - Tanpa `afterTurn`, Codex memanggil `ingestBatch` atau `ingest` per pesan.
   - Pemeliharaan giliran berjalan setelah giliran berhasil.
   - Pemeliharaan giliran tidak berjalan saat terjadi kesalahan prompt, pembatalan, atau pembatalan yield.

2. `context-engine-projection.test.ts`
   - keluaran stabil untuk masukan yang identik
   - tidak ada duplikasi prompt saat ini ketika riwayat yang dirakit menyertakannya
   - menangani riwayat kosong
   - mempertahankan urutan peran
   - menyertakan tambahan prompt sistem hanya dalam instruksi developer

3. `compact.context-engine.test.ts`
   - hasil utama mesin konteks pemilik menang
   - status compaction native Codex muncul dalam detail saat juga dicoba
   - kegagalan native Codex tidak menggagalkan compaction mesin konteks pemilik
   - mesin konteks non-pemilik mempertahankan perilaku compaction native saat ini

### Pengujian yang ada untuk diperbarui

- `extensions/codex/src/app-server/run-attempt.test.ts` jika ada, jika tidak
  pengujian run server aplikasi Codex terdekat.
- `extensions/codex/src/app-server/event-projector.test.ts` hanya jika detail peristiwa compaction
  berubah.
- `src/agents/harness/selection.test.ts` seharusnya tidak perlu perubahan kecuali perilaku konfigurasi
  berubah; pengujian ini harus tetap stabil.
- Pengujian mesin konteks harness bawaan harus tetap lulus tanpa perubahan.

### Pengujian integrasi / live

Tambahkan atau perluas pengujian smoke harness Codex live:

- konfigurasikan `plugins.slots.contextEngine` ke mesin pengujian
- konfigurasikan `agents.defaults.model` ke model `codex/*`
- konfigurasikan provider/model `agentRuntime.id = "codex"`
- pastikan mesin pengujian mengamati:
  - bootstrap
  - assemble
  - afterTurn atau ingest
  - pemeliharaan

Hindari mewajibkan lossless-claw dalam pengujian inti OpenClaw. Gunakan Plugin
mesin konteks palsu kecil di dalam repo.

## Observabilitas

Tambahkan log debug di sekitar panggilan siklus hidup mesin konteks Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` dengan alasan
- `codex native compaction completed alongside context-engine compaction`

Hindari mencatat prompt lengkap atau isi transkrip.

Tambahkan bidang terstruktur jika berguna:

- `sessionId`
- `sessionKey` disunting atau dihilangkan sesuai praktik pencatatan yang ada
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migrasi / kompatibilitas

Ini harus kompatibel ke belakang:

- Jika tidak ada mesin konteks yang dikonfigurasi, perilaku mesin konteks legacy harus
  setara dengan perilaku harness Codex saat ini.
- Jika `assemble` mesin konteks gagal, Codex harus melanjutkan dengan jalur
  prompt asli.
- Binding thread Codex yang ada harus tetap valid.
- Fingerprinting alat dinamis tidak boleh menyertakan keluaran mesin konteks; jika tidak,
  setiap perubahan konteks dapat memaksa thread Codex baru. Hanya katalog alat
  yang boleh memengaruhi fingerprint alat dinamis.

## Pertanyaan terbuka

1. Apakah konteks yang dirakit harus disuntikkan seluruhnya ke prompt pengguna, seluruhnya
   ke instruksi developer, atau dibagi?

   Rekomendasi: dibagi. Letakkan `systemPromptAddition` dalam instruksi developer;
   letakkan konteks transkrip yang dirakit dalam pembungkus prompt pengguna. Ini paling sesuai
   dengan protokol Codex saat ini tanpa mengubah riwayat thread native.

2. Apakah compaction native Codex harus dinonaktifkan saat mesin konteks memiliki
   compaction?

   Rekomendasi: tidak, tidak pada awalnya. Compaction native Codex mungkin masih
   diperlukan untuk menjaga thread server aplikasi tetap hidup. Namun itu harus dilaporkan sebagai
   compaction Codex native, bukan sebagai compaction mesin konteks.

3. Apakah `before_prompt_build` harus berjalan sebelum atau sesudah perakitan mesin konteks?

   Rekomendasi: setelah proyeksi mesin konteks untuk Codex, agar hook harness generik
   melihat prompt/instruksi developer aktual yang akan diterima Codex. Jika
   paritas harness bawaan membutuhkan kebalikannya, enkode urutan yang dipilih dalam
   pengujian dan dokumentasikan di sini.

4. Bisakah server aplikasi Codex menerima override konteks/riwayat terstruktur di masa depan?

   Belum diketahui. Jika bisa, ganti lapisan proyeksi teks dengan protokol tersebut dan
   pertahankan panggilan siklus hidup tanpa perubahan.

## Kriteria penerimaan

- Giliran harness tertanam `codex/*` memanggil siklus hidup assemble milik mesin konteks
  yang dipilih.
- `systemPromptAddition` mesin konteks memengaruhi instruksi developer Codex.
- Konteks yang dirakit memengaruhi masukan giliran Codex secara deterministik.
- Giliran Codex yang berhasil memanggil `afterTurn` atau fallback ingest.
- Giliran Codex yang berhasil menjalankan pemeliharaan giliran mesin konteks.
- Giliran yang gagal/dibatalkan/yield-dibatalkan tidak menjalankan pemeliharaan giliran.
- Compaction yang dimiliki mesin konteks tetap menjadi yang utama untuk status OpenClaw/Plugin.
- Compaction native Codex tetap dapat diaudit sebagai perilaku Codex native.
- Perilaku mesin konteks harness bawaan yang ada tidak berubah.
- Perilaku harness Codex yang ada tidak berubah saat tidak ada mesin konteks non-legacy
  yang dipilih atau saat perakitan gagal.
