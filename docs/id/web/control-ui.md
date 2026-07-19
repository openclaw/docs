---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda ingin akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, aktivitas, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-07-19T16:38:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b6d17673b0a2f02ddf4f6fa0b33ccd1e5db9967833961260d93a1f141dc95981
    source_path: web/control-ui.md
    workflow: 16
---

Control UI adalah aplikasi satu halaman kecil berbasis **Vite + Lit** yang disajikan oleh Gateway:

- bawaan: `http://<host>:18789/`
- awalan opsional: tetapkan `gateway.controlUi.basePath` (misalnya `/openclaw`)

Aplikasi ini berkomunikasi **langsung dengan WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/)).

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

<Note>
Pada pengikatan LAN Windows native, Windows Firewall atau Group Policy yang dikelola organisasi masih dapat memblokir URL LAN yang diumumkan meskipun `127.0.0.1` berfungsi pada host Gateway. Jalankan `openclaw gateway status --deep` pada host Windows; perintah ini melaporkan port yang kemungkinan diblokir, ketidakcocokan profil, dan aturan firewall lokal yang mungkin diabaikan oleh kebijakan.
</Note>

Autentikasi diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas proksi tepercaya saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab peramban saat ini dan URL gateway yang dipilih; kata sandi tidak disimpan secara persisten. Onboarding biasanya menghasilkan token gateway untuk autentikasi rahasia bersama pada koneksi pertama, tetapi autentikasi kata sandi juga berfungsi saat `gateway.auth.mode` bernilai `"password"`.

## Pemasangan perangkat (koneksi pertama)

Menghubungkan dari peramban atau perangkat baru biasanya memerlukan **persetujuan pemasangan satu kali**, yang ditampilkan sebagai `disconnected (1008): pairing required`.

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

Jika peramban mencoba kembali pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat; jalankan kembali `openclaw devices list` sebelum menyetujuinya.

Mengalihkan peramban yang sudah dipasangkan dari akses baca ke akses tulis/admin diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang secara diam-diam: OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang dengan akses yang lebih luas, dan meminta Anda menyetujui kumpulan cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi token, pencabutan, dan alur persetujuan penggunaan pertama Paperclip / `openclaw_gateway`.

<Note>
- Koneksi peramban loopback lokal langsung (`127.0.0.1` / `localhost`) disetujui secara otomatis.
- Tailscale Serve dapat melewati proses bolak-balik pemasangan untuk sesi operator Control UI saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan peramban menyajikan identitas perangkatnya. Peramban tanpa perangkat dan koneksi dengan peran node tetap mengikuti pemeriksaan perangkat normal.
- Pengikatan Tailnet langsung, koneksi peramban LAN, dan profil peramban tanpa identitas perangkat masih memerlukan persetujuan eksplisit.
- Setiap profil peramban menghasilkan ID perangkat unik, sehingga beralih peramban atau menghapus data peramban memerlukan pemasangan ulang.

</Note>

## Pasangkan perangkat seluler

Administrator yang sudah dipasangkan dapat membuat QR koneksi iOS/Android tanpa membuka terminal:

<Steps>
  <Step title="Buka pemasangan seluler">
    Pilih **Perangkat**, lalu klik **Pasangkan perangkat seluler** pada kartu **Perangkat**.
  </Step>
  <Step title="Hubungkan ponsel">
    Di aplikasi seluler OpenClaw, buka **Pengaturan** → **Gateway** dan pindai kode QR. Sebagai alternatif, Anda dapat menyalin dan menempelkan kode penyiapan.
  </Step>
  <Step title="Konfirmasikan koneksi">
    Aplikasi resmi iOS/Android terhubung secara otomatis. Jika **Persetujuan tertunda** menampilkan permintaan, tinjau peran dan cakupannya sebelum menyetujuinya.
  </Step>
</Steps>

Pembuatan kode penyiapan memerlukan `operator.admin`; tombol dinonaktifkan untuk sesi yang tidak memilikinya. Kode penyiapan berisi kredensial bootstrap berumur pendek, jadi perlakukan QR dan kode yang disalin seperti kata sandi selama masih berlaku. Untuk pemasangan jarak jauh, Gateway harus di-resolve ke `wss://` (misalnya, melalui Tailscale Serve/Funnel); `ws://` biasa terbatas pada loopback dan alamat LAN privat. Lihat [Pemasangan](/id/channels/pairing#pair-from-the-control-ui-recommended) untuk detail lengkap tentang keamanan dan fallback.

## Identitas pribadi (lokal peramban)

Control UI mendukung identitas pribadi per peramban (nama tampilan dan avatar) yang dilampirkan pada pesan keluar, untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan peramban, terbatas pada profil peramban saat ini, dan tidak disinkronkan ke perangkat lain atau disimpan secara persisten di sisi server selain metadata kepengarangan transkrip normal pada pesan yang Anda kirim. Menghapus data situs atau beralih peramban akan mengosongkannya kembali.

Penggantian avatar asisten mengikuti pola lokal peramban yang sama: penggantian yang diunggah menimpa identitas yang di-resolve gateway secara lokal dan tidak pernah dikirim bolak-balik melalui `config.patch`. Kolom konfigurasi bersama `ui.assistant.avatar` tetap tersedia bagi klien non-UI yang menulis kolom tersebut secara langsung.

## Endpoint konfigurasi runtime

Control UI mengambil pengaturan runtime-nya dari `/control-ui-config.json`, yang di-resolve secara relatif terhadap jalur dasar Control UI gateway (misalnya `/__openclaw__/control-ui-config.json` di bawah jalur dasar `/__openclaw__/`). Endpoint tersebut dilindungi oleh autentikasi gateway yang sama seperti permukaan HTTP lainnya: peramban yang tidak diautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang valid, identitas Tailscale Serve, atau identitas proksi tepercaya.

## Status host Gateway

Buka **Pengaturan → Umum** untuk melihat kartu **Host Gateway** yang memuat mesin Gateway, alamat LAN, sistem operasi, runtime, waktu aktif, beban CPU, memori, dan ruang disk volume status. Kartu diperbarui setiap 10 detik saat terlihat melalui RPC Gateway `system.info`, yang memerlukan cakupan `operator.read`. Gateway lama dan koneksi tanpa cakupan tersebut tidak menampilkan kartu.

## Dukungan bahasa

Control UI melokalkan dirinya saat pertama kali dimuat berdasarkan lokal peramban Anda. Untuk menggantinya nanti, buka **Pengaturan -> Umum -> Bahasa** (pemilih berada di halaman Umum, bukan di bawah Tampilan).

- Lokal yang didukung: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Terjemahan non-Inggris dimuat secara lambat di peramban.
- Lokal yang dipilih disimpan di penyimpanan peramban dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang tidak tersedia menggunakan bahasa Inggris sebagai fallback.

Terjemahan dokumentasi dibuat untuk kumpulan lokal non-Inggris yang sama, tetapi pemilih bahasa bawaan Mintlify pada situs dokumentasi hanya mencantumkan kode lokal yang diterima Mintlify. Dokumentasi bahasa Thai (`th`) dan Persia (`fa`) tetap dibuat di repo publikasi; dokumentasi tersebut mungkin tidak muncul di pemilih itu hingga Mintlify mendukung kode tersebut.

## Tema tampilan

Panel Tampilan memiliki tema bawaan Claw, Knot, dan Dash (Claw adalah tema bawaan), ditambah satu slot impor tweakcn lokal peramban. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Share**, lalu tempel tautan yang disalin ke Tampilan. Pengimpor juga menerima URL registri `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, jalur relatif `/themes/<id>`, ID tema mentah, dan nama tema bawaan seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil peramban saat ini; tema tersebut tidak ditulis ke konfigurasi gateway dan tidak disinkronkan antarperangkat. Mengganti tema yang diimpor akan memperbarui satu slot lokal tersebut; menghapusnya akan beralih kembali ke Claw jika tema yang diimpor sedang aktif.

Tampilan juga memiliki pengaturan Ukuran teks. Pengaturan ini berlaku untuk teks percakapan, teks penyusun, kartu alat, dan bilah sisi percakapan, serta mempertahankan input teks sekurangnya 16px agar Safari seluler tidak memperbesar tampilan secara otomatis saat input difokuskan.

Tema, mode tema, ukuran teks, bahasa, dan preferensi tampilan percakapan disinkronkan melalui konfigurasi gateway (`ui.prefs`), sehingga mengikuti Anda di seluruh perangkat dan dapat diubah oleh agen melalui gerbang persetujuan — klien yang terhubung menerapkan perubahan secara langsung melalui pemberitahuan `config.changed` milik gateway. Setiap peramban menyimpan salinan lokal untuk pemuatan awal seketika; klien yang tidak dapat menulis konfigurasi (cakupan penampil, luring) mempertahankan perubahan hanya di perangkat. Lihat [Referensi konfigurasi](/id/gateway/configuration-reference#ui).

## Pemeliharaan sistem OpenClaw

Buka **OpenClaw** di bilah sisi untuk berbicara dengan agen penyiapan dan perbaikan sistem. Di luar onboarding, halaman ini dapat menampilkan paling banyak satu chip peristiwa yang dapat ditutup per kunjungan. Halaman tetap diam untuk lalu lintas Gateway rutin dan hanya bereaksi terhadap snapshot kesehatan yang melaporkan pemuat ulang konfigurasi yang dinonaktifkan, koneksi kanal yang dikonfigurasi terputus/menurun, probe kanal yang gagal, atau kredensial kanal yang tidak tersedia. Peristiwa yang lebih baru hanya menggantikan chip tertunda jika tingkat keparahannya lebih tinggi; menutup atau menggunakan chip akan membisukan prompt peristiwa selama kunjungan tersebut. Mengklik chip akan mengirim pertanyaan diagnosisnya sebagai pesan `openclaw.chat` yang sebenarnya, sehingga transkrip mencatat permintaan tersebut dan OpenClaw menjalankan diagnosis. Onboarding tidak pernah menampilkan chip peristiwa ini.

## Kelola Plugin

Buka **Plugin** di bilah sisi, atau gunakan `/settings/plugins` secara relatif terhadap
jalur dasar Control UI yang dikonfigurasi, untuk menelusuri dan mengelola Plugin tanpa meninggalkan
Control UI. Misalnya, jalur dasar `/openclaw` menggunakan
`/openclaw/settings/plugins`. Halaman ini selalu tersedia, bahkan ketika semua
Plugin opsional dinonaktifkan.

Plugin adalah hub dengan empat tab: **Terpasang** dan **Temukan** mengelola kode Plugin
di `/settings/plugins`, **Skills** menyediakan pengelola skill per agen di
`/skills`, dan **Lokakarya** menyediakan review proposal Lokakarya Skill di
`/skills/workshop`. Setiap tab mempertahankan URL-nya sendiri, dan bilah sisi menampilkan
satu entri Plugin untuk semuanya.

Tab **Terpasang** menampilkan inventaris lokal lengkap yang dikelompokkan berdasarkan kategori, dengan
jumlah ringkasan. Setiap baris membuka tampilan detail; menu luapannya (`…`)
mengaktifkan atau menonaktifkan Plugin dan menawarkan **Hapus** untuk Plugin yang dipasang secara eksternal.
Tab ini juga mencantumkan [server MCP](/id/cli/mcp) yang dikonfigurasi dan mendukung penambahan, penonaktifan,
serta penghapusannya secara langsung. Kontrol server yang sama tersedia di **Pengaturan → MCP**.
Tab **Temukan** adalah tokonya: Plugin unggulan yang disertakan bersama OpenClaw,
Plugin eksternal resmi, dan konektor MCP sekali klik untuk layanan populer.
Mengetik di kotak pencarian akan mencari
[ClawHub](https://clawhub.ai/plugins) secara langsung dan menambahkan bagian **Dari ClawHub**
dengan jumlah unduhan dan lencana verifikasi sumber. Tautan dalam dapat
menargetkan toko secara langsung dengan `/settings/plugins?tab=discover`.

Tab **Skills** mempertahankan laporan status skill, tombol aktif/nonaktif, entri kunci
API, dan pencarian skill ClawHub secara langsung, yang dibatasi pada agen yang dipilih. Tab
**Lokakarya** mempertahankan papan Lokakarya Skill dan alur review Hari Ini untuk
[proposal skill](/id/tools/skill-workshop). **Temukan ide skill** meninjau jendela terbatas
dari sesi penting, mulai dari yang terbaru hingga terlama, dan meninggalkan hasil apa pun sebagai
proposal tertunda. Panel menampilkan cakupan kumulatif; **Pindai pekerjaan sebelumnya**
melanjutkan dari kursor yang disimpan, lalu berubah menjadi **Pindai pekerjaan baru** setelah riwayat
lama habis. Review riwayat manual berfungsi saat pembelajaran mandiri otonom
dinonaktifkan dan menggunakan model yang dikonfigurasi untuk agen yang dipilih.

Plugin yang disertakan sudah tersedia di Gateway dan menampilkan **Aktifkan** atau
**Nonaktifkan**, bukan **Pasang**. Misalnya, Workboard disertakan bersama
OpenClaw tetapi dinonaktifkan secara bawaan, sehingga tindakannya adalah **Aktifkan**. Plugin yang dibundel
tidak dapat dihapus, hanya dinonaktifkan.

Membaca katalog dan mencari di ClawHub memerlukan `operator.read`. Menginstal,
mengaktifkan, menonaktifkan, atau menghapus plugin serta mengubah server MCP memerlukan
`operator.admin`; tindakan tersebut tetap dinonaktifkan bagi operator hanya-baca.

Instalasi ClawHub dijalankan melalui Gateway dan tetap menggunakan pemeriksaan kebijakan
kepercayaan, integritas, serta instalasi plugin yang sama seperti instalasi lain yang
dimediasi Gateway. Menginstal atau menghapus kode plugin memerlukan mulai ulang Gateway.
Mengaktifkan atau menonaktifkan plugin yang telah diinstal dapat diterapkan tanpa mulai
ulang jika plugin dan runtime Gateway saat ini mendukungnya; jika tidak, UI melaporkan
bahwa mulai ulang diperlukan. Konektor MCP berbasis OAuth memerlukan satu kali
`openclaw mcp login <name>` dari CLI setelah ditambahkan.

Halaman ini sengaja berfokus pada inventaris, penemuan, instalasi, pengaktifan,
dan penghapusan. Gunakan [`openclaw plugins`](/id/cli/plugins) untuk sumber npm, git, atau
jalur lokal apa pun, pembaruan, dan konfigurasi plugin tingkat lanjut.

## Aplikasi dan ekstensi

Buka **Aplikasi** dari menu **Lainnya** di bilah samping, palet perintah, atau
menu agen di bilah samping (**Dapatkan aplikasi**), atau gunakan `/apps` relatif terhadap
jalur dasar UI Kontrol yang dikonfigurasi. Halaman ini mengumpulkan tautan instalasi untuk setiap
permukaan pendamping OpenClaw: aplikasi [iOS](/id/platforms/ios) dan
[Android](/id/platforms/android), pendamping Apple Watch dan Wear OS yang
disertakan bersamanya, aplikasi desktop [macOS](/id/platforms/macos), [Windows](/id/platforms/windows),
dan [Linux](/id/platforms/linux),
[ekstensi Chrome](/id/tools/chrome-extension), pusat Plugin dalam aplikasi dengan
[ClawHub](https://clawhub.ai), serta komunitas Discord dan dokumentasi.

## Navigasi bilah samping

Bilah samping mengatur semuanya di sekitar agen. Baris identitas di bagian atas adalah agen aktif; di bawahnya, bagian **Halaman** dimulai dengan **Beranda** — sesi utama agen yang terus berjalan, dengan lencana status belum dibaca atau sedang berjalan — diikuti tujuan yang disematkan (**Penggunaan**, **Otomatisasi**, dan **Plugin** secara default). Kontrol penyesuaian pada tajuk Halaman membuka menu berisi setiap tujuan lainnya, termasuk tab yang disediakan plugin, beserta **Edit item yang disematkan**; mengeklik kanan area navigasi langsung membuka editor sematan. Daftar sesi di bawahnya dibagi menjadi beberapa zona: **Utas** untuk sesi obrolan agen (sesi utama tetap berada di balik Beranda; sesi yang dibuatnya muncul di sini sebagai utas tingkat atas, dan utas bernama ditampilkan tanpa prefiks jenis), **Grup** untuk percakapan grup dan ruang, serta **Pengodean** untuk sesi yang terikat pada worktree terkelola atau node eksekusi (baris menampilkan satu baris `repo ⎇ branch` beserta host node), sesi harness yang didukung ACP, serta katalog CLI Codex/Claude. Pengodean dimulai dalam keadaan diciutkan saat pertama kali dijalankan dan mengingat pilihan Anda; tajuknya saat diciutkan mempertahankan jumlah sebenarnya dan menampilkan indikator berjalan selama sesi di dalamnya bekerja. Grup khusus (`category` sesi) dan baris **Disematkan** berada di atas Utas, dan penetapan sesi ke grup khusus selalu mengesampingkan klasifikasi zona otomatis. Tajuk Utas memuat kontrol pengurutan (Dibuat atau Terakhir diperbarui, beserta tombol pengalih Kelompokkan berdasarkan) serta **+** yang membuka halaman Sesi baru. Membuka sesi memindahkan sorotan pilihan tanpa mengubah urutan baris. Sesi induk dengan proses turunan terbaru menampilkan pengungkapan dan jumlah turunan; perluas untuk memeriksa sesi turunan bertingkat, status langsung atau terminal, dan runtime tanpa meninggalkan bilah samping. Memilih turunan membuka obrolannya dan secara otomatis menampilkan jalur leluhurnya. Baris turunan tetap berada di luar pengelompokan akar, penyematan, penyeretan, multipilihan, dan paginasi; zona yang diciutkan tidak menggunakan anggaran halaman yang terlihat. Sesi dengan aktivitas baru sejak terakhir dibaca menampilkan titik belum dibaca, dan membukanya menandainya sebagai telah dibaca. Status siklus hidup pekerja cloud menggunakan lencana globe; sesi lokal dan yang diklaim kembali tidak menampilkan lencana penempatan karena eksekusi lokal merupakan default. Setiap baris sesi akar memiliki menu konteks (tombol kebab atau klik kanan) dengan Sematkan/Lepas sematan, Tandai sebagai belum dibaca/telah dibaca, Ganti nama, Fork, Pindahkan ke grup (termasuk Grup baru dan Hapus dari grup), Arsipkan, dan Hapus; tata letak sentuh menjaga agar kontrol sematan langsung dan menu tetap terlihat. Cmd/Ctrl-klik mengalihkan baris akar ke multipilihan dan Shift-klik memperluasnya mengikuti urutan yang terlihat; membuka menu pada baris yang dipilih kemudian menawarkan tindakan massal (Tandai N sebagai belum dibaca/telah dibaca, Pindahkan N ke grup, Arsipkan N, Hapus N) yang diterapkan pada setiap sesi terpilih, dengan satu konfirmasi untuk penghapusan massal. Seret sesi akar ke **Disematkan** untuk menyematkannya, atau ke grup khusus untuk memindahkannya. Tajuk grup khusus dapat diciutkan, diperluas, atau diseret untuk mengubah urutannya; nama grup dan urutannya disimpan di gateway (`sessions.groups.*`), sehingga mengikuti Anda di berbagai peramban, sedangkan status diciutkan tetap berada di profil peramban. Tajuk grup juga memiliki menu (tombol kebab atau klik kanan) dengan Ganti nama grup, Grup baru, dan Hapus grup; mengganti nama atau menghapus grup memperbarui setiap sesi anggota di sisi server, termasuk yang diarsipkan, dan menghapus grup mempertahankan sesinya serta memindahkannya kembali ke Utas.

## Halaman sesi baru

Tombol **+** pada tajuk daftar sesi di bilah samping membuka draf satu halaman penuh di `/new`: tidak ada yang dibuat hingga Anda mengirim pesan pertama. Baris target di atas kotak pesan memilih tempat sesi bekerja: agen (penyiapan multiagen), tempat eksekusi dijalankan (**Gateway · lokal** atau node yang dipasangkan dan menyediakan `system.run`; memerlukan `operator.admin`), folder (default-nya adalah ruang kerja agen; jalur absolut Gateway lainnya memerlukan `operator.admin` dan worktree), serta tombol pengalih **Worktree** opsional dengan pemilih cabang dasar (didukung oleh `worktrees.branches`, sehingga tidak terjadi pengambilan) dan nama worktree opsional (cabang menjadi `openclaw/<name>`). Footer penyusun memilih model dan tingkat penalaran sesi baru, dan permulaan cloud mempertahankan kedua pilihan sebelum mengirimkan sesi ke pekerjanya. Tombol telusuri pada chip folder membuka pemilih direktori sebaris yang didukung oleh metode khusus admin `fs.listDir`. Tingkat teratasnya menampilkan Gateway dan setiap node yang diketahui; node luring dan node tanpa dukungan penelusuran direktori tetap terlihat tetapi dinonaktifkan. Memilih Gateway dimulai dari folder saat ini atau direktori utama Gateway. Memilih node yang mendukung menelusuri sistem berkas host node tersebut, mengikat eksekusi kepadanya, dan menggunakan jalur absolut node yang dipilih secara langsung (worktree terkelola tetap hanya tersedia di Gateway). Pengiriman memanggil `sessions.create` dengan pesan pertama, sehingga proses dimulai dalam perjalanan bolak-balik yang sama dan UI berpindah ke obrolan sesi baru. Jika Gateway membuat sesi tetapi menolak pengiriman pertama tersebut, obrolan mempertahankan prompt dan galat setelah pemuatan ulang; **Coba lagi** mengirimkannya melalui sesi yang sudah dibuat alih-alih membuat sesi lain.

Di dalam **Pengaturan**, bilah samping khusus dimulai dengan bidang **Cari pengaturan** untuk menemukan bagian pengaturan dengan cepat.

Bidang **Cari** di bagian atas bilah samping membuka palet perintah (⌘K). Mengeklik baris identitas agen di bagian atas bilah samping membuka menu agen; **Beranda** membuka sesi utama. Saat sesuatu memerlukan tindakan — tugas cron yang gagal atau terlambat, autentikasi model yang akan atau telah kedaluwarsa — chip perhatian ringkas muncul di atas footer bilah samping dan dapat diklik untuk membuka halaman pemiliknya. Baris identitas menampilkan avatar agen (gambar identitas atau emoji), nama, titik koneksi, dan subtitel langsung. Mengekliknya membuka menu agen: pengalih agen (penyiapan multiagen), "Apa yang dapat dilakukan agen ini?", **Pengaturan agen**, **Pengaturan**, pemasangan perangkat seluler, **Dokumentasi**, chip build, dan tombol pengalih mode warna. Daftar berisi lebih dari sepuluh agen mendapatkan bidang filter dan mencantumkan agen yang disematkan terlebih dahulu; sematkan atau lepas sematan agen dari halaman pengaturan Agen, dengan kumpulan yang disematkan disimpan dalam profil peramban. Memilih agen membatasi Obrolan beserta Penggunaan, Otomatisasi, Tugas, Papan kerja, dan Sesi ke agen tersebut. Setiap halaman terbatas menyediakan kontrol **Agen** dengan **Semua agen** sebagai jalan keluar; ini memperluas cakupan halaman bersama tanpa mengubah agen obrolan yang konkret, sedangkan tautan sesi langsung tetap membuka targetnya. Halaman pengaturan Agen mempertahankan pilihan `?agent=` sendiri dan tidak mengikuti cakupan halaman bersama. Bilah footer memuat logo produk, chip build, titik koneksi gateway, dan pintasan Pengaturan. Saat gateway dijalankan dari checkout sumber pada cabang selain `main`, footer juga menampilkan nama cabang tersebut dalam warna merah agar gateway nonrilis terlihat jelas sekilas (instalasi rilis tidak pernah menampilkannya). Shift-Command-Comma membuka **Pengaturan** tanpa mengganti pintasan Command-Comma milik peramban. Tajuk bilah samping juga memuat tombol pengalih penciutan (⌘B); menciutkan menyembunyikan bilah samping sepenuhnya untuk ruang kerja selebar penuh, dan kontrol perluas mengambang (atau ⌘B) menampilkannya kembali; sebagai gantinya, aplikasi macOS menempatkan tombol pengalih tersebut secara native di bilah judul. Bilah samping adalah satu-satunya elemen navigasi di desktop, tanpa bilah atas. Area pandang sempit mengganti bilah samping dengan panel geser di balik baris tajuk ringkas yang memuat tombol pengalih panel, merek, dan pencarian palet perintah; di ponsel, Obrolan menyerap baris navigasi tersebut ke dalam bilah judulnya, dengan kontrol menu dan pencarian di samping judul sesi. Di aplikasi macOS, baris tajuk terpisah menggabungkan ruang kosong bilah judul ke dalam satu strip ringkas di samping kontrol jendela. Navigasi menggunakan riwayat peramban biasa, sehingga tombol mundur/maju peramban menelusurinya; aplikasi macOS menambahkan tombol pengalih bilah samping native di sebelah kontrol jendela beserta gestur usap trackpad, dengan tombol mundur/maju di tepi kanan bilah samping saat diperluas serta tombol pencarian native (palet perintah) dan sesi baru saat diciutkan.

Persetujuan yang tertunda juga menambahkan chip perhatian di atas footer bilah samping;
pilih chip tersebut untuk membuka halaman Persetujuan yang memilikinya.

## Yang dapat dilakukannya (saat ini)

<AccordionGroup>
  <Accordion title="Obrolan dan Percakapan">
    - Mengobrol dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat obrolan meminta jendela terbaru yang dibatasi dengan batas teks per pesan, sehingga sesi besar tidak memaksa browser merender seluruh payload transkrip sebelum obrolan dapat digunakan.
    - Mengarahkan penunjuk atau memfokuskan dengan papan ketik pada tautan isu atau pull request GitHub publik akan menampilkan status, judul, penulis, aktivitas terbaru, komentar, dan statistik perubahannya. Gateway yang terhubung mengambil dan menyimpan metadata publik dalam cache tanpa mengubah target tautan, termasuk saat UI menggunakan Gateway jarak jauh. Gateway menggunakan `GH_TOKEN` atau `GITHUB_TOKEN` jika tersedia, setelah memastikan repositori tersebut bersifat publik; jika tidak, Gateway menggunakan API anonim GitHub dengan cache yang lebih lama.
    - Berbicara melalui sesi waktu nyata browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan plugin suara waktu nyata khusus backend menggunakan transportasi relai Gateway. Sesi browser yang mendukung video dapat memilih kamera lokal perangkat di Settings atau beralih kamera dari pratinjau langsung; browser mengambil bingkai JPEG untuk penyedia waktu nyata tanpa mengalirkan video kamera melalui Gateway. Sesi penyedia yang dimiliki klien dimulai dengan `talk.client.create`; sesi relai Gateway dimulai dengan `talk.session.create`. Relai menyimpan kredensial penyedia di Gateway sementara browser mengalirkan PCM mikrofon melalui `talk.session.appendAudio`, meneruskan panggilan alat penyedia `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar, serta merutekan pengarahan suara untuk eksekusi aktif melalui `talk.client.steer` atau `talk.session.steer`.
    - Mengalirkan panggilan alat dan kartu keluaran alat langsung di Obrolan (peristiwa agen). Aktivitas alat dirender sebagai baris yang disesuaikan dengan jenisnya: perintah shell menampilkan perintah dengan penyorotan sintaks beserta keluaran bergaya terminal; panggilan edit dan tulis yang didukung menampilkan diff sebaris yang dibatasi, nomor baris jika tersedia, dan statistik `+added -removed`; serta panggilan berturut-turut diringkas menjadi ikhtisar seperti "Menjalankan 13 perintah, membaca 6 berkas, mengedit 9 berkas". Saat eksekusi berlangsung, panggilan terbaru yang sedang berjalan menjadi nama tajuk grup. Perluas baris untuk memeriksa argumen yang tersisa dan keluaran mentahnya.
    - Judul tujuan AI opsional untuk panggilan alat yang kompleks (perintah shell panjang, alat plugin dengan banyak argumen), diaktifkan dengan `gateway.controlUi.toolTitles: true` (nonaktif secara default). Judul berasal dari metode `chat.toolTitles` yang diproses secara batch melalui perutean model utilitas standar — `utilityModel` eksplisit (penyedia pilihan operator, seperti tugas utilitas lainnya), atau jika tidak ada, default model kecil yang dideklarasikan penyedia sesi — dan disimpan dalam cache di sisi Gateway per agen. Saat pilihan ikut serta dinonaktifkan atau tidak ada model berbiaya rendah yang dapat digunakan, baris mempertahankan label deterministiknya dan tidak ada panggilan model yang dilakukan.
    - Memulai atau menutup tugas tindak lanjut sementara yang disarankan model; saran yang diterima membuka sesi worktree terkelola baru dengan prompt yang diusulkan.
    - Tab Aktivitas dengan ringkasan aktivitas alat langsung yang disimpan secara lokal di browser dan mengutamakan redaksi, dari pengiriman `session.tool` / peristiwa alat yang sudah ada.

  </Accordion>
  <Accordion title="Channel, sesi, memori">
    - Channel: status channel bawaan serta Plugin yang dibundel/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran pemeriksaan channel tetap menampilkan snapshot sebelumnya selama pemeriksaan penyedia yang lambat berlangsung, dan memberi label pada snapshot parsial ketika pemeriksaan atau audit melampaui batas waktu UI.
    - Utas (halaman ruang kerja di `/sessions`, dengan tab **Worktrees** di sebelahnya): secara default mencantumkan sesi agen yang dikonfigurasi, menyematkan sesi yang sering digunakan, mengganti namanya, mengarsipkan atau memulihkan sesi yang tidak aktif, beralih dari kunci sesi agen lama yang tidak dikonfigurasi, serta menerapkan penggantian model/pemikiran/cepat/verbose/trace/penalaran per sesi (`sessions.list`, `sessions.patch`). Sesi yang disematkan diurutkan di atas sesi terbaru yang tidak disematkan; sesi yang diarsipkan berada di tampilan arsip halaman Utas dan tetap menyimpan transkripnya. Baris menampilkan titik belum dibaca untuk sesi yang memiliki aktivitas sejak terakhir dibaca, dengan tindakan tandai-belum-dibaca/tandai-sudah-dibaca (`sessions.patch { unread }`), serta tindakan Percabangkan yang mencabangkan transkrip menjadi sesi baru (`sessions.create { parentSessionKey, fork: true }`). Ubin ringkasan di atas tabel merangkum daftar yang dimuat (jumlah sesi, proses langsung, sesi belum dibaca, total token), setiap baris memiliki glif jenis dengan titik proses langsung, status ditampilkan sebagai titik biasa beserta label, dan kolom Token menampilkan pengukur penggunaan jendela konteks ketika sesi melaporkan ukuran token dan konteks. Tindakan pengelolaan baris berada dalam menu per baris (tombol kebab atau klik kanan) yang mencerminkan menu sesi bilah sisi, dan panel tarik baris menampilkan runtime agen serta durasi proses bersama detail sesi lainnya.
    - Katalog bilah sisi Claude dan Codex native melakukan streaming satu host pada satu waktu, lalu melakukan rekonsiliasi setelah perubahan konektivitas node, saat halaman mendapat fokus, dan paling sering setiap 30 detik selama terlihat. Perubahan katalog memicu putaran tindak lanjut yang lebih cepat, sehingga sesi yang dibuat di alat native muncul tanpa memuat ulang UI Kontrol.
    - Pengelompokan sesi: kontrol Kelompokkan berdasarkan mengatur tabel sesi menjadi beberapa bagian berdasarkan grup khusus, channel, jenis, agen, atau tanggal. Grup khusus dipertahankan per sesi melalui `sessions.patch` (`category`), sehingga sesi yang dimulai dari channel pesan (Discord, Telegram, WhatsApp, ...) juga dapat dikategorikan; tetapkan grup dengan menyeret baris ke suatu bagian, atau dengan pemilih grup per baris, dan buat grup dengan tindakan Grup baru.
    - Memori (tab pada halaman Agen, dengan cakupan agen yang dipilih): status Dreaming, tombol aktifkan/nonaktifkan, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
    - Impor Memori (`/memory-import`, diakses dari tab Memori pada halaman Agen): pratinjau dan salin memori otomatis Claude Code lokal, memori terkonsolidasi Codex, atau berkas memori Hermes ke ruang kerja agen yang dipilih (`migrations.memory.plan`, `migrations.memory.apply`).
    - Penawaran memori saat orientasi awal: ketika UI Kontrol dibuka dalam mode orientasi awal (`?onboarding=1`, digunakan oleh aplikasi pendamping Linux setelah instalasi pertama), dialog satu halaman menawarkan impor memori yang terdeteksi dengan alur rencanakan/terapkan yang sama; melewatinya menjadikan halaman pengaturan sebagai titik masuk berikutnya.

  </Accordion>
  <Accordion title="Cron, tugas, Plugin, Skills, perangkat, persetujuan eksekusi">
    - Otomatisasi (tugas cron): kartu statistik (jumlah otomatisasi, jumlah kegagalan, status penjadwal, waktu aktif berikutnya) di atas pengalih tab Otomatisasi/Riwayat proses; tab Otomatisasi mencantumkan tugas dalam tabel yang dapat difilter (Semua/Aktif/Dijeda, pencarian, filter jadwal dan proses terakhir, menu tindakan per baris) dengan saran awal di bawahnya, dan tab Riwayat proses menampilkan proses terbaru di semua otomatisasi (`cron.*`).
    - Tugas: buku besar langsung untuk tugas latar belakang yang aktif dan terbaru, dengan sesi tertaut dan pembatalan (`tasks.*`). Panel Tugas latar belakang di Chat mengelompokkan pekerjaan yang sedang berjalan dan telah selesai; pilih baris untuk memeriksa prompt terbatas dan output atau ringkasan kesalahannya.
    - Plugin: telusuri inventaris yang terinstal dan toko pilihan, cari di ClawHub, instal dan hapus kode Plugin, serta aktifkan atau nonaktifkan Plugin yang terinstal (`plugins.*`); baris server MCP mengedit `mcp.servers` melalui metode konfigurasi.
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Perangkat: satu inventaris menggabungkan catatan perangkat yang dipasangkan, katalog node, dan keberadaan langsung (`device.pair.list`, `node.list`, `system-presence`). Host Gateway disematkan di urutan pertama; klien yang dipasangkan menampilkan status koneksi, peran, token, kemampuan, dan perintah. Pemasangan duplikat digabungkan ke dalam grup yang dapat diperluas, dan **Bersihkan N yang tidak aktif** menghapus secara massal duplikat luring yang dikonfirmasi admin dan disetujui secara otomatis (lokal tanpa pemberitahuan, CIDR tepercaya, atau terverifikasi SSH) atau yang ada sebelum asal persetujuan. Entri dapat dihapus (`node.pair.remove`, `device.pair.remove`), pemasangan perangkat dan persetujuan ulang node ditangani secara langsung (`device.pair.*`, `node.pair.approve`/`reject`), dan kode penyiapan perangkat seluler dibuat dari kartu yang sama.
    - Persetujuan eksekusi: edit daftar izin Gateway atau node dan kebijakan permintaan untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Navigasi pengaturan mengelompokkan halaman berdasarkan perhatian: Umum, Tampilan, dan Notifikasi di bagian atas; Koneksi (Koneksi, Saluran, Komunikasi, Perangkat); Agen & Alat (Agen, AI & Agen, Penyedia Model, MCP, Otomasi, Lab); Privasi & Keamanan (Keamanan, Persetujuan); dan Sistem (Infrastruktur, Lanjutan, Debug, Log, Tentang). Umum adalah pusat ringkas yang berisi default model, bahasa, dan statistik host Gateway; setiap pengaturan lainnya berada tepat di satu halaman.
    - Privasi & Keamanan: baris terkurasi untuk autentikasi Gateway, kebijakan eksekusi, pengaktifan browser, profil alat, autentikasi perangkat, dan pemasangan perangkat seluler, di atas bagian `security`/`approvals` yang didukung skema.
    - Persetujuan mencakup riwayat 30 hari yang diurutkan dari terbaru untuk permintaan eksekusi, plugin, dan agen sistem yang telah diselesaikan. Filter berdasarkan jenis atau telusuri halaman baris yang lebih lama untuk meninjau keputusan, alasan, sesi sumber, dan atribusi penyelesai yang dicatat oleh Gateway.
    - Lab menampilkan sakelar eksperimental yang telah dirilis. Mode Kode adalah entri saat ini dan langsung menyimpan `tools.codeMode.enabled`; eksperimen yang belum dirilis tidak ditampilkan atau menulis kunci konfigurasi spekulatif.
    - Notifikasi: status web-push browser, berlangganan/berhenti berlangganan, dan pengiriman percobaan.
    - Lanjutan: setiap bagian konfigurasi yang tidak memiliki halaman khusus terkurasi, ditambah editor JSON5 mentah (sebelumnya mode Lanjutan pada halaman Umum).
    - Penyiapan Model (`/settings/model-setup`) adalah subhalaman Penyedia Model yang dibuka dari headernya.
    - Agen: halaman pengaturan (**Pengaturan → Agen**, `/settings/agents`) dengan tab per agen (Ikhtisar, File, Alat, Skills, Saluran, Otomasi, Memori). Tab Ikhtisar mengedit identitas agen — nama tampilan, emoji, dan gambar avatar yang diperkecil serta dibatasi ukurannya di browser sebelum `agents.update`. Penyimpanan menyimpan bidang identitas yang dikonfigurasi dan mencerminkannya ke `IDENTITY.md` ruang kerja; nilai yang dikonfigurasi lebih diutamakan daripada pengeditan manual pada bidang file yang sama.
    - Profil: halaman pengaturan yang menampilkan identitas agen default beserta statistik penggunaan sepanjang waktu — total token sepanjang masa, hari puncak, sesi terpanjang, rentetan aktivitas, peta panas token selama setahun, alat teratas, dan sorotan saluran (`usage.cost`, `sessions.usage`).
    - MCP memiliki halaman pengaturan khusus dengan baris server (transport, status aktif, ringkasan OAuth/filter/paralel), kontrol langsung untuk menambah/mengaktifkan/menonaktifkan/menghapus, perintah operator umum, dan editor konfigurasi `mcp` yang tercakup. Halaman Plugin tetap menjadi tempat untuk konektor sekali klik dan penemuan.
    - Penyedia Model: halaman pengaturan yang mencantumkan setiap penyedia model yang dikonfigurasi beserta ikon mereknya, status autentikasi (`models.authStatus`), ketersediaan model (`models.list`), data paket/kuota/penagihan langsung jika dilaporkan oleh penyedia (`usage.status`), dan pengeluaran sesi lokal selama 30 hari terakhir (`sessions.usage`). Tindakan Segarkan membaca ulang status kredensial dan penggunaan penyedia.
    - Koneksi: halaman pengaturan (di bawah **Koneksi**) yang mengelola tautan Gateway milik dasbor — URL WebSocket, token Gateway, kata sandi, dan kunci sesi default — beserta cuplikan handshake terbaru (status, waktu aktif, interval tick, penyegaran saluran terakhir). Gerbang login luring menangani kondisi terputus; halaman ini mengedit koneksi saat terhubung.
    - Terapkan dan mulai ulang dengan validasi (`config.apply`), lalu aktifkan sesi terakhir yang aktif.
    - Penulisan menyertakan pelindung hash dasar untuk mencegah penimpaan pengeditan serentak.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) memeriksa terlebih dahulu resolusi SecretRef aktif untuk referensi dalam payload konfigurasi yang dikirimkan; referensi aktif yang dikirimkan tetapi tidak terselesaikan ditolak sebelum penulisan.
    - Penyimpanan formulir membuang placeholder tersamarkan usang yang tidak dapat dipulihkan dari konfigurasi tersimpan, sekaligus mempertahankan nilai tersamarkan yang masih dipetakan ke rahasia tersimpan.
    - Skema dan rendering formulir berasal dari `config.schema` / `config.schema.lookup`, termasuk `title`/`description` bidang, petunjuk UI yang cocok, ringkasan turunan langsung, metadata dokumentasi pada simpul objek bertingkat/wildcard/larik/komposisi, serta skema plugin dan saluran jika tersedia. Editor JSON mentah hanya tersedia jika cuplikan mendukung perjalanan pulang-pergi mentah yang aman; jika tidak, UI Kontrol memaksakan mode Formulir.
    - "Reset ke yang tersimpan" pada editor JSON mentah mempertahankan bentuk yang dibuat secara mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang cuplikan yang diratakan, sehingga pengeditan eksternal tetap bertahan setelah reset jika cuplikan dapat melakukan perjalanan pulang-pergi dengan aman.
    - Nilai objek SecretRef terstruktur dirender hanya-baca dalam input teks formulir untuk mencegah kerusakan objek-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Penggunaan">
    - Analisis token dan perkiraan biaya yang berasal dari sesi tetap terpisah dari penagihan penyedia.
    - Kartu penyedia memanggil `usage.status` dan menampilkan nama paket langsung, jendela kuota, saldo, pengeluaran, dan anggaran yang dilaporkan oleh plugin penyedia yang dikonfigurasi.
    - Kegagalan penggunaan penyedia tidak memblokir dasbor sesi/biaya; kartu penyedia yang tidak tersedia menampilkan status kesalahannya sendiri.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: cuplikan status/kesehatan/model, log peristiwa, dan panggilan RPC manual (`status`, `health`, `models.list`).
    - Log peristiwa mencakup waktu penyegaran UI Kontrol/RPC, waktu rendering chat/konfigurasi yang lambat, dan entri responsivitas browser untuk frame animasi atau tugas yang berjalan lama ketika browser menyediakan jenis entri PerformanceObserver tersebut.
    - Log: tail langsung log file Gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan paket/git dan mulai ulang (`update.run`) beserta laporan mulai ulang, lalu lakukan polling `update.status` setelah tersambung kembali untuk memverifikasi versi Gateway yang sedang berjalan.

  </Accordion>
  <Accordion title="Catatan panel otomasi">
    - Memilih baris akan membuka tampilan detail satu halaman penuh dengan sakelar Aktif/Dijeda dan Jalankan sekarang di header (jalankan-jika-jatuh-tempo, kloning, dan hapus di menunya); tab Pengaturan mengedit otomasi langsung di tempat (prompt, detail, frekuensi, penggantian lanjutan) dan tab Riwayat eksekusi menampilkan eksekusi otomasi tersebut.
    - Otomasi awal di bawah tabel mengisi formulir pembuatan terlebih dahulu dengan prompt dan jadwal yang dapat diedit.
    - Untuk tugas terisolasi, pengiriman secara default berupa pengumuman ringkasan; ubah ke tanpa pengiriman untuk eksekusi internal saja.
    - Bidang saluran/target muncul saat pengumuman dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` yang diatur ke URL webhook HTTP(S) yang valid.
    - Untuk tugas sesi utama, mode pengiriman webhook dan tanpa pengiriman tersedia.
    - Kontrol pengeditan lanjutan mencakup hapus-setelah-eksekusi, hapus penggantian agen, opsi tepat/tersebar Cron, penggantian model/pemikiran agen, dan sakelar pengiriman upaya terbaik.
    - Validasi formulir ditampilkan langsung dengan kesalahan tingkat bidang; nilai yang tidak valid menonaktifkan tombol simpan hingga diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header autentikasi.
    - `cron.webhook` adalah fallback lama yang telah dihentikan dan ditolak oleh validasi konfigurasi saat ini. Jalankan `openclaw doctor --fix` untuk memigrasikan pekerjaan tersimpan yang masih menggunakan `notify: true` ke webhook eksplisit per pekerjaan atau pengiriman penyelesaian, lalu hapus kunci lama.

  </Accordion>
</AccordionGroup>

## Impor memori asisten

Buka **Pengaturan** → **Impor Memori** untuk membawa memori lokal Codex atau Claude Code
ke agen OpenClaw. Gateway menemukan sendiri memori lokal yang didukung pada
host-nya, sehingga UI Kontrol jarak jauh mengimpor dari komputer Gateway, bukan dari
komputer browser.

1. Pilih agen tujuan.
2. Tinjau koleksi sumber dan nama file Markdown yang terdeteksi. Isi file
   tidak dikirim dalam respons rencana atau ditampilkan di halaman.
3. Pilih koleksi yang akan diimpor dan konfirmasikan. Penerapan menyusun ulang rencana sebelum
   menulis agar pilihan usang gagal dengan aman.
4. Jika file sudah ada, aktifkan **Ganti impor yang ada**, segarkan
   pratinjau, lalu konfirmasikan penggantian.

Codex hanya mengimpor `MEMORY.md` dan `memory_summary.md` terkonsolidasinya. Claude
Code mengimpor Markdown dari direktori memori otomatis proyek dan
`autoMemoryDirectory` yang dikonfigurasi; halaman ini tidak mengimpor sesi, pengaturan, instruksi, atau
kredensial. File disalin ke bawah `memory/imports/` di ruang kerja
yang dipilih, tempat plugin memori aktif dapat mengindeksnya. Sumber tidak
pernah diubah.

Perencanaan dan penerapan memerlukan `operator.admin`. Setiap penerapan membuat cadangan
OpenClaw terverifikasi ketika terdapat status, menulis laporan migrasi tersamarkan, dan menyimpan
cadangan tingkat item sebelum mengganti file tujuan yang ada. Lihat
[Ikhtisar memori](/id/concepts/memory#import-from-coding-assistants) untuk jalur dan
perilaku pemanggilan kembali.

## Halaman MCP

Halaman MCP khusus adalah tampilan operator untuk server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Halaman ini tidak memulai transport MCP dengan sendirinya; gunakan untuk memeriksa dan mengedit konfigurasi tersimpan, lalu gunakan `openclaw mcp doctor --probe` ketika Anda memerlukan bukti server langsung.

Alur kerja umum:

1. Buka **MCP** dari bilah sisi.
2. Periksa kartu ringkasan untuk jumlah server total, aktif, OAuth, dan terfilter.
3. Tinjau setiap baris server untuk transport, status aktif, autentikasi, filter, batas waktu, dan petunjuk perintah.
4. Tambah, aktifkan, nonaktifkan, atau hapus server langsung di halaman MCP. Gunakan halaman **Plugin** untuk konektor sekali klik dan penemuan.
5. Edit bagian konfigurasi `mcp` yang tercakup untuk definisi server, header, jalur TLS/mTLS, metadata OAuth, filter alat, dan metadata proyeksi Codex.
6. Gunakan **Simpan** untuk penulisan konfigurasi, atau **Simpan & Publikasikan** ketika Gateway yang berjalan harus menerapkan konfigurasi yang diubah.
7. Jalankan `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, atau `openclaw mcp reload` dari terminal untuk diagnostik statis, bukti langsung, atau pembuangan runtime yang di-cache.

