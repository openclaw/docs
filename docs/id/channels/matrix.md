---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan matriks, penyiapan, dan contoh konfigurasi
title: Matriks
x-i18n:
    generated_at: "2026-06-27T17:11:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah Plugin saluran yang dapat diunduh untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, ruang, utas, media, reaksi, jajak pendapat, lokasi, dan E2EE.

## Instalasi

Instal Matrix dari ClawHub sebelum mengonfigurasi saluran:

```bash
openclaw plugins install @openclaw/matrix
```

Spesifikasi Plugin tanpa awalan mencoba ClawHub terlebih dahulu, lalu cadangan npm. Untuk memaksa sumber registri, gunakan `openclaw plugins install clawhub:@openclaw/matrix` atau `openclaw plugins install npm:@openclaw/matrix`.

Dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` mendaftarkan dan mengaktifkan Plugin, jadi langkah `openclaw plugins enable matrix` terpisah tidak diperlukan. Plugin tetap tidak melakukan apa pun sampai Anda mengonfigurasi saluran di bawah. Lihat [Plugin](/id/tools/plugin) untuk perilaku Plugin umum dan aturan instalasi.

## Penyiapan

1. Buat akun Matrix di server asal Anda.
2. Konfigurasikan `channels.matrix` dengan `homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`.
3. Mulai ulang Gateway.
4. Mulai DM dengan bot, atau undang bot ke ruang (lihat [gabung otomatis](#auto-join) - undangan baru hanya masuk ketika `autoJoin` mengizinkannya).

### Penyiapan interaktif

```bash
openclaw channels add
openclaw configure --section channels
```

Panduan meminta: URL server asal, metode autentikasi (token akses atau kata sandi), ID pengguna (hanya autentikasi kata sandi), nama perangkat opsional, apakah akan mengaktifkan E2EE, dan apakah akan mengonfigurasi akses ruang dan gabung otomatis.

Jika env var `MATRIX_*` yang cocok sudah ada dan akun yang dipilih tidak memiliki autentikasi tersimpan, panduan menawarkan pintasan env var. Untuk menyelesaikan nama ruang sebelum menyimpan daftar izinkan, jalankan `openclaw channels resolve --channel matrix "Project Room"`. Ketika E2EE diaktifkan, panduan menulis konfigurasi dan menjalankan bootstrap yang sama dengan [`openclaw matrix encryption setup`](#encryption-and-verification).

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

### Gabung otomatis

`channels.matrix.autoJoin` bernilai default `off`. Dengan default ini, bot tidak akan muncul di ruang baru atau DM dari undangan baru sampai Anda bergabung secara manual.

OpenClaw tidak dapat mengetahui saat undangan apakah ruang yang diundang adalah DM atau grup, jadi semua undangan - termasuk undangan bergaya DM - melewati `autoJoin` terlebih dahulu. `dm.policy` hanya berlaku nanti, setelah bot bergabung dan ruang telah diklasifikasikan.

<Warning>
Atur `autoJoin: "allowlist"` plus `autoJoinAllowlist` untuk membatasi undangan yang diterima bot, atau `autoJoin: "always"` untuk menerima setiap undangan.

`autoJoinAllowlist` hanya menerima target stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama ruang biasa ditolak; entri alias diselesaikan terhadap server asal, bukan terhadap status yang diklaim oleh ruang yang mengundang.
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

### Format target daftar izinkan

Daftar izinkan DM dan ruang paling baik diisi dengan ID stabil:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan diabaikan secara default karena dapat berubah; atur `dangerouslyAllowNameMatching: true` hanya ketika Anda secara eksplisit memerlukan kompatibilitas dengan entri nama tampilan.
- Kunci daftar izinkan ruang (`groups`, `rooms` lama): gunakan `!room:server` atau `#alias:server`. Nama ruang biasa diabaikan secara default; atur `dangerouslyAllowNameMatching: true` hanya ketika Anda secara eksplisit memerlukan kompatibilitas dengan pencarian nama ruang yang sudah diikuti.
- Daftar izinkan undangan (`autoJoinAllowlist`): gunakan `!room:server`, `#alias:server`, atau `*`. Nama ruang biasa ditolak.

