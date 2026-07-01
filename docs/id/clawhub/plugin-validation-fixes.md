---
read_when:
    - Anda menjalankan clawhub package validate dan perlu memperbaiki temuan plugin
    - ClawHub menolak atau memperingatkan pada publikasi paket plugin
    - Anda sedang memperbarui metadata paket plugin sebelum rilis
summary: Perbaiki temuan validasi paket Plugin ClawHub sebelum dipublikasikan
title: Perbaikan validasi Plugin
x-i18n:
    generated_at: "2026-07-01T08:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Perbaikan validasi Plugin

ClawHub memvalidasi paket Plugin sebelum publikasi dan juga dapat menampilkan temuan dari
pemindaian paket otomatis. Halaman ini membahas temuan yang ditujukan untuk penulis, yaitu
temuan yang dapat diperbaiki penulis Plugin di metadata paket, manifest, impor SDK,
atau artefak yang diterbitkan.

Halaman ini tidak membahas temuan cakupan Plugin Inspector internal. Jika laporan lengkap
berisi kode pemeliharaan pemindai tanpa panduan remediasi untuk penulis, kode tersebut
ditujukan untuk maintainer OpenClaw, bukan penulis Plugin.

Setelah menerapkan perbaikan apa pun, jalankan ulang:

```bash
clawhub package validate <path-to-plugin>
```

## Temuan untuk penulis

