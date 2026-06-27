---
read_when:
    - Anda memerlukan kontrak dukungan runtime harness Codex
    - Anda sedang men-debug alat Codex native, hook, compaction, atau unggahan umpan balik
    - Anda mengubah perilaku plugin di seluruh giliran harness OpenClaw dan Codex
summary: Batas runtime, hook, alat, izin, dan diagnostik untuk harness Codex
title: Runtime harness Codex
x-i18n:
    generated_at: "2026-06-27T17:45:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Halaman ini mendokumentasikan kontrak runtime untuk giliran harness Codex. Untuk penyiapan dan
perutean, mulai dengan [harness Codex](/id/plugins/codex-harness). Untuk kolom konfigurasi,
lihat [referensi harness Codex](/id/plugins/codex-harness-reference).

## Gambaran umum

Mode Codex bukan OpenClaw dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak bagian dari
loop model native, dan OpenClaw menyesuaikan permukaan plugin, alat, sesi, dan
diagnostiknya di sekitar batas tersebut.

OpenClaw tetap memiliki perutean channel, file sesi, pengiriman pesan yang terlihat,
alat dinamis OpenClaw, approval, pengiriman media, dan cermin transkrip.
Codex memiliki thread native kanonis, loop model native, kelanjutan alat native,
dan compaction native.

Perutean prompt mengikuti runtime yang dipilih, bukan hanya string provider. Sebuah
giliran Codex native menerima instruksi developer app-server Codex, sementara
rute kompatibilitas OpenClaw eksplisit mempertahankan prompt sistem OpenClaw normal bahkan
ketika menggunakan autentikasi atau transport OpenAI bercita rasa Codex.

Codex native mempertahankan instruksi dasar/model dan perilaku dokumen proyek milik Codex
sesuai konfigurasi thread Codex yang aktif. OpenClaw memulai dan melanjutkan thread
Codex native dengan kepribadian bawaan Codex dinonaktifkan agar file
kepribadian workspace dan identitas agen OpenClaw tetap otoritatif. Run OpenClaw
ringan tetap mempertahankan supresi dokumen proyek yang sudah ada. Instruksi
developer OpenClaw mencakup perhatian runtime OpenClaw seperti pengiriman channel
sumber, alat dinamis OpenClaw, delegasi ACP, konteks adapter, dan file profil
workspace agen aktif. Katalog Skills OpenClaw dan pointer `MEMORY.md` yang dirutekan alat
diproyeksikan sebagai instruksi developer kolaborasi berskop giliran untuk Codex native.
Konten `BOOTSTRAP.md` aktif dan injeksi fallback `MEMORY.md` penuh tetap menggunakan
konteks referensi input giliran.

## Binding thread dan perubahan model

Ketika sesi OpenClaw dilampirkan ke thread Codex yang sudah ada, giliran berikutnya
mengirim model OpenAI yang saat ini dipilih, kebijakan approval, sandbox, dan service
tier ke app-server lagi. Beralih dari `openai/gpt-5.5` ke
`openai/gpt-5.2` mempertahankan binding thread tetapi meminta Codex melanjutkan dengan
model yang baru dipilih.

## Balasan terlihat dan Heartbeat

Ketika giliran chat langsung/sumber berjalan melalui harness Codex, balasan terlihat
secara default dikirim otomatis sebagai balasan akhir assistant untuk permukaan WebChat internal.
Ini menjaga Codex tetap selaras dengan kontrak prompt harness Pi: agen membalas
secara normal, dan OpenClaw memposting teks akhir ke percakapan sumber. Tetapkan
`messages.visibleReplies: "message_tool"` ketika chat langsung/sumber harus
secara sengaja menjaga teks akhir assistant tetap privat kecuali agen memanggil
`message(action="send")`.

Giliran Heartbeat Codex juga mendapatkan `heartbeat_respond` dalam katalog alat OpenClaw
yang dapat dicari secara default, sehingga agen dapat mencatat apakah wake harus tetap
diam atau memberi notifikasi tanpa mengodekan alur kontrol tersebut dalam teks akhir.