Halaman ini menyamarkan nilai mirip URL yang mengandung kredensial sebelum rendering dan mengapit nama server dengan tanda kutip dalam cuplikan perintah agar perintah yang disalin tetap berfungsi dengan spasi atau metakarakter shell. Referensi lengkap CLI dan konfigurasi: [MCP](/id/cli/mcp).

## Tab Aktivitas

Tab Aktivitas berada di **Pengaturan › Sistem**, di samping Log dan Debug. Tab ini adalah pengamat sementara yang bersifat lokal pada browser untuk aktivitas alat langsung, yang berasal dari aliran `session.tool` Gateway/peristiwa alat yang sama yang mendukung kartu alat Chat. Tab ini tidak menambahkan keluarga peristiwa Gateway lain, endpoint, penyimpanan aktivitas tahan lama, umpan metrik, atau aliran pengamat eksternal.

Entri Aktivitas hanya menyimpan ringkasan yang disanitasi serta pratinjau keluaran yang disamarkan dan dipotong. Nilai argumen alat tidak disimpan dalam status Aktivitas; UI menunjukkan bahwa argumen disembunyikan dan hanya mencatat jumlah bidang argumen. Daftar dalam memori mengikuti tab browser saat ini, tetap ada selama navigasi di dalam UI Kontrol, dan direset saat halaman dimuat ulang, sesi diganti, atau **Hapus**.

