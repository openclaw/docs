---
read_when:
    - Anda memerlukan kontrak dukungan waktu jalan kerangka kerja Codex
    - Anda sedang men-debug alat bawaan Codex, kait, Compaction, atau pengunggahan umpan balik
    - Anda mengubah perilaku Plugin di seluruh giliran harness PI dan Codex
summary: Batas runtime, hook, alat, izin, dan diagnostik untuk harness Codex
title: Runtime kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-10T19:43:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Halaman ini mendokumentasikan kontrak runtime untuk giliran harness Codex. Untuk penyiapan dan
perutean, mulai dengan [harness Codex](/id/plugins/codex-harness). Untuk bidang config,
lihat [referensi harness Codex](/id/plugins/codex-harness-reference).

## Ikhtisar

Mode Codex bukan PI dengan panggilan model yang berbeda di bawahnya. Codex memiliki lebih banyak bagian dari
loop model native, dan OpenClaw menyesuaikan permukaan plugin, tool, sesi, dan
diagnostiknya di sekitar batas tersebut.

OpenClaw tetap memiliki perutean channel, file sesi, pengiriman pesan yang terlihat,
tool dinamis OpenClaw, approval, pengiriman media, dan cermin transkrip.
Codex memiliki thread native kanonis, loop model native, kelanjutan tool native,
dan compaction native.

## Pengikatan thread dan perubahan model

Saat sesi OpenClaw dilampirkan ke thread Codex yang sudah ada, giliran berikutnya
mengirim ulang model OpenAI yang saat ini dipilih, kebijakan approval, sandbox, dan tier
layanan ke app-server. Beralih dari `openai/gpt-5.5` ke
`openai/gpt-5.2` mempertahankan pengikatan thread tetapi meminta Codex untuk melanjutkan dengan
model yang baru dipilih.

## Balasan yang terlihat dan Heartbeat

Saat giliran chat sumber berjalan melalui harness Codex, balasan yang terlihat secara default
menggunakan tool `message` OpenClaw jika deployment belum secara eksplisit mengonfigurasi
`messages.visibleReplies`. Agent masih dapat menyelesaikan giliran Codex-nya secara privat;
ia hanya memposting ke channel saat memanggil `message(action="send")`. Tetapkan
`messages.visibleReplies: "automatic"` untuk mempertahankan balasan akhir chat langsung pada
jalur pengiriman otomatis legacy.

Giliran Heartbeat Codex juga mendapatkan `heartbeat_respond` di katalog tool OpenClaw
yang dapat dicari secara default, sehingga agent dapat mencatat apakah wake harus tetap
diam atau memberi notifikasi tanpa mengodekan alur kontrol itu dalam teks akhir.

Panduan inisiatif khusus Heartbeat dikirim sebagai instruksi developer mode kolaborasi
Codex pada giliran Heartbeat itu sendiri. Giliran chat biasa memulihkan
mode Default Codex alih-alih membawa filosofi Heartbeat dalam prompt runtime
normalnya.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness PI dan Codex.       |
| Middleware extension app-server Codex | Plugin bundel OpenClaw   | Perilaku adapter per giliran di sekitar tool dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan tool native dari config Codex. |

OpenClaw tidak menggunakan file `hooks.json` project atau global Codex untuk merutekan
perilaku plugin OpenClaw. Untuk bridge tool native dan izin yang didukung,
OpenClaw menyuntikkan config Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`.

Saat approval app-server Codex diaktifkan, artinya `approvalPolicy` bukan
`"never"`, config hook native default yang disuntikkan menghilangkan `PermissionRequest` sehingga
reviewer app-server Codex dan bridge approval OpenClaw menangani eskalasi nyata
setelah review. Operator dapat secara eksplisit menambahkan `permission_request` ke
`nativeHookRelay.events` saat mereka memerlukan relay kompatibilitas.

Hook Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi
kontrol level Codex. Hook tersebut tidak diekspos sebagai hook plugin OpenClaw dalam kontrak
v1.

Untuk tool dinamis OpenClaw, OpenClaw mengeksekusi tool setelah Codex meminta
panggilan tersebut, sehingga OpenClaw menjalankan perilaku plugin dan middleware yang dimilikinya dalam
adapter harness. Untuk tool native Codex, Codex memiliki catatan tool kanonis.
OpenClaw dapat mencerminkan event tertentu, tetapi tidak dapat menulis ulang thread Codex native
kecuali Codex mengekspos operasi itu melalui app-server atau callback hook
native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi app-server Codex
dan status adapter OpenClaw, bukan perintah hook native Codex.
Event `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi level adapter, bukan tangkapan byte demi byte
dari request internal atau payload compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai event agent `codex_app_server.hook` untuk trajectory dan debugging.
Notifikasi tersebut tidak memanggil hook plugin OpenClaw.

