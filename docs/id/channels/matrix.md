---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi Matrix E2EE dan verifikasi
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-06T09:15:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06f833bf0ede81bad69f140994c32e8cc5d1635764f95fc5db4fc5dc25f2b85e
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah plugin saluran bawaan Matrix untuk OpenClaw.
Ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

## Plugin bawaan

Matrix dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan pemasangan terpisah.

Jika Anda menggunakan build yang lebih lama atau pemasangan kustom yang mengecualikan Matrix, pasang secara manual:

Pasang dari npm:

```bash
openclaw plugins install @openclaw/matrix
```

Pasang dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Lihat [Plugins](/id/tools/plugin) untuk perilaku plugin dan aturan pemasangan.

## Penyiapan

1. Pastikan plugin Matrix tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Pemasangan lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Matrix di homeserver Anda.
3. Konfigurasikan `channels.matrix` dengan salah satu dari:
   - `homeserver` + `accessToken`, atau
   - `homeserver` + `userId` + `password`.
4. Mulai ulang gateway.
5. Mulai DM dengan bot atau undang bot ke room.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Yang sebenarnya ditanyakan wizard Matrix:

- URL homeserver
- metode auth: access token atau password
- ID pengguna hanya saat Anda memilih auth password
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room Matrix sekarang

Perilaku wizard yang penting:

- Jika variabel env auth Matrix sudah ada untuk akun yang dipilih, dan akun itu belum memiliki auth yang disimpan di config, wizard menawarkan pintasan env dan hanya menulis `enabled: true` untuk akun tersebut.
- Saat Anda menambahkan akun Matrix lain secara interaktif, nama akun yang dimasukkan dinormalisasi menjadi ID akun yang digunakan di config dan variabel env. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Prompt allowlist DM langsung menerima nilai penuh `@user:server`. Nama tampilan hanya berfungsi jika pencarian direktori live menemukan satu kecocokan yang tepat; jika tidak, wizard meminta Anda mencoba lagi dengan ID Matrix lengkap.
- Prompt allowlist room langsung menerima ID room dan alias. Prompt ini juga dapat me-resolve nama room yang sudah bergabung secara live, tetapi nama yang tidak ter-resolve hanya disimpan sebagaimana diketik saat penyiapan dan diabaikan nanti oleh resolusi allowlist runtime. Gunakan `!room:server` atau `#alias:server`.
- Identitas room/sesi runtime menggunakan ID room Matrix yang stabil. Alias yang dideklarasikan room hanya digunakan sebagai input lookup, bukan sebagai kunci sesi jangka panjang atau identitas grup yang stabil.
- Untuk me-resolve nama room sebelum menyimpannya, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

Penyiapan minimal berbasis token:

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

Penyiapan berbasis password (token di-cache setelah login):

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

Matrix menyimpan kredensial yang di-cache di `~/.openclaw/credentials/matrix/`.
Akun default menggunakan `credentials.json`; akun bernama menggunakan `credentials-<account>.json`.
Jika kredensial yang di-cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi untuk penyiapan, doctor, dan penemuan status saluran meskipun auth saat ini tidak diatur langsung di config.

