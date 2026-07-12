---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu merilis skema konfigurasi plugin atau men-debug kesalahan validasi plugin
summary: Persyaratan manifes Plugin + skema JSON (validasi konfigurasi yang ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-07-12T14:27:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini membahas **manifes plugin OpenClaw native**, `openclaw.plugin.json`. Untuk tata letak bundel yang kompatibel (Codex, Claude, Cursor), lihat [Bundel Plugin](/id/plugins/bundles).

Format bundel yang kompatibel menggunakan file manifesnya sendiri sebagai gantinya:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json`, atau tata letak komponen Claude bawaan tanpa manifes
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw mendeteksi tata letak tersebut secara otomatis, tetapi tidak memvalidasinya terhadap skema `openclaw.plugin.json` di bawah ini. Untuk bundel yang kompatibel, OpenClaw membaca metadata bundel, root skill yang dideklarasikan, root perintah Claude, nilai bawaan `settings.json` Claude, nilai bawaan LSP Claude, dan paket hook yang didukung, jika tata letaknya sesuai dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan `openclaw.plugin.json` di **root plugin**. OpenClaw membacanya untuk memvalidasi konfigurasi **tanpa mengeksekusi kode plugin**. Manifes yang tidak ada atau tidak valid akan memblokir validasi konfigurasi dan diperlakukan sebagai kesalahan plugin.

Lihat [Plugin](/id/tools/plugin) untuk panduan lengkap sistem plugin, dan [Model kapabilitas](/id/plugins/architecture#public-capability-model) untuk model kapabilitas native serta panduan kompatibilitas eksternal saat ini.

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat kode plugin Anda**. Semua yang ada di dalamnya harus cukup ringan untuk diperiksa tanpa menjalankan runtime plugin.

**Gunakan untuk:**

- identitas plugin, validasi konfigurasi, dan petunjuk UI konfigurasi
- metadata autentikasi, orientasi awal, dan penyiapan (alias, pengaktifan otomatis, variabel lingkungan penyedia, pilihan autentikasi)
- petunjuk aktivasi untuk antarmuka bidang kontrol
- kepemilikan singkat keluarga model
- rekam cuplikan statis kepemilikan kapabilitas (`contracts`)
- metadata runner QA yang dapat diperiksa oleh host bersama `openclaw qa`
- metadata konfigurasi khusus saluran yang digabungkan ke dalam katalog dan antarmuka validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan titik masuk kode, atau metadata instalasi npm. Hal-hal tersebut berada dalam kode plugin dan `package.json` Anda.

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

| Bidang                               | Wajib    | Tipe                         | Artinya                                                                                                                                                                                                                                                                   |
| ------------------------------------ | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya       | `string`                     | ID Plugin kanonis. Ini adalah ID yang digunakan dalam `plugins.entries.<id>`.                                                                                                                                                                                             |
| `configSchema`                       | Ya       | `object`                     | JSON Schema sebaris untuk konfigurasi Plugin ini.                                                                                                                                                                                                                          |
| `requiresPlugins`                    | Tidak    | `string[]`                   | ID Plugin yang juga harus dipasang agar Plugin ini berfungsi. Penemuan tetap memungkinkan Plugin dimuat, tetapi memberikan peringatan jika ada Plugin wajib yang tidak tersedia.                                                                                           |
| `enabledByDefault`                   | Tidak    | `true`                       | Menandai Plugin bawaan sebagai aktif secara default. Hilangkan properti ini, atau tetapkan nilai apa pun selain `true`, agar Plugin tetap nonaktif secara default.                                                                                                         |
| `enabledByDefaultOnPlatforms`        | Tidak    | `string[]`                   | Menandai Plugin bawaan sebagai aktif secara default hanya pada platform Node.js yang tercantum, misalnya `["darwin"]`. Konfigurasi eksplisit tetap diutamakan.                                                                                                             |
| `legacyPluginIds`                    | Tidak    | `string[]`                   | ID lama yang dinormalisasi menjadi ID Plugin kanonis ini.                                                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Tidak    | `string[]`                   | ID penyedia yang harus mengaktifkan Plugin ini secara otomatis ketika autentikasi, konfigurasi, atau referensi model menyebutkannya.                                                                                                                                       |
| `kind`                               | Tidak    | `PluginKind \| PluginKind[]` | Mendeklarasikan satu atau beberapa jenis Plugin eksklusif (`"memory"`, `"context-engine"`) yang digunakan oleh `plugins.slots.*`. Plugin yang memiliki kedua slot tersebut mendeklarasikan kedua jenis dalam satu larik.                                                   |
| `channels`                           | Tidak    | `string[]`                   | ID kanal yang dimiliki Plugin ini. Digunakan untuk penemuan dan validasi konfigurasi.                                                                                                                                                                                       |
| `providers`                          | Tidak    | `string[]`                   | ID penyedia yang dimiliki Plugin ini.                                                                                                                                                                                                                                      |
| `providerCatalogEntry`               | Tidak    | `string`                     | Jalur modul katalog penyedia ringan, relatif terhadap akar Plugin, untuk metadata katalog penyedia dalam cakupan manifes yang dapat dimuat tanpa mengaktifkan seluruh runtime Plugin.                                                                                       |
| `modelSupport`                       | Tidak    | `object`                     | Metadata ringkas keluarga model milik manifes yang digunakan untuk memuat Plugin secara otomatis sebelum runtime.                                                                                                                                                          |
| `modelCatalog`                       | Tidak    | `object`                     | Metadata katalog model deklaratif untuk penyedia yang dimiliki Plugin ini. Ini adalah kontrak bidang kontrol untuk pencantuman hanya-baca, onboarding, pemilih model, alias, dan penyembunyian di masa mendatang tanpa memuat runtime Plugin.                                |
| `modelPricing`                       | Tidak    | `object`                     | Kebijakan pencarian harga eksternal milik penyedia. Gunakan untuk mengecualikan penyedia lokal/dihosting sendiri dari katalog harga jarak jauh atau memetakan referensi penyedia ke ID katalog OpenRouter/LiteLLM tanpa mengodekan ID penyedia secara permanen di inti.       |
| `modelIdNormalization`               | Tidak    | `object`                     | Pembersihan alias/awalan ID model milik penyedia yang harus dijalankan sebelum runtime penyedia dimuat.                                                                                                                                                                    |
| `providerEndpoints`                  | Tidak    | `object[]`                   | Metadata host/baseUrl titik akhir milik manifes untuk rute penyedia yang harus diklasifikasikan oleh inti sebelum runtime penyedia dimuat.                                                                                                                                |
| `providerRequest`                    | Tidak    | `object`                     | Metadata ringan keluarga penyedia dan kompatibilitas permintaan yang digunakan oleh kebijakan permintaan generik sebelum runtime penyedia dimuat.                                                                                                                         |
| `secretProviderIntegrations`         | Tidak    | `Record<string, object>`     | Preset penyedia eksekusi SecretRef deklaratif yang dapat ditawarkan oleh antarmuka penyiapan atau pemasangan tanpa mengodekan integrasi khusus penyedia secara permanen di inti.                                                                                            |
| `cliBackends`                        | Tidak    | `string[]`                   | ID backend inferensi CLI yang dimiliki Plugin ini. Digunakan untuk aktivasi otomatis saat startup berdasarkan referensi konfigurasi eksplisit.                                                                                                                            |
| `syntheticAuthRefs`                  | Tidak    | `string[]`                   | Referensi penyedia atau backend CLI yang hook autentikasi sintetis milik Plugin-nya harus diperiksa selama penemuan model dingin sebelum runtime dimuat.                                                                                                                    |
| `nonSecretAuthMarkers`               | Tidak    | `string[]`                   | Nilai kunci API placeholder milik Plugin bawaan yang merepresentasikan status kredensial lokal, OAuth, atau ambien yang bukan rahasia.                                                                                                                                     |
| `commandAliases`                     | Tidak    | `object[]`                   | Nama perintah yang dimiliki Plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI yang sadar-Plugin sebelum runtime dimuat.                                                                                                                                   |
| `providerAuthEnvVars`                | Tidak    | `Record<string, string[]>`   | Metadata variabel lingkungan kompatibilitas yang tidak digunakan lagi untuk pencarian autentikasi/status penyedia. Utamakan `setup.providers[].envVars` untuk Plugin baru; OpenClaw masih membacanya selama periode penghentian bertahap.                                  |
| `providerUsageAuthEnvVars`           | Tidak    | `Record<string, string[]>`   | Kredensial penyedia khusus penggunaan/penagihan. OpenClaw menggunakan nama-nama ini untuk penemuan penggunaan dan pembersihan rahasia, tetapi tidak pernah untuk autentikasi inferensi.                                                                                     |
| `providerAuthAliases`                | Tidak    | `Record<string, string>`     | ID penyedia yang harus menggunakan kembali ID penyedia lain untuk pencarian autentikasi, misalnya penyedia pengodean yang menggunakan kunci API dan profil autentikasi penyedia dasar yang sama.                                                                            |
| `channelEnvVars`                     | Tidak    | `Record<string, string[]>`   | Metadata variabel lingkungan kanal ringan yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk antarmuka penyiapan atau autentikasi kanal berbasis variabel lingkungan yang harus terlihat oleh pembantu startup/konfigurasi generik.                    |
| `providerAuthChoices`                | Tidak    | `object[]`                   | Metadata ringan pilihan autentikasi untuk pemilih onboarding, resolusi penyedia pilihan, dan penghubungan flag CLI sederhana.                                                                                                                                              |
| `activation`                         | Tidak    | `object`                     | Metadata ringan perencana aktivasi untuk pemuatan yang dipicu oleh startup, penyedia, perintah, kanal, rute, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku sebenarnya.                                                                            |
| `setup`                              | Tidak    | `object`                     | Deskriptor ringan penyiapan/onboarding yang dapat diperiksa oleh antarmuka penemuan dan penyiapan tanpa memuat runtime Plugin.                                                                                                                                              |
| `qaRunners`                          | Tidak    | `object[]`                   | Deskriptor ringan pelaksana QA yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                                                               |
| `contracts`                          | Tidak    | `object`                     | Cuplikan statis kepemilikan kapabilitas untuk hook autentikasi eksternal, embedding, ucapan, transkripsi waktu nyata, suara waktu nyata, pemahaman media, pembuatan gambar/video/musik, pengambilan web, pencarian web, penyedia pekerja, ekstraksi dokumen/konten web, dan kepemilikan alat. |
| `configContracts`                    | Tidak    | `object`                     | Perilaku konfigurasi milik manifes yang digunakan oleh pembantu inti generik: deteksi flag berbahaya, target migrasi SecretRef, dan penyempitan jalur konfigurasi lama. Lihat [referensi configContracts](#configcontracts-reference).                                        |
| `mediaUnderstandingProviderMetadata` | Tidak    | `Record<string, object>`     | Default pemahaman media berbiaya rendah untuk ID penyedia yang dideklarasikan dalam `contracts.mediaUnderstandingProviders`.                                                                                                                                                 |
| `imageGenerationProviderMetadata`    | Tidak    | `Record<string, object>`     | Metadata autentikasi pembuatan gambar berbiaya rendah untuk ID penyedia yang dideklarasikan dalam `contracts.imageGenerationProviders`, termasuk alias autentikasi milik penyedia dan pengaman URL dasar.                                                                    |
| `videoGenerationProviderMetadata`    | Tidak    | `Record<string, object>`     | Metadata autentikasi pembuatan video berbiaya rendah untuk ID penyedia yang dideklarasikan dalam `contracts.videoGenerationProviders`, termasuk alias autentikasi milik penyedia dan pengaman URL dasar.                                                                     |
| `musicGenerationProviderMetadata`    | Tidak    | `Record<string, object>`     | Metadata autentikasi pembuatan musik berbiaya rendah untuk ID penyedia yang dideklarasikan dalam `contracts.musicGenerationProviders`, termasuk alias autentikasi milik penyedia dan pengaman URL dasar.                                                                     |
| `toolMetadata`                       | Tidak    | `Record<string, object>`     | Metadata ketersediaan berbiaya rendah untuk alat milik plugin yang dideklarasikan dalam `contracts.tools`. Gunakan ketika alat tidak boleh memuat runtime kecuali terdapat bukti konfigurasi, variabel lingkungan, atau autentikasi.                                           |
| `channelConfigs`                     | Tidak    | `Record<string, object>`     | Metadata konfigurasi kanal milik manifes yang digabungkan ke permukaan penemuan dan validasi sebelum runtime dimuat.                                                                                                                                                        |
| `skills`                             | Tidak    | `string[]`                   | Direktori Skills yang akan dimuat, relatif terhadap akar plugin.                                                                                                                                                                                                            |
| `name`                               | Tidak    | `string`                     | Nama plugin yang mudah dibaca manusia.                                                                                                                                                                                                                                     |
| `description`                        | Tidak    | `string`                     | Ringkasan singkat yang ditampilkan pada permukaan plugin.                                                                                                                                                                                                                   |
| `catalog`                            | Tidak    | `object`                     | Petunjuk penyajian opsional untuk permukaan katalog plugin. Metadata ini tidak menginstal, mengaktifkan, atau memberikan kepercayaan kepada plugin.                                                                                                                         |
| `icon`                               | Tidak    | `string`                     | URL gambar HTTPS untuk kartu lokapasar/katalog. ClawHub menerima URL `https://` apa pun yang valid dan kembali menggunakan ikon plugin default ketika nilai ini dihilangkan atau tidak valid.                                                                                |
| `version`                            | Tidak    | `string`                     | Versi plugin yang bersifat informatif.                                                                                                                                                                                                                                     |
| `uiHints`                            | Tidak    | `Record<string, object>`     | Label UI, teks pengganti, dan petunjuk sensitivitas untuk bidang konfigurasi.                                                                                                                                                                                               |

## referensi katalog

`catalog` menyediakan petunjuk tampilan opsional untuk penjelajah Plugin. Host dapat mengabaikan petunjuk ini. Petunjuk tersebut tidak pernah menginstal atau mengaktifkan Plugin, serta tidak mengubah perilaku runtime atau tingkat kepercayaannya.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Bidang     | Jenis     | Artinya                                                                        |
| ---------- | --------- | ------------------------------------------------------------------------------ |
| `featured` | `boolean` | Apakah permukaan katalog harus menampilkan Plugin ini sebagai unggulan.        |
| `order`    | `number`  | Petunjuk urutan tampilan menaik di antara Plugin pilihan; nilai lebih rendah ditampilkan lebih awal. |

## referensi metadata penyedia pembuatan

Bidang metadata penyedia pembuatan menjelaskan sinyal autentikasi statis untuk penyedia yang dideklarasikan dalam daftar `contracts.*GenerationProviders` yang sesuai. OpenClaw membaca bidang ini sebelum runtime penyedia dimuat agar alat inti dapat menentukan apakah penyedia pembuatan tersedia tanpa mengimpor setiap Plugin penyedia.

Gunakan bidang ini hanya untuk fakta deklaratif yang mudah diperiksa. Transportasi, transformasi permintaan, penyegaran token, validasi kredensial, dan perilaku pembuatan yang sebenarnya tetap berada dalam runtime Plugin.

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

| Bidang                 | Wajib | Jenis      | Artinya                                                                                                                                              |
| ---------------------- | ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Tidak | `string[]` | ID penyedia tambahan yang harus dianggap sebagai alias autentikasi statis untuk penyedia pembuatan.                                                  |
| `authProviders`        | Tidak | `string[]` | ID penyedia yang profil autentikasinya telah dikonfigurasi dan harus dianggap sebagai autentikasi untuk penyedia pembuatan ini.                      |
| `configSignals`        | Tidak | `object[]` | Sinyal ketersediaan murah berbasis konfigurasi saja untuk penyedia lokal atau yang dihosting sendiri dan dapat dikonfigurasi tanpa profil autentikasi atau variabel lingkungan. |
| `authSignals`          | Tidak | `object[]` | Sinyal autentikasi eksplisit. Jika tersedia, sinyal ini menggantikan kumpulan sinyal bawaan dari ID penyedia, `aliases`, dan `authProviders`.         |
| `referenceAudioInputs` | Tidak | `boolean`  | Hanya untuk pembuatan video. Atur ke `true` jika penyedia menerima aset audio referensi; jika tidak, `video_generate` menyembunyikan parameter referensi audio. |

Setiap entri `configSignals` mendukung:

| Bidang           | Wajib | Jenis      | Artinya                                                                                                                                                                                        |
| ---------------- | ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ya    | `string`   | Jalur titik menuju objek konfigurasi milik Plugin yang akan diperiksa, misalnya `plugins.entries.example.config`.                                                                               |
| `overlayPath`    | Tidak | `string`   | Jalur titik di dalam konfigurasi akar yang objeknya harus menimpa objek akar sebelum sinyal dievaluasi. Gunakan ini untuk konfigurasi khusus kapabilitas seperti `image`, `video`, atau `music`. |
| `overlayMapPath` | Tidak | `string`   | Jalur titik di dalam konfigurasi akar yang setiap nilai objeknya harus menimpa objek akar. Gunakan ini untuk peta akun bernama seperti `accounts`, ketika akun mana pun yang dikonfigurasi dapat memenuhi syarat. |
| `required`       | Tidak | `string[]` | Jalur titik di dalam konfigurasi efektif yang harus memiliki nilai terkonfigurasi. String tidak boleh kosong; objek dan larik tidak boleh kosong.                                               |
| `requiredAny`    | Tidak | `string[]` | Jalur titik di dalam konfigurasi efektif yang setidaknya salah satunya harus memiliki nilai terkonfigurasi.                                                                                     |
| `mode`           | Tidak | `object`   | Pembatas mode string opsional di dalam konfigurasi efektif. Gunakan ini ketika ketersediaan berbasis konfigurasi saja hanya berlaku untuk satu mode.                                            |

Setiap pembatas `mode` mendukung:

| Bidang       | Wajib | Jenis      | Artinya                                                                                           |
| ------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------- |
| `path`       | Tidak | `string`   | Jalur titik di dalam konfigurasi efektif. Nilai bawaannya adalah `mode`.                           |
| `default`    | Tidak | `string`   | Nilai mode yang digunakan jika konfigurasi tidak menyertakan jalur tersebut.                      |
| `allowed`    | Tidak | `string[]` | Jika tersedia, sinyal hanya lolos ketika mode efektif merupakan salah satu nilai ini.             |
| `disallowed` | Tidak | `string[]` | Jika tersedia, sinyal gagal ketika mode efektif merupakan salah satu nilai ini.                   |

Setiap entri `authSignals` mendukung:

| Bidang            | Wajib | Jenis    | Artinya                                                                                                                                                                        |
| ----------------- | ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ya    | `string` | ID penyedia yang akan diperiksa dalam profil autentikasi yang dikonfigurasi.                                                                                                   |
| `providerBaseUrl` | Tidak | `object` | Pembatas opsional yang membuat sinyal hanya diperhitungkan ketika penyedia terkonfigurasi yang dirujuk menggunakan URL dasar yang diizinkan. Gunakan ini jika alias autentikasi hanya valid untuk API tertentu. |

Setiap pembatas `providerBaseUrl` mendukung:

| Bidang            | Wajib | Jenis      | Artinya                                                                                                                                                 |
| ----------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya    | `string`   | ID konfigurasi penyedia yang `baseUrl`-nya harus diperiksa.                                                                                             |
| `defaultBaseUrl`  | Tidak | `string`   | URL dasar yang diasumsikan jika konfigurasi penyedia tidak menyertakan `baseUrl`.                                                                       |
| `allowedBaseUrls` | Ya    | `string[]` | URL dasar yang diizinkan untuk sinyal autentikasi ini. Sinyal diabaikan jika URL dasar terkonfigurasi atau bawaan tidak cocok dengan salah satu nilai yang dinormalisasi ini. |

## referensi metadata alat

`toolMetadata` menggunakan bentuk `configSignals` dan `authSignals` yang sama seperti metadata penyedia pembuatan, dengan nama alat sebagai kunci. `contracts.tools` mendeklarasikan kepemilikan. `toolMetadata` mendeklarasikan bukti ketersediaan yang mudah diperiksa agar OpenClaw dapat menghindari pengimporan runtime Plugin hanya untuk mendapatkan nilai `null` dari factory alatnya.

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

Entri `toolMetadata` juga menerima `optional` (menandai alat sebagai tidak wajib untuk aktivasi Plugin) dan `replaySafe` (menandai eksekusi alat sebagai aman untuk diulang setelah giliran model yang tidak selesai), selain bidang bersama `configSignals`/`authSignals` di atas.

Jika suatu alat tidak memiliki `toolMetadata`, OpenClaw mempertahankan perilaku yang ada dan memuat Plugin pemilik ketika kontrak alat sesuai dengan kebijakan. Untuk alat pada jalur kritis yang factory-nya bergantung pada autentikasi/konfigurasi, pembuat Plugin harus mendeklarasikan `toolMetadata`, bukan membuat inti mengimpor runtime untuk menanyakannya.

## referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan orientasi awal atau autentikasi. OpenClaw membacanya sebelum runtime penyedia dimuat. Daftar penyiapan penyedia menggunakan pilihan manifes ini, pilihan penyiapan yang diturunkan dari deskriptor, dan metadata katalog instalasi tanpa memuat runtime penyedia.

| Bidang                | Wajib | Tipe                                                                  | Artinya                                                                                                                   |
| --------------------- | ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya    | `string`                                                              | ID penyedia yang memiliki pilihan ini.                                                                                    |
| `method`              | Ya    | `string`                                                              | ID metode autentikasi yang menjadi tujuan pengiriman.                                                                     |
| `choiceId`            | Ya    | `string`                                                              | ID pilihan autentikasi stabil yang digunakan oleh alur orientasi awal dan CLI.                                             |
| `choiceLabel`         | Tidak | `string`                                                              | Label yang ditampilkan kepada pengguna. Jika dihilangkan, OpenClaw menggunakan `choiceId` sebagai nilai cadangan.          |
| `choiceHint`          | Tidak | `string`                                                              | Teks bantuan singkat untuk pemilih.                                                                                       |
| `assistantPriority`   | Tidak | `number`                                                              | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan oleh asisten.                        |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                                        | Sembunyikan pilihan dari pemilih asisten, tetapi tetap izinkan pemilihan CLI secara manual.                                |
| `deprecatedChoiceIds` | Tidak | `string[]`                                                            | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                                  |
| `groupId`             | Tidak | `string`                                                              | ID grup opsional untuk mengelompokkan pilihan terkait.                                                                    |
| `groupLabel`          | Tidak | `string`                                                              | Label yang ditampilkan kepada pengguna untuk grup tersebut.                                                               |
| `groupHint`           | Tidak | `string`                                                              | Teks bantuan singkat untuk grup.                                                                                          |
| `onboardingFeatured`  | Tidak | `boolean`                                                             | Tampilkan grup ini pada tingkat unggulan pemilih orientasi awal interaktif, sebelum entri "Lainnya...".                    |
| `optionKey`           | Tidak | `string`                                                              | Kunci opsi internal untuk alur autentikasi sederhana dengan satu flag.                                                     |
| `cliFlag`             | Tidak | `string`                                                              | Nama flag CLI, seperti `--openrouter-api-key`.                                                                            |
| `cliOption`           | Tidak | `string`                                                              | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                                             |
| `cliDescription`      | Tidak | `string`                                                              | Deskripsi yang digunakan dalam bantuan CLI.                                                                               |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Permukaan orientasi awal tempat pilihan ini harus ditampilkan. Jika dihilangkan, nilai bawaannya adalah `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` ketika sebuah plugin memiliki nama perintah runtime yang mungkin secara keliru dimasukkan pengguna ke dalam `plugins.allow` atau dicoba dijalankan sebagai perintah CLI root. OpenClaw menggunakan metadata ini untuk diagnostik tanpa mengimpor kode runtime plugin.

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

| Bidang       | Wajib | Tipe              | Artinya                                                                            |
| ------------ | ----- | ----------------- | ---------------------------------------------------------------------------------- |
| `name`       | Ya    | `string`          | Nama perintah yang dimiliki plugin ini.                                             |
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai perintah garis miring obrolan, bukan perintah CLI root.      |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika tersedia.         |

## Referensi activation

Gunakan `activation` ketika plugin dapat dengan mudah mendeklarasikan peristiwa bidang kendali yang harus menyertakannya dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata perencana, bukan API siklus hidup. Blok ini tidak mendaftarkan perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa kode plugin telah dijalankan. Perencana aktivasi menggunakan bidang-bidang ini untuk mempersempit kandidat plugin sebelum kembali menggunakan metadata kepemilikan manifes yang ada, seperti `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook.

Utamakan metadata tersempit yang sudah menjelaskan kepemilikan. Gunakan `providers`, `channels`, `commandAliases`, deskriptor penyiapan, atau `contracts` ketika bidang-bidang tersebut menyatakan hubungannya. Gunakan `activation` untuk petunjuk perencana tambahan yang tidak dapat direpresentasikan oleh bidang kepemilikan tersebut. Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`, `my-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk ID harness agen tertanam yang belum memiliki bidang kepemilikan.

Setiap plugin harus mengatur `activation.onStartup` secara sengaja. Atur ke `true` hanya ketika plugin harus berjalan selama proses awal Gateway. Atur ke `false` ketika plugin tidak aktif saat proses awal dan hanya boleh dimuat dari pemicu yang lebih spesifik. Menghilangkan `onStartup` tidak lagi secara implisit memuat plugin saat proses awal; gunakan metadata aktivasi eksplisit untuk pemicu aktivasi proses awal, saluran, konfigurasi, harness agen, memori, atau pemicu lain yang lebih spesifik.

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

| Bidang             | Wajib | Tipe                                                 | Artinya                                                                                                                                                                                                    |
| ------------------ | ----- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Tidak | `boolean`                                            | Aktivasi proses awal Gateway secara eksplisit. Setiap plugin harus mengatur ini. `true` mengimpor plugin selama proses awal; `false` membuatnya dimuat secara tunda saat proses awal kecuali pemicu lain yang cocok mengharuskan pemuatan. |
| `onProviders`      | Tidak | `string[]`                                           | ID penyedia yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                              |
| `onAgentHarnesses` | Tidak | `string[]`                                           | ID runtime harness agen tertanam yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                                             |
| `onCommands`       | Tidak | `string[]`                                           | ID perintah yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                              |
| `onChannels`       | Tidak | `string[]`                                           | ID saluran yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                               |
| `onRoutes`         | Tidak | `string[]`                                           | Jenis rute yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                               |
| `onConfigPaths`    | Tidak | `string[]`                                           | Jalur konfigurasi relatif terhadap root yang harus menyertakan plugin ini dalam rencana proses awal/pemuatan ketika jalur tersebut tersedia dan tidak dinonaktifkan secara eksplisit.                       |
| `onCapabilities`   | Tidak | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas umum yang digunakan oleh perencanaan aktivasi bidang kendali. Utamakan bidang yang lebih spesifik jika memungkinkan.                                                                  |

Konsumen aktif saat ini:

- Perencanaan proses awal Gateway menggunakan `activation.onStartup` untuk impor proses awal secara eksplisit.
- Perencanaan CLI yang dipicu perintah kembali menggunakan `commandAliases[].cliCommand` atau `commandAliases[].name` lama.
- Perencanaan proses awal runtime agen menggunakan `activation.onAgentHarnesses` untuk harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI.
- Perencanaan penyiapan/saluran yang dipicu saluran kembali menggunakan kepemilikan `channels[]` lama ketika metadata aktivasi saluran eksplisit tidak tersedia.
- Perencanaan plugin proses awal menggunakan `activation.onConfigPaths` untuk permukaan konfigurasi root non-saluran, seperti blok `browser` milik plugin peramban bawaan.
- Perencanaan penyiapan/runtime yang dipicu penyedia kembali menggunakan kepemilikan `providers[]` lama dan `cliBackends[]` tingkat atas ketika metadata aktivasi penyedia eksplisit tidak tersedia.

Diagnostik perencana dapat membedakan petunjuk aktivasi eksplisit dari penggunaan cadangan kepemilikan manifes. Misalnya, `activation-command-hint` berarti `activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti perencana menggunakan kepemilikan `commandAliases`. Label alasan ini ditujukan untuk diagnostik host dan pengujian; penulis plugin harus tetap mendeklarasikan metadata yang paling tepat menjelaskan kepemilikan.

## Referensi qaRunners

Gunakan `qaRunners` ketika plugin menyediakan satu atau beberapa runner transportasi di bawah
root bersama `openclaw qa`. Jaga agar metadata ini ringan dan statis; runtime plugin
tetap memiliki pendaftaran CLI yang sebenarnya melalui permukaan ringan
`runtime-api.ts` yang mengekspor `qaRunnerCliRegistrations` yang cocok. Sebuah
`adapterFactory` opsional mengekspos transportasi ke skenario QA bersama tanpa
mengubah runner perintah yang terdaftar.

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

| Bidang        | Wajib | Tipe     | Artinya                                                                                 |
| ------------- | ----- | -------- | --------------------------------------------------------------------------------------- |
| `commandName` | Ya    | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`.                    |
| `description` | Tidak | `string` | Teks bantuan cadangan yang digunakan ketika host bersama memerlukan perintah stub.      |

ID `adapterFactory` harus cocok dengan `commandName`. Jangan mengekspor pendaftaran
untuk perintah yang tidak ada dalam manifes.

## referensi setup

Gunakan `setup` ketika antarmuka penyiapan dan orientasi memerlukan metadata murah milik plugin sebelum runtime dimuat.

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

`cliBackends` tingkat teratas tetap valid dan terus mendeskripsikan backend inferensi CLI. `setup.cliBackends` adalah antarmuka deskriptor khusus penyiapan untuk alur bidang kontrol/penyiapan yang harus tetap hanya berupa metadata.

Jika tersedia, `setup.providers` dan `setup.cliBackends` merupakan antarmuka pencarian berbasis deskriptor yang diutamakan untuk penemuan penyiapan. Jika deskriptor hanya mempersempit plugin kandidat dan penyiapan masih memerlukan hook runtime waktu penyiapan yang lebih lengkap, tetapkan `requiresRuntime: true` dan pertahankan `setup-api` sebagai jalur eksekusi cadangan.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam pencarian autentikasi penyedia dan variabel lingkungan generik. `providerAuthEnvVars` tetap didukung melalui adaptor kompatibilitas selama periode penghentian, tetapi plugin yang tidak dibundel dan masih menggunakannya akan menerima diagnostik manifes. Plugin baru harus menempatkan metadata lingkungan penyiapan/status di `setup.providers[].envVars`.

Gunakan `providerUsageAuthEnvVars` ketika kredensial tingkat penagihan atau organisasi harus mengaktifkan `resolveUsageAuth` tanpa menjadi kredensial inferensi. Nama-nama ini disertakan dalam pemblokiran dotenv ruang kerja, penghapusan dari proses anak ACP, pemfilteran rahasia sandbox, dan pembersihan rahasia secara luas. Runtime penyedia tetap membaca dan mengklasifikasikan nilai tersebut di dalam `resolveUsageAuth`.

OpenClaw juga dapat memperoleh pilihan penyiapan sederhana dari `setup.providers[].authMethods` ketika tidak ada entri penyiapan, atau ketika `setup.requiresRuntime: false` menyatakan bahwa runtime penyiapan tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap diutamakan untuk label khusus, flag CLI, cakupan orientasi, dan metadata asisten.

Tetapkan `requiresRuntime: false` hanya ketika deskriptor tersebut memadai untuk antarmuka penyiapan. OpenClaw memperlakukan `false` eksplisit sebagai kontrak khusus deskriptor dan tidak akan mengeksekusi `setup-api` atau `openclaw.setupEntry` untuk pencarian penyiapan. Jika plugin khusus deskriptor masih menyertakan salah satu entri runtime penyiapan tersebut, OpenClaw melaporkan diagnostik tambahan dan terus mengabaikannya. Tidak mencantumkan `requiresRuntime` mempertahankan perilaku cadangan lama agar plugin yang sudah ada dan menambahkan deskriptor tanpa flag tersebut tidak rusak.

Karena pencarian penyiapan dapat mengeksekusi kode `setup-api` milik plugin, nilai `setup.providers[].id` dan `setup.cliBackends[]` yang telah dinormalisasi harus tetap unik di seluruh plugin yang ditemukan. Kepemilikan yang ambigu akan ditolak secara aman alih-alih memilih pemenang berdasarkan urutan penemuan.

Ketika runtime penyiapan dijalankan, diagnostik registri penyiapan melaporkan penyimpangan deskriptor jika `setup-api` mendaftarkan penyedia atau backend CLI yang tidak dideklarasikan oleh deskriptor manifes, atau jika deskriptor tidak memiliki pendaftaran runtime yang cocok. Diagnostik ini bersifat tambahan dan tidak menolak plugin lama.

### referensi setup.providers

| Bidang         | Wajib | Jenis      | Artinya                                                                                                  |
| -------------- | ----- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `id`           | Ya    | `string`   | ID penyedia yang diekspos selama penyiapan atau orientasi. Pastikan ID yang dinormalisasi unik secara global. |
| `authMethods`  | Tidak | `string[]` | ID metode penyiapan/autentikasi yang didukung penyedia ini tanpa memuat runtime lengkap.                 |
| `envVars`      | Tidak | `string[]` | Variabel lingkungan yang dapat diperiksa antarmuka penyiapan/status generik sebelum runtime plugin dimuat. |
| `authEvidence` | Tidak | `object[]` | Pemeriksaan bukti autentikasi lokal yang murah untuk penyedia yang dapat mengautentikasi melalui penanda nonrahasia. |

`authEvidence` ditujukan untuk penanda kredensial lokal milik penyedia yang dapat diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap murah dan lokal: tanpa panggilan jaringan, tanpa pembacaan rantai kunci atau pengelola rahasia, tanpa perintah shell, dan tanpa pemeriksaan API penyedia.

Entri bukti yang didukung:

| Bidang             | Wajib | Jenis      | Artinya                                                                                                               |
| ------------------ | ----- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ya    | `string`   | Saat ini `local-file-with-env`.                                                                                       |
| `fileEnvVar`       | Tidak | `string`   | Variabel lingkungan yang berisi jalur eksplisit ke berkas kredensial.                                                 |
| `fallbackPaths`    | Tidak | `string[]` | Jalur berkas kredensial lokal yang diperiksa ketika `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak | `string[]` | Setidaknya satu variabel lingkungan yang tercantum harus tidak kosong agar bukti valid.                               |
| `requiresAllEnv`   | Tidak | `string[]` | Semua variabel lingkungan yang tercantum harus tidak kosong agar bukti valid.                                         |
| `credentialMarker` | Ya    | `string`   | Penanda nonrahasia yang dikembalikan ketika bukti tersedia.                                                           |
| `source`           | Tidak | `string`   | Label sumber yang ditampilkan kepada pengguna untuk keluaran autentikasi/status.                                      |

### bidang setup

| Bidang             | Wajib | Jenis      | Artinya                                                                                                  |
| ------------------ | ----- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `providers`        | Tidak | `object[]` | Deskriptor penyiapan penyedia yang diekspos selama penyiapan dan orientasi.                              |
| `cliBackends`      | Tidak | `string[]` | ID backend waktu penyiapan yang digunakan untuk pencarian penyiapan berbasis deskriptor. Pastikan ID yang dinormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | ID migrasi konfigurasi yang dimiliki oleh antarmuka penyiapan plugin ini.                                |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah penyiapan masih memerlukan eksekusi `setup-api` setelah pencarian deskriptor.                     |

## referensi uiHints

`uiHints` adalah pemetaan dari nama bidang konfigurasi ke petunjuk perenderan ringkas. Kunci dapat menggunakan titik untuk bidang konfigurasi bersarang, tetapi tidak ada segmen jalur yang boleh berupa `__proto__`, `constructor`, atau `prototype`; penyiapan menolak nama-nama tersebut.

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

| Bidang        | Jenis      | Artinya                                           |
| ------------- | ---------- | ------------------------------------------------- |
| `label`       | `string`   | Label bidang yang ditampilkan kepada pengguna.    |
| `help`        | `string`   | Teks bantuan singkat.                             |
| `tags`        | `string[]` | Tag UI opsional.                                  |
| `advanced`    | `boolean`  | Menandai bidang sebagai lanjutan.                 |
| `sensitive`   | `boolean`  | Menandai bidang sebagai rahasia atau sensitif.    |
| `placeholder` | `string`   | Teks placeholder untuk masukan formulir.          |

## referensi contracts

Gunakan `contracts` hanya untuk metadata kepemilikan kemampuan statis yang dapat dibaca OpenClaw tanpa mengimpor runtime plugin.

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
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Setiap daftar bersifat opsional:

| Bidang                           | Tipe       | Artinya                                                                                                                                      |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID pabrik ekstensi app-server Codex, saat ini `codex-app-server`.                                                                            |
| `agentToolResultMiddleware`      | `string[]` | ID runtime yang dapat didaftarkan middleware hasil alat oleh plugin ini.                                                                     |
| `trustedToolPolicies`            | `string[]` | ID kebijakan tepercaya pra-alat lokal plugin yang dapat didaftarkan oleh plugin terinstal. Plugin bawaan dapat mendaftarkan kebijakan tanpa bidang ini. |
| `externalAuthProviders`          | `string[]` | ID penyedia yang hook profil autentikasi eksternalnya dimiliki plugin ini.                                                                   |
| `embeddingProviders`             | `string[]` | ID penyedia embedding umum yang dimiliki plugin ini untuk penggunaan embedding vektor yang dapat digunakan kembali, termasuk memori.         |
| `speechProviders`                | `string[]` | ID penyedia ucapan yang dimiliki plugin ini.                                                                                                 |
| `realtimeTranscriptionProviders` | `string[]` | ID penyedia transkripsi waktu nyata yang dimiliki plugin ini.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | ID penyedia suara waktu nyata yang dimiliki plugin ini.                                                                                      |
| `memoryEmbeddingProviders`       | `string[]` | ID penyedia embedding khusus memori yang sudah tidak digunakan dan dimiliki plugin ini.                                                      |
| `mediaUnderstandingProviders`    | `string[]` | ID penyedia pemahaman media yang dimiliki plugin ini.                                                                                        |
| `transcriptSourceProviders`      | `string[]` | ID penyedia sumber transkrip yang dimiliki plugin ini.                                                                                       |
| `documentExtractors`             | `string[]` | ID penyedia ekstraktor dokumen (misalnya PDF) yang dimiliki plugin ini.                                                                      |
| `imageGenerationProviders`       | `string[]` | ID penyedia pembuatan gambar yang dimiliki plugin ini.                                                                                       |
| `videoGenerationProviders`       | `string[]` | ID penyedia pembuatan video yang dimiliki plugin ini.                                                                                        |
| `musicGenerationProviders`       | `string[]` | ID penyedia pembuatan musik yang dimiliki plugin ini.                                                                                        |
| `webContentExtractors`           | `string[]` | ID penyedia ekstraksi konten halaman web yang dimiliki plugin ini.                                                                           |
| `webFetchProviders`              | `string[]` | ID penyedia pengambilan web yang dimiliki plugin ini.                                                                                        |
| `webSearchProviders`             | `string[]` | ID penyedia pencarian web yang dimiliki plugin ini.                                                                                          |
| `workerProviders`                | `string[]` | ID penyedia pekerja cloud yang dimiliki plugin ini untuk penyediaan dan siklus hidup sewa berbasis profil.                                    |
| `usageProviders`                 | `string[]` | ID penyedia yang hook autentikasi penggunaan dan snapshot penggunaannya dimiliki plugin ini.                                                 |
| `migrationProviders`             | `string[]` | ID penyedia impor yang dimiliki plugin ini untuk `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Hak akses yang dicadangkan untuk rute HTTP plugin terautentikasi yang mengeksekusi metode Gateway dalam proses.                               |
| `tools`                          | `string[]` | Nama alat agen yang dimiliki plugin ini.                                                                                                     |

`contracts.embeddedExtensionFactories` dipertahankan untuk pabrik ekstensi khusus app-server Codex bawaan. Transformasi hasil alat bawaan sebaiknya mendeklarasikan `contracts.agentToolResultMiddleware` dan sebagai gantinya mendaftar dengan `api.registerAgentToolResultMiddleware(...)`. Plugin terinstal dapat menggunakan celah middleware yang sama hanya ketika diaktifkan secara eksplisit dan hanya untuk runtime yang dideklarasikan dalam `contracts.agentToolResultMiddleware`.

Plugin terinstal yang memerlukan tingkat kebijakan pra-alat tepercaya host harus mendeklarasikan setiap ID lokal yang didaftarkan dalam `contracts.trustedToolPolicies` dan diaktifkan secara eksplisit. Plugin bawaan mempertahankan jalur kebijakan tepercaya yang ada, tetapi plugin terinstal dengan ID kebijakan yang tidak dideklarasikan akan ditolak sebelum pendaftaran. ID kebijakan dibatasi cakupannya pada plugin yang mendaftar, sehingga dua plugin dapat sama-sama mendeklarasikan dan mendaftarkan `workflow-budget`; satu plugin tidak boleh mendaftarkan ID lokal yang sama dua kali.

Pendaftaran `api.registerTool(...)` saat runtime harus cocok dengan `contracts.tools`. Penemuan alat menggunakan daftar ini untuk hanya memuat runtime plugin yang dapat memiliki alat yang diminta.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` sebaiknya mendeklarasikan `contracts.externalAuthProviders`; hook autentikasi eksternal yang tidak dideklarasikan akan diabaikan.

Plugin penyedia yang mengimplementasikan `resolveUsageAuth` dan `fetchUsageSnapshot` sebaiknya mendeklarasikan setiap ID penyedia yang ditemukan secara otomatis dalam `contracts.usageProviders`. Penemuan penggunaan membaca kontrak ini sebelum memuat kode runtime, lalu memverifikasi kedua hook setelah hanya memuat pemilik yang dideklarasikan.

Penyedia embedding umum sebaiknya mendeklarasikan `contracts.embeddingProviders` untuk setiap adaptor yang didaftarkan dengan `api.registerEmbeddingProvider(...)`. Gunakan kontrak umum untuk pembuatan vektor yang dapat digunakan kembali, termasuk penyedia yang digunakan oleh pencarian memori. `contracts.memoryEmbeddingProviders` adalah kompatibilitas khusus memori yang sudah tidak digunakan dan hanya dipertahankan selama penyedia yang ada bermigrasi ke celah penyedia embedding generik.

Penyedia pekerja harus mendeklarasikan setiap ID `api.registerWorkerProvider(...)` dalam `contracts.workerProviders`. Core menyimpan maksud yang persisten sebelum memanggil `provision`; penyedia memvalidasi pengaturannya sebelum alokasi eksternal, dan pemanggilan berulang dengan ID operasi yang sama harus menggunakan sewa yang sama. Core juga menyimpan snapshot pengaturan tervalidasi tersebut dan meneruskannya bersama `leaseId` ke `inspect({ leaseId, profile })` dan `destroy({ leaseId, profile })`, termasuk setelah profil bernama diubah atau dihapus. Penghancuran bersifat idempoten, pemeriksaan mengembalikan union status tertutup `active` / `destroyed` / `unknown`, dan materi kunci privat SSH hanya direferensikan melalui `SecretRef`. Endpoint SSH yang disediakan juga harus menyertakan `hostKey` publik dari keluaran penyediaan tepercaya dalam format persis `algorithm base64`, tanpa nama host atau komentar, agar core dapat menyematkan host sebelum terhubung. Penyedia yang membuat referensi identitas dinamis dapat mengimplementasikan `resolveSshIdentity({ leaseId, profile, keyRef })` yang otoritatif; penyedia tanpa implementasi tersebut menggunakan resolver rahasia generik milik core. Status `unknown` yang otoritatif menjadikan rekaman lokal aktif sebagai yatim; setelah permintaan penghancuran disimpan, status tersebut mengonfirmasi pembongkaran.

`contracts.gatewayMethodDispatch` saat ini menerima `"authenticated-request"`. Ini adalah gerbang kebersihan API untuk rute HTTP plugin native yang sengaja mengeksekusi metode bidang kontrol Gateway dalam proses, bukan sandbox terhadap plugin native berbahaya. Gunakan hanya untuk permukaan bawaan/operator yang ditinjau secara ketat dan sudah memerlukan autentikasi HTTP Gateway. Rute yang memiliki hak akses tetap dapat dijangkau saat penerimaan pekerjaan root Gateway ditutup hanya jika rute tersebut juga mendeklarasikan `auth: "gateway"` dan `gatewayRuntimeScopeSurface: "trusted-operator"` khusus rute; rute saudara biasa dari plugin yang sama tetap berada di balik batas penerimaan. Hal ini menjaga status penangguhan dan fungsi melanjutkan tetap dapat dijangkau tanpa memberikan bypass penerimaan kepada seluruh plugin. Jaga agar penguraian dan pembentukan respons tetap terbatas di luar eksekusi; pekerjaan substantif atau yang mengubah harus melalui eksekusi metode Gateway, yang memiliki penerapan penerimaan dan cakupan.

## Referensi configContracts

Gunakan `configContracts` untuk perilaku konfigurasi milik manifes yang diperlukan helper core generik tanpa mengimpor runtime plugin: deteksi flag berbahaya, target migrasi SecretRef, dan penyempitan jalur konfigurasi lama.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Bidang                        | Wajib    | Tipe       | Artinya                                                                                                                                                                                                                                                   |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Tidak    | `string[]` | Jalur konfigurasi relatif terhadap root yang menunjukkan bahwa migrasi kompatibilitas waktu penyiapan plugin ini mungkin berlaku. Memungkinkan pembacaan konfigurasi runtime generik melewati setiap permukaan penyiapan plugin saat konfigurasi tidak pernah mereferensikan plugin tersebut. |
| `compatibilityRuntimePaths`   | Tidak    | `string[]` | Jalur kompatibilitas relatif terhadap root yang dapat dilayani plugin ini selama runtime sebelum kode plugin diaktifkan sepenuhnya. Gunakan ini untuk permukaan lama yang sebaiknya mempersempit kumpulan kandidat bawaan tanpa mengimpor setiap runtime plugin yang kompatibel. |
| `dangerousFlags`              | Tidak    | `object[]` | Literal konfigurasi yang sebaiknya ditandai `openclaw doctor` sebagai tidak aman atau berbahaya saat diaktifkan. Lihat di bawah.                                                                                                                          |
| `secretInputs`                | Tidak    | `object`   | Jalur konfigurasi di bawah `plugins.entries.<id>.config` yang sebaiknya diperlakukan registri target migrasi/audit SecretRef sebagai string berbentuk rahasia. Lihat di bawah.                                                                             |

Setiap entri `dangerousFlags` mendukung:

| Bidang   | Wajib | Tipe                                  | Artinya                                                                                                                        |
| -------- | ----- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `path`   | Ya    | `string`                              | Jalur konfigurasi yang dipisahkan titik, relatif terhadap `plugins.entries.<id>.config`. Mendukung wildcard `*` untuk segmen peta/larik. |
| `equals` | Ya    | `string \| number \| boolean \| null` | Literal persis yang menandai nilai konfigurasi ini sebagai berbahaya.                                                         |

`secretInputs` mendukung:

| Bidang                  | Wajib | Tipe       | Artinya                                                                                                                                                                                                                      |
| ----------------------- | ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Tidak | `boolean`  | Timpa pengaktifan default Plugin bawaan saat menentukan apakah permukaan SecretRef ini aktif. Gunakan ini jika Plugin dibundel tetapi permukaannya harus tetap tidak aktif hingga diaktifkan secara eksplisit dalam konfigurasi. |
| `paths`                 | Ya    | `object[]` | Jalur konfigurasi berbentuk rahasia, masing-masing dengan `path` (dipisahkan titik, relatif terhadap `plugins.entries.<id>.config`, mendukung wildcard `*`) dan `expected` opsional (saat ini hanya `"string"`).                  |

## Referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` jika penyedia pemahaman media memiliki model default, prioritas fallback autentikasi otomatis, atau dukungan dokumen native yang diperlukan pembantu inti generik sebelum runtime dimuat. Kunci juga harus dideklarasikan dalam `contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Setiap entri penyedia dapat mencakup:

| Bidang                 | Tipe                                                             | Artinya                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Kemampuan media yang disediakan oleh penyedia ini.                                                                               |
| `defaultModels`        | `Record<string, string>`                                         | Default model untuk setiap kemampuan yang digunakan jika konfigurasi tidak menentukan model.                                    |
| `autoPriority`         | `Record<string, number>`                                         | Angka yang lebih rendah diurutkan lebih awal untuk fallback penyedia otomatis berbasis kredensial.                               |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Masukan dokumen native yang didukung oleh penyedia.                                                                              |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Penimpaan model untuk setiap jenis dokumen. Tetapkan `image: false` untuk menonaktifkan ekstraksi berbasis gambar bagi jenis itu. |

## Referensi channelConfigs

Gunakan `channelConfigs` jika Plugin saluran memerlukan metadata konfigurasi ringan sebelum runtime dimuat. Penemuan penyiapan/status saluran hanya-baca dapat langsung menggunakan metadata ini untuk saluran eksternal yang telah dikonfigurasi ketika tidak tersedia entri penyiapan, atau ketika `setup.requiresRuntime: false` menyatakan runtime penyiapan tidak diperlukan.

`channelConfigs` adalah metadata manifes Plugin, bukan bagian konfigurasi pengguna tingkat atas yang baru. Pengguna tetap mengonfigurasi instans saluran di bawah `channels.<channel-id>`. OpenClaw membaca metadata manifes untuk menentukan Plugin yang memiliki saluran terkonfigurasi tersebut sebelum kode runtime Plugin dijalankan.

Untuk Plugin saluran, `configSchema` dan `channelConfigs` menjelaskan jalur yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin yang tidak dibundel dan mendeklarasikan `channels[]` juga harus mendeklarasikan entri `channelConfigs` yang sesuai. Tanpanya, OpenClaw tetap dapat memuat Plugin, tetapi skema konfigurasi jalur dingin, penyiapan, dan permukaan UI Kontrol tidak dapat mengetahui bentuk opsi milik saluran hingga runtime Plugin dijalankan.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan `nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk pemeriksaan konfigurasi perintah yang berjalan sebelum runtime saluran dimuat. Saluran bawaan juga dapat menerbitkan default yang sama melalui `package.json#openclaw.channel.commands` bersama metadata katalog saluran lainnya yang dimiliki paket.

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

Setiap entri saluran dapat mencakup:

| Bidang        | Tipe                     | Artinya                                                                                                                       |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Skema JSON untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi saluran yang dideklarasikan.                            |
| `uiHints`     | `Record<string, object>` | Label UI, placeholder, dan petunjuk sensitif opsional untuk bagian konfigurasi saluran tersebut.                              |
| `label`       | `string`                 | Label saluran yang digabungkan ke permukaan pemilih dan pemeriksaan ketika metadata runtime belum siap.                       |
| `description` | `string`                 | Deskripsi singkat saluran untuk permukaan pemeriksaan dan katalog.                                                            |
| `commands`    | `object`                 | Default otomatis statis untuk perintah native dan Skills native bagi pemeriksaan konfigurasi sebelum runtime.                 |
| `preferOver`  | `string[]`               | ID Plugin lama atau berprioritas lebih rendah yang harus dikalahkan saluran ini dalam permukaan pemilihan.                    |

### Menggantikan Plugin saluran lain

Gunakan `preferOver` jika Plugin Anda merupakan pemilik yang diutamakan untuk ID saluran yang juga dapat disediakan oleh Plugin lain. Kasus yang umum adalah ID Plugin yang diubah namanya, Plugin mandiri yang menggantikan Plugin bawaan, atau fork terpelihara yang mempertahankan ID saluran yang sama demi kompatibilitas konfigurasi.

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

Ketika `channels.chat` dikonfigurasi, OpenClaw mempertimbangkan ID saluran dan ID Plugin yang diutamakan. Jika Plugin berprioritas lebih rendah hanya dipilih karena dibundel atau diaktifkan secara default, OpenClaw menonaktifkannya dalam konfigurasi runtime efektif agar satu Plugin memiliki saluran beserta alatnya. Pemilihan eksplisit pengguna tetap diutamakan: jika pengguna secara eksplisit mengaktifkan kedua Plugin (melalui `plugins.allow` atau konfigurasi `plugins.entries` yang nyata), OpenClaw mempertahankan pilihan tersebut dan melaporkan diagnostik duplikasi saluran/alat, alih-alih diam-diam mengubah kumpulan Plugin yang diminta.

Batasi cakupan `preferOver` pada ID Plugin yang benar-benar dapat menyediakan saluran yang sama. Ini bukan bidang prioritas umum dan tidak mengubah nama kunci konfigurasi pengguna.

## Referensi modelSupport

Gunakan `modelSupport` jika OpenClaw harus menyimpulkan Plugin penyedia Anda dari ID model singkat seperti `gpt-5.6-sol` atau `claude-sonnet-4.6` sebelum runtime Plugin dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan urutan prioritas berikut:

- referensi `provider/model` eksplisit menggunakan metadata manifes `providers` milik penyedia
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu Plugin yang tidak dibundel dan satu Plugin bawaan sama-sama cocok, Plugin yang tidak dibundel menang
- ambiguitas yang tersisa diabaikan hingga pengguna atau konfigurasi menentukan penyedia

Bidang:

| Bidang          | Tipe       | Artinya                                                                                          |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap ID model singkat.                            |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap ID model singkat setelah sufiks profil dihapus.             |

Entri `modelPatterns` dikompilasi melalui `compileSafeRegex`, yang menolak pola berisi pengulangan bersarang (misalnya `(a+)+$`). Pola yang gagal dalam pemeriksaan keamanan dilewati tanpa pemberitahuan, sama seperti regex yang secara sintaksis tidak valid. Buat pola tetap sederhana dan hindari kuantifier bersarang.

## Referensi modelCatalog

Gunakan `modelCatalog` jika OpenClaw harus mengetahui metadata model penyedia sebelum memuat runtime Plugin. Ini adalah sumber milik manifes untuk baris katalog tetap, alias penyedia, aturan penyembunyian, dan mode penemuan. Penyegaran runtime tetap menjadi tanggung jawab kode runtime penyedia, tetapi manifes memberi tahu inti kapan runtime diperlukan.

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

| Bidang           | Tipe                                                     | Artinya                                                                                                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki Plugin ini. Kunci juga harus muncul dalam `providers` tingkat atas.   |
| `aliases`        | `Record<string, object>`                                 | Alias penyedia yang harus diresolusikan ke penyedia milik Plugin untuk perencanaan katalog atau penyembunyian.       |
| `suppressions`   | `object[]`                                               | Baris model dari sumber lain yang disembunyikan Plugin ini karena alasan khusus penyedia.                            |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, disegarkan ke cache, atau memerlukan runtime.            |
| `runtimeAugment` | `boolean`                                                | Atur ke `true` hanya jika runtime penyedia harus menambahkan baris katalog setelah perencanaan manifes/konfigurasi. |

`aliases` berperan dalam pencarian kepemilikan penyedia untuk perencanaan katalog model. Target alias harus berupa penyedia tingkat atas yang dimiliki oleh Plugin yang sama. Ketika daftar yang difilter berdasarkan penyedia menggunakan alias, OpenClaw dapat membaca manifes pemilik dan menerapkan penggantian API/URL dasar alias tanpa memuat runtime penyedia. Alias tidak memperluas daftar katalog tanpa filter; daftar luas hanya menghasilkan baris penyedia kanonis milik pemilik.

`suppressions` menggantikan hook runtime penyedia `suppressBuiltInModel` yang lama. Entri penyembunyian hanya diterapkan jika penyedia dimiliki oleh Plugin atau dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia milik Plugin. Hook penyembunyian runtime tidak lagi dipanggil selama resolusi model.

Bidang penyedia:

| Bidang                | Tipe                     | Artinya                                                                                                                                                                                                                               |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL dasar default opsional untuk model dalam katalog penyedia ini.                                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adaptor API default opsional untuk model dalam katalog penyedia ini.                                                                                                                                                                   |
| `headers`             | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.                                                                                                                                                                       |
| `defaultUtilityModel` | `string`                 | Id model kecil rekomendasi penyedia yang bersifat opsional untuk tugas utilitas internal singkat (judul, narasi progres). Digunakan ketika `agents.defaults.utilityModel` tidak diatur dan penyedia ini melayani model utama agen.       |
| `models`              | `object[]`               | Baris model yang wajib ada. Baris tanpa `id` diabaikan.                                                                                                                                                                                |

Bidang model:

| Bidang             | Tipe                                                           | Artinya                                                                                   |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Id model lokal penyedia, tanpa prefiks `provider/`.                                       |
| `name`             | `string`                                                       | Nama tampilan opsional.                                                                   |
| `api`              | `ModelApi`                                                     | Penggantian API per model yang bersifat opsional.                                         |
| `baseUrl`          | `string`                                                       | Penggantian URL dasar per model yang bersifat opsional.                                   |
| `headers`          | `Record<string, string>`                                       | Header statis per model yang bersifat opsional.                                           |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalitas yang diterima model. Nilai lain dibuang tanpa pemberitahuan.                    |
| `reasoning`        | `boolean`                                                      | Apakah model menyediakan perilaku penalaran.                                              |
| `contextWindow`    | `number`                                                       | Jendela konteks bawaan penyedia.                                                          |
| `contextTokens`    | `number`                                                       | Batas konteks runtime efektif opsional jika berbeda dari `contextWindow`.                 |
| `maxTokens`        | `number`                                                       | Token keluaran maksimum jika diketahui.                                                   |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Penggantian id model atau parameter per tingkat pemikiran yang bersifat opsional.         |
| `cost`             | `object`                                                       | Harga opsional dalam USD per sejuta token, termasuk `tieredPricing` opsional.             |
| `compat`           | `object`                                                       | Penanda kompatibilitas opsional yang cocok dengan kompatibilitas konfigurasi model OpenClaw. |
| `mediaInput`       | `object`                                                       | Konfigurasi masukan per modalitas yang bersifat opsional, saat ini hanya untuk gambar.     |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status dalam daftar. Sembunyikan hanya jika baris sama sekali tidak boleh muncul.         |
| `statusReason`     | `string`                                                       | Alasan opsional yang ditampilkan bersama status selain tersedia.                          |
| `replaces`         | `string[]`                                                     | Id model lokal penyedia lama yang digantikan oleh model ini.                              |
| `replacedBy`       | `string`                                                       | Id model lokal penyedia pengganti untuk baris yang sudah tidak digunakan.                 |
| `tags`             | `string[]`                                                     | Tag stabil yang digunakan oleh pemilih dan filter.                                        |

Bidang penyembunyian:

| Bidang                     | Tipe       | Artinya                                                                                                            |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Id penyedia untuk baris sumber hulu yang akan disembunyikan. Harus dimiliki Plugin ini atau dideklarasikan sebagai alias milik Plugin. |
| `model`                    | `string`   | Id model lokal penyedia yang akan disembunyikan.                                                                   |
| `reason`                   | `string`   | Pesan opsional yang ditampilkan ketika baris tersembunyi diminta secara langsung.                                  |
| `when.baseUrlHosts`        | `string[]` | Daftar opsional host URL dasar penyedia efektif yang harus terpenuhi sebelum penyembunyian diterapkan.             |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi penyedia yang sama persis dan harus terpenuhi sebelum penyembunyian diterapkan. |

Jangan masukkan data khusus runtime ke dalam `modelCatalog`. Gunakan `static` hanya jika baris manifes cukup lengkap agar daftar yang difilter berdasarkan penyedia dan permukaan pemilih dapat melewati penemuan registri/runtime. Gunakan `refreshable` jika baris manifes berguna sebagai benih yang dapat dicantumkan atau sebagai pelengkap, tetapi penyegaran/cache dapat menambahkan lebih banyak baris nanti; baris yang dapat disegarkan tidak bersifat otoritatif dengan sendirinya. Gunakan `runtime` jika OpenClaw harus memuat runtime penyedia untuk mengetahui daftar tersebut.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan id model milik penyedia yang ringan dan harus terjadi sebelum runtime penyedia dimuat. Hal ini mempertahankan alias seperti nama model singkat, id lama lokal penyedia, dan aturan prefiks proksi dalam manifes Plugin pemilik, bukan dalam tabel pemilihan model inti.

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

| Bidang                               | Tipe                    | Artinya                                                                                             |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias id model persis yang tidak peka huruf besar-kecil. Nilai dikembalikan sebagaimana ditulis.    |
| `stripPrefixes`                      | `string[]`              | Prefiks yang dihapus sebelum pencarian alias, berguna untuk duplikasi penyedia/model lama.          |
| `prefixWhenBare`                     | `string`                | Prefiks yang ditambahkan ketika id model yang dinormalisasi belum memuat `/`.                       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan prefiks id polos bersyarat setelah pencarian alias, dengan kunci `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi titik akhir yang harus diketahui oleh kebijakan permintaan generik sebelum runtime penyedia dimuat. Inti tetap menentukan arti setiap `endpointClass`; manifes Plugin menentukan metadata host dan URL dasar.

Plugin penyedia yang secara resmi dieksternalisasi dikecualikan dari distribusi inti, sehingga
manifesnya tidak terlihat hingga diinstal. `providerEndpoints` miliknya juga harus
dicerminkan dalam `scripts/lib/official-external-provider-catalog.json` agar
klasifikasi titik akhir tetap berfungsi tanpa Plugin tersebut; pengujian kontrak
memastikan pencerminan ini.

Bidang titik akhir:

| Bidang                         | Tipe       | Artinya                                                                                        |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint inti yang dikenal, seperti `openrouter`, `moonshot-native`, atau `google-vertex`. |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                             |
| `hostSuffixes`                 | `string[]` | Sufiks host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus sufiks domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi yang persis dan dipetakan ke kelas endpoint.                   |
| `googleVertexRegion`           | `string`   | Wilayah Google Vertex statis untuk host global yang persis.                                    |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks yang dihapus dari host yang cocok untuk mengekspos prefiks wilayah Google Vertex.        |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan yang ringan dan diperlukan oleh kebijakan permintaan generik tanpa memuat runtime penyedia. Pertahankan penulisan ulang muatan yang spesifik terhadap perilaku di hook runtime penyedia atau pembantu bersama keluarga penyedia.

```json
{
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

| Bidang                | Tipe         | Artinya                                                                                |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label keluarga penyedia yang digunakan oleh keputusan kompatibilitas permintaan generik dan diagnostik. |
| `compatibilityFamily` | `"moonshot"` | Kelompok kompatibilitas keluarga penyedia opsional untuk pembantu permintaan bersama.  |
| `openAICompletions`   | `object`     | Flag permintaan penyelesaian yang kompatibel dengan OpenAI, saat ini `supportsStreamingUsage`. |

## Referensi secretProviderIntegrations

Gunakan `secretProviderIntegrations` ketika sebuah plugin dapat menerbitkan preset penyedia eksekusi SecretRef yang dapat digunakan kembali. OpenClaw membaca metadata ini sebelum runtime plugin dimuat, menyimpan kepemilikan plugin di `secrets.providers.<alias>.pluginIntegration`, dan menyerahkan resolusi rahasia aktual kepada runtime SecretRef. Preset hanya diekspos untuk plugin bawaan dan plugin terinstal yang ditemukan dari akar instalasi plugin terkelola, seperti instalasi git dan ClawHub.

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

Kunci peta adalah id integrasi. Jika `providerAlias` dihilangkan, OpenClaw menggunakan id integrasi sebagai alias penyedia SecretRef. Alias penyedia harus cocok dengan pola alias penyedia SecretRef yang normal, misalnya `team-secrets` atau `onepassword-work`.

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

Saat mulai/muat ulang, OpenClaw menyelesaikan penyedia tersebut dengan memuat metadata manifes plugin saat ini, memeriksa bahwa plugin pemilik terinstal dan aktif, serta mewujudkan perintah eksekusi dari manifes. Menonaktifkan atau menghapus plugin mencabut penyedia untuk SecretRef yang aktif. Operator yang menginginkan konfigurasi eksekusi mandiri tetap dapat menulis penyedia `command`/`args` manual secara langsung.

Saat ini hanya preset `source: "exec"` yang didukung. `command` harus berupa `${node}`, dan `args[0]` harus berupa skrip penyelesai relatif terhadap akar plugin yang diawali `./`. OpenClaw mewujudkannya saat mulai/muat ulang menjadi executable Node saat ini dan jalur absolut skrip di dalam plugin. Opsi Node seperti `--require`, `--import`, `--loader`, `--env-file`, `--eval`, dan `--print` bukan bagian dari kontrak preset manifes. Operator yang memerlukan perintah non-Node dapat mengonfigurasi penyedia eksekusi manual mandiri secara langsung.

OpenClaw menurunkan `trustedDirs` untuk preset manifes dari akar plugin dan, untuk preset `${node}`, direktori executable Node saat ini. `trustedDirs` yang ditulis dalam manifes diabaikan. Opsi penyedia eksekusi lainnya seperti `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv`, dan `allowInsecurePath` diteruskan ke konfigurasi penyedia eksekusi SecretRef normal.

## Referensi modelPricing

Gunakan `modelPricing` ketika penyedia memerlukan perilaku penetapan harga bidang kontrol sebelum runtime dimuat. Cache penetapan harga Gateway membaca metadata ini tanpa mengimpor kode runtime penyedia.

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

| Bidang       | Tipe              | Artinya                                                                                            |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Tetapkan `false` untuk penyedia lokal/yang dihosting sendiri yang tidak boleh mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan pencarian harga OpenRouter. `false` menonaktifkan pencarian OpenRouter untuk penyedia ini. |
| `liteLLM`    | `false \| object` | Pemetaan pencarian harga LiteLLM. `false` menonaktifkan pencarian LiteLLM untuk penyedia ini.       |

Bidang sumber:

| Bidang                     | Tipe               | Artinya                                                                                                              |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id penyedia katalog eksternal ketika berbeda dari id penyedia OpenClaw, misalnya `z-ai` untuk penyedia `zai`.        |
| `passthroughProviderModel` | `boolean`          | Perlakukan id model yang mengandung garis miring sebagai referensi penyedia/model bertingkat, berguna untuk penyedia proksi seperti OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varian id model katalog eksternal tambahan. `version-dots` mencoba id versi bertitik seperti `claude-opus-4.6`.       |

### Indeks Penyedia OpenClaw

Indeks Penyedia OpenClaw adalah metadata pratinjau milik OpenClaw untuk penyedia yang pluginnya mungkin belum terinstal. Ini bukan bagian dari manifes plugin. Manifes plugin tetap menjadi otoritas untuk plugin terinstal. Indeks Penyedia adalah kontrak fallback internal yang akan digunakan oleh antarmuka penyedia yang dapat diinstal dan pemilih model pra-instalasi di masa mendatang ketika plugin penyedia belum terinstal.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. `modelCatalog` manifes plugin terinstal.
3. Cache katalog model dari penyegaran eksplisit.
4. Baris pratinjau Indeks Penyedia OpenClaw.

Indeks Penyedia tidak boleh memuat rahasia, status aktif, hook runtime, atau data model langsung yang spesifik untuk akun. Katalog pratinjaunya menggunakan bentuk baris penyedia `modelCatalog` yang sama seperti manifes plugin, tetapi harus dibatasi pada metadata tampilan yang stabil kecuali bidang adaptor runtime seperti `api`, `baseUrl`, harga, atau flag kompatibilitas sengaja dijaga tetap selaras dengan manifes plugin terinstal. Penyedia dengan penemuan `/models` langsung harus menulis baris yang disegarkan melalui jalur cache katalog model eksplisit alih-alih membuat pencantuman normal atau orientasi awal memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata plugin yang dapat diinstal untuk penyedia yang pluginnya telah dipindahkan keluar dari inti atau belum terinstal karena alasan lain. Metadata ini mencerminkan pola katalog saluran: nama paket, spesifikasi instalasi npm, integritas yang diharapkan, dan label pilihan autentikasi ringan sudah cukup untuk menampilkan opsi penyiapan yang dapat diinstal. Setelah plugin terinstal, manifesnya menjadi acuan dan entri Indeks Penyedia diabaikan untuk penyedia tersebut.

`openclaw doctor --fix` memigrasikan sekumpulan kecil dan tertutup kunci kemampuan manifes tingkat atas lama ke dalam `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, dan `tools`. Tidak satu pun dari kunci ini (atau daftar kemampuan lainnya) yang dibaca sebagai bidang manifes tingkat atas lagi; pemuatan manifes normal hanya mengenalinya di bawah `contracts`.

## Manifes dibandingkan dengan package.json

Kedua berkas tersebut memiliki fungsi berbeda:

| Berkas                 | Gunakan untuk                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Penemuan, validasi konfigurasi, metadata pilihan autentikasi, dan petunjuk UI yang harus tersedia sebelum kode plugin berjalan   |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk titik masuk, pembatasan instalasi, penyiapan, atau metadata katalog |

Jika Anda tidak yakin di mana suatu metadata seharusnya ditempatkan, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika berkaitan dengan pengemasan, berkas entri, atau perilaku instalasi npm, letakkan di `package.json`

### Bidang package.json yang memengaruhi penemuan

Sebagian metadata plugin pra-runtime sengaja berada di `package.json` di bawah blok `openclaw`, bukan di `openclaw.plugin.json`. `openclaw.bundle` dan `openclaw.bundle.json` bukan kontrak plugin OpenClaw; plugin native harus menggunakan `openclaw.plugin.json` beserta bidang `package.json#openclaw` yang didukung di bawah ini.

Contoh penting:

| Bidang                                                                                     | Artinya                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Mendeklarasikan titik masuk plugin native. Harus tetap berada di dalam direktori paket plugin.                                                                                                                             |
| `openclaw.runtimeExtensions`                                                               | Mendeklarasikan titik masuk runtime JavaScript hasil build untuk paket yang terinstal. Harus tetap berada di dalam direktori paket plugin.                                                                                  |
| `openclaw.setupEntry`                                                                      | Titik masuk ringan khusus penyiapan yang digunakan selama orientasi awal, penundaan startup kanal, serta penemuan status kanal/SecretRef hanya-baca. Harus tetap berada di dalam direktori paket plugin.                     |
| `openclaw.runtimeSetupEntry`                                                               | Mendeklarasikan titik masuk penyiapan JavaScript hasil build untuk paket yang terinstal. Memerlukan `setupEntry`, harus ada, dan harus tetap berada di dalam direktori paket plugin.                                         |
| `openclaw.channel`                                                                         | Metadata katalog kanal ringan seperti label, jalur dokumentasi, alias, dan teks pilihan.                                                                                                                                   |
| `openclaw.channel.commands`                                                                | Metadata statis perintah native dan default otomatis skill native yang digunakan oleh permukaan konfigurasi, audit, dan daftar perintah sebelum runtime kanal dimuat.                                                       |
| `openclaw.channel.configuredState`                                                         | Metadata pemeriksa status terkonfigurasi ringan yang dapat menjawab "apakah penyiapan hanya melalui env sudah ada?" tanpa memuat runtime kanal secara lengkap.                                                               |
| `openclaw.channel.persistedAuthState`                                                      | Metadata pemeriksa autentikasi tersimpan ringan yang dapat menjawab "apakah sudah ada sesuatu yang masuk?" tanpa memuat runtime kanal secara lengkap.                                                                        |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Petunjuk instalasi/pembaruan untuk plugin bawaan dan plugin yang dipublikasikan secara eksternal.                                                                                                                           |
| `openclaw.install.defaultChoice`                                                           | Jalur instalasi pilihan ketika tersedia beberapa sumber instalasi.                                                                                                                                                         |
| `openclaw.install.minHostVersion`                                                          | Versi minimum host OpenClaw yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22` atau `>=2026.5.1-beta.1`.                                                                                                   |
| `openclaw.compat.pluginApi`                                                                | Rentang minimum API plugin OpenClaw yang diperlukan oleh paket ini, menggunakan batas bawah semver seperti `>=2026.5.27`.                                                                                                  |
| `openclaw.install.expectedIntegrity`                                                       | String integritas distribusi npm yang diharapkan seperti `sha512-...`; alur instalasi dan pembaruan memverifikasi artefak yang diambil terhadap nilai tersebut.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Mengizinkan jalur pemulihan instalasi ulang plugin bawaan yang terbatas ketika konfigurasi tidak valid.                                                                                                                    |
| `openclaw.install.requiredPlatformPackages`                                                | Alias paket npm yang harus tersedia ketika batasan platform dalam lockfile cocok dengan host saat ini.                                                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Memungkinkan permukaan kanal runtime penyiapan dimuat sebelum mulai mendengarkan, lalu menunda plugin kanal terkonfigurasi secara lengkap hingga aktivasi setelah mulai mendengarkan.                                        |

Metadata manifes menentukan pilihan penyedia/kanal/penyiapan yang muncul dalam orientasi awal sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu orientasi awal cara mengambil atau mengaktifkan plugin tersebut ketika pengguna memilih salah satu pilihan itu. Jangan pindahkan petunjuk instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan registri manifes untuk sumber plugin nonbawaan. Nilai yang tidak valid ditolak; nilai yang lebih baru tetapi valid menyebabkan plugin eksternal dilewati pada host yang lebih lama. Plugin sumber bawaan diasumsikan memiliki versi yang sama dengan checkout host.

`openclaw.install.requiredPlatformPackages` ditujukan untuk paket npm yang menyediakan biner native wajib melalui alias opsional khusus platform. Cantumkan nama paket npm tanpa tambahan untuk setiap alias platform yang didukung. Selama instalasi npm, OpenClaw hanya memverifikasi alias yang dideklarasikan dan batasan lockfile-nya cocok dengan host saat ini. Jika npm melaporkan keberhasilan tetapi menghilangkan alias tersebut, OpenClaw mencoba kembali satu kali dengan cache baru dan membatalkan instalasi jika alias tersebut masih tidak ada.

`openclaw.compat.pluginApi` diberlakukan selama instalasi paket untuk sumber plugin nonbawaan. Gunakan ini untuk batas bawah API SDK/runtime plugin OpenClaw yang menjadi dasar build paket. Nilainya dapat lebih ketat daripada `minHostVersion` ketika suatu paket plugin memerlukan API yang lebih baru, tetapi tetap mempertahankan petunjuk instalasi yang lebih rendah untuk alur lain. Sinkronisasi rilis resmi OpenClaw secara default menaikkan batas bawah API plugin resmi yang sudah ada ke versi rilis OpenClaw, tetapi rilis khusus plugin dapat mempertahankan batas bawah yang lebih rendah ketika paket tersebut sengaja mendukung host yang lebih lama. Jangan gunakan versi paket saja sebagai kontrak kompatibilitas. `peerDependencies.openclaw` tetap merupakan metadata paket npm; OpenClaw menggunakan kontrak `openclaw.compat.pluginApi` untuk keputusan kompatibilitas instalasi.

Metadata resmi instalasi sesuai permintaan harus menggunakan `clawhubSpec` ketika plugin dipublikasikan di ClawHub; orientasi awal memperlakukannya sebagai sumber jarak jauh pilihan dan mencatat fakta artefak ClawHub setelah instalasi. `npmSpec` tetap menjadi fallback kompatibilitas bagi paket yang belum dipindahkan ke ClawHub.

Penyematan versi npm yang tepat sudah berada dalam `npmSpec`, misalnya `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi harus memasangkan spesifikasi yang tepat dengan `expectedIntegrity` agar alur pembaruan gagal secara tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang disematkan. Orientasi awal interaktif tetap menawarkan spesifikasi npm dari registri tepercaya, termasuk nama paket tanpa tambahan dan dist-tag, demi kompatibilitas. Diagnostik katalog dapat membedakan sumber versi tepat, mengambang, disematkan-integritas, tanpa-integritas, ketidakcocokan nama paket, dan pilihan default yang tidak valid. Diagnostik tersebut juga memperingatkan ketika `expectedIntegrity` ada tetapi tidak terdapat sumber npm valid yang dapat disematkannya. Ketika `expectedIntegrity` ada, alur instalasi/pembaruan memberlakukannya; ketika tidak disertakan, resolusi registri dicatat tanpa penyematan integritas.

Plugin kanal harus menyediakan `openclaw.setupEntry` ketika pemindaian status, daftar kanal, atau SecretRef perlu mengidentifikasi akun yang terkonfigurasi tanpa memuat runtime secara lengkap. Titik masuk penyiapan harus mengekspos metadata kanal beserta adaptor konfigurasi, status, dan rahasia yang aman untuk penyiapan; pertahankan klien jaringan, pendengar Gateway, dan runtime transportasi di titik masuk ekstensi utama.

Bidang titik masuk runtime tidak mengesampingkan pemeriksaan batas paket untuk bidang titik masuk sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat jalur `openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibatasi. Opsi ini tidak membuat konfigurasi rusak sembarang menjadi dapat diinstal. Saat ini, opsi tersebut hanya memungkinkan alur instalasi pulih dari kegagalan peningkatan plugin bawaan tertentu yang sudah usang, seperti jalur plugin bawaan yang tidak ada atau entri `channels.<id>` usang untuk plugin bawaan yang sama. Kesalahan konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator ke `openclaw doctor --fix`.

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

Gunakan ketika alur penyiapan, doctor, status, atau pemeriksaan keberadaan hanya-baca memerlukan pemeriksaan autentikasi ya/tidak yang ringan sebelum plugin kanal dimuat secara lengkap. Status autentikasi tersimpan bukanlah status kanal terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan plugin secara otomatis, memperbaiki dependensi runtime, atau menentukan apakah runtime kanal harus dimuat. Ekspor target harus berupa fungsi kecil yang hanya membaca status tersimpan; jangan arahkan melalui barrel runtime kanal lengkap.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan ringan konfigurasi hanya melalui env:

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

Gunakan ketika kanal dapat menentukan status terkonfigurasi dari env atau masukan kecil non-runtime lainnya. Jika pemeriksaan memerlukan resolusi konfigurasi lengkap atau runtime kanal sebenarnya, pertahankan logika tersebut dalam hook `config.hasConfiguredState` plugin.

## Prioritas penemuan (ID plugin duplikat)

OpenClaw menemukan plugin dari tiga akar, yang diperiksa dalam urutan berikut: plugin bawaan yang disertakan bersama OpenClaw, akar instalasi global (`~/.openclaw/extensions`), dan akar ruang kerja saat ini (`<workspace>/.openclaw/extensions`), ditambah setiap entri eksplisit `plugins.load.paths`.

Jika dua hasil penemuan memiliki `id` yang sama, hanya manifes dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan. Urutan prioritas, dari tertinggi hingga terendah:

1. **Dipilih konfigurasi** — jalur yang disematkan secara eksplisit dalam `plugins.entries.<id>`
2. **Instalasi global yang cocok dengan catatan instalasi terlacak** — plugin yang diinstal melalui `openclaw plugin install`/`openclaw plugin update` dan dikenali oleh pelacakan instalasi OpenClaw untuk ID yang sama, bahkan ketika ID tersebut juga dimiliki plugin bawaan
3. **Bawaan** — plugin yang disertakan bersama OpenClaw
4. **Ruang kerja** — plugin yang ditemukan relatif terhadap ruang kerja saat ini
5. Kandidat lain yang ditemukan

Implikasi:

- Salinan bercabang atau usang dari plugin bawaan yang berada tanpa pelacakan di ruang kerja atau akar global tidak akan membayangi build bawaan.
- Untuk menggantikan plugin bawaan, jalankan `openclaw plugin install` untuk ID tersebut agar instalasi global terlacak mengungguli salinan bawaan, atau sematkan jalur tertentu melalui `plugins.entries.<id>` agar jalur tersebut menang berdasarkan prioritas pilihan konfigurasi.
- Pembuangan duplikat dicatat dalam log agar Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.
- Penggantian duplikat pilihan konfigurasi disebut sebagai penggantian eksplisit dalam diagnostik, tetapi tetap menghasilkan peringatan agar fork usang dan pembayangan tidak disengaja tetap terlihat.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, meskipun tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat konfigurasi dibaca/ditulis, bukan saat runtime.
- Saat memperluas atau melakukan fork pada plugin bawaan dengan kunci konfigurasi baru, perbarui `configSchema` dalam `openclaw.plugin.json` milik plugin tersebut secara bersamaan. Skema plugin bawaan bersifat ketat, sehingga menambahkan `plugins.entries.<id>.config.myNewKey` dalam konfigurasi pengguna tanpa menambahkan `myNewKey` ke `configSchema.properties` akan ditolak sebelum runtime plugin dimuat.

Contoh perluasan skema:

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

- Kunci `channels.*` yang tidak dikenal merupakan **kesalahan**, kecuali ID channel dideklarasikan oleh manifes plugin. Jika ID yang sama juga muncul dalam `plugins.allow`, `plugins.entries`, atau `plugins.installs` (plugin yang dirujuk tetapi saat ini tidak dapat ditemukan), OpenClaw menurunkan tingkat masalah ini menjadi **peringatan**.
- `plugins.entries.<id>`, `plugins.allow`, dan `plugins.deny` yang merujuk ke ID plugin yang tidak dikenal merupakan **peringatan** ("entri konfigurasi usang diabaikan"), bukan kesalahan, sehingga peningkatan versi dan plugin yang dihapus/diubah namanya tidak menghalangi Gateway untuk dimulai.
- `plugins.slots.memory` yang merujuk ke ID plugin yang tidak dikenal merupakan **kesalahan**, kecuali untuk plugin eksternal resmi `memory-lancedb` yang telah dikenal, yang hanya menghasilkan peringatan.
- Jika plugin telah terpasang tetapi manifes atau skemanya rusak atau tidak ada, validasi gagal dan Doctor melaporkan kesalahan plugin tersebut.
- Jika konfigurasi plugin tersedia tetapi plugin **dinonaktifkan**, konfigurasi tersebut dipertahankan dan **peringatan** ditampilkan di Doctor serta log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*` selengkapnya.

## Catatan

- Manifes **diwajibkan untuk plugin asli OpenClaw**, termasuk pemuatan dari sistem berkas lokal. Runtime tetap memuat modul plugin secara terpisah; manifes hanya digunakan untuk penemuan dan validasi.
- Manifes asli diuraikan dengan JSON5, sehingga komentar, koma di akhir, dan kunci tanpa tanda kutip dapat diterima selama nilai akhirnya tetap berupa objek.
- Hanya kolom manifes yang terdokumentasi yang dibaca oleh pemuat manifes. Hindari kunci tingkat atas khusus.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan jika plugin tidak memerlukannya.
- `providerCatalogEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog penyedia statis atau deskriptor penemuan terbatas, bukan untuk eksekusi pada saat permintaan.
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory` (default `memory-core`), dan `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Deklarasikan jenis plugin eksklusif dalam manifes ini. `OpenClawPluginDefinition.kind` pada entri runtime sudah tidak dianjurkan dan tetap tersedia hanya sebagai mekanisme kompatibilitas cadangan untuk plugin lama.
- Metadata variabel lingkungan (`setup.providers[].envVars`, `providerAuthEnvVars` yang sudah tidak dianjurkan, dan `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman Cron, dan permukaan baca-saja lainnya tetap menerapkan kebijakan kepercayaan plugin dan aktivasi efektif sebelum menganggap suatu variabel lingkungan telah dikonfigurasi.
- Untuk metadata wisaya runtime yang memerlukan kode penyedia, lihat [Hook runtime penyedia](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah-langkah build dan semua persyaratan daftar izin pengelola paket (misalnya, `allow-build-scripts` pnpm + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Membangun plugin" href="/id/plugins/building-plugins" icon="rocket">
    Memulai penggunaan plugin.
  </Card>
  <Card title="Arsitektur plugin" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model kapabilitas.
  </Card>
  <Card title="Ikhtisar SDK" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK plugin dan impor subjalur.
  </Card>
</CardGroup>
