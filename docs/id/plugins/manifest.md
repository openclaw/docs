---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu merilis skema konfigurasi plugin atau men-debug kesalahan validasi plugin
summary: Persyaratan manifes Plugin + skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-07-20T03:52:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7eb8ad70b4f2d5bb94f45f06bb1a9c5ece6be299c0057511cb80c5a70875563f
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini membahas **manifes plugin OpenClaw native**, `openclaw.plugin.json`. Untuk tata letak bundel yang kompatibel (Codex, Claude, Cursor), lihat [Bundel plugin](/id/plugins/bundles).

Format bundel yang kompatibel menggunakan file manifesnya sendiri sebagai gantinya:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json`, atau tata letak komponen Claude default tanpa manifes
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw mendeteksi tata letak tersebut secara otomatis, tetapi tidak memvalidasinya terhadap skema `openclaw.plugin.json` di bawah ini. Untuk bundel yang kompatibel, OpenClaw membaca metadata bundel, root skill yang dideklarasikan, root perintah Claude, default `settings.json` Claude, default LSP Claude, dan paket hook yang didukung, jika tata letaknya sesuai dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan `openclaw.plugin.json` di **root plugin**. OpenClaw membacanya untuk memvalidasi konfigurasi **tanpa mengeksekusi kode plugin**. Manifes yang tidak ada atau tidak valid memblokir validasi konfigurasi dan diperlakukan sebagai kesalahan plugin.

Lihat [Plugin](/id/tools/plugin) untuk panduan lengkap sistem plugin, dan [Model kapabilitas](/id/plugins/architecture#public-capability-model) untuk model kapabilitas native dan panduan kompatibilitas eksternal terkini.

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat kode plugin Anda**. Semua yang ada di dalamnya harus cukup ringan untuk diperiksa tanpa memulai runtime plugin.

**Gunakan untuk:**

- identitas plugin, validasi konfigurasi, dan petunjuk UI konfigurasi
- metadata autentikasi, orientasi awal, dan penyiapan (alias, pengaktifan otomatis, variabel lingkungan penyedia, pilihan autentikasi)
- petunjuk aktivasi untuk permukaan bidang kontrol
- kepemilikan keluarga model dalam bentuk singkat
- snapshot kepemilikan kapabilitas statis (`contracts`)
- metadata runner QA yang dapat diperiksa oleh host `openclaw qa` bersama
- metadata konfigurasi khusus saluran yang digabungkan ke dalam permukaan katalog dan validasi

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
  "description": "Plugin penyedia OpenRouter",
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

## Referensi bidang tingkat atas

| Bidang                                | Wajib | Tipe                         | Artinya                                                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya      | `string`                     | ID Plugin kanonis. Ini adalah ID yang digunakan dalam `plugins.entries.<id>`.                                                                                                                                                                                                        |
| `configSchema`                       | Ya      | `object`                     | JSON Schema sebaris untuk konfigurasi Plugin ini.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | Tidak       | `string[]`                   | ID Plugin yang juga harus diinstal agar Plugin ini berfungsi. Penemuan mempertahankan Plugin agar dapat dimuat, tetapi memperingatkan jika ada Plugin wajib yang tidak tersedia.                                                                                                               |
| `enabledByDefault`                   | Tidak       | `true`                       | Menandai Plugin bawaan sebagai diaktifkan secara default. Hilangkan bidang ini, atau tetapkan nilai selain `true`, agar Plugin tetap dinonaktifkan secara default.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | Tidak       | `string[]`                   | Menandai Plugin bawaan sebagai diaktifkan secara default hanya pada platform Node.js yang tercantum, misalnya `["darwin"]`. Konfigurasi eksplisit tetap diutamakan.                                                                                                                                   |
| `legacyPluginIds`                    | Tidak       | `string[]`                   | ID lama yang dinormalisasi menjadi ID Plugin kanonis ini.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | Tidak       | `string[]`                   | ID penyedia yang akan mengaktifkan Plugin ini secara otomatis ketika autentikasi, konfigurasi, atau referensi model menyebutkannya.                                                                                                                                                                            |
| `kind`                               | Tidak       | `PluginKind \| PluginKind[]` | Mendeklarasikan satu atau beberapa jenis Plugin eksklusif (`"memory"`, `"context-engine"`) yang digunakan oleh `plugins.slots.*`. Plugin yang memiliki kedua slot mendeklarasikan kedua jenis tersebut dalam satu larik.                                                                                                    |
| `channels`                           | Tidak       | `string[]`                   | ID kanal yang dimiliki oleh Plugin ini. Digunakan untuk penemuan dan validasi konfigurasi.                                                                                                                                                                                                |
| `providers`                          | Tidak       | `string[]`                   | ID penyedia yang dimiliki oleh Plugin ini.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | Tidak       | `string`                     | Jalur modul katalog penyedia ringan, relatif terhadap akar Plugin, untuk metadata katalog penyedia dengan cakupan manifes yang dapat dimuat tanpa mengaktifkan runtime Plugin sepenuhnya.                                                                                        |
| `modelSupport`                       | Tidak       | `object`                     | Metadata singkat keluarga model milik manifes yang digunakan untuk memuat Plugin secara otomatis sebelum runtime.                                                                                                                                                                                |
| `modelCatalog`                       | Tidak       | `object`                     | Metadata katalog model deklaratif untuk penyedia yang dimiliki Plugin ini. Ini adalah kontrak bidang kontrol untuk pencantuman hanya-baca, onboarding, pemilih model, alias, dan penyembunyian di masa mendatang tanpa memuat runtime Plugin.                                                |
| `modelPricing`                       | Tidak       | `object`                     | Kebijakan pencarian harga eksternal milik penyedia. Gunakan untuk mengecualikan penyedia lokal/yang dihosting sendiri dari katalog harga jarak jauh atau memetakan referensi penyedia ke ID katalog OpenRouter/LiteLLM tanpa menanamkan ID penyedia secara langsung di inti.                                                    |
| `modelIdNormalization`               | Tidak       | `object`                     | Pembersihan alias/prefiks ID model milik penyedia yang harus dijalankan sebelum runtime penyedia dimuat.                                                                                                                                                                                  |
| `providerEndpoints`                  | Tidak       | `object[]`                   | Metadata host endpoint/baseUrl milik manifes untuk rute penyedia yang harus diklasifikasikan oleh inti sebelum runtime penyedia dimuat.                                                                                                                                                   |
| `providerRequest`                    | Tidak       | `object`                     | Metadata ringan keluarga penyedia dan kompatibilitas permintaan yang digunakan oleh kebijakan permintaan generik sebelum runtime penyedia dimuat.                                                                                                                                                     |
| `secretProviderIntegrations`         | Tidak       | `Record<string, object>`     | Preset penyedia eksekusi SecretRef deklaratif yang dapat ditawarkan oleh antarmuka penyiapan atau instalasi tanpa menanamkan integrasi khusus penyedia secara langsung di inti.                                                                                                                            |
| `cliBackends`                        | Tidak       | `string[]`                   | ID backend inferensi CLI yang dimiliki Plugin ini. Digunakan untuk aktivasi otomatis saat dimulai dari referensi konfigurasi eksplisit.                                                                                                                                                                |
| `syntheticAuthRefs`                  | Tidak       | `string[]`                   | Referensi penyedia atau backend CLI yang kait autentikasi sintetis milik Plugin-nya harus diperiksa selama penemuan model dingin sebelum runtime dimuat.                                                                                                                                     |
| `nonSecretAuthMarkers`               | Tidak       | `string[]`                   | Nilai kunci API placeholder milik Plugin bawaan yang merepresentasikan status kredensial lokal nonrahasia, OAuth, atau ambien.                                                                                                                                                       |
| `commandAliases`                     | Tidak       | `object[]`                   | Nama perintah yang dimiliki Plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI yang memahami Plugin sebelum runtime dimuat.                                                                                                                                                       |
| `providerUsageAuthEnvVars`           | Tidak       | `Record<string, string[]>`   | Kredensial penyedia khusus penggunaan/penagihan. OpenClaw menggunakan nama-nama ini untuk penemuan penggunaan dan penghapusan rahasia, tetapi tidak pernah untuk autentikasi inferensi.                                                                                                                                  |
| `providerAuthAliases`                | Tidak       | `Record<string, string>`     | ID penyedia yang harus menggunakan kembali ID penyedia lain untuk pencarian autentikasi, misalnya penyedia pengodean yang berbagi kunci API dan profil autentikasi penyedia dasar.                                                                                                                 |
| `providerAuthChoices`                | Tidak       | `object[]`                   | Metadata ringan pilihan autentikasi untuk pemilih onboarding, resolusi penyedia pilihan, dan pengaitan sederhana flag CLI.                                                                                                                                                              |
| `activation`                         | Tidak       | `object`                     | Metadata ringan perencana aktivasi untuk pemuatan yang dipicu oleh startup, penyedia, perintah, kanal, rute, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku aktual.                                                                                              |
| `setup`                              | Tidak       | `object`                     | Deskriptor ringan penyiapan/onboarding yang dapat diperiksa oleh antarmuka penemuan dan penyiapan tanpa memuat runtime Plugin.                                                                                                                                                           |
| `qaRunners`                          | Tidak       | `object[]`                   | Deskriptor ringan pelaksana QA yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                                                                             |
| `contracts`                          | Tidak       | `object`                     | Snapshot statis kepemilikan kapabilitas untuk kait autentikasi eksternal, embedding, ucapan, transkripsi waktu nyata, suara waktu nyata, pemahaman media, pembuatan gambar/video/musik, pengambilan web, pencarian web, penyedia pekerja, ekstraksi dokumen/konten web, dan kepemilikan alat. |
| `configContracts`                    | Tidak       | `object`                     | Perilaku konfigurasi milik manifes yang digunakan oleh pembantu inti generik: deteksi flag berbahaya, target migrasi SecretRef, dan penyempitan jalur konfigurasi lama. Lihat [referensi configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Tidak       | `Record<string, object>`     | Default ringan pemahaman media untuk ID penyedia yang dideklarasikan dalam `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Tidak    | `Record<string, object>`     | Metadata autentikasi pembuatan gambar yang ringan untuk ID penyedia yang dideklarasikan dalam `contracts.imageGenerationProviders`, termasuk alias autentikasi milik penyedia dan pengaman URL dasar.                                                                                                         |
| `videoGenerationProviderMetadata`    | Tidak    | `Record<string, object>`     | Metadata autentikasi pembuatan video yang ringan untuk ID penyedia yang dideklarasikan dalam `contracts.videoGenerationProviders`, termasuk alias autentikasi milik penyedia dan pengaman URL dasar.                                                                                                         |
| `musicGenerationProviderMetadata`    | Tidak    | `Record<string, object>`     | Metadata autentikasi pembuatan musik yang ringan untuk ID penyedia yang dideklarasikan dalam `contracts.musicGenerationProviders`, termasuk alias autentikasi milik penyedia dan pengaman URL dasar.                                                                                                         |
| `toolMetadata`                       | Tidak    | `Record<string, object>`     | Metadata ketersediaan yang ringan untuk alat milik plugin yang dideklarasikan dalam `contracts.tools`. Gunakan saat alat tidak boleh memuat runtime kecuali terdapat bukti konfigurasi, lingkungan, atau autentikasi.                                                                                                  |
| `channelConfigs`                     | Tidak    | `Record<string, object>`     | Metadata konfigurasi saluran milik manifes yang digabungkan ke permukaan penemuan dan validasi sebelum runtime dimuat.                                                                                                                                                                 |
| `skills`                             | Tidak    | `string[]`                   | Direktori Skills yang akan dimuat, relatif terhadap root plugin.                                                                                                                                                                                                                    |
| `name`                               | Tidak    | `string`                     | Nama plugin yang mudah dibaca manusia.                                                                                                                                                                                                                                                |
| `description`                        | Tidak    | `string`                     | Ringkasan singkat yang ditampilkan pada permukaan plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | Tidak    | `object`                     | Petunjuk presentasi opsional untuk permukaan katalog plugin. Metadata ini tidak menginstal, mengaktifkan, atau memberikan kepercayaan kepada plugin.                                                                                                                                               |
| `icon`                               | Tidak    | `string`                     | URL gambar HTTPS untuk kartu marketplace/katalog. ClawHub menerima URL `https://` apa pun yang valid dan menggunakan ikon plugin default jika nilai ini dihilangkan atau tidak valid.                                                                                                         |
| `version`                            | Tidak    | `string`                     | Versi plugin informasional.                                                                                                                                                                                                                                              |
| `uiHints`                            | Tidak    | `Record<string, object>`     | Label UI, placeholder, dan petunjuk sensitivitas untuk bidang konfigurasi.                                                                                                                                                                                                          |

