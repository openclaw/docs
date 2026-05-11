---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi Matrix E2EE dan verifikasi
summary: Status dukungan, penyiapan, dan contoh konfigurasi Matrix
title: Matriks
x-i18n:
    generated_at: "2026-05-11T20:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah Plugin saluran yang dapat diunduh untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, ruang, utas, media, reaksi, jajak pendapat, lokasi, dan E2EE.

## Instal

Instal Matrix dari ClawHub sebelum mengonfigurasi saluran:

```bash
openclaw plugins install @openclaw/matrix
```

Spesifikasi Plugin polos mencoba ClawHub terlebih dahulu, lalu fallback npm. Untuk memaksa sumber registri, gunakan `openclaw plugins install clawhub:@openclaw/matrix` atau `openclaw plugins install npm:@openclaw/matrix`.

Dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` mendaftarkan dan mengaktifkan Plugin, jadi tidak diperlukan langkah `openclaw plugins enable matrix` terpisah. Plugin tetap tidak melakukan apa pun sampai Anda mengonfigurasi saluran di bawah. Lihat [Plugin](/id/tools/plugin) untuk perilaku Plugin umum dan aturan instalasi.

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

Jika env var `MATRIX_*` yang cocok sudah ada dan akun yang dipilih tidak memiliki auth tersimpan, wizard menawarkan pintasan env-var. Untuk menyelesaikan nama ruang sebelum menyimpan allowlist, jalankan `openclaw channels resolve --channel matrix "Project Room"`. Ketika E2EE diaktifkan, wizard menulis konfigurasi dan menjalankan bootstrap yang sama seperti [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` default-nya `off`. Dengan default tersebut, bot tidak akan muncul di ruang baru atau DM dari undangan baru sampai Anda bergabung secara manual.

OpenClaw tidak dapat mengetahui pada waktu undangan apakah ruang yang diundang adalah DM atau grup, sehingga semua undangan - termasuk undangan bergaya DM - melewati `autoJoin` terlebih dahulu. `dm.policy` hanya berlaku kemudian, setelah bot bergabung dan ruang telah diklasifikasikan.

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

Allowlist DM dan ruang paling baik diisi dengan ID stabil:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan diabaikan secara default karena dapat berubah; tetapkan `dangerouslyAllowNameMatching: true` hanya ketika Anda secara eksplisit membutuhkan kompatibilitas dengan entri nama tampilan.
- Kunci allowlist ruang (`groups`, `rooms` legacy): gunakan `!room:server` atau `#alias:server`. Nama ruang polos diabaikan secara default; tetapkan `dangerouslyAllowNameMatching: true` hanya ketika Anda secara eksplisit membutuhkan kompatibilitas dengan lookup nama ruang yang sudah diikuti.
- Allowlist undangan (`autoJoinAllowlist`): gunakan `!room:server`, `#alias:server`, atau `*`. Nama ruang polos ditolak.

### Normalisasi ID akun

