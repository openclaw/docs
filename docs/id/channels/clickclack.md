---
read_when:
    - Menghubungkan OpenClaw ke ruang kerja ClickClack
    - Menguji identitas bot ClickClack
summary: Penyiapan kanal token bot ClickClack dan sintaks target
title: ClickClack
x-i18n:
    generated_at: "2026-07-21T12:31:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 761538cdd7a916415719131b9ff2f40bf3e3e0eab0f7bda450250886acde8a64
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack menghubungkan OpenClaw ke ruang kerja ClickClack yang dihosting sendiri melalui token bot ClickClack kelas utama.

Gunakan ini saat Anda ingin agen OpenClaw tampil sebagai pengguna bot ClickClack. ClickClack mendukung bot layanan independen dan bot milik pengguna; bot milik pengguna mempertahankan `owner_user_id` dan hanya menerima cakupan token yang Anda berikan.

## Penyiapan cepat

Di ClickClack, buka **Workspace settings → Integrations → OpenClaw**, buat
bot menggunakan **Setup code (recommended)**, lalu salin perintah yang dihasilkan:

```bash
openclaw channels add clickclack --code 'https://clickclack.example.com/#XXXX-XXXX-XXXX'
```

Untuk origin frontend dan API yang terpisah atau API yang dipasang pada suatu path, ClickClack akan menghasilkan
endpoint klaim yang tepat sebagai gantinya:

```bash
openclaw channels add clickclack --code 'https://api.example.com/services/clickclack/api/bot-setup-codes/claim#XXXX-XXXX-XXXX'
```

Kode penyiapan hanya dapat digunakan sekali dan kedaluwarsa setelah 10 menit. OpenClaw mengklaimnya,
menerima token bot yang baru dibuat beserta pengaturan ruang kerja, menyimpan akun,
memverifikasi koneksi, dan melaporkan apakah Gateway yang sedang berjalan telah mendeteksinya.
Untuk endpoint tepat dengan versi, OpenClaw memvalidasi dan menyimpan basis API
kanonis yang dikembalikan oleh ClickClack, termasuk prefiks path apa pun. Kode penyiapan itu sendiri
tidak disimpan dalam konfigurasi OpenClaw.

Klaim kode penyiapan menggunakan HTTPS untuk server publik. HTTP biasa juga didukung untuk
instalasi lokal pada alamat loopback seperti `localhost` dan `127.0.0.1`.

Jika OpenClaw sudah berjalan, ClickClack tersambung secara otomatis dan tidak diperlukan
perintah kedua. Jika belum, jalankan dengan:

```bash
openclaw gateway
```

Anda juga dapat memberikan kode secara terpisah dari URL server:

```bash
openclaw channels add clickclack --code XXXX-XXXX-XXXX --base-url https://clickclack.example.com
```

Untuk penyiapan terpandu, jalankan:

```bash
openclaw onboard
```

Pilih ClickClack, lalu masukkan URL server, token bot, dan ruang kerja saat
diminta. Penyiapan terpandu memeriksa server, token, dan ruang kerja setelah penyimpanan; pemeriksaan
yang gagal tidak membuang konfigurasi.

### Alternatif: token manual

