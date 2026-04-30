---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matriks
x-i18n:
    generated_at: "2026-04-30T09:34:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah Plugin saluran bawaan untuk OpenClaw.
Matrix menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

## Plugin bawaan

Rilis OpenClaw terpaket saat ini menyertakan Plugin Matrix secara langsung. Anda tidak perlu menginstal apa pun; mengonfigurasi `channels.matrix.*` (lihat [Penyiapan](#setup)) adalah yang mengaktifkannya.

Untuk build lama atau instalasi kustom yang mengecualikan Matrix, instal paket npm
terkini saat sudah diterbitkan:

```bash
openclaw plugins install @openclaw/matrix
```

Jika npm melaporkan paket milik OpenClaw sebagai deprecated, gunakan build OpenClaw
terpaket terkini atau checkout lokal hingga paket npm yang lebih baru diterbitkan.

Dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` mendaftarkan dan mengaktifkan Plugin, sehingga langkah `openclaw plugins enable matrix` terpisah tidak diperlukan. Plugin tetap tidak melakukan apa pun hingga Anda mengonfigurasi saluran di bawah. Lihat [Plugin](/id/tools/plugin) untuk perilaku Plugin umum dan aturan instalasi.

## Penyiapan

1. Buat akun Matrix di homeserver Anda.
2. Konfigurasikan `channels.matrix` dengan `homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`.
3. Mulai ulang Gateway.
4. Mulai DM dengan bot, atau undang bot ke room (lihat [auto-join](#auto-join) — undangan baru hanya masuk saat `autoJoin` mengizinkannya).

### Penyiapan interaktif

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard meminta: URL homeserver, metode auth (token akses atau kata sandi), ID pengguna (hanya auth kata sandi), nama perangkat opsional, apakah akan mengaktifkan E2EE, dan apakah akan mengonfigurasi akses room serta auto-join.

Jika env var `MATRIX_*` yang cocok sudah ada dan akun yang dipilih tidak memiliki auth tersimpan, wizard menawarkan pintasan env-var. Untuk menyelesaikan nama room sebelum menyimpan allowlist, jalankan `openclaw channels resolve --channel matrix "Project Room"`. Saat E2EE diaktifkan, wizard menulis konfigurasi dan menjalankan bootstrap yang sama seperti [`openclaw matrix encryption setup`](#encryption-and-verification).

### Konfigurasi minimal

Berbasis token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Berbasis kata sandi (token disimpan dalam cache setelah login pertama):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Auto-join

`channels.matrix.autoJoin` default ke `off`. Dengan default tersebut, bot tidak akan muncul di room atau DM baru dari undangan baru hingga Anda bergabung secara manual.

OpenClaw tidak dapat mengetahui pada saat undangan apakah room yang diundang adalah DM atau grup, jadi semua undangan — termasuk undangan bergaya DM — melewati `autoJoin` terlebih dahulu. `dm.policy` hanya berlaku nanti, setelah bot bergabung dan room telah diklasifikasikan.

<Warning>
Tetapkan `autoJoin: "allowlist"` plus `autoJoinAllowlist` untuk membatasi undangan yang diterima bot, atau `autoJoin: "always"` untuk menerima setiap undangan.

`autoJoinAllowlist` hanya menerima target stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak; entri alias diselesaikan terhadap homeserver, bukan terhadap state yang diklaim oleh room yang mengundang.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Untuk menerima setiap undangan, gunakan `autoJoin: "always"`.

### Format target allowlist

Allowlist DM dan room sebaiknya diisi dengan ID stabil:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan hanya diselesaikan saat direktori homeserver mengembalikan tepat satu kecocokan.
- Room (`groups`, `autoJoinAllowlist`): gunakan `!room:server` atau `#alias:server`. Nama diselesaikan secara upaya terbaik terhadap room yang sudah diikuti; entri yang tidak terselesaikan diabaikan saat runtime.

### Normalisasi ID akun

Wizard mengonversi nama ramah menjadi ID akun yang dinormalisasi. Misalnya, `Ops Bot` menjadi `ops-bot`. Tanda baca di-escape dalam nama env-var terskop agar dua akun tidak dapat bertabrakan: `-` → `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

### Kredensial cache

Matrix menyimpan kredensial cache di bawah `~/.openclaw/credentials/matrix/`:

- akun default: `credentials.json`
- akun bernama: `credentials-<account>.json`

Saat kredensial cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi meskipun token akses tidak ada di file konfigurasi — ini mencakup penyiapan, `openclaw doctor`, dan probe status saluran.

### Variabel lingkungan

Digunakan saat kunci konfigurasi yang setara tidak disetel. Akun default menggunakan nama tanpa prefiks; akun bernama menggunakan ID akun yang disisipkan sebelum sufiks.

| Akun default          | Akun bernama (`<ID>` adalah ID akun yang dinormalisasi) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Untuk akun `ops`, namanya menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. Env var recovery-key dibaca oleh alur CLI yang sadar recovery (`verify backup restore`, `verify device`, `verify bootstrap`) saat Anda menyalurkan kunci melalui `--recovery-key-stdin`.

`MATRIX_HOMESERVER` tidak dapat disetel dari `.env` workspace; lihat [File `.env` workspace](/id/gateway/security).

## Contoh konfigurasi

Baseline praktis dengan pairing DM, allowlist room, dan E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in. `streaming` mengontrol cara OpenClaw mengirim balasan asisten yang sedang berjalan; `blockStreaming` mengontrol apakah setiap blok yang selesai dipertahankan sebagai pesan Matrix tersendiri.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Untuk mempertahankan pratinjau jawaban live tetapi menyembunyikan baris alat/progres sementara, gunakan bentuk
objek:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | Perilaku                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"off"` (default) | Menunggu balasan penuh, kirim sekali. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                     |
| `"partial"`       | Mengedit satu pesan teks normal di tempat saat model menulis blok saat ini. Klien Matrix bawaan dapat memberi notifikasi pada pratinjau pertama, bukan edit final. |
| `"quiet"`         | Sama seperti `"partial"` tetapi pesannya adalah notice tanpa notifikasi. Penerima hanya mendapat notifikasi setelah aturan push per pengguna cocok dengan edit final (lihat di bawah). |

`blockStreaming` independen dari `streaming`:

| `streaming`             | `blockStreaming: true`                                           | `blockStreaming: false` (default)                         |
| ----------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `"partial"` / `"quiet"` | Draf live untuk blok saat ini, blok selesai disimpan sebagai pesan | Draf live untuk blok saat ini, difinalisasi di tempat      |
| `"off"`                 | Satu pesan Matrix yang memberi notifikasi per blok selesai        | Satu pesan Matrix yang memberi notifikasi untuk balasan penuh |

Catatan:

- Jika pratinjau melampaui batas ukuran per-event Matrix, OpenClaw menghentikan streaming pratinjau dan fallback ke pengiriman final-only.
- Balasan media selalu mengirim lampiran secara normal. Jika pratinjau lama tidak lagi dapat digunakan ulang dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media final.
- Pembaruan pratinjau progres alat diaktifkan secara default saat streaming pratinjau Matrix aktif. Setel `streaming.preview.toolProgress: false` untuk mempertahankan edit pratinjau bagi teks jawaban tetapi membiarkan progres alat berada di jalur pengiriman normal.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan `streaming: "off"` jika Anda menginginkan profil rate-limit yang paling konservatif.

## Metadata persetujuan

Prompt persetujuan native Matrix adalah event `m.room.message` normal dengan konten event kustom khusus OpenClaw di bawah `com.openclaw.approval`. Matrix mengizinkan kunci konten event kustom, sehingga klien bawaan tetap merender body teks sementara klien yang sadar OpenClaw dapat membaca ID persetujuan terstruktur, jenis, state, keputusan yang tersedia, serta detail exec/Plugin.

Saat prompt persetujuan terlalu panjang untuk satu event Matrix, OpenClaw memecah teks yang terlihat menjadi chunk dan melampirkan `com.openclaw.approval` hanya ke chunk pertama. Reaksi untuk keputusan izinkan/tolak terikat ke event pertama tersebut, sehingga prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu event.

### Aturan push self-hosted untuk pratinjau final quiet

`streaming: "quiet"` hanya memberi notifikasi kepada penerima setelah blok atau turn difinalisasi — aturan push per pengguna harus cocok dengan marker pratinjau final. Lihat [Aturan push Matrix untuk pratinjau quiet](/id/channels/matrix-push-rules) untuk resep lengkap (token penerima, pemeriksaan pusher, instalasi aturan, catatan per homeserver).

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi diabaikan.

Gunakan `allowBots` saat Anda sengaja menginginkan lalu lintas Matrix antar-agent:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` menerima pesan dari akun bot Matrix lain yang dikonfigurasi di room dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya saat pesan itu secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` mengganti pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan ke diri sendiri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi pada Gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di ruang terenkripsi (E2EE), peristiwa gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkap. Ruang yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — Plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik lengkap), `--json` (keluaran yang dapat dibaca mesin), dan `--account <id>` (penyiapan multi-akun). Keluaran secara default ringkas dengan pencatatan SDK internal yang tenang. Contoh di bawah menunjukkan bentuk kanonis; tambahkan flag sesuai kebutuhan.

### Aktifkan enkripsi

```bash
openclaw matrix encryption setup
```

Melakukan bootstrap penyimpanan rahasia dan penandatanganan silang, membuat cadangan kunci ruang jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag yang berguna:

- `--recovery-key <key>` menerapkan kunci pemulihan sebelum bootstrap (utamakan bentuk stdin yang didokumentasikan di bawah)
- `--force-reset-cross-signing` membuang identitas penandatanganan silang saat ini dan membuat yang baru (gunakan hanya dengan sengaja)

Untuk akun baru, aktifkan E2EE saat pembuatan:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` adalah alias untuk `--enable-e2ee`.

Padanan konfigurasi manual:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### Status dan sinyal kepercayaan

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` melaporkan tiga sinyal kepercayaan independen (`--verbose` menampilkan semuanya):

- `Locally trusted`: dipercaya hanya oleh klien ini
- `Cross-signing verified`: SDK melaporkan verifikasi melalui penandatanganan silang
- `Signed by owner`: ditandatangani oleh kunci penandatanganan mandiri Anda sendiri (hanya diagnostik)

`Verified by owner` menjadi `yes` hanya ketika `Cross-signing verified` adalah `yes`. Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik upaya terbaik tanpa menyiapkan akun Matrix terlebih dahulu; berguna untuk pemeriksaan offline atau yang terkonfigurasi sebagian.

### Verifikasi perangkat ini dengan kunci pemulihan

Kunci pemulihan bersifat sensitif — kirim melalui stdin, bukan meneruskannya di baris perintah. Tetapkan `MATRIX_RECOVERY_KEY` (atau `MATRIX_<ID>_RECOVERY_KEY` untuk akun bernama):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah ini melaporkan tiga status:

- `Recovery key accepted`: Matrix menerima kunci untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Backup usable`: cadangan kunci ruang dapat dimuat dengan materi pemulihan tepercaya.
- `Device verified by owner`: perangkat ini memiliki kepercayaan identitas penandatanganan silang Matrix penuh.

Perintah keluar dengan status non-nol ketika kepercayaan identitas penuh belum lengkap, meskipun kunci pemulihan membuka materi cadangan. Dalam kasus itu, selesaikan verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu `Cross-signing verified: yes` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyesuaikan waktu tunggu.

Bentuk kunci literal `openclaw matrix verify device "<recovery-key>"` juga diterima, tetapi kunci akan masuk ke riwayat shell Anda.

### Bootstrap atau perbaiki penandatanganan silang

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap penyimpanan rahasia, menggunakan kembali kunci pemulihan yang ada jika memungkinkan
- melakukan bootstrap penandatanganan silang dan mengunggah kunci publik yang hilang
- menandai dan menandatangani silang perangkat saat ini
- membuat cadangan kunci ruang sisi server jika belum ada

Jika homeserver memerlukan UIA untuk mengunggah kunci penandatanganan silang, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`).

