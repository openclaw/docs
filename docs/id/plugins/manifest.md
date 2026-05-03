---
read_when:
    - Anda sedang membuat Plugin OpenClaw
    - Anda perlu mengirimkan skema konfigurasi Plugin atau men-debug kesalahan validasi Plugin
summary: Manifes Plugin + persyaratan skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini hanya untuk **manifes Plugin native OpenClaw**.  

Untuk tata letak bundel yang kompatibel, lihat [Bundel Plugin](/id/plugins/bundles).

Format bundel yang kompatibel menggunakan file manifes yang berbeda:

- Bundel Codex: `.codex-plugin/plugin.json`
- Bundel Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude default
  tanpa manifes
- Bundel Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga otomatis mendeteksi tata letak bundel tersebut, tetapi tata letak itu tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundel yang kompatibel, OpenClaw saat ini membaca metadata bundel beserta root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundel Claude,
default LSP bundel Claude, dan paket hook yang didukung ketika tata letaknya sesuai dengan
ekspektasi runtime OpenClaw.

Setiap Plugin native OpenClaw **harus** menyertakan file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifes ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifes yang hilang atau tidak valid diperlakukan sebagai
kesalahan Plugin dan memblokir validasi konfigurasi.

Lihat panduan sistem Plugin lengkap: [Plugin](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Apa yang dilakukan file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat
kode Plugin Anda**. Semua hal di bawah ini harus cukup ringan untuk diperiksa tanpa menjalankan
runtime Plugin.

**Gunakan untuk:**

- identitas Plugin, validasi konfigurasi, dan petunjuk UI konfigurasi
- metadata auth, onboarding, dan penyiapan (alias, pengaktifan otomatis, variabel env provider, pilihan auth)
- petunjuk aktivasi untuk surface control-plane
- kepemilikan keluarga model singkat
- snapshot kepemilikan kapabilitas statis (`contracts`)
- metadata runner QA yang dapat diperiksa host bersama `openclaw qa`
- metadata konfigurasi khusus channel yang digabungkan ke surface katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan entrypoint kode,
atau metadata instalasi npm. Hal tersebut berada di kode Plugin Anda dan `package.json`.

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

| Bidang                               | Wajib | Tipe                             | Artinya                                                                                                                                                                                                                             |
| ------------------------------------ | ----- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya    | `string`                         | ID Plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                                          |
| `configSchema`                       | Ya    | `object`                         | JSON Schema inline untuk konfigurasi Plugin ini.                                                                                                                                                                                    |
| `enabledByDefault`                   | Tidak | `true`                           | Menandai Plugin bawaan sebagai diaktifkan secara default. Abaikan, atau tetapkan nilai non-`true` apa pun, agar Plugin tetap dinonaktifkan secara default.                                                                          |
| `enabledByDefaultOnPlatforms`        | Tidak | `string[]`                       | Menandai Plugin bawaan sebagai diaktifkan secara default hanya pada platform Node.js yang tercantum, misalnya `["darwin"]`. Konfigurasi eksplisit tetap menang.                                                                     |
| `legacyPluginIds`                    | Tidak | `string[]`                       | ID lama yang dinormalisasi ke ID Plugin kanonis ini.                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Tidak | `string[]`                       | ID penyedia yang harus mengaktifkan Plugin ini secara otomatis ketika autentikasi, konfigurasi, atau referensi model menyebutkannya.                                                                                                |
| `kind`                               | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Tidak | `string[]`                       | ID saluran yang dimiliki oleh Plugin ini. Digunakan untuk penemuan dan validasi konfigurasi.                                                                                                                                        |
| `providers`                          | Tidak | `string[]`                       | ID penyedia yang dimiliki oleh Plugin ini.                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | Tidak | `string`                         | Jalur modul penemuan penyedia ringan, relatif terhadap root Plugin, untuk metadata katalog penyedia dalam cakupan manifes yang dapat dimuat tanpa mengaktifkan runtime Plugin penuh.                                               |
| `modelSupport`                       | Tidak | `object`                         | Metadata ringkas keluarga model milik manifes yang digunakan untuk memuat Plugin secara otomatis sebelum runtime.                                                                                                                   |
| `modelCatalog`                       | Tidak | `object`                         | Metadata katalog model deklaratif untuk penyedia yang dimiliki oleh Plugin ini. Ini adalah kontrak control-plane untuk daftar baca-saja mendatang, onboarding, pemilih model, alias, dan supresi tanpa memuat runtime Plugin.      |
| `modelPricing`                       | Tidak | `object`                         | Kebijakan pencarian harga eksternal milik penyedia. Gunakan ini untuk mengecualikan penyedia lokal/self-hosted dari katalog harga jarak jauh atau memetakan referensi penyedia ke ID katalog OpenRouter/LiteLLM tanpa meng-hardcode ID penyedia di core. |
| `modelIdNormalization`               | Tidak | `object`                         | Pembersihan alias/prefiks ID model milik penyedia yang harus berjalan sebelum runtime penyedia dimuat.                                                                                                                              |
| `providerEndpoints`                  | Tidak | `object[]`                       | Metadata host/baseUrl endpoint milik manifes untuk rute penyedia yang harus diklasifikasikan core sebelum runtime penyedia dimuat.                                                                                                  |
| `providerRequest`                    | Tidak | `object`                         | Metadata murah keluarga penyedia dan kompatibilitas permintaan yang digunakan oleh kebijakan permintaan generik sebelum runtime penyedia dimuat.                                                                                    |
| `cliBackends`                        | Tidak | `string[]`                       | ID backend inferensi CLI yang dimiliki oleh Plugin ini. Digunakan untuk aktivasi otomatis saat startup dari referensi konfigurasi eksplisit.                                                                                        |
| `syntheticAuthRefs`                  | Tidak | `string[]`                       | Referensi penyedia atau backend CLI yang hook autentikasi sintetis milik Plugin-nya harus diperiksa selama penemuan model dingin sebelum runtime dimuat.                                                                            |
| `nonSecretAuthMarkers`               | Tidak | `string[]`                       | Nilai placeholder API key milik Plugin bawaan yang merepresentasikan status kredensial lokal non-rahasia, OAuth, atau ambient.                                                                                                      |
| `commandAliases`                     | Tidak | `object[]`                       | Nama perintah yang dimiliki oleh Plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI yang sadar Plugin sebelum runtime dimuat.                                                                                        |
| `providerAuthEnvVars`                | Tidak | `Record<string, string[]>`       | Metadata env kompatibilitas yang tidak digunakan lagi untuk pencarian autentikasi/status penyedia. Lebih disarankan `setup.providers[].envVars` untuk Plugin baru; OpenClaw masih membaca ini selama jendela deprekasi.             |
| `providerAuthAliases`                | Tidak | `Record<string, string>`         | ID penyedia yang harus menggunakan kembali ID penyedia lain untuk pencarian autentikasi, misalnya penyedia coding yang berbagi API key dan profil autentikasi penyedia dasar.                                                       |
| `channelEnvVars`                     | Tidak | `Record<string, string[]>`       | Metadata env saluran murah yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk setup saluran berbasis env atau permukaan autentikasi yang harus terlihat oleh helper startup/konfigurasi generik.             |
| `providerAuthChoices`                | Tidak | `object[]`                       | Metadata pilihan autentikasi murah untuk pemilih onboarding, resolusi penyedia pilihan, dan wiring flag CLI sederhana.                                                                                                             |
| `activation`                         | Tidak | `object`                         | Metadata perencana aktivasi murah untuk pemuatan yang dipicu startup, penyedia, perintah, saluran, rute, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku aktual.                                           |
| `setup`                              | Tidak | `object`                         | Deskriptor setup/onboarding murah yang dapat diperiksa permukaan penemuan dan setup tanpa memuat runtime Plugin.                                                                                                                   |
| `qaRunners`                          | Tidak | `object[]`                       | Deskriptor runner QA murah yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                           |
| `contracts`                          | Tidak | `object`                         | Snapshot kepemilikan kapabilitas statis untuk hook autentikasi eksternal, ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, pengambilan web, pencarian web, dan kepemilikan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak | `Record<string, object>`         | Default pemahaman media murah untuk ID penyedia yang dideklarasikan di `contracts.mediaUnderstandingProviders`.                                                                                                                     |
| `imageGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan gambar murah untuk ID penyedia yang dideklarasikan di `contracts.imageGenerationProviders`, termasuk alias autentikasi milik penyedia dan guard base-url.                                          |
| `videoGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan video murah untuk ID penyedia yang dideklarasikan di `contracts.videoGenerationProviders`, termasuk alias autentikasi milik penyedia dan guard base-url.                                           |
| `musicGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan musik murah untuk ID penyedia yang dideklarasikan di `contracts.musicGenerationProviders`, termasuk alias autentikasi milik penyedia dan guard base-url.                                           |
| `toolMetadata`                       | Tidak | `Record<string, object>`         | Metadata ketersediaan murah untuk tool milik Plugin yang dideklarasikan di `contracts.tools`. Gunakan ini ketika tool tidak boleh memuat runtime kecuali ada bukti konfigurasi, env, atau autentikasi.                             |
| `channelConfigs`                     | Tidak | `Record<string, object>`         | Metadata konfigurasi saluran milik manifes yang digabungkan ke permukaan penemuan dan validasi sebelum runtime dimuat.                                                                                                             |
| `skills`                             | Tidak | `string[]`                       | Direktori Skill yang akan dimuat, relatif terhadap root Plugin.                                                                                                                                                                     |
| `name`                               | Tidak    | `string`                         | Nama Plugin yang dapat dibaca manusia.                                                                                                                                                                                             |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan Plugin.                                                                                                                                                                            |
| `version`                            | Tidak    | `string`                         | Versi Plugin informatif.                                                                                                                                                                                                            |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk kolom konfigurasi.                                                                                                                                                          |

## Referensi metadata penyedia pembuatan

Kolom metadata penyedia pembuatan menjelaskan sinyal autentikasi statis untuk
penyedia yang dideklarasikan dalam daftar `contracts.*GenerationProviders` yang cocok.
OpenClaw membaca kolom-kolom ini sebelum runtime penyedia dimuat sehingga alat inti dapat
memutuskan apakah penyedia pembuatan tersedia tanpa mengimpor setiap
plugin penyedia.

Gunakan kolom-kolom ini hanya untuk fakta deklaratif yang murah. Transport, transformasi
permintaan, penyegaran token, validasi kredensial, dan perilaku pembuatan yang sebenarnya
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

| Kolom           | Wajib | Tipe       | Artinya                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Tidak       | `string[]` | Id penyedia tambahan yang harus dihitung sebagai alias autentikasi statis untuk penyedia pembuatan.                                       |
| `authProviders` | Tidak       | `string[]` | Id penyedia yang profil autentikasi terkonfigurasinya harus dihitung sebagai autentikasi untuk penyedia pembuatan ini.                                      |
| `configSignals` | Tidak       | `object[]` | Sinyal ketersediaan murah berbasis konfigurasi saja untuk penyedia lokal atau self-hosted yang dapat dikonfigurasi tanpa profil autentikasi atau variabel env. |
| `authSignals`   | Tidak       | `object[]` | Sinyal autentikasi eksplisit. Jika ada, sinyal ini menggantikan kumpulan sinyal default dari id penyedia, `aliases`, dan `authProviders`.     |

Setiap entri `configSignals` mendukung:

| Kolom         | Wajib | Tipe       | Artinya                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ya      | `string`   | Jalur titik ke objek konfigurasi milik plugin yang akan diperiksa, misalnya `plugins.entries.example.config`.                                                                                    |
| `overlayPath` | Tidak       | `string`   | Jalur titik di dalam konfigurasi root yang objeknya harus melapisi objek root sebelum mengevaluasi sinyal. Gunakan ini untuk konfigurasi khusus kapabilitas seperti `image`, `video`, atau `music`. |
| `required`    | Tidak       | `string[]` | Jalur titik di dalam konfigurasi efektif yang harus memiliki nilai terkonfigurasi. String tidak boleh kosong; objek dan array tidak boleh kosong.                                                |
| `requiredAny` | Tidak       | `string[]` | Jalur titik di dalam konfigurasi efektif dengan setidaknya satu yang harus memiliki nilai terkonfigurasi.                                                                                                  |
| `mode`        | Tidak       | `object`   | Penjaga mode string opsional di dalam konfigurasi efektif. Gunakan ini saat ketersediaan berbasis konfigurasi saja hanya berlaku untuk satu mode.                                                                |

Setiap penjaga `mode` mendukung:

| Kolom        | Wajib | Tipe       | Artinya                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Tidak       | `string`   | Jalur titik di dalam konfigurasi efektif. Default-nya adalah `mode`.                          |
| `default`    | Tidak       | `string`   | Nilai mode yang digunakan saat konfigurasi menghilangkan jalur tersebut.                                  |
| `allowed`    | Tidak       | `string[]` | Jika ada, sinyal lolos hanya ketika mode efektif adalah salah satu dari nilai-nilai ini. |
| `disallowed` | Tidak       | `string[]` | Jika ada, sinyal gagal ketika mode efektif adalah salah satu dari nilai-nilai ini.       |

Setiap entri `authSignals` mendukung:

| Kolom             | Wajib | Tipe     | Artinya                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya      | `string` | Id penyedia yang akan diperiksa dalam profil autentikasi terkonfigurasi.                                                                                                                             |
| `providerBaseUrl` | Tidak       | `object` | Penjaga opsional yang membuat sinyal dihitung hanya ketika penyedia terkonfigurasi yang dirujuk menggunakan URL dasar yang diizinkan. Gunakan ini saat alias autentikasi hanya valid untuk API tertentu. |

Setiap penjaga `providerBaseUrl` mendukung:

| Kolom             | Wajib | Tipe       | Artinya                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya      | `string`   | Id konfigurasi penyedia yang `baseUrl`-nya harus diperiksa.                                                                                                |
| `defaultBaseUrl`  | Tidak       | `string`   | URL dasar yang diasumsikan ketika konfigurasi penyedia menghilangkan `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Ya      | `string[]` | URL dasar yang diizinkan untuk sinyal autentikasi ini. Sinyal diabaikan ketika URL dasar terkonfigurasi atau default tidak cocok dengan salah satu nilai ternormalisasi ini. |

## Referensi metadata alat

`toolMetadata` menggunakan bentuk `configSignals` dan `authSignals` yang sama seperti
metadata penyedia pembuatan, dengan kunci berdasarkan nama alat. `contracts.tools` mendeklarasikan
kepemilikan. `toolMetadata` mendeklarasikan bukti ketersediaan yang murah sehingga OpenClaw dapat
menghindari pengimporan runtime plugin hanya agar factory alatnya mengembalikan `null`.

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
memuat plugin pemilik saat kontrak alat cocok dengan kebijakan. Untuk alat jalur panas
yang factory-nya bergantung pada autentikasi/konfigurasi, penulis plugin sebaiknya mendeklarasikan
`toolMetadata` alih-alih membuat inti mengimpor runtime untuk bertanya.

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau autentikasi.
OpenClaw membaca ini sebelum runtime penyedia dimuat.
Daftar penyiapan penyedia menggunakan pilihan manifes ini, pilihan penyiapan turunan deskriptor,
dan metadata katalog instalasi tanpa memuat runtime penyedia.

| Kolom                 | Wajib | Tipe                                            | Artinya                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya      | `string`                                        | Id penyedia yang memiliki pilihan ini.                                                                      |
| `method`              | Ya      | `string`                                        | Id metode autentikasi untuk dikirimkan.                                                                           |
| `choiceId`            | Ya      | `string`                                        | Id pilihan autentikasi stabil yang digunakan oleh alur onboarding dan CLI.                                                  |
| `choiceLabel`         | Tidak       | `string`                                        | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw menggunakan fallback ke `choiceId`.                                        |
| `choiceHint`          | Tidak       | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                        |
| `assistantPriority`   | Tidak       | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan asisten.                                       |
| `assistantVisibility` | Tidak       | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.                        |
| `deprecatedChoiceIds` | Tidak       | `string[]`                                      | Id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                 |
| `groupId`             | Tidak       | `string`                                        | Id grup opsional untuk mengelompokkan pilihan terkait.                                                          |
| `groupLabel`          | Tidak       | `string`                                        | Label yang terlihat oleh pengguna untuk grup tersebut.                                                                        |
| `groupHint`           | Tidak       | `string`                                        | Teks bantuan singkat untuk grup.                                                                         |
| `optionKey`           | Tidak       | `string`                                        | Kunci opsi internal untuk alur autentikasi satu flag sederhana.                                                      |
| `cliFlag`             | Tidak       | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                           |
| `cliOption`           | Tidak       | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | Tidak       | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                                            |
| `onboardingScopes`    | Tidak       | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya adalah `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` ketika Plugin memiliki nama perintah runtime yang mungkin
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

| Bidang       | Wajib | Tipe              | Artinya                                                                 |
| ------------ | ----- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ya    | `string`          | Nama perintah yang dimiliki Plugin ini.                                 |
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai perintah garis miring chat, bukan perintah CLI root. |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.  |

## referensi activation

Gunakan `activation` ketika Plugin dapat mendeklarasikan dengan murah event control-plane mana
yang harus menyertakannya dalam rencana activation/load.

Blok ini adalah metadata perencana, bukan API siklus hidup. Ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode Plugin sudah dieksekusi. Perencana activation menggunakan bidang-bidang ini untuk
mempersempit kandidat Plugin sebelum kembali ke metadata kepemilikan manifes yang ada
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hooks.

Pilih metadata tersempit yang sudah mendeskripsikan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
ketika bidang-bidang tersebut menyatakan hubungan itu. Gunakan `activation` untuk petunjuk
perencana tambahan yang tidak dapat direpresentasikan oleh bidang kepemilikan tersebut.
Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`,
`codex-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk
id harness agen tertanam yang belum memiliki bidang kepemilikan.

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/Plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan Plugin yang lebih luas, sehingga
metadata activation non-startup yang hilang biasanya hanya berdampak pada performa; itu
tidak seharusnya mengubah kebenaran selama fallback kepemilikan manifes masih ada.

Setiap Plugin harus menetapkan `activation.onStartup` secara sengaja. Tetapkan ke `true`
hanya ketika Plugin harus berjalan selama startup Gateway. Tetapkan ke `false` ketika
Plugin tidak aktif saat startup dan hanya boleh dimuat dari pemicu yang lebih sempit.
Menghilangkan `onStartup` tidak lagi memuat Plugin saat startup secara implisit; gunakan metadata
activation eksplisit untuk startup, channel, config, agent-harness, memory, atau
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

| Bidang             | Wajib | Tipe                                                 | Artinya                                                                                                                                                                                       |
| ------------------ | ----- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Tidak | `boolean`                                            | Activation startup Gateway eksplisit. Setiap Plugin harus menetapkan ini. `true` mengimpor Plugin selama startup; `false` membuatnya lazy saat startup kecuali pemicu lain yang cocok memerlukan pemuatan. |
| `onProviders`      | Tidak | `string[]`                                           | Id provider yang harus menyertakan Plugin ini dalam rencana activation/load.                                                                                                                  |
| `onAgentHarnesses` | Tidak | `string[]`                                           | Id runtime harness agen tertanam yang harus menyertakan Plugin ini dalam rencana activation/load. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                                 |
| `onCommands`       | Tidak | `string[]`                                           | Id perintah yang harus menyertakan Plugin ini dalam rencana activation/load.                                                                                                                   |
| `onChannels`       | Tidak | `string[]`                                           | Id channel yang harus menyertakan Plugin ini dalam rencana activation/load.                                                                                                                    |
| `onRoutes`         | Tidak | `string[]`                                           | Jenis route yang harus menyertakan Plugin ini dalam rencana activation/load.                                                                                                                   |
| `onConfigPaths`    | Tidak | `string[]`                                           | Path config relatif root yang harus menyertakan Plugin ini dalam rencana startup/load ketika path tersebut ada dan tidak dinonaktifkan secara eksplisit.                                       |
| `onCapabilities`   | Tidak | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan activation control-plane. Pilih bidang yang lebih sempit jika memungkinkan.                                                          |

Konsumen live saat ini:

- Perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit
- perencanaan CLI yang dipicu perintah kembali ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan startup agent-runtime menggunakan `activation.onAgentHarnesses` untuk
  harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI
- perencanaan setup/channel yang dipicu channel kembali ke kepemilikan `channels[]`
  lama ketika metadata activation channel eksplisit tidak ada
- perencanaan Plugin startup menggunakan `activation.onConfigPaths` untuk permukaan config root
  non-channel seperti blok `browser` milik Plugin browser bawaan
- perencanaan setup/runtime yang dipicu provider kembali ke kepemilikan
  `providers[]` dan `cliBackends[]` tingkat atas lama ketika metadata activation
  provider eksplisit tidak ada

Diagnostik perencana dapat membedakan petunjuk activation eksplisit dari fallback
kepemilikan manifes. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
perencana menggunakan kepemilikan `commandAliases`. Label alasan ini ditujukan untuk
diagnostik host dan pengujian; penulis Plugin harus tetap mendeklarasikan metadata
yang paling baik mendeskripsikan kepemilikan.

## referensi qaRunners

Gunakan `qaRunners` saat sebuah Plugin menyumbangkan satu atau beberapa runner transport di bawah
root `openclaw qa` bersama. Jaga metadata ini tetap murah dan statis; runtime Plugin
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

`cliBackends` tingkat atas tetap valid dan terus mendeskripsikan backend inferensi CLI.
`setup.cliBackends` adalah permukaan deskriptor khusus setup untuk
alur control-plane/setup yang harus tetap hanya metadata.

Jika ada, `setup.providers` dan `setup.cliBackends` adalah permukaan pencarian
yang diutamakan berbasis deskriptor untuk penemuan setup. Jika deskriptor hanya
mempersempit kandidat Plugin dan setup masih memerlukan hook runtime waktu-setup
yang lebih kaya, tetapkan `requiresRuntime: true` dan pertahankan `setup-api`
sebagai jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam pencarian autentikasi penyedia
dan env-var generik. `providerAuthEnvVars` tetap didukung melalui adaptor kompatibilitas
selama jendela deprekasi, tetapi Plugin yang tidak dibundel yang masih menggunakannya
menerima diagnostik manifes. Plugin baru harus meletakkan metadata env setup/status
di `setup.providers[].envVars`.

OpenClaw juga dapat menurunkan pilihan setup sederhana dari `setup.providers[].authMethods`
saat tidak ada entri setup, atau saat `setup.requiresRuntime: false`
menyatakan runtime setup tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap
diutamakan untuk label khusus, flag CLI, cakupan onboarding, dan metadata asisten.

Tetapkan `requiresRuntime: false` hanya saat deskriptor tersebut cukup untuk
permukaan setup. OpenClaw memperlakukan `false` eksplisit sebagai kontrak hanya-deskriptor
dan tidak akan mengeksekusi `setup-api` atau `openclaw.setupEntry` untuk pencarian setup. Jika
Plugin hanya-deskriptor masih mengirim salah satu entri runtime setup tersebut,
OpenClaw melaporkan diagnostik aditif dan terus mengabaikannya. `requiresRuntime`
yang dihilangkan mempertahankan perilaku fallback lama sehingga Plugin yang ada yang menambahkan
deskriptor tanpa flag tersebut tidak rusak.

Karena pencarian setup dapat mengeksekusi kode `setup-api` milik Plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
Plugin yang ditemukan. Kepemilikan ambigu gagal tertutup alih-alih memilih
pemenang dari urutan penemuan.

Saat runtime setup memang dieksekusi, diagnostik registry setup melaporkan drift deskriptor
jika `setup-api` mendaftarkan penyedia atau backend CLI yang tidak dideklarasikan
oleh deskriptor manifes, atau jika sebuah deskriptor tidak memiliki pendaftaran runtime
yang cocok. Diagnostik ini bersifat aditif dan tidak menolak Plugin lama.

### Referensi setup.providers

| Bidang         | Wajib | Tipe       | Artinya                                                                                              |
| -------------- | ----- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `id`           | Ya    | `string`   | Id penyedia yang diekspos selama setup atau onboarding. Jaga id yang dinormalisasi tetap unik secara global. |
| `authMethods`  | Tidak | `string[]` | Id metode setup/autentikasi yang didukung penyedia ini tanpa memuat runtime penuh.                   |
| `envVars`      | Tidak | `string[]` | Env var yang dapat diperiksa permukaan setup/status generik sebelum runtime Plugin dimuat.            |
| `authEvidence` | Tidak | `object[]` | Pemeriksaan bukti autentikasi lokal murah untuk penyedia yang dapat mengautentikasi melalui penanda non-rahasia. |

`authEvidence` digunakan untuk penanda kredensial lokal milik penyedia yang dapat
diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap ringan dan lokal:
tidak ada panggilan jaringan, tidak ada pembacaan keychain atau secret-manager, tidak ada perintah shell, dan tidak ada
probe API penyedia.

Entri bukti yang didukung:

| Bidang             | Wajib | Tipe       | Artinya                                                                                                       |
| ------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `type`             | Ya    | `string`   | Saat ini `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Tidak | `string`   | Env var yang berisi path file kredensial eksplisit.                                                           |
| `fallbackPaths`    | Tidak | `string[]` | Path file kredensial lokal yang diperiksa saat `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak | `string[]` | Setidaknya satu env var yang tercantum harus tidak kosong sebelum bukti valid.                                |
| `requiresAllEnv`   | Tidak | `string[]` | Setiap env var yang tercantum harus tidak kosong sebelum bukti valid.                                         |
| `credentialMarker` | Ya    | `string`   | Penanda non-rahasia yang dikembalikan saat bukti ada.                                                        |
| `source`           | Tidak | `string`   | Label sumber yang terlihat oleh pengguna untuk output auth/status.                                            |

### bidang setup

| Bidang             | Wajib | Tipe       | Artinya                                                                                            |
| ------------------ | ----- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Tidak | `object[]` | Deskriptor penyiapan penyedia yang diekspos selama penyiapan dan onboarding.                       |
| `cliBackends`      | Tidak | `string[]` | Id backend saat penyiapan yang digunakan untuk lookup penyiapan berbasis deskriptor terlebih dahulu. Jaga agar id ternormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | Id migrasi konfigurasi yang dimiliki oleh permukaan penyiapan Plugin ini.                          |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah penyiapan masih membutuhkan eksekusi `setup-api` setelah lookup deskriptor.                 |

## referensi uiHints

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

Setiap petunjuk bidang dapat mencakup:

| Bidang        | Tipe       | Artinya                                      |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Label bidang yang terlihat oleh pengguna.    |
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
| `embeddedExtensionFactories`     | `string[]` | Id factory ekstensi app-server Codex, saat ini `codex-app-server`.    |
| `agentToolResultMiddleware`      | `string[]` | Id runtime yang dapat digunakan Plugin bawaan untuk mendaftarkan middleware hasil alat. |
| `externalAuthProviders`          | `string[]` | Id penyedia yang hook profil auth eksternalnya dimiliki Plugin ini.   |
| `speechProviders`                | `string[]` | Id penyedia speech yang dimiliki Plugin ini.                          |
| `realtimeTranscriptionProviders` | `string[]` | Id penyedia realtime-transcription yang dimiliki Plugin ini.          |
| `realtimeVoiceProviders`         | `string[]` | Id penyedia realtime-voice yang dimiliki Plugin ini.                  |
| `memoryEmbeddingProviders`       | `string[]` | Id penyedia embedding memori yang dimiliki Plugin ini.                |
| `mediaUnderstandingProviders`    | `string[]` | Id penyedia pemahaman media yang dimiliki Plugin ini.                 |
| `imageGenerationProviders`       | `string[]` | Id penyedia pembuatan gambar yang dimiliki Plugin ini.                |
| `videoGenerationProviders`       | `string[]` | Id penyedia pembuatan video yang dimiliki Plugin ini.                 |
| `webFetchProviders`              | `string[]` | Id penyedia web-fetch yang dimiliki Plugin ini.                       |
| `webSearchProviders`             | `string[]` | Id penyedia web-search yang dimiliki Plugin ini.                      |
| `migrationProviders`             | `string[]` | Id penyedia impor yang dimiliki Plugin ini untuk `openclaw migrate`.  |
| `tools`                          | `string[]` | Nama alat agent yang dimiliki Plugin ini.                             |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory ekstensi bawaan khusus app-server Codex.
Transformasi hasil alat bawaan harus mendeklarasikan
`contracts.agentToolResultMiddleware` dan mendaftar dengan
`api.registerAgentToolResultMiddleware(...)` sebagai gantinya. Plugin eksternal tidak dapat
mendaftarkan middleware hasil alat karena seam ini dapat menulis ulang output alat dengan kepercayaan tinggi
sebelum model melihatnya.

Registrasi runtime `api.registerTool(...)` harus cocok dengan `contracts.tools`.
Penemuan alat menggunakan daftar ini untuk memuat hanya runtime Plugin yang dapat memiliki
alat yang diminta.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` harus mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi tersebut tetap berjalan
melalui fallback kompatibilitas yang sudah deprecated, tetapi fallback itu lebih lambat dan
akan dihapus setelah jendela migrasi.

Penyedia embedding memori bawaan harus mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap id adaptor yang diekspos, termasuk
adaptor bawaan seperti `local`. Path CLI mandiri menggunakan kontrak manifes ini
untuk memuat hanya Plugin pemilik sebelum runtime Gateway penuh
mendaftarkan penyedia.

## referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` saat penyedia pemahaman media memiliki
model default, prioritas fallback auto-auth, atau dukungan dokumen native yang
dibutuhkan helper inti generik sebelum runtime dimuat. Kunci juga harus dideklarasikan di
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
| `defaultModels`        | `Record<string, string>`            | Default kapabilitas-ke-model yang digunakan saat konfigurasi tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka lebih rendah diurutkan lebih awal untuk fallback penyedia berbasis kredensial otomatis. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh penyedia.                            |

## referensi channelConfigs

Gunakan `channelConfigs` saat Plugin channel membutuhkan metadata konfigurasi ringan sebelum
runtime dimuat. Penemuan penyiapan/status channel baca-saja dapat menggunakan metadata ini
secara langsung untuk channel eksternal yang dikonfigurasi saat tidak ada entri penyiapan, atau
saat `setup.requiresRuntime: false` mendeklarasikan runtime penyiapan tidak diperlukan.

`channelConfigs` adalah metadata manifes Plugin, bukan bagian konfigurasi pengguna tingkat atas baru.
Pengguna tetap mengonfigurasi instance channel di bawah `channels.<channel-id>`.
OpenClaw membaca metadata manifes untuk menentukan Plugin mana yang memiliki channel yang dikonfigurasi itu
sebelum kode runtime Plugin dieksekusi.

Untuk Plugin channel, `configSchema` dan `channelConfigs` menjelaskan path yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin non-bawaan yang mendeklarasikan `channels[]` juga harus mendeklarasikan entri
`channelConfigs` yang cocok. Tanpanya, OpenClaw tetap dapat memuat Plugin, tetapi
skema konfigurasi cold-path, penyiapan, dan permukaan Control UI tidak dapat mengetahui
bentuk opsi milik channel sampai runtime Plugin dieksekusi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan
`nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk pemeriksaan konfigurasi perintah
yang berjalan sebelum runtime channel dimuat. Channel bawaan juga dapat menerbitkan
default yang sama melalui `package.json#openclaw.channel.commands` bersama
metadata katalog channel lain yang dimiliki package.

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

| Bidang        | Jenis                    | Artinya                                                                                                      |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi saluran yang dideklarasikan.         |
| `uiHints`     | `Record<string, object>` | Label/placeholder/petunjuk sensitif UI opsional untuk bagian konfigurasi saluran tersebut.                    |
| `label`       | `string`                 | Label saluran yang digabungkan ke permukaan pemilih dan inspeksi saat metadata runtime belum siap.           |
| `description` | `string`                 | Deskripsi singkat saluran untuk permukaan inspeksi dan katalog.                                              |
| `commands`    | `object`                 | Default otomatis perintah asli statis dan keterampilan asli untuk pemeriksaan konfigurasi pra-runtime.       |
| `preferOver`  | `string[]`               | Id Plugin lama atau berprioritas lebih rendah yang harus dikalahkan saluran ini di permukaan pemilihan.      |

### Mengganti Plugin saluran lain

Gunakan `preferOver` saat Plugin Anda adalah pemilik pilihan untuk id saluran yang
juga dapat disediakan oleh Plugin lain. Kasus umum mencakup id Plugin yang
diganti namanya, Plugin mandiri yang menggantikan Plugin bundel, atau fork yang
dipelihara yang mempertahankan id saluran yang sama untuk kompatibilitas konfigurasi.

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
dibundel atau diaktifkan secara default, OpenClaw menonaktifkannya dalam
konfigurasi runtime efektif sehingga satu Plugin memiliki saluran dan alatnya.
Pilihan pengguna eksplisit tetap menang: jika pengguna secara eksplisit
mengaktifkan kedua Plugin, OpenClaw mempertahankan pilihan tersebut dan
melaporkan diagnostik saluran/alat duplikat alih-alih diam-diam mengubah
kumpulan Plugin yang diminta.

Jaga `preferOver` tetap terbatas pada id Plugin yang benar-benar dapat
menyediakan saluran yang sama. Ini bukan bidang prioritas umum dan tidak
mengganti nama kunci konfigurasi pengguna.

## Referensi modelSupport

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan Plugin penyedia Anda dari
id model singkat seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum runtime
Plugin dimuat.

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
- jika satu Plugin non-bundel dan satu Plugin bundel sama-sama cocok, Plugin
  non-bundel menang
- ambiguitas yang tersisa diabaikan hingga pengguna atau konfigurasi menentukan penyedia

Bidang:

| Bidang          | Jenis      | Artinya                                                                                  |
| --------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model singkat.                   |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model singkat setelah penghapusan sufiks profil. |

## Referensi modelCatalog

Gunakan `modelCatalog` saat OpenClaw harus mengetahui metadata model penyedia
sebelum memuat runtime Plugin. Ini adalah sumber milik manifes untuk baris
katalog tetap, alias penyedia, aturan penekanan, dan mode penemuan. Penyegaran
runtime tetap berada dalam kode runtime penyedia, tetapi manifes memberi tahu
core kapan runtime diperlukan.

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

| Bidang         | Jenis                                                    | Artinya                                                                                                      |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki oleh Plugin ini. Kunci juga harus muncul di `providers` tingkat atas. |
| `aliases`      | `Record<string, object>`                                 | Alias penyedia yang harus diarahkan ke penyedia yang dimiliki untuk perencanaan katalog atau penekanan.     |
| `suppressions` | `object[]`                                               | Baris model dari sumber lain yang ditekan oleh Plugin ini karena alasan khusus penyedia.                    |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, disegarkan ke cache, atau memerlukan runtime.   |

`aliases` berpartisipasi dalam pencarian kepemilikan penyedia untuk perencanaan
katalog model. Target alias harus berupa penyedia tingkat atas yang dimiliki
oleh Plugin yang sama. Saat daftar yang difilter menurut penyedia menggunakan
alias, OpenClaw dapat membaca manifes pemilik dan menerapkan penggantian API/URL
dasar alias tanpa memuat runtime penyedia.
Alias tidak memperluas daftar katalog tanpa filter; daftar luas hanya
menghasilkan baris penyedia kanonis pemilik.

`suppressions` menggantikan hook `suppressBuiltInModel` runtime penyedia lama.
Entri penekanan hanya dihormati saat penyedia dimiliki oleh Plugin atau
dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia
miliknya. Hook penekanan runtime tidak lagi dipanggil selama resolusi model.

Bidang penyedia:

| Bidang    | Jenis                    | Artinya                                                                   |
| --------- | ------------------------ | ------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL dasar default opsional untuk model dalam katalog penyedia ini.        |
| `api`     | `ModelApi`               | Adapter API default opsional untuk model dalam katalog penyedia ini.      |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.           |
| `models`  | `object[]`               | Baris model wajib. Baris tanpa `id` diabaikan.                            |

Bidang model:

| Bidang          | Jenis                                                          | Artinya                                                                                    |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | Id model lokal penyedia, tanpa prefiks `provider/`.                                        |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                                    |
| `api`           | `ModelApi`                                                     | Penggantian API per model opsional.                                                        |
| `baseUrl`       | `string`                                                       | Penggantian URL dasar per model opsional.                                                  |
| `headers`       | `Record<string, string>`                                       | Header statis per model opsional.                                                         |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitas yang diterima model.                                                            |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku reasoning.                                                |
| `contextWindow` | `number`                                                       | Jendela konteks penyedia asli.                                                            |
| `contextTokens` | `number`                                                       | Batas konteks runtime efektif opsional saat berbeda dari `contextWindow`.                  |
| `maxTokens`     | `number`                                                       | Token keluaran maksimum saat diketahui.                                                    |
| `cost`          | `object`                                                       | Harga USD per juta token opsional, termasuk `tieredPricing` opsional.                      |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas konfigurasi model OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status pencantuman. Tekan hanya saat baris sama sekali tidak boleh muncul.                 |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan dengan status non-tersedia.                               |
| `replaces`      | `string[]`                                                     | Id model lokal penyedia lama yang digantikan model ini.                                    |
| `replacedBy`    | `string`                                                       | Id model lokal penyedia pengganti untuk baris yang usang.                                  |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh pemilih dan filter.                                         |

Bidang penekanan:

| Bidang                     | Jenis      | Artinya                                                                                                        |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Id penyedia untuk baris upstream yang akan ditekan. Harus dimiliki oleh Plugin ini atau dideklarasikan sebagai alias milik. |
| `model`                    | `string`   | Id model lokal penyedia yang akan ditekan.                                                                     |
| `reason`                   | `string`   | Pesan opsional yang ditampilkan saat baris yang ditekan diminta secara langsung.                               |
| `when.baseUrlHosts`        | `string[]` | Daftar opsional host URL dasar penyedia efektif yang diperlukan sebelum penekanan berlaku.                     |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi penyedia persis yang diperlukan sebelum penekanan berlaku.             |

Jangan tempatkan data khusus runtime di `modelCatalog`. Gunakan `static` hanya ketika baris manifes sudah cukup lengkap agar daftar yang difilter penyedia dan permukaan pemilih dapat melewati penemuan registry/runtime. Gunakan `refreshable` ketika baris manifes berguna sebagai seed atau pelengkap yang dapat dicantumkan, tetapi refresh/cache dapat menambahkan lebih banyak baris nanti; baris refreshable tidak bersifat otoritatif sendiri. Gunakan `runtime` ketika OpenClaw harus memuat runtime penyedia untuk mengetahui daftarnya.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan model-id murah yang dimiliki penyedia dan harus terjadi sebelum runtime penyedia dimuat. Ini menjaga alias seperti nama model singkat, id lama lokal penyedia, dan aturan prefiks proxy tetap berada di manifes Plugin pemilik, bukan di tabel pemilihan model inti.

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

| Kolom                                | Tipe                    | Artinya                                                                                  |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias model-id persis yang tidak peka huruf besar/kecil. Nilai dikembalikan apa adanya. |
| `stripPrefixes`                      | `string[]`              | Prefiks yang dihapus sebelum pencarian alias, berguna untuk duplikasi penyedia/model lama. |
| `prefixWhenBare`                     | `string`                | Prefiks yang ditambahkan ketika id model yang dinormalisasi belum berisi `/`.            |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan prefiks id polos bersyarat setelah pencarian alias, dengan kunci `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi endpoint yang harus diketahui kebijakan permintaan generik sebelum runtime penyedia dimuat. Inti tetap memiliki makna setiap `endpointClass`; manifes Plugin memiliki metadata host dan URL dasar.

Kolom endpoint:

| Kolom                          | Tipe       | Artinya                                                                                     |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint inti yang dikenal, seperti `openrouter`, `moonshot-native`, atau `google-vertex`. |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                          |
| `hostSuffixes`                 | `string[]` | Sufiks host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus sufiks domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi persis yang dipetakan ke kelas endpoint.                  |
| `googleVertexRegion`           | `string`   | Region Google Vertex statis untuk host global persis.                                       |
| `googleVertexRegionHostSuffix` | `string`   | Sufiks yang dihapus dari host yang cocok untuk mengekspos prefiks region Google Vertex.    |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan murah yang diperlukan kebijakan permintaan generik tanpa memuat runtime penyedia. Simpan penulisan ulang payload khusus perilaku di hook runtime penyedia atau helper keluarga penyedia bersama.

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

| Kolom                | Tipe         | Artinya                                                                              |
| -------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`             | `string`     | Label keluarga penyedia yang digunakan oleh keputusan kompatibilitas permintaan generik dan diagnostik. |
| `compatibilityFamily` | `"moonshot"` | Bucket kompatibilitas keluarga penyedia opsional untuk helper permintaan bersama.    |
| `openAICompletions`  | `object`     | Flag permintaan completions kompatibel OpenAI, saat ini `supportsStreamingUsage`.    |

## Referensi modelPricing

Gunakan `modelPricing` ketika penyedia memerlukan perilaku harga control-plane sebelum runtime dimuat. Cache harga Gateway membaca metadata ini tanpa mengimpor kode runtime penyedia.

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

| Kolom        | Tipe              | Artinya                                                                                       |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Atur `false` untuk penyedia lokal/self-hosted yang tidak boleh pernah mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan lookup harga OpenRouter. `false` menonaktifkan lookup OpenRouter untuk penyedia ini. |
| `liteLLM`    | `false \| object` | Pemetaan lookup harga LiteLLM. `false` menonaktifkan lookup LiteLLM untuk penyedia ini.       |

Kolom sumber:

| Kolom                     | Tipe               | Artinya                                                                                                        |
| ------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                | `string`           | Id penyedia katalog eksternal ketika berbeda dari id penyedia OpenClaw, misalnya `z-ai` untuk penyedia `zai`. |
| `passthroughProviderModel` | `boolean`          | Perlakukan id model yang berisi garis miring sebagai referensi penyedia/model bersarang, berguna untuk penyedia proxy seperti OpenRouter. |
| `modelIdTransforms`       | `"version-dots"[]` | Varian model-id katalog eksternal tambahan. `version-dots` mencoba id versi bertitik seperti `claude-opus-4.6`. |

### Indeks Penyedia OpenClaw

Indeks Penyedia OpenClaw adalah metadata pratinjau milik OpenClaw untuk penyedia yang Plugin-nya mungkin belum terpasang. Ini bukan bagian dari manifes Plugin. Manifes Plugin tetap menjadi otoritas Plugin terpasang. Indeks Penyedia adalah kontrak fallback internal yang akan digunakan oleh permukaan penyedia dapat dipasang dan pemilih model pra-instal mendatang ketika Plugin penyedia tidak terpasang.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. `modelCatalog` manifes Plugin terpasang.
3. Cache katalog model dari refresh eksplisit.
4. Baris pratinjau Indeks Penyedia OpenClaw.

Indeks Penyedia tidak boleh berisi rahasia, status aktif, hook runtime, atau data model khusus akun langsung. Katalog pratinjaunya menggunakan bentuk baris penyedia `modelCatalog` yang sama seperti manifes Plugin, tetapi sebaiknya tetap dibatasi pada metadata tampilan stabil kecuali kolom adapter runtime seperti `api`, `baseUrl`, harga, atau flag kompatibilitas sengaja dijaga selaras dengan manifes Plugin terpasang. Penyedia dengan penemuan `/models` langsung sebaiknya menulis baris yang disegarkan melalui jalur cache katalog model eksplisit, bukan membuat daftar normal atau onboarding memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata Plugin yang dapat dipasang untuk penyedia yang Plugin-nya telah dipindahkan keluar dari inti atau belum terpasang. Metadata ini meniru pola katalog channel: nama paket, spesifikasi instal npm, integritas yang diharapkan, dan label pilihan auth murah sudah cukup untuk menampilkan opsi penyiapan yang dapat dipasang. Setelah Plugin terpasang, manifesnya menang dan entri Indeks Penyedia diabaikan untuk penyedia tersebut.

Kunci kapabilitas level atas lama sudah tidak digunakan. Gunakan `openclaw doctor --fix` untuk memindahkan `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan manifes normal tidak lagi memperlakukan kolom level atas tersebut sebagai kepemilikan kapabilitas.

## Manifes versus package.json

Kedua file menjalankan tugas yang berbeda:

| File                   | Gunakan untuk                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Penemuan, validasi konfigurasi, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode Plugin berjalan              |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, penyiapan, atau metadata katalog |

Jika Anda tidak yakin di mana suatu metadata seharusnya berada, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode Plugin, letakkan di `openclaw.plugin.json`
- jika berkaitan dengan packaging, file entry, atau perilaku instal npm, letakkan di `package.json`

### Kolom package.json yang memengaruhi penemuan

Sebagian metadata Plugin pra-runtime sengaja berada di `package.json` di bawah blok `openclaw`, bukan di `openclaw.plugin.json`.
`openclaw.bundle` dan `openclaw.bundle.json` bukan kontrak Plugin OpenClaw; Plugin native harus menggunakan `openclaw.plugin.json` ditambah kolom `package.json#openclaw` yang didukung di bawah.

Contoh penting:

| Bidang                                                                                     | Artinya                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Mendeklarasikan entrypoint plugin native. Harus tetap berada di dalam direktori paket plugin.                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk paket yang terinstal. Harus tetap berada di dalam direktori paket plugin.                                           |
| `openclaw.setupEntry`                                                                      | Entrypoint ringan khusus penyiapan yang digunakan selama onboarding, startup saluran tertunda, serta penemuan status saluran/SecretRef baca-saja. Harus tetap berada di dalam direktori paket plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Mendeklarasikan entrypoint penyiapan JavaScript hasil build untuk paket yang terinstal. Memerlukan `setupEntry`, harus ada, dan harus tetap berada di dalam direktori paket plugin. |
| `openclaw.channel`                                                                         | Metadata katalog saluran murah seperti label, jalur docs, alias, dan salinan pilihan.                                                                                              |
| `openclaw.channel.commands`                                                                | Metadata statis perintah native dan default otomatis skill native yang digunakan oleh permukaan konfigurasi, audit, dan daftar perintah sebelum runtime saluran dimuat.              |
| `openclaw.channel.configuredState`                                                         | Metadata pemeriksa status-terkonfigurasi ringan yang dapat menjawab "apakah penyiapan hanya-env sudah ada?" tanpa memuat runtime saluran penuh.                                      |
| `openclaw.channel.persistedAuthState`                                                      | Metadata pemeriksa auth tersimpan ringan yang dapat menjawab "apakah ada yang sudah masuk?" tanpa memuat runtime saluran penuh.                                                     |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Petunjuk instal/pembaruan untuk plugin bawaan dan plugin yang diterbitkan secara eksternal.                                                                                         |
| `openclaw.install.defaultChoice`                                                           | Jalur instal yang disukai saat beberapa sumber instal tersedia.                                                                                                                     |
| `openclaw.install.minHostVersion`                                                          | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22` atau `>=2026.5.1-beta.1`.                                                           |
| `openclaw.install.expectedIntegrity`                                                       | String integritas dist npm yang diharapkan seperti `sha512-...`; alur instal dan pembaruan memverifikasi artefak yang diambil terhadap nilai ini.                                  |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Mengizinkan jalur pemulihan instal ulang plugin bawaan yang sempit saat konfigurasi tidak valid.                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Memungkinkan permukaan saluran khusus penyiapan dimuat sebelum plugin saluran penuh selama startup.                                                                                 |

Metadata manifes menentukan pilihan penyedia/saluran/penyiapan mana yang muncul di
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan plugin tersebut saat pengguna memilih salah satu
pilihan itu. Jangan pindahkan petunjuk instal ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama instal dan pemuatan registry
manifes untuk sumber plugin non-bawaan. Nilai yang tidak valid ditolak;
nilai yang lebih baru tetapi valid melewati plugin eksternal pada host yang lebih lama. Plugin sumber
bawaan diasumsikan memiliki versi yang sama dengan checkout host.

Metadata instal-sesuai-permintaan resmi harus menggunakan `clawhubSpec` saat plugin
diterbitkan di ClawHub; onboarding memperlakukannya sebagai sumber jarak jauh yang disukai dan
merekam fakta artefak ClawHub setelah instal. `npmSpec` tetap menjadi fallback
kompatibilitas untuk paket yang belum pindah ke ClawHub.

Penyematan versi npm persis sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
harus memasangkan spec persis dengan `expectedIntegrity` agar alur pembaruan gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang disematkan.
Onboarding interaktif tetap menawarkan spec npm registry tepercaya, termasuk nama
paket polos dan dist-tag, untuk kompatibilitas. Diagnostik katalog dapat
membedakan sumber pilihan-default yang persis, mengambang, disematkan-integritas, hilang-integritas, nama-paket
tidak cocok, dan tidak valid. Diagnostik juga memperingatkan saat
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat disematkannya.
Saat `expectedIntegrity` ada,
alur instal/pembaruan memberlakukannya; saat dihilangkan, resolusi registry
direkam tanpa sematan integritas.

Plugin saluran harus menyediakan `openclaw.setupEntry` saat status, daftar saluran,
atau pemindaian SecretRef perlu mengidentifikasi akun yang dikonfigurasi tanpa memuat runtime
penuh. Entry penyiapan harus mengekspos metadata saluran serta adapter konfigurasi,
status, dan rahasia yang aman untuk penyiapan; simpan klien jaringan, listener gateway, dan
runtime transport di entrypoint ekstensi utama.

Bidang entrypoint runtime tidak menimpa pemeriksaan batas paket untuk bidang
entrypoint sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
jalur `openclaw.extensions` yang keluar batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja sempit. Ini tidak
membuat konfigurasi rusak sembarang menjadi dapat diinstal. Saat ini, ini hanya mengizinkan alur instal
untuk pulih dari kegagalan upgrade plugin bawaan usang tertentu, seperti
jalur plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin
bawaan yang sama. Error konfigurasi yang tidak terkait tetap memblokir instal dan mengarahkan operator
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

Gunakan ini saat alur penyiapan, doctor, status, atau kehadiran baca-saja memerlukan probe auth
ya/tidak yang murah sebelum plugin saluran penuh dimuat. Status auth tersimpan bukan
status saluran terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan plugin otomatis,
memperbaiki dependensi runtime, atau memutuskan apakah runtime saluran harus dimuat.
Export target harus berupa fungsi kecil yang hanya membaca status tersimpan; jangan
rutekan melalui barrel runtime saluran penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan
terkonfigurasi hanya-env yang murah:

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

Gunakan ini saat saluran dapat menjawab status-terkonfigurasi dari env atau input kecil
non-runtime lainnya. Jika pemeriksaan memerlukan resolusi konfigurasi penuh atau runtime
saluran nyata, simpan logika itu di hook `config.hasConfiguredState`
plugin.

## Prioritas penemuan (id plugin duplikat)

OpenClaw menemukan plugin dari beberapa root (bawaan, instal global, workspace, jalur pilihan konfigurasi eksplisit). Jika dua penemuan memiliki `id` yang sama, hanya manifes dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan dengannya.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih konfigurasi** — jalur yang disematkan secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — plugin yang dikirim bersama OpenClaw
3. **Instal global** — plugin yang diinstal ke root plugin OpenClaw global
4. **Workspace** — plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau usang dari plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar menimpa plugin bawaan dengan plugin lokal, sematkan melalui `plugins.entries.<id>` agar menang berdasarkan prioritas, bukan mengandalkan penemuan workspace.
- Duplikat yang dibuang dicatat sehingga diagnostik Doctor dan startup dapat menunjuk ke salinan yang dibuang.
- Penimpaan duplikat yang dipilih konfigurasi ditulis sebagai penimpaan eksplisit dalam diagnostik, tetapi tetap memperingatkan agar fork usang dan bayangan tidak disengaja tetap terlihat.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, meskipun tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat konfigurasi dibaca/ditulis, bukan saat runtime.
- Saat memperluas atau melakukan fork plugin bawaan dengan kunci konfigurasi baru, perbarui `configSchema` `openclaw.plugin.json` plugin tersebut pada saat yang sama. Skema plugin bawaan bersifat ketat, sehingga menambahkan `plugins.entries.<id>.config.myNewKey` di konfigurasi pengguna tanpa menambahkan `myNewKey` ke `configSchema.properties` akan ditolak sebelum runtime plugin dimuat.

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

- Kunci `channels.*` yang tidak dikenal adalah **error**, kecuali id saluran dideklarasikan oleh
  manifes plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk ke id plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **error**.
- Jika plugin terinstal tetapi memiliki manifes atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error plugin.
- Jika konfigurasi plugin ada tetapi plugin **dinonaktifkan**, konfigurasi dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifes **wajib untuk Plugin OpenClaw native**, termasuk pemuatan dari sistem file lokal. Runtime tetap memuat modul Plugin secara terpisah; manifes hanya untuk penemuan + validasi.
- Manifes native diuraikan dengan JSON5, sehingga komentar, koma di akhir, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya bidang manifes terdokumentasi yang dibaca oleh pemuat manifes. Hindari kunci tingkat atas khusus.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan saat Plugin tidak membutuhkannya.
- `providerDiscoveryEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog penyedia statis atau deskriptor penemuan yang sempit, bukan eksekusi saat permintaan.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Deklarasikan jenis Plugin eksklusif dalam manifes ini. `OpenClawPluginDefinition.kind` pada entri runtime sudah tidak digunakan lagi dan tetap ada hanya sebagai fallback kompatibilitas untuk Plugin lama.
- Metadata variabel lingkungan (`setup.providers[].envVars`, `providerAuthEnvVars` yang tidak digunakan lagi, dan `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman Cron, dan permukaan baca-saja lainnya tetap menerapkan kepercayaan Plugin dan kebijakan aktivasi efektif sebelum memperlakukan variabel lingkungan sebagai telah dikonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode penyedia, lihat [hook runtime penyedia](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist pengelola paket apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Membangun Plugin" href="/id/plugins/building-plugins" icon="rocket">
    Mulai menggunakan Plugin.
  </Card>
  <Card title="Arsitektur Plugin" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model kapabilitas.
  </Card>
  <Card title="Ikhtisar SDK" href="/id/plugins/sdk-overview" icon="book">
    Referensi SDK Plugin dan impor subpath.
  </Card>
</CardGroup>