Padanan variabel environment (digunakan ketika kunci config tidak diatur):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Untuk akun non-default, gunakan variabel env yang dicakup per akun:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Contoh untuk akun `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Untuk ID akun yang dinormalisasi `ops-bot`, gunakan:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix melakukan escape tanda baca dalam ID akun agar variabel env bercakup tetap bebas tabrakan.
Misalnya, `-` menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan variabel env ketika variabel env auth tersebut sudah ada dan akun yang dipilih belum memiliki auth Matrix yang disimpan di config.

## Contoh konfigurasi

Ini adalah baseline config praktis dengan pairing DM, allowlist room, dan E2EE diaktifkan:

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
        "!roomid:example.org": {
          requireMention: true,
        },
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

`autoJoin` berlaku untuk undangan Matrix secara umum, bukan hanya undangan room/grup.
Itu mencakup undangan bergaya DM yang baru. Pada saat undangan, OpenClaw tidak dapat mengetahui dengan andal apakah
room yang diundang nantinya akan diperlakukan sebagai DM atau grup, sehingga semua undangan melewati keputusan
`autoJoin` yang sama terlebih dahulu. `dm.policy` tetap berlaku setelah bot bergabung dan room tersebut
diklasifikasikan sebagai DM, jadi `autoJoin` mengendalikan perilaku bergabung sementara `dm.policy` mengendalikan perilaku
balasan/akses.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Atur `channels.matrix.streaming` ke `"partial"` ketika Anda ingin OpenClaw mengirim satu balasan pratinjau live,
mengedit pratinjau tersebut di tempat saat model sedang menghasilkan teks, lalu memfinalkannya ketika
balasan selesai:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` adalah default. OpenClaw menunggu balasan final dan mengirimkannya satu kali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix normal. Ini mempertahankan perilaku notifikasi lawas Matrix yang mengutamakan pratinjau, sehingga klien standar dapat memberi notifikasi pada teks pratinjau streaming pertama alih-alih pada blok yang selesai.
- `streaming: "quiet"` membuat satu pemberitahuan pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi push rule penerima untuk edit pratinjau yang telah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan streaming pratinjau aktif, Matrix mempertahankan draft live untuk blok saat ini dan mempertahankan blok yang sudah selesai sebagai pesan terpisah.
- Saat streaming pratinjau aktif dan `blockStreaming` nonaktif, Matrix mengedit draft live di tempat dan memfinalkan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman final normal.
- Balasan media tetap mengirim lampiran secara normal. Jika pratinjau usang tidak lagi dapat digunakan ulang dengan aman, OpenClaw akan meredaksinya sebelum mengirim balasan media final.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate limit yang paling konservatif.

`blockStreaming` tidak mengaktifkan pratinjau draft dengan sendirinya.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang telah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix standar tanpa push rule kustom, gunakan `streaming: "partial"` untuk perilaku pratinjau-terlebih-dahulu atau biarkan `streaming` nonaktif untuk pengiriman final saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang selesai sebagai pesan Matrix normal yang memicu notifikasi.
- `blockStreaming: false` hanya mengirim balasan final yang telah selesai sebagai pesan Matrix normal yang memicu notifikasi.

### Push rule yang di-hosting sendiri untuk pratinjau final senyap

Jika Anda menjalankan infrastruktur Matrix sendiri dan ingin pratinjau senyap memberi notifikasi hanya saat blok atau
balasan final selesai, atur `streaming: "quiet"` dan tambahkan push rule per pengguna untuk edit pratinjau yang telah difinalkan.

Biasanya ini adalah penyiapan pengguna penerima, bukan perubahan config global homeserver:

Peta cepat sebelum Anda memulai:

- pengguna penerima = orang yang seharusnya menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirim balasan
- gunakan access token pengguna penerima untuk panggilan API di bawah ini
- cocokkan `sender` dalam push rule dengan MXID lengkap pengguna bot

1. Konfigurasikan OpenClaw untuk menggunakan pratinjau senyap:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Pastikan akun penerima sudah menerima notifikasi push Matrix normal. Rule pratinjau senyap
   hanya berfungsi jika pengguna tersebut sudah memiliki pusher/perangkat yang berfungsi.

3. Dapatkan access token pengguna penerima.
   - Gunakan token pengguna penerima, bukan token bot.
   - Menggunakan ulang token sesi klien yang sudah ada biasanya paling mudah.
   - Jika Anda perlu mencetak token baru, Anda dapat login melalui API Client-Server Matrix standar:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Verifikasi bahwa akun penerima sudah memiliki pusher:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jika ini tidak mengembalikan pusher/perangkat aktif, perbaiki notifikasi Matrix normal terlebih dahulu sebelum menambahkan
rule OpenClaw di bawah ini.

OpenClaw menandai edit pratinjau final teks saja dengan:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Buat override push rule untuk setiap akun penerima yang harus menerima notifikasi ini:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Ganti nilai berikut sebelum Anda menjalankan perintah:

- `https://matrix.example.org`: URL dasar homeserver Anda
- `$USER_ACCESS_TOKEN`: access token pengguna penerima
- `openclaw-finalized-preview-botname`: ID rule yang unik untuk bot ini bagi pengguna penerima ini
- `@bot:example.org`: MXID bot Matrix OpenClaw Anda, bukan MXID pengguna penerima

Penting untuk penyiapan multi-bot:

