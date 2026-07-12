---
read_when:
    - Anda menjalankan `clawhub package validate` dan perlu memperbaiki temuan Plugin
    - ClawHub menolak atau memberikan peringatan saat paket Plugin dipublikasikan
    - Anda sedang memperbarui metadata paket plugin sebelum rilis
summary: Perbaiki temuan validasi paket Plugin ClawHub sebelum dipublikasikan
title: Perbaikan validasi Plugin
x-i18n:
    generated_at: "2026-07-12T14:03:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Perbaikan validasi plugin

ClawHub memvalidasi paket plugin sebelum dipublikasikan dan juga dapat menampilkan temuan dari
pemindaian paket otomatis. Halaman ini membahas temuan yang ditujukan kepada pembuat, yaitu
temuan yang dapat diperbaiki oleh pembuat plugin dalam metadata paket, manifes, impor SDK,
atau artefak yang dipublikasikan.

Halaman ini tidak membahas temuan cakupan internal Pemeriksa Plugin. Jika laporan lengkap
berisi kode pemeliharaan pemindai tanpa panduan perbaikan bagi pembuat, kode tersebut
ditujukan bagi pengelola OpenClaw, bukan pembuat plugin.

Setelah menerapkan perbaikan apa pun, jalankan kembali:

```bash
clawhub package validate <path-to-plugin>
```

## Temuan yang ditujukan kepada pembuat

