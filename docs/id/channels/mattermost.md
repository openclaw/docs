---
read_when:
    - Menyiapkan Mattermost
    - Men-debug perutean Mattermost
summary: Penyiapan bot Mattermost dan config OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T08:58:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

Status: Plugin bawaan (token bot + peristiwa WebSocket). Channel, grup, dan DM didukung.
Mattermost adalah platform pesan tim yang dapat di-host sendiri; lihat situs resminya di
[mattermost.com](https://mattermost.com) untuk detail produk dan unduhan.

## Plugin bawaan

Mattermost dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Mattermost,
instal secara manual:

Instal melalui CLI (registry npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat

1. Pastikan Plugin Mattermost tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun bot Mattermost dan salin **token bot**.
3. Salin **URL dasar** Mattermost (misalnya, `https://chat.example.com`).
4. Konfigurasikan OpenClaw dan jalankan gateway.

Config minimal:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Slash command native

Slash command native bersifat opt-in. Saat diaktifkan, OpenClaw mendaftarkan slash command `oc_*` melalui
API Mattermost dan menerima callback POST di server HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gunakan saat Mattermost tidak dapat menjangkau gateway secara langsung (reverse proxy/URL publik).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Catatan:

- `native: "auto"` secara default dinonaktifkan untuk Mattermost. Atur `native: true` untuk mengaktifkannya.
- Jika `callbackUrl` dihilangkan, OpenClaw menurunkannya dari host/port gateway + `callbackPath`.
- Untuk penyiapan multi-akun, `commands` dapat diatur di level atas atau di bawah
  `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa field level atas).
- Callback command divalidasi dengan token per-command yang dikembalikan oleh
  Mattermost saat OpenClaw mendaftarkan command `oc_*`.
- Callback slash gagal tertutup saat pendaftaran gagal, startup parsial, atau
  token callback tidak cocok dengan salah satu command yang terdaftar.
- Persyaratan keterjangkauan: endpoint callback harus dapat dijangkau dari server Mattermost.
  - Jangan atur `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw.
  - Jangan atur `callbackUrl` ke URL dasar Mattermost Anda kecuali URL itu melakukan reverse-proxy `/api/channels/mattermost/command` ke OpenClaw.
  - Pemeriksaan cepat adalah `curl https://<gateway-host>/api/channels/mattermost/command`; GET harus mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.
- Persyaratan allowlist egress Mattermost:
  - Jika callback Anda menargetkan alamat privat/tailnet/internal, atur Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` agar menyertakan host/domain callback.
  - Gunakan entri host/domain, bukan URL lengkap.
    - Baik: `gateway.tailnet-name.ts.net`
    - Buruk: `https://gateway.tailnet-name.ts.net`

## Variabel environment (akun default)

Atur ini di host gateway jika Anda lebih memilih env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Env vars hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai config.

`MATTERMOST_URL` tidak dapat diatur dari workspace `.env`; lihat [file workspace `.env`](/id/gateway/security).

## Mode chat

Mattermost merespons DM secara otomatis. Perilaku channel dikendalikan oleh `chatmode`:

- `oncall` (default): hanya merespons saat di-mention dengan @ di channel.
- `onmessage`: merespons setiap pesan channel.
- `onchar`: merespons saat pesan dimulai dengan prefiks pemicu.

Contoh config:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Catatan:

- `onchar` tetap merespons @mention eksplisit.
- `channels.mattermost.requireMention` tetap dihormati untuk config lama tetapi `chatmode` lebih disarankan.

## Threading dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan channel dan grup tetap di
channel utama atau memulai thread di bawah post pemicu.

- `off` (default): hanya membalas dalam thread saat post masuk sudah berada di thread.
- `first`: untuk post channel/grup level atas, mulai thread di bawah post tersebut dan rutekan
  percakapan ke sesi yang dicakup thread.
- `all`: perilaku yang sama dengan `first` untuk Mattermost saat ini.
- Direct message mengabaikan pengaturan ini dan tetap non-threaded.

Contoh config:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Catatan:

- Sesi yang dicakup thread menggunakan id post pemicu sebagai root thread.
- `first` dan `all` saat ini setara karena begitu Mattermost memiliki root thread,
  chunk lanjutan dan media akan berlanjut dalam thread yang sama.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim yang tidak dikenal mendapat kode pairing).
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Channel (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi mention).
- Allowlist pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna disarankan).
- Override mention per-channel berada di bawah `channels.mattermost.groups.<channelId>.requireMention`
  atau `channels.mattermost.groups["*"].requireMention` untuk default.
- Pencocokan `@username` dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Channel terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi mention).
- Catatan runtime: jika `channels.mattermost` sama sekali tidak ada, runtime kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (bahkan jika `channels.defaults.groupPolicy` diatur).

Contoh:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Target untuk pengiriman keluar

Gunakan format target ini dengan `openclaw message send` atau cron/webhook:

- `channel:<id>` untuk channel
- `user:<id>` untuk DM
- `@username` untuk DM (di-resolve melalui API Mattermost)

