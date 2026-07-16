---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ikhtisar penyandingan: setujui siapa yang dapat mengirimi Anda DM + Node mana yang dapat bergabung'
title: Pemasangan pasangan
x-i18n:
    generated_at: "2026-07-16T17:48:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" adalah langkah persetujuan akses eksplisit OpenClaw.
Langkah ini digunakan di dua tempat:

1. **Pairing DM** (siapa yang diizinkan berbicara dengan bot)
2. **Pairing Node** (perangkat/Node mana yang diizinkan bergabung dengan jaringan Gateway)

Konteks keamanan: [Keamanan](/id/gateway/security)

## 1) Pairing DM (akses obrolan masuk)

Saat suatu saluran dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal menerima kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM bawaan didokumentasikan di: [Keamanan](/id/gateway/security)

`dmPolicy: "open"` bersifat publik hanya jika daftar izin DM yang berlaku menyertakan `"*"`.
Penyiapan dan validasi mewajibkan wildcard tersebut untuk konfigurasi yang terbuka bagi publik. Jika status yang ada
berisi `open` dengan entri `allowFrom` konkret, runtime tetap hanya mengizinkan
pengirim tersebut, dan persetujuan penyimpanan pairing tidak memperluas akses `open`.

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing saat permintaan baru dibuat (kira-kira sekali per jam per pengirim).
- Permintaan pairing DM yang tertunda dibatasi hingga **3 per akun saluran**; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Menyetujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Tambahkan `--notify` ke perintah persetujuan untuk memberi tahu pemohon di saluran yang sama. Saluran multiakun menerima `--account <id>`.

Jika belum ada pemilik perintah yang dikonfigurasi, menyetujui kode pairing DM juga menginisialisasi
`commands.ownerAllowFrom` dengan pengirim yang disetujui, seperti `telegram:123456789`.
Hal ini memberi penyiapan pertama kali pemilik eksplisit untuk perintah berhak istimewa dan prompt
persetujuan eksekusi. Setelah ada pemilik, persetujuan pairing berikutnya hanya memberikan akses
DM; persetujuan tersebut tidak menambahkan pemilik lain.

Saluran yang didukung (setiap Plugin saluran terinstal yang mendeklarasikan pairing; Plugin eksternal seperti `openclaw-weixin` dapat menambahkan lebih banyak): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grup pengirim yang dapat digunakan kembali

Gunakan `accessGroups` tingkat teratas saat kumpulan pengirim tepercaya yang sama harus diterapkan ke
beberapa saluran pesan atau ke daftar izin DM dan grup sekaligus.

Grup statis menggunakan `type: "message.senders"` dan dirujuk dengan
`accessGroup:<name>` dari daftar izin saluran:

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

Disimpan dalam basis data status SQLite bersama di
`~/.openclaw/state/openclaw.sqlite`:

- permintaan tertunda dalam `channel_pairing_requests`
- pengirim yang disetujui dalam `channel_pairing_allow_entries`

Perilaku cakupan akun:

- setiap permintaan dan pengirim yang disetujui dikunci berdasarkan saluran dan akun
- runtime hanya membaca baris SQLite kanonis; runtime tidak menggabungkan berkas lama

Gateway lama menulis `<channel>-pairing.json` dan
`<channel>-<accountId>-allowFrom.json` di bawah `~/.openclaw/credentials/`.
Migrasi saat mulai dan `openclaw doctor --fix` mengimpor berkas tersebut ke SQLite dan
menghapus setiap sumber setelah impor berhasil. Perlakukan basis data SQLite sebagai
data sensitif karena baris-baris ini mengendalikan akses ke asisten Anda.

<Note>
Penyimpanan daftar izin pairing ditujukan untuk akses DM. Otorisasi grup bersifat terpisah.
Menyetujui kode pairing DM tidak secara otomatis mengizinkan pengirim tersebut menjalankan
perintah grup atau mengendalikan bot dalam grup. Inisialisasi pemilik pertama adalah status
konfigurasi terpisah dalam `commands.ownerAllowFrom`, dan pengiriman obrolan grup tetap mengikuti
daftar izin grup saluran (misalnya `groupAllowFrom`, `groups`, atau penggantian per grup
atau per topik, tergantung salurannya).
</Note>

