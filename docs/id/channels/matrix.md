---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan matriks, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix adalah plugin channel bawaan untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaction, poll, lokasi, dan E2EE.

## Plugin bawaan

Matrix dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan pemasangan terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Matrix, pasang secara manual:

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
   - Rilis OpenClaw terpaket saat ini sudah membundel plugin tersebut.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Matrix di homeserver Anda.
3. Konfigurasikan `channels.matrix` dengan salah satu dari:
   - `homeserver` + `accessToken`, atau
   - `homeserver` + `userId` + `password`.
4. Mulai ulang gateway.
5. Mulai DM dengan bot atau undang bot ke sebuah room.
   - Undangan Matrix baru hanya berfungsi jika `channels.matrix.autoJoin` mengizinkannya.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard Matrix akan meminta:

- URL homeserver
- metode autentikasi: access token atau password
- ID pengguna (hanya autentikasi password)
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room dan auto-join undangan

Perilaku utama wizard:

- Jika variabel lingkungan autentikasi Matrix sudah ada dan akun tersebut belum memiliki autentikasi yang disimpan di konfigurasi, wizard menawarkan pintasan env agar autentikasi tetap berada di variabel lingkungan.
- Nama akun dinormalisasi ke ID akun. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Entri allowlist DM menerima `@user:server` secara langsung; nama tampilan hanya berfungsi bila pencarian direktori langsung menemukan satu kecocokan yang tepat.
- Entri allowlist room menerima ID room dan alias secara langsung. Sebaiknya gunakan `!room:server` atau `#alias:server`; nama yang tidak terselesaikan diabaikan saat runtime oleh resolusi allowlist.
- Dalam mode allowlist auto-join undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Untuk menyelesaikan nama room sebelum menyimpan, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` secara default adalah `off`.

Jika Anda membiarkannya tidak diatur, bot tidak akan bergabung ke room yang mengundangnya atau undangan gaya DM baru, sehingga bot tidak akan muncul di grup baru atau DM undangan kecuali Anda bergabung secara manual terlebih dahulu.

Atur `autoJoin: "allowlist"` bersama dengan `autoJoinAllowlist` untuk membatasi undangan mana yang diterima, atau atur `autoJoin: "always"` jika Anda ingin bot bergabung ke setiap undangan.

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

Bergabung ke setiap undangan:

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
Ketika kredensial cache ada di sana, OpenClaw memperlakukan Matrix sebagai sudah dikonfigurasi untuk penyiapan, doctor, dan penemuan status channel meskipun autentikasi saat ini tidak diatur langsung di konfigurasi.

Padanan variabel lingkungan (digunakan saat kunci konfigurasi tidak diatur):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Untuk akun non-default, gunakan variabel lingkungan dengan cakupan akun:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Contoh untuk akun `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Untuk ID akun ternormalisasi `ops-bot`, gunakan:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix mengeksekusi escape pada tanda baca di ID akun agar variabel lingkungan bercakupan tidak bertabrakan.
Misalnya, `-` menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var saat variabel lingkungan autentikasi tersebut sudah ada dan akun yang dipilih belum memiliki autentikasi Matrix yang disimpan di konfigurasi.

`MATRIX_HOMESERVER` tidak dapat diatur dari `.env` workspace; lihat [file `.env` workspace](/id/gateway/security).

## Contoh konfigurasi

Ini adalah konfigurasi dasar praktis dengan pairing DM, allowlist room, dan E2EE yang diaktifkan:

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

`autoJoin` berlaku untuk semua undangan Matrix, termasuk undangan gaya DM. OpenClaw tidak dapat secara andal
mengklasifikasikan room yang diundang sebagai DM atau grup pada saat undangan, sehingga semua undangan melewati `autoJoin`
terlebih dahulu. `dm.policy` berlaku setelah bot bergabung dan room diklasifikasikan sebagai DM.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Atur `channels.matrix.streaming` ke `"partial"` saat Anda ingin OpenClaw mengirim satu balasan pratinjau langsung,
mengedit pratinjau itu di tempat saat model sedang menghasilkan teks, lalu memfinalkannya saat
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

