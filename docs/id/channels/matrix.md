---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE Matrix dan verifikasi
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matriks
x-i18n:
    generated_at: "2026-05-06T09:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix adalah Plugin kanal yang dapat diunduh untuk OpenClaw.
Ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, ruang, utas, media, reaksi, jajak pendapat, lokasi, dan E2EE.

## Instal

Instal Matrix sebelum mengonfigurasi kanal:

```bash
openclaw plugins install @openclaw/matrix
```

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

`channels.matrix.autoJoin` default-nya adalah `off`. Dengan default tersebut, bot tidak akan muncul di ruang atau DM baru dari undangan baru sampai Anda bergabung secara manual.

OpenClaw tidak dapat mengetahui pada saat undangan apakah ruang yang diundang adalah DM atau grup, jadi semua undangan - termasuk undangan bergaya DM - melewati `autoJoin` terlebih dahulu. `dm.policy` hanya berlaku kemudian, setelah bot bergabung dan ruang telah diklasifikasikan.

<Warning>
Tetapkan `autoJoin: "allowlist"` plus `autoJoinAllowlist` untuk membatasi undangan mana yang diterima bot, atau `autoJoin: "always"` untuk menerima setiap undangan.

`autoJoinAllowlist` hanya menerima target stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama ruang biasa ditolak; entri alias diselesaikan terhadap homeserver, bukan terhadap status yang diklaim oleh ruang yang mengundang.
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

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): gunakan `@user:server`. Nama tampilan hanya diselesaikan ketika direktori homeserver mengembalikan tepat satu kecocokan.
- Ruang (`groups`, `autoJoinAllowlist`): gunakan `!room:server` atau `#alias:server`. Nama diselesaikan secara upaya terbaik terhadap ruang yang sudah diikuti; entri yang tidak terselesaikan diabaikan saat runtime.

### Normalisasi ID akun

Wizard mengonversi nama ramah menjadi ID akun yang dinormalisasi. Misalnya, `Ops Bot` menjadi `ops-bot`. Tanda baca di-escape dalam nama env-var berskala agar dua akun tidak dapat bertabrakan: `-` → `_X2D_`, jadi `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

### Kredensial yang di-cache

Matrix menyimpan kredensial yang di-cache di bawah `~/.openclaw/credentials/matrix/`:

- akun default: `credentials.json`
- akun bernama: `credentials-<account>.json`

Ketika kredensial yang di-cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi meskipun token akses tidak ada di file konfigurasi - ini mencakup penyiapan, `openclaw doctor`, dan probe status kanal.

### Variabel lingkungan

Digunakan ketika kunci konfigurasi yang setara tidak disetel. Akun default menggunakan nama tanpa prefiks; akun bernama menggunakan ID akun yang disisipkan sebelum sufiks.

| Akun default          | Akun bernama (`<ID>` adalah ID akun yang dinormalisasi) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Untuk akun `ops`, namanya menjadi `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, dan seterusnya. Env var kunci pemulihan dibaca oleh alur CLI yang sadar pemulihan (`verify backup restore`, `verify device`, `verify bootstrap`) ketika Anda menyalurkan kunci melalui `--recovery-key-stdin`.

`MATRIX_HOMESERVER` tidak dapat disetel dari `.env` workspace; lihat [file `.env` workspace](/id/gateway/security).

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

| `streaming`        | Perilaku                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default)  | Tunggu balasan lengkap, kirim sekali. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                       |
| `"partial"`        | Edit satu pesan teks normal di tempat saat model menulis blok saat ini. Klien Matrix stok dapat memberi notifikasi pada pratinjau pertama, bukan edit final.        |
| `"quiet"`          | Sama seperti `"partial"` tetapi pesannya adalah pemberitahuan yang tidak memicu notifikasi. Penerima hanya mendapat notifikasi setelah aturan push per pengguna cocok dengan edit yang difinalisasi (lihat di bawah). |

`blockStreaming` independen dari `streaming`:

| `streaming`             | `blockStreaming: true`                                                    | `blockStreaming: false` (default)                      |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `"partial"` / `"quiet"` | Draf langsung untuk blok saat ini, blok yang selesai disimpan sebagai pesan | Draf langsung untuk blok saat ini, difinalisasi di tempat |
| `"off"`                 | Satu pesan Matrix yang memberi notifikasi per blok yang selesai           | Satu pesan Matrix yang memberi notifikasi untuk balasan lengkap |