Wizard mengonversi nama ramah menjadi ID akun yang dinormalisasi. Misalnya, `Ops Bot` menjadi `ops-bot`. Tanda baca di-escape dalam nama env-var berscope sehingga dua akun tidak dapat bertabrakan: `-` → `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

### Kredensial yang di-cache

Matrix menyimpan kredensial yang di-cache di bawah `~/.openclaw/credentials/matrix/`:

- akun default: `credentials.json`
- akun bernama: `credentials-<account>.json`

Ketika kredensial yang di-cache ada di sana, OpenClaw memperlakukan Matrix sebagai terkonfigurasi meskipun token akses tidak ada di file konfigurasi - ini mencakup penyiapan, `openclaw doctor`, dan probe status saluran.

### Variabel lingkungan

Digunakan ketika kunci konfigurasi ekuivalen tidak ditetapkan. Akun default menggunakan nama tanpa prefiks; akun bernama menggunakan ID akun yang disisipkan sebelum sufiks.

| Akun default          | Akun bernama (`<ID>` adalah ID akun yang dinormalisasi) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Untuk akun `ops`, nama-namanya menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. Env var kunci pemulihan dibaca oleh alur CLI yang sadar pemulihan (`verify backup restore`, `verify device`, `verify bootstrap`) ketika Anda menyalurkan kunci melalui `--recovery-key-stdin`.

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

| `streaming`       | Perilaku                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | Tunggu balasan lengkap, kirim sekali. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                        |
| `"partial"`       | Edit satu pesan teks normal di tempat saat model menulis blok saat ini. Klien Matrix stok dapat memberi notifikasi pada pratinjau pertama, bukan edit final.                         |
| `"quiet"`         | Sama seperti `"partial"` tetapi pesannya adalah notice tanpa notifikasi. Penerima hanya mendapat notifikasi setelah aturan push per pengguna cocok dengan edit yang difinalisasi (lihat di bawah). |

`blockStreaming` independen dari `streaming`:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (default)                          |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `"partial"` / `"quiet"` | Draf langsung untuk blok saat ini, blok selesai disimpan sebagai pesan  | Draf langsung untuk blok saat ini, difinalisasi di tempat  |
| `"off"`                 | Satu pesan Matrix yang memberi notifikasi per blok yang selesai         | Satu pesan Matrix yang memberi notifikasi untuk balasan lengkap |

Catatan:

- Jika pratinjau tumbuh melewati batas ukuran per-event Matrix, OpenClaw menghentikan streaming pratinjau dan fallback ke pengiriman final-saja.
- Balasan media selalu mengirim lampiran secara normal. Jika pratinjau lama tidak lagi dapat digunakan kembali dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media final.
- Pembaruan pratinjau progres alat diaktifkan secara default ketika streaming pratinjau Matrix aktif. Tetapkan `streaming.preview.toolProgress: false` untuk mempertahankan edit pratinjau untuk teks jawaban tetapi membiarkan progres alat pada jalur pengiriman normal.
- Edit pratinjau memerlukan panggilan API Matrix ekstra. Biarkan `streaming: "off"` jika Anda menginginkan profil rate-limit yang paling konservatif.

## Metadata persetujuan

Prompt persetujuan native Matrix adalah event `m.room.message` normal dengan konten event kustom khusus OpenClaw di bawah `com.openclaw.approval`. Matrix mengizinkan kunci konten event kustom, sehingga klien stok tetap merender body teks sementara klien yang sadar OpenClaw dapat membaca ID persetujuan terstruktur, jenis, state, keputusan yang tersedia, dan detail exec/Plugin.

Ketika prompt persetujuan terlalu panjang untuk satu event Matrix, OpenClaw memecah teks yang terlihat menjadi chunk dan melampirkan `com.openclaw.approval` hanya ke chunk pertama. Reaksi untuk keputusan izinkan/tolak terikat ke event pertama tersebut, sehingga prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu-event.

### Aturan push self-hosted untuk pratinjau final yang senyap

`streaming: "quiet"` hanya memberi notifikasi kepada penerima setelah blok atau turn difinalisasi - aturan push per pengguna harus cocok dengan marker pratinjau yang difinalisasi. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk resep lengkap (token penerima, pemeriksaan pusher, instalasi aturan, catatan per homeserver).

## Ruang bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang terkonfigurasi diabaikan.

Gunakan `allowBots` ketika Anda secara sengaja menginginkan lalu lintas Matrix antargen:

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
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan sendiri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw memperlakukan "dibuat oleh bot" sebagai "dikirim oleh akun Matrix terkonfigurasi lain di Gateway OpenClaw ini".

Gunakan allowlist ruang yang ketat dan persyaratan penyebutan ketika mengaktifkan lalu lintas bot-ke-bot di ruang bersama.

## Enkripsi dan verifikasi

Di ruang terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkap. Ruang yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi - Plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik lengkap), `--json` (output yang dapat dibaca mesin), dan `--account <id>` (penyiapan multi-akun). Output ringkas secara default dengan logging SDK internal yang senyap. Contoh di bawah menampilkan bentuk kanonis; tambahkan flag sesuai kebutuhan.

### Aktifkan enkripsi

```bash
openclaw matrix encryption setup
```

Melakukan bootstrap penyimpanan rahasia dan cross-signing, membuat cadangan room-key jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag yang berguna:

- `--recovery-key <key>` terapkan recovery key sebelum bootstrap (utamakan bentuk stdin yang didokumentasikan di bawah)
- `--force-reset-cross-signing` buang identitas cross-signing saat ini dan buat yang baru (gunakan hanya secara sengaja)

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
- `Signed by owner`: ditandatangani oleh kunci self-signing Anda sendiri (hanya diagnostik)

`Verified by owner` menjadi `yes` hanya ketika `Cross-signing verified` adalah `yes`. Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik best-effort tanpa menyiapkan akun Matrix terlebih dahulu; berguna untuk probe offline atau yang terkonfigurasi sebagian.

### Verifikasi perangkat ini dengan recovery key

Recovery key bersifat sensitif - salurkan melalui stdin alih-alih meneruskannya di baris perintah. Tetapkan `MATRIX_RECOVERY_KEY` (atau `MATRIX_<ID>_RECOVERY_KEY` untuk akun bernama):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah melaporkan tiga status:

- `Recovery key accepted`: Matrix menerima kunci untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Backup usable`: cadangan room-key dapat dimuat dengan materi pemulihan tepercaya.
- `Device verified by owner`: perangkat ini memiliki kepercayaan identitas cross-signing Matrix penuh.

