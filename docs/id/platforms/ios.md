---
read_when:
    - Memasangkan atau menghubungkan kembali node iOS
    - Menjalankan aplikasi iOS dari sumber
    - Men-debug penemuan Gateway atau perintah kanvas
summary: 'Aplikasi node iOS: menghubungkan ke Gateway, penyandingan, kanvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-07-04T18:21:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: build aplikasi iPhone didistribusikan melalui kanal Apple saat diaktifkan untuk sebuah rilis. Build pengembangan lokal juga dapat dijalankan dari sumber.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kapabilitas node: Canvas, snapshot Layar, pengambilan Kamera, Lokasi, mode Bicara, bangun Suara.
- Menerima perintah `node.invoke` dan melaporkan peristiwa status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Mulai cepat (pair + connect)

1. Mulai Gateway terautentikasi dengan rute yang dapat dijangkau ponsel Anda. Tailscale
   Serve adalah jalur jarak jauh yang direkomendasikan:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Untuk penyiapan LAN yang sama dan tepercaya, gunakan `gateway.bind: "lan"` yang terautentikasi
sebagai gantinya. Bind loopback default tidak dapat dijangkau dari ponsel. Jika
Gateway belum dikonfigurasi, jalankan `openclaw onboard` terlebih dahulu agar pembuatan
kode penyiapan memiliki jalur autentikasi token atau kata sandi.

2. Buka [UI Kontrol](/id/web/control-ui), pilih **Node**, dan klik
   **Pasangkan perangkat mobile** di kartu **Perangkat**.

3. Di aplikasi iOS, buka **Pengaturan** → **Gateway**, pindai kode QR (atau tempel
   kode penyiapan), lalu hubungkan.

4. Aplikasi resmi terhubung secara otomatis. Jika **Perangkat** menampilkan permintaan
   tertunda, tinjau peran dan cakupannya sebelum menyetujuinya.

Tombol UI Kontrol memerlukan sesi yang sudah dipasangkan dengan `operator.admin`.
Sebagai fallback terminal, pilih gateway yang ditemukan di aplikasi iOS (atau aktifkan
Host Manual dan masukkan host/port), lalu setujui permintaan di host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba ulang pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum menyetujui.

Opsional: jika node iOS selalu terhubung dari subnet yang dikontrol ketat, Anda
dapat ikut serta dalam persetujuan otomatis node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pemasangan `role: node` baru dengan
tanpa cakupan yang diminta. Pemasangan operator/browser dan perubahan peran, cakupan, metadata, atau
kunci publik apa pun tetap memerlukan persetujuan manual.

5. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal alih-alih menerbitkan token APNs mentah
ke gateway.

Build App Store resmi dari jalur rilis publik menggunakan relay terhosting di `https://ios-push-relay.openclaw.ai`.

Deployment relay kustom memerlukan jalur build/deployment iOS yang sengaja terpisah, dengan URL relay yang cocok dengan URL relay gateway. Jalur rilis App Store publik tidak menerima override URL relay kustom. Jika Anda menggunakan build relay kustom, atur URL relay gateway yang cocok:

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

Cara alur bekerja:

- Aplikasi iOS mendaftar ke relay menggunakan App Attest dan JWS transaksi aplikasi StoreKit.
- Relay mengembalikan handle relay buram plus grant pengiriman yang dicakup untuk registrasi.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan dan menyertakannya dalam registrasi relay, sehingga registrasi berbasis relay didelegasikan ke gateway spesifik tersebut.
- Aplikasi meneruskan registrasi berbasis relay itu ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relay tersimpan itu untuk `push.test`, bangun latar belakang, dan dorongan bangun.
- URL relay gateway kustom harus cocok dengan URL relay yang disematkan ke dalam build iOS.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan URL dasar relay yang berbeda, aplikasi menyegarkan registrasi relay alih-alih menggunakan ulang binding lama.

Yang **tidak** diperlukan gateway untuk jalur ini:

- Tidak ada token relay di seluruh deployment.
- Tidak ada kunci APNs langsung untuk pengiriman berbasis relay App Store resmi.

Alur operator yang diharapkan:

1. Instal aplikasi iOS resmi.
2. Opsional: atur `gateway.push.apns.relay.baseUrl` di gateway hanya saat menggunakan build relay kustom yang sengaja terpisah.
3. Pasangkan aplikasi ke gateway dan biarkan selesai terhubung.
4. Aplikasi menerbitkan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan registrasi relay berhasil.
5. Setelah itu, `push.test`, bangun ulang koneksi, dan dorongan bangun dapat menggunakan registrasi berbasis relay yang tersimpan.

## Beacon hidup latar belakang

