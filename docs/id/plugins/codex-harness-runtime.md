---
read_when:
    - Anda memerlukan kontrak dukungan runtime harness Codex
    - Anda sedang men-debug alat asli Codex, kait, Compaction, atau pengunggahan umpan balik
    - Anda sedang mengubah perilaku plugin di seluruh giliran alat uji PI dan Codex
summary: Batas runtime, hook, alat, izin, dan diagnostik untuk kerangka kerja Codex
title: Runtime harness Codex
x-i18n:
    generated_at: "2026-05-11T20:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Halaman ini mendokumentasikan kontrak runtime untuk giliran harness Codex. Untuk penyiapan dan
perutean, mulai dengan [harness Codex](/id/plugins/codex-harness). Untuk bidang konfigurasi,
lihat [referensi harness Codex](/id/plugins/codex-harness-reference).

## Ikhtisar

Mode Codex bukan PI dengan panggilan model yang berbeda di bawahnya. Codex memiliki lebih banyak
bagian dari loop model native, dan OpenClaw menyesuaikan permukaan Plugin, alat, sesi, dan
diagnostiknya di sekitar batas tersebut.

OpenClaw tetap memiliki perutean kanal, file sesi, pengiriman pesan yang terlihat,
alat dinamis OpenClaw, persetujuan, pengiriman media, dan cermin transkrip.
Codex memiliki thread native kanonis, loop model native, kelanjutan alat native,
dan Compaction native.

## Pengikatan thread dan perubahan model

Saat sesi OpenClaw dilampirkan ke thread Codex yang sudah ada, giliran berikutnya
mengirim model OpenAI yang saat ini dipilih, kebijakan persetujuan, sandbox, dan tingkat layanan
ke app-server lagi. Beralih dari `openai/gpt-5.5` ke
`openai/gpt-5.2` mempertahankan pengikatan thread tetapi meminta Codex untuk melanjutkan dengan
model yang baru dipilih.

## Balasan terlihat dan Heartbeat

Saat giliran chat sumber berjalan melalui harness Codex, balasan terlihat secara default
menggunakan alat OpenClaw `message` jika deployment belum secara eksplisit mengonfigurasi
`messages.visibleReplies`. Agen masih dapat menyelesaikan giliran Codex-nya secara privat;
ia hanya memposting ke kanal saat memanggil `message(action="send")`. Atur
`messages.visibleReplies: "automatic"` untuk mempertahankan balasan final chat langsung pada
jalur pengiriman otomatis lama.

Giliran Heartbeat Codex juga mendapatkan `heartbeat_respond` di katalog alat OpenClaw
yang dapat dicari secara default, sehingga agen dapat mencatat apakah wake harus tetap
diam atau memberi notifikasi tanpa menyandikan alur kontrol itu dalam teks final.

Panduan inisiatif khusus Heartbeat dikirim sebagai instruksi developer mode kolaborasi Codex
pada giliran Heartbeat itu sendiri. Giliran chat biasa memulihkan mode Default Codex
alih-alih membawa filosofi Heartbeat dalam prompt runtime normalnya.

## Batas kait