## Terminal operator

Terminal operator yang dapat ditambatkan dinonaktifkan secara default. Untuk mengaktifkannya, atur `gateway.terminal.enabled: true` dan mulai ulang Gateway. Terminal memerlukan koneksi `operator.admin` dan membuka PTY host di ruang kerja agen aktif. Tab baru mengikuti agen chat yang sedang dipilih.

<Warning>
Terminal adalah shell host tanpa pembatasan dan mewarisi lingkungan proses Gateway. Aktifkan hanya untuk penerapan operator tepercaya. OpenClaw menolak sesi terminal untuk agen dengan `sandbox.mode: "all"`; mengubah agen aktif ke mode tersebut akan menutup sesi terminalnya yang sudah ada dan yang sedang berlangsung.
</Warning>

Gunakan **Ctrl + backtick** untuk mengaktifkan atau menonaktifkan panel dok. Tata letak mendukung dok di bawah dan kanan, menyesuaikan ukuran dengan area pandang browser, serta mempertahankan beberapa tab shell. Lihat [konfigurasi Gateway](/id/gateway/configuration-reference#gateway) untuk `gateway.terminal.enabled` dan penggantian opsional `gateway.terminal.shell`.

Agen tanpa sandbox yang diotorisasi pemilik dapat menggunakan alat `terminal` untuk pekerjaan panjang atau interaktif yang perlu dipantau operator. Setiap panggilan alat dapat membuka, membaca, menulis, mengubah ukuran, menutup, atau mencantumkan PTY gateway milik agen itu sendiri. Secara default, sesi baru membuka tab Control UI yang terhubung bersama, sehingga agen dan operator berbagi keluaran dan keduanya dapat mengetik atau mengubah ukuran. Akses agen dibatasi secara tepat untuk setiap sesi: agen tidak dapat membaca atau mengendalikan terminal yang dibuat operator maupun terminal yang dibuka oleh sesi agen lain.

Seret satu atau beberapa file ke terminal aktif, atau gunakan tombol penjepit kertas untuk memilih file. OpenClaw menempatkan sementara setiap file di mesin pemilik PTY dan menempelkan path absolut yang dikutip untuk shell pada posisi kursor; OpenClaw tidak pernah menekan Enter atau mengeksekusi masukan. Indikator batch ringkas menampilkan file saat ini dan jumlah yang telah selesai. Pembatalan menghentikan sisa batch tanpa menempelkan path; transfer yang gagal tetap terlihat agar Anda dapat mencoba lagi mulai dari file tersebut tanpa mengunggah ulang file yang telah selesai. Gambar, PDF, arsip, dan jenis file lainnya diterima hingga 16 MiB per file. File yang ditempatkan sementara menggunakan direktori sementara sistem privat pada host POSIX (mode direktori `0700`, mode file `0600`) atau direktori di bawah batas ACL profil pengguna pada Windows, serta pewaktu pembersihan 24 jam, jadi pindahkan atau salin apa pun yang perlu disimpan.

Penyisipan path mendukung PowerShell, `cmd.exe`, dan shell POSIX yang dikenali (`sh`, Bash, Dash, Ash, Ksh, Zsh, dan Fish), termasuk Git Bash pada Windows. Penggantian shell lainnya ditolak karena aturan pengutipannya tidak dapat disimpulkan dengan aman; jalankan Gateway di dalam WSL untuk mendapatkan terminal WSL native dan path unggahan Linux. Path `cmd.exe` yang berisi `%` atau `!` juga ditolak karena shell tersebut memperluas karakter-karakter itu bahkan di dalam tanda kutip ganda.

Sesi Codex dan Claude Code yang ditemukan di bilah samping sesi dapat dibuka dalam CLI native masing-masing di dalam panel terminal yang sama. Di **Settings › Chat**, atur **Open Codex/Claude threads in** ke **Terminal** agar klik biasa pada baris membuka `codex resume` atau `claude --resume`; tampilan bawaan tetap berupa penampil OpenClaw hanya-baca. Menu klik kanan atau menu kebab pada baris selalu menawarkan kedua pilihan, dan header penampil menyertakan **Open in terminal** jika sesi tersebut memenuhi syarat.

Kelayakan berlaku per sesi dan per host. Sesi lokal Gateway menjalankan perintah pelanjutan milik penyedia pada host Gateway. Sesi node yang dipasangkan menjalankan perintah penyedia yang tercantum dalam daftar izin pada node pemilik dan hanya meneruskan keluaran, masukan, serta peristiwa perubahan ukuran PTY tersebut; ini tidak mengekspos shell node umum atau menerima perintah yang disediakan browser. Unggahan file menggunakan perintah node `terminal.upload` yang terpisah dan dibatasi ukurannya, serta tetap terikat pada sesi terminal yang telah dibuka. Setujui peningkatan pemasangan node saat perintah tersebut pertama kali muncul. Node yang tidak mengiklankan perintah pelanjutan terminal yang sesuai, termasuk jembatan pekerja tersemat tanpa streaming dupleks, tetap menyediakan penampil dan menunjukkan bahwa pembukaan terminal tidak tersedia; node lama masih dapat menjalankan terminal tetapi tidak dapat menerima file yang diseret.

Sesi milik koneksi tetap bertahan setelah koneksi terputus: pemuatan ulang halaman, laptop yang memasuki mode tidur, atau gangguan jaringan akan melepaskan sesi di Gateway alih-alih menghentikannya, dan tab browser yang sama akan terhubung kembali saat koneksi pulih dengan keluaran terbaru diputar ulang. Sesi milik koneksi yang terlepas akan dihentikan setelah `gateway.terminal.detachedSessionTimeoutSeconds` (default 300 detik; `0` memulihkan penghentian saat koneksi terputus). Menghubungkan salah satu sesi ini tetap mengambil alih seperti tmux.

Sesi milik agen tidak terikat pada koneksi browser. `terminal.attach` menambahkan setiap browser sebagai penampil tanpa mengambil kepemilikan, dan menutup tab penampil hanya melepaskan browser tersebut. PTY tetap aktif hingga agen pemilik menutupnya, prosesnya berakhir, kebijakan menonaktifkannya, atau Gateway dimatikan. `terminal.list` menandai setiap entri sebagai milik koneksi atau agen, dan `terminal.text` memungkinkan koneksi admin membaca keluaran teks biasa terbaru tanpa terhubung.

Terminal juga tersedia sebagai dokumen layar penuh khusus terminal di `/?view=terminal`. Aplikasi iOS dan Android menyematkan halaman ini dalam layar Terminal, dengan menggunakan kembali kredensial gateway yang tersimpan; ketersediaan mengikuti gerbang `gateway.terminal.enabled` dan `operator.admin` yang sama, dan halaman menampilkan pemberitahuan ketika Gateway yang terhubung tidak menyediakan terminal.

## Panel browser

Control UI menyediakan panel browser yang dapat didok dan merender browser yang dikendalikan Gateway (browser yang sama dengan yang dikendalikan agen melalui [alat browser](/id/tools/browser-control)) di browser web biasa mana pun—tanpa memerlukan webview native. Panel muncul ketika Gateway yang terhubung mengiklankan `browser.request` ke koneksi `operator.admin`; tombol globe di rel ruang kerja utas mengaktifkan atau menonaktifkannya. Panel menampilkan cuplikan halaman langsung dengan tab, bilah URL yang dapat diedit, tombol kembali/maju/muat ulang, dan opsi untuk membuka di browser Anda, dapat didok di kanan atau bawah, serta meneruskan klik, pengguliran roda, dan pengetikan dasar ke halaman jarak jauh.

Dua mode pengambilan mengemas konteks halaman untuk agen:

- **Anotasi (pensil)**: gambar markup bebas di atas halaman. **Kirim ke chat** menggabungkan goresan ke dalam tangkapan layar, melampirkan gambar ke penyusun chat aktif, dan mengisi awal prompt yang menjelaskan URL halaman, judul, serta setiap wilayah yang ditandai agar agen mengetahui dengan tepat apa yang Anda lingkari.
- **Inspeksi (penunjuk)**: arahkan kursor untuk melihat elemen di bawahnya (pemilih, nama aksesibel, peran, ukuran); klik untuk mengirim detail elemen tersebut beserta tangkapan layar yang disorot melalui alur penyusun yang sama. Inspeksi, pengguliran roda, dan navigasi kembali/maju memerlukan `browser.evaluateEnabled` (aktif secara default).

Aplikasi macOS mempertahankan bilah samping browser tautan nativenya untuk tautan yang diklik di dasbor; panel browser juga berfungsi di sana dan merupakan cara untuk membuat anotasi halaman di semua platform lainnya.

## Perilaku chat

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` bersifat **non-blocking**: langsung mengirim ACK dengan `{ runId, status: "started" }` dan respons dialirkan melalui peristiwa `chat`. Klien Control UI tepercaya juga dapat menerima metadata waktu ACK opsional untuk diagnostik lokal.
    - Unggahan chat menerima gambar serta berkas non-video. Gambar mempertahankan jalur gambar asli; berkas lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Pengiriman ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Jika entri transkrip terlalu besar, Gateway dapat memotong kolom teks yang panjang, menghilangkan blok metadata yang berat, dan mengganti pesan berukuran terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Jika pesan asisten yang terlihat dipotong dalam `chat.history`, pembaca samping dapat mengambil entri transkrip lengkap yang telah dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get` berdasarkan `sessionKey`, `agentId` aktif bila diperlukan, dan `messageId` transkrip. Jika Gateway tetap tidak dapat mengembalikan lebih banyak konten, pembaca menampilkan status tidak tersedia secara eksplisit alih-alih mengulangi pratinjau yang terpotong secara diam-diam.
    - Gambar yang dihasilkan asisten disimpan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap berada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif sebaris khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML pemanggilan alat berupa teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong), serta token kontrol model ASCII/lebar penuh yang bocor. Control UI menghilangkan entri asisten yang seluruh teks terlihatnya hanya berupa token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan penyegaran riwayat akhir, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal agar tetap terlihat jika `chat.history` sesaat mengembalikan snapshot lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Peristiwa `chat` langsung merupakan status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi yang persisten. Setelah peristiwa akhir alat, Control UI memuat ulang riwayat dan hanya menggabungkan bagian akhir optimistis yang kecil; batas transkrip didokumentasikan dalam [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa eksekusi agen, tanpa pengiriman kanal).
    - Bilah samping mencantumkan setiap sesi aktif yang dimuat menurut bagian agen dan kelompok Disematkan/kanal/kerja/kustom/Chat, dengan satu tindakan Sesi Baru yang membuka dialog draf. Membuka baris yang terlihat hanya memindahkan sorotan. Sesi dapat dijatuhkan ke Disematkan untuk menyematkannya, atau ke grup kustom maupun Chat untuk memindahkannya; grup kustom dapat diciutkan dan diurutkan ulang dengan seret, nama serta urutan grup disinkronkan melalui Gateway, dan status diciutkan tetap tersimpan di peramban. Sesi dasbor baru secara asinkron mendapatkan judul ringkas yang dihasilkan dari pesan non-perintah pertamanya; nama eksplisit tidak pernah diganti. Atur `agents.defaults.utilityModel` (atau `agents.list[].utilityModel`) untuk merutekan pemanggilan model terpisah ini ke model berbiaya lebih rendah. Membentangkan bagian agen lain memungkinkan penelusuran sesi agen tersebut tanpa meninggalkan chat yang sedang terbuka.
    - Pencarian utas berada di palet perintah (⌘K, atau kolom Pencarian di bagian atas bilah samping): mengetik kueri menelusuri sejumlah halaman kecocokan yang dibatasi di seluruh agen, memfilter baris anak/cron internal, dan mencantumkan kecocokan yang terlihat di samping perintah navigasi. Halaman Utas mempertahankan daftar lengkap yang dapat dicari dengan filter.
    - Setiap baris bilah samping mempertahankan akses penyematan langsung serta menu konteks lengkap untuk status belum dibaca, penggantian nama, fork, pengelompokan, pengarsipan, dan penghapusan. Baris yang dipilih sekaligus (Cmd/Ctrl-klik, Shift-klik untuk rentang) mendapatkan menu tindakan massal yang mencakup status belum dibaca, pengelompokan, pengarsipan, dan penghapusan; pengarsipan/penghapusan massal tetap dinonaktifkan kecuali setiap sesi yang dipilih dapat diarsipkan. Eksekusi aktif dan sesi utama agen tidak dapat diarsipkan. Mengarsipkan atau menghapus sesi yang sedang dipilih mengalihkan Chat kembali ke sesi utama agen tersebut.
    - Di aplikasi macOS, tanda OpenClaw menggunakan bidang bilah judul native yang biasanya kosong di sebelah kontrol jendela, alih-alih memakai satu baris bilah samping.
    - Pada lebar desktop, kontrol chat tetap berada dalam satu baris ringkas dan diciutkan saat menggulir turun pada transkrip; menggulir naik, kembali ke bagian atas, atau mencapai bagian bawah memulihkan kontrol.
    - Pesan teks saja yang identik dan berurutan dirender sebagai satu gelembung dengan lencana jumlah. Pesan yang membawa gambar, lampiran, keluaran alat, atau pratinjau kanvas tidak diciutkan.
    - Gelembung pesan pengguna menyediakan tindakan transkrip: tombol mundur saat diarahkan kursor (popover konfirmasi dengan opsi "Jangan tanya lagi") serta klik kanan **Mundur ke sini** dan **Fork dari sini**. Mundur mengarahkan ulang sesi ke status tepat sebelum pesan tersebut dan mengembalikan teksnya ke penyusun untuk diedit dan dikirim ulang (`sessions.rewind`, `operator.admin`); fork membuat sesi baru dari prefiks jalur aktif sebelum pesan, membukanya, dan mengisi penyusunnya dengan teks yang sama (`sessions.fork`, `operator.write`). Kedua tindakan dinonaktifkan dengan tooltip penjelasan saat agen sedang bekerja, hanya berlaku untuk pesan pengguna yang telah dipersistenkan, dan ditolak untuk sesi yang percakapannya dimiliki oleh harness agen eksternal. Mundur hanya memindahkan konteks chat — berkas dan efek samping alat lainnya tidak dikembalikan — dan transkrip sebelum mundur tetap dipertahankan dalam penyimpanan sesi yang hanya dapat ditambahkan. Jika penyimpanan tersebut berisi beberapa cabang transkrip, bilah judul chat menampilkan menu cabang yang memuat pesan terbaru, jumlah pesan, dan kebaruan setiap cabang; memilih cabang yang tidak aktif mengalihkan sesi saat ini kembali ke jalur yang dipertahankan tersebut (`sessions.branches.list`, `operator.read`; `sessions.branches.switch`, `operator.admin`). Peralihan cabang juga tidak tersedia saat agen sedang bekerja, dan memilih cabang yang sudah aktif menghasilkan galat tanpa operasi bertipe pada batas RPC. Tindakan sembunyikan yang terpisah pada gelembung pengguna hanya menyembunyikan pesan di peramban saat ini; pesan tetap berada dalam transkrip dan agen masih dapat melihatnya.
    - Jika checkout sesi berada pada cabang non-default dari repositori GitHub, tampilan chat menyematkan chip pull request di atas penyusun: nomor PR, repo, cabang, jumlah diff, pil CI, serta status draf/digabungkan/ditutup, masing-masing tertaut ke PR. Baris tersebut menampilkan paling banyak dua chip — PR aktif (terbuka/draf) terlebih dahulu — dan tombol "Tampilkan lainnya" menampilkan riwayat gabungan/tertutup yang diciutkan. Pil CI membuka popover pemantauan CI kecil dengan jumlah pemeriksaan lulus/gagal/berjalan/dilewati dan tautan ke halaman pemeriksaan PR. Deteksi berjalan di sisi server melalui `controlUi.sessionPullRequests`, yang menggunakan kembali `GH_TOKEN`/`GITHUB_TOKEN` milik Gateway jika diatur. Ketika batas laju API GitHub tercapai, chip mempertahankan status terakhir yang diketahui dan menampilkan peringatan bahwa status mungkin sudah tidak mutakhir; menutup chip menyembunyikannya untuk sesi tersebut dalam profil peramban saat ini. Sebelum ada PR, baris menampilkan cabang itu sendiri — repo, nama cabang, dan ukuran +/− diff terhadap basis penggabungan cabang default (pekerjaan yang telah dan belum di-commit). Setelah cabang yang di-push memiliki commit untuk dibandingkan, baris menambahkan tombol Buat PR yang membuka halaman pull request baru GitHub; sebelum itu, sesi dengan berkas yang berubah (telah di-commit, belum di-commit, atau tidak terlacak) tetap mendapatkan baris tanpa tombol. Baris menyembunyikan dirinya sendiri selama ada PR terbuka atau draf. Baris cabang hanya berasal dari git lokal, sehingga tetap tersedia saat GitHub terkena pembatasan laju dan membawa peringatan status usang yang sama, karena "PR tidak ditemukan" tidak dapat dipercaya hingga batas tersebut diatur ulang.
    - Panel diff sesi menampilkan apa yang benar-benar diubah oleh checkout sesi: tombol cabang pada rel ruang kerja atau bilah judul chat membuka panel detail dengan diff per berkas untuk pekerjaan cabang, belum di-commit, dan tidak terlacak terhadap basis penggabungan cabang default checkout — titik status, panah penggantian nama, jumlah +/− per berkas, berkas yang dapat diciutkan, dan penanda "N baris tidak berubah" di antara hunk. Diff dihitung di sisi server melalui metode Gateway `sessions.diff` (cakupan `operator.read`); berkas biner dan berukuran terlalu besar diturunkan menjadi entri statistik saja, dan tombol hanya muncul saat Gateway yang terhubung mengiklankan `sessions.diff`.
    - Setiap panel Chat memiliki bilah judul. Klik judul sesi untuk mengganti namanya; chip ruang kerja menyalin jalur atau cabang checkout dan dapat menampilkan ruang kerja Gateway lokal dalam pengelola berkas host. Sesi jarak jauh dan node eksekusi mempertahankan tindakan salin, tetapi menyembunyikan tindakan tampilkan.
    - Rel ruang kerja utas di setiap panel Chat mencantumkan berkas utas, berkas proyek, dan artefak. Secara default, rel ini ditambatkan ke tepi kanan panel; seret header-nya (atau gunakan tombol tambat) untuk memindahkannya ke bawah, dan pilihan tersebut disimpan dalam profil peramban saat ini. Rel yang diciutkan sama sekali tidak menggunakan ruang: buka kembali dengan ⇧⌘B atau sakelar berkas di bilah judul, yang menampilkan lencana jumlah berkas berubah. Panel detail berkas, alat, dan Canvas yang terpisah tidak terpengaruh.
    - Mengklik referensi berkas di chat, jalur berkas dalam kartu alat baca/edit/tulis yang dibentangkan, atau baris berkas pada rel ruang kerja akan membuka panel detail berkas: tampilan kode berbasis CodeMirror dengan penyorotan sintaks, nomor baris, lompat ke baris, pencarian dalam berkas, tindakan salin, dan menu buka di editor eksternal. Saat Gateway mengiklankan `sessions.files.set` ke koneksi `operator.admin`, panel menambahkan mode Edit dengan pelacakan perubahan belum disimpan dan penyimpanan melalui Cmd/Ctrl-S; draf yang belum disimpan tetap bertahan saat menavigasi berkas, panel, dan sesi dalam tab peramban saat ini hingga disimpan atau dibuang secara eksplisit. Penyimpanan menggunakan compare-and-swap berdasarkan hash konten yang dikembalikan oleh `sessions.files.get`: jika berkas berubah di disk sejak dimuat (misalnya karena agen terus bekerja), panel menampilkan pemberitahuan konflik dengan tindakan Muat Ulang (gunakan konten terbaru) dan Timpa (pertahankan edit lokal). Penulisan melewati pengaman ruang kerja aman-fs yang sama seperti pembacaan — pembatasan jalur, penolakan symlink/hardlink, dan batas UTF-8 256 KB — serta hanya menimpa berkas yang sudah ada; editor tidak pernah membuat atau menghapusnya.
    - Rel tugas latar belakang di setiap panel Chat mencantumkan tugas latar belakang dan subagen milik agen saat ini (`tasks.list` yang dicakup berdasarkan agen, tetap mutakhir oleh peristiwa `task`): pekerjaan yang berjalan menampilkan penghitung waktu berlalu langsung, jumlah penggunaan alat, alat yang sedang digunakan, dan kontrol berhenti; bagian selesai yang dapat diciutkan menambahkan durasi eksekusi; dan tautan Lihat transkrip membuka sesi anak tugas dalam panel. Buka dengan sakelar aktivitas pada bilah judul; snapshot tugas dimuat secara dini, sehingga menampilkan lencana jumlah tugas berjalan tanpa perlu membuka rel terlebih dahulu. Halaman Tugas tetap menjadi buku besar lengkap lintas agen.
    - Rel ruang kerja, rel tugas latar belakang, dan panel detail menyesuaikan dengan lebar masing-masing panel, bukan jendela: dalam panel sempit atau jendela ringkas, kedua rel ditampilkan sebagai bidang di bagian bawah (kontrol tambat samping disembunyikan hingga panel melebar; rel ruang kerja mendapat prioritas pertama untuk slot samping jika hanya satu kolom yang muat), dan panel detail ditumpuk di bawah utas dengan pegangan ubah ukuran horizontal alih-alih berbagi baris dengannya. Area pandang seukuran ponsel tetap membuka panel detail dalam layar penuh.
    - Pemilih model dan mode berpikir di header chat langsung memperbarui sesi aktif melalui `sessions.patch`; keduanya merupakan penggantian sesi persisten, bukan opsi pengiriman yang hanya berlaku untuk satu giliran.
    - **Tampilan terbagi:** buka dari bilah judul chat (di samping tombol alih perbedaan utas, tugas latar belakang, dan file utas), lalu bagi panel aktif ke kanan atau ke bawah menjadi sebanyak mungkin panel yang dapat dimuat. Setiap panel memiliki utas, transkrip, penyusun pesan, dan aliran alatnya sendiri.
    - Agen dengan alat `screen` dapat meminta perubahan panel, bilah samping, terminal, browser, fokus, dan navigasi yang sama selama Control UI yang mendukung terhubung. Protokol v1 menerapkan perintah tersebut ke setiap Control UI terhubung yang mendukung; lihat [Layar](/id/tools/screen).
    - Seret sesi dari bilah samping ke chat untuk membukanya dalam panel. Pratinjau peletakan beranimasi meluncur di antara zona dan memberi label pada hasilnya — "Bagi" di atas tepat separuh bagian yang akan ditempati panel baru, "Buka di sini" di atas seluruh panel — dan peletakan juga berfungsi dari mode panel tunggal.
    - Panel terbagi yang aktif mengendalikan pilihan bilah samping dan URL. Bilah judulnya menambahkan kontrol pembagian dan penutupan; pembatas mengubah ukuran kolom dan panel yang ditumpuk, dan browser menyimpan tata letak secara lokal agar tetap tersedia setelah pemuatan ulang.
    - Pada layar sempit, tampilan terbagi mempertahankan tata letak tetapi hanya merender panel aktif, termasuk header-nya dengan kontrol penutupan.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, penyusun pesan menunggu patch sesi tersebut sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` membuat dan beralih ke sesi dasbor baru yang sama seperti Chat Baru, kecuali ketika `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam keadaan tersebut, sesi utama diatur ulang di tempat. Mengetik `/reset` mempertahankan pengaturan ulang eksplisit di tempat oleh Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi pada Gateway. Jika `agents.defaults.modelPolicy.allow` tidak kosong, kebijakan tersebut mengendalikan pemilih, termasuk entri `provider/*` yang menjaga katalog dalam lingkup penyedia tetap dinamis. Jika tidak, pemilih menampilkan entri yang dikonfigurasi serta penyedia dengan autentikasi yang dapat digunakan; alias dan pengaturan di bawah `agents.defaults.models` tidak membatasinya. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi terbaru dari Gateway menyertakan token konteks saat ini, bilah alat penyusun chat menampilkan cincin kecil penggunaan konteks dengan persentase yang telah digunakan. Buka cincin tersebut untuk melihat jendela konteks saat ini, jumlah token proses terbaru dan perkiraan biaya total, identitas penyedia/model, serta perincian biaya input/output/cache dari respons penyedia terbaru jika dilaporkan. Cincin beralih ke gaya peringatan saat tekanan konteks tinggi dan, pada tingkat Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token yang usang disembunyikan hingga Gateway kembali melaporkan penggunaan terbaru.

  </Accordion>
  <Accordion title="Mode bicara (waktu nyata browser)">
    Mode bicara menggunakan penyedia suara waktu nyata yang terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` beserta profil kunci API `openai`, `talk.realtime.providers.openai.apiKey`, atau `OPENAI_API_KEY`. OpenAI Realtime menggunakan Platform API publik dan memerlukan kunci Platform API; login OAuth Codex tidak memenuhi persyaratan permukaan ini. Konfigurasikan Google dengan `talk.realtime.provider: "google"` beserta `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API penyedia standar: OpenAI menerima rahasia klien Realtime sementara untuk WebRTC, sedangkan Google Live menerima token autentikasi Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat dikunci ke dalam token oleh Gateway. Penyedia yang hanya mengekspos jembatan waktu nyata backend dijalankan melalui transportasi relai Gateway, sehingga kredensial dan soket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway yang diautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.client.create` tidak menerima penggantian instruksi yang diberikan pemanggil.

    Default persisten untuk penyedia, model, suara, transportasi, upaya penalaran, ambang VAD yang tepat, durasi keheningan, dan pengisi awalan berada di **Pengaturan → Komunikasi → Bicara**; mengubahnya memerlukan akses `operator.admin`. Mengonfigurasi relai Gateway memaksa jalur relai backend; mengonfigurasi WebRTC menjaga sesi tetap dimiliki klien dan akan gagal alih-alih diam-diam beralih ke relai jika penyedia tidak dapat membuat sesi browser.

    Kontrol Bicara itu sendiri adalah tombol mikrofon pada bilah alat penyusun. Tanda sisipnya mencantumkan **Default sistem** dan setiap mikrofon yang diekspos oleh browser, termasuk input USB, Bluetooth, dan virtual. ID perangkat yang dipilih tetap lokal di browser dan tidak pernah dikirim ke Gateway; jika perangkat tersebut menghilang, Bicara meminta Anda memilih input lain alih-alih diam-diam merekam dari mikrofon yang berbeda. Saat Bicara aktif, tombol mikrofon berubah menjadi pil yang menampilkan pengukur tingkat input langsung; mengekliknya menghentikan input suara, dan mengarahkan kursor ke atasnya menampilkan glif berhenti. Pembaca layar mengumumkan `Connecting voice input...`, `Listening...`, atau `Asking OpenClaw...` saat panggilan alat waktu nyata meminta pertimbangan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`. Menghentikan respons agen yang sedang berjalan tetap menggunakan kontrol persegi **Hentikan** yang terpisah di sebelah pil.

    **Bicara dengan Video** tersedia untuk sesi browser OpenAI Realtime WebRTC dan Google Live. Klik tombol kamera, izinkan akses kamera dan mikrofon, lalu konfirmasikan pratinjau lokal. OpenAI mengirim satu bingkai JPEG terbatas melalui kanal data browsernya saat `describe_view` meminta konteks visual. Google Live mengirim bingkai JPEG terbatas langsung dari browser ke penyedia pada batas maksimum yang didukung, yaitu satu bingkai per detik, dan menjawab panggilan fungsi `describe_view` dengan status aliran kamera. Bingkai kamera tidak pernah melewati Gateway. Menghentikan Bicara menutup pratinjau dan melepaskan kedua trek media. Lihat [kapabilitas Live API](https://ai.google.dev/gemini-api/docs/live-api/capabilities#video) dan [panduan pemanggilan fungsi](https://ai.google.dev/gemini-api/docs/live-api/tools) Google untuk kontrak protokol penyedia.

    Smoke test langsung untuk pengelola: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi jembatan WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan browser Google Live dengan token terbatas beserta satu bingkai JPEG dan perjalanan pulang-pergi fungsi `describe_view`, serta adaptor browser relai Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status penyedia dan tidak mencatat rahasia.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Hentikan** (memanggil `chat.abort`).
    - Saat suatu proses aktif, tindak lanjut normal menggunakan mode efektif `messages.queue` milik Gateway. `steer` menyuntikkan pesan ke giliran yang sedang berjalan; mode lainnya mempertahankan pengiriman antrean persisten browser. Penolakan pengarahan juga kembali ke antrean tersebut. Klik **Arahkan** pada pesan yang mengantre untuk menyuntikkannya secara manual.
    - **Pengaturan → Tampilan → Obrolan → Tindak lanjut saat agen sedang bekerja** dapat mengganti default server tersebut untuk browser saat ini. Halaman menandai penggantian secara eksplisit dan menawarkan **Atur ulang ke default server**. `Steer into the active run` mengirim tindak lanjut dengan segera, sedangkan `Queue until the run ends` menahannya hingga proses selesai.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar kanal.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua proses aktif dalam sesi tersebut.

  </Accordion>
  <Accordion title="Retensi sebagian saat pembatalan">
    - Saat proses dibatalkan, teks parsial asisten masih dapat ditampilkan di UI.
    - Gateway menyimpan teks parsial asisten yang dibatalkan ke riwayat transkrip ketika terdapat keluaran dalam buffer.
    - Entri yang disimpan mencakup metadata pembatalan sehingga konsumen transkrip dapat membedakan keluaran parsial akibat pembatalan dari keluaran penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Kehilangan koneksi dan penyambungan kembali

Setelah sesi dibuat, terputusnya koneksi Gateway tidak mengeluarkan Anda. Dasbor
tetap terlihat dengan pil kuning kecokelatan mengambang bertuliskan "Koneksi Gateway terputus — Menyambungkan kembali…" di bawah bilah
atas sementara klien otomatis mencoba lagi dengan jeda bertahap (800 ms hingga 15 s). Pembaruan langsung dan
tindakan waktu nyata/sesi dijeda hingga koneksi kembali; **Coba lagi sekarang** pada pil memaksa
percobaan langsung. Obrolan tetap dapat diedit: pengiriman teks biasa dan lampiran disimpan dalam
penyimpanan browser bertaraf Gateway/sesi milik tab saat ini, ditampilkan sebagai menunggu penyambungan kembali, lalu dikirim
secara otomatis ketika Gateway kembali. Kontrol langsung dan perintah garis miring tetap tidak tersedia saat
luring.

Jika browser ini sudah menyimpan kredensial (token/kata sandi yang dikonfigurasi atau token perangkat
yang disetujui), pembukaan pertama dan pemuatan ulang menampilkan tanda OpenClaw kecil beranimasi saat koneksi
dibuat, alih-alih menampilkan gerbang login secara sekilas. Gerbang login hanya muncul ketika belum ada kredensial
yang disimpan atau ketika Gateway secara aktif menolaknya (token/kata sandi salah, pemasangan dicabut) —
status yang memerlukan input Anda, bukan penantian.

## Instalasi PWA dan push web

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terinstal dengan notifikasi bahkan ketika tab atau jendela browser tidak terbuka.

Di dalam aplikasi macOS, halaman pengaturan Notifikasi menampilkan izin notifikasi native aplikasi, bukan push browser, karena aplikasi mengirimkan notifikasi secara native.

Jika halaman menampilkan **Ketidakcocokan protokol** tepat setelah pembaruan OpenClaw, pertama buka kembali dasbor dengan `openclaw dashboard` lalu lakukan pemuatan ulang paksa. Jika masih gagal, hapus data situs untuk origin dasbor atau uji di jendela browser privat; tab lama atau cache service worker browser dapat terus menjalankan bundel Control UI sebelum pembaruan terhadap Gateway yang lebih baru.

| Permukaan                                         | Fungsinya                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                   | Manifes PWA. Browser menawarkan "Install app" setelah dapat dijangkau.             |
| `ui/public/sw.js`                                  | Service worker yang menangani peristiwa `push` dan klik notifikasi.           |
| `state/openclaw.sqlite` → `web_push_vapid_keys`    | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push.                 |
| `state/openclaw.sqlite` → `web_push_subscriptions` | Endpoint langganan browser, kunci, dan stempel waktu pendaftaran yang disimpan. |

Peningkatan dari penyimpanan `push/vapid-keys.json` dan `push/web-push-subscriptions.json` yang telah dihentikan diimpor oleh `openclaw doctor --fix`. Hentikan Gateway sebelum menjalankan perbaikan tersebut agar proses lama tidak dapat membuat ulang status yang telah dihentikan selama impor. Jalankan perbaikan sebelum menggunakan Web Push setelah peningkatan; pendaftaran, pengiriman, penghapusan, dan resolusi kunci menolak diproses selama sumber lama atau klaim Doctor yang terputus masih ada. Runtime Gateway hanya membaca dan menulis SQLite.

Ganti pasangan kunci VAPID melalui variabel lingkungan pada proses Gateway jika Anda ingin menetapkan kunci (penerapan multi-host, rotasi rahasia, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default-nya `https://openclaw.ai`)

Control UI menggunakan metode Gateway dengan pembatasan cakupan berikut untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` mengambil kunci publik VAPID yang aktif.
- `push.web.subscribe` mendaftarkan `endpoint` beserta `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` menghapus endpoint yang terdaftar.
- `push.web.test` mengirim notifikasi pengujian ke langganan pemanggil.

<Note>
Web Push tidak bergantung pada jalur relai APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push yang didukung relai) maupun metode `push.test`, yang menargetkan pemasangan perangkat seluler native.
</Note>

## Sematan yang dihosting

Pesan asisten dapat merender konten web yang dihosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikendalikan oleh `gateway.controlUi.embedSandbox`:

Alat inti [`show_widget`](/id/tools/show-widget) merender SVG atau HTML mandiri secara langsung dari panggilan alat. Browser dan klien obrolan native yang didukung mengiklankan kapabilitas Gateway `inline-widgets`, dan dokumen Canvas yang dihasilkan tetap tersedia saat riwayat obrolan dimuat ulang. Discord Activities menyediakan nama alat yang sama di Discord; proses yang berasal dari kanal lain tidak menerimanya.

<Tabs>
  <Tab title="ketat">
    Menonaktifkan eksekusi skrip di dalam sematan yang dihosting.
  </Tab>
  <Tab title="skrip (default)">
    Mengizinkan sematan interaktif sambil mempertahankan isolasi origin; biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="tepercaya">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen dalam situs yang sama yang secara sengaja memerlukan hak istimewa lebih kuat.
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
Gunakan `trusted` hanya ketika dokumen yang disematkan benar-benar memerlukan perilaku origin yang sama. Untuk sebagian besar game dan kanvas interaktif yang dihasilkan agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL sematan eksternal absolut `http(s)` tetap diblokir secara default. Agar `[embed url="https://..."]` dapat memuat halaman pihak ketiga, atur `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan obrolan

Transkrip obrolan menggunakan bingkai nyaman dibaca yang terpusat dan sejajar dengan penyusun. Keluaran asisten dan alat tetap rata kiri, sementara gelembung pengguna tetap rata kanan di dalam bingkai tersebut. Penerapan monitor lebar dapat mengganti lebar transkrip tanpa menambal CSS bawaan dengan mengatur `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Bentuk yang didukung mencakup panjang biasa dan persentase seperti `960px` atau `82%`, serta ekspresi lebar terbatas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)`.

## Akses tailnet (disarankan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (diutamakan)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve memproksikannya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi).

    Secara default, permintaan Penyajian Control UI/WebSocket dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` adalah `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerimanya saat permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Penyajian terverifikasi ini juga melewati proses bolak-balik pemasangan perangkat; browser tanpa perangkat dan koneksi dengan peran node tetap mengikuti pemeriksaan perangkat normal. Tetapkan `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial rahasia bersama secara eksplisit bahkan untuk lalu lintas Penyajian, lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Penyajian asinkron tersebut, upaya autentikasi yang gagal untuk IP klien dan cakupan autentikasi yang sama diserialkan sebelum penulisan batas laju. Karena itu, percobaan ulang buruk yang bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, alih-alih dua ketidakcocokan biasa yang berlomba secara paralel.

    <Warning>
    Autentikasi Penyajian tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya mungkin berjalan pada host tersebut, wajibkan autentikasi token/kata sandi.
    </Warning>

  </Tab>
  <Tab title="Ikat ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Buka `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang dikonfigurasi).

    Tempelkan rahasia bersama yang sesuai ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP tidak aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi Control UI operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- akses darurat `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang disarankan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal di `https://<magicdns>/` (Serve) atau `http://127.0.0.1:18789/` (pada host gateway).