Catatan:

- Jika pratinjau melampaui batas ukuran per-event Matrix, OpenClaw menghentikan streaming pratinjau dan fallback ke pengiriman final saja.
- Balasan media selalu mengirim lampiran secara normal. Jika pratinjau lama tidak lagi dapat digunakan kembali dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media final.
- Pembaruan pratinjau progres alat diaktifkan secara default ketika streaming pratinjau Matrix aktif. Tetapkan `streaming.preview.toolProgress: false` untuk mempertahankan edit pratinjau untuk teks jawaban tetapi membiarkan progres alat pada jalur pengiriman normal.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan `streaming: "off"` jika Anda menginginkan profil rate-limit paling konservatif.

## Metadata persetujuan

Prompt persetujuan native Matrix adalah event `m.room.message` normal dengan konten event kustom khusus OpenClaw di bawah `com.openclaw.approval`. Matrix mengizinkan kunci konten event kustom, jadi klien stok tetap merender body teks sementara klien yang sadar OpenClaw dapat membaca id persetujuan terstruktur, jenis, status, keputusan yang tersedia, dan detail eksekusi/Plugin.

Ketika prompt persetujuan terlalu panjang untuk satu event Matrix, OpenClaw memecah teks yang terlihat menjadi chunk dan melampirkan `com.openclaw.approval` hanya ke chunk pertama. Reaksi untuk keputusan izinkan/tolak terikat ke event pertama tersebut, sehingga prompt panjang mempertahankan target persetujuan yang sama seperti prompt satu event.

### Aturan push self-hosted untuk pratinjau final yang tenang

`streaming: "quiet"` hanya memberi notifikasi kepada penerima setelah blok atau giliran difinalisasi - aturan push per pengguna harus mencocokkan penanda pratinjau yang difinalisasi. Lihat [Aturan push Matrix untuk pratinjau tenang](/id/channels/matrix-push-rules) untuk resep lengkap (token penerima, pemeriksaan pusher, pemasangan aturan, catatan per homeserver).

## Ruang bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi akan diabaikan.

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

- `allowBots: true` menerima pesan dari akun bot Matrix lain yang dikonfigurasi di ruang dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya ketika pesan terlihat menyebut bot ini di ruang. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu ruang.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan sendiri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw memperlakukan "ditulis oleh bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi di Gateway OpenClaw ini".

Gunakan allowlist ruang yang ketat dan persyaratan mention ketika mengaktifkan lalu lintas bot-ke-bot di ruang bersama.

## Enkripsi dan verifikasi

Di ruang terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkap. Ruang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi - Plugin mendeteksi status E2EE secara otomatis.

Semua perintah `openclaw matrix` menerima `--verbose` (diagnostik penuh), `--json` (output yang dapat dibaca mesin), dan `--account <id>` (penyiapan multi-akun). Output ringkas secara default dengan logging SDK internal yang tenang. Contoh di bawah menunjukkan bentuk kanonis; tambahkan flag sesuai kebutuhan.

### Aktifkan enkripsi

```bash
openclaw matrix encryption setup
```

Melakukan bootstrap penyimpanan rahasia dan cross-signing, membuat cadangan kunci ruang jika diperlukan, lalu mencetak status dan langkah berikutnya. Flag yang berguna:

- `--recovery-key <key>` menerapkan recovery key sebelum bootstrap (utamakan bentuk stdin yang didokumentasikan di bawah)
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

- `Locally trusted`: dipercaya hanya oleh klien ini
- `Cross-signing verified`: SDK melaporkan verifikasi melalui cross-signing
- `Signed by owner`: ditandatangani oleh kunci self-signing Anda sendiri (hanya diagnostik)

`Verified by owner` menjadi `yes` hanya ketika `Cross-signing verified` bernilai `yes`. Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup.

`--allow-degraded-local-state` mengembalikan diagnostik upaya terbaik tanpa menyiapkan akun Matrix terlebih dahulu; berguna untuk pemeriksaan offline atau yang dikonfigurasi sebagian.

### Verifikasi perangkat ini dengan recovery key

