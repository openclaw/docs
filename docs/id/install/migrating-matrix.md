---
read_when:
    - Meng-upgrade instalasi Matrix yang sudah ada
    - Memigrasikan riwayat Matrix terenkripsi dan status device
summary: Bagaimana OpenClaw meng-upgrade Plugin Matrix sebelumnya di tempat, termasuk batas pemulihan status terenkripsi dan langkah pemulihan manual.
title: Migrasi Matrix
x-i18n:
    generated_at: "2026-04-26T11:32:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

Halaman ini membahas upgrade dari Plugin publik `matrix` sebelumnya ke implementasi saat ini.

Bagi sebagian besar pengguna, upgrade dilakukan di tempat:

- Plugin tetap `@openclaw/matrix`
- channel tetap `matrix`
- config Anda tetap berada di bawah `channels.matrix`
- kredensial cache tetap berada di bawah `~/.openclaw/credentials/matrix/`
- status runtime tetap berada di bawah `~/.openclaw/matrix/`

Anda tidak perlu mengganti nama key config atau menginstal ulang Plugin dengan nama baru.

## Apa yang dilakukan migrasi secara otomatis

Saat gateway dimulai, dan saat Anda menjalankan [`openclaw doctor --fix`](/id/gateway/doctor), OpenClaw mencoba memperbaiki status Matrix lama secara otomatis.
Sebelum langkah migrasi Matrix yang dapat ditindaklanjuti memodifikasi status di disk, OpenClaw membuat atau menggunakan kembali snapshot pemulihan yang terfokus.

Saat Anda menggunakan `openclaw update`, pemicu persisnya bergantung pada cara OpenClaw diinstal:

- instalasi source menjalankan `openclaw doctor --fix` selama alur update, lalu me-restart gateway secara default
- instalasi package-manager memperbarui package, menjalankan doctor pass non-interaktif, lalu mengandalkan restart gateway default agar startup dapat menyelesaikan migrasi Matrix
- jika Anda menggunakan `openclaw update --no-restart`, migrasi Matrix yang didukung startup ditunda sampai nanti Anda menjalankan `openclaw doctor --fix` dan me-restart gateway

Migrasi otomatis mencakup:

- membuat atau menggunakan kembali snapshot pra-migrasi di bawah `~/Backups/openclaw-migrations/`
- menggunakan kembali kredensial Matrix cache Anda
- mempertahankan pilihan akun dan config `channels.matrix` yang sama
- memindahkan sync store Matrix flat tertua ke lokasi saat ini dengan cakupan akun
- memindahkan crypto store Matrix flat tertua ke lokasi saat ini dengan cakupan akun saat akun target dapat di-resolve dengan aman
- mengekstrak recovery key dekripsi backup room-key Matrix yang sebelumnya disimpan dari rust crypto store lama, saat key itu ada secara lokal
- menggunakan kembali root penyimpanan token-hash yang paling lengkap untuk akun Matrix, homeserver, dan pengguna yang sama saat access token berubah nanti
- memindai root penyimpanan token-hash tetangga untuk metadata pemulihan status terenkripsi yang tertunda saat access token Matrix berubah tetapi identitas akun/device tetap sama
- memulihkan room key yang dibackup ke crypto store baru pada startup Matrix berikutnya

Detail snapshot:

- OpenClaw menulis file marker di `~/.openclaw/matrix/migration-snapshot.json` setelah snapshot berhasil sehingga startup berikutnya dan repair pass dapat menggunakan kembali arsip yang sama.
- Snapshot migrasi Matrix otomatis ini hanya membackup config + status (`includeWorkspace: false`).
- Jika Matrix hanya memiliki status migrasi berupa peringatan saja, misalnya karena `userId` atau `accessToken` masih hilang, OpenClaw belum membuat snapshot karena belum ada mutasi Matrix yang dapat ditindaklanjuti.
- Jika langkah snapshot gagal, OpenClaw melewati migrasi Matrix pada eksekusi itu alih-alih memodifikasi status tanpa titik pemulihan.

Tentang upgrade multi-akun:

- store Matrix flat tertua (`~/.openclaw/matrix/bot-storage.json` dan `~/.openclaw/matrix/crypto/`) berasal dari tata letak single-store, sehingga OpenClaw hanya dapat memigrasikannya ke satu target akun Matrix yang telah di-resolve
- store Matrix lama yang sudah memiliki cakupan akun dideteksi dan disiapkan per akun Matrix yang dikonfigurasi

