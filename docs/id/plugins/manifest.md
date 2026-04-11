---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu mengirim skema konfigurasi plugin atau men-debug kesalahan validasi plugin
summary: Manifest plugin + persyaratan skema JSON (validasi konfigurasi ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-11T02:45:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest plugin (`openclaw.plugin.json`)

Halaman ini hanya untuk **manifest plugin OpenClaw native**.

Untuk layout bundle yang kompatibel, lihat [Plugin bundles](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau layout komponen Claude
  default tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis layout bundle tersebut, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan paket hook yang didukung ketika layout tersebut sesuai
dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
kesalahan plugin dan memblokir validasi konfigurasi.

Lihat panduan lengkap sistem plugin: [Plugins](/id/tools/plugin).
Untuk model capability native dan panduan kompatibilitas eksternal saat ini:
[Model capability](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat
kode plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi konfigurasi
- metadata autentikasi dan onboarding yang harus tersedia tanpa menjalankan runtime
  plugin
- metadata alias dan auto-enable yang harus di-resolve sebelum runtime plugin dimuat
- metadata kepemilikan shorthand model-family yang harus mengaktifkan
  plugin secara otomatis sebelum runtime dimuat
- snapshot kepemilikan capability statis yang digunakan untuk wiring kompatibilitas bundled dan
  cakupan kontrak
- metadata konfigurasi khusus channel yang harus digabungkan ke dalam catalog dan permukaan validasi
  tanpa memuat runtime
- petunjuk UI konfigurasi

Jangan gunakan untuk:

- mendaftarkan perilaku runtime
- mendeklarasikan entrypoint kode
- metadata instalasi npm

Hal-hal tersebut berada di kode plugin Anda dan `package.json`.

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

| Field                               | Wajib | Tipe                             | Artinya                                                                                                                                                                                                      |
| ----------------------------------- | ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ya    | `string`                         | Id plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                  |
| `configSchema`                      | Ya    | `object`                         | JSON Schema inline untuk konfigurasi plugin ini.                                                                                                                                                             |
| `enabledByDefault`                  | Tidak | `true`                           | Menandai plugin bundled sebagai aktif secara default. Hilangkan, atau setel ke nilai selain `true`, agar plugin tetap nonaktif secara default.                                                             |
| `legacyPluginIds`                   | Tidak | `string[]`                       | Id lama yang dinormalisasi ke id plugin kanonis ini.                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | Tidak | `string[]`                       | Id provider yang harus mengaktifkan plugin ini secara otomatis saat autentikasi, konfigurasi, atau referensi model menyebutkannya.                                                                         |
| `kind`                              | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                |
| `channels`                          | Tidak | `string[]`                       | Id channel yang dimiliki plugin ini. Digunakan untuk discovery dan validasi konfigurasi.                                                                                                                     |
| `providers`                         | Tidak | `string[]`                       | Id provider yang dimiliki plugin ini.                                                                                                                                                                        |
| `modelSupport`                      | Tidak | `object`                         | Metadata shorthand model-family milik manifest yang digunakan untuk memuat plugin secara otomatis sebelum runtime.                                                                                           |
| `cliBackends`                       | Tidak | `string[]`                       | Id backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk auto-aktivasi saat startup dari referensi konfigurasi eksplisit.                                                                        |
| `commandAliases`                    | Tidak | `object[]`                       | Nama perintah yang dimiliki plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI yang sadar-plugin sebelum runtime dimuat.                                                                     |
| `providerAuthEnvVars`               | Tidak | `Record<string, string[]>`       | Metadata env autentikasi provider ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                                            |
| `providerAuthAliases`               | Tidak | `Record<string, string>`         | Id provider yang harus menggunakan ulang id provider lain untuk lookup autentikasi, misalnya provider coding yang berbagi API key provider dasar dan profil autentikasi.                                  |
| `channelEnvVars`                    | Tidak | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk penyiapan channel berbasis env atau permukaan autentikasi yang perlu terlihat oleh helper startup/config generik. |
| `providerAuthChoices`               | Tidak | `object[]`                       | Metadata pilihan autentikasi ringan untuk picker onboarding, resolusi preferred-provider, dan wiring flag CLI sederhana.                                                                                    |
| `contracts`                         | Tidak | `object`                         | Snapshot capability bundled statis untuk speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan kepemilikan tool. |
| `channelConfigs`                    | Tidak | `Record<string, object>`         | Metadata konfigurasi channel milik manifest yang digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                                    |
| `skills`                            | Tidak | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root plugin.                                                                                                                                             |
| `name`                              | Tidak | `string`                         | Nama plugin yang dapat dibaca manusia.                                                                                                                                                                       |
| `description`                       | Tidak | `string`                         | Ringkasan singkat yang ditampilkan di permukaan plugin.                                                                                                                                                      |
| `version`                           | Tidak | `string`                         | Versi plugin informasional.                                                                                                                                                                                  |
| `uiHints`                           | Tidak | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field konfigurasi.                                                                                                                                    |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau autentikasi.
OpenClaw membaca ini sebelum runtime provider dimuat.

| Field                 | Wajib | Tipe                                            | Artinya                                                                                                  |
| --------------------- | ----- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya    | `string`                                        | Id provider tempat pilihan ini berada.                                                                   |
| `method`              | Ya    | `string`                                        | Id metode autentikasi yang akan digunakan.                                                               |
| `choiceId`            | Ya    | `string`                                        | Id auth-choice stabil yang digunakan oleh alur onboarding dan CLI.                                       |
| `choiceLabel`         | Tidak | `string`                                        | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw menggunakan `choiceId` sebagai fallback.  |
| `choiceHint`          | Tidak | `string`                                        | Teks bantuan singkat untuk picker.                                                                       |
| `assistantPriority`   | Tidak | `number`                                        | Nilai lebih rendah diurutkan lebih awal dalam picker interaktif yang digerakkan asisten.                |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                  | Menyembunyikan pilihan dari picker asisten sambil tetap mengizinkan pemilihan CLI manual.               |
| `deprecatedChoiceIds` | Tidak | `string[]`                                      | Id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                |
| `groupId`             | Tidak | `string`                                        | Id grup opsional untuk mengelompokkan pilihan terkait.                                                   |
| `groupLabel`          | Tidak | `string`                                        | Label yang terlihat oleh pengguna untuk grup tersebut.                                                   |
| `groupHint`           | Tidak | `string`                                        | Teks bantuan singkat untuk grup.                                                                         |
| `optionKey`           | Tidak | `string`                                        | Kunci opsi internal untuk alur autentikasi satu-flag sederhana.                                          |
| `cliFlag`             | Tidak | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                           |
| `cliOption`           | Tidak | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Tidak | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                              |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` ketika plugin memiliki nama perintah runtime yang mungkin
secara keliru dimasukkan pengguna ke `plugins.allow` atau coba dijalankan sebagai perintah CLI root. OpenClaw
menggunakan metadata ini untuk diagnostik tanpa mengimpor kode runtime plugin.

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

| Field        | Wajib | Tipe              | Artinya                                                                  |
| ------------ | ----- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Ya    | `string`          | Nama perintah yang dimiliki plugin ini.                                  |
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.     |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.   |

## Referensi `uiHints`

`uiHints` adalah peta dari nama field konfigurasi ke petunjuk rendering kecil.

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

| Field         | Tipe       | Artinya                                  |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Label field yang terlihat oleh pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                    |
| `tags`        | `string[]` | Tag UI opsional.                         |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.         |
| `sensitive`   | `boolean`  | Menandai field sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.   |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan capability statis yang dapat dibaca OpenClaw
tanpa mengimpor runtime plugin.

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

| Field                            | Tipe       | Artinya                                                      |
| -------------------------------- | ---------- | ------------------------------------------------------------ |
| `speechProviders`                | `string[]` | Id provider speech yang dimiliki plugin ini.                 |
| `realtimeTranscriptionProviders` | `string[]` | Id provider transkripsi realtime yang dimiliki plugin ini.   |
| `realtimeVoiceProviders`         | `string[]` | Id provider suara realtime yang dimiliki plugin ini.         |
| `mediaUnderstandingProviders`    | `string[]` | Id provider media-understanding yang dimiliki plugin ini.    |
| `imageGenerationProviders`       | `string[]` | Id provider image-generation yang dimiliki plugin ini.       |
| `videoGenerationProviders`       | `string[]` | Id provider video-generation yang dimiliki plugin ini.       |
| `webFetchProviders`              | `string[]` | Id provider web-fetch yang dimiliki plugin ini.              |
| `webSearchProviders`             | `string[]` | Id provider web search yang dimiliki plugin ini.             |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki plugin ini untuk pemeriksaan kontrak bundled. |

## Referensi `channelConfigs`

Gunakan `channelConfigs` ketika plugin channel memerlukan metadata konfigurasi ringan sebelum
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

| Field         | Tipe                     | Artinya                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian konfigurasi channel tersebut. |
| `label`       | `string`                 | Label channel yang digabungkan ke picker dan permukaan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk permukaan inspect dan catalog.                           |
| `preferOver`  | `string[]`               | Id plugin lama atau berprioritas lebih rendah yang harus dikalahkan channel ini dalam permukaan seleksi. |

## Referensi `modelSupport`

Gunakan `modelSupport` ketika OpenClaw harus menyimpulkan plugin provider Anda dari
id model shorthand seperti `gpt-5.4` atau `claude-sonnet-4.6` sebelum runtime plugin
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

- referensi `provider/model` eksplisit menggunakan metadata manifest `providers` yang memilikinya
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bundled dan satu plugin bundled sama-sama cocok, plugin non-bundled
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefix yang dicocokkan dengan `startsWith` terhadap id model shorthand.  |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model shorthand setelah suffix profil dihapus. |

Kunci capability tingkat atas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field tingkat atas tersebut sebagai kepemilikan
capability.

## Manifest versus package.json

Kedua file ini melayani tugas yang berbeda:

| File                   | Gunakan untuk                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi konfigurasi, metadata auth-choice, dan petunjuk UI yang harus ada sebelum kode plugin dijalankan            |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gerbang instalasi, setup, atau metadata catalog |

Jika Anda ragu di mana sebuah metadata harus ditempatkan, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field `package.json` yang memengaruhi discovery

Sebagian metadata plugin pra-runtime memang sengaja ditempatkan di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native.                                                                                                    |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding dan startup channel tertunda.                                                |
| `openclaw.channel`                                                | Metadata catalog channel ringan seperti label, path dokumen, alias, dan teks pemilihan.                                                     |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah setup khusus env saja sudah ada?" tanpa memuat runtime channel penuh. |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa persisted-auth ringan yang dapat menjawab "apakah sudah ada yang login?" tanpa memuat runtime channel penuh.             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/pembaruan untuk plugin bundled dan plugin yang dipublikasikan secara eksternal.                                          |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang dipilih ketika tersedia beberapa sumber instalasi.                                                                      |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstalasi plugin bundled yang sempit saat konfigurasi tidak valid.                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus setup dimuat sebelum plugin channel penuh selama startup.                                              |

`openclaw.install.minHostVersion` ditegakkan selama instalasi dan pemuatan
registry manifest. Nilai yang tidak valid akan ditolak; nilai yang valid tetapi lebih baru akan melewati
plugin pada host yang lebih lama.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibuat sempit. Ini
tidak membuat konfigurasi rusak sembarang menjadi dapat diinstal. Saat ini fitur ini hanya mengizinkan alur instalasi
untuk pulih dari kegagalan upgrade plugin bundled lama tertentu, seperti
path plugin bundled yang hilang atau entri `channels.<id>` lama untuk plugin
bundled yang sama. Kesalahan konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata package untuk modul pemeriksa kecil:

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

Gunakan ini ketika setup, doctor, atau alur configured-state membutuhkan probe autentikasi yes/no
yang ringan sebelum plugin channel penuh dimuat. Export target harus berupa
fungsi kecil yang hanya membaca status yang dipersistenkan; jangan arahkan melalui barrel runtime
channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured-state khusus env yang ringan:

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

Gunakan ini ketika suatu channel dapat menjawab configured-state dari env atau input kecil
non-runtime lainnya. Jika pemeriksaan membutuhkan resolusi konfigurasi penuh atau runtime
channel yang sebenarnya, simpan logika itu di hook plugin `config.hasConfiguredState`.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, bahkan jika tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat baca/tulis konfigurasi, bukan saat runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **kesalahan**, kecuali id channel tersebut dideklarasikan oleh
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk ke id plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **kesalahan**.
- Jika sebuah plugin terinstal tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan kesalahan plugin tersebut.
- Jika konfigurasi plugin ada tetapi plugin **dinonaktifkan**, konfigurasi dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Configuration reference](/id/gateway/configuration) untuk skema lengkap `plugins.*`.

## Catatan

- Manifest **wajib untuk plugin OpenClaw native**, termasuk load dari filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifest hanya digunakan untuk
  discovery + validasi.
- Manifest native diurai dengan JSON5, jadi komentar, trailing comma, dan
  kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya field manifest yang didokumentasikan yang dibaca oleh pemuat manifest. Hindari menambahkan
  kunci tingkat atas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata ringan untuk probe autentikasi, validasi
  env-marker, dan permukaan autentikasi provider serupa yang tidak seharusnya menyalakan runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthAliases` memungkinkan varian provider menggunakan ulang env var autentikasi,
  profil autentikasi, autentikasi berbasis konfigurasi, dan pilihan onboarding API-key
  milik provider lain tanpa melakukan hardcode hubungan itu di inti.
- `channelEnvVars` adalah jalur metadata ringan untuk fallback shell-env, prompt
  setup, dan permukaan channel serupa yang tidak seharusnya menyalakan runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthChoices` adalah jalur metadata ringan untuk picker auth-choice,
  resolusi `--auth-choice`, pemetaan preferred-provider, dan pendaftaran flag CLI
  onboarding sederhana sebelum runtime provider dimuat. Untuk metadata wizard runtime
  yang memerlukan kode provider, lihat
  [Provider runtime hooks](/id/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan ketika sebuah
  plugin tidak memerlukannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan setiap
  persyaratan allowlist package manager (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Building Plugins](/id/plugins/building-plugins) — mulai menggunakan plugin
- [Plugin Architecture](/id/plugins/architecture) — arsitektur internal
- [SDK Overview](/id/plugins/sdk-overview) — referensi Plugin SDK
