---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar penyandingan: setujui siapa yang dapat mengirim pesan langsung kepada Anda + node mana yang dapat bergabung'
title: Penyandingan
x-i18n:
    generated_at: "2026-05-02T09:13:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

“Pemasangan” adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pemasangan DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pemasangan Node** (perangkat/node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pemasangan DM (akses chat masuk)

Ketika channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan menerima kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM bawaan didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya ketika daftar izin DM efektif menyertakan `"*"`.
Penyiapan dan validasi memerlukan wildcard tersebut untuk konfigurasi publik-terbuka. Jika state yang ada berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya menerima pengirim tersebut, dan persetujuan di penyimpanan pemasangan tidak memperluas akses `open`.

Kode pemasangan:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pemasangan ketika permintaan baru dibuat (kurang lebih sekali per jam per pengirim).
- Permintaan pemasangan DM yang tertunda dibatasi secara bawaan menjadi **3 per channel**; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pemasangan DM juga akan melakukan bootstrap `commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Ini memberi penyiapan pertama kali pemilik eksplisit untuk perintah istimewa dan prompt persetujuan exec. Setelah pemilik ada, persetujuan pemasangan berikutnya hanya memberikan akses DM; persetujuan itu tidak menambahkan pemilik lagi.

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas ketika kumpulan pengirim tepercaya yang sama harus diterapkan ke beberapa channel pesan atau ke daftar izin DM sekaligus grup.

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

### Tempat state disimpan

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan daftar izin yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file daftar izin bercakupan miliknya.
- Akun default menggunakan file daftar izin tanpa cakupan yang bercakupan channel.

Perlakukan ini sebagai data sensitif (ini mengatur akses ke asisten Anda).

<Note>
Penyimpanan daftar izin pemasangan adalah untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pemasangan DM tidak otomatis mengizinkan pengirim tersebut menjalankan perintah grup atau mengontrol bot di grup. Bootstrap pemilik pertama adalah state konfigurasi terpisah di `commands.ownerAllowFrom`, dan pengiriman chat grup tetap mengikuti daftar izin grup channel tersebut (misalnya `groupAllowFrom`, `groups`, atau override per-grup atau per-topik tergantung channel).
</Note>

## 2) Pemasangan perangkat Node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway membuat permintaan pemasangan perangkat yang harus disetujui.

### Pasangkan melalui Telegram (direkomendasikan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pemasangan perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi iOS OpenClaw → Settings → Gateway.
4. Tempel kode penyiapan dan hubungkan.
5. Kembali di Telegram: `/pair pending` (tinjau ID permintaan, peran, dan cakupan), lalu setujui.

Kode penyiapan adalah payload JSON berkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu-perangkat berumur pendek yang digunakan untuk handshake pemasangan awal

Token bootstrap tersebut membawa profil bootstrap pemasangan bawaan:

- token `node` yang diserahkan utama tetap `scopes: []`
- token `operator` apa pun yang diserahkan tetap dibatasi ke daftar izin bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan cakupan bootstrap diberi prefiks peran, bukan satu kumpulan cakupan datar:
  entri cakupan operator hanya memenuhi permintaan operator, dan peran non-operator tetap harus meminta cakupan di bawah prefiks peran mereka sendiri
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak peran yang disetujui untuk perangkat sekaligus cakupan operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

### Setujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jika perangkat yang sama mencoba lagi dengan detail autentikasi berbeda (misalnya peran/cakupan/kunci publik yang berbeda), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.

<Note>
Perangkat yang sudah dipasangkan tidak mendapatkan akses yang lebih luas secara diam-diam. Jika perangkat terhubung ulang dan meminta cakupan lebih banyak atau peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan peningkatan baru yang tertunda. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses yang baru diminta sebelum Anda menyetujui.
</Note>

### Persetujuan otomatis Node CIDR tepercaya opsional

Pemasangan perangkat tetap manual secara bawaan. Untuk jaringan node yang dikontrol ketat, Anda dapat memilih untuk mengaktifkan persetujuan otomatis Node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan pemasangan baru `role: node` tanpa cakupan yang diminta. Klien operator, browser, Control UI, dan WebChat tetap memerlukan persetujuan manual. Perubahan peran, cakupan, metadata, dan kunci publik tetap memerlukan persetujuan manual.

### Penyimpanan state pemasangan Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat yang dipasangkan + token)

### Catatan

- API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah penyimpanan pemasangan terpisah milik gateway. Node WS tetap memerlukan pemasangan perangkat.
- Rekaman pemasangan adalah sumber kebenaran tahan lama untuk peran yang disetujui. Token perangkat aktif tetap dibatasi ke kumpulan peran yang disetujui tersebut; entri token menyimpang di luar peran yang disetujui tidak membuat akses baru.

## Dokumen terkait

- Model keamanan + injeksi prompt: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
