---
read_when:
    - Menyiapkan Mattermost
    - Men-debug perutean Mattermost
sidebarTitle: Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin yang dapat diunduh (token bot + peristiwa WebSocket). Channel, grup, dan DM didukung. Mattermost adalah platform pesan tim yang dapat di-host sendiri; lihat situs resmi di [mattermost.com](https://mattermost.com) untuk detail produk dan unduhan.

## Instal

Instal Mattermost sebelum mengonfigurasi channel:

<Tabs>
  <Tab title="registri npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Checkout lokal">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

<Steps>
  <Step title="Pastikan Plugin tersedia">
    Instal `@openclaw/mattermost` dengan perintah di atas, lalu mulai ulang Gateway jika sudah berjalan.
  </Step>
  <Step title="Buat bot Mattermost">
    Buat akun bot Mattermost dan salin **token bot**.
  </Step>
  <Step title="Salin URL dasar">
    Salin **URL dasar** Mattermost (misalnya, `https://chat.example.com`).
  </Step>
  <Step title="Konfigurasikan OpenClaw dan mulai gateway">
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

  </Step>
</Steps>

## Perintah slash native

Perintah slash native bersifat opt-in. Saat diaktifkan, OpenClaw mendaftarkan perintah slash `oc_*` melalui API Mattermost dan menerima POST callback di server HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Catatan perilaku">
    - `native: "auto"` default-nya dinonaktifkan untuk Mattermost. Atur `native: true` untuk mengaktifkan.
    - Jika `callbackUrl` dihilangkan, OpenClaw menurunkannya dari host/port gateway + `callbackPath`.
    - Untuk penyiapan multi-akun, `commands` dapat diatur di tingkat teratas atau di bawah `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa bidang tingkat teratas).
    - Callback perintah divalidasi dengan token per-perintah yang dikembalikan oleh Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
    - OpenClaw menyegarkan registrasi perintah Mattermost saat ini sebelum menerima setiap callback sehingga token usang dari perintah slash yang dihapus atau dibuat ulang berhenti diterima tanpa perlu memulai ulang gateway.
    - Validasi callback gagal tertutup jika API Mattermost tidak dapat mengonfirmasi bahwa perintah masih terkini; validasi gagal di-cache sebentar, lookup bersamaan digabungkan, dan awal lookup baru dibatasi lajunya per perintah untuk membatasi tekanan replay.
    - Callback slash gagal tertutup saat registrasi gagal, startup parsial, atau token callback tidak cocok dengan token terdaftar milik perintah yang diselesaikan (token yang valid untuk satu perintah tidak dapat mencapai validasi upstream untuk perintah lain).

  </Accordion>
  <Accordion title="Persyaratan keterjangkauan">
    Endpoint callback harus dapat dijangkau dari server Mattermost.

    - Jangan atur `callbackUrl` ke `localhost` kecuali Mattermost berjalan di host/namespace jaringan yang sama dengan OpenClaw.
    - Jangan atur `callbackUrl` ke URL dasar Mattermost Anda kecuali URL tersebut melakukan reverse-proxy `/api/channels/mattermost/command` ke OpenClaw.
    - Pemeriksaan cepat adalah `curl https://<gateway-host>/api/channels/mattermost/command`; GET seharusnya mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.

  </Accordion>
  <Accordion title="Allowlist egress Mattermost">
    Jika callback Anda menargetkan alamat private/tailnet/internal, atur `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost agar menyertakan host/domain callback.

    Gunakan entri host/domain, bukan URL lengkap.

    - Baik: `gateway.tailnet-name.ts.net`
    - Buruk: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabel lingkungan (akun default)

Atur ini di host gateway jika Anda lebih memilih env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env vars hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

`MATTERMOST_URL` tidak dapat diatur dari `.env` workspace; lihat [File `.env` workspace](/id/gateway/security).
</Note>

## Mode chat

Mattermost merespons DM secara otomatis. Perilaku channel dikontrol oleh `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Respons hanya saat di-@mention di channel.
  </Tab>
  <Tab title="onmessage">
    Respons setiap pesan channel.
  </Tab>
  <Tab title="onchar">
    Respons saat pesan dimulai dengan prefiks pemicu.
  </Tab>
</Tabs>

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
- `channels.mattermost.requireMention` dihormati untuk konfigurasi legacy, tetapi `chatmode` lebih disukai.
- Setelah bot mengirim balasan yang terlihat di thread channel, pesan berikutnya di thread yang sama dijawab tanpa @mention baru atau prefiks `onchar`, sehingga percakapan thread multi-giliran tetap mengalir. Partisipasi diingat selama 7 hari tidak aktifnya thread (disegarkan pada setiap balasan) dan bertahan setelah gateway dimulai ulang. Thread yang hanya diamati bot tidak terpengaruh; mulai pesan tingkat atas baru untuk mewajibkan mention eksplisit lagi.

## Threading dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan channel dan grup tetap di channel utama atau memulai thread di bawah posting pemicu.

- `off` (default): hanya balas di thread saat posting masuk sudah berada di dalam thread.
- `first`: untuk posting channel/grup tingkat atas, mulai thread di bawah posting tersebut dan rutekan percakapan ke sesi cakupan thread.
- `all`: perilaku yang sama dengan `first` untuk Mattermost saat ini.
- Pesan langsung mengabaikan pengaturan ini dan tetap tanpa thread.

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

- Sesi cakupan thread menggunakan id posting pemicu sebagai root thread.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki root thread, chunk lanjutan dan media berlanjut di thread yang sama.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim tidak dikenal mendapatkan kode pairing).
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` menerima entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).

## Channel (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi oleh mention).
- Allowlist pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna direkomendasikan).
- `channels.mattermost.groupAllowFrom` menerima entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).
- Override mention per-channel berada di bawah `channels.mattermost.groups.<channelId>.requireMention` atau `channels.mattermost.groups["*"].requireMention` sebagai default.
- Pencocokan `@username` dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Channel terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi oleh mention).
- Catatan runtime: jika `channels.mattermost` sepenuhnya hilang, runtime fallback ke `groupPolicy="allowlist"` untuk pemeriksaan grup (bahkan jika `channels.defaults.groupPolicy` diatur).

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

Gunakan format target ini dengan `openclaw message send` atau cron/webhooks:

- `channel:<id>` untuk channel
- `user:<id>` untuk DM
- `@username` untuk DM (diselesaikan melalui API Mattermost)

<Warning>
ID opaque tanpa prefiks (seperti `64ifufp...`) **ambigu** di Mattermost (ID pengguna vs ID channel).

OpenClaw menyelesaikannya dengan **pengguna lebih dulu**:

- Jika ID ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan menyelesaikan channel langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID diperlakukan sebagai **ID channel**.

Jika Anda membutuhkan perilaku deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).
</Warning>

## Percobaan ulang channel DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu menyelesaikan channel langsung terlebih dahulu, secara default OpenClaw mencoba ulang kegagalan sementara pembuatan channel langsung.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyesuaikan perilaku tersebut secara global untuk Plugin Mattermost, atau `channels.mattermost.accounts.<id>.dmChannelRetry` untuk satu akun.

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
- Percobaan ulang berlaku untuk kegagalan sementara seperti batas laju, respons 5xx, dan error jaringan atau timeout.
- Error klien 4xx selain `429` diperlakukan sebagai permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost melakukan streaming pemikiran, aktivitas alat, dan teks balasan parsial ke dalam satu **posting pratinjau draf** yang difinalisasi di tempat saat jawaban akhir aman untuk dikirim. Pratinjau diperbarui pada id posting yang sama alih-alih membanjiri channel dengan pesan per-chunk. Final media/error membatalkan edit pratinjau tertunda dan menggunakan pengiriman normal alih-alih mengirim posting pratinjau sementara.

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

<AccordionGroup>
  <Accordion title="Mode streaming">
    - `partial` adalah pilihan biasa: satu posting pratinjau yang diedit saat balasan bertambah, lalu difinalisasi dengan jawaban lengkap.
    - `block` menggunakan chunk draf bergaya append di dalam posting pratinjau.
    - `progress` menampilkan pratinjau status saat menghasilkan dan hanya memposting jawaban akhir saat selesai.
    - `off` menonaktifkan streaming pratinjau.

  </Accordion>
  <Accordion title="Catatan perilaku streaming">
    - Jika stream tidak dapat difinalisasi di tempat (misalnya posting dihapus di tengah stream), OpenClaw fallback dengan mengirim posting final baru sehingga balasan tidak pernah hilang.
    - Payload hanya-pemikiran disembunyikan dari posting channel, termasuk teks yang datang sebagai blockquote `> Thinking`. Atur `/reasoning on` untuk melihat pemikiran di permukaan lain; posting final Mattermost hanya menyimpan jawaban.
    - Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan channel.

  </Accordion>
</AccordionGroup>

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah id posting Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua opsional).
- Atur `remove=true` (boolean) untuk menghapus reaksi.
- Peristiwa tambah/hapus reaksi diteruskan sebagai peristiwa sistem ke sesi agen yang dirutekan.

Contoh:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan aksi reaksi (default true).
- Override per-akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (alat pesan)

Kirim pesan dengan tombol yang dapat diklik. Saat pengguna mengklik tombol, agen menerima pilihan dan dapat merespons.

Balasan agen normal juga dapat menyertakan payload `presentation` semantik. OpenClaw merender tombol nilai sebagai tombol interaktif Mattermost, menjaga tombol URL tetap terlihat dalam teks pesan, dan menurunkan menu pilihan menjadi teks yang mudah dibaca.

Aktifkan tombol dengan menambahkan `inlineButtons` ke kemampuan kanal:

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

<ParamField path="text" type="string" required>
  Label tampilan.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Nilai yang dikirim kembali saat diklik (digunakan sebagai ID tindakan).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Gaya tombol.
</ParamField>

Saat pengguna mengeklik tombol:

<Steps>
  <Step title="Buttons replaced with confirmation">
    Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Yes** dipilih oleh @user").
  </Step>
  <Step title="Agent receives the selection">
    Agen menerima pilihan sebagai pesan masuk dan merespons.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak perlu konfigurasi).
    - Mattermost menghapus data callback dari respons API-nya (fitur keamanan), sehingga semua tombol dihapus saat diklik - penghapusan sebagian tidak mungkin.
    - ID tindakan yang berisi tanda hubung atau garis bawah disanitasi secara otomatis (batasan routing Mattermost).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: array string kemampuan. Tambahkan `"inlineButtons"` untuk mengaktifkan deskripsi alat tombol dalam prompt sistem agen.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback tombol (misalnya `https://gateway.example.com`). Gunakan ini saat Mattermost tidak dapat menjangkau Gateway secara langsung di host bind-nya.
    - Dalam penyiapan multi-akun, Anda juga dapat menetapkan field yang sama di bawah `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw menurunkan URL callback dari `gateway.customBindHost` + `gateway.port`, lalu fallback ke `http://localhost:<port>`.
    - Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost. `localhost` hanya berfungsi saat Mattermost dan OpenClaw berjalan pada host/namespace jaringan yang sama.
    - Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan Webhook dapat memposting tombol secara langsung melalui Mattermost REST API alih-alih melalui alat `message` agen. Gunakan `buildButtonAttachments()` dari Plugin bila memungkinkan; jika memposting JSON mentah, ikuti aturan berikut:

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
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Aturan penting**

