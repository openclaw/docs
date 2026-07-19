---
read_when:
    - Merancang perilaku penemuan, kelanjutan, atau pengarsipan sesi Codex
    - Mengubah UI katalog sesi native atau RPC Gateway
    - Memperluas supervisi Codex di seluruh node yang dipasangkan
summary: Arsitektur dan batas produk untuk mengawasi sesi Codex native dari OpenClaw.
title: Supervisi Codex
x-i18n:
    generated_at: "2026-07-19T05:11:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e259badc8f7fdec6fa093785a1dd04394e12287ae61f00474bcd45e7b95352d
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Supervisi Codex

## Tujuan

Supervisi Codex memungkinkan operator OpenClaw menemukan sesi Codex native dan,
jika aman, membuat cabang lokal melalui antarmuka Chat OpenClaw biasa.
Codex App Server tetap menjadi pemilik thread dan loop model. OpenClaw menyediakan
katalog armada, UI operator terautentikasi, pengikatan sesi, dan pengiriman kanal.

Fitur ini merupakan bagian dari plugin resmi `codex`. Tidak ada
plugin Supervisor terpisah atau implementasi protokol Codex kedua.

## Batas produk

Katalog didaftarkan setiap kali plugin Codex aktif, kecuali penemuan sesi native
dinonaktifkan secara eksplisit dengan:

```text
plugins.entries.codex.config.sessionCatalog.enabled = false
```

Aktifkan alat supervisi yang dapat digunakan agen dengan:

```text
plugins.entries.codex.config.supervision.enabled = true
```

Produk awal yang aktif sengaja dibuat lebih terbatas daripada rencana armada
jangka panjang:

- Hanya mencantumkan thread Codex yang tidak diarsipkan.
- Mengelompokkan baris lokal dan node berpasangan yang ikut serta berdasarkan identitas host stabil.
- Membuat cabang Chat biasa yang modelnya dikunci dari thread tersimpan atau menganggur yang berada secara lokal di Gateway,
  memulai thread harness Codex lengkapnya pada giliran pertama, atau membuka Chat
  yang dibuat untuk cabang sebelumnya.
- Mengarsipkan thread tersimpan atau menganggur yang berada secara lokal di Gateway hanya setelah
  konfirmasi eksplisit bahwa tidak ada runner lain.
- Menampilkan sumber lokal aktif tanpa kontrol cabang baru atau pengarsipan, sembari tetap
  memungkinkan Chat tersupervisi yang sudah ada untuk dibuka.
- Menampilkan baris terbaru per host di bilah sisi utama, mempertahankan katalog lengkap di
  halaman sesi, dan menyediakan pembacaan transkrip berbatas dengan paginasi kursor untuk
  baris lokal dan node berpasangan.
- Mengisolasi kegagalan katalog berdasarkan host.

Katalog adalah kumpulan yang tidak diarsipkan. Baris di dalamnya masih dapat memiliki
status giliran menganggur, aktif, `notLoaded`, atau galat.

Supervisi yang dapat digunakan agen tetap bersifat pilihan. Onboarding terpandu mencoba memasang dan mengaktifkannya
setelah deteksi instalasi Codex native berhasil dan backend inferensi yang dipilih
lulus pemeriksaan langsungnya, terlepas dari backend utama yang
dipilih pengguna. Supervisi hanya aktif ketika penyiapan plugin oportunistis tersebut
berhasil. Plugin yang dinonaktifkan secara eksplisit, pemblokiran kebijakan, atau
`supervision.enabled: false` tetap menjadi otoritas bagi alat supervisi, tetapi
tidak menonaktifkan katalog sesi operator. `sessionCatalog.enabled: false`
menonaktifkan penemuan operator dan perintah katalog node berpasangan; penyedia dan
harness Codex tetap aktif.

## Kepemilikan

Plugin `codex` memiliki seluruh perilaku Codex App Server:

