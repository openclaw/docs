---
read_when:
    - Menyiapkan Mattermost
    - Men-debug perutean Mattermost
sidebarTitle: Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T17:48:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Status: plugin yang dapat diunduh (token bot + peristiwa WebSocket). Channel, channel privat, DM grup, dan DM didukung. Mattermost adalah platform perpesanan tim yang dapat dihosting sendiri ([mattermost.com](https://mattermost.com)).

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
    Buat akun bot Mattermost, salin **token bot**, dan tambahkan bot ke tim serta channel yang harus dibacanya.
  </Step>
  <Step title="Salin URL dasar">
    Salin **URL dasar** Mattermost (misalnya, `https://chat.example.com`). Akhiran `/api/v4` dihapus secara otomatis.
  </Step>
  <Step title="Konfigurasikan OpenClaw dan jalankan gateway">
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

Perintah garis miring native bersifat opsional. Jika diaktifkan, OpenClaw mendaftarkan perintah garis miring `oc_*` pada setiap tim tempat bot menjadi anggota dan menerima POST panggilan balik di server HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gunakan ketika Mattermost tidak dapat menjangkau gateway secara langsung (proksi terbalik/URL publik).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Perintah yang didaftarkan: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Dengan `nativeSkills: true`, perintah skill juga didaftarkan sebagai `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Catatan perilaku">
    - `native` dan `nativeSkills` secara default menggunakan `"auto"`, yang ditetapkan sebagai nonaktif untuk Mattermost. Tetapkan keduanya secara eksplisit ke `true`.
    - `callbackPath` secara default menggunakan `/api/channels/mattermost/command`.
    - Jika `callbackUrl` dihilangkan, OpenClaw memperoleh `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Host pengikatan wildcard (`0.0.0.0`, `::`) akan menggunakan `localhost` sebagai nilai cadangan.
    - Untuk penyiapan multiakun, `commands` dapat ditetapkan pada tingkat teratas atau di bawah `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa kolom tingkat teratas).
    - Perintah garis miring yang sudah ada dengan pemicu sama dan dibuat oleh integrasi lain dibiarkan tanpa perubahan (pendaftaran melewatinya); perintah yang dibuat bot diperbarui atau dibuat ulang ketika URL panggilan balik berubah.
    - Panggilan balik perintah divalidasi dengan token per perintah yang dikembalikan oleh Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
    - OpenClaw menyegarkan pendaftaran perintah Mattermost saat ini sebelum menerima setiap panggilan balik, sehingga token kedaluwarsa dari perintah garis miring yang dihapus atau dibuat ulang tidak lagi diterima tanpa memulai ulang gateway.
    - Validasi panggilan balik gagal secara tertutup jika API Mattermost tidak dapat mengonfirmasi bahwa perintah masih berlaku; validasi yang gagal disimpan dalam cache untuk sementara, pencarian serentak digabungkan, dan dimulainya pencarian baru dibatasi lajunya per perintah untuk membatasi tekanan pemutaran ulang.
    - Panggilan balik garis miring gagal secara tertutup ketika pendaftaran gagal, proses awal hanya selesai sebagian, atau token panggilan balik tidak cocok dengan token terdaftar milik perintah yang ditetapkan (token yang valid untuk satu perintah tidak dapat mencapai validasi hulu bagi perintah lain).
    - Panggilan balik yang diterima diakui dengan balasan sementara "Memproses..."; jawaban sebenarnya diterima sebagai pesan biasa.

  </Accordion>
  <Accordion title="Persyaratan keterjangkauan">
    Endpoint panggilan balik harus dapat dijangkau dari server Mattermost.

    - Jangan tetapkan `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw.
    - Jangan tetapkan `callbackUrl` ke URL dasar Mattermost kecuali URL tersebut memproksikan secara terbalik `/api/channels/mattermost/command` ke OpenClaw.
    - Pemeriksaan cepatnya adalah `curl https://<gateway-host>/api/channels/mattermost/command`; GET seharusnya mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.

  </Accordion>
  <Accordion title="Daftar izin egress Mattermost">
    Jika panggilan balik menargetkan alamat privat/tailnet/internal, tetapkan `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost agar menyertakan host/domain panggilan balik.

    Gunakan entri host/domain, bukan URL lengkap.

    - Benar: `gateway.tailnet-name.ts.net`
    - Salah: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabel lingkungan (akun default)

Tetapkan variabel berikut pada host gateway jika lebih memilih variabel lingkungan:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Variabel lingkungan hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

`MATTERMOST_URL` tidak dapat ditetapkan dari `.env` ruang kerja; lihat [File .env ruang kerja](/id/gateway/security).
</Note>

## Mode obrolan

Mattermost merespons DM secara otomatis. Perilaku channel dikendalikan oleh `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Respons hanya ketika disebut dengan @ di channel.
  </Tab>
  <Tab title="onmessage">
    Respons terhadap setiap pesan channel.
  </Tab>
  <Tab title="onchar">
    Respons ketika pesan dimulai dengan prefiks pemicu.
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

- `onchar` tetap merespons penyebutan @ secara eksplisit.
- `channels.mattermost.requireMention` tetap dipatuhi, tetapi `chatmode` lebih disarankan. Pengaturan `groups.<channelId>.requireMention` per channel mengungguli keduanya.
- Setelah bot mengirim balasan yang terlihat dalam utas channel, pesan berikutnya dalam utas yang sama akan dijawab tanpa penyebutan @ baru atau prefiks `onchar`, sehingga percakapan utas multi-giliran tetap berlanjut. Partisipasi diingat selama 7 hari setelah bot terakhir membalas dalam utas tersebut dan tetap tersimpan setelah gateway dimulai ulang. Utas yang hanya diamati bot tidak terpengaruh; mulai pesan tingkat teratas baru agar penyebutan eksplisit diwajibkan kembali.

## Utas dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengendalikan apakah balasan channel dan grup tetap berada di channel utama atau memulai utas di bawah kiriman pemicu.

- `off` (default): hanya balas dalam utas ketika kiriman masuk sudah berada dalam utas.
- `first`: untuk kiriman channel/grup tingkat teratas, mulai utas di bawah kiriman tersebut dan arahkan percakapan ke sesi yang dicakup utas.
- `all` dan `batched`: perilaku yang sama dengan `first` untuk Mattermost saat ini, karena setelah Mattermost memiliki akar utas, potongan lanjutan dan media tetap berada dalam utas yang sama.
- Pesan langsung secara default menggunakan `off` meskipun `replyToMode` ditetapkan.

Gunakan `channels.mattermost.replyToModeByChatType` untuk menimpa mode bagi obrolan `direct`, `group`, atau `channel`. Tetapkan `direct` untuk mengikutsertakan pesan langsung dalam utas:

- `off` (default): pesan langsung tetap tanpa utas dalam satu sesi berkelanjutan.
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

- Sesi yang dicakup utas menggunakan id kiriman pemicu sebagai akar utas.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki akar utas, potongan lanjutan dan media tetap berada dalam utas yang sama.
- Penimpaan per jenis obrolan lebih diprioritaskan daripada `replyToMode`. Tanpa penimpaan `direct`, penerapan yang ada mempertahankan DM datar tanpa utas.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim yang tidak dikenal mendapatkan kode pemasangan). Nilai lainnya: `allowlist`, `open`, `disabled`.
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` ditambah `channels.mattermost.allowFrom=["*"]` (skema konfigurasi memberlakukan wildcard).
- `channels.mattermost.allowFrom` menerima id pengguna (disarankan) dan entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).

## Channel (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi oleh penyebutan).
- Izinkan pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna disarankan).
- `channels.mattermost.groupAllowFrom` menerima entri `accessGroup:<name>`. Lihat [Grup akses](/id/channels/access-groups).
- Penimpaan penyebutan per channel berada di bawah `channels.mattermost.groups.<channelId>.requireMention` atau `channels.mattermost.groups["*"].requireMention` untuk nilai default.
- Pencocokan `@username` bersifat dapat berubah dan hanya diaktifkan ketika `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Channel terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi oleh penyebutan).
- Urutan resolusi: `channels.mattermost.groupPolicy`, lalu `channels.defaults.groupPolicy`, lalu `"allowlist"`.
- Catatan runtime: jika bagian `channels.mattermost` tidak ada sama sekali, runtime gagal secara tertutup ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` ditetapkan) dan mencatat peringatan satu kali.

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
| `channel:<id>`                      | Channel berdasarkan id                                         |
| `channel:<name>` atau `#channel-name` | Channel berdasarkan nama, dicari di seluruh tim tempat bot bergabung |
| `user:<id>` atau `mattermost:<id>`    | DM dengan pengguna tersebut                                    |
| `@username`                         | DM (nama pengguna ditetapkan melalui API Mattermost)            |

