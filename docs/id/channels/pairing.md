---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar penyandingan: setujui siapa yang dapat mengirim DM kepada Anda + node mana yang dapat bergabung'
title: Penyandingan
x-i18n:
    generated_at: "2026-05-10T19:23:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

"Pemasangan" adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pemasangan DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pemasangan Node** (perangkat/node mana yang diizinkan bergabung ke jaringan gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pemasangan DM (akses chat masuk)

Saat channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim tak dikenal mendapatkan kode pendek dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya ketika daftar izin DM efektif mencakup `"*"`.
Penyiapan dan validasi memerlukan wildcard tersebut untuk konfigurasi publik-terbuka. Jika
status yang ada berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya mengizinkan
pengirim tersebut, dan persetujuan penyimpanan pemasangan tidak memperluas akses `open`.

Kode pemasangan:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pemasangan saat permintaan baru dibuat (kira-kira sekali per jam per pengirim).
- Permintaan pemasangan DM tertunda dibatasi hingga **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pemasangan DM juga melakukan bootstrap
`commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Itu memberi penyiapan pertama kali pemilik eksplisit untuk perintah istimewa dan prompt persetujuan
eksekusi. Setelah pemilik ada, persetujuan pemasangan berikutnya hanya memberi akses DM;
persetujuan tersebut tidak menambahkan pemilik lagi.

Channel yang didukung: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas saat kumpulan pengirim tepercaya yang sama harus berlaku untuk
beberapa channel pesan atau untuk daftar izin DM dan grup.

Grup statis menggunakan `type: "message.senders"` dan direferensikan dengan
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

Grup akses didokumentasikan secara mendetail di sini: [Grup akses](/id/channels/access-groups)

### Lokasi penyimpanan status

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan daftar izin yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file daftar izin bercakup miliknya.
- Akun default menggunakan file daftar izin tanpa cakupan yang bercakup channel.

Perlakukan ini sebagai sensitif (ini mengontrol akses ke asisten Anda).

<Note>
Penyimpanan daftar izin pemasangan adalah untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pemasangan DM tidak otomatis mengizinkan pengirim tersebut menjalankan
perintah grup atau mengontrol bot dalam grup. Bootstrap pemilik pertama adalah status
konfigurasi terpisah di `commands.ownerAllowFrom`, dan pengiriman chat grup tetap mengikuti
daftar izin grup channel (misalnya `groupAllowFrom`, `groups`, atau override per-grup
atau per-topik tergantung channel).
</Note>

## 2) Pemasangan perangkat Node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pemasangan perangkat yang harus disetujui.

### Pasangkan melalui Telegram (direkomendasikan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pemasangan perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Pindai kode QR atau tempel kode penyiapan dan hubungkan.
5. Kembali di Telegram: `/pair pending` (tinjau ID permintaan, role, dan cakupan), lalu setujui.

Kode penyiapan adalah payload JSON yang dikodekan base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap perangkat tunggal berumur pendek yang digunakan untuk handshake pemasangan awal

Token bootstrap tersebut membawa profil bootstrap pemasangan bawaan:

- token `node` yang diserahterimakan utama tetap `scopes: []`
- token `operator` yang diserahterimakan tetap dibatasi ke daftar izin bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan cakupan bootstrap diberi prefiks role, bukan satu pool cakupan datar:
  entri cakupan operator hanya memenuhi permintaan operator, dan role non-operator
  tetap harus meminta cakupan di bawah prefiks role mereka sendiri
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak role yang disetujui
  perangkat dan cakupan operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

Untuk pemasangan seluler jarak jauh melalui Tailscale, publik, atau lainnya, gunakan Tailscale Serve/Funnel
atau URL Gateway `wss://` lain. Kode penyiapan plaintext `ws://` hanya diterima
untuk loopback, alamat LAN privat, host Bonjour `.local`, dan host emulator
Android. Alamat CGNAT tailnet, nama `.ts.net`, dan host publik tetap
gagal tertutup sebelum penerbitan QR/kode penyiapan.

### Setujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Saat persetujuan eksplisit ditolak karena sesi perangkat-terpasang yang menyetujui
dibuka dengan cakupan khusus-pemasangan, CLI mencoba ulang permintaan yang sama dengan
`operator.admin`. Ini memungkinkan perangkat terpasang yang sudah ada dan mampu admin memulihkan pemasangan
UI Kontrol/browser baru tanpa mengedit `devices/paired.json` secara manual. Gateway
tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat mengautentikasi
dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba ulang dengan detail auth berbeda (misalnya
role/cakupan/kunci publik berbeda), permintaan tertunda sebelumnya digantikan dan
`requestId` baru dibuat.

<Note>
Perangkat yang sudah dipasangkan tidak mendapatkan akses lebih luas secara diam-diam. Jika perangkat itu terhubung kembali meminta cakupan lebih banyak atau role lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan peningkatan tertunda baru. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses yang baru diminta sebelum Anda menyetujui.
</Note>

### Auto-approve Node CIDR tepercaya opsional

Pemasangan perangkat tetap manual secara default. Untuk jaringan Node yang dikontrol ketat,
Anda dapat mengaktifkan auto-approval Node pertama kali dengan CIDR atau IP eksak eksplisit:

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

Ini hanya berlaku untuk permintaan pemasangan `role: node` baru tanpa cakupan yang diminta.
Klien operator, browser, UI Kontrol, dan WebChat tetap memerlukan persetujuan manual.
Perubahan role, cakupan, metadata, dan kunci publik tetap memerlukan persetujuan manual.

### Penyimpanan status pemasangan Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat terpasang + token)

### Catatan

- API lama `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah
  penyimpanan pemasangan terpisah yang dimiliki gateway. Node WS tetap memerlukan pemasangan perangkat.
- Catatan pemasangan adalah sumber kebenaran tahan lama untuk role yang disetujui. Token
  perangkat aktif tetap dibatasi pada kumpulan role yang disetujui tersebut; entri token lepas
  di luar role yang disetujui tidak membuat akses baru.

## Dokumen terkait

- Model keamanan + injeksi prompt: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - iMessage: [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