Panduan inisiatif khusus Heartbeat dikirim sebagai instruksi developer mode kolaborasi Codex
pada giliran Heartbeat itu sendiri. Giliran chat biasa memulihkan mode Default Codex
alih-alih membawa filosofi Heartbeat dalam prompt runtime normalnya. Ketika
`HEARTBEAT.md` yang tidak kosong ada, instruksi mode kolaborasi Heartbeat
mengarahkan Codex ke file tersebut alih-alih menyisipkan isinya secara inline.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness OpenClaw dan Codex. |
| Middleware ekstensi app-server Codex  | Plugin bundled OpenClaw  | Perilaku adapter per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` proyek atau global Codex untuk merutekan
perilaku plugin OpenClaw. Untuk alat native dan bridge izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per-thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`.

Ketika approval app-server Codex diaktifkan, yang berarti `approvalPolicy` bukan
`"never"`, konfigurasi hook native default yang disuntikkan menghilangkan `PermissionRequest` sehingga
reviewer app-server Codex dan bridge approval OpenClaw menangani eskalasi nyata
setelah review. Operator dapat secara eksplisit menambahkan `permission_request` ke
`nativeHookRelay.events` ketika mereka membutuhkan relay kompatibilitas.

Hook Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi
kontrol tingkat Codex. Hook tersebut tidak diekspos sebagai hook plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw menjalankan alat setelah Codex meminta
panggilan, sehingga OpenClaw memicu perilaku plugin dan middleware yang dimilikinya dalam
adapter harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis.
OpenClaw dapat mencerminkan event terpilih, tetapi tidak dapat menulis ulang thread Codex
native kecuali Codex mengekspos operasi tersebut melalui callback app-server atau hook
native.

Event `PreToolUse` mode laporan app-server Codex menunda permintaan approval plugin
ke approval app-server yang sesuai. Jika hook OpenClaw `before_tool_call`
mengembalikan `requireApproval` sementara payload native menetapkan mode approval laporan
(`openclaw_approval_mode` adalah `"report"`), relay hook native mencatat
persyaratan approval plugin dan tidak mengembalikan keputusan native. Ketika Codex mengirim
permintaan approval app-server untuk penggunaan alat yang sama, OpenClaw membuka prompt
approval plugin dan memetakan keputusan kembali ke Codex. Event `PermissionRequest`
Codex adalah jalur approval terpisah dan tetap dapat dirutekan melalui approval OpenClaw
ketika runtime dikonfigurasi untuk bridge tersebut.