Pengiriman keluar mendukung paling banyak satu lampiran per pesan; pisahkan beberapa file menjadi pengiriman terpisah.

<Warning>
ID buram tanpa prefiks (seperti `64ifufp...`) bersifat **ambigu** di Mattermost (ID pengguna atau ID channel).

OpenClaw menetapkannya dengan **mendahulukan pengguna**:

- Jika ID tersebut ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan menetapkan channel langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID diperlakukan sebagai **ID channel**.

Jika memerlukan perilaku deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).
</Warning>

## Percobaan ulang channel DM

Ketika OpenClaw mengirim ke target DM Mattermost dan perlu menentukan channel langsung terlebih dahulu, secara default OpenClaw mencoba ulang kegagalan sementara dalam pembuatan channel langsung.

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

- Ini hanya berlaku untuk pembuatan channel DM (`/api/v4/channels/direct`), bukan setiap panggilan API Mattermost.
- Percobaan ulang menggunakan backoff eksponensial dengan jitter dan diterapkan pada kegagalan sementara seperti batas laju, respons 5xx, serta kesalahan jaringan atau batas waktu.
- Kesalahan klien 4xx selain `429` dianggap permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost men-streaming proses berpikir, aktivitas alat, dan sebagian teks balasan ke dalam **kiriman pratinjau draf** yang difinalisasi di tempat ketika jawaban akhir aman untuk dikirim. Dalam mode `partial`, pratinjau diperbarui pada ID kiriman yang sama, alih-alih membanjiri channel dengan pesan per potongan. Dalam mode `block`, pratinjau berganti antara teks yang telah selesai dan blok aktivitas alat, sehingga blok sebelumnya tetap terlihat sebagai kiriman tersendiri dan tidak ditimpa oleh blok berikutnya. Hasil akhir berupa media/kesalahan membatalkan pengeditan pratinjau yang tertunda dan menggunakan pengiriman normal, alih-alih mengirimkan kiriman pratinjau sementara.

