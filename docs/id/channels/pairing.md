---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar pemasangan: setujui siapa yang dapat mengirim DM kepada Anda + node mana yang dapat bergabung'
title: Penyandingan
x-i18n:
    generated_at: "2026-05-06T09:03:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5543c10868418234714b175cd4bd373818be8dd40327121ac6c44819ed7519b2
    source_path: channels/pairing.md
    workflow: 16
---

“Penyandingan” adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Penyandingan DM** (siapa yang diizinkan berbicara dengan bot)
2. **Penyandingan Node** (perangkat/node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Penyandingan DM (akses chat masuk)

Ketika channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal mendapatkan kode pendek dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM bawaan didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya ketika allowlist DM efektif menyertakan `"*"`.
Penyiapan dan validasi memerlukan wildcard tersebut untuk konfigurasi publik-terbuka. Jika state yang ada
berisi `open` dengan entri `allowFrom` konkret, runtime tetap menerima
hanya pengirim tersebut, dan persetujuan pairing-store tidak memperluas akses `open`.

Kode penyandingan:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan penyandingan ketika permintaan baru dibuat (kira-kira sekali per jam per pengirim).
- Permintaan penyandingan DM tertunda dibatasi pada **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode penyandingan DM juga melakukan bootstrap
`commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Ini memberi penyiapan pertama kali pemilik eksplisit untuk perintah istimewa dan prompt persetujuan
exec. Setelah pemilik ada, persetujuan penyandingan berikutnya hanya memberi akses
DM; persetujuan tersebut tidak menambahkan pemilik lain.

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas ketika kumpulan pengirim tepercaya yang sama harus diterapkan ke
beberapa channel pesan atau ke allowlist DM dan grup sekaligus.

Grup statis menggunakan `type: "message.senders"` dan direferensikan dengan
`accessGroup:<name>` dari allowlist channel:

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

Access group didokumentasikan secara detail di sini: [Access group](/id/channels/access-groups)

### Tempat state disimpan

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Store allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default membaca/menulis hanya file allowlist bercakup miliknya.
- Akun default menggunakan file allowlist tanpa cakupan yang bercakup channel.

Perlakukan ini sebagai sensitif (ini mengontrol akses ke asisten Anda).

<Note>
Store allowlist penyandingan ditujukan untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode penyandingan DM tidak otomatis mengizinkan pengirim tersebut menjalankan perintah grup
atau mengontrol bot di grup. Bootstrap pemilik pertama adalah state konfigurasi
terpisah di `commands.ownerAllowFrom`, dan pengiriman chat grup tetap mengikuti
allowlist grup channel (misalnya `groupAllowFrom`, `groups`, atau override per-grup
atau per-topik tergantung pada channel).
</Note>

## 2) Penyandingan perangkat Node (Node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan penyandingan perangkat yang harus disetujui.

### Sandingkan melalui Telegram (disarankan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan penyandingan perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi iOS OpenClaw → Settings → Gateway.
4. Pindai kode QR atau tempel kode penyiapan lalu hubungkan.
5. Kembali di Telegram: `/pair pending` (tinjau ID permintaan, role, dan scope), lalu setujui.

Kode penyiapan adalah payload JSON yang dikodekan base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap perangkat tunggal berumur pendek yang digunakan untuk handshake penyandingan awal

Token bootstrap tersebut membawa profil bootstrap penyandingan bawaan:

- token `node` utama yang diserahterimakan tetap `scopes: []`
- token `operator` apa pun yang diserahterimakan tetap dibatasi ke allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan scope bootstrap diberi prefiks role, bukan satu kumpulan scope datar:
  entri scope operator hanya memenuhi permintaan operator, dan role non-operator
  tetap harus meminta scope di bawah prefiks role mereka sendiri
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak role yang disetujui
  untuk perangkat dan scope operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

Untuk penyandingan seluler melalui Tailscale, publik, atau jarak jauh lainnya, gunakan Tailscale Serve/Funnel
atau URL Gateway `wss://` lain. Kode penyiapan plaintext `ws://` diterima hanya
untuk loopback, alamat LAN pribadi, host Bonjour `.local`, dan host emulator
Android. Alamat CGNAT tailnet, nama `.ts.net`, dan host publik tetap
gagal tertutup sebelum penerbitan QR/kode penyiapan.

### Setujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Ketika persetujuan eksplisit ditolak karena sesi perangkat tersanding yang menyetujui
dibuka dengan scope hanya-penyandingan, CLI mencoba ulang permintaan yang sama dengan
`operator.admin`. Ini memungkinkan perangkat tersanding yang sudah ada dan mampu admin memulihkan penyandingan
Control UI/browser baru tanpa mengedit `devices/paired.json` secara manual. Gateway
tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat mengautentikasi
dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba ulang dengan detail autentikasi berbeda (misalnya
role/scope/public key berbeda), permintaan tertunda sebelumnya digantikan dan
`requestId` baru dibuat.

<Note>
Perangkat yang sudah tersanding tidak mendapatkan akses lebih luas secara diam-diam. Jika perangkat itu terhubung ulang sambil meminta scope lebih banyak atau role yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan upgrade tertunda baru. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses baru yang diminta sebelum Anda menyetujui.
</Note>

### Auto-approve Node CIDR tepercaya opsional

Penyandingan perangkat tetap manual secara default. Untuk jaringan Node yang dikontrol ketat,
Anda dapat ikut serta dalam auto-approval Node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan penyandingan `role: node` baru tanpa scope yang diminta.
Klien operator, browser, Control UI, dan WebChat tetap memerlukan persetujuan manual.
Perubahan role, scope, metadata, dan public key tetap memerlukan persetujuan manual.

### Penyimpanan state penyandingan Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat tersanding + token)

### Catatan

- API lama `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah
  store penyandingan terpisah yang dimiliki Gateway. Node WS tetap memerlukan penyandingan perangkat.
- Rekaman penyandingan adalah sumber kebenaran tahan lama untuk role yang disetujui. Token
  perangkat aktif tetap dibatasi ke kumpulan role yang disetujui tersebut; entri token tersesat
  di luar role yang disetujui tidak membuat akses baru.

## Dokumen terkait

- Model keamanan + injeksi prompt: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (lama): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