## referensi katalog

`catalog` menyediakan petunjuk tampilan opsional untuk peramban plugin. Host dapat mengabaikan petunjuk ini. Petunjuk ini tidak pernah menginstal atau mengaktifkan plugin, dan tidak mengubah perilaku runtime atau tingkat kepercayaannya.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Bidang     | Tipe      | Artinya                                                                    |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Apakah permukaan katalog harus menampilkan plugin ini secara unggulan.     |
| `order`    | `number`  | Petunjuk tampilan menaik di antara plugin terkurasi; nilai yang lebih rendah muncul lebih awal. |

## Referensi metadata penyedia pembuatan

Bidang metadata penyedia pembuatan menjelaskan sinyal autentikasi statis untuk penyedia yang dideklarasikan dalam daftar `contracts.*GenerationProviders` yang sesuai. OpenClaw membaca bidang ini sebelum runtime penyedia dimuat agar alat inti dapat menentukan apakah penyedia pembuatan tersedia tanpa mengimpor setiap plugin penyedia.

Gunakan bidang ini hanya untuk fakta deklaratif yang murah. Transportasi, transformasi permintaan, penyegaran token, validasi kredensial, dan perilaku pembuatan aktual tetap berada di runtime plugin.

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

| Bidang                 | Wajib    | Tipe       | Artinya                                                                                                                                             |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Tidak    | `string[]` | ID penyedia tambahan yang harus dianggap sebagai alias autentikasi statis untuk penyedia pembuatan.                                                 |
| `authProviders`        | Tidak    | `string[]` | ID penyedia yang profil autentikasinya yang telah dikonfigurasi harus dianggap sebagai autentikasi untuk penyedia pembuatan ini.                    |
| `configSignals`        | Tidak    | `object[]` | Sinyal ketersediaan murah berbasis konfigurasi saja untuk penyedia lokal atau yang dihosting sendiri, yang dapat dikonfigurasi tanpa profil autentikasi atau variabel lingkungan. |
| `authSignals`          | Tidak    | `object[]` | Sinyal autentikasi eksplisit. Jika ada, sinyal ini menggantikan kumpulan sinyal default dari ID penyedia, `aliases`, dan `authProviders`. |
| `referenceAudioInputs` | Tidak    | `boolean`  | Khusus pembuatan video. Atur ke `true` ketika penyedia menerima aset audio referensi; jika tidak, `video_generate` menyembunyikan parameter referensi audio. |

Setiap entri `configSignals` mendukung:

| Bidang           | Wajib    | Tipe       | Artinya                                                                                                                                                                                   |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ya       | `string`   | Jalur bertitik ke objek konfigurasi milik plugin yang akan diperiksa, misalnya `plugins.entries.example.config`.                                                                                        |
| `overlayPath`    | Tidak    | `string`   | Jalur bertitik di dalam konfigurasi akar yang objeknya harus melapisi objek akar sebelum mengevaluasi sinyal. Gunakan ini untuk konfigurasi khusus kemampuan seperti `image`, `video`, atau `music`. |
| `overlayMapPath` | Tidak    | `string`   | Jalur bertitik di dalam konfigurasi akar yang setiap nilai objeknya harus melapisi objek akar. Gunakan ini untuk peta akun bernama seperti `accounts`, yang membuat akun apa pun yang dikonfigurasi memenuhi syarat. |
| `required`       | Tidak    | `string[]` | Jalur bertitik di dalam konfigurasi efektif yang harus memiliki nilai terkonfigurasi. String harus tidak kosong; objek dan larik tidak boleh kosong.                                      |
| `requiredAny`    | Tidak    | `string[]` | Jalur bertitik di dalam konfigurasi efektif yang setidaknya salah satunya harus memiliki nilai terkonfigurasi.                                                                            |
| `mode`           | Tidak    | `object`   | Pengaman mode string opsional di dalam konfigurasi efektif. Gunakan ini ketika ketersediaan berbasis konfigurasi saja hanya berlaku untuk satu mode.                                     |

Setiap pengaman `mode` mendukung:

| Bidang       | Wajib    | Tipe       | Artinya                                                                            |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Tidak    | `string`   | Jalur bertitik di dalam konfigurasi efektif. Nilai default-nya adalah `mode`. |
| `default`    | Tidak    | `string`   | Nilai mode yang digunakan ketika konfigurasi tidak menyertakan jalur tersebut.     |
| `allowed`    | Tidak    | `string[]` | Jika ada, sinyal hanya lolos ketika mode efektif merupakan salah satu nilai ini.   |
| `disallowed` | Tidak    | `string[]` | Jika ada, sinyal gagal ketika mode efektif merupakan salah satu nilai ini.         |

Setiap entri `authSignals` mendukung:

| Bidang            | Wajib    | Tipe     | Artinya                                                                                                                                                                     |
| ----------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya       | `string` | ID penyedia yang akan diperiksa dalam profil autentikasi yang dikonfigurasi.                                                                                                |
| `providerBaseUrl` | Tidak    | `object` | Pengaman opsional yang membuat sinyal dihitung hanya ketika penyedia terkonfigurasi yang dirujuk menggunakan URL dasar yang diizinkan. Gunakan ini ketika alias autentikasi hanya valid untuk API tertentu. |

Setiap pengaman `providerBaseUrl` mendukung:

| Bidang            | Wajib    | Tipe       | Artinya                                                                                                                                              |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya       | `string`   | ID konfigurasi penyedia yang `baseUrl`-nya harus diperiksa.                                                                                 |
| `defaultBaseUrl`  | Tidak    | `string`   | URL dasar yang diasumsikan ketika konfigurasi penyedia tidak menyertakan `baseUrl`.                                                         |
| `allowedBaseUrls` | Ya       | `string[]` | URL dasar yang diizinkan untuk sinyal autentikasi ini. Sinyal diabaikan ketika URL dasar terkonfigurasi atau default tidak cocok dengan salah satu nilai yang dinormalisasi ini. |

## Referensi metadata alat

`toolMetadata` menggunakan bentuk `configSignals` dan `authSignals` yang sama seperti metadata penyedia pembuatan, dengan nama alat sebagai kunci. `contracts.tools` mendeklarasikan kepemilikan. `toolMetadata` mendeklarasikan bukti ketersediaan murah agar OpenClaw dapat menghindari pengimporan runtime plugin hanya untuk membuat pabrik alatnya mengembalikan `null`.

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

Entri `toolMetadata` juga menerima `optional` (menandai alat sebagai tidak wajib untuk aktivasi plugin) dan `replaySafe` (menandai eksekusi alat sebagai aman untuk diulang setelah giliran model yang tidak selesai), selain bidang bersama `configSignals`/`authSignals` di atas.

Jika alat tidak memiliki `toolMetadata`, OpenClaw mempertahankan perilaku yang ada dan memuat plugin pemilik ketika kontrak alat cocok dengan kebijakan. Untuk alat jalur panas yang pabriknya bergantung pada autentikasi/konfigurasi, penulis plugin harus mendeklarasikan `toolMetadata`, alih-alih membuat inti mengimpor runtime untuk menanyakannya.

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan orientasi awal atau autentikasi. OpenClaw membaca ini sebelum runtime penyedia dimuat. Daftar penyiapan penyedia menggunakan pilihan manifes ini, pilihan penyiapan yang berasal dari deskriptor, dan metadata katalog instalasi tanpa memuat runtime penyedia.