Streaming pratinjau **aktif secara default** dalam mode `partial`. Konfigurasikan melalui `channels.mattermost.streaming.mode` (nilai skalar/boolean lama `streaming` dimigrasikan oleh `openclaw doctor --fix`):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Mode streaming">
    - `partial` (default): satu kiriman pratinjau yang diedit seiring bertambahnya balasan, lalu difinalisasi dengan jawaban lengkap.
    - `block` mengganti pratinjau antara teks yang telah selesai dan blok aktivitas alat, sehingga setiap blok tetap terlihat sebagai kiriman tersendiri dan tidak ditimpa di tempat. Pembaruan alat secara paralel dan berurutan menggunakan kiriman aktivitas alat saat ini secara bersama.
    - `progress` menampilkan pratinjau status selama pembuatan dan hanya memposting jawaban akhir setelah selesai.
    - `off` menonaktifkan streaming pratinjau. Dengan `streaming.block.enabled: true`, blok asisten yang telah selesai tetap dikirim sebagai balasan blok normal (kiriman terpisah), bukan sebagai satu kiriman akhir yang digabungkan.

  </Accordion>
  <Accordion title="Catatan perilaku streaming">
    - Jika stream tidak dapat difinalisasi di tempat (misalnya kiriman dihapus saat streaming berlangsung), OpenClaw beralih dengan mengirim kiriman akhir baru agar balasan tidak pernah hilang.
    - Payload yang hanya berisi proses berpikir tidak ditampilkan dalam kiriman channel, termasuk teks yang diterima sebagai blockquote `> Thinking`. Atur `/reasoning on` untuk melihat proses berpikir di permukaan lain; kiriman akhir Mattermost hanya menyertakan jawaban.
    - Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan channel.

  </Accordion>
</AccordionGroup>

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah ID kiriman Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (tanda titik dua bersifat opsional).
- Atur `remove=true` (boolean) untuk menghapus reaksi.
- Peristiwa penambahan/penghapusan reaksi diteruskan sebagai peristiwa sistem ke sesi agen yang dirutekan, dengan pemeriksaan kebijakan DM/grup yang sama seperti pesan.

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
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Bidang tombol presentasi:

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

