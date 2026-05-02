---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu menyediakan skema konfigurasi Plugin atau men-debug kesalahan validasi Plugin
summary: Persyaratan manifes Plugin + skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-05-02T09:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

Halaman ini hanya untuk **manifes Plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Bundle Plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifes yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude default
  tanpa manifes
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundle tersebut, tetapi tata letak itu tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle beserta root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan paket hook yang didukung ketika tata letaknya sesuai
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** mengirimkan file `openclaw.plugin.json` di
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
- metadata auth, onboarding, dan penyiapan (alias, auto-enable, variabel env penyedia, pilihan auth)
- petunjuk aktivasi untuk permukaan control-plane
- kepemilikan singkat keluarga model
- snapshot kepemilikan kapabilitas statis (`contracts`)
- metadata runner QA yang dapat diperiksa host `openclaw qa` bersama
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

| Bidang                               | Wajib | Tipe                             | Artinya                                                                                                                                                                                                                                           |
| ------------------------------------ | ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya    | `string`                         | Id Plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                                                        |
| `configSchema`                       | Ya    | `object`                         | JSON Schema sebaris untuk konfigurasi Plugin ini.                                                                                                                                                                                                |
| `enabledByDefault`                   | Tidak | `true`                           | Menandai Plugin bawaan sebagai aktif secara default. Hilangkan bidang ini, atau tetapkan nilai non-`true` apa pun, agar Plugin tetap dinonaktifkan secara default.                                                                               |
| `legacyPluginIds`                    | Tidak | `string[]`                       | Id lama yang dinormalisasi ke id Plugin kanonis ini.                                                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | Tidak | `string[]`                       | Id penyedia yang harus mengaktifkan Plugin ini secara otomatis saat autentikasi, konfigurasi, atau referensi model menyebutkannya.                                                                                                                |
| `kind`                               | Tidak | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                                    |
| `channels`                           | Tidak | `string[]`                       | Id saluran yang dimiliki Plugin ini. Digunakan untuk penemuan dan validasi konfigurasi.                                                                                                                                                          |
| `providers`                          | Tidak | `string[]`                       | Id penyedia yang dimiliki Plugin ini.                                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Tidak | `string`                         | Jalur modul penemuan penyedia ringan, relatif terhadap root Plugin, untuk metadata katalog penyedia berskup manifest yang dapat dimuat tanpa mengaktifkan runtime Plugin lengkap.                                                                |
| `modelSupport`                       | Tidak | `object`                         | Metadata keluarga model singkat milik manifest yang digunakan untuk memuat otomatis Plugin sebelum runtime.                                                                                                                                       |
| `modelCatalog`                       | Tidak | `object`                         | Metadata katalog model deklaratif untuk penyedia yang dimiliki Plugin ini. Ini adalah kontrak control-plane untuk daftar hanya baca, onboarding, pemilih model, alias, dan penekanan di masa mendatang tanpa memuat runtime Plugin.              |
| `modelPricing`                       | Tidak | `object`                         | Kebijakan pencarian harga eksternal milik penyedia. Gunakan untuk mengecualikan penyedia lokal/self-hosted dari katalog harga jarak jauh atau memetakan referensi penyedia ke id katalog OpenRouter/LiteLLM tanpa meng-hardcode id penyedia di core. |
| `modelIdNormalization`               | Tidak | `object`                         | Pembersihan alias/prefiks id model milik penyedia yang harus berjalan sebelum runtime penyedia dimuat.                                                                                                                                           |
| `providerEndpoints`                  | Tidak | `object[]`                       | Metadata host/baseUrl endpoint milik manifest untuk rute penyedia yang harus diklasifikasikan core sebelum runtime penyedia dimuat.                                                                                                              |
| `providerRequest`                    | Tidak | `object`                         | Metadata keluarga penyedia dan kompatibilitas permintaan yang ringan, digunakan oleh kebijakan permintaan generik sebelum runtime penyedia dimuat.                                                                                               |
| `cliBackends`                        | Tidak | `string[]`                       | Id backend inferensi CLI yang dimiliki Plugin ini. Digunakan untuk aktivasi otomatis saat startup dari referensi konfigurasi eksplisit.                                                                                                          |
| `syntheticAuthRefs`                  | Tidak | `string[]`                       | Referensi penyedia atau backend CLI yang hook autentikasi sintetis milik Plugin-nya harus diperiksa selama penemuan model cold sebelum runtime dimuat.                                                                                          |
| `nonSecretAuthMarkers`               | Tidak | `string[]`                       | Nilai kunci API placeholder milik Plugin bawaan yang merepresentasikan status kredensial lokal, OAuth, atau ambient yang bukan rahasia.                                                                                                          |
| `commandAliases`                     | Tidak | `object[]`                       | Nama perintah yang dimiliki Plugin ini yang harus menghasilkan diagnostik konfigurasi dan CLI sadar Plugin sebelum runtime dimuat.                                                                                                               |
| `providerAuthEnvVars`                | Tidak | `Record<string, string[]>`       | Metadata env kompatibilitas yang tidak digunakan lagi untuk pencarian autentikasi/status penyedia. Lebih pilih `setup.providers[].envVars` untuk Plugin baru; OpenClaw masih membacanya selama jendela deprekasi.                               |
| `providerAuthAliases`                | Tidak | `Record<string, string>`         | Id penyedia yang harus memakai ulang id penyedia lain untuk pencarian autentikasi, misalnya penyedia coding yang berbagi kunci API penyedia dasar dan profil autentikasi.                                                                        |
| `channelEnvVars`                     | Tidak | `Record<string, string[]>`       | Metadata env saluran ringan yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk penyiapan saluran berbasis env atau permukaan autentikasi yang harus terlihat oleh helper startup/konfigurasi generik.                    |
| `providerAuthChoices`                | Tidak | `object[]`                       | Metadata pilihan autentikasi ringan untuk pemilih onboarding, resolusi penyedia pilihan, dan wiring flag CLI sederhana.                                                                                                                          |
| `activation`                         | Tidak | `object`                         | Metadata perencana aktivasi ringan untuk pemuatan yang dipicu oleh startup, penyedia, perintah, saluran, rute, dan kapabilitas. Hanya metadata; runtime Plugin tetap memiliki perilaku aktual.                                                  |
| `setup`                              | Tidak | `object`                         | Deskriptor penyiapan/onboarding ringan yang dapat diperiksa oleh permukaan penemuan dan penyiapan tanpa memuat runtime Plugin.                                                                                                                   |
| `qaRunners`                          | Tidak | `object[]`                       | Deskriptor runner QA ringan yang digunakan oleh host `openclaw qa` bersama sebelum runtime Plugin dimuat.                                                                                                                                        |
| `contracts`                          | Tidak | `object`                         | Snapshot kepemilikan kapabilitas statis untuk hook autentikasi eksternal, speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, web-fetch, pencarian web, dan kepemilikan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak | `Record<string, object>`         | Default pemahaman media ringan untuk id penyedia yang dideklarasikan di `contracts.mediaUnderstandingProviders`.                                                                                                                                 |
| `imageGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan gambar ringan untuk id penyedia yang dideklarasikan di `contracts.imageGenerationProviders`, termasuk alias autentikasi dan guard base-url milik penyedia.                                                       |
| `videoGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan video ringan untuk id penyedia yang dideklarasikan di `contracts.videoGenerationProviders`, termasuk alias autentikasi dan guard base-url milik penyedia.                                                        |
| `musicGenerationProviderMetadata`    | Tidak | `Record<string, object>`         | Metadata autentikasi pembuatan musik ringan untuk id penyedia yang dideklarasikan di `contracts.musicGenerationProviders`, termasuk alias autentikasi dan guard base-url milik penyedia.                                                        |
| `toolMetadata`                       | Tidak | `Record<string, object>`         | Metadata ketersediaan ringan untuk tool milik Plugin yang dideklarasikan di `contracts.tools`. Gunakan saat sebuah tool tidak boleh memuat runtime kecuali ada bukti konfigurasi, env, atau autentikasi.                                        |
| `channelConfigs`                     | Tidak | `Record<string, object>`         | Metadata konfigurasi saluran milik manifest yang digabungkan ke permukaan penemuan dan validasi sebelum runtime dimuat.                                                                                                                          |
| `skills`                             | Tidak | `string[]`                       | Direktori Skill yang akan dimuat, relatif terhadap root Plugin.                                                                                                                                                                                  |
| `name`                               | Tidak | `string`                         | Nama Plugin yang mudah dibaca manusia.                                                                                                                                                                                                          |
| `description`                        | Tidak       | `string`                         | Ringkasan singkat yang ditampilkan di permukaan Plugin.                                                                                                                                                                                             |
| `version`                            | Tidak       | `string`                         | Versi Plugin informatif.                                                                                                                                                                                                       |
| `uiHints`                            | Tidak       | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk bidang konfigurasi.                                                                                                                                                                   |