## Apa yang tidak dapat dilakukan migrasi secara otomatis

Plugin publik Matrix sebelumnya **tidak** secara otomatis membuat backup room-key Matrix. Plugin tersebut menyimpan status crypto lokal dan meminta verifikasi device, tetapi tidak menjamin bahwa room key Anda dibackup ke homeserver.

Itu berarti beberapa instalasi terenkripsi hanya dapat dimigrasikan sebagian.

OpenClaw tidak dapat memulihkan secara otomatis:

- room key khusus lokal yang tidak pernah dibackup
- status terenkripsi saat akun Matrix target belum dapat di-resolve karena `homeserver`, `userId`, atau `accessToken` masih belum tersedia
- migrasi otomatis satu store Matrix flat bersama saat beberapa akun Matrix dikonfigurasi tetapi `channels.matrix.defaultAccount` belum diatur
- instalasi path Plugin kustom yang di-pin ke path repo alih-alih package Matrix standar
- recovery key yang hilang saat store lama memiliki key yang dibackup tetapi tidak menyimpan key dekripsinya secara lokal

Cakupan peringatan saat ini:

- instalasi path Plugin Matrix kustom ditampilkan baik oleh startup gateway maupun `openclaw doctor`

Jika instalasi lama Anda memiliki riwayat terenkripsi khusus lokal yang tidak pernah dibackup, beberapa pesan terenkripsi lama mungkin tetap tidak dapat dibaca setelah upgrade.

## Alur upgrade yang disarankan

1. Perbarui OpenClaw dan Plugin Matrix seperti biasa.
   Utamakan `openclaw update` biasa tanpa `--no-restart` agar startup dapat segera menyelesaikan migrasi Matrix.
2. Jalankan:

   ```bash
   openclaw doctor --fix
   ```

   Jika Matrix memiliki pekerjaan migrasi yang dapat ditindaklanjuti, doctor akan membuat atau menggunakan kembali snapshot pra-migrasi terlebih dahulu dan mencetak path arsip.

3. Mulai atau restart gateway.
4. Periksa status verifikasi dan backup saat ini:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Letakkan recovery key untuk akun Matrix yang sedang Anda perbaiki dalam variabel environment khusus akun. Untuk satu akun default, `MATRIX_RECOVERY_KEY` sudah cukup. Untuk beberapa akun, gunakan satu variabel per akun, misalnya `MATRIX_RECOVERY_KEY_ASSISTANT`, dan tambahkan `--account assistant` ke perintah.

6. Jika OpenClaw memberi tahu bahwa recovery key diperlukan, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jika device ini masih belum terverifikasi, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jika recovery key diterima dan backup dapat digunakan, tetapi `Cross-signing verified`
   masih `no`, selesaikan self-verification dari klien Matrix lain:

   ```bash
   openclaw matrix verify self
   ```

   Terima permintaan di klien Matrix lain, bandingkan emoji atau angka desimal,
   dan ketik `yes` hanya jika keduanya cocok. Perintah hanya berhasil keluar
   setelah `Cross-signing verified` menjadi `yes`.

8. Jika Anda memang meninggalkan riwayat lama yang tidak dapat dipulihkan dan ingin baseline backup baru untuk pesan mendatang, jalankan:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Jika belum ada backup key di sisi server, buat satu untuk pemulihan mendatang:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cara kerja migrasi terenkripsi

Migrasi terenkripsi adalah proses dua tahap:

1. Startup atau `openclaw doctor --fix` membuat atau menggunakan kembali snapshot pra-migrasi jika migrasi terenkripsi dapat ditindaklanjuti.
2. Startup atau `openclaw doctor --fix` memeriksa crypto store Matrix lama melalui instalasi Plugin Matrix aktif.
3. Jika key dekripsi backup ditemukan, OpenClaw menuliskannya ke alur recovery-key baru dan menandai pemulihan room-key sebagai tertunda.
4. Pada startup Matrix berikutnya, OpenClaw memulihkan room key yang dibackup ke crypto store baru secara otomatis.

Jika store lama melaporkan room key yang tidak pernah dibackup, OpenClaw akan memberi peringatan alih-alih berpura-pura bahwa pemulihan berhasil.

## Pesan umum dan artinya

### Pesan upgrade dan deteksi

`Matrix plugin upgraded in place.`