### Normalisasi ID akun

Panduan mengonversi nama ramah menjadi ID akun yang dinormalisasi. Misalnya, `Ops Bot` menjadi `ops-bot`. Tanda baca di-escape dalam nama env var bercakupan agar dua akun tidak dapat bertabrakan: `-` → `_X2D_`, jadi `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

### Kredensial cache

Matrix menyimpan kredensial cache di bawah `~/.openclaw/credentials/matrix/`:

- akun default: `credentials.json`
- akun bernama: `credentials-<account>.json`

Ketika kredensial cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi meskipun token akses tidak ada di file konfigurasi - ini mencakup penyiapan, `openclaw doctor`, dan pemeriksaan status saluran.

### Variabel lingkungan

Digunakan ketika kunci konfigurasi ekuivalen tidak diatur. Akun default menggunakan nama tanpa prefiks; akun bernama menggunakan ID akun yang disisipkan sebelum sufiks.

| Akun default         | Akun bernama (`<ID>` adalah ID akun yang dinormalisasi) |
| -------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Untuk akun `ops`, nama menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. Env var kunci pemulihan dibaca oleh alur CLI yang sadar pemulihan (`verify backup restore`, `verify device`, `verify bootstrap`) ketika Anda menyalurkan kunci melalui `--recovery-key-stdin`.

`MATRIX_HOMESERVER` tidak dapat diatur dari `.env` ruang kerja; lihat [File `.env` ruang kerja](/id/gateway/security).

## Contoh konfigurasi

Baseline praktis dengan pemasangan DM, daftar izinkan ruang, dan E2EE:

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

Streaming balasan Matrix bersifat ikut serta. `streaming` mengontrol cara OpenClaw mengirim balasan asisten yang sedang berjalan; `blockStreaming` mengontrol apakah setiap blok yang selesai dipertahankan sebagai pesan Matrix tersendiri.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Untuk mempertahankan pratinjau jawaban langsung tetapi menyembunyikan baris alat/progres sementara, gunakan bentuk objek:

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

| `streaming`       | Perilaku                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | Tunggu balasan penuh, kirim sekali. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Edit satu pesan teks normal di tempat saat model menulis blok saat ini. Klien Matrix standar dapat memberi notifikasi pada pratinjau pertama, bukan edit akhir.     |
| `"quiet"`         | Sama seperti `"partial"` tetapi pesannya adalah pemberitahuan yang tidak memicu notifikasi. Penerima hanya mendapat notifikasi setelah aturan push per pengguna cocok dengan edit yang difinalisasi (lihat di bawah). |

`blockStreaming` independen dari `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (default)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Draf langsung untuk blok saat ini, blok selesai disimpan sebagai pesan | Draf langsung untuk blok saat ini, difinalisasi di tempat |
| `"off"`                 | Satu pesan Matrix yang memicu notifikasi per blok selesai           | Satu pesan Matrix yang memicu notifikasi untuk balasan penuh |

Catatan:

- Jika pratinjau melebihi batas ukuran per peristiwa Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman hanya akhir.
- Balasan media selalu mengirim lampiran secara normal. Jika pratinjau usang tidak lagi dapat digunakan ulang dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media akhir.
- Pembaruan pratinjau progres alat diaktifkan secara default ketika streaming pratinjau Matrix aktif. Atur `streaming.preview.toolProgress: false` untuk mempertahankan edit pratinjau untuk teks jawaban tetapi membiarkan progres alat pada jalur pengiriman normal.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan `streaming: "off"` jika Anda menginginkan profil batas laju yang paling konservatif.

## Pesan suara

Catatan suara Matrix yang masuk ditranskripsi sebelum gerbang penyebutan ruang. Ini memungkinkan catatan suara yang menyebut nama bot memicu agen di ruang `requireMention: true`, dan memberikan transkrip kepada agen alih-alih hanya placeholder lampiran audio.