1. Lampiran berada di `props.attachments`, bukan `attachments` tingkat atas (diabaikan secara diam-diam).
2. Setiap tindakan memerlukan `type: "button"` - tanpanya, klik ditelan secara diam-diam.
3. Setiap tindakan memerlukan field `id` - Mattermost mengabaikan tindakan tanpa ID.
4. `id` tindakan harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak routing tindakan sisi server Mattermost (mengembalikan 404). Hapus sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol agar pesan konfirmasi menampilkan nama tombol (misalnya, "Approve") alih-alih ID mentah.
6. `context.action_id` wajib ada - handler interaksi mengembalikan 400 tanpanya.

</Warning>

**Pembuatan token HMAC**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token yang cocok dengan logika verifikasi Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    Buat objek konteks dengan semua field **kecuali** `_token`.
  </Step>
  <Step title="Serialize with sorted keys">
    Serialkan dengan **kunci yang diurutkan** dan **tanpa spasi** (Gateway menggunakan `JSON.stringify` dengan kunci yang diurutkan, yang menghasilkan output ringkas).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    Tambahkan digest hex yang dihasilkan sebagai `_token` dalam konteks.
  </Step>
</Steps>

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

<AccordionGroup>
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan `separators=(",", ":")` agar cocok dengan output ringkas JavaScript (`{"key":"val"}`).
    - Selalu tanda tangani **semua** field konteks (minus `_token`). Gateway menghapus `_token` lalu menandatangani semua yang tersisa. Menandatangani subset menyebabkan kegagalan verifikasi diam-diam.
    - Gunakan `sort_keys=True` - Gateway mengurutkan kunci sebelum menandatangani, dan Mattermost dapat mengurutkan ulang field konteks saat menyimpan payload.
    - Turunkan rahasia dari token bot (deterministik), bukan byte acak. Rahasia harus sama antara proses yang membuat tombol dan Gateway yang memverifikasi.

  </Accordion>
