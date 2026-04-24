---
read_when:
    - Meng-upgrade instalasi Matrix yang sudah ada
    - Memigrasikan riwayat Matrix terenkripsi dan status perangkat
summary: Bagaimana OpenClaw meng-upgrade Plugin Matrix sebelumnya langsung di tempat, termasuk batas pemulihan status terenkripsi dan langkah pemulihan manual.
title: Migrasi Matrix
x-i18n:
    generated_at: "2026-04-24T09:14:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

Halaman ini membahas upgrade dari Plugin publik `matrix` sebelumnya ke implementasi saat ini.

Bagi sebagian besar pengguna, upgrade dilakukan langsung di tempat:

- Plugin tetap `@openclaw/matrix`
- channel tetap `matrix`
- konfigurasi Anda tetap berada di bawah `channels.matrix`
- kredensial cache tetap berada di `~/.openclaw/credentials/matrix/`
- status runtime tetap berada di `~/.openclaw/matrix/`

Anda tidak perlu mengganti nama kunci konfigurasi atau menginstal ulang Plugin dengan nama baru.

## Apa yang dilakukan migrasi secara otomatis

Saat Gateway mulai, dan saat Anda menjalankan [`openclaw doctor --fix`](/id/gateway/doctor), OpenClaw mencoba memperbaiki status Matrix lama secara otomatis.
Sebelum langkah migrasi Matrix apa pun yang dapat ditindaklanjuti mengubah status di disk, OpenClaw membuat atau menggunakan kembali snapshot pemulihan yang terfokus.

Saat Anda menggunakan `openclaw update`, pemicu pastinya bergantung pada cara OpenClaw diinstal:

- instalasi source menjalankan `openclaw doctor --fix` selama alur update, lalu me-restart Gateway secara default
- instalasi package-manager memperbarui paket, menjalankan doctor pass non-interaktif, lalu mengandalkan restart Gateway default agar startup dapat menyelesaikan migrasi Matrix
- jika Anda menggunakan `openclaw update --no-restart`, migrasi Matrix berbasis startup ditunda sampai Anda nanti menjalankan `openclaw doctor --fix` dan me-restart Gateway

Migrasi otomatis mencakup:

- membuat atau menggunakan kembali snapshot pra-migrasi di bawah `~/Backups/openclaw-migrations/`
- menggunakan kembali kredensial Matrix cache Anda
- mempertahankan pemilihan akun dan konfigurasi `channels.matrix` yang sama
- memindahkan sync store Matrix datar tertua ke lokasi bercakupan akun saat ini
- memindahkan crypto store Matrix datar tertua ke lokasi bercakupan akun saat ini ketika akun target dapat di-resolve dengan aman
- mengekstrak recovery key dekripsi backup room-key Matrix yang sebelumnya disimpan dari rust crypto store lama, ketika key tersebut ada secara lokal
- menggunakan kembali root penyimpanan hash token paling lengkap yang ada untuk akun Matrix, homeserver, dan pengguna yang sama ketika access token berubah nanti
- memindai root penyimpanan hash token saudara untuk metadata pemulihan status terenkripsi yang tertunda ketika access token Matrix berubah tetapi identitas akun/perangkat tetap sama
- memulihkan room key yang dicadangkan ke crypto store baru pada startup Matrix berikutnya

Detail snapshot:

- OpenClaw menulis file penanda di `~/.openclaw/matrix/migration-snapshot.json` setelah snapshot berhasil agar startup dan repair pass berikutnya dapat menggunakan ulang arsip yang sama.
- Snapshot migrasi Matrix otomatis ini hanya mencadangkan konfigurasi + status (`includeWorkspace: false`).
- Jika Matrix hanya memiliki status migrasi yang bersifat peringatan saja, misalnya karena `userId` atau `accessToken` masih hilang, OpenClaw belum membuat snapshot karena belum ada mutasi Matrix yang dapat ditindaklanjuti.
- Jika langkah snapshot gagal, OpenClaw melewati migrasi Matrix untuk eksekusi itu alih-alih mengubah status tanpa titik pemulihan.

Tentang upgrade multi-akun:

- store Matrix datar tertua (`~/.openclaw/matrix/bot-storage.json` dan `~/.openclaw/matrix/crypto/`) berasal dari tata letak single-store, jadi OpenClaw hanya dapat memigrasikannya ke satu target akun Matrix yang telah di-resolve
- store Matrix lama yang sudah bercakupan akun dideteksi dan disiapkan per akun Matrix yang dikonfigurasi

## Apa yang tidak dapat dilakukan migrasi secara otomatis

Plugin Matrix publik sebelumnya **tidak** secara otomatis membuat backup room-key Matrix. Plugin itu mempertahankan status crypto lokal dan meminta verifikasi perangkat, tetapi tidak menjamin bahwa room key Anda dicadangkan ke homeserver.

Itu berarti beberapa instalasi terenkripsi hanya dapat dimigrasikan sebagian.

OpenClaw tidak dapat secara otomatis memulihkan:

- room key khusus lokal yang tidak pernah dicadangkan
- status terenkripsi ketika akun Matrix target belum dapat di-resolve karena `homeserver`, `userId`, atau `accessToken` masih belum tersedia
- migrasi otomatis satu store Matrix datar bersama ketika beberapa akun Matrix dikonfigurasi tetapi `channels.matrix.defaultAccount` tidak disetel
- instalasi path Plugin kustom yang dipin ke path repo alih-alih paket Matrix standar
- recovery key yang hilang ketika store lama memiliki key yang dicadangkan tetapi tidak menyimpan key dekripsinya secara lokal

Cakupan peringatan saat ini:

- instalasi path Plugin Matrix kustom ditampilkan baik oleh startup Gateway maupun `openclaw doctor`

Jika instalasi lama Anda memiliki riwayat terenkripsi khusus lokal yang tidak pernah dicadangkan, beberapa pesan terenkripsi lama mungkin tetap tidak dapat dibaca setelah upgrade.

## Alur upgrade yang direkomendasikan

1. Perbarui OpenClaw dan Plugin Matrix secara normal.
   Sebaiknya gunakan `openclaw update` biasa tanpa `--no-restart` agar startup dapat langsung menyelesaikan migrasi Matrix.
2. Jalankan:

   ```bash
   openclaw doctor --fix
   ```

   Jika Matrix memiliki pekerjaan migrasi yang dapat ditindaklanjuti, doctor akan membuat atau menggunakan kembali snapshot pra-migrasi terlebih dahulu dan mencetak path arsip.

3. Mulai atau restart Gateway.
4. Periksa status verifikasi dan backup saat ini:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Jika OpenClaw memberi tahu bahwa recovery key diperlukan, jalankan:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Jika perangkat ini masih belum terverifikasi, jalankan:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Jika Anda memang meninggalkan riwayat lama yang tidak dapat dipulihkan dan ingin baseline backup baru untuk pesan mendatang, jalankan:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Jika belum ada backup key sisi server, buat satu untuk pemulihan di masa mendatang:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cara kerja migrasi terenkripsi

Migrasi terenkripsi adalah proses dua tahap:

1. Startup atau `openclaw doctor --fix` membuat atau menggunakan kembali snapshot pra-migrasi jika migrasi terenkripsi dapat ditindaklanjuti.
2. Startup atau `openclaw doctor --fix` memeriksa crypto store Matrix lama melalui instalasi Plugin Matrix aktif.
3. Jika ditemukan backup decryption key, OpenClaw menuliskannya ke alur recovery-key baru dan menandai pemulihan room-key sebagai tertunda.
4. Pada startup Matrix berikutnya, OpenClaw memulihkan room key yang dicadangkan ke crypto store baru secara otomatis.

Jika store lama melaporkan room key yang tidak pernah dicadangkan, OpenClaw memberi peringatan alih-alih berpura-pura bahwa pemulihan berhasil.

## Pesan umum dan artinya

### Pesan upgrade dan deteksi

`Matrix plugin upgraded in place.`

