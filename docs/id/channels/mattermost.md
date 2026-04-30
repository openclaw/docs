---
read_when:
    - Menyiapkan Mattermost
    - Menelusuri kesalahan perutean Mattermost
sidebarTitle: Mattermost
summary: Pengaturan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T09:34:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin bundel (token bot + peristiwa WebSocket). Saluran, grup, dan DM didukung. Mattermost adalah platform perpesanan tim yang dapat di-host sendiri; lihat situs resmi di [mattermost.com](https://mattermost.com) untuk detail produk dan unduhan.

## Plugin bundel

<Note>
Mattermost disertakan sebagai Plugin bundel dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan instalasi terpisah.
</Note>

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Mattermost, instal paket npm saat ini ketika sudah diterbitkan:

<Tabs>
  <Tab title="registry npm">
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

Jika npm melaporkan paket milik OpenClaw sebagai tidak digunakan lagi, gunakan build
OpenClaw paket saat ini atau jalur checkout lokal sampai paket npm yang lebih baru
diterbitkan.

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

<Steps>
  <Step title="Pastikan Plugin tersedia">
    Rilis OpenClaw paket saat ini sudah membundelnya. Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
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

Perintah slash native bersifat opsional. Saat diaktifkan, OpenClaw mendaftarkan perintah slash `oc_*` melalui API Mattermost dan menerima POST callback di server HTTP Gateway.

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
    - `native: "auto"` secara default dinonaktifkan untuk Mattermost. Tetapkan `native: true` untuk mengaktifkan.
    - Jika `callbackUrl` dihilangkan, OpenClaw menurunkannya dari host/port Gateway + `callbackPath`.
    - Untuk penyiapan multi-akun, `commands` dapat ditetapkan di tingkat atas atau di bawah `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa bidang tingkat atas).
    - Callback perintah divalidasi dengan token per-perintah yang dikembalikan oleh Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
    - Callback slash gagal tertutup saat pendaftaran gagal, startup parsial, atau token callback tidak cocok dengan salah satu perintah yang terdaftar.

  </Accordion>
  <Accordion title="Persyaratan keterjangkauan">
    Endpoint callback harus dapat dijangkau dari server Mattermost.

    - Jangan tetapkan `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw.
    - Jangan tetapkan `callbackUrl` ke URL dasar Mattermost Anda kecuali URL tersebut melakukan reverse-proxy `/api/channels/mattermost/command` ke OpenClaw.
    - Pemeriksaan cepat adalah `curl https://<gateway-host>/api/channels/mattermost/command`; GET seharusnya mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.

  </Accordion>
  <Accordion title="Allowlist egress Mattermost">
    Jika callback Anda menargetkan alamat privat/tailnet/internal, tetapkan `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost agar menyertakan host/domain callback.

    Gunakan entri host/domain, bukan URL lengkap.

    - Baik: `gateway.tailnet-name.ts.net`
    - Buruk: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabel lingkungan (akun default)

Tetapkan ini pada host Gateway jika Anda lebih memilih env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env vars hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

`MATTERMOST_URL` tidak dapat ditetapkan dari `.env` workspace; lihat [File `.env` workspace](/id/gateway/security).
</Note>

## Mode chat

Mattermost merespons DM secara otomatis. Perilaku saluran dikendalikan oleh `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Respons hanya ketika disebut dengan @ di saluran.
  </Tab>
  <Tab title="onmessage">
    Respons setiap pesan saluran.
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
- `channels.mattermost.requireMention` dihormati untuk konfigurasi lama, tetapi `chatmode` lebih disarankan.

## Thread dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan saluran dan grup tetap berada di saluran utama atau memulai thread di bawah posting pemicu.

- `off` (default): hanya balas di thread ketika posting masuk sudah berada di dalam thread.
- `first`: untuk posting saluran/grup tingkat atas, mulai thread di bawah posting tersebut dan rutekan percakapan ke sesi bercakupan thread.
- `all`: perilaku yang sama dengan `first` untuk Mattermost saat ini.
- Pesan langsung mengabaikan pengaturan ini dan tetap tidak menggunakan thread.

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

- Sesi bercakupan thread menggunakan id posting pemicu sebagai root thread.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki root thread, potongan lanjutan dan media berlanjut di thread yang sama.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim tidak dikenal mendapatkan kode pairing).
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` ditambah `channels.mattermost.allowFrom=["*"]`.

## Saluran (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi oleh mention).
- Allowlist pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna direkomendasikan).
- Override mention per-saluran berada di bawah `channels.mattermost.groups.<channelId>.requireMention` atau `channels.mattermost.groups["*"].requireMention` untuk default.
- Pencocokan `@username` dapat berubah dan hanya diaktifkan ketika `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Saluran terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi oleh mention).
- Catatan runtime: jika `channels.mattermost` sepenuhnya tidak ada, runtime fallback ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` ditetapkan).

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

- `channel:<id>` untuk saluran
- `user:<id>` untuk DM
- `@username` untuk DM (diselesaikan melalui API Mattermost)

<Warning>
ID buram polos (seperti `64ifufp...`) **ambigu** di Mattermost (ID pengguna vs ID saluran).

OpenClaw menyelesaikannya **pengguna terlebih dahulu**:

- Jika ID ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan menyelesaikan saluran langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID diperlakukan sebagai **ID saluran**.

Jika Anda membutuhkan perilaku deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).
</Warning>

## Retry saluran DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu menyelesaikan saluran langsung terlebih dahulu, secara default OpenClaw mencoba ulang kegagalan pembuatan saluran langsung yang bersifat sementara.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyetel perilaku itu secara global bagi Plugin Mattermost, atau `channels.mattermost.accounts.<id>.dmChannelRetry` untuk satu akun.

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

- Ini hanya berlaku untuk pembuatan saluran DM (`/api/v4/channels/direct`), bukan setiap panggilan API Mattermost.
- Retry berlaku untuk kegagalan sementara seperti batas laju, respons 5xx, serta kesalahan jaringan atau timeout.
- Kesalahan klien 4xx selain `429` diperlakukan sebagai permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost melakukan streaming pemikiran, aktivitas alat, dan teks balasan parsial ke dalam satu **posting pratinjau draf** yang difinalisasi di tempat saat jawaban akhir aman untuk dikirim. Pratinjau diperbarui pada id posting yang sama alih-alih membanjiri saluran dengan pesan per-potongan. Final media/kesalahan membatalkan edit pratinjau yang tertunda dan menggunakan pengiriman normal alih-alih membilas posting pratinjau sekali pakai.

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
    - `partial` adalah pilihan umum: satu posting pratinjau yang diedit saat balasan bertambah, lalu difinalisasi dengan jawaban lengkap.
    - `block` menggunakan potongan draf bergaya append di dalam posting pratinjau.
    - `progress` menampilkan pratinjau status saat menghasilkan dan hanya memposting jawaban akhir saat selesai.
    - `off` menonaktifkan streaming pratinjau.

  </Accordion>
  <Accordion title="Catatan perilaku streaming">
    - Jika stream tidak dapat difinalisasi di tempat (misalnya posting dihapus di tengah stream), OpenClaw fallback dengan mengirim posting final baru agar balasan tidak pernah hilang.
    - Payload khusus penalaran disembunyikan dari posting saluran, termasuk teks yang tiba sebagai blockquote `> Reasoning:`. Tetapkan `/reasoning on` untuk melihat pemikiran di permukaan lain; posting final Mattermost hanya mempertahankan jawaban.
    - Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan saluran.

  </Accordion>
</AccordionGroup>

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah id posting Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua opsional).
- Tetapkan `remove=true` (boolean) untuk menghapus reaksi.
- Peristiwa tambah/hapus reaksi diteruskan sebagai peristiwa sistem ke sesi agen yang dirutekan.

Contoh:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan tindakan reaksi (default true).
- Override per-akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (alat pesan)

Kirim pesan dengan tombol yang dapat diklik. Saat pengguna mengklik tombol, agen menerima pilihan dan dapat merespons.

Aktifkan tombol dengan menambahkan `inlineButtons` ke kapabilitas saluran:

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

Bidang tombol:

<ParamField path="text" type="string" required>
  Label tampilan.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Nilai yang dikirim kembali saat diklik (digunakan sebagai ID tindakan).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Gaya tombol.
</ParamField>

Saat pengguna mengklik tombol:

<Steps>
  <Step title="Tombol diganti dengan konfirmasi">
    Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Ya** dipilih oleh @user").
  </Step>
  <Step title="Agent menerima pilihan">
    Agent menerima pilihan sebagai pesan masuk dan merespons.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan implementasi">
    - Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak perlu konfigurasi).
    - Mattermost menghapus data callback dari respons API-nya (fitur keamanan), sehingga semua tombol dihapus saat diklik — penghapusan sebagian tidak memungkinkan.
    - ID tindakan yang berisi tanda hubung atau garis bawah disanitasi secara otomatis (batasan perutean Mattermost).

  </Accordion>
  <Accordion title="Konfigurasi dan keterjangkauan">
    - `channels.mattermost.capabilities`: array string kapabilitas. Tambahkan `"inlineButtons"` untuk mengaktifkan deskripsi tool tombol di prompt sistem agent.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback tombol (misalnya `https://gateway.example.com`). Gunakan ini ketika Mattermost tidak dapat menjangkau Gateway secara langsung di host bind-nya.
    - Dalam penyiapan multi-akun, Anda juga dapat mengatur field yang sama di bawah `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw menurunkan URL callback dari `gateway.customBindHost` + `gateway.port`, lalu fallback ke `http://localhost:<port>`.
    - Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost. `localhost` hanya berfungsi ketika Mattermost dan OpenClaw berjalan pada host/namespace jaringan yang sama.
    - Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan webhook dapat memposting tombol langsung melalui Mattermost REST API alih-alih melalui tool `message` milik agent. Gunakan `buildButtonAttachments()` dari Plugin bila memungkinkan; jika memposting JSON mentah, ikuti aturan ini:

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
            id: "mybutton01", // alphanumeric only — see below
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