Pilih **Manual token** di ClickClack saat mengonfigurasi klien non-OpenClaw atau
saat Anda secara eksplisit perlu mengelola token sendiri:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` menerima id ruang kerja (`wsp_...`), slug, atau nama tampilan.
`--code` tidak dapat digabungkan dengan `--token`, `--token-file`, atau `--use-env`.

### Alternatif: token berbasis lingkungan

Akun default dapat membaca `CLICKCLACK_BOT_TOKEN` alih-alih menyimpan token
dalam konfigurasi:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Akun bernama harus menggunakan token yang dikonfigurasi atau berkas token; variabel lingkungan
bersama sengaja dibatasi hanya untuk akun default.

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

Akun dianggap terkonfigurasi hanya jika `baseUrl`, sumber token, dan
`workspace` semuanya ditetapkan. Sumber token dapat berupa `token`, `tokenFile`, atau
`CLICKCLACK_BOT_TOKEN` untuk akun default. `workspace` menerima id ruang kerja
(`wsp_...`), slug, atau nama; Gateway menguraikannya menjadi id saat dimulai.

### Kunci konfigurasi akun

| Kunci                   | Default             | Catatan                                                                                 |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | tidak ada (wajib)   | URL ClickClack publik yang digunakan untuk tautan yang ditampilkan di browser.           |
| `apiBaseUrl`            | `baseUrl`           | Endpoint server-ke-server opsional untuk lalu lintas REST dan WebSocket waktu nyata.     |
| `token`                 | tidak ada           | Token bot sebagai string biasa atau referensi rahasia (`source: "env" \| "file" \| "exec"`).              |
| `tokenFile`             | tidak ada           | Path ke berkas token bot; lebih diprioritaskan daripada `token`.              |
| `workspace`             | tidak ada (wajib)   | Id, slug, atau nama ruang kerja.                                                         |
| `replyMode`             | `"agent"`           | `"agent"` menjalankan pipeline agen lengkap; `"model"` mengirim penyelesaian model langsung yang singkat. |
| `defaultTo`             | `"channel:general"` | Target yang digunakan saat jalur keluar tidak memberikan target.                        |
| `allowFrom`             | `["*"]`             | Daftar izin id pengguna untuk DM dan pesan kanal masuk.                                  |
| `botUserId`             | terdeteksi otomatis | Diuraikan dari identitas token bot saat dimulai.                                         |
| `agentId`               | default rute        | Sematkan pesan masuk akun ini ke satu agen.                                              |
| `toolsAllow`            | tidak ada           | Daftar izin alat untuk balasan agen dari akun ini.                                       |
| `model`, `systemPrompt` | tidak ada           | Digunakan oleh penyelesaian `replyMode: "model"`.                                          |
| `commandMenu`           | `true`              | Publikasikan perintah native ke pelengkapan otomatis komposer ClickClack.                |
| `reconnectMs`           | `1500`              | Jeda penyambungan ulang waktu nyata (100 hingga 60000).                                  |
| `discussions`           | dinonaktifkan       | Pengaturan kanal per sesi yang dikelola; lihat [Diskusi sesi](#session-discussions).     |

### Pertahankan nama host publik yang dilindungi autentikasi

Gunakan `apiBaseUrl` saat ClickClack dan Gateway OpenClaw berjalan pada host yang sama
tetapi nama host ClickClack publik dilindungi oleh Gateway autentikasi
seperti Cloudflare Access:

```json5
{
  channels: {
    clickclack: {
      baseUrl: "https://clack.openclaw.ai",
      apiBaseUrl: "http://127.0.0.1:8484",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
    },
  },
}
```

Nama host publik dapat tetap sepenuhnya dilindungi autentikasi bagi pengguna browser. OpenClaw
menggunakan endpoint loopback untuk permintaan REST, verifikasi penyiapan, dan
WebSocket waktu nyata, sementara tautan `embedUrl` dan `openUrl` diskusi tetap
menggunakan `baseUrl` publik. Jika `apiBaseUrl` tidak disertakan, semua lalu lintas menggunakan
`baseUrl`, sehingga mempertahankan perilaku yang ada.

Jika `plugins.allow` adalah daftar restriktif yang tidak kosong, memilih
ClickClack secara eksplisit dalam penyiapan kanal atau menjalankan `openclaw plugins enable clickclack`
akan menambahkan `clickclack` ke daftar tersebut. Instalasi melalui orientasi menggunakan perilaku
pemilihan eksplisit yang sama. Jalur-jalur ini tidak mengganti `plugins.deny` atau
pengaturan `plugins.enabled: false` global. Perintah langsung
`openclaw plugins install @openclaw/clickclack` mengikuti kebijakan
instalasi Plugin normal dan juga mencatat ClickClack dalam daftar izin yang sudah ada.

## Beberapa bot

Setiap akun membuka koneksi waktu nyata ClickClack sendiri dan menggunakan token botnya sendiri.

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

## Diskusi sesi

Aktifkan diskusi pada satu akun ClickClack agar setiap sesi OpenClaw memiliki
kanal ClickClack khusus. Token akun harus menyertakan
`channels:write` (bundel `bot:admin` menyertakannya); token penyiapan `bot:write`
biasa tidak dapat membuat atau menyinkronkan kanal.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      discussions: {
        enabled: true,
        workspace: "default",
        controlUrlBase: "https://team.openclaw.ai",
        section: "Sessions",
      },
    },
  },
}
```

