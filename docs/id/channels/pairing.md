---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar penyandingan: setujui siapa yang dapat mengirim pesan langsung kepada Anda + Node mana yang dapat bergabung'
title: Penyandingan
x-i18n:
    generated_at: "2026-05-04T02:21:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

“Pairing” adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pairing DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pairing Node** (perangkat/Node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pairing DM (akses chat masuk)

Ketika sebuah kanal dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan mendapatkan kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya ketika allowlist DM efektif menyertakan `"*"`.
Penyiapan dan validasi memerlukan wildcard tersebut untuk konfigurasi publik-terbuka. Jika state yang ada berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya mengizinkan pengirim tersebut, dan persetujuan pairing-store tidak memperluas akses `open`.

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing ketika permintaan baru dibuat (kira-kira sekali per jam per pengirim).
- Permintaan pairing DM yang tertunda dibatasi hingga **3 per kanal** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pairing DM juga akan melakukan bootstrap `commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Ini memberi penyiapan pertama kali pemilik eksplisit untuk perintah istimewa dan prompt persetujuan exec. Setelah pemilik ada, persetujuan pairing berikutnya hanya memberikan akses DM; persetujuan tersebut tidak menambahkan pemilik lagi.

Kanal yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas ketika kumpulan pengirim tepercaya yang sama harus berlaku untuk beberapa kanal pesan atau untuk allowlist DM dan grup.

Grup statis menggunakan `type: "message.senders"` dan dirujuk dengan `accessGroup:<name>` dari allowlist kanal:

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
- Penyimpanan allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file allowlist bercakup miliknya.
- Akun default menggunakan file allowlist tanpa cakupan yang bercakup kanal.

Perlakukan ini sebagai sensitif (ini mengatur akses ke asisten Anda).

<Note>
Penyimpanan allowlist pairing ditujukan untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pairing DM tidak otomatis mengizinkan pengirim tersebut menjalankan perintah grup atau mengontrol bot di grup. Bootstrap pemilik pertama adalah state konfigurasi terpisah di `commands.ownerAllowFrom`, dan pengiriman chat grup tetap mengikuti allowlist grup kanal tersebut (misalnya `groupAllowFrom`, `groups`, atau override per-grup atau per-topik tergantung kanalnya).
</Note>

## 2) Pairing perangkat Node (Node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway membuat permintaan pairing perangkat yang harus disetujui.

### Pairing melalui Telegram (direkomendasikan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pairing perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Tempel kode penyiapan dan hubungkan.
5. Kembali di Telegram: `/pair pending` (tinjau ID permintaan, peran, dan cakupan), lalu setujui.

Kode penyiapan adalah payload JSON yang dikodekan base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap perangkat tunggal berumur pendek yang digunakan untuk handshake pairing awal

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- token `node` yang diserahterimakan secara utama tetap `scopes: []`
- token `operator` apa pun yang diserahterimakan tetap dibatasi pada allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan cakupan bootstrap diberi prefiks peran, bukan satu kumpulan cakupan datar:
  entri cakupan operator hanya memenuhi permintaan operator, dan peran non-operator tetap harus meminta cakupan di bawah prefiks perannya sendiri
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak peran perangkat yang disetujui dan cakupan operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

### Setujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Ketika persetujuan eksplisit ditolak karena sesi perangkat-paired yang menyetujui dibuka dengan cakupan hanya-pairing, CLI mencoba ulang permintaan yang sama dengan `operator.admin`. Ini memungkinkan perangkat paired yang sudah ada dan berkemampuan admin memulihkan pairing Control UI/browser baru tanpa mengedit `devices/paired.json` secara manual. Gateway tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat mengautentikasi dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba ulang dengan detail auth berbeda (misalnya peran/cakupan/kunci publik yang berbeda), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat.

<Note>
Perangkat yang sudah paired tidak mendapatkan akses lebih luas secara diam-diam. Jika perangkat itu terhubung kembali sambil meminta lebih banyak cakupan atau peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan upgrade tertunda yang baru. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses baru yang diminta sebelum Anda menyetujui.
</Note>

### Persetujuan otomatis Node trusted-CIDR opsional

Pairing perangkat tetap manual secara default. Untuk jaringan Node yang dikontrol ketat, Anda dapat memilih persetujuan otomatis Node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan pairing `role: node` baru tanpa cakupan yang diminta. Klien operator, browser, Control UI, dan WebChat tetap memerlukan persetujuan manual. Perubahan peran, cakupan, metadata, dan kunci publik tetap memerlukan persetujuan manual.

### Penyimpanan state pairing Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat paired + token)

### Catatan

- API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah penyimpanan pairing terpisah milik gateway. Node WS tetap memerlukan pairing perangkat.
- Catatan pairing adalah sumber kebenaran yang tahan lama untuk peran yang disetujui. Token perangkat aktif tetap dibatasi pada kumpulan peran yang disetujui tersebut; entri token tersasar di luar peran yang disetujui tidak membuat akses baru.

## Dokumen terkait

- Model keamanan + injeksi prompt: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/id/install/updating)
- Konfigurasi kanal:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