- penemuan endpoint dan siklus hidup koneksi
- inisialisasi protokol dan pemeriksaan versi
- pencantuman, pembacaan, pelanjutan, pengarsipan, dan penanganan peristiwa thread
- jembatan persetujuan dan masukan pengguna
- pengikatan thread native ke sesi OpenClaw
- pemberlakuan model dan harness khusus Codex setelah pelanjutan

Control UI dan Gateway menggunakan layanan milik plugin tersebut. Keduanya tidak membaca
file rollout Codex secara langsung dan tidak mengimplementasikan klien App Server lain.

Topologi lokal default adalah:

```text
Codex Desktop -> App Server stdio privat -> home Codex pengguna
                                             ^
Plugin Codex OpenClaw -> koneksi App Server supervisi
  (secara default menggunakan stdio home pengguna terkelola; pengaturan appServer eksplisit dipatuhi)
  -> katalog sumber pasif dan pembacaan
  -> sematkan snapshot -> cabang sumber appServer kanonis
  -> injeksi riwayat yang terlihat dan setiap giliran Chat tersupervisi berikutnya

Sesi Codex OpenClaw biasa -> stdio home agen terkelola secara default
  -> thread harness lengkap biasa -> Chat OpenClaw dan pengiriman kanal
```

Mengaktifkan supervisi tidak mengubah harness Codex biasa: harness tersebut tetap
dicakup per agen secara default. Koneksi supervisi terpisah secara default
menggunakan stdio home pengguna terkelola, sehingga operasi katalog dan snapshot-nya melihat thread
native yang tersimpan. Pengaturan koneksi `appServer` yang eksplisit dipatuhi. Ketika
`homeScope` tidak ditetapkan, koneksi supervisi menetapkannya menjadi `"user"` untuk stdio
atau Unix dan `"agent"` untuk WebSocket. Tetapkan `appServer.homeScope: "user"`
secara eksplisit hanya ketika harness biasa juga harus berbagi home Codex
native. Chat yang diadopsi dari grup bilah sisi Codex merupakan pengecualian: pengikatan
supervisi privatnya mempertahankan pembacaan sumber, pembuatan cabang kanonis, dan giliran
berikutnya pada koneksi supervisi. Status langsung dan kepemilikan tetap
bersifat lokal proses; thread yang tidak diketahui oleh proses supervisi OpenClaw adalah `notLoaded`
meskipun Codex Desktop sedang aktif menjalankannya.

Codex memiliki daemon lokal kanonis eksperimental dengan kontrak bootstrap terpisah
yang dikelola penginstal. Fitur ini tidak boleh secara implisit melakukan bootstrap,
mengklaim, atau mengasumsikan daemon tersebut.

## Alur katalog

Metode Gateway generik `sessions.catalog.list` meneruskan permintaan ke penyedia katalog `codex`,
yang selalu meminta `archived: false` dan membiarkan App Server
menerapkan default sumber interaktifnya: `cli`, `vscode`, Atlas, dan ChatGPT. Metode ini
menggabungkan:

1. Hasil `thread/list` yang berada secara lokal di Gateway dari App Server supervisi,
   yang secara default menggunakan stdio home pengguna terkelola.
2. Hasil `codex.appServer.threads.list.v1` dari setiap node terhubung yang ikut serta.

Pemilihan transkrip menggunakan `thread/turns/list` dengan `itemsView: "full"` secara lokal atau
perintah `codex.appServer.thread.turns.list.v1` berversi pada node yang dipilih.
Setiap respons berisi paling banyak 20 giliran tersimpan beserta kursor maju/mundur
opak. Control UI meminta halaman dari yang terbaru, merender setiap halaman dalam
urutan kronologis, dan menambahkan halaman lama di awal. Control UI tidak pernah beralih ke
`thread/read` tanpa batas. OpenClaw juga menolak setiap halaman item terserialisasi di atas
20 MiB sebelum dapat melintasi transport node atau Gateway.

