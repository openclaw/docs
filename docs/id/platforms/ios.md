---
read_when:
    - Memasangkan atau menghubungkan kembali node iOS
    - Mengaktifkan atau memecahkan masalah node Apple Watch langsung
    - Menjalankan aplikasi iOS dari kode sumber
    - Men-debug penemuan Gateway atau perintah canvas
summary: 'Aplikasi node iOS: menghubungkan ke Gateway, pemasangan, kanvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-07-19T05:02:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: edd6a59edb656355e8b524cbd796452c0877264e28ca75f02a564929bcfa89b1
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: build aplikasi iPhone didistribusikan melalui kanal Apple ketika diaktifkan untuk suatu rilis. Build pengembangan lokal juga dapat dijalankan dari kode sumber.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Menyediakan kemampuan node: Canvas, cuplikan Layar, pengambilan gambar Kamera, Lokasi, mode Bicara, aktivasi Suara, dan ringkasan Kesehatan yang harus diaktifkan.
- Menerima perintah `node.invoke` dan melaporkan peristiwa status node.
- Menjelajahi ruang kerja agen yang dipilih secara hanya-baca dari permukaan Agen (File): penelusuran direktori bertingkat, pratinjau teks dengan penyorotan sintaks, pratinjau gambar, dan ekspor melalui lembar berbagi. Tidak ada operasi tulis; ukuran pratinjau dibatasi oleh gateway.
- Menyimpan cache luring hanya-baca berukuran kecil untuk sesi dan transkrip obrolan terbaru per gateway yang dipasangkan: saat aplikasi dibuka dari keadaan tidak aktif, transkrip terakhir yang diketahui langsung ditampilkan dan diperbarui setelah gateway merespons, obrolan terbaru tetap dapat dijelajahi saat koneksi terputus, dan tindakan atur ulang/lupakan menghapus cache lokal yang dilindungi.
- Mengantrekan pesan teks yang dikirim saat koneksi terputus dalam kotak keluar per gateway yang persisten (hingga 50): gelembung yang diantrekan ditampilkan dalam transkrip, dikirim secara berurutan saat tersambung kembali dengan percobaan ulang idempoten, tetap tersimpan hingga riwayat kanonis mengonfirmasi pengiriman, dicoba ulang dengan jeda bertahap sebelum menampilkan tindakan coba ulang/hapus, dan kedaluwarsa alih-alih dikirim setelah luring selama 48 jam; tindakan atur ulang/lupakan menghapus antrean bersama cache.
- Obrolan adalah satu-satunya permukaan teks dan suara. Tindakan obrolan dapat membuka layar Sesi lengkap tanpa meninggalkan Obrolan serta dapat menampilkan atau menyembunyikan penalaran asisten dan aktivitas alat. Ketuk mikrofon untuk dikte draf, buka menunya untuk merekam catatan suara, atau gunakan kontrol Bicara sebaris untuk suara waktu nyata; kontrol Bicara beranimasi mengikuti level mikrofon langsung atau pemutaran saat mendengarkan atau berbicara.
- Membacakan pesan asisten sesuai permintaan: tekan lama pesan di Obrolan dan pilih **Dengarkan**. Aplikasi memutar klip `tts.speak` gateway yang didukung menggunakan penyedia TTS yang dikonfigurasi dan beralih ke ucapan pada perangkat ketika audio gateway tidak tersedia atau tidak dapat diputar. Pemutaran berhenti saat sesi diganti atau aplikasi berpindah ke latar belakang.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (cadangan).

## Mulai cepat (pasangkan + hubungkan)

Saat pertama kali diluncurkan, aplikasi memandu melalui penjelasan singkat tentang pemasangan dan halaman
izin (notifikasi, kamera, mikrofon, foto, kontak,
kalender, pengingat, lokasi). Setiap izin bersifat opsional dan dapat diubah
nanti di **Settings** -> **Permissions**, atau di aplikasi Settings iOS.

