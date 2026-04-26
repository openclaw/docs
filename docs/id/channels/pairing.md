---
read_when:
    - Menyiapkan kontrol akses DM
    - Mem-pairing Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar pairing: setujui siapa yang dapat DM Anda + node mana yang dapat bergabung'
title: Pairing
x-i18n:
    generated_at: "2026-04-26T11:24:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

“Pairing” adalah langkah **persetujuan pemilik** yang eksplisit di OpenClaw.
Ini digunakan di dua tempat:

1. **DM pairing** (siapa yang diizinkan berbicara dengan bot)
2. **Node pairing** (perangkat/node mana yang diizinkan bergabung ke jaringan gateway)

Konteks keamanan: [Security](/id/gateway/security)

## 1) DM pairing (akses chat masuk)

Saat sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan mendapatkan kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Security](/id/gateway/security)

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing saat permintaan baru dibuat (kira-kira sekali per jam per pengirim).
- Permintaan DM pairing yang tertunda dibatasi hingga **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satu kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Lokasi status disimpan

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Store allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file allowlist sesuai cakupannya.
- Akun default menggunakan file allowlist tanpa cakupan khusus milik channel.

Perlakukan file ini sebagai sensitif (karena mengendalikan akses ke asisten Anda).

Penting: store ini untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode DM pairing tidak otomatis mengizinkan pengirim itu menjalankan perintah grup atau mengendalikan bot di grup. Untuk akses grup, konfigurasikan allowlist grup eksplisit milik channel tersebut (misalnya `groupAllowFrom`, `groups`, atau override per grup/per topik tergantung channel).

## 2) Node device pairing (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **device** dengan `role: node`. Gateway
membuat permintaan pairing device yang harus disetujui.

### Pair melalui Telegram (disarankan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pairing device pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **setup code** terpisah (mudah disalin/tempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Tempel setup code dan hubungkan.
5. Kembali ke Telegram: `/pair pending` (tinjau ID permintaan, role, dan scope), lalu setujui.

Setup code adalah payload JSON yang di-encode base64 dan berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu-device berumur pendek yang digunakan untuk handshake pairing awal

Token bootstrap itu membawa profil bootstrap pairing bawaan:

- token `node` utama yang diserahkan tetap `scopes: []`
- token `operator` apa pun yang diserahkan tetap dibatasi pada allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan scope bootstrap menggunakan prefix role, bukan satu kumpulan scope datar:
  entri scope operator hanya memenuhi permintaan operator, dan role non-operator
  tetap harus meminta scope di bawah prefix role mereka sendiri
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak role device yang
  disetujui dan scope operator sesi pemanggil

Perlakukan setup code seperti kata sandi selama masih berlaku.

### Setujui node device

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jika device yang sama mencoba lagi dengan detail auth yang berbeda (misalnya
role/scope/public key yang berbeda), permintaan tertunda sebelumnya akan digantikan dan
`requestId` baru dibuat.

Penting: device yang sudah di-pairing tidak otomatis mendapatkan akses yang lebih luas. Jika
device tersebut terhubung kembali dengan meminta lebih banyak scope atau role yang lebih luas, OpenClaw mempertahankan
persetujuan yang ada apa adanya dan membuat permintaan upgrade tertunda yang baru. Gunakan
`openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses yang baru
diminta sebelum Anda menyetujui.

### Auto-approve node trusted-CIDR opsional

Pairing device tetap manual secara default. Untuk jaringan node yang sangat terkontrol,
Anda dapat ikut menggunakan auto-approval node pertama kali dengan CIDR eksplisit atau IP yang tepat:

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

Ini hanya berlaku untuk permintaan pairing `role: node` baru tanpa scope yang diminta.
Klien operator, browser, Control UI, dan WebChat tetap memerlukan persetujuan manual.
Perubahan role, scope, metadata, dan public key tetap memerlukan persetujuan manual.

### Penyimpanan status node pairing

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (device yang sudah di-pairing + token)

### Catatan

- API `node.pair.*` lama (CLI: `openclaw nodes pending|approve|reject|rename`) adalah
  store pairing terpisah milik gateway. Node WS tetap memerlukan device pairing.
- Rekaman pairing adalah sumber kebenaran tahan lama untuk role yang disetujui. Token device aktif
  tetap dibatasi pada kumpulan role yang disetujui itu; entri token yang menyimpang
  di luar role yang disetujui tidak menciptakan akses baru.

## Dokumen terkait

- Model keamanan + prompt injection: [Security](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Updating](/id/install/updating)
- Config channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (lama): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
