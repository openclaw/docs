---
read_when:
    - Memutakhirkan instalasi Matrix yang sudah ada
    - Memigrasikan riwayat Matrix terenkripsi dan status perangkat
summary: Cara OpenClaw memutakhirkan Plugin Matrix sebelumnya di tempat, termasuk batas pemulihan status terenkripsi dan langkah-langkah pemulihan manual.
title: Migrasi Matrix
x-i18n:
    generated_at: "2026-04-30T09:34:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

Tingkatkan dari Plugin publik `matrix` sebelumnya ke implementasi saat ini.

Bagi sebagian besar pengguna, peningkatan dilakukan di tempat:

- Plugin tetap `@openclaw/matrix`
- channel tetap `matrix`
- konfigurasi Anda tetap berada di bawah `channels.matrix`
- kredensial cache tetap berada di bawah `~/.openclaw/credentials/matrix/`
- state runtime tetap berada di bawah `~/.openclaw/matrix/`

Anda tidak perlu mengganti nama kunci konfigurasi atau menginstal ulang Plugin dengan nama baru.

## Apa yang dilakukan migrasi secara otomatis

Saat Gateway dimulai, dan saat Anda menjalankan [`openclaw doctor --fix`](/id/gateway/doctor), OpenClaw mencoba memperbaiki state Matrix lama secara otomatis.
Sebelum langkah migrasi Matrix yang dapat ditindaklanjuti mengubah state di disk, OpenClaw membuat atau menggunakan kembali snapshot pemulihan yang terfokus.

Saat Anda menggunakan `openclaw update`, pemicu persisnya bergantung pada bagaimana OpenClaw diinstal:

- instalasi dari sumber menjalankan `openclaw doctor --fix` selama alur pembaruan, lalu memulai ulang Gateway secara default
- instalasi melalui manajer paket memperbarui paket, menjalankan pemeriksaan doctor noninteraktif, lalu mengandalkan restart Gateway default agar startup dapat menyelesaikan migrasi Matrix
- jika Anda menggunakan `openclaw update --no-restart`, migrasi Matrix yang didukung startup ditunda sampai nanti Anda menjalankan `openclaw doctor --fix` dan memulai ulang Gateway

Migrasi otomatis mencakup:

- membuat atau menggunakan kembali snapshot pra-migrasi di bawah `~/Backups/openclaw-migrations/`
- menggunakan kembali kredensial Matrix yang di-cache
- mempertahankan pilihan akun dan konfigurasi `channels.matrix` yang sama
- memindahkan penyimpanan sinkronisasi Matrix flat paling lama ke lokasi saat ini yang tercakup per akun
- memindahkan penyimpanan kripto Matrix flat paling lama ke lokasi saat ini yang tercakup per akun ketika akun target dapat diselesaikan dengan aman
- mengekstrak kunci dekripsi cadangan room-key Matrix yang sebelumnya tersimpan dari penyimpanan kripto rust lama, ketika kunci tersebut ada secara lokal
- menggunakan kembali root penyimpanan token-hash paling lengkap yang ada untuk akun Matrix, homeserver, dan pengguna yang sama ketika access token berubah nanti
- memindai root penyimpanan token-hash saudara untuk metadata pemulihan encrypted-state tertunda ketika access token Matrix berubah tetapi identitas akun/perangkat tetap sama
- memulihkan room key yang dicadangkan ke penyimpanan kripto baru pada startup Matrix berikutnya

Detail snapshot:

- OpenClaw menulis file penanda di `~/.openclaw/matrix/migration-snapshot.json` setelah snapshot berhasil sehingga proses startup dan perbaikan berikutnya dapat menggunakan kembali arsip yang sama.
- Snapshot migrasi Matrix otomatis ini hanya mencadangkan konfigurasi + state (`includeWorkspace: false`).
- Jika Matrix hanya memiliki state migrasi khusus peringatan, misalnya karena `userId` atau `accessToken` masih hilang, OpenClaw belum membuat snapshot karena belum ada mutasi Matrix yang dapat ditindaklanjuti.
- Jika langkah snapshot gagal, OpenClaw melewati migrasi Matrix untuk run tersebut alih-alih mengubah state tanpa titik pemulihan.