1. Jalankan Gateway terautentikasi dengan rute yang dapat dijangkau ponsel Anda. Tailscale
   Serve adalah jalur jarak jauh yang direkomendasikan:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Untuk penyiapan tepercaya pada LAN yang sama, gunakan `gateway.bind: "lan"` terautentikasi
sebagai gantinya. Pengikatan loopback bawaan tidak dapat dijangkau dari ponsel. Jika
Gateway belum dikonfigurasi, jalankan `openclaw onboard` terlebih dahulu agar pembuatan
kode penyiapan memiliki jalur autentikasi token atau kata sandi.

2. Buka [UI Kontrol](/id/web/control-ui), pilih **Node**, lalu klik
   **Pasangkan perangkat seluler** pada halaman **Perangkat**. Akses penuh direkomendasikan
   dan dipilih secara default; pilih Akses terbatas hanya ketika Anda ingin mengecualikan
   kontrol administratif Gateway, lalu klik **Buat kode penyiapan**.

3. Di aplikasi iOS, buka **Settings** -> **Gateway**, pindai kode QR (atau tempel
   kode penyiapan), lalu hubungkan.

   Jika kode penyiapan berisi rute LAN dan Tailscale Serve, aplikasi
   memeriksanya secara berurutan dan menyimpan titik akhir pertama yang dapat dijangkau.

4. Aplikasi resmi terhubung secara otomatis. Jika **Menunggu persetujuan** menampilkan
   permintaan, tinjau peran dan cakupannya sebelum menyetujuinya.

   **Settings → Gateway** menunjukkan apakah koneksi operator yang disimpan memiliki
   akses **Penuh** atau **Terbatas**. Penyiapan `ws://` LAN teks biasa secara otomatis
   dibatasi demi keamanan bearer token. Jika aksesnya terbatas, konfigurasikan `wss://` atau
   Tailscale Serve, pindai kode akses penuh baru dari UI Kontrol atau `openclaw qr`,
   lalu hubungkan kembali untuk mengaktifkan pengaturan dan peningkatan.

Tombol UI Kontrol memerlukan sesi yang sudah dipasangkan dengan `operator.admin`.
Sebagai alternatif melalui terminal, pilih gateway yang ditemukan di aplikasi iOS (atau aktifkan
Manual Host dan masukkan host/port), lalu setujui permintaan pada host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba ulang pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan kembali `openclaw devices list` sebelum memberikan persetujuan.

Opsional: jika node iOS selalu terhubung dari subnet yang dikontrol ketat, Anda dapat memilih untuk mengaktifkan persetujuan otomatis node saat pertama kali menggunakan CIDR atau alamat IP persis secara eksplisit:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Fitur ini dinonaktifkan secara default. Fitur ini hanya berlaku untuk pemasangan `role: node` baru tanpa cakupan yang diminta. Pemasangan operator/peramban serta perubahan apa pun pada peran, cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

5. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Ringkasan kesehatan

Node iOS dapat mengembalikan agregat HealthKit hanya-baca yang harus diaktifkan untuk hari
kalender saat ini. Persetujuan perangkat iOS dan otorisasi perintah Gateway secara eksplisit merupakan
gerbang yang independen. Lihat [Ringkasan HealthKit](/id/platforms/ios-healthkit) untuk
penyiapan, pemanggilan, kolom payload, perilaku privasi, dan pemecahan masalah.

Secara default, pendamping Apple Watch tetap menggunakan relai iPhone yang ada dan
tidak memerlukan pemasangan Gateway terpisah. Pasangkan Watch dengan iPhone di
aplikasi Watch milik Apple, instal OpenClaw dari **Watch app -> My Watch -> Available
Apps**, lalu buka OpenClaw satu kali di kedua perangkat.

## Meninjau persetujuan perintah

