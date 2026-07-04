---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar pemasangan: setujui siapa yang dapat mengirim DM kepada Anda + node mana yang dapat bergabung'
title: Pemasangan
x-i18n:
    generated_at: "2026-07-04T18:20:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pairing DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pairing Node** (perangkat/node mana yang diizinkan bergabung ke jaringan gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pairing DM (akses chat masuk)

Ketika sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal menerima kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya ketika allowlist DM efektif menyertakan `"*"`.
Penyiapan dan validasi mengharuskan wildcard tersebut untuk konfigurasi publik-terbuka. Jika state yang ada
berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya mengizinkan
pengirim tersebut, dan persetujuan pairing-store tidak memperluas akses `open`.

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing ketika permintaan baru dibuat (kurang lebih sekali per jam per pengirim).
- Permintaan pairing DM yang tertunda dibatasi hingga **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pairing DM juga melakukan bootstrap
`commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Ini memberi penyiapan pertama kali pemilik eksplisit untuk perintah istimewa dan prompt persetujuan
eksekusi. Setelah pemilik ada, persetujuan pairing berikutnya hanya memberikan akses
DM; tidak menambahkan pemilik lain.

Channel yang didukung: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas ketika set pengirim tepercaya yang sama harus berlaku untuk
beberapa channel pesan atau untuk allowlist DM dan grup sekaligus.

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

Grup akses didokumentasikan secara mendetail di sini: [Grup akses](/id/channels/access-groups)

### Lokasi state disimpan

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file allowlist bercakup miliknya.
- Akun default menggunakan file allowlist tanpa cakupan yang bercakup channel.

Perlakukan ini sebagai sensitif (ini mengatur akses ke asisten Anda).

<Note>
Penyimpanan allowlist pairing ditujukan untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pairing DM tidak otomatis mengizinkan pengirim tersebut menjalankan perintah
grup atau mengontrol bot dalam grup. Bootstrap pemilik pertama adalah state konfigurasi terpisah
di `commands.ownerAllowFrom`, dan pengiriman chat grup tetap mengikuti allowlist grup
channel (misalnya `groupAllowFrom`, `groups`, atau override per-grup
atau per-topik tergantung channel).
</Note>

## 2) Pairing perangkat Node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pairing perangkat yang harus disetujui.

### Pairing dari Control UI (direkomendasikan)

Gunakan sesi Control UI yang sudah terhubung dengan akses `operator.admin`:

1. Buka Control UI dan pilih **Node**.
2. Di **Perangkat**, klik **Pair mobile device**.
3. Di ponsel Anda, buka aplikasi OpenClaw → **Settings** → **Gateway**.
4. Pindai kode QR atau tempel kode penyiapan, lalu hubungkan.

Aplikasi resmi OpenClaw untuk iOS dan Android disetujui otomatis ketika metadata
kode penyiapannya cocok. Jika **Perangkat** menampilkan permintaan tertunda (misalnya,
untuk klien non-resmi atau metadata yang tidak cocok), tinjau role dan
scopes sebelum menyetujuinya.

Tombol dinonaktifkan ketika sesi Control UI saat ini tidak memiliki akses
administrator. Dalam kasus tersebut, gunakan alur persetujuan CLI di bawah dari host Gateway.

### Pairing melalui Telegram

Jika Anda menggunakan plugin `device-pair`, Anda dapat melakukan pairing perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/tempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Pindai kode QR atau tempel kode penyiapan dan hubungkan.
5. Aplikasi seluler resmi terhubung otomatis. Jika `/pair pending` menampilkan
   permintaan, tinjau role dan scopes sebelum menyetujuinya.

Kode penyiapan adalah payload JSON berenkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap perangkat tunggal berumur pendek yang digunakan untuk handshake pairing awal

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- profil penyiapan bawaan hanya mengizinkan baseline QR/kode-penyiapan baru:
  `node` ditambah handoff `operator` terbatas
- token `node` yang dialihkan tetap `scopes: []`
- token `operator` yang dialihkan dibatasi ke `operator.approvals`,
  `operator.read`, `operator.talk.secrets`, dan `operator.write`
- `operator.admin` tidak diberikan oleh bootstrap QR/kode-penyiapan; ini memerlukan
  pairing operator atau alur token terpisah yang disetujui
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak role perangkat yang disetujui
  dan scopes operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

Untuk Tailscale, publik, atau pairing seluler jarak jauh lainnya, gunakan Tailscale Serve/Funnel
atau URL Gateway `wss://` lainnya. Kode penyiapan plaintext `ws://` hanya diterima
untuk loopback, alamat LAN privat, host Bonjour `.local`, dan host emulator
Android. Alamat CGNAT Tailnet, nama `.ts.net`, dan host publik tetap
gagal tertutup sebelum penerbitan QR/kode-penyiapan.

### Setujui perangkat node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Ketika persetujuan eksplisit ditolak karena sesi perangkat-terpasang yang menyetujui
dibuka dengan scope khusus pairing, CLI mencoba ulang permintaan yang sama dengan
`operator.admin`. Ini memungkinkan perangkat terpasang yang sudah mampu admin memulihkan pairing
Control UI/browser baru tanpa mengedit `devices/paired.json` secara manual. Gateway
tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat mengautentikasi
dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba ulang dengan detail auth berbeda (misalnya berbeda
role/scopes/public key), permintaan tertunda sebelumnya digantikan dan
`requestId` baru dibuat.

<Note>
Perangkat yang sudah terpasang tidak mendapatkan akses lebih luas secara diam-diam. Jika perangkat itu terhubung kembali sambil meminta scopes lebih banyak atau role yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan peningkatan baru yang tertunda. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses baru yang diminta sebelum Anda menyetujui.
</Note>

### Persetujuan otomatis node trusted-CIDR opsional

Pairing perangkat tetap manual secara default. Untuk jaringan node yang dikontrol ketat,
Anda dapat ikut serta dalam persetujuan otomatis node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan pairing `role: node` baru tanpa
scopes yang diminta. Klien Operator, browser, Control UI, dan WebChat tetap memerlukan
persetujuan manual. Perubahan role, scope, metadata, dan public key tetap memerlukan
persetujuan manual.

### Penyimpanan state pairing Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat terpasang + token)

### Catatan

- API lama `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah
  penyimpanan pairing terpisah milik gateway. Node WS tetap memerlukan pairing perangkat.
- Catatan pairing adalah sumber kebenaran tahan lama untuk role yang disetujui. Token perangkat
  aktif tetap dibatasi ke set role yang disetujui tersebut; entri token tersesat
  di luar role yang disetujui tidak membuat akses baru.

## Dokumen terkait

- Model keamanan + prompt injection: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - iMessage: [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
