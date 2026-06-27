---
read_when:
    - Memasangkan atau menghubungkan ulang node iOS
    - Menjalankan aplikasi iOS dari sumber
    - Men-debug penemuan Gateway atau perintah kanvas
summary: 'Aplikasi node iOS: menghubungkan ke Gateway, pairing, kanvas, dan pemecahan masalah'
title: aplikasi iOS
x-i18n:
    generated_at: "2026-06-27T17:42:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: build aplikasi iPhone didistribusikan melalui kanal Apple saat diaktifkan untuk sebuah rilis. Build pengembangan lokal juga dapat dijalankan dari sumber.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kemampuan node: Canvas, snapshot layar, tangkapan Camera, Location, mode Talk, Voice wake.
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

Jika aplikasi mencoba kembali pemasangan dengan detail auth yang berubah (role/scopes/public key),
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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pemasangan `role: node` baru
tanpa scopes yang diminta. Pemasangan operator/browser dan perubahan role, scope, metadata, atau
public-key apa pun tetap memerlukan persetujuan manual.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal, bukan menerbitkan token APNs
mentah ke gateway.

Build resmi/TestFlight dari jalur rilis App Store publik menggunakan relay terhosting di `https://ios-push-relay.openclaw.ai`.

Deployment relay khusus memerlukan jalur build/deployment iOS yang sengaja dipisahkan, dengan URL relay yang cocok dengan URL relay gateway. Jalur rilis App Store publik tidak menerima override URL relay khusus. Jika Anda menggunakan build relay khusus, tetapkan URL relay gateway yang sesuai:

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
- Relay mengembalikan handle relay buram beserta grant pengiriman yang tercakup pada pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan dan menyertakannya dalam pendaftaran relay, sehingga pendaftaran berbasis relay didelegasikan ke gateway spesifik tersebut.
- Aplikasi meneruskan pendaftaran berbasis relay tersebut ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relay tersimpan tersebut untuk `push.test`, wake latar belakang, dan wake nudges.
- URL relay gateway khusus harus cocok dengan URL relay yang tertanam dalam build iOS.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan URL dasar relay yang berbeda, aplikasi menyegarkan pendaftaran relay alih-alih menggunakan ulang binding lama.

Yang **tidak** diperlukan gateway untuk jalur ini:

- Tidak ada token relay seluruh deployment.
- Tidak ada kunci APNs langsung untuk pengiriman resmi/TestFlight berbasis relay.

Alur operator yang diharapkan:

1. Instal build iOS resmi/TestFlight.
2. Opsional: tetapkan `gateway.push.apns.relay.baseUrl` pada gateway hanya saat menggunakan build relay khusus yang sengaja dipisahkan.
3. Pasangkan aplikasi ke gateway dan biarkan selesai terhubung.
4. Aplikasi menerbitkan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan pendaftaran relay berhasil.
5. Setelah itu, `push.test`, wake untuk tersambung kembali, dan wake nudges dapat menggunakan pendaftaran berbasis relay yang tersimpan.

## Beacon hidup latar belakang

Saat iOS membangunkan aplikasi untuk silent push, background refresh, atau peristiwa significant-location, aplikasi
mencoba penyambungan ulang node singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`.
Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya
setelah identitas perangkat node terautentikasi diketahui.

Aplikasi menganggap wake latar belakang berhasil dicatat hanya saat respons gateway menyertakan
`handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons itu
kompatibel tetapi tidak dihitung sebagai pembaruan last-seen yang tahan lama.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.
- Jalur rilis App Store publik menolak `OPENCLAW_PUSH_RELAY_BASE_URL` untuk build iOS.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat disediakan APNs langsung di gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay terhosting.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang dipasangkan dengan
  gateway spesifik tersebut.

Hop demi hop:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama dipasangkan dengan gateway melalui alur auth Gateway normal.
   - Ini memberi aplikasi sesi node terautentikasi beserta sesi operator terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint pendaftaran relay melalui HTTPS.
   - Pendaftaran menyertakan bukti App Attest beserta JWS transaksi aplikasi StoreKit.
   - Relay memvalidasi bundle ID, bukti App Attest, dan bukti distribusi Apple, serta mengharuskan
     jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal dari penggunaan relay terhosting. Build lokal mungkin
     ditandatangani, tetapi tidak memenuhi bukti distribusi resmi Apple yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum pendaftaran relay, aplikasi mengambil identitas gateway yang dipasangkan dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway tersebut dalam payload pendaftaran relay.
   - Relay mengembalikan handle relay dan grant pengiriman yang tercakup pada pendaftaran yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, wake untuk tersambung kembali, dan wake nudges, gateway menandatangani permintaan pengiriman dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi baik grant pengiriman yang tersimpan maupun tanda tangan gateway terhadap identitas
     gateway yang didelegasikan dari pendaftaran.
   - Gateway lain tidak dapat menggunakan ulang pendaftaran tersimpan tersebut, sekalipun entah bagaimana memperoleh handle-nya.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang dipasangkan.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk mengizinkan penggunaan relay terhosting hanya bagi build OpenClaw resmi/TestFlight.
- Untuk mencegah satu gateway mengirim push wake ke perangkat iOS yang dimiliki gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env vars runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
auth App Store Connect / TestFlight seperti `APP_STORE_CONNECT_KEY_ID` dan
`APP_STORE_CONNECT_ISSUER_ID`; itu tidak mengonfigurasi pengiriman APNs langsung untuk build iOS lokal.

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

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, saat dikonfigurasi, domain
discovery DNS-SD area luas yang sama. Gateway dalam LAN yang sama muncul otomatis dari `local.`;
discovery lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
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
- Halaman A2UI Gateway jarak jauh hanya render di iOS; tindakan tombol A2UI native hanya diterima dari halaman bawaan milik aplikasi.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan Computer Use

Aplikasi iOS adalah permukaan node seluler, bukan backend Codex Computer Use. Codex
Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui alat MCP;
aplikasi iOS mengekspos kemampuan iPhone melalui perintah node OpenClaw
seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agent tetap dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan memanggil perintah
node, tetapi panggilan tersebut melewati protokol node gateway dan mengikuti batas
foreground/background iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use)
untuk kontrol desktop lokal dan halaman ini untuk kemampuan node iOS.

### Eval / snapshot Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + mode talk

- Voice wake dan mode talk tersedia di Settings.
- Node iOS yang mampu talk mengiklankan kemampuan `talk` dan dapat mendeklarasikan
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`;
  Gateway mengizinkan perintah push-to-talk tersebut secara default untuk node
  tepercaya yang mampu Talk.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai upaya terbaik saat aplikasi tidak aktif.

## Kesalahan umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke foreground (perintah canvas/camera/screen memerlukannya).
- `A2UI_HOST_UNAVAILABLE`: halaman A2UI bawaan tidak dapat dijangkau di WebView aplikasi; pertahankan aplikasi di foreground pada tab Screen dan coba lagi.
- Prompt pemasangan tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Penyambungan ulang gagal setelah instal ulang: token pemasangan Keychain telah dihapus; pasangkan ulang node.

## Dokumentasi terkait

- [Pairing](/id/channels/pairing)
- [Discovery](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
