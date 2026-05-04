---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar pemasangan: setujui siapa yang dapat mengirim DM kepada Anda + node mana yang dapat bergabung'
title: Penyandingan
x-i18n:
    generated_at: "2026-05-04T09:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

“Pemasangan” adalah langkah persetujuan akses eksplisit OpenClaw.
Ini digunakan di dua tempat:

1. **Pemasangan DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pemasangan Node** (perangkat/node mana yang diizinkan bergabung ke jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pemasangan DM (akses chat masuk)

Saat sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal mendapatkan kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya ketika allowlist DM efektif menyertakan `"*"`.
Penyiapan dan validasi memerlukan wildcard tersebut untuk konfigurasi publik-terbuka. Jika state yang ada
berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya mengizinkan
pengirim tersebut, dan persetujuan pairing-store tidak memperluas akses `open`.

Kode pemasangan:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pemasangan saat permintaan baru dibuat (kira-kira sekali per jam per pengirim).
- Permintaan pemasangan DM tertunda dibatasi pada **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Setujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pemasangan DM juga melakukan bootstrap
`commands.ownerAllowFrom` ke pengirim yang disetujui, seperti `telegram:123456789`.
Ini memberi penyiapan pertama kali pemilik eksplisit untuk perintah istimewa dan prompt
persetujuan eksekusi. Setelah pemilik ada, persetujuan pemasangan berikutnya hanya memberi akses DM;
persetujuan tersebut tidak menambahkan pemilik lain.

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan ulang

Gunakan `accessGroups` tingkat atas saat kumpulan pengirim tepercaya yang sama harus berlaku untuk
beberapa channel pesan atau untuk allowlist DM dan grup.

Grup statis menggunakan `type: "message.senders"` dan dirujuk dengan
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

Grup akses didokumentasikan secara detail di sini: [Grup akses](/id/channels/access-groups)

### Lokasi state

Disimpan di bawah `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file allowlist tercakup miliknya.
- Akun default menggunakan file allowlist tanpa cakupan yang dicakup oleh channel.

Perlakukan ini sebagai data sensitif (ini mengatur akses ke asisten Anda).

<Note>
Penyimpanan allowlist pemasangan adalah untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode pemasangan DM tidak secara otomatis mengizinkan pengirim tersebut menjalankan perintah grup
atau mengendalikan bot dalam grup. Bootstrap pemilik pertama adalah state konfigurasi terpisah
di `commands.ownerAllowFrom`, dan pengiriman chat grup tetap mengikuti
allowlist grup channel (misalnya `groupAllowFrom`, `groups`, atau override per grup
atau per topik bergantung pada channel).
</Note>

## 2) Pemasangan perangkat Node (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pemasangan perangkat yang harus disetujui.

### Pasangkan melalui Telegram (disarankan untuk iOS)

Jika Anda menggunakan Plugin `device-pair`, Anda dapat melakukan pemasangan perangkat pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Pindai kode QR atau tempel kode penyiapan dan hubungkan.
5. Kembali di Telegram: `/pair pending` (tinjau ID permintaan, peran, dan cakupan), lalu setujui.

Kode penyiapan adalah payload JSON berenkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap satu perangkat berumur pendek yang digunakan untuk handshake pemasangan awal

Token bootstrap tersebut membawa profil bootstrap pemasangan bawaan:

- token `node` yang diserahkan sebagai primer tetap `scopes: []`
- token `operator` apa pun yang diserahkan tetap dibatasi pada allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan cakupan bootstrap memiliki prefiks peran, bukan satu kumpulan cakupan datar:
  entri cakupan operator hanya memenuhi permintaan operator, dan peran non-operator
  tetap harus meminta cakupan di bawah prefiks perannya sendiri
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak peran yang disetujui perangkat
  dan cakupan operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih valid.

Untuk Tailscale, publik, atau pemasangan mobile non-loopback lainnya, gunakan Tailscale
Serve/Funnel atau URL Gateway `wss://` lain. URL penyiapan `ws://` non-loopback langsung
ditolak sebelum penerbitan QR/kode penyiapan. Kode penyiapan `ws://` plaintext
dibatasi pada URL loopback; klien `ws://` jaringan privat tetap memerlukan break-glass eksplisit
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` yang dijelaskan dalam panduan Gateway
jarak jauh.

### Setujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Ketika persetujuan eksplisit ditolak karena sesi perangkat-terpasang yang menyetujui
dibuka dengan cakupan hanya-pemasangan, CLI mencoba ulang permintaan yang sama dengan
`operator.admin`. Ini memungkinkan perangkat terpasang yang sudah ada dan berkemampuan admin memulihkan pemasangan
Control UI/browser baru tanpa mengedit `devices/paired.json` secara manual. Gateway
tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat diautentikasi
dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba ulang dengan detail autentikasi berbeda (misalnya
peran/cakupan/kunci publik berbeda), permintaan tertunda sebelumnya digantikan dan
`requestId` baru dibuat.

<Note>
Perangkat yang sudah dipasangkan tidak mendapatkan akses yang lebih luas secara diam-diam. Jika perangkat terhubung ulang dengan meminta cakupan lebih banyak atau peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan upgrade tertunda baru. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses baru yang diminta sebelum Anda menyetujui.
</Note>

### Auto-approve Node trusted-CIDR opsional

Pemasangan perangkat tetap manual secara default. Untuk jaringan Node yang dikontrol ketat,
Anda dapat memilih untuk mengaktifkan persetujuan otomatis Node pertama kali dengan CIDR eksplisit atau IP persis:

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
Klien operator, browser, Control UI, dan WebChat tetap memerlukan persetujuan manual.
Perubahan peran, cakupan, metadata, dan kunci publik tetap memerlukan persetujuan
manual.

### Penyimpanan state pemasangan Node

Disimpan di bawah `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (perangkat terpasang + token)

### Catatan

- API lama `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) adalah
  penyimpanan pemasangan terpisah milik gateway. Node WS tetap memerlukan pemasangan perangkat.
- Catatan pemasangan adalah sumber kebenaran tahan lama untuk peran yang disetujui. Token
  perangkat aktif tetap dibatasi pada kumpulan peran yang disetujui tersebut; entri token tersesat
  di luar peran yang disetujui tidak membuat akses baru.

## Dokumentasi terkait

- Model keamanan + prompt injection: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Memperbarui](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (lama): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
