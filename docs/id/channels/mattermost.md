---
read_when:
    - Menyiapkan Mattermost
    - Men-debug perutean Mattermost
sidebarTitle: Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T14:00:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Status: plugin yang dapat diunduh (token bot + peristiwa WebSocket). Kanal, kanal privat, DM grup, dan DM didukung. Mattermost adalah platform perpesanan tim yang dapat dihosting sendiri ([mattermost.com](https://mattermost.com)).

## Instalasi

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
  <Step title="Pastikan plugin tersedia">
    Instal `@openclaw/mattermost` dengan perintah di atas, lalu mulai ulang Gateway jika sudah berjalan.
  </Step>
  <Step title="Buat bot Mattermost">
    Buat akun bot Mattermost, salin **token bot**, dan tambahkan bot ke tim dan kanal yang perlu dibacanya.
  </Step>
  <Step title="Salin URL dasar">
    Salin **URL dasar** Mattermost (misalnya, `https://chat.example.com`). Akhiran `/api/v4` akan dihapus secara otomatis.
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

    Alternatif noninteraktif:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost yang dihosting sendiri pada alamat privat/LAN/tailnet: permintaan API Mattermost keluar melewati perlindungan SSRF yang secara default memblokir IP privat dan internal. Aktifkan dengan `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (per akun: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Perintah garis miring native

Perintah garis miring native bersifat opsional. Saat diaktifkan, OpenClaw mendaftarkan perintah garis miring `oc_*` pada setiap tim tempat bot menjadi anggota dan menerima POST panggilan balik di server HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gunakan saat Mattermost tidak dapat menjangkau gateway secara langsung (proksi balik/URL publik).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Perintah yang didaftarkan: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Dengan `nativeSkills: true`, perintah skill juga didaftarkan sebagai `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Catatan perilaku">
    - `native` dan `nativeSkills` secara default bernilai `"auto"`, yang berarti dinonaktifkan untuk Mattermost. Tetapkan secara eksplisit ke `true`.
    - `callbackPath` secara default bernilai `/api/channels/mattermost/command`.
    - Jika `callbackUrl` tidak dicantumkan, OpenClaw menurunkan `http://<gateway.customBindHost atau localhost>:<gateway.port, default 18789><callbackPath>`. Host pengikatan karakter pengganti (`0.0.0.0`, `::`) akan beralih ke `localhost`.
    - Untuk penyiapan multiakun, `commands` dapat ditetapkan di tingkat teratas atau di bawah `channels.mattermost.accounts.<id>.commands` (nilai akun mengesampingkan bidang tingkat teratas).
    - Perintah garis miring yang sudah ada dengan pemicu yang sama dan dibuat oleh integrasi lain dibiarkan tanpa perubahan (pendaftaran melewatinya); perintah yang dibuat bot diperbarui atau dibuat ulang saat URL panggilan balik berubah.
    - Panggilan balik perintah divalidasi menggunakan token per perintah yang dikembalikan Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
    - OpenClaw menyegarkan pendaftaran perintah Mattermost saat ini sebelum menerima setiap panggilan balik, sehingga token usang dari perintah garis miring yang dihapus atau dibuat ulang berhenti diterima tanpa perlu memulai ulang gateway.
    - Validasi panggilan balik gagal secara tertutup jika API Mattermost tidak dapat mengonfirmasi bahwa perintah masih berlaku; validasi yang gagal disimpan sementara dalam cache, pencarian serentak digabungkan, dan dimulainya pencarian baru dibatasi lajunya per perintah untuk membatasi tekanan pemutaran ulang.
    - Panggilan balik garis miring gagal secara tertutup saat pendaftaran gagal, proses awal hanya selesai sebagian, atau token panggilan balik tidak cocok dengan token terdaftar milik perintah yang ditemukan (token yang valid untuk satu perintah tidak dapat mencapai validasi upstream untuk perintah lain).
    - Panggilan balik yang diterima dikonfirmasi dengan balasan sementara "Memproses..."; jawaban sebenarnya tiba sebagai pesan biasa.

  </Accordion>
  <Accordion title="Persyaratan keterjangkauan">
    Titik akhir panggilan balik harus dapat dijangkau dari server Mattermost.

    - Jangan tetapkan `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw.
    - Jangan tetapkan `callbackUrl` ke URL dasar Mattermost kecuali URL tersebut memproksikan balik `/api/channels/mattermost/command` ke OpenClaw.
    - Pemeriksaan cepatnya adalah `curl https://<gateway-host>/api/channels/mattermost/command`; permintaan GET seharusnya mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.

  </Accordion>
  <Accordion title="Daftar izin lalu lintas keluar Mattermost">
    Jika panggilan balik Anda menargetkan alamat privat/tailnet/internal, atur `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost agar mencakup host/domain panggilan balik.

    Gunakan entri host/domain, bukan URL lengkap.

    - Benar: `gateway.tailnet-name.ts.net`
    - Salah: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabel lingkungan (akun default)

Tetapkan ini pada host gateway jika Anda memilih variabel lingkungan:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Variabel lingkungan hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

`MATTERMOST_URL` tidak dapat ditetapkan dari `.env` ruang kerja; lihat [File .env ruang kerja](/id/gateway/security).
</Note>

## Mode obrolan

Mattermost merespons DM secara otomatis. Perilaku kanal dikendalikan oleh `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Respons hanya saat @disebut di kanal.
  </Tab>
  <Tab title="onmessage">
    Respons terhadap setiap pesan kanal.
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
      oncharPrefixes: [">", "!"], // default
    },
  },
}
```

Catatan:

- `onchar` tetap merespons @sebutan eksplisit.
- `channels.mattermost.requireMention` tetap dipatuhi, tetapi `chatmode` lebih diutamakan. Pengaturan per kanal `groups.<channelId>.requireMention` mengesampingkan keduanya.
- Setelah bot mengirim balasan yang terlihat dalam utas kanal, pesan berikutnya dalam utas yang sama akan dijawab tanpa @sebutan baru atau prefiks `onchar`, sehingga percakapan utas multigilir terus mengalir. Partisipasi diingat selama 7 hari setelah balasan terakhir bot dalam utas tersebut dan tetap tersimpan setelah gateway dimulai ulang. Utas yang hanya diamati bot tidak terpengaruh; mulai pesan tingkat teratas baru agar sebutan eksplisit kembali diwajibkan.

## Utas dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan kanal dan grup tetap berada di kanal utama atau memulai utas di bawah kiriman pemicu.

- `off` (default): hanya balas dalam utas jika kiriman masuk sudah berada di dalam utas.
- `first`: untuk kiriman kanal/grup tingkat teratas, mulai utas di bawah kiriman tersebut dan arahkan percakapan ke sesi yang tercakup dalam utas.
- `all` dan `batched`: saat ini berperilaku sama seperti `first` untuk Mattermost karena setelah Mattermost memiliki akar utas, potongan lanjutan dan media diteruskan dalam utas yang sama.
- Pesan langsung secara default menggunakan `off` meskipun `replyToMode` ditetapkan.

Gunakan `channels.mattermost.replyToModeByChatType` untuk mengesampingkan mode bagi obrolan `direct`, `group`, atau `channel`. Tetapkan `direct` untuk mengaktifkan utas pada pesan langsung:

- `off` (default): pesan langsung tetap tanpa utas dalam satu sesi bergulir.
- `first`, `all`, atau `batched`: setiap pesan langsung tingkat teratas memulai utas Mattermost yang didukung oleh sesi baru dan independen.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Catatan:

- Sesi yang tercakup dalam utas menggunakan ID kiriman pemicu sebagai akar utas.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki akar utas, potongan lanjutan dan media diteruskan dalam utas yang sama.
- Pengesampingan per jenis obrolan lebih diutamakan daripada `replyToMode`. Tanpa pengesampingan `direct`, penerapan yang sudah ada mempertahankan DM datar tanpa utas.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim yang tidak dikenal mendapatkan kode pemasangan). Nilai lain: `allowlist`, `open`, `disabled`.
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` ditambah `channels.mattermost.allowFrom=["*"]` (skema konfigurasi mewajibkan karakter pengganti).
- `channels.mattermost.allowFrom` menerima ID pengguna (disarankan) dan entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).

