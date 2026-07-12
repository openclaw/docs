---
read_when:
    - Anda memerlukan kontrak dukungan runtime harness Codex
    - Anda sedang men-debug alat native Codex, hook, Compaction, atau pengunggahan umpan balik
    - Anda mengubah perilaku plugin di seluruh giliran harness OpenClaw dan Codex
summary: Batas runtime, hook, alat, izin, dan diagnostik untuk harness Codex
title: Runtime harness Codex
x-i18n:
    generated_at: "2026-07-12T14:23:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Kontrak runtime untuk giliran harness Codex. Untuk penyiapan dan perutean, lihat
[harness Codex](/id/plugins/codex-harness). Untuk bidang konfigurasi, lihat
[referensi harness Codex](/id/plugins/codex-harness-reference).

## Ringkasan

Codex menangani loop model native, pelanjutan utas native, kelanjutan alat
native, dan compaction native. OpenClaw menangani perutean kanal, berkas sesi,
pengiriman pesan yang terlihat, alat dinamis OpenClaw, persetujuan, pengiriman
media, dan cerminan transkrip di sekitar batas tersebut.

Perutean prompt mengikuti runtime yang dipilih, bukan hanya string penyedia.
Giliran Codex native mendapatkan instruksi pengembang app-server Codex; rute
kompatibilitas OpenClaw yang eksplisit mempertahankan prompt sistem OpenClaw
normal meskipun menggunakan autentikasi atau transportasi OpenAI bercorak Codex.

OpenClaw memulai dan melanjutkan utas Codex native dengan kepribadian bawaan
Codex dinonaktifkan (`personality: "none"`) agar berkas kepribadian ruang kerja
dan identitas agen OpenClaw tetap menjadi acuan utama. Selain itu, Codex native
tetap mempertahankan instruksi dasar/model dan pemuatan dokumen proyek yang
dikelola Codex. Proses OpenClaw ringan (misalnya cron) tetap menonaktifkan
pemuatan dokumen proyek.

Instruksi pengembang OpenClaw mencakup hal-hal terkait runtime OpenClaw:
pengiriman kanal sumber, alat dinamis OpenClaw, delegasi ACP, konteks adaptor,
dan berkas profil ruang kerja agen aktif. Katalog Skills dan penunjuk
`MEMORY.md` yang dirutekan melalui alat diproyeksikan sebagai instruksi
pengembang kolaborasi yang cakupannya terbatas pada giliran. Ketika alat memori
tidak tersedia, konten `BOOTSTRAP.md` aktif dan seluruh `MEMORY.md` sebagai
gantinya dimasukkan ke konteks masukan giliran biasa.

Sebagian besar alat dinamis OpenClaw menggunakan namespace `openclaw` yang
dapat dicari. Alat yang ditandai `catalogMode: "direct-only"` menggunakan
`openclaw_direct`, yang dipertahankan Codex agar terlihat langsung oleh model
sebagai `DirectModelOnly`, alih-alih mengeksposnya ke eksekusi Code Mode
bersarang.

## Pengikatan utas dan perubahan model

Ketika sesi OpenClaw dilampirkan ke utas Codex yang sudah ada, giliran
berikutnya mengirimkan kembali model yang saat ini dipilih, kebijakan
persetujuan, sandbox, peninjau persetujuan, dan tingkat layanan ke app-server.
Peralihan dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan pengikatan
utas, tetapi meminta Codex untuk melanjutkan dengan model yang baru dipilih.

Pengikatan yang diawasi merupakan pengecualian. Pemilih model OpenClaw tetap
terkunci, dan pelanjutan tidak menyertakan penggantian model maupun penyedia
agar Codex memulihkan model dan penyedia tersimpan milik utas kanonis. Kontrol
Codex native yang terpisah dapat mengubah pasangan tersimpan tersebut, dan
snapshot awal dapat menghasilkan peringatan perbedaan model normal dari Codex;
model OpenClaw luar dan rantai fallback tidak pernah menggantikan keduanya.

## Pengawasan dan kelanjutan yang aman