Matrix menggunakan penyedia media audio bersama yang dikonfigurasi di bawah `tools.media.audio`, seperti OpenAI `gpt-4o-mini-transcribe`. Lihat [Ikhtisar alat media](/id/tools/media-overview) untuk penyiapan penyedia dan batasan.

Detail perilaku:

- Peristiwa `m.audio` dan peristiwa `m.file` dengan jenis MIME `audio/*` memenuhi syarat.
- Di ruang terenkripsi, OpenClaw mendekripsi lampiran melalui jalur media Matrix yang ada sebelum transkripsi.
- Transkrip ditandai sebagai dibuat mesin dan tidak tepercaya dalam prompt agen.
- Lampiran ditandai sebagai sudah ditranskripsi sehingga alat media hilir tidak mentranskripsi catatan suara yang sama lagi.
- Atur `tools.media.audio.enabled: false` untuk menonaktifkan transkripsi audio secara global.

## Metadata persetujuan

Prompt persetujuan native Matrix adalah peristiwa `m.room.message` normal dengan konten peristiwa kustom khusus OpenClaw di bawah `com.openclaw.approval`. Matrix mengizinkan kunci konten peristiwa kustom, sehingga klien standar tetap merender isi teks sementara klien yang sadar OpenClaw dapat membaca ID persetujuan terstruktur, jenis, status, keputusan yang tersedia, dan detail eksekusi/Plugin.

Ketika prompt persetujuan terlalu panjang untuk satu peristiwa Matrix, OpenClaw memecah teks terlihat menjadi beberapa bagian dan melampirkan `com.openclaw.approval` hanya ke bagian pertama. Reaksi untuk keputusan izinkan/tolak terikat ke peristiwa pertama tersebut, sehingga prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu peristiwa.

### Aturan push yang dihosting sendiri untuk pratinjau final senyap

`streaming: "quiet"` hanya memberi notifikasi kepada penerima setelah blok atau giliran difinalisasi - aturan push per pengguna harus cocok dengan penanda pratinjau yang difinalisasi. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk resep lengkap (token penerima, pemeriksaan pusher, instalasi aturan, catatan per server asal).

## Ruang bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw terkonfigurasi lain diabaikan.

Gunakan `allowBots` ketika Anda sengaja menginginkan lalu lintas Matrix antar-agen:

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

- `allowBots: true` menerima pesan dari akun bot Matrix terkonfigurasi lain di ruang dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya ketika pesan itu secara terlihat menyebut bot ini di ruang. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu ruang.
- Pesan bot terkonfigurasi yang diterima menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection`, lalu timpa dengan `channels.matrix.botLoopProtection` atau `channels.matrix.groups.<room>.botLoopProtection` ketika satu ruang membutuhkan anggaran berbeda.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan ke diri sendiri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix terkonfigurasi lain di Gateway OpenClaw ini".

Gunakan daftar izin ruang yang ketat dan persyaratan sebutan saat mengaktifkan lalu lintas bot-ke-bot di ruang bersama.

## Enkripsi dan verifikasi

Di ruang terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran penuh. Ruang yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi - Plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik lengkap), `--json` (output yang dapat dibaca mesin), dan `--account <id>` (penyiapan multi-akun). Output ringkas secara default dengan pencatatan SDK internal yang senyap. Contoh di bawah menunjukkan bentuk kanonis; tambahkan flag sesuai kebutuhan.

### Aktifkan enkripsi

```bash
openclaw matrix encryption setup
```

Melakukan bootstrap penyimpanan rahasia dan cross-signing, membuat cadangan kunci ruang jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag berguna:

- `--recovery-key <key>` menerapkan kunci pemulihan sebelum bootstrap (utamakan bentuk stdin yang didokumentasikan di bawah)
- `--force-reset-cross-signing` membuang identitas cross-signing saat ini dan membuat yang baru (gunakan hanya dengan sengaja)

Untuk akun baru, aktifkan E2EE saat pembuatan:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` adalah alias untuk `--enable-e2ee`.