## Kanal (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi berdasarkan sebutan).
- Masukkan pengirim ke daftar izin dengan `channels.mattermost.groupAllowFrom` (ID pengguna disarankan).
- `channels.mattermost.groupAllowFrom` menerima entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).
- Pengesampingan sebutan per kanal berada di bawah `channels.mattermost.groups.<channelId>.requireMention` atau `channels.mattermost.groups["*"].requireMention` untuk nilai default.
- Pencocokan `@username` dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kanal terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi berdasarkan sebutan).
- Urutan resolusi: `channels.mattermost.groupPolicy`, lalu `channels.defaults.groupPolicy`, lalu `"allowlist"`.
- Catatan runtime: jika bagian `channels.mattermost` sama sekali tidak ada, runtime gagal secara tertutup ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` ditetapkan) dan mencatat peringatan satu kali.

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

## Target pengiriman keluar

Gunakan format target berikut dengan `openclaw message send` atau cron/webhook:

| Target                              | Dikirim ke                                                               |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `channel:<id>`                      | Kanal berdasarkan ID                                                     |
| `channel:<name>` atau `#channel-name` | Kanal berdasarkan nama, dicari di seluruh tim tempat bot menjadi anggota |
| `user:<id>` atau `mattermost:<id>`    | DM dengan pengguna tersebut                                              |
| `@username`                         | DM (nama pengguna ditemukan melalui API Mattermost)                      |

