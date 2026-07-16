---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan, penyiapan, dan contoh konfigurasi Matrix
title: Matrix
x-i18n:
    generated_at: "2026-07-16T17:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah plugin saluran yang dapat diunduh (`@openclaw/matrix`) yang dibangun berdasarkan `matrix-js-sdk` resmi. Plugin ini mendukung DM, ruang, utas, media, reaksi, jajak pendapat, lokasi, dan E2EE.

## Instalasi

```bash
openclaw plugins install @openclaw/matrix
```

Spesifikasi plugin tanpa kualifikasi akan mencoba ClawHub terlebih dahulu, lalu beralih ke npm. Paksa sumber dengan `openclaw plugins install clawhub:@openclaw/matrix` atau `npm:@openclaw/matrix`. Dari checkout lokal: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` mendaftarkan dan mengaktifkan plugin; tidak diperlukan langkah `enable` terpisah. Saluran tetap tidak melakukan apa pun hingga dikonfigurasi di bawah ini. Lihat [Plugin](/id/tools/plugin) untuk aturan instalasi umum.

## Penyiapan

1. Buat akun Matrix di homeserver Anda.
2. Konfigurasikan `channels.matrix` dengan `homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`.
3. Mulai ulang Gateway.
4. Mulai DM dengan bot, atau undang bot ke ruang. Undangan baru hanya diterima jika [`autoJoin`](#auto-join) mengizinkannya.

### Penyiapan interaktif

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard meminta URL homeserver, metode autentikasi (token atau kata sandi), ID pengguna (hanya autentikasi kata sandi), nama perangkat opsional, apakah E2EE akan diaktifkan, serta akses ruang/gabung otomatis. Jika variabel lingkungan `MATRIX_*` yang cocok sudah ada dan akun belum memiliki autentikasi tersimpan, wizard menawarkan pintasan variabel lingkungan. Uraikan nama ruang sebelum menyimpan daftar izin dengan `openclaw channels resolve --channel matrix "Project Room"`. Mengaktifkan E2EE di wizard menjalankan bootstrap yang sama seperti [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` secara default adalah `"off"`: bot tidak akan muncul di ruang atau DM baru dari undangan baru hingga Anda bergabung secara manual. OpenClaw tidak dapat menentukan pada saat undangan diterima apakah undangan tersebut merupakan DM atau grup, sehingga setiap undangan melewati `autoJoin` terlebih dahulu; `dm.policy` baru berlaku kemudian, setelah bot bergabung dan ruang diklasifikasikan.

<Warning>
Tetapkan `autoJoin: "allowlist"` beserta `autoJoinAllowlist` untuk membatasi undangan yang diterima, atau `autoJoin: "always"` untuk menerima setiap undangan.

`autoJoinAllowlist` hanya menerima `!roomId:server`, `#alias:server`, atau `*`. Nama ruang biasa ditolak; alias diuraikan berdasarkan homeserver, bukan berdasarkan status yang diklaim oleh ruang pengundang.
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

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan secara default diabaikan (dapat berubah); tetapkan `dangerouslyAllowNameMatching: true` hanya untuk kompatibilitas nama tampilan secara eksplisit.
- Kunci daftar izin ruang (`groups`, alias lama `rooms`): gunakan `!room:server` atau `#alias:server`. Nama biasa diabaikan kecuali `dangerouslyAllowNameMatching: true`.
- Daftar izin undangan (`autoJoinAllowlist`): gunakan `!room:server`, `#alias:server`, atau `*`. Nama biasa selalu ditolak.

### Normalisasi ID akun

Wizard mengonversi nama yang mudah dibaca menjadi ID akun yang dinormalisasi (`Ops Bot` -> `ops-bot`). Tanda baca diberi escape heksadesimal dalam nama variabel lingkungan bercakupan agar akun tidak dapat bertabrakan: `-` (0x2D) menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke awalan variabel lingkungan `MATRIX_OPS_X2D_PROD_`.

### Kredensial dalam cache

Matrix menyimpan kredensial dalam cache di `~/.openclaw/credentials/matrix/`: `credentials.json` untuk akun default, `credentials-<account>.json` untuk akun bernama. Jika kredensial dalam cache tersedia, OpenClaw menganggap Matrix telah dikonfigurasi meskipun tidak ada `accessToken` dalam berkas konfigurasi—ini mencakup penyiapan, `openclaw doctor`, dan pemeriksaan status saluran.

### Variabel lingkungan

