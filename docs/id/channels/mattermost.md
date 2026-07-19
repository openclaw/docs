---
read_when:
    - Menyiapkan Mattermost
    - Men-debug perutean Mattermost
sidebarTitle: Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-19T04:56:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea41fb9a7e4e9ea6bd8d04a4f2c6d2d7f2e43cf71830e445f1e28e2e8737f3cb
    source_path: channels/mattermost.md
    workflow: 16
---

Status: plugin yang dapat diunduh (token bot + peristiwa WebSocket). Channel, channel privat, DM grup, dan DM didukung. Mattermost adalah platform perpesanan tim yang dapat di-host sendiri ([mattermost.com](https://mattermost.com)).

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
    Buat akun bot Mattermost, salin **token bot**, lalu tambahkan bot ke tim dan channel yang perlu dibacanya.
  </Step>
  <Step title="Salin URL dasar">
    Salin **URL dasar** Mattermost (misalnya, `https://chat.example.com`). Akhiran `/api/v4` dihapus secara otomatis.
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
Mattermost yang di-host sendiri pada alamat privat/LAN/tailnet: permintaan keluar API Mattermost melewati perlindungan SSRF yang secara default memblokir IP privat dan internal. Aktifkan dengan `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (per akun: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Perintah garis miring native

Perintah garis miring native bersifat opsional. Saat diaktifkan, OpenClaw mendaftarkan perintah garis miring `oc_*` pada setiap tim tempat bot menjadi anggota dan menerima POST callback pada server HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gunakan saat Mattermost tidak dapat menjangkau gateway secara langsung (proksi terbalik/URL publik).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Perintah yang didaftarkan: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Dengan `nativeSkills: true`, perintah skill juga didaftarkan sebagai `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Catatan perilaku">
    - `native` dan `nativeSkills` secara default bernilai `"auto"`, yang ditetapkan sebagai nonaktif untuk Mattermost. Tetapkan keduanya secara eksplisit ke `true`.
    - `callbackPath` secara default bernilai `/api/channels/mattermost/command`.
    - Jika `callbackUrl` tidak dicantumkan, OpenClaw memperoleh `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Host pengikatan wildcard (`0.0.0.0`, `::`) menggunakan `localhost` sebagai fallback.
    - Untuk penyiapan multiakun, `commands` dapat ditetapkan pada tingkat teratas atau di bawah `channels.mattermost.accounts.<id>.commands` (nilai akun menggantikan kolom tingkat teratas).
    - Perintah garis miring yang sudah ada dengan pemicu sama dan dibuat oleh integrasi lain dibiarkan tanpa perubahan (pendaftaran melewatinya); perintah yang dibuat bot diperbarui atau dibuat ulang saat URL callback berubah.
    - Callback perintah divalidasi dengan token per perintah yang dikembalikan oleh Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
    - OpenClaw menyegarkan pendaftaran perintah Mattermost saat ini sebelum menerima setiap callback, sehingga token usang dari perintah garis miring yang dihapus atau dibuat ulang tidak lagi diterima tanpa memulai ulang gateway.
    - Validasi callback gagal secara tertutup jika API Mattermost tidak dapat mengonfirmasi bahwa perintah tersebut masih berlaku; validasi yang gagal disimpan dalam cache untuk waktu singkat, pencarian serentak digabungkan, dan dimulainya pencarian baru dibatasi lajunya per perintah untuk membatasi tekanan pemutaran ulang.
    - Callback garis miring gagal secara tertutup jika pendaftaran gagal, proses awal hanya selesai sebagian, atau token callback tidak cocok dengan token terdaftar milik perintah yang ditetapkan (token yang valid untuk satu perintah tidak dapat mencapai validasi upstream untuk perintah lain).
    - Callback yang diterima diakui dengan balasan sementara "Memproses..."; jawaban sebenarnya tiba sebagai pesan biasa.

  </Accordion>
  <Accordion title="Persyaratan keterjangkauan">
    Endpoint callback harus dapat dijangkau dari server Mattermost.

    - Jangan tetapkan `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw.
    - Jangan tetapkan `callbackUrl` ke URL dasar Mattermost Anda kecuali URL tersebut memproksikan secara terbalik `/api/channels/mattermost/command` ke OpenClaw.
    - Pemeriksaan cepatnya adalah `curl https://<gateway-host>/api/channels/mattermost/command`; GET harus mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.

  </Accordion>
  <Accordion title="Daftar izin keluar Mattermost">
    Jika callback Anda menargetkan alamat privat/tailnet/internal, tetapkan `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost agar menyertakan host/domain callback.

    Gunakan entri host/domain, bukan URL lengkap.

    - Benar: `gateway.tailnet-name.ts.net`
    - Salah: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabel lingkungan (akun default)

Tetapkan variabel berikut pada host gateway jika Anda lebih memilih variabel lingkungan:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Variabel lingkungan hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

`MATTERMOST_URL` tidak dapat ditetapkan dari `.env` ruang kerja; lihat [File .env ruang kerja](/id/gateway/security).
</Note>

## Mode obrolan

Mattermost merespons DM secara otomatis. Perilaku channel dikontrol oleh `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Hanya respons saat @disebut di channel.
  </Tab>
  <Tab title="onmessage">
    Respons setiap pesan channel.
  </Tab>
  <Tab title="onchar">
    Respons saat pesan diawali prefiks pemicu.
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
- `channels.mattermost.requireMention` tetap dipatuhi, tetapi `chatmode` lebih disarankan. Pengaturan `groups.<channelId>.requireMention` per channel lebih diprioritaskan daripada keduanya.
- Setelah bot mengirim balasan yang terlihat dalam utas channel, pesan berikutnya dalam utas yang sama dijawab tanpa @sebutan baru atau prefiks `onchar`, sehingga percakapan utas bergiliran jamak tetap berlanjut. Partisipasi diingat selama 7 hari setelah bot terakhir kali membalas dalam utas tersebut dan tetap tersimpan setelah gateway dimulai ulang. Utas yang hanya diamati bot tidak terpengaruh; mulai pesan tingkat teratas baru agar sebutan eksplisit diwajibkan lagi.
- Tetapkan `channels.mattermost.implicitMentions.threadParticipation: false` untuk menghentikan tindak lanjut utas yang diikuti agar tidak melewati pembatasan sebutan. Penggantian akun menggunakan `channels.mattermost.accounts.<id>.implicitMentions`. Mattermost saat ini tidak menghasilkan fakta `replyToBot` atau `quotedBot`, sehingga flag tersebut tidak berpengaruh di sini.

## Utas dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan channel dan grup tetap berada di channel utama atau memulai utas di bawah kiriman pemicu.

- `off` (default): hanya balas dalam utas ketika kiriman masuk sudah berada dalam utas.
- `first`: untuk kiriman channel/grup tingkat teratas, mulai utas di bawah kiriman tersebut dan arahkan percakapan ke sesi yang cakupannya terbatas pada utas.
- `all` dan `batched`: saat ini berperilaku sama seperti `first` untuk Mattermost, karena setelah Mattermost memiliki akar utas, potongan lanjutan dan media tetap berada dalam utas yang sama.
- Pesan langsung secara default menggunakan `off` meskipun `replyToMode` ditetapkan.

Gunakan `channels.mattermost.replyToModeByChatType` untuk mengganti mode bagi obrolan `direct`, `group`, atau `channel`. Tetapkan `direct` untuk mengaktifkan utas pada pesan langsung:

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

- Sesi yang cakupannya terbatas pada utas menggunakan ID kiriman pemicu sebagai akar utas.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki akar utas, potongan lanjutan dan media tetap berada dalam utas yang sama.
- Penggantian per jenis obrolan lebih diprioritaskan daripada `replyToMode`. Tanpa penggantian `direct`, deployment yang ada mempertahankan DM datar tanpa utas.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim yang tidak dikenal menerima kode pemasangan). Nilai lainnya: `allowlist`, `open`, `disabled`.
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` ditambah `channels.mattermost.allowFrom=["*"]` (skema konfigurasi memberlakukan wildcard).
- `channels.mattermost.allowFrom` menerima ID pengguna (disarankan) dan entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).

## Channel (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi oleh sebutan).
- Izinkan pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna disarankan).
- `channels.mattermost.groupAllowFrom` menerima entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).
- Penggantian sebutan per channel berada di bawah `channels.mattermost.groups.<channelId>.requireMention` atau `channels.mattermost.groups["*"].requireMention` untuk default.
- Pencocokan `@username` dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Channel terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi oleh sebutan).
- Urutan resolusi: `channels.mattermost.groupPolicy`, lalu `channels.defaults.groupPolicy`, kemudian `"allowlist"`.
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

| Target                              | Dikirim ke                                                     |
| ----------------------------------- | -------------------------------------------------------------- |
| `channel:<id>`                      | Channel berdasarkan ID                                         |
| `channel:<name>` atau `#channel-name` | Channel berdasarkan nama, dicari di seluruh tim yang diikuti bot |
| `user:<id>` atau `mattermost:<id>`    | DM dengan pengguna tersebut                                    |
| `@username`                         | DM (nama pengguna ditetapkan melalui API Mattermost)           |

Pengiriman keluar mendukung paling banyak satu lampiran per pesan; pisahkan beberapa file menjadi pengiriman terpisah.

<Warning>
ID buram tanpa prefiks (seperti `64ifufp...`) bersifat **ambigu** di Mattermost (ID pengguna versus ID channel).

OpenClaw menetapkannya dengan **pengguna lebih dahulu**:

- Jika ID tersebut ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan me-resolve saluran langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID tersebut diperlakukan sebagai **ID saluran**.

Jika Anda memerlukan perilaku deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).
</Warning>

