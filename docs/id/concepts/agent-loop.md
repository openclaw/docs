---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda mengubah pengantrean sesi, penulisan transkrip, atau perilaku kunci tulis sesi
summary: Siklus hidup perulangan agen, aliran, dan semantik tunggu
title: Siklus agen
x-i18n:
    generated_at: "2026-05-06T09:06:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agentik adalah eksekusi "nyata" penuh dari sebuah agen: intake → penyusunan konteks → inferensi model →
eksekusi alat → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa siklus hidup dan stream
saat model berpikir, memanggil alat, dan melakukan streaming keluaran. Dokumen ini menjelaskan bagaimana loop autentik itu
dirangkai dari ujung ke ujung.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), mempertahankan metadata sesi, segera mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan model + default thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **akhir/kesalahan siklus hidup** jika loop tertanam tidak memancarkan salah satunya
3. `runEmbeddedPiAgent`:
   - menserialkan eksekusi melalui antrean per-sesi + global
   - menyelesaikan model + profil autentikasi dan membangun sesi pi
   - berlangganan peristiwa pi dan melakukan streaming delta asisten/alat
   - memberlakukan timeout -> membatalkan eksekusi jika terlampaui
   - untuk giliran server aplikasi Codex, membatalkan giliran yang diterima yang berhenti menghasilkan progres server aplikasi sebelum peristiwa terminal
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa siklus hidup => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **akhir/kesalahan siklus hidup** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Pengantrean + konkurensi

- Eksekusi diserialkan per kunci sesi (jalur sesi) dan secara opsional melalui jalur global.
- Ini mencegah race alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Kanal perpesanan dapat memilih mode antrean (collect/steer/followup) yang mengalirkan masukan ke sistem jalur ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh kunci tulis sesi pada file sesi. Kunci ini
  sadar proses dan berbasis file, sehingga menangkap penulis yang melewati antrean dalam-proses atau berasal dari
  proses lain. Penulis transkrip sesi menunggu hingga `session.writeLock.acquireTimeoutMs`
  sebelum melaporkan sesi sebagai sibuk; defaultnya adalah `60000` md.
- Kunci tulis sesi secara default tidak reentrant. Jika helper sengaja menumpuk akuisisi
  kunci yang sama sambil mempertahankan satu penulis logis, helper tersebut harus memilih ikut secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; eksekusi tersandbox dapat dialihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan kembali dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan prompt sistem.
- Kunci tulis sesi diperoleh; `SessionManager` dibuka dan disiapkan sebelum streaming. Setiap
  jalur penulisan ulang transkrip, Compaction, atau pemotongan nantinya harus mengambil kunci yang sama sebelum membuka atau
  memutasi file transkrip.

## Penyusunan prompt + prompt sistem

- Prompt sistem dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per-eksekusi.
- Batas khusus model dan token cadangan Compaction diberlakukan.
- Lihat [Prompt sistem](/id/concepts/system-prompt) untuk mengetahui apa yang dilihat model.

## Titik kait (tempat Anda dapat mengintersepsi)

OpenClaw memiliki dua sistem kait:

