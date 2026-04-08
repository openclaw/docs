---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi Matrix E2EE dan verifikasi
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-08T02:16:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec926df79a41fa296d63f0ec7219d0f32e075628d76df9ea490e93e4c5030f83
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah plugin channel bundel Matrix untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaction, polling, lokasi, dan E2EE.

## Plugin bundel

Matrix dikirim sebagai plugin bundel di rilis OpenClaw saat ini, jadi build paket normal
tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Matrix, instal
secara manual:

Instal dari npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Lihat [Plugins](/id/tools/plugin) untuk perilaku plugin dan aturan instalasi.

## Penyiapan

1. Pastikan plugin Matrix tersedia.
   - Rilis OpenClaw paket saat ini sudah membundelnya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Matrix di homeserver Anda.
3. Konfigurasikan `channels.matrix` dengan salah satu dari:
   - `homeserver` + `accessToken`, atau
   - `homeserver` + `userId` + `password`.
4. Mulai ulang gateway.
5. Mulai DM dengan bot atau undang bot ke room.
   - Undangan Matrix baru hanya berfungsi ketika `channels.matrix.autoJoin` mengizinkannya.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Yang sebenarnya ditanyakan wizard Matrix:

- URL homeserver
- metode auth: access token atau password
- ID pengguna hanya ketika Anda memilih auth password
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room Matrix sekarang
- apakah akan mengonfigurasi auto-join undangan Matrix sekarang
- saat auto-join undangan diaktifkan, apakah harus `allowlist`, `always`, atau `off`

Perilaku wizard yang penting:

- Jika env var auth Matrix sudah ada untuk akun yang dipilih, dan akun itu belum memiliki auth yang disimpan di config, wizard menawarkan pintasan env agar penyiapan dapat menyimpan auth di env vars alih-alih menyalin secret ke config.
- Saat Anda menambahkan akun Matrix lain secara interaktif, nama akun yang dimasukkan dinormalisasi menjadi ID akun yang digunakan di config dan env vars. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Prompt allowlist DM langsung menerima nilai `@user:server` lengkap. Nama tampilan hanya berfungsi ketika pencarian direktori langsung menemukan satu kecocokan yang persis; jika tidak, wizard meminta Anda mencoba lagi dengan ID Matrix lengkap.
- Prompt allowlist room menerima ID room dan alias secara langsung. Prompt ini juga dapat menyelesaikan nama room yang sudah diikuti secara live, tetapi nama yang tidak terselesaikan hanya disimpan sebagaimana diketik selama penyiapan dan diabaikan nanti oleh resolusi allowlist saat runtime. Gunakan `!room:server` atau `#alias:server`.
- Wizard sekarang menampilkan peringatan eksplisit sebelum langkah auto-join undangan karena `channels.matrix.autoJoin` default-nya adalah `off`; agen tidak akan bergabung ke room yang diundang atau undangan gaya DM baru kecuali Anda mengaturnya.
- Dalam mode allowlist auto-join undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Identitas room/sesi runtime menggunakan ID room Matrix yang stabil. Alias yang dideklarasikan room hanya digunakan sebagai input pencarian, bukan sebagai kunci sesi jangka panjang atau identitas grup yang stabil.
- Untuk menyelesaikan nama room sebelum menyimpannya, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` default-nya adalah `off`.

Jika Anda membiarkannya tidak diatur, bot tidak akan bergabung ke room yang diundang atau undangan gaya DM baru, sehingga bot tidak akan muncul di grup baru atau DM undangan kecuali Anda bergabung secara manual terlebih dahulu.

Setel `autoJoin: "allowlist"` bersama `autoJoinAllowlist` untuk membatasi undangan mana yang diterima, atau setel `autoJoin: "always"` jika Anda ingin bot bergabung ke setiap undangan.

Dalam mode `allowlist`, `autoJoinAllowlist` hanya menerima `!roomId:server`, `#alias:server`, atau `*`.
</Warning>

Contoh allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Gabung ke setiap undangan:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

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

Matrix menyimpan kredensial cache di `~/.openclaw/credentials/matrix/`.
Akun default menggunakan `credentials.json`; akun bernama menggunakan `credentials-<account>.json`.
Ketika kredensial cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi untuk penyiapan, doctor, dan penemuan status channel meskipun auth saat ini tidak disetel langsung di config.