Pengawasan Codex adalah kemampuan ikut-serta dari plugin `codex` yang sama.
Kemampuan ini menemukan utas native melalui koneksi terpisah dan hanya
memproyeksikan sesi yang tidak diarsipkan ke katalog Gateway. Tanpa pengaturan
koneksi `appServer` yang eksplisit, koneksi tersebut menggunakan stdio rumah
pengguna terkelola, sedangkan harness biasa tetap terbatas pada agen. Pembacaan
daftar dan metadata bersifat pasif: tindakan tersebut tidak melanjutkan utas,
mendaftarkan OpenClaw ke peristiwa langsungnya, atau menjawab permintaan
persetujuannya.

Untuk sesi tersimpan atau tidak aktif pada komputer Gateway, **Lanjutkan sebagai cabang**
membuat Chat normal yang modelnya terkunci dan mencerminkan riwayat pengguna
serta asisten yang dibatasi hingga giliran tersimpan terminal terakhir dari
sumber. Giliran Chat normal pertama memasang penangan persetujuan yang
sebenarnya dan menggunakan fork native sementara untuk menyematkan snapshot
tanpa penggantian model atau penyedia. Codex App Server menggunakan konfigurasi
native saat ini dan mengembalikan pasangan yang dipilih; Codex mengeluarkan
peringatan normalnya jika model tersebut berbeda dari model terakhir yang
tercatat pada sumber. Pada koneksi pengawasan yang sama, OpenClaw memulai utas
harness Codex kanonis yang bersumber dari `appServer` di bawah cwd dan kebijakan
runtime-nya dengan tepat model dan penyedia yang dikembalikan untuk permulaan
awal tersebut, menyuntikkan riwayat terlihat yang dibatasi, lalu mengarsipkan
fork sementara. Sumber tidak pernah dilanjutkan. Utas kanonis memiliki seluruh
permukaan alat harness OpenClaw; penalaran, panggilan alat, dan hasil alat dari
sumber tidak dikloning ke dalamnya. Cakupan koneksi privat bertahan sepanjang
status pengikatan tertunda dan tersimpan, sehingga setiap giliran berikutnya
tetap menggunakan koneksi tersebut dengan konfigurasi autentikasi dan penyedia
native. Pengawasan yang dinonaktifkan atau penyimpangan pengikatan/koneksi akan
gagal secara tertutup, alih-alih beralih ke harness rumah agen biasa.

Sumber CLI atau VS Code asli tetap memenuhi syarat untuk kedua katalog. Cabang
kanonis adalah utas Codex native, tetapi jenis sumbernya adalah `appServer`;
klien native dapat memfilter jenis sumber tersebut, sehingga kemunculannya di
Codex Desktop tidak dijamin.

Sumber aktif tidak dapat memulai cabang baru atau diarsipkan; Chat terawasi yang
sudah ada masih dapat dibuka. `notLoaded` berarti aktivitas tidak diketahui,
bukan tidak aktif; OpenClaw hanya mengizinkan pengarsipan untuk baris lokal
`idle` atau `notLoaded` setelah konfirmasi eksplisit bahwa tidak ada pelaksana
lain dan pembacaan status lokal proses yang baru. Codex menserialkan mutasi utas
dalam satu proses App Server, tetapi tidak menyediakan lease eksklusif
pelaksana lintas proses atau pemilik persetujuan, sehingga pembacaan tersebut
tidak dapat membuktikan bahwa proses lain tidak sedang menggunakan utas.
OpenClaw memblokir pemilik pengikatan aktif yang diketahui untuk target yang
tepat atau turunan hasil pembuatan yang belum diarsipkan yang dikembalikan oleh
kueri turunan berhalaman milik Codex. Kesalahan enumerasi, siklus, dan habisnya
batas keamanan akan gagal secara tertutup. Pengarsipan native masih dapat
berpacu dengan giliran baru di proses lain, sehingga konfirmasi mencakup klien
yang tidak diketahui dan celah antara pembacaan status dengan pengarsipan. Chat
terawasi dengan model terkunci tidak dapat dihapus selama melindungi pengikatan
native.

