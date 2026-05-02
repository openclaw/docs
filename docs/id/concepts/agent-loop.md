---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda mengubah pengantrean sesi, penulisan transkrip, atau perilaku penguncian tulis sesi
summary: Siklus hidup loop agen, aliran, dan semantik menunggu
title: Siklus agen
x-i18n:
    generated_at: "2026-05-02T09:17:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agentik adalah eksekusi “nyata” penuh dari sebuah agen: penerimaan → penyusunan konteks → inferensi model →
eksekusi tool → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sekaligus menjaga state sesi tetap konsisten.

Di OpenClaw, loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa lifecycle dan stream
saat model berpikir, memanggil tool, dan melakukan streaming keluaran. Dokumen ini menjelaskan bagaimana loop autentik itu
dirangkai dari ujung ke ujung.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi params, menyelesaikan sesi (sessionKey/sessionId), mempersistensikan metadata sesi, langsung mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan default model + thinking/verbose/trace
   - memuat snapshot skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **lifecycle end/error** jika loop tertanam tidak memancarkannya
3. `runEmbeddedPiAgent`:
   - menserialkan eksekusi melalui antrean per-sesi + global
   - menyelesaikan model + profil auth dan membangun sesi pi
   - berlangganan peristiwa pi dan melakukan streaming delta asisten/tool
   - memberlakukan timeout -> membatalkan eksekusi jika terlampaui
   - untuk giliran app-server Codex, membatalkan giliran yang diterima yang berhenti menghasilkan progres app-server sebelum peristiwa terminal
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa tool => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - peristiwa lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Pengantrean + konkurensi

- Eksekusi diserialkan per kunci sesi (jalur sesi) dan opsional melalui jalur global.
- Ini mencegah race pada tool/sesi dan menjaga riwayat sesi tetap konsisten.
- Channel pesan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem jalur ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh lock tulis sesi pada file sesi. Lock ini
  sadar proses dan berbasis file, sehingga menangkap penulis yang melewati antrean dalam-proses atau berasal dari
  proses lain.
- Lock tulis sesi secara default tidak reentrant. Jika helper secara sengaja menumpuk akuisisi
  lock yang sama sambil mempertahankan satu penulis logis, ia harus ikut serta secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; eksekusi tersandbox dapat dialihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan prompt sistem.
- Lock tulis sesi diambil; `SessionManager` dibuka dan disiapkan sebelum streaming. Jalur
  penulisan ulang transkrip, Compaction, atau pemotongan berikutnya harus mengambil lock yang sama sebelum membuka atau
  memutasi file transkrip.

## Penyusunan prompt + prompt sistem

- Prompt sistem dibangun dari prompt dasar OpenClaw, prompt skills, konteks bootstrap, dan override per-eksekusi.
- Batas khusus model dan token cadangan Compaction diberlakukan.
- Lihat [Prompt sistem](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mengintersep)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa lifecycle.
- **Hook Plugin**: titik ekstensi di dalam lifecycle agen/tool dan pipeline gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum prompt sistem difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lain (lihat dokumen Hook).

Lihat [Hook](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook Plugin (lifecycle agen + gateway)

Ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan pra-sesi (tanpa `messages`) untuk menimpa provider/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per-giliran dan field konteks-sistem untuk panduan stabil yang sebaiknya berada di ruang prompt sistem.
- **`before_agent_start`**: hook kompatibilitas legacy yang dapat berjalan di fase mana pun; pilih hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan Plugin mengklaim giliran dan mengembalikan balasan sintetis atau membungkam giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau menganotasi siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: mengintersep params/hasil tool.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir instalasi skill atau Plugin.
- **`tool_result_persist`**: mentransformasi hasil tool secara sinkron sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas lifecycle sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa lifecycle gateway.

Aturan keputusan hook untuk guard keluar/tool:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook Plugin](/id/plugins/hooks) untuk API hook dan detail registrasi.

Harness dapat mengadaptasi hook ini secara berbeda. Harness app-server Codex menjaga
hook Plugin OpenClaw sebagai kontrak kompatibilitas untuk permukaan cermin yang terdokumentasi,
sementara hook native Codex tetap menjadi mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten di-stream dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming reasoning dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi tool + tool pesan

- Peristiwa mulai/pembaruan/akhir tool dipancarkan pada stream `tool`.
- Hasil tool disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman tool pesan dilacak untuk menekan konfirmasi asisten duplikat.

## Pembentukan balasan + penekanan

- Payload akhir disusun dari:
  - teks asisten (dan reasoning opsional)
  - ringkasan tool inline (ketika verbose + diizinkan)
  - teks error asisten ketika model error
- Token silent persis `NO_REPLY` / `no_reply` difilter dari payload
  keluar.
- Duplikat tool pesan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan sebuah tool error, balasan error tool fallback dipancarkan
  (kecuali tool pesan sudah mengirim balasan yang terlihat pengguna).

## Compaction + percobaan ulang

- Auto-Compaction memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Saat percobaan ulang, buffer dalam-memori dan ringkasan tool direset untuk menghindari keluaran duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline Compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa tool streaming dari pi-agent-core

## Penanganan channel chat

- Delta asisten dibuffer ke dalam pesan `delta` chat.
- `final` chat dipancarkan pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya penungguan). Param `timeoutMs` menimpa.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); diberlakukan di timer pembatalan `runEmbeddedPiAgent`.
- Runtime Cron: `timeoutSeconds` giliran-agen terisolasi dimiliki oleh cron. Scheduler memulai timer itu saat eksekusi dimulai, membatalkan eksekusi dasar pada tenggat yang dikonfigurasi, lalu menjalankan cleanup berbatas sebelum mencatat timeout agar sesi anak yang basi tidak dapat membuat jalur tersangkut.
- Diagnostik keaktifan sesi: dengan diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` mengklasifikasikan sesi `processing` yang lama tanpa balasan, tool, status, blok, atau progres ACP yang teramati. Eksekusi tertanam aktif, panggilan model, dan panggilan tool dilaporkan sebagai `session.long_running`; pekerjaan aktif tanpa progres terbaru dilaporkan sebagai `session.stalled`; `session.stuck` dicadangkan untuk pembukuan sesi basi tanpa pekerjaan aktif, dan hanya jalur itu yang melepaskan jalur sesi terdampak agar pekerjaan startup yang mengantre dapat mengalir. Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap tidak berubah.
- Timeout idle model: OpenClaw membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog idle ini untuk provider lokal/self-hosted yang lambat; jika tidak, OpenClaw menggunakan `agents.defaults.timeoutSeconds` saat dikonfigurasi, dibatasi 120 dtk secara default. Eksekusi yang dipicu Cron tanpa timeout model atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.
- Timeout permintaan HTTP provider: `models.providers.<id>.timeoutSeconds` berlaku untuk fetch HTTP model provider tersebut, termasuk connect, headers, body, timeout permintaan SDK, penanganan pembatalan guarded-fetch total, dan watchdog idle stream model. Gunakan ini untuk provider lokal/self-hosted yang lambat seperti Ollama sebelum menaikkan timeout runtime agen keseluruhan.

## Tempat hal dapat berakhir lebih awal

- Timeout agen (abort)
- AbortSignal (cancel)
- Gateway terputus atau timeout RPC
- Timeout `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Tool](/id/tools) — tool agen yang tersedia
- [Hook](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa lifecycle agen
- [Compaction](/id/concepts/compaction) — bagaimana percakapan panjang dirangkum
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/reasoning