- Arti: status Matrix lama di disk terdeteksi dan dimigrasikan ke tata letak saat ini.
- Yang harus dilakukan: tidak ada kecuali output yang sama juga menyertakan peringatan.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Arti: OpenClaw membuat arsip pemulihan sebelum mengubah status Matrix.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi migrasi berhasil.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Arti: OpenClaw menemukan penanda snapshot migrasi Matrix yang ada dan menggunakan ulang arsip tersebut alih-alih membuat cadangan duplikat.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi migrasi berhasil.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Arti: status Matrix lama ada, tetapi OpenClaw tidak dapat memetakannya ke akun Matrix saat ini karena Matrix belum dikonfigurasi.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: OpenClaw menemukan status lama, tetapi masih belum dapat menentukan root akun/perangkat saat ini yang tepat.
- Yang harus dilakukan: mulai Gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial cache tersedia.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu store Matrix datar bersama, tetapi menolak menebak akun Matrix bernama mana yang seharusnya menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Arti: lokasi bercakupan akun yang baru sudah memiliki sync atau crypto store, jadi OpenClaw tidak menimpanya secara otomatis.
- Yang harus dilakukan: verifikasi bahwa akun saat ini adalah akun yang benar sebelum menghapus atau memindahkan target yang bentrok secara manual.

`Failed migrating Matrix legacy sync store (...)` atau `Failed migrating Matrix legacy crypto store (...)`

- Arti: OpenClaw mencoba memindahkan status Matrix lama tetapi operasi filesystem gagal.
- Yang harus dilakukan: periksa izin filesystem dan status disk, lalu jalankan ulang `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Arti: OpenClaw menemukan store Matrix terenkripsi lama, tetapi tidak ada konfigurasi Matrix saat ini untuk melampirkannya.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: store terenkripsi ada, tetapi OpenClaw tidak dapat memutuskan dengan aman akun/perangkat saat ini mana yang memilikinya.
- Yang harus dilakukan: mulai Gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial cache tersedia.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu legacy crypto store datar bersama, tetapi menolak menebak akun Matrix bernama mana yang seharusnya menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Arti: OpenClaw mendeteksi status Matrix lama, tetapi migrasi masih terblokir oleh data identitas atau kredensial yang hilang.
- Yang harus dilakukan: selesaikan login Matrix atau penyiapan konfigurasi, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Arti: OpenClaw menemukan status Matrix terenkripsi lama, tetapi tidak dapat memuat entrypoint helper dari Plugin Matrix yang biasanya memeriksa store tersebut.
- Yang harus dilakukan: instal ulang atau perbaiki Plugin Matrix (`openclaw plugins install @openclaw/matrix`, atau `openclaw plugins install ./path/to/local/matrix-plugin` untuk checkout repo), lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Arti: OpenClaw menemukan path file helper yang keluar dari root Plugin atau gagal dalam pemeriksaan batas Plugin, sehingga menolak untuk mengimpornya.
- Yang harus dilakukan: instal ulang Plugin Matrix dari path tepercaya, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Arti: OpenClaw menolak mengubah status Matrix karena tidak dapat membuat snapshot pemulihan terlebih dahulu.
- Yang harus dilakukan: selesaikan error cadangan, lalu jalankan ulang `openclaw doctor --fix` atau restart Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Arti: fallback sisi klien Matrix menemukan penyimpanan datar lama, tetapi pemindahannya gagal. OpenClaw sekarang membatalkan fallback itu alih-alih diam-diam memulai dengan store baru.
- Yang harus dilakukan: periksa izin filesystem atau konflik, pertahankan status lama tetap utuh, lalu coba lagi setelah memperbaiki error tersebut.

`Matrix is installed from a custom path: ...`

- Arti: Matrix dipin ke instalasi path, sehingga update mainline tidak otomatis menggantinya dengan paket Matrix standar milik repo.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix` saat Anda ingin kembali ke Plugin Matrix default.

### Pesan pemulihan status terenkripsi

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Arti: room key yang dicadangkan berhasil dipulihkan ke crypto store baru.
- Yang harus dilakukan: biasanya tidak ada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Arti: beberapa room key lama hanya ada di store lokal lama dan tidak pernah diunggah ke backup Matrix.
- Yang harus dilakukan: perkirakan sebagian riwayat terenkripsi lama akan tetap tidak tersedia kecuali Anda dapat memulihkan key tersebut secara manual dari klien terverifikasi lain.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Arti: backup ada, tetapi OpenClaw tidak dapat memulihkan recovery key secara otomatis.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Arti: OpenClaw menemukan store terenkripsi lama, tetapi tidak dapat memeriksanya dengan cukup aman untuk menyiapkan pemulihan.
- Yang harus dilakukan: jalankan ulang `openclaw doctor --fix`. Jika tetap berulang, pertahankan direktori status lama tetap utuh dan lakukan pemulihan menggunakan klien Matrix terverifikasi lain plus `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Arti: OpenClaw mendeteksi konflik backup key dan menolak menimpa file recovery-key saat ini secara otomatis.
- Yang harus dilakukan: verifikasi recovery key mana yang benar sebelum mencoba ulang perintah restore apa pun.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Arti: ini adalah batas keras dari format penyimpanan lama.
- Yang harus dilakukan: key yang dicadangkan masih dapat dipulihkan, tetapi riwayat terenkripsi khusus lokal mungkin tetap tidak tersedia.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Arti: Plugin baru mencoba memulihkan tetapi Matrix mengembalikan error.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup status`, lalu coba lagi dengan `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` jika diperlukan.

