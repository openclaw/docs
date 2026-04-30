---
read_when:
    - Memasangkan atau menghubungkan kembali Node iOS
    - Menjalankan aplikasi iOS dari kode sumber
    - Men-debug penemuan Gateway atau perintah kanvas
summary: 'Aplikasi node iOS: menghubungkan ke Gateway, penyandingan, kanvas, dan pemecahan masalah'
title: aplikasi iOS
x-i18n:
    generated_at: "2026-04-30T09:59:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: pratinjau internal. App iOS belum didistribusikan secara publik.

## Apa yang Dilakukan

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kemampuan Node: Canvas, snapshot layar, pengambilan kamera, lokasi, mode bicara, bangun suara.
- Menerima perintah `node.invoke` dan melaporkan event status Node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui unicast DNS-SD (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Mulai Cepat (pair + connect)

1. Mulai Gateway:

```bash
openclaw gateway --port 18789
```

2. Di app iOS, buka Settings dan pilih gateway yang ditemukan (atau aktifkan Manual Host dan masukkan host/port).

3. Setujui permintaan pairing pada host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika app mencoba ulang pairing dengan detail auth yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Opsional: jika Node iOS selalu terhubung dari subnet yang dikontrol ketat, Anda
dapat ikut mengaktifkan persetujuan otomatis Node pertama kali dengan CIDR eksplisit atau IP tepat:

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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pairing `role: node` baru tanpa
scope yang diminta. Pairing operator/browser dan perubahan role, scope, metadata, atau
public-key apa pun tetap memerlukan persetujuan manual.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push Berbasis Relay untuk Build Resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal alih-alih menerbitkan token APNs mentah
ke gateway.

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

Cara alur ini bekerja:

- App iOS mendaftar ke relay menggunakan App Attest dan StoreKit app transaction JWS.
- Relay mengembalikan handle relay buram plus grant pengiriman berscope registrasi.
- App iOS mengambil identitas gateway yang sudah dipair dan menyertakannya dalam registrasi relay, sehingga registrasi berbasis relay didelegasikan ke gateway spesifik tersebut.
- App meneruskan registrasi berbasis relay tersebut ke gateway yang sudah dipair dengan `push.apns.register`.
- Gateway menggunakan handle relay tersimpan tersebut untuk `push.test`, bangun latar belakang, dan nudges bangun.
- URL dasar relay gateway harus cocok dengan URL relay yang dibundel ke dalam build iOS resmi/TestFlight.
- Jika app kemudian terhubung ke gateway berbeda atau build dengan URL dasar relay berbeda, app menyegarkan registrasi relay alih-alih menggunakan ulang binding lama.

Yang **tidak** diperlukan gateway untuk jalur ini:

- Tidak ada token relay tingkat deployment.
- Tidak ada kunci APNs langsung untuk pengiriman berbasis relay resmi/TestFlight.

Alur operator yang diharapkan:

1. Instal build iOS resmi/TestFlight.
2. Atur `gateway.push.apns.relay.baseUrl` pada gateway.
3. Pair app ke gateway dan biarkan selesai terhubung.
4. App menerbitkan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan registrasi relay berhasil.
5. Setelah itu, `push.test`, bangun koneksi ulang, dan nudges bangun dapat menggunakan registrasi berbasis relay yang tersimpan.

## Beacon Hidup Latar Belakang

Saat iOS membangunkan app untuk silent push, background refresh, atau event lokasi signifikan, app
mencoba koneksi ulang Node singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`.
Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata Node/perangkat yang sudah dipair hanya
setelah identitas perangkat Node terautentikasi diketahui.

App menganggap bangun latar belakang berhasil dicatat hanya ketika respons gateway menyertakan
`handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons itu
kompatibel tetapi tidak dihitung sebagai pembaruan last-seen yang tahan lama.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.

## Alur Autentikasi dan Kepercayaan

Relay ada untuk menerapkan dua batasan yang tidak dapat disediakan APNs langsung di gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay hosted.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang dipair dengan gateway spesifik
  tersebut.

Hop demi hop:

1. `iOS app -> gateway`
   - App pertama-tama dipair dengan gateway melalui alur auth Gateway normal.
   - Itu memberi app sesi Node terautentikasi plus sesi operator terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - App memanggil endpoint registrasi relay melalui HTTPS.
   - Registrasi menyertakan bukti App Attest plus StoreKit app transaction JWS.
   - Relay memvalidasi bundle ID, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan
     jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal agar tidak menggunakan relay hosted. Build lokal mungkin
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum registrasi relay, app mengambil identitas gateway yang sudah dipair dari
     `gateway.identity.get`.
   - App menyertakan identitas gateway tersebut dalam payload registrasi relay.
   - Relay mengembalikan handle relay dan grant pengiriman berscope registrasi yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, bangun koneksi ulang, dan nudges bangun, gateway menandatangani permintaan pengiriman dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi grant pengiriman tersimpan dan tanda tangan gateway terhadap identitas
     gateway terdelegasi dari registrasi.
   - Gateway lain tidak dapat menggunakan ulang registrasi tersimpan tersebut, bahkan jika entah bagaimana memperoleh handle-nya.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push final ke APNs atas nama gateway yang sudah dipair.

Alasan desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk memungkinkan penggunaan relay hosted hanya untuk build OpenClaw resmi/TestFlight.
- Untuk mencegah satu gateway mengirim push bangun ke perangkat iOS milik gateway berbeda.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway masih memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env vars runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
auth App Store Connect / TestFlight seperti `ASC_KEY_ID` dan `ASC_ISSUER_ID`; itu tidak mengonfigurasi
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

## Jalur Penemuan

### Bonjour (LAN)

App iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, saat dikonfigurasi, domain
penemuan DNS-SD area luas yang sama. Gateway pada LAN yang sama muncul otomatis dari `local.`;
penemuan lintas-jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas-jaringan)

Jika mDNS diblokir, gunakan zona unicast DNS-SD (pilih domain; contoh:
`openclaw.internal.`) dan Tailscale split DNS.
Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host gateway + port (default `18789`).

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Host canvas Gateway melayani `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/`.
- Ini disajikan dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS otomatis menavigasi ke A2UI saat terhubung ketika URL host canvas diiklankan.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan dengan Computer Use

App iOS adalah permukaan Node seluler, bukan backend Codex Computer Use. Codex
Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui tool MCP;
app iOS mengekspos kemampuan iPhone melalui perintah Node OpenClaw
seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agent tetap dapat mengoperasikan app iOS melalui OpenClaw dengan menjalankan perintah
Node, tetapi panggilan tersebut melewati protokol Node gateway dan mengikuti batas
foreground/background iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use)
untuk kontrol desktop lokal dan halaman ini untuk kemampuan Node iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Bangun Suara + Mode Bicara

- Bangun suara dan mode bicara tersedia di Settings.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai upaya terbaik saat app tidak aktif.

## Kesalahan Umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa app iOS ke foreground (perintah canvas/camera/screen memerlukannya).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway tidak mengiklankan URL host canvas; periksa `canvasHost` di [konfigurasi Gateway](/id/gateway/configuration).
- Prompt pairing tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Koneksi ulang gagal setelah instal ulang: token pairing Keychain telah dihapus; pair ulang Node.

## Dokumentasi Terkait

- [Pairing](/id/channels/pairing)
- [Penemuan](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
