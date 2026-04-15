---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE Matrix dan verifikasi
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd730bb9d0c8a548ee48b20931b3222e9aa1e6e95f1390b0c236645e03f3576d
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah Plugin saluran bawaan untuk OpenClaw.
Matrix menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

## Plugin bawaan

Matrix dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan instalasi terpisah.

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
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Matrix di homeserver Anda.
3. Konfigurasikan `channels.matrix` dengan salah satu dari:
   - `homeserver` + `accessToken`, atau
   - `homeserver` + `userId` + `password`.
4. Mulai ulang Gateway.
5. Mulai DM dengan bot atau undang bot ke room.
   - Undangan Matrix baru hanya berfungsi jika `channels.matrix.autoJoin` mengizinkannya.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard Matrix akan meminta:

- URL homeserver
- metode auth: access token atau password
- ID pengguna (khusus auth password)
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room dan gabung otomatis undangan

Perilaku utama wizard:

- Jika env var auth Matrix sudah ada dan akun tersebut belum memiliki auth yang disimpan di config, wizard menawarkan pintasan env untuk menyimpan auth di env vars.
- Nama akun dinormalisasi ke ID akun. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Entri allowlist DM menerima `@user:server` secara langsung; nama tampilan hanya berfungsi jika pencarian direktori live menemukan satu kecocokan yang tepat.
- Entri allowlist room menerima ID room dan alias secara langsung. Gunakan `!room:server` atau `#alias:server`; nama yang tidak terselesaikan akan diabaikan saat runtime oleh resolusi allowlist.
- Dalam mode allowlist gabung otomatis undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Untuk menyelesaikan nama room sebelum menyimpan, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` secara default adalah `off`.

Jika Anda membiarkannya tidak disetel, bot tidak akan bergabung ke room yang diundang atau undangan bergaya DM baru, jadi bot tidak akan muncul di grup baru atau DM yang diundang kecuali Anda bergabung secara manual terlebih dahulu.

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

Matrix menyimpan kredensial yang di-cache di `~/.openclaw/credentials/matrix/`.
Akun default menggunakan `credentials.json`; akun bernama menggunakan `credentials-<account>.json`.
Ketika kredensial yang di-cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi untuk penyiapan, doctor, dan penemuan status saluran meskipun auth saat ini tidak disetel langsung di config.

Padanan env var (digunakan saat kunci config tidak disetel):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Untuk akun non-default, gunakan env var dengan cakupan akun:

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

Matrix meng-escape tanda baca dalam ID akun agar env var dengan cakupan akun bebas tabrakan.
Misalnya, `-` menjadi `_X2D_`, jadi `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var ketika env var auth tersebut sudah ada dan akun yang dipilih belum memiliki auth Matrix yang disimpan di config.

## Contoh konfigurasi

Ini adalah config dasar praktis dengan pairing DM, allowlist room, dan E2EE yang diaktifkan:

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