Recovery key bersifat sensitif - salurkan melalui stdin alih-alih meneruskannya di command line. Atur `MATRIX_RECOVERY_KEY` (atau `MATRIX_<ID>_RECOVERY_KEY` untuk akun bernama):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Perintah melaporkan tiga status:

- `Recovery key accepted`: Matrix menerima kunci untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Backup usable`: cadangan kunci ruang dapat dimuat dengan materi pemulihan tepercaya.
- `Device verified by owner`: perangkat ini memiliki kepercayaan identitas cross-signing Matrix penuh.

Perintah keluar dengan non-zero ketika kepercayaan identitas penuh belum lengkap, meskipun recovery key membuka kunci materi cadangan. Dalam kasus itu, selesaikan verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

`verify self` menunggu `Cross-signing verified: yes` sebelum berhasil keluar. Gunakan `--timeout-ms <ms>` untuk menyesuaikan waktu tunggu.

Bentuk kunci literal `openclaw matrix verify device "<recovery-key>"` juga diterima, tetapi kunci akan tersimpan dalam riwayat shell Anda.

### Bootstrap atau perbaiki cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

- melakukan bootstrap penyimpanan rahasia, memakai ulang recovery key yang ada bila memungkinkan
- melakukan bootstrap cross-signing dan mengunggah kunci publik yang hilang
- menandai dan melakukan cross-sign perangkat saat ini
- membuat cadangan kunci ruang sisi server jika belum ada

Jika homeserver memerlukan UIA untuk mengunggah kunci cross-signing, OpenClaw mencoba tanpa auth terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`).

Flag yang berguna:

- `--recovery-key-stdin` (pasangkan dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) atau `--recovery-key <key>`
- `--force-reset-cross-signing` untuk membuang identitas cross-signing saat ini (hanya jika disengaja)

### Cadangan kunci ruang

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` menampilkan apakah cadangan sisi server ada dan apakah perangkat ini dapat mendekripsinya. `backup restore` mengimpor kunci ruang yang dicadangkan ke crypto store lokal; jika recovery key sudah ada di disk, Anda dapat menghilangkan `--recovery-key-stdin`.

Untuk mengganti cadangan rusak dengan baseline baru (menerima kehilangan riwayat lama yang tidak dapat dipulihkan; juga dapat membuat ulang penyimpanan rahasia jika rahasia cadangan saat ini tidak dapat dimuat):

```bash
openclaw matrix verify backup reset --yes
```

Tambahkan `--rotate-recovery-key` hanya ketika Anda sengaja ingin recovery key sebelumnya berhenti membuka baseline cadangan baru.

### Mencantumkan, meminta, dan merespons verifikasi

```bash
openclaw matrix verify list
```

Mencantumkan permintaan verifikasi tertunda untuk akun yang dipilih.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Mengirim permintaan verifikasi dari akun OpenClaw ini. `--own-user` meminta verifikasi mandiri (Anda menerima prompt di klien Matrix lain milik pengguna yang sama); `--user-id`/`--device-id`/`--room-id` menargetkan orang lain. `--own-user` tidak dapat digabungkan dengan flag penargetan lain.

Untuk penanganan lifecycle tingkat lebih rendah - biasanya saat membayangi permintaan masuk dari klien lain - perintah ini bekerja pada permintaan `<id>` tertentu (dicetak oleh `verify list` dan `verify request`):

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
    Dengan `encryption: true`, `startupVerification` default ke `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikat dan menerapkan cooldown (24 jam secara default). Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan pass bootstrap crypto konservatif yang memakai ulang penyimpanan rahasia dan identitas cross-signing saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan yang dijaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, startup mencatat peringatan dan tetap non-fatal. Perangkat yang sudah ditandatangani pemilik dipertahankan.

    Lihat [Migrasi Matrix](/id/channels/matrix-migration) untuk alur upgrade lengkap.

  </Accordion>

  <Accordion title="Pemberitahuan verifikasi">
    Matrix mengirim pemberitahuan lifecycle verifikasi ke ruang verifikasi DM ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verifikasi dengan emoji"), mulai/selesai, dan detail SAS (emoji/desimal) jika tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia - Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

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

    Untuk auth token, buat access token baru di klien Matrix atau UI admin Anda, lalu perbarui OpenClaw:

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

  <Accordion title="Crypto store">
    E2EE Matrix menggunakan jalur crypto Rust resmi `matrix-js-sdk` dengan `fake-indexeddb` sebagai shim IndexedDB. Status crypto dipertahankan ke `crypto-idb-snapshot.json` (izin file restriktif).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup sync store, crypto store, recovery key, snapshot IDB, binding thread, dan status verifikasi startup. Ketika token berubah tetapi identitas akun tetap sama, OpenClaw memakai ulang root terbaik yang ada sehingga status sebelumnya tetap terlihat.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui profil mandiri Matrix untuk akun yang dipilih:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Anda dapat meneruskan kedua opsi dalam satu panggilan. Matrix menerima URL avatar `mxc://` secara langsung; ketika Anda meneruskan `http://` atau `https://`, OpenClaw mengunggah file terlebih dahulu dan menyimpan URL `mxc://` yang diselesaikan ke `channels.matrix.avatarUrl` (atau override per-akun).

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis dan pengiriman message-tool. Dua knob independen mengontrol perilaku:

### Routing sesi (`sessionScope`)

`dm.sessionScope` menentukan bagaimana ruang DM Matrix dipetakan ke sesi OpenClaw:

- `"per-user"` (default): semua ruang DM dengan peer yang dirutekan sama berbagi satu sesi.
- `"per-room"`: setiap ruang DM Matrix mendapatkan kunci sesi sendiri, bahkan ketika peer-nya sama.

Binding percakapan eksplisit selalu menang atas `sessionScope`, sehingga ruang dan thread yang terikat mempertahankan sesi target pilihannya.

### Threading balasan (`threadReplies`)

`threadReplies` menentukan tempat bot mengirim balasannya:

- `"off"`: balasan berada di tingkat teratas. Pesan masuk ber-thread tetap berada di sesi induk.
- `"inbound"`: balas di dalam thread hanya ketika pesan masuk sudah berada di thread tersebut.
- `"always"`: balas di dalam thread yang berakar pada pesan pemicu; percakapan itu dirutekan melalui sesi berskup thread yang cocok sejak pemicu pertama dan seterusnya.

`dm.threadReplies` mengganti ini hanya untuk DM - misalnya, menjaga thread ruang tetap terisolasi sambil menjaga DM tetap datar.

### Pewarisan thread dan perintah slash

- Pesan berutas masuk menyertakan pesan root utas sebagai konteks agen tambahan.
- Pengiriman message-tool otomatis mewarisi utas Matrix saat ini ketika menargetkan ruang yang sama (atau target pengguna DM yang sama), kecuali `threadId` eksplisit disediakan.
- Penggunaan ulang target pengguna DM hanya berlaku ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal berbasis cakupan pengguna.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat utas semuanya berfungsi di ruang Matrix dan DM.
- `/focus` tingkat atas membuat utas Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSessions` diaktifkan.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam utas Matrix yang sudah ada akan mengikat utas tersebut di tempat.

Ketika OpenClaw mendeteksi ruang DM Matrix bertabrakan dengan ruang DM lain pada sesi bersama yang sama, OpenClaw memposting `m.notice` satu kali di ruang tersebut yang mengarah ke jalan keluar `/focus` dan menyarankan perubahan `dm.sessionScope`. Pemberitahuan hanya muncul ketika pengikatan utas diaktifkan.

## Pengikatan percakapan ACP

Ruang Matrix, DM, dan utas Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, ruang, atau utas yang sudah ada yang ingin terus Anda gunakan.
- Dalam DM atau ruang Matrix tingkat atas, DM/ruang saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang dibuat.
- Di dalam utas Matrix yang sudah ada, `--bind here` mengikat utas saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus pengikatan.

Catatan:

- `--bind here` tidak membuat utas Matrix anak.
- `threadBindings.spawnSessions` mengatur `/acp spawn --thread auto|here`, ketika OpenClaw perlu membuat atau mengikat utas Matrix anak.

### Konfigurasi pengikatan utas

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Pembuatan sesi terikat utas Matrix aktif secara default:

- Atur `threadBindings.spawnSessions: false` untuk memblokir `/focus` tingkat atas dan `/acp spawn --thread auto|here` agar tidak membuat/mengikat utas Matrix.
- Atur `threadBindings.defaultSpawnContext: "isolated"` ketika pembuatan utas subagen native tidak boleh mem-fork transkrip induk.

## Reaksi

Matrix mendukung reaksi keluar, notifikasi reaksi masuk, dan reaksi ack.

Tooling reaksi keluar diatur oleh `channels.matrix.actions.reactions`:

- `react` menambahkan reaksi ke event Matrix.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix.
- `emoji=""` menghapus reaksi milik bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari bot.

**Urutan resolusi** (nilai pertama yang ditentukan menang):

| Pengaturan             | Urutan                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `ackReaction`          | per akun → channel → `messages.ackReaction` → fallback emoji identitas agen     |
| `ackReactionScope`     | per akun → channel → `messages.ackReactionScope` → default `"group-mentions"`   |
| `reactionNotifications` | per akun → channel → default `"own"`                                           |

`reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika menargetkan pesan Matrix yang ditulis bot; `"off"` menonaktifkan event sistem reaksi. Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkan itu sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan ruang terbaru yang disertakan sebagai `InboundHistory` ketika pesan ruang Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- Riwayat ruang Matrix hanya untuk ruang. DM tetap menggunakan riwayat sesi normal.
- Riwayat ruang Matrix hanya pending: OpenClaw menyangga pesan ruang yang belum memicu balasan, lalu membuat snapshot jendela tersebut ketika mention atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di isi masuk utama untuk giliran tersebut.
- Percobaan ulang event Matrix yang sama menggunakan ulang snapshot riwayat asli, bukan bergeser maju ke pesan ruang yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks ruang tambahan seperti teks balasan yang diambil, root utas, dan riwayat pending.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan seperti diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan daftar izin ruang/pengguna aktif.
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