- **Kait internal** (kait Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa siklus hidup.
- **Kait Plugin**: titik ekstensi di dalam siklus hidup agen/alat dan pipeline Gateway.

### Kait internal (kait Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum prompt sistem difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Kait perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lain (lihat dokumen Kait).

Lihat [Kait](/id/automation/hooks) untuk penyiapan dan contoh.

### Kait Plugin (siklus hidup agen + gateway)

Ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan pra-sesi (tanpa `messages`) untuk secara deterministik menimpa penyedia/model sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah pemuatan sesi (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per-giliran dan field konteks sistem untuk panduan stabil yang seharusnya berada di ruang prompt sistem.
- **`before_agent_start`**: kait kompatibilitas lama yang dapat berjalan di salah satu fase; utamakan kait eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan Plugin mengklaim giliran dan mengembalikan balasan sintetis atau membisukan giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau menganotasi siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: mengintersepsi parameter/hasil alat.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir instalasi skill atau Plugin.
- **`tool_result_persist`**: secara sinkron mentransformasi hasil alat sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: kait pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa siklus hidup gateway.

Aturan keputusan kait untuk penjaga keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Kait Plugin](/id/plugins/hooks) untuk API kait dan detail pendaftaran.

Harness dapat mengadaptasi kait ini secara berbeda. Harness server aplikasi Codex mempertahankan
kait Plugin OpenClaw sebagai kontrak kompatibilitas untuk permukaan cermin yang terdokumentasi,
sementara kait native Codex tetap menjadi mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten di-streaming dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming penalaran dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku pemotongan chunk dan balasan blok.

## Eksekusi alat + alat perpesanan

- Peristiwa mulai/perbarui/akhir alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat perpesanan dilacak untuk menekan konfirmasi asisten duplikat.

## Pembentukan balasan + penekanan

- Payload akhir disusun dari:
  - teks asisten (dan penalaran opsional)
  - ringkasan alat inline (saat verbose + diizinkan)
  - teks kesalahan asisten saat model mengalami kesalahan
- Token diam persis `NO_REPLY` / `no_reply` difilter dari payload
  keluar.
- Duplikat alat perpesanan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan alat mengalami kesalahan, balasan kesalahan alat fallback dipancarkan
  (kecuali alat perpesanan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + percobaan ulang

- Compaction otomatis memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Saat percobaan ulang, buffer dalam memori dan ringkasan alat direset untuk menghindari keluaran duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline Compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa alat streaming dari pi-agent-core

## Penanganan kanal chat

- Delta asisten dibuffer menjadi pesan `delta` chat.
- `final` chat dipancarkan pada **akhir/kesalahan siklus hidup**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya penantian). Parameter `timeoutMs` menimpa ini.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); diberlakukan di timer pembatalan `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` giliran-agen terisolasi dimiliki oleh cron. Penjadwal memulai timer itu saat eksekusi dimulai, membatalkan eksekusi yang mendasarinya pada tenggat yang dikonfigurasi, lalu menjalankan pembersihan berbatas sebelum mencatat timeout agar sesi anak yang stale tidak dapat membuat jalur tetap tersangkut.
- Diagnostik keaktifan sesi: dengan diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` mengklasifikasikan sesi `processing` yang lama yang tidak memiliki balasan, alat, status, blok, atau progres ACP yang diamati. Eksekusi tertanam, panggilan model, dan panggilan alat yang aktif dilaporkan sebagai `session.long_running`; pekerjaan aktif tanpa progres terbaru dilaporkan sebagai `session.stalled`; `session.stuck` dicadangkan untuk pencatatan sesi stale tanpa pekerjaan aktif. Pencatatan sesi stale segera melepaskan jalur sesi yang terdampak; eksekusi tertanam yang macet hanya dibatalkan-dikuras setelah `diagnostics.stuckSessionAbortMs` (default: setidaknya 10 menit dan 5x ambang peringatan) agar pekerjaan yang mengantre dapat dilanjutkan tanpa memutus eksekusi yang hanya lambat. Pemulihan memancarkan hasil requested/completed terstruktur, dan status diagnostik ditandai idle hanya jika generasi pemrosesan yang sama masih berjalan. Diagnostik `session.stuck` berulang melakukan back off selama sesi tetap tidak berubah.
- Timeout idle model: OpenClaw membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog idle ini untuk penyedia lokal/self-hosted yang lambat; jika tidak, OpenClaw menggunakan `agents.defaults.timeoutSeconds` saat dikonfigurasi, dibatasi pada 120 dtk secara default. Eksekusi yang dipicu Cron tanpa timeout model atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.
- Timeout permintaan HTTP penyedia: `models.providers.<id>.timeoutSeconds` berlaku untuk pengambilan HTTP model penyedia tersebut, termasuk koneksi, header, body, timeout permintaan SDK, penanganan pembatalan guarded-fetch total, dan watchdog idle stream model. Gunakan ini untuk penyedia lokal/self-hosted yang lambat seperti Ollama sebelum menaikkan seluruh timeout runtime agen.

## Tempat hal dapat berakhir lebih awal

- Timeout agen (batal)
- AbortSignal (batal)
- Pemutusan Gateway atau timeout RPC
- Timeout `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) — alat agen yang tersedia
- [Kait](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) — bagaimana percakapan panjang diringkas
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat berpikir/penalaran
