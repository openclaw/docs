---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
    - Anda mengubah antrean sesi, penulisan transkrip, atau perilaku penguncian penulisan sesi
summary: Siklus hidup loop agen, aliran, dan semantik penantian
title: Loop agen
x-i18n:
    generated_at: "2026-07-16T17:58:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

Loop agen adalah proses per sesi yang diserialisasi, yang mengubah pesan menjadi
tindakan dan balasan: penerimaan, penyusunan konteks, inferensi model, eksekusi
alat, streaming, persistensi.

## Titik masuk

- RPC Gateway: `agent` dan `agent.wait`.
- CLI: `openclaw agent`.

## Urutan proses

1. `agent` RPC memvalidasi parameter, menentukan sesi (`sessionKey`/`sessionId`), menyimpan metadata sesi secara persisten, dan segera mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan giliran: menentukan model + nilai bawaan thinking/verbose/trace, memuat snapshot Skills, memanggil `runEmbeddedAgent`, dan memancarkan **akhir/kesalahan siklus hidup** cadangan jika loop tertanam belum memancarkannya.
3. `runEmbeddedAgent`: menserialisasi proses melalui antrean per sesi dan global, menentukan model + profil autentikasi, membangun sesi OpenClaw, berlangganan peristiwa runtime, men-stream delta asisten/alat, memberlakukan batas waktu proses (membatalkan saat kedaluwarsa), dan mengembalikan payload beserta metadata penggunaan. Untuk giliran app-server Codex, proses ini juga membatalkan giliran yang telah diterima jika berhenti menghasilkan progres app-server sebelum peristiwa terminal.
4. `subscribeEmbeddedAgentSession` menjembatani peristiwa runtime ke stream `agent`: peristiwa alat ke `stream: "tool"`, delta asisten ke `stream: "assistant"`, peristiwa siklus hidup ke `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) menunggu **akhir/kesalahan siklus hidup** pada `runId` dan mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Pengantrean dan konkurensi

Proses diserialisasi per kunci sesi (jalur sesi) dan secara opsional melalui jalur global, sehingga mencegah kondisi balapan alat/sesi. Kanal perpesanan memilih mode antrean (steer/followup/collect/interrupt) yang memasok sistem jalur ini; lihat [Antrean Perintah](/id/concepts/queue).

Penulisan transkrip juga dilindungi oleh kunci tulis sesi pada berkas sesi. Kunci ini menyadari proses dan berbasis berkas, sehingga dapat mendeteksi penulis yang melewati antrean dalam proses atau berasal dari proses lain. Penulis menunggu hingga `session.writeLock.acquireTimeoutMs` (bawaan `60000` md; penggantian env `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) sebelum melaporkan sesi sebagai sibuk.

Secara bawaan, kunci tulis sesi tidak bersifat reentrant. Pembantu yang sengaja menumpuk perolehan kunci yang sama sambil mempertahankan satu penulis logis harus ikut serta dengan `allowReentrant: true`.

## Persiapan sesi dan ruang kerja

- Ruang kerja ditentukan dan dibuat; proses dalam sandbox dapat dialihkan ke akar ruang kerja sandbox.
- Skills dimuat (atau digunakan kembali dari snapshot) dan disuntikkan ke env serta prompt.
- Berkas bootstrap/konteks ditentukan dan disuntikkan ke prompt sistem.
- Kunci tulis sesi diperoleh dan target transkrip sesi disiapkan sebelum streaming dimulai. Setiap jalur penulisan ulang, Compaction, atau pemotongan transkrip berikutnya harus memperoleh kunci yang sama sebelum mengubah baris transkrip SQLite.

## Penyusunan prompt

Prompt sistem dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan penggantian per proses. Batas khusus model dan token cadangan Compaction diberlakukan. Lihat [Prompt sistem](/id/concepts/system-prompt) untuk mengetahui apa yang dilihat model.

## Hook

OpenClaw memiliki dua sistem hook:

- **Hook internal** (hook Gateway): skrip berbasis peristiwa untuk perintah dan peristiwa siklus hidup.
- **Hook Plugin**: titik ekstensi di dalam siklus hidup agen/alat dan pipeline Gateway.

### Hook internal (hook Gateway)

- **`agent:bootstrap`**: berjalan saat membangun berkas bootstrap sebelum prompt sistem difinalisasi. Gunakan untuk menambahkan atau menghapus berkas konteks bootstrap.
- **Hook perintah**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumentasi Hook).

Lihat [Hook](/id/automation/hooks) untuk penyiapan dan contoh.

### Hook Plugin

Hook ini berjalan di dalam loop agen atau pipeline Gateway:

