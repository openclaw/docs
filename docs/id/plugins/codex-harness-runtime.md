---
read_when:
    - Anda memerlukan kontrak dukungan runtime harness Codex
    - Anda sedang men-debug alat native Codex, hook, compaction, atau pengunggahan umpan balik
    - Anda mengubah perilaku plugin di seluruh giliran harness OpenClaw dan Codex
summary: Batas runtime, hook, alat, izin, dan diagnostik untuk harness Codex
title: Runtime harness Codex
x-i18n:
    generated_at: "2026-07-19T05:22:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 516d70dee056657a06206c7ca4215f3776ccd2b027a136b5cc8fea3b11c1cd0b
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Kontrak runtime untuk giliran harness Codex. Untuk penyiapan dan perutean, lihat
[harness Codex](/id/plugins/codex-harness). Untuk bidang konfigurasi, lihat
[referensi harness Codex](/id/plugins/codex-harness-reference).

## Ikhtisar

Codex menangani loop model native, pelanjutan utas native, kelanjutan alat
native, dan Compaction native. OpenClaw menangani perutean kanal, file sesi,
pengiriman pesan yang terlihat, alat dinamis OpenClaw, persetujuan, pengiriman
media, dan cermin transkrip di sekitar batas tersebut.

Perutean prompt mengikuti runtime yang dipilih, bukan hanya string penyedia.
Giliran Codex native mendapatkan instruksi pengembang app-server Codex; rute
kompatibilitas OpenClaw yang eksplisit mempertahankan prompt sistem OpenClaw
normal meskipun menggunakan autentikasi atau transpor OpenAI bergaya Codex.

OpenClaw memulai dan melanjutkan utas Codex native dengan kepribadian bawaan
Codex dinonaktifkan (`personality: "none"`) sehingga file kepribadian ruang kerja
dan identitas agen OpenClaw tetap menjadi sumber otoritatif. Selain itu, Codex
native tetap mempertahankan instruksi dasar/model dan pemuatan dokumen proyek
yang ditangani Codex. Proses OpenClaw ringan (misalnya cron) tetap menonaktifkan
pemuatan dokumen proyek.

Instruksi pengembang OpenClaw mencakup aspek runtime OpenClaw: pengiriman kanal
sumber, alat dinamis OpenClaw, delegasi ACP, konteks adaptor, dan file profil
ruang kerja agen yang aktif. Katalog keterampilan dan penunjuk
`MEMORY.md` yang dirutekan melalui alat diproyeksikan sebagai instruksi
pengembang kolaborasi yang cakupannya terbatas pada giliran. Ketika alat memori
tidak tersedia, konten `BOOTSTRAP.md` yang aktif dan `MEMORY.md`
lengkap beralih menggunakan konteks input giliran biasa.

Sebagian besar alat dinamis OpenClaw menggunakan namespace
`openclaw` yang dapat dicari. Alat yang ditandai `catalogMode: "direct-only"`
menggunakan `openclaw_direct`, yang dipertahankan Codex agar terlihat langsung
oleh model sebagai `DirectModelOnly`, alih-alih mengeksposnya ke eksekusi
Code Mode bertingkat.

## Pengikatan utas dan perubahan model