## 2) Pairing perangkat Node (Node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **perangkat** dengan `role: node`. Gateway
membuat permintaan pairing perangkat yang harus disetujui.

### Melakukan pairing dari Control UI (disarankan)

Gunakan sesi Control UI yang sudah terhubung dengan akses `operator.admin`:

1. Buka Control UI dan buka **Settings → Devices**.
2. Pada halaman **Devices**, klik **Pair mobile device**.
3. Pertahankan **Full access (recommended)**, atau pilih **Limited access** untuk tidak menyertakan
   kontrol administratif Gateway.
4. Klik **Create setup code**.
5. Di ponsel Anda, buka aplikasi OpenClaw → **Settings** → **Gateway**.
6. Pindai kode QR atau tempel kode penyiapan, lalu hubungkan.

Aplikasi resmi OpenClaw untuk iOS dan Android disetujui secara otomatis jika metadata
kode penyiapannya cocok. Jika **Pending approval** menampilkan permintaan (misalnya,
untuk klien tidak resmi atau metadata yang tidak cocok), tinjau peran dan
cakupannya sebelum menyetujuinya.

Tombol dinonaktifkan jika sesi Control UI saat ini tidak memiliki
akses administrator. Dalam kasus tersebut, gunakan alur persetujuan CLI di bawah dari host Gateway.

### Melakukan pairing melalui Telegram

