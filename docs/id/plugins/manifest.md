---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu mengirim skema config Plugin atau men-debug error validasi Plugin
summary: Manifest Plugin + persyaratan skema JSON (validasi config ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-24T09:19:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Halaman ini hanya untuk **manifest Plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Bundle Plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude
  default tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi tata letak bundle tersebut secara otomatis, tetapi tidak divalidasi
terhadap schema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus root
skill yang dideklarasikan, root command Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan hook pack yang didukung saat tata letaknya cocok
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error Plugin dan memblokir validasi config.

Lihat panduan sistem Plugin lengkap: [Plugins](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat
kode Plugin Anda**. Semua yang ada di bawah ini harus cukup ringan untuk diperiksa tanpa menjalankan
runtime Plugin.

**Gunakan untuk:**

- identitas Plugin, validasi config, dan petunjuk UI config
- metadata auth, onboarding, dan penyiapan (alias, auto-enable, env var provider, pilihan auth)
- petunjuk aktivasi untuk surface control plane
- kepemilikan shorthand keluarga model
- snapshot kepemilikan kapabilitas statis (`contracts`)
- metadata runner QA yang dapat diperiksa host bersama `openclaw qa`
- metadata config khusus channel yang digabungkan ke surface katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan entrypoint kode,
atau metadata instalasi npm. Itu termasuk ke kode Plugin Anda dan `package.json`.

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

## Referensi field level atas

| Field                                | Wajib | Tipe                             | Artinya                                                                                                                                                                                                                          |
| ------------------------------------ | ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya    | `string`                         | Id Plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                                      |
| `configSchema`                       | Ya    | `object`                         | JSON Schema inline untuk config Plugin ini.                                                                                                                                                                                      |
| `enabledByDefault`                   | Tidak | `true`                           | Menandai Plugin bawaan sebagai aktif secara default. Hilangkan, atau atur ke nilai apa pun selain `true`, untuk membiarkan Plugin nonaktif secara default.                                                                    |
| `legacyPluginIds`                    | Tidak | `string[]`                       | Id lama yang dinormalisasi ke id Plugin kanonis ini.                                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | Tidak | `string[]`                       | Id provider yang harus mengaktifkan otomatis Plugin ini saat auth, config, atau ref model menyebutnya.                                                                                                                          |
| `kind`                               | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                   |
| `channels`                           | Tidak | `string[]`                       | Id channel yang dimiliki Plugin ini. Digunakan untuk discovery dan validasi config.                                                                                                                                             |
| `providers`                          | Tidak | `string[]`                       | Id provider yang dimiliki Plugin ini.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Tidak | `string`                         | Path modul discovery provider yang ringan, relatif ke root Plugin, untuk metadata katalog provider yang dicakup manifest dan dapat dimuat tanpa mengaktifkan runtime Plugin penuh.                                             |
| `modelSupport`                       | Tidak | `object`                         | Metadata shorthand keluarga model milik manifest yang digunakan untuk memuat otomatis Plugin sebelum runtime.                                                                                                                    |
| `providerEndpoints`                  | Tidak | `object[]`                       | Metadata host/baseUrl endpoint milik manifest untuk rute provider yang harus diklasifikasikan core sebelum runtime provider dimuat.                                                                                             |
| `cliBackends`                        | Tidak | `string[]`                       | Id backend inferensi CLI yang dimiliki Plugin ini. Digunakan untuk auto-aktivasi saat startup dari ref config eksplisit.                                                                                                        |
| `syntheticAuthRefs`                  | Tidak | `string[]`                       | Ref provider atau backend CLI yang hook auth sintetis milik Pluginnya harus di-probe selama discovery model dingin sebelum runtime dimuat.                                                                                     |
| `nonSecretAuthMarkers`               | Tidak | `string[]`                       | Nilai API key placeholder milik Plugin bawaan yang mewakili state kredensial lokal, OAuth, atau ambient non-secret.                                                                                                            |
| `commandAliases`                     | Tidak | `object[]`                       | Nama perintah yang dimiliki Plugin ini yang harus menghasilkan diagnostik config dan CLI yang sadar Plugin sebelum runtime dimuat.                                                                                               |
| `providerAuthEnvVars`                | Tidak | `Record<string, string[]>`       | Metadata env auth provider yang ringan dan dapat diperiksa OpenClaw tanpa memuat kode Plugin.                                                                                                                                   |
| `providerAuthAliases`                | Tidak | `Record<string, string>`         | Id provider yang harus menggunakan kembali id provider lain untuk lookup auth, misalnya provider coding yang berbagi API key dan profil auth provider dasar.                                                                    |
| `channelEnvVars`                     | Tidak | `Record<string, string[]>`       | Metadata env channel yang ringan dan dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk penyiapan channel berbasis env atau surface auth yang perlu dilihat helper startup/config generik.                 |
| `providerAuthChoices`                | Tidak | `object[]`                       | Metadata pilihan auth yang ringan untuk picker onboarding, resolusi provider yang dipilih, dan wiring flag CLI sederhana.                                                                                                      |
| `activation`                         | Tidak | `object`                         | Metadata planner aktivasi yang ringan untuk pemuatan yang dipicu provider, perintah, channel, rute, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku sebenarnya.                                      |
| `setup`                              | Tidak | `object`                         | Deskriptor setup/onboarding yang ringan yang dapat diperiksa surface discovery dan setup tanpa memuat runtime Plugin.                                                                                                          |
| `qaRunners`                          | Tidak | `object[]`                       | Deskriptor QA runner ringan yang digunakan host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                           |
| `contracts`                          | Tidak | `object`                         | Snapshot kapabilitas statis bawaan untuk hook auth eksternal, ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, web-fetch, web search, dan kepemilikan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak | `Record<string, object>`         | Default pemahaman media yang ringan untuk id provider yang dideklarasikan di `contracts.mediaUnderstandingProviders`.                                                                                                          |
| `channelConfigs`                     | Tidak | `Record<string, object>`         | Metadata config channel milik manifest yang digabungkan ke surface discovery dan validasi sebelum runtime dimuat.                                                                                                              |
| `skills`                             | Tidak | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root Plugin.                                                                                                                                                                |
| `name`                               | Tidak | `string`                         | Nama Plugin yang mudah dibaca manusia.                                                                                                                                                                                           |
| `description`                        | Tidak | `string`                         | Ringkasan singkat yang ditampilkan di surface Plugin.                                                                                                                                                                            |
| `version`                            | Tidak | `string`                         | Versi Plugin informasional.                                                                                                                                                                                                      |
| `uiHints`                            | Tidak | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field config.                                                                                                                                                            |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` mendeskripsikan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime provider dimuat.

| Field                 | Wajib | Tipe                                            | Artinya                                                                                           |
| --------------------- | ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `provider`            | Ya    | `string`                                        | Id provider tempat pilihan ini berada.                                                            |
| `method`              | Ya    | `string`                                        | Id metode auth yang akan dikirim ke dispatcher.                                                   |
| `choiceId`            | Ya    | `string`                                        | Id pilihan auth yang stabil dan digunakan oleh alur onboarding dan CLI.                           |
| `choiceLabel`         | Tidak | `string`                                        | Label yang ditampilkan kepada pengguna. Jika dihilangkan, OpenClaw menggunakan fallback `choiceId`. |
| `choiceHint`          | Tidak | `string`                                        | Teks bantuan singkat untuk picker.                                                                |
| `assistantPriority`   | Tidak | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam picker interaktif yang digerakkan asisten.     |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari picker asisten sambil tetap mengizinkan pemilihan manual melalui CLI.    |
| `deprecatedChoiceIds` | Tidak | `string[]`                                      | Id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                         |
| `groupId`             | Tidak | `string`                                        | Id grup opsional untuk mengelompokkan pilihan terkait.                                            |
| `groupLabel`          | Tidak | `string`                                        | Label yang ditampilkan kepada pengguna untuk grup tersebut.                                       |
| `groupHint`           | Tidak | `string`                                        | Teks bantuan singkat untuk grup.                                                                  |
| `optionKey`           | Tidak | `string`                                        | Kunci opsi internal untuk alur auth satu-flag sederhana.                                          |
| `cliFlag`             | Tidak | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                    |
| `cliOption`           | Tidak | `string`                                        | Bentuk opsi CLI penuh, seperti `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Tidak | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                       |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation">` | Surface onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` saat sebuah Plugin memiliki nama perintah runtime yang mungkin
secara keliru dimasukkan pengguna ke `plugins.allow` atau dicoba dijalankan sebagai perintah CLI root. OpenClaw
menggunakan metadata ini untuk diagnostik tanpa mengimpor kode runtime Plugin.

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

| Field        | Wajib | Tipe              | Artinya                                                                   |
| ------------ | ----- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Ya    | `string`          | Nama perintah yang dimiliki Plugin ini.                                   |
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai slash command chat, bukan perintah CLI root.       |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.    |

## Referensi `activation`

Gunakan `activation` saat Plugin dapat mendeklarasikan secara ringan peristiwa control plane mana
yang harus memasukkannya ke dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata planner, bukan API lifecycle. Blok ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode Plugin sudah dijalankan. Planner aktivasi menggunakan field ini untuk
mempersempit kandidat Plugin sebelum fallback ke metadata kepemilikan manifest
yang ada seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hooks.

Utamakan metadata tersempit yang sudah mendeskripsikan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
saat field-field tersebut mengekspresikan relasinya. Gunakan `activation` untuk petunjuk planner tambahan
yang tidak dapat direpresentasikan oleh field kepemilikan tersebut.

Blok ini hanya metadata. Blok ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/Plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan Plugin yang lebih luas, sehingga
metadata aktivasi yang hilang biasanya hanya berdampak pada performa; metadata ini tidak
boleh mengubah kebenaran selama fallback kepemilikan manifest lama masih ada.

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

| Field            | Wajib | Tipe                                                 | Artinya                                                                                           |
| ---------------- | ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `onProviders`    | Tidak | `string[]`                                           | Id provider yang harus memasukkan Plugin ini ke dalam rencana aktivasi/pemuatan.                 |
| `onCommands`     | Tidak | `string[]`                                           | Id perintah yang harus memasukkan Plugin ini ke dalam rencana aktivasi/pemuatan.                 |
| `onChannels`     | Tidak | `string[]`                                           | Id channel yang harus memasukkan Plugin ini ke dalam rencana aktivasi/pemuatan.                  |
| `onRoutes`       | Tidak | `string[]`                                           | Jenis rute yang harus memasukkan Plugin ini ke dalam rencana aktivasi/pemuatan.                  |
| `onCapabilities` | Tidak | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan aktivasi control plane. Lebih baik gunakan field yang lebih sempit bila memungkinkan. |

Konsumen live saat ini:

- Perencanaan CLI yang dipicu perintah melakukan fallback ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- Perencanaan setup/channel yang dipicu channel melakukan fallback ke kepemilikan
  `channels[]` lama saat metadata aktivasi channel eksplisit tidak ada
- Perencanaan setup/runtime yang dipicu provider melakukan fallback ke
  `providers[]` lama dan kepemilikan `cliBackends[]` level atas saat metadata
  aktivasi provider eksplisit tidak ada

Diagnostik planner dapat membedakan petunjuk aktivasi eksplisit dari fallback
kepemilikan manifest. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
planner menggunakan kepemilikan `commandAliases` sebagai gantinya. Label alasan ini untuk
diagnostik host dan pengujian; penulis Plugin sebaiknya tetap mendeklarasikan metadata
yang paling tepat menggambarkan kepemilikan.

## Referensi `qaRunners`

Gunakan `qaRunners` saat sebuah Plugin menyumbangkan satu atau lebih runner transport di bawah
root bersama `openclaw qa`. Pertahankan metadata ini tetap ringan dan statis; runtime Plugin
tetap memiliki pendaftaran CLI sebenarnya melalui surface `runtime-api.ts`
ringan yang mengekspor `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Jalankan lane QA live Matrix berbasis Docker terhadap homeserver sekali pakai"
    }
  ]
}
```

| Field         | Wajib | Tipe     | Artinya                                                          |
| ------------- | ----- | -------- | ---------------------------------------------------------------- |
| `commandName` | Ya    | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`. |
| `description` | Tidak | `string` | Teks bantuan fallback yang digunakan saat host bersama membutuhkan perintah stub. |

## Referensi `setup`

Gunakan `setup` saat surface setup dan onboarding memerlukan metadata milik Plugin yang ringan
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

`cliBackends` level atas tetap valid dan terus mendeskripsikan backend inferensi CLI.
`setup.cliBackends` adalah surface deskriptor khusus setup untuk
alur control-plane/setup yang harus tetap hanya berupa metadata.

Saat ada, `setup.providers` dan `setup.cliBackends` adalah surface lookup
berbasis deskriptor yang diutamakan untuk discovery setup. Jika deskriptor hanya
mempersempit kandidat Plugin dan setup masih memerlukan hook runtime waktu-setup yang lebih kaya,
atur `requiresRuntime: true` dan pertahankan `setup-api` sebagai
jalur eksekusi fallback.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik Plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
Plugin yang ditemukan. Kepemilikan yang ambigu gagal tertutup alih-alih memilih
pemenang berdasarkan urutan discovery.

### Referensi `setup.providers`

| Field         | Wajib | Tipe       | Artinya                                                                         |
| ------------- | ----- | ---------- | ------------------------------------------------------------------------------- |
| `id`          | Ya    | `string`   | Id provider yang diekspos selama setup atau onboarding. Jaga agar id yang dinormalisasi unik secara global. |
| `authMethods` | Tidak | `string[]` | Id metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.     |
| `envVars`     | Tidak | `string[]` | Env vars yang dapat diperiksa surface setup/status generik sebelum runtime Plugin dimuat. |

### Field `setup`

| Field              | Wajib | Tipe       | Artinya                                                                                         |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Tidak | `object[]` | Deskriptor setup provider yang diekspos selama setup dan onboarding.                            |
| `cliBackends`      | Tidak | `string[]` | Id backend waktu-setup yang digunakan untuk lookup setup berbasis deskriptor. Jaga agar id yang dinormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | Id migrasi config yang dimiliki surface setup Plugin ini.                                        |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.                  |

## Referensi `uiHints`

`uiHints` adalah peta dari nama field config ke petunjuk render kecil.

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

| Field         | Tipe       | Artinya                                |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Label field yang ditampilkan ke pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                  |
| `tags`        | `string[]` | Tag UI opsional.                       |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.       |
| `sensitive`   | `boolean`  | Menandai field sebagai secret atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir. |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat dibaca OpenClaw
tanpa mengimpor runtime Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Field                            | Tipe       | Artinya                                                           |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id runtime tertanam yang dapat didaftarkan factory-nya oleh Plugin bawaan. |
| `externalAuthProviders`          | `string[]` | Id provider yang hook profil auth eksternalnya dimiliki Plugin ini. |
| `speechProviders`                | `string[]` | Id provider ucapan yang dimiliki Plugin ini.                      |
| `realtimeTranscriptionProviders` | `string[]` | Id provider transkripsi realtime yang dimiliki Plugin ini.        |
| `realtimeVoiceProviders`         | `string[]` | Id provider suara realtime yang dimiliki Plugin ini.              |
| `memoryEmbeddingProviders`       | `string[]` | Id provider embedding memory yang dimiliki Plugin ini.            |
| `mediaUnderstandingProviders`    | `string[]` | Id provider pemahaman media yang dimiliki Plugin ini.             |
| `imageGenerationProviders`       | `string[]` | Id provider pembuatan gambar yang dimiliki Plugin ini.            |
| `videoGenerationProviders`       | `string[]` | Id provider pembuatan video yang dimiliki Plugin ini.             |
| `webFetchProviders`              | `string[]` | Id provider web-fetch yang dimiliki Plugin ini.                   |
| `webSearchProviders`             | `string[]` | Id provider web search yang dimiliki Plugin ini.                  |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki Plugin ini untuk pemeriksaan kontrak bawaan. |

Plugin provider yang mengimplementasikan `resolveExternalAuthProfiles` harus mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi ini tetap dijalankan
melalui fallback kompatibilitas yang sudah deprecated, tetapi fallback itu lebih lambat dan
akan dihapus setelah jendela migrasi.

Provider embedding memory bawaan harus mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap id adapter yang mereka ekspos, termasuk
adapter bawaan seperti `local`. Jalur CLI mandiri menggunakan kontrak manifest
ini untuk memuat hanya Plugin pemilik sebelum runtime Gateway penuh
mendaftarkan provider.

## Referensi `mediaUnderstandingProviderMetadata`

Gunakan `mediaUnderstandingProviderMetadata` saat sebuah provider pemahaman media memiliki
model default, prioritas fallback auto-auth, atau dukungan dokumen native yang
dibutuhkan helper core generik sebelum runtime dimuat. Kuncinya juga harus dideklarasikan di
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Setiap entri provider dapat mencakup:

| Field                  | Tipe                                | Artinya                                                                     |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Kapabilitas media yang diekspos oleh provider ini.                           |
| `defaultModels`        | `Record<string, string>`            | Default kapabilitas-ke-model yang digunakan saat config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka yang lebih rendah diurutkan lebih awal untuk fallback provider otomatis berbasis kredensial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh provider.                            |

## Referensi `channelConfigs`

Gunakan `channelConfigs` saat sebuah Plugin channel memerlukan metadata config yang ringan sebelum
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
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian config channel tersebut.    |
| `label`       | `string`                 | Label channel yang digabungkan ke surface picker dan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi singkat channel untuk surface inspect dan katalog.                             |
| `preferOver`  | `string[]`               | Id Plugin lama atau prioritas lebih rendah yang harus dikalahkan channel ini dalam surface pemilihan. |

## Referensi `modelSupport`

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan Plugin provider Anda dari
id model shorthand seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum runtime Plugin
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

- ref `provider/model` eksplisit menggunakan metadata manifest `providers` milik pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu Plugin non-bawaan dan satu Plugin bawaan sama-sama cocok, Plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau config menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model shorthand.     |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model shorthand setelah penghapusan sufiks profil. |

Kunci kapabilitas level atas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field level atas tersebut sebagai
kepemilikan kapabilitas.

## Manifest versus package.json

Kedua file ini melayani fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi config, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode Plugin berjalan              |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, setup, atau metadata katalog |

Jika Anda ragu metadata tertentu harus ditempatkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode Plugin, taruh di `openclaw.plugin.json`
- jika berkaitan dengan packaging, file entri, atau perilaku instalasi npm, taruh di `package.json`

### Field `package.json` yang memengaruhi discovery

Beberapa metadata Plugin pra-runtime memang sengaja berada di `package.json` di bawah blok
`openclaw` alih-alih `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint Plugin native. Harus tetap berada di dalam direktori paket Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk paket yang terinstal. Harus tetap berada di dalam direktori paket Plugin.                                          |
| `openclaw.setupEntry`                                             | Entrypoint khusus setup yang ringan dan digunakan selama onboarding, startup channel yang ditunda, dan discovery status channel/SecretRef yang read-only. Harus tetap berada di dalam direktori paket Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint setup JavaScript hasil build untuk paket yang terinstal. Harus tetap berada di dalam direktori paket Plugin.                                            |
| `openclaw.channel`                                                | Metadata katalog channel yang ringan seperti label, path dokumentasi, alias, dan teks pemilihan.                                                                                   |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah penyiapan hanya-env sudah ada?" tanpa memuat runtime channel penuh.                                         |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa persisted-auth yang ringan yang dapat menjawab "apakah sudah ada yang login?" tanpa memuat runtime channel penuh.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk install/update untuk Plugin bawaan dan Plugin yang dipublikasikan secara eksternal.                                                                                       |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang diutamakan saat tersedia beberapa sumber instalasi.                                                                                                            |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan floor semver seperti `>=2026.3.22`.                                                                                         |
| `openclaw.install.expectedIntegrity`                              | String integritas dist npm yang diharapkan seperti `sha512-...`; alur install dan update memverifikasi artefak yang diambil terhadap nilai ini.                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstall Plugin bawaan yang sempit saat config tidak valid.                                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan surface channel khusus setup dimuat sebelum Plugin channel penuh saat startup.                                                                                         |

Metadata manifest menentukan pilihan provider/channel/setup mana yang muncul dalam
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan Plugin tersebut ketika pengguna memilih salah satu
pilihan itu. Jangan pindahkan petunjuk instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` ditegakkan selama instalasi dan pemuatan
registri manifest. Nilai yang tidak valid ditolak; nilai yang valid tetapi lebih baru membuat Plugin dilewati
pada host yang lebih lama.

Pinning versi npm yang tepat sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
sebaiknya memasangkan spesifikasi yang tepat dengan `expectedIntegrity` agar alur update gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang dipin.
Onboarding interaktif tetap menawarkan spesifikasi npm registry tepercaya, termasuk nama
paket kosong dan dist-tag, untuk kompatibilitas. Diagnostik katalog dapat
membedakan sumber yang tepat, mengambang, dipin integritasnya, dan yang tidak memiliki integritas.
Saat `expectedIntegrity` ada, alur install/update menegakkannya; saat dihilangkan,
resolusi registry dicatat tanpa pin integritas.

Plugin channel harus menyediakan `openclaw.setupEntry` ketika status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang dikonfigurasi tanpa memuat
runtime penuh. Entrypoint setup sebaiknya mengekspos metadata channel plus adapter
config, status, dan secret yang aman untuk setup; pertahankan klien jaringan, listener gateway, dan
runtime transport di entrypoint extension utama.

Field entrypoint runtime tidak menimpa pemeriksaan batas paket untuk source
field entrypoint. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
path `openclaw.extensions` yang keluar dari batas paket menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` memang sengaja sempit. Ini
tidak membuat config rusak sembarang menjadi dapat diinstal. Saat ini hanya memungkinkan alur install
pulih dari kegagalan upgrade Plugin bawaan tertentu yang stale, seperti path
Plugin bawaan yang hilang atau entri `channels.<id>` yang stale untuk Plugin bawaan yang sama itu.
Error config yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata paket untuk modul
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

Gunakan ini saat alur setup, doctor, atau configured-state memerlukan probe auth
ya/tidak yang ringan sebelum Plugin channel penuh dimuat. Ekspor target harus berupa
fungsi kecil yang hanya membaca state persisten; jangan arahkan melalui barrel runtime
channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured-state
ringan berbasis env saja:

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

Gunakan ini saat sebuah channel dapat menjawab configured-state dari env atau input
kecil non-runtime lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime
channel sebenarnya, simpan logika itu di hook Plugin `config.hasConfiguredState`.

## Prioritas discovery (id Plugin duplikat)

OpenClaw menemukan Plugin dari beberapa root (bawaan, instalasi global, workspace, path yang dipilih secara eksplisit dalam config). Jika dua hasil discovery berbagi `id` yang sama, hanya manifest dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan.

Urutan prioritas, tertinggi ke terendah:

1. **Dipilih config** — path yang dipin secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — Plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — Plugin yang diinstal ke root Plugin global OpenClaw
4. **Workspace** — Plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau stale dari Plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar menimpa Plugin bawaan dengan Plugin lokal, pin melalui `plugins.entries.<id>` agar menang berdasarkan prioritas alih-alih mengandalkan discovery workspace.
- Pembuangan duplikat dicatat ke log sehingga Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.

## Persyaratan JSON Schema

- **Setiap Plugin harus menyertakan JSON Schema**, bahkan jika tidak menerima config.
- Schema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Schema divalidasi saat baca/tulis config, bukan saat runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **error**, kecuali id channel tersebut dideklarasikan oleh
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk ke id Plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **error**.
- Jika sebuah Plugin terinstal tetapi manifest atau schema-nya rusak atau hilang,
  validasi gagal dan Doctor melaporkan error Plugin tersebut.
- Jika config Plugin ada tetapi Pluginnya **dinonaktifkan**, config tetap disimpan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk schema `plugins.*` lengkap.

## Catatan

- Manifest **wajib untuk Plugin OpenClaw native**, termasuk muatan dari filesystem lokal. Runtime tetap memuat modul Plugin secara terpisah; manifest hanya untuk discovery + validasi.
- Manifest native diurai dengan JSON5, sehingga komentar, koma di akhir, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya field manifest yang didokumentasikan yang dibaca oleh manifest loader. Hindari kunci level atas kustom.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan jika Plugin tidak membutuhkannya.
- `providerDiscoveryEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog provider statis atau deskriptor discovery sempit, bukan untuk eksekusi saat request.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Metadata env-var (`providerAuthEnvVars`, `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman cron, dan surface read-only lainnya tetap menerapkan trust Plugin dan kebijakan aktivasi efektif sebelum memperlakukan env var sebagai terkonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode provider, lihat [Hook runtime provider](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist package manager (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Membangun Plugin" href="/id/plugins/building-plugins" icon="rocket">
    Memulai dengan Plugin.
  </Card>
  <Card title="Arsitektur Plugin" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model kapabilitas.
  </Card>
  <Card title="Ikhtisar SDK" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK Plugin dan impor subpath.
  </Card>
</CardGroup>
