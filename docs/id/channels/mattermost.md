---
read_when:
    - Menyiapkan Mattermost
    - Men-debug routing Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T13:44:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: plugin bawaan (token bot + event WebSocket). Channel, grup, dan DM didukung.
Mattermost adalah platform perpesanan tim yang dapat di-host sendiri; lihat situs resmi di
[mattermost.com](https://mattermost.com) untuk detail produk dan unduhan.

## Plugin bawaan

Mattermost dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build
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

Detail: [Plugins](/tools/plugin)

## Penyiapan cepat

1. Pastikan plugin Mattermost tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun bot Mattermost dan salin **token bot**.
3. Salin **URL dasar** Mattermost (misalnya `https://chat.example.com`).
4. Konfigurasikan OpenClaw dan jalankan gateway.

Konfigurasi minimal:

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

## Native slash commands

Native slash commands bersifat opt-in. Saat diaktifkan, OpenClaw mendaftarkan slash command `oc_*` melalui
Mattermost API dan menerima POST callback pada server HTTP gateway.

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

- `native: "auto"` secara default dinonaktifkan untuk Mattermost. Setel `native: true` untuk mengaktifkannya.
- Jika `callbackUrl` dihilangkan, OpenClaw akan menurunkannya dari host/port gateway + `callbackPath`.
- Untuk penyiapan multi-akun, `commands` dapat disetel di tingkat atas atau di bawah
  `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa field tingkat atas).
- Callback perintah divalidasi dengan token per perintah yang dikembalikan oleh
  Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
- Callback slash gagal secara tertutup saat pendaftaran gagal, startup parsial, atau
  token callback tidak cocok dengan salah satu perintah yang terdaftar.
- Persyaratan keterjangkauan: endpoint callback harus dapat dijangkau dari server Mattermost.
  - Jangan setel `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/network namespace yang sama dengan OpenClaw.
  - Jangan setel `callbackUrl` ke URL dasar Mattermost Anda kecuali URL tersebut melakukan reverse-proxy `/api/channels/mattermost/command` ke OpenClaw.
  - Pemeriksaan cepat: `curl https://<gateway-host>/api/channels/mattermost/command`; GET harus mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.
- Persyaratan allowlist egress Mattermost:
  - Jika callback Anda menargetkan alamat privat/tailnet/internal, setel Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` agar menyertakan host/domain callback.
  - Gunakan entri host/domain, bukan URL lengkap.
    - Baik: `gateway.tailnet-name.ts.net`
    - Buruk: `https://gateway.tailnet-name.ts.net`

## Variabel lingkungan (akun default)

Setel ini pada host gateway jika Anda lebih memilih env var:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Env var hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

## Mode chat

Mattermost merespons DM secara otomatis. Perilaku channel dikendalikan oleh `chatmode`:

- `oncall` (default): hanya merespons saat di-@mention di channel.
- `onmessage`: merespons setiap pesan channel.
- `onchar`: merespons saat pesan dimulai dengan prefiks pemicu.

Contoh konfigurasi:

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
- `channels.mattermost.requireMention` dihormati untuk konfigurasi lama, tetapi `chatmode` lebih disukai.

## Threading dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan channel dan grup tetap berada di
channel utama atau memulai thread di bawah post pemicu.

- `off` (default): hanya membalas dalam thread saat post masuk memang sudah berada di thread.
- `first`: untuk post channel/grup tingkat atas, mulai thread di bawah post tersebut dan rutekan
  percakapan ke sesi dengan cakupan thread.
- `all`: perilakunya sama dengan `first` untuk Mattermost saat ini.
- Pesan langsung mengabaikan pengaturan ini dan tetap non-threaded.

Contoh konfigurasi:

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

- Sesi dengan cakupan thread menggunakan id post pemicu sebagai akar thread.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki akar thread,
  chunk lanjutan dan media akan tetap berada di thread yang sama.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim yang tidak dikenal mendapatkan kode pairing).
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Channel (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi mention).
- Allowlist pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna direkomendasikan).
- Override mention per channel ada di bawah `channels.mattermost.groups.<channelId>.requireMention`
  atau `channels.mattermost.groups["*"].requireMention` sebagai default.
