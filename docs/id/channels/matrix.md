---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan, penyiapan, dan contoh konfigurasi Matrix
title: Matriks
x-i18n:
    generated_at: "2026-07-12T13:56:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah plugin saluran yang dapat diunduh (`@openclaw/matrix`) dan dibuat berdasarkan `matrix-js-sdk` resmi. Plugin ini mendukung DM, ruang, utas, media, reaksi, jajak pendapat, lokasi, dan E2EE.

## Instalasi

```bash
openclaw plugins install @openclaw/matrix
```

Spesifikasi plugin tanpa awalan akan mencoba ClawHub terlebih dahulu, lalu menggunakan npm sebagai alternatif. Paksa sumber dengan `openclaw plugins install clawhub:@openclaw/matrix` atau `npm:@openclaw/matrix`. Dari checkout lokal: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` mendaftarkan dan mengaktifkan plugin; tidak diperlukan langkah `enable` terpisah. Saluran tetap tidak melakukan apa pun hingga dikonfigurasi di bawah ini. Lihat [Plugin](/id/tools/plugin) untuk aturan instalasi umum.

## Penyiapan

1. Buat akun Matrix di homeserver Anda.
2. Konfigurasikan `channels.matrix` dengan `homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`.
3. Mulai ulang Gateway.
4. Mulai DM dengan bot, atau undang bot ke ruang. Undangan baru hanya diterima jika diizinkan oleh [`autoJoin`](#auto-join).

### Penyiapan interaktif

```bash
openclaw channels add
openclaw configure --section channels
```

Wisaya meminta URL homeserver, metode autentikasi (token atau kata sandi), ID pengguna (hanya untuk autentikasi kata sandi), nama perangkat opsional, apakah E2EE akan diaktifkan, serta akses ruang/gabung otomatis. Jika variabel lingkungan `MATRIX_*` yang sesuai sudah tersedia dan akun belum memiliki autentikasi tersimpan, wisaya menawarkan pintasan variabel lingkungan. Selesaikan nama ruang sebelum menyimpan daftar izin dengan `openclaw channels resolve --channel matrix "Project Room"`. Mengaktifkan E2EE dalam wisaya menjalankan bootstrap yang sama dengan [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Nilai bawaan `channels.matrix.autoJoin` adalah `"off"`: bot tidak akan muncul di ruang atau DM baru dari undangan baru hingga Anda bergabung secara manual. OpenClaw tidak dapat menentukan pada saat undangan diterima apakah undangan tersebut merupakan DM atau grup, sehingga setiap undangan diproses terlebih dahulu melalui `autoJoin`; `dm.policy` baru berlaku kemudian, setelah bot bergabung dan ruang diklasifikasikan.

<Warning>
Tetapkan `autoJoin: "allowlist"` bersama `autoJoinAllowlist` untuk membatasi undangan yang diterima, atau `autoJoin: "always"` untuk menerima setiap undangan.

`autoJoinAllowlist` hanya menerima `!roomId:server`, `#alias:server`, atau `*`. Nama ruang biasa ditolak; alias diselesaikan terhadap homeserver, bukan berdasarkan status yang diklaim oleh ruang pengundang.
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

### Format target daftar izin

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan diabaikan secara bawaan (karena dapat berubah); tetapkan `dangerouslyAllowNameMatching: true` hanya untuk kompatibilitas nama tampilan secara eksplisit.
- Kunci daftar izin ruang (`groups`, alias lama `rooms`): gunakan `!room:server` atau `#alias:server`. Nama biasa diabaikan kecuali `dangerouslyAllowNameMatching: true`.
- Daftar izin undangan (`autoJoinAllowlist`): gunakan `!room:server`, `#alias:server`, atau `*`. Nama biasa selalu ditolak.

### Normalisasi ID akun

Wisaya mengubah nama yang mudah dibaca menjadi ID akun yang dinormalisasi (`Ops Bot` -> `ops-bot`). Tanda baca di-escape dalam bentuk heksadesimal pada nama variabel lingkungan bercakupan agar akun tidak bertabrakan: `-` (0x2D) menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke awalan lingkungan `MATRIX_OPS_X2D_PROD_`.

### Kredensial tersimpan dalam cache

Matrix menyimpan kredensial dalam cache di `~/.openclaw/credentials/matrix/`: `credentials.json` untuk akun bawaan, `credentials-<account>.json` untuk akun bernama. Jika kredensial tersimpan dalam cache tersedia, OpenClaw menganggap Matrix telah dikonfigurasi meskipun tidak ada `accessToken` dalam berkas konfigurasi—ini mencakup penyiapan, `openclaw doctor`, dan pemeriksaan status saluran.

### Variabel lingkungan