Ketika sesi OpenClaw dilampirkan ke utas Codex yang sudah ada, giliran berikutnya
mengirim ulang model yang saat ini dipilih, kebijakan persetujuan, sandbox,
peninjau persetujuan, dan tingkat layanan ke app-server. Beralih dari
`openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan pengikatan utas, tetapi
meminta Codex untuk melanjutkan dengan model yang baru dipilih.

Pengikatan yang diawasi merupakan pengecualian. Pemilih model OpenClaw tetap
terkunci, dan pelanjutan tidak menyertakan penggantian model maupun penyedia
sehingga Codex memulihkan model dan penyedia tersimpan milik utas kanonis.
Kontrol Codex native terpisah dapat mengubah pasangan tersimpan tersebut, dan
snapshot awal dapat menghasilkan peringatan normal Codex tentang perbedaan
model; model OpenClaw luar dan rantai fallback tidak pernah menggantikan salah
satunya.

## Pengawasan dan kelanjutan yang aman

Pengawasan Codex adalah kemampuan opsional dari plugin `codex` yang
sama. Kemampuan ini menemukan utas native melalui koneksi terpisah dan hanya
memproyeksikan sesi yang belum diarsipkan ke katalog Gateway. Tanpa pengaturan
koneksi `appServer` yang eksplisit, koneksi tersebut menggunakan stdio
home pengguna terkelola, sementara harness biasa tetap tercakup pada agen.
Pembacaan daftar dan metadata bersifat pasif: tindakan tersebut tidak
melanjutkan utas, membuat OpenClaw berlangganan peristiwa langsungnya, atau
menjawab permintaan persetujuannya.

Untuk sesi tersimpan atau tidak aktif pada komputer Gateway, **Lanjutkan sebagai
cabang** membuat Chat normal yang modelnya terkunci dan mencerminkan riwayat
pengguna serta asisten yang dibatasi hingga giliran tersimpan terminal terakhir
dari sumber. Giliran Chat normal pertama memasang penangan persetujuan yang
sebenarnya dan menggunakan fork native sementara untuk menyematkan snapshot
tanpa penggantian model atau penyedia. Codex App Server menggunakan konfigurasi
native saat ini dan mengembalikan pasangan yang dipilih; server tersebut
mengeluarkan peringatan normalnya jika model itu berbeda dari model terakhir
yang tercatat pada sumber. Pada koneksi pengawasan yang sama, OpenClaw memulai
utas harness Codex sumber-`appServer` kanonis di bawah cwd dan kebijakan
runtime-nya dengan model dan penyedia yang dikembalikan secara persis untuk
permulaan awal tersebut, menyuntikkan riwayat terlihat yang dibatasi, lalu
mengarsipkan fork sementara. Sumber tidak pernah dilanjutkan. Utas kanonis
memiliki seluruh permukaan alat harness OpenClaw; penalaran, pemanggilan alat,
dan hasil alat dari sumber tidak dikloning ke dalamnya. Cakupan koneksi privat
bertahan selama status pengikatan tertunda dan diterapkan, sehingga setiap
giliran berikutnya tetap berada pada koneksi tersebut dengan konfigurasi
autentikasi dan penyedia native. Pengawasan yang dinonaktifkan atau penyimpangan
pengikatan/koneksi akan gagal secara tertutup, bukan beralih ke harness home
agen biasa.

Sumber CLI, VS Code, Atlas, atau ChatGPT asli tetap memenuhi syarat untuk kedua
katalog. Cabang kanonis merupakan utas Codex native, tetapi jenis sumbernya
adalah `appServer`; klien native dapat memfilter jenis sumber tersebut,
sehingga kemunculannya di Codex Desktop tidak dijamin.

Sumber aktif tidak dapat memulai cabang baru atau diarsipkan; Chat yang sudah
diawasi tetap dapat dibuka. `notLoaded` berarti aktivitas tidak diketahui,
bukan tidak aktif; OpenClaw mengizinkan pengarsipan untuk baris lokal
`idle` atau `notLoaded` hanya setelah konfirmasi eksplisit
bahwa tidak ada runner lain dan pembacaan status lokal-proses yang baru. Codex
menserialkan mutasi utas dalam satu proses App Server, tetapi tidak menyediakan
runner eksklusif lintas proses maupun lease pemilik persetujuan, sehingga
pembacaan tersebut tidak dapat membuktikan bahwa proses lain tidak sedang
menggunakan utas. OpenClaw memblokir pemilik pengikatan yang diketahui aktif
untuk target yang tepat atau setiap turunan hasil spawn yang belum diarsipkan
dan dikembalikan oleh kueri turunan berpaginasi milik Codex. Kesalahan enumerasi,
siklus, dan habisnya batas keamanan akan gagal secara tertutup. Pengarsipan
native masih dapat berpacu dengan giliran baru dalam proses lain, sehingga
konfirmasi mencakup klien yang tidak diketahui dan jeda antara pembacaan status
dan pengarsipan. Chat diawasi yang modelnya terkunci tidak dapat dihapus selama
masih melindungi pengikatan native.

Katalog Node berpasangan tetap hanya berupa metadata pada rilis awal. Batas
pemanggilan Node saat ini menggunakan pola permintaan/respons dan tidak dapat
membawa peristiwa giliran berumur panjang, permintaan persetujuan, atau keluaran
streaming yang diperlukan oleh pengikatan harness Codex nyata. Oleh karena itu,
**Lanjutkan** dan **Arsipkan** jarak jauh tetap tidak tersedia meskipun baris
sedang tidak aktif.

Lihat [pengawasan Codex](/plugins/codex-supervision) untuk penyiapan operator dan
perilaku Control UI yang terlihat.

## Balasan terlihat dan Heartbeat

Giliran chat langsung/sumber melalui harness Codex secara default mengirimkan
balasan akhir asisten secara otomatis untuk permukaan WebChat internal, sesuai
dengan kontrak harness Pi: agen membalas secara normal dan OpenClaw mengirimkan
teks akhir ke percakapan sumber. Atur `messages.visibleReplies: "message_tool"` agar teks akhir asisten
tetap privat kecuali agen memanggil `message(action="send")`.

Giliran Heartbeat Codex secara default mendapatkan `heartbeat_respond` dalam
katalog alat OpenClaw yang dapat dicari agar agen dapat mencatat apakah pemicuan
harus tetap senyap atau mengirimkan notifikasi. Panduan inisiatif Heartbeat
dikirim sebagai instruksi pengembang mode kolaborasi Codex yang cakupannya
terbatas pada giliran Heartbeat; giliran chat biasa tetap dalam mode Codex
Default. Ketika `HEARTBEAT.md` tidak kosong, instruksi Heartbeat mengarahkan
Codex ke file tersebut, bukan menyisipkan kontennya secara langsung.

## Batas hook

| Lapisan                               | Pemilik                  | Tujuan                                                               |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness OpenClaw dan Codex.   |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.        |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex tingkat proyek atau
global untuk merutekan perilaku plugin. Untuk jembatan alat dan izin native,
OpenClaw menyuntikkan konfigurasi Codex per utas untuk `PreToolUse`,
`PostToolUse`, `PermissionRequest`, dan `Stop`.

Ketika persetujuan app-server Codex diaktifkan (`approvalPolicy` bukan
`"never"`), konfigurasi hook native bawaan yang disuntikkan tidak
menyertakan `PermissionRequest` agar peninjau app-server Codex dan jembatan
persetujuan OpenClaw menangani eskalasi nyata setelah peninjauan. Tambahkan
`permission_request` ke `nativeHookRelay.events` untuk tetap memaksa relay
kompatibilitas. Hook Codex lainnya seperti `SessionStart` dan
`UserPromptSubmit` tetap menjadi kontrol tingkat Codex; hook tersebut tidak
diekspos sebagai hook plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw menjalankan alat setelah Codex meminta
pemanggilan, sehingga perilaku plugin dan middleware berjalan dalam adaptor
harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis; OpenClaw
dapat mencerminkan peristiwa yang dipilih, tetapi tidak dapat menulis ulang utas
native kecuali Codex mengekspos kemampuan tersebut melalui app-server atau
callback hook native.

Peristiwa `PreToolUse` mode laporan app-server Codex menunda persetujuan
plugin hingga persetujuan app-server yang sesuai. Jika hook OpenClaw
`before_tool_call` mengembalikan `requireApproval` sementara payload native
menetapkan `openclaw_approval_mode:
"report"`, relay hook native mencatat persyaratan persetujuan
plugin dan tidak mengembalikan keputusan native. Ketika Codex kemudian
mengirimkan permintaan persetujuan app-server untuk penggunaan alat yang sama,
OpenClaw membuka prompt persetujuan plugin dan memetakan keputusan kembali ke
Codex. Peristiwa Codex `PermissionRequest` merupakan jalur persetujuan terpisah
dan masih dapat dirutekan melalui persetujuan OpenClaw ketika dikonfigurasi
untuk jembatan tersebut.

Notifikasi item app-server Codex juga menyediakan observasi
`after_tool_call` asinkron untuk penyelesaian alat native yang belum dicakup
oleh relay native `PostToolUse`. Ini hanya untuk telemetri/kompatibilitas;
observasi tersebut tidak dapat memblokir, menunda, atau mengubah pemanggilan
alat native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi app-server
Codex dan status adaptor OpenClaw, bukan dari perintah hook native Codex.
`before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` merupakan observasi tingkat adaptor, bukan tangkapan
byte-demi-byte dari permintaan internal atau payload Compaction Codex.

Notifikasi app-server native Codex `hook/started` dan `hook/completed`
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk lintasan dan
debugging. Notifikasi tersebut tidak memanggil hook plugin OpenClaw.

## Kontrak dukungan V1

Didukung dalam runtime Codex v1:

| Permukaan                                      | Dukungan                                                                                  | Alasan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perulangan model OpenAI melalui Codex          | Didukung                                                                                  | App-server Codex menangani giliran OpenAI, pelanjutan thread native, dan kelanjutan alat native.                                                                                                                                                                                                                                                                                                                                                                                        |
| Perutean dan pengiriman kanal OpenClaw         | Didukung                                                                                  | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lainnya tetap berada di luar runtime model.                                                                                                                                                                                                                                                                                                                                                                                      |
| Alat dinamis OpenClaw                          | Didukung                                                                                  | Codex meminta OpenClaw menjalankan alat-alat ini, sehingga OpenClaw tetap berada dalam jalur eksekusi.                                                                                                                                                                                                                                                                                                                                                                                  |
| Plugin prompt dan konteks                      | Didukung                                                                                  | OpenClaw memproyeksikan prompt/konteks khusus OpenClaw ke dalam giliran Codex sembari membiarkan prompt dasar, model, dan dokumen proyek terkonfigurasi yang dikelola Codex tetap berada di jalur native Codex. OpenClaw menonaktifkan kepribadian bawaan Codex untuk thread native agar berkas kepribadian ruang kerja agen tetap menjadi acuan utama. Instruksi pengembang native Codex hanya menerima panduan perintah yang secara eksplisit dicakup dalam `codex_app_server`; petunjuk perintah global lama tetap tersedia untuk permukaan prompt non-Codex. |
| Siklus hidup mesin konteks                     | Didukung                                                                                  | Perakitan, penyerapan, dan pemeliharaan setelah giliran dijalankan di sekitar giliran Codex. Mesin konteks tidak menggantikan Compaction native Codex.                                                                                                                                                                                                                                                                                                                                    |
| Hook alat dinamis                              | Didukung                                                                                  | `before_tool_call`, `after_tool_call`, dan middleware hasil alat dijalankan di sekitar alat dinamis yang dikelola OpenClaw.                                                                                                                                                                                                                                                                                                                                                             |
| Hook siklus hidup                              | Didukung sebagai observasi adaptor                                                         | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang apa adanya.                                                                                                                                                                                                                                                                                                                                    |
| Gerbang revisi jawaban akhir                   | Didukung melalui relai hook native                                                         | `Stop` Codex direlai ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                                                                                                                                                                                                                                                                                           |
| Blokir atau observasi shell, patch, dan MCP native | Didukung melalui relai hook native                                                     | `PreToolUse` dan `PostToolUse` Codex direlai untuk permukaan alat native yang telah dikomit, termasuk payload MCP pada app-server Codex `0.142.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak didukung.                                                                                                                                                                                                                                      |
| Kebijakan izin native                          | Didukung melalui persetujuan app-server Codex dan relai hook native kompatibilitas        | Permintaan persetujuan app-server Codex dirutekan melalui OpenClaw setelah peninjauan Codex. Relai hook native `PermissionRequest` bersifat ikut serta untuk mode persetujuan native karena Codex memancarkannya sebelum peninjauan guardian.                                                                                                                                                                                                                                                    |
| Perekaman trajektori app-server                | Didukung                                                                                  | OpenClaw merekam permintaan yang dikirimkannya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                                                                                                                                                                                                                                                                                                |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                           | Batasan V1                                                                                                                                       | Jalur mendatang                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                        | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                               |
| Riwayat transkrip native Codex yang dapat diedit    | Codex mengelola riwayat thread native kanonis. OpenClaw mengelola cerminannya dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan thread native diperlukan.             |
| `tool_result_persist` untuk catatan alat native Codex | Hook tersebut mentransformasi penulisan transkrip yang dikelola OpenClaw, bukan catatan alat native Codex.                                       | Catatan yang ditransformasi dapat dicerminkan, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang kaya                | OpenClaw dapat meminta Compaction native, tetapi tidak menerima daftar stabil yang dipertahankan/dihapus, delta token, ringkasan penyelesaian, atau payload ringkasan. | Memerlukan peristiwa Compaction Codex yang lebih kaya.                                        |
| Intervensi Compaction                               | OpenClaw tidak mengizinkan plugin atau mesin konteks memveto, menulis ulang, atau menggantikan Compaction native Codex.                           | Tambahkan hook pra/pasca-Compaction Codex jika plugin perlu memveto atau menulis ulang Compaction native. |
| Perekaman permintaan API model bita demi bita       | OpenClaw dapat merekam permintaan dan notifikasi app-server, tetapi inti Codex menyusun permintaan API OpenAI final secara internal.              | Memerlukan peristiwa pelacakan permintaan model atau API debug Codex.                          |