`discussions.workspace` menerima id, slug, atau nama tampilan ruang kerja yang sama
seperti `workspace` tingkat akun dan secara default menggunakan nilai tersebut. `section` mengontrol
bagian bilah sisi ClickClack dan secara default menggunakan `Sessions`. Saat
`controlUrlBase` ditetapkan, kanal terkelola menaut kembali ke rute sesi Control UI
yang sebenarnya, `/chat?session=<encoded-session-key>`.

Aktifkan diskusi pada tepat satu akun ClickClack. Penyedia Gateway tidak memiliki
pemilih akun, sehingga beberapa akun diskusi yang diaktifkan akan ditolak
alih-alih memilih salah satunya berdasarkan urutan konfigurasi.

Membuka diskusi akan membuat kanal ClickClack publik yang ditandai sebagai dikelola
secara eksternal. Plugin menjaga label sesi, kategori, dan status arsip tetap
sinkron. Memulihkan sesi akan memulihkan kanalnya; menghapus kategori sesi
akan memindahkan kanal kembali ke bagian default yang dikonfigurasi. Menghapus
sesi OpenClaw akan mengarsipkan kanal ClickClack alih-alih menghapusnya, sehingga
riwayatnya tetap tersedia. Plugin merekonsiliasi pengikatan saat RPC diskusi
digunakan dan kira-kira sekali per menit selama ada pengikatan.

Pesan masuk dalam kanal terkelola menggunakan sesi samping deterministik di bawah
id agen yang sama dengan sesi utama yang terlampir. Agen samping diberi tahu sesi
utama mana yang harus diamati dan dapat menggunakan `sessions_history` dan `session_status`
(`changesSince` berguna untuk pemeriksaan inkremental). Agen tersebut hanya menggunakan `sessions_send`
saat orang-orang dalam diskusi memintanya meneruskan pesan atau mengarahkan sesi utama.
Pengikatan, referensi kepemilikan terkelola, dan identitas peer sesi samping menyertakan
id sesi OpenClaw konkret beserta server dan kanal ClickClack yang disematkan.
Mengatur ulang kunci sesi yang dapat digunakan kembali atau mengarahkan ulang akun akan mencabut
kanal lama secara lokal, mengarsipkannya jika kredensial lama masih dapat digunakan, dan
tidak dapat menggunakan kembali transkrip sampingnya. Pesan yang tiba melalui pengikatan
yang diarsipkan, diatur ulang, dinonaktifkan, atau diarahkan ulang akan dibuang alih-alih dialihkan
ke perutean kanal normal akun. Pengikatan yang dilepas meninggalkan penanda
kanal tercabut yang persisten agar peristiwa waktu nyata yang tertunda tetap gagal secara tertutup. Kepemilikan
jarak jauh dikunci berdasarkan server ClickClack dan id kanal, sehingga mengganti nama akun lokal
tidak dapat mengubah kanal terkelola menjadi kanal biasa.

Pertahankan `tools.sessions.visibility` pada default `tree` yang lebih aman. Plugin
memasang izin dengan cakupan host hanya antara setiap sesi samping dan sesi
utama yang terlampir, serta hook kebijakan alat yang memblokir penemuan sesi dan
target lintas sesi. Plugin mengizinkan `sessions_history`, `session_status`, dan
`sessions_send` hanya untuk sesi utama yang terlampir dan mencegah panggilan status
mengubah model sesi tersebut. Alat-alat itu tetap harus tersedia dalam
daftar izin alat efektif agen. Prompt sistem merupakan panduan; izin host
dan hook tersebut adalah batas otorisasi.