| Kode                                    | Mulai di sini                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Tambahkan metadata paket](/id/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Tambahkan blok openclaw paket](/id/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Deklarasikan entrypoint paket OpenClaw](/id/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publikasikan entrypoint yang dideklarasikan](/id/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Lengkapi metadata instalasi](/id/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Deklarasikan kompatibilitas API Plugin](/id/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Selaraskan versi host minimum](/id/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Selaraskan versi paket dan manifest](/id/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Hapus metadata paket OpenClaw yang tidak didukung](/id/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Jadikan artefak npm dapat dipaketkan](/id/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Sertakan entrypoint dalam output npm pack](/id/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Sertakan metadata dalam output npm pack](/id/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Tambahkan nama tampilan manifest](/id/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Hapus kolom manifest yang tidak didukung](/id/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Hapus kunci kontrak yang tidak didukung](/id/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Ganti impor SDK root](/id/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Hapus impor SDK yang dicadangkan](/id/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Ganti akses seluruh session store](/id/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Ganti penulisan seluruh session store](/id/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Ganti helper jalur file sesi](/id/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Ganti target file transkrip lama](/id/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Ganti helper transkrip tingkat rendah](/id/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Ganti before_agent_start](/id/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Pindahkan env var penyedia ke metadata setup](/id/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Cerminkan env var channel dalam metadata saat ini](/id/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Hapus referensi skema manifest keamanan yang tidak tersedia](/id/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Hapus file manifest keamanan yang tidak didukung](/id/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadata paket

### package-json-missing

Root paket tidak menyertakan `package.json`, sehingga ClawHub tidak dapat mengidentifikasi
paket npm, versi, entrypoint, atau metadata OpenClaw.

- Tambahkan `package.json` dengan `name`, `version`, dan `type`.
- Tambahkan blok `openclaw` saat paket mengirimkan Plugin OpenClaw.
- Gunakan [Membangun Plugin](/id/plugins/building-plugins) untuk contoh paket
  minimal dan [Manifest Plugin](/id/plugins/manifest#manifest-versus-packagejson)
  untuk pemisahan paket versus manifest.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Paket memiliki `package.json`, tetapi tidak mendeklarasikan metadata paket
OpenClaw.

- Tambahkan `package.json#openclaw`.
- Sertakan metadata entrypoint seperti `openclaw.extensions` atau
  `openclaw.runtimeExtensions`.
- Tambahkan metadata kompatibilitas dan instalasi saat paket akan diterbitkan atau
  diinstal melalui ClawHub.
- Lihat [kolom package.json yang memengaruhi discovery](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Metadata paket ada, tetapi tidak mendeklarasikan entrypoint runtime
OpenClaw.

- Tambahkan `openclaw.extensions` untuk entrypoint Plugin native.
- Tambahkan `openclaw.runtimeExtensions` saat paket yang diterbitkan harus memuat
  JavaScript hasil build.
- Simpan semua jalur entrypoint di dalam direktori paket.
- Lihat [Titik masuk Plugin](/id/plugins/sdk-entrypoints) dan
  [kolom package.json yang memengaruhi discovery](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Paket mendeklarasikan entrypoint OpenClaw, tetapi file yang dirujuk tidak ada
dalam paket yang sedang divalidasi.

- Periksa setiap jalur di `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry`, dan `openclaw.runtimeSetupEntry`.
- Build paket jika entrypoint dihasilkan ke `dist`.
- Perbarui metadata jika entrypoint dipindahkan.
- Lihat [Titik masuk Plugin](/id/plugins/sdk-entrypoints).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub tidak dapat mengetahui bagaimana paket harus diinstal atau diperbarui.

- Isi `openclaw.install` dengan sumber instalasi yang didukung, seperti
  `clawhubSpec`, `npmSpec`, atau `localPath`.
- Atur `openclaw.install.defaultChoice` saat lebih dari satu sumber instalasi
  tersedia.
- Gunakan `openclaw.install.minHostVersion` untuk versi host OpenClaw minimum.
- Lihat [kolom package.json yang memengaruhi discovery](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Paket tidak mendeklarasikan rentang API Plugin OpenClaw yang didukungnya.

- Tambahkan `openclaw.compat.pluginApi` ke `package.json`.
- Gunakan versi API Plugin OpenClaw atau batas bawah semver yang Anda gunakan
  saat membangun dan menguji.
- Pisahkan ini dari versi paket. Versi paket menjelaskan rilis
  Plugin; `openclaw.compat.pluginApi` menjelaskan kontrak API host.
- Lihat [kolom package.json yang memengaruhi discovery](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Versi host minimum paket tidak cocok dengan metadata versi OpenClaw
yang menjadi dasar build paket.

- Periksa `openclaw.install.minHostVersion`.
- Periksa metadata build OpenClaw apa pun dalam paket, seperti versi OpenClaw
  yang digunakan selama rilis.
- Selaraskan versi host minimum dengan rentang versi host yang benar-benar
  didukung paket.
- Lihat [kolom package.json yang memengaruhi discovery](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Versi paket dan versi manifest Plugin tidak cocok.

- Utamakan `package.json#version` sebagai versi rilis paket.
- Jika `openclaw.plugin.json` juga memiliki `version`, perbarui agar cocok atau hapus
  metadata versi manifest yang usang saat metadata paket menjadi sumber otoritatif.
- Terbitkan versi paket baru setelah mengubah metadata yang sudah diterbitkan.
- Lihat [Manifest Plugin](/id/plugins/manifest).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Blok `package.json#openclaw` berisi kolom yang bukan metadata paket
OpenClaw yang didukung.

- Hapus kolom yang tidak didukung seperti `openclaw.bundle`.
- Simpan metadata Plugin native di `openclaw.plugin.json`.
- Simpan entrypoint paket, kompatibilitas, instalasi, setup, dan metadata katalog
  dalam kolom `package.json#openclaw` yang didukung.
- Lihat [kolom package.json yang memengaruhi discovery](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Artefak yang diterbitkan

### package-npm-pack-unavailable

Paket tidak dapat dipaketkan menjadi artefak yang akan diperiksa atau
diterbitkan ClawHub.

- Jalankan `npm pack --dry-run` dari root paket.
- Perbaiki metadata paket yang tidak valid, skrip lifecycle yang rusak, atau entri files yang
  membuat pemaketan gagal.
- Hapus `private: true` jika paket ini ditujukan untuk publikasi publik.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Paket dapat dipaketkan, tetapi artefak yang dipaketkan tidak menyertakan
file entrypoint yang dideklarasikan di `package.json#openclaw`.

- Jalankan `npm pack --dry-run` dan periksa file yang akan disertakan.
- Build entrypoint yang dihasilkan sebelum pemaketan.
- Perbarui `files`, `.npmignore`, atau output build agar entrypoint yang dideklarasikan
  disertakan.
- Lihat [Titik masuk Plugin](/id/plugins/sdk-entrypoints).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Artefak yang dipaketkan tidak memiliki metadata OpenClaw yang ada dalam paket
sumber Anda.

- Jalankan `npm pack --dry-run` dan periksa file metadata yang disertakan.
- Pastikan `package.json` menyertakan blok `openclaw` dalam artefak yang dipaketkan.
- Pastikan `openclaw.plugin.json` disertakan saat paket adalah Plugin OpenClaw
  native.
- Perbarui `files` atau `.npmignore` agar metadata paket tidak dikecualikan.
- Lihat [Membangun Plugin](/id/plugins/building-plugins).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Metadata manifest

### manifest-name-missing

Manifes Plugin native tidak menyertakan nama tampilan.

- Tambahkan bidang `name` yang tidak kosong ke `openclaw.plugin.json`.
- Buat `name` mudah dibaca manusia dan pertahankan `id` sebagai id mesin yang stabil.
- Lihat [manifes Plugin](/id/plugins/manifest).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifes Plugin memiliki bidang tingkat atas yang tidak didukung OpenClaw.

- Bandingkan setiap bidang tingkat atas dengan
  [referensi bidang manifes](/id/plugins/manifest#top-level-field-reference).
- Hapus bidang kustom dari `openclaw.plugin.json`.
- Pindahkan metadata paket atau instalasi ke bidang `package.json#openclaw`
  yang didukung, bukan ke manifes.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifes mendeklarasikan kunci yang tidak didukung di dalam `contracts`.

- Bandingkan setiap kunci di bawah `contracts` dengan
  [referensi kontrak](/id/plugins/manifest#contracts-reference).
- Hapus kunci kontrak yang tidak didukung.
- Pindahkan perilaku saat eksekusi ke kode pendaftaran Plugin, dan batasi `contracts`
  hanya untuk metadata kepemilikan kapabilitas statis.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## SDK dan migrasi kompatibilitas

### legacy-root-sdk-import

Plugin mengimpor dari barrel SDK akar yang sudah tidak digunakan:
`openclaw/plugin-sdk`.

- Ganti impor barrel akar dengan impor subjalur publik yang terfokus.
- Gunakan `openclaw/plugin-sdk/plugin-entry` untuk `definePluginEntry`.
- Gunakan `openclaw/plugin-sdk/channel-core` untuk pembantu titik masuk kanal.
- Gunakan [Konvensi impor](/id/plugins/building-plugins#import-conventions) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths) untuk menemukan impor yang sempit.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin mengimpor jalur SDK yang dicadangkan untuk Plugin bawaan atau
kompatibilitas internal.

- Ganti impor SDK internal OpenClaw yang dicadangkan dengan subjalur publik
  `openclaw/plugin-sdk/*` yang terdokumentasi.
- Jika perilaku tersebut tidak memiliki SDK publik, simpan pembantu di dalam paket Anda atau
  minta API OpenClaw publik.
- Gunakan [Subjalur SDK Plugin](/id/plugins/sdk-subpaths) dan
  [Migrasi SDK](/id/plugins/sdk-migration) untuk memilih impor yang didukung.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin masih menggunakan pembantu seluruh penyimpanan sesi yang sudah tidak digunakan
`loadSessionStore`.

- Gunakan `getSessionEntry(...)` atau `listSessionEntries(...)` saat membaca status sesi.
- Gunakan `patchSessionEntry(...)` atau `upsertSessionEntry(...)` saat menulis status sesi.
- Hindari memuat, memutasi, dan menyimpan seluruh objek penyimpanan sesi.
- Pertahankan `loadSessionStore(...)` hanya selama rentang kompatibilitas yang Anda deklarasikan
  masih mendukung versi OpenClaw lama yang membutuhkannya.
- Lihat [API Runtime](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin masih menggunakan pembantu tulis seluruh penyimpanan sesi yang sudah tidak digunakan seperti
`saveSessionStore` atau `updateSessionStore`.

- Gunakan `patchSessionEntry(...)` saat memperbarui bidang pada entri sesi yang ada.
- Gunakan `upsertSessionEntry(...)` saat mengganti atau membuat entri sesi.
- Hindari memuat, memutasi, dan menyimpan seluruh objek penyimpanan sesi.
- Pertahankan pembantu tulis seluruh penyimpanan hanya selama rentang kompatibilitas yang Anda deklarasikan
  masih mendukung versi OpenClaw lama yang membutuhkannya.
- Lihat [API Runtime](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin masih menggunakan pembantu jalur file sesi yang sudah tidak digunakan seperti
`resolveSessionFilePath` atau `resolveAndPersistSessionFile`.

- Gunakan `getSessionEntry(...)` untuk membaca metadata sesi berdasarkan agen dan
  identitas sesi.
- Gunakan `patchSessionEntry(...)` atau `upsertSessionEntry(...)` untuk menyimpan metadata sesi.
- Gunakan identitas transkrip atau pembantu target saat kode sedang menyiapkan
  operasi transkrip.
- Jangan menyimpan atau bergantung pada jalur file transkrip lama.
- Lihat [API Runtime](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin masih menggunakan pembantu target file transkrip yang sudah tidak digunakan
`resolveSessionTranscriptLegacyFileTarget`.

- Gunakan `resolveSessionTranscriptIdentity(...)` saat kode hanya memerlukan identitas
  sesi publik.
- Gunakan `resolveSessionTranscriptTarget(...)` saat kode memerlukan target operasi
  transkrip terstruktur.
- Hindari membaca atau menyusun target file transkrip lama secara langsung.
- Pertahankan pembantu lama hanya selama rentang kompatibilitas yang Anda deklarasikan masih
  mendukung versi OpenClaw lama yang membutuhkannya.
- Lihat [API Runtime](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin masih menggunakan pembantu transkrip tingkat rendah yang sudah tidak digunakan seperti
`appendSessionTranscriptMessage` atau `emitSessionTranscriptUpdate`.

- Gunakan `appendSessionTranscriptMessageByIdentity(...)` untuk penambahan transkrip.
- Gunakan `publishSessionTranscriptUpdateByIdentity(...)` untuk notifikasi pembaruan transkrip.
- Utamakan permukaan runtime transkrip terstruktur agar OpenClaw dapat menerapkan
  batas transaksi dan penanganan identitas yang tepat.
- Pertahankan pembantu transkrip tingkat rendah hanya selama rentang kompatibilitas yang Anda deklarasikan
  masih mendukung versi OpenClaw lama yang membutuhkannya.
- Lihat [API Runtime](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin masih menggunakan hook lama `before_agent_start`.

- Pindahkan pekerjaan penggantian model atau penyedia ke `before_model_resolve`.
- Pindahkan pekerjaan mutasi prompt atau konteks ke `before_prompt_build`.
- Pertahankan `before_agent_start` hanya selama rentang kompatibilitas yang Anda deklarasikan masih
  mendukung versi OpenClaw lama yang membutuhkannya.
- Lihat [Hook](/id/plugins/hooks) dan
  [Kompatibilitas Plugin](/id/plugins/compatibility).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifes masih menggunakan metadata autentikasi penyedia lama `providerAuthEnvVars`.

- Cerminkan metadata variabel lingkungan penyedia ke `setup.providers[].envVars`.
- Pertahankan `providerAuthEnvVars` hanya sebagai metadata kompatibilitas selama rentang
  OpenClaw yang didukung masih membutuhkannya.
- Lihat [referensi setup](/id/plugins/manifest#setup-reference) dan
  [Migrasi SDK](/id/plugins/sdk-migration).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifes menggunakan metadata variabel lingkungan kanal lama atau versi lebih lama tanpa metadata
setup atau konfigurasi saat ini yang diharapkan ClawHub.

- Pertahankan metadata variabel lingkungan kanal tetap deklaratif agar OpenClaw dapat memeriksa status setup
  tanpa memuat runtime kanal.
- Cerminkan setup kanal berbasis variabel lingkungan ke metadata setup, konfigurasi kanal, atau
  kanal paket saat ini yang digunakan oleh bentuk Plugin Anda.
- Pertahankan `channelEnvVars` hanya sebagai metadata kompatibilitas selama versi OpenClaw lama
  yang didukung masih membutuhkannya.
- Lihat [manifes Plugin](/id/plugins/manifest) dan
  [Plugin kanal](/id/plugins/sdk-channel-plugins).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Manifes keamanan

### security-manifest-schema-unavailable

Paket mengirimkan `openclaw.security.json` dengan referensi skema yang tidak dikenali ClawHub
sebagai tersedia.

- Hapus URL skema jika hanya bersifat anjuran.
- Gunakan skema berversi yang terdokumentasi hanya setelah OpenClaw menerbitkannya.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Paket mengirimkan file manifes keamanan yang tidak didukung.

- Hapus `openclaw.security.json` hingga OpenClaw mendokumentasikan skema manifes keamanan
  berversi dan perilaku ClawHub.
- Tetap dokumentasikan perilaku yang sensitif terhadap keamanan di dokumen paket publik atau
  README Anda hingga kontrak manifes tersedia.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Terkait

- [CLI ClawHub](/id/clawhub/cli)
- [Penerbitan ClawHub](/id/clawhub/publishing)
- [Membangun Plugin](/id/plugins/building-plugins)
- [manifes Plugin](/id/plugins/manifest)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Kompatibilitas Plugin](/id/plugins/compatibility)
