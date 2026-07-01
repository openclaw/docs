---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan matriks, penyiapan, dan contoh konfigurasi
title: Matriks
x-i18n:
    generated_at: "2026-07-01T13:21:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah Plugin kanal yang dapat diunduh untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, ruang, utas, media, reaksi, jajak pendapat, lokasi, dan E2EE.

## Instal

Instal Matrix dari ClawHub sebelum mengonfigurasi kanal:

```bash
openclaw plugins install @openclaw/matrix
```

Spesifikasi Plugin polos mencoba ClawHub terlebih dahulu, lalu fallback npm. Untuk memaksa sumber registri, gunakan `openclaw plugins install clawhub:@openclaw/matrix` atau `openclaw plugins install npm:@openclaw/matrix`.

Dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` mendaftarkan dan mengaktifkan Plugin, jadi tidak diperlukan langkah `openclaw plugins enable matrix` terpisah. Plugin tetap tidak melakukan apa pun sampai Anda mengonfigurasi kanal di bawah. Lihat [Plugin](/id/tools/plugin) untuk perilaku Plugin umum dan aturan instalasi.

## Penyiapan

1. Buat akun Matrix di homeserver Anda.
2. Konfigurasikan `channels.matrix` dengan `homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`.
3. Mulai ulang Gateway.
4. Mulai DM dengan bot, atau undang bot ke ruang (lihat [gabung otomatis](#auto-join) - undangan baru hanya masuk ketika `autoJoin` mengizinkannya).

### Penyiapan interaktif

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard meminta: URL homeserver, metode auth (token akses atau kata sandi), ID pengguna (hanya auth kata sandi), nama perangkat opsional, apakah akan mengaktifkan E2EE, dan apakah akan mengonfigurasi akses ruang dan gabung otomatis.

Jika env var `MATRIX_*` yang cocok sudah ada dan akun yang dipilih belum memiliki auth tersimpan, wizard menawarkan pintasan env-var. Untuk menyelesaikan nama ruang sebelum menyimpan allowlist, jalankan `openclaw channels resolve --channel matrix "Project Room"`. Ketika E2EE diaktifkan, wizard menulis konfigurasi dan menjalankan bootstrap yang sama seperti [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Berbasis kata sandi (token di-cache setelah login pertama):

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

`channels.matrix.autoJoin` default ke `off`. Dengan default ini, bot tidak akan muncul di ruang atau DM baru dari undangan baru sampai Anda bergabung secara manual.

OpenClaw tidak dapat mengetahui pada waktu undangan apakah ruang yang diundang adalah DM atau grup, jadi semua undangan - termasuk undangan bergaya DM - melewati `autoJoin` terlebih dahulu. `dm.policy` hanya berlaku kemudian, setelah bot bergabung dan ruang telah diklasifikasikan.

<Warning>
Setel `autoJoin: "allowlist"` plus `autoJoinAllowlist` untuk membatasi undangan yang diterima bot, atau `autoJoin: "always"` untuk menerima setiap undangan.

`autoJoinAllowlist` hanya menerima target stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama ruang polos ditolak; entri alias diselesaikan terhadap homeserver, bukan terhadap status yang diklaim oleh ruang yang mengundang.
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

Allowlist DM dan ruang paling baik diisi dengan ID stabil:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan diabaikan secara default karena dapat berubah; setel `dangerouslyAllowNameMatching: true` hanya ketika Anda secara eksplisit memerlukan kompatibilitas dengan entri nama tampilan.
- Kunci allowlist ruang (`groups`, `rooms` legacy): gunakan `!room:server` atau `#alias:server`. Nama ruang polos diabaikan secara default; setel `dangerouslyAllowNameMatching: true` hanya ketika Anda secara eksplisit memerlukan kompatibilitas dengan pencarian nama ruang yang sudah diikuti.
- Allowlist undangan (`autoJoinAllowlist`): gunakan `!room:server`, `#alias:server`, atau `*`. Nama ruang polos ditolak.

### Normalisasi ID akun