- Pencocokan `@username` bersifat dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Channel terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi mention).
- Catatan runtime: jika `channels.mattermost` sama sekali tidak ada, runtime akan fallback ke `groupPolicy="allowlist"` untuk pemeriksaan grup (bahkan jika `channels.defaults.groupPolicy` disetel).

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
- `@username` untuk DM (di-resolve melalui Mattermost API)

ID opak biasa (seperti `64ifufp...`) **ambigu** di Mattermost (ID pengguna vs ID channel).

OpenClaw me-resolve-nya dengan prioritas **pengguna terlebih dahulu**:

- Jika ID ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan me-resolve channel langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID diperlakukan sebagai **ID channel**.

Jika Anda membutuhkan perilaku deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).

## Percobaan ulang channel DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu me-resolve channel langsung terlebih dahulu, OpenClaw
secara default mencoba ulang kegagalan sementara pada pembuatan channel langsung.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyetel perilaku itu secara global untuk plugin Mattermost,
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

- Ini hanya berlaku untuk pembuatan channel DM (`/api/v4/channels/direct`), bukan setiap panggilan Mattermost API.
- Percobaan ulang berlaku untuk kegagalan sementara seperti rate limit, respons 5xx, dan kesalahan jaringan atau timeout.
- Kesalahan klien 4xx selain `429` diperlakukan sebagai permanen dan tidak dicoba ulang.

## Reaksi (message tool)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah id post Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua opsional).
- Setel `remove=true` (boolean) untuk menghapus reaksi.
- Event tambah/hapus reaksi diteruskan sebagai event sistem ke sesi agent yang dirutekan.

Contoh:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan tindakan reaksi (default true).
- Override per akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (message tool)

Kirim pesan dengan tombol yang dapat diklik. Saat pengguna mengklik tombol, agent menerima
pilihan tersebut dan dapat merespons.

Aktifkan tombol dengan menambahkan `inlineButtons` ke capability channel:

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
- `callback_data` (wajib): nilai yang dikirim kembali saat diklik (digunakan sebagai action ID).
- `style` (opsional): `"default"`, `"primary"`, atau `"danger"`.

Saat pengguna mengklik tombol:

1. Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Yes** selected by @user").
2. Agent menerima pilihan sebagai pesan masuk dan merespons.

Catatan:

- Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak perlu konfigurasi).
- Mattermost menghapus callback data dari respons API-nya (fitur keamanan), sehingga semua tombol
  dihapus saat diklik — penghapusan sebagian tidak dimungkinkan.
- Action ID yang berisi tanda hubung atau garis bawah disanitasi secara otomatis
  (keterbatasan routing Mattermost).

Konfigurasi:

- `channels.mattermost.capabilities`: array string capability. Tambahkan `"inlineButtons"` untuk
  mengaktifkan deskripsi tool tombol dalam prompt sistem agent.
- `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback
  tombol (misalnya `https://gateway.example.com`). Gunakan ini saat Mattermost tidak dapat
  menjangkau gateway pada bind host-nya secara langsung.
- Dalam penyiapan multi-akun, Anda juga dapat menyetel field yang sama di bawah
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw menurunkan URL callback dari
  `gateway.customBindHost` + `gateway.port`, lalu fallback ke `http://localhost:<port>`.
- Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost.
  `localhost` hanya berfungsi jika Mattermost dan OpenClaw berjalan pada host/network namespace yang sama.
- Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan webhook dapat mem-posting tombol langsung melalui Mattermost REST API
alih-alih melalui `message` tool milik agent. Gunakan `buildButtonAttachments()` dari
ekstensi bila memungkinkan; jika mem-posting JSON mentah, ikuti aturan ini:

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
            id: "mybutton01", // alfanumerik saja — lihat di bawah
            type: "button", // wajib, atau klik akan diabaikan secara diam-diam
            name: "Approve", // label tampilan
            style: "primary", // opsional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // harus cocok dengan id tombol (untuk lookup nama)
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

1. Attachment ditempatkan di `props.attachments`, bukan `attachments` tingkat atas (kalau tidak akan diabaikan secara diam-diam).
2. Setiap action memerlukan `type: "button"` — tanpa itu, klik akan tertelan secara diam-diam.
3. Setiap action memerlukan field `id` — Mattermost mengabaikan action tanpa ID.
4. `id` action harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak
   routing action sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol agar pesan konfirmasi menampilkan
   nama tombol (misalnya, "Approve"), bukan ID mentah.