Koneksi operator dengan `operator.admin`, atau koneksi
`operator.approvals` yang dipasangkan dan secara eksplisit ditargetkan oleh Gateway, dapat meninjau
permintaan eksekusi yang tertunda di iPhone. Kartu persetujuan menampilkan
pratinjau perintah Gateway yang telah disanitasi, peringatan, konteks host, masa berlaku, dan hanya
keputusan yang ditawarkan oleh permintaan tersebut. Apple Watch yang dipasangkan menerima
perintah aman bagi peninjau yang sama melalui relai iPhone yang ada dan menawarkan subset
keputusan ringkas izinkan-sekali/tolak. Mode Gateway Watch langsung tidak membawa
perintah persetujuan.

Status persetujuan dibagikan dengan UI Kontrol dan permukaan obrolan yang didukung.
Jawaban pertama yang dikomit berlaku. iPhone dan Watch mengambil catatan
terminal kanonis Gateway setelah permintaan diselesaikan oleh permukaan lain, setelah
notifikasi penyelesaian jarak jauh, dan setiap kali penerimaan penyelesaian mungkin
hilang. Tindakan tetap tidak tersedia hingga pembacaan kembali tersebut mengonfirmasi apakah
permintaan masih tertunda.

Kepemilikan persetujuan terikat pada Gateway yang dipilih. Beralih gateway tidak dapat
menerapkan perintah lama pada koneksi pengganti. Gateway yang dibuat sebelum
metode persetujuan terpadu beralih ke metode khusus eksekusi yang telah dirilis;
status terminal yang dipertahankan dan hasil lintas-permukaan yang lebih lengkap memerlukan
Gateway yang diperbarui.

## Menjawab pertanyaan agen

Obrolan menampilkan pertanyaan Gateway yang tertunda sebagai kartu bawaan untuk koneksi operator
dengan `operator.questions` (atau `operator.admin`). Kartu mendukung opsi pilihan
tunggal dan ganda, deskripsi opsi, jawaban teks bebas **Lainnya**, dan
hitung mundur kedaluwarsa. Penyambungan kembali memuat ulang pertanyaan tertunda dari Gateway. Kartu
dikunci ketika perangkat ini menjawabnya, permukaan lain menjawabnya terlebih dahulu, atau
pertanyaan kedaluwarsa atau dibatalkan.

## Node Apple Watch langsung opsional

Mode langsung memberi jam tangan identitas node bertanda tangan dan koneksi Gateway sendiri.
Perintah node yang didukung tetap berfungsi melalui Wi-Fi atau seluler jam tangan saat
OpenClaw aktif, bahkan ketika iPhone yang dipasangkan tidak tersedia.

Persyaratan:

- iPhone terhubung ke Gateway dengan cakupan `operator.admin`.
- Kode penyiapan mengiklankan titik akhir Gateway `wss://` dengan sertifikat yang dipercaya
  oleh watchOS; jam tangan melakukan polling terhadap origin `https://` yang sesuai. HTTP teks biasa serta
  kepercayaan yang hanya berbasis sertifikat yang ditandatangani sendiri atau sidik jari tidak didukung. Lihat [Pemasangan yang dikelola
  Gateway](/id/gateway/pairing) untuk konfigurasi titik akhir. Rute loopback, khusus iPhone,
  dan khusus tailnet tidak dapat dijangkau secara mandiri oleh jam tangan.
- Penggunaan seluler memerlukan Apple Watch berkemampuan seluler dengan layanan aktif.
- OpenClaw aktif di jam tangan. Apple tidak mengizinkan aplikasi watchOS biasa untuk
  mempertahankan koneksi WebSocket/TCP generik, sehingga node langsung menggunakan polling HTTPS
  singkat dan tersambung kembali ketika aplikasi kembali ke latar depan. Lihat
  [panduan jaringan tingkat rendah watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS) dari Apple.

Penyiapan:

1. Di iPhone, buka **Settings -> Apple Watch**.
2. Ketuk **Enable Direct Gateway Connection**.
3. Buka OpenClaw di jam tangan sebelum kode penyiapan berumur pendek kedaluwarsa.
4. Verifikasi baris Apple Watch terpisah dengan `openclaw nodes status`.

