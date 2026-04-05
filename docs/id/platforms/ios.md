---
read_when:
    - Melakukan pairing atau menyambungkan ulang node iOS
    - Menjalankan app iOS dari source
    - Men-debug discovery gateway atau command canvas
summary: 'App node iOS: terhubung ke Gateway, pairing, canvas, dan pemecahan masalah'
title: App iOS
x-i18n:
    generated_at: "2026-04-05T14:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# App iOS (Node)

Ketersediaan: pratinjau internal. App iOS belum didistribusikan secara publik.

## Fungsinya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kapabilitas node: Canvas, snapshot layar, pengambilan kamera, Lokasi, mode Talk, Voice wake.
- Menerima command `node.invoke` dan melaporkan event status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Quick start (pair + connect)

1. Jalankan Gateway:

```bash
openclaw gateway --port 18789
```

2. Di app iOS, buka Settings dan pilih gateway yang ditemukan (atau aktifkan Manual Host dan masukkan host/port).

3. Setujui permintaan pairing di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika app mencoba ulang pairing dengan detail auth yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya akan digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum menyetujui.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal alih-alih memublikasikan token APNs mentah
ke gateway.

Persyaratan sisi gateway:

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

- App iOS mendaftar ke relay menggunakan App Attest dan receipt app.
- Relay mengembalikan relay handle opaque plus send grant yang dicakup pendaftaran.
- App iOS mengambil identitas gateway yang telah dipasangkan dan menyertakannya dalam pendaftaran relay, sehingga pendaftaran berbasis relay didelegasikan ke gateway tertentu tersebut.
- App meneruskan pendaftaran berbasis relay itu ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan relay handle yang tersimpan itu untuk `push.test`, wake latar belakang, dan wake nudge.
- URL dasar relay gateway harus cocok dengan URL relay yang sudah ditanamkan ke dalam build iOS resmi/TestFlight.
- Jika app kemudian terhubung ke gateway yang berbeda atau build dengan URL dasar relay yang berbeda, app akan me-refresh pendaftaran relay alih-alih menggunakan kembali binding lama.

Yang **tidak** diperlukan gateway untuk jalur ini:

- Tidak ada token relay untuk seluruh deployment.
- Tidak ada key APNs langsung untuk pengiriman resmi/TestFlight berbasis relay.

Alur operator yang diharapkan:

1. Instal build iOS resmi/TestFlight.
2. Setel `gateway.push.apns.relay.baseUrl` pada gateway.
3. Pair app ke gateway dan biarkan koneksi selesai.
4. App memublikasikan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan pendaftaran relay berhasil.
5. Setelah itu, `push.test`, reconnect wake, dan wake nudge dapat menggunakan pendaftaran berbasis relay yang tersimpan.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` tetap berfungsi sebagai override env sementara untuk gateway.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat disediakan oleh APNs langsung-di-gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay yang di-host.
- Gateway hanya dapat mengirim push berbasis relay untuk perangkat iOS yang dipasangkan dengan gateway
  tertentu tersebut.

Per hop:

1. `app iOS -> gateway`
   - App terlebih dahulu melakukan pairing dengan gateway melalui alur auth Gateway normal.
   - Ini memberi app sesi node yang terautentikasi plus sesi operator yang terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `app iOS -> relay`
   - App memanggil endpoint pendaftaran relay melalui HTTPS.
   - Pendaftaran mencakup bukti App Attest plus receipt app.
   - Relay memvalidasi bundle ID, bukti App Attest, dan receipt Apple, serta mewajibkan jalur distribusi resmi/produksi.
   - Inilah yang mencegah build Xcode/dev lokal menggunakan relay yang di-host. Build lokal mungkin
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `delegasi identitas gateway`
   - Sebelum pendaftaran relay, app mengambil identitas gateway yang dipasangkan dari
     `gateway.identity.get`.
   - App menyertakan identitas gateway tersebut dalam payload pendaftaran relay.
   - Relay mengembalikan relay handle dan send grant yang dicakup pendaftaran yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan relay handle dan send grant dari `push.apns.register`.
   - Pada `push.test`, reconnect wake, dan wake nudge, gateway menandatangani permintaan kirim dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi baik send grant yang tersimpan maupun tanda tangan gateway terhadap identitas
     gateway yang didelegasikan dari pendaftaran.
   - Gateway lain tidak dapat menggunakan kembali pendaftaran yang tersimpan itu, bahkan jika entah bagaimana memperoleh handle tersebut.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang dipasangkan.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap berada di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk mengizinkan penggunaan relay yang di-host hanya untuk build OpenClaw resmi/TestFlight.
- Untuk mencegah satu gateway mengirim wake push ke perangkat iOS milik gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay, maka
gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Jalur discovery

### Bonjour (LAN)

App iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, jika dikonfigurasi, domain discovery DNS-SD wide-area yang sama. Gateway pada LAN yang sama muncul otomatis dari `local.`;
discovery lintas jaringan dapat menggunakan domain wide-area yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
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

- Host canvas Gateway menyajikan `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/`.
- Disajikan dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS secara otomatis menavigasi ke A2UI saat terhubung ketika URL host canvas diumumkan.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + mode Talk

- Voice wake dan mode Talk tersedia di Settings.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai best-effort saat app tidak aktif.

## Error umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa app iOS ke foreground (command canvas/camera/screen memerlukannya).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway tidak mengumumkan URL host canvas; periksa `canvasHost` di [Konfigurasi Gateway](/id/gateway/configuration).
- Prompt pairing tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Reconnect gagal setelah instal ulang: token pairing Keychain telah dihapus; pair ulang node.

## Dokumen terkait

- [Pairing](/id/channels/pairing)
- [Discovery](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