Wizard mengonversi nama ramah menjadi ID akun yang dinormalisasi. Misalnya, `Ops Bot` menjadi `ops-bot`. Tanda baca di-escape dalam nama env-var terscoped sehingga dua akun tidak dapat bertabrakan: `-` → `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

### Kredensial yang di-cache

Matrix menyimpan kredensial yang di-cache di bawah `~/.openclaw/credentials/matrix/`:

- akun default: `credentials.json`
- akun bernama: `credentials-<account>.json`

Ketika kredensial yang di-cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi meskipun token akses tidak ada di file konfigurasi - ini mencakup penyiapan, `openclaw doctor`, dan probe status kanal.

### Variabel lingkungan

Digunakan ketika kunci konfigurasi ekuivalen tidak disetel. Akun default menggunakan nama tanpa prefiks; akun bernama menggunakan ID akun yang disisipkan sebelum sufiks.

| Akun default        | Akun bernama (`<ID>` adalah ID akun yang dinormalisasi) |
| ------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER` | `MATRIX_<ID>_HOMESERVER`                               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`    | `MATRIX_<ID>_USER_ID`                                  |
| `MATRIX_PASSWORD`   | `MATRIX_<ID>_PASSWORD`                                 |
| `MATRIX_DEVICE_ID`  | `MATRIX_<ID>_DEVICE_ID`                                |
| `MATRIX_DEVICE_NAME` | `MATRIX_<ID>_DEVICE_NAME`                            |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Untuk akun `ops`, namanya menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. Env var recovery-key dibaca oleh alur CLI yang sadar pemulihan (`verify backup restore`, `verify device`, `verify bootstrap`) ketika Anda menyalurkan kunci melalui `--recovery-key-stdin`.

`MATRIX_HOMESERVER` tidak dapat disetel dari `.env` workspace; lihat [file `.env` workspace](/id/gateway/security).

## Contoh konfigurasi

Baseline praktis dengan pemasangan DM, allowlist ruang, dan E2EE:

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

Streaming balasan Matrix bersifat opt-in. `streaming` mengontrol bagaimana OpenClaw mengirim balasan asisten yang sedang berjalan; `blockStreaming` mengontrol apakah setiap blok yang selesai dipertahankan sebagai pesan Matrix sendiri.

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

Bentuk objek lengkap menerima `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: label khusus, `"auto"` atau tidak disetel untuk memilih dari label yang dikonfigurasi atau bawaan, atau `false` untuk menyembunyikan baris label.
- `progress.labels`: label kandidat yang digunakan hanya ketika `label` adalah `"auto"` atau tidak disetel. Biarkan tidak disetel untuk default bawaan.
- `progress.maxLines`: jumlah maksimum baris progres bergulir yang disimpan dalam draf. Setelah batas ini, baris lama dipangkas.
- `progress.maxLineChars`: karakter maksimum per baris progres ringkas sebelum pemotongan.
- `progress.toolProgress`: ketika `true` (default), aktivitas alat/progres langsung muncul dalam draf.

| `streaming`       | Perilaku                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | Menunggu balasan lengkap, kirim sekali. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                      |
| `"partial"`       | Mengedit satu pesan teks normal di tempat saat model menulis blok saat ini. Klien Matrix standar mungkin memberi notifikasi pada pratinjau pertama, bukan edit final. |
| `"quiet"`         | Sama seperti `"partial"` tetapi pesan adalah notice tanpa notifikasi. Penerima hanya mendapat notifikasi setelah aturan push per pengguna cocok dengan edit final (lihat di bawah). |
| `"progress"`      | Mengirim baris progres ringkas individual menggunakan draf progres.                                                                                                   |

`blockStreaming` independen dari `streaming`:

| `streaming`             | `blockStreaming: true`                                                 | `blockStreaming: false` (default)                       |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| `"partial"` / `"quiet"` | Draf langsung untuk blok saat ini, blok selesai dipertahankan sebagai pesan | Draf langsung untuk blok saat ini, difinalisasi di tempat |
| `"off"`                 | Satu pesan Matrix yang memberi notifikasi per blok selesai             | Satu pesan Matrix yang memberi notifikasi untuk balasan lengkap |

Catatan:

- Jika pratinjau tumbuh melampaui batas ukuran per-event Matrix, OpenClaw menghentikan streaming pratinjau dan fallback ke pengiriman final-saja.
- Balasan media selalu mengirim lampiran secara normal. Jika pratinjau usang tidak lagi dapat digunakan ulang dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media final.
- Pembaruan pratinjau progres alat diaktifkan secara default ketika streaming pratinjau Matrix aktif. Setel `streaming.preview.toolProgress: false` untuk mempertahankan edit pratinjau untuk teks jawaban tetapi membiarkan progres alat pada jalur pengiriman normal.
- Edit pratinjau memerlukan panggilan API Matrix ekstra. Biarkan `streaming: "off"` jika Anda menginginkan profil rate-limit paling konservatif.