Padanan env var (digunakan ketika key config tidak disetel):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Untuk akun non-default, gunakan env vars dengan cakupan akun:

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

Matrix melakukan escape pada tanda baca di ID akun agar env vars bercakupan tetap bebas tabrakan.
Misalnya, `-` menjadi `_X2D_`, jadi `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var ketika env vars auth tersebut sudah ada dan akun yang dipilih belum memiliki auth Matrix yang disimpan di config.

## Contoh konfigurasi

Ini adalah config baseline praktis dengan pairing DM, allowlist room, dan E2EE diaktifkan:

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
Itu mencakup undangan gaya DM baru. Pada saat undangan, OpenClaw tidak dapat mengetahui secara andal apakah
room yang diundang pada akhirnya akan diperlakukan sebagai DM atau grup, jadi semua undangan melalui keputusan
`autoJoin` yang sama terlebih dahulu. `dm.policy` tetap berlaku setelah bot bergabung dan room
diklasifikasikan sebagai DM, jadi `autoJoin` mengontrol perilaku bergabung sementara `dm.policy` mengontrol perilaku
balasan/akses.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Setel `channels.matrix.streaming` ke `"partial"` ketika Anda ingin OpenClaw mengirim satu balasan
pratinjau langsung, mengedit pratinjau itu di tempat saat model sedang menghasilkan teks, lalu memfinalkannya saat
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

- `streaming: "off"` adalah default. OpenClaw menunggu balasan akhir lalu mengirimkannya satu kali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix normal. Ini mempertahankan perilaku notifikasi pratinjau-dulu Matrix lama, sehingga klien bawaan dapat mengirim notifikasi pada teks pratinjau streaming pertama, bukan blok yang sudah selesai.
- `streaming: "quiet"` membuat satu pemberitahuan pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya ketika Anda juga mengonfigurasi aturan push penerima untuk edit pratinjau yang sudah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan streaming pratinjau diaktifkan, Matrix menyimpan draft live untuk blok saat ini dan mempertahankan blok yang sudah selesai sebagai pesan terpisah.
- Saat streaming pratinjau aktif dan `blockStreaming` nonaktif, Matrix mengedit draft live di tempat dan memfinalkan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman akhir normal.
- Balasan media tetap mengirim lampiran seperti biasa. Jika pratinjau usang tidak lagi dapat digunakan kembali dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media akhir.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate limit yang paling konservatif.

`blockStreaming` tidak mengaktifkan pratinjau draft dengan sendirinya.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang sudah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa aturan push kustom, gunakan `streaming: "partial"` untuk perilaku pratinjau-dulu atau biarkan `streaming` nonaktif untuk pengiriman akhir saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang selesai sebagai pesan Matrix normal yang memicu notifikasi.
- `blockStreaming: false` hanya mengirim balasan akhir yang sudah selesai sebagai pesan Matrix normal yang memicu notifikasi.

### Aturan push self-hosted untuk pratinjau final yang senyap

Jika Anda menjalankan infrastruktur Matrix sendiri dan ingin pratinjau senyap hanya memicu notifikasi saat blok atau
balasan akhir selesai, setel `streaming: "quiet"` dan tambahkan aturan push per pengguna untuk edit pratinjau yang sudah difinalkan.

Biasanya ini adalah penyiapan pengguna penerima, bukan perubahan config global homeserver:

Peta singkat sebelum memulai:

- pengguna penerima = orang yang seharusnya menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirim balasan
- gunakan access token pengguna penerima untuk panggilan API di bawah
- cocokkan `sender` dalam aturan push dengan MXID lengkap pengguna bot

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

2. Pastikan akun penerima sudah menerima notifikasi push Matrix normal. Aturan
   pratinjau senyap hanya berfungsi jika pengguna tersebut sudah memiliki pusher/perangkat yang berfungsi.

3. Dapatkan access token pengguna penerima.
   - Gunakan token pengguna penerima, bukan token bot.
   - Menggunakan ulang token sesi klien yang ada biasanya paling mudah.
   - Jika Anda perlu membuat token baru, Anda dapat login melalui API Client-Server Matrix standar:

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
aturan OpenClaw di bawah.

OpenClaw menandai edit pratinjau final teks-saja dengan:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Buat aturan push override untuk setiap akun penerima yang harus menerima notifikasi ini:

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

Ganti nilai ini sebelum Anda menjalankan perintah:

- `https://matrix.example.org`: URL dasar homeserver Anda
- `$USER_ACCESS_TOKEN`: access token pengguna penerima
- `openclaw-finalized-preview-botname`: rule ID yang unik untuk bot ini bagi pengguna penerima ini
- `@bot:example.org`: MXID bot Matrix OpenClaw Anda, bukan MXID pengguna penerima