Pengiriman keluar mendukung paling banyak satu lampiran per pesan; pisahkan beberapa file menjadi pengiriman terpisah.

<Warning>
ID buram tanpa prefiks (seperti `64ifufp...`) bersifat **ambigu** di Mattermost (ID pengguna atau ID kanal).

OpenClaw menyelesaikannya dengan **mendahulukan pengguna**:

- Jika ID tersebut ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan menemukan kanal langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID tersebut diperlakukan sebagai **ID kanal**.

Jika Anda memerlukan perilaku deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).
</Warning>

## Percobaan ulang kanal DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu menemukan kanal langsung terlebih dahulu, secara default OpenClaw mencoba ulang kegagalan sementara dalam pembuatan kanal langsung.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyesuaikan perilaku tersebut secara global bagi plugin Mattermost, atau `channels.mattermost.accounts.<id>.dmChannelRetry` untuk satu akun. Nilai default:

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

- Ini hanya berlaku untuk pembuatan kanal DM (`/api/v4/channels/direct`), bukan setiap panggilan API Mattermost.
- Percobaan ulang menggunakan backoff eksponensial dengan jitter dan diterapkan pada kegagalan sementara seperti pembatasan laju, respons 5xx, serta galat jaringan atau batas waktu.
- Galat klien 4xx selain `429` dianggap permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost mengalirkan proses berpikir, aktivitas alat, dan teks balasan parsial ke dalam **kiriman pratinjau draf** yang diselesaikan di tempat ketika jawaban akhir aman untuk dikirim. Dalam mode `partial`, pratinjau diperbarui pada ID kiriman yang sama, alih-alih membanjiri kanal dengan pesan untuk setiap potongan. Dalam mode `block`, pratinjau berganti antara teks yang telah selesai dan blok aktivitas alat, sehingga blok sebelumnya tetap terlihat sebagai kiriman tersendiri, bukan ditimpa oleh blok berikutnya. Hasil akhir media/galat membatalkan pengeditan pratinjau yang tertunda dan menggunakan pengiriman normal, alih-alih menyelesaikan kiriman pratinjau yang tidak terpakai.