## Referensi metadata penyedia pembuatan

Kolom metadata penyedia pembuatan menjelaskan sinyal autentikasi statis untuk
penyedia yang dideklarasikan dalam daftar `contracts.*GenerationProviders` yang sesuai.
OpenClaw membaca kolom ini sebelum runtime penyedia dimuat sehingga alat inti dapat
memutuskan apakah penyedia pembuatan tersedia tanpa mengimpor setiap
Plugin penyedia.

Gunakan kolom ini hanya untuk fakta deklaratif yang murah. Transport, transformasi
permintaan, penyegaran token, validasi kredensial, dan perilaku pembuatan aktual
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

| Bidang          | Wajib | Tipe       | Maknanya                                                                                                                       |
| --------------- | ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Tidak | `string[]` | ID penyedia tambahan yang harus dihitung sebagai alias autentikasi statis untuk penyedia pembuatan.                           |
| `authProviders` | Tidak | `string[]` | ID penyedia yang profil autentikasi terkonfigurasinya harus dihitung sebagai autentikasi untuk penyedia pembuatan ini.        |
| `configSignals` | Tidak | `object[]` | Sinyal ketersediaan murah berbasis konfigurasi saja untuk penyedia lokal atau self-hosted yang dapat dikonfigurasi tanpa profil autentikasi atau variabel env. |
| `authSignals`   | Tidak | `object[]` | Sinyal autentikasi eksplisit. Jika ada, ini menggantikan kumpulan sinyal default dari ID penyedia, `aliases`, dan `authProviders`. |

Setiap entri `configSignals` mendukung:

| Bidang        | Wajib | Tipe       | Maknanya                                                                                                                                                                         |
| ------------- | ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ya    | `string`   | Path titik ke objek konfigurasi milik Plugin yang akan diperiksa, misalnya `plugins.entries.example.config`.                                                                     |
| `overlayPath` | Tidak | `string`   | Path titik di dalam konfigurasi root yang objeknya harus menimpa objek root sebelum mengevaluasi sinyal. Gunakan ini untuk konfigurasi khusus kapabilitas seperti `image`, `video`, atau `music`. |
| `required`    | Tidak | `string[]` | Path titik di dalam konfigurasi efektif yang harus memiliki nilai terkonfigurasi. String tidak boleh kosong; objek dan array tidak boleh kosong.                                |
| `requiredAny` | Tidak | `string[]` | Path titik di dalam konfigurasi efektif yang setidaknya salah satunya harus memiliki nilai terkonfigurasi.                                                                       |
| `mode`        | Tidak | `object`   | Guard mode string opsional di dalam konfigurasi efektif. Gunakan ini ketika ketersediaan berbasis konfigurasi saja hanya berlaku untuk satu mode.                                |

Setiap guard `mode` mendukung:

| Bidang       | Wajib | Tipe       | Maknanya                                                                       |
| ------------ | ----- | ---------- | ------------------------------------------------------------------------------ |
| `path`       | Tidak | `string`   | Path titik di dalam konfigurasi efektif. Default ke `mode`.                    |
| `default`    | Tidak | `string`   | Nilai mode yang digunakan ketika konfigurasi menghilangkan path.               |
| `allowed`    | Tidak | `string[]` | Jika ada, sinyal lolos hanya ketika mode efektif adalah salah satu nilai ini.  |
| `disallowed` | Tidak | `string[]` | Jika ada, sinyal gagal ketika mode efektif adalah salah satu nilai ini.        |

Setiap entri `authSignals` mendukung:

| Bidang           | Wajib | Tipe     | Maknanya                                                                                                                                                              |
| ---------------- | ----- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`       | Ya    | `string` | ID penyedia yang akan diperiksa dalam profil autentikasi terkonfigurasi.                                                                                              |
| `providerBaseUrl` | Tidak | `object` | Guard opsional yang membuat sinyal dihitung hanya ketika penyedia terkonfigurasi yang dirujuk menggunakan URL dasar yang diizinkan. Gunakan ini ketika alias autentikasi hanya valid untuk API tertentu. |

Setiap guard `providerBaseUrl` mendukung:

| Bidang            | Wajib | Tipe       | Maknanya                                                                                                                                       |
| ----------------- | ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ya    | `string`   | ID konfigurasi penyedia yang `baseUrl`-nya harus diperiksa.                                                                                    |
| `defaultBaseUrl`  | Tidak | `string`   | URL dasar yang diasumsikan ketika konfigurasi penyedia menghilangkan `baseUrl`.                                                               |
| `allowedBaseUrls` | Ya    | `string[]` | URL dasar yang diizinkan untuk sinyal autentikasi ini. Sinyal diabaikan ketika URL dasar terkonfigurasi atau default tidak cocok dengan salah satu nilai yang dinormalisasi ini. |

## Referensi metadata alat

`toolMetadata` menggunakan bentuk `configSignals` dan `authSignals` yang sama dengan
metadata penyedia pembuatan, dengan kunci berdasarkan nama alat. `contracts.tools` mendeklarasikan
kepemilikan. `toolMetadata` mendeklarasikan bukti ketersediaan murah sehingga OpenClaw dapat
menghindari impor runtime Plugin hanya agar factory alatnya mengembalikan `null`.

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
memuat Plugin pemilik ketika kontrak alat cocok dengan kebijakan. Untuk alat hot-path
yang factory-nya bergantung pada autentikasi/konfigurasi, penulis Plugin sebaiknya mendeklarasikan
`toolMetadata` alih-alih membuat inti mengimpor runtime untuk bertanya.

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau autentikasi.
OpenClaw membaca ini sebelum runtime penyedia dimuat.
Daftar penyiapan penyedia menggunakan pilihan manifes ini, pilihan penyiapan turunan deskriptor,
dan metadata katalog instal tanpa memuat runtime penyedia.

| Bidang                | Wajib | Tipe                                            | Maknanya                                                                                              |
| --------------------- | ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | Ya    | `string`                                        | ID penyedia tempat pilihan ini berada.                                                                |
| `method`              | Ya    | `string`                                        | ID metode autentikasi yang akan didispatch.                                                           |
| `choiceId`            | Ya    | `string`                                        | ID pilihan autentikasi stabil yang digunakan oleh alur onboarding dan CLI.                            |
| `choiceLabel`         | Tidak | `string`                                        | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw fallback ke `choiceId`.                 |
| `choiceHint`          | Tidak | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                   |
| `assistantPriority`   | Tidak | `number`                                        | Nilai lebih rendah diurutkan lebih awal di pemilih interaktif yang digerakkan asisten.                |
| `assistantVisibility` | Tidak | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.               |
| `deprecatedChoiceIds` | Tidak | `string[]`                                      | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                             |
| `groupId`             | Tidak | `string`                                        | ID grup opsional untuk mengelompokkan pilihan terkait.                                                |
| `groupLabel`          | Tidak | `string`                                        | Label yang terlihat oleh pengguna untuk grup tersebut.                                                |
| `groupHint`           | Tidak | `string`                                        | Teks bantuan singkat untuk grup.                                                                      |
| `optionKey`           | Tidak | `string`                                        | Kunci opsi internal untuk alur autentikasi satu-flag sederhana.                                       |
| `cliFlag`             | Tidak | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                        |
| `cliOption`           | Tidak | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Tidak | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                           |
| `onboardingScopes`    | Tidak | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default ke `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` saat plugin memiliki nama perintah runtime yang mungkin
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
| `kind`       | Tidak | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.     |
| `cliCommand` | Tidak | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.   |

## referensi activation

Gunakan `activation` saat plugin dapat mendeklarasikan dengan murah peristiwa control-plane mana
yang harus menyertakannya dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata planner, bukan API lifecycle. Ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode plugin sudah dieksekusi. Planner aktivasi menggunakan bidang-bidang ini untuk
mempersempit kandidat plugin sebelum kembali ke metadata kepemilikan manifes yang ada
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook.

Pilih metadata tersempit yang sudah mendeskripsikan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
saat bidang-bidang tersebut mengekspresikan relasinya. Gunakan `activation` untuk petunjuk
planner tambahan yang tidak dapat direpresentasikan oleh bidang kepemilikan tersebut.
Gunakan `cliBackends` tingkat atas untuk alias runtime CLI seperti `claude-cli`,
`codex-cli`, atau `google-gemini-cli`; `activation.onAgentHarnesses` hanya untuk
id harness agen tertanam yang belum memiliki bidang kepemilikan.

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan plugin yang lebih luas, sehingga
metadata aktivasi non-startup yang hilang biasanya hanya berdampak pada performa; hal itu
tidak semestinya mengubah kebenaran selama fallback kepemilikan manifes masih ada.

Setiap plugin harus menetapkan `activation.onStartup` secara sengaja. Setel ke `true`
hanya saat plugin harus berjalan selama startup Gateway. Setel ke `false` saat
plugin tidak aktif saat startup dan seharusnya dimuat hanya dari pemicu yang lebih sempit.
Menghilangkan `onStartup` tidak lagi memuat plugin saat startup secara implisit; gunakan metadata
aktivasi eksplisit untuk startup, channel, config, agent-harness, memory, atau
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

| Bidang             | Wajib | Tipe                                                 | Artinya                                                                                                                                                                                        |
| ------------------ | ----- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Tidak | `boolean`                                            | Aktivasi startup Gateway eksplisit. Setiap plugin harus menetapkannya. `true` mengimpor plugin selama startup; `false` membuatnya lazy saat startup kecuali pemicu lain yang cocok membutuhkan pemuatan. |
| `onProviders`      | Tidak | `string[]`                                           | Id provider yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                 |
| `onAgentHarnesses` | Tidak | `string[]`                                           | Id runtime harness agen tertanam yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan. Gunakan `cliBackends` tingkat atas untuk alias backend CLI.                                |
| `onCommands`       | Tidak | `string[]`                                           | Id perintah yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                 |
| `onChannels`       | Tidak | `string[]`                                           | Id channel yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                  |
| `onRoutes`         | Tidak | `string[]`                                           | Jenis rute yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                                                                                                                  |
| `onConfigPaths`    | Tidak | `string[]`                                           | Path config relatif terhadap root yang harus menyertakan plugin ini dalam rencana startup/pemuatan saat path ada dan tidak dinonaktifkan secara eksplisit.                                     |
| `onCapabilities`   | Tidak | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan aktivasi control-plane. Pilih bidang yang lebih sempit bila memungkinkan.                                                            |

Konsumen live saat ini:

- Perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor
  startup eksplisit
- perencanaan CLI yang dipicu perintah melakukan fallback ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` legacy
- perencanaan startup agent-runtime menggunakan `activation.onAgentHarnesses` untuk
  harness tertanam dan `cliBackends[]` tingkat atas untuk alias runtime CLI
- perencanaan setup/channel yang dipicu channel melakukan fallback ke kepemilikan
  `channels[]` legacy saat metadata aktivasi channel eksplisit tidak ada
- perencanaan plugin startup menggunakan `activation.onConfigPaths` untuk permukaan config
  root non-channel seperti blok `browser` milik plugin browser bawaan
- perencanaan setup/runtime yang dipicu provider melakukan fallback ke kepemilikan
  `providers[]` legacy dan `cliBackends[]` tingkat atas saat metadata aktivasi provider
  eksplisit tidak ada

Diagnostik planner dapat membedakan petunjuk aktivasi eksplisit dari fallback
kepemilikan manifes. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
planner menggunakan kepemilikan `commandAliases`. Label alasan ini untuk
diagnostik host dan pengujian; penulis plugin sebaiknya tetap mendeklarasikan metadata
yang paling baik mendeskripsikan kepemilikan.

## referensi qaRunners

Gunakan `qaRunners` saat plugin menyumbangkan satu atau beberapa runner transport di bawah
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

