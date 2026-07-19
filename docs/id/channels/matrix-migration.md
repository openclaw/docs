---
read_when:
    - Memutakhirkan instalasi Matrix yang sudah ada
    - Memigrasikan riwayat Matrix terenkripsi dan status perangkat
summary: Cara OpenClaw memutakhirkan Plugin Matrix sebelumnya secara langsung, termasuk batas pemulihan status terenkripsi dan langkah-langkah pemulihan manual.
title: Migrasi Matrix
x-i18n:
    generated_at: "2026-07-19T04:49:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475c96914900a5597f37001264bd3d8f69a69dbd0600f2704c2a1be46924fac4
    source_path: channels/matrix-migration.md
    workflow: 16
---

Tingkatkan dari plugin publik `matrix` sebelumnya ke implementasi saat ini.

Bagi sebagian besar pengguna, peningkatan sudah tersedia:

- plugin tetap `@openclaw/matrix`
- saluran tetap `matrix`
- konfigurasi Anda tetap berada di bawah `channels.matrix`
- kredensial yang di-cache dipindahkan ke status plugin `state/openclaw.sqlite` bersama
- status runtime tetap berada di bawah `~/.openclaw/matrix/`

Anda tidak perlu mengganti nama kunci konfigurasi atau menginstal ulang plugin dengan nama baru.
Paket root `openclaw` tidak lagi menyertakan kode runtime Matrix atau dependensi
SDK Matrix. Jika `openclaw channels status` menunjukkan bahwa Matrix telah dikonfigurasi tetapi
plugin belum diinstal, jalankan `openclaw doctor --fix` atau
`openclaw plugins install @openclaw/matrix`; jangan instal paket SDK Matrix
ke dalam paket root OpenClaw.

## Yang dilakukan migrasi secara otomatis

Migrasi Matrix berjalan saat Anda menjalankan [`openclaw doctor --fix`](/id/gateway/doctor). Sidecar berbasis file di sebelah penyimpanan khusus Matrix tetap mempertahankan fallback saat memulai klien, tetapi impor file kredensial hanya dilakukan oleh Doctor; runtime hanya membaca status kredensial SQLite kanonis.

Migrasi Doctor mencakup:

- mengimpor dan memverifikasi file `~/.openclaw/credentials/matrix/credentials*.json` yang telah dihentikan sebelum mengarsipkannya
- mempertahankan pemilihan akun dan konfigurasi `channels.matrix` yang sama
- mengimpor status sidecar berbasis file (cache sinkronisasi `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, snapshot IndexedDB) ke status SQLite Matrix; file yang dimigrasikan diarsipkan dengan akhiran `.migrated`
- menggunakan kembali root penyimpanan hash token paling lengkap yang sudah ada untuk akun Matrix, homeserver, pengguna, dan perangkat yang sama ketika token akses berubah kemudian

## Meningkatkan dari rilis OpenClaw yang lebih lama dari 2026.4

Rilis hingga rangkaian 2026.6 juga memigrasikan tata letak Matrix penyimpanan tunggal datar
asli (`~/.openclaw/matrix/bot-storage.json` ditambah
`~/.openclaw/matrix/crypto/`) dan menyiapkan pemulihan status terenkripsi dari
penyimpanan kripto rust lama. Rilis saat ini tidak lagi menyertakan migrasi tersebut.

Jika Anda meningkatkan instalasi yang masih menggunakan tata letak datar, terlebih dahulu
tingkatkan ke rilis 2026.6, jalankan `openclaw doctor --fix`, dan mulai Gateway
sekali agar penyimpanan datar dan setiap kunci ruang yang dapat dipulihkan dimigrasikan. Kemudian perbarui
ke rilis terbaru.

Plugin Matrix publik sebelumnya **tidak** secara otomatis membuat cadangan kunci ruang Matrix. Jika instalasi lama Anda memiliki riwayat terenkripsi lokal saja yang tidak pernah dicadangkan, beberapa pesan terenkripsi lama mungkin tetap tidak dapat dibaca setelah peningkatan, apa pun jalur migrasinya.

## Alur peningkatan yang disarankan

1. Perbarui OpenClaw dan plugin Matrix seperti biasa.
2. Jalankan:

   ```bash
   openclaw doctor --fix
   ```

3. Mulai atau mulai ulang Gateway.
4. Periksa status verifikasi dan cadangan saat ini:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Masukkan kunci pemulihan untuk akun Matrix yang Anda perbaiki ke dalam variabel lingkungan khusus akun. Untuk satu akun default, `MATRIX_RECOVERY_KEY` sudah cukup. Untuk beberapa akun, gunakan satu variabel per akun, misalnya `MATRIX_RECOVERY_KEY_ASSISTANT`, dan tambahkan `--account assistant` ke perintah.

6. Jika OpenClaw memberi tahu bahwa kunci pemulihan diperlukan, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jika perangkat ini masih belum diverifikasi, jalankan perintah untuk akun yang sesuai:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jika kunci pemulihan diterima dan cadangan dapat digunakan, tetapi `Cross-signing verified`
   masih `no`, selesaikan verifikasi mandiri dari klien Matrix lain:

   ```bash
   openclaw matrix verify self
   ```

   Terima permintaan di klien Matrix lain, bandingkan emoji atau angka desimal,
   dan ketik `yes` hanya jika cocok. Perintah menunggu kepercayaan identitas Matrix
   penuh sebelum melaporkan keberhasilan.

8. Jika Anda sengaja meninggalkan riwayat lama yang tidak dapat dipulihkan dan menginginkan garis dasar cadangan baru untuk pesan mendatang, jalankan:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Tambahkan `--rotate-recovery-key` hanya jika kunci pemulihan lama harus berhenti membuka cadangan baru.

9. Jika belum ada cadangan kunci sisi server, buat satu untuk pemulihan mendatang:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Pesan umum dan artinya

`Failed migrating legacy Matrix client storage: ...`

- Arti: fallback sisi klien Matrix menemukan status sidecar berbasis file, tetapi impor ke SQLite gagal. OpenClaw membatalkan pemindahan yang telah selesai dan menghentikan fallback tersebut alih-alih diam-diam memulai dengan penyimpanan baru.
- Yang harus dilakukan: periksa izin atau konflik sistem file, pertahankan status lama tetap utuh, dan coba lagi setelah memperbaiki kesalahan.

`Matrix is installed from a custom path: ...`

- Arti: Matrix disematkan ke instalasi berbasis jalur, sehingga pembaruan jalur utama tidak secara otomatis menggantinya dengan paket Matrix default.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix` ketika Anda ingin kembali ke plugin Matrix default.

`Matrix is installed from a custom path that no longer exists: ...`

- Arti: catatan instalasi plugin Anda mengarah ke jalur lokal yang sudah tidak ada.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix`, atau jika Anda menjalankan dari checkout repositori, `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` juga dapat menghapus referensi plugin Matrix yang usang untuk Anda.

### Pesan pemulihan manual

`openclaw matrix verify status` dan `openclaw matrix verify backup status` mencetak baris `Backup issue:` beserta panduan `Next steps:` ketika cadangan kunci ruang tidak sehat di perangkat ini:

| Masalah cadangan                                                       | Arti                                               | Perbaikan                                                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | tidak ada yang dapat dipulihkan                    | `openclaw matrix verify bootstrap` untuk membuat cadangan kunci ruang                                                                     |
| `backup decryption key is not loaded on this device`                  | kunci tersedia tetapi tidak aktif di sini          | `openclaw matrix verify backup restore`; jika masih tidak dapat memuat kunci, salurkan kunci pemulihan melalui `--recovery-key-stdin`              |
| `backup decryption key could not be loaded from secret storage (...)` | pemuatan penyimpanan rahasia gagal atau tidak didukung | salurkan kunci pemulihan: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                          |
| `backup key mismatch (...)`                                           | kunci tersimpan tidak cocok dengan cadangan server aktif | jalankan ulang `verify backup restore --recovery-key-stdin` dengan kunci cadangan server aktif, atau `verify backup reset --yes` untuk garis dasar baru |
| `backup signature chain is not trusted by this device`                | perangkat belum mempercayai rantai penandatanganan silang | `verify device --recovery-key-stdin`, lalu `verify self` dari klien lain yang telah diverifikasi jika kepercayaan masih belum lengkap   |
| `backup exists but is not active on this device`                      | cadangan server tersedia, sesi lokal tidak aktif   | verifikasi perangkat terlebih dahulu, lalu periksa kembali dengan `openclaw matrix verify backup status`                                     |
| `backup trust state could not be fully determined`                    | diagnostik tidak memberikan kesimpulan             | `openclaw matrix verify status --verbose`                                                                                                       |

Kesalahan pemulihan lainnya:

`Matrix recovery key is required`

- Arti: Anda mencoba langkah pemulihan tanpa memberikan kunci pemulihan ketika kunci tersebut diperlukan.
- Yang harus dilakukan: jalankan ulang perintah dengan `--recovery-key-stdin`, misalnya `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Arti: kunci yang diberikan tidak dapat diurai atau tidak cocok dengan format yang diharapkan.
- Yang harus dilakukan: coba lagi dengan kunci pemulihan yang tepat dari klien Matrix Anda atau ekspor kunci pemulihan.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Arti: kunci pemulihan membuka materi cadangan yang dapat digunakan, tetapi Matrix belum membangun kepercayaan identitas penandatanganan silang penuh untuk perangkat ini. Periksa keluaran perintah untuk `Recovery key accepted`, `Backup usable`, `Cross-signing verified`, dan `Device verified by owner`.
- Yang harus dilakukan: jalankan `openclaw matrix verify self`, terima permintaan di klien Matrix lain, bandingkan SAS, dan ketik `yes` hanya jika cocok. Gunakan `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` hanya jika Anda sengaja ingin mengganti identitas penandatanganan silang saat ini.

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan, sebagai gantinya Anda dapat mereset
garis dasar cadangan saat ini dengan `openclaw matrix verify backup reset --yes`. Ketika
rahasia cadangan yang tersimpan rusak, reset tersebut juga memperbaiki penyimpanan rahasia agar
kunci cadangan baru dapat dimuat dengan benar setelah dimulai ulang.

## Jika riwayat terenkripsi masih belum kembali

Jalankan pemeriksaan berikut secara berurutan:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jika cadangan berhasil dipulihkan tetapi riwayat di beberapa ruang lama masih hilang, kunci yang hilang tersebut kemungkinan tidak pernah dicadangkan oleh plugin sebelumnya.

## Jika Anda ingin memulai dari awal untuk pesan mendatang

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan dan hanya menginginkan garis dasar cadangan yang bersih untuk selanjutnya, jalankan perintah berikut secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jika perangkat masih belum diverifikasi setelah itu, selesaikan verifikasi dari klien Matrix Anda dengan membandingkan emoji SAS atau kode desimal dan mengonfirmasi bahwa semuanya cocok.

## Terkait

- [Matrix](/id/channels/matrix): penyiapan dan konfigurasi saluran.
- [Aturan push Matrix](/id/channels/matrix-push-rules): perutean notifikasi.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan dan pemicu migrasi otomatis.
- [Panduan migrasi](/id/install/migrating): semua jalur migrasi (pemindahan mesin, impor lintas sistem).
- [Plugin](/id/tools/plugin): instalasi dan pendaftaran plugin.
