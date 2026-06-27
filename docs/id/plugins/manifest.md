---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu merilis skema konfigurasi Plugin atau men-debug kesalahan validasi Plugin
summary: Persyaratan manifes Plugin + skema JSON (validasi konfigurasi ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini hanya untuk **manifes Plugin OpenClaw native**.

Untuk tata letak bundel yang kompatibel, lihat [Bundel Plugin](/id/plugins/bundles).

Format bundel yang kompatibel menggunakan file manifes berbeda:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude
  default tanpa manifes
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundel tersebut, tetapi tata letak itu tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundel yang kompatibel, OpenClaw saat ini membaca metadata bundel plus root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundel Claude,
default LSP bundel Claude, dan paket hook yang didukung saat tata letaknya sesuai dengan
ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **wajib** mengirimkan file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifes ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifes yang hilang atau tidak valid diperlakukan sebagai
kesalahan Plugin dan memblokir validasi konfigurasi.

Lihat panduan sistem Plugin lengkap: [Plugin](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat kode
Plugin Anda**. Semua hal di bawah ini harus cukup ringan untuk diperiksa tanpa menjalankan
runtime Plugin.

**Gunakan untuk:**

- identitas Plugin, validasi konfigurasi, dan petunjuk UI konfigurasi
- metadata autentikasi, orientasi awal, dan penyiapan (alias, aktif otomatis, env var penyedia, pilihan autentikasi)
- petunjuk aktivasi untuk permukaan bidang kontrol
- kepemilikan singkat keluarga model
- snapshot statis kepemilikan kapabilitas (`contracts`)
- metadata runner QA yang dapat diperiksa host bersama `openclaw qa`
- metadata konfigurasi khusus channel yang digabungkan ke permukaan katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan entrypoint kode,
atau metadata instalasi npm. Hal-hal tersebut berada di kode Plugin Anda dan `package.json`.

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

## Referensi kolom tingkat atas

| Bidang                               | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                                                        |
| ------------------------------------ | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya       | `string`                         | id Plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                                                     |
| `configSchema`                       | Ya       | `object`                         | JSON Schema sebaris untuk konfigurasi Plugin ini.                                                                                                                                                                                             |
| `requiresPlugins`                    | Tidak    | `string[]`                       | id Plugin yang juga harus diinstal agar Plugin ini berdampak. Penemuan menjaga Plugin tetap dapat dimuat, tetapi memperingatkan saat ada Plugin wajib yang hilang.                                                                            |
| `enabledByDefault`                   | Tidak    | `true`                           | Menandai Plugin yang dibundel sebagai aktif secara bawaan. Hilangkan ini, atau tetapkan nilai apa pun selain `true`, untuk membiarkan Plugin nonaktif secara bawaan.                                                                          |
| `enabledByDefaultOnPlatforms`        | Tidak    | `string[]`                       | Menandai Plugin yang dibundel sebagai aktif secara bawaan hanya pada platform Node.js yang tercantum, misalnya `["darwin"]`. Konfigurasi eksplisit tetap menang.                                                                              |
| `legacyPluginIds`                    | Tidak    | `string[]`                       | id lama yang dinormalisasi ke id Plugin kanonis ini.                                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | Tidak    | `string[]`                       | id penyedia yang harus mengaktifkan Plugin ini secara otomatis saat auth, konfigurasi, atau referensi model menyebutkannya.                                                                                                                    |
| `kind`                               | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Tidak    | `string[]`                       | id saluran yang dimiliki oleh Plugin ini. Digunakan untuk penemuan dan validasi konfigurasi.                                                                                                                                                   |
| `providers`                          | Tidak    | `string[]`                       | id penyedia yang dimiliki oleh Plugin ini.                                                                                                                                                                                                    |
| `providerCatalogEntry`               | Tidak    | `string`                         | Jalur modul katalog penyedia ringan, relatif terhadap root Plugin, untuk metadata katalog penyedia bercakupan manifes yang dapat dimuat tanpa mengaktifkan runtime penuh Plugin.                                                              |
| `modelSupport`                       | Tidak    | `object`                         | Metadata keluarga model ringkas milik manifes yang digunakan untuk memuat otomatis Plugin sebelum runtime.                                                                                                                                     |
| `modelCatalog`                       | Tidak    | `object`                         | Metadata katalog model deklaratif untuk penyedia yang dimiliki oleh Plugin ini. Ini adalah kontrak bidang kontrol untuk daftar baca-saja, onboarding, pemilih model, alias, dan supresi di masa mendatang tanpa memuat runtime Plugin.        |
| `modelPricing`                       | Tidak    | `object`                         | Kebijakan pencarian harga eksternal milik penyedia. Gunakan untuk mengecualikan penyedia lokal/self-hosted dari katalog harga jarak jauh atau memetakan referensi penyedia ke id katalog OpenRouter/LiteLLM tanpa mengkodekan id penyedia di core. |
| `modelIdNormalization`               | Tidak    | `object`                         | Pembersihan alias/prefiks id model milik penyedia yang harus berjalan sebelum runtime penyedia dimuat.                                                                                                                                        |
| `providerEndpoints`                  | Tidak    | `object[]`                       | Metadata host/baseUrl endpoint milik manifes untuk rute penyedia yang harus diklasifikasikan core sebelum runtime penyedia dimuat.                                                                                                            |
| `providerRequest`                    | Tidak    | `object`                         | Metadata keluarga penyedia dan kompatibilitas permintaan yang murah digunakan oleh kebijakan permintaan generik sebelum runtime penyedia dimuat.                                                                                               |
| `secretProviderIntegrations`         | Tidak    | `Record<string, object>`         | Preset penyedia eksekusi SecretRef deklaratif yang dapat ditawarkan permukaan penyiapan atau instalasi tanpa mengkodekan integrasi khusus penyedia di core.                                                                                   |
| `cliBackends`                        | Tidak    | `string[]`                       | id backend inferensi CLI yang dimiliki oleh Plugin ini. Digunakan untuk aktivasi otomatis saat startup dari referensi konfigurasi eksplisit.                                                                                                  |
| `syntheticAuthRefs`                  | Tidak    | `string[]`                       | Referensi penyedia atau backend CLI yang hook auth sintetis milik Plugin-nya harus diperiksa selama penemuan model dingin sebelum runtime dimuat.                                                                                             |
| `nonSecretAuthMarkers`               | Tidak    | `string[]`                       | Nilai placeholder kunci API milik Plugin yang dibundel yang merepresentasikan status kredensial lokal, OAuth, atau ambien yang bukan rahasia.                                                                                                  |
| `commandAliases`                     | Tidak    | `object[]`                       | Nama perintah yang dimiliki oleh Plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI yang sadar Plugin sebelum runtime dimuat.                                                                                                   |
| `providerAuthEnvVars`                | Tidak    | `Record<string, string[]>`       | Metadata env kompatibilitas yang tidak digunakan lagi untuk pencarian auth/status penyedia. Utamakan `setup.providers[].envVars` untuk Plugin baru; OpenClaw masih membacanya selama jendela deprekasi.                                      |
| `providerAuthAliases`                | Tidak    | `Record<string, string>`         | id penyedia yang harus menggunakan ulang id penyedia lain untuk pencarian auth, misalnya penyedia pengodean yang berbagi kunci API penyedia dasar dan profil auth.                                                                             |
| `channelEnvVars`                     | Tidak    | `Record<string, string[]>`       | Metadata env saluran ringan yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk penyiapan saluran berbasis env atau permukaan auth yang harus dilihat helper startup/konfigurasi generik.                              |
| `providerAuthChoices`                | Tidak    | `object[]`                       | Metadata pilihan auth ringan untuk pemilih onboarding, resolusi penyedia pilihan, dan pengawatan flag CLI sederhana.                                                                                                                          |
| `activation`                         | Tidak    | `object`                         | Metadata perencana aktivasi ringan untuk pemuatan yang dipicu startup, penyedia, perintah, saluran, rute, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku sebenarnya.                                                |
| `setup`                              | Tidak    | `object`                         | Deskriptor penyiapan/onboarding ringan yang dapat diperiksa permukaan penemuan dan penyiapan tanpa memuat runtime Plugin.                                                                                                                     |
| `qaRunners`                          | Tidak    | `object[]`                       | Deskriptor runner QA ringan yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                                      |
| `contracts`                          | Tidak    | `object`                         | Snapshot kepemilikan kapabilitas statis untuk hook auth eksternal, embedding, ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, web-fetch, pencarian web, dan kepemilikan alat. |
| `mediaUnderstandingProviderMetadata` | Tidak    | `Record<string, object>`         | Bawaan pemahaman media ringan untuk id penyedia yang dideklarasikan di `contracts.mediaUnderstandingProviders`.                                                                                                                               |
| `imageGenerationProviderMetadata`    | Tidak    | `Record<string, object>`         | Metadata auth pembuatan gambar ringan untuk id penyedia yang dideklarasikan di `contracts.imageGenerationProviders`, termasuk alias auth milik penyedia dan penjaga base-url.                                                                |
| `videoGenerationProviderMetadata`    | Tidak    | `Record<string, object>`         | Metadata auth pembuatan video ringan untuk id penyedia yang dideklarasikan di `contracts.videoGenerationProviders`, termasuk alias auth milik penyedia dan penjaga base-url.                                                                 |
| `musicGenerationProviderMetadata`    | Tidak    | `Record<string, object>`         | Metadata auth pembuatan musik ringan untuk id penyedia yang dideklarasikan di `contracts.musicGenerationProviders`, termasuk alias auth milik penyedia dan penjaga base-url.                                                                 |
| `toolMetadata`                       | Tidak    | `Record<string, object>`         | Metadata ketersediaan ringan untuk alat milik Plugin yang dideklarasikan di `contracts.tools`. Gunakan ini saat alat tidak boleh memuat runtime kecuali ada bukti config, env, atau auth.                                                                       |
| `channelConfigs`                     | Tidak    | `Record<string, object>`         | Metadata config kanal milik manifes yang digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                                                                                      |
| `skills`                             | Tidak    | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root Plugin.                                                                                                                                                                                         |
| `name`                               | Tidak    | `string`                         | Nama Plugin yang mudah dibaca manusia.                                                                                                                                                                                                                     |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan Plugin.                                                                                                                                                                                                         |
| `icon`                               | Tidak    | `string`                         | URL gambar HTTPS untuk kartu marketplace/katalog. ClawHub menerima URL `https://` apa pun yang valid dan beralih ke ikon Plugin default saat ini dihilangkan atau tidak valid.                                                                              |
| `version`                            | Tidak    | `string`                         | Versi Plugin informasional.                                                                                                                                                                                                                   |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk kolom config.                                                                                                                                                                               |

## Referensi metadata penyedia generasi

Bidang metadata penyedia generasi menjelaskan sinyal auth statis untuk
penyedia yang dideklarasikan dalam daftar `contracts.*GenerationProviders` yang cocok.
OpenClaw membaca bidang ini sebelum runtime penyedia dimuat sehingga alat inti dapat
memutuskan apakah penyedia generasi tersedia tanpa mengimpor setiap
plugin penyedia.

Gunakan bidang ini hanya untuk fakta deklaratif yang murah. Transport, transformasi
permintaan, penyegaran token, validasi kredensial, dan perilaku generasi aktual
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

| Bidang                 | Wajib | Tipe       | Artinya                                                                                                                                         |
| ---------------------- | ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Tidak | `string[]` | ID penyedia tambahan yang harus dihitung sebagai alias auth statis untuk penyedia generasi.                                                     |
| `authProviders`        | Tidak | `string[]` | ID penyedia yang profil auth terkonfigurasinya harus dihitung sebagai auth untuk penyedia generasi ini.                                         |
| `configSignals`        | Tidak | `object[]` | Sinyal ketersediaan murah khusus konfigurasi untuk penyedia lokal atau di-hosting sendiri yang dapat dikonfigurasi tanpa profil auth atau env var. |
| `authSignals`          | Tidak | `object[]` | Sinyal auth eksplisit. Jika ada, ini menggantikan set sinyal default dari ID penyedia, `aliases`, dan `authProviders`.                          |
| `referenceAudioInputs` | Tidak | `boolean`  | Khusus generasi video. Setel ke `true` saat penyedia menerima aset audio referensi; jika tidak, `video_generate` menyembunyikan parameter referensi audio. |

Setiap entri `configSignals` mendukung:

| Bidang           | Wajib | Tipe       | Artinya                                                                                                                                                                              |
| ---------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`       | Ya    | `string`   | Path titik ke objek konfigurasi milik plugin yang akan diperiksa, misalnya `plugins.entries.example.config`.                                                                        |
| `overlayPath`    | Tidak | `string`   | Path titik di dalam konfigurasi root yang objeknya harus melapisi objek root sebelum mengevaluasi sinyal. Gunakan ini untuk konfigurasi spesifik kapabilitas seperti `image`, `video`, atau `music`. |
| `overlayMapPath` | Tidak | `string`   | Path titik di dalam konfigurasi root yang setiap nilai objeknya harus melapisi objek root. Gunakan ini untuk peta akun bernama seperti `accounts`, ketika akun terkonfigurasi mana pun harus memenuhi syarat. |
| `required`       | Tidak | `string[]` | Path titik di dalam konfigurasi efektif yang harus memiliki nilai terkonfigurasi. String tidak boleh kosong; objek dan array tidak boleh kosong.                                      |
| `requiredAny`    | Tidak | `string[]` | Path titik di dalam konfigurasi efektif yang setidaknya salah satunya harus memiliki nilai terkonfigurasi.                                                                           |
| `mode`           | Tidak | `object`   | Guard mode string opsional di dalam konfigurasi efektif. Gunakan ini saat ketersediaan khusus konfigurasi hanya berlaku untuk satu mode.                                             |

Setiap guard `mode` mendukung:

| Bidang       | Wajib | Tipe       | Artinya                                                                                 |
| ------------ | ----- | ---------- | --------------------------------------------------------------------------------------- |
| `path`       | Tidak | `string`   | Path titik di dalam konfigurasi efektif. Default ke `mode`.                             |
| `default`    | Tidak | `string`   | Nilai mode yang digunakan saat konfigurasi menghilangkan path.                          |
| `allowed`    | Tidak | `string[]` | Jika ada, sinyal lolos hanya saat mode efektif adalah salah satu dari nilai ini.        |
| `disallowed` | Tidak | `string[]` | Jika ada, sinyal gagal saat mode efektif adalah salah satu dari nilai ini.              |

Setiap entri `authSignals` mendukung:

| Bidang            | Wajib | Tipe     | Artinya                                                                                                                                                         |
| ----------------- | ----- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya    | `string` | ID penyedia yang akan diperiksa dalam profil auth terkonfigurasi.                                                                                               |
| `providerBaseUrl` | Tidak | `object` | Guard opsional yang membuat sinyal dihitung hanya saat penyedia terkonfigurasi yang dirujuk menggunakan URL dasar yang diizinkan. Gunakan ini saat alias auth hanya valid untuk API tertentu. |

Setiap guard `providerBaseUrl` mendukung:

| Bidang            | Wajib | Tipe       | Artinya                                                                                                                                                 |
| ----------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya    | `string`   | ID konfigurasi penyedia yang `baseUrl`-nya harus diperiksa.                                                                                             |
| `defaultBaseUrl`  | Tidak | `string`   | URL dasar yang diasumsikan saat konfigurasi penyedia menghilangkan `baseUrl`.                                                                           |
| `allowedBaseUrls` | Ya    | `string[]` | URL dasar yang diizinkan untuk sinyal auth ini. Sinyal diabaikan saat URL dasar terkonfigurasi atau default tidak cocok dengan salah satu nilai ternormalisasi ini. |

## Referensi metadata alat

`toolMetadata` menggunakan bentuk `configSignals` dan `authSignals` yang sama seperti
metadata penyedia generasi, dengan kunci berupa nama alat. `contracts.tools` mendeklarasikan
kepemilikan. `toolMetadata` mendeklarasikan bukti ketersediaan murah sehingga OpenClaw dapat
menghindari mengimpor runtime plugin hanya agar factory alatnya mengembalikan `null`.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
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

Jika sebuah alat tidak memiliki `toolMetadata`, OpenClaw mempertahankan perilaku yang ada dan
memuat plugin pemilik saat kontrak alat cocok dengan kebijakan. Untuk alat hot-path
yang factory-nya bergantung pada auth/konfigurasi, penulis plugin sebaiknya mendeklarasikan
`toolMetadata` alih-alih membuat inti mengimpor runtime untuk bertanya.

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membaca ini sebelum runtime penyedia dimuat.
Daftar penyiapan penyedia menggunakan pilihan manifes ini, pilihan penyiapan turunan deskriptor,
dan metadata katalog instalasi tanpa memuat runtime penyedia.

| Bidang                | Wajib | Tipe                                                                  | Artinya                                                                                                                  |
| --------------------- | ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | Ya    | `string`                                                              | ID provider yang memiliki pilihan ini.                                                                                   |
| `method`              | Ya    | `string`                                                              | ID metode autentikasi untuk diteruskan.                                                                                  |
| `choiceId`            | Ya    | `string`                                                              | ID pilihan autentikasi stabil yang digunakan oleh alur onboarding dan CLI.                                               |
| `choiceLabel`         | Tidak | `string`                                                              | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw kembali menggunakan `choiceId`.                            |
| `choiceHint`          | Tidak | `string`                                                              | Teks bantuan singkat untuk pemilih.                                                                                      |
| `assistantPriority`   | Tidak | `number`                                                              | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan asisten.                           |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                                        | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.                                  |
| `deprecatedChoiceIds` | Tidak | `string[]`                                                            | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                                |
| `groupId`             | Tidak | `string`                                                              | ID grup opsional untuk mengelompokkan pilihan terkait.                                                                   |
| `groupLabel`          | Tidak | `string`                                                              | Label yang terlihat oleh pengguna untuk grup tersebut.                                                                   |
| `groupHint`           | Tidak | `string`                                                              | Teks bantuan singkat untuk grup.                                                                                         |
| `optionKey`           | Tidak | `string`                                                              | Kunci opsi internal untuk alur autentikasi sederhana dengan satu flag.                                                   |
| `cliFlag`             | Tidak | `string`                                                              | Nama flag CLI, seperti `--openrouter-api-key`.                                                                           |
| `cliOption`           | Tidak | `string`                                                              | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                                           |
| `cliDescription`      | Tidak | `string`                                                              | Deskripsi yang digunakan dalam bantuan CLI.                                                                              |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Permukaan onboarding tempat pilihan ini seharusnya muncul. Jika dihilangkan, default-nya adalah `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` saat Plugin memiliki nama perintah runtime yang mungkin
keliru dimasukkan pengguna ke `plugins.allow` atau coba dijalankan sebagai
perintah CLI root. OpenClaw menggunakan metadata ini untuk diagnostik tanpa
mengimpor kode runtime Plugin.

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

| Bidang       | Wajib | Tipe              | Artinya                                                                           |
| ------------ | ----- | ----------------- | --------------------------------------------------------------------------------- |
| `name`       | Ya    | `string`          | Nama perintah yang dimiliki Plugin ini.                                           |
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai perintah garis miring chat, bukan perintah CLI root.       |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait untuk disarankan bagi operasi CLI, jika ada.            |

## Referensi activation

Gunakan `activation` saat Plugin dapat mendeklarasikan secara murah peristiwa
control-plane mana yang harus menyertakannya dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata perencana, bukan API siklus hidup. Blok ini tidak
mendaftarkan perilaku runtime, tidak menggantikan `register(...)`, dan tidak
menjanjikan bahwa kode Plugin sudah dieksekusi. Perencana aktivasi menggunakan
bidang-bidang ini untuk mempersempit kandidat Plugin sebelum kembali ke metadata
kepemilikan manifes yang sudah ada seperti `providers`, `channels`,
`commandAliases`, `setup.providers`, `contracts.tools`, dan hook.

Pilih metadata tersempit yang sudah menjelaskan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
saat bidang-bidang tersebut menyatakan relasinya. Gunakan `activation` untuk
petunjuk perencana tambahan yang tidak dapat direpresentasikan oleh bidang
kepemilikan tersebut.
Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`,
`my-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk
ID harness agen tertanam yang belum memiliki bidang kepemilikan.

Blok ini hanya metadata. Blok ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/Plugin
lainnya. Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum
pemuatan Plugin yang lebih luas, sehingga metadata aktivasi non-startup yang
hilang biasanya hanya berdampak pada performa; hal itu tidak seharusnya mengubah
kebenaran selama fallback kepemilikan manifes masih ada.

Setiap Plugin harus menetapkan `activation.onStartup` secara sengaja. Tetapkan
ke `true` hanya saat Plugin harus berjalan selama startup Gateway. Tetapkan ke
`false` saat Plugin inert saat startup dan hanya boleh dimuat dari pemicu yang
lebih sempit. Menghilangkan `onStartup` tidak lagi memuat Plugin saat startup
secara implisit; gunakan metadata aktivasi eksplisit untuk startup, channel,
konfigurasi, harness agen, memori, atau pemicu aktivasi lain yang lebih sempit.

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

| Bidang             | Wajib | Tipe                                                 | Artinya                                                                                                                                                                                  |
| ------------------ | ----- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Tidak | `boolean`                                            | Aktivasi startup Gateway eksplisit. Setiap Plugin harus menetapkan ini. `true` mengimpor Plugin selama startup; `false` membuatnya malas-startup kecuali pemicu lain yang cocok memerlukan pemuatan. |
| `onProviders`      | Tidak | `string[]`                                           | ID provider yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                           |
| `onAgentHarnesses` | Tidak | `string[]`                                           | ID runtime harness agen tertanam yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                         |
| `onCommands`       | Tidak | `string[]`                                           | ID perintah yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                           |
| `onChannels`       | Tidak | `string[]`                                           | ID channel yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                            |
| `onRoutes`         | Tidak | `string[]`                                           | Jenis rute yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                            |
| `onConfigPaths`    | Tidak | `string[]`                                           | Path konfigurasi relatif-root yang harus menyertakan Plugin ini dalam rencana startup/pemuatan saat path ada dan tidak dinonaktifkan secara eksplisit.                                  |
| `onCapabilities`   | Tidak | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan aktivasi control-plane. Pilih bidang yang lebih sempit jika memungkinkan.                                                     |

Konsumen live saat ini:

- Perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor
  startup eksplisit
- Perencanaan CLI yang dipicu perintah kembali ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- Perencanaan startup runtime agen menggunakan `activation.onAgentHarnesses`
  untuk harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI
- Perencanaan setup/channel yang dipicu channel kembali ke kepemilikan
  `channels[]` lama saat metadata aktivasi channel eksplisit tidak ada
- Perencanaan Plugin startup menggunakan `activation.onConfigPaths` untuk
  permukaan konfigurasi root non-channel seperti blok `browser` milik Plugin
  browser bawaan
- Perencanaan setup/runtime yang dipicu provider kembali ke kepemilikan
  `providers[]` lama dan `cliBackends[]` tingkat atas saat metadata aktivasi
  provider eksplisit tidak ada

Diagnostik perencana dapat membedakan petunjuk aktivasi eksplisit dari fallback
kepemilikan manifes. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
perencana menggunakan kepemilikan `commandAliases` sebagai gantinya. Label alasan
ini untuk diagnostik host dan pengujian; penulis Plugin harus tetap
mendeklarasikan metadata yang paling baik menjelaskan kepemilikan.

## Referensi qaRunners

Gunakan `qaRunners` saat Plugin menyumbangkan satu atau beberapa runner
transport di bawah root `openclaw qa` bersama. Jaga metadata ini tetap murah dan
statis; runtime Plugin tetap memiliki pendaftaran CLI aktual melalui permukaan
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
| `description` | Tidak | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

## referensi setup

Gunakan `setup` saat permukaan setup dan onboarding memerlukan metadata murah milik Plugin
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

`cliBackends` tingkat atas tetap valid dan terus mendeskripsikan backend inferensi
CLI. `setup.cliBackends` adalah permukaan deskriptor khusus setup untuk
alur control-plane/setup yang harus tetap hanya berupa metadata.

Saat ada, `setup.providers` dan `setup.cliBackends` adalah permukaan pencarian
descriptor-first yang disukai untuk penemuan setup. Jika deskriptor hanya
mempersempit kandidat Plugin dan setup masih memerlukan hook runtime waktu-setup
yang lebih kaya, atur `requiresRuntime: true` dan pertahankan `setup-api` sebagai
jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam auth penyedia generik dan
pencarian env-var. `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas
selama jendela deprekasi, tetapi Plugin non-bundled yang masih menggunakannya
menerima diagnostik manifes. Plugin baru harus menaruh metadata env setup/status
di `setup.providers[].envVars`.

OpenClaw juga dapat menurunkan pilihan setup sederhana dari `setup.providers[].authMethods`
saat tidak ada entri setup, atau saat `setup.requiresRuntime: false`
menyatakan runtime setup tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap
diutamakan untuk label kustom, flag CLI, cakupan onboarding, dan metadata asisten.

Atur `requiresRuntime: false` hanya saat deskriptor tersebut cukup untuk
permukaan setup. OpenClaw memperlakukan `false` eksplisit sebagai kontrak hanya-deskriptor
dan tidak akan mengeksekusi `setup-api` atau `openclaw.setupEntry` untuk pencarian setup. Jika
Plugin hanya-deskriptor masih mengirimkan salah satu entri runtime setup tersebut,
OpenClaw melaporkan diagnostik aditif dan terus mengabaikannya. `requiresRuntime`
yang dihilangkan mempertahankan perilaku fallback lama sehingga Plugin yang sudah ada yang menambahkan
deskriptor tanpa flag tersebut tidak rusak.

Karena pencarian setup dapat mengeksekusi kode `setup-api` milik Plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
Plugin yang ditemukan. Kepemilikan ambigu gagal tertutup alih-alih memilih
pemenang dari urutan penemuan.

Saat runtime setup memang dieksekusi, diagnostik registri setup melaporkan drift deskriptor
jika `setup-api` mendaftarkan penyedia atau backend CLI yang tidak dideklarasikan
oleh deskriptor manifes, atau jika deskriptor tidak memiliki registrasi runtime
yang cocok. Diagnostik ini bersifat aditif dan tidak menolak Plugin lama.

### referensi setup.providers

| Bidang         | Wajib | Tipe       | Artinya                                                                                          |
| -------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ya    | `string`   | Id penyedia yang diekspos selama setup atau onboarding. Jaga agar id yang dinormalisasi unik secara global. |
| `authMethods`  | Tidak | `string[]` | Id metode setup/auth yang didukung penyedia ini tanpa memuat runtime penuh.                     |
| `envVars`      | Tidak | `string[]` | Variabel env yang dapat diperiksa permukaan setup/status generik sebelum runtime Plugin dimuat. |
| `authEvidence` | Tidak | `object[]` | Pemeriksaan bukti auth lokal murah untuk penyedia yang dapat melakukan autentikasi melalui penanda non-rahasia. |

`authEvidence` ditujukan untuk penanda kredensial lokal milik penyedia yang dapat
diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap murah dan lokal:
tidak ada panggilan jaringan, tidak ada pembacaan keychain atau secret-manager, tidak ada perintah shell, dan tidak ada
probe API penyedia.

Entri bukti yang didukung:

| Bidang             | Wajib | Tipe       | Artinya                                                                                                      |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `type`             | Ya    | `string`   | Saat ini `local-file-with-env`.                                                                              |
| `fileEnvVar`       | Tidak | `string`   | Variabel env yang berisi path file kredensial eksplisit.                                                     |
| `fallbackPaths`    | Tidak | `string[]` | Path file kredensial lokal yang diperiksa saat `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak | `string[]` | Setidaknya satu variabel env yang tercantum harus tidak kosong sebelum bukti valid.                         |
| `requiresAllEnv`   | Tidak | `string[]` | Setiap variabel env yang tercantum harus tidak kosong sebelum bukti valid.                                  |
| `credentialMarker` | Ya    | `string`   | Penanda non-rahasia yang dikembalikan saat bukti ada.                                                       |
| `source`           | Tidak | `string`   | Label sumber yang terlihat pengguna untuk output auth/status.                                                |

### bidang setup

| Bidang             | Wajib | Tipe       | Artinya                                                                                         |
| ------------------ | ----- | ---------- | ----------------------------------------------------------------------------------------------- |
| `providers`        | Tidak | `object[]` | Deskriptor setup penyedia yang diekspos selama setup dan onboarding.                            |
| `cliBackends`      | Tidak | `string[]` | Id backend waktu-setup yang digunakan untuk pencarian setup descriptor-first. Jaga agar id yang dinormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | Id migrasi config yang dimiliki oleh permukaan setup Plugin ini.                                |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah pencarian deskriptor.                |

## referensi uiHints

`uiHints` adalah peta dari nama bidang config ke petunjuk rendering kecil.

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

Setiap petunjuk bidang dapat mencakup:

| Bidang        | Tipe       | Artinya                                  |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Label bidang yang terlihat pengguna.     |
| `help`        | `string`   | Teks bantuan singkat.                    |
| `tags`        | `string[]` | Tag UI opsional.                         |
| `advanced`    | `boolean`  | Menandai bidang sebagai lanjutan.        |
| `sensitive`   | `boolean`  | Menandai bidang sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.   |

## referensi contracts

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat dibaca OpenClaw
tanpa mengimpor runtime Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Setiap daftar bersifat opsional:

| Bidang                          | Tipe       | Artinya                                                                                                                       |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id factory ekstensi app-server Codex, saat ini `codex-app-server`.                                                            |
| `agentToolResultMiddleware`      | `string[]` | id runtime yang middleware hasil alatnya dapat didaftarkan oleh plugin ini.                                                   |
| `trustedToolPolicies`            | `string[]` | id kebijakan pra-alat tepercaya lokal plugin yang dapat didaftarkan oleh plugin terinstal. Plugin bawaan dapat mendaftarkan kebijakan tanpa bidang ini. |
| `externalAuthProviders`          | `string[]` | id penyedia yang hook profil autentikasi eksternalnya dimiliki plugin ini.                                                    |
| `embeddingProviders`             | `string[]` | id penyedia embedding umum yang dimiliki plugin ini untuk penggunaan embedding vektor yang dapat digunakan ulang, termasuk memori. |
| `speechProviders`                | `string[]` | id penyedia ucapan yang dimiliki plugin ini.                                                                                  |
| `realtimeTranscriptionProviders` | `string[]` | id penyedia transkripsi realtime yang dimiliki plugin ini.                                                                    |
| `realtimeVoiceProviders`         | `string[]` | id penyedia suara realtime yang dimiliki plugin ini.                                                                          |
| `memoryEmbeddingProviders`       | `string[]` | id penyedia embedding khusus memori yang sudah tidak digunakan dan dimiliki plugin ini.                                       |
| `mediaUnderstandingProviders`    | `string[]` | id penyedia pemahaman media yang dimiliki plugin ini.                                                                         |
| `transcriptSourceProviders`      | `string[]` | id penyedia sumber transkrip yang dimiliki plugin ini.                                                                        |
| `imageGenerationProviders`       | `string[]` | id penyedia pembuatan gambar yang dimiliki plugin ini.                                                                        |
| `videoGenerationProviders`       | `string[]` | id penyedia pembuatan video yang dimiliki plugin ini.                                                                         |
| `webFetchProviders`              | `string[]` | id penyedia pengambilan web yang dimiliki plugin ini.                                                                         |
| `webSearchProviders`             | `string[]` | id penyedia pencarian web yang dimiliki plugin ini.                                                                           |
| `migrationProviders`             | `string[]` | id penyedia impor yang dimiliki plugin ini untuk `openclaw migrate`.                                                          |
| `gatewayMethodDispatch`          | `string[]` | Hak yang dicadangkan untuk rute HTTP plugin terautentikasi yang mendispatch metode Gateway dalam proses.                     |
| `tools`                          | `string[]` | nama alat agen yang dimiliki plugin ini.                                                                                      |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory ekstensi
khusus app-server Codex bawaan. Transformasi hasil alat bawaan sebaiknya
mendeklarasikan `contracts.agentToolResultMiddleware` dan mendaftar dengan
`api.registerAgentToolResultMiddleware(...)` sebagai gantinya. Plugin terinstal dapat menggunakan
seam middleware yang sama hanya ketika diaktifkan secara eksplisit dan hanya untuk runtime yang
mereka deklarasikan di `contracts.agentToolResultMiddleware`.

Plugin terinstal yang membutuhkan tingkat kebijakan pra-alat yang dipercaya host harus mendeklarasikan
setiap id lokal terdaftar di `contracts.trustedToolPolicies` dan diaktifkan secara eksplisit.
Plugin bawaan mempertahankan jalur kebijakan tepercaya yang ada, tetapi plugin terinstal
dengan id kebijakan yang tidak dideklarasikan akan ditolak sebelum pendaftaran. id kebijakan
dicakup ke plugin yang mendaftarkannya, sehingga dua plugin sama-sama dapat mendeklarasikan dan
mendaftarkan `workflow-budget`; satu plugin tidak boleh mendaftarkan id lokal yang sama
dua kali.

Pendaftaran `api.registerTool(...)` runtime harus cocok dengan `contracts.tools`.
Penemuan alat menggunakan daftar ini untuk memuat hanya runtime plugin yang dapat memiliki
alat yang diminta.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` sebaiknya mendeklarasikan
`contracts.externalAuthProviders`; hook autentikasi eksternal yang tidak dideklarasikan akan diabaikan.

Penyedia embedding umum sebaiknya mendeklarasikan `contracts.embeddingProviders` untuk
setiap adapter yang didaftarkan dengan `api.registerEmbeddingProvider(...)`. Gunakan
kontrak umum untuk pembuatan vektor yang dapat digunakan ulang, termasuk penyedia yang dikonsumsi oleh
pencarian memori. `contracts.memoryEmbeddingProviders` adalah kompatibilitas
khusus memori yang sudah tidak digunakan dan tetap ada hanya selama penyedia yang ada bermigrasi
ke seam penyedia embedding generik.

`contracts.gatewayMethodDispatch` saat ini menerima
`"authenticated-request"`. Ini adalah gerbang kebersihan API untuk rute HTTP
plugin native yang sengaja mendispatch metode control-plane Gateway dalam proses, bukan
sandbox terhadap plugin native berbahaya. Gunakan hanya untuk permukaan
bawaan/operator yang ditinjau ketat dan sudah memerlukan autentikasi HTTP Gateway.

## Referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` ketika penyedia pemahaman media memiliki
model default, prioritas fallback autentikasi otomatis, atau dukungan dokumen native yang
dibutuhkan helper core generik sebelum runtime dimuat. Kunci juga harus dideklarasikan di
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

Setiap entri penyedia dapat mencakup:

| Bidang                 | Tipe                                | Artinya                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Kemampuan media yang diekspos oleh penyedia ini.                             |
| `defaultModels`        | `Record<string, string>`            | Default kemampuan-ke-model yang digunakan ketika config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka lebih rendah diurutkan lebih awal untuk fallback penyedia otomatis berbasis kredensial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh penyedia.                            |

## Referensi channelConfigs

Gunakan `channelConfigs` ketika plugin kanal membutuhkan metadata config murah sebelum
runtime dimuat. Penemuan pengaturan/status kanal baca-saja dapat menggunakan metadata ini
secara langsung untuk kanal eksternal yang dikonfigurasi ketika tidak ada entri pengaturan,
atau ketika `setup.requiresRuntime: false` mendeklarasikan runtime pengaturan tidak diperlukan.

`channelConfigs` adalah metadata manifes plugin, bukan bagian config pengguna tingkat atas
yang baru. Pengguna tetap mengonfigurasi instance kanal di bawah `channels.<channel-id>`.
OpenClaw membaca metadata manifes untuk menentukan plugin mana yang memiliki kanal
terkonfigurasi tersebut sebelum kode runtime plugin dieksekusi.

Untuk plugin kanal, `configSchema` dan `channelConfigs` menjelaskan jalur yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin non-bawaan yang mendeklarasikan `channels[]` sebaiknya juga mendeklarasikan entri
`channelConfigs` yang cocok. Tanpanya, OpenClaw masih dapat memuat plugin, tetapi
skema config cold-path, pengaturan, dan permukaan Control UI tidak dapat mengetahui
bentuk opsi milik kanal hingga runtime plugin dieksekusi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan
`nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk pemeriksaan config
perintah yang berjalan sebelum runtime kanal dimuat. Kanal bawaan juga dapat memublikasikan
default yang sama melalui `package.json#openclaw.channel.commands` bersama
metadata katalog kanal lain yang dimiliki paketnya.

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

Setiap entri kanal dapat mencakup:

| Bidang        | Tipe                     | Artinya                                                                            |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config kanal yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian config kanal tersebut. |
| `label`       | `string`                 | Label kanal yang digabungkan ke permukaan pemilih dan inspeksi ketika metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi kanal singkat untuk permukaan inspeksi dan katalog.                      |
| `commands`    | `object`                 | Default otomatis statis perintah native dan skill native untuk pemeriksaan config pra-runtime. |
| `preferOver`  | `string[]`               | id plugin lama atau berprioritas lebih rendah yang sebaiknya dikalahkan kanal ini dalam permukaan pemilihan. |

### Mengganti plugin kanal lain

Gunakan `preferOver` ketika plugin Anda adalah pemilik yang lebih disukai untuk id kanal yang
juga dapat disediakan oleh plugin lain. Kasus umum adalah id plugin yang diganti nama,
plugin mandiri yang menggantikan plugin bawaan, atau fork terpelihara yang
mempertahankan id kanal yang sama untuk kompatibilitas config.

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

Ketika `channels.chat` dikonfigurasi, OpenClaw mempertimbangkan id kanal dan
id plugin pilihan. Jika plugin berprioritas lebih rendah dipilih hanya karena
plugin tersebut bawaan atau diaktifkan secara default, OpenClaw menonaktifkannya dalam config
runtime efektif sehingga satu plugin memiliki kanal dan alatnya. Pemilihan pengguna
eksplisit tetap menang: jika pengguna secara eksplisit mengaktifkan kedua plugin, OpenClaw
mempertahankan pilihan tersebut dan melaporkan diagnostik kanal/alat duplikat alih-alih
mengubah kumpulan plugin yang diminta secara diam-diam.

Jaga `preferOver` tetap terbatas pada id plugin yang benar-benar dapat menyediakan kanal yang sama.
Ini bukan bidang prioritas umum dan tidak mengganti nama kunci config pengguna.

## Referensi modelSupport

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin penyedia Anda dari
id model singkatan seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum runtime plugin
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

- ref `provider/model` eksplisit menggunakan metadata manifes `providers` pemiliknya
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin
  non-bawaan menang
- ambiguitas yang tersisa diabaikan hingga pengguna atau konfigurasi menentukan penyedia

Kolom:

| Kolom           | Tipe       | Artinya                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model singkatan.        |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model singkatan setelah penghapusan sufiks profil. |

Entri `modelPatterns` dikompilasi melalui `compileSafeRegex`, yang menolak
pola yang berisi pengulangan bersarang (misalnya `(a+)+$`). Pola yang gagal
pemeriksaan keamanan dilewati secara diam-diam, sama seperti regex yang tidak valid secara sintaksis.
Jaga pola tetap sederhana dan hindari kuantifier bersarang.

## Referensi modelCatalog

Gunakan `modelCatalog` saat OpenClaw harus mengetahui metadata model penyedia sebelum
memuat runtime plugin. Ini adalah sumber milik manifes untuk baris katalog tetap,
alias penyedia, aturan supresi, dan mode discovery. Penyegaran runtime
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

Kolom tingkat atas:

| Kolom           | Tipe                                                     | Artinya                                                                                                     |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki plugin ini. Kunci juga harus muncul di `providers` tingkat atas. |
| `aliases`        | `Record<string, object>`                                 | Alias penyedia yang harus di-resolve ke penyedia milik sendiri untuk perencanaan katalog atau supresi.      |
| `suppressions`   | `object[]`                                               | Baris model dari sumber lain yang disupresi plugin ini karena alasan khusus penyedia.                       |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, disegarkan ke cache, atau memerlukan runtime.   |
| `runtimeAugment` | `boolean`                                                | Atur ke `true` hanya saat runtime penyedia harus menambahkan baris katalog setelah perencanaan manifes/konfigurasi. |

`aliases` ikut serta dalam pencarian kepemilikan penyedia untuk perencanaan model-catalog.
Target alias harus merupakan penyedia tingkat atas yang dimiliki plugin yang sama. Saat
daftar yang difilter berdasarkan penyedia menggunakan alias, OpenClaw dapat membaca manifes pemilik dan
menerapkan override API/base URL alias tanpa memuat runtime penyedia.
Alias tidak memperluas listing katalog tanpa filter; daftar luas hanya mengeluarkan baris
penyedia kanonis pemilik.

`suppressions` menggantikan hook `suppressBuiltInModel` runtime penyedia lama.
Entri supresi dihormati hanya saat penyedia dimiliki oleh plugin atau
dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia milik sendiri. Hook
supresi runtime tidak lagi dipanggil selama resolusi model.

Kolom penyedia:

| Kolom    | Tipe                     | Artinya                                                            |
| -------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | URL dasar default opsional untuk model dalam katalog penyedia ini. |
| `api`     | `ModelApi`               | Adapter API default opsional untuk model dalam katalog penyedia ini. |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.    |
| `models`  | `object[]`               | Baris model wajib. Baris tanpa `id` diabaikan.                     |

Kolom model:

| Kolom          | Tipe                                                           | Artinya                                                                         |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id model lokal penyedia, tanpa prefiks `provider/`.                             |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                         |
| `api`           | `ModelApi`                                                     | Override API per model opsional.                                                |
| `baseUrl`       | `string`                                                       | Override URL dasar per model opsional.                                          |
| `headers`       | `Record<string, string>`                                       | Header statis per model opsional.                                               |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitas yang diterima model.                                                  |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku penalaran.                                     |
| `contextWindow` | `number`                                                       | Jendela konteks native penyedia.                                                |
| `contextTokens` | `number`                                                       | Batas konteks runtime efektif opsional saat berbeda dari `contextWindow`.       |
| `maxTokens`     | `number`                                                       | Token output maksimum saat diketahui.                                           |
| `cost`          | `object`                                                       | Harga USD per juta token opsional, termasuk `tieredPricing` opsional.           |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas konfigurasi model OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listing. Supresi hanya saat baris sama sekali tidak boleh muncul.        |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan dengan status non-tersedia.                    |
| `replaces`      | `string[]`                                                     | Id model lokal penyedia lama yang digantikan model ini.                         |
| `replacedBy`    | `string`                                                       | Id model lokal penyedia pengganti untuk baris yang usang.                       |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh picker dan filter.                               |

Kolom supresi:

| Kolom                     | Tipe       | Artinya                                                                                                   |
| ------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id penyedia untuk baris upstream yang akan disupresi. Harus dimiliki plugin ini atau dideklarasikan sebagai alias milik sendiri. |
| `model`                    | `string`   | Id model lokal penyedia yang akan disupresi.                                                              |
| `reason`                   | `string`   | Pesan opsional yang ditampilkan saat baris yang disupresi diminta secara langsung.                        |
| `when.baseUrlHosts`        | `string[]` | Daftar opsional host URL dasar penyedia efektif yang diperlukan sebelum supresi berlaku.                   |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi penyedia yang persis diperlukan sebelum supresi berlaku.          |

Jangan letakkan data khusus runtime di `modelCatalog`. Gunakan `static` hanya saat baris
manifes cukup lengkap agar permukaan daftar yang difilter penyedia dan picker dapat melewati
discovery registry/runtime. Gunakan `refreshable` saat baris manifes berguna
sebagai seed atau suplemen yang dapat didaftarkan, tetapi refresh/cache dapat menambahkan lebih banyak baris nanti;
baris refreshable tidak otoritatif dengan sendirinya. Gunakan `runtime` saat OpenClaw
harus memuat runtime penyedia untuk mengetahui daftar.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan id model murah milik penyedia yang harus
terjadi sebelum runtime penyedia dimuat. Ini menjaga alias seperti nama model pendek,
id lama lokal penyedia, dan aturan prefiks proxy di manifes plugin pemilik,
bukan di tabel pemilihan model core.

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

Kolom penyedia:

| Kolom                               | Tipe                    | Artinya                                                                                |
| ----------------------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias id model persis yang tidak peka huruf besar/kecil. Nilai dikembalikan seperti ditulis. |
| `stripPrefixes`                      | `string[]`              | Prefiks yang akan dihapus sebelum pencarian alias, berguna untuk duplikasi provider/model lama. |
| `prefixWhenBare`                     | `string`                | Prefiks yang akan ditambahkan saat id model yang dinormalisasi belum berisi `/`.       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan prefiks bare-id kondisional setelah pencarian alias, dikunci oleh `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi endpoint yang harus diketahui kebijakan permintaan generik
sebelum runtime penyedia dimuat. Core tetap memiliki makna setiap
`endpointClass`; manifes plugin memiliki metadata host dan URL dasar.

Kolom endpoint:

| Kolom                          | Tipe       | Artinya                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint inti yang dikenal, seperti `openrouter`, `moonshot-native`, atau `google-vertex`.        |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Sufiks host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus sufiks domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi persis yang dipetakan ke kelas endpoint.                             |
| `googleVertexRegion`           | `string`   | Wilayah Google Vertex statis untuk host global persis.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks yang dihapus dari host yang cocok untuk mengekspos prefiks wilayah Google Vertex.                 |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan yang murah yang dibutuhkan kebijakan permintaan generik tanpa memuat runtime penyedia. Simpan penulisan ulang payload yang spesifik perilaku di hook runtime penyedia atau helper keluarga penyedia bersama.

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

Kolom penyedia:

| Kolom                 | Tipe         | Artinya                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label keluarga penyedia yang digunakan oleh keputusan dan diagnostik kompatibilitas permintaan generik. |
| `compatibilityFamily` | `"moonshot"` | Bucket kompatibilitas keluarga penyedia opsional untuk helper permintaan bersama.              |
| `openAICompletions`   | `object`     | Flag permintaan completion yang kompatibel dengan OpenAI, saat ini `supportsStreamingUsage`.       |

## Referensi secretProviderIntegrations

Gunakan `secretProviderIntegrations` ketika sebuah Plugin dapat menerbitkan preset penyedia exec SecretRef yang dapat digunakan ulang. OpenClaw membaca metadata ini sebelum runtime Plugin dimuat, menyimpan kepemilikan Plugin di `secrets.providers.<alias>.pluginIntegration`, dan menyerahkan resolusi secret aktual ke runtime SecretRef. Preset hanya diekspos untuk Plugin bawaan dan Plugin terinstal yang ditemukan dari root instalasi Plugin terkelola, seperti instalasi git dan ClawHub.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

Kunci map adalah id integrasi. Jika `providerAlias` dihilangkan, OpenClaw menggunakan id integrasi sebagai alias penyedia SecretRef. Alias penyedia harus cocok dengan pola alias penyedia SecretRef normal, misalnya `team-secrets` atau `onepassword-work`.

Ketika operator memilih preset, OpenClaw menulis referensi penyedia seperti:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Saat startup/muat ulang, OpenClaw menyelesaikan penyedia tersebut dengan memuat metadata manifes Plugin saat ini, memeriksa bahwa Plugin pemilik terinstal dan aktif, serta mewujudkan perintah exec dari manifes. Menonaktifkan atau menghapus Plugin akan mencabut penyedia untuk SecretRef aktif. Operator yang menginginkan konfigurasi exec mandiri tetap dapat menulis penyedia `command`/`args` manual secara langsung.

Saat ini hanya preset `source: "exec"` yang didukung. `command` harus `${node}`, dan `args[0]` harus berupa skrip resolver relatif-root-Plugin `./`. OpenClaw mewujudkannya saat startup/muat ulang ke executable Node saat ini dan path skrip dalam-Plugin absolut. Opsi Node seperti `--require`, `--import`, `--loader`, `--env-file`, `--eval`, dan `--print` bukan bagian dari kontrak preset manifes. Operator yang membutuhkan perintah non-Node dapat mengonfigurasi penyedia exec manual mandiri secara langsung.

OpenClaw menurunkan `trustedDirs` untuk preset manifes dari root Plugin dan, untuk preset `${node}`, direktori executable Node saat ini. `trustedDirs` yang ditulis manifes diabaikan. Opsi penyedia exec lain seperti `timeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv`, dan `allowInsecurePath` diteruskan ke konfigurasi penyedia exec SecretRef normal.

## Referensi modelPricing

Gunakan `modelPricing` ketika penyedia membutuhkan perilaku harga bidang kontrol sebelum runtime dimuat. Cache harga Gateway membaca metadata ini tanpa mengimpor kode runtime penyedia.

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

Kolom penyedia:

| Kolom        | Tipe              | Artinya                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Atur `false` untuk penyedia lokal/self-hosted yang tidak boleh pernah mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan pencarian harga OpenRouter. `false` menonaktifkan pencarian OpenRouter untuk penyedia ini.           |
| `liteLLM`    | `false \| object` | Pemetaan pencarian harga LiteLLM. `false` menonaktifkan pencarian LiteLLM untuk penyedia ini.                 |

Kolom sumber:

| Kolom                      | Tipe               | Artinya                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id penyedia katalog eksternal ketika berbeda dari id penyedia OpenClaw, misalnya `z-ai` untuk penyedia `zai`. |
| `passthroughProviderModel` | `boolean`          | Perlakukan id model yang berisi garis miring sebagai ref penyedia/model bertingkat, berguna untuk penyedia proksi seperti OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Varian id model katalog eksternal tambahan. `version-dots` mencoba id versi bertitik seperti `claude-opus-4.6`.            |

### Indeks Penyedia OpenClaw

Indeks Penyedia OpenClaw adalah metadata pratinjau milik OpenClaw untuk penyedia yang Pluginnya mungkin belum terinstal. Ini bukan bagian dari manifes Plugin. Manifes Plugin tetap menjadi otoritas Plugin terinstal. Indeks Penyedia adalah kontrak fallback internal yang akan digunakan permukaan pemilih model penyedia-terinstal dan pra-instal yang dapat diinstal di masa mendatang ketika Plugin penyedia tidak terinstal.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. Manifes Plugin terinstal `modelCatalog`.
3. Cache katalog model dari refresh eksplisit.
4. Baris pratinjau Indeks Penyedia OpenClaw.

Indeks Penyedia tidak boleh berisi secret, status aktif, hook runtime, atau data model khusus akun langsung. Katalog pratinjaunya menggunakan bentuk baris penyedia `modelCatalog` yang sama seperti manifes Plugin, tetapi sebaiknya tetap dibatasi pada metadata tampilan stabil kecuali kolom adapter runtime seperti `api`, `baseUrl`, harga, atau flag kompatibilitas sengaja dijaga selaras dengan manifes Plugin terinstal. Penyedia dengan penemuan `/models` langsung sebaiknya menulis baris yang di-refresh melalui path cache katalog model eksplisit alih-alih membuat listing normal atau onboarding memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata Plugin yang dapat diinstal untuk penyedia yang Pluginnya telah dipindahkan keluar dari inti atau belum terinstal. Metadata ini mencerminkan pola katalog channel: nama package, spesifikasi instal npm, integritas yang diharapkan, dan label pilihan auth yang murah sudah cukup untuk menampilkan opsi setup yang dapat diinstal. Setelah Plugin terinstal, manifesnya menang dan entri Indeks Penyedia diabaikan untuk penyedia tersebut.

Kunci kemampuan tingkat atas lama sudah tidak digunakan. Gunakan `openclaw doctor --fix` untuk memindahkan `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan manifes normal tidak lagi memperlakukan kolom tingkat atas tersebut sebagai kepemilikan kemampuan.

## Manifes versus package.json

Kedua file tersebut memiliki fungsi berbeda:

| File                   | Gunakan untuk                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Penemuan, validasi konfigurasi, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode Plugin berjalan                         |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, setup, atau metadata katalog |

Jika Anda tidak yakin di mana suatu metadata seharusnya berada, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode Plugin, letakkan di `openclaw.plugin.json`
- jika itu tentang packaging, file entry, atau perilaku instal npm, letakkan di `package.json`

### Kolom package.json yang memengaruhi penemuan

Sebagian metadata Plugin pra-runtime sengaja berada di `package.json` di bawah blok `openclaw`, bukan di `openclaw.plugin.json`.
`openclaw.bundle` dan `openclaw.bundle.json` bukan kontrak Plugin OpenClaw; Plugin native harus menggunakan `openclaw.plugin.json` ditambah kolom `package.json#openclaw` yang didukung di bawah ini.

Contoh penting:

| Bidang                                                                                     | Artinya                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Mendeklarasikan titik masuk Plugin native. Harus tetap berada di dalam direktori paket Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                                               | Mendeklarasikan titik masuk runtime JavaScript bawaan untuk paket yang terinstal. Harus tetap berada di dalam direktori paket Plugin.                                               |
| `openclaw.setupEntry`                                                                      | Titik masuk ringan khusus penyiapan yang digunakan selama onboarding, startup kanal yang ditangguhkan, serta penemuan status kanal/SecretRef baca-saja. Harus tetap berada di dalam direktori paket Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Mendeklarasikan titik masuk penyiapan JavaScript bawaan untuk paket yang terinstal. Memerlukan `setupEntry`, harus ada, dan harus tetap berada di dalam direktori paket Plugin.     |
| `openclaw.channel`                                                                         | Metadata katalog kanal yang murah seperti label, jalur docs, alias, dan salinan pilihan.                                                                                            |
| `openclaw.channel.commands`                                                                | Metadata statis perintah native dan default otomatis skill native yang digunakan oleh permukaan config, audit, dan daftar perintah sebelum runtime kanal dimuat.                    |
| `openclaw.channel.configuredState`                                                         | Metadata pemeriksa status terkonfigurasi ringan yang dapat menjawab "apakah penyiapan khusus env sudah ada?" tanpa memuat runtime kanal lengkap.                                    |
| `openclaw.channel.persistedAuthState`                                                      | Metadata pemeriksa auth tersimpan ringan yang dapat menjawab "apakah sudah ada yang masuk?" tanpa memuat runtime kanal lengkap.                                                     |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Petunjuk instalasi/pembaruan untuk Plugin bawaan dan yang dipublikasikan secara eksternal.                                                                                         |
| `openclaw.install.defaultChoice`                                                           | Jalur instalasi yang disukai ketika beberapa sumber instalasi tersedia.                                                                                                             |
| `openclaw.install.minHostVersion`                                                          | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22` atau `>=2026.5.1-beta.1`.                                                          |
| `openclaw.compat.pluginApi`                                                                | Rentang API Plugin OpenClaw minimum yang diperlukan paket ini, menggunakan batas bawah semver seperti `>=2026.5.27`.                                                               |
| `openclaw.install.expectedIntegrity`                                                       | String integritas dist npm yang diharapkan seperti `sha512-...`; alur instalasi dan pembaruan memverifikasi artefak yang diambil terhadap nilai tersebut.                          |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Mengizinkan jalur pemulihan instalasi ulang Plugin bawaan yang sempit ketika config tidak valid.                                                                                    |
| `openclaw.install.requiredPlatformPackages`                                                | Alias paket npm yang harus terwujud ketika batasan platform lockfile-nya cocok dengan host saat ini.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Memungkinkan permukaan kanal setup-runtime dimuat sebelum listen, lalu menangguhkan Plugin kanal lengkap yang terkonfigurasi hingga aktivasi pasca-listen.                          |

Metadata manifest menentukan pilihan provider/kanal/penyiapan mana yang muncul di
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan Plugin tersebut ketika pengguna memilih salah satu
pilihan itu. Jangan pindahkan petunjuk instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan
registry manifest untuk sumber Plugin non-bawaan. Nilai yang tidak valid ditolak;
nilai yang lebih baru tetapi valid akan melewati Plugin eksternal pada host yang lebih lama. Sumber
Plugin bawaan diasumsikan memiliki versi yang selaras dengan checkout host.

`openclaw.install.requiredPlatformPackages` digunakan untuk paket npm yang mengekspos
binary native yang diperlukan melalui alias opsional khusus platform. Cantumkan
nama paket npm polos untuk setiap alias platform yang didukung. Selama instalasi npm,
OpenClaw hanya memverifikasi alias yang dideklarasikan yang batasan lockfile-nya cocok dengan
host saat ini. Jika npm melaporkan berhasil tetapi menghilangkan alias tersebut, OpenClaw mencoba ulang sekali
dengan cache baru dan mengembalikan instalasi jika alias masih hilang.

`openclaw.compat.pluginApi` diberlakukan selama instalasi paket untuk sumber
Plugin non-bawaan. Gunakan ini untuk batas bawah API SDK/runtime Plugin OpenClaw tempat
paket dibangun. Ini dapat lebih ketat daripada `minHostVersion` ketika sebuah
paket Plugin memerlukan API yang lebih baru tetapi tetap mempertahankan petunjuk instalasi yang lebih rendah untuk alur
lain. Sinkronisasi rilis resmi OpenClaw menaikkan batas bawah API Plugin resmi yang ada
ke versi rilis OpenClaw secara default, tetapi rilis khusus Plugin dapat mempertahankan
batas bawah yang lebih rendah ketika paket sengaja mendukung host yang lebih lama. Jangan gunakan
versi paket saja sebagai kontrak kompatibilitas. `peerDependencies.openclaw`
tetap menjadi metadata paket npm; OpenClaw menggunakan kontrak `openclaw.compat.pluginApi`
untuk keputusan kompatibilitas instalasi.

Metadata instal-sesuai-permintaan resmi harus menggunakan `clawhubSpec` ketika Plugin
dipublikasikan di ClawHub; onboarding memperlakukannya sebagai sumber remote yang disukai dan
mencatat fakta artefak ClawHub setelah instalasi. `npmSpec` tetap menjadi fallback
kompatibilitas untuk paket yang belum pindah ke ClawHub.

Penyematan versi npm persis sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
harus memasangkan spesifikasi persis dengan `expectedIntegrity` agar alur pembaruan gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang disematkan.
Onboarding interaktif tetap menawarkan spesifikasi npm registry tepercaya, termasuk
nama paket polos dan dist-tag, untuk kompatibilitas. Diagnostik katalog dapat
membedakan sumber persis, mengambang, disematkan-integritas, integritas-hilang, ketidakcocokan nama paket,
dan pilihan default yang tidak valid. Diagnostik juga memperingatkan ketika
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat disematkannya.
Ketika `expectedIntegrity` ada,
alur instalasi/pembaruan memberlakukannya; ketika dihilangkan, resolusi registry
dicatat tanpa pin integritas.

Plugin kanal harus menyediakan `openclaw.setupEntry` ketika status, daftar kanal,
atau pemindaian SecretRef perlu mengidentifikasi akun terkonfigurasi tanpa memuat runtime
lengkap. Entri penyiapan harus mengekspos metadata kanal serta adapter config,
status, dan rahasia yang aman untuk penyiapan; simpan klien jaringan, listener gateway, dan
runtime transport di titik masuk ekstensi utama.

Bidang titik masuk runtime tidak menimpa pemeriksaan batas paket untuk bidang
titik masuk sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
jalur `openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja sempit. Ini tidak
membuat config rusak sembarang dapat diinstal. Saat ini, ini hanya mengizinkan alur instalasi
pulih dari kegagalan upgrade Plugin bawaan basi tertentu, seperti
jalur Plugin bawaan yang hilang atau entri `channels.<id>` basi untuk
Plugin bawaan yang sama. Error config yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata paket untuk modul pemeriksa
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

Gunakan ini ketika alur penyiapan, doctor, status, atau presensi baca-saja memerlukan probe auth
ya/tidak yang murah sebelum Plugin kanal lengkap dimuat. Status auth tersimpan bukan
status kanal terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan Plugin otomatis,
memperbaiki dependensi runtime, atau memutuskan apakah runtime kanal harus dimuat.
Export target harus berupa fungsi kecil yang hanya membaca status tersimpan; jangan
rutekan melalui barrel runtime kanal lengkap.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan
terkonfigurasi khusus env yang murah:

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

Gunakan ini ketika kanal dapat menjawab status terkonfigurasi dari env atau input kecil
non-runtime lainnya. Jika pemeriksaan memerlukan resolusi config lengkap atau runtime kanal
nyata, simpan logika tersebut di hook Plugin `config.hasConfiguredState`
sebagai gantinya.

## Prioritas penemuan (id Plugin duplikat)

OpenClaw menemukan Plugin dari beberapa root. Untuk urutan pemindaian filesystem mentah,
lihat [Urutan pemindaian
Plugin](/id/gateway/configuration-reference#plugin-scan-order). Jika dua penemuan
memiliki `id` yang sama, hanya manifest dengan **prioritas tertinggi** yang dipertahankan;
duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan dengannya.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih config** — jalur yang disematkan secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — Plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — Plugin yang diinstal ke root Plugin OpenClaw global
4. **Workspace** — Plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau basi dari Plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar menimpa Plugin bawaan dengan yang lokal, sematkan melalui `plugins.entries.<id>` agar menang berdasarkan prioritas alih-alih mengandalkan penemuan workspace.
- Pembuangan duplikat dicatat sehingga diagnostik Doctor dan startup dapat menunjuk ke salinan yang dibuang.
- Penimpaan duplikat yang dipilih config ditulis sebagai penimpaan eksplisit dalam diagnostik, tetapi tetap memperingatkan agar fork basi dan bayangan tidak disengaja tetap terlihat.

## Persyaratan JSON Schema

- **Setiap Plugin harus menyertakan JSON Schema**, meskipun tidak menerima konfigurasi apa pun.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat konfigurasi dibaca/ditulis, bukan saat runtime.
- Saat memperluas atau membuat fork dari Plugin bawaan dengan kunci konfigurasi baru, perbarui `configSchema` di `openclaw.plugin.json` milik Plugin tersebut pada saat yang sama. Skema Plugin bawaan bersifat ketat, sehingga menambahkan `plugins.entries.<id>.config.myNewKey` dalam konfigurasi pengguna tanpa menambahkan `myNewKey` ke `configSchema.properties` akan ditolak sebelum runtime Plugin dimuat.

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
  manifes Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan id Plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **error**.
- Jika Plugin terinstal tetapi memiliki manifes atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error Plugin tersebut.
- Jika konfigurasi Plugin ada tetapi Plugin **dinonaktifkan**, konfigurasi tetap dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema lengkap `plugins.*`.

## Catatan

- Manifes **wajib untuk Plugin OpenClaw native**, termasuk pemuatan dari sistem berkas lokal. Runtime tetap memuat modul Plugin secara terpisah; manifes hanya untuk penemuan + validasi.
- Manifes native diurai dengan JSON5, sehingga komentar, koma di akhir, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya field manifes yang terdokumentasi yang dibaca oleh pemuat manifes. Hindari kunci tingkat atas khusus.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan jika Plugin tidak membutuhkannya.
- `providerCatalogEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog provider statis atau deskriptor penemuan yang sempit, bukan eksekusi saat permintaan.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Deklarasikan jenis Plugin eksklusif dalam manifes ini. `OpenClawPluginDefinition.kind` pada entri runtime sudah tidak digunakan lagi dan tetap ada hanya sebagai fallback kompatibilitas untuk Plugin lama.
- Metadata env-var (`setup.providers[].envVars`, `providerAuthEnvVars` yang sudah tidak digunakan lagi, dan `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman cron, dan permukaan baca-saja lainnya tetap menerapkan kepercayaan Plugin serta kebijakan aktivasi efektif sebelum memperlakukan env var sebagai terkonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode provider, lihat [Hook runtime provider](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist package manager apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Building plugins" href="/id/plugins/building-plugins" icon="rocket">
    Mulai menggunakan Plugin.
  </Card>
  <Card title="Plugin architecture" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model kapabilitas.
  </Card>
  <Card title="SDK overview" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK Plugin dan impor subpath.
  </Card>
</CardGroup>