Saat iOS membangunkan aplikasi untuk push senyap, penyegaran latar belakang, atau peristiwa lokasi signifikan, aplikasi
mencoba koneksi ulang node singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`.
Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya
setelah identitas perangkat node terautentikasi diketahui.

Aplikasi menganggap bangun latar belakang berhasil dicatat hanya ketika respons gateway menyertakan
`handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons itu
kompatibel tetapi tidak dihitung sebagai pembaruan terakhir-terlihat yang tahan lama.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.
- Jalur rilis App Store publik menolak `OPENCLAW_PUSH_RELAY_BASE_URL` untuk build iOS.

## Autentikasi dan alur kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat disediakan APNs-langsung-di-gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay terhosting.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang dipasangkan dengan gateway spesifik
  tersebut.

Hop demi hop:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama dipasangkan dengan gateway melalui alur autentikasi Gateway normal.
   - Itu memberi aplikasi sesi node terautentikasi plus sesi operator terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint registrasi relay melalui HTTPS.
   - Registrasi menyertakan bukti App Attest plus JWS transaksi aplikasi StoreKit.
   - Relay memvalidasi bundle ID, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan
     jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal dari penggunaan relay terhosting. Build lokal dapat
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum registrasi relay, aplikasi mengambil identitas gateway yang dipasangkan dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway itu dalam payload registrasi relay.
   - Relay mengembalikan handle relay dan grant pengiriman yang dicakup untuk registrasi yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, bangun ulang koneksi, dan dorongan bangun, gateway menandatangani permintaan kirim dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi grant pengiriman tersimpan dan tanda tangan gateway terhadap identitas
     gateway yang didelegasikan dari registrasi.
   - Gateway lain tidak dapat menggunakan ulang registrasi tersimpan itu, meskipun entah bagaimana memperoleh handle tersebut.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang dipasangkan.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap berada di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs mentah build resmi di gateway.
- Untuk mengizinkan penggunaan relay terhosting hanya bagi build iOS OpenClaw resmi.
- Untuk mencegah satu gateway mengirim push bangun ke perangkat iOS milik gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env vars runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
autentikasi App Store Connect seperti `APP_STORE_CONNECT_KEY_ID` dan
`APP_STORE_CONNECT_ISSUER_ID`; file itu tidak mengonfigurasi pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan host gateway yang direkomendasikan:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Jangan commit file `.p8` atau menempatkannya di bawah checkout repo.

## Jalur penemuan

### Bonjour (LAN)

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, saat dikonfigurasi, domain penemuan DNS-SD
area luas yang sama. Gateway pada LAN yang sama muncul otomatis dari `local.`;
penemuan lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
`openclaw.internal.`) dan Tailscale split DNS.
Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Pengaturan, aktifkan **Host Manual** dan masukkan host gateway + port (default `18789`).

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Host canvas Gateway menyajikan `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/`.
- Disajikan dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS mempertahankan scaffold bawaan sebagai tampilan default yang terhubung. `canvas.a2ui.push` dan `canvas.a2ui.reset` menggunakan halaman A2UI bawaan milik aplikasi.
- Halaman A2UI Gateway jarak jauh hanya render-saja di iOS; tindakan tombol A2UI native hanya diterima dari halaman bawaan milik aplikasi.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan Computer Use

Aplikasi iOS adalah permukaan node mobile, bukan backend Codex Computer Use. Codex
Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui alat MCP;
aplikasi iOS mengekspos kapabilitas iPhone melalui perintah node OpenClaw
seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agen masih dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan memanggil perintah
node, tetapi panggilan tersebut melewati protokol node gateway dan mengikuti batas
foreground/background iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use)
untuk kontrol desktop lokal dan halaman ini untuk kapabilitas node iOS.

### Eval / snapshot Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Bangun suara + mode bicara

- Mode bangun suara dan bicara tersedia di Pengaturan.
- Talk realtime OpenAI menggunakan WebRTC milik klien saat `talk.realtime.transport` adalah `webrtc`; konfigurasi `gateway-relay` eksplisit tetap dimiliki Gateway. Lihat [Mode Talk](/id/nodes/talk).
- Node iOS yang mendukung Talk mengiklankan kapabilitas `talk` dan dapat mendeklarasikan
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`;
  Gateway mengizinkan perintah push-to-talk tersebut secara default untuk node
  tepercaya yang mendukung Talk.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai upaya terbaik saat aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke latar depan (perintah kanvas/kamera/layar memerlukannya).
- `A2UI_HOST_UNAVAILABLE`: halaman A2UI bawaan tidak dapat dijangkau di WebView aplikasi; biarkan aplikasi berada di latar depan pada tab Layar dan coba lagi.
- Prompt pemasangan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Koneksi ulang gagal setelah instal ulang: token pemasangan Keychain telah dihapus; pasangkan ulang node.

## Dokumen terkait

- [Pemasangan](/id/channels/pairing)
- [Discovery](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
