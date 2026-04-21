---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu merilis skema config plugin atau men-debug error validasi plugin
summary: Persyaratan manifest Plugin + skema JSON (validasi config yang ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-21T19:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest Plugin (`openclaw.plugin.json`)

Halaman ini hanya untuk **manifest plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Bundle plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude
  bawaan tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundle tersebut, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle beserta root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan hook pack yang didukung saat tata letaknya sesuai
dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error plugin dan memblokir validasi config.

Lihat panduan lengkap sistem plugin: [Plugin](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat
kode plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi config
- metadata auth dan onboarding yang harus tersedia tanpa mem-boot runtime plugin
- petunjuk aktivasi murah yang dapat diperiksa oleh surface control-plane sebelum runtime
  dimuat
- deskriptor setup murah yang dapat diperiksa oleh surface setup/onboarding sebelum
  runtime dimuat
- metadata alias dan auto-enable yang harus di-resolve sebelum runtime plugin dimuat
- metadata kepemilikan keluarga model bentuk ringkas yang harus mengaktifkan plugin
  secara otomatis sebelum runtime dimuat
- snapshot kepemilikan kapabilitas statis yang digunakan untuk wiring compat bawaan dan
  cakupan kontrak
- metadata runner QA murah yang dapat diperiksa host bersama `openclaw qa`
  sebelum runtime plugin dimuat
- metadata config khusus channel yang harus digabungkan ke dalam surface katalog dan validasi
  tanpa memuat runtime
- petunjuk UI config

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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
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

| Field                               | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                      |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ya       | `string`                         | ID plugin kanonis. Ini adalah ID yang digunakan di `plugins.entries.<id>`.                                                                                                                                  |
| `configSchema`                      | Ya       | `object`                         | JSON Schema inline untuk config plugin ini.                                                                                                                                                                  |
| `enabledByDefault`                  | Tidak    | `true`                           | Menandai plugin bawaan sebagai aktif secara default. Hilangkan field ini, atau tetapkan nilai apa pun selain `true`, agar plugin tetap nonaktif secara default.                                            |
| `legacyPluginIds`                   | Tidak    | `string[]`                       | ID lama yang dinormalisasi ke ID plugin kanonis ini.                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | Tidak    | `string[]`                       | ID provider yang harus mengaktifkan plugin ini secara otomatis saat auth, config, atau referensi model menyebutkannya.                                                                                      |
| `kind`                              | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                |
| `channels`                          | Tidak    | `string[]`                       | ID channel yang dimiliki plugin ini. Digunakan untuk discovery dan validasi config.                                                                                                                          |
| `providers`                         | Tidak    | `string[]`                       | ID provider yang dimiliki plugin ini.                                                                                                                                                                        |
| `modelSupport`                      | Tidak    | `object`                         | Metadata bentuk ringkas keluarga model milik manifest yang digunakan untuk memuat plugin secara otomatis sebelum runtime.                                                                                    |
| `providerEndpoints`                 | Tidak    | `object[]`                       | Metadata host/baseUrl endpoint milik manifest untuk rute provider yang harus diklasifikasikan core sebelum runtime provider dimuat.                                                                         |
| `cliBackends`                       | Tidak    | `string[]`                       | ID backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk auto-activation saat startup dari referensi config eksplisit.                                                                            |
| `syntheticAuthRefs`                 | Tidak    | `string[]`                       | Referensi provider atau backend CLI yang hook auth sintetis milik pluginnya harus diperiksa selama discovery model cold sebelum runtime dimuat.                                                            |
| `nonSecretAuthMarkers`              | Tidak    | `string[]`                       | Nilai placeholder kunci API milik plugin bawaan yang merepresentasikan state kredensial lokal, OAuth, atau ambient yang bukan rahasia.                                                                     |
| `commandAliases`                    | Tidak    | `object[]`                       | Nama perintah yang dimiliki plugin ini yang harus menghasilkan diagnostik config dan CLI yang sadar-plugin sebelum runtime dimuat.                                                                          |
| `providerAuthEnvVars`               | Tidak    | `Record<string, string[]>`       | Metadata env auth provider ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                                                   |
| `providerAuthAliases`               | Tidak    | `Record<string, string>`         | ID provider yang harus menggunakan kembali ID provider lain untuk lookup auth, misalnya provider coding yang berbagi kunci API provider dasar dan profil auth yang sama.                                    |
| `channelEnvVars`                    | Tidak    | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk surface setup atau auth channel berbasis env yang harus terlihat oleh helper startup/config generik. |
| `providerAuthChoices`               | Tidak    | `object[]`                       | Metadata pilihan auth ringan untuk picker onboarding, resolusi provider pilihan, dan wiring flag CLI sederhana.                                                                                             |
| `activation`                        | Tidak    | `object`                         | Petunjuk aktivasi ringan untuk pemuatan yang dipicu provider, perintah, channel, rute, dan kapabilitas. Hanya metadata; runtime plugin tetap memiliki perilaku sebenarnya.                                |
| `setup`                             | Tidak    | `object`                         | Deskriptor setup/onboarding ringan yang dapat diperiksa surface discovery dan setup tanpa memuat runtime plugin.                                                                                            |
| `qaRunners`                         | Tidak    | `object[]`                       | Deskriptor runner QA ringan yang digunakan oleh host bersama `openclaw qa` sebelum runtime plugin dimuat.                                                                                                   |
| `contracts`                         | Tidak    | `object`                         | Snapshot kapabilitas bawaan statis untuk kepemilikan speech, transkripsi realtime, suara realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan tool. |
| `channelConfigs`                    | Tidak    | `Record<string, object>`         | Metadata config channel milik manifest yang digabungkan ke surface discovery dan validasi sebelum runtime dimuat.                                                                                           |
| `skills`                            | Tidak    | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root plugin.                                                                                                                                             |
| `name`                              | Tidak    | `string`                         | Nama plugin yang dapat dibaca manusia.                                                                                                                                                                       |
| `description`                       | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di surface plugin.                                                                                                                                                        |
| `version`                           | Tidak    | `string`                         | Versi plugin untuk informasi.                                                                                                                                                                                |
| `uiHints`                           | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field config.                                                                                                                                         |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime provider dimuat.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | ID provider tempat pilihan ini berada.                                                                  |
| `method`              | Ya       | `string`                                        | ID metode auth untuk dispatch.                                                                          |
| `choiceId`            | Ya       | `string`                                        | ID auth-choice stabil yang digunakan oleh alur onboarding dan CLI.                                      |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna. Jika dihilangkan, OpenClaw akan menggunakan `choiceId`.            |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk picker.                                                                      |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam picker interaktif yang digerakkan asisten.          |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan ini dari picker asisten sambil tetap mengizinkan pemilihan CLI manual.             |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                               |
| `groupId`             | Tidak    | `string`                                        | ID grup opsional untuk mengelompokkan pilihan terkait.                                                  |
| `groupLabel`          | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna untuk grup tersebut.                                                 |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup tersebut.                                                               |
| `optionKey`           | Tidak    | `string`                                        | Kunci opsi internal untuk alur auth sederhana dengan satu flag.                                         |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                          |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                             |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Surface onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya adalah `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` saat sebuah plugin memiliki nama perintah runtime yang
mungkin keliru dimasukkan pengguna ke `plugins.allow` atau coba dijalankan sebagai
perintah CLI root. OpenClaw menggunakan metadata ini untuk diagnostik tanpa mengimpor
kode runtime plugin.

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

| Field        | Wajib    | Tipe              | Artinya                                                                  |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki plugin ini.                                  |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.     |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.   |

## Referensi `activation`

Gunakan `activation` saat plugin dapat secara ringan mendeklarasikan peristiwa control-plane mana
yang seharusnya mengaktifkannya nanti.

## Referensi `qaRunners`

Gunakan `qaRunners` saat sebuah plugin menyumbangkan satu atau lebih runner transport di bawah
root bersama `openclaw qa`. Pertahankan metadata ini tetap ringan dan statis; runtime plugin
tetap memiliki registrasi CLI yang sebenarnya melalui surface `runtime-api.ts`
ringan yang mengekspor `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Menjalankan lane QA live Matrix berbasis Docker terhadap homeserver sekali pakai"
    }
  ]
}
```

| Field         | Wajib    | Tipe     | Artinya                                                               |
| ------------- | -------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Ya       | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`.  |
| `description` | Tidak    | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan plugin yang lebih luas, jadi
metadata activation yang hilang biasanya hanya berdampak pada performa; ini seharusnya tidak
mengubah kebenaran selama fallback kepemilikan manifest lama masih ada.

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

| Field            | Wajib    | Tipe                                                 | Artinya                                                             |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Tidak    | `string[]`                                           | ID provider yang harus mengaktifkan plugin ini saat diminta.        |
| `onCommands`     | Tidak    | `string[]`                                           | ID perintah yang harus mengaktifkan plugin ini.                     |
| `onChannels`     | Tidak    | `string[]`                                           | ID channel yang harus mengaktifkan plugin ini.                      |
| `onRoutes`       | Tidak    | `string[]`                                           | Jenis rute yang harus mengaktifkan plugin ini.                      |
| `onCapabilities` | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan activation control-plane. |

Konsumen live saat ini:

- perencanaan CLI yang dipicu perintah kembali menggunakan fallback
  `commandAliases[].cliCommand` lama atau `commandAliases[].name`
- perencanaan setup/channel yang dipicu channel kembali menggunakan fallback
  kepemilikan `channels[]` lama saat metadata activation channel eksplisit tidak ada
- perencanaan setup/runtime yang dipicu provider kembali menggunakan fallback
  kepemilikan `providers[]` lama dan `cliBackends[]` tingkat atas saat metadata provider
  activation eksplisit tidak ada

## Referensi `setup`

Gunakan `setup` saat surface setup dan onboarding membutuhkan metadata milik plugin yang ringan
sebelum runtime dimuat.

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

`cliBackends` tingkat atas tetap valid dan terus menjelaskan backend inferensi CLI.
`setup.cliBackends` adalah surface deskriptor khusus setup untuk alur
control-plane/setup yang harus tetap hanya berupa metadata.

Saat ada, `setup.providers` dan `setup.cliBackends` adalah surface lookup yang diprioritaskan
dan berbasis deskriptor untuk discovery setup. Jika deskriptor hanya
mempersempit plugin kandidat dan setup masih membutuhkan hook runtime yang lebih kaya pada waktu setup,
tetapkan `requiresRuntime: true` dan tetap gunakan `setup-api` sebagai
jalur eksekusi fallback.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
plugin yang ditemukan. Kepemilikan yang ambigu gagal secara tertutup alih-alih memilih
pemenang berdasarkan urutan discovery.

### Referensi `setup.providers`

| Field         | Wajib    | Tipe       | Artinya                                                                              |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Ya       | `string`   | ID provider yang diekspos selama setup atau onboarding. Pertahankan ID yang dinormalisasi tetap unik secara global. |
| `authMethods` | Tidak    | `string[]` | ID metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.          |
| `envVars`     | Tidak    | `string[]` | Variabel env yang dapat diperiksa surface setup/status generik sebelum runtime plugin dimuat. |

### Field `setup`

| Field              | Wajib    | Tipe       | Artinya                                                                                      |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------- |
| `providers`        | Tidak    | `object[]` | Deskriptor setup provider yang diekspos selama setup dan onboarding.                         |
| `cliBackends`      | Tidak    | `string[]` | ID backend waktu setup yang digunakan untuk lookup setup berbasis deskriptor. Pertahankan ID yang dinormalisasi tetap unik secara global. |
| `configMigrations` | Tidak    | `string[]` | ID migrasi config yang dimiliki oleh surface setup plugin ini.                               |
| `requiresRuntime`  | Tidak    | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.               |

## Referensi `uiHints`

`uiHints` adalah map dari nama field config ke petunjuk rendering kecil.

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

| Field         | Tipe       | Artinya                                 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Label field yang ditampilkan ke pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                   |
| `tags`        | `string[]` | Tag UI opsional.                        |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.        |
| `sensitive`   | `boolean`  | Menandai field sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.  |

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
| `speechProviders`                | `string[]` | ID provider speech yang dimiliki plugin ini.                   |
| `realtimeTranscriptionProviders` | `string[]` | ID provider transkripsi realtime yang dimiliki plugin ini.     |
| `realtimeVoiceProviders`         | `string[]` | ID provider suara realtime yang dimiliki plugin ini.           |
| `mediaUnderstandingProviders`    | `string[]` | ID provider media-understanding yang dimiliki plugin ini.      |
| `imageGenerationProviders`       | `string[]` | ID provider image-generation yang dimiliki plugin ini.         |
| `videoGenerationProviders`       | `string[]` | ID provider video-generation yang dimiliki plugin ini.         |
| `webFetchProviders`              | `string[]` | ID provider web-fetch yang dimiliki plugin ini.                |
| `webSearchProviders`             | `string[]` | ID provider web search yang dimiliki plugin ini.               |
| `tools`                          | `string[]` | Nama tool agent yang dimiliki plugin ini untuk pemeriksaan kontrak bawaan. |

## Referensi `channelConfigs`

Gunakan `channelConfigs` saat sebuah plugin channel membutuhkan metadata config yang ringan sebelum
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
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian config channel tersebut.      |
| `label`       | `string`                 | Label channel yang digabungkan ke surface picker dan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk surface inspect dan katalog.                                |
| `preferOver`  | `string[]`               | ID plugin lama atau prioritas lebih rendah yang harus dikalahkan channel ini di surface pemilihan. |

## Referensi `modelSupport`

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin provider Anda dari
ID model bentuk ringkas seperti `gpt-5.4` atau `claude-sonnet-4.6` sebelum runtime plugin
dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan prioritas ini:

- referensi `provider/model` eksplisit menggunakan metadata manifest `providers` yang memilikinya
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau config menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                          |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap ID model bentuk ringkas.    |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap ID model bentuk ringkas setelah penghapusan sufiks profil. |

Kunci kapabilitas lama tingkat atas sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field tingkat atas tersebut sebagai
kepemilikan kapabilitas.

## Manifest versus package.json

Kedua file ini memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi config, metadata auth-choice, dan petunjuk UI yang harus ada sebelum kode plugin berjalan                    |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, setup, atau metadata katalog |

Jika Anda ragu metadata tertentu harus diletakkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field `package.json` yang memengaruhi discovery

Beberapa metadata plugin pra-runtime sengaja berada di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native.                                                                                                    |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding, startup channel yang ditunda, dan discovery status channel/SecretRef baca-saja. |
| `openclaw.channel`                                                | Metadata katalog channel ringan seperti label, path docs, alias, dan copy pemilihan.                                                        |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah setup khusus env sudah ada?" tanpa memuat runtime channel penuh.     |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa auth tersimpan ringan yang dapat menjawab "apakah sudah ada yang login?" tanpa memuat runtime channel penuh.             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/update untuk plugin bawaan dan plugin yang dipublikasikan secara eksternal.                                              |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang dipilih saat beberapa sumber instalasi tersedia.                                                                        |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstall plugin bawaan yang sempit saat config tidak valid.                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan surface channel khusus setup dimuat sebelum plugin channel penuh selama startup.                                                |

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan registry
manifest. Nilai yang tidak valid ditolak; nilai yang valid tetapi lebih baru akan melewati
plugin pada host yang lebih lama.

Plugin channel harus menyediakan `openclaw.setupEntry` saat status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang terkonfigurasi tanpa memuat
runtime penuh. Entri setup harus mengekspos metadata channel beserta adaptor config,
status, dan secret yang aman untuk setup; pertahankan network client, listener Gateway, dan
runtime transport di entrypoint extension utama.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibuat sempit. Ini
tidak membuat config rusak sembarang menjadi dapat diinstal. Saat ini ini hanya
memungkinkan alur instalasi memulihkan dari kegagalan upgrade plugin bawaan lama tertentu, seperti
path plugin bawaan yang hilang atau entri `channels.<id>` lama untuk plugin bawaan
yang sama tersebut. Error config yang tidak terkait tetap memblokir instalasi dan mengarahkan
operator ke `openclaw doctor --fix`.

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

Gunakan ini saat alur setup, doctor, atau configured-state memerlukan probe auth
ya/tidak yang ringan sebelum plugin channel penuh dimuat. Export target harus berupa
fungsi kecil yang hanya membaca state tersimpan; jangan arahkan melalui barrel runtime
channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured
khusus env yang ringan:

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

Gunakan ini saat sebuah channel dapat menjawab configured-state dari env atau input kecil
non-runtime lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime channel
sebenarnya, simpan logika tersebut di hook plugin `config.hasConfiguredState`.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, meskipun tidak menerima config.
- Schema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Schema divalidasi saat baca/tulis config, bukan saat runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **error**, kecuali ID channel tersebut dideklarasikan oleh
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk ke ID plugin yang **dapat ditemukan**. ID yang tidak dikenal adalah **error**.
- Jika sebuah plugin terinstal tetapi memiliki manifest atau schema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error plugin tersebut.
- Jika config plugin ada tetapi plugin **nonaktif**, config dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi config](/id/gateway/configuration) untuk skema lengkap `plugins.*`.

## Catatan

- Manifest **wajib untuk plugin OpenClaw native**, termasuk pemuatan dari filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifest hanya untuk
  discovery + validasi.
- Manifest native di-parse dengan JSON5, jadi komentar, koma di akhir, dan
  kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa object.
- Hanya field manifest yang terdokumentasi yang dibaca oleh loader manifest. Hindari menambahkan
  kunci tingkat atas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata ringan untuk probe auth, validasi
  penanda env, dan surface auth provider serupa yang tidak seharusnya mem-boot runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthAliases` memungkinkan varian provider menggunakan kembali auth
  env vars, profil auth, auth berbasis config, dan pilihan onboarding kunci API milik provider lain
  tanpa meng-hardcode relasi tersebut di core.
- `providerEndpoints` memungkinkan plugin provider memiliki metadata pencocokan
  host/baseUrl endpoint sederhana. Gunakan hanya untuk kelas endpoint yang sudah didukung core;
  plugin tetap memiliki perilaku runtime.
- `syntheticAuthRefs` adalah jalur metadata ringan untuk hook auth sintetis milik provider
  yang harus terlihat oleh discovery model cold sebelum registry runtime
  ada. Hanya daftarkan referensi yang provider runtime atau backend CLI-nya benar-benar
  mengimplementasikan `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` adalah jalur metadata ringan untuk placeholder kunci API
  milik plugin bawaan seperti penanda kredensial lokal, OAuth, atau ambient.
  Core memperlakukan ini sebagai non-rahasia untuk tampilan auth dan audit secret tanpa
  meng-hardcode provider pemilik.
- `channelEnvVars` adalah jalur metadata ringan untuk fallback shell-env, prompt setup,
  dan surface channel serupa yang tidak seharusnya mem-boot runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthChoices` adalah jalur metadata ringan untuk picker auth-choice,
  resolusi `--auth-choice`, pemetaan provider pilihan, dan registrasi flag CLI
  onboarding sederhana sebelum runtime provider dimuat. Untuk metadata wizard runtime
  yang memerlukan kode provider, lihat
  [Hook runtime provider](/id/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat sebuah
  plugin tidak membutuhkannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan semua
  persyaratan allowlist package manager (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — memulai dengan plugin
- [Arsitektur Plugin](/id/plugins/architecture) — arsitektur internal
- [Ringkasan SDK](/id/plugins/sdk-overview) — referensi SDK Plugin