Perintah keluar dengan non-zero ketika kepercayaan identitas penuh belum lengkap, meskipun recovery key membuka materi cadangan. Dalam kasus itu, selesaikan self-verification dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu `Cross-signing verified: yes` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyesuaikan waktu tunggu.

Bentuk kunci literal `openclaw matrix verify device "<recovery-key>"` juga diterima, tetapi kuncinya akan masuk ke riwayat shell Anda.

### Bootstrap atau perbaiki cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap penyimpanan rahasia, menggunakan kembali recovery key yang ada jika memungkinkan
- melakukan bootstrap cross-signing dan mengunggah public key yang hilang
- menandai dan melakukan cross-sign perangkat saat ini
- membuat cadangan room-key sisi server jika belum ada

Jika homeserver memerlukan UIA untuk mengunggah kunci cross-signing, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`).

Flag yang berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas cross-signing saat ini (hanya disengaja)

### Cadangan room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menampilkan apakah cadangan sisi server ada dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor room key yang dicadangkan ke crypto store lokal; jika recovery key sudah ada di disk, Anda dapat menghilangkan `--recovery-key-stdin`.

Untuk mengganti cadangan yang rusak dengan baseline baru (menerima kehilangan riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang penyimpanan rahasia jika rahasia cadangan saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya ketika Anda secara sengaja ingin recovery key sebelumnya berhenti membuka baseline cadangan baru.

### Mencantumkan, meminta, dan merespons verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi yang tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun OpenClaw ini. `--own-user` meminta self-verification (Anda menerima prompt di klien Matrix lain milik pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lainnya.

Untuk penanganan siklus hidup tingkat rendah - biasanya saat membayangi permintaan masuk dari klien lain - perintah ini bertindak pada permintaan tertentu `<id>` (dicetak oleh `verify list` dan `verify request`):

| Perintah                                   | Tujuan                                                              |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`      | Menerima permintaan masuk                                           |
| `openclaw matrix verify start <id>`       | Memulai flow SAS                                                    |
| `openclaw matrix verify sas <id>`         | Mencetak emoji atau desimal SAS                                     |
| `openclaw matrix verify confirm-sas <id>` | Mengonfirmasi bahwa SAS cocok dengan yang ditampilkan klien lain    |
| `openclaw matrix verify mismatch-sas <id>` | Menolak SAS ketika emoji atau desimal tidak cocok                  |
| `openclaw matrix verify cancel <id>`      | Membatalkan; menerima `--reason <text>` dan `--code <matrix-code>` opsional |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, dan `cancel` semuanya menerima `--user-id` dan `--room-id` sebagai petunjuk tindak lanjut DM ketika verifikasi ditambatkan ke ruang direct-message tertentu.

### Catatan multi-akun