| Bidang                 | Wajib | Jenis                                                                  | Artinya                                                                                             |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya      | `string`                                                              | ID penyedia yang menaungi pilihan ini.                                                                       |
| `method`              | Ya      | `string`                                                              | ID metode autentikasi yang menjadi tujuan penerusan.                                                                            |
| `choiceId`            | Ya      | `string`                                                              | ID pilihan autentikasi stabil yang digunakan oleh alur orientasi awal dan CLI.                                                   |
| `choiceLabel`         | Tidak       | `string`                                                              | Label yang ditampilkan kepada pengguna. Jika tidak dicantumkan, OpenClaw menggunakan `choiceId`.                                         |
| `choiceHint`          | Tidak       | `string`                                                              | Teks bantuan singkat untuk pemilih.                                                                         |
| `icon`                | Tidak       | URL HTTPS                                                             | Ilustrasi yang ditampilkan di samping pilihan ini pada klien orientasi awal yang didukung.                                         |
| `website`             | Tidak       | URL HTTPS                                                             | Halaman produk, masuk, atau instalasi yang ditampilkan oleh klien orientasi awal yang didukung.                             |
| `assistantPriority`   | Tidak       | `number`                                                              | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif berbasis asisten.                                        |
| `assistantVisibility` | Tidak       | `"visible"` \| `"manual-only"`                                        | Sembunyikan pilihan dari pemilih asisten, tetapi tetap izinkan pemilihan CLI secara manual.                         |
| `deprecatedChoiceIds` | Tidak       | `string[]`                                                            | ID pilihan lama yang harus mengalihkan pengguna ke pilihan pengganti ini.                                  |
| `groupId`             | Tidak       | `string`                                                              | ID grup opsional untuk mengelompokkan pilihan terkait.                                                           |
| `groupLabel`          | Tidak       | `string`                                                              | Label yang ditampilkan kepada pengguna untuk grup tersebut.                                                                         |
| `groupHint`           | Tidak       | `string`                                                              | Teks bantuan singkat untuk grup.                                                                          |
| `onboardingFeatured`  | Tidak       | `boolean`                                                             | Tampilkan grup ini pada tingkat unggulan dalam pemilih orientasi awal interaktif, sebelum entri "Lainnya...". |
| `optionKey`           | Tidak       | `string`                                                              | Kunci opsi internal untuk alur autentikasi satu flag sederhana.                                                       |
| `cliFlag`             | Tidak       | `string`                                                              | Nama flag CLI, seperti `--openrouter-api-key`.                                                            |
| `cliOption`           | Tidak       | `string`                                                              | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                              |
| `cliDescription`      | Tidak       | `string`                                                              | Deskripsi yang digunakan dalam bantuan CLI.                                                                             |
| `appGuidedSecret`     | Tidak       | `boolean`                                                             | Satu secret yang ditempelkan beserta nilai default penyedia sudah cukup untuk penyiapan terpandu aplikasi.                              |
| `appGuidedDiscovery`  | Tidak       | `boolean`                                                             | Metode autentikasi runtime yang cocok menangani penemuan lokal hanya-baca melalui `appGuidedSetup`.                 |
| `appGuidedAuth`       | Tidak       | `"oauth"` \| `"device-code"`                                          | Login interaktif milik penyedia yang dapat dirender secara generik oleh klien penyiapan native.                        |
| `onboardingScopes`    | Tidak       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Permukaan orientasi awal tempat pilihan ini harus ditampilkan. Jika tidak dicantumkan, nilai default-nya adalah `["text-inference"]`.  |

Jika `appGuidedDiscovery` bernilai true, metode autentikasi penyedia yang cocok harus menyediakan
`appGuidedSetup.detect` dan `appGuidedSetup.prepare`. Deteksi harus
hanya-baca: tanpa login, penarikan model, unduhan, atau penulisan konfigurasi. Persiapan memeriksa ulang
model persis yang dipilih dan mengembalikan usulan konfigurasi; OpenClaw menguji langsung
usulan tersebut secara terisolasi dan menerapkannya hanya setelah berhasil.

## Referensi commandAliases

Gunakan `commandAliases` ketika sebuah plugin memiliki nama perintah runtime yang mungkin keliru dimasukkan pengguna ke dalam `plugins.allow` atau coba dijalankan sebagai perintah CLI root. OpenClaw menggunakan metadata ini untuk diagnostik tanpa mengimpor kode runtime plugin.

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

| Bidang        | Wajib | Jenis              | Artinya                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ya      | `string`          | Nama perintah yang dimiliki plugin ini.                               |
| `kind`       | Tidak       | `"runtime-slash"` | Menandai alias sebagai perintah garis miring chat, bukan perintah CLI root. |
| `cliCommand` | Tidak       | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.  |

## Referensi aktivasi

Gunakan `activation` ketika plugin dapat dengan mudah mendeklarasikan peristiwa bidang kontrol mana yang harus menyertakannya dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata perencana, bukan API siklus hidup. Blok ini tidak mendaftarkan perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa kode plugin telah dijalankan. Perencana aktivasi menggunakan bidang-bidang ini untuk mempersempit plugin kandidat sebelum kembali menggunakan metadata kepemilikan manifes yang ada, seperti `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook.

Utamakan metadata tersempit yang sudah menjelaskan kepemilikan. Gunakan `providers`, `channels`, `commandAliases`, deskriptor penyiapan, atau `contracts` ketika bidang-bidang tersebut menyatakan hubungannya. Gunakan `activation` untuk petunjuk perencana tambahan yang tidak dapat direpresentasikan oleh bidang kepemilikan tersebut. Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`, `my-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk ID harness agen tertanam yang belum memiliki bidang kepemilikan.

Setiap plugin harus menetapkan `activation.onStartup` secara sengaja. Tetapkan ke `true` hanya jika plugin harus berjalan selama startup Gateway. Tetapkan ke `false` jika plugin tidak aktif saat startup dan hanya boleh dimuat dari pemicu yang lebih sempit. Tidak mencantumkan `onStartup` tidak lagi memuat plugin secara implisit saat startup; gunakan metadata aktivasi eksplisit untuk pemicu aktivasi startup, saluran, konfigurasi, harness agen, memori, atau pemicu lain yang lebih sempit.

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

| Bidang              | Wajib | Jenis                                                 | Artinya                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Tidak       | `boolean`                                            | Aktivasi startup Gateway eksplisit. Setiap plugin harus menetapkan ini. `true` mengimpor plugin selama startup; `false` membuatnya tetap dimuat secara malas saat startup kecuali pemicu lain yang cocok mengharuskan pemuatan. |
| `onProviders`      | Tidak       | `string[]`                                           | ID penyedia yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                      |
| `onAgentHarnesses` | Tidak       | `string[]`                                           | ID runtime harness agen tertanam yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                                           |
| `onCommands`       | Tidak       | `string[]`                                           | ID perintah yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                       |
| `onChannels`       | Tidak       | `string[]`                                           | ID saluran yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                       |
| `onRoutes`         | Tidak       | `string[]`                                           | Jenis rute yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                       |
| `onConfigPaths`    | Tidak       | `string[]`                                           | Jalur konfigurasi relatif terhadap root yang harus menyertakan plugin ini dalam rencana startup/pemuatan ketika jalur tersebut ada dan tidak dinonaktifkan secara eksplisit.                                                      |
| `onCapabilities`   | Tidak       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan aktivasi bidang kontrol. Utamakan bidang yang lebih sempit jika memungkinkan.                                                                                     |

Konsumen aktif saat ini:

- Perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup eksplisit.
- Perencanaan CLI yang dipicu perintah kembali menggunakan `commandAliases[].cliCommand` atau `commandAliases[].name` lama.
- Perencanaan startup runtime agen menggunakan `activation.onAgentHarnesses` untuk harness tersemat dan `cliBackends[]` tingkat atas untuk alias runtime CLI.
- Perencanaan penyiapan/channel yang dipicu channel kembali menggunakan kepemilikan `channels[]` lama ketika metadata aktivasi channel eksplisit tidak tersedia.
- Perencanaan Plugin startup menggunakan `activation.onConfigPaths` untuk permukaan konfigurasi root non-channel, seperti blok `browser` milik Plugin browser bawaan.
- Perencanaan penyiapan/runtime yang dipicu penyedia kembali menggunakan kepemilikan `providers[]` lama dan `cliBackends[]` tingkat atas ketika metadata aktivasi penyedia eksplisit tidak tersedia.

Diagnostik perencana dapat membedakan petunjuk aktivasi eksplisit dari fallback kepemilikan manifes. Misalnya, `activation-command-hint` berarti `activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti perencana menggunakan kepemilikan `commandAliases`. Label alasan ini ditujukan untuk diagnostik host dan pengujian; pembuat Plugin harus tetap mendeklarasikan metadata yang paling tepat menggambarkan kepemilikan.

## Referensi qaRunners

Gunakan `qaRunners` ketika sebuah Plugin menyediakan satu atau beberapa runner transportasi di bawah
root `openclaw qa` bersama. Jaga agar metadata ini ringan dan statis; runtime Plugin
tetap memiliki registrasi CLI aktual melalui permukaan `runtime-api.ts`
ringan yang mengekspor `qaRunnerCliRegistrations` yang sesuai. `adapterFactory`
opsional mengekspos transportasi ke skenario QA bersama tanpa
mengubah runner perintah yang terdaftar.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Jalankan jalur QA langsung Matrix berbasis Docker terhadap homeserver sekali pakai"
    }
  ]
}
```

| Bidang         | Wajib | Tipe     | Artinya                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Ya      | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`.    |
| `description` | Tidak       | `string` | Teks bantuan fallback yang digunakan ketika host bersama memerlukan perintah stub. |

ID `adapterFactory` harus cocok dengan `commandName`. Jangan mengekspor registrasi
untuk perintah yang tidak ada dalam manifes.

## Referensi setup

Gunakan `setup` ketika permukaan penyiapan dan orientasi memerlukan metadata ringan milik Plugin sebelum runtime dimuat.

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
            "source": "kredensial lokal openai"
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

`cliBackends` tingkat atas tetap valid dan terus mendeskripsikan backend inferensi CLI. `setup.cliBackends` adalah permukaan deskriptor khusus penyiapan untuk alur bidang kontrol/penyiapan yang harus tetap hanya berupa metadata.

Jika tersedia, `setup.providers` dan `setup.cliBackends` adalah permukaan pencarian berbasis deskriptor yang diutamakan untuk penemuan penyiapan. Jika deskriptor hanya mempersempit kandidat Plugin dan penyiapan masih memerlukan hook runtime waktu penyiapan yang lebih lengkap, tetapkan `requiresRuntime: true` dan pertahankan `setup-api` sebagai jalur eksekusi fallback.

OpenClaw menyertakan `setup.providers[].envVars` dalam pencarian autentikasi penyedia dan variabel lingkungan generik. Tempatkan metadata lingkungan penyiapan dan status di sana.

Gunakan `providerUsageAuthEnvVars` ketika kredensial tingkat penagihan atau organisasi harus mengaktifkan `resolveUsageAuth` tanpa menjadi kredensial inferensi. Nama-nama ini disertakan dalam pemblokiran dotenv ruang kerja, penghapusan dari proses anak ACP, pemfilteran rahasia sandbox, dan pembersihan rahasia secara luas. Runtime penyedia tetap membaca dan mengklasifikasikan nilai di dalam `resolveUsageAuth`.

