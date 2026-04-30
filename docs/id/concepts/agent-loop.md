---
read_when:
    - Anda membutuhkan panduan langkah demi langkah yang tepat tentang perulangan agen atau peristiwa siklus hidup
    - Anda mengubah pengantrean sesi, penulisan transkrip, atau perilaku kunci tulis sesi
summary: Siklus hidup perulangan agen, aliran, dan semantik menunggu
title: Siklus agen
x-i18n:
    generated_at: "2026-04-30T09:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agentik adalah keseluruhan eksekusi “nyata” sebuah agen: penerimaan → perakitan konteks → inferensi model →
eksekusi alat → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa siklus hidup dan stream
saat model berpikir, memanggil alat, dan men-stream keluaran. Dokumen ini menjelaskan bagaimana loop autentik itu
dirangkai dari ujung ke ujung.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, me-resolve sesi (sessionKey/sessionId), mempersistenkan metadata sesi, mengembalikan `{ runId, acceptedAt }` segera.
2. `agentCommand` menjalankan agen:
   - me-resolve default model + thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **akhir/kesalahan siklus hidup** jika loop tersemat tidak memancarkannya
3. `runEmbeddedPiAgent`:
   - menserialisasi eksekusi melalui antrean per-sesi + global
   - me-resolve model + profil auth dan membangun sesi pi
   - berlangganan peristiwa pi dan men-stream delta asisten/alat
   - menerapkan timeout -> membatalkan eksekusi jika terlampaui
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa siklus hidup => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **akhir/kesalahan siklus hidup** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Eksekusi diserialisasi per kunci sesi (jalur sesi) dan secara opsional melalui jalur global.
- Ini mencegah race alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Kanal pesan dapat memilih mode antrean (collect/steer/followup) yang memberi masukan ke sistem jalur ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh kunci tulis sesi pada file sesi. Kunci tersebut
  sadar proses dan berbasis file, sehingga menangkap penulis yang melewati antrean dalam-proses atau berasal dari
  proses lain.
- Kunci tulis sesi secara default tidak reentrant. Jika helper sengaja menumpuk akuisisi
  kunci yang sama sambil mempertahankan satu penulis logis, helper tersebut harus ikut serta secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace di-resolve dan dibuat; eksekusi sandbox dapat diarahkan ulang ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks di-resolve dan disuntikkan ke laporan prompt sistem.
- Kunci tulis sesi diambil; `SessionManager` dibuka dan disiapkan sebelum streaming. Setiap
  jalur penulisan ulang transkrip, Compaction, atau pemangkasan berikutnya harus mengambil kunci yang sama sebelum membuka atau
  memutasi file transkrip.

## Perakitan prompt + prompt sistem

- Prompt sistem dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per-eksekusi.
- Batas khusus model dan token cadangan Compaction diterapkan.
- Lihat [Prompt sistem](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mengintersepsi)

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

- **`before_model_resolve`**: berjalan pra-sesi (tanpa `messages`) untuk meng-override penyedia/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah pemuatan sesi (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per-giliran dan field konteks sistem untuk panduan stabil yang harus berada di ruang prompt sistem.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan di salah satu fase; lebih pilih hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan Plugin mengklaim giliran dan mengembalikan balasan sintetis atau membungkam giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau menganotasi siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: mengintersepsi parameter/hasil alat.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir pemasangan skill atau Plugin.
- **`tool_result_persist`**: mentransformasi hasil alat secara sinkron sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa siklus hidup gateway.

Aturan keputusan hook untuk penjaga keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook Plugin](/id/plugins/hooks) untuk API hook dan detail pendaftaran.

Harness dapat mengadaptasi hook ini secara berbeda. Harness app-server Codex mempertahankan
hook Plugin OpenClaw sebagai kontrak kompatibilitas untuk surface tercermin yang terdokumentasi,
sementara hook native Codex tetap menjadi mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten di-stream dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming reasoning dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi alat + alat pesan

- Peristiwa mulai/perbarui/akhir alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat pesan dilacak untuk menekan konfirmasi asisten duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks asisten (dan reasoning opsional)
  - ringkasan alat inline (ketika verbose + diizinkan)
  - teks kesalahan asisten ketika model mengalami kesalahan
- Token senyap persis `NO_REPLY` / `no_reply` difilter dari payload
  keluar.
- Duplikat alat pesan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan alat mengalami kesalahan, balasan fallback kesalahan alat dipancarkan
  (kecuali alat pesan sudah mengirim balasan yang terlihat pengguna).

## Compaction + percobaan ulang

- Auto-Compaction memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Saat percobaan ulang, buffer dalam memori dan ringkasan alat direset untuk menghindari keluaran duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline Compaction.

## Stream peristiwa (hari ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa alat streaming dari pi-agent-core

## Penanganan kanal chat

- Delta asisten di-buffer ke dalam pesan `delta` chat.
- `final` chat dipancarkan pada **akhir/kesalahan siklus hidup**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya penantian). Parameter `timeoutMs` meng-override.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); diterapkan di timer batal `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` giliran agen terisolasi dimiliki oleh cron. Scheduler memulai timer itu saat eksekusi dimulai, membatalkan eksekusi dasar pada tenggat yang dikonfigurasi, lalu menjalankan pembersihan berbatas sebelum mencatat timeout sehingga sesi anak yang stale tidak dapat membuat jalur macet.
- Pemulihan sesi macet: dengan diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` mendeteksi sesi `processing` yang lama. Eksekusi tersemat aktif, operasi balasan aktif, dan tugas jalur sesi aktif tetap hanya-peringatan secara default; jika diagnostik menunjukkan tidak ada pekerjaan aktif untuk sesi, watchdog melepaskan jalur sesi terdampak agar pekerjaan startup yang mengantre dapat mengalir.
- Timeout idle model: OpenClaw membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog idle ini untuk penyedia lokal/self-hosted yang lambat; jika tidak, OpenClaw menggunakan `agents.defaults.timeoutSeconds` ketika dikonfigurasi, dibatasi pada 120 dtk secara default. Eksekusi yang dipicu Cron tanpa timeout model atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.
- Timeout permintaan HTTP penyedia: `models.providers.<id>.timeoutSeconds` berlaku untuk fetch HTTP model penyedia tersebut, termasuk connect, header, body, timeout permintaan SDK, penanganan batal guarded-fetch total, dan watchdog idle stream model. Gunakan ini untuk penyedia lokal/self-hosted yang lambat seperti Ollama sebelum menaikkan timeout runtime seluruh agen.

## Tempat hal dapat berakhir lebih awal

- Timeout agen (batal)
- AbortSignal (batal)
- Gateway terputus atau timeout RPC
- Timeout `agent.wait` (hanya penantian, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) — alat agen yang tersedia
- [Hook](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) — bagaimana percakapan panjang diringkas
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/reasoning
