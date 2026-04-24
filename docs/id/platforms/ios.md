---
read_when:
    - Melakukan pairing atau menyambungkan ulang node iOS
    - Menjalankan aplikasi iOS dari source
    - Men-debug discovery gateway atau perintah canvas
summary: 'Aplikasi node iOS: hubungkan ke Gateway, pairing, canvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-04-24T09:16:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Ketersediaan: pratinjau internal. Aplikasi iOS belum didistribusikan secara publik.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kapabilitas node: Canvas, snapshot layar, capture kamera, lokasi, mode Talk, voice wake.
- Menerima perintah `node.invoke` dan melaporkan event status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui unicast DNS-SD (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Mulai cepat (pair + connect)

1. Mulai Gateway:

```bash
openclaw gateway --port 18789
```

2. Di aplikasi iOS, buka Settings dan pilih gateway yang ditemukan (atau aktifkan Manual Host dan masukkan host/port).

3. Setujui permintaan pairing di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba pairing ulang dengan detail auth yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya akan digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum menyetujui.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan push relay eksternal alih-alih memublikasikan token APNs mentah ke gateway.

Persyaratan di sisi gateway:

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

- Aplikasi iOS mendaftar ke relay menggunakan App Attest dan receipt aplikasi.
- Relay mengembalikan relay handle opak plus grant pengiriman dengan cakupan pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang sudah dipairing dan menyertakannya dalam pendaftaran relay, sehingga pendaftaran berbasis relay didelegasikan ke gateway spesifik tersebut.
- Aplikasi meneruskan pendaftaran berbasis relay itu ke gateway yang sudah dipairing dengan `push.apns.register`.
- Gateway menggunakan relay handle yang tersimpan itu untuk `push.test`, wake latar belakang, dan wake nudges.
- URL dasar relay gateway harus cocok dengan URL relay yang ditanamkan ke dalam build iOS resmi/TestFlight.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan URL dasar relay yang berbeda, aplikasi menyegarkan pendaftaran relay alih-alih menggunakan binding lama.

Yang **tidak** dibutuhkan gateway untuk jalur ini:

- Tidak perlu relay token yang berlaku untuk seluruh deployment.
- Tidak perlu kunci APNs langsung untuk pengiriman berbasis relay resmi/TestFlight.

Alur operator yang diharapkan:

1. Pasang build iOS resmi/TestFlight.
2. Atur `gateway.push.apns.relay.baseUrl` pada gateway.
3. Pair aplikasi ke gateway dan biarkan aplikasi selesai terhubung.
4. Aplikasi memublikasikan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan pendaftaran relay berhasil.
5. Setelah itu, `push.test`, reconnect wakes, dan wake nudges dapat menggunakan pendaftaran berbasis relay yang tersimpan.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` tetap berfungsi sebagai override env sementara untuk gateway.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat diberikan oleh APNs-langsung-di-gateway
untuk build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay yang di-host.
- Sebuah gateway hanya dapat mengirim push berbasis relay untuk perangkat iOS yang dipairing dengan gateway spesifik tersebut.

Langkah demi langkah:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama melakukan pairing dengan gateway melalui alur auth Gateway normal.
   - Ini memberi aplikasi sesi node yang diautentikasi plus sesi operator yang diautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint pendaftaran relay melalui HTTPS.
   - Pendaftaran mencakup bukti App Attest plus receipt aplikasi.
   - Relay memvalidasi bundle ID, bukti App Attest, dan receipt Apple, serta mewajibkan jalur distribusi resmi/produksi.
   - Inilah yang memblokir build lokal Xcode/dev untuk menggunakan relay yang di-host. Build lokal mungkin ditandatangani, tetapi tidak memenuhi bukti distribusi resmi Apple yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum pendaftaran relay, aplikasi mengambil identitas gateway yang telah dipairing dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway itu dalam payload pendaftaran relay.
   - Relay mengembalikan relay handle dan grant pengiriman dengan cakupan pendaftaran yang didelegasikan ke identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan relay handle dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, reconnect wakes, dan wake nudges, gateway menandatangani permintaan pengiriman dengan identitas perangkatnya sendiri.
   - Relay memverifikasi grant pengiriman yang tersimpan dan signature gateway terhadap identitas gateway yang didelegasikan dari pendaftaran.
   - Gateway lain tidak dapat menggunakan ulang pendaftaran tersimpan itu, meskipun entah bagaimana memperoleh handle tersebut.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push final ke APNs atas nama gateway yang sudah dipairing.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap berada di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk memungkinkan penggunaan relay yang di-host hanya untuk build OpenClaw resmi/TestFlight.
- Untuk mencegah satu gateway mengirim wake push ke perangkat iOS milik gateway yang berbeda.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay, gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env var runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan auth App Store Connect / TestFlight seperti `ASC_KEY_ID` dan `ASC_ISSUER_ID`; file itu tidak mengonfigurasi pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan yang direkomendasikan pada host gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Jangan commit file `.p8` atau meletakkannya di bawah checkout repo.

## Jalur discovery

### Bonjour (LAN)

Aplikasi iOS melakukan browse `_openclaw-gw._tcp` di `local.` dan, jika dikonfigurasi, domain discovery wide-area DNS-SD yang sama. Gateway pada LAN yang sama muncul otomatis dari `local.`; discovery lintas jaringan dapat menggunakan domain wide-area yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona unicast DNS-SD (pilih domain; contoh:
`openclaw.internal.`) dan split DNS Tailscale.
Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host + port gateway (default `18789`).

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Canvas host Gateway menyajikan `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/`.
- Ini disajikan dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS otomatis bernavigasi ke A2UI saat terhubung ketika URL canvas host diiklankan.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

### Eval / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + mode Talk

- Voice wake dan mode Talk tersedia di Settings.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai best-effort saat aplikasi tidak aktif.

## Error umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke foreground (perintah canvas/kamera/layar memerlukannya).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway tidak mengiklankan URL canvas host; periksa `canvasHost` di [Konfigurasi Gateway](/id/gateway/configuration).
- Prompt pairing tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Reconnect gagal setelah pemasangan ulang: token pairing di Keychain telah dibersihkan; lakukan pairing ulang node.

## Dokumen terkait

- [Pairing](/id/channels/pairing)
- [Discovery](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
