---
read_when:
    - Anda sedang membuat Plugin OpenClaw
    - Anda perlu mengirimkan skema konfigurasi Plugin atau men-debug kesalahan validasi Plugin
summary: Persyaratan manifes Plugin + skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini hanya untuk **manifes Plugin OpenClaw native**.

Untuk tata letak bundel yang kompatibel, lihat [Bundel Plugin](/id/plugins/bundles).

Format bundel yang kompatibel menggunakan file manifes yang berbeda:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude default
  tanpa manifes
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundel tersebut, tetapi tata letak itu tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundel yang kompatibel, OpenClaw saat ini membaca metadata bundel plus root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundel Claude,
default LSP bundel Claude, dan paket hook yang didukung ketika tata letaknya cocok
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifes ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifes yang hilang atau tidak valid diperlakukan sebagai
kesalahan Plugin dan memblokir validasi konfigurasi.

Lihat panduan lengkap sistem Plugin: [Plugin](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat
kode Plugin Anda**. Semua yang di bawah ini harus cukup ringan untuk diperiksa tanpa menjalankan
runtime Plugin.

**Gunakan untuk:**

- identitas Plugin, validasi konfigurasi, dan petunjuk UI konfigurasi
- metadata auth, onboarding, dan setup (alias, aktif otomatis, variabel env penyedia, pilihan auth)
- petunjuk aktivasi untuk permukaan control-plane
- kepemilikan keluarga model singkat
- snapshot kepemilikan kapabilitas statis (`contracts`)
- metadata runner QA yang dapat diperiksa host `openclaw qa` bersama
- metadata konfigurasi khusus channel yang digabungkan ke permukaan katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan entrypoint kode,
atau metadata instal npm. Itu berada di kode Plugin Anda dan `package.json`.

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

## Contoh kaya

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

| Bidang                               | Wajib | Jenis                            | Artinya                                                                                                                                                                                                                              |
| ------------------------------------ | ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Ya    | `string`                         | ID Plugin kanonis. Ini adalah ID yang digunakan dalam `plugins.entries.<id>`.                                                                                                                                                        |
| `configSchema`                       | Ya    | `object`                         | JSON Schema inline untuk konfigurasi Plugin ini.                                                                                                                                                                                     |
| `enabledByDefault`                   | Tidak | `true`                           | Menandai Plugin bawaan sebagai diaktifkan secara default. Hilangkan ini, atau tetapkan nilai non-`true` apa pun, agar Plugin tetap dinonaktifkan secara default.                                                                      |
| `enabledByDefaultOnPlatforms`        | Tidak | `string[]`                       | Menandai Plugin bawaan sebagai diaktifkan secara default hanya pada platform Node.js yang tercantum, misalnya `["darwin"]`. Konfigurasi eksplisit tetap berlaku.                                                                      |
| `legacyPluginIds`                    | Tidak | `string[]`                       | ID lama yang dinormalisasi ke ID Plugin kanonis ini.                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Tidak | `string[]`                       | ID penyedia yang harus mengaktifkan Plugin ini secara otomatis saat auth, konfigurasi, atau referensi model menyebutkannya.                                                                                                           |
| `kind`                               | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                        |
| `channels`                           | Tidak | `string[]`                       | ID channel yang dimiliki oleh Plugin ini. Digunakan untuk discovery dan validasi konfigurasi.                                                                                                                                         |
| `providers`                          | Tidak | `string[]`                       | ID penyedia yang dimiliki oleh Plugin ini.                                                                                                                                                                                            |
| `providerCatalogEntry`               | Tidak | `string`                         | Jalur modul katalog penyedia yang ringan, relatif terhadap root Plugin, untuk metadata katalog penyedia bercakupan manifest yang dapat dimuat tanpa mengaktifkan runtime Plugin penuh.                                                |
| `modelSupport`                       | Tidak | `object`                         | Metadata shorthand keluarga model milik manifest yang digunakan untuk memuat Plugin secara otomatis sebelum runtime.                                                                                                                  |
| `modelCatalog`                       | Tidak | `object`                         | Metadata katalog model deklaratif untuk penyedia yang dimiliki oleh Plugin ini. Ini adalah kontrak bidang kontrol untuk listing hanya-baca, onboarding, pemilih model, alias, dan penekanan di masa mendatang tanpa memuat runtime Plugin. |
| `modelPricing`                       | Tidak | `object`                         | Kebijakan lookup harga eksternal milik penyedia. Gunakan ini untuk mengecualikan penyedia lokal/self-hosted dari katalog harga jarak jauh atau memetakan referensi penyedia ke ID katalog OpenRouter/LiteLLM tanpa meng-hardcode ID penyedia di core. |
| `modelIdNormalization`               | Tidak | `object`                         | Pembersihan alias/prefiks ID model milik penyedia yang harus berjalan sebelum runtime penyedia dimuat.                                                                                                                                |
| `providerEndpoints`                  | Tidak | `object[]`                       | Metadata host/baseUrl endpoint milik manifest untuk rute penyedia yang harus diklasifikasikan core sebelum runtime penyedia dimuat.                                                                                                   |
| `providerRequest`                    | Tidak | `object`                         | Metadata keluarga penyedia dan kompatibilitas permintaan yang ringan, digunakan oleh kebijakan permintaan generik sebelum runtime penyedia dimuat.                                                                                    |
| `cliBackends`                        | Tidak | `string[]`                       | ID backend inferensi CLI yang dimiliki oleh Plugin ini. Digunakan untuk aktivasi otomatis saat startup dari referensi konfigurasi eksplisit.                                                                                          |
| `syntheticAuthRefs`                  | Tidak | `string[]`                       | Referensi penyedia atau backend CLI yang hook auth sintetis milik Plugin-nya harus diprobe selama discovery model cold sebelum runtime dimuat.                                                                                         |
| `nonSecretAuthMarkers`               | Tidak | `string[]`                       | Nilai placeholder kunci API milik Plugin bawaan yang merepresentasikan status kredensial lokal non-rahasia, OAuth, atau ambien.                                                                                                      |
| `commandAliases`                     | Tidak | `object[]`                       | Nama perintah yang dimiliki oleh Plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI yang sadar Plugin sebelum runtime dimuat.                                                                                           |
| `providerAuthEnvVars`                | Tidak | `Record<string, string[]>`       | Metadata env kompatibilitas yang tidak digunakan lagi untuk lookup auth/status penyedia. Pilih `setup.providers[].envVars` untuk Plugin baru; OpenClaw masih membaca ini selama jendela deprekasi.                                   |
| `providerAuthAliases`                | Tidak | `Record<string, string>`         | ID penyedia yang harus menggunakan ulang ID penyedia lain untuk lookup auth, misalnya penyedia coding yang berbagi kunci API dan profil auth penyedia dasar.                                                                           |
| `channelEnvVars`                     | Tidak | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk setup channel berbasis env atau permukaan auth yang harus terlihat oleh helper startup/konfigurasi generik.                     |
| `providerAuthChoices`                | Tidak | `object[]`                       | Metadata pilihan auth ringan untuk pemilih onboarding, resolusi penyedia pilihan, dan wiring flag CLI sederhana.                                                                                                                      |
| `activation`                         | Tidak | `object`                         | Metadata perencana aktivasi ringan untuk pemuatan yang dipicu startup, penyedia, perintah, channel, rute, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku aktual.                                           |
| `setup`                              | Tidak | `object`                         | Deskriptor setup/onboarding ringan yang dapat diperiksa oleh permukaan discovery dan setup tanpa memuat runtime Plugin.                                                                                                               |
| `qaRunners`                          | Tidak | `object[]`                       | Deskriptor runner QA ringan yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                            |
| `contracts`                          | Tidak | `object`                         | Snapshot kepemilikan kapabilitas statis untuk hook auth eksternal, speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, web-fetch, pencarian web, dan kepemilikan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak | `Record<string, object>`         | Default pemahaman media yang ringan untuk ID penyedia yang dideklarasikan dalam `contracts.mediaUnderstandingProviders`.                                                                                                             |
| `imageGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata auth pembuatan gambar ringan untuk ID penyedia yang dideklarasikan dalam `contracts.imageGenerationProviders`, termasuk alias auth milik penyedia dan guard base-url.                                                       |
| `videoGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata auth pembuatan video ringan untuk ID penyedia yang dideklarasikan dalam `contracts.videoGenerationProviders`, termasuk alias auth milik penyedia dan guard base-url.                                                        |
| `musicGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata auth pembuatan musik ringan untuk ID penyedia yang dideklarasikan dalam `contracts.musicGenerationProviders`, termasuk alias auth milik penyedia dan guard base-url.                                                        |
| `toolMetadata`                       | Tidak | `Record<string, object>`         | Metadata ketersediaan ringan untuk tool milik Plugin yang dideklarasikan dalam `contracts.tools`. Gunakan ini saat tool tidak boleh memuat runtime kecuali ada bukti konfigurasi, env, atau auth.                                    |
| `channelConfigs`                     | Tidak | `Record<string, object>`         | Metadata konfigurasi channel milik manifest yang digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                                                             |
| `skills`                             | Tidak | `string[]`                       | Direktori Skill untuk dimuat, relatif terhadap root Plugin.                                                                                                                                                                          |
| `name`                               | Tidak    | `string`                         | Nama Plugin yang dapat dibaca manusia.                                                                                                                                                                                              |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan Plugin.                                                                                                                                                                             |
| `version`                            | Tidak    | `string`                         | Versi Plugin informasional.                                                                                                                                                                                                         |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk bidang konfigurasi.                                                                                                                                                          |

## Referensi metadata penyedia pembuatan

Kolom metadata penyedia pembuatan menjelaskan sinyal autentikasi statis untuk
penyedia yang dideklarasikan dalam daftar `contracts.*GenerationProviders`
yang sesuai. OpenClaw membaca kolom ini sebelum runtime penyedia dimuat sehingga
alat inti dapat memutuskan apakah penyedia pembuatan tersedia tanpa mengimpor
setiap plugin penyedia.

Gunakan kolom ini hanya untuk fakta deklaratif yang murah. Transport, transformasi
permintaan, penyegaran token, validasi kredensial, dan perilaku pembuatan aktual
tetap berada di runtime plugin.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Setiap entri metadata mendukung:

| Kolom           | Wajib | Tipe       | Artinya                                                                                                                               |
| --------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Tidak | `string[]` | Id penyedia tambahan yang harus dihitung sebagai alias autentikasi statis untuk penyedia pembuatan.                                   |
| `authProviders` | Tidak | `string[]` | Id penyedia yang profil autentikasinya yang dikonfigurasi harus dihitung sebagai autentikasi untuk penyedia pembuatan ini.            |
| `configSignals` | Tidak | `object[]` | Sinyal ketersediaan murah yang hanya berbasis konfigurasi untuk penyedia lokal atau swakelola yang dapat dikonfigurasi tanpa profil autentikasi atau variabel env. |
| `authSignals`   | Tidak | `object[]` | Sinyal autentikasi eksplisit. Jika ada, ini menggantikan set sinyal default dari id penyedia, `aliases`, dan `authProviders`.          |

Setiap entri `configSignals` mendukung:

| Kolom         | Wajib | Tipe       | Artinya                                                                                                                                                                               |
| ------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ya    | `string`   | Jalur titik ke objek konfigurasi milik plugin yang akan diperiksa, misalnya `plugins.entries.example.config`.                                                                         |
| `overlayPath` | Tidak | `string`   | Jalur titik di dalam konfigurasi root yang objeknya harus melapisi objek root sebelum mengevaluasi sinyal. Gunakan ini untuk konfigurasi khusus kapabilitas seperti `image`, `video`, atau `music`. |
| `required`    | Tidak | `string[]` | Jalur titik di dalam konfigurasi efektif yang harus memiliki nilai terkonfigurasi. String tidak boleh kosong; objek dan array tidak boleh kosong.                                     |
| `requiredAny` | Tidak | `string[]` | Jalur titik di dalam konfigurasi efektif dengan setidaknya satu yang harus memiliki nilai terkonfigurasi.                                                                             |
| `mode`        | Tidak | `object`   | Penjaga mode string opsional di dalam konfigurasi efektif. Gunakan ini ketika ketersediaan hanya berbasis konfigurasi hanya berlaku untuk satu mode.                                  |

Setiap penjaga `mode` mendukung:

| Kolom        | Wajib | Tipe       | Artinya                                                                                  |
| ------------ | ----- | ---------- | ---------------------------------------------------------------------------------------- |
| `path`       | Tidak | `string`   | Jalur titik di dalam konfigurasi efektif. Default-nya `mode`.                            |
| `default`    | Tidak | `string`   | Nilai mode yang digunakan ketika konfigurasi menghilangkan jalur tersebut.               |
| `allowed`    | Tidak | `string[]` | Jika ada, sinyal lolos hanya ketika mode efektif adalah salah satu dari nilai-nilai ini. |
| `disallowed` | Tidak | `string[]` | Jika ada, sinyal gagal ketika mode efektif adalah salah satu dari nilai-nilai ini.       |

Setiap entri `authSignals` mendukung:

| Kolom            | Wajib | Tipe     | Artinya                                                                                                                                                                  |
| ---------------- | ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`       | Ya    | `string` | Id penyedia yang akan diperiksa dalam profil autentikasi terkonfigurasi.                                                                                                 |
| `providerBaseUrl` | Tidak | `object` | Penjaga opsional yang membuat sinyal dihitung hanya ketika penyedia terkonfigurasi yang dirujuk menggunakan URL dasar yang diizinkan. Gunakan ini ketika alias autentikasi hanya valid untuk API tertentu. |

Setiap penjaga `providerBaseUrl` mendukung:

| Kolom             | Wajib | Tipe       | Artinya                                                                                                                                            |
| ----------------- | ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya    | `string`   | Id konfigurasi penyedia yang `baseUrl`-nya harus diperiksa.                                                                                        |
| `defaultBaseUrl`  | Tidak | `string`   | URL dasar yang diasumsikan ketika konfigurasi penyedia menghilangkan `baseUrl`.                                                                     |
| `allowedBaseUrls` | Ya    | `string[]` | URL dasar yang diizinkan untuk sinyal autentikasi ini. Sinyal diabaikan ketika URL dasar terkonfigurasi atau default tidak cocok dengan salah satu nilai ternormalisasi ini. |

## Referensi metadata alat

`toolMetadata` menggunakan bentuk `configSignals` dan `authSignals` yang sama
seperti metadata penyedia pembuatan, dengan kunci berupa nama alat. `contracts.tools`
mendeklarasikan kepemilikan. `toolMetadata` mendeklarasikan bukti ketersediaan
murah sehingga OpenClaw dapat menghindari impor runtime plugin hanya agar factory
alatnya mengembalikan `null`.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Jika alat tidak memiliki `toolMetadata`, OpenClaw mempertahankan perilaku yang
ada dan memuat plugin pemilik ketika kontrak alat cocok dengan kebijakan. Untuk
alat pada jalur panas yang factory-nya bergantung pada autentikasi/konfigurasi,
penulis plugin sebaiknya mendeklarasikan `toolMetadata` alih-alih membuat inti
mengimpor runtime untuk bertanya.

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan penyiapan awal atau autentikasi.
OpenClaw membaca ini sebelum runtime penyedia dimuat.
Daftar penyiapan penyedia menggunakan pilihan manifes ini, pilihan penyiapan yang
diturunkan dari deskriptor, dan metadata katalog instalasi tanpa memuat runtime penyedia.

| Kolom                 | Wajib | Tipe                                            | Artinya                                                                                                 |
| --------------------- | ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya    | `string`                                        | Id penyedia tempat pilihan ini berada.                                                                  |
| `method`              | Ya    | `string`                                        | Id metode autentikasi untuk dikirimkan.                                                                 |
| `choiceId`            | Ya    | `string`                                        | Id pilihan autentikasi stabil yang digunakan oleh alur penyiapan awal dan CLI.                          |
| `choiceLabel`         | Tidak | `string`                                        | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw menggunakan `choiceId`.                   |
| `choiceHint`          | Tidak | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                     |
| `assistantPriority`   | Tidak | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan asisten.          |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.                 |
| `deprecatedChoiceIds` | Tidak | `string[]`                                      | Id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                               |
| `groupId`             | Tidak | `string`                                        | Id grup opsional untuk mengelompokkan pilihan terkait.                                                  |
| `groupLabel`          | Tidak | `string`                                        | Label yang terlihat oleh pengguna untuk grup tersebut.                                                  |
| `groupHint`           | Tidak | `string`                                        | Teks bantuan singkat untuk grup.                                                                        |
| `optionKey`           | Tidak | `string`                                        | Kunci opsi internal untuk alur autentikasi satu-flag sederhana.                                         |
| `cliFlag`             | Tidak | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                          |
| `cliOption`           | Tidak | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Tidak | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                             |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation">` | Permukaan penyiapan awal tempat pilihan ini harus muncul. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` ketika sebuah plugin memiliki nama perintah runtime yang mungkin
keliru dimasukkan pengguna ke `plugins.allow` atau dicoba dijalankan sebagai perintah CLI root. OpenClaw
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

| Bidang       | Wajib | Tipe              | Artinya                                                                 |
| ------------ | ----- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ya    | `string`          | Nama perintah yang menjadi milik plugin ini.                            |
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.    |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait untuk disarankan pada operasi CLI, jika ada.  |

## referensi activation

Gunakan `activation` ketika plugin dapat mendeklarasikan secara murah peristiwa control-plane mana
yang harus menyertakannya dalam rencana activation/load.

Blok ini adalah metadata perencana, bukan API daur hidup. Blok ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode plugin sudah dieksekusi. Perencana activation menggunakan bidang ini untuk
mempersempit kandidat plugin sebelum kembali ke metadata kepemilikan manifes yang ada
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook.

Pilih metadata paling sempit yang sudah mendeskripsikan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
ketika bidang tersebut menyatakan relasinya. Gunakan `activation` untuk petunjuk
perencana tambahan yang tidak dapat direpresentasikan oleh bidang kepemilikan tersebut.
Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`,
`codex-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk
id harness agen tertanam yang belum memiliki bidang kepemilikan.

Blok ini hanya metadata. Blok ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan plugin yang lebih luas, sehingga
metadata activation non-startup yang hilang biasanya hanya berdampak pada performa; hal itu
tidak seharusnya mengubah kebenaran selama fallback kepemilikan manifes masih ada.

Setiap plugin harus menetapkan `activation.onStartup` dengan sengaja. Tetapkan ke `true`
hanya ketika plugin harus berjalan selama startup Gateway. Tetapkan ke `false` ketika
plugin tidak aktif saat startup dan hanya boleh dimuat dari pemicu yang lebih sempit.
Menghilangkan `onStartup` tidak lagi memuat plugin saat startup secara implisit; gunakan metadata
activation eksplisit untuk startup, channel, konfigurasi, agent-harness, memori, atau
pemicu activation lain yang lebih sempit.

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

| Bidang             | Wajib | Tipe                                                 | Artinya                                                                                                                                                                                          |
| ------------------ | ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Tidak | `boolean`                                            | Activation startup Gateway eksplisit. Setiap plugin harus menetapkan ini. `true` mengimpor plugin selama startup; `false` membuatnya malas-startup kecuali pemicu lain yang cocok memerlukan pemuatan. |
| `onProviders`      | Tidak | `string[]`                                           | Id provider yang harus menyertakan plugin ini dalam rencana activation/load.                                                                                                                     |
| `onAgentHarnesses` | Tidak | `string[]`                                           | Id runtime harness agen tertanam yang harus menyertakan plugin ini dalam rencana activation/load. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                                   |
| `onCommands`       | Tidak | `string[]`                                           | Id perintah yang harus menyertakan plugin ini dalam rencana activation/load.                                                                                                                     |
| `onChannels`       | Tidak | `string[]`                                           | Id channel yang harus menyertakan plugin ini dalam rencana activation/load.                                                                                                                       |
| `onRoutes`         | Tidak | `string[]`                                           | Jenis rute yang harus menyertakan plugin ini dalam rencana activation/load.                                                                                                                       |
| `onConfigPaths`    | Tidak | `string[]`                                           | Path konfigurasi relatif root yang harus menyertakan plugin ini dalam rencana startup/load ketika path ada dan tidak dinonaktifkan secara eksplisit.                                             |
| `onCapabilities`   | Tidak | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan activation control-plane. Pilih bidang yang lebih sempit bila memungkinkan.                                                            |

Konsumen live saat ini:

- Perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit
- perencanaan CLI yang dipicu perintah kembali ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan startup agent-runtime menggunakan `activation.onAgentHarnesses` untuk
  harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI
- perencanaan setup/channel yang dipicu channel kembali ke kepemilikan `channels[]`
  lama ketika metadata activation channel eksplisit hilang
- perencanaan plugin startup menggunakan `activation.onConfigPaths` untuk permukaan konfigurasi root
  non-channel seperti blok `browser` milik plugin browser bawaan
- perencanaan setup/runtime yang dipicu provider kembali ke kepemilikan
  `providers[]` lama dan `cliBackends[]` tingkat atas ketika metadata activation provider
  eksplisit hilang

Diagnostik perencana dapat membedakan petunjuk activation eksplisit dari fallback
kepemilikan manifes. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
perencana menggunakan kepemilikan `commandAliases` sebagai gantinya. Label alasan ini ditujukan untuk
diagnostik host dan pengujian; penulis plugin harus tetap mendeklarasikan metadata
yang paling baik mendeskripsikan kepemilikan.

## referensi qaRunners

Gunakan `qaRunners` ketika plugin menyumbangkan satu atau beberapa runner transport di bawah
root `openclaw qa` bersama. Jaga metadata ini tetap murah dan statis; runtime plugin
tetap memiliki pendaftaran CLI aktual melalui permukaan
`runtime-api.ts` ringan yang mengekspor `qaRunnerCliRegistrations`.

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
| `description` | Tidak | `string` | Teks bantuan fallback yang digunakan ketika host bersama memerlukan perintah stub. |

## referensi setup

Gunakan `setup` ketika permukaan setup dan onboarding memerlukan metadata milik plugin yang murah
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

`cliBackends` tingkat atas tetap valid dan terus mendeskripsikan backend inferensi CLI.
`setup.cliBackends` adalah permukaan deskriptor khusus setup untuk
alur control-plane/setup yang harus tetap hanya-metadata.

Jika ada, `setup.providers` dan `setup.cliBackends` adalah permukaan pencarian
berbasis deskriptor yang disukai untuk penemuan setup. Jika deskriptor hanya
mempersempit kandidat plugin dan setup masih memerlukan hook runtime saat-setup yang lebih kaya,
tetapkan `requiresRuntime: true` dan pertahankan `setup-api` sebagai
jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam pencarian auth provider generik dan
env-var. `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas
selama jendela deprekasi, tetapi plugin non-bawaan yang masih menggunakannya
menerima diagnostik manifes. Plugin baru harus menaruh metadata env setup/status
pada `setup.providers[].envVars`.

OpenClaw juga dapat menurunkan pilihan setup sederhana dari `setup.providers[].authMethods`
ketika tidak ada entri setup yang tersedia, atau ketika `setup.requiresRuntime: false`
mendeklarasikan bahwa runtime setup tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap
diprioritaskan untuk label kustom, flag CLI, cakupan onboarding, dan metadata asisten.

Tetapkan `requiresRuntime: false` hanya ketika deskriptor tersebut cukup untuk
permukaan setup. OpenClaw memperlakukan `false` eksplisit sebagai kontrak hanya-deskriptor
dan tidak akan mengeksekusi `setup-api` atau `openclaw.setupEntry` untuk pencarian setup. Jika
plugin hanya-deskriptor masih mengirimkan salah satu entri runtime setup tersebut,
OpenClaw melaporkan diagnostik aditif dan terus mengabaikannya. `requiresRuntime`
yang dihilangkan mempertahankan perilaku fallback lama sehingga plugin yang sudah ada yang menambahkan
deskriptor tanpa flag tidak rusak.

Karena pencarian setup dapat mengeksekusi kode `setup-api` milik plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
plugin yang ditemukan. Kepemilikan ambigu gagal tertutup alih-alih memilih
pemenang dari urutan penemuan.

Ketika runtime setup dieksekusi, diagnostik registry setup melaporkan penyimpangan deskriptor
jika `setup-api` mendaftarkan provider atau backend CLI yang tidak dideklarasikan oleh
deskriptor manifes, atau jika sebuah deskriptor tidak memiliki pendaftaran runtime yang cocok.
Diagnostik ini bersifat aditif dan tidak menolak plugin lama.

### referensi setup.providers

| Bidang         | Wajib | Tipe       | Artinya                                                                                          |
| -------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ya    | `string`   | Id provider yang diekspos selama setup atau onboarding. Jaga id yang dinormalisasi tetap unik secara global. |
| `authMethods`  | Tidak | `string[]` | Id metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.                      |
| `envVars`      | Tidak | `string[]` | Env var yang dapat diperiksa permukaan setup/status generik sebelum runtime plugin dimuat.       |
| `authEvidence` | Tidak | `object[]` | Pemeriksaan bukti auth lokal yang murah untuk provider yang dapat diautentikasi melalui marker non-rahasia. |

`authEvidence` ditujukan untuk penanda kredensial lokal milik penyedia yang dapat
diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap ringan dan
lokal: tanpa panggilan jaringan, tanpa pembacaan keychain atau secret-manager,
tanpa perintah shell, dan tanpa probe API penyedia.

Entri bukti yang didukung:

| Bidang             | Wajib | Tipe       | Artinya                                                                                                      |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Ya    | `string`   | Saat ini `local-file-with-env`.                                                                              |
| `fileEnvVar`       | Tidak | `string`   | Variabel env yang berisi path file kredensial eksplisit.                                                     |
| `fallbackPaths`    | Tidak | `string[]` | Path file kredensial lokal yang diperiksa ketika `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak | `string[]` | Setidaknya satu variabel env yang tercantum harus tidak kosong sebelum bukti valid.                          |
| `requiresAllEnv`   | Tidak | `string[]` | Setiap variabel env yang tercantum harus tidak kosong sebelum bukti valid.                                   |
| `credentialMarker` | Ya    | `string`   | Penanda non-rahasia yang dikembalikan ketika bukti ada.                                                      |
| `source`           | Tidak | `string`   | Label sumber yang terlihat pengguna untuk keluaran autentikasi/status.                                       |

### Bidang setup

| Bidang             | Wajib | Tipe       | Artinya                                                                                         |
| ------------------ | ----- | ---------- | ----------------------------------------------------------------------------------------------- |
| `providers`        | Tidak | `object[]` | Deskriptor setup penyedia yang diekspos selama setup dan onboarding.                            |
| `cliBackends`      | Tidak | `string[]` | Id backend waktu setup yang digunakan untuk pencarian setup berbasis deskriptor terlebih dahulu. Jaga agar id ternormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | Id migrasi konfigurasi yang dimiliki oleh permukaan setup plugin ini.                           |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah pencarian deskriptor.                |

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
dibaca OpenClaw tanpa mengimpor runtime plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Id factory ekstensi server aplikasi Codex, saat ini `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Id runtime yang dapat didaftarkan plugin bundel untuk middleware hasil alat. |
| `externalAuthProviders`          | `string[]` | Id penyedia yang hook profil autentikasi eksternalnya dimiliki plugin ini. |
| `speechProviders`                | `string[]` | Id penyedia speech yang dimiliki plugin ini.                          |
| `realtimeTranscriptionProviders` | `string[]` | Id penyedia transkripsi realtime yang dimiliki plugin ini.            |
| `realtimeVoiceProviders`         | `string[]` | Id penyedia suara realtime yang dimiliki plugin ini.                  |
| `memoryEmbeddingProviders`       | `string[]` | Id penyedia embedding memori yang dimiliki plugin ini.                |
| `mediaUnderstandingProviders`    | `string[]` | Id penyedia pemahaman media yang dimiliki plugin ini.                 |
| `imageGenerationProviders`       | `string[]` | Id penyedia pembuatan gambar yang dimiliki plugin ini.                |
| `videoGenerationProviders`       | `string[]` | Id penyedia pembuatan video yang dimiliki plugin ini.                 |
| `webFetchProviders`              | `string[]` | Id penyedia pengambilan web yang dimiliki plugin ini.                 |
| `webSearchProviders`             | `string[]` | Id penyedia pencarian web yang dimiliki plugin ini.                   |
| `migrationProviders`             | `string[]` | Id penyedia impor yang dimiliki plugin ini untuk `openclaw migrate`.  |
| `tools`                          | `string[]` | Nama alat agen yang dimiliki plugin ini.                              |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory ekstensi
khusus server aplikasi Codex yang dibundel. Transformasi hasil alat yang
dibundel sebaiknya mendeklarasikan `contracts.agentToolResultMiddleware` dan
mendaftar dengan `api.registerAgentToolResultMiddleware(...)` sebagai gantinya.
Plugin eksternal tidak dapat mendaftarkan middleware hasil alat karena seam dapat
menulis ulang keluaran alat dengan kepercayaan tinggi sebelum model melihatnya.

Registrasi runtime `api.registerTool(...)` harus cocok dengan `contracts.tools`.
Penemuan alat menggunakan daftar ini untuk memuat hanya runtime plugin yang dapat
memiliki alat yang diminta.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` sebaiknya
mendeklarasikan `contracts.externalAuthProviders`. Plugin tanpa deklarasi masih
berjalan melalui fallback kompatibilitas yang sudah usang, tetapi fallback itu
lebih lambat dan akan dihapus setelah jendela migrasi.

Penyedia embedding memori yang dibundel sebaiknya mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap id adaptor yang mereka
ekspos, termasuk adaptor bawaan seperti `local`. Path CLI mandiri menggunakan
kontrak manifes ini untuk memuat hanya plugin pemilik sebelum runtime Gateway
penuh mendaftarkan penyedia.

## Referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` ketika penyedia pemahaman media
memiliki model default, prioritas fallback autentikasi otomatis, atau dukungan
dokumen native yang diperlukan helper inti generik sebelum runtime dimuat. Kunci
juga harus dideklarasikan di `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Kapabilitas media yang diekspos oleh penyedia ini.                           |
| `defaultModels`        | `Record<string, string>`            | Default kapabilitas-ke-model yang digunakan ketika konfigurasi tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka lebih rendah diurutkan lebih awal untuk fallback penyedia berbasis kredensial otomatis. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh penyedia.                            |

## Referensi channelConfigs

Gunakan `channelConfigs` ketika plugin kanal memerlukan metadata konfigurasi
ringan sebelum runtime dimuat. Penemuan setup/status kanal hanya-baca dapat
menggunakan metadata ini secara langsung untuk kanal eksternal yang
dikonfigurasi ketika tidak ada entri setup yang tersedia, atau ketika
`setup.requiresRuntime: false` mendeklarasikan runtime setup tidak diperlukan.

`channelConfigs` adalah metadata manifes plugin, bukan bagian konfigurasi
pengguna tingkat atas yang baru. Pengguna tetap mengonfigurasi instance kanal di
bawah `channels.<channel-id>`. OpenClaw membaca metadata manifes untuk
menentukan plugin mana yang memiliki kanal terkonfigurasi itu sebelum kode
runtime plugin dijalankan.

Untuk plugin kanal, `configSchema` dan `channelConfigs` menjelaskan path yang
berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin non-bundel yang mendeklarasikan `channels[]` sebaiknya juga
mendeklarasikan entri `channelConfigs` yang cocok. Tanpa entri tersebut,
OpenClaw masih dapat memuat plugin, tetapi skema konfigurasi cold-path, setup,
dan permukaan UI Kontrol tidak dapat mengetahui bentuk opsi milik kanal sampai
runtime plugin dijalankan.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan
`nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk
pemeriksaan konfigurasi perintah yang berjalan sebelum runtime kanal dimuat.
Kanal bundel juga dapat menerbitkan default yang sama melalui
`package.json#openclaw.channel.commands` bersama metadata katalog kanal milik
paket lainnya.

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

Setiap entri kanal dapat menyertakan:

| Bidang        | Tipe                     | Artinya                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label/placeholder/petunjuk sensitif UI opsional untuk bagian konfigurasi channel tersebut. |
| `label`       | `string`                 | Label channel yang digabungkan ke permukaan pemilih dan inspeksi saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi singkat channel untuk permukaan inspeksi dan katalog.                          |
| `commands`    | `object`                 | Perintah native statis dan default otomatis skill native untuk pemeriksaan konfigurasi pra-runtime. |
| `preferOver`  | `string[]`               | Id plugin lama atau berprioritas lebih rendah yang harus dikalahkan channel ini di permukaan pemilihan. |

### Mengganti plugin channel lain

Gunakan `preferOver` saat plugin Anda adalah pemilik yang diutamakan untuk id channel yang
juga dapat disediakan oleh plugin lain. Kasus umum mencakup id plugin yang diganti nama,
plugin mandiri yang menggantikan plugin bawaan, atau fork terpelihara yang
mempertahankan id channel yang sama demi kompatibilitas konfigurasi.

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

Saat `channels.chat` dikonfigurasi, OpenClaw mempertimbangkan id channel dan
id plugin yang diutamakan. Jika plugin berprioritas lebih rendah hanya dipilih karena
plugin tersebut bawaan atau diaktifkan secara default, OpenClaw menonaktifkannya dalam
konfigurasi runtime efektif sehingga satu plugin memiliki channel dan alatnya. Pemilihan
pengguna yang eksplisit tetap menang: jika pengguna secara eksplisit mengaktifkan kedua plugin,
OpenClaw mempertahankan pilihan tersebut dan melaporkan diagnostik channel/alat duplikat alih-alih
diam-diam mengubah kumpulan plugin yang diminta.

Jaga agar `preferOver` tetap terbatas pada id plugin yang benar-benar dapat menyediakan channel yang sama.
Ini bukan bidang prioritas umum dan tidak mengganti nama kunci konfigurasi pengguna.

## Referensi modelSupport

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin penyedia Anda dari
id model singkat seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum runtime plugin
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

- referensi `provider/model` eksplisit menggunakan metadata manifes `providers` pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan penyedia

Bidang:

| Bidang          | Tipe       | Artinya                                                                       |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefix yang dicocokkan dengan `startsWith` terhadap id model singkat.         |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model singkat setelah penghapusan sufiks profil. |

## Referensi modelCatalog

Gunakan `modelCatalog` saat OpenClaw harus mengetahui metadata model penyedia sebelum
memuat runtime plugin. Ini adalah sumber milik manifes untuk baris katalog tetap,
alias penyedia, aturan supresi, dan mode penemuan. Penyegaran runtime
tetap berada di kode runtime penyedia, tetapi manifes memberi tahu core kapan runtime
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
| `providers`    | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki plugin ini. Kunci juga harus muncul di `providers` tingkat atas. |
| `aliases`      | `Record<string, object>`                                 | Alias penyedia yang harus di-resolve ke penyedia milik sendiri untuk perencanaan katalog atau supresi.      |
| `suppressions` | `object[]`                                               | Baris model dari sumber lain yang disupresi plugin ini karena alasan khusus penyedia.                       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, disegarkan ke cache, atau memerlukan runtime.   |

`aliases` berpartisipasi dalam pencarian kepemilikan penyedia untuk perencanaan katalog model.
Target alias harus berupa penyedia tingkat atas yang dimiliki oleh plugin yang sama. Saat daftar
yang difilter berdasarkan penyedia menggunakan alias, OpenClaw dapat membaca manifes pemilik dan
menerapkan penimpaan API/base URL alias tanpa memuat runtime penyedia.
Alias tidak memperluas daftar katalog tanpa filter; daftar luas hanya memancarkan
baris penyedia kanonis milik pemilik.

`suppressions` menggantikan hook `suppressBuiltInModel` runtime penyedia lama.
Entri supresi hanya dihormati saat penyedia dimiliki oleh plugin atau
dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia milik sendiri. Hook
supresi runtime tidak lagi dipanggil selama resolusi model.

Bidang penyedia:

| Bidang    | Tipe                     | Artinya                                                              |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL default opsional untuk model dalam katalog penyedia ini.    |
| `api`     | `ModelApi`               | Adapter API default opsional untuk model dalam katalog penyedia ini. |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.      |
| `models`  | `object[]`               | Baris model wajib. Baris tanpa `id` diabaikan.                       |

Bidang model:

| Bidang          | Tipe                                                           | Artinya                                                                     |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id model lokal penyedia, tanpa prefix `provider/`.                          |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                     |
| `api`           | `ModelApi`                                                     | Penimpaan API per model opsional.                                           |
| `baseUrl`       | `string`                                                       | Penimpaan base URL per model opsional.                                      |
| `headers`       | `Record<string, string>`                                       | Header statis per model opsional.                                           |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitas yang diterima model.                                              |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku penalaran.                                 |
| `contextWindow` | `number`                                                       | Jendela konteks native penyedia.                                            |
| `contextTokens` | `number`                                                       | Batas konteks runtime efektif opsional saat berbeda dari `contextWindow`.   |
| `maxTokens`     | `number`                                                       | Token output maksimum jika diketahui.                                       |
| `cost`          | `object`                                                       | Harga USD per sejuta token opsional, termasuk `tieredPricing` opsional.     |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas konfigurasi model OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status daftar. Supresi hanya saat baris sama sekali tidak boleh muncul.     |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan bersama status non-tersedia.               |
| `replaces`      | `string[]`                                                     | Id model lokal penyedia lama yang digantikan model ini.                     |
| `replacedBy`    | `string`                                                       | Id model lokal penyedia pengganti untuk baris yang usang.                   |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh pemilih dan filter.                          |

Bidang supresi:

| Bidang                     | Tipe       | Artinya                                                                                                      |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Id penyedia untuk baris upstream yang akan disupresi. Harus dimiliki plugin ini atau dideklarasikan sebagai alias milik sendiri. |
| `model`                    | `string`   | Id model lokal penyedia yang akan disupresi.                                                                 |
| `reason`                   | `string`   | Pesan opsional yang ditampilkan saat baris yang disupresi diminta secara langsung.                           |
| `when.baseUrlHosts`        | `string[]` | Daftar opsional host base URL penyedia efektif yang diperlukan sebelum supresi berlaku.                      |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi penyedia yang persis diperlukan sebelum supresi berlaku.             |

Jangan letakkan data khusus runtime di `modelCatalog`. Gunakan `static` hanya ketika baris manifest
cukup lengkap agar permukaan daftar yang difilter berdasarkan penyedia dan pemilih dapat melewati
penemuan registry/runtime. Gunakan `refreshable` ketika baris manifest berguna sebagai seed atau
suplemen yang dapat dicantumkan, tetapi refresh/cache dapat menambahkan lebih banyak baris nanti;
baris refreshable tidak bersifat otoritatif dengan sendirinya. Gunakan `runtime` ketika OpenClaw
harus memuat runtime penyedia untuk mengetahui daftarnya.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan id model murah milik penyedia yang harus
terjadi sebelum runtime penyedia dimuat. Ini menjaga alias seperti nama model pendek,
id lama lokal penyedia, dan aturan prefiks proxy tetap berada di manifest plugin pemiliknya
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

Bidang penyedia:

| Bidang                               | Tipe                    | Artinya                                                                                  |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias id model persis tanpa peka huruf besar-kecil. Nilai dikembalikan seperti ditulis. |
| `stripPrefixes`                      | `string[]`              | Prefiks yang dihapus sebelum pencarian alias, berguna untuk duplikasi penyedia/model lama. |
| `prefixWhenBare`                     | `string`                | Prefiks yang ditambahkan ketika id model yang dinormalisasi belum berisi `/`.            |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan prefiks id polos bersyarat setelah pencarian alias, dikunci oleh `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi endpoint yang harus diketahui oleh kebijakan
permintaan generik sebelum runtime penyedia dimuat. Inti tetap memiliki makna setiap
`endpointClass`; manifest plugin memiliki metadata host dan URL dasar.

Bidang endpoint:

| Bidang                         | Tipe       | Artinya                                                                                       |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint inti yang dikenal, seperti `openrouter`, `moonshot-native`, atau `google-vertex`. |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                            |
| `hostSuffixes`                 | `string[]` | Sufiks host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus sufiks domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi persis yang dipetakan ke kelas endpoint.                     |
| `googleVertexRegion`           | `string`   | Region Google Vertex statis untuk host global persis.                                        |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks yang dihapus dari host yang cocok untuk mengekspos prefiks region Google Vertex.       |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan murah yang dibutuhkan
kebijakan permintaan generik tanpa memuat runtime penyedia. Simpan penulisan ulang payload
khusus perilaku di hook runtime penyedia atau helper keluarga penyedia bersama.

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

Bidang penyedia:

| Bidang                | Tipe         | Artinya                                                                            |
| --------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `family`              | `string`     | Label keluarga penyedia yang digunakan oleh keputusan kompatibilitas permintaan generik dan diagnostik. |
| `compatibilityFamily` | `"moonshot"` | Bucket kompatibilitas keluarga penyedia opsional untuk helper permintaan bersama. |
| `openAICompletions`   | `object`     | Flag permintaan completions yang kompatibel dengan OpenAI, saat ini `supportsStreamingUsage`. |

## Referensi modelPricing

Gunakan `modelPricing` ketika penyedia membutuhkan perilaku harga bidang kontrol sebelum
runtime dimuat. Cache harga Gateway membaca metadata ini tanpa mengimpor
kode runtime penyedia.

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

Bidang penyedia:

| Bidang       | Tipe              | Artinya                                                                                       |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Tetapkan `false` untuk penyedia lokal/self-hosted yang tidak boleh mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan pencarian harga OpenRouter. `false` menonaktifkan pencarian OpenRouter untuk penyedia ini. |
| `liteLLM`    | `false \| object` | Pemetaan pencarian harga LiteLLM. `false` menonaktifkan pencarian LiteLLM untuk penyedia ini. |

Bidang sumber:

| Bidang                     | Tipe               | Artinya                                                                                                         |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id penyedia katalog eksternal ketika berbeda dari id penyedia OpenClaw, misalnya `z-ai` untuk penyedia `zai`.  |
| `passthroughProviderModel` | `boolean`          | Perlakukan id model yang berisi garis miring sebagai ref penyedia/model bertingkat, berguna untuk penyedia proxy seperti OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varian id model katalog eksternal tambahan. `version-dots` mencoba id versi bertitik seperti `claude-opus-4.6`. |

### Indeks Penyedia OpenClaw

Indeks Penyedia OpenClaw adalah metadata pratinjau milik OpenClaw untuk penyedia
yang pluginnya mungkin belum terpasang. Ini bukan bagian dari manifest plugin.
Manifest plugin tetap menjadi otoritas plugin terpasang. Indeks Penyedia adalah
kontrak fallback internal yang akan digunakan permukaan penyedia yang dapat dipasang dan
pemilih model pra-instalasi di masa mendatang ketika plugin penyedia belum terpasang.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. `modelCatalog` manifest plugin terpasang.
3. Cache katalog model dari refresh eksplisit.
4. Baris pratinjau Indeks Penyedia OpenClaw.

Indeks Penyedia tidak boleh berisi rahasia, status aktif, hook runtime, atau
data model khusus akun live. Katalog pratinjaunya menggunakan bentuk baris penyedia
`modelCatalog` yang sama seperti manifest plugin, tetapi sebaiknya tetap terbatas
pada metadata tampilan stabil kecuali bidang adapter runtime seperti `api`,
`baseUrl`, harga, atau flag kompatibilitas sengaja dijaga selaras dengan
manifest plugin terpasang. Penyedia dengan penemuan `/models` live harus
menulis baris yang direfresh melalui jalur cache katalog model eksplisit, alih-alih
membuat daftar normal atau onboarding memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata plugin yang dapat dipasang untuk penyedia
yang pluginnya telah dipindahkan keluar dari inti atau belum terpasang. Metadata ini
mencerminkan pola katalog channel: nama paket, spesifikasi instal npm,
integritas yang diharapkan, dan label pilihan auth murah sudah cukup untuk menampilkan
opsi penyiapan yang dapat dipasang. Setelah plugin terpasang, manifestnya menang dan
entri Indeks Penyedia diabaikan untuk penyedia tersebut.

Kunci kapabilitas tingkat atas lama sudah tidak digunakan. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan bidang tingkat atas tersebut sebagai kepemilikan
kapabilitas.

## Manifest versus package.json

Kedua file melayani tugas yang berbeda:

| File                   | Gunakan untuk                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Penemuan, validasi konfigurasi, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode plugin berjalan              |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, penyiapan, atau metadata katalog |

Jika Anda tidak yakin tempat sebuah metadata seharusnya berada, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika berkaitan dengan pengemasan, file entri, atau perilaku instal npm, letakkan di `package.json`

### Bidang package.json yang memengaruhi penemuan

Sebagian metadata plugin pra-runtime sengaja berada di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.
`openclaw.bundle` dan `openclaw.bundle.json` bukan kontrak plugin OpenClaw;
plugin native harus menggunakan `openclaw.plugin.json` plus bidang
`package.json#openclaw` yang didukung di bawah ini.

Contoh penting:

| Bidang                                                                                     | Artinya                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Mendeklarasikan entrypoint Plugin native. Harus tetap berada di dalam direktori paket Plugin.                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Mendeklarasikan entrypoint runtime JavaScript yang telah dibangun untuk paket terpasang. Harus tetap berada di dalam direktori paket Plugin.                                        |
| `openclaw.setupEntry`                                                                      | Entrypoint ringan khusus penyiapan yang digunakan selama onboarding, startup channel yang ditunda, dan penemuan status channel/SecretRef baca-saja. Harus tetap berada di dalam direktori paket Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Mendeklarasikan entrypoint penyiapan JavaScript yang telah dibangun untuk paket terpasang. Memerlukan `setupEntry`, harus ada, dan harus tetap berada di dalam direktori paket Plugin. |
| `openclaw.channel`                                                                         | Metadata katalog channel yang murah seperti label, jalur docs, alias, dan salinan seleksi.                                                                                          |
| `openclaw.channel.commands`                                                                | Metadata statis perintah native dan default otomatis skill native yang digunakan oleh permukaan config, audit, dan daftar perintah sebelum runtime channel dimuat.                   |
| `openclaw.channel.configuredState`                                                         | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah penyiapan khusus env sudah ada?" tanpa memuat runtime channel penuh.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Metadata pemeriksa persisted-auth ringan yang dapat menjawab "apakah ada yang sudah masuk?" tanpa memuat runtime channel penuh.                                                     |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Petunjuk pemasangan/pembaruan untuk Plugin bawaan dan Plugin yang dipublikasikan secara eksternal.                                                                                  |
| `openclaw.install.defaultChoice`                                                           | Jalur pemasangan yang dipilih ketika beberapa sumber pemasangan tersedia.                                                                                                           |
| `openclaw.install.minHostVersion`                                                          | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22` atau `>=2026.5.1-beta.1`.                                                          |
| `openclaw.install.expectedIntegrity`                                                       | String integritas dist npm yang diharapkan seperti `sha512-...`; alur pemasangan dan pembaruan memverifikasi artefak yang diambil terhadap nilai ini.                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Mengizinkan jalur pemulihan pemasangan ulang Plugin bawaan yang sempit saat config tidak valid.                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Memungkinkan permukaan channel khusus penyiapan dimuat sebelum Plugin channel penuh selama startup.                                                                                 |

Metadata manifest menentukan pilihan provider/channel/penyiapan mana yang muncul dalam
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan Plugin tersebut saat pengguna memilih salah satu
pilihan itu. Jangan pindahkan petunjuk pemasangan ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama pemasangan dan pemuatan registry
manifest untuk sumber Plugin non-bawaan. Nilai yang tidak valid ditolak;
nilai yang lebih baru tetapi valid akan melewati Plugin eksternal pada host lama. Sumber
Plugin bawaan diasumsikan memiliki versi yang sejalan dengan checkout host.

Metadata install-on-demand resmi sebaiknya menggunakan `clawhubSpec` ketika Plugin
dipublikasikan di ClawHub; onboarding memperlakukan itu sebagai sumber jarak jauh yang dipilih dan
mencatat fakta artefak ClawHub setelah pemasangan. `npmSpec` tetap menjadi fallback
kompatibilitas untuk paket yang belum berpindah ke ClawHub.

Pematokan versi npm persis sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
sebaiknya memasangkan spesifikasi persis dengan `expectedIntegrity` agar alur pembaruan gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang dipatok.
Onboarding interaktif tetap menawarkan spesifikasi npm registry tepercaya, termasuk nama
paket polos dan dist-tag, untuk kompatibilitas. Diagnostik katalog dapat
membedakan sumber exact, floating, integrity-pinned, missing-integrity, package-name
mismatch, dan invalid default-choice. Diagnostik juga memperingatkan ketika
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat dipatok olehnya.
Saat `expectedIntegrity` ada,
alur pemasangan/pembaruan memberlakukannya; saat dihilangkan, resolusi registry
dicatat tanpa pin integritas.

Plugin channel sebaiknya menyediakan `openclaw.setupEntry` saat status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang terkonfigurasi tanpa memuat runtime
penuh. Entri penyiapan sebaiknya mengekspos metadata channel plus adapter config,
status, dan rahasia yang aman untuk penyiapan; simpan klien jaringan, listener Gateway, dan
runtime transport di entrypoint ekstensi utama.

Bidang entrypoint runtime tidak menimpa pemeriksaan batas paket untuk bidang
entrypoint sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat jalur
`openclaw.extensions` yang keluar batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja sempit. Ini tidak
membuat config rusak sembarang menjadi dapat dipasang. Saat ini, ini hanya mengizinkan alur
pemasangan pulih dari kegagalan upgrade Plugin bawaan usang tertentu, seperti jalur
Plugin bawaan yang hilang atau entri `channels.<id>` usang untuk Plugin bawaan yang sama.
Error config yang tidak terkait tetap memblokir pemasangan dan mengarahkan operator
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

Gunakan ini saat penyiapan, doctor, status, atau alur presence baca-saja membutuhkan probe auth
ya/tidak yang murah sebelum Plugin channel penuh dimuat. Status auth tersimpan bukan
status channel terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan Plugin otomatis,
memperbaiki dependensi runtime, atau memutuskan apakah runtime channel harus dimuat.
Export target sebaiknya berupa fungsi kecil yang hanya membaca status tersimpan; jangan
merutekannya melalui barrel runtime channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured
khusus env yang murah:

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

Gunakan ini saat channel dapat menjawab configured-state dari env atau input kecil
non-runtime lainnya. Jika pemeriksaan membutuhkan resolusi config penuh atau runtime
channel nyata, simpan logika tersebut di hook `config.hasConfiguredState`
Plugin.

## Presedensi penemuan (id Plugin duplikat)

OpenClaw menemukan Plugin dari beberapa root (bawaan, pemasangan global, workspace, jalur pilihan config eksplisit). Jika dua penemuan berbagi `id` yang sama, hanya manifest dengan **presedensi tertinggi** yang dipertahankan; duplikat dengan presedensi lebih rendah dibuang alih-alih dimuat berdampingan dengannya.

Presedensi, dari tertinggi ke terendah:

1. **Dipilih config** — jalur yang secara eksplisit dipatok di `plugins.entries.<id>`
2. **Bawaan** — Plugin yang dikirim bersama OpenClaw
3. **Pemasangan global** — Plugin yang dipasang ke root Plugin global OpenClaw
4. **Workspace** — Plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau usang dari Plugin bawaan yang berada di workspace tidak akan menutupi build bawaan.
- Untuk benar-benar menimpa Plugin bawaan dengan Plugin lokal, patok melalui `plugins.entries.<id>` agar menang berdasarkan presedensi, bukan bergantung pada penemuan workspace.
- Pembuangan duplikat dicatat sehingga Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.
- Override duplikat yang dipilih config ditulis sebagai override eksplisit dalam diagnostik, tetapi tetap memperingatkan agar fork usang dan shadow yang tidak disengaja tetap terlihat.

## Persyaratan JSON Schema

- **Setiap Plugin harus mengirimkan JSON Schema**, meskipun tidak menerima config.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat config dibaca/ditulis, bukan saat runtime.
- Saat memperluas atau mem-fork Plugin bawaan dengan kunci config baru, perbarui `configSchema` `openclaw.plugin.json` Plugin tersebut pada saat yang sama. Skema Plugin bawaan bersifat ketat, jadi menambahkan `plugins.entries.<id>.config.myNewKey` dalam config pengguna tanpa menambahkan `myNewKey` ke `configSchema.properties` akan ditolak sebelum runtime Plugin dimuat.

Contoh ekstensi skema:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **error**, kecuali id channel dideklarasikan oleh
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk pada id Plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **error**.
- Jika Plugin terpasang tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error Plugin.
- Jika config Plugin ada tetapi Plugin **dinonaktifkan**, config dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema lengkap `plugins.*`.

## Catatan

- Manifest **wajib untuk Plugin OpenClaw native**, termasuk pemuatan sistem berkas lokal. Runtime tetap memuat modul Plugin secara terpisah; manifest hanya untuk penemuan + validasi.
- Manifest native diuraikan dengan JSON5, sehingga komentar, koma di akhir, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya kolom manifest yang terdokumentasi yang dibaca oleh pemuat manifest. Hindari kunci tingkat atas kustom.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan saat Plugin tidak membutuhkannya.
- `providerCatalogEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog penyedia statis atau deskriptor penemuan yang sempit, bukan eksekusi waktu permintaan. `providerDiscoveryEntry` adalah ejaan lama dan masih berfungsi untuk Plugin yang ada.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (bawaan `legacy`).
- Deklarasikan jenis Plugin eksklusif dalam manifest ini. `OpenClawPluginDefinition.kind` pada entri runtime sudah usang dan tetap ada hanya sebagai fallback kompatibilitas untuk Plugin lama.
- Metadata variabel env (`setup.providers[].envVars`, `providerAuthEnvVars` yang sudah usang, dan `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman Cron, dan permukaan baca-saja lainnya tetap menerapkan kebijakan kepercayaan Plugin dan aktivasi efektif sebelum memperlakukan variabel env sebagai sudah dikonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode penyedia, lihat [hook runtime penyedia](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist pengelola paket apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Membangun Plugin" href="/id/plugins/building-plugins" icon="rocket">
    Memulai dengan Plugin.
  </Card>
  <Card title="Arsitektur Plugin" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model kapabilitas.
  </Card>
  <Card title="Ringkasan SDK" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK Plugin dan impor subpath.
  </Card>
</CardGroup>
