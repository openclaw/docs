---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar penyandingan: setujui siapa yang dapat mengirim DM kepada Anda + Node mana yang dapat bergabung'
title: Penyandingan
x-i18n:
    generated_at: "2026-05-06T17:52:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

"Pemasangan" adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pemasangan DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pemasangan Node** (perangkat/node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pemasangan DM (akses chat masuk)

Saat sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal mendapatkan kode singkat dan pesannya **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` hanya bersifat publik ketika daftar izin DM efektif menyertakan `"*"`.
Penyiapan dan validasi memerlukan wildcard tersebut untuk konfigurasi public-open. Jika state yang ada berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya mengizinkan pengirim tersebut, dan persetujuan pairing-store tidak memperluas akses `open`.

Kode pemasangan:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pemasangan saat permintaan baru dibuat (kira-kira satu kali per jam per pengirim).
- Permintaan pemasangan DM yang tertunda dibatasi maksimal **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pemasangan DM juga melakukan bootstrap `commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Ini memberi penyiapan pertama kali pemilik eksplisit untuk perintah istimewa dan prompt persetujuan exec. Setelah pemilik ada, persetujuan pemasangan berikutnya hanya memberikan akses DM; persetujuan tersebut tidak menambahkan pemilik lain.

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas ketika kumpulan pengirim tepercaya yang sama harus berlaku untuk beberapa channel pesan atau untuk daftar izin DM dan grup sekaligus.

Grup statis menggunakan `type: "message.senders"` dan dirujuk dengan `accessGroup:<name>` dari daftar izin channel:

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
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku scope akun:

- Akun non-default hanya membaca/menulis file daftar izin dalam scope-nya.
- Akun default menggunakan file daftar izin tanpa scope khusus channel.

Perlakukan ini sebagai sensitif (ini mengontrol akses ke asisten Anda).

<Note>
Penyimpanan daftar izin pemasangan ditujukan untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pemasangan DM tidak otomatis mengizinkan pengirim tersebut menjalankan perintah grup atau mengendalikan bot dalam grup. Bootstrap pemilik pertama adalah state konfigurasi terpisah di `commands.ownerAllowFrom`, dan pengiriman chat grup tetap mengikuti daftar izin grup channel (misalnya `groupAllowFrom`, `groups`, atau override per grup atau per topik bergantung pada channel).
</Note>

## 2) Pemasangan perangkat Node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway membuat permintaan pemasangan perangkat yang harus disetujui.

### Pasangkan melalui Telegram (direkomendasikan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pemasangan perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Pindai kode QR atau tempel kode penyiapan dan hubungkan.
5. Kembali di Telegram: `/pair pending` (tinjau ID permintaan, peran, dan scope), lalu setujui.

Kode penyiapan adalah payload JSON berenkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu perangkat berumur pendek yang digunakan untuk handshake pemasangan awal

Token bootstrap tersebut membawa profil bootstrap pemasangan bawaan:

- token `node` yang diserahkan utama tetap `scopes: []`
- token `operator` apa pun yang diserahkan tetap dibatasi pada daftar izin bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan scope bootstrap memakai prefiks peran, bukan satu pool scope datar:
  entri scope operator hanya memenuhi permintaan operator, dan peran non-operator tetap harus meminta scope di bawah prefiks perannya sendiri
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak peran yang disetujui perangkat dan scope operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

Untuk Tailscale, publik, atau pemasangan mobile jarak jauh lainnya, gunakan Tailscale Serve/Funnel atau URL Gateway `wss://` lainnya. Kode penyiapan plaintext `ws://` hanya diterima untuk loopback, alamat LAN privat, host Bonjour `.local`, dan host emulator Android. Alamat CGNAT Tailnet, nama `.ts.net`, dan host publik tetap gagal tertutup sebelum penerbitan QR/kode penyiapan.

### Setujui perangkat node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Ketika persetujuan eksplisit ditolak karena sesi perangkat-terpasang yang menyetujui dibuka dengan scope khusus pemasangan, CLI mencoba ulang permintaan yang sama dengan `operator.admin`. Ini memungkinkan perangkat terpasang yang sudah ada dan mampu admin memulihkan pemasangan UI Kontrol/peramban baru tanpa mengedit `devices/paired.json` secara manual. Gateway tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat diautentikasi dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba ulang dengan detail auth berbeda (misalnya peran/scope/kunci publik berbeda), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.

<Note>
Perangkat yang sudah dipasangkan tidak mendapatkan akses yang lebih luas secara diam-diam. Jika perangkat tersebut terhubung ulang dan meminta lebih banyak scope atau peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan peningkatan baru yang tertunda. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses baru yang diminta sebelum Anda menyetujui.
</Note>

### Persetujuan otomatis node trusted-CIDR opsional

Pemasangan perangkat tetap manual secara default. Untuk jaringan node yang dikontrol ketat, Anda dapat ikut serta dalam persetujuan otomatis node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan pemasangan `role: node` baru tanpa scope yang diminta.
Operator, browser, UI Kontrol, dan klien WebChat tetap memerlukan persetujuan manual. Perubahan peran, scope, metadata, dan kunci publik tetap memerlukan persetujuan manual.

### Penyimpanan state pemasangan Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat terpasang + token)

### Catatan

- API lama `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah penyimpanan pemasangan terpisah milik gateway. Node WS tetap memerlukan pemasangan perangkat.
- Catatan pemasangan adalah sumber kebenaran tahan lama untuk peran yang disetujui. Token perangkat aktif tetap dibatasi pada kumpulan peran yang disetujui tersebut; entri token tersasar di luar peran yang disetujui tidak membuat akses baru.

## Dokumentasi terkait

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