## Izin native dan elisitasi MCP

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak yang eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin: Codex memperlakukannya sebagai tidak adanya keputusan hook dan meneruskannya
ke jalur guardian atau persetujuan penggunanya sendiri.

Mode persetujuan app-server Codex secara default menghilangkan hook native ini.
Hal ini berlaku kecuali `permission_request` secara eksplisit disertakan dalam
`nativeHookRelay.events` atau runtime kompatibilitas memasangnya.

Ketika operator memilih `allow-always` untuk permintaan izin native Codex,
OpenClaw mengingat sidik jari input penyedia/sesi/alat/cwd yang persis tersebut
selama jangka waktu sesi yang terbatas. Keputusan yang diingat sengaja hanya
berlaku untuk kecocokan persis: perubahan perintah, argumen, payload alat, atau
cwd membuat persetujuan baru.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai `"mcp_tool_call"`.
`request_user_input` Codex mendaftarkan pertanyaan gateway yang netral terhadap
penyedia untuk sesi asal. UI Kontrol merender kartu pertanyaan gateway, dan satu
pilihan non-rahasia menggunakan tombol kanal bertipe ketika kanal mendukungnya.
Ketukan tombol, jawaban UI Kontrol, dan balasan teks biasa berikutnya dalam
antrean semuanya menyelesaikan catatan gateway yang sama sebelum OpenClaw
mengembalikan jawaban app-server. Penyelesaian otomatis Codex dan pembatalan
percobaan membatasi waktu tunggu dan membatalkan catatan. Pertanyaan rahasia
sepenuhnya tetap berada di jalur balasan teks yang disertai peringatan. Permintaan
elisitasi MCP lainnya gagal secara tertutup.