## Percobaan ulang saluran DM

Ketika OpenClaw mengirim ke target DM Mattermost dan perlu me-resolve saluran langsung terlebih dahulu, secara default OpenClaw mencoba ulang kegagalan sementara dalam pembuatan saluran langsung.

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

- Ini hanya berlaku untuk pembuatan saluran DM (`/api/v4/channels/direct`), bukan setiap panggilan API Mattermost.
- Percobaan ulang menggunakan backoff eksponensial dengan jitter dan berlaku untuk kegagalan sementara seperti batas laju, respons 5xx, serta kesalahan jaringan atau batas waktu.
- Kesalahan klien 4xx selain `429` dianggap permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost melakukan streaming pemikiran, aktivitas alat, dan teks balasan parsial ke dalam **postingan pratinjau draf** yang diselesaikan di tempat ketika jawaban akhir aman untuk dikirim. Dalam mode `partial`, pratinjau diperbarui pada ID postingan yang sama alih-alih membanjiri saluran dengan pesan per potongan. Dalam mode `block`, pratinjau berganti antara teks yang telah selesai dan blok aktivitas alat, sehingga blok sebelumnya tetap terlihat sebagai postingan tersendiri alih-alih ditimpa oleh blok berikutnya. Hasil akhir media/kesalahan membatalkan pengeditan pratinjau yang tertunda dan menggunakan pengiriman normal alih-alih menyelesaikan postingan pratinjau sekali pakai.