Kode penyiapan berisi kredensial bootstrap berumur pendek yang hanya berlaku untuk node; perlakukan seperti
kata sandi hingga kedaluwarsa. Kode tersebut tidak pernah berisi kata sandi atau token Gateway
tersimpan milik iPhone. Setelah pemasangan, jam tangan menyimpan token perangkatnya sendiri dan
menghapus kredensial bootstrap. Mode langsung hanya mencakup perintah di bawah ini.
Obrolan, Bicara, persetujuan, dan alur notifikasi `watch.*` yang ada tetap merupakan
fitur relai iPhone dan masih memerlukan iPhone yang dipasangkan.

Perintah node watchOS langsung:

| Permukaan     | Perintah                        | Catatan                                                 |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Perangkat     | `device.info`, `device.status` | Identitas Watch, baterai, termal, penyimpanan, dan jaringan. |
| Notifikasi    | `system.notify`                | Saat aplikasi aktif; memerlukan izin watch.             |

watchOS tidak menyediakan WebKit bagi aplikasi pihak ketiga, sehingga node watch langsung
tidak mengiklankan perintah Canvas.

## Push berbasis relai untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relai push eksternal alih-alih memublikasikan token APNs mentah ke gateway. Build App Store resmi dari jalur rilis publik menggunakan relai yang dihosting di `https://ios-push-relay.openclaw.ai`; URL dasar ini tertanam untuk distribusi App Store dan tidak membaca penggantian apa pun.

Deployment relai kustom memerlukan jalur build/deployment iOS yang sengaja dibuat terpisah dengan URL relai yang sesuai dengan URL relai gateway. Jalur rilis App Store tidak pernah menerima URL relai kustom. Jika Anda menggunakan build relai kustom, tetapkan URL relai gateway yang sesuai:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Cara kerja alur ini:

- Aplikasi iOS mendaftar ke relai menggunakan App Attest dan JWS transaksi aplikasi StoreKit.
- Relai mengembalikan handle relai opak beserta izin pengiriman yang cakupannya terbatas pada pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan (`gateway.identity.get`) dan menyertakannya dalam pendaftaran relai, sehingga pendaftaran berbasis relai tersebut didelegasikan ke gateway tertentu itu.
- Aplikasi meneruskan pendaftaran berbasis relai tersebut ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relai yang tersimpan tersebut untuk `push.test`, pengaktifan di latar belakang, dan dorongan pengaktifan.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan URL dasar relai yang berbeda, aplikasi memperbarui pendaftaran relai alih-alih menggunakan kembali pengikatan lama.

Yang **tidak** diperlukan gateway untuk jalur ini: tidak ada token relai untuk seluruh deployment dan tidak ada kunci APNs langsung untuk pengiriman resmi App Store yang berbasis relai.

Alur operator yang diharapkan:

1. Instal aplikasi iOS resmi.
2. Opsional: atur `gateway.push.apns.relay.baseUrl` pada gateway hanya saat menggunakan build relai kustom yang sengaja dipisahkan.
3. Pasangkan aplikasi dengan gateway dan biarkan proses koneksinya selesai.
4. Aplikasi memublikasikan `push.apns.register` setelah memperoleh token APNs, sesi operator terhubung, dan pendaftaran relai berhasil.
5. Setelah itu, `push.test`, pengaktifan saat koneksi ulang, dan dorongan pengaktifan dapat menggunakan pendaftaran berbasis relai yang tersimpan.

## Beacon aktif di latar belakang

Saat iOS mengaktifkan aplikasi untuk push senyap, penyegaran latar belakang, atau peristiwa perubahan lokasi signifikan, aplikasi mencoba menyambungkan kembali node secara singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatatnya sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya setelah identitas perangkat node terautentikasi diketahui.

