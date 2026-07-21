---
read_when:
    - Memasangkan atau menghubungkan kembali node iOS
    - Mengaktifkan atau memecahkan masalah node Apple Watch langsung
    - Menjalankan aplikasi iOS dari kode sumber
    - Men-debug penemuan Gateway atau perintah canvas
summary: 'Aplikasi Node iOS: menghubungkan ke Gateway, pemasangan, kanvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-07-21T13:00:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb768b5fd67d44c2e576a06fe6a39c406cf7b64227bbd9a91f930c0d0bbead61
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: build aplikasi iPhone didistribusikan melalui saluran Apple jika diaktifkan untuk suatu rilis. Build pengembangan lokal juga dapat dijalankan dari sumber.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Menyediakan kemampuan node: Canvas, cuplikan Layar, pengambilan Kamera, Lokasi, mode Talk, pengaktifan dengan suara, dan ringkasan Kesehatan yang bersifat opsional.
- Menerima perintah `node.invoke` dan melaporkan peristiwa status node.
- Menelusuri ruang kerja agen yang dipilih secara hanya-baca dari permukaan Agen (File): penelusuran bertingkat direktori, pratinjau teks dengan penyorotan sintaks, pratinjau gambar, dan ekspor melalui lembar berbagi. Tidak ada operasi tulis; ukuran pratinjau dibatasi oleh gateway.
- Menyimpan cache offline kecil yang hanya-baca untuk sesi dan transkrip obrolan terbaru per gateway yang dipasangkan: saat dibuka dari kondisi dingin, transkrip terakhir yang diketahui langsung ditampilkan dan diperbarui setelah gateway merespons, obrolan terbaru tetap dapat ditelusuri saat koneksi terputus, dan atur ulang/lupakan menghapus cache lokal yang dilindungi.
- Mengantrekan pesan teks yang dikirim saat koneksi terputus dalam kotak keluar persisten per gateway (hingga 50): gelembung yang diantrekan muncul dalam transkrip, dikirim sesuai urutan saat tersambung kembali dengan percobaan ulang idempoten, tetap tersimpan hingga riwayat kanonis mengonfirmasi pengiriman, mencoba kembali dengan jeda mundur sebelum menampilkan tindakan coba lagi/hapus, dan kedaluwarsa alih-alih dikirim setelah offline selama 48 jam; atur ulang/lupakan menghapus antrean beserta cache.
- Obrolan adalah satu-satunya permukaan teks dan suara. Tindakan obrolan dapat membuka layar Sesi lengkap tanpa meninggalkan Obrolan serta dapat menampilkan atau menyembunyikan penalaran asisten dan aktivitas alat. Ketuk mikrofon untuk dikte draf, buka menunya untuk merekam catatan suara, atau gunakan kontrol Talk sebaris untuk suara waktu nyata; kontrol Talk dianimasikan berdasarkan tingkat mikrofon langsung atau pemutaran saat mendengarkan atau berbicara.
- Membacakan pesan asisten sesuai permintaan: tekan lama pesan di Obrolan dan pilih **Dengarkan**. Aplikasi memutar klip `tts.speak` gateway yang didukung dengan penyedia TTS yang dikonfigurasi dan beralih ke ucapan pada perangkat jika audio gateway tidak tersedia atau tidak dapat diputar. Pemutaran berhenti saat sesi dialihkan atau aplikasi masuk ke latar belakang.

## Persyaratan

- Gateway berjalan pada perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (cadangan).

## Mulai cepat (pasangkan + hubungkan)

Pada peluncuran pertama, aplikasi menampilkan penjelasan singkat tentang pemasangan dan
halaman izin (notifikasi, kamera, mikrofon, foto, kontak,
kalender, pengingat, lokasi). Setiap pemberian izin bersifat opsional dan dapat diubah
kemudian di **Settings** -> **Permissions**, atau di aplikasi Settings iOS.