Streaming pratinjau **aktif secara default** dalam mode `partial`. Konfigurasikan melalui `channels.mattermost.streaming.mode` (nilai skalar/boolean lama `streaming` dimigrasikan oleh `openclaw doctor --fix`):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // nonaktif | parsial | blok | progres
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Mode streaming">
    - `partial` (default): satu postingan pratinjau yang diedit seiring bertambahnya balasan, lalu diselesaikan dengan jawaban lengkap.
    - `block` mengganti pratinjau antara teks yang telah selesai dan blok aktivitas alat, sehingga setiap blok tetap terlihat sebagai postingan tersendiri alih-alih ditimpa di tempat. Pembaruan alat paralel dan berurutan berbagi postingan aktivitas alat saat ini.
    - `progress` menampilkan pratinjau status selama pembuatan dan hanya memposting jawaban akhir setelah selesai.
    - `off` menonaktifkan streaming pratinjau. Dengan `streaming.block.enabled: true`, blok asisten yang telah selesai tetap dikirim sebagai balasan blok normal (postingan terpisah), bukan sebagai satu postingan akhir yang digabungkan.

  </Accordion>
  <Accordion title="Catatan perilaku streaming">
    - Jika streaming tidak dapat diselesaikan di tempat (misalnya postingan dihapus saat streaming berlangsung), OpenClaw beralih mengirim postingan akhir baru agar balasan tidak pernah hilang.
    - Payload yang hanya berisi pemikiran tidak ditampilkan dalam postingan saluran, termasuk teks yang masuk sebagai blockquote `> Thinking`. Atur `/reasoning on` untuk melihat pemikiran di permukaan lain; postingan akhir Mattermost hanya mempertahankan jawaban.
    - Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan saluran.

  </Accordion>