Tentang peningkatan multi-akun:

- penyimpanan Matrix flat paling lama (`~/.openclaw/matrix/bot-storage.json` dan `~/.openclaw/matrix/crypto/`) berasal dari tata letak satu penyimpanan, sehingga OpenClaw hanya dapat memigrasikannya ke satu target akun Matrix yang terselesaikan
- penyimpanan Matrix lama yang sudah tercakup per akun dideteksi dan disiapkan per akun Matrix yang dikonfigurasi

## Apa yang tidak dapat dilakukan migrasi secara otomatis

Plugin Matrix publik sebelumnya **tidak** membuat cadangan room-key Matrix secara otomatis. Plugin tersebut menyimpan state kripto lokal dan meminta verifikasi perangkat, tetapi tidak menjamin room key Anda dicadangkan ke homeserver.

Artinya, beberapa instalasi terenkripsi hanya dapat dimigrasikan sebagian.

OpenClaw tidak dapat memulihkan secara otomatis:

- room key yang hanya lokal dan tidak pernah dicadangkan
- state terenkripsi ketika akun Matrix target belum dapat diselesaikan karena `homeserver`, `userId`, atau `accessToken` masih belum tersedia
- migrasi otomatis dari satu penyimpanan Matrix flat bersama ketika beberapa akun Matrix dikonfigurasi tetapi `channels.matrix.defaultAccount` tidak disetel
- instalasi path Plugin khusus yang disematkan ke path repo alih-alih paket Matrix standar
- kunci pemulihan yang hilang ketika penyimpanan lama memiliki kunci yang dicadangkan tetapi tidak menyimpan kunci dekripsi secara lokal

Cakupan peringatan saat ini:

- instalasi path Plugin Matrix khusus ditampilkan oleh startup Gateway dan `openclaw doctor`

Jika instalasi lama Anda memiliki riwayat terenkripsi yang hanya lokal dan tidak pernah dicadangkan, beberapa pesan terenkripsi lama mungkin tetap tidak dapat dibaca setelah peningkatan.

## Alur peningkatan yang disarankan

1. Perbarui OpenClaw dan Plugin Matrix seperti biasa.
   Sebaiknya gunakan `openclaw update` biasa tanpa `--no-restart` agar startup dapat segera menyelesaikan migrasi Matrix.
2. Jalankan:

   ```bash
   openclaw doctor --fix
   ```

   Jika Matrix memiliki pekerjaan migrasi yang dapat ditindaklanjuti, doctor akan membuat atau menggunakan kembali snapshot pra-migrasi terlebih dahulu dan mencetak path arsipnya.

3. Mulai atau mulai ulang Gateway.
4. Periksa state verifikasi dan cadangan saat ini:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Masukkan kunci pemulihan untuk akun Matrix yang sedang Anda perbaiki ke variabel lingkungan khusus akun. Untuk satu akun default, `MATRIX_RECOVERY_KEY` sudah cukup. Untuk beberapa akun, gunakan satu variabel per akun, misalnya `MATRIX_RECOVERY_KEY_ASSISTANT`, dan tambahkan `--account assistant` ke perintah.

6. Jika OpenClaw memberi tahu bahwa kunci pemulihan diperlukan, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jika perangkat ini masih belum terverifikasi, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jika kunci pemulihan diterima dan cadangan dapat digunakan, tetapi `Cross-signing verified`
   masih `no`, selesaikan verifikasi mandiri dari klien Matrix lain:

   ```bash
   openclaw matrix verify self
   ```

   Terima permintaan di klien Matrix lain, bandingkan emoji atau desimal,
   dan ketik `yes` hanya ketika keduanya cocok. Perintah hanya keluar dengan sukses
   setelah `Cross-signing verified` menjadi `yes`.

