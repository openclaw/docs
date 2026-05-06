---
read_when:
    - Memasangkan atau menghubungkan kembali Node iOS
    - Menjalankan aplikasi iOS dari kode sumber
    - Pemecahan masalah penemuan Gateway atau perintah kanvas
summary: 'Aplikasi node iOS: terhubung ke Gateway, penyandingan, kanvas, dan pemecahan masalah'
title: aplikasi iOS
x-i18n:
    generated_at: "2026-05-06T09:19:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: pratinjau internal. Aplikasi iOS belum didistribusikan secara publik.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kemampuan node: Canvas, snapshot Screen, tangkapan Camera, Location, mode Talk, wake Voice.
- Menerima perintah `node.invoke` dan melaporkan peristiwa status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Mulai cepat (sandingkan + hubungkan)

1. Jalankan Gateway:

```bash
openclaw gateway --port 18789
```

2. Di aplikasi iOS, buka Settings dan pilih gateway yang ditemukan (atau aktifkan Manual Host dan masukkan host/port).

3. Setujui permintaan penyandingan di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba menyandingkan ulang dengan detail autentikasi yang berubah (peran/cakupan/kunci publik),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Opsional: jika node iOS selalu terhubung dari subnet yang dikontrol ketat, Anda
dapat ikut serta dalam persetujuan otomatis node pertama kali dengan CIDR eksplisit atau IP tepat:

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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk penyandingan `role: node` baru dengan
tanpa cakupan yang diminta. Penyandingan operator/browser dan perubahan apa pun pada peran, cakupan, metadata, atau
kunci publik tetap memerlukan persetujuan manual.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal, bukan menerbitkan token APNs
mentah ke gateway.

Persyaratan sisi Gateway:

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
- Relay mengembalikan handle relay buram plus grant pengiriman yang tercakup pada registrasi.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan dan menyertakannya dalam registrasi relay, sehingga registrasi berbasis relay didelegasikan ke gateway spesifik tersebut.
- Aplikasi meneruskan registrasi berbasis relay itu ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relay yang tersimpan itu untuk `push.test`, wake latar belakang, dan nudges wake.
- URL dasar relay gateway harus cocok dengan URL relay yang dibundel ke dalam build iOS resmi/TestFlight.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan URL dasar relay yang berbeda, aplikasi menyegarkan registrasi relay alih-alih menggunakan ulang binding lama.

Yang **tidak** dibutuhkan gateway untuk jalur ini:

- Tidak ada token relay tingkat deployment.
- Tidak ada kunci APNs langsung untuk pengiriman resmi/TestFlight berbasis relay.

Alur operator yang diharapkan:

1. Instal build iOS resmi/TestFlight.
2. Tetapkan `gateway.push.apns.relay.baseUrl` pada gateway.
3. Sandingkan aplikasi ke gateway dan biarkan selesai terhubung.
4. Aplikasi menerbitkan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan registrasi relay berhasil.
5. Setelah itu, `push.test`, wake koneksi ulang, dan nudges wake dapat menggunakan registrasi berbasis relay yang tersimpan.

## Beacon tetap aktif di latar belakang

Ketika iOS membangunkan aplikasi untuk push senyap, penyegaran latar belakang, atau peristiwa lokasi signifikan, aplikasi
mencoba koneksi ulang node singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`.
Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya
setelah identitas perangkat node yang diautentikasi diketahui.

Aplikasi memperlakukan wake latar belakang sebagai berhasil dicatat hanya ketika respons gateway menyertakan
`handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons itu
kompatibel tetapi tidak dihitung sebagai pembaruan last-seen yang tahan lama.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai pengesampingan env sementara untuk gateway.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat disediakan APNs langsung di gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay yang dihosting.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang disandingkan dengan gateway spesifik tersebut.

Langkah demi langkah:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama disandingkan dengan gateway melalui alur autentikasi Gateway normal.
   - Itu memberi aplikasi sesi node yang diautentikasi plus sesi operator yang diautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint registrasi relay melalui HTTPS.
   - Registrasi menyertakan bukti App Attest plus JWS transaksi aplikasi StoreKit.
   - Relay memvalidasi ID bundle, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan
     jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal dari penggunaan relay yang dihosting. Build lokal mungkin
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum registrasi relay, aplikasi mengambil identitas gateway yang dipasangkan dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway itu dalam payload registrasi relay.
   - Relay mengembalikan handle relay dan grant pengiriman yang tercakup pada registrasi yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, wake koneksi ulang, dan nudges wake, gateway menandatangani permintaan pengiriman dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi grant pengiriman tersimpan dan tanda tangan gateway terhadap identitas gateway
     yang didelegasikan dari registrasi.
   - Gateway lain tidak dapat menggunakan ulang registrasi tersimpan itu, meskipun entah bagaimana memperoleh handle-nya.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang dipasangkan.

Alasan desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs mentah build resmi di gateway.
- Untuk memungkinkan penggunaan relay yang dihosting hanya untuk build OpenClaw resmi/TestFlight.
- Untuk mencegah satu gateway mengirim push wake ke perangkat iOS yang dimiliki gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway masih memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah variabel env runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
autentikasi App Store Connect / TestFlight seperti `ASC_KEY_ID` dan `ASC_ISSUER_ID`; itu tidak mengonfigurasi
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

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, ketika dikonfigurasi, domain
penemuan DNS-SD area luas yang sama. Gateway LAN yang sama muncul otomatis dari `local.`;
penemuan lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah tipe beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
`openclaw.internal.`) dan DNS split Tailscale.
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
- Node iOS otomatis menavigasi ke A2UI saat terhubung ketika URL host canvas diiklankan.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan Computer Use

Aplikasi iOS adalah permukaan node seluler, bukan backend Codex Computer Use. Codex
Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui alat MCP;
aplikasi iOS mengekspos kemampuan iPhone melalui perintah node OpenClaw
seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agent tetap dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan memanggil perintah
node, tetapi panggilan tersebut melalui protokol node gateway dan mengikuti batas
foreground/background iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use)
untuk kontrol desktop lokal dan halaman ini untuk kemampuan node iOS.

### Eval / snapshot Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Wake Voice + mode Talk

- Wake Voice dan mode Talk tersedia di Settings.
- Node iOS berkemampuan Talk mengiklankan kemampuan `talk` dan dapat mendeklarasikan
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`;
  Gateway mengizinkan perintah push-to-talk tersebut secara default untuk node
  berkemampuan Talk yang tepercaya.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai upaya terbaik saat aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke foreground (perintah canvas/camera/screen memerlukannya).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway tidak mengiklankan URL host canvas; periksa `canvasHost` di [konfigurasi Gateway](/id/gateway/configuration).
- Prompt penyandingan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Koneksi ulang gagal setelah instal ulang: token penyandingan Keychain telah dihapus; sandingkan ulang node.

## Dokumen terkait

- [Penyandingan](/id/channels/pairing)
- [Penemuan](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