- Push rule dikunci berdasarkan `ruleId`. Menjalankan ulang `PUT` terhadap rule ID yang sama akan memperbarui rule tersebut.
- Jika satu pengguna penerima harus menerima notifikasi untuk beberapa akun bot Matrix OpenClaw, buat satu rule per bot dengan rule ID unik untuk setiap kecocokan sender.
- Pola yang sederhana adalah `openclaw-finalized-preview-<botname>`, seperti `openclaw-finalized-preview-ops` atau `openclaw-finalized-preview-support`.

Rule dievaluasi terhadap pengirim event:

- autentikasi dengan token pengguna penerima
- cocokkan `sender` dengan MXID bot OpenClaw

6. Verifikasi bahwa rule ada:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Uji balasan yang di-stream. Dalam mode senyap, room seharusnya menampilkan pratinjau draft senyap dan
   edit final di tempat seharusnya memberi notifikasi sekali saat blok atau giliran selesai.

Jika Anda perlu menghapus rule nanti, hapus rule ID yang sama dengan token pengguna penerima:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Catatan:

- Buat rule dengan access token pengguna penerima, bukan token bot.
- Rule `override` baru yang didefinisikan pengguna disisipkan sebelum rule penekanan default, jadi tidak diperlukan parameter urutan tambahan.
- Ini hanya memengaruhi edit pratinjau teks saja yang dapat difinalkan OpenClaw dengan aman di tempat. Fallback media dan fallback pratinjau usang tetap menggunakan pengiriman Matrix normal.
- Jika `GET /_matrix/client/v3/pushers` tidak menampilkan pusher, pengguna tersebut belum memiliki pengiriman push Matrix yang berfungsi untuk akun/perangkat ini.

#### Synapse

Untuk Synapse, penyiapan di atas biasanya sudah cukup dengan sendirinya:

- Tidak diperlukan perubahan `homeserver.yaml` khusus untuk notifikasi pratinjau OpenClaw yang telah difinalkan.
- Jika deployment Synapse Anda sudah mengirim notifikasi push Matrix normal, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utamanya.
- Jika Anda menjalankan Synapse di balik reverse proxy atau worker, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar.
- Jika Anda menjalankan worker Synapse, pastikan pusher sehat. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi.

#### Tuwunel

Untuk Tuwunel, gunakan alur penyiapan dan panggilan API push-rule yang sama seperti yang ditampilkan di atas:

- Tidak diperlukan config khusus Tuwunel untuk penanda pratinjau final itu sendiri.
- Jika notifikasi Matrix normal sudah berfungsi untuk pengguna tersebut, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utamanya.
- Jika notifikasi tampak menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini di Tuwunel 1.4.2 pada 12 September 2025, dan opsi ini dapat dengan sengaja menekan push ke perangkat lain saat satu perangkat aktif.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran penuhnya. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

### Room bot ke bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang telah dikonfigurasi diabaikan.

Gunakan `allowBots` ketika Anda memang menginginkan lalu lintas Matrix antar agen:

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

- `allowBots: true` menerima pesan dari akun bot Matrix terkonfigurasi lain di room dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya ketika mereka secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan ke diri sendiri.
- Matrix tidak mengekspos penanda bot bawaan di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi pada gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

Aktifkan enkripsi:

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

Periksa status verifikasi:

```bash
openclaw matrix verify status
```

Status verbose (diagnostik lengkap):

```bash
openclaw matrix verify status --verbose
```

Sertakan recovery key yang tersimpan dalam output yang dapat dibaca mesin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Bootstrap status cross-signing dan verifikasi:

```bash
openclaw matrix verify bootstrap
```