Katalog node berpasangan tetap hanya berupa metadata dalam rilis awal. Batas
pemanggilan node saat ini menggunakan pola permintaan/respons dan tidak dapat
membawa peristiwa giliran berumur panjang, permintaan persetujuan, atau keluaran
streaming yang diperlukan oleh pengikatan harness Codex sebenarnya. Oleh karena
itu, **Lanjutkan** dan **Arsipkan** jarak jauh tetap tidak tersedia meskipun
baris sedang tidak aktif.

Lihat [pengawasan Codex](/id/plugins/codex-supervision) untuk penyiapan operator dan
perilaku Control UI yang terlihat.

## Balasan terlihat dan heartbeat

Giliran chat langsung/sumber melalui harness Codex secara default mengirimkan
balasan akhir asisten secara otomatis untuk permukaan WebChat internal, sesuai
dengan kontrak harness Pi: agen membalas secara normal dan OpenClaw mengirimkan
teks akhir ke percakapan sumber. Atur `messages.visibleReplies: "message_tool"`
agar teks akhir asisten tetap privat kecuali agen memanggil
`message(action="send")`.

Giliran heartbeat Codex secara default mendapatkan `heartbeat_respond` dalam
katalog alat OpenClaw yang dapat dicari agar agen dapat mencatat apakah
pengaktifan harus tetap senyap atau mengirim notifikasi. Panduan inisiatif
Heartbeat dikirim sebagai instruksi pengembang mode kolaborasi Codex yang
cakupannya terbatas pada giliran heartbeat; giliran chat biasa tetap berada
dalam mode Default Codex. Ketika `HEARTBEAT.md` tidak kosong, instruksi
heartbeat mengarahkan Codex ke berkas tersebut alih-alih menyematkan isinya.