</AccordionGroup>

## Adapter direktori

Plugin Mattermost menyertakan adapter direktori yang menyelesaikan nama kanal dan pengguna melalui Mattermost API. Ini mengaktifkan target `#channel-name` dan `@username` dalam pengiriman `openclaw message send` dan Cron/Webhook.

Tidak perlu konfigurasi - adapter menggunakan token bot dari konfigurasi akun.

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

<AccordionGroup>
  <Accordion title="No replies in channels">
    Pastikan bot berada di kanal dan sebut bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau tetapkan `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Periksa token bot, URL dasar, dan apakah akun diaktifkan.
    - Masalah multi-akun: env var hanya berlaku untuk akun `default`.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw tidak menerima token callback. Penyebab umum:
      - pendaftaran slash command gagal atau hanya selesai sebagian saat startup
      - callback mengenai Gateway/akun yang salah
      - Mattermost masih memiliki perintah lama yang mengarah ke target callback sebelumnya
      - Gateway dimulai ulang tanpa mengaktifkan kembali slash command
    - Jika slash command native berhenti berfungsi, periksa log untuk `mattermost: failed to register slash commands` atau `mattermost: native slash commands enabled but no commands could be registered`.
    - Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa callback diselesaikan ke `http://127.0.0.1:18789/...`, URL itu mungkin hanya dapat dijangkau saat Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw. Tetapkan `commands.callbackUrl` eksplisit yang dapat dijangkau secara eksternal sebagai gantinya.

  </Accordion>
  <Accordion title="Buttons issues">
    - Tombol muncul sebagai kotak putih: agen mungkin mengirim data tombol yang salah format. Periksa bahwa setiap tombol memiliki field `text` dan `callback_data`.
    - Tombol dirender tetapi klik tidak melakukan apa pun: verifikasi `AllowedUntrustedInternalConnections` dalam konfigurasi server Mattermost mencakup `127.0.0.1 localhost`, dan bahwa `EnablePostActionIntegration` bernilai `true` dalam ServiceSettings.
    - Tombol mengembalikan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router tindakan Mattermost rusak pada ID non-alfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
    - Log Gateway `invalid _token`: ketidakcocokan HMAC. Periksa bahwa Anda menandatangani semua field konteks (bukan subset), menggunakan kunci terurut, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
    - Log Gateway `missing _token in context`: field `_token` tidak ada dalam konteks tombol. Pastikan field tersebut disertakan saat membuat payload integrasi.
    - Konfirmasi menampilkan ID mentah alih-alih nama tombol: `context.action_id` tidak cocok dengan `id` tombol. Tetapkan keduanya ke nilai tersanitasi yang sama.
    - Agen tidak mengetahui tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi kanal Mattermost.

  </Accordion>
</AccordionGroup>

## Terkait

- [Routing Kanal](/id/channels/channel-routing) - routing sesi untuk pesan
- [Ringkasan Kanal](/id/channels) - semua kanal yang didukung
- [Grup](/id/channels/groups) - perilaku obrolan grup dan gating penyebutan
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Keamanan](/id/gateway/security) - model akses dan pengerasan