- `streaming: "off"` adalah default. OpenClaw menunggu balasan akhir dan mengirimkannya satu kali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix normal. Ini mempertahankan perilaku notifikasi lama Matrix yang mendahulukan pratinjau, sehingga klien bawaan dapat memberi notifikasi pada teks pratinjau streaming pertama, bukan pada blok yang selesai.
- `streaming: "quiet"` membuat satu notifikasi pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi aturan push penerima untuk edit pratinjau yang telah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan streaming pratinjau diaktifkan, Matrix mempertahankan draf langsung untuk blok saat ini dan menyimpan blok yang telah selesai sebagai pesan terpisah.
- Saat streaming pratinjau aktif dan `blockStreaming` nonaktif, Matrix mengedit draf langsung di tempat dan memfinalkan event yang sama itu saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman akhir normal.
- Balasan media tetap mengirim lampiran secara normal. Jika pratinjau lama tidak lagi dapat digunakan ulang dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media akhir.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate-limit yang paling konservatif.

`blockStreaming` tidak dengan sendirinya mengaktifkan pratinjau draf.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang telah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa aturan push kustom, gunakan `streaming: "partial"` untuk perilaku pratinjau-terlebih-dahulu atau biarkan `streaming` nonaktif untuk pengiriman akhir saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang selesai sebagai pesan Matrix normal yang memberi notifikasi.
- `blockStreaming: false` hanya mengirim balasan akhir yang sudah selesai sebagai pesan Matrix normal yang memberi notifikasi.

### Aturan push self-hosted untuk pratinjau final senyap

Streaming senyap (`streaming: "quiet"`) hanya memberi notifikasi kepada penerima setelah sebuah blok atau giliran difinalkan — aturan push per pengguna harus cocok dengan penanda pratinjau yang telah difinalkan. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk penyiapan lengkapnya (token penerima, pemeriksaan pusher, pemasangan aturan, catatan per homeserver).

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang sudah dikonfigurasi akan diabaikan.

Gunakan `allowBots` saat Anda memang menginginkan lalu lintas Matrix antar agen:

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

- `allowBots: true` menerima pesan dari akun bot Matrix lain yang telah dikonfigurasi di room dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya saat mereka secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balas ke diri sendiri.
- Matrix tidak mengekspos penanda bot bawaan di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang telah dikonfigurasi pada gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkap. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

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

Perintah verifikasi (semuanya menerima `--verbose` untuk diagnostik dan `--json` untuk output yang dapat dibaca mesin):

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

Perintah ini melaporkan tiga status terpisah:

- `Recovery key accepted`: Matrix menerima recovery key untuk penyimpanan rahasia atau kepercayaan perangkat.
- `Backup usable`: backup kunci room dapat dimuat dengan materi recovery tepercaya.
- `Device verified by owner`: perangkat OpenClaw saat ini memiliki kepercayaan identitas cross-signing Matrix penuh.

`Signed by owner` dalam output verbose atau JSON hanya bersifat diagnostik. OpenClaw tidak
menganggap itu cukup kecuali `Cross-signing verified` juga bernilai `yes`.

Perintah ini tetap keluar dengan status non-zero ketika kepercayaan identitas Matrix penuh belum lengkap,
meskipun recovery key dapat membuka materi backup. Dalam kasus itu, selesaikan
verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

Terima permintaan tersebut di klien Matrix lain, bandingkan emoji atau angka SAS,
dan ketik `yes` hanya jika keduanya cocok. Perintah ini menunggu hingga Matrix melaporkan
`Cross-signing verified: yes` sebelum keluar dengan sukses.

Gunakan `verify bootstrap --force-reset-cross-signing` hanya jika Anda memang
ingin mengganti identitas cross-signing saat ini.

Detail verifikasi perangkat verbose:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Periksa kesehatan backup kunci room:

```bash
openclaw matrix verify backup status
```

Diagnostik kesehatan backup verbose:

```bash
openclaw matrix verify backup status --verbose
```

Pulihkan kunci room dari backup server:

```bash
openclaw matrix verify backup restore
```

Jika kunci backup belum dimuat di disk, berikan recovery key Matrix:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Alur verifikasi mandiri interaktif:

```bash
openclaw matrix verify self
```