<AccordionGroup>
  <Accordion title="Perilaku pengalih autentikasi tidak aman">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` hanyalah pengalih kompatibilitas lokal:

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
    - Autentikasi proksi tepercaya yang berhasil dapat menerima sesi Control UI **operator** tanpa identitas perangkat.
    - Hal ini **tidak** berlaku untuk sesi Control UI dengan peran node.
    - Proksi balik loopback pada host yang sama tetap tidak memenuhi autentikasi proksi tepercaya; lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI menyertakan kebijakan `img-src` yang ketat: hanya aset **asal yang sama**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan yang bersifat relatif terhadap protokol ditolak oleh browser dan tidak pernah mengirim permintaan jaringan.

Dalam praktiknya:

- Avatar dan gambar yang disajikan melalui jalur relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL `data:image/...` sebaris tetap dirender.
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- Avatar pratinjau tautan GitHub diambil oleh Gateway dari host avatar tetap GitHub dan dikembalikan sebagai URL `data:` berbatas; browser operator tidak pernah menghubungi host avatar jarak jauh.
- URL avatar jarak jauh yang dihasilkan oleh metadata saluran dihapus di pembantu avatar Control UI dan diganti dengan logo/lencana bawaan, sehingga saluran yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh arbitrer dari browser operator.

Fitur ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Saat autentikasi gateway dikonfigurasi, titik akhir avatar Control UI memerlukan token gateway yang sama seperti bagian API lainnya:

- `GET /avatar/<agentId>` hanya mengembalikan gambar avatar kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar berdasarkan aturan yang sama.
- Permintaan tanpa autentikasi ke salah satu rute ditolak (sesuai dengan rute media asisten terkait), sehingga rute avatar tidak dapat membocorkan identitas agen pada host yang bagian lainnya dilindungi.
- Control UI meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi agar gambar tetap dirender di dasbor.

Jika Anda menonaktifkan autentikasi gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tanpa autentikasi, selaras dengan bagian gateway lainnya.

## Autentikasi rute media asisten

Saat autentikasi gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator Control UI normal; browser mengirim token gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dicakup untuk jalur sumber tersebut secara persis.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>`, bukan token atau kata sandi gateway aktif. Tiket segera kedaluwarsa dan tidak dapat mengotorisasi sumber lain.