Aplikasi menganggap pengaktifan latar belakang berhasil dicatat hanya jika respons gateway menyertakan `handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons tersebut kompatibel, tetapi tidak dihitung sebagai pembaruan terakhir terlihat yang persisten.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai penggantian sementara melalui variabel lingkungan untuk gateway (`gateway.push.apns.relay.baseUrl` adalah jalur yang mengutamakan konfigurasi).
- Mode push build rilis App Store mengodekan host relai terkelola secara tetap dan tidak pernah membaca penggantian URL relai — variabel lingkungan waktu build `OPENCLAW_PUSH_RELAY_BASE_URL` hanya memengaruhi mode build iOS lokal/sandbox.

## Alur autentikasi dan kepercayaan

Relai tersedia untuk menerapkan dua batasan yang tidak dapat disediakan oleh APNs langsung pada gateway untuk build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relai terkelola.
- Gateway hanya dapat mengirim push berbasis relai untuk perangkat iOS yang dipasangkan dengan gateway tertentu tersebut.

Setiap tahapan:

1. `iOS app -> gateway`: aplikasi berpasangan dengan gateway melalui alur autentikasi Gateway biasa, yang memberinya sesi node terautentikasi beserta sesi operator terautentikasi. Sesi operator memanggil `gateway.identity.get`.
2. `iOS app -> relay`: aplikasi memanggil endpoint pendaftaran relai melalui HTTPS dengan bukti App Attest beserta JWS transaksi aplikasi StoreKit. Relai memvalidasi ID bundel, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan jalur distribusi resmi/produksi — hal inilah yang mencegah build Xcode/pengembangan lokal menggunakan relai terkelola, karena build lokal tidak dapat memenuhi bukti distribusi resmi Apple.
3. `gateway identity delegation`: sebelum pendaftaran relai, aplikasi mengambil identitas gateway yang dipasangkan dari `gateway.identity.get` dan menyertakannya dalam payload pendaftaran relai. Relai mengembalikan handle relai dan izin pengiriman dengan cakupan pendaftaran yang didelegasikan ke identitas gateway tersebut.
4. `gateway -> relay`: gateway menyimpan handle relai dan izin pengiriman dari `push.apns.register`. Pada `push.test`, pengaktifan saat koneksi ulang, dan dorongan pengaktifan, gateway menandatangani permintaan pengiriman dengan identitas perangkatnya sendiri; relai memverifikasi izin pengiriman yang tersimpan dan tanda tangan gateway terhadap identitas gateway yang menerima delegasi saat pendaftaran. Gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan tersebut, meskipun entah bagaimana memperoleh handle-nya.
5. `relay -> APNs`: relai memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi. Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relai; relai mengirimkan push terakhir ke APNs atas nama gateway yang dipasangkan.

Alasan desain ini dibuat: untuk menjaga kredensial APNs produksi tetap berada di luar gateway pengguna, menghindari penyimpanan token APNs mentah build resmi pada gateway, mengizinkan penggunaan relai terkelola hanya untuk build iOS OpenClaw resmi, dan mencegah suatu gateway mengirim push pengaktifan ke perangkat iOS yang dimiliki gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relai, gateway masih memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah variabel lingkungan runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan autentikasi App Store Connect seperti `APP_STORE_CONNECT_KEY_ID` dan `APP_STORE_CONNECT_ISSUER_ID`; ini tidak mengonfigurasi pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan host gateway yang direkomendasikan, konsisten dengan kredensial penyedia lain di bawah `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Jangan melakukan commit pada berkas `.p8` atau meletakkannya di bawah checkout repo.

## Jalur penemuan

### Bonjour (LAN)

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, jika dikonfigurasi, domain penemuan DNS-SD area luas yang sama. Gateway pada LAN yang sama muncul secara otomatis dari `local.`; penemuan lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh: `openclaw.internal.`) dan DNS terbagi Tailscale. Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host + port gateway (default `18789`).

## Beberapa gateway

