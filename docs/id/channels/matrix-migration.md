---
read_when:
    - Memutakhirkan instalasi Matrix yang sudah ada
    - Memigrasikan riwayat Matrix terenkripsi dan status perangkat
summary: Cara OpenClaw memutakhirkan Plugin Matrix sebelumnya secara langsung, termasuk batas pemulihan status terenkripsi dan langkah-langkah pemulihan manual.
title: Migrasi Matrix
x-i18n:
    generated_at: "2026-05-02T22:16:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

Tingkatkan dari plugin publik `matrix` sebelumnya ke implementasi saat ini.

Untuk sebagian besar pengguna, peningkatan dilakukan di tempat:

- plugin tetap `@openclaw/matrix`
- channel tetap `matrix`
- config Anda tetap berada di bawah `channels.matrix`
- kredensial yang di-cache tetap berada di bawah `~/.openclaw/credentials/matrix/`
- status runtime tetap berada di bawah `~/.openclaw/matrix/`

Anda tidak perlu mengganti nama key config atau memasang ulang plugin dengan nama baru.

## Apa yang dilakukan migrasi secara otomatis

Saat Gateway dimulai, dan saat Anda menjalankan [`openclaw doctor --fix`](/id/gateway/doctor), OpenClaw mencoba memperbaiki status Matrix lama secara otomatis.
Sebelum langkah migrasi Matrix yang dapat ditindaklanjuti mengubah status di disk, OpenClaw membuat atau menggunakan ulang snapshot pemulihan yang terfokus.

Saat Anda menggunakan `openclaw update`, pemicu persisnya bergantung pada cara OpenClaw dipasang:

- pemasangan dari source menjalankan `openclaw doctor --fix` selama alur pembaruan, lalu me-restart Gateway secara default
- pemasangan melalui package manager memperbarui package, menjalankan pass doctor non-interaktif, lalu mengandalkan restart Gateway default agar startup dapat menyelesaikan migrasi Matrix
- jika Anda menggunakan `openclaw update --no-restart`, migrasi Matrix yang didukung startup ditunda hingga nanti Anda menjalankan `openclaw doctor --fix` dan me-restart Gateway

Migrasi otomatis mencakup:

- membuat atau menggunakan ulang snapshot pra-migrasi di bawah `~/Backups/openclaw-migrations/`
- menggunakan ulang kredensial Matrix yang di-cache
- mempertahankan pilihan akun dan config `channels.matrix` yang sama
- memindahkan store sinkronisasi Matrix datar tertua ke lokasi account-scoped saat ini
- memindahkan store crypto Matrix datar tertua ke lokasi account-scoped saat ini saat akun target dapat diselesaikan dengan aman
- mengekstrak key dekripsi backup room-key Matrix yang sebelumnya disimpan dari store rust crypto lama, saat key tersebut ada secara lokal
- menggunakan ulang root penyimpanan token-hash yang paling lengkap yang sudah ada untuk akun Matrix, homeserver, dan pengguna yang sama saat access token berubah nanti
- memindai root penyimpanan token-hash sibling untuk metadata pemulihan status terenkripsi yang tertunda saat access token Matrix berubah tetapi identitas akun/perangkat tetap sama
- memulihkan room key yang telah di-backup ke store crypto baru pada startup Matrix berikutnya

Detail snapshot:

- OpenClaw menulis file marker di `~/.openclaw/matrix/migration-snapshot.json` setelah snapshot berhasil sehingga pass startup dan perbaikan berikutnya dapat menggunakan ulang arsip yang sama.
- Snapshot migrasi Matrix otomatis ini hanya mencadangkan config + status (`includeWorkspace: false`).
- Jika Matrix hanya memiliki status migrasi warning-only, misalnya karena `userId` atau `accessToken` masih hilang, OpenClaw belum membuat snapshot karena tidak ada mutasi Matrix yang dapat ditindaklanjuti.
- Jika langkah snapshot gagal, OpenClaw melewati migrasi Matrix untuk run tersebut alih-alih mengubah status tanpa titik pemulihan.

Tentang peningkatan multi-akun:

- store Matrix datar tertua (`~/.openclaw/matrix/bot-storage.json` dan `~/.openclaw/matrix/crypto/`) berasal dari tata letak single-store, jadi OpenClaw hanya dapat memigrasikannya ke satu target akun Matrix yang terselesaikan
- store Matrix legacy yang sudah account-scoped akan dideteksi dan disiapkan per akun Matrix yang dikonfigurasi

## Apa yang tidak dapat dilakukan migrasi secara otomatis

Plugin Matrix publik sebelumnya **tidak** membuat backup room-key Matrix secara otomatis. Plugin tersebut mempertahankan status crypto lokal dan meminta verifikasi perangkat, tetapi tidak menjamin bahwa room key Anda di-backup ke homeserver.

