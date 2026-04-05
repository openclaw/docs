---
read_when:
    - Menyiapkan kontrol akses DM
    - Melakukan pairing node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar pairing: setujui siapa yang dapat mengirimi Anda DM + node mana yang dapat bergabung'
title: Pairing
x-i18n:
    generated_at: "2026-04-05T13:43:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# Pairing

“Pairing” adalah langkah **persetujuan pemilik** eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pairing DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pairing node** (perangkat/node mana yang diizinkan bergabung ke jaringan gateway)

Konteks keamanan: [Keamanan](/gateway/security)

## 1) Pairing DM (akses chat masuk)

Saat sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan mendapatkan kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Keamanan](/gateway/security)

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing saat permintaan baru dibuat (kurang lebih sekali per jam per pengirim).
- Permintaan pairing DM yang tertunda dibatasi maksimal **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Menyetujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Tempat status disimpan

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file allowlist dalam cakupannya.
- Akun default menggunakan file allowlist tanpa cakupan yang dicakup per channel.

Anggap ini sensitif (karena menentukan akses ke asisten Anda).

Penting: penyimpanan ini untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pairing DM tidak secara otomatis mengizinkan pengirim tersebut menjalankan perintah grup atau mengontrol bot di grup. Untuk akses grup, konfigurasikan allowlist grup eksplisit milik channel tersebut (misalnya `groupAllowFrom`, `groups`, atau override per grup/per topik tergantung channel).

## 2) Pairing perangkat node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pairing perangkat yang harus disetujui.

### Pair melalui Telegram (direkomendasikan untuk iOS)

Jika Anda menggunakan plugin `device-pair`, Anda dapat melakukan pairing perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah untuk disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Tempel kode penyiapan lalu sambungkan.
5. Kembali ke Telegram: `/pair pending` (tinjau ID permintaan, role, dan scope), lalu setujui.

Kode penyiapan adalah payload JSON terenkripsi base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu perangkat yang berumur pendek dan digunakan untuk handshake pairing awal

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- token `node` utama yang diserahkan tetap `scopes: []`
- token `operator` yang diserahkan tetap dibatasi ke allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan scope bootstrap diberi awalan role, bukan satu kumpulan scope datar:
  entri scope operator hanya memenuhi permintaan operator, dan role non-operator
  tetap harus meminta scope di bawah awalan role mereka sendiri

Perlakukan kode penyiapan seperti kata sandi selama masih berlaku.

### Menyetujui perangkat node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jika perangkat yang sama mencoba lagi dengan detail autentikasi berbeda (misalnya
role/scope/public key yang berbeda), permintaan tertunda sebelumnya akan digantikan dan
`requestId` baru akan dibuat.

### Penyimpanan status pairing node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda akan kedaluwarsa)
- `paired.json` (perangkat yang sudah dipairing + token)

### Catatan

- API `node.pair.*` lama (CLI: `openclaw nodes pending|approve|reject|rename`) adalah
  penyimpanan pairing terpisah milik gateway. Node WS tetap memerlukan pairing perangkat.
- Rekaman pairing adalah sumber kebenaran tahan lama untuk role yang disetujui. Token
  perangkat aktif tetap dibatasi ke kumpulan role yang disetujui tersebut; entri token
  liar di luar role yang disetujui tidak menciptakan akses baru.

## Dokumen terkait

- Model keamanan + prompt injection: [Keamanan](/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (lama): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