| Hook                                                    | Berjalan                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Pra-sesi (tanpa `messages`), untuk mengganti penyedia/model secara deterministik sebelum penentuan.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Setelah sesi dimuat (dengan `messages`), untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum pengiriman. Gunakan `prependContext` untuk teks dinamis per giliran dan bidang konteks sistem untuk panduan stabil yang berada dalam ruang prompt sistem. |
| `before_agent_start`                                    | Hook kompatibilitas lama yang dapat berjalan pada salah satu fase; utamakan hook eksplisit di atas.                                                                                                                                                                                                    |
| `before_agent_reply`                                    | Setelah tindakan inline, sebelum panggilan LLM. Memungkinkan Plugin mengambil alih giliran dan mengembalikan balasan sintetis atau membisukannya sepenuhnya.                                                                                                                                                                |
| `agent_end`                                             | Setelah selesai, dengan daftar pesan akhir dan metadata proses.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Mengamati atau menganotasi siklus Compaction.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Mengintersepsi parameter/hasil alat.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Setelah kebijakan instalasi operator berjalan, pada materi instalasi Skills/Plugin yang dipersiapkan, ketika hook Plugin dimuat dalam proses saat ini.                                                                                                                                                           |
| `tool_result_persist`                                   | Mentransformasi hasil alat secara sinkron sebelum ditulis ke transkrip sesi milik OpenClaw.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Hook pesan masuk dan keluar.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Batas siklus hidup sesi.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Peristiwa siklus hidup Gateway.                                                                                                                                                                                                                                                                   |

Aturan keputusan hook untuk penjaga keluar/alat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan penangan berprioritas lebih rendah. `{ block: false }` tidak melakukan apa pun dan tidak menghapus pemblokiran sebelumnya.
- `before_install`: semantik terminal/tanpa operasi sama seperti di atas. Gunakan `security.installPolicy`, bukan `before_install`, untuk keputusan izin/blokir instalasi milik operator yang harus mencakup jalur instalasi dan pembaruan CLI.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan penangan berprioritas lebih rendah. `{ cancel: false }` tidak melakukan apa pun dan tidak menghapus pembatalan sebelumnya.

Lihat [Hook Plugin](/id/plugins/hooks) untuk API hook dan detail pendaftaran.

Harness dapat mengadaptasi hook ini. Harness app-server Codex mempertahankan hook Plugin OpenClaw sebagai kontrak kompatibilitas untuk permukaan tercermin yang didokumentasikan; hook native Codex adalah mekanisme Codex tingkat lebih rendah yang terpisah.

## Streaming

- Delta asisten di-stream dari runtime agen sebagai peristiwa `assistant`.
- Streaming blok dapat memancarkan balasan parsial pada `text_end` atau `message_end`.
- Streaming penalaran dapat berupa stream terpisah atau balasan blok.
- Lihat [Streaming](/id/concepts/streaming) untuk perilaku pemotongan dan balasan blok.

## Eksekusi alat

- Peristiwa mulai/perbarui/selesai alat dipancarkan pada stream `tool`.
- Hasil alat disanitasi terkait ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman alat perpesanan dilacak untuk mencegah konfirmasi asisten duplikat.

## Pembentukan balasan

Payload akhir disusun dari teks asisten (beserta penalaran opsional), ringkasan alat inline (jika verbose dan diizinkan), serta teks kesalahan asisten ketika model mengalami kesalahan.

- Token senyap persis `NO_REPLY` disaring dari payload keluar.
- Duplikat alat perpesanan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender dan alat mengalami kesalahan, balasan kesalahan alat cadangan dipancarkan kecuali alat perpesanan telah mengirim balasan yang terlihat oleh pengguna.

## Compaction dan percobaan ulang

Compaction otomatis memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang. Saat percobaan ulang, buffer dalam memori dan ringkasan alat direset untuk menghindari keluaran duplikat. Lihat [Compaction](/id/concepts/compaction).