OpenClaw juga dapat memperoleh pilihan penyiapan sederhana dari `setup.providers[].authMethods` ketika entri penyiapan tidak tersedia, atau ketika `setup.requiresRuntime: false` menyatakan runtime penyiapan tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap diutamakan untuk label khusus, flag CLI, cakupan orientasi, dan metadata asisten.

Tetapkan `requiresRuntime: false` hanya ketika deskriptor tersebut memadai untuk permukaan penyiapan. OpenClaw memperlakukan `false` eksplisit sebagai kontrak khusus deskriptor dan tidak akan menjalankan `setup-api` atau `openclaw.setupEntry` untuk pencarian penyiapan. Jika Plugin khusus deskriptor masih menyertakan salah satu entri runtime penyiapan tersebut, OpenClaw melaporkan diagnostik tambahan dan tetap mengabaikannya. `requiresRuntime` yang dihilangkan mempertahankan perilaku fallback lama agar Plugin yang sudah ada dan menambahkan deskriptor tanpa flag tersebut tidak rusak.

Karena pencarian penyiapan dapat mengeksekusi kode `setup-api` milik Plugin, nilai `setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di antara Plugin yang ditemukan. Kepemilikan ambigu gagal secara tertutup alih-alih memilih pemenang berdasarkan urutan penemuan.

Ketika runtime penyiapan dijalankan, diagnostik registri penyiapan melaporkan penyimpangan deskriptor jika `setup-api` mendaftarkan penyedia atau backend CLI yang tidak dideklarasikan oleh deskriptor manifes, atau jika deskriptor tidak memiliki registrasi runtime yang sesuai. Diagnostik ini bersifat tambahan dan tidak menolak Plugin lama.

### Referensi setup.providers

| Bidang          | Wajib | Tipe       | Artinya                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ya      | `string`   | ID penyedia yang diekspos selama penyiapan atau orientasi. Jaga agar ID yang dinormalisasi unik secara global.             |
| `authMethods`  | Tidak       | `string[]` | ID metode penyiapan/autentikasi yang didukung penyedia ini tanpa memuat runtime penuh.                       |
| `envVars`      | Tidak       | `string[]` | Variabel lingkungan yang dapat diperiksa oleh permukaan penyiapan/status generik sebelum runtime Plugin dimuat.               |
| `authEvidence` | Tidak       | `object[]` | Pemeriksaan bukti autentikasi lokal yang ringan untuk penyedia yang dapat mengautentikasi melalui penanda nonrahasia. |

`authEvidence` ditujukan untuk penanda kredensial lokal milik penyedia yang dapat diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap ringan dan lokal: tanpa panggilan jaringan, tanpa pembacaan keychain atau pengelola rahasia, tanpa perintah shell, dan tanpa pemeriksaan API penyedia.

Entri bukti yang didukung:

| Bidang              | Wajib | Tipe       | Artinya                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Ya      | `string`   | Saat ini `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Tidak       | `string`   | Variabel lingkungan yang memuat jalur file kredensial eksplisit.                                                           |
| `fallbackPaths`    | Tidak       | `string[]` | Jalur file kredensial lokal yang diperiksa ketika `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak       | `string[]` | Setidaknya satu variabel lingkungan yang tercantum harus tidak kosong agar bukti valid.                                    |
| `requiresAllEnv`   | Tidak       | `string[]` | Setiap variabel lingkungan yang tercantum harus tidak kosong agar bukti valid.                                           |
| `credentialMarker` | Ya      | `string`   | Penanda nonrahasia yang dikembalikan ketika bukti tersedia.                                                       |
| `source`           | Tidak       | `string`   | Label sumber yang terlihat oleh pengguna untuk keluaran autentikasi/status.                                                               |

### Bidang setup

| Bidang              | Wajib | Tipe       | Artinya                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Tidak       | `object[]` | Deskriptor penyiapan penyedia yang diekspos selama penyiapan dan orientasi.                                     |
| `cliBackends`      | Tidak       | `string[]` | ID backend waktu penyiapan yang digunakan untuk pencarian penyiapan berbasis deskriptor. Jaga agar ID yang dinormalisasi unik secara global. |
| `configMigrations` | Tidak       | `string[]` | ID migrasi konfigurasi yang dimiliki oleh permukaan penyiapan Plugin ini.                                          |
| `requiresRuntime`  | Tidak       | `boolean`  | Apakah penyiapan masih memerlukan eksekusi `setup-api` setelah pencarian deskriptor.                            |

## Referensi uiHints

`uiHints` adalah pemetaan dari nama bidang konfigurasi ke petunjuk perenderan kecil. Kunci dapat menggunakan titik untuk bidang konfigurasi bertingkat, tetapi tidak ada segmen jalur yang boleh berupa `__proto__`, `constructor`, atau `prototype`; penyiapan menolak nama-nama tersebut.

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

Setiap petunjuk bidang dapat mencakup:

| Bidang         | Tipe       | Artinya                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Label bidang yang terlihat oleh pengguna.                |
| `help`        | `string`   | Teks bantuan singkat.                      |
| `tags`        | `string[]` | Tag UI opsional.                       |
| `advanced`    | `boolean`  | Menandai bidang sebagai lanjutan.            |
| `sensitive`   | `boolean`  | Menandai bidang sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.       |

## Referensi contracts

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat dibaca OpenClaw tanpa mengimpor runtime Plugin.

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

| Bidang                            | Tipe       | Artinya                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | ID factory ekstensi app-server Codex, saat ini `codex-app-server`.                                                                |
| `agentToolResultMiddleware`      | `string[]` | ID runtime tempat plugin ini dapat mendaftarkan middleware hasil alat.                                                                     |
| `trustedToolPolicies`            | `string[]` | ID kebijakan pra-alat tepercaya lokal plugin yang dapat didaftarkan oleh plugin terinstal. Plugin bawaan dapat mendaftarkan kebijakan tanpa bidang ini. |
| `externalAuthProviders`          | `string[]` | ID penyedia yang hook profil autentikasi eksternalnya dimiliki plugin ini.                                                                      |
| `embeddingProviders`             | `string[]` | ID penyedia embedding umum yang dimiliki plugin ini untuk penggunaan embedding vektor yang dapat digunakan kembali, termasuk memori.                                 |
| `speechProviders`                | `string[]` | ID penyedia ucapan yang dimiliki plugin ini.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | ID penyedia transkripsi waktu nyata yang dimiliki plugin ini.                                                                                |
| `realtimeVoiceProviders`         | `string[]` | ID penyedia suara waktu nyata yang dimiliki plugin ini.                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | ID penyedia embedding khusus memori yang tidak digunakan lagi dan dimiliki plugin ini.                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | ID penyedia pemahaman media yang dimiliki plugin ini.                                                                                   |
| `transcriptSourceProviders`      | `string[]` | ID penyedia sumber transkrip yang dimiliki plugin ini.                                                                                     |
| `documentExtractors`             | `string[]` | ID penyedia ekstraktor dokumen (misalnya PDF) yang dimiliki plugin ini.                                                                  |
| `imageGenerationProviders`       | `string[]` | ID penyedia pembuatan gambar yang dimiliki plugin ini.                                                                                      |
| `videoGenerationProviders`       | `string[]` | ID penyedia pembuatan video yang dimiliki plugin ini.                                                                                      |
| `musicGenerationProviders`       | `string[]` | ID penyedia pembuatan musik yang dimiliki plugin ini.                                                                                      |
| `webContentExtractors`           | `string[]` | ID penyedia ekstraksi konten halaman web yang dimiliki plugin ini.                                                                           |
| `webFetchProviders`              | `string[]` | ID penyedia pengambilan web yang dimiliki plugin ini.                                                                                             |
| `webSearchProviders`             | `string[]` | ID penyedia pencarian web yang dimiliki plugin ini.                                                                                            |
| `workerProviders`                | `string[]` | ID penyedia pekerja cloud yang dimiliki plugin ini untuk penyediaan dan siklus hidup sewa berbasis profil.                                      |
| `usageProviders`                 | `string[]` | ID penyedia yang hook autentikasi penggunaan dan snapshot penggunaannya dimiliki plugin ini.                                                             |
| `migrationProviders`             | `string[]` | ID penyedia impor yang dimiliki plugin ini untuk `openclaw migrate`.                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Hak yang dicadangkan untuk rute HTTP plugin terautentikasi yang mengirimkan metode Gateway dalam proses.                                  |
| `tools`                          | `string[]` | Nama alat agen yang dimiliki plugin ini.                                                                                                   |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory ekstensi bawaan khusus app-server Codex. Transformasi hasil alat bawaan sebaiknya mendeklarasikan `contracts.agentToolResultMiddleware` dan sebagai gantinya mendaftar dengan `api.registerAgentToolResultMiddleware(...)`. Plugin terinstal hanya dapat menggunakan seam middleware yang sama jika diaktifkan secara eksplisit dan hanya untuk runtime yang dideklarasikan dalam `contracts.agentToolResultMiddleware`.

Plugin terinstal yang memerlukan tingkat kebijakan pra-alat tepercaya host harus mendeklarasikan setiap ID lokal terdaftar dalam `contracts.trustedToolPolicies` dan diaktifkan secara eksplisit. Plugin bawaan tetap menggunakan jalur kebijakan tepercaya yang sudah ada, tetapi plugin terinstal dengan ID kebijakan yang tidak dideklarasikan akan ditolak sebelum pendaftaran. ID kebijakan dibatasi cakupannya pada plugin yang mendaftarkannya, sehingga dua plugin dapat sama-sama mendeklarasikan dan mendaftarkan `workflow-budget`; satu plugin tidak boleh mendaftarkan ID lokal yang sama dua kali.

Pendaftaran runtime `api.registerTool(...)` harus cocok dengan `contracts.tools`. Penemuan alat menggunakan daftar ini untuk memuat hanya runtime plugin yang dapat memiliki alat yang diminta.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` sebaiknya mendeklarasikan `contracts.externalAuthProviders`; hook autentikasi eksternal yang tidak dideklarasikan akan diabaikan.

Plugin penyedia yang mengimplementasikan `resolveUsageAuth` dan `fetchUsageSnapshot` harus mendeklarasikan setiap ID penyedia yang ditemukan secara otomatis dalam `contracts.usageProviders`. Penemuan penggunaan membaca kontrak ini sebelum memuat kode runtime, lalu memverifikasi kedua hook setelah hanya memuat pemilik yang dideklarasikan.