`autoJoin` berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM. OpenClaw tidak dapat secara andal
mengklasifikasikan room yang diundang sebagai DM atau grup pada saat undangan, jadi semua undangan melewati `autoJoin`
terlebih dahulu. `dm.policy` berlaku setelah bot telah bergabung dan room diklasifikasikan sebagai DM.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Setel `channels.matrix.streaming` ke `"partial"` jika Anda ingin OpenClaw mengirim satu balasan pratinjau live,
mengedit pratinjau itu di tempat saat model sedang menghasilkan teks, lalu menyelesaikannya saat balasan
selesai:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` adalah default. OpenClaw menunggu balasan akhir dan mengirimkannya satu kali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix biasa. Ini mempertahankan perilaku notifikasi lama Matrix yang mengutamakan pratinjau, sehingga klien bawaan dapat memberi notifikasi pada teks pratinjau pertama yang di-stream alih-alih blok yang sudah selesai.
- `streaming: "quiet"` membuat satu pemberitahuan pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi aturan push penerima untuk edit pratinjau yang telah diselesaikan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan streaming pratinjau diaktifkan, Matrix mempertahankan draf live untuk blok saat ini dan menyimpan blok yang telah selesai sebagai pesan terpisah.
- Saat streaming pratinjau aktif dan `blockStreaming` nonaktif, Matrix mengedit draf live di tempat dan menyelesaikan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman akhir normal.
- Balasan media tetap mengirim lampiran secara normal. Jika pratinjau lama tidak lagi dapat digunakan ulang dengan aman, OpenClaw menghapusnya sebelum mengirim balasan media akhir.
- Edit pratinjau menambah panggilan API Matrix. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate-limit yang paling konservatif.

`blockStreaming` tidak mengaktifkan pratinjau draf dengan sendirinya.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang telah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa aturan push kustom, gunakan `streaming: "partial"` untuk perilaku mengutamakan pratinjau atau biarkan `streaming` nonaktif untuk pengiriman akhir saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang selesai sebagai pesan Matrix normal yang memicu notifikasi.
- `blockStreaming: false` hanya mengirim balasan akhir yang telah selesai sebagai pesan Matrix normal yang memicu notifikasi.

### Aturan push self-hosted untuk pratinjau senyap yang telah diselesaikan

Jika Anda menjalankan infrastruktur Matrix Anda sendiri dan ingin pratinjau senyap memberi notifikasi hanya saat blok atau
balasan akhir selesai, setel `streaming: "quiet"` dan tambahkan aturan push per pengguna untuk edit pratinjau yang telah diselesaikan.

Ini biasanya merupakan penyiapan pengguna penerima, bukan perubahan config global homeserver:

Pemetaan cepat sebelum memulai:

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

2. Pastikan akun penerima sudah menerima notifikasi push Matrix normal. Aturan pratinjau senyap
   hanya berfungsi jika pengguna tersebut sudah memiliki pusher/perangkat yang berfungsi.

3. Dapatkan access token pengguna penerima.
   - Gunakan token pengguna penerima, bukan token bot.
   - Menggunakan ulang token sesi klien yang sudah ada biasanya paling mudah.
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

OpenClaw menandai edit pratinjau finalisasi hanya-teks dengan:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Buat aturan push override untuk setiap akun penerima yang seharusnya menerima notifikasi ini:

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

Ganti nilai-nilai ini sebelum Anda menjalankan perintah:

- `https://matrix.example.org`: URL dasar homeserver Anda
- `$USER_ACCESS_TOKEN`: access token pengguna penerima
- `openclaw-finalized-preview-botname`: ID aturan yang unik untuk bot ini bagi pengguna penerima ini
- `@bot:example.org`: MXID bot Matrix OpenClaw Anda, bukan MXID pengguna penerima

Penting untuk penyiapan multi-bot:

- Aturan push diberi kunci berdasarkan `ruleId`. Menjalankan ulang `PUT` terhadap ID aturan yang sama akan memperbarui aturan tersebut.
- Jika satu pengguna penerima harus memberi notifikasi untuk beberapa akun bot Matrix OpenClaw, buat satu aturan per bot dengan ID aturan unik untuk setiap kecocokan sender.
- Pola sederhana adalah `openclaw-finalized-preview-<botname>`, seperti `openclaw-finalized-preview-ops` atau `openclaw-finalized-preview-support`.

Aturan dievaluasi terhadap pengirim event:

- autentikasi dengan token pengguna penerima
- cocokkan `sender` dengan MXID bot OpenClaw

6. Verifikasi bahwa aturan tersebut ada:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Uji balasan yang di-stream. Dalam mode senyap, room seharusnya menampilkan pratinjau draf senyap dan edit akhir
   di tempat seharusnya memberi notifikasi saat blok atau giliran selesai.

Jika Anda perlu menghapus aturan nanti, hapus ID aturan yang sama itu dengan token pengguna penerima:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Catatan:

- Buat aturan dengan access token pengguna penerima, bukan token bot.
- Aturan `override` baru yang ditentukan pengguna disisipkan di depan aturan penekanan default, jadi tidak diperlukan parameter urutan tambahan.
- Ini hanya memengaruhi edit pratinjau khusus teks yang dapat difinalisasi dengan aman oleh OpenClaw di tempat. Fallback media dan fallback pratinjau usang tetap menggunakan pengiriman Matrix normal.
- Jika `GET /_matrix/client/v3/pushers` tidak menunjukkan pusher, pengguna tersebut belum memiliki pengiriman push Matrix yang berfungsi untuk akun/perangkat ini.

#### Synapse

Untuk Synapse, penyiapan di atas biasanya sudah cukup dengan sendirinya:

- Tidak diperlukan perubahan `homeserver.yaml` khusus untuk notifikasi pratinjau OpenClaw yang telah difinalisasi.
- Jika deployment Synapse Anda sudah mengirim notifikasi push Matrix normal, token pengguna + pemanggilan `pushrules` di atas adalah langkah penyiapan utamanya.
- Jika Anda menjalankan Synapse di belakang reverse proxy atau workers, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar.
- Jika Anda menjalankan Synapse workers, pastikan pusher sehat. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi.

#### Tuwunel

Untuk Tuwunel, gunakan alur penyiapan yang sama dan pemanggilan API `pushrules` yang ditunjukkan di atas:

- Tidak diperlukan config khusus Tuwunel untuk penanda pratinjau finalisasi itu sendiri.
- Jika notifikasi Matrix normal sudah berfungsi untuk pengguna tersebut, token pengguna + pemanggilan `pushrules` di atas adalah langkah penyiapan utamanya.
- Jika notifikasi tampak hilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini di Tuwunel 1.4.2 pada 12 September 2025, dan opsi ini dapat dengan sengaja menekan push ke perangkat lain saat satu perangkat sedang aktif.

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi akan diabaikan.

Gunakan `allowBots` jika Anda memang menginginkan lalu lintas Matrix antar-agen:

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
- `allowBots: "mentions"` menerima pesan tersebut hanya saat mereka secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan ke diri sendiri.
- Matrix tidak mengekspos penanda bot bawaan di sini; OpenClaw memperlakukan "ditulis oleh bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi pada Gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkapnya. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

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
cold start mendatang dapat memuat backup key yang baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` bersifat ringkas secara default (termasuk logging SDK internal yang senyap) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat melakukan scripting.

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda meneruskan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, setel `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` kapan pun Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi menunjuk ke kunci config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

### Apa arti "verified"

OpenClaw memperlakukan perangkat Matrix ini sebagai terverifikasi hanya ketika perangkat ini diverifikasi oleh identitas cross-signing Anda sendiri.
Dalam praktiknya, `openclaw matrix verify status --verbose` mengekspos tiga sinyal kepercayaan:

- `Locally trusted`: perangkat ini dipercaya hanya oleh klien saat ini
- `Cross-signing verified`: SDK melaporkan perangkat sebagai terverifikasi melalui cross-signing
- `Signed by owner`: perangkat ditandatangani oleh self-signing key Anda sendiri

`Verified by owner` menjadi `yes` hanya ketika verifikasi cross-signing atau owner-signing ada.
Kepercayaan lokal saja tidak cukup bagi OpenClaw untuk memperlakukan perangkat sebagai sepenuhnya terverifikasi.

### Apa yang dilakukan bootstrap

`openclaw matrix verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun Matrix terenkripsi.
Perintah ini melakukan semua hal berikut secara berurutan:

- melakukan bootstrap secret storage, menggunakan ulang recovery key yang ada jika memungkinkan
- melakukan bootstrap cross-signing dan mengunggah public cross-signing key yang belum ada
- mencoba menandai dan melakukan cross-sign pada perangkat saat ini
- membuat backup room-key sisi server baru jika belum ada

Jika homeserver memerlukan auth interaktif untuk mengunggah cross-signing key, OpenClaw mencoba unggahan tanpa auth terlebih dahulu, lalu dengan `m.login.dummy`, lalu dengan `m.login.password` saat `channels.matrix.password` dikonfigurasi.