Dukungan multi-akun: gunakan `channels.matrix.accounts` dengan kredensial per akun dan `name` opsional. Lihat [Configuration reference](/id/gateway/configuration-reference#multi-account-all-channels) untuk pola bersama.

Diagnostik bootstrap verbose:

```bash
openclaw matrix verify bootstrap --verbose
```

Paksa reset identitas cross-signing baru sebelum bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verifikasi perangkat ini dengan recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Detail verifikasi perangkat verbose:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Periksa kesehatan backup room-key:

```bash
openclaw matrix verify backup status
```

Diagnostik kesehatan backup verbose:

```bash
openclaw matrix verify backup status --verbose
```

Pulihkan room key dari backup server:

```bash
openclaw matrix verify backup restore
```

Diagnostik pemulihan verbose:

```bash
openclaw matrix verify backup restore --verbose
```

Hapus backup server saat ini dan buat baseline backup baru. Jika backup key yang tersimpan
tidak dapat dimuat dengan bersih, reset ini juga dapat membuat ulang secret storage sehingga
cold start di masa mendatang dapat memuat backup key yang baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` ringkas secara default (termasuk logging SDK internal yang senyap) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat membuat skrip.

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda memberikan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, atur `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` setiap kali Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan kesalahan verifikasi menunjuk ke kunci config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

### Arti "verified"

OpenClaw memperlakukan perangkat Matrix ini sebagai terverifikasi hanya ketika perangkat ini diverifikasi oleh identitas cross-signing Anda sendiri.
Dalam praktiknya, `openclaw matrix verify status --verbose` mengekspos tiga sinyal kepercayaan:

- `Locally trusted`: perangkat ini dipercaya hanya oleh klien saat ini
- `Cross-signing verified`: SDK melaporkan perangkat ini sebagai terverifikasi melalui cross-signing
- `Signed by owner`: perangkat ini ditandatangani oleh self-signing key Anda sendiri

`Verified by owner` menjadi `yes` hanya ketika verifikasi cross-signing atau owner-signing ada.
Kepercayaan lokal saja tidak cukup bagi OpenClaw untuk memperlakukan perangkat sebagai sepenuhnya terverifikasi.

### Apa yang dilakukan bootstrap

`openclaw matrix verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun Matrix terenkripsi.
Perintah ini melakukan semua hal berikut secara berurutan:

- melakukan bootstrap secret storage, menggunakan ulang recovery key yang sudah ada bila memungkinkan
- melakukan bootstrap cross-signing dan mengunggah public cross-signing key yang belum ada
- mencoba menandai dan melakukan cross-sign pada perangkat saat ini
- membuat backup room-key sisi server baru jika belum ada

Jika homeserver memerlukan auth interaktif untuk mengunggah cross-signing key, OpenClaw mencoba unggah tanpa auth terlebih dahulu, lalu dengan `m.login.dummy`, lalu dengan `m.login.password` ketika `channels.matrix.password` dikonfigurasi.

Gunakan `--force-reset-cross-signing` hanya ketika Anda memang ingin membuang identitas cross-signing saat ini dan membuat yang baru.

Jika Anda memang ingin membuang backup room-key saat ini dan memulai baseline backup baru
untuk pesan mendatang, gunakan `openclaw matrix verify backup reset --yes`.
Lakukan ini hanya ketika Anda menerima bahwa riwayat terenkripsi lama yang tidak dapat dipulihkan akan tetap
tidak tersedia dan bahwa OpenClaw mungkin akan membuat ulang secret storage jika secret backup saat ini
tidak dapat dimuat dengan aman.

### Baseline backup baru

Jika Anda ingin menjaga pesan terenkripsi mendatang tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan, jalankan perintah berikut secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Tambahkan `--account <id>` ke setiap perintah bila Anda ingin menargetkan akun Matrix bernama secara eksplisit.

### Perilaku saat startup

Saat `encryption: true`, Matrix secara default mengatur `startupVerification` ke `"if-unverified"`.
Saat startup, jika perangkat ini masih belum terverifikasi, Matrix akan meminta verifikasi diri di klien Matrix lain,
melewati permintaan duplikat saat satu permintaan sudah tertunda, dan menerapkan cooldown lokal sebelum mencoba lagi setelah restart.
Upaya permintaan yang gagal akan dicoba lagi lebih cepat daripada pembuatan permintaan yang berhasil secara default.
Atur `startupVerification: "off"` untuk menonaktifkan permintaan otomatis saat startup, atau sesuaikan `startupVerificationCooldownHours`
jika Anda menginginkan jendela percobaan ulang yang lebih pendek atau lebih panjang.

Startup juga secara otomatis melakukan pass bootstrap crypto yang konservatif.
Pass itu mencoba menggunakan ulang secret storage dan identitas cross-signing saat ini terlebih dahulu, dan menghindari reset cross-signing kecuali Anda menjalankan alur perbaikan bootstrap yang eksplisit.

Jika startup menemukan status bootstrap yang rusak dan `channels.matrix.password` dikonfigurasi, OpenClaw dapat mencoba jalur perbaikan yang lebih ketat.
Jika perangkat saat ini sudah ditandatangani pemilik, OpenClaw mempertahankan identitas tersebut alih-alih meresetnya secara otomatis.

Upgrade dari plugin Matrix publik sebelumnya:

- OpenClaw secara otomatis menggunakan ulang akun Matrix, access token, dan identitas perangkat yang sama bila memungkinkan.
- Sebelum perubahan migrasi Matrix yang dapat ditindaklanjuti dijalankan, OpenClaw membuat atau menggunakan ulang snapshot pemulihan di `~/Backups/openclaw-migrations/`.
- Jika Anda menggunakan beberapa akun Matrix, atur `channels.matrix.defaultAccount` sebelum upgrade dari tata letak flat-store lama agar OpenClaw mengetahui akun mana yang harus menerima status lawas bersama tersebut.
- Jika plugin sebelumnya menyimpan backup key dekripsi room-key Matrix secara lokal, startup atau `openclaw doctor --fix` akan mengimpornya ke alur recovery-key baru secara otomatis.
- Jika access token Matrix berubah setelah migrasi disiapkan, startup sekarang memindai root penyimpanan hash token tetangga untuk status pemulihan lawas yang tertunda sebelum menyerah pada pemulihan backup otomatis.
- Jika access token Matrix berubah nanti untuk akun, homeserver, dan pengguna yang sama, OpenClaw sekarang lebih memilih menggunakan ulang root penyimpanan hash token yang paling lengkap yang ada daripada memulai dari direktori status Matrix kosong.
- Pada startup gateway berikutnya, room key yang sudah dibackup dipulihkan secara otomatis ke crypto store baru.
- Jika plugin lama memiliki room key lokal saja yang tidak pernah dibackup, OpenClaw akan memberi peringatan dengan jelas. Key tersebut tidak dapat diekspor secara otomatis dari rust crypto store sebelumnya, sehingga sebagian riwayat terenkripsi lama mungkin tetap tidak tersedia sampai dipulihkan secara manual.
- Lihat [Matrix migration](/id/install/migrating-matrix) untuk alur upgrade lengkap, batasan, perintah pemulihan, dan pesan migrasi umum.

Status runtime terenkripsi diatur dalam root hash token per akun dan per pengguna di
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Direktori itu berisi sync store (`bot-storage.json`), crypto store (`crypto/`),
file recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
thread binding (`thread-bindings.json`), dan status verifikasi startup (`startup-verification.json`)
saat fitur-fitur tersebut digunakan.
Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan ulang root terbaik yang ada
untuk tuple akun/homeserver/pengguna tersebut sehingga status sync sebelumnya, status crypto, thread binding,
dan status verifikasi startup tetap terlihat.

### Model crypto store Node

Matrix E2EE dalam plugin ini menggunakan jalur Rust crypto `matrix-js-sdk` resmi di Node.
Jalur itu mengharapkan persistensi berbasis IndexedDB jika Anda ingin status crypto bertahan setelah restart.

OpenClaw saat ini menyediakannya di Node dengan cara:

- menggunakan `fake-indexeddb` sebagai shim API IndexedDB yang diharapkan oleh SDK
- memulihkan isi IndexedDB Rust crypto dari `crypto-idb-snapshot.json` sebelum `initRustCrypto`
- menyimpan kembali isi IndexedDB yang diperbarui ke `crypto-idb-snapshot.json` setelah init dan selama runtime
- menserialkan pemulihan dan persistensi snapshot terhadap `crypto-idb-snapshot.json` dengan file lock advisory agar persistensi runtime gateway dan pemeliharaan CLI tidak saling balapan pada file snapshot yang sama

Ini adalah plambing kompatibilitas/penyimpanan, bukan implementasi crypto kustom.
File snapshot adalah status runtime sensitif dan disimpan dengan izin file yang ketat.
Dalam model keamanan OpenClaw, host gateway dan direktori status OpenClaw lokal sudah berada di dalam batas kepercayaan operator, jadi ini terutama merupakan masalah ketahanan operasional, bukan batas kepercayaan jarak jauh yang terpisah.

Peningkatan yang direncanakan:

- menambahkan dukungan SecretRef untuk material key Matrix persisten sehingga recovery key dan secret enkripsi store terkait dapat bersumber dari penyedia secret OpenClaw, bukan hanya file lokal

## Manajemen profil

Perbarui self-profile Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` bila Anda ingin menargetkan akun Matrix bernama secara eksplisit.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda memberikan URL avatar `http://` atau `https://`, OpenClaw mengunggahnya ke Matrix terlebih dahulu dan menyimpan URL `mxc://` yang telah di-resolve kembali ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Pemberitahuan verifikasi otomatis

Matrix sekarang memposting pemberitahuan siklus hidup verifikasi langsung ke room verifikasi DM ketat sebagai pesan `m.notice`.
Ini mencakup:

- pemberitahuan permintaan verifikasi
- pemberitahuan verifikasi siap (dengan panduan eksplisit "Verify by emoji")
- pemberitahuan mulai dan selesai verifikasi
- detail SAS (emoji dan desimal) saat tersedia

Permintaan verifikasi masuk dari klien Matrix lain dilacak dan diterima otomatis oleh OpenClaw.
Untuk alur verifikasi diri, OpenClaw juga memulai alur SAS secara otomatis saat verifikasi emoji tersedia dan mengonfirmasi sisinya sendiri.
Untuk permintaan verifikasi dari pengguna/perangkat Matrix lain, OpenClaw menerima otomatis permintaan tersebut lalu menunggu alur SAS berlanjut secara normal.
Anda tetap perlu membandingkan emoji atau SAS desimal di klien Matrix Anda dan mengonfirmasi "They match" di sana untuk menyelesaikan verifikasi.

OpenClaw tidak menerima otomatis alur duplikat yang dimulai sendiri secara membabi buta. Startup melewati pembuatan permintaan baru saat permintaan verifikasi diri sudah tertunda.

Pemberitahuan protokol/sistem verifikasi tidak diteruskan ke pipeline chat agen, sehingga tidak menghasilkan `NO_REPLY`.

### Kebersihan perangkat

Perangkat Matrix yang dikelola OpenClaw lama dapat menumpuk pada akun dan membuat kepercayaan room terenkripsi lebih sulit dipahami.
Daftarkan dengan:

```bash
openclaw matrix devices list
```

Hapus perangkat OpenClaw yang dikelola dan sudah usang dengan:

```bash
openclaw matrix devices prune-stale
```

### Perbaikan Room Direct

Jika status direct-message keluar dari sinkronisasi, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke room solo lama alih-alih DM yang aktif. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Perbaikan menjaga logika khusus Matrix tetap di dalam plugin:

- ini lebih memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- jika tidak, ini kembali ke DM 1:1 ketat mana pun dengan pengguna tersebut yang saat ini sudah bergabung
- jika tidak ada DM sehat, ini membuat room direct baru dan menulis ulang `m.direct` agar menunjuk ke sana

Alur perbaikan tidak menghapus room lama secara otomatis. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lainnya kembali menargetkan room yang benar.

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis maupun pengiriman alat pesan.

- `dm.sessionScope: "per-user"` (default) menjaga perutean DM Matrix tetap bercakup pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya ter-resolve ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke kunci sesinya sendiri sambil tetap menggunakan auth DM normal dan pemeriksaan allowlist.
- Binding percakapan Matrix eksplisit tetap lebih diutamakan dibanding `dm.sessionScope`, sehingga room dan thread yang di-bind mempertahankan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap top-level dan menjaga pesan threaded masuk pada sesi parent.
- `threadReplies: "inbound"` membalas di dalam thread hanya ketika pesan masuk memang sudah berada di thread itu.
- `threadReplies: "always"` menjaga balasan room di thread yang berakar pada pesan pemicu dan merutekan percakapan itu melalui sesi bercakup thread yang cocok dari pesan pemicu pertama.
- `dm.threadReplies` menimpa pengaturan top-level hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan threaded masuk menyertakan pesan root thread sebagai konteks agen tambahan.
- Pengiriman alat pesan sekarang otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM dengan sesi yang sama hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean bercakup pengguna normal.
- Saat OpenClaw melihat room DM Matrix bertabrakan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room itu dengan escape hatch `/focus` saat thread binding diaktifkan dan petunjuk `dm.sessionScope`.
- Runtime thread binding didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread kini berfungsi di room dan DM Matrix.
- `/focus` top-level di room/DM Matrix membuat thread Matrix baru dan mengikatnya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan mengikat thread saat ini tersebut.

## ACP conversation bindings

Room, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM, room, atau thread Matrix yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau room Matrix tingkat atas, DM/room saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam thread Matrix yang sudah ada, `--bind here` mengikat thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat child thread Matrix.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau mengikat child thread Matrix.

### Config Thread Binding

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per saluran:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat-thread Matrix bersifat opt-in:

- Atur `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` top-level membuat dan mengikat thread Matrix baru.
- Atur `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` mengikat sesi ACP ke thread Matrix.

## Reaksi

Matrix mendukung aksi reaksi keluar, notifikasi reaksi masuk, dan reaksi ack masuk.

- Tooling reaksi keluar dikendalikan oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaksi ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaksi milik akun bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari akun bot.

Cakupan reaksi ack di-resolve dalam urutan standar OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen

Cakupan scope reaksi ack di-resolve dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaksi di-resolve dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku saat ini:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi masih belum disintesis menjadi event sistem karena Matrix menampilkan itu sebagai redaksi, bukan penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` ketika pesan room Matrix memicu agen.
- Ini fallback ke `messages.groupChat.historyLimit`. Jika keduanya tidak diatur, default efektifnya adalah `0`, sehingga pesan room yang dipicu mention tidak dibuffer. Atur `0` untuk menonaktifkan.
- Riwayat room Matrix hanya untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw membuffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela itu ketika mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan itu tetap berada di body masuk utama untuk giliran tersebut.
- Percobaan ulang event Matrix yang sama menggunakan ulang snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks room tambahan seperti teks balasan yang diambil, root thread, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna yang aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari pengaturan `groupPolicy`, `groups`, `groupAllowFrom`, dan kebijakan DM.

## Contoh kebijakan DM dan room

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Lihat [Groups](/id/channels/groups) untuk perilaku pembatasan mention dan allowlist.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan ulang kode pairing tertunda yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih mencetak kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan exec untuk sebuah akun Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan exec native ketika `enabled` tidak diatur atau `"auto"` dan setidaknya satu approver dapat di-resolve, baik dari `execApprovals.approvers` maupun dari `channels.matrix.dm.allowFrom`. Atur `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan akan fallback ke rute persetujuan lain yang dikonfigurasi atau kebijakan fallback persetujuan exec.

Perutean native Matrix saat ini hanya untuk exec:

- `channels.matrix.execApprovals.*` mengontrol perutean DM/channel native untuk persetujuan exec saja.
- Persetujuan plugin tetap menggunakan `/approve` same-chat bersama ditambah forwarding `approvals.plugin` yang dikonfigurasi.
- Matrix tetap dapat menggunakan ulang `channels.matrix.dm.allowFrom` untuk otorisasi persetujuan plugin ketika approver dapat diinferensikan dengan aman, tetapi tidak mengekspos jalur fanout DM/channel persetujuan plugin native yang terpisah.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Prompt persetujuan Matrix menanam pintasan reaksi pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = izinkan selalu ketika keputusan itu diizinkan oleh kebijakan exec efektif

Approver dapat bereaksi pada pesan itu atau menggunakan perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang di-resolve yang dapat menyetujui atau menolak. Pengiriman saluran menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Prompt persetujuan Matrix menggunakan ulang planner persetujuan inti bersama. Permukaan native khusus Matrix hanyalah transport untuk persetujuan exec: perutean room/DM dan perilaku kirim/perbarui/hapus pesan.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Exec approvals](/id/tools/exec-approvals)

