---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi Matrix E2EE dan verifikasi
summary: Status dukungan, penyiapan, dan contoh konfigurasi Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-05T13:44:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah plugin channel bawaan Matrix untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

## Plugin bawaan

Matrix dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Matrix, instal
secara manual:

Instal dari npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Lihat [Plugins](/tools/plugin) untuk perilaku plugin dan aturan instalasi.

## Penyiapan

1. Pastikan plugin Matrix tersedia.
   - Rilis OpenClaw dalam paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
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

Yang benar-benar ditanyakan wizard Matrix:

- URL homeserver
- metode auth: access token atau password
- ID pengguna hanya saat Anda memilih auth password
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room Matrix sekarang

Perilaku wizard yang penting:

- Jika env var auth Matrix sudah ada untuk akun yang dipilih, dan akun tersebut belum memiliki auth yang tersimpan di config, wizard menawarkan pintasan env dan hanya menulis `enabled: true` untuk akun tersebut.
- Saat Anda menambahkan akun Matrix lain secara interaktif, nama akun yang dimasukkan dinormalisasi menjadi ID akun yang digunakan di config dan env vars. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Prompt allowlist DM langsung menerima nilai `@user:server` penuh. Nama tampilan hanya berfungsi saat lookup direktori langsung menemukan satu kecocokan yang tepat; jika tidak, wizard meminta Anda mencoba lagi dengan ID Matrix penuh.
- Prompt allowlist room menerima ID room dan alias secara langsung. Prompt ini juga dapat meresolusikan nama room yang sudah diikuti secara live, tetapi nama yang tidak teresolusikan hanya dipertahankan sebagaimana diketik saat penyiapan dan diabaikan nanti oleh resolusi allowlist saat runtime. Utamakan `!room:server` atau `#alias:server`.
- Identitas room/sesi saat runtime menggunakan ID room Matrix yang stabil. Alias yang dideklarasikan room hanya digunakan sebagai input lookup, bukan sebagai kunci sesi jangka panjang atau identitas grup yang stabil.
- Untuk meresolusikan nama room sebelum menyimpannya, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

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

Padanan variabel environment (digunakan saat kunci config tidak ditetapkan):

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

Matrix meng-escape tanda baca dalam ID akun agar env vars bercakupan tetap bebas tabrakan.
Misalnya, `-` menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var saat env vars auth tersebut sudah ada dan akun yang dipilih belum memiliki auth Matrix yang tersimpan di config.

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

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Tetapkan `channels.matrix.streaming` ke `"partial"` saat Anda ingin OpenClaw mengirim satu balasan draf,
mengedit draf tersebut di tempat saat model sedang menghasilkan teks, lalu memfinalkannya ketika balasan
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

- `streaming: "off"` adalah default. OpenClaw menunggu balasan final dan mengirimnya sekali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini alih-alih mengirim beberapa pesan parsial.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan `streaming: "partial"`, Matrix mempertahankan draf live untuk blok saat ini dan mempertahankan blok yang sudah selesai sebagai pesan terpisah.
- Saat `streaming: "partial"` dan `blockStreaming` nonaktif, Matrix hanya mengedit draf live dan mengirim balasan lengkap setelah blok atau giliran tersebut selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman final normal.
- Balasan media tetap mengirim lampiran secara normal. Jika pratinjau lama tidak lagi dapat digunakan kembali dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media final.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate-limit yang paling konservatif.

`blockStreaming` tidak dengan sendirinya mengaktifkan pratinjau draf.
Gunakan `streaming: "partial"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang selesai tetap terlihat sebagai pesan progres terpisah.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar terenkripsi bersama lampiran penuh. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

### Room bot ke bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi akan diabaikan.

Gunakan `allowBots` saat Anda memang ingin lalu lintas Matrix antar-agen:

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
- `allowBots: "mentions"` menerima pesan tersebut hanya saat pesan secara terlihat me-mention bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa setelan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balas-diri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw menganggap "dibuat oleh bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi pada gateway OpenClaw ini".

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

Dukungan multi-akun: gunakan `channels.matrix.accounts` dengan kredensial per akun dan `name` opsional. Lihat [Referensi konfigurasi](/gateway/configuration-reference#multi-account-all-channels) untuk pola bersama.

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
cold start berikutnya dapat memuat backup key yang baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` ringkas secara default (termasuk logging SDK internal yang sunyi) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat scripting.

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda meneruskan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, tetapkan `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` setiap kali Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi menunjuk ke kunci config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