6. `context.action_id` wajib — handler interaksi mengembalikan 400 tanpanya.

**Pembuatan token HMAC:**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token
yang cocok dengan logika verifikasi gateway:

1. Turunkan secret dari token bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Bangun objek context dengan semua field **kecuali** `_token`.
3. Serialisasikan dengan **kunci yang diurutkan** dan **tanpa spasi** (gateway menggunakan `JSON.stringify`
   dengan kunci yang diurutkan, yang menghasilkan output ringkas).
4. Tanda tangani: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Tambahkan hex digest yang dihasilkan sebagai `_token` dalam context.

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

- `json.dumps` Python secara default menambahkan spasi (`{"key": "val"}`). Gunakan
  `separators=(",", ":")` agar cocok dengan output ringkas JavaScript (`{"key":"val"}`).
- Selalu tanda tangani **semua** field context (tanpa `_token`). Gateway menghapus `_token` lalu
  menandatangani semua yang tersisa. Menandatangani subset akan menyebabkan kegagalan verifikasi diam-diam.
- Gunakan `sort_keys=True` — gateway mengurutkan kunci sebelum penandatanganan, dan Mattermost dapat
  mengubah urutan field context saat menyimpan payload.
- Turunkan secret dari token bot (deterministik), bukan byte acak. Secret
  harus sama di seluruh proses yang membuat tombol dan gateway yang memverifikasi.

## Adapter direktori

Plugin Mattermost menyertakan adapter direktori yang me-resolve nama channel dan pengguna
melalui Mattermost API. Ini memungkinkan target `#channel-name` dan `@username` dalam
`openclaw message send` dan pengiriman cron/webhook.

Tidak diperlukan konfigurasi — adapter menggunakan token bot dari konfigurasi akun.

## Multi-akun

Mattermost mendukung beberapa akun di bawah `channels.mattermost.accounts`:

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

- Tidak ada balasan di channel: pastikan bot ada di channel dan sebut bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau setel `chatmode: "onmessage"`.
- Kesalahan autentikasi: periksa token bot, URL dasar, dan apakah akun diaktifkan.
- Masalah multi-akun: env var hanya berlaku untuk akun `default`.
- Native slash commands mengembalikan `Unauthorized: invalid command token.`: OpenClaw
  tidak menerima token callback. Penyebab umum:
  - pendaftaran slash command gagal atau hanya selesai sebagian saat startup
  - callback mengenai gateway/akun yang salah
  - Mattermost masih memiliki perintah lama yang menunjuk ke target callback sebelumnya
  - gateway direstart tanpa mengaktifkan kembali slash commands
- Jika native slash commands berhenti berfungsi, periksa log untuk
  `mattermost: failed to register slash commands` atau
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa callback di-resolve ke
  `http://127.0.0.1:18789/...`, URL tersebut kemungkinan hanya dapat dijangkau saat
  Mattermost berjalan pada host/network namespace yang sama dengan OpenClaw. Setel
  `commands.callbackUrl` eksplisit yang dapat dijangkau dari luar.
- Tombol muncul sebagai kotak putih: agent mungkin mengirim data tombol yang tidak valid. Pastikan setiap tombol memiliki field `text` dan `callback_data`.
- Tombol dirender tetapi klik tidak melakukan apa-apa: verifikasi `AllowedUntrustedInternalConnections` pada konfigurasi server Mattermost menyertakan `127.0.0.1 localhost`, dan `EnablePostActionIntegration` bernilai `true` di ServiceSettings.
- Tombol mengembalikan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router action Mattermost rusak pada ID non-alfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
- Log gateway `invalid _token`: HMAC tidak cocok. Periksa bahwa Anda menandatangani semua field context (bukan subset), menggunakan kunci yang diurutkan, dan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
- Log gateway `missing _token in context`: field `_token` tidak ada dalam context tombol. Pastikan field tersebut disertakan saat membangun payload integrasi.
- Konfirmasi menampilkan ID mentah alih-alih nama tombol: `context.action_id` tidak cocok dengan `id` tombol. Setel keduanya ke nilai tersanitasi yang sama.
- Agent tidak mengetahui tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi channel Mattermost.

## Terkait

- [Ikhtisar Channels](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Channel Routing](/channels/channel-routing) — routing sesi untuk pesan
- [Security](/gateway/security) — model akses dan hardening
