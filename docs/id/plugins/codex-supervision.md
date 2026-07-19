---
read_when:
    - Anda ingin sesi Codex Desktop atau CLI muncul di OpenClaw
    - Anda perlu membuat cabang dari atau mengarsipkan sesi Codex lokal yang tersimpan atau tidak aktif
    - Anda mengekspos sesi Codex dan riwayat transkrip dari node yang dipasangkan
sidebarTitle: Codex supervision
summary: Telusuri sesi Codex native yang tidak diarsipkan dan transkrip berpaginasi di seluruh Node OpenClaw
title: Awasi sesi Codex
x-i18n:
    generated_at: "2026-07-19T05:04:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f365e3207dff092c3dfd8f7588d60d70a16f0cce484991eb4ab3fc0bd15f8051
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Pengawasan Codex adalah kemampuan opsional dari plugin resmi `codex`. Fitur ini
menampilkan sesi sumber Codex CLI, VS Code, Atlas, dan ChatGPT yang tidak diarsipkan dari
komputer Gateway dan komputer pasangan yang telah ikut serta di bilah sisi sesi
dan panel Chat biasa.

Rilis awal sengaja mempertahankan cakupan kepemilikan yang sempit:

- Sesi lokal tersimpan atau tidak aktif dapat membuat Chat OpenClaw yang modelnya dikunci dari
  riwayat pengguna dan asisten tersimpan yang dibatasi. Pesan pertama memulai
  fork snapshot native, lalu memulai thread harness Codex lengkap dengan model
  dan penyedia persis seperti yang dipilih Codex App Server untuk fork tersebut. Giliran
  berikutnya memulihkan pasangan tersimpan milik thread native kanonis sementara
  pengikatan yang diawasi mencegah OpenClaw menggantinya dengan runtime,
  model, atau fallback lain. Kontrol Codex native yang terpisah tetap dapat mengubah
  pasangan tersimpan tersebut. Cabang yang sudah dibuat akan membuka Chat yang ada.
- Aktivitas langsung sesi tersimpan yang ditemukan dari proses Codex lain tidak
  diketahui. Sesi tersebut dapat dibuatkan cabang, atau hanya dapat diarsipkan setelah operator
  mengonfirmasi bahwa tidak ada klien Codex lain yang menggunakannya.
- Sumber yang aktif tetap terlihat tetapi tidak dapat dibuatkan cabang atau diarsipkan hingga
  giliran saat ini selesai. Jika sumber tersebut sudah memiliki Chat yang diawasi, **Buka Chat**
  tetap tersedia.
- Sesi pada node pasangan mengekspos transkrip tersimpannya melalui pembacaan App Server
  yang dibatasi dan diberi paginasi berbasis kursor. Kelanjutan jarak jauh
  memerlukan jembatan node streaming pada masa mendatang; pengarsipan jarak jauh juga memerlukan
  lease kepemilikan runner atau mekanisme pembatasan yang setara.
- Sesi yang diarsipkan tidak dicantumkan. Sesi lokal tersimpan atau tidak aktif hanya dapat
  diarsipkan setelah operator mengonfirmasi bahwa tidak ada klien Codex lain yang
  menggunakannya.

## Sebelum memulai

- Instal plugin resmi `@openclaw/codex` pada Gateway. Aplikasi OpenClaw
  macOS dapat menginstalnya saat Anda mengaktifkan fitur Codex; instalasi CLI dapat
  menjalankan `openclaw plugins install @openclaw/codex`.
- Instal dan masuk ke Codex Desktop atau Codex CLI pada setiap komputer yang
  sesinya ingin Anda cantumkan.
- Pasangkan komputer jarak jauh sebagai node OpenClaw. Setiap komputer harus ikut serta secara lokal;
  mengaktifkan pengawasan hanya pada Gateway tidak memberikan otorisasi kepada node lain.
- Gunakan Gateway yang dikendalikan pemilik. Judul sesi, direktori kerja, dan cabang Git
  dapat mengungkapkan informasi proyek yang sensitif.

## Aktifkan pengawasan