- Arti: status Matrix lama di disk terdeteksi dan dimigrasikan ke tata letak saat ini.
- Yang harus dilakukan: tidak ada kecuali output yang sama juga menyertakan peringatan.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Arti: OpenClaw membuat arsip pemulihan sebelum memodifikasi status Matrix.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi bahwa migrasi berhasil.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Arti: OpenClaw menemukan marker snapshot migrasi Matrix yang ada dan menggunakan kembali arsip tersebut alih-alih membuat backup duplikat.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi bahwa migrasi berhasil.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Arti: status Matrix lama ada, tetapi OpenClaw tidak dapat memetakannya ke akun Matrix saat ini karena Matrix belum dikonfigurasi.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: OpenClaw menemukan status lama, tetapi masih tidak dapat menentukan root akun/device saat ini yang tepat.
- Yang harus dilakukan: mulai gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial cache tersedia.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu store Matrix flat bersama, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: atur `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Arti: lokasi baru dengan cakupan akun sudah memiliki sync atau crypto store, sehingga OpenClaw tidak menimpanya secara otomatis.
- Yang harus dilakukan: verifikasi bahwa akun saat ini adalah akun yang benar sebelum menghapus atau memindahkan target yang bertentangan secara manual.

`Failed migrating Matrix legacy sync store (...)` atau `Failed migrating Matrix legacy crypto store (...)`

- Arti: OpenClaw mencoba memindahkan status Matrix lama tetapi operasi filesystem gagal.
- Yang harus dilakukan: periksa izin filesystem dan status disk, lalu jalankan ulang `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Arti: OpenClaw menemukan store Matrix terenkripsi lama, tetapi belum ada config Matrix saat ini untuk mengaitkannya.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: store terenkripsi ada, tetapi OpenClaw tidak dapat dengan aman memutuskan akun/device saat ini mana yang memilikinya.
- Yang harus dilakukan: mulai gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial cache tersedia.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu crypto store lama bersama yang flat, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: atur `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Arti: OpenClaw mendeteksi status Matrix lama, tetapi migrasi masih terblokir oleh data identitas atau kredensial yang hilang.
- Yang harus dilakukan: selesaikan login atau penyiapan config Matrix, lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Arti: OpenClaw menemukan status Matrix terenkripsi lama, tetapi tidak dapat memuat entrypoint helper dari Plugin Matrix yang biasanya memeriksa store tersebut.
- Yang harus dilakukan: instal ulang atau perbaiki Plugin Matrix (`openclaw plugins install @openclaw/matrix`, atau `openclaw plugins install ./path/to/local/matrix-plugin` untuk checkout repo), lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Arti: OpenClaw menemukan path file helper yang keluar dari root Plugin atau gagal pada pemeriksaan batas Plugin, sehingga OpenClaw menolak mengimpornya.
- Yang harus dilakukan: instal ulang Plugin Matrix dari path tepercaya, lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Arti: OpenClaw menolak memodifikasi status Matrix karena tidak dapat membuat snapshot pemulihan terlebih dahulu.
- Yang harus dilakukan: selesaikan error backup, lalu jalankan ulang `openclaw doctor --fix` atau restart gateway.

`Failed migrating legacy Matrix client storage: ...`

- Arti: fallback sisi klien Matrix menemukan penyimpanan flat lama, tetapi pemindahan gagal. OpenClaw sekarang membatalkan fallback itu alih-alih diam-diam memulai dengan store baru.
- Yang harus dilakukan: periksa izin filesystem atau konflik, pertahankan status lama tetap utuh, dan coba lagi setelah memperbaiki error.

`Matrix is installed from a custom path: ...`

- Arti: Matrix di-pin ke instalasi path, sehingga update jalur utama tidak otomatis menggantinya dengan package Matrix standar repo.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix` jika Anda ingin kembali ke Plugin Matrix default.

