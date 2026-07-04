---
read_when:
    - Anda memerlukan kontrak dukungan runtime harness Codex
    - Anda sedang men-debug alat, hook, Compaction, atau unggahan umpan balik native Codex
    - Anda mengubah perilaku plugin di seluruh giliran harness OpenClaw dan Codex
summary: Batas runtime, hook, alat, izin, dan diagnostik untuk harness Codex
title: Runtime harness Codex
x-i18n:
    generated_at: "2026-07-04T20:44:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Halaman ini mendokumentasikan kontrak runtime untuk giliran harness Codex. Untuk penyiapan dan
routing, mulai dengan [harness Codex](/id/plugins/codex-harness). Untuk kolom konfigurasi,
lihat [referensi harness Codex](/id/plugins/codex-harness-reference).

## Gambaran umum

Mode Codex bukan OpenClaw dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak
bagian dari loop model native, dan OpenClaw menyesuaikan permukaan Plugin, alat, sesi, dan
diagnostiknya di sekitar batas tersebut.

OpenClaw tetap memiliki routing channel, file sesi, pengiriman pesan yang terlihat,
alat dinamis OpenClaw, persetujuan, pengiriman media, dan cermin transkrip.
Codex memiliki utas native kanonis, loop model native, kelanjutan alat native,
dan Compaction native.

Routing prompt mengikuti runtime yang dipilih, bukan hanya string penyedia. Sebuah
giliran Codex native menerima instruksi developer app-server Codex, sementara
rute kompatibilitas OpenClaw eksplisit mempertahankan prompt sistem OpenClaw normal meskipun
menggunakan autentikasi atau transport OpenAI bercorak Codex.

Codex native mempertahankan instruksi dasar/model milik Codex dan perilaku dokumen proyek
sesuai konfigurasi utas Codex aktif. OpenClaw memulai dan melanjutkan utas
Codex native dengan personality bawaan Codex dinonaktifkan agar file personality
workspace dan identitas agen OpenClaw tetap menjadi otoritas. Eksekusi ringan
OpenClaw tetap mempertahankan penekanan dokumen proyek yang sudah ada. Instruksi
developer OpenClaw mencakup kepentingan runtime OpenClaw seperti pengiriman
channel sumber, alat dinamis OpenClaw, delegasi ACP, konteks adapter, dan file
profil workspace agen aktif. Katalog Skills OpenClaw dan pointer `MEMORY.md`
yang dirutekan alat diproyeksikan sebagai instruksi developer kolaborasi
berskup giliran untuk Codex native. Konten `BOOTSTRAP.md` aktif dan injeksi
fallback `MEMORY.md` penuh tetap menggunakan konteks referensi input giliran.

## Binding utas dan perubahan model

Ketika sesi OpenClaw dilampirkan ke utas Codex yang sudah ada, giliran berikutnya
mengirim lagi model OpenAI, kebijakan persetujuan, sandbox, dan tingkat layanan
yang saat ini dipilih ke app-server. Beralih dari `openai/gpt-5.5` ke
`openai/gpt-5.2` mempertahankan binding utas tetapi meminta Codex untuk melanjutkan dengan
model yang baru dipilih.

## Balasan yang terlihat dan heartbeat

Ketika giliran chat langsung/sumber berjalan melalui harness Codex, balasan yang terlihat
secara default dikirim otomatis sebagai final assistant untuk permukaan WebChat internal.
Ini menjaga Codex tetap selaras dengan kontrak prompt harness Pi: agen membalas
secara normal, dan OpenClaw memposting teks final ke percakapan sumber. Atur
`messages.visibleReplies: "message_tool"` ketika chat langsung/sumber harus
secara sengaja menjaga teks final assistant tetap privat kecuali agen memanggil
`message(action="send")`.

Giliran Heartbeat Codex juga mendapatkan `heartbeat_respond` di katalog alat OpenClaw
yang dapat dicari secara default, sehingga agen dapat mencatat apakah wake harus tetap
diam atau memberi notifikasi tanpa mengodekan alur kontrol itu dalam teks final.