### Arti "terverifikasi"

OpenClaw menganggap perangkat Matrix ini terverifikasi hanya jika perangkat tersebut diverifikasi oleh identitas cross-signing Anda sendiri.
Dalam praktiknya, `openclaw matrix verify status --verbose` mengekspos tiga sinyal kepercayaan:

- `Locally trusted`: perangkat ini dipercaya hanya oleh klien saat ini
- `Cross-signing verified`: SDK melaporkan perangkat sebagai terverifikasi melalui cross-signing
- `Signed by owner`: perangkat ditandatangani oleh self-signing key milik Anda sendiri

`Verified by owner` menjadi `yes` hanya saat verifikasi cross-signing atau owner-signing ada.
Kepercayaan lokal saja tidak cukup bagi OpenClaw untuk menganggap perangkat sepenuhnya terverifikasi.

### Fungsi bootstrap

`openclaw matrix verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun Matrix terenkripsi.
Perintah ini melakukan semua hal berikut secara berurutan:

- mem-bootstrap secret storage, menggunakan kembali recovery key yang sudah ada bila memungkinkan
- mem-bootstrap cross-signing dan mengunggah public cross-signing keys yang hilang
- mencoba menandai dan me-cross-sign perangkat saat ini
- membuat backup room-key sisi server baru jika belum ada

Jika homeserver memerlukan auth interaktif untuk mengunggah cross-signing keys, OpenClaw mencoba unggahan tanpa auth terlebih dahulu, lalu dengan `m.login.dummy`, lalu dengan `m.login.password` saat `channels.matrix.password` dikonfigurasi.

Gunakan `--force-reset-cross-signing` hanya saat Anda memang ingin membuang identitas cross-signing saat ini dan membuat yang baru.

Jika Anda memang ingin membuang backup room-key saat ini dan memulai baseline backup
baru untuk pesan mendatang, gunakan `openclaw matrix verify backup reset --yes`.
Lakukan ini hanya jika Anda menerima bahwa riwayat terenkripsi lama yang tidak dapat dipulihkan akan tetap
tidak tersedia dan bahwa OpenClaw dapat membuat ulang secret storage jika secret backup saat ini
tidak dapat dimuat dengan aman.

### Baseline backup baru

Jika Anda ingin menjaga agar pesan terenkripsi di masa depan tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Tambahkan `--account <id>` ke setiap perintah saat Anda ingin secara eksplisit menargetkan akun Matrix bernama.

### Perilaku startup

Saat `encryption: true`, Matrix secara default menetapkan `startupVerification` ke `"if-unverified"`.
Saat startup, jika perangkat ini masih belum terverifikasi, Matrix akan meminta self-verification di klien Matrix lain,
melewati permintaan duplikat saat sudah ada satu yang tertunda, dan menerapkan cooldown lokal sebelum mencoba lagi setelah restart.
Upaya permintaan yang gagal akan mencoba ulang lebih cepat daripada pembuatan permintaan yang berhasil secara default.
Tetapkan `startupVerification: "off"` untuk menonaktifkan permintaan startup otomatis, atau atur `startupVerificationCooldownHours`
jika Anda menginginkan jendela coba ulang yang lebih pendek atau lebih panjang.

Startup juga melakukan pass bootstrap crypto yang konservatif secara otomatis.
Pass tersebut mencoba menggunakan kembali secret storage dan identitas cross-signing saat ini terlebih dahulu, dan menghindari reset cross-signing kecuali Anda menjalankan alur perbaikan bootstrap eksplisit.

Jika startup menemukan status bootstrap yang rusak dan `channels.matrix.password` dikonfigurasi, OpenClaw dapat mencoba jalur perbaikan yang lebih ketat.
Jika perangkat saat ini sudah owner-signed, OpenClaw mempertahankan identitas tersebut alih-alih meresetnya secara otomatis.

Upgrade dari plugin Matrix publik sebelumnya:

- OpenClaw secara otomatis menggunakan kembali akun Matrix, access token, dan identitas perangkat yang sama bila memungkinkan.
- Sebelum perubahan migrasi Matrix yang dapat ditindaklanjuti dijalankan, OpenClaw membuat atau menggunakan kembali snapshot pemulihan di `~/Backups/openclaw-migrations/`.
- Jika Anda menggunakan beberapa akun Matrix, tetapkan `channels.matrix.defaultAccount` sebelum upgrade dari tata letak flat-store lama agar OpenClaw tahu akun mana yang harus menerima status lama bersama tersebut.
- Jika plugin sebelumnya menyimpan decryption key backup room-key Matrix secara lokal, startup atau `openclaw doctor --fix` akan mengimpornya secara otomatis ke alur recovery-key baru.
- Jika access token Matrix berubah setelah migrasi disiapkan, startup sekarang memindai root penyimpanan hash token saudara untuk status restore lama yang tertunda sebelum menyerah pada restore backup otomatis.
- Jika access token Matrix berubah kemudian untuk akun, homeserver, dan pengguna yang sama, OpenClaw sekarang mengutamakan penggunaan kembali root hash token yang paling lengkap alih-alih memulai dari direktori status Matrix kosong.
- Pada startup gateway berikutnya, room key yang telah dibackup dipulihkan secara otomatis ke crypto store baru.
- Jika plugin lama memiliki room key hanya-lokal yang tidak pernah dibackup, OpenClaw akan memberi peringatan dengan jelas. Kunci tersebut tidak dapat diekspor secara otomatis dari rust crypto store sebelumnya, sehingga beberapa riwayat terenkripsi lama mungkin tetap tidak tersedia sampai dipulihkan secara manual.
- Lihat [Migrasi Matrix](/install/migrating-matrix) untuk alur upgrade lengkap, batasan, perintah pemulihan, dan pesan migrasi umum.

Status runtime terenkripsi diatur di bawah root hash token per akun, per pengguna dalam
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Direktori tersebut berisi sync store (`bot-storage.json`), crypto store (`crypto/`),
file recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
thread bindings (`thread-bindings.json`), dan status verifikasi startup (`startup-verification.json`)
saat fitur-fitur tersebut digunakan.
Ketika token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root
terbaik yang ada untuk tuple akun/homeserver/pengguna tersebut sehingga status sinkronisasi sebelumnya, status crypto, thread bindings,
dan status verifikasi startup tetap terlihat.

### Model crypto store Node

Matrix E2EE di plugin ini menggunakan jalur Rust crypto `matrix-js-sdk` resmi di Node.
Jalur tersebut mengharapkan persistensi berbasis IndexedDB saat Anda ingin status crypto tetap bertahan setelah restart.

Saat ini OpenClaw menyediakannya di Node dengan cara:

- menggunakan `fake-indexeddb` sebagai shim API IndexedDB yang diharapkan SDK
- memulihkan isi IndexedDB Rust crypto dari `crypto-idb-snapshot.json` sebelum `initRustCrypto`
- mempertahankan isi IndexedDB yang diperbarui kembali ke `crypto-idb-snapshot.json` setelah init dan selama runtime
- menserialisasikan pemulihan dan persist snapshot terhadap `crypto-idb-snapshot.json` dengan advisory file lock agar persistensi runtime gateway dan pemeliharaan CLI tidak saling balapan pada file snapshot yang sama

Ini adalah plumbing kompatibilitas/penyimpanan, bukan implementasi crypto kustom.
File snapshot adalah status runtime sensitif dan disimpan dengan izin file yang ketat.
Dalam model keamanan OpenClaw, host gateway dan direktori status OpenClaw lokal sudah berada di dalam batas operator tepercaya, jadi ini terutama merupakan persoalan durabilitas operasional, bukan batas kepercayaan jarak jauh yang terpisah.

Peningkatan yang direncanakan:

- menambahkan dukungan SecretRef untuk materi key Matrix persisten sehingga recovery key dan secret enkripsi store terkait dapat bersumber dari penyedia secret OpenClaw, bukan hanya file lokal

## Manajemen profil

Perbarui self-profile Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin secara eksplisit menargetkan akun Matrix bernama.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda meneruskan URL avatar `http://` atau `https://`, OpenClaw akan mengunggahnya ke Matrix terlebih dahulu dan menyimpan kembali URL `mxc://` yang sudah diresolusikan ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Pemberitahuan verifikasi otomatis