## Pesan suara

Catatan suara Matrix masuk ditranskripsikan sebelum gerbang penyebutan ruang. Ini memungkinkan catatan suara yang menyebut nama bot memicu agen di ruang `requireMention: true`, dan memberi agen transkrip alih-alih hanya placeholder lampiran audio.

Matrix menggunakan penyedia media audio bersama yang dikonfigurasi di bawah `tools.media.audio`, seperti OpenAI `gpt-4o-mini-transcribe`. Lihat [Ikhtisar alat media](/id/tools/media-overview) untuk penyiapan penyedia dan batasan.

Detail perilaku:

- Peristiwa `m.audio` dan peristiwa `m.file` dengan tipe MIME `audio/*` memenuhi syarat.
- Di room terenkripsi, OpenClaw mendekripsi lampiran melalui jalur media Matrix yang sudah ada sebelum transkripsi.
- Transkrip ditandai sebagai dihasilkan mesin dan tidak tepercaya dalam prompt agen.
- Lampiran ditandai sebagai sudah ditranskripsi agar alat media hilir tidak mentranskripsikan catatan suara yang sama lagi.
- Atur `tools.media.audio.enabled: false` untuk menonaktifkan transkripsi audio secara global.

## Metadata persetujuan

Prompt persetujuan native Matrix adalah peristiwa `m.room.message` normal dengan konten peristiwa kustom khusus OpenClaw di bawah `com.openclaw.approval`. Matrix mengizinkan kunci konten peristiwa kustom, sehingga klien standar tetap merender body teks sementara klien yang memahami OpenClaw dapat membaca id persetujuan terstruktur, jenis, status, keputusan yang tersedia, dan detail exec/plugin.

Saat prompt persetujuan terlalu panjang untuk satu peristiwa Matrix, OpenClaw memecah teks yang terlihat menjadi beberapa bagian dan melampirkan `com.openclaw.approval` hanya ke bagian pertama. Reaksi untuk keputusan izinkan/tolak terikat ke peristiwa pertama itu, sehingga prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu peristiwa.

### Aturan push self-hosted untuk pratinjau final yang senyap

`streaming: "quiet"` hanya memberi tahu penerima setelah blok atau giliran difinalisasi - aturan push per pengguna harus cocok dengan penanda pratinjau final. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk resep lengkapnya (token penerima, pemeriksaan pusher, pemasangan aturan, catatan per homeserver).

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi akan diabaikan.

Gunakan `allowBots` saat Anda secara sengaja menginginkan traffic Matrix antar-agen:

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
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu room.
- Pesan bot terkonfigurasi yang diterima menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection`, lalu timpa dengan `channels.matrix.botLoopProtection` atau `channels.matrix.groups.<room>.botLoopProtection` saat satu room memerlukan anggaran berbeda.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan sendiri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi di Gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan penyebutan saat mengaktifkan traffic bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), peristiwa gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkap. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi - plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik lengkap), `--json` (output yang dapat dibaca mesin), dan `--account <id>` (setup multi-akun). Output ringkas secara default dengan logging SDK internal yang senyap. Contoh di bawah menunjukkan bentuk kanonis; tambahkan flag sesuai kebutuhan.

### Aktifkan enkripsi

```bash
openclaw matrix encryption setup
```

Melakukan bootstrap penyimpanan rahasia dan cross-signing, membuat backup kunci room jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag yang berguna:

- `--recovery-key <key>` menerapkan kunci pemulihan sebelum bootstrap (utamakan bentuk stdin yang didokumentasikan di bawah)
- `--force-reset-cross-signing` membuang identitas cross-signing saat ini dan membuat yang baru (gunakan hanya secara sengaja)

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

- `Locally trusted`: tepercaya hanya oleh klien ini
- `Cross-signing verified`: SDK melaporkan verifikasi melalui cross-signing
- `Signed by owner`: ditandatangani oleh kunci self-signing Anda sendiri (hanya diagnostik)

`Verified by owner` menjadi `yes` hanya saat `Cross-signing verified` bernilai `yes`. Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik upaya terbaik tanpa menyiapkan akun Matrix terlebih dahulu; berguna untuk probe offline atau yang dikonfigurasi sebagian.

### Verifikasi perangkat ini dengan kunci pemulihan

Kunci pemulihan bersifat sensitif - pipe melalui stdin alih-alih meneruskannya di baris perintah. Atur `MATRIX_RECOVERY_KEY` (atau `MATRIX_<ID>_RECOVERY_KEY` untuk akun bernama):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah ini melaporkan tiga status:

- `Recovery key accepted`: Matrix menerima kunci untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Backup usable`: backup kunci room dapat dimuat dengan materi pemulihan tepercaya.
- `Device verified by owner`: perangkat ini memiliki kepercayaan identitas cross-signing Matrix penuh.

