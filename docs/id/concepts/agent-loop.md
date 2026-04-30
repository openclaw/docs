---
read_when:
    - Anda membutuhkan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda sedang mengubah antrean sesi, penulisan transkrip, atau perilaku kunci tulis sesi
summary: Siklus hidup loop agen, aliran, dan semantik menunggu
title: Siklus agen
x-i18n:
    generated_at: "2026-04-30T18:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agentik adalah proses jalan “nyata” penuh dari sebuah agen: penerimaan → perakitan konteks → inferensi model →
eksekusi alat → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah sebuah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, sebuah loop adalah satu proses jalan terserialisasi per sesi yang memancarkan peristiwa siklus hidup dan stream
saat model berpikir, memanggil alat, dan melakukan streaming keluaran. Dokumen ini menjelaskan bagaimana loop autentik tersebut
dirangkai dari ujung ke ujung.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), mempersistensikan metadata sesi, dan langsung mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan model + default thinking/verbose/trace
   - memuat snapshot skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **lifecycle end/error** jika loop tertanam tidak memancarkannya
3. `runEmbeddedPiAgent`:
   - menserialkan proses jalan melalui antrean per sesi + global
   - menyelesaikan model + profil autentikasi dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta asisten/alat
   - menerapkan timeout -> membatalkan proses jalan jika terlampaui
   - untuk giliran server aplikasi Codex, membatalkan giliran yang diterima jika berhenti menghasilkan progres server aplikasi sebelum peristiwa terminal
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa siklus hidup => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Proses jalan diserialkan per kunci sesi (jalur sesi) dan secara opsional melalui jalur global.
- Ini mencegah race alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Kanal perpesanan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem jalur ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh kunci tulis sesi pada file sesi. Kunci ini
  sadar proses dan berbasis file, sehingga dapat menangkap penulis yang melewati antrean dalam proses atau berasal dari
  proses lain.
- Kunci tulis sesi secara default tidak reentrant. Jika helper secara sengaja menumpuk akuisisi
  kunci yang sama sambil mempertahankan satu penulis logis, helper tersebut harus ikut serta secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; proses jalan sandbox dapat dialihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan diinjeksi ke env dan prompt.
- File bootstrap/konteks diselesaikan dan diinjeksi ke laporan prompt sistem.
- Kunci tulis sesi diperoleh; `SessionManager` dibuka dan disiapkan sebelum streaming. Setiap
  jalur penulisan ulang transkrip, compaction, atau pemotongan berikutnya harus mengambil kunci yang sama sebelum membuka atau
  memutasi file transkrip.

## Perakitan prompt + prompt sistem

- Prompt sistem dibangun dari prompt dasar OpenClaw, prompt skills, konteks bootstrap, dan override per proses jalan.
- Batas spesifik model dan token cadangan compaction diterapkan.
- Lihat [Prompt sistem](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mengintersep)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa siklus hidup.
- **Hook Plugin**: titik ekstensi di dalam siklus hidup agen/alat dan pipeline gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum prompt sistem difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hook).

Lihat [Hook](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook Plugin (siklus hidup agen + gateway)

Ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan sebelum sesi (tanpa `messages`) untuk secara deterministik meng-override penyedia/model sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menginjeksi `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per giliran dan kolom konteks sistem untuk panduan stabil yang harus berada di ruang prompt sistem.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan di salah satu fase; utamakan hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan Plugin mengklaim giliran dan mengembalikan balasan sintetis atau sepenuhnya membisukan giliran.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata proses jalan setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau menganotasi siklus compaction.
- **`before_tool_call` / `after_tool_call`**: mengintersep parameter/hasil alat.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir pemasangan skill atau Plugin.
- **`tool_result_persist`**: secara sinkron mentransformasi hasil alat sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa siklus hidup gateway.

Aturan keputusan hook untuk guard keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blokir sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blokir sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook Plugin](/id/plugins/hooks) untuk API hook dan detail pendaftaran.

Harness dapat mengadaptasi hook ini secara berbeda. Harness server aplikasi Codex mempertahankan
hook Plugin OpenClaw sebagai kontrak kompatibilitas untuk permukaan tercermin yang terdokumentasi,
sementara hook native Codex tetap menjadi mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten di-streaming dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming penalaran dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi alat + alat perpesanan

- Peristiwa mulai/perbarui/akhir alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat perpesanan dilacak untuk menekan konfirmasi asisten yang duplikat.

## Pembentukan balasan + supresi

- Payload akhir dirakit dari:
  - teks asisten (dan penalaran opsional)
  - ringkasan alat inline (ketika verbose + diizinkan)
  - teks kesalahan asisten ketika model mengalami kesalahan
- Token senyap persis `NO_REPLY` / `no_reply` difilter dari payload
  keluar.
- Duplikat alat perpesanan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan sebuah alat mengalami kesalahan, balasan kesalahan alat fallback dipancarkan
  (kecuali alat perpesanan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + percobaan ulang

- Compaction otomatis memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Pada percobaan ulang, buffer dalam memori dan ringkasan alat direset untuk menghindari keluaran duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa alat streaming dari pi-agent-core

## Penanganan kanal chat

- Delta asisten di-buffer menjadi pesan chat `delta`.
- Chat `final` dipancarkan pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya waktu tunggu). Parameter `timeoutMs` meng-override.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); diterapkan di timer batal `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` giliran agen terisolasi dimiliki oleh cron. Scheduler memulai timer tersebut ketika eksekusi dimulai, membatalkan proses jalan dasar pada tenggat yang dikonfigurasi, lalu menjalankan pembersihan berbatas sebelum mencatat timeout sehingga sesi anak yang basi tidak dapat membuat jalur macet.
- Pemulihan sesi macet: dengan diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` mendeteksi sesi `processing` yang panjang. Proses jalan tertanam aktif, operasi balasan aktif, dan tugas jalur sesi aktif tetap hanya peringatan secara default; jika diagnostik tidak menunjukkan pekerjaan aktif untuk sesi tersebut, watchdog melepaskan jalur sesi yang terdampak agar pekerjaan startup yang mengantre dapat terkuras.
- Timeout idle model: OpenClaw membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog idle ini untuk penyedia lokal/self-hosted yang lambat; jika tidak, OpenClaw menggunakan `agents.defaults.timeoutSeconds` ketika dikonfigurasi, dibatasi pada 120 dtk secara default. Proses jalan yang dipicu Cron tanpa timeout model atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.
- Timeout permintaan HTTP penyedia: `models.providers.<id>.timeoutSeconds` berlaku untuk fetch HTTP model penyedia tersebut, termasuk connect, header, body, timeout permintaan SDK, penanganan abort guarded-fetch total, dan watchdog idle stream model. Gunakan ini untuk penyedia lokal/self-hosted yang lambat seperti Ollama sebelum menaikkan timeout runtime agen secara keseluruhan.

## Tempat hal dapat berakhir lebih awal

- Timeout agen (batal)
- AbortSignal (batal)
- Putusnya Gateway atau timeout RPC
- Timeout `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) — alat agen yang tersedia
- [Hook](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) — cara percakapan panjang dirangkum
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/penalaran