Matrix sekarang memposting pemberitahuan siklus hidup verifikasi langsung ke room verifikasi DM ketat sebagai pesan `m.notice`.
Ini mencakup:

- pemberitahuan permintaan verifikasi
- pemberitahuan verifikasi siap (dengan panduan eksplisit "Verify by emoji")
- pemberitahuan mulai dan selesai verifikasi
- detail SAS (emoji dan desimal) bila tersedia

Permintaan verifikasi masuk dari klien Matrix lain dilacak dan diterima otomatis oleh OpenClaw.
Untuk alur self-verification, OpenClaw juga memulai alur SAS secara otomatis saat verifikasi emoji tersedia dan mengonfirmasi sisinya sendiri.
Untuk permintaan verifikasi dari pengguna/perangkat Matrix lain, OpenClaw menerima permintaan secara otomatis lalu menunggu alur SAS berjalan secara normal.
Anda tetap perlu membandingkan emoji atau SAS desimal di klien Matrix Anda dan mengonfirmasi "They match" di sana untuk menyelesaikan verifikasi.

OpenClaw tidak menerima otomatis alur duplikat yang dimulai sendiri secara membabi buta. Startup melewati pembuatan permintaan baru saat permintaan self-verification sudah tertunda.

Pemberitahuan protokol/sistem verifikasi tidak diteruskan ke pipeline chat agen, sehingga tidak menghasilkan `NO_REPLY`.