Flag yang berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas penandatanganan silang saat ini (hanya dengan sengaja)

### Cadangan kunci ruang

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menunjukkan apakah cadangan sisi server ada dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor kunci ruang yang dicadangkan ke penyimpanan kripto lokal; jika kunci pemulihan sudah ada di disk, Anda dapat menghilangkan `--recovery-key-stdin`.

Untuk mengganti cadangan rusak dengan baseline baru (menerima hilangnya riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang penyimpanan rahasia jika rahasia cadangan saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya ketika Anda sengaja ingin kunci pemulihan sebelumnya berhenti membuka baseline cadangan baru.

### Mencantumkan, meminta, dan menanggapi verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun OpenClaw ini. `--own-user` meminta verifikasi mandiri (Anda menerima prompt di klien Matrix lain milik pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lain.

Untuk penanganan siklus hidup tingkat lebih rendah — biasanya saat membayangi permintaan masuk dari klien lain — perintah ini bekerja pada permintaan `<id>` tertentu (dicetak oleh `verify list` dan `verify request`):

| Perintah                                   | Tujuan                                                              |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Menerima permintaan masuk                                           |
| `openclaw matrix verify start <id>`        | Memulai alur SAS                                                    |
| `openclaw matrix verify sas <id>`          | Mencetak emoji atau desimal SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | Mengonfirmasi bahwa SAS cocok dengan yang ditampilkan klien lain    |
| `openclaw matrix verify mismatch-sas <id>` | Menolak SAS ketika emoji atau desimal tidak cocok                   |
| `openclaw matrix verify cancel <id>`       | Membatalkan; menerima `--reason <text>` dan `--code <matrix-code>` opsional |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, dan `cancel` semuanya menerima `--user-id` dan `--room-id` sebagai petunjuk tindak lanjut DM ketika verifikasi ditambatkan ke ruang pesan langsung tertentu.

### Catatan multi-akun

Tanpa `--account <id>`, perintah CLI Matrix menggunakan akun default implisit. Jika Anda memiliki beberapa akun bernama dan belum menetapkan `channels.matrix.defaultAccount`, perintah akan menolak menebak dan meminta Anda memilih. Ketika E2EE dinonaktifkan atau tidak tersedia untuk akun bernama, galat menunjuk ke kunci konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Perilaku startup">
    Dengan `encryption: true`, `startupVerification` secara default adalah `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikat dan menerapkan cooldown (24 jam secara default). Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan pass bootstrap kripto konservatif yang menggunakan kembali penyimpanan rahasia dan identitas penandatanganan silang saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan yang dijaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, startup mencatat peringatan dan tetap non-fatal. Perangkat yang sudah ditandatangani pemilik dipertahankan.

    Lihat [migrasi Matrix](/id/channels/matrix-migration) untuk alur peningkatan lengkap.

  </Accordion>

  <Accordion title="Pemberitahuan verifikasi">
    Matrix memposting pemberitahuan siklus hidup verifikasi ke ruang verifikasi DM ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verifikasi dengan emoji"), mulai/selesai, dan detail SAS (emoji/desimal) jika tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia — Anda tetap perlu membandingkan dan mengonfirmasi "Cocok" di klien Matrix Anda.

    Pemberitahuan sistem verifikasi tidak diteruskan ke pipeline chat agen.

  </Accordion>

  <Accordion title="Perangkat Matrix yang dihapus atau tidak valid">
    Jika `verify status` mengatakan perangkat saat ini tidak lagi tercantum di homeserver, buat perangkat Matrix OpenClaw baru. Untuk login kata sandi:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Untuk autentikasi token, buat token akses baru di klien Matrix atau UI admin Anda, lalu perbarui OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Ganti `assistant` dengan ID akun dari perintah yang gagal, atau hilangkan `--account` untuk akun default.

  </Accordion>

  <Accordion title="Kebersihan perangkat">
    Perangkat lama yang dikelola OpenClaw dapat menumpuk. Cantumkan dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Penyimpanan kripto">
    E2EE Matrix menggunakan jalur kripto Rust `matrix-js-sdk` resmi dengan `fake-indexeddb` sebagai shim IndexedDB. Status kripto bertahan ke `crypto-idb-snapshot.json` (izin file restriktif).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup penyimpanan sinkronisasi, penyimpanan kripto, kunci pemulihan, snapshot IDB, pengikatan thread, dan status verifikasi startup. Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang ada sehingga status sebelumnya tetap terlihat.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui profil mandiri Matrix untuk akun yang dipilih:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Anda dapat meneruskan kedua opsi dalam satu panggilan. Matrix menerima URL avatar `mxc://` secara langsung; ketika Anda meneruskan `http://` atau `https://`, OpenClaw mengunggah file terlebih dahulu dan menyimpan URL `mxc://` yang diselesaikan ke `channels.matrix.avatarUrl` (atau override per akun).

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis dan pengiriman alat pesan. Dua knob independen mengontrol perilaku:

### Perutean sesi (`sessionScope`)

`dm.sessionScope` menentukan cara ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (default): semua ruang DM dengan peer terute yang sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan kunci sesinya sendiri, bahkan ketika peer-nya sama.

Pengikatan percakapan eksplisit selalu mengalahkan `sessionScope`, sehingga ruang dan thread yang terikat mempertahankan sesi target pilihannya.

### Threading balasan (`threadReplies`)

`threadReplies` menentukan tempat bot memposting balasannya:

- `"off"`: balasan berada di tingkat atas. Pesan ber-thread yang masuk tetap berada pada sesi induk.
- `"inbound"`: balas di dalam thread hanya ketika pesan masuk sudah berada di thread tersebut.
- `"always"`: balas di dalam thread yang berakar pada pesan pemicu; percakapan itu dirutekan melalui sesi dengan cakupan thread yang cocok sejak pemicu pertama.

`dm.threadReplies` mengesampingkan ini hanya untuk DM — misalnya, menjaga thread ruang tetap terisolasi sambil mempertahankan DM tetap datar.

### Pewarisan thread dan perintah slash

- Pesan berutas inbound menyertakan pesan akar utas sebagai konteks agen tambahan.
- Pengiriman message-tool otomatis mewarisi utas Matrix saat ini ketika menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM hanya berlaku ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal berbasis pengguna.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat utas semuanya berfungsi di ruang Matrix dan DM.
- `/focus` tingkat atas membuat utas Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSubagentSessions: true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam utas Matrix yang sudah ada mengikat utas tersebut di tempat.

Ketika OpenClaw mendeteksi ruang DM Matrix bertabrakan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw mengirim `m.notice` satu kali di ruang tersebut yang menunjuk ke jalan keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Notifikasi hanya muncul ketika pengikatan utas diaktifkan.

## Pengikatan percakapan ACP

Ruang Matrix, DM, dan utas Matrix yang sudah ada dapat diubah menjadi ruang kerja ACP yang tahan lama tanpa mengubah permukaan obrolan.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, ruang, atau utas yang sudah ada yang ingin tetap Anda gunakan.
- Di DM atau ruang Matrix tingkat atas, DM/ruang saat ini tetap menjadi permukaan obrolan dan pesan mendatang dirutekan ke sesi ACP yang dibuat.
- Di dalam utas Matrix yang sudah ada, `--bind here` mengikat utas saat ini di tempat.
- `/new` dan `/reset` mengatur ulang sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus pengikatan.

Catatan:

- `--bind here` tidak membuat utas Matrix anak.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, ketika OpenClaw perlu membuat atau mengikat utas Matrix anak.

### Konfigurasi pengikatan utas

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per kanal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat utas Matrix bersifat opt-in:

- Atur `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` tingkat atas membuat dan mengikat utas Matrix baru.
- Atur `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` mengikat sesi ACP ke utas Matrix.

## Reaksi

Matrix mendukung reaksi outbound, notifikasi reaksi inbound, dan reaksi ack.

Peralatan reaksi outbound dikendalikan oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke event Matrix.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix.
- `emoji=""` menghapus reaksi milik bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari bot.

**Urutan resolusi** (nilai pertama yang didefinisikan menang):

| Pengaturan             | Urutan                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `ackReaction`           | per akun → kanal → `messages.ackReaction` → fallback emoji identitas agen       |
| `ackReactionScope`      | per akun → kanal → `messages.ackReactionScope` → default `"group-mentions"`     |
| `reactionNotifications` | per akun → kanal → default `"own"`                                              |

`reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika menargetkan pesan Matrix yang ditulis bot; `"off"` menonaktifkan event sistem reaksi. Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkan hal tersebut sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- Riwayat ruang Matrix hanya untuk ruang. DM tetap menggunakan riwayat sesi normal.
- Riwayat ruang Matrix bersifat pending-only: OpenClaw men-buffer pesan ruang yang belum memicu balasan, lalu mengambil snapshot jendela tersebut ketika mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di isi inbound utama untuk giliran itu.
- Percobaan ulang event Matrix yang sama menggunakan ulang snapshot riwayat asli alih-alih bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks ruang tambahan seperti teks balasan yang diambil, akar utas, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist ruang/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan inbound itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari `groupPolicy`, `groups`, `groupAllowFrom`, dan pengaturan kebijakan DM.

## Kebijakan DM dan ruang

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Untuk membisukan DM sepenuhnya sambil tetap membuat ruang berfungsi, atur `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Lihat [Grup](/id/channels/groups) untuk perilaku pembatasan mention dan allowlist.

Contoh pemasangan untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirim pesan kepada Anda sebelum persetujuan, OpenClaw menggunakan ulang kode pemasangan tertunda yang sama dan dapat mengirim balasan pengingat setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pemasangan](/id/channels/pairing) untuk alur pemasangan DM bersama dan tata letak penyimpanan.

## Perbaikan ruang langsung

Jika status pesan langsung bergeser hingga tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke ruang solo lama, bukan DM aktif. Periksa pemetaan saat ini untuk peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk setup multi-akun. Alur perbaikan:

- memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat yang saat ini tergabung dengan pengguna tersebut
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM yang sehat

Ini tidak menghapus ruang lama secara otomatis. Ini memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix mendatang, notifikasi verifikasi, dan alur pesan langsung lainnya menargetkan ruang yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk override per akun):

- `enabled`: mengirim persetujuan melalui prompt native Matrix. Ketika tidak diatur atau `"auto"`, Matrix otomatis aktif setelah setidaknya satu pemberi persetujuan dapat di-resolve. Atur `false` untuk menonaktifkan secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan exec. Opsional — fallback ke `channels.matrix.dm.allowFrom`.
- `target`: lokasi tujuan prompt. `"dm"` (default) mengirim ke DM pemberi persetujuan; `"channel"` mengirim ke ruang Matrix atau DM asal; `"both"` mengirim ke keduanya.
- `agentFilter` / `sessionFilter`: allowlist opsional untuk agen/sesi mana yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda antar jenis persetujuan:

- **Persetujuan exec** menggunakan `execApprovals.approvers`, dengan fallback ke `dm.allowFrom`.
- **Persetujuan Plugin** mengotorisasi hanya melalui `dm.allowFrom`.

Kedua jenis berbagi pintasan reaksi Matrix dan pembaruan pesan. Pemberi persetujuan melihat pintasan reaksi pada pesan persetujuan utama:

- `✅` izinkan sekali
- `❌` tolak
- `♾️` selalu izinkan (ketika kebijakan exec efektif mengizinkannya)

Perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Hanya pemberi persetujuan yang berhasil di-resolve yang dapat menyetujui atau menolak. Pengiriman kanal untuk persetujuan exec menyertakan teks perintah — hanya aktifkan `channel` atau `both` di ruang tepercaya.

Terkait: [Persetujuan exec](/id/tools/exec-approvals).

## Perintah slash

Perintah slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dll.) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan mention Matrix milik bot sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa regex mention kustom. Ini menjaga bot tetap responsif terhadap posting bergaya ruang `@mention /command` yang dipancarkan Element dan klien serupa ketika pengguna menggunakan tab-complete pada bot sebelum mengetik perintah.

Aturan otorisasi tetap berlaku: pengirim perintah harus memenuhi kebijakan allowlist/pemilik DM atau ruang yang sama seperti pesan biasa.

## Multi-akun

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**Pewarisan:**

- Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali akun menimpanya.
- Batasi entri ruang yang diwarisi ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` dibagikan lintas akun; `account: "default"` tetap berfungsi ketika akun default dikonfigurasi di tingkat atas.

**Pemilihan akun default:**

- Atur `defaultAccount` untuk memilih akun bernama yang diprioritaskan oleh perutean implisit, probing, dan perintah CLI.
- Jika Anda memiliki beberapa akun dan salah satunya secara literal bernama `default`, OpenClaw menggunakannya secara implisit meskipun `defaultAccount` tidak diatur.
- Jika Anda memiliki beberapa akun bernama dan tidak ada default yang dipilih, perintah CLI menolak menebak — atur `defaultAccount` atau berikan `--account <id>`.
- Blok `channels.matrix.*` tingkat atas hanya diperlakukan sebagai akun `default` implisit ketika autentikasinya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang di-cache mencakup autentikasi.

**Promosi:**

- Ketika OpenClaw mempromosikan konfigurasi akun tunggal menjadi multi-akun selama perbaikan atau setup, OpenClaw mempertahankan akun bernama yang ada jika ada atau `defaultAccount` sudah menunjuk ke salah satunya. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan; kunci kebijakan pengiriman bersama tetap berada di tingkat atas.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver pribadi/LAN

Secara default, OpenClaw memblokir homeserver Matrix pribadi/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit ikut serta per akun.

Jika homeserver Anda berjalan di localhost, IP LAN/Tailscale, atau hostname internal, aktifkan
`network.dangerouslyAllowPrivateNetwork` untuk akun Matrix tersebut:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Contoh penyiapan CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Pengaktifan eksplisit ini hanya mengizinkan target privat/internal yang tepercaya. Homeserver publik tanpa enkripsi seperti
`http://matrix.example.org:8008` tetap diblokir. Gunakan `https://` jika memungkinkan.