1. Mulai Gateway terautentikasi dengan rute yang dapat dijangkau ponsel Anda. Tailscale
   Serve adalah jalur jarak jauh yang direkomendasikan:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Untuk penyiapan tepercaya pada LAN yang sama, gunakan `gateway.bind: "lan"` terautentikasi
sebagai gantinya. Pengikatan loopback default tidak dapat dijangkau dari ponsel. Jika
Gateway belum dikonfigurasi, jalankan `openclaw onboard` terlebih dahulu agar pembuatan
kode penyiapan memiliki jalur autentikasi token atau kata sandi.

2. Buka [UI Kontrol](/id/web/control-ui), pilih **Nodes**, lalu klik
   **Pair mobile device** pada halaman **Devices**. Akses penuh direkomendasikan
   dan dipilih secara default; pilih Limited access hanya jika Anda ingin mengecualikan
   kontrol administratif Gateway, lalu klik **Create setup code**.

3. Di aplikasi iOS, buka **Settings** -> **Gateway**, pindai kode QR (atau tempel
   kode penyiapan), lalu hubungkan.

   Jika kode penyiapan berisi rute LAN dan Tailscale Serve, aplikasi
   menguji keduanya secara berurutan dan menyimpan titik akhir pertama yang dapat dijangkau.

   Gateway yang dipasangkan tetap berada dalam daftar **Gateways**. Tanda centang mengidentifikasi
   gateway yang difokuskan; gunakan kontrol petir pada baris lain agar sesi
   operatornya tetap terhubung pada saat yang sama. Mengalihkan fokus tidak
   memutuskan gateway lain yang diaktifkan. Hanya gateway yang difokuskan yang menerima
   sesi node iPhone yang membawa kemampuan, sehingga kamera, layar, lokasi, dan
   perintah perangkat lainnya selalu memiliki satu pemilik yang tidak ambigu. iOS dapat menangguhkan
   koneksi latar depan ini setelah aplikasi memasuki latar belakang.

4. Aplikasi resmi terhubung secara otomatis. Jika **Pending approval** menampilkan
   permintaan, tinjau peran dan cakupannya sebelum menyetujuinya.

   **Settings → Gateway** menunjukkan apakah koneksi operator yang disimpan memiliki
   akses **Full** atau **Limited**. Penyiapan `ws://` LAN teks biasa secara otomatis
   dibatasi demi keamanan token bearer. Jika dibatasi, konfigurasikan `wss://` atau
   Tailscale Serve, pindai kode akses penuh baru dari UI Kontrol atau `openclaw qr`,
   lalu hubungkan kembali untuk mengaktifkan pengaturan dan peningkatan.

Tombol UI Kontrol memerlukan sesi yang sudah dipasangkan dengan `operator.admin`.
Sebagai alternatif terminal, pilih gateway yang ditemukan di aplikasi iOS (atau aktifkan
Manual Host dan masukkan host/port), lalu setujui permintaan pada host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba kembali pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan `openclaw devices list` lagi sebelum memberikan persetujuan.

Opsional: jika node iOS selalu terhubung dari subnet yang dikontrol ketat, Anda dapat memilih untuk mengaktifkan persetujuan otomatis node saat pertama kali dengan CIDR eksplisit atau IP yang tepat:

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

Fitur ini dinonaktifkan secara default. Fitur ini hanya berlaku untuk pemasangan `role: node` baru tanpa cakupan yang diminta. Pemasangan operator/peramban serta setiap perubahan peran, cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

5. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Ringkasan kesehatan

Node iOS dapat mengembalikan agregat HealthKit hanya-baca yang bersifat opsional untuk
hari kalender saat ini. Persetujuan perangkat iOS dan otorisasi eksplisit perintah Gateway
merupakan gerbang yang terpisah. Lihat [Ringkasan HealthKit](/id/platforms/ios-healthkit) untuk
penyiapan, pemanggilan, bidang payload, perilaku privasi, dan pemecahan masalah.

Secara default, aplikasi pendamping Apple Watch tetap menggunakan relai iPhone yang ada dan
tidak memerlukan pemasangan Gateway terpisah. Pasangkan Watch dengan iPhone di
aplikasi Watch milik Apple, instal OpenClaw dari **Watch app -> My Watch -> Available
Apps**, lalu buka OpenClaw satu kali di kedua perangkat.

## Meninjau persetujuan perintah

Koneksi operator dengan `operator.admin`, atau koneksi
`operator.approvals` yang dipasangkan dan secara eksplisit ditargetkan oleh Gateway, dapat meninjau
permintaan eksekusi yang tertunda di iPhone. Kartu persetujuan menampilkan pratinjau perintah
Gateway yang telah disanitasi, peringatan, konteks host, waktu kedaluwarsa, dan hanya
keputusan yang ditawarkan oleh permintaan tersebut. Apple Watch yang dipasangkan menerima
perintah aman bagi peninjau yang sama melalui relai iPhone yang ada dan menawarkan subset
keputusan ringkas izinkan-sekali/tolak. Mode Gateway Watch langsung tidak membawa
perintah persetujuan.

Status persetujuan dibagikan dengan UI Kontrol dan permukaan obrolan yang didukung.
Jawaban pertama yang dikomit berlaku. iPhone dan Watch mengambil catatan terminal kanonis
Gateway setelah permukaan lain menyelesaikan permintaan, setelah notifikasi
penyelesaian jarak jauh, dan setiap kali pengakuan penyelesaian mungkin
hilang. Tindakan tetap tidak tersedia hingga pembacaan kembali tersebut mengonfirmasi apakah
permintaan masih tertunda.

Kepemilikan persetujuan terikat pada Gateway yang dipilih. Beralih gateway tidak dapat
menerapkan perintah lama ke koneksi pengganti. Gateway yang mendahului
metode persetujuan terpadu beralih ke metode khusus eksekusi yang telah dirilis;
status terminal yang dipertahankan dan hasil lintas-permukaan yang lebih kaya memerlukan
Gateway yang diperbarui.

## Menjawab pertanyaan agen

Obrolan menampilkan pertanyaan Gateway yang tertunda sebagai kartu native untuk koneksi operator
dengan `operator.questions` (atau `operator.admin`). Kartu mendukung opsi pilihan
tunggal dan ganda, deskripsi opsi, jawaban teks bebas **Lainnya**, serta
hitung mundur kedaluwarsa. Penyambungan ulang memuat kembali pertanyaan tertunda dari Gateway. Kartu
dikunci saat perangkat ini menjawabnya, permukaan lain menjawabnya terlebih dahulu, atau
pertanyaan kedaluwarsa atau dibatalkan.

## Node Apple Watch langsung opsional

Mode langsung memberi Watch identitas node bertanda tangan dan koneksi Gateway sendiri.
Perintah node yang didukung tetap berfungsi melalui Wi-Fi atau seluler Watch selama
OpenClaw aktif, bahkan ketika iPhone yang dipasangkan tidak tersedia.

Persyaratan:

- iPhone terhubung ke Gateway dengan cakupan `operator.admin`.
- Kode penyiapan mengiklankan titik akhir Gateway `wss://` dengan sertifikat yang dipercaya
  oleh watchOS; Watch melakukan polling pada asal `https://` yang sesuai. HTTP teks biasa serta
  kepercayaan yang hanya menggunakan sertifikat yang ditandatangani sendiri atau sidik jari tidak didukung. Lihat [Pemasangan yang dikelola
  Gateway](/id/gateway/pairing) untuk konfigurasi titik akhir. Rute loopback, khusus iPhone,
  dan khusus tailnet tidak dapat dijangkau secara mandiri oleh Watch.