### Kebersihan perangkat

Perangkat Matrix yang dikelola OpenClaw lama dapat menumpuk di akun dan membuat kepercayaan room terenkripsi lebih sulit dipahami.
Daftarkan perangkat tersebut dengan:

```bash
openclaw matrix devices list
```

Hapus perangkat OpenClaw terkelola yang usang dengan:

```bash
openclaw matrix devices prune-stale
```

### Perbaikan Direct Room

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke room solo lama, bukan DM aktif. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Perbaikan menjaga logika khusus Matrix tetap berada di dalam plugin:

- plugin mengutamakan DM 1:1 ketat yang sudah dipetakan di `m.direct`
- jika tidak, plugin kembali ke DM 1:1 ketat mana pun yang saat ini sudah diikuti dengan pengguna tersebut
- jika tidak ada DM sehat, plugin membuat direct room baru dan menulis ulang `m.direct` agar menunjuk ke room tersebut

Alur perbaikan tidak menghapus room lama secara otomatis. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lainnya kembali menargetkan room yang benar.

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis dan pengiriman alat pesan.

- `threadReplies: "off"` menjaga balasan tetap di tingkat atas dan menjaga pesan ber-thread masuk tetap pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya saat pesan masuk sudah berada di thread tersebut.
- `threadReplies: "always"` menjaga balasan room tetap di thread yang berakar pada pesan pemicu dan merutekan percakapan tersebut melalui sesi bercakupan thread yang cocok dari pesan pemicu pertama.
- `dm.threadReplies` menimpa setelan tingkat atas hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan ber-thread masuk menyertakan pesan akar thread sebagai konteks agen tambahan.
- Pengiriman alat pesan kini otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali jika `threadId` eksplisit diberikan.
- Thread bindings saat runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` terikat thread kini berfungsi di room dan DM Matrix.
- `/focus` room/DM Matrix tingkat atas membuat thread Matrix baru dan mengikatnya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan mengikat thread saat ini sebagai gantinya.

## Binding percakapan ACP

Room, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang persisten tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, room, atau thread yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau room Matrix tingkat atas, DM/room saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang telah di-spawn.
- Di dalam thread Matrix yang sudah ada, `--bind here` mengikat thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat thread Matrix turunan.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau mengikat thread Matrix turunan.

### Konfigurasi Thread Binding

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat thread Matrix bersifat opt-in:

- Tetapkan `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` tingkat atas membuat dan mengikat thread Matrix baru.
- Tetapkan `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` mengikat sesi ACP ke thread Matrix.

## Reaksi

Matrix mendukung tindakan reaksi keluar, notifikasi reaksi masuk, dan reaksi ack masuk.

- Tooling reaksi keluar digate oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaksi ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaksi milik akun bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari akun bot.

Cakupan reaksi ack diresolusikan dalam urutan standar OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen

Cakupan reaksi ack diresolusikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaksi diresolusikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku saat ini:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat event tersebut menargetkan pesan Matrix buatan bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi masih belum disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room Matrix memicu agen.
- Ini kembali ke `messages.groupChat.historyLimit`. Tetapkan `0` untuk menonaktifkan.
- Riwayat room Matrix hanya untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw men-buffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela tersebut saat mention atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di body masuk utama untuk giliran itu.
- Percobaan ulang event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol `contextVisibility` bersama untuk konteks room tambahan seperti teks balasan yang diambil, akar thread, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap menyimpan satu balasan kutipan eksplisit.

Setelan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari setelan `groupPolicy`, `groups`, `groupAllowFrom`, dan kebijakan DM.

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

Lihat [Groups](/channels/groups) untuk perilaku penggatingan mention dan allowlist.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirim pesan kepada Anda sebelum persetujuan, OpenClaw menggunakan kembali kode pairing tertunda yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih mencetak kode baru.

Lihat [Pairing](/channels/pairing) untuk alur pairing DM dan tata letak penyimpanan bersama.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan exec untuk akun Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; kembali ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan exec native saat `enabled` tidak ditetapkan atau `"auto"` dan setidaknya satu approver dapat diresolusikan, baik dari `execApprovals.approvers` atau dari `channels.matrix.dm.allowFrom`. Tetapkan `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan kembali ke rute persetujuan lain yang dikonfigurasi atau ke kebijakan fallback persetujuan exec.