## Memproksikan trafik Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) keluar eksplisit, atur `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Akun bernama dapat menimpa default tingkat atas dengan `channels.matrix.accounts.<id>.proxy`.
OpenClaw menggunakan pengaturan proxy yang sama untuk trafik Matrix saat runtime dan pemeriksaan status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target ruang atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Ruang: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID ruang Matrix peka huruf besar/kecil. Gunakan kapitalisasi ID ruang yang persis dari Matrix
saat mengonfigurasi target pengiriman eksplisit, pekerjaan Cron, binding, atau daftar izin.
OpenClaw menjaga kunci sesi internal tetap kanonis untuk penyimpanan, sehingga kunci huruf kecil
tersebut bukan sumber yang andal untuk ID pengiriman Matrix.

Pencarian direktori langsung menggunakan akun Matrix yang sedang masuk:

- Pencarian pengguna menanyakan direktori pengguna Matrix pada homeserver tersebut.
- Pencarian ruang menerima ID ruang dan alias eksplisit secara langsung, lalu kembali ke pencarian nama ruang yang sudah diikuti untuk akun tersebut.
- Pencarian nama ruang yang sudah diikuti bersifat upaya terbaik. Jika nama ruang tidak dapat diresolusikan menjadi ID atau alias, nama tersebut diabaikan oleh resolusi daftar izin saat runtime.