Harness Codex memiliki tiga lapisan kait:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Kait Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.      |
| Kait native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file Codex `hooks.json` proyek atau global untuk merutekan
perilaku Plugin OpenClaw. Untuk alat native dan jembatan izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`.

Saat persetujuan app-server Codex diaktifkan, artinya `approvalPolicy` bukan
`"never"`, konfigurasi kait native yang disuntikkan secara default menghilangkan `PermissionRequest` sehingga
peninjau app-server Codex dan jembatan persetujuan OpenClaw menangani eskalasi nyata
setelah peninjauan. Operator dapat secara eksplisit menambahkan `permission_request` ke
`nativeHookRelay.events` saat mereka membutuhkan relay kompatibilitas.

Kait Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi
kontrol tingkat Codex. Itu tidak diekspos sebagai kait Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta
panggilan, sehingga OpenClaw menjalankan perilaku Plugin dan middleware yang dimilikinya dalam
adaptor harness. Untuk alat native Codex, Codex memiliki rekaman alat kanonis.
OpenClaw dapat mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang thread Codex
native kecuali Codex mengekspos operasi tersebut melalui app-server atau callback kait native.

Notifikasi item app-server Codex juga menyediakan observasi `after_tool_call` asinkron
untuk penyelesaian alat native yang belum dicakup oleh relay native `PostToolUse`.
Observasi ini hanya untuk telemetri dan kompatibilitas Plugin; observasi tersebut tidak dapat
memblokir, menunda, atau memutasi panggilan alat native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi app-server Codex
dan status adaptor OpenClaw, bukan perintah kait Codex native.
Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adaptor, bukan tangkapan byte demi byte
atas permintaan internal atau payload Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajektori dan debugging.
Notifikasi tersebut tidak memanggil kait Plugin OpenClaw.

## Kontrak dukungan V1

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                                                         | Alasan                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                                                         | App-server Codex memiliki giliran OpenAI, kelanjutan thread native, dan kelanjutan alat native.                                                                                                            |
| Perutean dan pengiriman kanal OpenClaw        | Didukung                                                                         | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lain tetap berada di luar runtime model.                                                                                                           |
| Alat dinamis OpenClaw                         | Didukung                                                                         | Codex meminta OpenClaw untuk mengeksekusi alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                      |
| Plugin prompt dan konteks                     | Didukung                                                                         | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                     |
| Siklus hidup mesin konteks                    | Didukung                                                                         | Perakitan, ingest, pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                                     |
| Kait alat dinamis                             | Didukung                                                                         | `before_tool_call`, `after_tool_call`, dan middleware hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                          |
| Kait siklus hidup                             | Didukung sebagai observasi adaptor                                               | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` berjalan dengan payload mode Codex yang jujur.                                                                         |
| Gerbang revisi jawaban final                  | Didukung melalui relay kait native                                               | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex menjalankan satu lintasan model lagi sebelum finalisasi.                                                                           |
| Blokir atau amati shell, patch, dan MCP native | Didukung melalui relay kait native                                              | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan alat native yang sudah dikomit, termasuk payload MCP pada app-server Codex `0.125.0` atau lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui persetujuan app-server Codex dan relay kait native kompatibilitas | Permintaan persetujuan app-server Codex dirutekan melalui OpenClaw setelah peninjauan Codex. Relay kait native `PermissionRequest` bersifat ikut serta untuk mode persetujuan native karena Codex memancarkannya sebelum peninjauan guardian. |
| Penangkapan trajektori app-server             | Didukung                                                                         | OpenClaw merekam permintaan yang dikirimnya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                      |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                           | Batas V1                                                                                                                                          | Jalur masa depan                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Kait pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                       | Membutuhkan dukungan kait/skema Codex untuk input alat pengganti.                           |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan thread native diperlukan.          |
| `tool_result_persist` untuk rekaman alat native Codex | Kait itu mentransformasi penulisan transkrip milik OpenClaw, bukan rekaman alat native Codex.                                                   | Dapat mencerminkan rekaman yang ditransformasi, tetapi penulisan ulang kanonis membutuhkan dukungan Codex. |
| Metadata Compaction native kaya                     | OpenClaw mengamati awal dan selesainya Compaction, tetapi tidak menerima daftar yang dipertahankan/dihapus, delta token, atau payload ringkasan yang stabil. | Membutuhkan peristiwa Compaction Codex yang lebih kaya.                                      |
| Intervensi Compaction                               | Kait Compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                               | Tambahkan kait pra/pasca Compaction Codex jika Plugin perlu memveto atau menulis ulang Compaction native. |
| Penangkapan permintaan API model byte demi byte     | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi core Codex membangun permintaan API OpenAI final secara internal.          | Membutuhkan peristiwa pelacakan permintaan model Codex atau API debug.                      |