Konfigurasi manual yang setara:

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
- `Cross-signing verified`: SDK melaporkan verifikasi melalui cross-signing
- `Signed by owner`: ditandatangani oleh kunci self-signing Anda sendiri (hanya diagnostik)

`Verified by owner` menjadi `yes` hanya ketika `Cross-signing verified` adalah `yes`. Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik upaya terbaik tanpa menyiapkan akun Matrix terlebih dahulu; berguna untuk probe offline atau terkonfigurasi sebagian.

### Verifikasi perangkat ini dengan kunci pemulihan

Kunci pemulihan bersifat sensitif - kirimkan melalui stdin, bukan meneruskannya di baris perintah. Atur `MATRIX_RECOVERY_KEY` (atau `MATRIX_<ID>_RECOVERY_KEY` untuk akun bernama):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah melaporkan tiga status:

- `Recovery key accepted`: Matrix menerima kunci untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Backup usable`: cadangan kunci ruang dapat dimuat dengan materi pemulihan tepercaya.
- `Device verified by owner`: perangkat ini memiliki kepercayaan identitas cross-signing Matrix penuh.

Perintah keluar dengan status non-nol ketika kepercayaan identitas penuh belum lengkap, meskipun kunci pemulihan membuka materi cadangan. Dalam kasus itu, selesaikan verifikasi diri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu `Cross-signing verified: yes` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyetel waktu tunggu.

Bentuk kunci literal `openclaw matrix verify device "<recovery-key>"` juga diterima, tetapi kunci akan tersimpan dalam riwayat shell Anda.

### Bootstrap atau perbaiki cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap penyimpanan rahasia, menggunakan ulang kunci pemulihan yang ada bila memungkinkan
- melakukan bootstrap cross-signing dan mengunggah kunci publik yang hilang
- menandai dan melakukan cross-sign pada perangkat saat ini
- membuat cadangan kunci ruang sisi server jika belum ada

Jika homeserver memerlukan UIA untuk mengunggah kunci cross-signing, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`).

Flag berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas cross-signing saat ini (hanya disengaja; memerlukan kunci pemulihan aktif disimpan atau diberikan dengan `--recovery-key-stdin`)

### Cadangan kunci ruang

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menampilkan apakah cadangan sisi server ada dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor kunci ruang yang dicadangkan ke penyimpanan kripto lokal; jika kunci pemulihan sudah ada di disk, Anda dapat menghilangkan `--recovery-key-stdin`.