Implementasi node berpasangan macOS native hanya mendukung nilai yang tidak ditetapkan/default atau
`appServer.transport: "stdio"` eksplisit dengan cakupan supervisi yang tidak ditetapkan/default atau
`appServer.homeScope: "user"` eksplisit. Implementasi ini meneruskan `command`, `args` yang dikonfigurasi,
dan `clearEnv` yang dinormalisasi ke proses turunan. Dengan `"unix"`, `"websocket"`,
atau `homeScope: "agent"` eksplisit, implementasi ini tidak mengiklankan kemampuan katalog
maupun perintahnya; pemanggilan langsung juga gagal secara tertutup. Implementasi ini tidak boleh mengekspos home
Codex pengguna untuk konfigurasi yang dicakup per agen atau mengganti endpoint eksplisit
dengan stdio lokal.

Proyeksi katalog menormalisasi pengidentifikasi, judul, cwd, status, flag tunggu aktif,
stempel waktu, sumber, penyedia model, versi Codex, dan cabang Git. Proyeksi ini
tidak mengembalikan pratinjau transkrip, giliran, jalur rollout, jalur home Codex,
remote Git, SHA commit, endpoint mentah, atau galat App Server mentah. Respons transkrip
hanya berisi halaman item App Server yang diminta secara eksplisit dan kursor
opaknya.

Kegagalan host tetap terbatas pada hasil masing-masing host. Node luring atau App Server
lokal yang tidak tersedia tidak menghapus host sehat dari halaman. Konektivitas adalah
properti host, bukan status thread: hasil host yang gagal tidak berisi
baris sesi baru dan tidak memproyeksikan `offline` ke thread native.

Control UI meminta pembaruan katalog progresif. Setiap host lokal atau berpasangan
muncul ketika pencantuman App Server miliknya selesai; respons agregat tetap menjadi
snapshot kompatibilitas dan pemulihan. Halaman yang terlihat direkonsiliasi setelah
perubahan konektivitas, saat memperoleh fokus, dan paling sering setiap 30 detik, dengan lintasan lebih cepat
setelah perubahan. Oleh karena itu, sesi Codex native yang dibuat di klien lain
pada akhirnya ditemukan tanpa mengimpornya ke penyimpanan OpenClaw.

Penemuan katalog bersifat pasif. Pencantuman atau pembacaan metadata tidak boleh memanggil
`thread/resume`, membuat klien OpenClaw berlangganan permintaan thread langsung, atau
menjawab persetujuan.

Pencarian hanya berdasarkan judul dan tidak peka huruf besar-kecil. Untuk setiap halaman katalog yang dikembalikan,
Gateway dan Mac berpasangan memindai sejumlah halaman native yang dibatasi tanpa meneruskan
kueri ke App Server, karena pencarian native juga dapat mencocokkan pratinjau transkrip.
Kursor native yang dikembalikan memungkinkan pemanggil melanjutkan pemindaian.

## Batas CLI operator

