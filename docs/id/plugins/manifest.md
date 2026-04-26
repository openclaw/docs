---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu mengirim schema config Plugin atau men-debug error validasi Plugin
summary: Manifest Plugin + persyaratan JSON schema (validasi config ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

Halaman ini hanya untuk **manifest Plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Plugin bundles](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude default
  tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundle tersebut, tetapi tata letak itu tidak divalidasi
terhadap schema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan hook pack yang didukung ketika tata letaknya cocok
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** mengirim file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error Plugin dan memblokir validasi konfigurasi.

Lihat panduan sistem Plugin lengkap: [Plugins](/id/tools/plugin).
Untuk model capability native dan panduan kompatibilitas eksternal saat ini:
[Model capability](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat
kode Plugin Anda**. Semua yang di bawah ini harus cukup murah untuk diperiksa tanpa mem-boot
runtime Plugin.

**Gunakan untuk:**

- identitas Plugin, validasi config, dan petunjuk UI config
- metadata auth, onboarding, dan setup (alias, auto-enable, env var provider, pilihan auth)
- petunjuk aktivasi untuk permukaan control-plane
- kepemilikan shorthand model-family
- snapshot kepemilikan capability statis (`contracts`)
- metadata runner QA yang dapat diperiksa oleh host bersama `openclaw qa`
- metadata config khusus channel yang digabungkan ke permukaan katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan code entrypoint,
atau metadata instalasi npm. Itu milik kode Plugin Anda dan `package.json`.

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

## Referensi field tingkat atas

| Field                                | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                                            |
| ------------------------------------ | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya       | `string`                         | ID Plugin kanonis. Ini adalah ID yang digunakan di `plugins.entries.<id>`.                                                                                                                                                         |
| `configSchema`                       | Ya       | `object`                         | JSON Schema inline untuk config Plugin ini.                                                                                                                                                                                        |
| `enabledByDefault`                   | Tidak    | `true`                           | Menandai Plugin bawaan sebagai aktif secara default. Hilangkan field ini, atau atur ke nilai apa pun selain `true`, agar Plugin tetap nonaktif secara default.                                                                  |
| `legacyPluginIds`                    | Tidak    | `string[]`                       | ID lama yang dinormalisasi ke ID Plugin kanonis ini.                                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Tidak    | `string[]`                       | ID provider yang sebaiknya mengaktifkan otomatis Plugin ini saat auth, config, atau referensi model menyebutkannya.                                                                                                              |
| `kind`                               | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                      |
| `channels`                           | Tidak    | `string[]`                       | ID channel yang dimiliki Plugin ini. Digunakan untuk discovery dan validasi config.                                                                                                                                                |
| `providers`                          | Tidak    | `string[]`                       | ID provider yang dimiliki Plugin ini.                                                                                                                                                                                               |
| `providerDiscoveryEntry`             | Tidak    | `string`                         | Path modul provider-discovery ringan, relatif terhadap root Plugin, untuk metadata katalog provider bercakupan manifest yang dapat dimuat tanpa mengaktifkan runtime Plugin penuh.                                               |
| `modelSupport`                       | Tidak    | `object`                         | Metadata shorthand model-family milik manifest yang digunakan untuk memuat otomatis Plugin sebelum runtime.                                                                                                                        |
| `modelCatalog`                       | Tidak    | `object`                         | Metadata katalog model deklaratif untuk provider yang dimiliki Plugin ini. Ini adalah kontrak control-plane untuk listing baca-saja, onboarding, pemilih model, alias, dan suppression di masa mendatang tanpa memuat runtime Plugin. |
| `providerEndpoints`                  | Tidak    | `object[]`                       | Metadata host/baseUrl endpoint milik manifest untuk rute provider yang harus diklasifikasikan core sebelum runtime provider dimuat.                                                                                               |
| `cliBackends`                        | Tidak    | `string[]`                       | ID backend inferensi CLI yang dimiliki Plugin ini. Digunakan untuk auto-aktivasi saat startup dari referensi config eksplisit.                                                                                                    |
| `syntheticAuthRefs`                  | Tidak    | `string[]`                       | Referensi provider atau backend CLI yang hook auth sintetis milik Plugin-nya sebaiknya di-probe selama discovery model cold sebelum runtime dimuat.                                                                              |
| `nonSecretAuthMarkers`               | Tidak    | `string[]`                       | Nilai placeholder API key milik Plugin bawaan yang mewakili status kredensial lokal, OAuth, atau ambient yang bukan secret.                                                                                                      |
| `commandAliases`                     | Tidak    | `object[]`                       | Nama perintah yang dimiliki Plugin ini yang sebaiknya menghasilkan config dan diagnostik CLI yang sadar Plugin sebelum runtime dimuat.                                                                                            |
| `providerAuthEnvVars`                | Tidak    | `Record<string, string[]>`       | Metadata env kompatibilitas deprecated untuk lookup auth/status provider. Gunakan `setup.providers[].envVars` untuk Plugin baru; OpenClaw masih membaca ini selama jendela deprecation.                                           |
| `providerAuthAliases`                | Tidak    | `Record<string, string>`         | ID provider yang sebaiknya menggunakan ulang ID provider lain untuk lookup auth, misalnya provider coding yang berbagi API key dan auth profile provider dasar.                                                                   |
| `channelEnvVars`                     | Tidak    | `Record<string, string[]>`       | Metadata env channel murah yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk penyiapan channel berbasis env atau permukaan auth yang sebaiknya terlihat oleh helper startup/config generik.               |
| `providerAuthChoices`                | Tidak    | `object[]`                       | Metadata pilihan auth murah untuk pemilih onboarding, resolusi preferred-provider, dan wiring flag CLI sederhana.                                                                                                                |
| `activation`                         | Tidak    | `object`                         | Metadata perencana aktivasi murah untuk pemuatan yang dipicu provider, perintah, channel, rute, dan capability. Hanya metadata; runtime Plugin tetap memiliki perilaku sebenarnya.                                                |
| `setup`                              | Tidak    | `object`                         | Descriptor setup/onboarding murah yang dapat diperiksa oleh permukaan discovery dan setup tanpa memuat runtime Plugin.                                                                                                           |
| `qaRunners`                          | Tidak    | `object[]`                       | Descriptor runner QA murah yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                          |
| `contracts`                          | Tidak    | `object`                         | Snapshot capability bawaan statis untuk hook auth eksternal, speech, transkripsi realtime, suara realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan kepemilikan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak    | `Record<string, object>`         | Default media-understanding murah untuk ID provider yang dideklarasikan dalam `contracts.mediaUnderstandingProviders`.                                                                                                            |
| `channelConfigs`                     | Tidak    | `Record<string, object>`         | Metadata config channel milik manifest yang digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                                                               |
| `skills`                             | Tidak    | `string[]`                       | Direktori skill yang akan dimuat, relatif terhadap root Plugin.                                                                                                                                                                    |
| `name`                               | Tidak    | `string`                         | Nama Plugin yang dapat dibaca manusia.                                                                                                                                                                                             |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan Plugin.                                                                                                                                                                            |
| `version`                            | Tidak    | `string`                         | Versi Plugin informasional.                                                                                                                                                                                                        |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field config.                                                                                                                                                               |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` mendeskripsikan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime provider dimuat.
Daftar setup provider menggunakan pilihan manifest ini, pilihan setup turunan descriptor,
dan metadata katalog instalasi tanpa memuat runtime provider.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | ID provider tempat pilihan ini berada.                                                                  |
| `method`              | Ya       | `string`                                        | ID metode auth yang akan didispatch.                                                                    |
| `choiceId`            | Ya       | `string`                                        | ID pilihan auth stabil yang digunakan oleh alur onboarding dan CLI.                                     |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang menghadap pengguna. Jika dihilangkan, OpenClaw fallback ke `choiceId`.                      |
| `choiceHint`          | Tidak    | `string`                                        | Teks helper singkat untuk pemilih.                                                                      |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif berbasis asisten.                |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.                |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | ID pilihan lama yang sebaiknya mengarahkan pengguna ke pilihan pengganti ini.                           |
| `groupId`             | Tidak    | `string`                                        | ID grup opsional untuk mengelompokkan pilihan terkait.                                                  |
| `groupLabel`          | Tidak    | `string`                                        | Label yang menghadap pengguna untuk grup tersebut.                                                      |
| `groupHint`           | Tidak    | `string`                                        | Teks helper singkat untuk grup.                                                                         |
| `optionKey`           | Tidak    | `string`                                        | Kunci opsi internal untuk alur auth sederhana dengan satu flag.                                         |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                          |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI penuh, seperti `--openrouter-api-key <key>`.                                            |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                             |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini sebaiknya muncul. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` ketika sebuah Plugin memiliki nama perintah runtime yang mungkin
secara keliru diletakkan pengguna di `plugins.allow` atau dicoba dijalankan sebagai perintah CLI root. OpenClaw
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

| Field        | Wajib    | Tipe              | Artinya                                                                  |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki Plugin ini.                                  |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.     |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.   |

## Referensi `activation`

Gunakan `activation` ketika Plugin dapat secara murah mendeklarasikan peristiwa control-plane mana
yang sebaiknya menyertakannya dalam rencana aktivasi/load.

Blok ini adalah metadata planner, bukan API siklus hidup. Blok ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode Plugin sudah dieksekusi. Planner aktivasi menggunakan field ini untuk
mempersempit kandidat Plugin sebelum fallback ke metadata kepemilikan manifest
yang ada seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook.

Pilih metadata tersempit yang sudah mendeskripsikan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, descriptor setup, atau `contracts`
ketika field tersebut mengekspresikan hubungan itu. Gunakan `activation` untuk petunjuk planner ekstra
yang tidak dapat direpresentasikan oleh field kepemilikan tersebut.
Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`,
`codex-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk
ID harness agen tertanam yang belum memiliki field kepemilikan.

Blok ini hanya metadata. Blok ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/Plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan Plugin yang lebih luas, jadi
metadata aktivasi yang hilang biasanya hanya berdampak pada performa; seharusnya tidak
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

| Field              | Wajib    | Tipe                                                 | Artinya                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | Tidak    | `string[]`                                           | ID provider yang sebaiknya menyertakan Plugin ini dalam rencana aktivasi/load.                                                               |
| `onAgentHarnesses` | Tidak    | `string[]`                                           | ID runtime harness agen tertanam yang sebaiknya menyertakan Plugin ini dalam rencana aktivasi/load. Gunakan `cliBackends` tingkat atas untuk alias backend CLI. |
| `onCommands`       | Tidak    | `string[]`                                           | ID perintah yang sebaiknya menyertakan Plugin ini dalam rencana aktivasi/load.                                                               |
| `onChannels`       | Tidak    | `string[]`                                           | ID channel yang sebaiknya menyertakan Plugin ini dalam rencana aktivasi/load.                                                                |
| `onRoutes`         | Tidak    | `string[]`                                           | Jenis rute yang sebaiknya menyertakan Plugin ini dalam rencana aktivasi/load.                                                                |
| `onCapabilities`   | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk capability luas yang digunakan oleh perencanaan aktivasi control-plane. Pilih field yang lebih sempit bila memungkinkan.           |

Konsumen live saat ini:

- perencanaan CLI yang dipicu perintah fallback ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan startup runtime agen menggunakan `activation.onAgentHarnesses` untuk
  harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI
- perencanaan setup/channel yang dipicu channel fallback ke kepemilikan `channels[]`
  lama ketika metadata aktivasi channel eksplisit tidak ada
- perencanaan setup/runtime yang dipicu provider fallback ke kepemilikan
  `providers[]` lama dan `cliBackends[]` tingkat atas ketika metadata aktivasi provider
  eksplisit tidak ada

Diagnostik planner dapat membedakan petunjuk aktivasi eksplisit dari fallback
kepemilikan manifest. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
planner menggunakan kepemilikan `commandAliases` sebagai gantinya. Label alasan ini untuk
diagnostik host dan test; penulis Plugin sebaiknya tetap mendeklarasikan metadata
yang paling tepat mendeskripsikan kepemilikan.

## Referensi `qaRunners`

Gunakan `qaRunners` ketika sebuah Plugin menyumbangkan satu atau lebih transport runner di bawah
root bersama `openclaw qa`. Pertahankan metadata ini murah dan statis; runtime Plugin
tetap memiliki pendaftaran CLI sebenarnya melalui permukaan
`runtime-api.ts` ringan yang mengekspor `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Jalankan lane QA Matrix live berbasis Docker terhadap homeserver sekali pakai"
    }
  ]
}
```

| Field         | Wajib    | Tipe     | Artinya                                                            |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Ya       | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`. |
| `description` | Tidak    | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

## Referensi `setup`

Gunakan `setup` ketika permukaan setup dan onboarding memerlukan metadata milik Plugin yang murah
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

`cliBackends` tingkat atas tetap valid dan terus mendeskripsikan backend inferensi CLI.
`setup.cliBackends` adalah permukaan descriptor khusus setup untuk
alur control-plane/setup yang sebaiknya tetap hanya metadata.

Jika ada, `setup.providers` dan `setup.cliBackends` adalah permukaan lookup
descriptor-first yang disukai untuk discovery setup. Jika descriptor hanya
mempersempit kandidat Plugin dan setup masih membutuhkan hook runtime saat setup yang lebih kaya, atur `requiresRuntime: true` dan pertahankan `setup-api` sebagai
jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam lookup auth provider generik dan env-var.
`providerAuthEnvVars` tetap didukung melalui adaptor kompatibilitas selama jendela
deprecation, tetapi Plugin non-bawaan yang masih menggunakannya
menerima diagnostik manifest. Plugin baru sebaiknya meletakkan metadata env setup/status
pada `setup.providers[].envVars`.

OpenClaw juga dapat menurunkan pilihan setup sederhana dari `setup.providers[].authMethods`
ketika tidak ada entri setup yang tersedia, atau ketika `setup.requiresRuntime: false`
mendeklarasikan runtime setup tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap lebih disukai untuk label kustom, flag CLI, cakupan onboarding, dan metadata asisten.

Atur `requiresRuntime: false` hanya ketika descriptor tersebut sudah cukup untuk
permukaan setup. OpenClaw memperlakukan `false` eksplisit sebagai kontrak hanya-descriptor
dan tidak akan mengeksekusi `setup-api` atau `openclaw.setupEntry` untuk lookup setup. Jika
sebuah Plugin yang hanya-descriptor masih mengirim salah satu entri runtime setup itu,
OpenClaw melaporkan diagnostik aditif dan terus mengabaikannya. Nilai
`requiresRuntime` yang dihilangkan mempertahankan perilaku fallback lama sehingga Plugin yang sudah ada dan menambahkan
descriptor tanpa flag tersebut tidak rusak.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik Plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang telah dinormalisasi harus tetap unik di seluruh Plugin
yang ditemukan. Kepemilikan ambigu gagal tertutup alih-alih memilih pemenang berdasarkan urutan discovery.

Saat runtime setup memang dieksekusi, diagnostik registry setup melaporkan
descriptor drift jika `setup-api` mendaftarkan provider atau backend CLI yang tidak dideklarasikan oleh descriptor manifest, atau jika descriptor tidak memiliki pendaftaran runtime yang cocok. Diagnostik ini bersifat aditif dan tidak menolak Plugin lama.

### Referensi `setup.providers`

| Field         | Wajib    | Tipe       | Artinya                                                                               |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Ya       | `string`   | ID provider yang diekspos selama setup atau onboarding. Pertahankan ID ternormalisasi tetap unik secara global. |
| `authMethods` | Tidak    | `string[]` | ID metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.          |
| `envVars`     | Tidak    | `string[]` | Env var yang dapat diperiksa oleh permukaan setup/status generik sebelum runtime Plugin dimuat. |

### Field `setup`

| Field              | Wajib    | Tipe       | Artinya                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | Tidak    | `object[]` | Descriptor setup provider yang diekspos selama setup dan onboarding.                          |
| `cliBackends`      | Tidak    | `string[]` | ID backend saat setup yang digunakan untuk lookup setup descriptor-first. Pertahankan ID ternormalisasi tetap unik secara global. |
| `configMigrations` | Tidak    | `string[]` | ID migrasi config yang dimiliki permukaan setup Plugin ini.                                   |
| `requiresRuntime`  | Tidak    | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup descriptor.                 |

## Referensi `uiHints`

`uiHints` adalah map dari nama field config ke petunjuk rendering kecil.

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

| Field         | Tipe       | Artinya                                 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Label field yang menghadap pengguna.    |
| `help`        | `string`   | Teks helper singkat.                    |
| `tags`        | `string[]` | Tag UI opsional.                        |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.        |
| `sensitive`   | `boolean`  | Menandai field sebagai secret atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input form.      |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan capability statis yang dapat
dibaca OpenClaw tanpa mengimpor runtime Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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

| Field                            | Tipe       | Artinya                                                                |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID extension factory app-server Codex, saat ini `codex-app-server`.    |
| `agentToolResultMiddleware`      | `string[]` | ID runtime yang dapat digunakan Plugin bawaan untuk mendaftarkan middleware hasil tool. |
| `externalAuthProviders`          | `string[]` | ID provider yang hook auth profile eksternal-nya dimiliki Plugin ini.  |
| `speechProviders`                | `string[]` | ID provider speech yang dimiliki Plugin ini.                           |
| `realtimeTranscriptionProviders` | `string[]` | ID provider transkripsi realtime yang dimiliki Plugin ini.             |
| `realtimeVoiceProviders`         | `string[]` | ID provider suara realtime yang dimiliki Plugin ini.                   |
| `memoryEmbeddingProviders`       | `string[]` | ID provider embedding memori yang dimiliki Plugin ini.                 |
| `mediaUnderstandingProviders`    | `string[]` | ID provider media-understanding yang dimiliki Plugin ini.              |
| `imageGenerationProviders`       | `string[]` | ID provider image-generation yang dimiliki Plugin ini.                 |
| `videoGenerationProviders`       | `string[]` | ID provider video-generation yang dimiliki Plugin ini.                 |
| `webFetchProviders`              | `string[]` | ID provider web-fetch yang dimiliki Plugin ini.                        |
| `webSearchProviders`             | `string[]` | ID provider web search yang dimiliki Plugin ini.                       |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki Plugin ini untuk pemeriksaan kontrak bawaan. |

`contracts.embeddedExtensionFactories` dipertahankan untuk extension factory
khusus app-server Codex bawaan. Transform hasil tool bawaan sebaiknya
mendeklarasikan `contracts.agentToolResultMiddleware` dan mendaftar dengan
`api.registerAgentToolResultMiddleware(...)` sebagai gantinya. Plugin eksternal tidak dapat
mendaftarkan middleware hasil tool karena seam ini dapat menulis ulang output tool dengan trust tinggi
sebelum model melihatnya.

Plugin provider yang mengimplementasikan `resolveExternalAuthProfiles` sebaiknya mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi tersebut tetap berjalan
melalui fallback kompatibilitas deprecated, tetapi fallback itu lebih lambat dan
akan dihapus setelah jendela migrasi.

Provider embedding memori bawaan sebaiknya mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap ID adaptor yang mereka ekspos, termasuk
adaptor bawaan seperti `local`. Jalur CLI mandiri menggunakan kontrak manifest ini
untuk memuat hanya Plugin pemilik sebelum runtime Gateway penuh
mendaftarkan provider.

## Referensi `mediaUnderstandingProviderMetadata`

Gunakan `mediaUnderstandingProviderMetadata` ketika sebuah provider media-understanding memiliki
model default, prioritas fallback auto-auth, atau dukungan dokumen native yang
dibutuhkan helper core generik sebelum runtime dimuat. Key juga harus dideklarasikan di
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capability media yang diekspos provider ini.                                |
| `defaultModels`        | `Record<string, string>`            | Default capability-ke-model yang digunakan saat config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka yang lebih rendah diurutkan lebih awal untuk fallback provider otomatis berbasis kredensial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung provider.                                |

## Referensi `channelConfigs`

Gunakan `channelConfigs` ketika sebuah Plugin channel memerlukan metadata config murah sebelum
runtime dimuat. Discovery setup/status channel baca-saja dapat menggunakan metadata ini
secara langsung untuk channel eksternal yang dikonfigurasi ketika tidak ada entri setup yang tersedia, atau
ketika `setup.requiresRuntime: false` menyatakan bahwa runtime setup tidak diperlukan.

`channelConfigs` adalah metadata manifest Plugin, bukan bagian config pengguna tingkat atas yang baru.
Pengguna tetap mengonfigurasi instance channel di bawah `channels.<channel-id>`.
OpenClaw membaca metadata manifest untuk memutuskan Plugin mana yang memiliki
channel terkonfigurasi tersebut sebelum kode runtime Plugin dieksekusi.

Untuk Plugin channel, `configSchema` dan `channelConfigs` mendeskripsikan path yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin non-bawaan yang mendeklarasikan `channels[]` juga sebaiknya mendeklarasikan entri
`channelConfigs` yang cocok. Tanpa itu, OpenClaw tetap dapat memuat Plugin, tetapi permukaan
schema config cold-path, setup, dan Control UI tidak dapat mengetahui bentuk opsi milik
channel sampai runtime Plugin dieksekusi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan
`nativeSkillsAutoEnabled` dapat mendeklarasikan default statis `auto` untuk pemeriksaan config perintah yang berjalan sebelum runtime channel dimuat. Channel bawaan juga dapat memublikasikan default yang sama melalui
`package.json#openclaw.channel.commands` bersama metadata katalog channel milik paket lainnya.

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
          "label": "URL homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Koneksi homeserver Matrix",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Setiap entri channel dapat mencakup:

| Field         | Tipe                     | Artinya                                                                              |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian config channel tersebut. |
| `label`       | `string`                 | Label channel yang digabungkan ke permukaan picker dan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk permukaan inspect dan katalog.                       |
| `commands`    | `object`                 | Default otomatis perintah native dan skill native statis untuk pemeriksaan config pra-runtime. |
| `preferOver`  | `string[]`               | ID Plugin lama atau berprioritas lebih rendah yang sebaiknya dikalahkan channel ini di permukaan pemilihan.

### Menggantikan Plugin channel lain

Gunakan `preferOver` ketika Plugin Anda adalah pemilik yang diprioritaskan untuk sebuah ID channel yang
juga dapat disediakan oleh Plugin lain. Kasus umum adalah ID Plugin yang diubah namanya,
Plugin mandiri yang menggantikan Plugin bawaan, atau fork yang dipelihara dan
tetap memakai ID channel yang sama untuk kompatibilitas config.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Ketika `channels.chat` dikonfigurasi, OpenClaw mempertimbangkan ID channel dan
ID Plugin yang diprioritaskan. Jika Plugin dengan prioritas lebih rendah hanya dipilih karena
bersifat bawaan atau aktif secara default, OpenClaw menonaktifkannya dalam config runtime efektif agar satu Plugin memiliki channel dan tool-nya. Pilihan pengguna yang eksplisit tetap menang: jika pengguna secara eksplisit mengaktifkan kedua Plugin, OpenClaw
mempertahankan pilihan itu dan melaporkan diagnostik channel/tool duplikat alih-alih
diam-diam mengubah set Plugin yang diminta.

Pertahankan `preferOver` hanya untuk ID Plugin yang benar-benar dapat menyediakan channel yang sama.
Ini bukan field prioritas umum dan tidak mengganti nama key config pengguna.

## Referensi `modelSupport`

Gunakan `modelSupport` ketika OpenClaw sebaiknya menyimpulkan Plugin provider Anda dari
ID model shorthand seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum runtime Plugin
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

- referensi `provider/model` eksplisit menggunakan metadata manifest `providers` milik pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu Plugin non-bawaan dan satu Plugin bawaan sama-sama cocok, Plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau config menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefix yang dicocokkan dengan `startsWith` terhadap ID model shorthand.   |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap ID model shorthand setelah suffix profile dihapus. |

## Referensi `modelCatalog`

Gunakan `modelCatalog` ketika OpenClaw sebaiknya mengetahui metadata model provider sebelum
memuat runtime Plugin. Ini adalah sumber milik manifest untuk baris katalog tetap,
alias provider, aturan suppression, dan mode discovery. Penyegaran runtime
tetap menjadi milik kode runtime provider, tetapi manifest memberi tahu core kapan runtime
diperlukan.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "tidak tersedia di Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Field tingkat atas:

| Field          | Tipe                                                     | Artinya                                                                                                 |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Baris katalog untuk ID provider yang dimiliki Plugin ini. Key juga sebaiknya muncul di `providers` tingkat atas. |
| `aliases`      | `Record<string, object>`                                 | Alias provider yang sebaiknya di-resolve ke provider milik sendiri untuk perencanaan katalog atau suppression. |
| `suppressions` | `object[]`                                               | Baris model dari sumber lain yang disuppresi Plugin ini karena alasan spesifik provider.                |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog provider dapat dibaca dari metadata manifest, disegarkan ke cache, atau memerlukan runtime. |

Field provider:

| Field     | Tipe                     | Artinya                                                        |
| --------- | ------------------------ | -------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL default opsional untuk model dalam katalog provider ini. |
| `api`     | `ModelApi`               | Adaptor API default opsional untuk model dalam katalog provider ini. |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog provider ini. |
| `models`  | `object[]`               | Baris model yang wajib. Baris tanpa `id` diabaikan.            |

Field model:

| Field           | Tipe                                                           | Artinya                                                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID model lokal-provider, tanpa prefix `provider/`.                           |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                      |
| `api`           | `ModelApi`                                                     | Override API per-model opsional.                                             |
| `baseUrl`       | `string`                                                       | Override base URL per-model opsional.                                        |
| `headers`       | `Record<string, string>`                                       | Header statis per-model opsional.                                            |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitas yang diterima model.                                               |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku reasoning.                                  |
| `contextWindow` | `number`                                                       | Jendela konteks provider native.                                             |
| `contextTokens` | `number`                                                       | Batas konteks runtime efektif opsional bila berbeda dari `contextWindow`.    |
| `maxTokens`     | `number`                                                       | Token output maksimum bila diketahui.                                        |
| `cost`          | `object`                                                       | Harga opsional USD per sejuta token, termasuk `tieredPricing` opsional.      |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas config model OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listing. Lakukan suppress hanya ketika baris sama sekali tidak boleh muncul. |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan bersama status tidak-tersedia.              |
| `replaces`      | `string[]`                                                     | ID model lokal-provider lama yang digantikan model ini.                      |
| `replacedBy`    | `string`                                                       | ID model lokal-provider pengganti untuk baris deprecated.                    |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh picker dan filter.                            |

Jangan letakkan data yang hanya untuk runtime di `modelCatalog`. Jika sebuah provider membutuhkan
status akun, permintaan API, atau discovery proses lokal untuk mengetahui set model lengkap,
deklarasikan provider itu sebagai `refreshable` atau `runtime` di `discovery`.

### OpenClaw Provider Index

OpenClaw Provider Index adalah metadata pratinjau milik OpenClaw untuk provider
yang Plugin-nya mungkin belum terpasang. Ini bukan bagian dari manifest Plugin.
Manifest Plugin tetap menjadi otoritas Plugin terpasang. Provider Index adalah
kontrak fallback internal yang akan digunakan oleh permukaan provider yang dapat dipasang dan pemilih model pra-instal di masa depan saat Plugin provider belum terpasang.

Urutan otoritas katalog:

1. Config pengguna.
2. `modelCatalog` manifest Plugin yang terpasang.
3. Cache katalog model dari refresh eksplisit.
4. Baris pratinjau OpenClaw Provider Index.

Provider Index tidak boleh berisi secret, status aktif, hook runtime, atau data model live spesifik akun. Katalog pratinjau menggunakan bentuk baris provider
`modelCatalog` yang sama seperti manifest Plugin, tetapi sebaiknya tetap dibatasi
pada metadata tampilan stabil kecuali field adaptor runtime seperti `api`,
`baseUrl`, pricing, atau flag kompatibilitas sengaja dijaga tetap selaras dengan
manifest Plugin yang terpasang. Provider dengan discovery `/models` live sebaiknya
menulis baris yang disegarkan melalui jalur cache katalog model eksplisit alih-alih
membuat listing normal atau onboarding memanggil API provider.

Entri Provider Index juga dapat membawa metadata Plugin yang dapat dipasang untuk provider
yang Plugin-nya telah dipindahkan keluar dari core atau belum terpasang. Metadata ini
mencerminkan pola katalog channel: nama paket, spec instalasi npm,
integritas yang diharapkan, dan label pilihan auth yang murah sudah cukup untuk menampilkan
opsi setup yang dapat dipasang. Setelah Plugin dipasang, manifest-nya menang dan
entri Provider Index diabaikan untuk provider tersebut.

Key capability tingkat atas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field tingkat atas tersebut sebagai kepemilikan
capability.

## Manifest versus `package.json`

Kedua file ini memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Discovery, validasi config, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode Plugin berjalan                      |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, install gating, setup, atau metadata katalog |

Jika Anda ragu di mana sebuah metadata sebaiknya diletakkan, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode Plugin, letakkan di `openclaw.plugin.json`
- jika metadata itu tentang packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field `package.json` yang memengaruhi discovery

Beberapa metadata Plugin pra-runtime sengaja berada di `package.json` di bawah blok
`openclaw` alih-alih di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint Plugin native. Harus tetap berada di dalam direktori paket Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript yang telah dibangun untuk paket yang terpasang. Harus tetap berada di dalam direktori paket Plugin.                                 |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding, startup channel tertunda, dan discovery channel status/SecretRef baca-saja. Harus tetap berada di dalam direktori paket Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint setup JavaScript yang telah dibangun untuk paket yang terpasang. Harus tetap berada di dalam direktori paket Plugin.                                   |
| `openclaw.channel`                                                | Metadata katalog channel murah seperti label, path docs, alias, dan salinan pemilihan.                                                                                             |
| `openclaw.channel.commands`                                       | Metadata default otomatis perintah native dan skill native statis yang digunakan oleh permukaan config, audit, dan daftar perintah sebelum runtime channel dimuat.                 |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah penyiapan hanya-env sudah ada?" tanpa memuat runtime channel penuh.                                         |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa auth yang dipersistenkan dan ringan yang dapat menjawab "apakah sudah ada yang login?" tanpa memuat runtime channel penuh.                                      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk install/update untuk Plugin bawaan dan Plugin yang dipublikasikan secara eksternal.                                                                                       |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang disukai saat beberapa sumber instalasi tersedia.                                                                                                               |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                                                                   |
| `openclaw.install.expectedIntegrity`                              | String integritas dist npm yang diharapkan seperti `sha512-...`; alur install dan update memverifikasi artefak yang diambil terhadap nilai ini.                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstall Plugin bawaan yang sempit saat config tidak valid.                                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus setup dimuat sebelum Plugin channel penuh saat startup.                                                                                       |

Metadata manifest menentukan pilihan provider/channel/setup mana yang muncul di
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan Plugin tersebut saat pengguna memilih salah satu
pilihan itu. Jangan pindahkan petunjuk instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama install dan pemuatan
registry manifest. Nilai yang tidak valid ditolak; nilai yang valid tetapi lebih baru
melewati Plugin pada host yang lebih lama.

Pinning versi npm eksak sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
sebaiknya memasangkan spec eksak dengan `expectedIntegrity` agar alur update gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang dipin.
Onboarding interaktif tetap menawarkan spec npm registry tepercaya, termasuk nama
paket polos dan dist-tag, untuk kompatibilitas. Diagnostik katalog dapat
membedakan sumber yang eksak, mengambang, dipin integritas, tanpa integritas,
mismatch nama paket, dan default-choice tidak valid. Diagnostik juga memperingatkan ketika
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat dipin.
Ketika `expectedIntegrity` ada,
alur install/update menegakkannya; ketika dihilangkan, resolusi registry
dicatat tanpa pin integritas.

Plugin channel sebaiknya menyediakan `openclaw.setupEntry` ketika status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang telah dikonfigurasi tanpa memuat
runtime penuh. Entri setup sebaiknya mengekspos metadata channel plus adaptor config, status, dan secret yang aman untuk setup; pertahankan klien jaringan, listener gateway, dan
runtime transport di entrypoint extension utama.

Field entrypoint runtime tidak menimpa pemeriksaan batas paket untuk source
field entrypoint. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
path `openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibatasi secara sempit. Ini
tidak membuat config rusak arbitrer menjadi dapat dipasang. Saat ini field ini hanya memungkinkan alur install pulih dari kegagalan upgrade Plugin bawaan yang basi tertentu, seperti
path Plugin bawaan yang hilang atau entri `channels.<id>` basi untuk Plugin
bawaan yang sama itu. Error config lain yang tidak terkait tetap memblokir install dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata paket untuk modul pemeriksa kecil:

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

Gunakan saat setup, doctor, atau alur configured-state memerlukan probe auth ya/tidak yang murah
sebelum Plugin channel penuh dimuat. Ekspor target sebaiknya berupa fungsi kecil
yang hanya membaca status yang dipersistenkan; jangan rutekan melalui barrel runtime
channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan
configured-state yang murah dan hanya-env:

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

Gunakan saat sebuah channel dapat menjawab configured-state dari env atau input kecil non-runtime lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime
channel yang sebenarnya, pertahankan logika itu di hook Plugin `config.hasConfiguredState`.

## Prioritas discovery (ID Plugin duplikat)

OpenClaw menemukan Plugin dari beberapa root (bawaan, instalasi global, workspace, path yang dipilih secara eksplisit oleh config). Jika dua hasil discovery berbagi `id` yang sama, hanya manifest dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih config** — path yang dipin secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — Plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — Plugin yang dipasang ke root Plugin OpenClaw global
4. **Workspace** — Plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Fork atau salinan basi dari Plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar menimpa Plugin bawaan dengan Plugin lokal, pin melalui `plugins.entries.<id>` agar menang berdasarkan prioritas alih-alih mengandalkan discovery workspace.
- Penghapusan duplikat dicatat di log sehingga diagnostik Doctor dan startup dapat menunjuk ke salinan yang dibuang.

## Persyaratan JSON Schema

- **Setiap Plugin harus mengirim JSON Schema**, bahkan jika tidak menerima config.
- Schema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Schema divalidasi saat baca/tulis config, bukan saat runtime.

## Perilaku validasi

- Key `channels.*` yang tidak dikenal adalah **error**, kecuali ID channel tersebut dideklarasikan oleh
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk ke ID Plugin yang **dapat ditemukan**. ID yang tidak dikenal adalah **error**.
- Jika Plugin terpasang tetapi memiliki manifest atau schema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error Plugin.
- Jika config Plugin ada tetapi Plugin **dinonaktifkan**, config tetap dipertahankan dan
  sebuah **peringatan** ditampilkan di Doctor + log.

Lihat [Configuration reference](/id/gateway/configuration) untuk schema `plugins.*` lengkap.

## Catatan

- Manifest **wajib untuk Plugin OpenClaw native**, termasuk pemuatan dari filesystem lokal. Runtime tetap memuat modul Plugin secara terpisah; manifest hanya untuk discovery + validasi.
- Manifest native di-parse dengan JSON5, sehingga komentar, trailing comma, dan key tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya field manifest yang terdokumentasi yang dibaca oleh loader manifest. Hindari key tingkat atas kustom.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan ketika Plugin tidak membutuhkannya.
- `providerDiscoveryEntry` harus tetap ringan dan sebaiknya tidak mengimpor kode runtime yang luas; gunakan untuk metadata katalog provider statis atau descriptor discovery yang sempit, bukan eksekusi saat request.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Metadata env-var (`setup.providers[].envVars`, `providerAuthEnvVars` yang deprecated, dan `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman Cron, dan permukaan baca-saja lainnya tetap menerapkan trust Plugin dan kebijakan aktivasi efektif sebelum memperlakukan env var sebagai sudah dikonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode provider, lihat [Provider runtime hooks](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist package-manager apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Building plugins" href="/id/plugins/building-plugins" icon="rocket">
    Memulai dengan Plugin.
  </Card>
  <Card title="Plugin architecture" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model capability.
  </Card>
  <Card title="SDK overview" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK Plugin dan import subpath.
  </Card>
</CardGroup>