`openclaw onboard` terpandu dan penyiapan awal macOS mencoba menginstal dan
mengaktifkan pengawasan Codex setelah mendeteksi instalasi Codex native dan
berhasil mengaktifkan backend inferensi yang dipilih. Codex tidak harus menjadi
backend utama. Pengawasan tersedia saat aktivasi plugin oportunistis tersebut
berhasil. Ketersediaan App Server diperiksa saat pengawasan pertama kali
terhubung. Penonaktifan plugin Codex secara eksplisit atau pemblokiran kebijakan
mencegah aktivasi oportunistis, dan `supervision.enabled: false` eksplisit yang sudah ada
menonaktifkan alat pengawasan yang tersedia bagi agen; katalog
operator tetap terdaftar setiap kali plugin Codex aktif kecuali
`sessionCatalog.enabled: false` menonaktifkannya. Sakelar terpisah ini tidak mengubah
penyedia Codex, harness, maupun kebijakan pengawasan yang tersedia bagi agen,
sekaligus menghapus perintah pencantuman/pembacaan katalog node pasangan dari host ini.
Instalasi yang sudah ada dapat mengaktifkan kemampuan yang sama secara manual:

Aktifkan plugin `codex` dan kemampuan pengawasannya di `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Jika `plugins.allow` ada, sertakan `codex`. Mulai ulang Gateway setelah
mengubah aktivasi plugin.

Tanpa pengaturan koneksi `appServer` yang eksplisit, pengawasan menggunakan koneksi
pengawasan stdio terkelola yang terpisah terhadap home Codex pengguna native.
Harness Codex biasa tetap dicakup per agen secara default. Hal ini membuat sesi
native terlihat di kedua aplikasi tanpa membuat giliran OpenClaw biasa berbagi
status Codex native. Tetapkan `appServer.homeScope: "user"` secara eksplisit jika harness
juga harus berbagi status tersebut. Pengawasan mematuhi pengaturan koneksi
`appServer` yang eksplisit, bukan menggantinya dengan default home pengguna lokal.

Chat yang diadopsi dari grup bilah sisi **Codex** bukanlah sesi harness biasa.
Pengikatan pengawasan privatnya menggunakan koneksi pengawasan untuk pembacaan
sumber, pembuatan cabang kanonis, injeksi riwayat, dan setiap giliran berikutnya. Dengan
koneksi lokal default, hal tersebut mempertahankan home Codex pengguna native, autentikasi,
dan konfigurasi penyedia tanpa mengubah default untuk sesi lain.
Chat adopsi yang dipantau juga berpartisipasi dalam [kesadaran status sesi](/id/concepts/session-state).

Untuk koneksi pengawasan lokal default, penyimpanan dibagikan dengan klien
Codex native. OpenClaw tidak mengasumsikan bahwa klien lain berbagi proses App Server
langsung yang sama, dan kepemilikan status native bersifat lokal terhadap proses. Oleh karena itu,
thread yang dilaporkan App Server pengawasannya sebagai `notLoaded` diperlakukan sebagai
**Tersimpan / aktivitas tidak diketahui**, bukan sebagai tidak aktif.

Terapkan keikutsertaan yang sama pada setiap host node headless yang sesinya harus muncul.
Aplikasi OpenClaw macOS native membaca pengaturan lokal yang sama saat mengiklankan
katalog Codex-nya ke Gateway pasangan. Katalog Mac native pasangan tersebut hanya mendukung
`appServer.transport: "stdio"` default atau eksplisit dengan `appServer.homeScope: "user"` yang tidak ditetapkan atau
eksplisit. `command`, `args`, dan `clearEnv` dipatuhi untuk
proses stdio tersebut. Jika konfigurasi Mac memilih `"unix"`,
`"websocket"`, atau `homeScope: "agent"`, aplikasi tidak mengiklankan kemampuan
atau perintah katalog, dan pemanggilan langsung yang usang akan gagal alih-alih mengekspos
home Codex pengguna atau menjalankan App Server stdio lokal yang berbeda.

Perintah node yang baru diiklankan mengubah permukaan perintah node yang disetujui.
Setujui pembaruan dari host Gateway:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Sesi Codex yang tidak diarsipkan juga muncul di bilah sisi UI Kontrol utama, dikelompokkan
berdasarkan host. Pilih salah satunya untuk membaca transkrip tersimpannya. Penampil menggunakan API
`thread/turns/list` Codex terbaru dengan `itemsView: "full"` dan memuat paling banyak 20 giliran
per permintaan; **Muat item transkrip yang lebih lama** mengikuti kursor App Server opak dari halaman terbaru.
Halaman yang dimuat dirender dalam urutan kronologis. Penampil tidak pernah memuat riwayat
`thread/read` tanpa batas. Halaman di atas batas keamanan transportasi 20 MiB akan gagal
secara tertutup alih-alih membahayakan koneksi node atau Gateway.

Buka grup **Codex** di bilah sisi sesi biasa. Grup tersebut mencantumkan sesi yang sama
dan mengelompokkannya berdasarkan host. **Muat lebih banyak sesi** menambahkan halaman berikutnya dari setiap host yang
memiliki baris lebih lama, dan baris yang ditambahkan tersebut tetap tersedia selama penyegaran berkala bilah sisi.
Setiap host muncul segera setelah pencantuman native-nya sendiri selesai. Halaman yang terlihat
diselaraskan setelah perubahan konektivitas node, saat kembali mendapatkan fokus, dan paling lama
setiap 30 detik; hasil yang berubah mendapatkan pemeriksaan lanjutan yang lebih cepat. Karena itu, sesi yang dibuat
di Codex Desktop, CLI, atau klien native lain muncul tanpa
memuat ulang seluruh halaman. Halaman pertama mengikuti urutan paling baru diperbarui milik Codex,
sehingga sesi native yang baru dibuat langsung memenuhi syarat.
Setiap halaman pencarian yang dikembalikan memindai sejumlah terbatas halaman native per host,
alih-alih mengirim kueri ke App Server, karena pencarian native juga dapat mencocokkan
pratinjau transkrip.

Ketersediaan host dan status thread adalah hal yang terpisah. **Luring** atau **Tidak Tersedia**
menjelaskan penyegaran host; host yang tidak tersedia tidak mengembalikan baris sesi baru dan
tidak mengubah status native thread menjadi `offline`. Baris sesi menggunakan status Codex
seperti `idle`, `active`, `notLoaded`, atau kesalahan. Host yang gagal tidak
menyembunyikan hasil dari host yang sehat.

Peringatan bilah sisi mencakup kode kesalahan katalog dan kesalahan dasar
Gateway yang aman. Buka **Pengaturan > Otomatisasi > Plugin > Codex > Penemuan Sesi
Native** untuk menonaktifkan penemuan tanpa menonaktifkan Codex. Untuk
`NODE_LIST_FAILED`, bandingkan `openclaw nodes list` dan **Pengaturan > Perangkat**;
penyebab terperinci mengidentifikasi kegagalan penyimpanan pasangan, registri node, izin, atau
siklus hidup Gateway yang perlu diperbaiki.

## Gunakan CLI operator

CLI terminal mengekspos katalog sesi yang tidak diarsipkan serta tindakan cabang
dan arsip lokal Gateway yang sama:

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Opsi `openclaw codex sessions`:

- `--search <text>` mencari judul sesi tanpa membedakan huruf besar-kecil.
- `--host <id>` membatasi respons ke satu host katalog stabil, seperti
  `gateway:local` atau `node:<node-id>`.
- `--limit <count>` menetapkan 1 hingga 100 baris per host; defaultnya adalah 50.
- `--cursor <cursor>` melanjutkan satu halaman host sehingga memerlukan `--host`.
- `--json` mencetak respons Gateway terstruktur.

Ketiga perintah mewarisi `--url`, `--token`, dan `--timeout <ms>` dari
klien Gateway. Pencantuman sesi menggunakan default 75,000 ms agar katalog node pasangan
yang masih dingin dapat selesai; kelanjutan dan pengarsipan menggunakan default 30,000 ms. Perintah tersebut juga mengekspos
sakelar bersama `--expect-final`, yang tidak mengubah RPC pengawasan unary ini.
Setiap perintah memerlukan cakupan Gateway `operator.write`.
Output standar `-h, --help` tersedia pada setiap subperintah.
Tidak ada opsi diarsipkan atau sertakan-yang-dinarsipkan. `sessions` dapat mencantumkan host
pasangan, tetapi `continue` dan `archive` selalu menargetkan `gateway:local`; baris pasangan
hanya dapat dicantumkan. Pengarsipan selalu memerlukan `--confirm-no-other-runner`.

Perintah shell ini berbeda dari perintah runtime `/codex` di dalam chat.
`/codex threads [filter]` mencantumkan thread App Server yang tersedia bagi koneksi
percakapan saat ini. `/codex sessions --host <node>` mencantumkan berkas sesi Codex
CLI yang dapat dilanjutkan pada satu node, bukan katalog armada pengawasan. `/codex
resume` dan `/codex bind` melampirkan percakapan saat ini alih-alih membuat
cabang terawasi yang aman, dan Chat terawasi dengan model terkunci menolak
mutasi pengikatan tersebut. Tidak ada perintah runtime `/codex continue` atau `/codex archive`.

## Buat cabang dari sesi lokal

Pilih **Lanjutkan sebagai cabang** pada baris tersimpan atau tidak aktif dari komputer Gateway.
OpenClaw membuat entri Chat biasa, mencerminkan riwayat pengguna dan asisten yang dibatasi
hingga giliran tersimpan terminal terakhir milik sumber (selesai, diinterupsi, atau
gagal), mencatat cabang harness yang tertunda, dan membuka Chat. Pemilih model umum
dikunci, tetapi belum ada model atau penyedia konkret yang dipilih. Sumber
tidak dilanjutkan, dan thread harness kanonis belum dimulai.
Mengulangi tindakan tersebut akan membuka Chat yang ada alih-alih membuat
cabang lain.

Pencerminan mempertahankan bagian akhir terbaru yang terlihat dan memenuhi ketiga batas: paling banyak 200
pesan pengguna atau asisten, total 512 KiB teks UTF-8, dan 64 KiB per
pesan. Pesan yang terlalu besar dipotong dengan penanda, dan pesan lama
dihilangkan saat batas tercapai. Input gambar atau gambar lokal menjadi placeholder literal
`[Image attachment]`; data gambar dan jalur lokal tidak disalin.

Kirim pesan Chat normal pertama untuk mulai bekerja. Harness Codex memasang
handler persetujuan, elisitasi, peristiwa, dan pengiriman yang sebenarnya. Harness ini menggunakan fork
native sementara pada koneksi supervisi untuk menyematkan snapshot sumber tanpa
memberikan penggantian model atau penyedia. Codex App Server memilih keduanya dari
konfigurasi native saat ini dan mengembalikan pilihan aktual. Pada koneksi yang sama,
OpenClaw memulai thread harness penuh sumber-`appServer` kanonis
di bawah cwd dan kebijakan runtime-nya dengan tepat pasangan yang dikembalikan tersebut, menyuntikkan
riwayat terlihat yang dibatasi, dan mengarsipkan fork sementara. Thread kanonis
memiliki seluruh permukaan alat harness OpenClaw. Ini adalah cabang riwayat terlihat, bukan
klona rollout native penuh: penalaran sumber, panggilan alat, dan hasil alat
dihilangkan. Giliran ini dan setiap giliran berikutnya tetap berada pada koneksi Codex yang diawasi,
bukan pada runtime model OpenClaw lain atau harness agent-home biasa.

Pilihan yang dikembalikan bukanlah bukti model historis sumber. Jika
konfigurasi native saat ini berbeda dari model yang direkam untuk giliran terakhir
sumber, Codex mengeluarkan peringatan perbedaan model normalnya. OpenClaw menggunakan
pasangan yang dikembalikan untuk memulai thread kanonis. Codex mempertahankan
model dan penyedia native thread kanonis tersebut, dan pelanjutan berikutnya mempertahankannya karena
OpenClaw tidak menyertakan penggantian model dan penyedia. Jika thread kanonis diubah
melalui kontrol Codex native terpisah, OpenClaw menerima pilihan yang dipertahankan
Codex. OpenClaw tidak pernah menggantinya dengan model luarnya atau rantai fallback.

Chat terkunci-model yang diawasi tidak dapat dihapus, berganti model, menggunakan `/new`
atau `/reset`, memanggil tindakan pengaturan ulang sesi Gateway, atau menggunakan tindakan generik
**Fork sesi**. Memutasi `/codex model <model>`, `/codex
bind`, `/codex resume` (termasuk sesi node dengan `--bind here`), dan
`/codex detach` atau `/codex unbind` juga ditolak karena tindakan tersebut akan mengganti
atau menghapus pengikatan native yang terkunci. Kueri `/codex model` serta `/codex fast`,
`/codex permissions`, dan `/codex threads` tetap tersedia. Mulai
sesi biasa lain saat Anda menginginkan model berbeda atau thread baru.

Pertahankan supervisi tetap aktif untuk Chat ini. Jika supervisi dinonaktifkan atau
pengikatan koneksi tersimpannya menjadi tidak tersedia atau tidak konsisten, giliran akan gagal
secara tertutup alih-alih berpindah ke sesi agent-home biasa.

Menonaktifkan atau menghapus instalasi plugin `codex` tidak melepaskan kepemilikan tersebut atau
membuat Chat memenuhi syarat untuk model lain. Chat yang terkunci tetap dipertahankan tetapi
tidak tersedia; instal ulang atau aktifkan kembali plugin yang sama dan mulai ulang Gateway untuk
melanjutkannya. Perilaku gagal-tertutup yang disengaja ini mencegah pembersihan retensi atau
gangguan sementara plugin membuat pengikatan native menjadi yatim secara diam-diam.

Alat agen `codex_threads` mengikuti batas yang sama. Alat ini tidak dapat melampirkan
fork lain atau mengarsipkan thread native yang terikat pada Chat. Daftar dan pembacaan
khusus metadata tetap tersedia. Pembacaan transkrip mentah memerlukan `allowRawTranscripts`.
Saat akses mentah dinonaktifkan, `codex_threads` juga menolak pencarian daftar karena
pencarian native menyertakan pratinjau transkrip; Control UI dan CLI operator
tetap menyediakan pencarian terbatas berdasarkan judul saja. Penggantian nama, pembatalan arsip, fork terpisah, dan
pengarsipan thread tak terkait yang tidak dimiliki memerlukan
`allowWriteControls`. Tidak satu pun opsi melewati pengikatan terkunci.

OpenClaw tidak berlangganan atau menjawab permintaan persetujuan ketika hanya mencantumkan
thread sumber atau menampilkan Chat yang tertunda. Memulai thread harness kanonis tersendiri
pada giliran pertama memungkinkan proses Codex lain tetap memiliki sumber
tanpa menciptakan penulis rollout yang bersaing.

Sumber CLI, VS Code, Atlas, atau ChatGPT asli tetap terlihat oleh klien
native dan katalog OpenClaw. Cabang kanonis disimpan sebagai thread Codex
native, tetapi jenis sumbernya adalah `appServer`; Codex Desktop atau klien
native lain dapat memfilter jenis sumber tersebut, sehingga cabang itu sendiri tidak dijamin
muncul dalam setiap tampilan riwayat native.

Baris aktif yang dilaporkan oleh App Server OpenClaw tidak dapat memulai cabang baru. Tunggu
hingga giliran saat ini selesai dan segarkan katalog. Codex App Server
menserialkan mutasi dalam satu proses, tetapi tidak menyediakan runner eksklusif
lintas proses atau lease pemilik persetujuan.

Untuk baris **Tersimpan / aktivitas tidak diketahui**, cermin Chat dan penyematan snapshot giliran pertama
menggunakan status Codex hingga giliran persisten terminal terakhir. Thread sumber
tidak dilanjutkan, diinterupsi, atau diarsipkan. Jika proses lain memiliki
giliran yang sedang berlangsung, pekerjaan dalam proses terbarunya mungkin tidak terdapat dalam cabang.

## Arsipkan sesi lokal

Pilih **Arsipkan** pada baris lokal-Gateway yang tersimpan atau menganggur, lalu konfirmasikan bahwa tidak ada
klien Codex atau runner OpenClaw lain yang menggunakan thread tersebut atau turunan yang
dibuatnya. OpenClaw membaca status lokal-proses secara baru, melanjutkan hanya untuk
`idle` atau `notLoaded`, memanggil operasi arsip Codex native, dan menghapus
sesi dari daftar yang tidak diarsipkan. Codex native juga mencoba mengarsipkan
turunan yang dibuat thread tersebut.

Pengarsipan tidak tersedia ketika pembacaan baru melaporkan sesi aktif atau dalam
status kesalahan, ketika sesi tersebut milik node yang dipasangkan, atau ketika Chat
yang baru dibuat dan diawasi masih memiliki cabang tertunda dari sumber tersebut. Kirim pesan
pertama Chat untuk mewujudkan cabang kanonisnya sebelum mengarsipkan sumber.
Pengarsipan juga diblokir ketika OpenClaw mengetahui bahwa pengikatan aktif memiliki
thread target yang tepat atau turunan yang dibuat dan belum diarsipkan. OpenClaw mengikuti
kueri turunan Codex eksperimental melalui setiap halaman; respons yang tidak valid,
kegagalan permintaan, kursor atau thread berulang, atau habisnya batas keselamatan akan menolak
pengarsipan.

Permintaan pembacaan, enumerasi turunan, dan pengarsipan bukan satu operasi
bersyarat, sehingga giliran masih dapat dimulai di antara operasi tersebut. Status App Server juga
tidak dibagikan antarproses independen. Karena itu, konfirmasi merupakan
batas keselamatan untuk klien yang tidak diketahui dan kondisi balapan tersebut: keluar atau verifikasi
setiap klien lain sebelum mengonfirmasi. Pulihkan thread yang diarsipkan dengan Codex
Desktop, Codex CLI, atau alur pengelolaan thread native yang diotorisasi pemilik;
thread akan muncul kembali setelah arsip dibatalkan.

```bash
codex unarchive <thread-id>
```

## Pahami batas node yang dipasangkan

Node yang dipasangkan mengekspos perintah hanya-baca berversi
`codex.appServer.threads.list.v1` dan
`codex.appServer.thread.turns.list.v1`. Host node native dengan
Codex CLI yang tersedia juga mengekspos perintah `codex.terminal.resume.v1`
yang masuk daftar izin. Gateway menerima metadata
yang dinormalisasi dan halaman transkrip terbatas yang diminta secara eksplisit, tidak pernah endpoint App Server
mentah. Membuka baris di terminal operator menjalankan `codex resume <thread-id>`
pada host pemilik dan merelai PTY perintah tersebut; tindakan ini tidak mengekspos shell umum
atau argv yang disediakan gateway.

Relai terminal tidak menyediakan kontrak kelanjutan harness atau kepemilikan
arsip. Karena itu, baris jarak jauh tetap terlihat tetapi tidak menawarkan **Lanjutkan** atau
**Arsipkan**, bahkan ketika thread jarak jauh menganggur. Gunakan Codex pada komputer tersebut
melalui **Buka di terminal**, atau gunakan alur kelanjutan mendatang dengan batas
kepemilikan runner yang aman.

## Metadata dan izin

Baris katalog dapat menyertakan:

- pengidentifikasi thread dan sesi
- judul dan direktori kerja
- status saat ini dan flag tunggu aktif
- stempel waktu pembuatan, pembaruan, dan aktivitas
- sumber, penyedia model, versi Codex CLI, dan cabang Git

Proyeksi katalog mengecualikan pratinjau transkrip, giliran, jalur rollout,
jalur beranda Codex, remote Git, SHA commit, dan kesalahan App Server mentah. Akses katalog
dan pembacaan transkrip Control UI memerlukan cakupan Gateway `operator.write`
karena agregasi fleet menggunakan jalur standar `node.invoke`, meskipun
kedua perintah node hanya-baca.

`supervision.allowRawTranscripts` dan `supervision.allowWriteControls` mengatur
alat agen otonom dan MCP mandiri. Keduanya secara default bernilai `false`. Dengan
supervisi diaktifkan, `codex_threads` menghapus pratinjau transkrip dan giliran dari
hasil daftar dan pembacaan khusus metadata kecuali transkrip mentah diizinkan;
pembacaan yang menyertakan giliran gagal secara tertutup. Setiap fork, penggantian nama, pengarsipan, dan pembatalan arsip
memerlukan kontrol tulis. Opsi ini tidak membatasi penayangan transkrip Control UI
yang diautentikasi dan tidak melewati pemeriksaan pengikatan, host, status, atau konfirmasi.

### Alat kompatibilitas

Plugin resmi `codex` mempertahankan lima nama alat Supervisor yang telah dirilis untuk
klien agen dan MCP mandiri yang ada:

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` secara default hanya memuat yang telah dimuat; tidak ada parameter `loaded_only`.
Atur `include_stored: true` agar juga membaca baris tersimpan yang tidak diarsipkan dari
basis data status Codex. Batas opsional `max_stored_sessions` secara default adalah 200
dan menerima 1 hingga 1.000 baris per endpoint. Batas ini tidak membatasi baris yang dimuat.
Tanpa izin transkrip mentah, hasil daftar menghilangkan nama yang berasal dari transkrip,
pratinjau, dan kesalahan endpoint terperinci.
`codex_session_read` memerlukan `allowRawTranscripts`; `include_turns: true`
juga meminta giliran kepada Codex.

`codex_session_send` dan `codex_session_interrupt` memerlukan
`allowWriteControls`. Pengiriman menerima `mode: "auto" | "start" | "steer"`, tetapi
`"start"` selalu ditolak dan `"auto"` serta `"steer"` hanya dapat mengarahkan
giliran aktif yang dapat dibaca. Thread menganggur ditolak dengan panduan untuk menggunakan **Sesi
Codex**, tempat harness penuh memasang handler persetujuan dan alat sebelum
kelanjutan. Interupsi juga memerlukan giliran aktif yang dapat dibaca. Alat ini
tidak melanjutkan atau memulai thread sumber yang menganggur.

`openclaw doctor --fix` memindahkan entri `codex-supervisor` yang telah dihentikan, field endpoint
dan izinnya, serta referensi kebijakan izinkan/tolak plugin ke plugin resmi
`codex` tanpa menimpa pengaturan kanonis eksplisit. Adaptor MCP kompatibilitas
mandiri terus memuat lima alat yang sama dari plugin tersebut;
variabel lingkungan kebijakan lama hanya berlaku di dalam adaptor tepercaya tersebut.

Untuk setiap field konfigurasi supervisi, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference#supervision).

## Pemecahan masalah

**Tidak ada sesi yang muncul:** verifikasi bahwa `@openclaw/codex` terinstal, baik
plugin maupun `supervision.enabled` bernilai true, daftar izin plugin saat ini mengizinkan
`codex`, dan sesi tidak diarsipkan. Mulai ulang Gateway atau node setelah
mengubah aktivasi.