8. Jika Anda sengaja meninggalkan riwayat lama yang tidak dapat dipulihkan dan ingin baseline cadangan baru untuk pesan di masa mendatang, jalankan:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Jika cadangan kunci sisi server belum ada, buat satu untuk pemulihan di masa mendatang:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cara kerja migrasi terenkripsi

Migrasi terenkripsi adalah proses dua tahap:

1. Startup atau `openclaw doctor --fix` membuat atau menggunakan kembali snapshot pra-migrasi jika migrasi terenkripsi dapat ditindaklanjuti.
2. Startup atau `openclaw doctor --fix` memeriksa penyimpanan kripto Matrix lama melalui instalasi Plugin Matrix aktif.
3. Jika kunci dekripsi cadangan ditemukan, OpenClaw menuliskannya ke alur kunci pemulihan baru dan menandai pemulihan room-key sebagai tertunda.
4. Pada startup Matrix berikutnya, OpenClaw secara otomatis memulihkan room key yang dicadangkan ke penyimpanan kripto baru.

Jika penyimpanan lama melaporkan room key yang tidak pernah dicadangkan, OpenClaw memberi peringatan alih-alih berpura-pura pemulihan berhasil.

## Pesan umum dan artinya

### Pesan peningkatan dan deteksi

`Matrix plugin upgraded in place.`

- Arti: state Matrix lama di disk terdeteksi dan dimigrasikan ke tata letak saat ini.
- Yang harus dilakukan: tidak ada kecuali output yang sama juga menyertakan peringatan.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Arti: OpenClaw membuat arsip pemulihan sebelum mengubah state Matrix.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi migrasi berhasil.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Arti: OpenClaw menemukan penanda snapshot migrasi Matrix yang sudah ada dan menggunakan kembali arsip tersebut alih-alih membuat cadangan duplikat.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi migrasi berhasil.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Arti: state Matrix lama ada, tetapi OpenClaw tidak dapat memetakannya ke akun Matrix saat ini karena Matrix belum dikonfigurasi.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: OpenClaw menemukan state lama, tetapi masih belum dapat menentukan root akun/perangkat saat ini yang tepat.
- Yang harus dilakukan: mulai Gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial yang di-cache tersedia.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu penyimpanan Matrix flat bersama, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Arti: lokasi baru yang tercakup per akun sudah memiliki penyimpanan sinkronisasi atau kripto, sehingga OpenClaw tidak menimpanya secara otomatis.
- Yang harus dilakukan: verifikasi bahwa akun saat ini adalah akun yang benar sebelum menghapus atau memindahkan target yang konflik secara manual.

`Failed migrating Matrix legacy sync store (...)` atau `Failed migrating Matrix legacy crypto store (...)`