Untuk alur persetujuan plugin umum yang membawa prompt ini, lihat
[Permintaan izin Plugin](/id/plugins/plugin-permission-requests).

## Pengarahan antrean

Pengarahan antrean proses aktif dipetakan ke app-server Codex `turn/steer`. Dengan
`messages.queue.mode: "steer"` default, OpenClaw mengelompokkan pesan obrolan mode pengarahan
selama jendela hening yang dikonfigurasi dan mengirimkannya sebagai satu permintaan
`turn/steer` berdasarkan urutan kedatangan.

Giliran review Codex dan Compaction manual dapat menolak pengarahan pada giliran yang sama. Dalam
kasus tersebut, OpenClaw menunggu proses aktif selesai sebelum memulai
prompt. Gunakan `/queue followup` atau `/queue collect` ketika pesan secara default
harus masuk antrean, bukan diarahkan. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

## Pengunggahan umpan balik Codex

Saat `/diagnostics [note]` disetujui untuk suatu sesi pada harness Codex
native, OpenClaw juga memanggil app-server Codex `feedback/upload` untuk thread
Codex yang relevan, termasuk log untuk setiap thread yang tercantum dan subthread Codex
yang dibuat jika tersedia.

Pengunggahan tersebut melewati jalur umpan balik normal Codex menuju server OpenAI. Jika
umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan
galat app-server. Balasan diagnostik yang selesai mencantumkan channel,
id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim.

Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak id Codex tersebut
dan tidak mengirimkan umpan balik Codex. Pengunggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk
perilaku persetujuan, privasi, bundel lokal, dan obrolan grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda menginginkan pengunggahan umpan balik Codex
untuk thread yang sedang terhubung tanpa bundel diagnostik Gateway
lengkap.