Server ClickClack harus mendukung bidang channel terkelola (`external_managed`,
`external_ref`, `external_url`, dan `sidebar_section`) saat pembuatan dan
pembaruan channel serta mengembalikannya dalam respons channel. OpenClaw memverifikasi kontrak tersebut
sebelum menyimpan pengikatan. Jika respons pembuatan hilang, pembukaan berikutnya mengadopsi
channel berdasarkan `external_ref` yang diberlakukan server alih-alih membuat channel lain.
Hingga hasil tersebut direkonsiliasi, reservasi yang tertunda mengarantina
peristiwa yang seharusnya tidak terikat di ruang kerja tujuan. Rekonsiliator kasar
mengadopsi channel ketika sesi yang sama masih aktif atau mengarsipkannya setelah
reset; rekonsiliator menghapus reservasi ketika tidak ada channel jarak jauh yang dibuat.
Referensi tersebut berisi namespace permanen per instalasi OpenClaw serta
hash kunci sesi, id sesi konkret, tujuan ClickClack, dan generasi
pengikatan permanen. Gateway yang terpisah tidak dapat mengadopsi channel milik satu sama lain,
sesi yang direset tidak dapat mewarisi riwayat channel lama, dan perjalanan bolak-balik akun atau ruang kerja
tidak dapat mengadopsi kembali channel sebelumnya. Pengikatan juga disematkan ke
URL server ClickClack yang dikonfigurasi dan dibatalkan jika akun
diarahkan ulang. Mengubah atau menghapus `controlUrlBase` memperbarui atau menghapus tautan
channel terkelola pada proses rekonsiliasi berikutnya. Mengubah
`discussions.workspace` mengarsipkan dan melepaskan pengikatan lama sebelum channel
dapat dibuka di ruang kerja baru ketika kredensial ruang kerja lama tetap
dikonfigurasi. Jika token diganti dengan kredensial yang dicakup untuk ruang kerja yang
tidak dapat mengakses ruang kerja lama, OpenClaw mencatat channel lama sebagai dicabut dan
melepaskan pengikatan tanpa mencoba token pengganti; arsipkan channel yang tersisa tersebut
dari ClickClack.

Sesi utama yang terlampir juga menerima alat `discussion` yang hanya dapat menarik data. Alat ini membaca
pesan terbaru dan balasan utas terkini sebagai satu catatan yang di-escape dan diberi atribusi
per pesan, serta tidak memiliki efek samping penulisan atau siklus hidup. Pencarian akar channel dan utas
memiliki anggaran permintaan tetap; hasilnya secara eksplisit memperingatkan ketika
batas keamanan tersebut dapat mengabaikan utas aktif yang lebih lama.

## Mode balasan

- `replyMode: "agent"` (default) mengirimkan pesan masuk melalui pipeline agen normal, termasuk pencatatan sesi dan kebijakan alat.
- `replyMode: "model"` melewati pipeline agen dan menggunakan `llm.complete` milik runtime plugin untuk balasan bot langsung, yang secara opsional dibentuk oleh `model` dan `systemPrompt`. Penyedia dan model yang dipilih memiliki anggaran penyelesaian.

Mode model menjalankan penyelesaian terhadap id agen bot yang telah diresolusikan, yang memerlukan
bit kepercayaan `plugins.entries.clickclack.llm.allowAgentIdOverride: true` secara eksplisit:

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

Biarkan bit kepercayaan dinonaktifkan jika Anda hanya menggunakan mode balasan `agent` default; bit tersebut
tidak diperlukan di sana.

## Menu perintah

Saat Gateway dimulai, setiap akun yang dikonfigurasi memublikasikan perintah native
OpenClaw ke ClickClack. Perintah tersebut muncul dalam pelengkapan otomatis composer dengan label
handle bot. Kumpulan yang dipublikasikan diganti seluruhnya setiap kali dimulai,
termasuk menghapus menu usang ketika katalog perintah native kosong.

Sinkronisasi menu perintah diaktifkan secara default. Atur `commandMenu: false` pada akun
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

Token memerlukan `commands:write`. Bundel `bot:write` dan
`bot:admin` ClickClack saat ini mencakup cakupan tersebut, dan cakupan itu juga dapat diberikan
secara individual. Token yang dibuat sebelum menu perintah diperkenalkan mungkin perlu
ditambahkan cakupan tersebut atau diganti dengan token baru.