## Stream peristiwa

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedAgentSession` (dan sebagai cadangan oleh `agentCommand`).
- `assistant`: delta yang di-stream dari runtime agen.
- `tool`: peristiwa alat yang di-stream dari runtime agen.

Gateway memproyeksikan siklus hidup serta peristiwa mulai/terminal alat ke dalam
[buku besar audit](/id/cli/audit) terbatas yang hanya berisi metadata. Proyeksi ini mencatat asal dan
kode hasil tanpa menyalin prompt, pesan, argumen alat, hasil alat,
atau kesalahan mentah keluar dari jalur transkrip/runtime.

## Penanganan kanal obrolan

Delta asisten disimpan dalam buffer ke pesan `delta` obrolan. `final` obrolan dipancarkan saat **akhir/kesalahan siklus hidup**.

## Batas waktu

| Batas waktu                                      | Default                                | Catatan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Hanya menunggu; parameter `timeoutMs` menggantikannya. Tidak menghentikan proses yang mendasarinya.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Runtime agen (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Diberlakukan oleh timer pembatalan `runEmbeddedAgent`. Atur `0` untuk anggaran proses tanpa batas; watchdog keaktifan aliran model tetap berlaku.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Giliran agen terisolasi Cron                      | dimiliki oleh cron                     | Penjadwal memulai timernya sendiri saat eksekusi dimulai, membatalkan proses pada tenggat yang dikonfigurasi, lalu menjalankan pembersihan terbatas sebelum mencatat batas waktu agar sesi turunan yang kedaluwarsa tidak membuat jalur tetap macet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Batas waktu menganggur model                     | Cloud 120s; di-hosting sendiri 300s    | OpenClaw membatalkan permintaan model jika tidak ada potongan respons yang tiba sebelum jendela menganggur berakhir. `models.providers.<id>.timeoutSeconds` memperpanjang watchdog menganggur ini untuk penyedia lokal/di-hosting sendiri yang lambat, tetapi tetap dibatasi oleh `agents.defaults.timeoutSeconds` terbatas yang lebih rendah atau batas waktu khusus proses, karena keduanya mengatur keseluruhan proses agen. Anggaran proses tanpa batas tetap mempertahankan watchdog menganggur kelas penyedia. Proses model cloud yang dipicu Cron tanpa batas waktu model/agen eksplisit menggunakan default yang sama; dengan batas waktu proses cron eksplisit, macetnya aliran model cloud dibatasi hingga 60s agar fallback model yang dikonfigurasi masih dapat berjalan sebelum tenggat cron terluar. Proses yang dipicu Cron pada endpoint yang benar-benar lokal (baseUrl loopback/pribadi) mempertahankan pilihan untuk menonaktifkan batas waktu menganggur lokal; penyedia di-hosting sendiri pada baseUrl jaringan mendapatkan watchdog implisit 300s. Dengan batas waktu proses cron eksplisit, kemacetan lokal/di-hosting sendiri dibatasi pada batas waktu tersebut. Atur `models.providers.<id>.timeoutSeconds` untuk penyedia lokal yang lambat. |
| Batas waktu permintaan HTTP penyedia             | `models.providers.<id>.timeoutSeconds` | Mencakup koneksi, header, isi, batas waktu permintaan SDK, penanganan pembatalan guarded-fetch, dan watchdog menganggur aliran model untuk penyedia tersebut. Gunakan untuk penyedia lokal/di-hosting sendiri yang lambat (misalnya Ollama) sebelum menaikkan batas waktu keseluruhan runtime agen; pertahankan batas waktu agen/runtime setidaknya sama tinggi ketika permintaan model perlu berjalan lebih lama.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Diagnostik sesi macet

Saat diagnostik diaktifkan, `diagnostics.stuckSessionWarnMs` (default `120000` ms) mengklasifikasikan sesi `processing` yang berlangsung lama tanpa balasan, alat, status, blok, atau kemajuan ACP yang teramati:

- Proses tertanam aktif, panggilan model, dan panggilan alat dilaporkan sebagai `session.long_running`. Panggilan model senyap yang dimiliki tetap `session.long_running` hingga `diagnostics.stuckSessionAbortMs` agar penyedia yang lambat atau tidak melakukan streaming tidak ditandai macet terlalu dini.
- Pekerjaan aktif tanpa kemajuan terbaru dilaporkan sebagai `session.stalled`. Panggilan model yang dimiliki beralih ke `session.stalled` pada atau setelah ambang pembatalan; aktivitas model/alat kedaluwarsa tanpa pemilik tidak disembunyikan sebagai aktivitas yang berjalan lama.
- `session.stuck` dicadangkan untuk pembukuan sesi kedaluwarsa yang dapat dipulihkan, termasuk sesi dalam antrean yang menganggur dengan aktivitas model/alat kedaluwarsa tanpa pemilik.

`diagnostics.stuckSessionAbortMs` secara default setidaknya 5 menit dan 3x ambang peringatan. Pembukuan sesi kedaluwarsa segera melepaskan jalur sesi yang terdampak setelah gerbang pemulihan lolos; proses tertanam yang macet dikuras melalui pembatalan hanya setelah ambang pembatalan, sehingga pekerjaan dalam antrean dilanjutkan tanpa menghentikan proses yang sekadar lambat. Pemulihan menghasilkan keluaran terstruktur yang diminta/diselesaikan; status diagnostik ditandai menganggur hanya jika generasi pemrosesan yang sama masih aktif, dan diagnostik `session.stuck` berulang menerapkan jeda mundur selama sesi tetap tidak berubah.

## Kondisi yang dapat menyebabkan proses berakhir lebih awal

- Batas waktu agen (pembatalan)
- AbortSignal (pembatalan)
- Gateway terputus atau batas waktu RPC
- Batas waktu `agent.wait` (hanya menunggu, tidak menghentikan agen)

## Terkait

- [Alat](/id/tools) - alat agen yang tersedia
- [Hook](/id/automation/hooks) - skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/id/concepts/compaction) - cara percakapan panjang diringkas
- [Persetujuan Eksekusi](/id/tools/exec-approvals) - gerbang persetujuan untuk perintah shell
- [Pemikiran](/id/tools/thinking) - konfigurasi tingkat pemikiran/penalaran