## Compaction dan cermin transkrip

Saat model yang dipilih menggunakan harness Codex, Compaction thread native
merupakan tanggung jawab app-server Codex. OpenClaw tidak menjalankan Compaction pra-pemeriksaan untuk
giliran Codex, mengganti Compaction Codex dengan Compaction mesin konteks, atau
beralih ke peringkasan OpenClaw maupun OpenAI publik ketika Compaction native tidak dapat
dimulai. OpenClaw menyimpan cermin transkrip untuk riwayat channel, pencarian,
`/new`, `/reset`, serta peralihan model atau harness pada masa mendatang.

Permintaan Compaction eksplisit, seperti `/compact` atau operasi Compaction manual
yang diminta Plugin, memulai Compaction Codex native dengan `thread/compact/start`.
OpenClaw mempertahankan permintaan dan sewa klien bersama tetap terbuka hingga Codex memancarkan
item penyelesaian `contextCompaction` yang sesuai, lalu melaporkan giliran
Compaction sebagai selesai. Jika giliran terminal tersebut melampaui batas waktu Compaction
yang dikonfigurasi, OpenClaw meminta interupsi giliran native. Sewa dan pembatas
Compaction per thread tetap dipertahankan hingga Codex melaporkan status terminal atau mengonfirmasi
RPC interupsi. Jika Codex tidak mengonfirmasi dalam masa tenggang interupsi,
OpenClaw menghentikan koneksi sebelum melepaskan pembatas. Koneksi
jarak jauh juga melepaskan pengikatan thread yang sesuai agar pekerjaan berikutnya tidak dapat
bertumpang-tindih dengan giliran jarak jauh yang belum dikonfirmasi. Giliran lain pada koneksi yang dihentikan akan gagal
dan dapat dicoba ulang pada klien baru. Penutupan klien, pembatalan permintaan, atau
giliran Compaction yang gagal mengembalikan operasi yang gagal. Compaction otomatis akibat tekanan
konteks merupakan tugas Codex; OpenClaw hanya memulai Compaction native untuk pemicu yang diminta
secara manual.

