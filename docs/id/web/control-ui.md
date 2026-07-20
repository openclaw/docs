---
read_when:
    - Anda ingin mengoperasikan Gateway dari peramban
    - Anda menginginkan akses Tailnet tanpa terowongan SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, aktivitas, node, konfigurasi)
title: Antarmuka Kontrol
x-i18n:
    generated_at: "2026-07-20T14:09:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb2f4c0d470b376d519d333bdf00b89cf726b93d696eb397609fa3af2d3d56e4
    source_path: web/control-ui.md
    workflow: 16
---

Control UI adalah aplikasi satu halaman kecil berbasis **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- awalan opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

Aplikasi ini berkomunikasi **langsung dengan WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/)).

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

<Note>
Pada pengikatan LAN Windows native, Windows Firewall atau Group Policy yang dikelola organisasi masih dapat memblokir URL LAN yang diumumkan meskipun `127.0.0.1` berfungsi pada host Gateway. Jalankan `openclaw gateway status --deep` pada host Windows; perintah ini melaporkan port yang kemungkinan diblokir, ketidakcocokan profil, dan aturan firewall lokal yang mungkin diabaikan oleh kebijakan.
</Note>

Autentikasi diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas proksi tepercaya saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipertahankan. Onboarding biasanya menghasilkan token gateway untuk autentikasi rahasia bersama saat koneksi pertama, tetapi autentikasi kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pemasangan perangkat (koneksi pertama)

Menghubungkan dari browser atau perangkat baru biasanya memerlukan **persetujuan pemasangan satu kali**, yang ditampilkan sebagai `disconnected (1008): pairing required`.

<Steps>
  <Step title="Cantumkan permintaan yang tertunda">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Setujui berdasarkan ID permintaan">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jika browser mencoba ulang pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat; jalankan kembali `openclaw devices list` sebelum menyetujuinya.

Mengalihkan browser yang sudah dipasangkan dari akses baca ke akses tulis/admin diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam: OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang dengan akses yang lebih luas, dan meminta Anda menyetujui kumpulan cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi token, pencabutan, dan alur persetujuan penggunaan pertama Paperclip / `openclaw_gateway`.

<Note>
- Koneksi browser loopback lokal langsung (`127.0.0.1` / `localhost`) disetujui secara otomatis.
- Tailscale Serve dapat melewati proses bolak-balik pemasangan untuk sesi operator Control UI saat `gateway.auth.allowTailscale: true`, identitas Tailscale berhasil diverifikasi, dan browser menyajikan identitas perangkatnya. Browser tanpa identitas perangkat dan koneksi dengan peran node tetap mengikuti pemeriksaan perangkat normal.
- Pengikatan Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga beralih browser atau menghapus data browser memerlukan pemasangan ulang.

</Note>

## Pasangkan perangkat seluler

Administrator yang sudah dipasangkan dapat membuat QR koneksi iOS/Android tanpa membuka terminal:

<Steps>
  <Step title="Buka pemasangan perangkat seluler">
    Pilih **Devices**, lalu klik **Pair mobile device** di kartu **Devices**.
  </Step>
  <Step title="Hubungkan ponsel">
    Di aplikasi seluler OpenClaw, buka **Settings** → **Gateway** dan pindai kode QR. Sebagai gantinya, Anda dapat menyalin dan menempelkan kode penyiapan.
  </Step>
  <Step title="Konfirmasikan koneksi">
    Aplikasi resmi iOS/Android terhubung secara otomatis. Jika **Pending approval** menampilkan permintaan, tinjau peran dan cakupannya sebelum menyetujuinya.
  </Step>
</Steps>