Penting untuk penyiapan multi-bot:

- Aturan push menggunakan `ruleId` sebagai key. Menjalankan ulang `PUT` terhadap rule ID yang sama akan memperbarui satu aturan tersebut.
- Jika satu pengguna penerima harus menerima notifikasi untuk beberapa akun bot Matrix OpenClaw, buat satu aturan per bot dengan rule ID unik untuk setiap kecocokan sender.
- Pola sederhana adalah `openclaw-finalized-preview-<botname>`, seperti `openclaw-finalized-preview-ops` atau `openclaw-finalized-preview-support`.

Aturan dievaluasi terhadap pengirim event:

- autentikasi dengan token pengguna penerima
- cocokkan `sender` dengan MXID bot OpenClaw

6. Verifikasi bahwa aturan ada:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Uji balasan streaming. Dalam mode senyap, room harus menampilkan pratinjau draft senyap dan edit akhir
   di tempat harus memicu notifikasi saat blok atau giliran selesai.

Jika Anda perlu menghapus aturan nanti, hapus rule ID yang sama itu dengan token pengguna penerima:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Catatan:

- Buat aturan dengan access token pengguna penerima, bukan token bot.
- Aturan `override` buatan pengguna yang baru dimasukkan di depan aturan penekanan default, jadi tidak perlu parameter urutan tambahan.
- Ini hanya memengaruhi edit pratinjau teks-saja yang dapat difinalkan OpenClaw dengan aman di tempat. Fallback media dan fallback pratinjau usang tetap menggunakan pengiriman Matrix normal.
- Jika `GET /_matrix/client/v3/pushers` tidak menampilkan pusher, pengguna tersebut belum memiliki pengiriman push Matrix yang berfungsi untuk akun/perangkat ini.

#### Synapse

Untuk Synapse, penyiapan di atas biasanya sudah cukup dengan sendirinya:

- Tidak diperlukan perubahan `homeserver.yaml` khusus untuk notifikasi pratinjau OpenClaw final.
- Jika deployment Synapse Anda sudah mengirim notifikasi push Matrix normal, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika Anda menjalankan Synapse di belakang reverse proxy atau worker, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar.
- Jika Anda menjalankan worker Synapse, pastikan pusher sehat. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi.

#### Tuwunel

Untuk Tuwunel, gunakan alur penyiapan dan panggilan API `pushrules` yang sama seperti yang ditunjukkan di atas:

- Tidak diperlukan config khusus Tuwunel untuk marker pratinjau final itu sendiri.
- Jika notifikasi Matrix normal sudah berfungsi untuk pengguna itu, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika notifikasi tampak menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini di Tuwunel 1.4.2 pada 12 September 2025, dan opsi ini dapat dengan sengaja menekan push ke perangkat lain saat satu perangkat sedang aktif.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran penuhnya. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

### Room bot ke bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang telah dikonfigurasi akan diabaikan.

Gunakan `allowBots` ketika Anda memang menginginkan lalu lintas Matrix antar-agen:

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
- `allowBots: "mentions"` hanya menerima pesan tersebut ketika pesan itu secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari user ID Matrix yang sama untuk menghindari loop balasan ke diri sendiri.
- Matrix tidak mengekspos flag bot bawaan di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang telah dikonfigurasi pada gateway OpenClaw ini".

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

Bootstrap cross-signing dan status verifikasi:

```bash
openclaw matrix verify bootstrap
```