Tanpa `--account <id>`, perintah CLI Matrix menggunakan akun default implisit. Jika Anda memiliki beberapa akun bernama dan belum menetapkan `channels.matrix.defaultAccount`, perintah akan menolak menebak dan meminta Anda memilih. Ketika E2EE dinonaktifkan atau tidak tersedia untuk akun bernama, error menunjuk ke key konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Perilaku startup">
    Dengan `encryption: true`, `startupVerification` default ke `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta self-verification di klien Matrix lain, melewati duplikat dan menerapkan cooldown (24 jam secara default). Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan pass bootstrap crypto konservatif yang menggunakan kembali penyimpanan rahasia dan identitas cross-signing saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan terjaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, startup mencatat peringatan dan tetap non-fatal. Perangkat yang sudah ditandatangani pemilik dipertahankan.

    Lihat [Migrasi Matrix](/id/channels/matrix-migration) untuk flow upgrade lengkap.

  </Accordion>

  <Accordion title="Notifikasi verifikasi">
    Matrix memposting notifikasi siklus hidup verifikasi ke ruang verifikasi DM ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verify by emoji"), mulai/selesai, dan detail SAS (emoji/desimal) saat tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima secara otomatis. Untuk self-verification, OpenClaw memulai flow SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia - Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

    Notifikasi sistem verifikasi tidak diteruskan ke pipeline chat agen.

  </Accordion>

  <Accordion title="Perangkat Matrix dihapus atau tidak valid">
    Jika `verify status` mengatakan perangkat saat ini tidak lagi terdaftar di homeserver, buat perangkat Matrix OpenClaw baru. Untuk login kata sandi:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Untuk autentikasi token, buat access token baru di klien Matrix atau UI admin Anda, lalu perbarui OpenClaw:

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

  <Accordion title="Crypto store">
    E2EE Matrix menggunakan jalur crypto Rust resmi `matrix-js-sdk` dengan `fake-indexeddb` sebagai shim IndexedDB. Status crypto bertahan ke `crypto-idb-snapshot.json` (izin file restriktif).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup sync store, crypto store, recovery key, snapshot IDB, binding thread, dan status verifikasi startup. Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang ada sehingga status sebelumnya tetap terlihat.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui self-profile Matrix untuk akun yang dipilih:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Anda dapat meneruskan kedua opsi dalam satu pemanggilan. Matrix menerima URL avatar `mxc://` secara langsung; ketika Anda meneruskan `http://` atau `https://`, OpenClaw mengunggah file terlebih dahulu dan menyimpan URL `mxc://` yang terselesaikan ke `channels.matrix.avatarUrl` (atau override per akun).

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis maupun pengiriman message-tool. Dua knob independen mengontrol perilaku:

### Perutean sesi (`sessionScope`)

`dm.sessionScope` menentukan bagaimana ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (default): semua ruang DM dengan peer yang dirutekan sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan session key sendiri, bahkan ketika peer sama.

Binding percakapan eksplisit selalu menang atas `sessionScope`, sehingga ruang dan thread yang terikat mempertahankan sesi target pilihannya.

### Threading balasan (`threadReplies`)

`threadReplies` menentukan tempat bot memposting balasannya:

- `"off"`: balasan berada di top-level. Pesan ber-thread yang masuk tetap berada pada sesi induk.
- `"inbound"`: balas di dalam thread hanya ketika pesan masuk sudah berada di thread itu.
- `"always"`: balas di dalam thread yang berakar pada pesan pemicu; percakapan itu dirutekan melalui sesi berskala thread yang cocok sejak pemicu pertama dan seterusnya.

`dm.threadReplies` mengesampingkan ini hanya untuk DM - misalnya, menjaga thread ruang tetap terisolasi sambil menjaga DM tetap datar.

### Pewarisan thread dan perintah slash

- Pesan berutas masuk menyertakan pesan akar utas sebagai konteks agen tambahan.
- Pengiriman alat pesan otomatis mewarisi utas Matrix saat ini saat menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali `threadId` eksplisit disediakan.
- Penggunaan ulang target pengguna DM hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal yang bercakupan pengguna.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` terikat utas semuanya berfungsi di ruang Matrix dan DM.
- `/focus` tingkat atas membuat utas Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSessions` diaktifkan.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam utas Matrix yang sudah ada mengikat utas tersebut di tempat.

Ketika OpenClaw mendeteksi ruang DM Matrix bertabrakan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw memposting `m.notice` satu kali di ruang tersebut yang mengarah ke jalur keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Pemberitahuan hanya muncul ketika pengikatan utas diaktifkan.

## Pengikatan percakapan ACP