## Batas hook

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness OpenClaw dan Codex. |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan berkas `hooks.json` Codex proyek atau global untuk
merutekan perilaku plugin. Untuk jembatan alat native dan izin, OpenClaw
menyuntikkan konfigurasi Codex per utas untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`.

Ketika persetujuan app-server Codex diaktifkan (`approvalPolicy` bukan
`"never"`), konfigurasi hook native bawaan yang disuntikkan tidak menyertakan
`PermissionRequest` agar peninjau app-server Codex dan jembatan persetujuan
OpenClaw menangani eskalasi nyata setelah peninjauan. Tambahkan
`permission_request` ke `nativeHookRelay.events` untuk tetap memaksa relai
kompatibilitas. Hook Codex lainnya seperti `SessionStart` dan
`UserPromptSubmit` tetap menjadi kontrol tingkat Codex; keduanya tidak
diekspos sebagai hook plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta
panggilan, sehingga perilaku plugin dan middleware berjalan dalam adaptor
harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis; OpenClaw
dapat mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang utas
native kecuali Codex mengeksposnya melalui app-server atau callback hook native.

Peristiwa `PreToolUse` mode laporan app-server Codex menunda persetujuan plugin
hingga persetujuan app-server yang sesuai. Jika hook `before_tool_call`
OpenClaw mengembalikan `requireApproval` sementara payload native menetapkan
`openclaw_approval_mode: "report"`, relai hook native mencatat persyaratan
persetujuan plugin dan tidak mengembalikan keputusan native. Ketika Codex
kemudian mengirimkan permintaan persetujuan app-server untuk penggunaan alat
yang sama, OpenClaw membuka prompt persetujuan plugin dan memetakan keputusan
kembali ke Codex. Peristiwa `PermissionRequest` Codex merupakan jalur
persetujuan terpisah dan masih dapat dirutekan melalui persetujuan OpenClaw
ketika dikonfigurasi untuk jembatan tersebut.

Notifikasi item app-server Codex juga menyediakan pengamatan
`after_tool_call` asinkron untuk penyelesaian alat native yang belum dicakup
oleh relai native `PostToolUse`. Ini hanya untuk telemetri/kompatibilitas;
pengamatan tersebut tidak dapat memblokir, menunda, atau memutasi panggilan
alat native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi app-server
Codex serta status adaptor OpenClaw, bukan perintah hook native Codex.
`before_compaction`, `after_compaction`, `llm_input`, dan `llm_output` adalah
pengamatan tingkat adaptor, bukan tangkapan byte demi byte dari permintaan
internal atau payload compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk lintasan dan
debugging. Notifikasi tersebut tidak memanggil hook plugin OpenClaw.

## Kontrak dukungan V1

Didukung dalam runtime Codex v1:

| Permukaan                                      | Dukungan                                                                         | Alasan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perulangan model OpenAI melalui Codex          | Didukung                                                                         | app-server Codex menangani giliran OpenAI, pelanjutan utas native, dan kelanjutan alat native.                                                                                                                                                                                                                                                                                                                                                                                           |
| Perutean dan pengiriman kanal OpenClaw         | Didukung                                                                         | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lainnya tetap berada di luar runtime model.                                                                                                                                                                                                                                                                                                                                                                                      |
| Alat dinamis OpenClaw                          | Didukung                                                                         | Codex meminta OpenClaw menjalankan alat-alat ini, sehingga OpenClaw tetap berada dalam jalur eksekusi.                                                                                                                                                                                                                                                                                                                                                                                   |
| Plugin prompt dan konteks                      | Didukung                                                                         | OpenClaw memproyeksikan prompt/konteks khusus OpenClaw ke dalam giliran Codex, sementara prompt dasar, model, dan dokumen proyek terkonfigurasi milik Codex tetap berada di jalur native Codex. OpenClaw menonaktifkan kepribadian bawaan Codex untuk utas native agar berkas kepribadian ruang kerja agen tetap menjadi acuan utama. Instruksi pengembang native Codex hanya menerima panduan perintah yang secara eksplisit dicakupkan ke `codex_app_server`; petunjuk perintah global lama tetap berlaku untuk permukaan prompt non-Codex. |
| Siklus hidup mesin konteks                     | Didukung                                                                         | Perakitan, penyerapan, dan pemeliharaan setelah giliran dijalankan di sekitar giliran Codex. Mesin konteks tidak menggantikan Compaction native Codex.                                                                                                                                                                                                                                                                                                                                    |
| Hook alat dinamis                              | Didukung                                                                         | Middleware `before_tool_call`, `after_tool_call`, dan hasil alat dijalankan di sekitar alat dinamis milik OpenClaw.                                                                                                                                                                                                                                                                                                                                                                      |
| Hook siklus hidup                              | Didukung sebagai pengamatan adaptor                                               | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang sesuai dengan keadaan sebenarnya.                                                                                                                                                                                                                                                                                                                              |
| Gerbang revisi jawaban akhir                   | Didukung melalui relai hook native                                                | `Stop` Codex direlai ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                                                                                                                                                                                                                                                                                                           |
| Pemblokiran atau pengamatan shell, patch, dan MCP native | Didukung melalui relai hook native                                      | `PreToolUse` dan `PostToolUse` Codex direlai untuk permukaan alat native yang telah dikomit, termasuk payload MCP pada app-server Codex `0.142.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak didukung.                                                                                                                                                                                                                                                        |
| Kebijakan izin native                          | Didukung melalui persetujuan app-server Codex dan relai hook native kompatibilitas | Permintaan persetujuan app-server Codex dirutekan melalui OpenClaw setelah peninjauan Codex. Relai hook native `PermissionRequest` bersifat opsional untuk mode persetujuan native karena Codex memancarkannya sebelum peninjauan guardian.                                                                                                                                                                                                                                                 |
| Perekaman trajektori app-server                | Didukung                                                                         | OpenClaw merekam permintaan yang dikirimnya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                                                                                                                                                                                                                                                                                                    |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                           | Batasan V1                                                                                                                                             | Jalur mendatang                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Hook sebelum alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                         | Memerlukan dukungan hook/skema Codex untuk masukan alat pengganti.                                   |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat utas native kanonis. OpenClaw memiliki cerminan dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi bagian internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan utas native diperlukan.                     |
| `tool_result_persist` untuk catatan alat native Codex | Hook tersebut mentransformasi penulisan transkrip milik OpenClaw, bukan catatan alat native Codex.                                                    | Catatan yang ditransformasi dapat dicerminkan, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang lengkap             | OpenClaw dapat meminta Compaction native, tetapi tidak menerima daftar stabil item yang dipertahankan/dibuang, delta token, ringkasan penyelesaian, atau payload ringkasan. | Memerlukan peristiwa Compaction Codex yang lebih lengkap.                                            |
| Intervensi Compaction                               | OpenClaw tidak mengizinkan Plugin atau mesin konteks memveto, menulis ulang, atau menggantikan Compaction native Codex.                                | Tambahkan hook sebelum/sesudah Compaction Codex jika Plugin perlu memveto atau menulis ulang Compaction native. |
| Perekaman permintaan API model byte demi byte       | OpenClaw dapat merekam permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI akhir secara internal.                  | Memerlukan peristiwa pelacakan permintaan model Codex atau API debug.                                |

