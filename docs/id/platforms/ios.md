---
read_when:
    - Memasangkan atau menghubungkan ulang node iOS
    - Menjalankan aplikasi iOS dari sumber
    - Men-debug discovery gateway atau perintah canvas
summary: 'Aplikasi node iOS: terhubung ke Gateway, pairing, canvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-07-02T08:49:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Ketersediaan: build aplikasi iPhone didistribusikan melalui kanal Apple saat diaktifkan untuk sebuah rilis. Build pengembangan lokal juga dapat dijalankan dari source.

## Apa yang dilakukannya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kemampuan node: Canvas, snapshot Screen, capture Camera, Location, mode Talk, Voice wake.
- Menerima perintah `node.invoke` dan melaporkan event status node.

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

3. Setujui permintaan pairing di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba ulang pairing dengan detail auth yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pairing `role: node` baru
tanpa scope yang diminta. Pairing operator/browser dan perubahan role, scope, metadata, atau
public-key apa pun tetap memerlukan persetujuan manual.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal alih-alih menerbitkan token APNs mentah
ke gateway.

Build App Store resmi dari lane rilis publik menggunakan relay hosted di `https://ios-push-relay.openclaw.ai`.

Deployment relay kustom memerlukan jalur build/deployment iOS yang sengaja dipisahkan dengan URL relay yang cocok dengan URL relay gateway. Lane rilis App Store publik tidak menerima override URL relay kustom. Jika Anda menggunakan build relay kustom, atur URL relay gateway yang cocok:

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

- Aplikasi iOS mendaftar ke relay menggunakan App Attest dan StoreKit app transaction JWS.
- Relay mengembalikan handle relay buram plus grant pengiriman yang scoped ke pendaftaran.
- Aplikasi iOS mengambil identitas gateway yang dipasangkan dan menyertakannya dalam pendaftaran relay, sehingga pendaftaran berbasis relay didelegasikan ke gateway spesifik tersebut.
- Aplikasi meneruskan pendaftaran berbasis relay itu ke gateway yang dipasangkan dengan `push.apns.register`.
- Gateway menggunakan handle relay yang tersimpan itu untuk `push.test`, wake latar belakang, dan wake nudge.
- URL relay gateway kustom harus cocok dengan URL relay yang dibaked ke dalam build iOS.
- Jika aplikasi kemudian terhubung ke gateway berbeda atau build dengan URL dasar relay berbeda, aplikasi menyegarkan pendaftaran relay alih-alih menggunakan ulang binding lama.

Yang **tidak** dibutuhkan gateway untuk jalur ini:

- Tidak ada token relay tingkat deployment.
- Tidak ada key APNs langsung untuk pengiriman berbasis relay App Store resmi.

Alur operator yang diharapkan:

1. Instal aplikasi iOS resmi.
2. Opsional: atur `gateway.push.apns.relay.baseUrl` di gateway hanya saat menggunakan build relay kustom yang sengaja dipisahkan.
3. Pasangkan aplikasi ke gateway dan biarkan selesai terhubung.
4. Aplikasi menerbitkan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan pendaftaran relay berhasil.
5. Setelah itu, `push.test`, wake reconnect, dan wake nudge dapat menggunakan pendaftaran berbasis relay yang tersimpan.

## Beacon alive latar belakang

Saat iOS membangunkan aplikasi untuk silent push, refresh latar belakang, atau event significant-location, aplikasi
mencoba reconnect node singkat lalu memanggil `node.event` dengan `event: "node.presence.alive"`.
Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya
setelah identitas perangkat node terautentikasi diketahui.