Plugin mendaftarkan tiga perintah shell yang didukung Gateway:

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` adalah `--url <url>`, `--token <token>`, `--timeout <ms>`, dan
opsi `--expect-final` yang diwariskan. Pencantuman sesi secara default memiliki batas waktu 75,000 ms;
pelanjutan dan pengarsipan secara default memiliki batas waktu 30,000 ms;
`--expect-final` tidak memiliki efek tambahan untuk RPC unary ini. Pencarian sesi
hanya berdasarkan judul dan tidak peka huruf besar-kecil; setiap respons memindai rantai halaman native
yang dibatasi, dan `--cursor` melanjutkan hasil yang lebih lama. Batasnya secara default adalah 50 per host
dan menerima 1 hingga 100, dan sebuah kursor memerlukan satu tujuan `--host`
yang stabil. Tidak ada perintah yang menerima opsi
diarsipkan/sertakan-yang-diarsipkan. Hanya `sessions` yang dapat menargetkan host berpasangan;
`continue` dan `archive` selalu mengirim `hostId: "gateway:local"`, dan pengarsipan
memerlukan flag konfirmasi eksplisit.

Namespace shell bukan namespace runtime `/codex` dalam Chat. Secara
khusus, `/codex sessions --host <node>` mencantumkan file sesi CLI Codex pada satu
node, `/codex threads` mencantumkan thread App Server untuk koneksi percakapan
saat ini, dan `/codex resume` atau `/codex bind` mengubah pengikatan percakapan tersebut.
Perintah tersebut tidak menggantikan `sessions.catalog.continue`, dan tidak ada
perintah runtime `/codex continue` atau `/codex archive`.

## Pelanjutan lokal

Untuk baris tersimpan atau menganggur yang berada secara lokal di Gateway, UI memanggil
`sessions.catalog.continue` dengan `catalogId: "codex"` beserta id host dan thread.
Plugin:

1. Menggunakan kembali Chat tersupervisi yang sudah ada jika sumber telah memilikinya.
2. Jika tidak, memproyeksikan riwayat pengguna dan asisten yang dibatasi hingga giliran tersimpan terminal
   terakhir sumber (selesai, terinterupsi, atau gagal) ke Chat OpenClaw baru
   dan mencatat cabang harness yang tertunda.
3. Menyimpan kebijakan penguncian model khusus Codex yang tertunda, bukan model konkret atau
   pilihan penyedia, beserta cakupan koneksi supervisi privat, dan
   mengembalikan `sessionKey` OpenClaw.

Proyeksi riwayat memilih ekor terbaru dari pesan pengguna dan asisten yang terlihat,
dengan batas ketat 200 pesan, total teks UTF-8 sebesar 512 KiB, dan
64 KiB per pesan. Proyeksi ini mengganti masukan gambar dan gambar lokal dengan
`[Image attachment]`, tidak pernah menyalin payload atau jalur gambar, serta menghilangkan penalaran,
pemanggilan alat, dan hasil alat.

UI membuka Chat biasa dengan kunci sesi tersebut. Belum ada thread harness
kanonis. Pada giliran Chat biasa pertama, harness memasang pengendali persetujuan,
elisitasi, peristiwa, dan pengiriman Codex yang sebenarnya, lalu:

1. Menggunakan koneksi supervisi untuk memanggil `thread/fork` native tanpa penggantian model
   atau penyedia dan menyematkan snapshot sumber tersimpan. Status `ConfigManager`
   Codex saat ini memilih model dan penyedia, dan respons fork
   melaporkan pasangan sebenarnya. Jika model berbeda dari model terakhir yang dicatat
   dalam sumber, Codex memancarkan peringatan perbedaan model normalnya.
2. Pada koneksi yang sama, memulai thread harness Codex lengkap kanonis dengan
   `threadSource: "appServer"`, cwd, kebijakan, konfigurasi, lingkungan OpenClaw,
   seluruh permukaan alat harness OpenClaw, serta persis model dan penyedia
   yang dikembalikan oleh fork untuk permulaan awal ini.
3. Menginjeksikan riwayat pengguna dan asisten yang terlihat dan dibatasi melalui koneksi
   tersebut, melakukan commit pengikatan kanonis tanpa menghapus cakupan supervisinya,
   menjalankan giliran, dan mengarsipkan fork sementara.

Sebelum giliran pertama, Chat merupakan cabang tertunda yang terkunci dengan
cerminan riwayat yang terlihat; setelah itu, setiap giliran model berjalan melalui thread
harness Codex kanonis pada koneksi supervisi. Cabang tersebut bukan klona rollout native
yang lengkap: penalaran sumber, panggilan alat, dan hasil alat sengaja
dihilangkan. Jika penyematan snapshot atau pembuatan thread kanonis gagal, cabang
tertunda tetap dapat dicoba ulang. Kondisi balapan pengikatan, supervisi yang dinonaktifkan, atau koneksi
supervisi yang tidak tersedia atau tidak cocok akan gagal secara tertutup sebelum giliran berjalan,
alih-alih beralih ke harness agent-home biasa.

Hal ini menjamin pemilihan yang dimiliki Codex, bukan mempertahankan model
historis sumber. Pasangan yang dikembalikan fork digunakan untuk memulai thread
kanonis, dan Codex mempertahankan model serta penyedia native thread tersebut. Kelanjutan berikutnya
menghilangkan penggantian model dan penyedia OpenClaw, sehingga Codex memulihkan pasangan yang dipertahankan.
Jika kontrol native Codex terpisah mengubah thread kanonis, OpenClaw menerima
pemilihan native yang dipertahankan tersebut. Model OpenClaw luar dan rantai fallback
tidak pernah menggantikannya.

Perubahan model, penghapusan sesi, serta operasi reset/buat baru sesi gagal secara tertutup
untuk Chat terkunci-model yang diawasi. Mengubah `/codex model <model>`, `/codex
bind`, `/codex resume` (termasuk node `--bind here`), dan `/codex detach` atau
`/codex unbind` juga gagal secara tertutup karena tindakan tersebut mengganti atau menghapus pengikatan. Kueri
`/codex model` serta `/codex fast`, `/codex permissions`, dan `/codex
threads` tetap tersedia. Alat agen `codex_threads` tidak dapat melampirkan fork baru
atau mengarsipkan thread native yang terikat. Pembacaan daftar dan metadata saja tetap
tersedia; bidang transkrip memerlukan `supervision.allowRawTranscripts`, sedangkan
penggantian nama, pembatalan pengarsipan, fork terlepas, dan pengarsipan thread yang tidak terkait memerlukan
`supervision.allowWriteControls`. Tidak satu pun opsi dapat mengganti pengikatan yang terkunci.
Menghapus atau mereset entri OpenClaw sebaliknya akan membuang pengikatan native
dan membuat atau mengizinkan thread generik di balik sesi yang tampak seperti Codex.
Oleh karena itu, pemeliharaan retensi mempertahankan entri terkunci-model meskipun entri tersebut
melampaui batas usia, jumlah, atau anggaran disk biasa. Menonaktifkan atau menghapus instalasi
plugin pemilik juga mempertahankan kunci dan penanda kepemilikan plugin. Chat tetap
tidak tersedia dan gagal secara tertutup hingga plugin yang sama diaktifkan kembali; pembersihan tidak pernah
mengubahnya menjadi sesi model biasa.

Sumber tidak pernah dilanjutkan atau diubah oleh tindakan ini. Fork sementara menyematkan
snapshot; fork tersebut bukan thread kelanjutan permanen. Memulai thread harness
kanonis yang berbeda pada giliran pertama mencegah OpenClaw menjadi penulis sumber
yang bersaing hanya karena status lokal-proses gagal melihat giliran yang dimiliki
Desktop. Cerminan riwayat yang terlihat dan snapshot yang disematkan dapat menghilangkan pekerjaan
yang belum selesai dalam sumber aktif. Sumber CLI, VS Code,
Atlas, atau ChatGPT asli tetap memenuhi syarat untuk katalog native maupun OpenClaw.
Cabang kanonis tetap merupakan thread native Codex dalam penyimpanan supervisi,
tetapi klien native dapat memfilter jenis sumber `appServer` miliknya, sehingga visibilitas Codex Desktop
bukanlah suatu kontrak.

## Perilaku pengarsipan

Untuk baris lokal-Gateway yang tersimpan atau menganggur, `sessions.catalog.archive` dengan
`catalogId: "codex"` memerlukan
`confirmNoOtherRunner: true` secara eksplisit, membaca ulang status lokal-proses saat ini,
hanya melanjutkan untuk `idle` atau `notLoaded`, memanggil `thread/archive` native,
dan mengembalikan keberhasilan hanya setelah Codex menerima operasi tersebut. Baris tersebut kemudian keluar
dari katalog yang tidak diarsipkan.

Status aktif atau kesalahan dari pembacaan baru akan menolak pengarsipan. Begitu pula dengan
cabang diawasi yang sedang diinisialisasi atau tertunda dari sumber: giliran Chat pertama
harus mewujudkan cabang kanonisnya sebelum sumber dapat diarsipkan. Pemilik
pengikatan OpenClaw aktif yang diketahui untuk target yang sama persis atau turunan hasil spawn
yang tidak diarsipkan juga akan menolak pengarsipan. OpenClaw memaginasi relasi eksperimental
`thread/list ancestorThreadId` milik Codex dan gagal secara tertutup jika terjadi kesalahan permintaan atau
respons, siklus kursor atau thread, serta habisnya batas keselamatan. Pengarsipan native dapat
mematikan pekerjaan induk dan turunan yang dimuat, sehingga pengarsipan bukan pintasan
interupsi. Panggilan pembacaan, enumerasi turunan, dan pengarsipan tidak bersifat atomik.
Klien independen masih dapat memiliki atau memulai pekerjaan pada baris yang tampak menganggur atau
`notLoaded` secara lokal. Konfirmasi tidak-ada-runner-lain mencakup klien yang tidak diketahui dan
kondisi balapan tersebut hingga Codex memiliki pengarsipan bersyarat atau sewa lintas-proses.
Pengarsipan node berpasangan dilarang.

Tidak ada tampilan terarsip dalam katalog Codex. Thread yang dipulihkan dengan
`thread/unarchive` pada permukaan Codex lain yang diotorisasi pemilik kembali memenuhi syarat
untuk katalog yang tidak diarsipkan.

## Keamanan thread aktif

Codex menserialkan perubahan pada suatu thread di antara klien dari satu App Server, tetapi
tidak menyediakan runner lintas-proses eksklusif atau sewa pemilik persetujuan.
App Server stdio independen dapat menambahkan data ke rollout yang sama, sementara masing-masing hanya melihat
status dalam memorinya sendiri. Permintaan persetujuan juga dapat mencapai setiap pelanggan
dari satu server, dengan respons valid pertama menyelesaikan permintaan tersebut.

Oleh karena itu:

- klien katalog pasif tidak berlangganan atau otomatis menolak persetujuan
- baris yang saat ini dilaporkan aktif tidak menampilkan cabang baru maupun Arsip
- sumber yang belum dipetakan menjadi cabang riwayat-terlihat yang thread harness
  kanonisnya tidak pernah melanjutkan sumber
- `notLoaded` ditampilkan sebagai aktivitas tidak diketahui dan hanya dapat diarsipkan setelah
  konfirmasi tidak-ada-runner-lain yang disadari sepenuhnya
- pengarsipan lokal memerlukan konfirmasi tersebut ditambah pembacaan baru `idle` atau `notLoaded`,
  sembari mengakui kondisi balapan protokol antara pembacaan dan pengarsipan

Interupsi dan serah terima multiklien merupakan keputusan produk di masa mendatang. Hal tersebut tidak
tersirat hanya karena baris aktif ditampilkan.

## Batas node berpasangan

Pemanggilan Node saat ini hanya bersifat permintaan/respons. Pemanggilan tersebut dapat dengan aman mengembalikan
metadata katalog berbatas dan halaman giliran transkrip, tetapi tidak dapat membawa aliran peristiwa berumur panjang, permintaan
persetujuan, panggilan alat, pembatalan, dan delta asisten yang diperlukan oleh proses
harness Codex.

Oleh karena itu, kontrak node mendukung daftar dan halaman giliran transkrip. Baris jarak jauh
tetap dapat dibaca, tetapi **Lanjutkan** dan **Arsipkan** tidak tersedia, apa pun status menganggurnya. Kelanjutan
jarak jauh yang sebenarnya memerlukan runner sisi-node dan jembatan streaming yang
mempertahankan invarian persetujuan dan pengikatan yang sama seperti harness lokal.

## Izin

Setiap komputer ikut serta secara lokal. Mengaktifkan Gateway tidak mengotorisasi node lain
untuk membaca metadata Codex-nya. Kemampuan node harus melewati pemasangan berpasangan
dan persetujuan kebijakan perintah normal.

Pencantuman armada dan penayangan transkrip menggunakan cakupan Gateway `operator.write`
karena keduanya memanggil node berpasangan. Kelanjutan dan pengarsipan lokal merupakan
tindakan operator yang diautentikasi dan tetap tunduk pada pemeriksaan host serta status.

Akses agen otonom dan MCP mandiri bersifat terpisah. Kontrak alat
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send`, dan `codex_session_interrupt` yang dirilis tetap dimiliki
oleh plugin `codex`. Dengan supervisi diaktifkan, pembacaan transkrip mentah `codex_threads`
dan bidang daftar yang berasal dari transkrip juga memerlukan
`supervision.allowRawTranscripts`; setiap fork, penggantian nama, pengarsipan,
atau pembatalan pengarsipan `codex_threads` memerlukan `supervision.allowWriteControls`. Kedua kebijakan secara default
dinonaktifkan.