Penyedia embedding umum sebaiknya mendeklarasikan `contracts.embeddingProviders` untuk setiap adaptor yang didaftarkan dengan `api.registerEmbeddingProvider(...)`. Gunakan kontrak umum untuk pembuatan vektor yang dapat digunakan kembali, termasuk penyedia yang digunakan oleh pencarian memori. `contracts.memoryEmbeddingProviders` adalah kompatibilitas khusus memori yang tidak digunakan lagi dan hanya dipertahankan selama penyedia yang ada bermigrasi ke seam penyedia embedding generik.

Penyedia pekerja harus mendeklarasikan setiap ID `api.registerWorkerProvider(...)` dalam `contracts.workerProviders`. Core menyimpan intensi persisten sebelum memanggil `provision`; penyedia memvalidasi pengaturannya sebelum alokasi eksternal, dan panggilan berulang dengan ID operasi yang sama harus mengadopsi sewa yang sama. Core juga menyimpan snapshot pengaturan tervalidasi tersebut dan meneruskannya bersama `leaseId` ke `inspect({ leaseId, profile })` dan `destroy({ leaseId, profile })`, termasuk setelah profil bernama diubah atau dihapus. Pemusnahan bersifat idempoten, inspeksi mengembalikan union status tertutup `active` / `destroyed` / `unknown`, dan materi kunci privat SSH hanya direferensikan melalui `SecretRef`. Endpoint SSH yang disediakan juga harus menyertakan `hostKey` publik dari keluaran penyediaan tepercaya sebagai tepat `algorithm base64`, tanpa nama host atau komentar, agar core dapat menyematkan host sebelum terhubung. Penyedia yang menerbitkan referensi identitas dinamis dapat mengimplementasikan `resolveSshIdentity({ leaseId, profile, keyRef })` yang otoritatif; penyedia tanpa itu menggunakan resolver rahasia generik milik core. `unknown` yang otoritatif membuat rekaman lokal aktif menjadi yatim; setelah permintaan pemusnahan disimpan, hook tersebut mengonfirmasi pembongkaran.

`contracts.gatewayMethodDispatch` saat ini menerima `"authenticated-request"`. Ini adalah gerbang kebersihan API untuk rute HTTP plugin native yang secara sengaja mengirimkan metode bidang kontrol Gateway dalam proses, bukan sandbox terhadap plugin native berbahaya. Gunakan hanya untuk permukaan bawaan/operator yang ditinjau secara ketat dan sudah memerlukan autentikasi HTTP Gateway. Rute yang memiliki hak tetap dapat dijangkau ketika penerimaan pekerjaan root Gateway ditutup hanya jika rute tersebut juga mendeklarasikan `auth: "gateway"` dan `gatewayRuntimeScopeSurface: "trusted-operator"` khusus rute; rute saudara biasa dari plugin yang sama tetap berada di balik batas penerimaan. Hal ini menjaga status penangguhan dan fungsi melanjutkan tetap dapat dijangkau tanpa memberikan bypass penerimaan kepada seluruh plugin. Jaga penguraian dan pembentukan respons tetap terbatas di luar dispatch; pekerjaan substantif atau yang mengubah keadaan harus melalui dispatch metode Gateway, yang memiliki penegakan penerimaan dan cakupan.

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
          "path": "routes.*.secret",
          "expected": "string",
          "ownerKind": "route"
        }
      ]
    }
  }
}
```

| Bidang                         | Wajib | Tipe       | Artinya                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Tidak       | `string[]` | Jalur konfigurasi relatif terhadap root yang menunjukkan bahwa migrasi kompatibilitas saat penyiapan plugin ini mungkin berlaku. Memungkinkan pembacaan konfigurasi runtime generik melewati setiap permukaan penyiapan plugin ketika konfigurasi tidak pernah merujuk plugin tersebut.                 |
| `compatibilityRuntimePaths`   | Tidak       | `string[]` | Jalur kompatibilitas relatif terhadap root yang dapat ditangani plugin ini selama runtime sebelum kode plugin aktif sepenuhnya. Gunakan ini untuk permukaan lama yang sebaiknya mempersempit kumpulan kandidat bawaan tanpa mengimpor setiap runtime plugin yang kompatibel. |
| `dangerousFlags`              | Tidak       | `object[]` | Literal konfigurasi yang harus ditandai oleh `openclaw doctor` sebagai tidak aman atau berbahaya ketika diaktifkan. Lihat di bawah.                                                                                                                                   |
| `secretInputs`                | Tidak       | `object`   | Jalur konfigurasi di bawah `plugins.entries.<id>.config` untuk migrasi SecretRef, audit, materialisasi saat startup, dan isolasi opsional pemilik runtime. Lihat di bawah.                                                                             |

Setiap entri `dangerousFlags` mendukung:

| Bidang    | Wajib | Tipe                                  | Artinya                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Ya      | `string`                              | Jalur konfigurasi yang dipisahkan titik, relatif terhadap `plugins.entries.<id>.config`. Mendukung wildcard `*` untuk segmen peta/larik. |
| `equals` | Ya      | `string \| number \| boolean \| null` | Literal persis yang menandai nilai konfigurasi ini sebagai berbahaya.                                                            |

`secretInputs` mendukung:

| Bidang                   | Wajib | Tipe       | Artinya                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Tidak       | `boolean`  | Ganti pengaktifan default plugin bawaan saat menentukan apakah permukaan SecretRef ini aktif. Gunakan ini ketika plugin disertakan sebagai bawaan tetapi permukaannya harus tetap tidak aktif hingga diaktifkan secara eksplisit dalam konfigurasi.                                                                                                                                            |
| `paths`                 | Ya      | `object[]` | Jalur konfigurasi berbentuk rahasia, masing-masing dengan `path` (dipisahkan titik, relatif terhadap `plugins.entries.<id>.config`, mendukung wildcard `*`), `expected` opsional (saat ini hanya `"string"`), dan `ownerKind` opsional (saat ini hanya `"route"`). Pemilik yang dideklarasikan hanya mengisolasi jalur persis yang cocok tersebut ketika resolusi gagal; id pemiliknya adalah jalur konfigurasi lengkap. |

## Referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` ketika penyedia pemahaman media memiliki model default, prioritas fallback autentikasi otomatis, atau dukungan dokumen native yang diperlukan pembantu inti generik sebelum runtime dimuat. Kunci juga harus dideklarasikan dalam `contracts.mediaUnderstandingProviders`.

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

| Bidang                  | Tipe                                                             | Artinya                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Kemampuan media yang disediakan oleh penyedia ini.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Default kemampuan-ke-model yang digunakan ketika konfigurasi tidak menentukan model.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Angka yang lebih rendah diurutkan lebih awal untuk fallback penyedia otomatis berbasis kredensial.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Input dokumen native yang didukung oleh penyedia.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Penggantian model per jenis dokumen. Atur `image: false` untuk menonaktifkan ekstraksi berbasis gambar bagi jenis dokumen tersebut. |

## Referensi channelConfigs

Gunakan `channelConfigs` ketika plugin saluran memerlukan metadata konfigurasi ringan sebelum runtime dimuat. Penemuan penyiapan/status saluran hanya-baca dapat menggunakan metadata ini secara langsung untuk saluran eksternal yang dikonfigurasi ketika entri penyiapan tidak tersedia, atau ketika `setup.requiresRuntime: false` menyatakan bahwa runtime penyiapan tidak diperlukan.

`channelConfigs` adalah metadata manifes plugin, bukan bagian konfigurasi pengguna tingkat atas yang baru. Pengguna tetap mengonfigurasi instans saluran di bawah `channels.<channel-id>`. OpenClaw membaca metadata manifes untuk menentukan plugin yang memiliki saluran terkonfigurasi tersebut sebelum kode runtime plugin dijalankan.

Untuk plugin saluran, `configSchema` dan `channelConfigs` menjelaskan jalur yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin nonbawaan yang mendeklarasikan `channels[]` juga harus mendeklarasikan entri `channelConfigs` yang sesuai. Tanpanya, OpenClaw masih dapat memuat plugin, tetapi skema konfigurasi jalur dingin, penyiapan, dan permukaan Control UI tidak dapat mengetahui bentuk opsi milik saluran hingga runtime plugin dijalankan.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan `nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk pemeriksaan konfigurasi perintah yang berjalan sebelum runtime saluran dimuat. Saluran bawaan juga dapat memublikasikan default yang sama melalui `package.json#openclaw.channel.commands` bersama metadata katalog saluran milik paket lainnya.

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

Setiap entri saluran dapat mencakup:

| Bidang         | Tipe                     | Artinya                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi saluran yang dideklarasikan.         |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian konfigurasi saluran tersebut.          |
| `label`       | `string`                 | Label saluran yang digabungkan ke permukaan pemilih dan inspeksi ketika metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi singkat saluran untuk permukaan inspeksi dan katalog.                               |
| `commands`    | `object`                 | Default otomatis perintah native dan skill native statis untuk pemeriksaan konfigurasi praruntime.       |
| `preferOver`  | `string[]`               | Id plugin lama atau berprioritas lebih rendah yang harus dikalahkan saluran ini dalam permukaan pemilihan.    |

### Menggantikan plugin saluran lain

Gunakan `preferOver` ketika plugin Anda adalah pemilik pilihan untuk id saluran yang juga dapat disediakan oleh plugin lain. Kasus umum adalah id plugin yang diubah namanya, plugin mandiri yang menggantikan plugin bawaan, atau fork yang dipelihara dan mempertahankan id saluran yang sama demi kompatibilitas konfigurasi.

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

Ketika `channels.chat` dikonfigurasi, OpenClaw mempertimbangkan id saluran dan id plugin pilihan. Jika plugin berprioritas lebih rendah dipilih hanya karena merupakan bawaan atau diaktifkan secara default, OpenClaw menonaktifkannya dalam konfigurasi runtime efektif sehingga satu plugin memiliki saluran dan alatnya. Pilihan eksplisit pengguna tetap berlaku: jika pengguna secara eksplisit mengaktifkan kedua plugin (melalui `plugins.allow` atau konfigurasi `plugins.entries` yang material), OpenClaw mempertahankan pilihan tersebut dan melaporkan diagnostik saluran/alat duplikat alih-alih diam-diam mengubah kumpulan plugin yang diminta.

