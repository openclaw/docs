---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu menyediakan skema konfigurasi plugin atau men-debug kesalahan validasi plugin
summary: Manifest plugin + persyaratan skema JSON (validasi konfigurasi yang ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-12T09:06:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4074b3639bf24606d6087597f28e29afc85f4ea628a713e9d984b441a16f1c13
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest plugin (`openclaw.plugin.json`)

Halaman ini khusus untuk **manifest plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Bundle plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude
  default tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundle tersebut, tetapi tidak
divalidasi terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle beserta
root skill yang dideklarasikan, root perintah Claude, default `settings.json`
bundle Claude, default LSP bundle Claude, dan paket hook yang didukung saat
tata letaknya sesuai dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json`
di **root plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi
konfigurasi **tanpa mengeksekusi kode plugin**. Manifest yang hilang atau tidak
valid diperlakukan sebagai kesalahan plugin dan memblokir validasi konfigurasi.

Lihat panduan lengkap sistem plugin: [Plugins](/id/tools/plugin).
Untuk model kemampuan native dan panduan kompatibilitas eksternal saat ini:
[Model kemampuan](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat kode
plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi konfigurasi
- metadata autentikasi dan orientasi yang harus tersedia tanpa mem-boot runtime
  plugin
- petunjuk aktivasi ringan yang dapat diperiksa oleh permukaan control plane
  sebelum runtime dimuat
- deskriptor penyiapan ringan yang dapat diperiksa oleh permukaan
  penyiapan/orientasi sebelum runtime dimuat
- metadata alias dan auto-enable yang harus diselesaikan sebelum runtime plugin
  dimuat
- metadata kepemilikan singkat keluarga model yang harus mengaktifkan plugin
  secara otomatis sebelum runtime dimuat
- snapshot kepemilikan kemampuan statis yang digunakan untuk wiring kompat
  bundle dan cakupan kontrak
- metadata konfigurasi khusus channel yang harus digabungkan ke dalam
  permukaan katalog dan validasi tanpa memuat runtime
- petunjuk UI konfigurasi

Jangan gunakan untuk:

- mendaftarkan perilaku runtime
- mendeklarasikan entrypoint kode
- metadata instalasi npm

Hal-hal tersebut termasuk dalam kode plugin Anda dan `package.json`.

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
  "description": "Plugin provider OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Kunci API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Kunci API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Kunci API",
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

| Field                               | Required | Type                             | What it means                                                                                                                                                                                                |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ya       | `string`                         | ID plugin kanonis. Ini adalah ID yang digunakan di `plugins.entries.<id>`.                                                                                                                                  |
| `configSchema`                      | Ya       | `object`                         | JSON Schema inline untuk konfigurasi plugin ini.                                                                                                                                                             |
| `enabledByDefault`                  | Tidak    | `true`                           | Menandai plugin bundle sebagai aktif secara default. Hilangkan field ini, atau tetapkan nilai apa pun selain `true`, agar plugin tetap nonaktif secara default.                                            |
| `legacyPluginIds`                   | Tidak    | `string[]`                       | ID lama yang dinormalisasi ke ID plugin kanonis ini.                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | Tidak    | `string[]`                       | ID provider yang harus mengaktifkan plugin ini secara otomatis saat autentikasi, konfigurasi, atau referensi model menyebutkannya.                                                                          |
| `kind`                              | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                |
| `channels`                          | Tidak    | `string[]`                       | ID channel yang dimiliki plugin ini. Digunakan untuk discovery dan validasi konfigurasi.                                                                                                                     |
| `providers`                         | Tidak    | `string[]`                       | ID provider yang dimiliki plugin ini.                                                                                                                                                                        |
| `modelSupport`                      | Tidak    | `object`                         | Metadata singkat keluarga model yang dimiliki manifest dan digunakan untuk memuat plugin secara otomatis sebelum runtime.                                                                                    |
| `cliBackends`                       | Tidak    | `string[]`                       | ID backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk auto-activation saat startup dari referensi konfigurasi eksplisit.                                                                       |
| `commandAliases`                    | Tidak    | `object[]`                       | Nama perintah yang dimiliki plugin ini dan harus menghasilkan diagnostik konfigurasi serta CLI yang sadar-plugin sebelum runtime dimuat.                                                                    |
| `providerAuthEnvVars`               | Tidak    | `Record<string, string[]>`       | Metadata env autentikasi provider ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                                            |
| `providerAuthAliases`               | Tidak    | `Record<string, string>`         | ID provider yang harus menggunakan ulang ID provider lain untuk lookup autentikasi, misalnya provider coding yang berbagi kunci API provider dasar dan profil autentikasi yang sama.                       |
| `channelEnvVars`                    | Tidak    | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk permukaan penyiapan atau autentikasi channel berbasis env yang perlu dilihat helper startup/config umum. |
| `providerAuthChoices`               | Tidak    | `object[]`                       | Metadata pilihan autentikasi ringan untuk pemilih orientasi, resolusi provider pilihan, dan wiring flag CLI sederhana.                                                                                      |
| `activation`                        | Tidak    | `object`                         | Petunjuk aktivasi ringan untuk pemuatan yang dipicu provider, perintah, channel, rute, dan kemampuan. Hanya metadata; runtime plugin tetap memiliki perilaku sebenarnya.                                   |
| `setup`                             | Tidak    | `object`                         | Deskriptor penyiapan/orientasi ringan yang dapat diperiksa oleh permukaan discovery dan penyiapan tanpa memuat runtime plugin.                                                                              |
| `contracts`                         | Tidak    | `object`                         | Snapshot kemampuan bundle statis untuk speech, transkripsi realtime, suara realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan kepemilikan tool. |
| `channelConfigs`                    | Tidak    | `Record<string, object>`         | Metadata konfigurasi channel yang dimiliki manifest dan digabungkan ke dalam permukaan discovery dan validasi sebelum runtime dimuat.                                                                        |
| `skills`                            | Tidak    | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root plugin.                                                                                                                                             |
| `name`                              | Tidak    | `string`                         | Nama plugin yang mudah dibaca manusia.                                                                                                                                                                       |
| `description`                       | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan plugin.                                                                                                                                                      |
| `version`                           | Tidak    | `string`                         | Versi plugin informasional.                                                                                                                                                                                  |
| `uiHints`                           | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field konfigurasi.                                                                                                                                    |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` mendeskripsikan satu pilihan orientasi atau
autentikasi.
OpenClaw membaca ini sebelum runtime provider dimuat.

| Field                 | Required | Type                                            | What it means                                                                                             |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | ID provider yang memiliki pilihan ini.                                                                    |
| `method`              | Ya       | `string`                                        | ID metode autentikasi yang akan digunakan untuk dispatch.                                                 |
| `choiceId`            | Ya       | `string`                                        | ID pilihan autentikasi stabil yang digunakan oleh alur orientasi dan CLI.                                 |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang ditampilkan kepada pengguna. Jika dihilangkan, OpenClaw akan menggunakan `choiceId`.          |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                       |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan asisten.           |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Menyembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI secara manual.        |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                 |
| `groupId`             | Tidak    | `string`                                        | ID grup opsional untuk mengelompokkan pilihan yang terkait.                                               |
| `groupLabel`          | Tidak    | `string`                                        | Label yang ditampilkan kepada pengguna untuk grup tersebut.                                               |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup.                                                                          |
| `optionKey`           | Tidak    | `string`                                        | Kunci opsi internal untuk alur autentikasi sederhana dengan satu flag.                                    |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                            |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                            |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                               |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Permukaan orientasi mana yang harus menampilkan pilihan ini. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` saat sebuah plugin memiliki nama perintah runtime yang
mungkin keliru dimasukkan pengguna ke `plugins.allow` atau dicoba dijalankan
sebagai perintah CLI root. OpenClaw menggunakan metadata ini untuk diagnostik
tanpa mengimpor kode runtime plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Field        | Required | Type              | What it means                                                              |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki plugin ini.                                    |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.       |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait yang dapat disarankan untuk operasi CLI, jika ada. |

## Referensi `activation`

Gunakan `activation` saat plugin dapat mendeklarasikan secara ringan peristiwa
control plane mana yang nantinya harus mengaktifkannya.

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/plugin
lainnya. Konsumen saat ini menggunakannya sebagai petunjuk penyaringan sebelum
pemuatan plugin yang lebih luas, sehingga metadata aktivasi yang hilang hanya
berdampak pada performa; ini seharusnya tidak mengubah correctness.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Field            | Required | Type                                                 | What it means                                                         |
| ---------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `onProviders`    | Tidak    | `string[]`                                           | ID provider yang harus mengaktifkan plugin ini saat diminta.          |
| `onCommands`     | Tidak    | `string[]`                                           | ID perintah yang harus mengaktifkan plugin ini.                       |
| `onChannels`     | Tidak    | `string[]`                                           | ID channel yang harus mengaktifkan plugin ini.                        |
| `onRoutes`       | Tidak    | `string[]`                                           | Jenis rute yang harus mengaktifkan plugin ini.                        |
| `onCapabilities` | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kemampuan umum yang digunakan oleh perencanaan aktivasi control plane. |

Khusus untuk perencanaan yang dipicu perintah, OpenClaw masih menggunakan
fallback ke `commandAliases[].cliCommand` atau `commandAliases[].name` lama saat
plugin belum menambahkan metadata `activation.onCommands` eksplisit.

## Referensi `setup`

Gunakan `setup` saat permukaan penyiapan dan orientasi memerlukan metadata milik
plugin yang ringan sebelum runtime dimuat.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` tingkat atas tetap valid dan terus mendeskripsikan backend
inferensi CLI. `setup.cliBackends` adalah permukaan deskriptor khusus
penyiapan untuk alur control plane/setup yang harus tetap hanya berupa metadata.

Jika ada, `setup.providers` dan `setup.cliBackends` adalah permukaan lookup
descriptor-first yang diprioritaskan untuk discovery penyiapan. Jika deskriptor
hanya menyaring kandidat plugin dan penyiapan masih memerlukan hook runtime
waktu-setup yang lebih kaya, tetapkan `requiresRuntime: true` dan pertahankan
`setup-api` sebagai jalur eksekusi fallback.

Karena lookup penyiapan dapat mengeksekusi kode `setup-api` milik plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang telah dinormalisasi harus
tetap unik di seluruh plugin yang ditemukan. Kepemilikan yang ambigu akan gagal
secara tertutup alih-alih memilih pemenang berdasarkan urutan discovery.

### Referensi `setup.providers`

| Field         | Required | Type       | What it means                                                                          |
| ------------- | -------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Ya       | `string`   | ID provider yang diekspos selama penyiapan atau orientasi. Pertahankan ID yang dinormalisasi tetap unik secara global. |
| `authMethods` | Tidak    | `string[]` | ID metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.           |
| `envVars`     | Tidak    | `string[]` | Env var yang dapat diperiksa oleh permukaan setup/status umum sebelum runtime plugin dimuat. |

### Field `setup`

| Field              | Required | Type       | What it means                                                                                         |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Tidak    | `object[]` | Deskriptor setup provider yang diekspos selama setup dan orientasi.                                   |
| `cliBackends`      | Tidak    | `string[]` | ID backend waktu-setup yang digunakan untuk lookup setup descriptor-first. Pertahankan ID yang dinormalisasi tetap unik secara global. |
| `configMigrations` | Tidak    | `string[]` | ID migrasi konfigurasi yang dimiliki oleh permukaan setup plugin ini.                                 |
| `requiresRuntime`  | Tidak    | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.                         |

## Referensi `uiHints`

`uiHints` adalah peta dari nama field konfigurasi ke petunjuk rendering kecil.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Kunci API",
      "help": "Digunakan untuk permintaan OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Setiap petunjuk field dapat mencakup:

| Field         | Type       | What it means                            |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Label field yang ditampilkan kepada pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                    |
| `tags`        | `string[]` | Tag UI opsional.                         |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.         |
| `sensitive`   | `boolean`  | Menandai field sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.   |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan kemampuan statis yang dapat
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

| Field                            | Type       | What it means                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID provider speech yang dimiliki plugin ini.                      |
| `realtimeTranscriptionProviders` | `string[]` | ID provider transkripsi realtime yang dimiliki plugin ini.        |
| `realtimeVoiceProviders`         | `string[]` | ID provider suara realtime yang dimiliki plugin ini.              |
| `mediaUnderstandingProviders`    | `string[]` | ID provider media-understanding yang dimiliki plugin ini.         |
| `imageGenerationProviders`       | `string[]` | ID provider image-generation yang dimiliki plugin ini.            |
| `videoGenerationProviders`       | `string[]` | ID provider video-generation yang dimiliki plugin ini.            |
| `webFetchProviders`              | `string[]` | ID provider web-fetch yang dimiliki plugin ini.                   |
| `webSearchProviders`             | `string[]` | ID provider web search yang dimiliki plugin ini.                  |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki plugin ini untuk pemeriksaan kontrak bundle. |

## Referensi `channelConfigs`

Gunakan `channelConfigs` saat plugin channel memerlukan metadata konfigurasi
ringan sebelum runtime dimuat.

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

| Field         | Type                     | What it means                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian konfigurasi channel tersebut.   |
| `label`       | `string`                 | Label channel yang digabungkan ke permukaan pemilih dan inspeksi saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk permukaan inspeksi dan katalog.                              |
| `preferOver`  | `string[]`               | ID plugin lama atau berprioritas lebih rendah yang harus dikalahkan channel ini di permukaan seleksi. |

## Referensi `modelSupport`

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin provider Anda
dari ID model singkat seperti `gpt-5.4` atau `claude-sonnet-4.6` sebelum runtime
plugin dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan prioritas ini:

- referensi eksplisit `provider/model` menggunakan metadata manifest `providers`
  milik pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bundle dan satu plugin bundle sama-sama cocok, plugin
  non-bundle yang menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan
  provider

Field:

| Field           | Type       | What it means                                                                     |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap ID model singkat.           |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap ID model singkat setelah sufiks profil dihapus. |

Kunci kemampuan lama tingkat atas sudah deprecated. Gunakan `openclaw doctor --fix`
untuk memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field tingkat atas tersebut sebagai
kepemilikan kemampuan.

## Manifest versus package.json

Kedua file tersebut melayani fungsi yang berbeda:

| File                   | Use it for                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi konfigurasi, metadata pilihan autentikasi, dan petunjuk UI yang harus ada sebelum kode plugin dijalankan      |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, pembatasan instalasi, penyiapan, atau metadata katalog |

Jika Anda tidak yakin metadata tertentu harus ditempatkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field `package.json` yang memengaruhi discovery

Beberapa metadata plugin pra-runtime sengaja ditempatkan di `package.json` di
bawah blok `openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | What it means                                                                                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native.                                                                                                      |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama orientasi dan startup channel tertunda.                                                   |
| `openclaw.channel`                                                | Metadata katalog channel ringan seperti label, path dokumentasi, alias, dan teks pilihan.                                                     |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa status terkonfigurasi ringan yang dapat menjawab “apakah setup khusus env sudah ada?” tanpa memuat runtime channel penuh. |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa autentikasi tersimpan ringan yang dapat menjawab “apakah sudah ada yang login?” tanpa memuat runtime channel penuh.       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/pembaruan untuk plugin bundle dan plugin yang dipublikasikan secara eksternal.                                             |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang dipilih saat tersedia beberapa sumber instalasi.                                                                          |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstalasi plugin bundle yang sempit saat konfigurasi tidak valid.                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus setup dimuat sebelum plugin channel penuh selama startup.                                               |

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan
registri manifest. Nilai yang tidak valid akan ditolak; nilai yang lebih baru
namun valid akan melewati plugin pada host yang lebih lama.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibatasi sempit. Ini
tidak membuat konfigurasi rusak sembarang menjadi dapat diinstal. Saat ini ini
hanya memungkinkan alur instalasi untuk pulih dari kegagalan upgrade plugin
bundle usang tertentu, seperti path plugin bundle yang hilang atau entri
`channels.<id>` usang untuk plugin bundle yang sama. Kesalahan konfigurasi yang
tidak terkait tetap memblokir instalasi dan mengarahkan operator ke
`openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata package untuk modul
pemeriksa kecil:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Gunakan saat setup, doctor, atau alur status terkonfigurasi memerlukan probe
autentikasi ya/tidak yang ringan sebelum plugin channel penuh dimuat. Ekspor
target harus berupa fungsi kecil yang hanya membaca state tersimpan; jangan
arahkan melalui barrel runtime channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan
status terkonfigurasi khusus env yang ringan:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Gunakan saat sebuah channel dapat menjawab status terkonfigurasi dari env atau
input kecil non-runtime lainnya. Jika pemeriksaan memerlukan resolusi
konfigurasi penuh atau runtime channel yang sebenarnya, simpan logika itu di
hook plugin `config.hasConfiguredState`.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, bahkan jika tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat baca/tulis konfigurasi, bukan saat runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **kesalahan**, kecuali ID
  channel tersebut dideklarasikan oleh manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk ke ID plugin yang **dapat ditemukan**. ID yang tidak dikenal
  adalah **kesalahan**.
- Jika plugin terinstal tetapi memiliki manifest atau skema yang rusak atau
  hilang, validasi gagal dan Doctor melaporkan kesalahan plugin tersebut.
- Jika konfigurasi plugin ada tetapi plugin **dinonaktifkan**, konfigurasi tetap
  disimpan dan sebuah **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*`
lengkap.

## Catatan

- Manifest **wajib untuk plugin OpenClaw native**, termasuk pemuatan dari filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifest hanya digunakan
  untuk discovery + validasi.
- Manifest native diurai dengan JSON5, jadi komentar, trailing comma, dan
  kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa object.
- Hanya field manifest yang didokumentasikan yang dibaca oleh pemuat manifest.
  Hindari menambahkan kunci tingkat atas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata ringan untuk probe autentikasi,
  validasi penanda env, dan permukaan autentikasi provider serupa yang tidak
  boleh mem-boot runtime plugin hanya untuk memeriksa nama env.
- `providerAuthAliases` memungkinkan varian provider menggunakan ulang env var
  autentikasi, profil autentikasi, autentikasi berbasis konfigurasi, dan
  pilihan orientasi kunci API milik provider lain tanpa meng-hardcode hubungan
  tersebut di core.
- `channelEnvVars` adalah jalur metadata ringan untuk fallback shell-env,
  prompt setup, dan permukaan channel serupa yang tidak boleh mem-boot runtime
  plugin hanya untuk memeriksa nama env.
- `providerAuthChoices` adalah jalur metadata ringan untuk pemilih pilihan
  autentikasi, resolusi `--auth-choice`, pemetaan provider pilihan, dan
  registrasi flag CLI orientasi sederhana sebelum runtime provider dimuat.
  Untuk metadata wizard runtime yang memerlukan kode provider, lihat
  [Hook runtime provider](/id/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat
  plugin tidak memerlukannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build
  dan persyaratan allowlist package manager apa pun (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Membangun Plugins](/id/plugins/building-plugins) — memulai dengan plugin
- [Arsitektur Plugin](/id/plugins/architecture) — arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi Plugin SDK
