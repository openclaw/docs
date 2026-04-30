---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu menyertakan skema konfigurasi Plugin atau men-debug kesalahan validasi Plugin
summary: Manifes Plugin + persyaratan skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-04-30T10:01:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini hanya untuk **manifest Plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Bundle Plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude default
  tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga otomatis mendeteksi tata letak bundle tersebut, tetapi tata letak itu tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle beserta root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan paket hook yang didukung ketika tata letaknya sesuai
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
kesalahan Plugin dan memblokir validasi konfigurasi.

Lihat panduan lengkap sistem Plugin: [Plugins](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat
kode Plugin Anda**. Semua hal di bawah ini harus cukup ringan untuk diperiksa tanpa menjalankan
runtime Plugin.

**Gunakan untuk:**

- identitas Plugin, validasi konfigurasi, dan petunjuk UI konfigurasi
- metadata auth, onboarding, dan penyiapan (alias, aktif otomatis, env var penyedia, pilihan auth)
- petunjuk aktivasi untuk permukaan control-plane
- kepemilikan keluarga model singkat
- snapshot kepemilikan kapabilitas statis (`contracts`)
- metadata runner QA yang dapat diperiksa host `openclaw qa` bersama
- metadata konfigurasi khusus channel yang digabungkan ke permukaan katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan entrypoint kode,
atau metadata instalasi npm. Itu berada di kode Plugin Anda dan `package.json`.

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
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
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

| Bidang                               | Wajib | Tipe                             | Artinya                                                                                                                                                                                                                          |
| ------------------------------------ | ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya    | `string`                         | Id Plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                                       |
| `configSchema`                       | Ya    | `object`                         | JSON Schema inline untuk konfigurasi Plugin ini.                                                                                                                                                                                 |
| `enabledByDefault`                   | Tidak | `true`                           | Menandai Plugin bawaan sebagai diaktifkan secara default. Hilangkan, atau tetapkan nilai non-`true` apa pun, agar Plugin tetap dinonaktifkan secara default.                                                                     |
| `legacyPluginIds`                    | Tidak | `string[]`                       | Id lama yang dinormalisasi ke id Plugin kanonis ini.                                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | Tidak | `string[]`                       | Id provider yang harus mengaktifkan Plugin ini secara otomatis saat autentikasi, konfigurasi, atau ref model menyebutkannya.                                                                                                     |
| `kind`                               | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                    |
| `channels`                           | Tidak | `string[]`                       | Id channel yang dimiliki Plugin ini. Digunakan untuk penemuan dan validasi konfigurasi.                                                                                                                                          |
| `providers`                          | Tidak | `string[]`                       | Id provider yang dimiliki Plugin ini.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Tidak | `string`                         | Path modul penemuan provider ringan, relatif terhadap root Plugin, untuk metadata katalog provider berskala manifes yang dapat dimuat tanpa mengaktifkan runtime penuh Plugin.                                                   |
| `modelSupport`                       | Tidak | `object`                         | Metadata keluarga model singkat milik manifes yang digunakan untuk memuat Plugin secara otomatis sebelum runtime.                                                                                                                |
| `modelCatalog`                       | Tidak | `object`                         | Metadata katalog model deklaratif untuk provider yang dimiliki Plugin ini. Ini adalah kontrak control-plane untuk listing hanya-baca, onboarding, pemilih model, alias, dan supresi di masa depan tanpa memuat runtime Plugin.   |
| `modelPricing`                       | Tidak | `object`                         | Kebijakan lookup harga eksternal milik provider. Gunakan untuk mengecualikan provider lokal/self-hosted dari katalog harga jarak jauh atau memetakan ref provider ke id katalog OpenRouter/LiteLLM tanpa hardcoding id provider di core. |
| `modelIdNormalization`               | Tidak | `object`                         | Pembersihan alias/prefiks id model milik provider yang harus berjalan sebelum runtime provider dimuat.                                                                                                                           |
| `providerEndpoints`                  | Tidak | `object[]`                       | Metadata host/baseUrl endpoint milik manifes untuk route provider yang harus diklasifikasikan core sebelum runtime provider dimuat.                                                                                              |
| `providerRequest`                    | Tidak | `object`                         | Metadata ringan keluarga provider dan kompatibilitas permintaan yang digunakan oleh kebijakan permintaan generik sebelum runtime provider dimuat.                                                                                 |
| `cliBackends`                        | Tidak | `string[]`                       | Id backend inferensi CLI yang dimiliki Plugin ini. Digunakan untuk aktivasi otomatis saat startup dari ref konfigurasi eksplisit.                                                                                                 |
| `syntheticAuthRefs`                  | Tidak | `string[]`                       | Ref provider atau backend CLI yang hook autentikasi sintetis milik Plugin-nya harus diperiksa selama penemuan model dingin sebelum runtime dimuat.                                                                                |
| `nonSecretAuthMarkers`               | Tidak | `string[]`                       | Nilai placeholder API key milik Plugin bawaan yang merepresentasikan status kredensial lokal, OAuth, atau ambient yang bukan rahasia.                                                                                            |
| `commandAliases`                     | Tidak | `object[]`                       | Nama perintah yang dimiliki Plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI yang sadar Plugin sebelum runtime dimuat.                                                                                           |
| `providerAuthEnvVars`                | Tidak | `Record<string, string[]>`       | Metadata env kompatibilitas yang sudah tidak digunakan untuk lookup autentikasi/status provider. Untuk Plugin baru, lebih pilih `setup.providers[].envVars`; OpenClaw masih membacanya selama jendela deprekasi.                 |
| `providerAuthAliases`                | Tidak | `Record<string, string>`         | Id provider yang harus menggunakan ulang id provider lain untuk lookup autentikasi, misalnya provider coding yang berbagi API key dan profil autentikasi provider dasar.                                                         |
| `channelEnvVars`                     | Tidak | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk penyiapan channel berbasis env atau permukaan autentikasi yang harus terlihat oleh helper startup/konfigurasi generik.      |
| `providerAuthChoices`                | Tidak | `object[]`                       | Metadata pilihan autentikasi ringan untuk pemilih onboarding, resolusi provider pilihan, dan wiring flag CLI sederhana.                                                                                                          |
| `activation`                         | Tidak | `object`                         | Metadata perencana aktivasi ringan untuk pemuatan yang dipicu startup, provider, perintah, channel, route, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku aktual.                                      |
| `setup`                              | Tidak | `object`                         | Deskriptor penyiapan/onboarding ringan yang dapat diperiksa permukaan penemuan dan penyiapan tanpa memuat runtime Plugin.                                                                                                       |
| `qaRunners`                          | Tidak | `object[]`                       | Deskriptor runner QA ringan yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                        |
| `contracts`                          | Tidak | `object`                         | Snapshot kapabilitas bawaan statis untuk hook autentikasi eksternal, speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, web-fetch, pencarian web, dan kepemilikan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak | `Record<string, object>`         | Default pemahaman media ringan untuk id provider yang dideklarasikan di `contracts.mediaUnderstandingProviders`.                                                                                                                 |
| `channelConfigs`                     | Tidak | `Record<string, object>`         | Metadata konfigurasi channel milik manifes yang digabungkan ke permukaan penemuan dan validasi sebelum runtime dimuat.                                                                                                           |
| `skills`                             | Tidak | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root Plugin.                                                                                                                                                                 |
| `name`                               | Tidak | `string`                         | Nama Plugin yang dapat dibaca manusia.                                                                                                                                                                                           |
| `description`                        | Tidak | `string`                         | Ringkasan singkat yang ditampilkan di permukaan Plugin.                                                                                                                                                                          |
| `version`                            | Tidak | `string`                         | Versi Plugin informasional.                                                                                                                                                                                                      |
| `uiHints`                            | Tidak | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk bidang konfigurasi.                                                                                                                                                       |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau autentikasi.
OpenClaw membaca ini sebelum runtime provider dimuat.
Daftar penyiapan provider menggunakan pilihan manifes ini, pilihan penyiapan yang diturunkan dari deskriptor,
dan metadata katalog instalasi tanpa memuat runtime provider.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | ID penyedia tempat pilihan ini berada.                                                                   |
| `method`              | Ya       | `string`                                        | ID metode autentikasi untuk diarahkan.                                                                   |
| `choiceId`            | Ya       | `string`                                        | ID pilihan autentikasi stabil yang digunakan oleh alur orientasi awal dan CLI.                           |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw kembali menggunakan `choiceId`.            |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                      |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan asisten.           |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.                  |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | ID pilihan lama yang harus mengalihkan pengguna ke pilihan pengganti ini.                                |
| `groupId`             | Tidak    | `string`                                        | ID grup opsional untuk mengelompokkan pilihan terkait.                                                   |
| `groupLabel`          | Tidak    | `string`                                        | Label yang terlihat oleh pengguna untuk grup tersebut.                                                   |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup.                                                                         |
| `optionKey`           | Tidak    | `string`                                        | Kunci opsi internal untuk alur autentikasi satu-flag sederhana.                                          |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                           |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                              |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Permukaan orientasi awal tempat pilihan ini harus muncul. Jika dihilangkan, default-nya adalah `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` saat Plugin memiliki nama perintah runtime yang mungkin
keliru dimasukkan pengguna ke dalam `plugins.allow` atau dicoba dijalankan sebagai perintah CLI root. OpenClaw
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

| Field        | Required | Type              | What it means                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki Plugin ini.                                 |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.    |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait untuk disarankan bagi operasi CLI, jika ada.  |

## Referensi activation

Gunakan `activation` saat Plugin dapat mendeklarasikan dengan murah peristiwa control-plane mana
yang harus menyertakannya dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata perencana, bukan API siklus hidup. Ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode Plugin telah dijalankan. Perencana aktivasi menggunakan field ini untuk
mempersempit kandidat Plugin sebelum kembali ke metadata kepemilikan manifes yang ada
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook.

Pilih metadata tersempit yang sudah mendeskripsikan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
saat field tersebut mengekspresikan relasinya. Gunakan `activation` untuk petunjuk
perencana tambahan yang tidak dapat direpresentasikan oleh field kepemilikan tersebut.
Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`,
`codex-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk
ID harness agen tertanam yang belum memiliki field kepemilikan.

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau titik masuk runtime/Plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan Plugin yang lebih luas, sehingga
metadata aktivasi yang hilang biasanya hanya berdampak pada performa; ini tidak boleh
mengubah kebenaran selama fallback kepemilikan manifes lama masih ada.

Setiap Plugin harus menetapkan `activation.onStartup` secara sengaja saat OpenClaw bergerak
menjauh dari impor startup implisit. Tetapkan ke `true` hanya saat Plugin harus
berjalan selama startup Gateway. Tetapkan ke `false` saat Plugin tidak aktif saat
startup dan hanya boleh dimuat dari pemicu yang lebih sempit. Menghilangkan `onStartup` mempertahankan
fallback sidecar startup implisit lama yang sudah deprecated untuk Plugin tanpa
metadata kapabilitas statis; versi mendatang mungkin berhenti memuat Plugin tersebut saat startup
kecuali mereka mendeklarasikan `activation.onStartup: true`. Status Plugin dan
laporan kompatibilitas memperingatkan dengan `legacy-implicit-startup-sidecar` saat sebuah Plugin
masih bergantung pada fallback tersebut.

Untuk pengujian migrasi, tetapkan
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` untuk menonaktifkan hanya
fallback deprecated tersebut. Mode opt-in ini tidak memblokir Plugin eksplisit
`activation.onStartup: true` atau Plugin yang dimuat oleh channel, konfigurasi,
agent-harness, memori, atau pemicu aktivasi lain yang lebih sempit.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Field              | Required | Type                                                 | What it means                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Tidak    | `boolean`                                            | Aktivasi startup Gateway eksplisit. Setiap Plugin harus menetapkan ini. `true` mengimpor Plugin selama startup; `false` memilih keluar dari fallback startup sidecar implisit deprecated kecuali pemicu lain yang cocok memerlukan pemuatan. |
| `onProviders`      | Tidak    | `string[]`                                           | ID penyedia yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                                                     |
| `onAgentHarnesses` | Tidak    | `string[]`                                           | ID runtime harness agen tertanam yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                                                                    |
| `onCommands`       | Tidak    | `string[]`                                           | ID perintah yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                                                     |
| `onChannels`       | Tidak    | `string[]`                                           | ID channel yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                                                      |
| `onRoutes`         | Tidak    | `string[]`                                           | Jenis route yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                                                     |
| `onConfigPaths`    | Tidak    | `string[]`                                           | Jalur konfigurasi relatif-root yang harus menyertakan Plugin ini dalam rencana startup/pemuatan saat jalur tersebut ada dan tidak dinonaktifkan secara eksplisit.                                                                  |
| `onCapabilities`   | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan aktivasi control-plane. Pilih field yang lebih sempit jika memungkinkan.                                                                                                  |

Konsumen live saat ini:

- Perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit dan opt-out dari fallback startup sidecar implisit deprecated
- perencanaan CLI yang dipicu perintah kembali ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan startup runtime agen menggunakan `activation.onAgentHarnesses` untuk
  harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI
- perencanaan setup/channel yang dipicu channel kembali ke kepemilikan
  `channels[]` lama saat metadata aktivasi channel eksplisit tidak ada
- perencanaan Plugin startup menggunakan `activation.onConfigPaths` untuk permukaan konfigurasi
  root non-channel seperti blok `browser` milik Plugin browser bawaan
- perencanaan setup/runtime yang dipicu penyedia kembali ke kepemilikan
  `providers[]` lama dan `cliBackends[]` tingkat atas saat metadata aktivasi penyedia
  eksplisit tidak ada

Diagnostik perencana dapat membedakan petunjuk aktivasi eksplisit dari fallback
kepemilikan manifes. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
perencana menggunakan kepemilikan `commandAliases`. Label alasan ini ditujukan untuk
diagnostik host dan pengujian; penulis Plugin harus tetap mendeklarasikan metadata
yang paling baik mendeskripsikan kepemilikan.

## Referensi qaRunners

Gunakan `qaRunners` saat Plugin menyumbangkan satu atau beberapa runner transport di bawah
root `openclaw qa` bersama. Jaga metadata ini murah dan statis; runtime Plugin
tetap memiliki pendaftaran CLI aktual melalui permukaan ringan
`runtime-api.ts` yang mengekspor `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Bidang        | Wajib | Tipe     | Artinya                                                            |
| ------------- | ----- | -------- | ------------------------------------------------------------------ |
| `commandName` | Ya    | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`. |
| `description` | Tidak | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

## Referensi setup

Gunakan `setup` saat permukaan penyiapan dan onboarding memerlukan metadata murah milik Plugin
sebelum runtime dimuat.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` tingkat atas tetap valid dan terus menjelaskan backend inferensi CLI.
`setup.cliBackends` adalah permukaan deskriptor khusus penyiapan untuk
alur control-plane/penyiapan yang harus tetap hanya berupa metadata.

Jika ada, `setup.providers` dan `setup.cliBackends` adalah permukaan pencarian
berbasis deskriptor yang diprioritaskan untuk penemuan penyiapan. Jika deskriptor hanya
mempersempit kandidat Plugin dan penyiapan masih memerlukan hook runtime waktu penyiapan
yang lebih kaya, tetapkan `requiresRuntime: true` dan pertahankan `setup-api` sebagai
jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam autentikasi penyedia generik dan
pencarian env-var. `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas
selama jendela depresiasi, tetapi Plugin non-bundel yang masih menggunakannya
menerima diagnostik manifes. Plugin baru harus meletakkan metadata env penyiapan/status
pada `setup.providers[].envVars`.

OpenClaw juga dapat menurunkan pilihan penyiapan sederhana dari `setup.providers[].authMethods`
saat tidak ada entri penyiapan, atau saat `setup.requiresRuntime: false`
menyatakan runtime penyiapan tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap
diprioritaskan untuk label kustom, flag CLI, cakupan onboarding, dan metadata asisten.

Tetapkan `requiresRuntime: false` hanya saat deskriptor tersebut cukup untuk
permukaan penyiapan. OpenClaw memperlakukan `false` eksplisit sebagai kontrak hanya deskriptor
dan tidak akan menjalankan `setup-api` atau `openclaw.setupEntry` untuk pencarian penyiapan. Jika
Plugin hanya deskriptor masih mengirimkan salah satu entri runtime penyiapan tersebut,
OpenClaw melaporkan diagnostik aditif dan tetap mengabaikannya. `requiresRuntime`
yang tidak disertakan mempertahankan perilaku fallback lama agar Plugin yang sudah ada yang menambahkan
deskriptor tanpa flag tersebut tidak rusak.

Karena pencarian penyiapan dapat menjalankan kode `setup-api` milik Plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
Plugin yang ditemukan. Kepemilikan ambigu gagal tertutup alih-alih memilih
pemenang dari urutan penemuan.

Saat runtime penyiapan benar-benar dijalankan, diagnostik registry penyiapan melaporkan drift
deskriptor jika `setup-api` mendaftarkan penyedia atau backend CLI yang tidak dinyatakan
oleh deskriptor manifes, atau jika deskriptor tidak memiliki registrasi runtime
yang cocok. Diagnostik ini bersifat aditif dan tidak menolak Plugin lama.

### Referensi setup.providers

| Bidang         | Wajib | Tipe       | Artinya                                                                                          |
| -------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ya    | `string`   | Id penyedia yang diekspos selama penyiapan atau onboarding. Jaga agar id yang dinormalisasi unik secara global. |
| `authMethods`  | Tidak | `string[]` | Id metode penyiapan/autentikasi yang didukung penyedia ini tanpa memuat runtime penuh.           |
| `envVars`      | Tidak | `string[]` | Env var yang dapat diperiksa permukaan penyiapan/status generik sebelum runtime Plugin dimuat.   |
| `authEvidence` | Tidak | `object[]` | Pemeriksaan bukti autentikasi lokal murah untuk penyedia yang dapat mengautentikasi melalui penanda non-rahasia. |

`authEvidence` ditujukan untuk penanda kredensial lokal milik penyedia yang dapat
diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap murah dan lokal:
tanpa panggilan jaringan, tanpa pembacaan keychain atau secret-manager, tanpa perintah shell, dan tanpa
probe API penyedia.

Entri bukti yang didukung:

| Bidang             | Wajib | Tipe       | Artinya                                                                                                      |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Ya    | `string`   | Saat ini `local-file-with-env`.                                                                              |
| `fileEnvVar`       | Tidak | `string`   | Env var yang berisi path file kredensial eksplisit.                                                          |
| `fallbackPaths`    | Tidak | `string[]` | Path file kredensial lokal yang diperiksa saat `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak | `string[]` | Setidaknya satu env var yang tercantum harus tidak kosong sebelum bukti valid.                               |
| `requiresAllEnv`   | Tidak | `string[]` | Setiap env var yang tercantum harus tidak kosong sebelum bukti valid.                                        |
| `credentialMarker` | Ya    | `string`   | Penanda non-rahasia yang dikembalikan saat bukti ada.                                                        |
| `source`           | Tidak | `string`   | Label sumber yang terlihat pengguna untuk keluaran autentikasi/status.                                       |

### Bidang setup

| Bidang             | Wajib | Tipe       | Artinya                                                                                         |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Tidak | `object[]` | Deskriptor penyiapan penyedia yang diekspos selama penyiapan dan onboarding.                    |
| `cliBackends`      | Tidak | `string[]` | Id backend waktu penyiapan yang digunakan untuk pencarian penyiapan berbasis deskriptor. Jaga agar id yang dinormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | Id migrasi konfigurasi yang dimiliki oleh permukaan penyiapan Plugin ini.                       |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah penyiapan masih memerlukan eksekusi `setup-api` setelah pencarian deskriptor.            |

## Referensi uiHints

`uiHints` adalah peta dari nama bidang konfigurasi ke petunjuk rendering kecil.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Setiap petunjuk bidang dapat menyertakan:

| Bidang        | Tipe       | Artinya                                      |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Label bidang yang terlihat pengguna.         |
| `help`        | `string`   | Teks bantuan singkat.                        |
| `tags`        | `string[]` | Tag UI opsional.                             |
| `advanced`    | `boolean`  | Menandai bidang sebagai lanjutan.            |
| `sensitive`   | `boolean`  | Menandai bidang sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.       |

## Referensi contracts

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat
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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Setiap daftar bersifat opsional:

| Bidang                           | Tipe       | Artinya                                                               |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id factory ekstensi app-server Codex, saat ini `codex-app-server`.    |
| `agentToolResultMiddleware`      | `string[]` | Id runtime yang boleh digunakan Plugin bundel untuk mendaftarkan middleware hasil-tool. |
| `externalAuthProviders`          | `string[]` | Id penyedia yang hook profil autentikasi eksternalnya dimiliki Plugin ini. |
| `speechProviders`                | `string[]` | Id penyedia speech yang dimiliki Plugin ini.                          |
| `realtimeTranscriptionProviders` | `string[]` | Id penyedia realtime-transcription yang dimiliki Plugin ini.          |
| `realtimeVoiceProviders`         | `string[]` | Id penyedia realtime-voice yang dimiliki Plugin ini.                  |
| `memoryEmbeddingProviders`       | `string[]` | Id penyedia memory embedding yang dimiliki Plugin ini.                |
| `mediaUnderstandingProviders`    | `string[]` | Id penyedia media-understanding yang dimiliki Plugin ini.             |
| `imageGenerationProviders`       | `string[]` | Id penyedia image-generation yang dimiliki Plugin ini.                |
| `videoGenerationProviders`       | `string[]` | Id penyedia video-generation yang dimiliki Plugin ini.                |
| `webFetchProviders`              | `string[]` | Id penyedia web-fetch yang dimiliki Plugin ini.                       |
| `webSearchProviders`             | `string[]` | Id penyedia web-search yang dimiliki Plugin ini.                      |
| `migrationProviders`             | `string[]` | Id penyedia impor yang dimiliki Plugin ini untuk `openclaw migrate`.  |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki Plugin ini untuk pemeriksaan kontrak bundel. |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory ekstensi khusus app-server
Codex yang dibundel. Transformasi hasil-tool bundel harus
mendeklarasikan `contracts.agentToolResultMiddleware` dan mendaftar dengan
`api.registerAgentToolResultMiddleware(...)` sebagai gantinya. Plugin eksternal tidak dapat
mendaftarkan middleware hasil-tool karena seam tersebut dapat menulis ulang keluaran tool
berkepercayaan tinggi sebelum model melihatnya.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` harus mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi tetap berjalan
melalui fallback kompatibilitas yang sudah didepresiasi, tetapi fallback itu lebih lambat dan
akan dihapus setelah jendela migrasi.

Penyedia memory embedding bundel harus mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap id adapter yang mereka ekspos, termasuk
adapter bawaan seperti `local`. Path CLI mandiri menggunakan kontrak manifes ini
untuk memuat hanya Plugin pemilik sebelum runtime Gateway penuh
mendaftarkan penyedia.

## Referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` saat penyedia pemahaman media memiliki
model default, prioritas fallback autentikasi otomatis, atau dukungan dokumen native yang
diperlukan helper inti generik sebelum runtime dimuat. Kunci juga harus dideklarasikan di
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

Setiap entri penyedia dapat menyertakan:

| Bidang                 | Tipe                                | Artinya                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Kemampuan media yang diekspos oleh penyedia ini.                             |
| `defaultModels`        | `Record<string, string>`            | Default kemampuan-ke-model yang digunakan saat config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka lebih rendah diurutkan lebih awal untuk fallback penyedia berbasis kredensial otomatis. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh penyedia.                            |

## Referensi channelConfigs

Gunakan `channelConfigs` saat Plugin saluran memerlukan metadata config murah sebelum
runtime dimuat. Penemuan penyiapan/status saluran read-only dapat menggunakan metadata ini
secara langsung untuk saluran eksternal yang telah dikonfigurasi saat tidak ada entri penyiapan,
atau saat `setup.requiresRuntime: false` menyatakan runtime penyiapan tidak diperlukan.

`channelConfigs` adalah metadata manifes Plugin, bukan bagian config pengguna tingkat atas
yang baru. Pengguna tetap mengonfigurasi instans saluran di bawah `channels.<channel-id>`.
OpenClaw membaca metadata manifes untuk menentukan Plugin mana yang memiliki saluran
terkonfigurasi itu sebelum kode runtime Plugin dijalankan.

Untuk Plugin saluran, `configSchema` dan `channelConfigs` menjelaskan jalur yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin yang tidak dibundel yang mendeklarasikan `channels[]` juga sebaiknya mendeklarasikan
entri `channelConfigs` yang sesuai. Tanpanya, OpenClaw tetap dapat memuat Plugin, tetapi
skema config jalur dingin, penyiapan, dan permukaan Control UI tidak dapat mengetahui
bentuk opsi milik saluran sampai runtime Plugin dijalankan.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan
`nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk pemeriksaan config
perintah yang berjalan sebelum runtime saluran dimuat. Saluran yang dibundel juga dapat menerbitkan
default yang sama melalui `package.json#openclaw.channel.commands` bersama metadata katalog saluran
milik paket lainnya.

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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Setiap entri saluran dapat menyertakan:

| Bidang        | Tipe                     | Artinya                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config saluran yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label/placeholder/petunjuk sensitif UI opsional untuk bagian config saluran tersebut.     |
| `label`       | `string`                 | Label saluran yang digabungkan ke permukaan pemilih dan inspeksi saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi singkat saluran untuk permukaan inspeksi dan katalog.                           |
| `commands`    | `object`                 | Default otomatis perintah native dan skill native statis untuk pemeriksaan config pra-runtime. |
| `preferOver`  | `string[]`               | Id Plugin lama atau berprioritas lebih rendah yang harus dikalahkan saluran ini di permukaan pemilihan. |

### Mengganti Plugin saluran lain

Gunakan `preferOver` saat Plugin Anda adalah pemilik pilihan untuk id saluran yang
juga dapat disediakan oleh Plugin lain. Kasus umum mencakup id Plugin yang diganti nama,
Plugin mandiri yang menggantikan Plugin bundel, atau fork terpelihara yang
mempertahankan id saluran yang sama untuk kompatibilitas config.

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

Saat `channels.chat` dikonfigurasi, OpenClaw mempertimbangkan id saluran dan
id Plugin pilihan. Jika Plugin berprioritas lebih rendah hanya dipilih karena
dibundel atau diaktifkan secara default, OpenClaw menonaktifkannya dalam config
runtime efektif sehingga satu Plugin memiliki saluran dan tool-nya. Pilihan pengguna
eksplisit tetap menang: jika pengguna secara eksplisit mengaktifkan kedua Plugin, OpenClaw
mempertahankan pilihan itu dan melaporkan diagnostik saluran/tool duplikat alih-alih
mengubah set Plugin yang diminta secara diam-diam.

Jaga `preferOver` tetap terbatas pada id Plugin yang benar-benar dapat menyediakan saluran yang sama.
Ini bukan bidang prioritas umum dan tidak mengganti nama kunci config pengguna.

## Referensi modelSupport

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan Plugin penyedia Anda dari
id model singkat seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum runtime Plugin
dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan presedensi ini:

- ref `provider/model` eksplisit menggunakan metadata manifes `providers` pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu Plugin tidak dibundel dan satu Plugin bundel sama-sama cocok, Plugin yang tidak dibundel
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau config menentukan penyedia

Bidang:

| Bidang          | Tipe       | Artinya                                                                       |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model singkat.        |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model singkat setelah penghapusan sufiks profil. |

## Referensi modelCatalog

Gunakan `modelCatalog` saat OpenClaw harus mengetahui metadata model penyedia sebelum
memuat runtime Plugin. Ini adalah sumber milik manifes untuk baris katalog tetap,
alias penyedia, aturan supresi, dan mode penemuan. Penyegaran runtime
tetap berada dalam kode runtime penyedia, tetapi manifes memberi tahu inti kapan runtime
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
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Bidang tingkat atas:

| Bidang         | Tipe                                                     | Artinya                                                                                                     |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki oleh Plugin ini. Kunci juga sebaiknya muncul di `providers` tingkat atas. |
| `aliases`      | `Record<string, object>`                                 | Alias penyedia yang harus di-resolve ke penyedia milik sendiri untuk perencanaan katalog atau supresi.      |
| `suppressions` | `object[]`                                               | Baris model dari sumber lain yang disupresi Plugin ini karena alasan khusus penyedia.                       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, disegarkan ke cache, atau memerlukan runtime.   |

`aliases` berpartisipasi dalam pencarian kepemilikan penyedia untuk perencanaan katalog model.
Target alias harus berupa penyedia tingkat atas yang dimiliki oleh Plugin yang sama. Saat daftar
yang difilter penyedia menggunakan alias, OpenClaw dapat membaca manifes pemilik dan
menerapkan override API/base URL alias tanpa memuat runtime penyedia.
Alias tidak memperluas listing katalog tanpa filter; daftar luas hanya memancarkan baris penyedia
kanonis milik pemilik.

`suppressions` menggantikan hook runtime penyedia lama `suppressBuiltInModel`.
Entri supresi dihormati hanya saat penyedia dimiliki oleh Plugin atau
dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia milik sendiri. Hook
supresi runtime tidak lagi dipanggil selama resolusi model.

Bidang penyedia:

| Bidang    | Tipe                     | Artinya                                                                 |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL default opsional untuk model dalam katalog penyedia ini.       |
| `api`     | `ModelApi`               | Adapter API default opsional untuk model dalam katalog penyedia ini.    |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.         |
| `models`  | `object[]`               | Baris model wajib. Baris tanpa `id` diabaikan.                          |

Bidang model:

| Field           | Type                                                           | Artinya                                                                     |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID model lokal provider, tanpa prefiks `provider/`.                         |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                     |
| `api`           | `ModelApi`                                                     | Override API opsional per model.                                            |
| `baseUrl`       | `string`                                                       | Override URL dasar opsional per model.                                      |
| `headers`       | `Record<string, string>`                                       | Header statis opsional per model.                                           |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitas yang diterima model.                                              |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku penalaran.                                 |
| `contextWindow` | `number`                                                       | Jendela konteks native provider.                                            |
| `contextTokens` | `number`                                                       | Batas konteks runtime efektif opsional saat berbeda dari `contextWindow`.   |
| `maxTokens`     | `number`                                                       | Token output maksimum jika diketahui.                                       |
| `cost`          | `object`                                                       | Harga opsional USD per sejuta token, termasuk `tieredPricing` opsional.     |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas konfigurasi model OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status daftar. Sembunyikan hanya saat baris tidak boleh muncul sama sekali. |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan dengan status non-tersedia.                |
| `replaces`      | `string[]`                                                     | ID model lokal provider lama yang digantikan model ini.                     |
| `replacedBy`    | `string`                                                       | ID model lokal provider pengganti untuk baris yang tidak digunakan lagi.    |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh pemilih dan filter.                          |

Kolom penyembunyian:

| Field                      | Type       | Artinya                                                                                                   |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID provider untuk baris upstream yang akan disembunyikan. Harus dimiliki plugin ini atau dideklarasikan sebagai alias yang dimiliki. |
| `model`                    | `string`   | ID model lokal provider yang akan disembunyikan.                                                          |
| `reason`                   | `string`   | Pesan opsional yang ditampilkan saat baris yang disembunyikan diminta secara langsung.                    |
| `when.baseUrlHosts`        | `string[]` | Daftar opsional host URL dasar provider efektif yang diperlukan sebelum penyembunyian berlaku.            |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi provider persis yang diperlukan sebelum penyembunyian berlaku.    |

Jangan masukkan data khusus runtime ke dalam `modelCatalog`. Gunakan `static` hanya saat baris manifes
cukup lengkap agar daftar terfilter provider dan permukaan pemilih dapat melewati
penemuan registry/runtime. Gunakan `refreshable` saat baris manifes berguna sebagai
seed atau pelengkap yang dapat dicantumkan tetapi refresh/cache dapat menambahkan lebih banyak baris nanti;
baris refreshable tidak otoritatif dengan sendirinya. Gunakan `runtime` saat OpenClaw
harus memuat runtime provider untuk mengetahui daftarnya.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan ID model milik provider yang murah dan harus
terjadi sebelum runtime provider dimuat. Ini menjaga alias seperti nama model pendek,
ID legacy lokal provider, dan aturan prefiks proxy dalam manifes plugin pemilik
alih-alih di tabel pemilihan model inti.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Kolom provider:

| Field                                | Type                    | Artinya                                                                                   |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias ID model persis yang tidak peka huruf besar/kecil. Nilai dikembalikan sebagaimana ditulis. |
| `stripPrefixes`                      | `string[]`              | Prefiks yang dihapus sebelum pencarian alias, berguna untuk duplikasi legacy provider/model. |
| `prefixWhenBare`                     | `string`                | Prefiks yang ditambahkan saat ID model yang dinormalisasi belum mengandung `/`.           |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan prefiks ID polos bersyarat setelah pencarian alias, dikunci oleh `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi endpoint yang harus diketahui kebijakan permintaan generik
sebelum runtime provider dimuat. Core tetap memiliki makna setiap
`endpointClass`; manifes plugin memiliki metadata host dan URL dasar.

Kolom endpoint:

| Field                          | Type       | Artinya                                                                                        |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint core yang diketahui, seperti `openrouter`, `moonshot-native`, atau `google-vertex`. |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                             |
| `hostSuffixes`                 | `string[]` | Sufiks host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus sufiks domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi persis yang dipetakan ke kelas endpoint.                      |
| `googleVertexRegion`           | `string`   | Region Google Vertex statis untuk host global persis.                                          |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks yang dihapus dari host yang cocok untuk mengekspos prefiks region Google Vertex.        |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan murah yang dibutuhkan
kebijakan permintaan generik tanpa memuat runtime provider. Simpan penulisan ulang payload
khusus perilaku di hook runtime provider atau helper bersama keluarga provider.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Kolom provider:

| Field                 | Type         | Artinya                                                                               |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label keluarga provider yang digunakan oleh keputusan dan diagnostik kompatibilitas permintaan generik. |
| `compatibilityFamily` | `"moonshot"` | Bucket kompatibilitas keluarga provider opsional untuk helper permintaan bersama.     |
| `openAICompletions`   | `object`     | Flag permintaan completions yang kompatibel dengan OpenAI, saat ini `supportsStreamingUsage`. |

## Referensi modelPricing

Gunakan `modelPricing` saat provider membutuhkan perilaku harga control-plane sebelum
runtime dimuat. Cache harga Gateway membaca metadata ini tanpa mengimpor
kode runtime provider.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Kolom provider:

| Field        | Type              | Artinya                                                                                            |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Setel `false` untuk provider lokal/self-hosted yang tidak boleh mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan pencarian harga OpenRouter. `false` menonaktifkan pencarian OpenRouter untuk provider ini. |
| `liteLLM`    | `false \| object` | Pemetaan pencarian harga LiteLLM. `false` menonaktifkan pencarian LiteLLM untuk provider ini.      |

Kolom sumber:

| Field                      | Type               | Artinya                                                                                                             |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID provider katalog eksternal saat berbeda dari ID provider OpenClaw, misalnya `z-ai` untuk provider `zai`.         |
| `passthroughProviderModel` | `boolean`          | Perlakukan ID model yang mengandung garis miring sebagai referensi provider/model bersarang, berguna untuk provider proxy seperti OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varian ID model katalog eksternal tambahan. `version-dots` mencoba ID versi bertitik seperti `claude-opus-4.6`.     |

### Indeks Provider OpenClaw

Indeks Provider OpenClaw adalah metadata pratinjau milik OpenClaw untuk provider
yang pluginnya mungkin belum terpasang. Ini bukan bagian dari manifes plugin.
Manifes plugin tetap menjadi otoritas plugin terpasang. Indeks Provider adalah
kontrak fallback internal yang akan dikonsumsi oleh permukaan provider yang dapat dipasang
dan pemilih model pra-instal di masa mendatang saat plugin provider belum terpasang.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. `modelCatalog` manifes plugin terpasang.
3. Cache katalog model dari refresh eksplisit.
4. Baris pratinjau Indeks Provider OpenClaw.

Indeks Penyedia tidak boleh berisi rahasia, status aktif, hook runtime, atau
data model khusus akun live. Katalog pratinjaunya menggunakan bentuk baris
penyedia `modelCatalog` yang sama seperti manifes plugin, tetapi harus tetap
dibatasi pada metadata tampilan yang stabil kecuali field adaptor runtime seperti
`api`, `baseUrl`, harga, atau flag kompatibilitas memang sengaja dijaga selaras
dengan manifes plugin yang terpasang. Penyedia dengan discovery `/models` live
harus menulis baris yang disegarkan melalui jalur cache katalog model eksplisit,
bukan membuat listing normal atau onboarding memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata plugin yang dapat dipasang
untuk penyedia yang pluginnya telah dipindahkan keluar dari core atau belum
dipasang. Metadata ini mencerminkan pola katalog channel: nama package, spec
pemasangan npm, integritas yang diharapkan, dan label pilihan autentikasi murah
sudah cukup untuk menampilkan opsi setup yang dapat dipasang. Setelah plugin
dipasang, manifesnya menang dan entri Indeks Penyedia diabaikan untuk penyedia
tersebut.

Kunci capability top-level legacy sudah tidak digunakan. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifes normal tidak lagi memperlakukan field top-level tersebut sebagai
kepemilikan capability.

## Manifes versus package.json

Kedua file menjalankan tugas yang berbeda:

| File                   | Gunakan untuk                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi config, metadata pilihan autentikasi, dan petunjuk UI yang harus ada sebelum kode plugin berjalan                         |
| `package.json`         | Metadata npm, pemasangan dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating pemasangan, setup, atau metadata katalog |

Jika Anda tidak yakin di mana sebuah metadata seharusnya berada, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu tentang packaging, file entri, atau perilaku pemasangan npm, letakkan di `package.json`

### Field package.json yang memengaruhi discovery

Sebagian metadata plugin pra-runtime memang sengaja berada di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native. Harus tetap berada di dalam direktori package plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk package yang terpasang. Harus tetap berada di dalam direktori package plugin.                                                                 |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding, startup channel tertunda, dan discovery status channel/SecretRef hanya-baca. Harus tetap berada di dalam direktori package plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint setup JavaScript hasil build untuk package yang terpasang. Harus tetap berada di dalam direktori package plugin.                                                                |
| `openclaw.channel`                                                | Metadata katalog channel murah seperti label, jalur docs, alias, dan salinan pemilihan.                                                                                                 |
| `openclaw.channel.commands`                                       | Metadata statis command native dan default otomatis skill native yang digunakan oleh permukaan config, audit, dan daftar command sebelum runtime channel dimuat.                                          |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa status terkonfigurasi ringan yang dapat menjawab "apakah setup env-only sudah ada?" tanpa memuat runtime channel penuh.                                         |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa autentikasi tersimpan ringan yang dapat menjawab "apakah ada yang sudah masuk?" tanpa memuat runtime channel penuh.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk pemasangan/pembaruan untuk plugin bundled dan plugin yang diterbitkan secara eksternal.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Jalur pemasangan pilihan saat beberapa sumber pemasangan tersedia.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | String integritas dist npm yang diharapkan seperti `sha512-...`; flow pemasangan dan pembaruan memverifikasi artefak yang diambil terhadap nilai ini.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan pemasangan ulang plugin bundled yang sempit saat config tidak valid.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus setup dimuat sebelum plugin channel penuh selama startup.                                                                                                 |

Metadata manifes menentukan pilihan penyedia/channel/setup mana yang muncul di
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan plugin tersebut saat pengguna memilih
salah satu pilihan itu. Jangan pindahkan petunjuk pemasangan ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama pemasangan dan pemuatan
registry manifes. Nilai yang tidak valid ditolak; nilai yang lebih baru tetapi valid melewati
plugin pada host yang lebih lama.

Pin versi npm persis sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
harus memasangkan spec persis dengan `expectedIntegrity` agar flow pembaruan gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang dipin.
Onboarding interaktif tetap menawarkan spec npm registry tepercaya, termasuk nama
package polos dan dist-tag, demi kompatibilitas. Diagnostik katalog dapat
membedakan sumber persis, floating, dipin-integritas, integritas-hilang, nama
package tidak cocok, dan pilihan-default tidak valid. Diagnostik itu juga memperingatkan saat
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat dipin olehnya.
Saat `expectedIntegrity` ada,
flow pemasangan/pembaruan memberlakukannya; saat dihilangkan, resolusi registry
dicatat tanpa pin integritas.

Plugin channel harus menyediakan `openclaw.setupEntry` saat status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang terkonfigurasi tanpa memuat runtime
penuh. Entri setup harus mengekspos metadata channel plus adaptor config,
status, dan secret yang aman untuk setup; pertahankan klien jaringan, listener Gateway, dan
runtime transport di entrypoint ekstensi utama.

Field entrypoint runtime tidak mengesampingkan pemeriksaan batas package untuk field
entrypoint sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat jalur
`openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` memang sengaja sempit. Ini tidak
membuat config rusak sembarang menjadi dapat dipasang. Saat ini ini hanya mengizinkan flow
pemasangan untuk pulih dari kegagalan upgrade plugin bundled lama tertentu, seperti
jalur plugin bundled yang hilang atau entri `channels.<id>` lama untuk plugin
bundled yang sama. Error config yang tidak terkait tetap memblokir pemasangan dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata package untuk modul pemeriksa
kecil:

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

Gunakan ini saat flow setup, doctor, status, atau presence hanya-baca memerlukan probe
autentikasi ya/tidak yang murah sebelum plugin channel penuh dimuat. Status autentikasi
tersimpan bukan status channel terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan
plugin secara otomatis, memperbaiki dependensi runtime, atau memutuskan apakah runtime channel
harus dimuat. Export target harus berupa fungsi kecil yang hanya membaca status tersimpan; jangan
arahkan melalui barrel runtime channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan murah
terkonfigurasi khusus env:

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

Gunakan ini saat sebuah channel dapat menjawab status terkonfigurasi dari env atau input
non-runtime kecil lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime
channel asli, pertahankan logika itu di hook `config.hasConfiguredState`
plugin.

## Prioritas discovery (id plugin duplikat)

OpenClaw menemukan plugin dari beberapa root (bundled, pemasangan global, workspace, jalur pilihan config eksplisit). Jika dua discovery memiliki `id` yang sama, hanya manifes dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih config** — jalur yang dipin secara eksplisit di `plugins.entries.<id>`
2. **Bundled** — plugin yang dikirim bersama OpenClaw
3. **Pemasangan global** — plugin yang dipasang ke root plugin OpenClaw global
4. **Workspace** — plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau lama dari plugin bundled yang berada di workspace tidak akan menutupi build bundled.
- Untuk benar-benar mengesampingkan plugin bundled dengan plugin lokal, pin melalui `plugins.entries.<id>` agar menang berdasarkan prioritas, bukan mengandalkan discovery workspace.
- Pembuangan duplikat dicatat agar Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.

## Persyaratan JSON Schema

- **Setiap plugin harus mengirimkan JSON Schema**, meskipun tidak menerima config.
- Schema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Schema divalidasi pada waktu baca/tulis config, bukan pada runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **kesalahan**, kecuali id channel dideklarasikan oleh
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan id Plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **kesalahan**.
- Jika Plugin terinstal tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan kesalahan Plugin.
- Jika konfigurasi Plugin ada tetapi Plugin **dinonaktifkan**, konfigurasi dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifest **wajib untuk Plugin OpenClaw native**, termasuk pemuatan dari sistem file lokal. Runtime tetap memuat modul Plugin secara terpisah; manifest hanya untuk penemuan + validasi.
- Manifest native diuraikan dengan JSON5, jadi komentar, koma akhir, dan kunci tanpa tanda kutip diterima selama nilai akhir tetap berupa objek.
- Hanya kolom manifest yang terdokumentasi yang dibaca oleh pemuat manifest. Hindari kunci tingkat atas khusus.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan ketika Plugin tidak membutuhkannya.
- `providerDiscoveryEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog penyedia statis atau deskriptor penemuan yang sempit, bukan eksekusi pada waktu permintaan.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Deklarasikan jenis Plugin eksklusif dalam manifest ini. `OpenClawPluginDefinition.kind` entri runtime tidak digunakan lagi dan tetap ada hanya sebagai fallback kompatibilitas untuk Plugin lama.
- Metadata variabel lingkungan (`setup.providers[].envVars`, `providerAuthEnvVars` yang tidak digunakan lagi, dan `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman cron, dan permukaan hanya-baca lainnya tetap menerapkan kebijakan kepercayaan Plugin dan aktivasi efektif sebelum memperlakukan variabel lingkungan sebagai terkonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode penyedia, lihat [Hook runtime penyedia](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist pengelola paket apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Membangun Plugin" href="/id/plugins/building-plugins" icon="rocket">
    Mulai menggunakan Plugin.
  </Card>
  <Card title="Arsitektur Plugin" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model kapabilitas.
  </Card>
  <Card title="Ringkasan SDK" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK Plugin dan impor subpath.
  </Card>
</CardGroup>