### Pesan pemulihan manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Arti: OpenClaw tahu bahwa Anda seharusnya memiliki backup key, tetapi key itu tidak aktif di perangkat ini.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup restore`, atau berikan `--recovery-key` jika diperlukan.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Arti: perangkat ini saat ini tidak menyimpan recovery key.
- Yang harus dilakukan: verifikasi perangkat dengan recovery key Anda terlebih dahulu, lalu pulihkan backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Arti: key yang disimpan tidak cocok dengan backup Matrix aktif.
- Yang harus dilakukan: jalankan ulang `openclaw matrix verify device "<your-recovery-key>"` dengan key yang benar.

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan, Anda dapat mereset baseline backup saat ini dengan `openclaw matrix verify backup reset --yes`. Saat secret backup yang disimpan rusak, reset itu juga dapat membuat ulang penyimpanan secret agar backup key baru dapat dimuat dengan benar setelah restart.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Arti: backup ada, tetapi perangkat ini belum cukup mempercayai rantai cross-signing.
- Yang harus dilakukan: jalankan ulang `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Arti: Anda mencoba langkah pemulihan tanpa memberikan recovery key saat key tersebut diperlukan.
- Yang harus dilakukan: jalankan ulang perintah dengan recovery key Anda.

`Invalid Matrix recovery key: ...`

- Arti: key yang diberikan tidak dapat diparse atau tidak cocok dengan format yang diharapkan.
- Yang harus dilakukan: coba lagi dengan recovery key persis dari klien Matrix Anda atau file recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Arti: key sudah diterapkan, tetapi perangkat tetap tidak dapat menyelesaikan verifikasi.
- Yang harus dilakukan: pastikan Anda menggunakan key yang benar dan cross-signing tersedia di akun tersebut, lalu coba lagi.

`Matrix key backup is not active on this device after loading from secret storage.`

- Arti: secret storage tidak menghasilkan sesi backup aktif di perangkat ini.
- Yang harus dilakukan: verifikasi perangkat terlebih dahulu, lalu periksa lagi dengan `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Arti: perangkat ini tidak dapat memulihkan dari secret storage sampai verifikasi perangkat selesai.
- Yang harus dilakukan: jalankan `openclaw matrix verify device "<your-recovery-key>"` terlebih dahulu.

### Pesan instalasi Plugin kustom

`Matrix is installed from a custom path that no longer exists: ...`

- Arti: rekaman instalasi Plugin Anda menunjuk ke path lokal yang sudah tidak ada.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix`, atau jika Anda menjalankan dari checkout repo, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jika riwayat terenkripsi tetap tidak kembali

Jalankan pemeriksaan ini secara berurutan:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Jika backup berhasil dipulihkan tetapi beberapa room lama masih kehilangan riwayat, key yang hilang tersebut kemungkinan besar memang tidak pernah dicadangkan oleh Plugin sebelumnya.

## Jika Anda ingin memulai baru untuk pesan mendatang

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan dan hanya ingin baseline backup yang bersih untuk ke depannya, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jika perangkat masih belum terverifikasi setelah itu, selesaikan verifikasi dari klien Matrix Anda dengan membandingkan emoji SAS atau kode desimal dan mengonfirmasi bahwa keduanya cocok.

## Halaman terkait

- [Matrix](/id/channels/matrix)
- [Doctor](/id/gateway/doctor)
- [Migrating](/id/install/migrating)
- [Plugins](/id/tools/plugin)