## Contoh multi-akun

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

Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali akun menimpanya.
Anda dapat mencakup entri room yang diwarisi ke satu akun Matrix dengan `groups.<room>.account` (atau `rooms.<room>.account` lawas).
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi ketika akun default dikonfigurasi langsung di `channels.matrix.*` tingkat atas.
Default auth bersama parsial tidak dengan sendirinya membuat akun default implisit yang terpisah. OpenClaw hanya mensintesis akun `default` tingkat atas ketika default tersebut memiliki auth baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama masih dapat tetap dapat ditemukan dari `homeserver` plus `userId` ketika kredensial yang di-cache memenuhi auth nanti.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang sudah ada, promosi perbaikan/penyiapan dari akun tunggal ke multi-akun mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap di tingkat atas.
Atur `defaultAccount` ketika Anda ingin OpenClaw lebih memilih satu akun Matrix bernama untuk perutean implisit, probing, dan operasi CLI.
Jika Anda mengonfigurasi beberapa akun bernama, atur `defaultAccount` atau berikan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Berikan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` ketika Anda ingin menimpa pemilihan implisit tersebut untuk satu perintah.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit melakukan opt-in per akun.

Jika homeserver Anda berjalan di localhost, IP LAN/Tailscale, atau hostname internal, aktifkan
`allowPrivateNetwork` untuk akun Matrix tersebut:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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
`http://matrix.example.org:8008` tetap diblokir. Gunakan `https://` bila memungkinkan.

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
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas Matrix runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