Batasi cakupan `preferOver` pada id plugin yang benar-benar dapat menyediakan saluran yang sama. Ini bukan bidang prioritas umum dan tidak mengganti nama kunci konfigurasi pengguna.

## Referensi modelSupport

Gunakan `modelSupport` ketika OpenClaw harus menyimpulkan plugin penyedia Anda dari id model singkat seperti `gpt-5.6-sol` atau `claude-sonnet-4.6` sebelum runtime plugin dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan urutan prioritas berikut:

- referensi `provider/model` eksplisit menggunakan metadata manifes `providers` pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin nonbawaan dan satu plugin bawaan sama-sama cocok, plugin nonbawaan menang
- ambiguitas yang tersisa diabaikan hingga pengguna atau konfigurasi menentukan penyedia

Bidang:

| Bidang           | Tipe       | Artinya                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model singkat.                 |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model singkat setelah sufiks profil dihapus. |

Entri `modelPatterns` dikompilasi melalui `compileSafeRegex`, yang menolak pola yang mengandung pengulangan bersarang (misalnya `(a+)+$`). Pola yang gagal dalam pemeriksaan keamanan dilewati secara diam-diam, sama seperti regex yang sintaksnya tidak valid. Pertahankan pola tetap sederhana dan hindari kuantifier bersarang.

## Referensi modelCatalog

Gunakan `modelCatalog` ketika OpenClaw harus mengetahui metadata model penyedia sebelum memuat runtime plugin. Ini adalah sumber milik manifes untuk baris katalog tetap, alias penyedia, aturan penyembunyian, dan mode penemuan. Penyegaran runtime tetap menjadi tanggung jawab kode runtime penyedia, tetapi manifes memberi tahu inti kapan runtime diperlukan.

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

Bidang tingkat atas:

| Bidang            | Tipe                                                     | Artinya                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki oleh plugin ini. Kunci juga harus muncul di `providers` tingkat teratas.       |
| `aliases`        | `Record<string, object>`                                 | Alias penyedia yang harus di-resolve menjadi penyedia yang dimiliki untuk perencanaan katalog atau supresi.              |
| `suppressions`   | `object[]`                                               | Baris model dari sumber lain yang disupresi oleh plugin ini karena alasan khusus penyedia.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, dimuat ulang ke cache, atau memerlukan runtime. |
| `runtimeAugment` | `boolean`                                                | Atur ke `true` hanya ketika runtime penyedia harus menambahkan baris katalog setelah perencanaan manifes/konfigurasi.       |

`aliases` berpartisipasi dalam pencarian kepemilikan penyedia untuk perencanaan katalog model. Target alias harus berupa penyedia tingkat teratas yang dimiliki oleh plugin yang sama. Ketika daftar yang difilter berdasarkan penyedia menggunakan alias, OpenClaw dapat membaca manifes pemilik dan menerapkan penggantian API/URL dasar alias tanpa memuat runtime penyedia. Alias tidak memperluas daftar katalog tanpa filter; daftar luas hanya menghasilkan baris penyedia kanonis milik pemilik.

`suppressions` menggantikan hook `suppressBuiltInModel` runtime penyedia lama. Entri supresi hanya dipatuhi ketika penyedia dimiliki oleh plugin atau dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia milik plugin. Hook supresi runtime tidak lagi dipanggil selama resolusi model.

Bidang penyedia:

| Bidang                 | Tipe                     | Artinya                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL dasar bawaan opsional untuk model dalam katalog penyedia ini.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adaptor API bawaan opsional untuk model dalam katalog penyedia ini.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Id model kecil opsional yang direkomendasikan penyedia untuk tugas utilitas internal singkat (judul, narasi progres). Digunakan ketika `agents.defaults.utilityModel` tidak diatur dan penyedia ini melayani model utama agen. |
| `models`              | `object[]`               | Baris model wajib. Baris tanpa `id` akan diabaikan.                                                                                                                                                            |

Bidang model:

| Bidang              | Tipe                                                           | Artinya                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Id model lokal penyedia, tanpa prefiks `provider/`.                    |
| `name`             | `string`                                                       | Nama tampilan opsional.                                                      |
| `api`              | `ModelApi`                                                     | Penggantian API per model opsional.                                            |
| `baseUrl`          | `string`                                                       | Penggantian URL dasar per model opsional.                                       |
| `headers`          | `Record<string, string>`                                       | Header statis per model opsional.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalitas yang diterima model. Nilai lain akan dihapus tanpa pemberitahuan.            |
| `reasoning`        | `boolean`                                                      | Apakah model menyediakan perilaku penalaran.                               |
| `contextWindow`    | `number`                                                       | Jendela konteks asli penyedia.                                             |
| `contextTokens`    | `number`                                                       | Batas konteks runtime efektif opsional ketika berbeda dari `contextWindow`. |
| `maxTokens`        | `number`                                                       | Token keluaran maksimum jika diketahui.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Penggantian id model atau parameter per tingkat berpikir opsional.                    |
| `cost`             | `object`                                                       | Harga opsional dalam USD per sejuta token, termasuk `tieredPricing` opsional. |
| `compat`           | `object`                                                       | Flag kompatibilitas opsional yang sesuai dengan kompatibilitas konfigurasi model OpenClaw.  |
| `mediaInput`       | `object`                                                       | Konfigurasi masukan per modalitas opsional, saat ini hanya gambar.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status pencantuman. Lakukan supresi hanya ketika baris sama sekali tidak boleh muncul.          |
| `statusReason`     | `string`                                                       | Alasan opsional yang ditampilkan bersama status tidak tersedia.                            |
| `replaces`         | `string[]`                                                     | Id model lokal penyedia lama yang digantikan oleh model ini.                       |
| `replacedBy`       | `string`                                                       | Id model lokal penyedia pengganti untuk baris yang tidak digunakan lagi.                    |
| `tags`             | `string[]`                                                     | Tag stabil yang digunakan oleh pemilih dan filter.                                    |

Bidang supresi:

| Bidang                      | Tipe       | Artinya                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id penyedia untuk baris hulu yang akan disupresi. Harus dimiliki oleh plugin ini atau dideklarasikan sebagai alias milik plugin. |
| `model`                    | `string`   | Id model lokal penyedia yang akan disupresi.                                                                      |
| `reason`                   | `string`   | Pesan opsional yang ditampilkan ketika baris yang disupresi diminta secara langsung.                                     |
| `when.baseUrlHosts`        | `string[]` | Daftar opsional host URL dasar penyedia efektif yang diwajibkan sebelum supresi diterapkan.               |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi penyedia persis yang diwajibkan sebelum supresi diterapkan.              |

Jangan masukkan data khusus runtime ke dalam `modelCatalog`. Gunakan `static` hanya ketika baris manifes cukup lengkap agar permukaan daftar dan pemilih yang difilter berdasarkan penyedia dapat melewati penemuan registry/runtime. Gunakan `refreshable` ketika baris manifes merupakan benih atau pelengkap yang berguna dan dapat dicantumkan, tetapi pemuatan ulang/cache dapat menambahkan lebih banyak baris nanti; baris yang dapat dimuat ulang tidak bersifat otoritatif dengan sendirinya. Gunakan `runtime` ketika OpenClaw harus memuat runtime penyedia untuk mengetahui daftarnya.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan id model milik penyedia yang ringan dan harus dilakukan sebelum runtime penyedia dimuat. Ini mempertahankan alias seperti nama model pendek, id lama lokal penyedia, dan aturan prefiks proksi dalam manifes plugin pemilik, bukan dalam tabel pemilihan model inti.

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

| Bidang                                | Tipe                    | Artinya                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias id model persis yang tidak membedakan huruf besar/kecil. Nilai dikembalikan sebagaimana ditulis.                  |
| `stripPrefixes`                      | `string[]`              | Prefiks yang akan dihapus sebelum pencarian alias, berguna untuk duplikasi penyedia/model lama.     |
| `prefixWhenBare`                     | `string`                | Prefiks yang akan ditambahkan ketika id model yang dinormalisasi belum mengandung `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan prefiks id polos bersyarat setelah pencarian alias, dengan kunci `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi endpoint yang harus diketahui oleh kebijakan permintaan generik sebelum runtime penyedia dimuat. Inti tetap memiliki makna setiap `endpointClass`; manifes plugin memiliki metadata host dan URL dasar.

Plugin penyedia yang secara resmi dieksternalisasi dikecualikan dari distribusi inti, sehingga
manifesnya tidak terlihat hingga dipasang. `providerEndpoints` miliknya harus
juga dicerminkan dalam `scripts/lib/official-external-provider-catalog.json` agar
klasifikasi endpoint tetap berfungsi tanpa plugin; pengujian kontrak
memastikan pencerminan tersebut.

Bidang endpoint:

| Bidang                         | Jenis      | Artinya                                                                                        |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint inti yang dikenal, seperti `openrouter`, `moonshot-native`, atau `google-vertex`.        |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                             |
| `hostSuffixes`                 | `string[]` | Sufiks host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus sufiks domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi persis yang dipetakan ke kelas endpoint.                      |
| `googleVertexRegion`           | `string`   | Wilayah Google Vertex statis untuk host global persis.                                         |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks yang dihapus dari host yang cocok untuk mengekspos prefiks wilayah Google Vertex.       |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan yang murah, yang diperlukan kebijakan permintaan generik tanpa memuat runtime penyedia. Pertahankan penulisan ulang payload khusus perilaku dalam hook runtime penyedia atau pembantu keluarga penyedia bersama.

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

| Bidang                | Jenis        | Artinya                                                                                |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label keluarga penyedia yang digunakan oleh keputusan kompatibilitas permintaan generik dan diagnostik. |
| `compatibilityFamily` | `"moonshot"` | Kelompok kompatibilitas keluarga penyedia opsional untuk pembantu permintaan bersama.  |
| `openAICompletions`   | `object`     | Flag permintaan penyelesaian yang kompatibel dengan OpenAI, saat ini `supportsStreamingUsage`.       |

## Referensi secretProviderIntegrations

Gunakan `secretProviderIntegrations` ketika plugin dapat menerbitkan preset penyedia exec SecretRef yang dapat digunakan kembali. OpenClaw membaca metadata ini sebelum runtime plugin dimuat, menyimpan kepemilikan plugin di `secrets.providers.<alias>.pluginIntegration`, dan menyerahkan resolusi rahasia sebenarnya kepada runtime SecretRef. Preset hanya diekspos untuk plugin bawaan dan plugin terpasang yang ditemukan dari akar pemasangan plugin terkelola, seperti pemasangan git dan ClawHub.

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