Gunakan `--force-reset-cross-signing` hanya jika Anda memang ingin membuang identitas cross-signing saat ini dan membuat yang baru.

Jika Anda memang ingin membuang backup room-key saat ini dan memulai
baseline backup baru untuk pesan mendatang, gunakan `openclaw matrix verify backup reset --yes`.
Lakukan ini hanya jika Anda menerima bahwa riwayat terenkripsi lama yang tidak dapat dipulihkan akan tetap
tidak tersedia dan bahwa OpenClaw dapat membuat ulang secret storage jika rahasia backup saat ini
tidak dapat dimuat dengan aman.

### Baseline backup baru

Jika Anda ingin menjaga agar pesan terenkripsi mendatang tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Tambahkan `--account <id>` ke setiap perintah saat Anda ingin secara eksplisit menargetkan akun Matrix bernama.

### Perilaku saat startup

Saat `encryption: true`, Matrix secara default menetapkan `startupVerification` ke `"if-unverified"`.
Saat startup, jika perangkat ini masih belum terverifikasi, Matrix akan meminta verifikasi mandiri di klien Matrix lain,
melewati permintaan duplikat saat satu permintaan sudah tertunda, dan menerapkan cooldown lokal sebelum mencoba lagi setelah restart.
Percobaan permintaan yang gagal akan dicoba ulang lebih cepat daripada pembuatan permintaan yang berhasil secara default.
Setel `startupVerification: "off"` untuk menonaktifkan permintaan otomatis saat startup, atau sesuaikan `startupVerificationCooldownHours`
jika Anda ingin jendela percobaan ulang yang lebih pendek atau lebih panjang.

Startup juga secara otomatis melakukan pass bootstrap kripto yang konservatif.
Pass tersebut mencoba menggunakan ulang secret storage dan identitas cross-signing saat ini terlebih dahulu, serta menghindari reset cross-signing kecuali Anda menjalankan alur perbaikan bootstrap yang eksplisit.

Jika saat startup masih ditemukan status bootstrap yang rusak, OpenClaw dapat mencoba jalur perbaikan yang dijaga bahkan ketika `channels.matrix.password` tidak dikonfigurasi.
Jika homeserver memerlukan UIA berbasis password untuk perbaikan tersebut, OpenClaw mencatat peringatan dan menjaga agar startup tetap non-fatal alih-alih membatalkan bot.
Jika perangkat saat ini sudah ditandatangani oleh pemilik, OpenClaw mempertahankan identitas tersebut alih-alih meresetnya secara otomatis.

Lihat [migrasi Matrix](/id/install/migrating-matrix) untuk alur upgrade lengkap, batasan, perintah pemulihan, dan pesan migrasi umum.

### Pemberitahuan verifikasi

Matrix memposting pemberitahuan siklus hidup verifikasi langsung ke room verifikasi DM ketat sebagai pesan `m.notice`.
Ini mencakup:

- pemberitahuan permintaan verifikasi
- pemberitahuan verifikasi siap (dengan panduan eksplisit "Verify by emoji")
- pemberitahuan mulai dan selesai verifikasi
- detail SAS (emoji dan desimal) saat tersedia

Permintaan verifikasi masuk dari klien Matrix lain dilacak dan diterima otomatis oleh OpenClaw.
Untuk alur verifikasi mandiri, OpenClaw juga memulai alur SAS secara otomatis saat verifikasi emoji tersedia dan mengonfirmasi sisi miliknya sendiri.
Untuk permintaan verifikasi dari pengguna/perangkat Matrix lain, OpenClaw menerima permintaan secara otomatis lalu menunggu alur SAS berjalan normal.
Anda tetap perlu membandingkan emoji atau SAS desimal di klien Matrix Anda dan mengonfirmasi "They match" di sana untuk menyelesaikan verifikasi.

OpenClaw tidak secara membabi buta menerima otomatis alur duplikat yang dimulai sendiri. Startup melewati pembuatan permintaan baru saat permintaan verifikasi mandiri sudah tertunda.