Perintah keluar non-nol saat kepercayaan identitas penuh belum lengkap, bahkan jika kunci pemulihan membuka materi backup. Dalam kasus itu, selesaikan verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu `Cross-signing verified: yes` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyesuaikan waktu tunggu.

Bentuk kunci literal `openclaw matrix verify device "<recovery-key>"` juga diterima, tetapi kunci akan tersimpan dalam riwayat shell Anda.

### Bootstrap atau perbaiki cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` adalah perintah perbaikan dan setup untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap penyimpanan rahasia, menggunakan kembali kunci pemulihan yang ada jika memungkinkan
- melakukan bootstrap cross-signing dan mengunggah kunci publik yang hilang
- menandai dan melakukan cross-sign pada perangkat saat ini
- membuat backup kunci room di sisi server jika belum ada

Jika homeserver mewajibkan UIA untuk mengunggah kunci cross-signing, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`).

Flag yang berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas cross-signing saat ini (hanya secara sengaja; memerlukan kunci pemulihan aktif disimpan atau disuplai dengan `--recovery-key-stdin`)

### Backup kunci room

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menampilkan apakah backup sisi server ada dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor kunci room yang dicadangkan ke penyimpanan crypto lokal; jika kunci pemulihan sudah ada di disk, Anda dapat menghilangkan `--recovery-key-stdin`.

Untuk mengganti backup rusak dengan baseline baru (menerima kehilangan riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang penyimpanan rahasia jika rahasia backup saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya saat Anda secara sengaja ingin kunci pemulihan sebelumnya berhenti membuka baseline backup baru.

### Mencantumkan, meminta, dan merespons verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun OpenClaw ini. `--own-user` meminta verifikasi mandiri (Anda menerima prompt di klien Matrix lain dari pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lainnya.

Untuk penanganan siklus hidup tingkat lebih rendah - biasanya saat membayangi permintaan masuk dari klien lain - perintah ini bertindak pada permintaan `<id>` tertentu (dicetak oleh `verify list` dan `verify request`):

| Perintah                                   | Tujuan                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Menerima permintaan masuk                                           |
| `openclaw matrix verify start <id>`        | Memulai alur SAS                                                    |
| `openclaw matrix verify sas <id>`          | Mencetak emoji atau desimal SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | Mengonfirmasi bahwa SAS cocok dengan yang ditampilkan klien lain    |
| `openclaw matrix verify mismatch-sas <id>` | Menolak SAS saat emoji atau desimal tidak cocok                     |
| `openclaw matrix verify cancel <id>`       | Membatalkan; menerima `--reason <text>` dan `--code <matrix-code>` opsional |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, dan `cancel` semuanya menerima `--user-id` dan `--room-id` sebagai petunjuk tindak lanjut DM saat verifikasi tertambat ke room pesan langsung tertentu.

### Catatan multi-akun

Tanpa `--account <id>`, perintah CLI Matrix menggunakan akun default implisit. Jika Anda memiliki beberapa akun bernama dan belum menetapkan `channels.matrix.defaultAccount`, perintah akan menolak menebak dan meminta Anda memilih. Saat E2EE dinonaktifkan atau tidak tersedia untuk akun bernama, error menunjuk ke kunci konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Perilaku startup">
    Dengan `encryption: true`, `startupVerification` default ke `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikat dan menerapkan cooldown (24 jam secara default). Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan pass bootstrap crypto konservatif yang menggunakan kembali penyimpanan rahasia dan identitas cross-signing saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan terjaga bahkan tanpa `channels.matrix.password`; jika homeserver mewajibkan UIA kata sandi, startup mencatat peringatan dan tetap non-fatal. Perangkat yang sudah ditandatangani pemilik dipertahankan.

    Lihat [Migrasi Matrix](/id/channels/matrix-migration) untuk alur upgrade lengkap.

  </Accordion>

  <Accordion title="Pemberitahuan verifikasi">
    Matrix memposting pemberitahuan siklus hidup verifikasi ke room verifikasi DM ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verifikasi dengan emoji"), mulai/selesai, dan detail SAS (emoji/desimal) jika tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia - Anda tetap perlu membandingkan dan mengonfirmasi "Cocok" di klien Matrix Anda.

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
    Perangkat lama yang dikelola OpenClaw dapat menumpuk. Daftar dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Penyimpanan kripto">
    Matrix E2EE menggunakan jalur kripto Rust resmi `matrix-js-sdk` dengan `fake-indexeddb` sebagai shim IndexedDB. Status kripto disimpan ke `crypto-idb-snapshot.json` (izin file ketat).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup penyimpanan sinkronisasi, penyimpanan kripto, kunci pemulihan, snapshot IDB, pengikatan utas, dan status verifikasi startup. Saat token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang sudah ada sehingga status sebelumnya tetap terlihat.

    Satu root token-hash lama dapat menjadi jalur kontinuitas rotasi token yang normal. Jika OpenClaw mencatat log `matrix: multiple populated token-hash storage roots detected`, periksa direktori akun dan arsipkan root saudara yang sudah usang hanya setelah memastikan root aktif yang dipilih sehat. Lebih baik memindahkan root usang ke direktori `_archive/` daripada langsung menghapusnya.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui profil mandiri Matrix untuk akun yang dipilih:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Anda dapat meneruskan kedua opsi dalam satu panggilan. Matrix menerima URL avatar `mxc://` secara langsung; saat Anda meneruskan `http://` atau `https://`, OpenClaw mengunggah file terlebih dahulu dan menyimpan URL `mxc://` yang terselesaikan ke `channels.matrix.avatarUrl` (atau override per akun).