- Arti: OpenClaw mencoba memindahkan state Matrix lama tetapi operasi filesystem gagal.
- Yang harus dilakukan: periksa izin filesystem dan state disk, lalu jalankan ulang `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Arti: OpenClaw menemukan penyimpanan Matrix terenkripsi lama, tetapi tidak ada konfigurasi Matrix saat ini untuk melampirkannya.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: penyimpanan terenkripsi ada, tetapi OpenClaw tidak dapat memutuskan dengan aman akun/perangkat saat ini mana yang memilikinya.
- Yang harus dilakukan: mulai Gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial yang di-cache tersedia.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu penyimpanan kripto legacy flat bersama, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Arti: OpenClaw mendeteksi state Matrix lama, tetapi migrasi masih terblokir oleh data identitas atau kredensial yang hilang.
- Yang harus dilakukan: selesaikan login Matrix atau penyiapan konfigurasi, lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Arti: OpenClaw menemukan state Matrix terenkripsi lama, tetapi tidak dapat memuat entrypoint helper dari Plugin Matrix yang biasanya memeriksa store tersebut.
- Yang harus dilakukan: instal ulang atau perbaiki Plugin Matrix (`openclaw plugins install @openclaw/matrix`, atau `openclaw plugins install ./path/to/local/matrix-plugin` untuk checkout repo), lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang gateway.
- Jika npm melaporkan paket Matrix milik OpenClaw sebagai deprecated, gunakan plugin bawaan dari build OpenClaw terpaket saat ini atau path checkout lokal hingga paket npm yang lebih baru diterbitkan.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Arti: OpenClaw menemukan path file helper yang keluar dari root plugin atau gagal dalam pemeriksaan batas plugin, sehingga OpenClaw menolak mengimpornya.
- Yang harus dilakukan: instal ulang Plugin Matrix dari path tepercaya, lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Arti: OpenClaw menolak mengubah state Matrix karena tidak dapat membuat snapshot pemulihan terlebih dahulu.
- Yang harus dilakukan: selesaikan error pencadangan, lalu jalankan ulang `openclaw doctor --fix` atau mulai ulang gateway.

`Failed migrating legacy Matrix client storage: ...`

- Arti: fallback sisi klien Matrix menemukan penyimpanan datar lama, tetapi pemindahan gagal. OpenClaw sekarang membatalkan fallback tersebut alih-alih diam-diam memulai dengan store baru.
- Yang harus dilakukan: periksa izin sistem file atau konflik, jaga agar state lama tetap utuh, dan coba lagi setelah memperbaiki error.

`Matrix is installed from a custom path: ...`

- Arti: Matrix dipasangkan ke instalasi berbasis path, sehingga pembaruan mainline tidak secara otomatis menggantinya dengan paket Matrix standar repo.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix` saat Anda ingin kembali ke Plugin Matrix default.
- Jika npm melaporkan paket Matrix milik OpenClaw sebagai deprecated, gunakan plugin bawaan dari build OpenClaw terpaket saat ini hingga paket npm yang lebih baru diterbitkan.