Pemberitahuan protokol/sistem verifikasi tidak diteruskan ke pipeline chat agen, sehingga tidak menghasilkan `NO_REPLY`.

### Kebersihan perangkat

Perangkat Matrix lama yang dikelola OpenClaw dapat menumpuk pada akun dan membuat kepercayaan room terenkripsi lebih sulit dipahami.
Daftarkan dengan:

```bash
openclaw matrix devices list
```

Hapus perangkat lama yang dikelola OpenClaw dengan:

```bash
openclaw matrix devices prune-stale
```

### Penyimpanan kripto

Matrix E2EE menggunakan jalur kripto Rust `matrix-js-sdk` resmi di Node, dengan `fake-indexeddb` sebagai shim IndexedDB. Status kripto dipersistenkan ke file snapshot (`crypto-idb-snapshot.json`) dan dipulihkan saat startup. File snapshot adalah status runtime sensitif yang disimpan dengan izin file yang ketat.

Status runtime terenkripsi berada di bawah root per-akun, per-pengguna, per-hash token di
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Direktori tersebut berisi sync store (`bot-storage.json`), crypto store (`crypto/`),
file recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
thread binding (`thread-bindings.json`), dan status verifikasi startup (`startup-verification.json`).
Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang sudah ada
untuk tuple akun/homeserver/pengguna tersebut sehingga status sync sebelumnya, status kripto, thread binding,
dan status verifikasi startup tetap terlihat.

## Manajemen profil

Perbarui profil mandiri Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin secara eksplisit menargetkan akun Matrix bernama.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda meneruskan URL avatar `http://` atau `https://`, OpenClaw mengunggahnya ke Matrix terlebih dahulu dan menyimpan kembali URL `mxc://` yang telah diselesaikan ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis dan pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) menjaga routing DM Matrix tetap dibatasi pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya diselesaikan ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke kunci sesinya sendiri sambil tetap menggunakan auth DM normal dan pemeriksaan allowlist.
- Binding percakapan Matrix yang eksplisit tetap diutamakan dibanding `dm.sessionScope`, sehingga room dan thread yang terikat mempertahankan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap di level atas dan menjaga pesan ber-thread yang masuk tetap pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya ketika pesan masuk memang sudah berada di thread tersebut.
- `threadReplies: "always"` menjaga balasan room tetap di thread yang berakar pada pesan pemicu dan merutekan percakapan tersebut melalui sesi dengan cakupan thread yang sesuai sejak pesan pemicu pertama.
- `dm.threadReplies` menimpa pengaturan level atas hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan ber-thread yang masuk menyertakan pesan akar thread sebagai konteks agen tambahan.
- Pengiriman message-tool otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM untuk sesi yang sama hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke routing normal dengan cakupan pengguna.
- Saat OpenClaw melihat room DM Matrix berbenturan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room tersebut dengan escape hatch `/focus` ketika thread binding diaktifkan dan hint `dm.sessionScope`.
- Thread binding runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread berfungsi di room dan DM Matrix.
- `/focus` level atas di room/DM Matrix membuat thread Matrix baru dan mengikatnya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan mengikat thread saat ini tersebut.

## Binding percakapan ACP

Room Matrix, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang persisten tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, room, atau thread yang sudah ada yang ingin tetap Anda gunakan.
- Di DM atau room Matrix level atas, DM/room saat ini tetap menjadi permukaan chat dan pesan selanjutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam thread Matrix yang sudah ada, `--bind here` mengikat thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat thread Matrix anak.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, ketika OpenClaw perlu membuat atau mengikat thread Matrix anak.

### Config thread binding

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per saluran:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn yang terikat thread Matrix bersifat opt-in:

- Setel `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` level atas membuat dan mengikat thread Matrix baru.
- Setel `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` mengikat sesi ACP ke thread Matrix.

## Reaksi