### Pesan pemulihan status terenkripsi

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Arti: room key yang dibackup berhasil dipulihkan ke crypto store baru.
- Yang harus dilakukan: biasanya tidak ada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Arti: beberapa room key lama hanya ada di store lokal lama dan tidak pernah diunggah ke backup Matrix.
- Yang harus dilakukan: anggap beberapa riwayat terenkripsi lama tetap tidak tersedia kecuali Anda dapat memulihkan key tersebut secara manual dari klien lain yang telah diverifikasi.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Arti: backup ada, tetapi OpenClaw tidak dapat memulihkan recovery key secara otomatis.
- Yang harus dilakukan: jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Arti: OpenClaw menemukan store terenkripsi lama, tetapi tidak dapat memeriksanya dengan cukup aman untuk menyiapkan pemulihan.
- Yang harus dilakukan: jalankan ulang `openclaw doctor --fix`. Jika terulang, pertahankan direktori status lama tetap utuh dan pulihkan menggunakan klien Matrix lain yang telah diverifikasi plus `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Arti: OpenClaw mendeteksi konflik backup key dan menolak menimpa file recovery-key saat ini secara otomatis.
- Yang harus dilakukan: verifikasi recovery key mana yang benar sebelum mencoba ulang perintah pemulihan apa pun.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Arti: ini adalah batas keras dari format penyimpanan lama.
- Yang harus dilakukan: key yang dibackup tetap dapat dipulihkan, tetapi riwayat terenkripsi khusus lokal mungkin tetap tidak tersedia.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Arti: Plugin baru mencoba melakukan pemulihan tetapi Matrix mengembalikan error.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup status`, lalu coba lagi dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` jika diperlukan.

### Pesan pemulihan manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Arti: OpenClaw tahu Anda seharusnya memiliki backup key, tetapi key tersebut tidak aktif di device ini.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup restore`, atau atur `MATRIX_RECOVERY_KEY` dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` jika diperlukan.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Arti: device ini saat ini tidak memiliki recovery key yang tersimpan.
- Yang harus dilakukan: atur `MATRIX_RECOVERY_KEY`, jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, lalu pulihkan backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Arti: key yang tersimpan tidak cocok dengan backup Matrix yang aktif.
- Yang harus dilakukan: atur `MATRIX_RECOVERY_KEY` ke key yang benar dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan, Anda dapat me-reset
baseline backup saat ini dengan `openclaw matrix verify backup reset --yes`. Saat
secret backup yang tersimpan rusak, reset itu juga dapat membuat ulang secret storage agar
backup key baru dapat dimuat dengan benar setelah restart.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Arti: backup ada, tetapi device ini belum cukup memercayai rantai cross-signing.
- Yang harus dilakukan: atur `MATRIX_RECOVERY_KEY` dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Arti: Anda mencoba langkah pemulihan tanpa memberikan recovery key saat recovery key diperlukan.
- Yang harus dilakukan: jalankan ulang perintah dengan `--recovery-key-stdin`, misalnya `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Arti: key yang diberikan tidak dapat di-parse atau tidak cocok dengan format yang diharapkan.
- Yang harus dilakukan: coba lagi dengan recovery key yang tepat dari klien Matrix atau file recovery-key Anda.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Arti: OpenClaw dapat menerapkan recovery key, tetapi Matrix masih belum
  menetapkan trust identitas cross-signing penuh untuk device ini. Periksa
  output perintah untuk `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified`, dan `Device verified by owner`.
- Yang harus dilakukan: jalankan `openclaw matrix verify self`, terima permintaan di klien
  Matrix lain, bandingkan SAS, dan ketik `yes` hanya jika cocok. Perintah
  menunggu trust identitas Matrix penuh sebelum melaporkan keberhasilan. Gunakan
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  hanya saat Anda memang ingin mengganti identitas cross-signing saat ini.

`Matrix key backup is not active on this device after loading from secret storage.`

- Arti: secret storage tidak menghasilkan sesi backup aktif pada device ini.
- Yang harus dilakukan: verifikasi device terlebih dahulu, lalu periksa ulang dengan `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Arti: device ini tidak dapat memulihkan dari secret storage sampai verifikasi device selesai.
- Yang harus dilakukan: jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` terlebih dahulu.

### Pesan instalasi Plugin kustom

`Matrix is installed from a custom path that no longer exists: ...`

- Arti: catatan instalasi Plugin Anda menunjuk ke path lokal yang sudah tidak ada.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix`, atau jika Anda menjalankan dari checkout repo, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jika riwayat terenkripsi masih tidak kembali

Jalankan pemeriksaan ini secara berurutan:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jika backup berhasil dipulihkan tetapi beberapa room lama masih kehilangan riwayat, kemungkinan key yang hilang itu memang tidak pernah dibackup oleh Plugin sebelumnya.

## Jika Anda ingin memulai baru untuk pesan mendatang

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan dan hanya ingin baseline backup yang bersih untuk ke depan, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jika device masih belum diverifikasi setelah itu, selesaikan verifikasi dari klien Matrix Anda dengan membandingkan emoji SAS atau kode desimal dan mengonfirmasi bahwa keduanya cocok.

## Halaman terkait

- [Matrix](/id/channels/matrix)
- [Doctor](/id/gateway/doctor)
- [Migrating](/id/install/migrating)
- [Plugins](/id/tools/plugin)
