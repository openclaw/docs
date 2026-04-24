---
read_when:
    - Anda sedang menghubungkan perilaku siklus hidup mesin konteks ke harness Codex
    - Anda memerlukan lossless-claw atau Plugin mesin konteks lain agar berfungsi dengan sesi harness tertanam codex/*
    - Anda sedang membandingkan perilaku konteks PI tertanam dan app-server Codex
summary: Spesifikasi untuk membuat harness app-server Codex bawaan menghormati Plugin mesin konteks OpenClaw
title: Port Mesin Konteks Harness Codex
x-i18n:
    generated_at: "2026-04-24T09:16:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Port Mesin Konteks Harness Codex

## Status

Spesifikasi implementasi draf.

## Tujuan

Membuat harness app-server Codex bawaan menghormati kontrak siklus hidup
mesin konteks OpenClaw yang sama seperti yang sudah dihormati oleh giliran PI tertanam.

Sesi yang menggunakan `agents.defaults.embeddedHarness.runtime: "codex"` atau
model `codex/*` tetap harus memungkinkan Plugin mesin konteks yang dipilih, seperti
`lossless-claw`, mengontrol perakitan konteks, ingest pascagiliran, pemeliharaan, dan
kebijakan Compaction tingkat OpenClaw sejauh batas app-server Codex memungkinkan.

## Non-tujuan

- Jangan mengimplementasikan ulang internal app-server Codex.
- Jangan membuat Compaction thread native Codex menghasilkan ringkasan lossless-claw.
- Jangan mewajibkan model non-Codex menggunakan harness Codex.
- Jangan mengubah perilaku sesi ACP/acpx. Spesifikasi ini hanya untuk
  jalur harness agen tertanam non-ACP.
- Jangan membuat Plugin pihak ketiga mendaftarkan factory ekstensi app-server Codex;
  batas kepercayaan bundled-plugin yang ada tetap tidak berubah.

## Arsitektur saat ini

Loop run tertanam menyelesaikan mesin konteks yang dikonfigurasi sekali per run sebelum
memilih harness tingkat rendah konkret:

- `src/agents/pi-embedded-runner/run.ts`
  - menginisialisasi Plugin mesin konteks
  - memanggil `resolveContextEngine(params.config)`
  - meneruskan `contextEngine` dan `contextTokenBudget` ke
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` mendelegasikan ke harness agen yang dipilih:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex didaftarkan oleh Plugin Codex bawaan:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Implementasi harness Codex menerima `EmbeddedRunAttemptParams` yang sama seperti attempt
berbasis PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Artinya hook point yang dibutuhkan berada di dalam kode yang dikendalikan OpenClaw. Batas
eksternalnya adalah protokol app-server Codex itu sendiri: OpenClaw dapat mengontrol apa yang
dikirim ke `thread/start`, `thread/resume`, dan `turn/start`, serta dapat mengamati
notifikasi, tetapi tidak dapat mengubah penyimpanan thread internal atau compactor native Codex.

## Kesenjangan saat ini

Attempt PI tertanam memanggil siklus hidup mesin konteks secara langsung:

- bootstrap/pemeliharaan sebelum attempt
- assemble sebelum pemanggilan model
- afterTurn atau ingest setelah attempt
- pemeliharaan setelah giliran berhasil
- Compaction mesin konteks untuk mesin yang memiliki Compaction

Kode PI yang relevan:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Attempt app-server Codex saat ini menjalankan hook harness agen generik dan mencerminkan
transkrip, tetapi tidak memanggil `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, atau
`params.contextEngine.maintain`.

Kode Codex yang relevan:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Perilaku yang diinginkan

Untuk giliran harness Codex, OpenClaw harus mempertahankan siklus hidup ini:

1. Baca transkrip sesi OpenClaw yang dicerminkan.
2. Bootstrap mesin konteks aktif ketika file sesi sebelumnya ada.
3. Jalankan pemeliharaan bootstrap jika tersedia.
4. Assemble konteks menggunakan mesin konteks aktif.
5. Konversi konteks yang sudah dirakit menjadi input yang kompatibel dengan Codex.
6. Mulai atau lanjutkan thread Codex dengan instruksi developer yang menyertakan
   `systemPromptAddition` dari mesin konteks jika ada.
7. Mulai giliran Codex dengan prompt yang menghadap pengguna yang telah dirakit.
8. Cerminkan hasil Codex kembali ke transkrip OpenClaw.
9. Panggil `afterTurn` jika diimplementasikan, jika tidak `ingestBatch`/`ingest`, menggunakan snapshot transkrip yang dicerminkan.
10. Jalankan pemeliharaan giliran setelah giliran non-aborted yang berhasil.
11. Pertahankan sinyal Compaction native Codex dan hook Compaction OpenClaw.

## Batasan desain

### App-server Codex tetap kanonis untuk status thread native

Codex memiliki thread native dan riwayat tambahan internalnya sendiri. OpenClaw tidak boleh
mencoba mengubah riwayat internal app-server kecuali melalui panggilan protokol yang didukung.

Cermin transkrip OpenClaw tetap menjadi sumber untuk fitur OpenClaw:

- riwayat obrolan
- pencarian
- pembukuan `/new` dan `/reset`
- peralihan model atau harness di masa depan
- status Plugin mesin konteks

### Perakitan mesin konteks harus diproyeksikan ke input Codex

Antarmuka mesin konteks mengembalikan `AgentMessage[]` milik OpenClaw, bukan patch
thread Codex. `turn/start` pada app-server Codex menerima input pengguna saat ini, sementara
`thread/start` dan `thread/resume` menerima instruksi developer.

Karena itu implementasi memerlukan layer proyeksi. Versi pertama yang aman
harus menghindari berpura-pura dapat menggantikan riwayat internal Codex. Implementasi harus
menyuntikkan konteks yang telah dirakit sebagai materi prompt/instruksi developer yang deterministik di sekitar
giliran saat ini.

### Stabilitas prompt-cache penting

Untuk mesin seperti lossless-claw, konteks yang telah dirakit harus deterministik
untuk input yang tidak berubah. Jangan tambahkan timestamp, id acak, atau
urutan nondeterministik ke teks konteks yang dihasilkan.

### Semantik fallback PI tidak berubah

Pemilihan harness tetap seperti sekarang:

- `runtime: "pi"` memaksa PI
- `runtime: "codex"` memilih harness Codex yang terdaftar
- `runtime: "auto"` membiarkan harness Plugin mengklaim provider yang didukung
- `fallback: "none"` menonaktifkan fallback PI ketika tidak ada harness Plugin yang cocok

Pekerjaan ini mengubah apa yang terjadi setelah harness Codex dipilih.

## Rencana implementasi

### 1. Ekspor atau pindahkan helper attempt mesin konteks yang dapat digunakan ulang

Saat ini helper siklus hidup yang dapat digunakan ulang berada di bawah runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex sebaiknya tidak mengimpor dari path implementasi yang namanya menyiratkan PI jika
kita bisa menghindarinya.

Buat modul yang netral terhadap harness, misalnya:

- `src/agents/harness/context-engine-lifecycle.ts`

Pindahkan atau re-ekspor:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper kecil di sekitar `runContextEngineMaintenance`

Pastikan impor PI tetap berfungsi, baik dengan re-ekspor dari file lama atau memperbarui call site PI dalam PR yang sama.

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

- Menerima `AgentMessage[]` yang sudah dirakit, riwayat tercermin asli, dan prompt saat ini.
- Menentukan konteks mana yang masuk ke instruksi developer vs input pengguna saat ini.
- Mempertahankan prompt pengguna saat ini sebagai permintaan yang dapat ditindaklanjuti terakhir.
- Merender pesan sebelumnya dalam format yang stabil dan eksplisit.
- Menghindari metadata yang volatil.

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

- Letakkan `systemPromptAddition` ke dalam instruksi developer.
- Letakkan konteks transkrip yang telah dirakit sebelum prompt saat ini di `promptText`.
- Beri label dengan jelas sebagai konteks yang dirakit OpenClaw.
- Pertahankan prompt saat ini di bagian akhir.
- Kecualikan prompt pengguna saat ini yang duplikat jika prompt tersebut sudah muncul di bagian ekor.

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

Ini memang kurang elegan dibanding operasi native pada riwayat Codex, tetapi dapat diimplementasikan
di dalam OpenClaw dan mempertahankan semantik mesin konteks.

Peningkatan di masa depan: jika app-server Codex menampilkan protokol untuk mengganti atau
menambahkan riwayat thread, ubah layer proyeksi ini agar menggunakan API tersebut.

### 3. Hubungkan bootstrap sebelum startup thread Codex

Di `extensions/codex/src/app-server/run-attempt.ts`:

- Baca riwayat sesi yang dicerminkan seperti saat ini.
- Tentukan apakah file sesi sudah ada sebelum run ini. Gunakan helper
  yang memeriksa `fs.stat(params.sessionFile)` sebelum penulisan mirror.
- Buka `SessionManager` atau gunakan adapter session manager sempit jika helper
  membutuhkannya.
- Panggil helper bootstrap netral ketika `params.contextEngine` ada.

Pseudo-alur:

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

Gunakan konvensi `sessionKey` yang sama seperti bridge tool Codex dan mirror
transkrip. Saat ini Codex menghitung `sandboxSessionKey` dari `params.sessionKey` atau
`params.sessionId`; gunakan itu secara konsisten kecuali ada alasan untuk mempertahankan
`params.sessionKey` mentah.

### 4. Hubungkan assemble sebelum `thread/start` / `thread/resume` dan `turn/start`

Di `runCodexAppServerAttempt`:

1. Bangun dynamic tools terlebih dahulu, agar mesin konteks melihat nama tool yang benar-benar tersedia.
2. Baca riwayat sesi yang dicerminkan.
3. Jalankan context-engine `assemble(...)` ketika `params.contextEngine` ada.
4. Proyeksikan hasil yang telah dirakit ke:
   - penambahan instruksi developer
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
2. terapkan assemble/proyeksi mesin konteks
3. jalankan `before_prompt_build` dengan prompt/instruksi developer yang telah diproyeksikan

Urutan ini membuat hook prompt generik melihat prompt yang sama dengan yang akan diterima Codex. Jika
kita memerlukan paritas ketat dengan PI, jalankan assemble mesin konteks sebelum komposisi hook,
karena PI menerapkan `systemPromptAddition` dari mesin konteks ke system
prompt akhir setelah pipeline prompt-nya. Invarian yang penting adalah bahwa mesin konteks dan hook sama-sama mendapatkan urutan yang deterministik dan terdokumentasi.

Urutan yang direkomendasikan untuk implementasi pertama:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. tambahkan `systemPromptAddition` ke depan/belakang instruksi developer
4. proyeksikan pesan yang telah dirakit ke teks prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. teruskan instruksi developer akhir ke `startOrResumeThread(...)`
7. teruskan teks prompt akhir ke `buildTurnStartParams(...)`

Spesifikasi harus dikodekan dalam test agar perubahan di masa depan tidak mengubah urutan ini secara tidak sengaja.

### 5. Pertahankan pemformatan prompt-cache yang stabil

Helper proyeksi harus menghasilkan output yang stabil secara byte untuk input yang identik:

- urutan pesan stabil
- label peran stabil
- tanpa timestamp yang dihasilkan
- tanpa kebocoran urutan key objek
- tanpa delimiter acak
- tanpa id per run

Gunakan delimiter tetap dan bagian yang eksplisit.

### 6. Hubungkan pascagiliran setelah pencerminan transkrip

`CodexAppServerEventProjector` milik Codex membangun `messagesSnapshot` lokal untuk
giliran saat ini. `mirrorTranscriptBestEffort(...)` menulis snapshot tersebut ke
cermin transkrip OpenClaw.

Setelah pencerminan berhasil atau gagal, panggil finalizer mesin konteks dengan
snapshot pesan terbaik yang tersedia:

- Utamakan konteks sesi tercermin penuh setelah penulisan, karena `afterTurn`
  mengharapkan snapshot sesi, bukan hanya giliran saat ini.
- Fallback ke `historyMessages + result.messagesSnapshot` jika file sesi
  tidak dapat dibuka ulang.

Pseudo-alur:

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

Jika pencerminan gagal, tetap panggil `afterTurn` dengan snapshot fallback, tetapi catat dalam log
bahwa mesin konteks sedang melakukan ingest dari data giliran fallback.

### 7. Normalisasikan konteks runtime penggunaan dan prompt-cache

Hasil Codex menyertakan penggunaan yang dinormalisasi dari notifikasi token app-server ketika
tersedia. Teruskan penggunaan tersebut ke konteks runtime mesin konteks.

Jika app-server Codex pada akhirnya menampilkan detail cache read/write, petakan ke
`ContextEnginePromptCacheInfo`. Sampai saat itu, hilangkan `promptCache` alih-alih
menciptakan nol palsu.

### 8. Kebijakan Compaction

Ada dua sistem Compaction:

1. OpenClaw context-engine `compact()`
2. Codex app-server native `thread/compact/start`

Jangan diam-diam menyamakan keduanya.

#### `/compact` dan Compaction OpenClaw eksplisit

Ketika mesin konteks yang dipilih memiliki `info.ownsCompaction === true`, Compaction
OpenClaw eksplisit harus mengutamakan hasil `compact()` dari mesin konteks untuk
cermin transkrip OpenClaw dan status plugin.

Ketika harness Codex yang dipilih memiliki binding thread native, kita juga dapat
meminta Compaction native Codex agar thread app-server tetap sehat, tetapi ini
harus dilaporkan sebagai aksi backend terpisah di dalam detail.

Perilaku yang direkomendasikan:

- Jika `contextEngine.info.ownsCompaction === true`:
  - panggil `compact()` milik mesin konteks terlebih dahulu
  - lalu best-effort panggil Compaction native Codex ketika binding thread ada
  - kembalikan hasil mesin konteks sebagai hasil utama
  - sertakan status Compaction native Codex di `details.codexNativeCompaction`
- Jika mesin konteks aktif tidak memiliki Compaction:
  - pertahankan perilaku Compaction native Codex saat ini

Ini kemungkinan memerlukan perubahan pada `extensions/codex/src/app-server/compact.ts` atau
membungkusnya dari jalur Compaction generik, tergantung di mana
`maybeCompactAgentHarnessSession(...)` dipanggil.

#### Event native contextCompaction Codex di dalam giliran

Codex dapat mengeluarkan event item `contextCompaction` selama sebuah giliran. Pertahankan emisi hook
before/after compaction yang ada di `event-projector.ts`, tetapi jangan perlakukan
itu sebagai Compaction mesin konteks yang selesai.

Untuk mesin yang memiliki Compaction, keluarkan diagnostik eksplisit ketika Codex tetap melakukan
Compaction native:

- nama stream/event: stream `compaction` yang ada dapat diterima
- detail: `{ backend: "codex-app-server", ownsCompaction: true }`

Ini membuat pemisahannya dapat diaudit.

### 9. Perilaku reset sesi dan binding

`reset(...)` pada harness Codex yang ada saat ini menghapus binding app-server Codex dari
file sesi OpenClaw. Pertahankan perilaku tersebut.

Pastikan juga pembersihan status mesin konteks tetap terjadi melalui jalur siklus hidup sesi OpenClaw yang ada. Jangan tambahkan pembersihan khusus Codex kecuali siklus hidup mesin konteks saat ini memang melewatkan event reset/delete untuk semua harness.

### 10. Penanganan error

Ikuti semantik PI:

- kegagalan bootstrap memberi peringatan dan tetap lanjut
- kegagalan assemble memberi peringatan dan fallback ke pesan/prompt pipeline yang belum dirakit
- kegagalan afterTurn/ingest memberi peringatan dan menandai finalisasi pascagiliran sebagai tidak berhasil
- pemeliharaan hanya berjalan setelah giliran yang berhasil, tidak aborted, dan tidak yield
- error Compaction tidak boleh dicoba ulang sebagai prompt baru

Tambahan khusus Codex:

- Jika proyeksi konteks gagal, beri peringatan dan fallback ke prompt asli.
- Jika cermin transkrip gagal, tetap coba finalisasi mesin konteks dengan
  pesan fallback.
- Jika Compaction native Codex gagal setelah Compaction mesin konteks berhasil,
  jangan gagalkan seluruh Compaction OpenClaw ketika mesin konteks adalah yang utama.

## Rencana pengujian

### Unit test

Tambahkan test di bawah `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex memanggil `bootstrap` ketika file sesi ada.
   - Codex memanggil `assemble` dengan pesan yang dicerminkan, anggaran token, nama tool,
     mode sitasi, id model, dan prompt.
   - `systemPromptAddition` disertakan dalam instruksi developer.
   - Pesan yang telah dirakit diproyeksikan ke prompt sebelum permintaan saat ini.
   - Codex memanggil `afterTurn` setelah pencerminan transkrip.
   - Tanpa `afterTurn`, Codex memanggil `ingestBatch` atau `ingest` per pesan.
   - Pemeliharaan giliran berjalan setelah giliran yang berhasil.
   - Pemeliharaan giliran tidak berjalan pada prompt error, abort, atau yield abort.

2. `context-engine-projection.test.ts`
   - output stabil untuk input yang identik
   - tidak ada prompt saat ini yang duplikat ketika riwayat yang dirakit sudah menyertakannya
   - menangani riwayat kosong
   - mempertahankan urutan peran
   - menyertakan system prompt addition hanya dalam instruksi developer

3. `compact.context-engine.test.ts`
   - hasil utama mesin konteks owning menang
   - status Compaction native Codex muncul dalam detail ketika juga dicoba
   - kegagalan native Codex tidak menggagalkan Compaction mesin konteks owning
   - mesin konteks non-owning mempertahankan perilaku Compaction native saat ini

### Test yang ada untuk diperbarui

- `extensions/codex/src/app-server/run-attempt.test.ts` jika ada, jika tidak
  test run app-server Codex terdekat.
- `extensions/codex/src/app-server/event-projector.test.ts` hanya jika detail event
  compaction berubah.
- `src/agents/harness/selection.test.ts` seharusnya tidak memerlukan perubahan kecuali perilaku konfigurasi berubah; test ini seharusnya tetap stabil.
- Test mesin konteks PI harus terus lolos tanpa perubahan.

### Test integrasi / live

Tambahkan atau perluas smoke test live harness Codex:

- konfigurasikan `plugins.slots.contextEngine` ke test engine
- konfigurasikan `agents.defaults.model` ke model `codex/*`
- konfigurasikan `agents.defaults.embeddedHarness.runtime = "codex"`
- tegaskan bahwa test engine mengamati:
  - bootstrap
  - assemble
  - afterTurn atau ingest
  - pemeliharaan

Hindari mewajibkan lossless-claw dalam test inti OpenClaw. Gunakan Plugin mesin konteks palsu kecil di dalam repo.

## Observabilitas

Tambahkan log debug di sekitar panggilan siklus hidup mesin konteks Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` dengan alasan
- `codex native compaction completed alongside context-engine compaction`

Hindari mencatat prompt penuh atau isi transkrip.

Tambahkan field terstruktur jika berguna:

- `sessionId`
- `sessionKey` disamarkan atau dihilangkan sesuai praktik logging yang ada
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migrasi / kompatibilitas

Ini harus backward-compatible:

- Jika tidak ada mesin konteks yang dikonfigurasi, perilaku mesin konteks legacy harus
  setara dengan perilaku harness Codex saat ini.
- Jika context-engine `assemble` gagal, Codex harus tetap lanjut dengan
  jalur prompt asli.
- Binding thread Codex yang ada harus tetap valid.
- Dynamic tool fingerprinting tidak boleh menyertakan output mesin konteks; jika tidak
  setiap perubahan konteks dapat memaksa thread Codex baru. Hanya katalog tool
  yang boleh memengaruhi dynamic tool fingerprint.

## Pertanyaan terbuka

1. Apakah konteks yang telah dirakit harus disuntikkan seluruhnya ke prompt pengguna, seluruhnya
   ke instruksi developer, atau dibagi?

   Rekomendasi: dibagi. Letakkan `systemPromptAddition` di instruksi developer;
   letakkan konteks transkrip yang telah dirakit di pembungkus prompt pengguna. Ini paling cocok
   dengan protokol Codex saat ini tanpa mengubah riwayat thread native.

2. Apakah Compaction native Codex harus dinonaktifkan ketika mesin konteks memiliki
   Compaction?

   Rekomendasi: tidak, setidaknya tidak pada awalnya. Compaction native Codex mungkin tetap
   diperlukan agar thread app-server tetap hidup. Tetapi harus dilaporkan sebagai
   Compaction native Codex, bukan sebagai Compaction mesin konteks.

3. Apakah `before_prompt_build` harus berjalan sebelum atau sesudah assemble mesin konteks?

   Rekomendasi: setelah proyeksi mesin konteks untuk Codex, agar harness generik
   hook melihat prompt/instruksi developer aktual yang akan diterima Codex. Jika paritas dengan PI
   memerlukan kebalikannya, enkode urutan yang dipilih dalam test dan dokumentasikan
   di sini.

4. Apakah app-server Codex dapat menerima override konteks/riwayat terstruktur di masa depan?

   Belum diketahui. Jika bisa, gantikan layer proyeksi teks dengan protokol tersebut dan
   biarkan panggilan siklus hidup tetap tidak berubah.

## Kriteria penerimaan

- Giliran harness tertanam `codex/*` memanggil siklus hidup assemble milik mesin konteks yang dipilih.
- `systemPromptAddition` dari mesin konteks memengaruhi instruksi developer Codex.
- Konteks yang telah dirakit memengaruhi input giliran Codex secara deterministik.
- Giliran Codex yang berhasil memanggil `afterTurn` atau fallback ingest.
- Giliran Codex yang berhasil menjalankan pemeliharaan giliran mesin konteks.
- Giliran yang gagal/aborted/yield-aborted tidak menjalankan pemeliharaan giliran.
- Compaction yang dimiliki mesin konteks tetap menjadi yang utama untuk status OpenClaw/plugin.
- Compaction native Codex tetap dapat diaudit sebagai perilaku native Codex.
- Perilaku mesin konteks PI yang ada tidak berubah.
- Perilaku harness Codex yang ada tidak berubah ketika tidak ada mesin konteks non-legacy
  yang dipilih atau ketika assemble gagal.
