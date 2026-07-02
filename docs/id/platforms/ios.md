---
read_when:
    - Memasangkan atau menyambungkan kembali Node iOS
    - Menjalankan aplikasi iOS dari source
    - Men-debug penemuan Gateway atau perintah canvas
summary: 'Aplikasi Node iOS: terhubung ke Gateway, penyandingan, kanvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-07-02T22:50:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: build aplikasi iPhone didistribusikan melalui kanal Apple saat diaktifkan untuk sebuah rilis. Build pengembangan lokal juga dapat dijalankan dari sumber.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kemampuan node: Canvas, snapshot Layar, pengambilan Kamera, Lokasi, mode Talk, bangun Suara.
- Menerima perintah `node.invoke` dan melaporkan peristiwa status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui unicast DNS-SD (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Mulai cepat (pasangkan + hubungkan)

1. Mulai Gateway:

```bash
openclaw gateway --port 18789
```

2. Di aplikasi iOS, buka Settings dan pilih gateway yang ditemukan (atau aktifkan Manual Host dan masukkan host/port).

3. Setujui permintaan pemasangan di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba ulang pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Opsional: jika node iOS selalu terhubung dari subnet yang dikontrol ketat, Anda
dapat memilih persetujuan otomatis node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pemasangan `role: node` baru tanpa
cakupan yang diminta. Pemasangan operator/browser dan perubahan peran, cakupan, metadata, atau
kunci publik apa pun tetap memerlukan persetujuan manual.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal alih-alih memublikasikan token APNs mentah
ke gateway.

Build App Store resmi dari lane rilis publik menggunakan relay terhosting di `https://ios-push-relay.openclaw.ai`.

Deployment relay kustom memerlukan jalur build/deployment iOS yang sengaja terpisah dengan URL relay yang cocok dengan URL relay gateway. Lane rilis App Store publik tidak menerima override URL relay kustom. Jika Anda menggunakan build relay kustom, atur URL relay gateway yang cocok:

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

Cara alurnya bekerja:

- Aplikasi iOS mendaftar ke relay menggunakan App Attest dan JWS transaksi aplikasi StoreKit.
- Relay mengembalikan handle relay opak beserta grant pengiriman yang tercakup pada pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan dan menyertakannya dalam pendaftaran relay, sehingga pendaftaran berbasis relay didelegasikan ke gateway spesifik tersebut.
- Aplikasi meneruskan pendaftaran berbasis relay itu ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relay yang tersimpan itu untuk `push.test`, bangun latar belakang, dan dorongan bangun.
- URL relay gateway kustom harus cocok dengan URL relay yang dipanggang ke dalam build iOS.
- Jika aplikasi kemudian terhubung ke gateway berbeda atau build dengan URL dasar relay berbeda, aplikasi menyegarkan pendaftaran relay alih-alih menggunakan kembali binding lama.

Yang **tidak** diperlukan gateway untuk jalur ini:

- Tidak ada token relay tingkat deployment.
- Tidak ada kunci APNs langsung untuk pengiriman berbasis relay App Store resmi.

Alur operator yang diharapkan:

1. Instal aplikasi iOS resmi.
2. Opsional: atur `gateway.push.apns.relay.baseUrl` di gateway hanya saat menggunakan build relay kustom yang sengaja terpisah.
3. Pasangkan aplikasi ke gateway dan biarkan selesai terhubung.
4. Aplikasi memublikasikan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan pendaftaran relay berhasil.
5. Setelah itu, `push.test`, bangun koneksi ulang, dan dorongan bangun dapat menggunakan pendaftaran berbasis relay yang tersimpan.

## Beacon aktif latar belakang

Saat iOS membangunkan aplikasi untuk push senyap, penyegaran latar belakang, atau peristiwa lokasi signifikan, aplikasi
mencoba koneksi ulang node singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`.
Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya
setelah identitas perangkat node terautentikasi diketahui.

Aplikasi menganggap bangun latar belakang berhasil dicatat hanya saat respons gateway menyertakan
`handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons itu
kompatibel tetapi tidak dihitung sebagai pembaruan terakhir-terlihat yang tahan lama.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.
- Lane rilis App Store publik menolak `OPENCLAW_PUSH_RELAY_BASE_URL` untuk build iOS.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat diberikan APNs langsung di gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay terhosting.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang dipasangkan dengan gateway spesifik
  tersebut.

Hop demi hop:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama dipasangkan dengan gateway melalui alur autentikasi Gateway normal.
   - Itu memberi aplikasi sesi node terautentikasi beserta sesi operator terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint pendaftaran relay melalui HTTPS.
   - Pendaftaran menyertakan bukti App Attest beserta JWS transaksi aplikasi StoreKit.
   - Relay memvalidasi ID bundle, bukti App Attest, dan bukti distribusi Apple, serta memerlukan
     jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal agar tidak menggunakan relay terhosting. Build lokal mungkin
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum pendaftaran relay, aplikasi mengambil identitas gateway yang dipasangkan dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway itu dalam payload pendaftaran relay.
   - Relay mengembalikan handle relay dan grant pengiriman yang tercakup pada pendaftaran yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, bangun koneksi ulang, dan dorongan bangun, gateway menandatangani permintaan pengiriman dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi grant pengiriman yang tersimpan dan tanda tangan gateway terhadap identitas
     gateway terdelegasi dari pendaftaran.
   - Gateway lain tidak dapat menggunakan kembali pendaftaran tersimpan itu, bahkan jika entah bagaimana memperoleh handle tersebut.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang dipasangkan.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk mengizinkan penggunaan relay terhosting hanya untuk build iOS OpenClaw resmi.
- Untuk mencegah satu gateway mengirim push bangun ke perangkat iOS yang dimiliki gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env var runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
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

## Jalur discovery

### Bonjour (LAN)

Aplikasi iOS menjelajahi `_openclaw-gw._tcp` pada `local.` dan, saat dikonfigurasi, domain
discovery DNS-SD area luas yang sama. Gateway LAN yang sama muncul otomatis dari `local.`;
discovery lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona unicast DNS-SD (pilih domain; contoh:
`openclaw.internal.`) dan split DNS Tailscale.
Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host gateway + port (default `18789`).

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Host canvas Gateway menyajikan `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/`.
- Ini disajikan dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS mempertahankan scaffold bawaan sebagai tampilan default yang terhubung. `canvas.a2ui.push` dan `canvas.a2ui.reset` menggunakan halaman A2UI bawaan milik aplikasi.
- Halaman A2UI Gateway jarak jauh bersifat hanya-render di iOS; aksi tombol A2UI native diterima hanya dari halaman bawaan milik aplikasi.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan Computer Use

Aplikasi iOS adalah permukaan node seluler, bukan backend Codex Computer Use. Codex
Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui alat MCP;
aplikasi iOS mengekspos kemampuan iPhone melalui perintah node OpenClaw
seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agen tetap dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan menjalankan perintah
node, tetapi panggilan tersebut melewati protokol node gateway dan mengikuti batas
foreground/background iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use)
untuk kontrol desktop lokal dan halaman ini untuk kemampuan node iOS.

### Eval / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + mode talk

- Voice wake dan mode talk tersedia di Settings.
- OpenAI realtime Talk menggunakan WebRTC milik klien saat `talk.realtime.transport` adalah `webrtc`; konfigurasi eksplisit `gateway-relay` tetap dimiliki Gateway. Lihat [Mode talk](/id/nodes/talk).
- Node iOS berkemampuan talk mengiklankan kemampuan `talk` dan dapat mendeklarasikan
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`;
  Gateway mengizinkan perintah push-to-talk tersebut secara default untuk node
  berkemampuan Talk yang tepercaya.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai upaya terbaik saat aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke foreground (perintah canvas/kamera/layar memerlukannya).
- `A2UI_HOST_UNAVAILABLE`: halaman A2UI bawaan tidak dapat dijangkau di WebView aplikasi; pertahankan aplikasi di foreground pada tab Screen dan coba lagi.
- Prompt pemasangan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Koneksi ulang gagal setelah instal ulang: token pemasangan Keychain telah dihapus; pasangkan ulang node.

## Dokumen terkait

- [Pemasangan](/id/channels/pairing)
- [Penemuan](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