Untuk menginformasikan dukungan tombol dalam prompt sistem agen, tambahkan `inlineButtons` ke kapabilitas channel:

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
    Pengeklik harus lulus pemeriksaan kebijakan DM/grup yang sama seperti pengirim pesan; klik yang tidak diizinkan mendapatkan pemberitahuan sementara dan diabaikan.
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
    - Seluruh blok lampiran diganti saat diklik, sehingga semua tombol dihapus bersama-sama - penghapusan sebagian tidak dimungkinkan.
    - ID tindakan yang berisi tanda hubung atau garis bawah disanitasi secara otomatis (keterbatasan perutean Mattermost).
    - Klik dengan `action_id` yang tidak cocok dengan tindakan pada kiriman asli ditolak dengan `403` ("Tindakan tidak dikenal").

  </Accordion>
  <Accordion title="Konfigurasi dan keterjangkauan">
    - `channels.mattermost.capabilities`: larik string kapabilitas. Tambahkan `"inlineButtons"` untuk mengaktifkan deskripsi alat tombol dalam prompt sistem agen.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback tombol (misalnya `https://gateway.example.com`). Gunakan ini ketika Mattermost tidak dapat menjangkau gateway secara langsung pada host bind-nya.
    - Dalam penyiapan multiakun, Anda juga dapat menetapkan bidang yang sama di bawah `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw memperoleh URL callback dari `gateway.customBindHost` + `gateway.port` (default 18789), lalu beralih ke `http://localhost:<port>`. Jalur callback adalah `/mattermost/interactions/<accountId>`.
    - Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost. `localhost` hanya berfungsi ketika Mattermost dan OpenClaw berjalan pada host/namespace jaringan yang sama.
    - `channels.mattermost.interactions.allowedSourceIps`: daftar izin IP sumber untuk callback tombol. Tanpa ini, hanya sumber loopback (`127.0.0.1`, `::1`) yang diterima, sehingga server Mattermost jarak jauh harus ditambahkan ke daftar izin di sini atau kliknya ditolak dengan `403`. Di belakang proksi terbalik, tetapkan juga `gateway.trustedProxies` agar IP klien sebenarnya diperoleh dari header yang diteruskan.
    - Jika target callback Anda bersifat privat/tailnet/internal, tambahkan host/domain-nya ke `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan Webhook dapat memposting tombol secara langsung melalui API REST Mattermost, alih-alih melalui alat `message` milik agen. Utamakan alat `message` OpenClaw. Untuk integrasi langsung, impor `buildButtonAttachments` dari `@openclaw/mattermost/api.js`; jika memposting JSON mentah, ikuti aturan berikut:

**Struktur payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Pilih sebuah opsi:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // hanya alfanumerik - lihat di bawah
            type: "button", // wajib, atau klik akan diabaikan tanpa pemberitahuan
            name: "Setujui", // label tampilan
            style: "primary", // opsional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // harus cocok dengan ID tombol
                action: "approve",
                // ... bidang khusus apa pun ...
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
2. Setiap tindakan memerlukan `type: "button"` - tanpanya, klik ditelan tanpa pemberitahuan.
3. Setiap tindakan memerlukan bidang `id` - Mattermost mengabaikan tindakan tanpa ID.
4. `id` tindakan harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak perutean tindakan sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol; gateway menolak klik dengan `action_id` yang tidak ada pada kiriman.
6. `context.action_id` wajib - penangan interaksi mengembalikan 400 tanpanya.
7. IP sumber callback harus diizinkan (lihat `interactions.allowedSourceIps` di atas).

</Warning>

**Pembuatan token HMAC**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus menghasilkan token yang cocok dengan logika verifikasi gateway:

<Steps>
  <Step title="Turunkan rahasia dari token bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, dikodekan dalam format heksadesimal.
  </Step>
  <Step title="Buat objek konteks">
    Buat objek konteks dengan semua bidang **kecuali** `_token`.
  </Step>
  <Step title="Serialisasikan dengan kunci terurut">
    Serialisasikan dengan **kunci yang diurutkan secara rekursif** dan **tanpa spasi** (gateway juga mengkanonisasi objek bersarang dan menghasilkan JSON ringkas).
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
    - `json.dumps` milik Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan `separators=(",", ":")` agar sesuai dengan keluaran ringkas JavaScript (`{"key":"val"}`).
    - Selalu tandatangani **semua** bidang konteks (kecuali `_token`). Gateway menghapus `_token`, lalu menandatangani semua yang tersisa. Menandatangani hanya sebagian bidang menyebabkan kegagalan verifikasi tanpa pesan.
    - Gunakan `sort_keys=True` — Gateway mengurutkan kunci sebelum menandatangani, dan Mattermost dapat mengubah urutan bidang konteks saat menyimpan payload.
    - Turunkan rahasia dari token bot (secara deterministik), bukan dari byte acak. Rahasia harus sama di seluruh proses yang membuat tombol dan Gateway yang melakukan verifikasi.

  </Accordion>
</AccordionGroup>

## Adaptor direktori

Plugin Mattermost menyertakan adaptor direktori yang mencocokkan nama kanal dan pengguna melalui API Mattermost. Hal ini memungkinkan target `#channel-name` dan `@username` dalam pengiriman `openclaw message send` serta cron/webhook.