### Pesan pemulihan state terenkripsi

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Arti: room key yang dicadangkan berhasil dipulihkan ke crypto store baru.
- Yang harus dilakukan: biasanya tidak perlu melakukan apa pun.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Arti: beberapa room key lama hanya ada di store lokal lama dan belum pernah diunggah ke cadangan Matrix.
- Yang harus dilakukan: perkirakan sebagian riwayat terenkripsi lama tetap tidak tersedia kecuali Anda dapat memulihkan key tersebut secara manual dari klien lain yang terverifikasi.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Arti: cadangan ada, tetapi OpenClaw tidak dapat memulihkan recovery key secara otomatis.
- Yang harus dilakukan: jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Arti: OpenClaw menemukan store terenkripsi lama, tetapi tidak dapat memeriksanya dengan cukup aman untuk menyiapkan pemulihan.
- Yang harus dilakukan: jalankan ulang `openclaw doctor --fix`. Jika berulang, biarkan direktori state lama tetap utuh dan pulihkan menggunakan klien Matrix terverifikasi lain plus `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Arti: OpenClaw mendeteksi konflik backup key dan menolak menimpa file recovery-key saat ini secara otomatis.
- Yang harus dilakukan: verifikasi recovery key mana yang benar sebelum mencoba ulang perintah pemulihan apa pun.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Arti: ini adalah batas keras format penyimpanan lama.
- Yang harus dilakukan: key yang dicadangkan masih dapat dipulihkan, tetapi riwayat terenkripsi yang hanya lokal mungkin tetap tidak tersedia.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Arti: plugin baru mencoba pemulihan tetapi Matrix mengembalikan error.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup status`, lalu coba lagi dengan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` jika diperlukan.

### Pesan pemulihan manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Arti: OpenClaw mengetahui bahwa Anda seharusnya memiliki backup key, tetapi key tersebut tidak aktif di perangkat ini.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup restore`, atau setel `MATRIX_RECOVERY_KEY` dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` jika diperlukan.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Arti: perangkat ini saat ini belum menyimpan recovery key.
- Yang harus dilakukan: setel `MATRIX_RECOVERY_KEY`, jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, lalu pulihkan cadangan.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Arti: key yang tersimpan tidak cocok dengan cadangan Matrix yang aktif.
- Yang harus dilakukan: setel `MATRIX_RECOVERY_KEY` ke key yang benar dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan, Anda dapat mengganti baseline cadangan saat ini dengan `openclaw matrix verify backup reset --yes`. Saat secret cadangan yang tersimpan rusak, reset tersebut juga dapat membuat ulang secret storage agar backup key baru dapat dimuat dengan benar setelah restart.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Arti: cadangan ada, tetapi perangkat ini belum cukup kuat memercayai rantai cross-signing.
- Yang harus dilakukan: setel `MATRIX_RECOVERY_KEY` dan jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Arti: Anda mencoba langkah pemulihan tanpa menyediakan recovery key saat key tersebut diperlukan.
- Yang harus dilakukan: jalankan ulang perintah dengan `--recovery-key-stdin`, misalnya `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Arti: key yang diberikan tidak dapat diurai atau tidak cocok dengan format yang diharapkan.
- Yang harus dilakukan: coba lagi dengan recovery key persis dari klien Matrix atau file recovery-key Anda.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Arti: OpenClaw dapat menerapkan recovery key, tetapi Matrix masih belum membangun trust identitas cross-signing penuh untuk perangkat ini. Periksa output perintah untuk `Recovery key accepted`, `Backup usable`, `Cross-signing verified`, dan `Device verified by owner`.
- Yang harus dilakukan: jalankan `openclaw matrix verify self`, terima permintaan di klien Matrix lain, bandingkan SAS, dan ketik `yes` hanya saat cocok. Perintah menunggu trust identitas Matrix penuh sebelum melaporkan keberhasilan. Gunakan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` hanya saat Anda memang ingin mengganti identitas cross-signing saat ini.

`Matrix key backup is not active on this device after loading from secret storage.`

- Arti: secret storage tidak menghasilkan sesi cadangan aktif di perangkat ini.
- Yang harus dilakukan: verifikasi perangkat terlebih dahulu, lalu periksa ulang dengan `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Arti: perangkat ini tidak dapat memulihkan dari secret storage hingga verifikasi perangkat selesai.
- Yang harus dilakukan: jalankan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` terlebih dahulu.

### Pesan instalasi plugin kustom

`Matrix is installed from a custom path that no longer exists: ...`

- Arti: catatan instalasi plugin Anda menunjuk ke path lokal yang sudah tidak ada.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix`, atau jika Anda menjalankan dari checkout repo, `openclaw plugins install ./path/to/local/matrix-plugin`.
- Jika npm melaporkan paket Matrix milik OpenClaw sebagai deprecated, gunakan plugin bawaan dari build OpenClaw terpaket saat ini atau path checkout lokal hingga paket npm yang lebih baru diterbitkan.

## Jika riwayat terenkripsi masih belum kembali

Jalankan pemeriksaan berikut secara berurutan:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jika cadangan berhasil dipulihkan tetapi beberapa room lama masih kehilangan riwayat, key yang hilang tersebut kemungkinan tidak pernah dicadangkan oleh plugin sebelumnya.

## Jika Anda ingin memulai baru untuk pesan mendatang

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan dan hanya menginginkan baseline cadangan bersih ke depannya, jalankan perintah berikut secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jika perangkat masih belum terverifikasi setelah itu, selesaikan verifikasi dari klien Matrix Anda dengan membandingkan emoji SAS atau kode desimal dan mengonfirmasi bahwa keduanya cocok.

## Terkait

- [Matrix](/id/channels/matrix): penyiapan dan konfigurasi channel.
- [Aturan push Matrix](/id/channels/matrix-push-rules): perutean notifikasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan dan pemicu migrasi otomatis.
- [Panduan migrasi](/id/install/migrating): semua path migrasi (pemindahan mesin, impor lintas sistem).
- [Plugin](/id/tools/plugin): instalasi dan pendaftaran plugin.