| Bidang        | Wajib | Tipe     | Artinya                                                           |
| ------------- | ----- | -------- | ----------------------------------------------------------------- |
| `commandName` | Ya    | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`. |
| `description` | Tidak | `string` | Teks bantuan fallback yang digunakan saat host bersama membutuhkan perintah stub. |

## referensi setup

Gunakan `setup` saat permukaan setup dan onboarding membutuhkan metadata milik plugin yang murah
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
alur control-plane/setup yang harus tetap metadata-only.

Saat ada, `setup.providers` dan `setup.cliBackends` adalah permukaan lookup
descriptor-first yang dipilih untuk penemuan setup. Jika deskriptor hanya
mempersempit kandidat plugin dan setup masih membutuhkan hook runtime saat setup yang lebih kaya,
setel `requiresRuntime: true` dan pertahankan `setup-api` sebagai
jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam lookup auth provider generik dan
env-var. `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas
selama jendela deprekasi, tetapi plugin non-bawaan yang masih menggunakannya
menerima diagnostik manifes. Plugin baru harus menempatkan metadata env setup/status
pada `setup.providers[].envVars`.

OpenClaw juga dapat memperoleh pilihan setup sederhana dari `setup.providers[].authMethods`
saat tidak ada entri setup, atau saat `setup.requiresRuntime: false`
menyatakan runtime setup tidak diperlukan. Entri `providerAuthChoices` eksplisit tetap
lebih dipilih untuk label kustom, flag CLI, cakupan onboarding, dan metadata asisten.

Setel `requiresRuntime: false` hanya saat deskriptor tersebut cukup untuk
permukaan setup. OpenClaw memperlakukan `false` eksplisit sebagai kontrak descriptor-only
dan tidak akan mengeksekusi `setup-api` atau `openclaw.setupEntry` untuk lookup setup. Jika
plugin descriptor-only masih mengirim salah satu entri runtime setup tersebut,
OpenClaw melaporkan diagnostik aditif dan terus mengabaikannya. `requiresRuntime`
yang dihilangkan mempertahankan perilaku fallback legacy sehingga plugin yang sudah ada yang menambahkan
deskriptor tanpa flag tersebut tidak rusak.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
plugin yang ditemukan. Kepemilikan ambigu gagal tertutup alih-alih memilih
pemenang dari urutan penemuan.

Saat runtime setup dieksekusi, diagnostik registry setup melaporkan drift deskriptor
jika `setup-api` mendaftarkan provider atau backend CLI yang tidak dideklarasikan
deskriptor manifes, atau jika sebuah deskriptor tidak memiliki pendaftaran runtime
yang cocok. Diagnostik ini bersifat aditif dan tidak menolak plugin legacy.

### referensi setup.providers

| Bidang         | Wajib | Tipe       | Artinya                                                                                         |
| -------------- | ----- | ---------- | ----------------------------------------------------------------------------------------------- |
| `id`           | Ya    | `string`   | Id provider yang diekspos selama setup atau onboarding. Jaga id yang dinormalisasi tetap unik secara global. |
| `authMethods`  | Tidak | `string[]` | Id metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.                     |
| `envVars`      | Tidak | `string[]` | Env vars yang dapat diperiksa permukaan setup/status generik sebelum runtime plugin dimuat.     |
| `authEvidence` | Tidak | `object[]` | Pemeriksaan bukti auth lokal murah untuk provider yang dapat mengautentikasi melalui marker non-rahasia. |

`authEvidence` ditujukan untuk penanda kredensial lokal milik penyedia yang dapat
diverifikasi tanpa memuat kode runtime. Pemeriksaan ini harus tetap ringan dan lokal:
tanpa panggilan jaringan, tanpa pembacaan keychain atau secret-manager, tanpa perintah shell, dan tanpa
probe API penyedia.

Entri bukti yang didukung:

| Kolom              | Wajib | Tipe       | Artinya                                                                                                           |
| ------------------ | ----- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`             | Ya    | `string`   | Saat ini `local-file-with-env`.                                                                                   |
| `fileEnvVar`       | Tidak | `string`   | Env var yang berisi path file kredensial eksplisit.                                                               |
| `fallbackPaths`    | Tidak | `string[]` | Path file kredensial lokal yang diperiksa saat `fileEnvVar` tidak ada atau kosong. Mendukung `${HOME}` dan `${APPDATA}`. |
| `requiresAnyEnv`   | Tidak | `string[]` | Setidaknya satu env var yang tercantum harus tidak kosong sebelum bukti valid.                                    |
| `requiresAllEnv`   | Tidak | `string[]` | Setiap env var yang tercantum harus tidak kosong sebelum bukti valid.                                             |
| `credentialMarker` | Ya    | `string`   | Penanda non-rahasia yang dikembalikan saat bukti ada.                                                             |
| `source`           | Tidak | `string`   | Label sumber yang terlihat oleh pengguna untuk output autentikasi/status.                                         |

### kolom setup

| Kolom              | Wajib | Tipe       | Artinya                                                                                                  |
| ------------------ | ----- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `providers`        | Tidak | `object[]` | Deskriptor setup penyedia yang diekspos selama setup dan onboarding.                                     |
| `cliBackends`      | Tidak | `string[]` | ID backend waktu setup yang digunakan untuk pencarian setup berbasis deskriptor terlebih dahulu. Jaga agar ID ternormalisasi unik secara global. |
| `configMigrations` | Tidak | `string[]` | ID migrasi config yang dimiliki oleh permukaan setup plugin ini.                                         |
| `requiresRuntime`  | Tidak | `boolean`  | Apakah setup masih membutuhkan eksekusi `setup-api` setelah pencarian deskriptor.                        |

## referensi uiHints

`uiHints` adalah peta dari nama kolom config ke petunjuk rendering kecil.

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

Setiap petunjuk kolom dapat menyertakan:

| Kolom         | Tipe       | Artinya                                  |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Label kolom yang terlihat oleh pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                    |
| `tags`        | `string[]` | Tag UI opsional.                         |
| `advanced`    | `boolean`  | Menandai kolom sebagai lanjutan.         |
| `sensitive`   | `boolean`  | Menandai kolom sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.   |

## referensi contracts

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

| Kolom                            | Tipe       | Artinya                                                               |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID factory ekstensi app-server Codex, saat ini `codex-app-server`.    |
| `agentToolResultMiddleware`      | `string[]` | ID runtime yang boleh didaftarkan plugin bawaan untuk middleware hasil tool. |
| `externalAuthProviders`          | `string[]` | ID penyedia yang hook profil autentikasi eksternalnya dimiliki plugin ini. |
| `speechProviders`                | `string[]` | ID penyedia speech yang dimiliki plugin ini.                          |
| `realtimeTranscriptionProviders` | `string[]` | ID penyedia transkripsi realtime yang dimiliki plugin ini.            |
| `realtimeVoiceProviders`         | `string[]` | ID penyedia suara realtime yang dimiliki plugin ini.                  |
| `memoryEmbeddingProviders`       | `string[]` | ID penyedia embedding memori yang dimiliki plugin ini.                |
| `mediaUnderstandingProviders`    | `string[]` | ID penyedia pemahaman media yang dimiliki plugin ini.                 |
| `imageGenerationProviders`       | `string[]` | ID penyedia pembuatan gambar yang dimiliki plugin ini.                |
| `videoGenerationProviders`       | `string[]` | ID penyedia pembuatan video yang dimiliki plugin ini.                 |
| `webFetchProviders`              | `string[]` | ID penyedia web-fetch yang dimiliki plugin ini.                       |
| `webSearchProviders`             | `string[]` | ID penyedia web-search yang dimiliki plugin ini.                      |
| `migrationProviders`             | `string[]` | ID penyedia impor yang dimiliki plugin ini untuk `openclaw migrate`.  |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki plugin ini.                              |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory ekstensi bawaan Codex
khusus app-server. Transformasi hasil tool bawaan sebaiknya
mendeklarasikan `contracts.agentToolResultMiddleware` dan mendaftar dengan
`api.registerAgentToolResultMiddleware(...)` sebagai gantinya. Plugin eksternal tidak dapat
mendaftarkan middleware hasil tool karena seam tersebut dapat menulis ulang output tool
berkepercayaan tinggi sebelum model melihatnya.

Pendaftaran runtime `api.registerTool(...)` harus cocok dengan `contracts.tools`.
Penemuan tool menggunakan daftar ini untuk hanya memuat runtime plugin yang dapat memiliki
tool yang diminta.

Plugin penyedia yang mengimplementasikan `resolveExternalAuthProfiles` sebaiknya mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi tersebut tetap berjalan
melalui fallback kompatibilitas yang sudah deprecated, tetapi fallback itu lebih lambat dan
akan dihapus setelah jendela migrasi.

Penyedia embedding memori bawaan sebaiknya mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap ID adapter yang mereka ekspos, termasuk
adapter bawaan seperti `local`. Path CLI mandiri menggunakan kontrak manifest ini
untuk hanya memuat plugin pemilik sebelum runtime Gateway penuh
mendaftarkan penyedia.

## referensi mediaUnderstandingProviderMetadata

Gunakan `mediaUnderstandingProviderMetadata` saat penyedia pemahaman media memiliki
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

Setiap entri penyedia dapat menyertakan:

| Kolom                  | Tipe                                | Artinya                                                                    |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Kapabilitas media yang diekspos oleh penyedia ini.                         |
| `defaultModels`        | `Record<string, string>`            | Default kapabilitas-ke-model yang digunakan saat config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka yang lebih rendah diurutkan lebih awal untuk fallback penyedia berbasis kredensial otomatis. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh penyedia.                          |

## referensi channelConfigs

Gunakan `channelConfigs` saat plugin channel membutuhkan metadata config ringan sebelum
runtime dimuat. Penemuan setup/status channel hanya-baca dapat menggunakan metadata ini
secara langsung untuk channel eksternal yang dikonfigurasi saat tidak ada entri setup, atau
saat `setup.requiresRuntime: false` menyatakan runtime setup tidak diperlukan.

`channelConfigs` adalah metadata manifest plugin, bukan bagian config pengguna tingkat atas
baru. Pengguna tetap mengonfigurasi instance channel di bawah `channels.<channel-id>`.
OpenClaw membaca metadata manifest untuk menentukan plugin mana yang memiliki channel
terkonfigurasi itu sebelum kode runtime plugin dieksekusi.

Untuk plugin channel, `configSchema` dan `channelConfigs` menjelaskan path yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin non-bawaan yang mendeklarasikan `channels[]` sebaiknya juga mendeklarasikan entri
`channelConfigs` yang cocok. Tanpanya, OpenClaw tetap dapat memuat plugin, tetapi
schema config cold-path, setup, dan permukaan Control UI tidak dapat mengetahui
bentuk opsi milik channel hingga runtime plugin dieksekusi.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` dan
`nativeSkillsAutoEnabled` dapat mendeklarasikan default `auto` statis untuk pemeriksaan config perintah
yang berjalan sebelum runtime channel dimuat. Channel bawaan juga dapat memublikasikan
default yang sama melalui `package.json#openclaw.channel.commands` bersama
metadata katalog channel lain yang dimiliki paket.

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

Setiap entri channel dapat menyertakan:

| Bidang        | Tipe                     | Artinya                                                                                                      |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | Skema JSON untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi saluran yang dideklarasikan.         |
| `uiHints`     | `Record<string, object>` | Label/placeholder/petunjuk sensitif UI opsional untuk bagian konfigurasi saluran tersebut.                  |
| `label`       | `string`                 | Label saluran yang digabungkan ke permukaan pemilih dan inspeksi saat metadata waktu jalan belum siap.      |
| `description` | `string`                 | Deskripsi saluran singkat untuk permukaan inspeksi dan katalog.                                             |
| `commands`    | `object`                 | Perintah native statis dan bawaan otomatis keahlian native untuk pemeriksaan konfigurasi pra-waktu jalan.   |
| `preferOver`  | `string[]`               | id plugin lama atau berprioritas lebih rendah yang harus dikalahkan saluran ini di permukaan pemilihan.     |

### Menggantikan plugin saluran lain

Gunakan `preferOver` ketika plugin Anda adalah pemilik yang dipilih untuk id saluran yang
juga dapat disediakan oleh plugin lain. Kasus umum mencakup id plugin yang diganti namanya,
plugin mandiri yang menggantikan plugin bawaan, atau fork terpelihara yang
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

Ketika `channels.chat` dikonfigurasi, OpenClaw mempertimbangkan id saluran dan
id plugin pilihan. Jika plugin berprioritas lebih rendah hanya dipilih karena
bersifat bawaan atau diaktifkan secara default, OpenClaw menonaktifkannya dalam
konfigurasi waktu jalan efektif sehingga satu plugin memiliki saluran dan alatnya. Pilihan pengguna
eksplisit tetap menang: jika pengguna secara eksplisit mengaktifkan kedua plugin, OpenClaw
mempertahankan pilihan tersebut dan melaporkan diagnostik saluran/alat duplikat alih-alih
mengubah kumpulan plugin yang diminta secara diam-diam.

Batasi `preferOver` hanya pada id plugin yang benar-benar dapat menyediakan saluran yang sama.
Ini bukan bidang prioritas umum dan tidak mengganti nama kunci konfigurasi pengguna.

## Referensi modelSupport

Gunakan `modelSupport` ketika OpenClaw harus menyimpulkan plugin penyedia Anda dari
id model singkat seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum waktu jalan plugin
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

| Bidang          | Tipe       | Artinya                                                                                 |
| --------------- | ---------- | --------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model singkat.                  |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model singkat setelah penghapusan sufiks profil. |

## Referensi modelCatalog

Gunakan `modelCatalog` ketika OpenClaw harus mengetahui metadata model penyedia sebelum
memuat waktu jalan plugin. Ini adalah sumber milik manifes untuk baris katalog tetap,
alias penyedia, aturan penekanan, dan mode penemuan. Penyegaran waktu jalan
tetap berada dalam kode waktu jalan penyedia, tetapi manifes memberi tahu inti kapan waktu jalan
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