Panduan inisiatif khusus Heartbeat dikirim sebagai instruksi developer mode kolaborasi
Codex pada giliran Heartbeat itu sendiri. Giliran chat biasa memulihkan
mode Default Codex alih-alih membawa filosofi Heartbeat dalam prompt
runtime normalnya. Ketika `HEARTBEAT.md` yang tidak kosong ada, instruksi
mode kolaborasi Heartbeat mengarahkan Codex ke file tersebut alih-alih menyisipkan
isinya secara inline.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness OpenClaw dan Codex. |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adapter per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex proyek atau global untuk merutekan
perilaku Plugin OpenClaw. Untuk alat native dan bridge izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per utas untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`.

Ketika persetujuan app-server Codex diaktifkan, artinya `approvalPolicy` bukan
`"never"`, konfigurasi hook native default yang disuntikkan menghilangkan `PermissionRequest` sehingga
reviewer app-server Codex dan bridge persetujuan OpenClaw menangani
eskalasi nyata setelah review. Operator dapat secara eksplisit menambahkan `permission_request` ke
`nativeHookRelay.events` ketika mereka memerlukan relay kompatibilitas.

Hook Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi
kontrol tingkat Codex. Keduanya tidak diekspos sebagai hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta
panggilan, sehingga OpenClaw menjalankan perilaku Plugin dan middleware yang dimilikinya di
adapter harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis.
OpenClaw dapat mencerminkan event tertentu, tetapi tidak dapat menulis ulang utas Codex
native kecuali Codex mengekspos operasi tersebut melalui app-server atau callback
hook native.

Event `PreToolUse` mode laporan app-server Codex menunda permintaan persetujuan Plugin
ke persetujuan app-server yang cocok. Jika hook OpenClaw `before_tool_call`
mengembalikan `requireApproval` sementara payload native menetapkan mode persetujuan laporan
(`openclaw_approval_mode` adalah `"report"`), relay hook native mencatat
persyaratan persetujuan Plugin dan tidak mengembalikan keputusan native. Ketika Codex mengirim
permintaan persetujuan app-server untuk penggunaan alat yang sama, OpenClaw membuka prompt
persetujuan Plugin dan memetakan keputusan kembali ke Codex. Event `PermissionRequest`
Codex adalah jalur persetujuan terpisah dan masih dapat dirutekan melalui persetujuan OpenClaw
ketika runtime dikonfigurasi untuk bridge tersebut.

Notifikasi item app-server Codex juga menyediakan observasi `after_tool_call` async
untuk penyelesaian alat native yang belum tercakup oleh relay
`PostToolUse` native. Observasi ini hanya untuk telemetri dan kompatibilitas Plugin;
observasi tersebut tidak dapat memblokir, menunda, atau memutasi panggilan alat native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi app-server Codex
dan status adapter OpenClaw, bukan perintah hook native Codex.
Event `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adapter, bukan tangkapan byte-per-byte
dari permintaan internal atau payload Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai event agen `codex_app_server.hook` untuk trajectory dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Didukung dalam runtime Codex v1:

| Permukaan                                      | Dukungan                                                                         | Alasan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                                                        | app-server Codex memiliki giliran OpenAI, pelanjutan thread bawaan, dan kelanjutan alat bawaan.                                                                                                                                                                                                                                                                                                                                                                                          |
| Perutean dan pengiriman channel OpenClaw         | Didukung                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage, dan channel lain tetap berada di luar runtime model.                                                                                                                                                                                                                                                                                                                                                                                    |
| Alat dinamis OpenClaw                        | Didukung                                                                        | Codex meminta OpenClaw mengeksekusi alat-alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                                                                                                                                                                                                                                                                                                                |
| Plugin prompt dan konteks                    | Didukung                                                                        | OpenClaw memproyeksikan prompt/konteks khusus OpenClaw ke dalam giliran Codex sambil membiarkan prompt dasar, model, dan prompt dokumen proyek terkonfigurasi milik Codex berada di jalur Codex bawaan. OpenClaw menonaktifkan kepribadian bawaan Codex untuk thread bawaan agar file kepribadian workspace agen tetap menjadi otoritas. Instruksi developer Codex bawaan hanya menerima panduan perintah yang secara eksplisit dibatasi ke `codex_app_server`; petunjuk perintah global lama tetap ada untuk permukaan prompt non-Codex. |
| Siklus hidup engine konteks                      | Didukung                                                                        | Perakitan, ingest, dan pemeliharaan setelah giliran berjalan di sekitar giliran Codex. Engine konteks tidak menggantikan Compaction bawaan Codex.                                                                                                                                                                                                                                                                                                                                                        |
| Hook alat dinamis                            | Didukung                                                                        | Middleware `before_tool_call`, `after_tool_call`, dan hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                                                                                                                                                                                                                                                                                                          |
| Hook siklus hidup                               | Didukung sebagai observasi adapter                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan muatan mode Codex yang jujur.                                                                                                                                                                                                                                                                                                                                                           |
| Gerbang revisi jawaban akhir                    | Didukung melalui relai hook bawaan                                              | `Stop` Codex direlai ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                                                                                                                                                                                                                                                                                                                |
| Shell, patch, dan blok MCP bawaan atau observasi | Didukung melalui relai hook bawaan                                              | `PreToolUse` dan `PostToolUse` Codex direlai untuk permukaan alat bawaan yang dikomit, termasuk muatan MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak.                                                                                                                                                                                                                                                                               |
| Kebijakan izin bawaan                      | Didukung melalui persetujuan app-server Codex dan relai hook bawaan kompatibilitas | Permintaan persetujuan app-server Codex dirutekan melalui OpenClaw setelah peninjauan Codex. Relai hook bawaan `PermissionRequest` bersifat ikut-serta untuk mode persetujuan bawaan karena Codex memancarkannya sebelum peninjauan guardian.                                                                                                                                                                                                                                                                          |
| Pengambilan trajektori app-server                 | Didukung                                                                        | OpenClaw merekam permintaan yang dikirimkannya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                                                                                                                                                                                                                                                                                                    |