Ruang Matrix, DM, dan utas Matrix yang sudah ada dapat diubah menjadi ruang kerja ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, ruang, atau utas yang sudah ada yang ingin tetap Anda gunakan.
- Di DM atau ruang Matrix tingkat atas, DM/ruang saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam utas Matrix yang sudah ada, `--bind here` mengikat utas saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus pengikatan.

Catatan:

- `--bind here` tidak membuat utas Matrix anak.
- `threadBindings.spawnSessions` membatasi `/acp spawn --thread auto|here`, ketika OpenClaw perlu membuat atau mengikat utas Matrix anak.

### Konfigurasi pengikatan utas

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung penggantian per-channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Spawn sesi terikat utas Matrix aktif secara default:

- Atur `threadBindings.spawnSessions: false` untuk memblokir `/focus` tingkat atas dan `/acp spawn --thread auto|here` agar tidak membuat/mengikat utas Matrix.
- Atur `threadBindings.defaultSpawnContext: "isolated"` ketika spawn utas subagen native tidak boleh mem-fork transkrip induk.

## Reaksi

Matrix mendukung reaksi keluar, notifikasi reaksi masuk, dan reaksi ack.

Peralatan reaksi keluar dibatasi oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke event Matrix.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix.
- `emoji=""` menghapus reaksi bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari bot.

**Urutan resolusi** (nilai pertama yang ditentukan menang):

| Pengaturan             | Urutan                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `ackReaction`          | per-akun → channel → `messages.ackReaction` → fallback emoji identitas agen     |
| `ackReactionScope`     | per-akun → channel → `messages.ackReactionScope` → default `"group-mentions"`   |
| `reactionNotifications` | per-akun → channel → default `"own"`                                           |

`reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika event tersebut menargetkan pesan Matrix yang ditulis bot; `"off"` menonaktifkan event sistem reaksi. Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkan penghapusan tersebut sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- Riwayat ruang Matrix hanya untuk ruang. DM tetap menggunakan riwayat sesi normal.
- Riwayat ruang Matrix hanya pending: OpenClaw menyangga pesan ruang yang belum memicu balasan, lalu mengambil snapshot jendela tersebut ketika mention atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di isi masuk utama untuk giliran itu.
- Percobaan ulang event Matrix yang sama menggunakan ulang snapshot riwayat asli, bukan bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks ruang tambahan seperti teks balasan yang diambil, akar utas, dan riwayat pending.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist ruang/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan yang dikutip secara eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari pengaturan kebijakan `groupPolicy`, `groups`, `groupAllowFrom`, dan DM.

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

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan ulang kode pairing pending yang sama dan dapat mengirim balasan pengingat setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan ruang langsung

Jika status pesan langsung keluar sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang mengarah ke ruang solo lama, bukan DM aktif. Periksa pemetaan saat ini untuk peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk penyiapan multi-akun. Alur perbaikan:

- lebih memilih DM 1:1 ketat yang sudah dipetakan dalam `m.direct`
- fallback ke DM 1:1 ketat yang saat ini bergabung dengan pengguna tersebut
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM yang sehat

Ini tidak menghapus ruang lama secara otomatis. Ini memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix, pemberitahuan verifikasi, dan alur pesan langsung lainnya di masa mendatang menargetkan ruang yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk penggantian per-akun):

- `enabled`: mengirim persetujuan melalui prompt native Matrix. Ketika tidak diatur atau `"auto"`, Matrix otomatis aktif setelah setidaknya satu pemberi persetujuan dapat di-resolve. Atur `false` untuk menonaktifkan secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan exec. Opsional - fallback ke `channels.matrix.dm.allowFrom`.
- `target`: ke mana prompt dikirim. `"dm"` (default) dikirim ke DM pemberi persetujuan; `"channel"` dikirim ke ruang Matrix atau DM asal; `"both"` dikirim ke keduanya.
- `agentFilter` / `sessionFilter`: allowlist opsional untuk agen/sesi mana yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda antara jenis persetujuan:

- **Persetujuan exec** menggunakan `execApprovals.approvers`, dengan fallback ke `dm.allowFrom`.
- **Persetujuan Plugin** mengotorisasi hanya melalui `dm.allowFrom`.

Kedua jenis berbagi pintasan reaksi Matrix dan pembaruan pesan. Pemberi persetujuan melihat pintasan reaksi pada pesan persetujuan utama:

- `✅` izinkan sekali
- `❌` tolak
- `♾️` selalu izinkan (ketika kebijakan exec efektif mengizinkannya)

Perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Hanya pemberi persetujuan yang berhasil di-resolve yang dapat menyetujui atau menolak. Pengiriman channel untuk persetujuan exec menyertakan teks perintah - hanya aktifkan `channel` atau `both` di ruang tepercaya.

Terkait: [Persetujuan exec](/id/tools/exec-approvals).

## Perintah slash

Perintah slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dll.) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan mention Matrix milik bot sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa regex mention khusus. Ini membuat bot tetap responsif terhadap posting bergaya ruang `@mention /command` yang dikeluarkan Element dan klien serupa ketika pengguna menggunakan pelengkapan tab pada bot sebelum mengetik perintah.

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

- Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali akun menggantinya.
- Batasi entri ruang yang diwarisi ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` dibagikan di seluruh akun; `account: "default"` tetap berfungsi ketika akun default dikonfigurasi di tingkat atas.