1. Lampiran masuk ke `props.attachments`, bukan `attachments` tingkat atas (diabaikan secara diam-diam).
2. Setiap tindakan memerlukan `type: "button"` — tanpanya, klik ditelan diam-diam.
3. Setiap tindakan memerlukan field `id` — Mattermost mengabaikan tindakan tanpa ID.
4. `id` tindakan harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak perutean tindakan sisi server Mattermost (mengembalikan 404). Hapus sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol agar pesan konfirmasi menampilkan nama tombol (misalnya, "Approve") alih-alih ID mentah.
6. `context.action_id` wajib ada — handler interaksi mengembalikan 400 tanpanya.

</Warning>

**Pembuatan token HMAC**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token yang cocok dengan logika verifikasi Gateway:

<Steps>
  <Step title="Turunkan secret dari token bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Bangun objek konteks">
    Bangun objek konteks dengan semua field **kecuali** `_token`.
  </Step>
  <Step title="Serialisasikan dengan key terurut">
    Serialisasikan dengan **key terurut** dan **tanpa spasi** (Gateway menggunakan `JSON.stringify` dengan key terurut, yang menghasilkan output ringkas).
  </Step>
  <Step title="Tandatangani payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Tambahkan token">
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
  <Accordion title="Kesalahan umum HMAC">
    - `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan `separators=(",", ":")` agar cocok dengan output ringkas JavaScript (`{"key":"val"}`).
    - Selalu tandatangani **semua** field konteks (dikurangi `_token`). Gateway menghapus `_token` lalu menandatangani semua yang tersisa. Menandatangani subset menyebabkan kegagalan verifikasi diam-diam.
    - Gunakan `sort_keys=True` — Gateway mengurutkan key sebelum menandatangani, dan Mattermost dapat mengurutkan ulang field konteks saat menyimpan payload.
    - Turunkan secret dari token bot (deterministik), bukan byte acak. Secret harus sama antara proses yang membuat tombol dan Gateway yang memverifikasi.

  </Accordion>
</AccordionGroup>

## Adapter direktori

Plugin Mattermost menyertakan adapter direktori yang menyelesaikan nama channel dan pengguna melalui Mattermost API. Ini mengaktifkan target `#channel-name` dan `@username` dalam `openclaw message send` serta pengiriman cron/webhook.

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

