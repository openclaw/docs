---
read_when:
    - Menghubungkan OpenClaw ke ruang kerja ClickClack
    - Menguji identitas bot ClickClack
summary: Penyiapan kanal token bot ClickClack dan sintaks target
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T17:44:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack menghubungkan OpenClaw ke ruang kerja ClickClack yang dihosting sendiri melalui token bot ClickClack kelas utama.

Gunakan ini jika Anda ingin agen OpenClaw tampil sebagai pengguna bot ClickClack. ClickClack mendukung bot layanan independen dan bot milik pengguna; bot milik pengguna mempertahankan `owner_user_id` dan hanya menerima cakupan token yang Anda berikan.

## Penyiapan cepat

Di ClickClack, buka **Workspace settings → Integrations → OpenClaw**, buat
bot, lalu salin tokennya. Kemudian konfigurasikan channel:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` menerima id ruang kerja (`wsp_...`), slug, atau nama tampilan.
`channels add` memverifikasi server, token, dan ruang kerja setelah menyimpan, lalu
melaporkan apakah Gateway yang sedang berjalan telah mengambil akun baru tersebut. Jika OpenClaw
sudah berjalan, ClickClack terhubung secara otomatis dan tidak diperlukan perintah
kedua. Jika belum, mulai dengan:

```bash
openclaw gateway
```

Untuk penyiapan terpandu, jalankan:

```bash
openclaw onboard
```

Pilih ClickClack, lalu masukkan URL server, token bot, dan ruang kerja saat
diminta. Penyiapan terpandu memeriksa server, token, dan ruang kerja setelah menyimpan;
pemeriksaan yang gagal tidak membuang konfigurasi.

### Alternatif: token berbasis variabel lingkungan

Akun default dapat membaca `CLICKCLACK_BOT_TOKEN` alih-alih menyimpan token
dalam konfigurasi:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Akun bernama harus menggunakan token yang dikonfigurasi atau berkas token; variabel
lingkungan bersama sengaja dibatasi untuk akun default.

### Referensi JSON5

Bentuk konfigurasi yang setara adalah:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Sebuah akun dianggap telah dikonfigurasi hanya jika `baseUrl`, sumber token, dan
`workspace` semuanya ditetapkan. Sumber token dapat berupa `token`, `tokenFile`, atau
`CLICKCLACK_BOT_TOKEN` untuk akun default. `workspace` menerima id ruang kerja
(`wsp_...`), slug, atau nama; Gateway menguraikannya menjadi id saat dimulai.

### Kunci konfigurasi akun

| Kunci                     | Default             | Catatan                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | tidak ada (wajib)     | URL server ClickClack.                                                                  |
| `token`                 | tidak ada                | Token bot sebagai string biasa atau referensi rahasia (`source: "env" \| "file" \| "exec"`).        |
| `tokenFile`             | tidak ada                | Jalur ke berkas token bot; diprioritaskan daripada `token`.                                |
| `workspace`             | tidak ada (wajib)     | Id, slug, atau nama ruang kerja.                                                            |
| `replyMode`             | `"agent"`           | `"agent"` menjalankan seluruh pipeline agen; `"model"` mengirim penyelesaian model langsung yang singkat. |
| `defaultTo`             | `"channel:general"` | Target yang digunakan ketika jalur keluar tidak memberikan target.                                      |
| `allowFrom`             | `["*"]`             | Daftar izin id pengguna untuk DM dan pesan channel masuk.                                 |
| `botUserId`             | terdeteksi otomatis       | Diuraikan dari identitas token bot saat dimulai.                                        |
| `agentId`               | default rute       | Sematkan pesan masuk akun ini ke satu agen.                                       |
| `toolsAllow`            | tidak ada                | Daftar izin alat untuk balasan agen dari akun ini.                                     |
| `model`, `systemPrompt` | tidak ada                | Digunakan oleh penyelesaian `replyMode: "model"`.                                               |
| `commandMenu`           | `true`              | Publikasikan perintah native ke pelengkapan otomatis komposer ClickClack.                            |
| `reconnectMs`           | `1500`              | Penundaan koneksi ulang waktu nyata (100 hingga 60000).                                                |

Jika `plugins.allow` adalah daftar pembatas yang tidak kosong, memilih
ClickClack secara eksplisit dalam penyiapan channel atau menjalankan `openclaw plugins enable clickclack`
akan menambahkan `clickclack` ke daftar tersebut. Instalasi saat onboarding menggunakan
perilaku pemilihan eksplisit yang sama. Jalur-jalur ini tidak menimpa `plugins.deny` atau
pengaturan global `plugins.enabled: false`. Penggunaan langsung
`openclaw plugins install @openclaw/clickclack` mengikuti kebijakan instalasi
Plugin normal dan juga mencatat ClickClack dalam daftar izin yang sudah ada.

## Beberapa bot

Setiap akun membuka koneksi waktu nyata ClickClack-nya sendiri dan menggunakan token botnya sendiri.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Mode balasan

- `replyMode: "agent"` (default) meneruskan pesan masuk melalui pipeline agen normal, termasuk pencatatan sesi dan kebijakan alat.
- `replyMode: "model"` melewati pipeline agen dan menggunakan `llm.complete` milik runtime Plugin untuk balasan bot langsung, yang secara opsional dibentuk oleh `model` dan `systemPrompt`. Penyedia dan model yang dipilih memiliki anggaran penyelesaian.

Mode model menjalankan penyelesaian terhadap id agen bot yang telah diuraikan, yang memerlukan
bit kepercayaan `plugins.entries.clickclack.llm.allowAgentIdOverride: true` eksplisit:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Biarkan bit kepercayaan nonaktif jika Anda hanya menggunakan mode balasan `agent` default;
bit ini tidak diperlukan di sana.

## Menu perintah

Saat Gateway dimulai, setiap akun yang dikonfigurasi memublikasikan perintah native
OpenClaw ke ClickClack. Perintah tersebut muncul dalam pelengkapan otomatis komposer dengan label
handle bot. Kumpulan yang dipublikasikan diganti seluruhnya setiap kali dimulai,
termasuk menghapus menu usang ketika katalog perintah native kosong.

Sinkronisasi menu perintah diaktifkan secara default. Tetapkan `commandMenu: false` pada akun
untuk menonaktifkannya:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Token memerlukan `commands:write`. Bundel ClickClack `bot:write` dan
`bot:admin` saat ini menyertakan cakupan tersebut, dan cakupan itu juga dapat diberikan
secara individual. Token yang dibuat sebelum menu perintah diperkenalkan mungkin perlu
ditambahkan cakupan tersebut atau diganti dengan token baru.

Sinkronisasi dilakukan dengan upaya terbaik dan berjalan sekali setiap kali Gateway dimulai. Cakupan yang tidak ada atau kegagalan
jaringan mencatat peringatan; server ClickClack lama tanpa endpoint tersebut mencatatnya pada
tingkat debug. Tidak satu pun kegagalan ini menghalangi dimulainya koneksi waktu nyata. Menu tetap
tersedia saat agen luring dan dihapus ketika bot meninggalkan
ruang kerja.

Rilis ini hanya memublikasikan spesifikasi perintah native. Alias dan
katalog perintah Skills, Plugin, atau khusus tidak ditambahkan ke menu. Jika suatu
nama juga didaftarkan sebagai perintah garis miring HTTP, ClickClack akan meneruskan
pendaftaran tersebut terlebih dahulu; perintah menu lainnya tetap melalui pengiriman
pesan normal.

Gunakan mode `agent` untuk bukti korelasi lintas layanan. Untuk id pesan
ClickClack otoritatif dalam bentuk kanonis `msg_<ulid>`, channel menurunkan
id proses OpenClaw deterministik `clickclack:<message-id>`. Setiap panggilan model kemudian
terlihat dalam diagnostik sebagai `clickclack:<message-id>:model:<n>`; ketika giliran tersebut
menggunakan ClawRouter, id panggilan model yang sama dikirim sebagai `X-Request-ID`.
Mode `model` melewati diagnostik proses/sesi agen normal sehingga
tidak cocok untuk jalur bukti ini.

Ketika peristiwa waktu nyata berisi `payload.correlation_id` yang telah divalidasi,
channel membawanya sebagai `X-Correlation-ID` pada pengambilan pesan otoritatif dan
permintaan balasan ClickClack yang dihasilkan. Nilai menggunakan kumpulan aman
128 karakter ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, dan `-`); nilai yang tidak valid
dihilangkan. Penggabungan ini hanya berisi pengidentifikasi, tidak pernah berisi isi pesan,
prompt, penyelesaian, kredensial, atau keluaran alat.

## Pengiriman media tahan lama

Balasan agen yang berisi media menggunakan pengiriman tahan lama yang diwajibkan. OpenClaw menetapkan
nonce pesan dan unggahan per bagian yang stabil sebelum penulisan pertama ke ClickClack, sehingga
percobaan ulang menggunakan kembali unggahan dan pesan yang sama alih-alih menghabiskan kuota penyimpanan
atau memublikasikan duplikat. Jika unggahan sudah ada setelah dimulai ulang,
OpenClaw tidak membaca ulang jalur lokal asli atau URL media jarak jauh.

Kontrak pemulihan ini memerlukan server ClickClack yang mendukung:

- `GET /api/uploads/by-nonce` dengan
  `X-ClickClack-Upload-Nonce: supported` pada hasil yang ditemukan dan tidak ditemukan.
- `GET /api/messages/by-nonce` dengan
  `X-ClickClack-Message-Nonce: supported` pada hasil yang ditemukan dan tidak ditemukan.
- Pembuatan pesan idempoten dan pengaitan lampiran untuk nonce dan unggahan
  bercakupan pemilik yang sama.

404 generik dari server lama tidak dianggap sebagai bukti bahwa pengiriman tidak ada.
OpenClaw membiarkan pengiriman belum terselesaikan alih-alih mengambil risiko duplikasi; perbarui
ClickClack sebelum mengaktifkan balasan agen yang menghasilkan media.

## Baris aktivitas agen

Secara default, channel ClickClack tidak menampilkan apa pun saat giliran agen berjalan; hanya balasan akhir yang dikirim. Tetapkan `agentActivity: true` pada akun untuk memublikasikan baris pesan `agent_commentary` dan `agent_tool` yang tahan lama selama giliran sedang berlangsung:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Persyaratan dan perilaku:

- **Nonaktif secara default.** Penyiapan standar dan server ClickClack lama tidak terpengaruh.
- **Memerlukan cakupan token `agent_activity:write`.** Cakupan ini terpisah dari `bot:write` dan tidak diwariskan olehnya; buat token bot dengan `--scopes bot:write,agent_activity:write` (atau berikan cakupan tersebut kepada token yang sudah ada) sebelum mengaktifkan opsi ini.
- **Degradasi dengan upaya terbaik.** Jika token tidak memiliki `agent_activity:write` atau server menolak penulisan aktivitas, kegagalan dicatat dan balasan akhir tetap dikirim secara normal; tidak ada baris aktivitas yang muncul.
- Baris dikelompokkan per giliran (`turn_id`), digabungkan sehingga satu langkah logis menjadi satu baris, dan baris alat menggunakan format progres yang sama seperti Discord/Slack/Telegram (nama alat beserta detail perintah).
- **Metadata atribusi.** Kiriman yang dibuat agen (baris aktivitas dan balasan akhir) membawa kolom `author_model` dan `author_thinking` yang diuraikan dari model aktual yang digunakan untuk giliran tersebut (termasuk setelah fallback). Server yang tidak mendefinisikan kolom-kolom ini mengabaikan kolom JSON yang tidak dikenal; server yang menyimpannya dapat menjawab "model mana yang menyampaikan baris ini, pada tingkat pemikiran mana" untuk setiap pesan.

## Target

- `channel:<name-or-id>` mengirim ke kanal ruang kerja. Target tanpa awalan secara default menggunakan `channel:`.
- `dm:<user_id>` membuat atau menggunakan kembali percakapan langsung dengan pengguna tersebut.
- `thread:<message_id>` membalas dalam utas yang berakar pada pesan tersebut.

Target keluar eksplisit juga dapat memuat prefiks penyedia `clickclack:` atau `cc:`.

Media keluar menggunakan API unggahan ClickClack, lalu melampirkan unggahan persisten
ke pesan kanal, balasan utas, atau DM yang dibuat. File lokal dan URL media jarak jauh
yang didukung mengikuti kebijakan akses media normal OpenClaw, dengan batas 64 MiB
per file. Pengiriman persisten yang diantrekan menggunakan nonce terpisah dengan cakupan pemilik untuk setiap
unggahan dan bagian pesan, lalu mencoba kembali pengaitan lampiran dengan objek yang sama.
Lihat [Pengiriman media persisten](#durable-media-delivery) untuk mengetahui kontrak server
dan perilaku pemulihan.

Contoh:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Izin

Cakupan token ClickClack diberlakukan oleh API ClickClack.

- `bot:read`: membaca data ruang kerja/kanal/pesan/utas/DM/waktu nyata/profil.
- `bot:write`: `bot:read` ditambah pesan kanal, balasan utas, DM, unggahan, dan penerbitan menu perintah.
- `bot:admin`: `bot:write` ditambah pembuatan kanal.
- `commands:write`: menerbitkan menu perintah bot. Disertakan dalam bundel `bot:write` dan `bot:admin` saat ini serta dapat diberikan secara terpisah.
- `agent_activity:write`: baris aktivitas agen persisten (`agent_commentary` / `agent_tool`). Tidak diwarisi oleh `bot:write` atau `bot:admin`; hanya diperlukan jika `agentActivity: true` ditetapkan.

OpenClaw hanya memerlukan `bot:write` saat ini untuk percakapan agen normal dan sinkronisasi menu perintah. Tambahkan `agent_activity:write` saat mengaktifkan [baris aktivitas agen](#agent-activity-rows).

## Pemecahan masalah

- `ClickClack is not configured for account "<id>"`: tetapkan `baseUrl`, `token` (misalnya melalui `CLICKCLACK_BOT_TOKEN`), dan `workspace` untuk akun tersebut.
- `ClickClack workspace not found: <value>`: tetapkan `workspace` ke id, slug, atau nama ruang kerja yang dikembalikan oleh ClickClack.
- Tidak ada balasan masuk: pastikan token memiliki akses baca waktu nyata dan perhatikan bahwa bot mengabaikan pesannya sendiri serta pesan dari bot lain.
- Pengiriman ke kanal gagal: pastikan bot merupakan anggota ruang kerja dan memiliki `bot:write`.
- Tidak ada menu perintah: pastikan `commandMenu` bukan `false`, server ClickClack mendukung `PUT /api/bots/self/commands`, dan token memiliki `commands:write`.