**Pemilihan akun default:**

- Atur `defaultAccount` untuk memilih akun bernama yang diprioritaskan oleh perutean implisit, probing, dan perintah CLI.
- Jika Anda memiliki beberapa akun dan salah satunya secara literal bernama `default`, OpenClaw menggunakannya secara implisit bahkan ketika `defaultAccount` tidak diatur.
- Jika Anda memiliki beberapa akun bernama dan tidak ada default yang dipilih, perintah CLI menolak menebak - atur `defaultAccount` atau teruskan `--account <id>`.
- Blok `channels.matrix.*` tingkat atas hanya diperlakukan sebagai akun implisit `default` ketika autentikasinya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang di-cache mencakup autentikasi.

**Promosi:**

- Ketika OpenClaw mempromosikan konfigurasi satu akun menjadi multi-akun selama perbaikan atau penyiapan, OpenClaw mempertahankan akun bernama yang sudah ada jika ada atau `defaultAccount` sudah menunjuk ke salah satunya. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan; kunci kebijakan pengiriman bersama tetap berada di tingkat atas.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit memilih ikut serta per akun.

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

Pilihan eksplisit ini hanya mengizinkan target privat/internal tepercaya. Homeserver teks-jelas publik seperti
`http://matrix.example.org:8008` tetap diblokir. Utamakan `https://` bila memungkinkan.

## Meneruskan lalu lintas Matrix melalui proxy

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
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas Matrix saat runtime dan pemeriksaan status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target ruangan atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Ruangan: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID ruangan Matrix peka huruf besar/kecil. Gunakan kapitalisasi ID ruangan yang persis dari Matrix
saat mengonfigurasi target pengiriman eksplisit, pekerjaan cron, binding, atau allowlist.
OpenClaw menyimpan kunci sesi internal secara kanonis untuk penyimpanan, sehingga kunci berhuruf kecil tersebut
bukan sumber yang andal untuk ID pengiriman Matrix.

Pencarian direktori langsung menggunakan akun Matrix yang sedang masuk:

- Pencarian pengguna mengkueri direktori pengguna Matrix pada homeserver tersebut.
- Pencarian ruangan menerima ID ruangan dan alias eksplisit secara langsung. Pencarian nama ruangan yang telah digabung bersifat upaya terbaik dan hanya berlaku untuk allowlist ruangan saat runtime ketika `dangerouslyAllowNameMatching: true` ditetapkan.
- Jika nama ruangan tidak dapat diresolusikan menjadi ID atau alias, nama tersebut diabaikan oleh resolusi allowlist saat runtime.

## Referensi konfigurasi

Kolom pengguna bergaya allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Entri pengguna non-ID diabaikan secara default. Jika Anda menetapkan `dangerouslyAllowNameMatching: true`, kecocokan persis nama tampilan direktori Matrix diresolusikan saat startup dan setiap kali allowlist berubah ketika monitor sedang berjalan; entri yang tidak dapat diresolusikan diabaikan saat runtime.

Kunci allowlist ruangan (`groups`, `rooms` lama) sebaiknya berupa ID ruangan atau alias. Kunci nama ruangan biasa diabaikan secara default; `dangerouslyAllowNameMatching: true` memulihkan pencarian upaya terbaik terhadap nama ruangan yang telah digabung.