Untuk permintaan verifikasi tingkat lebih rendah atau masuk, gunakan:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Gunakan `openclaw matrix verify cancel <id>` untuk membatalkan permintaan.

Diagnostik pemulihan verbose:

```bash
openclaw matrix verify backup restore --verbose
```

Hapus backup server saat ini dan buat baseline backup baru. Jika kunci
backup yang tersimpan tidak dapat dimuat dengan bersih, reset ini juga dapat membuat ulang secret storage sehingga
cold start berikutnya dapat memuat kunci backup baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` bersifat ringkas secara default (termasuk logging SDK internal yang senyap) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat membuat skrip.

Dalam pengaturan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda memberikan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, atur `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` kapan pun Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi menunjuk ke kunci konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Apa arti verified">
    OpenClaw menganggap perangkat sebagai verified hanya ketika identitas cross-signing Anda sendiri menandatanganinya. `verify status --verbose` menampilkan tiga sinyal kepercayaan:

    - `Locally trusted`: dipercaya hanya oleh klien ini
    - `Cross-signing verified`: SDK melaporkan verifikasi melalui cross-signing
    - `Signed by owner`: ditandatangani oleh kunci self-signing Anda sendiri

    `Verified by owner` menjadi `yes` hanya ketika verifikasi cross-signing ada.
    Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup bagi OpenClaw untuk memperlakukan
    perangkat sebagai sepenuhnya terverifikasi.

  </Accordion>

  <Accordion title="Apa yang dilakukan bootstrap">
    `verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

    - melakukan bootstrap secret storage, menggunakan kembali recovery key yang ada bila memungkinkan
    - melakukan bootstrap cross-signing dan mengunggah kunci cross-signing publik yang belum ada
    - menandai dan menandatangani silang perangkat saat ini
    - membuat backup kunci room sisi server jika belum ada

    Jika homeserver memerlukan UIA untuk mengunggah kunci cross-signing, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, kemudian `m.login.password` (memerlukan `channels.matrix.password`). Gunakan `--force-reset-cross-signing` hanya saat memang ingin membuang identitas saat ini.

  </Accordion>

  <Accordion title="Baseline backup baru">
    Jika Anda ingin menjaga agar pesan terenkripsi di masa depan tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Tambahkan `--account <id>` untuk menargetkan akun bernama. Ini juga dapat membuat ulang secret storage jika rahasia backup saat ini tidak dapat dimuat dengan aman.
    Tambahkan `--rotate-recovery-key` hanya jika Anda memang ingin recovery key lama
    tidak lagi dapat membuka baseline backup baru.

  </Accordion>

  <Accordion title="Perilaku saat startup">
    Dengan `encryption: true`, `startupVerification` default-nya adalah `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikasi dan menerapkan cooldown. Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan proses bootstrap crypto konservatif yang menggunakan kembali secret storage dan identitas cross-signing saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan yang dijaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan password UIA, startup mencatat peringatan dan tetap tidak fatal. Perangkat yang sudah ditandatangani pemilik tetap dipertahankan.

    Lihat [Migrasi Matrix](/id/install/migrating-matrix) untuk alur upgrade lengkap.

  </Accordion>

  <Accordion title="Pemberitahuan verifikasi">
    Matrix memposting pemberitahuan siklus hidup verifikasi ke room DM verifikasi ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verify by emoji"), mulai/selesai, dan detail SAS (emoji/angka) bila tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri begitu verifikasi emoji tersedia — Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

    Pemberitahuan sistem verifikasi tidak diteruskan ke pipeline chat agen.

  </Accordion>

  <Accordion title="Perangkat Matrix yang dihapus atau tidak valid">
    Jika `verify status` mengatakan perangkat saat ini tidak lagi terdaftar di
    homeserver, buat perangkat Matrix OpenClaw baru. Untuk login dengan password:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Untuk autentikasi token, buat access token baru di klien Matrix atau UI admin Anda,
    lalu perbarui OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Ganti `assistant` dengan ID akun dari perintah yang gagal, atau hilangkan
    `--account` untuk akun default.

  </Accordion>

  <Accordion title="Kebersihan perangkat">
    Perangkat lama yang dikelola OpenClaw dapat menumpuk. Daftar dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Penyimpanan crypto">
    Matrix E2EE menggunakan jalur crypto Rust `matrix-js-sdk` resmi dengan `fake-indexeddb` sebagai shim IndexedDB. Status crypto disimpan ke `crypto-idb-snapshot.json` (izin file ketat).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup sync store, crypto store, recovery key, snapshot IDB, binding thread, dan status verifikasi startup. Saat token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang sudah ada sehingga status sebelumnya tetap terlihat.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui profil diri Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin menargetkan akun Matrix bernama secara eksplisit.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda memberikan URL avatar `http://` atau `https://`, OpenClaw akan mengunggahnya ke Matrix terlebih dahulu dan menyimpan URL `mxc://` yang telah di-resolve kembali ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Thread