Sinkronisasi dilakukan dengan upaya terbaik dan berjalan sekali setiap kali Gateway dimulai. Cakupan yang tidak ada atau kegagalan
jaringan mencatat peringatan; server ClickClack lama tanpa endpoint tersebut mencatatnya pada
tingkat debug. Tidak satu pun kegagalan ini memblokir proses awal realtime. Menu tetap
tersedia saat agen offline dan dihapus ketika bot meninggalkan
ruang kerja.

Rilis ini hanya memublikasikan spesifikasi perintah native. Alias dan
katalog perintah Skills, Plugin, atau kustom tidak ditambahkan ke menu. Jika suatu
nama juga terdaftar sebagai perintah garis miring HTTP, ClickClack mengirimkan
pendaftaran tersebut terlebih dahulu; perintah menu lainnya tetap melalui pengiriman
pesan normal.

Gunakan mode `agent` untuk bukti korelasi lintas layanan. Untuk id pesan
ClickClack otoritatif dalam bentuk kanonis `msg_<ulid>`, channel memperoleh
id proses OpenClaw deterministik `clickclack:<message-id>`. Setiap pemanggilan model
kemudian terlihat dalam diagnostik sebagai `clickclack:<message-id>:model:<n>`; ketika
giliran tersebut menggunakan ClawRouter, id pemanggilan model yang sama dikirim sebagai `X-Request-ID`.
Mode `model` melewati diagnostik proses/sesi agen normal dan karenanya
tidak sesuai untuk jalur bukti ini.

Ketika peristiwa realtime berisi `payload.correlation_id` yang telah divalidasi,
channel membawanya sebagai `X-Correlation-ID` pada pengambilan pesan otoritatif dan
permintaan balasan ClickClack yang dihasilkan. Nilai menggunakan himpunan aman
128 karakter milik ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, dan `-`); nilai yang tidak valid
dihilangkan. Penggabungan ini hanya berisi pengidentifikasi, tidak pernah berisi isi pesan,
prompt, penyelesaian, kredensial, atau keluaran alat.

## Pengiriman media permanen

Balasan agen yang berisi media menggunakan pengiriman permanen yang diwajibkan. OpenClaw menetapkan
nonce pesan dan unggahan yang stabil untuk setiap bagian sebelum penulisan ClickClack pertama, sehingga
percobaan ulang menggunakan kembali unggahan dan pesan yang sama alih-alih menghabiskan kuota penyimpanan
atau memublikasikan duplikat. Jika unggahan sudah ada setelah dimulai ulang,
OpenClaw tidak membaca ulang jalur lokal asli atau URL media jarak jauh.

Kontrak pemulihan ini memerlukan server ClickClack yang mendukung:

- `GET /api/uploads/by-nonce` dengan
  `X-ClickClack-Upload-Nonce: supported` pada hasil yang ditemukan dan tidak ditemukan.
- `GET /api/messages/by-nonce` dengan
  `X-ClickClack-Message-Nonce: supported` pada hasil yang ditemukan dan tidak ditemukan.
- Pembuatan pesan dan pengaitan lampiran yang idempoten untuk nonce dan unggahan
  yang sama dalam cakupan pemilik.

404 generik dari server lama tidak dianggap sebagai bukti bahwa pengiriman tidak ada.
OpenClaw membiarkan pengiriman belum terselesaikan alih-alih mengambil risiko duplikasi; perbarui
ClickClack sebelum mengaktifkan balasan agen yang menghasilkan media.

## Baris aktivitas agen

Secara default, channel ClickClack tidak menampilkan apa pun selama giliran agen berjalan; hanya balasan akhir yang ditampilkan. Atur `agentActivity: true` pada akun untuk memublikasikan baris pesan `agent_commentary` dan `agent_tool` yang permanen saat giliran sedang berlangsung:

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