Streaming pratinjau **aktif secara default** dalam mode `partial`. Konfigurasikan melalui `channels.mattermost.streaming` (string mode, boolean, atau objek seperti `{ mode: "progress" }`):

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
    - `partial` (default): satu kiriman pratinjau yang diedit seiring bertambahnya balasan, lalu diselesaikan dengan jawaban lengkap.
    - `block` mengganti pratinjau antara teks yang telah selesai dan blok aktivitas alat, sehingga setiap blok tetap terlihat sebagai kiriman tersendiri, bukan ditimpa di tempat. Pembaruan alat yang paralel dan berurutan berbagi kiriman aktivitas alat saat ini.
    - `progress` menampilkan pratinjau status selama pembuatan dan hanya mengirimkan jawaban akhir saat selesai.
    - `off` menonaktifkan streaming pratinjau. Dengan `blockStreaming: true`, blok asisten yang telah selesai tetap dikirim sebagai balasan blok normal (kiriman terpisah), bukan sebagai satu kiriman akhir yang digabungkan.

  </Accordion>
  <Accordion title="Catatan perilaku streaming">
    - Jika streaming tidak dapat diselesaikan di tempat (misalnya kiriman dihapus saat streaming berlangsung), OpenClaw beralih ke pengiriman kiriman akhir baru agar balasan tidak pernah hilang.
    - Muatan yang hanya berisi proses berpikir tidak ditampilkan dalam kiriman kanal, termasuk teks yang tiba sebagai kutipan blok `> Thinking`. Atur `/reasoning on` untuk melihat proses berpikir di permukaan lain; kiriman akhir Mattermost hanya memuat jawaban.
    - Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan kanal.

  </Accordion>
</AccordionGroup>

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah ID kiriman Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua bersifat opsional).
- Atur `remove=true` (boolean) untuk menghapus reaksi.
- Peristiwa penambahan/penghapusan reaksi diteruskan sebagai peristiwa sistem ke sesi agen yang dirutekan, dengan pemeriksaan kebijakan DM/grup yang sama seperti pesan.

Contoh:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan tindakan reaksi (default true).
- Penggantian per akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (alat pesan)

Kirim pesan dengan tombol yang dapat diklik. Ketika pengguna mengeklik tombol, agen menerima pilihan tersebut dan dapat merespons.

Tombol berasal dari muatan semantik `presentation` (dalam balasan agen normal dan dalam `message action=send`). OpenClaw merender tombol nilai sebagai tombol interaktif Mattermost, mempertahankan tombol URL agar terlihat dalam teks pesan, dan menurunkan menu pilihan menjadi teks yang mudah dibaca.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Bidang tombol presentasi:

<ParamField path="label" type="string" required>
  Label tampilan (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Nilai yang dikirim kembali saat diklik, digunakan sebagai ID tindakan (alias: `callback_data`, `callbackData`). Wajib untuk tombol yang dapat diklik, kecuali jika `url` ditetapkan.
</ParamField>
<ParamField path="url" type="string">
  Tombol tautan; dirender sebagai teks `label: url` dalam isi pesan, bukan sebagai tombol interaktif.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Gaya tombol. Mattermost menerapkan gaya default pada nilai yang tidak didukungnya.
</ParamField>

Untuk mengiklankan dukungan tombol dalam prompt sistem agen, tambahkan `inlineButtons` ke kapabilitas kanal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Ketika pengguna mengeklik tombol:

<Steps>
  <Step title="Pemeriksaan akses">
    Pengeklik harus lolos pemeriksaan kebijakan DM/grup yang sama seperti pengirim pesan; klik tanpa otorisasi menerima pemberitahuan sementara dan diabaikan.
  </Step>
  <Step title="Tombol diganti dengan konfirmasi">
    Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Yes** dipilih oleh @user").
  </Step>
  <Step title="Agen menerima pilihan">
    Agen menerima pilihan sebagai pesan masuk (beserta peristiwa sistem) dan merespons.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan implementasi">
    - Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak memerlukan konfigurasi).
    - Seluruh blok lampiran diganti saat diklik, sehingga semua tombol dihapus bersama-sama—penghapusan parsial tidak dimungkinkan.
    - ID tindakan yang mengandung tanda hubung atau garis bawah disanitasi secara otomatis (keterbatasan perutean Mattermost).
    - Klik dengan `action_id` yang tidak cocok dengan tindakan pada kiriman asli ditolak dengan `403` ("Unknown action").

  </Accordion>
  <Accordion title="Konfigurasi dan keterjangkauan">
    - `channels.mattermost.capabilities`: larik string kapabilitas. Tambahkan `"inlineButtons"` untuk mengaktifkan deskripsi alat tombol dalam prompt sistem agen.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback tombol (misalnya `https://gateway.example.com`). Gunakan ini ketika Mattermost tidak dapat menjangkau Gateway secara langsung pada host pengikatnya.
    - Dalam konfigurasi multiakun, Anda juga dapat menetapkan bidang yang sama di bawah `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jika `interactions.callbackBaseUrl` tidak disertakan, OpenClaw memperoleh URL callback dari `gateway.customBindHost` + `gateway.port` (default 18789), lalu beralih ke `http://localhost:<port>`. Jalur callback adalah `/mattermost/interactions/<accountId>`.
    - Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost. `localhost` hanya berfungsi ketika Mattermost dan OpenClaw berjalan pada host/namespace jaringan yang sama.
    - `channels.mattermost.interactions.allowedSourceIps`: daftar izin IP sumber untuk callback tombol. Tanpa ini, hanya sumber loopback (`127.0.0.1`, `::1`) yang diterima, sehingga server Mattermost jarak jauh harus ditambahkan ke daftar izin di sini atau kliknya akan ditolak dengan `403`. Di belakang proksi terbalik, tetapkan juga `gateway.trustedProxies` agar IP klien sebenarnya diperoleh dari header yang diteruskan.
    - Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan Webhook dapat mengirim tombol secara langsung melalui API REST Mattermost, alih-alih melalui alat `message` milik agen. Gunakan `buildButtonAttachments()` dari Plugin jika memungkinkan; jika mengirim JSON mentah, ikuti aturan berikut:

**Struktur muatan:**

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
                action_id: "mybutton01", // must match button id
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

1. Lampiran ditempatkan dalam `props.attachments`, bukan `attachments` tingkat teratas (diabaikan tanpa pemberitahuan).
2. Setiap tindakan memerlukan `type: "button"`—tanpanya, klik diabaikan tanpa pemberitahuan.
3. Setiap tindakan memerlukan bidang `id`—Mattermost mengabaikan tindakan tanpa ID.
4. `id` tindakan harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak perutean tindakan sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol; Gateway menolak klik dengan `action_id` yang tidak ada pada kiriman.
6. `context.action_id` wajib—penangan interaksi mengembalikan 400 tanpanya.
7. IP sumber callback harus diizinkan (lihat `interactions.allowedSourceIps` di atas).

</Warning>

**Pembuatan token HMAC**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token yang cocok dengan logika verifikasi Gateway:

<Steps>
  <Step title="Turunkan rahasia dari token bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, dikodekan sebagai heksadesimal.
  </Step>
  <Step title="Buat objek konteks">
    Buat objek konteks dengan semua bidang **kecuali** `_token`.
  </Step>
  <Step title="Serialisasikan dengan kunci terurut">
    Serialisasikan dengan **kunci yang diurutkan secara rekursif** dan **tanpa spasi** (Gateway juga mengkanonisasi objek bersarang dan menghasilkan JSON ringkas).
  </Step>
  <Step title="Tandatangani muatan">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Tambahkan token">
    Tambahkan digest heksadesimal yang dihasilkan sebagai `_token` dalam konteks.
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
    - `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan `separators=(",", ":")` agar cocok dengan keluaran ringkas JavaScript (`{"key":"val"}`).
    - Selalu tandatangani **semua** bidang konteks (dikurangi `_token`). Gateway menghapus `_token`, lalu menandatangani semua yang tersisa. Menandatangani hanya sebagian menyebabkan kegagalan verifikasi tanpa pemberitahuan.
    - Gunakan `sort_keys=True`—Gateway mengurutkan kunci sebelum menandatangani, dan Mattermost dapat mengubah urutan bidang konteks saat menyimpan muatan.
    - Turunkan rahasia dari token bot (deterministik), bukan byte acak. Rahasia harus sama di seluruh proses yang membuat tombol dan Gateway yang memverifikasinya.

  </Accordion>
</AccordionGroup>

## Adaptor direktori

Plugin Mattermost menyertakan adaptor direktori yang menyelesaikan nama kanal dan pengguna melalui API Mattermost. Ini memungkinkan target `#channel-name` dan `@username` dalam `openclaw message send` serta pengiriman Cron/Webhook.

