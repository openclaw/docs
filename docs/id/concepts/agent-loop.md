---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda mengubah pengantrean sesi, penulisan transkrip, atau perilaku kunci tulis sesi
summary: Siklus hidup loop agen, stream, dan semantik wait
title: Siklus agen
x-i18n:
    generated_at: "2026-05-03T21:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agentik adalah eksekusi “nyata” penuh dari sebuah agen: penerimaan → penyusunan konteks → inferensi model →
eksekusi alat → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sekaligus menjaga status sesi tetap konsisten.

Di OpenClaw, sebuah loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa siklus hidup dan stream
saat model berpikir, memanggil alat, dan melakukan streaming keluaran. Dokumen ini menjelaskan bagaimana loop autentik tersebut
dirangkai dari ujung ke ujung.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), menyimpan metadata sesi, mengembalikan `{ runId, acceptedAt }` segera.
2. `agentCommand` menjalankan agen:
   - menyelesaikan default model + thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **akhir/kesalahan siklus hidup** jika loop tertanam tidak memancarkannya
3. `runEmbeddedPiAgent`:
   - menserialisasi eksekusi melalui antrean per sesi + global
   - menyelesaikan model + profil autentikasi dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta asisten/alat
   - memberlakukan timeout -> membatalkan eksekusi jika terlampaui
   - untuk giliran app-server Codex, membatalkan giliran yang sudah diterima jika berhenti menghasilkan progres app-server sebelum peristiwa terminal
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa siklus hidup => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **akhir/kesalahan siklus hidup** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Pengantrean + konkurensi

- Eksekusi diserialisasi per kunci sesi (lane sesi) dan secara opsional melalui lane global.
- Ini mencegah race alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Kanal perpesanan dapat memilih mode antrean (collect/steer/followup) yang memberi masukan ke sistem lane ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh lock tulis sesi pada berkas sesi. Lock ini
  sadar proses dan berbasis berkas, sehingga dapat menangkap penulis yang melewati antrean dalam proses atau berasal dari
  proses lain. Penulis transkrip sesi menunggu hingga `session.writeLock.acquireTimeoutMs`
  sebelum melaporkan sesi sebagai sibuk; default-nya adalah `60000` md.
- Lock tulis sesi secara default bersifat non-reentrant. Jika sebuah helper sengaja menumpuk akuisisi
  lock yang sama sambil mempertahankan satu penulis logis, helper tersebut harus ikut serta secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + ruang kerja

- Ruang kerja diselesaikan dan dibuat; eksekusi tersandbox dapat dialihkan ke root ruang kerja sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env dan prompt.
- Berkas bootstrap/konteks diselesaikan dan disuntikkan ke laporan prompt sistem.
- Lock tulis sesi diakuisisi; `SessionManager` dibuka dan disiapkan sebelum streaming. Setiap
  jalur penulisan ulang transkrip, Compaction, atau pemotongan selanjutnya harus mengambil lock yang sama sebelum membuka atau
  memutasi berkas transkrip.

## Penyusunan prompt + prompt sistem

- Prompt sistem dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per eksekusi.
- Batas khusus model dan token cadangan Compaction diberlakukan.
- Lihat [Prompt sistem](/id/concepts/system-prompt) untuk mengetahui apa yang dilihat model.

## Titik hook (tempat Anda dapat mengintersep)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa siklus hidup.
- **Hook Plugin**: titik ekstensi di dalam siklus hidup agen/alat dan pipeline Gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun berkas bootstrap sebelum prompt sistem difinalisasi.
  Gunakan ini untuk menambah/menghapus berkas konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hook).