## Kontrak dukungan V1

Didukung dalam runtime Codex v1:

| Permukaan                                    | Dukungan                                                                         | Alasan                                                                                                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex              | Didukung                                                                         | App-server Codex memiliki giliran OpenAI, resume thread native, dan kelanjutan tool native.                                                                                                                |
| Perutean dan pengiriman channel OpenClaw     | Didukung                                                                         | Telegram, Discord, Slack, WhatsApp, iMessage, dan channel lain tetap berada di luar runtime model.                                                                                                         |
| Tool dinamis OpenClaw                        | Didukung                                                                         | Codex meminta OpenClaw untuk mengeksekusi tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                      |
| Plugin prompt dan konteks                    | Didukung                                                                         | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                     |
| Siklus hidup mesin konteks                   | Didukung                                                                         | Perakitan, ingest, pemeliharaan setelah giliran, dan koordinasi compaction mesin konteks berjalan untuk giliran Codex.                                                                                     |
| Hook tool dinamis                            | Didukung                                                                         | `before_tool_call`, `after_tool_call`, dan middleware hasil tool berjalan di sekitar tool dinamis milik OpenClaw.                                                                                          |
| Hook siklus hidup                            | Didukung sebagai observasi adapter                                               | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` berjalan dengan payload mode Codex yang jujur.                                                                         |
| Gate revisi jawaban akhir                    | Didukung melalui relay hook native                                               | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu pass model lagi sebelum finalisasi.                                                                                 |
| Blokir atau amati shell, patch, dan MCP native | Didukung melalui relay hook native                                             | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan tool native yang dikomit, termasuk payload MCP pada app-server Codex `0.125.0` atau lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                        | Didukung melalui approval app-server Codex dan relay hook native kompatibilitas  | Request approval app-server Codex dirutekan melalui OpenClaw setelah review Codex. Relay hook native `PermissionRequest` bersifat opt-in untuk mode approval native karena Codex memancarkannya sebelum review guardian. |
| Tangkapan trajectory app-server              | Didukung                                                                         | OpenClaw merekam request yang dikirimnya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                        |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                           | Batas V1                                                                                                                                       | Jalur masa depan                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutasi argumen tool native                          | Hook pre-tool native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen tool native Codex.                                      | Memerlukan dukungan hook/skema Codex untuk input tool pengganti.                           |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan thread native diperlukan.         |
| `tool_result_persist` untuk catatan tool native Codex | Hook itu mentransformasi penulisan transkrip milik OpenClaw, bukan catatan tool native Codex.                                                 | Dapat mencerminkan catatan yang ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata compaction native yang kaya                | OpenClaw mengamati awal dan penyelesaian compaction, tetapi tidak menerima daftar kept/dropped yang stabil, delta token, atau payload ringkasan. | Memerlukan event compaction Codex yang lebih kaya.                                         |
| Intervensi Compaction                               | Hook compaction OpenClaw saat ini berada pada level notifikasi dalam mode Codex.                                                                | Tambahkan hook pre/post compaction Codex jika plugin perlu memveto atau menulis ulang compaction native. |
| Tangkapan request API model byte demi byte          | OpenClaw dapat menangkap request dan notifikasi app-server, tetapi core Codex membangun request API OpenAI final secara internal.               | Memerlukan event tracing request model Codex atau API debug.                               |

## Izin native dan elisitasi MCP

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan allow atau deny yang eksplisit
saat kebijakan memutuskan. Hasil tanpa keputusan bukanlah allow. Codex memperlakukannya sebagai tanpa
keputusan hook dan melanjutkan ke jalur guardian atau approval pengguna miliknya sendiri.

Mode approval app-server Codex menghilangkan hook native ini secara default. Perilaku ini
berlaku saat `permission_request` disertakan secara eksplisit dalam
`nativeHookRelay.events` atau runtime kompatibilitas menginstalnya.

Ketika operator memilih `allow-always` untuk permintaan izin native Codex,
OpenClaw mengingat fingerprint persis dari input provider/sesi/tool/cwd tersebut untuk
jendela sesi yang terbatas. Keputusan yang diingat sengaja hanya berlaku untuk
kecocokan persis: perubahan pada perintah, argumen, payload tool, atau cwd membuat
persetujuan baru.

Elicitasi persetujuan tool MCP Codex dirutekan melalui alur persetujuan Plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya dalam antrean menjawab permintaan server
native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan elisitasi
MCP lainnya gagal secara tertutup.

## Pengarahan antrean

Pengarahan antrean active-run dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
diantrekan selama jendela hening yang dikonfigurasi dan mengirimkannya sebagai
satu permintaan `turn/steer` sesuai urutan kedatangan. Mode `queue` lama
mengirimkan permintaan `turn/steer` terpisah.

Turn peninjauan Codex dan compaction manual dapat menolak pengarahan pada turn
yang sama. Dalam kasus tersebut, OpenClaw menggunakan antrean tindak lanjut
ketika mode yang dipilih mengizinkan fallback. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

## Unggahan masukan Codex

Ketika `/diagnostics [note]` disetujui untuk sesi yang menggunakan harness native
Codex, OpenClaw juga memanggil `feedback/upload` app-server Codex untuk thread
Codex yang relevan. Unggahan meminta app-server menyertakan log untuk setiap
thread yang dicantumkan dan subthread Codex yang dibuat jika tersedia.

Unggahan melewati jalur masukan normal Codex ke server OpenAI. Jika masukan
Codex dinonaktifkan di app-server tersebut, perintah mengembalikan galat
app-server. Balasan diagnostik yang selesai mencantumkan channel, id sesi
OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>` untuk
thread yang dikirim.

Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak id Codex
tersebut dan tidak mengirim masukan Codex. Unggahan tidak menggantikan ekspor
diagnostik Gateway lokal. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk
perilaku persetujuan, privasi, bundel lokal, dan chat grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan
unggahan masukan Codex untuk thread yang saat ini terpasang tanpa bundel
diagnostik Gateway penuh.