Notifikasi item app-server Codex juga menyediakan observasi `after_tool_call`
asinkron untuk penyelesaian alat native yang belum dicakup oleh relay
`PostToolUse` native. Observasi ini hanya untuk telemetri dan kompatibilitas
plugin; observasi tersebut tidak dapat memblokir, menunda, atau memutasi panggilan alat native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi app-server Codex
dan state adapter OpenClaw, bukan perintah hook native Codex.
Event `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adapter, bukan tangkapan byte demi byte
atas request internal atau payload Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai event agen `codex_app_server.hook` untuk trajectory dan debugging.
Notifikasi tersebut tidak memanggil hook plugin OpenClaw.

## Kontrak dukungan V1

Didukung dalam runtime Codex v1:

| Permukaan                                    | Dukungan                                                                         | Alasan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex              | Didukung                                                                         | App-server Codex memiliki giliran OpenAI, pelanjutan thread native, dan kelanjutan tool native.                                                                                                                                                                                                                                                                                                                                                                                        |
| Perutean dan pengiriman channel OpenClaw     | Didukung                                                                         | Telegram, Discord, Slack, WhatsApp, iMessage, dan channel lain tetap berada di luar runtime model.                                                                                                                                                                                                                                                                                                                                                                                     |
| Tool dinamis OpenClaw                        | Didukung                                                                         | Codex meminta OpenClaw mengeksekusi tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                                                                                                                                                                                                                                                                                                        |
| Plugin prompt dan konteks                    | Didukung                                                                         | OpenClaw memproyeksikan prompt/konteks khusus OpenClaw ke dalam giliran Codex sambil membiarkan prompt dasar, model, dan dokumen proyek terkonfigurasi milik Codex berada di jalur Codex native. OpenClaw menonaktifkan personality bawaan Codex untuk thread native agar file personality workspace agent tetap otoritatif. Instruksi developer Codex native hanya menerima panduan perintah yang secara eksplisit dicakupkan ke `codex_app_server`; petunjuk perintah global lama tetap ada untuk permukaan prompt non-Codex. |
| Siklus hidup engine konteks                  | Didukung                                                                         | Perakitan, ingest, dan pemeliharaan setelah giliran berjalan di sekitar giliran Codex. Engine konteks tidak menggantikan Compaction Codex native.                                                                                                                                                                                                                                                                                                                                      |
| Hook tool dinamis                            | Didukung                                                                         | Middleware `before_tool_call`, `after_tool_call`, dan hasil tool berjalan di sekitar tool dinamis milik OpenClaw.                                                                                                                                                                                                                                                                                                                                                                      |
| Hook siklus hidup                            | Didukung sebagai observasi adapter                                               | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang jujur.                                                                                                                                                                                                                                                                                                                                                       |
| Gate revisi jawaban akhir                    | Didukung melalui relay hook native                                               | Codex `Stop` direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                                                                                                                                                                                                                                                                                                         |
| Shell, patch, dan blokir atau observasi MCP native | Didukung melalui relay hook native                                               | Codex `PreToolUse` dan `PostToolUse` direlay untuk permukaan tool native yang di-commit, termasuk payload MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak.                                                                                                                                                                                                                                                                |
| Kebijakan izin native                        | Didukung melalui persetujuan app-server Codex dan relay hook native kompatibilitas | Permintaan persetujuan app-server Codex dirutekan melalui OpenClaw setelah tinjauan Codex. Relay hook native `PermissionRequest` bersifat opt-in untuk mode persetujuan native karena Codex memancarkannya sebelum tinjauan guardian.                                                                                                                                                                                                                                                   |
| Penangkapan trajectory app-server            | Didukung                                                                         | OpenClaw merekam permintaan yang dikirimnya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                                                                                                                                                                                                                                                                                                  |

Tidak didukung di runtime Codex v1:

| Permukaan                                           | Batas v1                                                                                                                                        | Jalur masa depan                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen tool native                          | Hook pra-tool native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen tool Codex-native.                                      | Memerlukan dukungan hook/skema Codex untuk input tool pengganti.                          |
| Riwayat transkrip Codex-native yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika operasi thread native diperlukan.           |
| `tool_result_persist` untuk catatan tool Codex-native | Hook itu mentransformasi penulisan transkrip milik OpenClaw, bukan catatan tool Codex-native.                                                  | Dapat mencerminkan catatan yang ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang kaya                | OpenClaw dapat meminta Compaction native, tetapi tidak menerima daftar tersimpan/dibuang yang stabil, delta token, ringkasan penyelesaian, atau payload ringkasan. | Memerlukan event Compaction Codex yang lebih kaya.                                        |
| Intervensi Compaction                               | OpenClaw tidak mengizinkan plugin atau engine konteks memveto, menulis ulang, atau mengganti Compaction Codex native.                          | Tambahkan hook Compaction pra/pasca Codex jika plugin perlu memveto atau menulis ulang Compaction native. |
| Penangkapan permintaan API model byte-demi-byte     | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi core Codex membangun permintaan API OpenAI akhir secara internal.         | Memerlukan event pelacakan permintaan model Codex atau API debug.                         |

## Izin native dan elisitasi MCP

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak yang eksplisit saat kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin. Codex memperlakukannya sebagai tanpa keputusan hook dan meneruskannya ke
jalur guardian atau persetujuan penggunanya sendiri.

Mode persetujuan app-server Codex menghilangkan hook native ini secara default.
Perilaku ini berlaku ketika `permission_request` secara eksplisit disertakan
dalam `nativeHookRelay.events` atau runtime kompatibilitas memasangnya.

Saat operator memilih `allow-always` untuk permintaan izin native Codex,
OpenClaw mengingat fingerprint provider/sesi/input tool/cwd persis tersebut
untuk jendela sesi terbatas. Keputusan yang diingat sengaja hanya exact-match:
perintah, argumen, payload tool, atau cwd yang berubah membuat persetujuan baru.

Elisitasi persetujuan tool MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang masuk antrean menjawab permintaan
server native itu alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lainnya gagal tertutup.

Untuk alur persetujuan plugin umum yang membawa prompt ini, lihat
[Permintaan izin plugin](/id/plugins/plugin-permission-requests).

## Pengarahan antrean

Pengarahan antrean active-run dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat
mode steer selama jendela hening yang dikonfigurasi dan mengirimkannya sebagai
satu permintaan `turn/steer` sesuai urutan kedatangan.

Giliran tinjauan Codex dan Compaction manual dapat menolak pengarahan pada giliran yang sama. Dalam hal itu, OpenClaw menunggu proses aktif selesai sebelum memulai prompt.
Gunakan `/queue followup` atau `/queue collect` ketika pesan seharusnya masuk antrean secara default
alih-alih mengarahkan. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

## Unggahan umpan balik Codex

Ketika `/diagnostics [note]` disetujui untuk sesi yang menggunakan harness Codex
native, OpenClaw juga memanggil `feedback/upload` app-server Codex untuk utas
Codex yang relevan. Unggahan tersebut meminta app-server menyertakan log untuk setiap utas yang tercantum
dan subutas Codex yang dibuat jika tersedia.

Unggahan berjalan melalui jalur umpan balik normal Codex ke server OpenAI. Jika umpan balik Codex
dinonaktifkan di app-server tersebut, perintah mengembalikan galat app-server.
Balasan diagnostik yang selesai mencantumkan channel, id sesi OpenClaw,
id utas Codex, dan perintah lokal `codex resume <thread-id>` untuk utas
yang dikirim.

Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak id Codex tersebut dan
tidak mengirim umpan balik Codex. Unggahan tidak menggantikan ekspor diagnostik Gateway
lokal. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk perilaku
persetujuan, privasi, bundle lokal, dan obrolan grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
umpan balik Codex untuk utas yang saat ini terlampir tanpa bundle diagnostik Gateway
lengkap.

## Compaction dan cermin transkrip

Ketika model yang dipilih menggunakan harness Codex, Compaction utas native menjadi tanggung jawab
app-server Codex. OpenClaw tidak menjalankan Compaction preflight untuk giliran Codex,
tidak mengganti Compaction Codex dengan Compaction context-engine, dan tidak
fallback ke peringkasan OpenClaw atau OpenAI publik ketika Compaction Codex
native tidak dapat dimulai. OpenClaw menyimpan cermin transkrip untuk riwayat
channel, pencarian, `/new`, `/reset`, dan pergantian model atau harness di masa mendatang.

Permintaan Compaction eksplisit, seperti `/compact` atau operasi compact manual
yang diminta Plugin, memulai Compaction Codex native dengan `thread/compact/start`.
OpenClaw kembali setelah memulai operasi native tersebut. OpenClaw tidak menunggu
penyelesaian, menerapkan timeout OpenClaw terpisah, memulai ulang app-server Codex
bersama, atau mencatat operasi tersebut sebagai Compaction yang diselesaikan OpenClaw.

Ketika context engine meminta proyeksi bootstrap utas Codex, OpenClaw
memproyeksikan nama dan id pemanggilan tool, bentuk input, dan konten hasil tool
yang telah disunting ke dalam utas Codex baru. OpenClaw tidak menyalin nilai argumen
pemanggilan tool mentah ke dalam proyeksi tersebut.

Cermin tersebut mencakup prompt pengguna, teks akhir asisten, dan catatan penalaran atau rencana
Codex ringan ketika app-server memancarkannya. Saat ini, OpenClaw hanya
mencatat sinyal mulai Compaction native eksplisit ketika meminta Compaction. OpenClaw
tidak mengekspos ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang
entri mana yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki utas native kanonis, `tool_result_persist` saat ini tidak
menulis ulang catatan hasil tool native Codex. Ini hanya berlaku ketika
OpenClaw menulis hasil tool transkrip sesi milik OpenClaw.

## Media dan pengiriman

OpenClaw tetap memiliki pengiriman media dan pemilihan penyedia media. Gambar,
video, musik, PDF, TTS, dan pemahaman media menggunakan pengaturan penyedia/model
yang sesuai seperti `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, dan `messages.tts`.

Teks, gambar, video, musik, TTS, persetujuan, dan output tool perpesanan tetap
melalui jalur pengiriman OpenClaw normal. Pembuatan media tidak memerlukan runtime legacy.
Ketika Codex memancarkan item pembuatan gambar native dengan `savedPath`, OpenClaw
meneruskan file persis tersebut melalui jalur media balasan normal meskipun giliran Codex
tidak memiliki teks asisten.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Hook Plugin](/id/plugins/hooks)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Ekspor trajectory](/id/tools/trajectory)