## Izin native dan permintaan elisitasi MCP

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak secara eksplisit ketika kebijakan telah memutuskan. Hasil tanpa keputusan
bukanlah izin: Codex memperlakukannya sebagai tidak adanya keputusan hook dan
meneruskannya ke jalur persetujuan guardian atau pengguna miliknya sendiri.

Mode persetujuan app-server Codex secara bawaan tidak menyertakan hook native
ini. Hal ini berlaku kecuali `permission_request` secara eksplisit disertakan
dalam `nativeHookRelay.events` atau runtime kompatibilitas memasangnya.

Ketika operator memilih `allow-always` untuk permintaan izin native Codex,
OpenClaw mengingat sidik jari persis dari penyedia/sesi/masukan alat/cwd tersebut
untuk jangka waktu sesi yang terbatas. Keputusan yang diingat sengaja hanya
berlaku untuk kecocokan persis: perubahan perintah, argumen, payload alat, atau
cwd akan membuat persetujuan baru.

Permintaan elisitasi persetujuan alat MCP Codex dirutekan melalui alur
persetujuan Plugin OpenClaw ketika Codex menandai `_meta.codex_approval_kind`
sebagai `"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke
percakapan asal, dan pesan tindak lanjut berikutnya dalam antrean akan menjawab
permintaan server native tersebut alih-alih diarahkan sebagai konteks tambahan.
Permintaan elisitasi MCP lainnya ditolak secara aman.

Untuk alur persetujuan Plugin umum yang membawa prompt ini, lihat
[Permintaan izin Plugin](/id/plugins/plugin-permission-requests).

## Pengarahan antrean

Pengarahan antrean proses aktif dipetakan ke `turn/steer` app-server Codex.
Dengan `messages.queue.mode: "steer"` bawaan, OpenClaw mengelompokkan pesan
percakapan mode pengarahan selama periode tenang yang dikonfigurasi dan
mengirimkannya sebagai satu permintaan `turn/steer` sesuai urutan kedatangan.

Giliran peninjauan Codex dan Compaction manual dapat menolak pengarahan pada giliran yang sama. Dalam
kasus tersebut, OpenClaw menunggu proses aktif selesai sebelum memulai
prompt. Gunakan `/queue followup` atau `/queue collect` jika pesan harus masuk antrean
secara default alih-alih mengarahkan. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

## Pengunggahan umpan balik Codex

Ketika `/diagnostics [note]` disetujui untuk suatu sesi pada harness Codex
native, OpenClaw juga memanggil `feedback/upload` dari app-server Codex untuk utas
Codex yang relevan, termasuk log untuk setiap utas yang tercantum dan subutas
Codex yang dibuat jika tersedia.

Pengunggahan dilakukan melalui jalur umpan balik normal Codex ke server OpenAI. Jika
umpan balik Codex dinonaktifkan di app-server tersebut, perintah akan mengembalikan
kesalahan app-server. Balasan diagnostik yang selesai mencantumkan kanal,
id sesi OpenClaw, id utas Codex, dan perintah lokal `codex resume <thread-id>`
untuk utas yang dikirim.

Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak id Codex tersebut
dan tidak mengirim umpan balik Codex. Pengunggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk
perilaku persetujuan, privasi, bundel lokal, dan percakapan grup.

Gunakan `/codex diagnostics [note]` hanya jika Anda menginginkan pengunggahan umpan balik Codex
untuk utas yang saat ini terlampir tanpa bundel diagnostik Gateway
lengkap.

## Compaction dan cermin transkrip

Ketika model yang dipilih menggunakan harness Codex, Compaction utas native
merupakan tanggung jawab app-server Codex. OpenClaw tidak menjalankan Compaction prapemeriksaan untuk
giliran Codex, mengganti Compaction Codex dengan Compaction mesin konteks, atau melakukan
fallback ke peringkasan OpenClaw atau OpenAI publik ketika Compaction native tidak dapat
dimulai. OpenClaw menyimpan cermin transkrip untuk riwayat kanal, pencarian,
`/new`, `/reset`, serta peralihan model atau harness pada masa mendatang.

Permintaan Compaction eksplisit, seperti `/compact` atau operasi Compaction manual
yang diminta Plugin, memulai Compaction Codex native dengan `thread/compact/start`.
OpenClaw mempertahankan permintaan dan sewa klien bersama tetap terbuka hingga Codex memancarkan
item penyelesaian `contextCompaction` yang sesuai, lalu melaporkan giliran Compaction
sebagai selesai. Jika giliran terminal tersebut melampaui batas waktu Compaction yang
dikonfigurasi, OpenClaw meminta interupsi giliran native. Sewa dan pembatas
Compaction per utas tetap ditahan hingga Codex melaporkan status terminal atau mengonfirmasi
RPC interupsi. Jika Codex tidak mengonfirmasi dalam masa tenggang interupsi,
OpenClaw menghentikan koneksi sebelum melepaskan pembatas. Koneksi
jarak jauh juga melepaskan pengikatan utas yang sesuai agar pekerjaan berikutnya tidak dapat
bertumpang tindih dengan giliran jarak jauh yang belum dikonfirmasi. Giliran lain pada koneksi yang dihentikan akan gagal
dan dapat dicoba lagi pada klien baru. Penutupan klien, pembatalan permintaan, atau
giliran Compaction yang gagal akan menghasilkan operasi gagal. Compaction otomatis akibat tekanan konteks
merupakan tugas Codex; OpenClaw hanya memulai Compaction native untuk pemicu yang
diminta secara manual.

Ketika mesin konteks meminta proyeksi bootstrap utas Codex, OpenClaw
memproyeksikan nama dan id pemanggilan alat, bentuk input, serta konten hasil alat
yang disunting ke utas Codex baru. OpenClaw tidak menyalin nilai argumen mentah
pemanggilan alat ke dalam proyeksi tersebut.

Cermin tersebut mencakup prompt pengguna, teks akhir asisten, serta catatan penalaran
atau rencana Codex yang ringan ketika app-server memancarkannya. OpenClaw
mencatat awal dan status terminal Compaction native, tetapi tidak
menampilkan ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit mengenai entri
yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki utas native kanonis, `tool_result_persist` tidak
menulis ulang catatan hasil alat native Codex. Pengaturan ini hanya berlaku ketika OpenClaw
menulis hasil alat transkrip sesi yang dimiliki OpenClaw.

## Media dan pengiriman

OpenClaw tetap mengelola pengiriman media dan pemilihan penyedia media. Gambar,
video, musik, PDF, TTS, dan pemahaman media menggunakan pengaturan penyedia/model
yang sesuai seperti `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel`, dan `messages.tts`.

Teks, gambar, video, musik, TTS, persetujuan, dan output alat perpesanan tetap
dikirim melalui jalur pengiriman OpenClaw normal; pembuatan media tidak memerlukan
runtime lama. Ketika Codex memancarkan item pembuatan gambar native dengan
`savedPath`, OpenClaw meneruskan berkas tersebut persis melalui jalur media balasan
normal meskipun giliran Codex tidak memiliki teks asisten.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Supervisi Codex](/id/plugins/codex-supervision)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Hook Plugin](/id/plugins/hooks)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Ekspor trajektori](/id/tools/trajectory)