Aplikasi menganggap wake latar belakang berhasil dicatat hanya saat respons gateway menyertakan
`handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons itu
kompatibel tetapi tidak dihitung sebagai pembaruan last-seen yang durable.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.
- Lane rilis App Store publik menolak `OPENCLAW_PUSH_RELAY_BASE_URL` untuk build iOS.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat disediakan APNs-langsung-di-gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay hosted.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang dipasangkan dengan gateway spesifik
  tersebut.

Hop demi hop:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama dipasangkan dengan gateway melalui alur auth Gateway normal.
   - Itu memberi aplikasi sesi node terautentikasi plus sesi operator terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint pendaftaran relay melalui HTTPS.
   - Pendaftaran menyertakan bukti App Attest plus StoreKit app transaction JWS.
   - Relay memvalidasi bundle ID, bukti App Attest, dan bukti distribusi Apple, serta mewajibkan
     jalur distribusi resmi/production.
   - Inilah yang memblokir build Xcode/dev lokal dari penggunaan relay hosted. Build lokal mungkin
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum pendaftaran relay, aplikasi mengambil identitas gateway yang dipasangkan dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway itu dalam payload pendaftaran relay.
   - Relay mengembalikan handle relay dan grant pengiriman yang scoped ke pendaftaran yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, wake reconnect, dan wake nudge, gateway menandatangani permintaan pengiriman dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi grant pengiriman yang tersimpan dan tanda tangan gateway terhadap identitas
     gateway yang didelegasikan dari pendaftaran.
   - Gateway lain tidak dapat menggunakan ulang pendaftaran tersimpan itu, meskipun entah bagaimana memperoleh handle-nya.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs production dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push final ke APNs atas nama gateway yang dipasangkan.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs production tetap di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk mengizinkan penggunaan relay hosted hanya untuk build iOS OpenClaw resmi.
- Untuk mencegah satu gateway mengirim wake push ke perangkat iOS milik gateway berbeda.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway masih memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env var runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
auth App Store Connect seperti `APP_STORE_CONNECT_KEY_ID` dan
`APP_STORE_CONNECT_ISSUER_ID`; file itu tidak mengonfigurasi pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan host gateway yang direkomendasikan:

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

Aplikasi iOS menelusuri `_openclaw-gw._tcp` pada `local.` dan, saat dikonfigurasi, domain discovery
DNS-SD wide-area yang sama. Gateway same-LAN muncul otomatis dari `local.`;
discovery lintas-jaringan dapat menggunakan domain wide-area yang dikonfigurasi tanpa mengubah tipe beacon.

### Tailnet (lintas-jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
`openclaw.internal.`) dan Tailscale split DNS.
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
- Ini disajikan dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS mempertahankan scaffold bawaan sebagai tampilan default yang terhubung. `canvas.a2ui.push` dan `canvas.a2ui.reset` menggunakan halaman A2UI milik aplikasi yang dibundel.
- Halaman A2UI Gateway jarak jauh bersifat render-only di iOS; action tombol A2UI native hanya diterima dari halaman milik aplikasi yang dibundel.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

## Hubungan Computer Use

Aplikasi iOS adalah surface node seluler, bukan backend Codex Computer Use. Codex
Computer Use dan `cua-driver mcp` mengontrol desktop macOS lokal melalui tool MCP;
aplikasi iOS mengekspos kemampuan iPhone melalui perintah node OpenClaw
seperti `canvas.*`, `camera.*`, `screen.*`, `location.*`, dan `talk.*`.

Agent masih dapat mengoperasikan aplikasi iOS melalui OpenClaw dengan memanggil perintah
node, tetapi panggilan tersebut melewati protokol node gateway dan mengikuti batas
foreground/background iOS. Gunakan [Codex Computer Use](/id/plugins/codex-computer-use)
untuk kontrol desktop lokal dan halaman ini untuk kemampuan node iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + mode talk

- Voice wake dan mode talk tersedia di Settings.
- Node iOS yang mendukung talk mengiklankan kemampuan `talk` dan dapat mendeklarasikan
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once`;
  Gateway mengizinkan perintah push-to-talk tersebut secara default untuk node
  tepercaya yang mendukung Talk.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur voice sebagai best-effort saat aplikasi tidak aktif.

## Error umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke foreground (perintah canvas/camera/screen memerlukannya).
- `A2UI_HOST_UNAVAILABLE`: halaman A2UI yang dibundel tidak dapat dijangkau di WebView aplikasi; biarkan aplikasi tetap di foreground pada tab Screen dan coba lagi.
- Prompt pairing tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Reconnect gagal setelah instal ulang: token pairing Keychain telah dihapus; pasangkan ulang node.

## Dokumen terkait

- [Pairing](/id/channels/pairing)
- [Discovery](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