## Kompatibilitas

`openclaw doctor --fix` memigrasikan konfigurasi `plugins.entries.codex-supervisor`
yang dirilis, termasuk endpoint serta kebijakan transkrip/penulisan, ditambah referensi
izinkan/tolak plugin ke
`plugins.entries.codex.config.supervision`. Nilai tujuan kanonis yang eksplisit
memenangkan konflik. Kode runtime hanya menggunakan bentuk plugin `codex` kanonis
setelah migrasi.

Plugin resmi mempertahankan tepat lima alat kompatibilitas Supervisor:
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send`, dan `codex_session_interrupt`. Daftar sesi secara default hanya
memuat yang telah dimuat; tidak ada parameter `loaded_only`. `include_stored: true` menambahkan
baris basis data status yang tidak diarsipkan, dibatasi per endpoint oleh `max_stored_sessions`
(default 200, rentang yang diterima 1 hingga 1,000); baris yang dimuat tidak dibatasi oleh
pengaturan tersebut. Bidang dan pembacaan yang berasal dari transkrip tetap dibatasi oleh
`allowRawTranscripts`; pengiriman dan interupsi tetap dibatasi oleh `allowWriteControls`.

Pengiriman kompatibilitas tidak pernah memulai atau melanjutkan thread yang menganggur. `mode: "start"` selalu
ditolak; `"auto"` dan `"steer"` hanya mengarahkan giliran aktif yang dapat dibaca.
Interupsi juga memerlukan giliran aktif yang dapat dibaca. Kelanjutan saat menganggur diarahkan
ke katalog native Codex agar harness lengkap memiliki persetujuan, alat, dan pengikatan.
Adaptor MCP lama mandiri menyelesaikan alat yang sama ini dari plugin resmi
dan merupakan satu-satunya jalur yang mematuhi variabel lingkungan kebijakan lama yang dipertahankan.

UI katalog bulan Juli, metode Gateway, kemampuan node, dan pendaftaran CLI belum
dirilis dengan id plugin lama. Semuanya berpindah langsung ke kepemilikan `codex`
tanpa facade runtime kedua.

## Pekerjaan mendatang

- runner streaming sisi-node dan jembatan peristiwa untuk kelanjutan jarak jauh
- sewa runner dan pemilik persetujuan eksplisit untuk serah terima klien secara simultan
- pengarsipan jarak jauh setelah tersedia sewa kepemilikan runner atau pembatasan setara
- interupsi dan pengamatan sesi aktif yang lebih lengkap
- serah terima yang diaudit antara Codex Desktop, CLI, dan OpenClaw

Penelusuran arsip bukan bagian dari bilah sisi supervisi yang direncanakan. Permukaan
native Codex tetap menjadi jalur pemulihan untuk thread yang diarsipkan.

## Pengujian penerimaan

- Mengaktifkan supervisi akan mencantumkan sesi lokal yang tidak diarsipkan.
- Sesi yang diarsipkan tidak pernah muncul dalam respons katalog atau UI.
- Host yang sehat tetap terlihat saat host lain gagal; host yang tidak tersedia
  tidak mengembalikan baris baru alih-alih mengarang status sesi luring.
- Baris lokal yang tersimpan atau menganggur membuat cerminan Chat dengan penguncian
  model/runtime khusus Codex; giliran pertama menyematkan snapshot sementara dan memulai
  thread harness lengkap kanonis, dan mengulangi Continue akan membuka Chat yang ada.
- Giliran pertama menghilangkan penggantian model/penyedia pada fork snapshot dan menyematkan
  awal kanonis ke pasangan persis yang dikembalikan oleh Codex, bahkan ketika Codex memperingatkan
  bahwa modelnya saat ini berbeda dari model terakhir yang tercatat pada sumber.
- Binding yang diawasi, baik tertunda maupun telah dikomit, menggunakan koneksi supervisi untuk
  akses sumber, pembuatan cabang kanonis, dan setiap giliran berikutnya; sesi
  Codex biasa tetap tercakup pada agen.
- Pelanjutan berikutnya menghilangkan penggantian model/penyedia OpenClaw, mempertahankan
  pilihan tersimpan kanonis Codex, menerima perubahan native terpisah pada thread tersebut,
  dan tidak pernah menggantinya dengan model OpenClaw luar atau rantai fallback.
- Menonaktifkan supervisi atau kehilangan siklus hidup binding/koneksi akan gagal secara tertutup
  alih-alih memindahkan Chat ke harness agent-home biasa.
- Chat terkunci-model yang diawasi tidak dapat dihapus selama melindungi binding
  native.
- Chat mencerminkan paling banyak 200 pesan pengguna dan asisten, total 512 KiB, dan
  64 KiB per pesan. Gambar menjadi placeholder; penalaran sumber, panggilan alat,
  hasil alat, payload gambar, dan jalur lokal tidak dikloning.
- Alur cabang tidak pernah melanjutkan thread sumber.
- Sumber asli tetap memenuhi syarat untuk kedua katalog. Cabang native kanonis
  menggunakan jenis sumber `appServer` dan tidak dijamin muncul di
  Codex Desktop.
- Sumber lokal yang aktif tidak dapat membuat cabang atau diarsipkan; Chat
  yang diawasi dan sudah ada tetap dapat dibuka.
- Baris dengan aktivitas yang tidak diketahui dapat membuat cabang tanpa konfirmasi; pengarsipan memerlukan
  konfirmasi eksplisit bahwa tidak ada runner lain.
- Sumber dengan cabang yang diawasi dalam tahap inisialisasi atau tertunda tidak dapat diarsipkan
  hingga giliran Chat pertama mewujudkan cabang kanonis.
- Pemilik binding aktif yang diketahui untuk target persis atau turunan yang dibuat dan belum diarsipkan
  akan memblokir pengarsipan; kegagalan enumerasi turunan akan gagal secara tertutup, dan
  konfirmasi eksplisit tetap bertanggung jawab atas klien yang tidak diketahui serta
  kondisi balapan dari status ke pengarsipan.
- Pengarsipan lokal tersimpan atau menganggur yang dikonfirmasi menghapus baris setelah operasi native berhasil.
- Baris node berpasangan tetap terlihat tanpa Continue atau Archive.
- Pencantuman pasif tidak pernah berlangganan atau menjawab persetujuan thread.
- Konfigurasi Supervisor lama dimigrasikan ke bentuk konfigurasi Codex kanonis.
- Daftar lama secara default hanya dimuat, enumerasi tersimpan mematuhi batas per endpoint,
  dan pengiriman kompatibilitas tidak pernah memulai atau melanjutkan thread yang menganggur.
