---
read_when:
    - Memasangkan atau menghubungkan kembali Node iOS
    - Menjalankan aplikasi iOS dari kode sumber
    - Pemecahan masalah penemuan Gateway atau perintah canvas
summary: 'Aplikasi node iOS: menghubungkan ke Gateway, penyandingan, kanvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-05-07T13:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: pratinjau internal. Aplikasi iOS belum didistribusikan secara publik.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kemampuan node: Canvas, snapshot Layar, tangkapan Kamera, Lokasi, mode Bicara, bangun Suara.
- Menerima perintah `node.invoke` dan melaporkan peristiwa status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pemasangan `role: node` baru
tanpa cakupan yang diminta. Pemasangan operator/browser dan perubahan peran, cakupan, metadata, atau
kunci publik apa pun tetap memerlukan persetujuan manual.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal alih-alih memublikasikan token APNs mentah
ke gateway.

Persyaratan di sisi Gateway:

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
- Relay mengembalikan handle relay buram plus izin kirim yang tercakup pada pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan dan menyertakannya dalam pendaftaran relay, sehingga pendaftaran berbasis relay didelegasikan ke gateway tertentu itu.
- Aplikasi meneruskan pendaftaran berbasis relay itu ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relay tersimpan itu untuk `push.test`, bangun latar belakang, dan dorongan bangun.
- URL dasar relay gateway harus cocok dengan URL relay yang disematkan ke build iOS resmi/TestFlight.
- Jika aplikasi kemudian terhubung ke gateway berbeda atau build dengan URL dasar relay berbeda, aplikasi menyegarkan pendaftaran relay alih-alih menggunakan kembali binding lama.

Yang **tidak** diperlukan Gateway untuk jalur ini:

- Tidak ada token relay tingkat deployment.
- Tidak ada kunci APNs langsung untuk pengiriman resmi/TestFlight berbasis relay.

Alur operator yang diharapkan:

1. Instal build iOS resmi/TestFlight.
2. Tetapkan `gateway.push.apns.relay.baseUrl` pada gateway.
3. Pasangkan aplikasi ke gateway dan biarkan selesai terhubung.
4. Aplikasi memublikasikan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan pendaftaran relay berhasil.
5. Setelah itu, `push.test`, bangun koneksi ulang, dan dorongan bangun dapat menggunakan pendaftaran berbasis relay yang tersimpan.

## Beacon hidup latar belakang

Saat iOS membangunkan aplikasi untuk push senyap, penyegaran latar belakang, atau peristiwa lokasi signifikan, aplikasi
mencoba koneksi ulang node singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`.
Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya
setelah identitas perangkat node yang terautentikasi diketahui.

Aplikasi menganggap bangun latar belakang berhasil dicatat hanya saat respons gateway menyertakan
`handled: true`. Gateway lama dapat mengakui `node.event` dengan `{ "ok": true }`; respons itu
kompatibel tetapi tidak dihitung sebagai pembaruan terakhir terlihat yang persisten.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat disediakan APNs langsung di gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay hosted.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang dipasangkan dengan
  gateway tertentu itu.

Tahap demi tahap:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama dipasangkan dengan gateway melalui alur autentikasi Gateway normal.
   - Itu memberi aplikasi sesi node yang terautentikasi plus sesi operator yang terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint pendaftaran relay melalui HTTPS.
   - Pendaftaran menyertakan bukti App Attest plus JWS transaksi aplikasi StoreKit.
   - Relay memvalidasi ID bundle, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan
     jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal agar tidak menggunakan relay hosted. Build lokal dapat
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum pendaftaran relay, aplikasi mengambil identitas gateway yang dipasangkan dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway itu dalam payload pendaftaran relay.
   - Relay mengembalikan handle relay dan izin kirim yang tercakup pada pendaftaran yang didelegasikan ke
     identitas gateway itu.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan izin kirim dari `push.apns.register`.
   - Pada `push.test`, bangun koneksi ulang, dan dorongan bangun, gateway menandatangani permintaan kirim dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi izin kirim tersimpan dan tanda tangan gateway terhadap identitas
     gateway yang didelegasikan dari pendaftaran.
   - Gateway lain tidak dapat menggunakan kembali pendaftaran tersimpan itu, meskipun somehow memperoleh handle tersebut.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang dipasangkan.

Alasan desain ini dibuat:

- Untuk menjauhkan kredensial APNs produksi dari gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk mengizinkan penggunaan relay hosted hanya untuk build OpenClaw resmi/TestFlight.
- Untuk mencegah satu gateway mengirim push bangun ke perangkat iOS yang dimiliki gateway berbeda.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env vars runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
autentikasi App Store Connect / TestFlight seperti `ASC_KEY_ID` dan `ASC_ISSUER_ID`; file itu tidak mengonfigurasi
pengiriman APNs langsung untuk build iOS lokal.

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

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, saat dikonfigurasi, domain
penemuan DNS-SD area luas yang sama. Gateway dalam LAN yang sama muncul otomatis dari `local.`;
penemuan lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah tipe beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
`openclaw.internal.`) dan DNS terpisah Tailscale.
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
- Node iOS otomatis bernavigasi ke A2UI saat terhubung ketika URL host canvas diiklankan.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan Computer Use

Aplikasi iOS adalah permukaan node seluler, bukan backend Codex Computer Use. Codex
Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui alat MCP;
aplikasi iOS mengekspos kemampuan iPhone melalui perintah node OpenClaw
seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agent tetap dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan memanggil perintah
node, tetapi panggilan tersebut melalui protokol node gateway dan mengikuti batasan
latar depan/latar belakang iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use)
untuk kontrol desktop lokal dan halaman ini untuk kemampuan node iOS.

### Eval / snapshot Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Bangun suara + mode bicara

- Bangun suara dan mode bicara tersedia di Settings.
- Node iOS yang mendukung bicara mengiklankan kemampuan `talk` dan dapat mendeklarasikan
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`;
  Gateway mengizinkan perintah push-to-talk tersebut secara default untuk node tepercaya
  yang mendukung Bicara.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai upaya terbaik saat aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke latar depan (perintah canvas/kamera/layar memerlukannya).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway tidak mengiklankan URL permukaan Plugin Canvas; periksa `plugins.entries.canvas.config.host` di [konfigurasi Gateway](/id/gateway/configuration).
- Prompt pemasangan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Koneksi ulang gagal setelah instal ulang: token pemasangan Keychain telah dihapus; pasangkan ulang node.

## Dokumen terkait

- [Pemasangan](/id/channels/pairing)
- [Penemuan](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