Aplikasi menyimpan registri setiap gateway yang pernah dipasangkan, sehingga Anda dapat beralih di antaranya tanpa memasangkan ulang:

- **Settings -> Gateway** menampilkan daftar **Paired Gateways** dengan gateway aktif yang ditandai. Ketuk entri untuk beralih; aplikasi mengakhiri sesi saat ini dan menyambungkan kembali ke gateway yang dipilih. Menu peralihan cepat muncul di samping baris koneksi jika lebih dari satu gateway dipasangkan.
- Kredensial, keputusan kepercayaan TLS, preferensi per gateway, dan riwayat obrolan yang di-cache disimpan per gateway. Peralihan tidak pernah mencampur status antar-gateway, dan pendaftaran push mengikuti gateway aktif.
- Geser gateway yang dipasangkan (atau gunakan menu konteksnya) untuk **Forget**, yang menghapus kredensial, token perangkat, pin TLS, dan obrolan yang di-cache.
- Gateway yang ditemukan harus terlihat di jaringan agar dapat dialihkan; gateway manual menyambung kembali melalui host dan port yang tersimpan.

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Host canvas Gateway menyajikan `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/` dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS mempertahankan scaffold bawaan sebagai tampilan default saat terhubung. `canvas.a2ui.push` dan `canvas.a2ui.reset` menggunakan halaman A2UI bawaan yang dimiliki aplikasi.
- Halaman A2UI Gateway jarak jauh hanya dapat dirender di iOS; tindakan tombol A2UI native hanya diterima dari halaman bawaan yang dimiliki aplikasi.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan dengan Computer Use

Aplikasi iOS adalah permukaan node seluler, bukan backend Codex Computer Use. Codex Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui alat MCP; aplikasi iOS menyediakan kemampuan iPhone melalui perintah node OpenClaw seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agen tetap dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan menjalankan perintah node, tetapi panggilan tersebut melewati protokol node gateway dan mengikuti batasan latar depan/latar belakang iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use) untuk kontrol desktop lokal dan halaman ini untuk kemampuan node iOS.

### Evaluasi / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Pengaktifan suara + mode bicara

- Pengaktifan suara dan mode bicara tersedia di Settings.
- Talk realtime OpenAI menggunakan WebRTC milik klien saat `talk.realtime.transport` adalah `webrtc`; konfigurasi `gateway-relay` yang eksplisit tetap dimiliki Gateway. Lihat [Mode bicara](/id/nodes/talk).
- Node iOS berkemampuan Talk mengiklankan kemampuan `talk` dan dapat mendeklarasikan `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`; secara default, Gateway mengizinkan perintah tekan-untuk-bicara tersebut untuk node berkemampuan Talk yang tepercaya.
- iOS dapat menangguhkan audio latar belakang; anggap fitur suara sebagai upaya terbaik saat aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke latar depan (perintah canvas/kamera/layar memerlukannya).
- `A2UI_HOST_UNAVAILABLE`: halaman A2UI bawaan tidak dapat dijangkau di WebView aplikasi; pertahankan aplikasi di latar depan pada tab Screen dan coba lagi.
- Prompt pemasangan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Watch tidak menampilkan status iPhone: pastikan iPhone melaporkan `watchPaired: true`
  dan `watchAppInstalled: true` dalam `watch.status`. Jika pairing bernilai false, pasangkan
  Watch di aplikasi Watch milik Apple. Jika installation bernilai false, instal aplikasi pendamping
  dari **My Watch -> Available Apps**. Setelah salah satu perubahan, buka OpenClaw di
  Watch satu kali; keterjangkauan langsung tetap mengharuskan kedua aplikasi berjalan,
  sementara pembaruan yang mengantre dapat tiba kemudian di latar belakang.
- Koneksi ulang gagal setelah instalasi ulang: token pemasangan Keychain telah dihapus; pasangkan ulang node.

## Dokumentasi terkait

- [Pemasangan](/id/channels/pairing)
- [Penemuan](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
