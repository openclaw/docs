---
read_when:
    - Menyiapkan Mattermost
    - Men-debug perutean Mattermost
sidebarTitle: Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Status: Plugin bawaan (token bot + event WebSocket). Saluran, grup, dan DM didukung. Mattermost adalah platform pesan tim yang dapat di-host sendiri; lihat situs resminya di [mattermost.com](https://mattermost.com) untuk detail produk dan unduhan.

## Plugin bawaan

<Note>
Mattermost tersedia sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan instalasi terpisah.
</Note>

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Mattermost, instal secara manual:

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

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

<Steps>
  <Step title="Pastikan Plugin tersedia">
    Rilis OpenClaw paket saat ini sudah menyertakannya. Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
  </Step>
  <Step title="Buat bot Mattermost">
    Buat akun bot Mattermost dan salin **token bot**.
  </Step>
  <Step title="Salin base URL">
    Salin **base URL** Mattermost (mis. `https://chat.example.com`).
  </Step>
  <Step title="Konfigurasikan OpenClaw dan mulai Gateway">
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

## Slash command native

Slash command native bersifat opt-in. Saat diaktifkan, OpenClaw mendaftarkan slash command `oc_*` melalui API Mattermost dan menerima callback POST pada server HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gunakan saat Mattermost tidak dapat menjangkau Gateway secara langsung (reverse proxy/URL publik).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Catatan perilaku">
    - `native: "auto"` default-nya nonaktif untuk Mattermost. Tetapkan `native: true` untuk mengaktifkannya.
    - Jika `callbackUrl` dihilangkan, OpenClaw menurunkannya dari host/port Gateway + `callbackPath`.
    - Untuk penyiapan multi-akun, `commands` dapat ditetapkan pada level atas atau di bawah `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa field level atas).
    - Callback command divalidasi dengan token per-command yang dikembalikan Mattermost saat OpenClaw mendaftarkan command `oc_*`.
    - Callback slash gagal secara tertutup saat pendaftaran gagal, startup hanya sebagian, atau token callback tidak cocok dengan salah satu command yang terdaftar.
  </Accordion>
  <Accordion title="Persyaratan keterjangkauan">
    Endpoint callback harus dapat dijangkau dari server Mattermost.

    - Jangan tetapkan `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/network namespace yang sama dengan OpenClaw.
    - Jangan tetapkan `callbackUrl` ke base URL Mattermost Anda kecuali URL tersebut melakukan reverse-proxy `/api/channels/mattermost/command` ke OpenClaw.
    - Pemeriksaan cepatnya adalah `curl https://<gateway-host>/api/channels/mattermost/command`; permintaan GET harus mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.

  </Accordion>
  <Accordion title="Allowlist egress Mattermost">
    Jika callback Anda menargetkan alamat privat/tailnet/internal, tetapkan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` agar menyertakan host/domain callback.

    Gunakan entri host/domain, bukan URL lengkap.

    - Baik: `gateway.tailnet-name.ts.net`
    - Buruk: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabel lingkungan (akun default)

Tetapkan ini pada host Gateway jika Anda lebih suka menggunakan variabel lingkungan:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Variabel lingkungan hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

`MATTERMOST_URL` tidak dapat ditetapkan dari workspace `.env`; lihat [File `.env` workspace](/id/gateway/security).
</Note>

## Mode obrolan

Mattermost merespons DM secara otomatis. Perilaku saluran dikendalikan oleh `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Hanya merespons saat di-@mention di saluran.
  </Tab>
  <Tab title="onmessage">
    Merespons setiap pesan saluran.
  </Tab>
  <Tab title="onchar">
    Merespons saat pesan dimulai dengan prefiks pemicu.
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
- `channels.mattermost.requireMention` tetap dihormati untuk konfigurasi lama, tetapi `chatmode` lebih disarankan.

## Threading dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan saluran dan grup tetap berada di saluran utama atau memulai thread di bawah post pemicu.

- `off` (default): hanya membalas dalam thread saat post masuk memang sudah berada di dalam thread.
- `first`: untuk post saluran/grup level atas, mulai thread di bawah post tersebut dan arahkan percakapan ke sesi dengan cakupan thread.
- `all`: perilakunya sama seperti `first` untuk Mattermost saat ini.
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

- Sesi dengan cakupan thread menggunakan id post pemicu sebagai root thread.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki root thread, potongan lanjutan dan media tetap berlanjut dalam thread yang sama.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim tidak dikenal mendapatkan kode pairing).
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` ditambah `channels.mattermost.allowFrom=["*"]`.

## Saluran (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dikendalikan mention).
- Allowlist pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna direkomendasikan).
- Override mention per-saluran ada di bawah `channels.mattermost.groups.<channelId>.requireMention` atau `channels.mattermost.groups["*"].requireMention` sebagai default.
- Pencocokan `@username` bersifat dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Saluran terbuka: `channels.mattermost.groupPolicy="open"` (dikendalikan mention).
- Catatan runtime: jika `channels.mattermost` sepenuhnya tidak ada, runtime akan fallback ke `groupPolicy="allowlist"` untuk pemeriksaan grup (bahkan jika `channels.defaults.groupPolicy` ditetapkan).

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

Gunakan format target ini dengan `openclaw message send` atau cron/Webhook:

- `channel:<id>` untuk saluran
- `user:<id>` untuk DM
- `@username` untuk DM (di-resolve melalui API Mattermost)

<Warning>
ID opak telanjang (seperti `64ifufp...`) **ambigu** di Mattermost (ID pengguna vs ID saluran).

OpenClaw me-resolve-nya **user-first**:

- Jika ID ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan me-resolve saluran langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID diperlakukan sebagai **ID saluran**.

Jika Anda membutuhkan perilaku yang deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).
</Warning>

## Percobaan ulang saluran DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu me-resolve saluran langsung terlebih dahulu, secara default OpenClaw mencoba ulang kegagalan pembuatan saluran langsung yang bersifat sementara.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyesuaikan perilaku itu secara global untuk Plugin Mattermost, atau `channels.mattermost.accounts.<id>.dmChannelRetry` untuk satu akun.

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
- Percobaan ulang berlaku untuk kegagalan sementara seperti rate limit, respons 5xx, serta error jaringan atau timeout.
- Error klien 4xx selain `429` diperlakukan sebagai permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost melakukan streaming pemikiran, aktivitas tool, dan teks balasan parsial ke dalam satu **post pratinjau draf** yang diselesaikan di tempat saat jawaban akhir aman untuk dikirim. Pratinjau diperbarui pada id post yang sama alih-alih membanjiri saluran dengan pesan per-potongan. Final media/error membatalkan edit pratinjau yang tertunda dan menggunakan pengiriman normal alih-alih mengosongkan post pratinjau sekali pakai.

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
    - `partial` adalah pilihan yang umum: satu post pratinjau yang diedit saat balasan bertambah, lalu diselesaikan dengan jawaban lengkap.
    - `block` menggunakan potongan draf bergaya append di dalam post pratinjau.
    - `progress` menampilkan pratinjau status saat menghasilkan dan hanya mem-posting jawaban akhir saat selesai.
    - `off` menonaktifkan streaming pratinjau.
  </Accordion>
  <Accordion title="Catatan perilaku streaming">
    - Jika stream tidak dapat diselesaikan di tempat (misalnya post dihapus di tengah stream), OpenClaw akan fallback dengan mengirim post final baru agar balasan tidak pernah hilang.
    - Payload yang hanya berisi reasoning disembunyikan dari post saluran, termasuk teks yang datang sebagai blockquote `> Reasoning:`. Tetapkan `/reasoning on` untuk melihat pemikiran di surface lain; post final Mattermost hanya menyimpan jawabannya.
    - Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan saluran.
  </Accordion>
</AccordionGroup>

## Reaksi (tool pesan)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah id post Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua opsional).
- Tetapkan `remove=true` (boolean) untuk menghapus reaksi.
- Event penambahan/penghapusan reaksi diteruskan sebagai event sistem ke sesi agen yang dirutekan.

Contoh:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan aksi reaksi (default true).
- Override per-akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (tool pesan)

Kirim pesan dengan tombol yang dapat diklik. Saat pengguna mengklik tombol, agen menerima pilihan tersebut dan dapat merespons.

Aktifkan tombol dengan menambahkan `inlineButtons` ke kemampuan saluran:

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
  Nilai yang dikirim balik saat diklik (digunakan sebagai ID aksi).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Gaya tombol.
</ParamField>

Saat pengguna mengklik tombol:

<Steps>
  <Step title="Tombol diganti dengan konfirmasi">
    Semua tombol diganti dengan baris konfirmasi (mis. "✓ **Ya** dipilih oleh @user").
  </Step>
  <Step title="Agen menerima pilihan">
    Agen menerima pilihan tersebut sebagai pesan masuk dan merespons.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan implementasi">
    - Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak perlu konfigurasi).
    - Mattermost menghapus data callback dari respons API-nya (fitur keamanan), sehingga semua tombol dihapus saat diklik — penghapusan sebagian tidak dimungkinkan.
    - ID aksi yang berisi tanda hubung atau garis bawah dibersihkan secara otomatis (keterbatasan perutean Mattermost).
  </Accordion>
  <Accordion title="Konfigurasi dan keterjangkauan">
    - `channels.mattermost.capabilities`: array string kemampuan. Tambahkan `"inlineButtons"` untuk mengaktifkan deskripsi tool tombol dalam prompt sistem agen.
    - `channels.mattermost.interactions.callbackBaseUrl`: base URL eksternal opsional untuk callback tombol (misalnya `https://gateway.example.com`). Gunakan ini saat Mattermost tidak dapat menjangkau Gateway secara langsung pada bind host-nya.
    - Dalam penyiapan multi-akun, Anda juga dapat menetapkan field yang sama di bawah `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw menurunkan URL callback dari `gateway.customBindHost` + `gateway.port`, lalu fallback ke `http://localhost:<port>`.
    - Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost. `localhost` hanya berfungsi saat Mattermost dan OpenClaw berjalan pada host/network namespace yang sama.
    - Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.
  </Accordion>
</AccordionGroup>

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan Webhook dapat mem-posting tombol secara langsung melalui REST API Mattermost alih-alih melalui tool `message` milik agen. Gunakan `buildButtonAttachments()` dari Plugin jika memungkinkan; jika mem-posting JSON mentah, ikuti aturan berikut:

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

<Warning>
**Aturan penting**

1. Lampiran diletakkan di `props.attachments`, bukan `attachments` level atas (jika tidak, akan diabaikan secara diam-diam).
2. Setiap aksi memerlukan `type: "button"` — tanpa itu, klik akan ditelan secara diam-diam.
3. Setiap aksi memerlukan field `id` — Mattermost mengabaikan aksi tanpa ID.
4. `id` aksi harus **alfanumerik saja** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak perutean aksi sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol agar pesan konfirmasi menampilkan nama tombol (mis. "Approve"), bukan ID mentah.
6. `context.action_id` wajib — pengendali interaksi mengembalikan 400 tanpa field ini.
   </Warning>

**Pembuatan token HMAC**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token yang cocok dengan logika verifikasi Gateway:

<Steps>
  <Step title="Turunkan secret dari token bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Bangun objek context">
    Bangun objek context dengan semua field **kecuali** `_token`.
  </Step>
  <Step title="Serialisasi dengan key yang diurutkan">
    Serialisasikan dengan **key yang diurutkan** dan **tanpa spasi** (Gateway menggunakan `JSON.stringify` dengan key yang diurutkan, yang menghasilkan output ringkas).
  </Step>
  <Step title="Tandatangani payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Tambahkan token">
    Tambahkan hasil hex digest sebagai `_token` dalam context.
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
  <Accordion title="Masalah umum HMAC">
    - `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan `separators=(",", ":")` agar cocok dengan output JavaScript yang ringkas (`{"key":"val"}`).
    - Selalu tandatangani **semua** field context (kecuali `_token`). Gateway menghapus `_token` lalu menandatangani semua yang tersisa. Menandatangani hanya sebagian akan menyebabkan kegagalan verifikasi secara diam-diam.
    - Gunakan `sort_keys=True` — Gateway mengurutkan key sebelum menandatangani, dan Mattermost dapat mengubah urutan field context saat menyimpan payload.
    - Turunkan secret dari token bot (deterministik), bukan byte acak. Secret harus sama di seluruh proses yang membuat tombol dan Gateway yang memverifikasi.
  </Accordion>
</AccordionGroup>

## Adapter direktori

Plugin Mattermost menyertakan adapter direktori yang me-resolve nama saluran dan pengguna melalui API Mattermost. Ini memungkinkan target `#channel-name` dan `@username` di `openclaw message send` serta pengiriman cron/Webhook.

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
  <Accordion title="Tidak ada balasan di saluran">
    Pastikan bot ada di saluran dan sebut bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau tetapkan `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Error autentikasi atau multi-akun">
    - Periksa token bot, base URL, dan apakah akun diaktifkan.
    - Masalah multi-akun: variabel lingkungan hanya berlaku untuk akun `default`.
  </Accordion>
  <Accordion title="Slash command native gagal">
    - `Unauthorized: invalid command token.`: OpenClaw tidak menerima token callback. Penyebab umumnya:
      - pendaftaran slash command gagal atau hanya selesai sebagian saat startup
      - callback menuju Gateway/akun yang salah
      - Mattermost masih memiliki command lama yang menunjuk ke target callback sebelumnya
      - Gateway dimulai ulang tanpa mengaktifkan ulang slash command
    - Jika slash command native berhenti berfungsi, periksa log untuk `mattermost: failed to register slash commands` atau `mattermost: native slash commands enabled but no commands could be registered`.
    - Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa callback di-resolve ke `http://127.0.0.1:18789/...`, URL tersebut kemungkinan hanya dapat dijangkau saat Mattermost berjalan pada host/network namespace yang sama dengan OpenClaw. Sebagai gantinya, tetapkan `commands.callbackUrl` eksplisit yang dapat dijangkau dari luar.
  </Accordion>
  <Accordion title="Masalah tombol">
    - Tombol muncul sebagai kotak putih: agen mungkin mengirim data tombol yang salah format. Periksa bahwa setiap tombol memiliki field `text` dan `callback_data`.
    - Tombol dirender tetapi klik tidak melakukan apa-apa: verifikasi bahwa `AllowedUntrustedInternalConnections` dalam konfigurasi server Mattermost mencakup `127.0.0.1 localhost`, dan bahwa `EnablePostActionIntegration` bernilai `true` dalam ServiceSettings.
    - Tombol mengembalikan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router aksi Mattermost rusak pada ID non-alfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
    - Log Gateway `invalid _token`: HMAC tidak cocok. Periksa bahwa Anda menandatangani semua field context (bukan hanya sebagian), menggunakan key yang diurutkan, dan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
    - Log Gateway `missing _token in context`: field `_token` tidak ada dalam context tombol. Pastikan field itu disertakan saat membangun payload integration.
    - Konfirmasi menampilkan ID mentah, bukan nama tombol: `context.action_id` tidak cocok dengan `id` tombol. Tetapkan keduanya ke nilai yang sama dan sudah dibersihkan.
    - Agen tidak mengetahui tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi saluran Mattermost.
  </Accordion>
</AccordionGroup>

## Terkait

- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Ringkasan Saluran](/id/channels) — semua saluran yang didukung
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Keamanan](/id/gateway/security) — model akses dan hardening