Tidak didukung di runtime Codex v1:

| Permukaan                                             | Batas V1                                                                                                                                     | Jalur mendatang                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat bawaan                       | Hook pra-alat bawaan Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat bawaan Codex.                                               | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                            |
| Riwayat transkrip bawaan Codex yang dapat diedit            | Codex memiliki riwayat thread bawaan kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan thread bawaan diperlukan.                    |
| `tool_result_persist` untuk catatan alat bawaan Codex | Hook tersebut mengubah penulisan transkrip milik OpenClaw, bukan catatan alat bawaan Codex.                                                           | Dapat mencerminkan catatan yang diubah, tetapi penulisan ulang kanonis memerlukan dukungan Codex.              |
| Metadata Compaction bawaan yang kaya                     | OpenClaw dapat meminta Compaction bawaan, tetapi tidak menerima daftar disimpan/dibuang yang stabil, delta token, ringkasan penyelesaian, atau muatan ringkasan.   | Memerlukan peristiwa Compaction Codex yang lebih kaya.                                                     |
| Intervensi Compaction                             | OpenClaw tidak mengizinkan plugin atau engine konteks memveto, menulis ulang, atau mengganti Compaction Codex bawaan.                                             | Tambahkan hook pra/pasca-Compaction Codex jika plugin perlu memveto atau menulis ulang Compaction bawaan. |
| Pengambilan permintaan API model byte demi byte             | OpenClaw dapat mengambil permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI akhir secara internal.                      | Memerlukan peristiwa pelacakan permintaan model Codex atau API debug.                                   |

## Izin bawaan dan elisitasi MCP

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau tolak yang eksplisit
ketika kebijakan memutuskan. Hasil tanpa keputusan bukanlah izin. Codex memperlakukannya sebagai tanpa
keputusan hook dan meneruskannya ke jalur guardian atau persetujuan penggunanya sendiri.

Mode persetujuan app-server Codex menghilangkan hook bawaan ini secara default. Perilaku ini
berlaku ketika `permission_request` disertakan secara eksplisit dalam
`nativeHookRelay.events` atau runtime kompatibilitas memasangnya.

Ketika operator memilih `allow-always` untuk permintaan izin bawaan Codex,
OpenClaw mengingat fingerprint provider/sesi/input alat/cwd yang tepat itu untuk
jendela sesi terbatas. Keputusan yang diingat sengaja hanya cocok-persis:
perintah, argumen, muatan alat, atau cwd yang berubah akan membuat
persetujuan baru.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang diantrekan menjawab permintaan server
bawaan tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan elisitasi MCP
lainnya gagal tertutup.

Untuk alur persetujuan plugin umum yang membawa prompt ini, lihat
[Permintaan izin plugin](/id/plugins/plugin-permission-requests).

## Pengarahan antrean

Pengarahan antrean aktif-berjalan dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw menggabungkan pesan chat mode-steer
untuk jendela hening yang dikonfigurasi dan mengirimkannya sebagai satu permintaan
`turn/steer` sesuai urutan kedatangan.

Tinjauan Codex dan giliran Compaction manual dapat menolak pengarah pada giliran yang sama. Dalam hal itu, OpenClaw menunggu proses aktif selesai sebelum memulai prompt. Gunakan `/queue followup` atau `/queue collect` ketika pesan seharusnya masuk antrean secara default alih-alih diarahkan. Lihat [Antrean pengarah](/id/concepts/queue-steering).

