---
read_when:
    - Anda menjalankan clawhub package validate dan perlu memperbaiki temuan Plugin
    - ClawHub menolak atau memperingatkan saat publikasi paket plugin
    - Anda sedang memperbarui metadata paket plugin sebelum rilis
summary: Perbaiki temuan validasi paket Plugin ClawHub sebelum dipublikasikan
title: Perbaikan validasi Plugin
x-i18n:
    generated_at: "2026-06-28T00:11:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Perbaikan validasi Plugin

ClawHub memvalidasi paket Plugin sebelum publikasi dan juga dapat menampilkan temuan dari
pemindaian paket otomatis. Halaman ini mencakup temuan yang ditujukan untuk penulis, yaitu
temuan yang dapat diperbaiki penulis Plugin dalam metadata paket, manifes, impor SDK,
atau artefak yang dipublikasikan.

Halaman ini tidak mencakup temuan cakupan Plugin Inspector internal. Jika laporan lengkap
berisi kode pemeliharaan pemindai tanpa panduan remediasi untuk penulis, kode tersebut
ditujukan untuk pengelola OpenClaw, bukan penulis Plugin.

Setelah menerapkan perbaikan apa pun, jalankan ulang:

```bash
clawhub package validate <path-to-plugin>
```

## Temuan yang ditujukan untuk penulis

