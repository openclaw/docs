---
read_when:
    - Menyiapkan kontrol akses DM
    - Melakukan pairing node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar pairing: setujui siapa yang dapat mengirimi Anda DM + node mana yang dapat bergabung'
title: Pairing
x-i18n:
    generated_at: "2026-04-24T08:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

“Pairing” adalah langkah **persetujuan pemilik** yang eksplisit di OpenClaw.
Ini digunakan di dua tempat:

1. **DM pairing** (siapa yang diizinkan berbicara dengan bot)
2. **Node pairing** (perangkat/node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) DM pairing (akses obrolan masuk)

Saat sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan menerima kode singkat dan pesannya **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Keamanan](/id/gateway/security)

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing saat permintaan baru dibuat (kurang lebih sekali per jam per pengirim).
- Permintaan DM pairing yang tertunda dibatasi hingga **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Lokasi penyimpanan status

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file allowlist dengan cakupan akunnya.
- Akun default menggunakan file allowlist tanpa cakupan khusus channel.

Perlakukan ini sebagai data sensitif (karena mengontrol akses ke asisten Anda).

Penting: penyimpanan ini untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode DM pairing tidak otomatis mengizinkan pengirim tersebut menjalankan perintah grup atau mengendalikan bot di grup. Untuk akses grup, konfigurasikan allowlist grup eksplisit milik channel tersebut (misalnya `groupAllowFrom`, `groups`, atau override per grup/per topik tergantung channel).

## 2) Node pairing perangkat (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pairing perangkat yang harus disetujui.

### Pair melalui Telegram (disarankan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pairing perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: satu pesan instruksi dan satu pesan **kode setup** terpisah (mudah untuk disalin/tempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Tempel kode setup dan hubungkan.
5. Kembali ke Telegram: `/pair pending` (tinjau ID permintaan, peran, dan scope), lalu setujui.

Kode setup adalah payload JSON berenkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu perangkat berumur pendek yang digunakan untuk handshake pairing awal

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- token `node` utama yang diserahkan tetap `scopes: []`
- token `operator` apa pun yang diserahkan tetap dibatasi pada allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan scope bootstrap menggunakan prefiks peran, bukan satu kumpulan scope datar:
  entri scope operator hanya memenuhi permintaan operator, dan peran non-operator
  tetap harus meminta scope di bawah prefiks perannya sendiri

Perlakukan kode setup seperti kata sandi selama masih berlaku.

### Setujui perangkat node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jika perangkat yang sama mencoba lagi dengan detail autentikasi berbeda (misalnya
peran/scope/public key yang berbeda), permintaan tertunda sebelumnya akan digantikan dan
`requestId` baru dibuat.

Penting: perangkat yang sudah dipairing tidak akan diam-diam mendapatkan akses yang lebih luas. Jika perangkat itu
terhubung kembali sambil meminta lebih banyak scope atau peran yang lebih luas, OpenClaw akan mempertahankan
persetujuan yang ada apa adanya dan membuat permintaan upgrade tertunda yang baru. Gunakan
`openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses yang baru
diminta sebelum Anda menyetujuinya.

### Penyimpanan status node pairing

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat yang dipairing + token)

### Catatan

- API lama `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) adalah
  penyimpanan pairing terpisah yang dimiliki Gateway. Node WS tetap memerlukan pairing perangkat.
- Rekaman pairing adalah sumber kebenaran tahan lama untuk peran yang disetujui. Token perangkat aktif
  tetap dibatasi oleh kumpulan peran yang disetujui tersebut; entri token yang menyimpang
  di luar peran yang disetujui tidak menciptakan akses baru.

## Dokumen terkait

- Model keamanan + injeksi prompt: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Updating](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