Untuk membisukan DM sepenuhnya sambil menjaga ruang tetap berfungsi, atur `dm.enabled: false`:

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

Lihat [Grup](/id/channels/groups) untuk perilaku gating mention dan daftar izin.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan ulang kode pairing pending yang sama dan dapat mengirim balasan pengingat setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan ruang langsung

Jika status pesan langsung keluar dari sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke ruang solo lama, bukan DM aktif. Periksa pemetaan saat ini untuk peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Kedua perintah menerima `--account <id>` untuk setup multi-akun. Alur perbaikan:

- memprioritaskan DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat mana pun yang saat ini sudah bergabung dengan pengguna tersebut
- membuat ruang langsung baru dan menulis ulang `m.direct` jika tidak ada DM yang sehat

Ini tidak menghapus ruang lama secara otomatis. Ini memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix berikutnya, pemberitahuan verifikasi, dan alur pesan langsung lainnya menargetkan ruang yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native. Konfigurasikan di bawah `channels.matrix.execApprovals` (atau `channels.matrix.accounts.<account>.execApprovals` untuk override per akun):

- `enabled`: mengirim persetujuan melalui prompt native Matrix. Ketika tidak diatur atau `"auto"`, Matrix otomatis aktif setelah setidaknya satu pemberi persetujuan dapat di-resolve. Atur `false` untuk menonaktifkan secara eksplisit.
- `approvers`: ID pengguna Matrix (`@owner:example.org`) yang diizinkan menyetujui permintaan exec. Opsional - fallback ke `channels.matrix.dm.allowFrom`.
- `target`: tempat prompt dikirim. `"dm"` (default) mengirim ke DM pemberi persetujuan; `"channel"` mengirim ke ruang Matrix atau DM asal; `"both"` mengirim ke keduanya.
- `agentFilter` / `sessionFilter`: daftar izin opsional untuk agen/sesi mana yang memicu pengiriman Matrix.

Otorisasi sedikit berbeda antarjenis persetujuan:

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

Perintah slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, dll.) berfungsi langsung di DM. Di ruang, OpenClaw juga mengenali perintah yang diawali dengan mention Matrix milik bot sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa regex mention khusus. Ini menjaga bot tetap responsif terhadap posting gaya ruang `@mention /command` yang dikirim Element dan klien serupa ketika pengguna menyelesaikan tab bot sebelum mengetik perintah.

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

- Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali akun menimpanya.
- Beri cakupan entri ruang yang diwarisi ke akun tertentu dengan `groups.<room>.account`. Entri tanpa `account` dibagikan di semua akun; `account: "default"` tetap berfungsi ketika akun default dikonfigurasi di tingkat atas.