Pembuatan kode penyiapan memerlukan `operator.admin`; tombol dinonaktifkan untuk sesi yang tidak memilikinya. Kode penyiapan berisi kredensial bootstrap berumur pendek, jadi perlakukan QR dan kode yang disalin seperti kata sandi selama masih berlaku. Untuk pemasangan jarak jauh, Gateway harus di-resolve menjadi `wss://` (misalnya melalui Tailscale Serve/Funnel); `ws://` biasa dibatasi untuk loopback dan alamat LAN privat. Lihat [Pemasangan](/id/channels/pairing#pair-from-the-control-ui-recommended) untuk detail lengkap tentang keamanan dan fallback.

## Identitas pribadi (lokal browser)

Control UI mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, terbatas pada profil browser saat ini, serta tidak disinkronkan ke perangkat lain atau dipertahankan di sisi server selain metadata kepengarangan transkrip normal pada pesan yang Anda kirim. Menghapus data situs atau beralih browser akan mengosongkannya kembali.

Pengesampingan avatar asisten mengikuti pola lokal browser yang sama: pengesampingan yang diunggah melapisi identitas yang di-resolve gateway secara lokal dan tidak pernah dikirim bolak-balik melalui `config.patch`. Kolom konfigurasi bersama `ui.assistant.avatar` tetap tersedia bagi klien non-UI yang menulis kolom tersebut secara langsung.

## Endpoint konfigurasi runtime

Control UI mengambil pengaturan runtime-nya dari `/control-ui-config.json`, yang di-resolve relatif terhadap jalur dasar Control UI milik gateway (misalnya `/__openclaw__/control-ui-config.json` di bawah jalur dasar `/__openclaw__/`). Endpoint tersebut dilindungi oleh autentikasi gateway yang sama dengan bagian lain dari permukaan HTTP: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang valid, identitas Tailscale Serve, atau identitas proksi tepercaya.

## Status host Gateway

Buka **Settings → General** untuk melihat kartu **Gateway Host** yang berisi mesin Gateway, alamat LAN, sistem operasi, runtime, waktu aktif, beban CPU, memori, dan ruang disk volume status. Kartu diperbarui setiap 10 detik selama terlihat melalui RPC Gateway `system.info`, yang memerlukan cakupan `operator.read`. Gateway versi lama dan koneksi tanpa cakupan tersebut tidak menampilkan kartu ini.

## Dukungan bahasa

Control UI melokalkan dirinya saat pertama kali dimuat berdasarkan locale browser Anda. Untuk menggantinya nanti, buka **Settings -> General -> Language** (pemilih berada di halaman General, bukan di bawah Appearance).

- Locale yang didukung: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Terjemahan non-Inggris dimuat secara malas di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang tidak tersedia menggunakan bahasa Inggris sebagai fallback.

Terjemahan dokumentasi dihasilkan untuk kumpulan locale non-Inggris yang sama, tetapi pemilih bahasa bawaan Mintlify pada situs dokumentasi hanya mencantumkan kode locale yang diterima Mintlify. Dokumentasi bahasa Thai (`th`) dan Persia (`fa`) tetap dihasilkan di repositori publikasi; dokumentasi tersebut mungkin tidak muncul di pemilih sampai Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Appearance memiliki tema bawaan Claw, Knot, dan Dash (Claw adalah default), ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Share**, lalu tempelkan tautan yang disalin ke Appearance. Pengimpor juga menerima URL registri `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, jalur relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan dalam profil browser saat ini; tema tersebut tidak ditulis ke konfigurasi gateway dan tidak disinkronkan antarperangkat. Mengganti tema yang diimpor akan memperbarui satu slot lokal tersebut; menghapusnya akan beralih kembali ke Claw jika tema yang diimpor sedang aktif.

Appearance juga memiliki pengaturan Text size. Pengaturan ini berlaku untuk teks obrolan, teks penyusun, kartu alat, dan bilah sisi obrolan, serta mempertahankan input teks minimal 16px agar Safari seluler tidak melakukan zoom otomatis saat fokus.

Tema, mode tema, ukuran teks, bahasa, dan preferensi tampilan obrolan disinkronkan melalui konfigurasi gateway (`ui.prefs`), sehingga pengaturan tersebut mengikuti Anda di seluruh perangkat dan agen dapat mengubahnya melalui gerbang persetujuan — klien yang terhubung menerapkan perubahan secara langsung melalui pemberitahuan `config.changed` milik gateway. Setiap browser menyimpan salinan lokal untuk proses awal instan; klien yang tidak dapat menulis konfigurasi (cakupan penampil, offline) mempertahankan perubahan hanya di perangkat. Lihat [Referensi konfigurasi](/id/gateway/configuration-reference#ui).

## Pemeliharaan sistem OpenClaw

Buka **Settings → Ask OpenClaw** untuk berbicara dengan agen penyiapan dan perbaikan sistem. Di luar onboarding, halaman ini dapat menampilkan paling banyak satu chip peristiwa yang dapat ditutup per kunjungan. Halaman tetap diam untuk lalu lintas rutin Gateway dan hanya bereaksi terhadap snapshot kesehatan yang melaporkan pemuat ulang konfigurasi yang dinonaktifkan, pemutusan/degradasi saluran yang dikonfigurasi, probe saluran yang gagal, atau kredensial saluran yang tidak tersedia. Peristiwa yang lebih baru hanya menggantikan chip tertunda jika tingkat keparahannya lebih tinggi; menutup atau menggunakan chip akan membisukan prompt peristiwa selama kunjungan tersebut. Mengeklik chip akan mengirimkan pertanyaan diagnosisnya sebagai pesan `openclaw.chat` nyata, sehingga transkrip mencatat permintaan dan OpenClaw melakukan diagnosis. Onboarding tidak pernah menampilkan chip peristiwa ini.

## Kelola plugin

Buka **Plugins** di bilah sisi, atau gunakan `/settings/plugins` relatif terhadap
jalur dasar Control UI yang dikonfigurasi, untuk menelusuri dan mengelola plugin tanpa meninggalkan
Control UI. Misalnya, jalur dasar `/openclaw` menggunakan
`/openclaw/settings/plugins`. Halaman ini selalu tersedia, bahkan ketika setiap
plugin opsional dinonaktifkan.

Plugins adalah hub dengan empat tab: **Installed** dan **Discover** mengelola kode plugin
di `/settings/plugins`, **Skills** menyediakan pengelola skill per agen di
`/skills`, dan **Workshop** menyediakan review proposal Skill Workshop di
`/skills/workshop`. Setiap tab mempertahankan URL-nya sendiri, dan bilah sisi menampilkan
satu entri Plugins untuk semuanya.

Tab **Installed** menampilkan inventaris lokal lengkap yang dikelompokkan berdasarkan kategori, dengan
jumlah ikhtisar. Setiap baris membuka tampilan detail; menu luapannya (`…`)
mengaktifkan atau menonaktifkan plugin dan menawarkan **Remove** untuk plugin yang dipasang secara eksternal.
Tab ini juga mencantumkan [server MCP](/id/cli/mcp) yang dikonfigurasi dan mendukung penambahan, penonaktifan,
serta penghapusan langsung. Kontrol server yang sama tersedia di **Settings → MCP**.
Tab **Discover** adalah toko: plugin unggulan yang disertakan bersama OpenClaw,
plugin eksternal resmi, dan konektor MCP sekali klik untuk layanan populer.
Mengetik di kotak pencarian akan mengkueri
[ClawHub](https://clawhub.ai/plugins) secara langsung dan menambahkan bagian **From ClawHub**
dengan jumlah unduhan dan lencana verifikasi sumber. Tautan dalam dapat
menargetkan toko secara langsung dengan `/settings/plugins?tab=discover`.

Tab **Skills** mempertahankan laporan status skill, tombol aktif/nonaktif, entri kunci
API, dan pencarian skill ClawHub langsung, yang dibatasi pada agen yang dipilih. Tab
**Workshop** mempertahankan papan Skill Workshop dan alur review Today untuk
[proposal skill](/id/tools/skill-workshop). **Find skill ideas** meninjau jendela terbatas
dari sesi substantif, mulai dari yang terbaru hingga yang terlama, dan meninggalkan hasil sebagai
proposal tertunda. Panel menampilkan cakupan kumulatif; **Scan earlier work**
melanjutkan dari kursor yang dipertahankan, lalu berubah menjadi **Scan new work** setelah riwayat
yang lebih lama habis. Review riwayat manual berfungsi saat pembelajaran mandiri otonom
dinonaktifkan dan menggunakan model yang dikonfigurasi untuk agen terpilih.

Plugin yang disertakan sudah tersedia di Gateway dan menampilkan **Enable** atau
**Disable**, bukan **Install**. Misalnya, Workboard disertakan bersama
OpenClaw tetapi dinonaktifkan secara default, sehingga tindakannya adalah **Enable**. Plugin bawaan
tidak dapat dihapus, hanya dapat dinonaktifkan.

Membaca katalog dan mencari ClawHub memerlukan `operator.read`. Menginstal,
mengaktifkan, menonaktifkan, atau menghapus plugin serta mengubah server MCP memerlukan
`operator.admin`; tindakan tersebut tetap dinonaktifkan bagi operator hanya-baca.

Instalasi ClawHub dijalankan melalui Gateway dan menerapkan pemeriksaan kebijakan
kepercayaan, integritas, dan instalasi plugin yang sama seperti instalasi lain yang
dimediasi Gateway. Menginstal atau menghapus kode plugin memerlukan mulai ulang Gateway.
Mengaktifkan atau menonaktifkan plugin yang telah terinstal dapat diterapkan tanpa mulai
ulang jika plugin dan runtime Gateway saat ini mendukungnya; jika tidak, UI melaporkan
bahwa mulai ulang diperlukan. Konektor MCP berbasis OAuth memerlukan satu kali
`openclaw mcp login <name>` dari CLI setelah ditambahkan.

Halaman ini secara khusus berfokus pada inventaris, penemuan, instalasi, pengaktifan,
dan penghapusan. Gunakan [`openclaw plugins`](/id/cli/plugins) untuk sumber npm, git, atau
jalur lokal arbitrer, pembaruan, dan konfigurasi plugin lanjutan.

## Aplikasi dan ekstensi

Buka **Apps** dari menu **More** di bilah sisi, palet perintah, atau menu agen di
bilah sisi (**Get the apps**), atau gunakan `/apps` relatif terhadap jalur
dasar Control UI yang dikonfigurasi. Halaman ini mengumpulkan tautan instalasi untuk
setiap antarmuka pendamping OpenClaw: aplikasi [iOS](/id/platforms/ios) dan
[Android](/id/platforms/android), pendamping Apple Watch dan Wear OS yang disertakan
bersamanya, aplikasi desktop [macOS](/id/platforms/macos), [Windows](/id/platforms/windows),
dan [Linux](/id/platforms/linux), [ekstensi Chrome](/id/tools/chrome-extension), hub Plugin
dalam aplikasi dengan [ClawHub](https://clawhub.ai), serta komunitas Discord dan
dokumentasi.

## Navigasi bilah sisi

Bilah sisi mengatur semuanya berdasarkan agen. Baris identitas di bagian atas adalah agen aktif; di bawahnya, bagian **Pages** dimulai dengan **Home** — sesi utama agen yang terus berjalan, dengan lencana status belum dibaca atau sedang berjalan — diikuti tujuan yang disematkan (**Usage**, **Automations**, dan **Plugins** secara default). Kontrol penyesuaian pada tajuk Pages membuka menu yang berisi semua tujuan lain, termasuk tab yang disediakan plugin, ditambah **Edit pinned items**; mengeklik kanan area navigasi langsung membuka editor sematan. Daftar sesi di bawahnya dibagi menjadi beberapa zona: **Threads** untuk sesi percakapan agen (sesi utama tetap berada di balik Home; sesi yang dibuatnya muncul di sini sebagai utas tingkat atas, dan utas bernama ditampilkan tanpa awalan jenis), **Groups** untuk percakapan grup dan ruang, serta **Coding** untuk sesi yang terikat ke worktree terkelola atau node exec (baris menampilkan satu baris `repo ⎇ branch` beserta host node), sesi harness berbasis ACP, dan katalog CLI Codex/Claude. Coding secara default diciutkan saat pertama kali dijalankan dan mengingat pilihan Anda; tajuknya yang diciutkan tetap mempertahankan jumlah sebenarnya dan menampilkan indikator berjalan saat sesi di dalamnya sedang bekerja. Grup khusus (`category` sesi) dan baris **Pinned** berada di atas Threads, dan penetapan sesi ke grup khusus selalu mengesampingkan klasifikasi zona otomatis. Tajuk Threads memuat kontrol pengurutan (Created atau Last updated, ditambah tombol alih Group by) dan tombol **+** yang membuka halaman sesi baru. Membuka sesi memindahkan sorotan pilihan tanpa mengubah urutan baris. Sesi induk dengan eksekusi anak terbaru menampilkan pengungkapan dan jumlah anak; perluas untuk memeriksa sesi anak bertingkat, status langsung atau terminal, dan runtime tanpa meninggalkan bilah sisi. Memilih anak membuka percakapannya dan secara otomatis menampilkan jalur leluhurnya. Baris anak tetap berada di luar pengelompokan akar, penyematan, penyeretan, pemilihan jamak, dan paginasi; zona yang diciutkan tidak menggunakan anggaran halaman yang terlihat. Sesi dengan aktivitas baru sejak terakhir dibaca menampilkan titik belum dibaca, dan membukanya menandainya sebagai telah dibaca. Agen juga dapat menerbitkan baris status singkat yang akan kedaluwarsa dan secara opsional meminta perhatian dengan ikon amber terkurasi; deklarasi tersebut dihapus saat Anda membuka sesi, mengirim pesan berikutnya, menghapusnya secara eksplisit, atau saat TTL-nya berakhir. Status siklus hidup pekerja cloud menggunakan lencana globe; sesi lokal dan yang diklaim kembali tidak menampilkan lencana penempatan karena eksekusi lokal adalah default. Setiap baris sesi akar memiliki menu konteks (tombol kebab atau klik kanan) dengan Pin/Unpin, Mark as unread/read, Rename, Fork, Move to group (termasuk New group dan Remove from group), Archive, dan Delete; tata letak sentuh menjaga kontrol penyematan langsung dan menu tetap terlihat. Cmd/Ctrl-klik mengalihkan baris akar ke pemilihan jamak dan Shift-klik memperluasnya mengikuti urutan yang terlihat; membuka menu pada baris yang dipilih kemudian menawarkan tindakan massal (Mark N as unread/read, Move N to group, Archive N, Delete N) yang diterapkan ke setiap sesi terpilih, dengan satu konfirmasi untuk penghapusan massal. Seret sesi akar ke **Pinned** untuk menyematkannya, atau ke grup khusus untuk memindahkannya. Tajuk grup khusus dapat diciutkan, diperluas, atau diseret untuk mengubah urutannya; nama grup dan urutannya disimpan di gateway (`sessions.groups.*`), sehingga mengikuti Anda di berbagai peramban, sedangkan status diciutkan tetap berada di profil peramban. Tajuk grup juga memiliki menu (tombol kebab atau klik kanan) dengan Rename group, New group, dan Delete group; mengganti nama atau menghapus grup memperbarui setiap sesi anggota di sisi server, termasuk yang diarsipkan, dan menghapus grup mempertahankan sesinya serta memindahkannya kembali ke Threads.

## Halaman sesi baru

Tombol **+** pada tajuk daftar sesi di bilah sisi membuka draf satu halaman penuh di `/new`: tidak ada yang dibuat sampai Anda mengirim pesan pertama. Baris target di atas kotak pesan memilih tempat sesi bekerja: agen (penyiapan multiagen), tempat exec dijalankan (**Gateway · local** atau node tersanding yang mengekspos `system.run`; memerlukan `operator.admin`), folder (secara default ruang kerja agen; jalur Gateway absolut lainnya memerlukan `operator.admin` dan worktree), serta tombol alih **Worktree** opsional dengan pemilih cabang dasar (didukung oleh `worktrees.branches`, sehingga tidak terjadi fetch) dan nama worktree opsional (cabang menjadi `openclaw/<name>`). Footer penyusun memilih model dan tingkat penalaran sesi baru, dan proses mulai di cloud menyimpan kedua pilihan sebelum mengirimkan sesi kepada pekerjanya. Tombol jelajah pada chip folder membuka pemilih direktori sebaris yang didukung oleh metode khusus admin `fs.listDir`. Tingkat teratasnya menampilkan Gateway dan setiap node yang diketahui; node luring dan node tanpa dukungan penjelajahan direktori tetap terlihat tetapi dinonaktifkan. Memilih Gateway dimulai dari folder saat ini atau direktori utama Gateway. Memilih node yang mampu akan menjelajahi sistem berkas host node tersebut, mengikat exec padanya, dan menggunakan jalur node absolut yang dipilih secara langsung (worktree terkelola tetap hanya tersedia di Gateway). Pengiriman memanggil `sessions.create` dengan pesan pertama, sehingga eksekusi dimulai dalam perjalanan bolak-balik yang sama dan UI berpindah ke percakapan sesi baru. Jika Gateway membuat sesi tetapi menolak pengiriman pertama tersebut, percakapan mempertahankan prompt dan kesalahan setelah pemuatan ulang; **Retry** mengirimkannya melalui sesi yang telah dibuat alih-alih membuat sesi lain.

Di dalam **Settings**, bilah sisi khusus menyertakan **Ask OpenClaw** dan dimulai dengan bidang **Search settings** untuk menemukan bagian pengaturan dengan cepat.

Bidang **Search** di bagian atas bilah sisi membuka palet perintah (⌘K). Mengeklik baris identitas agen di bagian atas bilah sisi membuka menu agen; **Home** membuka sesi utama. Saat sesuatu memerlukan tindakan — tugas cron yang gagal atau terlambat, autentikasi model yang akan atau telah kedaluwarsa — chip perhatian ringkas muncul di atas footer bilah sisi dan dapat diklik untuk membuka halaman pemiliknya. Baris identitas menampilkan avatar agen (gambar identitas atau emoji), nama, titik koneksi, dan subtitel langsung. Mengekliknya membuka menu agen: pengalih agen (penyiapan multiagen), "Apa yang dapat dilakukan agen ini?", **Pengaturan agen**, **Pengaturan**, penyandingan perangkat seluler, **Dokumentasi**, chip build, dan tombol alih mode warna. Daftar yang berisi lebih dari sepuluh agen mendapatkan bidang filter dan mencantumkan agen yang disematkan terlebih dahulu; sematkan atau lepas sematan agen dari halaman pengaturan Agen, dengan kumpulan yang disematkan disimpan dalam profil peramban. Memilih agen membatasi Chat serta Usage, Automations, Tasks, Workboard, dan Sessions ke agen tersebut. Setiap halaman terbatas menyediakan kontrol **Agent** dengan **All agents** sebagai jalan keluar; ini memperluas cakupan halaman bersama tanpa mengubah agen percakapan tertentu, sedangkan tautan sesi langsung tetap membuka targetnya. Halaman pengaturan Agen mempertahankan pilihan `?agent=` miliknya sendiri dan tidak mengikuti cakupan halaman bersama. Bilah footer memuat logo produk, chip build, titik koneksi gateway, dan pintasan Pengaturan. Saat gateway dijalankan dari checkout sumber pada cabang selain `main`, footer juga menampilkan nama cabang tersebut dalam warna merah agar gateway nonrilis langsung terlihat (instalasi rilis tidak pernah menampilkannya). Shift-Command-Comma membuka **Settings** tanpa mengganti pintasan Command-Comma milik peramban. Tajuk bilah sisi juga memuat tombol alih penciutan (⌘B); menciutkannya menyembunyikan bilah sisi sepenuhnya untuk ruang kerja selebar penuh, dan kontrol perluas mengambang (atau ⌘B) menampilkannya kembali; aplikasi macOS menempatkan tombol alih tersebut secara native di bilah judul. Bilah sisi adalah satu-satunya elemen navigasi di desktop, tanpa bilah atas. Area pandang sempit mengganti bilah sisi dengan panel geser di balik baris tajuk ringkas yang memuat tombol alih panel, merek, dan pencarian palet perintah; pada ponsel, Chat menyerap baris navigasi tersebut ke bilah judulnya, dengan kontrol menu dan pencarian di samping judul sesi. Di aplikasi macOS, baris tajuk terpisah menggabungkan ruang kosong bilah judul ke dalam satu strip ringkas di samping kontrol jendela. Navigasi menggunakan riwayat peramban biasa, sehingga tombol kembali/maju peramban dapat menelusurinya; aplikasi macOS menambahkan tombol alih bilah sisi native di sebelah kontrol jendela serta gestur usap trackpad, dengan tombol kembali/maju di tepi kanan bilah sisi saat diperluas dan tombol pencarian native (palet perintah) serta sesi baru saat diciutkan.

Persetujuan tertunda juga menambahkan chip perhatian di atas footer bilah sisi;
pilih chip tersebut untuk membuka halaman Approvals pemiliknya.

## Yang dapat dilakukannya (saat ini)

<AccordionGroup>
  <Accordion title="Obrolan dan Bicara">
    - Mengobrol dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat obrolan meminta rentang terbaru yang dibatasi dengan batas teks per pesan, sehingga sesi besar tidak memaksa browser merender seluruh muatan transkrip sebelum obrolan dapat digunakan.
    - Mengarahkan penunjuk atau memfokuskan dengan papan ketik pada tautan isu atau pull request GitHub publik akan menampilkan status, judul, penulis, aktivitas terbaru, komentar, dan statistik perubahannya. Gateway yang terhubung mengambil dan menyimpan metadata publik dalam cache tanpa mengubah target tautan, termasuk saat UI menggunakan Gateway jarak jauh. Gateway menggunakan `GH_TOKEN` atau `GITHUB_TOKEN` jika tersedia, setelah memastikan repositori bersifat publik; jika tidak, Gateway menggunakan API anonim GitHub dengan cache yang lebih lama.
    - Berbicara melalui sesi waktu nyata browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan plugin suara waktu nyata khusus backend menggunakan transportasi relai Gateway. Sesi browser berkemampuan video dapat memilih kamera lokal perangkat di Settings atau beralih kamera dari pratinjau langsung; browser menangkap bingkai JPEG untuk penyedia waktu nyata tanpa mengalirkan video kamera melalui Gateway. Sesi penyedia milik klien dimulai dengan `talk.client.create`; sesi relai Gateway dimulai dengan `talk.session.create`. Relai menyimpan kredensial penyedia di Gateway sementara browser mengalirkan PCM mikrofon melalui `talk.session.appendAudio`, meneruskan panggilan alat penyedia `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar, serta merutekan pengarahan suara proses aktif melalui `talk.client.steer` atau `talk.session.steer`.
    - Mengalirkan panggilan alat dan kartu keluaran alat langsung di Obrolan (peristiwa agen). Aktivitas alat dirender sebagai baris yang disesuaikan dengan jenis: perintah shell menampilkan perintah dengan penyorotan sintaks beserta keluaran bergaya terminal; panggilan edit dan tulis yang didukung menampilkan diff sebaris yang dibatasi, nomor baris jika tersedia, dan statistik `+added -removed`; dan panggilan berurutan diringkas menjadi rangkuman seperti "Menjalankan 13 perintah, membaca 6 berkas, mengedit 9 berkas". Saat proses berlangsung, panggilan terbaru yang sedang berjalan menjadi nama tajuk grup. Perluas baris untuk memeriksa argumen yang tersisa dan keluaran mentahnya.
    - Judul tujuan AI opsional untuk panggilan alat yang kompleks (perintah shell panjang, alat plugin dengan banyak argumen), diaktifkan dengan `gateway.controlUi.toolTitles: true` (nonaktif secara default). Judul berasal dari metode `chat.toolTitles` yang diproses secara batch melalui perutean model utilitas standar — `utilityModel` eksplisit (penyedia pilihan operator, seperti tugas utilitas lainnya), atau jika tidak ada, model kecil default yang dideklarasikan oleh penyedia sesi — dan disimpan dalam cache di sisi gateway per agen. Saat opsi keikutsertaan dinonaktifkan atau tidak ada model murah yang dapat digunakan, baris mempertahankan label deterministiknya dan tidak ada panggilan model yang dilakukan.
    - Memulai atau menutup tugas tindak lanjut sementara yang disarankan model; saran yang diterima membuka sesi managed-worktree baru dengan prompt yang diusulkan.
    - Tab Aktivitas dengan rangkuman aktivitas alat langsung yang bersifat lokal di browser dan mengutamakan penyuntingan informasi sensitif, dari pengiriman `session.tool` / peristiwa alat yang sudah ada.

  </Accordion>
  <Accordion title="Saluran, sesi, memori">
    - Saluran: status saluran bawaan serta saluran plugin yang dibundel/eksternal, login QR, dan konfigurasi per saluran (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran pemeriksaan saluran mempertahankan snapshot sebelumnya agar tetap terlihat selama pemeriksaan penyedia yang lambat diselesaikan, dan memberi label pada snapshot parsial ketika pemeriksaan atau audit melampaui anggaran waktu UI.
    - Utas (halaman ruang kerja di `/sessions`, dengan tab **Worktrees** di sampingnya): secara default mencantumkan sesi agen terkonfigurasi, menyematkan sesi yang sering digunakan, mengganti namanya, mengarsipkan atau memulihkan sesi tidak aktif, beralih dari kunci sesi agen tidak terkonfigurasi yang kedaluwarsa, dan menerapkan penggantian model/pemikiran/cepat/verbose/jejak/penalaran per sesi (`sessions.list`, `sessions.patch`). Sesi yang disematkan diurutkan di atas sesi terbaru yang tidak disematkan; sesi yang diarsipkan berada di tampilan arsip pada halaman Utas dan tetap menyimpan transkripnya. Baris menampilkan titik belum dibaca untuk sesi yang memiliki aktivitas sejak terakhir dibaca, dengan tindakan tandai-belum-dibaca/tandai-sudah-dibaca (`sessions.patch { unread }`), serta tindakan Fork yang mencabangkan transkrip menjadi sesi baru (`sessions.create { parentSessionKey, fork: true }`). Ubin ikhtisar di atas tabel merangkum daftar yang dimuat (jumlah sesi, proses langsung, sesi belum dibaca, total token), setiap baris memiliki glif jenis dengan titik proses langsung, status dirender sebagai titik biasa beserta label, dan kolom Token menampilkan meter penggunaan jendela konteks ketika sesi melaporkan ukuran token dan konteks. Tindakan pengelolaan baris berada dalam menu per baris (tombol kebab atau klik kanan) yang mencerminkan menu sesi di bilah samping, dan panel samping baris memuat runtime agen serta durasi proses bersama detail sesi lainnya.
    - Katalog bilah samping Claude dan Codex native mengalirkan satu host pada satu waktu, lalu melakukan rekonsiliasi setelah perubahan konektivitas node, saat halaman mendapatkan fokus, dan paling sering setiap 30 detik selama terlihat. Perubahan katalog memicu proses lanjutan yang lebih cepat, sehingga sesi yang dibuat di alat native muncul tanpa memuat ulang Control UI. Baris Claude Desktop juga mempertahankan label grup khusus lokalnya jika ada; OpenClaw membaca pemetaan tersebut dari penyimpanan lokal Desktop dan tidak pernah menulisnya.
    - Pengelompokan sesi: kontrol Group by mengatur tabel sesi menjadi bagian-bagian berdasarkan grup khusus, saluran, jenis, agen, atau tanggal. Grup khusus dipertahankan per sesi melalui `sessions.patch` (`category`), sehingga sesi yang dimulai dari saluran pesan (Discord, Telegram, WhatsApp, ...) juga dapat dikategorikan; tetapkan grup dengan menyeret baris ke suatu bagian, atau menggunakan pemilih grup per baris, dan buat grup dengan tindakan New group.
    - Memori (tab pada halaman Agen, dengan cakupan agen yang dipilih): status dreaming, tombol aktifkan/nonaktifkan, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
    - Impor Memori (`/memory-import`, diakses dari tab Memori pada halaman Agen): mempratinjau dan menyalin memori otomatis Claude Code lokal, memori terkonsolidasi Codex, atau berkas memori Hermes ke ruang kerja agen yang dipilih (`migrations.memory.plan`, `migrations.memory.apply`).
    - Penawaran memori saat orientasi awal: ketika Control UI dibuka dalam mode orientasi awal (`?onboarding=1`, digunakan oleh aplikasi pendamping Linux setelah penginstalan pertama), dialog satu halaman menawarkan impor memori yang terdeteksi dengan alur rencana/terapkan yang sama; melewatinya menjadikan halaman pengaturan sebagai titik masuk di kemudian hari.

  </Accordion>
  <Accordion title="Cron, tugas, plugin, Skills, perangkat, persetujuan eksekusi">
    - Automasi (pekerjaan cron): kartu statistik (jumlah automasi, jumlah yang gagal, status penjadwal, waktu aktif berikutnya) di atas pengalih tab Automations/Run history; tab Automations mencantumkan pekerjaan dalam tabel yang dapat difilter (All/Active/Paused, pencarian, filter jadwal dan proses terakhir, menu tindakan per baris) dengan saran awal di bawahnya, dan tab Run history menampilkan proses terbaru dari semua automasi (`cron.*`).
    - Tugas: buku besar tugas latar belakang aktif dan terbaru secara langsung, dengan sesi tertaut dan pembatalan (`tasks.*`). Panel Background tasks pada Obrolan mengelompokkan pekerjaan yang sedang berjalan dan telah selesai; pilih baris untuk memeriksa prompt yang dibatasi serta rangkuman keluaran atau kesalahannya.
    - Plugin: menjelajahi inventaris yang terpasang dan toko pilihan, mencari ClawHub, memasang dan menghapus kode plugin, serta mengaktifkan atau menonaktifkan plugin yang terpasang (`plugins.*`); baris server MCP mengedit `mcp.servers` melalui metode konfigurasi.
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Perangkat: satu inventaris menggabungkan catatan perangkat yang dipasangkan, katalog node, dan keberadaan langsung (`device.pair.list`, `node.list`, `system-presence`). Host Gateway disematkan di urutan pertama; klien yang dipasangkan menampilkan status koneksi, peran, token, kemampuan, dan perintah. Pemasangan duplikat digabungkan menjadi grup yang dapat diperluas, dan **Clean up N stale** menghapus secara massal duplikat luring yang dikonfirmasi admin, yang disetujui secara otomatis (lokal senyap, CIDR tepercaya, atau terverifikasi SSH) atau dibuat sebelum asal persetujuan dicatat. Entri dapat dihapus (`node.pair.remove`, `device.pair.remove`), pemasangan perangkat dan persetujuan ulang node ditangani secara langsung (`device.pair.*`, `node.pair.approve`/`reject`), dan kode penyiapan perangkat seluler dibuat dari kartu yang sama.
    - Persetujuan eksekusi: mengedit daftar izin gateway atau node dan kebijakan permintaan untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Navigasi pengaturan dimulai dengan Tanya OpenClaw, lalu mengelompokkan halaman berdasarkan perhatian: Umum, Tampilan, dan Notifikasi di bagian atas; Koneksi (Koneksi, Saluran, Komunikasi, Perangkat); Agen & Alat (Agen, AI & Agen, Penyedia Model, MCP, Otomatisasi, Lab); Privasi & Keamanan (Keamanan, Persetujuan); dan Sistem (Infrastruktur, Lanjutan, Debug, Log, Tentang). Umum adalah hub ringkas yang memuat default model, bahasa, dan statistik host Gateway; setiap pengaturan lainnya berada tepat di satu halaman.
    - Privasi & Keamanan: baris pilihan untuk autentikasi Gateway, kebijakan eksekusi, pengaktifan browser, profil alat, autentikasi perangkat, dan pemasangan perangkat seluler, di atas bagian `security`/`approvals` yang didukung skema.
    - Persetujuan mencakup riwayat 30 hari yang diurutkan dari terbaru untuk permintaan eksekusi, plugin, dan agen sistem yang telah diselesaikan. Filter menurut jenis atau telusuri halaman baris yang lebih lama untuk meninjau keputusan, alasan, sesi sumber, dan atribusi penyelesai yang dicatat oleh Gateway.
    - Lab menampilkan pengalih eksperimental yang telah dirilis. Mode Kode adalah entri saat ini dan langsung menyimpan `tools.codeMode.enabled`; eksperimen yang belum dirilis tidak muncul atau menulis kunci konfigurasi spekulatif.
    - Notifikasi: status web-push browser, berlangganan/berhenti berlangganan, dan pengiriman percobaan.
    - Lanjutan: setiap bagian konfigurasi yang tidak memiliki halaman khusus, ditambah editor JSON5 mentah (sebelumnya merupakan mode Lanjutan pada halaman Umum).
    - Penyiapan Model (`/settings/model-setup`) adalah subhalaman Penyedia Model yang dibuka dari header-nya.
    - Agen: halaman pengaturan (**Pengaturan → Agen**, `/settings/agents`) dengan tab per agen (Ikhtisar, File, Alat, Skills, Saluran, Otomatisasi, Memori). Tab Ikhtisar mengedit identitas agen — nama tampilan, emoji, dan gambar avatar yang diperkecil serta dibatasi ukurannya di browser sebelum `agents.update`. Penyimpanan menyimpan bidang identitas yang dikonfigurasi dan mencerminkannya ke `IDENTITY.md` ruang kerja; nilai yang dikonfigurasi lebih diutamakan daripada pengeditan manual pada bidang file yang sama.
    - Profil: halaman pengaturan yang menampilkan identitas agen default dengan statistik penggunaan sepanjang waktu — total token seumur hidup, hari puncak, sesi terlama, rentetan aktivitas, peta panas token selama setahun, alat teratas, dan sorotan saluran (`usage.cost`, `sessions.usage`).
    - MCP memiliki halaman pengaturan khusus dengan baris server (transportasi, status aktif, ringkasan OAuth/filter/paralel), kontrol langsung untuk menambahkan/mengaktifkan/menonaktifkan/menghapus, perintah operator umum, dan editor konfigurasi `mcp` terbatas cakupan. Halaman Plugin tetap menjadi tempat utama untuk konektor sekali klik dan penemuan.
    - Penyedia Model: halaman pengaturan yang mencantumkan setiap penyedia model yang dikonfigurasi beserta ikon mereknya, status autentikasi (`models.authStatus`), ketersediaan model (`models.list`), data paket/kuota/penagihan langsung jika dilaporkan oleh penyedia (`usage.status`), dan pengeluaran sesi lokal selama 30 hari terakhir (`sessions.usage`). Tindakan Segarkan membaca ulang status kredensial dan penggunaan penyedia.
    - Koneksi: halaman pengaturan (di bawah **Koneksi**) yang mengelola tautan Gateway milik dasbor — URL WebSocket, token Gateway, kata sandi, dan kunci sesi default — serta rekaman handshake terbaru (status, waktu aktif, interval tick, penyegaran saluran terakhir). Gerbang login luring menangani kondisi terputus; halaman ini mengedit koneksi saat terhubung.
    - Terapkan dan mulai ulang dengan validasi (`config.apply`), lalu bangunkan sesi yang terakhir aktif.
    - Penulisan menyertakan pengaman hash dasar untuk mencegah penimpaan pengeditan serentak.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan pemeriksaan awal resolusi SecretRef aktif untuk referensi dalam payload konfigurasi yang dikirimkan; referensi aktif yang dikirimkan tetapi belum terselesaikan ditolak sebelum penulisan.
    - Penyimpanan formulir membuang placeholder tersensor usang yang tidak dapat dipulihkan dari konfigurasi tersimpan, sekaligus mempertahankan nilai tersensor yang masih dipetakan ke rahasia tersimpan.
    - Skema dan perenderan formulir berasal dari `config.schema` / `config.schema.lookup`, termasuk `title`/`description` bidang, petunjuk UI yang cocok, ringkasan anak langsung, metadata dokumentasi pada simpul objek/wildcard/array/komposisi bertingkat, serta skema plugin dan saluran jika tersedia. Editor JSON mentah hanya tersedia jika rekaman dapat melakukan perjalanan pulang-pergi mentah dengan aman; jika tidak, UI Kontrol memaksakan mode Formulir.
    - Editor JSON mentah "Atur ulang ke yang tersimpan" mempertahankan bentuk yang dibuat secara mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang rekaman yang diratakan, sehingga pengeditan eksternal tetap bertahan setelah pengaturan ulang jika rekaman dapat melakukan perjalanan pulang-pergi dengan aman.
    - Nilai objek SecretRef terstruktur dirender hanya-baca dalam input teks formulir untuk mencegah kerusakan objek-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Penggunaan">
    - Analisis token dan estimasi biaya yang berasal dari sesi tetap terpisah dari penagihan penyedia.
    - Kartu penyedia memanggil `usage.status` dan menampilkan nama paket langsung, jendela kuota, saldo, pengeluaran, dan anggaran yang dilaporkan oleh plugin penyedia yang dikonfigurasi.
    - Kegagalan penggunaan penyedia tidak memblokir dasbor sesi/biaya; kartu penyedia yang tidak tersedia menampilkan status kesalahannya sendiri.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: rekaman status/kesehatan/model, log peristiwa, dan panggilan RPC manual (`status`, `health`, `models.list`).
    - Log peristiwa mencakup waktu penyegaran/RPC UI Kontrol, waktu render obrolan/konfigurasi yang lambat, dan entri responsivitas browser untuk frame animasi atau tugas yang panjang saat browser menyediakan jenis entri PerformanceObserver tersebut.
    - Log: tail langsung log file Gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan paket/git beserta mulai ulang (`update.run`) dengan laporan mulai ulang, lalu lakukan polling terhadap `update.status` setelah tersambung kembali untuk memverifikasi versi Gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel otomatisasi">
    - Memilih baris membuka tampilan detail satu halaman penuh dengan pengalih Aktif/Dijeda dan Jalankan sekarang di header (jalankan-jika-jatuh-tempo, kloning, dan hapus di menunya); tab Pengaturan mengedit otomatisasi secara inline (prompt, detail, frekuensi, penggantian lanjutan) dan tab Riwayat eksekusi menampilkan eksekusi otomatisasi tersebut.
    - Otomatisasi awal di bawah tabel mengisi formulir pembuatan dengan prompt dan jadwal yang dapat diedit.
    - Untuk tugas terisolasi, pengiriman menggunakan ringkasan pengumuman secara default; alihkan ke tidak ada untuk eksekusi khusus internal.
    - Bidang saluran/target muncul saat pengumuman dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` yang ditetapkan ke URL Webhook HTTP(S) yang valid.
    - Untuk tugas sesi utama, mode pengiriman Webhook dan tidak ada tersedia.
    - Kontrol pengeditan lanjutan mencakup hapus-setelah-eksekusi, hapus penggantian agen, opsi tepat/berjarak Cron, penggantian model/pemikiran agen, dan pengalih pengiriman upaya terbaik.
    - Validasi formulir ditampilkan secara inline dengan kesalahan tingkat bidang; nilai yang tidak valid menonaktifkan tombol simpan hingga diperbaiki.
    - Tetapkan `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, Webhook dikirim tanpa header autentikasi.
    - `cron.webhook` adalah fallback lama yang telah dihentikan dan ditolak oleh validasi konfigurasi saat ini. Jalankan `openclaw doctor --fix` untuk memigrasikan tugas tersimpan yang masih menggunakan `notify: true` ke pengiriman Webhook per tugas atau pengiriman penyelesaian secara eksplisit dan menghapus kunci lama.

  </Accordion>
</AccordionGroup>

## Impor memori asisten

Buka **Pengaturan** → **Impor Memori** untuk membawa memori lokal Codex atau Claude Code
ke dalam agen OpenClaw. Gateway menemukan sendiri memori lokal yang didukung di
host-nya, sehingga UI Kontrol jarak jauh mengimpor dari komputer Gateway, bukan
komputer browser.

1. Pilih agen tujuan.
2. Tinjau koleksi sumber dan nama file Markdown yang terdeteksi. Isi file
   tidak dikirim dalam respons rencana atau ditampilkan di halaman.
3. Pilih koleksi yang akan diimpor dan konfirmasikan. Penerapan membangun ulang rencana sebelum
   menulis agar pilihan usang gagal dengan aman.
4. Jika file sudah ada, aktifkan **Ganti impor yang ada**, segarkan
   pratinjau, lalu konfirmasikan penggantian.

Codex hanya mengimpor `MEMORY.md` dan `memory_summary.md` terkonsolidasinya. Claude
Code mengimpor Markdown dari direktori memori otomatis proyek dan
`autoMemoryDirectory` yang dikonfigurasi; halaman ini tidak mengimpor sesi, pengaturan, instruksi, atau
kredensial. File disalin di bawah `memory/imports/` dalam ruang kerja
yang dipilih, tempat plugin memori aktif dapat mengindeksnya. Sumber
tidak pernah diubah.

Perencanaan dan penerapan memerlukan `operator.admin`. Setiap penerapan membuat cadangan
OpenClaw terverifikasi saat status tersedia, menulis laporan migrasi tersensor, dan menyimpan
cadangan tingkat item sebelum mengganti file tujuan yang ada. Lihat
[Ikhtisar memori](/id/concepts/memory#import-from-coding-assistants) untuk jalur dan
perilaku pengingatan.

## Halaman MCP

Halaman MCP khusus adalah tampilan operator untuk server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Halaman ini tidak memulai transportasi MCP dengan sendirinya; gunakan untuk memeriksa dan mengedit konfigurasi tersimpan, lalu gunakan `openclaw mcp doctor --probe` saat Anda memerlukan bukti server langsung.

Alur kerja umum:

1. Buka **MCP** dari bilah sisi.
2. Periksa kartu ringkasan untuk jumlah server total, aktif, OAuth, dan terfilter.
3. Tinjau setiap baris server untuk transportasi, status aktif, autentikasi, filter, batas waktu, dan petunjuk perintah.
4. Tambahkan, aktifkan, nonaktifkan, atau hapus server langsung di halaman MCP. Pilih Streamable HTTP, SSE, atau stdio secara eksplisit; baris perintah stdio menerima argumen yang dikutip seperti jalur dengan spasi. Gunakan halaman **Plugin** untuk konektor sekali klik dan penemuan.
5. Edit bagian konfigurasi `mcp` terbatas cakupan untuk bidang server lanjutan seperti variabel lingkungan, direktori kerja, header, jalur TLS/mTLS, metadata OAuth, filter alat, dan metadata proyeksi Codex.
6. Gunakan **Simpan** untuk penulisan konfigurasi, atau **Simpan & Publikasikan** jika Gateway yang berjalan harus menerapkan konfigurasi yang diubah.
7. Jalankan `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, atau `openclaw mcp reload` dari terminal untuk diagnostik statis, bukti langsung, atau pembuangan runtime yang di-cache.

Halaman ini menyensor nilai mirip URL yang memuat kredensial sebelum perenderan dan mengutip nama server dalam cuplikan perintah agar perintah yang disalin tetap berfungsi dengan spasi atau metakarakter shell. Referensi CLI dan konfigurasi lengkap: [MCP](/id/cli/mcp).

## Tab Aktivitas

Tab Aktivitas berada di **Pengaturan › Sistem**, di samping Log dan Debug. Tab ini adalah pengamat sementara yang bersifat lokal pada browser untuk aktivitas alat langsung, yang berasal dari aliran peristiwa `session.tool` / alat Gateway yang sama dengan yang mendukung kartu alat Obrolan. Tab ini tidak menambahkan keluarga peristiwa Gateway lain, endpoint, penyimpanan aktivitas persisten, umpan metrik, atau aliran pengamat eksternal.

Entri Aktivitas hanya menyimpan ringkasan yang disanitasi dan pratinjau output tersensor yang dipotong. Nilai argumen alat tidak disimpan dalam status Aktivitas; UI menunjukkan bahwa argumen disembunyikan dan hanya mencatat jumlah bidang argumen. Daftar dalam memori mengikuti tab browser saat ini, bertahan selama navigasi dalam UI Kontrol, dan diatur ulang saat halaman dimuat ulang, sesi beralih, atau **Hapus**.

## Terminal operator

Terminal operator yang dapat ditambatkan dinonaktifkan secara default. Untuk mengaktifkannya, tetapkan `gateway.terminal.enabled: true` dan mulai ulang Gateway. Terminal memerlukan koneksi `operator.admin` dan membuka PTY host di ruang kerja agen aktif. Tab baru mengikuti agen obrolan yang saat ini dipilih.

<Warning>
Terminal adalah shell host tanpa pembatasan dan mewarisi lingkungan proses Gateway. Aktifkan hanya untuk penerapan operator tepercaya. OpenClaw menolak sesi terminal untuk agen dengan `sandbox.mode: "all"`; mengubah agen aktif ke mode tersebut akan menutup sesi terminalnya yang sudah ada dan sedang berlangsung.
</Warning>

Gunakan **Ctrl + backtick** untuk menampilkan atau menyembunyikan dok. Tata letaknya mendukung dok di bawah dan kanan, menyesuaikan ukuran dengan area pandang peramban, serta mempertahankan beberapa tab shell. Lihat [konfigurasi Gateway](/id/gateway/configuration-reference#gateway) untuk `gateway.terminal.enabled` dan penggantian opsional `gateway.terminal.shell`.

Agen tanpa sandbox yang diotorisasi pemilik dapat menggunakan alat `terminal` untuk pekerjaan panjang atau interaktif yang perlu dipantau operator. Setiap pemanggilan alat dapat membuka, membaca, menulis, mengubah ukuran, menutup, atau mencantumkan PTY gateway milik agen itu sendiri. Secara default, sesi baru membuka tab Control UI yang terhubung bersama, sehingga agen dan operator berbagi keluaran dan keduanya dapat mengetik atau mengubah ukuran. Akses agen dibatasi secara tepat per sesi: agen tidak dapat membaca atau mengendalikan terminal yang dibuat operator maupun terminal yang dibuka oleh sesi agen lain.

Seret satu atau beberapa file ke terminal aktif, atau gunakan tombol penjepit kertas untuk memilih file. OpenClaw menempatkan setiap file di mesin pemilik PTY dan menempelkan path absolut yang dikutip sesuai aturan shell pada posisi kursor; OpenClaw tidak pernah menekan Enter atau menjalankan masukan tersebut. Indikator batch ringkas menampilkan file saat ini dan jumlah yang telah selesai. Pembatalan menghentikan sisa batch tanpa menempelkan path; transfer yang gagal tetap terlihat agar Anda dapat mencoba lagi mulai dari file tersebut tanpa mengunggah ulang file yang telah selesai. Gambar, PDF, arsip, dan jenis file lainnya diterima hingga 16 MiB per file. File yang ditempatkan menggunakan direktori sementara sistem privat pada host POSIX (mode direktori `0700`, mode file `0600`) atau direktori di bawah batas ACL profil pengguna pada Windows, serta pewaktu pembersihan 24 jam, jadi pindahkan atau salin segala sesuatu yang perlu dipertahankan.

Penyisipan path mendukung PowerShell, `cmd.exe`, dan shell POSIX yang dikenali (`sh`, Bash, Dash, Ash, Ksh, Zsh, dan Fish), termasuk Git Bash pada Windows. Penggantian shell lain ditolak karena aturan pengutipannya tidak dapat disimpulkan dengan aman; jalankan Gateway di dalam WSL untuk mendapatkan terminal WSL native dan path unggahan Linux. Path `cmd.exe` yang berisi `%` atau `!` juga ditolak karena shell tersebut memperluas karakter-karakter itu bahkan di dalam tanda kutip ganda.

Sesi Codex dan Claude Code yang ditemukan di bilah samping sesi dapat dibuka dalam CLI native masing-masing di dalam panel terminal yang sama. Di **Settings › Chat**, atur **Open Codex/Claude threads in** ke **Terminal** agar klik biasa pada baris membuka `codex resume` atau `claude --resume`; penampil OpenClaw hanya-baca tetap menjadi default. Menu klik kanan atau menu kebab pada baris selalu menawarkan kedua pilihan, dan header penampil menyertakan **Open in terminal** saat sesi tersebut memenuhi syarat.

Kelayakan ditentukan per sesi dan per host. Sesi lokal Gateway menjalankan perintah melanjutkan milik penyedia di host Gateway. Sesi node yang dipasangkan menjalankan perintah penyedia yang masuk daftar izin di node pemilik dan hanya merelai keluaran, masukan, serta peristiwa perubahan ukuran PTY tersebut; ini tidak mengekspos shell node umum atau menerima perintah yang diberikan peramban. Unggahan file menggunakan perintah node `terminal.upload` yang terpisah dan dibatasi ukurannya, serta tetap terikat pada sesi terminal yang telah dibuka. Setujui peningkatan pemasangan node saat perintah tersebut pertama kali muncul. Node yang tidak mengiklankan perintah melanjutkan terminal yang sesuai, termasuk bridge pekerja tertanam tanpa streaming dupleks, tetap menyediakan penampil dan menunjukkan bahwa pembukaan terminal tidak tersedia; node lama masih dapat menjalankan terminal, tetapi tidak dapat menerima file yang diseret.

Sesi milik koneksi tetap bertahan setelah koneksi terputus: pemuatan ulang halaman, laptop yang memasuki mode tidur, atau gangguan jaringan akan melepaskan sesi di Gateway alih-alih menghentikannya, dan tab peramban yang sama akan terhubung kembali saat koneksi pulih dengan keluaran terbaru diputar ulang. Sesi milik koneksi yang terlepas dihentikan setelah `gateway.terminal.detachedSessionTimeoutSeconds` (default 300 detik; `0` memulihkan penghentian saat koneksi terputus). Menghubungkan salah satu sesi ini tetap menggunakan pengambilalihan bergaya tmux.

Sesi milik agen tidak terikat pada koneksi peramban. `terminal.attach` menambahkan setiap peramban sebagai penampil tanpa mengambil alih kepemilikan, dan menutup tab penampil hanya melepaskan peramban tersebut. PTY tetap berjalan sampai agen pemilik menutupnya, prosesnya berhenti, kebijakan menonaktifkannya, atau Gateway dimatikan. `terminal.list` menandai setiap entri sebagai milik koneksi atau milik agen, dan `terminal.text` memungkinkan koneksi admin membaca keluaran teks biasa terbaru tanpa terhubung.

Terminal juga tersedia sebagai dokumen layar penuh khusus terminal di `/?view=terminal`. Aplikasi iOS dan Android menyematkan halaman ini dalam layar Terminal masing-masing dengan menggunakan kembali kredensial gateway yang tersimpan; ketersediaan mengikuti gerbang `gateway.terminal.enabled` dan `operator.admin` yang sama, dan halaman menampilkan pemberitahuan saat Gateway yang terhubung tidak menyediakan terminal.

## Panel peramban

Control UI menyediakan panel peramban yang dapat didok dan merender peramban yang dikendalikan Gateway (peramban yang sama dengan yang dikendalikan agen melalui [alat peramban](/id/tools/browser-control)) di peramban web biasa apa pun—tanpa memerlukan webview native. Panel ini muncul saat Gateway yang terhubung mengiklankan `browser.request` kepada koneksi `operator.admin`; tombol globe pada rel ruang kerja utas menampilkan atau menyembunyikannya. Panel menampilkan cuplikan langsung halaman beserta tab, bilah URL yang dapat diedit, navigasi kembali/maju/muat ulang, dan opsi buka di peramban Anda, dapat didok di kanan atau bawah, serta meneruskan klik, gulir roda, dan pengetikan dasar ke halaman jarak jauh.

Dua mode pengambilan mengemas konteks halaman untuk agen:

- **Anotasi (pensil)**: gambar markup bebas di atas halaman. **Kirim ke chat** menggabungkan goresan ke dalam tangkapan layar, melampirkan gambar ke penyusun chat aktif, dan mengisi awal prompt yang menjelaskan URL halaman, judul, serta setiap wilayah yang ditandai agar agen mengetahui secara tepat bagian yang Anda lingkari.
- **Inspeksi (penunjuk)**: arahkan kursor untuk melihat elemen di bawahnya (pemilih, nama aksesibel, peran, ukuran); klik untuk mengirim detail elemen tersebut beserta tangkapan layar yang disorot melalui alur penyusun yang sama. Inspeksi, gulir roda, dan navigasi kembali/maju memerlukan `browser.evaluateEnabled` (aktif secara default).

Aplikasi macOS mempertahankan bilah samping peramban tautan native untuk tautan yang diklik di dasbor; panel peramban juga berfungsi di sana dan merupakan cara untuk menganotasi halaman di semua platform lainnya.

## Perilaku chat

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-pemblokiran**: metode ini langsung mengirim pengakuan dengan `{ runId, status: "started" }` dan respons dialirkan melalui peristiwa `chat`. Klien Control UI tepercaya juga dapat menerima metadata waktu ACK opsional untuk diagnostik lokal.
    - Unggahan chat menerima gambar serta file non-video. Gambar mempertahankan jalur gambar native; file lainnya disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Pengiriman ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Jika entri transkrip terlalu besar, Gateway dapat memotong bidang teks yang panjang, menghilangkan blok metadata yang berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Jika pesan asisten yang terlihat dipotong dalam `chat.history`, pembaca samping dapat mengambil entri transkrip lengkap yang telah dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get` berdasarkan `sessionKey`, `agentId` aktif bila diperlukan, dan `messageId` transkrip. Jika Gateway tetap tidak dapat mengembalikan lebih banyak isi, pembaca menampilkan status tidak tersedia secara eksplisit alih-alih diam-diam mengulangi pratinjau yang dipotong.
    - Gambar dari asisten/yang dihasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway yang diautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap berada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif sebaris khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML pemanggilan alat berupa teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang dipotong), serta token kontrol model ASCII/lebar penuh yang bocor. Control UI menghilangkan entri asisten jika seluruh teks yang terlihat hanya berupa token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan penyegaran riwayat akhir, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal agar tetap terlihat jika `chat.history` sesaat mengembalikan snapshot yang lebih lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Peristiwa `chat` langsung merupakan status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi yang persisten. Setelah peristiwa akhir alat, Control UI memuat ulang riwayat dan hanya menggabungkan bagian akhir optimistis yang kecil; batas transkrip didokumentasikan dalam [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa eksekusi agen, tanpa pengiriman kanal).
    - Bilah samping mencantumkan setiap sesi aktif yang dimuat berdasarkan bagian agen serta kelompok Disematkan/kanal/kerja/kustom/Chat, dengan satu tindakan Sesi Baru yang membuka dialog draf. Membuka baris yang terlihat hanya memindahkan sorotan. Sesi dapat dijatuhkan ke Disematkan untuk menyematkannya, atau ke grup kustom maupun Chat untuk memindahkannya; grup kustom dapat diciutkan dan diurutkan ulang dengan seret, nama dan urutan grup disinkronkan melalui Gateway, dan status penciutan tetap tersimpan di peramban. Sesi dasbor baru secara asinkron mendapatkan judul ringkas yang dihasilkan dari pesan pertamanya yang bukan perintah; nama eksplisit dan identitas pengirim yang diautentikasi tetap terpisah, sehingga nama akun tidak pernah digunakan sebagai judul yang dihasilkan. Atur `agents.defaults.utilityModel` (atau `agents.list[].utilityModel`) untuk mengarahkan pemanggilan model terpisah ini ke model berbiaya lebih rendah; jika model yang berbeda tersebut gagal, pembuatan judul dicoba ulang sekali dengan model utama. Memperluas bagian agen lain memungkinkan penelusuran sesi agen tersebut tanpa meninggalkan chat yang terbuka.
    - Pencarian utas berada di palet perintah (⌘K, atau bidang Search di bagian atas bilah samping): mengetik kueri akan menelusuri sejumlah halaman pencocokan yang dibatasi di seluruh agen, memfilter baris turunan/Cron internal, dan mencantumkan kecocokan yang terlihat di samping perintah navigasi. Halaman Utas mempertahankan daftar lengkap yang dapat dicari beserta filter.
    - Setiap baris bilah samping mempertahankan akses penyematan langsung serta menu konteks lengkap untuk status belum dibaca, penggantian nama, fork, pengelompokan, pengarsipan, dan penghapusan. Baris yang dipilih secara jamak (klik Cmd/Ctrl, klik Shift untuk rentang) mendapatkan menu batch yang mencakup status belum dibaca, pengelompokan, pengarsipan, dan penghapusan; pengarsipan/penghapusan batch tetap dinonaktifkan kecuali setiap sesi yang dipilih dapat diarsipkan. Eksekusi aktif dan sesi utama agen tidak dapat diarsipkan. Mengarsipkan atau menghapus sesi yang sedang dipilih mengalihkan Chat kembali ke sesi utama agen tersebut.
    - Dalam aplikasi macOS, tanda OpenClaw menggunakan strip bilah judul native yang sebelumnya kosong di sebelah kontrol jendela, alih-alih memakai satu baris bilah samping.
    - Pada lebar desktop, kontrol chat tetap berada dalam satu baris ringkas dan diciutkan saat menggulir ke bawah transkrip; menggulir ke atas, kembali ke bagian teratas, atau mencapai bagian terbawah akan memulihkan kontrol.
    - Pesan berurutan identik yang hanya berisi teks dirender sebagai satu gelembung dengan lencana jumlah. Pesan yang memuat gambar, lampiran, keluaran alat, atau pratinjau kanvas tidak diciutkan.
    - Gelembung pesan pengguna memiliki tindakan transkrip: tombol putar balik saat diarahkan (popover konfirmasi dengan opsi "Don't ask again") serta **Putar balik ke sini** dan **Fork dari sini** melalui klik kanan. Putar balik mengarahkan ulang sesi ke status tepat sebelum pesan tersebut dan mengembalikan teksnya ke penyusun untuk diedit dan dikirim ulang (`sessions.rewind`, `operator.admin`); fork membuat sesi baru dari prefiks jalur aktif sebelum pesan, membukanya, dan mengisi penyusunnya dengan teks yang sama (`sessions.fork`, `operator.write`). Kedua tindakan dinonaktifkan dengan tooltip penjelasan saat agen sedang bekerja, hanya berlaku untuk pesan pengguna yang telah dipertahankan, dan ditolak untuk sesi yang percakapannya dimiliki oleh harness agen eksternal. Putar balik hanya memindahkan konteks chat — file dan efek samping alat lainnya tidak dikembalikan — dan transkrip sebelum putar balik tetap dipertahankan dalam penyimpanan sesi hanya-tambah. Jika penyimpanan tersebut berisi beberapa cabang transkrip, bilah judul chat menampilkan menu cabang berisi pesan terbaru, jumlah pesan, dan kebaruan setiap cabang; memilih cabang yang tidak aktif mengalihkan sesi saat ini kembali ke jalur yang dipertahankan tersebut (`sessions.branches.list`, `operator.read`; `sessions.branches.switch`, `operator.admin`). Peralihan cabang juga tidak tersedia saat agen sedang bekerja, dan memilih cabang yang sudah aktif merupakan kesalahan tanpa operasi bertipe pada batas RPC. Tindakan sembunyikan terpisah pada gelembung pengguna hanya menyembunyikan pesan di peramban saat ini; pesan tetap berada dalam transkrip dan agen tetap melihatnya.
    - Jika checkout sesi berada pada cabang non-default dari repositori GitHub, tampilan chat menyematkan chip pull request di atas penyusun: nomor PR, repo, cabang, jumlah diff, pil CI, serta status draf/digabung/ditutup, yang masing-masing tertaut ke PR. Baris menampilkan paling banyak dua chip — PR aktif (terbuka/draf) terlebih dahulu — dan tombol "Show more" menampilkan riwayat yang digabung/ditutup dan sebelumnya diciutkan. Pil CI membuka popover pemantauan CI kecil yang berisi jumlah pemeriksaan yang lulus/gagal/berjalan/dilewati dan tautan ke halaman pemeriksaan PR. Deteksi berjalan di sisi server melalui `controlUi.sessionPullRequests`, yang menggunakan kembali `GH_TOKEN`/`GITHUB_TOKEN` milik Gateway jika diatur. Jika batas laju API GitHub tercapai, chip mempertahankan status terakhir yang diketahui dan menampilkan peringatan bahwa status mungkin sudah kedaluwarsa; menutup chip menyembunyikannya untuk sesi tersebut dalam profil peramban saat ini. Sebelum ada PR, baris menampilkan cabang itu sendiri — repo, nama cabang, dan ukuran +/− diff terhadap basis penggabungan cabang default (pekerjaan yang telah di-commit dan belum di-commit). Setelah cabang yang didorong memiliki commit untuk dibandingkan, baris menambahkan tombol Create PR yang membuka halaman pull request baru GitHub; sebelum itu, sesi dengan file yang berubah (telah di-commit, belum di-commit, atau tidak terlacak) tetap mendapatkan baris tersebut tanpa tombol. Baris menyembunyikan dirinya sendiri selama terdapat PR terbuka atau draf. Baris cabang hanya berasal dari git lokal, sehingga tetap tersedia saat GitHub terkena pembatasan laju dan memuat peringatan status kedaluwarsa yang sama, karena "tidak ada PR yang ditemukan" tidak dapat dipercaya hingga batas tersebut direset.
    - Panel diff sesi menunjukkan perubahan sebenarnya pada checkout sesi: tombol cabang pada rel ruang kerja atau bilah judul chat membuka panel detail dengan diff per file untuk pekerjaan cabang, yang belum di-commit, dan yang tidak terlacak terhadap basis penggabungan cabang default checkout — titik status, panah penggantian nama, jumlah +/− per file, file yang dapat diciutkan, serta penanda "N baris tidak diubah" di antara hunk. Diff dihitung di sisi server melalui metode Gateway `sessions.diff` (cakupan `operator.read`); file biner dan yang terlalu besar diturunkan menjadi entri statistik saja, dan tombol hanya muncul jika Gateway yang terhubung mengiklankan `sessions.diff`.
    - Setiap panel Chat memiliki bilah judul. Klik judul sesi untuk mengganti namanya; chip ruang kerja menyalin jalur atau cabang checkout dan dapat menampilkan ruang kerja Gateway lokal dalam pengelola file host. Sesi jarak jauh dan exec-node mempertahankan tindakan salin tetapi menyembunyikan tindakan tampilkan.
    - Rel ruang kerja utas di setiap panel Chat mencantumkan file utas, file proyek, dan artefak. Secara default, rel ditambatkan ke tepi kanan panel; seret header-nya (atau gunakan tombol tambat) untuk memindahkannya ke bawah, dan pilihan tersebut disimpan dalam profil peramban saat ini. Rel yang diciutkan sama sekali tidak memakan ruang: buka kembali dengan ⇧⌘B atau tombol alih file pada bilah judul, yang memuat lencana jumlah file berubah. Panel detail file, alat, dan Canvas yang terpisah tidak terpengaruh.
    - Mengeklik referensi file dalam chat, jalur file dalam kartu alat baca/edit/tulis yang diperluas, atau baris file dalam rel ruang kerja akan membuka panel detail file: tampilan kode berbasis CodeMirror dengan penyorotan sintaks, nomor baris, lompat-ke-baris, pencarian dalam file, tindakan salin, dan menu buka-di-editor-eksternal. Jika Gateway mengiklankan `sessions.files.set` kepada koneksi `operator.admin`, panel menambahkan mode Edit dengan pelacakan perubahan belum disimpan dan penyimpanan melalui Cmd/Ctrl-S; draf yang belum disimpan tetap bertahan saat berpindah file, panel, dan sesi dalam tab peramban saat ini hingga disimpan atau dibuang secara eksplisit. Penyimpanan menggunakan compare-and-swap berdasarkan hash konten yang dikembalikan oleh `sessions.files.get`: jika file berubah pada disk sejak dimuat (misalnya karena agen terus bekerja), panel menampilkan pemberitahuan konflik dengan tindakan Reload (ambil konten terbaru) dan Overwrite (pertahankan edit lokal). Penulisan melewati perlindungan ruang kerja aman-fs yang sama seperti pembacaan — pembatasan jalur, penolakan symlink/hardlink, dan batas UTF-8 sebesar 256 KB — serta hanya menimpa file yang sudah ada; editor tidak pernah membuat atau menghapusnya.
    - Rel tugas latar belakang di setiap panel Chat mencantumkan tugas latar belakang dan subagen milik agen saat ini (`tasks.list` yang dicakup berdasarkan agen dan terus diperbarui oleh peristiwa `task`): pekerjaan yang berjalan menampilkan penghitung waktu berlalu secara langsung, jumlah penggunaan alat, alat yang sedang digunakan, dan kontrol berhenti; bagian selesai yang dapat diciutkan menambahkan durasi eksekusi; dan tautan Lihat transkrip membuka sesi turunan tugas dalam panel. Buka rel dengan tombol alih aktivitas pada bilah judul; snapshot tugas dimuat lebih awal sehingga memuat lencana jumlah yang sedang berjalan tanpa perlu membuka rel terlebih dahulu. Halaman Tugas tetap menjadi buku besar lengkap lintas agen.
    - Rel ruang kerja, rel tugas latar belakang, dan panel detail menyesuaikan dengan lebar masing-masing panel, bukan lebar jendela: dalam panel sempit atau jendela ringkas, kedua rel ditampilkan sebagai bilah bawah (kontrol dok samping disembunyikan hingga panel melebar; rel ruang kerja tetap mendapat prioritas pertama untuk slot samping ketika hanya satu kolom yang muat), dan panel detail ditumpuk di bawah utas dengan gagang pengubah ukuran horizontal alih-alih berbagi baris dengannya. Area pandang berukuran ponsel tetap membuka panel detail dalam layar penuh.
    - Pemilih model dan pemikiran pada header obrolan segera memperbarui sesi aktif melalui `sessions.patch`; keduanya merupakan penggantian sesi persisten, bukan opsi pengiriman yang hanya berlaku untuk satu giliran.
    - **Tampilan terpisah:** buka dari bilah judul obrolan (di sebelah tombol alih perbedaan utas, tugas latar belakang, dan berkas utas), lalu pisahkan panel aktif ke kanan atau ke bawah sebanyak jumlah panel yang dapat dimuat. Setiap panel memiliki utas, transkrip, kotak penulisan, dan aliran alatnya sendiri.
    - Agen dengan alat `screen` dapat meminta perubahan panel, bilah sisi, terminal, peramban, fokus, dan navigasi yang sama saat Control UI yang mendukung terhubung. Protokol v1 menerapkan perintah tersebut ke setiap Control UI terhubung yang mendukung; lihat [Layar](/id/tools/screen).
    - Seret sesi dari bilah sisi ke dalam obrolan untuk membukanya di sebuah panel. Pratinjau peletakan beranimasi bergerak mulus di antara zona dan memberi label pada hasilnya — "Pisahkan" di atas separuh tepat yang akan ditempati panel baru, "Buka di sini" di atas seluruh panel — dan peletakan juga berfungsi dari mode panel tunggal.
    - Panel terpisah yang aktif menentukan pilihan bilah sisi dan URL. Bilah judulnya menambahkan kontrol pemisahan dan penutupan; pembatas mengubah ukuran kolom dan panel yang ditumpuk, dan peramban menyimpan tata letak secara lokal di antara pemuatan ulang.
    - Pada layar sempit, tampilan terpisah mempertahankan tata letak tetapi hanya merender panel aktif, termasuk header-nya dengan kontrol penutupan.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, kotak penulisan menunggu pembaruan sesi tersebut sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` membuat dan beralih ke sesi dasbor baru yang sama seperti New Chat, kecuali ketika `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam hal itu, tindakan tersebut mereset sesi utama di tempat. Mengetik `/reset` mempertahankan reset eksplisit di tempat dari Gateway untuk sesi saat ini.
    - Pemilih model obrolan meminta tampilan model yang dikonfigurasi di Gateway. Jika `agents.defaults.modelPolicy.allow` tidak kosong, kebijakan tersebut menentukan pemilih, termasuk entri `provider/*` yang menjaga katalog bercakupan penyedia tetap dinamis. Jika tidak, pemilih menampilkan entri yang dikonfigurasi beserta penyedia yang memiliki autentikasi yang dapat digunakan; alias dan pengaturan di bawah `agents.defaults.models` tidak membatasinya. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway terbaru menyertakan token konteks saat ini, bilah alat kotak penulisan obrolan menampilkan cincin kecil penggunaan konteks beserta persentase yang telah digunakan. Buka cincin tersebut untuk melihat jendela konteks saat ini, jumlah token proses terbaru dan perkiraan total biaya, identitas penyedia/model, serta perincian biaya input/output/cache dari respons penyedia terbaru jika dilaporkan. Cincin beralih ke gaya peringatan saat tekanan konteks tinggi dan, pada tingkat Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Rekam ringkas token yang usang disembunyikan hingga Gateway kembali melaporkan penggunaan terbaru.

  </Accordion>
  <Accordion title="Mode bicara (realtime browser)">
    Mode bicara menggunakan penyedia suara realtime yang terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` beserta profil kunci API `openai`, `talk.realtime.providers.openai.apiKey`, atau `OPENAI_API_KEY`. OpenAI Realtime menggunakan API Platform publik dan memerlukan kunci API Platform; login OAuth Codex tidak memenuhi kebutuhan antarmuka ini. Konfigurasikan Google dengan `talk.realtime.provider: "google"` beserta `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API penyedia standar: OpenAI menerima rahasia klien Realtime sementara untuk WebRTC, dan Google Live menerima token autentikasi Live API sekali pakai dengan batasan untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat yang dikunci ke dalam token oleh Gateway. Penyedia yang hanya menyediakan jembatan realtime backend berjalan melalui transportasi relai Gateway, sehingga kredensial dan soket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway yang diautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.client.create` tidak menerima penggantian instruksi yang diberikan pemanggil.

    Default penyedia, model, suara, transportasi, upaya penalaran, ambang VAD yang tepat, durasi keheningan, dan bantalan awalan yang persisten berada di **Settings → Communications → Talk**; mengubahnya memerlukan akses `operator.admin`. Mengonfigurasi relai Gateway memaksa jalur relai backend; mengonfigurasi WebRTC menjaga sesi tetap dimiliki klien dan mengalami kegagalan alih-alih diam-diam beralih ke relai jika penyedia tidak dapat membuat sesi browser.

    Kontrol Talk itu sendiri adalah tombol mikrofon di bilah alat penyusun. Tanda sisipnya mencantumkan **System default** dan setiap mikrofon yang diekspos oleh browser, termasuk input USB, Bluetooth, dan virtual. ID perangkat yang dipilih tetap lokal di browser dan tidak pernah dikirim ke Gateway; jika perangkat tersebut tidak lagi tersedia, Talk meminta Anda memilih input lain alih-alih diam-diam merekam dari mikrofon yang berbeda. Saat Talk aktif, tombol mikrofon berubah menjadi pil yang menampilkan pengukur level input langsung; mengekliknya menghentikan input suara, dan mengarahkan penunjuk ke atasnya menampilkan glif berhenti. Pembaca layar mengumumkan `Connecting voice input...`, `Listening...`, atau `Asking OpenClaw...` saat panggilan alat realtime berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`. Menghentikan respons agen yang sedang berjalan tetap menggunakan kontrol kotak **Stop** terpisah di sebelah pil.

    **Video Talk** tersedia untuk sesi browser OpenAI Realtime WebRTC dan Google Live. Klik tombol kamera, izinkan akses kamera dan mikrofon, lalu konfirmasikan pratinjau lokal. OpenAI mengirim satu bingkai JPEG terbatas melalui saluran data browsernya saat `describe_view` meminta konteks visual. Google Live mengirim bingkai JPEG terbatas langsung dari browser ke penyedia dengan batas maksimum yang didukung, yaitu satu bingkai per detik, dan menjawab panggilan fungsi `describe_view` dengan status aliran kamera. Bingkai kamera tidak pernah melewati Gateway. Menghentikan Talk akan menutup pratinjau dan melepaskan kedua trek media. Lihat [kemampuan Live API](https://ai.google.dev/gemini-api/docs/live-api/capabilities#video) dan [panduan pemanggilan fungsi](https://ai.google.dev/gemini-api/docs/live-api/tools) Google untuk kontrak komunikasi penyedia.

    Uji asap langsung pengelola: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi jembatan WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan browser Google Live dengan token terbatas beserta bingkai JPEG dan perjalanan pulang-pergi fungsi `describe_view`, serta adaptor browser relai Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status penyedia dan tidak mencatat rahasia.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat proses berjalan aktif, tindak lanjut normal menggunakan mode efektif `messages.queue` milik Gateway. `steer` menyuntikkan ke giliran yang sedang berjalan; mode lain mempertahankan pengiriman antrean persisten milik browser. Penolakan pengarahan juga kembali ke antrean tersebut. Klik **Steer** pada pesan yang diantrekan untuk menyuntikkannya secara manual.
    - **Settings → Appearance → Chat → Follow-ups while the agent is working** dapat mengganti default server tersebut untuk browser saat ini. Halaman menandai penggantian secara eksplisit dan menawarkan **Reset to server default**. `Steer into the active run` mengirim tindak lanjut dengan segera, sedangkan `Queue until the run ends` menahannya hingga proses berjalan selesai.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua proses berjalan yang aktif pada sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial saat pembatalan">
    - Saat proses berjalan dibatalkan, teks parsial asisten masih dapat ditampilkan di UI.
    - Gateway menyimpan teks parsial asisten yang dibatalkan ke dalam riwayat transkrip ketika terdapat output yang disangga.
    - Entri yang disimpan menyertakan metadata pembatalan agar konsumen transkrip dapat membedakan bagian parsial akibat pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Kehilangan koneksi dan penyambungan kembali

Setelah sesi dibuat, koneksi Gateway yang terputus tidak membuat Anda keluar. Dasbor
tetap terlihat dengan pil kuning ambar mengambang "Koneksi Gateway terputus — Menyambungkan kembali…" di bawah bilah
atas sementara klien mencoba kembali secara otomatis dengan jeda bertahap (800 ms hingga 15 s). Pembaruan langsung serta
tindakan realtime/sesi dijeda hingga koneksi kembali; **Retry now** pada pil memaksa
percobaan segera. Chat tetap dapat diedit: pengiriman teks biasa dan lampiran disimpan dalam
penyimpanan browser cakupan gateway/sesi milik tab saat ini, ditampilkan sebagai menunggu penyambungan kembali, dan dikirim
secara otomatis saat Gateway kembali. Kontrol langsung dan perintah garis miring tetap tidak tersedia saat
luring.

Saat browser ini sudah menyimpan kredensial (token/kata sandi yang dikonfigurasi atau token perangkat
yang disetujui), pembukaan pertama dan pemuatan ulang menampilkan tanda OpenClaw kecil beranimasi selama koneksi
dibuat, alih-alih menampilkan gerbang login secara sekilas. Gerbang login hanya muncul ketika belum ada kredensial
yang disimpan atau ketika Gateway secara aktif menolaknya (token/kata sandi salah, pemasangan yang dicabut) —
status yang memerlukan masukan Anda alih-alih menunggu.

## Penginstalan PWA dan push web

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terinstal dengan notifikasi meskipun tab atau jendela browser tidak terbuka.

Di dalam aplikasi macOS, halaman pengaturan Notifications menampilkan izin notifikasi native aplikasi, bukan push browser, karena aplikasi mengirimkan notifikasi secara native.

Jika halaman menampilkan **Protocol mismatch** tepat setelah pembaruan OpenClaw, pertama buka kembali dasbor dengan `openclaw dashboard` dan lakukan penyegaran paksa. Jika masih gagal, hapus data situs untuk asal dasbor atau uji di jendela browser privat; tab lama atau cache service worker browser dapat terus menjalankan bundel Control UI sebelum pembaruan terhadap Gateway yang lebih baru.

| Antarmuka                                         | Fungsinya                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                   | Manifes PWA. Browser menawarkan "Install app" setelah dapat dijangkau.       |
| `ui/public/sw.js`                                  | Service worker yang menangani peristiwa `push` dan klik notifikasi.           |
| `state/openclaw.sqlite` → `web_push_vapid_keys`    | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push.                 |
| `state/openclaw.sqlite` → `web_push_subscriptions` | Endpoint langganan browser, kunci, dan stempel waktu pendaftaran yang disimpan. |

Peningkatan dari penyimpanan `push/vapid-keys.json` dan `push/web-push-subscriptions.json` yang telah dihentikan diimpor oleh `openclaw doctor --fix`. Hentikan Gateway sebelum menjalankan perbaikan tersebut agar proses lama tidak dapat membuat ulang status yang telah dihentikan selama impor. Jalankan perbaikan sebelum menggunakan Web Push setelah peningkatan; pendaftaran, pengiriman, penghapusan, dan resolusi kunci menolak untuk dilanjutkan selama sumber yang telah dihentikan atau klaim Doctor yang terinterupsi masih ada. Runtime Gateway hanya membaca dan menulis SQLite.

Ganti pasangan kunci VAPID melalui variabel lingkungan pada proses Gateway saat Anda ingin menetapkan kunci (deployment multi-host, rotasi rahasia, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `https://openclaw.ai`)

Control UI menggunakan metode Gateway yang dibatasi cakupan berikut untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` mengambil kunci publik VAPID yang aktif.
- `push.web.subscribe` mendaftarkan `endpoint` beserta `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` menghapus endpoint yang terdaftar.
- `push.web.test` mengirimkan notifikasi pengujian ke langganan pemanggil.

<Note>
Web Push tidak bergantung pada jalur relai APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push yang didukung relai) maupun metode `push.test`, yang menargetkan pemasangan perangkat seluler native.
</Note>

## Sematan yang dihosting

Pesan asisten dapat merender konten web yang dihosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikendalikan oleh `gateway.controlUi.embedSandbox`:

Alat inti [`show_widget`](/id/tools/show-widget) merender SVG atau HTML mandiri langsung dari panggilan alat. Browser dan klien chat native yang didukung mengiklankan kemampuan Gateway `inline-widgets`, dan dokumen Canvas yang dihasilkan tetap tersedia saat riwayat chat dimuat ulang. Discord Activities menyediakan nama alat yang sama di Discord; proses berjalan yang berasal dari saluran lain tidak menerimanya.

<Tabs>
  <Tab title="ketat">
    Menonaktifkan eksekusi skrip di dalam sematan yang dihosting.
  </Tab>
  <Tab title="skrip (default)">
    Mengizinkan sematan interaktif sekaligus mempertahankan isolasi asal; biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="tepercaya">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen situs yang sama yang sengaja memerlukan hak istimewa lebih kuat.
  </Tab>
</Tabs>

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Gunakan `trusted` hanya ketika dokumen yang disematkan benar-benar memerlukan perilaku asal yang sama. Untuk sebagian besar game dan kanvas interaktif yang dihasilkan agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL sematan `http(s)` eksternal absolut tetap diblokir secara default. Agar `[embed url="https://..."]` dapat memuat halaman pihak ketiga, atur `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Transkrip chat menggunakan bingkai mudah dibaca yang dipusatkan dan disejajarkan dengan penyusun. Output asisten dan alat tetap rata kiri, sedangkan gelembung pengguna tetap rata kanan di dalam bingkai tersebut. Deployment dengan monitor lebar dapat mengganti lebar transkrip tanpa menambal CSS bawaan dengan mengatur `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Bentuk yang didukung mencakup panjang biasa dan persentase seperti `960px` atau `82%`, serta ekspresi lebar `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)` yang dibatasi.

## Akses tailnet (disarankan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (diutamakan)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve memproksikannya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang dikonfigurasi).

    Secara default, permintaan Control UI/WebSocket Serve dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) ketika `gateway.auth.allowTailscale` adalah `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerimanya ketika permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati proses bolak-balik pemasangan perangkat; browser tanpa perangkat dan koneksi peran node tetap mengikuti pemeriksaan perangkat normal. Tetapkan `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial rahasia bersama eksplisit bahkan untuk lalu lintas Serve, lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, upaya autentikasi yang gagal untuk IP klien dan cakupan autentikasi yang sama diserialkan sebelum penulisan batas laju. Oleh karena itu, percobaan ulang buruk secara bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, alih-alih dua ketidakcocokan biasa yang berpacu secara paralel.

    <Warning>
    Autentikasi Serve tanpa token mengasumsikan host Gateway tepercaya. Jika kode lokal yang tidak tepercaya mungkin berjalan pada host tersebut, wajibkan autentikasi token/kata sandi.
    </Warning>

  </Tab>
  <Tab title="Ikat ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Buka `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi).

    Tempelkan rahasia bersama yang sesuai ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP tidak aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi operator Control UI yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- akses darurat `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang disarankan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal di `https://<magicdns>/` (Serve) atau `http://127.0.0.1:18789/` (pada host Gateway).

<AccordionGroup>
  <Accordion title="Perilaku tombol autentikasi tidak aman">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` hanyalah tombol kompatibilitas lokal:

    - Ini memungkinkan sesi Control UI localhost berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pemasangan.
    - Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

  </Accordion>
  <Accordion title="Khusus akses darurat">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan penurunan keamanan yang parah. Segera kembalikan setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Catatan proksi tepercaya">
    - Autentikasi proksi tepercaya yang berhasil dapat mengizinkan sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI dengan peran node.
    - Proksi balik loopback pada host yang sama tetap tidak memenuhi autentikasi proksi tepercaya; lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI menyediakan kebijakan `img-src` yang ketat: hanya aset **asal yang sama**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif terhadap protokol ditolak oleh browser dan tidak pernah memicu pengambilan jaringan.

Dalam praktiknya:

- Avatar dan gambar yang disajikan melalui jalur relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL `data:image/...` sebaris tetap dirender.
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- Avatar pratinjau tautan GitHub diambil oleh Gateway dari host avatar tetap GitHub dan dikembalikan sebagai URL `data:` dengan ukuran terbatas; browser operator tidak pernah menghubungi host avatar jarak jauh.
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dihapus di helper avatar Control UI dan diganti dengan logo/lencana bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh sembarang dari browser operator.

Fitur ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Ketika autentikasi Gateway dikonfigurasi, endpoint avatar Control UI memerlukan token Gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` hanya mengembalikan gambar avatar kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu rute ditolak (sesuai dengan rute media asisten terkait), sehingga rute avatar tidak dapat membocorkan identitas agen pada host yang dilindungi dengan cara lain.
- Control UI meneruskan token Gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi agar gambar tetap dirender di dasbor.

Jika Anda menonaktifkan autentikasi Gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak terautentikasi, selaras dengan bagian Gateway lainnya.

## Autentikasi rute media asisten

Ketika autentikasi Gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator Control UI normal; browser mengirim token Gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dibatasi untuk jalur sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>`, bukan token atau kata sandi Gateway aktif. Tiket cepat kedaluwarsa dan tidak dapat mengotorisasi sumber lain.

Hal ini menjaga kompatibilitas perenderan media dengan elemen media native browser tanpa menempatkan kredensial Gateway yang dapat digunakan kembali dalam URL media yang terlihat.

## Tautan persetujuan

Notifikasi persetujuan operator dapat menautkan langsung ke dokumen persetujuan mandiri yang disajikan di bawah namespace `${controlUiBasePath}/approve/{approvalId}` yang dicadangkan (misalnya `/approve/<approvalId>`, atau `/openclaw/approve/<approvalId>` dengan jalur dasar yang dikonfigurasi). URL tersebut stabil selama masa berlaku persetujuan dan aman diteruskan antarperangkat Anda sendiri: URL mengidentifikasi persetujuan, tetapi tidak pernah mengotorisasinya.

- Namespace satu segmen `/approve/<approvalId>` dicadangkan oleh Gateway sebelum rute HTTP Plugin untuk **semua** metode HTTP, sehingga rute Plugin tidak pernah dapat membayangi atau mencegat dokumen persetujuan.
- Membuka dokumen persetujuan memerlukan autentikasi Gateway yang sama seperti bagian Control UI lainnya (token/kata sandi, identitas Tailscale Serve, atau identitas proksi tepercaya); kredensial tidak pernah menjadi bagian dari URL persetujuan.
- Ketika penyajian Control UI dinonaktifkan, permintaan ke namespace mengembalikan `404`, alih-alih diteruskan ke handler Plugin.
- Masuk pada dokumen persetujuan bersifat sementara untuk halaman tersebut: tindakan ini tidak menimpa pilihan atau pengaturan Gateway yang disimpan oleh Control UI lengkap di browser yang sama.

Gateway menyajikan berkas statis dari `dist/control-ui`:

```bash
pnpm ui:build
```

Basis absolut opsional (URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pengembangan lokal (server pengembangan terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Halaman Control UI kosong

Jika browser memuat dasbor kosong dan DevTools tidak menampilkan galat yang berguna, ekstensi atau skrip konten awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML biasa yang muncul ketika `<openclaw-app>` tidak terdaftar setelah proses mulai.

Gunakan tindakan **Try again** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan berikut:

- Nonaktifkan ekstensi yang menyuntikkan konten ke semua halaman, khususnya ekstensi dengan skrip konten `<all_urls>`.
- Coba jendela privat, profil browser yang bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dasbor yang sama setelah perubahan browser.

## Debugging/pengujian: server pengembangan + Gateway jarak jauh

Control UI berupa berkas statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari asal HTTP. Ini berguna jika Anda ingin menjalankan server pengembangan Vite secara lokal tetapi Gateway berjalan di tempat lain.

<Steps>
  <Step title="Mulai server pengembangan UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Buka dengan gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autentikasi satu kali opsional (jika diperlukan):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan">
    - `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, enkode nilai tersebut sebagai URL agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server sehingga mencegah kebocoran melalui log permintaan dan Referer. Parameter kueri `?token=` lama tetap diimpor satu kali untuk kompatibilitas, tetapi hanya sebagai fallback, dan segera dihapus setelah bootstrap.
    - `password` hanya disimpan dalam memori.
    - Ketika `gatewayUrl` ditetapkan, UI tidak menggunakan kredensial konfigurasi atau lingkungan sebagai fallback. Berikan `token` (atau `password`) secara eksplisit; tidak adanya kredensial eksplisit merupakan galat.
    - Gunakan `wss://` ketika Gateway berada di belakang TLS (Tailscale Serve, proksi HTTPS, dan sebagainya).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment Control UI publik non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Pemuatan LAN/Tailnet privat dengan origin yang sama dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
    - Saat dimulai, Gateway dapat mengisi origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` berdasarkan pengikatan dan port runtime yang berlaku, tetapi origin browser jarak jauh tetap memerlukan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang dikontrol ketat; ini berarti mengizinkan origin browser apa pun, bukan "cocokkan dengan host apa pun yang sedang saya gunakan."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin header Host, tetapi ini merupakan mode keamanan yang berbahaya.

  </Accordion>
</AccordionGroup>

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detail penyiapan akses jarak jauh: [Akses jarak jauh](/id/gateway/remote).

## Terkait

- [Dasbor](/id/web/dashboard) — dasbor Gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan Gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka percakapan berbasis browser