### Akun dan koneksi

- `enabled`: mengaktifkan atau menonaktifkan channel.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun pilihan ketika beberapa akun Matrix dikonfigurasi.
- `accounts`: penimpaan bernama per akun. Nilai `channels.matrix` tingkat atas diwarisi sebagai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: mengizinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau hostname internal.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Penimpaan per akun didukung.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: token akses untuk autentikasi berbasis token. Nilai teks biasa dan SecretRef didukung di seluruh penyedia env/file/exec ([Manajemen Rahasia](/id/gateway/secrets)).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai teks biasa dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat login dengan kata sandi.
- `avatarUrl`: URL avatar diri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum peristiwa yang diambil selama sinkronisasi startup.

### Enkripsi

- `encryption`: mengaktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default ketika E2EE aktif) atau `"off"`. Secara otomatis meminta verifikasi diri saat startup ketika perangkat ini belum diverifikasi.
- `startupVerificationCooldownHours`: cooldown sebelum permintaan startup otomatis berikutnya. Default: `24`.

### Akses dan kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas ruangan.
- `dm.enabled`: ketika `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan ruangan sebagai DM; ini tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: allowlist ID pengguna untuk lalu lintas DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: penimpaan khusus DM untuk threading balasan (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: menerima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: ketika `true`, memaksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `dangerouslyAllowNameMatching`: ketika `true`, mengizinkan pencarian direktori nama tampilan Matrix untuk entri allowlist pengguna dan pencarian nama ruangan yang telah digabung untuk kunci allowlist ruangan. Utamakan ID `@user:server` lengkap serta ID ruangan atau alias.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: ruangan/alias yang diizinkan ketika `autoJoin` adalah `"allowlist"`. Entri alias diresolusikan terhadap homeserver, bukan terhadap status yang diklaim oleh ruangan yang mengundang.
- `contextVisibility`: visibilitas konteks tambahan (default `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Perilaku balasan

- `replyToMode`: `"off"`, `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, atau `"always"`.
- `threadBindings`: penimpaan per channel untuk perutean sesi yang terikat thread dan siklus hidupnya.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, atau bentuk objek `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: ketika `true`, blok asisten yang selesai disimpan sebagai pesan progres terpisah.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks keluar.
- `responsePrefix`: string opsional yang ditambahkan di awal balasan keluar.
- `textChunkLimit`: ukuran potongan keluar dalam karakter ketika `chunkMode: "length"`. Default: `4000`.
- `chunkMode`: `"length"` (default, membagi berdasarkan jumlah karakter) atau `"newline"` (membagi pada batas baris).
- `historyLimit`: jumlah pesan ruangan terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruangan memicu agen. Kembali ke `messages.groupChat.historyLimit`; default efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan masuk.

### Pengaturan reaksi

- `ackReaction`: penimpaan reaksi ack untuk channel/akun ini.
- `ackReactionScope`: penimpaan cakupan (default `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi masuk (default `"own"`, `"off"`).

### Tooling dan penimpaan per ruangan

- `actions`: gating alat per tindakan (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per ruangan. Identitas sesi menggunakan ID ruangan stabil setelah resolusi. (`rooms` adalah alias lama.)
  - `groups.<room>.account`: membatasi satu entri ruangan yang diwarisi ke akun tertentu.
  - `groups.<room>.allowBots`: penimpaan per ruangan untuk pengaturan tingkat channel (`true` atau `"mentions"`).
  - `groups.<room>.users`: allowlist pengirim per ruangan.
  - `groups.<room>.tools`: penimpaan izin/tolak alat per ruangan.
  - `groups.<room>.autoReply`: penimpaan gating mention per ruangan. `true` menonaktifkan persyaratan mention untuk ruangan tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter skill per ruangan.
  - `groups.<room>.systemPrompt`: cuplikan prompt sistem per ruangan.

### Pengaturan persetujuan exec

- `execApprovals.enabled`: mengirim persetujuan exec melalui prompt native Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui. Kembali ke `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (default), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist agen/sesi opsional untuk pengiriman.

## Terkait

- [Ikhtisar Channel](/id/channels) - semua channel yang didukung
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) - perilaku chat grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan hardening