Tidak diperlukan konfigurasi — adaptor menggunakan token bot dari konfigurasi akun.

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

Nilai akun menimpa bidang tingkat teratas; `channels.mattermost.defaultAccount` menentukan akun yang digunakan ketika tidak ada akun yang ditetapkan.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di kanal">
    Pastikan bot berada di kanal dan sebut bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau tetapkan `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Kesalahan autentikasi atau multiakun">
    - Periksa token bot, URL dasar, dan apakah akun diaktifkan.
    - Masalah multiakun: variabel lingkungan hanya berlaku untuk akun `default`.
    - Host Mattermost privat/LAN memerlukan `network.dangerouslyAllowPrivateNetwork: true` (perlindungan SSRF memblokir alamat IP privat secara default).

  </Accordion>
  <Accordion title="Perintah garis miring native gagal">
    - `Unauthorized: invalid command token.`: OpenClaw tidak menerima token callback. Penyebab umumnya:
      - pendaftaran perintah garis miring gagal atau hanya selesai sebagian saat dimulai
      - callback mencapai Gateway/akun yang salah
      - Mattermost masih memiliki perintah lama yang mengarah ke target callback sebelumnya
      - Gateway dimulai ulang tanpa mengaktifkan kembali perintah garis miring
    - Jika perintah garis miring native berhenti berfungsi, periksa log untuk `mattermost: failed to register slash commands` atau `mattermost: native slash commands enabled but no commands could be registered`.
    - Jika `callbackUrl` tidak dicantumkan dan log memperingatkan bahwa callback diresolusikan ke URL loopback seperti `http://localhost:18789/...`, URL tersebut mungkin hanya dapat dijangkau ketika Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw. Sebagai gantinya, tetapkan `commands.callbackUrl` eksplisit yang dapat dijangkau dari luar.

  </Accordion>
  <Accordion title="Masalah tombol">
    - Tombol tampil sebagai kotak putih atau tidak tampil sama sekali: data tombol rusak. Setiap tombol presentasi memerlukan `label` dan `value` (tombol yang tidak memiliki salah satunya akan dibuang).
    - Tombol dirender tetapi klik tidak melakukan apa pun: pastikan Gateway dapat dijangkau dari server Mattermost, alamat IP server Mattermost disertakan dalam `channels.mattermost.interactions.allowedSourceIps` (tanpanya, hanya loopback yang diterima), dan `ServiceSettings.AllowedUntrustedInternalConnections` menyertakan host callback untuk target privat.
    - Tombol menghasilkan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router tindakan Mattermost gagal pada ID nonalfanumerik. Hanya gunakan `[a-zA-Z0-9]`.
    - Gateway mencatat `rejected callback source`: klik berasal dari alamat IP di luar `interactions.allowedSourceIps`. Tambahkan server Mattermost atau ingress Anda ke daftar yang diizinkan, dan tetapkan `gateway.trustedProxies` di belakang proksi terbalik.
    - Gateway mencatat `invalid _token`: HMAC tidak cocok. Pastikan Anda menandatangani semua bidang konteks (bukan hanya sebagian), menggunakan kunci yang diurutkan, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
    - Gateway mencatat `missing _token in context`: bidang `_token` tidak ada dalam konteks tombol. Pastikan bidang tersebut disertakan saat membuat payload integrasi.
    - Gateway menolak klik dengan `Unknown action`: `context.action_id` tidak cocok dengan `id` tindakan mana pun pada kiriman. Tetapkan keduanya ke nilai tersanitasi yang sama.
    - Agen tidak menawarkan tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi kanal Mattermost.

  </Accordion>
</AccordionGroup>

## Terkait

- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
