---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu mengirimkan skema konfigurasi plugin atau men-debug error validasi plugin
summary: Manifest plugin + persyaratan skema JSON (validasi konfigurasi ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-05T14:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest plugin (`openclaw.plugin.json`)

Halaman ini hanya untuk **manifest plugin OpenClaw native**.

Untuk layout bundle yang kompatibel, lihat [Plugin bundles](/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau layout komponen Claude default
  tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis layout bundle tersebut, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus
skill root yang dideklarasikan, root command Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan hook pack yang didukung saat layout-nya sesuai
dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error plugin dan memblokir validasi konfigurasi.

Lihat panduan lengkap sistem plugin: [Plugins](/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Capability model](/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat
kode plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi konfigurasi
- metadata auth dan onboarding yang harus tersedia tanpa menjalankan runtime plugin
- metadata alias dan auto-enable yang harus di-resolve sebelum runtime plugin dimuat
- metadata kepemilikan shorthand model-family yang harus mengaktifkan plugin
  secara otomatis sebelum runtime dimuat
- snapshot kepemilikan kapabilitas statis yang digunakan untuk wiring kompatibilitas bawaan dan
  cakupan kontrak
- metadata konfigurasi khusus channel yang harus digabungkan ke permukaan katalog dan validasi
  tanpa memuat runtime
- petunjuk UI konfigurasi

Jangan gunakan untuk:

- mendaftarkan perilaku runtime
- mendeklarasikan entrypoint kode
- metadata instalasi npm

Itu semua termasuk dalam kode plugin Anda dan `package.json`.

## Contoh minimal

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Contoh lengkap

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin penyedia OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "API key OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "API key OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referensi field tingkat atas

| Field                               | Wajib | Tipe                             | Artinya                                                                                                                                                                                     |
| ----------------------------------- | ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Ya    | `string`                         | ID plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                 |
| `configSchema`                      | Ya    | `object`                         | Skema JSON inline untuk konfigurasi plugin ini.                                                                                                                                             |
| `enabledByDefault`                  | Tidak | `true`                           | Menandai plugin bawaan sebagai aktif secara default. Hilangkan, atau setel ke nilai selain `true`, agar plugin tetap nonaktif secara default.                                             |
| `legacyPluginIds`                   | Tidak | `string[]`                       | ID lama yang dinormalisasi ke ID plugin kanonis ini.                                                                                                                                        |
| `autoEnableWhenConfiguredProviders` | Tidak | `string[]`                       | ID penyedia yang harus mengaktifkan plugin ini secara otomatis saat auth, konfigurasi, atau ref model menyebutkannya.                                                                      |
| `kind`                              | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                              |
| `channels`                          | Tidak | `string[]`                       | ID channel yang dimiliki plugin ini. Digunakan untuk discovery dan validasi konfigurasi.                                                                                                   |
| `providers`                         | Tidak | `string[]`                       | ID penyedia yang dimiliki plugin ini.                                                                                                                                                       |
| `modelSupport`                      | Tidak | `object`                         | Metadata shorthand model-family milik manifest yang digunakan untuk memuat otomatis plugin sebelum runtime.                                                                                |
| `cliBackends`                       | Tidak | `string[]`                       | ID backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk auto-activation saat startup dari ref konfigurasi eksplisit.                                                           |
| `providerAuthEnvVars`               | Tidak | `Record<string, string[]>`       | Metadata env auth penyedia yang murah yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                              |
| `providerAuthChoices`               | Tidak | `object[]`                       | Metadata pilihan auth yang murah untuk picker onboarding, resolusi preferred-provider, dan wiring flag CLI sederhana.                                                                      |
| `contracts`                         | Tidak | `object`                         | Snapshot kapabilitas bawaan statis untuk speech, realtime transcription, realtime voice, media-understanding, image-generation, video-generation, web-fetch, web search, dan kepemilikan tool. |
| `channelConfigs`                    | Tidak | `Record<string, object>`         | Metadata konfigurasi channel milik manifest yang digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                   |
| `skills`                            | Tidak | `string[]`                       | Direktori Skills yang dimuat, relatif terhadap root plugin.                                                                                                                                |
| `name`                              | Tidak | `string`                         | Nama plugin yang dapat dibaca manusia.                                                                                                                                                      |
| `description`                       | Tidak | `string`                         | Ringkasan singkat yang ditampilkan di permukaan plugin.                                                                                                                                     |
| `version`                           | Tidak | `string`                         | Versi plugin informasional.                                                                                                                                                                 |
| `uiHints`                           | Tidak | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field konfigurasi.                                                                                                                  |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime penyedia dimuat.

| Field                 | Wajib | Tipe                                            | Artinya                                                                                                 |
| --------------------- | ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya    | `string`                                        | ID penyedia tempat pilihan ini berada.                                                                  |
| `method`              | Ya    | `string`                                        | ID metode auth untuk dispatch.                                                                          |
| `choiceId`            | Ya    | `string`                                        | ID pilihan auth stabil yang digunakan oleh onboarding dan alur CLI.                                     |
| `choiceLabel`         | Tidak | `string`                                        | Label yang ditampilkan ke pengguna. Jika dihilangkan, OpenClaw akan fallback ke `choiceId`.            |
| `choiceHint`          | Tidak | `string`                                        | Teks bantuan singkat untuk picker.                                                                      |
| `assistantPriority`   | Tidak | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam picker interaktif berbasis asisten.                 |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                  | Menyembunyikan pilihan dari picker asisten sambil tetap mengizinkan pemilihan CLI manual.              |
| `deprecatedChoiceIds` | Tidak | `string[]`                                      | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                               |
| `groupId`             | Tidak | `string`                                        | ID grup opsional untuk mengelompokkan pilihan terkait.                                                  |
| `groupLabel`          | Tidak | `string`                                        | Label yang ditampilkan ke pengguna untuk grup tersebut.                                                 |
| `groupHint`           | Tidak | `string`                                        | Teks bantuan singkat untuk grup.                                                                        |
| `optionKey`           | Tidak | `string`                                        | Key opsi internal untuk alur auth satu-flag sederhana.                                                  |
| `cliFlag`             | Tidak | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                          |
| `cliOption`           | Tidak | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Tidak | `string`                                        | Deskripsi yang digunakan di bantuan CLI.                                                                |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi `uiHints`

`uiHints` adalah peta dari nama field konfigurasi ke petunjuk render kecil.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Digunakan untuk permintaan OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Setiap petunjuk field dapat mencakup:

| Field         | Tipe       | Artinya                               |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | Label field yang ditampilkan pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                 |
| `tags`        | `string[]` | Tag UI opsional.                      |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.      |
| `sensitive`   | `boolean`  | Menandai field sebagai secret atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir. |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat
dibaca OpenClaw tanpa mengimpor runtime plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Setiap daftar bersifat opsional:

| Field                            | Tipe       | Artinya                                                        |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID penyedia speech yang dimiliki plugin ini.                   |
| `realtimeTranscriptionProviders` | `string[]` | ID penyedia realtime-transcription yang dimiliki plugin ini.   |
| `realtimeVoiceProviders`         | `string[]` | ID penyedia realtime-voice yang dimiliki plugin ini.           |
| `mediaUnderstandingProviders`    | `string[]` | ID penyedia media-understanding yang dimiliki plugin ini.      |
| `imageGenerationProviders`       | `string[]` | ID penyedia image-generation yang dimiliki plugin ini.         |
| `videoGenerationProviders`       | `string[]` | ID penyedia video-generation yang dimiliki plugin ini.         |
| `webFetchProviders`              | `string[]` | ID penyedia web-fetch yang dimiliki plugin ini.                |
| `webSearchProviders`             | `string[]` | ID penyedia web-search yang dimiliki plugin ini.               |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki plugin ini untuk pemeriksaan kontrak bawaan. |

## Referensi `channelConfigs`

Gunakan `channelConfigs` ketika plugin channel memerlukan metadata konfigurasi murah sebelum
runtime dimuat.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL Homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Koneksi homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Setiap entri channel dapat mencakup:

| Field         | Tipe                     | Artinya                                                                                     |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Skema JSON untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian konfigurasi channel tersebut. |
| `label`       | `string`                 | Label channel yang digabungkan ke permukaan picker dan inspeksi saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk permukaan inspeksi dan katalog.                            |
| `preferOver`  | `string[]`               | ID plugin lama atau prioritas lebih rendah yang harus dikalahkan channel ini di permukaan pemilihan. |

## Referensi `modelSupport`

Gunakan `modelSupport` ketika OpenClaw harus menyimpulkan plugin penyedia Anda dari
ID model shorthand seperti `gpt-5.4` atau `claude-sonnet-4.6` sebelum runtime plugin
dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan prioritas berikut:

- ref `provider/model` eksplisit menggunakan metadata manifest `providers` yang memilikinya
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan penyedia

Field:

| Field           | Tipe       | Artinya                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap ID model shorthand.     |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap ID model shorthand setelah penghapusan sufiks profil. |

Key kapabilitas tingkat atas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field tingkat atas tersebut sebagai
kepemilikan kapabilitas.

## Manifest versus package.json

Kedua file ini memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi konfigurasi, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode plugin berjalan                |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, setup, atau metadata katalog |

Jika Anda ragu metadata tertentu harus diletakkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu tentang packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field `package.json` yang memengaruhi discovery

Beberapa metadata plugin pra-runtime sengaja ditempatkan di `package.json` dalam blok
`openclaw` alih-alih `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native.                                              |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan saat onboarding dan startup channel tertunda. |
| `openclaw.channel`                                                | Metadata katalog channel murah seperti label, path dokumen, alias, dan teks pemilihan. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/pembaruan untuk plugin bawaan dan yang dipublikasikan secara eksternal. |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang diprioritaskan saat beberapa sumber instalasi tersedia.           |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`. |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan instal ulang plugin bawaan yang sempit saat konfigurasi tidak valid. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus setup dimuat sebelum plugin channel penuh saat startup. |

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan
registri manifest. Nilai yang tidak valid ditolak; nilai yang lebih baru tetapi valid akan melewati plugin pada host yang lebih lama.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibuat sempit. Field ini
tidak membuat konfigurasi rusak apa pun menjadi dapat diinstal. Saat ini hanya mengizinkan alur instalasi
memulihkan dari kegagalan upgrade plugin bawaan usang tertentu, seperti path plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin bawaan yang sama.
Error konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

## Persyaratan skema JSON

- **Setiap plugin harus menyertakan Skema JSON**, bahkan jika tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat baca/tulis konfigurasi, bukan saat runtime.

## Perilaku validasi

- Key `channels.*` yang tidak dikenal adalah **error**, kecuali ID channel tersebut dideklarasikan oleh
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan ID plugin yang **dapat ditemukan**. ID yang tidak dikenal adalah **error**.
- Jika plugin terinstal tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error plugin tersebut.
- Jika konfigurasi plugin ada tetapi plugin **nonaktif**, konfigurasi tetap dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Configuration reference](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifest **wajib untuk plugin OpenClaw native**, termasuk pemuatan dari filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifest hanya untuk
  discovery + validasi.
- Manifest native diparse dengan JSON5, jadi komentar, trailing comma, dan
  key tanpa tanda kutip diterima selama nilai akhirnya tetap berupa object.
- Hanya field manifest yang didokumentasikan yang dibaca oleh pemuat manifest. Hindari menambahkan
  key tingkat atas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata murah untuk probe auth, validasi
  penanda env, dan permukaan auth penyedia serupa yang tidak seharusnya menjalankan runtime plugin hanya untuk memeriksa nama env.
- `providerAuthChoices` adalah jalur metadata murah untuk picker pilihan auth,
  resolusi `--auth-choice`, pemetaan preferred-provider, dan pendaftaran flag CLI onboarding sederhana sebelum runtime penyedia dimuat. Untuk metadata wizard runtime
  yang memerlukan kode penyedia, lihat
  [Provider runtime hooks](/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: bawaan `legacy`).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat
  plugin tidak memerlukannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan semua
  persyaratan allowlist package manager (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Building Plugins](/plugins/building-plugins) — memulai dengan plugin
- [Plugin Architecture](/plugins/architecture) — arsitektur internal
- [SDK Overview](/plugins/sdk-overview) — referensi Plugin SDK