Hal ini menjaga perenderan media tetap kompatibel dengan elemen media bawaan browser tanpa menempatkan kredensial gateway yang dapat digunakan kembali dalam URL media yang terlihat.

## Tautan persetujuan

Notifikasi persetujuan operator dapat menautkan langsung ke dokumen persetujuan mandiri yang disajikan di bawah namespace `${controlUiBasePath}/approve/{approvalId}` yang dicadangkan (misalnya `/approve/<approvalId>`, atau `/openclaw/approve/<approvalId>` dengan jalur dasar yang dikonfigurasi). URL tersebut stabil selama masa berlaku persetujuan dan aman diteruskan di antara perangkat Anda sendiri: URL ini mengidentifikasi persetujuan, tetapi tidak pernah mengotorisasinya.

- Namespace satu segmen `/approve/<approvalId>` dicadangkan oleh Gateway sebelum rute HTTP plugin untuk **semua** metode HTTP, sehingga rute plugin tidak akan pernah dapat membayangi atau mencegat dokumen persetujuan.
- Membuka dokumen persetujuan memerlukan autentikasi gateway yang sama seperti bagian Control UI lainnya (token/kata sandi, identitas Tailscale Serve, atau identitas proksi tepercaya); kredensial tidak pernah menjadi bagian dari URL persetujuan.
- Saat penyajian Control UI dinonaktifkan, permintaan ke namespace mengembalikan `404`, bukan diteruskan ke penangan plugin.
- Proses masuk pada dokumen persetujuan bersifat sementara untuk halaman tersebut: proses ini tidak menimpa pemilihan atau pengaturan gateway yang disimpan oleh Control UI lengkap di browser yang sama.