**Lanjutkan dinonaktifkan:** baris yang tidak dipetakan sedang aktif, milik node yang dipasangkan,
host-nya offline, atau tindakan lain sedang tertunda. Baris lokal-Gateway yang tersimpan dan menganggur
menawarkan **Lanjutkan sebagai cabang** alih-alih pengambilalihan thread persis yang tidak aman. Baris
yang sudah memiliki Chat yang diawasi menawarkan **Buka Chat**.

**Arsipkan dinonaktifkan:** pengarsipan tersedia untuk baris lokal-Gateway tersimpan/aktivitas-tidak-diketahui dan
menganggur setelah konfirmasi tidak-ada-runner-lain. Baris aktif, kesalahan,
offline, node-dipasangkan, cabang-tertunda, dan pemilik-pengikatan-persis yang diketahui tetap
hanya-baca untuk pengarsipan.

**Sesi yang diarsipkan menghilang:** ini sesuai harapan. Halaman supervisi tidak memiliki
tampilan arsip. Jalankan `codex unarchive <thread-id>` atau gunakan Codex Desktop untuk menampilkannya
kembali.

**Konfigurasi `codex-supervisor` lama tetap ada:** jalankan `openclaw doctor --fix`. Doctor
memindahkan entri plugin yang telah dihentikan dan referensi kebijakan plugin terkait ke
`plugins.entries.codex.config.supervision` tanpa menimpa pengaturan Codex
eksplisit.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Arsitektur supervisi Codex](/specs/codex-supervision)
- [Node](/id/nodes)
- [Keamanan Gateway](/id/gateway/security)