## Unggahan umpan balik Codex

Ketika `/diagnostics [note]` disetujui untuk sesi yang menggunakan harness Codex native, OpenClaw juga memanggil `feedback/upload` app-server Codex untuk thread Codex yang relevan. Unggahan meminta app-server menyertakan log untuk setiap thread yang tercantum dan subthread Codex yang dibuat ketika tersedia.

Unggahan melewati jalur umpan balik normal Codex ke server OpenAI. Jika umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan galat app-server. Balasan diagnostik yang selesai mencantumkan channel, ID sesi OpenClaw, ID thread Codex, dan perintah lokal `codex resume <thread-id>` untuk thread yang dikirim.

Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak ID Codex tersebut dan tidak mengirim umpan balik Codex. Unggahan tidak menggantikan ekspor diagnostik Gateway lokal. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk perilaku persetujuan, privasi, bundel lokal, dan obrolan grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan umpan balik Codex untuk thread yang saat ini terlampir tanpa bundel diagnostik Gateway lengkap.

## Compaction dan cermin transkrip

Ketika model yang dipilih menggunakan harness Codex, Compaction thread native menjadi milik app-server Codex. OpenClaw tidak menjalankan Compaction preflight untuk giliran Codex, tidak mengganti Compaction Codex dengan Compaction context-engine, dan tidak fallback ke peringkasan OpenClaw atau OpenAI publik ketika Compaction Codex native tidak dapat dimulai. OpenClaw menyimpan cermin transkrip untuk riwayat channel, pencarian, `/new`, `/reset`, dan peralihan model atau harness di masa mendatang.

Permintaan Compaction eksplisit, seperti `/compact` atau operasi compact manual yang diminta Plugin, memulai Compaction Codex native dengan `thread/compact/start`. OpenClaw mempertahankan permintaan dan lease klien bersama tetap terbuka hingga Codex memancarkan item penyelesaian `contextCompaction` yang cocok, lalu melaporkan giliran Compaction sebagai selesai. Jika giliran terminal tersebut melebihi timeout Compaction yang dikonfigurasi, OpenClaw meminta interupsi giliran native. Lease dan fence Compaction per-thread tetap ditahan hingga Codex melaporkan status terminal atau mengonfirmasi RPC interupsi. Jika Codex tidak mengonfirmasi dalam periode tenggang interupsi, OpenClaw memensiunkan koneksi sebelum melepas fence. Koneksi jarak jauh juga melepas binding thread yang cocok sehingga pekerjaan berikutnya tidak dapat tumpang tindih dengan giliran jarak jauh yang belum dikonfirmasi. Giliran lain pada koneksi yang dipensiunkan gagal dan dapat dicoba ulang pada klien baru. Penutupan klien, pembatalan permintaan, atau giliran Compaction yang gagal mengembalikan operasi gagal.

Ketika context engine meminta proyeksi bootstrap thread Codex, OpenClaw memproyeksikan nama dan ID panggilan alat, bentuk input, dan konten hasil alat yang telah disunting ke thread Codex baru. Ini tidak menyalin nilai argumen panggilan alat mentah ke dalam proyeksi tersebut.

Cermin mencakup prompt pengguna, teks akhir asisten, dan catatan penalaran atau rencana Codex ringan ketika app-server memancarkannya. OpenClaw merekam awal Compaction native dan status terminal, tetapi tidak mengekspos ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak menulis ulang catatan hasil alat native Codex. Ini hanya berlaku ketika OpenClaw menulis hasil alat transkrip sesi milik OpenClaw.

## Media dan pengiriman

OpenClaw tetap memiliki pengiriman media dan pemilihan penyedia media. Gambar, video, musik, PDF, TTS, dan pemahaman media menggunakan pengaturan penyedia/model yang sesuai seperti `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan `messages.tts`.

Teks, gambar, video, musik, TTS, persetujuan, dan output alat pesan tetap melewati jalur pengiriman OpenClaw normal. Pembuatan media tidak memerlukan runtime legacy. Ketika Codex memancarkan item pembuatan gambar native dengan `savedPath`, OpenClaw meneruskan file persis tersebut melalui jalur media balasan normal meskipun giliran Codex tidak memiliki teks asisten.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Hook Plugin](/id/plugins/hooks)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Ekspor lintasan](/id/tools/trajectory)