Variabel lingkungan yang didukung oleh kunci konfigurasi digunakan ketika kunci konfigurasi yang setara belum ditetapkan. Akun bawaan menggunakan nama tanpa awalan; akun bernama menyisipkan token akun sebelum sufiks (lihat [normalisasi](#account-id-normalization)).

| Akun bawaan           | Akun bernama (`<ID>` = token akun)       |
| --------------------- | ---------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                 |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`               |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                    |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                   |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                  |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                |

Untuk akun `ops`, nama menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. `MATRIX_HOMESERVER` (dan varian bercakupan `*_HOMESERVER` apa pun) tidak dapat ditetapkan dari `.env` ruang kerja; lihat [Berkas `.env` ruang kerja](/id/gateway/security).

<Note>
Kunci pemulihan bukan variabel lingkungan yang didukung konfigurasi: OpenClaw tidak pernah membacanya langsung dari lingkungan. Teks panduan CLI menyarankan untuk menyalurkannya melalui variabel shell bernama `MATRIX_RECOVERY_KEY` untuk akun bawaan, atau `MATRIX_RECOVERY_KEY_<ID>` (ID akun biasa dalam huruf kapital, tanpa escape heksadesimal) untuk akun bernama—lihat [Verifikasi perangkat ini dengan kunci pemulihan](#verify-this-device-with-a-recovery-key).
</Note>

## Contoh konfigurasi

Konfigurasi dasar praktis dengan pemasangan DM, daftar izin ruang, dan E2EE:

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

Streaming balasan Matrix bersifat opsional. `streaming` mengontrol cara OpenClaw mengirimkan balasan asisten yang sedang berlangsung; `blockStreaming` mengontrol apakah setiap blok yang selesai dipertahankan sebagai pesan Matrix tersendiri.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Untuk mempertahankan pratinjau jawaban langsung tetapi menyembunyikan baris sementara alat/progres, gunakan bentuk objek:

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

Bentuk objek lengkap menerima `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pilih dari label yang dikonfigurasi atau label bawaan (false untuk menyembunyikan)
          labels: ["Thinking", "Writing", "Searching"], // kandidat untuk label: "auto"
          maxLines: 8, // jumlah maksimum baris progres bergulir (bawaan: 8)
          maxLineChars: 120, // jumlah maksimum karakter per baris sebelum dipotong (bawaan: 120)
          toolProgress: true, // tampilkan aktivitas alat/progres (bawaan: true)
        },
      },
    },
  },
}
```

- `progress.label`: label khusus, `"auto"`/tidak ditetapkan untuk memilih label yang dikonfigurasi atau label bawaan, atau `false` untuk menyembunyikannya.
- `progress.labels`: kandidat yang hanya digunakan ketika `label` adalah `"auto"` atau tidak ditetapkan.
- `progress.maxLines`: jumlah maksimum baris progres bergulir yang dipertahankan dalam draf; baris yang lebih lama dari batas ini akan dipangkas.
- `progress.maxLineChars`: jumlah maksimum karakter per baris progres ringkas sebelum dipotong.
- `progress.toolProgress`: ketika `true` (bawaan), aktivitas alat/progres langsung muncul dalam draf.

| `streaming`       | Perilaku                                                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (bawaan)  | Tunggu balasan lengkap, lalu kirim sekali. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                                  |
| `"partial"`       | Edit satu pesan teks biasa secara langsung saat model menulis blok saat ini. Klien standar mungkin mengirim notifikasi pada pratinjau pertama, bukan pada edit terakhir. |
| `"quiet"`         | Sama seperti `"partial"`, tetapi pesannya berupa pemberitahuan tanpa notifikasi. Penerima diberi notifikasi sekali ketika aturan push per pengguna cocok dengan edit final (lihat di bawah). |
| `"progress"`      | Mengirim baris progres ringkas satu per satu menggunakan draf progres.                                                                                                   |

`blockStreaming` (bawaan `false`) tidak bergantung pada `streaming`:

| `streaming`             | `blockStreaming: true`                                                        | `blockStreaming: false` (bawaan)                             |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `"partial"` / `"quiet"` | Draf langsung untuk blok saat ini, blok yang selesai dipertahankan sebagai pesan | Draf langsung untuk blok saat ini, diselesaikan di tempat   |
| `"off"`                 | Satu pesan Matrix dengan notifikasi untuk setiap blok yang selesai            | Satu pesan Matrix dengan notifikasi untuk seluruh balasan    |

Catatan:

- Jika ukuran pratinjau melampaui batas ukuran per peristiwa Matrix, OpenClaw menghentikan streaming pratinjau dan beralih ke pengiriman hasil akhir saja.
- Balasan media selalu mengirim lampiran secara normal; jika pratinjau lama tidak dapat digunakan kembali dengan aman, OpenClaw menyuntingnya sebelum mengirim balasan media final.
- Pembaruan pratinjau progres alat diaktifkan secara bawaan ketika streaming pratinjau aktif. Tetapkan `streaming.preview.toolProgress: false` untuk mempertahankan edit pratinjau bagi teks jawaban, tetapi membiarkan progres alat menggunakan jalur pengiriman normal.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan `streaming: "off"` untuk profil batas laju yang paling konservatif.

## Pesan suara

Catatan suara Matrix yang masuk ditranskripsikan sebelum gerbang penyebutan ruang, sehingga catatan suara yang menyebut nama bot dapat memicu agen dalam ruang dengan `requireMention: true`, dan agen menerima transkrip, bukan sekadar placeholder lampiran audio.

Matrix menggunakan penyedia media audio bersama di bawah `tools.media.audio`, seperti OpenAI `gpt-4o-mini-transcribe`. Lihat [Ikhtisar alat media](/id/tools/media-overview) untuk penyiapan dan batas penyedia.

- Peristiwa `m.audio` dan peristiwa `m.file` dengan tipe MIME `audio/*` memenuhi syarat.
- Dalam ruang terenkripsi, OpenClaw mendekripsi lampiran melalui jalur media Matrix yang sudah ada sebelum transkripsi.
- Transkrip ditandai sebagai hasil buatan mesin dan tidak tepercaya dalam prompt agen.
- Lampiran ditandai sebagai telah ditranskripsikan agar alat media hilir tidak mentranskripsikannya lagi.
- Tetapkan `tools.media.audio.enabled: false` untuk menonaktifkan transkripsi audio secara global.

## Metadata persetujuan

Prompt persetujuan asli Matrix merupakan peristiwa `m.room.message` biasa dengan konten khusus OpenClaw di bawah kunci `com.openclaw.approval`. Klien standar tetap merender isi teks; klien yang memahami OpenClaw dapat membaca ID persetujuan terstruktur, jenis, status, keputusan, serta detail eksekusi/plugin.

Jika prompt terlalu panjang untuk satu peristiwa Matrix, OpenClaw membagi teks yang terlihat menjadi beberapa bagian dan hanya melampirkan `com.openclaw.approval` pada bagian pertama. Reaksi izinkan/tolak terikat ke peristiwa pertama tersebut, sehingga prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu peristiwa.

### Aturan push yang dihosting sendiri untuk pratinjau final yang senyap

`streaming: "quiet"` hanya memberi tahu penerima setelah blok atau giliran difinalisasi—aturan push per pengguna harus cocok dengan penanda pratinjau final. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk panduan lengkapnya.

## Ruang antarbot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi akan diabaikan. Gunakan `allowBots` untuk secara sengaja mengizinkan lalu lintas antaragen:

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

- `allowBots: true` menerima pesan dari akun bot Matrix lain yang dikonfigurasi di ruang dan DM yang diizinkan.
- `allowBots: "mentions"` hanya menerima pesan tersebut ketika pesan secara terlihat menyebut bot ini di ruang; DM tetap diizinkan tanpa syarat tersebut.
- `groups.<room>.allowBots` menggantikan pengaturan tingkat akun untuk satu ruang.
- Pesan bot terkonfigurasi yang diterima menggunakan [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection`, lalu ganti per akun dengan `channels.matrix.botLoopProtection` atau per ruang dengan `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari perulangan balasan ke diri sendiri.
- Matrix tidak memiliki penanda bot bawaan; OpenClaw menganggap "ditulis oleh bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi pada Gateway OpenClaw ini".

Gunakan daftar ruang yang diizinkan secara ketat dan persyaratan penyebutan saat mengaktifkan lalu lintas antarbot di ruang bersama.

## Enkripsi dan verifikasi

Di ruang terenkripsi (E2EE), peristiwa gambar keluar menggunakan `thumbnail_file` agar pratinjau gambar dienkripsi bersama lampiran lengkap; ruang yang tidak terenkripsi menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi—Plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik lengkap), `--json` (keluaran yang dapat dibaca mesin), dan `--account <id>` (penyiapan multiakun). Secara default, keluarannya ringkas.

### Mengaktifkan enkripsi

```bash
openclaw matrix encryption setup
```

Melakukan bootstrap penyimpanan rahasia dan penandatanganan silang, membuat cadangan kunci ruang jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag yang berguna:

- `--recovery-key <key>` menerapkan kunci pemulihan sebelum bootstrap (utamakan bentuk stdin di bawah)
- `--force-reset-cross-signing` membuang identitas penandatanganan silang saat ini dan membuat yang baru (hanya untuk penggunaan yang disengaja)

Untuk akun baru, aktifkan E2EE saat akun dibuat:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` adalah alias untuk `--enable-e2ee`. Konfigurasi manual yang setara:

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

`verify status` melaporkan tiga sinyal kepercayaan yang independen (`--verbose` menampilkan semuanya):

- `Dipercaya secara lokal`: hanya dipercaya oleh klien ini
- `Diverifikasi melalui penandatanganan silang`: SDK melaporkan verifikasi melalui penandatanganan silang
- `Ditandatangani oleh pemilik`: ditandatangani oleh kunci penandatanganan mandiri Anda sendiri (hanya untuk diagnostik)

`Diverifikasi oleh pemilik` bernilai `ya` hanya ketika `Diverifikasi melalui penandatanganan silang` bernilai `ya`; kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik upaya terbaik tanpa terlebih dahulu menyiapkan akun Matrix; berguna untuk pemeriksaan luring atau konfigurasi parsial.

### Memverifikasi perangkat ini dengan kunci pemulihan

Salurkan kunci pemulihan melalui stdin alih-alih meneruskannya melalui baris perintah:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah tersebut melaporkan tiga status:

- `Kunci pemulihan diterima`: Matrix menerima kunci untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Cadangan dapat digunakan`: cadangan kunci ruang dapat dimuat dengan materi pemulihan tepercaya.
- `Perangkat diverifikasi oleh pemilik`: perangkat ini memiliki kepercayaan penuh terhadap identitas penandatanganan silang Matrix.

Perintah keluar dengan status bukan nol ketika kepercayaan identitas penuh belum lengkap, meskipun kunci pemulihan telah membuka materi cadangan. Dalam kasus tersebut, selesaikan verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu hingga `Diverifikasi melalui penandatanganan silang: ya` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyesuaikan waktu tunggu.

Bentuk kunci literal `openclaw matrix verify device "<recovery-key>"` juga berfungsi, tetapi kunci akan tersimpan dalam riwayat shell.

### Melakukan bootstrap atau memperbaiki penandatanganan silang

```bash
openclaw matrix verify bootstrap
```

Perintah perbaikan/penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap penyimpanan rahasia, menggunakan kembali kunci pemulihan yang ada jika memungkinkan
- melakukan bootstrap penandatanganan silang dan mengunggah kunci publik yang belum ada
- menandai dan menandatangani silang perangkat saat ini
- membuat cadangan kunci ruang di sisi server jika belum ada

Jika homeserver memerlukan UIA untuk mengunggah kunci penandatanganan silang, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, kemudian `m.login.password` (memerlukan `channels.matrix.password`).

Flag yang berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas penandatanganan silang saat ini (hanya jika disengaja; memerlukan kunci pemulihan aktif yang disimpan atau diberikan melalui `--recovery-key-stdin`)

### Cadangan kunci ruang

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menunjukkan apakah cadangan di sisi server tersedia dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor kunci ruang yang dicadangkan ke penyimpanan kriptografi lokal; hilangkan `--recovery-key-stdin` jika kunci pemulihan sudah tersimpan di disk.

Untuk mengganti cadangan yang rusak dengan garis dasar baru (menerima hilangnya riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang penyimpanan rahasia jika rahasia cadangan saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya ketika kunci pemulihan sebelumnya memang harus berhenti membuka garis dasar cadangan baru.

### Mencantumkan, meminta, dan menanggapi verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi yang tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun ini. `--own-user` meminta verifikasi mandiri (terima perintah konfirmasi di klien Matrix lain milik pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lainnya.

Untuk penanganan siklus hidup tingkat rendah—biasanya saat membayangi permintaan masuk dari klien lain—perintah berikut bertindak pada permintaan tertentu `<id>` (dicetak oleh `verify list` dan `verify request`):

| Perintah                                   | Tujuan                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Menerima permintaan masuk                                                         |
| `openclaw matrix verify start <id>`        | Memulai alur SAS                                                                  |
| `openclaw matrix verify sas <id>`          | Mencetak emoji atau angka desimal SAS                                              |
| `openclaw matrix verify confirm-sas <id>`  | Mengonfirmasi bahwa SAS cocok dengan yang ditampilkan klien lain                  |
| `openclaw matrix verify mismatch-sas <id>` | Menolak SAS ketika emoji atau angka desimal tidak cocok                           |
| `openclaw matrix verify cancel <id>`       | Membatalkan; menerima `--reason <text>` dan `--code <matrix-code>` secara opsional |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, dan `cancel` semuanya menerima `--user-id` dan `--room-id` sebagai petunjuk tindak lanjut DM ketika verifikasi dikaitkan dengan ruang pesan langsung tertentu.

### Catatan multiakun

Tanpa `--account <id>`, perintah CLI Matrix menggunakan akun default implisit. Jika terdapat beberapa akun bernama dan tidak ada `channels.matrix.defaultAccount`, perintah tidak akan menebak dan meminta Anda memilih. Ketika E2EE dinonaktifkan atau tidak tersedia untuk akun bernama, pesan kesalahan menunjuk ke kunci konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Perilaku saat memulai">
    Dengan `encryption: true`, nilai default `startupVerification` adalah `"if-unverified"`. Saat memulai, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikat dan menerapkan masa jeda (24 jam secara default). Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Saat memulai, proses juga menjalankan bootstrap kriptografi konservatif dengan menggunakan kembali penyimpanan rahasia dan identitas penandatanganan silang saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan terkendali bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, proses saat memulai mencatat peringatan dan tetap tidak fatal. Perangkat yang sudah ditandatangani pemilik akan dipertahankan.

    Lihat [Migrasi Matrix](/id/channels/matrix-migration) untuk alur peningkatan versi lengkap.

  </Accordion>

  <Accordion title="Pemberitahuan verifikasi">
    Matrix memposting pemberitahuan siklus hidup verifikasi ke ruang verifikasi DM yang ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verify by emoji"), mulai/selesai, serta detail SAS (emoji/desimal) jika tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima secara otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia—Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

    Pemberitahuan sistem verifikasi tidak diteruskan ke alur pemrosesan obrolan agen.

  </Accordion>

  <Accordion title="Perangkat Matrix yang dihapus atau tidak valid">
    Jika `verify status` menyatakan perangkat saat ini tidak lagi tercantum di homeserver, buat perangkat Matrix OpenClaw baru. Untuk masuk dengan kata sandi:

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

  <Accordion title="Pemeliharaan perangkat">
    Perangkat lama yang dikelola OpenClaw dapat menumpuk. Cantumkan dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Penyimpanan kriptografi">
    E2EE Matrix menggunakan jalur kriptografi Rust resmi `matrix-js-sdk` dengan `fake-indexeddb` sebagai shim IndexedDB. Status kriptografi disimpan secara persisten di `crypto-idb-snapshot.json` (dengan izin berkas yang ketat).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup penyimpanan sinkronisasi, penyimpanan kriptografi, kunci pemulihan, snapshot IDB, pengikatan utas, dan status verifikasi saat memulai. Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali akar terbaik yang sudah ada agar status sebelumnya tetap terlihat.

    Satu root hash token lama dapat menjadi jalur kontinuitas rotasi token yang normal. Jika OpenClaw mencatat `matrix: multiple populated token-hash storage roots detected`, periksa direktori akun dan arsipkan root saudara yang sudah tidak digunakan hanya setelah memastikan root aktif yang dipilih dalam kondisi baik. Sebaiknya pindahkan root yang sudah tidak digunakan ke direktori `_archive/` alih-alih langsung menghapusnya.

  </Accordion>
</AccordionGroup>

## Pengelolaan profil

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Berikan kedua opsi dalam satu pemanggilan. Matrix menerima URL avatar `mxc://` secara langsung; memberikan `http://`/`https://` akan mengunggah berkas terlebih dahulu dan menyimpan URL `mxc://` yang telah dihasilkan ke `channels.matrix.avatarUrl` (atau penggantian khusus akun).

## Utas

Matrix mendukung utas native untuk balasan otomatis maupun pengiriman melalui alat pesan. Dua pengaturan independen mengendalikan perilakunya:

### Perutean sesi (`sessionScope`)

`dm.sessionScope` menentukan cara ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (bawaan): semua ruang DM dengan rekan yang dirutekan sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan kunci sesinya sendiri, bahkan untuk rekan yang sama.

Pengikatan percakapan eksplisit selalu lebih diprioritaskan daripada `sessionScope`; ruang dan utas yang terikat tetap menggunakan sesi target yang dipilih.

### Pengutasan balasan (`threadReplies`)

`threadReplies` menentukan tempat bot mengirim balasannya:

- `"off"`: balasan berada di tingkat teratas. Pesan masuk dalam utas tetap berada di sesi induk.
- `"inbound"`: membalas di dalam utas hanya jika pesan masuk sudah berada di utas tersebut.
- `"always"`: membalas di dalam utas yang berakar pada pesan pemicu; percakapan tersebut dirutekan melalui sesi dengan cakupan utas yang sesuai sejak pemicu pertama dan seterusnya.

`dm.threadReplies` menggantikan pengaturan ini khusus untuk DM—misalnya, mempertahankan isolasi utas ruang sambil menjaga DM tetap tanpa utas.

### Pewarisan utas dan perintah garis miring

- Pesan masuk dalam utas menyertakan pesan root utas sebagai konteks agen tambahan.
- Pengiriman melalui alat pesan secara otomatis mewarisi utas Matrix saat ini ketika menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali `threadId` eksplisit diberikan.
- Penggunaan kembali target pengguna DM hanya berlaku ketika metadata sesi saat ini membuktikan rekan DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali menggunakan perutean normal dengan cakupan pengguna.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat utas semuanya berfungsi di ruang dan DM Matrix.
- `/focus` tingkat teratas membuat utas Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSessions` diaktifkan.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam utas Matrix yang sudah ada akan mengikat utas tersebut di tempatnya.

Ketika OpenClaw mendeteksi ruang DM Matrix bertabrakan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw mengirim `m.notice` satu kali yang mengarahkan ke jalan keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Pemberitahuan tersebut hanya muncul ketika pengikatan utas diaktifkan.

## Pengikatan percakapan ACP

Ruang Matrix, DM, dan utas Matrix yang sudah ada dapat menjadi ruang kerja ACP persisten tanpa mengubah permukaan obrolan.

Alur cepat operator:

- Jalankan `/acp spawn codex --bind here` di dalam DM, ruang, atau utas Matrix yang sudah ada dan ingin terus digunakan.
- Dalam DM atau ruang tingkat teratas, DM/ruang saat ini tetap menjadi permukaan obrolan dan pesan berikutnya dirutekan ke sesi ACP yang dibuat.
- Di dalam utas yang sudah ada, `--bind here` mengikat utas saat ini di tempatnya.
- `/new` dan `/reset` mengatur ulang sesi ACP terikat yang sama di tempatnya.
- `/acp close` menutup sesi ACP dan menghapus pengikatannya.

`--bind here` tidak membuat utas turunan Matrix. `threadBindings.spawnSessions` mengendalikan `/acp spawn --thread auto|here`, ketika OpenClaw perlu membuat atau mengikat utas turunan.

### Konfigurasi pengikatan utas

Matrix mewarisi bawaan global dari `session.threadBindings` dan mendukung penggantian khusus kanal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: mengendalikan pembuatan utas subagen maupun ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: penggantian yang lebih spesifik untuk pembuatan khusus subagen atau khusus ACP.
- `threadBindings.defaultSpawnContext`

Pembuatan sesi terikat utas Matrix diaktifkan secara bawaan. Atur `threadBindings.spawnSessions: false` untuk mencegah `/focus` tingkat teratas dan `/acp spawn --thread auto|here` membuat/mengikat utas Matrix. Atur `threadBindings.defaultSpawnContext: "isolated"` ketika pembuatan utas subagen native tidak boleh mencabangkan transkrip induk.

## Reaksi

Matrix mendukung reaksi keluar, pemberitahuan reaksi masuk, dan reaksi tanda terima.

Peralatan reaksi keluar dikendalikan oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke peristiwa Matrix.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk peristiwa Matrix.
- `emoji=""` menghapus reaksi milik bot pada peristiwa tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari bot.

**Urutan resolusi** (nilai pertama yang ditentukan akan digunakan):

| Pengaturan              | Urutan                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | khusus akun -> kanal -> `messages.ackReaction` -> emoji identitas agen sebagai cadangan |
| `ackReactionScope`      | khusus akun -> kanal -> `messages.ackReactionScope` -> bawaan `"group-mentions"`     |
| `reactionNotifications` | khusus akun -> kanal -> bawaan `"own"`                                               |

`reactionNotifications: "own"` meneruskan peristiwa `m.reaction` yang ditambahkan ketika menargetkan pesan Matrix yang ditulis bot; `"off"` menonaktifkan peristiwa sistem reaksi. Penghapusan reaksi tidak disintesis menjadi peristiwa sistem—Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengendalikan jumlah pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang memicu agen. Beralih ke `messages.groupChat.historyLimit` sebagai cadangan; nilai bawaan efektif `0` jika keduanya tidak diatur (dinonaktifkan).
- Riwayat ruang Matrix hanya berlaku untuk ruang; DM tetap menggunakan riwayat sesi normal.
- Riwayat ruang hanya mencakup pesan tertunda: OpenClaw menyangga pesan ruang yang belum memicu balasan, lalu mengambil cuplikan jendela tersebut ketika penyebutan atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada dalam isi pesan masuk utama untuk giliran itu.
- Percobaan ulang peristiwa Matrix yang sama menggunakan kembali cuplikan riwayat asli alih-alih bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol `contextVisibility` bersama untuk konteks ruang tambahan seperti teks balasan yang diambil, root utas, dan riwayat tertunda.

- `contextVisibility: "all"` adalah bawaan. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` menyaring konteks tambahan agar hanya mencakup pengirim yang diizinkan oleh pemeriksaan daftar izin ruang/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan yang dikutip secara eksplisit.

Pengaturan ini hanya memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan. Otorisasi pemicu tetap berasal dari `groupPolicy`, `groups`, `groupAllowFrom`, dan pengaturan kebijakan DM.

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

Untuk sepenuhnya membisukan DM sambil mempertahankan fungsi ruang, atur `dm.enabled: false`:

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

Lihat [Grup](/id/channels/groups) untuk perilaku pengendalian berdasarkan penyebutan dan daftar izin.

Contoh pemasangan untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirim pesan sebelum persetujuan, OpenClaw menggunakan kembali kode pemasangan tertunda yang sama dan dapat mengirim balasan pengingat setelah masa tunggu singkat alih-alih membuat kode baru.

Lihat [Pemasangan](/id/channels/pairing) untuk alur pemasangan DM bersama dan tata letak penyimpanannya.

## Perbaikan ruang langsung

Jika status pesan langsung menyimpang, OpenClaw dapat memiliki pemetaan `m.direct` usang yang menunjuk ke ruang tunggal lama, bukan DM aktif. Periksa pemetaan saat ini untuk seorang rekan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk penyiapan multi-akun. Alur perbaikan:

- memprioritaskan DM 1:1 ketat yang sudah dipetakan dalam `m.direct`
- beralih sebagai cadangan ke DM 1:1 ketat mana pun yang saat ini telah digabungkan dengan pengguna tersebut
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM yang sehat

Alur ini tidak menghapus ruang lama secara otomatis. Alur ini memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix, pemberitahuan verifikasi, dan alur pesan langsung lainnya di masa mendatang menargetkan ruang yang tepat.

## Persetujuan eksekusi

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk penggantian khusus akun):

- `enabled`: mengirimkan persetujuan melalui permintaan native Matrix. Jika tidak diatur atau bernilai `"auto"`, akan aktif otomatis setelah setidaknya satu pemberi persetujuan dapat ditentukan; atur `false` untuk menonaktifkannya secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan eksekusi. Beralih ke `channels.matrix.dm.allowFrom` sebagai cadangan.
- `target`: tempat permintaan dikirim. `"dm"` (bawaan) mengirim ke DM pemberi persetujuan; `"channel"` mengirim ke ruang atau DM asal; `"both"` mengirim ke keduanya.
- `agentFilter` / `sessionFilter`: daftar izin opsional untuk menentukan agen/sesi yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda menurut jenis persetujuan:

- **Persetujuan eksekusi** menggunakan `execApprovals.approvers`, dengan `dm.allowFrom` sebagai cadangan.
- **Persetujuan Plugin** memberikan otorisasi hanya melalui `dm.allowFrom`.

Kedua jenis menggunakan pintasan reaksi dan pembaruan pesan Matrix yang sama. Pemberi persetujuan melihat pintasan reaksi pada pesan persetujuan utama:

- ✅ izinkan sekali
- ❌ tolak
- ♾️ selalu izinkan (ketika kebijakan eksekusi efektif mengizinkannya)

Perintah garis miring cadangan: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Hanya pemberi persetujuan yang berhasil ditentukan yang dapat menyetujui atau menolak. Pengiriman kanal untuk persetujuan eksekusi menyertakan teks perintah—hanya aktifkan `channel` atau `both` di ruang tepercaya.

Terkait: [Persetujuan eksekusi](/id/tools/exec-approvals).

## Perintah garis miring

Perintah garis miring (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dan sebagainya) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan penyebutan Matrix milik bot, sehingga `@bot:server /new` memicu jalur perintah tanpa regex penyebutan khusus—hal ini membuat bot tetap responsif terhadap kiriman bergaya ruang `@mention /command` yang dihasilkan Element dan klien serupa ketika pengguna melengkapi nama bot dengan tombol tab sebelum mengetik perintah.

Aturan otorisasi tetap berlaku: pengirim perintah harus memenuhi kebijakan daftar izin/pemilik DM atau ruang yang sama seperti pesan biasa.

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

- Nilai `channels.matrix` tingkat teratas bertindak sebagai nilai default untuk akun bernama, kecuali akun tersebut menggantinya.
- Batasi entri ruang yang diwariskan ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` digunakan bersama di seluruh akun; `account: "default"` tetap berfungsi ketika akun default dikonfigurasi di tingkat teratas.

**Pemilihan akun default:**

- Atur `defaultAccount` untuk memilih akun bernama yang diutamakan oleh perutean implisit, pemeriksaan, dan perintah CLI.
- Jika Anda memiliki beberapa akun dan salah satunya secara harfiah bernama `default`, OpenClaw menggunakannya secara implisit meskipun `defaultAccount` tidak diatur.
- Dengan beberapa akun bernama dan tanpa akun default yang dipilih, perintah CLI tidak akan menebak—atur `defaultAccount` atau teruskan `--account <id>`.
- Blok `channels.matrix.*` tingkat teratas hanya diperlakukan sebagai akun `default` implisit ketika autentikasinya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang tersimpan dalam cache mencakup autentikasi.

**Promosi:**

- Ketika OpenClaw mempromosikan konfigurasi akun tunggal menjadi multiakun selama perbaikan atau penyiapan, OpenClaw mempertahankan akun bernama yang ada jika tersedia atau jika `defaultAccount` sudah mengarah ke akun tersebut. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun hasil promosi; kunci kebijakan pengiriman bersama tetap berada di tingkat teratas.

Lihat [referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multiakun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF, kecuali Anda mengaktifkannya untuk setiap akun.

Jika homeserver Anda berjalan di localhost, IP LAN/Tailscale, atau nama host internal, aktifkan `network.dangerouslyAllowPrivateNetwork` untuk akun tersebut:

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

Keikutsertaan ini hanya mengizinkan target privat/internal yang tepercaya. Homeserver publik tanpa enkripsi seperti `http://matrix.example.org:8008` tetap diblokir. Utamakan `https://` jika memungkinkan.

## Memproksikan lalu lintas Matrix

Jika deployment Matrix Anda memerlukan proksi HTTP(S) keluar yang eksplisit, atur `channels.matrix.proxy`:

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

Akun bernama dapat mengganti nilai default tingkat teratas dengan `channels.matrix.accounts.<id>.proxy`. OpenClaw menggunakan pengaturan proksi yang sama untuk lalu lintas Matrix saat runtime dan pemeriksaan status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target ruang atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Ruang: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID ruang Matrix peka huruf besar-kecil. Gunakan kapitalisasi ID ruang yang persis sama dengan di Matrix saat mengonfigurasi target pengiriman eksplisit, tugas cron, pengikatan, atau daftar izin. OpenClaw mempertahankan kunci sesi internal dalam bentuk kanonis untuk penyimpanan, sehingga kunci berhuruf kecil tersebut bukan sumber yang dapat diandalkan untuk ID pengiriman Matrix.

Pencarian direktori langsung menggunakan akun Matrix yang sedang masuk:

- Pencarian pengguna mengueri direktori pengguna Matrix pada homeserver tersebut.
- Pencarian ruang menerima ID dan alias ruang eksplisit secara langsung. Pencarian nama ruang yang telah diikuti bersifat upaya terbaik dan hanya berlaku untuk daftar izin ruang saat runtime jika `dangerouslyAllowNameMatching: true` ditetapkan.
- Jika nama ruang tidak dapat diuraikan menjadi ID atau alias, nama tersebut diabaikan oleh resolusi daftar izin saat runtime.

## Referensi konfigurasi

Kolom pengguna bergaya daftar izin (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Entri non-ID diabaikan secara default. Jika `dangerouslyAllowNameMatching: true` ditetapkan, kecocokan persis nama tampilan dalam direktori Matrix diuraikan saat proses dimulai dan setiap kali daftar izin berubah selagi pemantau berjalan; entri yang tidak dapat diuraikan diabaikan saat runtime.

Kunci daftar izin ruang (`groups`, `rooms` lama) sebaiknya berupa ID atau alias ruang. Kunci yang hanya berupa nama ruang diabaikan secara default; `dangerouslyAllowNameMatching: true` memulihkan pencarian upaya terbaik terhadap nama ruang yang telah diikuti.

### Akun dan koneksi

- `enabled`: aktifkan atau nonaktifkan kanal.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `accounts`: penggantian bernama per akun. Nilai `channels.matrix` tingkat atas diwarisi sebagai nilai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau nama host internal.
- `proxy`: URL proksi HTTP(S) opsional untuk lalu lintas Matrix. Mendukung penggantian per akun.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: token akses untuk autentikasi berbasis token. Nilai teks biasa dan SecretRef didukung di seluruh penyedia env/file/exec ([Pengelolaan Rahasia](/id/gateway/secrets)).
- `password`: kata sandi untuk masuk berbasis kata sandi. Nilai teks biasa dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat masuk dengan kata sandi.
- `avatarUrl`: URL avatar diri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum peristiwa yang diambil selama sinkronisasi awal.

### Enkripsi

- `encryption`: aktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default saat E2EE aktif) atau `"off"`. Secara otomatis meminta verifikasi mandiri saat proses dimulai jika perangkat ini belum terverifikasi.
- `startupVerificationCooldownHours`: masa tunggu sebelum permintaan otomatis berikutnya saat proses dimulai. Default: `24`.

### Akses dan kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: daftar izin ID pengguna untuk lalu lintas ruang.
- `mentionPatterns`: pola regex tercakup untuk penyebutan di ruang. Objek dengan `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Mengendalikan apakah `agents.list[].groupChat.mentionPatterns` yang dikonfigurasi berlaku per ruang.
- `dm.enabled`: jika `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan ruang sebagai DM; tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: daftar izin ID pengguna untuk lalu lintas DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: penggantian khusus DM untuk penguntaian balasan (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: terima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: jika `true`, memaksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `dangerouslyAllowNameMatching`: jika `true`, mengizinkan pencarian direktori berdasarkan nama tampilan Matrix untuk entri daftar izin pengguna dan pencarian nama ruang yang telah diikuti untuk kunci daftar izin ruang. Utamakan ID `@user:server` lengkap serta ID atau alias ruang.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: ruang/alias yang diizinkan saat `autoJoin` bernilai `"allowlist"`. Entri alias diuraikan terhadap homeserver, bukan terhadap status yang diklaim oleh ruang pengundang.
- `contextVisibility`: visibilitas konteks tambahan (`"all"` default, `"allowlist"`, `"allowlist_quote"`).

### Perilaku balasan

- `replyToMode`: `"off"` (default), `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"` (default tingkat atas diuraikan menjadi `"inbound"` kecuali ditetapkan secara eksplisit), `"inbound"`, atau `"always"`.
- `threadBindings`: penggantian per kanal untuk perutean dan siklus hidup sesi yang terikat ke utas.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, `"progress"`, atau bentuk objek `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: jika `true`, blok asisten yang telah selesai dipertahankan sebagai pesan kemajuan terpisah. Default: `false`.
- `markdown`: konfigurasi perenderan Markdown opsional untuk teks keluar.
- `responsePrefix`: string opsional yang ditambahkan di awal balasan keluar.
- `textChunkLimit`: ukuran potongan keluar dalam karakter saat `chunkMode: "length"`. Default: `4000`.
- `chunkMode`: `"length"` (default, membagi berdasarkan jumlah karakter) atau `"newline"` (membagi pada batas baris).
- `historyLimit`: jumlah pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang memicu agen. Menggunakan `messages.groupChat.historyLimit` sebagai cadangan; default efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan masuk. Default: `20`.

### Pengaturan reaksi

- `ackReaction`: penggantian reaksi pengakuan untuk kanal/akun ini.
- `ackReactionScope`: penggantian cakupan (`"group-mentions"` default, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`"own"` default, `"off"`).

### Peralatan dan penggantian per ruang

- `actions`: pembatasan alat per tindakan (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per ruang. Identitas sesi menggunakan ID ruang stabil setelah resolusi. (`rooms` adalah alias lama.)
  - `groups.<room>.account`: batasi satu entri ruang yang diwarisi ke akun tertentu.
  - `groups.<room>.enabled`: pengalih per ruang. Jika `false`, ruang diabaikan seolah-olah tidak ada dalam peta.
  - `groups.<room>.requireMention`: penggantian per ruang untuk persyaratan penyebutan tingkat kanal.
  - `groups.<room>.allowBots`: penggantian per ruang untuk pengaturan tingkat kanal (`true` atau `"mentions"`).
  - `groups.<room>.botLoopProtection`: penggantian per ruang untuk anggaran perlindungan perulangan antarbot.
  - `groups.<room>.users`: daftar izin pengirim per ruang.
  - `groups.<room>.tools`: penggantian izin/tolak alat per ruang.
  - `groups.<room>.autoReply`: penggantian penyaringan berdasarkan penyebutan per ruang. `true` menonaktifkan persyaratan penyebutan untuk ruang tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter Skills per ruang.
  - `groups.<room>.systemPrompt`: cuplikan prompt sistem per ruang.

### Pengaturan persetujuan eksekusi

- `execApprovals.enabled`: kirim persetujuan eksekusi melalui prompt asli Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan untuk menyetujui. Menggunakan `dm.allowFrom` sebagai cadangan.
- `execApprovals.target`: `"dm"` (default), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: daftar izin agen/sesi opsional untuk pengiriman.

## Terkait

- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) - alur autentikasi dan pemasangan DM
- [Grup](/id/channels/groups) - perilaku obrolan grup dan penyaringan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan pengerasan