Matrix mendukung aksi reaksi keluar, notifikasi reaksi masuk, dan reaksi ack masuk.

- Tooling reaksi keluar dikendalikan oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaksi ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaksi milik akun bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji tertentu dari akun bot.

Cakupan reaksi ack diselesaikan dalam urutan OpenClaw standar:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen

Cakupan reaksi ack diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaksi diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan ketika event tersebut menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` yang berdiri sendiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` ketika pesan room Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- Riwayat room Matrix hanya berlaku untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw men-buffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela tersebut saat mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di body inbound utama untuk giliran itu.
- Retry dari event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol `contextVisibility` bersama untuk konteks room tambahan seperti teks balasan yang diambil, akar thread, dan riwayat pending.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna yang aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari pengaturan `groupPolicy`, `groups`, `groupAllowFrom`, dan kebijakan DM.

## Kebijakan DM dan room

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

Lihat [Groups](/id/channels/groups) untuk perilaku mention-gating dan allowlist.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan kembali kode pairing tertunda yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan direct room

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke room solo lama alih-alih DM yang aktif. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Alur perbaikan:

- lebih memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat mana pun yang saat ini sudah diikuti dengan pengguna tersebut
- membuat direct room baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Alur perbaikan tidak menghapus room lama secara otomatis. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lainnya kembali menargetkan room yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native untuk akun Matrix. Tombol pengaturan routing
DM/saluran native tetap berada di bawah config persetujuan exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan native ketika `enabled` tidak disetel atau `"auto"` dan setidaknya satu approver dapat diselesaikan. Persetujuan exec menggunakan `execApprovals.approvers` terlebih dahulu dan dapat fallback ke `channels.matrix.dm.allowFrom`. Persetujuan Plugin mengotorisasi melalui `channels.matrix.dm.allowFrom`. Setel `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan fallback ke rute persetujuan lain yang dikonfigurasi atau kebijakan fallback persetujuan.

Routing native Matrix mendukung kedua jenis persetujuan:

- `channels.matrix.execApprovals.*` mengontrol mode fanout DM/saluran native untuk prompt persetujuan Matrix.
- Persetujuan exec menggunakan kumpulan approver exec dari `execApprovals.approvers` atau `channels.matrix.dm.allowFrom`.
- Persetujuan Plugin menggunakan allowlist DM Matrix dari `channels.matrix.dm.allowFrom`.
- Pintasan reaksi Matrix dan pembaruan pesan berlaku untuk persetujuan exec dan Plugin.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Prompt persetujuan Matrix menanam pintasan reaksi pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = selalu izinkan jika keputusan tersebut diizinkan oleh kebijakan exec efektif

Approver dapat bereaksi pada pesan tersebut atau menggunakan slash command fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang berhasil diselesaikan yang dapat menyetujui atau menolak. Untuk persetujuan exec, pengiriman saluran menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Exec approvals](/id/tools/exec-approvals)

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

Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali jika suatu akun menimpanya.
Anda dapat membatasi entri room turunan ke satu akun Matrix dengan `groups.<room>.account`.
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi saat akun default dikonfigurasi langsung pada `channels.matrix.*` tingkat atas.
Default auth bersama parsial tidak dengan sendirinya membuat akun default implisit yang terpisah. OpenClaw hanya mensintesis akun `default` tingkat atas ketika default tersebut memiliki auth baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama tetap dapat ditemukan dari `homeserver` plus `userId` ketika kredensial yang di-cache memenuhi auth nanti.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang sudah ada, promosi perbaikan/penyiapan dari akun tunggal ke multi-akun akan mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap di tingkat atas.
Setel `defaultAccount` saat Anda ingin OpenClaw memilih satu akun Matrix bernama untuk routing implisit, probing, dan operasi CLI.
Jika beberapa akun Matrix dikonfigurasi dan salah satu ID akun adalah `default`, OpenClaw menggunakan akun tersebut secara implisit bahkan ketika `defaultAccount` tidak disetel.
Jika Anda mengonfigurasi beberapa akun bernama, setel `defaultAccount` atau teruskan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Teruskan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin menimpa pemilihan implisit tersebut untuk satu perintah.

Lihat [Configuration reference](/id/gateway/configuration-reference#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit melakukan opt-in per akun.

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
`http://matrix.example.org:8008` tetap diblokir. Gunakan `https://` bila memungkinkan.