Perutean native Matrix saat ini hanya untuk exec:

- `channels.matrix.execApprovals.*` mengontrol perutean DM/channel native hanya untuk persetujuan exec.
- Persetujuan plugin tetap menggunakan `/approve` di chat yang sama bersama dengan forwarding `approvals.plugin` yang dikonfigurasi.
- Matrix tetap dapat menggunakan kembali `channels.matrix.dm.allowFrom` untuk otorisasi persetujuan plugin saat Matrix dapat menyimpulkan approver dengan aman, tetapi Matrix tidak mengekspos jalur fanout DM/channel persetujuan plugin native yang terpisah.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Saat ini Matrix menggunakan prompt persetujuan berbasis teks. Approver menyelesaikannya dengan `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang teresolusikan yang dapat menyetujui atau menolak. Pengiriman ke channel menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Prompt persetujuan Matrix menggunakan kembali planner persetujuan inti bersama. Permukaan native khusus Matrix hanyalah transport untuk persetujuan exec: perutean room/DM dan perilaku kirim/perbarui/hapus pesan.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Persetujuan exec](/tools/exec-approvals)

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

Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali jika sebuah akun menimpanya.
Anda dapat mencakup entri room turunan ke satu akun Matrix dengan `groups.<room>.account` (atau `rooms.<room>.account` lama).
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi saat akun default dikonfigurasi langsung di `channels.matrix.*` tingkat atas.
Default auth bersama parsial tidak dengan sendirinya membuat akun default implisit terpisah. OpenClaw hanya mensintesis akun tingkat atas `default` saat default tersebut memiliki auth yang baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama tetap dapat ditemukan dari `homeserver` plus `userId` saat kredensial cache memenuhi auth nanti.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang sudah ada, promosi perbaikan/penyiapan dari akun tunggal ke multi-akun mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap di tingkat atas.
Tetapkan `defaultAccount` saat Anda ingin OpenClaw mengutamakan satu akun Matrix bernama untuk perutean implisit, probing, dan operasi CLI.
Jika Anda mengonfigurasi beberapa akun bernama, tetapkan `defaultAccount` atau teruskan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Teruskan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin menimpa pemilihan implisit tersebut untuk satu perintah.

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
`http://matrix.example.org:8008` tetap diblokir. Utamakan `https://` bila memungkinkan.