## Utas

Matrix mendukung utas Matrix native untuk balasan otomatis dan pengiriman alat pesan. Dua kenop independen mengontrol perilaku:

### Perutean sesi (`sessionScope`)

`dm.sessionScope` menentukan bagaimana ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (default): semua ruang DM dengan peer terute yang sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan kunci sesinya sendiri, bahkan saat peer-nya sama.

Pengikatan percakapan eksplisit selalu mengalahkan `sessionScope`, sehingga ruang dan utas yang terikat mempertahankan sesi target yang dipilih.

### Pengutasan balasan (`threadReplies`)

`threadReplies` menentukan tempat bot memposting balasannya:

- `"off"`: balasan berada di level atas. Pesan masuk berutas tetap berada di sesi induk.
- `"inbound"`: balas di dalam utas hanya saat pesan masuk sudah berada di utas tersebut.
- `"always"`: balas di dalam utas yang berakar pada pesan pemicu; percakapan tersebut dirutekan melalui sesi bercakupan utas yang cocok sejak pemicu pertama dan seterusnya.

`dm.threadReplies` meng-override ini hanya untuk DM - misalnya, menjaga utas ruang tetap terisolasi sambil mempertahankan DM tetap datar.

### Pewarisan utas dan perintah slash

- Pesan berutas yang masuk menyertakan pesan root utas sebagai konteks agen tambahan.
- Pengiriman alat pesan otomatis mewarisi utas Matrix saat ini saat menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM hanya aktif saat metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean bercakupan pengguna normal.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat utas semuanya berfungsi di ruang Matrix dan DM.
- `/focus` level atas membuat utas Matrix baru dan mengikatnya ke sesi target saat `threadBindings.spawnSessions` diaktifkan.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam utas Matrix yang sudah ada mengikat utas tersebut di tempat.

Saat OpenClaw mendeteksi ruang DM Matrix berbenturan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw memposting `m.notice` satu kali di ruang tersebut yang menunjuk ke jalur keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Pemberitahuan hanya muncul saat pengikatan utas diaktifkan.

## Pengikatan percakapan ACP

Ruang Matrix, DM, dan utas Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, ruang, atau utas yang sudah ada yang ingin tetap Anda gunakan.
- Di DM atau ruang Matrix level atas, DM/ruang saat ini tetap menjadi permukaan chat dan pesan mendatang dirutekan ke sesi ACP yang dibuat.
- Di dalam utas Matrix yang sudah ada, `--bind here` mengikat utas saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus pengikatannya.

Catatan:

- `--bind here` tidak membuat utas Matrix anak.
- `threadBindings.spawnSessions` mengatur `/acp spawn --thread auto|here`, tempat OpenClaw perlu membuat atau mengikat utas Matrix anak.

### Konfigurasi pengikatan utas

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Pembuatan sesi terikat utas Matrix default aktif:

- Tetapkan `threadBindings.spawnSessions: false` untuk memblokir `/focus` level atas dan `/acp spawn --thread auto|here` agar tidak membuat/mengikat utas Matrix.
- Tetapkan `threadBindings.defaultSpawnContext: "isolated"` saat pembuatan utas subagen native tidak boleh mem-fork transkrip induk.

## Reaksi

Matrix mendukung reaksi keluar, notifikasi reaksi masuk, dan reaksi ack.

Alat reaksi keluar dikontrol oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke event Matrix.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix.
- `emoji=""` menghapus reaksi milik bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari bot.

**Urutan resolusi** (nilai pertama yang didefinisikan menang):

| Pengaturan              | Urutan                                                                          |
| ----------------------- | ------------------------------------------------------------------------------- |
| `ackReaction`           | per akun → channel → `messages.ackReaction` → fallback emoji identitas agen     |
| `ackReactionScope`      | per akun → channel → `messages.ackReactionScope` → default `"group-mentions"`   |
| `reactionNotifications` | per akun → channel → default `"own"`                                            |

`reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat menargetkan pesan Matrix yang ditulis bot; `"off"` menonaktifkan event sistem reaksi. Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan ruang terbaru yang disertakan sebagai `InboundHistory` saat pesan ruang Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektif adalah `0`. Tetapkan `0` untuk menonaktifkan.
- Riwayat ruang Matrix hanya untuk ruang. DM tetap menggunakan riwayat sesi normal.
- Riwayat ruang Matrix bersifat pending-only: OpenClaw melakukan buffer pesan ruang yang belum memicu balasan, lalu mengambil snapshot jendela tersebut saat mention atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di isi masuk utama untuk giliran itu.
- Percobaan ulang event Matrix yang sama menggunakan kembali snapshot riwayat asli, bukan bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks ruang tambahan seperti teks balasan yang diambil, root utas, dan riwayat tertunda.

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

Untuk membisukan DM sepenuhnya sambil menjaga ruang tetap berfungsi, tetapkan `dm.enabled: false`:

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

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan kembali kode pairing tertunda yang sama dan dapat mengirim balasan pengingat setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan ruang langsung

Jika status pesan langsung bergeser keluar dari sinkronisasi, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke ruang solo lama alih-alih DM live. Periksa pemetaan saat ini untuk peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk setup multi-akun. Alur perbaikan:

- lebih memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat mana pun yang saat ini tergabung dengan pengguna tersebut
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Ini tidak menghapus ruang lama secara otomatis. Ini memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix mendatang, pemberitahuan verifikasi, dan alur pesan langsung lainnya menargetkan ruang yang tepat.

## Persetujuan eksekusi

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk override per akun):

- `enabled`: kirim persetujuan melalui prompt native Matrix. Saat tidak disetel atau `"auto"`, Matrix otomatis aktif setelah setidaknya satu pemberi persetujuan dapat di-resolve. Tetapkan `false` untuk menonaktifkan secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan eksekusi. Opsional - fallback ke `channels.matrix.dm.allowFrom`.
- `target`: tujuan prompt. `"dm"` (default) mengirim ke DM pemberi persetujuan; `"channel"` mengirim ke ruang Matrix atau DM asal; `"both"` mengirim ke keduanya.
- `agentFilter` / `sessionFilter`: allowlist opsional untuk agen/sesi mana yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda antara jenis persetujuan:

- **Persetujuan eksekusi** menggunakan `execApprovals.approvers`, dengan fallback ke `dm.allowFrom`.
- **Persetujuan Plugin** mengotorisasi hanya melalui `dm.allowFrom`.

Kedua jenis berbagi pintasan reaksi Matrix dan pembaruan pesan. Pemberi persetujuan melihat pintasan reaksi pada pesan persetujuan utama:

- `✅` izinkan sekali
- `❌` tolak
- `♾️` selalu izinkan (saat kebijakan eksekusi efektif mengizinkannya)

Perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Hanya pemberi persetujuan yang berhasil di-resolve yang dapat menyetujui atau menolak. Pengiriman saluran untuk persetujuan exec menyertakan teks perintah - hanya aktifkan `channel` atau `both` di ruang tepercaya.

Terkait: [Persetujuan exec](/id/tools/exec-approvals).

## Perintah slash

Perintah slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dll.) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan mention Matrix milik bot sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa regex mention khusus. Ini menjaga bot tetap responsif terhadap posting bergaya ruang `@mention /command` yang dikirim Element dan klien serupa saat pengguna melengkapi nama bot dengan tab sebelum mengetik perintah.

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

- Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali akun tersebut menimpanya.
- Batasi entri ruang yang diwariskan ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` dibagikan di semua akun; `account: "default"` tetap berfungsi saat akun default dikonfigurasi di tingkat atas.

**Pemilihan akun default:**

- Tetapkan `defaultAccount` untuk memilih akun bernama yang diprioritaskan oleh routing implisit, probing, dan perintah CLI.
- Jika Anda memiliki beberapa akun dan salah satunya secara literal bernama `default`, OpenClaw menggunakannya secara implisit bahkan saat `defaultAccount` tidak ditetapkan.
- Jika Anda memiliki beberapa akun bernama dan tidak ada default yang dipilih, perintah CLI menolak menebak - tetapkan `defaultAccount` atau teruskan `--account <id>`.
- Blok `channels.matrix.*` tingkat atas hanya diperlakukan sebagai akun `default` implisit saat autentikasinya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang di-cache mencakup autentikasi.

**Promosi:**

- Saat OpenClaw mempromosikan konfigurasi akun tunggal menjadi multi-akun selama perbaikan atau penyiapan, konfigurasi tersebut mempertahankan akun bernama yang ada jika ada atau jika `defaultAccount` sudah menunjuk ke salah satunya. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan; kunci kebijakan pengiriman bersama tetap di tingkat atas.

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

Opt-in ini hanya mengizinkan target privat/internal tepercaya. Homeserver publik tanpa enkripsi seperti
`http://matrix.example.org:8008` tetap diblokir. Pilih `https://` jika memungkinkan.

## Mem-proxy lalu lintas Matrix

Jika deployment Matrix Anda membutuhkan proxy HTTP(S) keluar eksplisit, tetapkan `channels.matrix.proxy`:

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
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas Matrix runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target ruang atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Ruang: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID ruang Matrix peka huruf besar/kecil. Gunakan kapitalisasi ID ruang yang persis dari Matrix
saat mengonfigurasi target pengiriman eksplisit, tugas cron, binding, atau daftar izin.
OpenClaw menjaga kunci sesi internal tetap kanonis untuk penyimpanan, sehingga kunci huruf kecil
tersebut bukan sumber yang andal untuk ID pengiriman Matrix.

Lookup direktori live menggunakan akun Matrix yang sudah login:

- Lookup pengguna mengueri direktori pengguna Matrix pada homeserver tersebut.
- Lookup ruang menerima ID ruang dan alias eksplisit secara langsung. Lookup nama ruang yang sudah dimasuki bersifat best-effort dan hanya berlaku untuk daftar izin ruang runtime saat `dangerouslyAllowNameMatching: true` ditetapkan.
- Jika nama ruang tidak dapat di-resolve menjadi ID atau alias, nama tersebut diabaikan oleh resolusi daftar izin runtime.

## Referensi konfigurasi

Kolom pengguna bergaya daftar izin (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Entri pengguna non-ID diabaikan secara default. Jika Anda menetapkan `dangerouslyAllowNameMatching: true`, kecocokan persis nama tampilan direktori Matrix di-resolve saat startup dan setiap kali daftar izin berubah saat pemantau berjalan; entri yang tidak dapat di-resolve diabaikan saat runtime.

Kunci daftar izin ruang (`groups`, legacy `rooms`) sebaiknya berupa ID ruang atau alias. Kunci nama ruang biasa diabaikan secara default; `dangerouslyAllowNameMatching: true` memulihkan lookup best-effort terhadap nama ruang yang sudah dimasuki.

### Akun dan koneksi

- `enabled`: aktifkan atau nonaktifkan saluran.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun yang diprioritaskan saat beberapa akun Matrix dikonfigurasi.
- `accounts`: penimpaan per akun bernama. Nilai `channels.matrix` tingkat atas diwariskan sebagai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau hostname internal.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Penimpaan per akun didukung.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: token akses untuk autentikasi berbasis token. Nilai plaintext dan SecretRef didukung di seluruh penyedia env/file/exec ([Manajemen rahasia](/id/gateway/secrets)).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai plaintext dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat login kata sandi.
- `avatarUrl`: URL avatar diri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sinkronisasi startup.

### Enkripsi

- `encryption`: aktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default saat E2EE aktif) atau `"off"`. Secara otomatis meminta verifikasi diri saat startup ketika perangkat ini belum terverifikasi.
- `startupVerificationCooldownHours`: cooldown sebelum permintaan startup otomatis berikutnya. Default: `24`.