## Referensi konfigurasi

Bidang bergaya daftar izin (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Kecocokan direktori persis diresolusikan saat startup dan setiap kali daftar izin berubah ketika monitor sedang berjalan; entri yang tidak dapat diresolusikan diabaikan saat runtime. Daftar izin ruang lebih mengutamakan ID ruang atau alias karena alasan yang sama.

### Akun dan koneksi

- `enabled`: aktifkan atau nonaktifkan kanal.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `accounts`: override bernama per akun. Nilai tingkat atas `channels.matrix` diwarisi sebagai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau hostname internal.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Override per akun didukung.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: token akses untuk autentikasi berbasis token. Nilai teks biasa dan SecretRef didukung di penyedia env/file/exec ([Manajemen Rahasia](/id/gateway/secrets)).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai teks biasa dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat login kata sandi.
- `avatarUrl`: URL avatar diri tersimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum peristiwa yang diambil selama sinkronisasi startup.

### Enkripsi

- `encryption`: aktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default saat E2EE aktif) atau `"off"`. Meminta verifikasi diri secara otomatis saat startup jika perangkat ini belum diverifikasi.
- `startupVerificationCooldownHours`: cooldown sebelum permintaan startup otomatis berikutnya. Default: `24`.

### Akses dan kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: daftar izin ID pengguna untuk lalu lintas room.
- `dm.enabled`: saat `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan room sebagai DM; ini tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: daftar izin ID pengguna untuk lalu lintas DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: override khusus DM untuk penguliran balasan (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: terima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: saat `true`, memaksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `"allowlist"`. Entri alias diselesaikan terhadap homeserver, bukan terhadap state yang diklaim oleh room yang mengundang.
- `contextVisibility`: visibilitas konteks tambahan (`"all"` default, `"allowlist"`, `"allowlist_quote"`).

### Perilaku balasan

- `replyToMode`: `"off"`, `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, atau `"always"`.
- `threadBindings`: override per kanal untuk perutean dan siklus hidup sesi yang terikat thread.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, atau bentuk objek `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: saat `true`, blok asisten yang selesai disimpan sebagai pesan progres terpisah.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks keluar.
- `responsePrefix`: string opsional yang ditambahkan di awal balasan keluar.
- `textChunkLimit`: ukuran potongan keluar dalam karakter saat `chunkMode: "length"`. Default: `4000`.
- `chunkMode`: `"length"` (default, membagi berdasarkan jumlah karakter) atau `"newline"` (membagi pada batas baris).
- `historyLimit`: jumlah pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room memicu agent. Fallback ke `messages.groupChat.historyLimit`; default efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan masuk.

### Pengaturan reaksi

- `ackReaction`: override reaksi ack untuk kanal/akun ini.
- `ackReactionScope`: override cakupan (`"group-mentions"` default, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`"own"` default, `"off"`).

### Peralatan dan override per room

- `actions`: gating alat per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per room. Identitas sesi menggunakan ID room stabil setelah resolusi. (`rooms` adalah alias lama.)
  - `groups.<room>.account`: batasi satu entri room yang diwarisi ke akun tertentu.
  - `groups.<room>.allowBots`: override per room untuk pengaturan tingkat kanal (`true` atau `"mentions"`).
  - `groups.<room>.users`: daftar izin pengirim per room.
  - `groups.<room>.tools`: override izinkan/tolak alat per room.
  - `groups.<room>.autoReply`: override gating mention per room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter Skills per room.
  - `groups.<room>.systemPrompt`: cuplikan prompt sistem per room.

### Pengaturan persetujuan exec

- `execApprovals.enabled`: kirim persetujuan exec melalui prompt native Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui. Fallback ke `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (default), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: daftar izin agent/sesi opsional untuk pengiriman.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