**Pemilihan akun default:**

- Atur `defaultAccount` untuk memilih akun bernama yang diprioritaskan perutean implisit, probing, dan perintah CLI.
- Jika Anda memiliki beberapa akun dan salah satunya secara literal bernama `default`, OpenClaw menggunakannya secara implisit meskipun `defaultAccount` tidak diatur.
- Jika Anda memiliki beberapa akun bernama dan tidak ada default yang dipilih, perintah CLI menolak menebak - atur `defaultAccount` atau berikan `--account <id>`.
- Blok `channels.matrix.*` tingkat atas hanya diperlakukan sebagai akun `default` implisit ketika auth-nya lengkap (`homeserver` + `accessToken`, atau `homeserver` + `userId` + `password`). Akun bernama tetap dapat ditemukan dari `homeserver` + `userId` setelah kredensial yang di-cache mencakup auth.

**Promosi:**

- Ketika OpenClaw mempromosikan konfigurasi satu akun ke multi-akun selama perbaikan atau setup, OpenClaw mempertahankan akun bernama yang sudah ada jika ada atau `defaultAccount` sudah menunjuk ke salah satunya. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan; kunci kebijakan pengiriman bersama tetap di tingkat atas.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
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

Keikutsertaan eksplisit ini hanya mengizinkan target privat/internal tepercaya. Homeserver teks polos publik seperti
`http://matrix.example.org:8008` tetap diblokir. Utamakan `https://` kapan pun memungkinkan.

## Mem-proxy lalu lintas Matrix

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
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas Matrix saat runtime dan pemeriksaan status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target ruang atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Ruang: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID ruang Matrix peka huruf besar-kecil. Gunakan kapitalisasi ID ruang yang persis dari Matrix
saat mengonfigurasi target pengiriman eksplisit, tugas cron, pengikatan, atau daftar izin.
OpenClaw menjaga kunci sesi internal tetap kanonis untuk penyimpanan, sehingga kunci huruf kecil
tersebut bukan sumber yang andal untuk ID pengiriman Matrix.

Pencarian direktori langsung menggunakan akun Matrix yang sedang masuk:

- Pencarian pengguna mengkueri direktori pengguna Matrix di homeserver tersebut.
- Pencarian ruang menerima ID ruang dan alias eksplisit secara langsung, lalu beralih ke pencarian nama ruang yang telah diikuti untuk akun tersebut.
- Pencarian nama ruang yang telah diikuti bersifat upaya terbaik. Jika nama ruang tidak dapat diresolusikan menjadi ID atau alias, nama tersebut diabaikan oleh resolusi daftar izin runtime.

## Referensi konfigurasi

Kolom bergaya daftar izin (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) menerima ID pengguna Matrix lengkap (paling aman). Kecocokan direktori persis diresolusikan saat startup dan setiap kali daftar izin berubah saat monitor berjalan; entri yang tidak dapat diresolusikan diabaikan saat runtime. Daftar izin ruang mengutamakan ID ruang atau alias karena alasan yang sama.

### Akun dan koneksi

- `enabled`: aktifkan atau nonaktifkan kanal.
- `name`: label tampilan opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `accounts`: penimpaan bernama per akun. Nilai `channels.matrix` tingkat atas diwariskan sebagai default.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun ini terhubung ke `localhost`, IP LAN/Tailscale, atau hostname internal.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Penimpaan per akun didukung.
- `userId`: ID pengguna Matrix lengkap (`@bot:example.org`).
- `accessToken`: token akses untuk autentikasi berbasis token. Nilai teks polos dan SecretRef didukung di seluruh penyedia env/file/exec ([Manajemen Rahasia](/id/gateway/secrets)).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai teks polos dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat yang digunakan saat login kata sandi.
- `avatarUrl`: URL avatar mandiri tersimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum peristiwa yang diambil selama sinkronisasi startup.

### Enkripsi

- `encryption`: aktifkan E2EE. Default: `false`.
- `startupVerification`: `"if-unverified"` (default saat E2EE aktif) atau `"off"`. Secara otomatis meminta verifikasi mandiri saat startup ketika perangkat ini belum terverifikasi.
- `startupVerificationCooldownHours`: masa tunggu sebelum permintaan startup otomatis berikutnya. Default: `24`.