## Izin native dan elisitasi MCP

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau tolak yang eksplisit
saat kebijakan memutuskan. Hasil tanpa keputusan bukanlah izin. Codex memperlakukannya sebagai tanpa
keputusan kait dan meneruskannya ke jalur guardian atau persetujuan penggunanya sendiri.

Codex app-server approval modes menghilangkan native hook ini secara default. Perilaku ini
berlaku ketika `permission_request` secara eksplisit disertakan dalam
`nativeHookRelay.events` atau runtime kompatibilitas memasangnya.

Ketika operator memilih `allow-always` untuk permintaan izin native Codex,
OpenClaw mengingat fingerprint provider/session/input tool/cwd yang persis itu untuk
jendela sesi terbatas. Keputusan yang diingat sengaja hanya berlaku untuk
kecocokan persis: perintah, argumen, payload tool, atau cwd yang berubah akan
membuat persetujuan baru.

Elisitasi persetujuan tool MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang diantrekan menjawab permintaan
server native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lainnya gagal tertutup.

## Pengarahan antrean

Pengarahan antrean active-run dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
diantrekan untuk jendela diam yang dikonfigurasi dan mengirimkannya sebagai satu
permintaan `turn/steer` dalam urutan kedatangan. Mode `queue` lama mengirim
permintaan `turn/steer` terpisah.

Giliran tinjauan Codex dan Compaction manual dapat menolak pengarahan pada
giliran yang sama. Dalam kasus tersebut, OpenClaw menggunakan antrean tindak
lanjut ketika mode yang dipilih mengizinkan fallback. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

## Unggahan umpan balik Codex

Ketika `/diagnostics [note]` disetujui untuk sesi yang menggunakan harness native
Codex, OpenClaw juga memanggil `feedback/upload` app-server Codex untuk thread
Codex yang relevan. Unggahan meminta app-server menyertakan log untuk setiap
thread yang tercantum dan subthread Codex yang dibuat jika tersedia.

Unggahan berjalan melalui jalur umpan balik normal Codex ke server OpenAI. Jika
umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan
kesalahan app-server. Balasan diagnostik yang selesai mencantumkan channel, id
sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim.

Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak id Codex
tersebut dan tidak mengirim umpan balik Codex. Unggahan tidak menggantikan ekspor
diagnostik Gateway lokal. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk
perilaku persetujuan, privasi, bundel lokal, dan chat grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan
unggahan umpan balik Codex untuk thread yang saat ini terlampir tanpa bundel
diagnostik Gateway lengkap.

## Compaction dan mirror transkrip

Ketika model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke app-server Codex. OpenClaw menyimpan mirror transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan perpindahan model atau harness
di masa mendatang.

Mirror mencakup prompt pengguna, teks akhir asisten, dan catatan penalaran atau
rencana Codex ringan ketika app-server memancarkannya. Saat ini, OpenClaw hanya
mencatat sinyal awal dan penyelesaian Compaction native. OpenClaw belum
mengekspos ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat
diaudit tentang entri mana yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini
tidak menulis ulang catatan hasil tool native Codex. Ini hanya berlaku ketika
OpenClaw menulis hasil tool transkrip sesi yang dimiliki OpenClaw.

## Media dan pengiriman

OpenClaw tetap memiliki pengiriman media dan pemilihan penyedia media. Gambar,
video, musik, PDF, TTS, dan pemahaman media menggunakan pengaturan
penyedia/model yang sesuai seperti `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel`, dan `messages.tts`.

Teks, gambar, video, musik, TTS, persetujuan, dan output tool pesan tetap
melalui jalur pengiriman OpenClaw normal. Pembuatan media tidak memerlukan PI.
Ketika Codex memancarkan item pembuatan gambar native dengan `savedPath`,
OpenClaw meneruskan file persis tersebut melalui jalur reply-media normal meskipun
giliran Codex tidak memiliki teks asisten.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Hook Plugin](/id/plugins/hooks)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Ekspor trajectory](/id/tools/trajectory)