| Bidang         | Tipe                                                     | Artinya                                                                                                            |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Baris katalog untuk id penyedia yang dimiliki plugin ini. Kunci juga harus muncul di `providers` tingkat atas.     |
| `aliases`      | `Record<string, object>`                                 | Alias penyedia yang harus dipecahkan ke penyedia yang dimiliki untuk perencanaan katalog atau penekanan.           |
| `suppressions` | `object[]`                                               | Baris model dari sumber lain yang ditekan plugin ini karena alasan khusus penyedia.                                |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog penyedia dapat dibaca dari metadata manifes, disegarkan ke cache, atau memerlukan waktu jalan.      |

`aliases` ikut serta dalam pencarian kepemilikan penyedia untuk perencanaan katalog model.
Target alias harus berupa penyedia tingkat atas yang dimiliki oleh plugin yang sama. Ketika daftar
yang difilter berdasarkan penyedia menggunakan alias, OpenClaw dapat membaca manifes pemilik dan
menerapkan penggantian API/URL dasar alias tanpa memuat waktu jalan penyedia.
Alias tidak memperluas daftar katalog tanpa filter; daftar luas hanya mengeluarkan baris
penyedia kanonis milik pemilik.

`suppressions` menggantikan hook waktu jalan penyedia lama `suppressBuiltInModel`.
Entri penekanan hanya dihormati ketika penyedia dimiliki oleh plugin atau
dideklarasikan sebagai kunci `modelCatalog.aliases` yang menargetkan penyedia milik pemilik. Hook
penekanan waktu jalan tidak lagi dipanggil selama resolusi model.

Bidang penyedia:

| Bidang    | Tipe                     | Artinya                                                                  |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | URL dasar default opsional untuk model dalam katalog penyedia ini.       |
| `api`     | `ModelApi`               | Adapter API default opsional untuk model dalam katalog penyedia ini.     |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog penyedia ini.          |
| `models`  | `object[]`               | Baris model wajib. Baris tanpa `id` diabaikan.                           |

Bidang model:

| Bidang          | Tipe                                                           | Artinya                                                                                 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | id model lokal penyedia, tanpa prefiks `provider/`.                                     |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                                 |
| `api`           | `ModelApi`                                                     | Penggantian API per model opsional.                                                     |
| `baseUrl`       | `string`                                                       | Penggantian URL dasar per model opsional.                                               |
| `headers`       | `Record<string, string>`                                       | Header statis per model opsional.                                                       |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalitas yang diterima model.                                                          |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku penalaran.                                             |
| `contextWindow` | `number`                                                       | Jendela konteks native penyedia.                                                        |
| `contextTokens` | `number`                                                       | Batas konteks waktu jalan efektif opsional ketika berbeda dari `contextWindow`.         |
| `maxTokens`     | `number`                                                       | Token keluaran maksimum jika diketahui.                                                 |
| `cost`          | `object`                                                       | Harga USD per juta token opsional, termasuk `tieredPricing` opsional.                   |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas konfigurasi model OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status daftar. Tekan hanya ketika baris sama sekali tidak boleh muncul.                 |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan dengan status non-tersedia.                            |
| `replaces`      | `string[]`                                                     | id model lokal penyedia lama yang digantikan model ini.                                 |
| `replacedBy`    | `string`                                                       | id model lokal penyedia pengganti untuk baris usang.                                    |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh pemilih dan filter.                                      |

Bidang penekanan:

| Bidang                     | Tipe       | Artinya                                                                                                      |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | id penyedia untuk baris hulu yang akan ditekan. Harus dimiliki plugin ini atau dideklarasikan sebagai alias milik pemilik. |
| `model`                    | `string`   | id model lokal penyedia yang akan ditekan.                                                                   |
| `reason`                   | `string`   | Pesan opsional yang ditampilkan ketika baris yang ditekan diminta secara langsung.                           |
| `when.baseUrlHosts`        | `string[]` | Daftar opsional host URL dasar penyedia efektif yang wajib ada sebelum penekanan berlaku.                    |
| `when.providerConfigApiIn` | `string[]` | Daftar opsional nilai `api` konfigurasi penyedia yang persis wajib ada sebelum penekanan berlaku.            |

Jangan letakkan data khusus waktu eksekusi di `modelCatalog`. Gunakan `static` hanya saat
baris manifes cukup lengkap agar permukaan daftar yang difilter penyedia dan pemilih dapat melewati
penemuan registri/waktu eksekusi. Gunakan `refreshable` saat baris manifes berguna sebagai
benih atau pelengkap yang dapat didaftarkan tetapi penyegaran/cache dapat menambahkan lebih banyak baris nanti;
baris yang dapat disegarkan tidak bersifat otoritatif sendiri. Gunakan `runtime` saat OpenClaw
harus memuat waktu eksekusi penyedia untuk mengetahui daftarnya.

## Referensi modelIdNormalization

Gunakan `modelIdNormalization` untuk pembersihan ID model murah milik penyedia yang harus
terjadi sebelum waktu eksekusi penyedia dimuat. Ini menjaga alias seperti nama model pendek,
ID warisan lokal penyedia, dan aturan awalan proksi tetap berada di manifes Plugin pemiliknya
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

Kolom penyedia:

| Kolom                                | Tipe                    | Artinya                                                                                   |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias ID model persis yang tidak peka huruf besar/kecil. Nilai dikembalikan seperti ditulis. |
| `stripPrefixes`                      | `string[]`              | Awalan untuk dihapus sebelum pencarian alias, berguna untuk duplikasi penyedia/model warisan. |
| `prefixWhenBare`                     | `string`                | Awalan untuk ditambahkan saat ID model yang dinormalisasi belum berisi `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Aturan awalan ID polos bersyarat setelah pencarian alias, dikunci oleh `modelPrefix` dan `prefix`. |

## Referensi providerEndpoints

Gunakan `providerEndpoints` untuk klasifikasi endpoint yang harus diketahui kebijakan permintaan
generik sebelum waktu eksekusi penyedia dimuat. Inti tetap memiliki makna setiap
`endpointClass`; manifes Plugin memiliki metadata host dan URL dasar.

Kolom endpoint:

| Kolom                          | Tipe       | Artinya                                                                                       |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Kelas endpoint inti yang dikenal, seperti `openrouter`, `moonshot-native`, atau `google-vertex`. |
| `hosts`                        | `string[]` | Nama host persis yang dipetakan ke kelas endpoint.                                            |
| `hostSuffixes`                 | `string[]` | Akhiran host yang dipetakan ke kelas endpoint. Awali dengan `.` untuk pencocokan khusus akhiran domain. |
| `baseUrls`                     | `string[]` | URL dasar HTTP(S) ternormalisasi persis yang dipetakan ke kelas endpoint.                     |
| `googleVertexRegion`           | `string`   | Wilayah Google Vertex statis untuk host global persis.                                        |
| `googleVertexRegionHostSuffix` | `string`   | Akhiran yang dihapus dari host yang cocok untuk mengekspos awalan wilayah Google Vertex.      |

## Referensi providerRequest

Gunakan `providerRequest` untuk metadata kompatibilitas permintaan murah yang dibutuhkan kebijakan
permintaan generik tanpa memuat waktu eksekusi penyedia. Simpan penulisan ulang muatan khusus perilaku
di kait waktu eksekusi penyedia atau pembantu bersama keluarga penyedia.

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

| Kolom                | Tipe         | Artinya                                                                               |
| -------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `family`             | `string`     | Label keluarga penyedia yang digunakan oleh keputusan kompatibilitas permintaan generik dan diagnostik. |
| `compatibilityFamily` | `"moonshot"` | Keranjang kompatibilitas keluarga penyedia opsional untuk pembantu permintaan bersama. |
| `openAICompletions`  | `object`     | Bendera permintaan penyelesaian yang kompatibel dengan OpenAI, saat ini `supportsStreamingUsage`. |

## Referensi modelPricing

Gunakan `modelPricing` saat penyedia membutuhkan perilaku harga bidang kontrol sebelum
waktu eksekusi dimuat. Cache harga Gateway membaca metadata ini tanpa mengimpor
kode waktu eksekusi penyedia.

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

| Kolom       | Tipe              | Artinya                                                                                         |
| ----------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `external`  | `boolean`         | Tetapkan `false` untuk penyedia lokal/dihosting sendiri yang tidak boleh pernah mengambil harga OpenRouter atau LiteLLM. |
| `openRouter` | `false \| object` | Pemetaan pencarian harga OpenRouter. `false` menonaktifkan pencarian OpenRouter untuk penyedia ini. |
| `liteLLM`   | `false \| object` | Pemetaan pencarian harga LiteLLM. `false` menonaktifkan pencarian LiteLLM untuk penyedia ini.      |

Kolom sumber:

| Kolom                     | Tipe               | Artinya                                                                                                  |
| ------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `provider`                | `string`           | ID penyedia katalog eksternal saat berbeda dari ID penyedia OpenClaw, misalnya `z-ai` untuk penyedia `zai`. |
| `passthroughProviderModel` | `boolean`          | Perlakukan ID model yang berisi garis miring sebagai referensi penyedia/model bersarang, berguna untuk penyedia proksi seperti OpenRouter. |
| `modelIdTransforms`       | `"version-dots"[]` | Varian ID model katalog eksternal tambahan. `version-dots` mencoba ID versi bertitik seperti `claude-opus-4.6`. |

### Indeks Penyedia OpenClaw

Indeks Penyedia OpenClaw adalah metadata pratinjau milik OpenClaw untuk penyedia
yang Plugin-nya mungkin belum terpasang. Ini bukan bagian dari manifes Plugin.
Manifes Plugin tetap menjadi otoritas Plugin terpasang. Indeks Penyedia adalah
kontrak cadangan internal yang akan digunakan permukaan penyedia yang dapat dipasang dan pemilih model
pra-pemasangan di masa mendatang saat Plugin penyedia belum terpasang.

Urutan otoritas katalog:

1. Konfigurasi pengguna.
2. `modelCatalog` manifes Plugin terpasang.
3. Cache katalog model dari penyegaran eksplisit.
4. Baris pratinjau Indeks Penyedia OpenClaw.

Indeks Penyedia tidak boleh berisi rahasia, status aktif, kait waktu eksekusi, atau
data model khusus akun langsung. Katalog pratinjaunya menggunakan bentuk baris penyedia
`modelCatalog` yang sama seperti manifes Plugin, tetapi harus tetap dibatasi
pada metadata tampilan stabil kecuali kolom adaptor waktu eksekusi seperti `api`,
`baseUrl`, harga, atau bendera kompatibilitas sengaja dijaga selaras dengan
manifes Plugin terpasang. Penyedia dengan penemuan `/models` langsung harus
menulis baris yang disegarkan melalui jalur cache katalog model eksplisit alih-alih
membuat proses daftar normal atau onboarding memanggil API penyedia.

Entri Indeks Penyedia juga dapat membawa metadata Plugin yang dapat dipasang untuk penyedia
yang Plugin-nya telah dipindahkan keluar dari inti atau belum terpasang. Metadata ini
mencerminkan pola katalog kanal: nama paket, spesifikasi pemasangan npm,
integritas yang diharapkan, dan label pilihan autentikasi murah sudah cukup untuk menampilkan
opsi penyiapan yang dapat dipasang. Setelah Plugin terpasang, manifesnya menang dan
entri Indeks Penyedia diabaikan untuk penyedia tersebut.

Kunci kapabilitas tingkat atas warisan sudah usang. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifes normal tidak lagi memperlakukan kolom tingkat atas tersebut sebagai kepemilikan
kapabilitas.

## Manifes versus package.json

Kedua berkas ini menjalankan tugas yang berbeda:

| Berkas                 | Gunakan untuk                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Penemuan, validasi konfigurasi, metadata pilihan autentikasi, dan petunjuk UI yang harus ada sebelum kode Plugin berjalan        |
| `package.json`         | Metadata npm, pemasangan dependensi, dan blok `openclaw` yang digunakan untuk titik masuk, gating pemasangan, penyiapan, atau metadata katalog |

Jika Anda tidak yakin di mana sebuah metadata seharusnya berada, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode Plugin, letakkan di `openclaw.plugin.json`
- jika itu tentang pengemasan, berkas entri, atau perilaku pemasangan npm, letakkan di `package.json`

### Kolom package.json yang memengaruhi penemuan

Beberapa metadata Plugin pra-waktu eksekusi sengaja berada di `package.json` di bawah blok
`openclaw` alih-alih `openclaw.plugin.json`.

Contoh penting:

| Bidang                                                            | Artinya                                                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native. Harus tetap berada di dalam direktori paket plugin.                                                                                       |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk paket yang terpasang. Harus tetap berada di dalam direktori paket plugin.                                           |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus penyiapan yang digunakan selama onboarding, startup kanal tertunda, dan penemuan status kanal/SecretRef baca-saja. Harus tetap berada di dalam direktori paket plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint penyiapan JavaScript hasil build untuk paket yang terpasang. Memerlukan `setupEntry`, harus ada, dan harus tetap berada di dalam direktori paket plugin. |
| `openclaw.channel`                                                | Metadata katalog kanal yang murah seperti label, jalur docs, alias, dan salinan pemilihan.                                                                                          |
| `openclaw.channel.commands`                                       | Metadata default otomatis perintah native dan skill native statis yang digunakan oleh permukaan config, audit, dan daftar perintah sebelum runtime kanal dimuat.                    |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa status-terkonfigurasi ringan yang dapat menjawab "apakah penyiapan khusus-env sudah ada?" tanpa memuat runtime kanal penuh.                                      |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa autentikasi-tersimpan ringan yang dapat menjawab "apakah ada yang sudah masuk?" tanpa memuat runtime kanal penuh.                                                |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk pemasangan/pembaruan untuk plugin bawaan dan plugin yang dipublikasikan secara eksternal.                                                                                  |
| `openclaw.install.defaultChoice`                                  | Jalur pemasangan yang disukai ketika beberapa sumber pemasangan tersedia.                                                                                                           |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22` atau `>=2026.5.1-beta.1`.                                                          |
| `openclaw.install.expectedIntegrity`                              | String integritas dist npm yang diharapkan seperti `sha512-...`; alur pemasangan dan pembaruan memverifikasi artefak yang diambil terhadap string ini.                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan pemasangan ulang plugin bawaan yang sempit ketika config tidak valid.                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan kanal khusus penyiapan dimuat sebelum plugin kanal penuh selama startup.                                                                                     |

