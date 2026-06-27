---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda mengubah pengantrean sesi, penulisan transkrip, atau perilaku kunci tulis sesi
summary: Siklus hidup loop agen, stream, dan semantik tunggu
title: Loop agen
x-i18n:
    generated_at: "2026-06-27T17:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agentik adalah seluruh eksekusi "nyata" dari sebuah agen: penerimaan → penyusunan konteks → inferensi model →
eksekusi tool → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah sebuah pesan
menjadi tindakan dan balasan akhir, sambil menjaga state sesi tetap konsisten.

Di OpenClaw, loop adalah satu eksekusi terserialisasi per sesi yang memancarkan event siklus hidup dan stream
saat model berpikir, memanggil tool, dan melakukan streaming output. Dokumen ini menjelaskan bagaimana loop autentik tersebut
dirangkai dari ujung ke ujung.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), mempersistensikan metadata sesi, langsung mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan default model + thinking/verbose/trace
   - memuat snapshot Skills
   - memanggil `runEmbeddedAgent` (runtime agen OpenClaw)
   - memancarkan **akhir/error siklus hidup** jika loop tertanam tidak memancarkannya
3. `runEmbeddedAgent`:
   - menserialisasi run melalui antrean per sesi + global
   - menyelesaikan model + profil auth dan membangun sesi OpenClaw
   - berlangganan event runtime dan melakukan streaming delta asisten/tool
   - menegakkan timeout -> membatalkan run jika terlampaui
   - untuk giliran app-server Codex, membatalkan giliran yang sudah diterima jika berhenti menghasilkan progres app-server sebelum event terminal
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedAgentSession` menjembatani event runtime agen ke stream `agent` OpenClaw:
   - event tool => `stream: "tool"`
   - delta asisten => `stream: "assistant"`
   - event siklus hidup => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **akhir/error siklus hidup** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Run diserialisasi per kunci sesi (lane sesi) dan secara opsional melalui lane global.
- Ini mencegah race tool/sesi dan menjaga riwayat sesi tetap konsisten.
- Kanal pesan dapat memilih mode antrean (steer/followup/collect/interrupt) yang masuk ke sistem lane ini.
  Lihat [Antrean Perintah](/id/concepts/queue).
- Penulisan transkrip juga dilindungi oleh kunci tulis sesi pada file sesi. Kunci tersebut
  sadar proses dan berbasis file, sehingga menangkap penulis yang melewati antrean dalam proses atau berasal dari
  proses lain. Penulis transkrip sesi menunggu hingga `session.writeLock.acquireTimeoutMs`
  sebelum melaporkan sesi sebagai sibuk; defaultnya adalah `60000` md.
- Kunci tulis sesi secara default tidak reentrant. Jika helper sengaja menumpuk akuisisi
  kunci yang sama sambil mempertahankan satu penulis logis, helper tersebut harus memilih ikut secara eksplisit dengan
  `allowReentrant: true`.

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; run tersandbox dapat diarahkan ke root workspace sandbox.
- Skills dimuat (atau digunakan ulang dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan prompt sistem.
- Kunci tulis sesi diperoleh; `SessionManager` dibuka dan disiapkan sebelum streaming. Jalur
  penulisan ulang transkrip, compaction, atau pemotongan apa pun setelahnya harus mengambil kunci yang sama sebelum membuka atau
  memutasi file transkrip.

## Penyusunan prompt + prompt sistem

- Prompt sistem dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per run.
- Batas khusus model dan token cadangan Compaction ditegakkan.
- Lihat [Prompt sistem](/id/concepts/system-prompt) untuk apa yang dilihat model.

## Titik hook (tempat Anda dapat mencegat)

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis event untuk perintah dan event siklus hidup.
- **Hook Plugin**: titik ekstensi di dalam siklus hidup agen/tool dan pipeline gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum prompt sistem difinalisasi.
  Gunakan ini untuk menambah/menghapus file konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan event perintah lain (lihat dokumen Hook).

Lihat [Hook](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook Plugin (siklus hidup agen + gateway)

Ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan pra-sesi (tanpa `messages`) untuk mengganti provider/model secara deterministik sebelum resolusi model.
- **`before_prompt_build`**: berjalan setelah pemuatan sesi (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman prompt. Gunakan `prependContext` untuk teks dinamis per giliran dan field konteks sistem untuk panduan stabil yang harus berada di ruang prompt sistem.
- **`before_agent_start`**: hook kompatibilitas legacy yang dapat berjalan di fase mana pun; utamakan hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan Plugin mengklaim giliran dan mengembalikan balasan sintetis atau membisukan giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata run setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau menganotasi siklus compaction.
- **`before_tool_call` / `after_tool_call`**: mencegat parameter/hasil tool.
- **`before_install`**: memeriksa materi instalasi skill atau Plugin yang distage setelah kebijakan instalasi operator berjalan, ketika hook Plugin dimuat dalam proses OpenClaw saat ini.
- **`tool_result_persist`**: mentransformasi hasil tool secara sinkron sebelum ditulis ke transkrip sesi milik OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: event siklus hidup gateway.

Aturan keputusan hook untuk guard keluar/tool:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blokir sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blokir sebelumnya.
- Gunakan `security.installPolicy`, bukan `before_install`, untuk keputusan izinkan/blokir instalasi milik operator yang harus mencakup jalur instalasi dan pembaruan CLI.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook Plugin](/id/plugins/hooks) untuk API hook dan detail registrasi.

Harness dapat mengadaptasi hook ini secara berbeda. Harness app-server Codex menjaga
hook Plugin OpenClaw sebagai kontrak kompatibilitas untuk surface mirror yang terdokumentasi,
sementara hook native Codex tetap menjadi mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming + balasan parsial

- Delta asisten distreaming dari runtime agen dan dipancarkan sebagai event `assistant`.
- Streaming blok dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming reasoning dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi tool + tool pesan

- Event mulai/perbarui/akhir tool dipancarkan pada stream `tool`.
- Hasil tool disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman tool pesan dilacak untuk menekan konfirmasi asisten duplikat.

## Pembentukan balasan + penekanan

- Payload akhir disusun dari:
  - teks asisten (dan reasoning opsional)
  - ringkasan tool inline (ketika verbose + diizinkan)
  - teks error asisten saat model error
- Token senyap persis `NO_REPLY` / `no_reply` difilter dari payload
  keluar.
- Duplikat tool pesan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan tool mengalami error, balasan error tool fallback dipancarkan
  (kecuali tool pesan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + percobaan ulang

- Auto-compaction memancarkan event stream `compaction` dan dapat memicu percobaan ulang.
- Pada percobaan ulang, buffer dalam memori dan ringkasan tool direset untuk menghindari output duplikat.
- Lihat [Compaction](/id/concepts/compaction) untuk pipeline compaction.

## Stream event (hari ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedAgentSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta yang distreaming dari runtime agen
- `tool`: event tool yang distreaming dari runtime agen

## Penanganan kanal chat

- Delta asisten dibuffer menjadi pesan `delta` chat.
- `final` chat dipancarkan pada **akhir/error siklus hidup**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya waktu tunggu). Parameter `timeoutMs` mengganti ini.
- Runtime agen: default `agents.defaults.timeoutSeconds` 172800 dtk (48 jam); ditegakkan dalam timer pembatalan `runEmbeddedAgent`.
- Runtime Cron: `timeoutSeconds` giliran agen terisolasi dimiliki oleh cron. Scheduler memulai timer tersebut saat eksekusi dimulai, membatalkan run yang mendasarinya pada tenggat yang dikonfigurasi, lalu menjalankan cleanup terbatas sebelum mencatat timeout agar sesi anak stale tidak dapat membuat lane tetap macet.
- Diagnostik keaktifan sesi: dengan diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` mengklasifikasikan sesi `processing` yang lama dan tidak memiliki balasan, tool, status, blok, atau progres ACP yang diamati. Run tertanam aktif, panggilan model, dan panggilan tool dilaporkan sebagai `session.long_running`; panggilan model senyap yang dimiliki juga tetap `session.long_running` hingga `diagnostics.stuckSessionAbortMs` sehingga provider lambat atau non-streaming tidak dilaporkan macet terlalu dini. Pekerjaan aktif tanpa progres terbaru dilaporkan sebagai `session.stalled`; panggilan model yang dimiliki beralih ke `session.stalled` pada atau setelah ambang pembatalan, dan aktivitas model/tool stale tanpa pemilik tidak disembunyikan sebagai berjalan lama. `session.stuck` dicadangkan untuk pembukuan sesi stale yang dapat dipulihkan, termasuk sesi antrean idle dengan aktivitas model/tool stale tanpa pemilik. Pembukuan sesi stale segera melepaskan lane sesi yang terdampak setelah gate pemulihan lolos; run tertanam yang stalled hanya dibatalkan-dikuras setelah `diagnostics.stuckSessionAbortMs` (default: setidaknya 5 menit dan 3x ambang peringatan) sehingga pekerjaan antrean dapat dilanjutkan tanpa memotong run yang sekadar lambat. Pemulihan memancarkan outcome terstruktur diminta/selesai, dan state diagnostik ditandai idle hanya jika generasi processing yang sama masih saat ini. Diagnostik `session.stuck` berulang melakukan backoff selama sesi tetap tidak berubah.
- Timeout idle model: OpenClaw membatalkan permintaan model ketika tidak ada chunk respons yang tiba sebelum jendela idle. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog idle ini untuk provider lokal/self-hosted yang lambat, tetapi tetap dibatasi oleh `agents.defaults.timeoutSeconds` yang lebih rendah atau timeout khusus run karena keduanya mengontrol seluruh run agen. Jika tidak, OpenClaw menggunakan `agents.defaults.timeoutSeconds` saat dikonfigurasi, dibatasi default maksimum 120 dtk. Run model cloud yang dipicu Cron tanpa timeout model atau agen eksplisit menggunakan watchdog idle default yang sama; dengan timeout run cron eksplisit, stall stream model cloud dibatasi hingga 60 dtk sehingga fallback model yang dikonfigurasi dapat berjalan sebelum tenggat cron luar. Run model lokal atau self-hosted yang dipicu Cron menonaktifkan watchdog implisit kecuali timeout eksplisit dikonfigurasi, dan timeout run cron eksplisit tetap menjadi jendela idle untuk provider lokal/self-hosted, sehingga provider lokal lambat sebaiknya menyetel `models.providers.<id>.timeoutSeconds`.
- Timeout permintaan HTTP provider: `models.providers.<id>.timeoutSeconds` berlaku untuk fetch HTTP model provider tersebut, termasuk connect, header, body, timeout permintaan SDK, penanganan pembatalan guarded-fetch total, dan watchdog idle stream model. Gunakan ini untuk provider lokal/self-hosted yang lambat seperti Ollama sebelum menaikkan timeout seluruh runtime agen, dan jaga timeout agen/runtime setidaknya sama tinggi ketika permintaan model perlu berjalan lebih lama.

## Tempat hal-hal dapat berakhir lebih awal

- Timeout agen (batalkan)
- AbortSignal (batal)
- Gateway terputus atau timeout RPC
- Timeout `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) — alat agen yang tersedia
- [Hook](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) — cara percakapan panjang dirangkum
- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Berpikir](/id/tools/thinking) — konfigurasi tingkat berpikir/penalaran