### Akses dan kebijakan

- `groupPolicy`: `"open"`, `"allowlist"`, atau `"disabled"`. Default: `"allowlist"`.
- `groupAllowFrom`: daftar izin ID pengguna untuk lalu lintas ruang.
- `dm.enabled`: saat `false`, abaikan semua DM. Default: `true`.
- `dm.policy`: `"pairing"` (default), `"allowlist"`, `"open"`, atau `"disabled"`. Berlaku setelah bot bergabung dan mengklasifikasikan ruang sebagai DM; ini tidak memengaruhi penanganan undangan.
- `dm.allowFrom`: daftar izin ID pengguna untuk lalu lintas DM.
- `dm.sessionScope`: `"per-user"` (default) atau `"per-room"`.
- `dm.threadReplies`: penimpaan khusus DM untuk penguliran balasan (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: terima pesan dari akun bot Matrix lain yang dikonfigurasi (`true` atau `"mentions"`).
- `allowlistOnly`: saat `true`, memaksa semua kebijakan DM aktif (kecuali `"disabled"`) dan kebijakan grup `"open"` menjadi `"allowlist"`. Tidak mengubah kebijakan `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"`, atau `"off"`. Default: `"off"`. Berlaku untuk setiap undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: ruang/alias yang diizinkan saat `autoJoin` bernilai `"allowlist"`. Entri alias diresolusikan terhadap homeserver, bukan terhadap status yang diklaim oleh ruang yang mengundang.
- `contextVisibility`: visibilitas konteks tambahan (default `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Perilaku balasan

- `replyToMode`: `"off"`, `"first"`, `"all"`, atau `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, atau `"always"`.
- `threadBindings`: penimpaan per kanal untuk perutean dan siklus hidup sesi yang terikat utas.
- `streaming`: `"off"` (default), `"partial"`, `"quiet"`, atau bentuk objek `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: saat `true`, blok asisten yang selesai dipertahankan sebagai pesan progres terpisah.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks keluar.
- `responsePrefix`: string opsional yang ditambahkan di awal balasan keluar.
- `textChunkLimit`: ukuran potongan keluar dalam karakter saat `chunkMode: "length"`. Default: `4000`.
- `chunkMode`: `"length"` (default, memisahkan berdasarkan jumlah karakter) atau `"newline"` (memisahkan pada batas baris).
- `historyLimit`: jumlah pesan ruang terbaru yang disertakan sebagai `InboundHistory` saat pesan ruang memicu agen. Beralih ke `messages.groupChat.historyLimit`; default efektif `0` (dinonaktifkan).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan masuk.

### Pengaturan reaksi

- `ackReaction`: penimpaan reaksi ack untuk kanal/akun ini.
- `ackReactionScope`: penimpaan cakupan (default `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: mode notifikasi reaksi masuk (default `"own"`, `"off"`).

### Peralatan dan penimpaan per ruang

- `actions`: pembatasan alat per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: peta kebijakan per ruang. Identitas sesi menggunakan ID ruang stabil setelah resolusi. (`rooms` adalah alias lama.)
  - `groups.<room>.account`: batasi satu entri ruang turunan ke akun tertentu.
  - `groups.<room>.allowBots`: penimpaan per ruang untuk pengaturan tingkat kanal (`true` atau `"mentions"`).
  - `groups.<room>.users`: daftar izin pengirim per ruang.
  - `groups.<room>.tools`: penimpaan izin/tolak alat per ruang.
  - `groups.<room>.autoReply`: penimpaan gating penyebutan per ruang. `true` menonaktifkan persyaratan penyebutan untuk ruang tersebut; `false` memaksanya aktif kembali.
  - `groups.<room>.skills`: filter skill per ruang.
  - `groups.<room>.systemPrompt`: cuplikan prompt sistem per ruang.

### Pengaturan persetujuan exec

- `execApprovals.enabled`: kirim persetujuan exec melalui prompt native Matrix.
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui. Beralih ke `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (default), `"channel"`, atau `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: daftar izin agen/sesi opsional untuk pengiriman.

## Terkait

- [Ringkasan Kanal](/id/channels) - semua kanal yang didukung
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) - perilaku obrolan grup dan gating penyebutan
- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan pengerasan
