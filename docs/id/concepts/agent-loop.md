---
read_when:
    - Anda memerlukan penjelasan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidupnya
    - Anda sedang mengubah antrean sesi, penulisan transkrip, atau perilaku kunci penulisan sesi
summary: Siklus hidup loop agen, stream, dan semantik wait
title: Loop agen
x-i18n:
    generated_at: "2026-04-24T09:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop Agen (OpenClaw)

Loop agentik adalah keseluruhan eksekusi agen yang “nyata”: intake → perakitan konteks → inferensi model →
eksekusi alat → streaming balasan → persistensi. Ini adalah jalur otoritatif yang mengubah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa lifecycle dan stream
saat model berpikir, memanggil alat, dan melakukan streaming output. Dokumen ini menjelaskan bagaimana loop autentik
tersebut dihubungkan dari ujung ke ujung.

## Titik masuk

- Gateway RPC: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), menyimpan metadata sesi, lalu segera mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan default model + thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **lifecycle end/error** jika loop tertanam tidak memancarkan salah satunya
3. `runEmbeddedPiAgent`:
   - menserialisasi eksekusi melalui antrean per sesi + global
   - menyelesaikan model + auth profile dan membangun sesi Pi
   - berlangganan ke peristiwa Pi dan melakukan streaming delta assistant/tool
   - menegakkan timeout -> membatalkan eksekusi jika terlampaui
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa alat => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - peristiwa lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Eksekusi diserialisasi per kunci sesi (jalur sesi) dan secara opsional melalui jalur global.
- Ini mencegah race alat/sesi dan menjaga riwayat sesi tetap konsisten.
- Saluran perpesanan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem jalur ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh kunci penulisan sesi pada file sesi. Kunci ini
  sadar proses dan berbasis file, sehingga menangkap penulis yang melewati antrean dalam proses atau datang dari
  proses lain.
- Kunci penulisan sesi secara default bersifat non-reentrant. Jika helper dengan sengaja menumpuk akuisisi
  kunci yang sama sambil mempertahankan satu penulis logis, helper tersebut harus secara eksplisit opt in dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; eksekusi tersandbox dapat mengalihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan system prompt.
- Kunci penulisan sesi diambil; `SessionManager` dibuka dan disiapkan sebelum streaming. Jalur
  penulisan ulang transkrip, Compaction, atau truncation berikutnya harus mengambil kunci yang sama sebelum membuka atau
  mengubah file transkrip.

## Perakitan prompt + system prompt

- System prompt dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per-eksekusi.
- Batas khusus model dan token cadangan Compaction ditegakkan.
- Lihat [System prompt](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mencegat)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa lifecycle.
- **Hook plugin**: titik ekstensi di dalam loop agen/alat dan pipeline gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum system prompt difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hooks).

Lihat [Hooks](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook plugin (lifecycle agen + gateway)

Ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan sebelum sesi (tanpa `messages`) untuk secara deterministik meng-override provider/model sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per giliran dan field system-context untuk panduan stabil yang seharusnya berada di ruang system prompt.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan pada salah satu fase; gunakan hook eksplisit di atas jika memungkinkan.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan plugin mengklaim giliran dan mengembalikan balasan sintetis atau meniadakan giliran sepenuhnya.
- **`agent_end`**: periksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: amati atau beri anotasi pada siklus Compaction.
- **`before_tool_call` / `after_tool_call`**: cegat parameter/hasil alat.
- **`before_install`**: periksa temuan pemindaian bawaan dan secara opsional blokir instalasi skill atau plugin.
- **`tool_result_persist`**: transformasikan hasil alat secara sinkron sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas lifecycle sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa lifecycle gateway.

Aturan keputusan hook untuk penjaga keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook plugin](/id/plugins/architecture-internals#provider-runtime-hooks) untuk API hook dan detail pendaftaran.

Harness dapat mengadaptasi hook ini secara berbeda. Harness app-server Codex mempertahankan
hook plugin OpenClaw sebagai kontrak kompatibilitas untuk permukaan mirror terdokumentasi,
sementara hook bawaan Codex tetap menjadi mekanisme Codex tingkat rendah yang terpisah.

## Streaming + balasan parsial

- Delta assistant di-stream dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Block streaming dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming reasoning dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan block reply.

## Eksekusi alat + alat perpesanan

- Peristiwa mulai/pembaruan/akhir alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat perpesanan dilacak untuk menekan konfirmasi assistant yang duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks assistant (dan reasoning opsional)
  - ringkasan alat inline (saat verbose + diizinkan)
  - teks error assistant saat model menghasilkan error
- Token senyap exact `NO_REPLY` / `no_reply` difilter dari
  payload keluar.
- Duplikat alat perpesanan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan suatu alat mengalami error, balasan error alat fallback akan dipancarkan
  (kecuali alat perpesanan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + retry

- Auto-Compaction memancarkan peristiwa stream `compaction` dan dapat memicu retry.
- Saat retry, buffer dalam memori dan ringkasan alat di-reset untuk menghindari output duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline Compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta yang di-stream dari pi-agent-core
- `tool`: peristiwa alat yang di-stream dari pi-agent-core

## Penanganan saluran chat

- Delta assistant dibuffer ke pesan chat `delta`.
- Chat `final` dipancarkan pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30dtk (hanya waktu tunggu). Parameter `timeoutMs` menimpanya.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800dtk (48 jam); ditegakkan di timer abort `runEmbeddedPiAgent`.
- Timeout idle LLM: `agents.defaults.llm.idleTimeoutSeconds` membatalkan permintaan model saat tidak ada potongan respons yang tiba sebelum jendela idle berakhir. Setel secara eksplisit untuk model lokal lambat atau provider reasoning/tool-call; setel ke 0 untuk menonaktifkan. Jika tidak disetel, OpenClaw menggunakan `agents.defaults.timeoutSeconds` saat dikonfigurasi, atau 120dtk jika tidak. Eksekusi yang dipicu cron tanpa timeout LLM atau agen eksplisit menonaktifkan watchdog idle dan mengandalkan timeout luar cron.

## Tempat eksekusi dapat berakhir lebih awal

- Timeout agen (abort)
- AbortSignal (cancel)
- Gateway terputus atau timeout RPC
- Timeout `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) — alat agen yang tersedia
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa lifecycle agen
- [Compaction](/id/concepts/compaction) — cara percakapan panjang diringkas
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/id/tools/thinking) — konfigurasi tingkat thinking/reasoning