Saat mesin konteks meminta proyeksi bootstrap thread Codex, OpenClaw
memproyeksikan nama dan id panggilan alat, bentuk input, serta konten hasil alat
yang telah disunting ke dalam thread Codex baru. OpenClaw tidak menyalin nilai argumen
panggilan alat mentah ke dalam proyeksi tersebut.

Cermin tersebut mencakup prompt pengguna, teks akhir asisten, serta catatan penalaran
atau rencana Codex yang ringan ketika app-server memancarkannya. OpenClaw
mencatat awal Compaction native dan status terminalnya, tetapi tidak
menampilkan ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit mengenai
entri mana yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` tidak
menulis ulang catatan hasil alat native Codex. Ini hanya berlaku ketika OpenClaw
menulis hasil alat transkrip sesi milik OpenClaw.

## Media dan pengiriman

OpenClaw tetap menangani pengiriman media dan pemilihan penyedia media. Gambar,
video, musik, PDF, TTS, dan pemahaman media menggunakan pengaturan penyedia/model
yang sesuai, seperti `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel`, dan `messages.tts`.

Teks, gambar, video, musik, TTS, persetujuan, dan keluaran alat perpesanan tetap
melewati jalur pengiriman normal OpenClaw; pembuatan media tidak memerlukan
runtime lama. Saat Codex memancarkan item pembuatan gambar native dengan
`savedPath`, OpenClaw meneruskan berkas persis tersebut melalui jalur media balasan
normal, meskipun giliran Codex tidak memiliki teks asisten.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Supervisi Codex](/plugins/codex-supervision)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Hook Plugin](/id/plugins/hooks)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Ekspor trajektori](/id/tools/trajectory)