| Kode                                    | Mulai di sini                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Tambahkan metadata paket](/id/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Tambahkan blok openclaw paket](/id/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Deklarasikan titik masuk paket OpenClaw](/id/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publikasikan titik masuk yang dideklarasikan](/id/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Lengkapi metadata instalasi](/id/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Deklarasikan kompatibilitas API plugin](/id/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Selaraskan versi minimum hos](/id/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Selaraskan versi paket dan manifes](/id/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Hapus metadata paket OpenClaw yang tidak didukung](/id/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Pastikan artefak npm dapat dikemas](/id/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Sertakan titik masuk dalam keluaran npm pack](/id/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Sertakan metadata dalam keluaran npm pack](/id/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Tambahkan nama tampilan manifes](/id/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Hapus bidang manifes yang tidak didukung](/id/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Hapus kunci kontrak yang tidak didukung](/id/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Ganti impor SDK akar](/id/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Hapus impor SDK yang dicadangkan](/id/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Ganti akses ke seluruh penyimpanan sesi](/id/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Ganti penulisan ke seluruh penyimpanan sesi](/id/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Ganti pembantu jalur berkas sesi](/id/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Ganti target berkas transkrip lama](/id/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Ganti pembantu transkrip tingkat rendah](/id/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Ganti before_agent_start](/id/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Pindahkan variabel lingkungan penyedia ke metadata penyiapan](/id/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Cerminkan variabel lingkungan kanal dalam metadata saat ini](/id/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Hapus referensi skema manifes keamanan yang tidak tersedia](/id/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Hapus berkas manifes keamanan yang tidak didukung](/id/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadata paket

### package-json-missing

Akar paket tidak menyertakan `package.json`, sehingga ClawHub tidak dapat mengidentifikasi
paket npm, versi, titik masuk, atau metadata OpenClaw.

- Tambahkan `package.json` dengan `name`, `version`, dan `type`.
- Tambahkan blok `openclaw` jika paket menyertakan plugin OpenClaw.
- Gunakan [Membangun plugin](/id/plugins/building-plugins) untuk contoh paket
  minimal dan [Manifes plugin](/id/plugins/manifest#manifest-versus-packagejson)
  untuk pemisahan antara paket dan manifes.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Paket memiliki `package.json`, tetapi tidak mendeklarasikan metadata paket
OpenClaw.

- Tambahkan `package.json#openclaw`.
- Sertakan metadata titik masuk seperti `openclaw.extensions` atau
  `openclaw.runtimeExtensions`.
- Tambahkan metadata kompatibilitas dan instalasi jika paket akan dipublikasikan atau
  diinstal melalui ClawHub.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Metadata paket tersedia, tetapi tidak mendeklarasikan titik masuk runtime
OpenClaw.

- Tambahkan `openclaw.extensions` untuk titik masuk plugin asli.
- Tambahkan `openclaw.runtimeExtensions` jika paket yang dipublikasikan harus memuat
  JavaScript hasil kompilasi.
- Pertahankan semua jalur titik masuk di dalam direktori paket.
- Lihat [Titik masuk plugin](/id/plugins/sdk-entrypoints) dan
  [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Paket mendeklarasikan titik masuk OpenClaw, tetapi berkas yang dirujuk tidak ada
dalam paket yang sedang divalidasi.

- Periksa setiap jalur dalam `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry`, dan `openclaw.runtimeSetupEntry`.
- Bangun paket jika titik masuk dihasilkan ke dalam `dist`.
- Perbarui metadata jika titik masuk telah dipindahkan.
- Lihat [Titik masuk plugin](/id/plugins/sdk-entrypoints).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub tidak dapat menentukan cara paket harus diinstal atau diperbarui.

- Isi `openclaw.install` dengan sumber instalasi yang didukung, seperti
  `clawhubSpec`, `npmSpec`, atau `localPath`.
- Atur `openclaw.install.defaultChoice` jika tersedia lebih dari satu sumber
  instalasi.
- Gunakan `openclaw.install.minHostVersion` untuk versi minimum hos OpenClaw.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Paket tidak mendeklarasikan rentang API plugin OpenClaw yang didukungnya.

- Tambahkan `openclaw.compat.pluginApi` ke `package.json`.
- Gunakan versi API plugin OpenClaw atau batas bawah semver yang menjadi acuan
  pembuatan dan pengujian.
- Pisahkan ini dari versi paket. Versi paket menjelaskan rilis
  plugin; `openclaw.compat.pluginApi` menjelaskan kontrak API hos.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Versi minimum hos paket tidak cocok dengan metadata versi OpenClaw
yang menjadi acuan pembuatan paket.

- Periksa `openclaw.install.minHostVersion`.
- Periksa setiap metadata pembuatan OpenClaw dalam paket, seperti versi OpenClaw
  yang digunakan selama perilisan.
- Selaraskan versi minimum hos dengan rentang versi hos yang benar-benar
  didukung paket.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Versi paket dan versi manifes plugin tidak cocok.

- Utamakan `package.json#version` sebagai versi rilis paket.
- Jika `openclaw.plugin.json` juga memiliki `version`, perbarui agar cocok atau hapus
  metadata versi manifes yang usang jika metadata paket bersifat otoritatif.
- Publikasikan versi paket baru setelah mengubah metadata yang telah dipublikasikan.
- Lihat [Manifes plugin](/id/plugins/manifest).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Blok `package.json#openclaw` berisi bidang yang bukan merupakan metadata paket
OpenClaw yang didukung.

- Hapus bidang yang tidak didukung seperti `openclaw.bundle`.
- Simpan metadata plugin asli dalam `openclaw.plugin.json`.
- Simpan titik masuk paket, kompatibilitas, instalasi, penyiapan, dan metadata katalog
  dalam bidang `package.json#openclaw` yang didukung.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

## Artefak yang dipublikasikan

### package-npm-pack-unavailable

Paket tidak dapat dikemas menjadi artefak yang akan diperiksa atau
dipublikasikan oleh ClawHub.

- Jalankan `npm pack --dry-run` dari akar paket.
- Perbaiki metadata paket yang tidak valid, skrip siklus hidup yang rusak, atau entri `files` yang
  menyebabkan pengemasan gagal.
- Hapus `private: true` jika paket ini dimaksudkan untuk publikasi umum.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Paket dapat dikemas, tetapi artefak yang dikemas tidak menyertakan
berkas titik masuk yang dideklarasikan dalam `package.json#openclaw`.

- Jalankan `npm pack --dry-run` dan periksa berkas yang akan disertakan.
- Bangun titik masuk yang dihasilkan sebelum pengemasan.
- Perbarui `files`, `.npmignore`, atau keluaran hasil kompilasi agar titik masuk yang dideklarasikan
  disertakan.
- Lihat [Titik masuk plugin](/id/plugins/sdk-entrypoints).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Artefak yang dikemas tidak memiliki metadata OpenClaw yang tersedia dalam paket
sumber Anda.

- Jalankan `npm pack --dry-run` dan periksa berkas metadata yang disertakan.
- Pastikan `package.json` menyertakan blok `openclaw` dalam artefak yang dikemas.
- Pastikan `openclaw.plugin.json` disertakan jika paket merupakan plugin
  OpenClaw asli.
- Perbarui `files` atau `.npmignore` agar metadata paket tidak dikecualikan.
- Lihat [Membangun plugin](/id/plugins/building-plugins).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

## Metadata manifes

### manifest-name-missing

Manifes plugin native tidak menyertakan nama tampilan.

- Tambahkan bidang `name` yang tidak kosong ke `openclaw.plugin.json`.
- Pastikan `name` mudah dibaca manusia dan pertahankan `id` sebagai ID mesin yang stabil.
- Lihat [Manifes plugin](/id/plugins/manifest).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifes plugin memiliki bidang tingkat teratas yang tidak didukung OpenClaw.

- Bandingkan setiap bidang tingkat teratas dengan
  [referensi bidang manifes](/id/plugins/manifest#top-level-field-reference).
- Hapus bidang khusus dari `openclaw.plugin.json`.
- Pindahkan metadata paket atau instalasi ke bidang `package.json#openclaw` yang didukung,
  bukan ke manifes.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifes mendeklarasikan kunci yang tidak didukung di dalam `contracts`.

- Bandingkan setiap kunci di bawah `contracts` dengan
  [referensi kontrak](/id/plugins/manifest#contracts-reference).
- Hapus kunci kontrak yang tidak didukung.
- Pindahkan perilaku waktu proses ke kode pendaftaran plugin, dan batasi `contracts`
  hanya untuk metadata kepemilikan kemampuan statis.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

## Migrasi SDK dan kompatibilitas

### legacy-root-sdk-import

Plugin mengimpor dari barrel SDK akar yang sudah tidak digunakan:
`openclaw/plugin-sdk`.

- Ganti impor barrel akar dengan impor subjalur publik yang spesifik.
- Gunakan `openclaw/plugin-sdk/plugin-entry` untuk `definePluginEntry`.
- Gunakan `openclaw/plugin-sdk/channel-core` untuk pembantu titik masuk kanal.
- Gunakan [Konvensi impor](/id/plugins/building-plugins#import-conventions) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths) untuk menemukan impor yang paling spesifik.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin mengimpor jalur SDK yang dikhususkan untuk plugin bawaan atau kompatibilitas
internal.

- Ganti impor SDK internal OpenClaw yang dicadangkan dengan subjalur publik
  `openclaw/plugin-sdk/*` yang terdokumentasi.
- Jika perilaku tersebut tidak memiliki SDK publik, simpan pembantu di dalam paket Anda atau
  minta API OpenClaw publik.
- Gunakan [Subjalur SDK Plugin](/id/plugins/sdk-subpaths) dan
  [Migrasi SDK](/id/plugins/sdk-migration) untuk memilih impor yang didukung.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin masih menggunakan pembantu seluruh penyimpanan sesi yang sudah tidak digunakan,
`loadSessionStore`.

- Gunakan `getSessionEntry(...)` atau `listSessionEntries(...)` saat membaca status
  sesi.
- Gunakan `patchSessionEntry(...)` atau `upsertSessionEntry(...)` saat menulis status
  sesi.
- Hindari memuat, mengubah, dan menyimpan seluruh objek penyimpanan sesi.
- Pertahankan `loadSessionStore(...)` hanya selama rentang kompatibilitas yang Anda deklarasikan
  masih mendukung versi OpenClaw lama yang memerlukannya.
- Lihat [API waktu proses](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin masih menggunakan pembantu penulisan seluruh penyimpanan sesi yang sudah tidak digunakan, seperti
`saveSessionStore` atau `updateSessionStore`.

- Gunakan `patchSessionEntry(...)` saat memperbarui bidang pada entri sesi yang sudah ada.
- Gunakan `upsertSessionEntry(...)` saat mengganti atau membuat entri sesi.
- Hindari memuat, mengubah, dan menyimpan seluruh objek penyimpanan sesi.
- Pertahankan pembantu penulisan seluruh penyimpanan hanya selama rentang kompatibilitas yang Anda deklarasikan
  masih mendukung versi OpenClaw lama yang memerlukannya.
- Lihat [API waktu proses](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin masih menggunakan pembantu jalur berkas sesi yang sudah tidak digunakan, seperti
`resolveSessionFilePath` atau `resolveAndPersistSessionFile`.

- Gunakan `getSessionEntry(...)` untuk membaca metadata sesi berdasarkan identitas agen dan
  sesi.
- Gunakan `patchSessionEntry(...)` atau `upsertSessionEntry(...)` untuk menyimpan metadata
  sesi.
- Gunakan identitas transkrip atau pembantu target saat kode menyiapkan operasi
  transkrip.
- Jangan menyimpan atau bergantung pada jalur berkas transkrip lama.
- Lihat [API waktu proses](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin masih menggunakan pembantu target berkas transkrip yang sudah tidak digunakan,
`resolveSessionTranscriptLegacyFileTarget`.

- Gunakan `resolveSessionTranscriptIdentity(...)` saat kode hanya memerlukan identitas
  sesi publik.
- Gunakan `resolveSessionTranscriptTarget(...)` saat kode memerlukan target
  operasi transkrip terstruktur.
- Hindari membaca atau menyusun target berkas transkrip lama secara langsung.
- Pertahankan pembantu lama hanya selama rentang kompatibilitas yang Anda deklarasikan masih
  mendukung versi OpenClaw lama yang memerlukannya.
- Lihat [API waktu proses](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin masih menggunakan pembantu transkrip tingkat rendah yang sudah tidak digunakan, seperti
`appendSessionTranscriptMessage` atau `emitSessionTranscriptUpdate`.

- Gunakan `appendSessionTranscriptMessageByIdentity(...)` untuk menambahkan transkrip.
- Gunakan `publishSessionTranscriptUpdateByIdentity(...)` untuk notifikasi pembaruan
  transkrip.
- Utamakan permukaan waktu proses transkrip terstruktur agar OpenClaw dapat menerapkan
  batas transaksi dan penanganan identitas yang benar.
- Pertahankan pembantu transkrip tingkat rendah hanya selama rentang kompatibilitas yang Anda deklarasikan
  masih mendukung versi OpenClaw lama yang memerlukannya.
- Lihat [API waktu proses](/id/plugins/sdk-runtime#agent-session-state) dan
  [Subjalur SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin masih menggunakan kait lama `before_agent_start`.

- Pindahkan pekerjaan penggantian model atau penyedia ke `before_model_resolve`.
- Pindahkan pekerjaan perubahan prompt atau konteks ke `before_prompt_build`.
- Pertahankan `before_agent_start` hanya selama rentang kompatibilitas yang Anda deklarasikan masih
  mendukung versi OpenClaw lama yang memerlukannya.
- Lihat [Kait](/id/plugins/hooks) dan
  [Kompatibilitas Plugin](/id/plugins/compatibility).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifes masih menggunakan metadata autentikasi penyedia lama `providerAuthEnvVars`.

- Salin metadata variabel lingkungan penyedia ke `setup.providers[].envVars`.
- Pertahankan `providerAuthEnvVars` hanya sebagai metadata kompatibilitas selama rentang
  OpenClaw yang Anda dukung masih memerlukannya.
- Lihat [referensi penyiapan](/id/plugins/manifest#setup-reference) dan
  [Migrasi SDK](/id/plugins/sdk-migration).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifes menggunakan metadata variabel lingkungan kanal lama atau versi terdahulu tanpa metadata
penyiapan atau konfigurasi terkini yang diharapkan ClawHub.

- Pertahankan metadata variabel lingkungan kanal dalam bentuk deklaratif agar OpenClaw dapat memeriksa status penyiapan
  tanpa memuat waktu proses kanal.
- Salin penyiapan kanal berbasis variabel lingkungan ke metadata penyiapan, konfigurasi kanal, atau
  kanal paket terkini yang digunakan oleh bentuk plugin Anda.
- Pertahankan `channelEnvVars` hanya sebagai metadata kompatibilitas selama versi OpenClaw lama yang didukung
  masih memerlukannya.
- Lihat [Manifes Plugin](/id/plugins/manifest) dan
  [Plugin kanal](/id/plugins/sdk-channel-plugins).
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

## Manifes keamanan

### security-manifest-schema-unavailable

Paket menyertakan `openclaw.security.json` dengan referensi skema yang tidak dikenali ClawHub
sebagai tersedia.

- Hapus URL skema jika hanya bersifat anjuran.
- Gunakan skema berversi yang terdokumentasi hanya setelah OpenClaw menerbitkannya.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Paket menyertakan berkas manifes keamanan yang tidak didukung.

- Hapus `openclaw.security.json` hingga OpenClaw mendokumentasikan skema manifes keamanan
  berversi dan perilaku ClawHub.
- Pertahankan dokumentasi perilaku sensitif terhadap keamanan dalam dokumentasi paket publik atau
  README Anda hingga kontrak manifes tersedia.
- Jalankan kembali `clawhub package validate <path-to-plugin>`.

## Terkait

- [CLI ClawHub](/id/clawhub/cli)
- [Penerbitan ClawHub](/id/clawhub/publishing)
- [Membangun plugin](/id/plugins/building-plugins)
- [Manifes Plugin](/id/plugins/manifest)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Kompatibilitas Plugin](/id/plugins/compatibility)