Lihat [Hook](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook Plugin (siklus hidup agen + Gateway)

Ini berjalan di dalam loop agen atau pipeline Gateway:

- **`before_model_resolve`**: berjalan sebelum sesi (tanpa `messages`) untuk menimpa provider/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah pemuatan sesi (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per giliran dan bidang konteks sistem untuk panduan stabil yang harus berada di ruang prompt sistem.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan di salah satu fase; utamakan hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan Plugin mengklaim giliran dan mengembalikan balasan sintetis atau membungkam giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau memberi anotasi siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: mengintersep parameter/hasil alat.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir instalasi Skills atau Plugin.
- **`tool_result_persist`**: secara sinkron mentransformasi hasil alat sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa siklus hidup Gateway.

Aturan keputusan hook untuk guard keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus pemblokiran sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus pemblokiran sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook Plugin](/id/plugins/hooks) untuk API hook dan detail pendaftaran.

Harness dapat mengadaptasi hook ini secara berbeda. Harness app-server Codex mempertahankan
hook Plugin OpenClaw sebagai kontrak kompatibilitas untuk permukaan tercermin yang terdokumentasi,
sedangkan hook native Codex tetap menjadi mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten di-stream dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming penalaran dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi alat + alat perpesanan

- Peristiwa mulai/perbarui/akhir alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat perpesanan dilacak untuk menekan konfirmasi asisten duplikat.

## Pembentukan balasan + penekanan

- Payload akhir disusun dari:
  - teks asisten (dan penalaran opsional)
  - ringkasan alat inline (ketika verbose + diizinkan)
  - teks kesalahan asisten ketika model mengalami kesalahan
- Token senyap yang persis `NO_REPLY` / `no_reply` difilter dari payload
  keluar.
- Duplikat alat perpesanan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender yang tersisa dan sebuah alat mengalami kesalahan, balasan kesalahan alat cadangan dipancarkan
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

- Delta asisten dibuffer ke dalam pesan `delta` chat.
- `final` chat dipancarkan pada **akhir/kesalahan siklus hidup**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya penantian). Parameter `timeoutMs` menimpa ini.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); diberlakukan di timer pembatalan `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` giliran agen terisolasi dimiliki oleh cron. Penjadwal memulai timer tersebut saat eksekusi dimulai, membatalkan eksekusi yang mendasarinya pada tenggat yang dikonfigurasi, lalu menjalankan pembersihan terbatas sebelum mencatat timeout sehingga sesi anak basi tidak dapat membuat lane macet.
- Diagnostik keaktifan sesi: dengan diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` mengklasifikasikan sesi `processing` yang lama dan tidak memiliki balasan, alat, status, blok, atau progres ACP yang teramati. Eksekusi tertanam aktif, panggilan model, dan panggilan alat dilaporkan sebagai `session.long_running`; pekerjaan aktif tanpa progres terbaru dilaporkan sebagai `session.stalled`; `session.stuck` dicadangkan untuk pembukuan sesi basi tanpa pekerjaan aktif. Pembukuan sesi basi segera melepaskan lane sesi yang terdampak; eksekusi tertanam yang macet hanya dibatalkan dan dikuras setelah jendela tanpa progres yang diperpanjang (setidaknya 10 menit dan 5x ambang peringatan) sehingga pekerjaan yang mengantre dapat dilanjutkan tanpa memutus eksekusi yang hanya lambat. Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap tidak berubah.
- Timeout idle model: OpenClaw membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog idle ini untuk provider lokal/self-hosted yang lambat; jika tidak, OpenClaw menggunakan `agents.defaults.timeoutSeconds` ketika dikonfigurasi, dibatasi pada 120 dtk secara default. Eksekusi yang dipicu Cron tanpa timeout model atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.
- Timeout permintaan HTTP provider: `models.providers.<id>.timeoutSeconds` berlaku untuk fetch HTTP model provider tersebut, termasuk connect, header, body, timeout permintaan SDK, penanganan abort guarded-fetch total, dan watchdog idle stream model. Gunakan ini untuk provider lokal/self-hosted yang lambat seperti Ollama sebelum menaikkan timeout runtime agen secara keseluruhan.

## Tempat eksekusi dapat berakhir lebih awal

- Timeout agen (abort)
- AbortSignal (cancel)
- Pemutusan Gateway atau timeout RPC
- Timeout `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) — alat agen yang tersedia
- [Hook](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) — bagaimana percakapan panjang diringkas
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/penalaran