Metadata manifest menentukan pilihan penyedia/kanal/penyiapan mana yang muncul di
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan plugin tersebut ketika pengguna memilih salah satu dari
pilihan itu. Jangan pindahkan petunjuk pemasangan ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama pemasangan dan pemuatan
registri manifest untuk sumber plugin non-bawaan. Nilai tidak valid ditolak;
nilai yang lebih baru tetapi valid melewati plugin eksternal pada host lama. Sumber
plugin bawaan diasumsikan diversi bersama dengan checkout host.

Penyematan versi npm persis sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
sebaiknya memasangkan spesifikasi persis dengan `expectedIntegrity` agar alur pembaruan gagal
tertutup jika artefak npm yang diambil tidak lagi cocok dengan rilis yang disematkan.
Onboarding interaktif tetap menawarkan spesifikasi npm registri tepercaya, termasuk
nama paket telanjang dan dist-tag, demi kompatibilitas. Diagnostik katalog dapat
membedakan sumber persis, mengambang, disematkan-integritas, integritas-hilang, ketidakcocokan-nama-paket,
dan pilihan-default tidak valid. Diagnostik juga memperingatkan ketika
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat disematkannya.
Ketika `expectedIntegrity` ada,
alur pemasangan/pembaruan memberlakukannya; ketika dihilangkan, resolusi registri
direkam tanpa sematan integritas.

Plugin kanal sebaiknya menyediakan `openclaw.setupEntry` ketika status, daftar kanal,
atau pemindaian SecretRef perlu mengidentifikasi akun yang dikonfigurasi tanpa memuat runtime
penuh. Entri penyiapan sebaiknya mengekspos metadata kanal serta adapter config,
status, dan rahasia yang aman untuk penyiapan; simpan klien jaringan, listener Gateway, dan
runtime transport di entrypoint ekstensi utama.

Bidang entrypoint runtime tidak menggantikan pemeriksaan batas paket untuk bidang
entrypoint sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
jalur `openclaw.extensions` yang keluar batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja sempit. Ini tidak
membuat sembarang config rusak dapat dipasang. Saat ini ini hanya mengizinkan alur pemasangan
memulihkan kegagalan upgrade plugin bawaan usang tertentu, seperti
jalur plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin bawaan yang sama.
Kesalahan config yang tidak terkait tetap memblokir pemasangan dan mengarahkan operator
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

Gunakan ini ketika alur penyiapan, doctor, status, atau kehadiran baca-saja memerlukan probe autentikasi
ya/tidak yang murah sebelum plugin kanal penuh dimuat. Status autentikasi tersimpan bukan
status kanal terkonfigurasi: jangan gunakan metadata ini untuk mengaktifkan plugin secara otomatis,
memperbaiki dependensi runtime, atau memutuskan apakah runtime kanal harus dimuat.
Ekspor target sebaiknya berupa fungsi kecil yang hanya membaca status tersimpan; jangan
merutekannya melalui barrel runtime kanal penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan terkonfigurasi khusus-env
yang murah:

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

Gunakan ini ketika kanal dapat menjawab status-terkonfigurasi dari env atau input kecil
non-runtime lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime
kanal nyata, simpan logika itu di hook plugin `config.hasConfiguredState`
sebagai gantinya.

## Prioritas penemuan (id plugin duplikat)

OpenClaw menemukan plugin dari beberapa root (bawaan, pemasangan global, workspace, jalur pilihan config eksplisit). Jika dua penemuan berbagi `id` yang sama, hanya manifest dengan **prioritas tertinggi** yang dipertahankan; duplikat berprioritas lebih rendah dibuang alih-alih dimuat berdampingan dengannya.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih config** — jalur yang disematkan secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — plugin yang dikirim bersama OpenClaw
3. **Pemasangan global** — plugin yang dipasang ke root plugin global OpenClaw
4. **Workspace** — plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan bercabang atau usang dari plugin bawaan yang berada di workspace tidak akan menutupi build bawaan.
- Untuk benar-benar mengganti plugin bawaan dengan plugin lokal, sematkan melalui `plugins.entries.<id>` agar menang berdasarkan prioritas, bukan mengandalkan penemuan workspace.
- Pembuangan duplikat dicatat agar diagnostik Doctor dan startup dapat menunjuk ke salinan yang dibuang.
- Penggantian duplikat yang dipilih config dirumuskan sebagai penggantian eksplisit dalam diagnostik, tetapi tetap memperingatkan agar fork usang dan bayangan tidak sengaja tetap terlihat.

## Persyaratan JSON Schema

- **Setiap plugin harus mengirimkan JSON Schema**, meskipun tidak menerima config.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi pada waktu baca/tulis config, bukan pada runtime.
- Saat memperluas atau mem-fork plugin bawaan dengan kunci config baru, perbarui `configSchema` `openclaw.plugin.json` plugin tersebut pada saat yang sama. Skema plugin bawaan bersifat ketat, jadi menambahkan `plugins.entries.<id>.config.myNewKey` dalam config pengguna tanpa menambahkan `myNewKey` ke `configSchema.properties` akan ditolak sebelum runtime plugin dimuat.

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

- Kunci `channels.*` yang tidak dikenal adalah **kesalahan**, kecuali id kanal dideklarasikan oleh
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk ke id plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **kesalahan**.
- Jika plugin terpasang tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan kesalahan plugin.
- Jika config plugin ada tetapi plugin **dinonaktifkan**, config dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifest **wajib untuk Plugin OpenClaw native**, termasuk pemuatan dari sistem berkas lokal. Runtime tetap memuat modul Plugin secara terpisah; manifest hanya untuk penemuan + validasi.
- Manifest native diuraikan dengan JSON5, jadi komentar, koma di akhir, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya bidang manifest yang terdokumentasi yang dibaca oleh pemuat manifest. Hindari kunci tingkat atas kustom.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan ketika Plugin tidak membutuhkannya.
- `providerDiscoveryEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog provider statis atau deskriptor penemuan yang sempit, bukan eksekusi saat permintaan.
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Deklarasikan jenis Plugin eksklusif dalam manifest ini. `OpenClawPluginDefinition.kind` pada entri runtime sudah usang dan tetap ada hanya sebagai fallback kompatibilitas untuk Plugin lama.
- Metadata variabel lingkungan (`setup.providers[].envVars`, `providerAuthEnvVars` yang sudah usang, dan `channelEnvVars`) hanya deklaratif. Status, audit, validasi pengiriman Cron, dan permukaan baca-saja lainnya tetap menerapkan kebijakan kepercayaan Plugin dan aktivasi efektif sebelum memperlakukan variabel lingkungan sebagai sudah dikonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode provider, lihat [hook runtime Provider](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan daftar izin manajer paket apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

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