Gateway menyajikan file statis dari `dist/control-ui`:

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

Kemudian arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Halaman Control UI kosong

Jika browser memuat dasbor kosong dan DevTools tidak menampilkan galat yang berguna, ekstensi atau skrip konten awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML biasa yang muncul ketika `<openclaw-app>` tidak terdaftar setelah dimulai.

Gunakan tindakan **Coba lagi** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan berikut:

- Nonaktifkan ekstensi yang menyuntikkan konten ke semua halaman, terutama ekstensi dengan skrip konten `<all_urls>`.
- Coba jendela privat, profil browser yang bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dasbor yang sama setelah mengganti browser.

## Debugging/pengujian: server pengembangan + Gateway jarak jauh

Control UI terdiri atas file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari asal HTTP. Hal ini berguna saat Anda ingin menjalankan server pengembangan Vite secara lokal, tetapi Gateway berjalan di tempat lain.

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
    - Jika Anda meneruskan titik akhir `ws://` atau `wss://` lengkap melalui `gatewayUrl`, enkode nilai sebagai URL agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, sehingga mencegah kebocoran melalui log permintaan dan Referer. Parameter kueri `?token=` lama tetap diimpor satu kali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan dalam memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak menggunakan fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit; tidak adanya kredensial eksplisit merupakan galat.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proksi HTTPS, dan sebagainya).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan), untuk mencegah clickjacking.
    - Penerapan Control UI publik non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (asal lengkap). Pemuatan LAN/Tailnet privat dengan asal yang sama dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
    - Saat dimulai, Gateway dapat mengisi asal lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` berdasarkan ikatan dan port runtime yang berlaku, tetapi asal browser jarak jauh tetap memerlukan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang dikontrol secara ketat; artinya mengizinkan semua asal browser, bukan "cocokkan dengan host apa pun yang sedang saya gunakan."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback asal header Host, tetapi ini merupakan mode keamanan yang berbahaya.

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

- [Dasbor](/id/web/dashboard) — dasbor gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka obrolan berbasis browser