- Penggunaan seluler memerlukan Apple Watch berkemampuan seluler dengan layanan aktif.
- OpenClaw aktif di Watch. Apple tidak mengizinkan aplikasi watchOS biasa untuk
  mempertahankan koneksi WebSocket/TCP generik, sehingga node langsung menggunakan polling HTTPS singkat
  dan terhubung kembali saat aplikasi kembali ke latar depan. Lihat
  [panduan jaringan tingkat rendah watchOS dari Apple](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Penyiapan:

1. Di iPhone, buka **Settings -> Apple Watch**.
2. Ketuk **Enable Direct Gateway Connection**.
3. Buka OpenClaw di Watch sebelum kode penyiapan berumur pendek kedaluwarsa.
4. Verifikasi baris Apple Watch terpisah dengan `openclaw nodes status`.

Kode penyiapan berisi kredensial bootstrap khusus node yang berumur pendek; perlakukan
seperti kata sandi hingga kedaluwarsa. Kode tersebut tidak pernah berisi kata sandi atau token
Gateway yang disimpan di iPhone. Setelah pemasangan, Watch menyimpan token perangkatnya sendiri dan
menghapus kredensial bootstrap. Mode langsung hanya mencakup perintah di bawah ini.
Obrolan, Talk, persetujuan, dan alur notifikasi `watch.*` yang ada tetap menjadi
fitur relai iPhone dan masih memerlukan iPhone yang dipasangkan.

Perintah node watchOS langsung:

| Permukaan     | Perintah                       | Catatan                                                  |
| ------------- | ------------------------------ | -------------------------------------------------------- |
| Perangkat     | `device.info`, `device.status` | Identitas Watch, baterai, termal, penyimpanan, dan jaringan. |
| Notifikasi    | `system.notify`                | Saat aplikasi aktif; memerlukan izin Watch.              |

watchOS tidak menyediakan WebKit bagi aplikasi pihak ketiga, sehingga node Watch langsung
tidak mengiklankan perintah Canvas.

## Push berbasis relai untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relai push eksternal alih-alih memublikasikan token APNs mentah ke gateway. Build App Store resmi dari jalur rilis publik menggunakan relai yang dihosting di `https://ios-push-relay.openclaw.ai`; URL dasar ini ditanam langsung untuk distribusi App Store dan tidak membaca penggantian apa pun.

Deployment relai khusus memerlukan jalur build/deployment iOS yang sengaja dipisahkan dengan URL relai yang cocok dengan URL relai gateway. Jalur rilis App Store tidak pernah menerima URL relai khusus. Jika Anda menggunakan build relai khusus, tetapkan URL relai gateway yang sesuai:

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

Cara kerja alurnya:

- Aplikasi iOS mendaftar ke relai menggunakan App Attest dan JWS transaksi aplikasi StoreKit.
- Relai mengembalikan handle relai opak beserta izin pengiriman yang cakupannya terbatas pada pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan (`gateway.identity.get`) dan menyertakannya dalam pendaftaran relai, sehingga pendaftaran berbasis relai tersebut didelegasikan ke gateway tertentu itu.
- Aplikasi meneruskan pendaftaran berbasis relai tersebut ke gateway yang dipasangkan menggunakan `push.apns.register`.
- Gateway menggunakan handle relai yang tersimpan tersebut untuk `push.test`, pengaktifan di latar belakang, dan pemicu pengaktifan.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan URL dasar relai yang berbeda, aplikasi memperbarui pendaftaran relai alih-alih menggunakan kembali pengikatan lama.

Yang **tidak** diperlukan gateway untuk jalur ini: tidak ada token relai untuk seluruh deployment, tidak ada kunci APNs langsung untuk pengiriman resmi berbasis relai App Store.

Alur operator yang diharapkan:

1. Instal aplikasi iOS resmi.
2. Opsional: atur `gateway.push.apns.relay.baseUrl` pada gateway hanya ketika menggunakan build relai khusus yang sengaja dibuat terpisah.
3. Pasangkan aplikasi dengan gateway dan biarkan proses koneksi selesai.
4. Aplikasi memublikasikan `push.apns.register` setelah memperoleh token APNs, sesi operator terhubung, dan pendaftaran relai berhasil.
5. Setelah itu, `push.test`, pengaktifan saat tersambung kembali, dan pemicu pengaktifan dapat menggunakan pendaftaran berbasis relai yang tersimpan.

## Beacon aktif di latar belakang

Ketika iOS membangunkan aplikasi untuk push senyap, penyegaran latar belakang, atau peristiwa perubahan lokasi signifikan, aplikasi mencoba menyambungkan ulang node secara singkat, lalu memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatatnya sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya setelah identitas perangkat node yang terautentikasi diketahui.

Aplikasi menganggap pengaktifan di latar belakang berhasil dicatat hanya ketika respons gateway menyertakan `handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons tersebut kompatibel, tetapi tidak dianggap sebagai pembaruan waktu terakhir terlihat yang persisten.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` tetap berfungsi sebagai penggantian sementara melalui variabel lingkungan untuk gateway (`gateway.push.apns.relay.baseUrl` adalah jalur yang mengutamakan konfigurasi).
- Mode push build rilis App Store menetapkan host relai terkelola secara langsung dan tidak pernah membaca penggantian URL relai — variabel lingkungan waktu build `OPENCLAW_PUSH_RELAY_BASE_URL` hanya memengaruhi mode build iOS lokal/sandbox.

## Alur autentikasi dan kepercayaan

Relai tersedia untuk memberlakukan dua batasan yang tidak dapat disediakan oleh APNs langsung pada gateway untuk build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relai terkelola.
- Gateway hanya dapat mengirim push berbasis relai untuk perangkat iOS yang dipasangkan dengan gateway tertentu tersebut.

Tahap demi tahap:

1. `iOS app -> gateway`: aplikasi dipasangkan dengan gateway melalui alur autentikasi Gateway normal, sehingga memperoleh sesi node terautentikasi beserta sesi operator terautentikasi. Sesi operator memanggil `gateway.identity.get`.
2. `iOS app -> relay`: aplikasi memanggil endpoint pendaftaran relai melalui HTTPS dengan bukti App Attest beserta JWS transaksi aplikasi StoreKit. Relai memvalidasi ID bundel, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan jalur distribusi resmi/produksi — inilah yang mencegah build Xcode/pengembangan lokal menggunakan relai terkelola karena build lokal tidak dapat memenuhi bukti distribusi resmi Apple.
3. `gateway identity delegation`: sebelum pendaftaran relai, aplikasi mengambil identitas gateway yang dipasangkan dari `gateway.identity.get` dan menyertakannya dalam payload pendaftaran relai. Relai mengembalikan handle relai dan izin pengiriman yang cakupannya terbatas pada pendaftaran serta didelegasikan ke identitas gateway tersebut.
4. `gateway -> relay`: gateway menyimpan handle relai dan izin pengiriman dari `push.apns.register`. Saat `push.test`, pengaktifan ketika tersambung kembali, dan pemicu pengaktifan, gateway menandatangani permintaan pengiriman dengan identitas perangkatnya sendiri; relai memverifikasi izin pengiriman yang tersimpan dan tanda tangan gateway terhadap identitas gateway yang didelegasikan saat pendaftaran. Gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan tersebut, meskipun entah bagaimana memperoleh handle-nya.
5. `relay -> APNs`: relai memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi. Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relai; relai mengirimkan push akhir ke APNs atas nama gateway yang dipasangkan.

Alasan desain ini dibuat: menjaga kredensial APNs produksi tetap berada di luar gateway pengguna, menghindari penyimpanan token APNs mentah dari build resmi pada gateway, mengizinkan penggunaan relai terkelola hanya untuk build iOS OpenClaw resmi, serta mencegah suatu gateway mengirim push pengaktifan ke perangkat iOS yang dimiliki gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relai, gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah variabel lingkungan runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan autentikasi App Store Connect seperti `APP_STORE_CONNECT_KEY_ID` dan `APP_STORE_CONNECT_ISSUER_ID`; pengaturan tersebut tidak mengonfigurasi pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan yang disarankan pada host gateway, konsisten dengan kredensial penyedia lain di bawah `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Jangan commit file `.p8` atau menempatkannya di dalam checkout repo.

## Jalur penemuan

### Bonjour (LAN)

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, jika dikonfigurasi, domain penemuan DNS-SD area luas yang sama. Gateway pada LAN yang sama muncul secara otomatis dari `local.`; penemuan lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh: `openclaw.internal.`) dan DNS terpisah Tailscale. Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host + port gateway (default `18789`).

## Beberapa gateway

Aplikasi menyimpan registri setiap gateway yang pernah dipasangkan, sehingga Anda dapat beralih di antaranya tanpa memasangkan ulang:

- **Settings -> Gateway** menampilkan daftar **Paired Gateways** dengan gateway aktif yang ditandai. Ketuk entri untuk beralih; aplikasi menghentikan sesi saat ini dan menyambungkan kembali ke gateway yang dipilih. Menu peralihan cepat muncul di samping baris koneksi jika lebih dari satu gateway telah dipasangkan.
- Kredensial, keputusan kepercayaan TLS, preferensi per gateway, dan riwayat obrolan yang di-cache disimpan secara terpisah untuk setiap gateway. Peralihan tidak pernah mencampurkan status antar-gateway, dan pendaftaran push mengikuti gateway aktif.
- Geser gateway yang dipasangkan (atau gunakan menu konteksnya) untuk **Forget**, yang menghapus kredensial, token perangkat, pin TLS, dan obrolan yang di-cache.
- Gateway yang ditemukan harus terlihat di jaringan agar dapat dialihkan; gateway manual menyambungkan ulang menggunakan host dan port yang tersimpan.

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

Aplikasi iOS adalah antarmuka node seluler, bukan backend Codex Computer Use. Codex Computer Use dan `cua-driver mcp` mengendalikan desktop macOS lokal melalui alat MCP; aplikasi iOS mengekspos kemampuan iPhone melalui perintah node OpenClaw seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agen tetap dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan menjalankan perintah node, tetapi panggilan tersebut melewati protokol node gateway dan mengikuti batasan latar depan/latar belakang iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use) untuk kendali desktop lokal dan halaman ini untuk kemampuan node iOS.

### Evaluasi / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Pengaktifan suara + mode bicara

- Pengaktifan suara dan mode bicara tersedia di Settings.
- Talk realtime OpenAI menggunakan WebRTC milik klien ketika `talk.realtime.transport` adalah `webrtc`; konfigurasi eksplisit `gateway-relay` tetap dimiliki Gateway. Lihat [Mode bicara](/id/nodes/talk).
- Node iOS yang mendukung Talk mengiklankan kemampuan `talk` dan dapat mendeklarasikan `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, serta `talk.ptt.once`; Gateway secara default mengizinkan perintah tekan-untuk-bicara tersebut untuk node tepercaya yang mendukung Talk.
- iOS mungkin menangguhkan audio latar belakang; anggap fitur suara sebagai upaya terbaik ketika aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: tampilkan aplikasi iOS di latar depan (perintah canvas/kamera/layar memerlukannya).
- `A2UI_HOST_UNAVAILABLE`: halaman A2UI bawaan tidak dapat dijangkau di WebView aplikasi; pertahankan aplikasi di latar depan pada tab Screen, lalu coba lagi.
- Prompt pemasangan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Watch tidak menampilkan status iPhone: pastikan iPhone melaporkan `watchPaired: true`
  dan `watchAppInstalled: true` di `watch.status`. Jika pemasangan bernilai false, pasangkan
  Watch di aplikasi Watch milik Apple. Jika penginstalan bernilai false, instal aplikasi pendamping
  dari **My Watch -> Available Apps**. Setelah salah satu perubahan, buka OpenClaw di
  Watch satu kali; keterjangkauan langsung tetap mengharuskan kedua aplikasi berjalan,
  sedangkan pembaruan yang diantrekan dapat tiba nanti di latar belakang.
- Penyambungan ulang gagal setelah penginstalan ulang: token pemasangan Keychain telah dihapus; pasangkan ulang node.

## Dokumentasi terkait

- [Pemasangan](/id/channels/pairing)
- [Penemuan](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