## Mem-proxy lalu lintas Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) keluar eksplisit, tetapkan `channels.matrix.proxy`:

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

Akun bernama dapat menimpa default tingkat atas dengan `channels.matrix.accounts.<id>.proxy` miliknya sendiri.
OpenClaw menggunakan setelan proxy yang sama untuk lalu lintas Matrix saat runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target ini di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

Lookup direktori live menggunakan akun Matrix yang sudah login:

- Lookup pengguna mengueri direktori pengguna Matrix di homeserver tersebut.
- Lookup room menerima ID room dan alias eksplisit secara langsung, lalu kembali ke pencarian nama room yang sudah diikuti untuk akun tersebut.
- Lookup nama room yang sudah diikuti bersifat best-effort. Jika nama room tidak dapat diresolusikan menjadi ID atau alias, nama tersebut diabaikan oleh resolusi allowlist saat runtime.

## Referensi konfigurasi

- `enabled`: aktifkan atau nonaktifkan channel.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `allowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini saat homeserver diresolusikan ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat menimpa default tingkat atas dengan `proxy` miliknya sendiri.
- `userId`: ID pengguna Matrix penuh, misalnya `@bot:example.org`.
- `accessToken`: access token untuk auth berbasis token. Nilai plaintext dan SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh penyedia env/file/exec. Lihat [Secrets Management](/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar diri yang tersimpan untuk sinkronisasi profil dan pembaruan `set-profile`.
- `initialSyncLimit`: batas event sinkronisasi saat startup.
- `encryption`: aktifkan E2EE.
- `allowlistOnly`: paksa perilaku hanya-allowlist untuk DM dan room.
- `allowBots`: izinkan pesan dari akun Matrix OpenClaw lain yang dikonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room.
- Entri `groupAllowFrom` harus berupa ID pengguna Matrix penuh. Nama yang tidak teresolusikan diabaikan saat runtime.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Kembali ke `messages.groupChat.historyLimit`. Tetapkan `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, atau `all`.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `partial`, `true`, atau `false`. `partial` dan `true` mengaktifkan pratinjau draf satu pesan dengan pembaruan edit-di-tempat.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang selesai saat streaming pratinjau draf aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per channel untuk perutean sesi terikat thread dan siklus hidupnya.
- `startupVerification`: mode permintaan self-verification otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba ulang permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar.
- `chunkMode`: `length` atau `newline`.
- `responsePrefix`: prefiks pesan opsional untuk balasan keluar.
- `ackReaction`: override reaksi ack opsional untuk channel/akun ini.
- `ackReactionScope`: override cakupan reaksi ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk penanganan media Matrix. Berlaku untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan auto-join undangan (`always`, `allowlist`, `off`). Default: `off`.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `allowlist`. Entri alias diresolusikan menjadi ID room selama penanganan undangan; OpenClaw tidak mempercayai status alias yang diklaim oleh room yang mengundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- Entri `dm.allowFrom` harus berupa ID pengguna Matrix penuh kecuali Anda sudah meresolusikannya melalui lookup direktori live.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Menimpa setelan `threadReplies` tingkat atas untuk penempatan balasan dan isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui permintaan exec. Opsional jika `dm.allowFrom` sudah mengidentifikasi approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override bernama per akun. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per room. Utamakan ID room atau alias; nama room yang tidak teresolusikan diabaikan saat runtime. Identitas sesi/grup menggunakan ID room stabil setelah resolusi, sementara label yang dapat dibaca manusia tetap berasal dari nama room.
- `groups.<room>.account`: batasi satu entri room turunan ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot yang dikonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per room.
- `groups.<room>.tools`: override izinkan/tolak alat per room.
- `groups.<room>.autoReply`: override penggatingan mention tingkat room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill tingkat room opsional.
- `groups.<room>.systemPrompt`: cuplikan system prompt tingkat room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: gating alat per tindakan (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Ikhtisar Channels](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku chat grup dan penggatingan mention
- [Perutean Channel](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan hardening