Artinya, beberapa pemasangan terenkripsi hanya dapat dimigrasikan sebagian.

OpenClaw tidak dapat memulihkan secara otomatis:

- room key khusus lokal yang tidak pernah di-backup
- status terenkripsi saat akun Matrix target belum dapat diselesaikan karena `homeserver`, `userId`, atau `accessToken` masih belum tersedia
- migrasi otomatis satu store Matrix datar bersama saat beberapa akun Matrix dikonfigurasi tetapi `channels.matrix.defaultAccount` tidak disetel
- pemasangan path plugin kustom yang dipin ke path repo alih-alih package Matrix standar
- recovery key yang hilang saat store lama memiliki key yang di-backup tetapi tidak menyimpan key dekripsi secara lokal

Cakupan peringatan saat ini:

- pemasangan path plugin Matrix kustom ditampilkan oleh startup Gateway dan `openclaw doctor`

Jika pemasangan lama Anda memiliki riwayat terenkripsi khusus lokal yang tidak pernah di-backup, beberapa pesan terenkripsi lama mungkin tetap tidak dapat dibaca setelah peningkatan.

## Alur peningkatan yang direkomendasikan

1. Perbarui OpenClaw dan plugin Matrix seperti biasa.
   Sebaiknya gunakan `openclaw update` biasa tanpa `--no-restart` agar startup dapat segera menyelesaikan migrasi Matrix.
2. Jalankan:

   ```bash
   openclaw doctor --fix
   ```

   Jika Matrix memiliki pekerjaan migrasi yang dapat ditindaklanjuti, doctor akan membuat atau menggunakan ulang snapshot pra-migrasi terlebih dahulu dan mencetak path arsip.

3. Mulai atau restart Gateway.
4. Periksa status verifikasi dan backup saat ini:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Letakkan recovery key untuk akun Matrix yang sedang Anda perbaiki dalam environment variable khusus akun. Untuk satu akun default, `MATRIX_RECOVERY_KEY` sudah cukup. Untuk beberapa akun, gunakan satu variable per akun, misalnya `MATRIX_RECOVERY_KEY_ASSISTANT`, dan tambahkan `--account assistant` ke perintah.

6. Jika OpenClaw memberi tahu Anda bahwa recovery key diperlukan, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jika perangkat ini masih belum diverifikasi, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jika recovery key diterima dan backup dapat digunakan, tetapi `Cross-signing verified`
   masih `no`, selesaikan verifikasi diri dari klien Matrix lain:

   ```bash
   openclaw matrix verify self
   ```

   Terima permintaan di klien Matrix lain, bandingkan emoji atau desimal,
   dan ketik `yes` hanya saat keduanya cocok. Perintah hanya berhasil keluar
   setelah `Cross-signing verified` menjadi `yes`.

8. Jika Anda sengaja meninggalkan riwayat lama yang tidak dapat dipulihkan dan menginginkan baseline backup baru untuk pesan mendatang, jalankan:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Jika belum ada backup key sisi server, buat satu untuk pemulihan di masa mendatang:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cara kerja migrasi terenkripsi

Migrasi terenkripsi adalah proses dua tahap:

1. Startup atau `openclaw doctor --fix` membuat atau menggunakan ulang snapshot pra-migrasi jika migrasi terenkripsi dapat ditindaklanjuti.
2. Startup atau `openclaw doctor --fix` memeriksa store crypto Matrix lama melalui pemasangan plugin Matrix aktif.
3. Jika key dekripsi backup ditemukan, OpenClaw menulisnya ke alur recovery-key baru dan menandai pemulihan room-key sebagai tertunda.
4. Pada startup Matrix berikutnya, OpenClaw memulihkan room key yang telah di-backup ke store crypto baru secara otomatis.

Jika store lama melaporkan room key yang tidak pernah di-backup, OpenClaw memberi peringatan alih-alih berpura-pura pemulihan berhasil.

## Pesan umum dan artinya

### Pesan peningkatan dan deteksi

`Matrix plugin upgraded in place.`

- Arti: status Matrix lama di disk terdeteksi dan dimigrasikan ke tata letak saat ini.
- Yang harus dilakukan: tidak ada kecuali output yang sama juga menyertakan peringatan.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Arti: OpenClaw membuat arsip pemulihan sebelum mengubah status Matrix.
- Yang harus dilakukan: simpan path arsip yang dicetak hingga Anda mengonfirmasi migrasi berhasil.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Arti: OpenClaw menemukan marker snapshot migrasi Matrix yang sudah ada dan menggunakan ulang arsip tersebut alih-alih membuat backup duplikat.
- Yang harus dilakukan: simpan path arsip yang dicetak hingga Anda mengonfirmasi migrasi berhasil.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Arti: status Matrix lama ada, tetapi OpenClaw tidak dapat memetakannya ke akun Matrix saat ini karena Matrix belum dikonfigurasi.
- Yang harus dilakukan: konfigurasi `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: OpenClaw menemukan status lama, tetapi masih belum dapat menentukan root akun/perangkat saat ini secara tepat.
- Yang harus dilakukan: mulai Gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial yang di-cache ada.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu store Matrix datar bersama, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Arti: lokasi account-scoped baru sudah memiliki store sinkronisasi atau crypto, jadi OpenClaw tidak menimpanya secara otomatis.
- Yang harus dilakukan: verifikasi bahwa akun saat ini adalah akun yang benar sebelum menghapus atau memindahkan target yang konflik secara manual.

`Failed migrating Matrix legacy sync store (...)` atau `Failed migrating Matrix legacy crypto store (...)`

- Arti: OpenClaw mencoba memindahkan status Matrix lama tetapi operasi filesystem gagal.
- Yang harus dilakukan: periksa izin filesystem dan status disk, lalu jalankan ulang `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Arti: OpenClaw menemukan store Matrix terenkripsi lama, tetapi tidak ada config Matrix saat ini untuk melampirkannya.
- Yang harus dilakukan: konfigurasi `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: store terenkripsi ada, tetapi OpenClaw tidak dapat memutuskan dengan aman akun/perangkat saat ini mana yang memilikinya.
- Yang harus dilakukan: mulai Gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial yang di-cache tersedia.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu store crypto legacy datar bersama, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Arti: OpenClaw mendeteksi status Matrix lama, tetapi migrasi masih diblokir oleh data identitas atau kredensial yang hilang.
- Yang harus dilakukan: selesaikan login Matrix atau penyiapan config, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Arti: OpenClaw menemukan status Matrix terenkripsi lama, tetapi tidak dapat memuat entrypoint helper dari plugin Matrix yang biasanya memeriksa store tersebut.
- Yang harus dilakukan: pasang ulang atau perbaiki plugin Matrix (`openclaw plugins install @openclaw/matrix`, atau `openclaw plugins install ./path/to/local/matrix-plugin` untuk checkout repo), lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Arti: OpenClaw menemukan jalur file helper yang keluar dari root plugin atau gagal dalam pemeriksaan batas plugin, sehingga OpenClaw menolak mengimpornya.
- Yang harus dilakukan: instal ulang Plugin Matrix dari jalur tepercaya, lalu jalankan kembali `openclaw doctor --fix` atau mulai ulang gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Arti: OpenClaw menolak mengubah status Matrix karena tidak dapat membuat snapshot pemulihan terlebih dahulu.
- Yang harus dilakukan: selesaikan kesalahan pencadangan, lalu jalankan kembali `openclaw doctor --fix` atau mulai ulang gateway.

`Failed migrating legacy Matrix client storage: ...`

- Arti: fallback sisi klien Matrix menemukan penyimpanan datar lama, tetapi pemindahannya gagal. OpenClaw sekarang membatalkan fallback tersebut alih-alih diam-diam memulai dengan penyimpanan baru.
- Yang harus dilakukan: periksa izin atau konflik sistem file, pertahankan status lama tetap utuh, lalu coba lagi setelah memperbaiki kesalahan.

`Matrix is installed from a custom path: ...`

- Arti: Matrix dipasang dengan instalasi berbasis jalur, sehingga pembaruan utama tidak otomatis menggantinya dengan paket Matrix standar repo.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix` saat Anda ingin kembali ke Plugin Matrix default.

### Pesan pemulihan status terenkripsi

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Arti: kunci ruang yang dicadangkan berhasil dipulihkan ke penyimpanan kripto baru.
- Yang harus dilakukan: biasanya tidak ada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Arti: beberapa kunci ruang lama hanya ada di penyimpanan lokal lama dan belum pernah diunggah ke cadangan Matrix.
- Yang harus dilakukan: perkirakan sebagian riwayat terenkripsi lama tetap tidak tersedia kecuali Anda dapat memulihkan kunci tersebut secara manual dari klien lain yang terverifikasi.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Arti: cadangan ada, tetapi OpenClaw tidak dapat memulihkan kunci pemulihan secara otomatis.
- Yang harus dilakukan: jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Arti: OpenClaw menemukan penyimpanan terenkripsi lama, tetapi tidak dapat memeriksanya dengan cukup aman untuk menyiapkan pemulihan.
- Yang harus dilakukan: jalankan kembali `openclaw doctor --fix`. Jika berulang, pertahankan direktori status lama tetap utuh dan pulihkan menggunakan klien Matrix lain yang terverifikasi serta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Arti: OpenClaw mendeteksi konflik kunci cadangan dan menolak menimpa file recovery-key saat ini secara otomatis.
- Yang harus dilakukan: verifikasi kunci pemulihan mana yang benar sebelum mencoba kembali perintah pemulihan apa pun.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Arti: ini adalah batas keras format penyimpanan lama.
- Yang harus dilakukan: kunci yang dicadangkan masih dapat dipulihkan, tetapi riwayat terenkripsi yang hanya ada lokal mungkin tetap tidak tersedia.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Arti: Plugin baru mencoba memulihkan, tetapi Matrix mengembalikan kesalahan.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup status`, lalu coba lagi dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` jika diperlukan.