</AccordionGroup>

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah ID postingan Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua bersifat opsional).
- Atur `remove=true` (boolean) untuk menghapus reaksi.
- Peristiwa penambahan/penghapusan reaksi diteruskan sebagai peristiwa sistem ke sesi agen yang dirutekan, dengan tunduk pada pemeriksaan kebijakan DM/grup yang sama seperti pesan.

Contoh:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan tindakan reaksi (default true).
- Penimpaan per akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (alat pesan)

Kirim pesan dengan tombol yang dapat diklik. Ketika pengguna mengeklik tombol, agen menerima pilihan tersebut dan dapat merespons.

Tombol berasal dari payload semantik `presentation` (dalam balasan agen normal dan dalam `message action=send`). OpenClaw merender tombol nilai sebagai tombol interaktif Mattermost, mempertahankan tombol URL agar terlihat dalam teks pesan, dan menurunkan menu pilihan menjadi teks yang mudah dibaca.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Ya","value":"yes"},{"label":"Tidak","value":"no"}]}]}
```

Kolom tombol presentasi:

<ParamField path="label" type="string" required>
  Label tampilan (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Nilai yang dikirim kembali saat diklik, digunakan sebagai ID tindakan (alias: `callback_data`, `callbackData`). Wajib untuk tombol yang dapat diklik kecuali `url` ditetapkan.
</ParamField>
<ParamField path="url" type="string">
  Tombol tautan; dirender sebagai teks `label: url` dalam isi pesan, bukan sebagai tombol interaktif.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Gaya tombol. Mattermost menerapkan gaya default pada nilai yang tidak didukungnya.
</ParamField>

Untuk menginformasikan dukungan tombol dalam prompt sistem agen, tambahkan `inlineButtons` ke kapabilitas saluran:

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
    Pengeklik harus lolos pemeriksaan kebijakan DM/grup yang sama seperti pengirim pesan; klik yang tidak sah akan mendapatkan pemberitahuan sementara dan diabaikan.
  </Step>
  <Step title="Tombol diganti dengan konfirmasi">
    Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Ya** dipilih oleh @user").
  </Step>
  <Step title="Agen menerima pilihan">
    Agen menerima pilihan sebagai pesan masuk (beserta peristiwa sistem) dan merespons.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan implementasi">
    - Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tanpa konfigurasi).
    - Seluruh blok lampiran diganti saat diklik, sehingga semua tombol dihapus bersamaan—penghapusan parsial tidak dimungkinkan.
    - ID tindakan yang berisi tanda hubung atau garis bawah dibersihkan secara otomatis (keterbatasan perutean Mattermost).
    - Klik dengan `action_id` yang tidak cocok dengan tindakan pada postingan asli ditolak dengan `403` ("Tindakan tidak dikenal").

  </Accordion>
  <Accordion title="Konfigurasi dan keterjangkauan">
    - `channels.mattermost.capabilities`: larik string kapabilitas. Tambahkan `"inlineButtons"` untuk mengaktifkan deskripsi alat tombol dalam prompt sistem agen.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback tombol (misalnya `https://gateway.example.com`). Gunakan ini ketika Mattermost tidak dapat menjangkau Gateway secara langsung pada host pengikatannya.
    - Dalam penyiapan multiakun, Anda juga dapat menetapkan kolom yang sama di bawah `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jika `interactions.callbackBaseUrl` tidak disertakan, OpenClaw memperoleh URL callback dari `gateway.customBindHost` + `gateway.port` (default 18789), lalu beralih ke `http://localhost:<port>`. Jalur callback adalah `/mattermost/interactions/<accountId>`.
    - Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost. `localhost` hanya berfungsi ketika Mattermost dan OpenClaw berjalan pada host/namespace jaringan yang sama.
    - `channels.mattermost.interactions.allowedSourceIps`: daftar izin IP sumber untuk callback tombol. Tanpanya, hanya sumber loopback (`127.0.0.1`, `::1`) yang diterima, sehingga server Mattermost jarak jauh harus dimasukkan ke daftar izin di sini atau kliknya ditolak dengan `403`. Di belakang proksi terbalik, tetapkan juga `gateway.trustedProxies` agar IP klien sebenarnya diperoleh dari header yang diteruskan.
    - Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan Webhook dapat memposting tombol secara langsung melalui API REST Mattermost alih-alih melalui alat `message` milik agen. Utamakan alat `message` milik OpenClaw. Untuk integrasi langsung, impor `buildButtonAttachments` dari `@openclaw/mattermost/api.js`; jika memposting JSON mentah, ikuti aturan berikut:

**Struktur payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Pilih opsi:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // hanya alfanumerik - lihat di bawah
            type: "button", // wajib, atau klik diabaikan tanpa pemberitahuan
            name: "Setujui", // label tampilan
            style: "primary", // opsional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // harus cocok dengan ID tombol
                action: "approve",
                // ... kolom kustom apa pun ...
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

1. Lampiran ditempatkan dalam `props.attachments`, bukan `attachments` tingkat teratas (diabaikan tanpa pemberitahuan).
2. Setiap tindakan memerlukan `type: "button"`—tanpanya, klik ditelan tanpa pemberitahuan.
3. Setiap tindakan memerlukan kolom `id`—Mattermost mengabaikan tindakan tanpa ID.
4. `id` tindakan harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak perutean tindakan sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol; Gateway menolak klik jika `action_id` tidak ada pada postingan.
6. `context.action_id` wajib—penangan interaksi mengembalikan 400 tanpanya.
7. IP sumber callback harus diizinkan (lihat `interactions.allowedSourceIps` di atas).

</Warning>

**Pembuatan token HMAC**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token yang cocok dengan logika verifikasi Gateway:

<Steps>
  <Step title="Turunkan rahasia dari token bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, dikodekan dalam heksadesimal.
  </Step>
  <Step title="Buat objek konteks">
    Buat objek konteks dengan semua kolom **kecuali** `_token`.
  </Step>
  <Step title="Serialisasikan dengan kunci terurut">
    Serialisasikan dengan **kunci yang diurutkan secara rekursif** dan **tanpa spasi** (Gateway juga mengkanonisasi objek bertingkat dan menghasilkan JSON ringkas).
  </Step>
  <Step title="Tandatangani payload">
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
    - `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan `separators=(",", ":")` agar sesuai dengan keluaran ringkas JavaScript (`{"key":"val"}`).
    - Selalu tandatangani **semua** bidang konteks (kecuali `_token`). Gateway menghapus `_token`, lalu menandatangani semua yang tersisa. Menandatangani hanya sebagian bidang menyebabkan kegagalan verifikasi tanpa pemberitahuan.
    - Gunakan `sort_keys=True`—Gateway mengurutkan kunci sebelum menandatangani, dan Mattermost dapat mengubah urutan bidang konteks saat menyimpan payload.
    - Turunkan rahasia dari token bot (deterministik), bukan dari byte acak. Rahasia tersebut harus sama antara proses yang membuat tombol dan Gateway yang melakukan verifikasi.

  </Accordion>
</AccordionGroup>

## Adaptor direktori

Plugin Mattermost menyertakan adaptor direktori yang menguraikan nama saluran dan pengguna melalui API Mattermost. Hal ini memungkinkan target `#channel-name` dan `@username` dalam pengiriman `openclaw message send` serta cron/webhook.

Tidak diperlukan konfigurasi—adaptor menggunakan token bot dari konfigurasi akun.

## Multiakun

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

Nilai akun menggantikan bidang tingkat atas; `channels.mattermost.defaultAccount` menentukan akun yang digunakan saat tidak ada akun yang ditetapkan.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di saluran">
    Pastikan bot berada di saluran dan sebut bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau atur `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Kesalahan autentikasi atau multiakun">
    - Periksa token bot, URL dasar, dan apakah akun diaktifkan.
    - Masalah multiakun: variabel lingkungan hanya berlaku untuk akun `default`.
    - Host Mattermost privat/LAN memerlukan `network.dangerouslyAllowPrivateNetwork: true` (perlindungan SSRF memblokir IP privat secara default).

  </Accordion>
  <Accordion title="Perintah garis miring native gagal">
    - `Unauthorized: invalid command token.`: OpenClaw tidak menerima token callback. Penyebab umum:
      - pendaftaran perintah garis miring gagal atau hanya selesai sebagian saat startup
      - callback mencapai Gateway/akun yang salah
      - Mattermost masih memiliki perintah lama yang mengarah ke target callback sebelumnya
      - Gateway dimulai ulang tanpa mengaktifkan kembali perintah garis miring
    - Jika perintah garis miring native berhenti berfungsi, periksa log untuk `mattermost: failed to register slash commands` atau `mattermost: native slash commands enabled but no commands could be registered`.
    - Jika `callbackUrl` tidak disertakan dan log memperingatkan bahwa callback diuraikan menjadi URL loopback seperti `http://localhost:18789/...`, URL tersebut mungkin hanya dapat dijangkau saat Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw. Sebagai gantinya, tetapkan `commands.callbackUrl` eksplisit yang dapat dijangkau dari luar.

  </Accordion>
  <Accordion title="Masalah tombol">
    - Tombol muncul sebagai kotak putih atau tidak muncul sama sekali: data tombol tidak valid. Setiap tombol presentasi memerlukan `label` dan `value` (tombol yang tidak memiliki salah satunya akan dihapus).
    - Tombol ditampilkan, tetapi klik tidak melakukan apa pun: pastikan Gateway dapat dijangkau dari server Mattermost, IP server Mattermost disertakan dalam `channels.mattermost.interactions.allowedSourceIps` (tanpanya, hanya loopback yang diterima), dan `ServiceSettings.AllowedUntrustedInternalConnections` menyertakan host callback untuk target privat.
    - Tombol menghasilkan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router tindakan Mattermost gagal pada ID nonalfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
    - Log Gateway mencatat `rejected callback source`: klik berasal dari IP di luar `interactions.allowedSourceIps`. Tambahkan server Mattermost atau ingress Anda ke daftar yang diizinkan, dan atur `gateway.trustedProxies` di belakang reverse proxy.
    - Log Gateway mencatat `invalid _token`: HMAC tidak cocok. Pastikan Anda menandatangani semua bidang konteks (bukan hanya sebagian), menggunakan kunci yang diurutkan, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
    - Log Gateway mencatat `missing _token in context`: bidang `_token` tidak terdapat dalam konteks tombol. Pastikan bidang tersebut disertakan saat membuat payload integrasi.
    - Gateway menolak klik dengan `Unknown action`: `context.action_id` tidak cocok dengan `id` tindakan mana pun pada postingan. Atur keduanya ke nilai tersanitasi yang sama.
    - Agen tidak menawarkan tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi saluran Mattermost.

  </Accordion>
</AccordionGroup>

## Terkait

- [Perutean Saluran](/id/channels/channel-routing)—perutean sesi untuk pesan
- [Ikhtisar Saluran](/id/channels)—semua saluran yang didukung
- [Grup](/id/channels/groups)—perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Pemasangan](/id/channels/pairing)—autentikasi DM dan alur pemasangan
- [Keamanan](/id/gateway/security)—model akses dan penguatan