Dukungan multi-akun: gunakan `channels.matrix.accounts` dengan kredensial per akun dan `name` opsional. Lihat [Referensi konfigurasi](/id/gateway/configuration-reference#multi-account-all-channels) untuk pola bersama.

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

Hapus backup server saat ini dan buat baseline backup baru. Jika key backup yang tersimpan
tidak dapat dimuat dengan bersih, reset ini juga dapat membuat ulang secret storage sehingga
cold start mendatang dapat memuat key backup yang baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` ringkas secara default (termasuk logging SDK internal yang senyap) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat membuat script.

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda meneruskan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, setel `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` kapan pun Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Ketika enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi menunjuk ke key config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

### Apa arti "verified"

OpenClaw memperlakukan perangkat Matrix ini sebagai terverifikasi hanya ketika perangkat ini diverifikasi oleh identitas cross-signing Anda sendiri.
Dalam praktiknya, `openclaw matrix verify status --verbose` mengekspos tiga sinyal kepercayaan:

- `Locally trusted`: perangkat ini dipercaya hanya oleh klien saat ini
- `Cross-signing verified`: SDK melaporkan perangkat sebagai terverifikasi melalui cross-signing
- `Signed by owner`: perangkat ini ditandatangani oleh self-signing key milik Anda sendiri

`Verified by owner` menjadi `yes` hanya ketika verifikasi cross-signing atau owner-signing ada.
Kepercayaan lokal saja tidak cukup agar OpenClaw memperlakukan perangkat sebagai sepenuhnya terverifikasi.

### Apa yang dilakukan bootstrap

`openclaw matrix verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun Matrix terenkripsi.
Perintah ini melakukan semua hal berikut secara berurutan:

- melakukan bootstrap secret storage, menggunakan kembali recovery key yang ada bila memungkinkan
- melakukan bootstrap cross-signing dan mengunggah public cross-signing keys yang belum ada
- mencoba menandai dan melakukan cross-sign pada perangkat saat ini
- membuat backup room-key sisi server baru jika belum ada

Jika homeserver memerlukan auth interaktif untuk mengunggah cross-signing keys, OpenClaw mencoba pengunggahan tanpa auth terlebih dahulu, lalu dengan `m.login.dummy`, lalu dengan `m.login.password` saat `channels.matrix.password` dikonfigurasi.

Gunakan `--force-reset-cross-signing` hanya ketika Anda memang ingin membuang identitas cross-signing saat ini dan membuat yang baru.

Jika Anda memang ingin membuang backup room-key saat ini dan memulai baseline backup baru
untuk pesan di masa mendatang, gunakan `openclaw matrix verify backup reset --yes`.
Lakukan ini hanya jika Anda menerima bahwa riwayat terenkripsi lama yang tidak dapat dipulihkan akan tetap
tidak tersedia dan bahwa OpenClaw mungkin membuat ulang secret storage jika secret backup saat ini
tidak dapat dimuat dengan aman.

### Baseline backup baru

Jika Anda ingin menjaga pesan terenkripsi di masa depan tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Tambahkan `--account <id>` ke setiap perintah ketika Anda ingin menargetkan akun Matrix bernama secara eksplisit.

### Perilaku startup

Saat `encryption: true`, Matrix default `startupVerification` ke `"if-unverified"`.
Saat startup, jika perangkat ini masih belum terverifikasi, Matrix akan meminta verifikasi mandiri di klien Matrix lain,
melewati permintaan duplikat saat satu sudah tertunda, dan menerapkan cooldown lokal sebelum mencoba lagi setelah restart.
Upaya permintaan yang gagal mencoba ulang lebih cepat daripada pembuatan permintaan yang berhasil secara default.
Setel `startupVerification: "off"` untuk menonaktifkan permintaan startup otomatis, atau sesuaikan `startupVerificationCooldownHours`
jika Anda menginginkan jendela percobaan ulang yang lebih pendek atau lebih panjang.

Startup juga menjalankan proses bootstrap crypto konservatif secara otomatis.
Proses itu mencoba menggunakan kembali secret storage dan identitas cross-signing saat ini terlebih dahulu, dan menghindari reset cross-signing kecuali Anda menjalankan alur perbaikan bootstrap eksplisit.

Jika startup menemukan status bootstrap yang rusak dan `channels.matrix.password` dikonfigurasi, OpenClaw dapat mencoba jalur perbaikan yang lebih ketat.
Jika perangkat saat ini sudah ditandatangani owner, OpenClaw mempertahankan identitas itu alih-alih meresetnya secara otomatis.

Upgrade dari plugin Matrix publik sebelumnya:

- OpenClaw secara otomatis menggunakan kembali akun Matrix, access token, dan identitas perangkat yang sama bila memungkinkan.
- Sebelum perubahan migrasi Matrix yang dapat ditindaklanjuti dijalankan, OpenClaw membuat atau menggunakan kembali snapshot pemulihan di `~/Backups/openclaw-migrations/`.
- Jika Anda menggunakan beberapa akun Matrix, setel `channels.matrix.defaultAccount` sebelum upgrade dari tata letak flat-store lama agar OpenClaw mengetahui akun mana yang harus menerima state lama bersama tersebut.
- Jika plugin sebelumnya menyimpan key dekripsi backup room-key Matrix secara lokal, startup atau `openclaw doctor --fix` akan mengimpornya ke alur recovery-key baru secara otomatis.
- Jika access token Matrix berubah setelah migrasi disiapkan, startup sekarang memindai root penyimpanan hash token serumpun untuk state pemulihan lama yang tertunda sebelum menyerah pada pemulihan backup otomatis.
- Jika access token Matrix berubah kemudian untuk akun, homeserver, dan pengguna yang sama, OpenClaw sekarang lebih memilih menggunakan kembali root penyimpanan hash token yang paling lengkap yang sudah ada daripada memulai dari direktori state Matrix kosong.
- Pada start gateway berikutnya, room key yang sudah di-backup dipulihkan secara otomatis ke crypto store baru.
- Jika plugin lama memiliki room key lokal saja yang tidak pernah di-backup, OpenClaw akan memberi peringatan dengan jelas. Key tersebut tidak dapat diekspor secara otomatis dari rust crypto store sebelumnya, jadi beberapa riwayat terenkripsi lama mungkin tetap tidak tersedia sampai dipulihkan secara manual.
- Lihat [Migrasi Matrix](/id/install/migrating-matrix) untuk alur upgrade lengkap, batasan, perintah pemulihan, dan pesan migrasi umum.

State runtime terenkripsi diatur di bawah root hash token per akun dan per pengguna di
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Direktori itu berisi sync store (`bot-storage.json`), crypto store (`crypto/`),
file recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
thread binding (`thread-bindings.json`), dan state verifikasi startup (`startup-verification.json`)
ketika fitur tersebut digunakan.
Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root yang ada terbaik
untuk tuple akun/homeserver/pengguna tersebut sehingga state sync sebelumnya, state crypto, thread binding,
dan state verifikasi startup tetap terlihat.

### Model crypto store Node

Matrix E2EE di plugin ini menggunakan jalur Rust crypto resmi `matrix-js-sdk` di Node.
Jalur itu mengharapkan persistensi berbasis IndexedDB ketika Anda ingin state crypto tetap bertahan setelah restart.

Saat ini OpenClaw menyediakannya di Node dengan cara:

- menggunakan `fake-indexeddb` sebagai shim API IndexedDB yang diharapkan SDK
- memulihkan isi IndexedDB Rust crypto dari `crypto-idb-snapshot.json` sebelum `initRustCrypto`
- mempertahankan isi IndexedDB yang diperbarui kembali ke `crypto-idb-snapshot.json` setelah init dan selama runtime
- melakukan serialisasi pemulihan dan persistensi snapshot terhadap `crypto-idb-snapshot.json` dengan file lock advisory agar persistensi runtime gateway dan pemeliharaan CLI tidak saling balapan pada file snapshot yang sama

Ini adalah plumbing kompatibilitas/penyimpanan, bukan implementasi crypto kustom.
File snapshot adalah state runtime sensitif dan disimpan dengan izin file yang ketat.
Dalam model keamanan OpenClaw, host gateway dan direktori state OpenClaw lokal sudah berada di dalam batas operator tepercaya, jadi ini terutama merupakan masalah durabilitas operasional, bukan batas kepercayaan remote yang terpisah.

Peningkatan yang direncanakan:

- menambahkan dukungan SecretRef untuk material key Matrix persisten sehingga recovery key dan secret enkripsi penyimpanan terkait dapat bersumber dari penyedia secret OpenClaw, bukan hanya file lokal

## Manajemen profil

Perbarui self-profile Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin menargetkan akun Matrix bernama secara eksplisit.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda meneruskan URL avatar `http://` atau `https://`, OpenClaw akan mengunggahnya ke Matrix terlebih dahulu dan menyimpan kembali URL `mxc://` yang sudah diselesaikan ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Pemberitahuan verifikasi otomatis

Matrix sekarang memposting pemberitahuan siklus hidup verifikasi langsung ke room verifikasi DM ketat sebagai pesan `m.notice`.
Itu mencakup:

- pemberitahuan permintaan verifikasi
- pemberitahuan verifikasi siap (dengan panduan eksplisit "Verify by emoji")
- pemberitahuan mulai dan selesai verifikasi
- detail SAS (emoji dan desimal) bila tersedia

Permintaan verifikasi masuk dari klien Matrix lain dilacak dan diterima secara otomatis oleh OpenClaw.
Untuk alur verifikasi mandiri, OpenClaw juga memulai alur SAS secara otomatis ketika verifikasi emoji tersedia dan mengonfirmasi sisi miliknya sendiri.
Untuk permintaan verifikasi dari pengguna/perangkat Matrix lain, OpenClaw menerima permintaan secara otomatis lalu menunggu alur SAS berjalan seperti biasa.
Anda tetap perlu membandingkan emoji atau SAS desimal di klien Matrix Anda dan mengonfirmasi "They match" di sana untuk menyelesaikan verifikasi.

OpenClaw tidak secara buta menerima alur duplikat yang dimulai sendiri. Startup melewati pembuatan permintaan baru ketika permintaan verifikasi mandiri sudah tertunda.

Pemberitahuan protokol/sistem verifikasi tidak diteruskan ke pipeline chat agen, sehingga tidak menghasilkan `NO_REPLY`.

### Kebersihan perangkat

Perangkat Matrix yang dikelola OpenClaw lama dapat menumpuk di akun dan membuat kepercayaan room terenkripsi lebih sulit dipahami.
Daftarkan dengan:

```bash
openclaw matrix devices list
```

Hapus perangkat yang dikelola OpenClaw dan sudah usang dengan:

```bash
openclaw matrix devices prune-stale
```

### Perbaikan Room Langsung

Jika state direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke solo room lama alih-alih DM aktif. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Perbaikan menjaga logika khusus Matrix tetap di dalam plugin:

- perbaikan lebih memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- jika tidak, perbaikan kembali ke DM 1:1 ketat yang saat ini diikuti dengan pengguna itu
- jika tidak ada DM sehat, perbaikan membuat direct room baru dan menulis ulang `m.direct` agar menunjuk ke room itu

Alur perbaikan tidak menghapus room lama secara otomatis. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lainnya menargetkan room yang benar lagi.

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis maupun pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) menjaga perutean DM Matrix tetap berbasis pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya diselesaikan ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke key sesinya sendiri sambil tetap menggunakan auth DM normal dan pemeriksaan allowlist.
- Binding percakapan Matrix eksplisit tetap menang atas `dm.sessionScope`, sehingga room dan thread yang dibinding mempertahankan sesi target pilihannya.
- `threadReplies: "off"` menjaga balasan tetap top-level dan menjaga pesan thread masuk pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya ketika pesan masuk memang sudah berada di thread itu.
- `threadReplies: "always"` menjaga balasan room tetap dalam thread yang berakar pada pesan pemicu dan merutekan percakapan itu melalui sesi bercakupan thread yang cocok dari pesan pemicu pertama.
- `dm.threadReplies` menimpa pengaturan top-level hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan thread masuk menyertakan pesan root thread sebagai konteks agen tambahan.
- Pengiriman message-tool sekarang otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM sesi-sama hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal berbasis pengguna.
- Saat OpenClaw melihat room DM Matrix bertabrakan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room tersebut dengan jalur keluar `/focus` saat thread binding diaktifkan dan petunjuk `dm.sessionScope`.
- Binding thread runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang dibinding thread kini berfungsi di room dan DM Matrix.
- `/focus` room/DM Matrix top-level membuat thread Matrix baru dan membindkannya ke sesi target ketika `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan membinding thread saat ini itu.

## Binding percakapan ACP

Room Matrix, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM, room, atau thread Matrix yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau room Matrix top-level, DM/room saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang dihasilkan.
- Di dalam thread Matrix yang sudah ada, `--bind here` membinding thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat child thread Matrix.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau membinding child thread Matrix.

### Konfigurasi Thread Binding

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per-channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat-thread Matrix bersifat opt-in:

- Setel `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` top-level membuat dan membinding thread Matrix baru.
- Setel `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` membinding sesi ACP ke thread Matrix.

## Reaction

Matrix mendukung action reaction keluar, pemberitahuan reaction masuk, dan reaction ack masuk.

- Tooling reaction keluar dibatasi oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaction ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaction saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaction milik akun bot sendiri pada event itu.
- `remove: true` hanya menghapus reaction emoji yang ditentukan dari akun bot.

Cakupan reaction ack diselesaikan dalam urutan standar OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen

Cakupan reaction ack diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode pemberitahuan reaction diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku saat ini:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika event tersebut menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaction.
- Penghapusan reaction masih belum disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room Matrix memicu agen.
- Nilai ini fallback ke `messages.groupChat.historyLimit`. Jika keduanya tidak disetel, default efektifnya adalah `0`, sehingga pesan room yang dibatasi mention tidak dibuffer. Setel `0` untuk menonaktifkan.
- Riwayat room Matrix hanya untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw membuffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela itu saat mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan itu tetap berada di body masuk utama untuk giliran tersebut.
- Percobaan ulang event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

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

Jika pengguna Matrix yang belum disetujui terus mengirim pesan kepada Anda sebelum persetujuan, OpenClaw menggunakan kembali kode pairing tertunda yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native untuk akun Matrix. Tombol
perutean DM/channel native tetap berada di bawah config persetujuan exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver harus berupa user ID Matrix seperti `@owner:example.org`. Matrix mengaktifkan persetujuan native secara otomatis ketika `enabled` tidak disetel atau `"auto"` dan setidaknya satu approver dapat diselesaikan. Persetujuan exec menggunakan `execApprovals.approvers` terlebih dahulu dan dapat fallback ke `channels.matrix.dm.allowFrom`. Persetujuan plugin mengotorisasi melalui `channels.matrix.dm.allowFrom`. Setel `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan akan fallback ke rute persetujuan lain yang dikonfigurasi atau kebijakan fallback persetujuan.