Untuk mengganti cadangan rusak dengan baseline baru (menerima kehilangan riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang penyimpanan rahasia jika rahasia cadangan saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya ketika Anda sengaja ingin kunci pemulihan sebelumnya berhenti membuka baseline cadangan baru.

### Mencantumkan, meminta, dan merespons verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun OpenClaw ini. `--own-user` meminta verifikasi diri (Anda menerima prompt di klien Matrix lain dari pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lain.

Untuk penanganan siklus hidup tingkat lebih rendah - biasanya saat membayangi permintaan masuk dari klien lain - perintah ini bertindak pada permintaan spesifik `<id>` (dicetak oleh `verify list` dan `verify request`):

| Perintah                                   | Tujuan                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Menerima permintaan masuk                                           |
| `openclaw matrix verify start <id>`        | Memulai alur SAS                                                    |
| `openclaw matrix verify sas <id>`          | Mencetak emoji atau desimal SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | Mengonfirmasi bahwa SAS cocok dengan yang ditampilkan klien lain    |
| `openclaw matrix verify mismatch-sas <id>` | Menolak SAS ketika emoji atau desimal tidak cocok                   |
| `openclaw matrix verify cancel <id>`       | Membatalkan; menerima `--reason <text>` dan `--code <matrix-code>` opsional |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, dan `cancel` semuanya menerima `--user-id` dan `--room-id` sebagai petunjuk tindak lanjut DM ketika verifikasi ditambatkan ke ruang pesan langsung tertentu.

### Catatan multi-akun

Tanpa `--account <id>`, perintah CLI Matrix menggunakan akun default implisit. Jika Anda memiliki beberapa akun bernama dan belum mengatur `channels.matrix.defaultAccount`, perintah akan menolak menebak dan meminta Anda memilih. Ketika E2EE dinonaktifkan atau tidak tersedia untuk akun bernama, error menunjuk ke kunci konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Perilaku startup">
    Dengan `encryption: true`, `startupVerification` default ke `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta verifikasi diri di klien Matrix lain, melewati duplikat dan menerapkan cooldown (24 jam secara default). Setel dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan pass bootstrap kripto konservatif yang menggunakan ulang penyimpanan rahasia dan identitas cross-signing saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan terjaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, startup mencatat peringatan dan tetap tidak fatal. Perangkat yang sudah ditandatangani pemilik dipertahankan.

    Lihat [migrasi Matrix](/id/channels/matrix-migration) untuk alur peningkatan lengkap.

  </Accordion>

  <Accordion title="Notifikasi verifikasi">
    Matrix memposting notifikasi siklus hidup verifikasi ke ruang verifikasi DM ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verifikasi dengan emoji"), mulai/selesai, dan detail SAS (emoji/desimal) bila tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima otomatis. Untuk verifikasi diri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia - Anda tetap perlu membandingkan dan mengonfirmasi "Cocok" di klien Matrix Anda.

    Notifikasi sistem verifikasi tidak diteruskan ke pipeline chat agen.

  </Accordion>

  <Accordion title="Perangkat Matrix dihapus atau tidak valid">
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

  <Accordion title="Higiene perangkat">
    Perangkat yang dikelola OpenClaw lama dapat menumpuk. Cantumkan dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Penyimpanan kripto">
    E2EE Matrix menggunakan jalur kripto Rust resmi `matrix-js-sdk` dengan `fake-indexeddb` sebagai shim IndexedDB. Status kripto disimpan ke `crypto-idb-snapshot.json` (izin file restriktif).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup penyimpanan sinkronisasi, penyimpanan kripto, kunci pemulihan, snapshot IDB, binding thread, dan status verifikasi startup. Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan ulang root terbaik yang ada sehingga status sebelumnya tetap terlihat.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui profil diri Matrix untuk akun yang dipilih:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Anda dapat meneruskan kedua opsi dalam satu panggilan. Matrix menerima URL avatar `mxc://` secara langsung; ketika Anda meneruskan `http://` atau `https://`, OpenClaw mengunggah file terlebih dahulu dan menyimpan URL `mxc://` yang sudah di-resolve ke `channels.matrix.avatarUrl` (atau override per akun).

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis maupun pengiriman message-tool. Dua kontrol independen mengatur perilaku:

### Perutean sesi (`sessionScope`)

`dm.sessionScope` menentukan bagaimana ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (default): semua ruang DM dengan peer terute yang sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan kunci sesinya sendiri, meskipun peer-nya sama.

Binding percakapan eksplisit selalu diutamakan atas `sessionScope`, sehingga ruang dan thread yang terikat tetap memakai sesi target yang dipilih.

### Thread balasan (`threadReplies`)

`threadReplies` menentukan tempat bot memposting balasannya:

- `"off"`: balasan berada di level teratas. Pesan ber-thread yang masuk tetap berada pada sesi induk.
- `"inbound"`: balas di dalam thread hanya ketika pesan masuk sudah berada di thread tersebut.
- `"always"`: balas di dalam thread yang berakar pada pesan pemicu; percakapan tersebut dirutekan melalui sesi berscope thread yang sesuai sejak pemicu pertama dan seterusnya.

`dm.threadReplies` meng-override ini hanya untuk DM - misalnya, menjaga thread ruang tetap terisolasi sambil menjaga DM tetap datar.

### Pewarisan thread dan perintah slash

- Pesan ber-thread yang masuk menyertakan pesan akar thread sebagai konteks agen tambahan.
- Pengiriman message-tool secara otomatis mewarisi thread Matrix saat ini ketika menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean berscope pengguna normal.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread semuanya berfungsi di ruang Matrix dan DM.
- `/focus` level teratas membuat thread Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSessions` diaktifkan.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada mengikat thread tersebut di tempatnya.

Ketika OpenClaw mendeteksi ruang DM Matrix bertabrakan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw memposting `m.notice` satu kali di ruang tersebut yang mengarah ke jalan keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Notifikasi hanya muncul ketika binding thread diaktifkan.

## Binding percakapan ACP

Ruang Matrix, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, ruang, atau thread yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau ruang Matrix level teratas, DM/ruang saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang dibuat.
- Di dalam thread Matrix yang sudah ada, `--bind here` mengikat thread saat ini di tempatnya.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempatnya.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat thread Matrix turunan.
- `threadBindings.spawnSessions` mengatur `/acp spawn --thread auto|here`, ketika OpenClaw perlu membuat atau mengikat thread Matrix turunan.

### Konfigurasi binding thread

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Pembuatan sesi terikat thread Matrix aktif secara default:

- Atur `threadBindings.spawnSessions: false` untuk memblokir `/focus` level teratas dan `/acp spawn --thread auto|here` agar tidak membuat/mengikat thread Matrix.
- Atur `threadBindings.defaultSpawnContext: "isolated"` ketika pembuatan thread subagen native tidak boleh melakukan fork transkrip induk.

## Reaksi

Matrix mendukung reaksi keluar, notifikasi reaksi masuk, dan reaksi ack.

Tooling reaksi keluar dikendalikan oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke event Matrix.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix.
- `emoji=""` menghapus reaksi milik bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji tertentu dari bot.

**Urutan resolusi** (nilai pertama yang didefinisikan menang):

| Pengaturan             | Urutan                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`          | per akun → channel → `messages.ackReaction` → fallback emoji identitas agen      |
| `ackReactionScope`     | per akun → channel → `messages.ackReactionScope` → default `"group-mentions"`    |
| `reactionNotifications` | per akun → channel → default `"own"`                                            |

`reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika menargetkan pesan Matrix yang dibuat bot; `"off"` menonaktifkan event sistem reaksi. Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- Riwayat ruang Matrix hanya untuk ruang. DM tetap memakai riwayat sesi normal.
- Riwayat ruang Matrix hanya pending: OpenClaw menyangga pesan ruang yang belum memicu balasan, lalu mengambil snapshot jendela tersebut ketika mention atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di body masuk utama untuk giliran tersebut.
- Percobaan ulang event Matrix yang sama menggunakan ulang snapshot riwayat asli alih-alih bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks ruang tambahan seperti teks balasan yang diambil, akar thread, dan riwayat pending.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist ruang/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
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

Lihat [Grup](/id/channels/groups) untuk perilaku gating mention dan allowlist.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan ulang kode pairing pending yang sama dan dapat mengirim balasan pengingat setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan ruang langsung

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke ruang solo lama alih-alih DM aktif. Periksa pemetaan saat ini untuk peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk setup multi-akun. Alur perbaikan:

- lebih memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat yang saat ini sudah bergabung dengan pengguna tersebut
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Ini tidak menghapus ruang lama secara otomatis. Ini memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix berikutnya, notifikasi verifikasi, dan alur direct-message lainnya menargetkan ruang yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk override per akun):

- `enabled`: mengirim persetujuan melalui prompt native Matrix. Ketika tidak diatur atau `"auto"`, Matrix aktif otomatis setelah setidaknya satu approver dapat di-resolve. Atur `false` untuk menonaktifkan secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan exec. Opsional - fallback ke `channels.matrix.dm.allowFrom`.
- `target`: tempat prompt dikirim. `"dm"` (default) mengirim ke DM approver; `"channel"` mengirim ke ruang Matrix asal atau DM; `"both"` mengirim ke keduanya.
- `agentFilter` / `sessionFilter`: allowlist opsional untuk agen/sesi mana yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda antara jenis persetujuan:

- **Persetujuan exec** menggunakan `execApprovals.approvers`, dengan fallback ke `dm.allowFrom`.
- **Persetujuan Plugin** mengotorisasi hanya melalui `dm.allowFrom`.

Kedua jenis berbagi pintasan reaksi Matrix dan pembaruan pesan. Approver melihat pintasan reaksi pada pesan persetujuan utama:

- `✅` izinkan sekali
- `❌` tolak
- `♾️` selalu izinkan (ketika kebijakan exec efektif mengizinkannya)

Perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Hanya approver yang sudah di-resolve yang dapat menyetujui atau menolak. Pengiriman channel untuk persetujuan exec menyertakan teks perintah - hanya aktifkan `channel` atau `both` di ruang tepercaya.

Terkait: [Persetujuan exec](/id/tools/exec-approvals).

## Perintah slash

Perintah slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dll.) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan mention Matrix milik bot sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa regex mention kustom. Ini menjaga bot tetap responsif terhadap posting bergaya ruang `@mention /command` yang dikirim Element dan klien serupa ketika pengguna melakukan tab-complete bot sebelum mengetik perintah.

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

- Nilai `channels.matrix` level teratas bertindak sebagai default untuk akun bernama kecuali akun meng-override-nya.
- Scope entri ruang yang diwarisi ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` dibagikan ke semua akun; `account: "default"` tetap berfungsi ketika akun default dikonfigurasi di level teratas.

**Pemilihan akun default:**

- Atur `defaultAccount` untuk memilih akun bernama yang diprioritaskan oleh perutean implisit, probing, dan perintah CLI.
- Jika Anda memiliki beberapa akun dan salah satunya benar-benar bernama `default`, OpenClaw menggunakannya secara implisit meskipun `defaultAccount` belum diatur.
- Jika Anda memiliki beberapa akun bernama dan tidak ada default yang dipilih, perintah CLI menolak menebak - atur `defaultAccount` atau teruskan `--account <id>`.
- Blok tingkat atas `channels.matrix.*` hanya diperlakukan sebagai akun `default` implisit jika auth-nya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang di-cache mencakup auth.

**Promosi:**

- Saat OpenClaw mempromosikan konfigurasi akun tunggal menjadi multi-akun selama perbaikan atau penyiapan, OpenClaw mempertahankan akun bernama yang ada jika tersedia atau jika `defaultAccount` sudah menunjuk ke salah satunya. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan; kunci kebijakan pengiriman bersama tetap berada di tingkat atas.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit mengaktifkannya per akun.

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

Keikutsertaan eksplisit ini hanya mengizinkan target privat/internal tepercaya. Homeserver publik cleartext seperti
`http://matrix.example.org:8008` tetap diblokir. Utamakan `https://` bila memungkinkan.

## Mem-proxy lalu lintas Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) keluar yang eksplisit, atur `channels.matrix.proxy`:

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

Akun bernama dapat mengganti default tingkat atas dengan `channels.matrix.accounts.<id>.proxy`.
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas Matrix runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID room Matrix peka huruf besar-kecil. Gunakan kapitalisasi ID room yang persis dari Matrix
saat mengonfigurasi target pengiriman eksplisit, tugas cron, binding, atau allowlist.
OpenClaw menjaga kunci sesi internal tetap kanonis untuk penyimpanan, sehingga kunci huruf kecil
tersebut bukan sumber yang andal untuk ID pengiriman Matrix.

Lookup direktori live menggunakan akun Matrix yang sudah login:

- Lookup pengguna menanyakan direktori pengguna Matrix di homeserver tersebut.
- Lookup room menerima ID room dan alias eksplisit secara langsung. Lookup nama joined-room bersifat best-effort dan hanya berlaku untuk allowlist room runtime saat `dangerouslyAllowNameMatching: true` diatur.
- Jika nama room tidak dapat di-resolve menjadi ID atau alias, nama tersebut diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

Field pengguna bergaya allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Entri pengguna non-ID diabaikan secara default. Jika Anda mengatur `dangerouslyAllowNameMatching: true`, kecocokan persis display-name direktori Matrix di-resolve saat startup dan setiap kali allowlist berubah saat monitor berjalan; entri yang tidak dapat di-resolve diabaikan saat runtime.

Kunci allowlist room (`groups`, legacy `rooms`) sebaiknya berupa ID room atau alias. Kunci nama room polos diabaikan secara default; `dangerouslyAllowNameMatching: true` memulihkan lookup best-effort terhadap nama joined room.

### Akun dan koneksi

- `enabled`: aktifkan atau nonaktifkan channel.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun yang diprioritaskan saat beberapa akun Matrix dikonfigurasi.
- `accounts`: override per-akun bernama. Nilai tingkat atas `channels.matrix` diwarisi sebagai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau hostname internal.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Override per-akun didukung.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: access token untuk auth berbasis token. Nilai plaintext dan SecretRef didukung di seluruh penyedia env/file/exec ([Manajemen Rahasia](/id/gateway/secrets)).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai plaintext dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat login kata sandi.
- `avatarUrl`: URL self-avatar tersimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sinkronisasi startup.

### Enkripsi

- `encryption`: aktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default saat E2EE aktif) atau `"off"`. Meminta verifikasi mandiri secara otomatis saat startup jika perangkat ini belum diverifikasi.
- `startupVerificationCooldownHours`: cooldown sebelum permintaan startup otomatis berikutnya. Default: `24`.

