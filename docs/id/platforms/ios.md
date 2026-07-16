---
read_when:
    - Memasangkan atau menghubungkan kembali node iOS
    - Mengaktifkan atau memecahkan masalah node Apple Watch langsung
    - Menjalankan aplikasi iOS dari kode sumber
    - Men-debug penemuan Gateway atau perintah canvas
summary: 'Aplikasi Node iOS: menghubungkan ke Gateway, pemasangan, kanvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-07-16T18:23:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: build aplikasi iPhone didistribusikan melalui saluran Apple ketika diaktifkan untuk suatu rilis. Build pengembangan lokal juga dapat dijalankan dari kode sumber.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Menyediakan kemampuan node: Canvas, snapshot layar, pengambilan gambar kamera, lokasi, mode bicara, aktivasi suara, dan ringkasan Health yang diaktifkan secara opsional.
- Menerima perintah `node.invoke` dan melaporkan peristiwa status node.
- Menjelajahi ruang kerja agen yang dipilih secara hanya-baca dari permukaan Agents (Files): penelusuran direktori bertingkat, pratinjau teks dengan penyorotan sintaks, pratinjau gambar, dan ekspor melalui lembar berbagi. Tidak ada operasi tulis; ukuran pratinjau dibatasi oleh gateway.
- Menyimpan cache offline kecil yang hanya-baca untuk sesi obrolan dan transkrip terbaru per gateway yang dipasangkan: saat dibuka dari keadaan dingin, transkrip terakhir yang diketahui langsung ditampilkan dan diperbarui setelah gateway merespons, obrolan terbaru tetap dapat dijelajahi saat koneksi terputus, dan reset/lupakan menghapus cache lokal yang dilindungi.
- Mengantrekan pesan teks yang dikirim saat koneksi terputus dalam kotak keluar persisten per gateway (hingga 50): gelembung yang diantrekan ditampilkan dalam transkrip, dikirim berurutan saat tersambung kembali dengan percobaan ulang idempoten, tetap tersimpan hingga riwayat kanonis mengonfirmasi pengiriman, mencoba ulang dengan jeda mundur sebelum menampilkan tindakan coba lagi/hapus, dan kedaluwarsa alih-alih dikirim setelah offline selama 48 jam; reset/lupakan menghapus antrean bersama cache.
- Membacakan pesan asisten sesuai permintaan: tekan lama pesan di Chat lalu pilih **Listen**. Aplikasi memutar klip `tts.speak` gateway yang didukung dengan penyedia TTS yang dikonfigurasi dan beralih ke ucapan pada perangkat ketika audio gateway tidak tersedia atau tidak dapat diputar. Pemutaran berhenti saat sesi diganti atau aplikasi masuk ke latar belakang.

## Persyaratan

- Gateway berjalan pada perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (cadangan).

## Mulai cepat (pasangkan + hubungkan)

Saat pertama kali dijalankan, aplikasi menampilkan penjelasan singkat tentang pemasangan dan
halaman izin (notifikasi, kamera, mikrofon, foto, kontak,
kalender, pengingat, lokasi). Setiap izin bersifat opsional dan dapat diubah
nanti di **Settings** -> **Permissions**, atau di aplikasi iOS Settings.

1. Mulai Gateway terautentikasi dengan rute yang dapat dijangkau ponsel Anda. Tailscale
   Serve adalah jalur jarak jauh yang disarankan:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Untuk penyiapan tepercaya pada LAN yang sama, gunakan `gateway.bind: "lan"` terautentikasi
sebagai gantinya. Pengikatan loopback bawaan tidak dapat dijangkau dari ponsel. Jika
Gateway belum dikonfigurasi, jalankan `openclaw onboard` terlebih dahulu agar pembuatan kode
penyiapan memiliki jalur autentikasi token atau kata sandi.

2. Buka [UI Kontrol](/id/web/control-ui), pilih **Nodes**, lalu klik
   **Pair mobile device** pada halaman **Devices**. Akses penuh disarankan
   dan dipilih secara bawaan; pilih Limited access hanya jika Anda ingin mengecualikan
   kontrol administratif Gateway, lalu klik **Create setup code**.

3. Di aplikasi iOS, buka **Settings** -> **Gateway**, pindai kode QR (atau tempel
   kode penyiapan), lalu hubungkan.

   Jika kode penyiapan memuat rute LAN dan Tailscale Serve, aplikasi
   memeriksanya secara berurutan dan menyimpan endpoint pertama yang dapat dijangkau.