Perutean native Matrix kini mendukung kedua jenis persetujuan:

- `channels.matrix.execApprovals.*` mengontrol mode fanout DM/channel native untuk prompt persetujuan Matrix.
- Persetujuan exec menggunakan set approver exec dari `execApprovals.approvers` atau `channels.matrix.dm.allowFrom`.
- Persetujuan plugin menggunakan allowlist DM Matrix dari `channels.matrix.dm.allowFrom`.
- Pintasan reaction Matrix dan pembaruan pesan berlaku untuk persetujuan exec maupun plugin.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Prompt persetujuan Matrix menanamkan pintasan reaction pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = selalu izinkan saat keputusan itu diizinkan oleh kebijakan exec efektif

Approver dapat bereaksi pada pesan tersebut atau menggunakan slash command cadangan: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang telah diselesaikan yang dapat menyetujui atau menolak. Untuk persetujuan exec, pengiriman channel menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Prompt persetujuan Matrix menggunakan kembali planner persetujuan inti bersama. Permukaan native khusus Matrix menangani perutean room/DM, reaction, dan perilaku kirim/perbarui/hapus pesan untuk persetujuan exec maupun plugin.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Persetujuan exec](/id/tools/exec-approvals)

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

Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali suatu akun menimpanya.
Anda dapat memberi cakupan entri room yang diwarisi ke satu akun Matrix dengan `groups.<room>.account` (atau `rooms.<room>.account` lama).
Entri tanpa `account` tetap dibagikan ke semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi ketika akun default dikonfigurasi langsung di `channels.matrix.*` tingkat atas.
Default auth bersama parsial tidak dengan sendirinya membuat akun default implisit terpisah. OpenClaw hanya mensintesis akun `default` tingkat atas ketika default tersebut memiliki auth baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama tetap dapat terdeteksi dari `homeserver` plus `userId` ketika kredensial cache memenuhi auth nanti.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke key akun bernama yang sudah ada, promosi perbaikan/penyiapan dari satu akun ke multi-akun mempertahankan akun itu alih-alih membuat entri `accounts.default` baru. Hanya key auth/bootstrap Matrix yang dipindahkan ke akun hasil promosi itu; key kebijakan pengiriman bersama tetap di tingkat atas.
Setel `defaultAccount` ketika Anda ingin OpenClaw lebih memilih satu akun Matrix bernama untuk perutean implisit, probing, dan operasi CLI.
Jika Anda mengonfigurasi beberapa akun bernama, setel `defaultAccount` atau teruskan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Teruskan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` ketika Anda ingin menimpa pemilihan implisit itu untuk satu perintah.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit memilih ikut per akun.

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

Opt-in ini hanya mengizinkan target privat/internal yang tepercaya. Homeserver cleartext publik seperti
`http://matrix.example.org:8008` tetap diblokir. Sebisa mungkin, gunakan `https://`.