### Akses dan kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room.
- `dm.enabled`: saat `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan room sebagai DM; ini tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: allowlist ID pengguna untuk lalu lintas DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: override khusus DM untuk threading balasan (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: terima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: saat `true`, memaksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `dangerouslyAllowNameMatching`: saat `true`, mengizinkan lookup direktori display-name Matrix untuk entri allowlist pengguna dan lookup nama joined-room untuk kunci allowlist room. Utamakan ID `@user:server` lengkap dan ID room atau alias.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `"allowlist"`. Entri alias di-resolve terhadap homeserver, bukan terhadap state yang diklaim oleh room yang mengundang.
- `contextVisibility`: visibilitas konteks tambahan (default `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Perilaku balasan

- `replyToMode`: `"off"`, `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, atau `"always"`.
- `threadBindings`: override per-channel untuk perutean sesi terikat thread dan siklus hidup.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, atau bentuk objek `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: saat `true`, blok asisten yang selesai disimpan sebagai pesan progres terpisah.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks keluar.
- `responsePrefix`: string opsional yang ditambahkan di awal balasan keluar.
- `textChunkLimit`: ukuran chunk keluar dalam karakter saat `chunkMode: "length"`. Default: `4000`.
- `chunkMode`: `"length"` (default, memisahkan berdasarkan jumlah karakter) atau `"newline"` (memisahkan pada batas baris).
- `historyLimit`: jumlah pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room memicu agen. Fallback ke `messages.groupChat.historyLimit`; default efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan masuk.