### Pesan pemulihan manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Arti: OpenClaw tahu Anda seharusnya memiliki kunci cadangan, tetapi kunci tersebut tidak aktif di perangkat ini.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup restore`, atau atur `MATRIX_RECOVERY_KEY` dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` jika diperlukan.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Arti: perangkat ini saat ini belum menyimpan kunci pemulihan.
- Yang harus dilakukan: atur `MATRIX_RECOVERY_KEY`, jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, lalu pulihkan cadangan.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Arti: kunci yang tersimpan tidak cocok dengan cadangan Matrix aktif.
- Yang harus dilakukan: atur `MATRIX_RECOVERY_KEY` ke kunci yang benar dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan, Anda dapat sebagai gantinya mereset
baseline cadangan saat ini dengan `openclaw matrix verify backup reset --yes`. Saat
rahasia cadangan yang tersimpan rusak, reset tersebut juga dapat membuat ulang penyimpanan rahasia agar
kunci cadangan baru dapat dimuat dengan benar setelah mulai ulang.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Arti: cadangan ada, tetapi perangkat ini belum cukup kuat mempercayai rantai penandatanganan silang.
- Yang harus dilakukan: atur `MATRIX_RECOVERY_KEY` dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Arti: Anda mencoba langkah pemulihan tanpa memberikan kunci pemulihan saat kunci tersebut diperlukan.
- Yang harus dilakukan: jalankan kembali perintah dengan `--recovery-key-stdin`, misalnya `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Arti: kunci yang diberikan tidak dapat diurai atau tidak cocok dengan format yang diharapkan.
- Yang harus dilakukan: coba lagi dengan kunci pemulihan persis dari klien Matrix atau file recovery-key Anda.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Arti: OpenClaw dapat menerapkan kunci pemulihan, tetapi Matrix masih belum
  menetapkan kepercayaan identitas penandatanganan silang penuh untuk perangkat ini. Periksa
  keluaran perintah untuk `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified`, dan `Device verified by owner`.
- Yang harus dilakukan: jalankan `openclaw matrix verify self`, terima permintaan di klien
  Matrix lain, bandingkan SAS, dan ketik `yes` hanya saat cocok. Perintah tersebut
  menunggu kepercayaan identitas Matrix penuh sebelum melaporkan keberhasilan. Gunakan
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  hanya saat Anda sengaja ingin mengganti identitas penandatanganan silang saat ini.

`Matrix key backup is not active on this device after loading from secret storage.`

- Arti: penyimpanan rahasia tidak menghasilkan sesi cadangan aktif di perangkat ini.
- Yang harus dilakukan: verifikasi perangkat terlebih dahulu, lalu periksa kembali dengan `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Arti: perangkat ini tidak dapat memulihkan dari penyimpanan rahasia hingga verifikasi perangkat selesai.
- Yang harus dilakukan: jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` terlebih dahulu.

### Pesan instalasi Plugin kustom

`Matrix is installed from a custom path that no longer exists: ...`

- Arti: catatan instalasi Plugin Anda mengarah ke jalur lokal yang sudah hilang.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix`, atau jika Anda menjalankan dari checkout repo, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jika riwayat terenkripsi masih belum kembali

Jalankan pemeriksaan ini secara berurutan:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jika cadangan berhasil dipulihkan tetapi sebagian ruang lama masih kehilangan riwayat, kunci yang hilang tersebut kemungkinan tidak pernah dicadangkan oleh Plugin sebelumnya.

## Jika Anda ingin memulai dari awal untuk pesan mendatang

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan dan hanya menginginkan baseline cadangan bersih untuk ke depannya, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jika perangkat masih belum terverifikasi setelah itu, selesaikan verifikasi dari klien Matrix Anda dengan membandingkan emoji SAS atau kode desimal dan mengonfirmasi bahwa semuanya cocok.

## Terkait

- [Matrix](/id/channels/matrix): penyiapan dan konfigurasi kanal.
- [Aturan push Matrix](/id/channels/matrix-push-rules): perutean notifikasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan dan pemicu migrasi otomatis.
- [Panduan migrasi](/id/install/migrating): semua jalur migrasi (pemindahan mesin, impor lintas sistem).
- [Plugins](/id/tools/plugin): instalasi dan pendaftaran Plugin.