## Proxy lalu lintas Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) keluar eksplisit, setel `channels.matrix.proxy`:

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

Pencarian direktori live menggunakan akun Matrix yang sedang login:

- Pencarian pengguna mengkueri direktori pengguna Matrix di homeserver tersebut.
- Pencarian room menerima ID room dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang sudah diikuti untuk akun tersebut.
- Pencarian nama room yang sudah diikuti bersifat best-effort. Jika nama room tidak dapat diselesaikan ke ID atau alias, nama itu diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: aktifkan atau nonaktifkan channel.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun yang dipilih saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini saat homeserver diselesaikan ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat menimpa default tingkat atas dengan `proxy` mereka sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk auth berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh penyedia env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar diri yang disimpan untuk sinkronisasi profil dan pembaruan `set-profile`.
- `initialSyncLimit`: batas event sync saat startup.
- `encryption`: aktifkan E2EE.
- `allowlistOnly`: paksa perilaku hanya-allowlist untuk DM dan room.
- `allowBots`: izinkan pesan dari akun Matrix OpenClaw lain yang telah dikonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist user ID untuk lalu lintas room.
- Entri `groupAllowFrom` harus berupa user ID Matrix lengkap. Nama yang tidak terselesaikan diabaikan saat runtime.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `partial`, `quiet`, `true`, atau `false`. `partial` dan `true` mengaktifkan pembaruan draft pratinjau-dulu dengan pesan teks Matrix normal. `quiet` menggunakan pemberitahuan pratinjau tanpa notifikasi untuk penyiapan aturan push self-hosted.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang telah selesai saat streaming draft pratinjau aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per-channel untuk perutean dan siklus hidup sesi terikat-thread.
- `startupVerification`: mode permintaan verifikasi mandiri otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba ulang permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar.
- `chunkMode`: `length` atau `newline`.
- `responsePrefix`: prefix pesan opsional untuk balasan keluar.
- `ackReaction`: override reaction ack opsional untuk channel/akun ini.
- `ackReactionScope`: override cakupan reaction ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode pemberitahuan reaction masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk penanganan media Matrix. Berlaku untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan auto-join undangan (`always`, `allowlist`, `off`). Default: `off`. Berlaku untuk undangan Matrix secara umum, termasuk undangan gaya DM, bukan hanya undangan room/grup. OpenClaw membuat keputusan ini pada saat undangan, sebelum dapat secara andal mengklasifikasikan room yang diikuti sebagai DM atau grup.
- `autoJoinAllowlist`: room/alias yang diizinkan ketika `autoJoin` adalah `allowlist`. Entri alias diselesaikan ke ID room selama penanganan undangan; OpenClaw tidak memercayai state alias yang diklaim oleh room undangan.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan akan di-auto-join.
- Entri `dm.allowFrom` harus berupa user ID Matrix lengkap kecuali Anda sudah menyelesaikannya melalui pencarian direktori live.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` ketika Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Menimpa pengaturan `threadReplies` tingkat atas untuk penempatan balasan dan isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: user ID Matrix yang diizinkan menyetujui permintaan exec. Opsional ketika `dm.allowFrom` sudah mengidentifikasi para approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override per akun bernama. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per room. Gunakan ID room atau alias; nama room yang tidak terselesaikan diabaikan saat runtime. Identitas sesi/grup menggunakan ID room yang stabil setelah resolusi, sementara label yang dapat dibaca manusia tetap berasal dari nama room.
- `groups.<room>.account`: batasi satu entri room yang diwarisi ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot terkonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per room.
- `groups.<room>.tools`: override izin/tolak tool per room.
- `groups.<room>.autoReply`: override pembatasan mention tingkat room. `true` menonaktifkan persyaratan mention untuk room itu; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill opsional tingkat room.
- `groups.<room>.systemPrompt`: cuplikan system prompt opsional tingkat room.
- `rooms`: alias lama untuk `groups`.
- `actions`: pembatasan tool per action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Gambaran Umum Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — auth DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