## Compaction dan cermin transkrip

Ketika model yang dipilih menggunakan harness Codex, compaction thread native
didelegasikan ke app-server Codex. OpenClaw mempertahankan cermin transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan pengalihan model atau harness
di masa mendatang.

Cermin menyertakan prompt pengguna, teks akhir assistant, dan catatan penalaran
atau rencana Codex yang ringan ketika app-server mengeluarkannya. Saat ini,
OpenClaw hanya mencatat sinyal mulai dan selesai compaction native. OpenClaw
belum mengekspos ringkasan compaction yang dapat dibaca manusia atau daftar yang
dapat diaudit tentang entri mana yang dipertahankan Codex setelah compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang catatan hasil tool native Codex. Ini hanya berlaku ketika OpenClaw
menulis hasil tool transkrip sesi milik OpenClaw.

## Media dan pengiriman

OpenClaw tetap memiliki pengiriman media dan pemilihan provider media. Pemahaman
gambar, video, musik, PDF, TTS, dan media menggunakan pengaturan provider/model
yang sesuai seperti `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, dan `messages.tts`.

Teks, gambar, video, musik, TTS, persetujuan, dan output tool pesan tetap melalui
jalur pengiriman OpenClaw normal. Pembuatan media tidak memerlukan PI. Ketika
Codex mengeluarkan item pembuatan gambar native dengan `savedPath`, OpenClaw
meneruskan file persis tersebut melalui jalur reply-media normal meskipun turn
Codex tidak memiliki teks assistant.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Hook Plugin](/id/plugins/hooks)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Ekspor trajektori](/id/tools/trajectory)