Variabel lingkungan yang didukung kunci konfigurasi digunakan jika kunci konfigurasi yang setara belum ditetapkan. Akun default menggunakan nama tanpa awalan; akun bernama menyisipkan token akun sebelum akhiran (lihat [normalisasi](#account-id-normalization)).

| Akun default       | Akun bernama (`<ID>` = token akun) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Untuk akun `ops`, namanya menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. `MATRIX_HOMESERVER` (dan setiap varian `*_HOMESERVER` bercakupan) tidak dapat ditetapkan dari `.env` ruang kerja; lihat [Berkas `.env` ruang kerja](/id/gateway/security).

<Note>
Kunci pemulihan bukan variabel lingkungan yang didukung konfigurasi: OpenClaw tidak pernah membacanya langsung dari lingkungan. Teks panduan CLI menyarankan untuk menyalurkannya melalui variabel shell bernama `MATRIX_RECOVERY_KEY` untuk akun default, atau `MATRIX_RECOVERY_KEY_<ID>` (ID akun biasa dalam huruf kapital, tanpa escape heksadesimal) untuk akun bernama—lihat [Verifikasi perangkat ini dengan kunci pemulihan](#verify-this-device-with-a-recovery-key).
</Note>

## Contoh konfigurasi

Dasar praktis dengan pemasangan DM, daftar izin ruang, dan E2EE:

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
      streaming: { mode: "partial" },
    },
  },
}
```

## Pratinjau streaming

Streaming balasan Matrix bersifat opsional. `streaming.mode` mengontrol cara OpenClaw mengirimkan balasan asisten yang sedang berlangsung; `streaming.block.enabled` mengontrol apakah setiap blok yang selesai dipertahankan sebagai pesan Matrix tersendiri.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Untuk mempertahankan pratinjau jawaban langsung tetapi menyembunyikan baris alat/progres sementara:

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

Konfigurasi lengkap menerima `{ mode, chunkMode, block, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pilih dari label yang dikonfigurasi atau bawaan (false untuk menyembunyikan)
          labels: ["Thinking", "Writing", "Searching"], // kandidat untuk label: "auto"
          maxLines: 8, // baris progres bergulir maksimum (default: 8)
          maxLineChars: 120, // karakter maksimum per baris sebelum dipotong (default: 120)
          toolProgress: true, // tampilkan aktivitas alat/progres (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: label khusus, `"auto"`/tidak ditetapkan untuk memilih label yang dikonfigurasi atau bawaan, atau `false` untuk menyembunyikannya.
- `progress.labels`: kandidat yang hanya digunakan jika `label` adalah `"auto"` atau tidak ditetapkan.
- `progress.maxLines`: jumlah maksimum baris progres bergulir yang dipertahankan dalam draf; baris yang lebih lama dari batas ini akan dipangkas.
- `progress.maxLineChars`: jumlah maksimum karakter per baris progres ringkas sebelum dipotong.
- `progress.toolProgress`: jika `true` (default), aktivitas alat/progres langsung muncul dalam draf.

| `streaming.mode`  | Perilaku                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | Tunggu balasan lengkap, lalu kirim sekali.                                                                                                                      |
| `"partial"`       | Edit satu pesan teks biasa di tempat saat model menulis blok saat ini. Klien standar mungkin memberi notifikasi pada pratinjau pertama, bukan pada hasil edit akhir.          |
| `"quiet"`         | Sama seperti `"partial"`, tetapi pesannya berupa pemberitahuan tanpa notifikasi. Penerima diberi notifikasi setelah aturan push per pengguna cocok dengan hasil edit yang telah difinalisasi (lihat di bawah). |
| `"progress"`      | Mengirim baris progres ringkas secara individual menggunakan draf progres.                                                                                          |

`streaming.block.enabled` (default `false`) tidak bergantung pada `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (default)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Draf langsung untuk blok saat ini, blok yang selesai dipertahankan sebagai pesan | Draf langsung untuk blok saat ini, difinalisasi di tempat |
| `"off"`                 | Satu pesan Matrix dengan notifikasi per blok yang selesai                     | Satu pesan Matrix dengan notifikasi untuk balasan lengkap      |

Catatan:

- Jika pratinjau melampaui batas ukuran per peristiwa Matrix, OpenClaw menghentikan streaming pratinjau dan beralih ke pengiriman hasil akhir saja.
- Balasan media selalu mengirim lampiran secara normal; jika pratinjau lama tidak dapat digunakan kembali dengan aman, OpenClaw menyuntingnya sebelum mengirim balasan media akhir.
- Pembaruan pratinjau progres alat diaktifkan secara default saat streaming pratinjau aktif. Tetapkan `streaming.preview.toolProgress: false` untuk mempertahankan pengeditan pratinjau bagi teks jawaban, tetapi membiarkan progres alat menggunakan jalur pengiriman normal.
- Pengeditan pratinjau memerlukan panggilan API Matrix tambahan. Biarkan `streaming.mode: "off"` untuk profil batas laju yang paling konservatif.
- Nilai skalar/boolean lama `streaming` serta kunci datar `blockStreaming` / `chunkMode` ditulis ulang ke bentuk bertingkat ini oleh `openclaw doctor --fix`.

## Pesan suara

Catatan suara Matrix yang masuk ditranskripsikan sebelum gerbang penyebutan ruang, sehingga catatan suara yang menyebutkan nama bot dapat memicu agen dalam ruang `requireMention: true`, dan agen menerima transkrip, bukan sekadar placeholder lampiran audio.

Matrix menggunakan penyedia media audio bersama di bawah `tools.media.audio`, seperti `gpt-4o-mini-transcribe` OpenAI. Lihat [Ikhtisar alat media](/id/tools/media-overview) untuk penyiapan dan batas penyedia.

- Peristiwa `m.audio` dan peristiwa `m.file` dengan jenis MIME `audio/*` memenuhi syarat.
- Di ruang terenkripsi, OpenClaw mendekripsi lampiran melalui jalur media Matrix yang ada sebelum transkripsi.
- Transkrip ditandai sebagai hasil buatan mesin dan tidak tepercaya dalam prompt agen.
- Lampiran ditandai sebagai telah ditranskripsikan agar alat media hilir tidak mentranskripsikannya lagi.
- Atur `tools.media.audio.enabled: false` untuk menonaktifkan transkripsi audio secara global.

## Metadata persetujuan

Prompt persetujuan native Matrix adalah peristiwa `m.room.message` biasa dengan konten khusus OpenClaw di bawah kunci `com.openclaw.approval`. Klien standar tetap merender isi teks; klien yang mendukung OpenClaw dapat membaca id, jenis, status, keputusan, serta detail eksekusi/plugin persetujuan yang terstruktur.

Jika prompt terlalu panjang untuk satu peristiwa Matrix, OpenClaw membagi teks yang terlihat menjadi beberapa bagian dan melampirkan `com.openclaw.approval` hanya ke bagian pertama. Reaksi izinkan/tolak terikat pada peristiwa pertama tersebut, sehingga prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu peristiwa.

### Aturan push yang dihosting sendiri untuk pratinjau final yang senyap

`streaming.mode: "quiet"` hanya memberi tahu penerima setelah blok atau giliran difinalkan—aturan push per pengguna harus cocok dengan penanda pratinjau final. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk resep lengkapnya.

## Ruang bot-ke-bot

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
- `allowBots: "mentions"` menerima pesan tersebut hanya ketika pesan secara terlihat menyebut bot ini di ruang; DM tetap diizinkan tanpa memandang hal tersebut.
- `groups.<room>.allowBots` menggantikan pengaturan tingkat akun untuk satu ruang.
- Pesan bot terkonfigurasi yang diterima menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection`, lalu ganti per akun dengan `channels.matrix.botLoopProtection` atau per ruang dengan `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan mandiri.
- Matrix tidak memiliki flag bot native; OpenClaw mengartikan "dibuat oleh bot" sebagai "dikirim oleh akun Matrix terkonfigurasi lain pada Gateway OpenClaw ini".

Gunakan daftar izin ruang yang ketat dan persyaratan penyebutan saat mengaktifkan lalu lintas bot-ke-bot di ruang bersama.

## Enkripsi dan verifikasi

Di ruang terenkripsi (E2EE), peristiwa gambar keluar menggunakan `thumbnail_file` agar pratinjau gambar dienkripsi bersama lampiran lengkap; ruang yang tidak terenkripsi menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi—plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik lengkap), `--json` (keluaran yang dapat dibaca mesin), dan `--account <id>` (penyiapan multiakun). Secara default, keluarannya ringkas.

### Mengaktifkan enkripsi

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Melakukan bootstrap penyimpanan rahasia dan penandatanganan silang, membuat cadangan kunci ruang jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag yang berguna:

- `--recovery-key-stdin` membaca kunci pemulihan dari stdin tanpa mengeksposnya dalam argumen proses; `--recovery-key <key>` tetap tersedia untuk kompatibilitas
- `--force-reset-cross-signing` membuang identitas penandatanganan silang saat ini dan membuat yang baru (hanya untuk penggunaan yang disengaja)

Untuk akun baru, aktifkan E2EE saat pembuatan:

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

`verify status` melaporkan tiga sinyal kepercayaan independen (`--verbose` menampilkan semuanya):

- `Locally trusted`: hanya dipercaya oleh klien ini
- `Cross-signing verified`: SDK melaporkan verifikasi melalui penandatanganan silang
- `Signed by owner`: ditandatangani oleh kunci penandatanganan mandiri Anda sendiri (hanya diagnostik)

`Verified by owner` bernilai `yes` hanya ketika `Cross-signing verified` bernilai `yes`; kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik upaya terbaik tanpa menyiapkan akun Matrix terlebih dahulu; berguna untuk pemeriksaan luring atau yang dikonfigurasi sebagian.

### Memverifikasi perangkat ini dengan kunci pemulihan

Salurkan kunci pemulihan melalui stdin alih-alih meneruskannya pada baris perintah:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah tersebut melaporkan tiga status:

- `Recovery key accepted`: Matrix menerima kunci untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Backup usable`: cadangan kunci ruang dapat dimuat dengan materi pemulihan tepercaya.
- `Device verified by owner`: perangkat ini memiliki kepercayaan identitas penandatanganan silang Matrix penuh.

Perintah keluar dengan kode bukan nol ketika kepercayaan identitas penuh belum lengkap, meskipun kunci pemulihan membuka materi cadangan. Dalam kasus tersebut, selesaikan verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu `Cross-signing verified: yes` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyesuaikan waktu tunggu.

Bentuk kunci literal `openclaw matrix verify device "<recovery-key>"` juga berfungsi, tetapi kunci tersebut akan tersimpan dalam riwayat shell.

### Melakukan bootstrap atau memperbaiki penandatanganan silang

```bash
openclaw matrix verify bootstrap
```

Perintah perbaikan/penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap penyimpanan rahasia, dengan menggunakan kembali kunci pemulihan yang ada jika memungkinkan
- melakukan bootstrap penandatanganan silang dan mengunggah kunci publik yang hilang
- menandai dan menandatangani silang perangkat saat ini
- membuat cadangan kunci ruang sisi server jika belum ada

Jika homeserver memerlukan UIA untuk mengunggah kunci penandatanganan silang, OpenClaw mencoba tanpa autentikasi terlebih dahulu, kemudian `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`).

Flag yang berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas penandatanganan silang saat ini (hanya secara sengaja; memerlukan kunci pemulihan aktif yang tersimpan atau diberikan dengan `--recovery-key-stdin`)

### Cadangan kunci ruang

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menunjukkan apakah cadangan sisi server tersedia dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor kunci ruang yang dicadangkan ke penyimpanan kriptografi lokal; hilangkan `--recovery-key-stdin` jika kunci pemulihan sudah tersimpan di disk.

Untuk mengganti cadangan yang rusak dengan dasar baru (menerima hilangnya riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang penyimpanan rahasia jika rahasia cadangan saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya jika kunci pemulihan sebelumnya sengaja tidak boleh lagi membuka dasar cadangan baru.

### Mencantumkan, meminta, dan merespons verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun ini. `--own-user` meminta verifikasi mandiri (terima prompt di klien Matrix lain milik pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lainnya.

Untuk penanganan siklus hidup tingkat rendah—biasanya saat membayangi permintaan masuk dari klien lain—perintah berikut bertindak pada `<id>` permintaan tertentu (dicetak oleh `verify list` dan `verify request`):

| Perintah                                   | Tujuan                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Menerima permintaan masuk                                            |
| `openclaw matrix verify start <id>`        | Memulai alur SAS                                                     |
| `openclaw matrix verify sas <id>`          | Mencetak emoji atau desimal SAS                                      |
| `openclaw matrix verify confirm-sas <id>`  | Mengonfirmasi bahwa SAS cocok dengan yang ditampilkan klien lain     |
| `openclaw matrix verify mismatch-sas <id>` | Menolak SAS ketika emoji atau desimal tidak cocok                    |
| `openclaw matrix verify cancel <id>`       | Membatalkan; menerima `--reason <text>` dan `--code <matrix-code>` opsional |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, dan `cancel` semuanya menerima `--user-id` dan `--room-id` sebagai petunjuk tindak lanjut DM ketika verifikasi ditambatkan ke ruang pesan langsung tertentu.

### Catatan multiakun

Tanpa `--account <id>`, perintah CLI Matrix menggunakan akun default implisit. Dengan beberapa akun bernama dan tanpa `channels.matrix.defaultAccount`, perintah menolak menebak dan meminta Anda memilih. Ketika E2EE dinonaktifkan atau tidak tersedia untuk akun bernama, kesalahan menunjuk ke kunci konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Perilaku saat dimulai">
    Dengan `encryption: true`, `startupVerification` secara default bernilai `"if-unverified"`. Saat dimulai, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikat dan menerapkan masa tunggu (24 jam secara default). Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Saat dimulai, OpenClaw juga menjalankan proses bootstrap kriptografi konservatif dengan menggunakan kembali penyimpanan rahasia dan identitas penandatanganan silang saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan terlindung bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, proses awal mencatat peringatan dan tetap tidak fatal. Perangkat yang telah ditandatangani pemilik dipertahankan.

    Lihat [Migrasi Matrix](/id/channels/matrix-migration) untuk alur peningkatan lengkap.

  </Accordion>

  <Accordion title="Pemberitahuan verifikasi">
    Matrix memposting pemberitahuan siklus hidup verifikasi ke ruang verifikasi DM yang ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verify by emoji"), mulai/selesai, serta detail SAS (emoji/desimal) jika tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima secara otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia—Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

    Pemberitahuan sistem verifikasi tidak diteruskan ke alur obrolan agen.

  </Accordion>

  <Accordion title="Perangkat Matrix yang dihapus atau tidak valid">
    Jika `verify status` menyatakan bahwa perangkat saat ini tidak lagi tercantum di homeserver, buat perangkat Matrix OpenClaw baru. Untuk login dengan kata sandi:

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
    Perangkat lama yang dikelola OpenClaw dapat menumpuk. Tampilkan daftar dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Penyimpanan kripto">
    E2EE Matrix menggunakan jalur kripto Rust resmi `matrix-js-sdk` dengan `fake-indexeddb` sebagai shim IndexedDB. Status kripto disimpan secara persisten di `crypto-idb-snapshot.json` (izin file yang ketat).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup penyimpanan sinkronisasi, penyimpanan kripto, kunci pemulihan, snapshot IDB, pengikatan utas, dan status verifikasi saat mulai. Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang sudah ada sehingga status sebelumnya tetap terlihat.

    Satu root hash token lama dapat menjadi jalur kontinuitas rotasi token yang normal. Jika OpenClaw mencatat `matrix: multiple populated token-hash storage roots detected`, periksa direktori akun dan arsipkan root saudara yang usang hanya setelah memastikan root aktif yang dipilih dalam kondisi sehat. Sebaiknya pindahkan root usang ke direktori `_archive/` alih-alih langsung menghapusnya.

  </Accordion>
</AccordionGroup>

## Pengelolaan profil

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Berikan kedua opsi dalam satu pemanggilan. Matrix menerima URL avatar `mxc://` secara langsung; memberikan `http://`/`https://` akan mengunggah file terlebih dahulu dan menyimpan URL `mxc://` yang telah diselesaikan ke dalam `channels.matrix.avatarUrl` (atau penggantian khusus akun).

## Utas

Matrix mendukung utas native untuk balasan otomatis dan pengiriman melalui alat pesan. Dua pengaturan independen mengendalikan perilaku:

### Perutean sesi (`sessionScope`)

`dm.sessionScope` menentukan cara ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (default): semua ruang DM dengan rekan terarah yang sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan kunci sesinya sendiri, bahkan untuk rekan yang sama.

Pengikatan percakapan eksplisit selalu mengungguli `sessionScope`; ruang dan utas yang terikat mempertahankan sesi target yang dipilih.

### Pengutasan balasan (`threadReplies`)

`threadReplies` menentukan tempat bot mengirim balasannya:

- `"off"`: balasan berada di tingkat teratas. Pesan masuk berutas tetap berada di sesi induk.
- `"inbound"`: balas di dalam utas hanya jika pesan masuk sudah berada di utas tersebut.
- `"always"`: balas di dalam utas yang berakar pada pesan pemicu; percakapan tersebut dirutekan melalui sesi cakupan utas yang cocok sejak pemicu pertama dan seterusnya.

`dm.threadReplies` menggantikan pengaturan ini hanya untuk DM—misalnya, mempertahankan isolasi utas ruang sambil menjaga DM tetap tanpa utas.

### Pewarisan utas dan perintah garis miring

- Pesan masuk berutas menyertakan pesan root utas sebagai konteks agen tambahan.
- Pengiriman melalui alat pesan secara otomatis mewarisi utas Matrix saat ini ketika menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali jika `threadId` eksplisit diberikan.
- Penggunaan kembali target pengguna DM hanya berlaku ketika metadata sesi saat ini membuktikan rekan DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean cakupan pengguna normal.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat ke utas semuanya berfungsi di ruang dan DM Matrix.
- `/focus` tingkat teratas membuat utas Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSessions` diaktifkan.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam utas Matrix yang sudah ada akan mengikat utas tersebut di tempatnya.

Ketika OpenClaw mendeteksi ruang DM Matrix bertabrakan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw mengirimkan `m.notice` satu kali yang mengarah ke jalan keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Pemberitahuan hanya muncul ketika pengikatan utas diaktifkan.

## Pengikatan percakapan ACP

Ruang, DM, dan utas Matrix yang sudah ada dapat menjadi ruang kerja ACP persisten tanpa mengubah permukaan obrolan.

Alur cepat operator:

- Jalankan `/acp spawn codex --bind here` di dalam DM, ruang, atau utas Matrix yang sudah ada untuk terus menggunakannya.
- Di DM atau ruang tingkat teratas, DM/ruang saat ini tetap menjadi permukaan obrolan dan pesan berikutnya dirutekan ke sesi ACP yang dibuat.
- Di dalam utas yang sudah ada, `--bind here` mengikat utas saat ini di tempatnya.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempatnya.
- `/acp close` menutup sesi ACP dan menghapus pengikatan.

`--bind here` tidak membuat utas turunan Matrix. `threadBindings.spawnSessions` membatasi `/acp spawn --thread auto|here`, yaitu saat OpenClaw perlu membuat atau mengikat utas turunan.

### Konfigurasi pengikatan utas

Matrix mewarisi default global dari `session.threadBindings` dan mendukung penggantian per kanal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: membatasi pembuatan utas subagen dan ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: penggantian yang lebih sempit untuk pembuatan khusus subagen atau khusus ACP.
- `threadBindings.defaultSpawnContext`

Pembuatan sesi yang terikat ke utas Matrix aktif secara default. Atur `threadBindings.spawnSessions: false` untuk mencegah `/focus` dan `/acp spawn --thread auto|here` tingkat teratas membuat/mengikat utas Matrix. Atur `threadBindings.defaultSpawnContext: "isolated"` jika pembuatan utas subagen native tidak boleh mencabangkan transkrip induk.

## Reaksi

Matrix mendukung reaksi keluar, notifikasi reaksi masuk, dan reaksi tanda terima.

Alat reaksi keluar dibatasi oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke peristiwa Matrix.
- `reactions` menampilkan ringkasan reaksi saat ini untuk peristiwa Matrix.
- `emoji=""` menghapus reaksi milik bot sendiri pada peristiwa tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari bot.

**Urutan resolusi** (nilai pertama yang ditentukan akan digunakan):

| Pengaturan                 | Urutan                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | per akun -> kanal -> `messages.ackReaction` -> cadangan emoji identitas agen   |
| `ackReactionScope`      | per akun -> kanal -> `messages.ackReactionScope` -> default `"group-mentions"` |
| `reactionNotifications` | per akun -> kanal -> default `"own"`                                           |

`reactionNotifications: "own"` meneruskan peristiwa `m.reaction` yang ditambahkan ketika menargetkan pesan Matrix yang dibuat oleh bot; `"off"` menonaktifkan peristiwa sistem reaksi. Penghapusan reaksi tidak disintesis menjadi peristiwa sistem—Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengendalikan jumlah pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang memicu agen. Menggunakan `messages.groupChat.historyLimit` sebagai cadangan; default efektifnya `0` jika keduanya tidak diatur (dinonaktifkan).
- Riwayat ruang Matrix hanya berlaku untuk ruang; DM tetap menggunakan riwayat sesi normal.
- Riwayat ruang hanya mencakup pesan tertunda: OpenClaw menyangga pesan ruang yang belum memicu balasan, lalu mengambil snapshot jendela tersebut ketika penyebutan atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di isi utama pesan masuk untuk giliran itu.
- Percobaan ulang peristiwa Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol `contextVisibility` bersama untuk konteks ruang tambahan seperti teks balasan yang diambil, root utas, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan menjadi hanya dari pengirim yang diizinkan oleh pemeriksaan daftar izin ruang/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan eksplisit yang dikutip.

Ini hanya memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan. Otorisasi pemicu tetap berasal dari `groupPolicy`, `groups`, `groupAllowFrom`, dan pengaturan kebijakan DM.

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

Untuk membisukan DM sepenuhnya sambil mempertahankan ruang tetap berfungsi, atur `dm.enabled: false`:

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

Lihat [Grup](/id/channels/groups) untuk perilaku pembatasan penyebutan dan daftar izin.

Contoh pemasangan untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirim pesan sebelum persetujuan, OpenClaw menggunakan kembali kode pemasangan tertunda yang sama dan dapat mengirim balasan pengingat setelah jeda singkat, alih-alih membuat kode baru.

Lihat [Pemasangan](/id/channels/pairing) untuk alur pemasangan DM bersama dan tata letak penyimpanan.

## Perbaikan ruang langsung

Jika status pesan langsung bergeser, OpenClaw dapat memiliki pemetaan `m.direct` usang yang mengarah ke ruang solo lama alih-alih DM aktif. Periksa pemetaan saat ini untuk rekan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk penyiapan multiakun. Alur perbaikan:

- mengutamakan DM 1:1 ketat yang sudah dipetakan dalam `m.direct`
- menggunakan DM 1:1 ketat yang saat ini diikuti bersama pengguna tersebut sebagai cadangan
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM yang sehat

Alur ini tidak menghapus ruang lama secara otomatis. Alur ini memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix, pemberitahuan verifikasi, dan alur pesan langsung lainnya di masa mendatang menargetkan ruang yang tepat.

## Persetujuan eksekusi

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk penggantian per akun):

- `enabled`: kirim persetujuan melalui prompt native Matrix. Jika tidak diatur atau bernilai `"auto"`, fitur otomatis diaktifkan setelah setidaknya satu pemberi persetujuan dapat diselesaikan; atur `false` untuk menonaktifkannya secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan eksekusi. Menggunakan `channels.matrix.dm.allowFrom` sebagai cadangan.
- `target`: tempat prompt dikirim. `"dm"` (default) mengirim ke DM pemberi persetujuan; `"channel"` mengirim ke ruang atau DM asal; `"both"` mengirim ke keduanya.
- `agentFilter` / `sessionFilter`: daftar izin opsional untuk menentukan agen/sesi yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda di antara jenis persetujuan:

- **Persetujuan eksekusi** menggunakan `execApprovals.approvers`, dengan `dm.allowFrom` sebagai cadangan.
- **Persetujuan Plugin** memberikan otorisasi hanya melalui `dm.allowFrom`.

Kedua jenis berbagi pintasan reaksi Matrix dan pembaruan pesan. Pemberi persetujuan melihat pintasan reaksi pada pesan persetujuan utama:

- ✅ izinkan sekali
- ❌ tolak
- ♾️ selalu izinkan (jika kebijakan eksekusi efektif mengizinkannya)

Perintah garis miring cadangan: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Hanya pemberi persetujuan yang berhasil diidentifikasi yang dapat menyetujui atau menolak. Pengiriman persetujuan eksekusi ke kanal menyertakan teks perintah — hanya aktifkan `channel` atau `both` di ruang tepercaya.

Terkait: [Persetujuan eksekusi](/id/tools/exec-approvals).

## Perintah garis miring

Perintah garis miring (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dan sebagainya) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan penyebutan Matrix milik bot sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa regex penyebutan khusus — ini menjaga agar bot tetap responsif terhadap kiriman bergaya ruang `@mention /command` yang dikeluarkan Element dan klien serupa ketika pengguna menggunakan pelengkapan tab untuk bot sebelum mengetik perintah.

Aturan otorisasi tetap berlaku: pengirim perintah harus memenuhi kebijakan daftar izin/pemilik DM atau ruang yang sama seperti pesan biasa.

## Multiakun

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

- Nilai `channels.matrix` tingkat atas bertindak sebagai nilai default untuk akun bernama kecuali akun tersebut menimpanya.
- Batasi entri ruang yang diwarisi ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` dibagikan di antara akun; `account: "default"` tetap berfungsi ketika akun default dikonfigurasi pada tingkat atas.

**Pemilihan akun default:**

- Atur `defaultAccount` untuk memilih akun bernama yang diutamakan oleh perutean implisit, pemeriksaan, dan perintah CLI.
- Jika terdapat beberapa akun dan salah satunya secara harfiah bernama `default`, OpenClaw menggunakannya secara implisit meskipun `defaultAccount` tidak diatur.
- Dengan beberapa akun bernama dan tanpa akun default yang dipilih, perintah CLI tidak akan menebak — atur `defaultAccount` atau berikan `--account <id>`.
- Blok `channels.matrix.*` tingkat atas hanya diperlakukan sebagai akun `default` implisit ketika autentikasinya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang disimpan dalam cache mencakup autentikasi.

**Promosi:**

- Ketika OpenClaw mempromosikan konfigurasi satu akun menjadi multiakun selama perbaikan atau penyiapan, OpenClaw mempertahankan akun bernama yang ada jika tersedia atau jika `defaultAccount` sudah menunjuk ke akun tersebut. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun hasil promosi; kunci kebijakan pengiriman bersama tetap berada pada tingkat atas.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multiakun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda mengaktifkannya untuk setiap akun.

Jika homeserver berjalan di localhost, IP LAN/Tailscale, atau nama host internal, aktifkan `network.dangerouslyAllowPrivateNetwork` untuk akun tersebut:

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

Keikutsertaan ini hanya mengizinkan target privat/internal tepercaya. Homeserver teks biasa publik seperti `http://matrix.example.org:8008` tetap diblokir. Utamakan `https://` jika memungkinkan.

## Memproksikan lalu lintas Matrix

Jika penerapan Matrix memerlukan proksi HTTP(S) keluar yang eksplisit, atur `channels.matrix.proxy`:

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

Akun bernama dapat menimpa nilai default tingkat atas dengan `channels.matrix.accounts.<id>.proxy`. OpenClaw menggunakan pengaturan proksi yang sama untuk lalu lintas Matrix saat runtime dan pemeriksaan status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target ruang atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Ruang: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID ruang Matrix peka huruf besar-kecil. Gunakan kapitalisasi ID ruang yang persis dari Matrix ketika mengonfigurasi target pengiriman eksplisit, tugas cron, pengikatan, atau daftar izin. OpenClaw menjaga kunci sesi internal tetap kanonis untuk penyimpanan, sehingga kunci berhuruf kecil tersebut bukan sumber yang andal untuk ID pengiriman Matrix.

Pencarian direktori langsung menggunakan akun Matrix yang sedang masuk:

- Pencarian pengguna mengkueri direktori pengguna Matrix pada homeserver tersebut.
- Pencarian ruang menerima ID dan alias ruang eksplisit secara langsung. Pencarian nama ruang yang telah diikuti dilakukan berdasarkan upaya terbaik dan hanya berlaku pada daftar izin ruang runtime ketika `dangerouslyAllowNameMatching: true` diatur.
- Jika nama ruang tidak dapat diresolusikan menjadi ID atau alias, nama tersebut diabaikan oleh resolusi daftar izin runtime.

## Referensi konfigurasi

Kolom pengguna bergaya daftar izin (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Entri non-ID diabaikan secara default. Jika `dangerouslyAllowNameMatching: true` diatur, kecocokan persis nama tampilan direktori Matrix diresolusikan saat startup dan setiap kali daftar izin berubah ketika monitor sedang berjalan; entri yang tidak dapat diresolusikan diabaikan saat runtime.

Kunci daftar izin ruang (`groups`, `rooms` lama) seharusnya berupa ID atau alias ruang. Kunci nama ruang biasa diabaikan secara default; `dangerouslyAllowNameMatching: true` memulihkan pencarian berdasarkan upaya terbaik terhadap nama ruang yang telah diikuti.

### Akun dan koneksi

- `enabled`: aktifkan atau nonaktifkan kanal.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun yang diutamakan ketika beberapa akun Matrix dikonfigurasi.
- `accounts`: penimpaan bernama per akun. Nilai `channels.matrix` tingkat atas diwarisi sebagai nilai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau nama host internal.
- `proxy`: URL proksi HTTP(S) opsional untuk lalu lintas Matrix. Penimpaan per akun didukung.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: token akses untuk autentikasi berbasis token. Nilai teks biasa dan SecretRef didukung di seluruh penyedia env/file/exec ([Pengelolaan Rahasia](/id/gateway/secrets)).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai teks biasa dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat login dengan kata sandi.
- `avatarUrl`: URL avatar diri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum peristiwa yang diambil selama sinkronisasi startup.

### Enkripsi

- `encryption`: aktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default ketika E2EE aktif) atau `"off"`. Meminta verifikasi diri secara otomatis saat startup ketika perangkat ini belum diverifikasi.
- `startupVerificationCooldownHours`: waktu tunggu sebelum permintaan startup otomatis berikutnya. Default: `24`.

### Akses dan kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: daftar izin ID pengguna untuk lalu lintas ruang.
- `mentionPatterns`: pola regex terbatas cakupan untuk penyebutan di ruang. Objek dengan `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Mengontrol apakah `agents.list[].groupChat.mentionPatterns` yang dikonfigurasi berlaku per ruang.
- `dm.enabled`: ketika `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan ruang sebagai DM; tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: daftar izin ID pengguna untuk lalu lintas DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: penimpaan khusus DM untuk penguntaian balasan (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: terima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: ketika `true`, paksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `dangerouslyAllowNameMatching`: ketika `true`, izinkan pencarian direktori nama tampilan Matrix untuk entri daftar izin pengguna dan pencarian nama ruang yang telah diikuti untuk kunci daftar izin ruang. Utamakan ID `@user:server` lengkap serta ID atau alias ruang.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: ruang/alias yang diizinkan ketika `autoJoin` adalah `"allowlist"`. Entri alias diresolusikan terhadap homeserver, bukan terhadap status yang diklaim oleh ruang pengundang.
- `contextVisibility`: visibilitas konteks tambahan (`"all"` default, `"allowlist"`, `"allowlist_quote"`).

### Perilaku balasan

- `replyToMode`: `"off"` (bawaan), `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"` (bawaan tingkat teratas ditetapkan menjadi `"inbound"` kecuali diatur secara eksplisit), `"inbound"`, atau `"always"`.
- `threadBindings`: penggantian per kanal untuk perutean dan siklus hidup sesi yang terikat ke utas.
- `streaming`: objek bertingkat `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` adalah `"off"` (bawaan), `"partial"`, `"quiet"`, atau `"progress"`. Penulisan skalar/boolean lama dimigrasikan melalui `openclaw doctor --fix`.
- `streaming.block.enabled`: ketika `true`, blok asisten yang telah selesai dipertahankan sebagai pesan kemajuan terpisah. Bawaan: `false`.
- `markdown`: konfigurasi perenderan Markdown opsional untuk teks keluar.
- `responsePrefix`: string opsional yang ditambahkan di awal balasan keluar.
- `textChunkLimit`: ukuran potongan keluar dalam karakter ketika `streaming.chunkMode: "length"`. Bawaan: `4000`.
- `streaming.chunkMode`: `"length"` (bawaan, membagi berdasarkan jumlah karakter) atau `"newline"` (membagi pada batas baris).
- `historyLimit`: jumlah pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang memicu agen. Menggunakan `messages.groupChat.historyLimit` sebagai cadangan; bawaan efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan masuk. Bawaan: `20`.

### Pengaturan reaksi

- `ackReaction`: penggantian reaksi pengakuan untuk kanal/akun ini.
- `ackReactionScope`: penggantian cakupan (`"group-mentions"` bawaan, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`"own"` bawaan, `"off"`).

### Peralatan dan penggantian per ruang

- `actions`: pembatasan alat per tindakan (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per ruang. Identitas sesi menggunakan ID ruang stabil setelah resolusi. (`rooms` adalah alias lama.)
  - `groups.<room>.account`: membatasi satu entri ruang yang diwariskan ke akun tertentu.
  - `groups.<room>.enabled`: pengalih per ruang. Ketika `false`, ruang diabaikan seolah-olah tidak ada dalam peta.
  - `groups.<room>.requireMention`: penggantian per ruang atas persyaratan penyebutan tingkat kanal.
  - `groups.<room>.allowBots`: penggantian per ruang atas pengaturan tingkat kanal (`true` atau `"mentions"`).
  - `groups.<room>.botLoopProtection`: penggantian per ruang untuk anggaran perlindungan perulangan bot-ke-bot.
  - `groups.<room>.users`: daftar pengirim yang diizinkan per ruang.
  - `groups.<room>.tools`: penggantian izin/penolakan alat per ruang.
  - `groups.<room>.autoReply`: penggantian pembatasan berdasarkan penyebutan per ruang. `true` menonaktifkan persyaratan penyebutan untuk ruang tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter skill per ruang.
  - `groups.<room>.systemPrompt`: cuplikan prompt sistem per ruang.

### Pengaturan persetujuan eksekusi

- `execApprovals.enabled`: mengirimkan persetujuan eksekusi melalui prompt native Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan untuk menyetujui. Menggunakan `dm.allowFrom` sebagai cadangan.
- `execApprovals.target`: `"dm"` (bawaan), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: daftar agen/sesi opsional yang diizinkan untuk pengiriman.

## Terkait

- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan
