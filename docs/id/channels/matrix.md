---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan matriks, penyiapan, dan contoh konfigurasi
title: Matriks
x-i18n:
    generated_at: "2026-06-28T20:40:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah Plugin kanal yang dapat diunduh untuk OpenClaw.
Matrix menggunakan `matrix-js-sdk` resmi dan mendukung DM, ruang, utas, media, reaksi, jajak pendapat, lokasi, dan E2EE.

## Instal

Instal Matrix dari ClawHub sebelum mengonfigurasi kanal:

```bash
openclaw plugins install @openclaw/matrix
```

Spesifikasi Plugin polos mencoba ClawHub terlebih dahulu, lalu fallback npm. Untuk memaksa sumber registry, gunakan `openclaw plugins install clawhub:@openclaw/matrix` atau `openclaw plugins install npm:@openclaw/matrix`.

Dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` mendaftarkan dan mengaktifkan Plugin, jadi tidak diperlukan langkah `openclaw plugins enable matrix` terpisah. Plugin tetap tidak melakukan apa pun sampai Anda mengonfigurasi kanal di bawah. Lihat [Plugins](/id/tools/plugin) untuk perilaku Plugin umum dan aturan instalasi.

## Penyiapan

1. Buat akun Matrix di homeserver Anda.
2. Konfigurasikan `channels.matrix` dengan `homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`.
3. Mulai ulang gateway.
4. Mulai DM dengan bot, atau undang bot ke ruang (lihat [auto-join](#auto-join) - undangan baru hanya masuk ketika `autoJoin` mengizinkannya).

### Penyiapan interaktif

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard meminta: URL homeserver, metode autentikasi (token akses atau kata sandi), ID pengguna (hanya autentikasi kata sandi), nama perangkat opsional, apakah akan mengaktifkan E2EE, dan apakah akan mengonfigurasi akses ruang serta auto-join.

Jika env var `MATRIX_*` yang cocok sudah ada dan akun yang dipilih belum memiliki autentikasi tersimpan, wizard menawarkan pintasan env-var. Untuk menyelesaikan nama ruang sebelum menyimpan allowlist, jalankan `openclaw channels resolve --channel matrix "Project Room"`. Saat E2EE diaktifkan, wizard menulis konfigurasi dan menjalankan bootstrap yang sama seperti [`openclaw matrix encryption setup`](#encryption-and-verification).

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

### Auto-join

`channels.matrix.autoJoin` bernilai default `off`. Dengan default ini, bot tidak akan muncul di ruang atau DM baru dari undangan baru sampai Anda bergabung secara manual.

OpenClaw tidak dapat mengetahui pada saat undangan apakah ruang yang diundang adalah DM atau grup, jadi semua undangan - termasuk undangan bergaya DM - melewati `autoJoin` terlebih dahulu. `dm.policy` baru berlaku kemudian, setelah bot bergabung dan ruang telah diklasifikasikan.

<Warning>
Tetapkan `autoJoin: "allowlist"` plus `autoJoinAllowlist` untuk membatasi undangan mana yang diterima bot, atau `autoJoin: "always"` untuk menerima setiap undangan.

`autoJoinAllowlist` hanya menerima target stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama ruang polos ditolak; entri alias diselesaikan terhadap homeserver, bukan terhadap state yang diklaim oleh ruang yang mengundang.
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

Allowlist DM dan ruang sebaiknya diisi dengan ID stabil:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan diabaikan secara default karena dapat berubah; tetapkan `dangerouslyAllowNameMatching: true` hanya saat Anda secara eksplisit membutuhkan kompatibilitas dengan entri nama tampilan.
- Kunci allowlist ruang (`groups`, legacy `rooms`): gunakan `!room:server` atau `#alias:server`. Nama ruang polos diabaikan secara default; tetapkan `dangerouslyAllowNameMatching: true` hanya saat Anda secara eksplisit membutuhkan kompatibilitas dengan pencarian nama ruang yang telah dimasuki.
- Allowlist undangan (`autoJoinAllowlist`): gunakan `!room:server`, `#alias:server`, atau `*`. Nama ruang polos ditolak.

### Normalisasi ID akun

Wizard mengubah nama yang mudah dibaca menjadi ID akun yang dinormalisasi. Misalnya, `Ops Bot` menjadi `ops-bot`. Tanda baca di-escape dalam nama env-var berscope sehingga dua akun tidak dapat bertabrakan: `-` → `_X2D_`, jadi `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

### Kredensial yang di-cache

Matrix menyimpan kredensial yang di-cache di bawah `~/.openclaw/credentials/matrix/`:

- akun default: `credentials.json`
- akun bernama: `credentials-<account>.json`

Saat kredensial yang di-cache ada di sana, OpenClaw memperlakukan Matrix sebagai telah dikonfigurasi meskipun token akses tidak ada di file konfigurasi - ini mencakup penyiapan, `openclaw doctor`, dan probe status kanal.

### Variabel lingkungan

Digunakan saat kunci konfigurasi yang ekuivalen tidak ditetapkan. Akun default menggunakan nama tanpa prefiks; akun bernama menggunakan ID akun yang disisipkan sebelum sufiks.

| Akun default          | Akun bernama (`<ID>` adalah ID akun yang dinormalisasi) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Untuk akun `ops`, namanya menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. Env var recovery-key dibaca oleh alur CLI yang sadar pemulihan (`verify backup restore`, `verify device`, `verify bootstrap`) saat Anda menyalurkan kunci melalui `--recovery-key-stdin`.

`MATRIX_HOMESERVER` tidak dapat ditetapkan dari `.env` workspace; lihat [File `.env` workspace](/id/gateway/security).

## Contoh konfigurasi

Baseline praktis dengan pairing DM, allowlist ruang, dan E2EE:

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

Streaming balasan Matrix bersifat opt-in. `streaming` mengontrol cara OpenClaw mengirimkan balasan asisten yang sedang berjalan; `blockStreaming` mengontrol apakah setiap blok yang selesai dipertahankan sebagai pesan Matrix tersendiri.

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

| `streaming`       | Perilaku                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | Menunggu balasan lengkap, mengirim sekali. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                           |
| `"partial"`       | Mengedit satu pesan teks normal di tempat saat model menulis blok saat ini. Klien Matrix bawaan dapat memberi notifikasi pada pratinjau pertama, bukan edit final.             |
| `"quiet"`         | Sama seperti `"partial"` tetapi pesannya adalah notice yang tidak memberi notifikasi. Penerima hanya mendapat notifikasi setelah aturan push per pengguna cocok dengan edit final (lihat di bawah). |

`blockStreaming` independen dari `streaming`:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (default)                     |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `"partial"` / `"quiet"` | Draf langsung untuk blok saat ini, blok selesai disimpan sebagai pesan  | Draf langsung untuk blok saat ini, difinalisasi di tempat |
| `"off"`                 | Satu pesan Matrix yang memberi notifikasi per blok selesai              | Satu pesan Matrix yang memberi notifikasi untuk balasan lengkap |

Catatan:

- Jika pratinjau melebihi batas ukuran per-event Matrix, OpenClaw menghentikan streaming pratinjau dan fallback ke pengiriman final-saja.
- Balasan media selalu mengirim lampiran secara normal. Jika pratinjau stale tidak lagi dapat digunakan ulang dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media final.
- Pembaruan pratinjau progres alat diaktifkan secara default saat streaming pratinjau Matrix aktif. Tetapkan `streaming.preview.toolProgress: false` untuk mempertahankan edit pratinjau untuk teks jawaban tetapi membiarkan progres alat pada jalur pengiriman normal.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan `streaming: "off"` jika Anda menginginkan profil rate-limit paling konservatif.

## Pesan suara

Catatan suara Matrix yang masuk ditranskripsikan sebelum gerbang penyebutan ruang. Ini memungkinkan catatan suara yang menyebut nama bot memicu agen di ruang `requireMention: true`, dan memberi agen transkrip alih-alih hanya placeholder lampiran audio.

Matrix menggunakan penyedia media audio bersama yang dikonfigurasi di bawah `tools.media.audio`, seperti OpenAI `gpt-4o-mini-transcribe`. Lihat [Ikhtisar alat media](/id/tools/media-overview) untuk penyiapan penyedia dan batasannya.

Detail perilaku:

- Event `m.audio` dan event `m.file` dengan tipe MIME `audio/*` memenuhi syarat.
- Di ruang terenkripsi, OpenClaw mendekripsi lampiran melalui jalur media Matrix yang ada sebelum transkripsi.
- Transkrip ditandai sebagai dibuat mesin dan tidak tepercaya di prompt agen.
- Lampiran ditandai sebagai sudah ditranskripsi sehingga alat media hilir tidak mentranskripsikan catatan suara yang sama lagi.
- Tetapkan `tools.media.audio.enabled: false` untuk menonaktifkan transkripsi audio secara global.

## Metadata persetujuan

Prompt persetujuan native Matrix adalah event `m.room.message` normal dengan konten event kustom khusus OpenClaw di bawah `com.openclaw.approval`. Matrix mengizinkan kunci konten event kustom, jadi klien bawaan tetap merender badan teks sementara klien yang sadar OpenClaw dapat membaca ID persetujuan terstruktur, jenis, state, keputusan yang tersedia, dan detail exec/Plugin.

Saat prompt persetujuan terlalu panjang untuk satu event Matrix, OpenClaw memecah teks yang terlihat menjadi beberapa bagian dan melampirkan `com.openclaw.approval` hanya ke bagian pertama. Reaksi untuk keputusan izinkan/tolak terikat ke event pertama itu, jadi prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu-event.

### Aturan push self-hosted untuk pratinjau final yang senyap

`streaming: "quiet"` hanya memberi notifikasi kepada penerima setelah blok atau giliran difinalisasi - aturan push per pengguna harus cocok dengan penanda pratinjau final. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk resep lengkap (token penerima, pemeriksaan pusher, instalasi aturan, catatan per homeserver).

## Ruang bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi diabaikan.

Gunakan `allowBots` saat Anda memang menginginkan lalu lintas Matrix antar-agen:

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

- `allowBots: true` menerima pesan dari akun bot Matrix terkonfigurasi lainnya di ruang dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya ketika pesan itu menyebut bot ini secara terlihat di ruang. DM tetap diizinkan.
- `groups.<room>.allowBots` menggantikan pengaturan tingkat akun untuk satu ruang.
- Pesan bot terkonfigurasi yang diterima menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection`, lalu timpa dengan `channels.matrix.botLoopProtection` atau `channels.matrix.groups.<room>.botLoopProtection` ketika satu ruang memerlukan anggaran berbeda.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan mandiri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw memperlakukan "bot-authored" sebagai "dikirim oleh akun Matrix terkonfigurasi lain pada Gateway OpenClaw ini".

Gunakan allowlist ruang yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di ruang bersama.

## Enkripsi dan verifikasi

Di ruang terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkap. Ruang yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi - Plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik lengkap), `--json` (keluaran yang dapat dibaca mesin), dan `--account <id>` (setup multi-akun). Keluaran ringkas secara default dengan logging SDK internal yang senyap. Contoh di bawah menunjukkan bentuk kanonis; tambahkan flag sesuai kebutuhan.

### Aktifkan enkripsi

```bash
openclaw matrix encryption setup
```

Melakukan bootstrap secret storage dan cross-signing, membuat cadangan room-key jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag yang berguna:

- `--recovery-key <key>` menerapkan recovery key sebelum bootstrap (utamakan bentuk stdin yang didokumentasikan di bawah)
- `--force-reset-cross-signing` membuang identitas cross-signing saat ini dan membuat yang baru (gunakan hanya dengan sengaja)

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
- `Cross-signing verified`: SDK melaporkan verifikasi melalui cross-signing
- `Signed by owner`: ditandatangani oleh self-signing key Anda sendiri (hanya diagnostik)

`Verified by owner` menjadi `yes` hanya ketika `Cross-signing verified` bernilai `yes`. Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik upaya terbaik tanpa menyiapkan akun Matrix terlebih dahulu; berguna untuk probe offline atau yang terkonfigurasi sebagian.

### Verifikasi perangkat ini dengan recovery key

Recovery key bersifat sensitif - kirimkan melalui stdin alih-alih meneruskannya di command line. Tetapkan `MATRIX_RECOVERY_KEY` (atau `MATRIX_<ID>_RECOVERY_KEY` untuk akun bernama):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah ini melaporkan tiga status:

- `Recovery key accepted`: Matrix menerima key untuk secret storage atau kepercayaan perangkat.
- `Backup usable`: cadangan room-key dapat dimuat dengan materi pemulihan tepercaya.
- `Device verified by owner`: perangkat ini memiliki kepercayaan identitas cross-signing Matrix penuh.

Perintah keluar dengan non-zero ketika kepercayaan identitas penuh belum lengkap, meskipun recovery key membuka materi cadangan. Dalam kasus itu, selesaikan verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu `Cross-signing verified: yes` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyesuaikan waktu tunggu.

Bentuk key literal `openclaw matrix verify device "<recovery-key>"` juga diterima, tetapi key akan masuk ke riwayat shell Anda.

### Bootstrap atau perbaiki cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` adalah perintah perbaikan dan setup untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap secret storage, menggunakan ulang recovery key yang ada bila memungkinkan
- melakukan bootstrap cross-signing dan mengunggah public key yang hilang
- menandai dan melakukan cross-sign pada perangkat saat ini
- membuat cadangan room-key sisi server jika belum ada

Jika homeserver memerlukan UIA untuk mengunggah key cross-signing, OpenClaw mencoba tanpa auth terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`).

Flag yang berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas cross-signing saat ini (hanya disengaja; memerlukan recovery key aktif tersimpan atau diberikan dengan `--recovery-key-stdin`)

### Cadangan room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menunjukkan apakah cadangan sisi server ada dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor room key yang dicadangkan ke penyimpanan kripto lokal; jika recovery key sudah ada di disk, Anda dapat menghilangkan `--recovery-key-stdin`.

Untuk mengganti cadangan rusak dengan baseline baru (menerima hilangnya riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang secret storage jika rahasia cadangan saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya ketika Anda memang ingin recovery key sebelumnya berhenti membuka baseline cadangan baru.

### Mencantumkan, meminta, dan merespons verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun OpenClaw ini. `--own-user` meminta verifikasi mandiri (Anda menerima prompt di klien Matrix lain dari pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lain.

Untuk penanganan siklus hidup tingkat lebih rendah - biasanya saat membayangi permintaan masuk dari klien lain - perintah ini bekerja pada permintaan `<id>` tertentu (dicetak oleh `verify list` dan `verify request`):

| Perintah                                   | Tujuan                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Menerima permintaan masuk                                           |
| `openclaw matrix verify start <id>`        | Memulai alur SAS                                                    |
| `openclaw matrix verify sas <id>`          | Mencetak emoji atau desimal SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | Mengonfirmasi bahwa SAS cocok dengan yang ditampilkan klien lain    |
| `openclaw matrix verify mismatch-sas <id>` | Menolak SAS ketika emoji atau desimal tidak cocok                   |
| `openclaw matrix verify cancel <id>`       | Membatalkan; menerima `--reason <text>` dan `--code <matrix-code>` opsional |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, dan `cancel` semuanya menerima `--user-id` dan `--room-id` sebagai petunjuk tindak lanjut DM ketika verifikasi dikaitkan ke ruang direct-message tertentu.

### Catatan multi-akun

Tanpa `--account <id>`, perintah CLI Matrix menggunakan akun default implisit. Jika Anda memiliki beberapa akun bernama dan belum menetapkan `channels.matrix.defaultAccount`, perintah akan menolak menebak dan meminta Anda memilih. Ketika E2EE dinonaktifkan atau tidak tersedia untuk akun bernama, error menunjuk ke key konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Perilaku startup">
    Dengan `encryption: true`, `startupVerification` default ke `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikat dan menerapkan cooldown (default 24 jam). Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan pass bootstrap kripto konservatif yang menggunakan ulang secret storage dan identitas cross-signing saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan terjaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, startup mencatat peringatan dan tetap non-fatal. Perangkat yang sudah ditandatangani pemilik dipertahankan.

    Lihat [migrasi Matrix](/id/channels/matrix-migration) untuk alur upgrade lengkap.

  </Accordion>

  <Accordion title="Notifikasi verifikasi">
    Matrix memposting notifikasi siklus hidup verifikasi ke ruang verifikasi DM ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verify by emoji"), mulai/selesai, dan detail SAS (emoji/desimal) bila tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia - Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

    Notifikasi sistem verifikasi tidak diteruskan ke pipeline chat agen.

  </Accordion>

  <Accordion title="Perangkat Matrix yang dihapus atau tidak valid">
    Jika `verify status` mengatakan perangkat saat ini tidak lagi terdaftar di homeserver, buat perangkat Matrix OpenClaw baru. Untuk login kata sandi:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Untuk auth token, buat access token baru di klien Matrix atau UI admin Anda, lalu perbarui OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Ganti `assistant` dengan ID akun dari perintah yang gagal, atau hilangkan `--account` untuk akun default.

  </Accordion>

  <Accordion title="Higiene perangkat">
    Perangkat lama yang dikelola OpenClaw dapat menumpuk. Cantumkan dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Penyimpanan kripto">
    E2EE Matrix menggunakan jalur kripto Rust resmi `matrix-js-sdk` dengan `fake-indexeddb` sebagai shim IndexedDB. Status kripto bertahan di `crypto-idb-snapshot.json` (izin file restriktif).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup sync store, crypto store, recovery key, snapshot IDB, binding thread, dan status verifikasi startup. Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan ulang root terbaik yang ada sehingga status sebelumnya tetap terlihat.

    Satu root token-hash yang lebih lama dapat menjadi jalur kontinuitas rotasi token yang normal. Jika OpenClaw mencatat `matrix: multiple populated token-hash storage roots detected`, periksa direktori akun dan arsipkan root saudara yang usang hanya setelah memastikan root aktif yang dipilih sehat. Utamakan memindahkan root usang ke direktori `_archive/` daripada langsung menghapusnya.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui profil mandiri Matrix untuk akun yang dipilih:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Anda dapat meneruskan kedua opsi dalam satu panggilan. Matrix menerima URL avatar `mxc://` secara langsung; saat Anda meneruskan `http://` atau `https://`, OpenClaw mengunggah file terlebih dahulu dan menyimpan URL `mxc://` yang dihasilkan ke `channels.matrix.avatarUrl` (atau override per akun).

## Utas

Matrix mendukung utas Matrix native untuk balasan otomatis maupun pengiriman alat pesan. Dua pengaturan independen mengontrol perilakunya:

### Perutean sesi (`sessionScope`)

`dm.sessionScope` menentukan bagaimana ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (default): semua ruang DM dengan peer terute yang sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan kunci sesinya sendiri, meskipun peer-nya sama.

Binding percakapan eksplisit selalu mengungguli `sessionScope`, sehingga ruang dan utas yang sudah diikat tetap mempertahankan sesi target pilihannya.

### Pengutasan balasan (`threadReplies`)

`threadReplies` menentukan tempat bot memposting balasannya:

- `"off"`: balasan berada di level teratas. Pesan masuk berutas tetap berada di sesi induk.
- `"inbound"`: balas di dalam utas hanya saat pesan masuk sudah berada di utas tersebut.
- `"always"`: balas di dalam utas yang berakar pada pesan pemicu; percakapan tersebut dirutekan melalui sesi bercakupan utas yang sesuai sejak pemicu pertama dan seterusnya.

`dm.threadReplies` meng-override ini hanya untuk DM - misalnya, menjaga utas ruang tetap terisolasi sambil menjaga DM tetap datar.

### Pewarisan utas dan perintah slash

- Pesan masuk berutas menyertakan pesan akar utas sebagai konteks agen tambahan.
- Pengiriman alat pesan otomatis mewarisi utas Matrix saat ini ketika menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal bercakupan pengguna.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat utas semuanya berfungsi di ruang Matrix dan DM.
- `/focus` level teratas membuat utas Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSessions` diaktifkan.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam utas Matrix yang ada akan mengikat utas tersebut di tempat.

Ketika OpenClaw mendeteksi ruang DM Matrix bertabrakan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw memposting `m.notice` satu kali di ruang tersebut yang menunjuk ke jalan keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Pemberitahuan hanya muncul ketika binding utas diaktifkan.

## Binding percakapan ACP

Ruang Matrix, DM, dan utas Matrix yang ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, ruang, atau utas yang ada yang ingin tetap Anda gunakan.
- Di DM atau ruang Matrix level teratas, DM/ruang saat ini tetap menjadi permukaan chat dan pesan mendatang dirutekan ke sesi ACP yang dibuat.
- Di dalam utas Matrix yang ada, `--bind here` mengikat utas saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat utas Matrix turunan.
- `threadBindings.spawnSessions` mengatur `/acp spawn --thread auto|here`, ketika OpenClaw perlu membuat atau mengikat utas Matrix turunan.

### Konfigurasi binding utas

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per kanal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Pembuatan sesi terikat utas Matrix aktif secara default:

- Atur `threadBindings.spawnSessions: false` untuk memblokir `/focus` level teratas dan `/acp spawn --thread auto|here` agar tidak membuat/mengikat utas Matrix.
- Atur `threadBindings.defaultSpawnContext: "isolated"` ketika pembuatan utas subagen native tidak boleh mem-fork transkrip induk.

## Reaksi

Matrix mendukung reaksi keluar, notifikasi reaksi masuk, dan reaksi ack.

Peralatan reaksi keluar dikendalikan oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke event Matrix.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix.
- `emoji=""` menghapus reaksi milik bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari bot.

**Urutan resolusi** (nilai pertama yang didefinisikan menang):

| Pengaturan             | Urutan                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`          | per akun → kanal → `messages.ackReaction` → fallback emoji identitas agen        |
| `ackReactionScope`     | per akun → kanal → `messages.ackReactionScope` → default `"group-mentions"`      |
| `reactionNotifications` | per akun → kanal → default `"own"`                                             |

`reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika menargetkan pesan Matrix yang ditulis bot; `"off"` menonaktifkan event sistem reaksi. Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- Riwayat ruang Matrix hanya untuk ruang. DM tetap menggunakan riwayat sesi normal.
- Riwayat ruang Matrix hanya tertunda: OpenClaw men-buffer pesan ruang yang belum memicu balasan, lalu mengambil snapshot jendela tersebut ketika mention atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di isi masuk utama untuk giliran tersebut.
- Percobaan ulang event Matrix yang sama menggunakan ulang snapshot riwayat asli alih-alih bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks ruang tambahan seperti teks balasan yang diambil, akar utas, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist ruang/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap menyimpan satu balasan kutipan eksplisit.

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

Untuk membungkam DM sepenuhnya sambil tetap menjaga ruang berfungsi, atur `dm.enabled: false`:

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

Contoh penyandingan untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan ulang kode penyandingan tertunda yang sama dan dapat mengirim balasan pengingat setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Penyandingan](/id/channels/pairing) untuk alur penyandingan DM bersama dan tata letak penyimpanan.

## Perbaikan ruang langsung

Jika status pesan langsung tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke ruang solo lama alih-alih DM aktif. Periksa pemetaan saat ini untuk peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk setup multi-akun. Alur perbaikan:

- memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat yang saat ini diikuti dengan pengguna tersebut
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Ini tidak menghapus ruang lama secara otomatis. Ini memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix mendatang, pemberitahuan verifikasi, dan alur pesan langsung lainnya menargetkan ruang yang benar.

## Persetujuan eksekusi

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk override per akun):

- `enabled`: kirim persetujuan melalui prompt native Matrix. Saat tidak diatur atau `"auto"`, Matrix aktif otomatis setelah setidaknya satu pemberi persetujuan dapat diselesaikan. Atur `false` untuk menonaktifkan secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan exec. Opsional - fallback ke `channels.matrix.dm.allowFrom`.
- `target`: tempat prompt dikirim. `"dm"` (default) mengirim ke DM pemberi persetujuan; `"channel"` mengirim ke ruang Matrix atau DM asal; `"both"` mengirim ke keduanya.
- `agentFilter` / `sessionFilter`: allowlist opsional untuk agen/sesi mana yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda antara jenis persetujuan:

- **Persetujuan exec** menggunakan `execApprovals.approvers`, dengan fallback ke `dm.allowFrom`.
- **Persetujuan Plugin** mengotorisasi hanya melalui `dm.allowFrom`.

Kedua jenis berbagi pintasan reaksi Matrix dan pembaruan pesan. Pemberi persetujuan melihat pintasan reaksi pada pesan persetujuan utama:

- `✅` izinkan sekali
- `❌` tolak
- `♾️` selalu izinkan (ketika kebijakan exec efektif mengizinkannya)

Perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Hanya pemberi persetujuan yang berhasil diselesaikan yang dapat menyetujui atau menolak. Pengiriman kanal untuk persetujuan exec menyertakan teks perintah - hanya aktifkan `channel` atau `both` di ruang tepercaya.

Terkait: [Persetujuan eksekusi](/id/tools/exec-approvals).

## Perintah slash

Perintah slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dll.) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan mention Matrix milik bot sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa regex mention kustom. Ini menjaga bot tetap responsif terhadap posting bergaya ruang `@mention /command` yang dikeluarkan Element dan klien serupa ketika pengguna menyelesaikan tab bot sebelum mengetik perintah.

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
- Batasi entri ruang yang diwarisi ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` dibagikan lintas akun; `account: "default"` tetap berfungsi saat akun default dikonfigurasi di tingkat atas.

**Pemilihan akun default:**

- Atur `defaultAccount` untuk memilih akun bernama yang diprioritaskan oleh routing implisit, probing, dan perintah CLI.
- Jika Anda memiliki beberapa akun dan salah satunya benar-benar bernama `default`, OpenClaw menggunakannya secara implisit meskipun `defaultAccount` tidak diatur.
- Jika Anda memiliki beberapa akun bernama dan tidak ada default yang dipilih, perintah CLI menolak menebak - atur `defaultAccount` atau teruskan `--account <id>`.
- Blok `channels.matrix.*` tingkat atas hanya diperlakukan sebagai akun `default` implisit saat autentikasinya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang di-cache mencakup autentikasi.

**Promosi:**

- Saat OpenClaw mempromosikan konfigurasi akun tunggal menjadi multi-akun selama perbaikan atau penyiapan, OpenClaw mempertahankan akun bernama yang ada jika ada atau jika `defaultAccount` sudah mengarah ke salah satunya. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan; kunci kebijakan pengiriman bersama tetap berada di tingkat atas.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver Privat/LAN

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

Opt-in ini hanya mengizinkan target privat/internal tepercaya. Homeserver cleartext publik seperti
`http://matrix.example.org:8008` tetap diblokir. Pilih `https://` bila memungkinkan.

## Memproksikan Traffic Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) outbound eksplisit, atur `channels.matrix.proxy`:

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
OpenClaw menggunakan pengaturan proxy yang sama untuk traffic Matrix runtime dan probe status akun.

## Resolusi Target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target ruang atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Ruang: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID ruang Matrix peka huruf besar/kecil. Gunakan kapitalisasi ID ruang yang tepat dari Matrix
saat mengonfigurasi target pengiriman eksplisit, cron job, binding, atau allowlist.
OpenClaw menjaga kunci sesi internal tetap kanonis untuk penyimpanan, sehingga kunci huruf kecil
tersebut bukan sumber yang andal untuk ID pengiriman Matrix.

Lookup direktori live menggunakan akun Matrix yang sedang login:

- Lookup pengguna mengkueri direktori pengguna Matrix pada homeserver tersebut.
- Lookup ruang menerima ID ruang eksplisit dan alias secara langsung. Lookup nama ruang yang sudah diikuti bersifat best-effort dan hanya berlaku untuk allowlist ruang runtime saat `dangerouslyAllowNameMatching: true` diatur.
- Jika nama ruang tidak dapat di-resolve menjadi ID atau alias, nama tersebut diabaikan oleh resolusi allowlist runtime.

## Referensi Konfigurasi

Kolom pengguna bergaya allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Entri pengguna non-ID diabaikan secara default. Jika Anda mengatur `dangerouslyAllowNameMatching: true`, kecocokan nama tampilan direktori Matrix yang persis di-resolve saat startup dan setiap kali allowlist berubah saat monitor berjalan; entri yang tidak dapat di-resolve diabaikan saat runtime.

Kunci allowlist ruang (`groups`, legacy `rooms`) sebaiknya berupa ID ruang atau alias. Kunci nama ruang polos diabaikan secara default; `dangerouslyAllowNameMatching: true` memulihkan lookup best-effort terhadap nama ruang yang sudah diikuti.

### Akun dan Koneksi

- `enabled`: aktifkan atau nonaktifkan channel.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `accounts`: override per akun bernama. Nilai `channels.matrix` tingkat atas diwarisi sebagai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau hostname internal.
- `proxy`: URL proxy HTTP(S) opsional untuk traffic Matrix. Override per akun didukung.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: token akses untuk autentikasi berbasis token. Nilai plaintext dan SecretRef didukung di seluruh penyedia env/file/exec ([Manajemen Secret](/id/gateway/secrets)).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai plaintext dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat login dengan kata sandi.
- `avatarUrl`: URL avatar diri tersimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sinkronisasi startup.

### Enkripsi

- `encryption`: aktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default saat E2EE aktif) atau `"off"`. Meminta verifikasi diri secara otomatis saat startup jika perangkat ini belum diverifikasi.
- `startupVerificationCooldownHours`: cooldown sebelum permintaan startup otomatis berikutnya. Default: `24`.

### Akses dan Kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: allowlist ID pengguna untuk traffic ruang.
- `dm.enabled`: saat `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan ruang sebagai DM; tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: allowlist ID pengguna untuk traffic DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: override khusus DM untuk reply threading (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: terima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: saat `true`, memaksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `dangerouslyAllowNameMatching`: saat `true`, mengizinkan lookup direktori nama tampilan Matrix untuk entri allowlist pengguna dan lookup nama ruang yang sudah diikuti untuk kunci allowlist ruang. Pilih ID `@user:server` lengkap dan ID ruang atau alias.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: ruang/alias yang diizinkan saat `autoJoin` adalah `"allowlist"`. Entri alias di-resolve terhadap homeserver, bukan terhadap state yang diklaim oleh ruang pengundang.
- `contextVisibility`: visibilitas konteks tambahan (default `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Perilaku Balasan

- `replyToMode`: `"off"`, `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, atau `"always"`.
- `threadBindings`: override per channel untuk routing dan lifecycle sesi terikat thread.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, atau bentuk objek `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: saat `true`, blok assistant yang selesai dipertahankan sebagai pesan progres terpisah.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks outbound.
- `responsePrefix`: string opsional yang ditambahkan di depan balasan outbound.
- `textChunkLimit`: ukuran chunk outbound dalam karakter saat `chunkMode: "length"`. Default: `4000`.
- `chunkMode`: `"length"` (default, membagi berdasarkan jumlah karakter) atau `"newline"` (membagi pada batas baris).
- `historyLimit`: jumlah pesan ruang terbaru yang disertakan sebagai `InboundHistory` saat pesan ruang memicu agent. Fallback ke `messages.groupChat.historyLimit`; default efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman outbound dan pemrosesan inbound.

### Pengaturan Reaksi

- `ackReaction`: override reaksi ack untuk channel/akun ini.
- `ackReactionScope`: override cakupan (default `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi inbound (default `"own"`, `"off"`).

### Tooling dan Override Per Ruang

- `actions`: gating tool per tindakan (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per ruang. Identitas sesi menggunakan ID ruang stabil setelah resolusi. (`rooms` adalah alias legacy.)
  - `groups.<room>.account`: batasi satu entri ruang yang diwarisi ke akun tertentu.
  - `groups.<room>.allowBots`: override per ruang untuk pengaturan tingkat channel (`true` atau `"mentions"`).
  - `groups.<room>.users`: allowlist pengirim per ruang.
  - `groups.<room>.tools`: override allow/deny tool per ruang.
  - `groups.<room>.autoReply`: override gating mention per ruang. `true` menonaktifkan persyaratan mention untuk ruang tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter skill per ruang.
  - `groups.<room>.systemPrompt`: snippet prompt sistem per ruang.

### Pengaturan Persetujuan Exec

- `execApprovals.enabled`: kirim persetujuan exec melalui prompt native Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui. Fallback ke `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (default), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist agent/sesi opsional untuk pengiriman.

## Terkait

- [Ringkasan Channel](/id/channels) - semua channel yang didukung
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) - perilaku chat grup dan gating mention
- [Routing Channel](/id/channels/channel-routing) - routing sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan hardening