Tidak diperlukan konfigurasi—adaptor menggunakan token bot dari konfigurasi akun.

## Multiakun

Mattermost mendukung beberapa akun di bawah `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Utama", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Peringatan", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Nilai akun menggantikan bidang tingkat atas; `channels.mattermost.defaultAccount` memilih akun yang digunakan ketika tidak ada akun yang ditentukan.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di kanal">
    Pastikan bot berada di kanal dan sebut bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau atur `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Kesalahan autentikasi atau multiakun">
    - Periksa token bot, URL dasar, dan apakah akun tersebut diaktifkan.
    - Masalah multiakun: variabel lingkungan hanya berlaku untuk akun `default`.
    - Host Mattermost privat/LAN memerlukan `network.dangerouslyAllowPrivateNetwork: true` (perlindungan SSRF memblokir IP privat secara default).

  </Accordion>
  <Accordion title="Perintah garis miring native gagal">
    - `Unauthorized: invalid command token.`: OpenClaw tidak menerima token panggilan balik. Penyebab umum:
      - pendaftaran perintah garis miring gagal atau hanya selesai sebagian saat dimulai
      - panggilan balik mencapai Gateway/akun yang salah
      - Mattermost masih memiliki perintah lama yang mengarah ke target panggilan balik sebelumnya
      - Gateway dimulai ulang tanpa mengaktifkan kembali perintah garis miring
    - Jika perintah garis miring native berhenti berfungsi, periksa log untuk `mattermost: failed to register slash commands` atau `mattermost: native slash commands enabled but no commands could be registered`.
    - Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa panggilan balik diarahkan ke URL loopback seperti `http://localhost:18789/...`, URL tersebut kemungkinan hanya dapat dijangkau ketika Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw. Sebagai gantinya, tetapkan `commands.callbackUrl` eksplisit yang dapat dijangkau dari luar.

  </Accordion>
  <Accordion title="Masalah tombol">
    - Tombol muncul sebagai kotak putih atau tidak muncul sama sekali: data tombol tidak valid. Setiap tombol presentasi memerlukan `label` dan `value` (tombol yang tidak memiliki salah satunya akan dibuang).
    - Tombol ditampilkan, tetapi klik tidak melakukan apa pun: pastikan Gateway dapat dijangkau dari server Mattermost, IP server Mattermost disertakan dalam `channels.mattermost.interactions.allowedSourceIps` (tanpa itu, hanya loopback yang diterima), dan `ServiceSettings.AllowedUntrustedInternalConnections` menyertakan host panggilan balik untuk target privat.
    - Tombol menghasilkan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router tindakan Mattermost gagal pada ID nonalfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
    - Log Gateway menampilkan `rejected callback source`: klik berasal dari IP di luar `interactions.allowedSourceIps`. Masukkan server Mattermost atau ingress Anda ke daftar yang diizinkan, dan atur `gateway.trustedProxies` jika berada di belakang proksi balik.
    - Log Gateway menampilkan `invalid _token`: HMAC tidak cocok. Pastikan Anda menandatangani semua bidang konteks (bukan hanya sebagian), menggunakan kunci yang diurutkan, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
    - Log Gateway menampilkan `missing _token in context`: bidang `_token` tidak ada dalam konteks tombol. Pastikan bidang tersebut disertakan saat membuat payload integrasi.
    - Gateway menolak klik dengan `Unknown action`: `context.action_id` tidak cocok dengan `id` tindakan mana pun pada kiriman. Atur keduanya ke nilai bersih yang sama.
    - Agen tidak menawarkan tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi kanal Mattermost.

  </Accordion>
</AccordionGroup>

## Terkait

- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Grup](/id/channels/groups) - perilaku percakapan grup dan pembatasan berdasarkan penyebutan
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Keamanan](/id/gateway/security) - model akses dan penguatan keamanan
