---
read_when:
    - Menyiapkan kontrol akses DM
    - Mem-pairing node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ringkasan pairing: setujui siapa yang dapat mengirimi Anda DM + node mana yang dapat bergabung'
title: Pairing
x-i18n:
    generated_at: "2026-04-20T09:27:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# Pairing

“Pairing” adalah langkah **persetujuan pemilik** yang eksplisit di OpenClaw.
Ini digunakan di dua tempat:

1. **DM pairing** (siapa yang diizinkan berbicara dengan bot)
2. **Node pairing** (perangkat/node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Security](/id/gateway/security)

## 1) DM pairing (akses chat masuk)

Saat sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan mendapatkan kode singkat dan pesannya **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Security](/id/gateway/security)

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter yang ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing saat permintaan baru dibuat (kurang lebih sekali per jam per pengirim).
- Permintaan DM pairing yang tertunda dibatasi hingga **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Menyetujui pengirim

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
- Akun default menggunakan file allowlist tanpa cakupan yang khusus untuk channel tersebut.

Anggap ini sensitif (karena mengendalikan akses ke asisten Anda).

Penting: penyimpanan ini untuk akses DM. Otorisasi grup bersifat terpisah.
Menyetujui kode DM pairing tidak secara otomatis mengizinkan pengirim tersebut menjalankan perintah grup atau mengendalikan bot di grup. Untuk akses grup, konfigurasikan allowlist grup eksplisit milik channel tersebut (misalnya `groupAllowFrom`, `groups`, atau override per grup/per topik tergantung pada channel).

## 2) Pairing perangkat Node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pairing perangkat yang harus disetujui.

### Pair via Telegram (disarankan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pairing perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Tempel kode penyiapan dan hubungkan.
5. Kembali ke Telegram: `/pair pending` (tinjau ID permintaan, role, dan scope), lalu setujui.

Kode penyiapan adalah payload JSON berkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu perangkat berumur singkat yang digunakan untuk handshake pairing awal

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- token `node` utama yang diserahkan tetap `scopes: []`
- token `operator` yang diserahkan tetap dibatasi ke bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan scope bootstrap menggunakan prefiks role, bukan satu kumpulan scope datar:
  entri scope operator hanya memenuhi permintaan operator, dan role non-operator
  tetap harus meminta scope di bawah prefiks role mereka sendiri

Perlakukan kode penyiapan seperti kata sandi selama masih berlaku.

### Menyetujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jika perangkat yang sama mencoba lagi dengan detail autentikasi yang berbeda (misalnya
role/scope/public key yang berbeda), permintaan tertunda sebelumnya akan digantikan dan
`requestId` baru akan dibuat.

Penting: perangkat yang sudah di-pairing tidak akan diam-diam mendapatkan akses yang lebih luas. Jika perangkat itu
terhubung kembali dengan meminta scope lebih banyak atau role yang lebih luas, OpenClaw mempertahankan
persetujuan yang ada sebagaimana adanya dan membuat permintaan upgrade tertunda yang baru. Gunakan
`openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses yang baru
diminta sebelum Anda menyetujuinya.

### Penyimpanan status Node pairing

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur singkat; permintaan tertunda akan kedaluwarsa)
- `paired.json` (perangkat yang sudah di-pairing + token)

### Catatan

- API `node.pair.*` lama (CLI: `openclaw nodes pending|approve|reject|rename`) adalah
  penyimpanan pairing terpisah yang dimiliki Gateway. Node WS tetap memerlukan pairing perangkat.
- Catatan pairing adalah sumber kebenaran yang tahan lama untuk role yang disetujui. Token perangkat yang aktif
  tetap dibatasi pada kumpulan role yang disetujui tersebut; entri token liar
  di luar role yang disetujui tidak menciptakan akses baru.

## Dokumentasi terkait

- Model keamanan + prompt injection: [Security](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Updating](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