## Mem-proxy lalu lintas Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) keluar yang eksplisit, setel `channels.matrix.proxy`:

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

- Pencarian pengguna mengkueri direktori pengguna Matrix pada homeserver tersebut.
- Pencarian room menerima ID room dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang sudah diikuti untuk akun tersebut.
- Pencarian nama joined-room bersifat best-effort. Jika nama room tidak dapat diselesaikan ke ID atau alias, nama tersebut diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: mengaktifkan atau menonaktifkan saluran.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: mengizinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini saat homeserver diselesaikan ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat menimpa default tingkat atas dengan `proxy` miliknya sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk auth berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh provider env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar mandiri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sync startup.
- `encryption`: mengaktifkan E2EE.
- `allowlistOnly`: saat `true`, meningkatkan kebijakan room `open` menjadi `allowlist`, dan memaksa semua kebijakan DM aktif kecuali `disabled` (termasuk `pairing` dan `open`) menjadi `allowlist`. Tidak memengaruhi kebijakan `disabled`.
- `allowBots`: mengizinkan pesan dari akun Matrix OpenClaw lain yang dikonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room. Entri harus berupa ID pengguna Matrix lengkap; nama yang tidak terselesaikan diabaikan saat runtime.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: konfigurasi render Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `"partial"`, `"quiet"`, `true`, atau `false`. `"partial"` dan `true` mengaktifkan pembaruan draf yang mengutamakan pratinjau dengan pesan teks Matrix normal. `"quiet"` menggunakan pemberitahuan pratinjau tanpa notifikasi untuk penyiapan push-rule self-hosted. `false` setara dengan `"off"`.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang telah selesai saat streaming pratinjau draf aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per saluran untuk routing dan siklus hidup sesi yang terikat thread.
- `startupVerification`: mode permintaan verifikasi mandiri otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba ulang permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar dalam karakter (berlaku saat `chunkMode` adalah `length`).
- `chunkMode`: `length` membagi pesan berdasarkan jumlah karakter; `newline` membagi pada batas baris.
- `responsePrefix`: string opsional yang diawali ke semua balasan keluar untuk saluran ini.
- `ackReaction`: override reaksi ack opsional untuk saluran/akun ini.
- `ackReactionScope`: override cakupan reaksi ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan gabung otomatis undangan (`always`, `allowlist`, `off`). Default: `off`. Berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `allowlist`. Entri alias diselesaikan ke ID room selama penanganan undangan; OpenClaw tidak memercayai status alias yang diklaim oleh room yang mengundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah suatu undangan digabung secara otomatis.
- `dm.allowFrom`: entri harus berupa ID pengguna Matrix lengkap kecuali Anda sudah menyelesaikannya melalui pencarian direktori live.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peernya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Ini menimpa pengaturan `threadReplies` tingkat atas untuk penempatan balasan dan isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan untuk menyetujui permintaan exec. Opsional saat `dm.allowFrom` sudah mengidentifikasi approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override bernama per akun. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per room. Gunakan ID room atau alias; nama room yang tidak terselesaikan diabaikan saat runtime. Identitas sesi/grup menggunakan ID room stabil setelah resolusi.
- `groups.<room>.account`: membatasi satu entri room turunan ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot yang dikonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per room.
- `groups.<room>.tools`: override allow/deny tool per room.
- `groups.<room>.autoReply`: override mention-gating tingkat room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill tingkat room opsional.
- `groups.<room>.systemPrompt`: cuplikan system prompt tingkat room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: gating tool per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Channels Overview](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — auth DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan mention gating
- [Channel Routing](/id/channels/channel-routing) — routing sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