### Akses dan kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: daftar izin ID pengguna untuk lalu lintas ruang.
- `mentionPatterns`: pola regex berskala untuk mention ruang. Objek dengan `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Mengontrol apakah `agents.list[].groupChat.mentionPatterns` yang dikonfigurasi berlaku per ruang.
- `dm.enabled`: saat `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan ruang sebagai DM; ini tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: daftar izin ID pengguna untuk lalu lintas DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: penimpaan khusus DM untuk threading balasan (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: terima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: saat `true`, memaksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `dangerouslyAllowNameMatching`: saat `true`, mengizinkan lookup direktori nama tampilan Matrix untuk entri daftar izin pengguna dan lookup nama ruang yang sudah dimasuki untuk kunci daftar izin ruang. Pilih ID `@user:server` lengkap dan ID ruang atau alias.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: ruang/alias yang diizinkan saat `autoJoin` adalah `"allowlist"`. Entri alias di-resolve terhadap homeserver, bukan terhadap state yang diklaim oleh ruang yang mengundang.
- `contextVisibility`: visibilitas konteks tambahan (`"all"` default, `"allowlist"`, `"allowlist_quote"`).

### Perilaku balasan

- `replyToMode`: `"off"`, `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, atau `"always"`.
- `threadBindings`: penimpaan per saluran untuk routing dan siklus hidup sesi yang terikat thread.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, `"progress"`, atau bentuk objek `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: saat `true`, blok asisten yang selesai dipertahankan sebagai pesan progres terpisah.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks keluar.
- `responsePrefix`: string opsional yang ditambahkan di awal balasan keluar.
- `textChunkLimit`: ukuran chunk keluar dalam karakter saat `chunkMode: "length"`. Default: `4000`.
- `chunkMode`: `"length"` (default, memecah berdasarkan jumlah karakter) atau `"newline"` (memecah pada batas baris).
- `historyLimit`: jumlah pesan ruang terbaru yang disertakan sebagai `InboundHistory` saat pesan ruang memicu agen. Fallback ke `messages.groupChat.historyLimit`; default efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan masuk.

### Pengaturan reaksi

- `ackReaction`: penimpaan reaksi ack untuk saluran/akun ini.
- `ackReactionScope`: penimpaan cakupan (`"group-mentions"` default, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`"own"` default, `"off"`).

### Tooling dan penimpaan per ruang

- `actions`: pembatasan alat per tindakan (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per ruang. Identitas sesi menggunakan ID ruang stabil setelah resolusi. (`rooms` adalah alias lama.)
  - `groups.<room>.account`: batasi satu entri ruang yang diwarisi ke akun tertentu.
  - `groups.<room>.enabled`: tombol aktif/nonaktif per ruang. Saat `false`, ruang diabaikan seolah-olah tidak ada di dalam peta.
  - `groups.<room>.requireMention`: penggantian per ruang untuk persyaratan penyebutan tingkat kanal.
  - `groups.<room>.allowBots`: penggantian per ruang untuk pengaturan tingkat kanal (`true` atau `"mentions"`).
  - `groups.<room>.botLoopProtection`: penggantian per ruang untuk anggaran perlindungan loop bot-ke-bot.
  - `groups.<room>.users`: daftar izinkan pengirim per ruang.
  - `groups.<room>.tools`: penggantian izinkan/tolak alat per ruang.
  - `groups.<room>.autoReply`: penggantian pembatasan penyebutan per ruang. `true` menonaktifkan persyaratan penyebutan untuk ruang tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter skill per ruang.
  - `groups.<room>.systemPrompt`: cuplikan prompt sistem per ruang.

### Pengaturan persetujuan exec

- `execApprovals.enabled`: kirim persetujuan exec melalui prompt native Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui. Menggunakan fallback ke `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (default), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: daftar izinkan agen/sesi opsional untuk pengiriman.

## Terkait

- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku chat grup dan pembatasan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan keamanan