4. Aplikasi resmi terhubung secara otomatis. Jika **Pending approval** menampilkan
   permintaan, tinjau peran dan cakupannya sebelum menyetujuinya.

   **Settings → Gateway** menunjukkan apakah koneksi operator yang tersimpan memiliki
   akses **Full** atau **Limited**. Penyiapan LAN teks biasa `ws://` secara otomatis
   dibatasi demi keamanan token bearer. Jika aksesnya terbatas, konfigurasikan `wss://` atau
   Tailscale Serve, pindai kode akses penuh baru dari UI Kontrol atau `openclaw qr`,
   lalu sambungkan kembali untuk mengaktifkan pengaturan dan peningkatan.

Tombol UI Kontrol memerlukan sesi yang sudah dipasangkan dengan `operator.admin`.
Sebagai cadangan terminal, pilih gateway yang ditemukan di aplikasi iOS (atau aktifkan
Manual Host dan masukkan host/port), lalu setujui permintaan pada host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba ulang pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan kembali `openclaw devices list` sebelum memberikan persetujuan.

Opsional: jika node iOS selalu terhubung dari subnet yang dikontrol secara ketat, Anda dapat mengaktifkan persetujuan otomatis node saat pertama kali dengan CIDR eksplisit atau IP persis:

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

Fitur ini dinonaktifkan secara bawaan. Fitur ini hanya berlaku untuk pemasangan `role: node` baru tanpa cakupan yang diminta. Pemasangan operator/peramban serta setiap perubahan peran, cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

5. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Ringkasan Health

Node iOS dapat mengembalikan agregat HealthKit yang diaktifkan secara opsional dan hanya-baca untuk
hari kalender saat ini. Persetujuan iPhone dan otorisasi perintah Gateway secara eksplisit
merupakan gerbang yang terpisah. Lihat [ringkasan HealthKit](/platforms/ios-healthkit) untuk
penyiapan, pemanggilan, bidang payload, perilaku privasi, dan pemecahan masalah.

Secara bawaan, pendamping Apple Watch tetap menggunakan relai iPhone yang ada dan
tidak memerlukan pemasangan Gateway terpisah. Pasangkan Watch dengan iPhone di
aplikasi Watch milik Apple, instal OpenClaw dari **Watch app -> My Watch -> Available
Apps**, lalu buka OpenClaw satu kali pada kedua perangkat.

## Meninjau persetujuan perintah

Koneksi operator dengan `operator.admin`, atau koneksi
`operator.approvals` yang dipasangkan dan ditargetkan secara eksplisit oleh Gateway, dapat meninjau
permintaan eksekusi yang tertunda di iPhone. Kartu persetujuan menampilkan
pratinjau perintah yang telah disanitasi oleh Gateway, peringatan, konteks host, waktu kedaluwarsa, dan hanya
keputusan yang ditawarkan oleh permintaan tersebut. Apple Watch yang dipasangkan menerima prompt aman
bagi peninjau yang sama melalui relai iPhone yang ada dan menawarkan subset keputusan ringkas
izinkan-sekali/tolak. Mode Gateway Watch langsung tidak membawa
prompt persetujuan.

Status persetujuan dibagikan dengan UI Kontrol dan permukaan obrolan yang didukung. Jawaban
pertama yang dikomit akan berlaku. iPhone dan Watch mengambil catatan terminal kanonis
Gateway setelah permukaan lain menyelesaikan permintaan, setelah notifikasi
penyelesaian jarak jauh, dan setiap kali pengakuan penyelesaian mungkin
hilang. Tindakan tetap tidak tersedia hingga pembacaan kembali tersebut mengonfirmasi apakah
permintaan masih tertunda.

Kepemilikan persetujuan terikat pada Gateway yang dipilih. Mengganti gateway tidak dapat
menerapkan prompt lama ke koneksi pengganti. Gateway yang lebih lama daripada
metode persetujuan terpadu beralih ke metode khusus eksekusi yang telah dirilis;
status terminal yang dipertahankan dan hasil lintas-permukaan yang lebih kaya memerlukan
Gateway yang diperbarui.

## Node Apple Watch langsung opsional

Mode langsung memberikan identitas node bertanda tangan dan koneksi Gateway sendiri kepada watch.
Perintah node yang didukung tetap berfungsi melalui Wi-Fi atau seluler watch selama
OpenClaw aktif, bahkan ketika iPhone yang dipasangkan tidak tersedia.

Persyaratan:

- iPhone terhubung ke Gateway dengan cakupan `operator.admin`.
- Kode penyiapan mengiklankan endpoint Gateway `wss://` dengan sertifikat yang dipercaya
  oleh watchOS; watch melakukan polling pada origin `https://` yang sesuai. HTTP teks biasa serta
  kepercayaan yang hanya berdasarkan sertifikat yang ditandatangani sendiri atau sidik jari tidak didukung. Lihat [pemasangan yang dimiliki
  Gateway](/id/gateway/pairing) untuk konfigurasi endpoint. Rute loopback, khusus iPhone,
  dan khusus tailnet tidak dapat dijangkau secara mandiri oleh watch.
- Penggunaan seluler memerlukan Apple Watch berkemampuan seluler dengan layanan aktif.
- OpenClaw aktif di watch. Apple tidak mengizinkan aplikasi watchOS biasa untuk
  mempertahankan koneksi WebSocket/TCP generik, sehingga node langsung menggunakan polling HTTPS
  singkat dan tersambung kembali ketika aplikasi kembali ke latar depan. Lihat
  [panduan jaringan tingkat rendah watchOS dari Apple](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Penyiapan:

1. Di iPhone, buka **Settings -> Apple Watch**.
2. Ketuk **Enable Direct Gateway Connection**.
3. Buka OpenClaw di watch sebelum kode penyiapan berumur pendek kedaluwarsa.
4. Verifikasi baris Apple Watch terpisah dengan `openclaw nodes status`.

Kode penyiapan memuat kredensial bootstrap khusus node yang berumur pendek; perlakukan kredensial tersebut
seperti kata sandi hingga kedaluwarsa. Kode tersebut tidak pernah memuat kata sandi atau token Gateway
yang tersimpan di iPhone. Setelah pemasangan, watch menyimpan token perangkatnya sendiri dan
menghapus kredensial bootstrap. Mode langsung hanya mencakup perintah di bawah ini.
Chat, Talk, persetujuan, dan alur notifikasi `watch.*` yang ada tetap menjadi
fitur relai iPhone dan masih memerlukan iPhone yang dipasangkan.

Perintah node watchOS langsung:

| Permukaan     | Perintah                        | Catatan                                                  |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Perangkat     | `device.info`, `device.status` | Identitas Watch, baterai, termal, penyimpanan, dan jaringan. |
| Notifikasi    | `system.notify`                | Saat aplikasi aktif; memerlukan izin watch.             |

watchOS tidak menyediakan WebKit kepada aplikasi pihak ketiga, sehingga node watch langsung
tidak mengiklankan perintah Canvas.

## Push berbasis relai untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relai push eksternal alih-alih memublikasikan token APNs mentah ke gateway. Build App Store resmi dari jalur rilis publik menggunakan relai yang dihosting di `https://ios-push-relay.openclaw.ai`; URL dasar ini dikodekan secara permanen untuk distribusi App Store dan tidak membaca penggantian apa pun.

Deployment relai khusus memerlukan jalur build/deployment iOS yang sengaja dipisahkan dan URL relainya cocok dengan URL relai gateway. Jalur rilis App Store tidak pernah menerima URL relai khusus. Jika Anda menggunakan build relai khusus, tetapkan URL relai gateway yang cocok:

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

Cara kerja alur:

- Aplikasi iOS mendaftar ke relai menggunakan App Attest dan JWS transaksi aplikasi StoreKit.
- Relai mengembalikan handle relai buram beserta izin pengiriman yang dicakup untuk pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan (`gateway.identity.get`) dan menyertakannya dalam pendaftaran relai, sehingga pendaftaran berbasis relai didelegasikan ke gateway tertentu tersebut.
- Aplikasi meneruskan pendaftaran berbasis relai tersebut ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relai yang tersimpan tersebut untuk `push.test`, aktivasi latar belakang, dan dorongan aktivasi.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan URL dasar relai yang berbeda, aplikasi memperbarui pendaftaran relai alih-alih menggunakan kembali pengikatan lama.

Yang **tidak** diperlukan gateway untuk jalur ini: tidak ada token relai untuk seluruh deployment, tidak ada kunci APNs langsung untuk pengiriman berbasis relai App Store resmi.

Alur operator yang diharapkan:

1. Instal aplikasi iOS resmi.
2. Opsional: tetapkan `gateway.push.apns.relay.baseUrl` pada gateway hanya ketika menggunakan build relai khusus yang sengaja dipisahkan.
3. Pasangkan aplikasi ke gateway dan biarkan aplikasi menyelesaikan koneksi.
4. Aplikasi memublikasikan `push.apns.register` setelah memiliki token APNs, sesi operator terhubung, dan pendaftaran relai berhasil.
5. Setelah itu, `push.test`, aktivasi saat tersambung kembali, dan dorongan aktivasi dapat menggunakan pendaftaran berbasis relai yang tersimpan.

## Suar tanda aktif di latar belakang

Saat iOS membangunkan aplikasi untuk push senyap, penyegaran latar belakang, atau peristiwa perubahan lokasi signifikan, aplikasi mencoba menyambungkan kembali node secara singkat, lalu memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatatnya sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya setelah identitas perangkat node yang diautentikasi diketahui.

Aplikasi menganggap pembangkitan di latar belakang berhasil dicatat hanya jika respons Gateway menyertakan `handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons tersebut kompatibel, tetapi tidak dihitung sebagai pembaruan terakhir terlihat yang persisten.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai penggantian sementara melalui variabel lingkungan untuk Gateway (`gateway.push.apns.relay.baseUrl` adalah jalur yang mengutamakan konfigurasi).
- Mode push build rilis App Store menetapkan secara tetap host relai terkelola dan tidak pernah membaca penggantian URL relai — variabel lingkungan waktu build `OPENCLAW_PUSH_RELAY_BASE_URL` hanya memengaruhi mode build iOS lokal/sandbox.

## Alur autentikasi dan kepercayaan

Relai tersedia untuk menerapkan dua batasan yang tidak dapat disediakan oleh APNs langsung di Gateway untuk build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relai terkelola.
- Gateway hanya dapat mengirim push melalui relai untuk perangkat iOS yang dipasangkan dengan Gateway tersebut.

Tahap demi tahap:

1. `iOS app -> gateway`: aplikasi dipasangkan dengan Gateway melalui alur autentikasi Gateway normal, yang memberinya sesi node terautentikasi serta sesi operator terautentikasi. Sesi operator memanggil `gateway.identity.get`.
2. `iOS app -> relay`: aplikasi memanggil endpoint pendaftaran relai melalui HTTPS dengan bukti App Attest serta JWS transaksi aplikasi StoreKit. Relai memvalidasi ID bundel, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan jalur distribusi resmi/produksi — inilah yang mencegah build Xcode/pengembangan lokal menggunakan relai terkelola karena build lokal tidak dapat memenuhi bukti distribusi resmi Apple.
3. `gateway identity delegation`: sebelum pendaftaran relai, aplikasi mengambil identitas Gateway yang dipasangkan dari `gateway.identity.get` dan menyertakannya dalam payload pendaftaran relai. Relai mengembalikan handel relai dan izin pengiriman dengan cakupan pendaftaran yang didelegasikan kepada identitas Gateway tersebut.
4. `gateway -> relay`: Gateway menyimpan handel relai dan izin pengiriman dari `push.apns.register`. Pada `push.test`, pembangkitan untuk penyambungan kembali, dan dorongan pembangkitan, Gateway menandatangani permintaan pengiriman dengan identitas perangkatnya sendiri; relai memverifikasi izin pengiriman tersimpan dan tanda tangan Gateway terhadap identitas Gateway yang didelegasikan saat pendaftaran. Gateway lain tidak dapat menggunakan kembali pendaftaran tersimpan tersebut, sekalipun berhasil memperoleh handelnya.
5. `relay -> APNs`: relai memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi. Gateway tidak pernah menyimpan token APNs mentah untuk build resmi yang menggunakan relai; relai mengirimkan push terakhir ke APNs atas nama Gateway yang dipasangkan.

Alasan desain ini dibuat: menjaga kredensial APNs produksi agar tidak berada di Gateway pengguna, menghindari penyimpanan token APNs mentah build resmi di Gateway, hanya mengizinkan build iOS OpenClaw resmi menggunakan relai terkelola, dan mencegah suatu Gateway mengirim push pembangkitan ke perangkat iOS yang dimiliki Gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relai, Gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah variabel lingkungan runtime host Gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan autentikasi App Store Connect seperti `APP_STORE_CONNECT_KEY_ID` dan `APP_STORE_CONNECT_ISSUER_ID`; ini tidak mengonfigurasi pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan host Gateway yang disarankan, konsisten dengan kredensial penyedia lain di bawah `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Jangan melakukan commit terhadap file `.p8` atau menempatkannya di dalam checkout repositori.

## Jalur penemuan

### Bonjour (LAN)

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, jika dikonfigurasi, domain penemuan DNS-SD area luas yang sama. Gateway di LAN yang sama muncul secara otomatis dari `local.`; penemuan lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis suar tanda.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh: `openclaw.internal.`) dan DNS terbagi Tailscale. Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host + port Gateway (bawaan `18789`).