Jika Anda menggunakan Plugin `device-pair`, pairing perangkat pertama kali dapat dilakukan sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan kepada bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan petunjuk dan pesan **kode penyiapan** terpisah (mudah disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw untuk iOS → Settings → Gateway.
4. Pindai kode QR (`/pair qr`) atau tempel kode penyiapan, lalu hubungkan.
5. Aplikasi seluler resmi terhubung secara otomatis. Jika `/pair pending` menampilkan
   permintaan, tinjau peran dan cakupannya sebelum menyetujuinya.

Kode penyiapan adalah payload JSON yang dikodekan dengan base64 dan berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `urls`: jika tersedia, rute LAN/Tailnet berurutan yang dapat dicoba oleh aplikasi seluler
- `bootstrapToken`: token bootstrap sekali pakai untuk handshake pairing awal; Gateway membuatnya kedaluwarsa setelah 10 menit

Jalankan `/pair cleanup` untuk membatalkan kode penyiapan yang tidak digunakan setelah pairing selesai.

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- penyiapan `wss://` yang aman (atau loopback pada host yang sama) secara bawaan menggunakan `node` serta akses penuh
  `operator` seluler native
- token `node` yang diserahkan tetap `scopes: []`
- token `operator` bawaan yang diserahkan menyertakan `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan
  `operator.write`
- **Limited access** Control UI dan `openclaw qr --limited` tidak menyertakan
  `operator.admin`, sembari mempertahankan cakupan operator lainnya
- penyiapan LAN teks biasa `ws://` secara otomatis menggunakan profil terbatas yang sama;
  konfigurasikan `wss://` atau Tailscale Serve dan buat kode baru untuk akses penuh
- rotasi/pencabutan token berikutnya tetap dibatasi oleh kontrak peran perangkat yang disetujui
  dan cakupan operator sesi pemanggil

Perlakukan kode penyiapan seperti kata sandi selama masih berlaku.

Halaman **Settings → Gateway** iOS dan Android menampilkan akses **Full** atau **Limited**.
Untuk meningkatkan akses ponsel terbatas, terlebih dahulu konfigurasikan rute `wss://` yang aman atau
Tailscale Serve, lalu buat kode penyiapan akses penuh baru, pindai atau tempel
kode tersebut di halaman pengaturan itu, lalu hubungkan kembali.

Untuk pairing seluler melalui Tailscale, publik, atau jarak jauh lainnya, gunakan Tailscale Serve/Funnel
atau URL Gateway `wss://` lainnya. Kode penyiapan teks biasa `ws://` hanya diterima
untuk loopback, alamat LAN privat, host Bonjour `.local`, dan host
emulator Android. Rute teks biasa non-loopback menerima akses terbatas. Alamat
CGNAT Tailnet, nama `.ts.net`, dan host publik tetap ditolak sebelum
penerbitan QR/kode penyiapan.

Untuk URL penyiapan `gateway.bind=lan`, OpenClaw mendeteksi root HTTPS Tailscale Serve
persisten yang memproksi port loopback Gateway aktif dan mengiklankannya
bersama rute LAN. Perintah penyiapan menambahkan fallback ini hanya
untuk `lan`; `custom` dan `tailnet` mempertahankan rute yang diiklankan secara eksplisit. Aplikasi
iOS menguji rute yang diiklankan secara berurutan dan menyimpan endpoint pertama yang dapat dijangkau.

### Menyetujui perangkat Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jika persetujuan eksplisit ditolak karena sesi perangkat yang telah dipasangkan milik pemberi persetujuan
dibuka dengan cakupan khusus pairing, CLI mencoba kembali permintaan yang sama dengan
`operator.admin`. Hal ini memungkinkan perangkat terpasang yang memiliki kemampuan admin memulihkan pairing
Control UI/peramban baru tanpa mengedit penyimpanan pairing secara manual. Gateway
tetap memvalidasi koneksi yang dicoba ulang; token yang tidak dapat mengautentikasi
dengan `operator.admin` tetap diblokir.

Jika perangkat yang sama mencoba kembali dengan detail autentikasi yang berbeda (misalnya
peran/cakupan/kunci publik yang berbeda), permintaan tertunda sebelumnya digantikan dan
`requestId` baru dibuat.

<Note>
Perangkat yang sudah dipasangkan tidak diam-diam mendapatkan akses lebih luas. Jika perangkat terhubung kembali dan meminta lebih banyak cakupan atau peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada apa adanya dan membuat permintaan peningkatan baru yang tertunda. Gunakan `openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses yang baru diminta sebelum Anda menyetujuinya.
</Note>

### Persetujuan otomatis Node CIDR tepercaya opsional

Pairing perangkat tetap dilakukan secara manual secara bawaan. Untuk jaringan Node yang dikontrol dengan ketat,
Anda dapat mengaktifkan persetujuan otomatis Node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan pairing `role: node` baru tanpa cakupan yang diminta.
Klien operator, peramban, Control UI, dan WebChat tetap memerlukan persetujuan
manual. Perubahan peran, cakupan, metadata, dan kunci publik tetap memerlukan persetujuan
manual.

### Penyimpanan status pairing Node

Disimpan dalam basis data status SQLite bersama di `~/.openclaw/state/openclaw.sqlite`:

- permintaan pairing perangkat yang tertunda (berumur pendek; kedaluwarsa setelah 5 menit)
- perangkat yang dipasangkan + token

Gateway lama menyimpan status ini dalam `~/.openclaw/devices/*.json`; berkas tersebut
diimpor ke SQLite saat Gateway dimulai dan diarsipkan dengan akhiran `.migrated`.

### Catatan

- API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) mengelola
  persetujuan kapabilitas Node yang disimpan pada rekaman perangkat terpasang yang sama. Node WS
  tetap memerlukan pairing perangkat; lihat [Pairing Node](/id/gateway/pairing).
- Rekaman pairing merupakan sumber kebenaran permanen untuk peran yang disetujui. Token
  perangkat aktif tetap dibatasi pada kumpulan peran yang disetujui tersebut; entri token yang menyimpang
  di luar peran yang disetujui tidak membuat akses baru.

## Dokumentasi terkait

- Model keamanan + injeksi prompt: [Keamanan](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Pembaruan](/id/install/updating)
- Konfigurasi kanal:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - iMessage: [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