### Pengaturan reaksi

- `ackReaction`: override reaksi ack untuk channel/akun ini.
- `ackReactionScope`: override cakupan (default `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi masuk (default `"own"`, `"off"`).

### Tooling dan override per-room

- `actions`: gating tool per-aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per-room. Identitas sesi menggunakan ID room stabil setelah resolusi. (`rooms` adalah alias legacy.)
  - `groups.<room>.account`: batasi satu entri room yang diwarisi ke akun tertentu.
  - `groups.<room>.allowBots`: override per-room atas pengaturan tingkat channel (`true` atau `"mentions"`).
  - `groups.<room>.users`: allowlist pengirim per-room.
  - `groups.<room>.tools`: override izin/tolak tool per-room.
  - `groups.<room>.autoReply`: override gating mention per-room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter skill per-room.
  - `groups.<room>.systemPrompt`: cuplikan system prompt per-room.

### Pengaturan persetujuan exec

- `execApprovals.enabled`: kirim persetujuan exec melalui prompt native Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui. Fallback ke `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (default), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist agen/sesi opsional untuk pengiriman.

## Terkait

- [Ikhtisar Channel](/id/channels) - semua channel yang didukung
- [Pairing](/id/channels/pairing) - auth DM dan alur pairing
- [Grup](/id/channels/groups) - perilaku chat grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan hardening