Pencarian direktori live menggunakan akun Matrix yang sudah login:

- Lookup pengguna menanyakan direktori pengguna Matrix pada homeserver tersebut.
- Lookup room langsung menerima ID room dan alias eksplisit, lalu fallback ke pencarian nama room yang sudah bergabung untuk akun tersebut.
- Lookup nama room yang sudah bergabung bersifat best-effort. Jika nama room tidak dapat di-resolve ke ID atau alias, nama itu diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: aktifkan atau nonaktifkan saluran.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun yang dipilih ketika beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `allowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini ketika homeserver me-resolve ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat menimpa default tingkat atas dengan `proxy` mereka sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk auth berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh penyedia env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar diri yang tersimpan untuk sinkronisasi profil dan pembaruan `set-profile`.
- `initialSyncLimit`: batas event sync saat startup.
- `encryption`: aktifkan E2EE.
- `allowlistOnly`: paksa perilaku hanya-allowlist untuk DM dan room.
- `allowBots`: izinkan pesan dari akun Matrix OpenClaw lain yang terkonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room.
- Entri `groupAllowFrom` harus berupa ID pengguna Matrix lengkap. Nama yang tidak ter-resolve diabaikan saat runtime.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, atau `all`.
- `markdown`: konfigurasi render Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `partial`, `quiet`, `true`, atau `false`. `partial` dan `true` mengaktifkan pembaruan draft pratinjau-terlebih-dahulu dengan pesan teks Matrix normal. `quiet` menggunakan pemberitahuan pratinjau non-notifikasi untuk penyiapan push-rule yang di-hosting sendiri.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang sudah selesai saat streaming draft pratinjau aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per saluran untuk perutean dan siklus hidup sesi terikat-thread.
- `startupVerification`: mode permintaan verifikasi diri otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba lagi permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar.
- `chunkMode`: `length` atau `newline`.
- `responsePrefix`: prefiks pesan opsional untuk balasan keluar.
- `ackReaction`: override reaksi ack opsional untuk saluran/akun ini.
- `ackReactionScope`: override cakupan reaksi ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk penanganan media Matrix. Ini berlaku untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan auto-join undangan (`always`, `allowlist`, `off`). Default: `off`. Ini berlaku untuk undangan Matrix secara umum, termasuk undangan bergaya DM, bukan hanya undangan room/grup. OpenClaw membuat keputusan ini pada saat undangan, sebelum dapat mengklasifikasikan room yang digabungkan secara andal sebagai DM atau grup.
- `autoJoinAllowlist`: room/alias yang diizinkan ketika `autoJoin` adalah `allowlist`. Entri alias di-resolve ke ID room selama penanganan undangan; OpenClaw tidak mempercayai status alias yang diklaim oleh room yang mengundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan di-auto-join.
- Entri `dm.allowFrom` harus berupa ID pengguna Matrix lengkap kecuali Anda sudah me-resolve-nya melalui pencarian direktori live.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix menyimpan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Ini menimpa pengaturan `threadReplies` tingkat atas untuk penempatan balasan dan isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui permintaan exec. Opsional ketika `dm.allowFrom` sudah mengidentifikasi approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override per akun bernama. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per room. Gunakan ID room atau alias; nama room yang tidak ter-resolve diabaikan saat runtime. Identitas sesi/grup menggunakan ID room yang stabil setelah resolusi, sementara label yang mudah dibaca manusia tetap berasal dari nama room.
- `groups.<room>.account`: batasi satu entri room yang diwarisi ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot yang dikonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per room.
- `groups.<room>.tools`: override allow/deny tool per room.
- `groups.<room>.autoReply`: override pembatasan mention tingkat room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill opsional tingkat room.
- `groups.<room>.systemPrompt`: cuplikan system prompt opsional tingkat room.
- `rooms`: alias lawas untuk `groups`.
- `actions`: gating tool per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Channels Overview](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan penguatan
