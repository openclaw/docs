---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu menyertakan skema konfigurasi Plugin atau men-debug kesalahan validasi Plugin
summary: Persyaratan manifes Plugin + skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-05-02T20:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini hanya untuk **manifes Plugin OpenClaw native**.

Untuk tata letak bundel yang kompatibel, lihat [Bundel Plugin](/id/plugins/bundles).

Format bundel yang kompatibel menggunakan file manifes yang berbeda:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude
  default tanpa manifes
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundel tersebut, tetapi tata letak itu tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundel yang kompatibel, OpenClaw saat ini membaca metadata bundel beserta root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundel Claude,
default LSP bundel Claude, dan paket hook yang didukung ketika tata letaknya sesuai
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** mengirimkan file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifes ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifes yang hilang atau tidak valid diperlakukan sebagai
kesalahan Plugin dan memblokir validasi konfigurasi.

Lihat panduan sistem Plugin lengkap: [Plugin](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat
kode Plugin Anda**. Semua hal di bawah ini harus cukup ringan untuk diperiksa tanpa memulai
runtime Plugin.

**Gunakan untuk:**

- identitas Plugin, validasi konfigurasi, dan petunjuk UI konfigurasi
- metadata autentikasi, onboarding, dan penyiapan (alias, pengaktifan otomatis, variabel env penyedia, pilihan autentikasi)
- petunjuk aktivasi untuk surface control-plane
- kepemilikan shorthand keluarga model
- snapshot kepemilikan kapabilitas statis (`contracts`)
- metadata runner QA yang dapat diperiksa host `openclaw qa` bersama
- metadata konfigurasi khusus kanal yang digabungkan ke surface katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan entrypoint kode,
atau metadata instalasi npm. Hal itu berada di kode Plugin Anda dan `package.json`.

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

## Referensi kolom tingkat atas

| Bidang                               | Wajib | Tipe                             | Artinya                                                                                                                                                                                                                             |
| ------------------------------------ | ----- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya    | `string`                         | id Plugin kanonis. Ini adalah id yang digunakan dalam `plugins.entries.<id>`.                                                                                                                                                       |
| `configSchema`                       | Ya    | `object`                         | JSON Schema sebaris untuk konfigurasi Plugin ini.                                                                                                                                                                                   |
| `enabledByDefault`                   | Tidak | `true`                           | Menandai Plugin bawaan sebagai aktif secara default. Hilangkan, atau tetapkan nilai non-`true` apa pun, agar Plugin tetap nonaktif secara default.                                                                                  |
| `legacyPluginIds`                    | Tidak | `string[]`                       | id lama yang dinormalisasi ke id Plugin kanonis ini.                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Tidak | `string[]`                       | id penyedia yang seharusnya otomatis mengaktifkan Plugin ini saat autentikasi, konfigurasi, atau referensi model menyebutkannya.                                                                                                    |
| `kind`                               | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Tidak | `string[]`                       | id kanal yang dimiliki oleh Plugin ini. Digunakan untuk penemuan dan validasi konfigurasi.                                                                                                                                          |
| `providers`                          | Tidak | `string[]`                       | id penyedia yang dimiliki oleh Plugin ini.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | Tidak | `string`                         | Jalur modul penemuan penyedia ringan, relatif terhadap root Plugin, untuk metadata katalog penyedia berlingkup manifes yang dapat dimuat tanpa mengaktifkan seluruh waktu jalan Plugin.                                             |
| `modelSupport`                       | Tidak | `object`                         | Metadata keluarga model ringkas yang dimiliki manifes dan digunakan untuk memuat otomatis Plugin sebelum waktu jalan.                                                                                                               |
| `modelCatalog`                       | Tidak | `object`                         | Metadata katalog model deklaratif untuk penyedia yang dimiliki oleh Plugin ini. Ini adalah kontrak bidang kontrol untuk daftar baca-saja, onboarding, pemilih model, alias, dan supresi di masa mendatang tanpa memuat waktu jalan Plugin. |
| `modelPricing`                       | Tidak | `object`                         | Kebijakan pencarian harga eksternal yang dimiliki penyedia. Gunakan ini untuk mengecualikan penyedia lokal/dihosting sendiri dari katalog harga jarak jauh atau memetakan referensi penyedia ke id katalog OpenRouter/LiteLLM tanpa menanamkan id penyedia secara keras di inti. |
| `modelIdNormalization`               | Tidak | `object`                         | Pembersihan alias/prefiks id model yang dimiliki penyedia dan harus berjalan sebelum waktu jalan penyedia dimuat.                                                                                                                   |
| `providerEndpoints`                  | Tidak | `object[]`                       | Metadata host/baseUrl endpoint yang dimiliki manifes untuk rute penyedia yang harus diklasifikasikan inti sebelum waktu jalan penyedia dimuat.                                                                                      |
| `providerRequest`                    | Tidak | `object`                         | Metadata murah keluarga penyedia dan kompatibilitas permintaan yang digunakan oleh kebijakan permintaan generik sebelum waktu jalan penyedia dimuat.                                                                                |
| `cliBackends`                        | Tidak | `string[]`                       | id backend inferensi CLI yang dimiliki oleh Plugin ini. Digunakan untuk aktivasi otomatis saat startup dari referensi konfigurasi eksplisit.                                                                                        |
| `syntheticAuthRefs`                  | Tidak | `string[]`                       | Referensi penyedia atau backend CLI yang hook autentikasi sintetis milik Plugin-nya harus diperiksa selama penemuan model dingin sebelum waktu jalan dimuat.                                                                       |
| `nonSecretAuthMarkers`               | Tidak | `string[]`                       | Nilai kunci API placeholder milik Plugin bawaan yang merepresentasikan status kredensial lokal, OAuth, atau sekitar yang bukan rahasia.                                                                                             |
| `commandAliases`                     | Tidak | `object[]`                       | Nama perintah yang dimiliki oleh Plugin ini yang seharusnya menghasilkan diagnostik konfigurasi dan CLI sadar Plugin sebelum waktu jalan dimuat.                                                                                    |
| `providerAuthEnvVars`                | Tidak | `Record<string, string[]>`       | Metadata lingkungan kompatibilitas yang tidak digunakan lagi untuk pencarian autentikasi/status penyedia. Utamakan `setup.providers[].envVars` untuk Plugin baru; OpenClaw masih membaca ini selama jendela deprekasi.              |
| `providerAuthAliases`                | Tidak | `Record<string, string>`         | id penyedia yang seharusnya menggunakan ulang id penyedia lain untuk pencarian autentikasi, misalnya penyedia pengodean yang berbagi kunci API penyedia dasar dan profil autentikasi.                                              |
| `channelEnvVars`                     | Tidak | `Record<string, string[]>`       | Metadata lingkungan kanal murah yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk penyiapan kanal berbasis lingkungan atau permukaan autentikasi yang seharusnya terlihat oleh helper startup/konfigurasi generik. |
| `providerAuthChoices`                | Tidak | `object[]`                       | Metadata pilihan autentikasi murah untuk pemilih onboarding, resolusi penyedia pilihan, dan pengawatan flag CLI sederhana.                                                                                                         |
| `activation`                         | Tidak | `object`                         | Metadata perencana aktivasi murah untuk pemuatan yang dipicu startup, penyedia, perintah, kanal, rute, dan kapabilitas. Hanya metadata; waktu jalan Plugin tetap memiliki perilaku aktual.                                         |
| `setup`                              | Tidak | `object`                         | Deskriptor penyiapan/onboarding murah yang dapat diperiksa permukaan penemuan dan penyiapan tanpa memuat waktu jalan Plugin.                                                                                                       |
| `qaRunners`                          | Tidak | `object[]`                       | Deskriptor runner QA murah yang digunakan oleh host `openclaw qa` bersama sebelum waktu jalan Plugin dimuat.                                                                                                                        |
| `contracts`                          | Tidak | `object`                         | Snapshot kepemilikan kapabilitas statis untuk hook autentikasi eksternal, ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, pengambilan web, pencarian web, dan kepemilikan alat. |
| `mediaUnderstandingProviderMetadata` | Tidak | `Record<string, object>`         | Default pemahaman media murah untuk id penyedia yang dideklarasikan dalam `contracts.mediaUnderstandingProviders`.                                                                                                                  |
| `imageGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan gambar murah untuk id penyedia yang dideklarasikan dalam `contracts.imageGenerationProviders`, termasuk alias autentikasi dan penjaga base-url yang dimiliki penyedia.                              |
| `videoGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan video murah untuk id penyedia yang dideklarasikan dalam `contracts.videoGenerationProviders`, termasuk alias autentikasi dan penjaga base-url yang dimiliki penyedia.                               |
| `musicGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan musik murah untuk id penyedia yang dideklarasikan dalam `contracts.musicGenerationProviders`, termasuk alias autentikasi dan penjaga base-url yang dimiliki penyedia.                               |
| `toolMetadata`                       | Tidak | `Record<string, object>`         | Metadata ketersediaan murah untuk alat milik Plugin yang dideklarasikan dalam `contracts.tools`. Gunakan ini saat sebuah alat tidak seharusnya memuat waktu jalan kecuali ada bukti konfigurasi, lingkungan, atau autentikasi.     |
| `channelConfigs`                     | Tidak | `Record<string, object>`         | Metadata konfigurasi kanal yang dimiliki manifes dan digabungkan ke permukaan penemuan dan validasi sebelum waktu jalan dimuat.                                                                                                     |
| `skills`                             | Tidak | `string[]`                       | Direktori Skills untuk dimuat, relatif terhadap root Plugin.                                                                                                                                                                        |
| `name`                               | Tidak | `string`                         | Nama Plugin yang mudah dibaca manusia.                                                                                                                                                                                              |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan Plugin.                                                                                                                                                                             |
| `version`                            | Tidak    | `string`                         | Versi Plugin untuk informasi.                                                                                                                                                                                                       |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk bidang konfigurasi.                                                                                                                                                          |

## Referensi metadata penyedia generasi

Bidang metadata penyedia generasi menjelaskan sinyal auth statis untuk
penyedia yang dideklarasikan dalam daftar `contracts.*GenerationProviders` yang sesuai.
OpenClaw membaca bidang-bidang ini sebelum runtime penyedia dimuat agar alat inti dapat
memutuskan apakah penyedia generasi tersedia tanpa mengimpor setiap
Plugin penyedia.

Gunakan bidang-bidang ini hanya untuk fakta deklaratif yang murah. Transport, transformasi
permintaan, penyegaran token, validasi kredensial, dan perilaku generasi aktual
tetap berada di runtime Plugin.

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

| Bidang          | Wajib | Tipe       | Artinya                                                                                                                               |
| --------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Tidak | `string[]` | Id penyedia tambahan yang harus dihitung sebagai alias auth statis untuk penyedia generasi.                                           |
| `authProviders` | Tidak | `string[]` | Id penyedia yang profil auth terkonfigurasinya harus dihitung sebagai auth untuk penyedia generasi ini.                               |
| `configSignals` | Tidak | `object[]` | Sinyal ketersediaan murah hanya-konfigurasi untuk penyedia lokal atau swakelola yang dapat dikonfigurasi tanpa profil auth atau env vars. |
| `authSignals`   | Tidak | `object[]` | Sinyal auth eksplisit. Jika ada, ini menggantikan kumpulan sinyal default dari id penyedia, `aliases`, dan `authProviders`.            |

Setiap entri `configSignals` mendukung:

| Bidang        | Wajib | Tipe       | Artinya                                                                                                                                                                            |
| ------------- | ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ya    | `string`   | Jalur titik ke objek konfigurasi milik Plugin yang akan diperiksa, misalnya `plugins.entries.example.config`.                                                                     |
| `overlayPath` | Tidak | `string`   | Jalur titik di dalam konfigurasi root yang objeknya harus menimpa objek root sebelum mengevaluasi sinyal. Gunakan ini untuk konfigurasi khusus kapabilitas seperti `image`, `video`, atau `music`. |
| `required`    | Tidak | `string[]` | Jalur titik di dalam konfigurasi efektif yang harus memiliki nilai terkonfigurasi. String harus tidak kosong; objek dan array tidak boleh kosong.                                  |
| `requiredAny` | Tidak | `string[]` | Jalur titik di dalam konfigurasi efektif tempat setidaknya satu harus memiliki nilai terkonfigurasi.                                                                               |
| `mode`        | Tidak | `object`   | Guard mode string opsional di dalam konfigurasi efektif. Gunakan ini ketika ketersediaan hanya-konfigurasi hanya berlaku untuk satu mode.                                          |

Setiap guard `mode` mendukung:

| Bidang        | Wajib | Tipe       | Artinya                                                                                  |
| ------------ | ----- | ---------- | ---------------------------------------------------------------------------------------- |
| `path`       | Tidak | `string`   | Jalur titik di dalam konfigurasi efektif. Default ke `mode`.                             |
| `default`    | Tidak | `string`   | Nilai mode yang digunakan ketika konfigurasi menghilangkan jalur tersebut.               |
| `allowed`    | Tidak | `string[]` | Jika ada, sinyal lolos hanya ketika mode efektif adalah salah satu dari nilai-nilai ini. |
| `disallowed` | Tidak | `string[]` | Jika ada, sinyal gagal ketika mode efektif adalah salah satu dari nilai-nilai ini.       |

Setiap entri `authSignals` mendukung:

| Bidang            | Wajib | Tipe     | Artinya                                                                                                                                                                  |
| ----------------- | ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ya    | `string` | Id penyedia yang akan diperiksa dalam profil auth terkonfigurasi.                                                                                                        |
| `providerBaseUrl` | Tidak | `object` | Guard opsional yang membuat sinyal dihitung hanya ketika penyedia terkonfigurasi yang dirujuk menggunakan URL dasar yang diizinkan. Gunakan ini ketika alias auth hanya valid untuk API tertentu. |

Setiap guard `providerBaseUrl` mendukung:

| Bidang            | Wajib | Tipe       | Artinya                                                                                                                                          |
| ----------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ya    | `string`   | Id konfigurasi penyedia yang `baseUrl`-nya harus diperiksa.                                                                                      |
| `defaultBaseUrl`  | Tidak | `string`   | URL dasar yang diasumsikan ketika konfigurasi penyedia menghilangkan `baseUrl`.                                                                  |
| `allowedBaseUrls` | Ya    | `string[]` | URL dasar yang diizinkan untuk sinyal auth ini. Sinyal diabaikan ketika URL dasar terkonfigurasi atau default tidak cocok dengan salah satu nilai ternormalisasi ini. |

## Referensi metadata alat

`toolMetadata` menggunakan bentuk `configSignals` dan `authSignals` yang sama seperti
metadata penyedia generasi, dengan kunci berupa nama alat. `contracts.tools` mendeklarasikan
kepemilikan. `toolMetadata` mendeklarasikan bukti ketersediaan murah agar OpenClaw dapat
menghindari mengimpor runtime Plugin hanya untuk membuat factory alatnya mengembalikan `null`.

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

Jika sebuah alat tidak memiliki `toolMetadata`, OpenClaw mempertahankan perilaku yang ada dan
memuat Plugin pemilik ketika kontrak alat cocok dengan kebijakan. Untuk alat jalur-panas
yang factory-nya bergantung pada auth/config, penulis Plugin harus mendeklarasikan
`toolMetadata` alih-alih membuat inti mengimpor runtime untuk bertanya.

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membaca ini sebelum runtime penyedia dimuat.
Daftar penyiapan penyedia menggunakan pilihan manifes ini, pilihan penyiapan turunan descriptor,
dan metadata katalog instal tanpa memuat runtime penyedia.

| Bidang                | Wajib | Tipe                                            | Artinya                                                                                              |
| --------------------- | ----- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `provider`            | Ya    | `string`                                        | Id penyedia tempat pilihan ini berada.                                                               |
| `method`              | Ya    | `string`                                        | Id metode auth untuk dikirim.                                                                        |
| `choiceId`            | Ya    | `string`                                        | Id pilihan auth stabil yang digunakan oleh alur onboarding dan CLI.                                  |
| `choiceLabel`         | Tidak | `string`                                        | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw kembali menggunakan `choiceId`.        |
| `choiceHint`          | Tidak | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                  |
| `assistantPriority`   | Tidak | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan asisten.       |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.              |
| `deprecatedChoiceIds` | Tidak | `string[]`                                      | Id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                            |
| `groupId`             | Tidak | `string`                                        | Id grup opsional untuk mengelompokkan pilihan terkait.                                               |
| `groupLabel`          | Tidak | `string`                                        | Label yang terlihat oleh pengguna untuk grup tersebut.                                               |
| `groupHint`           | Tidak | `string`                                        | Teks bantuan singkat untuk grup.                                                                     |
| `optionKey`           | Tidak | `string`                                        | Kunci opsi internal untuk alur auth sederhana satu-flag.                                             |
| `cliFlag`             | Tidak | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                       |
| `cliOption`           | Tidak | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Tidak | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                          |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, defaultnya adalah `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` ketika Plugin memiliki nama perintah runtime yang mungkin
keliru dimasukkan pengguna ke `plugins.allow` atau dicoba dijalankan sebagai perintah CLI root. OpenClaw
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

| Bidang       | Wajib | Jenis             | Artinya                                                                 |
| ------------ | ----- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ya    | `string`          | Nama perintah yang dimiliki Plugin ini.                                 |
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai perintah slash obrolan, bukan perintah CLI root. |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait untuk disarankan bagi operasi CLI, jika ada.  |

## referensi activation

Gunakan `activation` ketika Plugin dapat mendeklarasikan secara murah peristiwa bidang kontrol mana
yang harus menyertakannya dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata perencana, bukan API daur hidup. Blok ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode Plugin sudah dieksekusi. Perencana aktivasi menggunakan bidang-bidang ini untuk
mempersempit kandidat Plugin sebelum kembali ke metadata kepemilikan manifes yang ada
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook.

Pilih metadata tersempit yang sudah mendeskripsikan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
ketika bidang-bidang tersebut menyatakan hubungan itu. Gunakan `activation` untuk petunjuk perencana
tambahan yang tidak dapat direpresentasikan oleh bidang kepemilikan tersebut.
Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`,
`codex-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk
id harness agen tertanam yang belum memiliki bidang kepemilikan.

Blok ini hanya metadata. Blok ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/Plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan Plugin yang lebih luas, sehingga
metadata aktivasi non-startup yang hilang biasanya hanya berdampak pada performa; hal itu
tidak boleh mengubah kebenaran selama fallback kepemilikan manifes masih ada.

Setiap Plugin harus menetapkan `activation.onStartup` secara sengaja. Tetapkan ke `true`
hanya ketika Plugin harus berjalan selama startup Gateway. Tetapkan ke `false` ketika
Plugin tidak aktif saat startup dan harus dimuat hanya dari pemicu yang lebih sempit.
Menghilangkan `onStartup` tidak lagi memuat Plugin saat startup secara implisit; gunakan metadata
aktivasi eksplisit untuk startup, channel, konfigurasi, harness agen, memori, atau
pemicu aktivasi lain yang lebih sempit.

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

| Bidang             | Wajib | Jenis                                                | Artinya                                                                                                                                                                                        |
| ------------------ | ----- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Tidak | `boolean`                                            | Aktivasi startup Gateway eksplisit. Setiap Plugin harus menetapkan ini. `true` mengimpor Plugin selama startup; `false` membuatnya tetap lazy saat startup kecuali pemicu lain yang cocok memerlukan pemuatan. |
| `onProviders`      | Tidak | `string[]`                                           | Id penyedia yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                  |
| `onAgentHarnesses` | Tidak | `string[]`                                           | Id runtime harness agen tertanam yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                                |
| `onCommands`       | Tidak | `string[]`                                           | Id perintah yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                  |
| `onChannels`       | Tidak | `string[]`                                           | Id channel yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                   |
| `onRoutes`         | Tidak | `string[]`                                           | Jenis rute yang harus menyertakan Plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                   |
| `onConfigPaths`    | Tidak | `string[]`                                           | Jalur konfigurasi relatif terhadap root yang harus menyertakan Plugin ini dalam rencana startup/pemuatan ketika jalur tersebut ada dan tidak dinonaktifkan secara eksplisit.                    |
| `onCapabilities`   | Tidak | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan aktivasi bidang kontrol. Pilih bidang yang lebih sempit bila memungkinkan.                                                           |

Konsumen live saat ini:

- Perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit
- perencanaan CLI yang dipicu perintah kembali ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan startup runtime agen menggunakan `activation.onAgentHarnesses` untuk
  harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI
- perencanaan setup/channel yang dipicu channel kembali ke kepemilikan `channels[]`
  lama ketika metadata aktivasi channel eksplisit tidak ada
- perencanaan Plugin startup menggunakan `activation.onConfigPaths` untuk permukaan konfigurasi root
  non-channel seperti blok `browser` milik Plugin browser bawaan
- perencanaan setup/runtime yang dipicu penyedia kembali ke kepemilikan `providers[]`
  dan `cliBackends[]` tingkat atas lama ketika metadata aktivasi penyedia eksplisit
  tidak ada

Diagnostik perencana dapat membedakan petunjuk aktivasi eksplisit dari fallback
kepemilikan manifes. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
perencana menggunakan kepemilikan `commandAliases` sebagai gantinya. Label alasan ini ditujukan untuk
diagnostik host dan pengujian; penulis Plugin harus tetap mendeklarasikan metadata
yang paling baik mendeskripsikan kepemilikan.

## referensi qaRunners

Gunakan `qaRunners` ketika Plugin menyumbangkan satu atau beberapa runner transport di bawah
root bersama `openclaw qa`. Jaga metadata ini tetap ringan dan statis; runtime
Plugin tetap memiliki registrasi CLI aktual melalui permukaan
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
| `description` | Tidak | `string` | Teks bantuan fallback yang digunakan ketika host bersama membutuhkan perintah stub. |

## Referensi setup

Gunakan `setup` ketika permukaan penyiapan dan onboarding membutuhkan metadata
murah milik Plugin sebelum runtime dimuat.

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
CLI. `setup.cliBackends` adalah permukaan deskriptor khusus penyiapan untuk
alur control-plane/penyiapan yang harus tetap hanya metadata.

Ketika ada, `setup.providers` dan `setup.cliBackends` adalah permukaan pencarian
descriptor-first yang disukai untuk penemuan penyiapan. Jika deskriptor hanya
mempersempit kandidat Plugin dan penyiapan masih membutuhkan hook runtime waktu
penyiapan yang lebih kaya, tetapkan `requiresRuntime: true` dan pertahankan
`setup-api` sebagai jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam pencarian auth
penyedia generik dan env-var. `providerAuthEnvVars` tetap didukung melalui
adapter kompatibilitas selama jendela penghentian, tetapi Plugin non-bundel yang
masih menggunakannya menerima diagnostik manifes. Plugin baru harus menempatkan
metadata env penyiapan/status pada `setup.providers[].envVars`.

OpenClaw juga dapat menurunkan pilihan penyiapan sederhana dari
`setup.providers[].authMethods` ketika tidak ada entri penyiapan, atau ketika
`setup.requiresRuntime: false` menyatakan runtime penyiapan tidak diperlukan.
Entri eksplisit `providerAuthChoices` tetap lebih disukai untuk label kustom,
flag CLI, cakupan onboarding, dan metadata asisten.

Tetapkan `requiresRuntime: false` hanya ketika deskriptor tersebut cukup untuk
permukaan penyiapan. OpenClaw memperlakukan `false` eksplisit sebagai kontrak
hanya deskriptor dan tidak akan mengeksekusi `setup-api` atau
`openclaw.setupEntry` untuk pencarian penyiapan. Jika Plugin hanya deskriptor
tetap mengirim salah satu entri runtime penyiapan tersebut, OpenClaw melaporkan
diagnostik aditif dan terus mengabaikannya. `requiresRuntime` yang dihilangkan
mempertahankan perilaku fallback lama sehingga Plugin yang sudah ada yang
menambahkan deskriptor tanpa flag tersebut tidak rusak.

Karena pencarian penyiapan dapat mengeksekusi kode `setup-api` milik Plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap
unik di seluruh Plugin yang ditemukan. Kepemilikan yang ambigu gagal secara
tertutup alih-alih memilih pemenang dari urutan penemuan.

Ketika runtime penyiapan memang dieksekusi, diagnostik registry penyiapan
melaporkan drift deskriptor jika `setup-api` mendaftarkan penyedia atau backend
CLI yang tidak dideklarasikan oleh deskriptor manifes, atau jika suatu
deskriptor tidak memiliki registrasi runtime yang cocok. Diagnostik ini bersifat
aditif dan tidak menolak Plugin lama.

### Referensi setup.providers

| Bidang         | Wajib | Tipe       | Artinya                                                                                          |
| -------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ya    | `string`   | Id penyedia yang diekspos selama penyiapan atau onboarding. Jaga id yang dinormalisasi tetap unik secara global. |
| `authMethods`  | Tidak | `string[]` | Id metode penyiapan/auth yang didukung penyedia ini tanpa memuat runtime penuh.                  |
| `envVars`      | Tidak | `string[]` | Env vars yang dapat diperiksa oleh permukaan penyiapan/status generik sebelum runtime Plugin dimuat. |
| `authEvidence` | Tidak | `object[]` | Pemeriksaan bukti auth lokal yang murah untuk penyedia yang dapat mengautentikasi melalui penanda non-rahasia. |

`authEvidence` ditujukan untuk penanda kredensial lokal milik penyedia yang dapat
diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap murah dan lokal:
tanpa panggilan jaringan, tanpa pembacaan keychain atau secret manager, tanpa perintah shell, dan tanpa
probe API penyedia.

Entri bukti yang didukung:

| Bidang             | Wajib | Tipe       | Artinya                                                                                                             |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ya    | `string`   | Saat ini `local-file-with-env`.                                                                                     |
| `fileEnvVar`       | Tidak | `string`   | Variabel env yang berisi path file kredensial eksplisit.                                                            |
| `fallbackPaths`    | Tidak | `string[]` | Path file kredensial lokal yang diperiksa ketika `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak | `string[]` | Setidaknya satu variabel env yang tercantum harus tidak kosong sebelum bukti valid.                                 |
| `requiresAllEnv`   | Tidak | `string[]` | Setiap variabel env yang tercantum harus tidak kosong sebelum bukti valid.                                          |
| `credentialMarker` | Ya    | `string`   | Penanda non-rahasia yang dikembalikan ketika bukti ada.                                                            |
| `source`           | Tidak | `string`   | Label sumber yang terlihat pengguna untuk keluaran auth/status.                                                    |

### bidang setup

| Bidang             | Wajib | Tipe       | Artinya                                                                                                 |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Tidak | `object[]` | Deskriptor setup penyedia yang diekspos selama setup dan onboarding.                                    |
| `cliBackends`      | Tidak | `string[]` | ID backend waktu setup yang digunakan untuk lookup setup berbasis deskriptor. Jaga agar ID ternormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | ID migrasi config yang dimiliki oleh permukaan setup Plugin ini.                                        |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.                          |

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

| Bidang        | Tipe       | Artinya                                      |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Label bidang yang terlihat pengguna.         |
| `help`        | `string`   | Teks bantuan singkat.                        |
| `tags`        | `string[]` | Tag UI opsional.                             |
| `advanced`    | `boolean`  | Menandai bidang sebagai lanjutan.            |
| `sensitive`   | `boolean`  | Menandai bidang sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.       |

## referensi contracts

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat dibaca OpenClaw
tanpa mengimpor runtime Plugin.

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
| `embeddedExtensionFactories`     | `string[]` | ID factory extension app-server Codex, saat ini `codex-app-server`.   |
| `agentToolResultMiddleware`      | `string[]` | ID runtime tempat Plugin terbundel dapat mendaftarkan middleware hasil tool. |
| `externalAuthProviders`          | `string[]` | ID penyedia yang hook profil auth eksternalnya dimiliki Plugin ini.   |
| `speechProviders`                | `string[]` | ID penyedia speech yang dimiliki Plugin ini.                          |
| `realtimeTranscriptionProviders` | `string[]` | ID penyedia transkripsi realtime yang dimiliki Plugin ini.            |
| `realtimeVoiceProviders`         | `string[]` | ID penyedia suara realtime yang dimiliki Plugin ini.                  |
| `memoryEmbeddingProviders`       | `string[]` | ID penyedia embedding memori yang dimiliki Plugin ini.                |
| `mediaUnderstandingProviders`    | `string[]` | ID penyedia pemahaman media yang dimiliki Plugin ini.                 |
| `imageGenerationProviders`       | `string[]` | ID penyedia pembuatan gambar yang dimiliki Plugin ini.                |
| `videoGenerationProviders`       | `string[]` | ID penyedia pembuatan video yang dimiliki Plugin ini.                 |
| `webFetchProviders`              | `string[]` | ID penyedia web-fetch yang dimiliki Plugin ini.                       |
| `webSearchProviders`             | `string[]` | ID penyedia web-search yang dimiliki Plugin ini.                      |
| `migrationProviders`             | `string[]` | ID penyedia impor yang dimiliki Plugin ini untuk `openclaw migrate`.  |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki Plugin ini.                              |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory extension
khusus app-server Codex terbundel. Transformasi hasil tool terbundel sebaiknya
mendeklarasikan `contracts.agentToolResultMiddleware` dan mendaftar dengan
`api.registerAgentToolResultMiddleware(...)`. Plugin eksternal tidak dapat
mendaftarkan middleware hasil tool karena seam tersebut dapat menulis ulang keluaran tool
berkepercayaan tinggi sebelum model melihatnya.

Registrasi runtime `api.registerTool(...)` harus cocok dengan `contracts.tools`.
Penemuan tool menggunakan daftar ini untuk hanya memuat runtime Plugin yang dapat memiliki
tool yang diminta.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` sebaiknya mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi tersebut masih berjalan
melalui fallback kompatibilitas yang deprecated, tetapi fallback itu lebih lambat dan
akan dihapus setelah jendela migrasi.

Penyedia embedding memori terbundel sebaiknya mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap ID adapter yang diekspos, termasuk
adapter bawaan seperti `local`. Path CLI mandiri menggunakan kontrak manifest ini
untuk hanya memuat Plugin pemilik sebelum runtime Gateway penuh
mendaftarkan penyedia.

## referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` ketika penyedia pemahaman media memiliki
model default, prioritas fallback auto-auth, atau dukungan dokumen native yang
diperlukan helper core generik sebelum runtime dimuat. Key juga harus dideklarasikan di
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Kapabilitas media yang diekspos oleh penyedia ini.                           |
| `defaultModels`        | `Record<string, string>`            | Default capability-to-model yang digunakan ketika config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka lebih rendah diurutkan lebih awal untuk fallback penyedia otomatis berbasis kredensial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh penyedia.                            |

## referensi channelConfigs

Gunakan `channelConfigs` ketika Plugin channel memerlukan metadata config murah sebelum
runtime dimuat. Penemuan setup/status channel read-only dapat menggunakan metadata ini
secara langsung untuk channel eksternal yang terkonfigurasi ketika tidak ada entri setup,
atau ketika `setup.requiresRuntime: false` menyatakan runtime setup tidak diperlukan.

`channelConfigs` adalah metadata manifest Plugin, bukan bagian config pengguna top-level
baru. Pengguna tetap mengonfigurasi instance channel di bawah `channels.<channel-id>`.
OpenClaw membaca metadata manifest untuk memutuskan Plugin mana yang memiliki channel
terkonfigurasi itu sebelum kode runtime Plugin dieksekusi.

Untuk Plugin channel, `configSchema` dan `channelConfigs` menjelaskan path yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin non-terbundel yang mendeklarasikan `channels[]` sebaiknya juga mendeklarasikan entri
`channelConfigs` yang cocok. Tanpa entri tersebut, OpenClaw masih dapat memuat Plugin, tetapi
skema config cold-path, setup, dan permukaan Control UI tidak dapat mengetahui
bentuk opsi milik channel sampai runtime Plugin dieksekusi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan
`nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk pemeriksaan config perintah
yang berjalan sebelum runtime channel dimuat. Channel terbundel juga dapat memublikasikan
default yang sama melalui `package.json#openclaw.channel.commands` bersama
metadata katalog channel milik paket lainnya.

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

Setiap entri channel dapat mencakup:

| Bidang        | Tipe                     | Artinya                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Skema JSON untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi saluran yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label/placeholder/petunjuk sensitif UI opsional untuk bagian konfigurasi saluran tersebut. |
| `label`       | `string`                 | Label saluran yang digabungkan ke permukaan pemilih dan inspeksi saat metadata waktu eksekusi belum siap. |
| `description` | `string`                 | Deskripsi singkat saluran untuk permukaan inspeksi dan katalog.                           |
| `commands`    | `object`                 | Perintah native statis dan default otomatis skill native untuk pemeriksaan konfigurasi pra-waktu-eksekusi. |
| `preferOver`  | `string[]`               | Id Plugin lama atau berprioritas lebih rendah yang seharusnya dikalahkan saluran ini di permukaan pemilihan. |

### Mengganti Plugin saluran lain

Gunakan `preferOver` saat Plugin Anda adalah pemilik yang lebih disukai untuk id saluran yang
juga dapat disediakan oleh Plugin lain. Kasus umumnya adalah id Plugin yang diganti nama, Plugin
mandiri yang menggantikan Plugin bawaan, atau fork yang dipelihara yang
mempertahankan id saluran yang sama demi kompatibilitas konfigurasi.

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
id Plugin yang lebih disukai. Jika Plugin berprioritas lebih rendah hanya dipilih karena
Plugin itu bawaan atau diaktifkan secara default, OpenClaw menonaktifkannya dalam
konfigurasi waktu eksekusi efektif agar satu Plugin memiliki saluran beserta alatnya. Pemilihan
pengguna yang eksplisit tetap menang: jika pengguna secara eksplisit mengaktifkan kedua Plugin, OpenClaw
mempertahankan pilihan tersebut dan melaporkan diagnostik saluran/alat duplikat alih-alih
mengubah kumpulan Plugin yang diminta secara diam-diam.

Jaga agar `preferOver` tetap terbatas pada id Plugin yang benar-benar dapat menyediakan saluran yang sama.
Ini bukan bidang prioritas umum dan tidak mengganti nama kunci konfigurasi pengguna.

## Referensi modelSupport

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan Plugin penyedia Anda dari
id model singkat seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum waktu eksekusi Plugin
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

- referensi `provider/model` eksplisit menggunakan metadata manifes `providers` milik pemiliknya
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu Plugin non-bawaan dan satu Plugin bawaan sama-sama cocok, Plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan penyedia

Bidang:

| Bidang          | Tipe       | Artinya                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model singkat.          |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model singkat setelah penghapusan sufiks profil. |

## Referensi modelCatalog

Gunakan `modelCatalog` saat OpenClaw harus mengetahui metadata model penyedia sebelum
memuat waktu eksekusi Plugin. Ini adalah sumber milik manifes untuk baris katalog
tetap, alias penyedia, aturan supresi, dan mode penemuan. Penyegaran waktu eksekusi
tetap menjadi bagian kode waktu eksekusi penyedia, tetapi manifes memberi tahu inti kapan waktu eksekusi
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

| Bidang         | Tipe                                                     | Artinya                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki Plugin ini. Kunci juga sebaiknya muncul di `providers` tingkat atas. |
| `aliases`      | `Record<string, object>`                                 | Alias penyedia yang seharusnya diselesaikan ke penyedia milik sendiri untuk perencanaan katalog atau supresi. |
| `suppressions` | `object[]`                                               | Baris model dari sumber lain yang disupresi Plugin ini karena alasan khusus penyedia.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, disegarkan ke cache, atau memerlukan waktu eksekusi. |

`aliases` berpartisipasi dalam pencarian kepemilikan penyedia untuk perencanaan katalog model.
Target alias harus merupakan penyedia tingkat atas yang dimiliki oleh Plugin yang sama. Saat daftar
yang difilter berdasarkan penyedia menggunakan alias, OpenClaw dapat membaca manifes pemilik dan
menerapkan override API/URL dasar alias tanpa memuat waktu eksekusi penyedia.
Alias tidak memperluas daftar katalog yang tidak difilter; daftar luas hanya memancarkan baris
penyedia kanonis milik pemiliknya.

`suppressions` menggantikan hook `suppressBuiltInModel` waktu eksekusi penyedia lama.
Entri supresi hanya dihormati saat penyedia dimiliki oleh Plugin atau
dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia milik sendiri. Hook
supresi waktu eksekusi tidak lagi dipanggil selama resolusi model.

Bidang penyedia:

| Bidang    | Tipe                     | Artinya                                                            |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | URL dasar default opsional untuk model dalam katalog penyedia ini. |
| `api`     | `ModelApi`               | Adapter API default opsional untuk model dalam katalog penyedia ini. |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.    |
| `models`  | `object[]`               | Baris model wajib. Baris tanpa `id` diabaikan.                     |

Bidang model:

| Bidang          | Tipe                                                           | Artinya                                                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id model lokal penyedia, tanpa prefiks `provider/`.                          |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                       |
| `api`           | `ModelApi`                                                     | Override API opsional per model.                                              |
| `baseUrl`       | `string`                                                       | Override URL dasar opsional per model.                                        |
| `headers`       | `Record<string, string>`                                       | Header statis opsional per model.                                             |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitas yang diterima model.                                                |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku penalaran.                                   |
| `contextWindow` | `number`                                                       | Jendela konteks native penyedia.                                              |
| `contextTokens` | `number`                                                       | Batas konteks waktu eksekusi efektif opsional saat berbeda dari `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token keluaran maksimum saat diketahui.                                       |
| `cost`          | `object`                                                       | Harga USD opsional per juta token, termasuk `tieredPricing` opsional.         |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas konfigurasi model OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status daftar. Supresi hanya saat baris sama sekali tidak boleh muncul.       |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan dengan status non-tersedia.                  |
| `replaces`      | `string[]`                                                     | Id model lokal penyedia lama yang digantikan model ini.                       |
| `replacedBy`    | `string`                                                       | Id model lokal penyedia pengganti untuk baris yang usang.                     |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh pemilih dan filter.                            |

Bidang supresi:

| Bidang                    | Tipe       | Artinya                                                                                              |
| ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `provider`                | `string`   | Id penyedia untuk baris upstream yang akan disupresi. Harus dimiliki Plugin ini atau dideklarasikan sebagai alias milik sendiri. |
| `model`                   | `string`   | Id model lokal penyedia yang akan disupresi.                                                         |
| `reason`                  | `string`   | Pesan opsional yang ditampilkan saat baris yang disupresi diminta secara langsung.                   |
| `when.baseUrlHosts`       | `string[]` | Daftar opsional host URL dasar penyedia efektif yang diperlukan sebelum supresi berlaku.              |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi penyedia persis yang diperlukan sebelum supresi berlaku.      |

Jangan letakkan data khusus runtime di `modelCatalog`. Gunakan `static` hanya ketika
baris manifes sudah cukup lengkap agar daftar yang difilter berdasarkan penyedia dan
permukaan pemilih dapat melewati penemuan registry/runtime. Gunakan `refreshable` ketika
baris manifes berguna sebagai seed atau pelengkap yang dapat dicantumkan, tetapi
refresh/cache dapat menambahkan lebih banyak baris nanti; baris refreshable tidak
otoritatif dengan sendirinya. Gunakan `runtime` ketika OpenClaw harus memuat runtime
penyedia untuk mengetahui daftarnya.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan model-id milik penyedia yang murah dan
harus terjadi sebelum runtime penyedia dimuat. Ini menjaga alias seperti nama model
pendek, id lama lokal penyedia, dan aturan prefiks proxy di manifes plugin pemilik,
bukan di tabel pemilihan model inti.

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

| Bidang                               | Tipe                    | Artinya                                                                                   |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias model-id persis yang tidak peka huruf besar/kecil. Nilai dikembalikan apa adanya.   |
| `stripPrefixes`                      | `string[]`              | Prefiks yang dihapus sebelum pencarian alias, berguna untuk duplikasi penyedia/model lama. |
| `prefixWhenBare`                     | `string`                | Prefiks yang ditambahkan ketika id model yang dinormalisasi belum berisi `/`.             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan prefiks bare-id bersyarat setelah pencarian alias, dikunci oleh `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi endpoint yang harus diketahui kebijakan
permintaan generik sebelum runtime penyedia dimuat. Inti tetap memiliki makna setiap
`endpointClass`; manifes plugin memiliki metadata host dan URL dasar.

Bidang endpoint:

| Bidang                         | Tipe       | Artinya                                                                                     |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint inti yang dikenal, seperti `openrouter`, `moonshot-native`, atau `google-vertex`. |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                          |
| `hostSuffixes`                 | `string[]` | Sufiks host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus sufiks domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi persis yang dipetakan ke kelas endpoint.                   |
| `googleVertexRegion`           | `string`   | Region Google Vertex statis untuk host global persis.                                       |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks yang dihapus dari host yang cocok untuk mengekspos prefiks region Google Vertex.     |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan yang murah yang
dibutuhkan kebijakan permintaan generik tanpa memuat runtime penyedia. Simpan
penulisan ulang payload khusus perilaku di hook runtime penyedia atau helper bersama
keluarga penyedia.

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

| Bidang                | Tipe         | Artinya                                                                                |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label keluarga penyedia yang digunakan oleh keputusan dan diagnostik kompatibilitas permintaan generik. |
| `compatibilityFamily` | `"moonshot"` | Bucket kompatibilitas keluarga penyedia opsional untuk helper permintaan bersama.      |
| `openAICompletions`   | `object`     | Flag permintaan completions yang kompatibel dengan OpenAI, saat ini `supportsStreamingUsage`. |

## Referensi modelPricing

Gunakan `modelPricing` ketika penyedia membutuhkan perilaku harga control-plane sebelum
runtime dimuat. Cache harga Gateway membaca metadata ini tanpa mengimpor kode runtime
penyedia.

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

| Bidang       | Tipe              | Artinya                                                                                         |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Atur `false` untuk penyedia lokal/self-hosted yang tidak boleh pernah mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan lookup harga OpenRouter. `false` menonaktifkan lookup OpenRouter untuk penyedia ini.   |
| `liteLLM`    | `false \| object` | Pemetaan lookup harga LiteLLM. `false` menonaktifkan lookup LiteLLM untuk penyedia ini.         |

Bidang sumber:

| Bidang                     | Tipe               | Artinya                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id penyedia katalog eksternal ketika berbeda dari id penyedia OpenClaw, misalnya `z-ai` untuk penyedia `zai`. |
| `passthroughProviderModel` | `boolean`          | Perlakukan id model yang berisi slash sebagai referensi penyedia/model bersarang, berguna untuk penyedia proxy seperti OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Varian model-id katalog eksternal tambahan. `version-dots` mencoba id versi bertitik seperti `claude-opus-4.6`. |

### Indeks Penyedia OpenClaw

Indeks Penyedia OpenClaw adalah metadata pratinjau milik OpenClaw untuk penyedia
yang pluginnya mungkin belum terinstal. Ini bukan bagian dari manifes plugin.
Manifes plugin tetap menjadi otoritas plugin terinstal. Indeks Penyedia adalah
kontrak fallback internal yang akan dikonsumsi permukaan pemilih model
installable-provider dan pra-instal di masa depan ketika plugin penyedia belum
terinstal.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. Manifes plugin terinstal `modelCatalog`.
3. Cache katalog model dari refresh eksplisit.
4. Baris pratinjau Indeks Penyedia OpenClaw.

Indeks Penyedia tidak boleh berisi secret, status aktif, hook runtime, atau
data model khusus akun live. Katalog pratinjaunya menggunakan bentuk baris
penyedia `modelCatalog` yang sama seperti manifes plugin, tetapi harus tetap
dibatasi pada metadata tampilan yang stabil kecuali bidang adaptor runtime
seperti `api`, `baseUrl`, harga, atau flag kompatibilitas sengaja dijaga
selaras dengan manifes plugin terinstal. Penyedia dengan penemuan live `/models`
harus menulis baris yang di-refresh melalui jalur cache katalog model eksplisit,
bukan membuat listing normal atau onboarding memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata plugin yang dapat diinstal
untuk penyedia yang pluginnya telah dipindahkan keluar dari inti atau belum
terinstal. Metadata ini mencerminkan pola katalog channel: nama paket, spesifikasi
instal npm, integritas yang diharapkan, dan label pilihan auth yang murah sudah
cukup untuk menampilkan opsi penyiapan yang dapat diinstal. Setelah plugin
terinstal, manifesnya menang dan entri Indeks Penyedia diabaikan untuk penyedia
tersebut.

Kunci kapabilitas tingkat atas legacy sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifes normal tidak lagi memperlakukan bidang tingkat atas tersebut sebagai
kepemilikan kapabilitas.

## Manifes versus package.json

Kedua file menjalankan tugas yang berbeda:

| File                   | Gunakan untuk                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Penemuan, validasi konfigurasi, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode plugin berjalan              |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, penyiapan, atau metadata katalog |

Jika Anda tidak yakin di mana suatu metadata harus ditempatkan, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu tentang packaging, file entry, atau perilaku instal npm, letakkan di `package.json`

### Bidang package.json yang memengaruhi penemuan

Sebagian metadata plugin pra-runtime sengaja berada di `package.json` di bawah blok
`openclaw`, bukan `openclaw.plugin.json`.
`openclaw.bundle` dan `openclaw.bundle.json` bukan kontrak plugin OpenClaw;
plugin native harus menggunakan `openclaw.plugin.json` ditambah bidang
`package.json#openclaw` yang didukung di bawah ini.

Contoh penting:

| Bidang                                                                                     | Artinya                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Mendeklarasikan titik masuk Plugin native. Harus tetap berada di dalam direktori paket Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                                               | Mendeklarasikan titik masuk runtime JavaScript bawaan untuk paket terpasang. Harus tetap berada di dalam direktori paket Plugin.                                                    |
| `openclaw.setupEntry`                                                                      | Titik masuk ringan khusus penyiapan yang digunakan selama orientasi awal, penundaan startup saluran, dan penemuan status saluran/SecretRef hanya-baca. Harus tetap berada di dalam direktori paket Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Mendeklarasikan titik masuk penyiapan JavaScript bawaan untuk paket terpasang. Memerlukan `setupEntry`, harus ada, dan harus tetap berada di dalam direktori paket Plugin.          |
| `openclaw.channel`                                                                         | Metadata katalog saluran yang murah seperti label, jalur dokumen, alias, dan salinan pilihan.                                                                                       |
| `openclaw.channel.commands`                                                                | Metadata default otomatis perintah native statis dan skill native yang digunakan oleh permukaan konfigurasi, audit, dan daftar perintah sebelum runtime saluran dimuat.             |
| `openclaw.channel.configuredState`                                                         | Metadata pemeriksa status-terkonfigurasi ringan yang dapat menjawab "apakah penyiapan khusus env sudah ada?" tanpa memuat runtime saluran penuh.                                    |
| `openclaw.channel.persistedAuthState`                                                      | Metadata pemeriksa autentikasi tersimpan ringan yang dapat menjawab "apakah ada yang sudah masuk?" tanpa memuat runtime saluran penuh.                                              |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Petunjuk instalasi/pembaruan untuk Plugin bawaan dan Plugin yang dipublikasikan secara eksternal.                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Jalur instalasi yang disukai ketika beberapa sumber instalasi tersedia.                                                                                                             |
| `openclaw.install.minHostVersion`                                                          | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22` atau `>=2026.5.1-beta.1`.                                                          |
| `openclaw.install.expectedIntegrity`                                                       | String integritas dist npm yang diharapkan seperti `sha512-...`; alur instalasi dan pembaruan memverifikasi artefak yang diambil terhadap nilai ini.                                |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Mengizinkan jalur pemulihan instalasi ulang Plugin bawaan yang sempit ketika konfigurasi tidak valid.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Memungkinkan permukaan saluran khusus penyiapan dimuat sebelum Plugin saluran penuh selama startup.                                                                                 |

Metadata manifes menentukan pilihan penyedia/saluran/penyiapan mana yang muncul dalam
orientasi awal sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
orientasi awal cara mengambil atau mengaktifkan Plugin tersebut ketika pengguna memilih salah satu
pilihan itu. Jangan pindahkan petunjuk instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan
registri manifes untuk sumber Plugin non-bawaan. Nilai tidak valid ditolak;
nilai yang lebih baru tetapi valid melewati Plugin eksternal pada host lama. Sumber
Plugin bawaan dianggap memiliki versi yang sama dengan checkout host.

Metadata instalasi-saat-diperlukan resmi sebaiknya menggunakan `clawhubSpec` ketika Plugin
dipublikasikan di ClawHub; orientasi awal memperlakukannya sebagai sumber jarak jauh yang disukai dan
mencatat fakta artefak ClawHub setelah instalasi. `npmSpec` tetap menjadi fallback
kompatibilitas untuk paket yang belum berpindah ke ClawHub.

Penyematan versi npm persis sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
sebaiknya memasangkan spec persis dengan `expectedIntegrity` agar alur pembaruan gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang disematkan.
Orientasi awal interaktif masih menawarkan spec npm registri tepercaya, termasuk nama
paket polos dan dist-tag, untuk kompatibilitas. Diagnostik katalog dapat
membedakan sumber persis, mengambang, disematkan-integritas, integritas-hilang, ketidakcocokan nama paket,
dan pilihan-default tidak valid. Diagnostik juga memperingatkan ketika
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat disematkan olehnya.
Ketika `expectedIntegrity` ada,
alur instalasi/pembaruan memberlakukannya; ketika dihilangkan, resolusi registri
dicatat tanpa pin integritas.

Plugin saluran sebaiknya menyediakan `openclaw.setupEntry` ketika status, daftar saluran,
atau pemindaian SecretRef perlu mengidentifikasi akun terkonfigurasi tanpa memuat runtime
penuh. Entri penyiapan sebaiknya mengekspos metadata saluran serta adapter konfigurasi,
status, dan rahasia yang aman untuk penyiapan; simpan klien jaringan, listener Gateway, dan
runtime transportasi di titik masuk ekstensi utama.

Bidang titik masuk runtime tidak menimpa pemeriksaan batas paket untuk bidang
titik masuk sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat jalur
`openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja sempit. Ini tidak
membuat konfigurasi rusak sembarang menjadi dapat diinstal. Saat ini fitur ini hanya mengizinkan alur instalasi
pulih dari kegagalan peningkatan Plugin bawaan yang kedaluwarsa tertentu, seperti jalur
Plugin bawaan yang hilang atau entri `channels.<id>` kedaluwarsa untuk Plugin
bawaan yang sama. Kesalahan konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
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

Gunakan ini ketika alur penyiapan, doctor, status, atau keberadaan hanya-baca memerlukan probe
autentikasi ya/tidak yang murah sebelum Plugin saluran penuh dimuat. Status autentikasi tersimpan bukan
status saluran terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan Plugin secara otomatis,
memperbaiki dependensi runtime, atau memutuskan apakah runtime saluran harus dimuat.
Ekspor target sebaiknya berupa fungsi kecil yang hanya membaca status tersimpan; jangan
rutekan melalui barrel runtime saluran penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan terkonfigurasi
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

Gunakan ini ketika saluran dapat menjawab status-terkonfigurasi dari env atau masukan
non-runtime kecil lainnya. Jika pemeriksaan memerlukan resolusi konfigurasi penuh atau runtime
saluran nyata, pertahankan logika tersebut di hook `config.hasConfiguredState`
Plugin sebagai gantinya.

## Prioritas penemuan (id Plugin duplikat)

OpenClaw menemukan Plugin dari beberapa root (bawaan, instalasi global, workspace, jalur yang dipilih konfigurasi secara eksplisit). Jika dua penemuan memiliki `id` yang sama, hanya manifes dengan **prioritas tertinggi** yang dipertahankan; duplikat berprioritas lebih rendah dibuang, bukan dimuat berdampingan dengannya.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih konfigurasi** — jalur yang disematkan secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — Plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — Plugin yang diinstal ke root Plugin global OpenClaw
4. **Workspace** — Plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau kedaluwarsa dari Plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar menimpa Plugin bawaan dengan Plugin lokal, sematkan melalui `plugins.entries.<id>` agar menang berdasarkan prioritas, bukan mengandalkan penemuan workspace.
- Pembuangan duplikat dicatat sehingga diagnostik Doctor dan startup dapat menunjuk ke salinan yang dibuang.
- Penimpaan duplikat yang dipilih konfigurasi dirumuskan sebagai penimpaan eksplisit dalam diagnostik, tetapi tetap memperingatkan agar fork kedaluwarsa dan bayangan tidak disengaja tetap terlihat.

## Persyaratan JSON Schema

- **Setiap Plugin harus mengirimkan JSON Schema**, meskipun tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi pada waktu baca/tulis konfigurasi, bukan pada runtime.
- Saat memperluas atau melakukan fork Plugin bawaan dengan kunci konfigurasi baru, perbarui `configSchema` `openclaw.plugin.json` Plugin tersebut pada saat yang sama. Skema Plugin bawaan bersifat ketat, sehingga menambahkan `plugins.entries.<id>.config.myNewKey` di konfigurasi pengguna tanpa menambahkan `myNewKey` ke `configSchema.properties` akan ditolak sebelum runtime Plugin dimuat.

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

- Kunci `channels.*` yang tidak dikenal adalah **kesalahan**, kecuali id saluran dideklarasikan oleh
  manifes Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan id Plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **kesalahan**.
- Jika Plugin terinstal tetapi memiliki manifes atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan kesalahan Plugin.
- Jika konfigurasi Plugin ada tetapi Plugin **dinonaktifkan**, konfigurasi dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema lengkap `plugins.*`.

## Catatan

- Manifes **wajib untuk Plugin OpenClaw native**, termasuk pemuatan sistem file lokal. Runtime tetap memuat modul Plugin secara terpisah; manifes hanya untuk penemuan + validasi.
- Manifes native diurai dengan JSON5, sehingga komentar, koma akhir, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya kolom manifes yang terdokumentasi yang dibaca oleh pemuat manifes. Hindari kunci tingkat atas kustom.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan ketika sebuah Plugin tidak membutuhkannya.
- `providerDiscoveryEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog provider statis atau deskriptor penemuan yang sempit, bukan eksekusi saat permintaan.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Deklarasikan jenis Plugin eksklusif dalam manifes ini. `OpenClawPluginDefinition.kind` pada entri runtime sudah tidak digunakan lagi dan tetap ada hanya sebagai fallback kompatibilitas untuk Plugin lama.
- Metadata variabel env (`setup.providers[].envVars`, `providerAuthEnvVars` yang sudah tidak digunakan lagi, dan `channelEnvVars`) hanya deklaratif. Status, audit, validasi pengiriman cron, dan permukaan baca-saja lainnya tetap menerapkan kepercayaan Plugin dan kebijakan aktivasi efektif sebelum memperlakukan variabel env sebagai terkonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode provider, lihat [hook runtime Provider](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist package-manager apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
