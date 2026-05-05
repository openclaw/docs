---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda sedang mengubah pengantrean sesi, penulisan transkrip, atau perilaku kunci penulisan sesi
summary: Siklus hidup loop agen, aliran, dan semantik menunggu
title: Siklus agen
x-i18n:
    generated_at: "2026-05-05T06:16:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agentik adalah seluruh eksekusi “nyata” dari sebuah agen: intake → perakitan konteks → inferensi model →
eksekusi alat → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, sebuah loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa lifecycle dan stream
saat model berpikir, memanggil alat, dan melakukan streaming keluaran. Dokumen ini menjelaskan bagaimana loop autentik itu
dirangkai dari ujung ke ujung.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), menyimpan metadata sesi, lalu segera mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan model + default thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **lifecycle end/error** jika loop tertanam tidak memancarkannya
3. `runEmbeddedPiAgent`:
   - menserialkan eksekusi melalui antrean per-sesi + global
   - menyelesaikan model + profil autentikasi dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta asisten/alat
   - memberlakukan timeout -> membatalkan eksekusi jika terlampaui
   - untuk giliran app-server Codex, membatalkan giliran yang diterima jika berhenti menghasilkan progres app-server sebelum peristiwa terminal
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Eksekusi diserialkan per kunci sesi (lane sesi) dan secara opsional melalui lane global.
- Ini mencegah race alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Channel perpesanan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem lane ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh kunci tulis sesi pada berkas sesi. Kunci ini
  sadar proses dan berbasis berkas, sehingga menangkap penulis yang melewati antrean dalam proses atau berasal dari
  proses lain. Penulis transkrip sesi menunggu hingga `session.writeLock.acquireTimeoutMs`
  sebelum melaporkan sesi sebagai sibuk; default-nya adalah `60000` md.
- Kunci tulis sesi secara default tidak reentrant. Jika helper sengaja menumpuk akuisisi
  kunci yang sama sambil mempertahankan satu penulis logis, ia harus ikut serta secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; eksekusi tersandbox dapat dialihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env dan prompt.
- Berkas bootstrap/konteks diselesaikan dan disuntikkan ke laporan prompt sistem.
- Kunci tulis sesi diambil; `SessionManager` dibuka dan dipersiapkan sebelum streaming. Jalur
  penulisan ulang transkrip, Compaction, atau pemangkasan apa pun setelahnya harus mengambil kunci yang sama sebelum membuka atau
  memutasi berkas transkrip.

## Perakitan prompt + prompt sistem

- Prompt sistem dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per-eksekusi.
- Batas khusus model dan token cadangan Compaction diberlakukan.
- Lihat [Prompt sistem](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mengintersepsi)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa lifecycle.
- **Hook Plugin**: titik ekstensi di dalam lifecycle agen/alat dan pipeline gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun berkas bootstrap sebelum prompt sistem difinalisasi.
  Gunakan ini untuk menambah/menghapus berkas konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lain (lihat dokumen Hook).

Lihat [Hook](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook Plugin (lifecycle agen + gateway)

Ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan pra-sesi (tanpa `messages`) untuk menimpa provider/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per-giliran dan field konteks-sistem untuk panduan stabil yang harus berada di ruang prompt sistem.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan di fase mana pun; utamakan hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan Plugin mengklaim giliran dan mengembalikan balasan sintetis atau meniadakan giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau menganotasi siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: mengintersepsi parameter/hasil alat.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir instalasi skill atau Plugin.
- **`tool_result_persist`**: mentransformasi hasil alat secara sinkron sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas lifecycle sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa lifecycle gateway.

Aturan keputusan hook untuk guard keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook Plugin](/id/plugins/hooks) untuk API hook dan detail pendaftaran.

Harness dapat mengadaptasi hook ini secara berbeda. Harness app-server Codex menjaga
hook Plugin OpenClaw sebagai kontrak kompatibilitas untuk surface terdokumentasi yang dicerminkan,
sementara hook native Codex tetap menjadi mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten di-streaming dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial pada `text_end` atau `message_end`.
- Streaming penalaran dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi alat + alat perpesanan

- Peristiwa mulai/perbarui/selesai alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat perpesanan dilacak untuk menekan konfirmasi asisten duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks asisten (dan penalaran opsional)
  - ringkasan alat inline (saat verbose + diizinkan)
  - teks error asisten saat model mengalami error
- Token senyap persis `NO_REPLY` / `no_reply` difilter dari
  payload keluar.
- Duplikat alat perpesanan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan sebuah alat mengalami error, balasan error alat fallback dipancarkan
  (kecuali alat perpesanan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + percobaan ulang

- Compaction otomatis memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Pada percobaan ulang, buffer dalam memori dan ringkasan alat direset untuk menghindari keluaran duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline Compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa alat streaming dari pi-agent-core

## Penanganan channel chat

- Delta asisten dibuffer ke dalam pesan chat `delta`.
- Chat `final` dipancarkan pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya penantian). Parameter `timeoutMs` menimpa.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); diberlakukan dalam timer pembatalan `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` giliran-agen terisolasi dimiliki oleh cron. Scheduler memulai timer itu saat eksekusi dimulai, membatalkan eksekusi yang mendasarinya pada tenggat yang dikonfigurasi, lalu menjalankan pembersihan terbatas sebelum mencatat timeout sehingga sesi anak yang basi tidak dapat membuat lane tersangkut.
- Diagnostik keaktifan sesi: dengan diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` mengklasifikasikan sesi `processing` yang panjang dan tidak memiliki balasan, alat, status, blok, atau progres ACP yang teramati. Eksekusi tertanam aktif, panggilan model, dan panggilan alat dilaporkan sebagai `session.long_running`; pekerjaan aktif tanpa progres terbaru dilaporkan sebagai `session.stalled`; `session.stuck` dicadangkan untuk pembukuan sesi basi tanpa pekerjaan aktif. Pembukuan sesi basi segera melepaskan lane sesi yang terdampak; eksekusi tertanam yang stalled hanya di-abort-drain setelah `diagnostics.stuckSessionAbortMs` (default: setidaknya 10 menit dan 5x ambang peringatan) sehingga pekerjaan antrean dapat dilanjutkan tanpa memutus eksekusi yang sekadar lambat. Pemulihan memancarkan hasil terstruktur requested/completed, dan status diagnostik ditandai idle hanya jika generasi processing yang sama masih current. Diagnostik `session.stuck` berulang melakukan back off selama sesi tetap tidak berubah.
- Timeout idle model: OpenClaw membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog idle ini untuk provider lokal/self-hosted yang lambat; jika tidak, OpenClaw menggunakan `agents.defaults.timeoutSeconds` saat dikonfigurasi, dibatasi pada 120 dtk secara default. Eksekusi yang dipicu Cron tanpa timeout model atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.
- Timeout permintaan HTTP provider: `models.providers.<id>.timeoutSeconds` berlaku untuk fetch HTTP model provider tersebut, termasuk koneksi, header, body, timeout permintaan SDK, penanganan pembatalan guarded-fetch total, dan watchdog idle stream model. Gunakan ini untuk provider lokal/self-hosted yang lambat seperti Ollama sebelum menaikkan timeout runtime agen keseluruhan.

## Tempat hal dapat berakhir lebih awal

- Timeout agen (abort)
- AbortSignal (batal)
- Pemutusan Gateway atau timeout RPC
- Timeout `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) — alat agen yang tersedia
- [Hook](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa lifecycle agen
- [Compaction](/id/concepts/compaction) — cara percakapan panjang dirangkum
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat berpikir/penalaran