ID opak kosong (seperti `64ifufp...`) **ambigu** di Mattermost (ID pengguna vs ID channel).

OpenClaw me-resolve-nya **pengguna-terlebih-dahulu**:

- Jika ID ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan me-resolve channel direct melalui `/api/v4/channels/direct`.
- Jika tidak, ID diperlakukan sebagai **ID channel**.

Jika Anda membutuhkan perilaku yang deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).

## Percobaan ulang channel DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu me-resolve channel direct terlebih dahulu, ia
secara default mencoba ulang kegagalan pembuatan channel direct yang bersifat sementara.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyetel perilaku itu secara global untuk Plugin Mattermost,
atau `channels.mattermost.accounts.<id>.dmChannelRetry` untuk satu akun.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Catatan:

- Ini hanya berlaku untuk pembuatan channel DM (`/api/v4/channels/direct`), bukan setiap panggilan API Mattermost.
- Percobaan ulang berlaku untuk kegagalan sementara seperti rate limit, respons 5xx, serta error jaringan atau timeout.
- Error klien 4xx selain `429` diperlakukan sebagai permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost men-stream pemikiran, aktivitas tool, dan teks balasan parsial ke dalam satu **post pratinjau draf** yang diselesaikan di tempat saat jawaban akhir aman untuk dikirim. Pratinjau diperbarui pada id post yang sama alih-alih membanjiri channel dengan pesan per-chunk. Final media/error membatalkan edit pratinjau yang tertunda dan menggunakan pengiriman normal alih-alih mengosongkan post pratinjau sekali pakai.

Aktifkan melalui `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Catatan:

- `partial` adalah pilihan yang umum: satu post pratinjau yang diedit seiring balasan bertambah, lalu diselesaikan dengan jawaban lengkap.
- `block` menggunakan chunk draf bergaya append di dalam post pratinjau.
- `progress` menampilkan pratinjau status saat menghasilkan dan hanya memposting jawaban akhir saat selesai.
- `off` menonaktifkan streaming pratinjau.
- Jika stream tidak dapat diselesaikan di tempat (misalnya post dihapus di tengah stream), OpenClaw kembali mengirim post final baru agar balasan tidak pernah hilang.
- Payload khusus penalaran ditekan dari post channel, termasuk teks yang datang sebagai blockquote `> Reasoning:`. Atur `/reasoning on` untuk melihat pemikiran di surface lain; post final Mattermost hanya mempertahankan jawabannya.
- Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan channel.

## Reaksi (tool message)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah id post Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua opsional).
- Atur `remove=true` (boolean) untuk menghapus reaksi.
- Peristiwa tambah/hapus reaksi diteruskan sebagai peristiwa sistem ke sesi agen yang dirutekan.

Contoh:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Config:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan aksi reaksi (default true).
- Override per-akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (tool message)

Kirim pesan dengan tombol yang dapat diklik. Saat pengguna mengklik tombol, agen menerima
pilihan tersebut dan dapat merespons.

Aktifkan tombol dengan menambahkan `inlineButtons` ke kapabilitas channel:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Gunakan `message action=send` dengan parameter `buttons`. Tombol adalah array 2D (baris tombol):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Field tombol:

- `text` (wajib): label tampilan.
- `callback_data` (wajib): nilai yang dikirim balik saat diklik (digunakan sebagai ID aksi).
- `style` (opsional): `"default"`, `"primary"`, atau `"danger"`.

Saat pengguna mengklik tombol:

1. Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Yes** dipilih oleh @user").
2. Agen menerima pilihan itu sebagai pesan masuk dan merespons.

Catatan:

- Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak perlu config).
- Mattermost menghapus callback data dari respons API-nya (fitur keamanan), sehingga semua tombol
  dihapus saat diklik — penghapusan parsial tidak dimungkinkan.
- ID aksi yang berisi tanda hubung atau underscore dibersihkan secara otomatis
  (keterbatasan perutean Mattermost).

Config:

- `channels.mattermost.capabilities`: array string kapabilitas. Tambahkan `"inlineButtons"` untuk
  mengaktifkan deskripsi tool tombol dalam prompt sistem agen.
- `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback
  tombol (misalnya `https://gateway.example.com`). Gunakan ini saat Mattermost tidak dapat
  menjangkau gateway secara langsung di host bind-nya.
- Dalam penyiapan multi-akun, Anda juga dapat mengatur field yang sama di bawah
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw menurunkan URL callback dari
  `gateway.customBindHost` + `gateway.port`, lalu fallback ke `http://localhost:<port>`.
- Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost.
  `localhost` hanya berfungsi saat Mattermost dan OpenClaw berjalan pada host/namespace jaringan yang sama.
- Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke
  `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

### Integrasi API langsung (skrip eksternal)

Skrip dan webhook eksternal dapat memposting tombol secara langsung melalui REST API Mattermost
alih-alih melalui tool `message` milik agen. Gunakan `buildButtonAttachments()` dari
Plugin jika memungkinkan; jika memposting JSON mentah, ikuti aturan ini:

**Struktur payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // hanya alfanumerik — lihat di bawah
            type: "button", // wajib, atau klik akan diabaikan tanpa tanda
            name: "Approve", // label tampilan
            style: "primary", // opsional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // harus cocok dengan id tombol (untuk pencarian nama)
                action: "approve",
                // ... field kustom apa pun ...
                _token: "<hmac>", // lihat bagian HMAC di bawah
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Aturan penting:**

1. Attachment ditempatkan di `props.attachments`, bukan `attachments` level atas (kalau tidak akan diabaikan tanpa tanda).
2. Setiap aksi memerlukan `type: "button"` — tanpa itu, klik akan ditelan tanpa tanda.
3. Setiap aksi memerlukan field `id` — Mattermost mengabaikan aksi tanpa ID.
4. `id` aksi harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan underscore merusak
   perutean aksi sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol agar pesan konfirmasi menampilkan
   nama tombol (misalnya, "Approve"), bukan ID mentah.
6. `context.action_id` wajib — handler interaksi mengembalikan 400 tanpa field tersebut.

**Pembuatan token HMAC:**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token
yang cocok dengan logika verifikasi gateway:

1. Turunkan secret dari token bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Bangun objek konteks dengan semua field **kecuali** `_token`.
3. Serialisasikan dengan **kunci terurut** dan **tanpa spasi** (gateway menggunakan `JSON.stringify`
   dengan kunci terurut, yang menghasilkan output ringkas).
4. Tanda tangani: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Tambahkan hex digest yang dihasilkan sebagai `_token` di dalam konteks.

Contoh Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Jebakan umum HMAC:

- `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan
  `separators=(",", ":")` agar cocok dengan output ringkas JavaScript (`{"key":"val"}`).
- Selalu tanda tangani **semua** field konteks (tanpa `_token`). Gateway menghapus `_token` lalu
  menandatangani semua yang tersisa. Menandatangani hanya sebagian akan menyebabkan kegagalan verifikasi tanpa tanda.
- Gunakan `sort_keys=True` — gateway mengurutkan kunci sebelum menandatangani, dan Mattermost dapat
  mengubah urutan field konteks saat menyimpan payload.
- Turunkan secret dari token bot (deterministik), bukan byte acak. Secret
  harus sama di seluruh proses yang membuat tombol dan gateway yang memverifikasi.

## Adapter direktori

Plugin Mattermost menyertakan adapter direktori yang me-resolve nama channel dan pengguna
melalui API Mattermost. Ini mengaktifkan target `#channel-name` dan `@username` di
`openclaw message send` dan pengiriman cron/webhook.

Tidak perlu konfigurasi — adapter menggunakan token bot dari config akun.

## Multi-akun

Mattermost mendukung banyak akun di bawah `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Pemecahan masalah

- Tidak ada balasan di channel: pastikan bot ada di channel dan mention bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau atur `chatmode: "onmessage"`.
- Error auth: periksa token bot, URL dasar, dan apakah akun diaktifkan.
- Masalah multi-akun: env vars hanya berlaku untuk akun `default`.
- Slash command native mengembalikan `Unauthorized: invalid command token.`: OpenClaw
  tidak menerima token callback. Penyebab umum:
  - pendaftaran slash command gagal atau hanya selesai sebagian saat startup
  - callback mengenai gateway/akun yang salah
  - Mattermost masih memiliki command lama yang mengarah ke target callback sebelumnya
  - gateway dimulai ulang tanpa mengaktifkan ulang slash command
- Jika slash command native berhenti berfungsi, periksa log untuk
  `mattermost: failed to register slash commands` atau
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa callback di-resolve ke
  `http://127.0.0.1:18789/...`, URL itu mungkin hanya dapat dijangkau saat
  Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw. Atur
  `commands.callbackUrl` yang eksplisit dan dapat dijangkau secara eksternal.
- Tombol muncul sebagai kotak putih: agen mungkin mengirim data tombol yang tidak valid. Periksa bahwa setiap tombol memiliki field `text` dan `callback_data`.
- Tombol dirender tetapi klik tidak melakukan apa pun: verifikasi `AllowedUntrustedInternalConnections` dalam config server Mattermost mencakup `127.0.0.1 localhost`, dan bahwa `EnablePostActionIntegration` adalah `true` dalam ServiceSettings.
- Tombol mengembalikan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau underscore. Perute aksi Mattermost rusak pada ID non-alfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
- Log gateway `invalid _token`: HMAC tidak cocok. Periksa bahwa Anda menandatangani semua field konteks (bukan sebagian), menggunakan kunci terurut, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
- Log gateway `missing _token in context`: field `_token` tidak ada dalam konteks tombol. Pastikan field ini disertakan saat membangun payload integrasi.
- Konfirmasi menampilkan ID mentah alih-alih nama tombol: `context.action_id` tidak cocok dengan `id` tombol. Atur keduanya ke nilai bersih yang sama.
- Agen tidak mengetahui tombol: tambahkan `capabilities: ["inlineButtons"]` ke config channel Mattermost.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gerbang mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
