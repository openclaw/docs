---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar pemasangan: setujui siapa yang dapat mengirim DM kepada Anda + node mana yang dapat bergabung'
title: Pemasangan
x-i18n:
    generated_at: "2026-07-03T17:41:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pairing DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pairing Node** (perangkat/node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pairing DM (akses obrolan masuk)

Saat channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan mendapatkan kode pendek dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM bawaan didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya saat daftar izin DM efektif menyertakan `"*"`.
Penyiapan dan validasi mewajibkan wildcard tersebut untuk konfigurasi publik-terbuka. Jika state yang ada
berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya mengizinkan
pengirim tersebut, dan persetujuan di penyimpanan pairing tidak memperluas akses `open`.

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing saat permintaan baru dibuat (kira-kira sekali per jam per pengirim).
- Permintaan pairing DM yang tertunda dibatasi **3 per channel** secara bawaan; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Menyetujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pairing DM juga melakukan bootstrap
`commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Itu memberi penyiapan pertama kali pemilik eksplisit untuk perintah berprivilege dan prompt
persetujuan eksekusi. Setelah pemilik ada, persetujuan pairing berikutnya hanya memberikan akses DM;
persetujuan tersebut tidak menambahkan pemilik lagi.

Channel yang didukung: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas saat kumpulan pengirim tepercaya yang sama harus berlaku untuk
beberapa channel pesan atau untuk daftar izin DM sekaligus grup.

Grup statis menggunakan `type: "message.senders"` dan dirujuk dengan
`accessGroup:<name>` dari daftar izin channel:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Grup akses didokumentasikan secara detail di sini: [Grup akses](/id/channels/access-groups)

### Lokasi state disimpan

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan daftar izin yang disetujui:
  - Akun bawaan: `<channel>-allowFrom.json`
  - Akun non-bawaan: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-bawaan hanya membaca/menulis file daftar izin bercakup miliknya.
- Akun bawaan menggunakan file daftar izin tanpa cakupan yang dicakup oleh channel.

Perlakukan ini sebagai sensitif (ini membatasi akses ke asisten Anda).

<Note>
Penyimpanan daftar izin pairing adalah untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pairing DM tidak otomatis mengizinkan pengirim tersebut menjalankan
perintah grup atau mengontrol bot di grup. Bootstrap pemilik pertama adalah state konfigurasi
terpisah di `commands.ownerAllowFrom`, dan pengiriman obrolan grup tetap mengikuti
daftar izin grup channel (misalnya `groupAllowFrom`, `groups`, atau override per-grup
atau per-topik bergantung pada channel).
</Note>

## 2) Pairing perangkat Node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pairing perangkat yang harus disetujui.

### Pairing melalui Telegram (direkomendasikan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pairing perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Pengaturan → Gateway.
4. Pindai kode QR atau tempel kode penyiapan dan sambungkan.
5. Kembali ke Telegram: `/pair pending` (tinjau ID permintaan, peran, dan cakupan), lalu setujui.

Kode penyiapan adalah payload JSON yang dienkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu perangkat berumur pendek yang digunakan untuk handshake pairing awal

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- profil penyiapan bawaan hanya mengizinkan baseline QR/kode-penyiapan baru:
  `node` ditambah handoff `operator` yang dibatasi
- token `node` yang diserahkan tetap `scopes: []`
- token `operator` yang diserahkan dibatasi ke `operator.approvals`,
  `operator.read`, `operator.talk.secrets`, dan `operator.write`
- `operator.admin` tidak diberikan oleh bootstrap QR/kode-penyiapan; itu memerlukan
  pairing operator atau alur token terpisah yang disetujui
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak peran yang disetujui
  perangkat dan cakupan operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

Untuk Tailscale, pairing seluler publik, atau jarak jauh lainnya, gunakan Tailscale Serve/Funnel
atau URL Gateway `wss://` lain. Kode penyiapan plaintext `ws://` hanya diterima
untuk loopback, alamat LAN privat, host Bonjour `.local`, dan host emulator Android.
Alamat CGNAT tailnet, nama `.ts.net`, dan host publik tetap ditolak secara tertutup
sebelum QR/kode-penyiapan diterbitkan.

### Menyetujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Saat persetujuan eksplisit ditolak karena sesi perangkat-terpasang yang menyetujui
dibuka dengan cakupan hanya-pairing, CLI mencoba ulang permintaan yang sama dengan
`operator.admin`. Ini memungkinkan perangkat terpasang yang sudah mampu menjadi admin memulihkan pairing
Control UI/browser baru tanpa mengedit `devices/paired.json` secara manual. Gateway
tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat mengautentikasi
dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba ulang dengan detail auth berbeda (misalnya
peran/cakupan/kunci publik berbeda), permintaan tertunda sebelumnya digantikan dan `requestId`
baru dibuat.

<Note>
Perangkat yang sudah dipairing tidak mendapatkan akses yang lebih luas secara diam-diam. Jika perangkat tersebut tersambung kembali sambil meminta cakupan lebih banyak atau peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan upgrade tertunda baru. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses baru yang diminta sebelum Anda menyetujui.
</Note>

### Persetujuan otomatis Node berbasis CIDR tepercaya opsional

Pairing perangkat tetap manual secara bawaan. Untuk jaringan Node yang dikontrol ketat,
Anda dapat memilih ikut serta dalam persetujuan otomatis Node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan pairing baru `role: node` tanpa
cakupan yang diminta. Klien operator, browser, Control UI, dan WebChat tetap memerlukan
persetujuan manual. Perubahan peran, cakupan, metadata, dan kunci publik tetap memerlukan
persetujuan manual.

### Penyimpanan state pairing Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat terpasang + token)

### Catatan

- API lama `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah
  penyimpanan pairing terpisah yang dimiliki Gateway. Node WS tetap memerlukan pairing perangkat.
- Catatan pairing adalah sumber kebenaran tahan lama untuk peran yang disetujui. Token
  perangkat aktif tetap dibatasi ke kumpulan peran yang disetujui tersebut; entri token lepas
  di luar peran yang disetujui tidak membuat akses baru.

## Dokumentasi terkait

- Model keamanan + injeksi prompt: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - iMessage: [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