- **Dinonaktifkan secara default.** Penyiapan standar dan server ClickClack lama tidak terpengaruh.
- **Memerlukan cakupan token `agent_activity:write`.** Cakupan ini terpisah dari `bot:write` dan tidak diwarisi darinya; buat token bot dengan `--scopes bot:write,agent_activity:write` (atau berikan cakupan tersebut kepada token yang sudah ada) sebelum mengaktifkan opsi.
- **Degradasi dengan upaya terbaik.** Jika token tidak memiliki `agent_activity:write` atau server menolak penulisan aktivitas, kegagalan dicatat dan balasan akhir tetap dikirim secara normal; tidak ada baris aktivitas yang muncul.
- Baris dikelompokkan per giliran (`turn_id`), digabungkan sehingga satu langkah logis menjadi satu baris, dan baris alat menggunakan pemformatan progres yang sama seperti Discord/Slack/Telegram (nama alat beserta detail perintah).
- **Metadata atribusi.** Kiriman yang dibuat agen (baris aktivitas dan balasan akhir) membawa bidang `author_model` dan `author_thinking` yang diresolusikan dari model aktual yang digunakan untuk giliran tersebut (termasuk setelah fallback). Server yang tidak mendefinisikan kolom ini mengabaikan bidang JSON yang tidak dikenal; server yang menyimpannya dapat menjawab "model mana yang mengatakan baris ini, pada tingkat pemikiran apa" untuk setiap pesan.

## Target

- `channel:<name-or-id>` mengirim ke channel ruang kerja. Target tanpa awalan menggunakan `channel:` secara default.
- `dm:<user_id>` membuat atau menggunakan kembali percakapan langsung dengan pengguna tersebut.
- `thread:<message_id>` membalas dalam utas yang berakar pada pesan tersebut.

Target keluar eksplisit juga dapat membawa awalan penyedia `clickclack:` atau `cc:`.

Media keluar menggunakan API unggahan ClickClack lalu melampirkan unggahan permanen
ke pesan channel, balasan utas, atau DM yang dibuat. File lokal dan URL
media jarak jauh yang didukung mengikuti kebijakan akses media normal OpenClaw, dengan batas 64 MiB
per file. Pengiriman permanen yang masuk antrean menggunakan nonce terpisah dalam cakupan pemilik untuk setiap
unggahan dan bagian pesan, lalu mencoba ulang pengaitan lampiran dengan objek yang sama.
Lihat [Pengiriman media permanen](#durable-media-delivery) untuk kontrak server
dan perilaku pemulihan.

Contoh:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Izin

Cakupan token ClickClack diberlakukan oleh API ClickClack.

- `bot:read`: membaca data ruang kerja/channel/pesan/utas/DM/realtime/profil.
- `bot:write`: `bot:read` ditambah pesan channel, balasan utas, DM, unggahan, dan pemublikasian menu perintah.
- `bot:admin`: `bot:write` ditambah pembuatan channel.
- `commands:write`: memublikasikan menu perintah bot. Disertakan dalam bundel `bot:write` dan `bot:admin` saat ini dan dapat diberikan secara individual.
- `agent_activity:write`: baris aktivitas agen permanen (`agent_commentary` / `agent_tool`). Tidak diwarisi oleh `bot:write` atau `bot:admin`; hanya diperlukan ketika `agentActivity: true` ditetapkan.

OpenClaw hanya memerlukan `bot:write` saat ini untuk percakapan agen normal dan sinkronisasi menu perintah. Tambahkan `agent_activity:write` ketika mengaktifkan [baris aktivitas agen](#agent-activity-rows).

## Pemecahan masalah

- `ClickClack is not configured for account "<id>"`: atur `baseUrl`, `token` (misalnya melalui `CLICKCLACK_BOT_TOKEN`), dan `workspace` untuk akun tersebut.
- `ClickClack workspace not found: <value>`: atur `workspace` ke id, slug, atau nama ruang kerja yang dikembalikan oleh ClickClack.
- Tidak ada balasan masuk: pastikan token memiliki akses baca realtime dan perhatikan bahwa bot mengabaikan pesannya sendiri serta pesan dari bot lain.
- Pengiriman channel gagal: pastikan bot adalah anggota ruang kerja dan memiliki `bot:write`.
- Tidak ada menu perintah: pastikan `commandMenu` bukan `false`, server ClickClack mendukung `PUT /api/bots/self/commands`, dan token memiliki `commands:write`.