Matrix mendukung thread Matrix native baik untuk balasan otomatis maupun pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) menjaga perutean DM Matrix tetap berbasis pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya di-resolve ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke kunci sesi masing-masing sambil tetap menggunakan autentikasi DM normal dan pemeriksaan allowlist.
- Binding percakapan Matrix eksplisit tetap lebih diutamakan daripada `dm.sessionScope`, sehingga room dan thread yang terikat mempertahankan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap di level teratas dan mempertahankan pesan ber-thread yang masuk pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya ketika pesan masuk memang sudah berada di thread tersebut.
- `threadReplies: "always"` mempertahankan balasan room di sebuah thread yang berakar pada pesan pemicu dan merutekan percakapan itu melalui sesi bercakupan thread yang cocok dari pesan pemicu pertama.
- `dm.threadReplies` menimpa pengaturan tingkat atas hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan ber-thread yang masuk menyertakan pesan akar thread sebagai konteks agen tambahan.
- Pengiriman message-tool secara otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM untuk sesi yang sama hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal berbasis pengguna.
- Ketika OpenClaw melihat sebuah room DM Matrix bertabrakan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room tersebut dengan escape hatch `/focus` saat binding thread diaktifkan dan petunjuk `dm.sessionScope`.
- Binding thread runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread berfungsi di room dan DM Matrix.
- `/focus` Matrix room/DM level atas membuat thread Matrix baru dan mengikatnya ke sesi target ketika `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan mengikat thread saat ini itu.

## Binding percakapan ACP

Room, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang persisten tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM, room, atau thread Matrix yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau room Matrix level atas, DM/room saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam thread Matrix yang sudah ada, `--bind here` mengikat thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat thread Matrix anak.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau mengikat thread Matrix anak.

### Konfigurasi binding thread

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per-channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat thread Matrix bersifat opt-in:

- Atur `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` level atas membuat dan mengikat thread Matrix baru.
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

Cakupan reaksi ack di-resolve dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaksi di-resolve dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat event tersebut menargetkan pesan Matrix yang dibuat bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` ketika pesan room Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- Riwayat room Matrix hanya berlaku untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw membuffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela itu saat mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di body masuk utama untuk giliran itu.
- Percobaan ulang untuk event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser ke depan ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks room tambahan seperti teks balasan yang diambil, akar thread, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari `groupPolicy`, `groups`, `groupAllowFrom`, dan pengaturan kebijakan DM.

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

Jika pengguna Matrix yang belum disetujui terus mengirim pesan kepada Anda sebelum persetujuan, OpenClaw menggunakan kembali kode pairing tertunda yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanannya.

## Perbaikan room direct

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke room solo lama alih-alih DM aktif. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Alur perbaikan:

- memprioritaskan DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat mana pun yang saat ini sudah diikuti dengan pengguna tersebut
- membuat room direct baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Alur perbaikan tidak menghapus room lama secara otomatis. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lainnya kembali menargetkan room yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native untuk akun Matrix. Pengaturan
perutean DM/channel native tetap berada di bawah konfigurasi persetujuan exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Pemberi persetujuan harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan native ketika `enabled` tidak diatur atau `"auto"` dan setidaknya satu pemberi persetujuan dapat di-resolve. Persetujuan exec menggunakan `execApprovals.approvers` terlebih dahulu dan dapat fallback ke `channels.matrix.dm.allowFrom`. Persetujuan plugin mengotorisasi melalui `channels.matrix.dm.allowFrom`. Atur `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Permintaan persetujuan selain itu akan fallback ke rute persetujuan terkonfigurasi lain atau kebijakan fallback persetujuan.

Perutean native Matrix mendukung kedua jenis persetujuan:

- `channels.matrix.execApprovals.*` mengontrol mode fanout DM/channel native untuk prompt persetujuan Matrix.
- Persetujuan exec menggunakan kumpulan pemberi persetujuan exec dari `execApprovals.approvers` atau `channels.matrix.dm.allowFrom`.
- Persetujuan plugin menggunakan allowlist DM Matrix dari `channels.matrix.dm.allowFrom`.
- Pintasan reaksi Matrix dan pembaruan pesan berlaku untuk persetujuan exec maupun plugin.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM pemberi persetujuan
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM pemberi persetujuan dan room atau DM Matrix asal

Prompt persetujuan Matrix menanamkan pintasan reaksi pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = izinkan selalu ketika keputusan itu diizinkan oleh kebijakan exec efektif

Pemberi persetujuan dapat bereaksi pada pesan itu atau menggunakan perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya pemberi persetujuan yang berhasil di-resolve yang dapat menyetujui atau menolak. Untuk persetujuan exec, pengiriman channel menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumen terkait: [Persetujuan exec](/id/tools/exec-approvals)

## Perintah slash

Perintah slash Matrix (misalnya `/new`, `/reset`, `/model`) berfungsi langsung di DM. Di room, OpenClaw juga mengenali perintah slash yang diawali dengan mention Matrix bot itu sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa memerlukan regex mention kustom. Ini membuat bot tetap responsif terhadap kiriman gaya room `@mention /command` yang dihasilkan Element dan klien serupa ketika pengguna melakukan tab-complete bot sebelum mengetik perintah.

Aturan otorisasi tetap berlaku: pengirim perintah harus memenuhi kebijakan allowlist atau owner untuk DM atau room seperti pesan biasa.

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

Nilai `channels.matrix` level atas bertindak sebagai default untuk akun bernama kecuali sebuah akun menimpanya.
Anda dapat memberi cakupan entri room turunan ke satu akun Matrix dengan `groups.<room>.account`.
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi ketika akun default dikonfigurasi langsung pada `channels.matrix.*` level atas.
Default autentikasi bersama parsial tidak dengan sendirinya membuat akun default implisit terpisah. OpenClaw hanya mensintesis akun `default` level atas ketika default tersebut memiliki autentikasi baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama tetap dapat ditemukan dari `homeserver` plus `userId` ketika kredensial cache memenuhi autentikasi kemudian.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang ada, promosi perbaikan/penyiapan dari akun tunggal ke multi-akun mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap di level atas.
Atur `defaultAccount` saat Anda ingin OpenClaw lebih memilih satu akun Matrix bernama untuk perutean implisit, probing, dan operasi CLI.
Jika beberapa akun Matrix dikonfigurasi dan satu ID akun adalah `default`, OpenClaw menggunakan akun itu secara implisit meskipun `defaultAccount` tidak diatur.
Jika Anda mengonfigurasi beberapa akun bernama, atur `defaultAccount` atau berikan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Berikan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin menimpa pilihan implisit itu untuk satu perintah.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit memilih untuk mengizinkannya per akun.

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
`http://matrix.example.org:8008` tetap diblokir. Sebaiknya gunakan `https://` bila memungkinkan.

## Proxy lalu lintas Matrix

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

Akun bernama dapat menimpa default level atas dengan `channels.matrix.accounts.<id>.proxy`.
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas Matrix runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

ID room Matrix peka huruf besar-kecil. Gunakan kapitalisasi ID room Matrix yang tepat
saat mengonfigurasi target pengiriman eksplisit, Cron, binding, atau allowlist.
OpenClaw menjaga kunci sesi internal tetap kanonis untuk penyimpanan, sehingga kunci
huruf kecil tersebut bukan sumber yang andal untuk ID pengiriman Matrix.

Pencarian direktori langsung menggunakan akun Matrix yang sedang login:

- Pencarian pengguna melakukan kueri ke direktori pengguna Matrix di homeserver tersebut.
- Pencarian room menerima ID room dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang sudah diikuti untuk akun tersebut.
- Pencarian nama room yang sudah diikuti bersifat best-effort. Jika nama room tidak dapat di-resolve menjadi ID atau alias, nama itu diabaikan oleh resolusi allowlist saat runtime.

## Referensi konfigurasi

- `enabled`: mengaktifkan atau menonaktifkan channel.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun yang diprioritaskan ketika beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini ketika homeserver di-resolve ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat menimpa default level atas dengan `proxy` mereka sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk autentikasi berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh provider env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar diri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sinkronisasi startup.
- `encryption`: mengaktifkan E2EE.
- `allowlistOnly`: ketika `true`, meningkatkan kebijakan room `open` menjadi `allowlist`, dan memaksa semua kebijakan DM aktif kecuali `disabled` (termasuk `pairing` dan `open`) menjadi `allowlist`. Tidak memengaruhi kebijakan `disabled`.
- `allowBots`: mengizinkan pesan dari akun Matrix OpenClaw lain yang telah dikonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room. ID pengguna Matrix lengkap paling aman; kecocokan direktori eksak di-resolve saat startup dan ketika allowlist berubah saat monitor berjalan. Nama yang tidak ter-resolve diabaikan.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Atur `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `"partial"`, `"quiet"`, `true`, atau `false`. `"partial"` dan `true` mengaktifkan pembaruan draf pratinjau-terlebih-dahulu dengan pesan teks Matrix normal. `"quiet"` menggunakan pemberitahuan pratinjau tanpa notifikasi untuk penyiapan aturan push self-hosted. `false` setara dengan `"off"`.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang telah selesai saat streaming pratinjau draf aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per-channel untuk perutean dan siklus hidup sesi terikat thread.
- `startupVerification`: mode permintaan verifikasi mandiri otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba ulang permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran potongan pesan keluar dalam karakter (berlaku saat `chunkMode` adalah `length`).
- `chunkMode`: `length` membagi pesan berdasarkan jumlah karakter; `newline` membagi pada batas baris.
- `responsePrefix`: string opsional yang ditambahkan di depan semua balasan keluar untuk channel ini.
- `ackReaction`: override reaksi ack opsional untuk channel/akun ini.
- `ackReactionScope`: override cakupan reaksi ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan auto-join undangan (`always`, `allowlist`, `off`). Default: `off`. Berlaku untuk semua undangan Matrix, termasuk undangan gaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan ketika `autoJoin` adalah `allowlist`. Entri alias di-resolve menjadi ID room selama penanganan undangan; OpenClaw tidak mempercayai status alias yang diklaim oleh room yang mengundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan akan di-auto-join.
- `dm.allowFrom`: allowlist ID pengguna untuk lalu lintas DM. ID pengguna Matrix lengkap paling aman; kecocokan direktori eksak di-resolve saat startup dan ketika allowlist berubah saat monitor berjalan. Nama yang tidak ter-resolve diabaikan.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Ini menimpa pengaturan `threadReplies` level atas untuk penempatan balasan maupun isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui permintaan exec. Opsional ketika `dm.allowFrom` sudah mengidentifikasi para pemberi persetujuan.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override bernama per akun. Nilai `channels.matrix` level atas bertindak sebagai default untuk entri ini.
- `groups`: map kebijakan per-room. Sebaiknya gunakan ID room atau alias; nama room yang tidak ter-resolve diabaikan saat runtime. Identitas sesi/grup menggunakan ID room stabil setelah resolusi.
- `groups.<room>.account`: membatasi satu entri room turunan ke akun Matrix tertentu dalam pengaturan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot yang telah dikonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per-room.
- `groups.<room>.tools`: override allow/deny tool per-room.
- `groups.<room>.autoReply`: override mention-gating tingkat room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` mengaktifkannya kembali secara paksa.
- `groups.<room>.skills`: filter skill tingkat room opsional.
- `groups.<room>.systemPrompt`: cuplikan system prompt tingkat room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: gating tool per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan mention-gating
- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