| Kode                                    | Mulai di sini                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Tambahkan metadata paket](/id/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Tambahkan blok openclaw paket](/id/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Deklarasikan entrypoint paket OpenClaw](/id/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publikasikan entrypoint yang dideklarasikan](/id/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Lengkapi metadata instalasi](/id/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Deklarasikan kompatibilitas API Plugin](/id/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Selaraskan versi host minimum](/id/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Selaraskan versi paket dan manifes](/id/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Hapus metadata paket OpenClaw yang tidak didukung](/id/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Jadikan artefak npm dapat dikemas](/id/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Sertakan entrypoint dalam keluaran npm pack](/id/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Sertakan metadata dalam keluaran npm pack](/id/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Tambahkan nama tampilan manifes](/id/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Hapus bidang manifes yang tidak didukung](/id/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Hapus kunci kontrak yang tidak didukung](/id/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Ganti impor SDK root](/id/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Hapus impor SDK yang dicadangkan](/id/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Ganti akses penyimpanan seluruh sesi](/id/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [Ganti before_agent_start](/id/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Pindahkan variabel env penyedia ke metadata penyiapan](/id/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Cerminkan variabel env kanal dalam metadata saat ini](/id/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Hapus referensi skema manifes keamanan yang tidak tersedia](/id/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Hapus file manifes keamanan yang tidak didukung](/id/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadata paket

### package-json-missing

Root paket tidak menyertakan `package.json`, sehingga ClawHub tidak dapat mengidentifikasi
paket npm, versi, entrypoint, atau metadata OpenClaw.

- Tambahkan `package.json` dengan `name`, `version`, dan `type`.
- Tambahkan blok `openclaw` saat paket mengirimkan Plugin OpenClaw.
- Gunakan [Membangun Plugin](/id/plugins/building-plugins) untuk contoh paket
  minimal dan [Manifes Plugin](/id/plugins/manifest#manifest-versus-packagejson)
  untuk pemisahan paket versus manifes.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Paket memiliki `package.json`, tetapi tidak mendeklarasikan metadata paket
OpenClaw.

- Tambahkan `package.json#openclaw`.
- Sertakan metadata entrypoint seperti `openclaw.extensions` atau
  `openclaw.runtimeExtensions`.
- Tambahkan metadata kompatibilitas dan instalasi saat paket akan dipublikasikan atau
  diinstal melalui ClawHub.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Metadata paket ada, tetapi tidak mendeklarasikan entrypoint runtime OpenClaw.

- Tambahkan `openclaw.extensions` untuk entrypoint Plugin native.
- Tambahkan `openclaw.runtimeExtensions` saat paket yang dipublikasikan harus memuat
  JavaScript hasil build.
- Simpan semua jalur entrypoint di dalam direktori paket.
- Lihat [Titik masuk Plugin](/id/plugins/sdk-entrypoints) dan
  [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Paket mendeklarasikan entrypoint OpenClaw, tetapi file yang dirujuk hilang
dari paket yang sedang divalidasi.

- Periksa setiap jalur di `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry`, dan `openclaw.runtimeSetupEntry`.
- Build paket jika entrypoint dibuat ke dalam `dist`.
- Perbarui metadata jika entrypoint dipindahkan.
- Lihat [Titik masuk Plugin](/id/plugins/sdk-entrypoints).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub tidak dapat menentukan cara paket harus diinstal atau diperbarui.

- Isi `openclaw.install` dengan sumber instalasi yang didukung, seperti
  `clawhubSpec`, `npmSpec`, atau `localPath`.
- Tetapkan `openclaw.install.defaultChoice` saat lebih dari satu sumber instalasi
  tersedia.
- Gunakan `openclaw.install.minHostVersion` untuk versi host OpenClaw minimum.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Paket tidak mendeklarasikan rentang API Plugin OpenClaw yang didukungnya.

- Tambahkan `openclaw.compat.pluginApi` ke `package.json`.
- Gunakan versi API Plugin OpenClaw atau batas bawah semver yang menjadi dasar build dan pengujian Anda.
- Pisahkan ini dari versi paket. Versi paket menjelaskan rilis
  Plugin; `openclaw.compat.pluginApi` menjelaskan kontrak API host.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Versi host minimum paket tidak cocok dengan metadata versi OpenClaw
yang menjadi dasar build paket.

- Periksa `openclaw.install.minHostVersion`.
- Periksa metadata build OpenClaw apa pun dalam paket, seperti versi OpenClaw
  yang digunakan selama rilis.
- Selaraskan versi host minimum dengan rentang versi host yang benar-benar
  didukung paket.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Versi paket dan versi manifes Plugin tidak sama.

- Utamakan `package.json#version` sebagai versi rilis paket.
- Jika `openclaw.plugin.json` juga memiliki `version`, perbarui agar cocok atau hapus
  metadata versi manifes usang saat metadata paket menjadi acuan.
- Publikasikan versi paket baru setelah mengubah metadata yang dipublikasikan.
- Lihat [Manifes Plugin](/id/plugins/manifest).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Blok `package.json#openclaw` berisi bidang yang bukan metadata paket
OpenClaw yang didukung.

- Hapus bidang yang tidak didukung seperti `openclaw.bundle`.
- Simpan metadata Plugin native di `openclaw.plugin.json`.
- Simpan metadata entrypoint paket, kompatibilitas, instalasi, penyiapan, dan katalog
  dalam bidang `package.json#openclaw` yang didukung.
- Lihat [bidang package.json yang memengaruhi penemuan](/id/plugins/manifest#packagejson-fields-that-affect-discovery).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Artefak yang dipublikasikan

### package-npm-pack-unavailable

Paket tidak dapat dikemas menjadi artefak yang akan diperiksa atau
dipublikasikan ClawHub.

- Jalankan `npm pack --dry-run` dari root paket.
- Perbaiki metadata paket yang tidak valid, skrip lifecycle yang rusak, atau entri files yang
  membuat pengemasan gagal.
- Hapus `private: true` jika paket ini dimaksudkan untuk publikasi publik.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Paket dapat dikemas, tetapi artefak yang dikemas tidak menyertakan
file entrypoint yang dideklarasikan dalam `package.json#openclaw`.

- Jalankan `npm pack --dry-run` dan periksa file yang akan disertakan.
- Build entrypoint yang dihasilkan sebelum mengemas.
- Perbarui `files`, `.npmignore`, atau keluaran build agar entrypoint yang dideklarasikan
  disertakan.
- Lihat [Titik masuk Plugin](/id/plugins/sdk-entrypoints).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Artefak yang dikemas kehilangan metadata OpenClaw yang ada dalam paket
sumber Anda.

- Jalankan `npm pack --dry-run` dan periksa file metadata yang disertakan.
- Pastikan `package.json` menyertakan blok `openclaw` dalam artefak yang dikemas.
- Pastikan `openclaw.plugin.json` disertakan saat paket adalah Plugin OpenClaw
  native.
- Perbarui `files` atau `.npmignore` agar metadata paket tidak dikecualikan.
- Lihat [Membangun Plugin](/id/plugins/building-plugins).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Metadata manifes

### manifest-name-missing

Manifes Plugin native tidak menyertakan nama tampilan.

- Tambahkan bidang `name` yang tidak kosong ke `openclaw.plugin.json`.
- Buat `name` mudah dibaca manusia dan pertahankan `id` sebagai id mesin yang stabil.
- Lihat [Manifes Plugin](/id/plugins/manifest).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifes Plugin memiliki bidang tingkat atas yang tidak didukung OpenClaw.

- Bandingkan setiap kolom tingkat atas dengan
  [referensi kolom manifest](/id/plugins/manifest#top-level-field-reference).
- Hapus kolom kustom dari `openclaw.plugin.json`.
- Pindahkan metadata paket atau instalasi ke kolom `package.json#openclaw` yang
  didukung, bukan ke manifest.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifest mendeklarasikan kunci yang tidak didukung di dalam `contracts`.

- Bandingkan setiap kunci di bawah `contracts` dengan
  [referensi contracts](/id/plugins/manifest#contracts-reference).
- Hapus kunci kontrak yang tidak didukung.
- Pindahkan perilaku runtime ke kode pendaftaran Plugin, dan batasi `contracts`
  hanya untuk metadata kepemilikan kapabilitas statis.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Migrasi SDK dan kompatibilitas

### legacy-root-sdk-import

Plugin mengimpor dari barrel SDK root yang sudah tidak digunakan:
`openclaw/plugin-sdk`.

- Ganti impor root-barrel dengan impor subpath publik yang terfokus.
- Gunakan `openclaw/plugin-sdk/plugin-entry` untuk `definePluginEntry`.
- Gunakan `openclaw/plugin-sdk/channel-core` untuk helper entri kanal.
- Gunakan [Konvensi impor](/id/plugins/building-plugins#import-conventions) dan
  [subpath SDK Plugin](/id/plugins/sdk-subpaths) untuk menemukan impor yang sempit.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin mengimpor path SDK yang dicadangkan untuk Plugin bawaan atau
kompatibilitas internal.

- Ganti impor SDK internal OpenClaw yang dicadangkan dengan subpath publik
  `openclaw/plugin-sdk/*` yang terdokumentasi.
- Jika perilaku tersebut tidak memiliki SDK publik, simpan helper di dalam paket
  Anda atau minta API OpenClaw publik.
- Gunakan [subpath SDK Plugin](/id/plugins/sdk-subpaths) dan
  [migrasi SDK](/id/plugins/sdk-migration) untuk memilih impor yang didukung.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin masih menggunakan helper whole-session-store yang sudah tidak digunakan
`loadSessionStore`.

- Gunakan `getSessionEntry(...)` atau `listSessionEntries(...)` saat membaca
  status sesi.
- Gunakan `patchSessionEntry(...)` atau `upsertSessionEntry(...)` saat menulis
  status sesi.
- Hindari memuat, memutasi, dan menyimpan seluruh objek penyimpanan sesi.
- Pertahankan `loadSessionStore(...)` hanya selama rentang kompatibilitas yang
  Anda deklarasikan masih mendukung versi OpenClaw lama yang memerlukannya.
- Lihat [API Runtime](/id/plugins/sdk-runtime#agent-session-state) dan
  [subpath SDK Plugin](/id/plugins/sdk-subpaths).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin masih menggunakan hook lama `before_agent_start`.

- Pindahkan pekerjaan penggantian model atau penyedia ke `before_model_resolve`.
- Pindahkan pekerjaan mutasi prompt atau konteks ke `before_prompt_build`.
- Pertahankan `before_agent_start` hanya selama rentang kompatibilitas yang Anda
  deklarasikan masih mendukung versi OpenClaw lama yang memerlukannya.
- Lihat [Hook](/id/plugins/hooks) dan
  [kompatibilitas Plugin](/id/plugins/compatibility).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifest masih menggunakan metadata autentikasi penyedia lama
`providerAuthEnvVars`.

- Cerminkan metadata env-var penyedia ke `setup.providers[].envVars`.
- Pertahankan `providerAuthEnvVars` hanya sebagai metadata kompatibilitas selama
  rentang OpenClaw yang Anda dukung masih membutuhkannya.
- Lihat [referensi setup](/id/plugins/manifest#setup-reference) dan
  [migrasi SDK](/id/plugins/sdk-migration).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifest menggunakan metadata env-var kanal lama atau lebih lama tanpa metadata
setup atau konfigurasi saat ini yang diharapkan ClawHub.

- Pertahankan metadata env-var kanal tetap deklaratif agar OpenClaw dapat
  memeriksa status setup tanpa memuat runtime kanal.
- Cerminkan setup kanal berbasis env ke metadata setup, konfigurasi kanal, atau
  kanal paket saat ini yang digunakan oleh bentuk Plugin Anda.
- Pertahankan `channelEnvVars` hanya sebagai metadata kompatibilitas selama versi
  OpenClaw lama yang didukung masih memerlukannya.
- Lihat [manifest Plugin](/id/plugins/manifest) dan
  [Plugin kanal](/id/plugins/sdk-channel-plugins).
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Manifest keamanan

### security-manifest-schema-unavailable

Paket mengirimkan `openclaw.security.json` dengan referensi skema yang tidak
dikenali ClawHub sebagai tersedia.

- Hapus URL skema jika hanya bersifat advisori.
- Gunakan skema berversi yang terdokumentasi hanya setelah OpenClaw
  menerbitkannya.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Paket mengirimkan file manifest keamanan yang tidak didukung.

- Hapus `openclaw.security.json` hingga OpenClaw mendokumentasikan skema
  manifest keamanan berversi dan perilaku ClawHub.
- Tetap dokumentasikan perilaku sensitif keamanan di dokumentasi paket publik
  atau README Anda hingga kontrak manifest tersedia.
- Jalankan ulang `clawhub package validate <path-to-plugin>`.

## Terkait

- [CLI ClawHub](/id/clawhub/cli)
- [Publikasi ClawHub](/id/clawhub/publishing)
- [Membangun Plugin](/id/plugins/building-plugins)
- [Manifest Plugin](/id/plugins/manifest)
- [Titik entri Plugin](/id/plugins/sdk-entrypoints)
- [Kompatibilitas Plugin](/id/plugins/compatibility)