<AccordionGroup>
  <Accordion title="Tidak ada balasan di channel">
    Pastikan bot berada di channel dan sebutkan namanya (oncall), gunakan awalan pemicu (onchar), atau atur `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Kesalahan auth atau multi-akun">
    - Periksa token bot, URL dasar, dan apakah akun diaktifkan.
    - Masalah multi-akun: env var hanya berlaku untuk akun `default`.

  </Accordion>
  <Accordion title="Perintah slash native gagal">
    - `Unauthorized: invalid command token.`: OpenClaw tidak menerima token callback. Penyebab umum:
      - pendaftaran perintah slash gagal atau hanya selesai sebagian saat startup
      - callback mengenai Gateway/akun yang salah
      - Mattermost masih memiliki perintah lama yang mengarah ke target callback sebelumnya
      - Gateway dimulai ulang tanpa mengaktifkan ulang perintah slash
    - Jika perintah slash native berhenti berfungsi, periksa log untuk `mattermost: failed to register slash commands` atau `mattermost: native slash commands enabled but no commands could be registered`.
    - Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa callback terselesaikan ke `http://127.0.0.1:18789/...`, URL itu kemungkinan hanya dapat dijangkau ketika Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw. Atur `commands.callbackUrl` eksplisit yang dapat dijangkau secara eksternal sebagai gantinya.

  </Accordion>
  <Accordion title="Masalah tombol">
    - Tombol muncul sebagai kotak putih: agent mungkin mengirim data tombol yang tidak valid. Periksa bahwa setiap tombol memiliki field `text` dan `callback_data`.
    - Tombol dirender tetapi klik tidak melakukan apa pun: verifikasi `AllowedUntrustedInternalConnections` dalam konfigurasi server Mattermost menyertakan `127.0.0.1 localhost`, dan bahwa `EnablePostActionIntegration` adalah `true` dalam ServiceSettings.
    - Tombol mengembalikan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router tindakan Mattermost rusak pada ID non-alfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
    - Log Gateway `invalid _token`: ketidakcocokan HMAC. Periksa bahwa Anda menandatangani semua field konteks (bukan subset), menggunakan key terurut, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
    - Log Gateway `missing _token in context`: field `_token` tidak ada dalam konteks tombol. Pastikan field itu disertakan saat membangun payload integrasi.
    - Konfirmasi menampilkan ID mentah alih-alih nama tombol: `context.action_id` tidak cocok dengan `id` tombol. Atur keduanya ke nilai tersanitasi yang sama.
    - Agent tidak tahu tentang tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi channel Mattermost.

  </Accordion>
</AccordionGroup>

## Terkait

- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating sebutan
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Keamanan](/id/gateway/security) — model akses dan hardening