## Beberapa Gateway

Aplikasi menyimpan registri setiap Gateway yang pernah dipasangkan, sehingga Anda dapat beralih di antaranya tanpa memasangkan ulang:

- **Settings -> Gateway** menampilkan daftar **Paired Gateways** dengan Gateway aktif yang ditandai. Ketuk entri untuk beralih; aplikasi mengakhiri sesi saat ini dan menyambungkan kembali ke Gateway yang dipilih. Menu peralihan cepat muncul di sebelah baris koneksi jika lebih dari satu Gateway telah dipasangkan.
- Kredensial, keputusan kepercayaan TLS, preferensi per Gateway, dan riwayat percakapan yang disimpan dalam cache disimpan secara terpisah untuk setiap Gateway. Peralihan tidak pernah mencampur status antar-Gateway, dan pendaftaran push mengikuti Gateway aktif.
- Geser Gateway yang dipasangkan (atau gunakan menu konteksnya) untuk **Forget**, yang menghapus kredensial, token perangkat, pin TLS, dan percakapan yang disimpan dalam cache.
- Gateway yang ditemukan harus terlihat di jaringan agar dapat dialihkan; Gateway manual menyambungkan kembali menggunakan host dan port yang tersimpan.

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Host canvas Gateway menyajikan `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/` dari server HTTP Gateway (port yang sama dengan `gateway.port`, bawaan `18789`).
- Node iOS mempertahankan kerangka bawaan sebagai tampilan default saat tersambung. `canvas.a2ui.push` dan `canvas.a2ui.reset` menggunakan halaman A2UI bawaan milik aplikasi.
- Halaman A2UI Gateway jarak jauh hanya dapat dirender di iOS; tindakan tombol A2UI native hanya diterima dari halaman bawaan milik aplikasi.
- Kembali ke kerangka bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan dengan Computer Use

Aplikasi iOS adalah antarmuka node seluler, bukan backend Codex Computer Use. Codex Computer Use dan `cua-driver mcp` mengendalikan desktop macOS lokal melalui alat MCP; aplikasi iOS menyediakan kemampuan iPhone melalui perintah node OpenClaw seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agen tetap dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan memanggil perintah node, tetapi panggilan tersebut melewati protokol node Gateway dan mengikuti batasan latar depan/latar belakang iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use) untuk kendali desktop lokal dan halaman ini untuk kemampuan node iOS.

### Evaluasi / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Pembangkitan suara + mode bicara

- Pembangkitan suara dan mode bicara tersedia di Settings.
- Talk real-time OpenAI menggunakan WebRTC milik klien saat `talk.realtime.transport` adalah `webrtc`; konfigurasi `gateway-relay` eksplisit tetap dimiliki Gateway. Lihat [Mode bicara](/id/nodes/talk).
- Node iOS yang mendukung Talk mengiklankan kemampuan `talk` dan dapat mendeklarasikan `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`; Gateway secara default mengizinkan perintah tekan-untuk-bicara tersebut bagi node tepercaya yang mendukung Talk.
- iOS dapat menangguhkan audio latar belakang; anggap fitur suara sebagai upaya terbaik saat aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke latar depan (perintah canvas/kamera/layar memerlukannya).
- `A2UI_HOST_UNAVAILABLE`: halaman A2UI bawaan tidak dapat dijangkau di WebView aplikasi; pertahankan aplikasi di latar depan pada tab Screen dan coba lagi.
- Prompt pemasangan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Watch tidak menampilkan status iPhone: pastikan iPhone melaporkan `watchPaired: true`
  dan `watchAppInstalled: true` di `watch.status`. Jika pemasangan bernilai false, pasangkan
  Watch di aplikasi Watch milik Apple. Jika penginstalan bernilai false, instal aplikasi pendamping
  dari **My Watch -> Available Apps**. Setelah salah satu perubahan tersebut, buka OpenClaw di
  Watch satu kali; keterjangkauan langsung tetap mengharuskan kedua aplikasi berjalan,
  sedangkan pembaruan dalam antrean dapat tiba kemudian di latar belakang.
- Penyambungan kembali gagal setelah penginstalan ulang: token pemasangan Keychain telah dihapus; pasangkan ulang node.

## Dokumentasi terkait

- [Pemasangan](/id/channels/pairing)
- [Penemuan](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