Kunci peta adalah id integrasi. Jika `providerAlias` dihilangkan, OpenClaw menggunakan id integrasi sebagai alias penyedia SecretRef. Alias penyedia harus cocok dengan pola alias penyedia SecretRef normal, misalnya `team-secrets` atau `onepassword-work`.

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

Saat mulai/muat ulang, OpenClaw menyelesaikan penyedia tersebut dengan memuat metadata manifes plugin saat ini, memeriksa bahwa plugin pemilik telah terpasang dan aktif, serta mewujudkan perintah exec dari manifes. Menonaktifkan atau menghapus plugin mencabut penyedia untuk SecretRef aktif. Operator yang menginginkan konfigurasi exec mandiri tetap dapat menulis penyedia manual `command`/`args` secara langsung.

Saat ini hanya preset `source: "exec"` yang didukung. `command` harus berupa `${node}`, dan `args[0]` harus berupa skrip penyelesai `./` yang relatif terhadap akar plugin. OpenClaw mewujudkannya saat mulai/muat ulang menjadi executable Node saat ini dan jalur skrip absolut di dalam plugin. Opsi Node seperti `--require`, `--import`, `--loader`, `--env-file`, `--eval`, dan `--print` bukan bagian dari kontrak preset manifes. Operator yang memerlukan perintah non-Node dapat mengonfigurasi penyedia exec manual mandiri secara langsung.

OpenClaw memperoleh `trustedDirs` untuk preset manifes dari akar plugin dan, untuk preset `${node}`, direktori executable Node saat ini. `trustedDirs` yang ditulis dalam manifes diabaikan. Opsi penyedia exec lainnya seperti `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv`, dan `allowInsecurePath` diteruskan ke konfigurasi penyedia exec SecretRef normal.

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

| Bidang       | Jenis             | Artinya                                                                                            |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Tetapkan `false` untuk penyedia lokal/yang di-host sendiri yang tidak boleh mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan pencarian harga OpenRouter. `false` menonaktifkan pencarian OpenRouter untuk penyedia ini.           |
| `liteLLM`    | `false \| object` | Pemetaan pencarian harga LiteLLM. `false` menonaktifkan pencarian LiteLLM untuk penyedia ini.                 |

Bidang sumber:

| Bidang                     | Jenis              | Artinya                                                                                                              |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id penyedia katalog eksternal ketika berbeda dari id penyedia OpenClaw, misalnya `z-ai` untuk penyedia `zai`. |
| `passthroughProviderModel` | `boolean`          | Perlakukan id model yang mengandung garis miring sebagai referensi penyedia/model bertingkat, berguna untuk penyedia proksi seperti OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varian id model katalog eksternal tambahan. `version-dots` mencoba id versi bertitik seperti `claude-opus-4.6`.            |

### Indeks Penyedia OpenClaw

Indeks Penyedia OpenClaw adalah metadata pratinjau milik OpenClaw untuk penyedia yang pluginnya mungkin belum terpasang. Ini bukan bagian dari manifes plugin. Manifes plugin tetap menjadi otoritas untuk plugin terpasang. Indeks Penyedia adalah kontrak fallback internal yang akan digunakan oleh permukaan pemilih model pra-pemasangan dan penyedia yang dapat dipasang di masa mendatang ketika plugin penyedia belum terpasang.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. Manifes plugin terpasang `modelCatalog`.
3. Cache katalog model dari penyegaran eksplisit.
4. Baris pratinjau Indeks Penyedia OpenClaw.

Indeks Penyedia tidak boleh memuat rahasia, status aktif, hook runtime, atau data model langsung yang khusus untuk akun. Katalog pratinjaunya menggunakan bentuk baris penyedia `modelCatalog` yang sama dengan manifes plugin, tetapi harus tetap terbatas pada metadata tampilan yang stabil, kecuali bidang adaptor runtime seperti `api`, `baseUrl`, harga, atau flag kompatibilitas sengaja dipertahankan agar selaras dengan manifes plugin terpasang. Penyedia dengan penemuan `/models` langsung harus menulis baris yang disegarkan melalui jalur cache katalog model eksplisit, alih-alih membuat pencantuman normal atau orientasi awal memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata plugin yang dapat dipasang untuk penyedia yang pluginnya telah dipindahkan dari inti atau belum terpasang karena alasan lain. Metadata ini mencerminkan pola katalog saluran: nama paket, spesifikasi pemasangan npm, integritas yang diharapkan, dan label pilihan autentikasi sederhana sudah cukup untuk menampilkan opsi penyiapan yang dapat dipasang. Setelah plugin terpasang, manifesnya akan diutamakan dan entri Indeks Penyedia diabaikan untuk penyedia tersebut.

`openclaw doctor --fix` memigrasikan sekumpulan kecil dan tertutup kunci kemampuan manifes tingkat atas lama ke dalam `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, dan `tools`. Tidak satu pun dari kunci ini (atau daftar kemampuan lainnya) dibaca sebagai bidang manifes tingkat atas lagi; pemuatan manifes normal hanya mengenalinya di bawah `contracts`.

## Manifes dibandingkan dengan package.json

Kedua berkas tersebut menjalankan tugas yang berbeda:

| Berkas                 | Gunakan untuk                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Penemuan, validasi konfigurasi, metadata pilihan autentikasi, dan petunjuk UI yang harus tersedia sebelum kode plugin dijalankan |
| `package.json`         | Metadata npm, pemasangan dependensi, dan blok `openclaw` yang digunakan untuk titik masuk, pembatasan pemasangan, penyiapan, atau metadata katalog |

Jika Anda tidak yakin di mana suatu metadata harus ditempatkan, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika berkaitan dengan pengemasan, berkas titik masuk, atau perilaku pemasangan npm, letakkan di `package.json`

### Bidang package.json yang memengaruhi penemuan

Beberapa metadata plugin pra-runtime sengaja berada di `package.json` dalam blok `openclaw`, bukan di `openclaw.plugin.json`. `openclaw.bundle` dan `openclaw.bundle.json` bukan kontrak plugin OpenClaw; plugin native harus menggunakan `openclaw.plugin.json` beserta bidang `package.json#openclaw` yang didukung di bawah ini.

Contoh penting:

| Bidang                                                                                     | Artinya                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Mendeklarasikan titik masuk plugin native. Harus tetap berada di dalam direktori paket plugin.                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Mendeklarasikan titik masuk runtime JavaScript hasil build untuk paket yang terinstal. Harus tetap berada di dalam direktori paket plugin.                                            |
| `openclaw.setupEntry`                                                                      | Titik masuk ringan khusus penyiapan yang digunakan selama onboarding, penundaan startup channel, dan penemuan status channel/SecretRef hanya-baca. Harus tetap berada di dalam direktori paket plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Mendeklarasikan titik masuk penyiapan JavaScript hasil build untuk paket yang terinstal. Memerlukan `setupEntry`, harus tersedia, dan harus tetap berada di dalam direktori paket plugin. |
| `openclaw.channel`                                                                         | Metadata katalog channel berbiaya rendah seperti label, jalur dokumentasi, alias, dan teks pilihan.                                                                                  |
| `openclaw.channel.approvalFlags`                                                           | Flag perilaku persetujuan tertutup yang tersedia sebelum runtime dimuat. `native` berarti channel memiliki UI persetujuan native dan penyelesaian dalam giliran yang sama.           |
| `openclaw.channel.commands`                                                                | Metadata default otomatis statis untuk perintah native dan skill native yang digunakan oleh konfigurasi, audit, dan permukaan daftar perintah sebelum runtime channel dimuat.        |
| `openclaw.channel.configuredState`                                                         | Metadata pemeriksa status terkonfigurasi ringan yang dapat menjawab "apakah penyiapan hanya melalui lingkungan sudah tersedia?" tanpa memuat runtime channel lengkap.                 |
| `openclaw.channel.persistedAuthState`                                                      | Metadata pemeriksa autentikasi tersimpan ringan yang dapat menjawab "apakah sudah ada akun yang masuk?" tanpa memuat runtime channel lengkap.                                        |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Petunjuk instalasi/pembaruan untuk plugin bawaan dan yang dipublikasikan secara eksternal.                                                                                            |
| `openclaw.install.defaultChoice`                                                           | Jalur instalasi yang diutamakan ketika tersedia beberapa sumber instalasi.                                                                                                           |
| `openclaw.install.minHostVersion`                                                          | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22` atau `>=2026.5.1-beta.1`.                                                            |
| `openclaw.compat.pluginApi`                                                                | Rentang minimum API plugin OpenClaw yang diperlukan paket ini, menggunakan batas bawah semver seperti `>=2026.5.27`.                                                               |
| `openclaw.install.expectedIntegrity`                                                       | String integritas dist npm yang diharapkan seperti `sha512-...`; alur instalasi dan pembaruan memverifikasi artefak yang diambil terhadap nilai tersebut.                         |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Mengizinkan jalur pemulihan instalasi ulang plugin bawaan yang terbatas ketika konfigurasi tidak valid.                                                                              |
| `openclaw.install.requiredPlatformPackages`                                                | Alias paket npm yang harus tersedia ketika batasan platform lockfile-nya cocok dengan host saat ini.                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Memungkinkan permukaan channel runtime penyiapan dimuat sebelum mulai mendengarkan, lalu menunda plugin channel terkonfigurasi lengkap hingga aktivasi setelah mulai mendengarkan.    |

Metadata manifes menentukan pilihan penyedia/channel/penyiapan yang muncul dalam onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu onboarding cara mengambil atau mengaktifkan plugin tersebut ketika pengguna memilih salah satu pilihan itu. Jangan pindahkan petunjuk instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan registri manifes untuk sumber plugin nonbawaan. Nilai yang tidak valid ditolak; nilai yang lebih baru tetapi valid menyebabkan plugin eksternal dilewati pada host yang lebih lama. Plugin sumber bawaan diasumsikan memiliki versi yang sama dengan checkout host.

`openclaw.install.requiredPlatformPackages` ditujukan untuk paket npm yang mengekspos biner native wajib melalui alias opsional khusus platform. Cantumkan nama paket npm tanpa tambahan untuk setiap alias platform yang didukung. Selama instalasi npm, OpenClaw hanya memverifikasi alias yang dideklarasikan dan batasan lockfile-nya cocok dengan host saat ini. Jika npm melaporkan keberhasilan tetapi tidak menyertakan alias tersebut, OpenClaw mencoba ulang satu kali dengan cache baru dan membatalkan instalasi jika alias masih tidak tersedia.

`openclaw.compat.pluginApi` diberlakukan selama instalasi paket untuk sumber plugin nonbawaan. Gunakan ini untuk batas bawah API SDK/runtime plugin OpenClaw yang menjadi dasar build paket. Nilainya dapat lebih ketat daripada `minHostVersion` ketika paket plugin memerlukan API yang lebih baru tetapi tetap mempertahankan petunjuk instalasi yang lebih rendah untuk alur lain. Sinkronisasi rilis resmi OpenClaw secara default menaikkan batas bawah API plugin resmi yang sudah ada ke versi rilis OpenClaw, tetapi rilis khusus plugin dapat mempertahankan batas bawah yang lebih rendah ketika paket tersebut sengaja mendukung host yang lebih lama. Jangan gunakan versi paket saja sebagai kontrak kompatibilitas. `peerDependencies.openclaw` tetap merupakan metadata paket npm; OpenClaw menggunakan kontrak `openclaw.compat.pluginApi` untuk keputusan kompatibilitas instalasi.

Metadata instalasi sesuai permintaan resmi harus menggunakan `clawhubSpec` ketika plugin dipublikasikan di ClawHub; onboarding memperlakukannya sebagai sumber jarak jauh yang diutamakan dan mencatat fakta artefak ClawHub setelah instalasi. `npmSpec` tetap menjadi fallback kompatibilitas untuk paket yang belum berpindah ke ClawHub.

Penyematan versi npm yang tepat sudah berada di `npmSpec`, misalnya `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi harus memasangkan spesifikasi tepat dengan `expectedIntegrity` agar alur pembaruan gagal secara tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang disematkan. Onboarding interaktif tetap menawarkan spesifikasi npm registri tepercaya, termasuk nama paket tanpa tambahan dan dist-tag, demi kompatibilitas. Diagnostik katalog dapat membedakan sumber pilihan default yang tepat, mengambang, disematkan integritasnya, tidak memiliki integritas, nama paketnya tidak cocok, dan tidak valid. Diagnostik juga memperingatkan ketika `expectedIntegrity` tersedia tetapi tidak ada sumber npm valid yang dapat disematkannya. Ketika `expectedIntegrity` tersedia, alur instalasi/pembaruan memberlakukannya; ketika tidak dicantumkan, resolusi registri dicatat tanpa sematan integritas.

Plugin channel harus menyediakan `openclaw.setupEntry` ketika pemindaian status, daftar channel, atau SecretRef perlu mengidentifikasi akun yang terkonfigurasi tanpa memuat runtime lengkap. Entri penyiapan harus mengekspos metadata channel beserta adaptor konfigurasi, status, dan rahasia yang aman untuk penyiapan; pertahankan klien jaringan, listener Gateway, dan runtime transportasi di titik masuk ekstensi utama.

Bidang titik masuk runtime tidak mengesampingkan pemeriksaan batas paket untuk bidang titik masuk sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat jalur `openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibatasi. Ini tidak membuat konfigurasi rusak apa pun menjadi dapat diinstal. Saat ini, ini hanya memungkinkan alur instalasi pulih dari kegagalan peningkatan plugin bawaan usang tertentu, seperti jalur plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin bawaan yang sama. Kesalahan konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator ke `openclaw doctor --fix`.

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

Gunakan ini ketika alur penyiapan, doctor, status, atau pemeriksaan keberadaan hanya-baca memerlukan probe autentikasi ya/tidak yang ringan sebelum plugin channel lengkap dimuat. Status autentikasi tersimpan bukanlah status channel terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan plugin secara otomatis, memperbaiki dependensi runtime, atau memutuskan apakah runtime channel harus dimuat. Ekspor target harus berupa fungsi kecil yang hanya membaca status tersimpan; jangan arahkan melalui barrel runtime channel lengkap.

`openclaw.channel.configuredState` mendukung pemeriksaan terkonfigurasi yang ringan. Utamakan metadata lingkungan deklaratif ketika variabel lingkungan sudah memadai:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Gunakan `env.allOf` ketika setiap variabel yang tercantum diwajibkan dan `env.anyOf` ketika salah satu variabel yang tidak kosong sudah cukup. Jika pemeriksaan kecil non-runtime memerlukan lebih dari metadata lingkungan, gunakan `specifier` beserta `exportName` seperti ditunjukkan untuk `persistedAuthState`; ketika `env` tersedia, OpenClaw menggunakannya tanpa memuat modul tersebut. Jika pemeriksaan memerlukan resolusi konfigurasi lengkap atau runtime channel sebenarnya, pertahankan logika tersebut dalam hook `config.hasConfiguredState` plugin.

## Prioritas penemuan (id plugin duplikat)

OpenClaw menemukan plugin dari tiga root, yang diperiksa dalam urutan berikut: plugin bawaan yang disertakan bersama OpenClaw, root instalasi global (`~/.openclaw/extensions`), dan root ruang kerja saat ini (`<workspace>/.openclaw/extensions`), ditambah entri `plugins.load.paths` eksplisit apa pun.

Jika dua hasil penemuan memiliki `id` yang sama, hanya manifes dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat bersamanya. Prioritas, dari tertinggi ke terendah:

1. **Dipilih oleh konfigurasi** — jalur yang disematkan secara eksplisit dalam `plugins.entries.<id>`
2. **Instalasi global yang cocok dengan catatan instalasi terlacak** — plugin yang diinstal melalui `openclaw plugin install`/`openclaw plugin update` dan dikenali oleh pelacakan instalasi OpenClaw untuk id yang sama, bahkan ketika id tersebut juga dimiliki plugin bawaan
3. **Bawaan** — plugin yang disertakan bersama OpenClaw
4. **Ruang kerja** — plugin yang ditemukan relatif terhadap ruang kerja saat ini
5. Kandidat lain yang ditemukan

Implikasi:

- Salinan bercabang atau usang dari Plugin bawaan yang berada tanpa dilacak di ruang kerja atau root global tidak akan membayangi build bawaan.
- Untuk mengganti Plugin bawaan, jalankan `openclaw plugin install` untuk id tersebut agar instalasi global yang dilacak memiliki prioritas lebih tinggi daripada salinan bawaan, atau sematkan jalur tertentu melalui `plugins.entries.<id>` agar jalur tersebut menang berdasarkan prioritas yang dipilih konfigurasi.
- Duplikat yang diabaikan dicatat ke log agar Doctor dan diagnostik startup dapat menunjukkan salinan yang dibuang.
- Penggantian duplikat yang dipilih konfigurasi dinyatakan sebagai penggantian eksplisit dalam diagnostik, tetapi tetap menghasilkan peringatan agar fork usang dan pembayangan yang tidak disengaja tetap terlihat.

## Persyaratan JSON Schema

- **Setiap Plugin harus menyertakan JSON Schema**, meskipun tidak menerima konfigurasi apa pun.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat konfigurasi dibaca/ditulis, bukan saat runtime.
- Saat memperluas atau membuat fork dari Plugin bawaan dengan kunci konfigurasi baru, perbarui `openclaw.plugin.json` `configSchema` milik Plugin tersebut secara bersamaan. Skema Plugin bawaan bersifat ketat, sehingga menambahkan `plugins.entries.<id>.config.myNewKey` dalam konfigurasi pengguna tanpa menambahkan `myNewKey` ke `configSchema.properties` akan ditolak sebelum runtime Plugin dimuat.

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

- Kunci `channels.*` yang tidak dikenal adalah **kesalahan**, kecuali id saluran dideklarasikan oleh manifes Plugin. Jika id yang sama juga muncul dalam `plugins.allow`, `plugins.entries`, atau `plugins.installs` (Plugin yang direferensikan tetapi saat ini tidak dapat ditemukan), OpenClaw menurunkannya menjadi **peringatan**.
- `plugins.entries.<id>`, `plugins.allow`, dan `plugins.deny` yang mereferensikan id Plugin yang tidak dikenal adalah **peringatan** ("entri konfigurasi usang diabaikan"), bukan kesalahan, sehingga peningkatan versi dan Plugin yang dihapus/diganti namanya tidak memblokir startup Gateway.
- `plugins.slots.memory` yang mereferensikan id Plugin yang tidak dikenal adalah **kesalahan**, kecuali untuk Plugin eksternal resmi `memory-lancedb` yang telah dikenal, yang hanya menghasilkan peringatan.
- Jika Plugin telah diinstal tetapi memiliki manifes atau skema yang rusak atau hilang, validasi gagal dan Doctor melaporkan kesalahan Plugin tersebut.
- Jika konfigurasi Plugin tersedia tetapi Plugin **dinonaktifkan**, konfigurasi tetap dipertahankan dan **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifes **wajib untuk Plugin OpenClaw native**, termasuk pemuatan dari sistem berkas lokal. Runtime tetap memuat modul Plugin secara terpisah; manifes hanya digunakan untuk penemuan + validasi.
- Manifes native diuraikan dengan JSON5, sehingga komentar, koma di akhir, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya bidang manifes yang terdokumentasi yang dibaca oleh pemuat manifes. Hindari kunci tingkat atas khusus.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan jika Plugin tidak membutuhkannya.
- `providerCatalogEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime secara luas; gunakan untuk metadata katalog penyedia statis atau deskriptor penemuan yang terbatas, bukan untuk eksekusi saat permintaan.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory` (default `memory-core`), `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Deklarasikan jenis Plugin eksklusif dalam manifes ini. `OpenClawPluginDefinition.kind` pada entri runtime sudah tidak digunakan dan hanya dipertahankan sebagai fallback kompatibilitas untuk Plugin lama.
- Metadata variabel lingkungan dalam `setup.providers[].envVars` hanya bersifat deklaratif. Status, audit, validasi pengiriman Cron, dan permukaan baca-saja lainnya tetap menerapkan kebijakan kepercayaan dan aktivasi efektif Plugin sebelum menganggap variabel lingkungan telah dikonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode penyedia, lihat [Hook runtime penyedia](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah-langkah build dan setiap persyaratan daftar izin pengelola paket (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Membangun Plugin" href="/id/plugins/building-plugins" icon="rocket">
    Memulai dengan Plugin.
  </Card>
  <Card title="Arsitektur Plugin" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model kapabilitas.
  </Card>
  <Card title="Ikhtisar SDK" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK Plugin dan impor subjalur.
  </Card>
</CardGroup>
